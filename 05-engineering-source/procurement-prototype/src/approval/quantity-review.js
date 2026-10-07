// approval/quantity-review: authoritative source; see docs/module-map.md.
import {
  applyCostManagerAuthorization,
  applyPriceReviewDecision
} from "./decisions.js";
import {
  renderManager
} from "./manager-view.js";
import {
  priceReviewPendingRowsForRole,
  renderPriceReview
} from "./price-review.js";
import {
  quantityReviewColumnsForMode,
  quantityReviewModeLabel,
  quantityReviewModeValue
} from "./quantity-scope.js";
import {
  managerRows
} from "./queues.js";
import {
  activeItemQuantityReview,
  replaceActiveItemQuantityReviewBinding,
  selectedManagerRequestId,
  selectedPriceReviewRequestId
} from "./state.js";
import {
  formatMoneyFromUsd
} from "../cost/currency.js";
import {
  managerQuantityPriceCandidate,
  managerQuantityResolvePrice
} from "../cost/matrix-data.js";
import {
  managerQuantityEntryUnit
} from "../cost/quantity-filters.js";
import {
  applyItemQuantityProposalChange
} from "../demand/amendments.js";
import {
  clampQty,
  demandTypeFor,
  stationBreakdownHasDemand,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail,
  syncRowPhaseQtyFromStationBreakdown,
  totalQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER,
  currentStageForProject
} from "../projects/config.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  rowDemandDepartment
} from "../session/persona.js";
import {
  currentRole,
  currentSessionUser
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  normalize,
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  currentView
} from "../shell/state.js";
import {
  COST_MANAGER_AUTH_REJECTED,
  DEMAND_REVIEW_REVISE_REQUIRED,
  DEPT_DRI_SUBMISSION_REJECTED,
  PRICE_ESCALATION_REJECTED
} from "../workflow/status-constants.js";

// @legacy-unit 859 8043
export function itemQuantityReviewActionButtons(requestId, groupKeyId = "") {
  return `
    <div class="item-quantity-action-stack" data-item-quantity-action-group="${htmlAttr(groupKeyId || requestId)}">
      <button class="mini" type="button" data-item-quantity-cell="row-review" data-item-quantity-request="${htmlAttr(requestId)}" title="Open MFG / Non-MFG quantity review">Review</button>
    </div>`;
}
// @end-legacy-unit 859

// @legacy-unit 860 8050
export function itemReviewHistory(row = {}) {
  return Array.isArray(row.itemQuantityReviewHistory) ? row.itemQuantityReviewHistory : [];
}
// @end-legacy-unit 860

// @legacy-unit 861 8054
export function itemReviewDraft(row = {}) {
  return Array.isArray(row.itemQuantityProposalDraft) ? row.itemQuantityProposalDraft : [];
}
// @end-legacy-unit 861

// @legacy-unit 862 8058
export function itemReviewPendingProposal(row = {}) {
  return itemReviewDraft(row).length > 0;
}
// @end-legacy-unit 862

// @legacy-unit 863 8062
export function itemReviewProposalCount(row = {}) {
  return Number(row.itemQuantityProposalCount || itemReviewHistory(row).filter((entry) => entry.type === "proposal").length || 0);
}
// @end-legacy-unit 863

// @legacy-unit 864 8066
export function itemReviewRequesterRevisionCount(row = {}) {
  return Number(row.itemQuantityRequesterRevisionCount || itemReviewHistory(row).filter((entry) => entry.type === "requester_revision").length || 0);
}
// @end-legacy-unit 864

// @legacy-unit 865 8070
export function itemReviewChangeCount(row = {}) {
  return Number(row.itemQuantityChangeCount || 0);
}
// @end-legacy-unit 865

// @legacy-unit 866 8074
export function itemReviewChangeBadge(row = {}) {
  const pending = itemReviewPendingProposal(row);
  const proposalCount = itemReviewProposalCount(row);
  const requesterRevisions = itemReviewRequesterRevisionCount(row);
  const formalChanges = itemReviewChangeCount(row);
  return `
    <div class="item-review-change-stack">
      <span class="status-pill ${pending ? "warning" : proposalCount ? "info" : "draft"}">${pending ? "Draft" : `${proposalCount} prop.`}</span>
      <span>${formalChanges} official / ${requesterRevisions} requester</span>
    </div>`;
}
// @end-legacy-unit 866

