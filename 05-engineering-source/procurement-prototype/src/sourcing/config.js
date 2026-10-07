// sourcing/config: authoritative source; see docs/module-map.md.


// @legacy-unit 208 1139
export let RFQ_BUYERS;
export function initializeRFQ_BUYERSBinding() {
  RFQ_BUYERS = [
  { name: "Consumables Sourcing", email: "consumables.sourcing@example.com" },
  { name: "Service Sourcing", email: "service.sourcing@example.com" },
  { name: "IT Sourcing", email: "it.sourcing@example.com" },
  { name: "EQ Sourcing", email: "eq.sourcing@example.com" },
];
}
// @end-legacy-unit 208

// @legacy-unit 209 1146
export let DRI_CONTACT_MASTER;
export function initializeDRI_CONTACT_MASTERBinding() {
  DRI_CONTACT_MASTER = [
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
}
// @end-legacy-unit 209

// @legacy-unit 210 1164
export let BUYER_RULES;
export function initializeBUYER_RULESBinding() {
  BUYER_RULES = [
  { buyer: "IT Sourcing", keywords: ["laptop", "computer", "pc", "workstation", "monitor", "switch", "keyboard", "mouse", "scanner", "printer", "camera", "cable"], level2: ["IT硬體與設備", "IT線材與耗材"] },
  { buyer: "EQ Sourcing", keywords: ["fixture", "jig", "chamber", "feeder", "pallet", "rack", "cart", "gauge", "caliper"], level2: ["產線通用設備", "治具與夾具", "搬運倉儲物流", "設備工程工具"] },
  { buyer: "Consumables Sourcing", keywords: ["wiper", "glove", "mask", "label", "tape", "film", "tray", "carton", "foam"], level2: ["耗材", "包材", "安全相關"] },
  { buyer: "Service Sourcing", keywords: ["service", "shipment", "repair", "training", "security", "calibration"], level1: ["服務"] },
];
}
// @end-legacy-unit 210

// @legacy-unit 214 1200
export let MFG_PACKAGE_ROWS;
export function initializeMFG_PACKAGE_ROWSBinding() {
  MFG_PACKAGE_ROWS = [
  { id: "MFG-PKG-P26-CONSUMABLE", project: "P26", phase: "P1.0", packageType: "Consumable", owner: "MFG Coordinator", required: 38, completed: 34, status: "Missing Data", excelSheet: "Consumable", detail: "Consumables require English/Vietnamese name, spec, picture, unit, usage qty, purpose, budget, type, remark, and quotation count." },
  { id: "MFG-PKG-P26-EQ", project: "P26", phase: "P1.0", packageType: "EQ", owner: "MFG Coordinator", required: 18, completed: 18, status: "Ready for Manager", excelSheet: "EQ", detail: "Equipment package is complete and ready for manager collection review." },
  { id: "MFG-PKG-P26-VPP", project: "P26", phase: "P1.0", packageType: "VPP / Office Consumable", owner: "MFG Coordinator", required: 12, completed: 10, status: "In Progress", excelSheet: "VPP", detail: "VPP rows are mixed office / consumable demand and need usage purpose confirmation." },
  { id: "MFG-PKG-OR5-CONSUMABLE", project: "OR5", phase: "EVT", packageType: "Consumable", owner: "MFG Coordinator", required: 30, completed: 30, status: "Ready for Manager", excelSheet: "Consumable", detail: "OR5 consumable demand is complete and ready for manager package review." },
  { id: "MFG-PKG-OR5-EQ", project: "OR5", phase: "EVT", packageType: "EQ", owner: "MFG Coordinator", required: 14, completed: 11, status: "Missing Data", excelSheet: "EQ", detail: "EQ package still needs picture/spec evidence before collection can be completed." },
];
}
// @end-legacy-unit 214
