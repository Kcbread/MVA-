// approval/quantity-scope: authoritative source; see docs/module-map.md.
import {
  priceReviewAnalysisDomIds
} from "./analysis-scope.js";
import {
  updateApprovalReviewState
} from "./navigation.js";
import {
  approvalQuantityReviewMode,
  approvalQuantityReviewTab,
  replaceApprovalQuantityReviewModeBinding,
  replaceApprovalQuantityReviewTabBinding
} from "./state.js";
import {
  managerDemandCostFilters
} from "../cost/dashboard-data.js";
import {
  managerDemandCostAmount
} from "../cost/dashboard-values.js";
import {
  managerQuantityPriceCandidate,
  managerQuantityResolvePrice
} from "../cost/matrix-data.js";
import {
  managerQuantityEntryUnit,
  managerQuantityFlattenRows
} from "../cost/quantity-filters.js";
import {
  demandTypeFor,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  QUANTITY_DASHBOARD_UNITS,
  STATION_MASTER
} from "../projects/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  currentView
} from "../shell/state.js";

// @legacy-unit 713 5992
export function quantityReviewModeValue(value = approvalQuantityReviewMode) {
  return value === DEMAND_TYPE_NON_MFG ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG;
}
// @end-legacy-unit 713

// @legacy-unit 714 5996
export function quantityReviewModeLabel(value = approvalQuantityReviewMode) {
  return quantityReviewModeValue(value) === DEMAND_TYPE_NON_MFG ? "Non-MFG" : "MFG";
}
// @end-legacy-unit 714

// @legacy-unit 715 6000
export function approvalQuantityReviewTabValue(value = approvalQuantityReviewTab) {
  return ["dashboard", "mfg", "nonMfg"].includes(value) ? value : "dashboard";
}
// @end-legacy-unit 715

// @legacy-unit 716 6004
export function approvalQuantityReviewModeForRow(row = null) {
  const breakdown = stationBreakdownRowsForDetail(row);
  if (breakdown.some((entry) => demandTypeFor(entry) === DEMAND_TYPE_MFG)) return DEMAND_TYPE_MFG;
  if (breakdown.some((entry) => demandTypeFor(entry) === DEMAND_TYPE_NON_MFG)) return DEMAND_TYPE_NON_MFG;
  return demandTypeFor(row);
}
// @end-legacy-unit 716

// @legacy-unit 717 6011
export function approvalQuantityReviewModeFromScope(scope = null, fallbackRow = null) {
  if (scope?.reviewMode) return quantityReviewModeValue(scope.reviewMode);
  if (scope?.station) return DEMAND_TYPE_MFG;
  if (scope?.demandUnit && scope.demandUnit !== "MFG") return DEMAND_TYPE_NON_MFG;
  if (scope?.unit && scope.unit !== "MFG") return DEMAND_TYPE_NON_MFG;
  return approvalQuantityReviewModeForRow(scope?.row || fallbackRow);
}
// @end-legacy-unit 717

// @legacy-unit 718 6019
export function setApprovalQuantityReviewMode(mode = DEMAND_TYPE_MFG, { preserveDashboard = true } = {}) {
  replaceApprovalQuantityReviewModeBinding(quantityReviewModeValue(mode));
  if (!preserveDashboard || approvalQuantityReviewTab !== "dashboard") {
    replaceApprovalQuantityReviewTabBinding(approvalQuantityReviewMode === DEMAND_TYPE_NON_MFG ? "nonMfg" : "mfg");
  }
}
// @end-legacy-unit 718

