// demand/submission-view: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_CONFIRMED,
  AMENDMENT_IN_PROGRESS,
  AMENDMENT_REWORK_REQUIRED,
  AMENDMENT_SUBMITTED,
  AMENDMENT_SUPERSEDED,
  AMENDMENT_WAITING_OM,
  AMENDMENT_WAITING_USER_CONFIRM,
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  timelineFor
} from "../approval/audit-view.js";
import {
  canUserAAmend,
  omUserQuoteDecisionLabel,
  userQuoteAmountLabel,
  userQuoteAttachmentStatus
} from "./amendments.js";
import {
  totalQty
} from "./quantity.js";
import {
  requests
} from "./state.js";
import {
  userDemandOverviewSourceRows
} from "./worksheet-actions.js";
import {
  draftTimelineCell
} from "./worksheet-view.js";
import {
  buyerStatusFor
} from "../handoff/buyer.js";
import {
  estimateVarianceDisplayRows
} from "../materials/detail-view.js";
import {
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  externalStatusFor
} from "../om/external-progress.js";
import {
  isOmBuyScope
} from "../om/ownership.js";
import {
  pasDisplayStatus
} from "../om/pas-rules.js";
import {
  projectScopeLabel,
  rowMatchesCurrentRequesterProjectScope
} from "../projects/config.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  statusClass
} from "../shared/format.js";
import {
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM
} from "../workflow/status-constants.js";
import {
  workflowStatusForRow,
  workflowStatusStripHtml
} from "../workflow/status-view.js";
import {
  latestRequestActivityTime
} from "../workflow/timeline.js";

// @legacy-unit 1144 13238
export function renderUserQuoteActionCell(row) {
  if (!isOmBuyScope(row)) return "-";
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) {
    return `
      <div class="quote-confirm-card quote-confirm-compact">
        <span class="status-pill waiting-user-a-confirmation">Action Required</span>
        <div class="quote-confirm-meta">
          <strong>${userQuoteAmountLabel(row)}</strong>
          <span>Quote Date ${row.quoteDate || "-"}</span>
          <span>${userQuoteAttachmentStatus(row)}</span>
        </div>
      </div>
      <div class="table-actions quote-confirm-actions">
        <button class="mini return" data-action="openNeedConfirmation">Open Action Required</button>
      </div>`;
  }
  return `<span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>`;
}
// @end-legacy-unit 1144

// @legacy-unit 1145 13257
export function submissionCurrentStatus(row) {
  const modelLabels = workflowStatusForRow(row, "requester").statusLabels;
  if (modelLabels?.length) return modelLabels;
  const statuses = [
    row.amendmentStatus || "",
    row.status === "Submitted" ? "Submitted to Dept DRI" : row.status,
    pasDisplayStatus(row),
    row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM ? "Action Required" : "",
    row.userAQuoteDecisionStatus === OM_USER_CONFIRMED ? "Need Confirmed" : "",
    row.finalExportStatus || "",
    buyerStatusFor(row) !== "-" ? buyerStatusFor(row) : "",
    externalStatusFor(row) !== "-" ? externalStatusFor(row) : "",
  ].filter(Boolean);
  return [...new Set(statuses)].slice(0, 3);
}
// @end-legacy-unit 1145

