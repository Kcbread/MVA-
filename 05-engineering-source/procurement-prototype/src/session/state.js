// session/state: authoritative source; see docs/module-map.md.


// @legacy-unit 215 1208
export let currentRole;
export function initializeCurrentRoleBinding() {
  currentRole = "requester";
}
// @end-legacy-unit 215

// @legacy-unit 216 1209
export let currentUserRole;
export function initializeCurrentUserRoleBinding() {
  currentUserRole = "requester";
}
// @end-legacy-unit 216

// @legacy-unit 217 1210
export let currentSessionUser;
export function initializeCurrentSessionUserBinding() {
  currentSessionUser = null;
}
// @end-legacy-unit 217

// @legacy-unit 218 1211
export let apiSessionReady;
export function initializeApiSessionReadyBinding() {
  apiSessionReady = false;
}
// @end-legacy-unit 218

// @legacy-unit 226 1223
export let currentRequesterPersonaId;
export function initializeCurrentRequesterPersonaIdBinding() {
  currentRequesterPersonaId = "";
}
// @end-legacy-unit 226

export function replaceCurrentRequesterPersonaIdBinding(value) { currentRequesterPersonaId = value; return value; }

export function replaceCurrentSessionUserBinding(value) { currentSessionUser = value; return value; }

export function replaceApiSessionReadyBinding(value) { apiSessionReady = value; return value; }

export function replaceCurrentRoleBinding(value) { currentRole = value; return value; }

export function replaceCurrentUserRoleBinding(value) { currentUserRole = value; return value; }
