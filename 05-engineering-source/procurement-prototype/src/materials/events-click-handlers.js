// materials/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderRequestItemPicker,
  sourceFromWorksheetValue
} from "../catalog/search.js";
import {
  replaceRequestItemPickerSourceModeBinding
} from "../catalog/state.js";
import {
  validateBaselineMaterialPlan
} from "../demand/baseline-setup.js";
import {
  addWorksheetRow
} from "../demand/worksheet-actions.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  addCompletedBatchMaterials,
  closeMaterialBatch,
  renderMaterialBatch
} from "./batch.js";
import {
  closeMaterialEntry,
  materialEntryRow
} from "./entry-view.js";
import {
  completeSelectedMaterials
} from "./maintenance.js";
import {
  closeMaterialStandardPicker,
  openMaterialStandardPicker,
  selectMaterialStandardName,
  toggleMaterialStandardName,
  toggleStandardNameForSuggestion
} from "./standard-picker.js";
import {
  activeBatchMaterialId,
  pendingMaterialEntryId,
  replaceActiveBatchMaterialIdBinding
} from "./state.js";

export function handleClickDiscardMaterialDraft(action) {
  if (action === "discardMaterialDraft") {
    closeMaterialEntry({ discard: true });
    replaceRequestItemPickerSourceModeBinding("catalog");
    document.getElementById("requestItemPickerModal").hidden = false;
    renderRequestItemPicker();
    document.getElementById("requestItemPickerQuery").focus();
    showToast("New item draft discarded.", "info");
  }
}

export function handleClickMaterialCandidateButton(materialCandidateButton) {
  if (materialCandidateButton) {
    const draft = materialEntryRow();
    const value = materialCandidateButton.dataset.useMaterialCandidate;
    if (!draft?.duplicateCandidates?.some((item) => item.sourceValue === value)) return true;
    const source = sourceFromWorksheetValue(value, draft.standardNameCn);
    if (!source || source.type === "new") {
      showToast("This item is no longer available. Please search again.", "error");
      return true;
    }
    addWorksheetRow(value, source);
    closeMaterialEntry({ discard: true });
    return true;
  }
}

export function handleClickCompleteSelectedMaterials(action) {
  if (action === "completeSelectedMaterials") completeSelectedMaterials();
}

export function handleClickValidateBaselineMaterialPlan(action) {
  if (action === "validateBaselineMaterialPlan") validateBaselineMaterialPlan();
}

export function handleClickCloseMaterialEntry(action, materialStandardButton) {
  if (action === "closeMaterialEntry") closeMaterialEntry();
  if (action === "openMaterialStandardPicker") openMaterialStandardPicker(pendingMaterialEntryId);
  if (action === "openBatchStandardPicker") openMaterialStandardPicker(activeBatchMaterialId);
  if (action === "closeMaterialStandardPicker") closeMaterialStandardPicker();
  if (action === "closeMaterialBatch") closeMaterialBatch();
  if (action === "toggleBatchStandardName") {
    toggleStandardNameForSuggestion(activeBatchMaterialId);
    renderMaterialBatch();
  }
  if (action === "addCompletedBatchMaterials") addCompletedBatchMaterials();
  if (action === "toggleMaterialStandardName") toggleMaterialStandardName();
  if (action === "selectMaterialStandardName" && materialStandardButton) selectMaterialStandardName(materialStandardButton.dataset.materialStandardId);
}

export function handleClickBatchMaterialButton(batchMaterialButton) {
  if (batchMaterialButton) {
    replaceActiveBatchMaterialIdBinding(batchMaterialButton.dataset.batchMaterialId);
    renderMaterialBatch();
  }
}
