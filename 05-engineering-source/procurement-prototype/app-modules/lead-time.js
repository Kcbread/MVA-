(() => {
  const BASE_BUDGET_PR_PO_DAYS = 14;
  const NO_BIDDING_EXTRA_DAYS = 14;
  const COMPUTER_PO_ETA_DAYS = 60;

  function parseDate(value) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function addDays(value, days) {
    const date = parseDate(value);
    if (!date) return "";
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function quoteExpired(row = {}, today = new Date()) {
    const validUntil = parseDate(row.quoteValidUntil || row.quoteValidityUntil || row.quoteExpiry);
    if (!validUntil) return false;
    const base = parseDate(today) || new Date();
    validUntil.setHours(0, 0, 0, 0);
    base.setHours(0, 0, 0, 0);
    return validUntil < base;
  }

  function hasBiddingRecord(row = {}) {
    return Boolean(row.pasDemandNo || row.pasMaterialNo || row.quoteDate || row.quoteReceivedAt || row.vendor || row.quotationPdf || row.quotationExcel);
  }

  function isComputerLike(row = {}) {
    const text = [
      row.name,
      row.item,
      row.spec,
      row.detail,
      row.level1,
      row.level2,
      row.level3,
      row.catalogPath,
      row.priceThresholdCategory,
    ].join(" ").toLowerCase();
    return /\b(pc|ipc|computer|desktop|laptop|notebook|monitor|keyboard|mouse|server|switch|storage|scanner|printer)\b/.test(text);
  }

  function noBiddingRequired(row = {}, today = new Date()) {
    return quoteExpired(row, today) || !hasBiddingRecord(row);
  }

  function estimateEta(row = {}, options = {}) {
    const today = options.today || new Date();
    const omApprovedDate = row.omReceivedApprovedAt || row.sentToOmAt || row.managerApprovedAt || row.deptDriSubmissionApprovedAt || row.driApprovedAt || row.approvedAt || row.submittedAt;
    const startDate = addDays(omApprovedDate, 1);
    if (!startDate) {
      return {
        startDate: "",
        estimatedEta: "",
        totalDays: 0,
        reasons: ["Missing OM approved date"],
        noBidding: false,
        computerEta: false,
      };
    }
    const noBidding = noBiddingRequired(row, today);
    const computerEta = isComputerLike(row);
    const totalDays = BASE_BUDGET_PR_PO_DAYS
      + (noBidding ? NO_BIDDING_EXTRA_DAYS : 0)
      + (computerEta ? COMPUTER_PO_ETA_DAYS : 0);
    const reasons = [`base ${BASE_BUDGET_PR_PO_DAYS}d`];
    if (noBidding) reasons.push(`no bidding +${NO_BIDDING_EXTRA_DAYS}d`);
    if (computerEta) reasons.push(`computer PO ETA +${COMPUTER_PO_ETA_DAYS}d`);
    return {
      startDate,
      estimatedEta: addDays(startDate, totalDays),
      totalDays,
      reasons,
      noBidding,
      computerEta,
    };
  }

  const api = {
    BASE_BUDGET_PR_PO_DAYS,
    NO_BIDDING_EXTRA_DAYS,
    COMPUTER_PO_ETA_DAYS,
    addDays,
    estimateEta,
    hasBiddingRecord,
    isComputerLike,
    noBiddingRequired,
    quoteExpired,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.leadTime = api;
  }
})();
