// catalog/taxonomy: authoritative source; see docs/module-map.md.
import {
  renderRequestItemPicker,
  syncRequestItemPickerFilters
} from "./search.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";

// @legacy-unit 51 282
export let LEGACY_CATEGORY_SOURCE;
export function initializeLEGACY_CATEGORY_SOURCEBinding() {
  LEGACY_CATEGORY_SOURCE = `
生產設備與工具	設備工程工具	輔助工具
生產設備與工具	設備工程工具	輔助工具配件
生產設備與工具	設備工程工具	產線用清潔工具
生產設備與工具	產線通用設備	生產設備
生產設備與工具	產線通用設備	檢測設備
生產設備與工具	產線通用設備	測試設備
生產設備與工具	產線通用設備	加工設備
生產設備與工具	產線通用設備	工作站與設備
生產設備與工具	設備配件	設備零組件
生產設備與工具	設備配件	設備電源配件
生產設備與工具	設備租賃	設備租賃
生產設備與工具	IT硬體與設備	音訊設備
生產設備與工具	IT硬體與設備	通訊設備
生產設備與工具	IT硬體與設備	電腦主機
生產設備與工具	IT硬體與設備	電腦零件
生產設備與工具	IT硬體與設備	螢幕
生產設備與工具	IT硬體與設備	家電
生產設備與工具	IT硬體與設備	攝影設備
生產設備與工具	IT硬體與設備	掃碼槍主體
生產設備與工具	IT硬體與設備	周邊
生產設備與工具	IT硬體與設備	印表機
生產設備與工具	IT線材與耗材	IT配件
生產設備與工具	IT線材與耗材	IT耗材
生產設備與工具	IT線材與耗材	IT電源線材
生產設備與工具	IT線材與耗材	視訊線材
生產設備與工具	IT線材與耗材	網路線材
生產設備與工具	IT線材與耗材	USB線材
生產設備與工具	軟體授權	軟體授權
生產設備與工具	治具與夾具	治具與夾具
生產設備與工具	耗材	生產耗材
生產設備與工具	耗材	設備耗材
生產設備與工具	耗材	無塵室耗材
生產設備與工具	耗材	保護膜
生產設備與工具	耗材	托盤
生產設備與工具	耗材	標籤
生產設備與工具	包材	包裝材料
生產設備與工具	包材	緩衝保護材料
生產設備與工具	包材	膠帶
生產設備與工具	搬運倉儲物流	倉儲設備
生產設備與工具	搬運倉儲物流	搬運設備
生產設備與工具	搬運倉儲物流	搬運工具
生產設備與工具	搬運倉儲物流	搬運相關耗材
生產設備與工具	安全相關	安全防護
生產設備與工具	安全相關	安全管理
服務	委外服務	招聘
服務	委外服務	技術&維修服務
服務	委外服務	醫療服務
服務	委外服務	服務費
服務	委外服務	保全服務
服務	委外服務	培訓
服務	運輸服務對外	MP 運輸
服務	運輸服務對外	NPI 運輸
服務	運輸服務對外	物流費
服務	運輸服務對外	派車服務
服務	客戶餐飲服務	招待
服務	工程服務	工程租賃費
服務	工程服務	工程裝修
服務	工程服務	維護修服務
服務	工程服務	廢料處理
服務	工程服務	檢測費
服務	檢驗與校正服務	檢驗與校正服務
廠務基礎設施	電力與機電設備	電源設備
廠務基礎設施	電力與機電設備	電纜
廠務基礎設施	電力與機電設備	電機零件
廠務基礎設施	廠務工程耗材	水電材料
廠務基礎設施	廠務工程耗材	裝修材料
廠務基礎設施	廠務工程耗材	廠務工具
廠務基礎設施	廠務工程耗材	標記材料
廠務基礎設施	廠務工程耗材	環境相關
廠務基礎設施	廠務建設	廠務設備
行政與人資	醫務耗材	醫務耗材
行政與人資	辦公用品	辦公用品
行政與人資	辦公用品	宣傳宣導相關
行政與人資	辦公用品	清潔用品
行政與人資	辦公用品	生活用品
行政與人資	辦公設備與家具	椅子
行政與人資	辦公設備與家具	桌子
行政與人資	辦公設備與家具	辦公傢俱
行政與人資	辦公設備與家具	食堂設備
行政與人資	辦公設備與家具	辦公設備
行政與人資	薪酬保險	薪資
行政與人資	薪酬保險	津補貼
行政與人資	薪酬保險	加班費
行政與人資	薪酬保險	社會保險
行政與人資	人事福利	介紹費
行政與人資	人事福利	伙食福利
行政與人資	人事福利	工會費
行政與人資	人事福利	獎金
行政與人資	人事福利	體檢
行政與人資	人事福利	管理費
行政與人資	財務與行政費用	財務費用
行政與人資	財務與行政費用	行政管理費
行政與人資	財務與行政費用	其他費用
行政與人資	差旅與交通對內	差旅住宿費
行政與人資	差旅與交通對內	差旅交通費
行政與人資	差旅與交通對內	電信費
`;
}
// @end-legacy-unit 51

// @legacy-unit 52 381
export function buildTaxonomy(source) {
  return source.trim().split("\n").reduce((tree, line) => {
    const [level1, level2, level3] = line.split("\t").map((value) => value.trim());
    if (!level1 || !level2 || !level3) return tree;
    tree[level1] ??= {};
    tree[level1][level2] ??= [];
    if (!tree[level1][level2].includes(level3)) tree[level1][level2].push(level3);
    return tree;
  }, {});
}
// @end-legacy-unit 52

