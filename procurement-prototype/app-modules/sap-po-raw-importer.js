(() => {
  const fs = typeof require !== "undefined" ? require("node:fs") : null;
  const path = typeof require !== "undefined" ? require("node:path") : null;
  const crypto = typeof require !== "undefined" ? require("node:crypto") : null;
  const childProcess = typeof require !== "undefined" ? require("node:child_process") : null;
  const sapPoRawContract = typeof require !== "undefined"
    ? require("./sap-po-raw-contract")
    : globalThis.ProcurementApp?.modules?.sapPoRawContract;

  const DEFAULT_WORKBOOK_BASENAME = "Source DB regularize_0608_renumbered.xlsx";
  const DEFAULT_SHEET_NAME = "Raw Data";
  const SCOPE_MODE_YELLOW_ONLY = "yellow-only";
  const SCOPE_MODE_ALL = "all";
  const IMPORT_STATUS_PREVIEWED = "previewed";
  const IMPORT_STATUS_COMMITTED = "committed";
  const IMPORT_STATUS_FAILED = "failed";

  const RAW_LINE_BASE_COLUMNS = [
    "id",
    "import_batch_id",
    "source_row_number",
    "item_id",
    "material_id",
    "buy_scope",
    "scope_source",
    "source_fill_color",
  ];
  const RAW_LINE_TRAILING_COLUMNS = ["raw_payload_json"];

  const ITEM_FIELDS = [
    "factory_material_no",
    "sap_material_no",
    "normalized_item_name",
    "part_name",
    "normalized_spec",
    "spec",
    "lv1",
    "lv2",
    "lv3",
  ];

  function normalizeScopeMode(value) {
    return value === SCOPE_MODE_ALL ? SCOPE_MODE_ALL : SCOPE_MODE_YELLOW_ONLY;
  }

  function projectRootFromModule() {
    if (!path) return "";
    return path.resolve(__dirname, "..");
  }

  function workbookPathCandidates(root = projectRootFromModule()) {
    if (!path) return [];
    return [
      process.env.SAP_PO_RAW_WORKBOOK_PATH,
      path.join(path.dirname(root), DEFAULT_WORKBOOK_BASENAME),
      path.join(path.dirname(root), "檔案範例", DEFAULT_WORKBOOK_BASENAME),
    ].filter(Boolean);
  }

  function resolveWorkbookPath(inputPath, root = projectRootFromModule()) {
    if (!fs || !path) return "";
    const candidates = inputPath ? [inputPath] : workbookPathCandidates(root);
    const resolved = candidates.map((candidate) => path.resolve(candidate));
    return resolved.find((candidate) => fs.existsSync(candidate)) || resolved[0] || "";
  }

  function resolvePythonExecutable() {
    return process.env.SAP_PO_RAW_PYTHON || process.env.PYTHON || "python3";
  }

  function extractorScriptPath(root = projectRootFromModule()) {
    if (!path) return "";
    return path.join(root, "scripts", "extract_sap_po_raw_xlsx.py");
  }

  function parseExtractorJson(stdout) {
    const text = String(stdout || "").trim();
    if (!text) {
      const error = new Error("SAP PO Raw extractor returned no JSON output.");
      error.status = 500;
      throw error;
    }
    return JSON.parse(text.split(/\r?\n/).at(-1));
  }

  function runExtractor({ workbookPath, sheetName = DEFAULT_SHEET_NAME, scopeMode = SCOPE_MODE_YELLOW_ONLY, root } = {}) {
    if (!childProcess) return Promise.reject(new Error("child_process is unavailable."));
    const script = extractorScriptPath(root);
    const args = [
      script,
      "--workbook",
      workbookPath,
      "--sheet",
      sheetName,
      "--scope",
      normalizeScopeMode(scopeMode),
    ];
    return new Promise((resolve, reject) => {
      childProcess.execFile(resolvePythonExecutable(), args, { maxBuffer: 1024 * 1024 * 80 }, (error, stdout, stderr) => {
        let payload;
        try {
          payload = parseExtractorJson(stdout);
        } catch (parseError) {
          parseError.status = 500;
          parseError.details = String(stderr || error?.message || "");
          reject(parseError);
          return;
        }
        if (error && !payload?.errors?.length) {
          payload.errors = [{ code: "extract_failed", message: error.message }];
        }
        resolve(payload);
      });
    });
  }

  function createImportId(prefix) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  function stableHash(value) {
    return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 24);
  }

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function normalizeItemKey(row) {
    const fields = row.fields || row;
    const source = fields.normalized_item_name
      || fields.part_name
      || fields.factory_material_no
      || `sap-po-row-${row.source_row_number || stableHash(JSON.stringify(fields))}`;
    return String(source).trim().toLowerCase().replace(/\s+/g, " ").slice(0, 255);
  }

  function compactPreview(preview, { includeRows = false } = {}) {
    const rows = Array.isArray(preview.rows) ? preview.rows : [];
    return {
      id: preview.id,
      ok: Boolean(preview.ok) && !(preview.errors || []).length,
      mode: preview.mode || "preview",
      scope_mode: normalizeScopeMode(preview.scope_mode),
      source_file_name: preview.source_file_name || "",
      workbook_path: preview.workbook_path || "",
      source_sheet_name: preview.source_sheet_name || DEFAULT_SHEET_NAME,
      header_version: preview.header_version || "raw-data-a-bn-20260608",
      source_checksum: preview.source_checksum || "",
      total_rows_in_sheet: Number(preview.total_rows_in_sheet || 0),
      selected_row_count: rows.length || Number(preview.selected_row_count || 0),
      scope_counts: preview.scope_counts || {},
      errors: preview.errors || [],
      warnings: preview.warnings || [],
      sample_rows: rows.slice(0, 5).map((row) => ({
        source_row_number: row.source_row_number,
        buy_scope: row.buy_scope,
        factory_material_no: row.fields?.factory_material_no || "",
        sap_material_no: row.fields?.sap_material_no || "",
        ftv_code: row.fields?.ftv_code || "",
        normalized_item_name: row.fields?.normalized_item_name || "",
        lv1: row.fields?.lv1 || "",
        lv2: row.fields?.lv2 || "",
        lv3: row.fields?.lv3 || "",
        expected_factory_prefix: row.expected_factory_prefix || "",
      })),
      rows: includeRows ? rows : undefined,
    };
  }

  async function attachDbDuplicateErrors(pool, preview) {
    const rows = (preview.rows || []).filter((row) => row.fields?.factory_material_no);
    if (!pool || !rows.length) return preview;
    const materialNos = [...new Set(rows.map((row) => row.fields.factory_material_no))];
    const placeholders = materialNos.map(() => "?").join(", ");
    const [existing] = await pool.execute(
      `SELECT factory_material_no, source_row_number FROM sap_po_raw_lines WHERE factory_material_no IN (${placeholders})`,
      materialNos,
    );
    if (!existing.length) return preview;
    const existingNos = new Map(existing.map((row) => [row.factory_material_no, row.source_row_number]));
    preview.errors = preview.errors || [];
    rows.forEach((row) => {
      if (!existingNos.has(row.fields.factory_material_no)) return;
      preview.errors.push({
        row: row.source_row_number,
        code: "duplicate_factory_material_no",
        message: "Factory Material No already exists in sap_po_raw_lines; importer will not overwrite it.",
        factory_material_no: row.fields.factory_material_no,
        existing_source_row_number: existingNos.get(row.fields.factory_material_no),
      });
    });
    preview.ok = false;
    return preview;
  }

  async function previewSapPoRawImport({ workbookPath, sheetName = DEFAULT_SHEET_NAME, scopeMode = SCOPE_MODE_YELLOW_ONLY, root, pool, includeRows = false } = {}) {
    const resolvedWorkbookPath = resolveWorkbookPath(workbookPath, root);
    if (!resolvedWorkbookPath || !fs.existsSync(resolvedWorkbookPath)) {
      const error = new Error("SAP PO Raw workbook not found. Set SAP_PO_RAW_WORKBOOK_PATH or pass workbookPath.");
      error.status = 404;
      throw error;
    }
    const preview = await runExtractor({
      workbookPath: resolvedWorkbookPath,
      sheetName,
      scopeMode: normalizeScopeMode(scopeMode),
      root,
    });
    preview.id = createImportId("sap-po-preview");
    preview.scope_mode = normalizeScopeMode(scopeMode);
    await attachDbDuplicateErrors(pool, preview);
    return includeRows ? preview : compactPreview(preview);
  }

  async function ensureItemMaster(connection, row) {
    const fields = row.fields || {};
    const normalizedItemKey = normalizeItemKey(row);
    const itemId = createImportId(`item-${stableHash(normalizedItemKey)}`);
    const itemName = fields.normalized_item_name || fields.part_name || fields.factory_material_no || normalizedItemKey;
    const category = [fields.lv1, fields.lv2, fields.lv3].filter(Boolean).join(" / ");
    await connection.execute(
      `INSERT INTO item_master (id, normalized_item_key, eng_name, cn_eng_name, spec, category, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE updated_at = updated_at`,
      [
        itemId,
        normalizedItemKey,
        itemName.slice(0, 240),
        (fields.normalized_chinese_part_name || fields.chinese_translation || "").slice(0, 240),
        fields.normalized_spec || fields.spec || "",
        category.slice(0, 120),
      ],
    );
    const [rows] = await connection.execute("SELECT id FROM item_master WHERE normalized_item_key = ? LIMIT 1", [normalizedItemKey]);
    return rows[0]?.id || itemId;
  }

  async function ensureMaterialIdentity(connection, itemId, materialNo, materialNoType) {
    const normalizedMaterialNo = normalizeText(materialNo);
    if (!normalizedMaterialNo) return null;
    const identityId = createImportId(`mat-${stableHash(`${materialNoType}:${normalizedMaterialNo}`)}`);
    const [existing] = await connection.execute("SELECT id, material_no_type FROM material_identity WHERE material_no = ? LIMIT 1", [normalizedMaterialNo]);
    if (existing.length) {
      if (existing[0].material_no_type !== materialNoType) {
        const error = new Error(`Material No ${normalizedMaterialNo} already exists as ${existing[0].material_no_type}.`);
        error.status = 409;
        throw error;
      }
      return existing[0].id;
    }
    await connection.execute(
      `INSERT INTO material_identity (id, item_id, material_no, material_no_type, created_from, status)
       VALUES (?, ?, ?, ?, 'sap_po_raw_import', 'active')`,
      [identityId, itemId, normalizedMaterialNo, materialNoType],
    );
    return identityId;
  }

  function rawLineColumns() {
    return [
      ...RAW_LINE_BASE_COLUMNS,
      ...sapPoRawContract.SAP_PO_RAW_DATA_FIELDS,
      ...RAW_LINE_TRAILING_COLUMNS,
    ];
  }

  function rawLineValues(row, importBatchId, itemId, materialId) {
    const fields = row.fields || {};
    return [
      createImportId("sap-po-line"),
      importBatchId,
      row.source_row_number || null,
      itemId || null,
      materialId || null,
      row.buy_scope || sapPoRawContract.BUY_SCOPE_MFG_BUY,
      row.scope_source || sapPoRawContract.SCOPE_SOURCE_DEFAULT_NON_YELLOW,
      row.source_fill_color || "",
      ...sapPoRawContract.SAP_PO_RAW_DATA_FIELDS.map((field) => fields[field] ?? ""),
      JSON.stringify(row.raw_payload_json || {}),
    ];
  }

  async function commitSapPoRawImport({ pool, preview, actorUserId = "", scopeMode = SCOPE_MODE_YELLOW_ONLY } = {}) {
    if (!pool) {
      const error = new Error("UAT MySQL config is required before SAP PO Raw commit.");
      error.status = 409;
      throw error;
    }
    if (!preview || !Array.isArray(preview.rows)) {
      const error = new Error("A full preview with rows is required before commit.");
      error.status = 400;
      throw error;
    }
    await attachDbDuplicateErrors(pool, preview);
    if ((preview.errors || []).length) {
      const error = new Error("SAP PO Raw preview has blocking errors; commit aborted.");
      error.status = 422;
      error.errors = preview.errors;
      throw error;
    }
    const importBatchId = createImportId("sap-po-batch");
    const columns = rawLineColumns();
    const placeholders = columns.map(() => "?").join(", ");
    const connection = await pool.getConnection();
    let insertedLines = 0;
    let insertedFactoryIdentities = 0;
    let insertedSapIdentities = 0;
    try {
      await connection.beginTransaction();
      await connection.execute(
        `INSERT INTO sap_po_import_batches
         (id, source_file_name, source_sheet_name, header_version, source_checksum, import_status, imported_by_user_id, imported_at, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
        [
          importBatchId,
          preview.source_file_name,
          preview.source_sheet_name || DEFAULT_SHEET_NAME,
          preview.header_version || "raw-data-a-bn-20260608",
          preview.source_checksum || "",
          IMPORT_STATUS_COMMITTED,
          actorUserId || null,
          JSON.stringify({
            scope_mode: normalizeScopeMode(scopeMode || preview.scope_mode),
            selected_row_count: preview.rows.length,
            scope_counts: preview.scope_counts || {},
            warning_count: (preview.warnings || []).length,
          }),
        ],
      );
      for (const row of preview.rows) {
        const fields = row.fields || {};
        const itemId = await ensureItemMaster(connection, row);
        const factoryIdentityId = await ensureMaterialIdentity(
          connection,
          itemId,
          fields.factory_material_no,
          sapPoRawContract.MATERIAL_NO_TYPE_FACTORY,
        );
        if (factoryIdentityId) insertedFactoryIdentities += 1;
        const sapIdentityId = await ensureMaterialIdentity(
          connection,
          itemId,
          fields.sap_material_no,
          sapPoRawContract.MATERIAL_NO_TYPE_SAP,
        );
        if (sapIdentityId) insertedSapIdentities += 1;
        await connection.execute(
          `INSERT INTO sap_po_raw_lines (${columns.join(", ")}) VALUES (${placeholders})`,
          rawLineValues(row, importBatchId, itemId, factoryIdentityId || sapIdentityId),
        );
        insertedLines += 1;
      }
      await connection.commit();
      return {
        ok: true,
        import_batch_id: importBatchId,
        import_status: IMPORT_STATUS_COMMITTED,
        inserted_lines: insertedLines,
        inserted_factory_identities: insertedFactoryIdentities,
        inserted_sap_identities: insertedSapIdentities,
        scope_counts: preview.scope_counts || {},
        warning_count: (preview.warnings || []).length,
      };
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // Keep the original failure as the surfaced error.
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  const api = {
    DEFAULT_WORKBOOK_BASENAME,
    DEFAULT_SHEET_NAME,
    SCOPE_MODE_YELLOW_ONLY,
    SCOPE_MODE_ALL,
    IMPORT_STATUS_PREVIEWED,
    IMPORT_STATUS_COMMITTED,
    IMPORT_STATUS_FAILED,
    ITEM_FIELDS,
    resolveWorkbookPath,
    previewSapPoRawImport,
    commitSapPoRawImport,
    compactPreview,
    rawLineColumns,
    normalizeItemKey,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.sapPoRawImporter = api;
  }
})();
