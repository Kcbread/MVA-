(() => {
  const MATERIAL_CODING_APPROVED = "Approved mapping";
  const MATERIAL_CODING_NEEDS_REVIEW = "Need material coding review";
  const MATERIAL_CODING_VALID = "Valid";
  const MATERIAL_CODING_REJECTED = "Rejected mapping";

  function normalizeText(value) {
    return String(value ?? "").trim();
  }

  function taxonomyKey(row = {}) {
    return [row.lv1, row.lv2, row.lv3].map(normalizeText).join("::");
  }

  function fieldsFor(row = {}) {
    return row.fields || row;
  }

  function taxonomyRowsFromPreview(preview = {}) {
    const seen = new Set();
    const rows = [];
    (preview.rows || []).forEach((row) => {
      const fields = fieldsFor(row);
      const item = {
        lv1: normalizeText(fields.lv1),
        lv2: normalizeText(fields.lv2),
        lv3: normalizeText(fields.lv3),
        source: preview.source_file_name || "Source DB regularize_0608_renumbered.xlsx",
        status: "active",
      };
      if (!item.lv1 || !item.lv2 || !item.lv3) return;
      const key = taxonomyKey(item);
      if (seen.has(key)) return;
      seen.add(key);
      item.sortOrder = rows.length + 1;
      rows.push(item);
    });
    return rows;
  }

  function taxonomyTree(taxonomyRows = []) {
    return taxonomyRows.reduce((tree, row) => {
      const lv1 = normalizeText(row.lv1);
      const lv2 = normalizeText(row.lv2);
      const lv3 = normalizeText(row.lv3);
      if (!lv1 || !lv2 || !lv3) return tree;
      tree[lv1] ??= {};
      tree[lv1][lv2] ??= [];
      if (!tree[lv1][lv2].includes(lv3)) tree[lv1][lv2].push(lv3);
      return tree;
    }, {});
  }

  function expectedPrefixForRow(row = {}) {
    return normalizeText(row.expected_factory_prefix);
  }

  function materialCodingReviewStatus(row = {}) {
    const fields = fieldsFor(row);
    if (!normalizeText(fields.lv1) || !normalizeText(fields.lv2) || !normalizeText(fields.lv3)) {
      return MATERIAL_CODING_NEEDS_REVIEW;
    }
    return expectedPrefixForRow(row) ? MATERIAL_CODING_APPROVED : MATERIAL_CODING_NEEDS_REVIEW;
  }

  function catalogRowsFromPreview(preview = {}) {
    return (preview.rows || [])
      .map((row) => {
        const fields = fieldsFor(row);
        const factoryMaterialNo = normalizeText(fields.factory_material_no);
        const lv1 = normalizeText(fields.lv1);
        const lv2 = normalizeText(fields.lv2);
        const lv3 = normalizeText(fields.lv3);
        if (!factoryMaterialNo || !lv1 || !lv2 || !lv3) return null;
        return {
          id: `catalog-${factoryMaterialNo}`,
          itemId: row.item_id || "",
          name: normalizeText(fields.normalized_item_name || fields.part_name || fields.standard_part_name || factoryMaterialNo),
          spec: normalizeText(fields.normalized_spec || fields.spec),
          detail: normalizeText(fields.part_name_detail || fields.chinese_translation || fields.part_name),
          uom: normalizeText(fields.uom),
          lv1,
          lv2,
          lv3,
          category: [lv1, lv2, lv3].join(" / "),
          sourceRowNumber: row.source_row_number || null,
          factoryMaterialNo,
          sapMaterialNo: normalizeText(fields.sap_material_no),
          ftvCode: normalizeText(fields.ftv_code),
          pkMaterialNo: expectedPrefixForRow(row),
          materialCodingReviewStatus: materialCodingReviewStatus(row),
        };
      })
      .filter(Boolean);
  }

  function requesterCatalogItem(row = {}) {
    return {
      id: row.id,
      itemId: row.itemId,
      name: row.name,
      spec: row.spec,
      detail: row.detail,
      uom: row.uom,
      lv1: row.lv1,
      lv2: row.lv2,
      lv3: row.lv3,
      category: row.category,
      materialCodingReviewStatus: row.materialCodingReviewStatus,
    };
  }

  function adminCatalogItem(row = {}) {
    return { ...row };
  }

  function codingRulesFromPreview(preview = {}) {
    const lvRules = preview.lv_rules || {};
    const lv1Entries = Object.entries(lvRules.lv1_by_name || {});
    const lv2Entries = Object.entries(lvRules.lv2_by_lv1_and_name || {});
    const lv1CodeByName = new Map(lv1Entries.map(([name, code]) => [normalizeText(name), normalizeText(code)]));
    const lv1NameByCode = new Map(lv1Entries.map(([name, code]) => [normalizeText(code), normalizeText(name)]));
    const rows = [];
    lv2Entries.forEach(([key, lv2Code]) => {
      const [lv1Code, lv2Name] = String(key).split("::");
      const lv1 = lv1NameByCode.get(normalizeText(lv1Code)) || "";
      const lv2 = normalizeText(lv2Name);
      const prefix = `${normalizeText(lv1Code)}${normalizeText(lv2Code)}`;
      if (!lv1 || !lv2 || !prefix) return;
      rows.push({
        id: `rule-${prefix}-${rows.length + 1}`,
        lv1,
        lv2,
        lv3: "",
        lv1Code: normalizeText(lv1Code),
        lv2Code: normalizeText(lv2Code),
        prefix,
        ruleType: "lv2_prefix",
        status: "active",
        source: preview.source_file_name || "Source DB regularize_0608_renumbered.xlsx",
      });
    });
    Object.entries(lvRules.supplemental_lv3_prefix_by_path || {}).forEach(([path, prefix]) => {
      const [lv1, lv2, lv3] = String(path).split("::").map(normalizeText);
      if (!lv1 || !lv2 || !lv3 || !prefix) return;
      rows.push({
        id: `rule-${prefix}-${rows.length + 1}`,
        lv1,
        lv2,
        lv3,
        lv1Code: lv1CodeByName.get(lv1) || "",
        lv2Code: "",
        prefix: normalizeText(prefix),
        ruleType: "lv3_supplemental_prefix",
        status: "active",
        source: preview.source_file_name || "Source DB regularize_0608_renumbered.xlsx",
      });
    });
    return rows;
  }

  function findCodingRule({ lv1, lv2, lv3, rules = [] } = {}) {
    const active = rules.filter((rule) => normalizeText(rule.status || "active") === "active");
    return active.find((rule) =>
      normalizeText(rule.lv1) === normalizeText(lv1)
      && normalizeText(rule.lv2) === normalizeText(lv2)
      && normalizeText(rule.lv3)
      && normalizeText(rule.lv3) === normalizeText(lv3))
      || active.find((rule) =>
        normalizeText(rule.lv1) === normalizeText(lv1)
        && normalizeText(rule.lv2) === normalizeText(lv2)
        && !normalizeText(rule.lv3));
  }

  function formatSequence(prefix, value) {
    return `${prefix}-${String(Number(value || 0)).padStart(5, "0")}`;
  }

  function generateFactoryMaterialNo({ lv1, lv2, lv3 = "", rules = [], sequences = {} } = {}) {
    const rule = findCodingRule({ lv1, lv2, lv3, rules });
    if (!rule) {
      return {
        ok: false,
        factoryMaterialNo: "",
        prefix: "",
        nextSequence: null,
        materialCodingReviewStatus: MATERIAL_CODING_NEEDS_REVIEW,
      };
    }
    const current = Number(sequences[rule.prefix] || 0);
    const nextSequence = current + 1;
    const result = {
      ok: true,
      factoryMaterialNo: formatSequence(rule.prefix, nextSequence),
      prefix: rule.prefix,
      nextSequence,
      materialCodingReviewStatus: MATERIAL_CODING_APPROVED,
    };
    if (rule.id) result.ruleId = rule.id;
    return result;
  }

  function importSummaryFromPreview(preview = {}) {
    const catalogRows = catalogRowsFromPreview(preview);
    const taxonomyRows = taxonomyRowsFromPreview(preview);
    const needReview = catalogRows.filter((row) => row.materialCodingReviewStatus === MATERIAL_CODING_NEEDS_REVIEW).length;
    return {
      taxonomy_count: taxonomyRows.length,
      catalog_candidate_count: catalogRows.length,
      retained_factory_material_no_count: catalogRows.filter((row) => row.factoryMaterialNo).length,
      generated_factory_material_no_count: 0,
      need_material_coding_review_count: needReview,
      missing_factory_material_no_or_lv123_count: Math.max(Number(preview.total_rows_in_sheet || 0) - catalogRows.length, 0),
    };
  }

  const api = {
    MATERIAL_CODING_APPROVED,
    MATERIAL_CODING_NEEDS_REVIEW,
    MATERIAL_CODING_VALID,
    MATERIAL_CODING_REJECTED,
    taxonomyRowsFromPreview,
    taxonomyTree,
    catalogRowsFromPreview,
    materialCodingReviewStatus,
    requesterCatalogItem,
    adminCatalogItem,
    codingRulesFromPreview,
    findCodingRule,
    generateFactoryMaterialNo,
    importSummaryFromPreview,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.materialCoding = api;
  }
})();
