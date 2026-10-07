// cost/state: authoritative source; see docs/module-map.md.
import {
  DEFAULT_EXCHANGE_RATE_MONTH,
  OM_EXCHANGE_RATE_VND_USD
} from "../admin/state.js";

// @legacy-unit 227 1224
export let currencyDisplay;
export function initializeCurrencyDisplayBinding() {
  currencyDisplay = "VND";
}
// @end-legacy-unit 227

// @legacy-unit 228 1225
export let monthlyExchangeRates;
export function initializeMonthlyExchangeRatesBinding() {
  monthlyExchangeRates = [{
  exchangeRateMonth: DEFAULT_EXCHANGE_RATE_MONTH,
  usdToVndRate: OM_EXCHANGE_RATE_VND_USD,
  rateUpdatedBy: "System Default",
  rateUpdatedAt: "",
  isFallback: true,
}];
}
// @end-legacy-unit 228

export function replaceMonthlyExchangeRatesBinding(value) { monthlyExchangeRates = value; return value; }

export function replaceCurrencyDisplayBinding(value) { currencyDisplay = value; return value; }
