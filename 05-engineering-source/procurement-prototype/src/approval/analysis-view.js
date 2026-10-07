// approval/analysis-view: authoritative source; see docs/module-map.md.
import {
  ensureSelectValue,
  isPriceReviewInlineAnalysisRole,
  priceReviewAnalysisDomIds,
  priceReviewAnalysisRows,
  priceReviewAnalysisScopeLabel,
  priceReviewProjectRowsForRole,
  priceReviewSelectedRow,
  priceReviewSelectedRowScope,
  scopedRowsForAnalysis,
  syncAnalysisFiltersFromManager,
  syncManagerFiltersFromAnalysis
} from "./analysis-scope.js";
import {
  itemReviewChangeBadge
} from "./quantity-review.js";
import {
  approvalQuantityReviewModeFromScope,
  priceReviewDetailScopeForTab,
  setApprovalQuantityReviewMode,
  syncApprovalQuantityReviewTabState,
  syncPriceReviewDetailTitle
} from "./quantity-scope.js";
import {
  approvalQuantityReviewMode,
  approvalQuantityReviewTab,
  priceReviewAnalysisRowsOverride,
  replaceApprovalQuantityReviewModeBinding,
  replaceApprovalQuantityReviewTabBinding,
  replacePriceReviewAnalysisRowsOverrideBinding,
  replaceShouldScrollPriceReviewInlineAnalysisBinding,
  selectedPriceReviewRequestId,
  shouldScrollPriceReviewInlineAnalysis
} from "./state.js";
import {
  approvalPipelineStatus,
  priceReviewPendingOwner,
  reviewStatusCellHtml,
  reviewStatusForRole
} from "./status.js";
import {
  formatCompactCurrencyFromUsd,
  formatMoneyFromUsd
} from "../cost/currency.js";
import {
  renderManagerDemandCostDashboard
} from "../cost/dashboard-view.js";
import {
  approvalQuantityLineSummary,
  managerQuantityColumnCount,
  managerQuantityGroupKey,
  managerQuantityPriceCandidate,
  managerQuantityResolvePrice
} from "../cost/matrix-data.js";
import {
  renderManagerQuantityMatrix
} from "../cost/matrix-view.js";
import {
  setManagerQuantitySelectValue
} from "../cost/quantity-dashboard.js";
import {
  managerQuantityEntryUnit,
  managerQuantityFlattenRows,
  normalizeQuantityDashboardUnit
} from "../cost/quantity-filters.js";
import {
  currencyDisplay
} from "../cost/state.js";
import {
  approvalQuantityReviewModule
} from "../infrastructure/module-adapters.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  QUANTITY_DASHBOARD_UNITS
} from "../projects/config.js";
import {
  activeProjectContext,
  projectContextRowProject,
  projectContextRowsForProject,
  projectContextSwitcherHtml,
  setProjectContextSelectedProject
} from "../projects/review-context.js";
import {
  currentRole
} from "../session/state.js";
import {
  copyAnalysisNodeContent,
  copyAnalysisText
} from "../shared/dom.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlText
} from "../shared/html.js";
import {
  currentPriceReviewTab
} from "../shell/state.js";

// @legacy-unit 811 7204
export function updatePriceReviewAnalysisScopeLabel() {
  const label = priceReviewAnalysisScopeLabel();
  ["priceReviewAnalysisScope", "priceReviewAnalysisScopeSecondary"].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = label;
  });
}
// @end-legacy-unit 811

// @legacy-unit 812 7212
export function updatePriceReviewInlineScopeLabel(scope) {
  const label = scope?.label || "Dashboard / All review rows";
  priceReviewAnalysisDomIds("inline").scopeNodes.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = label;
  });
  const helper = document.getElementById("priceReviewInlineAnalysisHelper");
  if (helper) {
    helper.hidden = currentRole === "dri";
    helper.textContent = scope?.isStock
      ? `Target ${scope.targetLabel || "-"} · Source ${scope.sourceLabel || "-"}`
      : scope
        ? `Project ${scope.project || "-"} · Item ${scope.item || "-"} · ${scope.phase ? stageLabel(scope.phase) : "All phases"}`
        : "Dashboard shows all review rows. Select a row or click a dashboard cell to open station/department detail.";
  }
}
// @end-legacy-unit 812

