// demand/quantity: authoritative source; see docs/module-map.md.
import {
  normalizeQuantityDashboardUnit
} from "../cost/quantity-filters.js";
import {
  activeProjectRequests,
  canRequesterEditRequest
} from "./request-fields.js";
import {
  DEMAND_TYPES,
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_ALIAS_MAP,
  DEMAND_UNIT_FALLBACK,
  DEMAND_UNIT_OPTIONS,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER,
  currentStageForProject,
  phaseKeyFromInput
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  currentRequesterDepartment,
  rowDemandDepartment
} from "../session/persona.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";

// @legacy-unit 522 3589
export function clampQty(value) {
  return Math.max(0, Number(value) || 0);
}
// @end-legacy-unit 522

// @legacy-unit 523 3593
export function totalQty(row) {
  if (Array.isArray(row?.stationBreakdown)) return stationBreakdownTotal(row);
  return STAGES.reduce((sum, key) => sum + clampQty(row[key]), 0);
}
// @end-legacy-unit 523

// @legacy-unit 524 3598
export function stageQtyText(row) {
  return STAGES.map((stage) => `${STAGE_LABELS[stage]} ${requestStageQty(row, stage)}`).join(" / ");
}
// @end-legacy-unit 524

// @legacy-unit 525 3602
export function requestStageQty(row, stage) {
  if (Array.isArray(row?.stationBreakdown)) return stationBreakdownPhaseTotal(row, stage);
  return clampQty(row?.[stage]);
}
// @end-legacy-unit 525

// @legacy-unit 526 3607
export function stationOptionFor(value) {
  const normalized = normalize(value);
  return STATION_MASTER.find((station) => normalized.includes(normalize(station))) || STATION_MASTER[0];
}
// @end-legacy-unit 526

// @legacy-unit 544 3919
export function demandTypeFor(row = {}) {
  const raw = String(row.demandType || row.type || "").trim().toLowerCase();
  if (raw === "non-mfg" || raw === "non mfg" || raw === "nonmfg" || raw === "unit") return DEMAND_TYPE_NON_MFG;
  if (raw === "mfg" || raw === "station") return DEMAND_TYPE_MFG;
  if (row.demandUnit && normalizeQuantityDashboardUnit(row.demandUnit) !== "MFG") return DEMAND_TYPE_NON_MFG;
  if (row.station && STATION_MASTER.includes(row.station)) return DEMAND_TYPE_MFG;
  if (Object.prototype.hasOwnProperty.call(row, "station") && !row.station) return DEMAND_TYPE_NON_MFG;
  return DEMAND_TYPE_MFG;
}
// @end-legacy-unit 544

// @legacy-unit 545 3929
export function demandTypeOptionsHtml(selectedValue) {
  const selected = demandTypeFor({ demandType: selectedValue });
  return DEMAND_TYPES
    .map((type) => `<option value="${type}" ${type === selected ? "selected" : ""}>${type}</option>`)
    .join("");
}
// @end-legacy-unit 545

// @legacy-unit 546 3936
export function canonicalDemandUnit(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEMAND_UNIT_FALLBACK;
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  if (/^\d+$/.test(normalized)) return DEMAND_UNIT_FALLBACK;
  if (DEMAND_UNIT_ALIAS_MAP[normalized]) return DEMAND_UNIT_ALIAS_MAP[normalized];
  return DEMAND_UNIT_OPTIONS.find((unit) => normalize(unit) === normalize(raw)) || raw;
}
// @end-legacy-unit 546

// @legacy-unit 547 3945
export function demandUnitFor(row) {
  const unit = canonicalDemandUnit(row?.demandUnit || row?.department || row?.process || DEMAND_UNIT_FALLBACK);
  return DEMAND_UNIT_OPTIONS.includes(unit) ? unit : DEMAND_UNIT_FALLBACK;
}
// @end-legacy-unit 547

// @legacy-unit 548 3950
export function demandUnitOptionsHtml(selectedValue) {
  const selected = demandUnitFor({ demandUnit: selectedValue });
  return DEMAND_UNIT_OPTIONS
    .map((unit) => `<option value="${unit}" ${unit === selected ? "selected" : ""}>${unit}</option>`)
    .join("");
}
// @end-legacy-unit 548

// @legacy-unit 549 3957
export function stationBreakdownPhaseKey(row) {
  return STAGES.includes(row?.phase) ? row.phase : phaseKeyFromInput(row?.phase);
}
// @end-legacy-unit 549

// @legacy-unit 550 3961
export function isLongFormStationBreakdown(row) {
  return Boolean(stationBreakdownPhaseKey(row)) || Object.prototype.hasOwnProperty.call(row || {}, "qty");
}
// @end-legacy-unit 550

