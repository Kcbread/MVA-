

function createCatalogRoutes({ sendJson, lvTaxonomyPayload, requireAuth, catalogItemsForRequest }) {
  async function handleCatalogRoutes(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/taxonomy/lv123") {
      sendJson(res, 200, await lvTaxonomyPayload());
      return true;
    }
    if (req.method === "GET" && url.pathname === "/api/catalog/items") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      sendJson(res, 200, { items: await catalogItemsForRequest(url.searchParams, user) });
      return true;
    }
  return false;
  }
  return { handleCatalogRoutes };
}

module.exports = { createCatalogRoutes };
