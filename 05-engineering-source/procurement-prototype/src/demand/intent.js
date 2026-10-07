// demand/intent: authoritative source; see docs/module-map.md.
import {
  REQUEST_ACTION_NEW_BUY,
  REQUEST_ACTION_OPTIONS,
  REQUEST_ACTION_OTHER
} from "../projects/config.js";

// @legacy-unit 30 83
export function normalizeRequestAction(value = "") {
  return REQUEST_ACTION_OPTIONS.includes(String(value || "").trim())
    ? String(value || "").trim()
    : REQUEST_ACTION_NEW_BUY;
}
// @end-legacy-unit 30

// @legacy-unit 31 89
export function requestActionValue(row = {}) {
  return normalizeRequestAction(row.requestAction || row.action);
}
// @end-legacy-unit 31

// @legacy-unit 32 93
export function requestActionOtherTextValue(row = {}) {
  if (requestActionValue(row) !== REQUEST_ACTION_OTHER) return "";
  return String(row.requestActionOtherText || row.actionOtherText || "").trim();
}
// @end-legacy-unit 32

// @legacy-unit 33 98
export function normalizeRequestIntentFields(row = {}) {
  const requestAction = requestActionValue(row);
  return {
    ...row,
    requestAction,
    action: requestAction,
    requestActionOtherText: requestAction === REQUEST_ACTION_OTHER ? requestActionOtherTextValue(row) : "",
  };
}
// @end-legacy-unit 33
