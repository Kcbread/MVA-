// demand/amendments: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_CONFIRMED,
  AMENDMENT_IN_PROGRESS,
  AMENDMENT_REWORK_REQUIRED,
  AMENDMENT_SUBMITTED,
  AMENDMENT_SUPERSEDED,
  AMENDMENT_WAITING_OM,
  AMENDMENT_WAITING_USER_CONFIRM,
  EXT_REJECTED_DRI,
  OM_EXPORTED_CFA,
  OM_EXPORTED_ECS,
  OM_REJECTED_TO_DRI,
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  renderPriceReview
} from "../approval/price-review.js";
import {
  itemQuantityPrompt,
  itemReviewChangeCount,
  itemReviewHistory,
  itemReviewProposalCount,
  itemReviewRequesterRevisionCount
} from "../approval/quantity-review.js";
import {
  quantityReviewModeValue
} from "../approval/quantity-scope.js";
import {
  isCostManagerAuthorizationReworkRequired,
  isDeptDriSubmissionReworkRequired
} from "../approval/status.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  managerQuantityEntryUnit
} from "../cost/quantity-filters.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  clampQty,
  createStationBreakdownEntry,
  demandTypeFor,
  stageQtyText,
  stationBreakdownPhaseKey,
  stationBreakdownRowsForDetail,
  syncRowPhaseQtyFromStationBreakdown,
  totalQty
} from "./quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "./state.js";
import {
  renderDepartment
} from "./workspace.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  attachmentLinkHtml
} from "../infrastructure/attachments.js";
import {
  detailRow
} from "../materials/detail-view.js";
import {
  itemDetail,
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  itemKeyDisplay,
  partName
} from "../materials/identity.js";
import {
  isOmBuyScope
} from "../om/ownership.js";
import {
  pasBrand,
  pasPartName,
  pasSpec
} from "../om/pas-view.js";
import {
  omAmountVnd,
  omUnitPriceVnd
} from "../om/pricing.js";
import {
  omQuoteScreenshotFile
} from "../om/quote-rules.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  requesterDisplayName
} from "../session/persona.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactTimestamp,
  fullTimestamp,
  hoursSince
} from "../shared/dates.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  DEPT_DRI_SUBMISSION_PENDING,
  HANDOFF_SENT_TO_BUYER,
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM,
  PRICE_ESCALATION_REJECTED
} from "../workflow/status-constants.js";
import {
  latestRequestActivityTime,
  requesterConfirmationSentAt
} from "../workflow/timeline.js";

// @legacy-unit 1104 12578
export function requesterVisibleStatusLabel(status) {
  if (status === OM_WAITING_USER_CONFIRM) return "Waiting User A Confirmation";
  if (status === OM_USER_CONFIRMED) return "Requester Confirmed";
  if (status === USER_CANCELLED_REQUEST) return "Cancelled by Requester";
  if (status === AMENDMENT_WAITING_USER_CONFIRM) return "Waiting User A Amendment Confirmation";
  return status;
}
// @end-legacy-unit 1104

// @legacy-unit 1105 12586
export function omUserQuoteDecisionLabel(row) {
  if (row.userAQuoteDecisionStatus) return requesterVisibleStatusLabel(row.userAQuoteDecisionStatus);
  if (row.finalExportStatus) return row.finalExportStatus;
  return "-";
}
// @end-legacy-unit 1105

// @legacy-unit 1106 12592
export function amendmentVersion(row) {
  return Number(row.amendmentVersion || 1);
}
// @end-legacy-unit 1106

// @legacy-unit 1107 12596
export function amendmentBadgeHtml(row) {
  if (!row.amendmentOf && !row.amendmentStatus) return "";
  const label = row.amendmentOf ? `Amendment v${amendmentVersion(row)}` : row.amendmentStatus;
  return `<span class="status-pill ${statusClass(label)}">${label}</span>`;
}
// @end-legacy-unit 1107