// @legacy-unit 813 7229
export function setApprovalQuantityDashboardScopeLabel(mode = "inline", label = "All review rows") {
  const ids = priceReviewAnalysisDomIds(mode);
  const node = document.getElementById(ids.demandCost.projectFilter) ? document.getElementById(ids.demandCost.rows) : null;
  const scopeId = ids.scopeNodes.find((id) => id.toLowerCase().includes("demandcost"));
  const scopeNode = scopeId ? document.getElementById(scopeId) : null;
  if (scopeNode) scopeNode.textContent = label;
  return Boolean(node);
}
// @end-legacy-unit 813

// @legacy-unit 814 7238
export function setPriceReviewScopedDemandCostFilters(scope, mode = "tab") {
  const ids = priceReviewAnalysisDomIds(mode).demandCost;
  const lineCount = document.getElementById(ids.lineCount);
  const viewMode = document.getElementById(ids.viewMode);
  ensureSelectValue(ids.projectFilter, scope?.project || "");
  ensureSelectValue(ids.lineFilter, scope?.requestLine || "");
  ensureSelectValue(ids.phaseFilter, scope?.phase || "", scope?.phase ? stageLabel(scope.phase) : "");
  if (lineCount) lineCount.value = "1";
  if (viewMode && !viewMode.value) viewMode.value = "amount";
}
// @end-legacy-unit 814

// @legacy-unit 815 7249
export function setPriceReviewScopedQuantityFilters(scope, mode = "tab") {
  const ids = priceReviewAnalysisDomIds(mode).quantity;
  const sort = document.getElementById(ids.sortFilter);
  ensureSelectValue(ids.projectFilter, scope?.project || "");
  ensureSelectValue(ids.lineFilter, scope?.requestLine || "");
  ensureSelectValue(ids.itemFilter, scope?.item || "");
  ensureSelectValue(ids.phaseFilter, scope?.phase || "", scope?.phase ? stageLabel(scope.phase) : "");
  ensureSelectValue(ids.stationFilter, scope?.station || "");
  ensureSelectValue(ids.unitFilter, scope?.demandUnit || "");
  if (sort && !sort.value) sort.value = "";
}
// @end-legacy-unit 815

// @legacy-unit 816 7261
export function decoratePriceReviewDemandCostCopy(mode = "tab", scope = null) {
  const ids = priceReviewAnalysisDomIds(mode).demandCost;
  const explain = document.getElementById(ids.explain);
  if (!explain) return;
  explain.innerHTML = scope
    ? `<div><strong>Project Context</strong><span>Dashboard remains visible for the active project; the selected item row is highlighted for review.</span></div>`
    : `<div><strong>Project Context</strong><span>MFG combines all station demand; Non-MFG departments continue to the right. Select a cell to drill into detail.</span></div>`;
}
// @end-legacy-unit 816

