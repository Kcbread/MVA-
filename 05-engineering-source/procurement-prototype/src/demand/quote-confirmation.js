// demand/quote-confirmation: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_IN_PROGRESS,
  AMENDMENT_REWORK_REQUIRED,
  AMENDMENT_SUBMITTED,
  AMENDMENT_WAITING_OM,
  AMENDMENT_WAITING_USER_CONFIRM,
  OM_EXPORT_INVALIDATED,
  OM_QUOTE_REVIEW_REQUIRED,
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  postUserAQuoteConfirmationRoutePatch
} from "../cost/price-decision.js";
import {
  amendmentVersion,
  canUserAAmend,
  isUserAAmendmentReviewRow,
  quoteReference,
  requestSnapshot
} from "./amendments.js";
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
  isOmFinalExportPrepared
} from "../om/export-rules.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  setDeptTab
} from "../shell/navigation.js";
import {
  HANDOFF_SENT_TO_OM,
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM
} from "../workflow/status-constants.js";

// @legacy-unit 1740 21942
export function confirmUserAOmQuote(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.userAQuoteDecisionStatus !== OM_WAITING_USER_CONFIRM) return;
  const now = new Date().toISOString();
  const routePatch = row.amendmentOf ? { omStage: "finalExport", omStatus: OM_USER_CONFIRMED } : postUserAQuoteConfirmationRoutePatch(row, now);
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
    ...item,
    ...routePatch,
    userAQuoteDecisionStatus: OM_USER_CONFIRMED,
    userAQuoteDecisionAt: now,
    userAQuoteDecisionBy: roleProfiles[currentRole]?.name || "Requester",
    userAQuoteCancelReason: "",
  } : item));
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester confirmed need", "Quoted amount confirmed by Requester.");
  addHandoffHistory(after, "Requester confirmed need", "Quoted amount confirmed by Requester.");
  renderDepartment();
  renderOmPurchasing();
  showToast(after.omStage === "priceReview" ? "OM quote confirmed. Row moved to price review." : "OM quote confirmed. Row moved to OM Handoff.", "success");
}
// @end-legacy-unit 1740

// @legacy-unit 1741 21963
export function cancelUserAOmQuote(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.userAQuoteDecisionStatus !== OM_WAITING_USER_CONFIRM) return;
  const reason = window.prompt("Cancel reason is required before stopping this OM buy request.");
  if (!reason || !reason.trim()) {
    showToast("Cancel Request requires a reason.", "error");
    return;
  }
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? {
    ...item,
    status: USER_CANCELLED_REQUEST,
    omStatus: USER_CANCELLED_REQUEST,
    userAQuoteDecisionStatus: USER_CANCELLED_REQUEST,
    userAQuoteDecisionAt: new Date().toISOString(),
    userAQuoteDecisionBy: roleProfiles[currentRole]?.name || "Requester",
    userAQuoteCancelReason: reason.trim(),
    finalExportTarget: "",
    finalExportStatus: "",
    finalExportedAt: "",
    buyerStatus: "",
  } : item));
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester cancelled request", reason.trim());
  addHandoffHistory(after, "Requester cancelled request", reason.trim());
  renderDepartment();
  renderOmPurchasing();
  showToast("OM buy request cancelled by Requester.", "success");
}
// @end-legacy-unit 1741

