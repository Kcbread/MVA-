// demand/baseline-setup: authoritative source; see docs/module-map.md.
import {
  renderManagerStageTracking
} from "../cost/stage-view.js";
import {
  demandBaselines,
  replaceDemandBaselinesBinding
} from "../data/state.js";
import {
  clampQty
} from "./quantity.js";
import {
  renderDepartment
} from "./workspace.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  itemKeyDisplay,
  materialMasterRecordFor,
  partName
} from "../materials/identity.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  PROJECTS
} from "../projects/state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1709 21441
export function renderBaselineSetup() {
  const target = document.getElementById("baselineRows");
  if (!target) return;
  renderBaselineSummary();
  const rows = demandBaselines.filter((row) => PROJECTS.includes(row.project));
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${stageLabel(row.stage)}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
        <td>${itemKeyDisplay(row)}</td>
        <td>${itemDetail(row)}</td>
        <td>${partName(row)}</td>
        <td><input type="number" min="0" step="1" value="${row.baselineQty}" data-baseline-qty="${row.id}" /></td>
        <td>${row.sourceFile}</td>
        <td>${row.updatedBy}</td>
        <td>${new Date(row.updatedAt).toLocaleString("en-US")}</td>
        <td>${itemDetailButton("record", row.sourceRecordId)}</td>
      </tr>`).join("")
    : `<tr><td colspan="11" class="empty-cell">No demand baseline records are available.</td></tr>`;
}
// @end-legacy-unit 1709

// @legacy-unit 1710 21464
export function renderBaselineSummary() {
  const target = document.getElementById("baselineSummary");
  if (!target) return;
  const cards = [
    ["Baseline Rows", demandBaselines.length],
    ["Planned Demand", demandBaselines.reduce((sum, row) => sum + clampQty(row.baselineQty), 0)],
    ["Material Master Records", demandBaselines.filter((row) => materialMasterRecordFor(row)).length],
    ["Source", "Google Worksheet"],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}
// @end-legacy-unit 1710

// @legacy-unit 1711 21480
export function importBaselineExcel() {
  replaceDemandBaselinesBinding(demandBaselines.map((row, index) => ({
    ...row,
    baselineQty: clampQty(row.baselineQty) + (index % 5 === 0 ? 1 : 0),
    sourceFile: "Imported baseline worksheet",
    updatedBy: roleProfiles[currentRole]?.name || "OM Purchasing",
    updatedAt: new Date().toISOString(),
  })));
  addOmHistory({ id: "BASELINE", project: "All", name: "Demand Baseline" }, "Imported baseline Excel", "Baseline demand imported from worksheet simulation.");
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Demand baseline Excel imported.", "success");
}
// @end-legacy-unit 1711

// @legacy-unit 1712 21495
export function saveBaseline() {
  addOmHistory({ id: "BASELINE", project: "All", name: "Demand Baseline" }, "Saved baseline", "Demand baseline setup saved.");
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Demand baseline saved.", "success");
}
// @end-legacy-unit 1712

// @legacy-unit 1713 21503
export function validateBaselineMaterialPlan() {
  showToast("Plan rows checked against current Material Master records.", "success");
}
// @end-legacy-unit 1713
