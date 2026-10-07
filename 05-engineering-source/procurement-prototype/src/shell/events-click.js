// shell/events-click.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  handleClickAdminUserStatusButton,
  handleClickCreateAdminUser,
  handleClickImportAdminUsers,
  handleClickSaveAdminApprovalSetup
} from "../admin/events-click-handlers.js";
import {
  handleClickClearPriceReviewDemandCostFilters,
  handleClickCloseItemQuantityReview,
  handleClickItemQuantityAcceptProposalButton,
  handleClickItemQuantityCell,
  handleClickPriceReviewSelectRow,
  handleClickPriceReviewTab
} from "../approval/events-click-handlers.js";
import {
  handleClickCopyHistory,
  handleClickHistorySearch,
  handleClickNaturalSearch,
  handleClickReuseModeTab
} from "../catalog/events-click-handlers.js";
import {
  handleClickClearManagerProgressFilters,
  handleClickCloseManagerDetail,
  handleClickImportActualBuyExcel,
  handleClickManagerDemandCostButton,
  handleClickManagerDetailButton,
  handleClickManagerQuantityDetailButton,
  handleClickManagerQuantitySelectRow,
  handleClickManagerSelectButton,
  handleClickManagerStageDetailButton,
  handleClickManagerTab
} from "../cost/events-click-handlers.js";
import {
  handleClickAddDemandEditorRow,
  handleClickAddWorksheetRow,
  handleClickDemandAnalysisTab,
  handleClickDemandEditorCarryoverToggle,
  handleClickEditDemandButton,
  handleClickOpenRequestItemPicker,
  handleClickRemoveSelectedDemandButton,
  handleClickRemoveWorksheetButton,
  handleClickRequestWorksheetTab,
  handleClickSaveRequesterDraft,
  handleClickStartNewItemRequest,
  handleClickUserAQuoteConfirmButton
} from "../demand/events-click-handlers.js";
import {
  exportPasExcel
} from "../exports/pas.js";
import {
  handleClickBuyerProgressButton,
  handleClickExportHandoffPackages,
  handleClickHandoffTab
} from "../handoff/events-click-handlers.js";
import {
  handleClickAddWarehouseStockRecord,
  handleClickCarryoverSuggestionButton
} from "../inventory/events-click-handlers.js";
import {
  handleClickBatchMaterialButton,
  handleClickCloseMaterialEntry,
  handleClickCompleteSelectedMaterials,
  handleClickDiscardMaterialDraft,
  handleClickMaterialCandidateButton,
  handleClickValidateBaselineMaterialPlan
} from "../materials/events-click-handlers.js";
import {
  handleClickClearOmSubmissionFilters,
  handleClickCloseOmExternalResult,
  handleClickCreateOmAssignmentRule,
  handleClickExportPasPdf,
  handleClickOmAskUserAAmend,
  handleClickOmSubmissionDetailButton,
  handleClickOmTab,
  handleClickSaveOmAssignmentRuleButton
} from "../om/events-click-handlers.js";
import {
  sendOmPasResultToUserConfirm
} from "../om/pas-actions.js";
import {
  saveOmQuoteInfo
} from "../om/quote-actions.js";
import {
  runOmRowAction
} from "../om/row-actions.js";
import {
  handleClickProjectAccessButton,
  handleClickProjectContextButton,
  handleClickProjectStatusCell,
  handleClickSaveAndOpenProject
} from "../projects/events-click-handlers.js";
import {
  handleClickContactDriButton,
  handleClickLogout
} from "../session/events-click-handlers.js";
import {
  handleClickExportRfqExcel,
  handleClickGenerateRfqEmailDraft,
  handleClickRfqGroupButton
} from "../sourcing/events-click-handlers.js";
import {
  handleClickAddStationBreakdownRow,
  handleClickBackToItemSearch,
  handleClickCancelConfirm,
  handleClickCloseItemDetail,
  handleClickCreateNewItemSuggestion,
  handleClickDeptTab,
  handleClickEnterNewItemDetails,
  handleClickImportBaselineExcel,
  handleClickMfgExportPdf,
  handleClickMfgPackageDetailButton,
  handleClickOpenContactPopup,
  handleClickOpenNeedConfirmation,
  handleClickQuantityDashboardPhase,
  handleClickRefreshSapPoRawImportStatus,
  handleClickRemoveButton,
  handleClickRemoveStationBreakdownButton,
  handleClickSendSelectedToOm,
  handleClickTab,
  handleClickTarget
} from "./events-click-handlers.js";