// @legacy-unit 1742 21992
export function createUserAAmendmentDraft(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) {
    showToast("This request cannot be updated at the current stage.", "error");
    return;
  }
  if (row.amendmentOf && isUserAAmendmentReviewRow(row)) {
    setDeptTab("needConfirmation");
    renderDepartment();
    showToast("This revised request is ready in Action Required.", "info");
    return;
  }
  const source = row.amendmentOf ? requests.find((item) => item.id === row.amendmentOf) : row;
  if (!source || !canUserAAmend(source)) {
    showToast("Only quoted OM rows that are not exported can request changes.", "error");
    return;
  }
  const reason = window.prompt("Please describe what should be changed in item, spec, or quantity.");
  if (!reason || !reason.trim()) {
    showToast("Request Change requires a reason.", "error");
    return;
  }
  const now = new Date().toISOString();
  const workingId = `DRAFT-AMEND-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
  const quote = quoteReference(source) || source.previousQuoteReference;
  const snapshot = requestSnapshot(source);
  const nextVersion = amendmentVersion(source) + 1;
  const amendmentDraft = {
    ...source,
    id: workingId,
    selected: false,
    status: "Draft",
    managerReason: "",
    submittedAt: "",
    decidedAt: "",
    amendmentOf: source.id,
    amendmentVersion: nextVersion,
    amendmentStatus: AMENDMENT_WAITING_OM,
    amendmentReason: reason.trim(),
    amendmentRequestedBy: roleProfiles[currentRole]?.name || "Requester",
    amendmentRequestedAt: now,
    amendedBy: "",
    amendedAt: "",
    amendmentSubmittedAt: "",
    amendmentApprovedBy: "",
    amendmentApprovedAt: "",
    amendmentUserConfirmedBy: "",
    amendmentUserConfirmedAt: "",
    amendmentUserRejectedBy: "",
    amendmentUserRejectedAt: "",
    amendmentReworkReason: "",
    previousSnapshot: snapshot,
    previousQuoteReference: quote,
    supersededBy: "",
    omStage: "pasResult",
    omStatus: OM_QUOTE_REVIEW_REQUIRED,
    omSelected: false,
    userAQuoteDecisionStatus: "",
    userAQuoteDecisionAt: "",
    userAQuoteDecisionBy: "",
    userAQuoteCancelReason: "",
    finalExportTarget: "",
    finalExportPreparedAt: "",
    finalExportedAt: "",
    finalExportPackageCode: "",
    finalExportStatus: isOmFinalExportPrepared(source) ? OM_EXPORT_INVALIDATED : "",
    buyerStatus: "",
    buyerReceivedAt: "",
    procurementStatus: HANDOFF_SENT_TO_OM,
  };
  replaceRequestsBinding([
    amendmentDraft,
    ...requests.map((item) => item.id === source.id ? {
      ...item,
      amendmentStatus: AMENDMENT_IN_PROGRESS,
      amendmentReason: reason.trim(),
      amendmentRequestedBy: roleProfiles[currentRole]?.name || "Requester",
      amendmentRequestedAt: now,
      previousSnapshot: snapshot,
      previousQuoteReference: quote,
      omSelected: false,
      finalExportStatus: isOmFinalExportPrepared(item) ? OM_EXPORT_INVALIDATED : item.finalExportStatus,
    } : item),
  ]);
  addHandoffHistory(source, "Requester requested change", reason.trim());
  addOmHistory(source, "Requester requested change", reason.trim());
  renderDepartment();
  renderOmPurchasing();
  showToast(`Request Change sent to OM Purchasing as Amendment v${nextVersion}.`, "success");
}
// @end-legacy-unit 1742

// @legacy-unit 1743 22083
export function confirmUserAAmendment(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.amendmentStatus !== AMENDMENT_WAITING_USER_CONFIRM) return;
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((item) => {
    if (item.id === requestId) {
      return {
        ...item,
        status: "Submitted",
        submittedAt: now,
        submittedBy: roleProfiles[currentRole]?.name || "Requester",
        managerReason: "",
        amendmentStatus: AMENDMENT_SUBMITTED,
        amendmentSubmittedAt: now,
        amendmentUserConfirmedBy: roleProfiles[currentRole]?.name || "Requester",
        amendmentUserConfirmedAt: now,
        userAQuoteDecisionAt: now,
        userAQuoteDecisionBy: roleProfiles[currentRole]?.name || "Requester",
      };
    }
    if (item.id === row.amendmentOf) {
      return {
        ...item,
        amendmentStatus: AMENDMENT_SUBMITTED,
        supersededBy: requestId,
      };
    }
    return item;
  }));
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester confirmed revised request", row.amendmentReason || "Revised request confirmed by Requester.");
  addHandoffHistory(after, "Resubmitted to Dept DRI", row.amendmentReason || "Revised request confirmed by Requester.");
  renderDepartment();
  renderManager();
  renderOmPurchasing();
  showToast("Revised request confirmed and resubmitted to Dept DRI.", "success");
}
// @end-legacy-unit 1743

// @legacy-unit 1744 22121
export function rejectUserAAmendment(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || row.amendmentStatus !== AMENDMENT_WAITING_USER_CONFIRM) return;
  const reason = window.prompt("Please enter the reason for rejecting OM's revised request.");
  if (!reason || !reason.trim()) {
    showToast("Reject Amendment requires a reason.", "error");
    return;
  }
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((item) => {
    if (item.id === requestId) {
      return {
        ...item,
        amendmentStatus: AMENDMENT_REWORK_REQUIRED,
        amendmentReworkReason: reason.trim(),
        amendmentUserRejectedBy: roleProfiles[currentRole]?.name || "Requester",
        amendmentUserRejectedAt: now,
        omStage: "pasResult",
        omStatus: OM_QUOTE_REVIEW_REQUIRED,
      };
    }
    return item;
  }));
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "Requester rejected amendment", reason.trim());
  addHandoffHistory(after, "Requester rejected amendment", reason.trim());
  renderDepartment();
  renderOmPurchasing();
  showToast("Amendment returned to OM Purchasing for rework.", "success");
}
// @end-legacy-unit 1744

export function replaceConfirmUserAOmQuoteBinding(value) { confirmUserAOmQuote = value; return value; }

export function replaceCreateUserAAmendmentDraftBinding(value) { createUserAAmendmentDraft = value; return value; }
