// om/quote-view: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_REWORK_REQUIRED,
  AMENDMENT_WAITING_OM,
  AMENDMENT_WAITING_USER_CONFIRM,
  OM_QUOTE_REVIEW_REQUIRED,
  QUOTE_EXCEPTION_NOTE
} from "../admin/state.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  omUserQuoteDecisionLabel,
  quoteAttachmentListHtml,
  requesterVisibleStatusLabel,
  snapshotPhaseText
} from "../demand/amendments.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  handoffRoute
} from "../handoff/status.js";
import {
  attachmentLinkHtml
} from "../infrastructure/attachments.js";
import {
  omBusinessFlowModule
} from "../infrastructure/module-adapters.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  canOperateOmRow,
  isOmLeaderSupervisorMode,
  omActionDisabledAttr,
  omAssignmentCell,
  omLeaderSupervisorNote,
  omRowAccessReason,
  omSupervisorActionCell
} from "./assignment.js";
import {
  isOmWaitingUserConfirm
} from "./export-rules.js";
import {
  omPasResultStatus,
  omQuoteDbCandidateHtml,
  pasPartName,
  pasSpec
} from "./pas-view.js";
import {
  omCurrentPrQty
} from "./pricing.js";
import {
  omAgingStatusClass,
  omCurrentStageForRow,
  omPendingOwnerForRow,
  omStageStartAt
} from "./progress-data.js";
import {
  omQuoteConfirmRows
} from "./queue.js";
import {
  omQuoteExpiryAction,
  omQuoteExpiryStatusLabel
} from "./quotation-db.js";
import {
  omQuotationDbRetentionDecision,
  omQuoteCurrencyOptions,
  omQuoteInputCurrency,
  omQuotePriceDisplay,
  omQuotePriceFieldForCurrency,
  omQuotePriceInputValue,
  omQuoteScreenshotFile,
  omWarnings
} from "./quote-rules.js";
import {
  omQuoteValidUntil,
  omQuoteValidity
} from "./quote-validity.js";
import {
  omSelections
} from "./state.js";
import {
  STAGES,
  STAGE_LABELS,
  currentPhaseLabelForProject
} from "../projects/config.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  daysUntil,
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";
import {
  OM_UPDATED
} from "../workflow/status-constants.js";
import {
  workflowStatusForRow
} from "../workflow/status-view.js";

// @legacy-unit 1483 18452
export function omQuoteValidityHtml(row, { readOnly = false } = {}) {
  const status = omQuoteValidity(row);
  const validUntil = omQuoteValidUntil(row);
  const days = validUntil ? daysUntil(validUntil) : null;
  const helper = status === "Quote Pending"
    ? "Quote Valid Until is required before sending to Requester."
    : status === "Quote Expired"
      ? "Expired. Requote is required before continuing."
      : status === "Quote Expiring Soon"
        ? `${days} day${days === 1 ? "" : "s"} remaining. Watch before export.`
        : "Validity is tracked for OM / MFG follow-up.";
  return `
    <div class="om-validity-card ${statusClass(status)}">
      <div class="om-quote-entry-title">Quote Validity</div>
      <div class="om-validity-grid">
        <label class="om-quote-entry-field">Valid Until
          ${readOnly ? `<div class="om-quote-readonly">${validUntil || "-"}</div>` : `<input type="date" value="${validUntil || ""}" data-om-field="quoteValidUntil" data-om-id="${row.id}" />`}
        </label>
      </div>
      <span class="status-pill ${statusClass(status)}">${status}</span>
      <div class="om-status-helper">${helper}</div>
    </div>`;
}
// @end-legacy-unit 1483

