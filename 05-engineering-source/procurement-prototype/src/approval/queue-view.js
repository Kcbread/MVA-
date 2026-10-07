// approval/queue-view: authoritative source; see docs/module-map.md.
import {
  ensureSelectValue,
  priceReviewSelectedRowScope,
  roleReviewRows
} from "./analysis-scope.js";
import {
  managerAuditTimelineHtml,
  stationBreakdownDetailHtml
} from "./audit-view.js";
import {
  managerReviewRole,
  updateApprovalReviewState
} from "./navigation.js";
import {
  isPriceReviewStockRow,
  priceReviewActionCell,
  renderApprovedEvidenceAnalysis
} from "./price-review.js";
import {
  minDemandUnitLabel,
  minDemandUnitSummary,
  minDemandUnitValue
} from "./quantity-scope.js";
import {
  managerRows
} from "./queues.js";
import {
  approvalQuantityReviewTab,
  approvalViewportState,
  priceReviewAnalysisRowsOverride,
  replacePriceReviewAnalysisRowsOverrideBinding,
  replaceSelectedManagerAuthorizedRequestIdBinding,
  replaceSelectedManagerRequestIdBinding,
  selectedManagerAuthorizedRequestId,
  selectedManagerRequestId
} from "./state.js";
import {
  isCostManagerAuthorizationPending,
  isDeptDriSubmissionPending,
  priceReviewPendingOwner,
  reviewStatusForRole
} from "./status.js";
import {
  nextApprovalSelection
} from "./viewport.js";
import {
  formatMoneyFromVnd
} from "../cost/currency.js";
import {
  renderManagerDemandCostDashboard
} from "../cost/dashboard-view.js";
import {
  renderManagerQuantityMatrix
} from "../cost/matrix-view.js";
import {
  requestStageQty,
  totalQty
} from "../demand/quantity.js";
import {
  needDateForRow
} from "../demand/request-fields.js";
import {
  approvalQuantityReviewModule
} from "../infrastructure/module-adapters.js";
import {
  isWarehouseLockedUse,
  warehouseInventoryId,
  warehouseOwnerLabel,
  warehouseTargetLabel,
  warehouseTransactionQty,
  warehouseTransactionStatus
} from "../inventory/warehouse.js";
import {
  isNewMaterial,
  itemDetail,
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
import {
  projectContextSelectedProject,
  syncProjectContextFromRow
} from "../projects/review-context.js";
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
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  currentManagerTab
} from "../shell/state.js";
import {
  COST_MANAGER_AUTH_APPROVED,
  COST_MANAGER_AUTH_DENIED,
  COST_MANAGER_AUTH_REJECTED,
  DEMAND_REVIEW_APPROVED,
  DEMAND_REVIEW_DENIED,
  DEMAND_REVIEW_PENDING,
  DEMAND_REVIEW_REVISE_REQUIRED,
  DEPT_DRI_SUBMISSION_REJECTED,
  PRICE_ESCALATION_PENDING_DRI,
  PRICE_ESCALATION_REJECTED,
  PRICE_ESCALATION_REQUIRED
} from "../workflow/status-constants.js";
import {
  workflowStatusForRow
} from "../workflow/status-view.js";

// @legacy-unit 1234 15073
export function pendingWorkActionButtons(buttons = []) {
  if (!buttons.length) return `<span class="status-pill">Read Only</span>`;
  return `
    <div class="row-action-stack">
      ${buttons.join("")}
    </div>`;
}
// @end-legacy-unit 1234

// @legacy-unit 1235 15081
export function pendingWorkIdentityHtml(row, { secondary = "", tertiary = "", badge = "" } = {}) {
  const tertiaryText = [tertiary, badge].filter(Boolean).join(" · ");
  return `
    <div class="identity-block">
      <span class="identity-primary">${htmlText(row.name || "-")}</span>
      <span class="identity-secondary">${htmlText(secondary || partName(row) || row.id || "-")}</span>
      ${tertiaryText ? `<span class="identity-tertiary">${htmlText(tertiaryText)}</span>` : ""}
    </div>`;
}
// @end-legacy-unit 1235

// @legacy-unit 1236 15091
export function managerAffectedPhasesText(row) {
  return STAGES
    .map((stage) => ({ stage, qty: requestStageQty(row, stage) }))
    .filter((entry) => entry.qty > 0)
    .map((entry) => `${STAGE_LABELS[entry.stage]} ${entry.qty}`)
    .join(" / ") || "-";
}
// @end-legacy-unit 1236

