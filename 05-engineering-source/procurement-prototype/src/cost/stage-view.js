// cost/stage-view: authoritative source; see docs/module-map.md.
import {
  managerNextStep
} from "../approval/routing.js";
import {
  money
} from "./currency.js";
import {
  stageDemandRows
} from "./demand-metrics.js";
import {
  costConfidence,
  effectiveUnitPrice
} from "./pricing.js";
import {
  managerLineDepartment,
  stationDisplay
} from "../demand/matrix-view.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  isNewMaterial,
  itemDetail,
  itemDetailButton,
  itemTypeBadge
} from "../materials/display.js";
import {
  factoryMaterialNoFor,
  partName
} from "../materials/identity.js";
import {
  OM_INTERNAL_SLA_DAYS
} from "../om/progress-data.js";
import {
  omQuoteValidUntil
} from "../om/quote-validity.js";
import {
  managerProgressAgingCell,
  managerProgressCurrentStageForGroup,
  managerProgressDaysPending,
  managerProgressNextActionForGroup,
  managerProgressPendingOwnerForGroup,
  managerProgressQuoteStatusForGroup,
  managerProgressRows,
  managerProgressSubmittedAt,
  pendingReasonCell,
  progressQuoteValidity,
  syncManagerProgressFilters
} from "../progress/demand.js";
import {
  STAGES
} from "../projects/config.js";
import {
  allProjectCodes
} from "../projects/controls.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  stageLabel,
  statusClass
} from "../shared/format.js";

