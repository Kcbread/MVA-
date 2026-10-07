// approval/decisions: authoritative source; see docs/module-map.md.
import {
  roleReviewRows
} from "./analysis-scope.js";
import {
  renderManager
} from "./manager-view.js";
import {
  managerReviewRole
} from "./navigation.js";
import {
  isPriceReviewStockRow,
  renderPriceReview,
  syncPriceReviewDecisionSelection
} from "./price-review.js";
import {
  syncSelectedManagerRequest
} from "./queue-view.js";
import {
  managerRows,
  priceReviewQueueRows
} from "./queues.js";
import {
  omLeaderIntakeRoutingPatch
} from "./routing.js";
import {
  selectedManagerRequestId,
  selectedPriceReviewRequestId
} from "./state.js";
import {
  isCostManagerAuthorizationPending,
  isDeptDriSubmissionPending
} from "./status.js";
import {
  preserveApprovalViewport,
  restoreApprovalViewport
} from "./viewport.js";
import {
  syncRowPhaseQtyFromStationBreakdown
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  updateWarehouseCandidateStatus
} from "../inventory/warehouse.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  currentView
} from "../shell/state.js";
import {
  COST_MANAGER_AUTH_APPROVED,
  COST_MANAGER_AUTH_DENIED,
  COST_MANAGER_AUTH_PENDING,
  COST_MANAGER_AUTH_REJECTED,
  DEMAND_REVIEW_APPROVED,
  DEMAND_REVIEW_DENIED,
  DEMAND_REVIEW_PENDING,
  DEMAND_REVIEW_REVISE_REQUIRED,
  DEPT_DRI_SUBMISSION_APPROVED,
  DEPT_DRI_SUBMISSION_REJECTED,
  PRICE_ESCALATION_APPROVED,
  PRICE_ESCALATION_PENDING_PROJECT_DRI,
  PRICE_ESCALATION_REJECTED,
  USER_CONFIRMATION_NOT_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1786 22994
export function applyPriceReviewDecision(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (currentRole === "admin") {
    showToast("Admin manages setup only and cannot approve business price reviews.", "error");
    return;
  }
  const viewportKind = currentView === "manager" ? "manager" : "priceReview";
  preserveApprovalViewport(viewportKind, {
    actedRowId: requestId,
    rowIds: currentView === "manager" ? managerRows(currentRole).map((item) => item.id) : priceReviewQueueRows().map((item) => item.id),
    selectedRowId: currentView === "manager" ? selectedManagerRequestId : selectedPriceReviewRequestId,
    containerSelector: currentView === "manager" ? "#managerQueue .approval-quantity-row-list" : '#priceReviewPendingWorkspace [data-approval-shell="priceReview"]',
  });
  const now = new Date().toISOString();
  const actor = roleProfiles[currentRole]?.name || "Price Reviewer";
  const rerenderReviewAfterDecision = () => {
    syncPriceReviewDecisionSelection(requestId);
    syncSelectedManagerRequest(managerRows(currentRole), requestId);
    renderPriceReview();
    renderManager();
    restoreApprovalViewport(viewportKind);
  };
  if (action === "deny") {
    const reason = prompt("Denied reason is required.");
    if (!reason) {
      showToast("Denied reason is required.", "error");
      return;
    }
    if (isDeptDriSubmissionPending(row)) {
      replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
        ...item,
        status: DEMAND_REVIEW_DENIED,
        demandReviewStatus: DEMAND_REVIEW_DENIED,
        demandReviewDecisionAt: now,
        demandReviewDecisionBy: actor,
        demandReviewReason: reason,
        demandReviewDeniedAt: now,
        demandReviewDeniedBy: actor,
        deptDriReviewStatus: DEMAND_REVIEW_DENIED,
        deptDriReviewRejectedAt: "",
        deptDriReviewRejectReason: "",
        deptDriReviewReworkRequired: false,
        managerReason: reason,
        nextStep: "Demand denied / closed",
        procurementStatus: "Demand denied",
        decidedAt: now,
      } : item));
      const latest = requests.find((item) => item.id === requestId);
      addHandoffHistory(latest, "Dept Review denied", reason);
      rerenderReviewAfterDecision();
      renderDepartment();
      showToast("Dept Review denied this item row. It is closed and will not move downstream.", "success");
      return;
    }
    replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
      ...item,
      status: DEMAND_REVIEW_DENIED,
      demandReviewStatus: DEMAND_REVIEW_DENIED,
      demandReviewDecisionAt: now,
      demandReviewDecisionBy: actor,
      demandReviewReason: reason,
      demandReviewDeniedAt: now,
      demandReviewDeniedBy: actor,
      priceApprovalStatus: DEMAND_REVIEW_DENIED,
      priceDecisionStatus: DEMAND_REVIEW_DENIED,
      priceReviewReworkRequired: false,
      priceReviewReworkReason: "",
      omStatus: DEMAND_REVIEW_DENIED,
      omStage: "",
      managerReason: reason,
      nextStep: "Demand denied / closed",
      procurementStatus: "Demand denied",
      decidedAt: now,
    } : item));
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, `${roleProfiles[currentRole]?.functionName || "Review"} denied`, reason);
    addOmHistory(latest, `${roleProfiles[currentRole]?.functionName || "Review"} denied`, reason);
    rerenderReviewAfterDecision();
    renderDepartment();
    renderOmPurchasing();
    showToast("Review denied this item row. It is closed and will not move downstream.", "success");
    return;
  }
  if (action === "reject" || action === "revise") {
    const reason = prompt("Revise reason is required.");
    if (!reason) {
      showToast("Revise reason is required.", "error");
      return;
    }
    if (isDeptDriSubmissionPending(row)) {
      replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
        ...item,
        status: "Rejected",
        demandReviewStatus: DEMAND_REVIEW_REVISE_REQUIRED,
        demandReviewDecisionAt: now,
        demandReviewDecisionBy: actor,
        demandReviewReason: reason,
        deptDriReviewStatus: DEPT_DRI_SUBMISSION_REJECTED,
        deptDriReviewRejectedAt: now,
        deptDriReviewRejectedBy: actor,
        deptDriReviewRejectReason: reason,
        deptDriReviewReworkRequired: true,
        managerReason: reason,
        decidedAt: now,
      } : item));
      const latest = requests.find((item) => item.id === requestId);
      addHandoffHistory(latest, "Dept Review revise required", reason);
      rerenderReviewAfterDecision();
      renderDepartment();
      showToast("Dept Review marked Revise. Row returned to Requester Action Required.", "success");
      return;
    }
    replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
      ...item,
      demandReviewStatus: DEMAND_REVIEW_REVISE_REQUIRED,
      demandReviewDecisionAt: now,
      demandReviewDecisionBy: actor,
      demandReviewReason: reason,
      priceApprovalStatus: PRICE_ESCALATION_REJECTED,
      priceDecisionStatus: PRICE_ESCALATION_REJECTED,
      priceEscalationRejectedAt: now,
      priceEscalationRejectedBy: actor,
      priceEscalationRejectReason: reason,
      priceReviewReworkRequired: true,
      priceReviewReworkAt: now,
      priceReviewReworkBy: actor,
      priceReviewReworkReason: reason,
      omStatus: PRICE_ESCALATION_REJECTED,
      omStage: "priceReview",
    } : item));
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Review revise required", reason);
    addOmHistory(latest, "Review revise required", reason);
    rerenderReviewAfterDecision();
    renderOmPurchasing();
    renderDepartment();
    showToast("Review marked Revise. Row returned to Requester Action Required.", "success");
    return;
  }
  if (currentRole === "dri") {
    if (isDeptDriSubmissionPending(row)) {
      replaceRequestsBinding(requests.map((item) => item.id === requestId ? syncRowPhaseQtyFromStationBreakdown({
        ...item,
        status: "Submitted",
        deptDriReviewStatus: DEPT_DRI_SUBMISSION_APPROVED,
	        deptDriSubmissionApprovedAt: now,
	        deptDriSubmissionApprovedBy: actor,
	        deptDriReviewReworkRequired: false,
	        demandReviewStatus: DEMAND_REVIEW_PENDING,
	        demandReviewDecisionAt: "",
	        demandReviewDecisionBy: "",
	        demandReviewReason: "",
	        costManagerAuthorizationStatus: COST_MANAGER_AUTH_PENDING,
        costManagerAuthorizationSubmittedAt: now,
        costManagerAuthorizationReworkRequired: false,
        nextStep: "Cost Manager final authorization",
        decidedAt: now,
      }) : item));
      const latest = requests.find((item) => item.id === requestId);
      addHandoffHistory(latest, "Dept DRI submission approved", "Waiting Cost Manager final authorization.");
      rerenderReviewAfterDecision();
      renderDepartment();
      showToast("Dept Review approved. Waiting Cost Review.", "success");
      return;
    }
    replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
      ...item,
      driApprovedAt: now,
      driApprovedBy: actor,
      priceApprovalStatus: PRICE_ESCALATION_PENDING_PROJECT_DRI,
    } : item));
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Dept DRI approved", "Waiting Budget Approver approval.");
    addOmHistory(latest, "Dept DRI approved", "Waiting Budget Approver approval.");
    rerenderReviewAfterDecision();
    renderOmPurchasing();
    showToast("Dept Review approved. Waiting Budget Review.", "success");
    return;
  }
  if (currentRole !== "projectDri") {
    showToast("Only Dept DRI or Budget Approver can approve this price review.", "error");
    return;
  }
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
    ...item,
    projectDriApprovedAt: now,
    projectDriApprovedBy: actor,
    priceApprovalStatus: PRICE_ESCALATION_APPROVED,
    priceDecisionStatus: PRICE_ESCALATION_APPROVED,
    omStage: "finalExport",
    omStatus: PRICE_ESCALATION_APPROVED,
    userAQuoteDecisionStatus: USER_CONFIRMATION_NOT_REQUIRED,
    userAQuoteDecisionAt: now,
    userAQuoteDecisionBy: "Budget Approver approval",
  } : item));
  const latest = requests.find((item) => item.id === requestId);
  addHandoffHistory(latest, "Budget Approver approved", "Price escalation approved; row moved to OM Handoff.");
  addOmHistory(latest, "Budget Approver approved", "Price escalation approved; row moved to OM Handoff.");
  rerenderReviewAfterDecision();
  renderOmPurchasing();
  showToast("Budget Review approved. Row moved to OM Handoff.", "success");
}
// @end-legacy-unit 1786

