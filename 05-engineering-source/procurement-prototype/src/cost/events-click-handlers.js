// cost/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderManager
} from "../approval/manager-view.js";
import {
  managerRows
} from "../approval/queues.js";
import {
  expandedManagerQuantityRows,
  replaceSelectedManagerAuthorizedRequestIdBinding,
  replaceSelectedManagerQuantityKeyIdBinding,
  replaceSelectedManagerRequestIdBinding,
  selectedManagerRequestId
} from "../approval/state.js";
import {
  syncProjectStatusScopeFromRow
} from "../progress/dashboard.js";
import {
  clearManagerProgressFilters
} from "../progress/demand.js";
import {
  syncProjectContextFromRow
} from "../projects/review-context.js";
import {
  setManagerTab
} from "../shell/navigation.js";
import {
  importActualBuyExcel,
  markActualBuyCompleted,
  saveActualBuy
} from "./actual-buy.js";
import {
  clearManagerDemandCostFilters,
  drillManagerDemandCost
} from "./dashboard-view.js";
import {
  closeManagerDetail,
  closeManagerTrack,
  openManagerDetail
} from "./detail-view.js";
import {
  openManagerDashboardPhaseDetail
} from "./manager-dashboard.js";
import {
  clearManagerQuantityFilters,
  closeManagerStageDetail,
  openManagerProgressDetail,
  openManagerQuantityDetail,
  openManagerStageDetail,
  renderManagerQuantityMatrix
} from "./matrix-view.js";

export function handleClickManagerTab(managerTab) {
  if (managerTab) setManagerTab(managerTab.dataset.managerTab);
}

export function handleClickClearManagerProgressFilters(action) {
  if (action === "clearManagerProgressFilters") clearManagerProgressFilters();
  if (action === "clearManagerQuantityFilters") clearManagerQuantityFilters();
  if (action === "clearManagerDemandCostFilters") clearManagerDemandCostFilters();
}

export function handleClickImportActualBuyExcel(action) {
  if (action === "importActualBuyExcel") importActualBuyExcel();
  if (action === "saveActualBuy") saveActualBuy();
  if (action === "markActualBuyCompleted") markActualBuyCompleted();
}

export function handleClickCloseManagerDetail(action) {
  if (action === "closeManagerDetail") closeManagerDetail();
  if (action === "closeManagerTrack") closeManagerTrack();
  if (action === "closeManagerStageDetail") closeManagerStageDetail();
}

export function handleClickManagerSelectButton(managerSelectButton, managerSelectRow, event, managerAuthorizedSelectRow) {
  if (managerSelectButton) {
    replaceSelectedManagerRequestIdBinding(managerSelectButton.dataset.managerSelect || selectedManagerRequestId);
    const selectedRow = managerRows().find((row) => row.id === selectedManagerRequestId);
    syncProjectContextFromRow("managerAuthorized", selectedRow);
    syncProjectStatusScopeFromRow(selectedRow);
    renderManager();
  }
  if (managerSelectRow && !event.target.closest("button, input, select, textarea, a")) {
    replaceSelectedManagerRequestIdBinding(managerSelectRow.dataset.managerSelectRow || selectedManagerRequestId);
    const selectedRow = managerRows().find((row) => row.id === selectedManagerRequestId);
    syncProjectContextFromRow("managerAuthorized", selectedRow);
    syncProjectStatusScopeFromRow(selectedRow);
    renderManager();
  }
  if (managerAuthorizedSelectRow && !event.target.closest("button, input, select, textarea, a")) {
    replaceSelectedManagerRequestIdBinding(managerAuthorizedSelectRow.dataset.managerAuthorizedSelectRow || selectedManagerRequestId);
    replaceSelectedManagerAuthorizedRequestIdBinding(selectedManagerRequestId);
    const selectedRow = managerRows().find((row) => row.id === selectedManagerRequestId);
    syncProjectContextFromRow("managerAuthorized", selectedRow);
    syncProjectStatusScopeFromRow(selectedRow);
    renderManager();
  }
}

export function handleClickManagerDetailButton(managerDetailButton, managerDashboardDetailButton, managerDashboardPhaseButton, managerDemandDetailButton, managerProgressDetailButton) {
  if (managerDetailButton) openManagerDetail(managerDetailButton.dataset.managerDetail);
  if (managerDashboardDetailButton) openManagerDetail(managerDashboardDetailButton.dataset.managerDashboardDetail, { readonly: true });
  if (managerDashboardPhaseButton) openManagerDashboardPhaseDetail(
    managerDashboardPhaseButton.dataset.managerDashboardPhaseProject,
    managerDashboardPhaseButton.dataset.managerDashboardPhaseStage,
  );
  if (managerDemandDetailButton) openManagerDetail(managerDemandDetailButton.dataset.managerDemandDetail, { readonly: true });
  if (managerProgressDetailButton) openManagerProgressDetail(managerProgressDetailButton.dataset.managerProgressDetail);
}

export function handleClickManagerDemandCostButton(managerDemandCostButton) {
  if (managerDemandCostButton) drillManagerDemandCost(
    managerDemandCostButton.dataset.managerDemandCostUnit,
    managerDemandCostButton.dataset.managerDemandCostPhase || "",
    managerDemandCostButton.dataset.managerDemandCostItem || "",
    managerDemandCostButton.dataset.managerDemandCostProject || "",
    managerDemandCostButton.dataset.managerDemandCostRequestId || managerDemandCostButton.dataset.approvalDashboardRequestId || "",
  );
}

export function handleClickManagerQuantitySelectRow(managerQuantitySelectRow, event, managerQuantityExpandButton) {
  if (managerQuantitySelectRow && !event.target.closest("button, input, select, textarea, a")) {
    replaceSelectedManagerQuantityKeyIdBinding(managerQuantitySelectRow.dataset.managerQuantitySelect);
    renderManagerQuantityMatrix();
  }
  if (managerQuantityExpandButton) {
    const key = `${managerQuantityExpandButton.dataset.managerQuantityExpand}:${managerQuantityExpandButton.dataset.managerQuantityExpandField || "spec"}`;
    if (expandedManagerQuantityRows.has(key)) expandedManagerQuantityRows.delete(key);
    else expandedManagerQuantityRows.add(key);
    renderManagerQuantityMatrix();
  }
}

export function handleClickManagerQuantityDetailButton(managerQuantityDetailButton) {
  if (managerQuantityDetailButton) openManagerQuantityDetail(managerQuantityDetailButton.dataset.managerQuantityDetail);
}

export function handleClickManagerStageDetailButton(managerStageDetailButton) {
  if (managerStageDetailButton) openManagerStageDetail(
    managerStageDetailButton.dataset.managerStageDetailProject,
    managerStageDetailButton.dataset.managerStageDetailStage,
    managerStageDetailButton.dataset.managerStageDetailLine || "",
  );
}
