// workflow/timeline: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_IN_PROGRESS,
  AMENDMENT_REWORK_REQUIRED,
  AMENDMENT_SUBMITTED,
  AMENDMENT_SUPERSEDED,
  AMENDMENT_WAITING_OM,
  AMENDMENT_WAITING_USER_CONFIRM,
  BUYER_COMPLETED,
  BUYER_PO_ISSUED,
  EXT_COMPLETED,
  EXT_PO_ISSUED,
  OM_EXPORTED_CFA,
  OM_EXPORTED_ECS,
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  handoffHistory
} from "../handoff/state.js";
import {
  isOmUserConfirmed,
  isOmWaitingUserConfirm
} from "../om/export-rules.js";
import {
  externalProgressEventsFor,
  externalStatusFor,
  latestExternalProgressEvent
} from "../om/external-progress.js";
import {
  isPasRequired
} from "../om/pas-rules.js";
import {
  omReadyForBuyer
} from "../om/quote-rules.js";
import {
  omHistory
} from "../om/state.js";
import {
  compactTimestamp,
  fullTimestamp,
  historyTimestamp
} from "../shared/dates.js";
import {
  OM_READY_FOR_CFA,
  OM_READY_FOR_ECS,
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM
} from "./status-constants.js";
import {
  workflowStatusForRow
} from "./status-view.js";

// @legacy-unit 1140 13167
export function requesterConfirmationSentAt(row) {
  return historyTimestamp(row, "Sent to Requester for confirmation")
    || historyTimestamp(row, "Sent to User A for confirmation");
}
// @end-legacy-unit 1140

// @legacy-unit 1141 13172
export function timelineMilestones(row) {
  const modelMilestones = workflowStatusForRow(row, "requester").timelineMilestones;
  if (modelMilestones?.length) return modelMilestones;
  const poDoneEvent = latestExternalProgressEvent(row);
  const pasDemandNoDone = Boolean(row.pasDemandNo);
  const quoteReadyDone = omReadyForBuyer(row)
    || isOmWaitingUserConfirm(row)
    || isOmUserConfirmed(row)
    || ["userConfirm", "finalExport"].includes(row.omStage)
    || [OM_READY_FOR_CFA, OM_READY_FOR_ECS, OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus);
  const amendmentStep = row.amendmentStatus ? [{
    key: "amendment",
    label: row.amendmentOf ? "Amendment" : "Amend Req",
    done: Boolean(row.amendmentStatus),
    pending: [AMENDMENT_WAITING_OM, AMENDMENT_WAITING_USER_CONFIRM, AMENDMENT_IN_PROGRESS, AMENDMENT_REWORK_REQUIRED, AMENDMENT_SUBMITTED].includes(row.amendmentStatus),
    blocked: row.amendmentStatus === AMENDMENT_SUPERSEDED,
    at: row.amendmentApprovedAt || row.amendmentSubmittedAt || row.amendmentUserConfirmedAt || row.amendedAt || row.amendmentRequestedAt,
  }] : [];
  return [
    ...amendmentStep,
    { key: "submitted", label: "Submitted", done: ["Submitted", "Approved", "Rejected", "Reported", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status), at: row.submittedAt },
    { key: "approved", label: row.status === "Rejected" ? "Rejected" : "Approved", done: ["Approved", "Reported", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status), blocked: row.status === "Rejected", at: row.decidedAt },
    { key: "pasDemandNo", label: "PAS Demand No", done: pasDemandNoDone, pending: isPasRequired(row) && ["Approved", "Reported"].includes(row.status) && !pasDemandNoDone, at: row.pasDemandNoUpdatedAt || row.pasResultReceivedAt || historyTimestamp(row, "PAS Demand No recorded") },
    { key: "quoteReady", label: "Quote Ready", done: quoteReadyDone, pending: row.omStage === "pasResult" && !quoteReadyDone, at: row.quoteReadyAt || historyTimestamp(row, "Saved quote info") || requesterConfirmationSentAt(row) },
    { key: "userConfirm", label: row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST ? "Cancelled" : "Requester Confirm", done: [OM_WAITING_USER_CONFIRM, OM_USER_CONFIRMED, USER_CANCELLED_REQUEST].includes(row.userAQuoteDecisionStatus), pending: row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM, blocked: row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST, at: row.userAQuoteDecisionAt || requesterConfirmationSentAt(row) },
    { key: "finalExport", label: "OM Handoff", done: [OM_READY_FOR_CFA, OM_READY_FOR_ECS, OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus), pending: [OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus), at: row.finalExportedAt || historyTimestamp(row, `Marked for ${row.finalExportTarget}`) },
    { key: "buyer", label: "Buyer Accepted Handoff", done: Boolean(row.buyerStatus || row.buyerReceivedAt || [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus)), at: row.buyerReceivedAt || row.finalExportedAt },
    { key: "poDone", label: "PO Done", done: [BUYER_PO_ISSUED, BUYER_COMPLETED].includes(row.buyerStatus) || [EXT_PO_ISSUED, EXT_COMPLETED].includes(externalStatusFor(row)), at: poDoneEvent?.createdAt },
  ];
}
// @end-legacy-unit 1141

// @legacy-unit 1142 13203
export function timelineStepHtml(item) {
  const stateClass = item.blocked ? "blocked" : item.pending ? "current" : item.done ? "done" : "";
  const timeLabel = item.at ? compactTimestamp(item.at) : item.done ? "Done" : "Pending";
  const title = item.at ? fullTimestamp(item.at) : timeLabel;
  return `
    <span class="timeline-step ${stateClass}" title="${title}">
      <strong>${item.label}</strong>
      <small>${timeLabel}</small>
    </span>`;
}
// @end-legacy-unit 1142

// @legacy-unit 1143 13214
export function latestRequestActivityTime(row) {
  const directDates = [
    row.submittedAt,
    row.decidedAt,
    row.sentToOmAt,
    row.userAQuoteDecisionAt,
    row.finalExportedAt,
    row.buyerReceivedAt,
    row.amendmentRequestedAt,
    row.amendedAt,
    row.amendmentSubmittedAt,
    row.amendmentApprovedAt,
  ];
  const historyDates = [
    ...handoffHistory.filter((event) => event.requestId === row.id).map((event) => event.timestamp),
    ...omHistory.filter((event) => event.requestId === row.id).map((event) => event.timestamp),
    ...externalProgressEventsFor(row).map((event) => event.createdAt),
  ];
  return [...directDates, ...historyDates]
    .map((value) => new Date(value || "").getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0] || 0;
}
// @end-legacy-unit 1143
