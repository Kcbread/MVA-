// cost/detail-view: authoritative source; see docs/module-map.md.
import {
  managerAuditTimelineHtml,
  managerCarryoverEvidenceHtml,
  stationBreakdownDetailHtml
} from "../approval/audit-view.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  managerAffectedPhasesText
} from "../approval/queue-view.js";
import {
  replaceSelectedManagerRequestIdBinding,
  selectedManagerRequestId
} from "../approval/state.js";
import {
  stageDemandMetric,
  stageDemandRows
} from "./demand-metrics.js";
import {
  formatVnd
} from "./matrix-data.js";
import {
  amendmentReferenceRows
} from "../demand/amendments.js";
import {
  normalizedNonMfgDepartment
} from "../demand/matrix-view.js";
import {
  clampQty,
  isLongFormStationBreakdown,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsCount,
  stationBreakdownStatus,
  totalQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  itemKeyDisplay,
  partName
} from "../materials/identity.js";
import {
  externalProgressTimelineHtml
} from "../om/external-progress.js";
import {
  omPackageHistoryHtml
} from "../om/history.js";
import {
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
import {
  detailSummaryGridHtml
} from "../shared/detail-view.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";

// @legacy-unit 1425 17680
export let MANAGER_MFG_HEADER_MASTER;
export function initializeMANAGER_MFG_HEADER_MASTERBinding() {
  MANAGER_MFG_HEADER_MASTER = {
  mainline: ["CG", "BG", "FATP", "Test", "Hybrid", "Auto"],
  packing: ["ENG Pack", "Zombie", "Laser_pico", "Rework"],
  supporting: ["Repair", "WH"],
  calculation: ["Buffer", "Total Demand for EQ", "Stock", "Actual Need QTY"],
};
}
// @end-legacy-unit 1425

// @legacy-unit 1426 17687
export let MANAGER_NON_MFG_HEADER_MASTER;
export function initializeMANAGER_NON_MFG_HEADER_MASTERBinding() {
  MANAGER_NON_MFG_HEADER_MASTER = ["Department", "Demand", "Buffer", "Total Demand for EQ", "Stock", "Actual Need QTY"];
}
// @end-legacy-unit 1426

// @legacy-unit 1427 17689
export function managerDetailMode(row) {
  if (Array.isArray(row?.stationBreakdown) && row.stationBreakdown.length) return "MFG";
  const text = normalize(`${row.station || ""} ${row.process || ""} ${row.department || ""}`);
  return /mainline|packing|support|repair|warehouse|mfg|cg|bg|fatp|test|hybrid|auto|laser|zombie|rework/.test(text)
    ? "MFG"
    : "Non-MFG";
}
// @end-legacy-unit 1427

// @legacy-unit 1428 17697
export function managerDetailSameItemRows(baseRow, stage) {
  const baseMaterial = normalize(itemKeyDisplay(baseRow));
  const baseName = normalize(baseRow.name);
  const rows = stageDemandRows(baseRow.project, stage).filter((row) => {
    const sameMaterial = baseMaterial && normalize(itemKeyDisplay(row)) === baseMaterial;
    const sameName = baseName && normalize(row.name) === baseName;
    return sameMaterial || sameName;
  });
  return rows.length ? rows : [baseRow];
}
// @end-legacy-unit 1428

// @legacy-unit 1429 17708
export function managerDetailStationQty(row, stage, station) {
  if (Array.isArray(row?.stationBreakdown)) {
    return row.stationBreakdown
      .filter((item) => normalize(item.station) === normalize(station))
      .reduce((sum, item) => {
        if (isLongFormStationBreakdown(item)) {
          return sum + (stationBreakdownPhaseKey(item) === stage ? stationBreakdownRowTotal(item) : 0);
        }
        return sum + clampQty(item[stage]);
      }, 0);
  }
  const normalized = normalize(station).replace(/[^a-z0-9]+/g, "");
  const candidates = [`${stage}_${normalized}`, `${stage}${normalized}`, normalized, station];
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row || {}, key)) return clampQty(row[key]);
  }
  const rowStation = normalize(`${row.station || ""} ${row.process || ""}`);
  return rowStation.includes(normalize(station)) ? clampQty(row[stage]) : 0;
}
// @end-legacy-unit 1429

// @legacy-unit 1430 17728
export function managerDetailCalculation(row, stage) {
  const metric = stageDemandMetric(row, row.detailSource || "request", stage);
  return {
    buffer: clampQty(row[`${stage}_buffer`] || row.buffer || 0),
    totalDemand: clampQty(row[`${stage}_totalDemandForEq`] || row.totalDemandForEq || row[stage]),
    stock: clampQty(row[`${stage}_stock`] || metric.carryoverStock),
    actualNeed: clampQty(row[`${stage}_actualNeedQty`] || metric.suggestedNewBuy),
  };
}
// @end-legacy-unit 1430