// @legacy-unit 663 5007
export function renderStageDemandRows(rows, targetId) {
  document.getElementById(targetId).innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${stageLabel(row.metrics.stage)}</td>
        <td>${managerLineDepartment(row)}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div>${isNewMaterial(row) ? itemTypeBadge(row) : ""}</td>
        <td>${stationDisplay(row)}</td>
        <td>${itemDetail(row)}</td>
        <td>${factoryMaterialNoFor(row)}</td>
        <td>${row.metrics.baselineDemand ?? "-"}</td>
        <td>${row.metrics.carryoverStock}</td>
        <td>${row.metrics.suggestedNewBuy}</td>
        <td>${clampQty(row[row.metrics.stage])}</td>
        <td>${effectiveUnitPrice(row) ? money(clampQty(row[row.metrics.stage]) * effectiveUnitPrice(row)) : "-"}</td>
        <td><span class="status-pill ${statusClass(managerNextStep(row))}">${managerNextStep(row)}</span></td>
        <td><span class="status-pill ${statusClass(row.metrics.riskStatus)}">${row.metrics.riskStatus}</span></td>
        <td>${itemDetailButton(row.detailSource, row.detailId)}</td>
      </tr>`).join("")
    : `<tr><td colspan="13" class="empty-cell">No demand data is available for the selected project.</td></tr>`;
}
// @end-legacy-unit 663

// @legacy-unit 664 5030
export function stageSummaryCards(rows, label = "") {
  const projects = [...new Set(rows.map((row) => row.project))];
  const stageSummary = rows.length
    ? projects.length === 1 ? `${projects[0]} / ${stageLabel(rows[0].metrics.stage)}` : "All projects"
    : "-";
  return [
    [label || "Phase", stageSummary],
    ["Planned Demand", rows.reduce((sum, row) => sum + (row.metrics.baselineDemand ?? 0), 0)],
    ["Carryover", rows.reduce((sum, row) => sum + row.metrics.carryoverStock, 0)],
    ["Need to Buy", rows.reduce((sum, row) => sum + row.metrics.suggestedNewBuy, 0)],
    ["Risk Items", rows.filter((row) => !["OK", "Need Purchase"].includes(row.metrics.riskStatus)).length],
  ];
}
// @end-legacy-unit 664

// @legacy-unit 665 5044
export function summaryCardsHtml(cards) {
  return cards.map((card) => {
    const normalized = Array.isArray(card)
      ? { label: card[0], value: card[1], helper: "", variant: "" }
      : { label: card.label, value: card.value, helper: card.helper || "", variant: card.variant || "" };
    const variantClass = normalized.variant ? ` summary-card-${normalized.variant}` : "";
    return `
    <article class="summary-card${variantClass}">
      <span>${normalized.label}</span>
      <strong>${normalized.value}</strong>
      ${normalized.helper ? `<small>${normalized.helper}</small>` : ""}
    </article>`;
  }).join("");
}
// @end-legacy-unit 665

// @legacy-unit 666 5059
export function renderStageSummary(rows, targetId) {
  document.getElementById(targetId).innerHTML = summaryCardsHtml(stageSummaryCards(rows));
}
// @end-legacy-unit 666

// @legacy-unit 667 5063
export function stageDemandTableHtml(tbodyId) {
  return `
    <div class="table-wrap stage-demand-wrap">
      <table class="data-table stage-demand-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Phase</th>
            <th>Item</th>
            <th>Detail / Spec</th>
            <th>Material Name</th>
            <th>Planned Demand</th>
            <th>Carryover</th>
            <th>Current Request</th>
            <th>Need to Buy</th>
            <th>Risk</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody id="${tbodyId}"></tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 667

// @legacy-unit 680 5275
export function stageAggregate(project, stage) {
  const rows = stageDemandRows(project, stage);
  const stageDemand = rows.reduce((sum, row) => sum + (row.metrics.baselineDemand ?? 0), 0);
  const carryover = rows.reduce((sum, row) => sum + row.metrics.carryoverStock, 0);
  const needToBuy = rows.reduce((sum, row) => sum + row.metrics.suggestedNewBuy, 0);
  const lineOpeningCost = rows.reduce((sum, row) => sum + (row.metrics.suggestedNewBuy * Number(row.unitPrice || 0)), 0);
  const riskItems = rows.filter((row) => !["OK", "Need Purchase"].includes(row.metrics.riskStatus)).length;
  return {
    project,
    stage,
    rows,
    stageDemand,
    carryover,
    needToBuy,
    lineOpeningCost,
    riskItems,
  };
}
// @end-legacy-unit 680

// @legacy-unit 681 5294
export function groupCostConfidence(rows) {
  const statuses = rows.map((row) => costConfidence(row));
  if (statuses.includes("Quote Expired")) return "Quote Expired";
  if (statuses.includes("New Material / Sourcing Needed")) return "New Material / Sourcing Needed";
  if (statuses.includes("Pending Approval")) return "Pending Approval";
  if (statuses.includes("Quote Pending")) return "Quote Pending";
  if (statuses.includes("Reference Estimate")) return "Reference Estimate";
  return "Confirmed Cost";
}
// @end-legacy-unit 681

// @legacy-unit 682 5304
export function managerLineStageAggregates(projectFilter = "") {
  const projects = projectFilter ? [projectFilter] : allProjectCodes();
  return projects.flatMap((project) => STAGES.flatMap((stage) => {
    const rows = stageDemandRows(project, stage);
    const groups = new Map();
    rows.forEach((row) => {
      const lineDepartment = managerLineDepartment(row);
      const key = `${project}-${stage}-${lineDepartment}`;
      if (!groups.has(key)) {
        groups.set(key, {
          project,
          stage,
          lineDepartment,
          rows: [],
          itemCount: 0,
          plannedDemand: 0,
          carryover: 0,
          needToBuy: 0,
          totalQty: 0,
          estimatedAmount: 0,
          riskItems: 0,
          costConfidence: "Quote Pending",
        });
      }
      const group = groups.get(key);
      group.rows.push(row);
      group.itemCount += 1;
      group.plannedDemand += row.metrics.baselineDemand ?? 0;
      group.carryover += row.metrics.carryoverStock;
      group.needToBuy += row.metrics.suggestedNewBuy;
      group.totalQty += clampQty(row[stage]);
      group.estimatedAmount += effectiveUnitPrice(row) ? clampQty(row[stage]) * effectiveUnitPrice(row) : 0;
      if (!["OK", "Need Purchase"].includes(row.metrics.riskStatus)) group.riskItems += 1;
    });
    return [...groups.values()].map((group) => ({
      ...group,
      costConfidence: groupCostConfidence(group.rows),
    }));
  }));
}
// @end-legacy-unit 682

// @legacy-unit 683 5345
export function managerStageAggregates(projectFilter = "") {
  const projects = projectFilter ? [projectFilter] : allProjectCodes();
  return projects.flatMap((project) => STAGES.map((stage) => stageAggregate(project, stage)));
}
// @end-legacy-unit 683

// @legacy-unit 684 5350
export function renderManagerStageTracking() {
  syncManagerProgressFilters();
  const rows = managerProgressRows();
  const trackingBanner = document.getElementById("managerTrackingBanner");
  if (trackingBanner) {
    const waitingDeptDri = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Dept DRI").length;
    const waitingBudget = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Budget Approver").length;
    const waitingOm = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "OM Purchasing").length;
    const quoteRisk = rows.filter((row) => {
      const status = managerProgressQuoteStatusForGroup(row);
      return ["Expired / Requote Required", "Expiring Soon"].includes(status);
    }).length;
    trackingBanner.innerHTML = `
      <section class="work-panel">
        <div class="panel-title section-head-tight">
          <div>
            <h3>Cross-Role Blocker Monitor</h3>
            <p class="panel-subcopy">Use this view only when final authorization is blocked by another role. It is a monitor for ownership, aging, and next action, not a second workbench.</p>
          </div>
        </div>
        <div class="summary-grid">
          ${summaryCardsHtml([
            { label: "Waiting Dept DRI", value: waitingDeptDri, helper: "Submission gate not cleared", variant: waitingDeptDri ? "hero" : "" },
            ["Waiting Budget", waitingBudget, "Escalated exception pending release"],
            ["Waiting OM", waitingOm, "PAS / quote / export still blocked"],
            ["Quote Risk", quoteRisk, "Expired or expiring soon"],
          ])}
        </div>
      </section>`;
  }
  const summaryHost = document.getElementById("managerStageSummary")?.parentElement;
  if (summaryHost && !document.getElementById("managerProgressBudgetToolbar")) {
    const toolbar = document.createElement("div");
    toolbar.id = "managerProgressBudgetToolbar";
    toolbar.className = "page-toolbar compact-toolbar manager-progress-budget-toolbar";
    toolbar.innerHTML = `
      <label>
        Request Type
        <select id="managerProgressRequestTypeFilter">
          <option value="">All requests</option>
          <option value="temporary">Temporary Budget</option>
          <option value="standard">Standard Demand</option>
        </select>
      </label>
      <label>
        Quote Validity
        <select id="managerProgressQuoteValidityFilter">
          <option value="">All quote status</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired / Requote Required</option>
          <option value="missing">Missing validity</option>
          <option value="valid">Valid</option>
        </select>
      </label>
    `;
    summaryHost.insertBefore(toolbar, document.getElementById("managerStageSummary"));
  }
  const summaryTarget = document.getElementById("managerStageSummary");
  if (summaryTarget) {
    const waitingDeptDri = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Dept DRI").length;
    const waitingBudget = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Budget Approver").length;
    const waitingOm = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "OM Purchasing").length;
    const waitingPas = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "PAS / Bidding").length;
    const waitingRequester = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Requester").length;
    const buyerHandoff = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Buyer Handoff").length;
    const overSla = rows.filter((row) => {
      const days = managerProgressDaysPending(row);
      return days !== null && days > OM_INTERNAL_SLA_DAYS;
    }).length;
    const expired = rows.filter((row) => managerProgressQuoteStatusForGroup(row) === "Expired / Requote Required").length;
    summaryTarget.innerHTML = summaryCardsHtml([
      { label: "Waiting Dept DRI", value: waitingDeptDri, helper: "Requester submit review", variant: waitingDeptDri ? "hero" : "" },
      { label: "Waiting Budget", value: waitingBudget, helper: "Budget Approver decision" },
      { label: "Waiting OM", value: waitingOm, helper: "PAS no / quote / export" },
      { label: "Waiting PAS", value: waitingPas, helper: "Bidding result not returned" },
      { label: "Waiting Requester", value: waitingRequester, helper: "Need confirm / revise" },
      { label: "Buyer Handoff", value: buyerHandoff, helper: "Buyer owns PR / PO after OM handoff" },
      { label: "Over SLA", value: overSla, helper: `>${OM_INTERNAL_SLA_DAYS}d in current stage`, variant: overSla ? "warning" : "" },
      { label: "Expired Quote", value: expired, helper: "Requote required", variant: expired ? "warning" : "" },
    ]);
  }

  const body = document.getElementById("managerStageRows");
  if (!body) return;
  const headRow = body.closest("table")?.querySelector("thead tr");
  if (headRow) {
    headRow.innerHTML = `
      <th>Year Project</th>
      <th>Project</th>
      <th>Item</th>
      <th>Submitted / Received Date</th>
      <th>Pending Owner</th>
      <th>Current Stage</th>
      <th>Days Pending</th>
      <th>Quote Status</th>
      <th>Next Action</th>
      <th>Pending / Risk Reason</th>
      <th>Detail</th>`;
  }
  body.innerHTML = rows.length
    ? rows.map((row) => {
      const pendingOwner = managerProgressPendingOwnerForGroup(row);
      const currentStage = managerProgressCurrentStageForGroup(row);
      const receivedAt = (row.rows || []).map(managerProgressSubmittedAt).filter(Boolean).sort()[0] || "";
      const quoteStatus = managerProgressQuoteStatusForGroup(row);
      const validUntilText = [...new Set(row.rows.map((raw) => progressQuoteValidity(raw).validUntil || omQuoteValidUntil(raw)).filter(Boolean))].slice(0, 2).join(" / ");
      return `
      <tr class="${row.lateRows || row.pendingRows || row.notArrivedRows ? "pivot-risk-row" : ""}">
        <td>${row.yearProject}</td>
        <td>${row.project}</td>
        <td><div class="item-primary">${row.item}</div><div class="reason-text">${row.department} · ${row.rows.length} raw row${row.rows.length === 1 ? "" : "s"}</div></td>
        <td><strong>${receivedAt ? compactDateTime(receivedAt) : "-"}</strong><div class="reason-text">${receivedAt ? "First submitted / received" : "No timestamp"}</div></td>
        <td><span class="status-pill ${statusClass(pendingOwner)}">${pendingOwner}</span><div class="reason-text">Current blocker</div></td>
        <td><span class="status-pill ${statusClass(currentStage)}">${currentStage}</span><div class="reason-text">${row.department || "-"}</div></td>
        <td>${managerProgressAgingCell(row)}</td>
        <td><span class="status-pill ${statusClass(quoteStatus)}">${quoteStatus}</span><div class="reason-text">${validUntilText || "No valid-until date yet"}</div></td>
        <td><strong>${managerProgressNextActionForGroup(row)}</strong><div class="reason-text">${row.rows.length} source row${row.rows.length === 1 ? "" : "s"}</div></td>
        <td>${pendingReasonCell(row.pendingReasons)}</td>
        <td><button class="mini return" data-manager-progress-detail="${row.keyId}">Detail</button></td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="11" class="empty-cell">No blocker rows match the selected filters.</td></tr>`;
}
// @end-legacy-unit 684

// @legacy-unit 904 9060
export function renderManagerStageSummary(aggregates) {
  return aggregates;
}
// @end-legacy-unit 904
