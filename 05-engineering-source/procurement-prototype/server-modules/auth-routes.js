const { verifyPassword, publicUser } = require('./user-model');

function createAuthRoutes({ healthStatus, sendJson, readBody, testLoginRoleIdentifiers, findUserByIdentifier, audit, createSession, cookieHeader, logout, clearCookieHeader, requireAuth }) {
  async function handleAuthRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/health") {
      const health = await healthStatus();
      sendJson(res, health.status, health.payload);
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readBody(req);
      const requestedRole = String(body.role || body.loginRole || "").trim();
      const identifier = requestedRole === "omMember"
        ? body.operatorEmployeeId || body.identifier || body.account || body.employeeId || body.employee_id || body.email
        : testLoginRoleIdentifiers[requestedRole] || body.identifier || body.account || body.employeeId || body.employee_id || body.email;
      const user = await findUserByIdentifier(identifier);
      if (!user || !verifyPassword(String(body.password || ""), user.password_hash)) {
        await audit("auth.login_failed", req, { metadata: { identifier: identifier || "", requestedRole } });
        sendJson(res, 401, { error: "Invalid account or password" });
        return true;
      }
      const token = await createSession(req, user);
      sendJson(res, 200, { user: publicUser(user) }, { "Set-Cookie": cookieHeader(token) });
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/logout") {
      await logout(req);
      sendJson(res, 200, { ok: true }, { "Set-Cookie": clearCookieHeader() });
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/me") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      sendJson(res, 200, { user: publicUser(user) });
      return true;
    }
  return false;
  }
  return { handleAuthRoutes };
}

module.exports = { createAuthRoutes };