// @legacy-unit 867 8086
export function itemReviewActor() {
  return roleProfiles[currentRole]?.name || currentSessionUser?.name || currentRole || "Reviewer";
}
// @end-legacy-unit 867

// @legacy-unit 868 8090
export function selectedReviewRequest() {
  if (currentView === "manager") {
    return requests.find((row) => row.id === selectedManagerRequestId)
      || managerRows().find((row) => row.id === selectedManagerRequestId)
      || managerRows()[0]
      || null;
  }
  if (currentView === "priceReview") {
    return requests.find((row) => row.id === selectedPriceReviewRequestId)
      || priceReviewPendingRowsForRole().find((row) => row.id === selectedPriceReviewRequestId)
      || priceReviewPendingRowsForRole()[0]
      || null;
  }
  return null;
}
// @end-legacy-unit 868

// @legacy-unit 869 8106
export function itemQuantityReviewRequestFromScope(scope = {}) {
  if (scope.requestId) {
    const byId = requests.find((row) => row.id === scope.requestId);
    if (byId) return byId;
  }
  const selected = selectedReviewRequest();
  if (selected && (!scope.item || normalize(selected.name) === normalize(scope.item)) && (!scope.project || selected.project === scope.project)) return selected;
  return requests.find((row) =>
    (!scope.project || row.project === scope.project)
    && (!scope.item || normalize(row.name) === normalize(scope.item))
    && stationBreakdownHasDemand(row)
  ) || null;
}
// @end-legacy-unit 869

// @legacy-unit 870 8120
export function itemQuantityReviewScopeForClick(scope = {}) {
  const row = itemQuantityReviewRequestFromScope(scope);
  if (!row) return null;
  return {
    requestId: row.id,
    project: row.project || scope.project || "",
    item: row.name || scope.item || "",
    spec: userVisibleItemDetail(row) || itemDetail(row) || "",
    phase: scope.phase || "",
    unit: scope.unit || "",
    station: scope.station || "",
    source: scope.source || "",
  };
}
// @end-legacy-unit 870

// @legacy-unit 871 8135
export function itemQuantityReviewRows(row) {
  return stationBreakdownRowsForDetail(row)
    .filter((entry) => stationBreakdownRowTotal(entry) > 0)
    .sort((left, right) => `${stationBreakdownPhaseKey(left)} ${left.station || left.demandUnit || ""}`.localeCompare(`${stationBreakdownPhaseKey(right)} ${right.station || right.demandUnit || ""}`));
}
// @end-legacy-unit 871

// @legacy-unit 872 8141
export function itemQuantityReviewPhaseTotal(row, stage, stationOrUnit = "") {
  return stationBreakdownRowsForDetail(row).reduce((sum, entry) => {
    if (stationBreakdownPhaseKey(entry) !== stage) return sum;
    const entryKey = demandTypeFor(entry) === DEMAND_TYPE_MFG ? entry.station : managerQuantityEntryUnit({ ...entry, request: row });
    if (stationOrUnit && entryKey !== stationOrUnit) return sum;
    return sum + stationBreakdownRowTotal(entry);
  }, 0);
}
// @end-legacy-unit 872

// @legacy-unit 873 8150
export function itemQuantityReviewColumns(row) {
  return quantityReviewColumnsForMode(itemQuantityReviewMode(row));
}
// @end-legacy-unit 873

// @legacy-unit 874 8154
export function itemQuantityReviewMode(row, scope = activeItemQuantityReview || {}) {
  if (scope.reviewMode) return quantityReviewModeValue(scope.reviewMode);
  if (scope.station) return DEMAND_TYPE_MFG;
  if (scope.unit && scope.unit !== "MFG") return DEMAND_TYPE_NON_MFG;
  const hasMfg = stationBreakdownRowsForDetail(row).some((entry) => demandTypeFor(entry) === DEMAND_TYPE_MFG);
  return hasMfg ? DEMAND_TYPE_MFG : DEMAND_TYPE_NON_MFG;
}
// @end-legacy-unit 874

