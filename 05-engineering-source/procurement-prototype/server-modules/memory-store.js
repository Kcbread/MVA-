

function createMemoryStore() {
  const uatUsers = [
    { id: "om-leader-mai", employee_id: "maint5", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader", project_family: "Mixed", project_codes: "All OM", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
    { id: "om-member-giang", employee_id: "giangth1", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember", project_family: "Mixed", project_codes: "Assigned OM rows", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
    { id: "om-member-linh", employee_id: "linhnp", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember", project_family: "Mixed", project_codes: "Assigned OM rows", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
    { id: "admin-default", employee_id: "admin", name: "Admin", email: "admin@fih-foxconn.com", department: "IT", role: "admin", project_family: "Mixed", project_codes: "All", responsibility_department: "System Admin", password_hash: "plain:123", is_active: 1 },
    { id: "cost-owner", employee_id: "cost-owner", name: "Cost Owner", email: "cost-owner@fih-foxconn.com", department: "MFG", role: "manager", project_family: "Mixed", project_codes: "All cost scope", responsibility_department: "Cost Owner", password_hash: "plain:123", is_active: 1 },
    { id: "requester-v1524505", employee_id: "V1524505", name: "To Thi Phuong Anh", email: "anhttp@fih-foxconn.com", department: "MFG", role: "requester", project_family: "G", project_codes: "P26 Demo Line,P26,P27", responsibility_department: "MFG", password_hash: "plain:123", is_active: 1 },
    { id: "requester-v1547168", employee_id: "V1547168", name: "Dang Thi Ban", email: "bandt1@fih-foxconn.com", department: "MFG", role: "requester", project_family: "Non-G", project_codes: "LD8,MH2,BM2,SSF,ML2,MA4", responsibility_department: "MFG", password_hash: "plain:123", is_active: 1 },
    { id: "dept-dri-default", employee_id: "dept-dri", name: "Dept DRI", email: "dept-dri@fih-foxconn.com", department: "MFG", role: "dri", project_family: "Mixed", project_codes: "Escalation scope", responsibility_department: "Dept DRI", password_hash: "plain:123", is_active: 1 },
    { id: "budget-approver-default", employee_id: "budget-approver", name: "Budget Approver", email: "budget-approver@fih-foxconn.com", department: "PMO", role: "projectDri", project_family: "Mixed", project_codes: "Budget approval scope", responsibility_department: "Budget Approver", password_hash: "plain:123", is_active: 1 },
    { id: "buyer-handoff-default", employee_id: "buyer-handoff", name: "Buyer Handoff", email: "buyer-handoff@fih-foxconn.com", department: "Supply Chain", role: "buyer", project_family: "Mixed", project_codes: "Buyer handoff scope", responsibility_department: "Buyer Handoff", password_hash: "plain:123", is_active: 1 },
  ];
  
  const testLoginRoleIdentifiers = {
    requester: "V1524505",
    dri: "dept-dri",
    omLeader: "maint5",
    omMember: "giangth1",
    manager: "cost-owner",
    projectDri: "budget-approver",
    buyer: "buyer-handoff",
    admin: "admin",
  };
  
  const defaultOmAssignmentRules = [
    {
      id: "om-rule-p27-f27-linh",
      name: "P27/F27 -> Linh",
      active: true,
      priority: 10,
      projectCodes: ["P27", "F27"],
      projectFamilies: [],
      departmentScopes: [],
      assigneeUserId: "om-member-linh",
      isFallback: false,
      note: "Default OM assignment for P27 and F27.",
    },
    {
      id: "om-rule-fallback-giang",
      name: "Fallback -> Giang",
      active: true,
      priority: 999,
      projectCodes: [],
      projectFamilies: [],
      departmentScopes: [],
      assigneeUserId: "om-member-giang",
      isFallback: true,
      note: "Fallback OM assignment when no higher-priority rule matches.",
    },
  ];
  
  const adminRoleCatalog = [
    { role_key: "requester", role_name: "Requester", app_role: "requester", role_level: "business", is_system: 1 },
    { role_key: "costOwner", role_name: "Cost Owner", app_role: "manager", role_level: "business", is_system: 1 },
    { role_key: "omLeader", role_name: "OM Leader", app_role: "omLeader", role_level: "operations", is_system: 1 },
    { role_key: "omMember", role_name: "OM Purchasing", app_role: "omMember", role_level: "operations", is_system: 1 },
    { role_key: "deptDri", role_name: "Dept DRI", app_role: "dri", role_level: "approval", is_system: 1 },
    { role_key: "budgetApprover", role_name: "Budget Approver", app_role: "projectDri", role_level: "approval", is_system: 1 },
    { role_key: "admin", role_name: "System Admin", app_role: "admin", role_level: "governance", is_system: 1 },
  ];
  
  const adminPermissionModules = [
    { module_key: "admin.users", module_name: "User Lifecycle" },
    { module_key: "admin.mapping", module_name: "Mapping / Scope" },
    { module_key: "admin.user_scope", module_name: "User Scope" },
    { module_key: "admin.roles", module_name: "Role & Permission" },
    { module_key: "admin.fields", module_name: "Sensitive Field Access" },
    { module_key: "admin.audit", module_name: "Audit Log" },
  ];
  
  const defaultRolePermissions = {
    requester: {
      "admin.users": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.mapping": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.user_scope": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.roles": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.fields": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
    },
    costOwner: {
      "admin.users": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.mapping": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.user_scope": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.roles": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.fields": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
    },
    omLeader: {
      "admin.users": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.mapping": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.user_scope": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.roles": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.fields": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
    },
    omMember: {
      "admin.users": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.mapping": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.user_scope": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.roles": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.fields": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
    },
    deptDri: {
      "admin.users": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.mapping": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.user_scope": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.roles": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.fields": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
    },
    budgetApprover: {
      "admin.users": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.mapping": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.user_scope": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.roles": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.fields": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 0, can_export: 0 },
    },
    admin: {
      "admin.users": { can_create: 1, can_update: 1, can_delete: 1, can_view: 1, can_export: 1 },
      "admin.mapping": { can_create: 1, can_update: 1, can_delete: 0, can_view: 1, can_export: 1 },
      "admin.user_scope": { can_create: 0, can_update: 1, can_delete: 0, can_view: 1, can_export: 1 },
      "admin.roles": { can_create: 1, can_update: 1, can_delete: 1, can_view: 1, can_export: 1 },
      "admin.fields": { can_create: 1, can_update: 1, can_delete: 1, can_view: 1, can_export: 1 },
      "admin.audit": { can_create: 0, can_update: 0, can_delete: 0, can_view: 1, can_export: 1 },
    },
  };
  
  const defaultFieldVisibilityRules = [
    { field_key: "costPrice", field_label: "Cost Price", visibility: "visible", role_key: "costOwner", reserved: 0 },
    { field_key: "costPrice", field_label: "Cost Price", visibility: "visible", role_key: "deptDri", reserved: 0 },
    { field_key: "costPrice", field_label: "Cost Price", visibility: "visible", role_key: "budgetApprover", reserved: 0 },
    { field_key: "costPrice", field_label: "Cost Price", visibility: "visible", role_key: "admin", reserved: 0 },
    { field_key: "vendor", field_label: "Vendor", visibility: "visible", role_key: "omLeader", reserved: 0 },
    { field_key: "vendor", field_label: "Vendor", visibility: "visible", role_key: "omMember", reserved: 0 },
    { field_key: "vendor", field_label: "Vendor", visibility: "visible", role_key: "admin", reserved: 0 },
    { field_key: "pasMaterialNo", field_label: "PAS Material No", visibility: "visible", role_key: "omLeader", reserved: 0 },
    { field_key: "pasMaterialNo", field_label: "PAS Material No", visibility: "visible", role_key: "omMember", reserved: 0 },
    { field_key: "pasMaterialNo", field_label: "PAS Material No", visibility: "visible", role_key: "admin", reserved: 0 },
    { field_key: "factoryMaterialNo", field_label: "Factory Material No", visibility: "visible", role_key: "omLeader", reserved: 0 },
    { field_key: "factoryMaterialNo", field_label: "Factory Material No", visibility: "visible", role_key: "omMember", reserved: 0 },
    { field_key: "factoryMaterialNo", field_label: "Factory Material No", visibility: "visible", role_key: "admin", reserved: 0 },
    { field_key: "sapMaterialNo", field_label: "SAP Material No", visibility: "visible", role_key: "omLeader", reserved: 0 },
    { field_key: "sapMaterialNo", field_label: "SAP Material No", visibility: "visible", role_key: "omMember", reserved: 0 },
    { field_key: "sapMaterialNo", field_label: "SAP Material No", visibility: "visible", role_key: "admin", reserved: 0 },
    { field_key: "omAssignee", field_label: "OM Assignee", visibility: "visible", role_key: "omLeader", reserved: 0 },
    { field_key: "omAssignee", field_label: "OM Assignee", visibility: "visible", role_key: "admin", reserved: 0 },
    { field_key: "employeeSalary", field_label: "Employee Salary", visibility: "visible", role_key: "admin", reserved: 1 },
  ];
  
  const memoryStore = {
    users: new Map(uatUsers.flatMap((user) => [
      [String(user.email || "").toLowerCase(), {
        ...user,
        status: user.is_active ? "active" : "inactive",
        created_at: user.created_at || "2026-06-01T00:00:00.000Z",
        created_by: user.created_by || "system-seed",
        disabled_at: user.disabled_at || null,
        scope_type: user.scope_type || "global",
        scope_value: user.scope_value || "All",
      }],
      [String(user.employee_id || "").toLowerCase(), {
        ...user,
        status: user.is_active ? "active" : "inactive",
        created_at: user.created_at || "2026-06-01T00:00:00.000Z",
        created_by: user.created_by || "system-seed",
        disabled_at: user.disabled_at || null,
        scope_type: user.scope_type || "global",
        scope_value: user.scope_value || "All",
      }],
      [String(user.id || "").toLowerCase(), {
        ...user,
        status: user.is_active ? "active" : "inactive",
        created_at: user.created_at || "2026-06-01T00:00:00.000Z",
        created_by: user.created_by || "system-seed",
        disabled_at: user.disabled_at || null,
        scope_type: user.scope_type || "global",
        scope_value: user.scope_value || "All",
      }],
    ].filter(([key]) => key))),
    usersById: new Map(uatUsers.map((user) => [user.id, {
      ...user,
      status: user.is_active ? "active" : "inactive",
      created_at: user.created_at || "2026-06-01T00:00:00.000Z",
      created_by: user.created_by || "system-seed",
      disabled_at: user.disabled_at || null,
      scope_type: user.scope_type || "global",
      scope_value: user.scope_value || "All",
    }])),
    sessions: new Map(),
    assignments: new Map(),
    projectStageCalendarRecords: new Map(),
    omProcurementTracking: new Map(),
    omLeaderConsoleRows: [],
    omAssignmentRules: defaultOmAssignmentRules.map((rule) => ({ ...rule })),
    attachments: new Map(),
    auditEvents: [],
    roles: adminRoleCatalog.map((role) => ({ ...role })),
    rolePermissions: JSON.parse(JSON.stringify(defaultRolePermissions)),
    fieldVisibilityRules: defaultFieldVisibilityRules.map((rule) => ({ ...rule })),
    importJobs: [],
    sapPoRawImportPreviews: new Map(),
    sapPoRawImportJobs: [],
    lvTaxonomy: [],
    catalogItems: [],
  };
  return { memoryStore, testLoginRoleIdentifiers, adminPermissionModules, defaultRolePermissions };
}

module.exports = { createMemoryStore };