// @legacy-unit 1146 13273
export function submissionActionStatusCell(row) {
  if (row.amendmentStatus === AMENDMENT_WAITING_OM) {
    return `
      <span class="status-pill ${statusClass(AMENDMENT_WAITING_OM)}">${AMENDMENT_WAITING_OM}</span>
      <div class="reason-text">${row.amendmentReason || "Revision requested."}</div>
      <button class="mini return" data-usera-amend="${row.id}">View Change Request</button>`;
  }
  if (row.amendmentStatus === AMENDMENT_IN_PROGRESS) {
    return `<span class="status-pill ${statusClass(AMENDMENT_IN_PROGRESS)}">${AMENDMENT_IN_PROGRESS}</span><div class="reason-text">OM Purchasing is revising this request.</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM) {
    return `
      <span class="status-pill ${statusClass(AMENDMENT_WAITING_USER_CONFIRM)}">${AMENDMENT_WAITING_USER_CONFIRM}</span>
      <div class="reason-text">Open Action Required to review OM's revised request.</div>
      <button class="mini return" data-action="openNeedConfirmation">Review</button>`;
  }
  if (row.amendmentStatus === AMENDMENT_REWORK_REQUIRED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_REWORK_REQUIRED)}">${AMENDMENT_REWORK_REQUIRED}</span><div class="reason-text">${row.amendmentReworkReason || "Waiting OM revision update."}</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_CONFIRMED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_CONFIRMED)}">${AMENDMENT_CONFIRMED}</span><div class="reason-text">Resubmitting to Dept DRI.</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_SUBMITTED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_SUBMITTED)}">${AMENDMENT_SUBMITTED}</span><div class="reason-text">Waiting Dept DRI review.</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_SUPERSEDED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_SUPERSEDED)}">${AMENDMENT_SUPERSEDED}</span><div class="reason-text">${row.supersededBy || "-"}</div>`;
  }
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) {
    return `
      <span class="status-pill waiting-user-a-confirmation">Action Required</span>
      <div class="reason-text">${userQuoteAmountLabel(row)} · ${userQuoteAttachmentStatus(row)}</div>
      <button class="mini return" data-action="openNeedConfirmation">Review</button>`;
  }
  if (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) {
    return `<span class="status-pill approved">Need Confirmed</span>`;
  }
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST) {
    return `<span class="status-pill rejected">Cancelled</span><div class="reason-text">${row.userAQuoteCancelReason || "-"}</div>`;
  }
  if (canUserAAmend(row)) {
    return `
      <span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>
      <div class="table-actions quote-confirm-actions">
        <button class="mini return" data-usera-amend="${row.id}">Request Change</button>
      </div>`;
  }
  return `<span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>`;
}
// @end-legacy-unit 1146

// @legacy-unit 1147 13323
export function submissionEstimateVarianceCell(row) {
  const rows = estimateVarianceDisplayRows(row);
  if (!rows.length) return `<span class="reason-text">Quote pending</span>`;
  const delta = row.estimateDeltaUsd;
  const deltaText = delta === null || delta === undefined ? "-" : `${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)} USD`;
  return `
    <span class="status-pill ${statusClass(row.estimateVarianceStatus || "Within Estimate Range")}">${row.estimateVarianceStatus || "Within Estimate Range"}</span>
    <div class="reason-text">${deltaText}</div>`;
}
// @end-legacy-unit 1147

// @legacy-unit 1148 13333
export function renderSubmissionRows() {
  const userRows = new Map(userDemandOverviewSourceRows().map((row) => [row.id, row]));
  requests
    .filter((row) => rowMatchesCurrentRequesterProjectScope(row) && row.status !== "Draft")
    .forEach((row) => userRows.set(row.id, row));
  const rows = [...userRows.values()]
    .sort((a, b) => {
      const latestA = latestRequestActivityTime(a);
      const latestB = latestRequestActivityTime(b);
      if (latestA !== latestB) return latestB - latestA;
      return b.id.localeCompare(a.id);
    });

  document.getElementById("submissionRows").innerHTML = rows.length
    ? rows.map((row) => {
      const status = workflowStatusForRow(row, "requester");
      return `
      <tr>
        <td>${row.id}</td>
        <td>${projectScopeLabel(row)}</td>
        <td>
          <div class="item-primary">${row.name}</div>
          <div class="reason-text">${userVisibleItemDetail(row) || partName(row) || "-"}</div>
        </td>
        <td>${totalQty(row)}</td>
        <td>
          <div class="submission-status-stack">${submissionCurrentStatus(row).map((label) => `<span class="status-pill ${statusClass(label)}">${label}</span>`).join("")}</div>
          ${workflowStatusStripHtml(status, { title: "Now", compact: true })}
          ${row.managerReason ? `<div class="reason-text">${row.managerReason}</div>` : ""}
        </td>
        <td>${submissionEstimateVarianceCell(row)}</td>
        <td class="cell-action">${row.status === "Draft" ? `<button class="mini approve" title="Edit demand rows" data-edit-demand="${row.id}">Edit</button>` : submissionActionStatusCell(row)}</td>
        <td class="cell-timeline">${row.status === "Draft" ? draftTimelineCell(row) : `<div class="timeline table-timeline">${timelineFor(row)}</div>`}</td>
        <td class="cell-action">${itemDetailButton("request", row.id)}</td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="9" class="empty-cell">No draft or submitted demand for ${currentProject}${currentProjectCode ? ` / ${currentProjectCode}` : ""} yet.</td></tr>`;
}
// @end-legacy-unit 1148
