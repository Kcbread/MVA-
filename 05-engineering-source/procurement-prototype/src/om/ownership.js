// om/ownership: authoritative source; see docs/module-map.md.
import {
  isOmCatalogRow
} from "../catalog/records.js";
import {
  OM_RESPONSIBILITY_MASTER
} from "../catalog/taxonomy.js";
import {
  demandTypeFor
} from "../demand/quantity.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  DEMAND_TYPE_NON_MFG,
  ITEM_OWNER_MFG,
  ITEM_OWNER_NON_OM,
  ITEM_OWNER_OM,
  ITEM_OWNER_PENDING,
  ITEM_OWNER_UNIT
} from "../projects/config.js";
import {
  normalize
} from "../shared/format.js";
import {
  OM_SCOPE_COORDINATOR,
  OM_SCOPE_NEED_SPEC,
  OM_SCOPE_NOT,
  OM_SCOPE_STANDARD
} from "../workflow/status-constants.js";

// @legacy-unit 211 1170
export let OM_BUY_SCOPE_RULES;
export function initializeOM_BUY_SCOPE_RULESBinding() {
  OM_BUY_SCOPE_RULES = [
  { status: OM_SCOPE_STANDARD, keywords: ["pc", "ipc", "pc(assy)", "pc(qa)", "pc(offline)", "laptop", "workstation", "monitor", "keyboard", "mouse", "barebones", "cloud terminal", "tablet", "電腦", "工業電腦", "筆記本", "螢幕", "顯示器", "鍵盤", "鼠標"] },
  { status: OM_SCOPE_NEED_SPEC, keywords: ["server", "storage", "printer", "scanner", "barcode", "rfid", "pda", "data collector", "network switch", "switch", "router", "wi-fi", "wifi", "firewall", "network rack", "network cabinet", "access point", "ap", "software", "license", "subscription", "video conference", "conference", "access control", "attendance", "surveillance", "monitoring"] },
  { status: OM_SCOPE_NEED_SPEC, keywords: ["usb", "hdmi", "vga", "network cable", "patch cord", "computer power cord", "power adapter", "charger", "pc peripheral", "computer adapter", "computer audio", "docking station"] },
  { status: OM_SCOPE_NEED_SPEC, keywords: ["電腦", "工業電腦", "筆記本", "螢幕", "顯示器", "鍵盤", "鼠標", "條碼", "掃描", "伺服器", "服務器", "存儲", "網路", "路由器", "交換機", "軟件", "授權", "一卡通", "門禁", "考勤", "監控", "視訊會議"] },
];
}
// @end-legacy-unit 211

// @legacy-unit 212 1176
export function omCatalogItemsFromMaster(masterRows) {
  const seen = new Set();
  return masterRows.reduce((items, entry) => {
    const level3 = entry.level3En || entry.level3Cn || "";
    if (!level3) return items;
    const key = `${entry.level2En || entry.level2Cn || ""}::${level3}`;
    if (seen.has(key)) return items;
    seen.add(key);
    items.push({
      bucket: level3,
      status: OM_SCOPE_STANDARD,
      name: level3,
      spec: level3,
      level1: entry.level1En || entry.level1Cn || "",
      level2: entry.level2En || entry.level2Cn || "",
      level3,
      owner: entry.owner || "",
      unitPrice: 0,
    });
    return items;
  }, []);
}
// @end-legacy-unit 212

// @legacy-unit 213 1199
export let OM_CATALOG_ITEMS;
export function initializeOM_CATALOG_ITEMSBinding() {
  OM_CATALOG_ITEMS = omCatalogItemsFromMaster(OM_RESPONSIBILITY_MASTER);
}
// @end-legacy-unit 213

// @legacy-unit 575 4115
export function omBuyScopeText(row) {
  return normalize([
    row.name,
    itemDetail(row),
    partName(row),
    row.level1,
    row.level2,
    row.level3,
    row.process,
    row.station,
    row.requesterReason,
  ].join(" "));
}
// @end-legacy-unit 575

