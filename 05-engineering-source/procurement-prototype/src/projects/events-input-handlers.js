// projects/events-input-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  replaceCurrentProjectCodeBinding
} from "./state.js";

export function handleInputProjectCodeInput(event) {
  if (event.target.id === "projectCodeInput") {
    replaceCurrentProjectCodeBinding(String(event.target.value || "").trim());
  }
}
