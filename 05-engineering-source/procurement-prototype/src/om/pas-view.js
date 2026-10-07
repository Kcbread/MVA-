// om/pas-view: authoritative source; see docs/module-map.md.
import {
  pasDemandRequirementMasterRows
} from "../admin/permissions.js";
import {
  PAS_DATA_TRANSFER_TO,
  PAS_LEGAL_NAME,
  PAS_REQUEST_DEPT
} from "../admin/state.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  totalQty
} from "../demand/quantity.js";
import {
  omBusinessFlowModule
} from "../infrastructure/module-adapters.js";
import {
  omItemCell
} from "../materials/detail-view.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  canOperateOmRow,
  omActionDisabledAttr,
  omAssignmentCell,
  omPasRequestStatus,
  omRowAccessReason,
  omSupervisorActionCell
} from "./assignment.js";
import {
  isOmUserConfirmed,
  isOmWaitingUserConfirm,
  omFinalExportStatusLabel
} from "./export-rules.js";
import {
  omDemandProjectFilterValue
} from "./filters.js";
import {
  applyOmResponsibility
} from "./ownership.js";
import {
  omFinalSpecStatus,
  omPasRequestRows
} from "./queue.js";
import {
  omQuoteScreenshotFile,
  omReadyForBuyer
} from "./quote-rules.js";
import {
  omQuoteValidUntil
} from "./quote-validity.js";
import {
  currentPhaseLabelForProject
} from "../projects/config.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  todayDateString
} from "../sourcing/rfq.js";
import {
  OM_FINAL_SPEC_REQUIRED,
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM
} from "../workflow/status-constants.js";

// @legacy-unit 1459 18246
export function omPasResultStatus(row) {
  if (isOmWaitingUserConfirm(row)) return OM_WAITING_USER_CONFIRM;
  if (isOmUserConfirmed(row)) return OM_USER_CONFIRMED;
  if (omReadyForBuyer(row)) return "Ready to Send Requester Confirmation";
  if (!row.pasMaterialNo) return "PAS Material No Missing";
  if (row.pasMaterialNo && row.vendor && effectiveUnitPrice(row) && row.quoteDate && omQuoteScreenshotFile(row) && !omQuoteValidUntil(row)) return "Quote Validity Missing";
  if ((row.pasExcelSystemFileName || row.quotationExcel) && !omQuoteScreenshotFile(row)) return "Quote Screenshot Missing";
  if (omQuoteScreenshotFile(row) || row.quotationExcel || row.vendor || effectiveUnitPrice(row) || row.quoteDate || omQuoteValidUntil(row)) return "Quote Info Incomplete";
  return "Quote Completion Needed";
}
// @end-legacy-unit 1459

// @legacy-unit 1460 18257
export function omBuyerPackageStatus(row) {
  return omFinalExportStatusLabel(row);
}
// @end-legacy-unit 1460

// @legacy-unit 1461 18261
export function pasLegalName(row) {
  return row.pasLegalName || PAS_LEGAL_NAME;
}
// @end-legacy-unit 1461

// @legacy-unit 1462 18265
export function pasRequestDept(row) {
  return row.pasRequestDept || PAS_REQUEST_DEPT;
}
// @end-legacy-unit 1462

// @legacy-unit 1463 18269
export function pasDataTransferTo(row) {
  return row.pasDataTransferTo || PAS_DATA_TRANSFER_TO;
}
// @end-legacy-unit 1463

// @legacy-unit 1464 18273
export function pasDemandDate(row) {
  return row.pasDemandDate || (row.pasResultReceivedAt ? todayDateString(new Date(row.pasResultReceivedAt)) : todayDateString());
}
// @end-legacy-unit 1464

// @legacy-unit 1465 18277
export function pasPartName(row) {
  return row.pasPartName || row.standardNameEn || row.standardNameCn || partName(row) || row.name || "";
}
// @end-legacy-unit 1465

// @legacy-unit 1466 18281
export function pasBrand(row) {
  return row.pasBrand || row.brand || "";
}
// @end-legacy-unit 1466

// @legacy-unit 1467 18285
export function pasSpec(row) {
  return row.pasSpec || itemDetail(row) || row.spec || "";
}
// @end-legacy-unit 1467

// @legacy-unit 1468 18289
export function pasMissingRequired(row) {
  const missing = [];
  if (!pasPartName(row)) missing.push("Part Name");
  if (!pasSpec(row)) missing.push("Spec");
  if (!totalQty(row)) missing.push("Quantity");
  if (!pasLegalName(row)) missing.push("Legal Name");
  if (!pasRequestDept(row)) missing.push("Request Dept");
  return missing;
}
// @end-legacy-unit 1468

