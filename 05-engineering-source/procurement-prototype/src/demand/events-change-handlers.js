// demand/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderItemPickerDemandContext,
  renderRequesterInputContext,
  syncItemPickerDemandContext
} from "../catalog/context.js";
import {
  renderHistoryPackageRows,
  renderHistoryRows
} from "../catalog/history-view.js";
import {
  renderNaturalRows
} from "../catalog/natural-search-view.js";
import {
  hydrateRequestCatalogItems,
  renderRequestItemPicker
} from "../catalog/search.js";
import {
  itemPickerDemandType,
  itemPickerDemandUnit,
  itemPickerRequestLine,
  itemPickerStation,
  replaceRequestItemPickerLevel1Binding,
  replaceRequestItemPickerLevel2Binding,
  replaceRequestItemPickerLevel3Binding
} from "../catalog/state.js";
import {
  renderManagerStageTracking
} from "../cost/stage-view.js";
import {
  demandBaselines,
  replaceDemandBaselinesBinding
} from "../data/state.js";
import {
  renderItemPickerCarryoverSuggestions
} from "../inventory/suggestions.js";
import {
  currentStageForProject
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  renderBaselineSummary
} from "./baseline-setup.js";
import {
  updateDemandEditorField,
  updateStationBreakdownField
} from "./editor.js";
import {
  renderDeptStageTracking
} from "./matrix-view.js";
import {
  clampQty
} from "./quantity.js";
import {
  updateRequestNeedDate,
  updateRequestPurposeLocation,
  updateRequestRequiredDeliveryDate,
  updateStage
} from "./request-fields.js";
import {
  renderSelectedDemandLines,
  updateRequestIntentAction,
  updateSelectedDemandLine
} from "./selected-lines.js";
import {
  replaceCurrentDeptDemandDepartmentBinding,
  replaceCurrentDeptDemandModeBinding,
  replaceCurrentDeptDemandPhaseBinding,
  replaceRequestWorksheetSelectedSourceBinding,
  replaceRequestsBinding,
  requests
} from "./state.js";
import {
  renderRequestRows
} from "./worksheet-actions.js";
import {
  syncRequestWorksheetContext
} from "./worksheet-view.js";
import {
  normalizeWorksheetQtyInput,
  updateRequestDemandUnit,
  updateRequestMatrixQty
} from "./worksheet.js";

export function handleChangeItemPickerDemandTypeSelect(event) {
  if ([
    "itemPickerDemandTypeSelect",
    "itemPickerRequestLineSelect",
    "itemPickerStationSelect",
    "itemPickerDemandUnitSelect",
  ].includes(event.target.id)) {
    syncItemPickerDemandContext({
      demandType: document.getElementById("itemPickerDemandTypeSelect")?.value || itemPickerDemandType,
      requestLine: document.getElementById("itemPickerRequestLineSelect")?.value || itemPickerRequestLine,
      station: document.getElementById("itemPickerStationSelect")?.value || itemPickerStation,
      demandUnit: document.getElementById("itemPickerDemandUnitSelect")?.value || itemPickerDemandUnit,
    });
    renderItemPickerDemandContext();
    renderRequesterInputContext();
    renderRequestRows();
    renderHistoryRows();
    renderNaturalRows();
    renderHistoryPackageRows();
    renderItemPickerCarryoverSuggestions();
    renderSelectedDemandLines();
  }
  if (event.target.id === "requestWorksheetLine") {
    syncRequestWorksheetContext({ requestLine: event.target.value });
    renderRequestRows();
  }
  if (event.target.id === "requestWorksheetAddPhase") {
    syncRequestWorksheetContext({ phase: event.target.value });
    renderRequestRows();
  }
  if (event.target.id === "requestWorksheetSourceSelect") {
    replaceRequestWorksheetSelectedSourceBinding(event.target.value || "");
    renderRequestRows();
  }
  if (event.target.id === "requestItemPickerLevel1") {
    replaceRequestItemPickerLevel1Binding(event.target.value || "");
    replaceRequestItemPickerLevel2Binding("");
    replaceRequestItemPickerLevel3Binding("");
    hydrateRequestCatalogItems({ force: true });
    renderRequestItemPicker();
  }
  if (event.target.id === "requestItemPickerLevel2") {
    replaceRequestItemPickerLevel2Binding(event.target.value || "");
    replaceRequestItemPickerLevel3Binding("");
    hydrateRequestCatalogItems({ force: true });
    renderRequestItemPicker();
  }
  if (event.target.id === "requestItemPickerLevel3") {
    replaceRequestItemPickerLevel3Binding(event.target.value || "");
    hydrateRequestCatalogItems({ force: true });
    renderRequestItemPicker();
  }
}