// @legacy-unit 1237 15099
export function managerGateOwner(row) {
  if (isPriceReviewStockRow(row)) return warehouseOwnerLabel(row);
  if (currentRole === "projectDri") return "Budget Approver";
  if (currentRole === "dri") return "Dept DRI";
  if (isDeptDriSubmissionPending(row)) return "Dept DRI";
  if (isCostManagerAuthorizationPending(row)) return "Cost Manager";
  return priceReviewPendingOwner(row);
}
// @end-legacy-unit 1237

// @legacy-unit 1238 15108
export function demandReviewStatus(row = {}) {
  if (row.demandReviewStatus) return row.demandReviewStatus;
  if (row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_APPROVED || row.costManagerAuthorizedAt) return DEMAND_REVIEW_APPROVED;
  if (row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_DENIED || row.demandReviewDeniedAt || row.status === DEMAND_REVIEW_DENIED) return DEMAND_REVIEW_DENIED;
  if (row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED || row.costManagerAuthorizationReworkRequired || row.costManagerRejectedAt) return DEMAND_REVIEW_REVISE_REQUIRED;
  if (isCostManagerAuthorizationPending(row)) return DEMAND_REVIEW_PENDING;
  return row.status === "Submitted" ? DEMAND_REVIEW_PENDING : (row.status || DEMAND_REVIEW_PENDING);
}
// @end-legacy-unit 1238

// @legacy-unit 1239 15117
export function demandReviewTone(row = {}) {
  const status = demandReviewStatus(row);
  if (status === DEMAND_REVIEW_APPROVED) return "approved";
  if (status === DEMAND_REVIEW_DENIED) return "denied";
  if (status === DEMAND_REVIEW_REVISE_REQUIRED) return "revise";
  return "pending";
}
// @end-legacy-unit 1239

// @legacy-unit 1240 15125
export function demandReviewReason(row = {}) {
  return row.demandReviewReason || row.costManagerRejectReason || row.managerReason || "";
}
// @end-legacy-unit 1240

// @legacy-unit 1241 15129
export function managerQueueStatus(row, role = managerReviewRole(currentRole)) {
  if (isPriceReviewStockRow(row)) return warehouseTransactionStatus(row);
  if (role !== "manager") return reviewStatusForRole(row, role).label || priceReviewPendingOwner(row);
  return row.costManagerAuthorizationStatus || row.demandReviewStatus || row.deptDriReviewStatus || row.priceApprovalStatus || row.status;
}
// @end-legacy-unit 1241

// @legacy-unit 1242 15135
export function managerQueueNextStep(row, role = managerReviewRole(currentRole)) {
  if (isPriceReviewStockRow(row)) return warehouseOwnerLabel(row);
  if (role === "dri") {
    if (isDeptDriSubmissionPending(row)) return "Cost Review";
    if (row.priceDecisionStatus === PRICE_ESCALATION_REQUIRED || row.priceApprovalStatus === PRICE_ESCALATION_PENDING_DRI) return "Budget Review";
    return row.nextStep || "Waiting Dept Review";
  }
  if (role === "projectDri") return row.nextStep || "OM Handoff";
  if (isCostManagerAuthorizationPending(row)) return "Demand approval before OM intake";
  if (isDeptDriSubmissionPending(row)) return "Waiting Dept DRI approval";
  return row.nextStep || (row.status === "Approved" ? "OM / cost tracking" : "Waiting approval gate");
}
// @end-legacy-unit 1242

// @legacy-unit 1243 15148
export function managerReviewActionable(row = {}, role = managerReviewRole(currentRole)) {
  if (role === "manager") return isCostManagerAuthorizationPending(row);
  return Boolean(reviewStatusForRole(row, role).actionable);
}
// @end-legacy-unit 1243

// @legacy-unit 1244 15153
export function managerDecisionCell(row, role = managerReviewRole(currentRole)) {
  if (!managerReviewActionable(row, role)) return pendingWorkActionButtons();
  return pendingWorkActionButtons([
    `<button class="mini approve" type="button" data-manager-review-decision="${htmlAttr(row.id)}" data-manager-review-action="approve">Approved</button>`,
    `<button class="mini reject" type="button" data-manager-review-decision="${htmlAttr(row.id)}" data-manager-review-action="deny">Denied</button>`,
    `<button class="mini return" type="button" data-manager-review-decision="${htmlAttr(row.id)}" data-manager-review-action="revise">Revise</button>`,
  ]);
}
// @end-legacy-unit 1244

