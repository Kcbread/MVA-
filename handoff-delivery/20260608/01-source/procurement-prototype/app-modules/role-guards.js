(function registerRoleGuardsModule(root) {
  const ROLE_ALIASES = {
    manager: "costOwner",
    costOwner: "costOwner",
    requester: "requester",
    dri: "deptDri",
    deptDri: "deptDri",
    projectDri: "budgetApprover",
    budgetApprover: "budgetApprover",
    om: "omLeader",
    omLeader: "omLeader",
    omMember: "omMember",
    admin: "admin",
  };

  function normalizeRole(role) {
    return ROLE_ALIASES[role] || role || "";
  }

  function isRequesterRole(role) {
    return normalizeRole(role) === "requester";
  }

  function isDeptDriRole(role) {
    return normalizeRole(role) === "deptDri";
  }

  function isBudgetApproverRole(role) {
    return normalizeRole(role) === "budgetApprover";
  }

  function isCostOwnerRole(role) {
    return normalizeRole(role) === "costOwner";
  }

  function isAdminRole(role) {
    return normalizeRole(role) === "admin";
  }

  function isOmRole(role) {
    return ["omLeader", "omMember", "admin"].includes(normalizeRole(role));
  }

  function isOmLeaderRole(role) {
    return ["omLeader", "admin"].includes(normalizeRole(role));
  }

  function canCreateDemand(role) {
    return isRequesterRole(role);
  }

  function canSubmitDemand(role) {
    return isRequesterRole(role);
  }

  function canDeptDriReview(role) {
    return isDeptDriRole(role);
  }

  function canBudgetApprove(role) {
    return isBudgetApproverRole(role);
  }

  function canViewCostAnalytics(role) {
    return isCostOwnerRole(role) || isAdminRole(role);
  }

  function canCostManagerAuthorize(role) {
    return isCostOwnerRole(role);
  }

  function canAssignOm(role) {
    return isOmLeaderRole(role);
  }

  function canMaintainExchangeRate(role) {
    return isOmLeaderRole(role);
  }

  function canTriageFeedback(role) {
    return isOmLeaderRole(role);
  }

  function canAdminSetup(role) {
    return isAdminRole(role);
  }

  function canViewWorkflowStatus(role) {
    return Boolean(normalizeRole(role));
  }

  function canViewInternalProcurementFields(role) {
    return ["omLeader", "omMember", "admin"].includes(normalizeRole(role));
  }

  function fieldVisibility(role) {
    const normalizedRole = normalizeRole(role);
    const internal = canViewInternalProcurementFields(normalizedRole);
    return {
      showVendor: internal,
      showPasMaterial: internal,
      showFactoryMaterial: internal,
      showOmAssignee: ["omLeader", "admin"].includes(normalizedRole),
      showCostImpact: canViewCostAnalytics(normalizedRole) || ["deptDri", "budgetApprover"].includes(normalizedRole),
      showBusinessApprovalActions: ["deptDri", "budgetApprover"].includes(normalizedRole),
      showCostManagerAuthorizationActions: canCostManagerAuthorize(normalizedRole),
      showOmActions: ["omMember", "admin"].includes(normalizedRole),
      showAdminSetup: canAdminSetup(normalizedRole),
    };
  }

  function canOperateOmRow({ role, assignment, currentUserId }) {
    if (!isOmRole(role)) return false;
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === "admin") return true;
    if (normalizedRole === "omLeader") return false;
    return Boolean(assignment?.assignedToUserId && assignment.assignedToUserId === currentUserId);
  }

  function omRowAccessReason({ canOperate, assigneeName }) {
    if (canOperate) return "";
    if (!assigneeName) return "Waiting OM Leader assignment.";
    return `Assigned to ${assigneeName}.`;
  }

  const api = {
    normalizeRole,
    isRequesterRole,
    isDeptDriRole,
    isBudgetApproverRole,
    isCostOwnerRole,
    isAdminRole,
    isOmRole,
    isOmLeaderRole,
    canCreateDemand,
    canSubmitDemand,
    canDeptDriReview,
    canBudgetApprove,
    canViewCostAnalytics,
    canCostManagerAuthorize,
    canAssignOm,
    canMaintainExchangeRate,
    canTriageFeedback,
    canAdminSetup,
    canViewWorkflowStatus,
    canViewInternalProcurementFields,
    fieldVisibility,
    canOperateOmRow,
    omRowAccessReason,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.roleGuards = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
