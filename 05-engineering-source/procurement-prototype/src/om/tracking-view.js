// om/tracking-view: authoritative source; see docs/module-map.md.
import {
  omPurposeLocations
} from "./pas-view.js";
import {
  procurementStatusValue,
  suggestPurRequestNo
} from "./tracking-rules.js";
import {
  PROCUREMENT_STATUS_OPTIONS
} from "../projects/config.js";
import {
  normalizePurposeLocation
} from "../projects/dates.js";
import {
  currentRole
} from "../session/state.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 1684 20904
export function omPurposeDisplayCell(row) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose || omPurposeLocations(row)[0]);
  return `
    <div class="om-purpose-cell">
      <div class="om-quote-entry-title">Purpose</div>
      <span class="status-pill ${statusClass(purposeLocation)}">${htmlText(purposeLocation)}</span>
      <div class="reason-text">Requester input · OM tracking only</div>
    </div>`;
}
// @end-legacy-unit 1684

// @legacy-unit 1685 20914
export function canEditOmProcurementTracking(role = currentRole) {
  return ["omMember", "admin"].includes(role);
}
// @end-legacy-unit 1685

// @legacy-unit 1686 20918
export function omProcurementFieldLabel(field = "") {
  return ({
    budgetStatus: "Budget Status",
    budgetNo: "Budget #",
    prStatus: "PR Status",
    prNo: "PR#",
    poStatus: "PO Status",
    buyerPoNo: "PO#",
    purRequestNo: "#PUR Request NO",
    etaPlanDate: "ETA (PLAN)",
    dtaActualDate: "DTA (Actual)",
    totalLeadTimeDays: "Total LT",
  })[field] || field || "Tracking field";
}
// @end-legacy-unit 1686

// @legacy-unit 1687 20933
export function omProcurementErrorAttrs(row = {}, field = "") {
  if (row.omProcurementSaveErrorField !== field) return "";
  return ` aria-invalid="true" data-om-procurement-save-error="true" title="${htmlAttr(row.omProcurementSaveErrorMessage || "Save failed")}"`;
}
// @end-legacy-unit 1687

// @legacy-unit 1688 20938
export function omProcurementControlAttrs(row = {}, field = "", editable = canEditOmProcurementTracking()) {
  const base = `data-om-procurement-field="${field}" data-om-procurement-id="${htmlAttr(row.id)}"`;
  const semantics = editable
    ? ` data-om-procurement-editable="true"`
    : ` data-om-procurement-editable="false"`;
  return `${base}${semantics}${omProcurementErrorAttrs(row, field)}`;
}
// @end-legacy-unit 1688

// @legacy-unit 1689 20946
export function omProcurementErrorMessage(row = {}, fields = []) {
  if (!row.omProcurementSaveErrorMessage || !fields.includes(row.omProcurementSaveErrorField)) return "";
  return `<div class="reason-text tracking-save-error" role="alert">${htmlText(row.omProcurementSaveErrorMessage)}</div>`;
}
// @end-legacy-unit 1689

// @legacy-unit 1690 20951
export function statusSelectHtml(value, attrs, readonly = false) {
  const selected = procurementStatusValue(value);
  const readonlyAttrs = readonly ? ` disabled aria-disabled="true"` : "";
  return `<select ${attrs}${readonlyAttrs}>${PROCUREMENT_STATUS_OPTIONS.map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}
// @end-legacy-unit 1690

// @legacy-unit 1691 20957
export function omProcurementInput(row, field, type = "text", placeholder = "", { editable = canEditOmProcurementTracking() } = {}) {
  const value = field === "purRequestNo" ? (row.purRequestNo || suggestPurRequestNo(row)) : (row[field] || "");
  const readonlyAttrs = editable ? "" : ` disabled readonly aria-disabled="true"`;
  return `<input type="${type}" value="${htmlAttr(value)}" placeholder="${htmlAttr(placeholder)}" ${omProcurementControlAttrs(row, field, editable)}${readonlyAttrs} />`;
}
// @end-legacy-unit 1691

// @legacy-unit 1692 20963
export function omBudgetTrackingCell(row = {}) {
  const editable = canEditOmProcurementTracking();
  const fields = ["budgetStatus", "budgetNo"];
  return `
    <div class="om-procurement-cell ${fields.includes(row.omProcurementSaveErrorField) ? "tracking-save-error" : ""}">
      <label><span>Budget Status</span>${statusSelectHtml(row.budgetStatus, omProcurementControlAttrs(row, "budgetStatus", editable), !editable)}</label>
      <label><span>Budget #</span>${omProcurementInput(row, "budgetNo", "text", "Budget code", { editable })}</label>
      ${omProcurementErrorMessage(row, fields)}
    </div>`;
}
// @end-legacy-unit 1692

// @legacy-unit 1693 20974
export function omProcurementTrackingCell(row = {}) {
  const editable = canEditOmProcurementTracking();
  const fields = ["prStatus", "prNo", "poStatus", "buyerPoNo", "purRequestNo"];
  return `
    <div class="om-procurement-cell ${fields.includes(row.omProcurementSaveErrorField) ? "tracking-save-error" : ""}">
      <label><span>PR Status</span>${statusSelectHtml(row.prStatus, omProcurementControlAttrs(row, "prStatus", editable), !editable)}</label>
      <label><span>PR#</span>${omProcurementInput(row, "prNo", "text", "PR number", { editable })}</label>
      <label><span>PO Status</span>${statusSelectHtml(row.poStatus, omProcurementControlAttrs(row, "poStatus", editable), !editable)}</label>
      <label><span>PO#</span>${omProcurementInput(row, "buyerPoNo", "text", "PO number", { editable })}</label>
      <label><span>#PUR Request NO</span>${omProcurementInput(row, "purRequestNo", "text", "#PUR request no", { editable })}</label>
      ${omProcurementErrorMessage(row, fields)}
    </div>`;
}
// @end-legacy-unit 1693

// @legacy-unit 1694 20988
export function omEtaTrackingCell(row = {}) {
  const givenLt = row.givenLeadTimeDays;
  const editable = canEditOmProcurementTracking();
  const fields = ["etaPlanDate", "dtaActualDate", "totalLeadTimeDays"];
  return `
    <div class="om-procurement-cell ${fields.includes(row.omProcurementSaveErrorField) ? "tracking-save-error" : ""}">
      <label><span>ETA (PLAN)</span>${omProcurementInput(row, "etaPlanDate", "date", "", { editable })}</label>
      <label><span>DTA (Actual)</span>${omProcurementInput(row, "dtaActualDate", "date", "", { editable })}</label>
      <label><span>Total LT</span>${omProcurementInput(row, "totalLeadTimeDays", "number", "days", { editable })}</label>
      <div class="reason-text">Given LT: ${givenLt === null || givenLt === undefined ? "-" : `${givenLt} days`}</div>
      ${omProcurementErrorMessage(row, fields)}
    </div>`;
}
// @end-legacy-unit 1694

// @legacy-unit 1695 21002
export function omArrivalTrackingCell(row = {}) {
  return omEtaTrackingCell(row);
}
// @end-legacy-unit 1695
