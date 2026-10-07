// materials/display: authoritative source; see docs/module-map.md.
import {
  isOmCatalogRow
} from "../catalog/records.js";
import {
  materialMasterRecordFor
} from "./identity.js";
import {
  statusClass
} from "../shared/format.js";

// @legacy-unit 360 1696
export function itemDetail(row) {
  return row.detail || row.spec || "";
}
// @end-legacy-unit 360

// @legacy-unit 361 1700
export function stripBrandForRequester(value) {
  return String(value || "")
    .replace(/\s*\/\s*Brand\s*:\s*[^,/;]+(?=,|;|$)/gi, "")
    .replace(/\bBrand\s*:\s*[^,/;]+(?=,|;|$)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[,;]\s*$/g, "")
    .trim();
}
// @end-legacy-unit 361

// @legacy-unit 362 1709
export function userVisibleItemDetail(row) {
  const raw = itemDetail(row);
  if (isOmCatalogRow(row) || /responsibility master item/i.test(raw)) {
    return row.name || row.level3 || "Product category";
  }
  return stripBrandForRequester(raw);
}
// @end-legacy-unit 362

// @legacy-unit 563 4048
export function isNewMaterial(row) {
  return row.mode === "New Material"
    || row.source === "new-item-master"
    || row.quoteStatus === "New item"
    || row.quoteStatus === "New Material"
    || row.sourceRecordId?.startsWith("MASTER")
    || row.partNo?.startsWith("NEW-");
}
// @end-legacy-unit 563

// @legacy-unit 564 4057
export function isLegacyMaintenance(row) {
  return row.mode === "Maintain Existing Material";
}
// @end-legacy-unit 564

// @legacy-unit 565 4061
export function isMaterialNoPending(row) {
  return isNewMaterial(row) && !row.materialId && !row.materialNo && !materialMasterRecordFor(row);
}
// @end-legacy-unit 565

// @legacy-unit 566 4065
export function itemType(row, sourceType = "") {
  return sourceType === "suggestion" || isNewMaterial(row) ? "New Material" : "Existing Item";
}
// @end-legacy-unit 566

// @legacy-unit 567 4069
export function itemTypeBadge(row, sourceType = "") {
  const type = itemType(row, sourceType);
  return `<span class="item-type-badge ${statusClass(type)}">${type}</span>`;
}
// @end-legacy-unit 567

// @legacy-unit 568 4074
export function itemDetailButton(sourceType, sourceId) {
  return `<button class="mini return" data-item-detail-source="${sourceType}" data-item-detail-id="${sourceId}">Detail</button>`;
}
// @end-legacy-unit 568

// @legacy-unit 569 4078
export function detailValue(value, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : value;
}
// @end-legacy-unit 569
