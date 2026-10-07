// demand/worksheet: authoritative source; see docs/module-map.md.
import {
  quantityReviewModeLabel
} from "../approval/quantity-scope.js";
import {
  itemPickerDemandContext
} from "../catalog/context.js";
import {
  normalizeDemandBreakdownCarryover
} from "./editor.js";
import {
  clampQty,
  createStationBreakdownEntry,
  demandTypeFor,
  demandUnitFor,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail,
  syncRowPhaseQtyFromStationBreakdown
} from "./quantity.js";
import {
  activeProjectRequests,
  canRequesterEditRequest
} from "./request-fields.js";
import {
  renderSelectedDemandLines
} from "./selected-lines.js";
import {
  replaceRequestsBinding,
  requestWorksheetActiveCell,
  requestWorksheetAddPhase,
  requestWorksheetLine,
  requestWorksheetMode,
  requests
} from "./state.js";
import {
  renderSubmissionRows
} from "./submission-view.js";
import {
  renderRequestRows
} from "./worksheet-actions.js";
import {
  requestWorksheetColumns,
  syncRequestWorksheetContext
} from "./worksheet-view.js";
import {
  renderWarehouseMaintenance
} from "../inventory/warehouse.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  STAGES,
  STATION_MASTER,
  rowMatchesCurrentRequesterProjectScope
} from "../projects/config.js";
import {
  normalizeRequestDemandDepartment
} from "../session/persona.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr
} from "../shared/html.js";

// @legacy-unit 997 11018
export function applyRequestWorksheetActiveState() {
  document.querySelectorAll("#requestRows tr").forEach((row) => row.classList.remove("active-row"));
  document.querySelectorAll(".request-matrix-cell").forEach((cell) => cell.classList.remove("active-cell"));
  if (!requestWorksheetActiveCell.requestId) return;
  document.querySelector(`#requestRows tr[data-request-row="${CSS.escape(requestWorksheetActiveCell.requestId)}"]`)?.classList.add("active-row");
  const selector = `[data-request-worksheet-qty="${CSS.escape(requestWorksheetActiveCell.requestId)}"][data-request-worksheet-phase="${CSS.escape(requestWorksheetActiveCell.phase || "")}"][data-request-worksheet-column="${CSS.escape(requestWorksheetActiveCell.column || "")}"]`;
  document.querySelector(selector)?.closest(".request-matrix-cell")?.classList.add("active-cell");
}
// @end-legacy-unit 997

// @legacy-unit 998 11027
export function requestInputContextKey(context = itemPickerDemandContext()) {
  const target = context.demandType === DEMAND_TYPE_MFG ? context.station : context.demandUnit;
  return `${context.requestLine || "Line 1"}|||${context.demandType}|||${target || ""}`;
}
// @end-legacy-unit 998

// @legacy-unit 999 11032
export function requestBreakdownContextKey(item = {}) {
  const demandType = demandTypeFor(item);
  const target = demandType === DEMAND_TYPE_MFG ? (item.station || STATION_MASTER[0]) : demandUnitFor(item);
  return `${item.requestLine || "Line 1"}|||${demandType}|||${target || ""}`;
}
// @end-legacy-unit 999

// @legacy-unit 1000 11038
export function requestWorksheetBreakdownMatches(item, { mode = requestWorksheetMode, requestLine = requestWorksheetLine, column = "" } = {}) {
  if ((item.requestLine || "Line 1") !== (requestLine || "Line 1")) return false;
  if (demandTypeFor(item) !== mode) return false;
  if (!column) return true;
  return mode === DEMAND_TYPE_MFG ? item.station === column : demandUnitFor(item) === column;
}
// @end-legacy-unit 1000

// @legacy-unit 1001 11045
export function requestNeedDateScopeLabel({ requestLine = requestWorksheetLine, mode = requestWorksheetMode } = {}) {
  return `${quantityReviewModeLabel(mode)} / ${requestLine || "Line 1"}`;
}
// @end-legacy-unit 1001

