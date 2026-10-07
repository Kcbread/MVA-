// om/events-forms.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  submitOmExternalResult
} from "./external-progress.js";

// @legacy-unit 1881 25176
export function initializeStep1881() {
document.getElementById("omExternalResultForm").addEventListener("submit", submitOmExternalResult);
}
// @end-legacy-unit 1881
