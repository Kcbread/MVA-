const sapPoRawImporter = require("../app-modules/sap-po-raw-importer");
const fs = require("node:fs");
const { textValue } = require('./values');

function createImportService({ ROOT, mysqlConfigPresent, memoryStore, pool, audit }) {
  function sapPoRawImportStatusPayload() {
    const workbookPath = sapPoRawImporter.resolveWorkbookPath("", ROOT);
    return {
      mysql_config_present: mysqlConfigPresent(),
      db_target: process.env.MYSQL_URL ? "MYSQL_URL" : process.env.MYSQL_DATABASE || process.env.DB_NAME || "mva_procurement_uat",
      workbook_path: workbookPath,
      workbook_exists: Boolean(workbookPath && fs.existsSync(workbookPath)),
      default_scope_mode: sapPoRawImporter.SCOPE_MODE_YELLOW_ONLY,
      previews: Array.from(memoryStore.sapPoRawImportPreviews.values()).slice(0, 5).map((preview) => sapPoRawImporter.compactPreview(preview)),
      jobs: memoryStore.sapPoRawImportJobs.slice(0, 10),
    };
  }
  
  async function createSapPoRawImportPreview(req, actor, body = {}) {
    const preview = await sapPoRawImporter.previewSapPoRawImport({
      workbookPath: textValue(body.workbookPath || body.workbook_path, 1000),
      sheetName: textValue(body.sheetName || body.sheet_name, 120) || "Raw Data",
      scopeMode: textValue(body.scopeMode || body.scope_mode, 40) || sapPoRawImporter.SCOPE_MODE_YELLOW_ONLY,
      root: ROOT,
      pool,
      includeRows: true,
    });
    memoryStore.sapPoRawImportPreviews.set(preview.id, preview);
    await audit("admin.sap_po_raw_previewed", req, {
      actor,
      entityType: "sap_po_raw_import_preview",
      entityId: preview.id,
      metadata: {
        source_file_name: preview.source_file_name,
        scope_mode: preview.scope_mode,
        selected_row_count: preview.rows?.length || 0,
        error_count: preview.errors?.length || 0,
        warning_count: preview.warnings?.length || 0,
      },
    });
    return sapPoRawImporter.compactPreview(preview);
  }
  
  async function commitSapPoRawImport(req, actor, body = {}) {
    const previewId = textValue(body.previewId || body.preview_id, 120);
    let preview = previewId ? memoryStore.sapPoRawImportPreviews.get(previewId) : null;
    if (!preview) {
      preview = await sapPoRawImporter.previewSapPoRawImport({
        workbookPath: textValue(body.workbookPath || body.workbook_path, 1000),
        sheetName: textValue(body.sheetName || body.sheet_name, 120) || "Raw Data",
        scopeMode: textValue(body.scopeMode || body.scope_mode, 40) || sapPoRawImporter.SCOPE_MODE_YELLOW_ONLY,
        root: ROOT,
        pool,
        includeRows: true,
      });
      memoryStore.sapPoRawImportPreviews.set(preview.id, preview);
    }
    const receipt = await sapPoRawImporter.commitSapPoRawImport({
      pool,
      preview,
      actorUserId: actor.id,
      scopeMode: preview.scope_mode,
    });
    const job = {
      id: receipt.import_batch_id,
      created_at: new Date().toISOString(),
      created_by: actor.id,
      source_file_name: preview.source_file_name,
      scope_mode: preview.scope_mode,
      selected_row_count: preview.rows?.length || 0,
      inserted_lines: receipt.inserted_lines,
      scope_counts: receipt.scope_counts,
      warning_count: receipt.warning_count,
    };
    memoryStore.sapPoRawImportJobs.unshift(job);
    await audit("admin.sap_po_raw_committed", req, {
      actor,
      entityType: "sap_po_raw_import_batch",
      entityId: receipt.import_batch_id,
      metadata: job,
    });
    return { ...receipt, job };
  }
  return { sapPoRawImportStatusPayload, createSapPoRawImportPreview, commitSapPoRawImport };
}

module.exports = { createImportService };