// @legacy-unit 576 4129
export function itemOwnerText(row = {}) {
  return normalize([
    row.name,
    row.standardNameCn,
    row.standardNameEn,
    row.standardNameVn,
    row.cnName,
    row.enName,
    row.vnName,
    itemDetail(row),
    partName(row),
    row.level1,
    row.level2,
    row.level3,
    row.catalogBucket,
  ].join(" "));
}
// @end-legacy-unit 576

// @legacy-unit 577 4147
export function itemOwnerKeyword(text, keyword) {
  const normalizedKeyword = normalize(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}([^a-z0-9]|$)`).test(text);
}
// @end-legacy-unit 577

// @legacy-unit 578 4152
export function isExplicitNonOmOwnerText(text = "") {
  const accessoryTerms = [
    "keyboard", "鍵盤", "mouse", "鼠標", "chuột",
    "scanner stand", "掃描器支架", "scanner accessories", "scanner accessory",
    "battery for scanner", "掃描器專用電池", "scanner cable", "掃描器數據線",
    "barcode printer accessories", "條碼打印機配件", "barcode print head", "條碼打印頭",
    "ribbon", "碳帶", "toner", "toner catridge", "墨水夾",
    "server", "storage", "服務器", "伺服器", "存儲",
    "network", "switch", "router", "access point", "firewall", "網路", "交換機", "路由器",
    "software", "license", "subscription", "軟件", "授權",
    "hp printer", "printer-inkjet", "printer-thermal", "photocopier", "id card printer", "證卡列打印機",
  ];
  return accessoryTerms.some((term) => text.includes(normalize(term)));
}
// @end-legacy-unit 578

// @legacy-unit 579 4167
export function isOmOwnedItem(row = {}) {
  const text = itemOwnerText(row);
  if (!text) return false;
  const zebraPrinter = text.includes("zebra") && (text.includes("printer") || text.includes("打印機") || text.includes("máy in"));
  if (zebraPrinter) return true;
  if (isExplicitNonOmOwnerText(text)) return false;
  if (itemOwnerKeyword(text, "pc") || itemOwnerKeyword(text, "ipc")) return true;
  if (text.includes("laptop") || text.includes("notebook") || text.includes("desktop") || text.includes("workstation") || text.includes("工務電腦") || text.includes("品保電腦") || text.includes("辦公電腦") || text.includes("工業電腦") || text.includes("筆記本電腦")) return true;
  if ((text.includes("monitor") || text.includes("display") || text.includes("螢幕") || text.includes("顯示器")) && !text.includes("microscope") && !text.includes("顯微鏡")) return true;
  if ((text.includes("barcode") || text.includes("qr code") || text.includes("條碼") || text.includes("掃碼")) && (text.includes("scanner") || text.includes("掃描器") || text.includes("quét"))) return true;
  if (itemOwnerKeyword(text, "pda") || text.includes("data collector") || text.includes("數據採集器")) return true;
  return false;
}
// @end-legacy-unit 579

// @legacy-unit 580 4181
export function itemOwnerFor(row = {}) {
  if (row.itemOwner && row.itemOwner !== ITEM_OWNER_PENDING) return row.itemOwner;
  if (isOmOwnedItem(row)) return ITEM_OWNER_OM;
  if (demandTypeFor(row) === DEMAND_TYPE_NON_MFG || row.demandUnit || row.department) return ITEM_OWNER_UNIT;
  if (row.name || itemDetail(row)) return ITEM_OWNER_MFG;
  return ITEM_OWNER_PENDING;
}
// @end-legacy-unit 580

// @legacy-unit 581 4189
export function itemOwnerLabel(row = {}) {
  const owner = itemOwnerFor(row);
  if (owner === ITEM_OWNER_OM) return "OM-owned";
  if (owner === ITEM_OWNER_MFG) return "MFG-owned";
  if (owner === ITEM_OWNER_UNIT) return "Unit-owned";
  if (owner === ITEM_OWNER_NON_OM) return "Non-OM";
  return ITEM_OWNER_PENDING;
}
// @end-legacy-unit 581

// @legacy-unit 582 4198
export function itemOwnerBadgeHtml(row = {}) {
  const label = itemOwnerLabel(row);
  const tone = label === "OM-owned" ? "info" : label === ITEM_OWNER_PENDING ? "warning" : "pending";
  return `<span class="status-pill owner-badge ${tone}" title="Read-only owner from item master">${label}</span>`;
}
// @end-legacy-unit 582

// @legacy-unit 583 4204
export function omKeywordMatches(text, keyword) {
  const normalizedKeyword = normalize(keyword);
  if (["pc", "ap"].includes(normalizedKeyword)) {
    return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}([^a-z0-9]|$)`).test(text);
  }
  return text.includes(normalizedKeyword);
}
// @end-legacy-unit 583

