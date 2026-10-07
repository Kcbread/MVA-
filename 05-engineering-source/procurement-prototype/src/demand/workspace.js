// demand/workspace: authoritative source; see docs/module-map.md.
import {
  renderItemPickerDemandContext,
  renderRequesterInputContext
} from "../catalog/context.js";
import {
  renderHistoryPackageRows,
  renderHistoryRows
} from "../catalog/history-view.js";
import {
  renderNaturalRows
} from "../catalog/natural-search-view.js";
import {
  syncCascade
} from "../catalog/taxonomy.js";
import {
  renderNeedConfirmationRows
} from "./amendments.js";
import {
  renderStationBreakdownRows
} from "./editor.js";
import {
  renderDeptStageTracking
} from "./matrix-view.js";
import {
  renderSelectedDemandLines
} from "./selected-lines.js";
import {
  renderSubmissionRows
} from "./submission-view.js";
import {
  renderRequestRows,
  renderUserDemandOverview
} from "./worksheet-actions.js";
import {
  renderWarehouseMaintenance
} from "../inventory/warehouse.js";
import {
  syncProjectControls
} from "../projects/controls.js";

// @legacy-unit 932 10126
export function renderDepartment() {
  syncProjectControls();
  syncCascade("natural");
  syncCascade("history");
  renderItemPickerDemandContext();
  renderRequesterInputContext();
  renderNaturalRows();
  renderRequestRows();
  renderUserDemandOverview();
  renderStationBreakdownRows();
  renderHistoryRows();
  renderHistoryPackageRows();
  renderSelectedDemandLines();
  renderDeptStageTracking();
  renderNeedConfirmationRows();
  renderSubmissionRows();
  renderWarehouseMaintenance();
  if (typeof window.renderRequesterTempBudgetPanel === "function") window.renderRequesterTempBudgetPanel();
}
// @end-legacy-unit 932

export function replaceRenderDepartmentBinding(value) { renderDepartment = value; return value; }
