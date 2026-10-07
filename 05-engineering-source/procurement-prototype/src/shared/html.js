// shared/html: authoritative source; see docs/module-map.md.
import {
  detailValue
} from "../materials/display.js";

// @legacy-unit 701 5748
export function htmlAttr(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// @end-legacy-unit 701

// @legacy-unit 702 5756
export function htmlText(value = "", fallback = "-") {
  return htmlAttr(detailValue(value, fallback));
}
// @end-legacy-unit 702
