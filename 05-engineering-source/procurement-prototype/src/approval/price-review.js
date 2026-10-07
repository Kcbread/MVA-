// approval/price-review: authoritative source; see docs/module-map.md.
import {
  priceReviewAnalysisDomIds,
  roleReviewRows
} from "./analysis-scope.js";
import {
  renderPriceReviewCostDashboard,
  renderPriceReviewItemUnitMatrix,
  renderPriceReviewStationMatrix,
  setApprovalQuantityDashboardScopeLabel,
  updatePriceReviewAnalysisScopeLabel
} from "./analysis-view.js";
import {
  managerAuditTimelineHtml
} from "./audit-view.js";
import {
  approvalReviewConfigForRole,
  updateApprovalReviewState
} from "./navigation.js";
import {
  priceReviewDetailScopeForTab,
  syncPriceReviewDetailTitle
} from "./quantity-scope.js";
import {
  managerAffectedPhasesText,
  managerQueueNextStep,
  pendingWorkActionButtons,
  pendingWorkIdentityHtml,
  priceReviewApprovalQuantityActions,
  renderApprovalQuantityRowPicker
} from "./queue-view.js";
import {
  availablePriceReviewQueues,
  ensureCurrentPriceReviewQueue,
  priceReviewEmptyState,
  priceReviewQueueMeta,
  priceReviewQueueRows,
  renderPriceReviewWorkspaceBanner
} from "./queues.js";
import {
  approvalQuantityReviewTab,
  approvalViewportState,
  replaceSelectedPriceReviewRequestIdBinding,
  selectedPriceReviewRequestId
} from "./state.js";
import {
  approvalPipelineStatus,
  approvalPipelineTitle,
  isDeptDriSubmissionPending,
  priceReviewPendingOwner,
  reviewStatusForRole
} from "./status.js";
import {
  nextApprovalSelection
} from "./viewport.js";
import {
  formatMoneyFromVnd,
  money
} from "../cost/currency.js";
import {
  managerQuantityColumnCount
} from "../cost/matrix-data.js";
import {
  totalQty
} from "../demand/quantity.js";
import {
  needDateForRow
} from "../demand/request-fields.js";
import {
  requests
} from "../demand/state.js";
import {
  approvalWorkbenchModule,
  roleQueueConfigModule
} from "../infrastructure/module-adapters.js";
import {
  warehouseInventoryId,
  warehouseOwnerForTransaction,
  warehouseOwnerLabel,
  warehousePendingStatusForOwner,
  warehouseSourceLabel,
  warehouseTargetLabel,
  warehouseTransactionQty,
  warehouseTransactionStatus
} from "../inventory/warehouse.js";
import {
  itemDetail,
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  syncProjectStatusScopeFromRow
} from "../progress/dashboard.js";
import {
  activeProjectContext,
  projectContextRowsForProject,
  syncProjectContextFromRow
} from "../projects/review-context.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  detailSummaryGridHtml
} from "../shared/detail-view.js";
import {
  clearNodeContent
} from "../shared/dom.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  syncPriceReviewWorkspaceUi
} from "../shell/navigation.js";
import {
  currentPriceReviewQueue,
  currentPriceReviewTab,
  replaceCurrentPriceReviewTabBinding
} from "../shell/state.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";
import {
  COST_MANAGER_AUTH_APPROVED
} from "../workflow/status-constants.js";
import {
  latestRequestActivityTime
} from "../workflow/timeline.js";

// @legacy-unit 1764 22556
export function priceReviewPendingRowsForRole() {
  return availablePriceReviewQueues().flatMap((queue) => queue.rows);
}
// @end-legacy-unit 1764

// @legacy-unit 1765 22560
export function priceReviewHistoryRows() {
  return requests.filter((row) => row.deptDriReviewStatus || row.priceDecisionStatus || row.driApprovedAt || row.projectDriApprovedAt || row.priceEscalationRejectedAt)
    .sort((left, right) => latestRequestActivityTime(right) - latestRequestActivityTime(left));
}
// @end-legacy-unit 1765

