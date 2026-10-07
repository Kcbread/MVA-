// demand/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  closeRequestItemPicker,
  hydrateRequestCatalogItems,
  openRequestItemPicker,
  renderRequestItemPicker,
  startNewItemRequest
} from "../catalog/search.js";
import {
  replaceRequestItemPickerSourceModeBinding,
  requestItemPickerSourceMode
} from "../catalog/state.js";
import {
  horizontalTableNavigatorModule
} from "../infrastructure/module-adapters.js";
import {
  DEMAND_TYPE_MFG
} from "../projects/config.js";
import {
  setDemandAnalysisTab
} from "../shell/navigation.js";
import {
  saveRequesterDraft
} from "./drafts.js";
import {
  addDemandEditorRow,
  closeDemandEditor,
  openDemandEditor,
  renderDemandEditor
} from "./editor.js";
import {
  cancelUserAOmQuote,
  confirmUserAAmendment,
  confirmUserAOmQuote,
  createUserAAmendmentDraft,
  rejectUserAAmendment
} from "./quote-confirmation.js";
import {
  removeRequest
} from "./request-fields.js";
import {
  renderSelectedDemandLines
} from "./selected-lines.js";
import {
  expandedDemandEditorCarryoverRows,
  replaceRequestWorksheetVisiblePhaseBinding,
  requestWorksheetVisiblePhase
} from "./state.js";
import {
  submitRequests
} from "./submit.js";
import {
  addWorksheetRow,
  renderRequestRows
} from "./worksheet-actions.js";
import {
  syncRequestWorksheetContext,
  syncRequestWorksheetVisiblePhase
} from "./worksheet-view.js";

export function handleClickRequestWorksheetTab(requestWorksheetTab, requestPhaseJumpButton, requestPickerSourceTab) {
  if (requestWorksheetTab) {
    syncRequestWorksheetContext({ mode: requestWorksheetTab.dataset.requestWorksheetTab || DEMAND_TYPE_MFG });
    renderRequestRows();
  }
  if (requestPhaseJumpButton) {
    replaceRequestWorksheetVisiblePhaseBinding(requestPhaseJumpButton.dataset.requestPhaseJump || requestWorksheetVisiblePhase);
    horizontalTableNavigatorModule().scrollToGroup?.("requestWorksheet", requestWorksheetVisiblePhase);
    syncRequestWorksheetVisiblePhase();
  }
  if (requestPickerSourceTab) {
    if (requestPickerSourceTab.dataset.requestPickerSourceTab === "new") {
      startNewItemRequest();
      return true;
    }
    replaceRequestItemPickerSourceModeBinding(requestPickerSourceTab.dataset.requestPickerSourceTab || "catalog");
    if (requestItemPickerSourceMode === "catalog") hydrateRequestCatalogItems({ force: true });
    renderRequestItemPicker();
  }
}

export function handleClickDemandAnalysisTab(demandAnalysisTab) {
  if (demandAnalysisTab) setDemandAnalysisTab(demandAnalysisTab.dataset.demandAnalysisTab);
}

export function handleClickOpenRequestItemPicker(action) {
  if (action === "openRequestItemPicker") openRequestItemPicker();
  if (action === "closeRequestItemPicker") closeRequestItemPicker();
}

export function handleClickStartNewItemRequest(action) {
  if (action === "startNewItemRequest") startNewItemRequest();
}

export function handleClickAddWorksheetRow(action, addWorksheetSourceButton) {
  if (action === "addWorksheetRow") addWorksheetRow();
  if (addWorksheetSourceButton) addWorksheetRow(addWorksheetSourceButton.dataset.addWorksheetSource || "");
}

export function handleClickAddDemandEditorRow(action) {
  if (action === "addDemandEditorRow") addDemandEditorRow();
  if (action === "closeDemandEditor") closeDemandEditor();
}

export function handleClickDemandEditorCarryoverToggle(demandEditorCarryoverToggle) {
  if (demandEditorCarryoverToggle) {
    const key = demandEditorCarryoverToggle.dataset.demandEditorCarryoverToggle;
    if (expandedDemandEditorCarryoverRows.has(key)) expandedDemandEditorCarryoverRows.delete(key);
    else expandedDemandEditorCarryoverRows.add(key);
    renderDemandEditor();
  }
}

export function handleClickEditDemandButton(editDemandButton) {
  if (editDemandButton) openDemandEditor(editDemandButton.dataset.editDemand);
}

export function handleClickSaveRequesterDraft(action) {
  if (action === "saveRequesterDraft") saveRequesterDraft();
  if (action === "submitRequests") submitRequests();
}

export function handleClickRemoveWorksheetButton(removeWorksheetButton) {
  if (removeWorksheetButton) {
    removeRequest(removeWorksheetButton.dataset.requestWorksheetRemove);
  }
}

export function handleClickRemoveSelectedDemandButton(removeSelectedDemandButton) {
  if (removeSelectedDemandButton) {
    removeRequest(removeSelectedDemandButton.dataset.removeSelectedDemand);
    renderSelectedDemandLines();
  }
}

export function handleClickUserAQuoteConfirmButton(userAQuoteConfirmButton, userAQuoteCancelButton, userAAmendButton, userAAmendConfirmButton, userAAmendRejectButton) {
  if (userAQuoteConfirmButton) confirmUserAOmQuote(userAQuoteConfirmButton.dataset.useraQuoteConfirm);
  if (userAQuoteCancelButton) cancelUserAOmQuote(userAQuoteCancelButton.dataset.useraQuoteCancel);
  if (userAAmendButton) createUserAAmendmentDraft(userAAmendButton.dataset.useraAmend);
  if (userAAmendConfirmButton) confirmUserAAmendment(userAAmendConfirmButton.dataset.useraAmendConfirm);
  if (userAAmendRejectButton) rejectUserAAmendment(userAAmendRejectButton.dataset.useraAmendReject);
}
