const { canViewOm, canMaintainOmProcurementTracking } = require('./permissions');

function createTrackingRoutes({ requireAuth, sendJson, omProcurementTrackingRecords, audit, updateOmProcurementTracking, readBody }) {
  async function handleTrackingRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/om/procurement-tracking") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canViewOm(user)) {
        sendJson(res, 403, { error: "OM role required" });
        return true;
      }
      sendJson(res, 200, { records: await omProcurementTrackingRecords() });
      return true;
    }
    const procurementTrackingMatch = url.pathname.match(/^\/api\/om\/requests\/([^/]+)\/procurement-tracking$/);
    if (req.method === "PATCH" && procurementTrackingMatch) {
      const user = await requireAuth(req, res);
      if (!user) return true;
      if (!canMaintainOmProcurementTracking(user)) {
        await audit("om.procurement_tracking_blocked", req, { actor: user, entityType: "request", entityId: procurementTrackingMatch[1] });
        sendJson(res, 403, { error: "Only OM Purchasing or Admin can update PR PO ETA tracking" });
        return true;
      }
      const tracking = await updateOmProcurementTracking(req, user, decodeURIComponent(procurementTrackingMatch[1]), await readBody(req));
      sendJson(res, 200, { tracking });
      return true;
    }
  return false;
  }
  return { handleTrackingRoutes };
}

module.exports = { createTrackingRoutes };
