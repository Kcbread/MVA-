// cost/currency: authoritative source; see docs/module-map.md.
import {
  DEFAULT_EXCHANGE_RATE_MONTH,
  OM_EXCHANGE_RATE_VND_USD
} from "../admin/state.js";
import {
  currencyDisplay,
  monthlyExchangeRates
} from "./state.js";
import {
  sharedFormatters
} from "../infrastructure/module-adapters.js";

// @legacy-unit 451 2836
export function activeExchangeRateMonth() {
  const now = new Date();
  if (Number.isNaN(now.getTime())) return DEFAULT_EXCHANGE_RATE_MONTH;
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
// @end-legacy-unit 451

// @legacy-unit 452 2842
export function exchangeRateRecord(month = activeExchangeRateMonth()) {
  return monthlyExchangeRates.find((row) => row.exchangeRateMonth === month)
    || latestPreviousExchangeRateRecord(month)
    || { exchangeRateMonth: month, usdToVndRate: OM_EXCHANGE_RATE_VND_USD, isFallback: true };
}
// @end-legacy-unit 452

// @legacy-unit 453 2848
export function latestPreviousExchangeRateRecord(month = activeExchangeRateMonth()) {
  return [...monthlyExchangeRates]
    .filter((row) => row.exchangeRateMonth && row.exchangeRateMonth <= month)
    .sort((left, right) => right.exchangeRateMonth.localeCompare(left.exchangeRateMonth))[0]
    || monthlyExchangeRates.find((row) => row.exchangeRateMonth === DEFAULT_EXCHANGE_RATE_MONTH)
    || null;
}
// @end-legacy-unit 453

// @legacy-unit 454 2856
export function currentUsdToVndRate() {
  return Number(exchangeRateRecord().usdToVndRate || OM_EXCHANGE_RATE_VND_USD);
}
// @end-legacy-unit 454

// @legacy-unit 455 2860
export function monthKeyFromDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
// @end-legacy-unit 455

// @legacy-unit 456 2866
export function budgetApprovedExchangeRateMonth(row = {}) {
  return monthKeyFromDate(row.projectDriApprovedAt || row.budgetApproverApprovedAt || row.budgetApprovedAt)
    || monthKeyFromDate(row.driApprovedAt || row.deptDriApprovedAt || row.deptDriSubmissionApprovedAt)
    || activeExchangeRateMonth();
}
// @end-legacy-unit 456

// @legacy-unit 457 2872
export function exchangeRateMonthForQuote(row = {}) {
  // Quote date month; fallback to latest previous locked rate.
  return monthKeyFromDate(row.quoteDate || row.quoteReceivedAt || row.quoteCompletionReadyAt)
    || budgetApprovedExchangeRateMonth(row);
}
// @end-legacy-unit 457

// @legacy-unit 458 2878
export function usdToVndRateForRow(row = {}) {
  return Number(exchangeRateRecord(exchangeRateMonthForQuote(row)).usdToVndRate || OM_EXCHANGE_RATE_VND_USD);
}
// @end-legacy-unit 458

// @legacy-unit 496 3443
export function formatUsd(value) {
  return sharedFormatters()?.formatUsd(value)
    || `$${Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
// @end-legacy-unit 496

// @legacy-unit 497 3448
export function formatCurrencyFromVnd(value) {
  return sharedFormatters()?.formatCurrencyFromVnd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}
// @end-legacy-unit 497

// @legacy-unit 498 3452
export function amountUsdFromVnd(vnd) {
  return sharedFormatters()?.amountUsdFromVnd(vnd, currentUsdToVndRate())
    || Number(vnd || 0) / currentUsdToVndRate();
}
// @end-legacy-unit 498

// @legacy-unit 499 3457
export function amountVndFromUsd(usd) {
  return sharedFormatters()?.amountVndFromUsd(usd, currentUsdToVndRate())
    || Number(usd || 0) * currentUsdToVndRate();
}
// @end-legacy-unit 499

// @legacy-unit 500 3462
export function formatMoneyFromUsd(value) {
  return sharedFormatters()?.formatMoneyFromUsd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}
// @end-legacy-unit 500

// @legacy-unit 501 3466
export function formatMoneyFromVnd(value) {
  return sharedFormatters()?.formatMoneyFromVnd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}
// @end-legacy-unit 501

// @legacy-unit 502 3470
export function formatCompactCurrencyFromVnd(value) {
  return sharedFormatters()?.formatCompactCurrencyFromVnd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}
// @end-legacy-unit 502

// @legacy-unit 503 3474
export function formatCompactCurrencyFromUsd(value) {
  return sharedFormatters()?.formatCompactCurrencyFromUsd(value, { currency: currencyDisplay, usdToVndRate: currentUsdToVndRate() }) || "-";
}
// @end-legacy-unit 503

// @legacy-unit 504 3478
export function legacyPriceToUsd(row, field) {
  return sharedFormatters()?.legacyPriceToUsd(row, field, { usdToVndRate: currentUsdToVndRate() }) || 0;
}
// @end-legacy-unit 504

// @legacy-unit 505 3482
export function legacyPriceToUsdForRow(row, field) {
  return sharedFormatters()?.legacyPriceToUsd(row, field, { usdToVndRate: usdToVndRateForRow(row) }) || 0;
}
// @end-legacy-unit 505

// @legacy-unit 506 3486
export function money(value) {
  const usdValue = Number(value || 0);
  if (currencyDisplay === "USD") return formatUsd(usdValue);
  return `${Math.round(usdValue * currentUsdToVndRate()).toLocaleString("en-US")} VND`;
}
// @end-legacy-unit 506

export function replaceAmountVndFromUsdBinding(value) { amountVndFromUsd = value; return value; }