// @legacy-unit 1245 15162
export function demandReviewMatrixActionCell(row = {}, role = managerReviewRole(currentRole)) {
  const reviewStatus = reviewStatusForRole(row, role);
  const status = role === "manager" ? demandReviewStatus(row) : reviewStatus.label;
  const reason = role === "manager" ? demandReviewReason(row) : (row.demandReviewReason || row.deptDriReviewRejectReason || row.priceEscalationRejectReason || "");
  if (!managerReviewActionable(row, role)) {
    return `
      <div class="demand-review-row-decision demand-review-row-decision--${htmlAttr(reviewStatus.tone || demandReviewTone(row))}">
        <strong>${htmlText(status)}</strong>
        ${reason ? `<span>${htmlText(reason)}</span>` : ""}
      </div>`;
  }
  return managerDecisionCell(row, role);
}
// @end-legacy-unit 1245

// @legacy-unit 1246 15176
export function renderManagerWorkbenchDetail(row) {
  if (!row) {
    return `
      <div class="empty-state pending-work-empty">
        Select a queue row to review request detail, phase impact, and the next approval action.
      </div>`;
  }
  const decisionHtml = managerDecisionCell(row);
  const summary = detailSummaryGridHtml([
    ["Request ID", row.id, row.project],
    ["Requester", row.submittedBy || row.requesterName || "Requester", row.submittedAt ? compactDateTime(row.submittedAt) : "Waiting submitted time"],
    ["Current Stage", managerQueueStatus(row), managerGateOwner(row)],
    ["Next Step", managerQueueNextStep(row), row.nextStep || "Workflow status"],
    ["Affected Phases", managerAffectedPhasesText(row), `Total Qty ${totalQty(row)}`],
    ["Need Date", needDateForRow(row) || "-", row.requiredDeliveryDate || "No required delivery date"],
    ["Reason / Use Case", row.requesterReason || row.useCase || "-", row.managerReason || "No reject reason recorded"],
    ["Estimate / Cost", row.estimatedAmount ? formatMoneyFromVnd(row.estimatedAmount) : row.estimatedUnitPrice ? `${formatMoneyFromVnd(row.estimatedUnitPrice)} / unit` : "-", isCostManagerAuthorizationPending(row) ? "Waiting final authorization" : managerQueueStatus(row)],
  ]);
  return `
    <section class="pending-work-detail-card">
      <div class="panel-title section-head-tight">
        <div>
          <h4>${htmlText(row.name || "Selected Request")}</h4>
          <p class="panel-subcopy">${htmlText(partName(row) || itemDetail(row) || "Review the requester summary, then authorize or reject without leaving the queue.")}</p>
        </div>
        <span class="status-pill ${statusClass(managerQueueStatus(row))}">${managerQueueStatus(row)}</span>
      </div>
      <div class="pending-work-detail-actions">
        ${decisionHtml}
        <button class="ghost" type="button" data-manager-detail="${row.id}">Open Full Detail</button>
      </div>
      ${summary}
      <section class="detail-card-section">
        <h4>需求單位 / Station Breakdown</h4>
        ${stationBreakdownDetailHtml(row)}
      </section>
      <section class="detail-card-section">
        <h4>Timeline / Evidence</h4>
        ${managerAuditTimelineHtml(row)}
      </section>
    </section>`;
}
// @end-legacy-unit 1246

// @legacy-unit 1247 15219
export function syncSelectedManagerRequest(rows = managerRows(), preferredId = selectedManagerRequestId) {
  const hasPreferredRow = Boolean(preferredId && rows.some((row) => row.id === preferredId));
  replaceSelectedManagerRequestIdBinding(nextApprovalSelection(rows, approvalViewportState.manager, preferredId));
  if (!hasPreferredRow && selectedManagerRequestId) {
    const selectedRow = rows.find((row) => row.id === selectedManagerRequestId);
    if (selectedRow && !managerReviewActionable(selectedRow, managerReviewRole(currentRole))) {
      const actionableRow = rows.find((row) => managerReviewActionable(row, managerReviewRole(currentRole)));
      if (actionableRow) replaceSelectedManagerRequestIdBinding(actionableRow.id);
    }
  }
  updateApprovalReviewState(managerReviewRole(currentRole), { selectedRowId: selectedManagerRequestId || "" });
}
// @end-legacy-unit 1247