// @legacy-unit 1766 22565
export function priceVarianceLabel(row) {
  if (row.priceDeltaUsd === null || row.priceDeltaUsd === undefined || Number.isNaN(Number(row.priceDeltaUsd))) return "-";
  return `${Number(row.priceDeltaUsd).toFixed(2)} USD / threshold ${Number(row.priceThresholdUsd || 0.4).toFixed(2)} USD`;
}
// @end-legacy-unit 1766

// @legacy-unit 1767 22570
export function syncSelectedPriceReviewRequest(rows = priceReviewQueueRows(), preferredId = selectedPriceReviewRequestId) {
  replaceSelectedPriceReviewRequestIdBinding(nextApprovalSelection(rows, approvalViewportState.priceReview, preferredId));
  updateApprovalReviewState(currentRole, { selectedRowId: selectedPriceReviewRequestId || "" });
}
// @end-legacy-unit 1767

// @legacy-unit 1768 22575
export function syncPriceReviewDecisionSelection(requestId = selectedPriceReviewRequestId) {
  const rows = roleReviewRows(currentRole);
  syncSelectedPriceReviewRequest(rows, requestId);
  const selectedRow = rows.find((row) => row.id === selectedPriceReviewRequestId)
    || requests.find((row) => row.id === requestId)
    || null;
  syncProjectContextFromRow("inline", selectedRow);
}
// @end-legacy-unit 1768

// @legacy-unit 1769 22584
export function syncPriceReviewSelectionMarkers(requestId = selectedPriceReviewRequestId) {
  document.querySelectorAll("[data-price-review-select], [data-price-review-select-row], [data-price-review-select-cell]").forEach((node) => {
    const nodeId = node.dataset.priceReviewSelect || node.dataset.priceReviewSelectRow || node.dataset.priceReviewSelectCell || "";
    const active = !!requestId && nodeId === requestId;
    if (node.classList.contains("approval-quantity-row-chip")) {
      node.classList.toggle("active", active);
      node.setAttribute("aria-selected", active ? "true" : "false");
    }
    if (node.matches("tr")) node.classList.toggle("active-row", active);
  });
}
// @end-legacy-unit 1769

// @legacy-unit 1770 22596
export function isPriceReviewStockRow(row) {
  return row?.workbenchType === "stockCarryover";
}
// @end-legacy-unit 1770

// @legacy-unit 1771 22600
export function priceReviewActionCell(row) {
  if (!reviewStatusForRole(row, currentRole).actionable) return pendingWorkActionButtons();
  if (isPriceReviewStockRow(row)) {
    return pendingWorkActionButtons([
      `<button class="mini approve" data-warehouse-candidate-lock="${row.id}">Approved</button>`,
      `<button class="mini reject" data-warehouse-candidate-reject="${row.id}">Denied</button>`,
      `<button class="mini return" data-warehouse-candidate-reject="${row.id}">Revise</button>`,
    ]);
  }
  return pendingWorkActionButtons([
    `<button class="mini approve" data-price-review-decision="${row.id}" data-price-review-action="approve">Approved</button>`,
    `<button class="mini reject" data-price-review-decision="${row.id}" data-price-review-action="deny">Denied</button>`,
    `<button class="mini return" data-price-review-decision="${row.id}" data-price-review-action="revise">Revise</button>`,
  ]);
}
// @end-legacy-unit 1771

