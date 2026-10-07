// progress/dashboard: authoritative source; see docs/module-map.md.
import {
  ensureSelectValue
} from "../approval/analysis-scope.js";
import {
  approvalQuantityReviewMode,
  approvalQuantityReviewTab,
  priceReviewAnalysisRowsOverride,
  replaceApprovalQuantityReviewModeBinding,
  replaceApprovalQuantityReviewTabBinding,
  replacePriceReviewAnalysisRowsOverrideBinding,
  replaceSelectedManagerQuantityKeyIdBinding,
  selectedManagerQuantityKeyId
} from "../approval/state.js";
import {
  approvalPipelineStatus
} from "../approval/status.js";
import {
  PROJECT_TYPES
} from "../catalog/taxonomy.js";
import {
  managerDemandCostUnitTotals
} from "../cost/dashboard-data.js";
import {
  managerDemandCostCellClass,
  managerDemandCostImpactTitle,
  renderManagerDemandCostValue
} from "../cost/dashboard-values.js";
import {
  managerQuantityGroupKey,
  managerQuantityPriceCandidate,
  managerQuantityResolvePrice
} from "../cost/matrix-data.js";
import {
  renderManagerQuantityMatrix
} from "../cost/matrix-view.js";
import {
  managerQuantityEntryUnit,
  managerQuantityFlattenRows,
  managerRequestLineSort,
  normalizeQuantityDashboardUnit,
  syncManagerQuantityFilters
} from "../cost/quantity-filters.js";
import {
  currencyDisplay
} from "../cost/state.js";
import {
  isSupersededRequest
} from "../demand/amendments.js";
import {
  clampQty,
  demandTypeFor,
  stationBreakdownHasDemand,
  stationBreakdownRowsForDetail,
  syncRowPhaseQtyFromStationBreakdown
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  managerCarryoverFlowLabels,
  managerCarryoverRowsForScope,
  managerCarryoverStatusBucket
} from "../inventory/cost-evidence.js";
import {
  warehouseStockRecords
} from "../inventory/state.js";
import {
  itemDetail,
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  optionHtml
} from "./demand.js";
import {
  replaceSelectedProjectStatusScopeBinding,
  selectedProjectStatusScope
} from "./state.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  QUANTITY_DASHBOARD_UNITS,
  STAGES,
  STAGE_LABELS,
  currentStageForProject,
  phaseKeyFromInput,
  projectCodeForRow,
  projectCodeOptionsForScope,
  projectScopeLabel,
  projectTypeForRow,
  yearProjectForRow,
  yearProjectOptionsForType
} from "../projects/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  copyAnalysisNodeContent
} from "../shared/dom.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";

// @legacy-unit 470 2969
export function projectStatusScopeFromRow(row = {}) {
  const requestId = row.id || row.targetRequestId || "";
  const firstDemand = (Array.isArray(row.stationBreakdown) ? row.stationBreakdown : [])
    .find((entry) => clampQty(entry.qty) > 0) || {};
  const demandType = demandTypeFor(firstDemand);
  const unit = demandType === DEMAND_TYPE_NON_MFG
    ? normalizeQuantityDashboardUnit(firstDemand.demandUnit || firstDemand.department || firstDemand.process || row.demandUnit)
    : "MFG";
  return {
    requestId,
    unit: unit || "",
    mode: unit && unit !== "MFG" ? "nonMfg" : "mfg",
  };
}
// @end-legacy-unit 470

// @legacy-unit 471 2984
export function syncProjectStatusScopeFromRow(row = null) {
  if (!row) return;
  replaceSelectedProjectStatusScopeBinding(projectStatusScopeFromRow(row));
}
// @end-legacy-unit 471

