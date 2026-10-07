// materials/identity: authoritative source; see docs/module-map.md.
import {
  level1Options,
  level2Options,
  level3Options
} from "../catalog/taxonomy.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  replaceVendorMaterialMappingsBinding,
  vendorMaterialMappings
} from "../data/state.js";
import {
  isMaterialNoPending,
  itemDetail
} from "./display.js";
import {
  standardPartNameFromRow
} from "./standard-names.js";
import {
  advanceMaterialSequenceBinding,
  materialMasterRecords,
  materialSequence,
  replaceMaterialMasterRecordsBinding
} from "./state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize,
  stableHash
} from "../shared/format.js";
import {
  rfqStatus
} from "../sourcing/rfq.js";

// @legacy-unit 59 416
export let STANDARD_PART_NAME_SEEDS;
export function initializeSTANDARD_PART_NAME_SEEDSBinding() {
  STANDARD_PART_NAME_SEEDS = [
  { cn: "數位百分表組", en: "Digital dial indicator set", vn: "Bộ đồng hồ so điện tử", level1: "生產設備與工具", level2: "設備工程工具", level3: "輔助工具", aliases: ["0-50.8mm 數位百分表組", "Bo Dong Ho So Dien Tu"] },
  { cn: "射頻測試探針", en: "RF test probe", vn: "Đầu dò kiểm tra RF", level1: "生產設備與工具", level2: "設備配件", level3: "設備零組件", aliases: ["CP-1F0.25 射頻測試探針", "Probe"] },
  { cn: "ESD 接地線", en: "ESD grounding cord", vn: "Dây nối đất ESD", level1: "生產設備與工具", level2: "IT線材與耗材", level3: "IT耗材", aliases: ["1.5mm2 ESD 接地線", "Grounding Cords"] },
  { cn: "活扳手", en: "Adjustable wrench", vn: "Mỏ lết", level1: "生產設備與工具", level2: "設備工程工具", level3: "輔助工具", aliases: ["10 吋活扳手", "Mo Let"] },
  { cn: "氣動直通接頭", en: "Air straight adapter", vn: "Đầu nối khí thẳng", level1: "生產設備與工具", level2: "設備配件", level3: "設備零組件", aliases: ["10-8 氣動直通接頭", "Air Adapter"] },
  { cn: "補償電容器", en: "Compensation capacitor", vn: "Tụ bù", level1: "廠務基礎設施", level2: "電力與機電設備", level3: "電機零件", aliases: ["100 KVA 補償電容器", "Capacitor"] },
  { cn: "防護膜", en: "Protective film", vn: "Màng bảo vệ", level1: "生產設備與工具", level2: "耗材", level3: "保護膜", aliases: ["前端防護膜", "PET protective film"] },
  { cn: "標籤紙", en: "Label paper", vn: "Giấy nhãn", level1: "生產設備與工具", level2: "耗材", level3: "標籤", aliases: ["Label Roll", "thermal label"] },
  { cn: "壓頭", en: "Press head", vn: "Đầu ép", level1: "生產設備與工具", level2: "產線通用設備", level3: "加工設備", aliases: ["Pressure head"] },
  { cn: "定位銷", en: "Locating pin", vn: "Chốt định vị", level1: "生產設備與工具", level2: "設備配件", level3: "設備零組件", aliases: ["定位 pin"] },
  { cn: "膠帶", en: "Tape", vn: "Băng keo", level1: "生產設備與工具", level2: "包材", level3: "膠帶", aliases: ["tape"] },
  { cn: "托盤", en: "Tray", vn: "Khay", level1: "生產設備與工具", level2: "耗材", level3: "托盤", aliases: ["ESD plastic tray"] },
  { cn: "無塵布", en: "Cleanroom wiper", vn: "Khăn lau phòng sạch", level1: "生產設備與工具", level2: "耗材", level3: "無塵室耗材", aliases: ["Cleanroom Wiper", "lint-free wiper"] },
  { cn: "治具", en: "Fixture", vn: "Đồ gá", level1: "生產設備與工具", level2: "治具與夾具", level3: "治具與夾具", aliases: ["Fixture Base", "Pogo Pin Fixture"] },
  { cn: "筆記型電腦", en: "Laptop computer", vn: "Máy tính xách tay", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "電腦主機", aliases: ["Laptop", "ThinkPad"] },
  { cn: "桌上型電腦", en: "Desktop PC", vn: "Máy tính để bàn", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "電腦主機", aliases: ["PC", "Workstation PC"] },
  { cn: "螢幕", en: "Monitor", vn: "Màn hình", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "螢幕", aliases: ["27 inch monitor"] },
  { cn: "鍵盤", en: "Keyboard", vn: "Bàn phím", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "周邊", aliases: ["Keyboard", "MX Keys"] },
  { cn: "滑鼠", en: "Mouse", vn: "Chuột", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "周邊", aliases: ["Mouse", "Wireless Mouse"] },
  { cn: "網路交換機", en: "Network switch", vn: "Switch mạng", level1: "生產設備與工具", level2: "IT線材與耗材", level3: "網路線材", aliases: ["Network Switch", "managed switch"] },
];
}
// @end-legacy-unit 59