// @legacy-unit 1469 18299
export function pasHeaderContextHtml(row, { editableDemandNo = false, editableMaterialNo = false } = {}) {
  const demandNo = row.pasDemandNo || "";
  const demandNoControl = editableDemandNo
    ? `<input class="pas-inline-input" type="text" value="${demandNo}" placeholder="PAS Demand No" data-om-field="pasDemandNo" data-om-id="${row.id}" />`
    : `<strong>${demandNo || "Waiting PAS Demand No"}</strong>`;
  const pasMaterialNo = row.pasMaterialNo || "";
  const materialNoControl = editableMaterialNo
    ? `<input class="pas-inline-input" type="text" value="${pasMaterialNo}" placeholder="PAS Material No" data-om-field="pasMaterialNo" data-om-id="${row.id}" />`
    : `<strong>${pasMaterialNo || "Waiting PAS Material No"}</strong>`;
  return `
    <div class="pas-context-card">
      <div class="pas-context-line"><span>PAS Demand No</span>${demandNoControl}</div>
      <div class="pas-context-line"><span>PAS Material No</span>${materialNoControl}</div>
      <div class="pas-context-line"><span>Legal</span><strong>${pasLegalName(row)}</strong></div>
      <div class="pas-context-line"><span>Request Dept</span><strong>${pasRequestDept(row)}</strong></div>
      <div class="pas-context-line"><span>Transfer To</span><strong>${pasDataTransferTo(row)}</strong></div>
    </div>`;
}
// @end-legacy-unit 1469

// @legacy-unit 1470 18318
export function pasItemInfoHtml(row, { editable = false } = {}) {
  const missing = pasMissingRequired(row);
  if (!editable) {
    return `
      <div class="pas-context-card">
        <div class="pas-context-line"><span>Part Name</span><strong>${pasPartName(row) || "-"}</strong></div>
        <div class="pas-context-line"><span>Brand</span><strong>${pasBrand(row) || "Brand pending"}</strong></div>
        <div class="pas-context-line"><span>Spec</span><strong>${pasSpec(row) || "-"}</strong></div>
        ${missing.length ? `<div class="pas-warning-line">Missing ${missing.join(" / ")}</div>` : ""}
      </div>`;
  }
  return `
    <div class="pas-item-editor">
      <label>Part Name<input type="text" value="${pasPartName(row)}" placeholder="Part Name" data-om-field="pasPartName" data-om-id="${row.id}" /></label>
      <label>Brand<input type="text" value="${pasBrand(row)}" placeholder="Brand pending" data-om-field="pasBrand" data-om-id="${row.id}" /></label>
      <label>Spec<textarea rows="2" placeholder="Spec" data-om-field="pasSpec" data-om-id="${row.id}">${pasSpec(row)}</textarea></label>
      ${missing.length ? `<div class="pas-warning-line">Missing ${missing.join(" / ")}</div>` : `<div class="reason-text">Ready for PAS form item.</div>`}
    </div>`;
}
// @end-legacy-unit 1470

// @legacy-unit 1471 18338
export function omPasBundleHtml(row, { editableDemandNo = false, editableMaterialNo = false, editableItemInfo = false } = {}) {
  return `
    <div class="om-context-stack">
      <div class="om-context-block">
        <div class="om-context-title">PAS Context</div>
        ${pasHeaderContextHtml(row, { editableDemandNo, editableMaterialNo })}
      </div>
      <div class="om-context-block">
        <div class="om-context-title">PAS Item Info</div>
        ${pasItemInfoHtml(row, { editable: editableItemInfo })}
      </div>
    </div>`;
}
// @end-legacy-unit 1471

// @legacy-unit 1472 18352
export function omPasDemandRequirement(row = {}) {
  return omBusinessFlowModule().pasDemandRequirement?.(row, pasDemandRequirementMasterRows()) || {
    required: true,
    label: "PAS Demand ID Required",
    reason: "PAS Demand ID is required before Quote Result.",
    isHardItem: true,
  };
}
// @end-legacy-unit 1472

// @legacy-unit 1473 18361
export function omQuoteDbCandidate(row = {}) {
  return omBusinessFlowModule().bestQuoteDbCandidate?.(row, undefined, new Date()) || null;
}
// @end-legacy-unit 1473

// @legacy-unit 1474 18365
export function omQuoteDbCandidateStatus(row = {}, candidate = omQuoteDbCandidate(row)) {
  if (!candidate) return null;
  return omBusinessFlowModule().quoteDbCandidateStatus?.(candidate, row, new Date()) || null;
}
// @end-legacy-unit 1474

// @legacy-unit 1475 18370
export function omPurposeLocations(row = {}) {
  return omBusinessFlowModule().purposeLocations?.(row) || ["SMT"];
}
// @end-legacy-unit 1475

