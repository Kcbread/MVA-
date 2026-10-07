// om/filters: authoritative source; see docs/module-map.md.


// @legacy-unit 1562 19775
export function omProjectFilterValue() {
  return document.getElementById("omProjectFilter")?.value || "";
}
// @end-legacy-unit 1562

// @legacy-unit 1563 19779
export function omDemandProjectFilterValue() {
  return document.getElementById("omDemandProjectFilter")?.value || omProjectFilterValue();
}
// @end-legacy-unit 1563

// @legacy-unit 1564 19783
export function omHistoryProjectFilterValue() {
  return document.getElementById("omHistoryProjectFilter")?.value || omProjectFilterValue();
}
// @end-legacy-unit 1564

// @legacy-unit 1565 19787
export function omUserConfirmProjectFilterValue() {
  return document.getElementById("omUserConfirmProjectFilter")?.value || omProjectFilterValue();
}
// @end-legacy-unit 1565

// @legacy-unit 1566 19791
export function omFinalExportProjectFilterValue() {
  return document.getElementById("omFinalExportProjectFilter")?.value || omProjectFilterValue();
}
// @end-legacy-unit 1566
