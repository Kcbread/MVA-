// catalog/reuse: authoritative source; see docs/module-map.md.
import {
  itemPickerDemandContext
} from "./context.js";
import {
  historyPackageKey,
  selectedHistoryPackageRows,
  sourceLineForHistory,
  sourcePhaseForHistory
} from "./history-view.js";
import {
  closeRequestItemPicker
} from "./search.js";
import {
  reusableHistoryRecordById
} from "./search-actions.js";
import {
  historySelections,
  itemPickerDemandUnit,
  itemPickerRequestLine,
  itemPickerStation
} from "./state.js";
import {
  clampQty,
  createStationBreakdownEntry,
  stationBreakdownFromRecord,
  stationBreakdownRowTotal
} from "../demand/quantity.js";
import {
  requestFromRecord
} from "../demand/records.js";
import {
  renderSelectedDemandLines
} from "../demand/selected-lines.js";
import {
  lastDemandType,
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  requestCarryoverPhase,
  requestCarryoverProject,
  updateRequestCarryover
} from "../inventory/suggestions.js";
import {
  openMaterialBatch
} from "../materials/batch.js";
import {
  factoryMaterialNoFor
} from "../materials/identity.js";
import {
  createMaintenanceDraftFromRecord
} from "../materials/maintenance.js";
import {
  requiredDeliveryDateForProject,
  stageDateForProject
} from "../projects/calendar.js";
import {
  STAGES,
  projectCodeForRow,
  projectTypeFor
} from "../projects/config.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  setDeptTab
} from "../shell/navigation.js";

// @legacy-unit 1166 13807
export function cloneReusableDemandRows(record, {
  useSourceQty = true,
  targetProject = requestCarryoverProject(),
  targetProjectCode = currentProjectCode,
  targetPhase = requestCarryoverPhase(targetProject),
  requestLine = itemPickerRequestLine,
  demandType = lastDemandType,
  station = itemPickerStation,
  demandUnit = itemPickerDemandUnit,
} = {}) {
  if (useSourceQty && Array.isArray(record?.stationBreakdown) && record.stationBreakdown.length) {
    return record.stationBreakdown.map((item) => createStationBreakdownEntry({ ...record, ...item, project: targetProject }, {
      phase: targetPhase,
      demandType,
      station,
      demandUnit,
      requestLine,
      qty: stationBreakdownRowTotal(item),
      remark: item.remark || "",
    }));
  }
  if (useSourceQty) {
    const rows = stationBreakdownFromRecord({ ...record, project: targetProject });
    const retargetedRows = rows.map((row) => createStationBreakdownEntry({ ...record, ...row, project: targetProject }, {
      phase: targetPhase,
      demandType,
      station,
      demandUnit,
      requestLine,
      qty: stationBreakdownRowTotal(row),
      remark: row.remark || "",
    }));
    if (retargetedRows.some((row) => stationBreakdownRowTotal(row) > 0)) return retargetedRows;
  }
  return [createStationBreakdownEntry({ ...record, project: targetProject }, {
    phase: targetPhase,
    demandType,
    station,
    demandUnit,
    requestLine,
    qty: 0,
  })];
}
// @end-legacy-unit 1166

// @legacy-unit 1167 13851
export function reusableReferenceFields(record) {
  const sourcePhase = sourcePhaseForHistory(record);
  const sourceLine = sourceLineForHistory(record);
  return {
    sourceProject: record.project,
    sourceLine,
    sourceRecordId: record.id,
    sourcePackageId: historyPackageKey(record),
    sourcePhase,
    sourcePoNo: record.poNo || record.buyerPoNo || "",
  };
}
// @end-legacy-unit 1167

