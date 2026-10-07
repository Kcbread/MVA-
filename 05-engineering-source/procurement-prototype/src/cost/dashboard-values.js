// cost/dashboard-values: authoritative source; see docs/module-map.md.
import {
  formatCompactCurrencyFromUsd,
  formatMoneyFromUsd
} from "./currency.js";
import {
  managerDemandCostFilters
} from "./dashboard-data.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  demandCostDashboardModule
} from "../infrastructure/module-adapters.js";
import {
  managerCarryoverFlowLabels,
  managerCarryoverIsApplied,
  managerCarryoverNeedsDriReview,
  managerCarryoverRowsForScope,
  managerCarryoverStatusBucket
} from "../inventory/cost-evidence.js";
import {
  QUANTITY_DASHBOARD_UNITS,
  STAGE_LABELS
} from "../projects/config.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 743 6249
export function managerDemandCostCellQty(row, unit, filters = managerDemandCostFilters()) {
  if (!filters.phase) return row.unitTotals?.[unit] || 0;
  return row.phaseUnitTotals?.[filters.phase]?.[unit] || 0;
}
// @end-legacy-unit 743

// @legacy-unit 744 6254
export function managerDemandCostAmount(row, qty, lineCount = 1) {
  return row.unitPrice ? row.unitPrice * qty * lineCount : 0;
}
// @end-legacy-unit 744

// @legacy-unit 745 6258
export function managerDemandCostCellImpact(row, unit, filters) {
  const baseQty = managerDemandCostCellQty(row, unit, filters);
  const carryoverRows = managerCarryoverRowsForScope({
    project: filters.project,
    requestLine: filters.requestLine,
    phase: filters.phase,
    item: row.item,
    unit,
  }, true);
  const appliedRows = carryoverRows.filter(managerCarryoverIsApplied);
  const requestedCarryoverQty = appliedRows.reduce((sum, item) => sum + clampQty(item.carryoverQty), 0);
  const unitPrice = row.unitPrice || 0;
  const moduleImpact = demandCostDashboardModule()?.calculateCarryoverCostImpact?.({
    submittedQty: baseQty,
    lineCount: filters.lineCount,
    carryoverQty: requestedCarryoverQty,
    unitPrice,
    status: appliedRows.length ? "Applied" : managerCarryoverStatusBucket(carryoverRows),
  }) || {};
  return {
    ...moduleImpact,
    baseQty,
    requestedCarryoverQty,
    flowLabels: managerCarryoverFlowLabels(carryoverRows),
    status: managerCarryoverStatusBucket(carryoverRows),
    carryoverRows,
  };
}
// @end-legacy-unit 745

// @legacy-unit 746 6287
export function managerDemandCostOverallImpact(rows, filters) {
  return rows.reduce((acc, row) => {
    QUANTITY_DASHBOARD_UNITS.forEach((unit) => {
      const impact = managerDemandCostCellImpact(row, unit, filters);
      acc.originalQty += impact.originalQty;
      acc.carryoverQty += impact.carryoverQty;
      acc.effectiveQty += impact.effectiveQty;
      acc.originalAmount += impact.originalAmount;
      acc.savingAmount += impact.savingAmount;
      acc.effectiveAmount += impact.effectiveAmount;
    });
    return acc;
  }, {
    originalQty: 0,
    carryoverQty: 0,
    effectiveQty: 0,
    originalAmount: 0,
    savingAmount: 0,
    effectiveAmount: 0,
  });
}
// @end-legacy-unit 746

// @legacy-unit 747 6309
export function managerDemandCostDisplayValue(row, qty, viewMode, lineCount = 1) {
  if (!qty) return "";
  if (viewMode === "amount") return row.unitPrice ? formatCompactCurrencyFromUsd(managerDemandCostAmount(row, qty, lineCount)) : "Price pending";
  return qty;
}
// @end-legacy-unit 747

// @legacy-unit 748 6315
export function managerDemandCostImpactTitle(impact) {
  const flow = impact.flowLabels?.length ? ` / Flow: ${impact.flowLabels.join(" / ")}` : "";
  const pendingQty = (impact.carryoverRows || [])
    .filter((row) => managerCarryoverNeedsDriReview(row) && !managerCarryoverIsApplied(row))
    .reduce((sum, row) => sum + clampQty(row.carryoverQty), 0);
  const pending = pendingQty ? ` / Pending candidate ${pendingQty} qty, not counted` : "";
  return `Original Qty ${impact.originalQty} / Confirmed Carryover -${impact.carryoverQty} / Effective Qty ${impact.effectiveQty} / Original Cost ${formatMoneyFromUsd(impact.originalAmount)} / Confirmed Saving ${formatMoneyFromUsd(impact.savingAmount)} / Effective Cost ${formatMoneyFromUsd(impact.effectiveAmount)}${pending}${flow}`;
}
// @end-legacy-unit 748

