// om/workspace: authoritative source; see docs/module-map.md.
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  renderOmFinalExport
} from "./export-view.js";
import {
  omProjectFilterValue
} from "./filters.js";
import {
  renderOmWorkspaceBanner
} from "./navigation.js";
import {
  omBuyScopeStatus
} from "./ownership.js";
import {
  omPasResultStatus,
  renderOmPasRequest
} from "./pas-view.js";
import {
  renderOmSubmission
} from "./progress-view.js";
import {
  omCollectionStatus,
  omItemBucket,
  omPasResultRows,
  omQuoteConfirmRows
} from "./queue.js";
import {
  renderOmQuoteExpiry
} from "./quotation-db.js";
import {
  omQuoteValidity
} from "./quote-validity.js";
import {
  renderOmQuoteConfirmRows
} from "./quote-view.js";
import {
  syncProjectControls
} from "../projects/controls.js";
import {
  syncOmWorkspaceUi
} from "../shell/navigation.js";
import {
  OM_COLLECTION_QUOTATION,
  OM_SCOPE_NEED_SPEC,
  OM_SCOPE_STANDARD
} from "../workflow/status-constants.js";

// @legacy-unit 1672 20737
export function renderOmSummary(rows) {
  const pasRows = omPasResultRows();
  const missingMaterialRows = pasRows.filter((row) => omPasResultStatus(row) === "PAS Material No Missing");
  const quoteIncompleteRows = pasRows.filter((row) => ["Quote Info Incomplete", "Quote Screenshot Missing", "Quote Validity Missing", "Quote Completion Needed"].includes(omPasResultStatus(row)));
  const readyRows = pasRows.filter((row) => omPasResultStatus(row) === "Ready to Send Requester Confirmation");
  const expiringRows = pasRows.filter((row) => omQuoteValidity(row) === "Quote Expiring Soon");
  const expiredRows = pasRows.filter((row) => omQuoteValidity(row) === "Quote Expired");
  const cards = [
    { label: "Total Items", value: rows.length, helper: `${omProjectFilterValue() || "All projects"} · PAS Quote / Bidding`, variant: "hero" },
    ["Missing PAS Material No", missingMaterialRows.length],
    ["Quote Info Incomplete", quoteIncompleteRows.length],
    ["Ready for Requester", readyRows.length],
    ["Expiring Soon", expiringRows.length],
    ["Expired", expiredRows.length],
  ];
  document.getElementById("omSummary").innerHTML = summaryCardsHtml(cards);
}
// @end-legacy-unit 1672

// @legacy-unit 1673 20755
export function renderOmDemandSummary(rows) {
  const target = document.getElementById("omDemandSummary");
  if (!target) return;
  const cards = [
    ["Approved Demand", rows.length],
    ["Catalog Buckets", new Set(rows.map(omItemBucket)).size],
    ["Standard Buckets", rows.filter((row) => omBuyScopeStatus(row) === OM_SCOPE_STANDARD).length],
    ["Need Final Spec", rows.filter((row) => omBuyScopeStatus(row) === OM_SCOPE_NEED_SPEC).length],
    ["Ready for Quote", rows.filter((row) => omCollectionStatus(row) === OM_COLLECTION_QUOTATION).length],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}
// @end-legacy-unit 1673

// @legacy-unit 1674 20772
export function renderOmDemandCollection() {
  renderOmPasRequest();
}
// @end-legacy-unit 1674

// @legacy-unit 1675 20776
export function renderOmPurchasing() {
  syncOmWorkspaceUi();
  syncProjectControls();
  renderOmWorkspaceBanner();
  const quoteConfirmRows = omQuoteConfirmRows();
  const rowCount = document.getElementById("omWorkbenchCount");
  if (rowCount) rowCount.textContent = `${quoteConfirmRows.length} row${quoteConfirmRows.length === 1 ? "" : "s"}`;
  const quoteHint = document.getElementById("omQuoteConfirmHint");
  if (quoteHint) {
    quoteHint.textContent = "Input PAS quote / bidding result, including Quote Valid Until, then send the row to Requester when required.";
  }
  renderOmSubmission();
  renderOmPasRequest();
  renderOmSummary(quoteConfirmRows);
  renderOmQuoteConfirmRows(quoteConfirmRows);
  renderOmQuoteExpiry();
  renderOmFinalExport();
}
// @end-legacy-unit 1675
