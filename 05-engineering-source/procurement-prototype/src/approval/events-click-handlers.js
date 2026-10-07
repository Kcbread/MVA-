// approval/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  clearPriceReviewDemandCostFilters
} from "../cost/dashboard-view.js";
import {
  clearPriceReviewQuantityFilters
} from "../cost/matrix-view.js";
import {
  acceptItemQuantityProposal
} from "../demand/amendments.js";
import {
  syncProjectStatusScopeFromRow
} from "../progress/dashboard.js";
import {
  DEMAND_TYPE_NON_MFG
} from "../projects/config.js";
import {
  syncProjectContextFromRow
} from "../projects/review-context.js";
import {
  currentRole
} from "../session/state.js";
import {
  setPriceReviewTab
} from "../shell/navigation.js";
import {
  currentPriceReviewQueue,
  currentView,
  replaceCurrentPriceReviewQueueBinding
} from "../shell/state.js";
import {
  priceReviewProjectRowsForRole
} from "./analysis-scope.js";
import {
  applyCostManagerAuthorization,
  applyManagerReviewDecision,
  applyPriceReviewDecision
} from "./decisions.js";
import {
  renderManager
} from "./manager-view.js";
import {
  renderPriceReview
} from "./price-review.js";
import {
  addItemQuantityProposalAction,
  approveItemQuantityReview,
  closeItemQuantityReview,
  openItemQuantityReview,
  rejectItemQuantityReview,
  removeItemQuantityProposalDraft,
  renderItemQuantityReviewModal,
  returnItemQuantityReviewWithProposal,
  saveItemQuantityReviewDirectEdit
} from "./quantity-review.js";
import {
  approvalQuantityReviewTabValue,
  quantityReviewModeValue,
  syncApprovalQuantityReviewTabState
} from "./quantity-scope.js";
import {
  activeItemQuantityReview,
  approvalQuantityReviewMode,
  replaceActiveItemQuantityReviewBinding,
  replaceApprovalQuantityReviewModeBinding,
  replaceApprovalQuantityReviewTabBinding,
  replaceSelectedManagerRequestIdBinding,
  replaceSelectedPriceReviewRequestIdBinding,
  replaceShouldScrollPriceReviewInlineAnalysisBinding,
  selectedPriceReviewRequestId
} from "./state.js";

export function handleClickPriceReviewTab(priceReviewTab, priceReviewQueueButton, costManagerAuthorizationButton, managerReviewDecisionButton) {
  if (priceReviewTab) setPriceReviewTab(priceReviewTab.dataset.priceReviewTab);
  if (priceReviewQueueButton) {
    replaceCurrentPriceReviewQueueBinding(priceReviewQueueButton.dataset.priceReviewQueue || currentPriceReviewQueue);
    replaceSelectedPriceReviewRequestIdBinding(null);
    replaceSelectedManagerRequestIdBinding(null);
    if (currentView === "manager") renderManager();
    else renderPriceReview();
  }
  if (costManagerAuthorizationButton) {
    applyCostManagerAuthorization(
      costManagerAuthorizationButton.dataset.costManagerAuthorization,
      costManagerAuthorizationButton.dataset.costManagerAction || "approve"
    );
  }
  if (managerReviewDecisionButton) {
    applyManagerReviewDecision(
      managerReviewDecisionButton.dataset.managerReviewDecision,
      managerReviewDecisionButton.dataset.managerReviewAction || "approve"
    );
  }
}

export function handleClickClearPriceReviewDemandCostFilters(action) {
  if (action === "clearPriceReviewDemandCostFilters") clearPriceReviewDemandCostFilters();
  if (action === "clearPriceReviewQuantityFilters") clearPriceReviewQuantityFilters();
}