// @legacy-unit 719 6026
export function syncApprovalQuantityReviewTabState() {
  replaceApprovalQuantityReviewTabBinding(approvalQuantityReviewTabValue(approvalQuantityReviewTab));
  if (approvalQuantityReviewTab === "mfg") replaceApprovalQuantityReviewModeBinding(DEMAND_TYPE_MFG);
  if (approvalQuantityReviewTab === "nonMfg") replaceApprovalQuantityReviewModeBinding(DEMAND_TYPE_NON_MFG);
  updateApprovalReviewState(currentView === "manager" ? "manager" : currentRole, { quantityTab: approvalQuantityReviewTab });
  document.querySelectorAll("[data-approval-quantity-tab]").forEach((tab) => {
    const active = tab.dataset.approvalQuantityTab === approvalQuantityReviewTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll("[data-approval-quantity-panel='dashboard']").forEach((panel) => {
    panel.hidden = approvalQuantityReviewTab !== "dashboard";
  });
  document.querySelectorAll("[data-approval-quantity-panel='matrix']").forEach((panel) => {
    panel.hidden = approvalQuantityReviewTab === "dashboard";
  });
}
// @end-legacy-unit 719

// @legacy-unit 720 6044
export function approvalQuantityDetailLabel(tab = approvalQuantityReviewTab) {
  return tab === "nonMfg" ? "Non-MFG Department Detail" : "MFG Station Detail";
}
// @end-legacy-unit 720

// @legacy-unit 721 6048
export function detailScopeLabel(scope = null, tab = approvalQuantityReviewTab) {
  if (!scope) return "Select an item";
  return [
    scope.project || "No project",
    scope.item || "No item",
    "All phases",
    tab === "nonMfg" ? (scope.demandUnit || "All Non-MFG departments") : "All MFG stations",
  ].filter(Boolean).join(" / ");
}
// @end-legacy-unit 721

// @legacy-unit 722 6058
export function priceReviewDetailScopeForTab(scope = null, tab = approvalQuantityReviewTab) {
  if (!scope) return null;
  const nextTab = approvalQuantityReviewTabValue(tab);
  if (nextTab === "dashboard") return scope;
  const isNonMfg = nextTab === "nonMfg";
  return {
    ...scope,
    phase: "",
    station: "",
    demandUnit: "",
    reviewMode: isNonMfg ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG,
    label: detailScopeLabel({
      ...scope,
      phase: "",
      station: "",
      demandUnit: isNonMfg ? "" : "MFG",
    }, nextTab),
  };
}
// @end-legacy-unit 722

// @legacy-unit 723 6078
export function syncPriceReviewDetailTitle(mode = "inline") {
  const ids = priceReviewAnalysisDomIds(mode);
  const title = document.getElementById(ids.quantity.title);
  const helper = document.getElementById(ids.quantity.helper);
  if (title) title.textContent = approvalQuantityDetailLabel(approvalQuantityReviewTab);
  if (helper) {
    helper.textContent = approvalQuantityReviewTab === "nonMfg"
      ? "Selected item by phase and Non-MFG department. Use Dashboard cells to focus one department."
      : "Selected item by phase and MFG station. Use Dashboard MFG to open this station view.";
  }
}
// @end-legacy-unit 723

// @legacy-unit 724 6090
export function quantityReviewColumnsForMode(value = approvalQuantityReviewMode) {
  return quantityReviewModeValue(value) === DEMAND_TYPE_NON_MFG
    ? QUANTITY_DASHBOARD_UNITS.filter((unit) => unit !== "MFG")
    : STATION_MASTER;
}
// @end-legacy-unit 724

// @legacy-unit 725 6096
export function minDemandUnitKind(row = {}) {
  return approvalQuantityReviewModeForRow(row) === DEMAND_TYPE_NON_MFG ? "department" : "station";
}
// @end-legacy-unit 725

// @legacy-unit 726 6100
export function minDemandUnitLabel(row = {}) {
  return minDemandUnitKind(row) === "department" ? "Department" : "Station";
}
// @end-legacy-unit 726

// @legacy-unit 727 6104
export function minDemandUnitValues(row = {}) {
  const kind = minDemandUnitKind(row);
  const values = stationBreakdownRowsForDetail(row)
    .filter((entry) => stationBreakdownRowTotal(entry) > 0)
    .filter((entry) => kind === "station" ? demandTypeFor(entry) === DEMAND_TYPE_MFG : demandTypeFor(entry) === DEMAND_TYPE_NON_MFG)
    .map((entry) => kind === "station" ? (entry.station || STATION_MASTER[0]) : managerQuantityEntryUnit(entry))
    .filter(Boolean);
  return [...new Set(values)];
}
// @end-legacy-unit 727

// @legacy-unit 728 6114
export function minDemandUnitValue(row = {}) {
  const values = minDemandUnitValues(row);
  if (!values.length) return "-";
  return values.length > 2 ? `${values.slice(0, 2).join(" / ")} +${values.length - 2}` : values.join(" / ");
}
// @end-legacy-unit 728

// @legacy-unit 729 6120
export function minDemandUnitSummary(row = {}) {
  return `${minDemandUnitLabel(row)}: ${minDemandUnitValue(row)}`;
}
// @end-legacy-unit 729

// @legacy-unit 730 6124
export function quantityReviewEntryColumn(entry, row) {
  return demandTypeFor(entry) === DEMAND_TYPE_MFG
    ? (entry.station || STATION_MASTER[0])
    : managerQuantityEntryUnit({ ...entry, request: row });
}
// @end-legacy-unit 730

// @legacy-unit 731 6130
export function quantityReviewScopeRows(filters = managerDemandCostFilters(), mode = approvalQuantityReviewMode) {
  const reviewMode = quantityReviewModeValue(mode);
  return managerQuantityFlattenRows()
    .filter((entry) =>
      (!filters.project || entry.request.project === filters.project)
      && (!filters.requestLine || entry.requestLine === filters.requestLine)
      && (!filters.phase || entry.phase === filters.phase)
      && demandTypeFor(entry) === reviewMode);
}
// @end-legacy-unit 731

// @legacy-unit 732 6140
export function quantityReviewSummaryTotals(filters = managerDemandCostFilters(), mode = approvalQuantityReviewMode) {
  const columns = quantityReviewColumnsForMode(mode);
  const totals = Object.fromEntries(columns.map((column) => [column, {
    originalQty: 0,
    actualNeedQty: 0,
    carryoverQty: 0,
    effectiveQty: 0,
    originalAmount: 0,
    actualNeedAmount: 0,
    savingAmount: 0,
    effectiveAmount: 0,
    carryoverRows: [],
    row: null,
  }]));
  quantityReviewScopeRows(filters, mode).forEach((entry) => {
    const column = quantityReviewEntryColumn(entry, entry.request);
    if (!totals[column]) return;
    const qty = stationBreakdownRowTotal(entry);
    const price = managerQuantityResolvePrice([managerQuantityPriceCandidate(entry.request)]).unitPrice || 0;
    const amount = price ? managerDemandCostAmount({ unitPrice: price }, qty, filters.lineCount) : 0;
    totals[column].originalQty += qty;
    totals[column].actualNeedQty += qty;
    totals[column].effectiveQty += qty;
    totals[column].originalAmount += amount;
    totals[column].actualNeedAmount += amount;
    totals[column].effectiveAmount += amount;
    totals[column].row ||= entry.request;
  });
  return totals;
}
// @end-legacy-unit 732
