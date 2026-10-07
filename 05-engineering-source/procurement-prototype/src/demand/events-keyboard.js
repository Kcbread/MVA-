// demand/events-keyboard.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  closeModalById
} from "../shell/dialogs.js";
import {
  replaceRequestWorksheetActiveCellBinding
} from "./state.js";
import {
  applyRequestWorksheetActiveState,
  focusWorksheetQtyByMeta,
  nextWorksheetQtyMeta,
  normalizeWorksheetQtyInput,
  sanitizeWorksheetQtyValue
} from "./worksheet.js";

// @legacy-unit 1885 25199
export function initializeStep1885() {
document.addEventListener("focusin", (event) => {
  if (!event.target?.dataset?.requestWorksheetQty) return;
  replaceRequestWorksheetActiveCellBinding({
    requestId: event.target.dataset.requestWorksheetQty || "",
    phase: event.target.dataset.requestWorksheetPhase || "",
    column: event.target.dataset.requestWorksheetColumn || "",
  });
  applyRequestWorksheetActiveState();
});
}
// @end-legacy-unit 1885

// @legacy-unit 1886 25209
export function initializeStep1886() {
document.addEventListener("keydown", (event) => {
  if (event.target?.dataset?.requestWorksheetQty) {
    if (["-", "+", ".", "e", "E"].includes(event.key)) {
      event.preventDefault();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const nextMeta = nextWorksheetQtyMeta(event.target);
      normalizeWorksheetQtyInput(event.target, { update: true });
      window.requestAnimationFrame(() => focusWorksheetQtyByMeta(nextMeta));
      return;
    }
  }
  if (event.key !== "Escape") return;
  const openModal = [...document.querySelectorAll(".modal-backdrop:not([hidden])")]
    .filter((modal) => !modal.classList.contains("confirm-backdrop"))
    .at(-1);
  if (!openModal) return;
  closeModalById(openModal.id);
});
}
// @end-legacy-unit 1886

// @legacy-unit 1887 25231
export function initializeStep1887() {
document.addEventListener("paste", (event) => {
  if (!event.target?.dataset?.requestWorksheetQty) return;
  event.preventDefault();
  const text = event.clipboardData?.getData("text") || "";
  event.target.value = sanitizeWorksheetQtyValue(text);
  normalizeWorksheetQtyInput(event.target, { update: true });
});
}
// @end-legacy-unit 1887
