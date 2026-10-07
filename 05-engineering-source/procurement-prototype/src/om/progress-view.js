// om/progress-view: authoritative source; see docs/module-map.md.
import {
  formatMoneyFromUsd
} from "../cost/currency.js";
import {
  renderOmExchangeRatePanel
} from "../cost/exchange-rate-view.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  needDateForRow
} from "../demand/request-fields.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  isOmWaitingUserConfirm,
  omFinalExportStatusLabel
} from "./export-rules.js";
import {
  omLeaderExceptionRows,
  omLeaderNextAction,
  omLeaderProgressOverviewRows,
  omLeaderProjectStageDateRows,
  omLeaderRiskLabel,
  omLeaderSnapshotMetrics,
  omLeaderTeamWorkloadRows
} from "./leader-data.js";
import {
  OM_BIDDING_RESULT_SLA_DAYS,
  OM_INTERNAL_SLA_DAYS,
  OM_PAS_DEMAND_SLA_DAYS,
  omCurrentStageForGroup,
  omDaysInStage,
  omNextActionForGroup,
  omPendingOwnerForGroup,
  omQuoteStatusForGroup,
  omRequestIdCell,
  omSubmissionFilterState,
  omSubmissionRows,
  omSubmissionScopeLabel,
  syncOmSubmissionFilters
} from "./progress-data.js";
import {
  isOmQuoteReady
} from "./quote-rules.js";
import {
  omLeaderConsoleSyncedAt
} from "./state.js";
import {
  managerProgressPendingReason,
  managerProgressQty,
  pendingReasonCell
} from "../progress/demand.js";
import {
  renderOmProjectStageCalendar
} from "../projects/calendar-view.js";
import {
  QUOTE_EXPIRING_SOON_DAYS
} from "../projects/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  detailSummaryGridHtml
} from "../shared/detail-view.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  currentView
} from "../shell/state.js";
import {
  OM_USER_CONFIRMED
} from "../workflow/status-constants.js";

// @legacy-unit 1368 16567
export function omPendingFocusReason(group) {
  const owner = omPendingOwnerForGroup(group);
  const stage = omCurrentStageForGroup(group);
  const quoteStatus = omQuoteStatusForGroup(group);
  if (omIsOverSla(group)) return `Over SLA in ${stage}`;
  if (owner === "PAS / Bidding") return "Waiting PAS bidding result";
  if (owner === "Requester") return "Waiting Requester confirm / cancel";
  if (stage === "OM Handoff") return "Confirmed by Requester; OM handoff pending";
  if (quoteStatus === "Missing Validity") return "Quote validity missing in Quote Result";
  if (["Expiring Soon", "Expired / Requote Required"].includes(quoteStatus)) return quoteStatus;
  if (stage === "PAS Demand No") return "PAS Demand No not recorded";
  return omNextActionForGroup(group);
}
// @end-legacy-unit 1368

// @legacy-unit 1369 16581
export function omPendingFocusScore(group) {
  const days = omDaysInStage(group);
  const owner = omPendingOwnerForGroup(group);
  const quoteStatus = omQuoteStatusForGroup(group);
  let score = 0;
  if (omIsOverSla(group)) score += 100;
  if (quoteStatus === "Expired / Requote Required") score += 80;
  if (quoteStatus === "Expiring Soon") score += 60;
  if (owner === "PAS / Bidding") score += 40;
  if (owner === "Requester") score += 30;
  if (omCurrentStageForGroup(group) === "OM Handoff") score += 20;
  return score + (days || 0);
}
// @end-legacy-unit 1369