// @legacy-unit 875 8162
export function itemQuantityReviewCellEntries(row, phase, column, mode = itemQuantityReviewMode(row)) {
  const reviewMode = quantityReviewModeValue(mode);
  return stationBreakdownRowsForDetail(row).filter((entry) => {
    if (stationBreakdownPhaseKey(entry) !== phase) return false;
    if (demandTypeFor(entry) !== reviewMode) return false;
    if (reviewMode === DEMAND_TYPE_MFG) return (entry.station || STATION_MASTER[0]) === column;
    return managerQuantityEntryUnit({ ...entry, request: row }) === column;
  });
}
// @end-legacy-unit 875

// @legacy-unit 876 8172
export function itemQuantityReviewCellValue(row, phase, column, mode = itemQuantityReviewMode(row)) {
  return itemQuantityReviewCellEntries(row, phase, column, mode)
    .reduce((sum, entry) => sum + stationBreakdownRowTotal(entry), 0);
}
// @end-legacy-unit 876

// @legacy-unit 877 8177
export function itemQuantityReviewCellTitle(row, phase, column, mode = itemQuantityReviewMode(row)) {
  const rows = stationBreakdownRowsForDetail(row).filter((entry) => {
    if (stationBreakdownPhaseKey(entry) !== phase) return false;
    if (demandTypeFor(entry) !== quantityReviewModeValue(mode)) return false;
    if (demandTypeFor(entry) === DEMAND_TYPE_MFG) return (entry.station || STATION_MASTER[0]) === column;
    return managerQuantityEntryUnit({ ...entry, request: row }) === column;
  });
  if (!rows.length) return `${STAGE_LABELS[phase]} / ${column}: 0`;
  return rows.map((entry) => `${STAGE_LABELS[phase]} / ${column}: ${stationBreakdownRowTotal(entry)} qty${entry.remark ? ` / ${entry.remark}` : ""}`).join("\n");
}
// @end-legacy-unit 877

