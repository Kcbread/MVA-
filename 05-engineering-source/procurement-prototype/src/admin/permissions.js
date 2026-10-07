// admin/permissions: authoritative source; see docs/module-map.md.
import {
  adminApprovalSetup
} from "./state.js";
import {
  omBusinessFlowModule
} from "../infrastructure/module-adapters.js";
import {
  roleCapabilityMatrix
} from "../session/config.js";
import {
  htmlText
} from "../shared/html.js";

// @legacy-unit 130 950
export function adminRoleGuards() {
  return globalThis.ProcurementApp?.roleGuards || {};
}
// @end-legacy-unit 130

// @legacy-unit 131 954
export function adminRoleDefinitions() {
  return adminRoleGuards().roleDefinitions?.() || [
    { roleKey: "requester", label: "Requester", appRole: "requester", roleLevel: "business", isSystem: true },
    { roleKey: "costOwner", label: "Cost Owner", appRole: "manager", roleLevel: "business", isSystem: true },
    { roleKey: "omLeader", label: "OM Leader", appRole: "omLeader", roleLevel: "operations", isSystem: true },
    { roleKey: "omMember", label: "OM Purchasing", appRole: "omMember", roleLevel: "operations", isSystem: true },
    { roleKey: "deptDri", label: "Dept DRI", appRole: "dri", roleLevel: "approval", isSystem: true },
    { roleKey: "budgetApprover", label: "Budget Approver", appRole: "projectDri", roleLevel: "approval", isSystem: true },
    { roleKey: "admin", label: "System Admin", appRole: "admin", roleLevel: "governance", isSystem: true },
  ];
}
// @end-legacy-unit 131

// @legacy-unit 132 966
export function adminPermissionModules() {
  return adminRoleGuards().permissionModules?.() || [
    { moduleKey: "admin.users", label: "User Lifecycle" },
    { moduleKey: "admin.roles", label: "Role & Permission" },
    { moduleKey: "admin.fields", label: "Sensitive Field Access" },
    { moduleKey: "admin.audit", label: "Audit Log" },
  ];
}
// @end-legacy-unit 132

// @legacy-unit 133 975
export function defaultAdminRolePermissions() {
  return adminRoleGuards().defaultRolePermissions?.() || {};
}
// @end-legacy-unit 133

// @legacy-unit 134 979
export function defaultAdminFieldVisibilityRules() {
  return adminRoleGuards().defaultFieldVisibilityRules?.() || [];
}
// @end-legacy-unit 134

// @legacy-unit 135 983
export function defaultPasDemandRequirementMaster() {
  return (omBusinessFlowModule().PAS_DEMAND_REQUIREMENT_MASTER || []).map((record) => ({
    ...record,
    matchKeywords: Array.isArray(record.matchKeywords) ? [...record.matchKeywords] : record.matchKeywords,
  }));
}
// @end-legacy-unit 135

// @legacy-unit 136 990
export function normalizeAdminPasDemandRequirementRecord(record = {}) {
  return omBusinessFlowModule().normalizePasDemandRequirementMasterRecord?.(record) || {
    id: String(record.id || record.masterRecordId || "").trim(),
    itemCategory: String(record.itemCategory || record.category || record.label || "").trim(),
    matchKeywords: Array.isArray(record.matchKeywords) ? record.matchKeywords : String(record.matchKeywords || record.keywords || "").split(","),
    pasDemandRequired: Boolean(record.pasDemandRequired ?? record.pas_demand_required),
    active: record.active !== false,
    ownerRole: String(record.ownerRole || record.owner_role || "OM Purchasing").trim(),
    note: String(record.note || "").trim(),
  };
}
// @end-legacy-unit 136

// @legacy-unit 137 1002
export function pasDemandRequirementMasterRows() {
  const rows = adminApprovalSetup?.pasDemandRequirementMaster?.length
    ? adminApprovalSetup.pasDemandRequirementMaster
    : defaultPasDemandRequirementMaster();
  return rows.map(normalizeAdminPasDemandRequirementRecord);
}
// @end-legacy-unit 137

// @legacy-unit 495 3412
export function renderRoleCapabilityMatrix() {
  const target = document.getElementById("adminRoleMatrix");
  if (!target) return;
  target.innerHTML = `
    <div class="table-wrap role-matrix-wrap">
      <table class="data-table role-capability-table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Owns</th>
            <th>Approve / Reject</th>
            <th>Can Operate</th>
            <th>Visibility Boundary</th>
            <th>Primary Next Action</th>
          </tr>
        </thead>
        <tbody>
          ${roleCapabilityMatrix.map((row) => `
            <tr>
              <td><strong>${htmlText(row.role)}</strong></td>
              <td>${htmlText(row.owns)}</td>
              <td>${htmlText(row.canApprove)}</td>
              <td>${htmlText(row.canOperate)}</td>
              <td>${htmlText(row.visibility)}</td>
              <td>${htmlText(row.nextAction)}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 495
