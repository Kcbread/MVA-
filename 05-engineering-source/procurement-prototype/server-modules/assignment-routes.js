const { canViewOm, canAssignOm } = require('./permissions');

function createAssignmentRoutes({ requireAdmin, sendJson, omAssignmentRules, createOmAssignmentRule, readBody, updateOmAssignmentRule, requireAuth, omAssignees, omAssignments, audit, setOmAssignment }) {
  async function handleAssignmentRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/admin/om-assignment-rules") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.mapping", action: "view" });
      if (!user) return true;
      sendJson(res, 200, { rules: await omAssignmentRules() });
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/admin/om-assignment-rules") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.mapping", action: "create" });
      if (!user) return true;
      const rule = await createOmAssignmentRule(req, user, await readBody(req));
      sendJson(res, 201, { rule });
      return true;
    }
    const omRuleMatch = url.pathname.match(/^\/api\/admin\/om-assignment-rules\/([^/]+)$/);
    if (req.method === "PATCH" && omRuleMatch) {
      const user = await requireAdmin(req, res, { moduleKey: "admin.mapping", action: "update" });
      if (!user) return true;
      const rule = await updateOmAssignmentRule(req, user, decodeURIComponent(omRuleMatch[1]), await readBody(req));
      sendJson(res, 200, { rule });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/om/assignees") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewOm(user)) {
        sendJson(res, 403, { error: "OM role required" });
        return true;
      }
      sendJson(res, 200, { assignees: await omAssignees() });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/om/assignment-rules") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewOm(user) && user.role !== "admin") {
        sendJson(res, 403, { error: "OM role required" });
        return true;
      }
      sendJson(res, 200, { rules: await omAssignmentRules() });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/om/assignments") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewOm(user)) {
        sendJson(res, 403, { error: "OM role required" });
        return true;
      }
      sendJson(res, 200, { assignments: await omAssignments() });
      return true;
    }
    const assignmentMatch = url.pathname.match(/^\/api\/om\/requests\/([^/]+)\/assign$/);
    if (req.method === "POST" && assignmentMatch) {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canAssignOm(user)) {
        await audit("om.assignment_blocked", req, { actor: user, entityType: "request", entityId: assignmentMatch[1] });
        sendJson(res, 403, { error: "Only OM Leader or Admin can assign OM rows" });
        return true;
      }
      const body = await readBody(req);
      const assignment = await setOmAssignment(req, user, decodeURIComponent(assignmentMatch[1]), body.assignedToUserId || "", body.note || "");
      sendJson(res, 200, { assignment });
      return true;
    }
  return false;
  }
  return { handleAssignmentRoutes };
}

module.exports = { createAssignmentRoutes };
