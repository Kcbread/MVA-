// om/pas-actions: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_WAITING_USER_CONFIRM,
  OM_QUOTE_REVIEW_REQUIRED
} from "../admin/state.js";
import {
  isTemporaryBudgetRequest
} from "../cost/price-decision.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  renderProcurement
} from "../handoff/view.js";
import {
  ensureOmRowAccess
} from "./assignment.js";
import {
  addOmHistory
} from "./history.js";
import {
  omBuyScopeStatus
} from "./ownership.js";
import {
  omPasDemandRequirement,
  pasBrand,
  pasDataTransferTo,
  pasLegalName,
  pasPartName,
  pasRequestDept,
  pasSpec
} from "./pas-view.js";
import {
  omFinalSpecStatus,
  omItemBucket
} from "./queue.js";
import {
  confirmOmQuoteResultRows
} from "./quote-actions.js";
import {
  omQuoteMissingFields
} from "./quote-view.js";
import {
  selectedOmPasRequestRows,
  selectedOmPasResultRows
} from "./selection.js";
import {
  omSelections
} from "./state.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  todayDateString
} from "../sourcing/rfq.js";
import {
  HANDOFF_SENT_TO_OM,
  OM_COLLECTION_COLLECTING,
  OM_COLLECTION_QUOTATION,
  OM_FINAL_SPEC_READY,
  OM_FINAL_SPEC_REQUIRED,
  OM_RECEIVED,
  OM_SCOPE_NEED_SPEC,
  OM_SCOPE_STANDARD,
  OM_WAITING_USER_CONFIRM,
  PAS_APPROVED,
  PAS_BUDGET_ISSUED
} from "../workflow/status-constants.js";

// @legacy-unit 1494 18701
export function updatePasField(requestId, field, value) {
  replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, [field]: field === "pasBudgetAmount" ? clampQty(value) : value } : row));
  renderOmPurchasing();
}
// @end-legacy-unit 1494

// @legacy-unit 1495 18706
export function applyPasDecision(requestId, decision) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (["approve", "budget"].includes(decision) && !row.pasProjectCode) {
    showToast("PAS project code is required before sending to OM Purchasing.", "error");
    return;
  }
  const nextStatus = decision === "budget" ? PAS_BUDGET_ISSUED : PAS_APPROVED;
  replaceRequestsBinding(requests.map((item) => {
    if (item.id !== requestId) return item;
    const scopeStatus = omBuyScopeStatus(item);
    return {
      ...item,
      pasStatus: nextStatus,
      pasReviewDate: item.pasReviewDate || todayDateString(),
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      omCollectionStatus: scopeStatus === OM_SCOPE_STANDARD ? OM_COLLECTION_QUOTATION : OM_COLLECTION_COLLECTING,
      finalSpecStatus: scopeStatus === OM_SCOPE_NEED_SPEC ? OM_FINAL_SPEC_REQUIRED : OM_FINAL_SPEC_READY,
      sentToOmAt: new Date().toISOString(),
      externalReviewStatus: "",
      externalRejectReason: "",
    };
  }));
  const updated = requests.find((item) => item.id === requestId);
  const action = nextStatus === PAS_BUDGET_ISSUED ? "PAS Budget Code Issued - Send to OM" : "PAS Approved - Send to OM";
  addHandoffHistory(updated, action, updated.pasProjectCode || "");
  addOmHistory(updated, action, `PAS project code: ${updated.pasProjectCode}`);
  renderProcurement();
  renderDepartment();
  renderOmPurchasing();
  showToast(action, "success");
}
// @end-legacy-unit 1495

// @legacy-unit 1735 21820
export function movePasRowsToQuoteCompletion(rows) {
  if (!rows.length) {
    showToast("Select at least one PAS result row before moving to Quote Completion.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "move to Quote Result"))) return;
  const missingDemandNo = rows.filter((row) => omPasDemandRequirement(row).required && !row.pasDemandNo);
  if (missingDemandNo.length) {
    showToast("PAS Demand ID is required for Hard Item before Quote Result.", "error");
    return;
  }
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      omSelected: false,
      pasStatus: PAS_APPROVED,
      pasLegalName: pasLegalName(row),
      pasRequestDept: pasRequestDept(row),
      pasDataTransferTo: pasDataTransferTo(row),
      pasDemandDate: row.pasDemandDate || todayDateString(new Date(now)),
      pasPartName: pasPartName(row),
      pasBrand: pasBrand(row),
      pasSpec: pasSpec(row),
      pasDemandNoUpdatedAt: row.pasDemandNo ? row.pasDemandNoUpdatedAt || now : row.pasDemandNoUpdatedAt,
      pasDemandNoRecordedAt: row.pasDemandNo ? row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt || now : row.pasDemandNoRecordedAt,
      pasResultReceivedAt: row.pasResultReceivedAt || now,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      sentToOmAt: row.sentToOmAt || now,
      omCollectionStatus: OM_COLLECTION_QUOTATION,
      finalSpecStatus: row.finalSpecStatus || omFinalSpecStatus(row),
      omStage: "pasResult",
    };
  }));
  rows.forEach((row) => {
    const requirement = omPasDemandRequirement(row);
    if (row.pasDemandNo) addOmHistory(row, "PAS Demand No recorded", row.pasDemandNo);
    addOmHistory(row, "PAS result received", `${row.project} ${omItemBucket(row)} moved to Quote Completion. ${requirement.label}.`);
    addHandoffHistory(row, "PAS result received", `${row.project} ${omItemBucket(row)} moved to Quote Completion. ${requirement.label}.`);
  });
  omSelections.clear();
  renderOmPurchasing();
  showToast(`${rows.length} row${rows.length === 1 ? "" : "s"} moved to Quote Completion.`, "success");
}
// @end-legacy-unit 1735

