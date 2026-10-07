// shell/state: authoritative source; see docs/module-map.md.
import {
  currentUserRole
} from "../session/state.js";

// @legacy-unit 222 1219
export let currentView;
export function initializeCurrentViewBinding() {
  currentView = "department";
}
// @end-legacy-unit 222

// @legacy-unit 232 1240
export let currentDeptTab;
export function initializeCurrentDeptTabBinding() {
  currentDeptTab = "request";
}
// @end-legacy-unit 232

// @legacy-unit 233 1241
export let currentManagerTab;
export function initializeCurrentManagerTabBinding() {
  currentManagerTab = "review";
}
// @end-legacy-unit 233

// @legacy-unit 238 1246
export let currentHandoffTab;
export function initializeCurrentHandoffTabBinding() {
  currentHandoffTab = "queue";
}
// @end-legacy-unit 238

// @legacy-unit 249 1257
export let currentPriceReviewTab;
export function initializeCurrentPriceReviewTabBinding() {
  currentPriceReviewTab = "pending";
}
// @end-legacy-unit 249

// @legacy-unit 250 1258
export let currentPriceReviewQueue;
export function initializeCurrentPriceReviewQueueBinding() {
  currentPriceReviewQueue = "submission";
}
// @end-legacy-unit 250

// @legacy-unit 311 1320
export function initializeStep0311() {
globalThis.currentUserRole = currentUserRole;
}
// @end-legacy-unit 311

// @legacy-unit 312 1321
export function initializeStep0312() {
globalThis.currentView = currentView;
}
// @end-legacy-unit 312

// @legacy-unit 313 1322
export function initializeStep0313() {
globalThis.currentDeptTab = currentDeptTab;
}
// @end-legacy-unit 313

// @legacy-unit 332 1341
export let STANDARD_INLINE_LIMIT;
export function initializeSTANDARD_INLINE_LIMITBinding() {
  STANDARD_INLINE_LIMIT = 20;
}
// @end-legacy-unit 332

export function replaceCurrentManagerTabBinding(value) { currentManagerTab = value; return value; }

export function replaceCurrentPriceReviewTabBinding(value) { currentPriceReviewTab = value; return value; }

export function replaceCurrentViewBinding(value) { currentView = value; return value; }

export function replaceCurrentDeptTabBinding(value) { currentDeptTab = value; return value; }

export function replaceCurrentHandoffTabBinding(value) { currentHandoffTab = value; return value; }

export function replaceCurrentPriceReviewQueueBinding(value) { currentPriceReviewQueue = value; return value; }
