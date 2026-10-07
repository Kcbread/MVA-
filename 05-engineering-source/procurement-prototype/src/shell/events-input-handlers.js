// shell/events-input-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderMaterialStandardPicker
} from "../materials/standard-picker.js";
import {
  replaceStandardPickerQueryBinding
} from "../materials/state.js";

export function handleInputStandardNamePickerQuery(event) {
  if (event.target.id === "standardNamePickerQuery") {
    replaceStandardPickerQueryBinding(event.target.value);
    renderMaterialStandardPicker();
  }
}