// @legacy-unit 1736 21867
export function markPasRequestSent() {
  movePasRowsToQuoteCompletion(selectedOmPasRequestRows());
}
// @end-legacy-unit 1736

// @legacy-unit 1737 21871
export async function sendOmPasRowsToUserConfirm(rows) {
  if (!rows.length) {
    showToast("No quote row is available to send to Requester confirmation.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "send to Requester confirmation"))) return;
  const incomplete = rows
    .map((row) => ({ row, missing: omQuoteMissingFields(row) }))
    .filter((item) => item.missing.length);
  if (incomplete.length) {
    showToast(`Complete required quote fields before Send to Requester: ${incomplete[0].missing.join(", ")}.`, "error");
    return;
  }
  const now = new Date().toISOString();
  const standardRows = rows.filter((row) => !row.amendmentOf && !isTemporaryBudgetRequest(row));
  if (standardRows.length && !await confirmOmQuoteResultRows(standardRows, { requireComplete: true })) return;
  replaceRequestsBinding(requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    const isAmendment = Boolean(row.amendmentOf);
    if (!isAmendment && isTemporaryBudgetRequest(row)) return row;
    return {
      ...row,
      omSelected: false,
      omStage: "userConfirm",
      omStatus: isAmendment ? OM_QUOTE_REVIEW_REQUIRED : OM_WAITING_USER_CONFIRM,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
      sentToUserAAt: isAmendment ? row.sentToUserAAt : now,
      userAQuoteDecisionStatus: isAmendment ? "" : OM_WAITING_USER_CONFIRM,
      userAQuoteDecisionAt: isAmendment ? row.userAQuoteDecisionAt : "",
      userAQuoteDecisionBy: isAmendment ? row.userAQuoteDecisionBy : "",
      userAQuoteCancelReason: isAmendment ? row.userAQuoteCancelReason : "",
      amendmentStatus: isAmendment ? AMENDMENT_WAITING_USER_CONFIRM : row.amendmentStatus,
    };
  }));
  rows.forEach((row) => {
    if (!row.amendmentOf && isTemporaryBudgetRequest(row)) return;
    const action = row.amendmentOf ? "Sent to User A for revised confirmation" : "Sent to User A for confirmation";
    const note = row.amendmentOf
      ? "OM revised the request and sent the updated result to User A."
      : "PAS result is ready for User A quote confirmation.";
    addOmHistory(row, action, note);
    addHandoffHistory(row, action, note);
  });
  omSelections.clear();
  renderOmPurchasing();
  renderDepartment();
  showToast(`${rows.filter((row) => row.amendmentOf || !isTemporaryBudgetRequest(row)).length} row${rows.length === 1 ? "" : "s"} sent to User A confirmation.`, "success");
}
// @end-legacy-unit 1737

// @legacy-unit 1738 21921
export async function sendOmPasResultToUserConfirm() {
  await sendOmPasRowsToUserConfirm(selectedOmPasResultRows());
}
// @end-legacy-unit 1738

// @legacy-unit 1739 21925
export function openOmPasResultUpload() {
  const rows = selectedOmPasResultRows();
  if (!rows.length) {
    showToast("Select a PAS result row before uploading the PAS attachment.", "error");
    return;
  }
  const input = document.querySelector(`[data-om-pdf="${rows[0].id}"]`);
  if (!input) {
    showToast("PAS attachment upload is not available for the selected row.", "error");
    return;
  }
  if (rows.length > 1) {
    showToast("Opening PAS attachment upload for the first selected row.", "info");
  }
  input.click();
}
// @end-legacy-unit 1739

export function replaceSendOmPasRowsToUserConfirmBinding(value) { sendOmPasRowsToUserConfirm = value; return value; }
