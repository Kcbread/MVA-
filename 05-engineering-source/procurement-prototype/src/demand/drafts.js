// demand/drafts: authoritative source; see docs/module-map.md.
import {
  normalizeRequesterDateFields
} from "./records.js";
import {
  renderSelectedDemandLines
} from "./selected-lines.js";
import {
  replaceRequestSequenceBinding,
  replaceRequestsBinding,
  requestSequence,
  requests,
  restoredRequesterDraftKeys
} from "./state.js";
import {
  requesterPackageRows
} from "./worksheet.js";
import {
  renderRequestRows
} from "./worksheet-actions.js";
import {
  DEFAULT_PURPOSE_LOCATION
} from "../projects/config.js";
import {
  normalizePurposeLocation,
  primaryRequestPhaseLineOpenDate
} from "../projects/dates.js";
import {
  currentRequesterPersona
} from "../session/persona.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1172 13988
export function requesterLocalDraftKey() {
  const persona = currentRequesterPersona();
  const owner = persona?.employeeId || persona?.email;
  return owner ? `mva-requester-drafts-v1:${owner}` : "";
}
// @end-legacy-unit 1172

// @legacy-unit 1173 13994
export function readRequesterLocalDrafts() {
  const key = requesterLocalDraftKey();
  if (!key) return [];
  const data = JSON.parse(localStorage.getItem(key) || '{"version":1,"rows":[]}');
  if (data.version !== 1 || !Array.isArray(data.rows)) throw new Error("Unsupported draft data");
  return data.rows.filter((row) => row && typeof row.id === "string" && Array.isArray(row.stationBreakdown));
}
// @end-legacy-unit 1173

// @legacy-unit 1174 14002
export function persistRequesterLocalDrafts(rows = [], removeIds = []) {
  try {
    const key = requesterLocalDraftKey();
    if (!key) throw new Error("No requester account selected");
    const map = new Map(readRequesterLocalDrafts().map((row) => [row.id, row]));
    removeIds.forEach((id) => map.delete(id));
    rows.forEach((row) => map.set(row.id, row));
    localStorage.setItem(key, JSON.stringify({ version: 1, rows: [...map.values()] }));
    return true;
  } catch (error) {
    showToast("Could not save on this browser. Keep this page open and try again.", "error");
    return false;
  }
}
// @end-legacy-unit 1174

// @legacy-unit 1175 14017
export function restoreRequesterLocalDrafts() {
  if (!["requester", "admin"].includes(currentRole)) return;
  const key = requesterLocalDraftKey();
  if (!key || restoredRequesterDraftKeys.has(key)) return;
  try {
    const rows = readRequesterLocalDrafts();
    const ids = new Set(rows.map((row) => row.id));
    replaceRequestsBinding([...rows, ...requests.filter((row) => !ids.has(row.id))]);
    const maxSequence = requests.reduce((max, row) => Math.max(max, Number(/^REQ-(\d+)$/.exec(row.id)?.[1] || 0)), 0);
    replaceRequestSequenceBinding(Math.max(requestSequence, maxSequence + 1));
    restoredRequesterDraftKeys.add(key);
  } catch (error) {
    restoredRequesterDraftKeys.add(key);
    showToast("Saved drafts could not be restored on this browser.", "error");
  }
}
// @end-legacy-unit 1175

// @legacy-unit 1176 14034
export function saveRequesterDraft() {
  const rows = requesterPackageRows();
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((row) => rows.some((item) => item.id === row.id)
    ? normalizeRequesterDateFields({
      ...row,
      draftSavedAt: now,
      purposeLocation: normalizePurposeLocation(row.purposeLocation || row.purpose || DEFAULT_PURPOSE_LOCATION),
      lineOpenDate: primaryRequestPhaseLineOpenDate(row),
    })
    : row));
  renderRequestRows();
  renderSelectedDemandLines();
  if (rows.length && !persistRequesterLocalDrafts(requests.filter((row) => rows.some((item) => item.id === row.id)))) return;
  showToast(rows.length ? `${rows.length} worksheet item${rows.length === 1 ? "" : "s"} saved on this browser.` : "No worksheet items on this line yet.", rows.length ? "success" : "info");
}
// @end-legacy-unit 1176

export function replaceRequesterLocalDraftKeyBinding(value) { requesterLocalDraftKey = value; return value; }

export function replaceReadRequesterLocalDraftsBinding(value) { readRequesterLocalDrafts = value; return value; }

export function replacePersistRequesterLocalDraftsBinding(value) { persistRequesterLocalDrafts = value; return value; }

export function replaceSaveRequesterDraftBinding(value) { saveRequesterDraft = value; return value; }