// @legacy-unit 1248 15232
export function renderManagerQueueRows(rows) {
  return rows.length ? rows.map((row) => `
    <tr class="${row.id === selectedManagerRequestId ? "active-row" : ""}" data-manager-select-row="${htmlAttr(row.id)}">
      <td class="cell-action pending-work-action-cell">
        ${managerDecisionCell(row)}
      </td>
      <td class="cell-identity">
        ${pendingWorkIdentityHtml(row, {
    secondary: row.id,
    tertiary: itemDetail(row) || "",
    badge: isNewMaterial(row) ? "New Material" : "",
  })}
      </td>
      <td>${row.project}</td>
      <td>${row.submittedBy || row.requesterName || "Requester"}<div class="reason-text">${row.submittedAt ? compactDateTime(row.submittedAt) : "-"}</div></td>
      <td>${managerAffectedPhasesText(row)}<div class="reason-text">Qty ${totalQty(row)}</div></td>
      <td><span class="status-pill ${statusClass(managerQueueStatus(row))}">${managerQueueStatus(row)}</span></td>
      <td>${managerGateOwner(row)}</td>
      <td>${managerQueueNextStep(row)}</td>
      <td class="cell-action">
        <div class="row-action-stack">
          <button class="mini" type="button" data-manager-select="${row.id}">Review</button>
          <button class="mini return" type="button" data-contact-dri="${row.id}">Contact</button>
          <button class="mini" type="button" data-manager-detail="${row.id}">Detail</button>
        </div>
      </td>
	    </tr>`).join("") : `<tr><td colspan="9" class="empty-cell">No requests match the selected filters.</td></tr>`;
}
// @end-legacy-unit 1248

// @legacy-unit 1249 15261
export function approvalQuantityPickerItemHtml(row, role = currentRole) {
  const identity = row.name || row.item || "Review row";
  const spec = isPriceReviewStockRow(row) ? (row.spec || "") : (userVisibleItemDetail(row) || itemDetail(row) || "");
  const qty = isPriceReviewStockRow(row) ? warehouseTransactionQty(row) : totalQty(row);
  const scope = isPriceReviewStockRow(row) ? warehouseTargetLabel(row) : minDemandUnitSummary(row);
  const workflow = !isPriceReviewStockRow(row) && role === "manager" ? workflowStatusForRow(row, "costOwner") : null;
  const workflowText = workflow
    ? `${workflow.pendingOwner || "-"} · ${workflow.currentStage || "-"} · ${workflow.daysPending === null || workflow.daysPending === undefined ? "Done" : `${workflow.daysPending}d`}`
    : "";
  return `
    <span class="approval-quantity-chip-primary">${htmlText(identity)}</span>
    <span class="approval-quantity-chip-secondary">${htmlText(row.id || row.targetRequestId || "-")} · Qty ${htmlText(qty)}</span>
    <span class="approval-quantity-chip-tertiary">${htmlText([scope, workflowText, spec].filter(Boolean).join(" · "))}</span>`;
}
// @end-legacy-unit 1249

