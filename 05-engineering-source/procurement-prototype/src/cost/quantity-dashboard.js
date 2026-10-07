// cost/quantity-dashboard: authoritative source; see docs/module-map.md.
import {
  replaceSelectedManagerQuantityKeyIdBinding,
  selectedManagerQuantityKeyId
} from "../approval/state.js";
import {
  formatMoneyFromUsd
} from "./currency.js";
import {
  managerQuantityGroupKey,
  managerQuantityPriceCandidate,
  managerQuantityResolvePrice
} from "./matrix-data.js";
import {
  renderManagerQuantityMatrix
} from "./matrix-view.js";
import {
  managerQuantityEntryMatchesStationFilter,
  managerQuantityEntryUnit,
  managerQuantityFilters,
  managerQuantityFlattenRows,
  normalizeQuantityDashboardUnit
} from "./quantity-filters.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  QUANTITY_DASHBOARD_UNITS,
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
import {
  htmlAttr
} from "../shared/html.js";

// @legacy-unit 696 5627
export function quantityDashboardHeatClass(value, maxValue) {
  if (!value) return "empty";
  const ratio = maxValue ? value / maxValue : 0;
  if (ratio >= 0.75) return "heat-critical";
  if (ratio >= 0.45) return "heat-high";
  if (ratio >= 0.2) return "heat-mid";
  return "heat-low";
}
// @end-legacy-unit 696

// @legacy-unit 697 5636
export function managerUnitSplitSettings() {
  const phaseControl = document.getElementById("managerUnitSplitPhase");
  const phase = STAGES.includes(phaseControl?.value) ? phaseControl.value : (managerQuantityFilters().phase || STAGES[0]);
  if (phaseControl && phaseControl.value !== phase) phaseControl.value = phase;
  const lineCount = Math.max(1, clampQty(document.getElementById("managerUnitSplitLineCount")?.value || 1));
  const viewMode = document.getElementById("managerUnitSplitViewMode")?.value === "amount" ? "amount" : "qty";
  return { phase, lineCount, viewMode };
}
// @end-legacy-unit 697

// @legacy-unit 698 5645
export function unitSplitDisplayValue(qty, unitPrice, lineCount, viewMode) {
  if (!qty) return "";
  if (viewMode === "amount") return unitPrice ? formatMoneyFromUsd(qty * unitPrice * lineCount) : "Price pending";
  return qty;
}
// @end-legacy-unit 698

// @legacy-unit 699 5651
export function managerQuantityUnitDashboardData() {
  const filters = managerQuantityFilters();
  const { phase, lineCount, viewMode } = managerUnitSplitSettings();
  const entries = managerQuantityFlattenRows().filter((entry) =>
    (!filters.project || entry.request.project === filters.project)
    && (!filters.requestLine || entry.requestLine === filters.requestLine)
    && (!filters.item || entry.request.name === filters.item)
    && entry.phase === phase
    && managerQuantityEntryMatchesStationFilter(entry, filters.station)
    && (!filters.demandUnit || managerQuantityEntryUnit(entry) === filters.demandUnit)
  );
  const rows = new Map();
  const columnTotals = Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, { qty: 0, lineCount: 0 }]));
  const columnAmountTotals = Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, 0]));
  const unmapped = new Map();

  entries.forEach((entry) => {
    const groupKey = managerQuantityGroupKey(entry.request);
    if (!rows.has(groupKey)) {
      rows.set(groupKey, {
        key: groupKey,
        project: entry.request.project || "-",
        item: entry.request.name || "-",
        spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
        priceCandidates: [],
        unitPrice: 0,
        priceSource: "Price Pending",
        totalQty: 0,
        lineCount: 0,
        cells: Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, { qty: 0, lineCount: 0 }])),
      });
    }
    const row = rows.get(groupKey);
    row.priceCandidates.push(managerQuantityPriceCandidate(entry.request));
    row.totalQty += entry.qty;
    row.lineCount += 1;
    const unit = managerQuantityEntryUnit(entry);
    if (!unit) {
      const key = entry.demandUnit || entry.demandType || "Blank";
      const current = unmapped.get(key) || { qty: 0, lineCount: 0 };
      current.qty += entry.qty;
      current.lineCount += 1;
      unmapped.set(key, current);
      return;
    }
    row.cells[unit].qty += entry.qty;
    row.cells[unit].lineCount += 1;
    columnTotals[unit].qty += entry.qty;
    columnTotals[unit].lineCount += 1;
  });

  const rowList = [...rows.values()].map((row) => {
    const price = managerQuantityResolvePrice(row.priceCandidates);
    const resolved = { ...row, unitPrice: price.unitPrice, priceSource: price.source };
    if (price.unitPrice) {
      QUANTITY_DASHBOARD_UNITS.forEach((unit) => {
        columnAmountTotals[unit] += resolved.cells[unit].qty * price.unitPrice * lineCount;
      });
    }
    return resolved;
  }).sort((left, right) => right.totalQty - left.totalQty || `${left.project} ${left.item}`.localeCompare(`${right.project} ${right.item}`));
  const maxQty = Math.max(0, ...rowList.flatMap((row) => QUANTITY_DASHBOARD_UNITS.map((unit) => row.cells[unit].qty)));
  const maxAmount = Math.max(0, ...rowList.flatMap((row) => QUANTITY_DASHBOARD_UNITS.map((unit) => row.unitPrice ? row.cells[unit].qty * row.unitPrice * lineCount : 0)));
  return { rows: rowList, columnTotals, columnAmountTotals, unmapped, lineCount, viewMode, phase, maxValue: viewMode === "amount" ? maxAmount : maxQty };
}
// @end-legacy-unit 699