// @legacy-unit 749 6324
export function managerDemandCostCellClass(impact, baseClass = "") {
  const carryoverClassByStatus = {
    applied: "carryover-cell-applied",
    "pending-dri": "carryover-cell-pending-dri",
    pending: "carryover-cell-pending",
    rejected: "carryover-cell-rejected",
  };
  const status = carryoverClassByStatus[impact.status] || "";
  return [baseClass, status].filter(Boolean).join(" ");
}
// @end-legacy-unit 749

// @legacy-unit 750 6335
export function managerDemandCostMainValue(impact, viewMode, hasPrice = true) {
  if (!impact.originalQty && !impact.carryoverQty) return "";
  const pair = demandCostDashboardModule()?.costQtyDisplayPair?.({
    viewMode,
    effectiveQty: impact.effectiveQty,
    effectiveAmount: impact.effectiveAmount,
    hasPrice,
  });
  if (pair) return viewMode === "amount" && hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : String(pair.main);
  if (viewMode === "amount") return hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : "Price pending";
  return String(impact.effectiveQty);
}
// @end-legacy-unit 750

// @legacy-unit 751 6348
export function managerDemandCostSubValue(impact, viewMode, hasPrice = true) {
  if (!impact.originalQty && !impact.carryoverQty) return "";
  const pair = demandCostDashboardModule()?.costQtyDisplayPair?.({
    viewMode,
    effectiveQty: impact.effectiveQty,
    effectiveAmount: impact.effectiveAmount,
    hasPrice,
  });
  if (pair) return viewMode === "qty" && hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : String(pair.sub);
  if (viewMode === "amount") return `${impact.effectiveQty} qty`;
  return hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : "Price pending";
}
// @end-legacy-unit 751

// @legacy-unit 752 6361
export function renderManagerDemandCostValue(impact, viewMode, { hasPrice = true, buttonAttrs = "" } = {}) {
  const main = managerDemandCostMainValue(impact, viewMode, hasPrice);
  const sub = managerDemandCostSubValue(impact, viewMode, hasPrice);
  const badge = impact.status === "applied"
    ? `<span class="saved-badge">Saved</span>`
    : impact.status === "pending" || impact.status === "pending-dri"
      ? `<span class="saved-badge pending">${impact.status === "pending-dri" ? "Pending DRI" : "Pending"}</span>`
      : impact.status === "rejected"
        ? `<span class="saved-badge rejected">Rejected</span>`
        : "";
  const projectStatusBadge = impact.projectStatusStage
    ? `<span class="project-status-stage-badge project-status-stage-badge--${htmlAttr(impact.projectStatusTone || "pending")}">${htmlText(impact.projectStatusStage)}</span>`
    : "";
  const valueHtml = `
    <span class="demand-cost-cell-main">${main || "-"}</span>
    ${sub ? `<span class="demand-cost-cell-sub">${sub}</span>` : ""}
    ${badge}
    ${projectStatusBadge}`;
  return buttonAttrs
    ? `<button type="button" class="demand-cost-cell-btn" ${buttonAttrs}>${valueHtml}</button>`
    : `<span class="demand-cost-cell-value">${valueHtml}</span>`;
}
// @end-legacy-unit 752

// @legacy-unit 753 6384
export function managerDemandCostScopeLabel(filters) {
  return [
    filters.project || "All projects",
    filters.requestLine || "All lines",
    filters.phase ? STAGE_LABELS[filters.phase] : "All stages",
    `${filters.lineCount} line count`,
  ].join(" / ");
}
// @end-legacy-unit 753

// @legacy-unit 754 6393
export function managerDemandCostSavingPercent(impact) {
  if (!impact.originalAmount) return "0%";
  return `${((impact.savingAmount / impact.originalAmount) * 100).toFixed(1)}%`;
}
// @end-legacy-unit 754

// @legacy-unit 755 6398
export function renderManagerDemandCostCarryoverCompare(impact, filters) {
  const container = document.getElementById("managerDemandCostCarryoverCompare");
  if (!container) return;
  const hasSaving = impact.savingAmount > 0;
  container.innerHTML = `
    <div class="carryover-cost-strip" aria-label="Carryover cost compare">
      <div class="carryover-cost-card shared-total-highlight shared-total-highlight--band">
        <span>Original Cost</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(impact.originalAmount))}">${formatCompactCurrencyFromUsd(impact.originalAmount)}</strong>
        <small>Before applied carryover</small>
      </div>
      <div class="carryover-cost-card saving shared-total-highlight shared-total-highlight--band">
        <span>Confirmed Carryover Saving</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(impact.savingAmount))}">-${formatCompactCurrencyFromUsd(impact.savingAmount)}</strong>
        <small>${hasSaving ? `${managerDemandCostSavingPercent(impact)} saved` : "No confirmed carryover"}</small>
      </div>
      <div class="carryover-cost-card effective shared-total-highlight shared-total-highlight--band">
        <span>Effective Cost</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(impact.effectiveAmount))}">${formatCompactCurrencyFromUsd(impact.effectiveAmount)}</strong>
        <small>After applied carryover</small>
      </div>
    </div>`;
}
// @end-legacy-unit 755
