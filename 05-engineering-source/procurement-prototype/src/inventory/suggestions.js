// inventory/suggestions: authoritative source; see docs/module-map.md.
import {
  reusableHistoryRows
} from "../catalog/history-view.js";
import {
  amountUsdFromVnd,
  formatCompactCurrencyFromUsd
} from "../cost/currency.js";
import {
  renderManagerDemandCostDashboard
} from "../cost/dashboard-view.js";
import {
  normalizeDemandBreakdownCarryover,
  syncUserAppliedCarryoverLedger,
  userCarryoverUnitPriceVnd
} from "../demand/editor.js";
import {
  createStationBreakdownEntry,
  demandTypeFor,
  stationBreakdownRowsForDetail,
  syncRowPhaseQtyFromStationBreakdown,
  totalQty
} from "../demand/quantity.js";
import {
  canRequesterEditRequest
} from "../demand/request-fields.js";
import {
  renderSelectedDemandLines,
  selectedDemandLineContext,
  selectedDemandLineRows
} from "../demand/selected-lines.js";
import {
  lastDemandType,
  lastRequestPhase,
  lastRequestProject,
  replaceLastDemandTypeBinding,
  replaceLastRequestPhaseBinding,
  replaceLastRequestProjectBinding,
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderRequestRows
} from "../demand/worksheet-actions.js";
import {
  activePhaseText
} from "../demand/worksheet-view.js";
import {
  createWarehouseUseCandidate,
  warehouseInventoryRows,
  warehouseMonthForDemand,
  warehouseRecordKey,
  warehouseTraceText
} from "./warehouse.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  STAGES,
  currentStageForProject,
  nextBuyStageForProject
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 527 3612
export function requestCarryoverProject() {
  return lastRequestProject || currentProject;
}
// @end-legacy-unit 527

// @legacy-unit 528 3616
export function requestCarryoverPhase(project = requestCarryoverProject()) {
  return STAGES.includes(lastRequestPhase) ? lastRequestPhase : nextBuyStageForProject(project) || currentStageForProject(project);
}
// @end-legacy-unit 528

// @legacy-unit 529 3620
export function updateRequestCarryover({ project, phase, demandType } = {}) {
  if (project) replaceLastRequestProjectBinding(project);
  else replaceLastRequestProjectBinding(currentProject);
  if (STAGES.includes(phase)) replaceLastRequestPhaseBinding(phase);
  else if (!STAGES.includes(lastRequestPhase)) replaceLastRequestPhaseBinding(nextBuyStageForProject(lastRequestProject) || currentStageForProject(lastRequestProject));
  if (demandType) replaceLastDemandTypeBinding(demandTypeFor({ demandType }));
}
// @end-legacy-unit 529

