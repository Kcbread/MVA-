// om/history: authoritative source; see docs/module-map.md.
import {
  omHistoryProjectFilterValue
} from "./filters.js";
import {
  advanceOmHistorySequenceBinding,
  omHistory,
  omHistorySequence,
  replaceOmHistoryBinding
} from "./state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";

// @legacy-unit 1604 20078
export function addOmHistory(row, action, note = "") {
  const actor = roleProfiles[currentRole]?.name || "System";
  replaceOmHistoryBinding([{
    id: `OMH-${String(advanceOmHistorySequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    action,
    actor,
    note,
    timestamp: new Date().toISOString(),
  }, ...omHistory]);
}
// @end-legacy-unit 1604

// @legacy-unit 1605 20092
export function omTimelineForRequest(row) {
  return omHistory
    .filter((event) => event.requestId === row.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
// @end-legacy-unit 1605

// @legacy-unit 1606 20098
export function requesterOmHistoryNote(event) {
  const actionText = normalize(event.action);
  if (actionText.includes("quote") || actionText.includes("pas result") || actionText.includes("pdf")) {
    return "Quote information was updated by OM Purchasing.";
  }
  if (actionText.includes("user a")) return event.note || "-";
  if (actionText.includes("export")) return "OM package progress was updated.";
  return String(event.note || "-")
    .replace(/\bvendor\b/gi, "quote source")
    .replace(/\bsupplier\b/gi, "quote source");
}
// @end-legacy-unit 1606

// @legacy-unit 1607 20110
export function omHistoryNoteForDisplay(event) {
  return currentRole === "requester" ? requesterOmHistoryNote(event) : event.note || "-";
}
// @end-legacy-unit 1607

// @legacy-unit 1608 20114
export function omPackageHistoryHtml(row, { compact = false } = {}) {
  const events = omTimelineForRequest(row);
  if (!events.length) return compact ? "-" : `<div class="empty-state">No OM package history yet.</div>`;
  if (compact) {
    const latest = events[events.length - 1];
    return `${latest.action}<div class="reason-text">${omHistoryNoteForDisplay(latest)}</div>`;
  }
  return `
    <div class="detail-subsection om-timeline">
      <h4>OM Package Timeline</h4>
      ${events.map((event) => `
        <article class="om-timeline-event">
          <div class="om-timeline-head">
            <span class="status-pill ${statusClass(event.action)}">${event.action}</span>
            <strong>${event.actor}</strong>
          </div>
          <p>${omHistoryNoteForDisplay(event)}</p>
          <small>${new Date(event.timestamp).toLocaleString("en-US")}</small>
        </article>`).join("")}
    </div>`;
}
// @end-legacy-unit 1608

// @legacy-unit 1714 21507
export function renderOmHistory() {
  const target = document.getElementById("omHistoryRows");
  if (!target) return;
  const projectFilter = omHistoryProjectFilterValue();
  const rows = omHistory.filter((row) => !projectFilter || row.project === projectFilter);
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.requestId}</td>
        <td>${row.project}</td>
        <td>${row.item}</td>
        <td>${row.action}</td>
        <td>${row.actor}</td>
        <td>${row.note || "-"}</td>
        <td>${new Date(row.timestamp).toLocaleString("en-US")}</td>
      </tr>`).join("")
    : `<tr><td colspan="7" class="empty-cell">No OM Purchasing actions recorded for this project yet.</td></tr>`;
}
// @end-legacy-unit 1714