// @legacy-unit 1108 12602
export function amendmentQueueSummaryHtml(row) {
  if (!row.amendmentOf || !row.previousSnapshot) return "";
  return `
    <div class="amendment-queue-summary">
      <div class="amendment-queue-row">
        <span>Before</span>
        <strong>${snapshotPhaseText(row.previousSnapshot)}</strong>
      </div>
      <div class="amendment-queue-row current">
        <span>Now</span>
        <strong>${stageQtyText(row)}</strong>
      </div>
      <div class="amendment-queue-row meta amendment-queue-row-wide">
        <span>Flow</span>
        <strong>${row.amendmentRequestedBy || "Requester"} -> ${row.amendedBy || "OM Purchasing"} -> ${row.amendmentUserConfirmedBy || "Requester"}</strong>
      </div>
    </div>`;
}
// @end-legacy-unit 1108

// @legacy-unit 1109 12621
export function requestSnapshot(row) {
  return {
    id: row.id,
    item: row.name || "",
    materialNo: itemKeyDisplay(row),
    detail: itemDetail(row),
    materialName: partName(row),
    phaseQty: Object.fromEntries(STAGES.map((stage) => [stage, clampQty(row[stage])])),
    totalQty: totalQty(row),
    pasDemandNo: row.pasDemandNo || "",
    pasPartName: pasPartName(row),
    pasBrand: pasBrand(row),
    pasSpec: pasSpec(row),
    finalExportPackageCode: row.finalExportPackageCode || "",
  };
}
// @end-legacy-unit 1109

// @legacy-unit 1110 12638
export function quoteReference(row) {
  const hasQuote = row.vendor || row.vendorPartNo || row.updatedPriceVnd || row.updatedPrice || row.unitPrice || row.quoteDate || row.quotationPdf || row.quotationExcel;
  if (!hasQuote) return null;
  return {
    vendor: row.vendor || "",
    vendorPartNo: row.vendorPartNo || "",
    unitPriceVnd: omUnitPriceVnd(row) || effectiveUnitPrice(row) || 0,
    quoteDate: row.quoteDate || "",
    quotePdf: row.quotationPdf || "",
    quoteExcel: row.quotationExcel || "",
    pasDemandNo: row.pasDemandNo || "",
    capturedAt: new Date().toISOString(),
  };
}
// @end-legacy-unit 1110

// @legacy-unit 1111 12653
export function snapshotPhaseText(snapshot) {
  const qty = snapshot?.phaseQty || {};
  return STAGES
    .map((stage) => `${STAGE_LABELS[stage]} ${clampQty(qty[stage])}`)
    .join(" / ");
}
// @end-legacy-unit 1111

