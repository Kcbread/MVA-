// demand/events-input-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderRequestItemPicker,
  scheduleHydrateRequestCatalogItems
} from "../catalog/search.js";
import {
  replaceRequestItemPickerQueryBinding
} from "../catalog/state.js";
import {
  updateDemandEditorField
} from "./editor.js";
import {
  updateRequestIntentOtherText
} from "./selected-lines.js";
import {
  replaceRequestWorksheetAddQueryBinding,
  replaceRequestWorksheetSelectedSourceBinding
} from "./state.js";
import {
  renderRequestRows
} from "./worksheet-actions.js";
import {
  normalizeWorksheetQtyInput
} from "./worksheet.js";

export function handleInputRequestItemPickerQuery(event) {
  if (event.target.id === "requestItemPickerQuery") {
    replaceRequestItemPickerQueryBinding(event.target.value || "");
    scheduleHydrateRequestCatalogItems({ force: true });
    renderRequestItemPicker();
  }
  if (event.target.id === "requestWorksheetSearch") {
    replaceRequestWorksheetAddQueryBinding(event.target.value || "");
    replaceRequestWorksheetSelectedSourceBinding("");
    renderRequestRows();
  }
  if (event.target.dataset.requestWorksheetQty) {
    normalizeWorksheetQtyInput(event.target);
  }
}

export function handleInputRequestActionOther(requestActionOther, event) {
  if (requestActionOther) updateRequestIntentOtherText(requestActionOther, event.target.value);
}

export function handleInputDemandEditorId(demandEditorId, demandEditorRow, demandEditorField, event) {
  if (demandEditorId && demandEditorRow && demandEditorField) {
    updateDemandEditorField(demandEditorId, demandEditorRow, demandEditorField, event.target.value);
  }
}