// @legacy-unit 1484 18476
export function omQuoteEntryHtml(row, { readOnly = false } = {}) {
  const validity = omQuoteValidity(row);
  const validUntil = omQuoteValidUntil(row);
  const quoteCurrency = omQuoteInputCurrency(row);
  const priceField = omQuotePriceFieldForCurrency(quoteCurrency);
  const priceValue = omQuotePriceInputValue(row, quoteCurrency);
  const screenshotFile = omQuoteScreenshotFile(row);
  return `
    <div class="om-quote-entry ${readOnly ? "readonly" : ""}">
      <div class="om-quote-entry-title">PAS Quote / Bidding Result</div>
      <div class="om-quote-entry-grid">
        <label class="om-quote-entry-field">PAS Material No
          ${readOnly ? `<div class="om-quote-readonly">${row.pasMaterialNo || "-"}</div>` : `<input type="text" value="${row.pasMaterialNo || ""}" placeholder="PAS Material No" data-om-field="pasMaterialNo" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field">Vendor Name
          ${readOnly ? `<div class="om-quote-readonly">${row.vendor || "-"}</div>` : `<input type="text" value="${row.vendor || ""}" placeholder="Vendor name" data-om-field="vendor" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field">Vendor Code
          ${readOnly ? `<div class="om-quote-readonly">${row.vendorPartNo || "-"}</div>` : `<input type="text" value="${row.vendorPartNo || ""}" placeholder="Vendor code" data-om-field="vendorPartNo" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field om-price-entry">Unit Price
          ${readOnly
            ? `<div class="om-quote-readonly">${omQuotePriceDisplay(row)}</div>`
            : `<div class="om-price-input-row">
                <input type="number" min="0" step="${quoteCurrency === "USD" ? "0.01" : "1"}" value="${priceValue}" placeholder="${quoteCurrency}" data-om-field="${priceField}" data-om-id="${row.id}" />
                <select class="mini-select" title="Unit price currency" data-om-price-currency="${row.id}">${omQuoteCurrencyOptions(quoteCurrency)}</select>
              </div>`}
        </label>
        <label class="om-quote-entry-field">Quote Date
          ${readOnly ? `<div class="om-quote-readonly">${row.quoteDate || "-"}</div>` : `<input type="date" value="${row.quoteDate || ""}" data-om-field="quoteDate" data-om-id="${row.id}" />`}
        </label>
        <label class="om-quote-entry-field">Quote Valid Until
          ${readOnly ? `<div class="om-quote-readonly">${validUntil || "-"}</div>` : `<input type="date" value="${validUntil || ""}" data-om-field="quoteValidUntil" data-om-id="${row.id}" />`}
        </label>
      </div>
      <div class="om-quote-entry-footer">
        <span class="status-pill ${statusClass(validity)}">${validity}</span>
        ${readOnly ? "" : `<div class="quote-pdf-actions">
          <label class="mini upload ${screenshotFile ? "uploaded" : ""}">
            ${screenshotFile ? "Screenshot Uploaded" : "Upload Screenshot"}
            <input type="file" accept="image/*,.jpg,.jpeg,.png" data-om-screenshot="${row.id}" />
          </label>
          <button class="mini" type="button" title="Generate PAS Excel from current quote result" data-om-row-button="${htmlAttr(row.id)}" data-om-row-button-action="generatePasExcel">${row.pasExcelSystemFileName ? "Regenerate Excel" : "Generate Excel"}</button>
        </div>`}
        ${quoteAttachmentListHtml(row)}
        ${readOnly ? `<div class="om-cell-helper">Quote package locked after send.</div>` : ""}
      </div>
    </div>`;
}
// @end-legacy-unit 1484

// @legacy-unit 1485 18526
export function omQuoteMissingFields(row) {
  const missing = [];
  if (!row.pasMaterialNo) missing.push("PAS Material No");
  if (!row.vendor) missing.push("Vendor");
  if (!effectiveUnitPrice(row)) missing.push("Unit Price");
  if (!row.quoteDate) missing.push("Quote Date");
  if (!omQuoteValidUntil(row)) missing.push("Valid Until");
  if (!omQuoteScreenshotFile(row)) missing.push("Screenshot");
  return missing;
}
// @end-legacy-unit 1485

// @legacy-unit 1486 18537
export function omQuoteResultReadOnlyReason(row, waitingUserConfirm = false) {
  if (isOmLeaderSupervisorMode()) return omLeaderSupervisorNote();
  if (waitingUserConfirm) return "Quote package locked after send.";
  if (!canOperateOmRow(row)) return omRowAccessReason(row) || "Only the assigned OM member can edit.";
  return "";
}
// @end-legacy-unit 1486

// @legacy-unit 1487 18544
export function omQuoteResultInput(row, field, value, {
  type = "text",
  placeholder = "",
  readOnly = false,
  className = "om-quote-grid-input",
  step = "",
  min = "",
} = {}) {
  if (readOnly) return `<span class="om-quote-grid-readonly">${value || "-"}</span>`;
  return `<input class="${className}" type="${type}" value="${htmlAttr(value || "")}" placeholder="${htmlAttr(placeholder)}" data-om-field="${field}" data-om-id="${row.id}" ${step ? `step="${step}"` : ""} ${min ? `min="${min}"` : ""} />`;
}
// @end-legacy-unit 1487

// @legacy-unit 1488 18556
export function omQuoteResultItemCell(row, stageLabel) {
  const spec = itemDetail(row);
  return `
    <div class="cell-identity om-quote-item-cell">
      <div class="identity-primary" title="${htmlAttr(row.name || "")}">${row.name || "-"}</div>
      <div class="identity-secondary" title="${htmlAttr(spec || "")}">${spec || "No spec"}</div>
      <div class="om-quote-row-note">${stageLabel}</div>
    </div>`;
}
// @end-legacy-unit 1488

// @legacy-unit 1489 18566
export function omPasExcelGroupDecisionCell(row, readOnly) {
  const suggestion = omBusinessFlowModule().pasDemandGroupSuggestion?.(row, omQuoteConfirmRows()) || { hasGroup: false, pasDemandId: "", rows: [], message: "No same-demand group" };
  const decision = row.pasExcelMergeDecision === "separate" ? "separate" : "merge";
  if (!suggestion.hasGroup) {
    return `<div class="pas-excel-group-cell"><span class="status-pill neutral">Single row</span><div class="reason-text">No same-demand group</div></div>`;
  }
  if (readOnly) {
    return `<div class="pas-excel-group-cell"><span class="status-pill ${decision === "merge" ? "success" : "warning"}">${decision === "merge" ? "Merged Excel" : "Separate Excel"}</span><div class="reason-text">${htmlText(suggestion.message)}</div></div>`;
  }
  return `
    <div class="pas-excel-group-cell">
      <span class="status-pill ${decision === "merge" ? "success" : "warning"}">${htmlText(suggestion.message)}</span>
      <div class="segmented-mini" data-pas-group-id="${htmlAttr(suggestion.pasDemandId)}">
        <label title="Generate one PAS Excel workbook for rows with this PAS Demand No">
          <input type="radio" name="pas-excel-group-${htmlAttr(row.id)}" value="merge" data-om-pas-excel-group="${htmlAttr(row.id)}" ${decision === "merge" ? "checked" : ""} />
          Merge for one PAS Excel
        </label>
        <label title="Generate a separate PAS Excel workbook for this row">
          <input type="radio" name="pas-excel-group-${htmlAttr(row.id)}" value="separate" data-om-pas-excel-group="${htmlAttr(row.id)}" ${decision === "separate" ? "checked" : ""} />
          Keep separate
        </label>
      </div>
    </div>`;
}
// @end-legacy-unit 1489

// @legacy-unit 1490 18591
export function omQuoteResultFileCell(row, readOnly) {
  const screenshotFile = omQuoteScreenshotFile(row);
  const generatedExcel = row.pasExcelSystemFileName || "";
  const generatedExcelHtml = generatedExcel
    ? `<div class="om-quote-row-note" data-generated-pas-excel="${htmlAttr(row.id)}">Generated PAS Excel: ${attachmentLinkHtml(generatedExcel, row.pasExcelSystemAttachmentId, row.pasExcelSystemAttachmentUrl, { allowDownload: true })}</div>`
    : "";
  if (readOnly) {
    return `
      <div class="om-quote-file-stack readonly">
        <span class="status-pill ${screenshotFile ? "success" : "warning"}" title="${htmlAttr(screenshotFile || "Quote screenshot required")}">Shot ${screenshotFile ? "OK" : "Missing"}</span>
        <span class="status-pill ${generatedExcel ? "success" : "neutral"}" title="${htmlAttr(generatedExcel || "Generated when OM validates quote")}">Excel ${generatedExcel ? "Generated" : "Pending"}</span>
        ${generatedExcelHtml}
      </div>`;
  }
  return `
    <div class="om-quote-file-stack">
      <label class="mini upload ${screenshotFile ? "uploaded" : ""}" title="${htmlAttr(screenshotFile || "Upload quote screenshot")}">
        Shot
        <input type="file" accept="image/*,.jpg,.jpeg,.png" data-om-screenshot="${row.id}" />
      </label>
      <button class="mini ${generatedExcel ? "uploaded" : ""}" type="button" title="${htmlAttr(generatedExcel || "Generate PAS Excel from current quote result")}" data-om-row-button="${htmlAttr(row.id)}" data-om-row-button-action="generatePasExcel">
        ${generatedExcel ? "Regenerate Excel" : "Generate Excel"}
      </button>
      ${generatedExcelHtml}
    </div>`;
}
// @end-legacy-unit 1490

// @legacy-unit 1491 18618
export function omQuoteResultCompletionCell(row, status, readOnlyReason = "") {
  const missing = omQuoteMissingFields(row);
  const visibleMissing = missing.slice(0, 3);
  const hiddenMissingCount = Math.max(0, missing.length - visibleMissing.length);
  const ready = !missing.length;
  const retention = omQuotationDbRetentionDecision(row);
  const showRetention = ready || Boolean(row.quoteDbRetentionEvaluatedAt);
  const retentionReason = row.quoteDbRetentionReason || retention.reason;
  const retentionEvaluatedAt = row.quoteDbRetentionEvaluatedAt ? ` · Checked ${compactDateTime(row.quoteDbRetentionEvaluatedAt)}` : "";
  return `
    <div class="om-quote-completion-cell">
      <span class="status-pill ${statusClass(status)}">${status}</span>
      ${ready ? `<span class="om-quote-saved-note">${row.quoteCompletionReadyAt ? `Saved ${compactDateTime(row.quoteCompletionReadyAt)}` : "Ready to save"}</span>` : ""}
      ${missing.length ? `<div class="om-missing-chip-list" title="${htmlAttr(missing.join(", "))}">${visibleMissing.map((item) => `<span class="om-missing-chip">${item}</span>`).join("")}${hiddenMissingCount ? `<span class="om-missing-chip">+${hiddenMissingCount} more</span>` : ""}</div>` : ""}
      ${showRetention ? `<div class="om-quote-row-note" title="${htmlAttr(retentionReason)}">
        <span class="status-pill ${statusClass(row.quoteDbRetentionStatus || retention.status)}">${row.quoteDbRetentionStatus || retention.status}</span>${retentionEvaluatedAt}
      </div>` : ""}
      ${omQuoteDbCandidateHtml(row, { readOnly: Boolean(readOnlyReason) })}
      ${readOnlyReason ? `<div class="om-quote-row-note">${readOnlyReason}</div>` : ""}
    </div>`;
}
// @end-legacy-unit 1491

// @legacy-unit 1492 18640
export function omMissingPasInfoCount(row) {
  return [pasPartName(row), pasSpec(row), totalQty(row), row.project, currentPhaseLabelForProject(row.project)]
    .filter((value) => !value || value === "-").length;
}
// @end-legacy-unit 1492

// @legacy-unit 1698 21116
export function omAmendmentEditorHtml(row) {
  if (!row.amendmentOf || ![AMENDMENT_WAITING_OM, AMENDMENT_REWORK_REQUIRED].includes(row.amendmentStatus)) return "";
  return `
    <div class="om-amendment-editor">
      <div class="om-amendment-section">
        <div class="om-amendment-section-title">Revised Request</div>
        <div class="om-amendment-field-grid">
          <label>Revised Item<input type="text" value="${row.name || ""}" data-om-field="name" data-om-id="${row.id}" /></label>
          <label class="om-amendment-spec-field">Revised Spec<textarea rows="2" data-om-field="detail" data-om-id="${row.id}">${itemDetail(row)}</textarea></label>
        </div>
      </div>
      <div class="om-amendment-section">
        <div class="om-amendment-section-title">Phase Qty</div>
        <div class="om-amendment-qty-grid">
          ${STAGES.map((stage) => `
            <label>${STAGE_LABELS[stage]}<input type="number" min="0" step="1" value="${clampQty(row[stage])}" data-om-field="${stage}" data-om-id="${row.id}" /></label>
          `).join("")}
        </div>
      </div>
      <div class="om-amendment-section om-amendment-reference">
        <div class="om-amendment-section-title">Reference</div>
        <div class="reason-text">Before: ${snapshotPhaseText(row.previousSnapshot)}</div>
        ${row.amendmentReworkReason ? `<div class="reason-text">Requester rework note: ${row.amendmentReworkReason}</div>` : ""}
      </div>
    </div>`;
}
// @end-legacy-unit 1698

// @legacy-unit 1699 21143
export function renderOmQuoteConfirmRows(rows) {
  const target = document.getElementById("omWorkbenchRows");
  if (!target) return;
  if (!rows.length) {
    target.innerHTML = `<tr><td colspan="21" class="empty-cell">No quote or user confirmation rows are available for this project package.</td></tr>`;
    return;
  }
  const waitingRows = rows.filter((row) => isOmWaitingUserConfirm(row) || row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM);
  const editingRows = rows.filter((row) => !waitingRows.includes(row));
  const sectionRow = (label, helper) => `
    <tr class="om-quote-section-row">
      <td colspan="21"><strong>${label}</strong><span>${helper}</span></td>
    </tr>`;
  const quoteRowHtml = (row) => {
      const amendmentAwaitingOm = row.amendmentStatus === AMENDMENT_WAITING_OM || row.amendmentStatus === AMENDMENT_REWORK_REQUIRED;
      const amendmentWaitingUser = row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM;
      const waitingUserConfirm = isOmWaitingUserConfirm(row) || amendmentWaitingUser;
      const status = omPasResultStatus(row);
      const warnings = omWarnings(row);
      const readyToSend = status === "Ready to Send Requester Confirmation";
      const quoteCompletionNeeded = status === "Quote Completion Needed";
      const stageLabel = amendmentAwaitingOm ? "OM amendment editing" : waitingUserConfirm ? "Waiting User A action" : "Quote editing";
      const userDecisionCell = amendmentWaitingUser
        ? `<span class="status-pill ${statusClass(AMENDMENT_WAITING_USER_CONFIRM)}">${requesterVisibleStatusLabel(AMENDMENT_WAITING_USER_CONFIRM)}</span><div class="reason-text">Visible to Requester for revised request confirmation.</div>`
        : waitingUserConfirm
          ? `<span class="status-pill ${statusClass(omUserQuoteDecisionLabel(row))}">${omUserQuoteDecisionLabel(row)}</span>${row.userAQuoteCancelReason ? `<div class="reason-text">${row.userAQuoteCancelReason}</div>` : `<div class="reason-text">Quoted amount is waiting for User A confirmation.</div>`}`
          : amendmentAwaitingOm
            ? `<span class="status-pill ${statusClass(row.amendmentStatus)}">${row.amendmentStatus}</span><div class="reason-text">${row.amendmentReason || "Update the request, then send the revised result back to Requester."}</div>`
        : `<span class="om-cell-helper">Not sent yet</span>`;
      const statusHelper = amendmentWaitingUser
        ? "Visible to Requester. Waiting for revised request confirmation."
        : waitingUserConfirm
        ? "Visible to Requester. Waiting for Confirm Need or Cancel Request."
        : amendmentAwaitingOm
          ? "Requester requested a change. Update item/spec/qty here, then send the revised result."
        : readyToSend
          ? "All required quote fields are ready. Use this row action to send."
          : status === "PAS Material No Missing"
            ? "Enter PAS Material No after PAS bidding result, then complete quote fields."
          : status === "Quote Screenshot Missing"
              ? "Upload the quote screenshot image to complete the quote package."
        : quoteCompletionNeeded
            ? "Complete PAS Material No, vendor name, price, quote date, and screenshot. Excel is generated from the quote result."
            : "Quote data is partially filled. Complete the missing fields below.";
      const rowClasses = [
        waitingUserConfirm ? "om-row-waiting-confirm" : "",
        readyToSend ? "om-row-ready-confirm" : "",
        quoteCompletionNeeded ? "om-row-awaiting-pas" : "",
        amendmentAwaitingOm ? "om-row-amendment-work" : "",
      ].filter(Boolean).join(" ");
      const readOnly = waitingUserConfirm || isOmLeaderSupervisorMode() || !canOperateOmRow(row);
      const readOnlyReason = omQuoteResultReadOnlyReason(row, waitingUserConfirm);
      const supervisorAction = omSupervisorActionCell();
      const quoteCurrency = omQuoteInputCurrency(row);
      const priceField = omQuotePriceFieldForCurrency(quoteCurrency);
      const priceValue = omQuotePriceInputValue(row, quoteCurrency);
      const validUntil = omQuoteValidUntil(row);
      const workflow = workflowStatusForRow(row, "om");
      const currentBlocker = workflow.pendingOwner || omPendingOwnerForRow(row);
      const currentStage = workflow.currentStage || omCurrentStageForRow(row);
      const daysInStage = workflow.daysPending;
      const stageStartAt = workflow.stageStartAt || omStageStartAt(row, currentStage);
      const nextAction = workflow.nextAction || omQuoteExpiryAction(row);
      return `
      <tr class="${rowClasses}">
        <td class="cell-code">${row.project}</td>
        <td class="cell-code">${currentPhaseLabelForProject(row.project)}</td>
        <td>${omQuoteResultItemCell(row, stageLabel)}${omAmendmentEditorHtml(row)}</td>
        <td class="cell-qty">${omCurrentPrQty(row)}</td>
        <td class="cell-code"><span title="${htmlAttr(row.pasDemandNo || "Waiting PAS Demand No")}">${row.pasDemandNo || "Waiting PAS Demand No"}</span></td>
        <td>${omPasExcelGroupDecisionCell(row, readOnly)}</td>
        <td class="cell-code">${omQuoteResultInput(row, "pasMaterialNo", row.pasMaterialNo, { placeholder: "PAS Material No", readOnly })}</td>
        <td>${omQuoteResultInput(row, "vendor", row.vendor, { placeholder: "Vendor", readOnly })}</td>
        <td class="cell-code">${omQuoteResultInput(row, "vendorPartNo", row.vendorPartNo, { placeholder: "Vendor code", readOnly })}</td>
        <td class="cell-money">${omQuoteResultInput(row, priceField, priceValue, { type: "number", placeholder: quoteCurrency, readOnly, step: quoteCurrency === "USD" ? "0.01" : "1", min: "0" })}</td>
        <td class="cell-code">
          ${readOnly
            ? `<span class="om-quote-grid-readonly">${quoteCurrency}</span>`
            : `<select class="mini-select om-quote-currency-select" title="Unit price currency" data-om-price-currency="${row.id}">${omQuoteCurrencyOptions(quoteCurrency)}</select>`}
        </td>
        <td>${omQuoteResultInput(row, "quoteDate", row.quoteDate, { type: "date", readOnly })}</td>
        <td>${omQuoteResultInput(row, "quoteValidUntil", validUntil, { type: "date", readOnly })}</td>
        <td>${omQuoteResultFileCell(row, readOnly)}</td>
        <td>${omQuoteResultCompletionCell(row, amendmentAwaitingOm ? OM_QUOTE_REVIEW_REQUIRED : status, readOnlyReason)}</td>
        <td><span class="status-pill ${statusClass(currentBlocker)}">${currentBlocker}</span><div class="reason-text">${currentStage}</div></td>
        <td><span class="status-pill ${omAgingStatusClass(daysInStage)}">${daysInStage === null ? "Done" : `${daysInStage}d`}</span><div class="reason-text">${stageStartAt ? `Since ${compactDateTime(stageStartAt)}` : "Missing stage start"}</div></td>
        <td><div class="reason-text">${htmlText(nextAction)}</div><span class="status-pill ${statusClass(omQuoteExpiryStatusLabel(row))}">${omQuoteExpiryStatusLabel(row)}</span></td>
        <td class="om-quote-assignee-cell">${omAssignmentCell(row)}</td>
        <td>
          ${supervisorAction || `<div class="row-action-stack om-quote-action-stack">
            <button class="mini" type="button" title="Validate quote, price decision, and Quotation DB retention" aria-label="Validate quote, price decision, and Quotation DB retention" data-om-row-button="${row.id}" data-om-row-button-action="saveQuoteInfo" ${omActionDisabledAttr(row, waitingUserConfirm)}>Validate Quote</button>
            <button class="mini approve" type="button" title="Send quote to Requester confirmation" aria-label="Send quote to Requester confirmation" data-om-row-button="${row.id}" data-om-row-button-action="sendToUserConfirm" ${omActionDisabledAttr(row, !(readyToSend && !waitingUserConfirm))}>Send to Requester</button>
            <button class="mini danger" type="button" title="Return quote row to DRI" aria-label="Return quote row to DRI" data-om-row-button="${row.id}" data-om-row-button-action="rejectToDri" ${omActionDisabledAttr(row)}>Return to DRI</button>
          </div>`}
        </td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`;
  };
  target.innerHTML = [
    editingRows.length ? sectionRow("Quote Editing", "Input PAS quote / bidding result, quote validity, and attachments in the row.") : "",
    ...editingRows.map(quoteRowHtml),
    waitingRows.length ? sectionRow("Waiting User A Confirmation", "Rows already sent to User A stay here as read-only tracking.") : "",
    ...waitingRows.map(quoteRowHtml),
  ].join("");
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 1699

// @legacy-unit 1700 21250
export function renderOmQuoteRows(rows) {
  const target = document.getElementById("omQuoteRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
        <td><input type="text" value="${row.vendor || ""}" placeholder="Vendor" data-om-field="vendor" data-om-id="${row.id}" /></td>
        <td><input type="number" min="0" step="1" value="${effectiveUnitPrice(row) || ""}" placeholder="Unit price" data-om-field="updatedPrice" data-om-id="${row.id}" /></td>
        <td><input type="date" value="${row.quoteDate || ""}" data-om-field="quoteDate" data-om-id="${row.id}" /></td>
        <td><input type="date" value="${row.quoteExpiry || ""}" data-om-field="quoteExpiry" data-om-id="${row.id}" /></td>
        <td>
          <label class="mini upload">
            Upload Screenshot
            <input type="file" accept="image/*,.jpg,.jpeg,.png" data-om-pdf="${row.id}" />
          </label>
          <div class="reason-text">${omQuoteScreenshotFile(row) || "No screenshot"}</div>
        </td>
        <td>
          <label class="check quote-exception-cell">
            <input type="checkbox" data-om-quote-exception="${row.id}" ${row.quoteException ? "checked" : ""} />
            ${row.quoteException ? `<span class="status-pill warning">${QUOTE_EXCEPTION_NOTE}</span>` : "Mark update"}
          </label>
        </td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="10" class="empty-cell">No received handoff rows are available for quote update.</td></tr>`;
}
// @end-legacy-unit 1700

// @legacy-unit 1701 21281
export function renderOmExternalRows(rows) {
  const target = document.getElementById("omExternalRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td><input type="checkbox" data-om-select="${row.id}" ${omSelections.has(row.id) || row.omSelected ? "checked" : ""} /></td>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${row.name}</td>
        <td>${handoffRoute(row)}</td>
        <td>
          <select data-om-field="externalSystemStatus" data-om-id="${row.id}">
            ${["Pending", OM_UPDATED, "Blocked"].map((status) => `<option value="${status}" ${status === (row.externalSystemStatus || "Pending") ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </td>
        <td><input type="text" value="${row.externalSystemRef || ""}" placeholder="External ref." data-om-field="externalSystemRef" data-om-id="${row.id}" /></td>
        <td>${row.excelExportedAt ? new Date(row.excelExportedAt).toLocaleString("en-US") : "Not exported"}</td>
        <td>${row.quotePdfExportedAt ? new Date(row.quotePdfExportedAt).toLocaleString("en-US") : omQuoteScreenshotFile(row) || "No screenshot"}</td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="10" class="empty-cell">No received handoff rows are available for external system update.</td></tr>`;
}
// @end-legacy-unit 1701
