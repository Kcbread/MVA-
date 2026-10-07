// om/quote-rules: authoritative source; see docs/module-map.md.
import {
  amountVndFromUsd,
  currentUsdToVndRate
} from "../cost/currency.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  quoteValidityModule,
  sharedFormatters
} from "../infrastructure/module-adapters.js";
import {
  omPasResultStatus
} from "./pas-view.js";
import {
  omUnitPriceVnd
} from "./pricing.js";
import {
  omFinalSpecStatus
} from "./queue.js";
import {
  omQuoteValidUntil,
  omQuoteValidity
} from "./quote-validity.js";
import {
  OM_FINAL_SPEC_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1653 20615
export function omReadyForBuyer(row) {
  return Boolean(row.pasMaterialNo && omQuoteScreenshotFile(row) && row.vendor && effectiveUnitPrice(row) && row.quoteDate && omQuoteValidUntil(row));
}
// @end-legacy-unit 1653

// @legacy-unit 1654 20619
export function omQuoteScreenshotFile(row) {
  return row.quotationScreenshot || row.quoteScreenshot || row.quoteImage || row.quotationPdf || "";
}
// @end-legacy-unit 1654

// @legacy-unit 1655 20623
export function omQuoteInputCurrency(row) {
  return row.quoteInputCurrency === "USD" ? "USD" : "VND";
}
// @end-legacy-unit 1655

// @legacy-unit 1656 20627
export function omQuotePriceFieldForCurrency(currency) {
  return currency === "USD" ? "updatedPrice" : "updatedPriceVnd";
}
// @end-legacy-unit 1656

// @legacy-unit 1657 20631
export function omQuotePriceInputValue(row, currency = omQuoteInputCurrency(row)) {
  return currency === "USD" ? effectiveUnitPrice(row) || "" : omUnitPriceVnd(row) || "";
}
// @end-legacy-unit 1657

// @legacy-unit 1658 20635
export function omQuotePriceDisplay(row) {
  const priceUsd = effectiveUnitPrice(row);
  if (!priceUsd) return "-";
  const formatter = sharedFormatters();
  const usdText = formatter?.formatMoneyFromUsd(priceUsd, { currency: "USD", usdToVndRate: currentUsdToVndRate() })
    || `$${Number(priceUsd || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  const vndText = formatter?.formatMoneyFromUsd(priceUsd, { currency: "VND", usdToVndRate: currentUsdToVndRate() })
    || `${Math.round(amountVndFromUsd(priceUsd)).toLocaleString("en-US")} VND`;
  return `${usdText} / ${vndText}`;
}
// @end-legacy-unit 1658

// @legacy-unit 1659 20646
export function omQuotationDbRetentionDecision(row = {}) {
  return quoteValidityModule().quotationDbRetentionDecision?.({
    ...row,
    updatedPrice: effectiveUnitPrice(row),
    quoteValidUntil: omQuoteValidUntil(row),
    quotationPdf: omQuoteScreenshotFile(row),
    quotationExcel: row.pasExcelSystemFileName || row.quotationExcel,
  }, new Date()) || {
    eligible: false,
    status: "Complete quote before Quotation DB",
    reason: "Quotation DB retention rule is unavailable.",
    daysRemaining: null,
  };
}
// @end-legacy-unit 1659

// @legacy-unit 1660 20661
export function omQuoteCurrencyOptions(selected = "VND") {
  return ["VND", "USD"].map((currency) => `<option value="${currency}" ${currency === selected ? "selected" : ""}>${currency}</option>`).join("");
}
// @end-legacy-unit 1660

// @legacy-unit 1661 20665
export function isOmQuoteReady(row) {
  return ["Quote Valid", "Quote Expiring Soon"].includes(omQuoteValidity(row));
}
// @end-legacy-unit 1661

// @legacy-unit 1662 20669
export function omWarnings(row) {
  const warnings = [];
  const status = omPasResultStatus(row);
  if (omFinalSpecStatus(row) === OM_FINAL_SPEC_REQUIRED) warnings.push(OM_FINAL_SPEC_REQUIRED);
  if (["Quote Expired", "Quote Expiring Soon", "Update Required"].includes(omQuoteValidity(row))) warnings.push(omQuoteValidity(row));
  if (!row.pasMaterialNo) warnings.push("Missing PAS Material No");
  if (!row.vendor) warnings.push("Missing vendor name");
  if (!row.quoteDate) warnings.push("Missing quote date");
  if (!omQuoteValidUntil(row)) warnings.push("Missing quote validity");
  if (!omQuoteScreenshotFile(row) && status !== "Quote Screenshot Missing") warnings.push("Missing quote screenshot");
  if (!effectiveUnitPrice(row)) warnings.push("Missing price");
  return warnings;
}
// @end-legacy-unit 1662

// @legacy-unit 1663 20683
export function omHasRequiredQuoteFiles(row) {
  return Boolean(omQuoteScreenshotFile(row) && row.pasExcelSystemFileName);
}
// @end-legacy-unit 1663
