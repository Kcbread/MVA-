// materials/maintenance: authoritative source; see docs/module-map.md.
import {
  canRequesterEditRequest
} from "../demand/request-fields.js";
import {
  requests
} from "../demand/state.js";
import {
  openMaterialBatch
} from "./batch.js";
import {
  isMaterialNoPending
} from "./display.js";
import {
  openMaterialEntry
} from "./entry-view.js";
import {
  exactStandardPart,
  isMaintenanceComplete
} from "./standard-names.js";
import {
  advanceNewItemSequenceBinding,
  newItemSelections,
  newItemSequence,
  newItemSuggestions,
  replaceNewItemSelectionsBinding,
  replaceNewItemSuggestionsBinding
} from "./state.js";
import {
  currentProject
} from "../projects/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  setDeptTab,
  setView
} from "../shell/navigation.js";

// @legacy-unit 1163 13744
export function maintenanceSuggestionFromRow(record, { mode = "Maintain Existing Material", useSourceQty = false, targetRequestId = "" } = {}) {
  const suggestion = {
    id: `NIS-${String(advanceNewItemSequenceBinding(1, true)).padStart(4, "0")}`,
    mode,
    project: currentProject,
    sourceRecordId: record.id,
    sourceProject: record.project,
    name: record.standardNameCn || "",
    standardNameCn: record.standardNameCn || "",
    standardNameEn: record.standardNameEn || "",
    standardNameVn: record.standardNameVn || "",
    detail: record.detail || "",
    spec: record.spec || "",
    level1: record.level1 || "",
    level2: record.level2 || "",
    level3: record.level3 || "",
    useCase: useSourceQty
      ? `Maintained from ${record.project} history with source quantity reference.`
      : `Maintained from ${record.project || "legacy"} history before request.`,
    status: "Draft",
    managerReason: "",
    requestId: "",
    masterRecordId: "",
    materialStatus: "",
    standardNameStatus: "",
    targetRequestId,
    sourceQtyMode: useSourceQty,
    submittedAt: "",
    decidedAt: "",
  };
  const standard = exactStandardPart(suggestion);
  if (standard) {
    suggestion.standardNameCn = standard.cn;
    suggestion.standardNameEn = standard.en;
    suggestion.standardNameVn = standard.vn;
    suggestion.name = standard.cn;
  }
  return suggestion;
}
// @end-legacy-unit 1163

// @legacy-unit 1164 13784
export function createMaintenanceDraftFromRecord(record, { mode = "Maintain Existing Material", useSourceQty = false, open = true, targetRequestId = "" } = {}) {
  const suggestion = maintenanceSuggestionFromRow(record, { mode, useSourceQty, targetRequestId });
  replaceNewItemSuggestionsBinding([suggestion, ...newItemSuggestions]);
  replaceNewItemSelectionsBinding(new Set([suggestion.id]));
  if (open) {
    setView("department");
    setDeptTab("request");
    openMaterialEntry(suggestion.id);
  }
  return suggestion;
}
// @end-legacy-unit 1164

// @legacy-unit 1165 13796
export function createMaintenanceDraftFromRequest(row, { open = true } = {}) {
  return createMaintenanceDraftFromRecord({
    ...row,
    id: row.sourceRecordId || row.id,
    project: row.sourceProject || row.project,
  }, {
    open,
    targetRequestId: row.id,
  });
}
// @end-legacy-unit 1165

// @legacy-unit 1178 14177
export function completeSelectedMaterials() {
  const rows = requests.filter((row) =>
    row.project === currentProject
    && canRequesterEditRequest(row)
    && row.selected
    && !isMaintenanceComplete(row)
    && !isMaterialNoPending(row)
  );
  if (!rows.length) {
    showToast("Select at least one legacy request row that needs material information.", "error");
    return;
  }
  const suggestions = rows.map((row) => createMaintenanceDraftFromRequest(row, { open: false }));
  if (suggestions.length === 1) {
    openMaterialEntry(suggestions[0].id);
    return;
  }
  openMaterialBatch(suggestions.map((row) => row.id));
}
// @end-legacy-unit 1178