// @legacy-unit 1112 12660
export function amendmentReferenceRows(row) {
  const previous = row.previousSnapshot;
  const quote = row.previousQuoteReference;
  const rows = [];
  if (row.amendmentOf) rows.push(detailRow("Amendment Of", row.amendmentOf));
  if (row.supersededBy) rows.push(detailRow("Superseded By", row.supersededBy));
  if (row.amendmentStatus) rows.push(detailRow("Amendment Status", row.amendmentStatus));
  if (row.amendmentReason) rows.push(detailRow("Amendment Reason", row.amendmentReason));
  if (row.amendmentRequestedBy) rows.push(detailRow("Requested By", row.amendmentRequestedBy));
  if (row.amendmentRequestedAt) rows.push(detailRow("Requested At", fullTimestamp(row.amendmentRequestedAt)));
  if (row.amendedBy) rows.push(detailRow("Amended By", row.amendedBy));
  if (row.amendedAt) rows.push(detailRow("Amended At", fullTimestamp(row.amendedAt)));
  if (row.amendmentUserConfirmedBy) rows.push(detailRow("Requester Confirmed By", row.amendmentUserConfirmedBy));
  if (row.amendmentUserConfirmedAt) rows.push(detailRow("Requester Confirmed At", fullTimestamp(row.amendmentUserConfirmedAt)));
  if (row.amendmentUserRejectedBy) rows.push(detailRow("Requester Rejected By", row.amendmentUserRejectedBy));
  if (row.amendmentUserRejectedAt) rows.push(detailRow("Requester Rejected At", fullTimestamp(row.amendmentUserRejectedAt)));
  if (row.amendmentReworkReason) rows.push(detailRow("Amendment Rework Reason", row.amendmentReworkReason));
  if (row.amendmentSubmittedAt) rows.push(detailRow("Submitted At", fullTimestamp(row.amendmentSubmittedAt)));
  if (row.amendmentApprovedBy) rows.push(detailRow("Approved By", row.amendmentApprovedBy));
  if (row.amendmentApprovedAt) rows.push(detailRow("Approved At", fullTimestamp(row.amendmentApprovedAt)));
  if (previous) {
    rows.push(detailRow("Previous Item", previous.item || "-"));
    rows.push(detailRow("Previous Spec", previous.detail || "-"));
    rows.push(detailRow("Previous Phase Qty", snapshotPhaseText(previous)));
    rows.push(detailRow("Current Phase Qty", stageQtyText(row)));
  }
  if (quote) {
    rows.push(detailRow("Previous Quote Reference", [quote.vendor, quote.quoteDate, quote.quotePdf, quote.quoteExcel].filter(Boolean).join(" / ") || "Captured"));
    rows.push(detailRow("Previous Unit Price", quote.unitPriceVnd ? `${Number(quote.unitPriceVnd).toLocaleString("en-US")} VND` : "-"));
  }
  return rows;
}
// @end-legacy-unit 1112

// @legacy-unit 1113 12693
export function hasPendingAmendment(row) {
  return [
    AMENDMENT_WAITING_OM,
    AMENDMENT_WAITING_USER_CONFIRM,
    AMENDMENT_IN_PROGRESS,
    AMENDMENT_REWORK_REQUIRED,
    AMENDMENT_CONFIRMED,
    AMENDMENT_SUBMITTED,
  ].includes(row.amendmentStatus);
}
// @end-legacy-unit 1113

// @legacy-unit 1114 12704
export function isSupersededRequest(row) {
  return row.amendmentStatus === AMENDMENT_SUPERSEDED || Boolean(row.supersededBy);
}
// @end-legacy-unit 1114

// @legacy-unit 1115 12708
export function isFinalExportLocked(row) {
  return [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus)
    || row.procurementStatus === HANDOFF_SENT_TO_BUYER
    || Boolean(row.buyerStatus || row.buyerReceivedAt);
}
// @end-legacy-unit 1115

// @legacy-unit 1116 12714
export function canUserAAmend(row) {
  return row
    && currentRole === "requester"
    && row.project === currentProject
    && row.status !== "Draft"
    && row.status !== USER_CANCELLED_REQUEST
    && isOmBuyScope(row)
    && Boolean(row.quoteDate || row.quotationPdf || effectiveUnitPrice(row) || row.omStage === "userConfirm" || row.omStage === "finalExport" || isOmRejectReworkRequired(row))
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}
// @end-legacy-unit 1116

// @legacy-unit 1117 12727
export function isPriceReviewReworkRequired(row) {
  return Boolean(row?.priceReviewReworkRequired)
    && row.priceApprovalStatus === PRICE_ESCALATION_REJECTED
    && row.priceDecisionStatus === PRICE_ESCALATION_REJECTED
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}
// @end-legacy-unit 1117

// @legacy-unit 1118 12736
export function isOmRejectReworkRequired(row) {
  return Boolean(row?.omRejectReworkRequired)
    && (row.externalReviewStatus === OM_REJECTED_TO_DRI || row.procurementStatus === EXT_REJECTED_DRI)
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}
// @end-legacy-unit 1118

// @legacy-unit 1119 12744
export function canOmAskUserAAmend(row) {
  return row
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}
// @end-legacy-unit 1119