// @legacy-unit 535 3736
export function requestLineNumber(line = "") {
  const match = String(line || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}
// @end-legacy-unit 535

// @legacy-unit 536 3741
export function previousRequestLine(line = "") {
  const number = requestLineNumber(line);
  return number > 1 ? `Line ${number - 1}` : "";
}
// @end-legacy-unit 536

// @legacy-unit 537 3746
export function selectedDemandLineMatchKey(row) {
  return warehouseRecordKey(row?.name || "", userVisibleItemDetail(row) || itemDetail(row) || "");
}
// @end-legacy-unit 537

// @legacy-unit 538 3750
export function previousLineSuggestionForSelectedRow(row, context) {
  const sourceLine = previousRequestLine(context.requestLine);
  if (!sourceLine || !context.qty) return null;
  const itemKey = selectedDemandLineMatchKey(row);
  const source = reusableHistoryRows().find((record) => {
    const recordKey = warehouseRecordKey(record.name || "", userVisibleItemDetail(record) || itemDetail(record) || "");
    const recordLine = record.requestLine || record.line || sourceLine;
    return recordKey === itemKey && (!recordLine || recordLine === sourceLine);
  });
  if (!source) return null;
  const availableQty = totalQty(source);
  const suggestedQty = Math.min(context.qty, availableQty);
  if (!suggestedQty) return null;
  return {
    id: `${row.id}::previous-line`,
    requestId: row.id,
    sourceType: "previous-line",
    sourceProject: source.project || row.project || "",
    targetProject: row.project || "",
    sourceStage: activePhaseText(source),
    sourceStation: source.station || source.stationOrUnit || "",
    sourceRequestId: source.id || "",
    sourceLabel: `${source.project || row.project} ${sourceLine}`,
    sourceTrace: `${source.project || row.project} / ${sourceLine} / ${activePhaseText(source)} / ${source.id || "-"}`,
    targetLabel: `${row.project || "-"} / ${context.requestLine} / ${context.stageLabel || context.phase || ""}`.trim(),
    itemName: row.name || "",
    itemSpec: userVisibleItemDetail(row) || itemDetail(row) || "",
    availableQty,
    suggestedQty,
    costSavingUsd: amountUsdFromVnd(userCarryoverUnitPriceVnd(row)) * suggestedQty,
    carryoverFrom: sourceLine,
    requestLine: context.requestLine,
    reason: `${sourceLine} reusable quantity can cover part of ${context.requestLine}.`,
  };
}
// @end-legacy-unit 538

// @legacy-unit 539 3786
export function warehouseSuggestionForSelectedRow(row, context) {
  if (!context.qty) return null;
  const month = warehouseMonthForDemand(row);
  const itemKey = selectedDemandLineMatchKey(row);
  const inventory = warehouseInventoryRows(month).find((item) => warehouseRecordKey(item.item, item.spec) === itemKey);
  if (!inventory || inventory.availableQty <= 0) return null;
  const source = inventory.topSource || inventory.stockSources?.[0] || {};
  const suggestedQty = Math.min(context.qty, inventory.availableQty);
  if (!suggestedQty) return null;
  return {
    id: `${row.id}::warehouse`,
    requestId: row.id,
    sourceType: "warehouse",
    sourceProject: source.sourceProject || "",
    targetProject: row.project || "",
    sourceStage: source.sourceStage || "",
    sourceStation: source.sourceStation || source.sourceStationOrUnit || "",
    sourceRequestId: source.sourceRequestId || "",
    sourceLabel: `${month} inventory`,
    sourceTrace: warehouseTraceText(inventory),
    targetLabel: `${row.project || "-"} / ${context.requestLine} / ${context.stageLabel || context.phase || ""}`.trim(),
    itemName: row.name || "",
    itemSpec: userVisibleItemDetail(row) || itemDetail(row) || "",
    availableQty: inventory.availableQty,
    suggestedQty,
    costSavingUsd: amountUsdFromVnd(userCarryoverUnitPriceVnd(row)) * suggestedQty,
    carryoverFrom: source.sourceLine || "Warehouse",
    requestLine: context.requestLine,
    reason: `Warehouse inventory for ${month}: ${suggestedQty} pcs can be reviewed by Dept DRI before use.`,
  };
}
// @end-legacy-unit 539

// @legacy-unit 540 3818
export function carryoverSuggestionsForSelectedLines() {
  return selectedDemandLineRows().flatMap((row) => {
    const context = selectedDemandLineContext(row);
    return [
      previousLineSuggestionForSelectedRow(row, context),
      warehouseSuggestionForSelectedRow(row, context),
    ].filter(Boolean);
  });
}
// @end-legacy-unit 540

// @legacy-unit 541 3828
export function renderItemPickerCarryoverSuggestions() {
  const root = document.getElementById("itemPickerCarryoverSuggestions");
  if (!root) return;
  const rows = selectedDemandLineRows();
  const suggestions = carryoverSuggestionsForSelectedLines();
  if (!rows.length) {
    root.innerHTML = `
      <div class="carryover-suggestions-empty">
        <strong>Potential Carryover</strong>
        <span>Add an item and qty first. Suggestions will appear when previous-line or warehouse evidence matches.</span>
      </div>`;
    return;
  }
  if (!suggestions.length) {
    root.innerHTML = `
      <div class="carryover-suggestions-empty">
        <strong>Potential Carryover</strong>
        <span>No reusable quantity matches the selected demand lines yet.</span>
      </div>`;
    return;
  }
  root.innerHTML = `
    <div class="carryover-suggestion-head">
      <div>
        <strong>Potential Carryover</strong>
        <span>Create a stock or previous-line candidate. Dept DRI confirms before the evidence is locked for cost impact.</span>
      </div>
      <span class="status-pill warning">Dept DRI confirmation required</span>
    </div>
    <div class="carryover-suggestion-grid">
      ${suggestions.map((item) => {
        const relation = item.sourceProject && item.targetProject && item.sourceProject !== item.targetProject ? "Cross Project" : "Same Project";
        return `
        <article class="carryover-suggestion-card ${item.sourceType === "warehouse" ? "warehouse" : "previous"}" title="${htmlAttr(item.sourceTrace)}">
          <div class="carryover-suggestion-source">
            <div class="carryover-suggestion-titleline">
              <strong>${htmlText(item.itemName || item.sourceLabel)}</strong>
              <span class="carryover-source-badge ${relation === "Cross Project" ? "cross" : "same"}">${relation}</span>
            </div>
            <span>${htmlText(item.sourceLabel)} · ${item.sourceType === "warehouse" ? "Inventory available" : "Previous line"}</span>
            <small>${htmlText(item.targetLabel || "")}</small>
          </div>
          <div class="carryover-suggestion-metrics">
            <span><strong>${item.availableQty}</strong><small>available</small></span>
            <span><strong>${item.suggestedQty}</strong><small>candidate</small></span>
            <span><strong>${formatCompactCurrencyFromUsd(item.costSavingUsd)}</strong><small>potential</small></span>
          </div>
          <button class="mini approve" data-create-carryover-candidate="${htmlAttr(item.id)}" title="Create carryover candidate for Dept DRI confirmation">Create Candidate</button>
        </article>`;
      }).join("")}
    </div>`;
}
// @end-legacy-unit 541

// @legacy-unit 542 3881
export function createCarryoverCandidate(suggestionId) {
  const suggestion = carryoverSuggestionsForSelectedLines().find((item) => item.id === suggestionId);
  if (!suggestion) {
    showToast("Carryover suggestion is no longer available for the current scope.", "error");
    return;
  }
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== suggestion.requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row);
    const first = stationBreakdown[0] || createStationBreakdownEntry(row);
    const nextFirst = normalizeDemandBreakdownCarryover({
      ...first,
      requestLine: suggestion.requestLine,
      carryoverFrom: suggestion.carryoverFrom,
      carryoverQty: suggestion.suggestedQty,
      carryoverReason: suggestion.reason,
      carryoverSourceType: suggestion.sourceType,
      carryoverSourceProject: suggestion.sourceProject || "",
      carryoverSourceStage: suggestion.sourceStage || "",
      carryoverSourceStation: suggestion.sourceStation || "",
      carryoverSourceRequestId: suggestion.sourceRequestId || "",
    });
    const nextRows = [nextFirst, ...stationBreakdown.slice(1)];
    const nextRow = syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown: nextRows });
    syncUserAppliedCarryoverLedger(nextRow, nextFirst);
    createWarehouseUseCandidate(suggestion, nextRow, nextFirst);
    return nextRow;
  }));
  renderSelectedDemandLines();
  renderRequestRows();
  if (typeof renderManagerDemandCostDashboard === "function") renderManagerDemandCostDashboard();
  showToast("Carryover candidate created. Dept DRI must confirm before it affects cost.", "success");
}
// @end-legacy-unit 542

// @legacy-unit 543 3915
export function applyCarryoverSuggestion(suggestionId) {
  createCarryoverCandidate(suggestionId);
}
// @end-legacy-unit 543
