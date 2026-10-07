// om/pas-rules: authoritative source; see docs/module-map.md.
import {
  PAS_NOT_REQUIRED
} from "../admin/state.js";
import {
  isOmBuyScope
} from "./ownership.js";
import {
  HANDOFF_WAITING_PAS,
  PAS_REQUIRED,
  PAS_WAITING
} from "../workflow/status-constants.js";

// @legacy-unit 594 4341
export function isPasRequired(row) {
  return isOmBuyScope(row);
}
// @end-legacy-unit 594

// @legacy-unit 595 4345
export function pasStatus(row) {
  if (!isPasRequired(row)) return PAS_NOT_REQUIRED;
  return row.pasStatus || PAS_REQUIRED;
}
// @end-legacy-unit 595

// @legacy-unit 596 4350
export function pasDisplayStatus(row) {
  const status = pasStatus(row);
  if (status === PAS_REQUIRED && row.procurementStatus === HANDOFF_WAITING_PAS) return PAS_WAITING;
  return status;
}
// @end-legacy-unit 596