// @legacy-unit 1168 13864
export function historyRequestOverrides(record, useSourceQty = true, {
  targetProject = requestCarryoverProject(),
  targetProjectCode = currentProjectCode,
  targetPhase = requestCarryoverPhase(targetProject),
  requestLine = itemPickerRequestLine,
  demandType = lastDemandType,
  station = itemPickerStation,
  demandUnit = itemPickerDemandUnit,
} = {}) {
  const stageOverrides = useSourceQty
    ? {}
    : STAGES.reduce((values, stage) => ({ ...values, [stage]: 0 }), {});
  const referenceBreakdown = cloneReusableDemandRows(record, { useSourceQty, targetProject, targetPhase, requestLine, demandType, station, demandUnit });
  return {
    ...stageOverrides,
    project: targetProject,
    yearProject: targetProject,
    projectCode: targetProjectCode || (targetProject === currentProject ? currentProjectCode : "") || projectCodeForRow(record),
    projectType: projectTypeFor(targetProject),
    phase: targetPhase,
    defaultPhase: targetPhase,
    requestLine,
    demandType,
    station,
    demandUnit,
    lineOpenDate: stageDateForProject(targetProject, targetPhase),
    requiredDeliveryDate: requiredDeliveryDateForProject(targetProject, targetPhase),
    ...reusableReferenceFields(record),
    requestId: "",
    factoryMaterialNo: "",
    sourceFactoryMaterialNo: factoryMaterialNoFor(record),
    materialNo: "",
    pasMaterialNo: "",
    pasDemandNo: "",
    vendor: "",
    vendorPartNo: "",
    quoteDate: "",
    quoteExpiry: "",
    quotationPdf: "",
    quoteExcel: "",
    updatedPrice: "",
    buyerPoNo: "",
    poNo: "",
    poStatus: "",
    buyerStatus: "",
    actualUnitPrice: "",
    actualAmount: "",
    poActualAmount: "",
    stationBreakdown: referenceBreakdown,
    selected: true,
    requesterReason: `Added from ${record.project} / ${sourceLineForHistory(record)} approved history. Source quantity kept as reference only.`,
  };
}
// @end-legacy-unit 1168

// @legacy-unit 1169 13918
export function distributeQtyAcrossRows(rows, totalQtyValue) {
  const total = clampQty(totalQtyValue);
  if (!rows.length) return [];
  const weights = rows.map((row) => stationBreakdownRowTotal(row));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  if (!weightTotal) return rows.map((row, index) => ({ ...row, qty: index === 0 ? total : 0 }));
  let used = 0;
  return rows.map((row, index) => {
    const qty = index === rows.length - 1
      ? Math.max(0, total - used)
      : Math.floor(total * (weights[index] / weightTotal));
    used += qty;
    return { ...row, qty };
  });
}
// @end-legacy-unit 1169

// @legacy-unit 1170 13934
export function copyHistory(useSourceQty = false) {
  const selectedRecords = [...historySelections]
    .map((id) => reusableHistoryRecordById(id))
    .filter(Boolean);
  if (!selectedRecords.length) {
    showToast("Select at least one history item first.", "error");
    return;
  }
  const maintenanceRows = [];
  const context = itemPickerDemandContext();
  const selected = selectedRecords.map((row) => requestFromRecord(row, historyRequestOverrides(row, useSourceQty, context)));
  if (selected.length) replaceRequestsBinding([...selected, ...requests]);
  historySelections.clear();
  if (maintenanceRows.length === 1) {
    createMaintenanceDraftFromRecord(maintenanceRows[0], { useSourceQty });
    showToast(selected.length
      ? "Ready history items were added. Complete the remaining legacy item before it enters Request."
      : "Complete this legacy item before it can be added to Request.", "info");
    return;
  }
  if (maintenanceRows.length > 1) {
    const suggestions = maintenanceRows.map((row) => createMaintenanceDraftFromRecord(row, { useSourceQty, open: false }));
    openMaterialBatch(suggestions.map((row) => row.id));
    showToast(selected.length
      ? "Ready history items were added. Standardize the remaining legacy items in the workbench."
      : "Standardize the selected legacy items before they enter Request.", "info");
    return;
  }
  updateRequestCarryover({ project: context.targetProject, phase: context.targetPhase, demandType: context.demandType });
  setDeptTab("request");
  renderDepartment();
  renderSelectedDemandLines();
  showToast("Selected history items added to Request with zero quantity.", "success");
}
// @end-legacy-unit 1170

// @legacy-unit 1171 13969
export function importHistoryPackage() {
  const sourceRows = selectedHistoryPackageRows();
  if (!sourceRows.length) {
    showToast("No copy demand items match the current source filters.", "error");
    return;
  }
  const context = itemPickerDemandContext();
  const targetProject = context.targetProject;
  const targetPhase = context.targetPhase;
  const imported = sourceRows.map((row) => requestFromRecord(row, historyRequestOverrides(row, false, context)));
  replaceRequestsBinding([...imported, ...requests]);
  updateRequestCarryover({ project: targetProject, phase: targetPhase, demandType: context.demandType });
  setDeptTab("request");
  renderDepartment();
  renderSelectedDemandLines();
  closeRequestItemPicker();
  showToast(`Copied ${imported.length} demand item identities to ${targetProject} / ${context.requestLine}. Quantity starts at 0.`, "success");
}
// @end-legacy-unit 1171
