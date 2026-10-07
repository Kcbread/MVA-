// cost/quantity-filters: authoritative source; see docs/module-map.md.
import {
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  priceReviewAnalysisRowsOverride,
  selectedManagerRequestId
} from "../approval/state.js";
import {
  isSupersededRequest
} from "../demand/amendments.js";
import {
  canonicalDemandUnit,
  clampQty,
  demandTypeFor,
  isLongFormStationBreakdown,
  stationBreakdownHasDemand,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  requestLineNumber
} from "../inventory/suggestions.js";
import {
  optionHtml
} from "../progress/demand.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  DEMAND_UNIT_OPTIONS,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER
} from "../projects/config.js";
import {
  normalize
} from "../shared/format.js";
import {
  currentManagerTab,
  currentView
} from "../shell/state.js";

// @legacy-unit 685 5474
export function selectedManagerReviewRowForQuantityScope() {
  if (Array.isArray(priceReviewAnalysisRowsOverride)) return null;
  if (currentView !== "manager" || currentManagerTab !== "review" || !selectedManagerRequestId) return null;
  return requests.find((row) => row.id === selectedManagerRequestId) || null;
}
// @end-legacy-unit 685

// @legacy-unit 686 5480
export function managerQuantitySourceRows() {
  const selectedManagerRow = selectedManagerReviewRowForQuantityScope();
  const sourceRows = Array.isArray(priceReviewAnalysisRowsOverride)
    ? priceReviewAnalysisRowsOverride
    : selectedManagerRow
      ? [selectedManagerRow]
      : requests;
  const allowReviewStatusRows = Array.isArray(priceReviewAnalysisRowsOverride);
  return sourceRows.filter((row) => {
    const status = row.status || "";
    return status
      && !["Draft", USER_CANCELLED_REQUEST, "Cancelled"].includes(status)
      && (allowReviewStatusRows || status !== "Rejected")
      && !isSupersededRequest(row)
      && stationBreakdownHasDemand(row);
  });
}
// @end-legacy-unit 686

// @legacy-unit 687 5498
export function managerQuantityRequestLine(entry = {}, request = {}) {
  const line = String(entry.requestLine || entry.line || request.requestLine || request.line || "Line 1").trim();
  return line || "Line 1";
}
// @end-legacy-unit 687

// @legacy-unit 688 5503
export function managerRequestLineSort(left = "", right = "") {
  return requestLineNumber(left) - requestLineNumber(right) || String(left).localeCompare(String(right));
}
// @end-legacy-unit 688

// @legacy-unit 689 5507
export function managerQuantityFlattenRows(rawRows = managerQuantitySourceRows()) {
  const selectedLine = selectedManagerReviewRowForQuantityScope()?.requestLine || "";
  return rawRows.flatMap((request) => stationBreakdownRowsForDetail(request)
    .flatMap((breakdown) => {
      if (isLongFormStationBreakdown(breakdown)) {
        const qty = stationBreakdownRowTotal(breakdown);
        const demandType = demandTypeFor(breakdown);
        const requestLine = managerQuantityRequestLine(breakdown, request);
        return qty > 0 && (!selectedLine || requestLine === selectedLine) ? [{
          request,
          demandType,
          phase: stationBreakdownPhaseKey(breakdown),
          station: demandType === DEMAND_TYPE_MFG ? (breakdown.station || STATION_MASTER[0]) : "",
          demandUnit: demandType === DEMAND_TYPE_MFG ? "" : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
          requestLine,
          qty,
          remark: breakdown.remark || "",
        }] : [];
      }
      return STAGES
        .map((stage) => ({
          request,
          demandType: demandTypeFor(breakdown),
          phase: stage,
          station: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? (breakdown.station || STATION_MASTER[0]) : "",
          demandUnit: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? "" : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
          requestLine: managerQuantityRequestLine(breakdown, request),
          qty: clampQty(breakdown[stage]),
          remark: breakdown.remark || "",
        }))
        .filter((item) => item.qty > 0 && (!selectedLine || item.requestLine === selectedLine));
    }));
}
// @end-legacy-unit 689

// @legacy-unit 690 5541
export function managerQuantityEntryUnit(entry = {}) {
  if (demandTypeFor(entry) === DEMAND_TYPE_MFG) return "MFG";
  return normalizeQuantityDashboardUnit(entry.demandUnit) || entry.demandUnit || "";
}
// @end-legacy-unit 690

