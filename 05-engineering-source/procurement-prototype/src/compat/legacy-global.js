// compat/legacy-global: authoritative source; see docs/module-map.md.
import {
  EXT_REJECTED_DRI
} from "../admin/state.js";
import {
  priceReviewSelectedRowScope,
  replacePriceReviewSelectedRowScopeBinding,
  replaceRoleReviewRowsBinding,
  roleReviewRows
} from "../approval/analysis-scope.js";
import {
  approvalQuantityMatrixRows,
  replaceApprovalQuantityMatrixRowsBinding
} from "../approval/analysis-view.js";
import {
  applyCostManagerAuthorization,
  applyPriceReviewDecision,
  replaceApplyCostManagerAuthorizationBinding,
  replaceApplyPriceReviewDecisionBinding
} from "../approval/decisions.js";
import {
  renderManager,
  replaceRenderManagerBinding
} from "../approval/manager-view.js";
import {
  deptDriSubmissionReviewPatch,
  replaceDeptDriSubmissionReviewPatchBinding
} from "../approval/routing.js";
import {
  approvalQuantityReviewTab,
  replaceApprovalQuantityReviewTabBinding,
  replaceSelectedManagerRequestIdBinding,
  replaceSelectedPriceReviewProjectContextBinding,
  replaceSelectedPriceReviewRequestIdBinding,
  selectedManagerRequestId,
  selectedPriceReviewProjectContext,
  selectedPriceReviewRequestId
} from "../approval/state.js";
import {
  approvalPipelineStatus,
  replaceApprovalPipelineStatusBinding
} from "../approval/status.js";
import {
  historyPackageKey,
  replaceHistoryPackageKeyBinding,
  replaceReusableHistoryRowsBinding,
  reusableHistoryRows
} from "../catalog/history-view.js";
import {
  itemMatchHighlight,
  itemNameMatchRank,
  replaceItemMatchHighlightBinding,
  replaceItemNameMatchRankBinding
} from "../catalog/match.js";
import {
  openRequestItemPicker,
  replaceOpenRequestItemPickerBinding,
  replaceRequestItemPickerSourcesBinding,
  replaceRequestWorksheetMergedSourcesBinding,
  replaceRequestWorksheetSourceHaystackBinding,
  replaceRequesterPickerSpecBinding,
  requestItemPickerSources,
  requestWorksheetMergedSources,
  requestWorksheetSourceHaystack,
  requesterPickerSpec
} from "../catalog/search.js";
import {
  amountVndFromUsd,
  replaceAmountVndFromUsdBinding
} from "../cost/currency.js";
import {
  managerDemandCostRows,
  replaceManagerDemandCostRowsBinding
} from "../cost/dashboard-data.js";
import {
  managerQuantityGroups,
  replaceManagerQuantityGroupsBinding
} from "../cost/matrix-data.js";
import {
  needConfirmationRows,
  replaceNeedConfirmationRowsBinding
} from "../demand/amendments.js";
import {
  persistRequesterLocalDrafts,
  readRequesterLocalDrafts,
  replacePersistRequesterLocalDraftsBinding,
  replaceReadRequesterLocalDraftsBinding,
  replaceRequesterLocalDraftKeyBinding,
  replaceSaveRequesterDraftBinding,
  requesterLocalDraftKey,
  saveRequesterDraft
} from "../demand/drafts.js";
import {
  closeDemandEditor,
  replaceCloseDemandEditorBinding,
  replaceUserCarryoverUnitPriceVndBinding,
  userCarryoverUnitPriceVnd
} from "../demand/editor.js";
import {
  createStationBreakdownEntry,
  replaceCreateStationBreakdownEntryBinding,
  replaceSyncRowPhaseQtyFromStationBreakdownBinding,
  syncRowPhaseQtyFromStationBreakdown
} from "../demand/quantity.js";
import {
  confirmUserAOmQuote,
  createUserAAmendmentDraft,
  replaceConfirmUserAOmQuoteBinding,
  replaceCreateUserAAmendmentDraftBinding
} from "../demand/quote-confirmation.js";
import {
  replaceRequestFromRecordBinding,
  requestFromRecord
} from "../demand/records.js";
import {
  removeRequest,
  replaceRemoveRequestBinding
} from "../demand/request-fields.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  replaceSubmitRequestsBinding,
  submitRequests
} from "../demand/submit.js";
import {
  replaceRequestWorksheetRowsBinding,
  replaceUpdateRequestWorksheetQtyBinding,
  requestWorksheetRows,
  updateRequestWorksheetQty
} from "../demand/worksheet.js";
import {
  addWorksheetRow,
  replaceAddWorksheetRowBinding
} from "../demand/worksheet-actions.js";
import {
  replaceRequestWorksheetColumnsBinding,
  requestWorksheetColumns
} from "../demand/worksheet-view.js";
import {
  renderDepartment,
  replaceRenderDepartmentBinding
} from "../demand/workspace.js";
import {
  apiModeEnabled,
  apiRequest,
  replaceApiModeEnabledBinding,
  replaceApiRequestBinding
} from "../infrastructure/api.js";
import {
  managerCarryoverCostSaving,
  replaceManagerCarryoverCostSavingBinding
} from "../inventory/cost-evidence.js";
import {
  closeItemDetail,
  renderItemDetail,
  replaceCloseItemDetailBinding,
  replaceRenderItemDetailBinding
} from "../materials/detail-view.js";
import {
  materialEntryRow,
  replaceMaterialEntryRowBinding
} from "../materials/entry-view.js";
import {
  createNewItemSuggestion,
  replaceCreateNewItemSuggestionBinding
} from "../materials/new-item.js";
import {
  newItemSuggestions,
  replaceNewItemSuggestionsBinding
} from "../materials/state.js";
import {
  canOperateOmRow,
  replaceCanOperateOmRowBinding
} from "../om/assignment.js";
import {
  commitExternalResult,
  replaceCommitExternalResultBinding
} from "../om/external-progress.js";
import {
  hydrateOmLeaderConsoleRows,
  replaceHydrateOmLeaderConsoleRowsBinding
} from "../om/hydration.js";
import {
  replaceSendOmPasRowsToUserConfirmBinding,
  sendOmPasRowsToUserConfirm
} from "../om/pas-actions.js";
import {
  omSubmissionRows,
  replaceOmSubmissionRowsBinding
} from "../om/progress-data.js";
import {
  confirmOmQuoteResultRows,
  replaceConfirmOmQuoteResultRowsBinding,
  replaceSaveOmQuoteInfoRowsBinding,
  saveOmQuoteInfoRows
} from "../om/quote-actions.js";
import {
  projectStatusScopeFromRow,
  renderProjectStatus,
  replaceProjectStatusScopeFromRowBinding,
  replaceRenderProjectStatusBinding
} from "../progress/dashboard.js";
import {
  replaceSelectedProjectStatusScopeBinding,
  selectedProjectStatusScope
} from "../progress/state.js";
import {
  DEMAND_TYPE_MFG
} from "../projects/config.js";
import {
  activeProjectContext,
  projectContextRowsForProject,
  replaceActiveProjectContextBinding,
  replaceProjectContextRowsForProjectBinding
} from "../projects/review-context.js";
import {
  currentProject,
  replaceCurrentProjectBinding
} from "../projects/state.js";
import {
  normalizeRequestDemandDepartment,
  replaceNormalizeRequestDemandDepartmentBinding,
  replaceRequesterPersonasBinding,
  requesterPersonas
} from "../session/persona.js";
import {
  currentRequesterPersonaId,
  currentRole,
  currentUserRole,
  replaceCurrentRequesterPersonaIdBinding,
  replaceCurrentRoleBinding,
  replaceCurrentUserRoleBinding
} from "../session/state.js";
import {
  applyRole,
  replaceApplyRoleBinding,
  replaceSetDeptTabBinding,
  replaceSetManagerTabBinding,
  replaceSetOmTabBinding,
  replaceSetPriceReviewTabBinding,
  replaceSetScreenBinding,
  replaceSetViewBinding,
  setDeptTab,
  setManagerTab,
  setOmTab,
  setPriceReviewTab,
  setScreen,
  setView
} from "../shell/navigation.js";
import {
  currentDeptTab,
  currentView,
  replaceCurrentDeptTabBinding,
  replaceCurrentViewBinding
} from "../shell/state.js";
import {
  PRICE_ESCALATION_PENDING_PROJECT_DRI,
  PRICE_ESCALATION_REQUIRED
} from "../workflow/status-constants.js";