// @legacy-unit 700 5717
export function managerQuantityTopItems(limit = 8) {
  const filters = managerQuantityFilters();
  const groups = new Map();
  managerQuantityFlattenRows()
    .filter((entry) =>
      (!filters.project || entry.request.project === filters.project)
      && (!filters.requestLine || entry.requestLine === filters.requestLine)
      && (!filters.phase || entry.phase === filters.phase)
      && managerQuantityEntryMatchesStationFilter(entry, filters.station)
      && (!filters.demandUnit || managerQuantityEntryUnit(entry) === filters.demandUnit)
    )
    .forEach((entry) => {
      const key = entry.request.name || "-";
      if (!groups.has(key)) {
        groups.set(key, {
          item: key,
          project: entry.request.project || "-",
          spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          qty: 0,
          lines: 0,
        });
      }
      const group = groups.get(key);
      group.qty += entry.qty;
      group.lines += 1;
    });
  return [...groups.values()]
    .sort((left, right) => right.qty - left.qty || left.item.localeCompare(right.item))
    .slice(0, limit);
}
// @end-legacy-unit 700

// @legacy-unit 703 5760
export function setManagerQuantitySelectValue(id, value) {
  const select = document.getElementById(id);
  if (!select) return;
  const option = [...select.options].find((item) => item.value === value);
  if (option || !value) select.value = value;
}
// @end-legacy-unit 703

// @legacy-unit 704 5767
export function applyManagerQuantityDashboardFilter(phase = "", unit = "") {
  const dashboardUnit = unit ? QUANTITY_DASHBOARD_UNITS.includes(unit) ? unit : normalizeQuantityDashboardUnit(unit) : "";
  setManagerQuantitySelectValue("managerQuantityPhaseFilter", phase);
  if (dashboardUnit) {
    const select = document.getElementById("managerQuantityUnitFilter");
    const matchingOption = [...(select?.options || [])].find((option) => normalizeQuantityDashboardUnit(option.value) === dashboardUnit);
    if (matchingOption) select.value = matchingOption.value;
  } else {
    setManagerQuantitySelectValue("managerQuantityUnitFilter", "");
  }
  replaceSelectedManagerQuantityKeyIdBinding("");
  renderManagerQuantityMatrix();
}
// @end-legacy-unit 704

// @legacy-unit 705 5781
export function applyManagerQuantityDashboardCellFilter(item = "", phase = "", unit = "") {
  if (item) setManagerQuantitySelectValue("managerQuantityItemFilter", item);
  applyManagerQuantityDashboardFilter(phase, unit);
}
// @end-legacy-unit 705

// @legacy-unit 706 5786
export function applyManagerQuantityItemFilter(item = "") {
  setManagerQuantitySelectValue("managerQuantityItemFilter", item);
  replaceSelectedManagerQuantityKeyIdBinding("");
  renderManagerQuantityMatrix();
}
// @end-legacy-unit 706

