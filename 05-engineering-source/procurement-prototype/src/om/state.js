// om/state: authoritative source; see docs/module-map.md.


// @legacy-unit 46 276
export let omProjectStageCalendarApiAuthoritative;
export function initializeOmProjectStageCalendarApiAuthoritativeBinding() {
  omProjectStageCalendarApiAuthoritative = false;
}
// @end-legacy-unit 46

// @legacy-unit 47 277
export let omLeaderConsoleSyncedAt;
export function initializeOmLeaderConsoleSyncedAtBinding() {
  omLeaderConsoleSyncedAt = "";
}
// @end-legacy-unit 47

// @legacy-unit 219 1212
export let omAssignees;
export function initializeOmAssigneesBinding() {
  omAssignees = [
  { id: "om-leader-mai", employeeId: "maint5", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader" },
  { id: "om-member-giang", employeeId: "giangth1", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember" },
  { id: "om-member-linh", employeeId: "linhnp", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember" },
];
}
// @end-legacy-unit 219

// @legacy-unit 220 1217
export let omAssignmentMap;
export function initializeOmAssignmentMapBinding() {
  omAssignmentMap = new Map();
}
// @end-legacy-unit 220

// @legacy-unit 221 1218
export let selectedOmOperatorId;
export function initializeSelectedOmOperatorIdBinding() {
  selectedOmOperatorId = "om-member-giang";
}
// @end-legacy-unit 221

// @legacy-unit 239 1247
export let currentOmTab;
export function initializeCurrentOmTabBinding() {
  currentOmTab = "submission";
}
// @end-legacy-unit 239

// @legacy-unit 240 1248
export let currentOmHandoffView;
export function initializeCurrentOmHandoffViewBinding() {
  currentOmHandoffView = "prep";
}
// @end-legacy-unit 240

// @legacy-unit 241 1249
export let currentOmStageFilter;
export function initializeCurrentOmStageFilterBinding() {
  currentOmStageFilter = "all";
}
// @end-legacy-unit 241

// @legacy-unit 242 1250
export let currentOmYearProjectFilter;
export function initializeCurrentOmYearProjectFilterBinding() {
  currentOmYearProjectFilter = "";
}
// @end-legacy-unit 242

// @legacy-unit 243 1251
export let currentOmProjectFilter;
export function initializeCurrentOmProjectFilterBinding() {
  currentOmProjectFilter = "";
}
// @end-legacy-unit 243

// @legacy-unit 244 1252
export let currentOmPhaseFilter;
export function initializeCurrentOmPhaseFilterBinding() {
  currentOmPhaseFilter = "";
}
// @end-legacy-unit 244

// @legacy-unit 245 1253
export let currentOmLevel1Filter;
export function initializeCurrentOmLevel1FilterBinding() {
  currentOmLevel1Filter = "";
}
// @end-legacy-unit 245

// @legacy-unit 246 1254
export let currentOmLevel2Filter;
export function initializeCurrentOmLevel2FilterBinding() {
  currentOmLevel2Filter = "";
}
// @end-legacy-unit 246

// @legacy-unit 247 1255
export let currentOmLevel3Filter;
export function initializeCurrentOmLevel3FilterBinding() {
  currentOmLevel3Filter = "";
}
// @end-legacy-unit 247

// @legacy-unit 248 1256
export let currentOmItemFilter;
export function initializeCurrentOmItemFilterBinding() {
  currentOmItemFilter = "";
}
// @end-legacy-unit 248

// @legacy-unit 286 1294
export let omHistorySequence;
export function initializeOmHistorySequenceBinding() {
  omHistorySequence = 1;
}
// @end-legacy-unit 286

// @legacy-unit 307 1315
export let omSelections;
export function initializeOmSelectionsBinding() {
  omSelections = new Set();
}
// @end-legacy-unit 307

// @legacy-unit 315 1324
export let omHistory;
export function initializeOmHistoryBinding() {
  omHistory = [];
}
// @end-legacy-unit 315

// @legacy-unit 324 1333
export let pendingOmExternalResultIds;
export function initializePendingOmExternalResultIdsBinding() {
  pendingOmExternalResultIds = [];
}
// @end-legacy-unit 324

// @legacy-unit 325 1334
export let pendingExternalProgressSource;
export function initializePendingExternalProgressSourceBinding() {
  pendingExternalProgressSource = "om";
}
// @end-legacy-unit 325

export function replaceCurrentOmTabBinding(value) { currentOmTab = value; return value; }

export function replaceOmAssignmentMapBinding(value) { omAssignmentMap = value; return value; }

export function replaceSelectedOmOperatorIdBinding(value) { selectedOmOperatorId = value; return value; }

export function replaceOmAssigneesBinding(value) { omAssignees = value; return value; }

export function replaceOmProjectStageCalendarApiAuthoritativeBinding(value) { omProjectStageCalendarApiAuthoritative = value; return value; }

export function replaceOmLeaderConsoleSyncedAtBinding(value) { omLeaderConsoleSyncedAt = value; return value; }

export function replaceCurrentOmHandoffViewBinding(value) { currentOmHandoffView = value; return value; }

export function replaceOmHistoryBinding(value) { omHistory = value; return value; }

export function replaceCurrentOmYearProjectFilterBinding(value) { currentOmYearProjectFilter = value; return value; }

export function replaceCurrentOmProjectFilterBinding(value) { currentOmProjectFilter = value; return value; }

export function replaceCurrentOmPhaseFilterBinding(value) { currentOmPhaseFilter = value; return value; }

export function replaceCurrentOmLevel1FilterBinding(value) { currentOmLevel1Filter = value; return value; }

export function replaceCurrentOmLevel2FilterBinding(value) { currentOmLevel2Filter = value; return value; }

export function replaceCurrentOmLevel3FilterBinding(value) { currentOmLevel3Filter = value; return value; }

export function replaceCurrentOmItemFilterBinding(value) { currentOmItemFilter = value; return value; }

export function replaceCurrentOmStageFilterBinding(value) { currentOmStageFilter = value; return value; }

export function replacePendingOmExternalResultIdsBinding(value) { pendingOmExternalResultIds = value; return value; }

export function replacePendingExternalProgressSourceBinding(value) { pendingExternalProgressSource = value; return value; }

export function advanceOmHistorySequenceBinding(delta, postfix) {
  if (delta === 1) return postfix ? omHistorySequence++ : ++omHistorySequence;
  return postfix ? omHistorySequence-- : --omHistorySequence;
}