// @legacy-unit 60 439
export let MATERIAL_NO_PREFIX;
export function initializeMATERIAL_NO_PREFIXBinding() {
  MATERIAL_NO_PREFIX = "MVA";
}
// @end-legacy-unit 60

// @legacy-unit 61 440
export let FACTORY_MATERIAL_NO_PREFIX;
export function initializeFACTORY_MATERIAL_NO_PREFIXBinding() {
  FACTORY_MATERIAL_NO_PREFIX = "FM-VN-MVA";
}
// @end-legacy-unit 61

// @legacy-unit 62 441
export let MATERIAL_STATUS_ACTIVE;
export function initializeMATERIAL_STATUS_ACTIVEBinding() {
  MATERIAL_STATUS_ACTIVE = "Active - User Created";
}
// @end-legacy-unit 62

// @legacy-unit 63 442
export let MATERIAL_STATUS_PENDING_PROCUREMENT;
export function initializeMATERIAL_STATUS_PENDING_PROCUREMENTBinding() {
  MATERIAL_STATUS_PENDING_PROCUREMENT = "PAS/PUR Material Pending";
}
// @end-legacy-unit 63

// @legacy-unit 64 443
export let MATERIAL_CREATION_EVENT;
export function initializeMATERIAL_CREATION_EVENTBinding() {
  MATERIAL_CREATION_EVENT = "Material No. Created";
}
// @end-legacy-unit 64

// @legacy-unit 65 444
export let MATERIAL_STANDARD_NAME_REQUESTED;
export function initializeMATERIAL_STANDARD_NAME_REQUESTEDBinding() {
  MATERIAL_STANDARD_NAME_REQUESTED = "Standard Name Requested";
}
// @end-legacy-unit 65

// @legacy-unit 371 1813
export function materialIdFor(row) {
  return row.materialId || materialMasterRecordFor(row)?.materialId || (isMaterialNoPending(row) ? "Pending PR / PO" : "-");
}
// @end-legacy-unit 371

// @legacy-unit 372 1817
export function materialIdentityKey(row) {
  const lv1 = normalize(row.level1 || "").replace(/\s+/g, " ").trim();
  const lv2 = normalize(row.level2 || "").replace(/\s+/g, " ").trim();
  const lv3 = normalize(row.level3 || "").replace(/\s+/g, " ").trim();
  const name = normalize(standardPartNameFromRow(row)).replace(/\s+/g, " ").trim();
  const detail = normalize(itemDetail(row)).replace(/\s+/g, " ").trim();
  const spec = normalize(row.spec || row.detail || "").replace(/\s+/g, " ").trim();
  if (lv1 || lv2 || lv3 || name || detail || spec) return `material|${lv1}|${lv2}|${lv3}|${name}|${detail}|${spec}`;
  return `material|${normalize(row.id || "unknown")}`;
}
// @end-legacy-unit 372

// @legacy-unit 373 1828
export function lvCodeFor(level, row) {
  let options = [];
  let value = "";
  if (level === 1) {
    options = level1Options();
    value = row.level1;
  } else if (level === 2) {
    options = level2Options(row.level1);
    value = row.level2;
  } else {
    options = level3Options(row.level1, row.level2);
    value = row.level3;
  }
  const index = options.indexOf(value);
  return String(index >= 0 ? index + 1 : 0).padStart(2, "0");
}
// @end-legacy-unit 373

// @legacy-unit 374 1845
export function materialCategoryCode(row) {
  return `${lvCodeFor(1, row)}${lvCodeFor(2, row)}${lvCodeFor(3, row)}`;
}
// @end-legacy-unit 374

// @legacy-unit 375 1849
export function nextMaterialSequence() {
  return advanceMaterialSequenceBinding(1, true);
}
// @end-legacy-unit 375

// @legacy-unit 376 1853
export function createMaterialId(sequence) {
  return `MATID-${String(sequence).padStart(6, "0")}`;
}
// @end-legacy-unit 376

