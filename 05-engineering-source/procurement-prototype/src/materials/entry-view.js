// materials/entry-view: authoritative source; see docs/module-map.md.
import {
  materialDuplicateReviewHtml
} from "../catalog/match.js";
import {
  replaceRequestItemPickerQueryBinding,
  requestItemPickerQuery
} from "../catalog/state.js";
import {
  level1Options,
  level2Options,
  level3Options
} from "../catalog/taxonomy.js";
import {
  isLegacyMaintenance
} from "./display.js";
import {
  MATERIAL_STANDARD_NAME_REQUESTED
} from "./identity.js";
import {
  optionTags,
  persistLocalItemDraft,
  updateNewItemField
} from "./new-item.js";
import {
  exactStandardPart,
  standardPartMatchesFor,
  standardPartSearchPrompt
} from "./standard-names.js";
import {
  newItemSelections,
  newItemSuggestions,
  pendingMaterialEntryId,
  replaceNewItemSuggestionsBinding,
  replacePendingMaterialEntryIdBinding
} from "./state.js";
import {
  statusClass
} from "../shared/format.js";
import {
  STANDARD_INLINE_LIMIT
} from "../shell/state.js";

// @legacy-unit 1188 14395
export function materialEntryRow() {
  return newItemSuggestions.find((row) => row.id === pendingMaterialEntryId) || null;
}
// @end-legacy-unit 1188

// @legacy-unit 1189 14399
export function materialEntryFieldId(field) {
  return {
    level1: "materialEntryLevel1",
    level2: "materialEntryLevel2",
    level3: "materialEntryLevel3",
    standardNameCn: "materialEntryStandardNameCn",
    standardNameEn: "materialEntryStandardNameEn",
    standardNameVn: "materialEntryStandardNameVn",
    detail: "materialEntryDetail",
    spec: "materialEntrySpec",
    structuredSpec: "materialEntryStructuredSpec",
    uom: "materialEntryUom",
    estimatedUnitPrice: "materialEntryEstimatedUnitPrice",
    estimatedAmount: "materialEntryEstimatedAmount",
    budgetRemark: "materialEntryBudgetRemark",
    estimateReason: "materialEntryEstimateReason",
    useCase: "materialEntryUseCase",
    duplicateDifference: "materialEntryDuplicateDifference",
    evidenceReference: "materialEntryEvidenceReference",
  }[field];
}
// @end-legacy-unit 1189

// @legacy-unit 1190 14421
export function standardOptionHtml(item, exactStandard) {
  return `
    <button
      class="material-standard-option ${exactStandard?.id === item.id ? "selected" : ""}"
      type="button"
      data-action="selectMaterialStandardName"
      data-material-standard-id="${item.id}"
    >
      <strong>${item.cn}</strong>
      <span>${item.en} / ${item.vn}</span>
      <small>Select</small>
    </button>`;
}
// @end-legacy-unit 1190

