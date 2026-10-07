(function registerSharedFormattersModule(root) {
  function numberValue(value) {
    const numeric = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function formatUsd(value) {
    return `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  function amountUsdFromVnd(vnd, usdToVndRate) {
    return Number(vnd || 0) / Number(usdToVndRate || 1);
  }

  function amountVndFromUsd(usd, usdToVndRate) {
    return Number(usd || 0) * Number(usdToVndRate || 1);
  }

  function formatCurrencyFromVnd(value, { currency = "VND", usdToVndRate = 1 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    if (currency === "USD") return formatUsd(amountUsdFromVnd(amount, usdToVndRate));
    return `${Math.round(amount).toLocaleString("en-US")} VND`;
  }

  function formatMoneyFromUsd(value, { currency = "USD", usdToVndRate = 1 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    if (currency === "VND") return `${Math.round(amountVndFromUsd(amount, usdToVndRate)).toLocaleString("en-US")} VND`;
    return formatUsd(amount);
  }

  function formatMoneyFromVnd(value, { currency = "VND", usdToVndRate = 1 } = {}) {
    const amount = Number(value || 0);
    if (!amount) return "-";
    if (currency === "USD") return formatUsd(amountUsdFromVnd(amount, usdToVndRate));
    return `${Math.round(amount).toLocaleString("en-US")} VND`;
  }

  function compactAmount(value, { currency = "USD", from = "USD", usdToVndRate = 1 } = {}) {
    const sourceAmount = Number(value || 0);
    if (!sourceAmount) return "-";
    const displayAmount = from === currency
      ? sourceAmount
      : currency === "USD"
        ? amountUsdFromVnd(sourceAmount, usdToVndRate)
        : amountVndFromUsd(sourceAmount, usdToVndRate);
    const suffix = currency === "VND" ? " VND" : "";
    const prefix = currency === "USD" ? "$" : "";
    const abs = Math.abs(displayAmount);
    if (abs >= 1_000_000_000) return `${prefix}${(displayAmount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B${suffix}`;
    if (abs >= 1_000_000) return `${prefix}${(displayAmount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${suffix}`;
    if (abs >= 1_000) return `${prefix}${(displayAmount / 1_000).toFixed(1).replace(/\.0$/, "")}K${suffix}`;
    return currency === "USD"
      ? formatUsd(displayAmount)
      : `${Math.round(displayAmount).toLocaleString("en-US")} VND`;
  }

  function legacyPriceToUsd(row, field, { usdToVndRate = 1 } = {}) {
    const explicitUsd = numberValue(row?.[`${field}Usd`]);
    if (explicitUsd > 0) return explicitUsd;
    const explicitVnd = numberValue(row?.[`${field}Vnd`]);
    if (explicitVnd > 0) return amountUsdFromVnd(explicitVnd, usdToVndRate);
    const raw = numberValue(row?.[field]);
    if (raw <= 0) return 0;
    return raw > 1000 ? amountUsdFromVnd(raw, usdToVndRate) : raw;
  }

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.sharedFormatters = {
    formatUsd,
    amountUsdFromVnd,
    amountVndFromUsd,
    formatCurrencyFromVnd,
    formatMoneyFromUsd,
    formatMoneyFromVnd,
    formatCompactCurrencyFromVnd(value, options) {
      return compactAmount(value, { ...options, from: "VND" });
    },
    formatCompactCurrencyFromUsd(value, options) {
      return compactAmount(value, { ...options, from: "USD" });
    },
    legacyPriceToUsd,
  };
})(globalThis);
