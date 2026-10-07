// approval/status: authoritative source; see docs/module-map.md.
import {
  BUYER_COMPLETED,
  BUYER_PO_ISSUED,
  BUYER_RECEIVED,
  EXT_COMPLETED,
  EXT_PO_ISSUED
} from "../admin/state.js";
import {
  isPriceReviewStockRow
} from "./price-review.js";
import {
  demandReviewReason,
  demandReviewStatus,
  managerQueueNextStep
} from "./queue-view.js";
import {
  isTemporaryBudgetRequest
} from "../cost/price-decision.js";
import {
  hasPendingAmendment,
  isFinalExportLocked,
  isSupersededRequest
} from "../demand/amendments.js";
import {
  isWarehousePendingUse,
  warehouseOwnerLabel,
  warehouseTransactionStatus
} from "../inventory/warehouse.js";
import {
  externalStatusFor,
  latestExternalProgressEvent
} from "../om/external-progress.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  COST_MANAGER_AUTH_APPROVED,
  COST_MANAGER_AUTH_PENDING,
  COST_MANAGER_AUTH_REJECTED,
  DEMAND_REVIEW_APPROVED,
  DEMAND_REVIEW_DENIED,
  DEMAND_REVIEW_PENDING,
  DEMAND_REVIEW_REVISE_REQUIRED,
  DEPT_DRI_SUBMISSION_PENDING,
  DEPT_DRI_SUBMISSION_REJECTED,
  PRICE_ESCALATION_PENDING_DRI,
  PRICE_ESCALATION_PENDING_PROJECT_DRI,
  PRICE_ESCALATION_REJECTED,
  PRICE_ESCALATION_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1750 22272
export function priceReviewRequiresBudgetApprover(row) {
  return row?.priceDecisionStatus === PRICE_ESCALATION_REQUIRED
    || row?.priceApprovalStatus === PRICE_ESCALATION_PENDING_DRI
    || row?.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI
    || isTemporaryBudgetRequest(row);
}
// @end-legacy-unit 1750

// @legacy-unit 1751 22279
export function isDeptDriSubmissionPending(row) {
  return row?.deptDriReviewStatus === DEPT_DRI_SUBMISSION_PENDING;
}
// @end-legacy-unit 1751

// @legacy-unit 1752 22283
export function isCostManagerAuthorizationPending(row) {
  return row?.costManagerAuthorizationStatus === COST_MANAGER_AUTH_PENDING;
}
// @end-legacy-unit 1752

// @legacy-unit 1753 22287
export function isCostManagerAuthorizationRejected(row) {
  return row?.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED;
}
// @end-legacy-unit 1753

// @legacy-unit 1754 22291
export function isCostManagerAuthorizationReworkRequired(row) {
  return Boolean(row?.costManagerAuthorizationReworkRequired)
    && row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}
// @end-legacy-unit 1754

// @legacy-unit 1755 22299
export function isDeptDriSubmissionReworkRequired(row) {
  return Boolean(row?.deptDriReviewReworkRequired)
    && row.deptDriReviewStatus === DEPT_DRI_SUBMISSION_REJECTED
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row)
    && !isFinalExportLocked(row);
}
// @end-legacy-unit 1755

// @legacy-unit 1756 22307
export function priceReviewPendingOwner(row) {
  if (isDeptDriSubmissionPending(row)) return "Dept DRI";
  if (isCostManagerAuthorizationPending(row)) return "Cost Manager";
  if (priceReviewRequiresBudgetApprover(row) && (row.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI || row.driApprovedAt)) {
    return "Budget Approver";
  }
  return "Dept DRI";
}
// @end-legacy-unit 1756

// @legacy-unit 1757 22316
export function latestTimestamp(...values) {
  return values
    .filter(Boolean)
    .map((value) => ({ value, time: new Date(value).getTime() }))
    .filter((item) => !Number.isNaN(item.time))
    .sort((left, right) => right.time - left.time)[0]?.value || "";
}
// @end-legacy-unit 1757