// @legacy-unit 1772 22616
export function renderPriceReviewDetail(row) {
  if (!row) {
    return `
      <div class="empty-state pending-work-empty">
        Select a review row to see price evidence, routing context, and the next decision.
      </div>`;
  }
  if (isPriceReviewStockRow(row)) {
    const summary = detailSummaryGridHtml([
      ["Queue", "Unit Stock Review", warehousePendingStatusForOwner(warehouseOwnerForTransaction(row))],
      ["Item", row.item || "-", row.spec || "-"],
      ["Target Scope", warehouseTargetLabel(row), row.targetRequestId || "-"],
      ["Source Scope", warehouseSourceLabel(row), row.sourceRequestId || "-"],
      ["Candidate Qty", warehouseTransactionQty(row), row.createdAt ? compactDateTime(row.createdAt) : "-"],
      ["Reason", row.reason || "-", warehouseOwnerLabel(row)],
      ["Current Stage", "Warehouse evidence", "Decision does not change requester routing ownership"],
    ]);
    return `
      <section class="pending-work-detail-card">
        <div class="panel-title section-head-tight">
          <div>
            <h4>${htmlText(row.item || "Stock Candidate")}</h4>
            <p class="panel-subcopy">${htmlText(row.spec || "Review unit-owned warehouse evidence, then approve or reject the stock-use candidate.")}</p>
          </div>
          <span class="status-pill ${statusClass(warehouseTransactionStatus(row))}">${warehouseTransactionStatus(row)}</span>
        </div>
        <div class="pending-work-detail-actions">
          ${priceReviewActionCell(row)}
          ${itemDetailButton("warehouse", warehouseInventoryId({ month: row.month, item: row.item, spec: row.spec }))}
        </div>
        ${summary}
      </section>`;
  }
  const isSubmission = isDeptDriSubmissionPending(row);
  const summary = detailSummaryGridHtml([
    ["Request ID", row.id, row.project],
    ["Current Queue", isSubmission ? "Submission Review" : currentRole === "projectDri" ? "Budget Exception Approval" : "Price Exception Review", priceReviewPendingOwner(row)],
    ["Need Date", needDateForRow(row) || "-", row.requiredDeliveryDate || "No required delivery date"],
    ["History Price", isSubmission ? "Not quoted yet" : row.historyUnitPrice ? money(row.historyUnitPrice) : "No history", row.priceThresholdCategory || "Need classification"],
    ["Quote Price", isSubmission ? "Pending OM quote" : row.quoteUnitPrice ? money(row.quoteUnitPrice) : "-", isSubmission ? "Waiting OM quote" : priceVarianceLabel(row)],
    ["Decision Risk", row.estimateVarianceStatus || row.priceApprovalStatus || "-", row.estimateVarianceReason || row.priceDecisionReason || row.deptDriReviewRejectReason || "No review reason recorded"],
    ["Requester Estimate", row.estimatedUnitPrice ? formatMoneyFromVnd(row.estimatedUnitPrice) : "-", row.requesterReason || row.useCase || "-"],
    ["Current Stage", managerQueueNextStep(row), row.nextStep || "Workflow status"],
  ]);
  return `
    <section class="pending-work-detail-card">
      <div class="panel-title section-head-tight">
        <div>
          <h4>${htmlText(row.name || "Selected Review")}</h4>
          <p class="panel-subcopy">${htmlText((userVisibleItemDetail(row) || itemDetail(row) || "Review the quote context, then approve or reject from this detail panel."))}</p>
        </div>
        <span class="status-pill ${statusClass(priceReviewPendingOwner(row))}">${priceReviewPendingOwner(row)}</span>
      </div>
      <div class="pending-work-detail-actions">
        ${priceReviewActionCell(row)}
        ${itemDetailButton("request", row.id)}
      </div>
      ${summary}
      <section class="detail-card-section">
        <h4>Timeline / Evidence</h4>
        ${managerAuditTimelineHtml(row)}
      </section>
    </section>`;
}
// @end-legacy-unit 1772

// @legacy-unit 1773 22681
export function renderPriceReviewExcelIdentityCell(row) {
  const isStock = isPriceReviewStockRow(row);
  const itemName = row.name || row.item || "-";
  const specText = isStock ? (row.spec || "-") : (userVisibleItemDetail(row) || itemDetail(row) || "-");
  const requestText = isStock ? (row.targetRequestId || row.id || "-") : (row.id || "-");
  const queueText = isStock ? "Unit Stock" : (isDeptDriSubmissionPending(row) ? "Submission" : "Price Exception");
  return `
    <div class="identity-block identity-block--excel">
      <span class="identity-primary">${htmlText(itemName)}</span>
      <span class="identity-secondary">${htmlText(specText)}</span>
      <span class="identity-tertiary">${htmlText(`${requestText} · ${queueText}`)}</span>
    </div>`;
}
// @end-legacy-unit 1773

