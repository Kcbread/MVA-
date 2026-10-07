// approval/routing: authoritative source; see docs/module-map.md.
import {
  isTemporaryBudgetRequest
} from "../cost/price-decision.js";
import {
  omBuyScopeReason,
  omBuyScopeStatus,
  omResponsibilityPatch
} from "../om/ownership.js";
import {
  omFinalSpecStatus
} from "../om/queue.js";
import {
  DEPT_DRI_SUBMISSION_PENDING,
  HANDOFF_SENT_TO_OM,
  OM_COLLECTION_COLLECTING,
  OM_RECEIVED,
  OM_SCOPE_COORDINATOR,
  OM_SCOPE_NEED_SPEC,
  OM_SCOPE_STANDARD,
  PAS_WAITING
} from "../workflow/status-constants.js";

// @legacy-unit 597 4356
export function managerNextStep(row) {
  const scope = omBuyScopeStatus(row);
  if ([OM_SCOPE_STANDARD, OM_SCOPE_NEED_SPEC].includes(scope)) return "PAS Required - OM Buy Scope";
  if (scope === OM_SCOPE_COORDINATOR) return "MFG / Sourcing Review";
  return "Ready for MFG / Sourcing";
}
// @end-legacy-unit 597

// @legacy-unit 1438 17965
export function temporaryBudgetOmQuoteRoutingPatch(item, now = new Date().toISOString()) {
  const omPatch = omResponsibilityPatch(item);
  const itemWithOm = { ...item, ...omPatch };
  const scopeStatus = omBuyScopeStatus(itemWithOm);
  const scopeReason = omBuyScopeReason(itemWithOm);
  return {
    ...omPatch,
    temporaryBudgetManagerNotifiedAt: now,
    temporaryBudgetManagerBypass: true,
    decidedAt: now,
    omScopeStatus: scopeStatus,
    omScopeReason: scopeReason,
    nextStep: "OM PAS / Quote before Dept DRI and Budget Approver review",
    procurementStatus: HANDOFF_SENT_TO_OM,
    pasStatus: item.pasStatus || PAS_WAITING,
    pasRequired: true,
    omStatus: OM_RECEIVED,
    omStage: "pasRequest",
    omCollectionStatus: OM_COLLECTION_COLLECTING,
    finalSpecStatus: item.finalSpecStatus || omFinalSpecStatus(itemWithOm),
    sentToOmAt: item.sentToOmAt || now,
  };
}
// @end-legacy-unit 1438

// @legacy-unit 1439 17989
export function omLeaderIntakeRoutingPatch(item, now = new Date().toISOString()) {
  return {
    ...temporaryBudgetOmQuoteRoutingPatch(item, now),
    temporaryBudgetManagerBypass: isTemporaryBudgetRequest(item) ? true : item.temporaryBudgetManagerBypass,
    nextStep: "OM Leader intake / PAS Demand No assignment",
  };
}
// @end-legacy-unit 1439

// @legacy-unit 1440 17997
export function deptDriSubmissionReviewPatch(now = new Date().toISOString()) {
  return {
    deptDriReviewStatus: DEPT_DRI_SUBMISSION_PENDING,
    deptDriReviewType: "Submission",
    deptDriReviewSubmittedAt: now,
    deptDriReviewReworkRequired: false,
    deptDriReviewRejectReason: "",
    nextStep: "Dept DRI submission review",
    procurementStatus: "",
    pasStatus: "",
    pasRequired: "",
    omStatus: "",
    omStage: "",
    omCollectionStatus: "",
    sentToOmAt: "",
  };
}
// @end-legacy-unit 1440

export function replaceDeptDriSubmissionReviewPatchBinding(value) { deptDriSubmissionReviewPatch = value; return value; }
