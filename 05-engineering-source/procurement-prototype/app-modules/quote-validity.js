(function registerQuoteValidityModule(root) {
  const EXPIRING_SOON_DAYS = 7;

  function daysUntil(dateText, today = new Date()) {
    if (!dateText) return null;
    const target = new Date(`${dateText}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const base = new Date(today);
    base.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - base.getTime()) / 86400000);
  }

  function quoteValidity(validUntil, today = new Date()) {
    const remaining = daysUntil(validUntil, today);
    if (remaining === null) return "Missing Valid Until";
    if (remaining < 0) return "Expired / Requote Required";
    if (remaining <= EXPIRING_SOON_DAYS) return "Expiring Soon";
    return "Valid";
  }

  function formatCurrencyFromVnd(value, { currency = "VND", usdToVndRate = 25500 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    if (currency === "USD") return `$${(amount / Number(usdToVndRate || 25500)).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    return `${Math.round(amount).toLocaleString("en-US")} VND`;
  }

  function formatCompactCurrencyFromVnd(value, { currency = "VND", usdToVndRate = 25500 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    const displayAmount = currency === "USD" ? amount / Number(usdToVndRate || 25500) : amount;
    const suffix = currency === "USD" ? "" : " VND";
    const prefix = currency === "USD" ? "$" : "";
    const abs = Math.abs(displayAmount);
    if (abs >= 1_000_000_000) return `${prefix}${(displayAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B${suffix}`;
    if (abs >= 1_000_000) return `${prefix}${(displayAmount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${suffix}`;
    if (abs >= 1_000) return `${prefix}${(displayAmount / 1_000).toFixed(1).replace(/\.0$/, "")}K${suffix}`;
    return currency === "USD"
      ? `$${displayAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : `${Math.round(displayAmount).toLocaleString("en-US")} VND`;
  }

  function amountUsdFromVnd(vnd, { usdToVndRate = 25500 } = {}) {
    return Number(vnd || 0) / Number(usdToVndRate || 25500);
  }

  function amountVndFromUsd(usd, { usdToVndRate = 25500 } = {}) {
    return Number(usd || 0) * Number(usdToVndRate || 25500);
  }

  function formatCurrencyFromUsd(value, { currency = "USD", usdToVndRate = 25500 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    if (currency === "VND") return `${Math.round(amountVndFromUsd(amount, { usdToVndRate })).toLocaleString("en-US")} VND`;
    return `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function formatCompactCurrencyFromUsd(value, { currency = "USD", usdToVndRate = 25500 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    const displayAmount = currency === "VND" ? amountVndFromUsd(amount, { usdToVndRate }) : amount;
    const suffix = currency === "VND" ? " VND" : "";
    const prefix = currency === "USD" ? "$" : "";
    const abs = Math.abs(displayAmount);
    if (abs >= 1_000_000_000) return `${prefix}${(displayAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B${suffix}`;
    if (abs >= 1_000_000) return `${prefix}${(displayAmount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${suffix}`;
    if (abs >= 1_000) return `${prefix}${(displayAmount / 1_000).toFixed(1).replace(/\.0$/, "")}K${suffix}`;
    return currency === "USD"
      ? `$${displayAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
      : `${Math.round(displayAmount).toLocaleString("en-US")} VND`;
  }

  function legacyPriceToUsd(row = {}, field, { usdToVndRate = 25500 } = {}) {
    const explicitUsd = Number(row[`${field}Usd`] || 0);
    if (explicitUsd > 0) return explicitUsd;
    const explicitVnd = Number(row[`${field}Vnd`] || 0);
    if (explicitVnd > 0) return amountUsdFromVnd(explicitVnd, { usdToVndRate });
    const raw = Number(String(row[field] ?? "").replace(/,/g, ""));
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return raw > 1000 ? amountUsdFromVnd(raw, { usdToVndRate }) : raw;
  }

  function isQuoteResultReady(row = {}) {
    return Boolean(
      row.quoteReady
      || row.quoteCompletionReadyAt
      || (row.pasMaterialNo && (row.updatedPrice || row.updatedPriceVnd || row.unitPriceVnd) && row.quoteDate && (row.quotationPdf || row.quotePdf || row.quoteScreenshot || row.quoteScreenshotFile))
    );
  }

  function pendingOwner(row = {}) {
    if (row.finalExportedAt || ["Handed off to CFA", "Handed off to ECS", "Exported to CFA", "Exported to ECS"].includes(row.finalExportStatus)) return "OM Complete";
    if ((row.userAQuoteDecisionStatus === "Waiting Requester Confirmation" || row.userAQuoteDecisionStatus === "Waiting User A Confirmation" || row.omStage === "userConfirm") && !row.userAQuoteDecisionAt) return "Requester";
    if (row.pasDemandNo && !isQuoteResultReady(row)) return "PAS / Bidding";
    return "OM Purchasing";
  }

  function omQuoteStatus(row = {}, today = new Date()) {
    if (!row.pasDemandNo || !isQuoteResultReady(row)) return "Waiting PAS Reply";
    const status = quoteValidity(row.quoteValidUntil || row.validUntil || row.quoteExpiry, today);
    if (status === "Expired / Requote Required") return status;
    if (status === "Expiring Soon") return status;
    if (status === "Valid") return "Reusable Quote";
    return "Missing Validity";
  }

  function quotationDbRetentionMissingFields(row = {}) {
    const missing = [];
    if (!row.pasMaterialNo) missing.push("PAS Material No");
    if (!row.vendor) missing.push("Vendor");
    if (!(row.updatedPrice || row.updatedPriceUsd || row.updatedPriceVnd || row.unitPriceVnd || row.quoteUnitPrice || row.quoteUnitPriceUsd)) missing.push("Unit Price");
    if (!row.quoteDate && !row.quoteReceivedAt) missing.push("Quote Date");
    if (!(row.quoteValidUntil || row.validUntil || row.quoteExpiry)) missing.push("Valid Until");
    if (!(row.quotationPdf || row.quotePdf || row.quoteScreenshot || row.quoteScreenshotFile)) missing.push("Screenshot");
    return missing;
  }

  function quotationDbRetentionDecision(row = {}, today = new Date()) {
    const missing = quotationDbRetentionMissingFields(row);
    if (missing.length) {
      return {
        eligible: false,
        status: "Complete quote before Quotation DB",
        reason: `Missing ${missing.join(", ")}.`,
        daysRemaining: null,
      };
    }
    const validUntil = row.quoteValidUntil || row.validUntil || row.quoteExpiry;
    const remaining = daysUntil(validUntil, today);
    if (remaining === null) {
      return {
        eligible: false,
        status: "Complete quote before Quotation DB",
        reason: "Missing valid quote expiry date.",
        daysRemaining: null,
      };
    }
    if (remaining < 0) {
      return {
        eligible: false,
        status: "Requote required before Quotation DB",
        reason: "Quote is expired and cannot be retained for reuse.",
        daysRemaining: remaining,
      };
    }
    if (remaining <= EXPIRING_SOON_DAYS) {
      return {
        eligible: false,
        status: "Review before Quotation DB",
        reason: `Quote expires in ${remaining} day${remaining === 1 ? "" : "s"}; confirm reuse window before retention.`,
        daysRemaining: remaining,
      };
    }
    return {
      eligible: true,
      status: "Ready for Quotation DB",
      reason: "Complete quote is valid and can be retained as a Quotation DB candidate after governance sync.",
      daysRemaining: remaining,
    };
  }

  const api = {
    EXPIRING_SOON_DAYS,
    daysUntil,
    quoteValidity,
    amountUsdFromVnd,
    amountVndFromUsd,
    formatCurrencyFromVnd,
    formatCompactCurrencyFromVnd,
    formatCurrencyFromUsd,
    formatCompactCurrencyFromUsd,
    legacyPriceToUsd,
    isQuoteResultReady,
    pendingOwner,
    omQuoteStatus,
    quotationDbRetentionDecision,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.quoteValidity = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