// @legacy-unit 1774 22695
export function renderPriceReviewExcelContextCell(row) {
  if (isPriceReviewStockRow(row)) {
    return `
      <div class="excel-cell-stack">
        <strong>${htmlText(warehouseTargetLabel(row))}</strong>
        <span>${htmlText(`From ${warehouseSourceLabel(row)}`)}</span>
      </div>`;
  }
  return `
    <div class="excel-cell-stack">
      <strong>${htmlText(row.project || "-")}</strong>
      <span>${htmlText(row.requestLine || "Line 1")}</span>
    </div>`;
}
// @end-legacy-unit 1774

// @legacy-unit 1775 22710
export function renderPriceReviewExcelDetailCell(row) {
  return `
    <div class="excel-cell-stack">
      ${isPriceReviewStockRow(row) ? itemDetailButton("warehouse", warehouseInventoryId({ month: row.month, item: row.item, spec: row.spec })) : itemDetailButton("request", row.id)}
    </div>`;
}
// @end-legacy-unit 1775

// @legacy-unit 1776 22717
export function renderPriceReviewExcelQtyCell(row) {
  if (isPriceReviewStockRow(row)) {
    return `
      <div class="excel-cell-stack">
        <strong>${htmlText(`${warehouseTransactionQty(row)} qty`)}</strong>
        <span>${htmlText(row.targetStage || "-")}</span>
      </div>`;
  }
  return `
    <div class="excel-cell-stack">
      <strong>${htmlText(isDeptDriSubmissionPending(row) ? "Waiting quote" : (row.quoteUnitPrice ? money(row.quoteUnitPrice) : "-"))}</strong>
      <span>${htmlText(isDeptDriSubmissionPending(row) ? "Quote pending" : (row.quoteQty ? `${row.quoteQty} qty` : "Quoted row"))}</span>
    </div>`;
}
// @end-legacy-unit 1776

// @legacy-unit 1777 22732
export function renderPriceReviewExcelHistoryCell(row) {
  if (isPriceReviewStockRow(row)) {
    return `
      <div class="excel-cell-stack">
        <strong>${htmlText("Stock evidence")}</strong>
        <span>${htmlText(warehouseSourceLabel(row))}</span>
      </div>`;
  }
  return `
    <div class="excel-cell-stack">
      <strong>${htmlText(isDeptDriSubmissionPending(row) ? "Submission" : (row.historyUnitPrice ? money(row.historyUnitPrice) : "No hist."))}</strong>
      <span>${htmlText(isDeptDriSubmissionPending(row) ? "Before OM quote" : priceVarianceLabel(row))}</span>
    </div>`;
}
// @end-legacy-unit 1777

