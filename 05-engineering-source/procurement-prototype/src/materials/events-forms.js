// materials/events-forms.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  submitMaterialEntry
} from "./new-item.js";

// @legacy-unit 1882 25177
export function initializeStep1882() {
document.getElementById("materialEntryForm").addEventListener("submit", submitMaterialEntry);
}
// @end-legacy-unit 1882

// @legacy-unit 1883 25178
export function initializeStep1883() {
document.getElementById("materialBatchForm").addEventListener("submit", (event) => event.preventDefault());
}
// @end-legacy-unit 1883
