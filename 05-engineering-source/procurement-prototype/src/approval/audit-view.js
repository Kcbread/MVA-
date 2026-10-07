// approval/audit-view: authoritative source; see docs/module-map.md.
import {
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  clampQty,
  demandTypeFor,
  isLongFormStationBreakdown,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  handoffHistory
} from "../handoff/state.js";
import {
  managerCarryoverRowsForScope,
  managerCarryoverStatusClass,
  managerCarryoverStatusLabel
} from "../inventory/cost-evidence.js";
import {
  externalProgressEventsFor
} from "../om/external-progress.js";
import {
  omHistory
} from "../om/state.js";
import {
  DEMAND_UNIT_FALLBACK,
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
import {
  fullTimestamp
} from "../shared/dates.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlText
} from "../shared/html.js";
import {
  timelineMilestones,
  timelineStepHtml
} from "../workflow/timeline.js";

// @legacy-unit 1149 13372
export function timelineFor(row) {
  return timelineMilestones(row).map(timelineStepHtml).join("");
}
// @end-legacy-unit 1149

// @legacy-unit 1150 13376
export function managerAuditTimelineEvents(row) {
  const sourceDateEvents = [
    row.requiredDeliveryDate ? {
      action: "Required Date",
      actor: "Requester Timeline",
      note: "Demand required date from source worksheet.",
      timestamp: row.requiredDeliveryDate,
      source: "G Project",
    } : null,
    row.requestDeadline ? {
      action: "Request Deadline",
      actor: "Requester Timeline",
      note: "Request deadline from source worksheet.",
      timestamp: row.requestDeadline,
      source: "G Project",
    } : null,
    (row.etaPlan || row.eta) ? {
      action: "ETA Plan",
      actor: "Procurement Progress",
      note: "Estimated arrival date from source worksheet.",
      timestamp: row.etaPlan || row.eta,
      source: "G Project",
    } : null,
    (row.dtaActual || row.actualEta) ? {
      action: "DTA / Actual Arrival",
      actor: "Procurement Progress",
      note: "Actual arrival date from source worksheet.",
      timestamp: row.dtaActual || row.actualEta,
      source: "G Project",
    } : null,
  ].filter(Boolean);

  const directEvents = [
    row.submittedAt ? {
      action: "Submitted to Dept DRI",
      actor: row.submittedBy || row.requesterName || "Requester",
      note: `${row.project} request submitted for Dept DRI review.`,
      timestamp: row.submittedAt,
      source: "Request",
    } : null,
    row.decidedAt ? {
      action: row.status === "Rejected" ? "Rejected to DRI" : "Approved by Dept DRI",
      actor: row.decidedBy || row.deptDriSubmissionApprovedBy || "Dept DRI",
      note: row.managerReason || row.rejectReason || "Decision recorded.",
      timestamp: row.decidedAt,
      source: "Manager",
    } : null,
    row.sentToOmAt ? {
      action: "Sent to OM Purchasing",
      actor: row.sentToOmBy || "System",
      note: "Approved OM buy demand routed to OM Purchasing.",
      timestamp: row.sentToOmAt,
      source: "Handoff",
    } : null,
    row.userAQuoteDecisionAt ? {
      action: row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST ? "Requester cancelled request" : "Requester confirmed need",
      actor: row.userAQuoteDecisionBy || "Requester",
      note: row.userAQuoteCancelReason || "Requester quote decision recorded.",
      timestamp: row.userAQuoteDecisionAt,
      source: "Requester",
    } : null,
    row.finalExportedAt ? {
      action: `OM Handoff to ${row.finalExportTarget || "CFA/ECS"}`,
      actor: row.finalExportedBy || "OM Purchasing",
      note: row.finalExportStatus || "OM handoff completed.",
      timestamp: row.finalExportedAt,
      source: "OM",
    } : null,
    row.buyerReceivedAt ? {
      action: "Buyer Accepted Handoff",
      actor: row.buyerReceivedBy || "Buyer",
      note: row.buyerStatus || "Buyer PR / PO follow-up started.",
      timestamp: row.buyerReceivedAt,
      source: "Buyer",
    } : null,
  ].filter(Boolean);

  const handoffEvents = handoffHistory
    .filter((event) => event.requestId === row.id)
    .map((event) => ({
      action: event.action,
      actor: event.actor || "System",
      note: event.note || [event.route, event.exportTarget].filter(Boolean).join(" / "),
      timestamp: event.timestamp,
      source: "Handoff",
    }));

  const omEvents = omHistory
    .filter((event) => event.requestId === row.id)
    .map((event) => ({
      action: event.action,
      actor: event.actor || "OM Purchasing",
      note: event.note || "",
      timestamp: event.timestamp,
      source: "OM",
    }));

  const externalEvents = externalProgressEventsFor(row)
    .map((event) => ({
      action: event.status || event.step || "External progress",
      actor: event.createdBy || event.owner || "Buyer",
      note: event.reason || event.pastedExternalResult || event.evidenceFileName || event.externalRequestNo || "",
      timestamp: event.createdAt,
      source: event.owner || event.externalSystem || "External",
    }));

  return [...sourceDateEvents, ...directEvents, ...handoffEvents, ...omEvents, ...externalEvents]
    .filter((event) => event.timestamp && !Number.isNaN(new Date(event.timestamp).getTime()))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}