// @legacy-unit 817 7270
export function renderPriceReviewCostDashboard({ mode = "tab", scope = null, role = currentRole, rows = null, showCarryoverEvidence = false } = {}) {
  const ids = priceReviewAnalysisDomIds(mode);
  const baseRows = Array.isArray(rows) ? rows : priceReviewAnalysisRows(role);
  const activeProject = mode === "managerAuthorized"
    ? activeProjectContext({ mode, scope, rows: baseRows })
    : projectContextRowProject(scope) || "";
  if (mode === "managerAuthorized" && activeProject) setProjectContextSelectedProject(mode, activeProject);
  const dashboardScope = mode === "managerAuthorized" && activeProject
    ? { ...(scope || {}), project: activeProject, phase: "" }
    : scope;
  replacePriceReviewAnalysisRowsOverrideBinding(dashboardScope ? scopedRowsForAnalysis(baseRows, dashboardScope) : baseRows);
  setPriceReviewScopedDemandCostFilters(dashboardScope, mode);
  syncManagerFiltersFromAnalysis(mode, "demandCost");
  if (!dashboardScope?.requestLine) setManagerQuantitySelectValue("managerDemandCostLineFilter", "");
  renderManagerDemandCostDashboard({ showCarryoverEvidence });
  syncAnalysisFiltersFromManager(mode, "demandCost");
  copyAnalysisText("managerDemandCostCurrencyMeta", ids.demandCost.currencyMeta);
  copyAnalysisNodeContent("managerDemandCostUnitSummary", ids.demandCost.unitSummary);
  copyAnalysisNodeContent("managerDemandCostColgroup", ids.demandCost.colgroup);
  copyAnalysisNodeContent("managerDemandCostHead", ids.demandCost.head);
  copyAnalysisNodeContent("managerDemandCostRows", ids.demandCost.rows);
  const managerTable = document.getElementById("managerDemandCostTable");
  const targetTable = document.getElementById(ids.demandCost.table);
  if (managerTable && targetTable) {
    targetTable.style.width = managerTable.style.width;
    targetTable.style.minWidth = managerTable.style.minWidth;
  }
  if (mode !== "inline") {
    copyAnalysisNodeContent("managerDemandCostCarryoverCompare", ids.demandCost.carryoverCompare);
    copyAnalysisNodeContent("managerDemandCostLineCompare", ids.demandCost.lineCompare);
    copyAnalysisNodeContent("managerDemandCostCarryoverLedger", ids.demandCost.carryoverLedger);
  }
  if (mode === "managerAuthorized") {
    const unitSummary = document.getElementById(ids.demandCost.unitSummary);
    if (unitSummary) {
      unitSummary.insertAdjacentHTML("afterbegin", projectContextSwitcherHtml({ mode, rows: baseRows, activeProject }));
    }
  }
  if (mode === "inline" || mode === "managerAuthorized") decoratePriceReviewDemandCostCopy(mode, scope);
  else copyAnalysisNodeContent("managerDemandCostExplain", ids.demandCost.explain);
  updatePriceReviewAnalysisScopeLabel();
}
// @end-legacy-unit 817

// @legacy-unit 818 7313
export function approvalQuantityMatrixRows(sourceRows = []) {
  const groups = new Map();
  managerQuantityFlattenRows(sourceRows).forEach((entry) => {
    const request = entry.request || {};
    const key = managerQuantityGroupKey(request);
    if (!groups.has(key)) {
      const price = managerQuantityResolvePrice([managerQuantityPriceCandidate(request)]);
      const pipeline = approvalPipelineStatus(request, currentRole);
      groups.set(key, {
        id: request.id || key,
        requestId: request.id || "-",
        request,
        project: request.project || "-",
        item: request.name || request.item || "-",
        itemMeta: approvalQuantityLineSummary(request),
        spec: userVisibleItemDetail(request) || itemDetail(request) || "-",
        cells: Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, 0])),
        totalQty: 0,
        unitPriceUsd: price.unitPrice || 0,
        priceSource: price.source || "Price Pending",
        totalAmountUsd: 0,
        price: price.unitPrice ? formatMoneyFromUsd(price.unitPrice) : "Price Pending",
        priceHtml: price.unitPrice
          ? `${formatMoneyFromUsd(price.unitPrice)}<div class="reason-text">${htmlText(price.source || "Price")}</div>`
          : `<span class="status-pill pending">Price Pending</span>`,
        changesHtml: itemReviewChangeBadge(request),
        actionHtml: "",
        detailHtml: "",
        requestMeta: priceReviewPendingOwner(request),
        reviewStatusHtml: reviewStatusCellHtml(request, currentRole),
        reviewStatusLabel: reviewStatusForRole(request, currentRole).label,
        pipeline,
      });
    }
    const group = groups.get(key);
    const unit = managerQuantityEntryUnit(entry);
    if (QUANTITY_DASHBOARD_UNITS.includes(unit)) {
      group.cells[unit] += entry.qty;
      group.totalQty += entry.qty;
    }
  });
  return [...groups.values()]
    .map((row) => ({
      ...row,
      totalAmountUsd: row.unitPriceUsd ? row.totalQty * row.unitPriceUsd : 0,
    }))
    .sort((left, right) => right.totalQty - left.totalQty || `${left.project} ${left.item}`.localeCompare(`${right.project} ${right.item}`));
}
// @end-legacy-unit 818

