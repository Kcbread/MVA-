// materials/state: authoritative source; see docs/module-map.md.


// @legacy-unit 282 1290
export let newItemSequence;
export function initializeNewItemSequenceBinding() {
  newItemSequence = 1;
}
// @end-legacy-unit 282

// @legacy-unit 283 1291
export let masterSequence;
export function initializeMasterSequenceBinding() {
  masterSequence = 1;
}
// @end-legacy-unit 283

// @legacy-unit 284 1292
export let materialSequence;
export function initializeMaterialSequenceBinding() {
  materialSequence = 1;
}
// @end-legacy-unit 284

// @legacy-unit 298 1306
export let selectedNewItemId;
export function initializeSelectedNewItemIdBinding() {
  selectedNewItemId = null;
}
// @end-legacy-unit 298

// @legacy-unit 306 1314
export let newItemSelections;
export function initializeNewItemSelectionsBinding() {
  newItemSelections = new Set();
}
// @end-legacy-unit 306

// @legacy-unit 310 1318
export let newItemSuggestions;
export function initializeNewItemSuggestionsBinding() {
  newItemSuggestions = [];
}
// @end-legacy-unit 310

// @legacy-unit 318 1327
export let materialMasterRecords;
export function initializeMaterialMasterRecordsBinding() {
  materialMasterRecords = [];
}
// @end-legacy-unit 318

// @legacy-unit 327 1336
export let pendingMaterialEntryId;
export function initializePendingMaterialEntryIdBinding() {
  pendingMaterialEntryId = "";
}
// @end-legacy-unit 327

// @legacy-unit 328 1337
export let pendingStandardPickerId;
export function initializePendingStandardPickerIdBinding() {
  pendingStandardPickerId = "";
}
// @end-legacy-unit 328

// @legacy-unit 329 1338
export let standardPickerQuery;
export function initializeStandardPickerQueryBinding() {
  standardPickerQuery = "";
}
// @end-legacy-unit 329

// @legacy-unit 330 1339
export let batchMaterialIds;
export function initializeBatchMaterialIdsBinding() {
  batchMaterialIds = [];
}
// @end-legacy-unit 330

// @legacy-unit 331 1340
export let activeBatchMaterialId;
export function initializeActiveBatchMaterialIdBinding() {
  activeBatchMaterialId = "";
}
// @end-legacy-unit 331

export function replaceMaterialMasterRecordsBinding(value) { materialMasterRecords = value; return value; }

export function replaceNewItemSuggestionsBinding(value) { newItemSuggestions = value; return value; }

export function replaceNewItemSelectionsBinding(value) { newItemSelections = value; return value; }

export function replacePendingMaterialEntryIdBinding(value) { pendingMaterialEntryId = value; return value; }

export function replacePendingStandardPickerIdBinding(value) { pendingStandardPickerId = value; return value; }

export function replaceStandardPickerQueryBinding(value) { standardPickerQuery = value; return value; }

export function replaceBatchMaterialIdsBinding(value) { batchMaterialIds = value; return value; }

export function replaceActiveBatchMaterialIdBinding(value) { activeBatchMaterialId = value; return value; }

export function advanceMaterialSequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? materialSequence++ : ++materialSequence;
  return postfix ? materialSequence-- : --materialSequence;
}

export function advanceMasterSequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? masterSequence++ : ++masterSequence;
  return postfix ? masterSequence-- : --masterSequence;
}

export function advanceNewItemSequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? newItemSequence++ : ++newItemSequence;
  return postfix ? newItemSequence-- : --newItemSequence;
}
