

function roleKeyFromAppRole(role) {
  return {
    manager: "costOwner",
    dri: "deptDri",
    projectDri: "budgetApprover",
  }[role] || role || "";
}

function canAdminGovern(user) {
  return roleKeyFromAppRole(user?.role) === "admin";
}

function canAssignOm(user) {
  return ["omLeader", "admin"].includes(user?.role);
}

function canViewOm(user) {
  return ["omLeader", "omMember", "om", "admin"].includes(user?.role);
}

function canMaintainProjectStageCalendar(user) {
  return ["omLeader", "admin"].includes(user?.role);
}

function canMaintainOmProcurementTracking(user) {
  return ["omMember", "admin"].includes(user?.role);
}

function canViewOmLeaderConsole(user) {
  return ["omLeader", "admin"].includes(user?.role);
}

function canViewWorkflowReviewRows(user) {
  return ["dri", "manager", "projectDri", "admin"].includes(user?.role);
}

function canUploadAttachment(user, attachment) {
  if (!user) return false;
  if (attachment.linkedEntityType === "om_quote" || attachment.attachmentKind.startsWith("om_") || attachment.attachmentKind.startsWith("sourcing_")) {
    return canViewOm(user);
  }
  if (attachment.linkedEntityType === "procurement_quote" || attachment.attachmentKind.startsWith("procurement_")) {
    return user.role !== "requester";
  }
  return ["admin", "omLeader"].includes(user.role);
}

function canDownloadAttachment(user, attachment) {
  if (!user || !attachment) return false;
  if (["admin", "omLeader"].includes(user.role)) return true;
  if (attachment.uploadedByUserId === user.id) return true;
  if (attachment.linkedEntityType === "procurement_quote") return user.role !== "requester";
  if (attachment.visibilityScope === "om_internal" || attachment.linkedEntityType === "om_quote") return canViewOm(user);
  return false;
}

module.exports = { roleKeyFromAppRole, canAdminGovern, canAssignOm, canViewOm, canMaintainProjectStageCalendar, canMaintainOmProcurementTracking, canViewOmLeaderConsole, canViewWorkflowReviewRows, canUploadAttachment, canDownloadAttachment };