// @legacy-unit 1778 22747
export function renderPriceReviewQueueRows(rows) {
  const tableOnlyDri = currentRole === "dri";
  return rows.length ? rows.map((row) => tableOnlyDri ? `
    <tr class="${row.id === selectedPriceReviewRequestId ? "active-row" : ""}" data-price-review-select-row="${row.id}">
      <td class="cell-identity">
        ${renderPriceReviewExcelIdentityCell(row)}
      </td>
      <td>${renderPriceReviewExcelContextCell(row)}</td>
      <td>${renderPriceReviewExcelQtyCell(row)}</td>
      <td>${isPriceReviewStockRow(row) ? (row.targetStage || "-") : (needDateForRow(row) || "-")}</td>
      <td>${renderPriceReviewExcelHistoryCell(row)}</td>
      <td><div class="excel-cell-stack"><strong>${htmlText(isPriceReviewStockRow(row) ? warehouseOwnerLabel(row) : priceReviewPendingOwner(row))}</strong><span>${htmlText(isPriceReviewStockRow(row) ? warehouseTransactionStatus(row) : (row.nextStep || managerQueueNextStep(row) || "-"))}</span></div></td>
      <td class="cell-action pending-work-action-cell">
        ${priceReviewActionCell(row)}
      </td>
      <td class="cell-action">
        ${renderPriceReviewExcelDetailCell(row)}
      </td>
    </tr>` : `
    <tr class="${row.id === selectedPriceReviewRequestId ? "active-row" : ""}" data-price-review-select-row="${row.id}">
      <td class="cell-action pending-work-action-cell">
        ${priceReviewActionCell(row)}
      </td>
      <td class="cell-identity">
        ${pendingWorkIdentityHtml(row, {
    secondary: isPriceReviewStockRow(row) ? (row.targetRequestId || row.id) : row.id,
    tertiary: isPriceReviewStockRow(row) ? (row.spec || "") : (userVisibleItemDetail(row) || itemDetail(row) || ""),
    badge: isPriceReviewStockRow(row) ? "Unit-owned Candidate" : (isDeptDriSubmissionPending(row) ? "Submission Gate" : (row.priceThresholdCategory || "Need Classification")),
  })}
      </td>
      <td>${isPriceReviewStockRow(row) ? warehouseTargetLabel(row) : row.project}</td>
      <td>${isPriceReviewStockRow(row) ? (row.targetStage || "-") : (needDateForRow(row) || "-")}</td>
      <td>${isPriceReviewStockRow(row) ? warehouseSourceLabel(row) : (isDeptDriSubmissionPending(row) ? "Pending" : row.historyUnitPrice ? money(row.historyUnitPrice) : "No hist.")}</td>
      <td>${isPriceReviewStockRow(row) ? `${warehouseTransactionQty(row)} qty` : (isDeptDriSubmissionPending(row) ? "Waiting quote" : row.quoteUnitPrice ? money(row.quoteUnitPrice) : "-")}</td>
      <td>${isPriceReviewStockRow(row) ? "Stock evidence" : (isDeptDriSubmissionPending(row) ? "Submission" : priceVarianceLabel(row))}</td>
      <td><span class="status-pill ${statusClass(isPriceReviewStockRow(row) ? warehouseTransactionStatus(row) : priceReviewPendingOwner(row))}">${isPriceReviewStockRow(row) ? warehouseOwnerLabel(row) : priceReviewPendingOwner(row)}</span></td>
      <td class="cell-action">
        <div class="row-action-stack">
          <button class="mini" type="button" data-price-review-select="${row.id}">Review</button>
          ${isPriceReviewStockRow(row) ? itemDetailButton("warehouse", warehouseInventoryId({ month: row.month, item: row.item, spec: row.spec })) : itemDetailButton("request", row.id)}
        </div>
      </td>
    </tr>`).join("") : `<tr><td colspan="${tableOnlyDri ? 8 : 9}" class="empty-cell">No rows are waiting for ${roleProfiles[currentRole]?.name || "this role"} in this queue.</td></tr>`;
}
// @end-legacy-unit 1778

// @legacy-unit 1779 22792
export function decisionTimestampForRole(row, role = currentRole) {
  if (isPriceReviewStockRow(row)) return row.confirmedAt || "";
  if (role === "manager") return row.costManagerAuthorizedAt || "";
  if (role === "projectDri") return row.projectDriApprovedAt || "";
  return row.driApprovedAt || row.deptDriSubmissionApprovedAt || "";
}
// @end-legacy-unit 1779

// @legacy-unit 1780 22799
export function decisionActorForRole(row, role = currentRole) {
  if (isPriceReviewStockRow(row)) return row.confirmedBy || "Dept DRI";
  if (role === "manager") return row.costManagerAuthorizedBy || "Cost Manager";
  if (role === "projectDri") return row.projectDriApprovedBy || "Budget Approver";
  return row.driApprovedBy || row.deptDriSubmissionApprovedBy || "Dept DRI";
}
// @end-legacy-unit 1780

// @legacy-unit 1781 22806
export function approvedEvidenceStatus(row, role = currentRole) {
  if (isPriceReviewStockRow(row)) return warehouseTransactionStatus(row);
  if (role === "manager") return row.costManagerAuthorizationStatus || COST_MANAGER_AUTH_APPROVED;
  if (role === "projectDri") return row.priceApprovalStatus || "Budget Approved";
  return row.deptDriReviewStatus || row.priceApprovalStatus || "Approved";
}
// @end-legacy-unit 1781

