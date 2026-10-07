const sapPoRawImporter = require("../app-modules/sap-po-raw-importer");
const materialCoding = require("../app-modules/material-coding");
const { filterCatalogItems } = require('./catalog-filter');

function createCatalogService({ ROOT, pool, queryLvTaxonomyPayload, memoryStore, queryCatalogItemsForRequest }) {
  let materialContextPromise = null;
  
  async function excelMaterialContext() {
    if (!materialContextPromise) {
      materialContextPromise = sapPoRawImporter.previewSapPoRawImport({
        sheetName: sapPoRawImporter.DEFAULT_SHEET_NAME,
        scopeMode: sapPoRawImporter.SCOPE_MODE_ALL,
        root: ROOT,
        pool,
        includeRows: true,
      }).then((preview) => ({
        preview,
        taxonomy: materialCoding.taxonomyRowsFromPreview(preview),
        tree: materialCoding.taxonomyTree(materialCoding.taxonomyRowsFromPreview(preview)),
        catalogItems: materialCoding.catalogRowsFromPreview(preview),
        codingRules: materialCoding.codingRulesFromPreview(preview),
        summary: materialCoding.importSummaryFromPreview(preview),
      }));
    }
    return materialContextPromise;
  }
  
  async function lvTaxonomyPayload() {
    if (pool) {
      try {
        const [rows] = await queryLvTaxonomyPayload();
        if (rows.length) {
          return { taxonomy: rows, tree: materialCoding.taxonomyTree(rows), source: "mysql" };
        }
      } catch {
        // Fallback to the repo workbook when the local clone has not applied the migration yet.
      }
    }
    if (memoryStore.lvTaxonomy.length) {
      return {
        taxonomy: memoryStore.lvTaxonomy,
        tree: materialCoding.taxonomyTree(memoryStore.lvTaxonomy),
        source: "memory",
      };
    }
    const context = await excelMaterialContext();
    memoryStore.lvTaxonomy = context.taxonomy;
    memoryStore.catalogItems = context.catalogItems;
    return { taxonomy: context.taxonomy, tree: context.tree, source: "workbook" };
  }
  
  async function catalogItemsForRequest(params, actor) {
    let rows = [];
    if (pool) {
      try {
        const [dbRows] = await queryCatalogItemsForRequest();
        rows = dbRows.map((row) => ({
          id: row.itemId,
          itemId: row.itemId,
          name: row.name || "",
          spec: row.spec || "",
          detail: "",
          category: row.category || [row.lv1, row.lv2, row.lv3].filter(Boolean).join(" / "),
          lv1: row.lv1 || "",
          lv2: row.lv2 || "",
          lv3: row.lv3 || "",
          factoryMaterialNo: row.factoryMaterialNo || "",
          materialCodingReviewStatus: row.materialCodingReviewStatus || "Approved mapping",
        }));
      } catch {
        rows = [];
      }
    }
    if (!rows.length) {
      if (!memoryStore.catalogItems.length) {
        const context = await excelMaterialContext();
        memoryStore.lvTaxonomy = context.taxonomy;
        memoryStore.catalogItems = context.catalogItems;
      }
      rows = memoryStore.catalogItems;
    }
    const visibleRows = filterCatalogItems(rows, params);
    const canSeeInternal = ["admin", "omLeader", "omMember", "buyer"].includes(actor?.role);
    return visibleRows.map((row) => canSeeInternal ? materialCoding.adminCatalogItem(row) : materialCoding.requesterCatalogItem(row));
  }
  return { excelMaterialContext, lvTaxonomyPayload, catalogItemsForRequest };
}

module.exports = { createCatalogService };
