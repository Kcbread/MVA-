const { canViewOm, canMaintainProjectStageCalendar } = require('./permissions');

function createCalendarRoutes({ requireAuth, sendJson, projectStageCalendarRecords, audit, saveProjectStageCalendarRecord, readBody }) {
  async function handleCalendarRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/om/project-stage-calendar") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewOm(user)) {
        sendJson(res, 403, { error: "OM role required" });
        return true;
      }
      sendJson(res, 200, { records: await projectStageCalendarRecords() });
      return true;
    }
    if (req.method === "PUT" && url.pathname === "/api/om/project-stage-calendar") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canMaintainProjectStageCalendar(user)) {
        await audit("om.project_stage_calendar_blocked", req, { actor: user, entityType: "om_project_stage_calendar" });
        sendJson(res, 403, { error: "Only OM Leader or Admin can update Project Stage Calendar" });
        return true;
      }
      const record = await saveProjectStageCalendarRecord(req, user, await readBody(req));
      sendJson(res, 200, { record });
      return true;
    }
  return false;
  }
  return { handleCalendarRoutes };
}

module.exports = { createCalendarRoutes };
