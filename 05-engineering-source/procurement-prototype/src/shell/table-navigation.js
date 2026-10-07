// shell/table-navigation: authoritative source; see docs/module-map.md.
import {
  managerQuantityVisibleStages
} from "../cost/matrix-data.js";
import {
  syncRequestWorksheetVisiblePhase
} from "../demand/worksheet-view.js";
import {
  horizontalTableNavigatorModule
} from "../infrastructure/module-adapters.js";
import {
  QUANTITY_DASHBOARD_UNITS,
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";

// @legacy-unit 993 10958
export function refreshHorizontalTableNavigator(id, extraConfig = {}) {
  const module = horizontalTableNavigatorModule();
  const config = {
    id,
    ...extraConfig,
  };
  if (extraConfig.shellSelector || document.querySelector(`[data-horizontal-nav="${id}"]`)) {
    module.mount?.(config);
    module.refresh?.(id);
  }
}
// @end-legacy-unit 993

// @legacy-unit 994 10970
export function demandCostNavigatorGroups() {
  return [
    ...QUANTITY_DASHBOARD_UNITS.map((unit) => ({
      id: unit,
      label: unit,
      selector: `[data-demand-cost-unit-group="${unit}"]`,
    })),
    { id: "total", label: "Total", selector: '[data-demand-cost-unit-group="total"]' },
  ];
}
// @end-legacy-unit 994

// @legacy-unit 995 10981
export function quantityNavigatorGroups() {
  return [
    ...managerQuantityVisibleStages().map((stage) => ({
      id: stage,
      label: STAGE_LABELS[stage],
      selector: `[data-quantity-phase-group="${stage}"]`,
    })),
    { id: "total", label: "Total Qty", selector: '[data-quantity-phase-group="total"]' },
  ];
}
// @end-legacy-unit 995

// @legacy-unit 996 10992
export function refreshGlobalHorizontalNavigators() {
  refreshHorizontalTableNavigator("requestWorksheet", {
    shellSelector: ".request-worksheet-shell",
    groups: STAGES.map((stage) => ({ id: stage, label: STAGE_LABELS[stage], selector: `[data-request-phase-group="${stage}"]` })),
    positions: [],
    onStateChange: () => syncRequestWorksheetVisiblePhase(),
  });
  ["managerDemandCost", "priceReviewDemandCost", "priceReviewInlineDemandCost", "managerAuthorizedDemandCost", "projectStatusDashboard"].forEach((id) => refreshHorizontalTableNavigator(id, {
    label: "Unit Cost Columns",
    groups: demandCostNavigatorGroups(),
  }));
  [
    ["managerQuantity", "#managerQuantityMatrixShell"],
    ["managerAuthorizedQuantity", "#managerAuthorizedQuantityMatrixShell"],
    ["projectStatusMfgQuantity", "#projectStatusMfgMatrixShell"],
    ["projectStatusNonMfgQuantity", "#projectStatusNonMfgMatrixShell"],
    ["priceReviewQuantity", ""],
    ["priceReviewInlineQuantity", ""],
  ].forEach(([id, shellSelector]) => refreshHorizontalTableNavigator(id, {
    label: "Phase / Station Columns",
    groups: quantityNavigatorGroups(),
    shellSelector,
  }));
  refreshHorizontalTableNavigator("omQuoteResult", { label: "Quote Result Columns" });
}
// @end-legacy-unit 996