export function handleClickCloseItemQuantityReview(action, approvalQuantityTabButton, approvalQuantityModeButton, itemQuantityReviewModeButton, itemQuantityProposalButton, itemQuantityDraftRemoveButton) {
  if (action === "closeItemQuantityReview") closeItemQuantityReview();
  if (action === "approveItemQuantityReview") approveItemQuantityReview();
  if (action === "returnItemQuantityReview") returnItemQuantityReviewWithProposal();
  if (action === "saveItemQuantityReviewDirectEdit") saveItemQuantityReviewDirectEdit();
  if (action === "rejectItemQuantityReview") rejectItemQuantityReview();
  if (approvalQuantityTabButton) {
    replaceApprovalQuantityReviewTabBinding(approvalQuantityReviewTabValue(approvalQuantityTabButton.dataset.approvalQuantityTab));
    syncApprovalQuantityReviewTabState();
    if (currentView === "manager") renderManager();
    else if (currentView === "priceReview") renderPriceReview();
    else {
      renderManager();
      renderPriceReview();
    }
  }
  if (approvalQuantityModeButton) {
    replaceApprovalQuantityReviewModeBinding(quantityReviewModeValue(approvalQuantityModeButton.dataset.approvalQuantityMode));
    replaceApprovalQuantityReviewTabBinding(approvalQuantityReviewMode === DEMAND_TYPE_NON_MFG ? "nonMfg" : "mfg");
    if (currentView === "manager") renderManager();
    else if (currentView === "priceReview") renderPriceReview();
    else {
      renderManager();
      renderPriceReview();
    }
  }
  if (itemQuantityReviewModeButton && activeItemQuantityReview) {
    replaceActiveItemQuantityReviewBinding({
      ...activeItemQuantityReview,
      reviewMode: quantityReviewModeValue(itemQuantityReviewModeButton.dataset.itemQuantityReviewMode),
      station: "",
      unit: "",
    });
    renderItemQuantityReviewModal();
  }
  if (itemQuantityProposalButton) addItemQuantityProposalAction(
    itemQuantityProposalButton.dataset.itemQuantityRequest || activeItemQuantityReview?.requestId || "",
    itemQuantityProposalButton.dataset.itemQuantityProposalAction || "",
  );
  if (itemQuantityDraftRemoveButton) removeItemQuantityProposalDraft(Number(itemQuantityDraftRemoveButton.dataset.itemQuantityRemoveDraft || 0));
}

export function handleClickItemQuantityAcceptProposalButton(itemQuantityAcceptProposalButton) {
  if (itemQuantityAcceptProposalButton) acceptItemQuantityProposal(itemQuantityAcceptProposalButton.dataset.itemQuantityAcceptProposal);
}

export function handleClickItemQuantityCell(itemQuantityCell) {
  if (itemQuantityCell) {
    openItemQuantityReview({
      requestId: itemQuantityCell.dataset.itemQuantityRequest || "",
      project: itemQuantityCell.dataset.itemQuantityProject || "",
      item: itemQuantityCell.dataset.itemQuantityItem || "",
      phase: itemQuantityCell.dataset.itemQuantityPhase || "",
      unit: itemQuantityCell.dataset.itemQuantityUnit || itemQuantityCell.dataset.managerDemandCostUnit || "",
      station: itemQuantityCell.dataset.itemQuantityStation || "",
      reviewMode: itemQuantityCell.dataset.itemQuantityReviewMode || "",
      source: itemQuantityCell.dataset.itemQuantityCell || "",
    });
    return true;
  }
}

export function handleClickPriceReviewSelectRow(priceReviewSelectRow, event, priceReviewSelectButton, priceReviewSelectCell, priceReviewDecisionButton) {
  if (priceReviewSelectRow && !event.target.closest("button, input, select, textarea, a")) {
    replaceSelectedPriceReviewRequestIdBinding(priceReviewSelectRow.dataset.priceReviewSelectRow || selectedPriceReviewRequestId);
    const selectedRow = priceReviewProjectRowsForRole(currentRole).find((row) => row.id === selectedPriceReviewRequestId);
    syncProjectContextFromRow("inline", selectedRow);
    syncProjectStatusScopeFromRow(selectedRow);
    replaceApprovalQuantityReviewTabBinding("dashboard");
    syncApprovalQuantityReviewTabState();
    replaceShouldScrollPriceReviewInlineAnalysisBinding(false);
    renderPriceReview();
  }
  if (priceReviewSelectButton) {
    replaceSelectedPriceReviewRequestIdBinding(priceReviewSelectButton.dataset.priceReviewSelect || selectedPriceReviewRequestId);
    const selectedRow = priceReviewProjectRowsForRole(currentRole).find((row) => row.id === selectedPriceReviewRequestId);
    syncProjectContextFromRow("inline", selectedRow);
    syncProjectStatusScopeFromRow(selectedRow);
    replaceApprovalQuantityReviewTabBinding("dashboard");
    syncApprovalQuantityReviewTabState();
    replaceShouldScrollPriceReviewInlineAnalysisBinding(false);
    renderPriceReview();
  }
  if (priceReviewSelectCell) {
    replaceSelectedPriceReviewRequestIdBinding(priceReviewSelectCell.dataset.priceReviewSelectCell || selectedPriceReviewRequestId);
    const selectedRow = priceReviewProjectRowsForRole(currentRole).find((row) => row.id === selectedPriceReviewRequestId);
    syncProjectContextFromRow("inline", selectedRow);
    syncProjectStatusScopeFromRow(selectedRow);
    replaceApprovalQuantityReviewTabBinding("dashboard");
    syncApprovalQuantityReviewTabState();
    replaceShouldScrollPriceReviewInlineAnalysisBinding(false);
    renderPriceReview();
  }
  if (priceReviewDecisionButton) applyPriceReviewDecision(
    priceReviewDecisionButton.dataset.priceReviewDecision,
    priceReviewDecisionButton.dataset.priceReviewAction,
  );
}