// @legacy-unit 1250 15276
export function approvalQuantityPickerMetaHtml(row, role = currentRole) {
  if (!row) return "";
  const phase = isPriceReviewStockRow(row) ? (row.targetStage || row.phase || "-") : managerAffectedPhasesText(row);
  const status = isPriceReviewStockRow(row)
    ? warehouseTransactionStatus(row)
    : role === "manager"
      ? managerQueueStatus(row)
      : priceReviewPendingOwner(row);
  const next = isPriceReviewStockRow(row) ? warehouseOwnerLabel(row) : row.nextStep || managerQueueNextStep(row);
  const minUnitLabel = isPriceReviewStockRow(row) ? "Target" : minDemandUnitLabel(row);
  const minUnitValue = isPriceReviewStockRow(row) ? warehouseTargetLabel(row) : minDemandUnitValue(row);
  const workflow = !isPriceReviewStockRow(row) && role === "manager" ? workflowStatusForRow(row, "costOwner") : null;
  if (workflow) {
    const daysLabel = workflow.daysPending === null || workflow.daysPending === undefined ? "Done" : `${workflow.daysPending}d`;
    return `
      <div class="approval-quantity-selected-identity">
        <strong>${htmlText(row.name || row.item || "Selected row")}</strong>
        <span>${htmlText(row.id || row.targetRequestId || "-")} · ${htmlText(row.project || row.targetProject || "-")}</span>
      </div>
      <div class="approval-quantity-selected-metrics">
        <span><em>Current Owner</em><strong>${htmlText(workflow.pendingOwner || "-")}</strong></span>
        <span><em>Current Stage</em><strong>${htmlText(workflow.currentStage || "-")}</strong></span>
        <span><em>Aging</em><strong>${htmlText(daysLabel)}</strong></span>
        <span><em>Quote</em><strong>${htmlText(workflow.quoteStatus || "-")}</strong></span>
        <span><em>Next Action</em><strong>${htmlText(workflow.nextAction || next || "-")}</strong></span>
      </div>`;
  }
  return `
    <div class="approval-quantity-selected-identity">
      <strong>${htmlText(row.name || row.item || "Selected row")}</strong>
      <span>${htmlText(row.id || row.targetRequestId || "-")} · ${htmlText(row.project || row.targetProject || "-")}</span>
    </div>
    <div class="approval-quantity-selected-metrics">
      <span><em>Phase</em><strong>${htmlText(phase)}</strong></span>
      <span><em>${htmlText(minUnitLabel)}</em><strong>${htmlText(minUnitValue)}</strong></span>
      <span><em>Need Date</em><strong>${htmlText(isPriceReviewStockRow(row) ? (row.targetNeedDate || "-") : (needDateForRow(row) || "-"))}</strong></span>
      <span><em>Status</em><strong>${htmlText(status)}</strong></span>
      <span><em>Next</em><strong>${htmlText(next || "-")}</strong></span>
    </div>`;
}
// @end-legacy-unit 1250

// @legacy-unit 1251 15317
export function managerApprovalQuantityActions(row) {
  if (!row) return "";
  return `
    ${managerDecisionCell(row)}
    <button class="mini" type="button" data-manager-detail="${htmlAttr(row.id)}">Detail</button>
    <button class="mini return" type="button" data-contact-dri="${htmlAttr(row.id)}">Contact</button>`;
}
// @end-legacy-unit 1251

// @legacy-unit 1252 15325
export function priceReviewApprovalQuantityActions(row) {
  if (!row) return "";
  return `
    ${priceReviewActionCell(row)}
    ${isPriceReviewStockRow(row)
      ? itemDetailButton("warehouse", warehouseInventoryId({ month: row.month, item: row.item, spec: row.spec }))
      : itemDetailButton("request", row.id)}`;
}
// @end-legacy-unit 1252

// @legacy-unit 1253 15334
export function renderApprovalQuantityRowPicker({
  rows = [],
  selectedId = "",
  selectAttr = "",
  title = "Review Rows",
  helper = "",
  emptyText = "",
  role = currentRole,
  actionHtml = () => "",
} = {}) {
  return approvalQuantityReviewModule().renderRowPicker?.({
    rows,
    selectedId,
    selectAttr,
    title,
    helper,
    emptyText,
    itemHtml: (row) => approvalQuantityPickerItemHtml(row, role),
    metaHtml: (row) => approvalQuantityPickerMetaHtml(row, role),
    actionHtml,
  }) || "";
}
// @end-legacy-unit 1253

// @legacy-unit 1254 15357
export function syncSelectedManagerAuthorized(rows = managerRows(), preferredId = selectedManagerRequestId) {
  replaceSelectedManagerAuthorizedRequestIdBinding(nextApprovalSelection(rows, null, preferredId));
  updateApprovalReviewState(managerReviewRole(currentRole), { selectedRowId: selectedManagerAuthorizedRequestId || selectedManagerRequestId || "" });
}
// @end-legacy-unit 1254

// @legacy-unit 1255 15362
export function renderManagerReviewEvidencePanel(selectedRow = null, rows = managerRows()) {
  if (!projectContextSelectedProject("managerAuthorized")) syncProjectContextFromRow("managerAuthorized", selectedRow || rows[0] || null);
  const selectedScope = priceReviewSelectedRowScope(selectedRow);
  renderApprovedEvidenceAnalysis({
    mode: "managerAuthorized",
    scope: currentManagerTab === "review" ? selectedScope : null,
    role: "manager",
    rows,
  });
}
// @end-legacy-unit 1255