// @legacy-unit 584 4212
export function omResponsibilityText(row) {
  return normalize([
    row.omCategoryLevel1,
    row.omCategoryLevel2,
    row.omCategoryLevel3,
    row.name,
    row.standardNameCn,
    row.standardNameEn,
    row.level1,
    row.level2,
    row.level3,
    row.spec,
    row.detail,
    row.process,
    row.station,
  ].join(" "));
}
// @end-legacy-unit 584

// @legacy-unit 585 4230
export function omResponsibilityEntrySearchTerms(entry) {
  return [
    entry.level1Cn,
    entry.level1En,
    entry.level2Cn,
    entry.level2En,
    entry.level3Cn,
    entry.level3En,
  ].filter(Boolean).map(normalize);
}
// @end-legacy-unit 585

// @legacy-unit 586 4241
export function omResponsibilityMatch(row) {
  const text = omResponsibilityText(row);
  if (!text) return null;
  const exact = OM_RESPONSIBILITY_MASTER.find((entry) => {
    const l2 = normalize(entry.level2En);
    const l2Cn = normalize(entry.level2Cn);
    const l3 = normalize(entry.level3En);
    const l3Cn = normalize(entry.level3Cn);
    return (l2 && text.includes(l2) && l3 && text.includes(l3))
      || (l2Cn && text.includes(l2Cn) && l3Cn && text.includes(l3Cn));
  });
  if (exact) return exact;

  const direct = OM_RESPONSIBILITY_MASTER.find((entry) =>
    omResponsibilityEntrySearchTerms(entry).some((term) => term && omKeywordMatches(text, term))
  );
  if (direct) return direct;

  return null;
}
// @end-legacy-unit 586

// @legacy-unit 587 4262
export function omResponsibilityPatch(row) {
  const match = omResponsibilityMatch(row);
  if (!match) {
    return {
      omCategoryLevel1: row.omCategoryLevel1 || "",
      omCategoryLevel2: row.omCategoryLevel2 || "",
      omCategoryLevel3: row.omCategoryLevel3 || "",
      omOwner: row.omOwner || "",
      omClassificationStatus: row.omClassificationStatus || "Need OM Classification",
    };
  }
  return {
    omCategoryLevel1: match.level1En,
    omCategoryLevel1Cn: match.level1Cn,
    omCategoryLevel2: match.level2En,
    omCategoryLevel2Cn: match.level2Cn,
    omCategoryLevel3: match.level3En,
    omCategoryLevel3Cn: match.level3Cn,
    omOwner: match.owner,
    omClassificationStatus: "Classified",
  };
}
// @end-legacy-unit 587

// @legacy-unit 588 4285
export function applyOmResponsibility(row) {
  return { ...row, ...omResponsibilityPatch(row) };
}
// @end-legacy-unit 588

// @legacy-unit 589 4289
export function omCategoryPath(row) {
  return [row.omCategoryLevel1, row.omCategoryLevel2, row.omCategoryLevel3].filter(Boolean).join(" / ");
}
// @end-legacy-unit 589