// @legacy-unit 1782 22813
export function renderApprovedEvidenceRows(rows = [], { role = currentRole, selectedId = selectedPriceReviewRequestId, selectAttr = "data-price-review-select-row" } = {}) {
  return rows.length ? rows.map((row) => {
    const status = approvedEvidenceStatus(row, role);
    const phase = isPriceReviewStockRow(row) ? (row.targetStage || row.phase || "-") : managerAffectedPhasesText(row);
    const qty = isPriceReviewStockRow(row) ? `${warehouseTransactionQty(row)} qty` : `Qty ${totalQty(row)}`;
    const scope = isPriceReviewStockRow(row) ? warehouseTargetLabel(row) : `${row.project || "-"} / ${phase}`;
    const pipeline = approvalPipelineStatus(row, role);
    const pipelineClass = `approval-pipeline-${pipeline.tone || "pending"}`;
    const sentTo = pipeline.nextOwner ? `Sent to ${pipeline.nextOwner}` : "-";
    const currentOwner = pipeline.blockedAtOwner || "-";
    return `
      <tr class="${row.id === selectedId ? "active-row" : ""} ${pipelineClass}" ${selectAttr}="${htmlAttr(row.id)}" data-approval-pipeline-status="${htmlAttr(pipeline.tone || "pending")}" title="${htmlAttr(approvalPipelineTitle(row, role))}">
        <td class="cell-identity">${pendingWorkIdentityHtml(row, {
          secondary: isPriceReviewStockRow(row) ? (row.targetRequestId || row.id) : row.id,
          tertiary: isPriceReviewStockRow(row) ? (row.spec || "") : (userVisibleItemDetail(row) || itemDetail(row) || ""),
          badge: status,
        })}</td>
        <td>${htmlText(scope)}</td>
        <td>${htmlText(qty)}</td>
        <td><span class="status-pill ${statusClass(status)}">${htmlText(status)}</span></td>
        <td><strong>${htmlText(sentTo)}</strong><div class="reason-text">${pipeline.sentAt ? compactDateTime(pipeline.sentAt) : "-"}</div></td>
        <td><span class="status-pill ${statusClass(currentOwner)}">${htmlText(currentOwner)}</span><div class="reason-text">${pipeline.lastUpdatedAt ? `Since ${compactDateTime(pipeline.lastUpdatedAt)}` : pipeline.nextStep || "-"}</div></td>
        <td><span class="status-pill ${statusClass(pipeline.poStatus)}">${htmlText(pipeline.poStatus)}</span><div class="reason-text">${htmlText(pipeline.nextStep || "-")}</div></td>
        <td class="cell-action">${isPriceReviewStockRow(row) ? itemDetailButton("warehouse", warehouseInventoryId({ month: row.month, item: row.item, spec: row.spec })) : itemDetailButton("request", row.id)}</td>
      </tr>`;
  }).join("") : `<tr><td colspan="8" class="empty-cell">No project review rows match this role scope.</td></tr>`;
}
// @end-legacy-unit 1782

// @legacy-unit 1783 22841
export function renderEvidenceEmptyState(mode = "approved") {
  const ids = priceReviewAnalysisDomIds(mode);
  clearNodeContent(ids.quantity.head);
  const quantityRows = document.getElementById(ids.quantity.rows);
  const quantityTable = document.getElementById(ids.quantity.table);
  if (quantityRows) quantityRows.innerHTML = `<tr class="quantity-empty-row"><td colspan="${managerQuantityColumnCount()}" class="empty-cell">Select a row to load scoped station evidence.</td></tr>`;
  quantityTable?.querySelector("colgroup")?.remove();
  priceReviewAnalysisDomIds(mode).scopeNodes.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = id.toLowerCase().includes("demandcost") ? "All review rows" : "Select a row";
  });
}
// @end-legacy-unit 1783

