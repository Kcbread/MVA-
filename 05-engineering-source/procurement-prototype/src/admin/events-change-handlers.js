// admin/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderAdminAuditLog,
  updateAdminFieldVisibility,
  updateAdminRolePermission,
  updateAdminUserField
} from "./setup.js";
import {
  adminAuditFilters
} from "./state.js";

export function handleChangeAdminUserField(adminUserField, adminUserId, event) {
  if (adminUserField && adminUserId) {
    updateAdminUserField(adminUserId, adminUserField, event.target.value);
  }
}

export function handleChangeAdminRolePermission(adminRolePermission, adminModuleKey, adminPermissionKey, event) {
  if (adminRolePermission && adminModuleKey && adminPermissionKey) {
    updateAdminRolePermission(adminRolePermission, adminModuleKey, adminPermissionKey, Boolean(event.target.checked));
  }
}

export function handleChangeAdminFieldKey(adminFieldKey, adminRoleVisibility, event) {
  if (adminFieldKey && adminRoleVisibility) {
    updateAdminFieldVisibility(adminFieldKey, adminRoleVisibility, Boolean(event.target.checked));
  }
  if (event.target.dataset.adminAuditFilter) {
    adminAuditFilters[event.target.dataset.adminAuditFilter] = event.target.value;
    renderAdminAuditLog();
  }
}
