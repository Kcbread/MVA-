const STAGES = ["p10", "p11", "evt", "dvt", "pvt", "mp"];
const STAGE_LABELS = {
  p0: "P0",
  p10: "P1.0",
  p11: "P1.1",
  evt: "EVT",
  dvt: "DVT",
  pvt: "PVT",
  mp: "MP",
};
const DEMAND_UNIT_FALLBACK = "ENG1";
const DEMAND_UNIT_OPTIONS = ["ENG1", "ENG2", "ENG3", "QA G-PQC", "GG-WH", "MFG", "FATP TE", "FATP IQC", "FATP PQE", "Q-LAB", "REL", "IT", "FAC", "FAE", "IQC", "ME", "MFG NONG", "ORT", "PQE", "TE", "WH"];
const DEMAND_UNIT_ALIAS_MAP = {
  "qa g -pqc": "QA G-PQC",
  "qa g - pqc": "QA G-PQC",
};
const QUANTITY_DASHBOARD_UNITS = ["MFG", "FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
const STATION_MASTER = ["CG", "BG", "FATP", "Test", "Hybrid", "Auto", "ENG Pack", "Zombie", "Laser_pico", "Rework", "Repair", "WH"];
const DEMAND_TYPES = ["MFG", "Non-MFG"];
const DEMAND_TYPE_MFG = "MFG";
const DEMAND_TYPE_NON_MFG = "Non-MFG";
const ITEM_OWNER_OM = "OM";
const ITEM_OWNER_MFG = "MFG";
const ITEM_OWNER_UNIT = "Unit";
const ITEM_OWNER_PENDING = "Owner pending";
const ITEM_OWNER_NON_OM = "Non-OM";

function normalizeSeedProjectCode(value) {
  return String(value || "").trim();
}

function seedStageKey(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const aliases = {
    p10: "p10",
    "p1.0": "p10",
    p11: "p11",
    "p1.1": "p11",
    evt: "evt",
    dvt: "dvt",
    pvt: "pvt",
    mp: "mp",
  };
  return aliases[normalized] || "";
}

function derivedSeedStageKey(row) {
  const directStage = seedStageKey(row?.stage);
  if (directStage) return directStage;
  return STAGES.find((stage) => Number(row?.[stage] || 0) > 0) || "";
}

function deriveProjectConfigsFromRealRecords() {
  const records = Array.isArray(globalThis.REAL_MVA_PURCHASE_RECORDS) ? globalThis.REAL_MVA_PURCHASE_RECORDS : [];
  if (!records.length) return [];
  const configMap = new Map();
  records.forEach((row) => {
    const code = normalizeSeedProjectCode(row?.project);
    if (!code) return;
    const stageKey = derivedSeedStageKey(row);
    const config = configMap.get(code) || {
      code,
      projectType: row?.projectType === "Non-G" ? "Non-G" : "G",
      openToUser: true,
      stageCounts: {},
      stageDates: {},
    };
    config.projectType = row?.projectType === "Non-G" ? "Non-G" : config.projectType;
    if (stageKey) {
      config.stageCounts[stageKey] = (config.stageCounts[stageKey] || 0) + 1;
      const requiredDate = String(row?.requiredDeliveryDate || row?.requiredDeliveryDateDri || "").trim();
      if (requiredDate && /^\d{4}-\d{2}-\d{2}$/.test(requiredDate) && !config.stageDates[stageKey]) {
        config.stageDates[stageKey] = requiredDate;
      }
    }
    configMap.set(code, config);
  });
  return [...configMap.values()]
    .map((config) => {
      const currentPhase = STAGES
        .map((stage) => ({ stage, count: config.stageCounts[stage] || 0 }))
        .sort((left, right) => right.count - left.count || STAGES.indexOf(right.stage) - STAGES.indexOf(left.stage))[0]?.count
        ? STAGES
          .map((stage) => ({ stage, count: config.stageCounts[stage] || 0 }))
          .sort((left, right) => right.count - left.count || STAGES.indexOf(right.stage) - STAGES.indexOf(left.stage))[0].stage
        : STAGES[0];
      return {
        code: config.code,
        projectType: config.projectType,
        currentPhase: STAGE_LABELS[currentPhase],
        openToUser: true,
        stageDates: config.stageDates,
      };
    })
    .sort((left, right) => {
      if (left.code === "P26") return -1;
      if (right.code === "P26") return 1;
      if (left.projectType !== right.projectType) return left.projectType.localeCompare(right.projectType);
      return left.code.localeCompare(right.code);
    });
}

let projectConfigs = Array.isArray(globalThis.REAL_PROJECT_CONFIGS) && globalThis.REAL_PROJECT_CONFIGS.length
  ? globalThis.REAL_PROJECT_CONFIGS
  : deriveProjectConfigsFromRealRecords().length
    ? deriveProjectConfigsFromRealRecords()
    : [
  {
    code: "P26",
    projectType: "G",
    currentPhase: "P1.0",
    openToUser: true,
    stageDates: { p10: "2026-02-19", p11: "2026-02-19", evt: "2026-02-19", dvt: "2026-03-09", pvt: "2026-04-23", mp: "2026-05-07" },
  },
  {
    code: "OR5",
    projectType: "Non-G",
    currentPhase: "EVT",
    openToUser: true,
    stageDates: { evt: "2026-03-20", dvt: "2026-04-17", pvt: "2026-05-15", mp: "2026-06-12" },
  },
];
let PROJECTS = projectConfigs.map((project) => project.code);
const DEMAND_STAGE_ORDER = ["p0", ...STAGES];
const QUOTE_EXPIRING_SOON_DAYS = 10;

const LEGACY_CATEGORY_SOURCE = `
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

function buildTaxonomy(source) {
  return source.trim().split("\n").reduce((tree, line) => {
    const [level1, level2, level3] = line.split("\t").map((value) => value.trim());
    if (!level1 || !level2 || !level3) return tree;
    tree[level1] ??= {};
    tree[level1][level2] ??= [];
    if (!tree[level1][level2].includes(level3)) tree[level1][level2].push(level3);
    return tree;
  }, {});
}

const REAL_OM_MASTER_SOURCE = Array.isArray(globalThis.REAL_OM_RESPONSIBILITY_MASTER)
  ? globalThis.REAL_OM_RESPONSIBILITY_MASTER
  : [];

function buildTaxonomyFromOmMaster(masterRows) {
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

const LV_TAXONOMY = buildTaxonomyFromOmMaster(REAL_OM_MASTER_SOURCE);

const PROJECT_TYPES = ["G", "Non-G"];

const OM_RESPONSIBILITY_MASTER = [...REAL_OM_MASTER_SOURCE];

const STANDARD_PART_NAME_SEEDS = [
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

const MATERIAL_NO_PREFIX = "MVA";
const FACTORY_MATERIAL_NO_PREFIX = "FM-VN-MVA";
const MATERIAL_STATUS_ACTIVE = "Active - User Created";
const MATERIAL_STATUS_PENDING_PROCUREMENT = "PAS/PUR Material Pending";
const MATERIAL_CREATION_EVENT = "Material No. Created";
const MATERIAL_STANDARD_NAME_REQUESTED = "Standard Name Requested";

const roleProfiles = {
  requester: { name: "Requester", dept: "MFG", functionName: "Demand Requester", defaultView: "department" },
  manager: { name: "Cost Manager", dept: "MFG", functionName: "Cost / P&L Review + Final Authorization", defaultView: "manager" },
  procurement: { name: "MFG Coordinator", dept: "MFG", functionName: "MFG Demand Coordination", defaultView: "procurement" },
  om: { name: "OM Purchasing", dept: "Operations", functionName: "Quotation & Export Package", defaultView: "om" },
  omLeader: { name: "OM Leader", dept: "Operations", functionName: "Exchange Rate / Package Owner", defaultView: "om" },
  omMember: { name: "OM Purchasing", dept: "Operations", functionName: "PAS / Quote / Export Operator", defaultView: "om" },
  dri: { name: "Dept DRI", dept: "MFG", functionName: "Department Price Review", defaultView: "priceReview" },
  projectDri: { name: "Budget Approver", dept: "PMO", functionName: "Budget Approval", defaultView: "priceReview" },
  sourcing: { name: "Sourcing", dept: "Supply Chain", functionName: "RFQ Quotation", defaultView: "sourcing" },
  buyer: { name: "Buyer", dept: "Supply Chain", functionName: "External PR / PO Tracking", defaultView: "buyer" },
  admin: { name: "Admin", dept: "IT", functionName: "System Admin", defaultView: "adminSetup" },
};

const pageTitles = {
  department: "Requester Workspace",
  manager: "Cost Manager Dashboard",
  procurement: "MFG Demand Coordination",
  om: "OM Purchasing",
  uatFeedbackReview: "UAT Feedback Review",
  priceReview: "Price Review",
  sourcing: "Sourcing RFQ",
  buyer: "Buyer PR / PO",
  adminSetup: "Access & Approval Setup",
};

const testLoginRoleAccounts = {
  requester: "V1524505",
  dri: "dept-dri",
  omLeader: "maint5",
  omMember: "giangth1",
  manager: "cost-owner",
  projectDri: "budget-approver",
  buyer: "buyer-handoff",
  admin: "admin",
};

const HANDOFF_READY = "Ready for Handoff";
const HANDOFF_EXPORTED = "Exported";
const HANDOFF_SENT_TO_OM = "Sent to OM Purchasing";
const HANDOFF_SENT_TO_BUYER = "Sent to Buyer";
const HANDOFF_WAITING_PAS = "Waiting PAS Review";
const OM_RECEIVED = "Received Handoff";
const OM_UPDATED = "External System Updated";
const OM_QUOTE_NEEDED = "Quote Needed";
const OM_QUOTE_READY = "Quote Ready";
const OM_READY_TO_EXPORT = "Ready to Export";
const OM_WAITING_USER_CONFIRM = "Waiting User A Confirmation";
const OM_USER_CONFIRMED = "Requester Confirmed";
const USER_CONFIRMATION_NOT_REQUIRED = "User Confirmation Not Required";
const PRICE_AUTO_CLEARED = "Auto Cleared";
const PRICE_ESCALATION_REQUIRED = "Price Escalation Required";
const PRICE_ESCALATION_PENDING_DRI = "Pending Dept DRI Review";
const PRICE_ESCALATION_PENDING_PROJECT_DRI = "Pending Budget Approver Review";
const PRICE_ESCALATION_APPROVED = "Price Escalation Approved";
const PRICE_ESCALATION_REJECTED = "Price Escalation Rejected";
const DEPT_DRI_SUBMISSION_PENDING = "Pending Dept DRI Submission Review";
const DEPT_DRI_SUBMISSION_APPROVED = "Dept DRI Submission Approved";
const DEPT_DRI_SUBMISSION_REJECTED = "Dept DRI Submission Rejected";
const COST_MANAGER_AUTH_PENDING = "Pending Cost Manager Authorization";
const COST_MANAGER_AUTH_APPROVED = "Cost Manager Authorized";
const COST_MANAGER_AUTH_REJECTED = "Cost Manager Rejected";
const OM_PREPARING_EXPORT = "Preparing Export Package";
const OM_READY_FOR_CFA = "Ready for CFA";
const OM_READY_FOR_ECS = "Ready for ECS";

let adminApprovalSetup = {
  thresholds: { historyPriceDeltaUsd: 0.4 },
  approvalChain: ["Dept DRI", "Budget Approver"],
  users: [
    { id: "user-a", name: "Requester", email: "steven@fih-foxconn.com", department: "MFG", role: "requester" },
    { id: "cost-manager", name: "Cost Manager", email: "cost-manager@fih-foxconn.com", department: "MFG", role: "manager" },
    { id: "om-leader-mai", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader" },
    { id: "om-member-giang", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember" },
    { id: "om-member-linh", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember" },
    { id: "dri-default", name: "Dept DRI", email: "dri@fih-foxconn.com", department: "MFG", role: "dri" },
    { id: "project-dri-default", name: "Budget Approver", email: "budget-approver@fih-foxconn.com", department: "PMO", role: "projectDri" },
    { id: "admin-default", name: "Admin", email: "admin@fih-foxconn.com", department: "IT", role: "admin" },
  ],
  approverMap: [
    { scope: "MFG", dri: "Dept DRI", projectDri: "Budget Approver" },
    { scope: "Computer / IT", dri: "Dept DRI", projectDri: "Budget Approver" },
    { scope: "Temporary Budget", dri: "Dept DRI", projectDri: "Budget Approver" },
  ],
  updatedBy: "System",
  updatedAt: "",
};
const OM_EXPORTED_CFA = "Exported to CFA";
const OM_EXPORTED_ECS = "Exported to ECS";
const USER_CANCELLED_REQUEST = "Cancelled by Requester";
const AMENDMENT_WAITING_OM = "Waiting OM Amendment";
const AMENDMENT_WAITING_USER_CONFIRM = "Waiting Requester Amendment Confirmation";
const AMENDMENT_IN_PROGRESS = "Amendment In Progress";
const AMENDMENT_REWORK_REQUIRED = "Amendment Rework Required";
const AMENDMENT_CONFIRMED = "Amendment Confirmed";
const AMENDMENT_SUBMITTED = "Submitted Amendment";
const AMENDMENT_APPROVED = "Amendment Approved";
const AMENDMENT_REJECTED = "Amendment Rejected";
const AMENDMENT_SUPERSEDED = "Superseded by Amendment";
const AMENDMENT_REMOVED = "Removed by Amendment";
const OM_EXPORT_INVALIDATED = "Invalidated by Amendment";
const OM_QUOTE_REVIEW_REQUIRED = "Quote Review Required";
const OM_EXTERNAL_PENDING = "External Review Pending";
const OM_EXTERNAL_ACCEPTED = "External Accepted";
const OM_REJECTED_TO_DRI = "Rejected to DRI";
const ROUTE_REUSE = "Sourcing - RFQ Required";
const ROUTE_REQUOTE = "Sourcing - RFQ Required";
const ROUTE_SOURCING = "Sourcing - New Material";
const QUOTE_EXCEPTION_NOTE = "Quote data update required";
const OM_EXCHANGE_RATE_VND_USD = 26188;
const DEFAULT_EXCHANGE_RATE_MONTH = "2026-05";
const OM_PAYMENT_METHOD = "MVA";
const OM_COST_TYPE_EXPENSE = "Expense";
const OM_COST_TYPE_CAPEX = "Capex";
const OM_COST_TYPE_TARGET_MAP = {
  [OM_COST_TYPE_EXPENSE]: "ECS",
  [OM_COST_TYPE_CAPEX]: "CFA",
};
const OM_DEPARTMENT_CODE = "R3S4C5VN";
const PAS_LEGAL_NAME = "A0S4015 | FUSHAN TECHNOLOGY (VIETNAM) LIMITED LIABILITY COMPANY";
const PAS_REQUEST_DEPT = "R3S4C5VN-IDM1";
const PAS_DATA_TRANSFER_TO = "Vietnam ASSET";
const OM_REQUESTOR = "OM Purchasing";
const OM_CONTACT = "";
const RFQ_REPLY_BUSINESS_DAYS = 5;
const RFQ_OVERDUE_GRACE_DAYS = 2;
const BUYER_RECEIVED = "Buyer Received";
const BUYER_BLOCKED = "Blocked";
const BUYER_PR_CREATED = "PR Created";
const BUYER_PO_ISSUED = "PO Issued";
const BUYER_COMPLETED = "Completed";
const BUYER_RETURNED = "Rejected to DRI";
const EXT_PACKAGE_PREPARING = "Package Preparing";
const EXT_PACKAGE_READY = "Package Ready";
const EXT_SUBMITTED = "Submitted to External System";
const EXT_REVIEW = "External Review";
const EXT_ACCEPTED = "External Accepted";
const EXT_BLOCKED = "Blocked";
const EXT_REJECTED_DRI = "Rejected to DRI";
const EXT_PR_CREATED = "PR Created";
const EXT_PO_ISSUED = "PO Issued";
const EXT_COMPLETED = "Completed";
const EXT_CANCELLED = "Cancelled";
const EXTERNAL_PROGRESS_STATUSES = [
  EXT_PACKAGE_PREPARING,
  EXT_PACKAGE_READY,
  EXT_SUBMITTED,
  EXT_REVIEW,
  EXT_ACCEPTED,
  EXT_BLOCKED,
  EXT_REJECTED_DRI,
  EXT_PR_CREATED,
  EXT_PO_ISSUED,
  EXT_COMPLETED,
  EXT_CANCELLED,
];
const PAS_NOT_REQUIRED = "PAS Not Required";
const PAS_REQUIRED = "PAS Required";
const PAS_WAITING = "Waiting PAS Review";
const PAS_APPROVED = "PAS Approved";
const PAS_BUDGET_ISSUED = "PAS Budget Code Issued";
const OM_SCOPE_STANDARD = "OM Standard Bucket";
const OM_SCOPE_NEED_SPEC = "OM Need Final Spec";
const OM_SCOPE_EXCEPTION = "OM Item Exception";
const OM_SCOPE_COORDINATOR = "MFG / Sourcing Review";
const OM_SCOPE_NOT = "Not OM Scope";
const OM_COLLECTION_COLLECTING = "Collecting Demand";
const OM_COLLECTION_QUOTATION = "Moved to Quotation";
const OM_FINAL_SPEC_REQUIRED = "Final Spec Required";
const OM_FINAL_SPEC_READY = "Final Spec Ready";
const RFQ_BUYERS = [
  { name: "Consumables Sourcing", email: "consumables.sourcing@example.com" },
  { name: "Service Sourcing", email: "service.sourcing@example.com" },
  { name: "IT Sourcing", email: "it.sourcing@example.com" },
  { name: "EQ Sourcing", email: "eq.sourcing@example.com" },
];

const DRI_CONTACT_MASTER = [
  { projectType: "G", department: "MFG", name: "To Thi Phuong Anh", employeeId: "V1524505", email: "anhttp@fih-foxconn.com", phone: "4327" },
  { projectType: "G", department: "QA", name: "Ngo Thi Hoa", employeeId: "V1524668", email: "hoant3@fih-foxconn.com", phone: "" },
  { projectType: "G", department: "TE", name: "Nguyen Trung Kien", employeeId: "V1524574", email: "kiennt1@fih-foxconn.com", phone: "" },
  { projectType: "G", department: "ENG1", name: "Ngo Van Duong", employeeId: "V1523845", email: "duongnv2@fih-foxconn.com", phone: "4328" },
  { projectType: "G", department: "ENG2", name: "Do Thi Xuan", employeeId: "V1536196", email: "xuandt99@fih-foxconn.com", phone: "4347" },
  { projectType: "G", department: "ENG3", name: "Nguyen Van Huynh", employeeId: "V1536667", email: "huynhnv2@fih-foxconn.com", phone: "4500" },
  { projectType: "G", department: "GG-WH", name: "Nguyen Thi Viet", employeeId: "V1524536", email: "Vietnt@fih-foxconn.com", phone: "4478" },
  { projectType: "G", department: "REL", name: "Laymu Chen", employeeId: "504000", email: "LaymuTHChen@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "FAE", name: "Vu Xuan Bach", employeeId: "V1521896", email: "bachvx@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "WH", name: "Le Thi Lich", employeeId: "V1525678", email: "lichlt@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "ME", name: "Nguyen Thi Hai", employeeId: "V1516000", email: "haint2@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "MFG", name: "Dang Thi Ban", employeeId: "V1547168", email: "bandt1@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "IQC", name: "Nguyen Thi Hien", employeeId: "V1524357", email: "hiennt3@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "PQE", name: "Nguyen Thi Phuong", employeeId: "V1544473", email: "phuongnt18@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "TE", name: "Nguyen Hai Yen", employeeId: "V1549748", email: "yennh@fih-foxconn.com", phone: "" },
  { projectType: "Non-G", department: "ORT", name: "Nguyen Van Thai", employeeId: "V1552266", email: "thainv3@fih-foxconn.com", phone: "" },
];
const BUYER_RULES = [
  { buyer: "IT Sourcing", keywords: ["laptop", "computer", "pc", "workstation", "monitor", "switch", "keyboard", "mouse", "scanner", "printer", "camera", "cable"], level2: ["IT硬體與設備", "IT線材與耗材"] },
  { buyer: "EQ Sourcing", keywords: ["fixture", "jig", "chamber", "feeder", "pallet", "rack", "cart", "gauge", "caliper"], level2: ["產線通用設備", "治具與夾具", "搬運倉儲物流", "設備工程工具"] },
  { buyer: "Consumables Sourcing", keywords: ["wiper", "glove", "mask", "label", "tape", "film", "tray", "carton", "foam"], level2: ["耗材", "包材", "安全相關"] },
  { buyer: "Service Sourcing", keywords: ["service", "shipment", "repair", "training", "security", "calibration"], level1: ["服務"] },
];
const OM_BUY_SCOPE_RULES = [
  { status: OM_SCOPE_STANDARD, keywords: ["pc", "ipc", "pc(assy)", "pc(qa)", "pc(offline)", "laptop", "workstation", "monitor", "keyboard", "mouse", "barebones", "cloud terminal", "tablet", "電腦", "工業電腦", "筆記本", "螢幕", "顯示器", "鍵盤", "鼠標"] },
  { status: OM_SCOPE_NEED_SPEC, keywords: ["server", "storage", "printer", "scanner", "barcode", "rfid", "pda", "data collector", "network switch", "switch", "router", "wi-fi", "wifi", "firewall", "network rack", "network cabinet", "access point", "ap", "software", "license", "subscription", "video conference", "conference", "access control", "attendance", "surveillance", "monitoring"] },
  { status: OM_SCOPE_NEED_SPEC, keywords: ["usb", "hdmi", "vga", "network cable", "patch cord", "computer power cord", "power adapter", "charger", "pc peripheral", "computer adapter", "computer audio", "docking station"] },
  { status: OM_SCOPE_NEED_SPEC, keywords: ["電腦", "工業電腦", "筆記本", "螢幕", "顯示器", "鍵盤", "鼠標", "條碼", "掃描", "伺服器", "服務器", "存儲", "網路", "路由器", "交換機", "軟件", "授權", "一卡通", "門禁", "考勤", "監控", "視訊會議"] },
];
function omCatalogItemsFromMaster(masterRows) {
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

const OM_CATALOG_ITEMS = omCatalogItemsFromMaster(OM_RESPONSIBILITY_MASTER);
const MFG_PACKAGE_ROWS = [
  { id: "MFG-PKG-P26-CONSUMABLE", project: "P26", phase: "P1.0", packageType: "Consumable", owner: "MFG Coordinator", required: 38, completed: 34, status: "Missing Data", excelSheet: "Consumable", detail: "Consumables require English/Vietnamese name, spec, picture, unit, usage qty, purpose, budget, type, remark, and quotation count." },
  { id: "MFG-PKG-P26-EQ", project: "P26", phase: "P1.0", packageType: "EQ", owner: "MFG Coordinator", required: 18, completed: 18, status: "Ready for Manager", excelSheet: "EQ", detail: "Equipment package is complete and ready for manager collection review." },
  { id: "MFG-PKG-P26-VPP", project: "P26", phase: "P1.0", packageType: "VPP / Office Consumable", owner: "MFG Coordinator", required: 12, completed: 10, status: "In Progress", excelSheet: "VPP", detail: "VPP rows are mixed office / consumable demand and need usage purpose confirmation." },
  { id: "MFG-PKG-OR5-CONSUMABLE", project: "OR5", phase: "EVT", packageType: "Consumable", owner: "MFG Coordinator", required: 30, completed: 30, status: "Ready for Manager", excelSheet: "Consumable", detail: "OR5 consumable demand is complete and ready for manager package review." },
  { id: "MFG-PKG-OR5-EQ", project: "OR5", phase: "EVT", packageType: "EQ", owner: "MFG Coordinator", required: 14, completed: 11, status: "Missing Data", excelSheet: "EQ", detail: "EQ package still needs picture/spec evidence before collection can be completed." },
];

let currentRole = "requester";
let currentUserRole = "requester";
let currentSessionUser = null;
let apiSessionReady = false;
let omAssignees = [
  { id: "om-leader-mai", employeeId: "maint5", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader" },
  { id: "om-member-giang", employeeId: "giangth1", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember" },
  { id: "om-member-linh", employeeId: "linhnp", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember" },
];
let omAssignmentMap = new Map();
let uatFeedbackRows = [];
let localUatFeedbackRows = [];
let activeUatFeedbackContext = null;
let currentView = "department";
let currentProject = "P26";
let currentProjectType = "G";
let currentRequesterPersonaId = "";
let currencyDisplay = "VND";
let monthlyExchangeRates = [{
  exchangeRateMonth: DEFAULT_EXCHANGE_RATE_MONTH,
  usdToVndRate: OM_EXCHANGE_RATE_VND_USD,
  rateUpdatedBy: "System Default",
  rateUpdatedAt: "",
  isFallback: true,
}];
let currentWarehouseMonth = activeExchangeRateMonth();
let warehouseStockRecords = [
  { id: "WH-STOCK-001", transactionType: "stock-in", status: "Available", month: "2026-06", item: "Mini PC (Assy)", spec: "LAMITOUCH LM-30 CPU:i3-6100, RAM 16GB DDR4 3200, SSD 256G", itemOwner: "OM", qty: 12, ownedQty: 12, sourceProject: "P26", sourceLine: "Line 1", sourceStage: "MP", sourceStation: "CG", sourceRequestId: "WAREHOUSE-P26-MP", createdBy: "OM warehouse", createdAt: "2026-06-03T08:30:00.000Z", reason: "OM warehouse stock remaining from P26 MP CG." },
  { id: "WH-STOCK-002", transactionType: "stock-in", status: "Available", month: "2026-06", item: "Monitor 1", spec: "DELL E2225HM, 21.5 inch HDMI cable", itemOwner: "OM", qty: 18, ownedQty: 18, sourceProject: "OR5", sourceLine: "Line 1", sourceStage: "P1.0", sourceStation: "CG", sourceRequestId: "WAREHOUSE-OR5-P10", createdBy: "OM warehouse", createdAt: "2026-06-03T08:45:00.000Z", reason: "Line 1 residual OM monitor stock." },
  { id: "WH-STOCK-003", transactionType: "stock-in", status: "Available", month: "2026-06", item: "IPC", spec: "DELL Pro Tower QCT1250, Core i3-14100, RAM 8GB DDR5, SSD 512GB", itemOwner: "OM", qty: 2, ownedQty: 2, sourceProject: "F27", sourceLine: "Line 1", sourceStage: "P1.0", sourceStation: "CG", sourceRequestId: "WAREHOUSE-F27-L1-CG", createdBy: "OM warehouse", createdAt: "2026-06-05T09:10:00.000Z", reason: "F27 Line 1 has 2 extra OM-owned CG IPC units." },
  { id: "WH-USE-OR6-IPC-001", transactionType: "use-candidate", status: "Pending OM", month: "2026-06", item: "IPC", spec: "DELL Pro Tower QCT1250, Core i3-14100, RAM 8GB DDR5, SSD 512GB", itemOwner: "OM", qty: 2, sourceProject: "F27", sourceLine: "Line 1", sourceStage: "P1.0", sourceStation: "CG", sourceRequestId: "WAREHOUSE-F27-L1-CG", targetProject: "OR6", targetLine: "Line 2", targetStage: "EVT", targetStationOrUnit: "CG", targetRequestId: "REQ-OR6-L2-IPC", createdBy: "Requester", createdAt: "2026-06-05T09:20:00.000Z", reason: "OR6 Line 2 can use 2 IPC units from F27 Line 1 OM stock." },
];
let warehouseLockdownRecords = [];
let currentDeptTab = "request";
let currentManagerTab = "review";
let currentDemandAnalysisTab = "costDashboard";
let selectedManagerQuantityKeyId = "";
const expandedManagerQuantityRows = new Set();
const expandedDemandEditorCarryoverRows = new Set();
let currentHandoffTab = "queue";
let currentOmTab = "submission";
let currentPriceReviewTab = "pending";
let currentDeptDemandMode = "mfg";
let currentDeptDemandPhase = nextBuyStageForProject(currentProject) || currentStageForProject(currentProject);
let lastRequestProject = currentProject;
let lastRequestPhase = currentDeptDemandPhase;
let lastDemandType = DEMAND_TYPE_MFG;
let itemPickerDemandType = DEMAND_TYPE_MFG;
let itemPickerStage = currentDeptDemandPhase;
let itemPickerStation = STATION_MASTER[0];
let itemPickerDemandUnit = DEMAND_UNIT_FALLBACK;
let itemPickerRequestLine = "Line 1";
let requestWorksheetMode = DEMAND_TYPE_MFG;
let requestWorksheetLine = "Line 1";
let requestWorksheetAddQuery = "";
let requestWorksheetSelectedSource = "";
let requestWorksheetAddPhase = currentDeptDemandPhase;
let requestItemPickerQuery = "";
let requestItemPickerSourceMode = "catalog";
let requestItemPickerLevel1 = "";
let requestItemPickerLevel2 = "";
let requestItemPickerLevel3 = "";
let currentDeptDemandDepartment = "";
let requestSequence = 1;
let newItemSequence = 1;
let masterSequence = 1;
let materialSequence = 1;
let handoffHistorySequence = 1;
let omHistorySequence = 1;
let dispatchHistorySequence = 1;
let externalProgressSequence = 1;
let selectedManagerRequestId = null;
let selectedNewItemId = null;
let activeDemandRequestId = "";
let searchResults = [];
let naturalSearchActive = false;
let historyResults = [];
let historySearchActive = false;
let historySelections = new Set();
let currentReuseMode = "catalog";
let newItemSelections = new Set();
let omSelections = new Set();
let requests = [];
let newItemSuggestions = [];

globalThis.currentUserRole = currentUserRole;
globalThis.currentView = currentView;
globalThis.currentDeptTab = currentDeptTab;
let handoffHistory = [];
let omHistory = [];
let dispatchHistory = [];
let purchaseRecords = makePurchaseRecords();
let materialMasterRecords = [];
let vendorMaterialMappings = makeVendorMaterialMappings(purchaseRecords);
let demandBaselines = makeDemandBaselines(purchaseRecords);
let actualBuyRecords = makeActualBuyRecords(purchaseRecords);
let toastSequence = 1;
let pendingConfirmAction = null;
let pendingOmExternalResultIds = [];
let pendingExternalProgressSource = "om";
let pendingRfqEmailRows = [];
let pendingMaterialEntryId = "";
let pendingStandardPickerId = "";
let standardPickerQuery = "";
let batchMaterialIds = [];
let activeBatchMaterialId = "";
const STANDARD_INLINE_LIMIT = 20;

function normalizedContactPhone(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "x") return "";
  return text.replace(/\.0$/, "");
}

function contactIdFor(contact) {
  return normalize([contact.projectType, contact.department, contact.employeeId, contact.email, contact.name].join("|")).replace(/[^a-z0-9]+/g, "-");
}

function requesterResponsibilityRows() {
  const rows = Array.isArray(window.REQUESTER_RESPONSIBILITY_MASTER) ? window.REQUESTER_RESPONSIBILITY_MASTER : [];
  return rows.filter((row) => row && (row.employeeId || row.name || row.department || row.project));
}

function normalizeLoginIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}

function requesterPersonas() {
  const contacts = new Map();
  requesterResponsibilityRows().forEach((row) => {
    const employeeId = String(row.employeeId || "").trim();
    const email = String(row.email || "").trim();
    const key = employeeId || email || `${row.projectFamily}-${row.department}-${row.name}`;
    if (!key) return;
    const id = contactIdFor({
      projectType: row.projectFamily || "",
      department: row.department || "",
      employeeId,
      email,
      name: row.name || "",
    });
    const existing = contacts.get(id);
    const project = String(row.project || "").trim();
    const nextProjects = [...new Set([...(existing?.projects || []), ...(project ? [project] : [])])];
    contacts.set(id, {
      id,
      projectType: existing?.projectType || row.projectFamily || "",
      project: existing?.project || project,
      projects: nextProjects,
      department: existing?.department || row.department || "",
      name: existing?.name || row.name || employeeId || email || "Requester",
      employeeId: existing?.employeeId || employeeId,
      email: existing?.email || email,
      emailNote: existing?.emailNote || row.emailNote || "",
      phone: existing?.phone || normalizedContactPhone(row.phone),
      budgetApprover: existing?.budgetApprover || row.budgetApprover || "",
      source: "DRIs list (2).xlsx",
    });
  });
  purchaseRecords.forEach((row) => {
    if (!(row.requesterName || row.email || row.requesterEmployeeId)) return;
    const contact = {
      id: contactIdFor({
        projectType: row.projectType || projectTypeFor(row.project),
        department: row.department || "",
        employeeId: row.requesterEmployeeId || "",
        email: row.email || "",
        name: row.requesterName || "",
      }),
      projectType: row.projectType || projectTypeFor(row.project),
      project: row.project || "",
      department: row.department || "",
      name: row.requesterName || row.email || "Requester",
      employeeId: row.requesterEmployeeId || "",
      email: row.email || "",
      phone: normalizedContactPhone(row.phone),
      projects: row.project ? [row.project] : [],
      source: "Purchase records",
    };
    if (!contacts.has(contact.id)) contacts.set(contact.id, contact);
  });
  return [...contacts.values()].sort((left, right) => `${left.projectType} ${left.department} ${left.name}`.localeCompare(`${right.projectType} ${right.department} ${right.name}`));
}

function currentRequesterPersona() {
  return requesterPersonas().find((item) => item.id === currentRequesterPersonaId) || null;
}

function findRequesterPersonaByIdentifier(identifier) {
  const normalized = normalizeLoginIdentifier(identifier);
  if (!normalized) return null;
  return requesterPersonas().find((persona) => {
    return [
      persona.employeeId,
      persona.email,
      persona.id,
      persona.name,
    ].some((value) => normalizeLoginIdentifier(value) === normalized);
  }) || null;
}

function applyRequesterPersonaContext(persona) {
  if (!persona) return;
  currentRequesterPersonaId = persona.id || currentRequesterPersonaId;
  currentProjectType = persona.projectType || currentProjectType;
  currentProject = persona.project || persona.projects?.[0] || currentProject;
  currentDeptDemandDepartment = persona.department || currentDeptDemandDepartment;
  lastRequestProject = currentProject;
  currentDeptDemandPhase = nextBuyStageForProject(currentProject) || currentDeptDemandPhase;
  lastRequestPhase = currentDeptDemandPhase;
}

function requesterDisplayName() {
  return currentRequesterPersona()?.name || roleProfiles.requester.name;
}

function renderRequesterPersonaOptions() {
  const select = document.getElementById("requesterPersonaSelect");
  if (!select) return;
  const personas = requesterPersonas();
  const current = select.value || currentRequesterPersonaId;
  select.innerHTML = `<option value="">Auto from Excel requester list</option>${personas.slice(0, 160).map((person) => `<option value="${person.id}" ${person.id === current ? "selected" : ""}>${person.employeeId || "No ID"} · ${person.name} · ${person.department || "Dept"} · ${(person.projects || [person.project]).filter(Boolean).join("/") || person.projectType}</option>`).join("")}`;
  if (current && personas.some((person) => person.id === current)) select.value = current;
}

function showToast(message, type = "info") {
  const toastRegion = document.getElementById("toastRegion");
  if (!toastRegion) return;
  const toast = document.createElement("article");
  const id = toastSequence++;
  const title = type === "error" ? "Action needed" : type === "success" ? "Success" : "Notice";
  toast.className = `toast ${type}`;
  toast.dataset.toastId = String(id);
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  toastRegion.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, type === "error" ? 5200 : 3200);
}

function showConfirm({ title, message, confirmLabel = "Confirm", tone = "primary", onConfirm }) {
  pendingConfirmAction = onConfirm;
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  const confirmButton = document.getElementById("confirmActionButton");
  confirmButton.textContent = confirmLabel;
  confirmButton.className = tone === "danger" ? "danger" : "primary";
  document.getElementById("confirmModal").hidden = false;
}

function hideConfirm() {
  pendingConfirmAction = null;
  document.getElementById("confirmModal").hidden = true;
}

function runConfirmedAction() {
  const action = pendingConfirmAction;
  hideConfirm();
  if (typeof action === "function") action();
}

function makePurchaseRecords() {
  return realMvaPurchaseRecords();
}

function stageLabel(stage) {
  return STAGE_LABELS[stage] || String(stage || "").toUpperCase();
}

function recordIndex(record) {
  return Number(String(record.id || "").match(/\d+/)?.[0] || 0);
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function stableHash(value) {
  let hash = 2166136261;
  String(value || "").split("").forEach((char) => {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  });
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function realMvaPurchaseRecords() {
  const rows = Array.isArray(globalThis.REAL_MVA_PURCHASE_RECORDS) ? globalThis.REAL_MVA_PURCHASE_RECORDS : [];
  return rows.map((item, index) => {
    const stageQtys = STAGES.reduce((values, stage) => {
      values[stage] = clampQty(item[stage]);
      return values;
    }, {});
    const record = {
      id: item.id || `REAL-MVA-${String(index + 1).padStart(4, "0")}`,
      poNo: item.poNo || item.purRequestNo || `REAL-MVA-${String(index + 1).padStart(4, "0")}`,
      project: item.project || "P26",
      projectType: item.projectType || projectTypeFor(item.project || "P26"),
      sourceProject: item.sourceProject || item.yearProject || item.project || "",
      sourceSheet: item.sourceSheet || "Excel Source",
      partNo: item.vendorPartNo || item.purRequestNo || "",
      materialNo: "",
      materialStatus: "Factory Material Tracking",
      factoryMaterialNo: item.factoryMaterialNo || (item.poNo || item.poStatus ? createFactoryMaterialNo(item) : ""),
      pasMaterialNo: item.pasMaterialNo || "",
      materialIdentityKey: "",
      vendorPartNo: item.vendorPartNo || "",
      name: item.name || "Unnamed item",
      level1: item.level1 || "",
      level2: item.level2 || "",
      level3: item.level3 || "",
      spec: item.spec || "",
      detail: item.spec || "",
      process: item.process || "",
      station: item.station || "",
      department: item.department || "",
      requesterName: item.requesterName || "",
      requesterEmployeeId: item.requesterEmployeeId || "",
      email: item.email || "",
      phone: item.phone || "",
      purpose: item.purpose || "",
      requesterReason: item.purpose || "",
      unitPrice: Number(item.unitPrice || 0),
      qty: clampQty(item.qty),
      totalCost: Number(item.totalCost || 0),
      vendor: item.vendor || "",
      quoteDate: item.quoteDate || "",
      quoteExpiry: item.quoteExpiry || "",
      source: "history",
      action: item.action || "",
      budgetStatus: item.budgetStatus || "",
      budgetNo: item.budgetNo || "",
      prStatus: item.prStatus || "",
      prNo: item.prNo || "",
      poStatus: item.poStatus || "",
      buyerPoNo: item.poNo || "",
      qtyDoneBudget: clampQty(item.qtyDoneBudget),
      qtyDonePr: clampQty(item.qtyDonePr),
      qtyDonePo: clampQty(item.qtyDonePo),
      qtyReceived: clampQty(item.qtyReceived || item.qtyRecieved),
      etaPlan: item.etaPlan || item.eta || "",
      dtaActual: item.dtaActual || item.actualEta || "",
      actualEta: item.actualEta || "",
      purRequestNo: item.purRequestNo || "",
      lineOpenDate: item.requiredDeliveryDateDri || "",
      requiredDeliveryDate: item.requiredDeliveryDate || "",
      requestDeadline: item.requestDeadline || "",
      lateStatus: item.lateStatus || "",
      pendingReason: item.pendingReason || item.deliveryPendingReason || item.pendingDeliveryReason || "",
      procurementRemark: item.remark || item.pendingReason || item.lateStatus || "",
      ...stageQtys,
    };
    Object.assign(record, omResponsibilityPatch(record));
    record.globalItemKey = globalItemKey(record);
    record.globalItemId = globalItemIdForKey(record.globalItemKey);
    return record;
  });
}

function omCatalogRecord(item, project = currentProject) {
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

function omCatalogRows(project = currentProject) {
  return OM_CATALOG_ITEMS
    .map((item) => omCatalogRecord(item, project))
    .filter(isOmOwnedItem);
}

function isOmCatalogRow(row) {
  return row?.source === "om-catalog";
}

function rowSourceLabel(row) {
  if (isOmCatalogRow(row)) return "OM Catalog";
  if (row?.source === "history") return "Approved History";
  if (row?.source === "new-item-master") return "User Created Material";
  return row?.source || "Record";
}

function itemDetail(row) {
  return row.detail || row.spec || "";
}

function stripBrandForRequester(value) {
  return String(value || "")
    .replace(/\s*\/\s*Brand\s*:\s*[^,/;]+(?=,|;|$)/gi, "")
    .replace(/\bBrand\s*:\s*[^,/;]+(?=,|;|$)/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[,;]\s*$/g, "")
    .trim();
}

function userVisibleItemDetail(row) {
  const raw = itemDetail(row);
  if (isOmCatalogRow(row) || /responsibility master item/i.test(raw)) {
    return row.name || row.level3 || "Product category";
  }
  return stripBrandForRequester(raw);
}

function standardPartNameFromRow(row) {
  return row.standardNameCn || row.name || "";
}

function standardPartNameMaster() {
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

function standardPartMatchesFor(row, queryText = row.standardNameCn) {
  if (!row.level1 || !row.level2 || !row.level3) return [];
  const query = normalize(queryText);
  return standardPartNameMaster()
    .filter((item) => item.level1 === row.level1 && item.level2 === row.level2 && item.level3 === row.level3)
    .filter((item) => {
      if (!query) return true;
      return normalize([item.cn, item.en, item.vn, ...item.aliases].join(" ")).includes(query);
    });
}

function standardPartOptionsFor(row) {
  return standardPartMatchesFor(row).slice(0, STANDARD_INLINE_LIMIT);
}

function standardPartSearchPrompt(row) {
  if (!row.level1 || !row.level2 || !row.level3) return "Select LV123 first";
  if (!row.standardNameCn) return "Type to search";
  return "No match";
}

function exactStandardPart(row) {
  return standardPartNameMaster().find((item) =>
    item.level1 === row.level1
    && item.level2 === row.level2
    && item.level3 === row.level3
    && item.cn === row.standardNameCn
  ) || null;
}

function maintenanceStatus(row) {
  if (row.materialStatus) return row.materialStatus;
  if (row.standardNameStatus) return row.standardNameStatus;
  if (row.status === "Draft") return "Ready to Create";
  return isMaintenanceComplete(row) ? MATERIAL_STATUS_ACTIVE : "Maintenance Required";
}

function isMaintenanceComplete(row) {
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

function materialIdFor(row) {
  return row.materialId || materialMasterRecordFor(row)?.materialId || (isMaterialNoPending(row) ? "Pending PR / PO" : "-");
}

function materialIdentityKey(row) {
  const lv1 = normalize(row.level1 || "").replace(/\s+/g, " ").trim();
  const lv2 = normalize(row.level2 || "").replace(/\s+/g, " ").trim();
  const lv3 = normalize(row.level3 || "").replace(/\s+/g, " ").trim();
  const name = normalize(standardPartNameFromRow(row)).replace(/\s+/g, " ").trim();
  const detail = normalize(itemDetail(row)).replace(/\s+/g, " ").trim();
  const spec = normalize(row.spec || row.detail || "").replace(/\s+/g, " ").trim();
  if (lv1 || lv2 || lv3 || name || detail || spec) return `material|${lv1}|${lv2}|${lv3}|${name}|${detail}|${spec}`;
  return `material|${normalize(row.id || "unknown")}`;
}

function lvCodeFor(level, row) {
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

function materialCategoryCode(row) {
  return `${lvCodeFor(1, row)}${lvCodeFor(2, row)}${lvCodeFor(3, row)}`;
}

function nextMaterialSequence() {
  return materialSequence++;
}

function createMaterialId(sequence) {
  return `MATID-${String(sequence).padStart(6, "0")}`;
}

function createMaterialNo(row, sequence) {
  return `${MATERIAL_NO_PREFIX}-${materialCategoryCode(row)}-${String(sequence).padStart(6, "0")}`;
}

function factoryMaterialIdentityKey(row) {
  const item = normalize(row.name || row.standardNameCn || row.standardNameEn || "").replace(/\s+/g, " ").trim();
  const spec = normalize(itemDetail(row) || row.spec || row.detail || "").replace(/\s+/g, " ").trim();
  const brand = normalize(row.pasBrand || row.brand || "").replace(/\s+/g, " ").trim();
  const unit = normalize(row.unit || "").replace(/\s+/g, " ").trim();
  if (item || spec || brand || unit) return `factory|${item}|${spec}|${brand}|${unit}`;
  return `factory|${normalize(row.id || row.sourceRecordId || "unknown")}`;
}

function createFactoryMaterialNo(row) {
  return `${FACTORY_MATERIAL_NO_PREFIX}-${stableHash(factoryMaterialIdentityKey(row)).slice(0, 8)}`;
}

function factoryMaterialNoFor(row) {
  return row?.factoryMaterialNo || "";
}

function materialNoFor(row) {
  return row.materialNo || materialMasterRecordFor(row)?.materialNo || "";
}

function makeMaterialMasterRecords(records) {
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

function makeVendorMaterialMappings(records) {
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

function itemKeyDisplay(row) {
  return row?.factoryMaterialNo || row?.poNo || row?.pasMaterialNo || row?.partNo || "-";
}

function materialControlStatus(row) {
  if (row.materialStatus) return row.materialStatus;
  if (row.standardNameStatus) return row.standardNameStatus;
  if (isMaterialNoPending(row)) return MATERIAL_STATUS_PENDING_PROCUREMENT;
  return materialMasterRecordFor(row) ? MATERIAL_STATUS_ACTIVE : "Complete Material Info Required";
}

function identityDisplay(row) {
  return materialNoFor(row) || "Complete Material Info Required";
}

function materialMasterRecordFor(row) {
  const key = materialIdentityKey(row);
  return materialMasterRecords.find((record) =>
    record.materialIdentityKey === key
    || (row.materialId && record.materialId === row.materialId)
    || (row.materialNo && record.materialNo === row.materialNo)
  );
}

function materialDbStatus(row) {
  if (isMaterialNoPending(row)) return MATERIAL_STATUS_PENDING_PROCUREMENT;
  return materialMasterRecordFor(row) ? MATERIAL_STATUS_ACTIVE : "Complete Material Info Required";
}

function hasSourcingQuoteSuccess(row) {
  return rfqStatus(row) === "Quote Received"
    && Boolean(row.vendor || row.vendorPartNo || row.updatedPrice || row.rfqQuoteResult || row.quotationPdf);
}

function ensureMaterialMasterFromQuote(row) {
  return ensureMaterialMaster(row, { createdBy: "Sourcing", source: "Sourcing quote success" });
}

function ensureMaterialMaster(row, options = {}) {
  const key = materialIdentityKey(row);
  const existing = materialMasterRecords.find((record) => record.materialIdentityKey === key);
  const sequence = existing?.sequence || nextMaterialSequence();
  const materialId = existing?.materialId || createMaterialId(sequence);
  const materialNo = existing?.materialNo || createMaterialNo(row, sequence);
  if (!existing) {
    materialMasterRecords = [{
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
    }, ...materialMasterRecords];
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
      vendorMaterialMappings = vendorMaterialMappings.map((item, index) => index === mappingIndex ? mapping : item);
    } else {
      vendorMaterialMappings = [mapping, ...vendorMaterialMappings];
    }
  }
  return { materialId, materialNo, materialIdentityKey: key, materialStatus: existing?.materialStatus || MATERIAL_STATUS_ACTIVE };
}

function globalItemKey(row) {
  const key = materialIdentityKey(row);
  if (key.replace(/\|/g, "")) return `ITEM|${key}`;
  return row.globalItemKey || row.globalItemId || `UNKNOWN|${normalize(row.id || row.sourceRecordId || "unknown")}`;
}

function partName(row) {
  const detail = itemDetail(row) || row.name || "Detail";
  return `${standardPartNameFromRow(row) || "Item"}_${detail}`;
}

function globalItemIdForKey(key) {
  return `GI-${stableHash(key)}`;
}

function globalItemIdFor(row) {
  return globalItemIdForKey(globalItemKey(row));
}

function demandKey(row, stage = currentStageForProject(row.project)) {
  return `${row.project}__${globalItemKey(row)}__${stage}`;
}

function makeDemandBaselines(records) {
  const baseRows = records.flatMap((record) => {
    const index = recordIndex(record);
    return STAGES.map((stage, stageIndex) => {
      if ((index + stageIndex) % 13 === 0) return null;
      const baseQty = clampQty(record[stage]);
      return {
        id: `DB-${record.project}-${record.partNo}-${stage}`,
        project: record.project,
        stage,
        sourceRecordId: record.id,
        partNo: record.partNo,
        materialNo: materialNoFor(record),
        materialIdentityKey: materialIdentityKey(record),
        globalItemKey: globalItemKey(record),
        globalItemId: globalItemIdFor(record),
        name: record.name,
        spec: record.spec,
        vendor: record.vendor,
        unitPrice: record.unitPrice,
        baselineQty: baseQty + ((index + stageIndex) % 3),
        sourceFile: "Google Worksheet import simulation",
        updatedBy: "System import",
        updatedAt: new Date(2026, 4, 8, 8 + (index % 8), stageIndex * 5).toISOString(),
      };
    }).filter(Boolean);
  });
  const mirroredRows = records.slice(0, 10).map((record, index) => {
    const targetProject = PROJECTS.find((project) => project !== record.project) || record.project;
    const stage = currentStageForProject(targetProject);
    return {
      id: `DB-${targetProject}-${globalItemIdFor(record)}-${stage}`,
      project: targetProject,
      stage,
      sourceRecordId: record.id,
      partNo: record.partNo,
      materialNo: materialNoFor(record),
      materialIdentityKey: materialIdentityKey(record),
      globalItemKey: globalItemKey(record),
      globalItemId: globalItemIdFor(record),
      name: record.name,
      spec: record.spec,
      vendor: record.vendor,
      unitPrice: record.unitPrice,
      baselineQty: Math.max(1, clampQty(record[stage]) + (index % 3)),
      sourceFile: "Cross-project demand simulation",
      updatedBy: "System import",
      updatedAt: new Date(2026, 4, 8, 16, index * 4).toISOString(),
    };
  });
  return [...baseRows, ...mirroredRows];
}

function makeActualBuyRecords(records) {
  return records.flatMap((record) => {
    const index = recordIndex(record);
    const currentStage = currentStageForProject(record.project);
    const stageIndex = DEMAND_STAGE_ORDER.indexOf(currentStage);
    const sourceStages = DEMAND_STAGE_ORDER.slice(0, Math.max(1, stageIndex + 1));
    if (index !== 1 && index % 9 === 0) return [];
    return sourceStages.map((stage, sourceIndex) => {
      const baseline = records === purchaseRecords ? baselineFor(record, currentStage) : null;
      const baseQty = stage === currentStage ? clampQty(record[currentStage]) : Math.max(0, clampQty(record[currentStage]) - sourceIndex);
      const actualQty = index === 1
        ? (sourceIndex === 0 ? 14 : 0)
        : (index % 7 === 0 ? baseQty + 3 : Math.max(0, baseQty - (index % 4 === 0 ? 2 : 0)));
      return {
        id: `AB-${record.project}-${record.partNo}-${stage}`,
        project: record.project,
        stage,
        requestId: "",
        sourceRecordId: record.id,
        partNo: record.partNo,
        materialNo: materialNoFor(record),
        materialIdentityKey: materialIdentityKey(record),
        globalItemKey: globalItemKey(record),
        globalItemId: globalItemIdFor(record),
        name: record.name,
        poNo: `ACT-${record.poNo}`,
        approvedQty: baseline?.baselineQty ?? clampQty(record[currentStage]),
        actualQty,
        buyDate: `2026-0${Math.min(5, sourceIndex + 1)}-${String((index % 24) + 1).padStart(2, "0")}`,
        vendor: record.vendor,
        unitPrice: record.unitPrice,
        externalRef: `ERP-${record.project}-${String(10000 + index)}`,
        updateSource: "Simulated external system",
        status: "Completed",
      };
    });
  });
}

function isOmRole(role = currentRole) {
  return globalThis.ProcurementApp?.roleGuards?.isOmRole(role)
    ?? ["om", "omLeader", "omMember", "admin"].includes(role);
}

function isOmLeaderRole(role = currentRole) {
  return globalThis.ProcurementApp?.roleGuards?.isOmLeaderRole(role)
    ?? ["omLeader", "admin"].includes(role);
}

function apiModeEnabled() {
  return window.location.protocol !== "file:";
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || `API error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function uploadAttachment(file, fields = {}) {
  if (!file || !apiModeEnabled()) return null;
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  const response = await fetch("/api/attachments", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || `Attachment upload failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload.attachment || null;
}

function attachmentDownloadUrl(attachmentId, explicitUrl = "") {
  return explicitUrl || (attachmentId ? `/api/attachments/${encodeURIComponent(attachmentId)}` : "");
}

function attachmentLinkHtml(fileName, attachmentId, explicitUrl = "", { allowDownload = true } = {}) {
  if (!fileName) return "";
  const url = attachmentDownloadUrl(attachmentId, explicitUrl);
  if (!allowDownload || !url || !apiModeEnabled()) return htmlText(fileName);
  return `<a href="${htmlAttr(url)}" target="_blank" rel="noopener">${htmlText(fileName)}</a>`;
}

function sessionUserFromRole(role = currentRole) {
  if (currentSessionUser) return currentSessionUser;
  const fallbackByRole = {
    omLeader: omAssignees.find((user) => user.role === "omLeader"),
    omMember: omAssignees.find((user) => user.role === "omMember"),
    om: omAssignees.find((user) => user.role === "omLeader"),
  };
  const fallback = fallbackByRole[role] || { id: role, role, ...(roleProfiles[role] || roleProfiles.requester) };
  return {
    id: fallback.id || role,
    name: fallback.name || roleProfiles[role]?.name || "User",
    email: fallback.email || "",
    department: fallback.department || fallback.dept || roleProfiles[role]?.dept || "",
    role: fallback.role || role,
  };
}

function setSessionUser(user) {
  currentSessionUser = user || null;
  if (!user) return;
  if (user.role === "requester") {
    const persona = findRequesterPersonaByIdentifier(user.employeeId || user.employee_id || user.email || user.id);
    if (persona) applyRequesterPersonaContext(persona);
  }
  roleProfiles[user.role] = {
    ...(roleProfiles[user.role] || roleProfiles.requester),
    name: user.name || roleProfiles[user.role]?.name,
    dept: user.department || roleProfiles[user.role]?.dept,
    functionName: roleProfiles[user.role]?.functionName || user.role,
  };
}

function applyAssignmentsToRequests(assignments = []) {
  omAssignmentMap = new Map(assignments.map((assignment) => [assignment.requestId, assignment]));
  requests = requests.map((row) => {
    const assignment = omAssignmentMap.get(row.id);
    if (!assignment) {
      return {
        ...row,
        omAssigneeId: row.omAssigneeId || "",
        omAssigneeName: row.omAssigneeName || "",
        omAssignedBy: row.omAssignedBy || "",
        omAssignedAt: row.omAssignedAt || "",
      };
    }
    return {
      ...row,
      omAssigneeId: assignment.assignedToUserId || "",
      omAssigneeName: assignment.assignedToName || "",
      omAssignedBy: assignment.assignedByName || "",
      omAssignedAt: assignment.assignedAt || "",
    };
  });
}

async function hydrateOmAssignmentState() {
  if (!apiModeEnabled() || !isOmRole()) return;
  try {
    const [assigneePayload, assignmentPayload] = await Promise.all([
      apiRequest("/api/om/assignees"),
      apiRequest("/api/om/assignments"),
    ]);
    if (Array.isArray(assigneePayload.assignees)) omAssignees = assigneePayload.assignees;
    applyAssignmentsToRequests(assignmentPayload.assignments || []);
  } catch (error) {
    showToast(`OM assignment API unavailable: ${error.message}`, "error");
  }
}

function normalizeUatFeedbackRow(row = {}) {
  return {
    id: row.id || `local-feedback-${Date.now()}`,
    submittedByUserId: row.submittedByUserId || row.submitted_by_user_id || "",
    submittedByName: row.submittedByName || row.submitted_by_name || row.submittedByUserName || "",
    pageKey: row.pageKey || row.page_key || "",
    rowScopeType: row.rowScopeType || row.row_scope_type || "",
    rowScopeId: row.rowScopeId || row.row_scope_id || "",
    rowScopeLabel: row.rowScopeLabel || row.row_scope_label || "",
    category: row.category || "general",
    severity: row.severity || "medium",
    feedbackText: row.feedbackText || row.feedback_text || "",
    status: row.status || "open",
    ownerUserId: row.ownerUserId || row.owner_user_id || "",
    ownerName: row.ownerName || row.owner_name || "",
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: row.updatedAt || row.updated_at || row.createdAt || row.created_at || new Date().toISOString(),
  };
}

function currentFeedbackUser() {
  return sessionUserFromRole(currentRole);
}

function isUatFeedbackReviewer(role = currentRole) {
  return isOmLeaderRole(role);
}

function feedbackPayloadRows(payload = {}) {
  return (payload.feedback || payload.feedbackRows || []).map(normalizeUatFeedbackRow);
}

async function fetchUatFeedbackRows({ review = false, silent = false } = {}) {
  try {
    if (apiModeEnabled()) {
      const payload = await apiRequest(review ? "/api/uat-feedback" : "/api/uat-feedback/my");
      uatFeedbackRows = feedbackPayloadRows(payload);
    } else {
      const user = currentFeedbackUser();
      uatFeedbackRows = localUatFeedbackRows
        .filter((row) => review || row.submittedByUserId === user.id)
        .map(normalizeUatFeedbackRow)
        .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    }
  } catch (error) {
    if (!silent) showToast(`UAT feedback unavailable: ${error.message}`, "error");
  }
  return uatFeedbackRows;
}

async function createUatFeedback(payload) {
  if (apiModeEnabled()) {
    const response = await apiRequest("/api/uat-feedback", { method: "POST", body: payload });
    return normalizeUatFeedbackRow(response.feedback || response);
  }
  const user = currentFeedbackUser();
  const feedback = normalizeUatFeedbackRow({
    id: `UAT-FB-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    submittedByUserId: user.id,
    submittedByName: user.name,
    ...payload,
    status: "open",
  });
  localUatFeedbackRows = [feedback, ...localUatFeedbackRows];
  uatFeedbackRows = [feedback, ...uatFeedbackRows];
  return feedback;
}

async function patchUatFeedbackStatus(feedbackId, status) {
  if (apiModeEnabled()) {
    const response = await apiRequest(`/api/uat-feedback/${encodeURIComponent(feedbackId)}/status`, { method: "PATCH", body: { status } });
    return normalizeUatFeedbackRow(response.feedback || response);
  }
  const updatedAt = new Date().toISOString();
  localUatFeedbackRows = localUatFeedbackRows.map((row) => row.id === feedbackId ? { ...row, status, updatedAt } : row);
  uatFeedbackRows = uatFeedbackRows.map((row) => row.id === feedbackId ? { ...row, status, updatedAt } : row);
  return uatFeedbackRows.find((row) => row.id === feedbackId);
}

async function patchUatFeedbackOwner(feedbackId, ownerUserId) {
  const owner = uatFeedbackTriageOwners().find((user) => user.id === ownerUserId);
  if (ownerUserId && !owner) {
    throw new Error("Feedback owner must be Admin or OM Leader.");
  }
  if (apiModeEnabled()) {
    const response = await apiRequest(`/api/uat-feedback/${encodeURIComponent(feedbackId)}/owner`, { method: "PATCH", body: { ownerUserId } });
    return normalizeUatFeedbackRow(response.feedback || response);
  }
  const updatedAt = new Date().toISOString();
  localUatFeedbackRows = localUatFeedbackRows.map((row) => row.id === feedbackId ? { ...row, ownerUserId, ownerName: owner?.name || "", updatedAt } : row);
  uatFeedbackRows = uatFeedbackRows.map((row) => row.id === feedbackId ? { ...row, ownerUserId, ownerName: owner?.name || "", updatedAt } : row);
  return uatFeedbackRows.find((row) => row.id === feedbackId);
}

function uatFeedbackTriageOwners() {
  const owners = [
    ...adminApprovalSetup.users.filter((user) => ["admin", "omLeader"].includes(user.role)),
    ...omAssignees.filter((user) => user.role === "omLeader"),
  ];
  return Array.from(new Map(owners.map((user) => [user.id, user])).values());
}

function omTabLabel(tab = currentOmTab) {
  const labels = {
    submission: "Submission Dashboard",
    pasRequest: "PAS Demand No",
    quoteConfirm: "PAS Quote Result",
    quoteExpiry: "Quote Expiry",
    finalExport: "Export Package",
  };
  return labels[tab] || tab || "OM";
}

function activeOmFilterMetadata() {
  return {
    omTab: currentOmTab,
    omTabLabel: omTabLabel(),
    projectFilter: document.getElementById("omSubmissionProjectFilter")?.value
      || document.getElementById("omProjectFilter")?.value
      || document.getElementById("omFinalExportProjectFilter")?.value
      || "",
    packageFilter: document.getElementById("omFinalExportProjectFilter")?.value || "",
    role: currentRole,
    roleName: roleProfiles[currentRole]?.name || currentRole,
    currency: currencyDisplay,
    capturedAt: new Date().toISOString(),
  };
}

function feedbackReviewRows() {
  return isUatFeedbackReviewer() ? uatFeedbackRows : uatFeedbackRows.filter((row) => row.submittedByUserId === currentFeedbackUser().id);
}

function feedbackRowsForRequest(requestId) {
  return uatFeedbackRows.filter((row) => row.rowScopeId === requestId);
}

function uatFeedbackEvidenceHtml(row) {
  const screenshotName = row.metadata?.screenshotFileName || "";
  const screenshotLink = attachmentLinkHtml(
    screenshotName,
    row.metadata?.screenshotAttachmentId,
    row.metadata?.screenshotDownloadUrl,
    { allowDownload: true },
  );
  return screenshotLink || htmlText(row.metadata?.evidence || "No screenshot metadata");
}

function openUatFeedbackModal(context = {}) {
  activeUatFeedbackContext = {
    scope: context.scope || "page",
    pageKey: context.pageKey || `om-${currentOmTab}`,
    rowScopeType: context.rowScopeType || (context.requestId ? "request" : "page"),
    rowScopeId: context.rowScopeId || context.requestId || currentOmTab,
    rowScopeLabel: context.rowScopeLabel || (context.requestId ? `Request ${context.requestId}` : `OM / ${omTabLabel()}`),
    metadata: {
      ...activeOmFilterMetadata(),
      ...(context.metadata || {}),
    },
  };
  const modal = document.getElementById("uatFeedbackModal");
  const subtitle = document.getElementById("uatFeedbackSubtitle");
  const meta = document.getElementById("uatFeedbackMetadata");
  const text = document.getElementById("uatFeedbackText");
  const evidence = document.getElementById("uatFeedbackEvidence");
  const screenshot = document.getElementById("uatFeedbackScreenshot");
  if (subtitle) subtitle.textContent = `${activeUatFeedbackContext.scope === "row" ? "Row" : "Page"} feedback · ${activeUatFeedbackContext.rowScopeLabel}`;
  if (meta) {
    meta.innerHTML = `
      <span>Role: ${htmlText(activeUatFeedbackContext.metadata.roleName)}</span>
      <span>OM Tab: ${htmlText(activeUatFeedbackContext.metadata.omTabLabel)}</span>
      <span>Scope: ${htmlText(activeUatFeedbackContext.rowScopeLabel)}</span>
      <span>Timestamp: ${compactDateTime(activeUatFeedbackContext.metadata.capturedAt)}</span>`;
  }
  if (text) text.value = "";
  if (evidence) evidence.value = "";
  if (screenshot) screenshot.value = "";
  if (modal) modal.hidden = false;
}

function closeUatFeedbackModal() {
  const modal = document.getElementById("uatFeedbackModal");
  if (modal) modal.hidden = true;
  activeUatFeedbackContext = null;
}

async function submitUatFeedback(event) {
  event.preventDefault();
  if (!activeUatFeedbackContext) return;
  const feedbackText = document.getElementById("uatFeedbackText")?.value.trim() || "";
  if (!feedbackText) {
    showToast("Write feedback before submit.", "error");
    return;
  }
  const evidence = document.getElementById("uatFeedbackEvidence")?.value.trim() || "";
  const screenshotFile = document.getElementById("uatFeedbackScreenshot")?.files?.[0] || null;
  const screenshotMetadata = screenshotFile ? {
    screenshotFileName: screenshotFile.name,
    screenshotFileType: screenshotFile.type || "image/*",
    screenshotFileSize: screenshotFile.size || 0,
    screenshotCapturedAt: new Date().toISOString(),
  } : {};
  const payload = {
    pageKey: activeUatFeedbackContext.pageKey,
    rowScopeType: activeUatFeedbackContext.rowScopeType,
    rowScopeId: activeUatFeedbackContext.rowScopeId,
    rowScopeLabel: activeUatFeedbackContext.rowScopeLabel,
    category: document.getElementById("uatFeedbackCategory")?.value || "general",
    severity: document.getElementById("uatFeedbackSeverity")?.value || "medium",
    feedbackText,
    metadata: {
      ...activeUatFeedbackContext.metadata,
      evidence,
      ...screenshotMetadata,
    },
  };
  try {
    if (screenshotFile && apiModeEnabled()) {
      const attachment = await uploadAttachment(screenshotFile, {
        linkedEntityType: "uat_feedback",
        linkedEntityId: activeUatFeedbackContext.rowScopeId || activeUatFeedbackContext.pageKey,
        attachmentKind: "uat_screenshot",
        visibilityScope: "uat_feedback",
        metadata: {
          pageKey: payload.pageKey,
          rowScopeType: payload.rowScopeType,
          rowScopeId: payload.rowScopeId,
          category: payload.category,
          severity: payload.severity,
        },
      });
      payload.metadata = {
        ...payload.metadata,
        screenshotAttachmentId: attachment?.id || "",
        screenshotDownloadUrl: attachment?.downloadUrl || "",
        screenshotStoredAt: attachment?.createdAt || new Date().toISOString(),
      };
    }
    const feedback = await createUatFeedback(payload);
    closeUatFeedbackModal();
    await fetchUatFeedbackRows({ review: isUatFeedbackReviewer(), silent: true });
    renderUatFeedbackReview();
    renderOmFeedbackUtility();
    showToast(`Feedback submitted: ${feedback.id.slice(0, 8)}`, "success");
  } catch (error) {
    showToast(`Feedback submit failed: ${error.message}`, "error");
  }
}

function renderOmFeedbackUtility() {
  const scope = document.getElementById("omFeedbackScope");
  if (!scope) return;
  const openCount = uatFeedbackRows.filter((row) => row.status !== "resolved" && row.status !== "dismissed").length;
  const ownerText = isUatFeedbackReviewer() ? "Review all UAT feedback" : "Submit feedback and track your own status";
  scope.textContent = `${omTabLabel()} · ${ownerText}${openCount ? ` · ${openCount} open` : ""}`;
}

function renderUatFeedbackSummary(rows = feedbackReviewRows()) {
  const target = document.getElementById("uatFeedbackSummary");
  if (!target) return;
  const cards = [
    ["Open", rows.filter((row) => row.status === "open").length],
    ["In Review", rows.filter((row) => row.status === "in_review").length],
    ["Resolved", rows.filter((row) => row.status === "resolved").length],
    ["High / Critical", rows.filter((row) => ["high", "critical"].includes(row.severity)).length],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}

function renderAdminConsole() {
  const summary = document.getElementById("adminConsoleSummary");
  const body = document.getElementById("adminConsoleFeedbackRows");
  if (!summary && !body) return;
  const rows = [...uatFeedbackRows].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  if (summary) {
    const cards = [
      ["Total Feedback", rows.length],
      ["Open", rows.filter((row) => row.status === "open").length],
      ["In Review", rows.filter((row) => row.status === "in_review").length],
      ["With Screenshot", rows.filter((row) => row.metadata?.screenshotAttachmentId || row.metadata?.screenshotDownloadUrl).length],
    ];
    summary.innerHTML = cards.map(([label, value]) => `
      <article class="summary-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </article>`).join("");
  }
  if (!body) return;
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td>${compactDateTime(row.createdAt)}<div class="reason-text">${htmlText(row.id.slice(0, 8))}</div></td>
      <td><strong>${htmlText(row.submittedByName || row.submittedByUserId)}</strong><div class="reason-text">${htmlText(row.submittedByUserId)}</div></td>
      <td>${htmlText(row.pageKey)}<div class="reason-text">${htmlText(row.rowScopeLabel || row.rowScopeId || row.rowScopeType || "Page")}</div></td>
      <td class="admin-console-feedback-cell"><div class="admin-feedback-full">${htmlText(row.feedbackText)}</div><div class="reason-text">${htmlText(row.category)} · ${htmlText(row.severity)}</div></td>
      <td>${uatFeedbackEvidenceHtml(row)}</td>
      <td><span class="status-pill ${statusClass(row.status)}">${htmlText(row.status.replace("_", " "))}</span></td>
      <td>${htmlText(row.ownerName || "Unassigned")}</td>
    </tr>`).join("") : `<tr><td colspan="7" class="empty-cell">No UAT feedback yet. Ask OM Leader or OM Purchasing to submit feedback from the OM page.</td></tr>`;
}

function uatFeedbackOwnerOptions(selected = "") {
  const options = [`<option value="">Unassigned</option>`];
  uatFeedbackTriageOwners().forEach((user) => {
    const label = user.role === "admin" ? "Admin" : "OM Leader";
    options.push(`<option value="${htmlAttr(user.id)}" ${user.id === selected ? "selected" : ""}>${htmlText(user.name)} · ${label}</option>`);
  });
  return options.join("");
}

function renderUatFeedbackReview() {
  if (currentView !== "uatFeedbackReview" && !document.getElementById("uatFeedbackRows")) return;
  const reviewer = isUatFeedbackReviewer();
  const rows = feedbackReviewRows();
  const title = document.getElementById("uatFeedbackReviewTitle");
  const helper = document.getElementById("uatFeedbackReviewHelper");
  if (title) title.textContent = reviewer ? "UAT Feedback Review" : "My UAT Feedback Status";
  if (helper) {
    helper.textContent = reviewer
      ? "Admin and OM Leader triage page and row feedback from OM internal testing. This is a utility page, not an OM workflow tab."
      : "Track feedback you submitted during OM internal testing. Mai/Admin triage owner and status updates are read-only here.";
  }
  renderUatFeedbackSummary(rows);
  const target = document.getElementById("uatFeedbackRows");
  if (!target) return;
  target.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td><strong>${htmlText(row.id.slice(0, 8))}</strong><div class="reason-text">${htmlText(row.category)} · ${htmlText(row.severity)}</div></td>
      <td>${htmlText(row.pageKey)}<div class="reason-text">${htmlText(row.rowScopeLabel || row.rowScopeId || row.rowScopeType || "Page")}</div></td>
      <td>${htmlText(row.submittedByName || row.submittedByUserId)}<div class="reason-text">${htmlText(row.submittedByUserId)}</div></td>
      <td>
        <div class="cell-note-summary" title="${htmlAttr(row.feedbackText)}">${htmlText(row.feedbackText)}</div>
        <div class="reason-text">${uatFeedbackEvidenceHtml(row)}</div>
      </td>
      <td>
        ${reviewer
          ? `<select data-uat-feedback-status="${htmlAttr(row.id)}">
              ${["open", "in_review", "resolved", "dismissed"].map((status) => `<option value="${status}" ${row.status === status ? "selected" : ""}>${status.replace("_", " ")}</option>`).join("")}
            </select>`
          : `<span class="status-pill ${statusClass(row.status)}">${htmlText(row.status.replace("_", " "))}</span>`}
      </td>
      <td>${reviewer
        ? `<select data-uat-feedback-owner="${htmlAttr(row.id)}">${uatFeedbackOwnerOptions(row.ownerUserId)}</select>`
        : `<strong>${htmlText(row.ownerName || "Unassigned")}</strong>`}</td>
      <td>${compactDateTime(row.createdAt)}<div class="reason-text">Updated ${compactDateTime(row.updatedAt)}</div></td>
      <td>${reviewer ? `<button class="mini approve" type="button" data-uat-feedback-save="${htmlAttr(row.id)}">Save</button>` : `<span class="status-pill info">Read Only</span>`}</td>
    </tr>`).join("") : `<tr><td colspan="8" class="empty-cell">No UAT feedback yet.</td></tr>`;
  renderAdminConsole();
}

async function refreshUatFeedback({ review = isUatFeedbackReviewer(), silent = false } = {}) {
  await fetchUatFeedbackRows({ review, silent });
  renderUatFeedbackReview();
  renderAdminConsole();
  renderOmFeedbackUtility();
}

async function refreshAdminConsole() {
  if (currentRole !== "admin") {
    showToast("Admin console is available to Admin only.", "error");
    return;
  }
  await refreshUatFeedback({ review: true, silent: false });
  showToast("Admin console refreshed.", "success");
}

async function saveUatFeedbackReview(feedbackId) {
  if (!isUatFeedbackReviewer()) {
    showToast("Only OM Leader or Admin can triage feedback.", "error");
    return;
  }
  const status = document.querySelector(`[data-uat-feedback-status="${CSS.escape(feedbackId)}"]`)?.value || "open";
  const ownerUserId = document.querySelector(`[data-uat-feedback-owner="${CSS.escape(feedbackId)}"]`)?.value || "";
  try {
    await patchUatFeedbackStatus(feedbackId, status);
    await patchUatFeedbackOwner(feedbackId, ownerUserId);
    await refreshUatFeedback({ review: true, silent: true });
    showToast("Feedback triage updated.", "success");
  } catch (error) {
    showToast(`Feedback update failed: ${error.message}`, "error");
  }
}

function testLoginAccountForRole(role) {
  return testLoginRoleAccounts[role] || "";
}

function syncLoginAccountForRole(role) {
  const account = testLoginAccountForRole(role);
  const accountInput = document.getElementById("loginAccountInput") || document.getElementById("loginEmailInput") || document.querySelector('#loginForm input[type="text"]') || document.querySelector('#loginForm input[type="email"]');
  const passwordInput = document.querySelector('#loginForm input[type="password"]');
  if (accountInput && account) accountInput.value = account;
  if (passwordInput && !passwordInput.value) passwordInput.value = "123";
  return account || accountInput?.value || "";
}

async function loginWithApi(identifier, password, role = "") {
  const payload = await apiRequest("/api/login", {
    method: "POST",
    body: { identifier, account: identifier, email: identifier, role, loginRole: role, password },
  });
  setSessionUser(payload.user);
  apiSessionReady = true;
  await hydrateOmAssignmentState();
  await refreshUatFeedback({ review: ["omLeader", "admin"].includes(payload.user?.role), silent: true });
  return payload.user;
}

async function logoutWithApi() {
  if (!apiModeEnabled()) return;
  try {
    await apiRequest("/api/logout", { method: "POST" });
  } catch {
    // Logout should still return the UI to the login screen if the server session already expired.
  }
  currentSessionUser = null;
  apiSessionReady = false;
}

async function restoreApiSession() {
  if (!apiModeEnabled()) return;
  const roleSelect = document.getElementById("roleSelect");
  if (roleSelect) {
    roleSelect.disabled = false;
    roleSelect.title = "Testing shortcut: choose a role, then Sign in to switch the server session.";
  }
  try {
    const payload = await apiRequest("/api/me");
    setSessionUser(payload.user);
    apiSessionReady = true;
    await hydrateOmAssignmentState();
    await refreshUatFeedback({ review: ["omLeader", "admin"].includes(payload.user?.role), silent: true });
    setScreen("workspace");
    if (roleSelect && payload.user?.role) roleSelect.value = payload.user.role;
    applyRole(payload.user.role);
  } catch {
    setScreen("login");
  }
}

function activeExchangeRateMonth() {
  const now = new Date();
  if (Number.isNaN(now.getTime())) return DEFAULT_EXCHANGE_RATE_MONTH;
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function exchangeRateRecord(month = activeExchangeRateMonth()) {
  return monthlyExchangeRates.find((row) => row.exchangeRateMonth === month)
    || monthlyExchangeRates.find((row) => row.exchangeRateMonth === DEFAULT_EXCHANGE_RATE_MONTH)
    || { exchangeRateMonth: month, usdToVndRate: OM_EXCHANGE_RATE_VND_USD, isFallback: true };
}

function currentUsdToVndRate() {
  return Number(exchangeRateRecord().usdToVndRate || OM_EXCHANGE_RATE_VND_USD);
}

function monthKeyFromDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function budgetApprovedExchangeRateMonth(row = {}) {
  return monthKeyFromDate(row.projectDriApprovedAt || row.budgetApproverApprovedAt || row.budgetApprovedAt)
    || monthKeyFromDate(row.driApprovedAt || row.deptDriApprovedAt || row.deptDriSubmissionApprovedAt)
    || activeExchangeRateMonth();
}

function usdToVndRateForRow(row = {}) {
  return Number(exchangeRateRecord(budgetApprovedExchangeRateMonth(row)).usdToVndRate || OM_EXCHANGE_RATE_VND_USD);
}

function sharedFormatters() {
  return globalThis.ProcurementApp?.sharedFormatters;
}

function demandCostDashboardModule() {
  return globalThis.ProcurementApp?.modules?.demandCostDashboard;
}

function leadTimeModule() {
  return globalThis.ProcurementApp?.modules?.leadTime || {};
}

function workflowStatusModule() {
  return globalThis.ProcurementApp?.modules?.workflowStatus || {};
}

function workflowStatusForRow(row, role = "requester") {
  return workflowStatusModule().buildWorkflowStatus?.(row, { role, today: new Date() }) || {
    pendingOwner: "OM Purchasing",
    currentStage: "Progress Review",
    submittedAt: "",
    receivedAt: "",
    stageStartAt: "",
    daysPending: null,
    quoteStatus: "-",
    nextAction: "Review blocker",
    riskReason: "",
    timelineMilestones: [],
    statusLabels: [],
    visibilityFlags: {},
  };
}

function workflowStatusForGroup(group, role = "costOwner") {
  return workflowStatusModule().buildWorkflowGroupStatus?.(group, { role, today: new Date() }) || workflowStatusForRow((group.rows || [])[0] || {}, role);
}

function formatUsd(value) {
  return sharedFormatters()?.formatUsd(value)
    || `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatCurrencyFromVnd(value) {
  return sharedFormatters()?.formatCurrencyFromVnd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}

function amountUsdFromVnd(vnd) {
  return sharedFormatters()?.amountUsdFromVnd(vnd, currentUsdToVndRate())
    || Number(vnd || 0) / currentUsdToVndRate();
}

function amountVndFromUsd(usd) {
  return sharedFormatters()?.amountVndFromUsd(usd, currentUsdToVndRate())
    || Number(usd || 0) * currentUsdToVndRate();
}

function formatMoneyFromUsd(value) {
  return sharedFormatters()?.formatMoneyFromUsd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}

function formatMoneyFromVnd(value) {
  return sharedFormatters()?.formatMoneyFromVnd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}

function formatCompactCurrencyFromVnd(value) {
  return sharedFormatters()?.formatCompactCurrencyFromVnd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}

function formatCompactCurrencyFromUsd(value) {
  return sharedFormatters()?.formatCompactCurrencyFromUsd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}

function legacyPriceToUsd(row, field) {
  return sharedFormatters()?.legacyPriceToUsd(row, field, { usdToVndRate: currentUsdToVndRate() }) || 0;
}

function legacyPriceToUsdForRow(row, field) {
  return sharedFormatters()?.legacyPriceToUsd(row, field, { usdToVndRate: usdToVndRateForRow(row) }) || 0;
}

function money(value) {
  const usdValue = Number(value || 0);
  if (currencyDisplay === "USD") return formatUsd(usdValue);
  return `${Math.round(usdValue * currentUsdToVndRate()).toLocaleString("en-US")} VND`;
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function statusClass(status) {
  return normalize(status).replace(/[^a-z0-9]+/g, "-") || "draft";
}

function daysUntil(dateText) {
  if (!dateText) return null;
  const target = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function baseQuoteStatus(record) {
  const hasQuoteData = Boolean(record.quoteExpiry) && Number(record.updatedPrice || record.unitPrice || 0) > 0;
  if ((isNewMaterial(record) || record.quoteStatus === "New item" || record.quoteStatus === "New Material") && !hasQuoteData) return "New Material";
  if (record.quoteStatus && !["Valid", "Expired", "Expiring Soon", "Update Required", "New item", "New Material"].includes(record.quoteStatus)) return record.quoteStatus;
  const days = daysUntil(record.quoteExpiry);
  if (days === null) return "Expired";
  if (days < 0) return "Expired";
  if (days <= QUOTE_EXPIRING_SOON_DAYS) return "Expiring Soon";
  return "Valid";
}

function quoteStatus(record) {
  if (record.quoteException) return "Update Required";
  return baseQuoteStatus(record);
}

function hasOmQuoteData(row) {
  return Boolean(row.vendor && effectiveUnitPrice(row) && row.quoteDate && omQuoteValidUntil(row) && omQuoteScreenshotFile(row) && row.quotationExcel);
}

function omQuoteReceivedAt(row) {
  return row.quoteReceivedAt || row.quoteDate || "";
}

function omQuoteValidUntil(row) {
  return row.quoteValidUntil || row.quoteExpiry || "";
}

function omQuoteValidity(row) {
  if (!hasOmQuoteData(row)) return "Quote Pending";
  if (row.quoteException) return "Update Required";
  const days = daysUntil(omQuoteValidUntil(row));
  if (days === null) return "Quote Pending";
  if (days < 0) return "Quote Expired";
  if (days <= QUOTE_EXPIRING_SOON_DAYS) return "Quote Expiring Soon";
  return "Quote Valid";
}

function clampQty(value) {
  return Math.max(0, Number(value) || 0);
}

function totalQty(row) {
  if (Array.isArray(row?.stationBreakdown)) return stationBreakdownTotal(row);
  return STAGES.reduce((sum, key) => sum + clampQty(row[key]), 0);
}

function stageQtyText(row) {
  return STAGES.map((stage) => `${STAGE_LABELS[stage]} ${requestStageQty(row, stage)}`).join(" / ");
}

function requestStageQty(row, stage) {
  if (Array.isArray(row?.stationBreakdown)) return stationBreakdownPhaseTotal(row, stage);
  return clampQty(row?.[stage]);
}

function stationOptionFor(value) {
  const normalized = normalize(value);
  return STATION_MASTER.find((station) => normalized.includes(normalize(station))) || STATION_MASTER[0];
}

function requestCarryoverProject() {
  return lastRequestProject || currentProject;
}

function requestCarryoverPhase(project = requestCarryoverProject()) {
  return STAGES.includes(lastRequestPhase) ? lastRequestPhase : nextBuyStageForProject(project) || currentStageForProject(project);
}

function updateRequestCarryover({ project, phase, demandType } = {}) {
  if (project) lastRequestProject = project;
  else lastRequestProject = currentProject;
  if (STAGES.includes(phase)) lastRequestPhase = phase;
  else if (!STAGES.includes(lastRequestPhase)) lastRequestPhase = nextBuyStageForProject(lastRequestProject) || currentStageForProject(lastRequestProject);
  if (demandType) lastDemandType = demandTypeFor({ demandType });
}

function syncItemPickerDemandContext(overrides = {}) {
  const targetProject = overrides.project || requestCarryoverProject();
  const nextPhase = STAGES.includes(overrides.phase) ? overrides.phase : (STAGES.includes(itemPickerStage) ? itemPickerStage : requestCarryoverPhase(targetProject));
  const nextType = demandTypeFor({ demandType: overrides.demandType || itemPickerDemandType || lastDemandType });
  const nextLine = /^Line\s+[1-4]$/.test(String(overrides.requestLine || itemPickerRequestLine || "")) ? (overrides.requestLine || itemPickerRequestLine) : "Line 1";
  itemPickerStage = nextPhase;
  itemPickerDemandType = nextType;
  itemPickerRequestLine = nextLine;
  if (nextType === DEMAND_TYPE_MFG) {
    itemPickerStation = STATION_MASTER.includes(overrides.station || itemPickerStation) ? (overrides.station || itemPickerStation) : STATION_MASTER[0];
    itemPickerDemandUnit = DEMAND_UNIT_FALLBACK;
  } else {
    itemPickerStation = "";
    itemPickerDemandUnit = demandUnitFor({ demandUnit: overrides.demandUnit || itemPickerDemandUnit || DEMAND_UNIT_FALLBACK });
  }
  updateRequestCarryover({ project: targetProject, phase: itemPickerStage, demandType: itemPickerDemandType });
}

function itemPickerDemandContext() {
  syncItemPickerDemandContext();
  return {
    targetProject: requestCarryoverProject(),
    requestLine: itemPickerRequestLine,
    targetPhase: itemPickerStage,
    demandType: itemPickerDemandType,
    station: itemPickerDemandType === DEMAND_TYPE_MFG ? (itemPickerStation || STATION_MASTER[0]) : "",
    demandUnit: itemPickerDemandType === DEMAND_TYPE_MFG ? "" : demandUnitFor({ demandUnit: itemPickerDemandUnit }),
  };
}

function itemPickerTargetText(context = itemPickerDemandContext()) {
  const stationOrUnit = context.demandType === DEMAND_TYPE_MFG ? context.station : context.demandUnit;
  return `Target: ${context.targetProject} / ${context.requestLine} / ${context.demandType}${stationOrUnit ? ` / ${stationOrUnit}` : ""}`;
}

function renderItemPickerDemandContext() {
  const root = document.getElementById("itemPickerDemandContext");
  if (!root) return;
  const context = itemPickerDemandContext();
  const isMfg = context.demandType === DEMAND_TYPE_MFG;
  const nonMfgUnits = QUANTITY_DASHBOARD_UNITS.filter((unit) => unit !== "MFG");
  root.innerHTML = `
    <section class="request-context-panel" aria-label="Demand input context">
      <div class="request-context-copy">
        <strong>Demand Scope</strong>
        <span>${isMfg ? "MFG: Project / Line → Station → Item." : "Non-MFG: Project / Line → Department → Item."}</span>
      </div>
      <div class="request-context-controls">
        <label>
          <span>Demand Type</span>
          <select id="itemPickerDemandTypeSelect">
            <option value="${DEMAND_TYPE_MFG}" ${isMfg ? "selected" : ""}>MFG · Station</option>
            <option value="${DEMAND_TYPE_NON_MFG}" ${!isMfg ? "selected" : ""}>Non-MFG · Department</option>
          </select>
        </label>
        <label>
          <span>Request Line</span>
          <select id="itemPickerRequestLineSelect">
            ${["Line 1", "Line 2", "Line 3", "Line 4"].map((line) => `<option value="${line}" ${line === context.requestLine ? "selected" : ""}>${line}</option>`).join("")}
          </select>
        </label>
        <label ${isMfg ? "" : "hidden"}>
          <span>Station</span>
          <select id="itemPickerStationSelect">
            ${STATION_MASTER.map((station) => `<option value="${station}" ${station === context.station ? "selected" : ""}>${station}</option>`).join("")}
          </select>
        </label>
        <label ${isMfg ? "hidden" : ""}>
          <span>Demand Unit</span>
          <select id="itemPickerDemandUnitSelect">
            ${nonMfgUnits.map((unit) => `<option value="${unit}" ${unit === context.demandUnit ? "selected" : ""}>${unit}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="request-context-stations" ${isMfg ? "" : "hidden"}>
        <span>Mainline: CG / BG / FATP / Test / Hybrid / Auto</span>
        <span>Packing: ENG Pack / Zombie / Laser_pico / Rework</span>
        <span>Supporting: Repair / WH</span>
      </div>
      <div class="request-context-note">${itemPickerTargetText(context)}. Add item/spec in the worksheet, then enter qty directly in station or department columns.</div>
    </section>
  `;
}

function renderRequesterInputContext() {
  const root = document.getElementById("requestInputContextBar");
  if (!root) return;
  syncRequestWorksheetContext();
  const isMfg = requestWorksheetMode === DEMAND_TYPE_MFG;
  const columns = requestWorksheetColumns();
  root.innerHTML = `
    <div class="request-input-context-copy">
      <strong>${htmlText(currentProject)} / ${htmlText(requestWorksheetLine)}</strong>
      <span>${isMfg ? "MFG station worksheet" : "Non-MFG department worksheet"}</span>
    </div>
    <div class="request-input-context-controls">
      <label>
        <span>Project</span>
        <input type="text" value="${htmlAttr(currentProject)}" readonly />
      </label>
      <label>
        <span>Line</span>
        <select id="requestWorksheetLine">
          ${["Line 1", "Line 2", "Line 3", "Line 4"].map((line) => `<option value="${line}" ${line === requestWorksheetLine ? "selected" : ""}>${line}</option>`).join("")}
        </select>
      </label>
      <span class="status-pill info">${isMfg ? "12 station columns" : "11 department columns"}</span>
      <span class="record-count">${columns.join(" / ")}</span>
    </div>`;
}

function requestLineNumber(line = "") {
  const match = String(line || "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function previousRequestLine(line = "") {
  const number = requestLineNumber(line);
  return number > 1 ? `Line ${number - 1}` : "";
}

function selectedDemandLineMatchKey(row) {
  return warehouseRecordKey(row?.name || "", userVisibleItemDetail(row) || itemDetail(row) || "");
}

function previousLineSuggestionForSelectedRow(row, context) {
  const sourceLine = previousRequestLine(context.requestLine);
  if (!sourceLine || !context.qty) return null;
  const itemKey = selectedDemandLineMatchKey(row);
  const source = reusableHistoryRows().find((record) => {
    const recordKey = warehouseRecordKey(record.name || "", userVisibleItemDetail(record) || itemDetail(record) || "");
    const recordLine = record.requestLine || record.line || sourceLine;
    return recordKey === itemKey && (!recordLine || recordLine === sourceLine);
  });
  if (!source) return null;
  const availableQty = totalQty(source);
  const suggestedQty = Math.min(context.qty, availableQty);
  if (!suggestedQty) return null;
  return {
    id: `${row.id}::previous-line`,
    requestId: row.id,
    sourceType: "previous-line",
    sourceProject: source.project || row.project || "",
    targetProject: row.project || "",
    sourceStage: activePhaseText(source),
    sourceStation: source.station || source.stationOrUnit || "",
    sourceRequestId: source.id || "",
    sourceLabel: `${source.project || row.project} ${sourceLine}`,
    sourceTrace: `${source.project || row.project} / ${sourceLine} / ${activePhaseText(source)} / ${source.id || "-"}`,
    targetLabel: `${row.project || "-"} / ${context.requestLine} / ${context.stageLabel || context.phase || ""}`.trim(),
    itemName: row.name || "",
    itemSpec: userVisibleItemDetail(row) || itemDetail(row) || "",
    availableQty,
    suggestedQty,
    costSavingUsd: amountUsdFromVnd(userCarryoverUnitPriceVnd(row)) * suggestedQty,
    carryoverFrom: sourceLine,
    requestLine: context.requestLine,
    reason: `${sourceLine} reusable quantity can cover part of ${context.requestLine}.`,
  };
}

function warehouseSuggestionForSelectedRow(row, context) {
  if (!context.qty) return null;
  const month = warehouseMonthForDemand(row);
  const itemKey = selectedDemandLineMatchKey(row);
  const inventory = warehouseInventoryRows(month).find((item) => warehouseRecordKey(item.item, item.spec) === itemKey);
  if (!inventory || inventory.availableQty <= 0) return null;
  const source = inventory.topSource || inventory.stockSources?.[0] || {};
  const suggestedQty = Math.min(context.qty, inventory.availableQty);
  if (!suggestedQty) return null;
  return {
    id: `${row.id}::warehouse`,
    requestId: row.id,
    sourceType: "warehouse",
    sourceProject: source.sourceProject || "",
    targetProject: row.project || "",
    sourceStage: source.sourceStage || "",
    sourceStation: source.sourceStation || source.sourceStationOrUnit || "",
    sourceRequestId: source.sourceRequestId || "",
    sourceLabel: `${month} inventory`,
    sourceTrace: warehouseTraceText(inventory),
    targetLabel: `${row.project || "-"} / ${context.requestLine} / ${context.stageLabel || context.phase || ""}`.trim(),
    itemName: row.name || "",
    itemSpec: userVisibleItemDetail(row) || itemDetail(row) || "",
    availableQty: inventory.availableQty,
    suggestedQty,
    costSavingUsd: amountUsdFromVnd(userCarryoverUnitPriceVnd(row)) * suggestedQty,
    carryoverFrom: source.sourceLine || "Warehouse",
    requestLine: context.requestLine,
    reason: `Warehouse inventory for ${month}: ${suggestedQty} pcs can be reviewed by Dept DRI before use.`,
  };
}

function carryoverSuggestionsForSelectedLines() {
  return selectedDemandLineRows().flatMap((row) => {
    const context = selectedDemandLineContext(row);
    return [
      previousLineSuggestionForSelectedRow(row, context),
      warehouseSuggestionForSelectedRow(row, context),
    ].filter(Boolean);
  });
}

function renderItemPickerCarryoverSuggestions() {
  const root = document.getElementById("itemPickerCarryoverSuggestions");
  if (!root) return;
  const rows = selectedDemandLineRows();
  const suggestions = carryoverSuggestionsForSelectedLines();
  if (!rows.length) {
    root.innerHTML = `
      <div class="carryover-suggestions-empty">
        <strong>Potential Carryover</strong>
        <span>Add an item and qty first. Suggestions will appear when previous-line or warehouse evidence matches.</span>
      </div>`;
    return;
  }
  if (!suggestions.length) {
    root.innerHTML = `
      <div class="carryover-suggestions-empty">
        <strong>Potential Carryover</strong>
        <span>No reusable quantity matches the selected demand lines yet.</span>
      </div>`;
    return;
  }
  root.innerHTML = `
    <div class="carryover-suggestion-head">
      <div>
        <strong>Potential Carryover</strong>
        <span>Create a stock or previous-line candidate. Dept DRI confirms before the evidence is locked for cost impact.</span>
      </div>
      <span class="status-pill warning">Dept DRI confirmation required</span>
    </div>
    <div class="carryover-suggestion-grid">
      ${suggestions.map((item) => {
        const relation = item.sourceProject && item.targetProject && item.sourceProject !== item.targetProject ? "Cross Project" : "Same Project";
        return `
        <article class="carryover-suggestion-card ${item.sourceType === "warehouse" ? "warehouse" : "previous"}" title="${htmlAttr(item.sourceTrace)}">
          <div class="carryover-suggestion-source">
            <div class="carryover-suggestion-titleline">
              <strong>${htmlText(item.itemName || item.sourceLabel)}</strong>
              <span class="carryover-source-badge ${relation === "Cross Project" ? "cross" : "same"}">${relation}</span>
            </div>
            <span>${htmlText(item.sourceLabel)} · ${item.sourceType === "warehouse" ? "Inventory available" : "Previous line"}</span>
            <small>${htmlText(item.targetLabel || "")}</small>
          </div>
          <div class="carryover-suggestion-metrics">
            <span><strong>${item.availableQty}</strong><small>available</small></span>
            <span><strong>${item.suggestedQty}</strong><small>candidate</small></span>
            <span><strong>${formatCompactCurrencyFromUsd(item.costSavingUsd)}</strong><small>potential</small></span>
          </div>
          <button class="mini approve" data-create-carryover-candidate="${htmlAttr(item.id)}" title="Create carryover candidate for Dept DRI confirmation">Create Candidate</button>
        </article>`;
      }).join("")}
    </div>`;
}

function createCarryoverCandidate(suggestionId) {
  const suggestion = carryoverSuggestionsForSelectedLines().find((item) => item.id === suggestionId);
  if (!suggestion) {
    showToast("Carryover suggestion is no longer available for the current scope.", "error");
    return;
  }
  requests = requests.map((row) => {
    if (row.id !== suggestion.requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row);
    const first = stationBreakdown[0] || createStationBreakdownEntry(row);
    const nextFirst = normalizeDemandBreakdownCarryover({
      ...first,
      requestLine: suggestion.requestLine,
      carryoverFrom: suggestion.carryoverFrom,
      carryoverQty: suggestion.suggestedQty,
      carryoverReason: suggestion.reason,
      carryoverSourceType: suggestion.sourceType,
      carryoverSourceProject: suggestion.sourceProject || "",
      carryoverSourceStage: suggestion.sourceStage || "",
      carryoverSourceStation: suggestion.sourceStation || "",
      carryoverSourceRequestId: suggestion.sourceRequestId || "",
    });
    const nextRows = [nextFirst, ...stationBreakdown.slice(1)];
    const nextRow = syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown: nextRows });
    syncUserAppliedCarryoverLedger(nextRow, nextFirst);
    createWarehouseUseCandidate(suggestion, nextRow, nextFirst);
    return nextRow;
  });
  renderSelectedDemandLines();
  renderRequestRows();
  if (typeof renderManagerDemandCostDashboard === "function") renderManagerDemandCostDashboard();
  showToast("Carryover candidate created. Dept DRI must confirm before it affects cost.", "success");
}

function applyCarryoverSuggestion(suggestionId) {
  createCarryoverCandidate(suggestionId);
}

function demandTypeFor(row = {}) {
  const raw = String(row.demandType || row.type || "").trim().toLowerCase();
  if (raw === "non-mfg" || raw === "non mfg" || raw === "nonmfg" || raw === "unit") return DEMAND_TYPE_NON_MFG;
  if (raw === "mfg" || raw === "station") return DEMAND_TYPE_MFG;
  if (row.station && STATION_MASTER.includes(row.station)) return DEMAND_TYPE_MFG;
  if (Object.prototype.hasOwnProperty.call(row, "station") && !row.station) return DEMAND_TYPE_NON_MFG;
  return DEMAND_TYPE_MFG;
}

function demandTypeOptionsHtml(selectedValue) {
  const selected = demandTypeFor({ demandType: selectedValue });
  return DEMAND_TYPES
    .map((type) => `<option value="${type}" ${type === selected ? "selected" : ""}>${type}</option>`)
    .join("");
}

function canonicalDemandUnit(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEMAND_UNIT_FALLBACK;
  const normalized = raw.toLowerCase().replace(/\s+/g, " ");
  if (/^\d+$/.test(normalized)) return DEMAND_UNIT_FALLBACK;
  if (DEMAND_UNIT_ALIAS_MAP[normalized]) return DEMAND_UNIT_ALIAS_MAP[normalized];
  return DEMAND_UNIT_OPTIONS.find((unit) => normalize(unit) === normalize(raw)) || raw;
}

function demandUnitFor(row) {
  const unit = canonicalDemandUnit(row?.demandUnit || row?.department || row?.process || DEMAND_UNIT_FALLBACK);
  return DEMAND_UNIT_OPTIONS.includes(unit) ? unit : DEMAND_UNIT_FALLBACK;
}

function demandUnitOptionsHtml(selectedValue) {
  const selected = demandUnitFor({ demandUnit: selectedValue });
  return DEMAND_UNIT_OPTIONS
    .map((unit) => `<option value="${unit}" ${unit === selected ? "selected" : ""}>${unit}</option>`)
    .join("");
}

function stationBreakdownPhaseKey(row) {
  return STAGES.includes(row?.phase) ? row.phase : phaseKeyFromInput(row?.phase);
}

function isLongFormStationBreakdown(row) {
  return Boolean(stationBreakdownPhaseKey(row)) || Object.prototype.hasOwnProperty.call(row || {}, "qty");
}

function stationBreakdownRowTotal(row) {
  if (isLongFormStationBreakdown(row)) return clampQty(row?.qty);
  return STAGES.reduce((sum, stage) => sum + clampQty(row?.[stage]), 0);
}

function stationBreakdownPhaseTotal(row, stage) {
  const breakdown = Array.isArray(row?.stationBreakdown) ? row.stationBreakdown : [];
  return breakdown.reduce((sum, item) => {
    if (isLongFormStationBreakdown(item)) return sum + (stationBreakdownPhaseKey(item) === stage ? clampQty(item.qty) : 0);
    return sum + clampQty(item[stage]);
  }, 0);
}

function stationBreakdownTotal(row) {
  const breakdown = Array.isArray(row?.stationBreakdown) ? row.stationBreakdown : [];
  return breakdown.reduce((sum, item) => sum + stationBreakdownRowTotal(item), 0);
}

function stationBreakdownRowsCount(row) {
  if (!Array.isArray(row?.stationBreakdown)) return 0;
  return row.stationBreakdown.filter((item) => stationBreakdownRowTotal(item) > 0).length || row.stationBreakdown.length;
}

function stationBreakdownHasDemand(row) {
  return stationBreakdownTotal(row) > 0;
}

function stationBreakdownStatus(row) {
  if (!Array.isArray(row?.stationBreakdown) || !row.stationBreakdown.length) return "Need Demand Rows";
  return stationBreakdownHasDemand(row) ? "Ready" : "Need Qty";
}

function stationBreakdownStatusHtml(row) {
  const status = stationBreakdownStatus(row);
  return `<span class="status-pill ${statusClass(status)}">${status}</span>`;
}

function createStationBreakdownEntry(source = {}, overrides = {}) {
  const phase = overrides.phase || source.phase || source.defaultPhase || currentStageForProject(source.project || currentProject);
  const demandType = demandTypeFor({ ...source, ...overrides });
  return {
    id: overrides.id || `SBD-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    demandType,
    phase,
    demandUnit: demandType === DEMAND_TYPE_MFG ? "" : (overrides.demandUnit || demandUnitFor(source)),
    station: demandType === DEMAND_TYPE_MFG ? (overrides.station || stationOptionFor(source.station || source.process || "")) : "",
    qty: clampQty(overrides.qty ?? 0),
    requestLine: overrides.requestLine || source.requestLine || "",
    carryoverFrom: overrides.carryoverFrom || source.carryoverFrom || "",
    carryoverQty: clampQty(overrides.carryoverQty ?? source.carryoverQty),
    carryoverReason: overrides.carryoverReason || source.carryoverReason || "",
    remark: overrides.remark || "",
  };
}

function stationBreakdownFromRecord(record) {
  const rows = STAGES
    .map((stage) => ({
      ...createStationBreakdownEntry(record, { phase: stage, qty: clampQty(record[stage]) }),
    }))
    .filter((row) => row.qty > 0);
  return rows.length ? rows : [createStationBreakdownEntry(record)];
}

function syncRowPhaseQtyFromStationBreakdown(row) {
  if (!Array.isArray(row?.stationBreakdown)) return row;
  return {
    ...row,
    ...Object.fromEntries(STAGES.map((stage) => [stage, stationBreakdownPhaseTotal(row, stage)])),
  };
}

function stationBreakdownRowsForProject() {
  return activeProjectRequests().filter(canRequesterEditRequest);
}

function stationBreakdownRowsForDetail(row) {
  return Array.isArray(row?.stationBreakdown) ? row.stationBreakdown : [];
}

function isNewMaterial(row) {
  return row.mode === "New Material"
    || row.source === "new-item-master"
    || row.quoteStatus === "New item"
    || row.quoteStatus === "New Material"
    || row.sourceRecordId?.startsWith("MASTER")
    || row.partNo?.startsWith("NEW-");
}

function isLegacyMaintenance(row) {
  return row.mode === "Maintain Existing Material";
}

function isMaterialNoPending(row) {
  return isNewMaterial(row) && !row.materialId && !row.materialNo && !materialMasterRecordFor(row);
}

function itemType(row, sourceType = "") {
  return sourceType === "suggestion" || isNewMaterial(row) ? "New Material" : "Existing Item";
}

function itemTypeBadge(row, sourceType = "") {
  const type = itemType(row, sourceType);
  return `<span class="item-type-badge ${statusClass(type)}">${type}</span>`;
}

function itemDetailButton(sourceType, sourceId) {
  return `<button class="mini return" data-item-detail-source="${sourceType}" data-item-detail-id="${sourceId}">Detail</button>`;
}

function detailValue(value, fallback = "-") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function handoffRoute(row) {
  if (isNewMaterial(row)) return ROUTE_SOURCING;
  return ROUTE_REUSE;
}

function handoffTarget(row) {
  return "Sourcing";
}

function exportStatus(row) {
  if (row.procurementStatus === HANDOFF_WAITING_PAS) return HANDOFF_WAITING_PAS;
  if (row.procurementStatus === HANDOFF_SENT_TO_OM) return HANDOFF_SENT_TO_OM;
  if (row.procurementStatus === HANDOFF_SENT_TO_BUYER) return HANDOFF_SENT_TO_BUYER;
  return row.procurementStatus === HANDOFF_EXPORTED ? HANDOFF_EXPORTED : HANDOFF_READY;
}

function handoffDisplayStatus(row) {
  if (row.procurementStatus === HANDOFF_WAITING_PAS) return pasDisplayStatus(row);
  if (row.procurementStatus === HANDOFF_SENT_TO_OM && isOmBuyScope(row)) return "PAS Approved - Send to OM";
  if (row.procurementStatus === HANDOFF_SENT_TO_OM) return HANDOFF_SENT_TO_OM;
  if (row.procurementStatus === HANDOFF_SENT_TO_BUYER) return HANDOFF_SENT_TO_BUYER;
  if (row.procurementStatus === HANDOFF_EXPORTED) return `Exported to ${row.exportTarget || handoffTarget(row)}`;
  if (row.procurementStatus === HANDOFF_READY || row.status === "Approved") return HANDOFF_READY;
  return row.procurementStatus || row.status;
}

function handoffWarnings(row) {
  const warnings = [];
  if (totalQty(row) === 0) warnings.push("Total qty is zero");
  if (isNewMaterial(row) && (!row.spec || normalize(row.spec).includes("tbd"))) warnings.push("New item spec may need sourcing detail");
  return warnings;
}

function omBuyScopeText(row) {
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

function itemOwnerText(row = {}) {
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

function itemOwnerKeyword(text, keyword) {
  const normalizedKeyword = normalize(keyword).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}([^a-z0-9]|$)`).test(text);
}

function isExplicitNonOmOwnerText(text = "") {
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

function isOmOwnedItem(row = {}) {
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

function itemOwnerFor(row = {}) {
  if (row.itemOwner && row.itemOwner !== ITEM_OWNER_PENDING) return row.itemOwner;
  if (isOmOwnedItem(row)) return ITEM_OWNER_OM;
  if (demandTypeFor(row) === DEMAND_TYPE_NON_MFG || row.demandUnit || row.department) return ITEM_OWNER_UNIT;
  if (row.name || itemDetail(row)) return ITEM_OWNER_MFG;
  return ITEM_OWNER_PENDING;
}

function itemOwnerLabel(row = {}) {
  const owner = itemOwnerFor(row);
  if (owner === ITEM_OWNER_OM) return "OM-owned";
  if (owner === ITEM_OWNER_MFG) return "MFG-owned";
  if (owner === ITEM_OWNER_UNIT) return "Unit-owned";
  if (owner === ITEM_OWNER_NON_OM) return "Non-OM";
  return ITEM_OWNER_PENDING;
}

function itemOwnerBadgeHtml(row = {}) {
  const label = itemOwnerLabel(row);
  const tone = label === "OM-owned" ? "info" : label === ITEM_OWNER_PENDING ? "warning" : "pending";
  return `<span class="status-pill owner-badge ${tone}" title="Read-only owner from item master">${label}</span>`;
}

function omKeywordMatches(text, keyword) {
  const normalizedKeyword = normalize(keyword);
  if (["pc", "ap"].includes(normalizedKeyword)) {
    return new RegExp(`(^|[^a-z0-9])${normalizedKeyword}([^a-z0-9]|$)`).test(text);
  }
  return text.includes(normalizedKeyword);
}

function omResponsibilityText(row) {
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

function omResponsibilityEntrySearchTerms(entry) {
  return [
    entry.level1Cn,
    entry.level1En,
    entry.level2Cn,
    entry.level2En,
    entry.level3Cn,
    entry.level3En,
  ].filter(Boolean).map(normalize);
}

function omResponsibilityMatch(row) {
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

function omResponsibilityPatch(row) {
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

function applyOmResponsibility(row) {
  return { ...row, ...omResponsibilityPatch(row) };
}

function omCategoryPath(row) {
  return [row.omCategoryLevel1, row.omCategoryLevel2, row.omCategoryLevel3].filter(Boolean).join(" / ");
}

function omCategoryCompact(row) {
  return [row.omCategoryLevel2, row.omCategoryLevel3].filter(Boolean).join(" / ") || row.omClassificationStatus || "Need OM Classification";
}

function omBuyScopeStatus(row) {
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

function omBuyScopeReason(row) {
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

function isOmBuyScope(row) {
  return [OM_SCOPE_STANDARD, OM_SCOPE_NEED_SPEC].includes(omBuyScopeStatus(row));
}

function isPasRequired(row) {
  return isOmBuyScope(row);
}

function pasStatus(row) {
  if (!isPasRequired(row)) return PAS_NOT_REQUIRED;
  return row.pasStatus || PAS_REQUIRED;
}

function pasDisplayStatus(row) {
  const status = pasStatus(row);
  if (status === PAS_REQUIRED && row.procurementStatus === HANDOFF_WAITING_PAS) return PAS_WAITING;
  return status;
}

function managerNextStep(row) {
  const scope = omBuyScopeStatus(row);
  if ([OM_SCOPE_STANDARD, OM_SCOPE_NEED_SPEC].includes(scope)) return "PAS Required - OM Buy Scope";
  if (scope === OM_SCOPE_COORDINATOR) return "MFG / Sourcing Review";
  return "Ready for MFG / Sourcing";
}

function refreshProjectCodes() {
  PROJECTS = projectConfigs.map((project) => project.code);
}

function normalizeProjectCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function phaseKeyFromInput(value) {
  const text = String(value || "").trim();
  const normalized = text.toLowerCase().replace(/[\s_-]+/g, "");
  const aliases = {
    p10: "p10",
    p1: "p10",
    "p1.0": "p10",
    p11: "p11",
    "p1.1": "p11",
    evt: "evt",
    dvt: "dvt",
    pvt: "pvt",
    mp: "mp",
  };
  return aliases[normalized] || "";
}

function currentPhaseLabelForProject(projectCode) {
  const phase = projectConfigFor(projectCode)?.currentPhase || STAGE_LABELS[STAGES[0]];
  const standardPhase = phaseKeyFromInput(phase);
  return standardPhase ? stageLabel(standardPhase) : phase;
}

function nextBuyPhaseLabelForProject(projectCode) {
  const nextStage = nextBuyStageForProject(projectCode);
  return nextStage ? stageLabel(nextStage) : "Manager-defined phase";
}

function projectConfigFor(projectCode) {
  return projectConfigs.find((project) => project.code === projectCode) || null;
}

function projectTypeFor(projectCode) {
  return projectConfigFor(projectCode)?.projectType || "G";
}

function projectTypesForFilter() {
  return PROJECT_TYPES;
}

function stageDateForProject(projectCode, stage) {
  return projectConfigFor(projectCode)?.stageDates?.[stage] || "";
}

function requiredDeliveryDateForProject(projectCode, stage) {
  const rawDate = stageDateForProject(projectCode, stage);
  if (!rawDate) return "";
  const date = new Date(`${rawDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 14);
  return date.toISOString().slice(0, 10);
}

function allProjectCodes() {
  return projectConfigs.map((project) => project.code);
}

function projectCodesByType(type, { openOnly = false } = {}) {
  return projectConfigs
    .filter((project) => (!type || project.projectType === type) && (!openOnly || project.openToUser))
    .map((project) => project.code);
}

function openProjectCodes() {
  return projectConfigs.filter((project) => project.openToUser).map((project) => project.code);
}

function syncProjectTypeSelect(id, { includeAll = false, allLabel = "All project types" } = {}) {
  const select = document.getElementById(id);
  if (!select) return "";
  const previousValue = select.value;
  select.innerHTML = [
    includeAll ? `<option value="">${allLabel}</option>` : "",
    ...projectTypesForFilter().map((type) => `<option value="${type}">${type}</option>`),
  ].join("");
  if (projectTypesForFilter().includes(previousValue) || (includeAll && previousValue === "")) select.value = previousValue;
  else select.value = includeAll ? "" : currentProjectType;
  return select.value;
}

function syncOmOwnerFilter() {
  const select = document.getElementById("omOwnerFilter");
  if (!select) return "";
  const previousValue = select.value;
  const owners = [...new Set(OM_RESPONSIBILITY_MASTER.map((entry) => entry.owner).filter(Boolean))].sort();
  select.innerHTML = [`<option value="">All owners</option>`, ...owners.map((owner) => `<option value="${owner}">${owner}</option>`)].join("");
  select.value = owners.includes(previousValue) ? previousValue : "";
  return select.value;
}

function syncOmQuoteExpiryAssigneeFilter() {
  const select = document.getElementById("omQuoteExpiryAssigneeFilter");
  if (!select) return "";
  const previousValue = select.value;
  select.innerHTML = [
    `<option value="">All assignees</option>`,
    `<option value="unassigned">Unassigned</option>`,
    ...omAssignees.map((user) => `<option value="${user.id}">${user.name} · ${user.role === "omLeader" ? "Leader" : "Member"}</option>`),
  ].join("");
  const values = ["", "unassigned", ...omAssignees.map((user) => user.id)];
  select.value = values.includes(previousValue) ? previousValue : "";
  return select.value;
}

function syncProjectSelect(id, { includeAll = false, allLabel = "All projects", openOnly = false, projectType = "" } = {}) {
  const select = document.getElementById(id);
  if (!select) return "";
  const previousValue = select.value;
  const projects = projectType ? projectCodesByType(projectType, { openOnly }) : openOnly ? openProjectCodes() : allProjectCodes();
  select.innerHTML = [
    includeAll ? `<option value="">${allLabel}</option>` : "",
    ...projects.map((project) => `<option value="${project}">${project}</option>`),
  ].join("");
  if (projects.includes(previousValue) || (includeAll && previousValue === "")) {
    select.value = previousValue;
  } else {
    select.value = includeAll ? "" : projects[0] || "";
  }
  return select.value;
}

function omProjectPackageCodes() {
  const codes = new Set(["P26", ...allProjectCodes()]);
  requests.forEach((row) => {
    const relevant = row.status === "Approved"
      || row.procurementStatus === HANDOFF_SENT_TO_OM
      || row.procurementStatus === HANDOFF_WAITING_PAS
      || row.omStage
      || row.demoOmSeed;
    if (relevant && row.project) codes.add(row.project);
  });
  purchaseRecords.forEach((row) => {
    if (row.project) codes.add(row.project);
  });
  return [...codes].filter(Boolean).sort((left, right) => left === "P26" ? -1 : right === "P26" ? 1 : left.localeCompare(right));
}

function syncOmProjectPackageSelect(id, { allLabel = "All project packages" } = {}) {
  const select = document.getElementById(id);
  if (!select) return "";
  const previousValue = select.value;
  const projects = omProjectPackageCodes();
  select.innerHTML = [
    `<option value="">${allLabel}</option>`,
    ...projects.map((project) => `<option value="${project}">${project}</option>`),
  ].join("");
  select.value = projects.includes(previousValue) ? previousValue : "";
  return select.value;
}

function syncProjectControls() {
  refreshProjectCodes();
  currentProjectType = syncProjectTypeSelect("projectTypeSelect") || currentProjectType;
  const userProject = syncProjectSelect("projectSelect", { openOnly: true, projectType: currentProjectType });
  if (!projectCodesByType(currentProjectType, { openOnly: true }).includes(currentProject)) currentProject = userProject || currentProject;
  if (document.getElementById("projectSelect")) document.getElementById("projectSelect").value = currentProject;
  syncProjectTypeSelect("managerDemandProjectTypeFilter", { includeAll: true });
  syncProjectSelect("historySourceProject", { includeAll: true, allLabel: "All source projects" });
  syncProjectSelect("historyPackageSourceProject", { includeAll: true, allLabel: "All source projects" });
  syncProjectSelect("managerProjectFilter", { includeAll: true });
  syncProjectSelect("managerCostProjectFilter", { includeAll: true });
  syncProjectSelect("managerStageProjectFilter", { includeAll: true });
  syncProjectSelect("managerDashboardProjectFilter", { includeAll: true });
  syncProjectSelect("handoffProjectFilter", { includeAll: true });
  syncOmProjectPackageSelect("omDemandProjectFilter");
  syncOmOwnerFilter();
  syncOmProjectPackageSelect("omProjectFilter");
  syncOmProjectPackageSelect("omQuoteExpiryProjectFilter");
  syncOmQuoteExpiryAssigneeFilter();
  syncProjectSelect("omUserConfirmProjectFilter", { includeAll: true, allLabel: "All project packages" });
  syncOmProjectPackageSelect("omFinalExportProjectFilter");
  syncProjectSelect("omHistoryProjectFilter", { includeAll: true });
  syncProjectSelect("buyerProjectFilter", { includeAll: true });
}

function fillSelect(select, options, placeholder, value = "") {
  select.innerHTML = [`<option value="">${placeholder}</option>`, ...options.map((option) => `<option value="${option}">${option}</option>`)].join("");
  select.value = options.includes(value) ? value : "";
}

function level1Options() {
  return Object.keys(LV_TAXONOMY);
}

function level2Options(level1) {
  return level1 ? Object.keys(LV_TAXONOMY[level1] || {}) : [];
}

function level3Options(level1, level2) {
  return level1 && level2 ? LV_TAXONOMY[level1]?.[level2] || [] : [];
}

function syncCascade(prefix, values = {}) {
  const level1 = document.getElementById(`${prefix}Level1`);
  const level2 = document.getElementById(`${prefix}Level2`);
  const level3 = document.getElementById(`${prefix}Level3`);
  if (!level1 || !level2 || !level3) return;
  fillSelect(level1, level1Options(), "All Level 1", values.level1 ?? level1.value);
  fillSelect(level2, level2Options(level1.value), level1.value ? "All Level 2" : "Select Level 1 first", values.level2 ?? level2.value);
  fillSelect(level3, level3Options(level1.value, level2.value), level2.value ? "All Level 3" : "Select Level 2 first", values.level3 ?? level3.value);
}

function activeProjectRequests() {
  return requests.filter((row) => row.project === currentProject && row.status === "Draft");
}

function canRequesterEditRequest(row) {
  return ["requester", "admin"].includes(currentRole) && row && row.status === "Draft";
}

function needDateForRow(row) {
  return row?.needDate || row?.requiredDeliveryDate || row?.requiredDeliveryDateDri || "";
}

function updateRequestNeedDate(requestId, value) {
  const nextValue = value || "";
  const now = new Date().toISOString();
  requests = requests.map((row) => {
    if (row.id !== requestId) return row;
    const previous = needDateForRow(row);
    return {
      ...row,
      needDate: nextValue,
      requiredDeliveryDate: nextValue,
      requiredDeliveryDateDri: nextValue,
      requestDeadline: row.requestDeadline || nextValue,
      needDateUpdatedAt: previous !== nextValue ? now : row.needDateUpdatedAt,
      needDateUpdatedBy: previous !== nextValue ? roleProfiles[currentRole]?.name || "Requester" : row.needDateUpdatedBy,
    };
  });
  const updated = requests.find((row) => row.id === requestId);
  if (updated) addHandoffHistory(updated, "Need date updated", nextValue || "Need date cleared");
  renderDepartment();
}

function visibleSuggestions() {
  return newItemSuggestions;
}

function currentStageForProject(project) {
  return phaseKeyFromInput(projectConfigFor(project)?.currentPhase) || STAGES[0];
}

function nextBuyStageForProject(project) {
  const currentStage = phaseKeyFromInput(projectConfigFor(project)?.currentPhase);
  if (!currentStage) return "";
  const currentIndex = STAGES.indexOf(currentStage);
  if (currentIndex < 0) return "";
  return STAGES[Math.min(currentIndex + 1, STAGES.length - 1)];
}

function previousStageKeys(stageKey) {
  const index = STAGES.indexOf(stageKey);
  return index <= 0 ? [] : STAGES.slice(0, index);
}

function demandComparable(row, candidate) {
  return globalItemKey(candidate) === globalItemKey(row)
    || (candidate.sourceRecordId && (candidate.sourceRecordId === row.sourceRecordId || candidate.sourceRecordId === row.id))
    || normalize([candidate.name, itemDetail(candidate)].filter(Boolean).join("|"))
      === normalize([row.name, itemDetail(row)].filter(Boolean).join("|"));
}

function baselineFor(row, stage = currentStageForProject(row.project)) {
  return demandBaselines.find((baseline) => baseline.project === row.project && baseline.stage === stage && demandComparable(row, baseline)) || null;
}

function crossProjectActualRows(row, stage = currentStageForProject(row.project)) {
  const stageEndIndex = DEMAND_STAGE_ORDER.indexOf(stage);
  const allowedStages = new Set(DEMAND_STAGE_ORDER.slice(0, stageEndIndex + 1));
  return actualBuyRecords.filter((actual) => actual.project === row.project && allowedStages.has(actual.stage) && demandComparable(row, actual));
}

function actualBuyFor(row, stage = currentStageForProject(row.project)) {
  const rows = crossProjectActualRows(row, stage);
  if (!rows.length) return null;
  return rows.reduce((sum, actual) => sum + clampQty(actual.actualQty), 0);
}

function approvedDemandFor(row, stage = currentStageForProject(row.project)) {
  return requests
    .filter((request) => request.project === row.project && request.status === "Approved" && demandComparable(row, request))
    .reduce((sum, request) => sum + clampQty(request[stage]), 0);
}

function currentRequestFor(row, stage = currentStageForProject(row.project), sourceType = "request") {
  if (sourceType === "request" && !["Approved", "Rejected"].includes(row.status)) return clampQty(row[stage]);
  return requests
    .filter((request) => request.project === row.project && !["Approved", "Rejected"].includes(request.status) && demandComparable(row, request))
    .reduce((sum, request) => sum + clampQty(request[stage]), 0);
}

function consumedDemandFor(row, stage = currentStageForProject(row.project)) {
  return demandBaselines
    .filter((baseline) => demandComparable(row, baseline) && DEMAND_STAGE_ORDER.indexOf(baseline.stage) <= DEMAND_STAGE_ORDER.indexOf(stage))
    .reduce((sum, baseline) => sum + clampQty(baseline.baselineQty), 0);
}

function sourceProjectsFor(row, stage = currentStageForProject(row.project)) {
  const rows = crossProjectActualRows(row, stage);
  return [...new Set(rows.map((actual) => actual.project))];
}

function usedByOtherProjectsFor(row, stage = currentStageForProject(row.project)) {
  return demandBaselines
    .filter((baseline) => baseline.project !== row.project && demandComparable(row, baseline) && DEMAND_STAGE_ORDER.indexOf(baseline.stage) <= DEMAND_STAGE_ORDER.indexOf(stage))
    .reduce((sum, baseline) => sum + clampQty(baseline.baselineQty), 0);
}

function matchingPurchaseRecord(row) {
  return purchaseRecords.find((record) => record.id === row.sourceRecordId)
    || purchaseRecords.find((record) => record.project === row.project && record.partNo === row.partNo)
    || purchaseRecords.find((record) => record.project === row.project && normalize(record.name) === normalize(row.name));
}

function stageDemandMetric(row, sourceType = "request", stage = currentStageForProject(row.project)) {
  const baseline = baselineFor(row, stage);
  const baselineDemand = baseline ? clampQty(baseline.baselineQty) : null;
  const crossProjectActualBuy = actualBuyFor(row, stage);
  const approvedDemand = approvedDemandFor(row, stage);
  const currentRequestQty = currentRequestFor(row, stage, sourceType);
  const consumedDemand = consumedDemandFor(row, stage);
  const usedByOtherProjects = usedByOtherProjectsFor(row, stage);
  const actualForMath = crossProjectActualBuy ?? 0;
  const baselineForMath = baselineDemand ?? 0;
  const availableResidual = Math.max(0, actualForMath - consumedDemand);
  const carryoverStock = availableResidual;
  const remainingNeed = baselineDemand === null ? currentRequestQty : Math.max(0, baselineForMath - availableResidual - approvedDemand);
  const demandBaseForNewBuy = currentRequestQty > 0 ? currentRequestQty : baselineForMath;
  const suggestedNewBuy = baselineDemand === null
    ? currentRequestQty
    : Math.max(0, demandBaseForNewBuy - availableResidual - approvedDemand);
  const variance = baselineDemand === null ? currentRequestQty : actualForMath + approvedDemand + currentRequestQty - baselineForMath;
  const sourceProjects = sourceProjectsFor(row, stage);
  const riskStatus = demandRiskStatus({
    baselineDemand,
    crossProjectActualBuy,
    approvedDemand,
    currentRequestQty,
    remainingNeed,
    variance,
    availableResidual,
    usedByOtherProjects,
    sourceProjects,
    project: row.project,
  });

  return {
    stage,
    baselineDemand,
    approvedDemand,
    actualBuy: crossProjectActualBuy,
    crossProjectActualBuy,
    consumedDemand,
    usedByOtherProjects,
    availableResidual,
    carryoverStock,
    currentRequestQty,
    remainingNeed,
    variance,
    riskStatus,
    suggestedQty: suggestedNewBuy,
    suggestedNewBuy,
    sourceProjects,
  };
}

function demandRiskStatus({ baselineDemand, crossProjectActualBuy, approvedDemand, currentRequestQty, remainingNeed, variance, availableResidual, usedByOtherProjects, sourceProjects, project }) {
  if (baselineDemand === null) return "Missing Plan";
  if (currentRequestQty > remainingNeed && currentRequestQty > 0) return "Over Request";
  if (availableResidual > 0) return "Carryover Available";
  if (remainingNeed > 0) return "Need Purchase";
  return "OK";
}

function stageDemandRows(projectFilter = currentProject, stageFilter = currentStageForProject(projectFilter || currentProject)) {
  const rows = [];
  const seen = new Set();
  const addRow = (row, sourceType) => {
    const stage = stageFilter || currentStageForProject(row.project);
    const key = `${row.project}-${stage}-${globalItemKey(row)}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      ...row,
      detailSource: sourceType,
      detailId: row.id,
      metrics: stageDemandMetric(row, sourceType, stage),
    });
  };

  purchaseRecords
    .filter((row) => !projectFilter || row.project === projectFilter)
    .forEach((row) => addRow(row, "record"));

  demandBaselines
    .filter((row) => !projectFilter || row.project === projectFilter)
    .forEach((baseline) => {
      const sourceRecord = matchingPurchaseRecord(baseline)
        || purchaseRecords.find((record) => demandComparable(record, baseline));
      addRow({
        ...(sourceRecord || {}),
        ...baseline,
        id: sourceRecord?.id || baseline.sourceRecordId || baseline.id,
        sourceRecordId: baseline.sourceRecordId || sourceRecord?.id,
        project: baseline.project,
        partNo: baseline.partNo || sourceRecord?.partNo,
        materialNo: baseline.materialNo || materialNoFor(sourceRecord || baseline),
        materialIdentityKey: baseline.materialIdentityKey || materialIdentityKey(sourceRecord || baseline),
        globalItemId: baseline.globalItemId || sourceRecord?.globalItemId,
        name: baseline.name || sourceRecord?.name,
        spec: baseline.spec || sourceRecord?.spec,
        vendor: baseline.vendor || sourceRecord?.vendor,
        unitPrice: baseline.unitPrice ?? sourceRecord?.unitPrice ?? 0,
      }, sourceRecord ? "record" : "baseline");
    });

  requests
    .filter((row) => row.status !== "Rejected" && (!projectFilter || row.project === projectFilter))
    .forEach((row) => addRow(row, "request"));

  return rows;
}

function renderStageDemandRows(rows, targetId) {
  document.getElementById(targetId).innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${stageLabel(row.metrics.stage)}</td>
        <td>${managerLineDepartment(row)}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div>${isNewMaterial(row) ? itemTypeBadge(row) : ""}</td>
        <td>${stationDisplay(row)}</td>
        <td>${itemDetail(row)}</td>
        <td>${factoryMaterialNoFor(row)}</td>
        <td>${row.metrics.baselineDemand ?? "-"}</td>
        <td>${row.metrics.carryoverStock}</td>
        <td>${row.metrics.suggestedNewBuy}</td>
        <td>${clampQty(row[row.metrics.stage])}</td>
        <td>${effectiveUnitPrice(row) ? money(clampQty(row[row.metrics.stage]) * effectiveUnitPrice(row)) : "-"}</td>
        <td><span class="status-pill ${statusClass(managerNextStep(row))}">${managerNextStep(row)}</span></td>
        <td><span class="status-pill ${statusClass(row.metrics.riskStatus)}">${row.metrics.riskStatus}</span></td>
        <td>${itemDetailButton(row.detailSource, row.detailId)}</td>
      </tr>`).join("")
    : `<tr><td colspan="13" class="empty-cell">No demand data is available for the selected project.</td></tr>`;
}

function stageSummaryCards(rows, label = "") {
  const projects = [...new Set(rows.map((row) => row.project))];
  const stageSummary = rows.length
    ? projects.length === 1 ? `${projects[0]} / ${stageLabel(rows[0].metrics.stage)}` : "All projects"
    : "-";
  return [
    [label || "Phase", stageSummary],
    ["Planned Demand", rows.reduce((sum, row) => sum + (row.metrics.baselineDemand ?? 0), 0)],
    ["Carryover", rows.reduce((sum, row) => sum + row.metrics.carryoverStock, 0)],
    ["Need to Buy", rows.reduce((sum, row) => sum + row.metrics.suggestedNewBuy, 0)],
    ["Risk Items", rows.filter((row) => !["OK", "Need Purchase"].includes(row.metrics.riskStatus)).length],
  ];
}

function summaryCardsHtml(cards) {
  return cards.map((card) => {
    const normalized = Array.isArray(card)
      ? { label: card[0], value: card[1], helper: "", variant: "" }
      : { label: card.label, value: card.value, helper: card.helper || "", variant: card.variant || "" };
    const variantClass = normalized.variant ? ` summary-card-${normalized.variant}` : "";
    return `
    <article class="summary-card${variantClass}">
      <span>${normalized.label}</span>
      <strong>${normalized.value}</strong>
      ${normalized.helper ? `<small>${normalized.helper}</small>` : ""}
    </article>`;
  }).join("");
}

function renderStageSummary(rows, targetId) {
  document.getElementById(targetId).innerHTML = summaryCardsHtml(stageSummaryCards(rows));
}

function stageDemandTableHtml(tbodyId) {
  return `
    <div class="table-wrap stage-demand-wrap">
      <table class="data-table stage-demand-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Phase</th>
            <th>Item</th>
            <th>Detail / Spec</th>
            <th>Material Name</th>
            <th>Planned Demand</th>
            <th>Carryover</th>
            <th>Current Request</th>
            <th>Need to Buy</th>
            <th>Risk</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody id="${tbodyId}"></tbody>
      </table>
    </div>`;
}

const NON_MFG_DEPARTMENTS = [];

function normalizedNonMfgDepartment(row) {
  const label = clean(row?.department);
  return label;
}

function stationDisplay(row) {
  return row?.station || "-";
}

function managerLineDepartment(row) {
  return normalizedNonMfgDepartment(row) || "-";
}

function itemNameStack(row) {
  const cn = row.standardNameCn || row.name || "-";
  const en = row.standardNameEn || row.name || "-";
  const vn = row.standardNameVn || row.vnName || "-";
  return `
    <div class="item-name-stack">
      <strong>${cn}</strong>
      <span>${en} / ${vn}</span>
    </div>`;
}

function demandProcessGroup(row) {
  const process = normalize(row.process || row.station || row.level2 || row.level3);
  if (process.includes("pack") || process.includes("包材") || process.includes("包裝")) return "packing";
  if (process.includes("office") || process.includes("lab") || process.includes("warehouse") || process.includes("facility") || process.includes("support")) return "supporting";
  return "mainline";
}

function demandInputBreakdown(row) {
  const demand = row.metrics?.baselineDemand ?? row.metrics?.currentRequestQty ?? 0;
  const group = demandProcessGroup(row);
  const mainline = group === "mainline" ? demand : 0;
  const packing = group === "packing" ? demand : 0;
  const supporting = group === "supporting" ? demand : 0;
  const buffer = Math.ceil(demand * 0.1);
  const totalDemand = demand + buffer;
  const stock = row.metrics?.carryoverStock ?? 0;
  const actualNeed = Math.max(0, totalDemand - stock);
  return { demand, mainline, packing, supporting, buffer, totalDemand, stock, actualNeed };
}

function renderDeptDemandControls(activeBuyStage) {
  const phaseSelect = document.getElementById("deptDemandPhase");
  const modeSelect = document.getElementById("deptDemandMode");
  const deptSelect = document.getElementById("deptDemandDepartment");
  const deptField = document.getElementById("deptDemandDepartmentField");
  if (!phaseSelect || !modeSelect || !deptSelect) return;

  if (!STAGES.includes(currentDeptDemandPhase)) currentDeptDemandPhase = activeBuyStage || currentStageForProject(currentProject);
  if (!NON_MFG_DEPARTMENTS.includes(currentDeptDemandDepartment)) currentDeptDemandDepartment = "";

  modeSelect.value = currentDeptDemandMode;
  phaseSelect.innerHTML = STAGES.map((stage) => `<option value="${stage}" ${stage === currentDeptDemandPhase ? "selected" : ""}>${stageLabel(stage)}</option>`).join("");
  deptSelect.innerHTML = NON_MFG_DEPARTMENTS.length
    ? NON_MFG_DEPARTMENTS.map((dept) => `<option value="${dept}" ${dept === currentDeptDemandDepartment ? "selected" : ""}>${dept}</option>`).join("")
    : `<option value="">Department Name</option>`;
  deptSelect.disabled = !NON_MFG_DEPARTMENTS.length;
  deptField.classList.toggle("utility-hidden", currentDeptDemandMode !== "nonMfg");
}

function deptDemandSummaryCards(rows, mode, phase) {
  const planned = rows.reduce((sum, row) => sum + (row.metrics.baselineDemand ?? 0), 0);
  const carryover = rows.reduce((sum, row) => sum + row.metrics.carryoverStock, 0);
  const needToBuy = rows.reduce((sum, row) => sum + row.metrics.suggestedNewBuy, 0);
  const riskItems = rows.filter((row) => !["OK", "Need Purchase"].includes(row.metrics.riskStatus)).length;
  return [
    ["Mode", mode === "mfg" ? "MFG" : "Non-MFG"],
    ["Phase", stageLabel(phase)],
    ["Items", rows.length],
    ["Planned Demand", planned],
    ["Carryover", carryover],
    ["Need to Buy", needToBuy],
    ["Risk Items", riskItems],
  ];
}

function renderDeptMfgDemandMatrix(rows) {
  document.getElementById("deptDemandMatrix").innerHTML = `
    <div class="table-wrap stage-demand-wrap">
      <table class="data-table phase-input-table mfg-phase-table">
        <thead>
          <tr>
            <th rowspan="2">Item Master</th>
            <th rowspan="2">Station</th>
            <th rowspan="2">Detail / Spec</th>
            <th rowspan="2">Material No.</th>
            <th colspan="3">Process Demand</th>
            <th colspan="4">Demand Calculation</th>
            <th rowspan="2">Risk</th>
            <th rowspan="2">Detail</th>
          </tr>
          <tr>
            <th>Mainline</th>
            <th>Packing</th>
            <th>Supporting</th>
            <th>Buffer</th>
            <th>Total Demand</th>
            <th>Stock</th>
            <th>Actual Need</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => {
            const demand = demandInputBreakdown(row);
            return `
              <tr>
                <td>${itemNameStack(row)}</td>
                <td>${stationDisplay(row)}</td>
                <td class="wrap-cell">${itemDetail(row)}</td>
                <td>${itemKeyDisplay(row)}</td>
                <td>${demand.mainline}</td>
                <td>${demand.packing}</td>
                <td>${demand.supporting}</td>
                <td>${demand.buffer}</td>
                <td>${demand.totalDemand}</td>
                <td>${demand.stock}</td>
                <td>${demand.actualNeed}</td>
                <td><span class="status-pill ${statusClass(row.metrics.riskStatus)}">${row.metrics.riskStatus}</span></td>
                <td>${itemDetailButton(row.detailSource, row.detailId)}</td>
              </tr>`;
          }).join("") : `<tr><td colspan="13" class="empty-cell">No demand data is available for this phase.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function renderDeptNonMfgDemandMatrix(rows) {
  document.getElementById("deptDemandMatrix").innerHTML = `
    <div class="table-wrap stage-demand-wrap">
      <table class="data-table phase-input-table non-mfg-phase-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Item Master</th>
            <th>Station</th>
            <th>Detail / Spec</th>
            <th>Material No.</th>
            <th>Demand</th>
            <th>Buffer</th>
            <th>Total Demand</th>
            <th>Stock</th>
            <th>Actual Need</th>
            <th>Risk</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => {
            const demand = demandInputBreakdown(row);
            return `
              <tr>
                <td>${normalizedNonMfgDepartment(row) || "-"}</td>
                <td>${itemNameStack(row)}</td>
                <td>${stationDisplay(row)}</td>
                <td class="wrap-cell">${itemDetail(row)}</td>
                <td>${itemKeyDisplay(row)}</td>
                <td>${demand.demand}</td>
                <td>${demand.buffer}</td>
                <td>${demand.totalDemand}</td>
                <td>${demand.stock}</td>
                <td>${demand.actualNeed}</td>
                <td><span class="status-pill ${statusClass(row.metrics.riskStatus)}">${row.metrics.riskStatus}</span></td>
                <td>${itemDetailButton(row.detailSource, row.detailId)}</td>
              </tr>`;
          }).join("") : `<tr><td colspan="12" class="empty-cell">No demand data is available for this phase.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function renderDeptStageTracking() {
  const activeBuyStage = nextBuyStageForProject(currentProject);
  if (!STAGES.includes(currentDeptDemandPhase)) currentDeptDemandPhase = activeBuyStage || currentStageForProject(currentProject);
  const rows = stageDemandRows(currentProject, currentDeptDemandPhase);
  document.getElementById("deptStageBadge").textContent = activeBuyStage
    ? `${currentProject}: current ${currentPhaseLabelForProject(currentProject)} / next buy ${stageLabel(activeBuyStage)}`
    : `${currentProject}: current ${currentPhaseLabelForProject(currentProject)} / manager-defined phase`;
  renderDeptDemandControls(activeBuyStage);
  document.getElementById("deptDemandOverview").innerHTML = summaryCardsHtml(deptDemandSummaryCards(rows, currentDeptDemandMode, currentDeptDemandPhase));
  if (currentDeptDemandMode === "nonMfg") renderDeptNonMfgDemandMatrix(rows);
  else renderDeptMfgDemandMatrix(rows);
}

function stageAggregate(project, stage) {
  const rows = stageDemandRows(project, stage);
  const stageDemand = rows.reduce((sum, row) => sum + (row.metrics.baselineDemand ?? 0), 0);
  const carryover = rows.reduce((sum, row) => sum + row.metrics.carryoverStock, 0);
  const needToBuy = rows.reduce((sum, row) => sum + row.metrics.suggestedNewBuy, 0);
  const lineOpeningCost = rows.reduce((sum, row) => sum + (row.metrics.suggestedNewBuy * Number(row.unitPrice || 0)), 0);
  const riskItems = rows.filter((row) => !["OK", "Need Purchase"].includes(row.metrics.riskStatus)).length;
  return {
    project,
    stage,
    rows,
    stageDemand,
    carryover,
    needToBuy,
    lineOpeningCost,
    riskItems,
  };
}

function groupCostConfidence(rows) {
  const statuses = rows.map((row) => costConfidence(row));
  if (statuses.includes("Quote Expired")) return "Quote Expired";
  if (statuses.includes("New Material / Sourcing Needed")) return "New Material / Sourcing Needed";
  if (statuses.includes("Pending Approval")) return "Pending Approval";
  if (statuses.includes("Quote Pending")) return "Quote Pending";
  if (statuses.includes("Reference Estimate")) return "Reference Estimate";
  return "Confirmed Cost";
}

function managerLineStageAggregates(projectFilter = "") {
  const projects = projectFilter ? [projectFilter] : allProjectCodes();
  return projects.flatMap((project) => STAGES.flatMap((stage) => {
    const rows = stageDemandRows(project, stage);
    const groups = new Map();
    rows.forEach((row) => {
      const lineDepartment = managerLineDepartment(row);
      const key = `${project}-${stage}-${lineDepartment}`;
      if (!groups.has(key)) {
        groups.set(key, {
          project,
          stage,
          lineDepartment,
          rows: [],
          itemCount: 0,
          plannedDemand: 0,
          carryover: 0,
          needToBuy: 0,
          totalQty: 0,
          estimatedAmount: 0,
          riskItems: 0,
          costConfidence: "Quote Pending",
        });
      }
      const group = groups.get(key);
      group.rows.push(row);
      group.itemCount += 1;
      group.plannedDemand += row.metrics.baselineDemand ?? 0;
      group.carryover += row.metrics.carryoverStock;
      group.needToBuy += row.metrics.suggestedNewBuy;
      group.totalQty += clampQty(row[stage]);
      group.estimatedAmount += effectiveUnitPrice(row) ? clampQty(row[stage]) * effectiveUnitPrice(row) : 0;
      if (!["OK", "Need Purchase"].includes(row.metrics.riskStatus)) group.riskItems += 1;
    });
    return [...groups.values()].map((group) => ({
      ...group,
      costConfidence: groupCostConfidence(group.rows),
    }));
  }));
}

function managerStageAggregates(projectFilter = "") {
  const projects = projectFilter ? [projectFilter] : allProjectCodes();
  return projects.flatMap((project) => STAGES.map((stage) => stageAggregate(project, stage)));
}

function renderManagerStageTracking() {
  syncManagerProgressFilters();
  const rows = managerProgressRows();
  const summaryHost = document.getElementById("managerStageSummary")?.parentElement;
  if (summaryHost && !document.getElementById("managerProgressBudgetToolbar")) {
    const toolbar = document.createElement("div");
    toolbar.id = "managerProgressBudgetToolbar";
    toolbar.className = "page-toolbar compact-toolbar manager-progress-budget-toolbar";
    toolbar.innerHTML = `
      <label>
        Request Type
        <select id="managerProgressRequestTypeFilter">
          <option value="">All requests</option>
          <option value="temporary">Temporary Budget</option>
          <option value="standard">Standard Demand</option>
        </select>
      </label>
      <label>
        Quote Validity
        <select id="managerProgressQuoteValidityFilter">
          <option value="">All quote status</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired / Requote Required</option>
          <option value="missing">Missing validity</option>
          <option value="valid">Valid</option>
        </select>
      </label>
    `;
    summaryHost.insertBefore(toolbar, document.getElementById("managerStageSummary"));
  }
  const summaryTarget = document.getElementById("managerStageSummary");
  if (summaryTarget) {
    const waitingDeptDri = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Dept DRI").length;
    const waitingBudget = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Budget Approver").length;
    const waitingOm = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "OM Purchasing").length;
    const waitingPas = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "PAS / Bidding").length;
    const waitingRequester = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Requester").length;
    const buyerHandoff = rows.filter((row) => managerProgressPendingOwnerForGroup(row) === "Buyer Handoff").length;
    const overSla = rows.filter((row) => {
      const days = managerProgressDaysPending(row);
      return days !== null && days > OM_INTERNAL_SLA_DAYS;
    }).length;
    const expired = rows.filter((row) => managerProgressQuoteStatusForGroup(row) === "Expired / Requote Required").length;
    summaryTarget.innerHTML = summaryCardsHtml([
      { label: "Waiting Dept DRI", value: waitingDeptDri, helper: "Requester submit review", variant: waitingDeptDri ? "hero" : "" },
      { label: "Waiting Budget", value: waitingBudget, helper: "Budget Approver decision" },
      { label: "Waiting OM", value: waitingOm, helper: "PAS no / quote / export" },
      { label: "Waiting PAS", value: waitingPas, helper: "Bidding result not returned" },
      { label: "Waiting Requester", value: waitingRequester, helper: "Need confirm / revise" },
      { label: "Buyer Handoff", value: buyerHandoff, helper: "Buyer owns PR / PO after OM export" },
      { label: "Over SLA", value: overSla, helper: `>${OM_INTERNAL_SLA_DAYS}d in current stage`, variant: overSla ? "warning" : "" },
      { label: "Expired Quote", value: expired, helper: "Requote required", variant: expired ? "warning" : "" },
    ]);
  }

  const body = document.getElementById("managerStageRows");
  if (!body) return;
  const headRow = body.closest("table")?.querySelector("thead tr");
  if (headRow) {
    headRow.innerHTML = `
      <th>Year Project</th>
      <th>Project</th>
      <th>Item</th>
      <th>Department</th>
      <th>Quantity</th>
      <th>Submitted / Received Date</th>
      <th>Pending Owner</th>
      <th>Current Stage</th>
      <th>Days Pending</th>
      <th>Quote Status</th>
      <th>Next Action</th>
      <th>Pending / Risk Reason</th>
      <th>Detail</th>`;
  }
  body.innerHTML = rows.length
    ? rows.map((row) => {
      const pendingOwner = managerProgressPendingOwnerForGroup(row);
      const currentStage = managerProgressCurrentStageForGroup(row);
      const receivedAt = (row.rows || []).map(managerProgressSubmittedAt).filter(Boolean).sort()[0] || "";
      const quoteStatus = managerProgressQuoteStatusForGroup(row);
      const validUntilText = [...new Set(row.rows.map((raw) => progressQuoteValidity(raw).validUntil || omQuoteValidUntil(raw)).filter(Boolean))].slice(0, 2).join(" / ");
      return `
      <tr class="${row.lateRows || row.pendingRows || row.notArrivedRows ? "pivot-risk-row" : ""}">
        <td>${row.yearProject}</td>
        <td>${row.project}</td>
        <td><div class="item-primary">${row.item}</div><div class="reason-text">${row.rows.length} raw row${row.rows.length === 1 ? "" : "s"}</div></td>
        <td>${row.department}</td>
        <td><strong>${row.quantity}</strong></td>
        <td><strong>${receivedAt ? compactDateTime(receivedAt) : "-"}</strong><div class="reason-text">${receivedAt ? "First submitted / received" : "No timestamp"}</div></td>
        <td><span class="status-pill ${statusClass(pendingOwner)}">${pendingOwner}</span><div class="reason-text">Current blocker</div></td>
        <td><span class="status-pill ${statusClass(currentStage)}">${currentStage}</span><div class="reason-text">${row.department || "-"}</div></td>
        <td>${managerProgressAgingCell(row)}</td>
        <td><span class="status-pill ${statusClass(quoteStatus)}">${quoteStatus}</span><div class="reason-text">${validUntilText || "No valid-until date yet"}</div></td>
        <td><strong>${managerProgressNextActionForGroup(row)}</strong><div class="reason-text">${row.rows.length} source row${row.rows.length === 1 ? "" : "s"}</div></td>
        <td>${pendingReasonCell(row.pendingReasons)}</td>
        <td><button class="mini return" data-manager-progress-detail="${row.keyId}">Detail</button></td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="13" class="empty-cell">No progress rows match the selected filters.</td></tr>`;
}

function managerQuantitySourceRows() {
  return requests.filter((row) => {
    const status = row.status || "";
    return status
      && !["Draft", "Rejected", USER_CANCELLED_REQUEST, "Cancelled"].includes(status)
      && !isSupersededRequest(row)
      && stationBreakdownHasDemand(row);
  });
}

function managerQuantityFlattenRows(rawRows = managerQuantitySourceRows()) {
  return rawRows.flatMap((request) => stationBreakdownRowsForDetail(request)
    .flatMap((breakdown) => {
      if (isLongFormStationBreakdown(breakdown)) {
        const qty = stationBreakdownRowTotal(breakdown);
        const demandType = demandTypeFor(breakdown);
        return qty > 0 ? [{
          request,
          demandType,
          phase: stationBreakdownPhaseKey(breakdown),
          station: demandType === DEMAND_TYPE_MFG ? (breakdown.station || STATION_MASTER[0]) : "",
          demandUnit: demandType === DEMAND_TYPE_MFG ? "" : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
          qty,
          remark: breakdown.remark || "",
        }] : [];
      }
      return STAGES
        .map((stage) => ({
          request,
          demandType: demandTypeFor(breakdown),
          phase: stage,
          station: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? (breakdown.station || STATION_MASTER[0]) : "",
          demandUnit: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? "" : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
          qty: clampQty(breakdown[stage]),
          remark: breakdown.remark || "",
        }))
        .filter((item) => item.qty > 0);
    }));
}

function managerQuantityEntryUnit(entry = {}) {
  if (demandTypeFor(entry) === DEMAND_TYPE_MFG) return "MFG";
  return normalizeQuantityDashboardUnit(entry.demandUnit) || entry.demandUnit || "";
}

function syncManagerQuantityFilters() {
  const entries = managerQuantityFlattenRows();
  const controls = [
    ["managerQuantityProjectFilter", "All projects", (entry) => entry.request.project],
    ["managerQuantityItemFilter", "All items", (entry) => entry.request.name],
    ["managerQuantityPhaseFilter", "All phases", (entry) => entry.phase],
    ["managerQuantityStationFilter", "All stations", (entry) => entry.station],
    ["managerQuantityUnitFilter", "All demand units", (entry) => managerQuantityEntryUnit(entry)],
  ];
  controls.forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    const unsortedValues = [...new Set(entries.map(getter).filter(Boolean))];
    const values = id === "managerQuantityPhaseFilter"
      ? STAGES.filter((stage) => unsortedValues.includes(stage))
      : id === "managerQuantityStationFilter"
        ? STATION_MASTER.filter((station) => unsortedValues.includes(station))
        : id === "managerQuantityUnitFilter"
          ? DEMAND_UNIT_OPTIONS.filter((unit) => unsortedValues.includes(unit))
          : unsortedValues.sort((left, right) => String(left).localeCompare(String(right)));
    select.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => (
      id === "managerQuantityPhaseFilter"
        ? `<option value="${value}" ${value === currentValue ? "selected" : ""}>${STAGE_LABELS[value]}</option>`
        : optionHtml(value, currentValue)
    )).join("")}`;
    if (currentValue && values.includes(currentValue)) select.value = currentValue;
  });
}

function managerQuantityFilters() {
  return {
    project: document.getElementById("managerQuantityProjectFilter")?.value || "",
    item: document.getElementById("managerQuantityItemFilter")?.value || "",
    phase: document.getElementById("managerQuantityPhaseFilter")?.value || "",
    station: document.getElementById("managerQuantityStationFilter")?.value || "",
    demandUnit: document.getElementById("managerQuantityUnitFilter")?.value || "",
    sort: document.getElementById("managerQuantitySortFilter")?.value || "",
  };
}

function managerQuantityFilteredEntries() {
  const filters = managerQuantityFilters();
  return managerQuantityFlattenRows().filter((entry) =>
    (!filters.project || entry.request.project === filters.project)
    && (!filters.item || entry.request.name === filters.item)
    && (!filters.phase || entry.phase === filters.phase)
    && (!filters.station || entry.station === filters.station)
    && (!filters.demandUnit || managerQuantityEntryUnit(entry) === filters.demandUnit)
  );
}

function normalizeQuantityDashboardUnit(rawUnit = "") {
  const unit = canonicalDemandUnit(rawUnit);
  const normalized = normalize(unit).replace(/[\s_-]+/g, "");
  if (normalized === "mfg" || normalized === "mfgnong") return "MFG";
  if (normalized === "te" || normalized === "fatte" || normalized === "fatpte") return "FATP TE";
  if (normalized === "iqc" || normalized === "fatiqc" || normalized === "fatpiqc") return "FATP IQC";
  if (normalized === "pqe" || normalized === "fatpqe" || normalized === "fatppqe") return "FATP PQE";
  if (normalized === "wh" || normalized === "ggwh") return "WH";
  if (normalized === "qlab" || normalized === "qalab") return "Q-LAB";
  if (normalized === "rel") return "REL";
  if (normalized === "eng1") return "ENG1";
  if (normalized === "eng2") return "ENG2";
  if (normalized === "eng3") return "ENG3";
  if (normalized === "it") return "IT";
  if (normalized === "fac" || normalized === "facility") return "FAC";
  return "";
}

function quantityDashboardHeatClass(value, maxValue) {
  if (!value) return "empty";
  const ratio = maxValue ? value / maxValue : 0;
  if (ratio >= 0.75) return "heat-critical";
  if (ratio >= 0.45) return "heat-high";
  if (ratio >= 0.2) return "heat-mid";
  return "heat-low";
}

function managerUnitSplitSettings() {
  const phaseControl = document.getElementById("managerUnitSplitPhase");
  const phase = STAGES.includes(phaseControl?.value) ? phaseControl.value : (managerQuantityFilters().phase || STAGES[0]);
  if (phaseControl && phaseControl.value !== phase) phaseControl.value = phase;
  const lineCount = Math.max(1, clampQty(document.getElementById("managerUnitSplitLineCount")?.value || 1));
  const viewMode = document.getElementById("managerUnitSplitViewMode")?.value === "amount" ? "amount" : "qty";
  return { phase, lineCount, viewMode };
}

function unitSplitDisplayValue(qty, unitPrice, lineCount, viewMode) {
  if (!qty) return "";
  if (viewMode === "amount") return unitPrice ? formatMoneyFromUsd(qty * unitPrice * lineCount) : "Price pending";
  return qty;
}

function managerQuantityUnitDashboardData() {
  const filters = managerQuantityFilters();
  const { phase, lineCount, viewMode } = managerUnitSplitSettings();
  const entries = managerQuantityFlattenRows().filter((entry) =>
    (!filters.project || entry.request.project === filters.project)
    && (!filters.item || entry.request.name === filters.item)
    && entry.phase === phase
    && (!filters.station || entry.station === filters.station)
    && (!filters.demandUnit || managerQuantityEntryUnit(entry) === filters.demandUnit)
  );
  const rows = new Map();
  const columnTotals = Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, { qty: 0, lineCount: 0 }]));
  const columnAmountTotals = Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, 0]));
  const unmapped = new Map();

  entries.forEach((entry) => {
    const groupKey = managerQuantityGroupKey(entry.request);
    if (!rows.has(groupKey)) {
      rows.set(groupKey, {
        key: groupKey,
        project: entry.request.project || "-",
        item: entry.request.name || "-",
        spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
        priceCandidates: [],
        unitPrice: 0,
        priceSource: "Price Pending",
        totalQty: 0,
        lineCount: 0,
        cells: Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, { qty: 0, lineCount: 0 }])),
      });
    }
    const row = rows.get(groupKey);
    row.priceCandidates.push(managerQuantityPriceCandidate(entry.request));
    row.totalQty += entry.qty;
    row.lineCount += 1;
    const unit = managerQuantityEntryUnit(entry);
    if (!unit) {
      const key = entry.demandUnit || entry.demandType || "Blank";
      const current = unmapped.get(key) || { qty: 0, lineCount: 0 };
      current.qty += entry.qty;
      current.lineCount += 1;
      unmapped.set(key, current);
      return;
    }
    row.cells[unit].qty += entry.qty;
    row.cells[unit].lineCount += 1;
    columnTotals[unit].qty += entry.qty;
    columnTotals[unit].lineCount += 1;
  });

  const rowList = [...rows.values()].map((row) => {
    const price = managerQuantityResolvePrice(row.priceCandidates);
    const resolved = { ...row, unitPrice: price.unitPrice, priceSource: price.source };
    if (price.unitPrice) {
      QUANTITY_DASHBOARD_UNITS.forEach((unit) => {
        columnAmountTotals[unit] += resolved.cells[unit].qty * price.unitPrice * lineCount;
      });
    }
    return resolved;
  }).sort((left, right) => right.totalQty - left.totalQty || `${left.project} ${left.item}`.localeCompare(`${right.project} ${right.item}`));
  const maxQty = Math.max(0, ...rowList.flatMap((row) => QUANTITY_DASHBOARD_UNITS.map((unit) => row.cells[unit].qty)));
  const maxAmount = Math.max(0, ...rowList.flatMap((row) => QUANTITY_DASHBOARD_UNITS.map((unit) => row.unitPrice ? row.cells[unit].qty * row.unitPrice * lineCount : 0)));
  return { rows: rowList, columnTotals, columnAmountTotals, unmapped, lineCount, viewMode, phase, maxValue: viewMode === "amount" ? maxAmount : maxQty };
}

function managerQuantityTopItems(limit = 8) {
  const filters = managerQuantityFilters();
  const groups = new Map();
  managerQuantityFlattenRows()
    .filter((entry) =>
      (!filters.project || entry.request.project === filters.project)
      && (!filters.phase || entry.phase === filters.phase)
      && (!filters.station || entry.station === filters.station)
      && (!filters.demandUnit || managerQuantityEntryUnit(entry) === filters.demandUnit)
    )
    .forEach((entry) => {
      const key = entry.request.name || "-";
      if (!groups.has(key)) {
        groups.set(key, {
          item: key,
          project: entry.request.project || "-",
          spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          qty: 0,
          lines: 0,
        });
      }
      const group = groups.get(key);
      group.qty += entry.qty;
      group.lines += 1;
    });
  return [...groups.values()]
    .sort((left, right) => right.qty - left.qty || left.item.localeCompare(right.item))
    .slice(0, limit);
}

function htmlAttr(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function htmlText(value = "", fallback = "-") {
  return htmlAttr(detailValue(value, fallback));
}

function setManagerQuantitySelectValue(id, value) {
  const select = document.getElementById(id);
  if (!select) return;
  const option = [...select.options].find((item) => item.value === value);
  if (option || !value) select.value = value;
}

function applyManagerQuantityDashboardFilter(phase = "", unit = "") {
  const dashboardUnit = unit ? QUANTITY_DASHBOARD_UNITS.includes(unit) ? unit : normalizeQuantityDashboardUnit(unit) : "";
  setManagerQuantitySelectValue("managerQuantityPhaseFilter", phase);
  if (dashboardUnit) {
    const select = document.getElementById("managerQuantityUnitFilter");
    const matchingOption = [...(select?.options || [])].find((option) => normalizeQuantityDashboardUnit(option.value) === dashboardUnit);
    if (matchingOption) select.value = matchingOption.value;
  } else {
    setManagerQuantitySelectValue("managerQuantityUnitFilter", "");
  }
  selectedManagerQuantityKeyId = "";
  renderManagerQuantityMatrix();
}

function applyManagerQuantityDashboardCellFilter(item = "", phase = "", unit = "") {
  if (item) setManagerQuantitySelectValue("managerQuantityItemFilter", item);
  applyManagerQuantityDashboardFilter(phase, unit);
}

function applyManagerQuantityItemFilter(item = "") {
  setManagerQuantitySelectValue("managerQuantityItemFilter", item);
  selectedManagerQuantityKeyId = "";
  renderManagerQuantityMatrix();
}

function renderManagerQuantityUnitDashboard() {
  const head = document.getElementById("managerQuantityUnitDashboardHead");
  const body = document.getElementById("managerQuantityUnitDashboardRows");
  const foot = document.getElementById("managerQuantityUnitDashboardFoot");
  const meta = document.getElementById("managerQuantityUnitDashboardMeta");
  const unmappedTarget = document.getElementById("managerQuantityUnitUnmapped");
  if (!head || !body || !foot) return;
  const filters = managerQuantityFilters();
  const { rows, columnTotals, columnAmountTotals, unmapped, maxValue, lineCount, viewMode, phase } = managerQuantityUnitDashboardData();
  head.innerHTML = `
    <tr>
      <th class="unit-dashboard-item-head">Item</th>
      <th class="unit-dashboard-spec-head">Spec / Price</th>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `
        <th>
          <button class="unit-dashboard-head-button ${normalizeQuantityDashboardUnit(filters.demandUnit) === unit ? "active" : ""}" type="button" data-quantity-dashboard-unit="${unit}">${unit}</button>
        </th>`).join("")}
      <th>Total</th>
    </tr>`;
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <th>
        <button class="unit-dashboard-item-button" type="button" data-quantity-dashboard-item="${htmlAttr(row.item)}" title="${htmlAttr(`${row.project} / ${row.item}`)}">
          <strong>${row.item}</strong>
          <span>${row.project} · ${row.totalQty} qty · ${row.lineCount} lines</span>
        </button>
      </th>
      <td class="unit-dashboard-spec-cell" title="${htmlAttr(row.spec)}">
        <div>${row.spec}</div>
        <span>${row.unitPrice ? `${formatMoneyFromUsd(row.unitPrice)} · ${row.priceSource}` : "Price pending"}</span>
      </td>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => {
        const cell = row.cells[unit];
        const comparableValue = viewMode === "amount" && row.unitPrice ? cell.qty * row.unitPrice * lineCount : cell.qty;
        return `
          <td>
            <button class="unit-dashboard-cell ${quantityDashboardHeatClass(comparableValue, maxValue)}" type="button" data-quantity-dashboard-item="${htmlAttr(row.item)}" data-quantity-dashboard-phase="${phase}" data-quantity-dashboard-unit="${unit}">
              <strong>${unitSplitDisplayValue(cell.qty, row.unitPrice, lineCount, viewMode)}</strong>
              <span>${cell.lineCount ? `${cell.lineCount} lines` : ""}</span>
            </button>
          </td>`;
      }).join("")}
      <td class="unit-dashboard-total">
        <strong>${unitSplitDisplayValue(row.totalQty, row.unitPrice, lineCount, viewMode)}</strong>
        <span>${row.lineCount ? `${row.lineCount} lines` : ""}</span>
      </td>
    </tr>`).join("") : `
    <tr>
      <td class="unit-dashboard-empty" colspan="${QUANTITY_DASHBOARD_UNITS.length + 3}">
        <strong>No unit split rows match current filters.</strong>
        <span>Clear filters or choose another phase to restore the dashboard.</span>
      </td>
    </tr>`;
  foot.innerHTML = `
    <tr>
      <th colspan="2">Total</th>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `
        <td class="unit-dashboard-total">
          <strong>${viewMode === "amount" ? (columnAmountTotals[unit] ? formatMoneyFromUsd(columnAmountTotals[unit]) : "") : (columnTotals[unit].qty || "")}</strong>
          <span>${columnTotals[unit].lineCount ? `${columnTotals[unit].lineCount} lines` : ""}</span>
        </td>`).join("")}
      <td class="unit-dashboard-total grand">
        <strong>${viewMode === "amount" ? (Object.values(columnAmountTotals).reduce((sum, amount) => sum + amount, 0) ? formatMoneyFromUsd(Object.values(columnAmountTotals).reduce((sum, amount) => sum + amount, 0)) : "") : rows.reduce((sum, item) => sum + item.totalQty, 0) || ""}</strong>
        <span>${rows.reduce((sum, item) => sum + item.lineCount, 0)} lines</span>
      </td>
    </tr>`;
  if (meta) meta.textContent = `${STAGE_LABELS[phase]} · ${lineCount} line count · ${viewMode === "amount" ? "Amount" : "Qty"} view`;
  const title = document.querySelector(".quantity-unit-dashboard-panel h3");
  const helper = document.querySelector(".quantity-unit-dashboard-panel .panel-subcopy");
  if (title) title.textContent = "Unit Split Dashboard";
  if (helper) helper.textContent = `Item x demand unit · ${STAGE_LABELS[phase]} · values are ${viewMode === "amount" ? "Qty x Unit Price x Line Count" : "submitted demand qty"}.`;
  if (unmappedTarget) {
    const unmappedText = [...unmapped.entries()].map(([unit, value]) => `${unit}: ${value.qty} (${value.lineCount} lines)`).join(" / ");
    unmappedTarget.hidden = !unmappedText;
    unmappedTarget.textContent = unmappedText ? `Unmapped Units: ${unmappedText}` : "";
  }
}

function managerDemandCostFilters() {
  const phaseValue = document.getElementById("managerDemandCostPhaseFilter")?.value || "";
  return {
    project: document.getElementById("managerDemandCostProjectFilter")?.value || "",
    phase: STAGES.includes(phaseValue) ? phaseValue : "",
    lineCount: Math.max(1, clampQty(document.getElementById("managerDemandCostLineCount")?.value || 1)),
    viewMode: document.getElementById("managerDemandCostViewMode")?.value || "amount",
  };
}

function syncManagerDemandCostFilters() {
  const entries = managerQuantityFlattenRows();
  [
    ["managerDemandCostProjectFilter", "All projects", (entry) => entry.request.project],
    ["managerDemandCostPhaseFilter", "", (entry) => entry.phase],
  ].forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value || "";
    const rawValues = [...new Set(entries.map(getter).filter(Boolean))];
    const values = id === "managerDemandCostPhaseFilter"
      ? STAGES.filter((stage) => rawValues.includes(stage) || stage === STAGES[0])
      : rawValues.sort((left, right) => String(left).localeCompare(String(right)));
    const allOption = id === "managerDemandCostPhaseFilter"
      ? `<option value="">All stages</option>`
      : (allLabel ? `<option value="">${allLabel}</option>` : "");
    select.innerHTML = `${allOption}${values.map((value) => (
      id === "managerDemandCostPhaseFilter"
        ? `<option value="${value}" ${value === currentValue ? "selected" : ""}>${STAGE_LABELS[value]}</option>`
        : optionHtml(value, currentValue)
    )).join("")}`;
    if (values.includes(currentValue)) select.value = currentValue;
  });
}

function managerDemandCostRows() {
  const filters = managerDemandCostFilters();
  const itemGroups = new Map();
  managerQuantityFlattenRows()
    .filter((entry) =>
      (!filters.project || entry.request.project === filters.project)
      && (!filters.phase || entry.phase === filters.phase)
    )
    .forEach((entry) => {
      const unit = managerQuantityEntryUnit(entry);
      const key = managerQuantityGroupKey(entry.request);
      if (!itemGroups.has(key)) {
        const price = managerQuantityResolvePrice([managerQuantityPriceCandidate(entry.request)]);
        itemGroups.set(key, {
          key,
          keyId: key.replace(/[^a-z0-9]+/gi, "-"),
          project: entry.request.project || "-",
          item: entry.request.name || "-",
          cnEngName: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          vnName: entry.request.vnName || entry.request.localName || "-",
          spec: userVisibleItemDetail(entry.request) || itemDetail(entry.request) || "-",
          unitTotals: Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unitName) => [unitName, 0])),
          phaseUnitTotals: Object.fromEntries(STAGES.map((stage) => [stage, Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unitName) => [unitName, 0]))])),
          qty: 0,
          unitPrice: price.unitPrice,
          priceSource: price.source,
          amount: 0,
          pricePending: price.unitPrice ? 0 : 1,
        });
      }
      const item = itemGroups.get(key);
      if (QUANTITY_DASHBOARD_UNITS.includes(unit)) {
        item.unitTotals[unit] += entry.qty;
        if (item.phaseUnitTotals[entry.phase]) item.phaseUnitTotals[entry.phase][unit] += entry.qty;
      }
      item.qty += entry.qty;
      if (item.unitPrice) item.amount += item.unitPrice * entry.qty;
    });
  return [...itemGroups.values()]
    .sort((left, right) => right.qty - left.qty || left.item.localeCompare(right.item));
}

function managerDemandCostUnitTotals(rows, filters) {
  const unitTotals = Object.fromEntries(QUANTITY_DASHBOARD_UNITS.map((unit) => [unit, {
    qty: 0,
    originalQty: 0,
    carryoverQty: 0,
    effectiveQty: 0,
    amount: 0,
    originalAmount: 0,
    savingAmount: 0,
    effectiveAmount: 0,
    pricePending: 0,
  }]));
  rows.forEach((row) => {
    QUANTITY_DASHBOARD_UNITS.forEach((unit) => {
      const impact = managerDemandCostCellImpact(row, unit, filters);
      if (!impact.originalQty && !impact.carryoverQty) return;
      unitTotals[unit].qty += impact.effectiveQty;
      unitTotals[unit].originalQty += impact.originalQty;
      unitTotals[unit].carryoverQty += impact.carryoverQty;
      unitTotals[unit].effectiveQty += impact.effectiveQty;
      unitTotals[unit].amount += impact.effectiveAmount;
      unitTotals[unit].originalAmount += impact.originalAmount;
      unitTotals[unit].savingAmount += impact.savingAmount;
      unitTotals[unit].effectiveAmount += impact.effectiveAmount;
      if (!row.unitPrice && impact.originalQty) unitTotals[unit].pricePending += 1;
    });
  });
  return unitTotals;
}

function managerDemandCostTotalDisplay(total, viewMode) {
  if (!total || !total.originalQty) return "";
  if (viewMode === "amount") {
    return total.effectiveAmount ? formatCompactCurrencyFromUsd(total.effectiveAmount) : "Price pending";
  }
  return total.effectiveQty;
}

function managerCarryoverRows() {
  return window.ProcurementCarryover?.readLedger?.() || [];
}

function managerCarryoverEventUnit(row) {
  const value = normalizeQuantityDashboardUnit(row.stationOrUnit);
  if (QUANTITY_DASHBOARD_UNITS.includes(value)) return value;
  if (STATION_MASTER.includes(row.stationOrUnit)) return "MFG";
  return value || "MFG";
}

function managerCarryoverPhaseKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_.-]+/g, "");
  const phaseAlias = {
    p10: "p10",
    p11: "p11",
    evt: "evt",
    dvt: "dvt",
    pvt: "pvt",
    mp: "mp",
  };
  return phaseAlias[normalized] || "";
}

function managerCarryoverIsApplied(row) {
  return row?.status === "Applied" && row?.reviewStatus !== "Pending DRI" && row?.reviewStatus !== "Pending Dept DRI";
}

function managerCarryoverNeedsDriReview(row) {
  return row?.reviewStatus === "Pending DRI"
    || row?.reviewStatus === "Pending Dept DRI"
    || row?.status === "Requester Candidate"
    || row?.status === "Carryover Candidate"
    || row?.status === "Requester Applied"
    || row?.status === "User Applied"
    || row?.status === "Pending DRI";
}

function managerCarryoverStatusBucket(rows = []) {
  if (rows.some(managerCarryoverIsApplied)) return "applied";
  if (rows.some(managerCarryoverNeedsDriReview)) return "pending-dri";
  if (rows.some((row) => row.status === "Pending Review" || row.status === "Pending DRI" || row.reviewStatus === "Pending DRI")) return "pending";
  if (rows.some((row) => row.status === "Rejected")) return "rejected";
  return "";
}

function managerCarryoverMatchesScope(row, { project = "", phase = "", item = "", unit = "" } = {}) {
  if (project && row.project !== project) return false;
  if (phase && managerCarryoverPhaseKey(row.phase) !== managerCarryoverPhaseKey(phase)) return false;
  if (item && normalize(row.item) !== normalize(item)) return false;
  if (unit && managerCarryoverEventUnit(row) !== unit) return false;
  return true;
}

function managerCarryoverRowsForScope(scope = {}, includePending = true) {
  return managerCarryoverRows().filter((row) => {
    if (!includePending && !managerCarryoverIsApplied(row)) return false;
    return managerCarryoverMatchesScope(row, scope);
  });
}

function managerCarryoverQtyForScope(scope = {}) {
  return managerCarryoverRowsForScope(scope, false)
    .reduce((sum, row) => sum + clampQty(row.carryoverQty), 0);
}

function managerCarryoverFlowLabels(rows = []) {
  return [...new Set(rows.map((row) => `${row.sourceLine || "Line"} → ${row.targetLine || "Line"}`))]
    .filter(Boolean);
}

function managerDemandCostCellQty(row, unit, filters = managerDemandCostFilters()) {
  if (!filters.phase) return row.unitTotals?.[unit] || 0;
  return row.phaseUnitTotals?.[filters.phase]?.[unit] || 0;
}

function managerDemandCostAmount(row, qty, lineCount = 1) {
  return row.unitPrice ? row.unitPrice * qty * lineCount : 0;
}

function managerDemandCostCellImpact(row, unit, filters) {
  const baseQty = managerDemandCostCellQty(row, unit, filters);
  const carryoverRows = managerCarryoverRowsForScope({
    project: filters.project,
    phase: filters.phase,
    item: row.item,
    unit,
  }, true);
  const appliedRows = carryoverRows.filter(managerCarryoverIsApplied);
  const requestedCarryoverQty = appliedRows.reduce((sum, item) => sum + clampQty(item.carryoverQty), 0);
  const unitPrice = row.unitPrice || 0;
  const moduleImpact = demandCostDashboardModule()?.calculateCarryoverCostImpact?.({
    submittedQty: baseQty,
    lineCount: filters.lineCount,
    carryoverQty: requestedCarryoverQty,
    unitPrice,
    status: appliedRows.length ? "Applied" : managerCarryoverStatusBucket(carryoverRows),
  }) || {};
  return {
    ...moduleImpact,
    baseQty,
    requestedCarryoverQty,
    flowLabels: managerCarryoverFlowLabels(carryoverRows),
    status: managerCarryoverStatusBucket(carryoverRows),
    carryoverRows,
  };
}

function managerDemandCostOverallImpact(rows, filters) {
  return rows.reduce((acc, row) => {
    QUANTITY_DASHBOARD_UNITS.forEach((unit) => {
      const impact = managerDemandCostCellImpact(row, unit, filters);
      acc.originalQty += impact.originalQty;
      acc.carryoverQty += impact.carryoverQty;
      acc.effectiveQty += impact.effectiveQty;
      acc.originalAmount += impact.originalAmount;
      acc.savingAmount += impact.savingAmount;
      acc.effectiveAmount += impact.effectiveAmount;
    });
    return acc;
  }, {
    originalQty: 0,
    carryoverQty: 0,
    effectiveQty: 0,
    originalAmount: 0,
    savingAmount: 0,
    effectiveAmount: 0,
  });
}

function managerDemandCostDisplayValue(row, qty, viewMode, lineCount = 1) {
  if (!qty) return "";
  if (viewMode === "amount") return row.unitPrice ? formatCompactCurrencyFromUsd(managerDemandCostAmount(row, qty, lineCount)) : "Price pending";
  return qty;
}

function managerDemandCostImpactTitle(impact) {
  const flow = impact.flowLabels?.length ? ` / Flow: ${impact.flowLabels.join(" / ")}` : "";
  const pendingQty = (impact.carryoverRows || [])
    .filter((row) => managerCarryoverNeedsDriReview(row) && !managerCarryoverIsApplied(row))
    .reduce((sum, row) => sum + clampQty(row.carryoverQty), 0);
  const pending = pendingQty ? ` / Pending candidate ${pendingQty} qty, not counted` : "";
  return `Original Qty ${impact.originalQty} / Confirmed Carryover -${impact.carryoverQty} / Effective Qty ${impact.effectiveQty} / Original Cost ${formatMoneyFromUsd(impact.originalAmount)} / Confirmed Saving ${formatMoneyFromUsd(impact.savingAmount)} / Effective Cost ${formatMoneyFromUsd(impact.effectiveAmount)}${pending}${flow}`;
}

function managerDemandCostCellClass(impact, baseClass = "") {
  const carryoverClassByStatus = {
    applied: "carryover-cell-applied",
    "pending-dri": "carryover-cell-pending-dri",
    pending: "carryover-cell-pending",
    rejected: "carryover-cell-rejected",
  };
  const status = carryoverClassByStatus[impact.status] || "";
  return [baseClass, status].filter(Boolean).join(" ");
}

function managerDemandCostMainValue(impact, viewMode, hasPrice = true) {
  if (!impact.originalQty && !impact.carryoverQty) return "";
  const pair = demandCostDashboardModule()?.costQtyDisplayPair?.({
    viewMode,
    effectiveQty: impact.effectiveQty,
    effectiveAmount: impact.effectiveAmount,
    hasPrice,
  });
  if (pair) return viewMode === "amount" && hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : String(pair.main);
  if (viewMode === "amount") return hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : "Price pending";
  return String(impact.effectiveQty);
}

function managerDemandCostSubValue(impact, viewMode, hasPrice = true) {
  if (!impact.originalQty && !impact.carryoverQty) return "";
  const pair = demandCostDashboardModule()?.costQtyDisplayPair?.({
    viewMode,
    effectiveQty: impact.effectiveQty,
    effectiveAmount: impact.effectiveAmount,
    hasPrice,
  });
  if (pair) return viewMode === "qty" && hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : String(pair.sub);
  if (viewMode === "amount") return `${impact.effectiveQty} qty`;
  return hasPrice ? formatCompactCurrencyFromUsd(impact.effectiveAmount) : "Price pending";
}

function renderManagerDemandCostValue(impact, viewMode, { hasPrice = true, buttonAttrs = "" } = {}) {
  const main = managerDemandCostMainValue(impact, viewMode, hasPrice);
  const sub = managerDemandCostSubValue(impact, viewMode, hasPrice);
  const badge = impact.status === "applied"
    ? `<span class="saved-badge">Saved</span>`
    : impact.status === "pending" || impact.status === "pending-dri"
      ? `<span class="saved-badge pending">${impact.status === "pending-dri" ? "Pending DRI" : "Pending"}</span>`
      : impact.status === "rejected"
        ? `<span class="saved-badge rejected">Rejected</span>`
        : "";
  const valueHtml = `
    <span class="demand-cost-cell-main">${main || "-"}</span>
    ${sub ? `<span class="demand-cost-cell-sub">${sub}</span>` : ""}
    ${badge}`;
  return buttonAttrs
    ? `<button type="button" class="demand-cost-cell-btn" ${buttonAttrs}>${valueHtml}</button>`
    : `<span class="demand-cost-cell-value">${valueHtml}</span>`;
}

function managerDemandCostScopeLabel(filters) {
  return [
    filters.project || "All projects",
    filters.phase ? STAGE_LABELS[filters.phase] : "All stages",
    `${filters.lineCount} line count`,
  ].join(" / ");
}

function managerDemandCostSavingPercent(impact) {
  if (!impact.originalAmount) return "0%";
  return `${((impact.savingAmount / impact.originalAmount) * 100).toFixed(1)}%`;
}

function renderManagerDemandCostCarryoverCompare(impact, filters) {
  const container = document.getElementById("managerDemandCostCarryoverCompare");
  if (!container) return;
  const hasSaving = impact.savingAmount > 0;
  container.innerHTML = `
    <div class="carryover-cost-strip" aria-label="Carryover cost compare">
      <div class="carryover-cost-card">
        <span>Original Cost</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(impact.originalAmount))}">${formatCompactCurrencyFromUsd(impact.originalAmount)}</strong>
        <small>Before applied carryover</small>
      </div>
      <div class="carryover-cost-card saving">
        <span>Confirmed Carryover Saving</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(impact.savingAmount))}">-${formatCompactCurrencyFromUsd(impact.savingAmount)}</strong>
        <small>${hasSaving ? `${managerDemandCostSavingPercent(impact)} saved` : "No confirmed carryover"}</small>
      </div>
      <div class="carryover-cost-card effective">
        <span>Effective Cost</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(impact.effectiveAmount))}">${formatCompactCurrencyFromUsd(impact.effectiveAmount)}</strong>
        <small>After applied carryover</small>
      </div>
    </div>`;
}

function managerCarryoverMovedItemsSummary(rows) {
  const activeRows = rows
    .filter((row) => row.status !== "Rejected")
    .sort((a, b) => managerCarryoverIsApplied(b) - managerCarryoverIsApplied(a));
  const visibleRows = activeRows.slice(0, 3);
  const overflowCount = Math.max(0, activeRows.length - visibleRows.length);
  return {
    html: visibleRows.length ? visibleRows.map((row) => {
      const flow = `${row.sourceLine || "-"} → ${row.targetLine || "-"}`;
      const qty = clampQty(row.carryoverQty);
      const status = managerCarryoverStatusLabel(row.reviewStatus === "Pending DRI" || row.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : row.status);
      const full = `${row.item || "Item"} / ${flow} / -${qty} qty / ${status}`;
      return `
        <span class="line-compare-moved-item" title="${htmlAttr(full)}">
          <strong>${htmlText(row.item || "Item")}</strong>
          <small>${htmlText(flow)} · -${qty} qty</small>
        </span>`;
    }).join("") : `<span class="muted">No moved item in this scope</span>`,
    footer: overflowCount ? `+${overflowCount} more in ledger` : "Full trace in ledger",
  };
}

function renderManagerDemandCostLineCompare(filters) {
  const container = document.getElementById("managerDemandCostLineCompare");
  if (!container) return;
  const rows = managerCarryoverRowsForScope(filters, true);
  const appliedRows = rows.filter(managerCarryoverIsApplied);
  const savingAmount = appliedRows.reduce((sum, row) => sum + managerCarryoverCostSaving(row), 0);
  const pendingCount = rows.filter((row) => managerCarryoverNeedsDriReview(row) || (!managerCarryoverIsApplied(row) && row.status !== "Rejected")).length;
  const movedItems = managerCarryoverMovedItemsSummary(rows);
  if (!rows.length) {
    container.innerHTML = `
      <div class="line-compare-empty">
        <strong>Line Carryover Impact</strong>
        <span>No carryover rows match ${managerDemandCostScopeLabel(filters)}.</span>
      </div>`;
    return;
  }
  const flows = managerCarryoverFlowLabels(rows).join(" / ");
  const appliedLabel = appliedRows.length ? `${appliedRows.length} applied` : "No applied";
  container.innerHTML = `
    <section class="line-compare-strip" aria-label="Line carryover impact">
      <div class="line-compare-title">
        <strong>Line Carryover Impact</strong>
        <span>${htmlText(flows || "Line flow")} · ${managerDemandCostScopeLabel(filters)}</span>
      </div>
      <div class="line-compare-card saving">
        <span>Cost Saving</span>
        <strong title="${htmlAttr(formatMoneyFromUsd(savingAmount))}">${savingAmount ? `-${formatCompactCurrencyFromUsd(savingAmount)}` : "-"}</strong>
        <small>${appliedLabel}</small>
      </div>
      <div class="line-compare-card pending">
        <span>Needs DRI</span>
        <strong>${pendingCount || "-"}</strong>
        <small>visible, pending confirmation</small>
      </div>
      <div class="line-compare-card moved">
        <span>Moved Items</span>
        <div class="line-compare-moved-list">${movedItems.html}</div>
        <small>${htmlText(movedItems.footer)}</small>
      </div>
    </section>`;
}

function managerCarryoverStatusLabel(status) {
  if (status === "Requester Applied" || status === "User Applied" || status === "Requester Candidate" || status === "Carryover Candidate") return "Pending Dept DRI";
  if (status === "Applied") return "Applied";
  if (status === "Rejected") return "Rejected";
  if (status === "Pending DRI" || status === "Pending Dept DRI") return "Pending Dept DRI";
  return "Pending Dept DRI";
}

function managerCarryoverStatusClass(status) {
  if (status === "Applied") return "status-pill approved";
  if (status === "Requester Applied" || status === "User Applied" || status === "Requester Candidate" || status === "Carryover Candidate" || status === "Pending DRI" || status === "Pending Dept DRI") return "status-pill warning";
  if (status === "Rejected") return "status-pill rejected";
  return "status-pill submitted";
}

function managerCarryoverCostSaving(row) {
  if (!managerCarryoverIsApplied(row)) return 0;
  const originalQty = clampQty(row.originalQty);
  const requestedCarryoverQty = clampQty(row.carryoverQty);
  const carryoverQty = originalQty > 0 ? Math.min(originalQty, requestedCarryoverQty) : requestedCarryoverQty;
  const unitPriceUsd = Number(row.unitPriceUsd || 0) || amountUsdFromVnd(clampQty(row.unitPrice));
  return carryoverQty * unitPriceUsd;
}

function renderManagerCarryoverLedger(containerId, filters = {}, item = "") {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rows = managerCarryoverRowsForScope({
    project: filters.project || "",
    phase: filters.phase || "",
    item,
  }, true);
  const ledgerCols = 7;
  container.innerHTML = `
    <div class="carryover-ledger-head">
      <div>
        <h4>Carryover Ledger</h4>
        <p class="muted">Line-to-line traceability is always visible. Only Dept DRI approved rows reduce effective cost; requester candidates stay visible but are not counted.</p>
      </div>
      <span class="status-pill info">${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"}</span>
    </div>
    <div class="table-wrap table-shell carryover-ledger-wrap">
      <table class="data-table table-fixed workflow-table carryover-ledger-table">
        <thead>
          <tr>
            <th>Flow</th>
            <th>Item</th>
            <th>Phase / Unit</th>
            <th>Qty Saved</th>
            <th>Cost Saving</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => {
            const cappedCarryover = Math.min(clampQty(row.originalQty), clampQty(row.carryoverQty));
            const effectiveQty = Math.max(0, clampQty(row.originalQty) - (managerCarryoverIsApplied(row) ? cappedCarryover : 0));
            const detailTitle = [
              `${row.sourceLine} -> ${row.targetLine}`,
              `Original ${clampQty(row.originalQty)}`,
              `Carryover ${cappedCarryover}`,
              `Effective ${effectiveQty}`,
              row.sourceProject ? `Source ${row.sourceProject}` : "",
              row.targetProject ? `Target ${row.targetProject}` : "",
              row.confirmedBy ? `By ${row.confirmedBy}` : "",
              row.confirmedAt ? compactDateTime(row.confirmedAt) : "",
            ].filter(Boolean).join(" / ");
            return `
            <tr>
              <td class="cell-identity" title="${htmlAttr(detailTitle)}">${row.sourceLine} → ${row.targetLine}</td>
              <td class="cell-identity" title="${htmlAttr(row.item)}">${row.item}</td>
              <td class="cell-identity">${STAGE_LABELS[row.phase] || row.phase}<div class="reason-text">${htmlText(row.stationOrUnit || "-")}</div></td>
              <td class="cell-number" title="${htmlAttr(detailTitle)}">${managerCarryoverIsApplied(row) ? `-${cappedCarryover}` : cappedCarryover ? `${cappedCarryover} pending` : "-"}</td>
              <td class="cell-number" title="${htmlAttr(formatMoneyFromUsd(managerCarryoverCostSaving(row)))}">${managerCarryoverIsApplied(row) ? `-${formatCompactCurrencyFromUsd(managerCarryoverCostSaving(row))}` : managerCarryoverNeedsDriReview(row) ? "Pending, not counted" : "-"}</td>
              <td><span class="${managerCarryoverStatusClass(row.reviewStatus === "Pending DRI" || row.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : row.status)}">${managerCarryoverStatusLabel(row.reviewStatus === "Pending DRI" || row.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : row.status)}</span></td>
              <td class="cell-audit-reason" title="${htmlAttr(row.reason || "-")}"><div class="audit-reason-text">${htmlText(row.reason)}</div></td>
            </tr>`;
          }).join("") : `<tr><td colspan="${ledgerCols}" class="empty-cell">No carryover ledger rows match this scope.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function renderManagerDemandCostUnitSummary(unitTotals, filters, overallImpact) {
  const container = document.getElementById("managerDemandCostUnitSummary");
  if (!container) return;
  const modeLabel = filters.viewMode === "amount" ? "Amount" : "Qty";
  const overallRows = managerCarryoverRowsForScope(filters, true);
  const overallDisplay = {
    ...overallImpact,
    status: managerCarryoverStatusBucket(overallRows),
    flowLabels: managerCarryoverFlowLabels(overallRows),
  };
  container.innerHTML = `
    <div class="demand-cost-summary-head">
      <strong>Selected Department Effective Total</strong>
      <span>${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"} · ${filters.project || "All projects"} · ${filters.lineCount} line count · ${modeLabel}</span>
    </div>
    <div class="table-wrap demand-cost-summary-wrap">
      <table class="data-table demand-cost-summary-table">
        <thead>
          <tr>${QUANTITY_DASHBOARD_UNITS.map((unit) => `<th>${unit}</th>`).join("")}<th>Total</th></tr>
        </thead>
        <tbody>
          <tr>
            ${QUANTITY_DASHBOARD_UNITS.map((unit) => {
              const total = unitTotals[unit];
              const scopedRows = managerCarryoverRowsForScope({ ...filters, unit }, true);
              const impact = {
                ...total,
                status: managerCarryoverStatusBucket(scopedRows),
                flowLabels: managerCarryoverFlowLabels(scopedRows),
              };
              const buttonAttrs = `data-manager-demand-cost-unit="${htmlAttr(unit)}" data-manager-demand-cost-phase="${filters.phase}"`;
              return `<td class="${total.originalQty ? managerDemandCostCellClass(impact, "demand-cost-number") : "muted-cell"}" title="${htmlAttr(managerDemandCostImpactTitle(impact))}">${renderManagerDemandCostValue(impact, filters.viewMode, { hasPrice: Boolean(total.effectiveAmount || !total.originalQty), buttonAttrs })}</td>`;
            }).join("")}
            <td class="${managerDemandCostCellClass(overallDisplay)}" title="${htmlAttr(managerDemandCostImpactTitle(overallDisplay))}">${renderManagerDemandCostValue(overallDisplay, filters.viewMode, { hasPrice: true })}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

function renderManagerDemandCostHead() {
  const head = document.getElementById("managerDemandCostHead");
  if (!head) return;
  const colgroup = document.getElementById("managerDemandCostColgroup");
  if (colgroup) {
    colgroup.innerHTML = `
      <col class="demand-cost-col-eng">
      <col class="demand-cost-col-cn">
      <col class="demand-cost-col-vn">
      <col class="demand-cost-col-price">
      ${QUANTITY_DASHBOARD_UNITS.map(() => `<col class="demand-cost-col-unit">`).join("")}
      <col class="demand-cost-col-total">
      <col class="demand-cost-col-detail">`;
  }
  head.innerHTML = `
    <tr>
      <th colspan="4" class="demand-cost-phase-head">Item Master</th>
      <th colspan="${QUANTITY_DASHBOARD_UNITS.length}" class="demand-cost-phase-head">Department / Unit Cost by Selected Phase</th>
      <th colspan="2" class="demand-cost-phase-head">Total</th>
    </tr>
    <tr>
      <th>ENG Name</th>
      <th>CN-ENG Name</th>
      <th>VN Name</th>
      <th>Price</th>
      ${QUANTITY_DASHBOARD_UNITS.map((unit) => `<th class="demand-cost-unit-head">${unit}</th>`).join("")}
      <th class="demand-cost-total-head">Total</th>
      <th class="demand-cost-detail-head">Detail</th>
    </tr>`;
}

function syncManagerDemandCostTableWidth() {
  const table = document.getElementById("managerDemandCostTable");
  if (!table) return;
  const width = 590 + (QUANTITY_DASHBOARD_UNITS.length * 108) + 236;
  table.style.minWidth = `${width}px`;
  table.style.width = `${width}px`;
}

function clearManagerDemandCostFilters() {
  ["managerDemandCostProjectFilter"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  const phase = document.getElementById("managerDemandCostPhaseFilter");
  if (phase) phase.value = "";
  const lineCount = document.getElementById("managerDemandCostLineCount");
  if (lineCount) lineCount.value = "1";
  const viewMode = document.getElementById("managerDemandCostViewMode");
  if (viewMode) viewMode.value = "amount";
  syncManagerQuantityScopeFromDemandCost();
  renderManagerDemandCostDashboard();
  renderManagerQuantityMatrix();
}

function syncManagerQuantityScopeFromDemandCost() {
  const filters = managerDemandCostFilters();
  setManagerQuantitySelectValue("managerQuantityProjectFilter", filters.project);
  setManagerQuantitySelectValue("managerQuantityPhaseFilter", filters.phase);
}

function drillManagerDemandCost(unit, phase = "", item = "") {
  currentDemandAnalysisTab = "quantity";
  setManagerTab("analysis");
  const filters = managerDemandCostFilters();
  setManagerQuantitySelectValue("managerQuantityProjectFilter", filters.project);
  if (phase) setManagerQuantitySelectValue("managerQuantityPhaseFilter", phase);
  if (item) setManagerQuantitySelectValue("managerQuantityItemFilter", item);
  if (QUANTITY_DASHBOARD_UNITS.includes(unit)) setManagerQuantitySelectValue("managerQuantityUnitFilter", unit);
  else setManagerQuantitySelectValue("managerQuantityItemFilter", unit);
  selectedManagerQuantityKeyId = "";
  renderManagerQuantityMatrix();
}

function renderManagerDemandCostDashboard() {
  syncManagerDemandCostFilters();
  const rows = managerDemandCostRows();
  const filters = managerDemandCostFilters();
  const meta = document.getElementById("managerDemandCostCurrencyMeta");
  if (meta) meta.textContent = `${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"} · ${filters.lineCount} line count · ${currencyDisplay} view`;
  renderManagerDemandCostHead();
  syncManagerDemandCostTableWidth();
  const body = document.getElementById("managerDemandCostRows");
  if (!body) return;
  const unitTotals = managerDemandCostUnitTotals(rows, filters);
  const overallImpact = managerDemandCostOverallImpact(rows, filters);
  renderManagerDemandCostCarryoverCompare(overallImpact, filters);
  renderManagerDemandCostLineCompare(filters);
  renderManagerDemandCostUnitSummary(unitTotals, filters, overallImpact);
  renderManagerCarryoverLedger("managerDemandCostCarryoverLedger", filters);
  body.innerHTML = rows.length ? rows.map((row) => {
    const rowImpact = QUANTITY_DASHBOARD_UNITS.reduce((acc, unit) => {
      const impact = managerDemandCostCellImpact(row, unit, filters);
      acc.originalQty += impact.originalQty;
      acc.carryoverQty += impact.carryoverQty;
      acc.effectiveQty += impact.effectiveQty;
      acc.originalAmount += impact.originalAmount;
      acc.savingAmount += impact.savingAmount;
      acc.effectiveAmount += impact.effectiveAmount;
      acc.carryoverRows.push(...impact.carryoverRows);
      return acc;
    }, { originalQty: 0, carryoverQty: 0, effectiveQty: 0, originalAmount: 0, savingAmount: 0, effectiveAmount: 0, carryoverRows: [] });
    rowImpact.status = managerCarryoverStatusBucket(rowImpact.carryoverRows);
    rowImpact.flowLabels = managerCarryoverFlowLabels(rowImpact.carryoverRows);
    return `
      <tr>
        <td title="${htmlAttr(`${row.item} / ${row.project}`)}"><strong>${row.item}</strong><div class="reason-text">${row.project}</div></td>
        <td title="${htmlAttr(row.cnEngName)}"><div class="quantity-text-clamp">${row.cnEngName}</div></td>
        <td title="${htmlAttr(row.vnName)}"><div class="quantity-text-clamp">${row.vnName}</div></td>
        <td title="${htmlAttr(row.unitPrice ? `${formatMoneyFromUsd(row.unitPrice)} / ${row.priceSource || "Price"}` : "Price Pending")}">${row.unitPrice ? `${formatMoneyFromUsd(row.unitPrice)}<div class="reason-text">${row.priceSource || "Price"}</div>` : `<span class="status-pill pending">Price Pending</span>`}</td>
        ${QUANTITY_DASHBOARD_UNITS.map((unit) => {
          const impact = managerDemandCostCellImpact(row, unit, filters);
          const buttonAttrs = `data-manager-demand-cost-unit="${htmlAttr(unit)}" data-manager-demand-cost-phase="${filters.phase}" data-manager-demand-cost-item="${htmlAttr(row.item)}"`;
          return `<td class="demand-cost-unit-cell ${impact.originalQty || impact.carryoverRows.length ? managerDemandCostCellClass(impact, "demand-cost-number") : "muted-cell"}" title="${htmlAttr(managerDemandCostImpactTitle(impact))}">${renderManagerDemandCostValue(impact, filters.viewMode, { hasPrice: Boolean(row.unitPrice), buttonAttrs })}</td>`;
        }).join("")}
        <td class="demand-cost-total-cell ${managerDemandCostCellClass(rowImpact)}" title="${htmlAttr(managerDemandCostImpactTitle(rowImpact))}">${renderManagerDemandCostValue(rowImpact, filters.viewMode, { hasPrice: Boolean(row.unitPrice) })}</td>
        <td class="demand-cost-detail-cell"><button class="mini return" type="button" data-manager-demand-cost-unit="${htmlAttr(row.item)}">Open Matrix</button></td>
      </tr>`;
  }).join("") : `<tr><td colspan="${QUANTITY_DASHBOARD_UNITS.length + 6}" class="empty-cell">No dashboard demand rows match the selected filters.</td></tr>`;
}

function managerQuantityGroupKey(row) {
  return [
    row.project,
    normalize(row.name),
    normalize(userVisibleItemDetail(row) || itemDetail(row) || ""),
  ].join("::");
}

function createManagerQuantityGroup(row) {
  return {
    key: managerQuantityGroupKey(row),
    project: row.project,
    item: row.name || "-",
    spec: userVisibleItemDetail(row) || itemDetail(row) || "-",
    requests: new Map(),
    statuses: new Set(),
    phaseTotals: Object.fromEntries(STAGES.map((stage) => [stage, 0])),
    stationTotals: Object.fromEntries(STAGES.map((stage) => [stage, new Map()])),
    unitTotals: new Map(),
    detailRows: [],
    priceCandidates: [],
    totalQty: 0,
  };
}

function formatVnd(value) {
  return formatCurrencyFromVnd(value);
}

function managerQuantityPriceCandidate(row) {
  const quoteUsd = legacyPriceToUsd(row, "updatedPrice") || legacyPriceToUsd(row, "quoteUnitPrice");
  if (quoteUsd) return { unitPrice: quoteUsd, unitPriceUsd: quoteUsd, source: "PAS Quote", rank: 1, date: row.quoteDate || row.quoteReadyAt || "" };

  const historyPrice = legacyPriceToUsd(row, "unitPrice");
  if (historyPrice > 0) return { unitPrice: historyPrice, unitPriceUsd: historyPrice, source: "History Price", rank: 2, date: row.quoteDate || row.sourceDate || "" };

  const estimatedUnitPrice = legacyPriceToUsd(row, "estimatedUnitPrice");
  if (estimatedUnitPrice > 0) return { unitPrice: estimatedUnitPrice, unitPriceUsd: estimatedUnitPrice, source: "Requester Estimate", rank: 3, date: row.submittedAt || row.createdAt || "" };

  const estimatedAmount = Number(row.estimatedAmountUsd || 0) || amountUsdFromVnd(Number(row.estimatedAmount || 0));
  const qty = totalQty(row);
  if (estimatedAmount > 0 && qty > 0) {
    return {
      unitPrice: estimatedAmount / qty,
      unitPriceUsd: estimatedAmount / qty,
      source: "Requester Estimate",
      rank: 3,
      date: row.submittedAt || row.createdAt || "",
    };
  }

  return { unitPrice: 0, source: "Price Pending", rank: 9, date: "" };
}

function managerQuantityResolvePrice(candidates = []) {
  const values = candidates.filter((candidate) => candidate && candidate.unitPrice > 0);
  if (!values.length) return { unitPrice: 0, source: "Price Pending", estimatedAmount: 0 };
  values.sort((left, right) =>
    left.rank - right.rank
    || String(right.date || "").localeCompare(String(left.date || ""))
    || right.unitPrice - left.unitPrice
  );
  return { unitPrice: values[0].unitPrice, source: values[0].source, estimatedAmount: 0 };
}

function managerQuantityPriceHtml(group, mode = "unit") {
  const isPending = !group.unitPrice;
  if (mode === "amount") {
    return `
      <div class="quantity-price-cell ${isPending ? "pending" : ""}">
        <strong>${isPending ? "-" : formatMoneyFromUsd(group.estimatedAmount)}</strong>
        <span>${isPending ? "Amount pending" : `${group.totalQty} pcs`}</span>
      </div>`;
  }
  return `
    <div class="quantity-price-cell ${isPending ? "pending" : ""}">
      <strong>${isPending ? "-" : formatMoneyFromUsd(group.unitPrice)}</strong>
      <span class="price-source-badge ${statusClass(group.priceSource)}">${group.priceSource}</span>
    </div>`;
}

function managerQuantityStationTotals(group) {
  const totals = new Map();
  STAGES.forEach((stage) => {
    [...group.stationTotals[stage].entries()].forEach(([station, qty]) => {
      totals.set(station, (totals.get(station) || 0) + qty);
    });
  });
  return [...totals.entries()]
    .filter(([, qty]) => qty > 0)
    .sort((left, right) => right[1] - left[1] || STATION_MASTER.indexOf(left[0]) - STATION_MASTER.indexOf(right[0]));
}

function managerQuantityInlineTotals(entries, order = []) {
  const sorted = [...entries]
    .filter(([, qty]) => qty > 0)
    .sort((left, right) => {
      const leftIndex = order.indexOf(left[0]);
      const rightIndex = order.indexOf(right[0]);
      if (leftIndex >= 0 || rightIndex >= 0) return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
      return right[1] - left[1] || String(left[0]).localeCompare(String(right[0]));
    });
  return sorted.length ? sorted.map(([name, qty]) => `${name} ${qty}`).join(" / ") : "-";
}

function managerQuantityUnitSummary(group) {
  return managerQuantityInlineTotals([...group.unitTotals.entries()], DEMAND_UNIT_OPTIONS);
}

function managerQuantityActiveStationSummary(group) {
  return managerQuantityInlineTotals(managerQuantityStationTotals(group), STATION_MASTER);
}

function managerQuantitySinglePhaseMode() {
  return managerQuantityVisibleStages().length === 1;
}

function managerQuantityColumnWidth(column) {
  const singlePhase = managerQuantitySinglePhaseMode();
  if (column.type === "station") {
    if (column.name === "ENG Pack") return singlePhase ? 58 : 44;
    if (column.name === "Laser_pico") return singlePhase ? 62 : 48;
    return singlePhase ? 42 : 30;
  }
  if (column.name === "Total Demand for EQ" || column.name === "Actual Need QTY") return singlePhase ? 82 : 66;
  return singlePhase ? 48 : 40;
}

function managerQuantityGroupDisplayLabel(label) {
  return {
    Supporting: "Support",
    "Demand Calculation": "Calc",
  }[label] || label;
}

function managerQuantityLeafDisplayLabel(label) {
  return {
    "Total Demand for EQ": "Total Demand",
    "Actual Need QTY": "Actual Need",
  }[label] || label;
}

function renderManagerQuantityColgroup() {
  const stages = managerQuantityVisibleStages();
  const columns = managerQuantityPhaseColumns();
  return `
    <colgroup>
      <col style="width:46px" />
      <col style="width:120px" />
      <col style="width:210px" />
      <col style="width:92px" />
      <col style="width:100px" />
      ${stages.map(() => columns.map((column) => `<col style="width:${managerQuantityColumnWidth(column)}px" />`).join("")).join("")}
      <col style="width:52px" />
      <col style="width:62px" />
    </colgroup>`;
}

function managerQuantityTableWidth() {
  const fixedColumnsWidth = 46 + 120 + 210 + 92 + 100 + 52 + 62;
  const matrixWidth = managerQuantityVisibleStages().length
    * managerQuantityPhaseColumns().reduce((sum, column) => sum + managerQuantityColumnWidth(column), 0);
  return fixedColumnsWidth + matrixWidth;
}

function managerQuantityColumnCount() {
  const fixedLeftColumns = 5;
  const rightColumns = 2;
  return fixedLeftColumns + (managerQuantityVisibleStages().length * managerQuantityPhaseColumns().length) + rightColumns;
}

function managerQuantityEmptyMessage() {
  const filters = managerQuantityFilters();
  const parts = [];
  if (filters.station) parts.push(`${filters.station} station`);
  if (filters.phase) parts.push(`${STAGE_LABELS[filters.phase]} phase`);
  if (filters.project) parts.push(`${filters.project} project`);
  if (filters.item) parts.push(`${filters.item}`);
  if (filters.demandUnit) parts.push(`${filters.demandUnit}`);
  return parts.length
    ? `No ${parts.join(" / ")} demand rows match the current filters. Use Clear Filters to restore the matrix.`
    : "No submitted demand rows match the selected matrix filters.";
}

function managerQuantityVisibleStages() {
  const phase = managerQuantityFilters().phase;
  return phase ? STAGES.filter((stage) => stage === phase) : STAGES;
}

function managerQuantityPhaseColumns() {
  return [
    ...MANAGER_MFG_HEADER_MASTER.mainline.map((name) => ({ name, group: "Mainline", type: "station" })),
    ...MANAGER_MFG_HEADER_MASTER.packing.map((name) => ({ name, group: "Packing", type: "station" })),
    ...MANAGER_MFG_HEADER_MASTER.supporting.map((name) => ({ name, group: "Supporting", type: "station" })),
    ...MANAGER_MFG_HEADER_MASTER.calculation.map((name) => ({ name, group: "Demand Calculation", type: "calculation" })),
  ];
}

function managerQuantityGroupColspans() {
  return [
    ["Mainline", MANAGER_MFG_HEADER_MASTER.mainline.length],
    ["Packing", MANAGER_MFG_HEADER_MASTER.packing.length],
    ["Supporting", MANAGER_MFG_HEADER_MASTER.supporting.length],
    ["Demand Calculation", MANAGER_MFG_HEADER_MASTER.calculation.length],
  ];
}

function managerQuantitySortGroups(groups) {
  const sort = managerQuantityFilters().sort;
  const sorted = [...groups];
  const compareText = (left, right) => `${left.project} ${left.item}`.localeCompare(`${right.project} ${right.item}`);
  if (sort === "unitPriceDesc") return sorted.sort((left, right) => right.unitPrice - left.unitPrice || compareText(left, right));
  if (sort === "unitPriceAsc") return sorted.sort((left, right) => (left.unitPrice || Number.MAX_SAFE_INTEGER) - (right.unitPrice || Number.MAX_SAFE_INTEGER) || compareText(left, right));
  if (sort === "amountDesc") return sorted.sort((left, right) => right.estimatedAmount - left.estimatedAmount || compareText(left, right));
  if (sort === "amountAsc") return sorted.sort((left, right) => (left.estimatedAmount || Number.MAX_SAFE_INTEGER) - (right.estimatedAmount || Number.MAX_SAFE_INTEGER) || compareText(left, right));
  if (sort === "qtyDesc") return sorted.sort((left, right) => right.totalQty - left.totalQty || compareText(left, right));
  return sorted.sort(compareText);
}

function managerQuantitySelectedScopeLabel() {
  const filters = managerQuantityFilters();
  return [
    filters.project || "All projects",
    filters.item || "All items",
    filters.phase ? STAGE_LABELS[filters.phase] : "All phases",
    filters.station || "All stations",
    filters.demandUnit || "All units",
  ].join(" / ");
}

function managerQuantityGroups() {
  const groups = new Map();
  managerQuantityFilteredEntries().forEach((entry) => {
    const key = managerQuantityGroupKey(entry.request);
    if (!groups.has(key)) groups.set(key, createManagerQuantityGroup(entry.request));
    const group = groups.get(key);
    group.requests.set(entry.request.id, entry.request);
    group.statuses.add(entry.request.status);
    group.phaseTotals[entry.phase] += entry.qty;
    group.stationTotals[entry.phase].set(entry.station, (group.stationTotals[entry.phase].get(entry.station) || 0) + entry.qty);
    const unitKey = managerQuantityEntryUnit(entry);
    if (unitKey) group.unitTotals.set(unitKey, (group.unitTotals.get(unitKey) || 0) + entry.qty);
    group.totalQty += entry.qty;
    group.detailRows.push(entry);
    group.priceCandidates.push(managerQuantityPriceCandidate(entry.request));
  });
  return managerQuantitySortGroups([...groups.values()].map((group) => {
    const price = managerQuantityResolvePrice(group.priceCandidates);
    return {
      ...group,
      unitPrice: price.unitPrice,
      priceSource: price.source,
      estimatedAmount: price.unitPrice ? price.unitPrice * group.totalQty : 0,
    };
  }))
    .map((group, index) => ({ ...group, keyId: `MQ-${index}` }));
}

function stationGroupLabel(station) {
  if (MANAGER_MFG_HEADER_MASTER.mainline.includes(station)) return "Mainline";
  if (MANAGER_MFG_HEADER_MASTER.packing.includes(station)) return "Packing";
  if (MANAGER_MFG_HEADER_MASTER.supporting.includes(station)) return "Supporting";
  return "Station";
}

function managerQuantityPhaseCell(group, stage) {
  const total = group.phaseTotals[stage] || 0;
  if (!total) {
    return `<div class="quantity-matrix-compact empty">0</div>`;
  }
  const stations = [...group.stationTotals[stage].entries()]
    .filter(([, qty]) => qty > 0)
    .sort((left, right) => STATION_MASTER.indexOf(left[0]) - STATION_MASTER.indexOf(right[0]));
  const inlineHtml = (values) => values.map(([station, qty]) => `${station} ${qty}`).join(" / ");
  const lines = ["Mainline", "Packing", "Supporting"].map((label) => {
    const values = stations.filter(([station]) => stationGroupLabel(station) === label);
    if (!values.length) return "";
    return `<span><b>${label}:</b> ${inlineHtml(values)}</span>`;
  }).filter(Boolean).join("");
  return `
    <div class="quantity-matrix-compact">
      <strong>Total ${total}</strong>
      ${lines || `<span><b>Station:</b> ${inlineHtml(stations)}</span>`}
    </div>`;
}

function managerQuantityCarryoverQty(group, stage) {
  return managerCarryoverQtyForScope({
    project: group.project,
    phase: stage,
    item: group.item,
  });
}

function managerQuantityCarryoverRows(group, stage) {
  return managerCarryoverRowsForScope({
    project: group.project,
    phase: stage,
    item: group.item,
  }, true);
}

function managerQuantityCarryoverClass(group, stage, column) {
  if (column.name !== "Actual Need QTY") return "";
  const status = managerCarryoverStatusBucket(managerQuantityCarryoverRows(group, stage));
  const carryoverClassByStatus = {
    applied: "carryover-cell-applied",
    pending: "carryover-cell-pending",
    rejected: "carryover-cell-rejected",
  };
  return carryoverClassByStatus[status] || "";
}

function managerQuantityCalcValue(group, stage, columnName) {
  const total = group.phaseTotals[stage] || 0;
  if (columnName === "Total Demand for EQ") return total || "";
  if (columnName === "Actual Need QTY") {
    const carryoverQty = Math.min(total, managerQuantityCarryoverQty(group, stage));
    if (!total && !carryoverQty) return "";
    const effectiveQty = Math.max(0, total - carryoverQty);
    return carryoverQty
      ? `<span class="quantity-saved-value" title="${htmlAttr(`Total Demand ${total} / Applied Carryover -${carryoverQty} / Actual Need ${effectiveQty}`)}">${effectiveQty}<span class="saved-badge">Saved</span></span>`
      : effectiveQty || "";
  }
  return "";
}

function managerQuantityCellValue(group, stage, column) {
  if (column.type === "station") return group.stationTotals[stage].get(column.name) || "";
  return managerQuantityCalcValue(group, stage, column.name);
}

function managerQuantityExpandableText(text, lines, groupKeyId, field) {
  const value = String(text || "-");
  const expanded = expandedManagerQuantityRows.has(`${groupKeyId}:${field}`);
  const threshold = field === "item" ? 28 : 86;
  const canExpand = value.length > threshold;
  return `
    <div class="quantity-text-cell ${expanded ? "expanded" : ""}">
      <div class="quantity-text-clamp quantity-text-clamp-${lines}" title="${htmlAttr(value)}">${value}</div>
      ${canExpand ? `<button type="button" class="quantity-expand-btn" data-manager-quantity-expand="${groupKeyId}" data-manager-quantity-expand-field="${field}">${expanded ? "Collapse" : "Expand"}</button>` : ""}
    </div>`;
}

function renderManagerQuantityHead() {
  const head = document.getElementById("managerQuantityHead");
  if (!head) return;
  const stages = managerQuantityVisibleStages();
  const groupColspans = managerQuantityGroupColspans();
  const rowSpanHeaders = ["Project", "Item", "Spec", "Unit Price", "Est. Amount"];
  head.innerHTML = `
    <tr>
      ${rowSpanHeaders.map((label) => `<th class="quantity-sticky-head" rowspan="3">${label}</th>`).join("")}
      ${stages.map((stage) => `<th class="quantity-phase-head" colspan="${managerQuantityPhaseColumns().length}">${STAGE_LABELS[stage]}</th>`).join("")}
      <th class="quantity-sticky-head" rowspan="3">Total Qty</th>
      <th class="quantity-sticky-head" rowspan="3">Detail</th>
    </tr>
    <tr>
      ${stages.map(() => groupColspans.map(([label, span]) => `<th class="quantity-group-head ${statusClass(label)}" colspan="${span}" title="${htmlAttr(label)}">${managerQuantityGroupDisplayLabel(label)}</th>`).join("")).join("")}
    </tr>
    <tr>
      ${stages.map(() => managerQuantityPhaseColumns().map((column) => `<th class="quantity-leaf-head ${column.type === "calculation" ? "calculation" : ""}" title="${htmlAttr(column.name)}">${managerQuantityLeafDisplayLabel(column.name)}</th>`).join("")).join("")}
    </tr>`;
}

function renderManagerQuantityMatrix() {
  syncManagerQuantityFilters();
  const groups = managerQuantityGroups();
  if (!groups.some((group) => group.keyId === selectedManagerQuantityKeyId)) {
    selectedManagerQuantityKeyId = groups[0]?.keyId || "";
  }
  renderManagerQuantityHead();
  const body = document.getElementById("managerQuantityRows");
  if (!body) return;
  const table = document.getElementById("managerQuantityMatrixTable");
  if (table) {
    table.querySelector("colgroup")?.remove();
    table.insertAdjacentHTML("afterbegin", renderManagerQuantityColgroup());
    const width = `${managerQuantityTableWidth()}px`;
    table.style.width = width;
    table.style.minWidth = width;
  }
  const stages = managerQuantityVisibleStages();
  const columns = managerQuantityPhaseColumns();
  body.innerHTML = groups.length
    ? groups.map((group) => `
      <tr class="${expandedManagerQuantityRows.has(`${group.keyId}:item`) || expandedManagerQuantityRows.has(`${group.keyId}:spec`) ? "quantity-row-expanded" : ""}">
        <td>${group.project}</td>
        <td>${managerQuantityExpandableText(group.item, 2, group.keyId, "item")}</td>
        <td>${managerQuantityExpandableText(group.spec, 3, group.keyId, "spec")}</td>
        <td>${managerQuantityPriceHtml(group, "unit")}</td>
        <td>${managerQuantityPriceHtml(group, "amount")}</td>
        ${stages.map((stage) => columns.map((column) => {
          const value = managerQuantityCellValue(group, stage, column);
          const carryoverClass = managerQuantityCarryoverClass(group, stage, column);
          return `<td class="quantity-number-cell ${column.type === "calculation" ? "calculation" : ""} ${carryoverClass}">${value}</td>`;
        }).join("")).join("")}
        <td><strong>${group.totalQty}</strong></td>
        <td><button class="mini return" data-manager-quantity-detail="${group.keyId}">Detail</button></td>
      </tr>`).join("")
    : `<tr class="quantity-empty-row"><td colspan="${managerQuantityColumnCount()}" class="empty-cell">${managerQuantityEmptyMessage()}</td></tr>`;
  const filters = managerQuantityFilters();
  renderManagerCarryoverLedger("managerQuantityCarryoverLedger", {
    project: filters.project,
    phase: filters.phase,
  }, filters.item || "");
}

function clearManagerQuantityFilters() {
  [
    "managerQuantityProjectFilter",
    "managerQuantityItemFilter",
    "managerQuantityPhaseFilter",
    "managerQuantityStationFilter",
    "managerQuantityUnitFilter",
    "managerQuantitySortFilter",
    "managerUnitSplitPhase",
    "managerUnitSplitViewMode",
  ].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  const lineCount = document.getElementById("managerUnitSplitLineCount");
  if (lineCount) lineCount.value = "1";
  if (document.getElementById("managerQuantityProjectFilter")) syncManagerQuantityFilters();
  selectedManagerQuantityKeyId = "";
  renderManagerQuantityMatrix();
}

function openManagerQuantityDetail(groupKeyId) {
  const group = managerQuantityGroups().find((item) => item.keyId === groupKeyId);
  if (!group) return;
  const stations = STATION_MASTER.filter((station) => STAGES.some((stage) => (group.stationTotals[stage].get(station) || 0) > 0));
  const unitRows = group.detailRows
    .sort((left, right) => `${left.phase} ${left.station} ${left.demandUnit}`.localeCompare(`${right.phase} ${right.station} ${right.demandUnit}`));
  document.getElementById("managerTrackTitle").textContent = `${group.project} / ${group.item}`;
  document.getElementById("managerTrackSubtitle").textContent = "Phase x station matrix from Requester submitted demand rows";
  document.getElementById("managerTrackSummary").innerHTML = summaryCardsHtml([
    { label: "Total Qty", value: group.totalQty, helper: "All visible demand rows", variant: "hero" },
    { label: "Unit Price", value: group.unitPrice ? formatMoneyFromUsd(group.unitPrice) : "-", helper: group.priceSource },
    { label: "Est. Amount", value: group.estimatedAmount ? formatMoneyFromUsd(group.estimatedAmount) : "-", helper: "Unit price x total qty" },
    { label: "Requests", value: group.requests.size, helper: [...group.requests.keys()].join(" / ") || "-" },
    { label: "Active Phases", value: STAGES.filter((stage) => group.phaseTotals[stage] > 0).map((stage) => STAGE_LABELS[stage]).join(" / ") || "-" },
    { label: "Status", value: [...group.statuses].join(" / ") || "-" },
  ]);
  document.getElementById("managerTrackBody").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Phase x Station Matrix</h4>
          <p class="panel-subcopy">Rows follow the MFG station master. Columns are phases from P1.0 to MP.</p>
        </div>
      </div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table manager-track-matrix quantity-detail-matrix">
          <thead>
            <tr>
              <th>Station</th>
              ${STAGES.map((stage) => `<th>${STAGE_LABELS[stage]}</th>`).join("")}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${stations.length ? stations.map((station) => {
              const total = STAGES.reduce((sum, stage) => sum + (group.stationTotals[stage].get(station) || 0), 0);
              return `
                <tr>
                  <td><strong>${station}</strong><div class="reason-text">${stationGroupLabel(station)}</div></td>
                  ${STAGES.map((stage) => `<td>${group.stationTotals[stage].get(station) || 0}</td>`).join("")}
                  <td><strong>${total}</strong></td>
                </tr>`;
            }).join("") : `<tr><td colspan="${STAGES.length + 2}" class="empty-cell">No station quantity is available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>需求單位 Breakdown</h4>
          <p class="panel-subcopy">Use this to confirm which demand unit entered each station/phase quantity.</p>
        </div>
      </div>
      <div class="table-wrap compact-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Type</th>
              <th>Phase</th>
              <th>Station</th>
              <th>需求單位</th>
              <th>Qty</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${unitRows.map((entry) => `
              <tr>
                <td>${entry.request.id}</td>
                <td>${entry.demandType}</td>
                <td>${STAGE_LABELS[entry.phase]}</td>
                <td>${entry.station || "-"}</td>
                <td>${entry.demandUnit}</td>
                <td>${entry.qty}</td>
                <td>${entry.remark || "-"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerTrackModal").hidden = false;
}

function openManagerStageDetail(project, stage, lineDepartment = "") {
  const panel = document.getElementById("managerStageDetailPanel");
  panel.hidden = false;
  const baseRow = requests.find((row) => row.id === project) || requests.find((row) => row.project === project && row.status !== "Draft");
  if (!baseRow) return;
  selectedManagerRequestId = baseRow.id;
  document.getElementById("managerStageDetailTitle").textContent = `${baseRow.project} / ${baseRow.name}`;
  const body = document.getElementById("managerStageDetailRows");
  if (!body) return;
  body.innerHTML = STAGES.map((phase) => {
    const rows = managerDetailSameItemRows(baseRow, phase);
    const calc = rows.reduce((sum, item) => {
      const values = managerDetailCalculation(item, phase);
      sum.buffer += values.buffer;
      sum.totalDemand += values.totalDemand;
      sum.stock += values.stock;
      sum.actualNeed += values.actualNeed;
      return sum;
    }, { buffer: 0, totalDemand: 0, stock: 0, actualNeed: 0 });
    const stationColumns = [
      ...MANAGER_MFG_HEADER_MASTER.mainline,
      ...MANAGER_MFG_HEADER_MASTER.packing,
      ...MANAGER_MFG_HEADER_MASTER.supporting,
    ];
    const stationValues = stationColumns.map((station) => rows.reduce((sum, item) => sum + managerDetailStationQty(item, phase, station), 0));
    return `<tr>
      <td>${STAGE_LABELS[phase]}</td>
      ${stationValues.map((value) => `<td>${value}</td>`).join("")}
      <td>${calc.buffer}</td>
      <td>${calc.totalDemand}</td>
      <td>${calc.stock}</td>
      <td>${calc.actualNeed}</td>
      <td>${rows.reduce((sum, item) => sum + clampQty(item[phase]), 0)}</td>
    </tr>`;
  }).join("");
}

function closeManagerStageDetail() {
  document.getElementById("managerStageDetailPanel").hidden = true;
}

function openManagerProgressDetail(groupKeyId) {
  const group = managerProgressRows().find((row) => row.keyId === groupKeyId);
  if (!group) return;
  const pendingOwner = managerProgressPendingOwnerForGroup(group);
  const currentStage = managerProgressCurrentStageForGroup(group);
  const submittedAt = (group.rows || []).map(managerProgressSubmittedAt).filter(Boolean).sort()[0] || "";
  const stageStart = managerProgressGroupStageStartAt(group, currentStage);
  const quoteStatus = managerProgressQuoteStatusForGroup(group);
  const nextAction = managerProgressNextActionForGroup(group);
  const daysPending = managerProgressDaysPending(group);
  document.getElementById("managerDetailTitle").textContent = `${group.yearProject} / ${group.project} / ${group.item}`;
  document.getElementById("managerDetailStatus").className = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "status-pill warning"
    : "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "Needs Attention"
    : "On Track";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Pivot Group Summary</h4></div>
      <div class="item-detail-grid">
        ${detailRow("Year Project", group.yearProject)}
        ${detailRow("Project", group.project)}
        ${detailRow("Item", group.item)}
        ${detailRow("Department", group.department)}
        ${detailRow("Quantity", group.quantity)}
        ${detailRow("Submitted / Received", submittedAt ? compactDateTime(submittedAt) : "-")}
        ${detailRow("Pending Owner", `<span class="status-pill ${statusClass(pendingOwner)}">${pendingOwner}</span>`)}
        ${detailRow("Current Stage", `<span class="status-pill ${statusClass(currentStage)}">${currentStage}</span>`)}
        ${detailRow("Days Pending", daysPending === null ? "-" : `${daysPending}d`)}
        ${detailRow("Stage Since", stageStart ? compactDateTime(stageStart) : "-")}
        ${detailRow("Quote Status", `<span class="status-pill ${statusClass(quoteStatus)}">${quoteStatus}</span>`)}
        ${detailRow("Next Action", nextAction)}
        ${detailRow("Pending / Risk Reason", pendingReasonCell(group.pendingReasons))}
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Timeline History</h4></div>
      <div class="audit-timeline-list">
        ${group.rows.map((row) => `
          <article class="request-audit-block">
            <div class="audit-row-title">
              <strong>${row.id || "Raw row"}</strong>
              <span>${row.requesterName || row.requester || "Requester"} · ${managerProgressQty(row)} pcs</span>
            </div>
            ${managerAuditTimelineHtml(row)}
          </article>
        `).join("")}
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Raw Request Rows</h4></div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Item / Spec</th>
              <th>Qty</th>
              <th>Department</th>
              <th>Submitted / Received</th>
              <th>Pending Owner</th>
              <th>Current Stage</th>
              <th>Days Pending</th>
              <th>Quote Status</th>
              <th>Next Action</th>
              <th>Pending / Risk Reason</th>
              <th>Raw Pending Value</th>
            </tr>
          </thead>
          <tbody>
            ${group.rows.map((row) => {
              const rowOwner = managerProgressPendingOwnerForRow(row);
              const rowStage = managerProgressCurrentStageForRow(row);
              const rowSubmittedAt = managerProgressSubmittedAt(row);
              const rowStageStart = managerProgressStageStartAt(row, rowStage);
              const rowDaysPending = rowStageStart ? daysBetween(rowStageStart, todayIso()) : null;
              const rowQuoteStatus = omQuoteStatusForRow(row);
              return `
              <tr>
                <td>${row.requesterName || "-"}<div class="reason-text">${row.requesterEmployeeId || row.email || ""}</div></td>
                <td><div class="item-primary">${row.name || "-"}</div><div class="reason-text">${itemDetail(row)}</div></td>
                <td>${managerProgressQty(row)}</td>
                <td>${row.department || row.requesterDept || "-"}</td>
                <td>${rowSubmittedAt ? compactDateTime(rowSubmittedAt) : "-"}<div class="reason-text">${row.needDate ? `Need ${row.needDate}` : "Need date pending"}</div></td>
                <td><span class="status-pill ${statusClass(rowOwner)}">${rowOwner}</span></td>
                <td><span class="status-pill ${statusClass(rowStage)}">${rowStage}</span></td>
                <td>${rowDaysPending === null ? "-" : `${rowDaysPending}d`}<div class="reason-text">${rowStageStart ? `Since ${compactDateTime(rowStageStart)}` : "No stage timestamp"}</div></td>
                <td><span class="status-pill ${statusClass(rowQuoteStatus)}">${rowQuoteStatus}</span><div class="reason-text">${omQuoteValidUntil(row) || "No valid-until date yet"}</div></td>
                <td>${omNextActionForGroup({ rows: [row] })}</td>
                <td>${pendingReasonCell(new Set([managerProgressPendingReason(row)]))}</td>
                <td>${managerProgressRawPendingReason(row) || "-"}</td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerDetailModal").hidden = false;
}

function renderManagerStageSummary(aggregates) {
  return aggregates;
}

function renderProjectSetup() {
  const phaseInput = document.getElementById("projectSetupPhase");
  const rowsTarget = document.getElementById("projectSetupRows");
  if (!phaseInput || !rowsTarget) return;
  rowsTarget.innerHTML = projectConfigs.length
    ? projectConfigs.map((project) => `
      <tr>
        <td>
          <select data-project-config-type="${project.code}">
            ${PROJECT_TYPES.map((type) => `<option value="${type}" ${project.projectType === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </td>
        <td>${project.code}</td>
        <td>
          <input type="text" value="${currentPhaseLabelForProject(project.code)}" placeholder="Example: P1.0, EVT-2" data-project-config-phase="${project.code}" />
        </td>
        <td>${stageDateForProject(project.code, currentStageForProject(project.code)) || "-"}</td>
        <td>${requiredDeliveryDateForProject(project.code, currentStageForProject(project.code)) || "-"}</td>
        <td>${nextBuyPhaseLabelForProject(project.code)}</td>
        <td>
          <span class="status-pill ${project.openToUser ? "ready-for-handoff" : "draft"}">${project.openToUser ? "Open to Requester" : "Draft"}</span>
        </td>
        <td><button class="mini ${project.openToUser ? "return" : "approve"}" data-project-config-access="${project.code}" data-project-config-open="${project.openToUser ? "false" : "true"}">${project.openToUser ? "Close" : "Open"}</button></td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-cell">No projects have been configured yet.</td></tr>`;
}

function saveProjectSetup(openToUser = false) {
  const codeInput = document.getElementById("projectSetupCode");
  const phaseInput = document.getElementById("projectSetupPhase");
  const typeInput = document.getElementById("projectSetupType");
  const code = normalizeProjectCode(codeInput?.value);
  const currentPhase = String(phaseInput?.value || "").trim();
  const projectType = PROJECT_TYPES.includes(typeInput?.value) ? typeInput.value : "G";
  if (!code) {
    showToast("Project Code is required.", "error");
    return;
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    showToast("Project Code can only use letters, numbers, hyphen, or underscore.", "error");
    return;
  }
  if (!currentPhase) {
    showToast("Current Phase is required.", "error");
    return;
  }

  const exists = projectConfigFor(code);
  projectConfigs = exists
    ? projectConfigs.map((project) => project.code === code ? { ...project, projectType, currentPhase, openToUser } : project)
    : [...projectConfigs, { code, projectType, currentPhase, openToUser, stageDates: {} }];
  refreshProjectCodes();
  if (openToUser) currentProject = code;
  if (codeInput) codeInput.value = "";
  if (phaseInput) phaseInput.value = "";
  syncProjectControls();
  renderProjectSetup();
  renderDepartment();
  renderManagerStageTracking();
  renderManagerCostView();
  renderProcurement();
  renderOmPurchasing();
  renderSourcing();
  renderBuyer();
  showToast(openToUser ? `${code} saved and opened to Requester.` : `${code} saved as draft project.`, "success");
}

function updateProjectSetup(code, field, value) {
  projectConfigs = projectConfigs.map((project) => {
    if (project.code !== code) return project;
    return { ...project, [field]: field === "openToUser" ? Boolean(value) : value };
  });
  refreshProjectCodes();
  syncProjectControls();
  renderProjectSetup();
  renderDepartment();
  renderManagerStageTracking();
  renderManagerCostView();
  renderProcurement();
  renderOmPurchasing();
  renderSourcing();
  renderBuyer();
  showToast(`${code} project setup updated.`, "success");
}

function setScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
}

function setView(name) {
  currentView = name;
  globalThis.currentView = name;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === name));
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.dataset.view === name));
  document.getElementById("pageTitle").textContent = pageTitles[name] || "Equipment Handoff";
  if (name === "department") renderDepartment();
  if (name === "manager") renderManager();
  if (name === "procurement") renderProcurement();
  if (name === "om") renderOmPurchasing();
  if (name === "uatFeedbackReview") {
    renderUatFeedbackReview();
    refreshUatFeedback({ review: isUatFeedbackReviewer(), silent: true });
  }
  if (name === "priceReview") renderPriceReview();
  if (name === "sourcing") renderSourcing();
  if (name === "buyer") renderBuyer();
  if (name === "adminSetup") renderAdminSetup();
  if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
}

window.addEventListener("procurement:carryover-updated", () => {
  if (currentView !== "manager") return;
  renderManagerDemandCostDashboard();
  renderManagerQuantityMatrix();
});

function applyRole(role) {
  currentRole = role;
  currentUserRole = role;
  globalThis.currentUserRole = role;
  const profile = roleProfiles[role] || roleProfiles.requester;
  const currencySelect = document.getElementById("currencyDisplaySelect");
  if (currencySelect) currencySelect.value = currencyDisplay;
  if (role === "requester") {
    const selectedPersona = document.getElementById("requesterPersonaSelect")?.value || "";
    if (selectedPersona) currentRequesterPersonaId = selectedPersona;
    const sessionPersona = currentSessionUser ? findRequesterPersonaByIdentifier(currentSessionUser.employeeId || currentSessionUser.employee_id || currentSessionUser.email || currentSessionUser.id) : null;
    if (sessionPersona) applyRequesterPersonaContext(sessionPersona);
  }
  const requesterPersona = role === "requester" ? currentRequesterPersona() : null;
  const sessionUser = sessionUserFromRole(role);
  const displayProfile = requesterPersona ? {
    name: requesterPersona.name,
    dept: requesterPersona.department || profile.dept,
    functionName: `Requester · ${requesterPersona.projectType || "Project"} · ${(requesterPersona.projects || [requesterPersona.project]).filter(Boolean).join(", ") || "Unmapped project"}`,
    email: requesterPersona.email || "",
    employeeId: requesterPersona.employeeId || "",
  } : currentSessionUser ? {
    name: sessionUser.name,
    dept: sessionUser.department || profile.dept,
    functionName: profile.functionName,
    email: sessionUser.email || "",
    employeeId: sessionUser.employeeId || sessionUser.employee_id || "",
  } : profile;
  document.getElementById("userBlock").innerHTML = `
    <span>Name: ${displayProfile.name}</span>
    <span>Dept: ${displayProfile.dept}</span>
    <span>Function: ${displayProfile.functionName}</span>
    ${displayProfile.employeeId ? `<span>Account: ${displayProfile.employeeId}</span>` : ""}
    ${displayProfile.email ? `<span>Email: ${displayProfile.email}</span>` : ""}`;

  document.querySelectorAll(".tab").forEach((tab) => {
    const allowedRoles = tab.dataset.roles.split(" ");
    tab.hidden = !allowedRoles.includes(role);
  });

  document.querySelectorAll(".requester-only").forEach((element) => {
    element.hidden = !["requester", "admin"].includes(role);
  });

  setView(profile.defaultView);
  if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
}

function setDeptTab(tabName) {
  const allowedTabs = new Set(["request", "warehouse", "needConfirmation", "submissions"]);
  const nextTab = allowedTabs.has(tabName) ? tabName : "request";
  currentDeptTab = nextTab;
  globalThis.currentDeptTab = nextTab;
  document.querySelectorAll("[data-dept-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.deptTab === nextTab));
  document.querySelectorAll("[data-dept-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.deptPanel === nextTab));
  renderDepartment();
}

function openItemPicker() {
  if (!["catalog", "reuse", "package"].includes(currentReuseMode)) currentReuseMode = "catalog";
  syncRequestWorksheetContext({ phase: requestCarryoverPhase(), mode: lastDemandType });
  setDeptTab("request");
  renderItemPickerDemandContext();
  renderRequesterInputContext();
  renderNaturalRows();
  renderHistoryRows();
  renderHistoryPackageRows();
  renderItemPickerCarryoverSuggestions();
  renderSelectedDemandLines();
  renderRequestRows();
  document.getElementById("requestRows")?.closest(".request-worksheet-shell")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeItemPicker() {
  setDeptTab("request");
  document.getElementById("requestRows")?.closest(".request-worksheet-shell")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setManagerTab(tabName) {
  currentManagerTab = tabName;
  document.querySelectorAll("[data-manager-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.managerTab === tabName));
  document.querySelectorAll("[data-manager-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.managerPanel === tabName));
  syncDemandAnalysisTabs();
  renderManager();
}

function syncDemandAnalysisTabs() {
  document.querySelectorAll("[data-demand-analysis-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.demandAnalysisTab === currentDemandAnalysisTab);
  });
  document.querySelectorAll("[data-demand-analysis-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.demandAnalysisPanel === currentDemandAnalysisTab);
  });
}

function setDemandAnalysisTab(tabName) {
  currentDemandAnalysisTab = tabName;
  syncDemandAnalysisTabs();
  renderManager();
}

function setHandoffTab(tabName) {
  currentHandoffTab = tabName;
  document.querySelectorAll("[data-handoff-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.handoffTab === tabName));
  document.querySelectorAll("[data-handoff-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.handoffPanel === tabName));
  renderProcurement();
}

function setOmTab(tabName) {
  const allowedTabs = new Set([...document.querySelectorAll("[data-om-tab]")].map((tab) => tab.dataset.omTab));
  const nextTab = allowedTabs.has(tabName) ? tabName : "submission";
  currentOmTab = nextTab;
  document.querySelectorAll("[data-om-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.omTab === nextTab));
  document.querySelectorAll("[data-om-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.omPanel === nextTab));
  renderOmPurchasing();
}

function setPriceReviewTab(tabName) {
  currentPriceReviewTab = tabName === "history" ? "history" : "pending";
  document.querySelectorAll("[data-price-review-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.priceReviewTab === currentPriceReviewTab));
  document.querySelectorAll("[data-price-review-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.priceReviewPanel === currentPriceReviewTab));
  renderPriceReview();
}

function requestFromRecord(record, overrides = {}) {
  const masterRecord = materialMasterRecordFor(record);
  const project = overrides.project || record.project || currentProject;
  const stage = overrides.phase || overrides.defaultPhase || currentStageForProject(project);
  const omPatch = omResponsibilityPatch({ ...record, ...overrides, project });
  const draft = {
    id: `DRAFT-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    project,
    projectType: overrides.projectType || record.projectType || projectTypeFor(project),
    timelineSource: `${projectTypeFor(project)} Requester Timeline`,
    lineOpenDate: overrides.lineOpenDate || record.lineOpenDate || stageDateForProject(project, stage),
    requiredDeliveryDate: overrides.requiredDeliveryDate || record.requiredDeliveryDate || requiredDeliveryDateForProject(project, stage),
    sourceRecordId: record.id,
    sourceSuggestionId: record.sourceSuggestionId || "",
    sourceProject: record.sourceProject || record.project || currentProject,
    sourceFactoryMaterialNo: record.sourceFactoryMaterialNo || record.factoryMaterialNo || "",
    partNo: record.partNo,
    materialId: record.materialId || masterRecord?.materialId || "",
    materialNo: record.materialNo || masterRecord?.materialNo || "",
    factoryMaterialNo: overrides.factoryMaterialNo || "",
    pasMaterialNo: record.pasMaterialNo || "",
    materialIdentityKey: materialIdentityKey(record),
    materialStatus: record.materialStatus || masterRecord?.materialStatus || "",
    standardNameCn: record.standardNameCn || record.name || "",
    standardNameEn: record.standardNameEn || record.name || "",
    standardNameVn: record.standardNameVn || record.name || "",
    vendorPartNo: record.vendorPartNo || record.partNo || "",
    source: record.source || "",
    catalogBucket: record.catalogBucket || "",
    catalogStatus: record.catalogStatus || "",
    ...omPatch,
    globalItemKey: globalItemKey(record),
    globalItemId: globalItemIdFor(record),
    name: record.name,
    level1: record.level1 || "",
    level2: record.level2 || "",
    level3: record.level3 || "",
    spec: record.spec,
    process: record.process,
    station: record.station,
    department: record.department || "",
    unitPrice: record.unitPrice,
    unitPriceUsd: legacyPriceToUsd(record, "unitPrice"),
    unitPriceVnd: Number(record.unitPriceVnd || 0) || (legacyPriceToUsd(record, "unitPrice") ? Math.round(amountVndFromUsd(legacyPriceToUsd(record, "unitPrice"))) : 0),
    estimatedUnitPrice: clampQty(overrides.estimatedUnitPrice ?? record.estimatedUnitPrice),
    estimatedUnitPriceUsd: legacyPriceToUsd({ ...record, ...overrides }, "estimatedUnitPrice"),
    estimatedUnitPriceVnd: Number(overrides.estimatedUnitPriceVnd || record.estimatedUnitPriceVnd || 0) || (legacyPriceToUsd({ ...record, ...overrides }, "estimatedUnitPrice") ? Math.round(amountVndFromUsd(legacyPriceToUsd({ ...record, ...overrides }, "estimatedUnitPrice"))) : 0),
    estimatedAmount: clampQty(overrides.estimatedAmount ?? record.estimatedAmount),
    estimatedAmountUsd: Number(overrides.estimatedAmountUsd || record.estimatedAmountUsd || 0) || amountUsdFromVnd(clampQty(overrides.estimatedAmount ?? record.estimatedAmount)),
    estimatedAmountVnd: Number(overrides.estimatedAmountVnd || record.estimatedAmountVnd || 0) || clampQty(overrides.estimatedAmount ?? record.estimatedAmount),
    budgetRemark: overrides.budgetRemark || record.budgetRemark || "",
    vendor: record.vendor,
    quoteDate: record.quoteDate || "",
    quoteExpiry: record.quoteExpiry,
    p10: clampQty(record.p10),
    p11: clampQty(record.p11),
    evt: clampQty(record.evt),
    dvt: clampQty(record.dvt),
    pvt: clampQty(record.pvt),
    mp: clampQty(record.mp),
    demandUnit: demandUnitFor({ demandUnit: overrides.demandUnit || record.demandUnit || record.department || DEMAND_UNIT_FALLBACK }),
    stationBreakdown: overrides.stationBreakdown || record.stationBreakdown || (!overrides.status || overrides.status === "Draft"
      ? stationBreakdownFromRecord({ ...record, ...overrides, project })
      : undefined),
    status: "Draft",
    selected: true,
    managerReason: "",
    procurementStatus: "",
    quoteStatus: quoteStatus(record),
    updatedPrice: "",
    assignedTo: "",
    quotationPdf: "",
    procurementRemark: "",
    quoteException: false,
    omStatus: "",
    omSelected: false,
    externalSystemStatus: "Pending",
    externalSystemRef: "",
    requesterReason: record.useCase || "",
    ...overrides,
  };
  return syncRowPhaseQtyFromStationBreakdown(draft);
}

function suggestionToRecord(suggestion) {
  const sequence = String(masterSequence++).padStart(3, "0");
  const globalKey = globalItemKey(suggestion);
  const existingMaterial = materialMasterRecordFor(suggestion);
  const materialPatch = isLegacyMaintenance(suggestion)
    ? ensureMaterialMaster(suggestion, {
      createdBy: roleProfiles[currentRole]?.name || "Requester",
      source: "Legacy Material Standardization",
      sourceProject: suggestion.sourceProject || suggestion.project,
      sourceRecordId: suggestion.sourceRecordId || "",
    })
    : existingMaterial
      ? {
        materialId: existingMaterial.materialId,
        materialNo: existingMaterial.materialNo,
        materialIdentityKey: existingMaterial.materialIdentityKey,
        materialStatus: existingMaterial.materialStatus,
      }
    : {
      materialId: "",
      materialNo: "",
      materialIdentityKey: materialIdentityKey(suggestion),
      materialStatus: MATERIAL_STATUS_PENDING_PROCUREMENT,
    };
  const sourceRecord = suggestion.sourceRecordId ? purchaseRecords.find((row) => row.id === suggestion.sourceRecordId) : null;
  const sourceStageValues = suggestion.sourceQtyMode && sourceRecord
    ? STAGES.reduce((values, stage) => ({ ...values, [stage]: clampQty(sourceRecord[stage]) }), {})
    : {};
  return {
    id: `MASTER-${sequence}`,
    poNo: "",
    project: suggestion.project,
    partNo: materialPatch.materialNo || "",
    materialId: materialPatch.materialId,
    materialNo: materialPatch.materialNo,
    factoryMaterialNo: suggestion.factoryMaterialNo || factoryMaterialNoFor(suggestion),
    pasMaterialNo: suggestion.pasMaterialNo || "",
    materialIdentityKey: materialIdentityKey(suggestion),
    materialStatus: materialPatch.materialStatus,
    vendorPartNo: "",
    globalItemKey: globalKey,
    globalItemId: globalItemIdForKey(globalKey),
    name: suggestion.standardNameCn || suggestion.name,
    standardNameCn: suggestion.standardNameCn || suggestion.name,
    standardNameEn: suggestion.standardNameEn || "",
    standardNameVn: suggestion.standardNameVn || "",
    standardNameStatus: suggestion.standardNameStatus || "",
    level1: suggestion.level1 || "",
    level2: suggestion.level2 || "",
    level3: suggestion.level3 || "",
    detail: suggestion.detail || "",
    spec: suggestion.spec,
    structuredSpec: suggestion.structuredSpec || "",
    uom: suggestion.uom || "",
    estimatedUnitPrice: clampQty(suggestion.estimatedUnitPrice),
    estimatedUnitPriceVnd: clampQty(suggestion.estimatedUnitPrice),
    estimatedUnitPriceUsd: amountUsdFromVnd(clampQty(suggestion.estimatedUnitPrice)),
    estimatedAmount: clampQty(suggestion.estimatedAmount),
    estimatedAmountVnd: clampQty(suggestion.estimatedAmount),
    estimatedAmountUsd: amountUsdFromVnd(clampQty(suggestion.estimatedAmount)),
    budgetRemark: suggestion.budgetRemark || "",
    estimateReason: suggestion.estimateReason || suggestion.budgetRemark || "",
    duplicateDifference: suggestion.duplicateDifference || "",
    evidenceReference: suggestion.evidenceReference || "",
    duplicateCandidates: suggestion.duplicateCandidates || [],
    itemMasterRequestStatus: "Pending Material Review",
    source: isLegacyMaintenance(suggestion) ? suggestion.source || "" : "new-item-master",
    process: "TBD",
    station: "TBD",
    department: "",
    unitPrice: 0,
    qty: 0,
    vendor: "TBD",
    quoteDate: "",
    quoteExpiry: "",
    quoteStatus: isLegacyMaintenance(suggestion) ? "Reference Estimate" : "New Material",
    source: "new-item-master",
    sourceSuggestionId: suggestion.id,
    sourceRecordId: suggestion.sourceRecordId || "",
    sourceProject: suggestion.sourceProject || suggestion.project,
    ...sourceStageValues,
  };
}

function seedOmHistory(row, action, note = "") {
  omHistory = [{
    id: `OMH-${String(omHistorySequence++).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    action,
    actor: "System",
    note,
    timestamp: new Date().toISOString(),
  }, ...omHistory];
}

function seedCoordinatorComputerData() {
  if (requests.some((row) => row.id === "REQ-P26-COMPUTER-001")) return;
  const computerRecord = purchaseRecords.find((record) => record.id === "PO-P26-COMP-001") || purchaseRecords.find((record) => normalize(record.name).includes("laptop"));
  if (!computerRecord) return;
  let computerRequest = requestFromRecord(computerRecord, {
    id: "REQ-P26-COMPUTER-001",
    project: "P26",
    status: "Approved",
    selected: false,
    handoffSelected: false,
	    rfqSelected: true,
	    rfqBuyer: "IT Sourcing",
	    rfqStatus: "Draft",
	    procurementStatus: HANDOFF_WAITING_PAS,
	    pasStatus: PAS_WAITING,
	    pasRequired: true,
	    omStatus: "",
	    omScopeStatus: OM_SCOPE_STANDARD,
	    omScopeReason: "Matched standard OM demand bucket; final model is not required from Requester.",
	    omCollectionStatus: "",
	    finalSpecStatus: OM_FINAL_SPEC_READY,
	    managerReason: "Approved for P26 phase computer setup.",
    requesterReason: "Computer required for P26 NPI line engineering and OM validation.",
	    procurementRemark: "Computer item test flow. PAS required before OM demand collection.",
    decidedAt: "2026-05-13T08:30:00.000Z",
    submittedAt: "2026-05-13T08:00:00.000Z",
    p10: 0,
    p11: 3,
    evt: 0,
    dvt: 0,
    pvt: 0,
    mp: 0,
    demoCoordinatorSeed: true,
  });
  computerRequest = withRefreshedIdentity(computerRequest);
  requests = [computerRequest, ...requests];
  handoffHistory = [{
    id: `HH-${String(handoffHistorySequence++).padStart(4, "0")}`,
    requestId: computerRequest.id,
    project: computerRequest.project,
    item: computerRequest.name,
    action: "Seeded approved computer demand",
    route: handoffRoute(computerRequest),
    exportTarget: handoffTarget(computerRequest),
    actor: "System",
	    note: "P26 computer flow seeded as PAS-required OM Buy scope demand.",
	    timestamp: new Date().toISOString(),
	  }, ...handoffHistory];
}

function seedOmDemoData() {
  if (requests.some((row) => row.demoOmSeed)) return;
  const validRecord = purchaseRecords.find((record) => baseQuoteStatus(record) === "Valid") || purchaseRecords[1];
  const expiredRecord = purchaseRecords.find((record) => baseQuoteStatus(record) === "Expired") || purchaseRecords[0];
  const expiringSoonDate = todayDateString(new Date(Date.now() + 8 * 86400000));
  const newMaterialRecord = {
    id: "MASTER-DEMO-001",
    project: "P26",
    partNo: "NEW-P26-OM-DEMO",
    name: "Network Switch",
    spec: "24-port managed switch, OM to confirm final model",
    process: "IT Setup",
    station: "Network",
    department: "",
    unitPrice: 0,
    vendor: "TBD",
    quoteDate: "",
    quoteExpiry: "",
    quoteStatus: "New Material",
    source: "new-item-master",
    p10: 0,
    p11: 2,
    evt: 1,
    dvt: 0,
    pvt: 0,
    mp: 0,
  };
  newMaterialRecord.globalItemKey = globalItemKey(newMaterialRecord);
  newMaterialRecord.globalItemId = globalItemIdForKey(newMaterialRecord.globalItemKey);

  const demoRows = [
    requestFromRecord(validRecord, {
      id: "REQ-OM-001",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(validRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(validRecord),
      pasProjectCode: isOmBuyScope(validRecord) ? "L10-NPI-P26-MVA-260510IT" : "",
      pasReviewDate: "2026-05-10",
      omStatus: OM_RECEIVED,
      externalSystemStatus: OM_UPDATED,
      externalSystemRef: "ERP-DEMO-9001",
      quotationPdf: "quote_keyboard_valid.jpg",
      quotationExcel: "quote_keyboard_valid.xlsx",
      procurementRemark: "Reuse valid quote for approved demand.",
      decidedAt: "2026-05-10T09:00:00.000Z",
      sentToOmAt: "2026-05-10T10:00:00.000Z",
      excelExportedAt: "2026-05-10T11:00:00.000Z",
      quoteDate: "2026-05-10",
      quoteValidUntil: expiringSoonDate,
      quoteExpiry: expiringSoonDate,
      updatedPrice: validRecord.unitPrice || 95,
      omStage: "finalExport",
      userAQuoteDecisionStatus: OM_USER_CONFIRMED,
      userAQuoteDecisionAt: "2026-05-10T10:40:00.000Z",
      userAQuoteDecisionBy: "Requester",
      finalExportTarget: "CFA",
      finalExportStatus: OM_EXPORTED_CFA,
      finalExportedAt: "2026-05-10T11:30:00.000Z",
      buyerStatus: BUYER_RECEIVED,
      buyerReceivedAt: "2026-05-10T11:30:00.000Z",
      demoOmSeed: true,
    }),
    requestFromRecord(expiredRecord, {
      id: "REQ-OM-002",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(expiredRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(expiredRecord),
      pasProjectCode: isOmBuyScope(expiredRecord) ? "L10-NPI-OR5-MVA-260510IT" : "",
      pasReviewDate: "2026-05-10",
      omStatus: OM_RECEIVED,
      externalSystemStatus: "Pending",
      externalSystemRef: "ERP-DEMO-PENDING",
      quotationPdf: "quote_expired_refresh.jpg",
      quotationExcel: "quote_expired_refresh.xlsx",
      vendor: expiredRecord.vendor || "Refresh Vendor",
      vendorPartNo: expiredRecord.vendorPartNo || "EPR2601310006",
      quoteDate: "2026-05-12",
      quoteValidUntil: "2026-05-25",
      quoteExpiry: "2026-05-25",
      updatedPrice: expiredRecord.unitPrice || 120,
      pasDemandNo: "AIDB260512-OM002",
      pasMaterialNo: "PAS-MAT-OM002",
      procurementRemark: "Reference quote returned from PAS and is waiting for Requester confirmation.",
      decidedAt: "2026-05-10T09:10:00.000Z",
      sentToOmAt: "2026-05-10T10:10:00.000Z",
      pasResultReceivedAt: "2026-05-12T09:30:00.000Z",
      quoteReadyAt: "2026-05-12T10:00:00.000Z",
      omStage: "userConfirm",
      userAQuoteDecisionStatus: OM_WAITING_USER_CONFIRM,
      demoOmSeed: true,
    }),
    requestFromRecord(validRecord, {
      id: "REQ-OM-004",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(validRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(validRecord),
      pasProjectCode: isOmBuyScope(validRecord) ? "L10-NPI-P26-MVA-260512IT" : "",
      pasReviewDate: "2026-05-12",
      omStatus: OM_RECEIVED,
      externalSystemStatus: "Pending",
      externalSystemRef: "ERP-DEMO-QUOTE-004",
      quotationPdf: "quote_pas_result_ready.jpg",
      quotationExcel: "quote_pas_result_ready.xlsx",
      vendor: validRecord.vendor || "Keyboard Vendor",
      vendorPartNo: validRecord.vendorPartNo || "EPR2605120004",
      quoteDate: "2026-05-12",
      quoteValidUntil: "2026-06-30",
      quoteExpiry: "2026-06-30",
      updatedPrice: validRecord.unitPrice || 95,
      pasDemandNo: "AIDB260512-OM004",
      pasMaterialNo: "PAS-MAT-OM004",
      procurementRemark: "PAS quote is ready and within the 10-day expiry warning window.",
      decidedAt: "2026-05-12T09:30:00.000Z",
      sentToOmAt: "2026-05-12T10:00:00.000Z",
      pasResultReceivedAt: "2026-05-12T10:30:00.000Z",
      omStage: "pasResult",
      demoOmSeed: true,
    }),
    requestFromRecord(validRecord, {
      id: "REQ-OM-005",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(validRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(validRecord),
      pasProjectCode: isOmBuyScope(validRecord) ? "L10-NPI-P26-MVA-260512IT" : "",
      pasReviewDate: "2026-05-12",
      omStatus: OM_USER_CONFIRMED,
      externalSystemStatus: "Pending",
      externalSystemRef: "ERP-DEMO-EXPORT-005",
      quotationPdf: "quote_export_ready.jpg",
      quotationExcel: "quote_export_ready.xlsx",
      vendor: validRecord.vendor || "Export Ready Vendor",
      vendorPartNo: validRecord.vendorPartNo || "EPR2605120005",
      quoteDate: "2026-05-12",
      quoteValidUntil: "2026-06-30",
      quoteExpiry: "2026-06-30",
      updatedPrice: validRecord.unitPrice || 95,
      pasDemandNo: "AIDB260512-OM005",
      pasMaterialNo: "PAS-MAT-OM005",
      procurementRemark: "Requester confirmed this quote. Use this row to test Expense/Capex selection, Export Package, and Mark Exported.",
      decidedAt: "2026-05-12T09:45:00.000Z",
      sentToOmAt: "2026-05-12T10:15:00.000Z",
      pasResultReceivedAt: "2026-05-12T10:45:00.000Z",
      quoteReadyAt: "2026-05-12T11:00:00.000Z",
      omStage: "finalExport",
      userAQuoteDecisionStatus: OM_USER_CONFIRMED,
      userAQuoteDecisionAt: "2026-05-12T11:20:00.000Z",
      userAQuoteDecisionBy: "Requester",
      finalExportTarget: "",
      finalExportStatus: "",
      finalExportedAt: "",
      buyerStatus: "",
      buyerReceivedAt: "",
      demoOmSeed: true,
    }),
    requestFromRecord(newMaterialRecord, {
      id: "REQ-OM-003",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: PAS_APPROVED,
      pasRequired: true,
      pasProjectCode: "L10-NPI-P26-MVA-260510IT",
      pasReviewDate: "2026-05-10",
      omStatus: OM_RECEIVED,
      externalSystemStatus: "Pending",
      externalSystemRef: "",
	      requesterReason: "Network switch required for P26 line opening.",
	      procurementRemark: "OM scope; final spec/model required before quote.",
	      omCollectionStatus: OM_COLLECTION_COLLECTING,
	      finalSpecStatus: OM_FINAL_SPEC_REQUIRED,
      omStage: "pasRequest",
      decidedAt: "2026-05-10T09:20:00.000Z",
      sentToOmAt: "2026-05-10T10:20:00.000Z",
      demoOmSeed: true,
    }),
  ];

  requests = [...demoRows, ...requests];
  seedOmHistory(demoRows[0], "Exported Excel", "Demo row exported to OM Purchasing Excel package.");
  seedOmHistory(demoRows[0], "Uploaded quote screenshot", demoRows[0].quotationPdf);
  seedOmHistory(demoRows[0], "Uploaded quote Excel", demoRows[0].quotationExcel);
  seedOmHistory(demoRows[1], "Updated quote price", "Awaiting refreshed quote from OM Purchasing.");
  seedOmHistory(demoRows[1], "Uploaded quote Excel", demoRows[1].quotationExcel);
  seedOmHistory(demoRows[2], "PAS result uploaded", "Quote file, vendor, date, and price are ready to send to Requester confirmation.");
  seedOmHistory(demoRows[2], "Uploaded quote Excel", demoRows[2].quotationExcel);
  seedOmHistory(demoRows[3], "Requester confirmed need", "Demo row is ready for Final Export package testing.");
  seedOmHistory(demoRows[3], "Uploaded quote Excel", demoRows[3].quotationExcel);
  demoRows.forEach((row) => seedOmHistory(row, "Received handoff", `Route: ${handoffRoute(row)} / ${handoffWarnings(row).join(" / ") || "No warnings"}`));
}

function seedManagerQuantityMatrixDemoData() {
  if (requests.some((row) => row.demoQuantityMatrixSeed)) return;
  const existingEntries = managerQuantityFlattenRows();
  const existingStations = new Set(existingEntries.map((entry) => entry.station).filter(Boolean));
  if (existingEntries.length >= 180 && STATION_MASTER.every((station) => existingStations.has(station))) return;

  const usableRecords = purchaseRecords
    .filter((record) => record?.name && userVisibleItemDetail(record))
    .filter((record, index, list) => list.findIndex((item) => normalize(`${item.name} ${userVisibleItemDetail(item)}`) === normalize(`${record.name} ${userVisibleItemDetail(record)}`)) === index)
    .slice(0, 50);
  const fallbackRecords = [
    { id: "MATRIX-SRC-001", project: "P26", name: "Optical network switch", spec: "24-port managed network switch for line equipment connection", process: "FATP", station: "CG", unitPrice: 680 },
    { id: "MATRIX-SRC-002", project: "P26", name: "Industrial PC", spec: "Industrial computer for equipment control and data collection", process: "FATP", station: "FATP", unitPrice: 1450 },
    { id: "MATRIX-SRC-003", project: "P26", name: "Barcode Scanner", spec: "USB barcode scanner for material traceability", process: "FATP", station: "Test", unitPrice: 220 },
    { id: "MATRIX-SRC-004", project: "P26", name: "ESD Wrist Strap", spec: "ESD wrist strap set for operator workstation", process: "FATP", station: "Repair", unitPrice: 18 },
    { id: "MATRIX-SRC-005", project: "P26", name: "Tool Cart", spec: "Mobile tool cart for line setup and maintenance", process: "FATP", station: "WH", unitPrice: 320 },
    { id: "MATRIX-SRC-006", project: "P26", name: "Torque Screwdriver", spec: "Electric torque screwdriver with calibrated controller", process: "FATP", station: "BG", unitPrice: 160 },
    { id: "MATRIX-SRC-007", project: "P26", name: "Label Printer", spec: "Thermal label printer for packaging station", process: "FATP", station: "ENG Pack", unitPrice: 260 },
    { id: "MATRIX-SRC-008", project: "P26", name: "Vision Light Bar", spec: "LED light bar for inspection camera workstation", process: "FATP", station: "Test", unitPrice: 95 },
    { id: "MATRIX-SRC-009", project: "P26", name: "Fixture Base Plate", spec: "Aluminum fixture base plate with locating pins", process: "FATP", station: "Hybrid", unitPrice: 410 },
    { id: "MATRIX-SRC-010", project: "P26", name: "Air Blow Gun", spec: "ESD safe air blow gun for cleaning process", process: "FATP", station: "Auto", unitPrice: 34 },
  ];
  const baseRecords = usableRecords.length ? usableRecords : fallbackRecords;
  const targetCount = Math.min(Math.max(baseRecords.length, 38), 50);
  const sourceRecords = Array.from({ length: targetCount }, (_, index) => {
    const source = baseRecords[index % baseRecords.length];
    if (index < baseRecords.length) return source;
    const copyIndex = Math.floor(index / baseRecords.length) + 1;
    return {
      ...source,
      id: `${source.id || "MATRIX-SRC"}-COPY-${copyIndex}`,
      name: `${source.name} Line ${copyIndex}`,
      spec: `${userVisibleItemDetail(source) || itemDetail(source) || source.spec || "Station demand item"} / additional line set ${copyIndex}`,
    };
  });
  const demandUnits = ["ENG1", "ENG2", "ENG3", "QA G-PQC", "GG-WH", "MFG", "TE", "PQE"];
  const statuses = ["Submitted", "Approved", "In Progress"];
  const projectCodes = ["P26", "P26", "P26", "OR5", "P88"];
  const demoRows = sourceRecords.map((record, index) => {
    const project = record.project || projectCodes[index % projectCodes.length] || "P26";
    const status = statuses[index % statuses.length];
    const mfgStationBreakdown = STATION_MASTER.flatMap((station, stationIndex) => {
      const primaryPhase = STAGES[(index + stationIndex) % STAGES.length];
      const secondaryPhase = STAGES[(index + stationIndex + 2) % STAGES.length];
      const primaryQty = ((index + 2) * (stationIndex + 3)) % 7 + 1;
      const secondaryQty = (stationIndex + index) % 3 === 0 ? ((stationIndex + 2) % 4) + 1 : 0;
      const rows = [{
        id: `MQD-${String(index + 1).padStart(3, "0")}-${String(stationIndex + 1).padStart(2, "0")}-A`,
        phase: primaryPhase,
        station,
        demandUnit: demandUnits[(index + stationIndex) % demandUnits.length],
        qty: primaryQty,
        remark: `Demo demand for ${station} at ${STAGE_LABELS[primaryPhase]}`,
      }];
      if (secondaryQty > 0) {
        rows.push({
          id: `MQD-${String(index + 1).padStart(3, "0")}-${String(stationIndex + 1).padStart(2, "0")}-B`,
          phase: secondaryPhase,
          station,
          demandUnit: demandUnits[(index + stationIndex + 3) % demandUnits.length],
          qty: secondaryQty,
          remark: `Cross-phase demo demand for ${station}`,
        });
      }
      return rows;
    });
    const nonMfgUnits = ["FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
    const nonMfgBreakdown = nonMfgUnits
      .filter((_, unitIndex) => (index + unitIndex) % 3 === 0)
      .slice(0, 4)
      .map((unit, unitIndex) => {
        const phase = STAGES[(index + unitIndex + 1) % STAGES.length];
        return {
          id: `MQD-${String(index + 1).padStart(3, "0")}-NM-${String(unitIndex + 1).padStart(2, "0")}`,
          demandType: DEMAND_TYPE_NON_MFG,
          phase,
          station: "",
          demandUnit: unit,
          qty: ((index + 1) * (unitIndex + 2)) % 9 + 2,
          remark: `Demo Non-MFG demand for ${unit} at ${STAGE_LABELS[phase]}`,
        };
      });
    const stationBreakdown = [...mfgStationBreakdown, ...nonMfgBreakdown];
    const submittedAt = `2026-05-${String(10 + (index % 12)).padStart(2, "0")}T0${8 + (index % 2)}:${String((index * 7) % 60).padStart(2, "0")}:00.000Z`;
    const decidedAt = status === "Approved"
      ? `2026-05-${String(11 + (index % 12)).padStart(2, "0")}T10:${String((index * 5) % 60).padStart(2, "0")}:00.000Z`
      : "";
    const request = requestFromRecord(record, {
      id: `REQ-MATRIX-${String(index + 1).padStart(3, "0")}`,
      project,
      status,
      selected: false,
      managerReason: status === "Approved" ? "Demo approved quantity for cost review." : "",
      requesterReason: "Demo station breakdown for Quantity Matrix filter validation.",
      submittedAt,
      decidedAt,
      submittedBy: "Requester",
      requester: "Requester",
      stationBreakdown,
      procurementStatus: status === "Submitted" ? "" : HANDOFF_SENT_TO_OM,
      pasRequired: true,
      demoQuantityMatrixSeed: true,
    });
    return syncRowPhaseQtyFromStationBreakdown(request);
  });
  requests = [...demoRows, ...requests];
}

function renderDepartment() {
  syncProjectControls();
  syncCascade("natural");
  syncCascade("history");
  renderItemPickerDemandContext();
  renderRequesterInputContext();
  renderNaturalRows();
  renderRequestRows();
  renderUserDemandOverview();
  renderStationBreakdownRows();
  renderHistoryRows();
  renderHistoryPackageRows();
  renderSelectedDemandLines();
  renderDeptStageTracking();
  renderNeedConfirmationRows();
  renderSubmissionRows();
  renderWarehouseMaintenance();
  if (typeof window.renderRequesterTempBudgetPanel === "function") window.renderRequesterTempBudgetPanel();
}

function warehouseRecordKey(item, spec) {
  return `${normalize(item)}|||${normalize(spec)}`;
}

function warehouseSummaryKey(row = {}) {
  return `${row.month || currentWarehouseMonth}|||${warehouseRecordKey(row.item || "", row.spec || "")}`;
}

function warehouseSummaryId(row = {}) {
  return encodeURIComponent(JSON.stringify([row.month || currentWarehouseMonth, row.item || "", row.spec || ""]));
}

function warehouseSummaryFromId(summaryId = "") {
  try {
    const [month, item, spec] = JSON.parse(decodeURIComponent(summaryId));
    return warehouseInventoryRows(month).find((row) => row.item === item && row.spec === spec) || null;
  } catch (_error) {
    return null;
  }
}

function warehouseLockForRow(row = {}) {
  const key = warehouseSummaryKey(row);
  return warehouseLockdownRecords.find((record) => record.key === key) || null;
}

function warehouseOwnerForTransaction(row = {}) {
  if (row.itemOwner) return row.itemOwner;
  if (isOmOwnedItem(row)) return ITEM_OWNER_OM;
  const targetUnit = row.targetStationOrUnit || row.demandUnit || row.department || "";
  if (targetUnit && DEMAND_UNIT_OPTIONS.includes(canonicalDemandUnit(targetUnit))) return ITEM_OWNER_UNIT;
  return ITEM_OWNER_MFG;
}

function warehouseOwnerLabel(row = {}) {
  const owner = warehouseOwnerForTransaction(row);
  if (owner === ITEM_OWNER_OM) return "OM warehouse";
  if (owner === ITEM_OWNER_UNIT) return "Unit warehouse";
  if (owner === ITEM_OWNER_MFG) return "MFG warehouse";
  return "Owner pending";
}

function warehousePendingStatusForOwner(owner) {
  if (owner === ITEM_OWNER_OM) return "Pending OM";
  if (owner === ITEM_OWNER_UNIT) return "Pending Unit Owner";
  if (owner === ITEM_OWNER_MFG) return "Pending MFG Owner";
  return "Pending Owner";
}

function canLockWarehouseSummary(row = {}) {
  const owner = warehouseOwnerForTransaction(row);
  if (owner === ITEM_OWNER_OM) return ["om", "omLeader", "omMember", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_MFG) return ["procurement", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_UNIT) return ["dri", "deptDri", "admin"].includes(currentRole);
  return ["admin"].includes(currentRole);
}

function warehousePossibleUseText(row = {}) {
  const sources = row.sources || [];
  if (!sources.length) return "No active demand source";
  const compactSources = sources.slice(0, 2).map((source) => `${source.sourceProject} / ${source.sourceStage} / ${source.sourceStation}: ${source.qty}`);
  const extra = sources.length > 2 ? ` +${sources.length - 2} more` : "";
  return `${compactSources.join("; ")}${extra}`;
}

function warehouseTransactionType(row = {}) {
  return row.transactionType || (clampQty(row.ownedQty || row.qty) ? "stock-in" : "stock-in");
}

function warehouseTransactionQty(row = {}) {
  return clampQty(row.qty ?? row.ownedQty);
}

function warehouseTransactionStatus(row = {}) {
  return row.status || (warehouseTransactionType(row) === "stock-in" ? "Available" : warehousePendingStatusForOwner(warehouseOwnerForTransaction(row)));
}

function isWarehouseStockIn(row = {}) {
  return warehouseTransactionType(row) === "stock-in";
}

function isWarehouseUseTransaction(row = {}) {
  return ["use-candidate", "locked-use"].includes(warehouseTransactionType(row));
}

function isWarehouseLockedUse(row = {}) {
  const status = warehouseTransactionStatus(row);
  return warehouseTransactionType(row) === "locked-use" || status === "Locked Use" || status === "Locked" || status === "Approved";
}

function isWarehousePendingUse(row = {}) {
  return isWarehouseUseTransaction(row) && !isWarehouseLockedUse(row) && warehouseTransactionStatus(row) !== "Rejected";
}

function warehouseSourceLabel(row = {}) {
  return [row.sourceProject, row.sourceLine, row.sourceStage, row.sourceStation || row.sourceStationOrUnit]
    .filter(Boolean)
    .join(" / ") || "-";
}

function warehouseTargetLabel(row = {}) {
  return [row.targetProject, row.targetLine, row.targetStage, row.targetStation || row.targetStationOrUnit]
    .filter(Boolean)
    .join(" / ") || "-";
}

function warehouseTransactionTrace(row = {}) {
  const parts = [
    `Source: ${warehouseSourceLabel(row)}`,
    row.sourceRequestId ? `Source Request: ${row.sourceRequestId}` : "",
    warehouseTargetLabel(row) !== "-" ? `Target: ${warehouseTargetLabel(row)}` : "",
    row.targetRequestId ? `Target Request: ${row.targetRequestId}` : "",
    row.reason || "",
  ].filter(Boolean);
  return parts.join("\n");
}

function warehouseMonthForDemand(row) {
  return monthKeyFromDate(needDateForRow(row) || row.submittedAt || row.createdAt) || currentWarehouseMonth;
}

function warehouseDemandSources(month = currentWarehouseMonth) {
  return requests.flatMap((row) => {
    if (warehouseMonthForDemand(row) !== month) return [];
    return stationBreakdownRowsForDetail(row)
      .map((breakdown) => {
        const qty = stationBreakdownRowTotal(breakdown);
        if (!qty) return null;
        const phase = stationBreakdownPhaseKey(breakdown) || currentStageForProject(row.project);
        return {
          item: row.name,
          spec: userVisibleItemDetail(row) || itemDetail(row) || "-",
          qty,
          sourceProject: row.project,
          sourceStage: STAGE_LABELS[phase] || phase,
          sourceStation: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? (breakdown.station || "-") : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
          sourceRequestId: row.id,
        };
      })
      .filter(Boolean);
  });
}

function warehouseSummaryRows(month = currentWarehouseMonth) {
  const groups = new Map();
  warehouseDemandSources(month).forEach((source) => {
    const key = warehouseRecordKey(source.item, source.spec);
    const existing = groups.get(key) || { month, item: source.item, spec: source.spec, demandQty: 0, ownedQty: 0, sources: [], stockSources: [] };
    existing.demandQty += source.qty;
    existing.sources.push(source);
    groups.set(key, existing);
  });
  warehouseStockRecords.filter((record) => record.month === month).forEach((record) => {
    const key = warehouseRecordKey(record.item, record.spec);
    const existing = groups.get(key) || { month, item: record.item, spec: record.spec, demandQty: 0, ownedQty: 0, sources: [], stockSources: [] };
    existing.ownedQty += clampQty(record.ownedQty);
    existing.stockSources.push(record);
    groups.set(key, existing);
  });
  return [...groups.values()].map((row) => ({
    ...row,
    deltaQty: row.demandQty - row.ownedQty,
  })).sort((left, right) => {
    if ((left.deltaQty <= 0) !== (right.deltaQty <= 0)) return left.deltaQty <= 0 ? -1 : 1;
    return left.item.localeCompare(right.item);
  });
}

function warehouseInventoryRows(month = currentWarehouseMonth) {
  const groups = new Map();
  warehouseStockRecords.filter((record) => record.month === month).forEach((record) => {
    const key = warehouseRecordKey(record.item, record.spec);
    const existing = groups.get(key) || {
      month,
      item: record.item,
      spec: record.spec,
      itemOwner: record.itemOwner || itemOwnerFor(record),
      onHandQty: 0,
      reservedQty: 0,
      pendingQty: 0,
      stockSources: [],
      useTransactions: [],
    };
    const qty = warehouseTransactionQty(record);
    if (isWarehouseStockIn(record)) {
      existing.onHandQty += qty;
      existing.stockSources.push(record);
    } else if (isWarehouseUseTransaction(record)) {
      if (isWarehouseLockedUse(record)) existing.reservedQty += qty;
      else if (isWarehousePendingUse(record)) existing.pendingQty += qty;
      existing.useTransactions.push(record);
    }
    groups.set(key, existing);
  });
  return [...groups.values()].map((row) => {
    const availableQty = Math.max(0, row.onHandQty - row.reservedQty);
    const topSource = row.stockSources[0] || null;
    const pendingTarget = row.useTransactions.find(isWarehousePendingUse) || null;
    const lockedTarget = row.useTransactions.find(isWarehouseLockedUse) || null;
    return {
      ...row,
      itemOwner: row.itemOwner || itemOwnerFor(row),
      availableQty,
      topSource,
      potentialTarget: pendingTarget || lockedTarget || null,
      status: row.pendingQty > 0
        ? warehousePendingStatusForOwner(row.itemOwner || itemOwnerFor(row))
        : availableQty > 0
          ? "Available"
          : row.reservedQty > 0
            ? "Locked / Used"
            : "No stock",
    };
  }).sort((left, right) => {
    if ((left.pendingQty > 0) !== (right.pendingQty > 0)) return left.pendingQty > 0 ? -1 : 1;
    if (right.availableQty !== left.availableQty) return right.availableQty - left.availableQty;
    return left.item.localeCompare(right.item);
  });
}

function warehouseInventoryId(row = {}) {
  return encodeURIComponent(JSON.stringify([row.month || currentWarehouseMonth, row.item || "", row.spec || ""]));
}

function warehouseInventoryFromId(summaryId = "") {
  return warehouseSummaryFromId(summaryId);
}

function warehouseInventoryLedger(month = currentWarehouseMonth, filters = {}) {
  const query = normalize(filters.query || "");
  return warehouseStockRecords
    .filter((record) => record.month === month)
    .filter((record) => !query || normalize(`${record.item} ${record.spec} ${warehouseSourceLabel(record)} ${warehouseTargetLabel(record)} ${record.reason || ""}`).includes(query))
    .sort((left, right) => String(right.createdAt || right.confirmedAt || "").localeCompare(String(left.createdAt || left.confirmedAt || "")));
}

function warehouseStockSelectableRows() {
  const seen = new Map();
  purchaseRecords
    .filter((record) => record.name && itemDetail(record))
    .forEach((record) => {
      const key = warehouseRecordKey(record.name, userVisibleItemDetail(record) || itemDetail(record));
      if (seen.has(key)) return;
      seen.set(key, record);
    });
  return [...seen.values()].sort((left, right) => {
    const leftText = `${left.name} ${left.project || ""}`;
    const rightText = `${right.name} ${right.project || ""}`;
    return leftText.localeCompare(rightText);
  });
}

function warehouseStockSelectOptionValue(record = {}) {
  return record.id || warehouseRecordKey(record.name, userVisibleItemDetail(record) || itemDetail(record));
}

function warehouseSelectedStockRecord() {
  const selectedId = document.getElementById("warehouseStockItem")?.value || "";
  if (!selectedId) return null;
  return warehouseStockSelectableRows().find((record) => warehouseStockSelectOptionValue(record) === selectedId) || null;
}

function syncWarehouseStockSelection() {
  const record = warehouseSelectedStockRecord();
  const specInput = document.getElementById("warehouseStockSpec");
  const sourceProjectInput = document.getElementById("warehouseStockSourceProject");
  const sourceStageInput = document.getElementById("warehouseStockSourceStage");
  if (specInput) specInput.value = record ? userVisibleItemDetail(record) || itemDetail(record) || "" : "";
  if (record && sourceProjectInput && !sourceProjectInput.value) sourceProjectInput.value = record.project || currentProject;
  if (record && sourceStageInput && !sourceStageInput.value) sourceStageInput.value = sourcePhaseForHistory(record) || currentDeptDemandPhase;
}

function renderWarehouseStockItemOptions() {
  const select = document.getElementById("warehouseStockItem");
  if (!select) return;
  const previous = select.value;
  const options = warehouseStockSelectableRows();
  select.innerHTML = [
    `<option value="">Select purchased item</option>`,
    ...options.map((record) => {
      const value = warehouseStockSelectOptionValue(record);
      const spec = userVisibleItemDetail(record) || itemDetail(record) || "";
      const label = `${record.name} · ${record.project || "History"}`;
      return `<option value="${htmlAttr(value)}" title="${htmlAttr(spec)}">${htmlText(label)}</option>`;
    }),
  ].join("");
  select.value = options.some((record) => warehouseStockSelectOptionValue(record) === previous) ? previous : "";
  syncWarehouseStockSelection();
}

function warehouseTraceText(row) {
  const stockTrace = (row.stockSources || []).map((source) => `${warehouseSourceLabel(source)} / ${source.sourceRequestId || "-"} / ${warehouseTransactionQty(source)} stock in`);
  const useTrace = (row.useTransactions || []).map((source) => `${warehouseSourceLabel(source)} → ${warehouseTargetLabel(source)} / ${warehouseTransactionQty(source)} ${warehouseTransactionStatus(source)}`);
  const demandTrace = (row.sources || []).map((source) => `${source.sourceProject} / ${source.sourceStage} / ${source.sourceStation} / ${source.sourceRequestId} / ${source.qty} demand`);
  return [...stockTrace, ...useTrace, ...demandTrace].join("\n") || "No source trace";
}

function renderWarehouseMaintenance() {
  const monthInput = document.getElementById("warehouseMonthFilter");
  const searchInput = document.getElementById("warehouseSearch");
  const scope = document.getElementById("warehouseMaintenanceScope");
  const summary = document.getElementById("warehouseMaintenanceSummary");
  const body = document.getElementById("warehouseMaintenanceRows");
  if (!body) return;
  renderWarehouseStockItemOptions();
  if (monthInput && !monthInput.value) monthInput.value = currentWarehouseMonth;
  const month = monthInput?.value || currentWarehouseMonth;
  currentWarehouseMonth = month;
  const query = normalize(searchInput?.value || "");
  const rows = warehouseInventoryRows(month).filter((row) => !query || normalize(`${row.item} ${row.spec} ${warehouseTraceText(row)} ${warehouseSourceLabel(row.topSource)} ${warehouseTargetLabel(row.potentialTarget)}`).includes(query));
  const ledgerRows = warehouseInventoryLedger(month, { query });
  const pending = rows.filter((row) => row.pendingQty > 0).length;
  const availableRows = rows.filter((row) => row.availableQty > 0);
  const crossProjectCandidates = ledgerRows.filter((row) => isWarehouseUseTransaction(row) && row.sourceProject && row.targetProject && row.sourceProject !== row.targetProject).length;
  const topStock = availableRows.slice().sort((left, right) => right.availableQty - left.availableQty)[0];
  if (scope) scope.textContent = `${month} · ${rows.length} item/spec`;
  if (summary) {
    summary.innerHTML = summaryCardsHtml([
      { label: "Available Stock Items", value: availableRows.length, helper: "Item/spec with available qty" },
      { label: "Total Available Qty", value: rows.reduce((sum, row) => sum + row.availableQty, 0), helper: "On hand minus locked use" },
      { label: "Pending Owner Review", value: pending, helper: "Use candidates waiting owner lock", variant: pending ? "warning" : "" },
      { label: "Top Stock Item", value: topStock ? topStock.availableQty : "-", helper: topStock ? topStock.item : "No available stock" },
      { label: "Cross-Project Candidates", value: crossProjectCandidates, helper: "Source project differs from target", variant: crossProjectCandidates ? "info" : "" },
    ]);
  }
  body.innerHTML = rows.length ? rows.map((row) => {
    const summaryId = warehouseInventoryId(row);
    const pendingCandidate = row.useTransactions.find(isWarehousePendingUse);
    const topSource = row.topSource ? `${warehouseSourceLabel(row.topSource)} / +${warehouseTransactionQty(row.topSource)}` : "-";
    const potentialTarget = row.potentialTarget ? `${warehouseTargetLabel(row.potentialTarget)} / ${warehouseTransactionQty(row.potentialTarget)} qty` : "-";
    return `
      <tr>
        <td><div class="item-primary">${htmlText(row.item)}</div><div class="reason-text dense-cell-clamp" title="${htmlAttr(row.spec)}">${htmlText(row.spec)}</div></td>
        <td class="cell-number">${row.onHandQty}</td>
        <td class="cell-number">${row.reservedQty}</td>
        <td class="cell-number">${row.availableQty}</td>
        <td><div class="reason-text" title="${htmlAttr(row.topSource ? warehouseTransactionTrace(row.topSource) : "")}">${htmlText(topSource)}</div></td>
        <td><div class="reason-text" title="${htmlAttr(row.potentialTarget ? warehouseTransactionTrace(row.potentialTarget) : "")}">${htmlText(potentialTarget)}</div></td>
        <td>
          <span class="status-pill ${row.pendingQty > 0 ? "warning" : row.availableQty > 0 ? "approved" : "pending"}">${row.status}</span>
          ${row.pendingQty > 0 ? `<div class="reason-text">${row.pendingQty} qty waiting review</div>` : ""}
        </td>
        <td class="cell-action">
          <div class="action-stack">
            ${pendingCandidate && canLockWarehouseSummary(pendingCandidate) ? `<button class="mini approve" data-warehouse-candidate-lock="${htmlAttr(pendingCandidate.id)}" title="${htmlAttr(`${warehouseOwnerLabel(pendingCandidate)} locks this stock-use candidate`)}">Lock</button><button class="mini reject" data-warehouse-candidate-reject="${htmlAttr(pendingCandidate.id)}" title="Reject this stock-use candidate">Reject</button>` : ""}
            ${row.availableQty > 0 ? `<button class="mini approve" data-action="openItemPicker" title="Open Request Worksheet to create an inventory use candidate">Candidate</button>` : ""}
          </div>
        </td>
        <td class="cell-action">
          <div class="action-stack">
            ${itemDetailButton("warehouse", summaryId)}
          </div>
        </td>
      </tr>`;
  }).join("") : `<tr><td colspan="9" class="empty-cell">No warehouse inventory rows for this month.</td></tr>`;
  const ledgerBody = document.getElementById("warehouseInventoryLedgerRows");
  if (ledgerBody) {
    ledgerBody.innerHTML = ledgerRows.length ? ledgerRows.map((row) => {
      const isPending = isWarehousePendingUse(row);
      return `
        <tr>
          <td><span class="status-pill ${isWarehouseStockIn(row) ? "approved" : isPending ? "warning" : warehouseTransactionStatus(row) === "Rejected" ? "rejected" : "info"}">${warehouseTransactionType(row) === "stock-in" ? "Stock In" : isWarehouseLockedUse(row) ? "Locked Use" : warehouseTransactionStatus(row) === "Rejected" ? "Rejected" : "Use Candidate"}</span></td>
          <td><div class="reason-text" title="${htmlAttr(warehouseSourceLabel(row))}">${htmlText(warehouseSourceLabel(row))}</div></td>
          <td><div class="reason-text" title="${htmlAttr(warehouseTargetLabel(row))}">${htmlText(warehouseTargetLabel(row))}</div></td>
          <td><div class="item-primary">${htmlText(row.item)}</div><div class="reason-text dense-cell-clamp" title="${htmlAttr(row.spec)}">${htmlText(row.spec)}</div></td>
          <td class="cell-number">${warehouseTransactionQty(row)}</td>
          <td><span class="status-pill ${isPending ? "warning" : warehouseTransactionStatus(row) === "Rejected" ? "rejected" : "approved"}">${warehouseTransactionStatus(row)}</span></td>
          <td><div class="reason-text">${htmlText(row.confirmedBy || row.createdBy || "-")}</div></td>
          <td><div class="reason-text">${compactTimestamp(row.confirmedAt || row.createdAt || row.updatedAt)}</div></td>
          <td><div class="reason-text" title="${htmlAttr(row.reason || "")}">${htmlText(row.reason || "-")}</div></td>
          <td class="cell-action">
            <div class="action-stack">
              ${isPending && canLockWarehouseSummary(row) ? `<button class="mini approve" data-warehouse-candidate-lock="${htmlAttr(row.id)}">Lock</button><button class="mini reject" data-warehouse-candidate-reject="${htmlAttr(row.id)}">Reject</button>` : ""}
            </div>
          </td>
        </tr>`;
    }).join("") : `<tr><td colspan="10" class="empty-cell">No inventory transactions for this month.</td></tr>`;
  }
}

function canMaintainWarehouseStockForRecord(record = {}) {
  const owner = itemOwnerFor(record);
  if (owner === ITEM_OWNER_OM) return ["om", "omLeader", "omMember", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_MFG) return ["procurement", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_UNIT) return ["dri", "deptDri", "admin"].includes(currentRole);
  return ["admin"].includes(currentRole);
}

function addWarehouseStockRecord() {
  const month = document.getElementById("warehouseMonthFilter")?.value || currentWarehouseMonth;
  const specInput = document.getElementById("warehouseStockSpec");
  const qtyInput = document.getElementById("warehouseStockQty");
  const sourceProjectInput = document.getElementById("warehouseStockSourceProject");
  const sourceStageInput = document.getElementById("warehouseStockSourceStage");
  const sourceStationInput = document.getElementById("warehouseStockSourceStation");
  const selectedRecord = warehouseSelectedStockRecord();
  if (!canMaintainWarehouseStockForRecord(selectedRecord || {})) {
    showToast("Only the item owner can maintain this warehouse stock.", "error");
    return;
  }
  const item = selectedRecord?.name || "";
  const spec = userVisibleItemDetail(selectedRecord || {}) || itemDetail(selectedRecord || {}) || specInput?.value?.trim() || "";
  const qty = qtyInput?.value || "";
  const sourceProject = sourceProjectInput?.value?.trim() || "";
  const sourceStage = sourceStageInput?.value || "";
  const sourceStation = sourceStationInput?.value?.trim() || "";
  if (!item || !spec || !clampQty(qty)) {
    showToast("Select a purchased item and enter stock qty.", "error");
    return;
  }
  warehouseStockRecords = [{
    id: `WH-STOCK-${Date.now()}`,
    transactionType: "stock-in",
    status: "Available",
    month,
    item,
    spec,
    itemOwner: itemOwnerFor(selectedRecord || { name: item, spec }),
    qty: clampQty(qty),
    ownedQty: clampQty(qty),
    sourceProject: sourceProject || currentProject,
    sourceLine: requestCarryoverLine() || "Line 1",
    sourceStage: sourceStage || STAGE_LABELS[currentDeptDemandPhase] || currentDeptDemandPhase,
    sourceStation: sourceStation || "WH",
    sourceRequestId: selectedRecord?.id || "Manual warehouse update",
    sourceRecordId: selectedRecord?.id || "",
    createdBy: roleProfiles[currentRole]?.name || requesterDisplayName(),
    createdAt: new Date().toISOString(),
    reason: `${warehouseOwnerLabel({ item, spec, itemOwner: itemOwnerFor(selectedRecord || { name: item, spec }) })} stock-in update.`,
  }, ...warehouseStockRecords];
  const itemSelect = document.getElementById("warehouseStockItem");
  if (itemSelect) itemSelect.value = "";
  if (specInput) specInput.value = "";
  if (qtyInput) qtyInput.value = "";
  if (sourceProjectInput && !sourceProjectInput.value) sourceProjectInput.value = currentProject;
  if (sourceStationInput) sourceStationInput.value = "CG";
  renderWarehouseMaintenance();
  showToast("Warehouse stock record added.", "success");
}

function updateCarryoverLedgerStatusById(ledgerId, status, reason = "") {
  if (!ledgerId || !window.ProcurementCarryover?.readLedger || !window.ProcurementCarryover?.writeLedger) return;
  const rows = window.ProcurementCarryover.readLedger();
  const updated = rows.map((row) => {
    if (row.id !== ledgerId) return row;
    const carryoverQty = clampQty(row.carryoverQty);
    const originalQty = clampQty(row.originalQty);
    return {
      ...row,
      status,
      reviewStatus: status === "Applied" ? "Approved" : status,
      effectiveQty: status === "Applied" ? Math.max(0, originalQty - carryoverQty) : originalQty,
      confirmedBy: roleProfiles[currentRole]?.name || "Dept DRI",
      confirmedAt: new Date().toISOString(),
      reason: reason || row.reason,
      rejectReason: status === "Rejected" ? (reason || row.rejectReason || "") : row.rejectReason || "",
    };
  });
  window.ProcurementCarryover.writeLedger(updated);
}

function updateWarehouseCandidateStatus(transactionId, decision) {
  const row = warehouseStockRecords.find((record) => record.id === transactionId);
  if (!row || !isWarehousePendingUse(row)) {
    showToast("Warehouse use candidate was not found.", "error");
    return;
  }
  if (!canLockWarehouseSummary(row)) {
    showToast(`Only ${warehouseOwnerLabel(row)} owner can lock or reject this warehouse usage.`, "error");
    return;
  }
  const status = decision === "reject" ? "Rejected" : "Locked Use";
  const transactionType = decision === "reject" ? "use-candidate" : "locked-use";
  const confirmedAt = new Date().toISOString();
  const confirmedBy = roleProfiles[currentRole]?.name || warehouseOwnerLabel(row);
  warehouseStockRecords = warehouseStockRecords.map((record) => record.id === transactionId ? {
    ...record,
    transactionType,
    status,
    confirmedAt,
    confirmedBy,
    reason: decision === "reject" ? `${record.reason || ""} Dept DRI rejected stock usage.`.trim() : record.reason,
  } : record);
  updateCarryoverLedgerStatusById(row.carryoverLedgerId, decision === "reject" ? "Rejected" : "Applied", decision === "reject" ? `${warehouseOwnerLabel(row)} rejected warehouse inventory use.` : "");
  renderWarehouseMaintenance();
  if (typeof renderManagerDemandCostDashboard === "function") renderManagerDemandCostDashboard();
  showToast(decision === "reject" ? "Warehouse use candidate rejected." : "Warehouse use candidate locked.", "success");
}

function lockWarehouseSummary(summaryId) {
  const row = warehouseInventoryFromId(summaryId);
  const candidate = row?.useTransactions?.find(isWarehousePendingUse);
  if (candidate) updateWarehouseCandidateStatus(candidate.id, "lock");
}

function carryoverLedgerIdFor(sourceRequestId = "", sourceBreakdownId = "") {
  const sanitize = (value) => String(value || "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `CO-UA-${sanitize(sourceRequestId)}-${sanitize(sourceBreakdownId)}`;
}

function createWarehouseUseCandidate(suggestion, row, breakdown) {
  if (!suggestion || suggestion.sourceType !== "warehouse" || !row || !breakdown) return;
  const month = warehouseMonthForDemand(row);
  const id = `WH-USE-${row.id}-${breakdown.id}`.replace(/[^A-Za-z0-9_-]+/g, "-");
  const transaction = {
    id,
    transactionType: "use-candidate",
    status: warehousePendingStatusForOwner(itemOwnerFor(row)),
    month,
    item: row.name || suggestion.itemName || "",
    spec: userVisibleItemDetail(row) || itemDetail(row) || suggestion.itemSpec || "",
    itemOwner: itemOwnerFor(row),
    qty: clampQty(suggestion.suggestedQty),
    sourceProject: suggestion.sourceProject || "",
    sourceLine: suggestion.carryoverFrom || "Warehouse",
    sourceStage: suggestion.sourceStage || "",
    sourceStation: suggestion.sourceStation || "",
    sourceRequestId: suggestion.sourceRequestId || "",
    targetProject: row.project || "",
    targetLine: suggestion.requestLine || breakdown.requestLine || "",
    targetStage: STAGE_LABELS[stationBreakdownPhaseKey(breakdown)] || stationBreakdownPhaseKey(breakdown) || "",
    targetStationOrUnit: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? (breakdown.station || "-") : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
    targetRequestId: row.id,
    carryoverLedgerId: carryoverLedgerIdFor(row.id, breakdown.id),
    createdBy: requesterDisplayName(),
    createdAt: new Date().toISOString(),
    reason: suggestion.reason || "Requester created warehouse inventory use candidate.",
  };
  warehouseStockRecords = [transaction, ...warehouseStockRecords.filter((record) => record.id !== id)];
  renderWarehouseMaintenance();
}

function renderNaturalRows() {
  if (!document.getElementById("naturalRows")) return;
  const defaultRows = [...omCatalogRows(currentProject), ...purchaseRecords.filter((row) => row.project === currentProject)].slice(0, 40);
  const rows = naturalSearchActive ? searchResults.filter((row) => row.project === currentProject) : defaultRows;
  const count = document.getElementById("naturalCount");
  if (count) {
    count.textContent = naturalSearchActive
      ? `${rows.length} result${rows.length === 1 ? "" : "s"}`
      : `${rows.length} classified item${rows.length === 1 ? "" : "s"}`;
  }
  document.getElementById("naturalRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td class="cell-identity" title="${htmlAttr([row.name, itemOwnerLabel(row)].filter(Boolean).join(" · "))}">
          <div class="identity-block">
            <span class="identity-primary">${row.name}</span>
            <span class="identity-secondary">${itemOwnerLabel(row)}</span>
          </div>
        </td>
        <td class="cell-spec-summary" title="${htmlAttr(userVisibleItemDetail(row) || "")}">
          <div class="spec-summary">${userVisibleItemDetail(row) || "-"}</div>
        </td>
        <td class="cell-status">${itemOwnerBadgeHtml(row)}<div class="reason-text">${rowSourceLabel(row)}</div></td>
        <td class="cell-action">${itemDetailButton(isOmCatalogRow(row) ? "catalog" : "record", row.id)}</td>
        <td class="cell-action"><button class="mini approve" title="Add item to request" data-add-record="${row.id}">Add</button></td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty-cell">${naturalSearchActive ? "No matching purchase records or OM catalog items." : "No real source items are available for this project."}</td></tr>`;
}

function selectedDemandLineRows() {
  const context = itemPickerDemandContext();
  return requests.filter((row) => row.project === currentProject && row.status === "Draft" && canRequesterEditRequest(row) && requestRowMatchesInputContext(row, context));
}

function selectedDemandLineContext(row) {
  const firstLine = stationBreakdownRowsForDetail(row)[0] || createStationBreakdownEntry(row);
  const demandType = demandTypeFor(firstLine);
  const stationOrUnit = demandType === DEMAND_TYPE_MFG
    ? (firstLine.station || row.station || STATION_MASTER[0])
    : (firstLine.demandUnit || row.demandUnit || DEMAND_UNIT_FALLBACK);
  return {
    demandType,
    phase: stationBreakdownPhaseKey(firstLine) || requestCarryoverPhase(row.project),
    requestLine: firstLine.requestLine || row.requestLine || "Line 1",
    stationOrUnit,
    qty: stationBreakdownRowTotal(firstLine),
    remark: firstLine.remark || "",
    breakdownId: firstLine.id || "",
  };
}

function renderSelectedDemandLines() {
  const body = document.getElementById("itemPickerSelectedDemandLines");
  const footer = document.getElementById("itemPickerFooterContext");
  if (footer) footer.textContent = itemPickerTargetText();
  if (!body) return;
  const rows = selectedDemandLineRows();
  body.innerHTML = rows.length ? rows.map((row) => {
    const context = selectedDemandLineContext(row);
    const scopeText = `${context.demandType} / ${context.requestLine} / ${stageLabel(context.phase)} / ${context.stationOrUnit}`;
    return `
      <tr data-selected-demand-line="${htmlAttr(row.id)}">
        <td class="cell-identity" title="${htmlAttr(scopeText)}">
          <div class="identity-block">
            <span class="identity-primary">${context.demandType} · ${stageLabel(context.phase)}</span>
            <span class="identity-secondary">${context.requestLine} · ${context.stationOrUnit}</span>
          </div>
        </td>
        <td class="cell-identity" title="${htmlAttr(`${row.name || "-"} / ${userVisibleItemDetail(row) || itemDetail(row) || ""}`)}">
          <div class="identity-block">
            <span class="identity-primary">${row.name || "-"}</span>
            <span class="identity-secondary">${userVisibleItemDetail(row) || itemDetail(row) || "-"}</span>
          </div>
        </td>
        <td class="cell-note-summary"><div class="note-summary">${context.qty ? `${context.qty} saved in worksheet` : "Qty starts at 0"}</div></td>
        <td class="cell-action">
          <div class="action-stack">
            <button class="mini reject" title="Remove demand line" data-remove-selected-demand="${htmlAttr(row.id)}">Remove</button>
          </div>
        </td>
      </tr>`;
  }).join("") : `<tr><td colspan="4" class="empty-cell">Choose a demand scope, then add catalog, reused, package, or carryover items here.</td></tr>`;
  renderItemPickerCarryoverSuggestions();
}

function updateSelectedDemandLine(requestId, field, value) {
  requests = requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    if (field === "needDate") {
      const dateValue = String(value || "").trim();
      return { ...row, needDate: dateValue, requiredDeliveryDate: dateValue || row.requiredDeliveryDate };
    }
    const stationBreakdown = stationBreakdownRowsForDetail(row);
    const first = stationBreakdown[0] || createStationBreakdownEntry(row);
    const nextFirst = { ...first };
    if (field === "qty") nextFirst.qty = clampQty(value);
    if (field === "remark") nextFirst.remark = value;
    const nextRows = [normalizeDemandBreakdownCarryover(nextFirst), ...stationBreakdown.slice(1)];
    const nextRow = syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown: nextRows });
    syncUserAppliedCarryoverLedger(nextRow, nextRows[0]);
    return nextRow;
  });
  renderSelectedDemandLines();
  renderRequestRows();
}

function activePhaseText(row) {
  return STAGES
    .map((stage) => `${STAGE_LABELS[stage]} ${requestStageQty(row, stage)}`)
    .filter((text) => !text.endsWith(" 0"))
    .join(" / ") || "No phase qty";
}

function compactItemMeta(row) {
  return [
    projectTypeFor(row.project),
    activePhaseText(row),
    itemOwnerLabel(row),
  ].filter(Boolean).join(" · ");
}

function draftTimelineCell(row) {
  if (row.status !== "Draft") return `<div class="timeline table-timeline">${timelineFor(row)}</div>`;
  return `
    <div class="timeline table-timeline draft-timeline">
      <span class="timeline-step current"><strong>Draft</strong><small>Editable</small></span>
      <span class="timeline-step ${stationBreakdownHasDemand(row) ? "done" : ""}"><strong>Demand</strong><small>${stationBreakdownHasDemand(row) ? "Ready" : "Need qty"}</small></span>
      <span class="timeline-step"><strong>Submit</strong><small>Pending</small></span>
    </div>`;
}

function draftDemandScopeCell(row) {
  const context = selectedDemandLineContext(row);
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  return `
    <div class="item-primary">${context.demandType} · ${stageLabel(context.phase)}</div>
    <div class="reason-text request-compact-meta">${row.project || currentProject} · ${context.requestLine}</div>
    ${context.demandType === DEMAND_TYPE_NON_MFG ? `
      <select class="request-unit-select" data-request-demand-unit="${htmlAttr(row.id)}" ${disabled} aria-label="Demand unit for ${htmlAttr(row.name || "request item")}">
        ${demandUnitOptionsHtml(context.stationOrUnit)}
      </select>` : `<div class="reason-text request-compact-meta">${context.stationOrUnit}</div>`}
    ${amendmentBadgeHtml(row)}`;
}

function draftDemandItemCell(row) {
  const spec = userVisibleItemDetail(row) || itemDetail(row) || "";
  const pendingMaster = row.itemMasterRequestStatus === "Pending Material Review" || row.source === "new-item-master";
  return `
    <div class="request-item-spec-stack" title="${htmlAttr([row.name, spec].filter(Boolean).join("\n"))}">
      <div class="item-primary request-item-name">${htmlText(row.name || "-")}</div>
      ${pendingMaster ? `<div class="request-picker-source-line">${requestWorksheetSourceBadge("Pending Material Review")}</div>` : ""}
      <div class="request-spec-divider" aria-hidden="true"></div>
      <div class="request-spec-summary cell-spec-clamp">${htmlText(spec || "-")}</div>
    </div>`;
}

function requestSourceTraceCell(row) {
  const sourceProject = row.sourceProject || "";
  const sourceLine = row.sourceLine || sourceLineForHistory(row);
  const targetLine = selectedDemandLineContext(row).requestLine;
  const copied = sourceProject && sourceProject !== "OM Catalog";
  if (!copied) return `<span class="reason-text">New draft</span>`;
  return `
    <div class="source-trace-block" title="${htmlAttr(`Target ${row.project || currentProject} / ${targetLine}\nCopied from ${sourceProject} / ${sourceLine}`)}">
      <strong>Target ${htmlText(row.project || currentProject)} / ${htmlText(targetLine)}</strong>
      <span>Copied from ${htmlText(sourceProject)} / ${htmlText(sourceLine)}</span>
      <small>Qty starts at 0</small>
    </div>`;
}

function syncRequestWorksheetContext(overrides = {}) {
  const nextMode = overrides.mode || requestWorksheetMode || itemPickerDemandType || DEMAND_TYPE_MFG;
  requestWorksheetMode = nextMode === DEMAND_TYPE_NON_MFG ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG;
  const nextLine = String(overrides.requestLine || requestWorksheetLine || itemPickerRequestLine || "Line 1");
  requestWorksheetLine = /^Line\s+[1-4]$/i.test(nextLine) ? nextLine.replace(/^line/i, "Line") : "Line 1";
  requestWorksheetAddPhase = STAGES.includes(overrides.phase)
    ? overrides.phase
    : (STAGES.includes(requestWorksheetAddPhase) ? requestWorksheetAddPhase : requestCarryoverPhase(currentProject));
  itemPickerDemandType = requestWorksheetMode;
  itemPickerRequestLine = requestWorksheetLine;
  itemPickerStage = requestWorksheetAddPhase;
  if (requestWorksheetMode === DEMAND_TYPE_MFG) {
    itemPickerStation = STATION_MASTER[0];
    itemPickerDemandUnit = DEMAND_UNIT_FALLBACK;
  } else {
    itemPickerStation = "";
    itemPickerDemandUnit = requestWorksheetColumns(DEMAND_TYPE_NON_MFG)[0] || DEMAND_UNIT_FALLBACK;
  }
  updateRequestCarryover({ project: currentProject, phase: requestWorksheetAddPhase, demandType: requestWorksheetMode });
}

function syncRequestWorksheetTabs() {
  document.querySelectorAll("[data-request-worksheet-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.requestWorksheetTab === requestWorksheetMode);
  });
}

function requestWorksheetColumns(mode = requestWorksheetMode) {
  return mode === DEMAND_TYPE_NON_MFG
    ? QUANTITY_DASHBOARD_UNITS.filter((unit) => unit !== "MFG")
    : STATION_MASTER;
}

function renderRequestWorksheetHead() {
  const head = document.getElementById("requestWorksheetHead");
  if (!head) return;
  syncRequestWorksheetContext();
  const columns = requestWorksheetColumns();
  const phaseColspan = columns.length + 1;
  head.innerHTML = `
    <tr>
      <th class="request-col-item request-sticky-col" rowspan="2">Item / Spec</th>
      ${STAGES.map((stage) => `<th class="request-phase-group-head" colspan="${phaseColspan}">${STAGE_LABELS[stage]}</th>`).join("")}
      <th class="request-col-row-total" rowspan="2">Row Total</th>
      <th class="request-col-hint" rowspan="2">Hint</th>
      <th class="request-col-actions" rowspan="2">Action</th>
    </tr>
    <tr>
      ${STAGES.map((stage) => `
        ${columns.map((column) => `<th class="request-station-head" data-request-head-phase="${stage}" data-request-head-column="${htmlAttr(column)}">${htmlText(column)}</th>`).join("")}
        <th class="request-phase-total-head">${STAGE_LABELS[stage]} Total</th>
      `).join("")}
    </tr>`;
}

function requestInputContextKey(context = itemPickerDemandContext()) {
  const target = context.demandType === DEMAND_TYPE_MFG ? context.station : context.demandUnit;
  return `${context.requestLine || "Line 1"}|||${context.demandType}|||${target || ""}`;
}

function requestBreakdownContextKey(item = {}) {
  const demandType = demandTypeFor(item);
  const target = demandType === DEMAND_TYPE_MFG ? (item.station || STATION_MASTER[0]) : demandUnitFor(item);
  return `${item.requestLine || "Line 1"}|||${demandType}|||${target || ""}`;
}

function requestWorksheetBreakdownMatches(item, { mode = requestWorksheetMode, requestLine = requestWorksheetLine, column = "" } = {}) {
  if ((item.requestLine || "Line 1") !== (requestLine || "Line 1")) return false;
  if (demandTypeFor(item) !== mode) return false;
  if (!column) return true;
  return mode === DEMAND_TYPE_MFG ? item.station === column : demandUnitFor(item) === column;
}

function requestRowMatchesInputContext(row, context = itemPickerDemandContext()) {
  const contextKey = requestInputContextKey(context);
  const rows = stationBreakdownRowsForDetail(row);
  if (!rows.length) return false;
  return rows.some((item) => requestBreakdownContextKey(item) === contextKey);
}

function requesterInputRows() {
  syncRequestWorksheetContext();
  return activeProjectRequests().filter((row) => stationBreakdownRowsForDetail(row).some((item) =>
    requestWorksheetBreakdownMatches(item, { mode: requestWorksheetMode, requestLine: requestWorksheetLine })
  ));
}

function requesterPackageRows() {
  syncRequestWorksheetContext();
  return activeProjectRequests().filter((row) => stationBreakdownRowsForDetail(row).some((item) =>
    (item.requestLine || "Line 1") === requestWorksheetLine
  ));
}

function requestWorksheetRows() {
  return requesterInputRows().sort((left, right) => `${left.name} ${left.id}`.localeCompare(`${right.name} ${right.id}`));
}

function requestMatrixBreakdown(row, stage, context = itemPickerDemandContext()) {
  const contextKey = requestInputContextKey(context);
  return stationBreakdownRowsForDetail(row).find((item) => {
    if (stationBreakdownPhaseKey(item) !== stage) return false;
    return requestBreakdownContextKey(item) === contextKey;
  }) || null;
}

function requestMatrixQty(row, stage, context = itemPickerDemandContext()) {
  return stationBreakdownRowTotal(requestMatrixBreakdown(row, stage, context));
}

function requestMatrixInput(row, stage) {
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  const qty = requestMatrixQty(row, stage);
  return `
    <input ${disabled} class="compact-input request-matrix-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1"
      value="${qty || ""}"
      aria-label="${htmlAttr(`${stageLabel(stage)} qty for ${row.name || "item"}`)}"
      data-request-matrix-qty="${htmlAttr(row.id)}"
      data-request-matrix-stage="${stage}" />`;
}

function requestWorksheetStageCells(row) {
  return STAGES.map((stage) => `<td class="cell-number request-matrix-cell">${requestMatrixInput(row, stage)}</td>`).join("");
}

function requestWorksheetCellContext(column, mode = requestWorksheetMode) {
  return {
    demandType: mode,
    requestLine: requestWorksheetLine || "Line 1",
    station: mode === DEMAND_TYPE_MFG ? column : "",
    demandUnit: mode === DEMAND_TYPE_MFG ? "" : column,
  };
}

function requestWorksheetCellBreakdown(row, phase, column) {
  return stationBreakdownRowsForDetail(row).find((item) =>
    stationBreakdownPhaseKey(item) === phase
    && requestWorksheetBreakdownMatches(item, { mode: requestWorksheetMode, requestLine: requestWorksheetLine, column })
  ) || null;
}

function requestWorksheetCellQty(row, phase, column) {
  return stationBreakdownRowTotal(requestWorksheetCellBreakdown(row, phase, column));
}

function requestWorksheetPhaseTotal(row, phase) {
  return requestWorksheetColumns().reduce((sum, column) => sum + requestWorksheetCellQty(row, phase, column), 0);
}

function requestWorksheetRowTotal(row) {
  return STAGES.reduce((sum, phase) => sum + requestWorksheetPhaseTotal(row, phase), 0);
}

function requestWorksheetQtyInput(row, phase, column) {
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  const qty = requestWorksheetCellQty(row, phase, column);
  return `
    <input ${disabled} class="compact-input request-matrix-input" type="text" inputmode="numeric" pattern="[0-9]*"
      value="${qty}"
      aria-label="${htmlAttr(`${column} ${stageLabel(phase)} qty for ${row.name || "item"}`)}"
      data-request-worksheet-qty="${htmlAttr(row.id)}"
      data-request-worksheet-phase="${phase}"
      data-request-worksheet-column="${htmlAttr(column)}" />`;
}

function sanitizeWorksheetQtyValue(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function focusWorksheetQtyByMeta(meta = {}) {
  if (!meta.requestId) return;
  const selector = `[data-request-worksheet-qty="${CSS.escape(meta.requestId)}"][data-request-worksheet-phase="${CSS.escape(meta.phase || "")}"][data-request-worksheet-column="${CSS.escape(meta.column || "")}"]`;
  document.querySelector(selector)?.focus();
}

function nextWorksheetQtyMeta(currentInput) {
  const inputs = [...document.querySelectorAll("[data-request-worksheet-qty]:not([disabled])")];
  const index = inputs.indexOf(currentInput);
  const next = index >= 0 ? inputs[index + 1] : null;
  return next ? {
    requestId: next.dataset.requestWorksheetQty || "",
    phase: next.dataset.requestWorksheetPhase || "",
    column: next.dataset.requestWorksheetColumn || "",
  } : null;
}

function normalizeWorksheetQtyInput(input, { update = false } = {}) {
  const nextValue = sanitizeWorksheetQtyValue(input.value);
  if (input.value !== nextValue) input.value = nextValue;
  if (update && input.dataset.requestWorksheetQty) {
    updateRequestWorksheetQty(
      input.dataset.requestWorksheetQty,
      input.dataset.requestWorksheetPhase || requestWorksheetAddPhase,
      input.dataset.requestWorksheetColumn || requestWorksheetColumns()[0],
      nextValue
    );
  }
}

function updateRequestWorksheetQty(requestId, phase, column, value) {
  syncRequestWorksheetContext();
  const context = requestWorksheetCellContext(column);
  const qty = clampQty(value);
  requests = requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const existingRows = stationBreakdownRowsForDetail(row);
    const hasMatch = existingRows.some((item) =>
      stationBreakdownPhaseKey(item) === phase
      && requestWorksheetBreakdownMatches(item, { mode: context.demandType, requestLine: context.requestLine, column })
    );
    let stationBreakdown = existingRows.map((item) => {
      if (
        stationBreakdownPhaseKey(item) !== phase
        || !requestWorksheetBreakdownMatches(item, { mode: context.demandType, requestLine: context.requestLine, column })
      ) return item;
      return normalizeDemandBreakdownCarryover({ ...item, qty });
    });
    if (!hasMatch && qty > 0) {
      stationBreakdown = [
        ...stationBreakdown,
        createStationBreakdownEntry(row, {
          phase,
          demandType: context.demandType,
          station: context.station,
          demandUnit: context.demandUnit,
          requestLine: context.requestLine,
          qty,
        }),
      ];
    }
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  });
  renderRequestRows();
  renderSelectedDemandLines();
  renderSubmissionRows();
  renderWarehouseMaintenance();
}

function updateRequestMatrixQty(requestId, stage, value) {
  const context = itemPickerDemandContext();
  const column = context.demandType === DEMAND_TYPE_MFG ? context.station : context.demandUnit;
  updateRequestWorksheetQty(requestId, stage, column, value);
}

function updateRequestDemandUnit(requestId, value) {
  const nextUnit = demandUnitFor({ demandUnit: value });
  requests = requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).map((item) => {
      if (demandTypeFor(item) !== DEMAND_TYPE_NON_MFG) return item;
      return normalizeDemandBreakdownCarryover({ ...item, demandUnit: nextUnit, station: "" });
    });
    return syncRowPhaseQtyFromStationBreakdown({ ...row, demandUnit: nextUnit, stationBreakdown });
  });
  renderRequestRows();
  renderSelectedDemandLines();
}

function requestWorksheetSourceBadge(label) {
  return `<span class="request-source-badge ${statusClass(label)}">${htmlText(label)}</span>`;
}

function requestWorksheetSourceHaystack(row) {
  return normalize([
    row.project,
    row.sourceProject,
    row.name,
    userVisibleItemDetail(row),
    itemDetail(row),
    row.level1,
    row.level2,
    row.level3,
    row.omCategoryLevel1,
    row.omCategoryLevel2,
    row.omCategoryLevel3,
    phaseQtySummary(row),
  ].join(" "));
}

function requestWorksheetMergedSources(query = requestWorksheetAddQuery) {
  const keyword = normalize(query);
  const rawQuery = String(query || "").trim();
  const catalogRows = [...omCatalogRows(currentProject), ...purchaseRecords.filter((row) => row.project === currentProject)]
    .map((row) => ({ type: "catalog", badge: "Catalog", row }));
  const reuseRows = reusableHistoryRows()
    .map((row) => ({ type: "reuse", badge: "Reuse", row }));
  const copyRows = reusableHistoryRows()
    .map((row) => ({ type: "copy", badge: "Copy Demand", row }));
  const seen = new Set();
  const rows = [...catalogRows, ...reuseRows, ...copyRows].filter((item) => {
    const key = `${item.type}:${item.row.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return !keyword || requestWorksheetSourceHaystack(item.row).includes(keyword);
  }).slice(0, 40);
  if (keyword) {
    rows.unshift({
      type: "new",
      badge: "New Item Request",
      row: {
        id: `new:${keyword}`,
        project: currentProject,
        name: rawQuery,
        detail: rawQuery,
        spec: rawQuery,
        sourceProject: currentProject,
      },
    });
  }
  return rows;
}

function requestItemPickerSources() {
  const sources = requestWorksheetMergedSources(requestItemPickerQuery);
  if (requestItemPickerSourceMode === "new") {
    const keyword = requestItemPickerQuery.trim();
    return keyword ? sources.filter((source) => source.type === "new") : [];
  }
  return sources
    .filter((source) => source.type === requestItemPickerSourceMode)
    .filter(requestItemPickerMatchesLevels)
    .slice(0, 40);
}

function requestWorksheetSourceValue(source) {
  return `${source.type}:${source.row.id}`;
}

function sourceFromWorksheetValue(value = "", query = requestItemPickerQuery) {
  return requestWorksheetMergedSources(query).find((source) => requestWorksheetSourceValue(source) === value) || null;
}

function requestItemPickerLevelValues(source) {
  const row = source?.row || {};
  return {
    level1: row.level1 || row.omCategoryLevel1 || "",
    level2: row.level2 || row.omCategoryLevel2 || "",
    level3: row.level3 || row.omCategoryLevel3 || "",
  };
}

function requestItemPickerMatchesLevels(source) {
  const levels = requestItemPickerLevelValues(source);
  return (!requestItemPickerLevel1 || levels.level1 === requestItemPickerLevel1)
    && (!requestItemPickerLevel2 || levels.level2 === requestItemPickerLevel2)
    && (!requestItemPickerLevel3 || levels.level3 === requestItemPickerLevel3);
}

function requestItemPickerLevelPath(source) {
  const levels = requestItemPickerLevelValues(source);
  return [levels.level1, levels.level2, levels.level3].filter(Boolean).join(" / ") || "Lv123 not classified";
}

function requestItemPickerSourceContext(source) {
  if (!source) return "";
  const row = source.row || {};
  if (source.type === "new") return "Create a pending material master request. Similar items must be reviewed before adding.";
  if (source.type === "copy") {
    const scope = [row.sourceProject || row.project || "-", sourceLineForHistory(row), activePhaseText(row)].filter(Boolean).join(" / ");
    const summary = phaseQtySummary(row);
    return summary ? `Copy reference: ${scope}. Source qty: ${summary}. Target qty starts at 0.` : `Copy reference: ${scope}. Target qty starts at 0.`;
  }
  if (source.type === "reuse") {
    const scope = [row.sourceProject || row.project || "-", sourceLineForHistory(row)].filter(Boolean).join(" / ");
    return `Reuse from ${scope}. Target qty starts at 0.`;
  }
  if (isOmCatalogRow(row)) return "OM catalog item. Target qty starts at 0.";
  return "Catalog row. Target qty starts at 0.";
}

function requestItemPickerDetailCell(source) {
  if (!source || source.type === "new") return `<span class="reason-text">Pending review</span>`;
  if (isOmCatalogRow(source.row)) return itemDetailButton("catalog", source.row.id);
  if (requests.some((row) => row.id === source.row.id)) return itemDetailButton("request", source.row.id);
  if (purchaseRecords.some((row) => row.id === source.row.id)) return itemDetailButton("record", source.row.id);
  return `<span class="reason-text">Trace only</span>`;
}

function requestItemPickerRowHtml(source) {
  const value = requestWorksheetSourceValue(source);
  const spec = userVisibleItemDetail(source.row) || itemDetail(source.row) || source.row.spec || "";
  const detailText = `${requestItemPickerLevelPath(source)}\n${requestItemPickerSourceContext(source)}`;
  return `
    <tr data-request-picker-row="${htmlAttr(value)}">
      <td class="cell-action"><button class="mini approve" type="button" data-add-worksheet-source="${htmlAttr(value)}" title="Add item/spec to worksheet">Add</button></td>
      <td class="cell-identity request-picker-item-cell">
        <strong class="request-picker-item-name">${htmlText(source.row.name || "New Item Request")}</strong>
        <div class="request-picker-source-line">${requestWorksheetSourceBadge(source.badge)}</div>
      </td>
      <td class="cell-note-summary request-picker-detail-cell" title="${htmlAttr(detailText)}">
        <div class="request-picker-lv-path">${htmlText(requestItemPickerLevelPath(source))}</div>
        <div class="request-picker-meta-line">${htmlText(requestItemPickerSourceContext(source))}</div>
      </td>
      <td class="cell-spec-summary request-picker-spec-cell" title="${htmlAttr(spec)}"><div class="spec-summary">${htmlText(spec || source.row.detail || "-")}</div></td>
      <td class="cell-action">${requestItemPickerDetailCell(source)}</td>
    </tr>`;
}

function syncRequestItemPickerFilters() {
  const level1 = document.getElementById("requestItemPickerLevel1");
  const level2 = document.getElementById("requestItemPickerLevel2");
  const level3 = document.getElementById("requestItemPickerLevel3");
  if (!level1 || !level2 || !level3) return;
  fillSelect(level1, level1Options(), "All Lv1", requestItemPickerLevel1);
  fillSelect(level2, level2Options(requestItemPickerLevel1), requestItemPickerLevel1 ? "All Lv2" : "Select Lv1 first", requestItemPickerLevel2);
  fillSelect(level3, level3Options(requestItemPickerLevel1, requestItemPickerLevel2), requestItemPickerLevel2 ? "All Lv3" : "Select Lv2 first", requestItemPickerLevel3);
  const newItemMode = requestItemPickerSourceMode === "new";
  level1.disabled = newItemMode;
  level2.disabled = newItemMode || !requestItemPickerLevel1;
  level3.disabled = newItemMode || !requestItemPickerLevel2;
}

function renderRequestItemPicker() {
  const modal = document.getElementById("requestItemPickerModal");
  const target = document.getElementById("requestItemPickerTarget");
  const query = document.getElementById("requestItemPickerQuery");
  const body = document.getElementById("requestItemPickerRows");
  const copyDemandPanel = document.getElementById("requestCopyDemandPanel");
  const copyDemandActive = requestItemPickerSourceMode === "copy";
  if (target) {
    target.textContent = `${currentProject} / ${requestWorksheetLine} / ${requestWorksheetMode}. Add item/spec; all phase qty cells start at 0.`;
  }
  if (query && query.value !== requestItemPickerQuery) query.value = requestItemPickerQuery;
  syncRequestItemPickerFilters();
  document.querySelectorAll("[data-request-picker-source-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.requestPickerSourceTab === requestItemPickerSourceMode);
  });
  if (!body) return;
  if (!modal || modal.hidden) {
    body.innerHTML = "";
    if (copyDemandPanel) copyDemandPanel.hidden = true;
    return;
  }
  if (copyDemandPanel) copyDemandPanel.hidden = !copyDemandActive;
  if (copyDemandActive) renderHistoryPackageRows();
  const rows = requestItemPickerSources();
  body.innerHTML = rows.length
    ? rows.map(requestItemPickerRowHtml).join("")
    : `<tr><td colspan="5" class="empty-cell">${requestItemPickerSourceMode === "new" ? "Type item/spec to start a Material Master Request." : "No matching source rows. Try another source tab, Lv filter, or search text."}</td></tr>`;
}

function openRequestItemPicker() {
  syncRequestWorksheetContext();
  requestItemPickerQuery = "";
  requestItemPickerLevel1 = "";
  requestItemPickerLevel2 = "";
  requestItemPickerLevel3 = "";
  requestItemPickerSourceMode = ["catalog", "reuse", "copy", "new"].includes(requestItemPickerSourceMode) ? requestItemPickerSourceMode : "catalog";
  const modal = document.getElementById("requestItemPickerModal");
  if (modal) modal.hidden = false;
  renderRequestItemPicker();
  document.getElementById("requestItemPickerQuery")?.focus();
}

function closeRequestItemPicker() {
  const modal = document.getElementById("requestItemPickerModal");
  if (modal) modal.hidden = true;
}

function selectedRequestWorksheetSource() {
  const sources = requestWorksheetMergedSources();
  const selected = sources.find((source) => requestWorksheetSourceValue(source) === requestWorksheetSelectedSource) || sources[0] || null;
  requestWorksheetSelectedSource = selected ? requestWorksheetSourceValue(selected) : "";
  return selected;
}

function requestWorksheetSourceOptionsHtml() {
  const sources = requestWorksheetMergedSources();
  if (!sources.length) return `<option value="">Search item/spec to add</option>`;
  selectedRequestWorksheetSource();
  return sources.map((source) => {
    const spec = userVisibleItemDetail(source.row) || itemDetail(source.row) || "";
    const label = `[${source.badge}] ${source.row.name || "-"}${spec ? ` / ${spec}` : ""}`;
    return `<option value="${htmlAttr(requestWorksheetSourceValue(source))}" ${requestWorksheetSourceValue(source) === requestWorksheetSelectedSource ? "selected" : ""}>${htmlText(label)}</option>`;
  }).join("");
}

function requestWorksheetTableColspan() {
  return 1 + STAGES.length * (requestWorksheetColumns().length + 1) + 3;
}

function requestWorksheetPhaseCells(row, phase) {
  return [
    ...requestWorksheetColumns().map((column) => `<td class="cell-number request-matrix-cell">${requestWorksheetQtyInput(row, phase, column)}</td>`),
    `<td class="cell-number request-phase-total-cell"><strong>${requestWorksheetPhaseTotal(row, phase)}</strong></td>`,
  ].join("");
}

function requestWorksheetHintCell(row) {
  const badges = [];
  if (row.itemMasterRequestStatus === "Pending Material Review" || row.source === "new-item-master") badges.push("Pending Material Review");
  else if (row.materialStatus === "New Item Request" || row.source === "new-item-request") badges.push("New Item Request");
  else if (row.sourceProject && row.sourceProject !== currentProject && row.sourceProject !== "OM Catalog") badges.push("Reuse / Copy");
  else if (row.sourceProject === "OM Catalog" || isOmCatalogRow(row)) badges.push("Catalog");
  if (requestWorksheetRowTotal(row) > 0) badges.push("Carryover Detail");
  return badges.length
    ? badges.slice(0, 2).map(requestWorksheetSourceBadge).join("")
    : `<span class="reason-text">Row detail</span>`;
}

function requestWorksheetDataRowHtml(row) {
  return `
    <tr data-request-row="${htmlAttr(row.id)}">
      <td class="cell-spec request-sticky-col">${draftDemandItemCell(row)}</td>
      ${STAGES.map((phase) => requestWorksheetPhaseCells(row, phase)).join("")}
      <td class="cell-number request-row-total-cell"><strong>${requestWorksheetRowTotal(row)}</strong></td>
      <td class="cell-hint">${requestWorksheetHintCell(row)}</td>
      <td class="cell-action">
        <div class="action-stack">
          ${itemDetailButton("request", row.id)}
          ${canRequesterEditRequest(row) ? `<button class="mini reject" data-request-worksheet-remove="${htmlAttr(row.id)}">Remove</button>` : ""}
        </div>
      </td>
    </tr>`;
}

function requestWorksheetSeedBreakdown(record, { phase = requestWorksheetAddPhase, mode = requestWorksheetMode } = {}) {
  const firstColumn = requestWorksheetColumns(mode)[0] || "";
  return createStationBreakdownEntry({ ...record, project: currentProject }, {
    phase,
    demandType: mode,
    station: mode === DEMAND_TYPE_MFG ? firstColumn : "",
    demandUnit: mode === DEMAND_TYPE_MFG ? "" : firstColumn,
    requestLine: requestWorksheetLine,
    qty: 0,
  });
}

function requestWorksheetOverrides(record, source, phases = [requestWorksheetAddPhase]) {
  const zeroStageOverrides = STAGES.reduce((values, stage) => ({ ...values, [stage]: 0 }), {});
  const stationBreakdown = phases.map((phase) => requestWorksheetSeedBreakdown(record, { phase, mode: requestWorksheetMode }));
  return {
    ...zeroStageOverrides,
    project: currentProject,
    projectType: projectTypeFor(currentProject),
    phase: phases[0] || requestWorksheetAddPhase,
    defaultPhase: phases[0] || requestWorksheetAddPhase,
    requestLine: requestWorksheetLine,
    demandType: requestWorksheetMode,
    station: requestWorksheetMode === DEMAND_TYPE_MFG ? requestWorksheetColumns()[0] : "",
    demandUnit: requestWorksheetMode === DEMAND_TYPE_MFG ? "" : requestWorksheetColumns()[0],
    lineOpenDate: stageDateForProject(currentProject, phases[0] || requestWorksheetAddPhase),
    requiredDeliveryDate: requiredDeliveryDateForProject(currentProject, phases[0] || requestWorksheetAddPhase),
    stationBreakdown,
    selected: true,
    requesterReason: `${source.badge} added from worksheet. Quantity starts at 0.`,
    ...(source.type === "new" ? {
      source: "new-item-request",
      sourceProject: "New Item Request",
      sourceRecordId: "",
      materialNo: "",
      materialId: "",
      materialStatus: "New Item Request",
      quoteStatus: "New item",
      requesterReason: "New Item Request from worksheet. Submit carries this row to downstream review.",
    } : source.type === "catalog" && isOmCatalogRow(record) ? {
      sourceProject: "OM Catalog",
      catalogBucket: record.catalogBucket,
      catalogStatus: record.catalogStatus,
    } : reusableReferenceFields(record)),
  };
}

function addWorksheetRow(sourceValue = "") {
  syncRequestWorksheetContext();
  const source = sourceValue ? sourceFromWorksheetValue(sourceValue) : selectedRequestWorksheetSource();
  if (!source) {
    showToast("Search or type an item/spec before adding.", "error");
    return;
  }
  if (source.type === "new") {
    const query = requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || source.row.name || "";
    createNewItemSuggestion({
      query,
      duplicateCandidates: materialDuplicateCandidateRows(query),
    });
    return;
  }
  const record = source.type === "new"
    ? {
      id: `NEW-ITEM-${String(newItemSequence++).padStart(4, "0")}`,
      project: currentProject,
      name: requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || "New Item Request",
      detail: requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || "New item/spec pending review",
      spec: requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || "New item/spec pending review",
      source: "new-item-request",
    }
    : source.row;
  const phases = STAGES;
  const draft = requestFromRecord(record, requestWorksheetOverrides(record, source, phases));
  requests = [draft, ...requests];
  requestWorksheetAddQuery = "";
  requestWorksheetSelectedSource = "";
  requestItemPickerQuery = "";
  renderDepartment();
  renderRequestItemPicker();
  document.getElementById("requestRows")?.closest(".request-worksheet-shell")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast(`${source.badge} added. All phase quantities start at 0.`, "success");
}

function renderRequestRows() {
  syncRequestWorksheetContext();
  syncRequestWorksheetTabs();
  const worksheetRows = requestWorksheetRows();
  const packageRows = requesterPackageRows();
  renderRequestWorksheetHead();
  renderRequesterInputContext();
  const summary = document.getElementById("requestDraftSummary");
  const scopeSummary = document.getElementById("requestWorksheetScopeSummary");
  if (summary) {
    const rowsWithQty = packageRows.filter(stationBreakdownHasDemand);
    summary.textContent = packageRows.length
      ? `${packageRows.length} worksheet item${packageRows.length === 1 ? "" : "s"} on ${requestWorksheetLine} · ${rowsWithQty.length} with qty.`
      : "Use Add Item, then enter at least one non-zero quantity before submitting.";
  }
  if (scopeSummary) {
    const rowsWithQty = worksheetRows.filter(stationBreakdownHasDemand).length;
    scopeSummary.textContent = `${worksheetRows.length} worksheet row${worksheetRows.length === 1 ? "" : "s"} · ${rowsWithQty} with qty`;
  }
  const body = document.getElementById("requestRows");
  if (!body) return;
  body.innerHTML = worksheetRows.length
    ? worksheetRows.map(requestWorksheetDataRowHtml).join("")
    : `<tr><td colspan="${requestWorksheetTableColspan()}" class="empty-cell">No worksheet rows for ${requestWorksheetMode} / ${requestWorksheetLine}. Use Add Item to start.</td></tr>`;
  renderRequestItemPicker();
}

function userDemandOverviewSourceRows() {
  const persona = currentRequesterPersona();
  const personaName = normalize(persona?.name || "");
  const personaEmail = normalize(persona?.email || "");
  return requests.filter((row) => {
    if (row.project !== currentProject) return false;
    if (["Rejected", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status) || isSupersededRequest(row)) return false;
    if (!stationBreakdownHasDemand(row)) return false;
    if (row.status === "Draft") return true;
    if (!personaName && !personaEmail) return true;
    return normalize(row.submittedBy || row.requesterName || "") === personaName
      || normalize(row.email || "") === personaEmail;
  });
}

function userDemandOverviewGroups() {
  return userDemandOverviewSourceRows().map((row) => {
    const phaseTotals = Object.fromEntries(STAGES.map((stage) => [stage, stationBreakdownPhaseTotal(row, stage)]));
    const stationTotals = Object.fromEntries(STAGES.map((stage) => [stage, new Map()]));
    stationBreakdownRowsForDetail(row).forEach((item) => {
      const phase = stationBreakdownPhaseKey(item);
      const qty = stationBreakdownRowTotal(item);
      if (!phase || qty <= 0) return;
      const station = item.station || STATION_MASTER[0];
      stationTotals[phase].set(station, (stationTotals[phase].get(station) || 0) + qty);
    });
    return {
      keyId: row.id,
      row,
      project: row.project,
      item: row.name || "-",
      spec: userVisibleItemDetail(row) || itemDetail(row) || "-",
      requests: new Map([[row.id, row]]),
      statuses: new Set([row.status]),
      phaseTotals,
      stationTotals,
      totalQty: totalQty(row),
      packageId: row.requestPackageId || (row.status === "Draft" ? `DRAFT-${row.project}` : row.id),
      packageLabel: row.requestPackageLabel || (row.status === "Draft" ? "Draft Package" : "Submitted Package"),
    };
  }).sort((left, right) => `${left.packageId} ${left.item}`.localeCompare(`${right.packageId} ${right.item}`));
}

function renderUserDemandOverview() {
  const groups = userDemandOverviewGroups();
  const summary = document.getElementById("userDemandOverviewSummary");
  const badge = document.getElementById("userDemandPackageBadge");
  if (badge) badge.textContent = `${currentProject} package view`;
  if (summary) {
    const packageCount = new Set(groups.map((group) => group.packageId)).size;
    const draftCount = groups.filter((group) => group.row.status === "Draft").length;
    const submittedCount = groups.filter((group) => group.row.status !== "Draft").length;
    summary.innerHTML = summaryCardsHtml([
      { label: "Packages", value: packageCount, helper: "Draft and submitted packages", variant: "hero" },
      { label: "Items", value: groups.length, helper: "Items in your package view" },
      { label: "Total Qty", value: groups.reduce((sum, group) => sum + group.totalQty, 0), helper: "From demand rows" },
      { label: "Draft Items", value: draftCount, helper: "Still editable" },
      { label: "Submitted Items", value: submittedCount, helper: "Visible to Dept DRI and Cost Manager" },
    ]);
  }
  const body = document.getElementById("userDemandOverviewRows");
  if (!body) return;
  body.innerHTML = groups.length
    ? groups.map((group) => `
      <tr>
        <td><strong>${group.packageLabel}</strong><div class="reason-text">${group.packageId}</div></td>
        <td><div class="item-primary">${group.item}</div><div class="reason-text">${group.spec}</div></td>
        <td><span class="status-pill ${statusClass(group.row.status)}">${group.row.status}</span></td>
        ${STAGES.map((stage) => `<td>${managerQuantityPhaseCell(group, stage)}</td>`).join("")}
        <td><strong>${group.totalQty}</strong></td>
        <td class="cell-action">${group.row.status === "Draft" ? `<button class="mini approve" title="Edit demand rows" data-edit-demand="${group.row.id}">Edit</button>` : `<span class="reason-text">Submitted</span>`}</td>
        <td class="cell-action">${itemDetailButton("request", group.row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="12" class="empty-cell">No demand rows for ${currentProject}. Add items and edit demand rows first.</td></tr>`;
}

function sourceRecordForRequest(row) {
  return purchaseRecords.find((record) => record.id === row.sourceRecordId)
    || purchaseRecords.find((record) => record.project === row.project && normalize(record.name) === normalize(row.name) && normalize(itemDetail(record)) === normalize(itemDetail(row)))
    || null;
}

function contactCardHtml(title, contact, helper = "") {
  if (!contact || !(contact.name || contact.email || contact.phone || contact.employeeId)) {
    return `
      <article class="contact-card">
        <h4>${title}</h4>
        <p class="muted">Not provided</p>
        ${helper ? `<div class="reason-text">${helper}</div>` : ""}
      </article>`;
  }
  const email = contact.email || "";
  const phone = normalizedContactPhone(contact.phone);
  return `
    <article class="contact-card">
      <h4>${title}</h4>
      <div class="contact-name">${contact.name || "-"}</div>
      <div class="detail-grid compact-detail-grid">
        ${detailRow("Department", contact.department || "-")}
        ${detailRow("Employee ID", contact.employeeId || "-")}
        ${detailRow("Email", email ? `<a href="mailto:${email}">${email}</a>` : "Not provided")}
        ${detailRow("Phone", phone || "Not provided")}
      </div>
      ${helper ? `<div class="reason-text">${helper}</div>` : ""}
    </article>`;
}

function departmentDriContact(row) {
  const projectType = row.projectType || projectTypeFor(row.project);
  const unitFromBreakdown = stationBreakdownRowsForDetail(row).map((item) => item.demandUnit).find(Boolean);
  const department = canonicalDemandUnit(row.department || unitFromBreakdown || row.process || "");
  return DRI_CONTACT_MASTER.find((contact) =>
    contact.projectType === projectType
    && normalize(contact.department) === normalize(department)
  ) || DRI_CONTACT_MASTER.find((contact) =>
    contact.projectType === projectType
    && normalize(contact.department) === normalize(row.department || "")
  ) || null;
}

function requesterContact(row) {
  const source = sourceRecordForRequest(row) || {};
  return {
    department: row.department || source.department || "",
    name: row.requesterName || row.submittedBy || source.requesterName || "",
    employeeId: row.requesterEmployeeId || source.requesterEmployeeId || "",
    email: row.email || source.email || "",
    phone: row.phone || source.phone || "",
  };
}

function relatedProjectContact(row) {
  const source = purchaseRecords.find((record) =>
    record.project === row.project
    && normalize(record.process) === normalize(row.process)
    && (record.requesterName || record.email)
  );
  return source ? {
    department: source.department || source.process || "",
    name: source.requesterName || "",
    employeeId: source.requesterEmployeeId || "",
    email: source.email || "",
    phone: source.phone || "",
  } : null;
}

function openDriContact(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  const deptContact = departmentDriContact(row);
  const projectContact = relatedProjectContact(row);
  const modal = document.getElementById("managerDetailModal");
  modal?.classList.add("contact-detail-mode");
  document.getElementById("managerDetailTitle").textContent = `Contact DRI · ${row.project} / ${row.name}`;
  document.getElementById("managerDetailStatus").className = "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = "Contact";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>DRI Contact</h4>
          <p class="panel-subcopy">Requester, department DRI, and related project/process contact are kept out of the main table so approval and purchasing stay readable.</p>
        </div>
      </div>
      <div class="contact-card-grid">
        ${contactCardHtml("Requester", requesterContact(row), "From submitted request / G or Non-G request row.")}
        ${contactCardHtml("Department DRI", deptContact, "From DRI input Rq by project type and demand unit / department.")}
        ${contactCardHtml("Project / Process Contact", projectContact, "Best available related contact from source request rows.")}
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <h4>Request Context</h4>
      <div class="detail-grid compact-detail-grid">
        ${detailRow("Request ID", row.id)}
        ${detailRow("Package", row.requestPackageId || "-")}
        ${detailRow("Project Type", row.projectType || projectTypeFor(row.project))}
        ${detailRow("Project", row.project)}
        ${detailRow("Process", row.process || "-")}
        ${detailRow("Demand Unit", stationBreakdownRowsForDetail(row).map((item) => item.demandUnit).filter(Boolean).join(" / ") || row.department || "-")}
      </div>
    </section>`;
  if (modal) modal.hidden = false;
}

function demandEditorRowsFor(row) {
  return stationBreakdownRowsForDetail(row);
}

function openDemandEditor(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  activeDemandRequestId = requestId;
  renderDemandEditor();
  document.getElementById("demandEditorModal").hidden = false;
}

function closeDemandEditor() {
  activeDemandRequestId = "";
  const modal = document.getElementById("demandEditorModal");
  if (modal) modal.hidden = true;
}

function demandEditorSummaryCards(row) {
  const rows = demandEditorRowsFor(row).filter((item) => stationBreakdownRowTotal(item) > 0);
  const phaseTotals = STAGES
    .map((stage) => `${STAGE_LABELS[stage]} ${stationBreakdownPhaseTotal(row, stage)}`)
    .filter((text) => !text.endsWith(" 0"))
    .join(" / ") || "No phase qty";
  const stationTotals = new Map();
  const unitTotals = new Map();
  rows.forEach((item) => {
    const qty = stationBreakdownRowTotal(item);
    const demandType = demandTypeFor(item);
    if (demandType === DEMAND_TYPE_MFG) stationTotals.set(item.station || "-", (stationTotals.get(item.station || "-") || 0) + qty);
    else unitTotals.set(item.demandUnit || "-", (unitTotals.get(item.demandUnit || "-") || 0) + qty);
  });
  return summaryCardsHtml([
    { label: "Total Qty", value: totalQty(row), helper: phaseTotals, variant: "hero" },
    { label: "Demand Rows", value: rows.length, helper: rows.length ? "Rows with qty > 0" : "Add demand rows before submit" },
    { label: "By Station", value: stationTotals.size || "-", helper: compactList(new Set([...stationTotals.entries()].map(([station, qty]) => `${station} ${qty}`)), "No station qty") },
    { label: "By 需求單位", value: unitTotals.size || "-", helper: compactList(new Set([...unitTotals.entries()].map(([unit, qty]) => `${unit} ${qty}`)), "No unit qty") },
  ]);
}

function lineOptionsHtml(selectedValue, blankLabel = "Select line") {
  const selected = String(selectedValue || "");
  const values = ["Line 1", "Line 2", "Line 3", "Line 4"];
  return [
    `<option value="" ${selected ? "" : "selected"}>${blankLabel}</option>`,
    ...values.map((line) => `<option value="${line}" ${line === selected ? "selected" : ""}>${line}</option>`),
  ].join("");
}

function userCarryoverUnitPriceVnd(row) {
  const explicitVnd = Number(row.updatedPriceVnd || row.unitPriceVnd || row.estimatedUnitPriceVnd || 0);
  if (explicitVnd > 0) return explicitVnd;
  const unitPriceUsd = legacyPriceToUsd(row, "updatedPrice")
    || legacyPriceToUsd(row, "unitPrice")
    || legacyPriceToUsd(row, "estimatedUnitPrice");
  if (unitPriceUsd > 0) return Math.round(amountVndFromUsd(unitPriceUsd));
  const estimatedAmountUsd = Number(row.estimatedAmountUsd || 0) || amountUsdFromVnd(clampQty(row.estimatedAmount));
  const qty = totalQty(row) || 1;
  return estimatedAmountUsd > 0 ? Math.round(amountVndFromUsd(estimatedAmountUsd / qty)) : 0;
}

function isValidCarryoverLinePair(requestLine, carryoverFrom) {
  const request = String(requestLine || "").trim();
  const source = String(carryoverFrom || "").trim();
  return Boolean(request && source && request !== source);
}

function demandEditorCarryoverKey(requestId, breakdownId) {
  return `${requestId || ""}:${breakdownId || ""}`;
}

function normalizeDemandBreakdownCarryover(breakdown) {
  const next = { ...breakdown };
  const originalQty = stationBreakdownRowTotal(next);
  next.carryoverQty = Math.min(originalQty, clampQty(next.carryoverQty));
  return next;
}

function demandEditorCarryoverSummary(item) {
  const qty = clampQty(item.carryoverQty);
  const validPair = isValidCarryoverLinePair(item.requestLine, item.carryoverFrom);
  if (qty > 0 && validPair) return `${item.carryoverFrom} → ${item.requestLine} / -${qty}`;
  if (qty > 0 && !validPair) return "Line needed";
  if (item.carryoverFrom) return `${item.carryoverFrom} selected`;
  return "No carryover";
}

function demandEditorCarryoverHint(item) {
  const qty = clampQty(item.carryoverQty);
  if (!qty && !item.carryoverFrom) return "Optional";
  if (!isValidCarryoverLinePair(item.requestLine, item.carryoverFrom)) return "Select different source and request lines";
  return "Candidate only; Dept DRI must confirm";
}

function syncUserAppliedCarryoverLedger(row, breakdown) {
  const normalized = normalizeDemandBreakdownCarryover(breakdown);
  const carryoverQty = isValidCarryoverLinePair(normalized.requestLine, normalized.carryoverFrom)
    ? clampQty(normalized.carryoverQty)
    : 0;
  const sourceBreakdownId = breakdown.id || "";
  if (!sourceBreakdownId || !window.ProcurementCarryover?.recordUserAppliedCarryover) return;
  window.ProcurementCarryover.recordUserAppliedCarryover({
    requestId: row.id,
    rowId: row.id,
    packageId: row.requestPackageId || "",
    sourceRequestId: row.id,
    sourceBreakdownId,
    requestLineRowId: sourceBreakdownId,
    project: row.project,
    item: row.name,
    spec: userVisibleItemDetail(row) || itemDetail(row) || "",
    phase: STAGE_LABELS[stationBreakdownPhaseKey(normalized)] || stationBreakdownPhaseKey(normalized),
    stationOrUnit: demandTypeFor(normalized) === DEMAND_TYPE_MFG ? (normalized.station || "-") : (normalized.demandUnit || DEMAND_UNIT_FALLBACK),
    sourceProject: normalized.carryoverSourceProject || row.sourceProject || row.project || "",
    sourceStage: normalized.carryoverSourceStage || "",
    sourceStation: normalized.carryoverSourceStation || "",
    sourceEvidenceRequestId: normalized.carryoverSourceRequestId || row.sourceRecordId || "",
    sourceType: normalized.carryoverSourceType || "requester-candidate",
    targetProject: row.project,
    targetRequestId: row.id,
    requestLine: normalized.requestLine || "",
    carryoverFrom: normalized.carryoverFrom || "",
    originalQty: stationBreakdownRowTotal(normalized),
    carryoverQty,
    unitPrice: userCarryoverUnitPriceVnd(row),
    unitPriceUsd: amountUsdFromVnd(userCarryoverUnitPriceVnd(row)),
    status: "Requester Candidate",
    reviewStatus: "Pending Dept DRI",
    createdByRole: "Requester",
    confirmedBy: currentRequesterPersona()?.name || roleProfiles[currentRole]?.name || "Requester",
    reason: normalized.carryoverReason || "Requester created carryover candidate from request line editor.",
  });
}

function renderDemandEditorStationUnitCell(item, demandType, disabled, requestId) {
  if (demandType === DEMAND_TYPE_NON_MFG) {
    return `
      <label class="demand-editor-inline-field">
        <span>Unit</span>
        <select ${disabled} data-demand-editor-id="${requestId}" data-demand-editor-row="${item.id}" data-demand-editor-field="demandUnit">
          ${demandUnitOptionsHtml(item.demandUnit)}
        </select>
      </label>`;
  }
  return `
    <label class="demand-editor-inline-field">
      <span>Station</span>
      <select ${disabled} data-demand-editor-id="${requestId}" data-demand-editor-row="${item.id}" data-demand-editor-field="station">
        ${STATION_MASTER.map((station) => `<option value="${station}" ${station === item.station ? "selected" : ""}>${station}</option>`).join("")}
      </select>
    </label>`;
}

function renderDemandEditorCarryoverSection(row, item, disabled) {
  const key = demandEditorCarryoverKey(row.id, item.id);
  const expanded = expandedDemandEditorCarryoverRows.has(key);
  if (!expanded) return "";
  const originalQty = stationBreakdownRowTotal(item);
  const normalized = normalizeDemandBreakdownCarryover(item);
  const warning = clampQty(item.carryoverQty) > 0 && !isValidCarryoverLinePair(item.requestLine, item.carryoverFrom)
    ? "Carryover needs a different source line and request line before Dept DRI can review it."
    : clampQty(item.carryoverQty) > originalQty
      ? `Carryover will be capped at ${originalQty}.`
      : "Candidate only; Dept DRI approved rows reduce effective cost.";
  return `
    <tr class="demand-editor-carryover-row" data-demand-editor-carryover-section="${htmlAttr(key)}">
      <td colspan="8">
        <div class="demand-editor-carryover-panel">
          <label>
            <span>Carryover From</span>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="carryoverFrom">
              ${lineOptionsHtml(item.carryoverFrom, "No carryover")}
            </select>
          </label>
          <label>
            <span>Carryover Qty</span>
            <input ${disabled} class="compact-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="${clampQty(normalized.carryoverQty)}" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="carryoverQty" />
          </label>
          <label class="carryover-reason-field">
            <span>Reason</span>
            <input ${disabled} type="text" value="${htmlAttr(item.carryoverReason || "")}" placeholder="Why can prior line stock cover this demand?" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="carryoverReason" />
          </label>
          <div class="demand-editor-carryover-hint">${htmlText(warning)}</div>
        </div>
      </td>
    </tr>`;
}

function renderDemandEditorMfgGuide(row, rows) {
  const target = document.getElementById("demandEditorMfgGuide");
  if (!target) return;
  const hasMfg = rows.some((item) => demandTypeFor(item) === DEMAND_TYPE_MFG) || !rows.length;
  if (!hasMfg) {
    target.innerHTML = `
      <section class="mfg-demand-guide-card non-mfg-guide">
        <strong>Non-MFG input logic</strong>
        <span>Use demand unit → item. Station is not required.</span>
      </section>`;
    return;
  }
  const activePhase = stationBreakdownPhaseKey(rows[rows.length - 1] || {}) || requestCarryoverPhase(row.project);
  const stationGroups = [
    ["Mainline", ["CG", "BG", "FATP", "Test", "Hybrid", "Auto"]],
    ["Packing", ["ENG Pack", "Zombie", "Laser_pico", "Rework"]],
    ["Supporting", ["Repair", "WH"]],
  ];
  target.innerHTML = `
    <section class="mfg-demand-guide-card">
      <div>
        <strong>MFG input logic: Stage → Station → Item</strong>
        <span class="muted">All Mainline / Packing / Supporting station demand is entered by the requester mapped to this project and department.</span>
      </div>
      <div class="mfg-stage-tabs">
        ${STAGES.map((stage) => `<span class="stage-chip ${stage === activePhase ? "active" : ""}">${STAGE_LABELS[stage]}</span>`).join("")}
      </div>
      <div class="mfg-station-groups">
        ${stationGroups.map(([group, stations]) => `
          <div class="mfg-station-group">
            <span>${group}</span>
            <strong>${stations.join(" / ")}</strong>
          </div>`).join("")}
      </div>
    </section>`;
}

function renderDemandEditor() {
  const row = requests.find((item) => item.id === activeDemandRequestId);
  const modal = document.getElementById("demandEditorModal");
  if (!row || !modal) return;
  document.getElementById("demandEditorTitle").textContent = `${row.name} / Demand Detail`;
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  const rows = demandEditorRowsFor(row);
  const lastRow = rows[rows.length - 1] || {};
  const defaultPhase = stationBreakdownPhaseKey(lastRow) || requestCarryoverPhase(row.project);
  const defaultDemandType = rows.length ? demandTypeFor(lastRow) : lastDemandType;
  document.getElementById("demandEditorContext").textContent = `Project ${row.project} · Default Phase ${stageLabel(defaultPhase)} · Demand Type ${defaultDemandType} · ${userVisibleItemDetail(row) || "No spec"} · Total ${totalQty(row)}`;
  document.getElementById("demandEditorSummary").innerHTML = demandEditorSummaryCards(row);
  renderDemandEditorMfgGuide(row, rows);
  document.getElementById("demandEditorRows").innerHTML = rows.length
    ? rows.map((rawItem) => {
      const item = normalizeDemandBreakdownCarryover(rawItem);
      const phase = stationBreakdownPhaseKey(item) || currentStageForProject(row.project);
      const demandType = demandTypeFor(item);
      const carryoverKey = demandEditorCarryoverKey(row.id, item.id);
      const carryoverSummary = demandEditorCarryoverSummary(item);
      const carryoverHint = demandEditorCarryoverHint(rawItem);
      return `
        <tr class="${demandType === DEMAND_TYPE_NON_MFG ? "non-mfg-demand-row" : ""}">
          <td>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="demandType">
              ${demandTypeOptionsHtml(demandType)}
            </select>
          </td>
          <td>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="phase">
              ${STAGES.map((stage) => `<option value="${stage}" ${stage === phase ? "selected" : ""}>${STAGE_LABELS[stage]}</option>`).join("")}
            </select>
          </td>
          <td>${renderDemandEditorStationUnitCell(item, demandType, disabled, row.id)}</td>
          <td><input ${disabled} class="compact-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="${stationBreakdownRowTotal(item)}" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="qty" /></td>
          <td>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="requestLine">
              ${lineOptionsHtml(item.requestLine, "Request line")}
            </select>
          </td>
          <td>
            <button class="mini demand-editor-carryover-toggle" type="button" data-demand-editor-carryover-toggle="${htmlAttr(carryoverKey)}" title="Edit line carryover">${htmlText(carryoverSummary)}</button>
            <div class="reason-text">${htmlText(carryoverHint)}</div>
          </td>
          <td><input ${disabled} type="text" value="${htmlAttr(item.remark || "")}" placeholder="Remark" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="remark" /></td>
          <td><button class="mini reject" data-remove-station-breakdown="${row.id}" data-remove-station-breakdown-row="${item.id}" ${disabled}>Remove</button></td>
        </tr>
        ${renderDemandEditorCarryoverSection(row, rawItem, disabled)}`;
    }).join("")
    : `<tr><td colspan="8" class="empty-cell">Add demand rows for phase, station or demand unit, and quantity.</td></tr>`;
}

function addDemandEditorRow() {
  if (!activeDemandRequestId) return;
  requests = requests.map((row) => {
    if (row.id !== activeDemandRequestId || !canRequesterEditRequest(row)) return row;
    const existingRows = stationBreakdownRowsForDetail(row);
    const lastRow = existingRows[existingRows.length - 1] || {};
    const stationBreakdown = [
      ...existingRows,
      createStationBreakdownEntry(row, {
        demandType: existingRows.length ? demandTypeFor(lastRow) : lastDemandType,
        phase: stationBreakdownPhaseKey(lastRow) || requestCarryoverPhase(row.project),
        station: lastRow.station || row.station,
        demandUnit: lastRow.demandUnit || row.demandUnit,
      }),
    ];
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  });
  renderDemandEditor();
  renderRequestRows();
}

function updateDemandEditorField(requestId, breakdownId, field, value) {
  requests = requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).map((item) => {
      if (item.id !== breakdownId) return item;
      const next = isLongFormStationBreakdown(item)
        ? { ...item }
        : { id: item.id, phase: currentStageForProject(row.project), station: item.station, demandUnit: item.demandUnit, qty: stationBreakdownRowTotal(item), requestLine: item.requestLine || "", carryoverFrom: item.carryoverFrom || "", carryoverQty: clampQty(item.carryoverQty), carryoverReason: item.carryoverReason || "", remark: item.remark || "" };
      if (field === "qty") next.qty = clampQty(value);
      else if (field === "requestLine") next.requestLine = value;
      else if (field === "carryoverFrom") next.carryoverFrom = value;
      else if (field === "carryoverQty") next.carryoverQty = clampQty(value);
      else if (field === "carryoverReason") next.carryoverReason = value;
      else if (field === "demandType") {
        next.demandType = demandTypeFor({ demandType: value });
        next.station = next.demandType === DEMAND_TYPE_MFG ? (next.station || STATION_MASTER[0]) : "";
        next.demandUnit = next.demandType === DEMAND_TYPE_MFG ? "" : (next.demandUnit || DEMAND_UNIT_FALLBACK);
      }
      else if (field === "demandUnit") next.demandUnit = demandTypeFor(next) === DEMAND_TYPE_MFG ? "" : demandUnitFor({ demandUnit: value });
      else if (field === "phase") next.phase = STAGES.includes(value) ? value : currentStageForProject(row.project);
      else if (field === "station") next.station = demandTypeFor(next) === DEMAND_TYPE_MFG ? (STATION_MASTER.includes(value) ? value : STATION_MASTER[0]) : "";
      else next[field] = value;
      const normalized = normalizeDemandBreakdownCarryover(next);
      updateRequestCarryover({ project: row.project, phase: normalized.phase, demandType: normalized.demandType });
      syncUserAppliedCarryoverLedger(row, normalized);
      return normalized;
    });
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  });
  renderDemandEditor();
  renderRequestRows();
  renderSelectedDemandLines();
  renderSubmissionRows();
}

function renderStationBreakdownRows() {
  const itemSelect = document.getElementById("stationBreakdownItemSelect");
  const stationSelect = document.getElementById("stationStationSelect");
  const demandUnitInput = document.getElementById("stationDemandUnitInput");
  const summary = document.getElementById("stationBreakdownSummary");
  const body = document.getElementById("stationBreakdownRows");
  if (!itemSelect || !stationSelect || !summary || !body) return;
  const editableRows = stationBreakdownRowsForProject();
  const currentSelection = itemSelect.value;
  itemSelect.innerHTML = editableRows.length
    ? editableRows.map((row) => `<option value="${row.id}" ${row.id === currentSelection ? "selected" : ""}>${row.name} · ${factoryMaterialNoFor(row)}</option>`).join("")
    : `<option value="">No editable request items</option>`;
  if (currentSelection && editableRows.some((row) => row.id === currentSelection)) itemSelect.value = currentSelection;
  if (demandUnitInput && !demandUnitInput.value) demandUnitInput.value = DEMAND_UNIT_FALLBACK;
  stationSelect.innerHTML = STATION_MASTER.map((station) => `<option value="${station}">${station}</option>`).join("");
  const breakdownRows = editableRows.flatMap((row) => stationBreakdownRowsForDetail(row).map((breakdown) => ({ request: row, breakdown })));
  const itemTotal = editableRows.reduce((sum, row) => sum + totalQty(row), 0);
  const phaseSummary = STAGES.map((stage) => `${STAGE_LABELS[stage]} ${editableRows.reduce((sum, row) => sum + requestStageQty(row, stage), 0)}`).join(" / ");
  const unitTotals = new Map();
  const stationTotals = new Map();
  breakdownRows.forEach(({ breakdown }) => {
    const qty = stationBreakdownRowTotal(breakdown);
    unitTotals.set(breakdown.demandUnit || DEMAND_UNIT_FALLBACK, (unitTotals.get(breakdown.demandUnit || DEMAND_UNIT_FALLBACK) || 0) + qty);
    stationTotals.set(breakdown.station || STATION_MASTER[0], (stationTotals.get(breakdown.station || STATION_MASTER[0]) || 0) + qty);
  });
  summary.innerHTML = summaryCardsHtml([
    { label: "Items", value: editableRows.length, helper: `${breakdownRows.length} station row${breakdownRows.length === 1 ? "" : "s"}` },
    { label: "Total Qty", value: itemTotal, helper: phaseSummary },
    { label: "By 需求單位", value: unitTotals.size || "-", helper: compactList(new Set([...unitTotals.entries()].map(([unit, qty]) => `${unit} ${qty}`)), "No unit qty") },
    { label: "By Station", value: stationTotals.size || "-", helper: compactList(new Set([...stationTotals.entries()].map(([station, qty]) => `${station} ${qty}`)), "No station qty") },
  ]);
  body.innerHTML = breakdownRows.length
    ? breakdownRows.map(({ request, breakdown }) => `
      <tr>
        <td><div class="item-primary">${request.name}</div><div class="reason-text">${factoryMaterialNoFor(request)}</div></td>
        <td><input type="text" value="${breakdown.demandUnit || DEMAND_UNIT_FALLBACK}" data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="demandUnit" /></td>
        <td>
          <select data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="station">
            ${STATION_MASTER.map((station) => `<option value="${station}" ${station === breakdown.station ? "selected" : ""}>${station}</option>`).join("")}
          </select>
        </td>
        ${STAGES.map((stage) => `<td><input class="compact-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="${clampQty(breakdown[stage])}" data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="${stage}" /></td>`).join("")}
        <td>${stationBreakdownRowTotal(breakdown)}</td>
        <td><input type="text" value="${breakdown.remark || ""}" data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="remark" /></td>
        <td><button class="mini reject" data-remove-station-breakdown="${request.id}" data-remove-station-breakdown-row="${breakdown.id}">Remove</button></td>
      </tr>`).join("")
    : `<tr><td colspan="12" class="empty-cell">Add request items first, then add station breakdown rows for demand unit and station quantity.</td></tr>`;
}

function addStationBreakdownRow(requestId = "", overrides = {}) {
  const targetRequestId = requestId || document.getElementById("stationBreakdownItemSelect")?.value || "";
  if (!targetRequestId) {
    showToast("Add or select a request item before adding station breakdown.", "error");
    return;
  }
  const demandUnit = demandUnitFor({ demandUnit: overrides.demandUnit || document.getElementById("stationDemandUnitInput")?.value || DEMAND_UNIT_FALLBACK });
  const station = overrides.station || document.getElementById("stationStationSelect")?.value || STATION_MASTER[0];
  requests = requests.map((row) => {
    if (row.id !== targetRequestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = [...stationBreakdownRowsForDetail(row), createStationBreakdownEntry(row, { demandUnit, station })];
    return syncRowPhaseQtyFromStationBreakdown({ ...row, demandUnit, stationBreakdown });
  });
  renderDepartment();
  showToast("Station breakdown row added.", "success");
}

function updateStationBreakdownField(requestId, breakdownId, field, value) {
  requests = requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).map((breakdown) => {
      if (breakdown.id !== breakdownId) return breakdown;
      const nextValue = field === "demandUnit" ? demandUnitFor({ demandUnit: value }) : STAGES.includes(field) ? clampQty(value) : value;
      return { ...breakdown, [field]: nextValue };
    });
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  });
  renderStationBreakdownRows();
  renderRequestRows();
  renderSubmissionRows();
}

function removeStationBreakdownRow(requestId, breakdownId) {
  requests = requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).filter((breakdown) => breakdown.id !== breakdownId);
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  });
  renderDepartment();
  if (activeDemandRequestId === requestId) renderDemandEditor();
  showToast("Station breakdown row removed.", "success");
}

function syncReuseModeTabs() {
  if (!["catalog", "reuse", "package"].includes(currentReuseMode)) currentReuseMode = "catalog";
  document.querySelectorAll("[data-reuse-mode-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.reuseModeTab === currentReuseMode);
  });
  document.querySelectorAll("[data-reuse-mode-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.reuseModePanel === currentReuseMode);
  });
}

function reusableHistoryRows() {
  return historyReusableSourceRows().filter((row) =>
    factoryMaterialNoFor(row)
    && (row.poNo || row.buyerPoNo || row.poStatus || ["PO Issued", "Completed"].includes(row.buyerStatus || ""))
  );
}

function sourcePhaseForHistory(row) {
  if (STAGES.includes(row?.phase)) return row.phase;
  if (STAGES.includes(row?.defaultPhase)) return row.defaultPhase;
  const breakdownPhase = stationBreakdownRowsForDetail(row)
    .filter((item) => stationBreakdownRowTotal(item) > 0)
    .map((item) => stationBreakdownPhaseKey(item))
    .find((phase) => STAGES.includes(phase));
  if (breakdownPhase) return breakdownPhase;
  return STAGES.find((stage) => clampQty(row?.[stage]) > 0) || requestCarryoverPhase(row?.project || requestCarryoverProject());
}

function phaseQtySummary(row) {
  if (Array.isArray(row?.stationBreakdown) && row.stationBreakdown.length) {
    return STAGES
      .map((stage) => {
        const qty = stationBreakdownPhaseTotal(row, stage);
        return qty ? `${STAGE_LABELS[stage]} ${qty}` : "";
      })
      .filter(Boolean)
      .join(" / ");
  }
  return STAGES
    .map((stage) => {
      const qty = clampQty(row?.[stage]);
      return qty ? `${STAGE_LABELS[stage]} ${qty}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}

function historyPackageKey(row) {
  const project = row?.project || "Unknown";
  return `${project}::${sourcePhaseForHistory(row)}`;
}

function historyPackageLabel(key) {
  const [project, phase] = String(key || "").split("::");
  return `${project || "Unknown"} / ${stageLabel(phase)} demand copy`;
}

function selectedHistoryPackageRows() {
  const sourceProject = document.getElementById("historyPackageSourceProject")?.value || "";
  const sourcePhase = document.getElementById("historyPackageSourcePhase")?.value || "";
  const sourcePackage = document.getElementById("historyPackageSourcePackage")?.value || "";
  return reusableHistoryRows().filter((row) =>
    (!sourceProject || row.project === sourceProject)
    && (!sourcePhase || sourcePhaseForHistory(row) === sourcePhase)
    && (!sourcePackage || historyPackageKey(row) === sourcePackage)
  );
}

function syncHistoryPackageControls() {
  const projectSelect = document.getElementById("historyPackageSourceProject");
  const phaseSelect = document.getElementById("historyPackageSourcePhase");
  const packageSelect = document.getElementById("historyPackageSourcePackage");
  if (!projectSelect || !phaseSelect || !packageSelect) return;
  const previousProject = projectSelect.value;
  const previousPhase = phaseSelect.value;
  const previousPackage = packageSelect.value;
  const projects = [...new Set(reusableHistoryRows().map((row) => row.project).filter(Boolean))].sort();
  projectSelect.innerHTML = [
    `<option value="">All source projects</option>`,
    ...projects.map((project) => `<option value="${htmlAttr(project)}">${project}</option>`),
  ].join("");
  projectSelect.value = projects.includes(previousProject) ? previousProject : "";
  const phaseOptions = STAGES.filter((stage) => reusableHistoryRows().some((row) =>
    (!projectSelect.value || row.project === projectSelect.value) && sourcePhaseForHistory(row) === stage
  ));
  phaseSelect.innerHTML = [
    `<option value="">All phases</option>`,
    ...phaseOptions.map((stage) => `<option value="${stage}">${stageLabel(stage)}</option>`),
  ].join("");
  phaseSelect.value = phaseOptions.includes(previousPhase) ? previousPhase : "";
  const packageKeys = [...new Set(reusableHistoryRows()
    .filter((row) => (!projectSelect.value || row.project === projectSelect.value)
      && (!phaseSelect.value || sourcePhaseForHistory(row) === phaseSelect.value))
    .map(historyPackageKey))]
    .sort();
  packageSelect.innerHTML = [
    `<option value="">All packages</option>`,
    ...packageKeys.map((key) => `<option value="${htmlAttr(key)}">${historyPackageLabel(key)}</option>`),
  ].join("");
  packageSelect.value = packageKeys.includes(previousPackage) ? previousPackage : "";
}

function renderHistoryPackageRows() {
  syncHistoryPackageControls();
  const targetContext = document.getElementById("historyPackageTargetContext");
  if (targetContext) {
    targetContext.textContent = itemPickerTargetText();
  }
  const rows = selectedHistoryPackageRows();
  const previewCount = document.getElementById("historyPackagePreviewCount");
  if (previewCount) {
    previewCount.textContent = rows.length ? `${rows.length} items ready` : "0 items ready";
  }
  const body = document.getElementById("historyPackageRows");
  if (!body) return;
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td class="cell-identity history-package-item" title="${htmlAttr(`${row.name || "-"} / ${row.project || "-"}`)}">
        <div class="identity-block">
          <span class="identity-primary">${row.name || "-"}</span>
          <span class="identity-secondary">${row.project || "-"}</span>
        </div>
      </td>
      <td class="cell-spec-summary history-package-spec" title="${htmlAttr(itemDetail(row))}"><div class="spec-summary">${itemDetail(row) || "-"}</div></td>
      <td class="cell-note-summary history-package-source" title="${htmlAttr(historyPackageLabel(historyPackageKey(row)))}"><div class="note-summary">${historyPackageLabel(historyPackageKey(row))}</div></td>
      <td class="cell-number">${totalQty(row)}</td>
      <td class="cell-note-summary" title="${htmlAttr(phaseQtySummary(row))}"><div class="note-summary">${phaseQtySummary(row) || "No phase qty"}</div></td>
      <td class="cell-action">${itemDetailButton("record", row.id)}</td>
    </tr>
  `).join("") : `<tr><td colspan="6" class="empty-cell">No copy demand items match the current source filters.</td></tr>`;
}

function sourceLineForHistory(row) {
  const explicit = String(row?.requestLine || row?.sourceLine || row?.lineName || row?.line || "").trim();
  if (/^Line\s+[1-4]$/i.test(explicit)) return explicit.replace(/^line/i, "Line");
  const text = [
    row?.purpose,
    row?.remark,
    row?.requesterReason,
    row?.packageCode,
    row?.budgetNo,
  ].join(" ");
  const match = text.match(/\bline\s*([1-4])\b/i);
  return match ? `Line ${match[1]}` : "Line 1";
}

function renderHistoryRows() {
  const body = document.getElementById("historyRows");
  if (!body) return;
  syncReuseModeTabs();
  const targetContext = document.getElementById("historyTargetContext");
  if (targetContext) {
    targetContext.textContent = itemPickerTargetText();
  }
  const sourceProject = document.getElementById("historySourceProject")?.value || "";
  const sourceRows = historySearchActive ? historyResults : historyReusableSourceRows();
  const rows = sourceRows.filter((row) =>
    factoryMaterialNoFor(row)
    && (row.poNo || row.buyerPoNo || row.poStatus || ["PO Issued", "Completed"].includes(row.buyerStatus || ""))
    && (!sourceProject || row.project === sourceProject)
  );
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td class="cell-action"><button class="mini approve history-add-btn" title="Add Item to Request" data-add-history-record="${row.id}">Add</button></td>
      <td class="cell-identity history-source-project" title="${htmlAttr(row.project || "-")}"><div class="identity-block"><span class="identity-primary">${row.project || "-"}</span></div></td>
      <td class="cell-identity history-item-name" title="${htmlAttr(row.name || "-")}"><div class="identity-block"><span class="identity-primary">${row.name || "-"}</span></div></td>
      <td class="cell-spec-summary history-spec" title="${htmlAttr(itemDetail(row))}"><div class="spec-summary">${itemDetail(row) || "-"}</div></td>
      <td class="cell-number" title="${htmlAttr(`${row.qty || 0} qty / ${phaseQtySummary(row)}`)}"><strong>${row.qty || 0}</strong><div class="reason-text">${phaseQtySummary(row) || sourcePhaseForHistory(row) || "-"}</div></td>
      <td class="cell-action">${itemDetailButton("record", row.id)}</td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty-cell">No reusable history records match this search.</td></tr>`;
  renderHistoryPackageRows();
  renderItemPickerCarryoverSuggestions();
}

function requesterVisibleStatusLabel(status) {
  if (status === OM_WAITING_USER_CONFIRM) return "Waiting User A Confirmation";
  if (status === OM_USER_CONFIRMED) return "Requester Confirmed";
  if (status === USER_CANCELLED_REQUEST) return "Cancelled by Requester";
  if (status === AMENDMENT_WAITING_USER_CONFIRM) return "Waiting User A Amendment Confirmation";
  return status;
}

function omUserQuoteDecisionLabel(row) {
  if (row.userAQuoteDecisionStatus) return requesterVisibleStatusLabel(row.userAQuoteDecisionStatus);
  if (row.finalExportStatus) return row.finalExportStatus;
  return "-";
}

function amendmentVersion(row) {
  return Number(row.amendmentVersion || 1);
}

function amendmentBadgeHtml(row) {
  if (!row.amendmentOf && !row.amendmentStatus) return "";
  const label = row.amendmentOf ? `Amendment v${amendmentVersion(row)}` : row.amendmentStatus;
  return `<span class="status-pill ${statusClass(label)}">${label}</span>`;
}

function amendmentQueueSummaryHtml(row) {
  if (!row.amendmentOf || !row.previousSnapshot) return "";
  return `
    <div class="amendment-queue-summary">
      <div class="amendment-queue-row">
        <span>Before</span>
        <strong>${snapshotPhaseText(row.previousSnapshot)}</strong>
      </div>
      <div class="amendment-queue-row current">
        <span>Now</span>
        <strong>${stageQtyText(row)}</strong>
      </div>
      <div class="amendment-queue-row meta amendment-queue-row-wide">
        <span>Flow</span>
        <strong>${row.amendmentRequestedBy || "Requester"} -> ${row.amendedBy || "OM Purchasing"} -> ${row.amendmentUserConfirmedBy || "Requester"}</strong>
      </div>
    </div>`;
}

function requestSnapshot(row) {
  return {
    id: row.id,
    item: row.name || "",
    materialNo: itemKeyDisplay(row),
    detail: itemDetail(row),
    materialName: partName(row),
    phaseQty: Object.fromEntries(STAGES.map((stage) => [stage, clampQty(row[stage])])),
    totalQty: totalQty(row),
    pasDemandNo: row.pasDemandNo || "",
    pasPartName: pasPartName(row),
    pasBrand: pasBrand(row),
    pasSpec: pasSpec(row),
    finalExportPackageCode: row.finalExportPackageCode || "",
  };
}

function quoteReference(row) {
  const hasQuote = row.vendor || row.vendorPartNo || row.updatedPriceVnd || row.updatedPrice || row.unitPrice || row.quoteDate || row.quotationPdf || row.quotationExcel;
  if (!hasQuote) return null;
  return {
    vendor: row.vendor || "",
    vendorPartNo: row.vendorPartNo || "",
    unitPriceVnd: omUnitPriceVnd(row) || effectiveUnitPrice(row) || 0,
    quoteDate: row.quoteDate || "",
    quotePdf: row.quotationPdf || "",
    quoteExcel: row.quotationExcel || "",
    pasDemandNo: row.pasDemandNo || "",
    capturedAt: new Date().toISOString(),
  };
}

function snapshotPhaseText(snapshot) {
  const qty = snapshot?.phaseQty || {};
  return STAGES
    .map((stage) => `${STAGE_LABELS[stage]} ${clampQty(qty[stage])}`)
    .join(" / ");
}

function amendmentReferenceRows(row) {
  const previous = row.previousSnapshot;
  const quote = row.previousQuoteReference;
  const rows = [];
  if (row.amendmentOf) rows.push(detailRow("Amendment Of", row.amendmentOf));
  if (row.supersededBy) rows.push(detailRow("Superseded By", row.supersededBy));
  if (row.amendmentStatus) rows.push(detailRow("Amendment Status", row.amendmentStatus));
  if (row.amendmentReason) rows.push(detailRow("Amendment Reason", row.amendmentReason));
  if (row.amendmentRequestedBy) rows.push(detailRow("Requested By", row.amendmentRequestedBy));
  if (row.amendmentRequestedAt) rows.push(detailRow("Requested At", fullTimestamp(row.amendmentRequestedAt)));
  if (row.amendedBy) rows.push(detailRow("Amended By", row.amendedBy));
  if (row.amendedAt) rows.push(detailRow("Amended At", fullTimestamp(row.amendedAt)));
  if (row.amendmentUserConfirmedBy) rows.push(detailRow("Requester Confirmed By", row.amendmentUserConfirmedBy));
  if (row.amendmentUserConfirmedAt) rows.push(detailRow("Requester Confirmed At", fullTimestamp(row.amendmentUserConfirmedAt)));
  if (row.amendmentUserRejectedBy) rows.push(detailRow("Requester Rejected By", row.amendmentUserRejectedBy));
  if (row.amendmentUserRejectedAt) rows.push(detailRow("Requester Rejected At", fullTimestamp(row.amendmentUserRejectedAt)));
  if (row.amendmentReworkReason) rows.push(detailRow("Amendment Rework Reason", row.amendmentReworkReason));
  if (row.amendmentSubmittedAt) rows.push(detailRow("Submitted At", fullTimestamp(row.amendmentSubmittedAt)));
  if (row.amendmentApprovedBy) rows.push(detailRow("Approved By", row.amendmentApprovedBy));
  if (row.amendmentApprovedAt) rows.push(detailRow("Approved At", fullTimestamp(row.amendmentApprovedAt)));
  if (previous) {
    rows.push(detailRow("Previous Item", previous.item || "-"));
    rows.push(detailRow("Previous Spec", previous.detail || "-"));
    rows.push(detailRow("Previous Phase Qty", snapshotPhaseText(previous)));
    rows.push(detailRow("Current Phase Qty", stageQtyText(row)));
  }
  if (quote) {
    rows.push(detailRow("Previous Quote Reference", [quote.vendor, quote.quoteDate, quote.quotePdf, quote.quoteExcel].filter(Boolean).join(" / ") || "Captured"));
    rows.push(detailRow("Previous Unit Price", quote.unitPriceVnd ? `${Number(quote.unitPriceVnd).toLocaleString("en-US")} VND` : "-"));
  }
  return rows;
}

function hasPendingAmendment(row) {
  return [
    AMENDMENT_WAITING_OM,
    AMENDMENT_WAITING_USER_CONFIRM,
    AMENDMENT_IN_PROGRESS,
    AMENDMENT_REWORK_REQUIRED,
    AMENDMENT_CONFIRMED,
    AMENDMENT_SUBMITTED,
  ].includes(row.amendmentStatus);
}

function isSupersededRequest(row) {
  return row.amendmentStatus === AMENDMENT_SUPERSEDED || Boolean(row.supersededBy);
}

function isFinalExportLocked(row) {
  return [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus)
    || row.procurementStatus === HANDOFF_SENT_TO_BUYER
    || Boolean(row.buyerStatus || row.buyerReceivedAt);
}

function canUserAAmend(row) {
  return row
    && currentRole === "requester"
    && row.project === currentProject
    && row.status !== "Draft"
    && row.status !== USER_CANCELLED_REQUEST
    && isOmBuyScope(row)
    && Boolean(row.quoteDate || row.quotationPdf || effectiveUnitPrice(row) || row.omStage === "userConfirm" || row.omStage === "finalExport" || isOmRejectReworkRequired(row))
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}

function isPriceReviewReworkRequired(row) {
  return Boolean(row?.priceReviewReworkRequired)
    && row.priceApprovalStatus === PRICE_ESCALATION_REJECTED
    && row.priceDecisionStatus === PRICE_ESCALATION_REJECTED
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}

function isOmRejectReworkRequired(row) {
  return Boolean(row?.omRejectReworkRequired)
    && (row.externalReviewStatus === OM_REJECTED_TO_DRI || row.procurementStatus === EXT_REJECTED_DRI)
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}

function canOmAskUserAAmend(row) {
  return row
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}

function isOmAmendmentWorkingRow(row) {
  return Boolean(row.amendmentOf)
    && [AMENDMENT_WAITING_OM, AMENDMENT_WAITING_USER_CONFIRM, AMENDMENT_REWORK_REQUIRED].includes(row.amendmentStatus);
}

function isUserAAmendmentReviewRow(row) {
  return Boolean(row.amendmentOf) && row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM;
}

function needConfirmationRows() {
  return requests
    .filter((row) => row.project === currentProject
      && (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM || row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM || isPriceReviewReworkRequired(row) || isDeptDriSubmissionReworkRequired(row) || isOmRejectReworkRequired(row)))
    .sort((a, b) => latestRequestActivityTime(b) - latestRequestActivityTime(a));
}

function userQuoteAmountLabel(row) {
  const amount = omAmountVnd(row);
  return amount ? `${amount.toLocaleString("en-US")} VND` : "Amount pending";
}

function quoteAttachmentNames(row) {
  return [omQuoteScreenshotFile(row), row.quotationExcel].filter(Boolean);
}

function quoteAttachmentFileHtml(label, fileName, ready, attachmentId = "", downloadUrl = "") {
  const fileLabel = ready
    ? attachmentLinkHtml(fileName, attachmentId, downloadUrl, { allowDownload: currentRole !== "requester" })
    : htmlText(`No ${label}`);
  return `
    <div class="quote-file-card ${ready ? "ready" : "missing"}">
      <span>${label}</span>
      <strong>${fileLabel}</strong>
    </div>`;
}

function quoteAttachmentListHtml(row) {
  const screenshotFile = omQuoteScreenshotFile(row);
  return `
    <div class="quote-file-list">
      ${quoteAttachmentFileHtml("Screenshot", screenshotFile, Boolean(screenshotFile), row.quotationPdfAttachmentId || row.quotationScreenshotAttachmentId, row.quotationPdfUrl || row.quotationScreenshotUrl)}
      ${quoteAttachmentFileHtml("Excel", row.quotationExcel, Boolean(row.quotationExcel), row.quotationExcelAttachmentId, row.quotationExcelUrl)}
    </div>`;
}

function userQuoteAttachmentStatus(row) {
  const screenshotFile = omQuoteScreenshotFile(row);
  if (screenshotFile && row.quotationExcel) return "Screenshot + Excel uploaded";
  if (screenshotFile) return "Screenshot uploaded";
  if (row.quotationExcel) return "Excel uploaded";
  return "No attachment";
}

function userQuoteInfoBarHtml(row) {
  return `
    <div class="need-confirm-info-bar">
      <span class="need-confirm-info-chip amount">
        <em>Quoted Amount</em>
        <strong>${userQuoteAmountLabel(row)}</strong>
      </span>
      <span class="need-confirm-info-chip">
        <em>Quote Date</em>
        <strong>${row.quoteDate || "-"}</strong>
      </span>
      <span class="need-confirm-info-chip">
        <em>Attachment</em>
        <strong>${userQuoteAttachmentStatus(row)}</strong>
      </span>
    </div>`;
}

function userQuoteStageLabel(row) {
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) return "Waiting your decision";
  if (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) return "Confirmed need";
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST) return "Cancelled by Requester";
  return omUserQuoteDecisionLabel(row);
}

function renderNeedConfirmationRows() {
  const rows = needConfirmationRows();
  const summary = document.getElementById("needConfirmSummary");
  const target = document.getElementById("needConfirmRows");
  if (!summary || !target) return;
  const totalAmount = rows.reduce((sum, row) => sum + omAmountVnd(row), 0);
  const oldest = rows
    .map((row) => requesterConfirmationSentAt(row) || latestRequestActivityTime(row))
    .map((value) => new Date(value || "").getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b)[0];
  const oldestIso = oldest ? new Date(oldest).toISOString() : "";
  const oldestHours = hoursSince(oldestIso);
  const oldestDays = oldestHours !== null && oldestHours > 24 ? Math.floor(oldestHours / 24) : 0;
  summary.innerHTML = summaryCardsHtml([
    { label: "Waiting Confirmation", value: rows.length, helper: `${currentProject} · your action queue`, variant: "hero" },
    { label: "Total Quoted Amount", value: totalAmount ? `${totalAmount.toLocaleString("en-US")} VND` : "0 VND", helper: "Visible quote amount only" },
    { label: "Oldest Waiting", value: oldestHours !== null && oldestHours > 24 ? `Overdue ${oldestDays}d` : oldest ? compactTimestamp(oldestIso) : "-", helper: oldestHours !== null && oldestHours > 24 ? "Needs your confirmation first" : "First item waiting for decision", variant: oldestHours !== null && oldestHours > 24 ? "warning" : "" },
  ]);
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const waitingAt = requesterConfirmationSentAt(row) || latestRequestActivityTime(row);
      const waitingHours = hoursSince(waitingAt);
      const overdue = waitingHours !== null && waitingHours > 24;
      const overdueDays = overdue ? Math.floor(waitingHours / 24) : 0;
	      if (isDeptDriSubmissionReworkRequired(row) || isPriceReviewReworkRequired(row)) {
	        const submissionRework = isDeptDriSubmissionReworkRequired(row);
	        return `
      <article class="need-confirm-card price-rework-card ${overdue ? "need-confirm-overdue" : ""}">
        <div class="need-confirm-main">
          <div class="need-confirm-taskbar">
            <span class="status-pill rejected">${submissionRework ? "Dept DRI Submission Rejected" : "Price / Budget Review Rejected"}</span>
            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Revise required"}</span>
          </div>
          <h4>${row.name}</h4>
          <p>${row.deptDriReviewRejectReason || row.priceEscalationRejectReason || "Dept DRI / Budget Approver rejected this request. Revise before resubmitting."}</p>
          <div class="need-confirm-meta">
            <span>Project <strong>${row.project}</strong></span>
            <span>Total Qty <strong>${totalQty(row)}</strong></span>
            <span>Rejected By <strong>${row.deptDriReviewRejectedBy || row.priceEscalationRejectedBy || "-"}</strong></span>
          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <span class="reason-text">Create a change request to revise item, spec, quantity, or budget reason. The original decision and reject reason stay in audit history.</span>
        </div>
        <div class="need-confirm-actions">
          <button class="mini return" data-usera-amend="${row.id}">Revise Request</button>
          ${itemDetailButton("request", row.id)}
        </div>
	      </article>
	    `;
	      }
	      if (isOmRejectReworkRequired(row)) {
	        return `
	      <article class="need-confirm-card price-rework-card ${overdue ? "need-confirm-overdue" : ""}">
	        <div class="need-confirm-main">
	          <div class="need-confirm-taskbar">
	            <span class="status-pill rejected">OM Rework Required</span>
	            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Revise required"}</span>
	          </div>
	          <h4>${row.name}</h4>
	          <p>${row.omRejectReason || row.externalRejectReason || "OM Purchasing rejected this row. Revise the request before resubmitting."}</p>
	          <div class="need-confirm-meta">
	            <span>Project <strong>${row.project}</strong></span>
	            <span>Total Qty <strong>${totalQty(row)}</strong></span>
	            <span>Rejected By <strong>${row.omRejectedBy || row.externalRejectOwner || "OM Purchasing"}</strong></span>
	          </div>
	          ${userQuoteInfoBarHtml(row)}
	        </div>
	        <div class="need-confirm-quote">
	          <span class="reason-text">Create a change request to revise item, spec, quantity, need date, or budget reason. OM rejection stays in audit history.</span>
	        </div>
	        <div class="need-confirm-actions">
	          <button class="mini return" data-usera-amend="${row.id}">Revise Request</button>
	          ${itemDetailButton("request", row.id)}
	        </div>
	      </article>
	    `;
	      }
	      return row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM ? `
      <article class="need-confirm-card amendment-card ${overdue ? "need-confirm-overdue" : ""}">
        <div class="need-confirm-main">
          <div class="need-confirm-taskbar">
            <span class="status-pill ${statusClass(AMENDMENT_WAITING_USER_CONFIRM)}">Revised Request Confirmation</span>
            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Action required"}</span>
          </div>
          <h4>${row.name}</h4>
          <p>${row.amendmentReason || "OM Purchasing updated this request and needs your confirmation before it goes back to Dept DRI."}</p>
          <div class="need-confirm-meta">
            <span>Project <strong>${row.project}</strong></span>
            <span>Total Qty <strong>${totalQty(row)}</strong></span>
            <span>Revised <strong>${row.amendedAt ? compactTimestamp(row.amendedAt) : "-"}</strong></span>
          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <div class="amendment-compare-card">
            <div class="amendment-compare-row">
              <span>Before</span>
              <strong>${snapshotPhaseText(row.previousSnapshot)}</strong>
            </div>
            <div class="amendment-compare-row current">
              <span>Now</span>
              <strong>${stageQtyText(row)}</strong>
            </div>
          </div>
        </div>
        <div class="need-confirm-actions">
          <button class="mini approve" data-usera-amend-confirm="${row.id}">Confirm Revised Request</button>
          <button class="mini reject" data-usera-amend-reject="${row.id}">Reject Amendment</button>
          ${itemDetailButton("request", row.id)}
        </div>
      </article>
    ` : `
      <article class="need-confirm-card ${overdue ? "need-confirm-overdue" : ""}">
        <div class="need-confirm-main">
          <div class="need-confirm-taskbar">
            <span class="status-pill waiting-user-a-confirmation">${userQuoteStageLabel(row)}</span>
            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Action required"}</span>
          </div>
          <h4>${row.name}</h4>
          <p>${userVisibleItemDetail(row) || "No detail/spec provided."}</p>
          <div class="need-confirm-meta">
            <span>Project <strong>${row.project}</strong></span>
            <span>Total Qty <strong>${totalQty(row)}</strong></span>
            <span>Quote Date <strong>${row.quoteDate || "-"}</strong></span>
          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <span class="reason-text">Confirm only whether this item is still needed.</span>
        </div>
        <div class="need-confirm-actions">
          <button class="mini approve" data-usera-quote-confirm="${row.id}">Confirm Need</button>
          <button class="mini return" data-usera-amend="${row.id}">Request Change</button>
          <button class="mini reject" data-usera-quote-cancel="${row.id}">Cancel Request</button>
          ${itemDetailButton("request", row.id)}
        </div>
      </article>
    `;
    }).join("")
    : `<div class="empty-state">No quote confirmation is waiting for your action.</div>`;
}

function compactTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function hoursSince(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  return (Date.now() - timestamp) / 3600000;
}

function fullTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-US");
}

function compactDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function historyTimestamp(row, action) {
  const events = [
    ...handoffHistory.filter((event) => event.requestId === row.id),
    ...omHistory.filter((event) => event.requestId === row.id),
  ].filter((event) => event.action === action);
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).at(-1)?.timestamp || "";
}

function requesterConfirmationSentAt(row) {
  return historyTimestamp(row, "Sent to Requester for confirmation")
    || historyTimestamp(row, "Sent to User A for confirmation");
}

function timelineMilestones(row) {
  const modelMilestones = workflowStatusForRow(row, "requester").timelineMilestones;
  if (modelMilestones?.length) return modelMilestones;
  const poDoneEvent = latestExternalProgressEvent(row);
  const pasDemandNoDone = Boolean(row.pasDemandNo);
  const quoteReadyDone = omReadyForBuyer(row)
    || isOmWaitingUserConfirm(row)
    || isOmUserConfirmed(row)
    || ["userConfirm", "finalExport"].includes(row.omStage)
    || [OM_READY_FOR_CFA, OM_READY_FOR_ECS, OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus);
  const amendmentStep = row.amendmentStatus ? [{
    key: "amendment",
    label: row.amendmentOf ? "Amendment" : "Amend Req",
    done: Boolean(row.amendmentStatus),
    pending: [AMENDMENT_WAITING_OM, AMENDMENT_WAITING_USER_CONFIRM, AMENDMENT_IN_PROGRESS, AMENDMENT_REWORK_REQUIRED, AMENDMENT_SUBMITTED].includes(row.amendmentStatus),
    blocked: row.amendmentStatus === AMENDMENT_SUPERSEDED,
    at: row.amendmentApprovedAt || row.amendmentSubmittedAt || row.amendmentUserConfirmedAt || row.amendedAt || row.amendmentRequestedAt,
  }] : [];
  return [
    ...amendmentStep,
    { key: "submitted", label: "Submitted", done: ["Submitted", "Approved", "Rejected", "Reported", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status), at: row.submittedAt },
    { key: "approved", label: row.status === "Rejected" ? "Rejected" : "Approved", done: ["Approved", "Reported", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status), blocked: row.status === "Rejected", at: row.decidedAt },
    { key: "pasDemandNo", label: "PAS Demand No", done: pasDemandNoDone, pending: isPasRequired(row) && ["Approved", "Reported"].includes(row.status) && !pasDemandNoDone, at: row.pasDemandNoUpdatedAt || row.pasResultReceivedAt || historyTimestamp(row, "PAS Demand No recorded") },
    { key: "quoteReady", label: "Quote Ready", done: quoteReadyDone, pending: row.omStage === "pasResult" && !quoteReadyDone, at: row.quoteReadyAt || historyTimestamp(row, "Saved quote info") || requesterConfirmationSentAt(row) },
    { key: "userConfirm", label: row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST ? "Cancelled" : "Requester Confirm", done: [OM_WAITING_USER_CONFIRM, OM_USER_CONFIRMED, USER_CANCELLED_REQUEST].includes(row.userAQuoteDecisionStatus), pending: row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM, blocked: row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST, at: row.userAQuoteDecisionAt || requesterConfirmationSentAt(row) },
    { key: "finalExport", label: "Export Package", done: [OM_READY_FOR_CFA, OM_READY_FOR_ECS, OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus), pending: [OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus), at: row.finalExportedAt || historyTimestamp(row, `Marked for ${row.finalExportTarget}`) },
    { key: "buyer", label: "Buyer Received", done: Boolean(row.buyerStatus || row.buyerReceivedAt || [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus)), at: row.buyerReceivedAt || row.finalExportedAt },
    { key: "poDone", label: "PO Done", done: [BUYER_PO_ISSUED, BUYER_COMPLETED].includes(row.buyerStatus) || [EXT_PO_ISSUED, EXT_COMPLETED].includes(externalStatusFor(row)), at: poDoneEvent?.createdAt },
  ];
}

function timelineStepHtml(item) {
  const stateClass = item.blocked ? "blocked" : item.pending ? "current" : item.done ? "done" : "";
  const timeLabel = item.at ? compactTimestamp(item.at) : item.done ? "Done" : "Pending";
  const title = item.at ? fullTimestamp(item.at) : timeLabel;
  return `
    <span class="timeline-step ${stateClass}" title="${title}">
      <strong>${item.label}</strong>
      <small>${timeLabel}</small>
    </span>`;
}

function latestRequestActivityTime(row) {
  const directDates = [
    row.submittedAt,
    row.decidedAt,
    row.sentToOmAt,
    row.userAQuoteDecisionAt,
    row.finalExportedAt,
    row.buyerReceivedAt,
    row.amendmentRequestedAt,
    row.amendedAt,
    row.amendmentSubmittedAt,
    row.amendmentApprovedAt,
  ];
  const historyDates = [
    ...handoffHistory.filter((event) => event.requestId === row.id).map((event) => event.timestamp),
    ...omHistory.filter((event) => event.requestId === row.id).map((event) => event.timestamp),
    ...externalProgressEventsFor(row).map((event) => event.createdAt),
  ];
  return [...directDates, ...historyDates]
    .map((value) => new Date(value || "").getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0] || 0;
}

function renderUserQuoteActionCell(row) {
  if (!isOmBuyScope(row)) return "-";
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) {
    return `
      <div class="quote-confirm-card quote-confirm-compact">
        <span class="status-pill waiting-user-a-confirmation">Action Required</span>
        <div class="quote-confirm-meta">
          <strong>${userQuoteAmountLabel(row)}</strong>
          <span>Quote Date ${row.quoteDate || "-"}</span>
          <span>${userQuoteAttachmentStatus(row)}</span>
        </div>
      </div>
      <div class="table-actions quote-confirm-actions">
        <button class="mini return" data-action="openNeedConfirmation">Open Action Required</button>
      </div>`;
  }
  return `<span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>`;
}

function submissionCurrentStatus(row) {
  const modelLabels = workflowStatusForRow(row, "requester").statusLabels;
  if (modelLabels?.length) return modelLabels;
  const statuses = [
    row.amendmentStatus || "",
    row.status === "Submitted" ? "Submitted to Dept DRI" : row.status,
    pasDisplayStatus(row),
    row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM ? "Action Required" : "",
    row.userAQuoteDecisionStatus === OM_USER_CONFIRMED ? "Need Confirmed" : "",
    row.finalExportStatus || "",
    buyerStatusFor(row) !== "-" ? buyerStatusFor(row) : "",
    externalStatusFor(row) !== "-" ? externalStatusFor(row) : "",
  ].filter(Boolean);
  return [...new Set(statuses)].slice(0, 3);
}

function submissionActionStatusCell(row) {
  if (row.amendmentStatus === AMENDMENT_WAITING_OM) {
    return `
      <span class="status-pill ${statusClass(AMENDMENT_WAITING_OM)}">${AMENDMENT_WAITING_OM}</span>
      <div class="reason-text">${row.amendmentReason || "Revision requested."}</div>
      <button class="mini return" data-usera-amend="${row.id}">View Change Request</button>`;
  }
  if (row.amendmentStatus === AMENDMENT_IN_PROGRESS) {
    return `<span class="status-pill ${statusClass(AMENDMENT_IN_PROGRESS)}">${AMENDMENT_IN_PROGRESS}</span><div class="reason-text">OM Purchasing is revising this request.</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM) {
    return `
      <span class="status-pill ${statusClass(AMENDMENT_WAITING_USER_CONFIRM)}">${AMENDMENT_WAITING_USER_CONFIRM}</span>
      <div class="reason-text">Open Action Required to review OM's revised request.</div>
      <button class="mini return" data-action="openNeedConfirmation">Review</button>`;
  }
  if (row.amendmentStatus === AMENDMENT_REWORK_REQUIRED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_REWORK_REQUIRED)}">${AMENDMENT_REWORK_REQUIRED}</span><div class="reason-text">${row.amendmentReworkReason || "Waiting OM revision update."}</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_CONFIRMED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_CONFIRMED)}">${AMENDMENT_CONFIRMED}</span><div class="reason-text">Resubmitting to Dept DRI.</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_SUBMITTED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_SUBMITTED)}">${AMENDMENT_SUBMITTED}</span><div class="reason-text">Waiting Dept DRI review.</div>`;
  }
  if (row.amendmentStatus === AMENDMENT_SUPERSEDED) {
    return `<span class="status-pill ${statusClass(AMENDMENT_SUPERSEDED)}">${AMENDMENT_SUPERSEDED}</span><div class="reason-text">${row.supersededBy || "-"}</div>`;
  }
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) {
    return `
      <span class="status-pill waiting-user-a-confirmation">Action Required</span>
      <div class="reason-text">${userQuoteAmountLabel(row)} · ${userQuoteAttachmentStatus(row)}</div>
      <button class="mini return" data-action="openNeedConfirmation">Review</button>`;
  }
  if (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) {
    return `<span class="status-pill approved">Need Confirmed</span>`;
  }
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST) {
    return `<span class="status-pill rejected">Cancelled</span><div class="reason-text">${row.userAQuoteCancelReason || "-"}</div>`;
  }
  if (canUserAAmend(row)) {
    return `
      <span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>
      <div class="table-actions quote-confirm-actions">
        <button class="mini return" data-usera-amend="${row.id}">Request Change</button>
      </div>`;
  }
  return `<span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>`;
}

function submissionEstimateVarianceCell(row) {
  const rows = estimateVarianceDisplayRows(row);
  if (!rows.length) return `<span class="reason-text">Quote pending</span>`;
  const delta = row.estimateDeltaUsd;
  const deltaText = delta === null || delta === undefined ? "-" : `${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)} USD`;
  return `
    <span class="status-pill ${statusClass(row.estimateVarianceStatus || "Within Estimate Range")}">${row.estimateVarianceStatus || "Within Estimate Range"}</span>
    <div class="reason-text">${deltaText}</div>`;
}

function renderSubmissionRows() {
  const userRows = new Map(userDemandOverviewSourceRows().map((row) => [row.id, row]));
  requests
    .filter((row) => row.project === currentProject && row.status !== "Draft")
    .forEach((row) => userRows.set(row.id, row));
  const rows = [...userRows.values()]
    .sort((a, b) => {
      const latestA = latestRequestActivityTime(a);
      const latestB = latestRequestActivityTime(b);
      if (latestA !== latestB) return latestB - latestA;
      return b.id.localeCompare(a.id);
    });

  document.getElementById("submissionRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>
          <div class="item-primary">${row.name}</div>
          <div class="reason-text">${userVisibleItemDetail(row) || partName(row) || "-"}</div>
        </td>
        <td>${totalQty(row)}</td>
        <td><div class="submission-status-stack">${submissionCurrentStatus(row).map((status) => `<span class="status-pill ${statusClass(status)}">${status}</span>`).join("")}</div>${row.managerReason ? `<div class="reason-text">${row.managerReason}</div>` : ""}</td>
        <td>${submissionEstimateVarianceCell(row)}</td>
        <td class="cell-action">${row.status === "Draft" ? `<button class="mini approve" title="Edit demand rows" data-edit-demand="${row.id}">Edit</button>` : submissionActionStatusCell(row)}</td>
        <td class="cell-timeline">${row.status === "Draft" ? draftTimelineCell(row) : `<div class="timeline table-timeline">${timelineFor(row)}</div>`}</td>
        <td class="cell-action">${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="9" class="empty-cell">No draft or submitted demand for ${currentProject} yet.</td></tr>`;
}

function timelineFor(row) {
  return timelineMilestones(row).map(timelineStepHtml).join("");
}

function managerAuditTimelineEvents(row) {
  const sourceDateEvents = [
    row.requiredDeliveryDate ? {
      action: "Required Date",
      actor: "Requester Timeline",
      note: "Demand required date from source worksheet.",
      timestamp: row.requiredDeliveryDate,
      source: "G Project",
    } : null,
    row.requestDeadline ? {
      action: "Request Deadline",
      actor: "Requester Timeline",
      note: "Request deadline from source worksheet.",
      timestamp: row.requestDeadline,
      source: "G Project",
    } : null,
    (row.etaPlan || row.eta) ? {
      action: "ETA Plan",
      actor: "Procurement Progress",
      note: "Estimated arrival date from source worksheet.",
      timestamp: row.etaPlan || row.eta,
      source: "G Project",
    } : null,
    (row.dtaActual || row.actualEta) ? {
      action: "DTA / Actual Arrival",
      actor: "Procurement Progress",
      note: "Actual arrival date from source worksheet.",
      timestamp: row.dtaActual || row.actualEta,
      source: "G Project",
    } : null,
  ].filter(Boolean);

  const directEvents = [
    row.submittedAt ? {
      action: "Submitted to Dept DRI",
      actor: row.submittedBy || row.requesterName || "Requester",
      note: `${row.project} request submitted for Dept DRI review.`,
      timestamp: row.submittedAt,
      source: "Request",
    } : null,
    row.decidedAt ? {
      action: row.status === "Rejected" ? "Rejected to DRI" : "Approved by Dept DRI",
      actor: row.decidedBy || row.deptDriSubmissionApprovedBy || "Dept DRI",
      note: row.managerReason || row.rejectReason || "Decision recorded.",
      timestamp: row.decidedAt,
      source: "Manager",
    } : null,
    row.sentToOmAt ? {
      action: "Sent to OM Purchasing",
      actor: row.sentToOmBy || "System",
      note: "Approved OM buy demand routed to OM Purchasing.",
      timestamp: row.sentToOmAt,
      source: "Handoff",
    } : null,
    row.userAQuoteDecisionAt ? {
      action: row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST ? "Requester cancelled request" : "Requester confirmed need",
      actor: row.userAQuoteDecisionBy || "Requester",
      note: row.userAQuoteCancelReason || "Requester quote decision recorded.",
      timestamp: row.userAQuoteDecisionAt,
      source: "Requester",
    } : null,
    row.finalExportedAt ? {
      action: `Exported to ${row.finalExportTarget || "CFA/ECS"}`,
      actor: row.finalExportedBy || "OM Purchasing",
      note: row.finalExportStatus || "Final export completed.",
      timestamp: row.finalExportedAt,
      source: "OM",
    } : null,
    row.buyerReceivedAt ? {
      action: "Buyer Received",
      actor: row.buyerReceivedBy || "Buyer",
      note: row.buyerStatus || "Buyer PR / PO follow-up started.",
      timestamp: row.buyerReceivedAt,
      source: "Buyer",
    } : null,
  ].filter(Boolean);

  const handoffEvents = handoffHistory
    .filter((event) => event.requestId === row.id)
    .map((event) => ({
      action: event.action,
      actor: event.actor || "System",
      note: event.note || [event.route, event.exportTarget].filter(Boolean).join(" / "),
      timestamp: event.timestamp,
      source: "Handoff",
    }));

  const omEvents = omHistory
    .filter((event) => event.requestId === row.id)
    .map((event) => ({
      action: event.action,
      actor: event.actor || "OM Purchasing",
      note: event.note || "",
      timestamp: event.timestamp,
      source: "OM",
    }));

  const externalEvents = externalProgressEventsFor(row)
    .map((event) => ({
      action: event.status || event.step || "External progress",
      actor: event.createdBy || event.owner || "Buyer",
      note: event.reason || event.pastedExternalResult || event.evidenceFileName || event.externalRequestNo || "",
      timestamp: event.createdAt,
      source: event.owner || event.externalSystem || "External",
    }));

  return [...sourceDateEvents, ...directEvents, ...handoffEvents, ...omEvents, ...externalEvents]
    .filter((event) => event.timestamp && !Number.isNaN(new Date(event.timestamp).getTime()))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function managerAuditTimelineHtml(row) {
  const events = managerAuditTimelineEvents(row);
  if (!events.length) return `<div class="empty-state">No timeline event has been recorded yet.</div>`;
  return `
    <div class="manager-audit-timeline">
      ${events.map((event) => `
        <article class="om-timeline-event audit-timeline-event">
          <div class="om-timeline-head">
            <span class="status-pill ${statusClass(event.action)}">${event.action}</span>
            <strong>${event.actor}</strong>
          </div>
          <p>${event.note || "-"}</p>
          <small>${event.source} · ${fullTimestamp(event.timestamp)}</small>
        </article>
      `).join("")}
    </div>`;
}

function stationBreakdownDetailHtml(row) {
  const rows = stationBreakdownRowsForDetail(row);
  if (!rows.length) return `<div class="empty-state">No station breakdown has been entered for this request.</div>`;
  return `
    <div class="table-wrap compact-wrap">
      <table class="data-table manager-progress-detail-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Phase</th>
            <th>Station</th>
            <th>需求單位</th>
            <th>Qty</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          ${rows.flatMap((item) => {
            if (isLongFormStationBreakdown(item)) return [item];
            return STAGES
              .filter((stage) => clampQty(item[stage]) > 0)
              .map((stage) => ({ ...item, phase: stage, qty: clampQty(item[stage]) }));
          }).map((item) => `
            <tr>
              <td>${demandTypeFor(item)}</td>
              <td>${STAGE_LABELS[stationBreakdownPhaseKey(item)] || "-"}</td>
              <td>${item.station || "-"}</td>
              <td>${item.demandUnit || DEMAND_UNIT_FALLBACK}</td>
              <td>${stationBreakdownRowTotal(item)}</td>
              <td>${item.remark || "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function runNaturalSearch() {
  naturalSearchActive = true;
  const query = normalize(document.getElementById("naturalQuery").value);
  const level1 = document.getElementById("naturalLevel1").value;
  const level2 = document.getElementById("naturalLevel2").value;
  const level3 = document.getElementById("naturalLevel3").value;
  const sourceRows = [...purchaseRecords, ...omCatalogRows(currentProject)];
  const seen = new Set();
  searchResults = sourceRows.filter((row) => {
    const enriched = applyOmResponsibility(row);
    const haystack = normalize([
      row.project,
      row.name,
      userVisibleItemDetail(row),
      partName(row),
      enriched.omCategoryLevel1,
      enriched.omCategoryLevel2,
      enriched.omCategoryLevel3,
      row.level1,
      row.level2,
      row.level3,
    ].join(" "));
    const key = `${row.source}-${row.id}`;
    const matched = row.project === currentProject
      && (!query || haystack.includes(query))
      && (!level1 || enriched.omCategoryLevel1 === level1 || row.level1 === level1)
      && (!level2 || enriched.omCategoryLevel2 === level2 || row.level2 === level2)
      && (!level3 || enriched.omCategoryLevel3 === level3 || row.level3 === level3);
    if (!matched || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  renderNaturalRows();
}

function filterRecordsFromControls(prefix) {
  const query = normalize(document.getElementById(`${prefix}Query`).value);
  const level1 = document.getElementById(`${prefix}Level1`).value;
  const level2 = document.getElementById(`${prefix}Level2`).value;
  const level3 = document.getElementById(`${prefix}Level3`).value;
  const sourceProject = document.getElementById(`${prefix}SourceProject`)?.value || "";
  const sourceRows = prefix === "history" ? historyReusableSourceRows() : purchaseRecords;
  return sourceRows.filter((row) => {
    const haystack = normalize([
      row.project,
      row.partNo,
      factoryMaterialNoFor(row),
      row.pasMaterialNo,
      row.name,
      itemDetail(row),
      partName(row),
      row.vendor,
      row.level1,
      row.level2,
      row.level3,
    ].join(" "));
    return (prefix === "history" ? (!sourceProject || row.project === sourceProject) : row.project === currentProject)
      && (!query || haystack.includes(query))
      && (!level1 || row.level1 === level1)
      && (!level2 || row.level2 === level2)
      && (!level3 || row.level3 === level3);
  });
}

function runHistorySearch() {
  historySearchActive = true;
  historyResults = filterRecordsFromControls("history");
  renderHistoryRows();
}

function historyReusableSourceRows() {
  const completedRequests = requests.filter((row) =>
    factoryMaterialNoFor(row)
    && (row.buyerStatus === BUYER_PO_ISSUED || row.buyerStatus === BUYER_COMPLETED || row.poNo || row.buyerPoNo)
  );
  return [...purchaseRecords, ...completedRequests];
}

function reusableHistoryRecordById(recordId) {
  return historyReusableSourceRows().find((row) => row.id === recordId)
    || purchaseRecords.find((row) => row.id === recordId)
    || requests.find((row) => row.id === recordId);
}

function clearNaturalSearch() {
  document.getElementById("naturalQuery").value = "";
  syncCascade("natural", { level1: "", level2: "", level3: "" });
  searchResults = [];
  naturalSearchActive = false;
  renderNaturalRows();
}

function clearHistorySearch() {
  document.getElementById("historyQuery").value = "";
  document.getElementById("historySourceProject").value = "";
  syncCascade("history", { level1: "", level2: "", level3: "" });
  historyResults = [];
  historySearchActive = false;
  renderHistoryRows();
}

function addRecord(recordId) {
  const record = purchaseRecords.find((row) => row.id === recordId) || omCatalogRows(currentProject).find((row) => row.id === recordId);
  if (!record) return;
  const context = itemPickerDemandContext();
  const targetProject = context.targetProject;
  const targetPhase = context.targetPhase;
  const zeroStageOverrides = STAGES.reduce((values, stage) => ({ ...values, [stage]: 0 }), {});
  const draft = requestFromRecord(record, {
    ...zeroStageOverrides,
    project: targetProject,
    phase: targetPhase,
    defaultPhase: targetPhase,
    demandType: context.demandType,
    station: context.station,
    demandUnit: context.demandUnit,
    stationBreakdown: [createStationBreakdownEntry({ ...record, project: targetProject }, {
      phase: targetPhase,
      demandType: context.demandType,
      station: context.station,
      demandUnit: context.demandUnit,
      requestLine: context.requestLine,
      qty: 0,
    })],
    selected: true,
    ...(isOmCatalogRow(record) ? {
      sourceProject: "OM Catalog",
      catalogBucket: record.catalogBucket,
      catalogStatus: record.catalogStatus,
      requesterReason: "Selected from central OM Buy catalog; OM Purchasing will confirm final spec/model where needed.",
    } : {
      requesterReason: "Selected from source item; station breakdown quantity must be entered by Requester / IE.",
    }),
  });
  requests = [draft, ...requests];
  updateRequestCarryover({ project: targetProject, phase: targetPhase, demandType: context.demandType });
  renderDepartment();
  renderSelectedDemandLines();
  showToast(`Added to ${targetProject} / ${context.requestLine}. Enter qty in the Request Worksheet.`, "success");
}

function addHistoryRecord(recordId, useSourceQty = false) {
  const record = reusableHistoryRecordById(recordId);
  if (!record) return;
  const context = itemPickerDemandContext();
  const targetProject = context.targetProject;
  const targetPhase = context.targetPhase;
  const draft = requestFromRecord(record, historyRequestOverrides(record, useSourceQty, context));
  requests = [draft, ...requests];
  updateRequestCarryover({ project: targetProject, phase: targetPhase, demandType: context.demandType });
  setDeptTab("request");
  renderDepartment();
  renderSelectedDemandLines();
  showToast(useSourceQty
    ? `Copied source quantity to ${targetProject} / ${context.requestLine} / ${stageLabel(targetPhase)}.`
    : `Added item identity to ${targetProject} / ${context.requestLine} / ${stageLabel(targetPhase)}. Quantity starts at 0.`,
  "success");
}

function maintenanceSuggestionFromRow(record, { mode = "Maintain Existing Material", useSourceQty = false, targetRequestId = "" } = {}) {
  const suggestion = {
    id: `NIS-${String(newItemSequence++).padStart(4, "0")}`,
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

function createMaintenanceDraftFromRecord(record, { mode = "Maintain Existing Material", useSourceQty = false, open = true, targetRequestId = "" } = {}) {
  const suggestion = maintenanceSuggestionFromRow(record, { mode, useSourceQty, targetRequestId });
  newItemSuggestions = [suggestion, ...newItemSuggestions];
  newItemSelections = new Set([suggestion.id]);
  if (open) {
    setView("department");
    setDeptTab("request");
    openMaterialEntry(suggestion.id);
  }
  return suggestion;
}

function createMaintenanceDraftFromRequest(row, { open = true } = {}) {
  return createMaintenanceDraftFromRecord({
    ...row,
    id: row.sourceRecordId || row.id,
    project: row.sourceProject || row.project,
  }, {
    open,
    targetRequestId: row.id,
  });
}

function cloneReusableDemandRows(record, {
  useSourceQty = true,
  targetProject = requestCarryoverProject(),
  targetPhase = requestCarryoverPhase(targetProject),
  requestLine = itemPickerRequestLine,
  demandType = lastDemandType,
  station = itemPickerStation,
  demandUnit = itemPickerDemandUnit,
} = {}) {
  if (useSourceQty && Array.isArray(record?.stationBreakdown) && record.stationBreakdown.length) {
    return record.stationBreakdown.map((item) => createStationBreakdownEntry({ ...record, ...item, project: targetProject }, {
      phase: targetPhase,
      demandType,
      station,
      demandUnit,
      requestLine,
      qty: stationBreakdownRowTotal(item),
      remark: item.remark || "",
    }));
  }
  if (useSourceQty) {
    const rows = stationBreakdownFromRecord({ ...record, project: targetProject });
    const retargetedRows = rows.map((row) => createStationBreakdownEntry({ ...record, ...row, project: targetProject }, {
      phase: targetPhase,
      demandType,
      station,
      demandUnit,
      requestLine,
      qty: stationBreakdownRowTotal(row),
      remark: row.remark || "",
    }));
    if (retargetedRows.some((row) => stationBreakdownRowTotal(row) > 0)) return retargetedRows;
  }
  return [createStationBreakdownEntry({ ...record, project: targetProject }, {
    phase: targetPhase,
    demandType,
    station,
    demandUnit,
    requestLine,
    qty: 0,
  })];
}

function reusableReferenceFields(record) {
  const sourcePhase = sourcePhaseForHistory(record);
  const sourceLine = sourceLineForHistory(record);
  return {
    sourceProject: record.project,
    sourceLine,
    sourceRecordId: record.id,
    sourcePackageId: historyPackageKey(record),
    sourcePhase,
    sourcePoNo: record.poNo || record.buyerPoNo || "",
  };
}

function historyRequestOverrides(record, useSourceQty = true, {
  targetProject = requestCarryoverProject(),
  targetPhase = requestCarryoverPhase(targetProject),
  requestLine = itemPickerRequestLine,
  demandType = lastDemandType,
  station = itemPickerStation,
  demandUnit = itemPickerDemandUnit,
} = {}) {
  const stageOverrides = useSourceQty
    ? {}
    : STAGES.reduce((values, stage) => ({ ...values, [stage]: 0 }), {});
  const referenceBreakdown = cloneReusableDemandRows(record, { useSourceQty, targetProject, targetPhase, requestLine, demandType, station, demandUnit });
  return {
    ...stageOverrides,
    project: targetProject,
    projectType: projectTypeFor(targetProject),
    phase: targetPhase,
    defaultPhase: targetPhase,
    requestLine,
    demandType,
    station,
    demandUnit,
    lineOpenDate: stageDateForProject(targetProject, targetPhase),
    requiredDeliveryDate: requiredDeliveryDateForProject(targetProject, targetPhase),
    ...reusableReferenceFields(record),
    requestId: "",
    factoryMaterialNo: "",
    sourceFactoryMaterialNo: factoryMaterialNoFor(record),
    materialNo: "",
    pasMaterialNo: "",
    pasDemandNo: "",
    vendor: "",
    vendorPartNo: "",
    quoteDate: "",
    quoteExpiry: "",
    quotationPdf: "",
    quoteExcel: "",
    updatedPrice: "",
    buyerPoNo: "",
    poNo: "",
    poStatus: "",
    buyerStatus: "",
    actualUnitPrice: "",
    actualAmount: "",
    poActualAmount: "",
    stationBreakdown: referenceBreakdown,
    selected: true,
    requesterReason: `Added from ${record.project} / ${sourceLineForHistory(record)} approved history. Source quantity kept as reference only.`,
  };
}

function distributeQtyAcrossRows(rows, totalQtyValue) {
  const total = clampQty(totalQtyValue);
  if (!rows.length) return [];
  const weights = rows.map((row) => stationBreakdownRowTotal(row));
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  if (!weightTotal) return rows.map((row, index) => ({ ...row, qty: index === 0 ? total : 0 }));
  let used = 0;
  return rows.map((row, index) => {
    const qty = index === rows.length - 1
      ? Math.max(0, total - used)
      : Math.floor(total * (weights[index] / weightTotal));
    used += qty;
    return { ...row, qty };
  });
}

function copyHistory(useSourceQty = false) {
  const selectedRecords = [...historySelections]
    .map((id) => reusableHistoryRecordById(id))
    .filter(Boolean);
  if (!selectedRecords.length) {
    showToast("Select at least one history item first.", "error");
    return;
  }
  const maintenanceRows = [];
  const context = itemPickerDemandContext();
  const selected = selectedRecords.map((row) => requestFromRecord(row, historyRequestOverrides(row, useSourceQty, context)));
  if (selected.length) requests = [...selected, ...requests];
  historySelections.clear();
  if (maintenanceRows.length === 1) {
    createMaintenanceDraftFromRecord(maintenanceRows[0], { useSourceQty });
    showToast(selected.length
      ? "Ready history items were added. Complete the remaining legacy item before it enters Request."
      : "Complete this legacy item before it can be added to Request.", "info");
    return;
  }
  if (maintenanceRows.length > 1) {
    const suggestions = maintenanceRows.map((row) => createMaintenanceDraftFromRecord(row, { useSourceQty, open: false }));
    openMaterialBatch(suggestions.map((row) => row.id));
    showToast(selected.length
      ? "Ready history items were added. Standardize the remaining legacy items in the workbench."
      : "Standardize the selected legacy items before they enter Request.", "info");
    return;
  }
  updateRequestCarryover({ project: context.targetProject, phase: context.targetPhase, demandType: context.demandType });
  setDeptTab("request");
  renderDepartment();
  renderSelectedDemandLines();
  showToast("Selected history items added to Request with zero quantity.", "success");
}

function importHistoryPackage() {
  const sourceRows = selectedHistoryPackageRows();
  if (!sourceRows.length) {
    showToast("No copy demand items match the current source filters.", "error");
    return;
  }
  const context = itemPickerDemandContext();
  const targetProject = context.targetProject;
  const targetPhase = context.targetPhase;
  const imported = sourceRows.map((row) => requestFromRecord(row, historyRequestOverrides(row, false, context)));
  requests = [...imported, ...requests];
  updateRequestCarryover({ project: targetProject, phase: targetPhase, demandType: context.demandType });
  setDeptTab("request");
  renderDepartment();
  renderSelectedDemandLines();
  closeRequestItemPicker();
  showToast(`Copied ${imported.length} demand item identities to ${targetProject} / ${context.requestLine}. Quantity starts at 0.`, "success");
}

function requestPackageNeedDateValue() {
  return document.getElementById("requestPackageNeedDate")?.value || "";
}

function saveRequesterDraft() {
  const rows = requesterPackageRows();
  const now = new Date().toISOString();
  requests = requests.map((row) => rows.some((item) => item.id === row.id) ? { ...row, draftSavedAt: now } : row);
  renderRequestRows();
  renderSelectedDemandLines();
  showToast(rows.length ? `${rows.length} worksheet item${rows.length === 1 ? "" : "s"} saved.` : "No worksheet items on this line yet.", rows.length ? "success" : "info");
}

function submitRequests() {
  const visibleRows = requesterPackageRows().filter(canRequesterEditRequest);
  const selectedRows = visibleRows.filter(stationBreakdownHasDemand);
  const packageNeedDate = requestPackageNeedDateValue();
  if (!visibleRows.length) {
    showToast("Add at least one item/spec before submitting to Dept DRI.", "error");
    return;
  }
  if (!selectedRows.length) {
    showToast("Add at least one phase quantity before submitting to Dept DRI.", "error");
    return;
  }
  if (!packageNeedDate) {
    showToast("Need Date is required before submitting this demand package.", "error");
    return;
  }
  if (selectedRows.some((row) => !isMaintenanceComplete(row) && !isMaterialNoPending(row))) {
    showToast("Complete material information for legacy rows before submitting to Dept DRI.", "error");
    return;
  }
  let submitted = 0;
  const now = new Date().toISOString();
  const packageId = `PKG-${currentProject}-${now.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const requesterPersona = currentRequesterPersona();
  const submittedIds = new Map(selectedRows.map((row) => [
    row.id,
    row.id.startsWith("REQ-") && !row.id.startsWith("DRAFT-") ? row.id : `REQ-${String(requestSequence++).padStart(4, "0")}`,
  ]));
  const amendmentSubmissions = selectedRows
    .filter((row) => row.amendmentOf)
    .map((row) => ({ sourceId: row.amendmentOf, newId: submittedIds.get(row.id) }));
  requests = requests.map((row) => {
    if (selectedRows.some((item) => item.id === row.id)) {
      submitted += 1;
      const newId = submittedIds.get(row.id);
      return syncRowPhaseQtyFromStationBreakdown({
        ...row,
        id: newId,
        selected: false,
        status: "Submitted",
        managerReason: "",
        ...deptDriSubmissionReviewPatch(now),
        requestPackageId: row.requestPackageId || packageId,
        requestPackageLabel: row.requestPackageLabel || `${currentProject} Demand Package`,
        submittedAt: now,
        submittedBy: requesterPersona?.name || roleProfiles[currentRole]?.name || "Requester",
        needDate: packageNeedDate,
        requiredDeliveryDate: packageNeedDate,
        requiredDeliveryDateDri: packageNeedDate,
        requestDeadline: row.requestDeadline || packageNeedDate,
        requesterName: row.requesterName || requesterPersona?.name || "",
        requesterEmployeeId: row.requesterEmployeeId || requesterPersona?.employeeId || "",
        email: row.email || requesterPersona?.email || "",
        phone: row.phone || requesterPersona?.phone || "",
        department: row.department || requesterPersona?.department || row.department || "",
        ...(row.amendmentOf ? {
          amendmentStatus: AMENDMENT_SUBMITTED,
          amendmentSubmittedAt: now,
          amendedBy: roleProfiles[currentRole]?.name || "Requester",
          amendedAt: row.amendedAt || now,
        } : {}),
      });
    }
    const amendment = amendmentSubmissions.find((item) => item.sourceId === row.id);
    if (amendment) {
      return {
        ...row,
        amendmentStatus: AMENDMENT_SUBMITTED,
        supersededBy: amendment.newId,
        omSelected: false,
      };
    }
    return row;
  });
  amendmentSubmissions.forEach((item) => {
    const source = requests.find((row) => row.id === item.sourceId);
    const amendment = requests.find((row) => row.id === item.newId);
    if (source) addHandoffHistory(source, "Amendment submitted to Dept DRI", item.newId);
    if (amendment) addHandoffHistory(amendment, "Amendment submitted to Dept DRI", amendment.amendmentReason || "Requester submitted amendment.");
  });
  requests
    .filter((row) => [...submittedIds.values()].includes(row.id))
    .forEach((row) => {
      addHandoffHistory(row, "Need date submitted", needDateForRow(row));
      addHandoffHistory(row, "Submitted to Dept DRI", "Dept DRI must approve before OM Leader intake.");
      if (isTemporaryBudgetRequest(row)) {
        addHandoffHistory(row, "Temporary Budget submitted", "Dept DRI initial approval is required before OM quote/bidding.");
      }
    });
  setDeptTab("submissions");
  const managerProjectFilter = document.getElementById("managerProjectFilter");
  if (managerProjectFilter) managerProjectFilter.value = "";
  renderManager();
  showToast(`${submitted} item${submitted === 1 ? "" : "s"} submitted to Dept DRI.`, "success");
}

function completeSelectedMaterials() {
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

function updateStage(requestId, stage, value) {
  requests = requests.map((row) => row.id === requestId ? { ...row, [stage]: clampQty(value) } : row);
  renderRequestRows();
  renderDeptStageTracking();
  renderManagerStageTracking();
  renderSubmissionRows();
}

function removeRequest(requestId) {
  requests = requests.filter((row) => row.id !== requestId || !canRequesterEditRequest(row));
  if (activeDemandRequestId === requestId) closeDemandEditor();
  renderDepartment();
  renderSelectedDemandLines();
  showToast("Request line removed.", "success");
}

function createNewItemSuggestion(seed = {}) {
  const rawSeed = typeof seed === "string" ? { query: seed } : (seed || {});
  const query = String(rawSeed.query || "").trim();
  const duplicateCandidates = Array.isArray(rawSeed.duplicateCandidates) ? rawSeed.duplicateCandidates : [];
  const suggestion = {
    id: `NIS-${String(newItemSequence++).padStart(4, "0")}`,
    mode: "New Material",
    project: currentProject,
    name: query,
    standardNameCn: query,
    standardNameEn: "",
    standardNameVn: "",
    detail: "",
    spec: "",
    structuredSpec: "",
    uom: "",
    estimatedUnitPrice: 0,
    estimatedAmount: 0,
    budgetRemark: "",
    estimateReason: "",
    level1: "",
    level2: "",
    level3: "",
    useCase: "",
    duplicateDifference: "",
    evidenceReference: "",
    duplicateCandidates,
    status: "Draft",
    managerReason: "",
    requestId: "",
    masterRecordId: "",
    materialStatus: "",
    standardNameStatus: "",
    submittedAt: "",
    decidedAt: "",
  };
  newItemSuggestions = [suggestion, ...newItemSuggestions];
  newItemSelections = new Set([suggestion.id]);
  setView("department");
  setDeptTab("request");
  closeItemPicker();
  closeRequestItemPicker();
  openMaterialEntry(suggestion.id);
}

function canRequesterEditSuggestion(row) {
  return ["requester", "admin"].includes(currentRole) && row && row.status === "Draft";
}

function validateNewItem(values) {
  if (!values.level1 || !values.level2 || !values.level3) {
    showToast("LV1, LV2, and LV3 are required before adding to Request.", "error");
    return false;
  }
  if (!values.standardNameCn || !values.standardNameEn || !values.standardNameVn || !values.detail || !values.spec || !values.structuredSpec || !values.uom || !values.useCase) {
    showToast("Part name CN/EN/VN, detail, spec summary, structured spec, UOM, and reason / use case are required.", "error");
    return false;
  }
  if (!clampQty(values.estimatedUnitPrice) || !clampQty(values.estimatedAmount) || !(values.estimateReason || values.budgetRemark)) {
    showToast("Estimated unit price, estimated amount, and estimate reason are required for a new material request.", "error");
    return false;
  }
  if ((values.duplicateCandidates || []).length && (!values.duplicateDifference || !values.evidenceReference)) {
    showToast("Potential duplicate items found. Add the difference reason and evidence/reference before submitting.", "error");
    return false;
  }
  if (!exactStandardPart(values) && values.standardNameStatus !== MATERIAL_STANDARD_NAME_REQUESTED) {
    showToast("Select a matching Standard Part Name after LV123, or propose a new standard name after searching.", "error");
    return false;
  }
  return true;
}

function optionTags(options, value, placeholder) {
  return [`<option value="">${placeholder}</option>`, ...options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`)].join("");
}

function updateNewItemField(id, field, value) {
  newItemSuggestions = newItemSuggestions.map((row) => {
    if (row.id !== id || !canRequesterEditSuggestion(row)) return row;
    const normalizedValue = ["estimatedUnitPrice", "estimatedAmount"].includes(field) ? clampQty(value) : value;
    const next = { ...row, [field]: normalizedValue };
    if (field === "level1") {
      next.level2 = "";
      next.level3 = "";
      next.standardNameCn = "";
      next.standardNameEn = "";
      next.standardNameVn = "";
    }
    if (field === "level2") {
      next.level3 = "";
      next.standardNameCn = "";
      next.standardNameEn = "";
      next.standardNameVn = "";
    }
    if (field === "level3") {
      next.standardNameCn = "";
      next.standardNameEn = "";
      next.standardNameVn = "";
    }
    if (field === "standardNameCn") {
      const previousStandard = exactStandardPart(row);
      const standard = exactStandardPart(next);
      if (standard) {
        next.name = standard.cn;
        next.standardNameCn = standard.cn;
        next.standardNameEn = standard.en;
        next.standardNameVn = standard.vn;
        if (next.standardNameStatus === MATERIAL_STANDARD_NAME_REQUESTED) next.standardNameStatus = "";
      } else if (previousStandard) {
        next.name = value;
        next.standardNameEn = "";
        next.standardNameVn = "";
      }
    }
    return next;
  });
}

function materialEntryRow() {
  return newItemSuggestions.find((row) => row.id === pendingMaterialEntryId) || null;
}

function materialEntryFieldId(field) {
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

function standardOptionHtml(item, exactStandard) {
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

function syncStandardSearchSurface(row, prefix) {
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

function syncMaterialEntryFields(row) {
  if (!row) return;
  document.getElementById("materialEntryLevel1").innerHTML = optionTags(level1Options(), row.level1, "Select LV1");
  document.getElementById("materialEntryLevel2").innerHTML = optionTags(level2Options(row.level1), row.level2, row.level1 ? "Select LV2" : "Select LV1 first");
  document.getElementById("materialEntryLevel2").disabled = !row.level1;
  document.getElementById("materialEntryLevel3").innerHTML = optionTags(level3Options(row.level1, row.level2), row.level3, row.level2 ? "Select LV3" : "Select LV2 first");
  document.getElementById("materialEntryLevel3").disabled = !row.level2;
  ["standardNameCn", "standardNameEn", "standardNameVn", "detail", "spec", "structuredSpec", "uom", "estimatedUnitPrice", "estimatedAmount", "budgetRemark", "estimateReason", "useCase", "duplicateDifference", "evidenceReference"].forEach((field) => {
    document.getElementById(materialEntryFieldId(field)).value = row[field] || "";
  });
  syncStandardSearchSurface(row, "materialEntry");
}

function materialDuplicateCandidateRows(query = "") {
  const keyword = normalize(query);
  if (!keyword) return [];
  const seen = new Set();
  return requestWorksheetMergedSources(query)
    .filter((source) => source.type !== "new")
    .filter((source) => {
      const key = `${source.type}:${source.row.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map((source) => ({
      type: source.badge,
      name: source.row.name || "-",
      spec: userVisibleItemDetail(source.row) || itemDetail(source.row) || "-",
      levelPath: requestItemPickerLevelPath(source),
    }));
}

function materialDuplicateReviewHtml(row) {
  const candidates = row.duplicateCandidates || [];
  if (!candidates.length) {
    return `<strong>Review rule:</strong> This creates a pending material master request. It will not become active catalog data until approved.`;
  }
  return `
    <div class="material-duplicate-review">
      <strong>Potential existing material found</strong>
      <p class="modal-helper">Use an existing item when it matches. If this is different, complete the difference reason and evidence/reference fields.</p>
      <div class="material-duplicate-list">
        ${candidates.map((item) => `
          <div class="material-duplicate-item">
            <span>${htmlText(item.type)} · ${htmlText(item.levelPath || "Unclassified")}</span>
            <strong>${htmlText(item.name)}</strong>
            <small>${htmlText(item.spec)}</small>
          </div>`).join("")}
      </div>
    </div>`;
}

function renderMaterialEntryModal() {
  const row = materialEntryRow();
  if (!row) return closeMaterialEntry();
  const legacy = isLegacyMaintenance(row);
  document.getElementById("materialEntryTitle").textContent = legacy ? "Complete Item Information" : "Material Master Request";
  const mode = document.getElementById("materialEntryMode");
  mode.textContent = legacy ? "Legacy Item Standardization" : "Pending Material Review";
  mode.className = `status-pill ${statusClass(mode.textContent)}`;
  document.getElementById("materialEntryHelper").textContent = legacy
    ? "This legacy item must be standardized before it can be added to Request."
    : "Complete the material master draft. Dept DRI reviews need first; OM/master reviewer approves or merges the item before it becomes active catalog data.";
  document.getElementById("materialEntrySource").innerHTML = legacy
    ? `<strong>Source:</strong> ${row.sourceProject || "Legacy history"} · ${row.sourceRecordId || "Source record"}`
    : materialDuplicateReviewHtml(row);
  syncMaterialEntryFields(row);
}

function openMaterialEntry(suggestionId) {
  pendingMaterialEntryId = suggestionId;
  renderMaterialEntryModal();
  document.getElementById("materialEntryModal").hidden = false;
}

function closeMaterialEntry({ discard = true } = {}) {
  if (discard && pendingMaterialEntryId) {
    newItemSuggestions = newItemSuggestions.filter((row) => row.id !== pendingMaterialEntryId);
    newItemSelections.delete(pendingMaterialEntryId);
  }
  pendingMaterialEntryId = "";
  document.getElementById("materialEntryModal").hidden = true;
}

function updateMaterialEntryField(field, value, { rerender = false } = {}) {
  const row = materialEntryRow();
  if (!row) return;
  updateNewItemField(row.id, field, value);
  if (rerender) renderMaterialEntryModal();
}

function toggleMaterialStandardName() {
  const row = materialEntryRow();
  if (!row) return;
  toggleStandardNameForSuggestion(row.id);
  renderMaterialEntryModal();
}

function toggleStandardNameForSuggestion(suggestionId) {
  newItemSuggestions = newItemSuggestions.map((item) => item.id === suggestionId ? {
    ...item,
    standardNameStatus: item.standardNameStatus === MATERIAL_STANDARD_NAME_REQUESTED ? "" : MATERIAL_STANDARD_NAME_REQUESTED,
  } : item);
}

function selectMaterialStandardName(standardId, suggestionId = pendingMaterialEntryId || activeBatchMaterialId) {
  const row = newItemSuggestions.find((item) => item.id === suggestionId);
  if (!row) return;
  const standard = standardPartNameMaster().find((item) =>
    item.id === standardId
    && item.level1 === row.level1
    && item.level2 === row.level2
    && item.level3 === row.level3
  );
  if (!standard) return;
  newItemSuggestions = newItemSuggestions.map((item) => item.id === row.id ? {
    ...item,
    name: standard.cn,
    standardNameCn: standard.cn,
    standardNameEn: standard.en,
    standardNameVn: standard.vn,
    standardNameStatus: "",
  } : item);
  if (document.getElementById("standardNamePickerModal") && !document.getElementById("standardNamePickerModal").hidden) closeMaterialStandardPicker();
  if (pendingMaterialEntryId === row.id) renderMaterialEntryModal();
  if (batchMaterialIds.includes(row.id)) renderMaterialBatch();
}

function openMaterialStandardPicker(suggestionId = pendingMaterialEntryId || activeBatchMaterialId) {
  const row = newItemSuggestions.find((item) => item.id === suggestionId);
  if (!row || !row.level3) {
    showToast("Select LV1, LV2, and LV3 before opening all standard names.", "error");
    return;
  }
  pendingStandardPickerId = row.id;
  standardPickerQuery = row.standardNameCn || "";
  document.getElementById("standardNamePickerQuery").value = standardPickerQuery;
  document.getElementById("standardNamePickerModal").hidden = false;
  renderMaterialStandardPicker();
}

function closeMaterialStandardPicker() {
  pendingStandardPickerId = "";
  standardPickerQuery = "";
  document.getElementById("standardNamePickerModal").hidden = true;
}

function renderMaterialStandardPicker() {
  const row = newItemSuggestions.find((item) => item.id === pendingStandardPickerId);
  if (!row) return closeMaterialStandardPicker();
  const rows = standardPartMatchesFor(row, standardPickerQuery);
  document.getElementById("standardNamePickerContext").textContent = `${row.level1} / ${row.level2} / ${row.level3}`;
  document.getElementById("standardNamePickerCount").textContent = `${rows.length} match${rows.length === 1 ? "" : "es"}`;
  document.getElementById("standardNamePickerResults").innerHTML = rows.length
    ? rows.map((item) => standardOptionHtml(item, exactStandardPart(row))).join("")
    : `<p class="material-standard-empty">No standard name matches this keyword in the selected LV123 category.</p>`;
}

function batchMaterialRow() {
  return newItemSuggestions.find((row) => row.id === activeBatchMaterialId) || null;
}

function batchFieldId(field) {
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

function isReadyMaterialEntry(row) {
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

function batchStatus(row) {
  if (!row) return "Needs Information";
  return isReadyMaterialEntry(row) ? "Completed" : "Needs Information";
}

function openMaterialBatch(ids) {
  batchMaterialIds = [...new Set(ids)].filter((id) => newItemSuggestions.some((row) => row.id === id));
  if (!batchMaterialIds.length) return;
  activeBatchMaterialId = batchMaterialIds[0];
  document.getElementById("materialBatchModal").hidden = false;
  renderMaterialBatch();
}

function closeMaterialBatch({ discard = true } = {}) {
  if (discard) {
    newItemSuggestions = newItemSuggestions.filter((row) => !batchMaterialIds.includes(row.id));
    batchMaterialIds.forEach((id) => newItemSelections.delete(id));
  }
  batchMaterialIds = [];
  activeBatchMaterialId = "";
  document.getElementById("materialBatchModal").hidden = true;
}

function syncBatchMaterialFields(row) {
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

function renderMaterialBatch() {
  const rows = batchMaterialIds.map((id) => newItemSuggestions.find((row) => row.id === id)).filter(Boolean);
  if (!rows.length) return closeMaterialBatch({ discard: false });
  if (!rows.some((row) => row.id === activeBatchMaterialId)) activeBatchMaterialId = rows[0].id;
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

function updateBatchMaterialField(field, value, { rerender = false } = {}) {
  const row = batchMaterialRow();
  if (!row) return;
  updateNewItemField(row.id, field, value);
  if (rerender) renderMaterialBatch();
}

function addCompletedBatchMaterials() {
  const completedIds = batchMaterialIds.filter((id) => isReadyMaterialEntry(newItemSuggestions.find((row) => row.id === id)));
  if (!completedIds.length) {
    showToast("Complete at least one selected material before adding it to Request.", "error");
    return;
  }
  addSuggestionsToRequest(completedIds);
  batchMaterialIds = batchMaterialIds.filter((id) => !completedIds.includes(id));
  if (!batchMaterialIds.length) {
    closeMaterialBatch({ discard: false });
    return;
  }
  activeBatchMaterialId = batchMaterialIds[0];
  renderMaterialBatch();
}

function submitMaterialEntry(event) {
  event.preventDefault();
  const row = materialEntryRow();
  if (!row || !validateNewItem(row)) return;
  newItemSelections = new Set([row.id]);
  submitNewItemSuggestion();
  closeMaterialEntry({ discard: false });
}

function submitNewItemSuggestion() {
  const ids = [...newItemSelections];
  if (!ids.length) {
    showToast("Select at least one draft new item before adding to Request.", "error");
    return;
  }
  addSuggestionsToRequest(ids);
}

function addSuggestionsToRequest(ids) {
  const selectedRows = newItemSuggestions.filter((row) => ids.includes(row.id) && canRequesterEditSuggestion(row));
  const invalidRow = selectedRows.find((row) => !validateNewItem(row));
  if (invalidRow) {
    return;
  }

  const newMaterialRequests = [];
  selectedRows.forEach((row) => {
    const record = suggestionToRecord(row);
    const request = requestFromRecord(record, {
      requesterReason: row.useCase,
      selected: true,
      status: "Draft",
    });
    const targetRequest = row.targetRequestId ? requests.find((item) => item.id === row.targetRequestId) : null;
    const completedRequest = targetRequest ? requestFromRecord(record, {
      ...targetRequest,
      id: targetRequest.id,
      project: targetRequest.project,
      sourceProject: targetRequest.sourceProject,
      selected: targetRequest.selected,
      requesterReason: targetRequest.requesterReason || row.useCase,
      status: targetRequest.status,
    }) : request;
    if (isLegacyMaintenance(row) && request.materialNo) {
      const materialEvent = createMaterialCreationTimelineEvent(
        completedRequest,
        completedRequest,
        null,
        "created or reused from legacy material maintenance"
      );
      const nextRequest = {
        ...completedRequest,
        externalProgressEvents: [...(completedRequest.externalProgressEvents || []), materialEvent],
      };
      if (targetRequest) {
        requests = requests.map((item) => item.id === targetRequest.id ? nextRequest : item);
      } else {
        newMaterialRequests.push(nextRequest);
      }
      return;
    }
    if (targetRequest) {
      requests = requests.map((item) => item.id === targetRequest.id ? completedRequest : item);
    } else {
      newMaterialRequests.push(completedRequest);
    }
  });
  requests = [...newMaterialRequests, ...requests];
  newItemSuggestions = newItemSuggestions.filter((row) => !ids.includes(row.id));
  newItemSelections.clear();
  currentProject = selectedRows[0]?.project || currentProject;
  document.getElementById("projectSelect").value = currentProject;
  const createdNow = selectedRows.filter(isLegacyMaintenance).length;
  const pendingNow = selectedRows.length - createdNow;
  const message = [
    createdNow ? `${createdNow} legacy material${createdNow === 1 ? "" : "s"} created/reused` : "",
    pendingNow ? `${pendingNow} new material${pendingNow === 1 ? "" : "s"} pending PR/PO` : "",
  ].filter(Boolean).join("; ");
  showToast(`${message || selectedRows.length} added to Request as draft.`, "success");
  setDeptTab("request");
}

function managerRows() {
  const projectFilter = document.getElementById("managerProjectFilter")?.value || "";
  return requests.filter((row) => {
    return ["Submitted", "Approved"].includes(row.status)
      && (!projectFilter || row.project === projectFilter);
  });
}

function managerAffectedPhasesText(row) {
  return STAGES
    .map((stage) => ({ stage, qty: requestStageQty(row, stage) }))
    .filter((entry) => entry.qty > 0)
    .map((entry) => `${STAGE_LABELS[entry.stage]} ${entry.qty}`)
    .join(" / ") || "-";
}

function managerGateOwner(row) {
  if (isDeptDriSubmissionPending(row)) return "Dept DRI";
  if (isCostManagerAuthorizationPending(row)) return "Cost Manager";
  return priceReviewPendingOwner(row);
}

function managerQueueStatus(row) {
  return row.costManagerAuthorizationStatus || row.deptDriReviewStatus || row.priceApprovalStatus || row.status;
}

function managerQueueNextStep(row) {
  if (isCostManagerAuthorizationPending(row)) return "Final authorization before OM intake";
  if (isDeptDriSubmissionPending(row)) return "Waiting Dept DRI approval";
  return row.nextStep || (row.status === "Approved" ? "OM / cost tracking" : "Waiting approval gate");
}

function managerDecisionCell(row) {
  if (!isCostManagerAuthorizationPending(row)) return `<span class="status-pill">Read Only</span>`;
  return `
    <div class="row-action-stack">
      <button class="mini approve" type="button" data-cost-manager-authorization="${row.id}" data-cost-manager-action="approve">Approve</button>
      <button class="mini reject" type="button" data-cost-manager-authorization="${row.id}" data-cost-manager-action="reject">Reject</button>
    </div>`;
}

function managerDecisionHistoryRows() {
  const projectFilter = document.getElementById("managerDashboardProjectFilter")?.value || "";
  const statusFilter = document.getElementById("managerDashboardStatusFilter")?.value || "";
  return requests.filter((row) => {
    const reviewed = ["Approved", "Rejected"].includes(row.status);
    return reviewed
      && (!projectFilter || row.project === projectFilter)
      && (!statusFilter || row.status === statusFilter);
  });
}

function managerProgressRawRows() {
  const sourceRows = purchaseRecords.filter((row) => row.sourceSheet === "G Project MVA EQ Request" && clampQty(row.qty || totalQty(row)) > 0);
  const liveRows = requests.filter((row) => ["Submitted", "Approved", "In Progress"].includes(row.status) && totalQty(row) > 0);
  return [...sourceRows, ...liveRows];
}

function managerProgressYearProject(row) {
  return row.sourceSheet === "G Project MVA EQ Request" ? (row.project || row.yearProject || "-") : (row.project || "-");
}

function managerProgressProject(row) {
  return row.sourceSheet === "G Project MVA EQ Request" ? (row.sourceProject || row.project || "-") : (row.project || "-");
}

function managerProgressStage(row) {
  return row.stage || STAGES.find((stage) => clampQty(row[stage]) > 0) || "-";
}

function managerProgressQty(row) {
  return clampQty(row.qty || totalQty(row));
}

function managerProgressDoneQty(row, qtyField, statusField) {
  const explicitQty = clampQty(row[qtyField]);
  if (explicitQty) return Math.min(explicitQty, managerProgressQty(row));
  const status = normalize(row[statusField]);
  return status === "done" || status === "completed" ? managerProgressQty(row) : 0;
}

function managerProgressArrivedQty(row) {
  const explicitQty = clampQty(row.qtyReceived || row.qtyRecieved);
  if (explicitQty) return Math.min(explicitQty, managerProgressQty(row));
  const arrival = normalize(row.dtaActual || row.actualEta);
  if (!arrival || arrival === "pending" || arrival.includes("pending")) return 0;
  return managerProgressQty(row);
}

function managerProgressPendingReason(row) {
  const candidates = [
    row.pendingReason,
    row.deliveryPendingReason,
    row.pendingDeliveryReason,
    row.procurementRemark,
  ].filter(Boolean);
  const reason = candidates.find((value) => !["late", "on time", "#n/a"].includes(normalize(value)));
  if (reason) return reason;
  return "";
}

function pendingReasonLabel(value) {
  const text = String(value || "").trim();
  const normalized = normalize(text);
  if (!text) return "";
  if (normalized === "g") return "Group / General pending";
  if (normalized === "l") return "Late / Lead-time risk";
  if (text.length <= 2) return "Need clarification";
  return text;
}

function pendingReasonCell(values, emptyText = "-") {
  const labels = [...new Set([...values].map(pendingReasonLabel).filter(Boolean))];
  if (!labels.length) return emptyText;
  return `<div class="pending-reason-stack">${labels.slice(0, 2).map((label) => `<span class="status-pill pending-reason">${label}</span>`).join("")}<small>${labels.length > 2 ? `+${labels.length - 2} more reason${labels.length - 2 === 1 ? "" : "s"}` : "Risk note"}</small></div>`;
}

function managerProgressRawPendingReason(row) {
  return [row.pendingReason, row.deliveryPendingReason, row.pendingDeliveryReason, row.procurementRemark].filter(Boolean).join(" / ");
}

function managerProgressSubmittedAt(row) {
  return row.submittedAt
    || row.requestSubmittedAt
    || row.sentToOmAt
    || row.managerApprovedAt
    || row.approvedAt
    || row.requiredDeliveryDate
    || row.requestDeadline
    || "";
}

function managerProgressHasOmSignals(row) {
  return Boolean(
    row.omStage
    || row.sentToOmAt
    || row.pasDemandNo
    || row.pasDemandNoRecordedAt
    || row.quoteCompletionReadyAt
    || row.sentToUserAAt
    || row.finalExportStatus
    || row.finalExportedAt
  );
}

function managerProgressPendingOwnerForRow(row) {
  return workflowStatusForRow(row, "costOwner").pendingOwner;
}

function managerProgressOwnerPriority(owner) {
  return workflowStatusModule().OWNER_PRIORITY?.[owner] ?? 9;
}

function managerProgressPendingOwnerForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").pendingOwner;
}

function managerProgressCurrentStageForRow(row) {
  return workflowStatusForRow(row, "costOwner").currentStage;
}

function managerProgressStagePriority(stage) {
  return workflowStatusModule().STAGE_PRIORITY?.[stage] ?? 10;
}

function managerProgressCurrentStageForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").currentStage;
}

function managerProgressStageStartAt(row, stage = managerProgressCurrentStageForRow(row)) {
  return workflowStatusForRow(row, "costOwner").stageStartAt || managerProgressSubmittedAt(row);
}

function managerProgressGroupStageStartAt(group, stage = managerProgressCurrentStageForGroup(group)) {
  return workflowStatusForGroup(group, "costOwner").stageStartAt
    || (group.rows || []).map(managerProgressSubmittedAt).filter(Boolean).sort()[0]
    || "";
}

function managerProgressDaysPending(group) {
  return workflowStatusForGroup(group, "costOwner").daysPending;
}

function managerProgressAgingCell(group) {
  const stage = managerProgressCurrentStageForGroup(group);
  const startAt = managerProgressGroupStageStartAt(group, stage);
  const days = managerProgressDaysPending(group);
  if (days === null) return `<span class="status-pill approved">Done</span><div class="reason-text">${startAt ? compactDateTime(startAt) : "-"}</div>`;
  const cls = days > OM_INTERNAL_SLA_DAYS ? "warning" : days >= 4 ? "pending" : "approved";
  return `<span class="status-pill ${cls}">${days}d</span><div class="reason-text">${startAt ? `Since ${compactDateTime(startAt)}` : "Missing timestamp"}</div>`;
}

function managerProgressQuoteStatusForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").quoteStatus;
}

function managerProgressNextActionForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").nextAction;
}

function managerProgressIsLate(row) {
  return normalize(row.lateStatus || row.procurementRemark).includes("late");
}

function managerProgressIsPending(row) {
  return Boolean(managerProgressPendingReason(row));
}

function managerProgressKey(row) {
  return [
    managerProgressYearProject(row),
    managerProgressProject(row),
    row.name || "-",
    row.department || "-",
  ].join("::");
}

function progressRequestType(row) {
  return (row.requestType || row.tempBudgetMeta?.requestType || "Standard Demand").trim() || "Standard Demand";
}

function isProgressTempBudget(row) {
  return progressRequestType(row) === "Temporary Budget Request";
}

function progressEstimatedAmount(row) {
  const direct = clampQty(row.estimatedAmount || row.tempBudgetMeta?.estimatedAmount);
  if (direct > 0) return direct;
  const unit = clampQty(row.estimatedUnitPrice || row.tempBudgetMeta?.estimatedUnitPrice);
  const qty = managerProgressQty(row);
  return unit > 0 && qty > 0 ? unit * qty : 0;
}

function progressBiddingAmount(row) {
  return clampQty(
    row.biddingAmount
    || row.quoteAmount
    || row.updatedPrice
    || row.quotePrice
    || row.tempBudgetMeta?.biddingAmount
  );
}

function progressPoActualAmount(row) {
  const direct = clampQty(
    row.poActualAmount
    || row.actualAmount
    || row.finalPoAmount
    || row.buyerActualAmount
    || row.poAmount
    || row.poTotalAmount
    || row.buyerPoAmount
    || row.poIssuedAmount
  );
  if (direct > 0) return direct;
  const unitPrice = clampQty(row.actualUnitPrice || row.poActualUnitPrice || row.buyerPoUnitPrice);
  const qty = managerProgressQty(row);
  return unitPrice > 0 && qty > 0 ? unitPrice * qty : 0;
}

function progressVarianceLabel(baseAmount, compareAmount) {
  if (!(baseAmount > 0) || !(compareAmount > 0)) return "Pending";
  const diff = compareAmount - baseAmount;
  const pct = (diff / baseAmount) * 100;
  return `${diff >= 0 ? "+" : ""}${formatCurrencyFromVnd(diff)} (${pct.toFixed(1)}%)`;
}

function progressQuoteValidity(row) {
  const validUntil = (row.quoteValidUntil || row.tempBudgetMeta?.quoteValidUntil || "").trim();
  const receivedAt = (row.quoteReceivedAt || row.quoteDate || row.tempBudgetMeta?.quoteReceivedAt || "").trim();
  if (!validUntil) return { validUntil: "", receivedAt, status: isProgressTempBudget(row) ? "Missing validity" : "-" };
  const expiryDate = new Date(validUntil);
  if (Number.isNaN(expiryDate.getTime())) return { validUntil, receivedAt, status: "Missing validity" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { validUntil, receivedAt, status: "Expired / Requote Required", daysRemaining: days };
  if (days <= QUOTE_EXPIRING_SOON_DAYS) return { validUntil, receivedAt, status: "Expiring Soon", daysRemaining: days };
  return { validUntil, receivedAt, status: (row.quoteStatus || row.tempBudgetMeta?.quoteStatus || "Valid").trim() || "Valid", daysRemaining: days };
}

function managerProgressFilterState() {
  return {
    yearProject: document.getElementById("managerProgressYearFilter")?.value || "",
    project: document.getElementById("managerProgressProjectFilter")?.value || "",
    process: document.getElementById("managerProgressProcessFilter")?.value || "",
    stage: document.getElementById("managerProgressStageFilter")?.value || "",
    department: document.getElementById("managerProgressDepartmentFilter")?.value || "",
    requestType: document.getElementById("managerProgressRequestTypeFilter")?.value || "",
    quoteValidity: document.getElementById("managerProgressQuoteValidityFilter")?.value || "",
    lateOnly: Boolean(document.getElementById("managerProgressLateOnly")?.checked),
    pendingOnly: Boolean(document.getElementById("managerProgressPendingOnly")?.checked),
  };
}

function managerProgressMatchesFilters(row, filters) {
  if (filters.yearProject && managerProgressYearProject(row) !== filters.yearProject) return false;
  if (filters.project && managerProgressProject(row) !== filters.project) return false;
  if (filters.process && row.process !== filters.process) return false;
  if (filters.stage && managerProgressStage(row) !== filters.stage) return false;
  if (filters.department && row.department !== filters.department) return false;
  if (filters.requestType === "temporary" && !isProgressTempBudget(row)) return false;
  if (filters.requestType === "standard" && isProgressTempBudget(row)) return false;
  if (filters.quoteValidity) {
    const status = progressQuoteValidity(row).status;
    if (filters.quoteValidity === "expiring" && status !== "Expiring Soon") return false;
    if (filters.quoteValidity === "expired" && status !== "Expired / Requote Required") return false;
    if (filters.quoteValidity === "missing" && status !== "Missing validity") return false;
    if (filters.quoteValidity === "valid" && !["Valid", "Quote Valid"].includes(status)) return false;
  }
  if (filters.lateOnly && !managerProgressIsLate(row)) return false;
  if (filters.pendingOnly && !managerProgressIsPending(row)) return false;
  return true;
}

function optionHtml(value, selectedValue) {
  return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${value}</option>`;
}

function syncManagerProgressFilters() {
  const rawRows = managerProgressRawRows();
  const controls = [
    ["managerProgressYearFilter", "All year projects", (row) => managerProgressYearProject(row)],
    ["managerProgressProjectFilter", "All projects", (row) => managerProgressProject(row)],
    ["managerProgressProcessFilter", "All process", (row) => row.process],
    ["managerProgressStageFilter", "All stage", (row) => managerProgressStage(row)],
    ["managerProgressDepartmentFilter", "All departments", (row) => row.department],
  ];
  controls.forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    const values = [...new Set(rawRows.map(getter).filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));
    select.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => optionHtml(value, currentValue)).join("")}`;
    if (currentValue && values.includes(currentValue)) select.value = currentValue;
  });
}

function clearManagerProgressFilters() {
  [
    "managerProgressYearFilter",
    "managerProgressProjectFilter",
    "managerProgressProcessFilter",
    "managerProgressStageFilter",
    "managerProgressDepartmentFilter",
    "managerProgressRequestTypeFilter",
    "managerProgressQuoteValidityFilter",
  ].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  ["managerProgressLateOnly", "managerProgressPendingOnly"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.checked = false;
  });
  renderManagerStageTracking();
}

function managerProgressRows() {
  const filters = managerProgressFilterState();
  const groups = new Map();
  managerProgressRawRows().forEach((row) => {
    if (!managerProgressMatchesFilters(row, filters)) return;
    const key = managerProgressKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        keyId: stableHash(key),
        yearProject: managerProgressYearProject(row),
        project: managerProgressProject(row),
        item: row.name || "-",
        department: row.department || "-",
        quantity: 0,
        budgetDone: 0,
        prDone: 0,
        poDone: 0,
        arrived: 0,
        lateRows: 0,
        pendingRows: 0,
        notArrivedRows: 0,
        requiredDateValues: new Set(),
        deadlineValues: new Set(),
        etaValues: new Set(),
        dtaValues: new Set(),
        pendingReasons: new Set(),
        rows: [],
      });
    }
    const group = groups.get(key);
    const qty = managerProgressQty(row);
    group.quantity += qty;
    group.budgetDone += managerProgressDoneQty(row, "qtyDoneBudget", "budgetStatus");
    group.prDone += managerProgressDoneQty(row, "qtyDonePr", "prStatus");
    group.poDone += managerProgressDoneQty(row, "qtyDonePo", "poStatus");
    group.arrived += managerProgressArrivedQty(row);
    if (managerProgressIsLate(row)) group.lateRows += 1;
    if (managerProgressIsPending(row)) group.pendingRows += 1;
    if (managerProgressArrivedQty(row) < qty) group.notArrivedRows += 1;
    if (row.requiredDeliveryDate) group.requiredDateValues.add(row.requiredDeliveryDate);
    if (row.requestDeadline) group.deadlineValues.add(row.requestDeadline);
    if (row.etaPlan || row.eta) group.etaValues.add(row.etaPlan || row.eta);
    if (row.dtaActual || row.actualEta) group.dtaValues.add(row.dtaActual || row.actualEta);
    const pendingReason = managerProgressPendingReason(row);
    if (pendingReason) group.pendingReasons.add(pendingReason);
    group.rows.push(row);
  });
  return [...groups.values()].sort((left, right) => {
    const leftRisk = (left.lateRows ? 100 : 0) + (left.pendingRows ? 40 : 0) + (left.notArrivedRows ? 20 : 0);
    const rightRisk = (right.lateRows ? 100 : 0) + (right.pendingRows ? 40 : 0) + (right.notArrivedRows ? 20 : 0);
    if (leftRisk !== rightRisk) return rightRisk - leftRisk;
    if (left.quantity !== right.quantity) return right.quantity - left.quantity;
    return `${left.yearProject} ${left.project} ${left.item}`.localeCompare(`${right.yearProject} ${right.project} ${right.item}`);
  });
}

function managerProgressPercent(done, total) {
  return total ? Math.min(100, Math.round((done / total) * 100)) : 0;
}

function formattedDateSet(values) {
  return new Set([...values].map(formatProgressDate).filter(Boolean));
}

function managerProgressDateLine(group, type) {
  const dateMap = {
    budget: ["Deadline", group.deadlineValues],
    pr: ["Required", group.requiredDateValues],
    po: ["ETA", group.etaValues.size ? group.etaValues : group.requiredDateValues],
    arrived: ["DTA", group.dtaValues.size ? group.dtaValues : group.etaValues],
  };
  const [label, values] = dateMap[type] || ["Date", new Set()];
  const value = compactList(formattedDateSet(values), "");
  return value ? `${label} ${value}` : "";
}

function managerKeyDatesCell(group) {
  const lines = [
    ["Required", group.requiredDateValues],
    ["Deadline", group.deadlineValues],
    ["ETA", group.etaValues],
    ["DTA", group.dtaValues],
  ].map(([label, values]) => {
    const value = compactList(formattedDateSet(values), "-");
    return `<div><strong>${label}</strong><span>${value}</span></div>`;
  });
  return `<div class="pivot-date-stack">${lines.join("")}</div>`;
}

function managerProgressCell(done, total, label, dateLine = "") {
  const percent = managerProgressPercent(done, total);
  const status = percent >= 100 ? "Done" : percent > 0 ? "In Progress" : "Pending";
  return `
    <div class="pivot-progress-cell">
      <div class="pivot-progress-top"><strong>${done}/${total}</strong><span>${percent}%</span></div>
      <div class="pivot-progress-track"><span style="width: ${percent}%"></span></div>
      <small><span>${label}</span><strong>${status}</strong></small>
      ${dateLine ? `<div class="pivot-progress-date">${dateLine}</div>` : ""}
    </div>`;
}

function managerDeliveryStatusCell(group) {
  const pills = [];
  if (group.lateRows) pills.push(`<span class="status-pill late">Late ${group.lateRows}</span>`);
  if (group.pendingRows) pills.push(`<span class="status-pill pending">Pending ${group.pendingRows}</span>`);
  if (group.notArrivedRows) pills.push(`<span class="status-pill not-arrived">Not Arrived ${group.notArrivedRows}</span>`);
  if (!pills.length) pills.push(`<span class="status-pill approved">On Track</span>`);
  const summary = group.lateRows
    ? "Schedule risk"
    : group.pendingRows
      ? "Action pending"
      : group.notArrivedRows
        ? "Arrival pending"
        : "No escalation";
  return `<div class="pivot-status-stack">${pills.join("")}<small>${summary}</small></div>`;
}

function omSubmissionFilterState() {
  return {
    yearProject: document.getElementById("omSubmissionYearFilter")?.value || "",
    project: document.getElementById("omSubmissionProjectFilter")?.value || "",
    process: document.getElementById("omSubmissionProcessFilter")?.value || "",
    stage: document.getElementById("omSubmissionStageFilter")?.value || "",
    department: document.getElementById("omSubmissionDepartmentFilter")?.value || "",
    requestType: document.getElementById("omSubmissionRequestTypeFilter")?.value || "",
    quoteValidity: document.getElementById("omSubmissionQuoteValidityFilter")?.value || "",
    lateOnly: Boolean(document.getElementById("omSubmissionLateOnly")?.checked),
    pendingOnly: Boolean(document.getElementById("omSubmissionPendingOnly")?.checked),
  };
}

function omSubmissionMatchesFilters(row, filters) {
  if (filters.yearProject && managerProgressYearProject(row) !== filters.yearProject) return false;
  if (filters.project && managerProgressProject(row) !== filters.project) return false;
  if (filters.process && row.process !== filters.process) return false;
  if (filters.stage && managerProgressStage(row) !== filters.stage) return false;
  if (filters.department && row.department !== filters.department) return false;
  if (filters.requestType === "temporary" && !isProgressTempBudget(row)) return false;
  if (filters.requestType === "standard" && isProgressTempBudget(row)) return false;
  if (filters.quoteValidity) {
    const status = progressQuoteValidity(row).status;
    if (filters.quoteValidity === "expiring" && status !== "Expiring Soon") return false;
    if (filters.quoteValidity === "expired" && status !== "Expired / Requote Required") return false;
    if (filters.quoteValidity === "missing" && status !== "Missing validity") return false;
    if (filters.quoteValidity === "valid" && !["Valid", "Quote Valid"].includes(status)) return false;
  }
  if (filters.lateOnly && !managerProgressIsLate(row)) return false;
  if (filters.pendingOnly && !managerProgressIsPending(row)) return false;
  return true;
}

function syncOmSubmissionFilters() {
  const rawRows = managerProgressRawRows();
  const controls = [
    ["omSubmissionYearFilter", "All year projects", (row) => managerProgressYearProject(row)],
    ["omSubmissionProjectFilter", "All projects", (row) => managerProgressProject(row)],
    ["omSubmissionProcessFilter", "All process", (row) => row.process],
    ["omSubmissionStageFilter", "All stage", (row) => managerProgressStage(row)],
    ["omSubmissionDepartmentFilter", "All departments", (row) => row.department],
  ];
  controls.forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    const values = [...new Set(rawRows.map(getter).filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));
    select.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => optionHtml(value, currentValue)).join("")}`;
    if (currentValue && values.includes(currentValue)) select.value = currentValue;
  });
}

function clearOmSubmissionFilters() {
  [
    "omSubmissionYearFilter",
    "omSubmissionProjectFilter",
    "omSubmissionProcessFilter",
    "omSubmissionStageFilter",
    "omSubmissionDepartmentFilter",
    "omSubmissionRequestTypeFilter",
    "omSubmissionQuoteValidityFilter",
  ].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  ["omSubmissionLateOnly", "omSubmissionPendingOnly"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.checked = false;
  });
  renderOmSubmission();
}

function omSubmissionRows() {
  const filters = omSubmissionFilterState();
  const groups = new Map();
  managerProgressRawRows().forEach((row) => {
    if (!omSubmissionMatchesFilters(row, filters)) return;
    const key = managerProgressKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        keyId: stableHash(`OM::${key}`),
        yearProject: managerProgressYearProject(row),
        project: managerProgressProject(row),
        item: row.name || "-",
        department: row.department || "-",
        quantity: 0,
        budgetDone: 0,
        prDone: 0,
        poDone: 0,
        arrived: 0,
        lateRows: 0,
        pendingRows: 0,
        notArrivedRows: 0,
        requiredDateValues: new Set(),
        deadlineValues: new Set(),
        etaValues: new Set(),
        dtaValues: new Set(),
        pendingReasons: new Set(),
        rows: [],
      });
    }
    const group = groups.get(key);
    const qty = managerProgressQty(row);
    group.quantity += qty;
    group.budgetDone += managerProgressDoneQty(row, "qtyDoneBudget", "budgetStatus");
    group.prDone += managerProgressDoneQty(row, "qtyDonePr", "prStatus");
    group.poDone += managerProgressDoneQty(row, "qtyDonePo", "poStatus");
    group.arrived += managerProgressArrivedQty(row);
    if (managerProgressIsLate(row)) group.lateRows += 1;
    if (managerProgressIsPending(row)) group.pendingRows += 1;
    if (managerProgressArrivedQty(row) < qty) group.notArrivedRows += 1;
    if (row.requiredDeliveryDate) group.requiredDateValues.add(row.requiredDeliveryDate);
    if (row.requestDeadline) group.deadlineValues.add(row.requestDeadline);
    if (row.etaPlan || row.eta) group.etaValues.add(row.etaPlan || row.eta);
    if (row.dtaActual || row.actualEta) group.dtaValues.add(row.dtaActual || row.actualEta);
    const pendingReason = managerProgressPendingReason(row);
    if (pendingReason) group.pendingReasons.add(pendingReason);
    group.rows.push(row);
  });
  return [...groups.values()].sort((left, right) => {
    const leftRisk = (left.lateRows ? 100 : 0) + (left.pendingRows ? 40 : 0) + (left.notArrivedRows ? 20 : 0);
    const rightRisk = (right.lateRows ? 100 : 0) + (right.pendingRows ? 40 : 0) + (right.notArrivedRows ? 20 : 0);
    if (leftRisk !== rightRisk) return rightRisk - leftRisk;
    if (left.quantity !== right.quantity) return right.quantity - left.quantity;
    return `${left.yearProject} ${left.project} ${left.item}`.localeCompare(`${right.yearProject} ${right.project} ${right.item}`);
  });
}

const OM_INTERNAL_SLA_DAYS = 7;

function daysBetweenDates(startText, endText = new Date().toISOString()) {
  if (!startText) return 0;
  const start = new Date(startText);
  const end = new Date(endText || new Date().toISOString());
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

function omInternalRows() {
  return requests.filter((row) =>
    !["Draft", "Submitted", "Rejected", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status)
    && !isSupersededRequest(row)
    && (row.pasRequired || isOmBuyScope(row) || row.procurementStatus || row.omStatus || row.sentToOmAt)
  );
}

function omInternalProcessingSummary() {
  const rows = omInternalRows();
  const durations = rows.map((row) => {
    const start = row.sentToOmAt || row.decidedAt || row.managerApprovedAt || row.approvedAt || row.submittedAt;
    const end = row.finalExportedAt || row.userAQuoteDecisionAt || row.sentToUserAAt || row.quoteCompletionReadyAt || row.pasDemandNoRecordedAt || new Date().toISOString();
    return daysBetweenDates(start, end);
  }).filter((days) => days > 0);
  const avgDays = durations.length ? `${Math.round(durations.reduce((sum, days) => sum + days, 0) / durations.length)}d` : "-";
  const waitingPasDemandNo = rows.filter((row) => !row.pasDemandNo && !row.finalExportedAt).length;
  const quoteAging = rows.filter((row) => !isOmWaitingUserConfirm(row) && !row.userAQuoteDecisionAt && !row.finalExportedAt && !isOmQuoteReady(row)).length;
  const waitingUserConfirm = rows.filter((row) => isOmWaitingUserConfirm(row) && !row.userAQuoteDecisionAt).length;
  const exportPending = rows.filter((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED && !row.finalExportedAt).length;
  const overSla = rows.filter((row) => {
    const start = row.sentToOmAt || row.decidedAt || row.managerApprovedAt || row.approvedAt || row.submittedAt;
    return !row.finalExportedAt && daysBetweenDates(start) > OM_INTERNAL_SLA_DAYS;
  }).length;
  return { avgDays, waitingPasDemandNo, quoteAging, waitingUserConfirm, exportPending, overSla };
}

function omStageTrackingCell(group, stage) {
  const rows = group.rows || [];
  const firstDate = (getter) => rows.map(getter).filter(Boolean).sort()[0] || "";
  const latestDate = (getter) => rows.map(getter).filter(Boolean).sort().pop() || "";
  const cell = {
    pas: {
      label: rows.some((row) => row.pasDemandNo) ? "Recorded" : "Pending",
      date: firstDate((row) => row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt),
      note: rows.some((row) => row.pasDemandNo) ? "PAS Demand No" : "Waiting PAS Demand No",
    },
    quote: {
      label: rows.some((row) => isOmQuoteReady(row) || row.quoteCompletionReadyAt) ? "Ready" : "Pending",
      date: firstDate((row) => row.quoteCompletionReadyAt || row.quoteReadyAt),
      note: rows.some((row) => isOmQuoteReady(row)) ? "Quote complete" : "Quote incomplete",
    },
    confirm: {
      label: rows.some((row) => row.userAQuoteDecisionAt) ? "Done" : rows.some((row) => isOmWaitingUserConfirm(row)) ? "Waiting" : "Not Sent",
      date: latestDate((row) => row.userAQuoteDecisionAt || row.sentToUserAAt),
      note: rows.some((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) ? "Requester confirmed" : rows.some((row) => isOmWaitingUserConfirm(row)) ? "Waiting Requester" : "Not sent to Requester",
    },
    export: {
      label: rows.some((row) => row.finalExportedAt) ? "Exported" : rows.some((row) => row.finalExportStatus || row.finalExportTarget) ? "Preparing" : "Pending",
      date: latestDate((row) => row.finalExportedAt || row.finalExportPreparedAt),
      note: rows.some((row) => row.finalExportedAt) ? "CFA/ECS exported" : "Export pending",
    },
  }[stage];
  return `
    <div class="om-stage-cell">
      <span class="status-pill ${statusClass(cell.label)}">${cell.label}</span>
      <strong>${cell.date ? compactDateTime(cell.date) : "-"}</strong>
      <small>${cell.note}</small>
    </div>`;
}

function omReceivedAt(row) {
  return row.sentToOmAt || row.managerApprovedAt || row.decidedAt || row.approvedAt || row.submittedAt || "";
}

function omCurrentStageForRow(row) {
  return workflowStatusForRow(row, "om").currentStage;
}

function isOmQuoteResultReady(row) {
  return Boolean(
    isOmQuoteReady(row)
    || row.quoteCompletionReadyAt
    || (row.pasMaterialNo && (row.updatedPrice || row.updatedPriceVnd || row.unitPriceVnd) && row.quoteDate && (omQuoteScreenshotFile(row) || row.quoteExcel))
  );
}

function omPendingOwnerForRow(row) {
  return workflowStatusForRow(row, "om").pendingOwner;
}

function omPendingOwnerPriority(owner) {
  return workflowStatusModule().OWNER_PRIORITY?.[owner] || 9;
}

function omPendingOwnerForGroup(group) {
  return workflowStatusForGroup(group, "om").pendingOwner;
}

function omQuoteStatusForRow(row) {
  return workflowStatusForRow(row, "om").quoteStatus;
}

function omQuoteStatusPriority(status) {
  return {
    "Expired / Requote Required": 1,
    "Expiring Soon": 2,
    "Waiting PAS Reply": 3,
    "Missing Validity": 4,
    "Reusable Quote": 5,
  }[status] || 9;
}

function omQuoteStatusForGroup(group) {
  return workflowStatusForGroup(group, "om").quoteStatus;
}

function omStageStartAt(row, stage = omCurrentStageForRow(row)) {
  return workflowStatusForRow(row, "om").stageStartAt || omReceivedAt(row);
}

function omStagePriority(stage) {
  return workflowStatusModule().STAGE_PRIORITY?.[stage] || 0;
}

function omCurrentStageForGroup(group) {
  return workflowStatusForGroup(group, "om").currentStage;
}

function omGroupReceivedAt(group) {
  return (group.rows || []).map(omReceivedAt).filter(Boolean).sort()[0] || "";
}

function omGroupStageStartAt(group, stage = omCurrentStageForGroup(group)) {
  return workflowStatusForGroup(group, "om").stageStartAt || omGroupReceivedAt(group);
}

function omDaysInStage(group) {
  return workflowStatusForGroup(group, "om").daysPending;
}

function omAgingStatusClass(days) {
  if (days === null) return "approved";
  if (days > OM_INTERNAL_SLA_DAYS) return "warning";
  if (days >= 4) return "pending";
  return "approved";
}

function omAgingCell(group) {
  const stage = omCurrentStageForGroup(group);
  const startAt = omGroupStageStartAt(group, stage);
  const days = omDaysInStage(group);
  if (days === null) return `<span class="status-pill approved">Completed</span><div class="reason-text">${startAt ? compactDateTime(startAt) : "-"}</div>`;
  const helper = startAt ? `Since ${compactDateTime(startAt)}` : "Missing stage start";
  return `<span class="status-pill ${omAgingStatusClass(days)}">${days}d</span><div class="reason-text">${helper}</div>`;
}

function omSubmittedReceivedCell(group) {
  const rows = group.rows || [];
  const submittedAt = rows.map((row) => row.submittedAt || row.requestSubmittedAt).filter(Boolean).sort()[0] || "";
  const receivedAt = omGroupReceivedAt(group);
  return `
    <div class="workflow-date-stack">
      <strong>${submittedAt ? compactDateTime(submittedAt) : "-"}</strong>
      <span>Submitted</span>
      <strong>${receivedAt ? compactDateTime(receivedAt) : "-"}</strong>
      <span>OM received</span>
    </div>`;
}

function omPendingOwnerHelper(group, pendingOwner) {
  if (pendingOwner === "Buyer Handoff") {
    const buyerStart = (group.rows || [])
      .map((row) => row.buyerReceivedAt || row.finalExportedAt || row.sentToBuyerAt)
      .filter(Boolean)
      .sort()[0] || "";
    if (!buyerStart) return "Buyer owns PR / PO after OM export";
    const days = daysBetweenDates(buyerStart);
    return `Buyer owns PR / PO · ${days}d since ${compactDateTime(buyerStart)}`;
  }
  return "Current blocker";
}

function omNextActionForGroup(group) {
  return workflowStatusForGroup(group, "om").nextAction;
}

function renderOmSubmissionExpiryMonitor() {
  const body = document.getElementById("omSubmissionExpiryRows");
  if (!body) return;
  const rows = omQuoteExpiryRows()
    .filter((row) => {
      const status = omQuoteValidity(row);
      return !omQuoteValidUntil(row) || status === "Quote Expiring Soon" || status === "Quote Expired";
    })
    .slice(0, 8);
  body.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${omItemCell(row, { stageLabel: "Quote expiry" })}</td>
        <td>${row.pasDemandNo || "-"}</td>
        <td>${row.pasMaterialNo || "-"}</td>
        <td>${omQuoteValidUntil(row) || "-"}</td>
        <td><span class="status-pill ${statusClass(omQuoteValidity(row))}">${omQuoteValidity(row)}</span></td>
        <td><div class="reason-text">${omQuoteExpiryAction(row)}</div></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-cell">No expiring or expired quote rows need attention.</td></tr>`;
}

function renderOmExchangeRatePanel() {
  const monthInput = document.getElementById("omExchangeRateMonth");
  const rateInput = document.getElementById("omExchangeRateValue");
  const status = document.getElementById("omRateStatus");
  const saveButton = document.querySelector("[data-action='saveOmExchangeRate']");
  if (!monthInput || !rateInput) return;
  const record = exchangeRateRecord();
  monthInput.value = record.exchangeRateMonth || activeExchangeRateMonth();
  rateInput.value = record.usdToVndRate || OM_EXCHANGE_RATE_VND_USD;
  rateInput.disabled = !isOmLeaderRole();
  monthInput.disabled = !isOmLeaderRole();
  if (saveButton) saveButton.disabled = !isOmLeaderRole();
  if (status) {
    status.textContent = record.isFallback ? "Fallback Rate" : "Active Rate";
    status.title = record.isFallback
      ? `Using system fallback rate: ${OM_EXCHANGE_RATE_VND_USD.toLocaleString("en-US")} VND`
      : `Updated by ${record.rateUpdatedBy || "OM Leader"}${record.rateUpdatedAt ? ` at ${compactDateTime(record.rateUpdatedAt)}` : ""}`;
    status.className = `status-pill ${record.isFallback ? "warning" : "approved"}`;
  }
}

function saveOmExchangeRate() {
  if (!isOmLeaderRole()) {
    showToast("Only OM Leader can update exchange rate.", "error");
    return;
  }
  const month = document.getElementById("omExchangeRateMonth")?.value || activeExchangeRateMonth();
  const rate = clampQty(document.getElementById("omExchangeRateValue")?.value || 0);
  if (!month || !rate) {
    showToast("Month and USD to VND rate are required.", "error");
    return;
  }
  const patch = {
    exchangeRateMonth: month,
    usdToVndRate: rate,
    rateUpdatedBy: roleProfiles[currentRole]?.name || "OM Leader",
    rateUpdatedAt: new Date().toISOString(),
    isFallback: false,
  };
  monthlyExchangeRates = [patch, ...monthlyExchangeRates.filter((row) => row.exchangeRateMonth !== month)];
  renderOmPurchasing();
  renderManager();
  showToast(`Exchange rate saved: 1 USD = ${rate.toLocaleString("en-US")} VND.`, "success");
}

function renderOmSubmission() {
  syncOmSubmissionFilters();
  renderOmExchangeRatePanel();
  const rows = omSubmissionRows();
  const totalQty = rows.reduce((sum, row) => sum + row.quantity, 0);
  const summary = document.getElementById("omSubmissionSummary");
  if (summary) {
    const waitingOm = rows.filter((group) => omPendingOwnerForGroup(group) === "OM Purchasing").length;
    const waitingPasReply = rows.filter((group) => omPendingOwnerForGroup(group) === "PAS / Bidding").length;
    const waitingConfirm = rows.filter((group) => omCurrentStageForGroup(group) === "Waiting Requester").length;
    const exportPending = rows.filter((group) => group.rows.some((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED && !row.finalExportedAt)).length;
    const expiringSoon = rows.filter((group) => omQuoteStatusForGroup(group) === "Expiring Soon").length;
    const expired = rows.filter((group) => omQuoteStatusForGroup(group) === "Expired / Requote Required").length;
    const overSla = rows.filter((group) => {
      const days = omDaysInStage(group);
      return days !== null && days > OM_INTERNAL_SLA_DAYS;
    }).length;
    summary.innerHTML = summaryCardsHtml([
      { label: "Waiting OM", value: waitingOm, helper: "PAS no / quote input / export", variant: "hero" },
      { label: "Waiting PAS Reply", value: waitingPasReply, helper: "PAS bidding result not returned" },
      { label: "Waiting Requester", value: waitingConfirm, helper: "Need confirm / cancel" },
      { label: "Export Pending", value: exportPending, helper: "Confirmed, not exported" },
      { label: "Expired / Requote", value: expired, helper: "Quote expired", variant: expired ? "warning" : "" },
      { label: "Over SLA", value: overSla, helper: `>${OM_INTERNAL_SLA_DAYS}d pending`, variant: overSla ? "warning" : "" },
      { label: "Expiring Soon", value: expiringSoon, helper: `Quote expires within ${QUOTE_EXPIRING_SOON_DAYS}d` },
    ]);
  }
  renderOmSubmissionExpiryMonitor();
  const body = document.getElementById("omSubmissionRows");
  if (!body) return;
  const headRow = body.closest("table")?.querySelector("thead tr");
  if (headRow) {
    headRow.innerHTML = `
      <th>Project</th>
      <th>Item</th>
      <th>Qty</th>
      <th>Submitted / Received Date</th>
      <th>Pending Owner</th>
      <th>Current Stage</th>
      <th>Days Pending</th>
      <th>Detail</th>`;
  }
  body.innerHTML = rows.length
    ? rows.map((row) => {
      const omStage = omCurrentStageForGroup(row);
      const pendingOwner = omPendingOwnerForGroup(row);
      return `
      <tr class="${row.lateRows || row.pendingRows || row.notArrivedRows ? "pivot-risk-row" : ""}">
        <td>${row.project}</td>
        <td><div class="item-primary">${row.item}</div><div class="reason-text">${row.rows.length} raw row${row.rows.length === 1 ? "" : "s"}</div></td>
        <td><strong>${row.quantity}</strong></td>
        <td>${omSubmittedReceivedCell(row)}</td>
        <td><span class="status-pill ${statusClass(pendingOwner)}">${pendingOwner}</span><div class="reason-text">${omPendingOwnerHelper(row, pendingOwner)}</div></td>
        <td><span class="status-pill ${statusClass(omStage)}">${omStage}</span><div class="reason-text">${row.department || "-"}</div></td>
        <td>${omAgingCell(row)}</td>
        <td><button class="mini return" data-om-submission-detail="${row.keyId}">Detail</button></td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="8" class="empty-cell">No OM submission rows match the selected filters.</td></tr>`;
}

function openOmSubmissionDetail(groupKeyId) {
  const group = omSubmissionRows().find((row) => row.keyId === groupKeyId);
  if (!group) return;
  document.getElementById("managerDetailTitle").textContent = `Submission Status / ${group.project} / ${group.item}`;
  document.getElementById("managerDetailStatus").className = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "status-pill warning"
    : "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "Needs Attention"
    : "On Track";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Submission Status Summary</h4></div>
      ${detailSummaryGridHtml([
        ["Project", group.project, group.yearProject],
        ["Department", group.department, `${group.rows.length} raw row${group.rows.length === 1 ? "" : "s"}`],
        ["Quantity", group.quantity],
        ["Pending / Risk", [...group.pendingReasons].join(" / ") || "-", group.item],
        ["PAS Demand", group.rows.some((row) => row.pasDemandNo) ? "Recorded" : "Pending", group.rows.map((row) => row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt).filter(Boolean).sort()[0] || "-"],
        ["Quote Completion", group.rows.some((row) => isOmQuoteReady(row) || row.quoteCompletionReadyAt) ? "Ready" : "Pending", group.rows.map((row) => row.quoteCompletionReadyAt || row.quoteReadyAt).filter(Boolean).sort()[0] || "-"],
        ["User Confirmation", group.rows.some((row) => row.userAQuoteDecisionAt) ? "Done" : group.rows.some((row) => isOmWaitingUserConfirm(row)) ? "Waiting" : "Not Sent", group.rows.map((row) => row.userAQuoteDecisionAt || row.sentToUserAAt).filter(Boolean).sort().pop() || "-"],
        ["Export Package", group.rows.some((row) => row.finalExportedAt) ? "Exported" : "Pending", group.rows.map((row) => row.finalExportedAt || row.finalExportPreparedAt).filter(Boolean).sort().pop() || "-"],
      ])}
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Raw Request Rows</h4>
          <p class="panel-subcopy">Use this section to trace the grouped OM submission back to each requester row, schedule date, and purchasing progress record.</p>
          <p class="panel-subcopy">OM view stops at PAS / quote / requester confirmation / export. Buyer PR / PO execution is a buyer handoff note and is not shown as OM work.</p>
        </div>
      </div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table workflow-table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Item / Spec</th>
              <th>Qty</th>
              <th>Need / Received</th>
              <th>PAS Demand</th>
              <th>Quote Result</th>
              <th>User Confirm</th>
              <th>Export Package</th>
              <th>Pending / Risk Reason</th>
            </tr>
          </thead>
          <tbody>
            ${group.rows.map((row) => `
              <tr>
                <td>${row.requesterName || "-"}<div class="reason-text">${row.requesterEmployeeId || row.email || ""}</div></td>
                <td><div class="item-primary">${row.name || "-"}</div><div class="reason-text">${itemDetail(row)}</div></td>
                <td>${managerProgressQty(row)}</td>
                <td>${needDateForRow(row) || "-"}<div class="reason-text">Received ${row.sentToOmAt || row.managerApprovedAt ? compactDateTime(row.sentToOmAt || row.managerApprovedAt) : "-"}</div></td>
                <td>${row.pasDemandNo || "Pending"}<div class="reason-text">${row.pasDemandNoRecordedAt ? compactDateTime(row.pasDemandNoRecordedAt) : "Waiting PAS Demand No"}</div></td>
                <td>${isOmQuoteReady(row) ? "Ready" : "Pending"}<div class="reason-text">${row.quoteValidUntil ? `Valid until ${row.quoteValidUntil}` : "Waiting quote result"}</div></td>
                <td>${row.userAQuoteDecisionStatus || "Not Sent"}<div class="reason-text">${row.userAQuoteDecisionAt ? compactDateTime(row.userAQuoteDecisionAt) : "-"}</div></td>
                <td>${omFinalExportStatusLabel(row)}<div class="reason-text">${row.finalExportPackageCode || row.finalExportTarget || "-"}</div></td>
                <td>${pendingReasonCell(new Set([managerProgressPendingReason(row)]))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerDetailModal").hidden = false;
}

function compactList(values, emptyText = "-") {
  const list = [...values].filter(Boolean);
  if (!list.length) return emptyText;
  if (list.length <= 2) return list.join(" / ");
  return `${list.slice(0, 2).join(" / ")} +${list.length - 2}`;
}

function detailSummaryGridHtml(entries) {
  return `
    <div class="detail-summary-grid">
      ${entries.map(([label, value, helper = ""]) => `
        <article class="detail-summary-card">
          <span>${label}</span>
          <strong>${value}</strong>
          ${helper ? `<small>${helper}</small>` : ""}
        </article>`).join("")}
    </div>`;
}

function formatProgressDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return value > 20000 ? new Date((value - 25569) * 86400000).toISOString().slice(0, 10) : "";
  const text = String(value).trim();
  if (!text || text === "#VALUE!" || text === "#N/A" || text === "-") return "";
  if (/^1899-/.test(text)) return "";
  return text;
}

function renderManager() {
  syncProjectControls();
  syncDemandAnalysisTabs();
  const rows = managerRows();

  document.getElementById("managerCount").textContent = `${rows.length} item${rows.length === 1 ? "" : "s"}`;
  document.getElementById("managerQueue").innerHTML = rows.length
    ? `
      <div class="table-wrap manager-table-wrap">
        <table class="data-table manager-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Project</th>
              <th>Requester</th>
              <th>Submitted At</th>
              <th>Item</th>
              <th>Affected Phases</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th>Gate Owner</th>
              <th>Next Step</th>
              <th>Decision</th>
              <th>Contact</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => {
              return `
              <tr class="${row.id === selectedManagerRequestId ? "active-row" : ""}">
                <td>${row.id}</td>
                <td>${row.project}</td>
                <td>${row.submittedBy || row.requesterName || "Requester"}</td>
                <td>${row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-US") : "-"}</td>
                <td>${row.name}<div class="reason-text">${partName(row)}</div>${isNewMaterial(row) ? itemTypeBadge(row) : ""}${amendmentBadgeHtml(row)}${row.amendmentReason ? `<div class="reason-text">${row.amendmentReason}</div>` : ""}${amendmentQueueSummaryHtml(row)}</td>
                <td>${managerAffectedPhasesText(row)}</td>
                <td>${totalQty(row)}</td>
                <td><span class="status-pill ${statusClass(managerQueueStatus(row))}">${managerQueueStatus(row)}</span>${row.amendmentStatus ? `<div>${amendmentBadgeHtml(row)}</div>` : ""}</td>
                <td>${managerGateOwner(row)}</td>
                <td>${managerQueueNextStep(row)}</td>
                <td>${managerDecisionCell(row)}</td>
                <td><button class="mini return" type="button" data-contact-dri="${row.id}">Contact DRI</button></td>
                <td>${itemDetailButton("request", row.id)}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>`
    : `<div class="empty-state">No requests match the selected filters.</div>`;
  renderProjectSetup();
  renderManagerStageTracking();
  renderManagerDemandCostDashboard();
  syncManagerQuantityScopeFromDemandCost();
  renderManagerQuantityMatrix();
  renderManagerDashboard();
}

function managerCostRows() {
  const projectFilter = document.getElementById("managerCostProjectFilter")?.value || "";
  return requests.filter((row) => {
    return ["Submitted", "Approved"].includes(row.status)
      && (!projectFilter || row.project === projectFilter);
  });
}

function effectiveUnitPrice(row) {
  return legacyPriceToUsd(row, "updatedPrice") || legacyPriceToUsd(row, "unitPrice");
}

function sourcingInitialPrice(row) {
  return Number(row.initialPrice || row.unitPrice || 0);
}

function sourcingNegotiatedPrice(row) {
  return Number(row.updatedPrice || row.negotiatedPrice || 0);
}

function sourcingPriceReduction(row) {
  const initial = sourcingInitialPrice(row);
  const negotiated = sourcingNegotiatedPrice(row);
  if (!initial || !negotiated) return "-";
  return `${Math.max(0, ((initial - negotiated) / initial) * 100).toFixed(1)}%`;
}

function sourcingFinalAmount(row) {
  const negotiated = sourcingNegotiatedPrice(row);
  return negotiated ? negotiated * totalQty(row) : 0;
}

function costConfidence(row) {
  if (row.status === "Submitted") return "Pending Approval";
  if (isNewMaterial(row)) return "New Material / Sourcing Needed";
  const validity = omQuoteValidity(row);
  if (["Quote Expired", "Update Required"].includes(validity)) return "Quote Expired";
  if (["Quote Valid", "Quote Expiring Soon"].includes(validity)) return "Confirmed Cost";
  if ([HANDOFF_SENT_TO_OM, HANDOFF_EXPORTED].includes(row.procurementStatus) || row.rfqStatus || row.rfqDispatchDate) return "Quote Pending";
  if (effectiveUnitPrice(row)) return "Reference Estimate";
  return "Quote Pending";
}

function canEstimateCost(row) {
  return costConfidence(row) === "Confirmed Cost" && effectiveUnitPrice(row) > 0;
}

function stageAmount(row, stage) {
  return canEstimateCost(row) ? clampQty(row[stage]) * effectiveUnitPrice(row) : null;
}

function totalCostAmount(row) {
  if (!canEstimateCost(row)) return null;
  return STAGES.reduce((sum, stage) => sum + stageAmount(row, stage), 0);
}

function renderManagerCostView() {
  renderManagerStageTracking();
}

function getItemDetailRow(sourceType, sourceId) {
  if (sourceType === "warehouse") {
    const row = warehouseInventoryFromId(sourceId) || warehouseSummaryFromId(sourceId);
    if (!row) return null;
    return {
      id: `WH-${row.month}-${row.item}`,
      name: row.item,
      detail: row.spec,
      spec: row.spec,
      project: "All projects",
      status: row.status || (row.availableQty > 0 ? "Available" : "No stock"),
      requesterReason: warehouseTraceText(row),
      procurementRemark: `On hand ${row.onHandQty || 0} / Reserved ${row.reservedQty || 0} / Available ${row.availableQty || 0}`,
      detailSource: "warehouse",
    };
  }
  if (sourceType === "record") return purchaseRecords.find((row) => row.id === sourceId);
  if (sourceType === "catalog") return omCatalogRows(currentProject).find((row) => row.id === sourceId);
  if (sourceType === "request") return requests.find((row) => row.id === sourceId);
  if (sourceType === "suggestion") return newItemSuggestions.find((row) => row.id === sourceId);
  return null;
}

function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${detailValue(value)}</strong></div>`;
}

function detailSection(title, rows) {
  if (!rows.length) return "";
  return `
    <section class="detail-card-section">
      <h4>${title}</h4>
      <div class="detail-section-grid">${rows.join("")}</div>
    </section>`;
}

function estimateVarianceDisplayRows(row) {
  const estimate = Number(row.estimateUnitPriceSnapshotUsd || 0) || estimateUnitPriceUsdForVariance(row);
  const quote = Number(row.quoteUnitPriceSnapshotUsd || 0) || quoteUnitPriceUsdForDecision(row);
  const hasAnyPrice = estimate > 0 || quote > 0 || row.estimateVarianceStatus;
  if (!hasAnyPrice) return [];
  const delta = row.estimateDeltaUsd;
  const percent = row.estimateDeltaPercent;
  const totalDelta = row.estimateTotalDeltaUsd;
  const deltaText = delta === null || delta === undefined
    ? "-"
    : `${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)} USD${percent === null || percent === undefined ? "" : ` / ${Number(percent).toFixed(1)}%`}`;
  return [
    detailRow("Requester Estimate", estimate > 0 ? money(estimate) : "-"),
    detailRow("PAS Quote", quote > 0 ? money(quote) : "-"),
    detailRow("Estimate Delta", deltaText),
    detailRow("Total Estimate Delta", totalDelta === null || totalDelta === undefined ? "-" : money(totalDelta)),
    detailRow("Variance Status", row.estimateVarianceStatus || "Within Estimate Range"),
    detailRow("Variance Reason", row.estimateVarianceReason || "-"),
  ];
}

function omItemCell(row, { stageLabel = "", extraLines = [] } = {}) {
  const lines = [partName(row), row.id, itemDetail(row), ...extraLines].filter(Boolean);
  const title = [row.name, stageLabel, ...lines].filter(Boolean).join(" / ");
  return `
    <div class="item-name-stack" title="${htmlAttr(title)}">
      <strong>${row.name}</strong>
      ${stageLabel ? `<div class="om-row-stage">${stageLabel}</div>` : ""}
      ${row.amendmentApprovedAt ? `<div class="om-returned-pill">Returned from Manager · ${compactTimestamp(row.amendmentApprovedAt)}</div>` : ""}
      ${lines.map((line) => `<span>${line}</span>`).join("")}
      ${isNewMaterial(row) ? itemTypeBadge(row) : ""}
    </div>`;
}

function phaseUsageRows() {
  return [];
}

function phaseUsageTable() {
  return "";
}

function uatRowFeedbackSection(row) {
  if (!isOmRole()) return "";
  const related = feedbackRowsForRequest(row.id);
  const openCount = related.filter((item) => item.status !== "resolved" && item.status !== "dismissed").length;
  return `
    <section class="detail-card-section uat-row-feedback-section">
      <div class="detail-section-head">
        <h4>UAT Feedback</h4>
        <span class="status-pill ${openCount ? "warning" : "info"}">${openCount ? `${openCount} open` : "No open feedback"}</span>
      </div>
      <p class="modal-helper">Submit row-level feedback for OM internal test. Evidence is metadata only.</p>
      <button class="mini return" type="button" data-uat-row-feedback="${htmlAttr(row.id)}" title="Submit row-level UAT feedback">Feedback</button>
    </section>`;
}

function renderItemDetail(row, sourceType) {
  const enrichedRow = applyOmResponsibility(row);
  const type = itemType(row, sourceType);
  const isRequest = sourceType === "request";
  const isSuggestion = sourceType === "suggestion";
  const price = Number(row.updatedPrice || row.unitPrice || 0);
  const canShowOfficialQuote = isOmRole() && hasOmQuoteData(row);
  const quote = currentRole === "manager"
    ? costConfidence(row)
    : canShowOfficialQuote ? omQuoteValidity(row) : "Pending OM verification";
  const route = isSuggestion ? ROUTE_SOURCING : handoffRoute(row);
  const materialRecord = materialMasterRecordFor(row);
  const materialCreationEvent = isRequest ? materialCreationEventFor(row) : null;
  const canSeeInternalQuoteFields = isOmRole() || currentRole === "buyer" || currentRole === "admin";
  const isCostManagerRole = currentRole === "manager";
  const identityRows = currentRole === "requester" ? [
    detailRow("Item", row.name),
    detailRow("Record Source", rowSourceLabel(row)),
    detailRow("Project", row.project),
    detailRow("Need Date", needDateForRow(row) || "-"),
    detailRow("Detail / Spec", userVisibleItemDetail(row)),
    detailRow("Item Type", type),
  ] : isCostManagerRole ? [
    detailRow("Item", row.name),
    detailRow("Record Source", rowSourceLabel(row)),
    detailRow("Project", row.project),
    detailRow("Need Date", needDateForRow(row) || "-"),
    detailRow("Detail / Spec", itemDetail(row)),
    detailRow("Item Type", type),
  ] : [
    detailRow("Item", row.name),
    detailRow("Record Source", rowSourceLabel(row)),
    ...(row.catalogBucket ? [detailRow("OM Catalog Bucket", row.catalogBucket)] : []),
    ...(factoryMaterialNoFor(row) ? [detailRow("Factory Material No.", factoryMaterialNoFor(row))] : []),
    detailRow("Legacy Material No.", materialNoFor(row) || "Not assigned"),
    detailRow("Material ID", materialIdFor(row)),
    detailRow("Material Status", materialControlStatus(row)),
    detailRow("Material Creation Source", materialCreationEvent?.reason || materialRecord?.source || (isMaterialNoPending(row) ? "Pending PR / PO evidence" : "-")),
    detailRow("Material Created By", materialRecord?.createdBy || materialCreationEvent?.createdBy || "-"),
    detailRow("Material Created At", materialRecord?.createdAt ? new Date(materialRecord.createdAt).toLocaleString("en-US") : materialCreationEvent?.createdAt ? new Date(materialCreationEvent.createdAt).toLocaleString("en-US") : "-"),
    detailRow("Standard Part Name CN", row.standardNameCn || row.name || "-"),
    detailRow("Part Name EN", row.standardNameEn || "-"),
    detailRow("Part Name VN", row.standardNameVn || "-"),
    detailRow("Station", stationDisplay(row)),
    detailRow("Detail / Spec", currentRole === "requester" ? userVisibleItemDetail(row) : itemDetail(row)),
    detailRow("Material Name", partName(row)),
    detailRow("Material Identity Key", materialIdentityKey(row)),
    detailRow("Created From", row.sourceRecordId || row.sourceSuggestionId || row.id || "-"),
    detailRow("Source Project", row.sourceProject || row.project || "-"),
    detailRow("Item Type", type),
    detailRow("Project", row.project),
    detailRow("Need Date", needDateForRow(row) || "-"),
  ];

  const requesterQuoteRows = currentRole === "requester" && isOmBuyScope(row) ? [
    detailRow("Action Required Status", userQuoteStageLabel(row)),
    detailRow("Quoted Amount", userQuoteAmountLabel(row)),
    detailRow("Quote Date", row.quoteDate || "-"),
    detailRow("Attachment Status", userQuoteAttachmentStatus(row)),
    ...(row.userAQuoteCancelReason ? [detailRow("Cancel Reason", row.userAQuoteCancelReason)] : []),
  ] : [];
  const internalOmFlowRows = currentRole === "requester" ? [] : isCostManagerRole ? [
    detailRow("OM Buy Scope Status", omBuyScopeStatus(enrichedRow)),
    detailRow("PAS Status", pasDisplayStatus(row)),
    detailRow("Budget / Package Code", row.finalExportPackageCode || "Not prepared"),
    detailRow("Next Step", managerNextStep(row)),
    detailRow("Cost Confidence", quote),
    detailRow("Unit Price Reference", price ? money(price) : "Pending"),
    detailRow("Remark", row.procurementRemark || "No OM remark yet."),
  ] : [
    detailRow("OM Buy Scope Status", omBuyScopeStatus(enrichedRow)),
    detailRow("OM Classification", omCategoryPath(enrichedRow) || enrichedRow.omClassificationStatus || "Need OM Classification"),
    detailRow("CPD-IEP Owner", enrichedRow.omOwner || "Pending OM Classification"),
    detailRow("OM Routing Reason", omBuyScopeReason(enrichedRow)),
    detailRow("PAS Status", pasDisplayStatus(row)),
    detailRow("PAS Project Code", row.pasProjectCode || "Pending PAS review"),
    detailRow("PAS Budget Amount", row.pasBudgetAmount ? money(row.pasBudgetAmount) : "Pending PAS review"),
    detailRow("PAS Comment", row.pasComment || "No PAS comment yet."),
    detailRow("Budget / Package Code", row.finalExportPackageCode || "Not prepared"),
    detailRow("Source Budget No.", row.budgetNo || "-"),
    detailRow("Payment Method", OM_PAYMENT_METHOD),
    detailRow("Next Step", managerNextStep(row)),
    detailRow("LV Search Path", [row.level1, row.level2, row.level3].filter(Boolean).join(" / ") || "Not selected"),
    ...(canSeeInternalQuoteFields ? [detailRow("Vendor", isSuggestion ? "TBD" : row.vendor || "Pending OM verification")] : []),
    detailRow(currentRole === "manager" ? "Cost Confidence" : "Quote Status", quote),
    ...(canShowOfficialQuote ? [
      detailRow("Quote Date", isSuggestion ? "Pending" : row.quoteDate || "Pending"),
      detailRow("Quote Expiry", isSuggestion ? "Pending" : row.quoteExpiry || "Pending"),
      detailRow("Quote Screenshot", omQuoteScreenshotFile(row) || "No screenshot"),
      detailRow("Quote Excel", row.quotationExcel || "No Excel"),
    ] : []),
    ...(canSeeInternalQuoteFields ? [detailRow("Unit Price Reference", price ? money(price) : "Pending")] : []),
    ...(canSeeInternalQuoteFields ? [detailRow("Remark", row.procurementRemark || "No OM remark yet.")] : []),
  ];
  const omFlowRows = [
    ...requesterQuoteRows,
    ...internalOmFlowRows,
    ...(currentRole === "requester" && isOmBuyScope(row) ? [
      detailRow("Action", "Confirm need or cancel from Action Required when a quote is waiting."),
    ] : []),
    ...(isRequest || isSuggestion ? [detailRow("Reason / Use Case", row.requesterReason || row.useCase || "No requester reason provided.")] : []),
  ];

  const pasTrackingRows = !canSeeInternalQuoteFields ? [] : [
    detailRow("Demand No", row.pasDemandNo || "Waiting PAS Demand No"),
    detailRow("PAS Material No", row.pasMaterialNo || "Waiting PAS Material No"),
    ...(factoryMaterialNoFor(row) ? [detailRow("Factory Material No", factoryMaterialNoFor(row))] : []),
    detailRow("Legal Name", pasLegalName(row)),
    detailRow("Request Dept", pasRequestDept(row)),
    detailRow("Data Transfer To", pasDataTransferTo(row)),
    detailRow("Demand Date", pasDemandDate(row)),
    detailRow("PAS Part Name", pasPartName(row) || "-"),
    detailRow("PAS Brand", pasBrand(row) || "Brand pending"),
    detailRow("PAS Spec", pasSpec(row) || "-"),
    detailRow("PAS Sent At", row.pasRequestSentAt ? new Date(row.pasRequestSentAt).toLocaleString("en-US") : "-"),
    detailRow("Demand No Updated At", row.pasDemandNoUpdatedAt ? new Date(row.pasDemandNoUpdatedAt).toLocaleString("en-US") : "-"),
    detailRow("PAS Material No Updated At", row.pasMaterialNoUpdatedAt ? new Date(row.pasMaterialNoUpdatedAt).toLocaleString("en-US") : "-"),
    detailRow("PAS Item Info Updated At", row.pasItemInfoUpdatedAt ? new Date(row.pasItemInfoUpdatedAt).toLocaleString("en-US") : "-"),
  ];
  const amendmentRows = amendmentReferenceRows(row);
  const estimateVarianceRows = estimateVarianceDisplayRows(row);
  const priceDecisionRows = currentRole === "requester" ? [] : [
    detailRow("Price Decision", row.priceDecisionStatus || "Not evaluated"),
    detailRow("Approval Status", row.priceApprovalStatus || "-"),
    detailRow("Threshold Category", row.priceThresholdCategory || "-"),
    detailRow("History Price", row.historyUnitPrice ? money(row.historyUnitPrice) : "No history"),
    detailRow("Quote Price", row.quoteUnitPrice ? money(row.quoteUnitPrice) : row.updatedPrice ? money(quoteUnitPriceUsdForDecision(row)) : "-"),
    detailRow("Price Delta", priceVarianceLabel(row)),
    detailRow("Delta Threshold", row.priceThresholdUsd !== undefined ? `${Number(row.priceThresholdUsd || 0.4).toFixed(2)} USD` : "-"),
    detailRow("Exchange Rate Month", row.exchangeRateMonth || budgetApprovedExchangeRateMonth(row)),
    detailRow("Decision Reason", row.priceDecisionReason || "-"),
    detailRow("Approval Chain", row.priceApprovalChain || adminApprovalSetup.approvalChain.join(" -> ")),
    detailRow("Dept DRI Approved", row.driApprovedAt ? `${row.driApprovedBy || "Dept DRI"} / ${compactDateTime(row.driApprovedAt)}` : "-"),
    detailRow("Budget Approver Approved", row.projectDriApprovedAt ? `${row.projectDriApprovedBy || "Budget Approver"} / ${compactDateTime(row.projectDriApprovedAt)}` : "-"),
    ...(row.priceEscalationRejectReason ? [detailRow("Reject Reason", row.priceEscalationRejectReason)] : []),
  ].filter(Boolean);

  const downstreamRows = [];
  if (isRequest) {
    const demand = stageDemandMetric(row);
    downstreamRows.push(
      detailRow("External Reject Owner", row.externalRejectOwner || "No external rejection."),
      detailRow("External Reject Reason", row.externalRejectReason || "No external rejection."),
      detailRow("Phase Qty", stageQtyText(row)),
      detailRow("Total Qty", totalQty(row)),
      detailRow("Status", row.status),
      detailRow("Decision Reason", row.managerReason || "No decision note yet."),
      detailRow("Handoff Route", route),
      detailRow("External System", row.externalSystem || "Pending external update"),
      detailRow("External Request No.", row.externalRequestNo || "Pending"),
      detailRow("External Status", externalStatusFor(row)),
      detailRow("Evidence Count", externalEvidenceCount(row)),
      detailRow("Buyer Status", buyerStatusFor(row)),
      detailRow("PR No.", row.prNo || "Pending"),
      detailRow("PO No.", row.buyerPoNo || row.poNo || "Pending"),
      detailRow("Planned Demand", demand.baselineDemand ?? "Missing plan"),
      detailRow("Carryover", demand.carryoverStock),
      detailRow("Need to Buy", demand.suggestedNewBuy)
    );
  }
  const detailRows = [...identityRows, ...omFlowRows, ...downstreamRows];

  document.getElementById("itemDetailTitle").textContent = `${detailValue(row.name, "Item detail")}`;
  const badge = document.getElementById("itemDetailBadge");
  badge.textContent = type;
  badge.className = `status-pill item-type-badge ${statusClass(type)}`;
  const useGroupedDetail = isRequest;
  const groupedDetailHtml = useGroupedDetail
    ? [
      detailSection("Item & Material", identityRows),
      `<section class="detail-card-section"><h4>需求單位 / Station Breakdown</h4>${stationBreakdownDetailHtml(row)}</section>`,
      detailSection("OM Quote & PAS", omFlowRows),
      detailSection("Estimate vs PAS Quote", estimateVarianceRows),
      detailSection("PAS Tracking", pasTrackingRows),
      detailSection("Price Decision Audit", priceDecisionRows),
      ...(amendmentRows.length ? [detailSection("Amendment / Previous Quote Reference", amendmentRows)] : []),
      detailSection("Flow & Buyer Handoff", downstreamRows),
    ].join("")
    : `<div class="item-detail-grid">${detailRows.join("")}</div>`;

  document.getElementById("itemDetailBody").innerHTML = `
    <aside class="item-photo-card" aria-label="Product photo placeholder">
      <div class="item-photo-box">
        <span>Product Photo</span>
        <strong>${type}</strong>
      </div>
      <p>Prototype placeholder. IT can connect the real product image source later.</p>
    </aside>
    <div class="${useGroupedDetail ? "item-detail-grouped" : "item-detail-grid-wrap"}">${groupedDetailHtml}</div>
    ${isRequest ? uatRowFeedbackSection(row) : ""}
    ${isRequest ? omPackageHistoryHtml(row) : ""}
    ${isRequest ? externalProgressTimelineHtml(row) : ""}`;
}

function openItemDetail(sourceType, sourceId) {
  const row = getItemDetailRow(sourceType, sourceId);
  if (!row) {
    showToast("Item detail is not available.", "error");
    return;
  }
  renderItemDetail(row, sourceType);
  document.getElementById("itemDetailModal").hidden = false;
}

function closeItemDetail() {
  document.getElementById("itemDetailModal").hidden = true;
}

function openMfgPackageDetail(packageId) {
  const row = MFG_PACKAGE_ROWS.find((item) => item.id === packageId);
  if (!row) {
    showToast("MFG package detail is not available.", "error");
    return;
  }
  const missing = Math.max(0, row.required - row.completed);
  const collectionStatus = mfgCollectionStatusMeta(row);
  document.getElementById("itemDetailTitle").textContent = `${row.project} / ${row.packageType} Package`;
  const badge = document.getElementById("itemDetailBadge");
  badge.textContent = collectionStatus.label;
  badge.className = `status-pill ${statusClass(collectionStatus.label)}`;
  document.getElementById("itemDetailBody").innerHTML = `
    <aside class="item-photo-card" aria-label="MFG package evidence placeholder">
      <div class="item-photo-box">
        <span>Package Evidence</span>
        <strong>${row.excelSheet}</strong>
      </div>
      <p>Pictures and supporting files are tracked as evidence before collection is marked complete.</p>
    </aside>
    <div class="item-detail-grid">
      ${detailRow("Project", row.project)}
      ${detailRow("Phase", row.phase)}
      ${detailRow("Collection Form", row.packageType)}
      ${detailRow("Expected Inputs", row.required)}
      ${detailRow("Received Inputs", row.completed)}
      ${detailRow("Not Submitted", missing)}
      ${detailRow("Collection Status", collectionStatus.label)}
      ${detailRow("Excel Sheet Format", row.excelSheet)}
      ${detailRow("Collection Scope", "Model / Material No. / English Name / Vietnamese Name / Spec / Picture / Unit / Usage Qty / Used By / Purpose / Budget / Type / Remark / No. of quotation")}
      ${detailRow("Coordinator Note", row.detail)}
    </div>`;
  document.getElementById("itemDetailModal").hidden = false;
}

const MANAGER_MFG_HEADER_MASTER = {
  mainline: ["CG", "BG", "FATP", "Test", "Hybrid", "Auto"],
  packing: ["ENG Pack", "Zombie", "Laser_pico", "Rework"],
  supporting: ["Repair", "WH"],
  calculation: ["Buffer", "Total Demand for EQ", "Stock", "Actual Need QTY"],
};

const MANAGER_NON_MFG_HEADER_MASTER = ["Department", "Demand", "Buffer", "Total Demand for EQ", "Stock", "Actual Need QTY"];

function managerDetailMode(row) {
  if (Array.isArray(row?.stationBreakdown) && row.stationBreakdown.length) return "MFG";
  const text = normalize(`${row.station || ""} ${row.process || ""} ${row.department || ""}`);
  return /mainline|packing|support|repair|warehouse|mfg|cg|bg|fatp|test|hybrid|auto|laser|zombie|rework/.test(text)
    ? "MFG"
    : "Non-MFG";
}

function managerDetailSameItemRows(baseRow, stage) {
  const baseMaterial = normalize(itemKeyDisplay(baseRow));
  const baseName = normalize(baseRow.name);
  const rows = stageDemandRows(baseRow.project, stage).filter((row) => {
    const sameMaterial = baseMaterial && normalize(itemKeyDisplay(row)) === baseMaterial;
    const sameName = baseName && normalize(row.name) === baseName;
    return sameMaterial || sameName;
  });
  return rows.length ? rows : [baseRow];
}

function managerDetailStationQty(row, stage, station) {
  if (Array.isArray(row?.stationBreakdown)) {
    return row.stationBreakdown
      .filter((item) => normalize(item.station) === normalize(station))
      .reduce((sum, item) => {
        if (isLongFormStationBreakdown(item)) {
          return sum + (stationBreakdownPhaseKey(item) === stage ? stationBreakdownRowTotal(item) : 0);
        }
        return sum + clampQty(item[stage]);
      }, 0);
  }
  const normalized = normalize(station).replace(/[^a-z0-9]+/g, "");
  const candidates = [`${stage}_${normalized}`, `${stage}${normalized}`, normalized, station];
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row || {}, key)) return clampQty(row[key]);
  }
  const rowStation = normalize(`${row.station || ""} ${row.process || ""}`);
  return rowStation.includes(normalize(station)) ? clampQty(row[stage]) : 0;
}

function managerDetailCalculation(row, stage) {
  const metric = stageDemandMetric(row, row.detailSource || "request", stage);
  return {
    buffer: clampQty(row[`${stage}_buffer`] || row.buffer || 0),
    totalDemand: clampQty(row[`${stage}_totalDemandForEq`] || row.totalDemandForEq || row[stage]),
    stock: clampQty(row[`${stage}_stock`] || metric.carryoverStock),
    actualNeed: clampQty(row[`${stage}_actualNeedQty`] || metric.suggestedNewBuy),
  };
}

function managerDetailFullPhaseSummary(baseRow) {
  const phaseQty = Object.fromEntries(STAGES.map((stage) => [stage, 0]));
  let carryover = 0;
  let needToBuy = 0;
  STAGES.forEach((stage) => {
    const rows = managerDetailSameItemRows(baseRow, stage);
    phaseQty[stage] = rows.reduce((sum, row) => sum + clampQty(row[stage]), 0);
    carryover += rows.reduce((sum, row) => sum + managerDetailCalculation(row, stage).stock, 0);
    needToBuy += rows.reduce((sum, row) => sum + managerDetailCalculation(row, stage).actualNeed, 0);
  });
  const values = STAGES.map((stage) => phaseQty[stage]);
  const nonZero = values.filter((value) => value > 0);
  let phaseTrend = "No Plan";
  if (nonZero.length) {
    phaseTrend = "Stable";
    for (let index = 1; index < values.length; index += 1) {
      if (values[index - 1] > 0 && values[index] > values[index - 1]) phaseTrend = "Unexpected Increase";
    }
    if (phaseTrend === "Stable" && nonZero[nonZero.length - 1] < Math.max(...nonZero)) phaseTrend = "Drop After Pilot";
  }
  return { phaseQty, totalQty: values.reduce((sum, value) => sum + value, 0), carryover, needToBuy, phaseTrend };
}

function managerPhaseOverviewHtml(row) {
  const summary = managerDetailFullPhaseSummary(row);
  return `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Item Full Phase Overview</h4>
          <p class="panel-subcopy">Compare total quantity, carryover, and need-to-buy across each project phase before drilling into station or department detail.</p>
        </div>
      </div>
      <div class="table-wrap compact-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              ${STAGES.map((stage) => `<th>${STAGE_LABELS[stage]} Qty</th>`).join("")}
              <th>Total Qty</th>
              <th>Carryover</th>
              <th>Need to Buy</th>
              <th>Phase Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              ${STAGES.map((stage) => `<td>${summary.phaseQty[stage]}</td>`).join("")}
              <td>${summary.totalQty}</td>
              <td>${summary.carryover}</td>
              <td>${summary.needToBuy}</td>
              <td><span class="status-pill ${statusClass(summary.phaseTrend)}">${summary.phaseTrend}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`;
}

function managerBreakdownHtml(row) {
  const mode = managerDetailMode(row);
  if (mode === "MFG") {
    const stationColumns = [
      ...MANAGER_MFG_HEADER_MASTER.mainline,
      ...MANAGER_MFG_HEADER_MASTER.packing,
      ...MANAGER_MFG_HEADER_MASTER.supporting,
    ];
    return `
      <section class="work-panel detail-subsection">
        <div class="panel-title section-head-tight">
          <div>
            <h4>Station Breakdown</h4>
            <p class="panel-subcopy">Use this matrix to spot which MFG station or calculation field is pulling quantity up across P1.0 to MP.</p>
          </div>
        </div>
        <div class="table-wrap stage-demand-wrap">
          <table class="data-table manager-progress-detail-table">
            <thead>
              <tr>
                <th>Phase</th>
                ${stationColumns.map((station) => `<th>${station}</th>`).join("")}
                ${MANAGER_MFG_HEADER_MASTER.calculation.map((item) => `<th>${item}</th>`).join("")}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${STAGES.map((stage) => {
                const rows = managerDetailSameItemRows(row, stage);
                const calc = rows.reduce((sum, item) => {
                  const values = managerDetailCalculation(item, stage);
                  sum.buffer += values.buffer;
                  sum.totalDemand += values.totalDemand;
                  sum.stock += values.stock;
                  sum.actualNeed += values.actualNeed;
                  return sum;
                }, { buffer: 0, totalDemand: 0, stock: 0, actualNeed: 0 });
                const stationValues = stationColumns.map((station) => rows.reduce((sum, item) => sum + managerDetailStationQty(item, stage, station), 0));
                return `<tr>
                  <td>${STAGE_LABELS[stage]}</td>
                  ${stationValues.map((value) => `<td>${value}</td>`).join("")}
                  <td>${calc.buffer}</td>
                  <td>${calc.totalDemand}</td>
                  <td>${calc.stock}</td>
                  <td>${calc.actualNeed}</td>
                  <td>${rows.reduce((sum, item) => sum + clampQty(item[stage]), 0)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  return `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Department Breakdown</h4>
          <p class="panel-subcopy">Use this matrix to compare non-MFG demand, buffer, stock, and actual need by phase.</p>
        </div>
      </div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              <th>Phase</th>
              ${MANAGER_NON_MFG_HEADER_MASTER.map((item) => `<th>${item}</th>`).join("")}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${STAGES.map((stage) => {
              const rows = managerDetailSameItemRows(row, stage);
              const department = [...new Set(rows.map((item) => normalizedNonMfgDepartment(item)).filter(Boolean))].join(" / ") || "-";
              const demand = rows.reduce((sum, item) => sum + clampQty(item[stage]), 0);
              const calc = rows.reduce((sum, item) => {
                const values = managerDetailCalculation(item, stage);
                sum.buffer += values.buffer;
                sum.totalDemand += values.totalDemand;
                sum.stock += values.stock;
                sum.actualNeed += values.actualNeed;
                return sum;
              }, { buffer: 0, totalDemand: 0, stock: 0, actualNeed: 0 });
              return `<tr>
                <td>${STAGE_LABELS[stage]}</td>
                <td>${department}</td>
                <td>${demand}</td>
                <td>${calc.buffer}</td>
                <td>${calc.totalDemand}</td>
                <td>${calc.stock}</td>
                <td>${calc.actualNeed}</td>
                <td>${calc.totalDemand}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}

function renderManagerDetail({ readonly = false } = {}) {
  document.getElementById("managerDetailModal")?.classList.remove("contact-detail-mode");
  const row = requests.find((item) => item.id === selectedManagerRequestId);
  if (!row) {
    document.getElementById("managerDetailTitle").textContent = "Select a request";
    document.getElementById("managerDetailStatus").className = "status-pill draft";
    document.getElementById("managerDetailStatus").textContent = "No request";
    document.getElementById("managerDetail").innerHTML = `<div class="empty-state">Select a request from the queue.</div>`;
    return;
  }

  document.getElementById("managerDetailTitle").textContent = `Cost Manager Request Detail · ${row.id}`;
  document.getElementById("managerDetailStatus").className = `status-pill ${statusClass(row.status)}`;
  document.getElementById("managerDetailStatus").textContent = row.status;
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Request Information</h4></div>
      ${detailSummaryGridHtml([
        ["Request ID", row.id, row.project],
        ["Item", row.name, itemKeyDisplay(row)],
        ["Station Rows", stationBreakdownRowsCount(row), stationBreakdownStatus(row)],
        ["Total Qty", totalQty(row), managerAffectedPhasesText(row)],
        ["Estimated Budget", row.estimatedAmount ? formatVnd(row.estimatedAmount) : row.estimatedUnitPrice ? `${formatVnd(row.estimatedUnitPrice)} / unit` : "-", row.budgetRemark || "Requester run-ahead estimate"],
        ["Detail / Spec", itemDetail(row) || "-", partName(row)],
        ["Reason / Use Case", row.requesterReason || row.useCase || "No requester reason provided."],
        ["Reject Reason", row.managerReason || "-", row.managerReason ? "Decision note recorded" : "No reject reason"],
        ["Submitted", row.submittedAt ? new Date(row.submittedAt).toLocaleString("en-US") : "-", row.submittedBy || row.requesterName || "Requester"],
      ])}
    </section>
    ${amendmentReferenceRows(row).length ? `
      <section class="work-panel detail-subsection">
        <div class="panel-title section-head-tight"><h4>Amendment Before / After</h4></div>
        <div class="item-detail-grid">${amendmentReferenceRows(row).join("")}</div>
      </section>` : ""}
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>需求單位 / Station Breakdown</h4></div>
      ${stationBreakdownDetailHtml(row)}
    </section>
    ${managerPhaseOverviewHtml(row)}
    ${managerBreakdownHtml(row)}
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Timeline / Evidence</h4></div>
      ${managerAuditTimelineHtml(row)}
      ${omPackageHistoryHtml(row)}
      ${externalProgressTimelineHtml(row)}
    </section>`;

}

function openManagerDetail(requestId, { readonly = false } = {}) {
  selectedManagerRequestId = requestId;
  renderManager();
  renderManagerDetail({ readonly });
  document.getElementById("managerDetailModal").hidden = false;
}

function closeManagerDetail() {
  const modal = document.getElementById("managerDetailModal");
  modal?.classList.remove("contact-detail-mode");
  if (modal) modal.hidden = true;
}

function closeManagerTrack() {
  const modal = document.getElementById("managerTrackModal");
  if (modal) modal.hidden = true;
}

function temporaryBudgetOmQuoteRoutingPatch(item, now = new Date().toISOString()) {
  const omPatch = omResponsibilityPatch(item);
  const itemWithOm = { ...item, ...omPatch };
  const scopeStatus = omBuyScopeStatus(itemWithOm);
  const scopeReason = omBuyScopeReason(itemWithOm);
  return {
    ...omPatch,
    temporaryBudgetManagerNotifiedAt: now,
    temporaryBudgetManagerBypass: true,
    decidedAt: now,
    omScopeStatus: scopeStatus,
    omScopeReason: scopeReason,
    nextStep: "OM PAS / Quote before Dept DRI and Budget Approver review",
    procurementStatus: HANDOFF_SENT_TO_OM,
    pasStatus: item.pasStatus || PAS_WAITING,
    pasRequired: true,
    omStatus: OM_RECEIVED,
    omStage: "pasRequest",
    omCollectionStatus: OM_COLLECTION_COLLECTING,
    finalSpecStatus: item.finalSpecStatus || omFinalSpecStatus(itemWithOm),
    sentToOmAt: item.sentToOmAt || now,
  };
}

function omLeaderIntakeRoutingPatch(item, now = new Date().toISOString()) {
  return {
    ...temporaryBudgetOmQuoteRoutingPatch(item, now),
    temporaryBudgetManagerBypass: isTemporaryBudgetRequest(item) ? true : item.temporaryBudgetManagerBypass,
    nextStep: "OM Leader intake / PAS Demand No assignment",
  };
}

function deptDriSubmissionReviewPatch(now = new Date().toISOString()) {
  return {
    deptDriReviewStatus: DEPT_DRI_SUBMISSION_PENDING,
    deptDriReviewType: "Submission",
    deptDriReviewSubmittedAt: now,
    deptDriReviewReworkRequired: false,
    deptDriReviewRejectReason: "",
    nextStep: "Dept DRI submission review",
    procurementStatus: "",
    pasStatus: "",
    pasRequired: "",
    omStatus: "",
    omStage: "",
    omCollectionStatus: "",
    sentToOmAt: "",
  };
}

function reviewedRows() {
  return managerDecisionHistoryRows();
}

function renderManagerDashboard() {
  const rows = managerDecisionHistoryRows();
  document.getElementById("managerDashboardSummary").innerHTML = summaryCardsHtml([
    { label: "Dept DRI Approved", value: rows.filter((row) => row.status === "Approved").length, helper: `${document.getElementById("managerDashboardProjectFilter")?.value || "All projects"} · decision history`, variant: "hero" },
    { label: "Rejected", value: rows.filter((row) => row.status === "Rejected").length },
    { label: "Returned to Requester", value: rows.filter((row) => row.status === "Rejected").length, helper: "Reject loop is visible" },
    { label: "Decision Notes", value: rows.filter((row) => row.managerReason).length, helper: "Rows with recorded reason" },
  ]);

  document.getElementById("managerDashboardRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${omItemCell(row, { stageLabel: "Dept DRI history" })}</td>
        <td>${managerAffectedPhasesText(row)}</td>
        <td>${totalQty(row)}</td>
        <td><span class="status-pill ${statusClass(row.status)}">${row.status}</span></td>
        <td>${row.managerReason || "-"}</td>
        <td>${row.decidedAt ? new Date(row.decidedAt).toLocaleString("en-US") : "-"}</td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="9" class="empty-cell">No approval history is available.</td></tr>`;
}

function openManagerDashboardPhaseDetail(project, stage) {
  const rows = stageDemandRows(project, stage);
  document.getElementById("managerDetailTitle").textContent = `${project} / ${STAGE_LABELS[stage]} Dashboard Detail`;
  document.getElementById("managerDetailStatus").className = "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = "Project Phase";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Project / Phase Item Overview</h4></div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Mode</th>
              <th>Item</th>
              <th>Tracking Ref</th>
              <th>Station / Department</th>
              <th>Phase Qty</th>
              <th>Carryover</th>
              <th>Need to Buy</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map((row) => {
              const metric = stageDemandMetric(row, row.detailSource || "record", stage);
              return `<tr>
                <td>${managerDetailMode(row)}</td>
                <td>${row.name}</td>
                <td>${itemKeyDisplay(row)}</td>
                <td>${stationDisplay(row)}</td>
                <td>${clampQty(row[stage])}</td>
                <td>${metric.carryoverStock}</td>
                <td>${metric.suggestedNewBuy}</td>
                <td>${itemDetailButton(row.detailSource || "record", row.detailId || row.id)}</td>
              </tr>`;
            }).join("") : `<tr><td colspan="8" class="empty-cell">No item data is available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerDetailModal").hidden = false;
}

function procurementRows() {
  const projectFilter = document.getElementById("handoffProjectFilter").value;
  const routeFilter = document.getElementById("handoffRouteFilter").value;
  const exportFilter = document.getElementById("handoffExportStatusFilter").value;
  return requests.filter((row) => {
    const visible = row.status === "Approved" && row.procurementStatus === HANDOFF_READY;
    return visible
      && (!projectFilter || row.project === projectFilter)
      && (!routeFilter || handoffRoute(row) === routeFilter)
      && (!exportFilter || exportStatus(row) === exportFilter);
  });
}

function pasReviewRows() {
  return requests.filter((row) => row.status === "Approved"
    && row.procurementStatus === HANDOFF_WAITING_PAS
    && isPasRequired(row)
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row));
}

function omPasRequestStatus(row) {
  if (externalStatusFor(row) === EXT_REJECTED_DRI || row.status === "Rejected") return "Rejected to DRI";
  if (row.pasDemandNo) return "PAS Demand No Ready";
  return "Waiting PAS Demand No";
}

function defaultOmAssigneeForProject(project) {
  const projectCode = String(project || "").trim().toUpperCase();
  const employeeId = ["P27", "F27"].includes(projectCode) ? "linhnp" : "giangth1";
  return omAssignees.find((user) => user.employeeId === employeeId || String(user.email || "").toLowerCase().startsWith(employeeId));
}

function omAssignmentForRow(row) {
  const explicitAssignment = omAssignmentMap.get(row.id);
  if (explicitAssignment) return explicitAssignment;
  const defaultAssignee = defaultOmAssigneeForProject(row.project);
  return {
    requestId: row.id,
    assignedToUserId: row.omAssigneeId || defaultAssignee?.id || "",
    assignedToName: row.omAssigneeName || defaultAssignee?.name || "",
    assignedByName: row.omAssignedBy || (defaultAssignee ? "System auto assignment" : ""),
    assignedAt: row.omAssignedAt || "",
    assignmentStatus: row.omAssigneeId ? "assigned" : defaultAssignee ? "auto" : "unassigned",
    assignmentNote: defaultAssignee ? "Linh owns P27/F27; Giang owns other OM work rows by default." : "",
  };
}

function omAssigneeName(row) {
  const assignment = omAssignmentForRow(row);
  return assignment.assignedToName || omAssignees.find((user) => user.id === assignment.assignedToUserId)?.name || "";
}

function currentOmUserId() {
  return sessionUserFromRole(currentRole).id;
}

function canOperateOmRow(row) {
  const assignment = omAssignmentForRow(row);
  return globalThis.ProcurementApp?.roleGuards?.canOperateOmRow({
    role: currentRole,
    assignment,
    currentUserId: currentOmUserId(),
  }) ?? (
    currentRole === "admin"
      || (currentRole === "omMember" && Boolean(assignment.assignedToUserId && assignment.assignedToUserId === currentOmUserId()))
  );
}

function omRowAccessReason(row) {
  return globalThis.ProcurementApp?.roleGuards?.omRowAccessReason({
    canOperate: canOperateOmRow(row),
    assigneeName: omAssigneeName(row),
  }) || "";
}

function ensureOmRowAccess(row, action = "update this OM row") {
  if (canOperateOmRow(row)) return true;
  const reason = omRowAccessReason(row);
  showToast(`${sessionUserFromRole().name} cannot ${action}. ${reason}`, "error");
  return false;
}

function omActionDisabledAttr(row, baseDisabled = false) {
  return baseDisabled || !canOperateOmRow(row) ? "disabled" : "";
}

function omAssignmentCell(row) {
  const assignment = omAssignmentForRow(row);
  const assignedId = assignment.assignedToUserId || "";
  if (isOmLeaderRole()) {
    return `
      <label class="om-assignment-control">
        <span>Assigned To</span>
        <select data-om-assignee-id="${row.id}">
          <option value="">Unassigned</option>
          ${omAssignees.map((user) => `<option value="${user.id}" ${user.id === assignedId ? "selected" : ""}>${user.name} · ${user.role === "omLeader" ? "Leader" : "Member"}</option>`).join("")}
        </select>
      </label>
      <div class="reason-text">${assignment.assignedByName ? `By ${assignment.assignedByName}` : "Mai can assign this row."}</div>`;
  }
  const assignee = omAssigneeName(row);
  return `
    <span class="status-pill ${assignee ? "info" : "warning"}">${assignee || "Unassigned"}</span>
    <div class="reason-text">${canOperateOmRow(row) ? "Your OM work row" : omRowAccessReason(row)}</div>`;
}

async function assignOmRow(requestId, assignedToUserId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (!isOmLeaderRole()) {
    showToast("Only OM Leader can assign OM rows.", "error");
    renderOmPurchasing();
    return;
  }
  const assignee = omAssignees.find((user) => user.id === assignedToUserId);
  if (apiModeEnabled()) {
    try {
      const payload = await apiRequest(`/api/om/requests/${encodeURIComponent(requestId)}/assign`, {
        method: "POST",
        body: { assignedToUserId, note: assignedToUserId ? "Assigned from OM workbench." : "Assignment cleared." },
      });
      applyAssignmentsToRequests(assignedToUserId ? [payload.assignment, ...[...omAssignmentMap.values()].filter((item) => item.requestId !== requestId)] : [...omAssignmentMap.values()].filter((item) => item.requestId !== requestId));
    } catch (error) {
      showToast(`Assignment failed: ${error.message}`, "error");
      renderOmPurchasing();
      return;
    }
  } else {
    const assignment = {
      requestId,
      assignedToUserId: assignedToUserId || "",
      assignedToName: assignee?.name || "",
      assignedByUserId: currentOmUserId(),
      assignedByName: sessionUserFromRole().name || "OM Leader",
      assignedAt: new Date().toISOString(),
      assignmentStatus: assignedToUserId ? "assigned" : "cleared",
      assignmentNote: "Prototype local assignment.",
    };
    applyAssignmentsToRequests(assignedToUserId ? [assignment, ...[...omAssignmentMap.values()].filter((item) => item.requestId !== requestId)] : [...omAssignmentMap.values()].filter((item) => item.requestId !== requestId));
  }
  addOmHistory(row, assignedToUserId ? "OM row assigned" : "OM assignment cleared", assignedToUserId ? `Assigned to ${assignee?.name || assignedToUserId}.` : "Assignment cleared by OM Leader.");
  renderOmPurchasing();
  showToast(assignedToUserId ? `Assigned to ${assignee?.name || "OM user"}.` : "Assignment cleared.", "success");
}

function omPasResultStatus(row) {
  if (isOmWaitingUserConfirm(row)) return OM_WAITING_USER_CONFIRM;
  if (isOmUserConfirmed(row)) return OM_USER_CONFIRMED;
  if (omReadyForBuyer(row)) return "Ready to Send Requester Confirmation";
  if (!row.pasMaterialNo) return "PAS Material No Missing";
  if (row.pasMaterialNo && row.vendor && effectiveUnitPrice(row) && row.quoteDate && omQuoteScreenshotFile(row) && row.quotationExcel && !omQuoteValidUntil(row)) return "Quote Validity Missing";
  if (omQuoteScreenshotFile(row) && !row.quotationExcel) return "Quote Excel Missing";
  if (row.quotationExcel && !omQuoteScreenshotFile(row)) return "Quote Screenshot Missing";
  if (omQuoteScreenshotFile(row) || row.quotationExcel || row.vendor || effectiveUnitPrice(row) || row.quoteDate || omQuoteValidUntil(row)) return "Quote Info Incomplete";
  return "Quote Completion Needed";
}

function omBuyerPackageStatus(row) {
  return omFinalExportStatusLabel(row);
}

function pasLegalName(row) {
  return row.pasLegalName || PAS_LEGAL_NAME;
}

function pasRequestDept(row) {
  return row.pasRequestDept || PAS_REQUEST_DEPT;
}

function pasDataTransferTo(row) {
  return row.pasDataTransferTo || PAS_DATA_TRANSFER_TO;
}

function pasDemandDate(row) {
  return row.pasDemandDate || (row.pasResultReceivedAt ? todayDateString(new Date(row.pasResultReceivedAt)) : todayDateString());
}

function pasPartName(row) {
  return row.pasPartName || row.standardNameEn || row.standardNameCn || partName(row) || row.name || "";
}

function pasBrand(row) {
  return row.pasBrand || row.brand || "";
}

function pasSpec(row) {
  return row.pasSpec || itemDetail(row) || row.spec || "";
}

function pasMissingRequired(row) {
  const missing = [];
  if (!pasPartName(row)) missing.push("Part Name");
  if (!pasSpec(row)) missing.push("Spec");
  if (!totalQty(row)) missing.push("Quantity");
  if (!pasLegalName(row)) missing.push("Legal Name");
  if (!pasRequestDept(row)) missing.push("Request Dept");
  return missing;
}

function pasHeaderContextHtml(row, { editableDemandNo = false, editableMaterialNo = false } = {}) {
  const demandNo = row.pasDemandNo || "";
  const demandNoControl = editableDemandNo
    ? `<input class="pas-inline-input" type="text" value="${demandNo}" placeholder="PAS Demand No" data-om-field="pasDemandNo" data-om-id="${row.id}" />`
    : `<strong>${demandNo || "Waiting PAS Demand No"}</strong>`;
  const pasMaterialNo = row.pasMaterialNo || "";
  const materialNoControl = editableMaterialNo
    ? `<input class="pas-inline-input" type="text" value="${pasMaterialNo}" placeholder="PAS Material No" data-om-field="pasMaterialNo" data-om-id="${row.id}" />`
    : `<strong>${pasMaterialNo || "Waiting PAS Material No"}</strong>`;
  return `
    <div class="pas-context-card">
      <div class="pas-context-line"><span>PAS Demand No</span>${demandNoControl}</div>
      <div class="pas-context-line"><span>PAS Material No</span>${materialNoControl}</div>
      <div class="pas-context-line"><span>Legal</span><strong>${pasLegalName(row)}</strong></div>
      <div class="pas-context-line"><span>Request Dept</span><strong>${pasRequestDept(row)}</strong></div>
      <div class="pas-context-line"><span>Transfer To</span><strong>${pasDataTransferTo(row)}</strong></div>
    </div>`;
}

function pasItemInfoHtml(row, { editable = false } = {}) {
  const missing = pasMissingRequired(row);
  if (!editable) {
    return `
      <div class="pas-context-card">
        <div class="pas-context-line"><span>Part Name</span><strong>${pasPartName(row) || "-"}</strong></div>
        <div class="pas-context-line"><span>Brand</span><strong>${pasBrand(row) || "Brand pending"}</strong></div>
        <div class="pas-context-line"><span>Spec</span><strong>${pasSpec(row) || "-"}</strong></div>
        ${missing.length ? `<div class="pas-warning-line">Missing ${missing.join(" / ")}</div>` : ""}
      </div>`;
  }
  return `
    <div class="pas-item-editor">
      <label>Part Name<input type="text" value="${pasPartName(row)}" placeholder="Part Name" data-om-field="pasPartName" data-om-id="${row.id}" /></label>
      <label>Brand<input type="text" value="${pasBrand(row)}" placeholder="Brand pending" data-om-field="pasBrand" data-om-id="${row.id}" /></label>
      <label>Spec<textarea rows="2" placeholder="Spec" data-om-field="pasSpec" data-om-id="${row.id}">${pasSpec(row)}</textarea></label>
      ${missing.length ? `<div class="pas-warning-line">Missing ${missing.join(" / ")}</div>` : `<div class="reason-text">Ready for PAS form item.</div>`}
    </div>`;
}

function omPasBundleHtml(row, { editableDemandNo = false, editableMaterialNo = false, editableItemInfo = false } = {}) {
  return `
    <div class="om-context-stack">
      <div class="om-context-block">
        <div class="om-context-title">PAS Context</div>
        ${pasHeaderContextHtml(row, { editableDemandNo, editableMaterialNo })}
      </div>
      <div class="om-context-block">
        <div class="om-context-title">PAS Item Info</div>
        ${pasItemInfoHtml(row, { editable: editableItemInfo })}
      </div>
    </div>`;
}

function pasDemandNoEntryHtml(row) {
  const demandNo = row.pasDemandNo || "";
  const disabled = canOperateOmRow(row) ? "" : "disabled";
  return `
    <div class="pas-demand-entry ${demandNo ? "ready" : "pending"}">
      <label class="pas-demand-entry-field">
        <span>PAS Demand No</span>
        <input class="pas-inline-input" type="text" value="${htmlAttr(demandNo)}" placeholder="Enter PAS Demand No" data-om-field="pasDemandNo" data-om-id="${row.id}" ${disabled} />
      </label>
      <div class="om-cell-helper">${omRowAccessReason(row) || (demandNo ? `Recorded ${compactDateTime(row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt)}` : "Required before Move to Quote.")}</div>
    </div>`;
}

function omQuoteValidityHtml(row, { readOnly = false } = {}) {
  const status = omQuoteValidity(row);
  const validUntil = omQuoteValidUntil(row);
  const days = validUntil ? daysUntil(validUntil) : null;
  const helper = status === "Quote Pending"
    ? "Quote Valid Until is required before sending to Requester."
    : status === "Quote Expired"
      ? "Expired. Requote is required before continuing."
      : status === "Quote Expiring Soon"
        ? `${days} day${days === 1 ? "" : "s"} remaining. Watch before export.`
        : "Validity is tracked for OM / MFG follow-up.";
  return `
    <div class="om-validity-card ${statusClass(status)}">
      <div class="om-quote-entry-title">Quote Validity</div>
      <div class="om-validity-grid">
        <label class="om-quote-entry-field">Valid Until
          ${readOnly ? `<div class="om-quote-readonly">${validUntil || "-"}</div>` : `<input type="date" value="${validUntil || ""}" data-om-field="quoteValidUntil" data-om-id="${row.id}" />`}
        </label>
      </div>
      <span class="status-pill ${statusClass(status)}">${status}</span>
      <div class="om-status-helper">${helper}</div>
    </div>`;
}

function omQuoteEntryHtml(row, { readOnly = false } = {}) {
  const validity = omQuoteValidity(row);
  const validUntil = omQuoteValidUntil(row);
  const quoteCurrency = omQuoteInputCurrency(row);
  const priceField = omQuotePriceFieldForCurrency(quoteCurrency);
  const priceValue = omQuotePriceInputValue(row, quoteCurrency);
  const screenshotFile = omQuoteScreenshotFile(row);
  return `
    <div class="om-quote-entry ${readOnly ? "readonly" : ""}">
      <div class="om-quote-entry-title">PAS Quote / Bidding Result</div>
      <div class="om-quote-entry-grid">
        <label class="om-quote-entry-field">PAS Material No
          ${readOnly ? `<div class="om-quote-readonly">${row.pasMaterialNo || "-"}</div>` : `<input type="text" value="${row.pasMaterialNo || ""}" placeholder="PAS Material No" data-om-field="pasMaterialNo" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field">Vendor Name
          ${readOnly ? `<div class="om-quote-readonly">${row.vendor || "-"}</div>` : `<input type="text" value="${row.vendor || ""}" placeholder="Vendor name" data-om-field="vendor" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field">Vendor Code
          ${readOnly ? `<div class="om-quote-readonly">${row.vendorPartNo || "-"}</div>` : `<input type="text" value="${row.vendorPartNo || ""}" placeholder="Vendor code" data-om-field="vendorPartNo" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field om-price-entry">Unit Price
          ${readOnly
            ? `<div class="om-quote-readonly">${omQuotePriceDisplay(row)}</div>`
            : `<div class="om-price-input-row">
                <input type="number" min="0" step="${quoteCurrency === "USD" ? "0.01" : "1"}" value="${priceValue}" placeholder="${quoteCurrency}" data-om-field="${priceField}" data-om-id="${row.id}" />
                <select class="mini-select" title="Unit price currency" data-om-price-currency="${row.id}">${omQuoteCurrencyOptions(quoteCurrency)}</select>
              </div>`}
        </label>
        <label class="om-quote-entry-field">Quote Date
          ${readOnly ? `<div class="om-quote-readonly">${row.quoteDate || "-"}</div>` : `<input type="date" value="${row.quoteDate || ""}" data-om-field="quoteDate" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field">Quote Valid Until
          ${readOnly ? `<div class="om-quote-readonly">${validUntil || "-"}</div>` : `<input type="date" value="${validUntil || ""}" data-om-field="quoteValidUntil" data-om-id="${row.id}" />`}
        </label>
      </div>
      <div class="om-quote-entry-footer">
        <span class="status-pill ${statusClass(validity)}">${validity}</span>
        ${readOnly ? "" : `<div class="quote-pdf-actions">
          <label class="mini upload ${screenshotFile ? "uploaded" : ""}">
            ${screenshotFile ? "Screenshot Uploaded" : "Upload Screenshot"}
            <input type="file" accept="image/*,.jpg,.jpeg,.png" data-om-screenshot="${row.id}" />
          </label>
          <label class="mini upload ${row.quotationExcel ? "uploaded" : ""}">
            ${row.quotationExcel ? "Excel Uploaded" : "Upload Excel"}
            <input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" data-om-excel="${row.id}" />
          </label>
        </div>`}
        ${quoteAttachmentListHtml(row)}
        ${readOnly ? `<div class="om-cell-helper">Quote package locked after send.</div>` : ""}
      </div>
    </div>`;
}

function omQuoteMissingFields(row) {
  const missing = [];
  if (!row.pasMaterialNo) missing.push("PAS Material No");
  if (!row.vendor) missing.push("Vendor");
  if (!effectiveUnitPrice(row)) missing.push("Unit Price");
  if (!row.quoteDate) missing.push("Quote Date");
  if (!omQuoteValidUntil(row)) missing.push("Valid Until");
  if (!omQuoteScreenshotFile(row)) missing.push("Screenshot");
  if (!row.quotationExcel) missing.push("Excel");
  return missing;
}

function omQuoteResultReadOnlyReason(row, waitingUserConfirm = false) {
  if (waitingUserConfirm) return "Quote package locked after send.";
  if (!canOperateOmRow(row)) return omRowAccessReason(row) || "Only the assigned OM member can edit.";
  return "";
}

function omQuoteResultInput(row, field, value, {
  type = "text",
  placeholder = "",
  readOnly = false,
  className = "om-quote-grid-input",
  step = "",
  min = "",
} = {}) {
  if (readOnly) return `<span class="om-quote-grid-readonly">${value || "-"}</span>`;
  return `<input class="${className}" type="${type}" value="${htmlAttr(value || "")}" placeholder="${htmlAttr(placeholder)}" data-om-field="${field}" data-om-id="${row.id}" ${step ? `step="${step}"` : ""} ${min ? `min="${min}"` : ""} />`;
}

function omQuoteResultItemCell(row, stageLabel) {
  const spec = itemDetail(row);
  return `
    <div class="cell-identity om-quote-item-cell">
      <div class="identity-primary" title="${htmlAttr(row.name || "")}">${row.name || "-"}</div>
      <div class="identity-secondary" title="${htmlAttr(spec || "")}">${spec || "No spec"}</div>
      <div class="om-quote-row-note">${stageLabel}</div>
    </div>`;
}

function omQuoteResultFileCell(row, readOnly) {
  const screenshotFile = omQuoteScreenshotFile(row);
  const excelFile = row.quotationExcel || "";
  if (readOnly) {
    return `
      <div class="om-quote-file-stack readonly">
        <span class="status-pill ${screenshotFile ? "success" : "warning"}" title="${htmlAttr(screenshotFile || "Quote screenshot required")}">Shot ${screenshotFile ? "OK" : "Missing"}</span>
        <span class="status-pill ${excelFile ? "success" : "warning"}" title="${htmlAttr(excelFile || "Quote Excel required")}">Excel ${excelFile ? "OK" : "Missing"}</span>
      </div>`;
  }
  return `
    <div class="om-quote-file-stack">
      <label class="mini upload ${screenshotFile ? "uploaded" : ""}" title="${htmlAttr(screenshotFile || "Upload quote screenshot")}">
        Shot
        <input type="file" accept="image/*,.jpg,.jpeg,.png" data-om-screenshot="${row.id}" />
      </label>
      <label class="mini upload ${excelFile ? "uploaded" : ""}" title="${htmlAttr(excelFile || "Upload quote Excel")}">
        Excel
        <input type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" data-om-excel="${row.id}" />
      </label>
    </div>`;
}

function omQuoteResultCompletionCell(row, status, readOnlyReason = "") {
  const missing = omQuoteMissingFields(row);
  const visibleMissing = missing.slice(0, 3);
  const hiddenMissingCount = Math.max(0, missing.length - visibleMissing.length);
  const ready = !missing.length;
  return `
    <div class="om-quote-completion-cell">
      <span class="status-pill ${statusClass(status)}">${status}</span>
      ${ready ? `<span class="om-quote-saved-note">${row.quoteCompletionReadyAt ? `Saved ${compactDateTime(row.quoteCompletionReadyAt)}` : "Ready to save"}</span>` : ""}
      ${missing.length ? `<div class="om-missing-chip-list" title="${htmlAttr(missing.join(", "))}">${visibleMissing.map((item) => `<span class="om-missing-chip">${item}</span>`).join("")}${hiddenMissingCount ? `<span class="om-missing-chip">+${hiddenMissingCount} more</span>` : ""}</div>` : ""}
      ${readOnlyReason ? `<div class="om-quote-row-note">${readOnlyReason}</div>` : ""}
    </div>`;
}

function omMissingPasInfoCount(row) {
  return [pasPartName(row), pasSpec(row), totalQty(row), row.project, currentPhaseLabelForProject(row.project)]
    .filter((value) => !value || value === "-").length;
}

function renderOmPasRequest() {
  const rows = omPasRequestRows();
  const rowCount = document.getElementById("omPasRequestCount");
  if (rowCount) rowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;

  const projectFilter = omDemandProjectFilterValue();
  const summary = document.getElementById("omPasRequestSummary");
  if (summary) {
    const waitingDemandNo = rows.filter((row) => !row.pasDemandNo).length;
    const demandNoReady = rows.filter((row) => row.pasDemandNo).length;
    const cards = [
      { label: "Total Items", value: rows.length, helper: `${projectFilter || "All projects"} · ${projectFilter ? currentPhaseLabelForProject(projectFilter) : "Multiple phases"}`, variant: "hero" },
      ["Waiting PAS Demand No", waitingDemandNo],
      ["PAS Demand No Ready", demandNoReady],
      ["Ready to Move", demandNoReady],
    ];
    summary.innerHTML = summaryCardsHtml(cards);
  }
  const pasHint = document.getElementById("omPasRequestHint");
  if (pasHint) {
    pasHint.textContent = "Enter PAS Demand No on the row, then move that row to Quote Completion.";
  }

  const target = document.getElementById("omPasRequestRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const enriched = applyOmResponsibility(row);
      return `
      <tr>
        <td>${row.project}</td>
        <td>${currentPhaseLabelForProject(row.project)}</td>
        <td>${omItemCell(row, { extraLines: omFinalSpecStatus(row) === OM_FINAL_SPEC_REQUIRED ? ["Final spec required"] : [] })}</td>
        <td>${totalQty(row)}</td>
        <td>${pasDemandNoEntryHtml(row)}</td>
        <td>${enriched.omOwner || "-"}${enriched.omOwner ? `<div class="reason-text">CPD-IEP owner</div>` : ""}</td>
        <td>${omAssignmentCell(row)}</td>
        <td>
          <span class="status-pill ${statusClass(omPasRequestStatus(row))}">${omPasRequestStatus(row)}</span>
          <div class="reason-text">${omRowAccessReason(row) || (row.pasDemandNo ? "Ready for quote result input" : "PAS Demand No is required.")}</div>
        </td>
        <td>
          <div class="row-action-stack">
            <button class="mini approve" type="button" title="${row.pasDemandNo ? "Move to PAS Quote Result" : "Enter PAS Demand No first"}" data-om-row-button="${row.id}" data-om-row-button-action="moveToQuoteCompletion" ${omActionDisabledAttr(row, !row.pasDemandNo)}>Move to Quote</button>
            <button class="mini danger" type="button" data-om-row-button="${row.id}" data-om-row-button-action="rejectToDri" ${omActionDisabledAttr(row)}>Reject to DRI</button>
          </div>
        </td>
        <td><button class="mini return" type="button" data-contact-dri="${row.id}">Contact DRI</button></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="11" class="empty-cell">No OM demand is waiting for PAS Demand No.</td></tr>`;
}

function updatePasField(requestId, field, value) {
  requests = requests.map((row) => row.id === requestId ? { ...row, [field]: field === "pasBudgetAmount" ? clampQty(value) : value } : row);
  renderOmPurchasing();
}

function applyPasDecision(requestId, decision) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (["approve", "budget"].includes(decision) && !row.pasProjectCode) {
    showToast("PAS project code is required before sending to OM Purchasing.", "error");
    return;
  }
  const nextStatus = decision === "budget" ? PAS_BUDGET_ISSUED : PAS_APPROVED;
  requests = requests.map((item) => {
    if (item.id !== requestId) return item;
    const scopeStatus = omBuyScopeStatus(item);
    return {
      ...item,
      pasStatus: nextStatus,
      pasReviewDate: item.pasReviewDate || todayDateString(),
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      omCollectionStatus: scopeStatus === OM_SCOPE_STANDARD ? OM_COLLECTION_QUOTATION : OM_COLLECTION_COLLECTING,
      finalSpecStatus: scopeStatus === OM_SCOPE_NEED_SPEC ? OM_FINAL_SPEC_REQUIRED : OM_FINAL_SPEC_READY,
      sentToOmAt: new Date().toISOString(),
      externalReviewStatus: "",
      externalRejectReason: "",
    };
  });
  const updated = requests.find((item) => item.id === requestId);
  const action = nextStatus === PAS_BUDGET_ISSUED ? "PAS Budget Code Issued - Send to OM" : "PAS Approved - Send to OM";
  addHandoffHistory(updated, action, updated.pasProjectCode || "");
  addOmHistory(updated, action, `PAS project code: ${updated.pasProjectCode}`);
  renderProcurement();
  renderDepartment();
  renderOmPurchasing();
  showToast(action, "success");
}

function readyForCoordinatorOutput(row) {
  return true;
}

function suggestedDeptCode(row) {
  const buyer = effectiveRfqBuyer(row);
  const text = normalize([row.name, itemDetail(row), row.level2, row.process, row.station].join(" "));
  if (buyer === "IT" || text.includes("it") || row.level2 === "IT硬體與設備" || row.level2 === "IT線材與耗材") return "IT";
  if (text.includes("rf")) return "RF";
  if (text.includes("qa") || text.includes("iqc")) return "QA";
  if (text.includes("smt")) return "SM";
  if (text.includes("fae") || text.includes("ie") || text.includes("repair")) return "E1";
  if (text.includes("mae")) return "E2";
  if (text.includes("packing") || text.includes("pack")) return "E3";
  if (text.includes("warehouse") || text.includes("wh")) return "WH";
  if (text.includes("security")) return "SE";
  if (text.includes("production")) return "PR";
  if (text.includes("facility")) return "FA";
  return "AB";
}

function withRefreshedIdentity(row) {
  return {
    ...row,
    globalItemKey: globalItemKey(row),
    globalItemId: globalItemIdFor(row),
  };
}

function addHandoffHistory(row, action, note = "") {
  const actor = roleProfiles[currentRole]?.name || "System";
  handoffHistory = [{
    id: `HH-${String(handoffHistorySequence++).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    action,
    route: handoffRoute(row),
    exportTarget: handoffTarget(row),
    actor,
    note,
    timestamp: new Date().toISOString(),
  }, ...handoffHistory];
}

function renderHandoffHistory() {
  const rows = handoffHistory;
  document.getElementById("handoffHistoryRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.requestId}</td>
        <td>${row.project}</td>
        <td>${row.item}</td>
        <td>${row.action}</td>
        <td>${row.route}</td>
        <td>${row.exportTarget}</td>
        <td>${row.actor}</td>
        <td>${row.note || "-"}</td>
        <td>${new Date(row.timestamp).toLocaleString("en-US")}</td>
      </tr>`).join("")
    : `<tr><td colspan="9" class="empty-cell">No handoff actions recorded yet.</td></tr>`;
}

function renderHandoffSummary(rows) {
  const allReadyRows = requests.filter((row) => row.status === "Approved" && [HANDOFF_READY, HANDOFF_SENT_TO_OM].includes(row.procurementStatus));
  const coordinatorRows = allReadyRows.filter((row) => row.procurementStatus === HANDOFF_READY);
  const cards = [
    ["Package Rows", coordinatorRows.length],
    ["Selected", coordinatorRows.filter((row) => row.handoffSelected || row.rfqSelected).length],
    ["Material Ready", coordinatorRows.filter((row) => materialNoFor(row)).length],
    ["Ready to Export", coordinatorRows.filter(readyForCoordinatorOutput).length],
    ["Missing Evidence", coordinatorRows.filter((row) => externalEvidenceCount(row) === 0).length],
  ];
  document.getElementById("handoffSummary").innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}

function renderMfgCollectionStatus() {
  const summaryTarget = document.getElementById("mfgCollectionSummary");
  const rowsTarget = document.getElementById("mfgCollectionRows");
  if (!summaryTarget || !rowsTarget) return;
  const projectFilter = document.getElementById("handoffProjectFilter")?.value || "";
  const rows = MFG_PACKAGE_ROWS.filter((row) => !projectFilter || row.project === projectFilter);
  const summary = rows.reduce((accumulator, row) => {
    const status = mfgCollectionStatusMeta(row);
    accumulator[status.summaryKey] += 1;
    accumulator.received += row.completed;
    accumulator.missing += Math.max(0, row.required - row.completed);
    return accumulator;
  }, { pending: 0, collecting: 0, completed: 0, received: 0, missing: 0 });
  const packageCount = document.getElementById("mfgPackageCount");
  if (packageCount) packageCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  summaryTarget.innerHTML = `
    <article class="summary-card summary-card-hero">
      <span>Collection Status</span>
      <strong>${rows.length ? `${summary.completed} completed / ${summary.collecting} collecting / ${summary.pending} pending` : "No packages in scope"}</strong>
    </article>
    <article class="summary-card">
      <span>Packages</span>
      <strong>${rows.length}</strong>
    </article>
    <article class="summary-card">
      <span>Received Inputs</span>
      <strong>${summary.received}</strong>
    </article>
    <article class="summary-card">
      <span>Not Submitted</span>
      <strong>${summary.missing}</strong>
    </article>
  `;
  rowsTarget.innerHTML = rows.length ? rows.map((row) => {
    const collectionStatus = mfgCollectionStatusMeta(row);
    const missing = Math.max(0, row.required - row.completed);
    return `
      <tr>
        <td>${row.project}</td>
        <td>${row.phase}</td>
        <td>${row.packageType}<div class="reason-text">${row.excelSheet} format</div></td>
        <td>
          <div class="collection-progress">
            <strong>${row.completed} / ${row.required}</strong>
            <span>${collectionStatus.progressNote}</span>
          </div>
        </td>
        <td>${missing}</td>
        <td><span class="status-pill ${statusClass(collectionStatus.label)}">${collectionStatus.label}</span></td>
        <td><button class="mini" data-mfg-package-detail="${row.id}">Detail</button></td>
      </tr>`;
  }).join("") : `<tr><td colspan="7" class="empty-cell">No MFG collection packages match this project.</td></tr>`;
}

function mfgCollectionStatusMeta(row) {
  const missing = Math.max(0, row.required - row.completed);
  if (missing <= 0) {
    return {
      label: "Completed",
      summaryKey: "completed",
      progressNote: "collection complete",
    };
  }
  if (row.completed > 0) {
    return {
      label: "In Progress",
      summaryKey: "collecting",
      progressNote: "still collecting",
    };
  }
  return {
    label: "Pending",
    summaryKey: "pending",
    progressNote: "waiting for input",
  };
}

function mfgPackageType(row) {
  const text = normalize([row.name, itemDetail(row), row.level2, row.level3].join(" "));
  if (text.includes("consum") || text.includes("耗材") || text.includes("wiper") || text.includes("glove") || text.includes("mask") || text.includes("label") || text.includes("tape")) return "Consumable";
  if (text.includes("office") || text.includes("vpp") || text.includes("stationery") || text.includes("辦公")) return "VPP / Office";
  if (text.includes("fixture") || text.includes("jig") || text.includes("治具")) return "Tool / Fixture";
  return "EQ";
}

function renderProcurement() {
  syncProjectControls();
  applySuggestedBuyers();
  const rows = procurementRows();
  renderMfgCollectionStatus();
  renderHandoffHistory();
  renderRfqDispatch();
  renderRfqFollowUp();
  renderDispatchHistory();
  const handoffSummaryTarget = document.getElementById("handoffSummary");
  if (handoffSummaryTarget) renderHandoffSummary(rows);
  const procurementTarget = document.getElementById("procurementRows");
  if (procurementTarget) {
    procurementTarget.innerHTML = rows.length
      ? rows.map((row) => `
        <tr>
          <td><input type="checkbox" data-handoff-select="${row.id}" ${row.handoffSelected ? "checked" : ""} ${row.procurementStatus === HANDOFF_SENT_TO_OM || !readyForCoordinatorOutput(row) ? "disabled" : ""} /></td>
          <td>${row.project}</td>
          <td>${currentPhaseLabelForProject(row.project)}</td>
          <td>${mfgPackageType(row)}</td>
          <td>${itemKeyDisplay(row)}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div>${isNewMaterial(row) ? `<div>${itemTypeBadge(row)}</div>` : ""}</td>
          <td><div class="clamped-cell">${itemDetail(row)}</div></td>
          <td><span class="rfq-picture-token">${rfqPictureSource(row)}</span></td>
          <td>${totalQty(row)}</td>
          <td><div class="clamped-cell">${row.requesterReason || row.procurementRemark || "Approved demand is ready for MFG collection review."}</div></td>
          <td>${itemType(row)}</td>
          <td><span class="status-pill ${statusClass(exportStatus(row))}">${handoffDisplayStatus(row)}</span></td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`).join("")
      : `<tr><td colspan="13" class="empty-cell">No approved MFG package rows match the selected project.</td></tr>`;
  }
}

function todayDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addBusinessDays(startDate, days) {
  const date = new Date(`${startDate}T00:00:00`);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return todayDateString(date);
}

function daysBetween(startDate, endDate = new Date()) {
  if (!startDate) return "";
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (Number.isNaN(start.getTime())) return "";
  return Math.max(0, Math.floor((end - start) / 86400000));
}

function rfqRows() {
  return requests.filter((row) => row.status === "Approved" && row.procurementStatus === HANDOFF_READY);
}

function applySuggestedBuyers() {
  let changed = false;
  requests = requests.map((row) => {
    if (row.status !== "Approved" || row.rfqBuyer) return row;
    const buyer = suggestedBuyer(row);
    if (!buyer) return row;
    changed = true;
    return { ...row, rfqBuyer: buyer, rfqBuyerSuggested: true };
  });
  return changed;
}

function selectedRfqRows() {
  return rfqRows().filter((row) => row.rfqSelected);
}

function buyerEmail(owner) {
  return RFQ_BUYERS.find((buyer) => buyer.name === owner)?.email || "";
}

function suggestedBuyer(row) {
  const text = normalize([row.name, itemDetail(row), row.level1, row.level2, row.level3, row.process, row.station].join(" "));
  const match = BUYER_RULES.find((rule) => {
    const level1Match = rule.level1?.some((value) => value === row.level1);
    const level2Match = rule.level2?.some((value) => value === row.level2);
    const keywordMatch = rule.keywords.some((keyword) => text.includes(normalize(keyword)));
    return level1Match || level2Match || keywordMatch;
  });
  return match?.buyer || "EQ Sourcing";
}

function effectiveRfqBuyer(row) {
  return row.rfqBuyer || suggestedBuyer(row);
}

function rfqBuyerOptions(selected = "") {
  return [
    `<option value="">Unassigned</option>`,
    ...RFQ_BUYERS.map((buyer) => `<option value="${buyer.name}" ${selected === buyer.name ? "selected" : ""}>${buyer.name}</option>`),
  ].join("");
}

function rfqReplyStatus(row) {
  return rfqStatus(row);
}

function rfqReplyComplete(row) {
  return Boolean(row.rfqQuoteResult) || ["Quote Received", "Closed"].includes(row.rfqStatus);
}

function rfqStatusOptions(selected = "") {
  return ["Draft", "Dispatched", "Waiting Quote", "Quote Received", "Need Clarification", "Overdue", "Closed"]
    .map((status) => `<option value="${status}" ${selected === status ? "selected" : ""}>${status}</option>`)
    .join("");
}

function rfqPictureSource(row) {
  return row.itemMasterImage ? "Item master image" : row.userUploadImage ? "User upload image" : isNewMaterial(row) ? "User upload image" : "Item master image";
}

function rfqRequiredReplyDate(row) {
  if (row.rfqRequiredReplyDate) return row.rfqRequiredReplyDate;
  if (row.rfqDispatchDate) return addBusinessDays(row.rfqDispatchDate, RFQ_REPLY_BUSINESS_DAYS);
  return "";
}

function rfqStatus(row) {
  if (row.rfqStatus === "Closed") return "Closed";
  if (row.rfqStatus === "Need Clarification") return "Need Clarification";
  if (row.rfqQuoteResult) return "Quote Received";
  if (!row.rfqDispatchDate) return "Draft";
  const requiredDate = rfqRequiredReplyDate(row);
  const overdueStart = requiredDate ? daysBetween(requiredDate) : 0;
  if (overdueStart > RFQ_OVERDUE_GRACE_DAYS) return "Overdue";
  return row.rfqStatus || "Waiting Quote";
}

function addDispatchHistory(row, action, note = "") {
  const actor = roleProfiles[currentRole]?.name || "System";
  dispatchHistory = [{
    id: `DH-${String(dispatchHistorySequence++).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    buyer: effectiveRfqBuyer(row) || "Unassigned",
    action,
    actor,
    note,
    timestamp: new Date().toISOString(),
  }, ...dispatchHistory];
}

function renderRfqSummary(rows = rfqRows()) {
  const cards = [
    ["Collection Export Rows", rows.length],
    ["Selected", rows.filter((row) => row.rfqSelected).length],
    ["Ready to Export", rows.filter(readyForCoordinatorOutput).length],
    ["With Picture", rows.filter((row) => rfqPictureSource(row)).length],
    ["Missing Evidence", rows.filter((row) => externalEvidenceCount(row) === 0).length],
  ];
  const target = document.getElementById("rfqSummary");
  if (!target) return;
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}

function renderRfqBuyerGroups(rows) {
  const target = document.getElementById("rfqBuyerGroups");
  if (!target) return;
  const groups = groupedRfqRowsByBuyer(rows);
  target.innerHTML = Object.keys(groups).length
    ? Object.entries(groups).map(([buyer, buyerRows]) => {
      const readyRows = buyerRows.filter(readyForCoordinatorOutput);
      const blockedRows = buyerRows.length - readyRows.length;
      const selectedRows = buyerRows.filter((row) => row.rfqSelected).length;
      const nextRequiredDate = buyerRows.map(rfqRequiredReplyDate).filter(Boolean).sort()[0] || addBusinessDays(todayDateString(), RFQ_REPLY_BUSINESS_DAYS);
      return `
        <article class="rfq-buyer-card">
          <div>
            <span class="toolbar-label">${buyer}</span>
            <strong>${buyerRows.length} item${buyerRows.length === 1 ? "" : "s"}</strong>
            <p>${readyRows.length} ready / ${blockedRows} blocked · ${selectedRows} selected</p>
            <p>Required reply: ${nextRequiredDate}</p>
          </div>
          <div class="rfq-card-actions">
            <button class="mini ghost" data-rfq-group-action="select" data-rfq-group-buyer="${buyer}">Select Group</button>
            <button class="mini ghost" data-rfq-group-action="export" data-rfq-group-buyer="${buyer}">Export Package</button>
            <button class="mini return" data-rfq-group-action="email" data-rfq-group-buyer="${buyer}">Email Draft</button>
            <button class="mini approve" data-rfq-group-action="dispatch" data-rfq-group-buyer="${buyer}">Mark Dispatched</button>
          </div>
        </article>`;
    }).join("")
    : `<div class="empty-state compact-empty">No RFQ sourcing groups yet.</div>`;
}

function renderRfqDispatch() {
  applySuggestedBuyers();
  const rows = rfqRows();
  renderRfqSummary(rows);
  renderRfqBuyerGroups(rows);
  const count = document.getElementById("mfgEcsCount");
  const selectedCount = document.getElementById("mfgEcsSelectedCount");
  if (count) count.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  if (selectedCount) selectedCount.textContent = `${rows.filter((row) => row.rfqSelected).length} selected`;
  const target = document.getElementById("rfqDispatchRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          <td><input type="checkbox" data-rfq-select="${row.id}" ${row.rfqSelected ? "checked" : ""} /></td>
          <td>${row.project}</td>
          <td>${row.project}</td>
          <td>${itemKeyDisplay(row)}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
          <td><div class="clamped-cell">${itemDetail(row) || "\\"}</div></td>
          <td><span class="rfq-picture-token">${rfqPictureSource(row)}</span></td>
          <td>${totalQty(row)}</td>
          <td>${roleProfiles.requester.dept}</td>
          <td><div class="clamped-cell">${row.requesterReason || row.procurementRemark || "Approved demand is ready for sourcing coordination."}</div></td>
          <td>${OM_PAYMENT_METHOD}</td>
          <td>${itemType(row)}</td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`).join("")
    : `<tr><td colspan="13" class="empty-cell">No approved MFG demand is available for sourcing coordination.</td></tr>`;
}

function renderRfqFollowUpSummary(rows = rfqRows()) {
  const cards = [
    ["Progress Rows", rows.length],
    ["Submitted", rows.filter((row) => externalStatusFor(row) === EXT_SUBMITTED).length],
    ["Rejected to DRI", rows.filter((row) => externalStatusFor(row) === EXT_REJECTED_DRI).length],
    ["PR Created", rows.filter((row) => externalStatusFor(row) === EXT_PR_CREATED).length],
    ["Missing Evidence", rows.filter((row) => externalEvidenceCount(row) === 0).length],
  ];
  const target = document.getElementById("rfqFollowUpSummary");
  if (!target) return;
  target.innerHTML = summaryCardsHtml(cards);
}

function renderRfqFollowUp() {
  const rows = rfqRows();
  renderRfqFollowUpSummary(rows);
  const count = document.getElementById("mfgProgressCount");
  const selectedCount = document.getElementById("mfgProgressSelectedCount");
  if (count) count.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  if (selectedCount) selectedCount.textContent = `${rows.filter((row) => row.rfqSelected).length} selected`;
  const target = document.getElementById("rfqFollowUpRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const latest = latestExternalProgressEvent(row);
      return `
        <tr>
          <td><input type="checkbox" data-rfq-select="${row.id}" ${row.rfqSelected ? "checked" : ""} /></td>
          <td>${row.id}</td>
          <td>${row.project}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
          <td><span class="status-pill ${statusClass(externalStatusFor(row))}">${externalStatusFor(row)}</span></td>
          <td>${externalEvidenceLabel(row)}</td>
          <td>${row.externalRequestNo || "-"}</td>
          <td>${row.prNo || "-"}</td>
          <td>${row.buyerPoNo || row.poNo || "-"}</td>
          <td>${latest ? new Date(latest.createdAt).toLocaleString("en-US") : "-"}</td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="11" class="empty-cell">No MFG package progress rows are available.</td></tr>`;
}

function renderDispatchHistory() {
  const target = document.getElementById("dispatchHistoryRows");
  if (!target) return;
  target.innerHTML = dispatchHistory.length
    ? dispatchHistory.map((row) => `
      <tr>
        <td>${row.requestId}</td>
        <td>${row.project}</td>
        <td>${row.item}</td>
        <td>${row.buyer}</td>
        <td>${row.action}</td>
        <td>${row.actor}</td>
        <td>${row.note || "-"}</td>
        <td>${new Date(row.timestamp).toLocaleString("en-US")}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-cell">No RFQ dispatch actions recorded yet.</td></tr>`;
}

function syncSourcingOwnerFilter() {
  const select = document.getElementById("sourcingOwnerFilter");
  if (!select) return;
  const previous = select.value;
  select.innerHTML = [
    `<option value="">All sourcing owners</option>`,
    ...RFQ_BUYERS.map((owner) => `<option value="${owner.name}">${owner.name}</option>`),
  ].join("");
  select.value = previous && RFQ_BUYERS.some((owner) => owner.name === previous) ? previous : "";
}

function sourcingRows() {
  const ownerFilter = document.getElementById("sourcingOwnerFilter")?.value || "";
  const statusFilter = document.getElementById("sourcingStatusFilter")?.value || "";
  return rfqRows().filter((row) => {
    const owner = effectiveRfqBuyer(row);
    const status = rfqStatus(row);
    return (!ownerFilter || owner === ownerFilter) && (!statusFilter || status === statusFilter);
  });
}

function renderSourcing() {
  syncProjectControls();
  syncSourcingOwnerFilter();
  applySuggestedBuyers();
  const rows = sourcingRows();
  const cards = [
    ["Assigned RFQ", rows.length],
    ["Waiting Quote", rows.filter((row) => rfqStatus(row) === "Waiting Quote").length],
    ["Overdue", rows.filter((row) => rfqStatus(row) === "Overdue").length],
    ["Quote Received", rows.filter((row) => rfqStatus(row) === "Quote Received").length],
    ["Need Clarification", rows.filter((row) => rfqStatus(row) === "Need Clarification").length],
  ];
  const summary = document.getElementById("sourcingSummary");
  if (summary) summary.innerHTML = summaryCardsHtml(cards);
  const target = document.getElementById("sourcingRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
        <td><span class="status-pill ${statusClass(effectiveRfqBuyer(row))}">${effectiveRfqBuyer(row)}</span></td>
        <td>${itemKeyDisplay(row)}</td>
        <td><span class="status-pill ${statusClass(materialDbStatus(row))}">${materialDbStatus(row)}</span></td>
        <td>${row.rfqDispatchDate || "-"}</td>
        <td>${rfqRequiredReplyDate(row) || "-"}</td>
        <td>${row.rfqDispatchDate ? daysBetween(row.rfqDispatchDate) : "-"}</td>
        <td>
          <span class="status-pill ${statusClass(rfqStatus(row))}">${rfqStatus(row)}</span>
          <select class="compact-select" data-sourcing-field="rfqStatus" data-sourcing-id="${row.id}">${rfqStatusOptions(rfqStatus(row))}</select>
        </td>
        <td><input type="text" value="${row.vendor || ""}" placeholder="Vendor name" data-sourcing-field="vendor" data-sourcing-id="${row.id}" /></td>
        <td><input type="text" value="${row.vendorPartNo || ""}" placeholder="Vendor code" data-sourcing-field="vendorPartNo" data-sourcing-id="${row.id}" /></td>
        <td><input type="number" min="0" step="0.01" value="${sourcingInitialPrice(row) || ""}" placeholder="Initial price" data-sourcing-field="initialPrice" data-sourcing-id="${row.id}" /></td>
        <td><input type="number" min="0" step="0.01" value="${sourcingNegotiatedPrice(row) || ""}" placeholder="Negotiated price" data-sourcing-field="updatedPrice" data-sourcing-id="${row.id}" /></td>
        <td>${sourcingPriceReduction(row)}</td>
        <td>${sourcingFinalAmount(row) ? money(sourcingFinalAmount(row)) : "-"}</td>
        <td>
          <label class="mini upload ${row.quotationPdf ? "uploaded" : ""}">
            ${row.quotationPdf ? "Screenshot Uploaded" : "Upload Screenshot"}
            <input type="file" accept="image/*,.jpg,.jpeg,.png" data-sourcing-pdf="${row.id}" />
          </label>
          <div class="reason-text ${row.quotationPdf ? "quote-file-ready" : ""}">${row.quotationPdf || "No screenshot"}</div>
        </td>
        <td><input type="text" value="${row.rfqQuoteResult || ""}" placeholder="Quote result / sourcing note" data-sourcing-field="rfqQuoteResult" data-sourcing-id="${row.id}" /></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="18" class="empty-cell">No RFQ rows are assigned to Sourcing yet.</td></tr>`;
}

function updateSourcingField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  if (!before) return;
  const normalizedValue = ["updatedPrice", "initialPrice"].includes(field) ? clampQty(value) : value;
  if (before[field] === normalizedValue) return;
  requests = requests.map((row) => {
    if (row.id !== requestId) return row;
    const next = { ...row, [field]: normalizedValue };
    if (field === "rfqQuoteResult" && String(value || "").trim()) next.rfqStatus = "Quote Received";
    if (["vendor", "vendorPartNo", "updatedPrice", "initialPrice"].includes(field) && !next.rfqStatus) next.rfqStatus = "Quote Received";
    return next;
  });
  let after = requests.find((row) => row.id === requestId);
  if (after && hasSourcingQuoteSuccess(after) && !isMaterialNoPending(after)) {
    const materialPatch = ensureMaterialMasterFromQuote(after);
    requests = requests.map((row) => row.id === requestId ? { ...row, ...materialPatch } : row);
    after = requests.find((row) => row.id === requestId);
    addDispatchHistory(after, "Vendor mapping updated", `${after.materialNo} vendor quote data saved after sourcing quote success.`);
  }
  addDispatchHistory(after, field === "rfqQuoteResult" ? "Sourcing quote result updated" : "Sourcing quote data updated", `${field} updated to ${value || "blank"}.`);
  renderSourcing();
  renderRfqDispatch();
  renderRfqFollowUp();
  renderManagerCostView();
}

function buyerSourceOwner(row) {
  if (isOmBuyScope(row) || row.procurementStatus === HANDOFF_SENT_TO_OM) return "OM Purchasing";
  if (row.rfqBuyer || row.rfqQuoteResult) return "Sourcing";
  return "Coordinator";
}

function buyerRows() {
  const projectFilter = document.getElementById("buyerProjectFilter")?.value || "";
  const statusFilter = document.getElementById("buyerStatusFilter")?.value || "";
  return requests.filter((row) => {
    const visible = [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus);
    return visible && (!projectFilter || row.project === projectFilter) && (!statusFilter || buyerStatusFor(row) === statusFilter);
  });
}

function buyerStatusFor(row) {
  if (row.buyerStatus) return row.buyerStatus;
  if ([OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus)) return BUYER_RECEIVED;
  return "-";
}

function buyerPackageHelper(row) {
  if (row.finalExportedAt) {
    return `Received from OM export on ${new Date(row.finalExportedAt).toLocaleDateString("en-US")}`;
  }
  return "Waiting OM export date";
}

function buyerStatusHelper(row) {
  const status = buyerStatusFor(row);
  if (status === BUYER_RECEIVED) return "Buyer can now create PR / PO and track buyer-side progress.";
  if (status === BUYER_PR_CREATED) return row.prNo ? `PR ${row.prNo} has been created.` : "PR has been created and is waiting for PO.";
  if (status === BUYER_PO_ISSUED) return (row.buyerPoNo || row.poNo) ? `PO ${row.buyerPoNo || row.poNo} has been issued.` : "PO has been issued and is waiting for closure.";
  if (status === BUYER_COMPLETED) return "Buyer package is complete.";
  if (status === BUYER_BLOCKED) return row.buyerBlockedReason || row.buyerNote || "Buyer follow-up is blocked and needs attention.";
  return "Waiting buyer update.";
}

function buyerExternalStatusHelper(row) {
  const status = externalStatusFor(row);
  if (status === EXT_PR_CREATED) return row.prNo ? `PR ${row.prNo}` : "PR created";
  if (status === EXT_PO_ISSUED) return row.buyerPoNo || row.poNo ? `PO ${row.buyerPoNo || row.poNo}` : "PO issued";
  if (status === EXT_COMPLETED) return externalEvidenceCount(row) ? `${externalEvidenceCount(row)} evidence file${externalEvidenceCount(row) === 1 ? "" : "s"} attached` : "Completed without evidence";
  if (status === EXT_BLOCKED) return row.buyerBlockedReason || row.buyerNote || "Blocked in buyer handoff";
  if (status === EXT_ACCEPTED) return row.externalSystem ? `${row.externalSystem} accepted package` : "External package accepted";
  if (status === EXT_SUBMITTED) return row.externalRequestNo ? `Ref ${row.externalRequestNo}` : "Submitted to external system";
  return "No buyer handoff update yet";
}

function renderBuyer() {
  syncProjectControls();
  const rows = buyerRows();
  const cards = [
    { label: "Buyer Received", value: rows.filter((row) => buyerStatusFor(row) === BUYER_RECEIVED).length, helper: `${document.getElementById("buyerProjectFilter")?.value || "All projects"} · OM export package`, variant: "hero" },
    { label: "Blocked", value: rows.filter((row) => buyerStatusFor(row) === BUYER_BLOCKED).length, helper: "Rows that need buyer follow-up or unblock" },
    { label: "PR Created", value: rows.filter((row) => externalStatusFor(row) === EXT_PR_CREATED).length, helper: "Progress already moved into PR stage" },
    { label: "PO Issued", value: rows.filter((row) => buyerStatusFor(row) === BUYER_PO_ISSUED).length, helper: "PO has been issued to vendor" },
    { label: "Completed", value: rows.filter((row) => buyerStatusFor(row) === BUYER_COMPLETED).length, helper: "Buyer-side package is fully closed" },
    { label: "Missing Evidence", value: rows.filter((row) => externalEvidenceCount(row) === 0).length, helper: "Rows still missing buyer proof or attachment" },
  ];
  const summary = document.getElementById("buyerSummary");
  if (summary) summary.innerHTML = summaryCardsHtml(cards);
  const target = document.getElementById("buyerRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const buyerItemTitle = [row.name, partName(row), row.id, itemDetail(row), row.finalExportTarget ? `${row.finalExportTarget} package from OM` : "OM export package"]
        .filter(Boolean)
        .join(" / ");
      const buyerPackageTitle = [row.finalExportTarget || "-", buyerPackageHelper(row)].filter(Boolean).join(" / ");
      const buyerStatusTitle = [buyerStatusFor(row), buyerStatusHelper(row)].filter(Boolean).join(" / ");
      const buyerProgressTitle = [externalStatusFor(row), buyerExternalStatusHelper(row)].filter(Boolean).join(" / ");
      return `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td class="cell-identity buyer-item-cell" title="${htmlAttr(buyerItemTitle)}">${omItemCell(row, { stageLabel: "Buyer package", extraLines: [row.finalExportTarget ? `${row.finalExportTarget} package from OM` : "OM export package"] })}</td>
        <td>
          <strong>${row.pasMaterialNo || "Waiting PAS Material No"}</strong>
          <input type="text" value="${factoryMaterialNoFor(row)}" placeholder="Factory Material No after PO" data-buyer-field="factoryMaterialNo" data-buyer-id="${row.id}" />
        </td>
        <td class="buyer-package-cell" title="${htmlAttr(buyerPackageTitle)}"><span class="status-pill ${statusClass(row.finalExportTarget || "-")}">${row.finalExportTarget || "-"}</span><div class="reason-text">${buyerPackageHelper(row)}</div></td>
        <td class="buyer-status-cell" title="${htmlAttr(buyerStatusTitle)}"><span class="status-pill ${statusClass(buyerStatusFor(row))}">${buyerStatusFor(row)}</span><div class="reason-text">${buyerStatusHelper(row)}</div></td>
        <td><input type="text" value="${row.externalSystem || ""}" placeholder="External system" data-buyer-field="externalSystem" data-buyer-id="${row.id}" /></td>
        <td><input type="text" value="${row.externalRequestNo || ""}" placeholder="External request no." data-buyer-field="externalRequestNo" data-buyer-id="${row.id}" /></td>
        <td><input type="text" value="${row.prNo || ""}" placeholder="PR No." data-buyer-field="prNo" data-buyer-id="${row.id}" /></td>
        <td><input type="text" value="${row.buyerPoNo || row.poNo || ""}" placeholder="PO No." data-buyer-field="buyerPoNo" data-buyer-id="${row.id}" /></td>
        <td class="buyer-progress-cell" title="${htmlAttr(buyerProgressTitle)}"><span class="status-pill ${statusClass(externalStatusFor(row))}">${externalStatusFor(row)}</span><div class="reason-text">${buyerExternalStatusHelper(row)}</div></td>
        <td>${externalEvidenceLabel(row)}</td>
        <td><input type="text" value="${row.buyerNote || ""}" placeholder="Buyer note" data-buyer-field="buyerNote" data-buyer-id="${row.id}" /></td>
        <td>${row.buyerReceivedAt ? new Date(row.buyerReceivedAt).toLocaleString("en-US") : row.finalExportedAt ? new Date(row.finalExportedAt).toLocaleString("en-US") : "-"}</td>
        <td>${latestExternalProgressEvent(row) ? new Date(latestExternalProgressEvent(row).createdAt).toLocaleString("en-US") : row.buyerReceivedAt ? new Date(row.buyerReceivedAt).toLocaleString("en-US") : "-"}</td>
        <td><button class="mini approve" data-buyer-progress="${row.id}">Record Progress</button></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="17" class="empty-cell">No OM export package has been handed to Buyer yet.</td></tr>`;
}

function updateBuyerField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  if (!before || before[field] === value) return;
  if (field === "buyerStatus") {
    showToast("Use Record Progress so PR / PO status is saved with evidence.", "error");
    renderBuyer();
    return;
  }
  requests = requests.map((row) => row.id === requestId ? { ...row, [field]: value, buyerReceivedAt: row.buyerReceivedAt || new Date().toISOString() } : row);
  const after = requests.find((row) => row.id === requestId);
  addHandoffHistory(after, `Buyer updated ${field}`, value || "blank");
  renderBuyer();
  renderDepartment();
  renderManagerDashboard();
}

function updateRfqField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  const targetField = field === "updatedPriceVnd" ? "updatedPrice" : field;
  const normalizedValue = field === "updatedPriceVnd" ? clampQty(value) / currentUsdToVndRate() : field === "updatedPrice" ? clampQty(value) : value;
  if (!before || before[targetField] === normalizedValue) return;
  requests = requests.map((row) => {
    if (row.id !== requestId) return row;
    const next = { ...row, [targetField]: normalizedValue };
    if (field === "updatedPriceVnd") {
      next.updatedPriceUsd = normalizedValue;
      next.updatedPriceVnd = clampQty(value);
    } else if (targetField === "updatedPrice") {
      next.updatedPriceUsd = normalizedValue;
      next.updatedPriceVnd = Math.round(amountVndFromUsd(normalizedValue));
    }
    if (field === "rfqBuyer") {
      next.rfqBuyerSuggested = false;
      if (value) next.rfqStatus = next.rfqDispatchDate ? "Waiting Quote" : "Draft";
    }
    if (field === "rfqQuoteResult" && value.trim()) next.rfqStatus = "Quote Received";
    return next;
  });
  const after = requests.find((row) => row.id === requestId);
  if (field === "rfqBuyer") addDispatchHistory(after, "Assigned buyer", value || "Buyer cleared.");
  if (field === "rfqRequiredReplyDate") addDispatchHistory(after, "Updated required reply date", value || "Required reply date cleared.");
  if (field === "rfqQuoteResult") addDispatchHistory(after, "Sourcing reply updated", value || "Reply note cleared.");
  if (field === "rfqStatus") addDispatchHistory(after, value === "Need Clarification" ? "Need clarification" : `RFQ status updated: ${value}`, value);
  renderRfqDispatch();
  renderRfqFollowUp();
  renderDispatchHistory();
  renderHandoffHistory();
  renderSourcing();
  renderOmPurchasing();
}

function groupedRfqRowsByBuyer(rows) {
  return rows.reduce((groups, row) => {
    const buyer = effectiveRfqBuyer(row) || "";
    if (!buyer) return groups;
    groups[buyer] ??= [];
    groups[buyer].push(row);
    return groups;
  }, {});
}

function rfqFileName(project, buyer) {
  const date = todayDateString().replace(/-/g, "");
  return `${project}-${buyer}-RFQ-Request-${date}.xlsx`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function mfgEcsFileName(project) {
  const date = todayDateString().replace(/-/g, "");
  return `${project}-MFG-Collection-${date}.xlsx`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function rfqExcelRows(rows) {
  const header = ["No.", "Model", "Material No.", "English name", "Vietnamese Name", "Spec", "Picture", "Unit", "Usage Qty", "Used by", "Using Purpose", "Budget", "Classify by type", "Coordinator / IE Remark", "No. of quotation"];
  return [
    ["XX需求申請單 / XX Demands application sheet", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    header,
    ...rows.map((row, index) => [
      index + 1,
      row.project,
      itemKeyDisplay(row),
      row.name,
      row.vnName || "",
      itemDetail(row) || "\\",
      rfqPictureSource(row),
      omUnit(row),
      totalQty(row),
      roleProfiles.requester.dept,
      row.requesterReason || row.procurementRemark || "Approved demand for RFQ.",
      OM_PAYMENT_METHOD,
      itemType(row),
      [partName(row), row.procurementRemark || handoffWarnings(row).join(" / ") || ""].filter(Boolean).join(" / "),
      row.noOfQuotation || "",
    ]),
  ];
}

function exportRfqExcel() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before exporting Excel.", "error");
    return;
  }
  if (rows.some((row) => !readyForCoordinatorOutput(row))) return;
  const projects = [...new Set(rows.map((row) => row.project))];
  if (projects.length !== 1) {
    showToast("Export one MFG project package at a time. Please select rows from a single project.", "error");
    return;
  }
  const project = projects[0];
  const groups = rows.reduce((grouped, row) => {
    const key = itemType(row) || "MFG";
    grouped[key] ??= [];
    grouped[key].push(row);
    return grouped;
  }, {});
  const sheets = Object.entries(groups).map(([type, typeRows]) => ({
      name: `${type}`.slice(0, 31),
      rows: rfqExcelRows(typeRows),
      minWidth: 8,
      maxWidth: 42,
      preferred: { 0: 5, 1: 14, 2: 24, 3: 26, 4: 24, 5: 38, 6: 18, 8: 12, 10: 30, 12: 18, 13: 32 },
      rowHeights: [28, 58],
      merges: ["A1:O1"],
      freezeHeader: true,
    }));
  downloadXlsx(mfgEcsFileName(project), sheets);
  rows.forEach((row) => addDispatchHistory(row, "Exported MFG Collection Excel", mfgEcsFileName(project)));
  renderDispatchHistory();
  showToast("MFG collection Excel exported.", "success");
}

function exportMfgPdf() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before exporting PDF.", "error");
    return;
  }
  const projects = [...new Set(rows.map((row) => row.project))];
  if (projects.length !== 1) {
    showToast("Export one project package at a time. Please select rows from a single project.", "error");
    return;
  }
  const project = projects[0];
  const content = [
    "MFG Collection Evidence PDF",
    `Project: ${project}`,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    ...rows.map((row, index) => `${index + 1}. ${row.id} | ${row.name} | Qty ${totalQty(row)} | ${itemDetail(row) || "No spec"}`),
  ].join("\n");
  downloadFile(`${project}-MFG-Collection.pdf`, content, "application/pdf");
  rows.forEach((row) => addDispatchHistory(row, "Exported MFG Collection PDF", `${project}-MFG-Collection.pdf`));
  renderDispatchHistory();
  showToast("MFG collection PDF exported.", "success");
}

function updateMfgExternalProgress() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before updating external progress.", "error");
    return;
  }
  openOmExternalResultModal(rows, "", "mfg");
}

function selectedMfgRows() {
  const rows = selectedRfqRows();
  if (rows.length) return rows;
  return procurementRows().filter((row) => row.handoffSelected || row.rfqSelected);
}

function rejectMfgSelectedToDri() {
  const rows = selectedMfgRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before rejecting to DRI.", "error");
    return;
  }
  openOmExternalResultModal(rows, EXT_REJECTED_DRI, "mfg");
}

function selectedRowsForSingleBuyer(actionLabel) {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast(`Select at least one RFQ row before ${actionLabel}.`, "error");
    return [];
  }
  if (rows.some((row) => !effectiveRfqBuyer(row))) {
    showToast("Assign Sourcing Owner before continuing.", "error");
    return [];
  }
  if (rows.some((row) => !readyForCoordinatorOutput(row))) return [];
  const buyers = [...new Set(rows.map((row) => effectiveRfqBuyer(row)))];
  if (buyers.length !== 1) {
    showToast("Select rows for one Sourcing Owner at a time.", "error");
    return [];
  }
  return rows;
}

function generateRfqEmailDraft() {
  const rows = selectedRowsForSingleBuyer("generating email draft");
  if (!rows.length) return;
  pendingRfqEmailRows = rows.map((row) => row.id);
  const buyer = effectiveRfqBuyer(rows[0]);
  const project = rows[0].project;
  const attachment = rfqFileName(project, buyer);
  const requiredDates = rows.map(rfqRequiredReplyDate).filter(Boolean);
  const requiredReplyDate = requiredDates[0] || addBusinessDays(todayDateString(), RFQ_REPLY_BUSINESS_DAYS);
  const daysSinceSentValues = rows.map((row) => row.rfqDispatchDate ? daysBetween(row.rfqDispatchDate) : null).filter((value) => value !== null);
  const daysSinceSent = daysSinceSentValues.length ? Math.max(...daysSinceSentValues) : "Not dispatched yet";
  document.getElementById("rfqEmailDraftScope").textContent = `${buyer} · ${rows.length} item${rows.length === 1 ? "" : "s"}`;
  document.getElementById("rfqEmailTo").value = buyerEmail(buyer);
  document.getElementById("rfqEmailSubject").value = `[RFQ Request] ${project} - ${buyer} - ${rows.length} items`;
  document.getElementById("rfqEmailBody").value = [
    `Hi ${buyer},`,
    "",
    `Please help quote the attached RFQ package for ${project}.`,
    "",
    `Project: ${project}`,
    `Sourcing Owner: ${buyer}`,
    `Item count: ${rows.length}`,
    `Required reply date: ${requiredReplyDate}`,
    `Days since sent: ${daysSinceSent}`,
    `Attachment: ${attachment}`,
    "",
    "Coordinator note:",
    rows.map((row, index) => `${index + 1}. ${row.id} - ${row.name}: ${row.procurementRemark || row.requesterReason || "Please quote based on attached specification."}`).join("\n"),
    "",
    "Thank you.",
  ].join("\n");
  rows.forEach((row) => addDispatchHistory(row, "Generated email draft", `To: ${buyerEmail(buyer)} / Attachment: ${attachment}`));
  document.getElementById("rfqEmailDraftModal").hidden = false;
  renderDispatchHistory();
}

function closeRfqEmailDraft() {
  pendingRfqEmailRows = [];
  document.getElementById("rfqEmailDraftModal").hidden = true;
}

function copyRfqEmailDraft() {
  const text = [
    `To: ${document.getElementById("rfqEmailTo").value}`,
    `Subject: ${document.getElementById("rfqEmailSubject").value}`,
    "",
    document.getElementById("rfqEmailBody").value,
  ].join("\n");
  navigator.clipboard?.writeText(text);
  showToast("RFQ email draft copied.", "success");
}

function rfqRowsForBuyer(buyer) {
  return rfqRows().filter((row) => effectiveRfqBuyer(row) === buyer);
}

function selectRfqBuyerGroup(buyer) {
  const buyerRows = rfqRowsForBuyer(buyer);
  requests = requests.map((row) => buyerRows.some((item) => item.id === row.id) ? { ...row, rfqSelected: true } : row);
  renderRfqDispatch();
  renderRfqFollowUp();
  showToast(`${buyerRows.length} ${buyer} RFQ row${buyerRows.length === 1 ? "" : "s"} selected.`, "success");
}

function runRfqBuyerGroupAction(buyer, action) {
  const buyerRows = rfqRowsForBuyer(buyer);
  if (!buyerRows.length) {
    showToast("No RFQ rows are available for this buyer.", "error");
    return;
  }
  requests = requests.map((row) => buyerRows.some((item) => item.id === row.id) ? { ...row, rfqSelected: true, rfqBuyer: effectiveRfqBuyer(row) } : { ...row, rfqSelected: false });
  if (action === "select") {
    renderRfqDispatch();
    renderRfqFollowUp();
    showToast(`${buyerRows.length} ${buyer} RFQ row${buyerRows.length === 1 ? "" : "s"} selected.`, "success");
    return;
  }
  if (action === "export") exportRfqExcel();
  if (action === "email") generateRfqEmailDraft();
  if (action === "dispatch") markRfqDispatched();
}

function markRfqDispatched() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one RFQ row before marking dispatched.", "error");
    return;
  }
  if (rows.some((row) => !effectiveRfqBuyer(row))) {
    showToast("Assign Sourcing Owner before marking dispatched.", "error");
    return;
  }
  if (rows.some((row) => !readyForCoordinatorOutput(row))) return;
  const today = todayDateString();
  requests = requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    const dispatchDate = row.rfqDispatchDate || today;
    return {
      ...row,
      rfqDispatchDate: dispatchDate,
      rfqRequiredReplyDate: row.rfqRequiredReplyDate || addBusinessDays(dispatchDate, RFQ_REPLY_BUSINESS_DAYS),
      rfqStatus: "Waiting Quote",
    };
  });
  rows.forEach((row) => addDispatchHistory({ ...row, rfqDispatchDate: row.rfqDispatchDate || today }, "Marked as dispatched", `Required reply date: ${row.rfqRequiredReplyDate || addBusinessDays(today, RFQ_REPLY_BUSINESS_DAYS)}`));
  renderRfqDispatch();
  renderDispatchHistory();
  showToast("Selected RFQ rows marked dispatched.", "success");
}

function sendRfqSelectedToBuyer() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one RFQ reply row before sending to Buyer.", "error");
    return;
  }
  const notReady = rows.filter((row) => !readyForCoordinatorOutput(row) || !rfqReplyComplete(row));
  if (notReady.length) {
    showToast("Only rows with Sourcing reply can be sent to Buyer.", "error");
    return;
  }
  const now = new Date().toISOString();
  rows.forEach((row) => {
    addDispatchHistory(row, "Sent package to Buyer", `Sourcing owner: ${effectiveRfqBuyer(row)}`);
    addHandoffHistory(row, "Sent package to Buyer", `Quote result: ${row.rfqQuoteResult || "Quote received"}`);
  });
  requests = requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      rfqSelected: false,
      procurementStatus: HANDOFF_SENT_TO_BUYER,
      buyerStatus: row.buyerStatus || BUYER_RECEIVED,
      buyerReceivedAt: row.buyerReceivedAt || now,
    };
  });
  renderProcurement();
  renderSourcing();
  renderBuyer();
  showToast(`${rows.length} RFQ row${rows.length === 1 ? "" : "s"} sent to Buyer.`, "success");
}

function commitSendSelectedToOm(selectedRows) {
  selectedRows.forEach((row) => {
    addHandoffHistory(row, "Sent handoff package to OM Purchasing", row.procurementRemark || "Ready for OM Purchasing update.");
    addOmHistory(row, "Received handoff", `Route: ${handoffRoute(row)} / ${handoffWarnings(row).join(" / ") || "No warnings"}`);
  });

  requests = requests.map((row) => {
    if (!selectedRows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      handoffSelected: false,
      omSelected: true,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      sentToOmAt: new Date().toISOString(),
    };
  });
  renderProcurement();
  renderOmPurchasing();
  showToast(`${selectedRows.length} handoff row${selectedRows.length === 1 ? "" : "s"} sent to OM Purchasing.`, "success");
}

function sendSelectedToOm() {
  const selectedRows = procurementRows().filter((row) => row.handoffSelected && row.procurementStatus !== HANDOFF_SENT_TO_OM);
  if (!selectedRows.length) {
    showToast("Select at least one ready handoff row before sending to OM Purchasing.", "error");
    return;
  }
  const blockedRows = selectedRows.filter((row) => !readyForCoordinatorOutput(row));
  if (blockedRows.length) return;

  showConfirm({
    title: "Send selected rows to OM Purchasing?",
    message: `${selectedRows.length} selected handoff row${selectedRows.length === 1 ? "" : "s"} will move to the OM Purchasing queue.`,
    confirmLabel: "Send to OM",
    tone: "primary",
    onConfirm: () => commitSendSelectedToOm(selectedRows),
  });
}

function omProjectFilterValue() {
  return document.getElementById("omProjectFilter")?.value || "";
}

function omDemandProjectFilterValue() {
  return document.getElementById("omDemandProjectFilter")?.value || omProjectFilterValue();
}

function omHistoryProjectFilterValue() {
  return document.getElementById("omHistoryProjectFilter")?.value || omProjectFilterValue();
}

function omUserConfirmProjectFilterValue() {
  return document.getElementById("omUserConfirmProjectFilter")?.value || omProjectFilterValue();
}

function omFinalExportProjectFilterValue() {
  return document.getElementById("omFinalExportProjectFilter")?.value || omProjectFilterValue();
}

function isOmCancelledByUserA(row) {
  return row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST || row.status === USER_CANCELLED_REQUEST || row.status === "Cancelled";
}

function isOmWaitingUserConfirm(row) {
  return row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM;
}

function isOmUserConfirmed(row) {
  return row.userAQuoteDecisionStatus === OM_USER_CONFIRMED;
}

function isOmExportAuthorized(row) {
  return isOmUserConfirmed(row)
    || row.userAQuoteDecisionStatus === USER_CONFIRMATION_NOT_REQUIRED
    || row.priceDecisionStatus === PRICE_AUTO_CLEARED
    || row.priceDecisionStatus === PRICE_ESCALATION_APPROVED
    || row.priceApprovalStatus === PRICE_AUTO_CLEARED
    || row.priceApprovalStatus === PRICE_ESCALATION_APPROVED
    || Boolean(row.projectDriApprovedAt);
}

function isOmFinalExportPrepared(row) {
  return [OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus);
}

function isOmFinalExported(row) {
  return [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus);
}

function omFinalExportTargetLabel(row) {
  return row.finalExportTarget || "-";
}

function omFinalExportStatusLabel(row) {
  return row.finalExportStatus || (isOmUserConfirmed(row) ? OM_PREPARING_EXPORT : "-");
}

function parseOmPackageCode(value) {
  const match = String(value || "").match(/\b([A-Z0-9]+)-(MP|NPI|SV)-([A-Z0-9]+)-MVA(\d{4})-(\d+)OM\b/);
  if (!match) return null;
  return {
    code: match[0],
    process: match[1],
    stageType: match[2],
    projectCode: match[3],
    yymm: match[4],
    sequence: Number(match[5] || 0),
  };
}

function normalizeOmPackageToken(value, fallback = "NA") {
  const token = String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return token || fallback;
}

function omFinalExportProcess(row) {
  return parseOmPackageCode(row.finalExportPackageCode || row.budgetNo)?.process
    || normalizeOmPackageToken(row.process, "FATP");
}

function omFinalExportStageType(row) {
  const parsed = parseOmPackageCode(row.finalExportPackageCode || row.budgetNo);
  if (parsed?.stageType) return parsed.stageType;
  const candidates = [row.stage, row.station, row.projectStage, row.sourceStage, currentPhaseLabelForProject(row.project)];
  const match = candidates.map((value) => normalizeOmPackageToken(value, "")).find((value) => ["MP", "NPI", "SV"].includes(value));
  return match || "MP";
}

function omFinalExportProjectCode(row) {
  const parsed = parseOmPackageCode(row.finalExportPackageCode || row.budgetNo);
  if (parsed?.projectCode) return parsed.projectCode;
  const candidates = [row.sourceProject, row.yearProject, row.purpose, row.project];
  const clean = candidates
    .map((value) => normalizeOmPackageToken(value, ""))
    .find((value) => value && !["P26", "P27", "DEMO", "DEMOLINE"].includes(value) && !value.includes("DEMO") && /^[A-Z0-9]{2,8}$/.test(value));
  return clean || normalizeOmPackageToken(row.project, "P26");
}

function omFinalExportYymm(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
  return `${String(safeDate.getFullYear()).slice(-2)}${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
}

function omFinalExportScope(row) {
  return {
    process: omFinalExportProcess(row),
    stageType: omFinalExportStageType(row),
    projectCode: omFinalExportProjectCode(row),
  };
}

function omFinalExportScopeKey(row) {
  const scope = omFinalExportScope(row);
  return `${scope.process}-${scope.stageType}-${scope.projectCode}`;
}

function validateOmFinalExportPackageScope(rows) {
  const keys = [...new Set(rows.map(omFinalExportScopeKey))];
  if (keys.length > 1) {
    return `Selected rows mix package scopes (${keys.join(" / ")}). Split them before preparing CFA/ECS.`;
  }
  const packageCodes = [...new Set(rows.map((row) => row.finalExportPackageCode).filter(Boolean))];
  if (packageCodes.length > 1) {
    return `Selected rows already belong to different package codes (${packageCodes.join(" / ")}).`;
  }
  return "";
}

function existingOmPackageCodes() {
  const values = [...requests, ...purchaseRecords].flatMap((row) => [
    row.finalExportPackageCode,
    row.budgetNo,
  ]);
  return values.flatMap((value) => {
    const text = String(value || "");
    const matches = text.match(/\b[A-Z0-9]+-(?:MP|NPI|SV)-[A-Z0-9]+-MVA\d{4}-\d+OM\b/g) || [];
    return matches;
  });
}

function nextOmPackageSequence(yymm) {
  return existingOmPackageCodes()
    .map(parseOmPackageCode)
    .filter((parsed) => parsed?.yymm === yymm)
    .reduce((max, parsed) => Math.max(max, parsed.sequence), 0) + 1;
}

function generateOmFinalExportPackageCode(rows, date = new Date()) {
  const existing = rows.find((row) => row.finalExportPackageCode)?.finalExportPackageCode;
  if (existing) return existing;
  const scope = omFinalExportScope(rows[0] || {});
  const yymm = omFinalExportYymm(date);
  const sequence = String(nextOmPackageSequence(yymm)).padStart(2, "0");
  return `${scope.process}-${scope.stageType}-${scope.projectCode}-MVA${yymm}-${sequence}OM`;
}

function omFinalExportPackageCode(row) {
  return row.finalExportPackageCode || row.budgetNo || "-";
}

function budgetPackageCode(row) {
  return row.finalExportPackageCode || row.budgetNo || "-";
}

function budgetPackageHelper(row) {
  if (row.finalExportPackageCode && row.budgetNo && row.finalExportPackageCode !== row.budgetNo) return `Source Budget No. ${row.budgetNo}`;
  return row.budgetStatus || (row.finalExportPackageCode ? "System package code" : "Source budget reference");
}

function omWorkflowStage(row) {
  if (row.omStage) return row.omStage;
  if ([PRICE_ESCALATION_REQUIRED, PRICE_ESCALATION_PENDING_DRI, PRICE_ESCALATION_PENDING_PROJECT_DRI].includes(row.priceApprovalStatus)) return "priceReview";
  if (isOmWaitingUserConfirm(row)) return "userConfirm";
  if (isOmUserConfirmed(row) || row.finalExportTarget || row.finalExportStatus || row.finalExportedAt) return "finalExport";
  if (row.procurementStatus === HANDOFF_WAITING_PAS) return "pasRequest";
  if (row.procurementStatus === HANDOFF_SENT_TO_OM && row.omCollectionStatus === OM_COLLECTION_COLLECTING) return "pasRequest";
  return "pasResult";
}

function omAllRows() {
  return requests.filter((row) => {
    if (isOmAmendmentWorkingRow(row)) return true;
    return row.status === "Approved"
      && row.procurementStatus === HANDOFF_SENT_TO_OM
      && !isOmCancelledByUserA(row)
      && !hasPendingAmendment(row)
      && !isSupersededRequest(row)
      && (!isPasRequired(row) || [PAS_WAITING, PAS_APPROVED, PAS_BUDGET_ISSUED].includes(row.pasStatus));
  });
}

function omPasRequestRows() {
  const projectFilter = omDemandProjectFilterValue();
  const ownerFilter = document.getElementById("omOwnerFilter")?.value || "";
  const rows = [
    ...pasReviewRows(),
    ...omAllRows().filter((row) => omWorkflowStage(row) === "pasRequest"),
  ];
  const seen = new Set();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    const enriched = applyOmResponsibility(row);
    return (!projectFilter || row.project === projectFilter)
      && (!ownerFilter || enriched.omOwner === ownerFilter);
  });
}

function omPasResultRows() {
  const projectFilter = omProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "pasResult";
  });
}

function omQuoteConfirmRows() {
  return [...omPasResultRows(), ...omPriceReviewRows(), ...omUserConfirmRows()].sort((left, right) => {
    const priorityDiff = omQuotePriority(right) - omQuotePriority(left);
    if (priorityDiff) return priorityDiff;
    const activityDiff = latestRequestActivityTime(right) - latestRequestActivityTime(left);
    if (activityDiff) return activityDiff;
    return `${left.project} ${left.name}`.localeCompare(`${right.project} ${right.name}`);
  });
}

function omPriceReviewRows() {
  const projectFilter = omProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "priceReview";
  });
}

function omQuotePriority(row) {
  if (row.amendmentStatus === AMENDMENT_REWORK_REQUIRED) return 6;
  if (row.amendmentStatus === AMENDMENT_WAITING_OM) return 5;
  if (row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM) return 4;
  if (isOmWaitingUserConfirm(row)) return 3;
  if (row.amendmentOf) return 2;
  if (omReadyForBuyer(row)) return 1;
  return 0;
}

function omUserConfirmRows() {
  const projectFilter = omUserConfirmProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "userConfirm";
  });
}

function omFinalExportRows() {
  const projectFilter = omFinalExportProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "finalExport";
  });
}

function omDemandRows() {
  return omPasRequestRows();
}

function omRows() {
  return omPasResultRows();
}

function omItemBucket(row) {
  if (row.catalogBucket) return row.catalogBucket;
  const text = omBuyScopeText(row);
  const buckets = [
    ["IPC(A++)", ["ipc(a++)", "ipc a++"]],
    ["IPC(A+)", ["ipc(a+)", "ipc a+"]],
    ["IPC(A)", ["ipc(a)", "industrial pc", "工業電腦"]],
    ["PC", ["pc", "desktop", "computer", "電腦"]],
    ["Laptop", ["laptop", "notebook", "筆記本"]],
    ["Monitor", ["monitor", "螢幕", "顯示器"]],
    ["Keyboard / Mouse", ["keyboard", "mouse", "鍵盤", "鼠標"]],
    ["Barcode / PDA", ["barcode", "rfid", "pda", "scanner", "條碼", "掃描"]],
    ["Network Equipment", ["network switch", "router", "wi-fi", "wifi", "firewall", "network rack", "交換機", "路由器"]],
    ["Server / Storage", ["server", "storage", "伺服器", "服務器", "存儲"]],
    ["Software", ["software", "license", "subscription", "軟件", "授權"]],
    ["Camera / Access Control", ["surveillance", "monitoring", "camera", "access control", "attendance", "監控", "門禁", "考勤"]],
    ["Video Conference", ["video conference", "conference", "視訊會議"]],
    ["IT Cable / Peripheral", ["usb", "hdmi", "vga", "network cable", "patch cord", "adapter", "cable"]],
  ];
  const match = buckets.find(([, keywords]) => keywords.some((keyword) => omKeywordMatches(text, keyword)));
  return match?.[0] || row.name;
}

function omFinalSpecStatus(row) {
  if (row.finalSpecStatus) return row.finalSpecStatus;
  return omBuyScopeStatus(row) === OM_SCOPE_NEED_SPEC ? OM_FINAL_SPEC_REQUIRED : OM_FINAL_SPEC_READY;
}

function omCollectionStatus(row) {
  return row.omCollectionStatus || OM_COLLECTION_QUOTATION;
}

function addOmHistory(row, action, note = "") {
  const actor = roleProfiles[currentRole]?.name || "System";
  omHistory = [{
    id: `OMH-${String(omHistorySequence++).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    action,
    actor,
    note,
    timestamp: new Date().toISOString(),
  }, ...omHistory];
}

function omTimelineForRequest(row) {
  return omHistory
    .filter((event) => event.requestId === row.id)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function requesterOmHistoryNote(event) {
  const actionText = normalize(event.action);
  if (actionText.includes("quote") || actionText.includes("pas result") || actionText.includes("pdf")) {
    return "Quote information was updated by OM Purchasing.";
  }
  if (actionText.includes("user a")) return event.note || "-";
  if (actionText.includes("export")) return "OM package progress was updated.";
  return String(event.note || "-")
    .replace(/\bvendor\b/gi, "quote source")
    .replace(/\bsupplier\b/gi, "quote source");
}

function omHistoryNoteForDisplay(event) {
  return currentRole === "requester" ? requesterOmHistoryNote(event) : event.note || "-";
}

function omPackageHistoryHtml(row, { compact = false } = {}) {
  const events = omTimelineForRequest(row);
  if (!events.length) return compact ? "-" : `<div class="empty-state">No OM package history yet.</div>`;
  if (compact) {
    const latest = events[events.length - 1];
    return `${latest.action}<div class="reason-text">${omHistoryNoteForDisplay(latest)}</div>`;
  }
  return `
    <div class="detail-subsection om-timeline">
      <h4>OM Package Timeline</h4>
      ${events.map((event) => `
        <article class="om-timeline-event">
          <div class="om-timeline-head">
            <span class="status-pill ${statusClass(event.action)}">${event.action}</span>
            <strong>${event.actor}</strong>
          </div>
          <p>${omHistoryNoteForDisplay(event)}</p>
          <small>${new Date(event.timestamp).toLocaleString("en-US")}</small>
        </article>`).join("")}
    </div>`;
}

function relatedRequestIds(row) {
  return new Set([row.id]);
}

function externalProgressEventsFor(row) {
  const ids = relatedRequestIds(row);
  return requests
    .filter((request) => ids.has(request.id))
    .flatMap((request) => request.externalProgressEvents || [])
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function materialCreationEventFor(row) {
  return externalProgressEventsFor(row).filter((event) => event.status === MATERIAL_CREATION_EVENT).at(-1) || null;
}

function latestExternalProgressEvent(row) {
  const events = externalProgressEventsFor(row);
  return events[events.length - 1] || null;
}

function externalStatusFor(row) {
  const latest = latestExternalProgressEvent(row);
  if (latest) return latest.status;
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST || row.status === USER_CANCELLED_REQUEST) return EXT_CANCELLED;
  if ([OM_EXPORTED_CFA, OM_EXPORTED_ECS, OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus)) return row.finalExportStatus;
  if (row.buyerStatus === BUYER_COMPLETED) return EXT_COMPLETED;
  if (row.buyerStatus === BUYER_PO_ISSUED) return EXT_PO_ISSUED;
  if (row.buyerStatus === BUYER_PR_CREATED) return EXT_PR_CREATED;
  if (row.buyerStatus === BUYER_BLOCKED) return EXT_BLOCKED;
  if (row.externalReviewStatus === OM_REJECTED_TO_DRI) return EXT_REJECTED_DRI;
  if (row.externalReviewStatus === OM_EXTERNAL_ACCEPTED || row.buyerStatus === BUYER_RECEIVED) return EXT_ACCEPTED;
  if (row.externalReviewStatus === OM_EXTERNAL_PENDING) return EXT_REVIEW;
  if (row.procurementStatus === HANDOFF_SENT_TO_OM || row.omCollectionStatus === OM_COLLECTION_QUOTATION) return EXT_PACKAGE_PREPARING;
  return "-";
}

function externalOwnerFor(row) {
  const status = externalStatusFor(row);
  if ([EXT_PR_CREATED, EXT_PO_ISSUED, EXT_COMPLETED].includes(status)) return "Buyer";
  if ([EXT_REVIEW, EXT_ACCEPTED].includes(status)) return "External System";
  if (status === EXT_REJECTED_DRI) return "Requester / DRI";
  if (status === "-") return "-";
  return "OM Purchasing";
}

function externalEvidenceCount(row) {
  return externalProgressEventsFor(row).filter((event) => event.evidenceFileName || event.pastedExternalResult).length;
}

function externalEvidenceLabel(row) {
  const count = externalEvidenceCount(row);
  return count ? `${count} evidence` : "Missing";
}

function hasEvidencePayload(payload) {
  return Boolean((payload.evidenceFileName || "").trim() || (payload.pastedExternalResult || "").trim());
}

function validateExternalProgressPayload(payload) {
  const status = payload.status;
  const hasEvidence = hasEvidencePayload(payload);
  if (!status) return "Select an external progress status.";
  if (status === EXT_REJECTED_DRI && !(payload.reason || "").trim()) {
    return "Reject to DRI requires a reason.";
  }
  if (status === EXT_BLOCKED && !(payload.reason || "").trim()) {
    return "Blocked requires a reason.";
  }
  if ([EXT_SUBMITTED, EXT_PR_CREATED, EXT_PO_ISSUED, EXT_COMPLETED].includes(status) && !hasEvidence) {
    return `${status} requires screenshot, pasted result, email, PDF, Excel, or zip evidence.`;
  }
  if (status === EXT_PR_CREATED && !(payload.prNo || "").trim()) return "PR Created requires PR No.";
  if (status === EXT_PO_ISSUED && !(payload.poNo || "").trim()) return "PO Issued requires PO No.";
  return "";
}

function createExternalProgressEvent(row, payload) {
  const actor = roleProfiles[currentRole]?.name || "System";
  return {
    id: `EXT-${String(externalProgressSequence++).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    step: payload.status,
    status: payload.status,
    owner: payload.owner || actor,
    externalSystem: payload.externalSystem || row.externalSystem || "",
    externalRequestNo: payload.externalRequestNo || row.externalRequestNo || "",
    prNo: payload.prNo || row.prNo || "",
    poNo: payload.poNo || row.buyerPoNo || row.poNo || "",
    factoryMaterialNo: payload.factoryMaterialNo || row.factoryMaterialNo || "",
    reason: payload.reason || "",
    evidenceType: payload.evidenceType || "",
    evidenceFileName: payload.evidenceFileName || "",
    pastedExternalResult: payload.pastedExternalResult || "",
    createdBy: actor,
    createdAt: new Date().toISOString(),
  };
}

function createMaterialCreationTimelineEvent(row, material, triggerEvent, sourceLabel) {
  return {
    id: `EXT-${String(externalProgressSequence++).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    step: MATERIAL_CREATION_EVENT,
    status: MATERIAL_CREATION_EVENT,
    owner: "Material Master",
    externalSystem: triggerEvent?.externalSystem || row.externalSystem || "",
    externalRequestNo: triggerEvent?.externalRequestNo || row.externalRequestNo || "",
    prNo: triggerEvent?.prNo || row.prNo || "",
    poNo: triggerEvent?.poNo || row.buyerPoNo || row.poNo || "",
    reason: `${material.materialNo} ${sourceLabel}.`,
    evidenceType: triggerEvent?.evidenceType || "",
    evidenceFileName: triggerEvent?.evidenceFileName || "",
    pastedExternalResult: triggerEvent?.pastedExternalResult || "",
    createdBy: "System",
    createdAt: new Date().toISOString(),
    materialId: material.materialId,
    materialNo: material.materialNo,
    sourceExternalEventId: triggerEvent?.id || "",
  };
}

function ensureMaterialMasterFromExternalProgress(row, event) {
  return ensureMaterialMaster(row, {
    createdBy: event.createdBy || "System",
    source: `External progress: ${event.status}`,
    createdFromRequestId: row.id,
    sourceProject: row.project,
    sourceRecordId: row.sourceRecordId || "",
    sourceExternalEventId: event.id,
    sourcePrNo: event.prNo || "",
    sourcePoNo: event.poNo || "",
  });
}

function appendMaterialCreationTimeline(row, material, event) {
  const sourceLabel = event.status === EXT_PO_ISSUED
    ? "created from PO Issued"
    : event.status === EXT_PR_CREATED ? "created from PR Created" : "created from legacy maintenance";
  return createMaterialCreationTimelineEvent(row, material, event, sourceLabel);
}

function externalProgressTimelineHtml(row, { compact = false } = {}) {
  const events = externalProgressEventsFor(row);
  if (!events.length) return compact ? "-" : `<div class="empty-state">No external progress evidence yet.</div>`;
  if (compact) {
    const latest = events[events.length - 1];
    return `${latest.status}<div class="reason-text">${latest.externalRequestNo || latest.evidenceFileName || latest.reason || "Evidence recorded"}</div>`;
  }
  return `
    <div class="detail-subsection external-timeline">
      <h4>External Progress Timeline</h4>
      ${events.map((event) => `
        <article class="om-timeline-event">
          <div class="om-timeline-head">
            <span class="status-pill ${statusClass(event.status)}">${event.status}</span>
            <strong>${event.externalRequestNo || event.prNo || event.poNo || "No external no."}</strong>
          </div>
          <p>${event.reason || event.pastedExternalResult || "-"}</p>
          <small>${event.createdBy} · ${new Date(event.createdAt).toLocaleString("en-US")} · ${event.evidenceFileName || "No file"}</small>
        </article>`).join("")}
    </div>`;
}

function omSourceRecord(row) {
  return matchingPurchaseRecord(row) || {};
}

function omUnit(row) {
  return row.unit || (normalize(row.name).includes("filament") ? "ROLL" : "PCS");
}

function omLastPurchaseTime(row) {
  return omSourceRecord(row).quoteDate || row.quoteDate || "";
}

function omLastPrQty(row) {
  return clampQty(omSourceRecord(row).qty);
}

function omCurrentPrQty(row) {
  return totalQty(row);
}

function omUnitPriceVnd(row) {
  const usdPrice = effectiveUnitPrice(row);
  return Math.round(usdPrice * currentUsdToVndRate());
}

function omAmountVnd(row) {
  return omCurrentPrQty(row) * omUnitPriceVnd(row);
}

function omUnitPriceUsd(row) {
  return effectiveUnitPrice(row);
}

function omAmountUsd(row) {
  return omCurrentPrQty(row) * omUnitPriceUsd(row);
}

function omPurchaseReason(row) {
  return row.requesterReason || row.procurementRemark || `${row.project} ${currentPhaseLabelForProject(row.project)} approved demand`;
}

function priceDecisionModule() {
  return window.ProcurementApp?.modules?.priceDecision || {};
}

function quoteUnitPriceUsdForDecision(row) {
  const directUsd = Number(row.updatedPriceUsd || row.quoteUnitPriceUsd || 0);
  if (directUsd > 0) return directUsd;
  const directVnd = Number(row.updatedPriceVnd || row.quoteUnitPriceVnd || 0);
  if (directVnd > 0) return directVnd / usdToVndRateForRow(row);
  const raw = Number(String(row.updatedPrice ?? "").replace(/,/g, ""));
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 1000 ? raw / usdToVndRateForRow(row) : raw;
}

function historyUnitPriceUsdForDecision(row) {
  const directUsd = Number(row.historyUnitPriceUsd || row.unitPriceUsd || 0);
  if (directUsd > 0) return directUsd;
  const directVnd = Number(row.historyUnitPriceVnd || 0);
  if (directVnd > 0) return directVnd / usdToVndRateForRow(row);
  const raw = Number(String(row.unitPrice ?? "").replace(/,/g, ""));
  if (Number.isFinite(raw) && raw > 0) return raw > 1000 ? raw / usdToVndRateForRow(row) : raw;
  const rowName = normalize(row.name);
  const rowSpec = normalize(userVisibleItemDetail(row) || itemDetail(row));
  const candidate = purchaseRecords
    .filter((record) => normalize(record.name) === rowName && normalize(userVisibleItemDetail(record) || itemDetail(record)) === rowSpec)
    .map((record) => ({
      price: Number(String(record.unitPrice || record.unitPriceVnd || "").replace(/,/g, "")),
      time: new Date(record.poIssuedAt || record.completedAt || record.updatedAt || record.createdAt || 0).getTime() || 0,
    }))
    .filter((record) => record.price > 0)
    .sort((left, right) => right.time - left.time)[0];
  if (!candidate) return 0;
  return candidate.price > 1000 ? candidate.price / usdToVndRateForRow(row) : candidate.price;
}

function isTemporaryBudgetRequest(row) {
  return row.requestType === "Temporary Budget Request" || row.temporaryBudgetRequest === true;
}

function priceDecisionForRow(row) {
  const mod = priceDecisionModule();
  const category = mod.classifyPriceThresholdCategory?.(row) || "Need Classification";
  const comparison = mod.compareQuoteToHistory?.({
    category,
    quoteUnitPriceUsd: quoteUnitPriceUsdForDecision(row),
    historyUnitPriceUsd: historyUnitPriceUsdForDecision(row),
    thresholds: adminApprovalSetup.thresholds,
    isTemporaryBudget: isTemporaryBudgetRequest(row),
  }) || {
    status: PRICE_ESCALATION_REQUIRED,
    category,
    quoteUnitPrice: quoteUnitPriceUsdForDecision(row),
    historyUnitPrice: historyUnitPriceUsdForDecision(row),
    thresholdUsd: 0.4,
    deltaUsd: null,
    variancePercent: null,
    reason: "Price decision helper unavailable",
  };
  return {
    ...comparison,
    status: comparison.status === "Auto Cleared" ? PRICE_AUTO_CLEARED : PRICE_ESCALATION_REQUIRED,
  };
}

function estimateUnitPriceUsdForVariance(row) {
  const directUsd = Number(row.estimatedUnitPriceUsd || 0);
  if (directUsd > 0) return directUsd;
  const directVnd = Number(row.estimatedUnitPriceVnd || row.estimatedUnitPrice || 0);
  if (directVnd > 0) return directVnd / usdToVndRateForRow(row);
  const amountUsd = Number(row.estimatedAmountUsd || 0)
    || (Number(row.estimatedAmountVnd || row.estimatedAmount || 0) ? Number(row.estimatedAmountVnd || row.estimatedAmount || 0) / usdToVndRateForRow(row) : 0);
  const qty = totalQty(row);
  return amountUsd > 0 && qty > 0 ? amountUsd / qty : 0;
}

function estimateVarianceForRow(row) {
  const mod = priceDecisionModule();
  return mod.compareEstimateToQuote?.({
    estimateUnitPriceUsd: estimateUnitPriceUsdForVariance(row),
    quoteUnitPriceUsd: quoteUnitPriceUsdForDecision(row),
    qty: totalQty(row),
    percentThreshold: 20,
    amountThresholdUsd: 0.4,
  }) || {
    status: "Within Estimate Range",
    estimateUnitPrice: estimateUnitPriceUsdForVariance(row),
    quoteUnitPrice: quoteUnitPriceUsdForDecision(row),
    deltaUsd: null,
    deltaPercent: null,
    totalDeltaUsd: null,
    alert: false,
    reason: "Estimate variance helper unavailable",
  };
}

function estimateVariancePatch(row, now = new Date().toISOString()) {
  const variance = estimateVarianceForRow(row);
  return {
    estimateVarianceStatus: variance.status,
    estimateVarianceAlert: Boolean(variance.alert),
    estimateUnitPriceSnapshotUsd: variance.estimateUnitPrice || 0,
    quoteUnitPriceSnapshotUsd: variance.quoteUnitPrice || 0,
    estimateDeltaUsd: variance.deltaUsd,
    estimateDeltaPercent: variance.deltaPercent,
    estimateTotalDeltaUsd: variance.totalDeltaUsd,
    estimateVarianceReason: variance.reason,
    estimateVarianceAt: now,
  };
}

function priceDecisionPatch(row, now = new Date().toISOString(), { deferRouting = false } = {}) {
  const decision = priceDecisionForRow(row);
  const basePatch = {
    ...estimateVariancePatch(row, now),
    priceDecisionStatus: decision.status,
    priceApprovalStatus: decision.status === PRICE_AUTO_CLEARED ? PRICE_AUTO_CLEARED : PRICE_ESCALATION_PENDING_DRI,
    priceThresholdCategory: decision.category,
    historyUnitPrice: decision.historyUnitPrice || 0,
    quoteUnitPrice: decision.quoteUnitPrice || 0,
    historyUnitPriceUsd: decision.historyUnitPrice || 0,
    quoteUnitPriceUsd: decision.quoteUnitPrice || 0,
    priceDeltaUsd: decision.deltaUsd,
    priceThresholdUsd: decision.thresholdUsd || 0.4,
    priceVariancePercent: decision.variancePercent,
    priceDecisionReason: decision.reason,
    exchangeRateMonth: budgetApprovedExchangeRateMonth(row),
    priceDecisionAt: now,
    priceDecisionBy: roleProfiles[currentRole]?.name || "OM Purchasing",
    priceApprovalChain: adminApprovalSetup.approvalChain.join(" -> "),
  };
  if (deferRouting) {
    return {
      ...basePatch,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  if (decision.status === PRICE_AUTO_CLEARED) {
    return {
      ...basePatch,
      omStage: "finalExport",
      omStatus: PRICE_AUTO_CLEARED,
      userAQuoteDecisionStatus: USER_CONFIRMATION_NOT_REQUIRED,
      userAQuoteDecisionAt: now,
      userAQuoteDecisionBy: "System threshold rule",
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  return {
    ...basePatch,
    omStage: "priceReview",
    omStatus: PRICE_ESCALATION_REQUIRED,
    quoteReadyAt: row.quoteReadyAt || now,
    quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
  };
}

function postUserAQuoteConfirmationRoutePatch(row, now = new Date().toISOString()) {
  if (row.priceDecisionStatus === PRICE_ESCALATION_REQUIRED || row.priceApprovalStatus === PRICE_ESCALATION_PENDING_DRI) {
    return {
      omStage: "priceReview",
      omStatus: PRICE_ESCALATION_REQUIRED,
      priceApprovalStatus: row.priceApprovalStatus || PRICE_ESCALATION_PENDING_DRI,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  if (row.priceDecisionStatus === PRICE_AUTO_CLEARED || row.priceApprovalStatus === PRICE_AUTO_CLEARED) {
    return {
      omStage: "finalExport",
      omStatus: PRICE_AUTO_CLEARED,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  return priceDecisionPatch(row, now);
}

function omReadyForBuyer(row) {
  return Boolean(row.pasMaterialNo && omQuoteScreenshotFile(row) && row.quotationExcel && row.vendor && effectiveUnitPrice(row) && row.quoteDate && omQuoteValidUntil(row));
}

function omQuoteScreenshotFile(row) {
  return row.quotationScreenshot || row.quoteScreenshot || row.quoteImage || row.quotationPdf || "";
}

function omQuoteInputCurrency(row) {
  return row.quoteInputCurrency === "USD" ? "USD" : "VND";
}

function omQuotePriceFieldForCurrency(currency) {
  return currency === "USD" ? "updatedPrice" : "updatedPriceVnd";
}

function omQuotePriceInputValue(row, currency = omQuoteInputCurrency(row)) {
  return currency === "USD" ? effectiveUnitPrice(row) || "" : omUnitPriceVnd(row) || "";
}

function omQuotePriceDisplay(row) {
  const priceUsd = effectiveUnitPrice(row);
  if (!priceUsd) return "-";
  const formatter = sharedFormatters();
  const usdText = formatter?.formatMoneyFromUsd(priceUsd, { currency: "USD", usdToVndRate: currentUsdToVndRate() })
    || `$${Number(priceUsd || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const vndText = formatter?.formatMoneyFromUsd(priceUsd, { currency: "VND", usdToVndRate: currentUsdToVndRate() })
    || `${Math.round(amountVndFromUsd(priceUsd)).toLocaleString("en-US")} VND`;
  return `${usdText} / ${vndText}`;
}

function omQuoteCurrencyOptions(selected = "VND") {
  return ["VND", "USD"].map((currency) => `<option value="${currency}" ${currency === selected ? "selected" : ""}>${currency}</option>`).join("");
}

function isOmQuoteReady(row) {
  return ["Quote Valid", "Quote Expiring Soon"].includes(omQuoteValidity(row));
}

function omWarnings(row) {
  const warnings = [];
  const status = omPasResultStatus(row);
  if (omFinalSpecStatus(row) === OM_FINAL_SPEC_REQUIRED) warnings.push(OM_FINAL_SPEC_REQUIRED);
  if (["Quote Expired", "Quote Expiring Soon", "Update Required"].includes(omQuoteValidity(row))) warnings.push(omQuoteValidity(row));
  if (!row.pasMaterialNo) warnings.push("Missing PAS Material No");
  if (!row.vendor) warnings.push("Missing vendor name");
  if (!row.quoteDate) warnings.push("Missing quote date");
  if (!omQuoteValidUntil(row)) warnings.push("Missing quote validity");
  if (!omQuoteScreenshotFile(row) && status !== "Quote Screenshot Missing") warnings.push("Missing quote screenshot");
  if (!row.quotationExcel && status !== "Quote Excel Missing") warnings.push("Missing quote Excel");
  if (!effectiveUnitPrice(row)) warnings.push("Missing price");
  return warnings;
}

function omHasRequiredQuoteFiles(row) {
  return Boolean(omQuoteScreenshotFile(row) && row.quotationExcel);
}

function validateOmFinalExportAttachments(rows) {
  const missing = rows.filter((row) => !omHasRequiredQuoteFiles(row));
  if (!missing.length) return "";
  return `Upload both quote screenshot and quote Excel before Export Package. Missing file rows: ${missing.map((row) => row.id).join(", ")}.`;
}

function omTargetForCostType(costType) {
  return OM_COST_TYPE_TARGET_MAP[costType] || "";
}

function omCostTypeForTarget(target) {
  if (target === "CFA") return OM_COST_TYPE_CAPEX;
  if (target === "ECS") return OM_COST_TYPE_EXPENSE;
  return "";
}

function omFinalExportCostType(row) {
  return row.finalExportCostType || omCostTypeForTarget(row.finalExportTarget) || "";
}

function omFinalExportTargetForRow(row) {
  return row.finalExportTarget || omTargetForCostType(row.finalExportCostType) || "";
}

function omCostTypeTargetLabel(row) {
  const costType = omFinalExportCostType(row);
  const target = omFinalExportTargetForRow(row);
  if (!costType && !target) return "Select Cost Type";
  return `${costType || "Cost Type"} → ${target || "CFA/ECS"}`;
}

function omStatusForExportedRow(row) {
  const externalStatus = externalStatusFor(row);
  if (externalStatus !== "-") return externalStatus;
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST || row.status === USER_CANCELLED_REQUEST) return USER_CANCELLED_REQUEST;
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) return OM_WAITING_USER_CONFIRM;
  if (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) return OM_USER_CONFIRMED;
  if (row.finalExportStatus) return row.finalExportStatus;
  if (row.externalReviewStatus) return row.externalReviewStatus;
  if (row.excelExportedAt || row.quotePdfExportedAt) return OM_EXTERNAL_PENDING;
  if (isOmQuoteReady(row)) return OM_QUOTE_READY;
  if (row.omStatus) return row.omStatus;
  if (omQuoteValidity(row) === "Quote Pending") return OM_QUOTE_NEEDED;
  return OM_RECEIVED;
}

function omStatusLabel(status) {
  return status === OM_EXTERNAL_ACCEPTED ? EXT_ACCEPTED : status;
}

function renderOmSummary(rows) {
  const pasRows = omPasResultRows();
  const missingMaterialRows = pasRows.filter((row) => omPasResultStatus(row) === "PAS Material No Missing");
  const quoteIncompleteRows = pasRows.filter((row) => ["Quote Info Incomplete", "Quote Screenshot Missing", "Quote Excel Missing", "Quote Validity Missing", "Quote Completion Needed"].includes(omPasResultStatus(row)));
  const readyRows = pasRows.filter((row) => omPasResultStatus(row) === "Ready to Send Requester Confirmation");
  const expiringRows = pasRows.filter((row) => omQuoteValidity(row) === "Quote Expiring Soon");
  const expiredRows = pasRows.filter((row) => omQuoteValidity(row) === "Quote Expired");
  const cards = [
    { label: "Total Items", value: rows.length, helper: `${omProjectFilterValue() || "All projects"} · PAS Quote / Bidding`, variant: "hero" },
    ["Missing PAS Material No", missingMaterialRows.length],
    ["Quote Info Incomplete", quoteIncompleteRows.length],
    ["Ready for Requester", readyRows.length],
    ["Expiring Soon", expiringRows.length],
    ["Expired", expiredRows.length],
  ];
  document.getElementById("omSummary").innerHTML = summaryCardsHtml(cards);
}

function renderOmDemandSummary(rows) {
  const target = document.getElementById("omDemandSummary");
  if (!target) return;
  const cards = [
    ["Approved Demand", rows.length],
    ["Catalog Buckets", new Set(rows.map(omItemBucket)).size],
    ["Standard Buckets", rows.filter((row) => omBuyScopeStatus(row) === OM_SCOPE_STANDARD).length],
    ["Need Final Spec", rows.filter((row) => omBuyScopeStatus(row) === OM_SCOPE_NEED_SPEC).length],
    ["Ready for Quote", rows.filter((row) => omCollectionStatus(row) === OM_COLLECTION_QUOTATION).length],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}

function renderOmDemandCollection() {
  renderOmPasRequest();
}

function renderOmPurchasing() {
  if (!document.querySelector(`[data-om-tab="${currentOmTab}"]`)) currentOmTab = "submission";
  document.querySelectorAll("[data-om-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.omTab === currentOmTab));
  document.querySelectorAll("[data-om-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.omPanel === currentOmTab));
  syncProjectControls();
  renderOmFeedbackUtility();
  const quoteConfirmRows = omQuoteConfirmRows();
  const rowCount = document.getElementById("omWorkbenchCount");
  if (rowCount) rowCount.textContent = `${quoteConfirmRows.length} row${quoteConfirmRows.length === 1 ? "" : "s"}`;
  const quoteHint = document.getElementById("omQuoteConfirmHint");
  if (quoteHint) {
    quoteHint.textContent = "Input PAS quote / bidding result, including Quote Valid Until, then send the row to Requester when required.";
  }
  renderOmSubmission();
  renderOmPasRequest();
  renderOmSummary(quoteConfirmRows);
  renderOmQuoteConfirmRows(quoteConfirmRows);
  renderOmQuoteExpiry();
  renderOmFinalExport();
}

function omQuoteExpiryRows() {
  return omAllRows().filter((row) => {
    const hasQuotePath = row.pasDemandNo || row.pasMaterialNo || row.quoteDate || row.quoteValidUntil || row.quotationPdf || row.quotationExcel || row.vendor;
    if (!hasQuotePath) return false;
    return true;
  }).sort((left, right) => {
    const leftDate = omQuoteValidUntil(left) || "9999-12-31";
    const rightDate = omQuoteValidUntil(right) || "9999-12-31";
    return leftDate.localeCompare(rightDate) || `${left.project} ${left.name}`.localeCompare(`${right.project} ${right.name}`);
  });
}

function omQuoteExpiryStatusLabel(row) {
  if (!omQuoteValidUntil(row)) return "Missing Valid Until";
  const status = omQuoteValidity(row);
  if (status === "Quote Expired") return "Expired / Requote Required";
  if (status === "Quote Expiring Soon") return "Expiring Soon";
  if (status === "Quote Valid") return "Valid";
  return status === "Quote Pending" ? "Missing Valid Until" : status;
}

function omQuoteExpiryDaysLeft(row) {
  const validUntil = omQuoteValidUntil(row);
  if (!validUntil) return null;
  return daysUntil(validUntil);
}

function omQuoteExpiryFilterState() {
  return {
    project: document.getElementById("omQuoteExpiryProjectFilter")?.value || "",
    status: document.getElementById("omQuoteExpiryStatusFilter")?.value || "",
    assignee: document.getElementById("omQuoteExpiryAssigneeFilter")?.value || "",
  };
}

function omQuoteExpiryMatchesFilters(row, filters) {
  if (filters.project && row.project !== filters.project) return false;
  const assignment = omAssignmentForRow(row);
  if (filters.assignee === "unassigned" && assignment.assignedToUserId) return false;
  if (filters.assignee && filters.assignee !== "unassigned" && assignment.assignedToUserId !== filters.assignee) return false;
  if (filters.status) {
    const label = omQuoteExpiryStatusLabel(row);
    if (filters.status === "expiring" && label !== "Expiring Soon") return false;
    if (filters.status === "expired" && label !== "Expired / Requote Required") return false;
    if (filters.status === "missing" && label !== "Missing Valid Until") return false;
    if (filters.status === "valid" && label !== "Valid") return false;
  }
  return true;
}

function omQuoteExpiryAction(row) {
  const status = omQuoteExpiryStatusLabel(row);
  if (!omQuoteValidUntil(row)) return "Fill Quote Valid Until in PAS Quote Result.";
  if (status === "Expired / Requote Required") return "Requote required before next purchasing step.";
  if (status === "Expiring Soon") return "Follow PAS / supplier before quote expires.";
  return "No immediate expiry action.";
}

function renderOmQuoteExpiry() {
  const target = document.getElementById("omQuoteExpiryRows");
  if (!target) return;
  const filters = omQuoteExpiryFilterState();
  const rows = omQuoteExpiryRows().filter((row) => omQuoteExpiryMatchesFilters(row, filters));
  const rowCount = document.getElementById("omQuoteExpiryCount");
  if (rowCount) rowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  const hint = document.getElementById("omQuoteExpiryHint");
  if (hint) hint.textContent = `Tracking only. Edit Quote Valid Until from PAS Quote Result. Expiring Soon means <= ${QUOTE_EXPIRING_SOON_DAYS} days.`;
  const summary = document.getElementById("omQuoteExpirySummary");
  if (summary) {
    const allRows = omQuoteExpiryRows();
    summary.innerHTML = summaryCardsHtml([
      { label: "Quote Rows", value: rows.length, helper: filters.project || "All projects", variant: "hero" },
      ["Expiring Soon", allRows.filter((row) => omQuoteExpiryStatusLabel(row) === "Expiring Soon").length],
      ["Expired", allRows.filter((row) => omQuoteExpiryStatusLabel(row) === "Expired / Requote Required").length],
      ["Missing Valid Until", allRows.filter((row) => omQuoteExpiryStatusLabel(row) === "Missing Valid Until").length],
    ]);
  }
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const days = omQuoteExpiryDaysLeft(row);
      const status = omQuoteExpiryStatusLabel(row);
      return `
        <tr>
          <td>${row.project || "-"}</td>
          <td>${omItemCell(row, { stageLabel: "Quote expiry" })}</td>
          <td>${row.pasDemandNo || "-"}</td>
          <td>${row.pasMaterialNo || "-"}</td>
          <td>${row.quoteDate || "-"}</td>
          <td>${omQuoteValidUntil(row) || "-"}</td>
          <td class="cell-number">${days === null ? "-" : `${days}d`}</td>
          <td><span class="status-pill ${statusClass(status)}">${status}</span></td>
          <td>${omAssigneeName(row) || "Unassigned"}</td>
          <td><div class="reason-text">${omQuoteExpiryAction(row)}</div></td>
          <td class="cell-action">${itemDetailButton("request", row.id)}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="11" class="empty-cell">No quote expiry rows match the current filters.</td></tr>`;
}

function renderOmFinalExport() {
  const rows = omFinalExportRows();
  const target = document.getElementById("omFinalExportRows");
  if (!target) return;
  const rowCount = document.getElementById("omFinalExportCount");
  if (rowCount) rowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  const summary = document.getElementById("omFinalExportSummary");
  if (summary) {
    summary.innerHTML = summaryCardsHtml([
      { label: "Confirmed Rows", value: rows.length, helper: `${omFinalExportProjectFilterValue() || "All projects"} · Export Package`, variant: "hero" },
      ["Expense / ECS", rows.filter((row) => omFinalExportCostType(row) === OM_COST_TYPE_EXPENSE).length],
      ["Capex / CFA", rows.filter((row) => omFinalExportCostType(row) === OM_COST_TYPE_CAPEX).length],
      ["Exported", rows.filter(isOmFinalExported).length],
    ]);
  }
  const exportHint = document.getElementById("omFinalExportHint");
  if (exportHint) {
    exportHint.textContent = "Choose Expense or Capex, then use one Export Package action to prepare Excel and quote screenshot package.";
  }
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${currentPhaseLabelForProject(row.project)}</td>
        <td>${omItemCell(row, { stageLabel: "Export package" })}</td>
        <td>${totalQty(row)}</td>
        <td>${omAssignmentCell(row)}</td>
        <td><span class="status-pill ${statusClass(omFinalExportPackageCode(row))}">${omFinalExportPackageCode(row)}</span><div class="reason-text">Payment: ${OM_PAYMENT_METHOD}</div></td>
        <td>${omPasBundleHtml(row, { editableDemandNo: false, editableMaterialNo: false })}</td>
        <td>${quoteAttachmentListHtml(row)}</td>
        <td><span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span></td>
        <td class="om-export-target-cell"><span class="status-pill ${statusClass(omCostTypeTargetLabel(row))}">${omCostTypeTargetLabel(row)}</span><div class="reason-text">Expense → ECS / Capex → CFA</div></td>
        <td class="om-export-status-cell"><span class="status-pill ${statusClass(omFinalExportStatusLabel(row))}">${omFinalExportStatusLabel(row)}</span><div class="reason-text">${row.finalExportedAt ? `Exported ${new Date(row.finalExportedAt).toLocaleString("en-US")}` : isOmFinalExportPrepared(row) ? "Ready to mark exported" : "Waiting export target"}</div></td>
        <td>${row.finalExportedAt ? new Date(row.finalExportedAt).toLocaleDateString("en-US") : "-"}</td>
        <td class="cell-action om-export-actions-cell">
          <div class="row-action-stack">
            <button class="mini" type="button" title="Prepare Expense / ECS package" data-om-row-button="${row.id}" data-om-row-button-action="prepareExpense" ${omActionDisabledAttr(row, isOmFinalExported(row))}>Expense</button>
            <button class="mini" type="button" title="Prepare Capex / CFA package" data-om-row-button="${row.id}" data-om-row-button-action="prepareCapex" ${omActionDisabledAttr(row, isOmFinalExported(row))}>Capex</button>
            <button class="mini" type="button" title="Export Excel package and quote screenshot package" data-om-row-button="${row.id}" data-om-row-button-action="exportPackage" ${omActionDisabledAttr(row, !(isOmFinalExportPrepared(row) || isOmFinalExported(row)))}>Export</button>
            <button class="mini approve" type="button" title="Mark package exported" data-om-row-button="${row.id}" data-om-row-button-action="markExported" ${omActionDisabledAttr(row, !isOmFinalExportPrepared(row))}>Mark</button>
            <button class="mini danger" type="button" title="Reject to DRI" data-om-row-button="${row.id}" data-om-row-button-action="rejectToDri" ${omActionDisabledAttr(row, isOmFinalExported(row))}>Reject</button>
          </div>
        </td>
        <td class="cell-action"><button class="mini return" type="button" title="Contact DRI" data-contact-dri="${row.id}">Contact</button></td>
        <td class="cell-action">${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="15" class="empty-cell">No Requester confirmed rows are ready for export package.</td></tr>`;
}

function omAmendmentEditorHtml(row) {
  if (!row.amendmentOf || ![AMENDMENT_WAITING_OM, AMENDMENT_REWORK_REQUIRED].includes(row.amendmentStatus)) return "";
  return `
    <div class="om-amendment-editor">
      <div class="om-amendment-section">
        <div class="om-amendment-section-title">Revised Request</div>
        <div class="om-amendment-field-grid">
          <label>Revised Item<input type="text" value="${row.name || ""}" data-om-field="name" data-om-id="${row.id}" /></label>
          <label class="om-amendment-spec-field">Revised Spec<textarea rows="2" data-om-field="detail" data-om-id="${row.id}">${itemDetail(row)}</textarea></label>
        </div>
      </div>
      <div class="om-amendment-section">
        <div class="om-amendment-section-title">Phase Qty</div>
        <div class="om-amendment-qty-grid">
          ${STAGES.map((stage) => `
            <label>${STAGE_LABELS[stage]}<input type="number" min="0" step="1" value="${clampQty(row[stage])}" data-om-field="${stage}" data-om-id="${row.id}" /></label>
          `).join("")}
        </div>
      </div>
      <div class="om-amendment-section om-amendment-reference">
        <div class="om-amendment-section-title">Reference</div>
        <div class="reason-text">Before: ${snapshotPhaseText(row.previousSnapshot)}</div>
        ${row.amendmentReworkReason ? `<div class="reason-text">Requester rework note: ${row.amendmentReworkReason}</div>` : ""}
      </div>
    </div>`;
}

function renderOmQuoteConfirmRows(rows) {
  const target = document.getElementById("omWorkbenchRows");
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="17" class="empty-cell">No quote or user confirmation rows are available for this project package.</td></tr>`;
    return;
  }
  const waitingRows = rows.filter((row) => isOmWaitingUserConfirm(row) || row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM);
  const editingRows = rows.filter((row) => !waitingRows.includes(row));
  const sectionRow = (label, helper) => `
    <tr class="om-quote-section-row">
      <td colspan="17"><strong>${label}</strong><span>${helper}</span></td>
    </tr>`;
  const quoteRowHtml = (row) => {
      const amendmentAwaitingOm = row.amendmentStatus === AMENDMENT_WAITING_OM || row.amendmentStatus === AMENDMENT_REWORK_REQUIRED;
      const amendmentWaitingUser = row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM;
      const waitingUserConfirm = isOmWaitingUserConfirm(row) || amendmentWaitingUser;
      const status = omPasResultStatus(row);
      const warnings = omWarnings(row);
      const readyToSend = status === "Ready to Send Requester Confirmation";
      const quoteCompletionNeeded = status === "Quote Completion Needed";
      const stageLabel = amendmentAwaitingOm ? "OM amendment editing" : waitingUserConfirm ? "Waiting User A action" : "Quote editing";
      const userDecisionCell = amendmentWaitingUser
        ? `<span class="status-pill ${statusClass(AMENDMENT_WAITING_USER_CONFIRM)}">${requesterVisibleStatusLabel(AMENDMENT_WAITING_USER_CONFIRM)}</span><div class="reason-text">Visible to Requester for revised request confirmation.</div>`
        : waitingUserConfirm
          ? `<span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>${row.userAQuoteCancelReason ? `<div class="reason-text">${row.userAQuoteCancelReason}</div>` : `<div class="reason-text">Quoted amount is waiting for User A confirmation.</div>`}`
          : amendmentAwaitingOm
            ? `<span class="status-pill ${statusClass(row.amendmentStatus)}">${row.amendmentStatus}</span><div class="reason-text">${row.amendmentReason || "Update the request, then send the revised result back to Requester."}</div>`
        : `<span class="om-cell-helper">Not sent yet</span>`;
      const statusHelper = amendmentWaitingUser
        ? "Visible to Requester. Waiting for revised request confirmation."
        : waitingUserConfirm
        ? "Visible to Requester. Waiting for Confirm Need or Cancel Request."
        : amendmentAwaitingOm
          ? "Requester requested a change. Update item/spec/qty here, then send the revised result."
        : readyToSend
          ? "All required quote fields are ready. Use this row action to send."
          : status === "PAS Material No Missing"
            ? "Enter PAS Material No after PAS bidding result, then complete quote fields."
          : status === "Quote Excel Missing"
            ? "Upload the quote Excel file to complete the quote package."
            : status === "Quote Screenshot Missing"
              ? "Upload the quote screenshot image to complete the quote package."
        : quoteCompletionNeeded
            ? "Complete PAS Material No, vendor name, price, quote date, screenshot, and Excel."
            : "Quote data is partially filled. Complete the missing fields below.";
      const rowClasses = [
        waitingUserConfirm ? "om-row-waiting-confirm" : "",
        readyToSend ? "om-row-ready-confirm" : "",
        quoteCompletionNeeded ? "om-row-awaiting-pas" : "",
        amendmentAwaitingOm ? "om-row-amendment-work" : "",
      ].filter(Boolean).join(" ");
      const readOnly = waitingUserConfirm || !canOperateOmRow(row);
      const readOnlyReason = omQuoteResultReadOnlyReason(row, waitingUserConfirm);
      const quoteCurrency = omQuoteInputCurrency(row);
      const priceField = omQuotePriceFieldForCurrency(quoteCurrency);
      const priceValue = omQuotePriceInputValue(row, quoteCurrency);
      const validUntil = omQuoteValidUntil(row);
      return `
      <tr class="${rowClasses}">
        <td class="cell-code">${row.project}</td>
        <td class="cell-code">${currentPhaseLabelForProject(row.project)}</td>
        <td>${omQuoteResultItemCell(row, stageLabel)}${omAmendmentEditorHtml(row)}</td>
        <td class="cell-qty">${omCurrentPrQty(row)}</td>
        <td class="cell-code"><span title="${htmlAttr(row.pasDemandNo || "Waiting PAS Demand No")}">${row.pasDemandNo || "Waiting PAS Demand No"}</span></td>
        <td class="cell-code">${omQuoteResultInput(row, "pasMaterialNo", row.pasMaterialNo, { placeholder: "PAS Material No", readOnly })}</td>
        <td>${omQuoteResultInput(row, "vendor", row.vendor, { placeholder: "Vendor", readOnly })}</td>
        <td class="cell-code">${omQuoteResultInput(row, "vendorPartNo", row.vendorPartNo, { placeholder: "Vendor code", readOnly })}</td>
        <td class="cell-money">${omQuoteResultInput(row, priceField, priceValue, { type: "number", placeholder: quoteCurrency, readOnly, step: quoteCurrency === "USD" ? "0.01" : "1", min: "0" })}</td>
        <td class="cell-code">
          ${readOnly
            ? `<span class="om-quote-grid-readonly">${quoteCurrency}</span>`
            : `<select class="mini-select om-quote-currency-select" title="Unit price currency" data-om-price-currency="${row.id}">${omQuoteCurrencyOptions(quoteCurrency)}</select>`}
        </td>
        <td>${omQuoteResultInput(row, "quoteDate", row.quoteDate, { type: "date", readOnly })}</td>
        <td>${omQuoteResultInput(row, "quoteValidUntil", validUntil, { type: "date", readOnly })}</td>
        <td>${omQuoteResultFileCell(row, readOnly)}</td>
        <td>${omQuoteResultCompletionCell(row, amendmentAwaitingOm ? OM_QUOTE_REVIEW_REQUIRED : status, readOnlyReason)}</td>
        <td class="om-quote-assignee-cell">${omAssignmentCell(row)}</td>
        <td>
          <div class="row-action-stack om-quote-action-stack">
            <button class="mini" type="button" title="Save Quote Info" aria-label="Save Quote Info" data-om-row-button="${row.id}" data-om-row-button-action="saveQuoteInfo" ${omActionDisabledAttr(row, waitingUserConfirm)}>Save</button>
            <button class="mini approve" type="button" title="Send to User A" aria-label="Send to User A" data-om-row-button="${row.id}" data-om-row-button-action="sendToUserConfirm" ${omActionDisabledAttr(row, !(readyToSend && !waitingUserConfirm))}>Send</button>
            <button class="mini danger" type="button" title="Reject to DRI" aria-label="Reject to DRI" data-om-row-button="${row.id}" data-om-row-button-action="rejectToDri" ${omActionDisabledAttr(row)}>Reject</button>
          </div>
        </td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`;
  };
  target.innerHTML = [
    editingRows.length ? sectionRow("Quote Editing", "Input PAS quote / bidding result, quote validity, and attachments in the row.") : "",
    ...editingRows.map(quoteRowHtml),
    waitingRows.length ? sectionRow("Waiting User A Confirmation", "Rows already sent to User A stay here as read-only tracking.") : "",
    ...waitingRows.map(quoteRowHtml),
  ].join("");
}

function renderOmQuoteRows(rows) {
  const target = document.getElementById("omQuoteRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
        <td><input type="text" value="${row.vendor || ""}" placeholder="Vendor" data-om-field="vendor" data-om-id="${row.id}" /></td>
        <td><input type="number" min="0" step="1" value="${effectiveUnitPrice(row) || ""}" placeholder="Unit price" data-om-field="updatedPrice" data-om-id="${row.id}" /></td>
        <td><input type="date" value="${row.quoteDate || ""}" data-om-field="quoteDate" data-om-id="${row.id}" /></td>
        <td><input type="date" value="${row.quoteExpiry || ""}" data-om-field="quoteExpiry" data-om-id="${row.id}" /></td>
        <td>
          <label class="mini upload">
            Upload Screenshot
            <input type="file" accept="image/*,.jpg,.jpeg,.png" data-om-pdf="${row.id}" />
          </label>
          <div class="reason-text">${omQuoteScreenshotFile(row) || "No screenshot"}</div>
        </td>
        <td>
          <label class="check quote-exception-cell">
            <input type="checkbox" data-om-quote-exception="${row.id}" ${row.quoteException ? "checked" : ""} />
            ${row.quoteException ? `<span class="status-pill warning">${QUOTE_EXCEPTION_NOTE}</span>` : "Mark update"}
          </label>
        </td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="10" class="empty-cell">No received handoff rows are available for quote update.</td></tr>`;
}

function renderOmExternalRows(rows) {
  const target = document.getElementById("omExternalRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td><input type="checkbox" data-om-select="${row.id}" ${omSelections.has(row.id) || row.omSelected ? "checked" : ""} /></td>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${row.name}</td>
        <td>${handoffRoute(row)}</td>
        <td>
          <select data-om-field="externalSystemStatus" data-om-id="${row.id}">
            ${["Pending", OM_UPDATED, "Blocked"].map((status) => `<option value="${status}" ${status === (row.externalSystemStatus || "Pending") ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </td>
        <td><input type="text" value="${row.externalSystemRef || ""}" placeholder="External ref." data-om-field="externalSystemRef" data-om-id="${row.id}" /></td>
        <td>${row.excelExportedAt ? new Date(row.excelExportedAt).toLocaleString("en-US") : "Not exported"}</td>
        <td>${row.quotePdfExportedAt ? new Date(row.quotePdfExportedAt).toLocaleString("en-US") : omQuoteScreenshotFile(row) || "No screenshot"}</td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="10" class="empty-cell">No received handoff rows are available for external system update.</td></tr>`;
}

function exactActualBuyRecord(row, stage = currentStageForProject(row.project)) {
  return actualBuyRecords.find((actual) => actual.stage === stage && demandComparable(row, actual)) || null;
}

function renderActualBuyUpdate(rows) {
  const target = document.getElementById("actualBuyRows");
  if (!target) return;
  renderActualBuySummary(rows);
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const stage = currentStageForProject(row.project);
      const actual = exactActualBuyRecord(row, stage);
      return `
        <tr>
          <td><input type="checkbox" data-om-select="${row.id}" ${omSelections.has(row.id) || row.omSelected ? "checked" : ""} /></td>
          <td>${row.project}</td>
          <td>${stageLabel(stage)}</td>
          <td>${row.id}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
          <td><input type="text" value="${actual?.poNo || ""}" placeholder="PO No." data-actual-field="poNo" data-actual-id="${row.id}" /></td>
          <td>${clampQty(row[stage])}</td>
          <td><input type="number" min="0" step="1" value="${actual?.actualQty ?? ""}" placeholder="Actual buy" data-actual-field="actualQty" data-actual-id="${row.id}" /></td>
          <td><input type="date" value="${actual?.buyDate || ""}" data-actual-field="buyDate" data-actual-id="${row.id}" /></td>
          <td><input type="text" value="${actual?.vendor || row.vendor || ""}" placeholder="Vendor" data-actual-field="vendor" data-actual-id="${row.id}" /></td>
          <td><input type="number" min="0" step="1" value="${actual?.unitPrice || effectiveUnitPrice(row) || ""}" placeholder="Unit price" data-actual-field="unitPrice" data-actual-id="${row.id}" /></td>
          <td><input type="text" value="${actual?.externalRef || row.externalSystemRef || ""}" placeholder="External ref." data-actual-field="externalRef" data-actual-id="${row.id}" /></td>
          <td>${actual?.updateSource || "Manual entry"}</td>
          <td><span class="status-pill ${statusClass(actual?.status || "Pending Update")}">${actual?.status || "Pending Update"}</span></td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="15" class="empty-cell">No received handoff rows are available for actual buy update.</td></tr>`;
}

function renderActualBuySummary(rows) {
  const target = document.getElementById("actualBuySummary");
  if (!target) return;
  const cards = [
    ["Approved Qty", rows.reduce((sum, row) => sum + clampQty(row[currentStageForProject(row.project)]), 0)],
    ["Actual Buy", rows.reduce((sum, row) => sum + (exactActualBuyRecord(row)?.actualQty ?? 0), 0)],
    ["Pending Update", rows.filter((row) => !exactActualBuyRecord(row)).length],
    ["Completed", rows.filter((row) => exactActualBuyRecord(row)?.status === "Completed").length],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}

function upsertActualBuyField(requestId, field, value) {
  const request = requests.find((row) => row.id === requestId);
  if (!request) return;
  const stage = currentStageForProject(request.project);
  const existing = exactActualBuyRecord(request, stage);
  const normalized = ["actualQty", "unitPrice"].includes(field) ? clampQty(value) : value;
  if (existing) {
    actualBuyRecords = actualBuyRecords.map((row) => row.id === existing.id ? { ...row, [field]: normalized, updateSource: "Manual entry" } : row);
  } else {
    actualBuyRecords = [{
      id: `AB-${request.project}-${request.id}-${stage}`,
      project: request.project,
      stage,
      requestId: request.id,
      sourceRecordId: request.sourceRecordId,
      partNo: request.partNo,
      materialNo: materialNoFor(request),
      factoryMaterialNo: factoryMaterialNoFor(request),
      pasMaterialNo: request.pasMaterialNo || "",
      materialIdentityKey: materialIdentityKey(request),
      globalItemKey: globalItemKey(request),
      globalItemId: globalItemIdFor(request),
      name: request.name,
      poNo: field === "poNo" ? normalized : "",
      approvedQty: clampQty(request[stage]),
      actualQty: field === "actualQty" ? normalized : 0,
      buyDate: field === "buyDate" ? normalized : "",
      vendor: field === "vendor" ? normalized : request.vendor,
      unitPrice: field === "unitPrice" ? normalized : effectiveUnitPrice(request),
      externalRef: field === "externalRef" ? normalized : request.externalSystemRef,
      updateSource: "Manual entry",
      status: "Pending Update",
    }, ...actualBuyRecords];
  }
}

function importActualBuyExcel() {
  const rows = omRows();
  if (!rows.length) {
    showToast("No OM handoff rows are available for actual buy import.", "error");
    return;
  }
  rows.forEach((row, index) => {
    const stage = currentStageForProject(row.project);
    const importedQty = Math.max(0, clampQty(row[stage]) - (index % 3 === 0 ? 1 : 0));
    upsertActualBuyField(row.id, "actualQty", importedQty);
    upsertActualBuyField(row.id, "buyDate", `2026-05-${String(10 + index).padStart(2, "0")}`);
    upsertActualBuyField(row.id, "poNo", `IMP-${row.project}-${String(3000 + index)}`);
    upsertActualBuyField(row.id, "externalRef", `ERP-IMP-${String(7000 + index)}`);
    const actual = exactActualBuyRecord(row, stage);
    if (actual) actualBuyRecords = actualBuyRecords.map((item) => item.id === actual.id ? { ...item, updateSource: "Imported Excel", status: "Completed" } : item);
    addOmHistory(row, "Imported actual buy Excel", `Actual buy qty: ${importedQty}`);
  });
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Actual buy Excel imported.", "success");
}

function saveActualBuy() {
  omRows().forEach((row) => addOmHistory(row, "Saved actual buy", "Actual buy data saved from OM Purchasing."));
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Actual buy saved.", "success");
}

function markActualBuyCompleted() {
  const rows = selectedOmRows();
  if (!rows.length) {
    showToast("Select at least one OM row before marking actual buy completed.", "error");
    return;
  }
  rows.forEach((row) => {
    const stage = currentStageForProject(row.project);
    upsertActualBuyField(row.id, "actualQty", exactActualBuyRecord(row, stage)?.actualQty ?? clampQty(row[stage]));
    const actual = exactActualBuyRecord(row, stage);
    if (actual) actualBuyRecords = actualBuyRecords.map((item) => item.id === actual.id ? { ...item, status: "Completed" } : item);
    addOmHistory(row, "Marked actual buy completed", `Stage: ${stageLabel(stage)}`);
  });
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Selected actual buy rows marked completed.", "success");
}

function renderBaselineSetup() {
  const target = document.getElementById("baselineRows");
  if (!target) return;
  renderBaselineSummary();
  const rows = demandBaselines.filter((row) => PROJECTS.includes(row.project));
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${stageLabel(row.stage)}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
        <td>${itemKeyDisplay(row)}</td>
        <td>${itemDetail(row)}</td>
        <td>${partName(row)}</td>
        <td><input type="number" min="0" step="1" value="${row.baselineQty}" data-baseline-qty="${row.id}" /></td>
        <td>${row.sourceFile}</td>
        <td>${row.updatedBy}</td>
        <td>${new Date(row.updatedAt).toLocaleString("en-US")}</td>
        <td>${itemDetailButton("record", row.sourceRecordId)}</td>
      </tr>`).join("")
    : `<tr><td colspan="11" class="empty-cell">No demand baseline records are available.</td></tr>`;
}

function renderBaselineSummary() {
  const target = document.getElementById("baselineSummary");
  if (!target) return;
  const cards = [
    ["Baseline Rows", demandBaselines.length],
    ["Planned Demand", demandBaselines.reduce((sum, row) => sum + clampQty(row.baselineQty), 0)],
    ["Material Master Records", demandBaselines.filter((row) => materialMasterRecordFor(row)).length],
    ["Source", "Google Worksheet"],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}

function importBaselineExcel() {
  demandBaselines = demandBaselines.map((row, index) => ({
    ...row,
    baselineQty: clampQty(row.baselineQty) + (index % 5 === 0 ? 1 : 0),
    sourceFile: "Imported baseline worksheet",
    updatedBy: roleProfiles[currentRole]?.name || "OM Purchasing",
    updatedAt: new Date().toISOString(),
  }));
  addOmHistory({ id: "BASELINE", project: "All", name: "Demand Baseline" }, "Imported baseline Excel", "Baseline demand imported from worksheet simulation.");
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Demand baseline Excel imported.", "success");
}

function saveBaseline() {
  addOmHistory({ id: "BASELINE", project: "All", name: "Demand Baseline" }, "Saved baseline", "Demand baseline setup saved.");
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Demand baseline saved.", "success");
}

function validateBaselineMaterialPlan() {
  showToast("Plan rows checked against current Material Master records.", "success");
}

function renderOmHistory() {
  const target = document.getElementById("omHistoryRows");
  if (!target) return;
  const projectFilter = omHistoryProjectFilterValue();
  const rows = omHistory.filter((row) => !projectFilter || row.project === projectFilter);
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.requestId}</td>
        <td>${row.project}</td>
        <td>${row.item}</td>
        <td>${row.action}</td>
        <td>${row.actor}</td>
        <td>${row.note || "-"}</td>
        <td>${new Date(row.timestamp).toLocaleString("en-US")}</td>
      </tr>`).join("")
    : `<tr><td colspan="7" class="empty-cell">No OM Purchasing actions recorded for this project yet.</td></tr>`;
}

function updateOmField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  if (before && !ensureOmRowAccess(before, `update ${field}`)) {
    renderOmPurchasing();
    return;
  }
  const targetField = field === "updatedPriceVnd" ? "updatedPrice" : field;
  const normalizedValue = field === "updatedPriceVnd"
    ? clampQty(value) / currentUsdToVndRate()
    : field === "updatedPrice" || STAGES.includes(targetField)
      ? clampQty(value)
      : value;
  if (!before || before[targetField] === normalizedValue) return;
  const timestampPatch = {};
  if (targetField === "pasDemandNo") {
    timestampPatch.pasDemandNoUpdatedAt = new Date().toISOString();
    timestampPatch.pasDemandNoRecordedAt = timestampPatch.pasDemandNoUpdatedAt;
  }
  if (targetField === "pasMaterialNo") timestampPatch.pasMaterialNoUpdatedAt = new Date().toISOString();
  if (targetField === "quoteDate") {
    timestampPatch.quoteReceivedAt = normalizedValue;
    timestampPatch.quoteReceivedAtUpdatedAt = new Date().toISOString();
  }
  if (field === "updatedPriceVnd") {
    timestampPatch.updatedPriceUsd = normalizedValue;
    timestampPatch.updatedPriceVnd = clampQty(value);
  } else if (targetField === "updatedPrice") {
    timestampPatch.updatedPriceUsd = normalizedValue;
    timestampPatch.updatedPriceVnd = Math.round(amountVndFromUsd(normalizedValue));
  }
  if (targetField === "quoteReceivedAt") timestampPatch.quoteReceivedAtUpdatedAt = new Date().toISOString();
  if (targetField === "quoteValidUntil") {
    timestampPatch.quoteValidUntilUpdatedAt = new Date().toISOString();
    timestampPatch.quoteExpiry = normalizedValue;
    timestampPatch.quoteStatus = omQuoteValidity({ ...before, quoteValidUntil: normalizedValue, quoteExpiry: normalizedValue });
  }
  if (["pasPartName", "pasBrand", "pasSpec"].includes(targetField)) timestampPatch.pasItemInfoUpdatedAt = new Date().toISOString();
  requests = requests.map((row) => row.id === requestId ? { ...row, [targetField]: normalizedValue, ...timestampPatch } : row);
  const after = requests.find((row) => row.id === requestId);
  const note = field === "updatedPriceVnd"
    ? `Unit price updated to ${Number(value || 0).toLocaleString("en-US")} VND.`
    : targetField === "updatedPrice"
      ? `Unit price updated to ${money(after.updatedPrice)}.`
      : STAGES.includes(targetField)
        ? `${STAGE_LABELS[targetField]} quantity updated to ${clampQty(value)}.`
        : `${targetField} updated to ${value || "blank"}.`;
  const action = targetField === "pasDemandNo"
    ? "PAS Demand No recorded"
    : targetField === "pasMaterialNo"
      ? "PAS Material No recorded"
    : targetField === "quoteValidUntil"
      ? "Quote validity recorded"
    : targetField === "quoteReceivedAt"
      ? "Bidding result received"
    : ["pasPartName", "pasBrand", "pasSpec"].includes(targetField)
      ? "PAS item info updated"
      : ["name", "detail", ...STAGES].includes(targetField)
        ? "OM amendment updated"
      : targetField === "externalSystemStatus" ? "Updated external system status" : "Updated quote data";
  addOmHistory(after, action, note);
  renderOmPurchasing();
  renderDepartment();
  renderManager();
  renderManagerCostView();
}

function toggleOmQuoteException(requestId, checked) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || Boolean(row.quoteException) === checked) return;
  requests = requests.map((item) => item.id === requestId ? { ...item, quoteException: checked } : item);
  const updated = requests.find((item) => item.id === requestId);
  addOmHistory(updated, checked ? "Marked update required" : "Cleared update required", checked ? QUOTE_EXCEPTION_NOTE : "Quote exception cleared.");
  renderOmPurchasing();
  renderProcurement();
  showToast(checked ? "Quote exception marked." : "Quote exception cleared.", "success");
}

function selectedOmPasRequestRows() {
  return omPasRequestRows().filter((row) => omSelections.has(row.id) || row.omSelected);
}

function selectedOmPasResultRows() {
  return omPasResultRows().filter((row) => omSelections.has(row.id) || row.omSelected);
}

function selectedOmFinalExportRows() {
  return omFinalExportRows().filter((row) => omSelections.has(row.id) || row.omSelected);
}

function selectedOmRows() {
  return selectedOmPasResultRows();
}

function selectedOmWorkflowRows() {
  const seen = new Set();
  return [...omPasRequestRows(), ...omPasResultRows(), ...omUserConfirmRows(), ...omFinalExportRows()].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return omSelections.has(row.id) || row.omSelected;
  });
}

function rejectOmSelectedToDri() {
  rejectOmRowsToDri(selectedOmWorkflowRows());
}

function rejectOmRowsToDri(rows) {
  if (!rows.length) {
    showToast("No OM row is available to reject to DRI.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "reject to DRI"))) return;
  openOmExternalResultModal(rows, EXT_REJECTED_DRI, "om");
}

function askUserAAmendSelected() {
  showToast("Amendment requests now start from Requester after quote. Use the Requester Request Change action instead.", "info");
}

function selectedOmProjectPackage(rows) {
  return [...new Set(rows.map((row) => row.project))];
}

function saveOmQuoteInfoRows(rows, { requireComplete = false } = {}) {
  if (!rows.every((row) => ensureOmRowAccess(row, "save quote info"))) return;
  const incompleteRows = rows
    .map((row) => ({ row, missing: omQuoteMissingFields(row) }))
    .filter((item) => item.missing.length);
  if (requireComplete && incompleteRows.length) {
    showToast(`Complete required quote fields: ${incompleteRows[0].missing.join(", ")}.`, "error");
    return false;
  }
  const now = new Date().toISOString();
  const rowIds = new Set(rows.map((row) => row.id));
  requests = requests.map((row) => {
    if (!rowIds.has(row.id)) return row;
    if (!omReadyForBuyer(row) || row.amendmentOf) {
      return {
        ...row,
        quoteReadyAt: omReadyForBuyer(row) ? row.quoteReadyAt || now : row.quoteReadyAt,
        quoteCompletionReadyAt: omReadyForBuyer(row) ? row.quoteCompletionReadyAt || now : row.quoteCompletionReadyAt,
      };
    }
    const shouldDeferRouting = !isTemporaryBudgetRequest(row);
    return {
      ...row,
      ...priceDecisionPatch(row, now, { deferRouting: shouldDeferRouting }),
    };
  });
  rows.forEach((row) => {
    const latest = requests.find((item) => item.id === row.id) || row;
    addOmHistory(latest, "Saved quote info", `Vendor: ${latest.vendor || "blank"} / Unit price: ${effectiveUnitPrice(latest) || "blank"} / Quote valid until: ${omQuoteValidUntil(latest) || "blank"}`);
    if (latest.priceDecisionStatus === PRICE_AUTO_CLEARED) {
      addOmHistory(latest, "Auto cleared by threshold", latest.priceDecisionReason || "Quote is within threshold.");
      addHandoffHistory(latest, "Auto cleared by threshold", latest.priceDecisionReason || "Requester confirmation not required.");
    }
    if (latest.priceDecisionStatus === PRICE_ESCALATION_REQUIRED) {
      addOmHistory(latest, "Price escalation required", latest.priceDecisionReason || "DRI review required.");
      addHandoffHistory(latest, "Price escalation required", latest.priceDecisionReason || "Dept DRI review required; Temporary Budget continues to Budget Approver.");
    }
    addHandoffHistory(latest, "Quote compared with history", `History ${money(latest.historyUnitPrice || 0)} / Quote ${money(latest.quoteUnitPrice || 0)} / Delta ${Number(latest.priceDeltaUsd || 0).toFixed(2)} USD / Threshold ${Number(latest.priceThresholdUsd || 0.4).toFixed(2)} USD`);
    addHandoffHistory(latest, "Quote compared with requester estimate", `Estimate ${money(latest.estimateUnitPriceSnapshotUsd || 0)} / Quote ${money(latest.quoteUnitPriceSnapshotUsd || 0)} / Delta ${Number(latest.estimateDeltaUsd || 0).toFixed(2)} USD / ${latest.estimateVarianceStatus || "Within Estimate Range"}`);
  });
  return true;
}

function saveOmQuoteInfo() {
  const rows = selectedOmPasResultRows().length ? selectedOmPasResultRows() : omPasResultRows();
  if (!rows.length) {
    showToast("No PAS result rows are available to save.", "error");
    return;
  }
  if (!saveOmQuoteInfoRows(rows, { requireComplete: true })) return;
  renderOmPurchasing();
  showToast("PAS quote info saved.", "success");
}

function movePasRowsToQuoteCompletion(rows) {
  if (!rows.length) {
    showToast("Select at least one PAS result row before moving to Quote Completion.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "move to PAS Quote Result"))) return;
  const missingDemandNo = rows.filter((row) => !row.pasDemandNo);
  if (missingDemandNo.length) {
    showToast("Enter PAS Demand No before moving to Quote Completion.", "error");
    return;
  }
  const now = new Date().toISOString();
  requests = requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      omSelected: false,
      pasStatus: PAS_APPROVED,
      pasLegalName: pasLegalName(row),
      pasRequestDept: pasRequestDept(row),
      pasDataTransferTo: pasDataTransferTo(row),
      pasDemandDate: row.pasDemandDate || todayDateString(new Date(now)),
      pasPartName: pasPartName(row),
      pasBrand: pasBrand(row),
      pasSpec: pasSpec(row),
      pasDemandNoUpdatedAt: row.pasDemandNoUpdatedAt || now,
      pasDemandNoRecordedAt: row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt || now,
      pasResultReceivedAt: row.pasResultReceivedAt || now,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      sentToOmAt: row.sentToOmAt || now,
      omCollectionStatus: OM_COLLECTION_QUOTATION,
      finalSpecStatus: row.finalSpecStatus || omFinalSpecStatus(row),
      omStage: "pasResult",
    };
  });
  rows.forEach((row) => {
    addOmHistory(row, "PAS Demand No recorded", row.pasDemandNo || "PAS Demand No recorded.");
    addOmHistory(row, "PAS result received", `${row.project} ${omItemBucket(row)} received PAS Demand No and moved to Quote Completion.`);
    addHandoffHistory(row, "PAS result received", `${row.project} ${omItemBucket(row)} received PAS Demand No and moved to Quote Completion.`);
  });
  omSelections.clear();
  renderOmPurchasing();
  showToast(`${rows.length} row${rows.length === 1 ? "" : "s"} moved to Quote Completion.`, "success");
}

function markPasRequestSent() {
  movePasRowsToQuoteCompletion(selectedOmPasRequestRows());
}

function sendOmPasRowsToUserConfirm(rows) {
  if (!rows.length) {
    showToast("No quote row is available to send to User A confirmation.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "send to User A"))) return;
  const incomplete = rows
    .map((row) => ({ row, missing: omQuoteMissingFields(row) }))
    .filter((item) => item.missing.length);
  if (incomplete.length) {
    showToast(`Complete required quote fields before Send to User A: ${incomplete[0].missing.join(", ")}.`, "error");
    return;
  }
  const now = new Date().toISOString();
  const standardRows = rows.filter((row) => !row.amendmentOf && !isTemporaryBudgetRequest(row));
  if (standardRows.length && !saveOmQuoteInfoRows(standardRows, { requireComplete: true })) return;
  requests = requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    const isAmendment = Boolean(row.amendmentOf);
    if (!isAmendment && isTemporaryBudgetRequest(row)) return row;
    return {
      ...row,
      omSelected: false,
      omStage: "userConfirm",
      omStatus: isAmendment ? OM_QUOTE_REVIEW_REQUIRED : OM_WAITING_USER_CONFIRM,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
      sentToUserAAt: isAmendment ? row.sentToUserAAt : now,
      userAQuoteDecisionStatus: isAmendment ? "" : OM_WAITING_USER_CONFIRM,
      userAQuoteDecisionAt: isAmendment ? row.userAQuoteDecisionAt : "",
      userAQuoteDecisionBy: isAmendment ? row.userAQuoteDecisionBy : "",
      userAQuoteCancelReason: isAmendment ? row.userAQuoteCancelReason : "",
      amendmentStatus: isAmendment ? AMENDMENT_WAITING_USER_CONFIRM : row.amendmentStatus,
    };
  });
  rows.forEach((row) => {
    if (!row.amendmentOf && isTemporaryBudgetRequest(row)) return;
    const action = row.amendmentOf ? "Sent to User A for revised confirmation" : "Sent to User A for confirmation";
    const note = row.amendmentOf
      ? "OM revised the request and sent the updated result to User A."
      : "PAS result is ready for User A quote confirmation.";
    addOmHistory(row, action, note);
    addHandoffHistory(row, action, note);
  });
  omSelections.clear();
  renderOmPurchasing();
  renderDepartment();
  showToast(`${rows.filter((row) => row.amendmentOf || !isTemporaryBudgetRequest(row)).length} row${rows.length === 1 ? "" : "s"} sent to User A confirmation.`, "success");
}

function sendOmPasResultToUserConfirm() {
  sendOmPasRowsToUserConfirm(selectedOmPasResultRows());
}

function openOmPasResultUpload() {
  const rows = selectedOmPasResultRows();
  if (!rows.length) {
    showToast("Select a PAS result row before uploading the PAS attachment.", "error");
    return;
  }
  const input = document.querySelector(`[data-om-pdf="${rows[0].id}"]`);
  if (!input) {
    showToast("PAS attachment upload is not available for the selected row.", "error");
    return;
  }
  if (rows.length > 1) {
    showToast("Opening PAS attachment upload for the first selected row.", "info");
  }
  input.click();
}

function confirmUserAOmQuote(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.userAQuoteDecisionStatus !== OM_WAITING_USER_CONFIRM) return;
  const now = new Date().toISOString();
  const routePatch = row.amendmentOf ? { omStage: "finalExport", omStatus: OM_USER_CONFIRMED } : postUserAQuoteConfirmationRoutePatch(row, now);
  requests = requests.map((item) => item.id === requestId ? {
    ...item,
    ...routePatch,
    userAQuoteDecisionStatus: OM_USER_CONFIRMED,
    userAQuoteDecisionAt: now,
    userAQuoteDecisionBy: roleProfiles[currentRole]?.name || "Requester",
    userAQuoteCancelReason: "",
  } : item);
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester confirmed need", "Quoted amount confirmed by Requester.");
  addHandoffHistory(after, "Requester confirmed need", "Quoted amount confirmed by Requester.");
  renderDepartment();
  renderOmPurchasing();
  showToast(after.omStage === "priceReview" ? "OM quote confirmed. Row moved to price review." : "OM quote confirmed. Row moved to Export Package.", "success");
}

function cancelUserAOmQuote(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.userAQuoteDecisionStatus !== OM_WAITING_USER_CONFIRM) return;
  const reason = window.prompt("Cancel reason is required before stopping this OM buy request.");
  if (!reason || !reason.trim()) {
    showToast("Cancel Request requires a reason.", "error");
    return;
  }
  requests = requests.map((item) => item.id === requestId ? {
    ...item,
    status: USER_CANCELLED_REQUEST,
    omStatus: USER_CANCELLED_REQUEST,
    userAQuoteDecisionStatus: USER_CANCELLED_REQUEST,
    userAQuoteDecisionAt: new Date().toISOString(),
    userAQuoteDecisionBy: roleProfiles[currentRole]?.name || "Requester",
    userAQuoteCancelReason: reason.trim(),
    finalExportTarget: "",
    finalExportStatus: "",
    finalExportedAt: "",
    buyerStatus: "",
  } : item);
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester cancelled request", reason.trim());
  addHandoffHistory(after, "Requester cancelled request", reason.trim());
  renderDepartment();
  renderOmPurchasing();
  showToast("OM buy request cancelled by Requester.", "success");
}

function createUserAAmendmentDraft(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) {
    showToast("This request cannot be updated at the current stage.", "error");
    return;
  }
  if (row.amendmentOf && isUserAAmendmentReviewRow(row)) {
    setDeptTab("needConfirmation");
    renderDepartment();
    showToast("This revised request is ready in Action Required.", "info");
    return;
  }
  const source = row.amendmentOf ? requests.find((item) => item.id === row.amendmentOf) : row;
  if (!source || !canUserAAmend(source)) {
    showToast("Only quoted OM rows that are not exported can request changes.", "error");
    return;
  }
  const reason = window.prompt("Please describe what should be changed in item, spec, or quantity.");
  if (!reason || !reason.trim()) {
    showToast("Request Change requires a reason.", "error");
    return;
  }
  const now = new Date().toISOString();
  const workingId = `DRAFT-AMEND-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const quote = quoteReference(source) || source.previousQuoteReference;
  const snapshot = requestSnapshot(source);
  const nextVersion = amendmentVersion(source) + 1;
  const amendmentDraft = {
    ...source,
    id: workingId,
    selected: false,
    status: "Draft",
    managerReason: "",
    submittedAt: "",
    decidedAt: "",
    amendmentOf: source.id,
    amendmentVersion: nextVersion,
    amendmentStatus: AMENDMENT_WAITING_OM,
    amendmentReason: reason.trim(),
    amendmentRequestedBy: roleProfiles[currentRole]?.name || "Requester",
    amendmentRequestedAt: now,
    amendedBy: "",
    amendedAt: "",
    amendmentSubmittedAt: "",
    amendmentApprovedBy: "",
    amendmentApprovedAt: "",
    amendmentUserConfirmedBy: "",
    amendmentUserConfirmedAt: "",
    amendmentUserRejectedBy: "",
    amendmentUserRejectedAt: "",
    amendmentReworkReason: "",
    previousSnapshot: snapshot,
    previousQuoteReference: quote,
    supersededBy: "",
    omStage: "pasResult",
    omStatus: OM_QUOTE_REVIEW_REQUIRED,
    omSelected: false,
    userAQuoteDecisionStatus: "",
    userAQuoteDecisionAt: "",
    userAQuoteDecisionBy: "",
    userAQuoteCancelReason: "",
    finalExportTarget: "",
    finalExportPreparedAt: "",
    finalExportedAt: "",
    finalExportPackageCode: "",
    finalExportStatus: isOmFinalExportPrepared(source) ? OM_EXPORT_INVALIDATED : "",
    buyerStatus: "",
    buyerReceivedAt: "",
    procurementStatus: HANDOFF_SENT_TO_OM,
  };
  requests = [
    amendmentDraft,
    ...requests.map((item) => item.id === source.id ? {
      ...item,
      amendmentStatus: AMENDMENT_IN_PROGRESS,
      amendmentReason: reason.trim(),
      amendmentRequestedBy: roleProfiles[currentRole]?.name || "Requester",
      amendmentRequestedAt: now,
      previousSnapshot: snapshot,
      previousQuoteReference: quote,
      omSelected: false,
      finalExportStatus: isOmFinalExportPrepared(item) ? OM_EXPORT_INVALIDATED : item.finalExportStatus,
    } : item),
  ];
  addHandoffHistory(source, "Requester requested change", reason.trim());
  addOmHistory(source, "Requester requested change", reason.trim());
  renderDepartment();
  renderOmPurchasing();
  showToast(`Request Change sent to OM Purchasing as Amendment v${nextVersion}.`, "success");
}

function confirmUserAAmendment(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.amendmentStatus !== AMENDMENT_WAITING_USER_CONFIRM) return;
  const now = new Date().toISOString();
  requests = requests.map((item) => {
    if (item.id === requestId) {
      return {
        ...item,
        status: "Submitted",
        submittedAt: now,
        submittedBy: roleProfiles[currentRole]?.name || "Requester",
        managerReason: "",
        amendmentStatus: AMENDMENT_SUBMITTED,
        amendmentSubmittedAt: now,
        amendmentUserConfirmedBy: roleProfiles[currentRole]?.name || "Requester",
        amendmentUserConfirmedAt: now,
        userAQuoteDecisionAt: now,
        userAQuoteDecisionBy: roleProfiles[currentRole]?.name || "Requester",
      };
    }
    if (item.id === row.amendmentOf) {
      return {
        ...item,
        amendmentStatus: AMENDMENT_SUBMITTED,
        supersededBy: requestId,
      };
    }
    return item;
  });
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester confirmed revised request", row.amendmentReason || "Revised request confirmed by Requester.");
  addHandoffHistory(after, "Resubmitted to Dept DRI", row.amendmentReason || "Revised request confirmed by Requester.");
  renderDepartment();
  renderManager();
  renderOmPurchasing();
  showToast("Revised request confirmed and resubmitted to Dept DRI.", "success");
}

function rejectUserAAmendment(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.amendmentStatus !== AMENDMENT_WAITING_USER_CONFIRM) return;
  const reason = window.prompt("Please enter the reason for rejecting OM's revised request.");
  if (!reason || !reason.trim()) {
    showToast("Reject Amendment requires a reason.", "error");
    return;
  }
  const now = new Date().toISOString();
  requests = requests.map((item) => {
    if (item.id === requestId) {
      return {
        ...item,
        amendmentStatus: AMENDMENT_REWORK_REQUIRED,
        amendmentReworkReason: reason.trim(),
        amendmentUserRejectedBy: roleProfiles[currentRole]?.name || "Requester",
        amendmentUserRejectedAt: now,
        omStage: "pasResult",
        omStatus: OM_QUOTE_REVIEW_REQUIRED,
      };
    }
    return item;
  });
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester rejected amendment", reason.trim());
  addHandoffHistory(after, "Requester rejected amendment", reason.trim());
  renderDepartment();
  renderOmPurchasing();
  showToast("Amendment returned to OM Purchasing for rework.", "success");
}

function updateFinalExportTarget(rows, target) {
  if (!rows.length) {
    showToast(`Select at least one confirmed row before preparing ${target}.`, "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, `prepare ${target}`))) return;
  const invalidRows = rows.filter((row) => !isOmExportAuthorized(row) && !isOmFinalExportPrepared(row));
  if (invalidRows.length) {
    showToast("Only Requester confirmed or price-cleared rows can be prepared for CFA or ECS.", "error");
    return;
  }
  const scopeError = validateOmFinalExportPackageScope(rows);
  if (scopeError) {
    showToast(scopeError, "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const now = new Date();
  const packageCode = generateOmFinalExportPackageCode(rows, now);
  const nextStatus = target === "CFA" ? OM_READY_FOR_CFA : OM_READY_FOR_ECS;
  const costType = omCostTypeForTarget(target);
  requests = requests.map((row) => rows.some((selected) => selected.id === row.id) ? {
    ...row,
    omSelected: false,
    omStage: "finalExport",
    omStatus: OM_PREPARING_EXPORT,
    paymentMethod: OM_PAYMENT_METHOD,
    finalExportCostType: costType,
    finalExportPackageCode: packageCode,
    finalExportPreparedAt: row.finalExportPreparedAt || now.toISOString(),
    finalExportTarget: target,
    finalExportStatus: nextStatus,
  } : row);
  rows.forEach((row) => {
    addOmHistory(row, `Marked for ${target}`, `${packageCode} prepared for ${target}.`);
    addHandoffHistory(row, `Marked for ${target}`, `${packageCode} prepared for ${target}.`);
  });
  omSelections.clear();
  renderOmPurchasing();
  showToast(`${packageCode} prepared for ${target}.`, "success");
}

function prepareOmFinalExport(target) {
  updateFinalExportTarget(selectedOmFinalExportRows(), target);
}

function prepareOmFinalExportCostType(costType, rows = selectedOmFinalExportRows()) {
  const target = omTargetForCostType(costType);
  if (!target) {
    showToast("Choose Expense or Capex before preparing the export package.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, `prepare ${costType}`))) return;
  updateFinalExportTarget(rows, target);
}

function markOmFinalExportRowsExported(rows) {
  if (!rows.length) {
    showToast("No prepared row is available to mark export complete.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "mark export complete"))) return;
  const unprepared = rows.filter((row) => ![OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus));
  if (unprepared.length) {
    showToast("Choose Expense or Capex before marking export completed.", "error");
    return;
  }
  const scopeError = validateOmFinalExportPackageScope(rows);
  if (scopeError) {
    showToast(scopeError, "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const packageCode = generateOmFinalExportPackageCode(rows);
  const now = new Date().toISOString();
  requests = requests.map((row) => {
    const selected = rows.find((item) => item.id === row.id);
    if (!selected) return row;
    const finalTarget = omFinalExportTargetForRow(selected);
    const finalStatus = finalTarget === "CFA" ? OM_EXPORTED_CFA : OM_EXPORTED_ECS;
    return {
      ...row,
      omSelected: false,
      omStage: "finalExport",
      omStatus: finalStatus,
      procurementStatus: HANDOFF_SENT_TO_BUYER,
      paymentMethod: OM_PAYMENT_METHOD,
      finalExportCostType: selected.finalExportCostType || omCostTypeForTarget(finalTarget),
      finalExportPackageCode: selected.finalExportPackageCode || packageCode,
      finalExportStatus: finalStatus,
      finalExportedAt: now,
      buyerStatus: row.buyerStatus || BUYER_RECEIVED,
      buyerReceivedAt: row.buyerReceivedAt || now,
    };
  });
  rows.forEach((row) => {
    const finalTarget = omFinalExportTargetForRow(row);
    addOmHistory(row, `Exported to ${finalTarget}`, `${row.finalExportPackageCode || packageCode} marked exported and handed to Buyer for PR creation.`);
    addHandoffHistory(row, `Exported to ${finalTarget}`, `${row.finalExportPackageCode || packageCode} marked exported and handed to Buyer for PR creation.`);
  });
  omSelections.clear();
  renderOmPurchasing();
  renderBuyer();
  renderDepartment();
  showToast("Selected final export rows were handed to Buyer.", "success");
}

function markOmFinalExported() {
  markOmFinalExportRowsExported(selectedOmFinalExportRows());
}

function priceReviewRequiresBudgetApprover(row) {
  return row?.priceDecisionStatus === PRICE_ESCALATION_REQUIRED
    || row?.priceApprovalStatus === PRICE_ESCALATION_PENDING_DRI
    || row?.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI
    || isTemporaryBudgetRequest(row);
}

function isDeptDriSubmissionPending(row) {
  return row?.deptDriReviewStatus === DEPT_DRI_SUBMISSION_PENDING;
}

function isCostManagerAuthorizationPending(row) {
  return row?.costManagerAuthorizationStatus === COST_MANAGER_AUTH_PENDING;
}

function isCostManagerAuthorizationRejected(row) {
  return row?.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED;
}

function isDeptDriSubmissionReworkRequired(row) {
  return Boolean(row?.deptDriReviewReworkRequired)
    && row.deptDriReviewStatus === DEPT_DRI_SUBMISSION_REJECTED
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}

function priceReviewPendingOwner(row) {
  if (isDeptDriSubmissionPending(row)) return "Dept DRI";
  if (isCostManagerAuthorizationPending(row)) return "Cost Manager";
  if (priceReviewRequiresBudgetApprover(row) && (row.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI || row.driApprovedAt)) {
    return "Budget Approver";
  }
  return "Dept DRI";
}

function priceReviewPendingRowsForRole() {
  return requests.filter((row) => {
    if (isDeptDriSubmissionPending(row) || isCostManagerAuthorizationPending(row)) return currentRole === "dri" && isDeptDriSubmissionPending(row);
    if (row.priceDecisionStatus !== PRICE_ESCALATION_REQUIRED) return false;
    if (row.priceApprovalStatus === PRICE_ESCALATION_REJECTED || row.projectDriApprovedAt) return false;
    if (currentRole === "dri") return !row.driApprovedAt;
    if (currentRole === "projectDri") return priceReviewRequiresBudgetApprover(row) && Boolean(row.driApprovedAt) && !row.projectDriApprovedAt;
    return false;
  }).sort((left, right) => {
    const dateDiff = new Date(needDateForRow(left) || "9999-12-31") - new Date(needDateForRow(right) || "9999-12-31");
    if (dateDiff) return dateDiff;
    return latestRequestActivityTime(right) - latestRequestActivityTime(left);
  });
}

function priceReviewHistoryRows() {
  return requests.filter((row) => row.deptDriReviewStatus || row.priceDecisionStatus || row.driApprovedAt || row.projectDriApprovedAt || row.priceEscalationRejectedAt)
    .sort((left, right) => latestRequestActivityTime(right) - latestRequestActivityTime(left));
}

function priceVarianceLabel(row) {
  if (row.priceDeltaUsd === null || row.priceDeltaUsd === undefined || Number.isNaN(Number(row.priceDeltaUsd))) return "-";
  return `${Number(row.priceDeltaUsd).toFixed(2)} USD / threshold ${Number(row.priceThresholdUsd || 0.4).toFixed(2)} USD`;
}

function renderPriceReview() {
  document.querySelectorAll("[data-price-review-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.priceReviewTab === currentPriceReviewTab));
  document.querySelectorAll("[data-price-review-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.priceReviewPanel === currentPriceReviewTab));
  const pending = priceReviewPendingRowsForRole();
  const count = document.getElementById("priceReviewPendingCount");
  if (count) count.textContent = `${pending.length} row${pending.length === 1 ? "" : "s"}`;
  const pendingBody = document.getElementById("priceReviewPendingRows");
  if (pendingBody) {
    pendingBody.innerHTML = pending.length ? pending.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td><div class="item-primary">${row.name}</div><div class="reason-text">${userVisibleItemDetail(row) || itemDetail(row) || "-"}</div></td>
        <td>${needDateForRow(row) || "-"}</td>
        <td><span class="status-pill">${isDeptDriSubmissionPending(row) ? "Submission Gate" : row.priceThresholdCategory || "Need Classification"}</span></td>
        <td>${isDeptDriSubmissionPending(row) ? "Not quoted yet" : row.historyUnitPrice ? money(row.historyUnitPrice) : "No history"}</td>
        <td>${isDeptDriSubmissionPending(row) ? "Pending OM quote" : row.quoteUnitPrice ? money(row.quoteUnitPrice) : "-"}</td>
        <td>${isDeptDriSubmissionPending(row) ? "Initial review" : priceVarianceLabel(row)}</td>
        <td><span class="status-pill ${statusClass(priceReviewPendingOwner(row))}">${priceReviewPendingOwner(row)}</span></td>
        <td>
          <div class="row-action-stack">
            <button class="mini approve" data-price-review-decision="${row.id}" data-price-review-action="approve">Approve</button>
            <button class="mini reject" data-price-review-decision="${row.id}" data-price-review-action="reject">Reject</button>
          </div>
        </td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("") : `<tr><td colspan="11" class="empty-cell">No price review rows are waiting for ${roleProfiles[currentRole]?.name || "this role"}.</td></tr>`;
  }
  const historyBody = document.getElementById("priceReviewHistoryRows");
  if (historyBody) {
    const rows = priceReviewHistoryRows();
    historyBody.innerHTML = rows.length ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td><div class="item-primary">${row.name}</div><div class="reason-text">${needDateForRow(row) ? `Need ${needDateForRow(row)}` : ""}</div></td>
        <td><span class="status-pill ${statusClass(row.priceApprovalStatus || row.priceDecisionStatus || row.deptDriReviewStatus)}">${row.priceApprovalStatus || row.priceDecisionStatus || row.deptDriReviewStatus || "-"}</span></td>
        <td>${row.driApprovedAt ? `${row.driApprovedBy || "Dept DRI"}<div class="reason-text">${compactDateTime(row.driApprovedAt)}</div>` : row.deptDriSubmissionApprovedAt ? `${row.deptDriSubmissionApprovedBy || "Dept DRI"}<div class="reason-text">${compactDateTime(row.deptDriSubmissionApprovedAt)}</div>` : "-"}</td>
        <td>${row.projectDriApprovedAt ? `${row.projectDriApprovedBy || "Budget Approver"}<div class="reason-text">${compactDateTime(row.projectDriApprovedAt)}</div>` : "-"}</td>
        <td>${row.priceEscalationRejectReason || row.deptDriReviewRejectReason || row.priceDecisionReason || "-"}</td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("") : `<tr><td colspan="8" class="empty-cell">No price review history yet.</td></tr>`;
  }
}

function applyPriceReviewDecision(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (currentRole === "admin") {
    showToast("Admin manages setup only and cannot approve business price reviews.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = roleProfiles[currentRole]?.name || "Price Reviewer";
  if (action === "reject") {
    const reason = prompt("Reject reason is required.");
    if (!reason) {
      showToast("Reject reason is required.", "error");
      return;
    }
    if (isDeptDriSubmissionPending(row)) {
      requests = requests.map((item) => item.id === requestId ? {
        ...item,
        status: "Rejected",
        deptDriReviewStatus: DEPT_DRI_SUBMISSION_REJECTED,
        deptDriReviewRejectedAt: now,
        deptDriReviewRejectedBy: actor,
        deptDriReviewRejectReason: reason,
        deptDriReviewReworkRequired: true,
        managerReason: reason,
        decidedAt: now,
      } : item);
      const latest = requests.find((item) => item.id === requestId);
      addHandoffHistory(latest, "Dept DRI submission rejected", reason);
      renderPriceReview();
      renderDepartment();
      renderManager();
      showToast("Dept DRI rejected the submission. Row returned to Requester Action Required.", "success");
      return;
    }
    requests = requests.map((item) => item.id === requestId ? {
      ...item,
      priceApprovalStatus: PRICE_ESCALATION_REJECTED,
      priceDecisionStatus: PRICE_ESCALATION_REJECTED,
      priceEscalationRejectedAt: now,
      priceEscalationRejectedBy: actor,
      priceEscalationRejectReason: reason,
      priceReviewReworkRequired: true,
      priceReviewReworkAt: now,
      priceReviewReworkBy: actor,
      priceReviewReworkReason: reason,
      omStatus: PRICE_ESCALATION_REJECTED,
      omStage: "priceReview",
    } : item);
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Price escalation rejected", reason);
    addOmHistory(latest, "Price escalation rejected", reason);
    renderPriceReview();
    renderOmPurchasing();
    renderDepartment();
    showToast("Price escalation rejected. Row returned to Requester Action Required.", "success");
    return;
  }
  if (currentRole === "dri") {
    if (isDeptDriSubmissionPending(row)) {
      requests = requests.map((item) => item.id === requestId ? syncRowPhaseQtyFromStationBreakdown({
        ...item,
        status: "Submitted",
        deptDriReviewStatus: DEPT_DRI_SUBMISSION_APPROVED,
        deptDriSubmissionApprovedAt: now,
        deptDriSubmissionApprovedBy: actor,
        deptDriReviewReworkRequired: false,
        costManagerAuthorizationStatus: COST_MANAGER_AUTH_PENDING,
        costManagerAuthorizationSubmittedAt: now,
        costManagerAuthorizationReworkRequired: false,
        nextStep: "Cost Manager final authorization",
        decidedAt: now,
      }) : item);
      const latest = requests.find((item) => item.id === requestId);
      addHandoffHistory(latest, "Dept DRI submission approved", "Waiting Cost Manager final authorization.");
      renderPriceReview();
      renderDepartment();
      renderManager();
      showToast("Dept DRI approved. Waiting Cost Manager authorization.", "success");
      return;
    }
    requests = requests.map((item) => item.id === requestId ? {
      ...item,
      driApprovedAt: now,
      driApprovedBy: actor,
      priceApprovalStatus: PRICE_ESCALATION_PENDING_PROJECT_DRI,
    } : item);
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Dept DRI approved", "Waiting Budget Approver approval.");
    addOmHistory(latest, "Dept DRI approved", "Waiting Budget Approver approval.");
    renderPriceReview();
    renderOmPurchasing();
    showToast("Dept DRI approval recorded. Waiting Budget Approver.", "success");
    return;
  }
  if (currentRole !== "projectDri") {
    showToast("Only Dept DRI or Budget Approver can approve this price review.", "error");
    return;
  }
  requests = requests.map((item) => item.id === requestId ? {
    ...item,
    projectDriApprovedAt: now,
    projectDriApprovedBy: actor,
    priceApprovalStatus: PRICE_ESCALATION_APPROVED,
    priceDecisionStatus: PRICE_ESCALATION_APPROVED,
    omStage: "finalExport",
    omStatus: PRICE_ESCALATION_APPROVED,
    userAQuoteDecisionStatus: USER_CONFIRMATION_NOT_REQUIRED,
    userAQuoteDecisionAt: now,
    userAQuoteDecisionBy: "Budget Approver approval",
  } : item);
  const latest = requests.find((item) => item.id === requestId);
  addHandoffHistory(latest, "Budget Approver approved", "Price escalation approved; row moved to Export Package.");
  addOmHistory(latest, "Budget Approver approved", "Price escalation approved; row moved to Export Package.");
  renderPriceReview();
  renderOmPurchasing();
  showToast("Budget Approver approved. Row moved to Export Package.", "success");
}

function applyCostManagerAuthorization(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (currentRole !== "manager") {
    showToast("Only Cost Manager can authorize rows after Dept DRI approval.", "error");
    return;
  }
  if (!isCostManagerAuthorizationPending(row)) {
    showToast("This row is not waiting for Cost Manager authorization.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = roleProfiles[currentRole]?.name || "Cost Manager";
  if (action === "reject") {
    const reason = prompt("Reject reason is required.");
    if (!reason) {
      showToast("Reject reason is required.", "error");
      return;
    }
    requests = requests.map((item) => item.id === requestId ? {
      ...item,
      status: "Rejected",
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_REJECTED,
      costManagerRejectedAt: now,
      costManagerRejectedBy: actor,
      costManagerRejectReason: reason,
      costManagerAuthorizationReworkRequired: true,
      managerReason: reason,
      nextStep: "Requester revise / resubmit",
      decidedAt: now,
    } : item);
    const latest = requests.find((item) => item.id === requestId);
    addHandoffHistory(latest, "Cost Manager rejected", reason);
    renderManager();
    renderDepartment();
    renderPriceReview();
    showToast("Cost Manager rejected the row. It returned to Requester Action Required.", "success");
    return;
  }
  requests = requests.map((item) => item.id === requestId ? syncRowPhaseQtyFromStationBreakdown({
    ...item,
    status: "Approved",
    costManagerAuthorizationStatus: COST_MANAGER_AUTH_APPROVED,
    costManagerAuthorizedAt: now,
    costManagerAuthorizedBy: actor,
    costManagerAuthorizationReworkRequired: false,
    decidedAt: now,
    ...omLeaderIntakeRoutingPatch(item, now),
  }) : item);
  const latest = requests.find((item) => item.id === requestId);
  addHandoffHistory(latest, "Cost Manager authorized", "Row moved to OM Leader intake.");
  addOmHistory(latest, "Received after Cost Manager authorization", "OM Leader can assign PAS Demand No / quote work.");
  renderManager();
  renderOmPurchasing();
  renderDepartment();
  renderPriceReview();
  showToast("Cost Manager authorized. Row moved to OM Leader intake.", "success");
}

function roleOptionsHtml(selected) {
  const roles = [
    ["requester", "Requester"],
    ["manager", "Cost Manager"],
    ["omLeader", "OM Leader"],
    ["omMember", "OM Purchasing"],
    ["dri", "Dept DRI"],
    ["projectDri", "Budget Approver"],
    ["admin", "Admin"],
  ];
  return roles.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}

function renderAdminSetup() {
  const delta = document.getElementById("adminHistoryPriceDeltaThreshold");
  const chain = document.getElementById("adminApprovalChain");
  const updated = document.getElementById("adminSetupUpdatedAt");
  if (delta) delta.value = Number(adminApprovalSetup.thresholds.historyPriceDeltaUsd || 0.4).toFixed(2);
  if (chain) chain.value = adminApprovalSetup.approvalChain.join(" -> ");
  if (updated) updated.textContent = adminApprovalSetup.updatedAt ? `Updated ${compactDateTime(adminApprovalSetup.updatedAt)} by ${adminApprovalSetup.updatedBy}` : "Prototype state";
  renderAdminConsole();
  const userRows = document.getElementById("adminUserRows");
  if (userRows) {
    userRows.innerHTML = adminApprovalSetup.users.map((user) => `
      <tr data-admin-user="${user.id}">
        <td><input data-admin-user-field="name" data-admin-user-id="${user.id}" value="${user.name}" /></td>
        <td><input data-admin-user-field="email" data-admin-user-id="${user.id}" value="${user.email}" /></td>
        <td><input data-admin-user-field="department" data-admin-user-id="${user.id}" value="${user.department}" /></td>
        <td><select data-admin-user-field="role" data-admin-user-id="${user.id}">${roleOptionsHtml(user.role)}</select></td>
      </tr>`).join("");
  }
  const approverRows = document.getElementById("adminApproverRows");
  if (approverRows) {
    approverRows.innerHTML = adminApprovalSetup.approverMap.map((row) => `
      <tr>
        <td>${row.scope}</td>
        <td>${row.dri}</td>
        <td>${row.projectDri}</td>
      </tr>`).join("");
  }
}

function saveAdminApprovalSetup() {
  adminApprovalSetup = {
    ...adminApprovalSetup,
    thresholds: {
      historyPriceDeltaUsd: Number(document.getElementById("adminHistoryPriceDeltaThreshold")?.value || 0.4),
    },
    approvalChain: String(document.getElementById("adminApprovalChain")?.value || "Dept DRI -> Budget Approver").split("->").map((item) => item.trim()).filter(Boolean),
    updatedBy: roleProfiles[currentRole]?.name || "Admin",
    updatedAt: new Date().toISOString(),
  };
  renderAdminSetup();
  showToast("Access and approval setup saved.", "success");
}

function exportPasExcel() {
  const rows = selectedOmPasRequestRows();
  if (!rows.length) {
    showToast("PAS Excel export is no longer part of PAS Result Queue.", "error");
    return;
  }
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Export one project package at a time for PAS.", "error");
    return;
  }
  const project = projects[0];
  downloadXlsx(`${project}-PAS-Tracking.xlsx`, [{
    name: "PAS Tracking",
    rows: [
      ["Form Head", "", "", "", "", "", "", "", "", "", "", ""],
      ["Demand No", rows[0].pasDemandNo || "Waiting PAS Demand No", "PAS Material No", rows[0].pasMaterialNo || "Waiting PAS Material No", "Demand Date", pasDemandDate(rows[0]), "Legal Name", pasLegalName(rows[0]), "Request Dept", pasRequestDept(rows[0]), "Data Transfer To", pasDataTransferTo(rows[0])],
      ["", "", "", "", "", "", "", "", "", "", "", ""],
      ["Form Item", "", "", "", "", "", "", "", "", "", "", ""],
      ["Project Type", "Project", "Phase", "PAS Material No", "Part Name", "Brand", "Spec", "Unit", "Quantity", "Level 2", "Level 3", "CPD-IEP Owner", "Requirement"],
      ...rows.map((row) => {
        const enriched = applyOmResponsibility(row);
        const phase = currentStageForProject(row.project);
        return [
          projectTypeFor(row.project),
          row.project,
          currentPhaseLabelForProject(row.project),
          row.pasMaterialNo || "",
          pasPartName(row),
          pasBrand(row),
          pasSpec(row),
          omUnit(row),
          totalQty(row),
          enriched.omCategoryLevel2 || "",
          enriched.omCategoryLevel3 || "",
          enriched.omOwner || "",
          `${stageDateForProject(row.project, phase)} / Need by ${requiredDeliveryDateForProject(row.project, phase)}`,
        ];
      }),
    ],
    minWidth: 10,
    maxWidth: 34,
    freezeHeader: true,
  }]);
  rows.forEach((row) => addOmHistory(row, "Exported PAS Tracking Excel", `${project} PAS tracking exported.`));
  renderOmPurchasing();
  showToast("PAS tracking Excel exported.", "success");
}

function exportPasPdf() {
  const rows = selectedOmPasRequestRows();
  if (!rows.length) {
    showToast("PAS PDF export is no longer part of PAS Result Queue.", "error");
    return;
  }
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Export one project package at a time for PAS.", "error");
    return;
  }
  const project = projects[0];
  const content = [
    "PAS Tracking Package",
    "Form Head",
    `Demand No: ${rows[0].pasDemandNo || "Waiting PAS Demand No"}`,
    `PAS Material No: ${rows[0].pasMaterialNo || "Waiting PAS Material No"}`,
    `Demand Date: ${pasDemandDate(rows[0])}`,
    `Legal Name: ${pasLegalName(rows[0])}`,
    `Request Dept: ${pasRequestDept(rows[0])}`,
    `Data Transfer To: ${pasDataTransferTo(rows[0])}`,
    "",
    "Form Item",
    `Project: ${project}`,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    ...rows.map((row) => `${row.project} | ${currentPhaseLabelForProject(row.project)} | PAS Material ${row.pasMaterialNo || "Waiting"} | Part Name ${pasPartName(row)} | Brand ${pasBrand(row) || "Brand pending"} | Spec ${pasSpec(row)} | Qty ${totalQty(row)} | Requirement ${omPurchaseReason(row)}`),
  ].join("\n");
  downloadFile(`${project}-PAS-Tracking.pdf`, content, "application/pdf");
  rows.forEach((row) => addOmHistory(row, "Exported PAS Tracking PDF", `${project} PAS tracking PDF exported.`));
  renderOmPurchasing();
  showToast("PAS tracking PDF exported.", "success");
}

function buyerStatusFromExternalStatus(status, previousStatus = "") {
  if ([EXT_ACCEPTED, EXT_SUBMITTED, EXT_REVIEW].includes(status)) return previousStatus || BUYER_RECEIVED;
  if (status === EXT_BLOCKED) return BUYER_BLOCKED;
  if (status === EXT_PR_CREATED) return BUYER_PR_CREATED;
  if (status === EXT_PO_ISSUED) return BUYER_PO_ISSUED;
  if (status === EXT_COMPLETED) return BUYER_COMPLETED;
  if (status === EXT_REJECTED_DRI) return BUYER_RETURNED;
  return previousStatus;
}

function externalReviewStatusFromProgress(status) {
  if (status === EXT_ACCEPTED) return OM_EXTERNAL_ACCEPTED;
  if (status === EXT_SUBMITTED || status === EXT_REVIEW) return OM_EXTERNAL_PENDING;
  if (status === EXT_REJECTED_DRI) return OM_REJECTED_TO_DRI;
  return "";
}

function externalProgressAction(status) {
  if (status === EXT_BLOCKED) return "Buyer blocked";
  if (status === EXT_REJECTED_DRI) return "Rejected to DRI";
  return status;
}

function commitExternalResult(rows, payload) {
  if (!rows.length) {
    showToast("Select at least one row before updating external progress.", "error");
    return false;
  }
  const validation = validateExternalProgressPayload(payload);
  if (validation) {
    showToast(validation, "error");
    return false;
  }
  requests = requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    const event = createExternalProgressEvent(row, payload);
    const externalReviewStatus = externalReviewStatusFromProgress(payload.status) || row.externalReviewStatus;
    const rejectedToDri = payload.status === EXT_REJECTED_DRI;
		    let nextRow = {
		      ...row,
		      status: rejectedToDri ? "Rejected" : row.status,
      selected: false,
      handoffSelected: false,
      rfqSelected: false,
      omSelected: false,
      omStatus: payload.status,
	      externalReviewStatus,
	      externalRejectReason: rejectedToDri ? payload.reason : row.externalRejectReason || "",
	      externalRejectOwner: rejectedToDri ? "Requester / DRI" : row.externalRejectOwner || "",
	      omRejectReworkRequired: rejectedToDri ? true : row.omRejectReworkRequired || false,
	      omRejectedAt: rejectedToDri ? new Date().toISOString() : row.omRejectedAt || "",
	      omRejectedBy: rejectedToDri ? roleProfiles[currentRole]?.name || payload.owner || "OM Purchasing" : row.omRejectedBy || "",
	      omRejectReason: rejectedToDri ? payload.reason : row.omRejectReason || "",
	      procurementStatus: rejectedToDri ? EXT_REJECTED_DRI : row.procurementStatus,
      buyerStatus: rejectedToDri ? "" : buyerStatusFromExternalStatus(payload.status, row.buyerStatus),
      buyerReceivedAt: [EXT_ACCEPTED, EXT_SUBMITTED, EXT_REVIEW, EXT_PR_CREATED, EXT_PO_ISSUED, EXT_COMPLETED].includes(payload.status) ? (row.buyerReceivedAt || new Date().toISOString()) : row.buyerReceivedAt,
      externalSystem: payload.externalSystem || row.externalSystem,
      externalRequestNo: payload.externalRequestNo || row.externalRequestNo,
      prNo: payload.prNo || row.prNo,
      buyerPoNo: payload.poNo || row.buyerPoNo,
      factoryMaterialNo: payload.factoryMaterialNo || row.factoryMaterialNo || "",
	      externalProgressEvents: [...(row.externalProgressEvents || []), event],
	    };
	    if ([EXT_PR_CREATED, EXT_PO_ISSUED].includes(payload.status) && isMaterialNoPending(nextRow)) {
	      const materialPatch = ensureMaterialMasterFromExternalProgress(nextRow, event);
	      const materialEvent = appendMaterialCreationTimeline(nextRow, materialPatch, event);
	      nextRow = {
	        ...nextRow,
	        ...materialPatch,
	        partNo: materialPatch.materialNo,
	        externalProgressEvents: [...nextRow.externalProgressEvents, materialEvent],
	      };
	      addOmHistory(nextRow, MATERIAL_CREATION_EVENT, `${materialPatch.materialNo} created from ${payload.status}.`);
	      addHandoffHistory(nextRow, MATERIAL_CREATION_EVENT, `${materialPatch.materialNo} created from ${payload.status}.`);
	    }
	    const historyNote = payload.reason || payload.pastedExternalResult || payload.evidenceFileName || "External progress evidence recorded.";
	    addOmHistory(nextRow, externalProgressAction(payload.status), historyNote);
    addHandoffHistory(nextRow, externalProgressAction(payload.status), historyNote);
    return nextRow;
  });
  renderOmPurchasing();
  renderProcurement();
  renderBuyer();
  renderDepartment();
  renderManagerDashboard();
  showToast("External progress event saved.", "success");
  return true;
}

function openOmExternalResultModal(rows, presetResult = "", source = "om") {
  if (!rows.length) {
    showToast("Select at least one row before updating external progress.", "error");
    return;
  }
  pendingOmExternalResultIds = rows.map((row) => row.id);
  pendingExternalProgressSource = source;
  const scope = rows.length === 1 ? `${rows[0].id} · ${rows[0].name}` : `${rows.length} selected rows`;
  document.getElementById("omExternalResultTitle").textContent = presetResult === EXT_REJECTED_DRI
    ? "Reject to DRI"
    : source === "buyer" ? "Record Buyer Progress" : source === "mfg" ? "Update MFG External Progress" : "Update External Progress";
  document.getElementById("omExternalResultScope").textContent = scope;
  document.getElementById("modalOmExternalResult").value = presetResult;
  document.getElementById("modalOmExternalReason").value = "";
  document.getElementById("modalExternalSystem").value = rows.length === 1 ? rows[0].externalSystem || "" : "";
  document.getElementById("modalExternalRequestNo").value = rows.length === 1 ? rows[0].externalRequestNo || "" : "";
  document.getElementById("modalExternalPrNo").value = rows.length === 1 ? rows[0].prNo || "" : "";
  document.getElementById("modalExternalPoNo").value = rows.length === 1 ? rows[0].buyerPoNo || rows[0].poNo || "" : "";
  document.getElementById("modalExternalFactoryMaterialNo").value = rows.length === 1 ? rows[0].factoryMaterialNo || "" : "";
  document.getElementById("modalExternalEvidenceType").value = "";
  document.getElementById("modalExternalPastedResult").value = "";
  document.getElementById("modalExternalScreenshot").value = "";
  document.getElementById("modalExternalEvidenceFile").value = "";
  document.getElementById("omExternalResultModal").hidden = false;
}

function closeOmExternalResultModal() {
  pendingOmExternalResultIds = [];
  pendingExternalProgressSource = "om";
  document.getElementById("omExternalResultModal").hidden = true;
}

function submitOmExternalResult(event) {
  event.preventDefault();
  const rows = requests.filter((row) => pendingOmExternalResultIds.includes(row.id));
  const screenshotName = document.getElementById("modalExternalScreenshot").files?.[0]?.name || "";
  const evidenceName = document.getElementById("modalExternalEvidenceFile").files?.[0]?.name || "";
  const payload = {
    status: document.getElementById("modalOmExternalResult").value,
    externalSystem: document.getElementById("modalExternalSystem").value.trim(),
    externalRequestNo: document.getElementById("modalExternalRequestNo").value.trim(),
    prNo: document.getElementById("modalExternalPrNo").value.trim(),
    poNo: document.getElementById("modalExternalPoNo").value.trim(),
    factoryMaterialNo: document.getElementById("modalExternalFactoryMaterialNo").value.trim(),
    evidenceType: document.getElementById("modalExternalEvidenceType").value,
    evidenceFileName: [screenshotName, evidenceName].filter(Boolean).join(" / "),
    pastedExternalResult: document.getElementById("modalExternalPastedResult").value.trim(),
    reason: document.getElementById("modalOmExternalReason").value.trim(),
    owner: pendingExternalProgressSource === "buyer" ? "Buyer" : pendingExternalProgressSource === "mfg" ? "MFG Coordinator" : "OM Purchasing",
  };
  if (pendingExternalProgressSource === "buyer" && payload.status === EXT_REJECTED_DRI) {
    showToast("Buyer uses Blocked status instead of Reject to DRI.", "error");
    return;
  }
  if (commitExternalResult(rows, payload)) closeOmExternalResultModal();
}

function runOmRowAction(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || !action) return;
  if (!ensureOmRowAccess(row, action)) return;
  if (action === "moveToQuoteCompletion") {
    const demandNoInput = document.querySelector(`[data-om-id="${requestId}"][data-om-field="pasDemandNo"]`);
    const typedDemandNo = demandNoInput ? demandNoInput.value.trim() : "";
    if (typedDemandNo && typedDemandNo !== row.pasDemandNo) {
      updateOmField(requestId, "pasDemandNo", typedDemandNo);
    }
  }
  if (action === "saveQuoteInfo") {
    if (!saveOmQuoteInfoRows([row], { requireComplete: true })) return;
    renderOmPurchasing();
    showToast("Quote info saved.", "success");
  }
  if (action === "moveToQuoteCompletion") {
    const latest = requests.find((item) => item.id === requestId) || row;
    movePasRowsToQuoteCompletion([latest]);
  }
  if (action === "sendToUserConfirm") {
    sendOmPasRowsToUserConfirm([row]);
  }
  if (action === "rejectToDri") {
    rejectOmRowsToDri([row]);
  }
  if (action === "prepareCfa") {
    updateFinalExportTarget([row], "CFA");
  }
  if (action === "prepareEcs") {
    updateFinalExportTarget([row], "ECS");
  }
  if (action === "prepareExpense") {
    prepareOmFinalExportCostType(OM_COST_TYPE_EXPENSE, [row]);
  }
  if (action === "prepareCapex") {
    prepareOmFinalExportCostType(OM_COST_TYPE_CAPEX, [row]);
  }
  if (action === "exportExcel") {
    exportOmExcelRows([row]);
  }
  if (action === "exportPackage") {
    exportOmPackageRows([row]);
  }
  if (action === "markExported") {
    markOmFinalExportRowsExported([row]);
  }
}

function omPackageProject(rows) {
  return rows[0]?.project || omProjectFilterValue() || "OM";
}

function omPackageCodeForRows(rows) {
  return rows[0]?.finalExportPackageCode || generateOmFinalExportPackageCode(rows);
}

function omDetailSheetName(packageCode) {
  return String(packageCode || "OM-Purchasing-Detail").slice(0, 31);
}

function omPackageFileName(packageCode) {
  return `${packageCode || "OM-Purchasing-Package"}.xlsx`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function omSummarySheetRows(rows) {
  const packageCode = omPackageCodeForRows(rows);
  const totalVnd = rows.reduce((sum, row) => sum + omAmountVnd(row), 0);
  const totalUsd = rows.reduce((sum, row) => sum + omAmountUsd(row), 0);
  const today = rows[0]?.finalExportPreparedAt ? new Date(rows[0].finalExportPreparedAt) : new Date();
  const dateText = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const stageType = omFinalExportStageType(rows[0] || {});
  return [
    [packageCode, "", "", "", ""],
    ["", "", "", "", ""],
    ["部門代碼  \nDepartment code", OM_DEPARTMENT_CODE, "申請日期\nDate of Application", dateText, ""],
    ["申請人\nRequestors", OM_REQUESTOR, "聯系電話\ncontact number", OM_CONTACT, ""],
    ["量产or 试产\nMass production & NPI", stageType, "法人\nLegal person", "富山\nFushan", ""],
    ["付费方式\nPayment methods", OM_PAYMENT_METHOD, "幣別\nCurrency", "交易幣別  VND\nTransaction currency", "預算幣別 USD\nBudget currency"],
    ["月度预算代碼\nMonthly budget code", packageCode, "金額\nAmount", totalVnd, totalUsd],
    ["合     計：\ntotal", "", "", totalVnd, totalUsd],
    ["", "", "", "\n承辦﹕\nRequestors", ""],
    [" 核   准(BU):\nBU head", "", "部门主管審核﹕\nDepartment head ", "", ""],
    [" 核   准(SBU)﹕\nSBU head", "", "", "", ""],
    ["經管核準:\nBC 3 :", "", "經管審核1:\nBC 1 \n\n\n經管審核2:\nBC 2 ", "經管IE審核:\nBC IE \n\n\nOPM:", ""],
  ];
}

function omDetailSheetRows(rows) {
  const packageCode = omPackageCodeForRows(rows);
  const header = [
    "NO",
    "物品名稱Item Name",
    "PAS Material No.",
    "Material Name",
    "規格\nDetail / specification",
    "單位\nunit",
    "上次請購時間\nLast purchase time",
    "庫存量\ninventory",
    "上次請購數量\nPR quantity\n(last time)",
    "本次請購數量\nPR quantity \n(this time)",
    "單價\n（VND）\nunit price",
    "總價\n（VND）\nAmount",
    "單價\n（USD）\nunit price",
    "總價\n（USD）\nAmount",
    "請購原因\nReason for purchase",
    "付費方式\nPayment methods",
    "請購部門代碼\nRequisition department code",
    "廠商\nVendor",
    "供應商代碼\nVendor Code",
  ];
  const title = [packageCode, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
  const bodyRows = rows.map((row, index) => [
    index + 1,
    row.name,
    row.pasMaterialNo || "",
    partName(row),
    itemDetail(row) || "\\",
    omUnit(row),
    omLastPurchaseTime(row) || "\\",
    "\\",
    omLastPrQty(row) || "\\",
    omCurrentPrQty(row),
    omUnitPriceVnd(row),
    omAmountVnd(row),
    omUnitPriceUsd(row),
    omAmountUsd(row),
    omPurchaseReason(row),
    OM_PAYMENT_METHOD,
    OM_DEPARTMENT_CODE,
    row.vendor || "",
    row.vendorPartNo || "",
  ]);
  const totalRow = ["Total", "", "", "", "", "", "", "", "", "", "", bodyRows.reduce((sum, row) => sum + Number(row[11] || 0), 0), "", bodyRows.reduce((sum, row) => sum + Number(row[13] || 0), 0), "", "", "", "", ""];
  return [
    title,
    header,
    ...bodyRows,
    totalRow,
  ];
}

function omExportWorkbookSheets(rows) {
  const packageCode = omPackageCodeForRows(rows);
  return [
    {
      name: "Project budget-summary table",
      rows: omSummarySheetRows(rows),
      minWidth: 10,
      maxWidth: 32,
      preferred: { 1: 24, 2: 17, 3: 15, 4: 16 },
      rowHeights: [null, null, 60, 45, 75, 60, 75, 40.5, 15.75, 47.25, 78.75, 94.5],
      merges: ["A1:D2", "E1:E2", "D3:E3", "D4:E4", "D5:E5", "A8:C8", "D9:E11", "C10:C11", "D12:E12"],
      freezeHeader: false,
    },
    {
      name: omDetailSheetName(packageCode),
      rows: omDetailSheetRows(rows),
      minWidth: 8,
      maxWidth: 42,
      preferred: { 0: 4, 1: 28, 2: 18, 3: 20, 4: 24, 5: 32, 6: 34, 8: 13, 10: 13, 11: 13, 12: 13, 13: 13, 14: 13, 15: 13, 16: 28, 19: 18 },
      rowHeights: [26.25, 63.75],
      merges: ["A1:T1"],
      freezeHeader: true,
    },
  ];
}

function exportOmExcelRows(rows) {
  if (!rows.length) {
    showToast("No export package row is available to export Excel.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "export Excel"))) return;
  const unprepared = rows.filter((row) => !isOmFinalExportPrepared(row) && !isOmFinalExported(row));
  if (unprepared.length) {
    showToast("Choose Expense or Capex before exporting the final Excel package.", "error");
    return;
  }
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Export one final export package at a time. Please filter or select rows from a single project.", "error");
    return;
  }
  const scopeError = validateOmFinalExportPackageScope(rows);
  if (scopeError) {
    showToast(scopeError, "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const packageCode = omPackageCodeForRows(rows);
  downloadXlsx(omPackageFileName(packageCode), omExportWorkbookSheets(rows));
  const now = new Date().toISOString();
  rows.forEach((row) => addOmHistory(row, "Prepared export Excel", `Exported ${packageCode} OM Purchasing Excel package.`));
  requests = requests.map((row) => rows.some((selected) => selected.id === row.id) ? {
    ...row,
    paymentMethod: OM_PAYMENT_METHOD,
    finalExportPackageCode: rows.find((selected) => selected.id === row.id)?.finalExportPackageCode || packageCode,
    excelExportedAt: now,
    omStatus: OM_PREPARING_EXPORT,
    omStage: "finalExport",
  } : row);
  renderOmPurchasing();
  showToast("Final export Excel prepared.", "success");
}

function exportOmExcel() {
  exportOmExcelRows(selectedOmFinalExportRows());
}

function exportOmQuotePdfRows(rows) {
  if (!rows.length) {
    showToast("Select at least one final export row before exporting quote screenshot package.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "export quote screenshot package"))) return;
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Export one final export package at a time. Please filter or select rows from a single project.", "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const packageCode = omPackageCodeForRows(rows);
  const content = [
    "OM Purchasing Quote Screenshot Package",
    `Project Package: ${packageCode}`,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    ...rows.map((row) => `${row.id} | ${row.project} | ${row.name} | ${omQuoteValidity(row)} | ${omQuoteScreenshotFile(row) || "No uploaded screenshot"}`),
  ].join("\n");
  downloadFile(`${packageCode}-OM-Quote-Screenshot-Package.txt`, content, "text/plain");
  const now = new Date().toISOString();
  rows.forEach((row) => addOmHistory(row, "Prepared export screenshot package", omQuoteScreenshotFile(row) || `Exported ${packageCode} prototype quote screenshot package.`));
  requests = requests.map((row) => rows.some((selected) => selected.id === row.id) ? {
    ...row,
    quotePdfExportedAt: now,
    omStatus: OM_PREPARING_EXPORT,
    omStage: "finalExport",
  } : row);
  renderOmPurchasing();
  showToast("Final export quote screenshot package prepared.", "success");
}

function exportOmQuotePdf() {
  exportOmQuotePdfRows(selectedOmFinalExportRows());
}

function exportOmPackageRows(rows) {
  if (!rows.length) {
    showToast("No export package row is available to export.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "export package"))) return;
  const unprepared = rows.filter((row) => !isOmFinalExportPrepared(row) && !isOmFinalExported(row));
  if (unprepared.length) {
    showToast("Prepare Expense or Capex before exporting the package.", "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  exportOmExcelRows(rows);
  exportOmQuotePdfRows(rows);
  showToast("Export Package prepared: Excel package and quote screenshot package are ready.", "success");
}

function exportOmPackage() {
  exportOmPackageRows(selectedOmFinalExportRows());
}

function markSelectedExternalUpdated() {
  const rows = selectedOmRows();
  if (!rows.length) {
    showToast("Select at least one OM row before marking external system updated.", "error");
    return;
  }
  rows.forEach((row) => addOmHistory(row, "Updated external system", row.externalSystemRef || "External system marked updated."));
  requests = requests.map((row) => rows.some((selected) => selected.id === row.id) ? { ...row, externalSystemStatus: OM_UPDATED, omStatus: OM_UPDATED } : row);
  renderOmPurchasing();
  showToast("Selected rows marked as external system updated.", "success");
}

function updateProcurementField(requestId, field, value) {
  requests = requests.map((row) => row.id === requestId ? { ...row, [field]: value } : row);
}

function updateHandoffRemark(requestId, value) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || (row.procurementRemark || "") === value) return;
  requests = requests.map((item) => item.id === requestId ? { ...item, procurementRemark: value } : item);
  addHandoffHistory(row, "Updated handoff note", value || "Handoff note cleared.");
  renderHandoffHistory();
}

function toggleQuoteException(requestId, checked) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || Boolean(row.quoteException) === checked) return;
  requests = requests.map((item) => item.id === requestId ? { ...item, quoteException: checked } : item);
  addHandoffHistory(row, checked ? "Marked quote exception" : "Cleared quote exception", checked ? QUOTE_EXCEPTION_NOTE : "Quote exception cleared.");
  renderProcurement();
  showToast(checked ? "Quote exception marked." : "Quote exception cleared.", "success");
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCsv(fileName, rows) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
  downloadFile(fileName, csv, "text/csv;charset=utf-8");
}

function downloadBlob(fileName, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function sheetCellXml(value, rowIndex, columnIndex) {
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
  const styleId = rowIndex <= 1 ? 2 : 1;
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${styleId}"><v>${value}</v></c>`;
  return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

function measuredCellWidth(value) {
  const text = String(value ?? "");
  const longestLine = text.split(/\n/).reduce((max, line) => Math.max(max, line.length), 0);
  const wideChars = [...text].filter((char) => char.charCodeAt(0) > 255).length;
  return longestLine + Math.ceil(wideChars * 0.8) + 2;
}

function autoFitWidths(rows, options = {}) {
  const maxColumns = Math.max(...rows.map((row) => row.length), 1);
  const min = options.minWidth || 8;
  const max = options.maxWidth || 36;
  const preferred = options.preferred || {};
  return Array.from({ length: maxColumns }, (_, columnIndex) => {
    const measured = Math.max(...rows.map((row) => measuredCellWidth(row[columnIndex])));
    const preferredWidth = preferred[columnIndex] || 0;
    return Math.min(Math.max(measured, preferredWidth, min), max);
  });
}

function worksheetXml(rows, options = {}) {
  const maxColumns = Math.max(...rows.map((row) => row.length), 1);
  const dimensions = `A1:${columnName(maxColumns - 1)}${Math.max(rows.length, 1)}`;
  const widths = options.autoFit !== false ? autoFitWidths(rows, options) : (options.widths || rows[0]?.map((_, index) => index < 4 ? 18 : 16) || [16]);
  const rowHeights = options.rowHeights || [];
  const mergeRanges = options.merges || [];
  const freezeHeader = options.freezeHeader !== false;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="${dimensions}"/>
  ${freezeHeader ? `<sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>` : `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`}
  <cols>${Array.from({ length: maxColumns }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${widths[index] || 16}" customWidth="1"/>`).join("")}</cols>
  <sheetData>
    ${rows.map((row, rowIndex) => {
      const height = rowHeights[rowIndex];
      const attrs = height ? ` r="${rowIndex + 1}" ht="${height}" customHeight="1"` : ` r="${rowIndex + 1}"`;
      return `<row${attrs}>${row.map((cell, columnIndex) => sheetCellXml(cell, rowIndex, columnIndex)).join("")}</row>`;
    }).join("")}
  </sheetData>
  ${mergeRanges.length ? `<mergeCells count="${mergeRanges.length}">${mergeRanges.map((range) => `<mergeCell ref="${range}"/>`).join("")}</mergeCells>` : ""}
</worksheet>`;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
}

function writeUint16(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeUint32(target, offset, value) {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

function zipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  const { time, date } = dosDateTime();
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const localHeader = new Uint8Array(30 + nameBytes.length);
    writeUint32(localHeader, 0, 0x04034b50);
    writeUint16(localHeader, 4, 20);
    writeUint16(localHeader, 6, 0);
    writeUint16(localHeader, 8, 0);
    writeUint16(localHeader, 10, time);
    writeUint16(localHeader, 12, date);
    writeUint32(localHeader, 14, crc);
    writeUint32(localHeader, 18, contentBytes.length);
    writeUint32(localHeader, 22, contentBytes.length);
    writeUint16(localHeader, 26, nameBytes.length);
    writeUint16(localHeader, 28, 0);
    localHeader.set(nameBytes, 30);
    localParts.push(localHeader, contentBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    writeUint32(centralHeader, 0, 0x02014b50);
    writeUint16(centralHeader, 4, 20);
    writeUint16(centralHeader, 6, 20);
    writeUint16(centralHeader, 8, 0);
    writeUint16(centralHeader, 10, 0);
    writeUint16(centralHeader, 12, time);
    writeUint16(centralHeader, 14, date);
    writeUint32(centralHeader, 16, crc);
    writeUint32(centralHeader, 20, contentBytes.length);
    writeUint32(centralHeader, 24, contentBytes.length);
    writeUint16(centralHeader, 28, nameBytes.length);
    writeUint16(centralHeader, 30, 0);
    writeUint16(centralHeader, 32, 0);
    writeUint16(centralHeader, 34, 0);
    writeUint16(centralHeader, 36, 0);
    writeUint32(centralHeader, 38, 0);
    writeUint32(centralHeader, 42, offset);
    centralHeader.set(nameBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + contentBytes.length;
  });

  const centralDirectory = concatBytes(centralParts);
  const end = new Uint8Array(22);
  writeUint32(end, 0, 0x06054b50);
  writeUint16(end, 8, files.length);
  writeUint16(end, 10, files.length);
  writeUint32(end, 12, centralDirectory.length);
  writeUint32(end, 16, offset);
  writeUint16(end, 20, 0);
  return concatBytes([...localParts, centralDirectory, end]);
}

function safeSheetName(name, index = 1) {
  return xmlEscape(String(name || `Sheet${index}`).replace(/[\\/?*[\]:]/g, "-").slice(0, 31) || `Sheet${index}`);
}

function createXlsxBlob(rowsOrSheets, sheetName = "OM Purchasing Export") {
  const sheets = Array.isArray(rowsOrSheets?.[0]?.rows)
    ? rowsOrSheets
    : [{ name: sheetName, rows: rowsOrSheets, freezeHeader: true }];
  const sheetOverrides = sheets.map((_, index) => `
  <Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const workbookSheets = sheets.map((sheet, index) => `<sheet name="${safeSheetName(sheet.name, index + 1)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  const workbookRels = sheets.map((_, index) => `
  <Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  const styleRelId = sheets.length + 1;
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${workbookSheets}</sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${workbookRels}
  <Relationship Id="rId${styleRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><name val="Aptos"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="2"><border/><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`,
    },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: worksheetXml(sheet.rows || [[]], sheet),
    })),
  ];
  return new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function downloadXlsx(fileName, rowsOrSheets, sheetName) {
  downloadBlob(fileName, createXlsxBlob(rowsOrSheets, sheetName));
}

function exportRowsForPackage(rows) {
  const header = ["Request ID", "Project", "Item", "PAS Material No.", "Detail / Spec", "Material Name", "Stage Qty", "Total Qty", "Route", "Export Target", "Handoff Note", "Warnings"];
  return [
    header,
    ...rows.map((row) => [
      row.id,
      row.project,
      row.name,
      row.pasMaterialNo || "",
      itemDetail(row),
      partName(row),
      stageQtyText(row),
      totalQty(row),
      handoffRoute(row),
      handoffTarget(row),
      row.procurementRemark || "",
      handoffWarnings(row).join(" / "),
    ]),
  ];
}

function commitHandoffExport(selectedRows) {
  const packages = [
    [ROUTE_REUSE, "sourcing_rfq_package.csv"],
    [ROUTE_SOURCING, "sourcing_new_material_package.csv"],
  ];
  packages.forEach(([route, fileName]) => {
    const rows = selectedRows.filter((row) => handoffRoute(row) === route);
    if (rows.length) downloadCsv(fileName, exportRowsForPackage(rows));
  });

  selectedRows.forEach((row) => {
    addHandoffHistory(row, `Exported package to ${handoffTarget(row)}`, row.procurementRemark || "");
  });

  requests = requests.map((row) => {
    if (!selectedRows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      handoffSelected: false,
      procurementStatus: HANDOFF_EXPORTED,
      exportTarget: handoffTarget(row),
      exportedAt: new Date().toISOString(),
    };
  });
  renderProcurement();
  showToast(`${selectedRows.length} handoff row${selectedRows.length === 1 ? "" : "s"} exported.`, "success");
}

function exportHandoffPackages() {
  const selectedRows = procurementRows().filter((row) => row.handoffSelected);
  if (!selectedRows.length) {
    showToast("Select at least one handoff row before exporting.", "error");
    return;
  }
  if (selectedRows.some((row) => !readyForCoordinatorOutput(row))) return;

  showConfirm({
    title: "Export selected packages?",
    message: `${selectedRows.length} selected handoff row${selectedRows.length === 1 ? "" : "s"} will be exported into route-based CSV package${selectedRows.length === 1 ? "" : "s"}.`,
    confirmLabel: "Export",
    tone: "primary",
    onConfirm: () => commitHandoffExport(selectedRows),
  });
}

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const selectedRole = document.getElementById("roleSelect")?.value || "requester";
  const identifier = apiModeEnabled()
    ? syncLoginAccountForRole(selectedRole)
    : document.getElementById("loginAccountInput")?.value || document.getElementById("loginEmailInput")?.value || document.querySelector('#loginForm input[type="text"]')?.value || document.querySelector('#loginForm input[type="email"]')?.value || "";
  const password = document.querySelector('#loginForm input[type="password"]')?.value || "";
  try {
    if (apiModeEnabled()) {
      const user = await loginWithApi(identifier, password, selectedRole);
      setScreen("workspace");
      applyRole(user.role);
      showToast(`Signed in as ${user.name}.`, "success");
      return;
    }
    setScreen("workspace");
    if (selectedRole === "requester") {
      const persona = findRequesterPersonaByIdentifier(identifier) || requesterPersonas()[0] || null;
      if (persona) applyRequesterPersonaContext(persona);
    }
    applyRole(selectedRole);
  } catch (error) {
    showToast(`Login failed: ${error.message}`, "error");
  }
});

document.getElementById("requesterPersonaSelect")?.addEventListener("change", (event) => {
  currentRequesterPersonaId = event.target.value || "";
});

document.getElementById("roleSelect")?.addEventListener("change", (event) => {
  const personaField = document.getElementById("requesterPersonaField");
  if (personaField) personaField.hidden = event.target.value !== "requester";
  syncLoginAccountForRole(event.target.value);
});

document.getElementById("omExternalResultForm").addEventListener("submit", submitOmExternalResult);
document.getElementById("uatFeedbackForm")?.addEventListener("submit", submitUatFeedback);
document.getElementById("materialEntryForm").addEventListener("submit", submitMaterialEntry);
document.getElementById("materialBatchForm").addEventListener("submit", (event) => event.preventDefault());

function closeModalById(modalId) {
  const closeById = {
    managerDetailModal: closeManagerDetail,
    managerTrackModal: closeManagerTrack,
    managerStageDetailModal: closeManagerStageDetail,
    itemDetailModal: closeItemDetail,
    demandEditorModal: closeDemandEditor,
    materialEntryModal: closeMaterialEntry,
    standardNamePickerModal: closeMaterialStandardPicker,
    materialBatchModal: closeMaterialBatch,
    omExternalResultModal: closeOmExternalResultModal,
    rfqEmailDraftModal: closeRfqEmailDraft,
    contactPopupModal: () => window.closeContactPopup?.(),
    uatFeedbackModal: closeUatFeedbackModal,
    requestItemPickerModal: closeRequestItemPicker,
  }[modalId];
  if (closeById) closeById();
}

document.addEventListener("keydown", (event) => {
  if (event.target?.dataset?.requestWorksheetQty) {
    if (["-", "+", ".", "e", "E"].includes(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const nextMeta = nextWorksheetQtyMeta(event.target);
      normalizeWorksheetQtyInput(event.target, { update: true });
      window.requestAnimationFrame(() => focusWorksheetQtyByMeta(nextMeta));
      return;
    }
  }
  if (event.key !== "Escape") return;
  const openModal = [...document.querySelectorAll(".modal-backdrop:not([hidden])")]
    .filter((modal) => !modal.classList.contains("confirm-backdrop"))
    .at(-1);
  if (!openModal) return;
  closeModalById(openModal.id);
});

document.addEventListener("paste", (event) => {
  if (!event.target?.dataset?.requestWorksheetQty) return;
  event.preventDefault();
  const text = event.clipboardData?.getData("text") || "";
  event.target.value = sanitizeWorksheetQtyValue(text);
  normalizeWorksheetQtyInput(event.target, { update: true });
});

document.addEventListener("click", (event) => {
  if (event.target.classList?.contains("modal-backdrop") && !event.target.classList.contains("confirm-backdrop")) {
    closeModalById(event.target.id);
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  const viewTab = event.target.closest("[data-view]");
  const deptTab = event.target.closest("[data-dept-tab]");
  const reuseModeTab = event.target.closest("[data-reuse-mode-tab]");
  const requestWorksheetTab = event.target.closest("[data-request-worksheet-tab]");
  const requestPickerSourceTab = event.target.closest("[data-request-picker-source-tab]");
  const managerTab = event.target.closest("[data-manager-tab]");
  const demandAnalysisTab = event.target.closest("[data-demand-analysis-tab]");
  const handoffTab = event.target.closest("[data-handoff-tab]");
  const omTab = event.target.closest("[data-om-tab]");
  const addRecordButton = event.target.closest("[data-add-record]");
  const addWorksheetSourceButton = event.target.closest("[data-add-worksheet-source]");
  const addHistoryRecordButton = event.target.closest("[data-add-history-record]");
  const removeWorksheetButton = event.target.closest("[data-request-worksheet-remove]");
  const removeButton = event.target.closest("[data-remove-request]");
  const removeSelectedDemandButton = event.target.closest("[data-remove-selected-demand]");
  const editDemandButton = event.target.closest("[data-edit-demand]");
  const removeStationBreakdownButton = event.target.closest("[data-remove-station-breakdown]");
  const demandEditorCarryoverToggle = event.target.closest("[data-demand-editor-carryover-toggle]");
  const itemDetailControl = event.target.closest("[data-item-detail-source]");
  const managerDetailButton = event.target.closest("[data-manager-detail]");
  const managerDashboardDetailButton = event.target.closest("[data-manager-dashboard-detail]");
  const managerDashboardPhaseButton = event.target.closest("[data-manager-dashboard-phase-project]");
  const managerStageDetailButton = event.target.closest("[data-manager-stage-detail-project]");
  const managerDemandDetailButton = event.target.closest("[data-manager-demand-detail]");
  const managerProgressDetailButton = event.target.closest("[data-manager-progress-detail]");
  const managerQuantityDetailButton = event.target.closest("[data-manager-quantity-detail]");
  const managerDemandCostButton = event.target.closest("[data-manager-demand-cost-unit]");
  const priceReviewTab = event.target.closest("[data-price-review-tab]");
  const priceReviewDecisionButton = event.target.closest("[data-price-review-decision]");
  const costManagerAuthorizationButton = event.target.closest("[data-cost-manager-authorization]");
  const managerQuantitySelectRow = event.target.closest("[data-manager-quantity-select]");
  const managerQuantityExpandButton = event.target.closest("[data-manager-quantity-expand]");
  const contactDriButton = event.target.closest("[data-contact-dri]");
  const omSubmissionDetailButton = event.target.closest("[data-om-submission-detail]");
  const projectAccessButton = event.target.closest("[data-project-config-access]");
  const omRowButton = event.target.closest("[data-om-row-button]");
  const rfqGroupButton = event.target.closest("[data-rfq-group-action]");
  const buyerProgressButton = event.target.closest("[data-buyer-progress]");
  const mfgPackageDetailButton = event.target.closest("[data-mfg-package-detail]");
  const materialStandardButton = event.target.closest("[data-material-standard-id]");
  const batchMaterialButton = event.target.closest("[data-batch-material-id]");
  const userAQuoteConfirmButton = event.target.closest("[data-usera-quote-confirm]");
  const userAQuoteCancelButton = event.target.closest("[data-usera-quote-cancel]");
  const userAAmendButton = event.target.closest("[data-usera-amend]");
  const userAAmendConfirmButton = event.target.closest("[data-usera-amend-confirm]");
  const userAAmendRejectButton = event.target.closest("[data-usera-amend-reject]");
  const uatRowFeedbackButton = event.target.closest("[data-uat-row-feedback]");
  const uatFeedbackSaveButton = event.target.closest("[data-uat-feedback-save]");
  const carryoverSuggestionButton = event.target.closest("[data-create-carryover-candidate]");
  const warehouseCandidateLockButton = event.target.closest("[data-warehouse-candidate-lock]");
  const warehouseCandidateRejectButton = event.target.closest("[data-warehouse-candidate-reject]");

  if (viewTab?.classList.contains("tab") && !viewTab.hidden) setView(viewTab.dataset.view);
  if (deptTab) setDeptTab(deptTab.dataset.deptTab);
  if (requestWorksheetTab) {
    syncRequestWorksheetContext({ mode: requestWorksheetTab.dataset.requestWorksheetTab || DEMAND_TYPE_MFG });
    renderRequestRows();
  }
  if (requestPickerSourceTab) {
    requestItemPickerSourceMode = requestPickerSourceTab.dataset.requestPickerSourceTab || "catalog";
    renderRequestItemPicker();
  }
  if (reuseModeTab) {
    const nextReuseMode = reuseModeTab.dataset.reuseModeTab || "catalog";
    currentReuseMode = ["catalog", "reuse", "package"].includes(nextReuseMode) ? nextReuseMode : "catalog";
    renderHistoryRows();
    renderSelectedDemandLines();
  }
  if (managerTab) setManagerTab(managerTab.dataset.managerTab);
  if (demandAnalysisTab) setDemandAnalysisTab(demandAnalysisTab.dataset.demandAnalysisTab);
  if (priceReviewTab) setPriceReviewTab(priceReviewTab.dataset.priceReviewTab);
  if (costManagerAuthorizationButton) {
    applyCostManagerAuthorization(
      costManagerAuthorizationButton.dataset.costManagerAuthorization,
      costManagerAuthorizationButton.dataset.costManagerAction || "approve"
    );
  }
  if (handoffTab) setHandoffTab(handoffTab.dataset.handoffTab);
  if (omTab) setOmTab(omTab.dataset.omTab);
  if (action === "logout") {
    logoutWithApi().finally(() => setScreen("login"));
  }
  if (action === "openContactPopup") window.openContactPopup?.();
  if (action === "closeContactPopup") window.closeContactPopup?.();
  if (action === "copyContactPopup") window.copyContactPopupText?.();
  if (action === "openPageFeedback") openUatFeedbackModal({ scope: "page" });
  if (action === "openUatFeedbackReview") setView("uatFeedbackReview");
  if (action === "closeUatFeedbackModal") closeUatFeedbackModal();
  if (action === "refreshUatFeedback") refreshUatFeedback({ review: isUatFeedbackReviewer() });
  if (action === "refreshAdminConsole") refreshAdminConsole();
  if (action === "openItemPicker") openItemPicker();
  if (action === "closeItemPicker") closeItemPicker();
  if (action === "openRequestItemPicker") openRequestItemPicker();
  if (action === "closeRequestItemPicker") closeRequestItemPicker();
  if (action === "naturalSearch") runNaturalSearch();
  if (action === "clearNaturalSearch") clearNaturalSearch();
  if (action === "clearManagerProgressFilters") clearManagerProgressFilters();
  if (action === "clearManagerQuantityFilters") clearManagerQuantityFilters();
  if (action === "clearManagerDemandCostFilters") clearManagerDemandCostFilters();
  if (action === "clearOmSubmissionFilters") clearOmSubmissionFilters();
  if (action === "saveOmExchangeRate") saveOmExchangeRate();
  if (action === "saveAdminApprovalSetup") saveAdminApprovalSetup();
  if (action === "openNeedConfirmation") setDeptTab("needConfirmation");
  if (action === "historySearch") runHistorySearch();
  if (action === "clearHistorySearch") clearHistorySearch();
  if (action === "previewHistoryPackage") renderHistoryPackageRows();
  if (action === "importHistoryPackage") importHistoryPackage();
  if (action === "createNewItemSuggestion") createNewItemSuggestion();
  if (action === "addWorksheetRow") addWorksheetRow();
  if (addWorksheetSourceButton) addWorksheetRow(addWorksheetSourceButton.dataset.addWorksheetSource || "");
  if (action === "addWarehouseStockRecord") addWarehouseStockRecord();
  if (action === "addStationBreakdownRow") {
    const addStationButton = event.target.closest("[data-action='addStationBreakdownRow']");
    addStationBreakdownRow(addStationButton?.dataset.stationRequestId || "");
  }
  if (action === "addDemandEditorRow") addDemandEditorRow();
  if (action === "closeDemandEditor") closeDemandEditor();
  if (demandEditorCarryoverToggle) {
    const key = demandEditorCarryoverToggle.dataset.demandEditorCarryoverToggle;
    if (expandedDemandEditorCarryoverRows.has(key)) expandedDemandEditorCarryoverRows.delete(key);
    else expandedDemandEditorCarryoverRows.add(key);
    renderDemandEditor();
  }
  if (action === "copyHistory") copyHistory();
  if (action === "useHistorySourceQty") copyHistory(false);
  if (addHistoryRecordButton) addHistoryRecord(addHistoryRecordButton.dataset.addHistoryRecord);
  if (carryoverSuggestionButton) createCarryoverCandidate(carryoverSuggestionButton.dataset.createCarryoverCandidate);
  if (warehouseCandidateLockButton) updateWarehouseCandidateStatus(warehouseCandidateLockButton.dataset.warehouseCandidateLock, "lock");
  if (warehouseCandidateRejectButton) updateWarehouseCandidateStatus(warehouseCandidateRejectButton.dataset.warehouseCandidateReject, "reject");
  if (editDemandButton) openDemandEditor(editDemandButton.dataset.editDemand);
  if (action === "completeSelectedMaterials") completeSelectedMaterials();
  if (action === "saveRequesterDraft") saveRequesterDraft();
  if (action === "submitRequests") submitRequests();
  if (action === "exportHandoffPackages") exportHandoffPackages();
  if (action === "sendSelectedToOm") sendSelectedToOm();
  if (action === "exportRfqExcel") exportRfqExcel();
  if (action === "mfgExportPdf") exportMfgPdf();
  if (action === "mfgUpdateExternalProgress") updateMfgExternalProgress();
  if (action === "mfgRejectToDri") rejectMfgSelectedToDri();
  if (action === "generateRfqEmailDraft") generateRfqEmailDraft();
  if (action === "markRfqDispatched") markRfqDispatched();
  if (action === "sendRfqSelectedToBuyer") sendRfqSelectedToBuyer();
  if (action === "closeRfqEmailDraft") closeRfqEmailDraft();
  if (action === "copyRfqEmailDraft") copyRfqEmailDraft();
  if (action === "exportPasExcel") exportPasExcel();
  if (action === "exportPasPdf") exportPasPdf();
  if (action === "markPasSent") markPasRequestSent();
  if (action === "omUploadPasResult") openOmPasResultUpload();
  if (action === "omSaveQuoteInfo") saveOmQuoteInfo();
  if (action === "omSendToUserConfirm") sendOmPasResultToUserConfirm();
  if (action === "omAskUserAAmend") askUserAAmendSelected();
  if (action === "omPrepareCfa") prepareOmFinalExport("CFA");
  if (action === "omPrepareEcs") prepareOmFinalExport("ECS");
  if (action === "omMarkExported") markOmFinalExported();
  if (action === "omExportExcel") exportOmExcel();
  if (action === "omExportQuotePdf") exportOmQuotePdf();
  if (action === "omExportPackage") exportOmPackage();
  if (action === "omRejectToDri") rejectOmSelectedToDri();
  if (action === "omMarkExternalUpdated") markSelectedExternalUpdated();
  if (action === "importActualBuyExcel") importActualBuyExcel();
  if (action === "saveActualBuy") saveActualBuy();
  if (action === "markActualBuyCompleted") markActualBuyCompleted();
  if (action === "importBaselineExcel") importBaselineExcel();
  if (action === "saveBaseline") saveBaseline();
  if (action === "validateBaselineMaterialPlan") validateBaselineMaterialPlan();
  if (action === "saveAndOpenProject") saveProjectSetup(true);
  if (action === "closeManagerDetail") closeManagerDetail();
  if (action === "closeManagerTrack") closeManagerTrack();
  if (action === "closeManagerStageDetail") closeManagerStageDetail();
  if (action === "closeItemDetail") closeItemDetail();
  if (action === "closeMaterialEntry") closeMaterialEntry();
  if (action === "openMaterialStandardPicker") openMaterialStandardPicker(pendingMaterialEntryId);
  if (action === "openBatchStandardPicker") openMaterialStandardPicker(activeBatchMaterialId);
  if (action === "closeMaterialStandardPicker") closeMaterialStandardPicker();
  if (action === "closeMaterialBatch") closeMaterialBatch();
  if (action === "toggleBatchStandardName") {
    toggleStandardNameForSuggestion(activeBatchMaterialId);
    renderMaterialBatch();
  }
  if (action === "addCompletedBatchMaterials") addCompletedBatchMaterials();
  if (action === "toggleMaterialStandardName") toggleMaterialStandardName();
  if (action === "selectMaterialStandardName" && materialStandardButton) selectMaterialStandardName(materialStandardButton.dataset.materialStandardId);
  if (action === "closeOmExternalResult") closeOmExternalResultModal();
  if (action === "cancelConfirm") hideConfirm();
  if (action === "confirmAction") runConfirmedAction();
  if (addRecordButton) addRecord(addRecordButton.dataset.addRecord);
  if (removeWorksheetButton) {
    removeRequest(removeWorksheetButton.dataset.requestWorksheetRemove);
  }
  if (removeButton) {
    showConfirm({
      title: "Remove request line?",
      message: "This editable request line will be removed from the current request draft.",
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => removeRequest(removeButton.dataset.removeRequest),
    });
  }
  if (removeSelectedDemandButton) {
    removeRequest(removeSelectedDemandButton.dataset.removeSelectedDemand);
    renderSelectedDemandLines();
  }
  if (removeStationBreakdownButton) removeStationBreakdownRow(
    removeStationBreakdownButton.dataset.removeStationBreakdown,
    removeStationBreakdownButton.dataset.removeStationBreakdownRow,
  );
  if (itemDetailControl) openItemDetail(itemDetailControl.dataset.itemDetailSource, itemDetailControl.dataset.itemDetailId);
  if (managerDetailButton) openManagerDetail(managerDetailButton.dataset.managerDetail);
  if (managerDashboardDetailButton) openManagerDetail(managerDashboardDetailButton.dataset.managerDashboardDetail, { readonly: true });
  if (managerDashboardPhaseButton) openManagerDashboardPhaseDetail(
    managerDashboardPhaseButton.dataset.managerDashboardPhaseProject,
    managerDashboardPhaseButton.dataset.managerDashboardPhaseStage,
  );
  if (managerDemandDetailButton) openManagerDetail(managerDemandDetailButton.dataset.managerDemandDetail, { readonly: true });
  if (managerProgressDetailButton) openManagerProgressDetail(managerProgressDetailButton.dataset.managerProgressDetail);
  if (managerDemandCostButton) drillManagerDemandCost(
    managerDemandCostButton.dataset.managerDemandCostUnit,
    managerDemandCostButton.dataset.managerDemandCostPhase || "",
    managerDemandCostButton.dataset.managerDemandCostItem || "",
  );
  if (priceReviewDecisionButton) applyPriceReviewDecision(
    priceReviewDecisionButton.dataset.priceReviewDecision,
    priceReviewDecisionButton.dataset.priceReviewAction,
  );
  if (managerQuantitySelectRow && !event.target.closest("button, input, select, textarea, a")) {
    selectedManagerQuantityKeyId = managerQuantitySelectRow.dataset.managerQuantitySelect;
    renderManagerQuantityMatrix();
  }
  if (managerQuantityExpandButton) {
    const key = `${managerQuantityExpandButton.dataset.managerQuantityExpand}:${managerQuantityExpandButton.dataset.managerQuantityExpandField || "spec"}`;
    if (expandedManagerQuantityRows.has(key)) expandedManagerQuantityRows.delete(key);
    else expandedManagerQuantityRows.add(key);
    renderManagerQuantityMatrix();
  }
  const quantityDashboardItem = event.target.closest("[data-quantity-dashboard-item]")?.dataset.quantityDashboardItem || "";
  const quantityDashboardPhase = event.target.closest("[data-quantity-dashboard-phase]")?.dataset.quantityDashboardPhase || "";
  const quantityDashboardUnit = event.target.closest("[data-quantity-dashboard-unit]")?.dataset.quantityDashboardUnit || "";
  if (quantityDashboardPhase || quantityDashboardUnit) applyManagerQuantityDashboardCellFilter(quantityDashboardItem, quantityDashboardPhase, quantityDashboardUnit);
  else if (quantityDashboardItem) applyManagerQuantityItemFilter(quantityDashboardItem);
  if (managerQuantityDetailButton) openManagerQuantityDetail(managerQuantityDetailButton.dataset.managerQuantityDetail);
  if (contactDriButton) openDriContact(contactDriButton.dataset.contactDri);
  if (omSubmissionDetailButton) openOmSubmissionDetail(omSubmissionDetailButton.dataset.omSubmissionDetail);
  if (managerStageDetailButton) openManagerStageDetail(
    managerStageDetailButton.dataset.managerStageDetailProject,
    managerStageDetailButton.dataset.managerStageDetailStage,
    managerStageDetailButton.dataset.managerStageDetailLine || "",
  );
  if (projectAccessButton) updateProjectSetup(projectAccessButton.dataset.projectConfigAccess, "openToUser", projectAccessButton.dataset.projectConfigOpen === "true");
  if (omRowButton) runOmRowAction(omRowButton.dataset.omRowButton, omRowButton.dataset.omRowButtonAction);
  if (rfqGroupButton) runRfqBuyerGroupAction(rfqGroupButton.dataset.rfqGroupBuyer, rfqGroupButton.dataset.rfqGroupAction);
  if (buyerProgressButton) {
    const row = requests.find((item) => item.id === buyerProgressButton.dataset.buyerProgress);
    if (row) openOmExternalResultModal([row], "", "buyer");
  }
  if (mfgPackageDetailButton) openMfgPackageDetail(mfgPackageDetailButton.dataset.mfgPackageDetail);
  if (userAQuoteConfirmButton) confirmUserAOmQuote(userAQuoteConfirmButton.dataset.useraQuoteConfirm);
  if (userAQuoteCancelButton) cancelUserAOmQuote(userAQuoteCancelButton.dataset.useraQuoteCancel);
  if (userAAmendButton) createUserAAmendmentDraft(userAAmendButton.dataset.useraAmend);
  if (userAAmendConfirmButton) confirmUserAAmendment(userAAmendConfirmButton.dataset.useraAmendConfirm);
  if (userAAmendRejectButton) rejectUserAAmendment(userAAmendRejectButton.dataset.useraAmendReject);
  if (uatRowFeedbackButton) {
    const requestId = uatRowFeedbackButton.dataset.uatRowFeedback;
    const row = requests.find((item) => item.id === requestId);
    openUatFeedbackModal({
      scope: "row",
      pageKey: `om-${currentOmTab}`,
      rowScopeType: "request",
      rowScopeId: requestId,
      rowScopeLabel: row ? `${row.project} / ${row.name}` : `Request ${requestId}`,
      metadata: row ? { project: row.project, item: row.name, needDate: needDateForRow(row) || "" } : {},
    });
  }
  if (uatFeedbackSaveButton) saveUatFeedbackReview(uatFeedbackSaveButton.dataset.uatFeedbackSave);
  if (batchMaterialButton) {
    activeBatchMaterialId = batchMaterialButton.dataset.batchMaterialId;
    renderMaterialBatch();
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "projectTypeSelect") {
    currentProjectType = event.target.value || currentProjectType;
    const firstProject = projectCodesByType(currentProjectType, { openOnly: true })[0];
    if (firstProject) currentProject = firstProject;
    currentDeptDemandPhase = nextBuyStageForProject(currentProject) || currentStageForProject(currentProject);
    updateRequestCarryover({ project: currentProject, phase: currentDeptDemandPhase });
    searchResults = [];
    naturalSearchActive = false;
    historyResults = [];
    historySearchActive = false;
    historySelections.clear();
    syncProjectControls();
    renderDepartment();
  }

  if (event.target.id === "projectSelect") {
    currentProject = event.target.value;
    currentProjectType = projectTypeFor(currentProject);
    currentDeptDemandPhase = nextBuyStageForProject(currentProject) || currentStageForProject(currentProject);
    updateRequestCarryover({ project: currentProject, phase: currentDeptDemandPhase });
    searchResults = [];
    naturalSearchActive = false;
    historyResults = [];
    historySearchActive = false;
    historySelections.clear();
    renderDepartment();
  }

  if (event.target.id === "warehouseStockItem") syncWarehouseStockSelection();
  if (["warehouseMonthFilter", "warehouseSearch"].includes(event.target.id)) renderWarehouseMaintenance();

  if (event.target.id === "managerProjectFilter") renderManager();
  if (event.target.id === "managerStatusFilter") renderManager();
  if (event.target.id === "managerCostProjectFilter") renderManagerCostView();
  if (event.target.id === "managerStageProjectFilter") renderManagerStageTracking();
  if (event.target.id === "managerDemandProjectTypeFilter") renderManagerStageTracking();
  if ([
    "managerProgressYearFilter",
    "managerProgressProjectFilter",
    "managerProgressProcessFilter",
    "managerProgressStageFilter",
    "managerProgressDepartmentFilter",
    "managerProgressLateOnly",
    "managerProgressPendingOnly",
  ].includes(event.target.id)) renderManagerStageTracking();
  if ([
    "managerDemandCostProjectFilter",
    "managerDemandCostPhaseFilter",
    "managerDemandCostLineCount",
    "managerDemandCostViewMode",
  ].includes(event.target.id)) {
    syncManagerQuantityScopeFromDemandCost();
    renderManagerDemandCostDashboard();
    renderManagerQuantityMatrix();
  }
  if ([
    "managerQuantityProjectFilter",
    "managerQuantityItemFilter",
    "managerQuantityPhaseFilter",
    "managerQuantityStationFilter",
    "managerQuantityUnitFilter",
    "managerQuantitySortFilter",
    "managerUnitSplitPhase",
    "managerUnitSplitLineCount",
    "managerUnitSplitViewMode",
  ].includes(event.target.id)) renderManagerQuantityMatrix();
  if ([
    "omSubmissionYearFilter",
    "omSubmissionProjectFilter",
    "omSubmissionProcessFilter",
    "omSubmissionStageFilter",
    "omSubmissionDepartmentFilter",
    "omSubmissionLateOnly",
    "omSubmissionPendingOnly",
  ].includes(event.target.id)) renderOmSubmission();
  if (event.target.id === "currencyDisplaySelect") {
    currencyDisplay = event.target.value === "USD" ? "USD" : "VND";
    renderDepartment();
    renderManager();
    renderOmPurchasing();
    renderSourcing();
    renderBuyer();
  }
  if ([
    "itemPickerDemandTypeSelect",
    "itemPickerRequestLineSelect",
    "itemPickerStationSelect",
    "itemPickerDemandUnitSelect",
  ].includes(event.target.id)) {
    syncItemPickerDemandContext({
      demandType: document.getElementById("itemPickerDemandTypeSelect")?.value || itemPickerDemandType,
      requestLine: document.getElementById("itemPickerRequestLineSelect")?.value || itemPickerRequestLine,
      station: document.getElementById("itemPickerStationSelect")?.value || itemPickerStation,
      demandUnit: document.getElementById("itemPickerDemandUnitSelect")?.value || itemPickerDemandUnit,
    });
    renderItemPickerDemandContext();
    renderRequesterInputContext();
    renderRequestRows();
    renderHistoryRows();
    renderNaturalRows();
    renderHistoryPackageRows();
    renderItemPickerCarryoverSuggestions();
    renderSelectedDemandLines();
  }
  if (event.target.id === "requestWorksheetLine") {
    syncRequestWorksheetContext({ requestLine: event.target.value });
    renderRequestRows();
  }
  if (event.target.id === "requestWorksheetAddPhase") {
    syncRequestWorksheetContext({ phase: event.target.value });
    renderRequestRows();
  }
  if (event.target.id === "requestWorksheetSourceSelect") {
    requestWorksheetSelectedSource = event.target.value || "";
    renderRequestRows();
  }
  if (event.target.id === "requestItemPickerLevel1") {
    requestItemPickerLevel1 = event.target.value || "";
    requestItemPickerLevel2 = "";
    requestItemPickerLevel3 = "";
    renderRequestItemPicker();
  }
  if (event.target.id === "requestItemPickerLevel2") {
    requestItemPickerLevel2 = event.target.value || "";
    requestItemPickerLevel3 = "";
    renderRequestItemPicker();
  }
  if (event.target.id === "requestItemPickerLevel3") {
    requestItemPickerLevel3 = event.target.value || "";
    renderRequestItemPicker();
  }
  if (event.target.id === "managerDashboardProjectFilter") renderManagerDashboard();
  if (event.target.id === "managerDashboardStatusFilter") renderManagerDashboard();
  if (["handoffProjectFilter", "handoffRouteFilter", "handoffExportStatusFilter"].includes(event.target.id)) renderProcurement();
  if (["sourcingOwnerFilter", "sourcingStatusFilter"].includes(event.target.id)) renderSourcing();
  if (["buyerProjectFilter", "buyerStatusFilter"].includes(event.target.id)) renderBuyer();
  if (["omDemandProjectFilter", "omProjectFilter", "omQuoteExpiryProjectFilter", "omQuoteExpiryStatusFilter", "omQuoteExpiryAssigneeFilter", "omUserConfirmProjectFilter", "omFinalExportProjectFilter", "omHistoryProjectFilter", "omOwnerFilter"].includes(event.target.id)) renderOmPurchasing();
  if (["naturalLevel1", "naturalLevel2"].includes(event.target.id)) {
    if (event.target.id === "naturalLevel1") {
      document.getElementById("naturalLevel2").value = "";
      document.getElementById("naturalLevel3").value = "";
    }
    if (event.target.id === "naturalLevel2") document.getElementById("naturalLevel3").value = "";
    syncCascade("natural");
    runNaturalSearch();
  }
  if (event.target.id === "naturalLevel3") runNaturalSearch();
  if (["historyLevel1", "historyLevel2"].includes(event.target.id)) {
    if (event.target.id === "historyLevel1") {
      document.getElementById("historyLevel2").value = "";
      document.getElementById("historyLevel3").value = "";
    }
    if (event.target.id === "historyLevel2") document.getElementById("historyLevel3").value = "";
    syncCascade("history");
    runHistorySearch();
  }
  if (event.target.id === "historyLevel3") runHistorySearch();
  if (["historyPackageSourceProject", "historyPackageSourcePhase", "historyPackageSourcePackage"].includes(event.target.id)) renderHistoryPackageRows();
  if (event.target.id === "deptDemandMode") {
    currentDeptDemandMode = event.target.value;
    renderDeptStageTracking();
  }
  if (event.target.id === "deptDemandPhase") {
    currentDeptDemandPhase = event.target.value;
    renderDeptStageTracking();
  }
  if (event.target.id === "deptDemandDepartment") {
    currentDeptDemandDepartment = event.target.value;
    renderDeptStageTracking();
  }

  const projectPhaseCode = event.target.dataset.projectConfigPhase;
  if (projectPhaseCode) updateProjectSetup(projectPhaseCode, "currentPhase", event.target.value);
  const projectTypeCode = event.target.dataset.projectConfigType;
  if (projectTypeCode) updateProjectSetup(projectTypeCode, "projectType", event.target.value);
  if (event.target.id === "historySourceProject") runHistorySearch();

  const materialEntryFields = {
    materialEntryLevel1: "level1",
    materialEntryLevel2: "level2",
    materialEntryLevel3: "level3",
  };
  if (materialEntryFields[event.target.id]) {
    updateMaterialEntryField(materialEntryFields[event.target.id], event.target.value, { rerender: true });
  }
  const batchMaterialFields = {
    materialBatchLevel1: "level1",
    materialBatchLevel2: "level2",
    materialBatchLevel3: "level3",
  };
  if (batchMaterialFields[event.target.id]) {
    updateBatchMaterialField(batchMaterialFields[event.target.id], event.target.value, { rerender: true });
  }

  const historyId = event.target.dataset.historySelect;
  if (historyId) {
    if (event.target.checked) historySelections.add(historyId);
    else historySelections.delete(historyId);
  }

  const selectRequest = event.target.dataset.selectRequest;
  if (selectRequest) {
    requests = requests.map((row) => row.id === selectRequest ? { ...row, selected: event.target.checked } : row);
  }

  const requestNeedDate = event.target.dataset.requestNeedDate;
  if (requestNeedDate) {
    updateRequestNeedDate(requestNeedDate, event.target.value);
  }

  const requestDemandUnit = event.target.dataset.requestDemandUnit;
  if (requestDemandUnit) updateRequestDemandUnit(requestDemandUnit, event.target.value);

  const requestMatrixQty = event.target.dataset.requestMatrixQty;
  if (requestMatrixQty) {
    updateRequestMatrixQty(
      requestMatrixQty,
      event.target.dataset.requestMatrixStage || currentStageForProject(currentProject),
      event.target.value
    );
  }
  const requestWorksheetQty = event.target.dataset.requestWorksheetQty;
  if (requestWorksheetQty) {
    normalizeWorksheetQtyInput(event.target, { update: true });
  }

  const selectedDemandNeedDate = event.target.dataset.selectedDemandNeedDate;
  if (selectedDemandNeedDate) updateSelectedDemandLine(selectedDemandNeedDate, "needDate", event.target.value);
  const selectedDemandQty = event.target.dataset.selectedDemandQty;
  if (selectedDemandQty) updateSelectedDemandLine(selectedDemandQty, "qty", event.target.value);
  const selectedDemandRemark = event.target.dataset.selectedDemandRemark;
  if (selectedDemandRemark) updateSelectedDemandLine(selectedDemandRemark, "remark", event.target.value);

  const adminUserField = event.target.dataset.adminUserField;
  const adminUserId = event.target.dataset.adminUserId;
  if (adminUserField && adminUserId) {
    adminApprovalSetup = {
      ...adminApprovalSetup,
      users: adminApprovalSetup.users.map((user) => user.id === adminUserId ? { ...user, [adminUserField]: event.target.value } : user),
    };
  }

  const handoffSelect = event.target.dataset.handoffSelect;
  if (handoffSelect) {
    requests = requests.map((row) => row.id === handoffSelect ? { ...row, handoffSelected: event.target.checked, rfqSelected: event.target.checked } : row);
    renderProcurement();
  }

  const rfqSelect = event.target.dataset.rfqSelect;
  if (rfqSelect) {
    requests = requests.map((row) => row.id === rfqSelect ? { ...row, rfqSelected: event.target.checked } : row);
    renderRfqDispatch();
    renderRfqFollowUp();
  }

  const rfqField = event.target.dataset.rfqField;
  const rfqId = event.target.dataset.rfqId;
  if (rfqField && rfqId) updateRfqField(rfqId, rfqField, event.target.value);

  const pasField = event.target.dataset.pasField;
  const pasId = event.target.dataset.pasId;
  if (pasField && pasId) updatePasField(pasId, pasField, event.target.value);

  const pasDecisionId = event.target.dataset.pasDecision;
  if (pasDecisionId) {
    if (event.target.value) applyPasDecision(pasDecisionId, event.target.value);
    event.target.value = "";
  }

  const sourcingField = event.target.dataset.sourcingField;
  const sourcingId = event.target.dataset.sourcingId;
  if (sourcingField && sourcingId) updateSourcingField(sourcingId, sourcingField, event.target.value);

  const sourcingPdfId = event.target.dataset.sourcingPdf;
  if (sourcingPdfId) {
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quotation.pdf";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "sourcing_quote",
          linkedEntityId: sourcingPdfId,
          attachmentKind: "sourcing_quote_screenshot",
          visibilityScope: "om_internal",
          metadata: { source: "sourcing_upload", requestId: sourcingPdfId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Sourcing quote upload failed: ${error.message}`, "error");
      return;
    }
    requests = requests.map((row) => row.id === sourcingPdfId ? {
      ...row,
      quotationPdf: fileName,
      quotationPdfAttachmentId: attachment?.id || row.quotationPdfAttachmentId || "",
      quotationPdfUrl: attachment?.downloadUrl || row.quotationPdfUrl || "",
      rfqStatus: row.rfqStatus || "Quote Received",
    } : row);
    let row = requests.find((item) => item.id === sourcingPdfId);
    if (row && hasSourcingQuoteSuccess(row) && !isMaterialNoPending(row)) {
      const materialPatch = ensureMaterialMasterFromQuote(row);
      requests = requests.map((item) => item.id === sourcingPdfId ? { ...item, ...materialPatch } : item);
      row = requests.find((item) => item.id === sourcingPdfId);
      addDispatchHistory(row, "Vendor mapping updated", `${row.materialNo} vendor quote screenshot saved after sourcing upload.`);
    }
    addDispatchHistory(row, "Sourcing uploaded quote screenshot", fileName);
    renderSourcing();
    renderRfqFollowUp();
    showToast("Sourcing quote screenshot uploaded.", "success");
  }

  const buyerField = event.target.dataset.buyerField;
  const buyerId = event.target.dataset.buyerId;
  if (buyerField && buyerId) updateBuyerField(buyerId, buyerField, event.target.value);

  const omSelect = event.target.dataset.omSelect;
  if (omSelect) {
    if (event.target.checked) omSelections.add(omSelect);
    else omSelections.delete(omSelect);
    requests = requests.map((row) => row.id === omSelect ? { ...row, omSelected: event.target.checked } : row);
    renderOmPurchasing();
  }

  const stage = event.target.dataset.stage;
  const requestId = event.target.dataset.requestId;
  if (stage && requestId) updateStage(requestId, stage, event.target.value);

  const stationBreakdownId = event.target.dataset.stationBreakdownId;
  const stationBreakdownRow = event.target.dataset.stationBreakdownRow;
  const stationBreakdownField = event.target.dataset.stationBreakdownField;
  if (stationBreakdownId && stationBreakdownRow && stationBreakdownField) {
    updateStationBreakdownField(stationBreakdownId, stationBreakdownRow, stationBreakdownField, event.target.value);
  }

  const demandEditorId = event.target.dataset.demandEditorId;
  const demandEditorRow = event.target.dataset.demandEditorRow;
  const demandEditorField = event.target.dataset.demandEditorField;
  if (demandEditorId && demandEditorRow && demandEditorField) {
    updateDemandEditorField(demandEditorId, demandEditorRow, demandEditorField, event.target.value);
  }

  const priceId = event.target.dataset.procPrice;
  if (priceId) updateProcurementField(priceId, "updatedPrice", clampQty(event.target.value));

  const assignedId = event.target.dataset.procAssigned;
  if (assignedId) updateProcurementField(assignedId, "assignedTo", event.target.value);

  const remarkId = event.target.dataset.procRemark;
  if (remarkId) updateHandoffRemark(remarkId, event.target.value);

  const quoteExceptionId = event.target.dataset.quoteException;
  if (quoteExceptionId) toggleQuoteException(quoteExceptionId, event.target.checked);

  const omQuoteExceptionId = event.target.dataset.omQuoteException;
  if (omQuoteExceptionId) toggleOmQuoteException(omQuoteExceptionId, event.target.checked);

  const omAssigneeId = event.target.dataset.omAssigneeId;
  if (omAssigneeId) {
    assignOmRow(omAssigneeId, event.target.value);
  }

  const omPriceCurrencyId = event.target.dataset.omPriceCurrency;
  if (omPriceCurrencyId) {
    requests = requests.map((row) => row.id === omPriceCurrencyId ? { ...row, quoteInputCurrency: event.target.value === "USD" ? "USD" : "VND" } : row);
    renderOmPurchasing();
  }

  const omField = event.target.dataset.omField;
  const omId = event.target.dataset.omId;
  if (omField && omId) updateOmField(omId, omField, event.target.value);

  const actualField = event.target.dataset.actualField;
  const actualId = event.target.dataset.actualId;
  if (actualField && actualId) {
    upsertActualBuyField(actualId, actualField, event.target.value);
    renderOmPurchasing();
    renderDepartment();
    renderManagerStageTracking();
  }

  const baselineId = event.target.dataset.baselineQty;
  if (baselineId) {
    demandBaselines = demandBaselines.map((row) => row.id === baselineId ? {
      ...row,
      baselineQty: clampQty(event.target.value),
      updatedBy: roleProfiles[currentRole]?.name || "OM Purchasing",
      updatedAt: new Date().toISOString(),
    } : row);
    renderBaselineSummary();
    renderDeptStageTracking();
    renderManagerStageTracking();
  }

  const pdfId = event.target.dataset.procPdf;
  if (pdfId) {
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quotation.pdf";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "procurement_quote",
          linkedEntityId: pdfId,
          attachmentKind: "procurement_quote_screenshot",
          visibilityScope: "om_internal",
          metadata: { source: "procurement_upload", requestId: pdfId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Quote upload failed: ${error.message}`, "error");
      return;
    }
    updateProcurementField(pdfId, "quotationPdf", fileName);
    requests = requests.map((row) => row.id === pdfId ? {
      ...row,
      quotationPdfAttachmentId: attachment?.id || row.quotationPdfAttachmentId || "",
      quotationPdfUrl: attachment?.downloadUrl || row.quotationPdfUrl || "",
    } : row);
    renderProcurement();
  }

  const omPdfId = event.target.dataset.omScreenshot || event.target.dataset.omPdf;
  if (omPdfId) {
    const accessRow = requests.find((item) => item.id === omPdfId);
    if (!accessRow || !ensureOmRowAccess(accessRow, "upload quote screenshot")) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quote-screenshot.jpg";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "om_quote",
          linkedEntityId: omPdfId,
          attachmentKind: "om_quote_screenshot",
          visibilityScope: "om_internal",
          metadata: { source: "om_quote_entry", requestId: omPdfId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Quote screenshot upload failed: ${error.message}`, "error");
      return;
    }
    requests = requests.map((row) => row.id === omPdfId ? {
      ...row,
      quotationPdf: fileName,
      quotationPdfAttachmentId: attachment?.id || row.quotationPdfAttachmentId || "",
      quotationPdfUrl: attachment?.downloadUrl || row.quotationPdfUrl || "",
    } : row);
    const row = requests.find((item) => item.id === omPdfId);
    addOmHistory(row, "Uploaded quote screenshot", fileName);
    renderOmPurchasing();
    showToast("Quote screenshot uploaded.", "success");
  }

  const omExcelId = event.target.dataset.omExcel;
  if (omExcelId) {
    const accessRow = requests.find((item) => item.id === omExcelId);
    if (!accessRow || !ensureOmRowAccess(accessRow, "upload quote Excel")) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quotation.xlsx";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "om_quote",
          linkedEntityId: omExcelId,
          attachmentKind: "om_quote_excel",
          visibilityScope: "om_internal",
          metadata: { source: "om_quote_entry", requestId: omExcelId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Quote Excel upload failed: ${error.message}`, "error");
      return;
    }
    requests = requests.map((row) => row.id === omExcelId ? {
      ...row,
      quotationExcel: fileName,
      quotationExcelAttachmentId: attachment?.id || row.quotationExcelAttachmentId || "",
      quotationExcelUrl: attachment?.downloadUrl || row.quotationExcelUrl || "",
    } : row);
    const row = requests.find((item) => item.id === omExcelId);
    addOmHistory(row, "Uploaded quote Excel", fileName);
    renderOmPurchasing();
    showToast("Quote Excel uploaded.", "success");
  }

});

document.addEventListener("input", (event) => {
  if (event.target.id === "warehouseSearch") renderWarehouseMaintenance();
  if (event.target.id === "requestItemPickerQuery") {
    requestItemPickerQuery = event.target.value || "";
    renderRequestItemPicker();
  }
  if (event.target.id === "requestWorksheetSearch") {
    requestWorksheetAddQuery = event.target.value || "";
    requestWorksheetSelectedSource = "";
    renderRequestRows();
  }
  if (event.target.dataset.requestWorksheetQty) {
    normalizeWorksheetQtyInput(event.target);
  }
  const materialEntryInputs = {
    materialEntryStandardNameCn: "standardNameCn",
    materialEntryStandardNameEn: "standardNameEn",
    materialEntryStandardNameVn: "standardNameVn",
    materialEntryDetail: "detail",
    materialEntrySpec: "spec",
    materialEntryStructuredSpec: "structuredSpec",
    materialEntryUom: "uom",
    materialEntryEstimatedUnitPrice: "estimatedUnitPrice",
    materialEntryEstimatedAmount: "estimatedAmount",
    materialEntryBudgetRemark: "budgetRemark",
    materialEntryEstimateReason: "estimateReason",
    materialEntryUseCase: "useCase",
    materialEntryDuplicateDifference: "duplicateDifference",
    materialEntryEvidenceReference: "evidenceReference",
  };
  if (materialEntryInputs[event.target.id]) {
    updateMaterialEntryField(materialEntryInputs[event.target.id], event.target.value, {
      rerender: event.target.id === "materialEntryStandardNameCn",
    });
  }
  const batchMaterialInputs = {
    materialBatchStandardNameCn: "standardNameCn",
    materialBatchStandardNameEn: "standardNameEn",
    materialBatchStandardNameVn: "standardNameVn",
    materialBatchDetail: "detail",
    materialBatchSpec: "spec",
    materialBatchUseCase: "useCase",
  };
  if (batchMaterialInputs[event.target.id]) {
    updateBatchMaterialField(batchMaterialInputs[event.target.id], event.target.value, {
      rerender: event.target.id === "materialBatchStandardNameCn",
    });
  }
  if (event.target.id === "standardNamePickerQuery") {
    standardPickerQuery = event.target.value;
    renderMaterialStandardPicker();
  }
  const demandEditorId = event.target.dataset.demandEditorId;
  const demandEditorRow = event.target.dataset.demandEditorRow;
  const demandEditorField = event.target.dataset.demandEditorField;
  if (demandEditorId && demandEditorRow && demandEditorField) {
    updateDemandEditorField(demandEditorId, demandEditorRow, demandEditorField, event.target.value);
  }
});

document.getElementById("naturalQuery")?.addEventListener("input", () => {
  if (document.getElementById("naturalQuery")?.value.trim()) runNaturalSearch();
});

document.getElementById("historyQuery")?.addEventListener("input", () => {
  if (document.getElementById("historyQuery")?.value.trim()) runHistorySearch();
});

renderRequesterPersonaOptions();
syncProjectControls();
renderProjectSetup();
seedCoordinatorComputerData();
seedOmDemoData();
seedManagerQuantityMatrixDemoData();
renderDepartment();
renderSourcing();
renderBuyer();
(() => {
  const SIMPLIFIED_LOGIN_ROLES = [
    { value: "requester", label: "Requester" },
    { value: "dri", label: "Dept DRI" },
    { value: "omLeader", label: "OM Leader (Mai)" },
    { value: "omMember", label: "OM Purchasing (Giang / Linh)" },
    { value: "manager", label: "Cost Manager" },
    { value: "projectDri", label: "Budget Approver" },
    { value: "buyer", label: "Buyer Handoff" },
    { value: "admin", label: "Admin" }
  ];
  const CONTACT_WORKBOOK_ROWS = [
    { department: "IT", leader: "Csaba Varga(FUSHAN_IT) <csaba.varga@fih-foxconn.com>;", dri: "Anh Bui Thi Tu(FUSHAN_IT) <anhbtt@fih-foxconn.com>;" },
    { department: "GA", leader: "Tra Nguyen Thi Thu(DMS_GA) <tra.nguyen-thi-thu@fih-foxconn.com>;", dri: "Duy Trinh Tien Ngoc(FUSHAN_GA) <duy.trinh-tien-ngoc@fih-foxconn.com>; Phuong Tran Thi(FUSHAN_GA) <phuong.tran-thi@fih-foxconn.com>; Chi Nguyen Thi Le(DMS_GA) <chintl@fih-foxconn.com>;" },
    { department: "MFG_G", leader: "Binh Nguyen Nam(DMS_PRO) <binhnn1@fih-foxconn.com>;", dri: "Anh To Thi Phuong(DMS_PRO) <anhttp@fih-foxconn.com>; Hai Nguyen Duy(DMS_PRO) <haind@fih-foxconn.com>;" },
    { department: "ENG1", leader: "Quan Do Duc(DMS) <quandd@fih-foxconn.com>;", dri: "Thu Nguyen Thi Hang(DMS_ENG1) <thunth1@fih-foxconn.com>; Thanh Hoang Sy(DMS_ENG1) <thanhhs@fih-foxconn.com>;" },
    { department: "ENG2", leader: "Charlie Liu(DMS_ENG2) <Charlie.Liu@fih-foxconn.com>;", dri: "Pham Thi Lan Anh-Lily (DMS_ENG2) <anhptl@fih-foxconn.com>; Hue Nguyen Thi(DMS_ENG2) <huent1@fih-foxconn.com>;" },
    { department: "ENG3", leader: "David.Dai(戴夢林) <David.Dai@fih-foxconn.com>;", dri: "Xuan Nguyen Thi(DMS_ENG3) <xuannt14@fih-foxconn.com>; tinhvd@fih-foxconn.com" },
    { department: "REL", leader: "Theu Nguyen Thi-Erica(DMS_REL-LAB) <theunt@fih-foxconn.com>;", dri: "Quy Duong Kim(DMS_RL) <quydk@fih-foxconn.com>; Quen Trieu Mai (DMS_REL) <quen.trieu-mai@fih-foxconn.com>; Thong Vo Huy(DMS_RL) <thongvh@fih-foxconn.com>;" },
    { department: "EHS", leader: "Thuy Vu Van(FUSHAN_EHS) <thuyvv@fih-foxconn.com>;", dri: "Ngoan Dinh Thi(FUSHAN_EHS) <ngoan.dinh-thi@fih-foxconn.com>;" },
    { department: "FAC/REF", leader: "Quang Dao Van(DMS_REF) <quangdv1@fih-foxconn.com>;", dri: "Ha Le Trung(FUSHAN_REF) <halt1@fih-foxconn.com>; Hien Nguyen Ba(FUSHAN_REF) <hiennb1@fih-foxconn.com>; Nguyen Pham Van(FUSHAN_REF) <nguyenpv@fih-foxconn.com>;" },
    { department: "MFG_NonG", leader: "Cong Dinh Van(EMSVN_AO) <congdv1@fih-foxconn.com>;", dri: "Ban Dang Thi(DMS_PRO_NonG) <bandt1@fih-foxconn.com>;" },
    { department: "ENG_Ensky", leader: "Tuan Hoang Minh(ENSKYVN_ENG) <tuanhm@fih-foxconn.com>;", dri: "Thu Nguyen Anh(ENSKY_VN) <thuna@fih-foxconn.com>;" },
    { department: "ENG_NonG", leader: "Anh Nguyen Viet(DMS-ENG) <anhnv@fih-foxconn.com>;", dri: "Xuyen Nguyen Thi(DMS_ENG_Nong) <xuyennt1@fih-foxconn.com>;" },
    { department: "PD lab", leader: "HornerWu(吳宏振) <HornerWu@fih-foxconn.com>;", dri: "Nam Vu Hai(DMS_ENG) <namvh@fih-foxconn.com>;" },
    { department: "R&D", leader: "", dri: "Quang Nguyen Van(DMS_Eng) <quangnv3@fih-foxconn.com>; Dung Nguyen Tien(DMS_R&D) <dungnt7@fih-foxconn.com>;" },
    { department: "Antenna lab", leader: "", dri: "Phuc Nguyen Nhu(DMS_ANTENG) <phucnn@fih-foxconn.com>;" },
    { department: "WH", leader: "QING-PENG.SHI(史慶朋) <QING-PENG.SHI@fih-foxconn.com>;", dri: "vietnt@fih-foxconn.com; lichlt@fih-foxconn.com" },
    { department: "FATP_9YI4", leader: "Hai Tran Dinh(DMS_VNO) <haitd1@fih-foxconn.com>;", dri: "Hang Luong Thi(DMS_PRO) <hanglt1@fih-foxconn.com>;" },
    { department: "QA_GG", leader: "FelixWang@fih-foxconn.com", dri: "anhmt1@fih-foxconn.com" },
    { department: "QA_NonG", leader: "howardhhcheng@fih-foxconn.com", dri: "Thanh.Le-Van@fih-foxconn.com; manttb@fih-foxconn.com; Anh.nguyen-thi-van@fih-foxconn.com" },
    { department: "TE_GG", leader: "", dri: "kiennt1@fih-foxconn.com" },
    { department: "TE_nonG", leader: "", dri: "quylv@fih-foxconn.com" }
  ];
  const CONTACT_DEPARTMENT_ALIAS_MAP = {
    "mfg_g": "MFG",
    "mfg_nong": "MFG NONG",
    "mfg_nongg": "MFG NONG",
    "eng_nong": "ENG NONG",
    "eng_ensky": "ENG ENSKY",
    "fac/ref": "FAC",
    "qa_gg": "QA G-PQC",
    "qa_nong": "QA NONG",
    "te_gg": "TE",
    "te_nong": "TE NONG",
    "pd lab": "Q-LAB",
    "antenna lab": "Q-LAB",
    "gg-wh": "WH",
    "wh": "WH"
  };
  let contactPopupText = "";

  function normalizeTextValue(value) {
    return String(value || "").trim();
  }

  function normalizeDepartmentName(value) {
    const trimmed = normalizeTextValue(value);
    if (!trimmed) return "";
    const aliasKey = trimmed.toLowerCase().replace(/\s+/g, " ");
    return CONTACT_DEPARTMENT_ALIAS_MAP[aliasKey] || CONTACT_DEPARTMENT_ALIAS_MAP[aliasKey.replace(/\s/g, "")] || trimmed;
  }

  function normalizeEmailValue(value) {
    return normalizeTextValue(value).toLowerCase();
  }

  function escapeHtmlSafe(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safePersonaList() {
    try {
      return Array.isArray(requesterPersonas?.()) ? requesterPersonas() : [];
    } catch (error) {
      return [];
    }
  }

	  function findRequesterPersonaByEmail(email) {
	    const normalizedEmail = normalizeEmailValue(email);
	    if (!normalizedEmail) return null;
	    return safePersonaList().find((persona) => normalizeEmailValue(persona?.email) === normalizedEmail) || null;
	  }

	  function findRequesterPersonaByLogin(login) {
	    const normalizedLogin = normalizeTextValue(login).toLowerCase();
	    if (!normalizedLogin) return null;
	    return safePersonaList().find((persona) => {
	      return [persona?.employeeId, persona?.email, persona?.id, persona?.name]
	        .some((value) => normalizeTextValue(value).toLowerCase() === normalizedLogin);
	    }) || findRequesterPersonaByEmail(login);
	  }

  function parseWorkbookContactRaw(rawText, department, contactType, projectType) {
    const raw = normalizeTextValue(rawText);
    if (!raw) return [];
    return raw
      .split(/[\n;]+/)
      .map((chunk) => normalizeTextValue(chunk))
      .filter(Boolean)
      .map((chunk, index) => {
        const match = chunk.match(/^(.*?)<([^>]+)>$/);
        const email = normalizeEmailValue(match ? match[2] : chunk);
        const name = normalizeTextValue(match ? match[1] : "");
        return {
          id: `workbook-${department}-${contactType}-${index}-${email || name || "contact"}`,
          department: normalizeDepartmentName(department),
          contactType,
          name: name || email || "-",
          email,
          phone: "",
          employeeId: "",
          projectType,
          source: "DRI & Leaders Excel",
          status: "Active"
        };
      });
  }

  function workbookDepartmentSeedRecords() {
    return CONTACT_WORKBOOK_ROWS.flatMap((row) => {
      const projectType = row.department.toLowerCase().includes("nong") ? "Non-G" : "G";
      const department = normalizeDepartmentName(row.department);
      const fallbackSlot = {
        id: `dept-seed-${department}`,
        department,
        contactType: "Department Slot",
        name: "",
        email: "",
        phone: "",
        employeeId: "",
        projectType,
        source: "DRI & Leaders Excel",
        status: "Active"
      };
      const leaderRecords = parseWorkbookContactRaw(row.leader, row.department, "Leader", projectType);
      const driRecords = parseWorkbookContactRaw(row.dri, row.department, "DRI", projectType);
      return leaderRecords.length || driRecords.length ? [...leaderRecords, ...driRecords] : [fallbackSlot];
    });
  }

  function driMasterContactRecords() {
    const list = Array.isArray(typeof DRI_CONTACT_MASTER !== "undefined" ? DRI_CONTACT_MASTER : []) ? DRI_CONTACT_MASTER : [];
    return list.map((contact, index) => ({
      id: `dri-master-${index}`,
      department: normalizeDepartmentName(contact?.department),
      contactType: "DRI",
      name: normalizeTextValue(contact?.name),
      email: normalizeEmailValue(contact?.email),
      phone: normalizeTextValue(contact?.phone),
      employeeId: normalizeTextValue(contact?.employeeId),
      projectType: normalizeTextValue(contact?.projectType) || "Mixed",
      source: "System DRI Master",
      status: "Active"
    }));
  }

	  function requesterDirectoryRecords() {
	    return safePersonaList().map((persona) => ({
	      id: `requester-${normalizeTextValue(persona?.id || persona?.name)}`,
	      department: normalizeDepartmentName(persona?.department || persona?.dept),
	      contactType: "Requester",
	      name: normalizeTextValue(persona?.name),
	      email: normalizeEmailValue(persona?.email),
	      phone: normalizeTextValue(persona?.phone),
	      employeeId: normalizeTextValue(persona?.employeeId),
	      projectType: normalizeTextValue(persona?.projectType) || "Mixed",
	      project: normalizeTextValue((persona?.projects || [persona?.project]).filter(Boolean).join(", ")),
	      budgetApprover: normalizeTextValue(persona?.budgetApprover),
	      source: "Requester Persona",
	      status: "Active"
	    }));
	  }

  function mergedContactDirectoryRecords() {
    const mergedMap = new Map();
    const seedOrder = [...workbookDepartmentSeedRecords(), ...driMasterContactRecords(), ...requesterDirectoryRecords()];
    seedOrder.forEach((record) => {
      const department = normalizeDepartmentName(record?.department);
      const email = normalizeEmailValue(record?.email);
      const name = normalizeTextValue(record?.name);
      const type = normalizeTextValue(record?.contactType) || "Contact";
      const key = `${department}::${type}::${email || name || record?.id}`;
      const existing = mergedMap.get(key);
      if (!existing) {
        mergedMap.set(key, {
          ...record,
          department,
          email,
          name,
          source: normalizeTextValue(record?.source) || "Imported",
          status: "Active"
        });
        return;
      }
      mergedMap.set(key, {
        ...existing,
        ...record,
        department: existing.department || department,
        name: existing.name || name,
        email: existing.email || email,
        phone: existing.phone || normalizeTextValue(record?.phone),
        employeeId: existing.employeeId || normalizeTextValue(record?.employeeId),
        projectType: existing.projectType || normalizeTextValue(record?.projectType),
        source: existing.source === "DRI & Leaders Excel" && record?.source ? record.source : existing.source
      });
    });
    return Array.from(mergedMap.values())
      .filter((record) => record.department || record.name || record.email)
      .sort((left, right) => {
        const departmentCompare = String(left.department || "").localeCompare(String(right.department || ""));
        if (departmentCompare) return departmentCompare;
        const typeCompare = String(left.contactType || "").localeCompare(String(right.contactType || ""));
        if (typeCompare) return typeCompare;
        return String(left.name || left.email || "").localeCompare(String(right.name || right.email || ""));
      });
  }

	  function currentDisplayContact() {
	    const profile = roleProfiles?.[currentRole] || {};
	    const persona = currentRole === "requester" ? currentRequesterPersona?.() : null;
	    const session = currentSessionUser || {};
	    return {
	      contactType: "Current User",
	      name: normalizeTextValue(persona?.name || session.name || profile.name || "Current User"),
	      email: normalizeEmailValue(persona?.email || session.email),
	      phone: normalizeTextValue(persona?.phone),
	      department: normalizeDepartmentName(persona?.department || persona?.dept || session.department || profile.dept),
	      employeeId: normalizeTextValue(persona?.employeeId || session.employeeId || session.employee_id),
	      projectType: normalizeTextValue(persona?.projectType || session.project_family),
	      project: normalizeTextValue((persona?.projects || [persona?.project || session.project_codes]).filter(Boolean).join(", ")),
	      budgetApprover: normalizeTextValue(persona?.budgetApprover),
	      source: "Login Profile"
	    };
	  }

  function contactPopupRecords() {
	    const current = currentDisplayContact();
	    const currentDept = normalizeDepartmentName(current.department);
	    const currentFamily = normalizeTextValue(current.projectType);
	    const currentProjects = normalizeTextValue(current.project).split(",").map((item) => item.trim()).filter(Boolean);
	    const core = mergedContactDirectoryRecords().filter((record) => {
	      const recordProjects = normalizeTextValue(record.project).split(",").map((item) => item.trim()).filter(Boolean);
	      const sameProject = !currentProjects.length || !recordProjects.length || recordProjects.some((project) => currentProjects.includes(project));
	      if (record.contactType === "Requester" && currentRole === "requester") {
	        return record.employeeId === current.employeeId || (record.department === currentDept && (!currentFamily || record.projectType === currentFamily) && sameProject);
	      }
	      if (["DRI", "Leader"].includes(record.contactType) && record.department === currentDept) return true;
	      if (["MFG", "OM", "Operations", "WH"].includes(record.department)) return ["DRI", "Leader"].includes(record.contactType);
	      return false;
    });
    const records = [current, ...core];
    const seen = new Set();
    return records.filter((record) => {
      const key = `${record.contactType}::${record.department}::${record.email || record.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);
  }

  function contactCardHtml(record) {
    return `
      <article class="contact-popup-cardlet">
        <h4>${escapeHtmlSafe(record.contactType || "Contact")}</h4>
	        <div class="contact-popup-row"><span>Name</span><strong>${escapeHtmlSafe(record.name || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Employee ID</span><strong>${escapeHtmlSafe(record.employeeId || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Email</span>${record.email ? `<a href="mailto:${escapeHtmlSafe(record.email)}">${escapeHtmlSafe(record.email)}</a>` : "<strong>-</strong>"}</div>
	        <div class="contact-popup-row"><span>Dept</span><strong>${escapeHtmlSafe(record.department || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Scope</span><strong>${escapeHtmlSafe([record.projectType, record.project].filter(Boolean).join(" / ") || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Budget approver</span><strong>${escapeHtmlSafe(record.budgetApprover || "-")}</strong></div>
	        <div class="contact-popup-row"><span>Phone</span><strong>${escapeHtmlSafe(record.phone || "-")}</strong></div>
	      </article>
	    `;
  }

  function contactText(records) {
    return records.map((record) => [
      `[${record.contactType || "Contact"}]`,
      `Name: ${record.name || "-"}`,
      `Email: ${record.email || "-"}`,
      `Dept: ${record.department || "-"}`,
	      `Phone: ${record.phone || "-"}`,
	      `Employee ID: ${record.employeeId || "-"}`,
	      `Project Scope: ${[record.projectType, record.project].filter(Boolean).join(" / ") || "-"}`,
	      `Budget Approver: ${record.budgetApprover || "-"}`,
	      `Source: ${record.source || "-"}`
	    ].join("\n")).join("\n\n");
	  }

  function openContactPopup() {
    const modal = document.getElementById("contactPopupModal");
    const body = document.getElementById("contactPopupContent");
    if (!modal || !body) return;
    const records = contactPopupRecords();
    contactPopupText = contactText(records);
    body.innerHTML = `
      <div class="contact-popup-grid">${records.map(contactCardHtml).join("")}</div>
      <label>
        Copy Preview
        <textarea class="contact-copy-buffer" readonly>${escapeHtmlSafe(contactPopupText)}</textarea>
      </label>
    `;
    modal.hidden = false;
  }

  function closeContactPopup() {
    const modal = document.getElementById("contactPopupModal");
    if (modal) modal.hidden = true;
  }

  function copyContactPopupText() {
    const text = contactPopupText || contactText(contactPopupRecords());
    const fallback = () => {
      const buffer = document.querySelector("#contactPopupModal .contact-copy-buffer");
      if (!buffer) return false;
      buffer.focus();
      buffer.select();
      return document.execCommand?.("copy");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast?.("Contact text copied.", "success"))
        .catch(() => {
          const copied = fallback();
          showToast?.(copied ? "Contact text copied." : "Contact text is ready to copy.", copied ? "success" : "info");
        });
      return;
    }
    const copied = fallback();
    showToast?.(copied ? "Contact text copied." : "Contact text is ready to copy.", copied ? "success" : "info");
  }

  window.openContactPopup = openContactPopup;
  window.closeContactPopup = closeContactPopup;
  window.copyContactPopupText = copyContactPopupText;

  function ensureSimplifiedLogin() {
	    const accountInput = document.getElementById("loginAccountInput") || document.querySelector('#loginForm input[type="text"]') || document.querySelector('#loginForm input[type="email"]');
	    if (accountInput && !accountInput.id) accountInput.id = "loginAccountInput";
	    if (accountInput) {
	      accountInput.type = "text";
	      accountInput.autocomplete = "username";
	    }
	    const passwordInput = document.querySelector('#loginForm input[type="password"]');
	    if (passwordInput && (!passwordInput.value || passwordInput.value === "password")) passwordInput.value = "123";
    const roleSelect = document.getElementById("roleSelect");
    if (roleSelect) {
      roleSelect.innerHTML = SIMPLIFIED_LOGIN_ROLES.map((role) => `<option value="${role.value}">${role.label}</option>`).join("");
      syncLoginAccountForRole(roleSelect.value || "requester");
    }
    const requesterField = document.getElementById("requesterPersonaField");
    if (requesterField) {
      requesterField.hidden = true;
      requesterField.style.display = "none";
    }
  }

  function bootstrapContactPopupAndLogin() {
    if (typeof roleProfiles === "object" && roleProfiles?.requester) {
      roleProfiles.requester.name = "Requester";
      roleProfiles.requester.functionName = "Requester";
    }
    ensureSimplifiedLogin();
  }

  const originalApplyRole = typeof applyRole === "function" ? applyRole : null;
  if (originalApplyRole) {
    applyRole = function patchedApplyRole(role, ...args) {
	      const accountInput = document.getElementById("loginAccountInput") || document.getElementById("loginEmailInput") || document.querySelector('#loginForm input[type="text"]') || document.querySelector('#loginForm input[type="email"]');
	      if (role === "requester") {
	        const matchedPersona = findRequesterPersonaByLogin(accountInput?.value || "");
	        const fallbackPersona = safePersonaList()[0] || null;
        const nextPersonaId = matchedPersona?.id || fallbackPersona?.id || "";
        if (nextPersonaId) currentRequesterPersonaId = nextPersonaId;
        const personaSelect = document.getElementById("requesterPersonaSelect");
        if (personaSelect && nextPersonaId) {
          if (!Array.from(personaSelect.options).some((option) => option.value === nextPersonaId)) {
            const option = document.createElement("option");
            option.value = nextPersonaId;
            option.textContent = matchedPersona?.name || fallbackPersona?.name || "Auto requester";
            personaSelect.appendChild(option);
          }
          personaSelect.value = nextPersonaId;
        }
      }
      const result = originalApplyRole.call(this, role, ...args);
      return result;
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrapContactPopupAndLogin, { once: true });
  } else {
    bootstrapContactPopupAndLogin();
  }
})();

restoreApiSession();

(() => {
  function tempBudgetCleanupText(value) {
    return String(value || "").trim();
  }

  function tempBudgetCleanupViewName() {
    return tempBudgetCleanupText(globalThis.currentView || document.querySelector(".view.active")?.dataset.view);
  }

  function cleanupTemporaryBudgetLeakage() {
    const viewName = tempBudgetCleanupViewName();
    const role = tempBudgetCleanupText(globalThis.currentUserRole);
    const isRequesterRequestView = viewName === "department"
      && role === "requester"
      && globalThis.currentDeptTab === "request";
    document.querySelectorAll(".temp-budget-panel").forEach((panel) => {
      if (!isRequesterRequestView || !panel.closest('[data-view="department"].active [data-dept-panel="request"]')) {
        panel.remove();
      }
    });
    document.querySelectorAll(".temp-budget-manager-dashboard").forEach((node) => {
      if (viewName !== "manager" || !["manager", "admin"].includes(role)) node.remove();
    });
    document.querySelectorAll(".tb-expiry-summary").forEach((node) => {
      if (!["om", "procurement"].includes(viewName)) node.remove();
    });
    document.querySelectorAll(".tb-validity-card,.temp-budget-om-card").forEach((node) => {
      if (viewName !== "om" || !["om", "omLeader", "omMember", "admin"].includes(role)) node.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanupTemporaryBudgetLeakage, { once: true });
  } else {
    cleanupTemporaryBudgetLeakage();
  }
})();

(() => {
  const TEMP_BUDGET_STORAGE_KEY = "fihTemporaryBudgetMetaV1";
  const TEMP_BUDGET_DRAFT_KEY = "fihTemporaryBudgetDraftV1";
  const TEMP_BUDGET_APPROVAL_TEXT = "Temporary Budget Request";
  const tempBudgetUiState = loadTempBudgetDraftState();
  let pendingSubmitBudgetContext = null;
  let tempBudgetObserverInitialized = false;

  function normalizeBudgetText(value) {
    return String(value || "").trim();
  }

  function parseBudgetNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const normalized = String(value || "").replace(/[^0-9.-]+/g, "");
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function budgetMoneyFormatter(value) {
    if (typeof formatCurrency === "function") {
      try {
        return formatCurrency(value);
      } catch (error) {}
    }
    return `${Number(value || 0).toLocaleString("en-US")} VND`;
  }

  function escapeBudgetHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadTempBudgetDraftState() {
    try {
      const stored = JSON.parse(localStorage.getItem(TEMP_BUDGET_DRAFT_KEY) || "{}");
      return {
        requestType: stored.requestType === TEMP_BUDGET_APPROVAL_TEXT ? TEMP_BUDGET_APPROVAL_TEXT : "Standard Demand",
        estimatedUnitPrice: stored.estimatedUnitPrice || "",
        estimatedAmount: stored.estimatedAmount || "",
        estimateSource: stored.estimateSource || "",
        estimateDate: stored.estimateDate || "",
        budgetReason: stored.budgetReason || ""
      };
    } catch (error) {
      return {
        requestType: "Standard Demand",
        estimatedUnitPrice: "",
        estimatedAmount: "",
        estimateSource: "",
        estimateDate: "",
        budgetReason: ""
      };
    }
  }

  function saveTempBudgetDraftState() {
    try {
      localStorage.setItem(TEMP_BUDGET_DRAFT_KEY, JSON.stringify(tempBudgetUiState));
    } catch (error) {}
  }

  function loadTempBudgetMetaStore() {
    try {
      return JSON.parse(localStorage.getItem(TEMP_BUDGET_STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveTempBudgetMetaStore(store) {
    try {
      localStorage.setItem(TEMP_BUDGET_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {}
  }

  function recordItemName(record) {
    return normalizeBudgetText(record?.itemName || record?.item || record?.name);
  }

  function recordSpecName(record) {
    return normalizeBudgetText(record?.detailSpec || record?.detail || record?.spec || record?.description);
  }

  function recordRequestId(record) {
    return normalizeBudgetText(record?.requestId || record?.requestID || record?.id);
  }

  function recordProjectCode(record) {
    return normalizeBudgetText(record?.project || record?.projectCode || record?.yearProject);
  }

  function recordStatusValue(record) {
    return normalizeBudgetText(record?.status || record?.requestStatus || record?.approvalStatus || record?.currentStatus);
  }

  function recordTotalQuantity(record) {
    const direct = parseBudgetNumber(record?.totalQty || record?.qty || record?.quantity);
    if (direct > 0) return direct;
    const stages = Array.isArray(typeof STAGES !== "undefined" ? STAGES : []) ? STAGES : [];
    const stageTotal = stages.reduce((sum, stage) => sum + parseBudgetNumber(record?.[stage]), 0);
    return stageTotal;
  }

  function tempBudgetRecordKey(record) {
    return recordRequestId(record) || [recordProjectCode(record), recordItemName(record), recordSpecName(record)].filter(Boolean).join("::");
  }

  function ensureTempBudgetMeta(record) {
    if (!record) return null;
    if (!record.tempBudgetMeta) record.tempBudgetMeta = {};
    return record.tempBudgetMeta;
  }

  function writeTempBudgetMeta(record, meta) {
    if (!record || !meta) return;
    const target = ensureTempBudgetMeta(record);
    Object.assign(target, meta);
    record.requestType = meta.requestType || record.requestType || TEMP_BUDGET_APPROVAL_TEXT;
    record.estimatedUnitPrice = parseBudgetNumber(meta.estimatedUnitPrice || record.estimatedUnitPrice);
    record.estimatedAmount = parseBudgetNumber(meta.estimatedAmount || record.estimatedAmount);
    record.estimateSource = meta.estimateSource || record.estimateSource || "";
    record.estimateDate = meta.estimateDate || record.estimateDate || "";
    record.budgetReason = meta.budgetReason || record.budgetReason || "";
    if (!record.tempBudgetSubmittedAt && record.requestType === TEMP_BUDGET_APPROVAL_TEXT) {
      record.tempBudgetSubmittedAt = meta.tempBudgetSubmittedAt || new Date().toISOString();
    }
  }

  function hydrateTempBudgetMetaIntoRecords() {
    const store = loadTempBudgetMetaStore();
    const records = Array.isArray(typeof purchaseRecords !== "undefined" ? purchaseRecords : []) ? purchaseRecords : [];
    records.forEach((record) => {
      const key = tempBudgetRecordKey(record);
      if (!key || !store[key]) return;
      writeTempBudgetMeta(record, store[key]);
    });
  }

  function persistTempBudgetMeta(record, meta) {
    const key = tempBudgetRecordKey(record);
    if (!key) return;
    const store = loadTempBudgetMetaStore();
    store[key] = {
      ...(store[key] || {}),
      ...meta
    };
    saveTempBudgetMetaStore(store);
  }

  function actualAmountFromPo(record) {
    const candidates = [
      record?.actualAmount,
      record?.poActualAmount,
      record?.finalPoAmount,
      record?.buyerActualAmount,
      record?.poAmount,
      record?.poTotalAmount,
      record?.buyerPoAmount,
      record?.poIssuedAmount
    ];
    const resolved = candidates.map(parseBudgetNumber).find((value) => value > 0);
    if (resolved) return resolved;
    const hasPoTrace = [
      record?.poNo,
      record?.poNumber,
      record?.poIssuedAt,
      record?.buyerStatus,
      record?.externalStatus
    ].some((value) => /po|issued|completed|received/i.test(normalizeBudgetText(value)));
    if (!hasPoTrace) return 0;
    const unitPriceCandidates = [
      record?.actualUnitPrice,
      record?.poActualUnitPrice,
      record?.buyerPoUnitPrice,
      record?.unitPrice
    ];
    const derivedUnitPrice = unitPriceCandidates.map(parseBudgetNumber).find((value) => value > 0) || 0;
    const totalQty = recordTotalQuantity(record);
    return derivedUnitPrice > 0 && totalQty > 0 ? derivedUnitPrice * totalQty : 0;
  }

  function actualUnitPriceFromPo(record) {
    const direct = parseBudgetNumber(record?.actualUnitPrice || record?.poActualUnitPrice);
    if (direct > 0) return direct;
    const totalQty = recordTotalQuantity(record);
    const amount = actualAmountFromPo(record);
    return totalQty > 0 && amount > 0 ? amount / totalQty : 0;
  }

  function biddingAmountFromQuote(record) {
    const candidates = [
      record?.biddingAmount,
      record?.quoteAmount,
      record?.updatedPrice,
      record?.quotePrice,
      record?.unitPrice
    ];
    return candidates.map(parseBudgetNumber).find((value) => value > 0) || 0;
  }

  function quoteValiditySnapshot(record) {
    const validUntil = normalizeBudgetText(record?.quoteValidUntil || record?.tempBudgetMeta?.quoteValidUntil);
    const quoteReceivedAt = normalizeBudgetText(record?.quoteReceivedAt || record?.quoteDate || record?.tempBudgetMeta?.quoteReceivedAt);
    if (!validUntil) {
      return { validUntil: "", quoteReceivedAt, status: "Missing validity", daysRemaining: null };
    }
    const expiryDate = new Date(validUntil);
    if (Number.isNaN(expiryDate.getTime())) {
      return { validUntil, quoteReceivedAt, status: "Missing validity", daysRemaining: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
    if (daysRemaining < 0) return { validUntil, quoteReceivedAt, status: "Expired / Requote Required", daysRemaining };
    if (daysRemaining <= QUOTE_EXPIRING_SOON_DAYS) return { validUntil, quoteReceivedAt, status: "Expiring Soon", daysRemaining };
    return {
      validUntil,
      quoteReceivedAt,
      status: normalizeBudgetText(record?.quoteStatus || record?.tempBudgetMeta?.quoteStatus) || "Valid",
      daysRemaining
    };
  }

  function varianceSnapshot(record) {
    const estimate = parseBudgetNumber(record?.estimatedAmount);
    const bidding = biddingAmountFromQuote(record);
    const actual = actualAmountFromPo(record);
    const biddingVarianceAmount = bidding > 0 && estimate > 0 ? bidding - estimate : 0;
    const biddingVariancePercent = bidding > 0 && estimate > 0 ? biddingVarianceAmount / estimate : null;
    const poVarianceAmount = actual > 0 && estimate > 0 ? actual - estimate : 0;
    const poVariancePercent = actual > 0 && estimate > 0 ? poVarianceAmount / estimate : null;
    return {
      estimate,
      bidding,
      actual,
      biddingVarianceAmount,
      biddingVariancePercent,
      poVarianceAmount,
      poVariancePercent,
      varianceAmount: poVarianceAmount,
      variancePercent: poVariancePercent
    };
  }

  function isTempBudgetRecord(record) {
    return normalizeBudgetText(record?.requestType || record?.tempBudgetMeta?.requestType) === TEMP_BUDGET_APPROVAL_TEXT;
  }

  function tempBudgetDraftRoot() {
    if (currentView !== "department" || currentDeptTab !== "request") return null;
    return document.querySelector('[data-view="department"].active [data-dept-panel="request"].active')
      || document.querySelector('[data-view="department"].active [data-dept-panel="request"]');
  }

  function inferVisibleSelectedDraftKeys() {
    const root = tempBudgetDraftRoot();
    if (!root) return [];
    const rows = Array.from(root.querySelectorAll("table tr"));
    return rows
      .filter((row) => row.querySelector('input[type="checkbox"]:checked'))
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        return {
          item: normalizeBudgetText(cells[1]?.innerText || row.innerText.split("\n")[1] || ""),
          spec: normalizeBudgetText(cells[2]?.innerText || "")
        };
      })
      .filter((entry) => entry.item);
  }

  function currentBudgetMetaFromUi() {
    const estimatedUnitPrice = parseBudgetNumber(tempBudgetUiState.estimatedUnitPrice);
    const estimatedAmount = parseBudgetNumber(tempBudgetUiState.estimatedAmount);
    return {
      requestType: tempBudgetUiState.requestType,
      estimatedUnitPrice,
      estimatedAmount,
      estimateSource: normalizeBudgetText(tempBudgetUiState.estimateSource),
      estimateDate: normalizeBudgetText(tempBudgetUiState.estimateDate),
      budgetReason: normalizeBudgetText(tempBudgetUiState.budgetReason),
      tempBudgetSubmittedAt: new Date().toISOString()
    };
  }

  function applyPendingTempBudgetToSubmittedRecords() {
    if (!pendingSubmitBudgetContext) return;
    const records = Array.isArray(typeof purchaseRecords !== "undefined" ? purchaseRecords : []) ? purchaseRecords : [];
    const { meta, selectedKeys, project } = pendingSubmitBudgetContext;
    const targets = records.filter((record) => {
      if (recordProjectCode(record) !== project) return false;
      if (["Draft", "Rejected", "Cancelled", "Cancelled by Requester", "Cancelled by User A"].includes(recordStatusValue(record))) return false;
      if (!selectedKeys.length) return true;
      return selectedKeys.some((key) => recordItemName(record) === key.item || (recordItemName(record) === key.item && recordSpecName(record) === key.spec));
    });
    targets.forEach((record) => {
      writeTempBudgetMeta(record, meta);
      persistTempBudgetMeta(record, meta);
    });
    pendingSubmitBudgetContext = null;
  }

  function renderRequesterTempBudgetPanel() {
    if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
    const isRequesterRequestView = (currentUserRole || "") === "requester"
      && currentView === "department"
      && currentDeptTab === "request";
    if (!isRequesterRequestView) {
      document.querySelectorAll(".temp-budget-panel").forEach((panel) => panel.remove());
      return;
    }
    const departmentView = document.querySelector('[data-view="department"].active');
    if (!departmentView) {
      document.querySelectorAll(".temp-budget-panel").forEach((panel) => panel.remove());
      return;
    }
    const requestPanel = departmentView.querySelector('[data-dept-panel="request"]');
    if (!requestPanel) {
      document.querySelectorAll(".temp-budget-panel").forEach((panel) => panel.remove());
      return;
    }
    document.querySelectorAll(".temp-budget-panel").forEach((panel) => {
      if (!requestPanel.contains(panel)) panel.remove();
    });
    const duplicatePanels = Array.from(requestPanel.querySelectorAll(".temp-budget-panel"));
    duplicatePanels.slice(1).forEach((panel) => panel.remove());
    const anchor = requestPanel?.querySelector(".request-grid") || requestPanel;
    if (!anchor) return;
    let panel = duplicatePanels[0] && requestPanel.contains(duplicatePanels[0]) ? duplicatePanels[0] : requestPanel.querySelector(".temp-budget-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "temp-budget-panel";
      anchor.insertAdjacentElement("beforebegin", panel);
    }
    const selectedDraftKeys = inferVisibleSelectedDraftKeys();
    const totalQtyHint = selectedDraftKeys.length;
    const derivedQty = tempBudgetSelectedDraftQty();
    const derivedAmount = tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT && parseBudgetNumber(tempBudgetUiState.estimatedUnitPrice) > 0 && derivedQty > 0
      ? parseBudgetNumber(tempBudgetUiState.estimatedUnitPrice) * derivedQty
      : 0;
    const effectiveAmount = parseBudgetNumber(tempBudgetUiState.estimatedAmount) || derivedAmount;
    panel.innerHTML = `
      <div class="temp-budget-panel__header">
        <div>
          <h3>Request Type</h3>
          <p>Temporary budget estimate 會跟著 submit 一路帶到 Dept DRI、Budget Approver 與 OM Purchasing。</p>
        </div>
        <span class="pill ${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "pill-warning" : ""}">${escapeBudgetHtml(tempBudgetUiState.requestType)}</span>
      </div>
      <div class="temp-budget-panel__grid">
        <label>
          Request Type
          <select id="tempBudgetRequestType">
            <option value="Standard Demand"${tempBudgetUiState.requestType === "Standard Demand" ? " selected" : ""}>Standard Demand</option>
            <option value="${TEMP_BUDGET_APPROVAL_TEXT}"${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? " selected" : ""}>${TEMP_BUDGET_APPROVAL_TEXT}</option>
          </select>
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Estimated Unit Price
          <input id="tempBudgetEstimatedUnitPrice" type="number" inputmode="decimal" value="${escapeBudgetHtml(tempBudgetUiState.estimatedUnitPrice)}" placeholder="VND" />
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Estimated Amount
          <input id="tempBudgetEstimatedAmount" type="number" inputmode="decimal" value="${escapeBudgetHtml(tempBudgetUiState.estimatedAmount)}" placeholder="VND" />
          ${derivedAmount > 0 ? `<small class="temp-budget-panel__hint">Auto suggestion from selected qty ${derivedQty}: ${escapeBudgetHtml(budgetMoneyFormatter(derivedAmount))}</small>` : ""}
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Price Source
          <input id="tempBudgetEstimateSource" type="text" value="${escapeBudgetHtml(tempBudgetUiState.estimateSource)}" placeholder="Marketplace / website / rough vendor quote" />
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Estimate Date
          <input id="tempBudgetEstimateDate" type="date" value="${escapeBudgetHtml(tempBudgetUiState.estimateDate)}" />
        </label>
      </div>
      <label class="temp-budget-panel__reason ${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
        Budget Reason
        <textarea id="tempBudgetReason" rows="2" placeholder="Why does this temporary budget request need pre-approval?">${escapeBudgetHtml(tempBudgetUiState.budgetReason)}</textarea>
      </label>
      <p class="temp-budget-panel__footnote">${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? `Applied to selected draft rows on submit${totalQtyHint ? ` • ${totalQtyHint} selected row(s)` : ""}${effectiveAmount ? ` • current estimate ${escapeBudgetHtml(budgetMoneyFormatter(effectiveAmount))}` : ""}.` : "Standard Demand keeps the normal request flow."}</p>
    `;
    panel.querySelector("#tempBudgetRequestType")?.addEventListener("change", (event) => {
      tempBudgetUiState.requestType = event.target.value || "Standard Demand";
      saveTempBudgetDraftState();
      renderRequesterTempBudgetPanel();
    });
    [
      ["#tempBudgetEstimatedUnitPrice", "estimatedUnitPrice"],
      ["#tempBudgetEstimatedAmount", "estimatedAmount"],
      ["#tempBudgetEstimateSource", "estimateSource"],
      ["#tempBudgetEstimateDate", "estimateDate"],
      ["#tempBudgetReason", "budgetReason"]
    ].forEach(([selector, key]) => {
      panel.querySelector(selector)?.addEventListener("input", (event) => {
        tempBudgetUiState[key] = event.target.value || "";
        if (key === "estimatedUnitPrice" && !parseBudgetNumber(tempBudgetUiState.estimatedAmount)) {
          const qty = tempBudgetSelectedDraftQty();
          if (qty > 0) {
            tempBudgetUiState.estimatedAmount = String(parseBudgetNumber(event.target.value) * qty || "");
          }
        }
        saveTempBudgetDraftState();
        renderRequesterTempBudgetPanel();
      });
    });
  }

  function tempBudgetSelectedDraftQty() {
    const root = tempBudgetDraftRoot();
    if (!root) return 0;
    const rows = Array.from(root.querySelectorAll("table tr"));
    const activeRows = rows.filter((row) => row.querySelector('input[type="checkbox"]:checked'));
    const qtyFromDom = activeRows.reduce((sum, row) => {
      const text = normalizeBudgetText(row.innerText);
      const totalMatch = text.match(/Total\s+Qty\s+(\d+)/i) || text.match(/\b(\d+)\s+pcs\b/i);
      if (totalMatch) return sum + parseBudgetNumber(totalMatch[1]);
      return sum;
    }, 0);
    if (qtyFromDom > 0) return qtyFromDom;
    return activeRows.reduce((sum, row) => {
      const key = inferVisibleSelectedDraftKeys().find((entry) => row.innerText.includes(entry.item));
      if (!key) return sum;
      return sum;
    }, 0);
  }

  function findRecordByRequestId(requestId) {
    const records = Array.isArray(typeof purchaseRecords !== "undefined" ? purchaseRecords : []) ? purchaseRecords : [];
    return records.find((record) => recordRequestId(record) === requestId) || null;
  }

  function tempBudgetDetailBlockHtml(record) {
    const variance = varianceSnapshot(record);
    const validity = quoteValiditySnapshot(record);
    return `
      <section class="temp-budget-detail-block">
        <div class="temp-budget-detail-block__head">
          <h3>Temporary Budget Tracking</h3>
          <span class="pill pill-warning">${TEMP_BUDGET_APPROVAL_TEXT}</span>
        </div>
        <div class="temp-budget-detail-block__grid">
          <div><span>Estimated Unit Price</span><strong>${record.estimatedUnitPrice ? budgetMoneyFormatter(record.estimatedUnitPrice) : "Pending"}</strong></div>
          <div><span>Estimated Amount</span><strong>${record.estimatedAmount ? budgetMoneyFormatter(record.estimatedAmount) : "Pending"}</strong></div>
          <div><span>Price Source</span><strong>${escapeBudgetHtml(record.estimateSource || "Pending")}</strong></div>
          <div><span>Estimate Date</span><strong>${escapeBudgetHtml(record.estimateDate || "Pending")}</strong></div>
          <div><span>Bidding Amount</span><strong>${variance.bidding ? budgetMoneyFormatter(variance.bidding) : "Pending bidding"}</strong></div>
          <div><span>Bidding Variance</span><strong>${variance.bidding ? `${variance.biddingVarianceAmount >= 0 ? "+" : ""}${budgetMoneyFormatter(variance.biddingVarianceAmount)}${variance.biddingVariancePercent !== null ? ` (${(variance.biddingVariancePercent * 100).toFixed(1)}%)` : ""}` : "Pending bidding"}</strong></div>
          <div><span>PO Actual</span><strong>${variance.actual ? budgetMoneyFormatter(variance.actual) : "Pending PO"}</strong></div>
          <div><span>PO Variance</span><strong>${variance.actual ? `${variance.varianceAmount >= 0 ? "+" : ""}${budgetMoneyFormatter(variance.varianceAmount)}${variance.variancePercent !== null ? ` (${(variance.variancePercent * 100).toFixed(1)}%)` : ""}` : "Pending PO"}</strong></div>
          <div><span>Quote Date</span><strong>${escapeBudgetHtml(validity.quoteReceivedAt || "Pending")}</strong></div>
          <div><span>Quote Valid Until</span><strong>${escapeBudgetHtml(validity.validUntil || "Pending")}</strong></div>
          <div><span>Expiry Status</span><strong>${escapeBudgetHtml(validity.status)}</strong></div>
        </div>
        ${record.budgetReason ? `<p class="temp-budget-detail-block__reason"><strong>Budget Reason</strong> ${escapeBudgetHtml(record.budgetReason)}</p>` : ""}
      </section>
    `;
  }

  function enhanceTempBudgetDetailModals() {
    const modal = document.querySelector(".modal-card, .detail-modal, .modal-content");
    if (!modal || modal.querySelector(".temp-budget-detail-block")) return;
    const text = normalizeBudgetText(modal.innerText);
    const requestIdMatch = text.match(/REQ[-–][A-Z0-9-]+/i);
    if (!requestIdMatch) return;
    const record = findRecordByRequestId(requestIdMatch[0]);
    if (!record || !isTempBudgetRecord(record)) return;
    const anchor = modal.querySelector("table, .detail-grid, .modal-actions, .history-list") || modal.lastElementChild;
    if (!anchor) return;
    anchor.insertAdjacentHTML("beforebegin", tempBudgetDetailBlockHtml(record));
  }

  function onDocumentClickCapture(event) {
    const button = event.target?.closest?.("button");
    if (!button) return;
    const label = normalizeBudgetText(button.innerText).toLowerCase();
    if ((currentUserRole === "requester" || currentUserRole === "admin") && label.includes("submit") && tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT) {
      const projectSelect = document.querySelector('select[name="project"], #projectSelect, #projectFilter') || document.querySelector("select");
      pendingSubmitBudgetContext = {
        meta: currentBudgetMetaFromUi(),
        project: normalizeBudgetText(projectSelect?.value || projectSelect?.selectedOptions?.[0]?.textContent || ""),
        selectedKeys: inferVisibleSelectedDraftKeys()
      };
      window.setTimeout(applyPendingTempBudgetToSubmittedRecords, 800);
    }
  }

  function installTemporaryBudgetStyles() {
    if (document.getElementById("temporary-budget-inline-style")) return;
    const style = document.createElement("style");
    style.id = "temporary-budget-inline-style";
    style.textContent = `
      .temp-budget-panel{margin:18px 0;padding:18px;border:1px solid #c6d6e4;background:#fff7ea}
      .temp-budget-panel__header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .temp-budget-panel__header h3{margin:0 0 4px}
      .temp-budget-panel__header p{margin:0;color:#6a5d49}
      .temp-budget-panel__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
      .temp-budget-panel label,.temp-budget-panel__reason{display:grid;gap:6px;font-size:12px;font-weight:700;color:#5b4d39;text-transform:uppercase;letter-spacing:.04em}
      .temp-budget-panel input,.temp-budget-panel select,.temp-budget-panel textarea{font-size:14px;padding:10px 12px}
      .temp-budget-panel__hint{display:block;font-size:11px;color:#7a694c;font-weight:600;text-transform:none;letter-spacing:0}
      .temp-budget-panel__reason{margin-top:12px}
      .temp-budget-panel__footnote{margin:12px 0 0;color:#6a5d49;font-size:13px}
      .temp-budget-panel .is-hidden{display:none}
      .temp-budget-detail-block{margin:14px 0;padding:14px;border:1px solid #e8d1a5;background:#fffaf1}
      .temp-budget-detail-block__head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}
      .temp-budget-detail-block__head h3{margin:0;font-size:18px}
      .temp-budget-detail-block__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .temp-budget-detail-block__grid span{display:block;font-size:11px;text-transform:uppercase;color:#7a694c}
      .temp-budget-detail-block__grid strong{display:block;font-size:13px;color:#17324d}
      .temp-budget-detail-block__reason{margin:10px 0 0;color:#5b4d39}
      .pill-warning{background:#fce6ba;color:#7a5414}
      @media (max-width: 1100px){
        .temp-budget-panel__grid,.temp-budget-detail-block__grid{grid-template-columns:1fr 1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function initTemporaryBudgetEnhancer() {
    if (tempBudgetObserverInitialized) return;
    tempBudgetObserverInitialized = true;
    hydrateTempBudgetMetaIntoRecords();
    installTemporaryBudgetStyles();
    window.renderRequesterTempBudgetPanel = renderRequesterTempBudgetPanel;
    document.addEventListener("click", onDocumentClickCapture, true);
    window.setTimeout(() => {
      if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
      renderRequesterTempBudgetPanel();
    }, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTemporaryBudgetEnhancer, { once: true });
  } else {
    initTemporaryBudgetEnhancer();
  }
})();