// @legacy-unit 1120 12751
export function isOmAmendmentWorkingRow(row) {
  return Boolean(row.amendmentOf)
    && [AMENDMENT_WAITING_OM, AMENDMENT_WAITING_USER_CONFIRM, AMENDMENT_REWORK_REQUIRED].includes(row.amendmentStatus);
}
// @end-legacy-unit 1120

// @legacy-unit 1121 12756
export function isUserAAmendmentReviewRow(row) {
  return Boolean(row.amendmentOf) && row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM;
}
// @end-legacy-unit 1121

// @legacy-unit 1122 12760
export function isItemQuantityProposalPending(row) {
  return row?.itemQuantityReviewStatus === "Proposal Pending Requester"
    && itemReviewHistory(row).some((entry) => entry.type === "proposal" && entry.status === "pending_requester_confirmation");
}
// @end-legacy-unit 1122

// @legacy-unit 1123 12765
export function latestItemQuantityProposal(row) {
  return itemReviewHistory(row).slice().reverse().find((entry) => entry.type === "proposal" && entry.status === "pending_requester_confirmation") || null;
}
// @end-legacy-unit 1123

// @legacy-unit 1124 12769
export function applyItemQuantityProposalChange(row, change) {
  const rows = stationBreakdownRowsForDetail(row);
  const matchesAggregate = (entry) => stationBreakdownPhaseKey(entry) === change.phase
    && demandTypeFor(entry) === quantityReviewModeValue(change.demandType)
    && (change.demandType === DEMAND_TYPE_MFG
      ? (entry.station || STATION_MASTER[0]) === (change.station || STATION_MASTER[0])
      : managerQuantityEntryUnit({ ...entry, request: row }) === (change.demandUnit || DEMAND_UNIT_FALLBACK));
  if (change.aggregateKey) {
    const keptRows = rows.filter((entry) => !matchesAggregate(entry));
    if (clampQty(change.afterQty) <= 0) return keptRows;
    return [
      ...keptRows,
      createStationBreakdownEntry(row, {
        demandType: change.demandType,
        phase: change.phase,
        station: change.station,
        demandUnit: change.demandUnit,
        qty: change.afterQty,
        remark: change.note,
      }),
    ];
  }
  if (change.action === "add") {
    return [
      ...rows,
      createStationBreakdownEntry(row, {
        demandType: change.demandType,
        phase: change.phase,
        station: change.station,
        demandUnit: change.demandUnit,
        qty: change.afterQty,
        remark: change.note,
      }),
    ];
  }
  if (change.action === "delete") {
    return rows.filter((entry) => {
      if (change.rowId && entry.id === change.rowId) return false;
      return !(stationBreakdownPhaseKey(entry) === change.phase
        && (entry.station || "") === (change.station || "")
        && (entry.demandUnit || "") === (change.demandUnit || ""));
    });
  }
  return rows.map((entry) => {
    const matches = change.rowId
      ? entry.id === change.rowId
      : stationBreakdownPhaseKey(entry) === change.phase
        && (entry.station || "") === (change.station || "")
        && (entry.demandUnit || "") === (change.demandUnit || "");
    if (!matches) return entry;
    return {
      ...entry,
      demandType: change.demandType || demandTypeFor(entry),
      phase: change.phase || stationBreakdownPhaseKey(entry),
      station: change.demandType === DEMAND_TYPE_NON_MFG ? "" : (change.station || entry.station || ""),
      demandUnit: change.demandType === DEMAND_TYPE_MFG ? "" : (change.demandUnit || entry.demandUnit || ""),
      qty: clampQty(change.afterQty),
      remark: change.note || entry.remark || "",
    };
  });
}
// @end-legacy-unit 1124

