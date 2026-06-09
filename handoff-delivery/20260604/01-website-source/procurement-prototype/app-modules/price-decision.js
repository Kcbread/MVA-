(() => {
  const COMPUTER_THRESHOLD_PERCENT = 20;
  const MFG_THRESHOLD_PERCENT = 10;

  const STATUS_AUTO_CLEARED = "Auto Cleared";
  const STATUS_ESCALATION_REQUIRED = "Price Escalation Required";
  const STATUS_ESCALATION_APPROVED = "Price Escalation Approved";
  const STATUS_ESCALATION_REJECTED = "Price Escalation Rejected";
  const STATUS_USER_CONFIRMATION_NOT_REQUIRED = "User Confirmation Not Required";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function positiveNumber(value) {
    const numeric = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }

  function hasMfgDemand(row = {}) {
    const rows = Array.isArray(row.stationBreakdown) ? row.stationBreakdown : [];
    return rows.some((item) => normalize(item.demandType) === "mfg" || Boolean(item.station));
  }

  function classifyPriceThresholdCategory(row = {}) {
    const catalogText = normalize([
      row.name,
      row.item,
      row.detail,
      row.spec,
      row.level1,
      row.level2,
      row.level3,
      row.catalogPath,
      row.catalogBucket,
      row.source,
    ].join(" "));
    if (/\b(pc|ipc|computer|desktop|laptop|notebook|monitor|keyboard|mouse|server|switch|storage|scanner|printer)\b/.test(catalogText)) return "Computer";
    if (/電腦|筆電|螢幕|鍵盤|滑鼠|伺服器|交換機|掃描|印表/.test(catalogText)) return "Computer";
    if (hasMfgDemand(row) || normalize(row.demandType) === "mfg") return "MFG";
    return "Need Classification";
  }

  function thresholdForCategory(category, config = {}) {
    if (category === "Computer") return positiveNumber(config.Computer) || COMPUTER_THRESHOLD_PERCENT;
    if (category === "MFG") return positiveNumber(config.MFG) || MFG_THRESHOLD_PERCENT;
    return 0;
  }

  function compareQuoteToHistory(input = {}) {
    const category = input.category || "Need Classification";
    const quoteUnitPrice = positiveNumber(input.quoteUnitPrice);
    const historyUnitPrice = positiveNumber(input.historyUnitPrice);
    const isTemporaryBudget = Boolean(input.isTemporaryBudget);
    const thresholdPercent = thresholdForCategory(category, input.thresholds);

    if (!quoteUnitPrice) {
      return {
        status: STATUS_ESCALATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdPercent,
        variancePercent: null,
        reason: "Missing quote price",
      };
    }
    if (isTemporaryBudget) {
      return {
        status: STATUS_ESCALATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdPercent,
        variancePercent: historyUnitPrice ? ((quoteUnitPrice - historyUnitPrice) / historyUnitPrice) * 100 : null,
        reason: "Temporary Budget Request requires DRI review",
      };
    }
    if (!historyUnitPrice) {
      return {
        status: STATUS_ESCALATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdPercent,
        variancePercent: null,
        reason: "No reusable history price",
      };
    }
    if (!thresholdPercent) {
      return {
        status: STATUS_ESCALATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdPercent,
        variancePercent: ((quoteUnitPrice - historyUnitPrice) / historyUnitPrice) * 100,
        reason: "Price category needs classification",
      };
    }

    const variancePercent = ((quoteUnitPrice - historyUnitPrice) / historyUnitPrice) * 100;
    const status = variancePercent <= thresholdPercent ? STATUS_AUTO_CLEARED : STATUS_ESCALATION_REQUIRED;
    return {
      status,
      category,
      quoteUnitPrice,
      historyUnitPrice,
      thresholdPercent,
      variancePercent,
      reason: status === STATUS_AUTO_CLEARED
        ? `Quote is within ${thresholdPercent}% threshold`
        : `Quote exceeds ${thresholdPercent}% threshold`,
    };
  }

  const api = {
    COMPUTER_THRESHOLD_PERCENT,
    MFG_THRESHOLD_PERCENT,
    STATUS_AUTO_CLEARED,
    STATUS_ESCALATION_REQUIRED,
    STATUS_ESCALATION_APPROVED,
    STATUS_ESCALATION_REJECTED,
    STATUS_USER_CONFIRMATION_NOT_REQUIRED,
    classifyPriceThresholdCategory,
    compareQuoteToHistory,
    thresholdForCategory,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.priceDecision = api;
  }
})();
