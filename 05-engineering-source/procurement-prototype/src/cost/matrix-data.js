// cost/matrix-data: authoritative source; see docs/module-map.md.
import {
  quantityReviewColumnsForMode,
  quantityReviewEntryColumn,
  quantityReviewModeValue
} from "../approval/quantity-scope.js";
import {
  expandedManagerQuantityRows
} from "../approval/state.js";
import {
  amountUsdFromVnd,
  formatCurrencyFromVnd,
  formatMoneyFromUsd,
  legacyPriceToUsd
} from "./currency.js";
import {
  MANAGER_MFG_HEADER_MASTER
} from "./detail-view.js";
import {
  managerQuantityEntryUnit,
  managerQuantityFilteredEntries,
  managerQuantityFilters
} from "./quantity-filters.js";
import {
  stationBreakdownRowsForDetail,
  totalQty
} from "../demand/quantity.js";
import {
  managerCarryoverQtyForScope,
  managerCarryoverRowsForScope,
  managerCarryoverStatusBucket
} from "../inventory/cost-evidence.js";
import {
  requestLineNumber
} from "../inventory/suggestions.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_OPTIONS,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER
} from "../projects/config.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";
import {
  htmlAttr
} from "../shared/html.js";

// @legacy-unit 826 7652
export function managerQuantityGroupKey(row) {
  return [
    row.id,
    row.project,
    normalize(row.name),
    normalize(userVisibleItemDetail(row) || itemDetail(row) || ""),
  ].join("::");
}
// @end-legacy-unit 826

// @legacy-unit 827 7661
export function createManagerQuantityGroup(row) {
  return {
    key: managerQuantityGroupKey(row),
    project: row.project,
    requestId: row.id || "",
    item: row.name || "-",
    spec: userVisibleItemDetail(row) || itemDetail(row) || "-",
    requests: new Map(),
    statuses: new Set(),
    phaseTotals: Object.fromEntries(STAGES.map((stage) => [stage, 0])),
    stationTotals: Object.fromEntries(STAGES.map((stage) => [stage, new Map()])),
    unitTotals: new Map(),
    detailRows: [],
    priceCandidates: [],
    totalQty: 0,
  };
}
// @end-legacy-unit 827

// @legacy-unit 828 7679
export function formatVnd(value) {
  return formatCurrencyFromVnd(value);
}
// @end-legacy-unit 828

// @legacy-unit 829 7683
export function managerQuantityPriceCandidate(row) {
  const quoteUsd = legacyPriceToUsd(row, "updatedPrice") || legacyPriceToUsd(row, "quoteUnitPrice");
  if (quoteUsd) return { unitPrice: quoteUsd, unitPriceUsd: quoteUsd, source: "PAS Quote", rank: 1, date: row.quoteDate || row.quoteReadyAt || "" };

  const historyPrice = legacyPriceToUsd(row, "unitPrice");
  if (historyPrice > 0) return { unitPrice: historyPrice, unitPriceUsd: historyPrice, source: "History Price", rank: 2, date: row.quoteDate || row.sourceDate || "" };

  const estimatedUnitPrice = legacyPriceToUsd(row, "estimatedUnitPrice");
  if (estimatedUnitPrice > 0) return { unitPrice: estimatedUnitPrice, unitPriceUsd: estimatedUnitPrice, source: "Requester Estimate", rank: 3, date: row.submittedAt || row.createdAt || "" };

  const estimatedAmount = Number(row.estimatedAmountUsd || 0) || amountUsdFromVnd(Number(row.estimatedAmount || 0));
  const qty = totalQty(row);
  if (estimatedAmount > 0 && qty > 0) {
    return {
      unitPrice: estimatedAmount / qty,
      unitPriceUsd: estimatedAmount / qty,
      source: "Requester Estimate",
      rank: 3,
      date: row.submittedAt || row.createdAt || "",
    };
  }

  return { unitPrice: 0, source: "Price Pending", rank: 9, date: "" };
}
// @end-legacy-unit 829

// @legacy-unit 830 7708
export function managerQuantityResolvePrice(candidates = []) {
  const values = candidates.filter((candidate) => candidate && candidate.unitPrice > 0);
  if (!values.length) return { unitPrice: 0, source: "Price Pending", estimatedAmount: 0 };
  values.sort((left, right) =>
    left.rank - right.rank
    || String(right.date || "").localeCompare(String(left.date || ""))
    || right.unitPrice - left.unitPrice
  );
  return { unitPrice: values[0].unitPrice, source: values[0].source, estimatedAmount: 0 };
}
// @end-legacy-unit 830