// @legacy-unit 53 392
export let REAL_OM_MASTER_SOURCE;
export function initializeREAL_OM_MASTER_SOURCEBinding() {
  REAL_OM_MASTER_SOURCE = Array.isArray(globalThis.REAL_OM_RESPONSIBILITY_MASTER)
  ? globalThis.REAL_OM_RESPONSIBILITY_MASTER
  : [];
}
// @end-legacy-unit 53

// @legacy-unit 54 396
export function buildTaxonomyFromOmMaster(masterRows) {
  return masterRows.reduce((tree, entry) => {
    const level1 = entry.level1En || entry.level1Cn || "";
    const level2 = entry.level2En || entry.level2Cn || "";
    const level3 = entry.level3En || entry.level3Cn || "";
    if (!level1 || !level2 || !level3) return tree;
    tree[level1] ??= {};
    tree[level1][level2] ??= [];
    if (!tree[level1][level2].includes(level3)) tree[level1][level2].push(level3);
    return tree;
  }, {});
}
// @end-legacy-unit 54

// @legacy-unit 55 409
export let LV_TAXONOMY_FALLBACK;
export function initializeLV_TAXONOMY_FALLBACKBinding() {
  LV_TAXONOMY_FALLBACK = buildTaxonomyFromOmMaster(REAL_OM_MASTER_SOURCE);
}
// @end-legacy-unit 55

// @legacy-unit 56 410
export let LV_TAXONOMY;
export function initializeLV_TAXONOMYBinding() {
  LV_TAXONOMY = Object.keys(LV_TAXONOMY_FALLBACK).length ? LV_TAXONOMY_FALLBACK : buildTaxonomy(LV_TAXONOMY_SOURCE);
}
// @end-legacy-unit 56

// @legacy-unit 57 412
export let PROJECT_TYPES;
export function initializePROJECT_TYPESBinding() {
  PROJECT_TYPES = ["G", "Non-G"];
}
// @end-legacy-unit 57

// @legacy-unit 58 414
export let OM_RESPONSIBILITY_MASTER;
export function initializeOM_RESPONSIBILITY_MASTERBinding() {
  OM_RESPONSIBILITY_MASTER = [...REAL_OM_MASTER_SOURCE];
}
// @end-legacy-unit 58

// @legacy-unit 408 2209
export function lvTaxonomyTreeFromApiRows(rows = []) {
  return rows.reduce((tree, row) => {
    const level1 = String(row.lv1 || "").trim();
    const level2 = String(row.lv2 || "").trim();
    const level3 = String(row.lv3 || "").trim();
    if (!level1 || !level2 || !level3) return tree;
    tree[level1] ??= {};
    tree[level1][level2] ??= [];
    if (!tree[level1][level2].includes(level3)) tree[level1][level2].push(level3);
    return tree;
  }, {});
}
// @end-legacy-unit 408

// @legacy-unit 409 2222
export function refreshLvTaxonomyConsumers() {
  syncCascade("natural");
  syncCascade("history");
  syncRequestItemPickerFilters();
  const pickerModal = document.getElementById("requestItemPickerModal");
  if (pickerModal && !pickerModal.hidden) renderRequestItemPicker();
}
// @end-legacy-unit 409

// @legacy-unit 410 2230
export async function hydrateLvTaxonomy() {
  if (!apiModeEnabled()) return;
  try {
    const payload = await apiRequest("/api/taxonomy/lv123");
    const apiTree = payload.tree && Object.keys(payload.tree).length ? payload.tree : lvTaxonomyTreeFromApiRows(payload.taxonomy || []);
    if (!Object.keys(apiTree).length) return;
    LV_TAXONOMY = apiTree;
    refreshLvTaxonomyConsumers();
  } catch (error) {
    console.warn("Lv123 taxonomy API unavailable; using local fallback.", error);
  }
}
// @end-legacy-unit 410

// @legacy-unit 635 4724
export function fillSelect(select, options, placeholder, value = "") {
  select.innerHTML = [`<option value="">${placeholder}</option>`, ...options.map((option) => `<option value="${option}">${option}</option>`)].join("");
  select.value = options.includes(value) ? value : "";
}
// @end-legacy-unit 635

// @legacy-unit 636 4729
export function level1Options() {
  return Object.keys(LV_TAXONOMY);
}
// @end-legacy-unit 636

// @legacy-unit 637 4733
export function level2Options(level1) {
  return level1 ? Object.keys(LV_TAXONOMY[level1] || {}) : [];
}
// @end-legacy-unit 637

// @legacy-unit 638 4737
export function level3Options(level1, level2) {
  return level1 && level2 ? LV_TAXONOMY[level1]?.[level2] || [] : [];
}
// @end-legacy-unit 638

// @legacy-unit 639 4741
export function syncCascade(prefix, values = {}) {
  const level1 = document.getElementById(`${prefix}Level1`);
  const level2 = document.getElementById(`${prefix}Level2`);
  const level3 = document.getElementById(`${prefix}Level3`);
  if (!level1 || !level2 || !level3) return;
  fillSelect(level1, level1Options(), "All Level 1", values.level1 ?? level1.value);
  fillSelect(level2, level2Options(level1.value), level1.value ? "All Level 2" : "Select Level 1 first", values.level2 ?? level2.value);
  fillSelect(level3, level3Options(level1.value, level2.value), level2.value ? "All Level 3" : "Select Level 2 first", values.level3 ?? level3.value);
}
// @end-legacy-unit 639
