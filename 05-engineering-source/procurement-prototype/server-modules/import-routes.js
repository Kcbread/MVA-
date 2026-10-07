

function createImportRoutes({ requireAdmin, sendJson, sapPoRawImportStatusPayload, createSapPoRawImportPreview, readBody, commitSapPoRawImport }) {
  async function handleImportRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/admin/sap-po-raw-import/status") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.mapping", action: "view" });
      if (!user) return true;
      sendJson(res, 200, sapPoRawImportStatusPayload());
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/admin/sap-po-raw-import/preview") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.mapping", action: "view" });
      if (!user) return true;
      const preview = await createSapPoRawImportPreview(req, user, await readBody(req));
      sendJson(res, 200, { preview });
      return true;
    }
    if (req.method === "POST" && url.pathname === "/api/admin/sap-po-raw-import/commit") {
      const user = await requireAdmin(req, res, { moduleKey: "admin.mapping", action: "create" });
      if (!user) return true;
      const receipt = await commitSapPoRawImport(req, user, await readBody(req));
      sendJson(res, 200, { receipt });
      return true;
    }
  return false;
  }
  return { handleImportRoutes };
}

module.exports = { createImportRoutes };