export function handleChangeDeptDemandMode(event) {
  if (event.target.id === "deptDemandMode") {
    replaceCurrentDeptDemandModeBinding(event.target.value);
    renderDeptStageTracking();
  }
  if (event.target.id === "deptDemandPhase") {
    replaceCurrentDeptDemandPhaseBinding(event.target.value);
    renderDeptStageTracking();
  }
  if (event.target.id === "deptDemandDepartment") {
    replaceCurrentDeptDemandDepartmentBinding(event.target.value);
    renderDeptStageTracking();
  }
}

export function handleChangeSelectRequest(selectRequest, event) {
  if (selectRequest) {
    replaceRequestsBinding(requests.map((row) => row.id === selectRequest ? { ...row, selected: event.target.checked } : row));
  }
}

export function handleChangeRequestNeedDate(requestNeedDate, event) {
  if (requestNeedDate) {
    updateRequestNeedDate(requestNeedDate, event.target.value);
  }
}

export function handleChangeRequestRequiredDeliveryDate(requestRequiredDeliveryDate, event) {
  if (requestRequiredDeliveryDate) updateRequestRequiredDeliveryDate(requestRequiredDeliveryDate, event.target.value);
}

export function handleChangeRequestPurposeLocation(requestPurposeLocation, event) {
  if (requestPurposeLocation) updateRequestPurposeLocation(requestPurposeLocation, event.target.value);
}

export function handleChangeRequestDemandUnit(requestDemandUnit, event) {
  if (requestDemandUnit) updateRequestDemandUnit(requestDemandUnit, event.target.value);
}

export function handleChangeRequestAction(requestAction, event) {
  if (requestAction) updateRequestIntentAction(requestAction, event.target.value);
}

export function handleChangeRequestMatrixQty(requestMatrixQty, event) {
  if (requestMatrixQty) {
    updateRequestMatrixQty(
      requestMatrixQty,
      event.target.dataset.requestMatrixStage || currentStageForProject(currentProject),
      event.target.value
    );
  }
}

export function handleChangeRequestWorksheetQty(requestWorksheetQty, event) {
  if (requestWorksheetQty) {
    normalizeWorksheetQtyInput(event.target, { update: true });
  }
}

export function handleChangeSelectedDemandNeedDate(selectedDemandNeedDate, event) {
  if (selectedDemandNeedDate) updateSelectedDemandLine(selectedDemandNeedDate, "needDate", event.target.value);
}

export function handleChangeSelectedDemandQty(selectedDemandQty, event) {
  if (selectedDemandQty) updateSelectedDemandLine(selectedDemandQty, "qty", event.target.value);
}

export function handleChangeSelectedDemandRemark(selectedDemandRemark, event) {
  if (selectedDemandRemark) updateSelectedDemandLine(selectedDemandRemark, "remark", event.target.value);
}

export function handleChangeStage(stage, requestId, event) {
  if (stage && requestId) updateStage(requestId, stage, event.target.value);
}

export function handleChangeStationBreakdownId(stationBreakdownId, stationBreakdownRow, stationBreakdownField, event) {
  if (stationBreakdownId && stationBreakdownRow && stationBreakdownField) {
    updateStationBreakdownField(stationBreakdownId, stationBreakdownRow, stationBreakdownField, event.target.value);
  }
}

export function handleChangeDemandEditorId(demandEditorId, demandEditorRow, demandEditorField, event) {
  if (demandEditorId && demandEditorRow && demandEditorField) {
    updateDemandEditorField(demandEditorId, demandEditorRow, demandEditorField, event.target.value);
  }
}

export function handleChangeBaselineId(baselineId, event) {
  if (baselineId) {
    replaceDemandBaselinesBinding(demandBaselines.map((row) => row.id === baselineId ? {
      ...row,
      baselineQty: clampQty(event.target.value),
      updatedBy: roleProfiles[currentRole]?.name || "OM Purchasing",
      updatedAt: new Date().toISOString(),
    } : row));
    renderBaselineSummary();
    renderDeptStageTracking();
    renderManagerStageTracking();
  }
}
