// cost/dashboard-view: authoritative source; see docs/module-map.md.
import {
  ensureSelectValue,
  isPriceReviewAnalysisRole,
  priceReviewAnalysisDomIds,
  priceReviewProjectRowsForRole,
  priceReviewSelectedRow,
  priceReviewSelectedRowScope
} from "../approval/analysis-scope.js";
import {
  renderPriceReviewAnalysis,
  renderPriceReviewStationMatrix,
  setApprovalQuantityDetailTabForUnit,
  setPriceReviewScopedQuantityFilters
} from "../approval/analysis-view.js";
import {
  syncPriceReviewSelectionMarkers
} from "../approval/price-review.js";
import {
  itemReviewChangeBadge
} from "../approval/quantity-review.js";
import {
  quantityReviewColumnsForMode,
  quantityReviewModeLabel,
  quantityReviewModeValue,
  quantityReviewSummaryTotals
} from "../approval/quantity-scope.js";
import {
  managerRows
} from "../approval/queues.js";
import {
  approvalQuantityReviewTab,
  currentDemandAnalysisTab,
  replaceCurrentDemandAnalysisTabBinding,
  replaceSelectedManagerQuantityKeyIdBinding,
  replaceSelectedPriceReviewRequestIdBinding,
  selectedManagerQuantityKeyId,
  selectedManagerRequestId,
  selectedPriceReviewRequestId
} from "../approval/state.js";
import {
  reviewStatusCellHtml,
  reviewStatusForRole
} from "../approval/status.js";
import {
  formatCompactCurrencyFromUsd,
  formatMoneyFromUsd
} from "./currency.js";
import {
  managerDemandCostFilters,
  managerDemandCostRows,
  managerDemandCostUnitTotals,
  syncManagerDemandCostFilters
} from "./dashboard-data.js";
import {
  managerDemandCostCellClass,
  managerDemandCostCellImpact,
  managerDemandCostImpactTitle,
  managerDemandCostOverallImpact,
  managerDemandCostScopeLabel,
  renderManagerDemandCostCarryoverCompare,
  renderManagerDemandCostValue
} from "./dashboard-values.js";
import {
  renderManagerQuantityMatrix
} from "./matrix-view.js";
import {
  setManagerQuantitySelectValue
} from "./quantity-dashboard.js";
import {
  currencyDisplay
} from "./state.js";
import {
  managerCarryoverCostSaving,
  managerCarryoverFlowLabels,
  managerCarryoverIsApplied,
  managerCarryoverMovedItemsSummary,
  managerCarryoverNeedsDriReview,
  managerCarryoverRowsForScope,
  managerCarryoverStatusBucket,
  renderManagerCarryoverLedger
} from "../inventory/cost-evidence.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  QUANTITY_DASHBOARD_UNITS,
  STAGE_LABELS
} from "../projects/config.js";
import {
  syncProjectContextFromRow
} from "../projects/review-context.js";
import {
  currentRole
} from "../session/state.js";
import {
  clearNodeContent
} from "../shared/dom.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  setManagerTab
} from "../shell/navigation.js";
import {
  currentPriceReviewTab,
  currentView
} from "../shell/state.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";

