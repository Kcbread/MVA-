// materials/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  updateBatchMaterialField
} from "./batch.js";
import {
  updateMaterialEntryField
} from "./entry-view.js";

export function handleChangeMaterialEntryFields(materialEntryFields, event) {
  if (materialEntryFields[event.target.id]) {
    updateMaterialEntryField(materialEntryFields[event.target.id], event.target.value, { rerender: true });
  }
}

export function handleChangeBatchMaterialFields(batchMaterialFields, event) {
  if (batchMaterialFields[event.target.id]) {
    updateBatchMaterialField(batchMaterialFields[event.target.id], event.target.value, { rerender: true });
  }
}
