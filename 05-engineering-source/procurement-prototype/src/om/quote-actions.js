// om/quote-actions: authoritative source; see docs/module-map.md.
import {
  EXT_REJECTED_DRI,
  QUOTE_EXCEPTION_NOTE
} from "../admin/state.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  amountVndFromUsd,
  currentUsdToVndRate,
  money
} from "../cost/currency.js";
import {
  isTemporaryBudgetRequest,
  priceDecisionPatch
} from "../cost/price-decision.js";
import {
  effectiveUnitPrice,
  renderManagerCostView
} from "../cost/pricing.js";
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
  ensurePasExcelSystemFileForGroups
} from "../exports/pas.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  renderProcurement
} from "../handoff/view.js";
import {
  omBusinessFlowModule
} from "../infrastructure/module-adapters.js";
import {
  canOperateOmRow,
  ensureOmRowAccess
} from "./assignment.js";
import {
  openOmExternalResultModal
} from "./external-progress.js";
import {
  addOmHistory
} from "./history.js";
import {
  movePasRowsToQuoteCompletion
} from "./pas-actions.js";
import {
  omPasDemandRequirement,
  omQuoteDbCandidate,
  omQuoteDbCandidateStatus
} from "./pas-view.js";
import {
  omPasResultRows,
  omQuoteConfirmRows
} from "./queue.js";
import {
  omQuotationDbRetentionDecision,
  omReadyForBuyer
} from "./quote-rules.js";
import {
  omQuoteValidUntil,
  omQuoteValidity
} from "./quote-validity.js";
import {
  omQuoteMissingFields
} from "./quote-view.js";
import {
  selectedOmPasResultRows,
  selectedOmWorkflowRows
} from "./selection.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
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
  PRICE_AUTO_CLEARED,
  PRICE_ESCALATION_REQUIRED,
  PRICE_HIGH_HISTORY_REVIEW,
  PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1715 21526
export function updateOmField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  if (before && !ensureOmRowAccess(before, `update ${field}`)) {
    renderOmPurchasing();
    return;
  }
  const targetField = field === "updatedPriceVnd" ? "updatedPrice" : field;
  const normalizedValue = field === "updatedPriceVnd"
    ? clampQty(value) / currentUsdToVndRate()
    : field === "updatedPrice" || STAGES.includes(targetField)
      ? clampQty(value)
      : value;
  if (!before || before[targetField] === normalizedValue) return;
  const timestampPatch = {};
  if (targetField === "pasDemandNo") {
    timestampPatch.pasDemandNoUpdatedAt = new Date().toISOString();
    timestampPatch.pasDemandNoRecordedAt = timestampPatch.pasDemandNoUpdatedAt;
  }
  if (targetField === "pasMaterialNo") timestampPatch.pasMaterialNoUpdatedAt = new Date().toISOString();
  if (targetField === "quoteDate") {
    timestampPatch.quoteReceivedAt = normalizedValue;
    timestampPatch.quoteReceivedAtUpdatedAt = new Date().toISOString();
  }
  if (field === "updatedPriceVnd") {
    timestampPatch.updatedPriceUsd = normalizedValue;
    timestampPatch.updatedPriceVnd = clampQty(value);
  } else if (targetField === "updatedPrice") {
    timestampPatch.updatedPriceUsd = normalizedValue;
    timestampPatch.updatedPriceVnd = Math.round(amountVndFromUsd(normalizedValue));
  }
  if (targetField === "quoteReceivedAt") timestampPatch.quoteReceivedAtUpdatedAt = new Date().toISOString();
  if (targetField === "quoteValidUntil") {
    timestampPatch.quoteValidUntilUpdatedAt = new Date().toISOString();
    timestampPatch.quoteExpiry = normalizedValue;
    timestampPatch.quoteStatus = omQuoteValidity({ ...before, quoteValidUntil: normalizedValue, quoteExpiry: normalizedValue });
  }
  if (["pasPartName", "pasBrand", "pasSpec"].includes(targetField)) timestampPatch.pasItemInfoUpdatedAt = new Date().toISOString();
  replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, [targetField]: normalizedValue, ...timestampPatch } : row));
  const after = requests.find((row) => row.id === requestId);
  const note = field === "updatedPriceVnd"
    ? `Unit price updated to ${Number(value || 0).toLocaleString("en-US")} VND.`
    : targetField === "updatedPrice"
      ? `Unit price updated to ${money(after.updatedPrice)}.`
      : STAGES.includes(targetField)
        ? `${STAGE_LABELS[targetField]} quantity updated to ${clampQty(value)}.`
        : `${targetField} updated to ${value || "blank"}.`;
  const action = targetField === "pasDemandNo"
    ? "PAS Demand No recorded"
    : targetField === "pasMaterialNo"
      ? "PAS Material No recorded"
    : targetField === "quoteValidUntil"
      ? "Quote validity recorded"
    : targetField === "quoteReceivedAt"
      ? "Bidding result received"
    : ["pasPartName", "pasBrand", "pasSpec"].includes(targetField)
      ? "PAS item info updated"
      : ["name", "detail", ...STAGES].includes(targetField)
        ? "OM amendment updated"
      : targetField === "externalSystemStatus" ? "Updated external system status" : "Updated quote data";
  addOmHistory(after, action, note);
  renderOmPurchasing();
  renderDepartment();
  renderManager();
  renderManagerCostView();
}
// @end-legacy-unit 1715