// @legacy-unit 1431 17738
export function managerDetailFullPhaseSummary(baseRow) {
  const phaseQty = Object.fromEntries(STAGES.map((stage) => [stage, 0]));
  let carryover = 0;
  let needToBuy = 0;
  STAGES.forEach((stage) => {
    const rows = managerDetailSameItemRows(baseRow, stage);
    phaseQty[stage] = rows.reduce((sum, row) => sum + clampQty(row[stage]), 0);
    carryover += rows.reduce((sum, row) => sum + managerDetailCalculation(row, stage).stock, 0);
    needToBuy += rows.reduce((sum, row) => sum + managerDetailCalculation(row, stage).actualNeed, 0);
  });
  const values = STAGES.map((stage) => phaseQty[stage]);
  const nonZero = values.filter((value) => value > 0);
  let phaseTrend = "No Plan";
  if (nonZero.length) {
    phaseTrend = "Stable";
    for (let index = 1; index < values.length; index += 1) {
      if (values[index - 1] > 0 && values[index] > values[index - 1]) phaseTrend = "Unexpected Increase";
    }
    if (phaseTrend === "Stable" && nonZero[nonZero.length - 1] < Math.max(...nonZero)) phaseTrend = "Drop After Pilot";
  }
  return { phaseQty, totalQty: values.reduce((sum, value) => sum + value, 0), carryover, needToBuy, phaseTrend };
}
// @end-legacy-unit 1431

// @legacy-unit 1432 17761
export function managerPhaseOverviewHtml(row) {
  const summary = managerDetailFullPhaseSummary(row);
  return `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Item Full Phase Overview</h4>
          <p class="panel-subcopy">Compare total quantity, carryover, and need-to-buy across each project phase before drilling into station or department detail.</p>
        </div>
      </div>
      <div class="table-wrap compact-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              ${STAGES.map((stage) => `<th>${STAGE_LABELS[stage]} Qty</th>`).join("")}
              <th>Total Qty</th>
              <th>Carryover</th>
              <th>Need to Buy</th>
              <th>Phase Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              ${STAGES.map((stage) => `<td>${summary.phaseQty[stage]}</td>`).join("")}
              <td>${summary.totalQty}</td>
              <td>${summary.carryover}</td>
              <td>${summary.needToBuy}</td>
              <td><span class="status-pill ${statusClass(summary.phaseTrend)}">${summary.phaseTrend}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`;
}
// @end-legacy-unit 1432

