(() => {
  const HISTORY_PRICE_DELTA_THRESHOLD_USD = 0.4;

  const STATUS_AUTO_CLEARED = "Auto Cleared";
  const STATUS_ESCALATION_REQUIRED = "Price Escalation Required";
  const STATUS_ESCALATION_APPROVED = "Price Escalation Approved";
  const STATUS_ESCALATION_REJECTED = "Price Escalation Rejected";
  const STATUS_USER_CONFIRMATION_NOT_REQUIRED = "User Confirmation Not Required";
  const ESTIMATE_VARIANCE_WITHIN = "Within Estimate Range";
  const ESTIMATE_VARIANCE_UNDER = "Under Estimated";
  const ESTIMATE_VARIANCE_OVER = "Over Estimated";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function positiveNumber(value) {
    const numeric = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  }

  function roundUsdDelta(value) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return 0;
    return Math.round((numeric + 1e-8) * 100) / 100;
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
    return positiveNumber(config.historyPriceDeltaUsd)
      || positiveNumber(config.HistoryPriceDeltaUsd)
      || positiveNumber(config.deltaUsd)
      || HISTORY_PRICE_DELTA_THRESHOLD_USD;
  }

  function compareQuoteToHistory(input = {}) {
    const category = input.category || "Need Classification";
    const quoteUnitPrice = positiveNumber(input.quoteUnitPriceUsd ?? input.quoteUnitPrice);
    const historyUnitPrice = positiveNumber(input.historyUnitPriceUsd ?? input.historyUnitPrice);
    const isTemporaryBudget = Boolean(input.isTemporaryBudget);
    const thresholdUsd = thresholdForCategory(category, input.thresholds);
    const deltaUsd = historyUnitPrice ? roundUsdDelta(quoteUnitPrice - historyUnitPrice) : null;

    if (!quoteUnitPrice) {
      return {
        status: STATUS_ESCALATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdUsd,
        deltaUsd,
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
        thresholdUsd,
        deltaUsd,
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
        thresholdUsd,
        deltaUsd,
        variancePercent: null,
        reason: "No reusable history price",
      };
    }

    const variancePercent = ((quoteUnitPrice - historyUnitPrice) / historyUnitPrice) * 100;
    const status = deltaUsd <= thresholdUsd ? STATUS_AUTO_CLEARED : STATUS_ESCALATION_REQUIRED;
    return {
      status,
      category,
      quoteUnitPrice,
      historyUnitPrice,
      thresholdUsd,
      deltaUsd,
      variancePercent,
      reason: status === STATUS_AUTO_CLEARED
        ? `Quote delta ${deltaUsd.toFixed(2)} USD is within ${thresholdUsd.toFixed(2)} USD threshold`
        : `Quote delta ${deltaUsd.toFixed(2)} USD exceeds ${thresholdUsd.toFixed(2)} USD threshold`,
    };
  }

  function compareEstimateToQuote(input = {}) {
    const estimateUnitPrice = positiveNumber(input.estimateUnitPriceUsd ?? input.estimateUnitPrice);
    const quoteUnitPrice = positiveNumber(input.quoteUnitPriceUsd ?? input.quoteUnitPrice);
    const qty = positiveNumber(input.qty ?? input.quantity ?? input.totalQty) || 0;
    const percentThreshold = positiveNumber(input.percentThreshold) || 20;
    const amountThresholdUsd = positiveNumber(input.amountThresholdUsd) || HISTORY_PRICE_DELTA_THRESHOLD_USD;
    if (!estimateUnitPrice || !quoteUnitPrice) {
      return {
        status: ESTIMATE_VARIANCE_WITHIN,
        estimateUnitPrice,
        quoteUnitPrice,
        deltaUsd: null,
        deltaPercent: null,
        totalDeltaUsd: null,
        percentThreshold,
        amountThresholdUsd,
        alert: false,
        direction: "missing",
        reason: !estimateUnitPrice ? "Missing requester estimate" : "Missing PAS quote price",
      };
    }
    const deltaUsd = roundUsdDelta(quoteUnitPrice - estimateUnitPrice);
    const deltaPercent = ((quoteUnitPrice - estimateUnitPrice) / estimateUnitPrice) * 100;
    const alert = Math.abs(deltaPercent) >= percentThreshold && Math.abs(deltaUsd) > amountThresholdUsd;
    const status = !alert
      ? ESTIMATE_VARIANCE_WITHIN
      : deltaUsd > 0
        ? ESTIMATE_VARIANCE_UNDER
        : ESTIMATE_VARIANCE_OVER;
    return {
      status,
      estimateUnitPrice,
      quoteUnitPrice,
      deltaUsd,
      deltaPercent,
      totalDeltaUsd: qty ? roundUsdDelta(deltaUsd * qty) : null,
      percentThreshold,
      amountThresholdUsd,
      alert,
      direction: deltaUsd > 0 ? "under" : deltaUsd < 0 ? "over" : "within",
      reason: status === ESTIMATE_VARIANCE_WITHIN
        ? `Estimate variance is within ${percentThreshold}% and ${amountThresholdUsd.toFixed(2)} USD thresholds`
        : `Estimate variance ${Math.abs(deltaPercent).toFixed(1)}% and ${Math.abs(deltaUsd).toFixed(2)} USD exceeds threshold`,
    };
  }

  const api = {
    HISTORY_PRICE_DELTA_THRESHOLD_USD,
    STATUS_AUTO_CLEARED,
    STATUS_ESCALATION_REQUIRED,
    STATUS_ESCALATION_APPROVED,
    STATUS_ESCALATION_REJECTED,
    STATUS_USER_CONFIRMATION_NOT_REQUIRED,
    ESTIMATE_VARIANCE_WITHIN,
    ESTIMATE_VARIANCE_UNDER,
    ESTIMATE_VARIANCE_OVER,
    classifyPriceThresholdCategory,
    compareEstimateToQuote,
    compareQuoteToHistory,
    roundUsdDelta,
    thresholdForCategory,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.priceDecision = api;
  }
})();
