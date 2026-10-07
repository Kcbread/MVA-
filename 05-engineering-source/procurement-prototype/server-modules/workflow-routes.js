const { canViewWorkflowReviewRows } = require('./permissions');

function createWorkflowRoutes({ requireAuth, sendJson, workflowReviewRowsForUser }) {
  async function handleWorkflowRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/workflow/review-rows") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewWorkflowReviewRows(user)) {
        sendJson(res, 403, { error: "Workflow review role required" });
        return true;
      }
      sendJson(res, 200, { rows: await workflowReviewRowsForUser(user) });
      return true;
    }
  return false;
  }
  return { handleWorkflowRoutes };
}

module.exports = { createWorkflowRoutes };