// @legacy-unit 1476 18374
export function omPurposeProjectBuildKey(row = {}) {
  return omBusinessFlowModule().purposeProjectBuildKey?.(row) || [row.yearProject || "", row.project || "", row.stage || "", omPurposeLocations(row).join("+")].join("|");
}
// @end-legacy-unit 1476

// @legacy-unit 1477 18378
export function omBudgetCode(row = {}) {
  return omBusinessFlowModule().budgetCodeForRow?.(row) || row.budgetCode || "BUD-PURPOSE-BUILD";
}
// @end-legacy-unit 1477

// @legacy-unit 1478 18382
export function omBudgetPatch(row = {}) {
  const next = { ...row };
  const purposeProjectBuildKey = omPurposeProjectBuildKey(next);
  return {
    purposeLocations: omPurposeLocations(next),
    purposeProjectBuildKey,
    budgetCode: omBudgetCode({ ...next, purposeProjectBuildKey }),
  };
}
// @end-legacy-unit 1478

// @legacy-unit 1479 18392
export function omQuoteDbCandidateHtml(row, { readOnly = false } = {}) {
  const candidate = omQuoteDbCandidate(row);
  if (!candidate) {
    return `<div class="om-quote-db-card compact"><span class="om-cell-helper">Quote DB: no candidate</span></div>`;
  }
  const status = omQuoteDbCandidateStatus(row, candidate);
  const actionDisabled = readOnly || !status || status.expired || status.reusable || !canOperateOmRow(row);
  const detail = `${candidate.vendor || "-"} · ${candidate.currency || "USD"} ${Number(candidate.unitPrice || 0).toLocaleString("en-US")} · Valid until ${candidate.quoteValidUntil || "-"} · ${status.quantityNote || ""} ${candidate.bufferNote || ""}`;
  const visibleStatus = status.expired ? "QDB Expired" : status.reusable ? "QDB Reusable" : "QDB Needs Check";
  return `
    <div class="om-quote-db-card compact om-quote-db-card-dense" title="${htmlAttr(detail)}">
      <span class="status-pill ${statusClass(status.status)}">${visibleStatus}</span>
      <button class="mini approve" type="button" title="Central IT Checked" data-om-row-button="${row.id}" data-om-row-button-action="centralItChecked" ${actionDisabled ? "disabled" : ""}>Check</button>
      ${row.centralItCheckedAt ? `<div class="om-cell-helper">Checked ${compactDateTime(row.centralItCheckedAt)} by ${row.centralItCheckedBy || "OM Purchasing"}</div>` : ""}
    </div>`;
}
// @end-legacy-unit 1479

// @legacy-unit 1480 18409
export function omIntakeQuotationDbCell(row, { readOnly = false } = {}) {
  const candidate = omQuoteDbCandidate(row);
  if (!candidate) {
    return `<div class="om-quote-db-card compact"><span class="om-cell-helper">Quotation DB: no candidate</span></div>`;
  }
  const status = omQuoteDbCandidateStatus(row, candidate);
  const actionDisabled = readOnly || !status || status.expired || status.reusable || !canOperateOmRow(row);
  const detail = `${candidate.vendor || "-"} · ${candidate.currency || "USD"} ${Number(candidate.unitPrice || 0).toLocaleString("en-US")} · Valid until ${candidate.quoteValidUntil || "-"} · ${status.quantityNote || ""} ${candidate.bufferNote || ""}`;
  return `
    <div class="om-quote-db-card compact" title="${htmlAttr(detail)}">
      <span class="status-pill ${statusClass(status.status)}">${status.status}</span>
      <div class="reason-text">Quotation DB: ${candidate.vendor || "-"} · ${candidate.quoteValidUntil || "-"}</div>
      <button class="mini approve" type="button" title="Confirm with Central IT and apply this Quotation DB record" data-om-row-button="${row.id}" data-om-row-button-action="applyQuoteDbFromIntake" ${actionDisabled ? "disabled" : ""}>Confirm &amp; Apply</button>
      ${row.centralItCheckedAt ? `<div class="om-cell-helper">Applied ${compactDateTime(row.centralItCheckedAt)} by ${row.centralItCheckedBy || "OM Purchasing"}</div>` : `<div class="om-cell-helper">${status.quantityNote || "Quantity is not a hard stop."}</div>`}
    </div>`;
}
// @end-legacy-unit 1480

// @legacy-unit 1481 18426
export function omPasDemandGroupSuggestionHtml(row) {
  const suggestion = omBusinessFlowModule().pasDemandGroupSuggestion?.(row, omPasRequestRows()) || { hasGroup: false, message: "No same-demand group", pasDemandId: "", rowIds: [] };
  if (!suggestion.hasGroup) return "";
  return `
    <div class="pas-demand-group-suggestion" data-pas-group-id="${htmlAttr(suggestion.pasDemandId)}" aria-label="Same PAS Demand No group" title="${htmlAttr(suggestion.rowIds.join(", "))}">
      ${htmlText(suggestion.message)}
      <span>OM confirms merge in Quote Result.</span>
    </div>`;
}
// @end-legacy-unit 1481