// @legacy-unit 1002 11049
export function requestBreakdownMatchesScope(item, { mode = requestWorksheetMode, requestLine = requestWorksheetLine } = {}) {
  return requestWorksheetBreakdownMatches(item, { mode, requestLine });
}
// @end-legacy-unit 1002

// @legacy-unit 1003 11053
export function requestRowMatchesSubmitScope(row, { mode = requestWorksheetMode, requestLine = requestWorksheetLine } = {}) {
  return stationBreakdownRowsForDetail(row).some((item) => requestBreakdownMatchesScope(item, { mode, requestLine }));
}
// @end-legacy-unit 1003

// @legacy-unit 1004 11057
export function requestRowHasSubmitScopeDemand(row, { mode = requestWorksheetMode, requestLine = requestWorksheetLine } = {}) {
  return stationBreakdownRowsForDetail(row).some((item) =>
    requestBreakdownMatchesScope(item, { mode, requestLine })
    && stationBreakdownRowTotal(item) > 0
  );
}
// @end-legacy-unit 1004

// @legacy-unit 1005 11064
export function requesterSubmitScopeAudit() {
  const activeRows = activeProjectRequests().filter((row) => stationBreakdownRowsForDetail(row).length);
  const scopedRows = activeRows.filter((row) => requestRowMatchesSubmitScope(row));
  const readyRows = scopedRows.filter((row) => canRequesterEditRequest(row) && requestRowHasSubmitScopeDemand(row));
  const excluded = activeRows
    .filter((row) => !readyRows.some((item) => item.id === row.id))
    .map((row) => {
      const breakdown = stationBreakdownRowsForDetail(row);
      let reason = "";
      if (!breakdown.some((item) => (item.requestLine || "Line 1") === requestWorksheetLine)) reason = `Different line`;
      else if (!requestRowMatchesSubmitScope(row)) reason = `Different worksheet`;
      else if (!requestRowHasSubmitScopeDemand(row)) reason = `No ${quantityReviewModeLabel(requestWorksheetMode)} qty`;
      else if (!canRequesterEditRequest(row)) reason = `Not Draft`;
      else reason = `Not in current scope`;
      return `${row.id || row.name}: ${reason}`;
    });
  return { scopedRows, readyRows, excluded };
}
// @end-legacy-unit 1005

// @legacy-unit 1006 11083
export function requestRowMatchesInputContext(row, context = itemPickerDemandContext()) {
  const contextKey = requestInputContextKey(context);
  const rows = stationBreakdownRowsForDetail(row);
  if (!rows.length) return false;
  return rows.some((item) => requestBreakdownContextKey(item) === contextKey);
}
// @end-legacy-unit 1006

// @legacy-unit 1007 11090
export function requesterInputRows() {
  syncRequestWorksheetContext();
  return activeProjectRequests().filter((row) => rowMatchesCurrentRequesterProjectScope(row) && stationBreakdownRowsForDetail(row).some((item) =>
    requestWorksheetBreakdownMatches(item, { mode: requestWorksheetMode, requestLine: requestWorksheetLine })
  ));
}
// @end-legacy-unit 1007

// @legacy-unit 1008 11097
export function requesterPackageRows() {
  syncRequestWorksheetContext();
  return activeProjectRequests().filter((row) => rowMatchesCurrentRequesterProjectScope(row) && stationBreakdownRowsForDetail(row).some((item) =>
    requestBreakdownMatchesScope(item)
  ));
}
// @end-legacy-unit 1008

// @legacy-unit 1009 11104
export function requestWorksheetRows() {
  return requesterInputRows().sort((left, right) => `${left.name} ${left.id}`.localeCompare(`${right.name} ${right.id}`));
}
// @end-legacy-unit 1009