// @legacy-unit 472 2989
export function projectStatusWarehouseRows() {
  return warehouseStockRecords
    .filter((row) => row.transactionType === "use-candidate")
    .map((row) => ({
      ...row,
      id: row.id || row.targetRequestId,
      workbenchType: "stockCarryover",
      project: row.targetProject || row.project || "-",
      yearProject: row.targetYearProject || row.targetProject || row.yearProject || row.project || "-",
      projectCode: row.targetProjectCode || row.projectCode || "",
      name: row.item || "-",
      detail: row.spec || "-",
      status: row.status || "Pending review",
      submittedAt: row.createdAt || "",
      stationBreakdown: [{
        id: `${row.id || row.targetRequestId}-status`,
        demandType: row.targetStationOrUnit && QUANTITY_DASHBOARD_UNITS.includes(normalizeQuantityDashboardUnit(row.targetStationOrUnit) || "") && normalizeQuantityDashboardUnit(row.targetStationOrUnit) !== "MFG" ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG,
        phase: phaseKeyFromInput(row.targetStage) || currentStageForProject(row.targetProject || row.project),
        station: row.targetStationOrUnit || "",
        demandUnit: normalizeQuantityDashboardUnit(row.targetStationOrUnit) === "MFG" ? "" : (normalizeQuantityDashboardUnit(row.targetStationOrUnit) || DEMAND_UNIT_FALLBACK),
        qty: clampQty(row.qty),
        requestLine: row.targetLine || "",
      }],
    }));
}
// @end-legacy-unit 472

// @legacy-unit 473 3015
export function projectStatusSourceRows() {
  return [...requests, ...projectStatusWarehouseRows()].filter((row) => {
    if (isSupersededRequest(row)) return false;
    return row.status !== "Draft" || row.workbenchType === "stockCarryover";
  });
}
// @end-legacy-unit 473

// @legacy-unit 474 3022
export function projectStatusDashboardFilters() {
  const phaseValue = document.getElementById("projectStatusPhaseFilter")?.value || "";
  return {
    projectType: document.getElementById("projectStatusProjectTypeFilter")?.value || "",
    project: document.getElementById("projectStatusProjectFilter")?.value || "",
    projectCode: document.getElementById("projectStatusProjectCodeFilter")?.value || "",
    requestLine: document.getElementById("projectStatusLineFilter")?.value || "",
    phase: STAGES.includes(phaseValue) ? phaseValue : "",
    lineCount: Math.max(1, clampQty(document.getElementById("projectStatusLineCount")?.value || 1)),
    viewMode: document.getElementById("projectStatusViewMode")?.value || "amount",
  };
}
// @end-legacy-unit 474

// @legacy-unit 475 3035
export function projectStatusDashboardModeLabel(filters = projectStatusDashboardFilters()) {
  return filters.viewMode === "qty" ? "Qty" : "Amount";
}
// @end-legacy-unit 475

// @legacy-unit 476 3039
export function projectStatusRowEntries(row = {}) {
  return managerQuantityFlattenRows([row]);
}
// @end-legacy-unit 476

// @legacy-unit 477 3043
export function projectStatusRowMatchesFilters(row = {}, filters = projectStatusDashboardFilters()) {
  const entries = projectStatusRowEntries(row);
  return (!filters.projectType || projectTypeForRow(row) === filters.projectType)
    && (!filters.project || yearProjectForRow(row) === filters.project)
    && (!filters.projectCode || projectCodeForRow(row) === filters.projectCode)
    && (!filters.requestLine || entries.some((entry) => entry.requestLine === filters.requestLine))
    && (!filters.phase || entries.some((entry) => entry.phase === filters.phase));
}
// @end-legacy-unit 477

