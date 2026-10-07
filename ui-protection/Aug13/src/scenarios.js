(function initScenarios(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FihUat = Object.assign(root.FihUat || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function scenariosFactory() {
  const PHASES = ["P1.0", "P1.1", "EVT", "DVT", "PVT", "MP"];
  const ROLE_CATALOG = [
    { id: "requester", label: "Requester", group: "Demand", nav: ["Request Workspace", "Action Required", "Request Status"] },
    { id: "dri", label: "Dept DRI", group: "Review", nav: ["Review Queue", "Review History", "Demand Progress Tracking"] },
    { id: "manager", label: "Cost Manager", group: "Review", nav: ["Cost Review", "Review History"] },
    { id: "projectDri", label: "Budget Approver", group: "Exception", nav: ["Budget Review", "Review History"] },
    { id: "omLeader", label: "OM Leader", group: "Orchestration", nav: ["OM Progress Review", "Demand Progress Tracking", "Project Stage Calendar"] },
    { id: "omMember", label: "OM Purchasing", group: "Operations", nav: ["My Intake", "My Quote Result", "Quotation DB", "OM Handoff"] },
    { id: "buyer", label: "Buyer Handoff", group: "Handoff", nav: ["Received Handoff", "Handoff History"], readOnly: true },
    { id: "admin", label: "Admin", group: "Governance", nav: ["Access & Approval Setup", "User / Role Table", "Requester Mapping", "Thresholds", "OM Members", "Audit"] },
  ];
  const PROJECTS = ["P26", "P27", "F27", "OR5", "GB10", "NPI8", "EVT4", "FAC2"];
  const ITEMS = [
    ["IPC 10", "Tower PC, Core i3, 8GB DDR5, 512GB SSD"], ["IPC+ 28", "Industrial PC, Core i5, 16GB DDR5, 1TB SSD"],
    ["Network Switch", "48-port managed switch with redundant power"], ["Barcode Scanner", "2D handheld scanner with charging cradle"],
    ["UPS 3KVA", "Online UPS, rack mount, extended battery"], ["Monitor 27", "27-inch QHD IPS display"],
    ["Torque Driver", "Programmable electric torque driver"], ["AOI Camera", "High-resolution inspection camera"],
    ["Fixture Base", "Aluminium fixture base plate"], ["Label Printer", "Industrial thermal transfer label printer"],
    ["ESD Table", "Adjustable ESD workstation"], ["Test Server", "Rack server for production test"],
  ];
  const STAGES = ["REQUESTER_DRAFT", "REQUESTER_ACTION_REQUIRED", "DEPT_DRI_REVIEW", "COST_MANAGER_REVIEW", "BUDGET_EXCEPTION_REVIEW", "OM_LEADER_ASSIGNMENT", "OM_PURCHASING_INTAKE", "QUOTE_VALIDATION", "OM_HANDOFF", "BUYER_HANDOFF"];
  const OWNER = { REQUESTER_DRAFT: "Requester", REQUESTER_ACTION_REQUIRED: "Requester", DEPT_DRI_REVIEW: "Dept DRI", COST_MANAGER_REVIEW: "Cost Manager", BUDGET_EXCEPTION_REVIEW: "Budget Approver", OM_LEADER_ASSIGNMENT: "OM Leader", OM_PURCHASING_INTAKE: "OM Purchasing", QUOTE_VALIDATION: "OM Purchasing", OM_HANDOFF: "OM Purchasing", BUYER_HANDOFF: "Buyer Handoff" };
  const NEXT = { REQUESTER_DRAFT: "Complete and submit scope", REQUESTER_ACTION_REQUIRED: "Revise and resubmit", DEPT_DRI_REVIEW: "Approve or reject", COST_MANAGER_REVIEW: "Authorize or reject", BUDGET_EXCEPTION_REVIEW: "Final approve or reject", OM_LEADER_ASSIGNMENT: "Assign OM Purchasing", OM_PURCHASING_INTAKE: "Enter PAS data", QUOTE_VALIDATION: "Validate quote", OM_HANDOFF: "Complete tracking and handoff", BUYER_HANDOFF: "Read-only handoff tracking" };
  const COMMON_FIELDS = ["project", "line", "mode", "item", "spec", "purpose", "requiredDeliveryDate", "quantities"];
  const INTERNAL_FIELDS = ["pasDemandNo", "pasMaterialNo", "vendorName", "vendorNumber", "currency", "unitPrice", "quoteDate", "quoteValidUntil", "quoteReference", "purRequestNo", "assignedOm"];

  function visibleFieldsForRole(role) {
    if (role === "requester") return [...COMMON_FIELDS];
    if (["dri", "manager", "projectDri"].includes(role)) return [...COMMON_FIELDS, "temporaryBudget", "estimatedUnitPrice"];
    if (role === "buyer") return [...COMMON_FIELDS, "purRequestNo", "prStatus", "poStatus", "etaPlan", "dtaActual"];
    return [...COMMON_FIELDS, ...INTERNAL_FIELDS, "temporaryBudget", "estimatedUnitPrice"];
  }
  function quantitiesFor(index) {
    return Object.fromEntries(PHASES.map((phase, p) => [phase, (index + p * 3) % 7 === 0 ? (index % 24) + 1 : 0]));
  }
  function makeDemand(index) {
    const item = ITEMS[index % ITEMS.length];
    const stage = STAGES[index % STAGES.length];
    const project = PROJECTS[index % PROJECTS.length];
    const assignedOm = ["OM_PURCHASING_INTAKE", "QUOTE_VALIDATION", "OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? (project === "P27" || project === "F27" ? "Linh" : "Giang") : "";
    const missingDate = stage === "REQUESTER_DRAFT" && index % 31 === 0;
    const temporaryBudget = index % 17 === 0;
    return {
      id: `DEM-${String(index + 1).padStart(5, "0")}`, dataLabel: "DEMO / UAT", yearProject: `Y${26 + index % 3}`,
      project, line: `Line ${index % 4 + 1}`, mode: index % 3 ? "MFG" : "Non-MFG", item: item[0], spec: `${item[1]} / Factory ${index % 5 + 1}`,
      purpose: index % 2 ? "SMT" : "FATP", requestAction: "New Buy", requiredDeliveryDate: missingDate ? "" : `2026-${String(9 + index % 4).padStart(2, "0")}-${String(10 + index % 18).padStart(2, "0")}`,
      quantities: quantitiesFor(index), stage, pendingOwner: OWNER[stage], nextAction: NEXT[stage], status: stage === "BUYER_HANDOFF" ? "Handoff Complete" : stage === "REQUESTER_ACTION_REQUIRED" ? "Action Required" : "In Progress",
      returnStage: stage === "REQUESTER_ACTION_REQUIRED" ? "DEPT_DRI_REVIEW" : "", assignedOm, temporaryBudget, estimatedUnitPrice: 3500000 + (index % 30) * 725000,
      pasRequired: index % 6 !== 0, pasDemandNo: ["QUOTE_VALIDATION", "OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? `PAS-${project}-${String(index % 80 + 1).padStart(4, "0")}` : "",
      pasMaterialNo: ["QUOTE_VALIDATION", "OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? `PAS-M-${80000 + index}` : "",
      vendorName: ["OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? `Demo Vendor ${index % 12 + 1}` : "", vendorNumber: ["OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? `DV-${1000 + index % 80}` : "",
      currency: "VND", unitPrice: ["OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? 4200000 + index % 20 * 350000 : "", quoteDate: "2026-08-13", quoteValidUntil: "2026-12-31", quoteReference: ["OM_HANDOFF", "BUYER_HANDOFF"].includes(stage) ? `quote-${index + 1}.png` : "",
      purRequestNo: stage === "BUYER_HANDOFF" ? `PUR-${project}-${1200 + index}` : "", budgetStatus: stage === "BUYER_HANDOFF" ? "Approved" : "Pending", budgetNo: stage === "BUYER_HANDOFF" ? `BG-${index + 1}` : "",
      prStatus: stage === "BUYER_HANDOFF" ? "Created" : "Pending", prNo: stage === "BUYER_HANDOFF" ? `PR-${index + 1}` : "", poStatus: stage === "BUYER_HANDOFF" ? "Released" : "Pending", poNo: stage === "BUYER_HANDOFF" ? `PO-${index + 1}` : "",
      etaPlan: stage === "BUYER_HANDOFF" ? "2026-11-20" : "", dtaActual: "", totalLeadTime: stage === "BUYER_HANDOFF" ? 45 : "", blockers: missingDate ? ["Required Delivery Date is missing."] : [],
      timeline: [{ id: `EVT-${index + 1}-1`, at: "2026-08-13T08:00:00.000Z", actorRole: "admin", action: "DEMO_SEEDED", fromStage: "", toStage: stage, reason: "Factory-scale DEMO seed" }],
    };
  }
  function rowsForRole(rows, role) {
    const stages = { requester: ["REQUESTER_DRAFT", "REQUESTER_ACTION_REQUIRED"], dri: ["DEPT_DRI_REVIEW"], manager: ["COST_MANAGER_REVIEW"], projectDri: ["BUDGET_EXCEPTION_REVIEW"], omLeader: ["OM_LEADER_ASSIGNMENT", "OM_PURCHASING_INTAKE", "QUOTE_VALIDATION", "OM_HANDOFF"], omMember: ["OM_PURCHASING_INTAKE", "QUOTE_VALIDATION", "OM_HANDOFF"], buyer: ["BUYER_HANDOFF"], admin: STAGES };
    return rows.filter((row) => (stages[role] || []).includes(row.stage));
  }
  function createSeedState() {
    const demands = Array.from({ length: 1248 }, (_, index) => makeDemand(index));
    return { version: 2, activeRole: "requester", activeView: Object.fromEntries(ROLE_CATALOG.map((role) => [role.id, role.nav[0]])), activeDemandId: demands[0].id, page: 1, search: "", scope: { project: "P26", line: "Line 1", mode: "MFG" }, notices: [], demands, stageCalendar: { "P26|MP": "2026-09-01", "P27|EVT": "2026-08-28" }, settings: { priceThresholdUsd: 0.4, approvalChain: "Dept DRI → Cost Manager → OM Leader", omRule: "P27/F27=Linh; others=Giang" } };
  }
  return { PHASES, ROLE_CATALOG, STAGES, OWNER, NEXT, createSeedState, visibleFieldsForRole, rowsForRole };
});