// @legacy-unit 1191 14435
export function syncStandardSearchSurface(row, prefix) {
  const standardInput = document.getElementById(`${prefix}StandardNameCn`);
  standardInput.disabled = !row.level3;
  standardInput.placeholder = row.level3 ? "Search CN, EN, VN, or legacy alias within selected LV123" : "Select LV123 first";
  const allOptions = row.standardNameCn ? standardPartMatchesFor(row) : [];
  const standardOptions = allOptions.slice(0, STANDARD_INLINE_LIMIT);
  const exactStandard = exactStandardPart(row);
  const standardResults = document.getElementById(`${prefix}StandardResults`);
  standardResults.innerHTML = row.level3 && standardOptions.length
    ? standardOptions.map((item) => standardOptionHtml(item, exactStandard)).join("")
    : `<p class="material-standard-empty">${row.level3
      ? row.standardNameCn
        ? "No matching standard name in this LV123 category."
        : "Enter a keyword to search standard names in this LV123 category."
      : "Select LV1, LV2, and LV3 to search standard names."}</p>`;
  document.getElementById(`${prefix}StandardCount`).textContent = row.level3
    ? `${allOptions.length} match${allOptions.length === 1 ? "" : "es"}`
    : standardPartSearchPrompt(row);
  const moreRegion = document.getElementById(`${prefix}StandardMore`);
  moreRegion.hidden = allOptions.length <= STANDARD_INLINE_LIMIT;
  document.getElementById(`${prefix}StandardMoreText`).textContent = `${STANDARD_INLINE_LIMIT} of ${allOptions.length} matches shown here.`;
  const proposed = row.standardNameStatus === MATERIAL_STANDARD_NAME_REQUESTED;
  const canPropose = Boolean(row.level3 && row.standardNameCn && !exactStandard);
  document.getElementById(`${prefix}StandardException`).hidden = !canPropose && !proposed;
  document.getElementById(`${prefix}StandardEmpty`).textContent = allOptions.length
    ? "Still cannot find a suitable standard name?"
    : "No suitable standard name found after the LV123 search.";
  document.getElementById(`${prefix}StandardHint`).hidden = !proposed;
}
// @end-legacy-unit 1191

// @legacy-unit 1192 14465
export function syncMaterialEntryFields(row) {
  if (!row) return;
  const unitSelect = document.getElementById("materialEntryUom");
  if (row.uom && ![...unitSelect.options].some((option) => option.value === row.uom)) {
    unitSelect.add(new Option(row.uom, row.uom));
  }
  document.getElementById("materialEntryLevel1").innerHTML = optionTags(level1Options(), row.level1, "Select LV1");
  document.getElementById("materialEntryLevel2").innerHTML = optionTags(level2Options(row.level1), row.level2, row.level1 ? "Select LV2" : "Select LV1 first");
  document.getElementById("materialEntryLevel2").disabled = !row.level1;
  document.getElementById("materialEntryLevel3").innerHTML = optionTags(level3Options(row.level1, row.level2), row.level3, row.level2 ? "Select LV3" : "Select LV2 first");
  document.getElementById("materialEntryLevel3").disabled = !row.level2;
  ["standardNameCn", "standardNameEn", "standardNameVn", "detail", "spec", "structuredSpec", "uom", "estimatedUnitPrice", "estimatedAmount", "budgetRemark", "estimateReason", "useCase", "duplicateDifference", "evidenceReference"].forEach((field) => {
    const input = document.getElementById(materialEntryFieldId(field));
    if (input && input.value !== String(row[field] || "")) input.value = row[field] || "";
  });
  document.querySelectorAll("#materialEntryForm [data-material-legacy-only]").forEach((node) => { node.hidden = Boolean(row.simplifiedEntry); });
  document.querySelector("#materialEntryForm .material-standard-search").hidden = Boolean(row.simplifiedEntry);
  document.getElementById("materialEntryDifferenceField").hidden = !(row.duplicateCandidates || []).length;
  if (row.simplifiedEntry) {
    const input = document.getElementById("materialEntryStandardNameCn");
    input.disabled = false;
    input.placeholder = "Search or enter an item name; enter specifications in the Spec field";
  } else syncStandardSearchSurface(row, "materialEntry");
}
// @end-legacy-unit 1192