// @legacy-unit 1125 12831
export function acceptItemQuantityProposal(requestId) {
  const row = requests.find((item) => item.id === requestId);
  const proposal = row ? latestItemQuantityProposal(row) : null;
  if (!row || !proposal) return;
  const note = itemQuantityPrompt("Requester acceptance note is required.", "Accepted reviewer quantity proposal.");
  if (!String(note || "").trim()) {
    showToast("Requester acceptance note is required.", "error");
    return;
  }
  const now = new Date().toISOString();
  const actor = requesterDisplayName();
  replaceRequestsBinding(requests.map((item) => {
    if (item.id !== requestId) return item;
    const nextBreakdown = (proposal.changes || []).reduce((rows, change) => applyItemQuantityProposalChange({ ...item, stationBreakdown: rows }, change), stationBreakdownRowsForDetail(item));
    const history = itemReviewHistory(item).map((entry) => entry === proposal ? { ...entry, status: "accepted", resolvedAt: now, resolvedBy: actor, resolutionNote: String(note).trim() } : entry);
    return syncRowPhaseQtyFromStationBreakdown({
      ...item,
      stationBreakdown: nextBreakdown,
      status: "Submitted",
      deptDriReviewStatus: DEPT_DRI_SUBMISSION_PENDING,
      deptDriReviewReworkRequired: false,
      costManagerAuthorizationStatus: "",
      costManagerAuthorizationReworkRequired: false,
      priceReviewReworkRequired: false,
      priceApprovalStatus: "",
      priceDecisionStatus: "",
      itemQuantityReviewStatus: "Requester Revised",
      itemQuantityReviewHistory: [...history, {
        type: "requester_revision",
        action: "accept_proposal",
        actor,
        at: now,
        note: String(note).trim(),
        proposalId: proposal.id || "",
      }],
      itemQuantityRequesterRevisionCount: itemReviewRequesterRevisionCount(item) + 1,
      itemQuantityChangeCount: itemReviewChangeCount(item) + 1,
      itemQuantityLastChangedAt: now,
      itemQuantityLastChangedBy: actor,
      itemQuantityLastChangeNote: String(note).trim(),
      nextStep: "Dept DRI submission review",
    });
  }));
  const latest = requests.find((item) => item.id === requestId);
  addHandoffHistory(latest, "Requester accepted item quantity proposal", String(note).trim());
  renderDepartment();
  renderPriceReview();
  renderManager();
  showToast("Proposal accepted and resubmitted to Dept DRI.", "success");
}
// @end-legacy-unit 1125

// @legacy-unit 1126 12882
export function needConfirmationRows() {
  return requests
    .filter((row) => row.project === currentProject
      && (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM || row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM || isItemQuantityProposalPending(row) || isPriceReviewReworkRequired(row) || isDeptDriSubmissionReworkRequired(row) || isCostManagerAuthorizationReworkRequired(row) || isOmRejectReworkRequired(row)))
    .sort((a, b) => latestRequestActivityTime(b) - latestRequestActivityTime(a));
}
// @end-legacy-unit 1126

// @legacy-unit 1127 12889
export function userQuoteAmountLabel(row) {
  const amount = omAmountVnd(row);
  return amount ? `${amount.toLocaleString("en-US")} VND` : "Amount pending";
}
// @end-legacy-unit 1127

// @legacy-unit 1128 12894
export function quoteAttachmentNames(row) {
  return [omQuoteScreenshotFile(row), row.quotationExcel].filter(Boolean);
}
// @end-legacy-unit 1128

// @legacy-unit 1129 12898
export function quoteAttachmentFileHtml(label, fileName, ready, attachmentId = "", downloadUrl = "") {
  const fileLabel = ready
    ? attachmentLinkHtml(fileName, attachmentId, downloadUrl, { allowDownload: currentRole !== "requester" })
    : htmlText(`No ${label}`);
  return `
    <div class="quote-file-card ${ready ? "ready" : "missing"}">
      <span>${label}</span>
      <strong>${fileLabel}</strong>
    </div>`;
}
// @end-legacy-unit 1129