// @legacy-unit 1758 22324
export function approvalPipelinePoStatus(row = {}) {
  const externalStatus = externalStatusFor(row);
  if (row.buyerPoNo || row.poNo) return [row.poStatus || row.buyerStatus || "PO Issued", row.buyerPoNo || row.poNo].filter(Boolean).join(" / ");
  if (row.poStatus) return row.poStatus;
  if ([BUYER_PO_ISSUED, BUYER_COMPLETED].includes(row.buyerStatus || "")) return row.buyerStatus;
  if ([EXT_PO_ISSUED, EXT_COMPLETED].includes(externalStatus)) return externalStatus;
  if (row.buyerStatus && row.buyerStatus !== BUYER_RECEIVED) return row.buyerStatus;
  if (externalStatus && externalStatus !== "-") return externalStatus;
  return "PO Pending";
}
// @end-legacy-unit 1758

// @legacy-unit 1759 22335
export function approvalPipelineStatus(row = {}, role = currentRole) {
  if (isPriceReviewStockRow(row)) {
    const status = warehouseTransactionStatus(row);
    return {
      decisionStatus: status,
      nextOwner: "Stock Evidence",
      blockedAtOwner: status === "Locked Use" ? "Locked" : warehouseOwnerLabel(row),
      sentAt: row.confirmedAt || row.createdAt || "",
      lastUpdatedAt: row.confirmedAt || row.createdAt || "",
      nextStep: status === "Locked Use" ? "Locked stock evidence" : "Waiting stock owner decision",
      poStatus: "Not PO scope",
      tone: status === "Locked Use" ? "approved" : status === "Rejected" ? "rejected" : "pending",
    };
  }
  const deptApprovedAt = row.deptDriSubmissionApprovedAt || row.driApprovedAt || "";
  const deptRejectedAt = row.deptDriReviewRejectedAt || row.priceEscalationRejectedAt || "";
  const costSubmittedAt = row.costManagerAuthorizationSubmittedAt || deptApprovedAt;
  const costApprovedAt = row.costManagerAuthorizedAt || "";
  const costRejectedAt = row.costManagerRejectedAt || "";
  const budgetApprovedAt = row.projectDriApprovedAt || "";
  const omUpdatedAt = latestTimestamp(
    row.sentToOmAt,
    row.pasDemandNoRecordedAt,
    row.pasDemandNoUpdatedAt,
    row.quoteReadyAt,
    row.quoteCompletionReadyAt,
    row.userAQuoteDecisionAt,
    row.finalExportedAt
  );
  const buyerUpdatedAt = latestTimestamp(row.buyerReceivedAt, latestExternalProgressEvent(row)?.createdAt);
  if (demandReviewStatus(row) === DEMAND_REVIEW_DENIED) {
    return {
      decisionStatus: DEMAND_REVIEW_DENIED,
      nextOwner: "Closed",
      blockedAtOwner: "Closed",
      sentAt: row.demandReviewDeniedAt || row.demandReviewDecisionAt || row.decidedAt || "",
      lastUpdatedAt: row.demandReviewDeniedAt || row.demandReviewDecisionAt || row.decidedAt || "",
      nextStep: "Demand denied / closed",
      poStatus: "Not PO scope",
      tone: "denied",
    };
  }
  if (row.status === "Rejected" || row.deptDriReviewStatus === DEPT_DRI_SUBMISSION_REJECTED || row.priceApprovalStatus === PRICE_ESCALATION_REJECTED) {
    const demandReviewRevise = demandReviewStatus(row) === DEMAND_REVIEW_REVISE_REQUIRED;
    return {
      decisionStatus: demandReviewRevise ? DEMAND_REVIEW_REVISE_REQUIRED : "Rejected",
      nextOwner: "Requester",
      blockedAtOwner: "Requester",
      sentAt: deptRejectedAt || costRejectedAt || row.decidedAt || "",
      lastUpdatedAt: deptRejectedAt || costRejectedAt || row.decidedAt || "",
      nextStep: "Requester revise / resubmit",
      poStatus: "PO Pending",
      tone: demandReviewRevise ? "revise" : "rejected",
    };
  }
  if (budgetApprovedAt) {
    const hasBuyer = Boolean(row.buyerStatus || row.buyerReceivedAt || buyerUpdatedAt || row.poStatus || row.buyerPoNo || row.poNo);
    const hasExport = Boolean(row.finalExportStatus || row.finalExportedAt);
    return {
      decisionStatus: "Approved",
      nextOwner: hasBuyer ? "Buyer" : hasExport ? "Buyer" : "OM Purchasing",
      blockedAtOwner: hasBuyer ? "Buyer" : hasExport ? "Buyer" : "OM Purchasing",
      sentAt: budgetApprovedAt,
      lastUpdatedAt: buyerUpdatedAt || omUpdatedAt || budgetApprovedAt,
      nextStep: hasBuyer ? "Buyer PR / PO tracking" : hasExport ? "Buyer handoff pending" : "OM handoff",
      poStatus: hasBuyer ? approvalPipelinePoStatus(row) : "PO Pending",
      tone: hasBuyer ? "po" : "sent",
    };
  }
  if (costApprovedAt || row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_APPROVED) {
    const hasBuyer = Boolean(row.buyerStatus || row.buyerReceivedAt || buyerUpdatedAt || row.poStatus || row.buyerPoNo || row.poNo);
    const hasExport = Boolean(row.finalExportStatus || row.finalExportedAt);
    return {
      decisionStatus: "Approved",
      nextOwner: hasBuyer ? "Buyer" : "OM Purchasing",
      blockedAtOwner: hasBuyer ? "Buyer" : hasExport ? "Buyer" : "OM Purchasing",
      sentAt: costApprovedAt || row.sentToOmAt || deptApprovedAt,
      lastUpdatedAt: buyerUpdatedAt || omUpdatedAt || costApprovedAt || row.sentToOmAt || deptApprovedAt,
      nextStep: hasBuyer ? "Buyer PR / PO tracking" : hasExport ? "Buyer handoff pending" : (row.nextStep || "OM PAS / quote / export"),
      poStatus: hasBuyer ? approvalPipelinePoStatus(row) : "PO Pending",
      tone: hasBuyer ? "po" : "sent",
    };
  }
  if (isCostManagerAuthorizationPending(row)) {
    return {
      decisionStatus: DEMAND_REVIEW_PENDING,
      nextOwner: "Cost Manager",
      blockedAtOwner: "Cost Manager",
      sentAt: deptApprovedAt,
      lastUpdatedAt: costSubmittedAt || deptApprovedAt,
      nextStep: row.nextStep || "Cost Manager final authorization",
      poStatus: "PO Pending",
      tone: "pending",
    };
  }
  if (row.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI || row.driApprovedAt) {
    return {
      decisionStatus: "Approved",
      nextOwner: "Budget Approver",
      blockedAtOwner: "Budget Approver",
      sentAt: row.driApprovedAt,
      lastUpdatedAt: row.driApprovedAt,
      nextStep: row.nextStep || "Budget exception approval",
      poStatus: "PO Pending",
      tone: "sent",
    };
  }
  if (isDeptDriSubmissionPending(row) || row.deptDriReviewStatus === DEPT_DRI_SUBMISSION_PENDING) {
    return {
      decisionStatus: "Pending",
      nextOwner: "Dept DRI",
      blockedAtOwner: "Dept DRI",
      sentAt: row.deptDriReviewSubmittedAt || row.submittedAt || "",
      lastUpdatedAt: row.deptDriReviewSubmittedAt || row.submittedAt || "",
      nextStep: row.nextStep || "Dept DRI submission review",
      poStatus: "PO Pending",
      tone: "pending",
    };
  }
  return {
    decisionStatus: row.status || row.priceApprovalStatus || "Pending",
    nextOwner: priceReviewPendingOwner(row),
    blockedAtOwner: priceReviewPendingOwner(row),
    sentAt: row.submittedAt || row.createdAt || "",
    lastUpdatedAt: latestTimestamp(row.updatedAt, row.submittedAt, row.createdAt),
    nextStep: row.nextStep || managerQueueNextStep(row) || "Workflow status",
    poStatus: approvalPipelinePoStatus(row),
    tone: "pending",
  };
}
// @end-legacy-unit 1759

