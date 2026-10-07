// cost/manager-dashboard: authoritative source; see docs/module-map.md.
import {
  approvalReviewConfigForRole,
  managerReviewRole
} from "../approval/navigation.js";
import {
  managerAffectedPhasesText,
  managerDecisionHistoryRows,
  managerReviewDecisionAt,
  managerReviewDecisionReason,
  managerReviewDecisionStatus
} from "../approval/queue-view.js";
import {
  stageDemandMetric,
  stageDemandRows
} from "./demand-metrics.js";
import {
  managerDetailMode
} from "./detail-view.js";
import {
  summaryCardsHtml
} from "./stage-view.js";
import {
  stationDisplay
} from "../demand/matrix-view.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  omItemCell
} from "../materials/detail-view.js";
import {
  itemDetailButton
} from "../materials/display.js";
import {
  itemKeyDisplay
} from "../materials/identity.js";
import {
  STAGE_LABELS
} from "../projects/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  statusClass
} from "../shared/format.js";
import {
  DEMAND_REVIEW_APPROVED,
  DEMAND_REVIEW_DENIED,
  DEMAND_REVIEW_REVISE_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1441 18015
export function reviewedRows() {
  return managerDecisionHistoryRows();
}
// @end-legacy-unit 1441

// @legacy-unit 1442 18019
export function renderManagerDashboard() {
  const role = managerReviewRole(currentRole);
  const rows = managerDecisionHistoryRows(role);
  const label = approvalReviewConfigForRole(role)?.entryLabel || "Review";
  document.getElementById("managerDashboardSummary").innerHTML = summaryCardsHtml([
    { label: "Approved", value: rows.filter((row) => managerReviewDecisionStatus(row, role) === DEMAND_REVIEW_APPROVED).length, helper: `${document.getElementById("managerDashboardProjectFilter")?.value || "All projects"} · ${label} history`, variant: "hero" },
    { label: "Denied", value: rows.filter((row) => managerReviewDecisionStatus(row, role) === DEMAND_REVIEW_DENIED).length },
    { label: "Revise Required", value: rows.filter((row) => managerReviewDecisionStatus(row, role) === DEMAND_REVIEW_REVISE_REQUIRED).length, helper: "Requester Action Required" },
    { label: "Decision Notes", value: rows.filter((row) => managerReviewDecisionReason(row) !== "-").length, helper: "Rows with recorded reason" },
  ]);

  document.getElementById("managerDashboardRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${omItemCell(row, { stageLabel: `${label} history` })}</td>
        <td>${managerAffectedPhasesText(row)}</td>
        <td>${totalQty(row)}</td>
        <td><span class="status-pill ${statusClass(managerReviewDecisionStatus(row, role))}">${managerReviewDecisionStatus(row, role) || "-"}</span></td>
        <td>${managerReviewDecisionReason(row)}</td>
        <td>${managerReviewDecisionAt(row, role) ? new Date(managerReviewDecisionAt(row, role)).toLocaleString("en-US") : "-"}</td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="9" class="empty-cell">No ${label} decision history is available.</td></tr>`;
}
// @end-legacy-unit 1442

// @legacy-unit 1443 18046
export function openManagerDashboardPhaseDetail(project, stage) {
  const rows = stageDemandRows(project, stage);
  document.getElementById("managerDetailTitle").textContent = `${project} / ${STAGE_LABELS[stage]} Dashboard Detail`;
  document.getElementById("managerDetailStatus").className = "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = "Project Phase";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Project / Phase Item Overview</h4></div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mode</th>
              <th>Item</th>
              <th>Tracking Ref</th>
              <th>Station / Department</th>
              <th>Phase Qty</th>
              <th>Carryover</th>
              <th>Need to Buy</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map((row) => {
              const metric = stageDemandMetric(row, row.detailSource || "record", stage);
              return `<tr>
                <td>${managerDetailMode(row)}</td>
                <td>${row.name}</td>
                <td>${itemKeyDisplay(row)}</td>
                <td>${stationDisplay(row)}</td>
                <td>${clampQty(row[stage])}</td>
                <td>${metric.carryoverStock}</td>
                <td>${metric.suggestedNewBuy}</td>
                <td>${itemDetailButton(row.detailSource || "record", row.detailId || row.id)}</td>
              </tr>`;
            }).join("") : `<tr><td colspan="8" class="empty-cell">No item data is available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerDetailModal").hidden = false;
}
// @end-legacy-unit 1443