// @legacy-unit 377 1857
export function createMaterialNo(row, sequence) {
  return `${MATERIAL_NO_PREFIX}-${materialCategoryCode(row)}-${String(sequence).padStart(6, "0")}`;
}
// @end-legacy-unit 377

// @legacy-unit 378 1861
export function factoryMaterialIdentityKey(row) {
  const item = normalize(row.name || row.standardNameCn || row.standardNameEn || "").replace(/\s+/g, " ").trim();
  const spec = normalize(itemDetail(row) || row.spec || row.detail || "").replace(/\s+/g, " ").trim();
  const brand = normalize(row.pasBrand || row.brand || "").replace(/\s+/g, " ").trim();
  const unit = normalize(row.unit || "").replace(/\s+/g, " ").trim();
  if (item || spec || brand || unit) return `factory|${item}|${spec}|${brand}|${unit}`;
  return `factory|${normalize(row.id || row.sourceRecordId || "unknown")}`;
}
// @end-legacy-unit 378

// @legacy-unit 379 1870
export function createFactoryMaterialNo(row) {
  return `${FACTORY_MATERIAL_NO_PREFIX}-${stableHash(factoryMaterialIdentityKey(row)).slice(0, 8)}`;
}
// @end-legacy-unit 379

// @legacy-unit 380 1874
export function factoryMaterialNoFor(row) {
  return row?.factoryMaterialNo || "";
}
// @end-legacy-unit 380

// @legacy-unit 381 1878
export function materialNoFor(row) {
  return row.materialNo || materialMasterRecordFor(row)?.materialNo || "";
}
// @end-legacy-unit 381

// @legacy-unit 382 1882
export function makeMaterialMasterRecords(records) {
  const seen = new Set();
  return records.reduce((rows, record) => {
    const key = materialIdentityKey(record);
    if (seen.has(key)) return rows;
    seen.add(key);
    rows.push({
      materialNo: materialNoFor(record),
      materialIdentityKey: key,
      itemName: record.name,
      detail: record.detail || "",
      spec: record.spec || "",
      materialStatus: "Material Master",
      createdFromRequestId: record.id,
      createdBy: "System import",
      createdAt: new Date(2026, 4, 8, 8, 0).toISOString(),
    });
    return rows;
  }, []);
}
// @end-legacy-unit 382

// @legacy-unit 383 1903
export function makeVendorMaterialMappings(records) {
  return records
    .filter((record) => record.vendor || record.vendorPartNo || record.unitPrice)
    .map((record, index) => ({
      id: `VMM-${String(index + 1).padStart(4, "0")}`,
      materialNo: materialNoFor(record),
      vendor: record.vendor || "Reference Vendor",
      vendorPartNo: record.vendorPartNo || record.partNo || "",
      unitPrice: record.unitPrice || 0,
      quotePdf: record.quotationPdf || "",
      quoteExcel: record.quotationExcel || "",
      quoteDate: record.quoteDate || "",
      source: "Historical purchase record",
    }));
}
// @end-legacy-unit 383

// @legacy-unit 384 1919
export function itemKeyDisplay(row) {
  return row?.factoryMaterialNo || row?.poNo || row?.pasMaterialNo || row?.partNo || "-";
}
// @end-legacy-unit 384

// @legacy-unit 385 1923
export function materialControlStatus(row) {
  if (row.materialStatus) return row.materialStatus;
  if (row.standardNameStatus) return row.standardNameStatus;
  if (isMaterialNoPending(row)) return MATERIAL_STATUS_PENDING_PROCUREMENT;
  return materialMasterRecordFor(row) ? MATERIAL_STATUS_ACTIVE : "Complete Material Info Required";
}
// @end-legacy-unit 385

// @legacy-unit 386 1930
export function identityDisplay(row) {
  return materialNoFor(row) || "Complete Material Info Required";
}
// @end-legacy-unit 386

// @legacy-unit 387 1934
export function materialMasterRecordFor(row) {
  const key = materialIdentityKey(row);
  return materialMasterRecords.find((record) =>
    record.materialIdentityKey === key
    || (row.materialId && record.materialId === row.materialId)
    || (row.materialNo && record.materialNo === row.materialNo)
  );
}
// @end-legacy-unit 387

// @legacy-unit 388 1943
export function materialDbStatus(row) {
  if (isMaterialNoPending(row)) return MATERIAL_STATUS_PENDING_PROCUREMENT;
  return materialMasterRecordFor(row) ? MATERIAL_STATUS_ACTIVE : "Complete Material Info Required";
}
// @end-legacy-unit 388

