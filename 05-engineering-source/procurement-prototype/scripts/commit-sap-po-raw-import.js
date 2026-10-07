#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const importer = require("../app-modules/sap-po-raw-importer");

const ROOT = path.resolve(__dirname, "..");

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

function parseArgs(argv) {
  const args = {
    mode: "",
    scope: importer.SCOPE_MODE_YELLOW_ONLY,
    workbookPath: "",
    sheetName: importer.DEFAULT_SHEET_NAME,
    requireCleanPreview: false,
    actorUserId: "sap-po-raw-import-cli",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--preview") args.mode = "preview";
    else if (arg === "--commit") args.mode = "commit";
    else if (arg === "--require-clean-preview") args.requireCleanPreview = true;
    else if (arg === "--scope") args.scope = argv[++index] || args.scope;
    else if (arg === "--workbook") args.workbookPath = argv[++index] || "";
    else if (arg === "--sheet") args.sheetName = argv[++index] || args.sheetName;
    else if (arg === "--actor") args.actorUserId = argv[++index] || args.actorUserId;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else {
      const error = new Error(`Unknown argument: ${arg}`);
      error.status = 2;
      throw error;
    }
  }
  if (!args.mode && !args.help) args.mode = "preview";
  return args;
}

function usage() {
  return [
    "Usage:",
    "  node scripts/commit-sap-po-raw-import.js --preview --scope yellow-only",
    "  node scripts/commit-sap-po-raw-import.js --commit --scope yellow-only --require-clean-preview",
    "",
    "Options:",
    "  --workbook <path>   Override SAP_PO_RAW_WORKBOOK_PATH",
    "  --sheet <name>      Excel sheet name, default Raw Data",
    "  --actor <user-id>   imported_by_user_id metadata, default sap-po-raw-import-cli",
  ].join("\n");
}

function mysqlConfigPresent() {
  return Boolean(process.env.MYSQL_URL || process.env.MYSQL_HOST || process.env.DB_HOST);
}

function createPool() {
  if (!mysqlConfigPresent()) return null;
  if (process.env.MYSQL_URL) return mysql.createPool(process.env.MYSQL_URL);
  return mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "mva_procurement_uat",
    waitForConnections: true,
    connectionLimit: 4,
  });
}

function dbTargetLabel() {
  return process.env.MYSQL_URL
    ? "MYSQL_URL"
    : `${process.env.MYSQL_HOST || process.env.DB_HOST || "missing"}:${process.env.MYSQL_PORT || process.env.DB_PORT || 3306}/${process.env.MYSQL_DATABASE || process.env.DB_NAME || "mva_procurement_uat"}`;
}

async function postCommitChecks(pool, batchId) {
  const [batchRows] = await pool.execute(
    "SELECT id, source_file_name, source_checksum, import_status, imported_at FROM sap_po_import_batches WHERE id = ? LIMIT 1",
    [batchId],
  );
  const [[rawCount]] = await pool.execute(
    "SELECT COUNT(*) AS count FROM sap_po_raw_lines WHERE import_batch_id = ?",
    [batchId],
  );
  const [[omCount]] = await pool.execute(
    "SELECT COUNT(*) AS count FROM sap_po_raw_lines WHERE import_batch_id = ? AND buy_scope = 'om_scope'",
    [batchId],
  );
  const [[factoryIdentityCount]] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM material_identity
     WHERE material_no_type = 'factory_material_no'
       AND material_no IN ('ITKEY-00001','ITMON-00001','ITMOU-00001','ITPCA-00001','ITPCQ-00001','ITPCO-00001','ITIPA-00001','ITIPB-00001','ITIPC-00001','ITQWS-00001','ITQWA-00001','ITQWL-00001','ITPRT-00001')`,
  );
  return {
    batch: batchRows[0] || null,
    raw_line_count: Number(rawCount.count || 0),
    om_scope_count: Number(omCount.count || 0),
    known_factory_identity_count: Number(factoryIdentityCount.count || 0),
  };
}

function summarizePreview(preview) {
  return {
    ok: Boolean(preview.ok) && !(preview.errors || []).length,
    id: preview.id,
    source_file_name: preview.source_file_name,
    source_checksum: preview.source_checksum,
    workbook_path: preview.workbook_path,
    source_sheet_name: preview.source_sheet_name,
    scope_mode: preview.scope_mode,
    selected_row_count: preview.rows?.length || preview.selected_row_count || 0,
    scope_counts: preview.scope_counts || {},
    error_count: (preview.errors || []).length,
    warning_count: (preview.warnings || []).length,
    errors: preview.errors || [],
    warnings: preview.warnings || [],
    sample_factory_material_no: (preview.rows || []).slice(0, 5).map((row) => row.fields?.factory_material_no || ""),
  };
}

async function main() {
  loadLocalEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const pool = createPool();
  try {
    const preview = await importer.previewSapPoRawImport({
      workbookPath: args.workbookPath,
      sheetName: args.sheetName,
      scopeMode: args.scope,
      root: ROOT,
      pool,
      includeRows: true,
    });
    const previewSummary = summarizePreview(preview);
    if (args.mode === "preview") {
      console.log(JSON.stringify({ mode: "preview", db_target: dbTargetLabel(), preview: previewSummary }, null, 2));
      return previewSummary.ok ? 0 : 1;
    }
    if (!pool) {
      throw new Error("Commit requires MYSQL_URL or MYSQL_HOST/DB_HOST. Preview can run without DB; commit cannot.");
    }
    if (args.requireCleanPreview && (!previewSummary.ok || previewSummary.warning_count > 0)) {
      const error = new Error("Clean preview required before commit.");
      error.receipt = { preview: previewSummary };
      throw error;
    }
    const receipt = await importer.commitSapPoRawImport({
      pool,
      preview,
      actorUserId: args.actorUserId,
      scopeMode: args.scope,
    });
    const post_commit = await postCommitChecks(pool, receipt.import_batch_id);
    console.log(JSON.stringify({
      mode: "commit",
      db_target: dbTargetLabel(),
      preview: previewSummary,
      receipt,
      post_commit,
    }, null, 2));
    return 0;
  } finally {
    if (pool) await pool.end();
  }
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  const payload = {
    ok: false,
    error: error.message,
    errors: error.errors || undefined,
    receipt: error.receipt || undefined,
  };
  console.error(JSON.stringify(payload, null, 2));
  process.exitCode = error.status || 1;
});
