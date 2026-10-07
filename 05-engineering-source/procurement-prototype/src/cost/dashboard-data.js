// cost/dashboard-data: authoritative source; see docs/module-map.md.
import {
  formatCompactCurrencyFromUsd
} from "./currency.js";
import {
  managerDemandCostCellImpact
} from "./dashboard-values.js";
import {
  managerQuantityGroupKey,
  managerQuantityPriceCandidate,
  managerQuantityResolvePrice
} from "./matrix-data.js";
import {
  managerQuantityEntryUnit,
  managerQuantityFlattenRows,
  managerRequestLineSort
} from "./quantity-filters.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  optionHtml
} from "../progress/demand.js";
import {
  QUANTITY_DASHBOARD_UNITS,
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";

// @legacy-unit 708 5870
export function managerDemandCostFilters() {
  const phaseValue = document.getElementById("managerDemandCostPhaseFilter")?.value || "";
  return {
    project: document.getElementById("managerDemandCostProjectFilter")?.value || "",
    requestLine: document.getElementById("managerDemandCostLineFilter")?.value || "",
    phase: STAGES.includes(phaseValue) ? phaseValue : "",
    lineCount: Math.max(1, clampQty(document.getElementById("managerDemandCostLineCount")?.value || 1)),
    viewMode: document.getElementById("managerDemandCostViewMode")?.value || "amount",
  };
}
// @end-legacy-unit 708

// @legacy-unit 709 5881
export function syncManagerDemandCostFilters() {
  const entries = managerQuantityFlattenRows();
  [
    ["managerDemandCostProjectFilter", "All projects", (entry) => entry.request.project],
    ["managerDemandCostLineFilter", "All lines", (entry) => entry.requestLine],
    ["managerDemandCostPhaseFilter", "", (entry) => entry.phase],
  ].forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value || "";
    const rawValues = [...new Set(entries.map(getter).filter(Boolean))];
    const values = id === "managerDemandCostPhaseFilter"
      ? STAGES.filter((stage) => rawValues.includes(stage) || stage === STAGES[0])
      : id === "managerDemandCostLineFilter"
        ? rawValues.sort(managerRequestLineSort)
      : rawValues.sort((left, right) => String(left).localeCompare(String(right)));
    const allOption = id === "managerDemandCostPhaseFilter"
      ? `<option value="">All stages</option>`
      : (allLabel ? `<option value="">${allLabel}</option>` : "");
    select.innerHTML = `${allOption}${values.map((value) => (
      id === "managerDemandCostPhaseFilter"
        ? `<option value="${value}" ${value === currentValue ? "selected" : ""}>${STAGE_LABELS[value]}</option>`
        : optionHtml(value, currentValue)
    )).join("")}`;
    if (values.includes(currentValue)) select.value = currentValue;
  });
}
// @end-legacy-unit 709

// @legacy-unit 710 5909
export function managerDemandCostRows() {
  const filters = managerDemandCostFilters();
  const itemGroups = new Map();
  managerQuantityFlattenRows()
    .filter((entry) =>
      (!filters.project || entry.request.project === filters.project)
      && (!filters.requestLine || entry.requestLine === filters.requestLine)
      && (!filters.phase || entry.phase === filters.phase)
    )
    .forEach((entry) => {
      const unit = managerQuantityEntryUnit(entry);
      const key = managerQuantityGroupKey(entry.request);
      if (!itemGroups.has(key)) {
        const price = managerQuantityResolvePrice([managerQuantityPriceCandidate(entry.request)]);
        itemGroups.set(key, {
          key,
          keyId: key.replace(/[^a-z0-9]+/gi, "-"),
          requestId: entry.request.id,
          request: entry.request,
          project: entry.request.project || "-",
          item: entry.request.name || "-",
          cnEngName: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          vnName: entry.request.vnName || entry.request.localName || "-",
          spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          unitTotals: Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unitName) => [unitName, 0])),
          phaseUnitTotals: Object.fromEntries(STAGES.map((stage) => [stage, Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unitName) => [unitName, 0]))])),
          qty: 0,
          unitPrice: price.unitPrice,
          priceSource: price.source,
          amount: 0,
          pricePending: price.unitPrice ? 0 : 1,
        });
      }
      const item = itemGroups.get(key);
      if (QUANTITY_DASHBOARD_UNITS.includes(unit)) {
        item.unitTotals[unit] += entry.qty;
        if (item.phaseUnitTotals[entry.phase]) item.phaseUnitTotals[entry.phase][unit] += entry.qty;
      }
      item.qty += entry.qty;
      if (item.unitPrice) item.amount += item.unitPrice * entry.qty;
    });
  return [...itemGroups.values()]
    .sort((left, right) => right.qty - left.qty || left.item.localeCompare(right.item));
}
// @end-legacy-unit 710

// @legacy-unit 711 5954
export function managerDemandCostUnitTotals(rows, filters) {
  const unitTotals = Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, {
    qty: 0,
    originalQty: 0,
    carryoverQty: 0,
    effectiveQty: 0,
    amount: 0,
    originalAmount: 0,
    savingAmount: 0,
    effectiveAmount: 0,
    pricePending: 0,
  }]));
  rows.forEach((row) => {
    QUANTITY_DASHBOARD_UNITS.forEach((unit) => {
      const impact = managerDemandCostCellImpact(row, unit, filters);
      if (!impact.originalQty && !impact.carryoverQty) return;
      unitTotals[unit].qty += impact.effectiveQty;
      unitTotals[unit].originalQty += impact.originalQty;
      unitTotals[unit].carryoverQty += impact.carryoverQty;
      unitTotals[unit].effectiveQty += impact.effectiveQty;
      unitTotals[unit].amount += impact.effectiveAmount;
      unitTotals[unit].originalAmount += impact.originalAmount;
      unitTotals[unit].savingAmount += impact.savingAmount;
      unitTotals[unit].effectiveAmount += impact.effectiveAmount;
      if (!row.unitPrice && impact.originalQty) unitTotals[unit].pricePending += 1;
    });
  });
  return unitTotals;
}
// @end-legacy-unit 711

// @legacy-unit 712 5984
export function managerDemandCostTotalDisplay(total, viewMode) {
  if (!total || !total.originalQty) return "";
  if (viewMode === "amount") {
    return total.effectiveAmount ? formatCompactCurrencyFromUsd(total.effectiveAmount) : "Price pending";
  }
  return total.effectiveQty;
}
// @end-legacy-unit 712

export function replaceManagerDemandCostRowsBinding(value) { managerDemandCostRows = value; return value; }