// @legacy-unit 478 3052
export function syncProjectStatusFilters(rows = projectStatusSourceRows()) {
  const projectTypeSelect = document.getElementById("projectStatusProjectTypeFilter");
  const projectSelect = document.getElementById("projectStatusProjectFilter");
  const projectCodeSelect = document.getElementById("projectStatusProjectCodeFilter");
  const lineSelect = document.getElementById("projectStatusLineFilter");
  const phaseSelect = document.getElementById("projectStatusPhaseFilter");
  const entries = managerQuantityFlattenRows(rows);
  let selectedProjectType = projectTypeSelect?.value || "";
  if (projectTypeSelect) {
    const currentValue = projectTypeSelect.value || "";
    projectTypeSelect.innerHTML = [
      `<option value="">All project types</option>`,
      ...PROJECT_TYPES.map((type) => `<option value="${type}" ${type === currentValue ? "selected" : ""}>${type}</option>`),
    ].join("");
    projectTypeSelect.value = PROJECT_TYPES.includes(currentValue) ? currentValue : "";
    selectedProjectType = projectTypeSelect.value || "";
  }
  let selectedProject = projectSelect?.value || "";
  if (projectSelect) {
    const currentValue = projectSelect.value || "";
    const projects = yearProjectOptionsForType(selectedProjectType);
    const disabled = selectedProjectType === "Non-G";
    projectSelect.disabled = disabled;
    projectSelect.innerHTML = disabled
      ? `<option value="">Non-G has no Year Project</option>`
      : `<option value="">All year projects</option>${projects.map((project) => `<option value="${htmlAttr(project)}" ${project === currentValue ? "selected" : ""}>${htmlText(project)}</option>`).join("")}`;
    projectSelect.value = !disabled && projects.includes(currentValue) ? currentValue : "";
    selectedProject = projectSelect.value || "";
  }
  if (projectCodeSelect) {
    const currentValue = projectCodeSelect.value || "";
    const projectCodes = projectCodeOptionsForScope({
      projectType: selectedProjectType || (selectedProject ? "G" : ""),
      yearProject: selectedProject,
    });
    projectCodeSelect.innerHTML = `<option value="">All project codes</option>${projectCodes.map((project) => optionHtml(project, currentValue)).join("")}`;
    projectCodeSelect.value = projectCodes.includes(currentValue) ? currentValue : "";
  }
  if (lineSelect) {
    const currentValue = lineSelect.value || "";
    const lines = [...new Set(entries.map((entry) => entry.requestLine).filter(Boolean))]
      .sort(managerRequestLineSort);
    lineSelect.innerHTML = `<option value="">All lines</option>${lines.map((line) => optionHtml(line, currentValue)).join("")}`;
    lineSelect.value = lines.includes(currentValue) ? currentValue : "";
  }
  if (phaseSelect) {
    const currentValue = phaseSelect.value || "";
    const rawPhases = new Set(entries.map((entry) => entry.phase).filter(Boolean));
    const phases = STAGES.filter((stage) => rawPhases.has(stage) || stage === STAGES[0]);
    phaseSelect.innerHTML = `<option value="">All stages</option>${phases.map((stage) => `<option value="${stage}" ${stage === currentValue ? "selected" : ""}>${STAGE_LABELS[stage]}</option>`).join("")}`;
    phaseSelect.value = phases.includes(currentValue) ? currentValue : "";
  }
}
// @end-legacy-unit 478

// @legacy-unit 479 3106
export function filteredProjectStatusRows() {
  const rows = projectStatusSourceRows();
  syncProjectStatusFilters(rows);
  const filters = projectStatusDashboardFilters();
  return rows.filter((row) => projectStatusRowMatchesFilters(row, filters));
}
// @end-legacy-unit 479

