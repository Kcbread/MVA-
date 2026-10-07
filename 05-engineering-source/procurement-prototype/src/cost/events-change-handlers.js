// cost/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderManager
} from "../approval/manager-view.js";
import {
  renderPriceReview
} from "../approval/price-review.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  replaceSelectedProjectStatusScopeBinding,
  selectedProjectStatusScope
} from "../progress/state.js";
import {
  renderSourcing
} from "../sourcing/rfq.js";
import {
  upsertActualBuyField
} from "./actual-buy.js";
import {
  renderManagerDemandCostDashboard,
  syncManagerQuantityScopeFromDemandCost
} from "./dashboard-view.js";
import {
  renderManagerDashboard
} from "./manager-dashboard.js";
import {
  renderManagerQuantityMatrix
} from "./matrix-view.js";
import {
  renderManagerCostView
} from "./pricing.js";
import {
  renderManagerStageTracking
} from "./stage-view.js";
import {
  replaceCurrencyDisplayBinding
} from "./state.js";

export function handleChangeManagerProjectFilter(event) {
  if (event.target.id === "managerProjectFilter") renderManager();
  if (event.target.id === "managerStatusFilter") renderManager();
  if (event.target.id === "managerCostProjectFilter") renderManagerCostView();
  if (event.target.id === "managerStageProjectFilter") renderManagerStageTracking();
  if (event.target.id === "managerDemandProjectTypeFilter") renderManagerStageTracking();
  if ([
    "managerProgressYearFilter",
    "managerProgressProjectFilter",
    "managerProgressProcessFilter",
    "managerProgressStageFilter",
    "managerProgressDepartmentFilter",
    "managerProgressLateOnly",
    "managerProgressPendingOnly",
  ].includes(event.target.id)) renderManagerStageTracking();
}

export function handleChangeManagerDemandCostProjectFilter(event) {
  if ([
    "managerDemandCostProjectFilter",
    "managerDemandCostLineFilter",
    "managerDemandCostPhaseFilter",
    "managerDemandCostLineCount",
    "managerDemandCostViewMode",
  ].includes(event.target.id)) {
    syncManagerQuantityScopeFromDemandCost();
    renderManagerDemandCostDashboard();
    renderManagerQuantityMatrix();
  }
}

export function handleChangeManagerQuantityProjectFilter(event) {
  if ([
    "managerQuantityProjectFilter",
    "managerQuantityLineFilter",
    "managerQuantityItemFilter",
    "managerQuantityPhaseFilter",
    "managerQuantityStationFilter",
    "managerQuantityUnitFilter",
    "managerQuantitySortFilter",
    "managerUnitSplitPhase",
    "managerUnitSplitLineCount",
    "managerUnitSplitViewMode",
  ].includes(event.target.id)) renderManagerQuantityMatrix();
}

export function handleChangeCurrencyDisplaySelect(event) {
  if (event.target.id === "currencyDisplaySelect") {
    replaceCurrencyDisplayBinding(event.target.value === "USD" ? "USD" : "VND");
    const previousProjectStatusScope = { ...selectedProjectStatusScope };
    renderDepartment();
    renderPriceReview();
    renderManager();
    replaceSelectedProjectStatusScopeBinding(previousProjectStatusScope);
    renderProjectStatus();
    renderOmPurchasing();
    renderSourcing();
    renderBuyer();
  }
}

export function handleChangeManagerDashboardProjectFilter(event) {
  if (event.target.id === "managerDashboardProjectFilter") renderManagerDashboard();
  if (event.target.id === "managerDashboardStatusFilter") renderManagerDashboard();
}

export function handleChangeActualField(actualField, actualId, event) {
  if (actualField && actualId) {
    upsertActualBuyField(actualId, actualField, event.target.value);
    renderOmPurchasing();
    renderDepartment();
    renderManagerStageTracking();
  }
}
