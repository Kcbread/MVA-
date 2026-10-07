// admin/state: authoritative source; see docs/module-map.md.
import {
  adminPermissionModules,
  adminRoleDefinitions,
  defaultAdminFieldVisibilityRules,
  defaultAdminRolePermissions,
  defaultPasDemandRequirementMaster
} from "./permissions.js";
import {
  DEFAULT_OM_ASSIGNMENT_RULES
} from "../om/assignment.js";

// @legacy-unit 138 1009
export let adminApprovalSetup;
export function initializeAdminApprovalSetupBinding() {
  adminApprovalSetup = {
  thresholds: { historyPriceDeltaUsd: 0.4 },
  approvalChain: ["Dept DRI", "Budget Approver"],
  users: [
    { id: "user-a", employeeId: "V1524505", name: "Requester", email: "steven@fih-foxconn.com", department: "MFG", role: "requester", status: "active", scopeType: "department", scopeValue: "MFG", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "cost-manager", employeeId: "cost-owner", name: "Cost Manager", email: "cost-manager@fih-foxconn.com", department: "MFG", role: "manager", status: "active", scopeType: "global", scopeValue: "All cost scope", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "om-leader-mai", employeeId: "maint5", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader", status: "active", scopeType: "global", scopeValue: "All OM", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "om-member-giang", employeeId: "giangth1", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember", status: "active", scopeType: "project-mapping", scopeValue: "Assigned OM rows", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "om-member-linh", employeeId: "linhnp", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember", status: "active", scopeType: "project-mapping", scopeValue: "Assigned OM rows", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "dri-default", employeeId: "dept-dri", name: "Dept DRI", email: "dri@fih-foxconn.com", department: "MFG", role: "dri", status: "active", scopeType: "department", scopeValue: "MFG", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "project-dri-default", employeeId: "budget-approver", name: "Budget Approver", email: "budget-approver@fih-foxconn.com", department: "PMO", role: "projectDri", status: "active", scopeType: "project-mapping", scopeValue: "Temporary Budget", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
    { id: "admin-default", employeeId: "admin", name: "Admin", email: "admin@fih-foxconn.com", department: "IT", role: "admin", status: "active", scopeType: "global", scopeValue: "All", createdBy: "system-seed", createdAt: "2026-06-01T00:00:00.000Z", lastLoginAt: "" },
  ],
  roles: adminRoleDefinitions().map((role) => ({
    roleKey: role.roleKey,
    roleName: role.label,
    appRole: role.appRole,
    roleLevel: role.roleLevel,
    isSystem: Boolean(role.isSystem),
  })),
  permissionModules: adminPermissionModules(),
  rolePermissions: defaultAdminRolePermissions(),
  fieldVisibilityRules: defaultAdminFieldVisibilityRules().reduce((acc, rule) => {
    if (!acc[rule.fieldKey]) acc[rule.fieldKey] = { fieldKey: rule.fieldKey, label: rule.label, reserved: Boolean(rule.reserved), visibilityByRole: {} };
    acc[rule.fieldKey].visibilityByRole[rule.roleKey] = "visible";
    return acc;
  }, {}),
  sapPoRawImport: {
    status: null,
    preview: null,
    receipt: null,
  },
  importJobs: [],
  auditLog: [
    { id: "audit-admin-seed", createdAt: "2026-06-08T08:00:00.000Z", eventType: "admin.role_updated", actorUserId: "admin-default", actorRole: "admin", entityType: "role", entityId: "admin", ipAddress: "127.0.0.1", metadata: { source: "prototype-seed" } },
  ],
  approverMap: [
    { scope: "MFG", dri: "Dept DRI", projectDri: "Budget Approver" },
    { scope: "Computer / IT", dri: "Dept DRI", projectDri: "Budget Approver" },
    { scope: "Temporary Budget", dri: "Dept DRI", projectDri: "Budget Approver" },
  ],
  pasDemandRequirementMaster: defaultPasDemandRequirementMaster(),
  omAssignmentRules: DEFAULT_OM_ASSIGNMENT_RULES.map((rule) => ({ ...rule })),
  updatedBy: "System",
  updatedAt: "",
};
}
// @end-legacy-unit 138

// @legacy-unit 139 1055
export let adminAuditFilters;
export function initializeAdminAuditFiltersBinding() {
  adminAuditFilters = { actorUserId: "", actorRole: "", eventType: "", module: "", from: "", to: "" };
}
// @end-legacy-unit 139

// @legacy-unit 140 1056
export let OM_EXPORTED_CFA;
export function initializeOM_EXPORTED_CFABinding() {
  OM_EXPORTED_CFA = "Handed off to CFA";
}
// @end-legacy-unit 140

// @legacy-unit 141 1057
export let OM_EXPORTED_ECS;
export function initializeOM_EXPORTED_ECSBinding() {
  OM_EXPORTED_ECS = "Handed off to ECS";
}
// @end-legacy-unit 141

// @legacy-unit 142 1058
export let USER_CANCELLED_REQUEST;
export function initializeUSER_CANCELLED_REQUESTBinding() {
  USER_CANCELLED_REQUEST = "Cancelled by Requester";
}
// @end-legacy-unit 142

// @legacy-unit 143 1059
export let AMENDMENT_WAITING_OM;
export function initializeAMENDMENT_WAITING_OMBinding() {
  AMENDMENT_WAITING_OM = "Waiting OM Amendment";
}
// @end-legacy-unit 143

// @legacy-unit 144 1060
export let AMENDMENT_WAITING_USER_CONFIRM;
export function initializeAMENDMENT_WAITING_USER_CONFIRMBinding() {
  AMENDMENT_WAITING_USER_CONFIRM = "Waiting Requester Amendment Confirmation";
}
// @end-legacy-unit 144

// @legacy-unit 145 1061
export let AMENDMENT_IN_PROGRESS;
export function initializeAMENDMENT_IN_PROGRESSBinding() {
  AMENDMENT_IN_PROGRESS = "Amendment In Progress";
}
// @end-legacy-unit 145

// @legacy-unit 146 1062
export let AMENDMENT_REWORK_REQUIRED;
export function initializeAMENDMENT_REWORK_REQUIREDBinding() {
  AMENDMENT_REWORK_REQUIRED = "Amendment Rework Required";
}
// @end-legacy-unit 146

// @legacy-unit 147 1063
export let AMENDMENT_CONFIRMED;
export function initializeAMENDMENT_CONFIRMEDBinding() {
  AMENDMENT_CONFIRMED = "Amendment Confirmed";
}
// @end-legacy-unit 147

// @legacy-unit 148 1064
export let AMENDMENT_SUBMITTED;
export function initializeAMENDMENT_SUBMITTEDBinding() {
  AMENDMENT_SUBMITTED = "Submitted Amendment";
}
// @end-legacy-unit 148

// @legacy-unit 149 1065
export let AMENDMENT_APPROVED;
export function initializeAMENDMENT_APPROVEDBinding() {
  AMENDMENT_APPROVED = "Amendment Approved";
}
// @end-legacy-unit 149

// @legacy-unit 150 1066
export let AMENDMENT_REJECTED;
export function initializeAMENDMENT_REJECTEDBinding() {
  AMENDMENT_REJECTED = "Amendment Rejected";
}
// @end-legacy-unit 150

// @legacy-unit 151 1067
export let AMENDMENT_SUPERSEDED;
export function initializeAMENDMENT_SUPERSEDEDBinding() {
  AMENDMENT_SUPERSEDED = "Superseded by Amendment";
}
// @end-legacy-unit 151

// @legacy-unit 152 1068
export let AMENDMENT_REMOVED;
export function initializeAMENDMENT_REMOVEDBinding() {
  AMENDMENT_REMOVED = "Removed by Amendment";
}
// @end-legacy-unit 152

// @legacy-unit 153 1069
export let OM_EXPORT_INVALIDATED;
export function initializeOM_EXPORT_INVALIDATEDBinding() {
  OM_EXPORT_INVALIDATED = "Invalidated by Amendment";
}
// @end-legacy-unit 153

// @legacy-unit 154 1070
export let OM_QUOTE_REVIEW_REQUIRED;
export function initializeOM_QUOTE_REVIEW_REQUIREDBinding() {
  OM_QUOTE_REVIEW_REQUIRED = "Quote Review Required";
}
// @end-legacy-unit 154

// @legacy-unit 155 1071
export let OM_EXTERNAL_PENDING;
export function initializeOM_EXTERNAL_PENDINGBinding() {
  OM_EXTERNAL_PENDING = "External Review Pending";
}
// @end-legacy-unit 155

// @legacy-unit 156 1072
export let OM_EXTERNAL_ACCEPTED;
export function initializeOM_EXTERNAL_ACCEPTEDBinding() {
  OM_EXTERNAL_ACCEPTED = "External Accepted";
}
// @end-legacy-unit 156

// @legacy-unit 157 1073
export let OM_REJECTED_TO_DRI;
export function initializeOM_REJECTED_TO_DRIBinding() {
  OM_REJECTED_TO_DRI = "Rejected to DRI";
}
// @end-legacy-unit 157

// @legacy-unit 158 1074
export let ROUTE_REUSE;
export function initializeROUTE_REUSEBinding() {
  ROUTE_REUSE = "Sourcing - RFQ Required";
}
// @end-legacy-unit 158

// @legacy-unit 159 1075
export let ROUTE_REQUOTE;
export function initializeROUTE_REQUOTEBinding() {
  ROUTE_REQUOTE = "Sourcing - RFQ Required";
}
// @end-legacy-unit 159

// @legacy-unit 160 1076
export let ROUTE_SOURCING;
export function initializeROUTE_SOURCINGBinding() {
  ROUTE_SOURCING = "Sourcing - New Material";
}
// @end-legacy-unit 160

// @legacy-unit 161 1077
export let QUOTE_EXCEPTION_NOTE;
export function initializeQUOTE_EXCEPTION_NOTEBinding() {
  QUOTE_EXCEPTION_NOTE = "Quote data update required";
}
// @end-legacy-unit 161

// @legacy-unit 162 1078
export let OM_EXCHANGE_RATE_VND_USD;
export function initializeOM_EXCHANGE_RATE_VND_USDBinding() {
  OM_EXCHANGE_RATE_VND_USD = 26188;
}
// @end-legacy-unit 162

// @legacy-unit 163 1079
export let DEFAULT_EXCHANGE_RATE_MONTH;
export function initializeDEFAULT_EXCHANGE_RATE_MONTHBinding() {
  DEFAULT_EXCHANGE_RATE_MONTH = "2026-05";
}
// @end-legacy-unit 163

// @legacy-unit 164 1080
export let OM_PAYMENT_METHOD;
export function initializeOM_PAYMENT_METHODBinding() {
  OM_PAYMENT_METHOD = "MVA";
}
// @end-legacy-unit 164

// @legacy-unit 165 1081
export let OM_COST_TYPE_EXPENSE;
export function initializeOM_COST_TYPE_EXPENSEBinding() {
  OM_COST_TYPE_EXPENSE = "Expense";
}
// @end-legacy-unit 165

// @legacy-unit 166 1082
export let OM_COST_TYPE_CAPEX;
export function initializeOM_COST_TYPE_CAPEXBinding() {
  OM_COST_TYPE_CAPEX = "Capex";
}
// @end-legacy-unit 166

// @legacy-unit 167 1083
export let OM_COST_TYPE_TARGET_MAP;
export function initializeOM_COST_TYPE_TARGET_MAPBinding() {
  OM_COST_TYPE_TARGET_MAP = {
  [OM_COST_TYPE_EXPENSE]: "ECS",
  [OM_COST_TYPE_CAPEX]: "CFA",
};
}
// @end-legacy-unit 167

// @legacy-unit 168 1087
export let OM_DEPARTMENT_CODE;
export function initializeOM_DEPARTMENT_CODEBinding() {
  OM_DEPARTMENT_CODE = "R3S4C5VN";
}
// @end-legacy-unit 168

// @legacy-unit 169 1088
export let PAS_LEGAL_NAME;
export function initializePAS_LEGAL_NAMEBinding() {
  PAS_LEGAL_NAME = "A0S4015 | FUSHAN TECHNOLOGY (VIETNAM) LIMITED LIABILITY COMPANY";
}
// @end-legacy-unit 169

// @legacy-unit 170 1089
export let PAS_REQUEST_DEPT;
export function initializePAS_REQUEST_DEPTBinding() {
  PAS_REQUEST_DEPT = "R3S4C5VN-IDM1";
}
// @end-legacy-unit 170

// @legacy-unit 171 1090
export let PAS_DATA_TRANSFER_TO;
export function initializePAS_DATA_TRANSFER_TOBinding() {
  PAS_DATA_TRANSFER_TO = "Vietnam ASSET";
}
// @end-legacy-unit 171

// @legacy-unit 172 1091
export let OM_REQUESTOR;
export function initializeOM_REQUESTORBinding() {
  OM_REQUESTOR = "OM Purchasing";
}
// @end-legacy-unit 172

// @legacy-unit 173 1092
export let OM_CONTACT;
export function initializeOM_CONTACTBinding() {
  OM_CONTACT = "";
}
// @end-legacy-unit 173

// @legacy-unit 174 1093
export let RFQ_REPLY_BUSINESS_DAYS;
export function initializeRFQ_REPLY_BUSINESS_DAYSBinding() {
  RFQ_REPLY_BUSINESS_DAYS = 5;
}
// @end-legacy-unit 174

// @legacy-unit 175 1094
export let RFQ_OVERDUE_GRACE_DAYS;
export function initializeRFQ_OVERDUE_GRACE_DAYSBinding() {
  RFQ_OVERDUE_GRACE_DAYS = 2;
}
// @end-legacy-unit 175

// @legacy-unit 176 1095
export let BUYER_RECEIVED;
export function initializeBUYER_RECEIVEDBinding() {
  BUYER_RECEIVED = "Buyer Accepted Handoff";
}
// @end-legacy-unit 176

// @legacy-unit 177 1096
export let BUYER_BLOCKED;
export function initializeBUYER_BLOCKEDBinding() {
  BUYER_BLOCKED = "Blocked";
}
// @end-legacy-unit 177

// @legacy-unit 178 1097
export let BUYER_PR_CREATED;
export function initializeBUYER_PR_CREATEDBinding() {
  BUYER_PR_CREATED = "PR Created";
}
// @end-legacy-unit 178

// @legacy-unit 179 1098
export let BUYER_PO_ISSUED;
export function initializeBUYER_PO_ISSUEDBinding() {
  BUYER_PO_ISSUED = "PO Issued";
}
// @end-legacy-unit 179

// @legacy-unit 180 1099
export let BUYER_COMPLETED;
export function initializeBUYER_COMPLETEDBinding() {
  BUYER_COMPLETED = "Completed";
}
// @end-legacy-unit 180

// @legacy-unit 181 1100
export let BUYER_RETURNED;
export function initializeBUYER_RETURNEDBinding() {
  BUYER_RETURNED = "Rejected to DRI";
}
// @end-legacy-unit 181

// @legacy-unit 182 1101
export let EXT_PACKAGE_PREPARING;
export function initializeEXT_PACKAGE_PREPARINGBinding() {
  EXT_PACKAGE_PREPARING = "Package Preparing";
}
// @end-legacy-unit 182

// @legacy-unit 183 1102
export let EXT_PACKAGE_READY;
export function initializeEXT_PACKAGE_READYBinding() {
  EXT_PACKAGE_READY = "Package Ready";
}
// @end-legacy-unit 183

// @legacy-unit 184 1103
export let EXT_SUBMITTED;
export function initializeEXT_SUBMITTEDBinding() {
  EXT_SUBMITTED = "Submitted to External System";
}
// @end-legacy-unit 184

// @legacy-unit 185 1104
export let EXT_REVIEW;
export function initializeEXT_REVIEWBinding() {
  EXT_REVIEW = "External Review";
}
// @end-legacy-unit 185

// @legacy-unit 186 1105
export let EXT_ACCEPTED;
export function initializeEXT_ACCEPTEDBinding() {
  EXT_ACCEPTED = "External Accepted";
}
// @end-legacy-unit 186

// @legacy-unit 187 1106
export let EXT_BLOCKED;
export function initializeEXT_BLOCKEDBinding() {
  EXT_BLOCKED = "Blocked";
}
// @end-legacy-unit 187

// @legacy-unit 188 1107
export let EXT_REJECTED_DRI;
export function initializeEXT_REJECTED_DRIBinding() {
  EXT_REJECTED_DRI = "Rejected to DRI";
}
// @end-legacy-unit 188

// @legacy-unit 189 1108
export let EXT_PR_CREATED;
export function initializeEXT_PR_CREATEDBinding() {
  EXT_PR_CREATED = "PR Created";
}
// @end-legacy-unit 189

// @legacy-unit 190 1109
export let EXT_PO_ISSUED;
export function initializeEXT_PO_ISSUEDBinding() {
  EXT_PO_ISSUED = "PO Issued";
}
// @end-legacy-unit 190

// @legacy-unit 191 1110
export let EXT_COMPLETED;
export function initializeEXT_COMPLETEDBinding() {
  EXT_COMPLETED = "Completed";
}
// @end-legacy-unit 191

// @legacy-unit 192 1111
export let EXT_CANCELLED;
export function initializeEXT_CANCELLEDBinding() {
  EXT_CANCELLED = "Cancelled";
}
// @end-legacy-unit 192

// @legacy-unit 193 1112
export let EXTERNAL_PROGRESS_STATUSES;
export function initializeEXTERNAL_PROGRESS_STATUSESBinding() {
  EXTERNAL_PROGRESS_STATUSES = [
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
}
// @end-legacy-unit 193

// @legacy-unit 194 1125
export let PAS_NOT_REQUIRED;
export function initializePAS_NOT_REQUIREDBinding() {
  PAS_NOT_REQUIRED = "PAS Not Required";
}
// @end-legacy-unit 194

export function replaceAdminApprovalSetupBinding(value) { adminApprovalSetup = value; return value; }