// @end-legacy-unit 1150

// @legacy-unit 1151 13487
export function managerAuditTimelineHtml(row) {
  const events = managerAuditTimelineEvents(row);
  if (!events.length) return `<div class="empty-state">No timeline event has been recorded yet.</div>`;
  return `
    <div class="manager-audit-timeline">
      ${events.map((event) => `
        <article class="om-timeline-event audit-timeline-event">
          <div class="om-timeline-head">
            <span class="status-pill ${statusClass(event.action)}">${event.action}</span>
            <strong>${event.actor}</strong>
          </div>
          <p>${event.note || "-"}</p>
          <small>${event.source} · ${fullTimestamp(event.timestamp)}</small>
        </article>
      `).join("")}
    </div>`;
}
// @end-legacy-unit 1151

// @legacy-unit 1152 13505
export function managerCarryoverEvidenceHtml(row = {}) {
  const rows = managerCarryoverRowsForScope({
    project: row.project || "",
    item: row.name || row.item || "",
  }, true);
  if (!rows.length) return "";
  return `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Carryover Evidence</h4>
          <p class="panel-subcopy">Contextual trace only. Demand Analysis stays focused on baseline demand and station tables.</p>
        </div>
      </div>
      <div class="table-wrap compact-wrap">
        <table class="data-table workflow-table carryover-ledger-table">
          <thead>
            <tr>
              <th>Flow</th>
              <th>Phase / Unit</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => `
              <tr>
                <td class="cell-identity">${htmlText(item.sourceLine || "-")} → ${htmlText(item.targetLine || "-")}</td>
                <td>${htmlText(STAGE_LABELS[item.phase] || item.phase || "-")}<div class="reason-text">${htmlText(item.stationOrUnit || "-")}</div></td>
                <td class="cell-number">${clampQty(item.carryoverQty)}</td>
                <td><span class="${managerCarryoverStatusClass(item.reviewStatus === "Pending DRI" || item.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : item.status)}">${managerCarryoverStatusLabel(item.reviewStatus === "Pending DRI" || item.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : item.status)}</span></td>
                <td class="cell-audit-reason"><div class="audit-reason-text">${htmlText(item.reason || "-")}</div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}
// @end-legacy-unit 1152

// @legacy-unit 1153 13546
export function stationBreakdownDetailHtml(row) {
  const rows = stationBreakdownRowsForDetail(row);
  if (!rows.length) return `<div class="empty-state">No station breakdown has been entered for this request.</div>`;
  return `
    <div class="table-wrap compact-wrap">
      <table class="data-table manager-progress-detail-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Phase</th>
            <th>Station</th>
            <th>需求單位</th>
            <th>Qty</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          ${rows.flatMap((item) => {
            if (isLongFormStationBreakdown(item)) return [item];
            return STAGES
              .filter((stage) => clampQty(item[stage]) > 0)
              .map((stage) => ({ ...item, phase: stage, qty: clampQty(item[stage]) }));
          }).map((item) => `
            <tr>
              <td>${demandTypeFor(item)}</td>
              <td>${STAGE_LABELS[stationBreakdownPhaseKey(item)] || "-"}</td>
              <td>${item.station || "-"}</td>
              <td>${item.demandUnit || DEMAND_UNIT_FALLBACK}</td>
              <td>${stationBreakdownRowTotal(item)}</td>
              <td>${item.remark || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 1153