// @legacy-unit 707 5792
export function renderManagerQuantityUnitDashboard() {
  const head = document.getElementById("managerQuantityUnitDashboardHead");
  const body = document.getElementById("managerQuantityUnitDashboardRows");
  const foot = document.getElementById("managerQuantityUnitDashboardFoot");
  const meta = document.getElementById("managerQuantityUnitDashboardMeta");
  const unmappedTarget = document.getElementById("managerQuantityUnitUnmapped");
  if (!head || !body || !foot) return;
  const filters = managerQuantityFilters();
  const { rows, columnTotals, columnAmountTotals, unmapped, maxValue, lineCount, viewMode, phase } = managerQuantityUnitDashboardData();
  head.innerHTML = `
    <tr>
      <th class="unit-dashboard-item-head">Item</th>
      <th class="unit-dashboard-spec-head">Spec / Price</th>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `
        <th>
          <button class="unit-dashboard-head-button ${normalizeQuantityDashboardUnit(filters.demandUnit) === unit ? "active" : ""}" type="button" data-quantity-dashboard-unit="${unit}">${unit}</button>
        </th>`).join("")}
      <th>Total</th>
    </tr>`;
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <th>
        <button class="unit-dashboard-item-button" type="button" data-quantity-dashboard-item="${htmlAttr(row.item)}" title="${htmlAttr(`${row.project} / ${row.item}`)}">
          <strong>${row.item}</strong>
          <span>${row.project} · ${row.totalQty} qty · ${row.lineCount} lines</span>
        </button>
      </th>
      <td class="unit-dashboard-spec-cell" title="${htmlAttr(row.spec)}">
        <div>${row.spec}</div>
        <span>${row.unitPrice ? `${formatMoneyFromUsd(row.unitPrice)} · ${row.priceSource}` : "Price pending"}</span>
      </td>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => {
        const cell = row.cells[unit];
        const comparableValue = viewMode === "amount" && row.unitPrice ? cell.qty * row.unitPrice * lineCount : cell.qty;
        return `
          <td>
            <button class="unit-dashboard-cell ${quantityDashboardHeatClass(comparableValue, maxValue)}" type="button" data-quantity-dashboard-item="${htmlAttr(row.item)}" data-quantity-dashboard-phase="${phase}" data-quantity-dashboard-unit="${unit}">
              <strong>${unitSplitDisplayValue(cell.qty, row.unitPrice, lineCount, viewMode)}</strong>
              <span>${cell.lineCount ? `${cell.lineCount} lines` : ""}</span>
            </button>
          </td>`;
      }).join("")}
      <td class="unit-dashboard-total">
        <strong>${unitSplitDisplayValue(row.totalQty, row.unitPrice, lineCount, viewMode)}</strong>
        <span>${row.lineCount ? `${row.lineCount} lines` : ""}</span>
      </td>
    </tr>`).join("") : `
    <tr>
      <td class="unit-dashboard-empty" colspan="${QUANTITY_DASHBOARD_UNITS.length + 3}">
        <strong>No unit split rows match current filters.</strong>
        <span>Clear filters or choose another phase to restore the dashboard.</span>
      </td>
    </tr>`;
  foot.innerHTML = `
    <tr>
      <th colspan="2">Total</th>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `
        <td class="unit-dashboard-total">
          <strong>${viewMode === "amount" ? (columnAmountTotals[unit] ? formatMoneyFromUsd(columnAmountTotals[unit]) : "") : (columnTotals[unit].qty || "")}</strong>
          <span>${columnTotals[unit].lineCount ? `${columnTotals[unit].lineCount} lines` : ""}</span>
        </td>`).join("")}
      <td class="unit-dashboard-total grand">
        <strong>${viewMode === "amount" ? (Object.values(columnAmountTotals).reduce((sum, amount) => sum + amount, 0) ? formatMoneyFromUsd(Object.values(columnAmountTotals).reduce((sum, amount) => sum + amount, 0)) : "") : rows.reduce((sum, item) => sum + item.totalQty, 0) || ""}</strong>
        <span>${rows.reduce((sum, item) => sum + item.lineCount, 0)} lines</span>
      </td>
    </tr>`;
  if (meta) meta.textContent = `${STAGE_LABELS[phase]} · ${lineCount} line count · ${viewMode === "amount" ? "Amount" : "Qty"} view`;
  const title = document.querySelector(".quantity-unit-dashboard-panel h3");
  const helper = document.querySelector(".quantity-unit-dashboard-panel .panel-subcopy");
  if (title) title.textContent = "Unit Split Dashboard";
  if (helper) helper.textContent = `Item x demand unit · ${STAGE_LABELS[phase]} · values are ${viewMode === "amount" ? "Qty x Unit Price x Line Count" : "submitted demand qty"}.`;
  if (unmappedTarget) {
    const unmappedText = [...unmapped.entries()].map(([unit, value]) => `${unit}: ${value.qty} (${value.lineCount} lines)`).join(" / ");
    unmappedTarget.hidden = !unmappedText;
    unmappedTarget.textContent = unmappedText ? `Unmapped Units: ${unmappedText}` : "";
  }
}
// @end-legacy-unit 707