// @legacy-unit 1889 25247
export function initializeStep1889() {
document.addEventListener("click", async (event) => {
  if (handleClickTarget(event)) return;
  const action = event.target.closest("[data-action]")?.dataset.action;
  const viewTab = event.target.closest("[data-view]");
  const deptTab = event.target.closest("[data-dept-tab]");
  const reuseModeTab = event.target.closest("[data-reuse-mode-tab]");
  const requestWorksheetTab = event.target.closest("[data-request-worksheet-tab]");
  const requestPhaseJumpButton = event.target.closest("[data-request-phase-jump]");
  const requestPickerSourceTab = event.target.closest("[data-request-picker-source-tab]");
  const managerTab = event.target.closest("[data-manager-tab]");
  const demandAnalysisTab = event.target.closest("[data-demand-analysis-tab]");
  const handoffTab = event.target.closest("[data-handoff-tab]");
  const omTab = event.target.closest("[data-om-tab]");
  const omHandoffViewButton = event.target.closest("[data-om-handoff-view]");
  const addRecordButton = event.target.closest("[data-add-record]");
  const addWorksheetSourceButton = event.target.closest("[data-add-worksheet-source]");
  const addHistoryRecordButton = event.target.closest("[data-add-history-record]");
  const removeWorksheetButton = event.target.closest("[data-request-worksheet-remove]");
  const removeButton = event.target.closest("[data-remove-request]");
  const removeSelectedDemandButton = event.target.closest("[data-remove-selected-demand]");
  const editDemandButton = event.target.closest("[data-edit-demand]");
  const removeStationBreakdownButton = event.target.closest("[data-remove-station-breakdown]");
  const demandEditorCarryoverToggle = event.target.closest("[data-demand-editor-carryover-toggle]");
  const itemDetailControl = event.target.closest("[data-item-detail-source]");
  const managerDetailButton = event.target.closest("[data-manager-detail]");
  const managerDashboardDetailButton = event.target.closest("[data-manager-dashboard-detail]");
  const managerDashboardPhaseButton = event.target.closest("[data-manager-dashboard-phase-project]");
  const managerStageDetailButton = event.target.closest("[data-manager-stage-detail-project]");
  const managerDemandDetailButton = event.target.closest("[data-manager-demand-detail]");
  const managerProgressDetailButton = event.target.closest("[data-manager-progress-detail]");
  const managerQuantityDetailButton = event.target.closest("[data-manager-quantity-detail]");
  const managerDemandCostButton = event.target.closest("[data-manager-demand-cost-unit]");
  const managerReviewDecisionButton = event.target.closest("[data-manager-review-decision]");
  const itemQuantityCell = event.target.closest("[data-item-quantity-cell]");
  const approvalQuantityTabButton = event.target.closest("[data-approval-quantity-tab]");
  const approvalQuantityModeButton = event.target.closest("[data-approval-quantity-mode]");
  const itemQuantityReviewModeButton = event.target.closest("[data-item-quantity-review-mode]");
  const itemQuantityProposalButton = event.target.closest("[data-item-quantity-proposal-action]");
  const itemQuantityDraftRemoveButton = event.target.closest("[data-item-quantity-remove-draft]");
  const managerSelectButton = event.target.closest("[data-manager-select]");
  const managerSelectRow = event.target.closest("[data-manager-select-row]");
  const managerAuthorizedSelectRow = event.target.closest("[data-manager-authorized-select-row]");
  const projectContextButton = event.target.closest("[data-project-context-project]");
  const projectStatusCell = event.target.closest("[data-project-status-cell]");
  const priceReviewTab = event.target.closest("[data-price-review-tab]");
  const priceReviewQueueButton = event.target.closest("[data-price-review-queue]");
  const priceReviewSelectButton = event.target.closest("[data-price-review-select]");
  const priceReviewSelectCell = event.target.closest("[data-price-review-select-cell]");
  const priceReviewSelectRow = event.target.closest("[data-price-review-select-row]");
  const priceReviewDecisionButton = event.target.closest("[data-price-review-decision]");
  const costManagerAuthorizationButton = event.target.closest("[data-cost-manager-authorization]");
  const managerQuantitySelectRow = event.target.closest("[data-manager-quantity-select]");
  const managerQuantityExpandButton = event.target.closest("[data-manager-quantity-expand]");
  const contactDriButton = event.target.closest("[data-contact-dri]");
  const omSubmissionDetailButton = event.target.closest("[data-om-submission-detail]");
  const omSubmissionStageButton = event.target.closest("[data-om-stage-filter]");
  const projectAccessButton = event.target.closest("[data-project-config-access]");
  const omRowButton = event.target.closest("[data-om-row-button]");
  const rfqGroupButton = event.target.closest("[data-rfq-group-action]");
  const buyerProgressButton = event.target.closest("[data-buyer-progress]");
  const mfgPackageDetailButton = event.target.closest("[data-mfg-package-detail]");
  const materialStandardButton = event.target.closest("[data-material-standard-id]");
  const batchMaterialButton = event.target.closest("[data-batch-material-id]");
  const userAQuoteConfirmButton = event.target.closest("[data-usera-quote-confirm]");
  const userAQuoteCancelButton = event.target.closest("[data-usera-quote-cancel]");
  const userAAmendButton = event.target.closest("[data-usera-amend]");
  const userAAmendConfirmButton = event.target.closest("[data-usera-amend-confirm]");
  const userAAmendRejectButton = event.target.closest("[data-usera-amend-reject]");
  const itemQuantityAcceptProposalButton = event.target.closest("[data-item-quantity-accept-proposal]");
  const carryoverSuggestionButton = event.target.closest("[data-create-carryover-candidate]");
  const warehouseCandidateLockButton = event.target.closest("[data-warehouse-candidate-lock]");
  const warehouseCandidateRejectButton = event.target.closest("[data-warehouse-candidate-reject]");
  const adminUserStatusButton = event.target.closest("[data-admin-user-status]");

  handleClickTab(viewTab);
  handleClickProjectStatusCell(projectStatusCell);
  handleClickDeptTab(deptTab);
  if (handleClickRequestWorksheetTab(requestWorksheetTab, requestPhaseJumpButton, requestPickerSourceTab)) return;
  handleClickReuseModeTab(reuseModeTab);
  handleClickManagerTab(managerTab);
  handleClickDemandAnalysisTab(demandAnalysisTab);
  handleClickPriceReviewTab(priceReviewTab, priceReviewQueueButton, costManagerAuthorizationButton, managerReviewDecisionButton);
  handleClickHandoffTab(handoffTab);
  handleClickOmTab(omTab, omHandoffViewButton, omSubmissionStageButton);
  handleClickLogout(action);
  handleClickOpenContactPopup(action);
  handleClickOpenRequestItemPicker(action);
  handleClickNaturalSearch(action);
  handleClickClearManagerProgressFilters(action);
  handleClickClearPriceReviewDemandCostFilters(action);
  handleClickClearOmSubmissionFilters(action);
  handleClickSaveAdminApprovalSetup(action);
  handleClickCreateOmAssignmentRule(action);
  handleClickCreateAdminUser(action);
  handleClickRefreshSapPoRawImportStatus(action);
  handleClickImportAdminUsers(action);
  handleClickOpenNeedConfirmation(action);
  handleClickHistorySearch(action);
  handleClickCreateNewItemSuggestion(action);
  handleClickStartNewItemRequest(action);
  handleClickDiscardMaterialDraft(action);
  if (handleClickEnterNewItemDetails(action)) return;
  const materialCandidateButton = event.target.closest("[data-use-material-candidate]");
  if (handleClickMaterialCandidateButton(materialCandidateButton)) return;
  handleClickBackToItemSearch(action);
  handleClickAddWorksheetRow(action, addWorksheetSourceButton);
  handleClickAddWarehouseStockRecord(action);
  handleClickAddStationBreakdownRow(action, event);
  handleClickAddDemandEditorRow(action);
  handleClickCloseItemQuantityReview(action, approvalQuantityTabButton, approvalQuantityModeButton, itemQuantityReviewModeButton, itemQuantityProposalButton, itemQuantityDraftRemoveButton);
  handleClickDemandEditorCarryoverToggle(demandEditorCarryoverToggle);
  handleClickCopyHistory(action, addHistoryRecordButton);
  handleClickCarryoverSuggestionButton(carryoverSuggestionButton, warehouseCandidateLockButton, warehouseCandidateRejectButton);
  handleClickAdminUserStatusButton(adminUserStatusButton);
  handleClickItemQuantityAcceptProposalButton(itemQuantityAcceptProposalButton);
  const saveOmAssignmentRuleButton = event.target.closest("[data-action='saveOmAssignmentRule']");
  handleClickSaveOmAssignmentRuleButton(saveOmAssignmentRuleButton);
  handleClickEditDemandButton(editDemandButton);
  handleClickCompleteSelectedMaterials(action);
  handleClickSaveRequesterDraft(action);
  handleClickExportHandoffPackages(action);
  handleClickSendSelectedToOm(action);
  handleClickExportRfqExcel(action);
  handleClickMfgExportPdf(action);
  handleClickGenerateRfqEmailDraft(action);
  if (action === "exportPasExcel") await exportPasExcel();
  handleClickExportPasPdf(action);
  if (action === "omSaveQuoteInfo") await saveOmQuoteInfo();
  if (action === "omSendToUserConfirm") await sendOmPasResultToUserConfirm();
  handleClickOmAskUserAAmend(action);
  handleClickImportActualBuyExcel(action);
  handleClickImportBaselineExcel(action);
  handleClickValidateBaselineMaterialPlan(action);
  handleClickSaveAndOpenProject(action);
  handleClickCloseManagerDetail(action);
  handleClickCloseItemDetail(action);
  handleClickCloseMaterialEntry(action, materialStandardButton);
  handleClickCloseOmExternalResult(action);
  handleClickCancelConfirm(action, addRecordButton);
  handleClickRemoveWorksheetButton(removeWorksheetButton);
  handleClickRemoveButton(removeButton);
  handleClickRemoveSelectedDemandButton(removeSelectedDemandButton);
  handleClickRemoveStationBreakdownButton(removeStationBreakdownButton, itemDetailControl);
  handleClickManagerSelectButton(managerSelectButton, managerSelectRow, event, managerAuthorizedSelectRow);
  if (handleClickProjectContextButton(projectContextButton)) return;
  handleClickManagerDetailButton(managerDetailButton, managerDashboardDetailButton, managerDashboardPhaseButton, managerDemandDetailButton, managerProgressDetailButton);
  if (handleClickItemQuantityCell(itemQuantityCell)) return;
  handleClickManagerDemandCostButton(managerDemandCostButton);
  handleClickPriceReviewSelectRow(priceReviewSelectRow, event, priceReviewSelectButton, priceReviewSelectCell, priceReviewDecisionButton);
  handleClickManagerQuantitySelectRow(managerQuantitySelectRow, event, managerQuantityExpandButton);
  const quantityDashboardItem = event.target.closest("[data-quantity-dashboard-item]")?.dataset.quantityDashboardItem || "";
  const quantityDashboardPhase = event.target.closest("[data-quantity-dashboard-phase]")?.dataset.quantityDashboardPhase || "";
  const quantityDashboardUnit = event.target.closest("[data-quantity-dashboard-unit]")?.dataset.quantityDashboardUnit || "";
  handleClickQuantityDashboardPhase(quantityDashboardPhase, quantityDashboardUnit, quantityDashboardItem);
  handleClickManagerQuantityDetailButton(managerQuantityDetailButton);
  handleClickContactDriButton(contactDriButton);
  handleClickOmSubmissionDetailButton(omSubmissionDetailButton);
  handleClickManagerStageDetailButton(managerStageDetailButton);
  handleClickProjectAccessButton(projectAccessButton);
  if (omRowButton) await runOmRowAction(omRowButton.dataset.omRowButton, omRowButton.dataset.omRowButtonAction);
  handleClickRfqGroupButton(rfqGroupButton);
  handleClickBuyerProgressButton(buyerProgressButton);
  handleClickMfgPackageDetailButton(mfgPackageDetailButton);
  handleClickUserAQuoteConfirmButton(userAQuoteConfirmButton, userAQuoteCancelButton, userAAmendButton, userAAmendConfirmButton, userAAmendRejectButton);
  handleClickBatchMaterialButton(batchMaterialButton);
});
}
// @end-legacy-unit 1889
