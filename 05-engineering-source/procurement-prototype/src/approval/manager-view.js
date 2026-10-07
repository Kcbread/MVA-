// approval/manager-view: authoritative source; see docs/module-map.md.
import {
  approvalReviewConfigForRole,
  approvalReviewTabFromManagerTab,
  managerReviewRole,
  updateApprovalReviewState
} from "./navigation.js";
import {
  approvalQuantityReviewModeForRow,
  setApprovalQuantityReviewMode,
  syncApprovalQuantityReviewTabState
} from "./quantity-scope.js";
import {
  managerApprovalQuantityActions,
  renderApprovalQuantityRowPicker,
  renderManagerDemandAnalysisEvidence,
  syncSelectedManagerRequest
} from "./queue-view.js";
import {
  availablePriceReviewQueues,
  ensureCurrentPriceReviewQueue,
  managerRows
} from "./queues.js";
import {
  approvalQuantityReviewTab,
  selectedManagerRequestId
} from "./state.js";
import {
  renderManagerDashboard
} from "../cost/manager-dashboard.js";
import {
  approvalQuantityReviewModule,
  approvalWorkbenchModule
} from "../infrastructure/module-adapters.js";
import {
  syncProjectControls
} from "../projects/controls.js";
import {
  currentRole
} from "../session/state.js";
import {
  syncDemandAnalysisTabs,
  syncManagerWorkspaceUi
} from "../shell/navigation.js";
import {
  currentManagerTab,
  currentPriceReviewQueue
} from "../shell/state.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";

// @legacy-unit 1400 17116
export function renderManager() {
  const role = managerReviewRole(currentRole);
  const reviewConfig = approvalReviewConfigForRole(role);
  document.querySelector('section[data-view="manager"]')?.setAttribute("data-approval-review-role", role);
  updateApprovalReviewState(role, {
    activeTab: approvalReviewTabFromManagerTab(currentManagerTab),
    activeQueue: role === "manager" ? (reviewConfig?.defaultQueue || "authorization") : currentPriceReviewQueue,
    quantityTab: approvalQuantityReviewTab,
  });
  syncProjectControls();
  syncManagerWorkspaceUi(role);
  syncDemandAnalysisTabs();
  syncApprovalQuantityReviewTabState();
  if (role !== "manager") ensureCurrentPriceReviewQueue();
  const rows = managerRows(role);
  syncSelectedManagerRequest(rows);
  const selectedRow = rows.find((row) => row.id === selectedManagerRequestId) || null;
  if (selectedRow && approvalQuantityReviewTab === "dashboard") {
    setApprovalQuantityReviewMode(approvalQuantityReviewModeForRow(selectedRow), { preserveDashboard: true });
    syncApprovalQuantityReviewTabState();
  }

  document.getElementById("managerCount").textContent = `${rows.length} item${rows.length === 1 ? "" : "s"}`;
  const historyTitle = document.getElementById("managerDashboardTitle");
  if (historyTitle) historyTitle.textContent = `${reviewConfig?.entryLabel || "Review"} History`;
  const decisionHead = document.getElementById("managerDashboardDecisionHead");
  if (decisionHead) decisionHead.textContent = `${reviewConfig?.entryLabel || "Review"} Decision`;
  const managerTabs = document.getElementById("managerApprovalQuantityTabs");
  if (managerTabs) {
    managerTabs.innerHTML = approvalQuantityReviewModule().renderViewTabs?.({
      activeTab: approvalQuantityReviewTab,
      label: `${reviewConfig?.entryLabel || "Review"} quantity review views`,
    }) || "";
  }
  const queueTabs = role === "manager" ? "" : (approvalWorkbenchModule().renderQueueTabs?.({
    queues: availablePriceReviewQueues(),
    activeQueue: currentPriceReviewQueue,
  }) || "");
  document.getElementById("managerQueue").innerHTML = renderApprovalQuantityRowPicker({
    rows,
    selectedId: selectedManagerRequestId,
    selectAttr: "data-manager-select",
    title: `${reviewConfig?.entryLabel || "Review"} Rows`,
    helper: "Pick a request to scope MFG, Non-MFG, and Dashboard review. Actions apply to the selected request.",
    emptyText: reviewConfig?.emptyStateCopy || "No review rows match the selected filters.",
    role,
    actionHtml: managerApprovalQuantityActions,
  });
  if (queueTabs) document.getElementById("managerQueue").insertAdjacentHTML("afterbegin", queueTabs);
  renderManagerDemandAnalysisEvidence(selectedRow, rows);
  renderManagerDashboard();
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 1400

export function replaceRenderManagerBinding(value) { renderManager = value; return value; }