// @legacy-unit 691 5546
export function managerQuantityEntryMatchesStationFilter(entry = {}, stationFilter = "") {
  if (!stationFilter) return true;
  if (demandTypeFor(entry) === DEMAND_TYPE_NON_MFG) return managerQuantityEntryUnit(entry) === stationFilter;
  return entry.station === stationFilter;
}
// @end-legacy-unit 691

// @legacy-unit 692 5552
export function syncManagerQuantityFilters() {
  const entries = managerQuantityFlattenRows();
  const controls = [
    ["managerQuantityProjectFilter", "All projects", (entry) => entry.request.project],
    ["managerQuantityLineFilter", "All lines", (entry) => entry.requestLine],
    ["managerQuantityItemFilter", "All items", (entry) => entry.request.name],
    ["managerQuantityPhaseFilter", "All phases", (entry) => entry.phase],
    ["managerQuantityStationFilter", "All stations", (entry) => entry.station],
    ["managerQuantityUnitFilter", "All demand units", (entry) => managerQuantityEntryUnit(entry)],
  ];
  controls.forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    const unsortedValues = [...new Set(entries.map(getter).filter(Boolean))];
    const values = id === "managerQuantityPhaseFilter"
      ? STAGES.filter((stage) => unsortedValues.includes(stage))
      : id === "managerQuantityStationFilter"
        ? STATION_MASTER.filter((station) => unsortedValues.includes(station))
        : id === "managerQuantityUnitFilter"
          ? DEMAND_UNIT_OPTIONS.filter((unit) => unsortedValues.includes(unit))
          : id === "managerQuantityLineFilter"
            ? unsortedValues.sort(managerRequestLineSort)
            : unsortedValues.sort((left, right) => String(left).localeCompare(String(right)));
    select.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => (
      id === "managerQuantityPhaseFilter"
        ? `<option value="${value}" ${value === currentValue ? "selected" : ""}>${STAGE_LABELS[value]}</option>`
        : optionHtml(value, currentValue)
    )).join("")}`;
    if (currentValue && values.includes(currentValue)) select.value = currentValue;
  });
}
// @end-legacy-unit 692

// @legacy-unit 693 5585
export function managerQuantityFilters() {
  return {
    project: document.getElementById("managerQuantityProjectFilter")?.value || "",
    requestLine: document.getElementById("managerQuantityLineFilter")?.value || "",
    item: document.getElementById("managerQuantityItemFilter")?.value || "",
    phase: document.getElementById("managerQuantityPhaseFilter")?.value || "",
    station: document.getElementById("managerQuantityStationFilter")?.value || "",
    demandUnit: document.getElementById("managerQuantityUnitFilter")?.value || "",
    sort: document.getElementById("managerQuantitySortFilter")?.value || "",
  };
}
// @end-legacy-unit 693

// @legacy-unit 694 5597
export function managerQuantityFilteredEntries() {
  const filters = managerQuantityFilters();
  return managerQuantityFlattenRows().filter((entry) =>
    (!filters.project || entry.request.project === filters.project)
    && (!filters.requestLine || entry.requestLine === filters.requestLine)
    && (!filters.item || entry.request.name === filters.item)
    && (!filters.phase || entry.phase === filters.phase)
    && managerQuantityEntryMatchesStationFilter(entry, filters.station)
    && (!filters.demandUnit || managerQuantityEntryUnit(entry) === filters.demandUnit)
  );
}
// @end-legacy-unit 694

// @legacy-unit 695 5609
export function normalizeQuantityDashboardUnit(rawUnit = "") {
  const unit = canonicalDemandUnit(rawUnit);
  const normalized = normalize(unit).replace(/[\s_-]+/g, "");
  if (normalized === "mfg" || normalized === "mfgnong") return "MFG";
  if (normalized === "te" || normalized === "fatte" || normalized === "fatpte") return "FATP TE";
  if (normalized === "iqc" || normalized === "fatiqc" || normalized === "fatpiqc") return "FATP IQC";
  if (normalized === "pqe" || normalized === "fatpqe" || normalized === "fatppqe") return "FATP PQE";
  if (normalized === "wh" || normalized === "ggwh") return "WH";
  if (normalized === "qlab" || normalized === "qalab") return "Q-LAB";
  if (normalized === "rel") return "REL";
  if (normalized === "eng1") return "ENG1";
  if (normalized === "eng2") return "ENG2";
  if (normalized === "eng3") return "ENG3";
  if (normalized === "it") return "IT";
  if (normalized === "fac" || normalized === "facility") return "FAC";
  return "";
}
// @end-legacy-unit 695
