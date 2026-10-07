(function registerOmBusinessFlowModule(root) {
  const PAS_DEMAND_REQUIREMENT_MASTER = [
    {
      id: "pas-demand-mini-pc-ipc",
      itemCategory: "Mini PC / IPC",
      matchKeywords: ["mini pc", "ipc", "industrial pc"],
      pasDemandRequired: true,
      active: true,
      ownerRole: "OM Purchasing",
      note: "Hard landing hardware requires PAS Demand ID before Quote Result.",
    },
    {
      id: "pas-demand-monitor",
      itemCategory: "Monitor",
      matchKeywords: ["monitor", "display"],
      pasDemandRequired: true,
      active: true,
      ownerRole: "OM Purchasing",
      note: "Hard landing display hardware requires PAS Demand ID before Quote Result.",
    },
    {
      id: "pas-demand-barcode-scanner",
      itemCategory: "Barcode / scanner",
      matchKeywords: ["barcode", "scanner", "zebra", "data collector"],
      pasDemandRequired: true,
      active: true,
      ownerRole: "OM Purchasing",
      note: "Hard landing scanner hardware requires PAS Demand ID before Quote Result.",
    },
    {
      id: "pas-demand-computer-peripheral",
      itemCategory: "Computer peripheral",
      matchKeywords: ["laptop", "computer", "printer", "terminal"],
      pasDemandRequired: true,
      active: true,
      ownerRole: "OM Purchasing",
      note: "Hard landing computer peripheral requires PAS Demand ID before Quote Result.",
    },
  ];

  const HARD_ITEM_RULES = PAS_DEMAND_REQUIREMENT_MASTER.map((record) => ({
    label: `Hard Item: ${record.itemCategory}`,
    keywords: record.matchKeywords,
  }));

  function normalizeText(value = "") {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizedNameSpecKey(row = {}) {
    return normalizeText([row.name || row.itemName || row.item || "", row.spec || row.detail || row.description || ""].join(" "));
  }

  function normalizePasDemandRequirementMasterRecord(record = {}) {
    return {
      id: String(record.id || record.masterRecordId || "").trim(),
      itemCategory: String(record.itemCategory || record.category || record.label || "").trim(),
      matchKeywords: Array.isArray(record.matchKeywords)
        ? record.matchKeywords
        : Array.isArray(record.keywords)
          ? record.keywords
          : String(record.matchKeywords || record.keywords || "").split(","),
      pasDemandRequired: Boolean(record.pasDemandRequired ?? record.pas_demand_required),
      active: record.active !== false,
      ownerRole: String(record.ownerRole || record.owner_role || "OM Purchasing").trim(),
      note: String(record.note || "").trim(),
    };
  }

  function activePasDemandRequirementMaster(masterRows = PAS_DEMAND_REQUIREMENT_MASTER) {
    return (masterRows || [])
      .map(normalizePasDemandRequirementMasterRecord)
      .filter((record) => record.active && record.matchKeywords.some((keyword) => normalizeText(keyword)));
  }

  function pasDemandRequirementMasterMatch(row = {}, masterRows = PAS_DEMAND_REQUIREMENT_MASTER) {
    const key = normalizedNameSpecKey(row);
    return activePasDemandRequirementMaster(masterRows).find((record) =>
      record.matchKeywords.some((keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        return normalizedKeyword && key.includes(normalizedKeyword);
      })
    ) || null;
  }

  function hardItemMatch(row = {}, masterRows = PAS_DEMAND_REQUIREMENT_MASTER) {
    if (row.isHardItem === true) {
      return {
        isHardItem: true,
        reason: row.hardItemReason || "Hard Item rule override",
        masterRecordId: row.hardItemMasterRecordId || "",
        itemCategory: row.hardItemCategory || "",
      };
    }
    const record = pasDemandRequirementMasterMatch(row, masterRows);
    return record?.pasDemandRequired
      ? {
        isHardItem: true,
        reason: `Hard Item: ${record.itemCategory || record.id}`,
        masterRecordId: record.id,
        itemCategory: record.itemCategory,
      }
      : { isHardItem: false, reason: "Other request", masterRecordId: "", itemCategory: "" };
  }

  function pasDemandRequirement(row = {}, masterRows = PAS_DEMAND_REQUIREMENT_MASTER) {
    const record = pasDemandRequirementMasterMatch(row, masterRows);
    const match = hardItemMatch(row, masterRows);
    const required = row.pasDemandRequired === true || Boolean(record?.pasDemandRequired) || match.isHardItem;
    const reason = required
      ? `${match.reason || `PAS Demand master: ${record?.itemCategory || record?.id || "override"}`}; required before Quote Result.`
      : "Other request; PAS Demand ID is optional before quote flow.";
    return {
      required,
      label: required ? "PAS Demand ID Required" : "PAS Demand ID Optional",
      reason,
      isHardItem: match.isHardItem,
      masterRecordId: record?.id || match.masterRecordId || "",
      itemCategory: record?.itemCategory || match.itemCategory || "",
    };
  }

  const QUOTE_DB_RECORDS = [
    {
      id: "QDB-IPC-I3-QCT1250-202606",
      normalizedNameSpecKey: normalizeText("IPC DELL Pro Tower QCT1250 Core i3 14100 8GB DDR5 512GB SSD Integrated graphics card Keyboard and Mouse 3Yrs Wty"),
      itemName: "IPC",
      spec: "DELL Pro Tower QCT1250, Core i3-14100, 8GB DDR5, 512GB SSD, Integrated graphics card, Keyboard and Mouse, 3Yrs Wty",
      vendor: "VVN0010445 CONG TY CO PHAN KY NGHE BANICO",
      vendorCode: "VVN0010445",
      unitPrice: 10870000,
      unitPriceUsd: 418.08,
      currency: "VND",
      quoteDate: "2026-06-01",
      quoteValidUntil: "2026-08-31",
      referenceQty: 184,
      bufferNote: "Imported from current Bidding database and available for Central IT confirmation.",
      pasDemandId: "PAS-HARD-IPC-I3-2026",
      pasMaterialNo: "PAS-IPC-I3-QCT1250",
    },
    {
      id: "QDB-IPC-I5-QCT1250-202606",
      normalizedNameSpecKey: normalizeText("IPC DELL Pro Tower QCT1250 Intel Core i5 14500 vPro Ram 16GB DDR5 SSD 1TB RJ45 USB3 0 3 USB2 0 3 HDMI Serial Port Power supply 360W Keyboard and Mouse 3Yrs Wty"),
      itemName: "IPC+",
      spec: "DELL Pro Tower (QCT1250), Intel Core i5-14500 vPro, Ram 16GB DDR5, SSD 1TB, RJ45/ USB3.0*3 /USB2.0*3 / HDMI / Serial Port / Power supply 360W, Keyboard and Mouse, 3Yrs Wty",
      vendor: "VVN0000011 CONG TY TNHH CONG NGHE ECOLIV",
      vendorCode: "VVN0000011",
      unitPrice: 14200000,
      unitPriceUsd: 546.15,
      currency: "VND",
      quoteDate: "2026-06-01",
      quoteValidUntil: "2026-08-31",
      referenceQty: 270,
      bufferNote: "Imported from current Bidding database and available for Central IT confirmation.",
      pasDemandId: "PAS-HARD-IPC-I5-2026",
      pasMaterialNo: "PAS-IPC-I5-QCT1250",
    },
    {
      id: "QDB-MINI-PC-I5-202606",
      normalizedNameSpecKey: normalizeText("Mini PC Industrial IPC Intel i5 16GB RAM"),
      itemName: "Mini PC",
      spec: "Industrial IPC, Intel i5, 16GB RAM",
      vendor: "Central IT Sourcing",
      unitPrice: 318,
      currency: "USD",
      quoteDate: "2026-06-01",
      quoteValidUntil: "2026-08-31",
      referenceQty: 500,
      bufferNote: "Reference qty already includes sourcing buffer.",
      pasDemandId: "PAS-HARD-IPC-2026",
      pasMaterialNo: "PAS-MINI-PC-I5",
    },
    {
      id: "QDB-MONITOR-E2225-202605",
      normalizedNameSpecKey: normalizeText("Monitor Dell E2225HM 22 inch"),
      itemName: "Monitor",
      spec: "Dell E2225HM 22 inch",
      vendor: "Central IT Sourcing",
      unitPrice: 92,
      currency: "USD",
      quoteDate: "2026-04-20",
      quoteValidUntil: "2026-05-31",
      referenceQty: 800,
      bufferNote: "Expired reference kept for requote trail only.",
      pasDemandId: "PAS-HARD-MONITOR-2026",
      pasMaterialNo: "PAS-MON-E2225HM",
    },
  ];

  function daysUntil(dateText, today = new Date()) {
    if (!dateText) return null;
    const target = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const base = new Date(today);
    base.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - base.getTime()) / 86400000);
  }

  function quoteDbCandidateStatus(candidate = {}, row = {}, today = new Date()) {
    const remaining = daysUntil(candidate.quoteValidUntil, today);
    const expired = remaining === null || remaining < 0;
    const centralItChecked = Boolean(row.centralItCheckedAt && (!row.quoteDbCandidateId || row.quoteDbCandidateId === candidate.id));
    return {
      status: expired ? "Expired" : centralItChecked ? "Reusable" : "Valid - Need Central IT Check",
      reusable: !expired && centralItChecked,
      expired,
      daysLeft: remaining,
      quantityBlocksReuse: false,
      quantityNote: `Requested ${Number(row.qty || row.totalQty || 0).toLocaleString("en-US")} / quote ref ${Number(candidate.referenceQty || 0).toLocaleString("en-US")}. Quantity is not a hard stop.`,
    };
  }

  function findQuoteDbCandidates(row = {}, records = QUOTE_DB_RECORDS) {
    const key = normalizedNameSpecKey(row);
    const exactMatches = records.filter((record) => record.normalizedNameSpecKey === key);
    if (exactMatches.length) return exactMatches;
    const rowTokens = new Set(key.split(" ").filter(Boolean));
    return records.filter((record) => {
      const itemKey = normalizeText(record.itemName || "");
      const specTokens = normalizeText(record.spec || "")
        .split(" ")
        .filter((token) => token.length > 1 && !["and", "with"].includes(token));
      return itemKey && key.includes(itemKey) && specTokens.length && specTokens.every((token) => rowTokens.has(token));
    });
  }

  function bestQuoteDbCandidate(row = {}, records = QUOTE_DB_RECORDS, today = new Date()) {
    const candidates = findQuoteDbCandidates(row, records);
    return candidates.find((candidate) => !quoteDbCandidateStatus(candidate, row, today).expired) || candidates[0] || null;
  }

  function purposeLocations(row = {}) {
    if (Array.isArray(row.purposeLocations) && row.purposeLocations.length) {
      return [...new Set(row.purposeLocations.map((item) => String(item).toUpperCase()).filter(Boolean))].sort();
    }
    const text = normalizeText([row.station, row.process, row.department, row.requestDept].join(" "));
    const inferred = [];
    if (text.includes("smt")) inferred.push("SMT");
    if (text.includes("fatp")) inferred.push("FATP");
    return inferred.length ? inferred.sort() : ["SMT"];
  }

  function purposeProjectBuildKey(row = {}) {
    if (row.purposeProjectBuildKey) return row.purposeProjectBuildKey;
    const yearProject = row.yearProject || row.yearProjectCode || row.sourceProject || "";
    const project = row.project || row.projectCode || "";
    const phase = row.phase || row.stage || row.currentPhase || "";
    return [yearProject, project, phase, purposeLocations(row).join("+")]
      .map((part) => normalizeText(part).replace(/\s+/g, "-") || "all")
      .join("|");
  }

  function budgetCodeForPurposeProjectBuild(key = "") {
    const normalized = normalizeText(key).replace(/\s+/g, "-").toUpperCase();
    return `BUD-${normalized.slice(0, 42) || "PURPOSE-BUILD"}`;
  }

  function budgetCodeForRow(row = {}) {
    return row.budgetCode || budgetCodeForPurposeProjectBuild(purposeProjectBuildKey(row));
  }

  function normalizePasDemandNo(value = "") {
    return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
  }

  function pasDemandGroupSuggestion(row = {}, rows = []) {
    const pasDemandId = normalizePasDemandNo(row.pasDemandNo || row.pasDemandId || "");
    if (!pasDemandId) {
      return { hasGroup: false, pasDemandId: "", rowIds: [], rows: [], message: "No PAS Demand No" };
    }
    const groupRows = rows.filter((candidate) => normalizePasDemandNo(candidate.pasDemandNo || candidate.pasDemandId || "") === pasDemandId);
    const hasGroup = groupRows.length > 1;
    return {
      hasGroup,
      pasDemandId,
      rowIds: groupRows.map((candidate) => candidate.id).filter(Boolean),
      rows: groupRows,
      message: hasGroup ? `Same PAS Demand No group: ${groupRows.length} items` : "No same-demand group",
    };
  }

  function groupRowsByPasDemandId(rows = []) {
    const groups = new Map();
    rows.forEach((row) => {
      const pasDemandId = normalizePasDemandNo(row.pasDemandNo || row.pasDemandId || "") || "PAS-Demand-Pending";
      if (!groups.has(pasDemandId)) groups.set(pasDemandId, []);
      groups.get(pasDemandId).push(row);
    });
    return [...groups.entries()].map(([pasDemandId, groupRows]) => ({ pasDemandId, rows: groupRows }));
  }

  function groupRowsForPasExcelExport(rows = []) {
    const grouped = new Map();
    rows.forEach((row) => {
      const pasDemandId = normalizePasDemandNo(row.pasDemandNo || row.pasDemandId || "") || "PAS-Demand-Pending";
      const mergeDecision = row.pasExcelMergeDecision === "separate" ? "separate" : "merge";
      const key = mergeDecision === "separate" ? `${pasDemandId}__${row.id || grouped.size + 1}` : pasDemandId;
      if (!grouped.has(key)) grouped.set(key, { pasDemandId: key, displayPasDemandId: pasDemandId, mergeDecision, rows: [] });
      grouped.get(key).rows.push(row);
    });
    return [...grouped.values()];
  }

  function safePasExcelFilePart(value = "") {
    const normalized = normalizePasDemandNo(value);
    return normalized.replace(/[^a-zA-Z0-9._-]+/g, "-") || "PAS-Demand-Pending";
  }

  function pasExcelSystemFileName(group = {}) {
    const groupId = group.pasDemandId || group.displayPasDemandId || "PAS-Demand-Pending";
    return `${safePasExcelFilePart(groupId)}-PAS-Tracking.xlsx`;
  }

  function pasExcelSystemAttachmentSummary(group = {}, createdAt = new Date().toISOString()) {
    const rows = group.rows || [];
    const displayPasDemandId = normalizePasDemandNo(group.displayPasDemandId || group.pasDemandId || "") || "PAS-Demand-Pending";
    const linkedEntityId = group.pasDemandId || displayPasDemandId;
    const rowIds = rows.map((row) => row.id).filter(Boolean);
    const mergeDecision = group.mergeDecision || "merge";
    return {
      fileName: pasExcelSystemFileName(group),
      linkedEntityType: "om_pas_excel_group",
      linkedEntityId,
      attachmentKind: "om_pas_tracking_system_excel",
      visibilityScope: "om_internal",
      rowIds,
      metadata: {
        source: "system_generated_pas_excel",
        pasDemandNo: displayPasDemandId,
        mergeDecision,
        rowIds,
        rowCount: rows.length,
        createdAt,
      },
    };
  }

  function applyQuoteDbCandidate(row = {}, candidate = {}, checkedAt = new Date().toISOString(), checkedBy = "OM Purchasing") {
    const currency = candidate.currency || "USD";
    const candidateUnitPrice = Number(candidate.unitPrice || 0);
    const candidateUnitPriceUsd = Number(candidate.unitPriceUsd || 0);
    const candidateUnitPriceVnd = Number(candidate.unitPriceVnd || (currency === "VND" ? candidateUnitPrice : 0));
    return {
      ...row,
      quoteDbCandidateId: candidate.id || row.quoteDbCandidateId || "",
      centralItCheckedAt: checkedAt,
      centralItCheckedBy: checkedBy,
      vendor: row.vendor || candidate.vendor || "",
      vendorPartNo: row.vendorPartNo || candidate.vendorPartNo || candidate.vendorCode || "",
      updatedPrice: row.updatedPrice || (currency === "USD" ? candidateUnitPrice : candidateUnitPriceUsd || row.updatedPrice),
      updatedPriceUsd: row.updatedPriceUsd || (currency === "USD" ? candidateUnitPrice : candidateUnitPriceUsd || row.updatedPriceUsd),
      updatedPriceVnd: row.updatedPriceVnd || (currency === "VND" ? candidateUnitPrice : candidateUnitPriceVnd || row.updatedPriceVnd),
      unitPriceCurrency: row.unitPriceCurrency || currency,
      quoteDate: row.quoteDate || candidate.quoteDate || "",
      quoteValidUntil: row.quoteValidUntil || candidate.quoteValidUntil || "",
      quoteExpiry: row.quoteExpiry || candidate.quoteValidUntil || "",
      pasDemandNo: row.pasDemandNo || candidate.pasDemandId || "",
      pasMaterialNo: row.pasMaterialNo || candidate.pasMaterialNo || "",
    };
  }

  const api = {
    PAS_DEMAND_REQUIREMENT_MASTER,
    HARD_ITEM_RULES,
    QUOTE_DB_RECORDS,
    normalizeText,
    normalizedNameSpecKey,
    normalizePasDemandRequirementMasterRecord,
    activePasDemandRequirementMaster,
    pasDemandRequirementMasterMatch,
    hardItemMatch,
    pasDemandRequirement,
    quoteDbCandidateStatus,
    findQuoteDbCandidates,
    bestQuoteDbCandidate,
    purposeLocations,
    purposeProjectBuildKey,
    budgetCodeForPurposeProjectBuild,
    budgetCodeForRow,
    normalizePasDemandNo,
    pasDemandGroupSuggestion,
    groupRowsByPasDemandId,
    groupRowsForPasExcelExport,
    pasExcelSystemFileName,
    pasExcelSystemAttachmentSummary,
    applyQuoteDbCandidate,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.omBusinessFlow = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
