const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const approvalQuantityModule = fs.readFileSync("app-modules/approval-quantity-review.js", "utf8");

test("Dept DRI renders item switcher, project dashboard, and unchanged detail matrix", () => {
  assert.match(html, /id="priceReviewInlineAnalysis"/);
  assert.match(html, /id="priceReviewApprovedAnalysis"/);
  assert.match(app, /priceReviewTabs:\s*\["pending", "history"\]/);
  assert.match(app, /pending:\s*"Dept Review"/);
  assert.match(app, /pending:\s*"Budget Review"/);
  assert.match(html, /Project Context/);
  assert.doesNotMatch(html, /Project Review Evidence/);
  assert.match(app, /Item Switcher/);
  assert.doesNotMatch(html, /Project Item Matrix Overview/);
  assert.doesNotMatch(html, /Item Unit Matrix/);
  assert.match(html, />Dashboard</);
  assert.match(html, /Single project all-items MFG \/ Non-MFG dashboard/);
  assert.match(html, /id="priceReviewPendingHeader"/);
  assert.match(html, /data-approval-quantity-tab="mfg"/);
  assert.match(html, /data-approval-quantity-tab="nonMfg"/);
  assert.match(html, /data-approval-quantity-tab="dashboard"/);
  assert.match(html, /MFG Station Detail/);
  assert.match(html, /Non-MFG Department Detail/);
  assert.match(html, /id="priceReviewInlineDemandCostTable"/);
  assert.match(app, /priceReviewTabs: \["pending", "history"\]/);
  assert.match(app, /function renderPriceReviewCostDashboard/);
  assert.match(app, /function approvalQuantityMatrixRows/);
  assert.doesNotMatch(app, /function renderProjectItemMatrixOverview/);
  assert.match(app, /function renderPriceReviewItemUnitMatrix/);
  assert.match(app, /renderDashboardParts/);
  assert.match(app, /approvalQuantityMatrixRows\(dashboardSourceRows\)/);
  assert.match(app, /function projectContextSwitcherHtml/);
  assert.match(app, /selectedPriceReviewProjectContext/);
  assert.match(app, /selectedManagerProjectContext/);
  assert.match(app, /data-project-context-project/);
  assert.match(styles, /\.project-context-switcher/);
  assert.match(app, /currencyDisplay/);
  assert.match(approvalQuantityModule, /data-manager-demand-cost-request-id/);
  assert.match(approvalQuantityModule, /data-approval-dashboard-unit/);
  assert.match(app, /function renderPriceReviewStationMatrix/);
  assert.match(app, /function renderManagerDemandCostDashboard/);
  assert.match(app, /function renderManagerQuantityMatrix/);
  assert.match(app, /function reviewStatusForRole/);
  assert.match(app, /function roleReviewRows/);
  assert.match(app, /<th>Review Status<\/th>/);
  assert.match(app, /reviewStatusCellHtml/);
  assert.match(approvalQuantityModule, /<th>Review Status<\/th>/);
  assert.match(approvalQuantityModule, /reviewStatusHtml/);
  assert.match(approvalQuantityModule, /reviewStatusFallback/);
  assert.doesNotMatch(app, /Project Status/);
  assert.doesNotMatch(approvalQuantityModule, /Project Status/);
  assert.match(app, /data-item-quantity-request/);
  assert.match(app, /<th>Request ID<\/th>/);
  assert.match(app, /demand-cost-col-request/);
  assert.match(app, /managerQuantityGroupKey\(row\)[\s\S]*row\.id/);
  assert.match(app, /function openItemQuantityReview/);
  assert.match(app, /function itemQuantityReviewScopeForClick/);
  assert.match(app, /activeItemQuantityReview = nextScope/);
  assert.match(app, /function saveItemQuantityReviewDirectEdit/);
  assert.match(app, /scope: activeItemQuantityReview/);
  assert.match(app, /function isPriceReviewInlineAnalysisRole/);
  assert.match(app, /currentRole === "dri"/);
  assert.match(app, /function approvedRowsForRole/);
  assert.match(app, /function priceReviewProjectRowsForRole/);
  assert.match(app, /function renderApprovedEvidenceAnalysis/);
  assert.match(app, /function renderPriceReviewInlineAnalysis/);
  assert.match(app, /renderPriceReviewItemUnitMatrix\(\{\s*mode:\s*"inline"/);
  assert.match(app, /const visible = isPriceReviewInlineAnalysisRole\(\) && currentPriceReviewTab === "pending"/);
  assert.match(app, /setApprovalQuantityDetailTabForUnit/);
  assert.match(app, /currentRole === "dri"[\s\S]*Item Switcher/);
  assert.match(app, /workspace\.hidden = false/);
  assert.doesNotMatch(app, /workspace\.hidden = isDeptDriPendingReview/);
  assert.doesNotMatch(app, /workspace\.innerHTML = ""/);
  assert.match(app, /function currentRequesterDepartment/);
  assert.match(app, /function normalizeRequestDemandDepartment/);
  assert.match(app, /department: demandDepartment/);
  assert.match(app, /requesterDept: row\.requesterDept \|\| demandDepartment/);
  assert.match(app, /demandDepartment: row\.demandDepartment \|\| demandDepartment/);
  assert.match(app, /item-quantity-compact-summary/);
  assert.match(styles, /\[hidden\]\s*\{[\s\S]*display:\s*none\s*!important/);
  assert.doesNotMatch(app, /function renderApprovalQuantityReviewWorkspace/);
  assert.match(html, /approval-quantity-review\.js/);
});

test("Dept DRI pending analysis hides empty matrix until a detail tab is active", () => {
  const inlineAnalysis = html.slice(
    html.indexOf('id="priceReviewInlineAnalysis"'),
    html.indexOf('data-price-review-panel="projectReview"')
  );
  const approvedAnalysis = html.slice(
    html.indexOf('id="priceReviewApprovedAnalysis"'),
    html.indexOf('data-price-review-panel="history"')
  );
  assert.doesNotMatch(inlineAnalysis, /priceReviewInlineDemandCostCarryoverCompare/);
  assert.doesNotMatch(inlineAnalysis, /priceReviewInlineDemandCostLineCompare/);
  assert.doesNotMatch(inlineAnalysis, /priceReviewInlineDemandCostCarryoverLedger/);
  assert.doesNotMatch(inlineAnalysis, /priceReviewInlineQuantityCarryoverLedger/);
  assert.doesNotMatch(inlineAnalysis, /Quantity Detail Matrix/);
  assert.match(inlineAnalysis, /id="priceReviewInlineQuantityTitle">MFG Station Detail/);
  assert.match(inlineAnalysis, /id="priceReviewInlineQuantityHelper"/);
  assert.match(inlineAnalysis, /priceReviewInlineQuantityMatrixTable/);
  assert.match(app, /panel\.hidden = approvalQuantityReviewTab === "dashboard"/);
  assert.match(app, /function priceReviewDetailScopeForTab/);
  assert.match(app, /All Non-MFG departments/);
  assert.match(app, /demandUnit:\s*desired === "MFG" \? ""/);
  assert.match(app, /row\.demandUnit && normalizeQuantityDashboardUnit\(row\.demandUnit\) !== "MFG"/);
  assert.match(app, /station:\s*demandType === DEMAND_TYPE_MFG/);
  assert.match(app, /demandUnit:\s*demandType === DEMAND_TYPE_MFG \? "" : demandUnitFor\(entry\)/);
  assert.match(app, /"Demand Unit":\s*"Non-MFG Department"/);
  assert.match(app, /Mainline:\s*"MFG Mainline Station"/);
  assert.match(app, /approvalQuantityReviewTab = "dashboard"/);
  assert.match(app, /function approvalPipelineStatus/);
  assert.match(app, /data-approval-pipeline-status/);
  assert.match(app, /Approval \/ Pipeline Detail/);
  assert.doesNotMatch(approvedAnalysis, /Carryover Ledger|Line Carryover Impact|Confirmed Carryover Saving/);
  assert.match(app, /openItemQuantityReview/);
  assert.match(app, /itemQuantityReviewExcelRow/);
  assert.match(app, /save_direct_edit/);
  assert.match(app, /beforeQty <= 0 && afterQty > 0 \? "add" : afterQty <= 0 \? "delete" : "edit"/);
  assert.match(app, /clearNodeContent\("managerDemandCostCarryoverCompare", "managerDemandCostLineCompare", "managerDemandCostCarryoverLedger"\)/);
});

test("Horizontal table navigator uses evidence-specific navigation language", () => {
  const navigator = fs.readFileSync("app-modules/horizontal-table-navigator.js", "utf8");
  assert.match(navigator, /Previous columns/);
  assert.match(navigator, /Next columns/);
  assert.match(navigator, /Scrollable columns/);
  assert.doesNotMatch(navigator, />Left</);
  assert.doesNotMatch(navigator, />Right</);
  assert.doesNotMatch(navigator, /Wide Table/);
});

test("Shared total highlight contract is applied from common renderers", () => {
  assert.match(app, /shared-total-highlight/);
  assert.match(app, /demand-cost-total-head shared-total-highlight/);
  assert.match(app, /demand-cost-total-cell shared-total-highlight/);
  assert.match(app, /quantity-total-head/);
  assert.match(app, /quantity-total-cell/);
  assert.match(styles, /\.shared-total-highlight/);
  assert.match(styles, /\.shared-total-highlight--head/);
  assert.match(styles, /\.shared-total-highlight--cell/);
});
