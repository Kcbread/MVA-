// handoff/status: authoritative source; see docs/module-map.md.
import {
  ROUTE_REUSE,
  ROUTE_SOURCING
} from "../admin/state.js";
import {
  totalQty
} from "../demand/quantity.js";
import {
  isNewMaterial
} from "../materials/display.js";
import {
  isOmBuyScope
} from "../om/ownership.js";
import {
  pasDisplayStatus
} from "../om/pas-rules.js";
import {
  normalize
} from "../shared/format.js";
import {
  HANDOFF_EXPORTED,
  HANDOFF_READY,
  HANDOFF_SENT_TO_BUYER,
  HANDOFF_SENT_TO_OM,
  HANDOFF_WAITING_PAS
} from "../workflow/status-constants.js";

// @legacy-unit 570 4082
export function handoffRoute(row) {
  if (isNewMaterial(row)) return ROUTE_SOURCING;
  return ROUTE_REUSE;
}
// @end-legacy-unit 570

// @legacy-unit 571 4087
export function handoffTarget(row) {
  return "Sourcing";
}
// @end-legacy-unit 571

// @legacy-unit 572 4091
export function exportStatus(row) {
  if (row.procurementStatus === HANDOFF_WAITING_PAS) return HANDOFF_WAITING_PAS;
  if (row.procurementStatus === HANDOFF_SENT_TO_OM) return HANDOFF_SENT_TO_OM;
  if (row.procurementStatus === HANDOFF_SENT_TO_BUYER) return HANDOFF_SENT_TO_BUYER;
  return row.procurementStatus === HANDOFF_EXPORTED ? HANDOFF_EXPORTED : HANDOFF_READY;
}
// @end-legacy-unit 572

// @legacy-unit 573 4098
export function handoffDisplayStatus(row) {
  if (row.procurementStatus === HANDOFF_WAITING_PAS) return pasDisplayStatus(row);
  if (row.procurementStatus === HANDOFF_SENT_TO_OM && isOmBuyScope(row)) return "PAS Approved - Send to OM";
  if (row.procurementStatus === HANDOFF_SENT_TO_OM) return HANDOFF_SENT_TO_OM;
  if (row.procurementStatus === HANDOFF_SENT_TO_BUYER) return HANDOFF_SENT_TO_BUYER;
  if (row.procurementStatus === HANDOFF_EXPORTED) return `Exported to ${row.exportTarget || handoffTarget(row)}`;
  if (row.procurementStatus === HANDOFF_READY || row.status === "Approved") return HANDOFF_READY;
  return row.procurementStatus || row.status;
}
// @end-legacy-unit 573

// @legacy-unit 574 4108
export function handoffWarnings(row) {
  const warnings = [];
  if (totalQty(row) === 0) warnings.push("Total qty is zero");
  if (isNewMaterial(row) && (!row.spec || normalize(row.spec).includes("tbd"))) warnings.push("New item spec may need sourcing detail");
  return warnings;
}
// @end-legacy-unit 574