// @legacy-unit 1130 12909
export function quoteAttachmentListHtml(row) {
  const screenshotFile = omQuoteScreenshotFile(row);
  return `
    <div class="quote-file-list">
      ${quoteAttachmentFileHtml("Screenshot", screenshotFile, Boolean(screenshotFile), row.quotationPdfAttachmentId || row.quotationScreenshotAttachmentId, row.quotationPdfUrl || row.quotationScreenshotUrl)}
      ${quoteAttachmentFileHtml("Excel", row.quotationExcel, Boolean(row.quotationExcel), row.quotationExcelAttachmentId, row.quotationExcelUrl)}
    </div>`;
}
// @end-legacy-unit 1130

// @legacy-unit 1131 12918
export function userQuoteAttachmentStatus(row) {
  const screenshotFile = omQuoteScreenshotFile(row);
  if (screenshotFile && row.quotationExcel) return "Screenshot + Excel uploaded";
  if (screenshotFile) return "Screenshot uploaded";
  if (row.quotationExcel) return "Excel uploaded";
  return "No attachment";
}
// @end-legacy-unit 1131

// @legacy-unit 1132 12926
export function userQuoteInfoBarHtml(row) {
  return `
    <div class="need-confirm-info-bar">
      <span class="need-confirm-info-chip amount">
        <em>Quoted Amount</em>
        <strong>${userQuoteAmountLabel(row)}</strong>
      </span>
      <span class="need-confirm-info-chip">
        <em>Quote Date</em>
        <strong>${row.quoteDate || "-"}</strong>
      </span>
      <span class="need-confirm-info-chip">
        <em>Attachment</em>
        <strong>${userQuoteAttachmentStatus(row)}</strong>
      </span>
    </div>`;
}
// @end-legacy-unit 1132

// @legacy-unit 1133 12944
export function userQuoteStageLabel(row) {
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) return "Waiting your decision";
  if (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) return "Confirmed need";
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST) return "Cancelled by Requester";
  return omUserQuoteDecisionLabel(row);
}
// @end-legacy-unit 1133