// @legacy-unit 551 3965
export function stationBreakdownRowTotal(row) {
  if (isLongFormStationBreakdown(row)) return clampQty(row?.qty);
  return STAGES.reduce((sum, stage) => sum + clampQty(row?.[stage]), 0);
}
// @end-legacy-unit 551

// @legacy-unit 552 3970
export function stationBreakdownPhaseTotal(row, stage) {
  const breakdown = Array.isArray(row?.stationBreakdown) ? row.stationBreakdown : [];
  return breakdown.reduce((sum, item) => {
    if (isLongFormStationBreakdown(item)) return sum + (stationBreakdownPhaseKey(item) === stage ? clampQty(item.qty) : 0);
    return sum + clampQty(item[stage]);
  }, 0);
}
// @end-legacy-unit 552

// @legacy-unit 553 3978
export function stationBreakdownTotal(row) {
  const breakdown = Array.isArray(row?.stationBreakdown) ? row.stationBreakdown : [];
  return breakdown.reduce((sum, item) => sum + stationBreakdownRowTotal(item), 0);
}
// @end-legacy-unit 553

// @legacy-unit 554 3983
export function stationBreakdownRowsCount(row) {
  if (!Array.isArray(row?.stationBreakdown)) return 0;
  return row.stationBreakdown.filter((item) => stationBreakdownRowTotal(item) > 0).length || row.stationBreakdown.length;
}
// @end-legacy-unit 554

// @legacy-unit 555 3988
export function stationBreakdownHasDemand(row) {
  return stationBreakdownTotal(row) > 0;
}
// @end-legacy-unit 555

// @legacy-unit 556 3992
export function stationBreakdownStatus(row) {
  if (!Array.isArray(row?.stationBreakdown) || !row.stationBreakdown.length) return "Need Demand Rows";
  return stationBreakdownHasDemand(row) ? "Ready" : "Need Qty";
}
// @end-legacy-unit 556

// @legacy-unit 557 3997
export function stationBreakdownStatusHtml(row) {
  const status = stationBreakdownStatus(row);
  return `<span class="status-pill ${statusClass(status)}">${status}</span>`;
}
// @end-legacy-unit 557

// @legacy-unit 558 4002
export function createStationBreakdownEntry(source = {}, overrides = {}) {
  const phase = overrides.phase || source.phase || source.defaultPhase || currentStageForProject(source.project || currentProject);
  const demandType = demandTypeFor({ ...source, ...overrides });
  const demandDepartment = rowDemandDepartment({ ...source, ...overrides }, currentRequesterDepartment());
  return {
    id: overrides.id || `SBD-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    demandType,
    phase,
    demandUnit: demandType === DEMAND_TYPE_MFG ? "" : (overrides.demandUnit || demandUnitFor(source)),
    station: demandType === DEMAND_TYPE_MFG ? (overrides.station || stationOptionFor(source.station || source.process || "")) : "",
    qty: clampQty(overrides.qty ?? 0),
    requestLine: overrides.requestLine || source.requestLine || "",
    requesterDept: overrides.requesterDept || source.requesterDept || demandDepartment,
    demandDepartment: overrides.demandDepartment || source.demandDepartment || demandDepartment,
    carryoverFrom: overrides.carryoverFrom || source.carryoverFrom || "",
    carryoverQty: clampQty(overrides.carryoverQty ?? source.carryoverQty),
    carryoverReason: overrides.carryoverReason || source.carryoverReason || "",
    remark: overrides.remark || "",
  };
}
// @end-legacy-unit 558

// @legacy-unit 559 4023
export function stationBreakdownFromRecord(record) {
  const rows = STAGES
    .map((stage) => ({
      ...createStationBreakdownEntry(record, { phase: stage, qty: clampQty(record[stage]) }),
    }))
    .filter((row) => row.qty > 0);
  return rows.length ? rows : [createStationBreakdownEntry(record)];
}
// @end-legacy-unit 559

// @legacy-unit 560 4032
export function syncRowPhaseQtyFromStationBreakdown(row) {
  if (!Array.isArray(row?.stationBreakdown)) return row;
  return {
    ...row,
    ...Object.fromEntries(STAGES.map((stage) => [stage, stationBreakdownPhaseTotal(row, stage)])),
  };
}
// @end-legacy-unit 560

// @legacy-unit 561 4040
export function stationBreakdownRowsForProject() {
  return activeProjectRequests().filter(canRequesterEditRequest);
}
// @end-legacy-unit 561

// @legacy-unit 562 4044
export function stationBreakdownRowsForDetail(row) {
  return Array.isArray(row?.stationBreakdown) ? row.stationBreakdown : [];
}
// @end-legacy-unit 562

export function replaceCreateStationBreakdownEntryBinding(value) { createStationBreakdownEntry = value; return value; }

export function replaceSyncRowPhaseQtyFromStationBreakdownBinding(value) { syncRowPhaseQtyFromStationBreakdown = value; return value; }
