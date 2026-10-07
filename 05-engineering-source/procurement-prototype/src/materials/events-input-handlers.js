// materials/events-input-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  updateBatchMaterialField
} from "./batch.js";
import {
  updateMaterialEntryField
} from "./entry-view.js";

export function handleInputMaterialEntryInputs(materialEntryInputs, event) {
  if (materialEntryInputs[event.target.id]) {
    updateMaterialEntryField(materialEntryInputs[event.target.id], event.target.value, {
      rerender: event.target.id === "materialEntryStandardNameCn",
    });
  }
}

export function handleInputBatchMaterialInputs(batchMaterialInputs, event) {
  if (batchMaterialInputs[event.target.id]) {
    updateBatchMaterialField(batchMaterialInputs[event.target.id], event.target.value, {
      rerender: event.target.id === "materialBatchStandardNameCn",
    });
  }
}
