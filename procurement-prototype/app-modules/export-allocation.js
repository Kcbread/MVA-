(function registerExportAllocationModule(root) {
  const STORAGE_KEY = 'procurementExportAllocationLedger.v1';
  const DEFAULT_STATUS = "Draft";

  function safeNumber(value) {
    const next = Number(value || 0);
    return Number.isFinite(next) ? Math.max(0, next) : 0;
  }

  function breakdownQty(row = {}) {
    if (Object.prototype.hasOwnProperty.call(row, "qty")) return safeNumber(row.qty);
    return ["p0", "p10", "p11", "evt", "dvt", "pvt", "mp"]
      .reduce((sum, stage) => sum + safeNumber(row[stage]), 0);
  }

  function normalizedDemandType(value = "") {
    return String(value || "").toLowerCase().includes("non") ? "Non-MFG" : "MFG";
  }

  function nowIso(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function storageLike(storage) {
    if (storage && typeof storage.getItem === "function" && typeof storage.setItem === "function") return storage;
    return {
      memory: "",
      getItem() {
        return this.memory || "";
      },
      setItem(_key, value) {
        this.memory = value;
      },
    };
  }

  function loadState(storage = root.localStorage) {
    const activeStorage = storageLike(storage);
    const raw = activeStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], events: [] };
    try {
      const parsed = JSON.parse(raw);
      return {
        lines: Array.isArray(parsed.lines) ? parsed.lines : [],
        events: Array.isArray(parsed.events) ? parsed.events : [],
      };
    } catch (_error) {
      return { lines: [], events: [] };
    }
  }

  function saveState(state, storage = root.localStorage) {
    const activeStorage = storageLike(storage);
    activeStorage.setItem(STORAGE_KEY, JSON.stringify({
      lines: Array.isArray(state.lines) ? state.lines : [],
      events: Array.isArray(state.events) ? state.events : [],
    }));
    return state;
  }

  function sourceOriginalQty(row = {}) {
    const directQty = safeNumber(row.totalQty ?? row.qty ?? row.quantity);
    if (directQty > 0) return directQty;
    if (!Array.isArray(row.stationBreakdown)) return 0;
    return row.stationBreakdown.reduce((sum, item) => sum + breakdownQty(item), 0);
  }

  function firstBreakdownScope(row = {}) {
    const first = Array.isArray(row.stationBreakdown)
      ? row.stationBreakdown.find((item) => breakdownQty(item) > 0) || row.stationBreakdown[0]
      : null;
    const demandType = normalizedDemandType(first?.demandType || row.demandType);
    return {
      demandType,
      phase: first?.phase || "",
      stationUnit: demandType === "Non-MFG"
        ? first?.demandUnit || first?.department || ""
        : first?.station || first?.stationOrUnit || "",
    };
  }

  function normalizeText(value = "") {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function sourceItem(row = {}) {
    return row.name || row.item || row.itemName || "";
  }

  function sourceSpec(row = {}) {
    return row.detail || row.spec || row.itemSpec || "";
  }

  function matchesSourceItem(sourceRow = {}, candidate = {}) {
    const sourceItemKey = normalizeText(sourceItem(sourceRow));
    const candidateItemKey = normalizeText(sourceItem(candidate));
    if (!sourceItemKey || !candidateItemKey || sourceItemKey !== candidateItemKey) return false;
    const sourceSpecKey = normalizeText(sourceSpec(sourceRow));
    const candidateSpecKey = normalizeText(sourceSpec(candidate));
    return !sourceSpecKey || !candidateSpecKey || sourceSpecKey === candidateSpecKey;
  }

  function sourceScopeTrace(row = {}) {
    return [
      row.project || row.sourceProject || "",
      row.line || row.sourceLine || "",
      row.currentPhase || row.phase || row.sourceStage || "",
      row.station || row.demandUnit || row.targetStationUnit || row.sourceStation || row.sourceStationOrUnit || "",
      row.id || row.sourceRequestId || "",
    ].filter(Boolean).join(" / ");
  }

  function warehouseTrace(row = {}) {
    const source = row.topSource || row.stockSources?.[0] || row;
    return [
      source.sourceProject || row.sourceProject || "",
      source.sourceLine || row.sourceLine || "",
      source.sourceStage || row.sourceStage || "",
      source.sourceStation || source.sourceStationOrUnit || row.sourceStation || row.sourceStationOrUnit || "",
      source.sourceRequestId || row.sourceRequestId || "",
    ].filter(Boolean).join(" / ") || row.sourceTrace || "Warehouse source trace pending";
  }

  function carryoverTrace(row = {}) {
    return [
      row.sourceProject || "",
      row.sourceLine || row.carryoverFrom || "",
      row.sourceStage || row.phase || "",
      row.sourceStation || row.stationOrUnit || "",
      row.sourceEvidenceRequestId || row.sourceRequestId || "",
      row.targetProject || row.project ? `to ${row.targetProject || row.project}` : "",
      row.targetLine || row.requestLine || row.line || "",
    ].filter(Boolean).join(" / ") || row.reason || "Carryover trace pending";
  }

  function buildSourcePool(sourceRow = {}, { warehouseRows = [], carryoverRows = [] } = {}) {
    const exportRow = {
      sourceId: sourceRow.id || "export-row",
      sourceType: "Export Row",
      item: sourceItem(sourceRow),
      spec: sourceSpec(sourceRow),
      availableQty: sourceOriginalQty(sourceRow),
      status: "Original demand",
      sourceTrace: sourceScopeTrace(sourceRow),
    };
    const warehousePool = warehouseRows
      .filter((row) => matchesSourceItem(sourceRow, row))
      .map((row, index) => ({
        sourceId: row.id || row.summaryId || `warehouse-${index + 1}`,
        sourceType: "Warehouse Stock",
        item: sourceItem(row),
        spec: sourceSpec(row),
        availableQty: safeNumber(row.availableQty ?? row.qty ?? row.ownedQty),
        status: row.status || "Available",
        sourceTrace: warehouseTrace(row),
      }))
      .filter((row) => row.availableQty > 0);
    const carryoverPool = carryoverRows
      .filter((row) => matchesSourceItem(sourceRow, row))
      .map((row, index) => ({
        sourceId: row.id || row.carryoverLedgerId || `carryover-${index + 1}`,
        sourceType: "Carryover",
        item: sourceItem(row),
        spec: sourceSpec(row),
        availableQty: safeNumber(row.carryoverQty ?? row.qty),
        status: row.reviewStatus || row.status || "Pending Dept DRI",
        sourceTrace: carryoverTrace(row),
      }))
      .filter((row) => row.availableQty > 0);
    return [exportRow, ...warehousePool, ...carryoverPool];
  }

  function createAllocationId(sourceRow = {}, index = 1) {
    return `${sourceRow.id || "REQ"}-ALLOC-${String(index).padStart(2, "0")}`;
  }

  function lineStatusForTarget(target = "", exported = false) {
    if (exported) return `Exported to ${target || "Buyer"}`;
    if (target) return `Ready for ${target}`;
    return DEFAULT_STATUS;
  }

  function normalizeLine(sourceRow = {}, line = {}, index = 0) {
    const originalQty = sourceOriginalQty(sourceRow);
    const breakdownScope = firstBreakdownScope(sourceRow);
    const targetDemandType = normalizedDemandType(line.targetDemandType || line.demandType || breakdownScope.demandType || sourceRow.demandType);
    return {
      allocationId: line.allocationId || createAllocationId(sourceRow, index + 1),
      sourceRequestId: sourceRow.id || line.sourceRequestId || "",
      sourceProject: sourceRow.project || line.sourceProject || "",
      targetProject: line.targetProject || sourceRow.project || "",
      targetDemandType,
      targetPhase: line.targetPhase || sourceRow.currentPhase || sourceRow.phase || breakdownScope.phase || "",
      targetStationUnit: line.targetStationUnit || line.targetStationOrUnit || breakdownScope.stationUnit || (targetDemandType === "Non-MFG" ? sourceRow.demandUnit : sourceRow.station) || "",
      item: line.item || sourceRow.name || sourceRow.item || "",
      spec: line.spec || sourceRow.detail || sourceRow.spec || "",
      originalQty,
      allocatedQty: safeNumber(line.allocatedQty),
      pasQuoteId: line.pasQuoteId || sourceRow.pasQuoteId || sourceRow.pasDemandNo || "",
      budgetCode: line.budgetCode || "",
      quotationPdf: line.quotationPdf || line.quoteScreenshot || sourceRow.quotationPdf || "",
      quotationPdfAttachmentId: line.quotationPdfAttachmentId || line.quotationScreenshotAttachmentId || sourceRow.quotationPdfAttachmentId || sourceRow.quotationScreenshotAttachmentId || "",
      quotationPdfUrl: line.quotationPdfUrl || line.quotationScreenshotUrl || sourceRow.quotationPdfUrl || sourceRow.quotationScreenshotUrl || "",
      quotationExcel: line.quotationExcel || sourceRow.quotationExcel || "",
      quotationExcelAttachmentId: line.quotationExcelAttachmentId || sourceRow.quotationExcelAttachmentId || "",
      quotationExcelUrl: line.quotationExcelUrl || sourceRow.quotationExcelUrl || "",
      packageCode: line.packageCode || "",
      costType: line.costType || "",
      exportTarget: line.exportTarget || "",
      status: line.status || DEFAULT_STATUS,
      createdAt: line.createdAt || nowIso(),
      updatedAt: line.updatedAt || line.createdAt || nowIso(),
      exportedAt: line.exportedAt || "",
    };
  }

  function defaultAllocationLine(sourceRow = {}) {
    return normalizeLine(sourceRow, {
      allocatedQty: sourceOriginalQty(sourceRow),
    }, 0);
  }

  function lineHasQuoteAttachments(line = {}) {
    return Boolean((line.quotationPdf || line.quoteScreenshot) && line.quotationExcel);
  }

  function linesForRequest(requestId, storage = root.localStorage) {
    return loadState(storage).lines.filter((line) => line.sourceRequestId === requestId);
  }

  function eventsForRequest(requestId, storage = root.localStorage) {
    return loadState(storage).events.filter((event) => event.sourceRequestId === requestId);
  }

  function appendEvent(state, sourceRow = {}, line = {}, { type = "Allocation updated", actor = "OM Purchasing", reason = "" } = {}) {
    state.events.push({
      eventId: `${line.allocationId || createAllocationId(sourceRow, state.events.length + 1)}-${state.events.length + 1}`,
      sourceRequestId: sourceRow.id || line.sourceRequestId || "",
      allocationId: line.allocationId || "",
      type,
      sourceProject: sourceRow.project || line.sourceProject || "",
      targetProject: line.targetProject || "",
      allocatedQty: safeNumber(line.allocatedQty),
      budgetCode: line.budgetCode || "",
      actor,
      reason,
      timestamp: nowIso(),
    });
  }

  function replaceLinesForRequest(sourceRow = {}, lines = [], { storage = root.localStorage, actor = "OM Purchasing", reason = "Allocation updated", eventType = "Allocation updated" } = {}) {
    const state = loadState(storage);
    const untouched = state.lines.filter((line) => line.sourceRequestId !== sourceRow.id);
    const nextLines = lines.map((line, index) => normalizeLine(sourceRow, line, index));
    state.lines = [...untouched, ...nextLines];
    nextLines.forEach((line) => appendEvent(state, sourceRow, line, { type: eventType, actor, reason }));
    saveState(state, storage);
    return clone(nextLines);
  }

  function ensureDefaultAllocation(sourceRow = {}, { storage = root.localStorage, actor = "OM Purchasing" } = {}) {
    const existing = linesForRequest(sourceRow.id, storage);
    if (existing.length) return existing.map((line) => normalizeLine(sourceRow, line));
    const seedLines = Array.isArray(sourceRow.exportAllocationLines) && sourceRow.exportAllocationLines.length
      ? sourceRow.exportAllocationLines
      : [defaultAllocationLine(sourceRow)];
    return replaceLinesForRequest(sourceRow, seedLines, {
      storage,
      actor,
      reason: "Create default allocation line from original demand.",
      eventType: "Created",
    });
  }

  function addAllocationLine(sourceRow = {}, overrides = {}, { storage = root.localStorage, actor = "OM Purchasing" } = {}) {
    const existing = ensureDefaultAllocation(sourceRow, { storage, actor });
    const next = [
      ...existing,
      normalizeLine(sourceRow, {
        allocatedQty: 0,
        targetProject: overrides.targetProject || sourceRow.project || "",
        targetDemandType: overrides.targetDemandType || overrides.demandType || "",
        targetPhase: overrides.targetPhase || sourceRow.currentPhase || sourceRow.phase || "",
        targetStationUnit: overrides.targetStationUnit || overrides.targetStationOrUnit || "",
      }, existing.length),
    ];
    return replaceLinesForRequest(sourceRow, next, {
      storage,
      actor,
      reason: "Add allocation split line.",
      eventType: "Split",
    });
  }

  function removeAllocationLine(sourceRow = {}, allocationId = "", { storage = root.localStorage, actor = "OM Purchasing" } = {}) {
    const existing = ensureDefaultAllocation(sourceRow, { storage, actor });
    const next = existing.filter((line) => line.allocationId !== allocationId);
    if (!next.length) {
      return replaceLinesForRequest(sourceRow, [defaultAllocationLine(sourceRow)], {
        storage,
        actor,
        reason: "Remove split line and restore default allocation.",
        eventType: "Released",
      });
    }
    return replaceLinesForRequest(sourceRow, next, {
      storage,
      actor,
      reason: "Remove allocation split line.",
      eventType: "Released",
    });
  }

  function buildAllocationLineBudgetCode(packageCode = "", index = 0) {
    return `${packageCode || "OM-ALLOC"}-A${String(index + 1).padStart(2, "0")}`;
  }

  function prepareAllocationsForExport(sourceRow = {}, lines = [], { packageCode = "", target = "", costType = "", preparedAt = nowIso() } = {}) {
    return lines.map((line, index) => normalizeLine(sourceRow, {
      ...line,
      packageCode,
      budgetCode: line.budgetCode || buildAllocationLineBudgetCode(packageCode, index),
      costType,
      exportTarget: target,
      status: lineStatusForTarget(target, false),
      updatedAt: preparedAt,
    }, index));
  }

  function markAllocationsExported(sourceRow = {}, lines = [], { target = "", exportedAt = nowIso() } = {}) {
    return lines.map((line, index) => normalizeLine(sourceRow, {
      ...line,
      exportTarget: target || line.exportTarget || "",
      status: lineStatusForTarget(target || line.exportTarget || "", true),
      exportedAt,
      updatedAt: exportedAt,
    }, index));
  }

  function summarizeSourceRow(sourceRow = {}, lines = []) {
    const originalQty = sourceOriginalQty(sourceRow);
    const allocatedQty = lines.reduce((sum, line) => sum + safeNumber(line.allocatedQty), 0);
    const uncoveredQty = Math.max(0, originalQty - allocatedQty);
    const budgetCodeCount = lines.filter((line) => line.budgetCode).length;
    const statuses = [...new Set(lines.map((line) => line.status).filter(Boolean))];
    let status = "Not Allocated";
    if (statuses.every((value) => value.startsWith("Exported"))) status = "Exported";
    else if (statuses.every((value) => value.startsWith("Ready for"))) status = "Ready for Export";
    else if (allocatedQty > 0 && uncoveredQty > 0) status = "Partial Allocation";
    else if (allocatedQty >= originalQty && lines.length) status = "Allocated";
    return {
      originalQty,
      allocatedQty,
      uncoveredQty,
      splitCount: lines.length,
      budgetCodeCount,
      status,
    };
  }

  const api = {
    STORAGE_KEY,
    loadState,
    saveState,
    linesForRequest,
    eventsForRequest,
    ensureDefaultAllocation,
    addAllocationLine,
    removeAllocationLine,
    replaceLinesForRequest,
    defaultAllocationLine,
    lineHasQuoteAttachments,
    summarizeSourceRow,
    buildSourcePool,
    prepareAllocationsForExport,
    markAllocationsExported,
    buildAllocationLineBudgetCode,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.exportAllocation = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