// @legacy-unit 878 8188
export function itemQuantityReviewExcelRow(row, scope = {}) {
  const reviewMode = itemQuantityReviewMode(row, scope);
  const columns = quantityReviewColumnsForMode(reviewMode);
  const highlightedPhase = scope.phase || "";
  const highlightedKey = reviewMode === DEMAND_TYPE_MFG ? (scope.station || "") : (scope.unit || "");
  const modeButtons = [DEMAND_TYPE_MFG, DEMAND_TYPE_NON_MFG].map((mode) => `
    <button type="button" class="segmented-btn ${reviewMode === mode ? "active" : ""}" data-item-quantity-review-mode="${htmlAttr(mode)}" aria-pressed="${reviewMode === mode ? "true" : "false"}">${mode}</button>
  `).join("");
  return `
    <div class="item-quantity-edit-toolbar">
      <div class="segmented-control" role="group" aria-label="Item quantity review mode">${modeButtons}</div>
      <span class="status-pill info">${quantityReviewModeLabel(reviewMode)} direct edit</span>
    </div>
    <div class="table-wrap table-shell item-quantity-review-shell">
      <table class="data-table table-fixed matrix-table item-quantity-review-table" data-layout-managed="manual">
        <colgroup>
          <col class="item-review-col-item" />
          ${STAGES.map(() => `<col class="item-review-col-qty" />`).join("")}
          <col class="item-review-col-total" />
        </colgroup>
        <thead>
          <tr>
            <th class="item-review-sticky item-review-item-head">${reviewMode === DEMAND_TYPE_MFG ? "Station" : "Dept / Unit"}</th>
            ${STAGES.map((stage) => `<th class="item-review-phase-head">${STAGE_LABELS[stage]}</th>`).join("")}
            <th>Total Qty</th>
          </tr>
        </thead>
        <tbody>
          ${columns.map((column) => {
            const rowTotal = STAGES.reduce((sum, stage) => sum + itemQuantityReviewCellValue(row, stage, column, reviewMode), 0);
            return `
              <tr>
                <td class="cell-identity item-review-sticky item-review-item-cell"><strong>${htmlText(column)}</strong></td>
                ${STAGES.map((stage) => {
                  const entries = itemQuantityReviewCellEntries(row, stage, column, reviewMode);
                  const value = entries.reduce((sum, entry) => sum + stationBreakdownRowTotal(entry), 0);
                  const highlighted = highlightedPhase === stage && (!highlightedKey || highlightedKey === column);
                  return `<td class="cell-number item-review-qty-cell ${highlighted ? "active" : ""}" title="${htmlAttr(itemQuantityReviewCellTitle(row, stage, column, reviewMode))}">
                    <input class="item-quantity-edit-input" type="number" min="0" step="1" value="${value || 0}" data-item-quantity-review-input data-before-qty="${value || 0}" data-row-ids="${htmlAttr(entries.map((entry) => entry.id || "").filter(Boolean).join(","))}" data-demand-type="${htmlAttr(reviewMode)}" data-phase="${htmlAttr(stage)}" data-station="${reviewMode === DEMAND_TYPE_MFG ? htmlAttr(column) : ""}" data-demand-unit="${reviewMode === DEMAND_TYPE_NON_MFG ? htmlAttr(column) : ""}" aria-label="${htmlAttr(`${quantityReviewModeLabel(reviewMode)} ${column} ${STAGE_LABELS[stage]} quantity`)}" />
                  </td>`;
                }).join("")}
                <td class="cell-number shared-total-highlight shared-total-highlight--cell"><strong>${rowTotal || ""}</strong></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 878

// @legacy-unit 879 8237
export function itemQuantityReviewDraftRows(row) {
  const draft = itemReviewDraft(row);
  if (!draft.length) return `<tr><td colspan="8" class="empty-cell">No staged row action. Edit quantity cells above, then choose Save Direct Edit.</td></tr>`;
  return draft.map((entry, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><span class="status-pill ${entry.action === "delete" ? "rejected" : entry.action === "add" ? "approved" : "info"}">${htmlText(entry.action)}</span></td>
      <td>${htmlText(stageLabel(entry.phase))}</td>
      <td>${htmlText(entry.station || "-")}</td>
      <td>${htmlText(entry.demandUnit || "-")}</td>
      <td>${htmlText(entry.beforeQty ?? "-")} → <strong>${htmlText(entry.afterQty ?? "-")}</strong></td>
      <td><div class="clamped-cell" title="${htmlAttr(entry.note || "")}">${htmlText(entry.note || "-")}</div></td>
      <td><button class="mini reject" type="button" data-item-quantity-remove-draft="${index}">Del</button></td>
    </tr>`).join("");
}
// @end-legacy-unit 879

// @legacy-unit 880 8253
export function itemQuantityReviewAuditRows(row) {
  const history = itemReviewHistory(row);
  if (!history.length) return `<tr><td colspan="5" class="empty-cell">No item-level direct edit or decision audit yet.</td></tr>`;
  return history.slice().reverse().map((entry) => `
    <tr>
      <td>${htmlText(entry.type || "audit")}</td>
      <td>${htmlText(entry.action || entry.decision || "-")}</td>
      <td>${htmlText(entry.actor || "-")}</td>
      <td>${entry.at ? compactDateTime(entry.at) : "-"}</td>
      <td><div class="clamped-cell" title="${htmlAttr(entry.note || "")}">${htmlText(entry.note || "-")}</div></td>
    </tr>`).join("");
}
// @end-legacy-unit 880

// @legacy-unit 881 8266
export function renderItemQuantityReviewModal() {
  if (!activeItemQuantityReview) return;
  const row = requests.find((item) => item.id === activeItemQuantityReview.requestId);
  const modal = document.getElementById("itemQuantityReviewModal");
  if (!row || !modal) return;
  const scope = { ...activeItemQuantityReview, item: row.name, project: row.project };
  const reviewMode = itemQuantityReviewMode(row, scope);
  document.getElementById("itemQuantityReviewTitle").textContent = `${row.name} / ${quantityReviewModeLabel(reviewMode)} Direct Quantity Edit`;
  document.getElementById("itemQuantityReviewSubtitle").textContent = `${row.id || "-"} · ${row.project || "-"} · ${scope.phase ? STAGE_LABELS[scope.phase] : "All phases"} · ${reviewMode === DEMAND_TYPE_MFG ? "station rows" : "department / unit rows"}`;
  const price = managerQuantityResolvePrice([managerQuantityPriceCandidate(row)]);
  document.getElementById("itemQuantityReviewSummary").innerHTML = `
    <div class="item-quantity-compact-summary">
      <span><strong>Request ID</strong>${htmlText(row.id || "-")}</span>
      <span><strong>Demand Dept</strong>${htmlText(rowDemandDepartment(row) || "-")}</span>
      <span><strong>Total Qty</strong>${htmlText(totalQty(row))}</span>
      <span><strong>Est. Amount</strong>${price.unitPrice ? formatMoneyFromUsd(price.unitPrice * totalQty(row)) : "-"}</span>
    </div>`;
  document.getElementById("itemQuantityReviewBody").innerHTML = `
    <section class="work-panel detail-subsection item-quantity-review-panel">
      <div class="panel-title section-head-tight">
        <div>
          <h4>${quantityReviewModeLabel(reviewMode)} Editable Matrix</h4>
	          <p class="panel-subcopy">Edit quantity cells here. Save Direct Edit writes official demand quantity and records audit metadata.</p>
        </div>
        <span class="status-pill ${itemReviewPendingProposal(row) ? "warning" : "info"}">${itemReviewPendingProposal(row) ? "Proposal Draft" : "Official Qty"}</span>
      </div>
      ${itemQuantityReviewExcelRow(row, scope)}
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
	          <h4>Direct Edit Staging</h4>
	          <p class="panel-subcopy">Current edits stay staged in this popup until Save Direct Edit is selected.</p>
        </div>
      </div>
      <div class="table-wrap table-shell compact-wrap">
        <table class="data-table item-quantity-proposal-table">
          <thead><tr><th>#</th><th>Action</th><th>Phase</th><th>Station</th><th>Dept / Unit</th><th>Qty</th><th>Note</th><th>Remove</th></tr></thead>
          <tbody>${itemQuantityReviewDraftRows(row)}</tbody>
        </table>
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Item Audit</h4></div>
      <div class="table-wrap table-shell compact-wrap">
        <table class="data-table item-quantity-audit-table">
          <thead><tr><th>Type</th><th>Action</th><th>Actor</th><th>Time</th><th>Note</th></tr></thead>
          <tbody>${itemQuantityReviewAuditRows(row)}</tbody>
        </table>
      </div>
    </section>`;
  const approveButton = modal.querySelector('[data-action="approveItemQuantityReview"]');
  if (approveButton) {
    approveButton.disabled = itemReviewPendingProposal(row);
    approveButton.title = itemReviewPendingProposal(row) ? "Return or clear the proposal before approving official quantity." : "Approve official item quantity";
  }
}
// @end-legacy-unit 881

// @legacy-unit 882 8324
export function openItemQuantityReview(scope = {}) {
  const nextScope = itemQuantityReviewScopeForClick(scope);
  if (!nextScope) {
    showToast("No item quantity row is available for this cell.", "error");
    return;
  }
  replaceActiveItemQuantityReviewBinding(nextScope);
  const modal = document.getElementById("itemQuantityReviewModal");
  if (modal) modal.hidden = false;
  renderItemQuantityReviewModal();
}
// @end-legacy-unit 882

// @legacy-unit 883 8336
export function closeItemQuantityReview() {
  replaceActiveItemQuantityReviewBinding(null);
  const modal = document.getElementById("itemQuantityReviewModal");
  if (modal) modal.hidden = true;
}
// @end-legacy-unit 883

// @legacy-unit 884 8342
export function itemQuantityPrompt(message, fallback = "") {
  return window.prompt ? window.prompt(message, fallback) : fallback;
}
// @end-legacy-unit 884

// @legacy-unit 885 8346
export function itemQuantityReviewInputChanges() {
  const modal = document.getElementById("itemQuantityReviewModal");
  if (!modal || !activeItemQuantityReview?.requestId) return [];
  const now = new Date().toISOString();
  return [...modal.querySelectorAll("[data-item-quantity-review-input]")]
    .map((input) => {
      const beforeQty = clampQty(input.dataset.beforeQty || 0);
      const afterQty = clampQty(input.value || 0);
      if (beforeQty === afterQty) return null;
      const demandType = quantityReviewModeValue(input.dataset.demandType || DEMAND_TYPE_MFG);
      return {
        id: `IQP-INPUT-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action: beforeQty <= 0 && afterQty > 0 ? "add" : afterQty <= 0 ? "delete" : "edit",
        aggregateKey: true,
        rowIds: String(input.dataset.rowIds || "").split(",").filter(Boolean),
        demandType,
        phase: input.dataset.phase || "",
        station: demandType === DEMAND_TYPE_MFG ? (input.dataset.station || STATION_MASTER[0]) : "",
        demandUnit: demandType === DEMAND_TYPE_NON_MFG ? (input.dataset.demandUnit || DEMAND_UNIT_FALLBACK) : "",
        beforeQty,
        afterQty,
        note: "",
        proposedBy: itemReviewActor(),
        proposedAt: now,
      };
    })
    .filter(Boolean);
}
// @end-legacy-unit 885

