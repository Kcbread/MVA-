// materials/batch: authoritative source; see docs/module-map.md.
import {
  level1Options,
  level2Options,
  level3Options
} from "../catalog/taxonomy.js";
import {
  itemDetail
} from "./display.js";
import {
  syncStandardSearchSurface
} from "./entry-view.js";
import {
  MATERIAL_STANDARD_NAME_REQUESTED
} from "./identity.js";
import {
  addSuggestionsToRequest,
  optionTags,
  updateNewItemField
} from "./new-item.js";
import {
  exactStandardPart
} from "./standard-names.js";
import {
  activeBatchMaterialId,
  batchMaterialIds,
  newItemSelections,
  newItemSuggestions,
  replaceActiveBatchMaterialIdBinding,
  replaceBatchMaterialIdsBinding,
  replaceNewItemSuggestionsBinding
} from "./state.js";
import {
  statusClass
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1207 14681
export function batchMaterialRow() {
  return newItemSuggestions.find((row) => row.id === activeBatchMaterialId) || null;
}
// @end-legacy-unit 1207

// @legacy-unit 1208 14685
export function batchFieldId(field) {
  return {
    level1: "materialBatchLevel1",
    level2: "materialBatchLevel2",
    level3: "materialBatchLevel3",
    standardNameCn: "materialBatchStandardNameCn",
    standardNameEn: "materialBatchStandardNameEn",
    standardNameVn: "materialBatchStandardNameVn",
    detail: "materialBatchDetail",
    spec: "materialBatchSpec",
    useCase: "materialBatchUseCase",
  }[field];
}
// @end-legacy-unit 1208

// @legacy-unit 1209 14699
export function isReadyMaterialEntry(row) {
  return Boolean(
    row
    && row.level1
    && row.level2
    && row.level3
    && row.standardNameCn
    && row.standardNameEn
    && row.standardNameVn
    && row.detail
    && row.spec
    && row.useCase
    && (exactStandardPart(row) || row.standardNameStatus === MATERIAL_STANDARD_NAME_REQUESTED)
  );
}
// @end-legacy-unit 1209

// @legacy-unit 1210 14715
export function batchStatus(row) {
  if (!row) return "Needs Information";
  return isReadyMaterialEntry(row) ? "Completed" : "Needs Information";
}
// @end-legacy-unit 1210

// @legacy-unit 1211 14720
export function openMaterialBatch(ids) {
  replaceBatchMaterialIdsBinding([...new Set(ids)].filter((id) => newItemSuggestions.some((row) => row.id === id)));
  if (!batchMaterialIds.length) return;
  replaceActiveBatchMaterialIdBinding(batchMaterialIds[0]);
  document.getElementById("materialBatchModal").hidden = false;
  renderMaterialBatch();
}
// @end-legacy-unit 1211

// @legacy-unit 1212 14728
export function closeMaterialBatch({ discard = true } = {}) {
  if (discard) {
    replaceNewItemSuggestionsBinding(newItemSuggestions.filter((row) => !batchMaterialIds.includes(row.id)));
    batchMaterialIds.forEach((id) => newItemSelections.delete(id));
  }
  replaceBatchMaterialIdsBinding([]);
  replaceActiveBatchMaterialIdBinding("");
  document.getElementById("materialBatchModal").hidden = true;
}
// @end-legacy-unit 1212

// @legacy-unit 1213 14738
export function syncBatchMaterialFields(row) {
  if (!row) return;
  document.getElementById("materialBatchLevel1").innerHTML = optionTags(level1Options(), row.level1, "Select LV1");
  document.getElementById("materialBatchLevel2").innerHTML = optionTags(level2Options(row.level1), row.level2, row.level1 ? "Select LV2" : "Select LV1 first");
  document.getElementById("materialBatchLevel2").disabled = !row.level1;
  document.getElementById("materialBatchLevel3").innerHTML = optionTags(level3Options(row.level1, row.level2), row.level3, row.level2 ? "Select LV3" : "Select LV2 first");
  document.getElementById("materialBatchLevel3").disabled = !row.level2;
  ["standardNameCn", "standardNameEn", "standardNameVn", "detail", "spec", "useCase"].forEach((field) => {
    document.getElementById(batchFieldId(field)).value = row[field] || "";
  });
  document.getElementById("materialBatchSource").innerHTML = `<strong>${row.standardNameCn || row.name || "Legacy item"}</strong><br />Source: ${row.sourceProject || row.project || "Legacy history"} · ${row.sourceRecordId || row.targetRequestId || "Source record"}`;
  syncStandardSearchSurface(row, "materialBatch");
}
// @end-legacy-unit 1213

// @legacy-unit 1214 14752
export function renderMaterialBatch() {
  const rows = batchMaterialIds.map((id) => newItemSuggestions.find((row) => row.id === id)).filter(Boolean);
  if (!rows.length) return closeMaterialBatch({ discard: false });
  if (!rows.some((row) => row.id === activeBatchMaterialId)) replaceActiveBatchMaterialIdBinding(rows[0].id);
  document.getElementById("materialBatchCount").textContent = `${rows.length} item${rows.length === 1 ? "" : "s"}`;
  document.getElementById("materialBatchList").innerHTML = rows.map((row) => `
    <button type="button" class="material-batch-item ${row.id === activeBatchMaterialId ? "active" : ""}" data-batch-material-id="${row.id}">
      <span class="material-batch-item-head">
        <strong>${row.standardNameCn || row.name || "Legacy item"}</strong>
        <span class="status-pill ${statusClass(batchStatus(row))}">${batchStatus(row)}</span>
      </span>
      <small>${row.sourceProject || row.project || "Request"} · ${itemDetail(row) || "Complete detail and spec"}</small>
    </button>`).join("");
  syncBatchMaterialFields(batchMaterialRow());
}
// @end-legacy-unit 1214

// @legacy-unit 1215 14768
export function updateBatchMaterialField(field, value, { rerender = false } = {}) {
  const row = batchMaterialRow();
  if (!row) return;
  updateNewItemField(row.id, field, value);
  if (rerender) renderMaterialBatch();
}
// @end-legacy-unit 1215

// @legacy-unit 1216 14775
export function addCompletedBatchMaterials() {
  const completedIds = batchMaterialIds.filter((id) => isReadyMaterialEntry(newItemSuggestions.find((row) => row.id === id)));
  if (!completedIds.length) {
    showToast("Complete at least one selected material before adding it to Request.", "error");
    return;
  }
  addSuggestionsToRequest(completedIds);
  replaceBatchMaterialIdsBinding(batchMaterialIds.filter((id) => !completedIds.includes(id)));
  if (!batchMaterialIds.length) {
    closeMaterialBatch({ discard: false });
    return;
  }
  replaceActiveBatchMaterialIdBinding(batchMaterialIds[0]);
  renderMaterialBatch();
}
// @end-legacy-unit 1216