// @legacy-unit 757 6444
export function renderManagerDemandCostLineCompare(filters) {
  const container = document.getElementById("managerDemandCostLineCompare");
  if (!container) return;
  const rows = managerCarryoverRowsForScope(filters, true);
  const appliedRows = rows.filter(managerCarryoverIsApplied);
  const savingAmount = appliedRows.reduce((sum, row) => sum + managerCarryoverCostSaving(row), 0);
  const pendingCount = rows.filter((row) => managerCarryoverNeedsDriReview(row) || (!managerCarryoverIsApplied(row) && row.status !== "Rejected")).length;
  const movedItems = managerCarryoverMovedItemsSummary(rows);
  if (!rows.length) {
    container.innerHTML = `
      <div class="line-compare-empty">
        <strong>Line Carryover Impact</strong>
        <span>No carryover rows match ${managerDemandCostScopeLabel(filters)}.</span>
      </div>`;
    return;
  }
  const flows = managerCarryoverFlowLabels(rows).join(" / ");
  const appliedLabel = appliedRows.length ? `${appliedRows.length} applied` : "No applied";
  container.innerHTML = `
    <section class="line-compare-strip" aria-label="Line carryover impact">
      <div class="line-compare-title">
        <strong>Line Carryover Impact</strong>
        <span>${htmlText(flows || "Line flow")} · ${managerDemandCostScopeLabel(filters)}</span>
      </div>
      <div class="line-compare-card saving">
        <span>Cost Saving</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(savingAmount))}">${savingAmount ? `-${formatCompactCurrencyFromUsd(savingAmount)}` : "-"}</strong>
        <small>${appliedLabel}</small>
      </div>
      <div class="line-compare-card pending">
        <span>Needs DRI</span>
        <strong>${pendingCount || "-"}</strong>
        <small>visible, pending confirmation</small>
      </div>
      <div class="line-compare-card moved">
        <span>Moved Items</span>
        <div class="line-compare-moved-list">${movedItems.html}</div>
        <small>${htmlText(movedItems.footer)}</small>
      </div>
    </section>`;
}
// @end-legacy-unit 757