// @legacy-unit 886 8375
export function itemQuantityProposalDefaults(row, action) {
  const scope = activeItemQuantityReview || {};
  const rows = itemQuantityReviewRows(row);
  const matching = rows.find((entry) => {
    if (scope.phase && stationBreakdownPhaseKey(entry) !== scope.phase) return false;
    if (scope.station && entry.station !== scope.station) return false;
    if (scope.unit && managerQuantityEntryUnit({ ...entry, request: row }) !== scope.unit) return false;
    return true;
  }) || rows[0] || {};
  const demandType = demandTypeFor(matching) || (scope.station ? DEMAND_TYPE_MFG : DEMAND_TYPE_NON_MFG);
  const phase = scope.phase || stationBreakdownPhaseKey(matching) || currentStageForProject(row.project);
  const station = demandType === DEMAND_TYPE_MFG ? (scope.station || matching.station || STATION_MASTER[0]) : "";
  const demandUnit = demandType === DEMAND_TYPE_MFG ? "" : (scope.unit || matching.demandUnit || DEMAND_UNIT_FALLBACK);
  const beforeQty = action === "add" ? 0 : stationBreakdownRowTotal(matching);
  return { matching, demandType, phase, station, demandUnit, beforeQty };
}
// @end-legacy-unit 886

