const crypto = require("node:crypto");
const { publicUser } = require('./user-model');
const { textValue, csvEscape } = require('./values');

function createAdminRoutes({ requireAdmin, sendJson, listUsersMemory, createAdminUser, readBody, updateAdminUserRecord, updateAdminUserStatus, parseAdminImportRows, findDuplicateUser, appRoleFromRoleKey, replaceMemoryUser, memoryStore, audit, listRolesMemory, adminPermissionModules, createAdminRole, updateRolePermissions, listFieldVisibilityMemory, updateFieldVisibilityRules, filterAuditEvents }) {
  async function handleAdminRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/admin/users") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.users", action: "view" });
      if (!user) return true;
      sendJson(res, 200, { users: listUsersMemory() });
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/admin/users") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.users", action: "create" });
      if (!user) return true;
      const created = await createAdminUser(req, user, await readBody(req));
      sendJson(res, 201, { user: publicUser(created) });
      return true;
    }
    const adminUserMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (req.method === "PATCH" && adminUserMatch) {
      const user = await requireAdmin(req, res, { moduleKey: "admin.users", action: "update" });
      if (!user) return true;
      const updated = await updateAdminUserRecord(req, user, decodeURIComponent(adminUserMatch[1]), await readBody(req));
      sendJson(res, 200, { user: publicUser(updated) });
      return true;
    }
    const adminUserStatusMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
    if (req.method === "PATCH" && adminUserStatusMatch) {
      const user = await requireAdmin(req, res, { moduleKey: "admin.users", action: "update" });
      if (!user) return true;
      const body = await readBody(req);
      const updated = await updateAdminUserStatus(req, user, decodeURIComponent(adminUserStatusMatch[1]), textValue(body.status, 40));
      sendJson(res, 200, { user: publicUser(updated) });
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/admin/users/import") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.users", action: "create" });
      if (!user) return true;
      const body = await readBody(req);
      const rows = parseAdminImportRows(body.rows || []);
      const imported = [];
      const errors = [];
      rows.forEach((row, index) => {
        if (!row.employee_id || !row.name || !row.email || !row.department) {
          errors.push({ row: index + 1, error: "Missing required fields", employee_id: row.employee_id || "" });
          return;
        }
        if (findDuplicateUser({ employee_id: row.employee_id, email: row.email, id: row.employee_id })) {
          errors.push({ row: index + 1, error: "Duplicate employee_id or email", employee_id: row.employee_id });
          return;
        }
        const created = {
          id: crypto.randomUUID(),
          employee_id: row.employee_id,
          name: row.name,
          email: row.email,
          department: row.department,
          role: appRoleFromRoleKey(row.role_key),
          status: "active",
          is_active: 1,
          created_at: new Date().toISOString(),
          created_by: user.id,
          disabled_at: null,
          scope_type: row.scope_type,
          scope_value: row.scope_value,
          password_hash: "plain:123",
        };
        replaceMemoryUser(created);
        imported.push(created);
      });
      const job = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        created_by: user.id,
        imported_count: imported.length,
        error_count: errors.length,
        errors,
      };
      memoryStore.importJobs.unshift(job);
      await audit("admin.user_imported", req, {
        actor: user,
        entityType: "import_job",
        entityId: job.id,
        metadata: { imported_count: imported.length, error_count: errors.length },
      });
      sendJson(res, 200, { job, imported: imported.map(publicUser), errors });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/admin/users/export") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.users", action: "export" });
      if (!user) return true;
      const users = listUsersMemory();
      await audit("admin.user_exported", req, {
        actor: user,
        entityType: "user_export",
        entityId: `count:${users.length}`,
        metadata: { count: users.length },
      });
      const format = textValue(url.searchParams.get("format"), 20) || "json";
      if (format === "csv") {
        const header = ["employee_id", "name", "email", "department", "role_key", "status", "scope_type", "scope_value", "last_login_at"];
        const lines = [
          header.join(","),
          ...users.map((row) => [
            row.employee_id,
            row.name,
            row.email,
            row.department,
            row.role_key,
            row.status,
            row.scope_type,
            row.scope_value,
            row.last_login_at || "",
          ].map(csvEscape).join(",")),
        ];
        res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8" });
        res.end(lines.join("\n"));
        return true;
      }
      sendJson(res, 200, { users });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/admin/roles") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.roles", action: "view" });
      if (!user) return true;
      sendJson(res, 200, { roles: listRolesMemory(), modules: adminPermissionModules });
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/admin/roles") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.roles", action: "create" });
      if (!user) return true;
      const role = await createAdminRole(req, user, await readBody(req));
      sendJson(res, 201, { role });
      return true;
    }
    const adminRolePermissionMatch = url.pathname.match(/^\/api\/admin\/roles\/([^/]+)\/permissions$/);
    if (req.method === "PATCH" && adminRolePermissionMatch) {
      const user = await requireAdmin(req, res, { moduleKey: "admin.roles", action: "update" });
      if (!user) return true;
      const permissions = await updateRolePermissions(req, user, decodeURIComponent(adminRolePermissionMatch[1]), (await readBody(req)).permissions || {});
      sendJson(res, 200, { permissions });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/admin/field-visibility") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.fields", action: "view" });
      if (!user) return true;
      sendJson(res, 200, { rules: listFieldVisibilityMemory() });
      return true;
    }
    if (req.method === "PATCH" && url.pathname === "/api/admin/field-visibility") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.fields", action: "update" });
      if (!user) return true;
      const body = await readBody(req);
      const rules = await updateFieldVisibilityRules(req, user, body.rules || []);
      sendJson(res, 200, { rules });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/admin/audit-events") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.audit", action: "view" });
      if (!user) return true;
      sendJson(res, 200, { events: filterAuditEvents(url.searchParams) });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/admin/audit-events/export") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.audit", action: "export" });
      if (!user) return true;
      const events = filterAuditEvents(url.searchParams);
      const header = ["created_at", "event_type", "actor_user_id", "actor_role", "entity_type", "entity_id", "ip_address"];
      const lines = [
        header.join(","),
        ...events.map((row) => [
          row.created_at || "",
          row.event_type || "",
          row.actor_user_id || "",
          row.actor_role || "",
          row.entity_type || "",
          row.entity_id || "",
          row.ip_address || "",
        ].map(csvEscape).join(",")),
      ];
      res.writeHead(200, { "Content-Type": "text/csv; charset=utf-8" });
      res.end(lines.join("\n"));
      return true;
    }
  return false;
  }
  return { handleAdminRoutes };
}

module.exports = { createAdminRoutes };
