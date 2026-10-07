// admin/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  createAdminRoleFromForm,
  createAdminUserFromForm,
  exportAdminAuditLog,
  exportAdminUsers,
  importAdminUsersFromTextarea,
  renderAdminAuditLog,
  saveAdminApprovalSetup,
  updateAdminUserStatusAction
} from "./setup.js";

export function handleClickSaveAdminApprovalSetup(action) {
  if (action === "saveAdminApprovalSetup") saveAdminApprovalSetup();
}

export function handleClickCreateAdminUser(action) {
  if (action === "createAdminUser") createAdminUserFromForm();
  if (action === "createAdminRole") createAdminRoleFromForm();
}

export function handleClickImportAdminUsers(action) {
  if (action === "importAdminUsers") importAdminUsersFromTextarea();
  if (action === "exportAdminUsers") exportAdminUsers();
  if (action === "exportAdminAuditLog") exportAdminAuditLog();
  if (action === "refreshAdminAudit") renderAdminAuditLog();
}

export function handleClickAdminUserStatusButton(adminUserStatusButton) {
  if (adminUserStatusButton) updateAdminUserStatusAction(adminUserStatusButton.dataset.adminUserStatus, adminUserStatusButton.dataset.adminStatusValue || "inactive");
}