// @legacy-unit 819 7362
export function renderPriceReviewItemUnitMatrix({ mode = "inline", scope = null, rows = [] } = {}) {
  const ids = priceReviewAnalysisDomIds(mode);
  const sourceRows = Array.isArray(rows) ? rows : [];
  const selectedSourceRow = scope?.row || priceReviewSelectedRow(sourceRows) || sourceRows[0] || null;
  const activeProject = activeProjectContext({ mode, scope: scope || selectedSourceRow, rows: sourceRows });
  if (activeProject) setProjectContextSelectedProject(mode, activeProject);
  const dashboardSourceRows = projectContextRowsForProject(sourceRows, activeProject);
  const dashboardRows = approvalQuantityMatrixRows(dashboardSourceRows);
  const selectedId = selectedSourceRow?.id || selectedPriceReviewRequestId || dashboardRows[0]?.id || "";
  const parts = approvalQuantityReviewModule().renderDashboardParts?.({
    rows: dashboardRows,
    selectedId,
    units: QUANTITY_DASHBOARD_UNITS,
    currency: currencyDisplay,
    formatMoney: formatMoneyFromUsd,
    formatCompactCurrency: formatCompactCurrencyFromUsd,
  });
  if (!parts) return;
  const currencyMeta = document.getElementById(ids.demandCost.currencyMeta);
  const unitSummary = document.getElementById(ids.demandCost.unitSummary);
  const explain = document.getElementById(ids.demandCost.explain);
  const colgroup = document.getElementById(ids.demandCost.colgroup);
  const head = document.getElementById(ids.demandCost.head);
  const body = document.getElementById(ids.demandCost.rows);
  const table = document.getElementById(ids.demandCost.table);
  if (currencyMeta) currencyMeta.textContent = `${currencyDisplay} view`;
  if (unitSummary) {
    unitSummary.innerHTML = `
      ${projectContextSwitcherHtml({ mode, rows: sourceRows, activeProject })}
      ${parts.summaryHtml || ""}`;
  }
  if (explain) {
    explain.innerHTML = dashboardRows.length
      ? `<div><strong>Dashboard</strong><span>Project switcher changes the active project; row selection only changes the highlighted item and detail target.</span></div>`
      : `<div><strong>Dashboard</strong><span>Select a project or review row to load the active project dashboard.</span></div>`;
  }
  if (colgroup) colgroup.innerHTML = parts.colgroup || "";
  if (head) head.innerHTML = parts.head || "";
  if (body) body.innerHTML = parts.rows || "";
  if (table) {
    table.style.width = `${parts.tableWidth}px`;
    table.style.minWidth = `${parts.tableWidth}px`;
  }
  setApprovalQuantityDashboardScopeLabel(mode, activeProject ? `${activeProject} / ${dashboardRows.length} item${dashboardRows.length === 1 ? "" : "s"}` : "Select a project");
}
// @end-legacy-unit 819

// @legacy-unit 820 7408
export function renderPriceReviewStationMatrix({ mode = "tab", scope = null, role = currentRole, rows = null, showCarryoverEvidence = false } = {}) {
  syncPriceReviewDetailTitle(mode);
  const ids = priceReviewAnalysisDomIds(mode);
  const baseRows = Array.isArray(rows) ? rows : priceReviewAnalysisRows(role);
  replacePriceReviewAnalysisRowsOverrideBinding(scope ? scopedRowsForAnalysis(baseRows, scope) : baseRows);
  if (scope) {
    if (approvalQuantityReviewTab === "dashboard") {
      setApprovalQuantityReviewMode(approvalQuantityReviewModeFromScope(scope), { preserveDashboard: true });
    }
    syncApprovalQuantityReviewTabState();
  }
  setPriceReviewScopedQuantityFilters(scope, mode);
  syncManagerFiltersFromAnalysis(mode, "quantity");
  if (!scope?.requestLine) setManagerQuantitySelectValue("managerQuantityLineFilter", "");
  if (!scope?.station) setManagerQuantitySelectValue("managerQuantityStationFilter", "");
  if (!scope?.demandUnit) setManagerQuantitySelectValue("managerQuantityUnitFilter", "");
  renderManagerQuantityMatrix({ showCarryoverEvidence });
  syncAnalysisFiltersFromManager(mode, "quantity");
  copyAnalysisNodeContent("managerQuantityHead", ids.quantity.head);
  copyAnalysisNodeContent("managerQuantityRows", ids.quantity.rows);
  if (mode !== "inline") copyAnalysisNodeContent("managerQuantityCarryoverLedger", ids.quantity.carryoverLedger);
  const managerTable = document.getElementById("managerQuantityMatrixTable");
  const targetTable = document.getElementById(ids.quantity.table);
  if (managerTable && targetTable) {
    targetTable.querySelector("colgroup")?.remove();
    const managerColgroup = managerTable.querySelector("colgroup");
    if (managerColgroup) targetTable.insertAdjacentHTML("afterbegin", managerColgroup.outerHTML.replace(/managerQuantityTableColgroup/g, `${ids.quantity.table}Colgroup`));
    targetTable.style.width = managerTable.style.width;
    targetTable.style.minWidth = managerTable.style.minWidth;
  }
  updatePriceReviewAnalysisScopeLabel();
}
// @end-legacy-unit 820

