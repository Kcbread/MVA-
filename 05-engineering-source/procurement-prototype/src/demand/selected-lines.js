// demand/selected-lines: authoritative source; see docs/module-map.md.
import {
  itemPickerDemandContext,
  itemPickerTargetText
} from "../catalog/context.js";
import {
  normalizeDemandBreakdownCarryover,
  syncUserAppliedCarryoverLedger
} from "./editor.js";
import {
  normalizeRequestAction,
  normalizeRequestIntentFields
} from "./intent.js";
import {
  clampQty,
  createStationBreakdownEntry,
  demandTypeFor,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail,
  syncRowPhaseQtyFromStationBreakdown
} from "./quantity.js";
import {
  canRequesterEditRequest
} from "./request-fields.js";
import {
  replaceRequestsBinding,
  requests
} from "./state.js";
import {
  requestRowMatchesInputContext
} from "./worksheet.js";
import {
  renderRequestRows
} from "./worksheet-actions.js";
import {
  renderItemPickerCarryoverSuggestions,
  requestCarryoverPhase
} from "../inventory/suggestions.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_UNIT_FALLBACK,
  REQUEST_ACTION_OTHER,
  STATION_MASTER,
  rowMatchesCurrentRequesterProjectScope
} from "../projects/config.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr
} from "../shared/html.js";

// @legacy-unit 975 10717
export function selectedDemandLineRows() {
  const context = itemPickerDemandContext();
  return requests.filter((row) => rowMatchesCurrentRequesterProjectScope(row) && row.status === "Draft" && canRequesterEditRequest(row) && requestRowMatchesInputContext(row, context));
}
// @end-legacy-unit 975

// @legacy-unit 976 10722
export function selectedDemandLineContext(row) {
  const firstLine = stationBreakdownRowsForDetail(row)[0] || createStationBreakdownEntry(row);
  const demandType = demandTypeFor(firstLine);
  const stationOrUnit = demandType === DEMAND_TYPE_MFG
    ? (firstLine.station || row.station || STATION_MASTER[0])
    : (firstLine.demandUnit || row.demandUnit || DEMAND_UNIT_FALLBACK);
  return {
    demandType,
    phase: stationBreakdownPhaseKey(firstLine) || requestCarryoverPhase(row.project),
    requestLine: firstLine.requestLine || row.requestLine || "Line 1",
    stationOrUnit,
    qty: stationBreakdownRowTotal(firstLine),
    remark: firstLine.remark || "",
    breakdownId: firstLine.id || "",
  };
}
// @end-legacy-unit 976

// @legacy-unit 977 10739
export function renderSelectedDemandLines() {
  const body = document.getElementById("itemPickerSelectedDemandLines");
  const footer = document.getElementById("itemPickerFooterContext");
  if (footer) footer.textContent = itemPickerTargetText();
  if (!body) return;
  const rows = selectedDemandLineRows();
  body.innerHTML = rows.length ? rows.map((row) => {
    const context = selectedDemandLineContext(row);
    const scopeText = `${context.demandType} / ${context.requestLine} / ${stageLabel(context.phase)} / ${context.stationOrUnit}`;
    return `
      <tr data-selected-demand-line="${htmlAttr(row.id)}">
        <td class="cell-identity" title="${htmlAttr(scopeText)}">
          <div class="identity-block">
            <span class="identity-primary">${context.demandType} · ${stageLabel(context.phase)}</span>
            <span class="identity-secondary">${context.requestLine} · ${context.stationOrUnit}</span>
          </div>
        </td>
        <td class="cell-identity" title="${htmlAttr(`${row.name || "-"} / ${userVisibleItemDetail(row) || itemDetail(row) || ""}`)}">
          <div class="identity-block">
            <span class="identity-primary">${row.name || "-"}</span>
            <span class="identity-secondary">${userVisibleItemDetail(row) || itemDetail(row) || "-"}</span>
          </div>
        </td>
        <td class="cell-note-summary"><div class="note-summary">${context.qty ? `${context.qty} saved in worksheet` : "Qty starts at 0"}</div></td>
        <td class="cell-action">
          <div class="action-stack">
            <button class="mini reject" title="Remove demand line" data-remove-selected-demand="${htmlAttr(row.id)}">Remove</button>
          </div>
        </td>
      </tr>`;
  }).join("") : `<tr><td colspan="4" class="empty-cell">Choose a demand scope, then add catalog, reused, package, or carryover items here.</td></tr>`;
  renderItemPickerCarryoverSuggestions();
}
// @end-legacy-unit 977

// @legacy-unit 978 10773
export function updateSelectedDemandLine(requestId, field, value) {
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    if (field === "needDate") {
      const dateValue = String(value || "").trim();
      return { ...row, needDate: dateValue, requiredDeliveryDate: dateValue || row.requiredDeliveryDate };
    }
    const stationBreakdown = stationBreakdownRowsForDetail(row);
    const first = stationBreakdown[0] || createStationBreakdownEntry(row);
    const nextFirst = { ...first };
    if (field === "qty") nextFirst.qty = clampQty(value);
    if (field === "remark") nextFirst.remark = value;
    const nextRows = [normalizeDemandBreakdownCarryover(nextFirst), ...stationBreakdown.slice(1)];
    const nextRow = syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown: nextRows });
    syncUserAppliedCarryoverLedger(nextRow, nextRows[0]);
    return nextRow;
  }));
  renderSelectedDemandLines();
  renderRequestRows();
}
// @end-legacy-unit 978

// @legacy-unit 979 10794
export function updateRequestIntentAction(requestId, value) {
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const requestAction = normalizeRequestAction(value);
    return normalizeRequestIntentFields({
      ...row,
      requestAction,
      action: requestAction,
      requestActionOtherText: requestAction === REQUEST_ACTION_OTHER ? row.requestActionOtherText : "",
    });
  }));
  renderRequestRows();
  renderSelectedDemandLines();
}
// @end-legacy-unit 979

// @legacy-unit 980 10809
export function updateRequestIntentOtherText(requestId, value) {
  replaceRequestsBinding(requests.map((row) => row.id === requestId && canRequesterEditRequest(row)
    ? normalizeRequestIntentFields({
      ...row,
      requestAction: REQUEST_ACTION_OTHER,
      action: REQUEST_ACTION_OTHER,
      requestActionOtherText: String(value || "").slice(0, 80),
    })
    : row));
}
// @end-legacy-unit 980
