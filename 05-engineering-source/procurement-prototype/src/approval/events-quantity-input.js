// approval/events-quantity-input.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  clampQty
} from "../demand/quantity.js";
import {
  sanitizeWorksheetQtyValue
} from "../demand/worksheet.js";

// @legacy-unit 1888 25239
export function initializeStep1888() {
document.addEventListener("input", (event) => {
  if (!event.target?.hasAttribute?.("data-item-quantity-review-input")) return;
  event.target.value = sanitizeWorksheetQtyValue(event.target.value);
  const beforeQty = clampQty(event.target.dataset.beforeQty || 0);
  const afterQty = clampQty(event.target.value || 0);
  event.target.closest(".item-review-qty-cell")?.classList.toggle("changed", beforeQty !== afterQty);
});
}
// @end-legacy-unit 1888