// @legacy-unit 1010 11108
export function requestMatrixBreakdown(row, stage, context = itemPickerDemandContext()) {
  const contextKey = requestInputContextKey(context);
  return stationBreakdownRowsForDetail(row).find((item) => {
    if (stationBreakdownPhaseKey(item) !== stage) return false;
    return requestBreakdownContextKey(item) === contextKey;
  }) || null;
}
// @end-legacy-unit 1010

// @legacy-unit 1011 11116
export function requestMatrixQty(row, stage, context = itemPickerDemandContext()) {
  return stationBreakdownRowTotal(requestMatrixBreakdown(row, stage, context));
}
// @end-legacy-unit 1011

// @legacy-unit 1012 11120
export function requestMatrixInput(row, stage) {
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  const qty = requestMatrixQty(row, stage);
  return `
    <input ${disabled} class="compact-input request-matrix-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1"
      value="${qty || ""}"
      aria-label="${htmlAttr(`${stageLabel(stage)} qty for ${row.name || "item"}`)}"
      data-request-matrix-qty="${htmlAttr(row.id)}"
      data-request-matrix-stage="${stage}" />`;
}
// @end-legacy-unit 1012

// @legacy-unit 1013 11131
export function requestWorksheetStageCells(row) {
  return STAGES.map((stage) => `<td class="cell-number request-matrix-cell">${requestMatrixInput(row, stage)}</td>`).join("");
}
// @end-legacy-unit 1013

// @legacy-unit 1014 11135
export function requestWorksheetCellContext(column, mode = requestWorksheetMode) {
  return {
    demandType: mode,
    requestLine: requestWorksheetLine || "Line 1",
    station: mode === DEMAND_TYPE_MFG ? column : "",
    demandUnit: mode === DEMAND_TYPE_MFG ? "" : column,
  };
}
// @end-legacy-unit 1014

// @legacy-unit 1015 11144
export function requestWorksheetCellBreakdown(row, phase, column) {
  return stationBreakdownRowsForDetail(row).find((item) =>
    stationBreakdownPhaseKey(item) === phase
    && requestWorksheetBreakdownMatches(item, { mode: requestWorksheetMode, requestLine: requestWorksheetLine, column })
  ) || null;
}
// @end-legacy-unit 1015

// @legacy-unit 1016 11151
export function requestWorksheetCellQty(row, phase, column) {
  return stationBreakdownRowTotal(requestWorksheetCellBreakdown(row, phase, column));
}
// @end-legacy-unit 1016

// @legacy-unit 1017 11155
export function requestWorksheetPhaseTotal(row, phase) {
  return requestWorksheetColumns().reduce((sum, column) => sum + requestWorksheetCellQty(row, phase, column), 0);
}
// @end-legacy-unit 1017

// @legacy-unit 1018 11159
export function requestWorksheetRowTotal(row) {
  return STAGES.reduce((sum, phase) => sum + requestWorksheetPhaseTotal(row, phase), 0);
}
// @end-legacy-unit 1018

// @legacy-unit 1019 11163
export function requestWorksheetQtyInput(row, phase, column) {
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  const qty = requestWorksheetCellQty(row, phase, column);
  return `
    <input ${disabled} class="compact-input request-matrix-input" type="text" inputmode="numeric" pattern="[0-9]*"
      value="${qty}"
      aria-label="${htmlAttr(`${column} ${stageLabel(phase)} qty for ${row.name || "item"}`)}"
      data-request-worksheet-qty="${htmlAttr(row.id)}"
      data-request-worksheet-phase="${phase}"
      data-request-worksheet-column="${htmlAttr(column)}" />`;
}
// @end-legacy-unit 1019

// @legacy-unit 1020 11175
export function sanitizeWorksheetQtyValue(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}
// @end-legacy-unit 1020

// @legacy-unit 1021 11179
export function focusWorksheetQtyByMeta(meta = {}) {
  if (!meta.requestId) return;
  const selector = `[data-request-worksheet-qty="${CSS.escape(meta.requestId)}"][data-request-worksheet-phase="${CSS.escape(meta.phase || "")}"][data-request-worksheet-column="${CSS.escape(meta.column || "")}"]`;
  document.querySelector(selector)?.focus();
}
// @end-legacy-unit 1021