// @legacy-unit 887 8392
export function addItemQuantityProposalAction(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || !["add", "edit", "delete"].includes(action)) return;
  replaceActiveItemQuantityReviewBinding(itemQuantityReviewScopeForClick({ requestId }) || {
    requestId,
    project: row.project || "",
    item: row.name || "",
    spec: userVisibleItemDetail(row) || itemDetail(row) || "",
    phase: "",
    unit: "",
    station: "",
    source: "inline-action",
  });
  const modal = document.getElementById("itemQuantityReviewModal");
  if (modal) modal.hidden = false;
  const defaults = itemQuantityProposalDefaults(row, action);
  const qtyPrompt = action === "delete" ? "0" : itemQuantityPrompt(`Proposed qty for ${action}`, String(defaults.beforeQty || 0));
  if (qtyPrompt === null) return;
  const note = itemQuantityPrompt("Proposal note is required.", "");
  if (!String(note || "").trim()) {
    showToast("Proposal note is required.", "error");
    return;
  }
  const now = new Date().toISOString();
  const proposal = {
    id: `IQP-DRAFT-${Date.now()}`,
    action,
    rowId: defaults.matching.id || "",
    demandType: defaults.demandType,
    phase: defaults.phase,
    station: defaults.station,
    demandUnit: defaults.demandUnit,
    beforeQty: defaults.beforeQty,
    afterQty: action === "delete" ? 0 : clampQty(qtyPrompt),
    note: String(note).trim(),
    proposedBy: itemReviewActor(),
    proposedAt: now,
  };
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
    ...item,
    itemQuantityProposalDraft: [...itemReviewDraft(item), proposal],
    itemQuantityLastChangedAt: now,
    itemQuantityLastChangedBy: itemReviewActor(),
    itemQuantityLastChangeNote: proposal.note,
  } : item));
  renderItemQuantityReviewModal();
  renderManager();
  renderPriceReview();
  showToast(`${action} proposal drafted for this item.`, "success");
}
// @end-legacy-unit 887

// @legacy-unit 888 8443
export function removeItemQuantityProposalDraft(index) {
  const requestId = activeItemQuantityReview?.requestId || "";
  if (!requestId) return;
  replaceRequestsBinding(requests.map((item) => {
    if (item.id !== requestId) return item;
    return {
      ...item,
      itemQuantityProposalDraft: itemReviewDraft(item).filter((_, draftIndex) => draftIndex !== index),
    };
  }));
  renderItemQuantityReviewModal();
}
// @end-legacy-unit 888

// @legacy-unit 889 8456
export function appendItemReviewHistory(row, entry) {
  return [...itemReviewHistory(row), entry];
}
// @end-legacy-unit 889

// @legacy-unit 890 8460
export function updateItemReviewRow(requestId, updater) {
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? updater(item) : item));
  return requests.find((item) => item.id === requestId);
}
// @end-legacy-unit 890