// @legacy-unit 1482 18436
export function pasDemandNoEntryHtml(row) {
  const demandNo = row.pasDemandNo || "";
  const disabled = canOperateOmRow(row) ? "" : "disabled";
  const requirement = omPasDemandRequirement(row);
  return `
    <div class="pas-demand-entry ${demandNo ? "ready" : "pending"}">
      <label class="pas-demand-entry-field">
        <span>PAS Demand No</span>
        <input class="pas-inline-input" type="text" value="${htmlAttr(demandNo)}" placeholder="Enter PAS Demand No" data-om-field="pasDemandNo" data-om-id="${row.id}" ${disabled} />
      </label>
      <span class="status-pill ${statusClass(requirement.label)}">${requirement.label}</span>
      ${omPasDemandGroupSuggestionHtml(row)}
      <div class="om-cell-helper">${omRowAccessReason(row) || (demandNo ? `Recorded ${compactDateTime(row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt)}` : requirement.reason)}</div>
    </div>`;
}
// @end-legacy-unit 1482

// @legacy-unit 1493 18645
export function renderOmPasRequest() {
  const rows = omPasRequestRows();
  const rowCount = document.getElementById("omPasRequestCount");
  if (rowCount) rowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;

  const projectFilter = omDemandProjectFilterValue();
  const summary = document.getElementById("omPasRequestSummary");
  if (summary) {
    const waitingDemandNo = rows.filter((row) => omPasDemandRequirement(row).required && !row.pasDemandNo).length;
    const demandNoReady = rows.filter((row) => row.pasDemandNo || !omPasDemandRequirement(row).required).length;
    const cards = [
      { label: "Total Items", value: rows.length, helper: `${projectFilter || "All projects"} · ${projectFilter ? currentPhaseLabelForProject(projectFilter) : "Multiple phases"}`, variant: "hero" },
      ["PAS Demand ID Required", waitingDemandNo],
      ["Quote Flow Ready", demandNoReady],
      ["Ready to Move", demandNoReady],
    ];
    summary.innerHTML = summaryCardsHtml(cards);
  }
  const pasHint = document.getElementById("omPasRequestHint");
  if (pasHint) {
    pasHint.textContent = "Hard Item rows require PAS Demand ID before Quote Result. Other requests can move without PAS Demand ID.";
  }

  const target = document.getElementById("omPasRequestRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const enriched = applyOmResponsibility(row);
      const supervisorAction = omSupervisorActionCell();
      return `
      <tr>
        <td>${row.project}</td>
        <td>${currentPhaseLabelForProject(row.project)}</td>
        <td>${omItemCell(row, { extraLines: omFinalSpecStatus(row) === OM_FINAL_SPEC_REQUIRED ? ["Final spec required"] : [] })}</td>
        <td>${totalQty(row)}</td>
        <td>${pasDemandNoEntryHtml(row)}</td>
        <td>${omIntakeQuotationDbCell(row)}</td>
        <td>${enriched.omOwner || "-"}${enriched.omOwner ? `<div class="reason-text">CPD-IEP owner</div>` : ""}</td>
        <td>${omAssignmentCell(row)}</td>
        <td>
          <span class="status-pill ${statusClass(omPasRequestStatus(row))}">${omPasRequestStatus(row)}</span>
          <div class="reason-text">${omRowAccessReason(row) || (row.pasDemandNo || !omPasDemandRequirement(row).required ? "Ready for quote result input" : "PAS Demand ID is required for Hard Item.")}</div>
        </td>
        <td>
          ${supervisorAction || `<div class="row-action-stack">
            <button class="mini approve" type="button" title="${row.pasDemandNo || !omPasDemandRequirement(row).required ? "Move to Quote Result" : "PAS Demand ID is required for Hard Item"}" data-om-row-button="${row.id}" data-om-row-button-action="moveToQuoteCompletion" ${omActionDisabledAttr(row, omPasDemandRequirement(row).required && !row.pasDemandNo)}>Move to Quote</button>
            <button class="mini danger" type="button" data-om-row-button="${row.id}" data-om-row-button-action="rejectToDri" ${omActionDisabledAttr(row)}>Reject to DRI</button>
          </div>`}
        </td>
        <td><button class="mini return" type="button" data-contact-dri="${row.id}">Contact DRI</button></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="12" class="empty-cell">No OM demand is waiting for PAS Demand No.</td></tr>`;
}
// @end-legacy-unit 1493
