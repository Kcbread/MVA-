// materials/standard-picker: authoritative source; see docs/module-map.md.
import {
  renderMaterialBatch
} from "./batch.js";
import {
  materialEntryRow,
  renderMaterialEntryModal,
  standardOptionHtml
} from "./entry-view.js";
import {
  MATERIAL_STANDARD_NAME_REQUESTED
} from "./identity.js";
import {
  exactStandardPart,
  standardPartMatchesFor,
  standardPartNameMaster
} from "./standard-names.js";
import {
  activeBatchMaterialId,
  batchMaterialIds,
  newItemSuggestions,
  pendingMaterialEntryId,
  pendingStandardPickerId,
  replaceNewItemSuggestionsBinding,
  replacePendingStandardPickerIdBinding,
  replaceStandardPickerQueryBinding,
  standardPickerQuery
} from "./state.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1201 14614
export function toggleMaterialStandardName() {
  const row = materialEntryRow();
  if (!row) return;
  toggleStandardNameForSuggestion(row.id);
  renderMaterialEntryModal();
}
// @end-legacy-unit 1201

// @legacy-unit 1202 14621
export function toggleStandardNameForSuggestion(suggestionId) {
  replaceNewItemSuggestionsBinding(newItemSuggestions.map((item) => item.id === suggestionId ? {
    ...item,
    standardNameStatus: item.standardNameStatus === MATERIAL_STANDARD_NAME_REQUESTED ? "" : MATERIAL_STANDARD_NAME_REQUESTED,
  } : item));
}
// @end-legacy-unit 1202

// @legacy-unit 1203 14628
export function selectMaterialStandardName(standardId, suggestionId = pendingMaterialEntryId || activeBatchMaterialId) {
  const row = newItemSuggestions.find((item) => item.id === suggestionId);
  if (!row) return;
  const standard = standardPartNameMaster().find((item) =>
    item.id === standardId
    && item.level1 === row.level1
    && item.level2 === row.level2
    && item.level3 === row.level3
  );
  if (!standard) return;
  replaceNewItemSuggestionsBinding(newItemSuggestions.map((item) => item.id === row.id ? {
    ...item,
    name: standard.cn,
    standardNameCn: standard.cn,
    standardNameEn: standard.en,
    standardNameVn: standard.vn,
    standardNameStatus: "",
  } : item));
  if (document.getElementById("standardNamePickerModal") && !document.getElementById("standardNamePickerModal").hidden) closeMaterialStandardPicker();
  if (pendingMaterialEntryId === row.id) renderMaterialEntryModal();
  if (batchMaterialIds.includes(row.id)) renderMaterialBatch();
}
// @end-legacy-unit 1203

// @legacy-unit 1204 14651
export function openMaterialStandardPicker(suggestionId = pendingMaterialEntryId || activeBatchMaterialId) {
  const row = newItemSuggestions.find((item) => item.id === suggestionId);
  if (!row || !row.level3) {
    showToast("Select LV1, LV2, and LV3 before opening all standard names.", "error");
    return;
  }
  replacePendingStandardPickerIdBinding(row.id);
  replaceStandardPickerQueryBinding(row.standardNameCn || "");
  document.getElementById("standardNamePickerQuery").value = standardPickerQuery;
  document.getElementById("standardNamePickerModal").hidden = false;
  renderMaterialStandardPicker();
}
// @end-legacy-unit 1204

// @legacy-unit 1205 14664
export function closeMaterialStandardPicker() {
  replacePendingStandardPickerIdBinding("");
  replaceStandardPickerQueryBinding("");
  document.getElementById("standardNamePickerModal").hidden = true;
}
// @end-legacy-unit 1205

// @legacy-unit 1206 14670
export function renderMaterialStandardPicker() {
  const row = newItemSuggestions.find((item) => item.id === pendingStandardPickerId);
  if (!row) return closeMaterialStandardPicker();
  const rows = standardPartMatchesFor(row, standardPickerQuery);
  document.getElementById("standardNamePickerContext").textContent = `${row.level1} / ${row.level2} / ${row.level3}`;
  document.getElementById("standardNamePickerCount").textContent = `${rows.length} match${rows.length === 1 ? "" : "es"}`;
  document.getElementById("standardNamePickerResults").innerHTML = rows.length
    ? rows.map((item) => standardOptionHtml(item, exactStandardPart(row))).join("")
    : `<p class="material-standard-empty">No standard name matches this keyword in the selected LV123 category.</p>`;
}
// @end-legacy-unit 1206
