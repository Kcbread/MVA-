// cost/pricing: authoritative source; see docs/module-map.md.
import {
  legacyPriceToUsd
} from "./currency.js";
import {
  renderManagerStageTracking
} from "./stage-view.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  isNewMaterial
} from "../materials/display.js";
import {
  omQuoteValidity
} from "../om/quote-validity.js";
import {
  STAGES
} from "../projects/config.js";
import {
  HANDOFF_EXPORTED,
  HANDOFF_SENT_TO_OM
} from "../workflow/status-constants.js";

// @legacy-unit 1401 17170
export function managerCostRows() {
  const projectFilter = document.getElementById("managerCostProjectFilter")?.value || "";
  return requests.filter((row) => {
    return ["Submitted", "Approved"].includes(row.status)
      && (!projectFilter || row.project === projectFilter);
  });
}
// @end-legacy-unit 1401

// @legacy-unit 1402 17178
export function effectiveUnitPrice(row) {
  return legacyPriceToUsd(row, "updatedPrice") || legacyPriceToUsd(row, "unitPrice");
}
// @end-legacy-unit 1402

// @legacy-unit 1403 17182
export function sourcingInitialPrice(row) {
  return Number(row.initialPrice || row.unitPrice || 0);
}
// @end-legacy-unit 1403

// @legacy-unit 1404 17186
export function sourcingNegotiatedPrice(row) {
  return Number(row.updatedPrice || row.negotiatedPrice || 0);
}
// @end-legacy-unit 1404

// @legacy-unit 1405 17190
export function sourcingPriceReduction(row) {
  const initial = sourcingInitialPrice(row);
  const negotiated = sourcingNegotiatedPrice(row);
  if (!initial || !negotiated) return "-";
  return `${Math.max(0, ((initial - negotiated) / initial) * 100).toFixed(1)}%`;
}
// @end-legacy-unit 1405

// @legacy-unit 1406 17197
export function sourcingFinalAmount(row) {
  const negotiated = sourcingNegotiatedPrice(row);
  return negotiated ? negotiated * totalQty(row) : 0;
}
// @end-legacy-unit 1406

// @legacy-unit 1407 17202
export function costConfidence(row) {
  if (row.status === "Submitted") return "Pending Approval";
  if (isNewMaterial(row)) return "New Material / Sourcing Needed";
  const validity = omQuoteValidity(row);
  if (["Quote Expired", "Update Required"].includes(validity)) return "Quote Expired";
  if (["Quote Valid", "Quote Expiring Soon"].includes(validity)) return "Confirmed Cost";
  if ([HANDOFF_SENT_TO_OM, HANDOFF_EXPORTED].includes(row.procurementStatus) || row.rfqStatus || row.rfqDispatchDate) return "Quote Pending";
  if (effectiveUnitPrice(row)) return "Reference Estimate";
  return "Quote Pending";
}
// @end-legacy-unit 1407

// @legacy-unit 1408 17213
export function canEstimateCost(row) {
  return costConfidence(row) === "Confirmed Cost" && effectiveUnitPrice(row) > 0;
}
// @end-legacy-unit 1408

// @legacy-unit 1409 17217
export function stageAmount(row, stage) {
  return canEstimateCost(row) ? clampQty(row[stage]) * effectiveUnitPrice(row) : null;
}
// @end-legacy-unit 1409

// @legacy-unit 1410 17221
export function totalCostAmount(row) {
  if (!canEstimateCost(row)) return null;
  return STAGES.reduce((sum, stage) => sum + stageAmount(row, stage), 0);
}
// @end-legacy-unit 1410

// @legacy-unit 1411 17226
export function renderManagerCostView() {
  renderManagerStageTracking();
}
// @end-legacy-unit 1411
