// infrastructure/module-adapters: authoritative source; see docs/module-map.md.


// @legacy-unit 459 2882
export function sharedFormatters() {
  return globalThis.ProcurementApp?.sharedFormatters;
}
// @end-legacy-unit 459

// @legacy-unit 460 2886
export function demandCostDashboardModule() {
  return globalThis.ProcurementApp?.modules?.demandCostDashboard;
}
// @end-legacy-unit 460

// @legacy-unit 461 2890
export function leadTimeModule() {
  return globalThis.ProcurementApp?.modules?.leadTime || {};
}
// @end-legacy-unit 461

// @legacy-unit 462 2894
export function purposeDateModule() {
  return globalThis.ProcurementApp?.modules?.purposeDate || {};
}
// @end-legacy-unit 462

// @legacy-unit 463 2898
export function workflowStatusModule() {
  return globalThis.ProcurementApp?.modules?.workflowStatus || {};
}
// @end-legacy-unit 463

// @legacy-unit 464 2902
export function omBusinessFlowModule() {
  return globalThis.ProcurementApp?.modules?.omBusinessFlow || {};
}
// @end-legacy-unit 464

// @legacy-unit 465 2906
export function quoteValidityModule() {
  return globalThis.ProcurementApp?.modules?.quoteValidity || {};
}
// @end-legacy-unit 465

// @legacy-unit 466 2910
export function omProgressModule() {
  return globalThis.ProcurementApp?.modules?.omProgress || {};
}
// @end-legacy-unit 466

// @legacy-unit 1634 20345
export function priceDecisionModule() {
  return window.ProcurementApp?.modules?.priceDecision || {};
}
// @end-legacy-unit 1634

// @legacy-unit 1635 20349
export function horizontalTableNavigatorModule() {
  return window.ProcurementApp?.modules?.horizontalTableNavigator || {};
}
// @end-legacy-unit 1635

// @legacy-unit 1636 20353
export function requestWorksheetMatrixModule() {
  return window.ProcurementApp?.modules?.requestWorksheetMatrix || {};
}
// @end-legacy-unit 1636

// @legacy-unit 1637 20357
export function approvalWorkbenchModule() {
  return window.ProcurementApp?.modules?.approvalWorkbench || {};
}
// @end-legacy-unit 1637

// @legacy-unit 1638 20361
export function approvalQuantityReviewModule() {
  return window.ProcurementApp?.modules?.approvalQuantityReview || {};
}
// @end-legacy-unit 1638

// @legacy-unit 1639 20365
export function roleQueueConfigModule() {
  return window.ProcurementApp?.modules?.roleQueueConfig || {};
}
// @end-legacy-unit 1639
