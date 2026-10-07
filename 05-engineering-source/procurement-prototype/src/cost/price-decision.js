// cost/price-decision: authoritative source; see docs/module-map.md.
import {
  adminApprovalSetup
} from "../admin/state.js";
import {
  budgetApprovedExchangeRateMonth,
  usdToVndRateForRow
} from "./currency.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  totalQty
} from "../demand/quantity.js";
import {
  priceDecisionModule
} from "../infrastructure/module-adapters.js";
import {
  isMaterialNoPending,
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize
} from "../shared/format.js";
import {
  OM_WAITING_USER_CONFIRM,
  PRICE_AUTO_CLEARED,
  PRICE_ESCALATION_PENDING_DRI,
  PRICE_ESCALATION_REQUIRED,
  PRICE_HIGH_HISTORY_REVIEW,
  PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
  USER_CONFIRMATION_NOT_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1640 20369
export function quoteUnitPriceUsdForDecision(row) {
  const directUsd = Number(row.updatedPriceUsd || row.quoteUnitPriceUsd || 0);
  if (directUsd > 0) return directUsd;
  const directVnd = Number(row.updatedPriceVnd || row.quoteUnitPriceVnd || 0);
  if (directVnd > 0) return directVnd / usdToVndRateForRow(row);
  const raw = Number(String(row.updatedPrice ?? "").replace(/,/g, ""));
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return raw > 1000 ? raw / usdToVndRateForRow(row) : raw;
}
// @end-legacy-unit 1640

// @legacy-unit 1641 20379
export function historyUnitPriceUsdForDecision(row) {
  const directUsd = Number(row.historyUnitPriceUsd || row.unitPriceUsd || 0);
  if (directUsd > 0) return directUsd;
  const directVnd = Number(row.historyUnitPriceVnd || 0);
  if (directVnd > 0) return directVnd / usdToVndRateForRow(row);
  const raw = Number(String(row.unitPrice ?? "").replace(/,/g, ""));
  if (Number.isFinite(raw) && raw > 0) return raw > 1000 ? raw / usdToVndRateForRow(row) : raw;
  const rowName = normalize(row.name);
  const rowSpec = normalize(userVisibleItemDetail(row) || itemDetail(row));
  const candidate = purchaseRecords
    .filter((record) => normalize(record.name) === rowName && normalize(userVisibleItemDetail(record) || itemDetail(record)) === rowSpec)
    .map((record) => ({
      price: Number(String(record.unitPrice || record.unitPriceVnd || "").replace(/,/g, "")),
      time: new Date(record.poIssuedAt || record.completedAt || record.updatedAt || record.createdAt || 0).getTime() || 0,
    }))
    .filter((record) => record.price > 0)
    .sort((left, right) => right.time - left.time)[0];
  if (!candidate) return 0;
  return candidate.price > 1000 ? candidate.price / usdToVndRateForRow(row) : candidate.price;
}
// @end-legacy-unit 1641

// @legacy-unit 1642 20400
export function isTemporaryBudgetRequest(row) {
  return row.requestType === "Temporary Budget Request" || row.temporaryBudgetRequest === true;
}
// @end-legacy-unit 1642

// @legacy-unit 1643 20404
export function hasReusableHistoryPrice(row) {
  return historyUnitPriceUsdForDecision(row) > 0;
}
// @end-legacy-unit 1643

// @legacy-unit 1644 20408
export function isNewItemQuotePreApproval(row) {
  return Boolean(row?.quoteBeforeApprovalRequired)
    || row?.requestType === "New Item Request"
    || isMaterialNoPending(row)
    || !hasReusableHistoryPrice(row);
}
// @end-legacy-unit 1644

// @legacy-unit 1645 20415
export function isHighHistoryQuoteReview(row) {
  return row?.priceDecisionStatus === PRICE_HIGH_HISTORY_REVIEW || row?.quoteChoiceRequired === true;
}
// @end-legacy-unit 1645

// @legacy-unit 1646 20419
export function isRequesterQuoteConfirmationRequired(row) {
  return row?.priceDecisionStatus === PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED
    || row?.quoteBeforeApprovalRequired === true;
}
// @end-legacy-unit 1646

// @legacy-unit 1647 20424
export function priceDecisionForRow(row) {
  const mod = priceDecisionModule();
  const category = mod.classifyPriceThresholdCategory?.(row) || "Need Classification";
  const comparison = mod.compareQuoteToHistory?.({
    category,
    quoteUnitPriceUsd: quoteUnitPriceUsdForDecision(row),
    historyUnitPriceUsd: historyUnitPriceUsdForDecision(row),
    thresholds: adminApprovalSetup.thresholds,
    isTemporaryBudget: isTemporaryBudgetRequest(row),
    isNewItemRequest: row.requestType === "New Item Request" || isMaterialNoPending(row),
  }) || {
    status: PRICE_ESCALATION_REQUIRED,
    category,
    quoteUnitPrice: quoteUnitPriceUsdForDecision(row),
    historyUnitPrice: historyUnitPriceUsdForDecision(row),
    thresholdUsd: 0.4,
    deltaUsd: null,
    variancePercent: null,
    reason: "Price decision helper unavailable",
  };
  return {
    ...comparison,
    status: [
      PRICE_AUTO_CLEARED,
      PRICE_HIGH_HISTORY_REVIEW,
      PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
    ].includes(comparison.status) ? comparison.status : PRICE_ESCALATION_REQUIRED,
  };
}
// @end-legacy-unit 1647

// @legacy-unit 1648 20454
export function estimateUnitPriceUsdForVariance(row) {
  const directUsd = Number(row.estimatedUnitPriceUsd || 0);
  if (directUsd > 0) return directUsd;
  const directVnd = Number(row.estimatedUnitPriceVnd || row.estimatedUnitPrice || 0);
  if (directVnd > 0) return directVnd / usdToVndRateForRow(row);
  const amountUsd = Number(row.estimatedAmountUsd || 0)
    || (Number(row.estimatedAmountVnd || row.estimatedAmount || 0) ? Number(row.estimatedAmountVnd || row.estimatedAmount || 0) / usdToVndRateForRow(row) : 0);
  const qty = totalQty(row);
  return amountUsd > 0 && qty > 0 ? amountUsd / qty : 0;
}
// @end-legacy-unit 1648

// @legacy-unit 1649 20465
export function estimateVarianceForRow(row) {
  const mod = priceDecisionModule();
  return mod.compareEstimateToQuote?.({
    estimateUnitPriceUsd: estimateUnitPriceUsdForVariance(row),
    quoteUnitPriceUsd: quoteUnitPriceUsdForDecision(row),
    qty: totalQty(row),
    percentThreshold: 20,
    amountThresholdUsd: 0.4,
  }) || {
    status: "Within Estimate Range",
    estimateUnitPrice: estimateUnitPriceUsdForVariance(row),
    quoteUnitPrice: quoteUnitPriceUsdForDecision(row),
    deltaUsd: null,
    deltaPercent: null,
    totalDeltaUsd: null,
    alert: false,
    reason: "Estimate variance helper unavailable",
  };
}
// @end-legacy-unit 1649

// @legacy-unit 1650 20485
export function estimateVariancePatch(row, now = new Date().toISOString()) {
  const variance = estimateVarianceForRow(row);
  return {
    estimateVarianceStatus: variance.status,
    estimateVarianceAlert: Boolean(variance.alert),
    estimateUnitPriceSnapshotUsd: variance.estimateUnitPrice || 0,
    quoteUnitPriceSnapshotUsd: variance.quoteUnitPrice || 0,
    estimateDeltaUsd: variance.deltaUsd,
    estimateDeltaPercent: variance.deltaPercent,
    estimateTotalDeltaUsd: variance.totalDeltaUsd,
    estimateVarianceReason: variance.reason,
    estimateVarianceAt: now,
  };
}
// @end-legacy-unit 1650

// @legacy-unit 1651 20500
export function priceDecisionPatch(row, now = new Date().toISOString(), { deferRouting = false } = {}) {
  const decision = priceDecisionForRow(row);
  const basePatch = {
    ...estimateVariancePatch(row, now),
    priceDecisionStatus: decision.status,
    priceApprovalStatus: decision.status === PRICE_AUTO_CLEARED ? PRICE_AUTO_CLEARED : PRICE_ESCALATION_PENDING_DRI,
    priceThresholdCategory: decision.category,
    historyUnitPrice: decision.historyUnitPrice || 0,
    quoteUnitPrice: decision.quoteUnitPrice || 0,
    historyUnitPriceUsd: decision.historyUnitPrice || 0,
    quoteUnitPriceUsd: decision.quoteUnitPrice || 0,
    priceDeltaUsd: decision.deltaUsd,
    priceThresholdUsd: decision.thresholdUsd || 0.4,
    priceVariancePercent: decision.variancePercent,
    priceDecisionReason: decision.reason,
    exchangeRateMonth: budgetApprovedExchangeRateMonth(row),
    priceDecisionAt: now,
    priceDecisionBy: roleProfiles[currentRole]?.name || "OM Purchasing",
    priceApprovalChain: adminApprovalSetup.approvalChain.join(" -> "),
  };
  if (decision.status === PRICE_HIGH_HISTORY_REVIEW) {
    return {
      ...basePatch,
      priceDecisionStatus: PRICE_HIGH_HISTORY_REVIEW,
      priceApprovalStatus: PRICE_HIGH_HISTORY_REVIEW,
      priceDecisionReason: decision.reason,
      priceThresholdUsd: decision.thresholdUsd,
      priceThresholdUnitPriceUsd: decision.thresholdUnitPriceUsd,
      priceMultiplierThreshold: decision.multiplierThreshold,
      priceDeltaUsd: decision.deltaUsd,
      quoteUnitPriceSnapshotUsd: decision.quoteUnitPrice,
      historyUnitPriceSnapshotUsd: decision.historyUnitPrice,
      quoteChoiceRequired: true,
      quoteChoiceStatus: "Pending OM Decision",
      quoteChoiceRequestedAt: now,
      omStatus: PRICE_HIGH_HISTORY_REVIEW,
      omStage: "pasResult",
      userAQuoteDecisionStatus: "",
      userAQuoteDecisionAt: "",
      userAQuoteDecisionBy: "",
    };
  }
  if (decision.status === PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED) {
    return {
      ...basePatch,
      priceDecisionStatus: PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
      priceApprovalStatus: PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
      priceDecisionReason: decision.reason,
      priceThresholdUsd: 0,
      priceThresholdUnitPriceUsd: null,
      priceMultiplierThreshold: decision.multiplierThreshold,
      priceDeltaUsd: decision.deltaUsd,
      quoteUnitPriceSnapshotUsd: decision.quoteUnitPrice,
      historyUnitPriceSnapshotUsd: decision.historyUnitPrice,
      quoteBeforeApprovalRequired: true,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
      sentToUserAAt: now,
      omStatus: OM_WAITING_USER_CONFIRM,
      omStage: "userConfirm",
      userAQuoteDecisionStatus: OM_WAITING_USER_CONFIRM,
      userAQuoteDecisionAt: "",
      userAQuoteDecisionBy: "",
      userAQuoteCancelReason: "",
    };
  }
  if (deferRouting) {
    return {
      ...basePatch,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  if (decision.status === PRICE_AUTO_CLEARED) {
    return {
      ...basePatch,
      omStage: "finalExport",
      omStatus: PRICE_AUTO_CLEARED,
      userAQuoteDecisionStatus: USER_CONFIRMATION_NOT_REQUIRED,
      userAQuoteDecisionAt: now,
      userAQuoteDecisionBy: "System threshold rule",
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  return {
    ...basePatch,
    omStage: "priceReview",
    omStatus: PRICE_ESCALATION_REQUIRED,
    quoteReadyAt: row.quoteReadyAt || now,
    quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
  };
}
// @end-legacy-unit 1651

// @legacy-unit 1652 20594
export function postUserAQuoteConfirmationRoutePatch(row, now = new Date().toISOString()) {
  if (row.priceDecisionStatus === PRICE_ESCALATION_REQUIRED || row.priceApprovalStatus === PRICE_ESCALATION_PENDING_DRI) {
    return {
      omStage: "priceReview",
      omStatus: PRICE_ESCALATION_REQUIRED,
      priceApprovalStatus: row.priceApprovalStatus || PRICE_ESCALATION_PENDING_DRI,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  if (row.priceDecisionStatus === PRICE_AUTO_CLEARED || row.priceApprovalStatus === PRICE_AUTO_CLEARED) {
    return {
      omStage: "finalExport",
      omStatus: PRICE_AUTO_CLEARED,
      quoteReadyAt: row.quoteReadyAt || now,
      quoteCompletionReadyAt: row.quoteCompletionReadyAt || now,
    };
  }
  return priceDecisionPatch(row, now);
}
// @end-legacy-unit 1652