// @legacy-unit 891 8465
export function itemReviewRejectPatch(row, note, now) {
  const actor = itemReviewActor();
  const base = {
    status: "Rejected",
    itemQuantityReviewStatus: "Item Rejected",
    itemQuantityRejectedAt: now,
    itemQuantityRejectedBy: actor,
    itemQuantityRejectReason: note,
    nextStep: "Requester revise item quantity / resubmit",
  };
  if (currentRole === "manager") {
    return {
      ...base,
      demandReviewStatus: DEMAND_REVIEW_REVISE_REQUIRED,
      demandReviewDecisionAt: now,
      demandReviewDecisionBy: actor,
      demandReviewReason: note,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_REJECTED,
      costManagerRejectedAt: now,
      costManagerRejectedBy: actor,
      costManagerRejectReason: note,
      costManagerAuthorizationReworkRequired: true,
      managerReason: note,
      decidedAt: now,
    };
  }
  if (currentRole === "projectDri") {
    return {
      ...base,
      priceApprovalStatus: PRICE_ESCALATION_REJECTED,
      priceDecisionStatus: PRICE_ESCALATION_REJECTED,
      priceEscalationRejectedAt: now,
      priceEscalationRejectedBy: actor,
      priceEscalationRejectReason: note,
      priceReviewReworkRequired: true,
    };
  }
  return {
    ...base,
    deptDriReviewStatus: DEPT_DRI_SUBMISSION_REJECTED,
    deptDriReviewRejectedAt: now,
    deptDriReviewRejectedBy: actor,
    deptDriReviewRejectReason: note,
    deptDriReviewReworkRequired: true,
    decidedAt: now,
  };
}
// @end-legacy-unit 891