// @legacy-unit 1784 22854
export function renderApprovedEvidenceAnalysis({ mode = "approved", scope = null, role = currentRole, rows = [] } = {}) {
  if (mode === "managerAuthorized") {
    renderPriceReviewCostDashboard({ mode, scope: null, role, rows, showCarryoverEvidence: false });
    const activeProject = activeProjectContext({ mode, scope, rows });
    const projectRows = projectContextRowsForProject(rows, activeProject);
    setApprovalQuantityDashboardScopeLabel(mode, activeProject ? `${activeProject} / ${projectRows.length} row${projectRows.length === 1 ? "" : "s"}` : "All Cost Manager review rows");
    if (!scope) {
      renderEvidenceEmptyState(mode);
      setApprovalQuantityDashboardScopeLabel(mode, activeProject ? `${activeProject} / ${projectRows.length} row${projectRows.length === 1 ? "" : "s"}` : "All Cost Manager review rows");
      return;
    }
    renderPriceReviewStationMatrix({ mode, scope, role, rows, showCarryoverEvidence: false });
    const label = scope.label || "Selected row";
    priceReviewAnalysisDomIds(mode).scopeNodes.forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = id.toLowerCase().includes("demandcost")
        ? (activeProject ? `${activeProject} / ${projectRows.length} row${projectRows.length === 1 ? "" : "s"}` : "All Cost Manager review rows")
        : label;
    });
    return;
  }

  syncPriceReviewDetailTitle(mode);
  const detailScope = approvalQuantityReviewTab === "dashboard"
    ? scope
    : priceReviewDetailScopeForTab(scope, approvalQuantityReviewTab);
  updatePriceReviewAnalysisScopeLabel();
  renderPriceReviewItemUnitMatrix({ mode, scope: detailScope, rows });
  if (!detailScope) {
    renderEvidenceEmptyState(mode);
    return;
  }
  if (approvalQuantityReviewTab === "dashboard") {
    const ids = priceReviewAnalysisDomIds(mode);
    clearNodeContent(ids.quantity.head);
    const quantityRows = document.getElementById(ids.quantity.rows);
    const quantityTable = document.getElementById(ids.quantity.table);
    if (quantityRows) quantityRows.innerHTML = `<tr class="quantity-empty-row"><td colspan="${managerQuantityColumnCount()}" class="empty-cell">Click MFG or a Non-MFG department in Dashboard to load item detail.</td></tr>`;
    quantityTable?.querySelector("colgroup")?.remove();
    return;
  }
  renderPriceReviewStationMatrix({ mode, scope: detailScope, role, rows, showCarryoverEvidence: false });
  const label = detailScope.label || "Selected row";
  priceReviewAnalysisDomIds(mode).scopeNodes.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = id.toLowerCase().includes("demandcost") ? "All project review rows" : label;
  });
}
// @end-legacy-unit 1784