// Compatibility boundary only. No domain module depends on window state.
export function installLegacyGlobals(target = globalThis) {
 Object.defineProperties(target, {
  "DEMAND_TYPE_MFG": { configurable: true, get: () => DEMAND_TYPE_MFG },
  "PRICE_ESCALATION_REQUIRED": { configurable: true, get: () => PRICE_ESCALATION_REQUIRED },
  "PRICE_ESCALATION_PENDING_PROJECT_DRI": { configurable: true, get: () => PRICE_ESCALATION_PENDING_PROJECT_DRI },
  "EXT_REJECTED_DRI": { configurable: true, get: () => EXT_REJECTED_DRI },
  "currentRole": { configurable: true, get: () => currentRole, set: replaceCurrentRoleBinding },
  "currentUserRole": { configurable: true, get: () => currentUserRole, set: replaceCurrentUserRoleBinding },
  "currentView": { configurable: true, get: () => currentView, set: replaceCurrentViewBinding },
  "currentProject": { configurable: true, get: () => currentProject, set: replaceCurrentProjectBinding },
  "currentRequesterPersonaId": { configurable: true, get: () => currentRequesterPersonaId, set: replaceCurrentRequesterPersonaIdBinding },
  "currentDeptTab": { configurable: true, get: () => currentDeptTab, set: replaceCurrentDeptTabBinding },
  "selectedProjectStatusScope": { configurable: true, get: () => selectedProjectStatusScope, set: replaceSelectedProjectStatusScopeBinding },
  "selectedManagerRequestId": { configurable: true, get: () => selectedManagerRequestId, set: replaceSelectedManagerRequestIdBinding },
  "selectedPriceReviewRequestId": { configurable: true, get: () => selectedPriceReviewRequestId, set: replaceSelectedPriceReviewRequestIdBinding },
  "selectedPriceReviewProjectContext": { configurable: true, get: () => selectedPriceReviewProjectContext, set: replaceSelectedPriceReviewProjectContextBinding },
  "approvalQuantityReviewTab": { configurable: true, get: () => approvalQuantityReviewTab, set: replaceApprovalQuantityReviewTabBinding },
  "requests": { configurable: true, get: () => requests, set: replaceRequestsBinding },
  "newItemSuggestions": { configurable: true, get: () => newItemSuggestions, set: replaceNewItemSuggestionsBinding },
  "requesterPersonas": { configurable: true, get: () => requesterPersonas, set: replaceRequesterPersonasBinding },
  "normalizeRequestDemandDepartment": { configurable: true, get: () => normalizeRequestDemandDepartment, set: replaceNormalizeRequestDemandDepartmentBinding },
  "apiModeEnabled": { configurable: true, get: () => apiModeEnabled, set: replaceApiModeEnabledBinding },
  "apiRequest": { configurable: true, get: () => apiRequest, set: replaceApiRequestBinding },
  "hydrateOmLeaderConsoleRows": { configurable: true, get: () => hydrateOmLeaderConsoleRows, set: replaceHydrateOmLeaderConsoleRowsBinding },
  "projectStatusScopeFromRow": { configurable: true, get: () => projectStatusScopeFromRow, set: replaceProjectStatusScopeFromRowBinding },
  "renderProjectStatus": { configurable: true, get: () => renderProjectStatus, set: replaceRenderProjectStatusBinding },
  "amountVndFromUsd": { configurable: true, get: () => amountVndFromUsd, set: replaceAmountVndFromUsdBinding },
  "createStationBreakdownEntry": { configurable: true, get: () => createStationBreakdownEntry, set: replaceCreateStationBreakdownEntryBinding },
  "syncRowPhaseQtyFromStationBreakdown": { configurable: true, get: () => syncRowPhaseQtyFromStationBreakdown, set: replaceSyncRowPhaseQtyFromStationBreakdownBinding },
  "managerDemandCostRows": { configurable: true, get: () => managerDemandCostRows, set: replaceManagerDemandCostRowsBinding },
  "managerCarryoverCostSaving": { configurable: true, get: () => managerCarryoverCostSaving, set: replaceManagerCarryoverCostSavingBinding },
  "priceReviewSelectedRowScope": { configurable: true, get: () => priceReviewSelectedRowScope, set: replacePriceReviewSelectedRowScopeBinding },
  "roleReviewRows": { configurable: true, get: () => roleReviewRows, set: replaceRoleReviewRowsBinding },
  "activeProjectContext": { configurable: true, get: () => activeProjectContext, set: replaceActiveProjectContextBinding },
  "projectContextRowsForProject": { configurable: true, get: () => projectContextRowsForProject, set: replaceProjectContextRowsForProjectBinding },
  "approvalQuantityMatrixRows": { configurable: true, get: () => approvalQuantityMatrixRows, set: replaceApprovalQuantityMatrixRowsBinding },
  "managerQuantityGroups": { configurable: true, get: () => managerQuantityGroups, set: replaceManagerQuantityGroupsBinding },
  "setScreen": { configurable: true, get: () => setScreen, set: replaceSetScreenBinding },
  "setView": { configurable: true, get: () => setView, set: replaceSetViewBinding },
  "applyRole": { configurable: true, get: () => applyRole, set: replaceApplyRoleBinding },
  "setDeptTab": { configurable: true, get: () => setDeptTab, set: replaceSetDeptTabBinding },
  "setManagerTab": { configurable: true, get: () => setManagerTab, set: replaceSetManagerTabBinding },
  "setOmTab": { configurable: true, get: () => setOmTab, set: replaceSetOmTabBinding },
  "setPriceReviewTab": { configurable: true, get: () => setPriceReviewTab, set: replaceSetPriceReviewTabBinding },
  "requestFromRecord": { configurable: true, get: () => requestFromRecord, set: replaceRequestFromRecordBinding },
  "renderDepartment": { configurable: true, get: () => renderDepartment, set: replaceRenderDepartmentBinding },
  "requestWorksheetColumns": { configurable: true, get: () => requestWorksheetColumns, set: replaceRequestWorksheetColumnsBinding },
  "requestWorksheetRows": { configurable: true, get: () => requestWorksheetRows, set: replaceRequestWorksheetRowsBinding },
  "updateRequestWorksheetQty": { configurable: true, get: () => updateRequestWorksheetQty, set: replaceUpdateRequestWorksheetQtyBinding },
  "requestWorksheetSourceHaystack": { configurable: true, get: () => requestWorksheetSourceHaystack, set: replaceRequestWorksheetSourceHaystackBinding },
  "requesterPickerSpec": { configurable: true, get: () => requesterPickerSpec, set: replaceRequesterPickerSpecBinding },
  "requestWorksheetMergedSources": { configurable: true, get: () => requestWorksheetMergedSources, set: replaceRequestWorksheetMergedSourcesBinding },
  "requestItemPickerSources": { configurable: true, get: () => requestItemPickerSources, set: replaceRequestItemPickerSourcesBinding },
  "openRequestItemPicker": { configurable: true, get: () => openRequestItemPicker, set: replaceOpenRequestItemPickerBinding },
  "addWorksheetRow": { configurable: true, get: () => addWorksheetRow, set: replaceAddWorksheetRowBinding },
  "closeDemandEditor": { configurable: true, get: () => closeDemandEditor, set: replaceCloseDemandEditorBinding },
  "userCarryoverUnitPriceVnd": { configurable: true, get: () => userCarryoverUnitPriceVnd, set: replaceUserCarryoverUnitPriceVndBinding },
  "reusableHistoryRows": { configurable: true, get: () => reusableHistoryRows, set: replaceReusableHistoryRowsBinding },
  "historyPackageKey": { configurable: true, get: () => historyPackageKey, set: replaceHistoryPackageKeyBinding },
  "needConfirmationRows": { configurable: true, get: () => needConfirmationRows, set: replaceNeedConfirmationRowsBinding },
  "requesterLocalDraftKey": { configurable: true, get: () => requesterLocalDraftKey, set: replaceRequesterLocalDraftKeyBinding },
  "readRequesterLocalDrafts": { configurable: true, get: () => readRequesterLocalDrafts, set: replaceReadRequesterLocalDraftsBinding },
  "persistRequesterLocalDrafts": { configurable: true, get: () => persistRequesterLocalDrafts, set: replacePersistRequesterLocalDraftsBinding },
  "saveRequesterDraft": { configurable: true, get: () => saveRequesterDraft, set: replaceSaveRequesterDraftBinding },
  "submitRequests": { configurable: true, get: () => submitRequests, set: replaceSubmitRequestsBinding },
  "removeRequest": { configurable: true, get: () => removeRequest, set: replaceRemoveRequestBinding },
  "createNewItemSuggestion": { configurable: true, get: () => createNewItemSuggestion, set: replaceCreateNewItemSuggestionBinding },
  "materialEntryRow": { configurable: true, get: () => materialEntryRow, set: replaceMaterialEntryRowBinding },
  "itemNameMatchRank": { configurable: true, get: () => itemNameMatchRank, set: replaceItemNameMatchRankBinding },
  "itemMatchHighlight": { configurable: true, get: () => itemMatchHighlight, set: replaceItemMatchHighlightBinding },
  "omSubmissionRows": { configurable: true, get: () => omSubmissionRows, set: replaceOmSubmissionRowsBinding },
  "renderManager": { configurable: true, get: () => renderManager, set: replaceRenderManagerBinding },
  "renderItemDetail": { configurable: true, get: () => renderItemDetail, set: replaceRenderItemDetailBinding },
  "closeItemDetail": { configurable: true, get: () => closeItemDetail, set: replaceCloseItemDetailBinding },
  "deptDriSubmissionReviewPatch": { configurable: true, get: () => deptDriSubmissionReviewPatch, set: replaceDeptDriSubmissionReviewPatchBinding },
  "canOperateOmRow": { configurable: true, get: () => canOperateOmRow, set: replaceCanOperateOmRowBinding },
  "confirmOmQuoteResultRows": { configurable: true, get: () => confirmOmQuoteResultRows, set: replaceConfirmOmQuoteResultRowsBinding },
  "saveOmQuoteInfoRows": { configurable: true, get: () => saveOmQuoteInfoRows, set: replaceSaveOmQuoteInfoRowsBinding },
  "sendOmPasRowsToUserConfirm": { configurable: true, get: () => sendOmPasRowsToUserConfirm, set: replaceSendOmPasRowsToUserConfirmBinding },
  "confirmUserAOmQuote": { configurable: true, get: () => confirmUserAOmQuote, set: replaceConfirmUserAOmQuoteBinding },
  "createUserAAmendmentDraft": { configurable: true, get: () => createUserAAmendmentDraft, set: replaceCreateUserAAmendmentDraftBinding },
  "approvalPipelineStatus": { configurable: true, get: () => approvalPipelineStatus, set: replaceApprovalPipelineStatusBinding },
  "applyPriceReviewDecision": { configurable: true, get: () => applyPriceReviewDecision, set: replaceApplyPriceReviewDecisionBinding },
  "applyCostManagerAuthorization": { configurable: true, get: () => applyCostManagerAuthorization, set: replaceApplyCostManagerAuthorizationBinding },
  "commitExternalResult": { configurable: true, get: () => commitExternalResult, set: replaceCommitExternalResultBinding },
 });
}
