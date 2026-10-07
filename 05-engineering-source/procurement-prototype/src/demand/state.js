// demand/state: authoritative source; see docs/module-map.md.
import {
  DEMAND_TYPE_MFG,
  STAGES,
  currentStageForProject,
  nextBuyStageForProject
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";

// @legacy-unit 237 1245
export let expandedDemandEditorCarryoverRows;
export function initializeExpandedDemandEditorCarryoverRowsBinding() {
  expandedDemandEditorCarryoverRows = new Set();
}
// @end-legacy-unit 237

// @legacy-unit 252 1260
export let currentDeptDemandMode;
export function initializeCurrentDeptDemandModeBinding() {
  currentDeptDemandMode = "mfg";
}
// @end-legacy-unit 252

// @legacy-unit 253 1261
export let currentDeptDemandPhase;
export function initializeCurrentDeptDemandPhaseBinding() {
  currentDeptDemandPhase = nextBuyStageForProject(currentProject) || currentStageForProject(currentProject);
}
// @end-legacy-unit 253

// @legacy-unit 254 1262
export let lastRequestProject;
export function initializeLastRequestProjectBinding() {
  lastRequestProject = currentProject;
}
// @end-legacy-unit 254

// @legacy-unit 255 1263
export let lastRequestPhase;
export function initializeLastRequestPhaseBinding() {
  lastRequestPhase = currentDeptDemandPhase;
}
// @end-legacy-unit 255

// @legacy-unit 256 1264
export let lastDemandType;
export function initializeLastDemandTypeBinding() {
  lastDemandType = DEMAND_TYPE_MFG;
}
// @end-legacy-unit 256

// @legacy-unit 262 1270
export let requestWorksheetMode;
export function initializeRequestWorksheetModeBinding() {
  requestWorksheetMode = DEMAND_TYPE_MFG;
}
// @end-legacy-unit 262

// @legacy-unit 263 1271
export let requestWorksheetLine;
export function initializeRequestWorksheetLineBinding() {
  requestWorksheetLine = "Line 1";
}
// @end-legacy-unit 263

// @legacy-unit 264 1272
export let requestWorksheetAddQuery;
export function initializeRequestWorksheetAddQueryBinding() {
  requestWorksheetAddQuery = "";
}
// @end-legacy-unit 264

// @legacy-unit 265 1273
export let requestWorksheetSelectedSource;
export function initializeRequestWorksheetSelectedSourceBinding() {
  requestWorksheetSelectedSource = "";
}
// @end-legacy-unit 265

// @legacy-unit 266 1274
export let requestWorksheetAddPhase;
export function initializeRequestWorksheetAddPhaseBinding() {
  requestWorksheetAddPhase = currentDeptDemandPhase;
}
// @end-legacy-unit 266

// @legacy-unit 267 1275
export let requestWorksheetVisiblePhase;
export function initializeRequestWorksheetVisiblePhaseBinding() {
  requestWorksheetVisiblePhase = STAGES[0];
}
// @end-legacy-unit 267

// @legacy-unit 268 1276
export let requestWorksheetActiveCell;
export function initializeRequestWorksheetActiveCellBinding() {
  requestWorksheetActiveCell = { requestId: "", phase: "", column: "" };
}
// @end-legacy-unit 268

// @legacy-unit 270 1278
export let restoredRequesterDraftKeys;
export function initializeRestoredRequesterDraftKeysBinding() {
  restoredRequesterDraftKeys = new Set();
}
// @end-legacy-unit 270

// @legacy-unit 279 1287
export let currentDeptDemandDepartment;
export function initializeCurrentDeptDemandDepartmentBinding() {
  currentDeptDemandDepartment = "";
}
// @end-legacy-unit 279

// @legacy-unit 281 1289
export let requestSequence;
export function initializeRequestSequenceBinding() {
  requestSequence = 1;
}
// @end-legacy-unit 281

// @legacy-unit 299 1307
export let activeDemandRequestId;
export function initializeActiveDemandRequestIdBinding() {
  activeDemandRequestId = "";
}
// @end-legacy-unit 299

// @legacy-unit 309 1317
export let requests;
export function initializeRequestsBinding() {
  requests = [];
}
// @end-legacy-unit 309

export function replaceCurrentDeptDemandDepartmentBinding(value) { currentDeptDemandDepartment = value; return value; }

export function replaceLastRequestProjectBinding(value) { lastRequestProject = value; return value; }

export function replaceCurrentDeptDemandPhaseBinding(value) { currentDeptDemandPhase = value; return value; }

export function replaceLastRequestPhaseBinding(value) { lastRequestPhase = value; return value; }

export function replaceRequestsBinding(value) { requests = value; return value; }

export function replaceLastDemandTypeBinding(value) { lastDemandType = value; return value; }

export function replaceRequestWorksheetModeBinding(value) { requestWorksheetMode = value; return value; }

export function replaceRequestWorksheetLineBinding(value) { requestWorksheetLine = value; return value; }

export function replaceRequestWorksheetAddPhaseBinding(value) { requestWorksheetAddPhase = value; return value; }

export function replaceRequestWorksheetVisiblePhaseBinding(value) { requestWorksheetVisiblePhase = value; return value; }

export function replaceRequestWorksheetSelectedSourceBinding(value) { requestWorksheetSelectedSource = value; return value; }

export function replaceRequestWorksheetAddQueryBinding(value) { requestWorksheetAddQuery = value; return value; }

export function replaceActiveDemandRequestIdBinding(value) { activeDemandRequestId = value; return value; }

export function replaceRequestSequenceBinding(value) { requestSequence = value; return value; }

export function replaceRequestWorksheetActiveCellBinding(value) { requestWorksheetActiveCell = value; return value; }

export function replaceCurrentDeptDemandModeBinding(value) { currentDeptDemandMode = value; return value; }

export function advanceRequestSequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? requestSequence++ : ++requestSequence;
  return postfix ? requestSequence-- : --requestSequence;
}