// @legacy-unit 1370 16595
export function renderOmSubmissionTriage(rows = []) {
  const target = document.getElementById("omSubmissionTriage");
  if (!target) return;
  const missingPasNo = rows.filter((group) => group.rows.some((row) => !row.pasDemandNo && omPendingOwnerForGroup(group) === "OM Purchasing"));
  const waitingPasReply = rows.filter((group) => omPendingOwnerForGroup(group) === "PAS / Bidding");
  const quoteMissing = rows.filter((group) => group.rows.some((row) => row.pasDemandNo && omQuoteStatusForGroup(group) === "Missing Validity"));
  const expiryRisk = rows.filter((group) => ["Expiring Soon", "Expired / Requote Required"].includes(omQuoteStatusForGroup(group)));
  const exportReady = rows.filter((group) => group.rows.some((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED && !row.finalExportedAt));
  const overSla = rows.filter((group) => {
    const days = omDaysInStage(group);
    return days !== null && days > OM_INTERNAL_SLA_DAYS;
  });
  const triageItems = [
    { label: "Over SLA", value: overSla.length, helper: `>${OM_INTERNAL_SLA_DAYS}d in current stage`, tone: overSla.length ? "warning" : "ok" },
    { label: "Missing PAS Demand No", value: missingPasNo.length, helper: "Start PAS tracking", tone: missingPasNo.length ? "warning" : "ok" },
    { label: "Waiting PAS Reply", value: waitingPasReply.length, helper: "Follow bidding result", tone: waitingPasReply.length ? "pending" : "ok" },
    { label: "Quote Validity Missing", value: quoteMissing.length, helper: "Fill Valid Until", tone: quoteMissing.length ? "warning" : "ok" },
    { label: "Expiry Risk", value: expiryRisk.length, helper: `Expired or <= ${QUOTE_EXPIRING_SOON_DAYS}d`, tone: expiryRisk.length ? "warning" : "ok" },
    { label: "Ready for Buyer Handoff", value: exportReady.length, helper: "Confirmed by Requester", tone: exportReady.length ? "info" : "ok" },
  ];
  target.innerHTML = `
    <div class="triage-title">
      <strong>Pending Request Focus</strong>
      <span>Prioritize request-level blockers here. Edit quote data only in Quote Result.</span>
    </div>
    <div class="triage-grid">
      ${triageItems.map((item) => `
        <div class="triage-card triage-${item.tone}">
          <span>${htmlText(item.label)}</span>
          <strong>${item.value}</strong>
          <small>${htmlText(item.helper)}</small>
        </div>`).join("")}
    </div>`;
}
// @end-legacy-unit 1370

// @legacy-unit 1371 16630
export function omProgressCategoryCell(group) {
  return `
    <div class="om-category-cell">
      <strong>${htmlText(group.category.level2)}</strong>
      <span>${htmlText(group.category.level3)}</span>
      ${group.category.status !== "Classified" ? `<small>${htmlText(group.category.status)}</small>` : ""}
    </div>`;
}
// @end-legacy-unit 1371

// @legacy-unit 1372 16639
export function omProgressItemCell(group) {
  return `
    <div class="item-primary">${htmlText(group.item)}</div>
    <div class="reason-text">${htmlText(group.spec || "No spec")}</div>
    <div class="reason-text">${group.rows.length} request row${group.rows.length === 1 ? "" : "s"}</div>`;
}
// @end-legacy-unit 1372

// @legacy-unit 1373 16646
export function omProgressProjectCell(group) {
  return `
    <strong>${htmlText(group.project)}</strong>
    <div class="reason-text">${htmlText(group.phase || group.yearProject || "-")}</div>`;
}
// @end-legacy-unit 1373

// @legacy-unit 1374 16652
export function omEstimatedPriceCell(group) {
  const unit = group.estimatedUnitPriceUsd || 0;
  const amount = group.estimatedAmountUsd || 0;
  return `
    <div class="om-estimate-cell">
      <strong>${unit ? formatMoneyFromUsd(unit) : "Price pending"}</strong>
      <span>${amount ? formatMoneyFromUsd(amount) : "-"}</span>
    </div>`;
}
// @end-legacy-unit 1374

// @legacy-unit 1375 16662
export function omSlaStatusCell(group) {
  const sla = group.sla || {};
  return `
    <div class="om-sla-cell">
      <span class="status-pill ${sla.isOverdue ? "warning" : statusClass(sla.status)}">${htmlText(sla.status || "-")}</span>
      <small>${sla.slaDays ? `${sla.daysInStage || 0}d / SLA ${sla.slaDays}d` : `${sla.daysInStage || 0}d`}</small>
    </div>`;
}
// @end-legacy-unit 1375

// @legacy-unit 1376 16671
export function omAssigneeProgressCell(group) {
  const names = [...(group.assigneeNames || new Set())].filter(Boolean);
  const label = names.length > 2 ? `${names.slice(0, 2).join(" / ")} +${names.length - 2}` : names.join(" / ");
  return `<span class="status-pill ${label && label !== "Unassigned" ? "info" : "warning"}">${htmlText(label || "Unassigned")}</span>`;
}
// @end-legacy-unit 1376

// @legacy-unit 1377 16677
export function omBuyerHandoffCell(group) {
  const statuses = [...(group.buyerStatuses || new Set())].filter(Boolean);
  const label = statuses.includes("PR Done") ? "PR Done" : statuses.includes("PR Pending") ? "PR Pending" : "Buyer owns PR-PO";
  return `<span class="status-pill ${statusClass(label)}">${htmlText(label)}</span>`;
}
// @end-legacy-unit 1377

// @legacy-unit 1378 16683
export function omLeaderConsoleLastSyncedLabel() {
  return omLeaderConsoleSyncedAt ? `Synced ${compactDateTime(omLeaderConsoleSyncedAt)}` : "API sync pending";
}
// @end-legacy-unit 1378

// @legacy-unit 1379 16687
export function omLeaderTrackingSummaryCell(group) {
  const rows = group.rows || [];
  const prValues = [...new Set(rows.map((row) => row.prNo).filter(Boolean))];
  const poValues = [...new Set(rows.map((row) => row.buyerPoNo || row.poNo).filter(Boolean))];
  const prStatuses = [...new Set(rows.map((row) => row.prStatus).filter(Boolean))];
  const poStatuses = [...new Set(rows.map((row) => row.poStatus).filter(Boolean))];
  const prLabel = prValues.length ? prValues.slice(0, 2).join(" / ") : prStatuses[0] || "PR Pending";
  const poLabel = poValues.length ? poValues.slice(0, 2).join(" / ") : poStatuses[0] || "PO Pending";
  return `
    <div class="om-leader-tracking-stack">
      <span class="status-pill ${statusClass(prLabel)}">${htmlText(prLabel)}</span>
      <span class="status-pill ${statusClass(poLabel)}">${htmlText(poLabel)}</span>
    </div>`;
}
// @end-legacy-unit 1379

// @legacy-unit 1380 16702
export function omLeaderDeliverySummaryCell(group) {
  const rows = group.rows || [];
  const etaValues = [...new Set(rows.map((row) => row.etaPlanDate || row.etaPlan).filter(Boolean))];
  const dtaValues = [...new Set(rows.map((row) => row.dtaActualDate || row.dtaActual).filter(Boolean))];
  const totalLt = rows.map((row) => row.totalLeadTimeDays).filter((value) => value !== "" && value !== undefined && value !== null);
  return `
    <div class="om-leader-tracking-stack">
      <span>ETA ${htmlText(etaValues[0] || "-")}</span>
      <span>DTA ${htmlText(dtaValues[0] || "-")}</span>
      <span>LT ${htmlText(totalLt[0] === undefined ? "-" : `${totalLt[0]}d`)}</span>
    </div>`;
}
// @end-legacy-unit 1380

// @legacy-unit 1381 16715
export function omProgressRemarkCell(group) {
  const primary = group.sla?.remark || [...(group.remarks || new Set())][0] || "-";
  const pending = [...(group.pendingReasons || new Set())].filter(Boolean).slice(0, 2).join(" / ");
  return `<div class="reason-text om-progress-remark">${htmlText(primary)}</div>${pending ? `<div class="reason-text">${htmlText(pending)}</div>` : ""}`;
}
// @end-legacy-unit 1381

// @legacy-unit 1393 16849
export function renderOmLeaderStatusSummary(rows = []) {
  const overviewRows = omLeaderProgressOverviewRows(rows);
  const workloadRows = omLeaderTeamWorkloadRows(rows);
  const stageDateRows = omLeaderProjectStageDateRows(rows);
  return `
    <div class="om-leader-status-metrics">
      ${summaryCardsHtml(omLeaderSnapshotMetrics(rows))}
    </div>
    <div class="om-leader-signal-strip" aria-label="OM Leader compact signals">
      <section class="om-leader-signal-group">
        <strong>Stage Signal</strong>
        <div class="om-leader-signal-list">
        ${overviewRows.map((row) => `
          <span class="om-leader-signal-chip">
            <span>${htmlText(row.label)}</span>
            <strong>${row.total}</strong>
            <small>${row.overdue ? `${row.overdue} overdue` : "No overdue"}</small>
          </span>`).join("")}
        </div>
      </section>
      <section class="om-leader-signal-group om-leader-stage-date-signal">
        <strong>Project Stage Date Signal</strong>
        <div class="om-leader-signal-list">
        ${stageDateRows.length ? stageDateRows.map((row) => `
          <span class="om-leader-signal-chip om-leader-stage-date-chip">
            <span>${htmlText(row.label)}</span>
            <small>Line Open ${htmlText(row.lineOpenDate)}</small>
            <small>Required By Stage ${htmlText(row.requiredByStage)}</small>
          </span>`).join("") : `<span class="om-leader-signal-chip"><span>No stage date in scope</span><strong>0</strong></span>`}
        </div>
      </section>
      <section class="om-leader-signal-group">
        <strong>Workload Signal</strong>
        <div class="om-leader-signal-list">
        ${workloadRows.length ? workloadRows.map((row) => `
          <span class="om-leader-signal-chip ${row.overdue ? "risk" : ""}">
            <strong>${htmlText(row.owner)}</strong>
            <span>${row.total} rows</span>
            <small>${row.overdue} overdue</small>
          </span>`).join("") : `<span class="om-leader-signal-chip"><span>No assigned workload</span><strong>0</strong></span>`}
        </div>
      </section>
    </div>`;
}
// @end-legacy-unit 1393

// @legacy-unit 1394 16894
export function renderOmLeaderConsole(rows = []) {
  const summary = document.getElementById("omSubmissionSummary");
  if (summary) {
    summary.classList.add("om-leader-status-summary");
    summary.innerHTML = renderOmLeaderStatusSummary(rows);
  }
  const table = document.getElementById("omSubmissionTable");
  if (table) table.classList.add("om-leader-console-table");
  const triage = document.getElementById("omSubmissionTriage");
  if (triage) {
    triage.innerHTML = `
      <div class="triage-title">
        <strong>Action Required Queue</strong>
        <span>Only exceptions that need leader attention stay here.</span>
      </div>`;
  }
  const body = document.getElementById("omSubmissionRows");
  if (!body) return;
  const headRow = body.closest("table")?.querySelector("thead tr");
  if (headRow) {
    headRow.innerHTML = `
      <th>Risk</th>
      <th>Project / Item</th>
      <th>Owner</th>
      <th>Current Stage</th>
      <th>Days</th>
      <th>PR / PO</th>
      <th>Delivery</th>
      <th>Next Action</th>
      <th>Detail</th>`;
  }
  const exceptions = omLeaderExceptionRows(rows);
  body.innerHTML = exceptions.length
    ? exceptions.map((group) => `
      <tr class="${group.sla?.isOverdue ? "om-row-overdue" : ""}" data-om-submission-row="${htmlAttr(group.keyId)}">
        <td><span class="status-pill ${statusClass(omLeaderRiskLabel(group))}">${htmlText(omLeaderRiskLabel(group))}</span></td>
        <td>${omProgressProjectCell(group)}<div class="cell-identity">${omProgressItemCell(group)}</div></td>
        <td>${omAssigneeProgressCell(group)}</td>
        <td><span class="status-pill ${statusClass(group.sla?.stageLabel || "-")}">${htmlText(group.sla?.stageLabel || "-")}</span></td>
        <td><strong>${group.sla?.daysInStage ?? "-"}</strong><div class="reason-text">${group.sla?.stageEnteredAt ? `Since ${compactDateTime(group.sla.stageEnteredAt)}` : "No stage date"}</div></td>
        <td>${omLeaderTrackingSummaryCell(group)}</td>
        <td>${omLeaderDeliverySummaryCell(group)}</td>
        <td><div class="reason-text">${htmlText(omLeaderNextAction(group))}</div></td>
        <td><button class="mini return" data-om-submission-detail="${group.keyId}">Detail</button></td>
      </tr>`).join("")
    : `<tr><td colspan="9" class="empty-cell">No leader action required in the selected scope.</td></tr>`;
}
// @end-legacy-unit 1394

// @legacy-unit 1395 16942
export function renderOmSubmission() {
  syncOmSubmissionFilters();
  renderOmExchangeRatePanel();
  renderOmProjectStageCalendar();
  const filters = omSubmissionFilterState();
  const scopeLabel = document.getElementById("omSubmissionScopeLabel");
  if (scopeLabel) scopeLabel.textContent = omSubmissionScopeLabel(filters);
  const rows = omSubmissionRows();
  if (currentRole === "omLeader" || currentView === "omLeaderProgress") {
    renderOmLeaderConsole(rows);
    return;
  }
  const totalQty = rows.reduce((sum, row) => sum + row.quantity, 0);
  const summary = document.getElementById("omSubmissionSummary");
  if (summary) {
    summary.classList.remove("om-leader-status-summary");
    const pendingPas = rows.filter((group) => group.sla.stageKey === "pendingPasDemand").length;
    const pendingBidding = rows.filter((group) => group.sla.stageKey === "pendingBiddingResult").length;
    const readyToExport = rows.filter((group) => group.sla.stageKey === "readyToExport").length;
    const buyerHandoff = rows.filter((group) => group.sla.stageKey === "buyerHandoff").length;
    const overSla = rows.filter((group) => group.sla.isOverdue).length;
    summary.innerHTML = summaryCardsHtml([
      { label: "Product / Project Rows", value: rows.length, helper: `${totalQty} qty · Lv2 → Lv3 grain`, variant: "hero" },
      { label: "Pending PAS Demand", value: pendingPas, helper: `SLA ${OM_PAS_DEMAND_SLA_DAYS}d` },
      { label: "Pending Bidding Result", value: pendingBidding, helper: `SLA ${OM_BIDDING_RESULT_SLA_DAYS}d` },
      { label: "Ready for Buyer Handoff", value: readyToExport, helper: "Requester confirmed" },
      { label: "Procurement Tracking", value: buyerHandoff, helper: "PR / PO / ETA monitored from API" },
      { label: "Overdue", value: overSla, helper: "Row highlight + remark", variant: overSla ? "warning" : "" },
    ]);
  }
  renderOmSubmissionTriage(rows);
  const body = document.getElementById("omSubmissionRows");
  if (!body) return;
  const table = body.closest("table");
  if (table) table.classList.remove("om-leader-console-table");
  const headRow = table?.querySelector("thead tr");
  if (headRow) {
    headRow.innerHTML = `
      <th>Request ID</th>
      <th>Category</th>
      <th>Item / Spec</th>
      <th>Project / Phase</th>
      <th>Qty</th>
      <th>Estimated Unit / Amount</th>
      <th>Current Stage</th>
      <th>Stage Entered</th>
      <th>SLA Status</th>
      <th>Assignee</th>
      <th>PR / PO Summary</th>
      <th>Delivery Summary</th>
      <th>Remark</th>
      <th>Detail</th>`;
  }
  body.innerHTML = rows.length
    ? rows.map((row) => {
      const sla = row.sla;
      return `
      <tr class="${sla.isOverdue ? "om-row-overdue" : ""}" data-om-submission-row="${htmlAttr(row.keyId)}">
        <td>${omRequestIdCell(row)}</td>
        <td>${omProgressCategoryCell(row)}</td>
        <td>${omProgressItemCell(row)}</td>
        <td>${omProgressProjectCell(row)}</td>
        <td><strong>${row.quantity}</strong></td>
        <td>${omEstimatedPriceCell(row)}</td>
        <td><span class="status-pill ${statusClass(sla.stageLabel)}">${htmlText(sla.stageLabel)}</span></td>
        <td><strong>${sla.stageEnteredAt ? compactDateTime(sla.stageEnteredAt) : "-"}</strong></td>
        <td>${omSlaStatusCell(row)}</td>
        <td>${omAssigneeProgressCell(row)}</td>
        <td>${omLeaderTrackingSummaryCell(row)}</td>
        <td>${omLeaderDeliverySummaryCell(row)}</td>
        <td>${omProgressRemarkCell(row)}</td>
        <td><button class="mini return" data-om-submission-detail="${row.keyId}">Detail</button></td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="14" class="empty-cell">No OM submission rows match the selected filters.</td></tr>`;
}
// @end-legacy-unit 1395

// @legacy-unit 1396 17019
export function openOmSubmissionDetail(groupKeyId) {
  const group = omSubmissionRows().find((row) => row.keyId === groupKeyId);
  if (!group) return;
  document.getElementById("managerDetailTitle").textContent = `Submission Status / ${group.project} / ${group.item}`;
  document.getElementById("managerDetailStatus").className = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "status-pill warning"
    : "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "Needs Attention"
    : "On Track";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Submission Status Summary</h4></div>
      ${detailSummaryGridHtml([
        ["Project", group.project, group.yearProject],
        ["Department", group.department, `${group.rows.length} raw row${group.rows.length === 1 ? "" : "s"}`],
        ["Quantity", group.quantity],
        ["Pending / Risk", [...group.pendingReasons].join(" / ") || "-", group.item],
        ["PAS Demand", group.rows.some((row) => row.pasDemandNo) ? "Recorded" : "Pending", group.rows.map((row) => row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt).filter(Boolean).sort()[0] || "-"],
        ["Quote Completion", group.rows.some((row) => isOmQuoteReady(row) || row.quoteCompletionReadyAt) ? "Ready" : "Pending", group.rows.map((row) => row.quoteCompletionReadyAt || row.quoteReadyAt).filter(Boolean).sort()[0] || "-"],
        ["User Confirmation", group.rows.some((row) => row.userAQuoteDecisionAt) ? "Done" : group.rows.some((row) => isOmWaitingUserConfirm(row)) ? "Waiting" : "Not Sent", group.rows.map((row) => row.userAQuoteDecisionAt || row.sentToUserAAt).filter(Boolean).sort().pop() || "-"],
        ["OM Handoff", group.rows.some((row) => row.finalExportedAt) ? "Handed Off" : "Pending", group.rows.map((row) => row.finalExportedAt || row.finalExportPreparedAt).filter(Boolean).sort().pop() || "-"],
      ])}
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Raw Request Rows</h4>
          <p class="panel-subcopy">Use this section to trace the grouped OM submission back to each requester row, schedule date, and purchasing progress record.</p>
          <p class="panel-subcopy">OM view stops at PAS / quote / requester confirmation / OM handoff. Buyer PR / PO execution is a buyer handoff note and is not shown as OM work.</p>
        </div>
      </div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table workflow-table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Item / Spec</th>
              <th>Qty</th>
              <th>Need / Received</th>
              <th>PAS Demand</th>
              <th>Quote Result</th>
              <th>User Confirm</th>
              <th>OM Handoff</th>
              <th>Pending / Risk Reason</th>
            </tr>
          </thead>
          <tbody>
            ${group.rows.map((row) => `
              <tr>
                <td>${row.requesterName || "-"}<div class="reason-text">${row.requesterEmployeeId || row.email || ""}</div></td>
                <td><div class="item-primary">${row.name || "-"}</div><div class="reason-text">${itemDetail(row)}</div></td>
                <td>${managerProgressQty(row)}</td>
                <td>${needDateForRow(row) || "-"}<div class="reason-text">Received ${row.sentToOmAt || row.managerApprovedAt ? compactDateTime(row.sentToOmAt || row.managerApprovedAt) : "-"}</div></td>
                <td>${row.pasDemandNo || "Pending"}<div class="reason-text">${row.pasDemandNoRecordedAt ? compactDateTime(row.pasDemandNoRecordedAt) : "Waiting PAS Demand No"}</div></td>
                <td>${isOmQuoteReady(row) ? "Ready" : "Pending"}<div class="reason-text">${row.quoteValidUntil ? `Valid until ${row.quoteValidUntil}` : "Waiting quote result"}</div></td>
                <td>${row.userAQuoteDecisionStatus || "Not Sent"}<div class="reason-text">${row.userAQuoteDecisionAt ? compactDateTime(row.userAQuoteDecisionAt) : "-"}</div></td>
                <td>${omFinalExportStatusLabel(row)}<div class="reason-text">${row.finalExportPackageCode || row.finalExportTarget || "-"}</div></td>
                <td>${pendingReasonCell(new Set([managerProgressPendingReason(row)]))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerDetailModal").hidden = false;
}
// @end-legacy-unit 1396
