// om/tracking-rules: authoritative source; see docs/module-map.md.
import {
  totalQty
} from "../demand/quantity.js";
import {
  purposeDateModule
} from "../infrastructure/module-adapters.js";
import {
  PROCUREMENT_STATUS_OPTIONS
} from "../projects/config.js";

// @legacy-unit 512 3525
export function procurementStatusValue(value = "") {
  return purposeDateModule().procurementStatusValue?.(value)
    || PROCUREMENT_STATUS_OPTIONS.find((option) => option.toLowerCase() === String(value || "").trim().toLowerCase())
    || "Pending";
}
// @end-legacy-unit 512

// @legacy-unit 513 3531
export function suggestPurRequestNo(row = {}) {
  return purposeDateModule().suggestPurRequestNo?.({
    ...row,
    qty: row.qty || totalQty(row),
  }) || "";
}
// @end-legacy-unit 513
