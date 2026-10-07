// catalog/state: authoritative source; see docs/module-map.md.
import {
  currentDeptDemandPhase
} from "../demand/state.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_UNIT_FALLBACK,
  STATION_MASTER
} from "../projects/config.js";

// @legacy-unit 257 1265
export let itemPickerDemandType;
export function initializeItemPickerDemandTypeBinding() {
  itemPickerDemandType = DEMAND_TYPE_MFG;
}
// @end-legacy-unit 257

// @legacy-unit 258 1266
export let itemPickerStage;
export function initializeItemPickerStageBinding() {
  itemPickerStage = currentDeptDemandPhase;
}
// @end-legacy-unit 258

// @legacy-unit 259 1267
export let itemPickerStation;
export function initializeItemPickerStationBinding() {
  itemPickerStation = STATION_MASTER[0];
}
// @end-legacy-unit 259

// @legacy-unit 260 1268
export let itemPickerDemandUnit;
export function initializeItemPickerDemandUnitBinding() {
  itemPickerDemandUnit = DEMAND_UNIT_FALLBACK;
}
// @end-legacy-unit 260

// @legacy-unit 261 1269
export let itemPickerRequestLine;
export function initializeItemPickerRequestLineBinding() {
  itemPickerRequestLine = "Line 1";
}
// @end-legacy-unit 261

// @legacy-unit 269 1277
export let requestItemPickerQuery;
export function initializeRequestItemPickerQueryBinding() {
  requestItemPickerQuery = "";
}
// @end-legacy-unit 269

// @legacy-unit 271 1279
export let requestItemPickerSourceMode;
export function initializeRequestItemPickerSourceModeBinding() {
  requestItemPickerSourceMode = "catalog";
}
// @end-legacy-unit 271

// @legacy-unit 272 1280
export let requestItemPickerLevel1;
export function initializeRequestItemPickerLevel1Binding() {
  requestItemPickerLevel1 = "";
}
// @end-legacy-unit 272

// @legacy-unit 273 1281
export let requestItemPickerLevel2;
export function initializeRequestItemPickerLevel2Binding() {
  requestItemPickerLevel2 = "";
}
// @end-legacy-unit 273

// @legacy-unit 274 1282
export let requestItemPickerLevel3;
export function initializeRequestItemPickerLevel3Binding() {
  requestItemPickerLevel3 = "";
}
// @end-legacy-unit 274

// @legacy-unit 275 1283
export let requestCatalogApiRows;
export function initializeRequestCatalogApiRowsBinding() {
  requestCatalogApiRows = [];
}
// @end-legacy-unit 275

// @legacy-unit 276 1284
export let requestCatalogApiStatus;
export function initializeRequestCatalogApiStatusBinding() {
  requestCatalogApiStatus = "idle";
}
// @end-legacy-unit 276

// @legacy-unit 277 1285
export let requestCatalogApiKey;
export function initializeRequestCatalogApiKeyBinding() {
  requestCatalogApiKey = "";
}
// @end-legacy-unit 277

// @legacy-unit 278 1286
export let requestCatalogApiTimer;
export function initializeRequestCatalogApiTimerBinding() {
  requestCatalogApiTimer = null;
}
// @end-legacy-unit 278

// @legacy-unit 300 1308
export let searchResults;
export function initializeSearchResultsBinding() {
  searchResults = [];
}
// @end-legacy-unit 300

// @legacy-unit 301 1309
export let naturalSearchActive;
export function initializeNaturalSearchActiveBinding() {
  naturalSearchActive = false;
}
// @end-legacy-unit 301

// @legacy-unit 302 1310
export let historyResults;
export function initializeHistoryResultsBinding() {
  historyResults = [];
}
// @end-legacy-unit 302

// @legacy-unit 303 1311
export let historySearchActive;
export function initializeHistorySearchActiveBinding() {
  historySearchActive = false;
}
// @end-legacy-unit 303

// @legacy-unit 304 1312
export let historySelections;
export function initializeHistorySelectionsBinding() {
  historySelections = new Set();
}
// @end-legacy-unit 304

// @legacy-unit 305 1313
export let currentReuseMode;
export function initializeCurrentReuseModeBinding() {
  currentReuseMode = "catalog";
}
// @end-legacy-unit 305

export function replaceItemPickerStageBinding(value) { itemPickerStage = value; return value; }

export function replaceItemPickerDemandTypeBinding(value) { itemPickerDemandType = value; return value; }

export function replaceItemPickerRequestLineBinding(value) { itemPickerRequestLine = value; return value; }

export function replaceItemPickerStationBinding(value) { itemPickerStation = value; return value; }

export function replaceItemPickerDemandUnitBinding(value) { itemPickerDemandUnit = value; return value; }

export function replaceCurrentReuseModeBinding(value) { currentReuseMode = value; return value; }

export function replaceRequestCatalogApiKeyBinding(value) { requestCatalogApiKey = value; return value; }

export function replaceRequestCatalogApiStatusBinding(value) { requestCatalogApiStatus = value; return value; }

export function replaceRequestCatalogApiRowsBinding(value) { requestCatalogApiRows = value; return value; }

export function replaceRequestCatalogApiTimerBinding(value) { requestCatalogApiTimer = value; return value; }

export function replaceRequestItemPickerQueryBinding(value) { requestItemPickerQuery = value; return value; }

export function replaceRequestItemPickerLevel1Binding(value) { requestItemPickerLevel1 = value; return value; }

export function replaceRequestItemPickerLevel2Binding(value) { requestItemPickerLevel2 = value; return value; }

export function replaceRequestItemPickerLevel3Binding(value) { requestItemPickerLevel3 = value; return value; }

export function replaceRequestItemPickerSourceModeBinding(value) { requestItemPickerSourceMode = value; return value; }

export function replaceNaturalSearchActiveBinding(value) { naturalSearchActive = value; return value; }

export function replaceSearchResultsBinding(value) { searchResults = value; return value; }

export function replaceHistorySearchActiveBinding(value) { historySearchActive = value; return value; }

export function replaceHistoryResultsBinding(value) { historyResults = value; return value; }