// @legacy-unit 1197 14548
export function renderMaterialEntryModal() {
  const row = materialEntryRow();
  if (!row) return closeMaterialEntry();
  const legacy = isLegacyMaintenance(row);
  const searching = row.simplifiedEntry && row.entryStep !== "create";
  document.getElementById("materialEntryNewDetails").hidden = searching;
  document.getElementById("materialEntryCreateChoice").hidden = !searching;
  document.getElementById("materialEntrySource").hidden = Boolean(row.simplifiedEntry && !searching);
  const backButton = document.querySelector("#materialEntryForm .footer-actions .ghost");
  backButton.dataset.action = row.simplifiedEntry ? (searching ? "backToItemSearch" : "returnToItemMatches") : "closeMaterialEntry";
  backButton.textContent = row.simplifiedEntry ? (searching ? "Back to catalog" : "Back to results") : "Cancel";
  document.querySelector('#materialEntryForm [data-action="discardMaterialDraft"]').hidden = !row.simplifiedEntry;
  document.querySelector('#materialEntryForm button[type="submit"]').textContent = "Add to request";
  document.querySelector('#materialEntryForm button[type="submit"]').hidden = searching;
  document.getElementById("materialEntryTitle").textContent = legacy ? "Complete Item Information" : searching ? "Find or add an item" : "Create a new item";
  const mode = document.getElementById("materialEntryMode");
  mode.textContent = legacy ? "Legacy Item Standardization" : "Awaiting item review";
  mode.hidden = Boolean(row.simplifiedEntry);
  mode.className = `status-pill ${statusClass(mode.textContent)}`;
  document.getElementById("materialEntryHelper").textContent = legacy
    ? "This legacy item must be standardized before it can be added to Request."
    : searching ? "Search for an existing item before creating a new one." : "Enter the item details below. New items require review.";
  document.getElementById("materialEntrySource").innerHTML = legacy
    ? `<strong>Source:</strong> ${row.sourceProject || "Legacy history"} · ${row.sourceRecordId || "Source record"}`
    : materialDuplicateReviewHtml(row);
  syncMaterialEntryFields(row);
}
// @end-legacy-unit 1197

// @legacy-unit 1198 14576
export function openMaterialEntry(suggestionId) {
  replacePendingMaterialEntryIdBinding(suggestionId);
  renderMaterialEntryModal();
  document.getElementById("materialEntryModal").hidden = false;
  document.querySelector("#materialEntryModal .modal-card").scrollTop = 0;
  document.getElementById("materialEntryStandardNameCn").focus({ preventScroll: true });
}
// @end-legacy-unit 1198

// @legacy-unit 1199 14584
export function closeMaterialEntry({ discard } = {}) {
  const row = materialEntryRow();
  if (discard === undefined) discard = !row?.simplifiedEntry;
  if (row?.simplifiedEntry && persistLocalItemDraft(row, discard) === false && discard) return;
  if (row?.simplifiedEntry) replaceRequestItemPickerQueryBinding(row.standardNameCn || "");
  if (discard && pendingMaterialEntryId) {
    replaceNewItemSuggestionsBinding(newItemSuggestions.filter((row) => row.id !== pendingMaterialEntryId));
    newItemSelections.delete(pendingMaterialEntryId);
  }
  replacePendingMaterialEntryIdBinding("");
  document.getElementById("materialEntryModal").hidden = true;
  const picker = document.getElementById("requestItemPickerModal");
  const returnTarget = picker && !picker.hidden ? document.getElementById("requestItemPickerQuery") : document.querySelector('[data-action="openRequestItemPicker"]');
  returnTarget?.focus({ preventScroll: true });
}
// @end-legacy-unit 1199

// @legacy-unit 1200 14600
export function updateMaterialEntryField(field, value, { rerender = false } = {}) {
  const row = materialEntryRow();
  if (!row) return;
  updateNewItemField(row.id, field, value);
  if (row.simplifiedEntry) persistLocalItemDraft(materialEntryRow());
  if (row.simplifiedEntry && field === "standardNameCn") {
    const updated = materialEntryRow();
    document.getElementById("materialEntrySource").innerHTML = materialDuplicateReviewHtml(updated);
    document.getElementById("materialEntryDifferenceField").hidden = !(updated.duplicateCandidates || []).length;
    return;
  }
  if (rerender) renderMaterialEntryModal();
}
// @end-legacy-unit 1200

export function replaceMaterialEntryRowBinding(value) { materialEntryRow = value; return value; }
