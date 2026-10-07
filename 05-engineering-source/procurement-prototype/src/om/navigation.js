// om/navigation: authoritative source; see docs/module-map.md.
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  omPendingOwnerForGroup,
  omSubmissionRows
} from "./progress-data.js";
import {
  omFinalExportRows,
  omPasRequestRows,
  omQuoteConfirmRows
} from "./queue.js";
import {
  omQuoteExpiryRows,
  omQuoteExpiryStatusLabel
} from "./quotation-db.js";
import {
  currentOmTab
} from "./state.js";
import {
  currentRole
} from "../session/state.js";

// @legacy-unit 444 2701
export function omTabLabel(tab = currentOmTab) {
  const labels = {
    submission: "OM Progress Review",
    pasRequest: "PAS Demand No",
    quoteConfirm: "Quote Result",
    quoteExpiry: "Quotation DB",
    finalExport: "OM Handoff",
  };
  return labels[tab] || tab || "OM";
}
// @end-legacy-unit 444

// @legacy-unit 445 2712
export function renderOmWorkspaceBanner() {
  const host = document.getElementById("omWorkspaceBanner");
  if (!host) return;
  const pasRows = omPasRequestRows().length;
  const quoteRows = omQuoteConfirmRows().length;
  const exportRows = omFinalExportRows().length;
  const expiringRows = omQuoteExpiryRows().filter((row) => omQuoteExpiryStatusLabel(row) === "Expiring Soon" || omQuoteExpiryStatusLabel(row) === "Expired / Requote Required").length;
  if (currentRole === "omMember") {
    host.innerHTML = `
      <section class="work-panel">
        <div class="panel-title section-head-tight">
          <div>
            <h3>Assigned OM Workbench</h3>
            <p class="panel-subcopy">Work from left to right: claim intake, complete quote package, reuse valid quotation records when Central IT has confirmed them, then complete OM Handoff.</p>
          </div>
        </div>
        <div class="summary-grid">
          ${summaryCardsHtml([
            { label: "My Intake", value: pasRows, helper: "Need PAS Demand No", variant: pasRows ? "hero" : "" },
            ["My Quotes", quoteRows, "Need quote result / requester confirmation"],
            ["Quote Risk", expiringRows, "Expiring soon or expired"],
            ["OM Handoff", exportRows, "Requester confirmed rows"],
          ])}
        </div>
      </section>`;
    return;
  }
  const submissionGroups = omSubmissionRows();
  const waitingOm = submissionGroups.filter((group) => omPendingOwnerForGroup(group) === "OM Purchasing").length;
  const waitingPas = submissionGroups.filter((group) => omPendingOwnerForGroup(group) === "PAS / Bidding").length;
  host.innerHTML = `
    <section class="work-panel">
      <div class="panel-title section-head-tight">
        <div>
          <h3>OM Intake And Monitoring</h3>
          <p class="panel-subcopy">Start from OM Progress Review, assignment visibility, Project Stage Calendar, and Buyer handoff readiness. OM Leader reviews progress; OM Purchasing operates the remaining assigned-row work.</p>
        </div>
      </div>
      <div class="summary-grid">
        ${summaryCardsHtml([
          { label: "Waiting OM", value: waitingOm, helper: "Need assignment or OM action", variant: waitingOm ? "hero" : "" },
          ["Waiting PAS", waitingPas, "Bidding result pending"],
          ["Quote Work", quoteRows, "Rows in quote result stage"],
          ["Export Ready", exportRows, "Requester confirmed rows"],
        ])}
      </div>
    </section>`;
}
// @end-legacy-unit 445