// @legacy-unit 762 6571
export function renderManagerDemandCostUnitSummary(unitTotals, filters, overallImpact) {
  const container = document.getElementById("managerDemandCostUnitSummary");
  if (!container) return;
  const modeLabel = filters.viewMode === "amount" ? "Amount" : "Qty";
  const dashboardMode = approvalQuantityReviewTab === "dashboard";
  const reviewMode = quantityReviewModeValue();
  const reviewLabel = dashboardMode ? "Dashboard" : `${quantityReviewModeLabel(reviewMode)} Detail`;
  const columns = dashboardMode ? QUANTITY_DASHBOARD_UNITS : quantityReviewColumnsForMode(reviewMode);
  const reviewTotals = dashboardMode ? unitTotals : quantityReviewSummaryTotals(filters, reviewMode);
  const overallRows = managerCarryoverRowsForScope(filters, true);
  const overallDisplay = {
    ...columns.reduce((acc, column) => {
      const total = reviewTotals[column] || {};
      acc.originalQty += total.originalQty || 0;
      acc.actualNeedQty += total.actualNeedQty || 0;
      acc.carryoverQty += total.carryoverQty || 0;
      acc.effectiveQty += total.effectiveQty || 0;
      acc.originalAmount += total.originalAmount || 0;
      acc.actualNeedAmount += total.actualNeedAmount || 0;
      acc.savingAmount += total.savingAmount || 0;
      acc.effectiveAmount += total.effectiveAmount || 0;
      acc.row ||= total.row || null;
      return acc;
    }, {
      originalQty: 0,
      actualNeedQty: 0,
      carryoverQty: 0,
      effectiveQty: 0,
      originalAmount: 0,
      actualNeedAmount: 0,
      savingAmount: 0,
      effectiveAmount: 0,
      row: null,
      carryoverRows: [],
    }),
    status: managerCarryoverStatusBucket(overallRows),
    flowLabels: managerCarryoverFlowLabels(overallRows),
  };
  const toggleButtons = dashboardMode
    ? `<span class="quantity-dashboard-legend">MFG = all station total · Non-MFG departments continue right</span>`
    : [DEMAND_TYPE_MFG, DEMAND_TYPE_NON_MFG].map((mode) => `
      <button type="button" class="segmented-btn ${reviewMode === mode ? "active" : ""}" data-approval-quantity-mode="${htmlAttr(mode)}" aria-pressed="${reviewMode === mode ? "true" : "false"}">${mode}</button>
    `).join("");
  container.innerHTML = `
    <div class="demand-cost-summary-head shared-total-highlight shared-total-highlight--band">
      <strong>${reviewLabel} Quantity Review</strong>
      <span>${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"} · ${filters.project || "All projects"} · single-request qty · ${modeLabel}</span>
      <span class="segmented-control quantity-review-mode-switch" role="group" aria-label="Quantity review mode">${toggleButtons}</span>
    </div>
    <div class="table-wrap demand-cost-summary-wrap">
      <table class="data-table demand-cost-summary-table">
        <thead>
          <tr>${columns.map((column) => `<th>${htmlText(column)}</th>`).join("")}<th class="shared-total-highlight shared-total-highlight--cell">Total</th></tr>
        </thead>
        <tbody>
          <tr>
            ${columns.map((column) => {
              const total = reviewTotals[column];
              const dashboardUnit = dashboardMode ? column : reviewMode === DEMAND_TYPE_NON_MFG ? column : "MFG";
              const scopedRows = managerCarryoverRowsForScope({ ...filters, unit: dashboardUnit }, true);
              const impact = {
                ...total,
                status: managerCarryoverStatusBucket(scopedRows),
                flowLabels: managerCarryoverFlowLabels(scopedRows),
              };
              const row = total.row || overallDisplay.row || {};
              const scopeAttrs = row.id
                ? `data-item-quantity-cell="quantity-review" data-item-quantity-review-mode="${htmlAttr(reviewMode)}" data-item-quantity-request="${htmlAttr(row.id)}" data-item-quantity-project="${htmlAttr(row.project || "")}" data-item-quantity-item="${htmlAttr(row.name || "")}" data-item-quantity-phase="${htmlAttr(filters.phase || "")}" ${reviewMode === DEMAND_TYPE_MFG ? `data-item-quantity-station="${htmlAttr(column)}"` : `data-item-quantity-unit="${htmlAttr(column)}"`}`
                : "";
              const buttonAttrs = `${scopeAttrs} data-manager-demand-cost-unit="${htmlAttr(dashboardUnit)}" data-manager-demand-cost-phase="${filters.phase}" data-manager-demand-cost-project="${htmlAttr(row.project || "")}"`;
              return `<td class="${total.originalQty ? managerDemandCostCellClass(impact, "demand-cost-number") : "muted-cell"}" title="${htmlAttr(managerDemandCostImpactTitle(impact))}">${renderManagerDemandCostValue(impact, filters.viewMode, { hasPrice: Boolean(total.effectiveAmount || !total.originalQty), buttonAttrs })}</td>`;
            }).join("")}
            <td class="shared-total-highlight shared-total-highlight--cell ${managerDemandCostCellClass(overallDisplay)}" title="${htmlAttr(managerDemandCostImpactTitle(overallDisplay))}">${renderManagerDemandCostValue(overallDisplay, filters.viewMode, { hasPrice: true, buttonAttrs: overallDisplay.row?.id ? `data-item-quantity-cell="quantity-review-total" data-item-quantity-review-mode="${htmlAttr(reviewMode)}" data-item-quantity-request="${htmlAttr(overallDisplay.row.id)}" data-item-quantity-project="${htmlAttr(overallDisplay.row.project || "")}" data-item-quantity-item="${htmlAttr(overallDisplay.row.name || "")}" data-item-quantity-phase="${htmlAttr(filters.phase || "")}"` : "" })}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 762

// @legacy-unit 763 6650
export function renderManagerDemandCostHead() {
  const head = document.getElementById("managerDemandCostHead");
  if (!head) return;
  const colgroup = document.getElementById("managerDemandCostColgroup");
  if (colgroup) {
    colgroup.innerHTML = `
      <col class="demand-cost-col-review-status">
      <col class="demand-cost-col-request">
      <col class="demand-cost-col-eng">
      <col class="demand-cost-col-cn">
      <col class="demand-cost-col-vn">
      <col class="demand-cost-col-changes">
      <col class="demand-cost-col-price">
      ${QUANTITY_DASHBOARD_UNITS.map(() => `<col class="demand-cost-col-unit">`).join("")}
      <col class="demand-cost-col-total">
      <col class="demand-cost-col-detail">`;
  }
  head.innerHTML = `
    <tr>
      <th colspan="7" class="demand-cost-phase-head">Item Master</th>
      <th colspan="${QUANTITY_DASHBOARD_UNITS.length}" class="demand-cost-phase-head">MFG Total / Non-MFG Department Cost by Selected Phase</th>
      <th colspan="2" class="demand-cost-phase-head shared-total-highlight shared-total-highlight--head">Total</th>
    </tr>
        <tr>
          <th>Review Status</th>
          <th>Request ID</th>
          <th>ENG Name</th>
          <th>CN-ENG Name</th>
          <th>VN Name</th>
          <th>Changes</th>
          <th>Price</th>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `<th class="demand-cost-unit-head" data-demand-cost-unit-group="${htmlAttr(unit)}">${unit}</th>`).join("")}
      <th class="demand-cost-total-head shared-total-highlight shared-total-highlight--head" data-demand-cost-unit-group="total">Total</th>
      <th class="demand-cost-detail-head">Detail</th>
    </tr>`;
}
// @end-legacy-unit 763

// @legacy-unit 764 6687
export function syncManagerDemandCostTableWidth() {
  const table = document.getElementById("managerDemandCostTable");
  if (!table) return;
  const width = 894 + (QUANTITY_DASHBOARD_UNITS.length * 108) + 236;
  table.style.minWidth = `${width}px`;
  table.style.width = `${width}px`;
}
// @end-legacy-unit 764

// @legacy-unit 765 6695
export function clearManagerDemandCostFilters() {
  ["managerDemandCostProjectFilter", "managerDemandCostLineFilter"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  const phase = document.getElementById("managerDemandCostPhaseFilter");
  if (phase) phase.value = "";
  const lineCount = document.getElementById("managerDemandCostLineCount");
  if (lineCount) lineCount.value = "1";
  const viewMode = document.getElementById("managerDemandCostViewMode");
  if (viewMode) viewMode.value = "amount";
  syncManagerQuantityScopeFromDemandCost();
  renderManagerDemandCostDashboard();
  renderManagerQuantityMatrix();
}
// @end-legacy-unit 765

// @legacy-unit 766 6711
export function clearPriceReviewDemandCostFilters() {
  ["priceReviewDemandCostProjectFilter"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  const phase = document.getElementById("priceReviewDemandCostPhaseFilter");
  if (phase) phase.value = "";
  const lineCount = document.getElementById("priceReviewDemandCostLineCount");
  if (lineCount) lineCount.value = "1";
  const viewMode = document.getElementById("priceReviewDemandCostViewMode");
  if (viewMode) viewMode.value = "amount";
  renderPriceReviewAnalysis();
}
// @end-legacy-unit 766

// @legacy-unit 767 6725
export function syncManagerQuantityScopeFromDemandCost() {
  const filters = managerDemandCostFilters();
  setManagerQuantitySelectValue("managerQuantityProjectFilter", filters.project);
  setManagerQuantitySelectValue("managerQuantityLineFilter", filters.requestLine);
  setManagerQuantitySelectValue("managerQuantityPhaseFilter", filters.phase);
}
// @end-legacy-unit 767

// @legacy-unit 824 7491
export function drillManagerDemandCost(unit, phase = "", item = "", project = "", requestId = "") {
  if (currentView === "priceReview" && isPriceReviewAnalysisRole()) {
    const mode = currentPriceReviewTab === "projectReview" ? "tab" : "inline";
    const availableRows = priceReviewProjectRowsForRole(currentRole);
    const selectedDrillRow = requestId ? availableRows.find((row) => row.id === requestId) : null;
    if (selectedDrillRow) {
      replaceSelectedPriceReviewRequestIdBinding(selectedDrillRow.id);
      syncProjectContextFromRow(mode, selectedDrillRow);
      syncPriceReviewSelectionMarkers(selectedDrillRow.id);
    }
    setApprovalQuantityDetailTabForUnit(unit);
    const scope = priceReviewSelectedRowScope(selectedDrillRow || priceReviewSelectedRow(availableRows));
    const desired = QUANTITY_DASHBOARD_UNITS.includes(unit) ? unit : "";
    const demandLine = document.getElementById(priceReviewAnalysisDomIds(mode).demandCost.lineFilter)?.value || "";
    const drillScope = scope ? {
      ...scope,
      project: project || scope.project || "",
      requestLine: demandLine || scope.requestLine || "",
      item: item || scope.item || "",
      phase: phase || "",
      station: desired ? "" : (scope.station || ""),
      demandUnit: desired === "MFG" ? "" : (desired || scope.demandUnit || ""),
      reviewMode: desired === "MFG" ? DEMAND_TYPE_MFG : DEMAND_TYPE_NON_MFG,
    } : null;
    const ids = priceReviewAnalysisDomIds(mode).quantity;
    setPriceReviewScopedQuantityFilters(drillScope, mode);
    ensureSelectValue(ids.projectFilter, drillScope?.project || "");
    ensureSelectValue(ids.lineFilter, drillScope?.requestLine || "");
    if (phase) ensureSelectValue(ids.phaseFilter, phase, stageLabel(phase));
    ensureSelectValue(ids.itemFilter, drillScope?.item || "");
    ensureSelectValue(ids.unitFilter, drillScope?.demandUnit || "");
    if (!desired && unit) ensureSelectValue(ids.itemFilter, item || unit);
    ensureSelectValue(ids.stationFilter, drillScope?.station || "");
    const sortFilter = document.getElementById(ids.sortFilter);
    if (sortFilter) sortFilter.value = "";
    replaceSelectedManagerQuantityKeyIdBinding("");
    renderPriceReviewStationMatrix({ mode, scope: drillScope, role: currentRole, rows: availableRows });
    document.getElementById(ids.table)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (currentView === "manager") {
    setApprovalQuantityDetailTabForUnit(unit);
    const selectedRow = managerRows().find((row) => row.id === selectedManagerRequestId) || managerRows()[0] || null;
    syncProjectContextFromRow("managerAuthorized", selectedRow);
    const scope = priceReviewSelectedRowScope(selectedRow);
    if (!scope) return;
    const desired = QUANTITY_DASHBOARD_UNITS.includes(unit) ? unit : "";
    const demandFilters = managerDemandCostFilters();
    const drillScope = {
      ...scope,
      project: project || scope.project || "",
      requestLine: demandFilters.requestLine || scope.requestLine || "",
      item: item || scope.item || "",
      phase: phase || scope.phase || "",
      station: desired ? "" : (scope.station || ""),
      demandUnit: desired === "MFG" ? "" : (desired || scope.demandUnit || ""),
      reviewMode: desired === "MFG" ? DEMAND_TYPE_MFG : DEMAND_TYPE_NON_MFG,
    };
    ensureSelectValue("managerAuthorizedQuantityProjectFilter", drillScope.project || "");
    ensureSelectValue("managerAuthorizedQuantityLineFilter", drillScope.requestLine || "");
    if (phase) ensureSelectValue("managerAuthorizedQuantityPhaseFilter", phase, stageLabel(phase));
    ensureSelectValue("managerAuthorizedQuantityItemFilter", drillScope.item || "");
    ensureSelectValue("managerAuthorizedQuantityUnitFilter", drillScope.demandUnit || "");
    if (!desired && unit) ensureSelectValue("managerAuthorizedQuantityItemFilter", item || unit);
    ensureSelectValue("managerAuthorizedQuantityStationFilter", drillScope.station || "");
    const sortFilter = document.getElementById("managerAuthorizedQuantitySortFilter");
    if (sortFilter) sortFilter.value = "";
    replaceSelectedManagerQuantityKeyIdBinding("");
    renderPriceReviewStationMatrix({ mode: "managerAuthorized", scope: drillScope, role: currentRole, rows: managerRows() });
    document.getElementById("managerAuthorizedQuantityMatrixTable")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  setApprovalQuantityDetailTabForUnit(unit);
  replaceCurrentDemandAnalysisTabBinding("quantity");
  setManagerTab("analysis");
  const filters = managerDemandCostFilters();
  setManagerQuantitySelectValue("managerQuantityProjectFilter", filters.project);
  setManagerQuantitySelectValue("managerQuantityLineFilter", filters.requestLine);
  if (phase) setManagerQuantitySelectValue("managerQuantityPhaseFilter", phase);
  if (project) setManagerQuantitySelectValue("managerQuantityProjectFilter", project);
  if (item) setManagerQuantitySelectValue("managerQuantityItemFilter", item);
  if (QUANTITY_DASHBOARD_UNITS.includes(unit)) setManagerQuantitySelectValue("managerQuantityUnitFilter", unit);
  else setManagerQuantitySelectValue("managerQuantityItemFilter", unit);
  replaceSelectedManagerQuantityKeyIdBinding("");
  renderManagerQuantityMatrix();
}
// @end-legacy-unit 824

// @legacy-unit 825 7578
export function renderManagerDemandCostDashboard({ showCarryoverEvidence = false } = {}) {
  syncManagerDemandCostFilters();
  const rows = managerDemandCostRows();
  const filters = managerDemandCostFilters();
  const meta = document.getElementById("managerDemandCostCurrencyMeta");
  if (meta) meta.textContent = `${filters.requestLine || "All lines"} · ${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"} · single-request qty · ${currencyDisplay} view`;
  const explain = document.getElementById("managerDemandCostExplain");
  if (explain) {
    explain.innerHTML = `
      <div>
        <strong>Decision Formula</strong>
        <span>Original demand - locked/applied carryover = actual need. Cost cells show ${filters.viewMode === "qty" ? "effective quantity" : `effective ${currencyDisplay} amount`} by unit; Line filters request scope, Line Count remains the multiplier.</span>
      </div>
      <div>
        <strong>Status Meaning</strong>
        <span>Pending carryover is evidence only; it changes cost only after owner lock. Price Pending means quantity is visible but final cost is not approved yet.</span>
      </div>
      <div>
        <strong>Dashboard Columns</strong>
        <span>MFG is all station demand combined. Non-MFG departments continue to the right; use cell buttons or Open Matrix for detail.</span>
      </div>`;
  }
  renderManagerDemandCostHead();
  syncManagerDemandCostTableWidth();
  const body = document.getElementById("managerDemandCostRows");
  if (!body) return;
  const unitTotals = managerDemandCostUnitTotals(rows, filters);
  const overallImpact = managerDemandCostOverallImpact(rows, filters);
  if (showCarryoverEvidence) {
    renderManagerDemandCostCarryoverCompare(overallImpact, filters);
    renderManagerDemandCostLineCompare(filters);
    renderManagerCarryoverLedger("managerDemandCostCarryoverLedger", filters);
  } else {
    clearNodeContent("managerDemandCostCarryoverCompare", "managerDemandCostLineCompare", "managerDemandCostCarryoverLedger");
  }
  renderManagerDemandCostUnitSummary(unitTotals, filters, overallImpact);
  body.innerHTML = rows.length ? rows.map((row) => {
    const rowImpact = QUANTITY_DASHBOARD_UNITS.reduce((acc, unit) => {
      const impact = managerDemandCostCellImpact(row, unit, filters);
      acc.originalQty += impact.originalQty;
      acc.carryoverQty += impact.carryoverQty;
      acc.effectiveQty += impact.effectiveQty;
      acc.originalAmount += impact.originalAmount;
      acc.savingAmount += impact.savingAmount;
      acc.effectiveAmount += impact.effectiveAmount;
      acc.carryoverRows.push(...impact.carryoverRows);
      return acc;
    }, { originalQty: 0, carryoverQty: 0, effectiveQty: 0, originalAmount: 0, savingAmount: 0, effectiveAmount: 0, carryoverRows: [] });
    rowImpact.status = managerCarryoverStatusBucket(rowImpact.carryoverRows);
    rowImpact.flowLabels = managerCarryoverFlowLabels(rowImpact.carryoverRows);
    const reviewStatus = reviewStatusForRole(row.request || {}, currentRole);
    const pipelineClass = `approval-pipeline-${reviewStatus.tone || "pending"}`;
    const activeRowClass = row.requestId === selectedManagerRequestId ? "active-row" : "";
    return `
      <tr class="${activeRowClass} ${pipelineClass}" data-manager-authorized-select-row="${htmlAttr(row.requestId || "")}" data-review-status="${htmlAttr(reviewStatus.label || "")}">
        <td class="review-status-table-cell">${reviewStatusCellHtml(row.request || {}, currentRole)}</td>
        <td class="cell-identity demand-cost-request-cell"><strong>${htmlText(row.requestId || "-")}</strong><div class="reason-text">${htmlText(row.project || "-")}</div></td>
        <td title="${htmlAttr(`${row.item} / ${row.project}`)}"><strong>${row.item}</strong><div class="reason-text">${row.project}</div></td>
        <td title="${htmlAttr(row.cnEngName)}"><div class="quantity-text-clamp">${row.cnEngName}</div></td>
        <td title="${htmlAttr(row.vnName)}"><div class="quantity-text-clamp">${row.vnName}</div></td>
        <td>${itemReviewChangeBadge(row.request || {})}</td>
        <td title="${htmlAttr(row.unitPrice ? `${formatMoneyFromUsd(row.unitPrice)} / ${row.priceSource || "Price"}` : "Price Pending")}">${row.unitPrice ? `${formatMoneyFromUsd(row.unitPrice)}<div class="reason-text">${row.priceSource || "Price"}</div>` : `<span class="status-pill pending">Price Pending</span>`}</td>
        ${QUANTITY_DASHBOARD_UNITS.map((unit) => {
          const impact = managerDemandCostCellImpact(row, unit, filters);
          const buttonAttrs = `data-item-quantity-cell="demand-cost" data-item-quantity-request="${htmlAttr(row.requestId || "")}" data-manager-demand-cost-unit="${htmlAttr(unit)}" data-manager-demand-cost-phase="${filters.phase}" data-manager-demand-cost-project="${htmlAttr(row.project)}" data-manager-demand-cost-item="${htmlAttr(row.item)}" data-item-quantity-project="${htmlAttr(row.project)}" data-item-quantity-item="${htmlAttr(row.item)}" data-item-quantity-phase="${filters.phase}" data-item-quantity-unit="${htmlAttr(unit)}"`;
          return `<td class="demand-cost-unit-cell ${impact.originalQty || impact.carryoverRows.length ? managerDemandCostCellClass(impact, "demand-cost-number") : "muted-cell"}" title="${htmlAttr(managerDemandCostImpactTitle(impact))}">${renderManagerDemandCostValue(impact, filters.viewMode, { hasPrice: Boolean(row.unitPrice), buttonAttrs })}</td>`;
        }).join("")}
        <td class="demand-cost-total-cell shared-total-highlight shared-total-highlight--cell ${managerDemandCostCellClass(rowImpact)}" title="${htmlAttr(managerDemandCostImpactTitle(rowImpact))}">${renderManagerDemandCostValue(rowImpact, filters.viewMode, { hasPrice: Boolean(row.unitPrice) })}</td>
        <td class="demand-cost-detail-cell"><button class="mini return" type="button" data-manager-demand-cost-unit="${htmlAttr(row.item)}">Open Matrix</button></td>
      </tr>`;
  }).join("") : `<tr><td colspan="${QUANTITY_DASHBOARD_UNITS.length + 9}" class="empty-cell">No dashboard demand rows match the selected filters.</td></tr>`;
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 825