// @legacy-unit 1716 21592
export function updateOmPasExcelMergeDecision(requestId, decision) {
  const before = requests.find((row) => row.id === requestId);
  if (before && !ensureOmRowAccess(before, "update PAS Excel grouping decision")) {
    renderOmPurchasing();
    return;
  }
  const normalizedDecision = decision === "separate" ? "separate" : "merge";
  if (!before || before.pasExcelMergeDecision === normalizedDecision) return;
  replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, pasExcelMergeDecision: normalizedDecision } : row));
  const updated = requests.find((row) => row.id === requestId);
  if (updated) addOmHistory(updated, "PAS Excel grouping decision", normalizedDecision === "merge" ? "Merge for one PAS Excel." : "Keep separate PAS Excel.");
  renderOmPurchasing();
}
// @end-legacy-unit 1716

// @legacy-unit 1717 21606
export function toggleOmQuoteException(requestId, checked) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || Boolean(row.quoteException) === checked) return;
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? { ...item, quoteException: checked } : item));
  const updated = requests.find((item) => item.id === requestId);
  addOmHistory(updated, checked ? "Marked update required" : "Cleared update required", checked ? QUOTE_EXCEPTION_NOTE : "Quote exception cleared.");
  renderOmPurchasing();
  renderProcurement();
  showToast(checked ? "Quote exception marked." : "Quote exception cleared.", "success");
}
// @end-legacy-unit 1717

// @legacy-unit 1723 21642
export function rejectOmSelectedToDri() {
  rejectOmRowsToDri(selectedOmWorkflowRows());
}
// @end-legacy-unit 1723

