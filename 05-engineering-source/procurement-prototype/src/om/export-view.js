// om/export-view: authoritative source; see docs/module-map.md.
import {
  OM_COST_TYPE_CAPEX,
  OM_COST_TYPE_EXPENSE,
  OM_PAYMENT_METHOD
} from "../admin/state.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  omUserQuoteDecisionLabel,
  quoteAttachmentListHtml
} from "../demand/amendments.js";
import {
  totalQty
} from "../demand/quantity.js";
import {
  omItemCell
} from "../materials/detail-view.js";
import {
  itemDetailButton
} from "../materials/display.js";
import {
  omActionDisabledAttr,
  omAssignmentCell,
  omSupervisorActionCell
} from "./assignment.js";
import {
  isOmFinalExportPrepared,
  isOmFinalExported,
  omCostTypeTargetLabel,
  omFinalExportCostType,
  omFinalExportPackageCode,
  omFinalExportStatusLabel
} from "./export-rules.js";
import {
  omFinalExportProjectFilterValue
} from "./filters.js";
import {
  omBudgetCode,
  omPasBundleHtml
} from "./pas-view.js";
import {
  omFinalExportRows
} from "./queue.js";
import {
  currentOmHandoffView
} from "./state.js";
import {
  omArrivalTrackingCell,
  omBudgetTrackingCell,
  omProcurementTrackingCell,
  omPurposeDisplayCell
} from "./tracking-view.js";
import {
  currentPhaseLabelForProject
} from "../projects/config.js";
import {
  statusClass
} from "../shared/format.js";

// @legacy-unit 1697 21055
export function renderOmFinalExport() {
  const rows = omFinalExportRows();
  const target = document.getElementById("omFinalExportRows");
  if (!target) return;
  document.querySelectorAll("[data-om-handoff-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.omHandoffView === currentOmHandoffView);
  });
  const table = document.querySelector(".om-final-export-table");
  if (table) table.dataset.omHandoffView = currentOmHandoffView;
  const rowCount = document.getElementById("omFinalExportCount");
  if (rowCount) rowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  const summary = document.getElementById("omFinalExportSummary");
  if (summary) {
    summary.innerHTML = summaryCardsHtml([
      { label: "Confirmed Rows", value: rows.length, helper: `${omFinalExportProjectFilterValue() || "All projects"} · OM Handoff`, variant: "hero" },
      ["Expense / ECS", rows.filter((row) => omFinalExportCostType(row) === OM_COST_TYPE_EXPENSE).length],
      ["Capex / CFA", rows.filter((row) => omFinalExportCostType(row) === OM_COST_TYPE_CAPEX).length],
      ["Handed Off", rows.filter(isOmFinalExported).length],
    ]);
  }
  const exportHint = document.getElementById("omFinalExportHint");
  if (exportHint) {
    exportHint.textContent = "Choose Expense or Capex, prepare the handoff files, then submit the handoff to Buyer.";
  }
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const supervisorAction = omSupervisorActionCell();
      return `
      <tr>
        <td class="handoff-base">${row.project}</td>
        <td class="handoff-base">${currentPhaseLabelForProject(row.project)}</td>
        <td class="handoff-base">${omItemCell(row, { stageLabel: "OM Handoff" })}</td>
        <td class="handoff-base">${totalQty(row)}</td>
        <td class="handoff-base">${omAssignmentCell(row)}</td>
        <td class="handoff-prep"><span class="status-pill ${statusClass(omFinalExportPackageCode(row))}">${omFinalExportPackageCode(row)}</span><div class="reason-text">Handoff Code</div><div class="reason-text">Budget Code: ${omBudgetCode(row)}</div><div class="reason-text">Payment: ${OM_PAYMENT_METHOD}</div></td>
        <td class="handoff-prep">${omPurposeDisplayCell(row)}</td>
        <td class="handoff-prep handoff-prpo">${omBudgetTrackingCell(row)}</td>
        <td class="handoff-prep">${omPasBundleHtml(row, { editableDemandNo: false, editableMaterialNo: false })}</td>
        <td class="handoff-prep">${quoteAttachmentListHtml(row)}</td>
        <td class="handoff-prep"><span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span></td>
        <td class="handoff-prep om-export-target-cell"><span class="status-pill ${statusClass(omCostTypeTargetLabel(row))}">${omCostTypeTargetLabel(row)}</span><div class="reason-text">Expense → ECS / Capex → CFA</div></td>
        <td class="handoff-base om-export-status-cell"><span class="status-pill ${statusClass(omFinalExportStatusLabel(row))}">${omFinalExportStatusLabel(row)}</span><div class="reason-text">${row.finalExportedAt ? `Handed off ${new Date(row.finalExportedAt).toLocaleString("en-US")}` : isOmFinalExportPrepared(row) ? "Ready to submit handoff" : "Waiting handoff target"}</div></td>
        <td class="handoff-prpo">${omProcurementTrackingCell(row)}</td>
        <td class="handoff-delivery">${omArrivalTrackingCell(row)}</td>
        <td class="handoff-delivery">${row.finalExportedAt ? new Date(row.finalExportedAt).toLocaleDateString("en-US") : "-"}</td>
        <td class="handoff-base cell-action om-export-actions-cell">
          ${supervisorAction || `<div class="row-action-stack">
            <button class="mini" type="button" title="Prepare Expense / ECS package" data-om-row-button="${row.id}" data-om-row-button-action="prepareExpense" ${omActionDisabledAttr(row, isOmFinalExported(row))}>Expense</button>
            <button class="mini" type="button" title="Prepare Capex / CFA package" data-om-row-button="${row.id}" data-om-row-button-action="prepareCapex" ${omActionDisabledAttr(row, isOmFinalExported(row))}>Capex</button>
            <button class="mini" type="button" title="Prepare handoff Excel and quote screenshot files" data-om-row-button="${row.id}" data-om-row-button-action="exportPackage" ${omActionDisabledAttr(row, !(isOmFinalExportPrepared(row) || isOmFinalExported(row)))}>Prepare</button>
            <button class="mini approve" type="button" title="Submit handoff to Buyer" data-om-row-button="${row.id}" data-om-row-button-action="markExported" ${omActionDisabledAttr(row, !isOmFinalExportPrepared(row))}>Submit</button>
            <button class="mini danger" type="button" title="Reject to DRI" data-om-row-button="${row.id}" data-om-row-button-action="rejectToDri" ${omActionDisabledAttr(row, isOmFinalExported(row))}>Reject</button>
          </div>`}
        </td>
        <td class="handoff-base cell-action"><button class="mini return" type="button" title="Contact DRI" data-contact-dri="${row.id}">Contact</button></td>
        <td class="handoff-base cell-action">${itemDetailButton("request", row.id)}</td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="19" class="empty-cell">No Requester confirmed rows are ready for OM handoff.</td></tr>`;
}
// @end-legacy-unit 1697