// @legacy-unit 821 7441
export function renderPriceReviewInlineAnalysis(scope = priceReviewSelectedRowScope()) {
  const container = document.getElementById("priceReviewInlineAnalysis");
  if (!container) return;
  const visible = isPriceReviewInlineAnalysisRole() && currentPriceReviewTab === "pending";
  container.hidden = !visible;
  if (!visible) return;
  const detailScope = approvalQuantityReviewTab === "dashboard"
    ? scope
    : priceReviewDetailScopeForTab(scope, approvalQuantityReviewTab);
  updatePriceReviewInlineScopeLabel(detailScope);
  syncPriceReviewDetailTitle("inline");
  const inlineRows = priceReviewProjectRowsForRole(currentRole);
  if (!scope) {
    const quantityRows = document.getElementById("priceReviewInlineQuantityRows");
    const quantityHead = document.getElementById("priceReviewInlineQuantityHead");
    const quantityTable = document.getElementById("priceReviewInlineQuantityMatrixTable");
    renderPriceReviewItemUnitMatrix({ mode: "inline", scope: null, rows: inlineRows });
    if (quantityHead) quantityHead.innerHTML = "";
    quantityTable?.querySelector("colgroup")?.remove();
    if (quantityRows) quantityRows.innerHTML = `<tr class="quantity-empty-row"><td colspan="${managerQuantityColumnCount()}" class="empty-cell">Select a review item, then click MFG or a Non-MFG department to load detail.</td></tr>`;
    return;
  }
  renderPriceReviewItemUnitMatrix({ mode: "inline", scope, rows: inlineRows });
  if (approvalQuantityReviewTab === "dashboard") {
    const quantityRows = document.getElementById("priceReviewInlineQuantityRows");
    const quantityHead = document.getElementById("priceReviewInlineQuantityHead");
    const quantityTable = document.getElementById("priceReviewInlineQuantityMatrixTable");
    if (quantityHead) quantityHead.innerHTML = "";
    quantityTable?.querySelector("colgroup")?.remove();
    if (quantityRows) quantityRows.innerHTML = `<tr class="quantity-empty-row"><td colspan="${managerQuantityColumnCount()}" class="empty-cell">Click MFG or a Non-MFG department in Dashboard to load item detail.</td></tr>`;
  } else {
    renderPriceReviewStationMatrix({ mode: "inline", scope: detailScope, role: currentRole, rows: inlineRows });
  }
  if (shouldScrollPriceReviewInlineAnalysis) {
    container.scrollIntoView({ behavior: "smooth", block: "start" });
    replaceShouldScrollPriceReviewInlineAnalysisBinding(false);
  }
}
// @end-legacy-unit 821

// @legacy-unit 822 7480
export function setApprovalQuantityDetailTabForUnit(unit = "") {
  const isMfgAggregate = normalizeQuantityDashboardUnit(unit) === "MFG";
  replaceApprovalQuantityReviewModeBinding(isMfgAggregate ? DEMAND_TYPE_MFG : DEMAND_TYPE_NON_MFG);
  replaceApprovalQuantityReviewTabBinding(isMfgAggregate ? "mfg" : "nonMfg");
  syncApprovalQuantityReviewTabState();
}
// @end-legacy-unit 822

// @legacy-unit 823 7487
export function renderPriceReviewAnalysis() {
  replacePriceReviewAnalysisRowsOverrideBinding(null);
}
// @end-legacy-unit 823

export function replaceApprovalQuantityMatrixRowsBinding(value) { approvalQuantityMatrixRows = value; return value; }