// @legacy-unit 1134 12951
export function renderNeedConfirmationRows() {
  const rows = needConfirmationRows();
  const summary = document.getElementById("needConfirmSummary");
  const target = document.getElementById("needConfirmRows");
  if (!summary || !target) return;
  const totalAmount = rows.reduce((sum, row) => sum + omAmountVnd(row), 0);
  const oldest = rows
    .map((row) => requesterConfirmationSentAt(row) || latestRequestActivityTime(row))
    .map((value) => new Date(value || "").getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b)[0];
  const oldestIso = oldest ? new Date(oldest).toISOString() : "";
  const oldestHours = hoursSince(oldestIso);
  const oldestDays = oldestHours !== null && oldestHours > 24 ? Math.floor(oldestHours / 24) : 0;
  summary.innerHTML = summaryCardsHtml([
    { label: "Waiting Confirmation", value: rows.length, helper: `${currentProject} · your action queue`, variant: "hero" },
    { label: "Total Quoted Amount", value: totalAmount ? `${totalAmount.toLocaleString("en-US")} VND` : "0 VND", helper: "Visible quote amount only" },
    { label: "Oldest Waiting", value: oldestHours !== null && oldestHours > 24 ? `Overdue ${oldestDays}d` : oldest ? compactTimestamp(oldestIso) : "-", helper: oldestHours !== null && oldestHours > 24 ? "Needs your confirmation first" : "First item waiting for decision", variant: oldestHours !== null && oldestHours > 24 ? "warning" : "" },
  ]);
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const waitingAt = requesterConfirmationSentAt(row) || latestRequestActivityTime(row);
      const waitingHours = hoursSince(waitingAt);
      const overdue = waitingHours !== null && waitingHours > 24;
      const overdueDays = overdue ? Math.floor(waitingHours / 24) : 0;
      if (isItemQuantityProposalPending(row)) {
        const proposal = latestItemQuantityProposal(row);
        const changeCount = proposal?.changes?.length || 0;
        return `
      <article class="need-confirm-card price-rework-card item-proposal-card ${overdue ? "need-confirm-overdue" : ""}">
        <div class="need-confirm-main">
          <div class="need-confirm-taskbar">
            <span class="status-pill warning">Item Quantity Proposal</span>
            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : `${changeCount} proposed change${changeCount === 1 ? "" : "s"}`}</span>
          </div>
          <h4>${row.name}</h4>
          <p>${proposal?.note || row.itemQuantityLastChangeNote || "Reviewer proposed quantity changes. Accepting updates official demand rows and resubmits to Dept DRI."}</p>
          <div class="need-confirm-meta">
            <span>Project <strong>${row.project}</strong></span>
            <span>Total Qty <strong>${totalQty(row)}</strong></span>
            <span>Proposal Count <strong>${itemReviewProposalCount(row)}</strong></span>
            <span>Official Changes <strong>${itemReviewChangeCount(row)}</strong></span>
          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <span class="reason-text">Requester owns official quantity. Accepting this proposal writes the proposed raw rows to stationBreakdown and creates a new requester revision.</span>
        </div>
        <div class="need-confirm-actions">
          <button class="mini approve" data-item-quantity-accept-proposal="${row.id}">Accept</button>
          <button class="mini return" data-usera-amend="${row.id}">Revise</button>
          ${itemDetailButton("request", row.id)}
        </div>
      </article>
    `;
      }
		      if (isDeptDriSubmissionReworkRequired(row) || isCostManagerAuthorizationReworkRequired(row) || isPriceReviewReworkRequired(row)) {
		        const submissionRework = isDeptDriSubmissionReworkRequired(row);
		        const demandReviewRework = isCostManagerAuthorizationReworkRequired(row);
		        return `
	      <article class="need-confirm-card price-rework-card ${overdue ? "need-confirm-overdue" : ""}">
	        <div class="need-confirm-main">
	          <div class="need-confirm-taskbar">
	            <span class="status-pill rejected">${submissionRework ? "Dept DRI Submission Rejected" : demandReviewRework ? "Cost Review Revise Required" : "Price / Budget Review Rejected"}</span>
	            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Revise required"}</span>
	          </div>
	          <h4>${row.name}</h4>
	          <p>${row.deptDriReviewRejectReason || row.costManagerRejectReason || row.demandReviewReason || row.priceEscalationRejectReason || "A reviewer requested revision. Revise before resubmitting."}</p>
	          <div class="need-confirm-meta">
	            <span>Project <strong>${row.project}</strong></span>
	            <span>Total Qty <strong>${totalQty(row)}</strong></span>
	            <span>Reviewer <strong>${row.deptDriReviewRejectedBy || row.costManagerRejectedBy || row.demandReviewDecisionBy || row.priceEscalationRejectedBy || "-"}</strong></span>
	          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <span class="reason-text">Create a change request to revise item, spec, quantity, or budget reason. The original decision and reject reason stay in audit history.</span>
        </div>
        <div class="need-confirm-actions">
          <button class="mini return" data-usera-amend="${row.id}">Revise Request</button>
          ${itemDetailButton("request", row.id)}
        </div>
	      </article>
	    `;
	      }
	      if (isOmRejectReworkRequired(row)) {
	        return `
	      <article class="need-confirm-card price-rework-card ${overdue ? "need-confirm-overdue" : ""}">
	        <div class="need-confirm-main">
	          <div class="need-confirm-taskbar">
	            <span class="status-pill rejected">OM Rework Required</span>
	            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Revise required"}</span>
	          </div>
	          <h4>${row.name}</h4>
	          <p>${row.omRejectReason || row.externalRejectReason || "OM Purchasing rejected this row. Revise the request before resubmitting."}</p>
	          <div class="need-confirm-meta">
	            <span>Project <strong>${row.project}</strong></span>
	            <span>Total Qty <strong>${totalQty(row)}</strong></span>
	            <span>Rejected By <strong>${row.omRejectedBy || row.externalRejectOwner || "OM Purchasing"}</strong></span>
	          </div>
	          ${userQuoteInfoBarHtml(row)}
	        </div>
	        <div class="need-confirm-quote">
	          <span class="reason-text">Create a change request to revise item, spec, quantity, need date, or budget reason. OM rejection stays in audit history.</span>
	        </div>
	        <div class="need-confirm-actions">
	          <button class="mini return" data-usera-amend="${row.id}">Revise Request</button>
	          ${itemDetailButton("request", row.id)}
	        </div>
	      </article>
	    `;
	      }
	      return row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM ? `
      <article class="need-confirm-card amendment-card ${overdue ? "need-confirm-overdue" : ""}">
        <div class="need-confirm-main">
          <div class="need-confirm-taskbar">
            <span class="status-pill ${statusClass(AMENDMENT_WAITING_USER_CONFIRM)}">Revised Request Confirmation</span>
            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Action required"}</span>
          </div>
          <h4>${row.name}</h4>
          <p>${row.amendmentReason || "OM Purchasing updated this request and needs your confirmation before it goes back to Dept DRI."}</p>
          <div class="need-confirm-meta">
            <span>Project <strong>${row.project}</strong></span>
            <span>Total Qty <strong>${totalQty(row)}</strong></span>
            <span>Revised <strong>${row.amendedAt ? compactTimestamp(row.amendedAt) : "-"}</strong></span>
          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <div class="amendment-compare-card">
            <div class="amendment-compare-row">
              <span>Before</span>
              <strong>${snapshotPhaseText(row.previousSnapshot)}</strong>
            </div>
            <div class="amendment-compare-row current">
              <span>Now</span>
              <strong>${stageQtyText(row)}</strong>
            </div>
          </div>
        </div>
        <div class="need-confirm-actions">
          <button class="mini approve" data-usera-amend-confirm="${row.id}">Confirm Revised Request</button>
          <button class="mini reject" data-usera-amend-reject="${row.id}">Reject Amendment</button>
          ${itemDetailButton("request", row.id)}
        </div>
      </article>
    ` : `
      <article class="need-confirm-card ${overdue ? "need-confirm-overdue" : ""}">
        <div class="need-confirm-main">
          <div class="need-confirm-taskbar">
            <span class="status-pill waiting-user-a-confirmation">${userQuoteStageLabel(row)}</span>
            <span class="need-confirm-taskhint ${overdue ? "warning" : ""}">${overdue ? `Overdue ${overdueDays}d` : "Action required"}</span>
          </div>
          <h4>${row.name}</h4>
          <p>${userVisibleItemDetail(row) || "No detail/spec provided."}</p>
          <div class="need-confirm-meta">
            <span>Project <strong>${row.project}</strong></span>
            <span>Total Qty <strong>${totalQty(row)}</strong></span>
            <span>Quote Date <strong>${row.quoteDate || "-"}</strong></span>
          </div>
          ${userQuoteInfoBarHtml(row)}
        </div>
        <div class="need-confirm-quote">
          <span class="reason-text">Confirm only whether this item is still needed.</span>
        </div>
        <div class="need-confirm-actions">
          <button class="mini approve" data-usera-quote-confirm="${row.id}">Confirm Need</button>
          <button class="mini return" data-usera-amend="${row.id}">Request Change</button>
          <button class="mini reject" data-usera-quote-cancel="${row.id}">Cancel Request</button>
          ${itemDetailButton("request", row.id)}
        </div>
      </article>
    `;
    }).join("")
    : `<div class="empty-state">No quote confirmation is waiting for your action.</div>`;
}
// @end-legacy-unit 1134

export function replaceNeedConfirmationRowsBinding(value) { needConfirmationRows = value; return value; }
