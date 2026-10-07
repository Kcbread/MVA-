const { canViewOmLeaderConsole } = require('./permissions');

function createLeaderRoutes({ requireAuth, sendJson, omLeaderConsolePayload }) {
  async function handleLeaderRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/om/leader-console") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewOmLeaderConsole(user)) {
        sendJson(res, 403, { error: "Only OM Leader or Admin can view OM Leader Console API" });
        return true;
      }
      sendJson(res, 200, await omLeaderConsolePayload(user));
      return true;
    }
  return false;
  }
  return { handleLeaderRoutes };
}

module.exports = { createLeaderRoutes };