// @legacy-unit 1256 15373
export function renderManagerDemandAnalysisEvidence(selectedRow = null, rows = managerRows()) {
  const duplicateEvidence = document.getElementById("managerAuthorizedAnalysis");
  if (duplicateEvidence) duplicateEvidence.hidden = true;
  const scopedRows = selectedRow ? [selectedRow] : rows;
  const previousRowsOverride = priceReviewAnalysisRowsOverride;
  replacePriceReviewAnalysisRowsOverrideBinding(scopedRows);
  try {
    const reviewProject = document.getElementById("managerProjectFilter")?.value || "";
    if (reviewProject) {
      ensureSelectValue("managerDemandCostProjectFilter", reviewProject);
      ensureSelectValue("managerQuantityProjectFilter", reviewProject);
    }
    if (selectedRow && approvalQuantityReviewTab === "dashboard") {
      ensureSelectValue("managerDemandCostProjectFilter", selectedRow.project || "");
      ensureSelectValue("managerQuantityProjectFilter", selectedRow.project || "");
      ensureSelectValue("managerQuantityItemFilter", selectedRow.name || "");
    }
    renderManagerDemandCostDashboard({ showCarryoverEvidence: false });
    renderManagerQuantityMatrix({ showCarryoverEvidence: false });
  } finally {
    replacePriceReviewAnalysisRowsOverrideBinding(previousRowsOverride);
  }
}
// @end-legacy-unit 1256

// @legacy-unit 1257 15397
export function managerReviewDecisionStatus(row = {}, role = managerReviewRole(currentRole)) {
  if (demandReviewStatus(row) === DEMAND_REVIEW_DENIED) return DEMAND_REVIEW_DENIED;
  if (demandReviewStatus(row) === DEMAND_REVIEW_REVISE_REQUIRED) return DEMAND_REVIEW_REVISE_REQUIRED;
  if (role === "manager" && (row.costManagerAuthorizedAt || row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_APPROVED)) return DEMAND_REVIEW_APPROVED;
  if (role === "dri" && (row.deptDriSubmissionApprovedAt || row.driApprovedAt || isWarehouseLockedUse(row))) return DEMAND_REVIEW_APPROVED;
  if (role === "projectDri" && row.projectDriApprovedAt) return DEMAND_REVIEW_APPROVED;
  if (row.deptDriReviewStatus === DEPT_DRI_SUBMISSION_REJECTED || row.priceApprovalStatus === PRICE_ESCALATION_REJECTED || row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED) return DEMAND_REVIEW_REVISE_REQUIRED;
  return "";
}
// @end-legacy-unit 1257

// @legacy-unit 1258 15407
export function managerReviewDecisionReason(row = {}) {
  return row.demandReviewReason || row.costManagerAuthorizationReason || row.costManagerRejectReason || row.deptDriReviewRejectReason || row.priceEscalationRejectReason || row.managerReason || row.priceDecisionReason || "-";
}
// @end-legacy-unit 1258

// @legacy-unit 1259 15411
export function managerReviewDecisionAt(row = {}, role = managerReviewRole(currentRole)) {
  if (row.demandReviewDecisionAt || row.demandReviewDeniedAt) return row.demandReviewDecisionAt || row.demandReviewDeniedAt;
  if (role === "manager") return row.costManagerAuthorizedAt || row.costManagerRejectedAt || "";
  if (role === "projectDri") return row.projectDriApprovedAt || row.priceEscalationRejectedAt || "";
  return row.deptDriSubmissionApprovedAt || row.driApprovedAt || row.deptDriReviewRejectedAt || row.priceEscalationRejectedAt || row.confirmedAt || "";
}
// @end-legacy-unit 1259

// @legacy-unit 1260 15418
export function managerDecisionHistoryRows(role = managerReviewRole(currentRole)) {
  const projectFilter = document.getElementById("managerDashboardProjectFilter")?.value || "";
  const statusFilter = document.getElementById("managerDashboardStatusFilter")?.value || "";
  return roleReviewRows(role).filter((row) => {
    const status = managerReviewDecisionStatus(row, role);
    const project = row.project || row.targetProject || "";
    return status
      && (!projectFilter || project === projectFilter)
      && (!statusFilter || status === statusFilter);
  });
}
// @end-legacy-unit 1260