// @legacy-unit 480 3113
export function projectStatusDemandCostRows(rows = [], filters = projectStatusDashboardFilters()) {
  const itemGroups = new Map();
  managerQuantityFlattenRows(rows)
    .filter((entry) =>
      (!filters.projectType || projectTypeForRow(entry.request) === filters.projectType)
      && (!filters.project || yearProjectForRow(entry.request) === filters.project)
      && (!filters.projectCode || projectCodeForRow(entry.request) === filters.projectCode)
      && (!filters.requestLine || entry.requestLine === filters.requestLine)
      && (!filters.phase || entry.phase === filters.phase)
    )
    .forEach((entry) => {
      const unit = managerQuantityEntryUnit(entry);
      const key = managerQuantityGroupKey(entry.request);
      if (!itemGroups.has(key)) {
        const price = managerQuantityResolvePrice([managerQuantityPriceCandidate(entry.request)]);
        itemGroups.set(key, {
          key,
          keyId: key.replace(/[^a-z0-9]+/gi, "-"),
          requestId: entry.request.id,
          request: entry.request,
          project: projectScopeLabel(entry.request) || "-",
          projectType: projectTypeForRow(entry.request),
          yearProject: yearProjectForRow(entry.request),
          projectCode: projectCodeForRow(entry.request),
          item: entry.request.name || "-",
          cnEngName: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          vnName: entry.request.vnName || entry.request.localName || "-",
          spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          unitTotals: Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unitName) => [unitName, 0])),
          phaseUnitTotals: Object.fromEntries(STAGES.map((stage) => [stage, Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unitName) => [unitName, 0]))])),
          qty: 0,
          unitPrice: price.unitPrice,
          priceSource: price.source,
          amount: 0,
          pricePending: price.unitPrice ? 0 : 1,
        });
      }
      const item = itemGroups.get(key);
      if (QUANTITY_DASHBOARD_UNITS.includes(unit)) {
        item.unitTotals[unit] += entry.qty;
        if (item.phaseUnitTotals[entry.phase]) item.phaseUnitTotals[entry.phase][unit] += entry.qty;
      }
      item.qty += entry.qty;
      if (item.unitPrice) item.amount += item.unitPrice * entry.qty;
    });
  return [...itemGroups.values()]
    .sort((left, right) => right.qty - left.qty || left.item.localeCompare(right.item));
}
// @end-legacy-unit 480

// @legacy-unit 481 3162
export function projectStatusDashboardImpact(unit, total = {}, filters = projectStatusDashboardFilters()) {
  const carryoverRows = managerCarryoverRowsForScope({ ...filters, unit }, true);
  return {
    ...total,
    status: managerCarryoverStatusBucket(carryoverRows),
    flowLabels: managerCarryoverFlowLabels(carryoverRows),
    carryoverRows,
  };
}
// @end-legacy-unit 481

// @legacy-unit 482 3172
export function projectStatusStageSummaryForUnit(demandRows = [], unit = "") {
  const scopedRows = demandRows
    .filter((row) => Number(row.unitTotals?.[unit] || 0) > 0)
    .map((row) => row.request)
    .filter(Boolean);
  if (!scopedRows.length) return { label: "", tone: "" };
  const statuses = scopedRows
    .map((row) => approvalPipelineStatus(row, currentRole))
    .sort((left, right) => {
      const priority = { pending: 0, revise: 1, denied: 2, sent: 3, approved: 4, po: 5 };
      return (priority[left.tone] ?? 9) - (priority[right.tone] ?? 9);
    });
  const status = statuses[0] || {};
  const stageOwner = status.nextOwner && status.nextOwner !== "Closed"
    ? status.nextOwner
    : status.blockedAtOwner && status.blockedAtOwner !== "Closed"
      ? status.blockedAtOwner
      : "";
  const stageLabel = stageOwner === "Cost Manager" ? "Cost Manager Review" : stageOwner;
  const label = stageLabel || status.decisionStatus || "";
  return { label, tone: status.tone || "pending" };
}
// @end-legacy-unit 482

