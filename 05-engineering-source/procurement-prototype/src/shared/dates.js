// shared/dates: authoritative source; see docs/module-map.md.
import {
  handoffHistory
} from "../handoff/state.js";
import {
  omHistory
} from "../om/state.js";

// @legacy-unit 1135 13128
export function compactTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}
// @end-legacy-unit 1135

// @legacy-unit 1136 13139
export function hoursSince(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  return (Date.now() - timestamp) / 3600000;
}
// @end-legacy-unit 1136

// @legacy-unit 1137 13146
export function fullTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-US");
}
// @end-legacy-unit 1137

// @legacy-unit 1138 13152
export function compactDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
// @end-legacy-unit 1138

// @legacy-unit 1139 13159
export function historyTimestamp(row, action) {
  const events = [
    ...handoffHistory.filter((event) => event.requestId === row.id),
    ...omHistory.filter((event) => event.requestId === row.id),
  ].filter((event) => event.action === action);
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).at(-1)?.timestamp || "";
}
// @end-legacy-unit 1139
