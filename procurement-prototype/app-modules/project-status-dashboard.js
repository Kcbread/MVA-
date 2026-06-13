(function registerProjectStatusDashboardModule(root) {
  const workflowStatus = root.ProcurementApp?.modules?.workflowStatus
    || (typeof require !== "undefined" ? require("./workflow-status.js") : {});

  const STAGE_ORDER = ["p10", "p11", "evt", "dvt", "pvt", "mp"];
  const STAGE_LABELS = {
    p10: "P1.0",
    p11: "P1.1",
    evt: "EVT",
    dvt: "DVT",
    pvt: "PVT",
    mp: "MP",
  };
  const DASHBOARD_UNITS = ["MFG", "FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
  const OWNER_PRIORITY = {
    "Dept DRI": 0,
    "Cost Manager": 1,
    "Budget Approver": 2,
    Requester: 3,
    "PAS / Bidding": 4,
    "OM Purchasing": 5,
    "Buyer Handoff": 6,
    "OM Complete": 9,
  };

  function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function cleanNumber(value) {
    return Math.max(0, Number(value) || 0);
  }

  function phaseKey(value = "") {
    const normalized = normalize(value).replace(/[\s_.-]+/g, "");
    const aliases = {
      p10: "p10",
      p1: "p10",
      p11: "p11",
      evt: "evt",
      dvt: "dvt",
      pvt: "pvt",
      mp: "mp",
    };
    return aliases[normalized] || "";
  }

  function normalizeUnit(value = "") {
    const normalized = normalize(value).replace(/[\s_-]+/g, "");
    if (!normalized || normalized === "mfg" || normalized === "mfgnong") return "MFG";
    if (["te", "fatte", "fatpte"].includes(normalized)) return "FATP TE";
    if (["iqc", "fatiqc", "fatpiqc"].includes(normalized)) return "FATP IQC";
    if (["pqe", "fatpqe", "fatppqe"].includes(normalized)) return "FATP PQE";
    if (["wh", "ggwh"].includes(normalized)) return "WH";
    if (["qlab", "qalab"].includes(normalized)) return "Q-LAB";
    if (normalized === "rel") return "REL";
    if (normalized === "eng1") return "ENG1";
    if (normalized === "eng2") return "ENG2";
    if (normalized === "eng3") return "ENG3";
    if (normalized === "it") return "IT";
    if (["fac", "facility"].includes(normalized)) return "FAC";
    return "";
  }

  function demandTypeFor(entry = {}) {
    const raw = normalize(entry.demandType || entry.type);
    if (raw.includes("non")) return "Non-MFG";
    if (entry.demandUnit && normalizeUnit(entry.demandUnit) !== "MFG") return "Non-MFG";
    if (Object.prototype.hasOwnProperty.call(entry, "station") && !entry.station) return "Non-MFG";
    return "MFG";
  }

  function rowItem(row = {}) {
    return row.name || row.item || row.itemName || row.partName || "-";
  }

  function rowSpec(row = {}) {
    return row.detail || row.spec || row.specification || row.productSpec || "-";
  }

  function rowProject(row = {}) {
    return row.project || row.targetProject || row.yearProject || row.projectCode || "-";
  }

  function rowKey(row = {}) {
    return row.id || row.requestId || `${rowProject(row)}::${rowItem(row)}::${rowSpec(row)}`;
  }

  function rowTotalQty(row = {}) {
    if (Array.isArray(row.stationBreakdown)) {
      return row.stationBreakdown.reduce((sum, entry) => sum + entryQty(entry), 0);
    }
    return STAGE_ORDER.reduce((sum, stage) => sum + cleanNumber(row[stage]), 0) || cleanNumber(row.qty || row.quantity || row.totalQty);
  }

  function entryQty(entry = {}) {
    if (Object.prototype.hasOwnProperty.call(entry, "qty")) return cleanNumber(entry.qty);
    return STAGE_ORDER.reduce((sum, stage) => sum + cleanNumber(entry[stage]), 0);
  }

  function rowEntries(row = {}) {
    if (Array.isArray(row.stationBreakdown) && row.stationBreakdown.length) {
      return row.stationBreakdown
        .map((entry) => {
          const type = demandTypeFor(entry);
          const unit = type === "MFG" ? "MFG" : normalizeUnit(entry.demandUnit || entry.department || entry.process);
          return {
            row,
            requestId: rowKey(row),
            project: rowProject(row),
            item: rowItem(row),
            spec: rowSpec(row),
            demandType: type,
            phase: phaseKey(entry.phase) || STAGE_ORDER.find((stage) => cleanNumber(entry[stage])) || "",
            station: type === "MFG" ? (entry.station || "MFG") : "",
            unit: unit || "ENG1",
            qty: entryQty(entry),
            requestLine: entry.requestLine || row.requestLine || "",
          };
        })
        .filter((entry) => entry.qty > 0);
    }
    const total = rowTotalQty(row);
    const stage = STAGE_ORDER.find((key) => cleanNumber(row[key])) || phaseKey(row.phase) || "";
    return total > 0 ? [{
      row,
      requestId: rowKey(row),
      project: rowProject(row),
      item: rowItem(row),
      spec: rowSpec(row),
      demandType: "MFG",
      phase: stage,
      station: row.station || "MFG",
      unit: "MFG",
      qty: total,
      requestLine: row.requestLine || "",
    }] : [];
  }

  function buildStatus(row = {}, roleContext = {}) {
    return workflowStatus.buildWorkflowStatus
      ? workflowStatus.buildWorkflowStatus(row, roleContext)
      : {
        pendingOwner: "OM Purchasing",
        currentStage: "Progress Review",
        daysPending: null,
        nextAction: "Review blocker",
        timelineMilestones: [],
        visibilityFlags: {},
      };
  }

  function statusRank(status = {}) {
    return [
      OWNER_PRIORITY[status.pendingOwner] ?? 8,
      status.daysPending === null || status.daysPending === undefined ? -1 : -Number(status.daysPending),
    ];
  }

  function pickBlockingStatus(statuses = []) {
    return [...statuses].sort((left, right) => {
      const leftRank = statusRank(left);
      const rightRank = statusRank(right);
      return leftRank[0] - rightRank[0] || leftRank[1] - rightRank[1];
    })[0] || buildStatus({});
  }

  function isPriceException(row = {}) {
    const text = [
      row.priceDecisionStatus,
      row.priceApprovalStatus,
      row.priceThresholdCategory,
      row.estimateVarianceStatus,
    ].map(normalize).join(" ");
    return text.includes("escalation")
      || text.includes("exception")
      || text.includes("budget approver")
      || Boolean(row.driApprovedAt && !row.projectDriApprovedAt && row.priceDecisionStatus);
  }

  function priceExceptionStage(row = {}) {
    if (!isPriceException(row)) return "";
    if (!row.driApprovedAt && !row.deptDriSubmissionApprovedAt) return "Dept DRI Price Exception Review";
    if (!row.projectDriApprovedAt) return "Budget Approver";
    return "OM Export Package";
  }

  function stockCarryoverState(row = {}) {
    const text = [
      row.workbenchType,
      row.transactionType,
      row.reviewStatus,
      row.status,
      row.carryoverStatus,
    ].map(normalize).join(" ");
    const breakdownHasCarryover = Array.isArray(row.stationBreakdown)
      && row.stationBreakdown.some((entry) => cleanNumber(entry.carryoverQty) > 0 || entry.carryoverFrom);
    if (text.includes("locked") || text.includes("applied")) return "Locked / applied";
    if (text.includes("reject")) return "Rejected";
    if (text.includes("stock") || text.includes("carryover") || text.includes("use-candidate") || text.includes("pending om") || text.includes("pending mfg") || text.includes("pending unit")) return "Pending review";
    return breakdownHasCarryover ? "Pending review" : "";
  }

  function badgesForRow(row = {}) {
    return [
      isPriceException(row) ? `Price: ${priceExceptionStage(row)}` : "",
      stockCarryoverState(row) ? `Stock: ${stockCarryoverState(row)}` : "",
    ].filter(Boolean);
  }

  function buildDashboard(rows = [], roleContext = {}) {
    const units = roleContext.units || DASHBOARD_UNITS;
    const groups = new Map();
    rows.forEach((row) => {
      const entries = rowEntries(row);
      const key = rowKey(row);
      const status = buildStatus(row, roleContext);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          requestId: key,
          project: rowProject(row),
          item: rowItem(row),
          spec: rowSpec(row),
          cnEngName: row.cnEngName || row.detail || rowSpec(row),
          vnName: row.vnName || row.localName || "-",
          totalQty: 0,
          rows: [],
          statuses: [],
          badges: new Set(),
          cells: Object.fromEntries(units.map((unit) => [unit, { unit, qty: 0, entries: [], statuses: [], badges: new Set() }])),
        });
      }
      const group = groups.get(key);
      group.rows.push(row);
      group.statuses.push(status);
      badgesForRow(row).forEach((badge) => group.badges.add(badge));
      const safeEntries = entries.length ? entries : [{
        row,
        requestId: key,
        project: rowProject(row),
        item: rowItem(row),
        spec: rowSpec(row),
        demandType: "MFG",
        phase: "",
        station: "MFG",
        unit: "MFG",
        qty: rowTotalQty(row),
      }];
      safeEntries.forEach((entry) => {
        const unit = entry.demandType === "MFG" ? "MFG" : (units.includes(entry.unit) ? entry.unit : "ENG1");
        const cell = group.cells[unit];
        if (!cell) return;
        cell.qty += entry.qty;
        cell.entries.push(entry);
        cell.statuses.push(status);
        badgesForRow(row).forEach((badge) => cell.badges.add(badge));
        group.totalQty += entry.qty;
      });
    });
    const items = [...groups.values()].map((group) => ({
      ...group,
      status: pickBlockingStatus(group.statuses),
      badges: [...group.badges],
      cells: Object.fromEntries(Object.entries(group.cells).map(([unit, cell]) => [unit, {
        ...cell,
        status: pickBlockingStatus(cell.statuses),
        badges: [...cell.badges],
      }])),
    })).sort((left, right) => left.project.localeCompare(right.project) || left.item.localeCompare(right.item));
    return {
      units,
      items,
      summary: buildSummary(items),
    };
  }

  function buildSummary(items = []) {
    const statuses = items.map((item) => item.status);
    const blocker = pickBlockingStatus(statuses);
    return {
      projects: new Set(items.map((item) => item.project)).size,
      items: items.length,
      blockingOwner: blocker.pendingOwner || "-",
      longestDaysPending: statuses.reduce((max, status) => Math.max(max, Number(status.daysPending) || 0), 0),
      priceExceptions: items.filter((item) => item.badges.some((badge) => badge.startsWith("Price:"))).length,
      stockCarryoverPending: items.filter((item) => item.badges.includes("Stock: Pending review")).length,
      omBuyerRows: statuses.filter((status) => ["OM Purchasing", "Buyer Handoff", "PAS / Bidding"].includes(status.pendingOwner)).length,
    };
  }

  function buildDetailRows(rows = [], roleContext = {}, scope = {}) {
    const desiredMode = scope.mode === "nonMfg" ? "Non-MFG" : "MFG";
    return rows.flatMap((row) => {
      const status = buildStatus(row, roleContext);
      const badges = badgesForRow(row);
      return rowEntries(row)
        .filter((entry) => entry.demandType === desiredMode)
        .filter((entry) => !scope.requestId || entry.requestId === scope.requestId)
        .filter((entry) => !scope.phase || entry.phase === scope.phase)
        .filter((entry) => desiredMode === "MFG" ? (!scope.station || entry.station === scope.station) : (!scope.unit || entry.unit === scope.unit))
        .map((entry) => ({
          ...entry,
          status,
          badges,
          stageLabel: STAGE_LABELS[entry.phase] || entry.phase || "-",
        }));
    }).sort((left, right) =>
      left.project.localeCompare(right.project)
      || left.item.localeCompare(right.item)
      || STAGE_ORDER.indexOf(left.phase) - STAGE_ORDER.indexOf(right.phase)
      || (left.station || left.unit).localeCompare(right.station || right.unit));
  }

  const api = {
    DASHBOARD_UNITS,
    STAGE_ORDER,
    STAGE_LABELS,
    normalizeUnit,
    isPriceException,
    priceExceptionStage,
    stockCarryoverState,
    buildDashboard,
    buildDetailRows,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.projectStatusDashboard = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