// @legacy-unit 483 3195
export function renderProjectStatusDashboardHead(filters = projectStatusDashboardFilters()) {
  const head = document.getElementById("projectStatusDashboardHead");
  const colgroup = document.getElementById("projectStatusDashboardColgroup");
  if (colgroup) {
    colgroup.innerHTML = QUANTITY_DASHBOARD_UNITS.map(() => `<col class="demand-cost-col-unit">`).join("");
  }
  if (!head) return;
  head.innerHTML = `
    <tr>
      <th class="dashboard-quantity-review-head shared-total-highlight shared-total-highlight--band" colspan="${QUANTITY_DASHBOARD_UNITS.length}">
        <div class="demand-cost-summary-head demand-cost-summary-head--in-table">
          <strong>Dashboard Quantity Review</strong>
          <span>${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"} · ${[filters.projectType || "All project types", filters.project || "All year projects", filters.projectCode].filter(Boolean).join(" / ")} · single-request qty · ${projectStatusDashboardModeLabel(filters)}</span>
          <span class="quantity-dashboard-legend">MFG = all station total · Non-MFG departments continue right</span>
        </div>
      </th>
    </tr>
    <tr>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `<th class="demand-cost-unit-head" data-demand-cost-unit-group="${htmlAttr(unit)}">${htmlText(unit)}</th>`).join("")}
    </tr>`;
}
// @end-legacy-unit 483

// @legacy-unit 484 3217
export function syncProjectStatusDashboardTableWidth() {
  const table = document.getElementById("projectStatusDashboardTable");
  if (!table) return;
  const width = Math.max(1180, QUANTITY_DASHBOARD_UNITS.length * 108);
  table.style.minWidth = `${width}px`;
  table.style.width = `${width}px`;
}
// @end-legacy-unit 484

// @legacy-unit 485 3225
export function sanitizeReadOnlyDashboardTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll("tbody tr").forEach((row) => {
    const requestId = row.getAttribute("data-manager-authorized-select-row")
      || row.querySelector(".demand-cost-request-cell strong")?.textContent?.trim()
      || "";
    const detailCell = row.querySelector(".demand-cost-detail-cell");
    if (detailCell && requestId) detailCell.innerHTML = itemDetailButton("request", requestId);
  });
  table.querySelectorAll(".item-quantity-inline-actions").forEach((cell) => {
    cell.innerHTML = `<span class="status-pill info">Read-only</span>`;
  });
  table.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (
        attr.name.startsWith("data-item-quantity")
        || attr.name.startsWith("data-manager-demand-cost")
        || attr.name === "data-manager-authorized-select-row"
        || attr.name === "data-cost-manager-authorization"
        || attr.name === "data-manager-review-decision"
        || attr.name === "data-manager-review-action"
        || attr.name === "data-price-review-decision"
      ) {
        node.removeAttribute(attr.name);
      }
    });
  });
}
// @end-legacy-unit 485

// @legacy-unit 486 3255
export function renderProjectStatusDashboard(rows = []) {
  const filters = projectStatusDashboardFilters();
  const demandRows = projectStatusDemandCostRows(rows, filters);
  const unitTotals = managerDemandCostUnitTotals(demandRows, filters);
  const body = document.getElementById("projectStatusDashboardRows");
  const meta = document.getElementById("projectStatusDashboardMeta");
  const summary = document.getElementById("projectStatusDemandCostUnitSummary");
  if (meta) meta.textContent = `${filters.requestLine || "All lines"} · ${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"} · ${currencyDisplay} view`;
  if (summary) summary.innerHTML = "";
  renderProjectStatusDashboardHead(filters);
  syncProjectStatusDashboardTableWidth();
  if (!body) return;
  body.innerHTML = demandRows.length ? `
    <tr>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => {
        const total = unitTotals[unit] || {};
        const impact = projectStatusDashboardImpact(unit, total, filters);
        const stage = projectStatusStageSummaryForUnit(demandRows, unit);
        impact.projectStatusStage = stage.label;
        impact.projectStatusTone = stage.tone;
        const mode = unit === "MFG" ? "mfg" : "nonMfg";
        const buttonAttrs = `data-project-status-cell="" data-project-status-unit="${htmlAttr(unit)}" data-project-status-mode="${htmlAttr(mode)}"`;
        return `<td class="${total.originalQty ? managerDemandCostCellClass(impact, "demand-cost-number") : "muted-cell"}" title="${htmlAttr(managerDemandCostImpactTitle(impact))}">${renderManagerDemandCostValue(impact, filters.viewMode, { hasPrice: Boolean(total.effectiveAmount || !total.originalQty), buttonAttrs })}</td>`;
      }).join("")}
    </tr>` : `<tr><td colspan="${QUANTITY_DASHBOARD_UNITS.length}" class="empty-cell">No dashboard demand rows match the selected filters.</td></tr>`;
  sanitizeReadOnlyDashboardTable("projectStatusDashboardTable");
}
// @end-legacy-unit 486

