const crypto = require("node:crypto");
const { cloneJson, textValue } = require('./values');
const { roleKeyFromAppRole, canAdminGovern } = require('./permissions');

function createAdminService({ memoryStore, requireAuth, audit, sendJson, appRoleFromRoleKey, findDuplicateUser, replaceMemoryUser, revokeSessionsForUser, removeUserLookupKeys, defaultRolePermissions }) {
  function listRolesMemory() {
    return memoryStore.roles.map((role) => ({
      ...role,
      permissions: cloneJson(memoryStore.rolePermissions[role.role_key] || {}),
    }));
  }
  
  function listFieldVisibilityMemory() {
    const grouped = new Map();
    memoryStore.fieldVisibilityRules.forEach((rule) => {
      if (!grouped.has(rule.field_key)) {
        grouped.set(rule.field_key, {
          field_key: rule.field_key,
          field_label: rule.field_label,
          reserved: Boolean(rule.reserved),
          visibility_by_role: {},
        });
      }
      grouped.get(rule.field_key).visibility_by_role[rule.role_key] = rule.visibility;
    });
    return Array.from(grouped.values());
  }
  
  function roleCan(user, moduleKey, action) {
    const roleKey = roleKeyFromAppRole(user?.role);
    return Boolean(memoryStore.rolePermissions?.[roleKey]?.[moduleKey]?.[`can_${action}`]);
  }
  
  async function requireAdmin(req, res, { moduleKey = "admin.users", action = "view" } = {}) {
    const user = await requireAuth(req, res);
    if (!user) return null;
    if (!canAdminGovern(user) || !roleCan(user, moduleKey, action)) {
      await audit("admin.access_blocked", req, {
        actor: user,
        entityType: moduleKey,
        entityId: action,
        metadata: { moduleKey, action },
      });
      sendJson(res, 403, { error: "Admin permission required" });
      return null;
    }
    return user;
  }
  
  function parseAdminImportRows(rows = []) {
    return rows.map((row) => ({
      employee_id: textValue(row.employee_id || row.employeeId, 80),
      name: textValue(row.name, 120),
      email: textValue(row.email, 120).toLowerCase(),
      department: textValue(row.department, 120),
      role_key: textValue(row.role_key || row.roleKey, 80) || "requester",
      scope_type: textValue(row.scope_type || row.scopeType, 80) || "department",
      scope_value: textValue(row.scope_value || row.scopeValue, 120) || textValue(row.department, 120),
    }));
  }
  
  async function createAdminUser(req, actor, body = {}) {
    const roleKey = textValue(body.role_key || body.roleKey, 80) || "requester";
    const appRole = appRoleFromRoleKey(roleKey);
    const record = {
      id: textValue(body.id, 120) || crypto.randomUUID(),
      employee_id: textValue(body.employee_id || body.employeeId, 80),
      name: textValue(body.name, 120),
      email: textValue(body.email, 120).toLowerCase(),
      department: textValue(body.department, 120),
      role: appRole,
      status: "active",
      is_active: 1,
      created_at: new Date().toISOString(),
      created_by: actor.id,
      disabled_at: null,
      scope_type: textValue(body.scope_type || body.scopeType, 80) || "department",
      scope_value: textValue(body.scope_value || body.scopeValue, 120) || textValue(body.department, 120),
      password_hash: body.password_hash || "plain:123",
    };
    if (!record.employee_id || !record.name || !record.email || !record.department) {
      const error = new Error("employee_id, name, email, and department are required");
      error.status = 400;
      throw error;
    }
    if (findDuplicateUser(record)) {
      const error = new Error("Duplicate employee_id or email");
      error.status = 409;
      throw error;
    }
    replaceMemoryUser(record);
    await audit("admin.user_created", req, {
      actor,
      entityType: "user",
      entityId: record.id,
      metadata: { employee_id: record.employee_id, role_key: roleKey, scope_type: record.scope_type, scope_value: record.scope_value },
    });
    return record;
  }
  
  async function updateAdminUserStatus(req, actor, userId, status) {
    const current = memoryStore.usersById.get(userId);
    if (!current) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    const normalizedStatus = ["active", "inactive", "archived"].includes(status) ? status : "";
    if (!normalizedStatus) {
      const error = new Error("Status must be active, inactive, or archived");
      error.status = 400;
      throw error;
    }
    const next = replaceMemoryUser({
      ...current,
      status: normalizedStatus,
      is_active: normalizedStatus === "active" ? 1 : 0,
      disabled_at: normalizedStatus === "active" ? null : new Date().toISOString(),
    });
    if (normalizedStatus !== "active") await revokeSessionsForUser(userId);
    await audit(normalizedStatus === "active" ? "admin.user_activated" : "admin.user_deactivated", req, {
      actor,
      entityType: "user",
      entityId: userId,
      metadata: { status: normalizedStatus },
    });
    return next;
  }
  
  async function updateAdminUserRecord(req, actor, userId, body = {}) {
    const current = memoryStore.usersById.get(userId);
    if (!current) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    const next = {
      ...current,
      employee_id: textValue(body.employee_id || body.employeeId || current.employee_id, 80),
      name: textValue(body.name || current.name, 120),
      email: textValue(body.email || current.email, 120).toLowerCase(),
      department: textValue(body.department || current.department, 120),
      role: appRoleFromRoleKey(textValue(body.role_key || body.roleKey, 80) || roleKeyFromAppRole(current.role)),
      scope_type: textValue(body.scope_type || body.scopeType || current.scope_type, 80) || "department",
      scope_value: textValue(body.scope_value || body.scopeValue || current.scope_value, 120) || current.department,
    };
    const duplicate = findDuplicateUser({ employee_id: next.employee_id, email: next.email, id: next.id }, userId);
    if (duplicate) {
      const error = new Error("Duplicate employee_id or email");
      error.status = 409;
      throw error;
    }
    removeUserLookupKeys(current);
    replaceMemoryUser(next);
    await audit("admin.user_role_changed", req, {
      actor,
      entityType: "user",
      entityId: userId,
      metadata: { role_key: roleKeyFromAppRole(next.role), department: next.department, scope_type: next.scope_type, scope_value: next.scope_value },
    });
    return next;
  }
  
  async function createAdminRole(req, actor, body = {}) {
    const roleKey = textValue(body.role_key || body.roleKey, 80);
    const roleName = textValue(body.role_name || body.roleName, 120);
    if (!roleKey || !roleName) {
      const error = new Error("role_key and role_name are required");
      error.status = 400;
      throw error;
    }
    if (memoryStore.roles.some((role) => role.role_key === roleKey)) {
      const error = new Error("Role already exists");
      error.status = 409;
      throw error;
    }
    const role = {
      role_key: roleKey,
      role_name: roleName,
      app_role: textValue(body.app_role || body.appRole, 80) || roleKey,
      role_level: textValue(body.role_level || body.roleLevel, 80) || "governance",
      is_system: 0,
    };
    memoryStore.roles.push(role);
    memoryStore.rolePermissions[roleKey] = cloneJson(defaultRolePermissions.requester);
    await audit("admin.role_created", req, {
      actor,
      entityType: "role",
      entityId: roleKey,
      metadata: { role_name: role.role_name },
    });
    return role;
  }
  
  async function updateRolePermissions(req, actor, roleKey, permissions = {}) {
    if (!memoryStore.roles.some((role) => role.role_key === roleKey)) {
      const error = new Error("Role not found");
      error.status = 404;
      throw error;
    }
    const current = cloneJson(memoryStore.rolePermissions[roleKey] || {});
    Object.entries(permissions).forEach(([moduleKey, next]) => {
      current[moduleKey] = {
        can_create: Number(Boolean(next.can_create ?? next.canCreate)),
        can_update: Number(Boolean(next.can_update ?? next.canUpdate)),
        can_delete: Number(Boolean(next.can_delete ?? next.canDelete)),
        can_view: Number(Boolean(next.can_view ?? next.canView)),
        can_export: Number(Boolean(next.can_export ?? next.canExport)),
      };
    });
    memoryStore.rolePermissions[roleKey] = current;
    await audit("admin.permission_updated", req, {
      actor,
      entityType: "role",
      entityId: roleKey,
      metadata: { permissions: current },
    });
    return current;
  }
  
  async function updateFieldVisibilityRules(req, actor, rules = []) {
    rules.forEach((rule) => {
      const fieldKey = textValue(rule.field_key || rule.fieldKey, 80);
      const roleKey = textValue(rule.role_key || rule.roleKey, 80);
      const visibility = textValue(rule.visibility, 40) || "hidden";
      if (!fieldKey || !roleKey) return;
      const existingIndex = memoryStore.fieldVisibilityRules.findIndex((item) => item.field_key === fieldKey && item.role_key === roleKey);
      const baseLabel = memoryStore.fieldVisibilityRules.find((item) => item.field_key === fieldKey)?.field_label || fieldKey;
      const nextRule = { field_key: fieldKey, field_label: baseLabel, role_key: roleKey, visibility, reserved: Number(Boolean(rule.reserved)) };
      if (existingIndex === -1) memoryStore.fieldVisibilityRules.push(nextRule);
      else memoryStore.fieldVisibilityRules.splice(existingIndex, 1, { ...memoryStore.fieldVisibilityRules[existingIndex], ...nextRule });
    });
    await audit("admin.field_visibility_updated", req, {
      actor,
      entityType: "field_visibility",
      entityId: "sensitive-fields",
      metadata: { rules },
    });
    return listFieldVisibilityMemory();
  }
  return { listRolesMemory, listFieldVisibilityMemory, roleCan, requireAdmin, parseAdminImportRows, createAdminUser, updateAdminUserStatus, updateAdminUserRecord, createAdminRole, updateRolePermissions, updateFieldVisibilityRules };
}

module.exports = { createAdminService };
