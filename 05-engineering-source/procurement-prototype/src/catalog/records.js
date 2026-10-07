// catalog/records: authoritative source; see docs/module-map.md.
import {
  globalItemIdForKey,
  globalItemKey
} from "../materials/identity.js";
import {
  OM_CATALOG_ITEMS,
  isOmOwnedItem,
  omResponsibilityPatch
} from "../om/ownership.js";
import {
  currentProject
} from "../projects/state.js";
import {
  slug
} from "../shared/format.js";

// @legacy-unit 356 1637
export function omCatalogRecord(item, project = currentProject) {
  const record = {
    id: `OMCAT-${slug(item.bucket)}-${project}`,
    poNo: "OM Catalog",
    project,
    sourceProject: "OM Catalog",
    partNo: `OM-CATALOG-${slug(item.bucket).toUpperCase()}`,
    materialNo: "",
    materialIdentityKey: "",
    globalItemKey: "",
    globalItemId: "",
    name: item.name,
    level1: item.level1 || "",
    level2: item.level2,
    level3: item.level3,
    spec: item.spec,
    process: "OM Catalog",
    station: "PAS / OM Buy",
    department: "",
    unitPrice: item.unitPrice || 0,
    qty: 0,
    p10: 0,
    p11: 0,
    evt: 0,
    dvt: 0,
    pvt: 0,
    mp: 0,
    vendor: "OM to confirm",
    quoteDate: "",
    quoteExpiry: "",
    source: "om-catalog",
    catalogBucket: item.bucket,
    catalogStatus: item.status,
    omOwner: item.owner || "",
    requesterReason: "Selected from central OM Buy catalog.",
  };
  Object.assign(record, omResponsibilityPatch(record));
  record.globalItemKey = globalItemKey(record);
  record.globalItemId = globalItemIdForKey(record.globalItemKey);
  return record;
}
// @end-legacy-unit 356

// @legacy-unit 357 1679
export function omCatalogRows(project = currentProject) {
  return OM_CATALOG_ITEMS
    .map((item) => omCatalogRecord(item, project))
    .filter(isOmOwnedItem);
}
// @end-legacy-unit 357

// @legacy-unit 358 1685
export function isOmCatalogRow(row) {
  return row?.source === "om-catalog";
}
// @end-legacy-unit 358

// @legacy-unit 359 1689
export function rowSourceLabel(row) {
  if (isOmCatalogRow(row)) return "OM Catalog";
  if (row?.source === "history") return "Approved History";
  if (row?.source === "new-item-master") return "User Created Material";
  return row?.source || "Record";
}
// @end-legacy-unit 359