// @legacy-unit 487 3283
export function projectStatusMatrixRows(rows = [], mode = "mfg") {
  const reviewMode = mode === "nonMfg" ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG;
  return rows.map((row) => {
    const stationBreakdown = stationBreakdownRowsForDetail(row)
      .filter((entry) => demandTypeFor(entry) === reviewMode);
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  }).filter(stationBreakdownHasDemand);
}
// @end-legacy-unit 487

// @legacy-unit 488 3292
export function preserveManagerQuantityFilterValues() {
  return Object.fromEntries([
    "managerQuantityProjectFilter",
    "managerQuantityLineFilter",
    "managerQuantityItemFilter",
    "managerQuantityPhaseFilter",
    "managerQuantityStationFilter",
    "managerQuantityUnitFilter",
    "managerQuantitySortFilter",
  ].map((id) => [id, document.getElementById(id)?.value || ""]));
}
// @end-legacy-unit 488

// @legacy-unit 489 3304
export function restoreManagerQuantityFilterValues(values = {}) {
  Object.entries(values).forEach(([id, value]) => {
    const control = document.getElementById(id);
    if (control) control.value = value;
  });
}
// @end-legacy-unit 489

// @legacy-unit 490 3311
export function sanitizeProjectStatusMatrixTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll(".item-quantity-inline-actions").forEach((cell) => {
    cell.innerHTML = `<span class="status-pill info">Read-only</span>`;
  });
  table.querySelectorAll("[data-item-quantity-cell]").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (attr.name.startsWith("data-item-quantity")) node.removeAttribute(attr.name);
    });
  });
  table.querySelectorAll("[data-cost-manager-authorization]").forEach((node) => {
    node.removeAttribute("data-cost-manager-authorization");
    node.removeAttribute("data-cost-manager-action");
  });
  table.querySelectorAll("[data-manager-review-decision]").forEach((node) => {
    node.removeAttribute("data-manager-review-decision");
    node.removeAttribute("data-manager-review-action");
  });
  table.querySelectorAll("[data-manager-quantity-detail]").forEach((node) => {
    node.removeAttribute("data-manager-quantity-detail");
    node.textContent = "Detail";
  });
}
// @end-legacy-unit 490

// @legacy-unit 491 3336
export function copyManagerQuantityMatrixToProjectStatus({ headId, rowsId, tableId }) {
  copyAnalysisNodeContent("managerQuantityHead", headId);
  copyAnalysisNodeContent("managerQuantityRows", rowsId);
  const managerTable = document.getElementById("managerQuantityMatrixTable");
  const targetTable = document.getElementById(tableId);
  if (managerTable && targetTable) {
    targetTable.querySelector("colgroup")?.remove();
    const colgroup = managerTable.querySelector("colgroup");
    if (colgroup) targetTable.insertAdjacentHTML("afterbegin", colgroup.outerHTML);
    targetTable.style.width = managerTable.style.width;
    targetTable.style.minWidth = managerTable.style.minWidth;
  }
  sanitizeProjectStatusMatrixTable(tableId);
}
// @end-legacy-unit 491