// @legacy-unit 1787 23198
export function applyCostManagerAuthorization(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (currentRole !== "manager") {
    showToast("Only Cost Manager can authorize rows after Dept DRI approval.", "error");
    return;
  }
  if (!isCostManagerAuthorizationPending(row)) {
    showToast("This row is not waiting for Cost Manager authorization.", "error");
    return;
  }
  preserveApprovalViewport("manager", {
    actedRowId: requestId,
    rowIds: managerRows().map((item) => item.id),
    selectedRowId: selectedManagerRequestId,
    containerSelector: "#managerQueue .approval-quantity-row-list",
  });
  const now = new Date().toISOString();
  const actor = roleProfiles[currentRole]?.name || "Cost Manager";
  if (action === "reject" || action === "revise") {
    const reason = prompt("Revise reason is required.");
    if (!reason) {
      showToast("Revise reason is required.", "error");
      return;
    }
    replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
      ...item,
      status: "Rejected",
      demandReviewStatus: DEMAND_REVIEW_REVISE_REQUIRED,
      demandReviewDecisionAt: now,
      demandReviewDecisionBy: actor,
      demandReviewReason: reason,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_REJECTED,
      costManagerRejectedAt: now,
      costManagerRejectedBy: actor,
      costManagerRejectReason: reason,
      costManagerAuthorizationReworkRequired: true,
      managerReason: reason,
      nextStep: "Requester revise / resubmit",
      decidedAt: now,
    } : item));
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Cost Review revise required", reason);
    syncSelectedManagerRequest(managerRows(), requestId);
    renderManager();
    restoreApprovalViewport("manager");
    renderDepartment();
    renderPriceReview();
    showToast("Cost Review marked Revise. Row returned to Requester Action Required.", "success");
    return;
  }
  if (action === "deny") {
    const reason = prompt("Denied reason is required.");
    if (!reason) {
      showToast("Denied reason is required.", "error");
      return;
    }
    replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
      ...item,
      status: DEMAND_REVIEW_DENIED,
      demandReviewStatus: DEMAND_REVIEW_DENIED,
      demandReviewDecisionAt: now,
      demandReviewDecisionBy: actor,
      demandReviewReason: reason,
      demandReviewDeniedAt: now,
      demandReviewDeniedBy: actor,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_DENIED,
      costManagerAuthorizationReason: reason,
      costManagerAuthorizationReworkRequired: false,
      managerReason: reason,
      nextStep: "Demand denied / closed",
      decidedAt: now,
      omStage: "",
      procurementStatus: "Demand denied",
    } : item));
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Cost Review denied", reason);
    syncSelectedManagerRequest(managerRows(), requestId);
    renderManager();
    restoreApprovalViewport("manager");
    renderDepartment();
    renderPriceReview();
    showToast("Cost Review denied this item row. It is closed and will not move to OM.", "success");
    return;
  }
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? syncRowPhaseQtyFromStationBreakdown({
    ...item,
    status: "Approved",
    demandReviewStatus: DEMAND_REVIEW_APPROVED,
    demandReviewDecisionAt: now,
    demandReviewDecisionBy: actor,
    demandReviewReason: "",
    costManagerAuthorizationStatus: COST_MANAGER_AUTH_APPROVED,
    costManagerAuthorizedAt: now,
    costManagerAuthorizedBy: actor,
    costManagerAuthorizationReworkRequired: false,
    decidedAt: now,
    ...omLeaderIntakeRoutingPatch(item, now),
  }) : item));
  const latest = requests.find((item) => item.id === requestId);
  addHandoffHistory(latest, "Cost Review approved", "Item row moved to OM Leader intake.");
  addOmHistory(latest, "Received after Cost Review approval", "OM Leader can assign PAS Demand No / quote work.");
  syncSelectedManagerRequest(managerRows(), requestId);
  renderManager();
  restoreApprovalViewport("manager");
  renderOmPurchasing();
  renderDepartment();
  renderPriceReview();
  showToast("Cost Review approved. Row moved to OM Leader intake.", "success");
}
// @end-legacy-unit 1787

// @legacy-unit 1788 23309
export function applyManagerReviewDecision(requestId, action = "approve") {
  const role = managerReviewRole(currentRole);
  if (role === "manager") {
    applyCostManagerAuthorization(requestId, action);
    return;
  }
  const row = roleReviewRows(role).find((item) => item.id === requestId);
  if (isPriceReviewStockRow(row)) {
    updateWarehouseCandidateStatus(requestId, action === "approve" ? "lock" : "reject");
    return;
  }
  applyPriceReviewDecision(requestId, action);
}
// @end-legacy-unit 1788

export function replaceApplyPriceReviewDecisionBinding(value) { applyPriceReviewDecision = value; return value; }

export function replaceApplyCostManagerAuthorizationBinding(value) { applyCostManagerAuthorization = value; return value; }
