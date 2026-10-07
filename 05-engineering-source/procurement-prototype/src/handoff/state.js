// handoff/state: authoritative source; see docs/module-map.md.


// @legacy-unit 285 1293
export let handoffHistorySequence;
export function initializeHandoffHistorySequenceBinding() {
  handoffHistorySequence = 1;
}
// @end-legacy-unit 285

// @legacy-unit 287 1295
export let dispatchHistorySequence;
export function initializeDispatchHistorySequenceBinding() {
  dispatchHistorySequence = 1;
}
// @end-legacy-unit 287

// @legacy-unit 288 1296
export let externalProgressSequence;
export function initializeExternalProgressSequenceBinding() {
  externalProgressSequence = 1;
}
// @end-legacy-unit 288

// @legacy-unit 314 1323
export let handoffHistory;
export function initializeHandoffHistoryBinding() {
  handoffHistory = [];
}
// @end-legacy-unit 314

// @legacy-unit 316 1325
export let dispatchHistory;
export function initializeDispatchHistoryBinding() {
  dispatchHistory = [];
}
// @end-legacy-unit 316

export function replaceHandoffHistoryBinding(value) { handoffHistory = value; return value; }

export function replaceDispatchHistoryBinding(value) { dispatchHistory = value; return value; }

export function advanceHandoffHistorySequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? handoffHistorySequence++ : ++handoffHistorySequence;
  return postfix ? handoffHistorySequence-- : --handoffHistorySequence;
}

export function advanceDispatchHistorySequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? dispatchHistorySequence++ : ++dispatchHistorySequence;
  return postfix ? dispatchHistorySequence-- : --dispatchHistorySequence;
}

export function advanceExternalProgressSequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? externalProgressSequence++ : ++externalProgressSequence;
  return postfix ? externalProgressSequence-- : --externalProgressSequence;
}