// @legacy-unit 492 3351
export function renderProjectStatusMatrixDetail(rows = [], mode = "mfg") {
  const matrixRows = projectStatusMatrixRows(rows, mode);
  const filters = projectStatusDashboardFilters();
  const previousOverride = priceReviewAnalysisRowsOverride;
  const previousMode = approvalQuantityReviewMode;
  const previousTab = approvalQuantityReviewTab;
  const previousFilters = preserveManagerQuantityFilterValues();
  const previousSelectedKey = selectedManagerQuantityKeyId;
  replacePriceReviewAnalysisRowsOverrideBinding(matrixRows);
  replaceApprovalQuantityReviewModeBinding(mode === "nonMfg" ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG);
  replaceApprovalQuantityReviewTabBinding(mode === "nonMfg" ? "nonMfg" : "mfg");
  syncManagerQuantityFilters();
  ensureSelectValue("managerQuantityProjectFilter", filters.project);
  ensureSelectValue("managerQuantityLineFilter", filters.requestLine);
  ensureSelectValue("managerQuantityPhaseFilter", filters.phase, filters.phase ? STAGE_LABELS[filters.phase] : "");
  ["managerQuantityItemFilter", "managerQuantityStationFilter", "managerQuantityUnitFilter", "managerQuantitySortFilter"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  replaceSelectedManagerQuantityKeyIdBinding("");
  renderManagerQuantityMatrix({ showCarryoverEvidence: false });
  copyManagerQuantityMatrixToProjectStatus({
    headId: mode === "nonMfg" ? "projectStatusNonMfgHead" : "projectStatusMfgHead",
    rowsId: mode === "nonMfg" ? "projectStatusNonMfgRows" : "projectStatusMfgRows",
    tableId: mode === "nonMfg" ? "projectStatusNonMfgMatrixTable" : "projectStatusMfgMatrixTable",
  });
  replacePriceReviewAnalysisRowsOverrideBinding(previousOverride);
  replaceApprovalQuantityReviewModeBinding(previousMode);
  replaceApprovalQuantityReviewTabBinding(previousTab);
  replaceSelectedManagerQuantityKeyIdBinding(previousSelectedKey);
  syncManagerQuantityFilters();
  restoreManagerQuantityFilterValues(previousFilters);
}
// @end-legacy-unit 492

// @legacy-unit 493 3385
export function syncProjectStatusTabs() {
  document.querySelectorAll("[data-project-status-panel]").forEach((panel) => {
    panel.classList.add("active");
    panel.hidden = false;
  });
}
// @end-legacy-unit 493

// @legacy-unit 494 3392
export function renderProjectStatus() {
  syncProjectStatusTabs();
  const rows = filteredProjectStatusRows();
  renderProjectStatusDashboard(rows);
  const detailScope = selectedProjectStatusScope.requestId ? {
    requestId: selectedProjectStatusScope.requestId,
    unit: selectedProjectStatusScope.unit === "MFG" ? "" : selectedProjectStatusScope.unit,
  } : {};
  const detailRows = detailScope.requestId
    ? rows.filter((row) => (row.id || row.targetRequestId) === detailScope.requestId)
    : rows;
  renderProjectStatusMatrixDetail(detailRows, "mfg");
  renderProjectStatusMatrixDetail(detailRows, "nonMfg");
  const mfgScope = document.getElementById("projectStatusMfgScope");
  const nonMfgScope = document.getElementById("projectStatusNonMfgScope");
  if (mfgScope) mfgScope.textContent = selectedProjectStatusScope.requestId ? `${selectedProjectStatusScope.requestId} / MFG` : "All MFG rows";
  if (nonMfgScope) nonMfgScope.textContent = selectedProjectStatusScope.requestId ? `${selectedProjectStatusScope.requestId} / ${selectedProjectStatusScope.unit || "All departments"}` : "All Non-MFG rows";
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 494

export function replaceProjectStatusScopeFromRowBinding(value) { projectStatusScopeFromRow = value; return value; }

export function replaceRenderProjectStatusBinding(value) { renderProjectStatus = value; return value; }
