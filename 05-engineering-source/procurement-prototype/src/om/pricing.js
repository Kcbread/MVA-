// om/pricing: authoritative source; see docs/module-map.md.
import {
  currentUsdToVndRate
} from "../cost/currency.js";
import {
  matchingPurchaseRecord
} from "../cost/demand-metrics.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  currentPhaseLabelForProject
} from "../projects/config.js";
import {
  normalize
} from "../shared/format.js";

// @legacy-unit 1624 20304
export function omSourceRecord(row) {
  return matchingPurchaseRecord(row) || {};
}
// @end-legacy-unit 1624

// @legacy-unit 1625 20308
export function omUnit(row) {
  return row.unit || (normalize(row.name).includes("filament") ? "ROLL" : "PCS");
}
// @end-legacy-unit 1625

// @legacy-unit 1626 20312
export function omLastPurchaseTime(row) {
  return omSourceRecord(row).quoteDate || row.quoteDate || "";
}
// @end-legacy-unit 1626

// @legacy-unit 1627 20316
export function omLastPrQty(row) {
  return clampQty(omSourceRecord(row).qty);
}
// @end-legacy-unit 1627

// @legacy-unit 1628 20320
export function omCurrentPrQty(row) {
  return totalQty(row);
}
// @end-legacy-unit 1628

// @legacy-unit 1629 20324
export function omUnitPriceVnd(row) {
  const usdPrice = effectiveUnitPrice(row);
  return Math.round(usdPrice * currentUsdToVndRate());
}
// @end-legacy-unit 1629

// @legacy-unit 1630 20329
export function omAmountVnd(row) {
  return omCurrentPrQty(row) * omUnitPriceVnd(row);
}
// @end-legacy-unit 1630

// @legacy-unit 1631 20333
export function omUnitPriceUsd(row) {
  return effectiveUnitPrice(row);
}
// @end-legacy-unit 1631

// @legacy-unit 1632 20337
export function omAmountUsd(row) {
  return omCurrentPrQty(row) * omUnitPriceUsd(row);
}
// @end-legacy-unit 1632

// @legacy-unit 1633 20341
export function omPurchaseReason(row) {
  return row.requesterReason || row.procurementRemark || `${row.project} ${currentPhaseLabelForProject(row.project)} approved demand`;
}
// @end-legacy-unit 1633
