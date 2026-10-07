// session/permissions: authoritative source; see docs/module-map.md.
import {
  adminRoleGuards
} from "../admin/permissions.js";
import {
  adminApprovalSetup
} from "../admin/state.js";
import {
  roleProfiles
} from "./config.js";
import {
  currentRole
} from "./state.js";

// @legacy-unit 399 2131
export function isOmRole(role = currentRole) {
  return globalThis.ProcurementApp?.roleGuards?.isOmRole(role)
    ?? ["om", "omLeader", "omMember", "admin"].includes(role);
}
// @end-legacy-unit 399

// @legacy-unit 400 2136
export function isOmLeaderRole(role = currentRole) {
  return globalThis.ProcurementApp?.roleGuards?.isOmLeaderRole(role)
    ?? ["omLeader", "admin"].includes(role);
}
// @end-legacy-unit 400

// @legacy-unit 401 2141
export function normalizeAdminRoleKey(role = "") {
  return adminRoleGuards().normalizeRole?.(role) || ({
    manager: "costOwner",
    dri: "deptDri",
    projectDri: "budgetApprover",
  }[role] || role || "");
}
// @end-legacy-unit 401

// @legacy-unit 402 2149
export function appRoleForAdminRoleKey(roleKey = "") {
  return adminApprovalSetup.roles.find((role) => role.roleKey === roleKey)?.appRole || roleKey;
}
// @end-legacy-unit 402

// @legacy-unit 403 2153
export function adminRoleLabelByAppRole(role = "") {
  const roleKey = normalizeAdminRoleKey(role);
  return adminApprovalSetup.roles.find((item) => item.roleKey === roleKey)?.roleName || roleProfiles[role]?.name || roleKey || "-";
}
// @end-legacy-unit 403

// @legacy-unit 404 2158
export function adminPermissionFor(role = "", moduleKey = "") {
  const roleKey = normalizeAdminRoleKey(role);
  return adminApprovalSetup.rolePermissions?.[roleKey]?.[moduleKey] || { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false };
}
// @end-legacy-unit 404
