// session/config: authoritative source; see docs/module-map.md.


// @legacy-unit 66 446
export let roleProfiles;
export function initializeRoleProfilesBinding() {
  roleProfiles = {
  requester: { name: "Requester", dept: "MFG", functionName: "Demand Requester", defaultView: "department" },
  manager: { name: "Cost Manager", dept: "MFG", functionName: "Cost Review", defaultView: "manager" },
  procurement: { name: "MFG Coordinator", dept: "MFG", functionName: "MFG Demand Coordination", defaultView: "procurement" },
  om: { name: "OM Purchasing", dept: "Operations", functionName: "Quotation & OM Handoff", defaultView: "om" },
  omLeader: { name: "OM Leader", dept: "Operations", functionName: "OM Progress Review / Project Stage Calendar", defaultView: "omLeaderProgress" },
  omMember: { name: "OM Purchasing", dept: "Operations", functionName: "PAS / Quote / Handoff Operator", defaultView: "om" },
  dri: { name: "Dept DRI", dept: "MFG", functionName: "Dept Review", defaultView: "manager" },
  projectDri: { name: "Budget Approver", dept: "PMO", functionName: "Budget Review", defaultView: "manager" },
  sourcing: { name: "Sourcing", dept: "Supply Chain", functionName: "RFQ Quotation", defaultView: "sourcing" },
  buyer: { name: "Buyer", dept: "Supply Chain", functionName: "External PR / PO Tracking", defaultView: "buyer" },
  admin: { name: "Admin", dept: "IT", functionName: "System Admin", defaultView: "adminSetup" },
};
}
// @end-legacy-unit 66

// @legacy-unit 67 460
export let roleCapabilityMatrix;
export function initializeRoleCapabilityMatrixBinding() {
  roleCapabilityMatrix = [
  {
    role: "Requester",
    owns: "Creates demand, draft, submit, revise",
    canApprove: "No",
    canOperate: "Add item/spec, edit phase qty, save draft, submit, create warehouse candidate",
    visibility: "Own scope status; no vendor, PAS material, factory material, OM assignee, FTV",
    nextAction: "Fix Action Required rows or wait for pending owner",
  },
  {
    role: "Dept DRI",
    owns: "Department submission review",
    canApprove: "Approve / reject requester submission and price escalation first gate",
    canOperate: "Review reason, send approved rows forward, return rejected rows to Requester",
    visibility: "Department scope and decision evidence",
    nextAction: "Approve, reject with reason, or clarify department scope",
  },
  {
    role: "Cost Manager",
    owns: "P&L cost visibility and final authorization",
    canApprove: "Approve / deny / revise after Dept DRI",
    canOperate: "Approve, deny, or return Dept DRI approved rows with scoped evidence",
    visibility: "Cost, qty, phase/unit/station analysis; no OM quote operation forms",
    nextAction: "Approve, deny, revise with reason, or inspect Station Matrix",
  },
  {
    role: "OM Leader",
    owns: "OM progress governance, assignment, project stage calendar",
    canApprove: "No business approval",
    canOperate: "Assign / monitor OM rows and maintain project stage calendar",
    visibility: "Demand progress, OM exceptions, assignee, PR / PO summary, delivery risk, stage dates",
    nextAction: "Assign stuck rows, review SLA risk, and maintain line-open date baseline",
  },
  {
    role: "OM Purchasing",
    owns: "Assigned PAS / quote / OM handoff work",
    canApprove: "No business approval",
    canOperate: "Enter PAS Demand No, quote result, quote validity, quote files, OM handoff",
    visibility: "Assigned rows only, supplier/PAS fields required for work",
    nextAction: "Complete missing quote fields or move confirmed rows to OM handoff",
  },
  {
    role: "Budget Approver",
    owns: "Budget approval for escalated price/temporary budget",
    canApprove: "Approve / reject budget escalation",
    canOperate: "Review escalation evidence and decision history",
    visibility: "Escalation scope, estimate vs quote, threshold reason",
    nextAction: "Approve budget or reject with reason",
  },
  {
    role: "Buyer Handoff",
    owns: "PR / PO after OM handoff",
    canApprove: "No upstream approval",
    canOperate: "Track external PR / PO status, evidence, block reason",
    visibility: "OM handoff scope and external purchasing progress",
    nextAction: "Record PR / PO progress or blocker",
  },
  {
    role: "Admin",
    owns: "Governance setup, account lifecycle, RBAC, sensitive field access, audit",
    canApprove: "No business approval by role",
    canOperate: "Create / activate / deactivate users, manage role permissions, export audit",
    visibility: "Global governance views and sensitive setup only",
    nextAction: "Keep setup aligned with locked decisions and maintain audit traceability",
  },
];
}
// @end-legacy-unit 67

// @legacy-unit 91 874
export let testLoginRoleAccounts;
export function initializeTestLoginRoleAccountsBinding() {
  testLoginRoleAccounts = {
  requester: "V1524505",
  dri: "dept-dri",
  omLeader: "maint5",
  omMember: "giangth1",
  manager: "cost-owner",
  projectDri: "budget-approver",
  buyer: "buyer-handoff",
  admin: "admin",
};
}
// @end-legacy-unit 91
