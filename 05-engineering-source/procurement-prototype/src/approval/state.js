// approval/state: authoritative source; see docs/module-map.md.
import {
  DEMAND_TYPE_MFG
} from "../projects/config.js";

// @legacy-unit 234 1242
export let currentDemandAnalysisTab;
export function initializeCurrentDemandAnalysisTabBinding() {
  currentDemandAnalysisTab = "costDashboard";
}
// @end-legacy-unit 234

// @legacy-unit 235 1243
export let selectedManagerQuantityKeyId;
export function initializeSelectedManagerQuantityKeyIdBinding() {
  selectedManagerQuantityKeyId = "";
}
// @end-legacy-unit 235

// @legacy-unit 236 1244
export let expandedManagerQuantityRows;
export function initializeExpandedManagerQuantityRowsBinding() {
  expandedManagerQuantityRows = new Set();
}
// @end-legacy-unit 236

// @legacy-unit 280 1288
export let priceReviewAnalysisRowsOverride;
export function initializePriceReviewAnalysisRowsOverrideBinding() {
  priceReviewAnalysisRowsOverride = null;
}
// @end-legacy-unit 280

// @legacy-unit 289 1297
export let selectedManagerRequestId;
export function initializeSelectedManagerRequestIdBinding() {
  selectedManagerRequestId = null;
}
// @end-legacy-unit 289

// @legacy-unit 290 1298
export let selectedManagerAuthorizedRequestId;
export function initializeSelectedManagerAuthorizedRequestIdBinding() {
  selectedManagerAuthorizedRequestId = null;
}
// @end-legacy-unit 290

// @legacy-unit 291 1299
export let selectedPriceReviewRequestId;
export function initializeSelectedPriceReviewRequestIdBinding() {
  selectedPriceReviewRequestId = null;
}
// @end-legacy-unit 291

// @legacy-unit 292 1300
export let selectedManagerProjectContext;
export function initializeSelectedManagerProjectContextBinding() {
  selectedManagerProjectContext = "";
}
// @end-legacy-unit 292

// @legacy-unit 293 1301
export let selectedPriceReviewProjectContext;
export function initializeSelectedPriceReviewProjectContextBinding() {
  selectedPriceReviewProjectContext = "";
}
// @end-legacy-unit 293

// @legacy-unit 294 1302
export let shouldScrollPriceReviewInlineAnalysis;
export function initializeShouldScrollPriceReviewInlineAnalysisBinding() {
  shouldScrollPriceReviewInlineAnalysis = false;
}
// @end-legacy-unit 294

// @legacy-unit 295 1303
export let activeItemQuantityReview;
export function initializeActiveItemQuantityReviewBinding() {
  activeItemQuantityReview = null;
}
// @end-legacy-unit 295

// @legacy-unit 296 1304
export let approvalQuantityReviewMode;
export function initializeApprovalQuantityReviewModeBinding() {
  approvalQuantityReviewMode = DEMAND_TYPE_MFG;
}
// @end-legacy-unit 296

// @legacy-unit 297 1305
export let approvalQuantityReviewTab;
export function initializeApprovalQuantityReviewTabBinding() {
  approvalQuantityReviewTab = "dashboard";
}
// @end-legacy-unit 297

// @legacy-unit 308 1316
export let approvalViewportState;
export function initializeApprovalViewportStateBinding() {
  approvalViewportState = { manager: null, priceReview: null };
}
// @end-legacy-unit 308

export function replacePriceReviewAnalysisRowsOverrideBinding(value) { priceReviewAnalysisRowsOverride = value; return value; }

export function replaceApprovalQuantityReviewModeBinding(value) { approvalQuantityReviewMode = value; return value; }

export function replaceApprovalQuantityReviewTabBinding(value) { approvalQuantityReviewTab = value; return value; }

export function replaceSelectedManagerQuantityKeyIdBinding(value) { selectedManagerQuantityKeyId = value; return value; }

export function replaceSelectedManagerProjectContextBinding(value) { selectedManagerProjectContext = value; return value; }

export function replaceSelectedPriceReviewProjectContextBinding(value) { selectedPriceReviewProjectContext = value; return value; }

export function replaceSelectedManagerRequestIdBinding(value) { selectedManagerRequestId = value; return value; }

export function replaceSelectedPriceReviewRequestIdBinding(value) { selectedPriceReviewRequestId = value; return value; }

export function replaceShouldScrollPriceReviewInlineAnalysisBinding(value) { shouldScrollPriceReviewInlineAnalysis = value; return value; }

export function replaceCurrentDemandAnalysisTabBinding(value) { currentDemandAnalysisTab = value; return value; }

export function replaceActiveItemQuantityReviewBinding(value) { activeItemQuantityReview = value; return value; }

export function replaceSelectedManagerAuthorizedRequestIdBinding(value) { selectedManagerAuthorizedRequestId = value; return value; }
