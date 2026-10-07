// demand/matrix-view: authoritative source; see docs/module-map.md.
import {
  stageDemandRows
} from "../cost/demand-metrics.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  currentDeptDemandDepartment,
  currentDeptDemandMode,
  currentDeptDemandPhase,
  replaceCurrentDeptDemandDepartmentBinding,
  replaceCurrentDeptDemandPhaseBinding
} from "./state.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  itemKeyDisplay
} from "../materials/identity.js";
import {
  STAGES,
  currentPhaseLabelForProject,
  currentStageForProject,
  nextBuyStageForProject
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  normalize,
  stageLabel,
  statusClass
} from "../shared/format.js";

// @legacy-unit 668 5087
export let NON_MFG_DEPARTMENTS;
export function initializeNON_MFG_DEPARTMENTSBinding() {
  NON_MFG_DEPARTMENTS = [];
}
// @end-legacy-unit 668

// @legacy-unit 669 5089
export function normalizedNonMfgDepartment(row) {
  const label = clean(row?.department);
  return label;
}
// @end-legacy-unit 669

// @legacy-unit 670 5094
export function stationDisplay(row) {
  return row?.station || "-";
}
// @end-legacy-unit 670

// @legacy-unit 671 5098
export function managerLineDepartment(row) {
  return normalizedNonMfgDepartment(row) || "-";
}
// @end-legacy-unit 671

// @legacy-unit 672 5102
export function itemNameStack(row) {
  const cn = row.standardNameCn || row.name || "-";
  const en = row.standardNameEn || row.name || "-";
  const vn = row.standardNameVn || row.vnName || "-";
  return `
    <div class="item-name-stack">
      <strong>${cn}</strong>
      <span>${en} / ${vn}</span>
    </div>`;
}
// @end-legacy-unit 672

// @legacy-unit 673 5113
export function demandProcessGroup(row) {
  const process = normalize(row.process || row.station || row.level2 || row.level3);
  if (process.includes("pack") || process.includes("包材") || process.includes("包裝")) return "packing";
  if (process.includes("office") || process.includes("lab") || process.includes("warehouse") || process.includes("facility") || process.includes("support")) return "supporting";
  return "mainline";
}
// @end-legacy-unit 673

// @legacy-unit 674 5120
export function demandInputBreakdown(row) {
  const demand = row.metrics?.baselineDemand ?? row.metrics?.currentRequestQty ?? 0;
  const group = demandProcessGroup(row);
  const mainline = group === "mainline" ? demand : 0;
  const packing = group === "packing" ? demand : 0;
  const supporting = group === "supporting" ? demand : 0;
  const buffer = Math.ceil(demand * 0.1);
  const totalDemand = demand + buffer;
  const stock = row.metrics?.carryoverStock ?? 0;
  const actualNeed = Math.max(0, totalDemand - stock);
  return { demand, mainline, packing, supporting, buffer, totalDemand, stock, actualNeed };
}
// @end-legacy-unit 674

// @legacy-unit 675 5133
export function renderDeptDemandControls(activeBuyStage) {
  const phaseSelect = document.getElementById("deptDemandPhase");
  const modeSelect = document.getElementById("deptDemandMode");
  const deptSelect = document.getElementById("deptDemandDepartment");
  const deptField = document.getElementById("deptDemandDepartmentField");
  if (!phaseSelect || !modeSelect || !deptSelect) return;

  if (!STAGES.includes(currentDeptDemandPhase)) replaceCurrentDeptDemandPhaseBinding(activeBuyStage || currentStageForProject(currentProject));
  if (!NON_MFG_DEPARTMENTS.includes(currentDeptDemandDepartment)) replaceCurrentDeptDemandDepartmentBinding("");

  modeSelect.value = currentDeptDemandMode;
  phaseSelect.innerHTML = STAGES.map((stage) => `<option value="${stage}" ${stage === currentDeptDemandPhase ? "selected" : ""}>${stageLabel(stage)}</option>`).join("");
  deptSelect.innerHTML = NON_MFG_DEPARTMENTS.length
    ? NON_MFG_DEPARTMENTS.map((dept) => `<option value="${dept}" ${dept === currentDeptDemandDepartment ? "selected" : ""}>${dept}</option>`).join("")
    : `<option value="">Department Name</option>`;
  deptSelect.disabled = !NON_MFG_DEPARTMENTS.length;
  deptField.classList.toggle("utility-hidden", currentDeptDemandMode !== "nonMfg");
}
// @end-legacy-unit 675