// @legacy-unit 389 1948
export function hasSourcingQuoteSuccess(row) {
  return rfqStatus(row) === "Quote Received"
    && Boolean(row.vendor || row.vendorPartNo || row.updatedPrice || row.rfqQuoteResult || row.quotationPdf);
}
// @end-legacy-unit 389

// @legacy-unit 390 1953
export function ensureMaterialMasterFromQuote(row) {
  return ensureMaterialMaster(row, { createdBy: "Sourcing", source: "Sourcing quote success" });
}
// @end-legacy-unit 390

// @legacy-unit 391 1957
export function ensureMaterialMaster(row, options = {}) {
  const key = materialIdentityKey(row);
  const existing = materialMasterRecords.find((record) => record.materialIdentityKey === key);
  const sequence = existing?.sequence || nextMaterialSequence();
  const materialId = existing?.materialId || createMaterialId(sequence);
  const materialNo = existing?.materialNo || createMaterialNo(row, sequence);
  if (!existing) {
    replaceMaterialMasterRecordsBinding([{
      sequence,
      materialId,
      materialNo,
      materialIdentityKey: key,
      itemName: row.standardNameCn || row.name,
      standardNameCn: row.standardNameCn || row.name || "",
      standardNameEn: row.standardNameEn || "",
      standardNameVn: row.standardNameVn || "",
      level1: row.level1 || "",
      level2: row.level2 || "",
      level3: row.level3 || "",
      detail: row.detail || "",
      spec: row.spec || "",
      materialStatus: MATERIAL_STATUS_ACTIVE,
      createdFromRequestId: options.createdFromRequestId || row.id || row.sourceRequestId || "",
      sourceProject: options.sourceProject || row.sourceProject || row.project || "",
      sourceRecordId: options.sourceRecordId || row.sourceRecordId || "",
      sourceExternalEventId: options.sourceExternalEventId || "",
      sourcePrNo: options.sourcePrNo || row.prNo || "",
      sourcePoNo: options.sourcePoNo || row.buyerPoNo || row.poNo || "",
      createdBy: options.createdBy || roleProfiles[currentRole]?.name || "System",
      createdAt: new Date().toISOString(),
      source: options.source || "Material Entry",
    }, ...materialMasterRecords]);
  }
  if (row.vendor || row.vendorPartNo || row.updatedPrice || row.quotationPdf) {
    const mappingIndex = vendorMaterialMappings.findIndex((mapping) =>
      mapping.materialNo === materialNo
      && normalize(mapping.vendor) === normalize(row.vendor)
      && normalize(mapping.vendorPartNo) === normalize(row.vendorPartNo)
    );
    const mapping = {
      id: mappingIndex >= 0 ? vendorMaterialMappings[mappingIndex].id : `VMM-${String(vendorMaterialMappings.length + 1).padStart(4, "0")}`,
      materialNo,
      vendor: row.vendor || "Pending vendor",
      vendorPartNo: row.vendorPartNo || "",
      unitPrice: effectiveUnitPrice(row),
      quotePdf: row.quotationPdf || "",
      quoteExcel: row.quotationExcel || "",
      quoteDate: row.quoteDate || "",
      source: "Sourcing quote success",
    };
    if (mappingIndex >= 0) {
      replaceVendorMaterialMappingsBinding(vendorMaterialMappings.map((item, index) => index === mappingIndex ? mapping : item));
    } else {
      replaceVendorMaterialMappingsBinding([mapping, ...vendorMaterialMappings]);
    }
  }
  return { materialId, materialNo, materialIdentityKey: key, materialStatus: existing?.materialStatus || MATERIAL_STATUS_ACTIVE };
}
// @end-legacy-unit 391

// @legacy-unit 392 2016
export function globalItemKey(row) {
  const key = materialIdentityKey(row);
  if (key.replace(/\|/g, "")) return `ITEM|${key}`;
  return row.globalItemKey || row.globalItemId || `UNKNOWN|${normalize(row.id || row.sourceRecordId || "unknown")}`;
}
// @end-legacy-unit 392

// @legacy-unit 393 2022
export function partName(row) {
  const detail = itemDetail(row) || row.name || "Detail";
  return `${standardPartNameFromRow(row) || "Item"}_${detail}`;
}
// @end-legacy-unit 393

// @legacy-unit 394 2027
export function globalItemIdForKey(key) {
  return `GI-${stableHash(key)}`;
}
// @end-legacy-unit 394

// @legacy-unit 395 2031
export function globalItemIdFor(row) {
  return globalItemIdForKey(globalItemKey(row));
}
// @end-legacy-unit 395
