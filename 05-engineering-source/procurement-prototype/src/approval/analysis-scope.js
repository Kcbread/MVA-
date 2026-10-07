// approval/analysis-scope: authoritative source; see docs/module-map.md.
import {
  adminApprovalSetup
} from "../admin/state.js";
import {
  isPriceReviewStockRow,
  priceReviewPendingRowsForRole
} from "./price-review.js";
import {
  approvalQuantityReviewModeForRow
} from "./quantity-scope.js";
import {
  managerRows,
  priceReviewQueueRows
} from "./queues.js";
import {
  selectedPriceReviewRequestId
} from "./state.js";
import {
  isDeptDriSubmissionPending,
  priceReviewRequiresBudgetApprover
} from "./status.js";
import {
  managerQuantityRequestLine,
  normalizeQuantityDashboardUnit
} from "../cost/quantity-filters.js";
import {
  isPriceReviewReworkRequired,
  isSupersededRequest
} from "../demand/amendments.js";
import {
  requestStageQty,
  stationBreakdownPhaseKey,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  warehouseStockRecords
} from "../inventory/state.js";
import {
  isWarehouseLockedUse,
  warehouseOwnerForTransaction,
  warehouseSourceLabel,
  warehouseTargetLabel
} from "../inventory/warehouse.js";
import {
  ITEM_OWNER_UNIT,
  STATION_MASTER,
  currentStageForProject,
  phaseKeyFromInput
} from "../projects/config.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  normalizeAdminRoleKey
} from "../session/permissions.js";
import {
  rowDemandDepartment
} from "../session/persona.js";
import {
  sessionUserFromRole
} from "../session/session.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize,
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  workspaceConfigForRole
} from "../shell/navigation.js";
import {
  COST_MANAGER_AUTH_APPROVED,
  PRICE_ESCALATION_PENDING_PROJECT_DRI,
  PRICE_ESCALATION_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 768 6732
export function isPriceReviewAnalysisRole(role = currentRole) {
  const config = workspaceConfigForRole(role);
  if (Array.isArray(config.priceReviewTabs)) {
    return config.priceReviewTabs.includes("projectReview")
      || config.priceReviewTabs.includes("approved")
      || isPriceReviewInlineAnalysisRole(role);
  }
  return ["dri", "projectDri"].includes(role);
}
// @end-legacy-unit 768

// @legacy-unit 769 6742
export function isPriceReviewInlineAnalysisRole(role = currentRole) {
  return ["dri", "projectDri"].includes(role);
}
// @end-legacy-unit 769

// @legacy-unit 770 6746
export function priceReviewAnalysisDomIds(mode = "tab") {
  const inline = mode === "inline";
  const managerAuthorized = mode === "managerAuthorized";
  const prefix = managerAuthorized ? "managerAuthorized" : inline ? "priceReviewInline" : "priceReview";
  return {
    scopeNodes: managerAuthorized
      ? ["managerAuthorizedAnalysisScopeBadge", "managerAuthorizedDemandCostScope", "managerAuthorizedQuantityScope"]
      : inline
      ? ["priceReviewInlineAnalysisScopeBadge", "priceReviewInlineDemandCostScope", "priceReviewInlineQuantityScope"]
      : ["priceReviewAnalysisScope", "priceReviewDemandCostScope", "priceReviewAnalysisScopeSecondary"],
    demandCost: {
      projectFilter: `${prefix}DemandCostProjectFilter`,
      lineFilter: `${prefix}DemandCostLineFilter`,
      phaseFilter: `${prefix}DemandCostPhaseFilter`,
      lineCount: `${prefix}DemandCostLineCount`,
      viewMode: `${prefix}DemandCostViewMode`,
      currencyMeta: `${prefix}DemandCostCurrencyMeta`,
      explain: `${prefix}DemandCostExplain`,
      unitSummary: `${prefix}DemandCostUnitSummary`,
      carryoverCompare: `${prefix}DemandCostCarryoverCompare`,
      lineCompare: `${prefix}DemandCostLineCompare`,
      colgroup: `${prefix}DemandCostColgroup`,
      head: `${prefix}DemandCostHead`,
      rows: `${prefix}DemandCostRows`,
      carryoverLedger: `${prefix}DemandCostCarryoverLedger`,
      table: `${prefix}DemandCostTable`,
    },
    quantity: {
      title: `${prefix}QuantityTitle`,
      helper: `${prefix}QuantityHelper`,
      projectFilter: `${prefix}QuantityProjectFilter`,
      lineFilter: `${prefix}QuantityLineFilter`,
      itemFilter: `${prefix}QuantityItemFilter`,
      phaseFilter: `${prefix}QuantityPhaseFilter`,
      stationFilter: `${prefix}QuantityStationFilter`,
      unitFilter: `${prefix}QuantityUnitFilter`,
      sortFilter: `${prefix}QuantitySortFilter`,
      head: `${prefix}QuantityHead`,
      rows: `${prefix}QuantityRows`,
      carryoverLedger: `${prefix}QuantityCarryoverLedger`,
      table: `${prefix}QuantityMatrixTable`,
    },
  };
}
// @end-legacy-unit 770

// @legacy-unit 771 6791
export function priceReviewAnalysisFilterPairs(mode = "tab", kind = "demandCost") {
  const ids = priceReviewAnalysisDomIds(mode);
  if (kind === "demandCost") {
    return [
      [ids.demandCost.projectFilter, "managerDemandCostProjectFilter"],
      [ids.demandCost.lineFilter, "managerDemandCostLineFilter"],
      [ids.demandCost.phaseFilter, "managerDemandCostPhaseFilter"],
      [ids.demandCost.lineCount, "managerDemandCostLineCount"],
      [ids.demandCost.viewMode, "managerDemandCostViewMode"],
    ];
  }
  return [
    [ids.quantity.projectFilter, "managerQuantityProjectFilter"],
    [ids.quantity.lineFilter, "managerQuantityLineFilter"],
    [ids.quantity.itemFilter, "managerQuantityItemFilter"],
    [ids.quantity.phaseFilter, "managerQuantityPhaseFilter"],
    [ids.quantity.stationFilter, "managerQuantityStationFilter"],
    [ids.quantity.unitFilter, "managerQuantityUnitFilter"],
    [ids.quantity.sortFilter, "managerQuantitySortFilter"],
  ];
}
// @end-legacy-unit 771

// @legacy-unit 772 6813
export function syncManagerFiltersFromAnalysis(mode = "tab", kind = "demandCost") {
  priceReviewAnalysisFilterPairs(mode, kind).forEach(([sourceId, targetId]) => {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (!source || !target) return;
    if (target.tagName === "SELECT") ensureSelectValue(targetId, source.value);
    else target.value = source.value;
  });
}
// @end-legacy-unit 772

// @legacy-unit 773 6823
export function syncAnalysisFiltersFromManager(mode = "tab", kind = "demandCost") {
  priceReviewAnalysisFilterPairs(mode, kind).forEach(([targetId, sourceId]) => {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (!source || !target) return;
    if (target.tagName === "SELECT") ensureSelectValue(targetId, source.value);
    else target.value = source.value;
  });
}
// @end-legacy-unit 773

// @legacy-unit 774 6833
export function priceReviewSelectedRow(rows = priceReviewQueueRows()) {
  return rows.find((row) => row.id === selectedPriceReviewRequestId) || null;
}
// @end-legacy-unit 774

// @legacy-unit 775 6837
export function priceReviewSelectedRowPhaseKey(row) {
  if (!row) return "";
  if (isPriceReviewStockRow(row)) return phaseKeyFromInput(row.targetStage || row.phase);
  const breakdownPhase = stationBreakdownRowsForDetail(row)
    .map((item) => stationBreakdownPhaseKey(item) || phaseKeyFromInput(item.phase))
    .find(Boolean);
  return breakdownPhase || phaseKeyFromInput(row.phase) || currentStageForProject(row.project);
}
// @end-legacy-unit 775

// @legacy-unit 776 6846
export function priceReviewSelectedRowLineKey(row) {
  if (!row) return "";
  if (isPriceReviewStockRow(row)) return row.targetLine || row.requestLine || "";
  const lines = [...new Set(stationBreakdownRowsForDetail(row)
    .map((item) => managerQuantityRequestLine(item, row))
    .filter(Boolean))];
  return lines.length === 1 ? lines[0] : "";
}
// @end-legacy-unit 776

// @legacy-unit 777 6855
export function priceReviewSelectedRowStationOrUnit(row) {
  if (!row) return "";
  if (isPriceReviewStockRow(row)) return row.targetStationOrUnit || row.targetStation || "";
  const firstBreakdown = stationBreakdownRowsForDetail(row)[0] || {};
  return firstBreakdown.station || firstBreakdown.demandUnit || "";
}
// @end-legacy-unit 777

// @legacy-unit 778 6862
export function priceReviewSelectedRowDemandUnit(row) {
  const stationOrUnit = priceReviewSelectedRowStationOrUnit(row);
  if (!stationOrUnit) return "";
  if (STATION_MASTER.includes(stationOrUnit)) return "MFG";
  return normalizeQuantityDashboardUnit(stationOrUnit) || "";
}
// @end-legacy-unit 778

// @legacy-unit 779 6869
export function priceReviewSelectedRowItemName(row) {
  return row?.name || row?.item || "";
}
// @end-legacy-unit 779

// @legacy-unit 780 6873
export function ensureSelectValue(selectId, value, label = value) {
  const select = document.getElementById(selectId);
  if (!select) return;
  if (!value) {
    select.value = "";
    return;
  }
  const exists = [...select.options].some((option) => option.value === value);
  if (!exists) select.insertAdjacentHTML("beforeend", `<option value="${htmlAttr(value)}">${htmlText(label, "")}</option>`);
  select.value = value;
}
// @end-legacy-unit 780

// @legacy-unit 781 6885
export function priceReviewMatchesScopedAnalysisRow(row, scope = {}) {
  if (!row) return false;
  const scopedProject = scope.project || "";
  const scopedLine = scope.requestLine || "";
  const scopedItem = normalize(priceReviewSelectedRowItemName(scope.row || scope));
  const scopedPhase = scope.phase || "";
  const rowItem = normalize(priceReviewSelectedRowItemName(row));
  if (scopedProject && row.project !== scopedProject) return false;
  if (scopedLine) {
    const rowLineMatches = isPriceReviewStockRow(row)
      ? [row.targetLine, row.requestLine, row.line].filter(Boolean).includes(scopedLine)
      : stationBreakdownRowsForDetail(row).some((entry) => managerQuantityRequestLine(entry, row) === scopedLine);
    if (!rowLineMatches) return false;
  }
  if (scopedItem && rowItem !== scopedItem) return false;
  if (scopedPhase && requestStageQty(row, scopedPhase) <= 0) return false;
  return true;
}
// @end-legacy-unit 781

// @legacy-unit 782 6904
export function priceReviewSelectedRowScope(row = priceReviewSelectedRow()) {
  if (!row) return null;
  const phase = priceReviewSelectedRowPhaseKey(row);
  const stationOrUnit = priceReviewSelectedRowStationOrUnit(row);
  const demandUnit = priceReviewSelectedRowDemandUnit(row);
  const isStock = isPriceReviewStockRow(row);
  const requestLine = priceReviewSelectedRowLineKey(row);
  const station = STATION_MASTER.includes(stationOrUnit) ? stationOrUnit : "";
  const reviewMode = approvalQuantityReviewModeForRow(row);
  return {
    row,
    isStock,
    reviewMode,
    project: row.project || row.targetProject || "",
    requestLine,
    item: priceReviewSelectedRowItemName(row),
    phase,
    station,
    demandUnit,
    sourceLabel: isStock ? warehouseSourceLabel(row) : "",
    targetLabel: isStock ? warehouseTargetLabel(row) : "",
    label: [
      row.project || row.targetProject || "No project",
      requestLine,
      priceReviewSelectedRowItemName(row) || "No item",
      phase ? stageLabel(phase) : "All phases",
      stationOrUnit || "",
    ].filter(Boolean).join(" / "),
  };
}
// @end-legacy-unit 782

// @legacy-unit 783 6935
export function priceReviewScopedAnalysisRows(scope = priceReviewSelectedRowScope(), role = currentRole) {
  const baseRows = priceReviewAnalysisRows(role);
  if (!scope?.row) return baseRows;
  return baseRows.filter((row) => priceReviewMatchesScopedAnalysisRow(row, scope));
}
// @end-legacy-unit 783

// @legacy-unit 784 6941
export function scopedRowsForAnalysis(baseRows = [], scope = null) {
  if (!scope?.row) return baseRows;
  return baseRows.filter((row) => priceReviewMatchesScopedAnalysisRow(row, scope));
}
// @end-legacy-unit 784

// @legacy-unit 785 6946
export function approvedRowsForRole(role = currentRole) {
  if (role === "dri") {
    const approvedRequests = priceReviewAnalysisRows("dri")
      .filter((row) => Boolean(row.driApprovedAt || row.deptDriSubmissionApprovedAt))
      .filter((row) => !isPriceReviewReworkRequired(row) && row.status !== "Rejected");
    const lockedStock = warehouseStockRecords
      .filter((row) => isWarehouseLockedUse(row) && warehouseOwnerForTransaction(row) === ITEM_OWNER_UNIT)
      .map((row) => ({
        ...row,
        workbenchType: "stockCarryover",
        project: row.targetProject || row.sourceProject || "-",
        name: row.item,
      }));
    return [...approvedRequests, ...lockedStock];
  }
  if (role === "projectDri") {
    return priceReviewAnalysisRows("projectDri")
      .filter((row) => Boolean(row.projectDriApprovedAt))
      .filter((row) => !isPriceReviewReworkRequired(row) && row.status !== "Rejected");
  }
  if (role === "manager") {
    return requests
      .filter((row) => Boolean(row.costManagerAuthorizedAt) || row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_APPROVED)
      .filter((row) => row.status !== "Rejected" && !isSupersededRequest(row));
  }
  return [];
}
// @end-legacy-unit 785

// @legacy-unit 786 6974
export function dedupeReviewRows(rows = []) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = isPriceReviewStockRow(row)
      ? `stock:${row.id || row.targetRequestId || row.item || ""}:${row.month || ""}`
      : `request:${row.id || ""}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
// @end-legacy-unit 786

// @legacy-unit 787 6986
export function roleReviewRows(role = currentRole) {
  if (role === "manager") return managerRows("manager");
  const rows = [
    ...(role === currentRole ? priceReviewPendingRowsForRole() : []),
    ...priceReviewAnalysisRows(role),
    ...approvedRowsForRole(role),
  ];
  return dedupeReviewRows(rows);
}
// @end-legacy-unit 787

// @legacy-unit 788 6996
export function priceReviewProjectRowsForRole(role = currentRole) {
  return roleReviewRows(role);
}
// @end-legacy-unit 788

// @legacy-unit 789 7000
export function normalizePriceReviewScopeValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}
// @end-legacy-unit 789

// @legacy-unit 790 7008
export function priceReviewAnalysisScopeUser(role = currentRole) {
  return adminApprovalSetup.users.find((user) => user.role === role)
    || adminApprovalSetup.users.find((user) => normalizeAdminRoleKey(user.role) === normalizeAdminRoleKey(role))
    || sessionUserFromRole(role);
}
// @end-legacy-unit 790

// @legacy-unit 791 7014
export function priceReviewAnalysisBaseRows(role = currentRole) {
  if (role === "dri") {
    return requests.filter((row) =>
      isDeptDriSubmissionPending(row)
      || Boolean(row.driApprovedAt)
      || Boolean(row.deptDriReviewStatus)
      || row.priceDecisionStatus === PRICE_ESCALATION_REQUIRED
      || Boolean(row.priceApprovalStatus)
    );
  }
  if (role === "projectDri") {
    return requests.filter((row) =>
      Boolean(row.projectDriApprovedAt)
      || Boolean(row.priceEscalationRejectedAt)
      || (
        priceReviewRequiresBudgetApprover(row)
        && (Boolean(row.driApprovedAt) || row.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI)
      )
    );
  }
  return [];
}
// @end-legacy-unit 791

// @legacy-unit 792 7037
export function priceReviewAnalysisRows(role = currentRole) {
  const user = priceReviewAnalysisScopeUser(role);
  const scopeType = user?.scopeType || user?.scope_type || "global";
  const scopeValue = String(user?.scopeValue || user?.scope_value || user?.department || "").trim();
  const normalizedScope = normalizePriceReviewScopeValue(scopeValue);
  const baseRows = priceReviewAnalysisBaseRows(role);
  return baseRows.filter((row) => {
    if (scopeType === "global" || !scopeValue || scopeValue === "All") return true;
    if (scopeType === "department") {
      return normalizePriceReviewScopeValue(rowDemandDepartment(row)) === normalizedScope;
    }
    if (scopeType === "project-mapping") {
      if (scopeValue === "Temporary Budget") {
        return priceReviewRequiresBudgetApprover(row)
          || (role === "projectDri" && Boolean(row.projectDriApprovedAt || row.priceEscalationRejectedAt));
      }
      const normalizedProject = normalizePriceReviewScopeValue(row.project || "");
      const normalizedDepartment = normalizePriceReviewScopeValue(rowDemandDepartment(row));
      const normalizedCategory = normalizePriceReviewScopeValue(row.priceThresholdCategory || "");
      return normalizedProject.includes(normalizedScope)
        || normalizedDepartment.includes(normalizedScope)
        || normalizedCategory.includes(normalizedScope);
    }
    return true;
  });
}
// @end-legacy-unit 792

// @legacy-unit 793 7064
export function priceReviewAnalysisScopeLabel(role = currentRole) {
  const user = priceReviewAnalysisScopeUser(role);
  const scopeType = user?.scopeType || user?.scope_type || "global";
  const scopeValue = user?.scopeValue || user?.scope_value || user?.department || "All";
  const roleLabel = roleProfiles[role]?.name || role;
  const typeLabel = {
    global: "Global",
    department: "Department",
    "project-mapping": "Project Mapping",
  }[scopeType] || scopeType;
  return `${roleLabel} · ${typeLabel}: ${scopeValue}`;
}
// @end-legacy-unit 793

// @legacy-unit 794 7077
export function syncManagerDemandCostFiltersFromPriceReview() {
  syncManagerFiltersFromAnalysis("tab", "demandCost");
}
// @end-legacy-unit 794

// @legacy-unit 795 7081
export function syncPriceReviewDemandCostFiltersFromManager() {
  syncAnalysisFiltersFromManager("tab", "demandCost");
}
// @end-legacy-unit 795

// @legacy-unit 796 7085
export function syncManagerQuantityFiltersFromPriceReview() {
  syncManagerFiltersFromAnalysis("tab", "quantity");
}
// @end-legacy-unit 796

// @legacy-unit 797 7089
export function syncPriceReviewQuantityFiltersFromManager() {
  syncAnalysisFiltersFromManager("tab", "quantity");
}
// @end-legacy-unit 797

export function replacePriceReviewSelectedRowScopeBinding(value) { priceReviewSelectedRowScope = value; return value; }

export function replaceRoleReviewRowsBinding(value) { roleReviewRows = value; return value; }