// @legacy-unit 590 4293
export function omCategoryCompact(row) {
  return [row.omCategoryLevel2, row.omCategoryLevel3].filter(Boolean).join(" / ") || row.omClassificationStatus || "Need OM Classification";
}
// @end-legacy-unit 590

// @legacy-unit 591 4297
export function omBuyScopeStatus(row) {
  if (!isOmOwnedItem(row)) {
    const text = omBuyScopeText(row);
    const isFacilityPower = (text.includes("power cable") || text.includes("電纜") || text.includes("電力"))
      && (text.includes("facility") || text.includes("廠務") || text.includes("3 phase") || text.includes("三相"));
    if (isFacilityPower) return OM_SCOPE_COORDINATOR;
    if ((text.includes("vision camera") || text.includes("aoi")) && !text.includes("surveillance") && !text.includes("monitoring") && !text.includes("監控")) return OM_SCOPE_COORDINATOR;
    return OM_SCOPE_NOT;
  }
  if (row.omCategoryLevel2 || row.omCategoryLevel3 || row.omOwner) return row.omClassificationStatus === "Need OM Classification" ? OM_SCOPE_NEED_SPEC : OM_SCOPE_STANDARD;
  if (omResponsibilityMatch(row)) return OM_SCOPE_STANDARD;
  if (row.catalogStatus) return row.catalogStatus;
  const text = omBuyScopeText(row);
  const isFacilityPower = (text.includes("power cable") || text.includes("電纜") || text.includes("電力"))
    && (text.includes("facility") || text.includes("廠務") || text.includes("3 phase") || text.includes("三相"));
  if (isFacilityPower) return OM_SCOPE_COORDINATOR;
  if ((text.includes("vision camera") || text.includes("aoi")) && !text.includes("surveillance") && !text.includes("monitoring") && !text.includes("監控")) return OM_SCOPE_COORDINATOR;

  return OM_SCOPE_NOT;
}
// @end-legacy-unit 591

// @legacy-unit 592 4318
export function omBuyScopeReason(row) {
  const text = omBuyScopeText(row);
  const status = omBuyScopeStatus(row);
  if (row.omCategoryLevel2 || row.omCategoryLevel3 || row.omOwner || omResponsibilityMatch(row)) {
    const matched = applyOmResponsibility(row);
    return `Matched OM responsibility master: ${omCategoryCompact(matched)}${matched.omOwner ? ` / Owner ${matched.omOwner}` : ""}. PAS quotation is required.`;
  }
  if (isOmCatalogRow(row) && status === OM_SCOPE_STANDARD) return "Selected from the central OM Buy catalog; OM will aggregate demand before final quote.";
  if (isOmCatalogRow(row) && status === OM_SCOPE_NEED_SPEC) return "Selected from the central OM Buy catalog; OM must confirm final spec/model before quote package.";
  if (status === OM_SCOPE_STANDARD) return "Matched standard OM demand bucket; final model is not required from Requester.";
  if (status === OM_SCOPE_NEED_SPEC) return "Matched OM buy scope; OM Purchasing will collect demand and confirm final spec/model.";
  if (status === OM_SCOPE_COORDINATOR) {
    if (text.includes("vision camera") || text.includes("aoi")) return "Camera-like item appears tied to production/AOI context; MFG / Sourcing review required.";
    if (text.includes("電纜") || text.includes("3 phase") || text.includes("facility") || text.includes("廠務")) return "Cable/power item appears tied to facility/electrical context; MFG / Sourcing review required.";
    return "OM ownership is ambiguous; MFG / Sourcing review required.";
  }
  return "No OM buy scope match; MFG / Sourcing review required.";
}
// @end-legacy-unit 592

// @legacy-unit 593 4337
export function isOmBuyScope(row) {
  return [OM_SCOPE_STANDARD, OM_SCOPE_NEED_SPEC].includes(omBuyScopeStatus(row));
}
// @end-legacy-unit 593