// @legacy-unit 1022 11185
export function nextWorksheetQtyMeta(currentInput) {
  const inputs = [...document.querySelectorAll("[data-request-worksheet-qty]:not([disabled])")];
  const index = inputs.indexOf(currentInput);
  const next = index >= 0 ? inputs[index + 1] : null;
  return next ? {
    requestId: next.dataset.requestWorksheetQty || "",
    phase: next.dataset.requestWorksheetPhase || "",
    column: next.dataset.requestWorksheetColumn || "",
  } : null;
}
// @end-legacy-unit 1022

// @legacy-unit 1023 11196
export function normalizeWorksheetQtyInput(input, { update = false } = {}) {
  const nextValue = sanitizeWorksheetQtyValue(input.value);
  if (input.value !== nextValue) input.value = nextValue;
  if (update && input.dataset.requestWorksheetQty) {
    updateRequestWorksheetQty(
      input.dataset.requestWorksheetQty,
      input.dataset.requestWorksheetPhase || requestWorksheetAddPhase,
      input.dataset.requestWorksheetColumn || requestWorksheetColumns()[0],
      nextValue
    );
  }
}
// @end-legacy-unit 1023

// @legacy-unit 1024 11209
export function updateRequestWorksheetQty(requestId, phase, column, value) {
  syncRequestWorksheetContext();
  const context = requestWorksheetCellContext(column);
  const qty = clampQty(value);
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const existingRows = stationBreakdownRowsForDetail(row);
    const hasMatch = existingRows.some((item) =>
      stationBreakdownPhaseKey(item) === phase
      && requestWorksheetBreakdownMatches(item, { mode: context.demandType, requestLine: context.requestLine, column })
    );
    let stationBreakdown = existingRows.map((item) => {
      if (
        stationBreakdownPhaseKey(item) !== phase
        || !requestWorksheetBreakdownMatches(item, { mode: context.demandType, requestLine: context.requestLine, column })
      ) return item;
      return normalizeDemandBreakdownCarryover({ ...item, qty });
    });
    if (!hasMatch && qty > 0) {
      stationBreakdown = [
        ...stationBreakdown,
        createStationBreakdownEntry(row, {
          phase,
          demandType: context.demandType,
          station: context.station,
          demandUnit: context.demandUnit,
          requestLine: context.requestLine,
          qty,
        }),
      ];
    }
    return syncRowPhaseQtyFromStationBreakdown(normalizeRequestDemandDepartment({ ...row, stationBreakdown }));
  }));
  renderRequestRows();
  renderSelectedDemandLines();
  renderSubmissionRows();
  renderWarehouseMaintenance();
}
// @end-legacy-unit 1024

// @legacy-unit 1025 11248
export function updateRequestMatrixQty(requestId, stage, value) {
  const context = itemPickerDemandContext();
  const column = context.demandType === DEMAND_TYPE_MFG ? context.station : context.demandUnit;
  updateRequestWorksheetQty(requestId, stage, column, value);
}
// @end-legacy-unit 1025

// @legacy-unit 1026 11254
export function updateRequestDemandUnit(requestId, value) {
  const nextUnit = demandUnitFor({ demandUnit: value });
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).map((item) => {
      if (demandTypeFor(item) !== DEMAND_TYPE_NON_MFG) return item;
      return normalizeDemandBreakdownCarryover({ ...item, demandUnit: nextUnit, station: "" });
    });
    return syncRowPhaseQtyFromStationBreakdown({ ...row, demandUnit: nextUnit, stationBreakdown });
  }));
  renderRequestRows();
  renderSelectedDemandLines();
}
// @end-legacy-unit 1026

export function replaceRequestWorksheetRowsBinding(value) { requestWorksheetRows = value; return value; }

export function replaceUpdateRequestWorksheetQtyBinding(value) { updateRequestWorksheetQty = value; return value; }