// @legacy-unit 1724 21646
export function rejectOmRowsToDri(rows) {
  if (!rows.length) {
    showToast("No OM row is available to reject to DRI.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "reject to DRI"))) return;
  openOmExternalResultModal(rows, EXT_REJECTED_DRI, "om");
}
// @end-legacy-unit 1724

// @legacy-unit 1725 21655
export function askUserAAmendSelected() {
  showToast("Amendment requests now start from Requester after quote. Use the Requester Request Change action instead.", "info");
}
// @end-legacy-unit 1725

// @legacy-unit 1726 21659
export function selectedOmProjectPackage(rows) {
  return [...new Set(rows.map((row) => row.project))];
}
// @end-legacy-unit 1726

// @legacy-unit 1727 21663
export function pasExcelRowsForQuoteConfirmation(rows = []) {
  const selectedIds = new Set(rows.map((row) => row.id));
  const selectedPasDemandNos = new Set(rows
    .map((row) => omBusinessFlowModule().normalizePasDemandNo?.(row.pasDemandNo || row.pasDemandId || "") || "")
    .filter(Boolean));
  return omQuoteConfirmRows().filter((candidate) => {
    if (selectedIds.has(candidate.id)) return true;
    const candidatePasDemandNo = omBusinessFlowModule().normalizePasDemandNo?.(candidate.pasDemandNo || candidate.pasDemandId || "") || "";
    if (!candidatePasDemandNo || !selectedPasDemandNos.has(candidatePasDemandNo)) return false;
    if (candidate.pasExcelMergeDecision === "separate") return false;
    return canOperateOmRow(candidate);
  });
}
// @end-legacy-unit 1727

// @legacy-unit 1728 21677
export async function confirmOmQuoteResultRows(rows, { requireComplete = true } = {}) {
  if (!saveOmQuoteInfoRows(rows, { requireComplete })) return false;
  const excelRows = pasExcelRowsForQuoteConfirmation(rows);
  const groups = omBusinessFlowModule().groupRowsForPasExcelExport?.(excelRows) || [];
  if (groups.length) {
    await ensurePasExcelSystemFileForGroups(groups, { download: false });
  }
  return true;
}
// @end-legacy-unit 1728

// @legacy-unit 1729 21687
export async function generatePasExcelForQuoteRow(row, { download = false } = {}) {
  const excelRows = pasExcelRowsForQuoteConfirmation([row]);
  const groups = omBusinessFlowModule().groupRowsForPasExcelExport?.(excelRows.length ? excelRows : [row]) || [];
  if (!groups.length) return false;
  await ensurePasExcelSystemFileForGroups(groups, { download });
  return true;
}
// @end-legacy-unit 1729

// @legacy-unit 1730 21695
export function saveOmQuoteInfoRows(rows, { requireComplete = false } = {}) {
  if (!rows.every((row) => ensureOmRowAccess(row, "validate quote result"))) return;
  const incompleteRows = rows
    .map((row) => ({ row, missing: omQuoteMissingFields(row) }))
    .filter((item) => item.missing.length);
  if (requireComplete && incompleteRows.length) {
    showToast(`Complete required quote fields: ${incompleteRows[0].missing.join(", ")}.`, "error");
    return false;
  }
  const now = new Date().toISOString();
  const rowIds = new Set(rows.map((row) => row.id));
  replaceRequestsBinding(requests.map((row) => {
    if (!rowIds.has(row.id)) return row;
    const retention = omQuotationDbRetentionDecision(row);
    const retentionPatch = {
      quoteDbRetentionStatus: retention.status,
      quoteDbRetentionReason: retention.reason,
      quoteDbRetentionEligible: retention.eligible,
      quoteDbRetentionDaysRemaining: retention.daysRemaining,
      quoteDbRetentionEvaluatedAt: now,
    };
    if (!omReadyForBuyer(row) || row.amendmentOf) {
      return {
        ...row,
        ...retentionPatch,
        quoteReadyAt: omReadyForBuyer(row) ? row.quoteReadyAt || now : row.quoteReadyAt,
        quoteCompletionReadyAt: omReadyForBuyer(row) ? row.quoteCompletionReadyAt || now : row.quoteCompletionReadyAt,
      };
    }
    const shouldDeferRouting = !isTemporaryBudgetRequest(row);
    return {
      ...row,
      ...retentionPatch,
      ...priceDecisionPatch(row, now, { deferRouting: shouldDeferRouting }),
    };
  }));
  rows.forEach((row) => {
    const latest = requests.find((item) => item.id === row.id) || row;
    addOmHistory(latest, "Validated quote result", `Vendor: ${latest.vendor || "blank"} / Unit price: ${effectiveUnitPrice(latest) || "blank"} / Quote valid until: ${omQuoteValidUntil(latest) || "blank"}`);
    addOmHistory(latest, "Quotation DB retention evaluated", `${latest.quoteDbRetentionStatus || "Not evaluated"}: ${latest.quoteDbRetentionReason || "No retention reason."}`);
    if (latest.priceDecisionStatus === PRICE_AUTO_CLEARED) {
      addOmHistory(latest, "Auto cleared by threshold", latest.priceDecisionReason || "Quote is within threshold.");
      addHandoffHistory(latest, "Auto cleared by threshold", latest.priceDecisionReason || "Requester confirmation not required.");
    }
    if (latest.priceDecisionStatus === PRICE_ESCALATION_REQUIRED) {
      addOmHistory(latest, "Price escalation required", latest.priceDecisionReason || "DRI review required.");
      addHandoffHistory(latest, "Price escalation required", latest.priceDecisionReason || "Dept DRI review required; Temporary Budget continues to Budget Approver.");
    }
    if (latest.priceDecisionStatus === PRICE_HIGH_HISTORY_REVIEW) {
      addOmHistory(latest, "High history quote decision required", latest.priceDecisionReason || "Quote is higher than 110% of history price.");
      addHandoffHistory(latest, "High history quote decision required", latest.priceDecisionReason || "OM must choose confirm send out or ask Requester confirmation.");
    }
    if (latest.priceDecisionStatus === PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED) {
      addOmHistory(latest, "Requester quote confirmation required", latest.priceDecisionReason || "No reusable history price.");
      addHandoffHistory(latest, "Requester quote confirmation required", latest.priceDecisionReason || "Requester must confirm quote before Dept DRI submission.");
    }
    addHandoffHistory(latest, "Quote compared with history", `History ${money(latest.historyUnitPrice || 0)} / Quote ${money(latest.quoteUnitPrice || 0)} / Delta ${Number(latest.priceDeltaUsd || 0).toFixed(2)} USD / Threshold ${Number(latest.priceThresholdUsd || 0.4).toFixed(2)} USD`);
    addHandoffHistory(latest, "Quote compared with requester estimate", `Estimate ${money(latest.estimateUnitPriceSnapshotUsd || 0)} / Quote ${money(latest.quoteUnitPriceSnapshotUsd || 0)} / Delta ${Number(latest.estimateDeltaUsd || 0).toFixed(2)} USD / ${latest.estimateVarianceStatus || "Within Estimate Range"}`);
  });
  return true;
}
// @end-legacy-unit 1730

// @legacy-unit 1731 21757
export async function saveOmQuoteInfo() {
  const rows = selectedOmPasResultRows().length ? selectedOmPasResultRows() : omPasResultRows();
  if (!rows.length) {
    showToast("No PAS result rows are available to save.", "error");
    return;
  }
  if (!await confirmOmQuoteResultRows(rows, { requireComplete: true })) return;
  renderOmPurchasing();
  showToast("Quote validated; generated PAS Excel attached; price and Quotation DB retention checks updated.", "success");
}
// @end-legacy-unit 1731

// @legacy-unit 1732 21768
export function applyQuoteDbCandidateToOmRow(row, actionLabel = "Central IT Checked") {
  if (!row || !ensureOmRowAccess(row, actionLabel)) return null;
  const candidate = omQuoteDbCandidate(row);
  if (!candidate) {
    showToast("No Quotation DB candidate found for this item/spec.", "error");
    return null;
  }
  const status = omQuoteDbCandidateStatus(row, candidate);
  if (status?.expired) {
    showToast("Quotation DB candidate is expired. Requote is required.", "error");
    return null;
  }
  const now = new Date().toISOString();
  const actor = roleProfiles[currentRole]?.name || "OM Purchasing";
  replaceRequestsBinding(requests.map((item) => {
    if (item.id !== row.id) return item;
    const patched = omBusinessFlowModule().applyQuoteDbCandidate?.(item, candidate, now, actor) || item;
    return {
      ...patched,
      quoteValidUntilUpdatedAt: patched.quoteValidUntil ? now : item.quoteValidUntilUpdatedAt,
      quoteReceivedAt: patched.quoteDate || item.quoteReceivedAt,
      pasDemandNoUpdatedAt: patched.pasDemandNo ? now : item.pasDemandNoUpdatedAt,
      pasDemandNoRecordedAt: patched.pasDemandNo ? item.pasDemandNoRecordedAt || now : item.pasDemandNoRecordedAt,
      pasMaterialNoUpdatedAt: patched.pasMaterialNo ? now : item.pasMaterialNoUpdatedAt,
    };
  }));
  const updated = requests.find((item) => item.id === row.id) || row;
  addOmHistory(updated, actionLabel, `Quotation DB candidate ${candidate.id} checked; ${status?.quantityNote || "quantity is not a hard stop"}`);
  addHandoffHistory(updated, "Quotation DB candidate reused", `${candidate.id} / valid until ${candidate.quoteValidUntil || "-"}.`);
  return updated;
}
// @end-legacy-unit 1732

// @legacy-unit 1733 21800
export function markOmCentralItChecked(row) {
  const updated = applyQuoteDbCandidateToOmRow(row, "Central IT Checked");
  if (!updated) return;
  renderOmPurchasing();
  showToast("Central IT checked. Quotation DB candidate marked reusable.", "success");
}
// @end-legacy-unit 1733

// @legacy-unit 1734 21807
export function applyQuoteDbFromIntake(row) {
  const updated = applyQuoteDbCandidateToOmRow(row, "Quote DB candidate applied from My Intake");
  if (!updated) return;
  const latest = requests.find((item) => item.id === row.id) || updated;
  if (omPasDemandRequirement(latest).required && !latest.pasDemandNo) {
    renderOmPurchasing();
    showToast("Quotation DB applied. PAS Demand ID is still required before My Quote Result.", "success");
    return;
  }
  movePasRowsToQuoteCompletion([latest]);
  showToast("Quotation DB applied and moved to My Quote Result.", "success");
}
// @end-legacy-unit 1734

export function replaceConfirmOmQuoteResultRowsBinding(value) { confirmOmQuoteResultRows = value; return value; }

export function replaceSaveOmQuoteInfoRowsBinding(value) { saveOmQuoteInfoRows = value; return value; }
