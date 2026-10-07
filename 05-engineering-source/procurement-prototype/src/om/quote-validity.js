// om/quote-validity: authoritative source; see docs/module-map.md.
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  isNewMaterial
} from "../materials/display.js";
import {
  omQuoteScreenshotFile
} from "./quote-rules.js";
import {
  QUOTE_EXPIRING_SOON_DAYS
} from "../projects/config.js";
import {
  daysUntil
} from "../shared/format.js";

// @legacy-unit 516 3551
export function baseQuoteStatus(record) {
  const hasQuoteData = Boolean(record.quoteExpiry) && Number(record.updatedPrice || record.unitPrice || 0) > 0;
  if ((isNewMaterial(record) || record.quoteStatus === "New item" || record.quoteStatus === "New Material") && !hasQuoteData) return "New Material";
  if (record.quoteStatus && !["Valid", "Expired", "Expiring Soon", "Update Required", "New item", "New Material"].includes(record.quoteStatus)) return record.quoteStatus;
  const days = daysUntil(record.quoteExpiry);
  if (days === null) return "Expired";
  if (days < 0) return "Expired";
  if (days <= QUOTE_EXPIRING_SOON_DAYS) return "Expiring Soon";
  return "Valid";
}
// @end-legacy-unit 516

// @legacy-unit 517 3562
export function quoteStatus(record) {
  if (record.quoteException) return "Update Required";
  return baseQuoteStatus(record);
}
// @end-legacy-unit 517

// @legacy-unit 518 3567
export function hasOmQuoteData(row) {
  return Boolean(row.vendor && effectiveUnitPrice(row) && row.quoteDate && omQuoteValidUntil(row) && omQuoteScreenshotFile(row));
}
// @end-legacy-unit 518

// @legacy-unit 519 3571
export function omQuoteReceivedAt(row) {
  return row.quoteReceivedAt || row.quoteDate || "";
}
// @end-legacy-unit 519

// @legacy-unit 520 3575
export function omQuoteValidUntil(row) {
  return row.quoteValidUntil || row.quoteExpiry || "";
}
// @end-legacy-unit 520

// @legacy-unit 521 3579
export function omQuoteValidity(row) {
  if (!hasOmQuoteData(row)) return "Quote Pending";
  if (row.quoteException) return "Update Required";
  const days = daysUntil(omQuoteValidUntil(row));
  if (days === null) return "Quote Pending";
  if (days < 0) return "Quote Expired";
  if (days <= QUOTE_EXPIRING_SOON_DAYS) return "Quote Expiring Soon";
  return "Quote Valid";
}
// @end-legacy-unit 521
