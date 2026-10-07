// om/quotation-db: authoritative source; see docs/module-map.md.
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  omItemCell
} from "../materials/detail-view.js";
import {
  itemDetailButton
} from "../materials/display.js";
import {
  omAssigneeName,
  omAssignmentForRow
} from "./assignment.js";
import {
  omQuoteDbCandidate,
  omQuoteDbCandidateStatus
} from "./pas-view.js";
import {
  omCurrentStageForRow,
  omPendingOwnerForRow
} from "./progress-data.js";
import {
  omAllRows
} from "./queue.js";
import {
  omQuoteValidUntil,
  omQuoteValidity
} from "./quote-validity.js";
import {
  QUOTE_EXPIRING_SOON_DAYS
} from "../projects/config.js";
import {
  daysUntil,
  statusClass
} from "../shared/format.js";
import {
  OM_USER_CONFIRMED
} from "../workflow/status-constants.js";

// @legacy-unit 1676 20795
export function omQuoteExpiryRows() {
  return omAllRows().filter((row) => {
    const hasQuotePath = row.pasDemandNo || row.pasMaterialNo || row.quoteDate || row.quoteValidUntil || row.quotationPdf || row.quotationExcel || row.vendor;
    if (!hasQuotePath) return false;
    return true;
  }).sort((left, right) => {
    const leftDate = omQuoteValidUntil(left) || "9999-12-31";
    const rightDate = omQuoteValidUntil(right) || "9999-12-31";
    return leftDate.localeCompare(rightDate) || `${left.project} ${left.name}`.localeCompare(`${right.project} ${right.name}`);
  });
}
// @end-legacy-unit 1676

// @legacy-unit 1677 20807
export function omQuoteExpiryStatusLabel(row) {
  if (!omQuoteValidUntil(row)) return "Missing Valid Until";
  const status = omQuoteValidity(row);
  if (status === "Quote Expired") return "Expired / Requote Required";
  if (status === "Quote Expiring Soon") return "Expiring Soon";
  if (status === "Quote Valid") return "Valid";
  return status === "Quote Pending" ? "Missing Valid Until" : status;
}
// @end-legacy-unit 1677

// @legacy-unit 1678 20816
export function omQuoteExpiryDaysLeft(row) {
  const validUntil = omQuoteValidUntil(row);
  if (!validUntil) return null;
  return daysUntil(validUntil);
}
// @end-legacy-unit 1678

// @legacy-unit 1679 20822
export function omQuoteExpiryFilterState() {
  return {
    project: document.getElementById("omQuoteExpiryProjectFilter")?.value || "",
    status: document.getElementById("omQuoteExpiryStatusFilter")?.value || "",
    assignee: document.getElementById("omQuoteExpiryAssigneeFilter")?.value || "",
  };
}
// @end-legacy-unit 1679

// @legacy-unit 1680 20830
export function omQuoteExpiryMatchesFilters(row, filters) {
  if (filters.project && row.project !== filters.project) return false;
  const assignment = omAssignmentForRow(row);
  if (filters.assignee === "unassigned" && assignment.assignedToUserId) return false;
  if (filters.assignee && filters.assignee !== "unassigned" && assignment.assignedToUserId !== filters.assignee) return false;
  if (filters.status) {
    const label = omQuoteExpiryStatusLabel(row);
    if (filters.status === "expiring" && label !== "Expiring Soon") return false;
    if (filters.status === "expired" && label !== "Expired / Requote Required") return false;
    if (filters.status === "missing" && label !== "Missing Valid Until") return false;
    if (filters.status === "valid" && label !== "Valid") return false;
  }
  return true;
}
// @end-legacy-unit 1680

// @legacy-unit 1681 20845
export function omQuotationDbAction(row) {
  const status = omQuoteExpiryStatusLabel(row);
  const candidate = omQuoteDbCandidate(row);
  const candidateStatus = candidate ? omQuoteDbCandidateStatus(row, candidate) : null;
  if (!omQuoteValidUntil(row)) return "Check Quote Result before reuse.";
  if (status === "Expired / Requote Required") return "Requote required before reuse.";
  if (status === "Expiring Soon") return "Confirm with PAS / supplier before quote expires.";
  if (candidate && candidateStatus?.reusable) return "Reusable after Central IT confirmation.";
  if (candidate && !candidateStatus?.expired) return "Confirm with Central IT before reuse.";
  return "Reusable quote record available for OM review.";
}
// @end-legacy-unit 1681

// @legacy-unit 1682 20857
export function omQuoteExpiryAction(row) {
  return omQuotationDbAction(row);
}
// @end-legacy-unit 1682

// @legacy-unit 1683 20861
export function renderOmQuoteExpiry() {
  const target = document.getElementById("omQuoteExpiryRows");
  const filters = omQuoteExpiryFilterState();
  const rows = omQuoteExpiryRows().filter((row) => omQuoteExpiryMatchesFilters(row, filters));
  const rowCount = document.getElementById("omQuoteExpiryCount");
  if (rowCount) rowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  const hint = document.getElementById("omQuoteExpiryHint");
  if (hint) hint.textContent = `Reuse valid quote records after Central IT confirmation. Expiring Soon means <= ${QUOTE_EXPIRING_SOON_DAYS} days; expired records require requote before reuse.`;
  const summary = document.getElementById("omQuoteExpirySummary");
  if (summary) {
    const allRows = omQuoteExpiryRows();
    summary.innerHTML = summaryCardsHtml([
      { label: "Waiting PAS Reply", value: allRows.filter((row) => omPendingOwnerForRow(row) === "PAS / Bidding").length, helper: "Follow bidding return", variant: "hero" },
      ["Missing Valid Until", allRows.filter((row) => omQuoteExpiryStatusLabel(row) === "Missing Valid Until").length],
      ["Expiring Soon", allRows.filter((row) => omQuoteExpiryStatusLabel(row) === "Expiring Soon").length],
      ["Expired / Requote", allRows.filter((row) => omQuoteExpiryStatusLabel(row) === "Expired / Requote Required").length],
      ["Waiting Requester", allRows.filter((row) => omCurrentStageForRow(row) === "Waiting Requester").length],
      ["Ready for Handoff", allRows.filter((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED && !row.finalExportedAt).length],
    ]);
  }
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const days = omQuoteExpiryDaysLeft(row);
      const status = omQuoteExpiryStatusLabel(row);
      return `
        <tr>
          <td>${row.project || "-"}</td>
          <td>${omItemCell(row, { stageLabel: "Quotation DB" })}</td>
          <td>${row.pasDemandNo || "-"}</td>
          <td>${row.pasMaterialNo || "-"}</td>
          <td>${row.quoteDate || "-"}</td>
          <td>${omQuoteValidUntil(row) || "-"}</td>
          <td class="cell-number">${days === null ? "-" : `${days}d`}</td>
          <td><span class="status-pill ${statusClass(status)}">${status}</span></td>
          <td>${omAssigneeName(row) || "Unassigned"}</td>
          <td><div class="reason-text">${omQuoteExpiryAction(row)}</div></td>
          <td class="cell-action">${itemDetailButton("request", row.id)}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="11" class="empty-cell">No quotation DB rows match the current filters.</td></tr>`;
}
// @end-legacy-unit 1683