// @legacy-unit 1785 22903
export function renderPriceReview() {
  const roleSurface = approvalReviewConfigForRole(currentRole);
  const roleMeta = roleQueueConfigModule().metaForRole?.(currentRole) || {};
  document.querySelector('section[data-view="priceReview"]')?.setAttribute("data-approval-review-role", currentRole);
  const title = document.getElementById("priceReviewTitle");
  if (title) title.textContent = roleSurface?.entryLabel || roleProfiles[currentRole]?.functionName || "Price Review";
  syncPriceReviewWorkspaceUi();
  if (["approved", "projectReview"].includes(currentPriceReviewTab)) replaceCurrentPriceReviewTabBinding("pending");
  document.querySelectorAll("[data-price-review-tab='costDashboard'], [data-price-review-tab='stationMatrix']").forEach((tab) => {
    tab.hidden = true;
  });
  document.querySelectorAll("[data-price-review-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.priceReviewTab === currentPriceReviewTab));
  document.querySelectorAll("[data-price-review-panel]").forEach((panel) => {
    const isActive = panel.dataset.priceReviewPanel === currentPriceReviewTab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  const pendingTab = document.querySelector('[data-price-review-tab="pending"]');
  if (pendingTab) pendingTab.textContent = roleSurface?.tabLabels?.pending || roleMeta.pendingTabLabel || "Review Workbench";
  const queues = ensureCurrentPriceReviewQueue();
  const activeQueue = priceReviewQueueMeta();
  const projectRows = roleReviewRows(currentRole);
  const selectedRows = projectRows;
  syncSelectedPriceReviewRequest(selectedRows);
  updateApprovalReviewState(currentRole, {
    activeTab: currentPriceReviewTab,
    activeQueue: currentPriceReviewQueue,
    quantityTab: approvalQuantityReviewTab,
  });
  renderPriceReviewWorkspaceBanner(queues, activeQueue);
  const pending = projectRows;
  const selectedRow = selectedRows.find((row) => row.id === selectedPriceReviewRequestId) || null;
  syncProjectStatusScopeFromRow(selectedRow);
  const pendingHeader = document.getElementById("priceReviewPendingHeader");
  if (pendingHeader) pendingHeader.hidden = false;
  const workspaceBanner = document.getElementById("priceReviewWorkspaceBanner");
  if (workspaceBanner) {
    workspaceBanner.hidden = true;
    workspaceBanner.innerHTML = "";
  }
  const count = document.getElementById("priceReviewPendingCount");
  if (count) count.textContent = `${pending.length} row${pending.length === 1 ? "" : "s"}`;
  const queueTabs = document.getElementById("priceReviewQueueTabs");
  if (queueTabs) {
    queueTabs.innerHTML = approvalWorkbenchModule().renderQueueTabs?.({
        queues,
        activeQueue: currentPriceReviewQueue,
      }) || "";
    queueTabs.hidden = !queues.length;
  }
  const queueHelper = document.getElementById("priceReviewQueueHelper");
  if (queueHelper) {
    queueHelper.hidden = false;
    queueHelper.textContent = pending.length
      ? "Select a row for approval actions. Use Demand Progress Tracking for Dashboard / MFG / Non-MFG tracking."
      : `${activeQueue.label}: no rows are waiting.`;
  }
  const workspace = document.getElementById("priceReviewPendingWorkspace");
  if (workspace) {
    workspace.hidden = false;
    workspace.innerHTML = renderApprovalQuantityRowPicker({
        rows: pending,
        selectedId: selectedPriceReviewRequestId,
        selectAttr: "data-price-review-select",
        title: currentRole === "dri" ? "Item Switcher" : roleSurface?.entryLabel || roleMeta.workbenchTitle || `${roleProfiles[currentRole]?.name || "Reviewer"} Rows`,
        helper: currentRole === "dri"
          ? "Switch item here. Demand Progress Tracking keeps the full tracking matrix together."
          : activeQueue.helper || "Select a row for approval actions. Track the full project in Demand Progress Tracking.",
        emptyText: priceReviewEmptyState(currentRole, currentPriceReviewQueue),
        role: currentRole,
        actionHtml: priceReviewApprovalQuantityActions,
      });
  }
  const historyBody = document.getElementById("priceReviewHistoryRows");
  if (historyBody) {
    const rows = priceReviewHistoryRows();
    historyBody.innerHTML = rows.length ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td><div class="item-primary">${row.name}</div><div class="reason-text">${needDateForRow(row) ? `Need ${needDateForRow(row)}` : ""}</div></td>
        <td><span class="status-pill ${statusClass(row.priceApprovalStatus || row.priceDecisionStatus || row.deptDriReviewStatus)}">${row.priceApprovalStatus || row.priceDecisionStatus || row.deptDriReviewStatus || "-"}</span></td>
        <td>${row.driApprovedAt ? `${row.driApprovedBy || "Dept DRI"}<div class="reason-text">${compactDateTime(row.driApprovedAt)}</div>` : row.deptDriSubmissionApprovedAt ? `${row.deptDriSubmissionApprovedBy || "Dept DRI"}<div class="reason-text">${compactDateTime(row.deptDriSubmissionApprovedAt)}</div>` : "-"}</td>
        <td>${row.projectDriApprovedAt ? `${row.projectDriApprovedBy || "Budget Approver"}<div class="reason-text">${compactDateTime(row.projectDriApprovedAt)}</div>` : "-"}</td>
        <td>${row.priceEscalationRejectReason || row.deptDriReviewRejectReason || row.priceDecisionReason || "-"}</td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("") : `<tr><td colspan="8" class="empty-cell">No price review history yet.</td></tr>`;
  }
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 1785