// @legacy-unit 892 8513
export function returnItemQuantityReviewWithProposal() {
  const requestId = activeItemQuantityReview?.requestId || "";
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  const draft = itemReviewDraft(row);
  const inputChanges = itemQuantityReviewInputChanges();
  const proposedChanges = draft.length ? draft : inputChanges;
  if (!draft.length) {
    if (!inputChanges.length) {
      showToast("Edit at least one MFG / Non-MFG quantity cell before returning a proposal.", "error");
      return;
    }
  }
  if (!proposedChanges.length) {
    showToast("Edit at least one MFG / Non-MFG quantity cell before returning a proposal.", "error");
    return;
  }
  const note = itemQuantityPrompt("Return note is required.", row.itemQuantityLastChangeNote || "");
  if (!String(note || "").trim()) {
    showToast("Return note is required.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = itemReviewActor();
  const proposalEntry = {
    type: "proposal",
    action: "return_with_proposal",
    actor,
    at: now,
    note: String(note).trim(),
    changes: proposedChanges.map((change) => ({
      ...change,
      note: change.note || String(note).trim(),
      proposedBy: change.proposedBy || actor,
      proposedAt: change.proposedAt || now,
    })),
    status: "pending_requester_confirmation",
  };
  const latest = updateItemReviewRow(requestId, (item) => ({
    ...item,
    ...itemReviewRejectPatch(item, String(note).trim(), now),
    itemQuantityReviewStatus: "Proposal Pending Requester",
    itemQuantityProposalDraft: [],
    itemQuantityProposalHistory: [...(item.itemQuantityProposalHistory || []), proposalEntry],
    itemQuantityReviewHistory: appendItemReviewHistory(item, proposalEntry),
    itemQuantityProposalCount: itemReviewProposalCount(item) + 1,
    itemQuantityLastChangedAt: now,
    itemQuantityLastChangedBy: actor,
    itemQuantityLastChangeNote: String(note).trim(),
  }));
  addHandoffHistory(latest, "Item quantity returned with proposal", String(note).trim());
  renderDepartment();
  renderManager();
  renderPriceReview();
  closeItemQuantityReview();
  showToast("Proposal returned to Requester Action Required.", "success");
}
// @end-legacy-unit 892

// @legacy-unit 893 8571
export function saveItemQuantityReviewDirectEdit() {
  const requestId = activeItemQuantityReview?.requestId || "";
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  const draft = itemReviewDraft(row);
  const inputChanges = itemQuantityReviewInputChanges();
  const directChanges = draft.length ? draft : inputChanges;
  if (!directChanges.length) {
    showToast("Edit at least one MFG / Non-MFG quantity cell before saving.", "error");
    return;
  }
  const note = itemQuantityPrompt("Direct edit note is required.", row.itemQuantityLastChangeNote || "Reviewer direct quantity edit.");
  if (!String(note || "").trim()) {
    showToast("Direct edit note is required.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = itemReviewActor();
  const changes = directChanges.map((change) => ({
    ...change,
    note: change.note || String(note).trim(),
    editedBy: actor,
    editedAt: now,
  }));
  const latest = updateItemReviewRow(requestId, (item) => {
    const nextBreakdown = changes.reduce(
      (rows, change) => applyItemQuantityProposalChange({ ...item, stationBreakdown: rows }, change),
      stationBreakdownRowsForDetail(item)
    );
    const audit = {
      type: "direct_edit",
      action: "save_direct_edit",
      actor,
      at: now,
      note: String(note).trim(),
      changes,
      scope: activeItemQuantityReview,
      status: "applied",
    };
    return syncRowPhaseQtyFromStationBreakdown({
      ...item,
      stationBreakdown: nextBreakdown,
      itemQuantityReviewStatus: "Direct Edit Applied",
      itemQuantityProposalDraft: [],
      itemQuantityReviewHistory: appendItemReviewHistory(item, audit),
      itemQuantityChangeCount: itemReviewChangeCount(item) + changes.length,
      itemQuantityLastChangedAt: now,
      itemQuantityLastChangedBy: actor,
      itemQuantityLastChangeNote: String(note).trim(),
    });
  });
  addHandoffHistory(latest, "Item quantity directly edited", String(note).trim());
  renderDepartment();
  renderManager();
  renderPriceReview();
  closeItemQuantityReview();
  showToast("Official quantity updated and audit recorded.", "success");
}
// @end-legacy-unit 893

// @legacy-unit 894 8630
export function rejectItemQuantityReview() {
  const requestId = activeItemQuantityReview?.requestId || "";
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  const note = itemQuantityPrompt("Reject item note is required.", "");
  if (!String(note || "").trim()) {
    showToast("Reject item note is required.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = itemReviewActor();
  const audit = {
    type: "decision",
    decision: "reject_item",
    actor,
    at: now,
    note: String(note).trim(),
    scope: activeItemQuantityReview,
  };
  const latest = updateItemReviewRow(requestId, (item) => ({
    ...item,
    ...itemReviewRejectPatch(item, String(note).trim(), now),
    itemQuantityReviewHistory: appendItemReviewHistory(item, audit),
    itemQuantityProposalDraft: [],
  }));
  addHandoffHistory(latest, "Item rejected", String(note).trim());
  renderDepartment();
  renderManager();
  renderPriceReview();
  closeItemQuantityReview();
  showToast("Item rejected and returned to Requester Action Required.", "success");
}
// @end-legacy-unit 894

// @legacy-unit 895 8663
export function approveItemQuantityReview() {
  const requestId = activeItemQuantityReview?.requestId || "";
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (itemReviewPendingProposal(row)) {
    showToast("Pending proposal must be returned or cleared before approving.", "error");
    return;
  }
  if (itemQuantityReviewInputChanges().length) {
    showToast("Return the edited quantity cells as a proposal before approving.", "error");
    return;
  }
  const note = itemQuantityPrompt("Approval note is required.", "");
  if (!String(note || "").trim()) {
    showToast("Approval note is required.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = itemReviewActor();
  updateItemReviewRow(requestId, (item) => ({
    ...item,
    itemQuantityReviewStatus: "Item Approved",
    itemQuantityReviewHistory: appendItemReviewHistory(item, {
      type: "decision",
      decision: "approve",
      actor,
      at: now,
      note: String(note).trim(),
      scope: activeItemQuantityReview,
    }),
    itemQuantityLastChangedAt: now,
    itemQuantityLastChangedBy: actor,
    itemQuantityLastChangeNote: String(note).trim(),
  }));
  if (currentRole === "manager") applyCostManagerAuthorization(requestId, "approve");
  else if (["dri", "projectDri"].includes(currentRole)) applyPriceReviewDecision(requestId, "approve");
  else showToast("Current role cannot approve this item quantity.", "error");
  closeItemQuantityReview();
}
// @end-legacy-unit 895
