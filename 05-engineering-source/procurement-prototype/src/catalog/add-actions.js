// catalog/add-actions: authoritative source; see docs/module-map.md.
import {
  itemPickerDemandContext
} from "./context.js";
import {
  isOmCatalogRow,
  omCatalogRows
} from "./records.js";
import {
  historyRequestOverrides
} from "./reuse.js";
import {
  reusableHistoryRecordById
} from "./search-actions.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  createStationBreakdownEntry
} from "../demand/quantity.js";
import {
  requestFromRecord
} from "../demand/records.js";
import {
  renderSelectedDemandLines
} from "../demand/selected-lines.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  updateRequestCarryover
} from "../inventory/suggestions.js";
import {
  STAGES
} from "../projects/config.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  setDeptTab
} from "../shell/navigation.js";

// @legacy-unit 1161 13684
export function addRecord(recordId) {
  const record = purchaseRecords.find((row) => row.id === recordId) || omCatalogRows(currentProject).find((row) => row.id === recordId);
  if (!record) return;
  const context = itemPickerDemandContext();
  const targetProject = context.targetProject;
  const targetPhase = context.targetPhase;
  const zeroStageOverrides = STAGES.reduce((values, stage) => ({ ...values, [stage]: 0 }), {});
  const draft = requestFromRecord(record, {
    ...zeroStageOverrides,
    project: targetProject,
    yearProject: targetProject,
    projectCode: context.targetProjectCode || currentProjectCode,
    phase: targetPhase,
    defaultPhase: targetPhase,
    demandType: context.demandType,
    station: context.station,
    demandUnit: context.demandUnit,
    stationBreakdown: [createStationBreakdownEntry({ ...record, project: targetProject }, {
      phase: targetPhase,
      demandType: context.demandType,
      station: context.station,
      demandUnit: context.demandUnit,
      requestLine: context.requestLine,
      qty: 0,
    })],
    selected: true,
    ...(isOmCatalogRow(record) ? {
      sourceProject: "OM Catalog",
      catalogBucket: record.catalogBucket,
      catalogStatus: record.catalogStatus,
      requesterReason: "Selected from central OM Buy catalog; OM Purchasing will confirm final spec/model where needed.",
    } : {
      requesterReason: "Selected from source item; station breakdown quantity must be entered by Requester / IE.",
    }),
  });
  replaceRequestsBinding([draft, ...requests]);
  updateRequestCarryover({ project: targetProject, phase: targetPhase, demandType: context.demandType });
  renderDepartment();
  renderSelectedDemandLines();
  showToast(`Added to ${targetProject} / ${context.requestLine}. Enter qty in the Request Worksheet.`, "success");
}
// @end-legacy-unit 1161

// @legacy-unit 1162 13726
export function addHistoryRecord(recordId, useSourceQty = false) {
  const record = reusableHistoryRecordById(recordId);
  if (!record) return;
  const context = itemPickerDemandContext();
  const targetProject = context.targetProject;
  const targetPhase = context.targetPhase;
  const draft = requestFromRecord(record, historyRequestOverrides(record, useSourceQty, context));
  replaceRequestsBinding([draft, ...requests]);
  updateRequestCarryover({ project: targetProject, phase: targetPhase, demandType: context.demandType });
  setDeptTab("request");
  renderDepartment();
  renderSelectedDemandLines();
  showToast(useSourceQty
    ? `Copied source quantity to ${targetProject} / ${context.requestLine} / ${stageLabel(targetPhase)}.`
    : `Added item identity to ${targetProject} / ${context.requestLine} / ${stageLabel(targetPhase)}. Quantity starts at 0.`,
  "success");
}
// @end-legacy-unit 1162