// @legacy-unit 676 5152
export function deptDemandSummaryCards(rows, mode, phase) {
  const planned = rows.reduce((sum, row) => sum + (row.metrics.baselineDemand ?? 0), 0);
  const carryover = rows.reduce((sum, row) => sum + row.metrics.carryoverStock, 0);
  const needToBuy = rows.reduce((sum, row) => sum + row.metrics.suggestedNewBuy, 0);
  const riskItems = rows.filter((row) => !["OK", "Need Purchase"].includes(row.metrics.riskStatus)).length;
  return [
    ["Mode", mode === "mfg" ? "MFG" : "Non-MFG"],
    ["Phase", stageLabel(phase)],
    ["Items", rows.length],
    ["Planned Demand", planned],
    ["Carryover", carryover],
    ["Need to Buy", needToBuy],
    ["Risk Items", riskItems],
  ];
}
// @end-legacy-unit 676

// @legacy-unit 677 5168
export function renderDeptMfgDemandMatrix(rows) {
  document.getElementById("deptDemandMatrix").innerHTML = `
    <div class="table-wrap stage-demand-wrap">
      <table class="data-table phase-input-table mfg-phase-table">
        <thead>
          <tr>
            <th rowspan="2">Item Master</th>
            <th rowspan="2">Station</th>
            <th rowspan="2">Detail / Spec</th>
            <th rowspan="2">Material No.</th>
            <th colspan="3">Process Demand</th>
            <th colspan="4">Demand Calculation</th>
            <th rowspan="2">Risk</th>
            <th rowspan="2">Detail</th>
          </tr>
          <tr>
            <th>Mainline</th>
            <th>Packing</th>
            <th>Supporting</th>
            <th>Buffer</th>
            <th>Total Demand</th>
            <th>Stock</th>
            <th>Actual Need</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => {
            const demand = demandInputBreakdown(row);
            return `
              <tr>
                <td>${itemNameStack(row)}</td>
                <td>${stationDisplay(row)}</td>
                <td class="wrap-cell">${itemDetail(row)}</td>
                <td>${itemKeyDisplay(row)}</td>
                <td>${demand.mainline}</td>
                <td>${demand.packing}</td>
                <td>${demand.supporting}</td>
                <td>${demand.buffer}</td>
                <td>${demand.totalDemand}</td>
                <td>${demand.stock}</td>
                <td>${demand.actualNeed}</td>
                <td><span class="status-pill ${statusClass(row.metrics.riskStatus)}">${row.metrics.riskStatus}</span></td>
                <td>${itemDetailButton(row.detailSource, row.detailId)}</td>
              </tr>`;
          }).join("") : `<tr><td colspan="13" class="empty-cell">No demand data is available for this phase.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 677

// @legacy-unit 678 5218
export function renderDeptNonMfgDemandMatrix(rows) {
  document.getElementById("deptDemandMatrix").innerHTML = `
    <div class="table-wrap stage-demand-wrap">
      <table class="data-table phase-input-table non-mfg-phase-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Item Master</th>
            <th>Station</th>
            <th>Detail / Spec</th>
            <th>Material No.</th>
            <th>Demand</th>
            <th>Buffer</th>
            <th>Total Demand</th>
            <th>Stock</th>
            <th>Actual Need</th>
            <th>Risk</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => {
            const demand = demandInputBreakdown(row);
            return `
              <tr>
                <td>${normalizedNonMfgDepartment(row) || "-"}</td>
                <td>${itemNameStack(row)}</td>
                <td>${stationDisplay(row)}</td>
                <td class="wrap-cell">${itemDetail(row)}</td>
                <td>${itemKeyDisplay(row)}</td>
                <td>${demand.demand}</td>
                <td>${demand.buffer}</td>
                <td>${demand.totalDemand}</td>
                <td>${demand.stock}</td>
                <td>${demand.actualNeed}</td>
                <td><span class="status-pill ${statusClass(row.metrics.riskStatus)}">${row.metrics.riskStatus}</span></td>
                <td>${itemDetailButton(row.detailSource, row.detailId)}</td>
              </tr>`;
          }).join("") : `<tr><td colspan="12" class="empty-cell">No demand data is available for this phase.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 678

// @legacy-unit 679 5262
export function renderDeptStageTracking() {
  const activeBuyStage = nextBuyStageForProject(currentProject);
  if (!STAGES.includes(currentDeptDemandPhase)) replaceCurrentDeptDemandPhaseBinding(activeBuyStage || currentStageForProject(currentProject));
  const rows = stageDemandRows(currentProject, currentDeptDemandPhase);
  document.getElementById("deptStageBadge").textContent = activeBuyStage
    ? `${currentProject}: current ${currentPhaseLabelForProject(currentProject)} / next buy ${stageLabel(activeBuyStage)}`
    : `${currentProject}: current ${currentPhaseLabelForProject(currentProject)} / manager-defined phase`;
  renderDeptDemandControls(activeBuyStage);
  document.getElementById("deptDemandOverview").innerHTML = summaryCardsHtml(deptDemandSummaryCards(rows, currentDeptDemandMode, currentDeptDemandPhase));
  if (currentDeptDemandMode === "nonMfg") renderDeptNonMfgDemandMatrix(rows);
  else renderDeptMfgDemandMatrix(rows);
}
// @end-legacy-unit 679