// @legacy-unit 1433 17796
export function managerBreakdownHtml(row) {
  const mode = managerDetailMode(row);
  if (mode === "MFG") {
    const stationColumns = [
      ...MANAGER_MFG_HEADER_MASTER.mainline,
      ...MANAGER_MFG_HEADER_MASTER.packing,
      ...MANAGER_MFG_HEADER_MASTER.supporting,
    ];
    return `
      <section class="work-panel detail-subsection">
        <div class="panel-title section-head-tight">
          <div>
            <h4>Station Breakdown</h4>
            <p class="panel-subcopy">Use this matrix to spot which MFG station or calculation field is pulling quantity up across P1.0 to MP.</p>
          </div>
        </div>
        <div class="table-wrap stage-demand-wrap">
          <table class="data-table manager-progress-detail-table">
            <thead>
              <tr>
                <th>Phase</th>
                ${stationColumns.map((station) => `<th>${station}</th>`).join("")}
                ${MANAGER_MFG_HEADER_MASTER.calculation.map((item) => `<th>${item}</th>`).join("")}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${STAGES.map((stage) => {
                const rows = managerDetailSameItemRows(row, stage);
                const calc = rows.reduce((sum, item) => {
                  const values = managerDetailCalculation(item, stage);
                  sum.buffer += values.buffer;
                  sum.totalDemand += values.totalDemand;
                  sum.stock += values.stock;
                  sum.actualNeed += values.actualNeed;
                  return sum;
                }, { buffer: 0, totalDemand: 0, stock: 0, actualNeed: 0 });
                const stationValues = stationColumns.map((station) => rows.reduce((sum, item) => sum + managerDetailStationQty(item, stage, station), 0));
                return `<tr>
                  <td>${STAGE_LABELS[stage]}</td>
                  ${stationValues.map((value) => `<td>${value}</td>`).join("")}
                  <td>${calc.buffer}</td>
                  <td>${calc.totalDemand}</td>
                  <td>${calc.stock}</td>
                  <td>${calc.actualNeed}</td>
                  <td>${rows.reduce((sum, item) => sum + clampQty(item[stage]), 0)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  return `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Department Breakdown</h4>
          <p class="panel-subcopy">Use this matrix to compare non-MFG demand, buffer, stock, and actual need by phase.</p>
        </div>
      </div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              <th>Phase</th>
              ${MANAGER_NON_MFG_HEADER_MASTER.map((item) => `<th>${item}</th>`).join("")}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${STAGES.map((stage) => {
              const rows = managerDetailSameItemRows(row, stage);
              const department = [...new Set(rows.map((item) => normalizedNonMfgDepartment(item)).filter(Boolean))].join(" / ") || "-";
              const demand = rows.reduce((sum, item) => sum + clampQty(item[stage]), 0);
              const calc = rows.reduce((sum, item) => {
                const values = managerDetailCalculation(item, stage);
                sum.buffer += values.buffer;
                sum.totalDemand += values.totalDemand;
                sum.stock += values.stock;
                sum.actualNeed += values.actualNeed;
                return sum;
              }, { buffer: 0, totalDemand: 0, stock: 0, actualNeed: 0 });
              return `<tr>
                <td>${STAGE_LABELS[stage]}</td>
                <td>${department}</td>
                <td>${demand}</td>
                <td>${calc.buffer}</td>
                <td>${calc.totalDemand}</td>
                <td>${calc.stock}</td>
                <td>${calc.actualNeed}</td>
                <td>${calc.totalDemand}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}
// @end-legacy-unit 1433

// @legacy-unit 1434 17897
export function renderManagerDetail({ readonly = false } = {}) {
  document.getElementById("managerDetailModal")?.classList.remove("contact-detail-mode");
  const row = requests.find((item) => item.id === selectedManagerRequestId);
  if (!row) {
    document.getElementById("managerDetailTitle").textContent = "Select a request";
    document.getElementById("managerDetailStatus").className = "status-pill draft";
    document.getElementById("managerDetailStatus").textContent = "No request";
    document.getElementById("managerDetail").innerHTML = `<div class="empty-state">Select a request from the queue.</div>`;
    return;
  }

  document.getElementById("managerDetailTitle").textContent = `Cost Manager Request Detail · ${row.id}`;
  document.getElementById("managerDetailStatus").className = `status-pill ${statusClass(row.status)}`;
  document.getElementById("managerDetailStatus").textContent = row.status;
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Request Information</h4></div>
      ${detailSummaryGridHtml([
        ["Request ID", row.id, row.project],
        ["Item", row.name, itemKeyDisplay(row)],
        ["Station Rows", stationBreakdownRowsCount(row), stationBreakdownStatus(row)],
        ["Total Qty", totalQty(row), managerAffectedPhasesText(row)],
        ["Estimated Budget", row.estimatedAmount ? formatVnd(row.estimatedAmount) : row.estimatedUnitPrice ? `${formatVnd(row.estimatedUnitPrice)} / unit` : "-", row.budgetRemark || "Requester run-ahead estimate"],
        ["Detail / Spec", itemDetail(row) || "-", partName(row)],
        ["Reason / Use Case", row.requesterReason || row.useCase || "No requester reason provided."],
        ["Reject Reason", row.managerReason || "-", row.managerReason ? "Decision note recorded" : "No reject reason"],
        ["Submitted", row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-US") : "-", row.submittedBy || row.requesterName || "Requester"],
      ])}
    </section>
    ${amendmentReferenceRows(row).length ? `
      <section class="work-panel detail-subsection">
        <div class="panel-title section-head-tight"><h4>Amendment Before / After</h4></div>
        <div class="item-detail-grid">${amendmentReferenceRows(row).join("")}</div>
      </section>` : ""}
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>需求單位 / Station Breakdown</h4></div>
      ${stationBreakdownDetailHtml(row)}
    </section>
    ${managerPhaseOverviewHtml(row)}
    ${managerBreakdownHtml(row)}
    ${managerCarryoverEvidenceHtml(row)}
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Timeline / Evidence</h4></div>
      ${managerAuditTimelineHtml(row)}
      ${omPackageHistoryHtml(row)}
      ${externalProgressTimelineHtml(row)}
    </section>`;

}
// @end-legacy-unit 1434

// @legacy-unit 1435 17947
export function openManagerDetail(requestId, { readonly = false } = {}) {
  replaceSelectedManagerRequestIdBinding(requestId);
  renderManager();
  renderManagerDetail({ readonly });
  document.getElementById("managerDetailModal").hidden = false;
}
// @end-legacy-unit 1435

// @legacy-unit 1436 17954
export function closeManagerDetail() {
  const modal = document.getElementById("managerDetailModal");
  modal?.classList.remove("contact-detail-mode");
  if (modal) modal.hidden = true;
}
// @end-legacy-unit 1436

// @legacy-unit 1437 17960
export function closeManagerTrack() {
  const modal = document.getElementById("managerTrackModal");
  if (modal) modal.hidden = true;
}
// @end-legacy-unit 1437
