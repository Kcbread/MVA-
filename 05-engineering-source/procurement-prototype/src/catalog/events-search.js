// catalog/events-search.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  runHistorySearch,
  runNaturalSearch
} from "./search-actions.js";

// @legacy-unit 1892 26414
export function initializeStep1892() {
document.getElementById("naturalQuery")?.addEventListener("input", () => {
  if (document.getElementById("naturalQuery")?.value.trim()) runNaturalSearch();
});
}
// @end-legacy-unit 1892

// @legacy-unit 1893 26418
export function initializeStep1893() {
document.getElementById("historyQuery")?.addEventListener("input", () => {
  if (document.getElementById("historyQuery")?.value.trim()) runHistorySearch();
});
}
// @end-legacy-unit 1893
