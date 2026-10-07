// materials/standard-names: authoritative source; see docs/module-map.md.
import {
  isOmCatalogRow
} from "../catalog/records.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "./display.js";
import {
  MATERIAL_STATUS_ACTIVE,
  STANDARD_PART_NAME_SEEDS,
  factoryMaterialNoFor,
  materialMasterRecordFor,
  partName
} from "./identity.js";
import {
  OM_CATALOG_ITEMS,
  omResponsibilityMatch
} from "../om/ownership.js";
import {
  normalize,
  stableHash
} from "../shared/format.js";
import {
  STANDARD_INLINE_LIMIT
} from "../shell/state.js";

// @legacy-unit 363 1717
export function standardPartNameFromRow(row) {
  return row.standardNameCn || row.name || "";
}
// @end-legacy-unit 363

// @legacy-unit 364 1721
export function standardPartNameMaster() {
  const rows = [
    ...STANDARD_PART_NAME_SEEDS,
    ...purchaseRecords.map((record) => ({
      cn: record.standardNameCn || record.name,
      en: record.standardNameEn || record.name,
      vn: record.standardNameVn || record.name,
      level1: record.level1 || "",
      level2: record.level2 || "",
      level3: record.level3 || "",
      aliases: [record.name, itemDetail(record), partName(record), record.partNo].filter(Boolean),
    })),
    ...OM_CATALOG_ITEMS.map((item) => ({
      cn: item.name,
      en: item.name,
      vn: item.name,
      level1: "生產設備與工具",
      level2: item.level2,
      level3: item.level3,
      aliases: [item.bucket, item.spec].filter(Boolean),
    })),
  ];
  const seen = new Map();
  rows.forEach((row) => {
    const key = `${row.cn}|${row.level1}|${row.level2}|${row.level3}`;
    if (!row.cn || seen.has(key)) return;
    seen.set(key, {
      id: `SPN-${stableHash(key).slice(0, 8).toUpperCase()}`,
      cn: row.cn,
      en: row.en || "Pending Translation",
      vn: row.vn || "Pending Translation",
      level1: row.level1 || "",
      level2: row.level2 || "",
      level3: row.level3 || "",
      aliases: [...new Set([row.cn, row.en, row.vn, ...(row.aliases || [])].filter(Boolean))],
    });
  });
  return [...seen.values()].sort((a, b) => a.cn.localeCompare(b.cn, "zh-Hant"));
}
// @end-legacy-unit 364

// @legacy-unit 365 1761
export function standardPartMatchesFor(row, queryText = row.standardNameCn) {
  if (!row.level1 || !row.level2 || !row.level3) return [];
  const query = normalize(queryText);
  return standardPartNameMaster()
    .filter((item) => item.level1 === row.level1 && item.level2 === row.level2 && item.level3 === row.level3)
    .filter((item) => {
      if (!query) return true;
      return normalize([item.cn, item.en, item.vn, ...item.aliases].join(" ")).includes(query);
    });
}
// @end-legacy-unit 365

// @legacy-unit 366 1772
export function standardPartOptionsFor(row) {
  return standardPartMatchesFor(row).slice(0, STANDARD_INLINE_LIMIT);
}
// @end-legacy-unit 366

// @legacy-unit 367 1776
export function standardPartSearchPrompt(row) {
  if (!row.level1 || !row.level2 || !row.level3) return "Select LV123 first";
  if (!row.standardNameCn) return "Type to search";
  return "No match";
}
// @end-legacy-unit 367

// @legacy-unit 368 1782
export function exactStandardPart(row) {
  return standardPartNameMaster().find((item) =>
    item.level1 === row.level1
    && item.level2 === row.level2
    && item.level3 === row.level3
    && item.cn === row.standardNameCn
  ) || null;
}
// @end-legacy-unit 368

// @legacy-unit 369 1791
export function maintenanceStatus(row) {
  if (row.materialStatus) return row.materialStatus;
  if (row.standardNameStatus) return row.standardNameStatus;
  if (row.status === "Draft") return "Ready to Create";
  return isMaintenanceComplete(row) ? MATERIAL_STATUS_ACTIVE : "Maintenance Required";
}
// @end-legacy-unit 369

// @legacy-unit 370 1798
export function isMaintenanceComplete(row) {
  return Boolean(
    isOmCatalogRow(row)
    || omResponsibilityMatch(row)
    || row.omClassificationStatus === "Classified"
    || row.omCategoryLevel2
    || row.omCategoryLevel3
    || factoryMaterialNoFor(row)
    || row.materialId
    || row.materialNo
    || materialMasterRecordFor(row)
    || (row.name && userVisibleItemDetail(row))
  );
}
// @end-legacy-unit 370