// @legacy-unit 1760 22466
export function approvalPipelineToneClass(row = {}, role = currentRole) {
  return `approval-pipeline-${approvalPipelineStatus(row, role).tone || "pending"}`;
}
// @end-legacy-unit 1760

// @legacy-unit 1761 22470
export function approvalPipelineTitle(row = {}, role = currentRole) {
  const pipeline = approvalPipelineStatus(row, role);
  return [
    `Status: ${pipeline.decisionStatus}`,
    `Current Owner: ${pipeline.blockedAtOwner}`,
    pipeline.lastUpdatedAt ? `Since: ${compactDateTime(pipeline.lastUpdatedAt)}` : "",
    `Next: ${pipeline.nextStep}`,
    `PO: ${pipeline.poStatus}`,
  ].filter(Boolean).join(" / ");
}
// @end-legacy-unit 1761

// @legacy-unit 1762 22481
export function reviewStatusForRole(row = {}, role = currentRole) {
  const pipeline = approvalPipelineStatus(row, role);
  const rejected = row.status === "Rejected"
    || row.deptDriReviewStatus === DEPT_DRI_SUBMISSION_REJECTED
    || row.priceApprovalStatus === PRICE_ESCALATION_REJECTED
    || row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED;
  if (demandReviewStatus(row) === DEMAND_REVIEW_DENIED) {
    return { label: DEMAND_REVIEW_DENIED, secondary: demandReviewReason(row) || "Closed at this review gate", owner: "Closed", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "denied", actionable: false };
  }
  if (demandReviewStatus(row) === DEMAND_REVIEW_REVISE_REQUIRED) {
    return { label: DEMAND_REVIEW_REVISE_REQUIRED, secondary: demandReviewReason(row) || "Requester revise / resubmit", owner: "Requester", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "revise", actionable: false };
  }
  if (isPriceReviewStockRow(row)) {
    const status = warehouseTransactionStatus(row);
    return {
      label: status === "Locked Use" ? "You approved" : status === "Rejected" ? "Rejected by Dept DRI" : "Pending Dept DRI",
      secondary: status === "Locked Use" ? "Locked stock evidence" : warehouseOwnerLabel(row),
      owner: pipeline.blockedAtOwner || warehouseOwnerLabel(row),
      nextStep: pipeline.nextStep,
      poStatus: pipeline.poStatus,
      tone: pipeline.tone || "pending",
      actionable: role === "dri" && isWarehousePendingUse(row),
    };
  }
  if (role === "manager") {
    if (demandReviewStatus(row) === DEMAND_REVIEW_DENIED) {
      return { label: DEMAND_REVIEW_DENIED, secondary: demandReviewReason(row) || "Closed by Cost Review", owner: "Closed", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "denied", actionable: false };
    }
    if (row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_REJECTED || row.costManagerRejectedAt) {
      return { label: DEMAND_REVIEW_REVISE_REQUIRED, secondary: row.costManagerRejectReason || "Requester revise / resubmit", owner: "Requester", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "revise", actionable: false };
    }
    if (row.costManagerAuthorizedAt || row.costManagerAuthorizationStatus === COST_MANAGER_AUTH_APPROVED) {
      return { label: DEMAND_REVIEW_APPROVED, secondary: `Sent to ${pipeline.nextOwner || "OM"}`, owner: pipeline.blockedAtOwner || pipeline.nextOwner || "OM", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: pipeline.tone === "po" ? "po" : "approved", actionable: false };
    }
    if (isCostManagerAuthorizationPending(row)) {
      return { label: "Pending Cost Manager", secondary: "Dept DRI approved", owner: "Cost Manager", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "pending", actionable: true };
    }
    return { label: pipeline.decisionStatus || "Dept DRI approved", secondary: pipeline.nextStep || "", owner: pipeline.blockedAtOwner || pipeline.nextOwner || "-", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: pipeline.tone || "pending", actionable: false };
  }
  if (role === "projectDri") {
    if (rejected) {
      return { label: DEMAND_REVIEW_REVISE_REQUIRED, secondary: row.priceEscalationRejectReason || "Requester revise / resubmit", owner: "Requester", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "revise", actionable: false };
    }
    if (row.projectDriApprovedAt) {
      return { label: DEMAND_REVIEW_APPROVED, secondary: `Sent to ${pipeline.nextOwner || "OM Handoff"}`, owner: pipeline.blockedAtOwner || pipeline.nextOwner || "OM Handoff", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: pipeline.tone === "po" ? "po" : "approved", actionable: false };
    }
    if (row.priceApprovalStatus === PRICE_ESCALATION_PENDING_PROJECT_DRI || row.driApprovedAt) {
      return { label: "Pending Budget Approver", secondary: "Dept DRI approved", owner: "Budget Approver", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "pending", actionable: true };
    }
    return { label: "Dept DRI approved", secondary: pipeline.nextStep || "", owner: pipeline.blockedAtOwner || pipeline.nextOwner || "-", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: pipeline.tone || "pending", actionable: false };
  }
  if (rejected) {
    return { label: DEMAND_REVIEW_REVISE_REQUIRED, secondary: row.deptDriReviewRejectReason || row.priceEscalationRejectReason || "Requester revise / resubmit", owner: "Requester", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "revise", actionable: false };
  }
  if (row.deptDriSubmissionApprovedAt || row.driApprovedAt) {
    const nextStage = pipeline.nextOwner === "Cost Manager" ? "Cost Manager Review" : (pipeline.nextOwner || "next owner");
    return { label: DEMAND_REVIEW_APPROVED, secondary: `Sent to ${nextStage}`, owner: nextStage, nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: pipeline.tone === "po" ? "po" : "approved", actionable: false };
  }
  if (isDeptDriSubmissionPending(row) || row.priceDecisionStatus === PRICE_ESCALATION_REQUIRED || row.priceApprovalStatus === PRICE_ESCALATION_PENDING_DRI) {
    return { label: "Pending Dept DRI", secondary: pipeline.nextStep || "Waiting review", owner: "Dept DRI", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: "pending", actionable: true };
  }
  return { label: pipeline.decisionStatus || "Pending Dept DRI", secondary: pipeline.nextStep || "", owner: pipeline.blockedAtOwner || pipeline.nextOwner || "-", nextStep: pipeline.nextStep, poStatus: pipeline.poStatus, tone: pipeline.tone || "pending", actionable: false };
}
// @end-legacy-unit 1762

// @legacy-unit 1763 22545
export function reviewStatusCellHtml(row = {}, role = currentRole) {
  const status = reviewStatusForRole(row, role);
  return `
    <div class="review-status-cell review-status-${htmlAttr(status.tone || "pending")}">
      <span class="review-status-label">${htmlText(status.label || "-")}</span>
      <span class="review-status-secondary">${htmlText(status.secondary || `Current: ${status.owner || "-"}`)}</span>
      <span class="review-status-owner">${htmlText(`Current: ${status.owner || "-"}`)}</span>
      <span class="review-status-po">${htmlText(status.poStatus || "-")}</span>
    </div>`;
}
// @end-legacy-unit 1763

export function replaceApprovalPipelineStatusBinding(value) { approvalPipelineStatus = value; return value; }