// @legacy-unit 831 7719
export function managerQuantityPriceHtml(group, mode = "unit") {
  const isPending = !group.unitPrice;
  if (mode === "amount") {
    return `
      <div class="quantity-price-cell ${isPending ? "pending" : ""}">
        <strong>${isPending ? "-" : formatMoneyFromUsd(group.estimatedAmount)}</strong>
        <span>${isPending ? "Amount pending" : `${group.totalQty} pcs`}</span>
      </div>`;
  }
  return `
    <div class="quantity-price-cell ${isPending ? "pending" : ""}">
      <strong>${isPending ? "-" : formatMoneyFromUsd(group.unitPrice)}</strong>
      <span class="price-source-badge ${statusClass(group.priceSource)}">${group.priceSource}</span>
    </div>`;
}
// @end-legacy-unit 831

// @legacy-unit 832 7735
export function managerQuantityStationTotals(group) {
  const totals = new Map();
  STAGES.forEach((stage) => {
    [...group.stationTotals[stage].entries()].forEach(([station, qty]) => {
      totals.set(station, (totals.get(station) || 0) + qty);
    });
  });
  return [...totals.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((left, right) => right[1] - left[1] || STATION_MASTER.indexOf(left[0]) - STATION_MASTER.indexOf(right[0]));
}
// @end-legacy-unit 832

// @legacy-unit 833 7747
export function managerQuantityInlineTotals(entries, order = []) {
  const sorted = [...entries]
    .filter(([, qty]) => qty > 0)
    .sort((left, right) => {
      const leftIndex = order.indexOf(left[0]);
      const rightIndex = order.indexOf(right[0]);
      if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      return right[1] - left[1] || String(left[0]).localeCompare(String(right[0]));
    });
  return sorted.length ? sorted.map(([name, qty]) => `${name} ${qty}`).join(" / ") : "-";
}
// @end-legacy-unit 833

// @legacy-unit 834 7759
export function managerQuantityUnitSummary(group) {
  return managerQuantityInlineTotals([...group.unitTotals.entries()], DEMAND_UNIT_OPTIONS);
}
// @end-legacy-unit 834

// @legacy-unit 835 7763
export function approvalQuantityLineSummary(request = {}) {
  const lines = new Set();
  stationBreakdownRowsForDetail(request).forEach((entry) => {
    const line = String(entry.requestLine || entry.line || "").trim();
    if (line) lines.add(line);
  });
  const fallback = String(request.requestLine || request.line || "").trim();
  if (!lines.size && fallback) lines.add(fallback);
  return [...lines]
    .sort((left, right) => requestLineNumber(left) - requestLineNumber(right) || left.localeCompare(right))
    .join(" / ");
}
// @end-legacy-unit 835

// @legacy-unit 836 7776
export function managerQuantityActiveStationSummary(group) {
  return managerQuantityInlineTotals(managerQuantityStationTotals(group), STATION_MASTER);
}
// @end-legacy-unit 836

// @legacy-unit 837 7780
export function managerQuantitySinglePhaseMode() {
  return managerQuantityVisibleStages().length === 1;
}
// @end-legacy-unit 837

// @legacy-unit 838 7784
export function managerQuantityColumnWidth(column) {
  const singlePhase = managerQuantitySinglePhaseMode();
  if (column.type === "station") {
    if (column.name === "ENG Pack") return singlePhase ? 58 : 44;
    if (column.name === "Laser_pico") return singlePhase ? 62 : 48;
    return singlePhase ? 42 : 30;
  }
  if (column.name === "Total Demand for EQ" || column.name === "Actual Need QTY") return singlePhase ? 82 : 66;
  return singlePhase ? 48 : 40;
}
// @end-legacy-unit 838

// @legacy-unit 839 7795
export function managerQuantityGroupDisplayLabel(label) {
  return {
    Mainline: "MFG Mainline Station",
    Packing: "MFG Packing Station",
    Supporting: "MFG Support Station",
    "Demand Unit": "Non-MFG Department",
    "Demand Calculation": "Calc",
  }[label] || label;
}
// @end-legacy-unit 839

// @legacy-unit 840 7805
export function managerQuantityLeafDisplayLabel(label) {
  return {
    "Total Demand for EQ": "Total Demand",
    "Actual Need QTY": "Actual Need",
  }[label] || label;
}
// @end-legacy-unit 840

// @legacy-unit 841 7812
export function renderManagerQuantityColgroup() {
  const stages = managerQuantityVisibleStages();
  const columns = managerQuantityPhaseColumns();
  return `
    <colgroup>
      <col style="width:108px" />
      <col style="width:110px" />
      <col style="width:46px" />
      <col style="width:120px" />
      <col style="width:210px" />
      <col style="width:86px" />
      <col style="width:92px" />
      <col style="width:100px" />
      ${stages.map(() => columns.map((column) => `<col style="width:${managerQuantityColumnWidth(column)}px" />`).join("")).join("")}
      <col style="width:52px" />
      <col style="width:62px" />
    </colgroup>`;
}
// @end-legacy-unit 841

// @legacy-unit 842 7831
export function managerQuantityTableWidth() {
  const fixedColumnsWidth = 108 + 110 + 46 + 120 + 210 + 86 + 92 + 100 + 52 + 62;
  const matrixWidth = managerQuantityVisibleStages().length
    * managerQuantityPhaseColumns().reduce((sum, column) => sum + managerQuantityColumnWidth(column), 0);
  return fixedColumnsWidth + matrixWidth;
}
// @end-legacy-unit 842

// @legacy-unit 843 7838
export function managerQuantityColumnCount() {
  const fixedLeftColumns = 8;
  const rightColumns = 2;
  return fixedLeftColumns + (managerQuantityVisibleStages().length * managerQuantityPhaseColumns().length) + rightColumns;
}
// @end-legacy-unit 843

// @legacy-unit 844 7844
export function managerQuantityEmptyMessage() {
  const filters = managerQuantityFilters();
  const parts = [];
  if (filters.station) parts.push(`${filters.station} station`);
  if (filters.phase) parts.push(`${STAGE_LABELS[filters.phase]} phase`);
  if (filters.project) parts.push(`${filters.project} project`);
  if (filters.item) parts.push(`${filters.item}`);
  if (filters.demandUnit) parts.push(`${filters.demandUnit}`);
  return parts.length
    ? `No ${parts.join(" / ")} demand rows match the current filters. Use Clear Filters to restore the matrix.`
    : "No submitted demand rows match the selected matrix filters.";
}
// @end-legacy-unit 844

// @legacy-unit 845 7857
export function managerQuantityVisibleStages() {
  const phase = managerQuantityFilters().phase;
  return phase ? STAGES.filter((stage) => stage === phase) : STAGES;
}
// @end-legacy-unit 845

// @legacy-unit 846 7862
export function managerQuantityPhaseColumns() {
  if (quantityReviewModeValue() === DEMAND_TYPE_NON_MFG) {
    return [
      ...quantityReviewColumnsForMode(DEMAND_TYPE_NON_MFG).map((name) => ({ name, group: "Demand Unit", type: "station" })),
      ...MANAGER_MFG_HEADER_MASTER.calculation.map((name) => ({ name, group: "Demand Calculation", type: "calculation" })),
    ];
  }
  return [
    ...MANAGER_MFG_HEADER_MASTER.mainline.map((name) => ({ name, group: "Mainline", type: "station" })),
    ...MANAGER_MFG_HEADER_MASTER.packing.map((name) => ({ name, group: "Packing", type: "station" })),
    ...MANAGER_MFG_HEADER_MASTER.supporting.map((name) => ({ name, group: "Supporting", type: "station" })),
    ...MANAGER_MFG_HEADER_MASTER.calculation.map((name) => ({ name, group: "Demand Calculation", type: "calculation" })),
  ];
}
// @end-legacy-unit 846

// @legacy-unit 847 7877
export function managerQuantityGroupColspans() {
  if (quantityReviewModeValue() === DEMAND_TYPE_NON_MFG) {
    return [
      ["Demand Unit", quantityReviewColumnsForMode(DEMAND_TYPE_NON_MFG).length],
      ["Demand Calculation", MANAGER_MFG_HEADER_MASTER.calculation.length],
    ];
  }
  return [
    ["Mainline", MANAGER_MFG_HEADER_MASTER.mainline.length],
    ["Packing", MANAGER_MFG_HEADER_MASTER.packing.length],
    ["Supporting", MANAGER_MFG_HEADER_MASTER.supporting.length],
    ["Demand Calculation", MANAGER_MFG_HEADER_MASTER.calculation.length],
  ];
}
// @end-legacy-unit 847

// @legacy-unit 848 7892
export function managerQuantitySortGroups(groups) {
  const sort = managerQuantityFilters().sort;
  const sorted = [...groups];
  const compareText = (left, right) => `${left.project} ${left.item}`.localeCompare(`${right.project} ${right.item}`);
  if (sort === "unitPriceDesc") return sorted.sort((left, right) => right.unitPrice - left.unitPrice || compareText(left, right));
  if (sort === "unitPriceAsc") return sorted.sort((left, right) => (left.unitPrice || Number.MAX_SAFE_INTEGER) - (right.unitPrice || Number.MAX_SAFE_INTEGER) || compareText(left, right));
  if (sort === "amountDesc") return sorted.sort((left, right) => right.estimatedAmount - left.estimatedAmount || compareText(left, right));
  if (sort === "amountAsc") return sorted.sort((left, right) => (left.estimatedAmount || Number.MAX_SAFE_INTEGER) - (right.estimatedAmount || Number.MAX_SAFE_INTEGER) || compareText(left, right));
  if (sort === "qtyDesc") return sorted.sort((left, right) => right.totalQty - left.totalQty || compareText(left, right));
  return sorted.sort(compareText);
}
// @end-legacy-unit 848

// @legacy-unit 849 7904
export function managerQuantitySelectedScopeLabel() {
  const filters = managerQuantityFilters();
  return [
    filters.project || "All projects",
    filters.requestLine || "All lines",
    filters.item || "All items",
    filters.phase ? STAGE_LABELS[filters.phase] : "All phases",
    filters.station || "All stations",
    filters.demandUnit || "All units",
  ].join(" / ");
}
// @end-legacy-unit 849

// @legacy-unit 850 7916
export function managerQuantityGroups() {
  const groups = new Map();
  managerQuantityFilteredEntries().forEach((entry) => {
    const key = managerQuantityGroupKey(entry.request);
    if (!groups.has(key)) groups.set(key, createManagerQuantityGroup(entry.request));
    const group = groups.get(key);
    group.requests.set(entry.request.id, entry.request);
    group.statuses.add(entry.request.status);
    group.phaseTotals[entry.phase] += entry.qty;
    const columnKey = quantityReviewEntryColumn(entry, entry.request);
    group.stationTotals[entry.phase].set(columnKey, (group.stationTotals[entry.phase].get(columnKey) || 0) + entry.qty);
    const unitKey = managerQuantityEntryUnit(entry);
    if (unitKey) group.unitTotals.set(unitKey, (group.unitTotals.get(unitKey) || 0) + entry.qty);
    group.totalQty += entry.qty;
    group.detailRows.push(entry);
    group.priceCandidates.push(managerQuantityPriceCandidate(entry.request));
  });
  return managerQuantitySortGroups([...groups.values()].map((group) => {
    const price = managerQuantityResolvePrice(group.priceCandidates);
    return {
      ...group,
      unitPrice: price.unitPrice,
      priceSource: price.source,
      estimatedAmount: price.unitPrice ? price.unitPrice * group.totalQty : 0,
    };
  }))
    .map((group, index) => ({ ...group, keyId: `MQ-${index}` }));
}
// @end-legacy-unit 850

// @legacy-unit 851 7945
export function stationGroupLabel(station) {
  if (quantityReviewModeValue() === DEMAND_TYPE_NON_MFG) return "Demand Unit";
  if (MANAGER_MFG_HEADER_MASTER.mainline.includes(station)) return "Mainline";
  if (MANAGER_MFG_HEADER_MASTER.packing.includes(station)) return "Packing";
  if (MANAGER_MFG_HEADER_MASTER.supporting.includes(station)) return "Supporting";
  return "Station";
}
// @end-legacy-unit 851

// @legacy-unit 852 7953
export function managerQuantityPhaseCell(group, stage) {
  const total = group.phaseTotals[stage] || 0;
  if (!total) {
    return `<div class="quantity-matrix-compact empty">0</div>`;
  }
  const stations = [...group.stationTotals[stage].entries()]
    .filter(([, qty]) => qty > 0)
    .sort((left, right) => quantityReviewColumnsForMode().indexOf(left[0]) - quantityReviewColumnsForMode().indexOf(right[0]));
  const inlineHtml = (values) => values.map(([station, qty]) => `${station} ${qty}`).join(" / ");
  if (quantityReviewModeValue() === DEMAND_TYPE_NON_MFG) {
    return `
      <div class="quantity-matrix-compact">
        <strong>Total ${total}</strong>
        <span><b>Unit:</b> ${inlineHtml(stations)}</span>
      </div>`;
  }
  const lines = ["Mainline", "Packing", "Supporting"].map((label) => {
    const values = stations.filter(([station]) => stationGroupLabel(station) === label);
    if (!values.length) return "";
    return `<span><b>${label}:</b> ${inlineHtml(values)}</span>`;
  }).filter(Boolean).join("");
  return `
    <div class="quantity-matrix-compact">
      <strong>Total ${total}</strong>
      ${lines || `<span><b>Station:</b> ${inlineHtml(stations)}</span>`}
    </div>`;
}
// @end-legacy-unit 852

// @legacy-unit 853 7981
export function managerQuantityCarryoverQty(group, stage) {
  const filters = managerQuantityFilters();
  return managerCarryoverQtyForScope({
    project: group.project,
    requestLine: filters.requestLine,
    phase: stage,
    item: group.item,
  });
}
// @end-legacy-unit 853

// @legacy-unit 854 7991
export function managerQuantityCarryoverRows(group, stage) {
  const filters = managerQuantityFilters();
  return managerCarryoverRowsForScope({
    project: group.project,
    requestLine: filters.requestLine,
    phase: stage,
    item: group.item,
  }, true);
}
// @end-legacy-unit 854

// @legacy-unit 855 8001
export function managerQuantityCarryoverClass(group, stage, column) {
  if (column.name !== "Actual Need QTY") return "";
  const status = managerCarryoverStatusBucket(managerQuantityCarryoverRows(group, stage));
  const carryoverClassByStatus = {
    applied: "carryover-cell-applied",
    pending: "carryover-cell-pending",
    rejected: "carryover-cell-rejected",
  };
  return carryoverClassByStatus[status] || "";
}
// @end-legacy-unit 855

// @legacy-unit 856 8012
export function managerQuantityCalcValue(group, stage, columnName) {
  const total = group.phaseTotals[stage] || 0;
  if (columnName === "Total Demand for EQ") return total || "";
  if (columnName === "Actual Need QTY") {
    const carryoverQty = Math.min(total, managerQuantityCarryoverQty(group, stage));
    if (!total && !carryoverQty) return "";
    const effectiveQty = Math.max(0, total - carryoverQty);
    return carryoverQty
      ? `<span class="quantity-saved-value" title="${htmlAttr(`Total Demand ${total} / Applied Carryover -${carryoverQty} / Actual Need ${effectiveQty}`)}">${effectiveQty}<span class="saved-badge">Saved</span></span>`
      : effectiveQty || "";
  }
  return "";
}
// @end-legacy-unit 856

// @legacy-unit 857 8026
export function managerQuantityCellValue(group, stage, column) {
  if (column.type === "station") return group.stationTotals[stage].get(column.name) || "";
  return managerQuantityCalcValue(group, stage, column.name);
}
// @end-legacy-unit 857

// @legacy-unit 858 8031
export function managerQuantityExpandableText(text, lines, groupKeyId, field) {
  const value = String(text || "-");
  const expanded = expandedManagerQuantityRows.has(`${groupKeyId}:${field}`);
  const threshold = field === "item" ? 28 : 86;
  const canExpand = value.length > threshold;
  return `
    <div class="quantity-text-cell ${expanded ? "expanded" : ""}">
      <div class="quantity-text-clamp quantity-text-clamp-${lines}" title="${htmlAttr(value)}">${value}</div>
      ${canExpand ? `<button type="button" class="quantity-expand-btn" data-manager-quantity-expand="${groupKeyId}" data-manager-quantity-expand-field="${field}">${expanded ? "Collapse" : "Expand"}</button>` : ""}
    </div>`;
}
// @end-legacy-unit 858

export function replaceManagerQuantityGroupsBinding(value) { managerQuantityGroups = value; return value; }
