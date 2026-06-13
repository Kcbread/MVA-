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

  const ROLE_DEFINITIONS = [
    { roleKey: "requester", label: "Requester", appRole: "requester", roleLevel: "business", isSystem: true },
    { roleKey: "costOwner", label: "Cost Owner", appRole: "manager", roleLevel: "business", isSystem: true },
    { roleKey: "omLeader", label: "OM Leader", appRole: "omLeader", roleLevel: "operations", isSystem: true },
    { roleKey: "omMember", label: "OM Purchasing", appRole: "omMember", roleLevel: "operations", isSystem: true },
    { roleKey: "deptDri", label: "Dept DRI", appRole: "dri", roleLevel: "approval", isSystem: true },
    { roleKey: "budgetApprover", label: "Budget Approver", appRole: "projectDri", roleLevel: "approval", isSystem: true },
    { roleKey: "admin", label: "System Admin", appRole: "admin", roleLevel: "governance", isSystem: true },
  ];

  const PERMISSION_MODULES = [
    { moduleKey: "admin.users", label: "User Lifecycle" },
    { moduleKey: "admin.mapping", label: "Mapping / Scope" },
    { moduleKey: "admin.user_scope", label: "User Scope" },
    { moduleKey: "admin.roles", label: "Role & Permission" },
    { moduleKey: "admin.fields", label: "Sensitive Field Access" },
    { moduleKey: "admin.audit", label: "Audit Log" },
  ];

  const DEFAULT_ROLE_PERMISSIONS = {
    requester: {
      "admin.users": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.mapping": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.user_scope": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.roles": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.fields": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
    },
    costOwner: {
      "admin.users": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.mapping": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.user_scope": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.roles": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.fields": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
    },
    omLeader: {
      "admin.users": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.mapping": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.user_scope": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.roles": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.fields": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
    },
    omMember: {
      "admin.users": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.mapping": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.user_scope": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.roles": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.fields": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
    },
    deptDri: {
      "admin.users": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.mapping": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.user_scope": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.roles": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.fields": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
    },
    budgetApprover: {
      "admin.users": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.mapping": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.user_scope": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.roles": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.fields": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: false, canExport: false },
    },
    admin: {
      "admin.users": { canCreate: true, canUpdate: true, canDelete: true, canView: true, canExport: true },
      "admin.mapping": { canCreate: true, canUpdate: true, canDelete: false, canView: true, canExport: true },
      "admin.user_scope": { canCreate: false, canUpdate: true, canDelete: false, canView: true, canExport: true },
      "admin.roles": { canCreate: true, canUpdate: true, canDelete: true, canView: true, canExport: true },
      "admin.fields": { canCreate: true, canUpdate: true, canDelete: true, canView: true, canExport: true },
      "admin.audit": { canCreate: false, canUpdate: false, canDelete: false, canView: true, canExport: true },
    },
  };

  const DEFAULT_FIELD_VISIBILITY_RULES = [
    { fieldKey: "costPrice", label: "Cost Price", reserved: false, visibleRoles: ["costOwner", "deptDri", "budgetApprover", "admin"] },
    { fieldKey: "vendor", label: "Vendor", reserved: false, visibleRoles: ["omLeader", "omMember", "admin"] },
    { fieldKey: "pasMaterialNo", label: "PAS Material No", reserved: false, visibleRoles: ["omLeader", "omMember", "admin"] },
    { fieldKey: "factoryMaterialNo", label: "Factory Material No", reserved: false, visibleRoles: ["omLeader", "omMember", "admin"] },
    { fieldKey: "sapMaterialNo", label: "SAP Material No", reserved: false, visibleRoles: ["omLeader", "omMember", "admin"] },
    { fieldKey: "omAssignee", label: "OM Assignee", reserved: false, visibleRoles: ["omLeader", "admin"] },
    { fieldKey: "employeeSalary", label: "Employee Salary", reserved: true, visibleRoles: ["admin"] },
  ];

  function normalizeRole(role) {
    return ROLE_ALIASES[role] || role || "";
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function roleDefinitions() {
    return cloneJson(ROLE_DEFINITIONS);
  }

  function permissionModules() {
    return cloneJson(PERMISSION_MODULES);
  }

  function defaultRolePermissions() {
    return cloneJson(DEFAULT_ROLE_PERMISSIONS);
  }

  function defaultFieldVisibilityRules() {
    return cloneJson(DEFAULT_FIELD_VISIBILITY_RULES);
  }

  function permissionRecordForRole(role, permissionsByRole = DEFAULT_ROLE_PERMISSIONS) {
    const normalizedRole = normalizeRole(role);
    return cloneJson(permissionsByRole[normalizedRole] || {});
  }

  function canPerform(role, moduleKey, action, permissionsByRole = DEFAULT_ROLE_PERMISSIONS) {
    const normalizedRole = normalizeRole(role);
    const actionKey = {
      create: "canCreate",
      update: "canUpdate",
      delete: "canDelete",
      view: "canView",
      export: "canExport",
    }[action];
    if (!actionKey) return false;
    return Boolean(permissionsByRole?.[normalizedRole]?.[moduleKey]?.[actionKey]);
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

  function canViewCostAnalytics(role, scopeMode = "full") {
    const normalizedRole = normalizeRole(role);
    if (["deptDri", "budgetApprover"].includes(normalizedRole)) return scopeMode === "priceReviewScoped";
    return isCostOwnerRole(normalizedRole) || isAdminRole(normalizedRole);
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

  function fieldVisibility(role, fieldRules = DEFAULT_FIELD_VISIBILITY_RULES) {
    const normalizedRole = normalizeRole(role);
    const visibleRule = (fieldKey, fallback) => {
      const rule = (fieldRules || []).find((item) => item.fieldKey === fieldKey);
      if (!rule) return fallback;
      return Array.isArray(rule.visibleRoles) ? rule.visibleRoles.includes(normalizedRole) : fallback;
    };
    const internal = canViewInternalProcurementFields(normalizedRole);
    return {
      showCostPrice: visibleRule("costPrice", ["costOwner", "deptDri", "budgetApprover", "admin"].includes(normalizedRole)),
      showVendor: visibleRule("vendor", internal),
      showPasMaterial: visibleRule("pasMaterialNo", internal),
      showFactoryMaterial: visibleRule("factoryMaterialNo", internal),
      showSapMaterial: visibleRule("sapMaterialNo", internal),
      showOmAssignee: visibleRule("omAssignee", ["omLeader", "admin"].includes(normalizedRole)),
      showEmployeeSalary: visibleRule("employeeSalary", normalizedRole === "admin"),
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
    roleDefinitions,
    permissionModules,
    defaultRolePermissions,
    defaultFieldVisibilityRules,
    permissionRecordForRole,
    canPerform,
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
