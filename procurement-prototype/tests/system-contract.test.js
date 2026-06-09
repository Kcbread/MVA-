const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const workflowStatusModule = fs.readFileSync("app-modules/workflow-status.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const server = fs.existsSync("server.js") ? fs.readFileSync("server.js", "utf8") : "";
const schema = fs.existsSync("db/schema.sql") ? fs.readFileSync("db/schema.sql", "utf8") : "";

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  assert.notEqual(startIndex, -1, `Missing start marker: ${start}`);
  const endIndex = source.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `Missing end marker: ${end}`);
  return source.slice(startIndex, endIndex);
}

test("Cost Manager top-level tabs are consolidated", () => {
  const managerView = between(html, '<section class="view" data-view="manager">', '<section class="view" data-view="procurement">');
  assert.match(managerView, /data-manager-tab="review">Submission Monitor</);
  assert.match(managerView, /data-manager-tab="analysis">Demand Analysis</);
  assert.match(managerView, /data-manager-tab="demand">Progress Tracking</);
  assert.match(managerView, /data-manager-tab="setup">Project Setup</);
  assert.doesNotMatch(managerView, /data-manager-tab="history"/);
  assert.match(managerView, /<h3>Requester Submission Monitor<\/h3>/);
  assert.match(managerView, /<h3>Dept DRI Decision History<\/h3>/);
  assert.match(managerView, /Dept DRI Decision/);
  assert.doesNotMatch(managerView, /data-manager-row-decision/);
  assert.doesNotMatch(managerView, /manager-reject-input/);
});

test("Cost Manager progress tracking is owner and aging based, not PR PO percentage based", () => {
  const managerView = between(html, '<section class="view" data-view="manager">', '<section class="view" data-view="procurement">');
  const progressPanel = between(managerView, 'data-manager-panel="demand"', 'data-manager-panel="setup"');
  ["Submitted / Received Date", "Pending Owner", "Current Stage", "Days Pending"].forEach((label) => {
    assert.match(progressPanel, new RegExp(label.replace("/", "\\/")));
  });
  ["Budget Progress", "PR Progress", "PO Progress", "Arrived Progress", "Delivery Status", "Key Dates"].forEach((label) => {
    assert.doesNotMatch(progressPanel, new RegExp(label));
  });
  const progressRenderer = between(app, "function renderManagerStageTracking", "function managerQuantitySourceRows");
  ["Waiting Dept DRI", "Waiting Budget", "Waiting OM", "Waiting PAS", "Waiting Requester", "Buyer Handoff", "Over SLA", "Expired Quote"].forEach((label) => {
    assert.match(progressRenderer, new RegExp(label.replace("/", "\\/")));
  });
  assert.doesNotMatch(progressRenderer, /Downstream/);
  ["Budget Done", "PR Done", "PO Done"].forEach((label) => {
    assert.doesNotMatch(progressRenderer, new RegExp(label));
  });
  assert.doesNotMatch(progressRenderer, /managerProgressCell\(row\.budgetDone/);
  assert.doesNotMatch(progressRenderer, /managerProgressCell\(row\.prDone/);
  assert.doesNotMatch(progressRenderer, /managerProgressCell\(row\.poDone/);
  assert.match(app, /function managerProgressPendingOwnerForRow/);
  assert.match(app, /function managerProgressPendingOwnerForGroup/);
  assert.match(app, /function managerProgressCurrentStageForGroup/);
  assert.match(app, /function managerProgressAgingCell/);
  assert.match(app, /function managerProgressNextActionForGroup/);
  assert.match(html, /app-modules\/workflow-status\.js/);
  assert.match(app, /function workflowStatusForRow/);
  assert.match(app, /function workflowStatusForGroup/);
  const progressDetail = between(app, "function openManagerProgressDetail", "function renderManagerStageSummary");
  ["Pending Owner", "Current Stage", "Days Pending", "Quote Status", "Next Action"].forEach((label) => {
    assert.match(progressDetail, new RegExp(label));
  });
  ["PR #", "PO #", "Budget / Package Code", "Delivery Action"].forEach((label) => {
    assert.doesNotMatch(progressDetail, new RegExp(label.replace("/", "\\/")));
  });
});

test("Manager Demand Analysis starts with Excel Dashboard-like item x unit cost dashboard", () => {
  const analysis = between(html, 'data-manager-panel="analysis"', 'data-manager-panel="demand"');
  assert.match(analysis, /data-demand-analysis-tab="costDashboard">Cost Dashboard</);
  assert.match(analysis, /data-demand-analysis-tab="quantity">Station Matrix</);
  assert.match(analysis, /class="[^"]*demand-cost-table[^"]*"/);
  assert.match(analysis, /id="managerDemandCostLineCount"/);
  assert.match(analysis, /id="managerDemandCostUnitSummary"/);
  assert.match(analysis, /id="managerDemandCostCarryoverCompare"/);
  assert.match(analysis, /id="managerDemandCostLineCompare"/);
  assert.match(analysis, /id="managerDemandCostCarryoverLedger"/);
  assert.match(analysis, /<option value="">All stages<\/option>/);
  assert.doesNotMatch(analysis, /id="managerDemandCostSummary"/);
  const stationMatrixPanel = between(analysis, 'data-demand-analysis-panel="quantity"', '</section>');
  assert.match(stationMatrixPanel, /managerQuantityMatrixTable/);
  assert.match(stationMatrixPanel, /id="managerQuantityCarryoverLedger"/);
  assert.doesNotMatch(stationMatrixPanel, /Unit Split Dashboard/);
  assert.doesNotMatch(stationMatrixPanel, /managerQuantitySummary/);
  assert.doesNotMatch(stationMatrixPanel, /managerQuantityUnitDashboard/);
  assert.match(app, /function renderManagerDemandCostHead/);
  assert.match(app, /function renderManagerDemandCostUnitSummary/);
  assert.match(app, /function renderManagerDemandCostCarryoverCompare/);
  assert.match(app, /function renderManagerDemandCostLineCompare/);
  assert.match(app, /function renderManagerCarryoverLedger/);
  assert.match(app, /function managerDemandCostCellImpact/);
  assert.match(app, /function renderManagerDemandCostValue/);
  assert.match(app, /function renderManagerQuantityMatrix/);
  assert.match(app, /function renderManagerQuantityHead/);
  assert.match(app, /function managerCarryoverIsApplied/);
  assert.match(app, /function managerCarryoverStatusBucket/);
  assert.match(app, /function managerCarryoverPhaseKey/);
  assert.match(app, /function syncManagerQuantityScopeFromDemandCost/);
  assert.match(app, /procurement:carryover-updated/);
  assert.match(app, /Flow: \$\{impact\.flowLabels\.join/);
  assert.doesNotMatch(app, /<tr class="demand-cost-total-row">/);
  assert.match(app, /Department \/ Unit Cost by Selected Phase/);
  assert.match(app, /demand-cost-unit-head/);
  assert.match(app, /Original Cost/);
  assert.match(app, /Carryover Saving/);
  assert.match(app, /Effective Cost/);
  assert.doesNotMatch(app, /<span>Saving %<\/span>/);
  assert.match(app, /Line Carryover Impact/);
  assert.match(app, /Cost Saving/);
  assert.match(app, /Needs DRI/);
  assert.match(app, /Moved Items/);
  assert.match(app, /managerCarryoverMovedItemsSummary/);
  assert.match(app, /line-compare-moved-item/);
  assert.doesNotMatch(app, /Line Original/);
  assert.doesNotMatch(app, /Line Effective/);
  assert.doesNotMatch(app, /qty before carryover/);
  assert.doesNotMatch(app, /qty after carryover/);
  assert.match(app, /saved-badge/);
  assert.match(app, /demand-cost-cell-main/);
  assert.match(app, /demand-cost-cell-sub/);
  assert.match(app, /carryover-cell-applied/);
  assert.match(app, /carryover-cell-pending/);
  assert.match(styles, /\.line-compare-strip/);
  assert.match(styles, /\.line-compare-card\.moved/);
  assert.match(styles, /\.line-compare-moved-list/);
  assert.match(styles, /\.carryover-cell-applied/);
  assert.match(styles, /\.demand-cost-cell-sub/);
  assert.match(app, /formatCompactCurrencyFromVnd/);
  assert.match(styles, /width:\s*108px/);
  ["ENG Name", "CN-ENG Name", "VN Name", "Price", "MFG", "FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"].forEach((label) => {
    assert.match(app, new RegExp(label.replace(".", "\\.")));
  });
  ["Highest Unit", "Highest Item", "Highest Phase"].forEach((label) => {
    assert.doesNotMatch(app, new RegExp(label));
  });
});

test("Contacts are topbar popup only, not a top-level view", () => {
  const nav = between(html, '<nav class="tabs" aria-label="Main navigation">', "</nav>");
  assert.doesNotMatch(nav, /data-view="contacts"/);
  assert.doesNotMatch(html, /<section class="view" data-view="contacts"/);
  assert.match(html, /data-action="openContactPopup"/);
  assert.match(html, /id="contactPopupModal"/);
  assert.doesNotMatch(app, /function ensureContactsTab/);
  assert.doesNotMatch(app, /function ensureContactsSection/);
  assert.doesNotMatch(app, /function renderContacts/);
  assert.doesNotMatch(app, /setView\("contacts"\)/);
});

test("UAT feedback triage owners are limited to Admin and OM Leader in UI fallback", () => {
  const patchOwner = between(app, "async function patchUatFeedbackOwner", "function omTabLabel");
  assert.match(patchOwner, /uatFeedbackTriageOwners\(\)\.find/);
  assert.match(patchOwner, /Feedback owner must be Admin or OM Leader/);
  const ownerHelper = between(app, "function uatFeedbackTriageOwners", "function omTabLabel");
  assert.match(ownerHelper, /\["admin", "omLeader"\]\.includes\(user\.role\)/);
  assert.match(ownerHelper, /user\.role === "omLeader"/);
  const ownerOptions = between(app, "function uatFeedbackOwnerOptions", "function renderUatFeedbackReview");
  assert.match(ownerOptions, /uatFeedbackTriageOwners\(\)\.forEach/);
  assert.doesNotMatch(ownerOptions, /omAssignees\.forEach/);
  assert.match(server, /Feedback owner must be Admin or OM Leader/);
});

test("Requester workspace uses MFG / Non-MFG Excel worksheet input", () => {
  const departmentView = between(html, '<section class="view active" data-view="department">', '<section class="view" data-view="manager">');
  const opmTabs = between(departmentView, '<div class="inner-tabs" aria-label="Requester workspace sections">', "</div>");
  assert.match(opmTabs, /Request Workspace/);
  assert.match(opmTabs, /Warehouse Inventory/);
  assert.match(opmTabs, /Action Required/);
  assert.match(opmTabs, /Request Status/);
  assert.match(departmentView, /request-workspace-layout/);
  assert.match(departmentView, /Request Worksheet/);
  assert.match(departmentView, /data-request-worksheet-tab="MFG"/);
  assert.match(departmentView, /data-request-worksheet-tab="Non-MFG"/);
  assert.match(departmentView, /id="requestInputContextBar"/);
  assert.match(departmentView, /data-action="openRequestItemPicker"/);
  assert.match(departmentView, />Add Item</);
  assert.match(html, /id="requestItemPickerModal"/);
  assert.match(html, /id="requestItemPickerQuery"/);
  assert.match(html, /id="requestItemPickerLevel1"/);
  assert.match(html, /id="requestItemPickerLevel2"/);
  assert.match(html, /id="requestItemPickerLevel3"/);
  assert.match(html, /data-request-picker-source-tab="catalog"/);
  assert.match(html, /data-request-picker-source-tab="reuse"/);
  assert.match(html, /data-request-picker-source-tab="copy"/);
  assert.match(html, /data-request-picker-source-tab="new"/);
  const pickerModal = between(html, '<div class="modal-backdrop" id="requestItemPickerModal"', '<div class="modal-backdrop" id="contactPopupModal"');
  assert.match(pickerModal, /<th class="picker-col-add">Add<\/th>/);
  assert.match(pickerModal, /<th class="picker-col-item">Item<\/th>/);
  assert.match(pickerModal, /<th class="picker-col-detail">Detail<\/th>/);
  assert.match(pickerModal, /<th class="picker-col-spec">Spec<\/th>/);
  assert.match(pickerModal, /<th class="picker-col-action">Action<\/th>/);
  assert.match(pickerModal, /id="requestCopyDemandPanel"/);
  assert.match(pickerModal, /id="historyPackageSourceProject"/);
  assert.match(pickerModal, /id="historyPackageSourcePhase"/);
  assert.match(pickerModal, /id="historyPackageSourcePackage"/);
  assert.match(pickerModal, /id="historyPackagePreviewCount"/);
  assert.match(pickerModal, /data-action="importHistoryPackage"/);
  assert.match(pickerModal, /<tbody id="historyPackageRows"><\/tbody>/);
  assert.match(pickerModal, /history-package-table/);
  assert.match(pickerModal, /Source Qty/);
  assert.doesNotMatch(pickerModal, /<th[^>]*>Source<\/th>/);
  assert.doesNotMatch(pickerModal, /Phase Trace/);
  assert.doesNotMatch(pickerModal, /PAS Material No/);
  assert.doesNotMatch(pickerModal, /Factory Material No/);
  assert.doesNotMatch(pickerModal, /Vendor Part No/);
  assert.doesNotMatch(pickerModal, /Supplier/);
  assert.doesNotMatch(pickerModal, /OM Assignee/);
  assert.doesNotMatch(pickerModal, /\bFTV\b/);
  assert.match(departmentView, /id="requestPackageNeedDate"/);
  assert.match(departmentView, /data-action="saveRequesterDraft"/);
  assert.match(departmentView, /data-action="submitRequests"/);
  assert.match(departmentView, /id="requestWorksheetHead"/);
  assert.match(departmentView, /<tbody id="requestRows"><\/tbody>/);
  assert.match(departmentView, /Estimate Variance/);
  assert.match(html, /id="materialEntryStructuredSpec"/);
  assert.match(html, /id="materialEntryUom"/);
  assert.match(html, /id="materialEntryEstimateReason"/);
  assert.match(html, /id="materialEntryDuplicateDifference"/);
  assert.match(html, /id="materialEntryEvidenceReference"/);
  assert.doesNotMatch(departmentView, /id="requestSourcePanel"/);
  assert.doesNotMatch(departmentView, /Source Panel/);
  assert.doesNotMatch(departmentView, /Demand Matrix/);
  assert.doesNotMatch(departmentView, /Demand source modes/);
  assert.doesNotMatch(departmentView, /Selected Matrix Rows/);
  assert.doesNotMatch(departmentView, /id="itemPickerModal"/);
  assert.doesNotMatch(departmentView, /id="requestWorksheetSearch"/);
  assert.doesNotMatch(departmentView, /id="requestWorksheetSourceSelect"/);
  assert.doesNotMatch(departmentView, /id="requestWorksheetAddPhase"/);
  assert.doesNotMatch(departmentView, /Add Demand Lines/);

  assert.match(app, /let requestWorksheetMode = DEMAND_TYPE_MFG/);
  assert.match(app, /function requestWorksheetColumns/);
  assert.match(app, /function requestWorksheetMergedSources/);
  assert.match(app, /function requestItemPickerSources/);
  assert.match(app, /let requestItemPickerLevel1 = ""/);
  assert.match(app, /let requestItemPickerLevel2 = ""/);
  assert.match(app, /let requestItemPickerLevel3 = ""/);
  assert.match(app, /function requestItemPickerLevelValues/);
  assert.match(app, /function requestItemPickerMatchesLevels/);
  assert.match(app, /function syncRequestItemPickerFilters/);
  assert.match(app, /row\.omCategoryLevel1/);
  assert.match(app, /row\.omCategoryLevel2/);
  assert.match(app, /row\.omCategoryLevel3/);
  assert.match(app, /function renderRequestItemPicker/);
  assert.match(app, /function renderHistoryPackageRows/);
  assert.match(app, /function importHistoryPackage/);
  assert.match(app, /requestItemPickerSourceMode === "copy"/);
  assert.match(app, /closeRequestItemPicker\(\)/);
  assert.match(app, /function addWorksheetRow/);
  assert.match(app, /function updateRequestWorksheetQty/);
  assert.match(app, /data-request-worksheet-qty/);
  assert.match(app, /data-request-worksheet-phase/);
  assert.match(app, /data-request-worksheet-column/);
  assert.match(app, /data-request-worksheet-remove/);
  assert.match(app, /data-request-worksheet-tab/);
  assert.match(app, /data-add-worksheet-source/);
  assert.match(app, /requestWorksheetSourceBadge/);
  assert.match(app, /New Item Request from worksheet/);
  assert.match(app, /itemMasterRequestStatus:\s*"Pending Material Review"/);
  assert.match(app, /function materialDuplicateCandidateRows/);
  assert.match(app, /function estimateVarianceDisplayRows/);
  assert.match(app, /detailSection\("Estimate vs PAS Quote", estimateVarianceRows\)/);
  assert.match(app, /compareEstimateToQuote/);
  assert.match(app, /const phases = STAGES/);
  assert.match(app, /requesterPackageRows\(\)/);
  assert.doesNotMatch(app, /requestContextDemandType/);
  assert.doesNotMatch(app, /requestContextStation/);
  assert.doesNotMatch(pickerModal, /vendor/i);
  assert.doesNotMatch(pickerModal, /supplier/i);
  assert.doesNotMatch(pickerModal, /PAS material no/i);
  assert.doesNotMatch(pickerModal, /factory material no/i);
  assert.doesNotMatch(pickerModal, /OM assignee/i);
  assert.doesNotMatch(pickerModal, /FTV/i);

  const requestWorksheetHeadRenderer = between(app, "function renderRequestWorksheetHead", "function requestInputContextKey");
  ["Item / Spec", "Row Total", "Hint", "Action"].forEach((label) => {
    assert.match(requestWorksheetHeadRenderer, new RegExp(label.replace("/", "\\/")));
  });
  assert.doesNotMatch(requestWorksheetHeadRenderer, /<th class="request-col-phase">Phase<\/th>/);
  assert.match(requestWorksheetHeadRenderer, /requestWorksheetColumns\(\)/);
  assert.match(requestWorksheetHeadRenderer, /STAGES\.map/);
  assert.match(requestWorksheetHeadRenderer, /STAGE_LABELS\[stage\]/);
  assert.match(requestWorksheetHeadRenderer, /colspan="\$\{phaseColspan\}"/);

  ["CG", "BG", "FATP", "Test", "Hybrid", "Auto", "ENG Pack", "Zombie", "Laser_pico", "Rework", "Repair", "WH"].forEach((label) => {
    assert.match(app, new RegExp(label.replace("/", "\\/")));
  });
  ["FATP TE", "FATP IQC", "FATP PQE", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"].forEach((label) => {
    assert.match(app, new RegExp(label.replace("/", "\\/")));
  });

  assert.doesNotMatch(departmentView, /PAS material no/i);
  assert.doesNotMatch(departmentView, /factory material no/i);
  assert.doesNotMatch(departmentView, /vendor/i);
  assert.match(styles, /\.request-worksheet-table[\s\S]*min-width:\s*6900px/);
  assert.match(styles, /\.request-worksheet-shell[\s\S]*border:/);
  assert.match(styles, /\.request-source-badge/);
  assert.match(styles, /\.request-item-picker-card/);
  assert.match(styles, /\.request-item-picker-card[\s\S]*width:\s*min\(1360px,\s*calc\(100vw - 24px\)\)/);
  assert.match(styles, /\.request-item-picker-filterbar/);
  assert.match(styles, /\.request-picker-detail-cell/);
  assert.match(styles, /\.request-picker-spec-cell \.spec-summary[\s\S]*-webkit-line-clamp:\s*3/);
  assert.match(styles, /\.request-phase-group-head/);
  assert.match(styles, /\.request-phase-group-head[\s\S]*text-align:\s*center !important/);
  assert.match(styles, /\.request-sticky-col[\s\S]*background:\s*#fff !important/);
  assert.match(styles, /\.request-sticky-col[\s\S]*background-color:\s*#fff !important/);
  assert.match(styles, /\.request-sticky-col[\s\S]*overflow:\s*hidden/);
  assert.match(styles, /\.request-sticky-col[\s\S]*z-index:\s*8/);
  assert.match(styles, /\.request-item-spec-stack/);
  assert.match(styles, /\.request-spec-divider/);
  assert.match(styles, /\.request-item-spec-stack \.request-spec-summary[\s\S]*-webkit-line-clamp:\s*2/);

  const clickHandler = between(app, 'document.addEventListener("click"', 'document.addEventListener("change"');
  assert.match(clickHandler, /if \(removeWorksheetButton\) \{[\s\S]*removeRequest\(removeWorksheetButton\.dataset\.requestWorksheetRemove\);[\s\S]*\}/);
  assert.match(clickHandler, /if \(removeButton\) \{[\s\S]*showConfirm/);

  assert.match(app, /function renderWarehouseMaintenance/);
  assert.match(app, /function warehouseInventoryRows/);
  assert.match(app, /function warehouseInventoryLedger/);
  assert.match(app, /function warehouseOwnerForTransaction/);
  assert.match(app, /function createWarehouseUseCandidate/);
});

test("Requester item owner and Non-MFG unit rules are explicit", () => {
  assert.match(app, /function isOmOwnedItem/);
  assert.match(app, /function itemOwnerFor/);
  assert.match(app, /function itemOwnerBadgeHtml/);
  ["pda", "data collector", "數據採集器", "zebra", "qr code", "barcode", "monitor", "ipc"].forEach((keyword) => {
    assert.match(app, new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  });
  ["keyboard", "mouse", "hp printer", "scanner stand", "barcode print head", "server", "network", "software"].forEach((keyword) => {
    assert.match(app, new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  });
  const omCatalogRows = between(app, "function omCatalogRows", "function isOmCatalogRow");
  assert.match(omCatalogRows, /\.filter\(isOmOwnedItem\)/);
  const demandUnitHelper = between(app, "function demandUnitOptionsHtml", "function stationBreakdownPhaseKey");
  assert.match(demandUnitHelper, /DEMAND_UNIT_OPTIONS/);
  const draftDemandScopeCell = between(app, "function draftDemandScopeCell", "function requestSourceTraceCell");
  assert.match(draftDemandScopeCell, /<select class="request-unit-select"/);
  assert.doesNotMatch(draftDemandScopeCell, /data-request-demand-unit[^]*<input/);
});

test("Reuse history import carries item identity only and resets target qty", () => {
  const cloneReusableDemandRows = between(app, "function cloneReusableDemandRows", "function reusableReferenceFields");
  assert.match(cloneReusableDemandRows, /phase:\s*targetPhase/);
  assert.match(cloneReusableDemandRows, /demandType\s*=\s*lastDemandType/);
  assert.match(cloneReusableDemandRows, /station\s*=\s*itemPickerStation/);
  assert.match(cloneReusableDemandRows, /demandUnit\s*=\s*itemPickerDemandUnit/);
  assert.doesNotMatch(cloneReusableDemandRows, /phase:\s*stationBreakdownPhaseKey\(item\)\s*\|\|\s*targetPhase/);
  const requestFromRecord = between(app, "function requestFromRecord", "function suggestionToRecord");
  assert.match(requestFromRecord, /const draft = \{/);
  assert.match(requestFromRecord, /return syncRowPhaseQtyFromStationBreakdown\(draft\)/);
  const phaseQtySummary = between(app, "function phaseQtySummary", "function historyPackageKey");
  assert.match(phaseQtySummary, /stationBreakdownPhaseTotal\(row,\s*stage\)/);
  assert.match(app, /historyRequestOverrides\(row,\s*false,\s*context\)/);
  assert.match(app, /Source quantity kept as reference only/);
  assert.match(app, /Qty starts at 0/);
  const reusableReferenceFields = between(app, "function reusableReferenceFields", "function historyRequestOverrides");
  assert.match(reusableReferenceFields, /const sourceLine = sourceLineForHistory\(record\)/);
  assert.match(reusableReferenceFields, /sourceLine,/);
});

test("Reuse by Item history rows keep requester-safe source, item, and spec in separate columns", () => {
  const renderHistoryRows = between(app, "function renderHistoryRows", "function omUserQuoteDecisionLabel");
  assert.match(renderHistoryRows, /history-source-project/);
  assert.doesNotMatch(renderHistoryRows, /history-po-no/);
  assert.doesNotMatch(renderHistoryRows, /history-material-no/);
  assert.match(renderHistoryRows, /history-item-name/);
  assert.match(renderHistoryRows, /history-spec/);
  assert.match(renderHistoryRows, /\$\{row\.project \|\| "-"\}/);
  assert.doesNotMatch(renderHistoryRows, /\$\{factoryMaterialNoFor\(row\) \|\| "Factory material no pending"\}/);
  assert.match(renderHistoryRows, /<td colspan="6" class="empty-cell">/);
  assert.match(app, /function addHistoryRecord\(recordId,\s*useSourceQty = false\)/);
  assert.match(app, /Quantity starts at 0/);
});

test("Cost calculation uses USD canonical with VND display conversion", () => {
  assert.match(app, /function amountUsdFromVnd/);
  assert.match(app, /function amountVndFromUsd/);
  assert.match(app, /function formatMoneyFromUsd/);
  assert.match(app, /function formatMoneyFromVnd/);
  assert.match(app, /function legacyPriceToUsd/);
  assert.match(app, /function formatCompactCurrencyFromUsd/);
  assert.match(app, /function managerQuantityPriceCandidate/);
  assert.match(app, /unitPriceUsd/);
  assert.match(app, /updatedPriceUsd/);
  assert.match(app, /estimatedUnitPriceUsd/);
  assert.match(app, /estimatedAmountUsd/);
  assert.match(app, /function effectiveUnitPrice\(row\) \{\s*return legacyPriceToUsd\(row, "updatedPrice"\) \|\| legacyPriceToUsd\(row, "unitPrice"\);/);
  assert.match(app, /timestampPatch\.updatedPriceUsd = normalizedValue/);
  assert.match(app, /timestampPatch\.updatedPriceVnd = clampQty\(value\)/);
  assert.match(app, /formatCompactCurrencyFromUsd\(managerDemandCostAmount/);
});

test("Shared table and button layout standard is enforced", () => {
  assert.match(styles, /\.table-shell/);
  assert.match(styles, /\.table-fixed/);
  assert.match(styles, /\.cell-text/);
  assert.match(styles, /\.cell-spec/);
  assert.match(styles, /\.cell-number/);
  assert.match(styles, /\.cell-action/);
  assert.match(styles, /\.cell-timeline/);
  assert.match(styles, /\.form-table/);
  assert.match(styles, /\.dense-dashboard-table/);
  assert.match(styles, /\.workflow-table/);
  assert.match(styles, /\.matrix-table/);

  const departmentView = between(html, '<section class="view active" data-view="department">', '<section class="view" data-view="manager">');
  assert.match(departmentView, /table-shell form-table-shell/);
  assert.match(departmentView, /data-table table-fixed form-table matrix-table request-table request-worksheet-table/);
  assert.match(departmentView, /data-layout-managed="manual"/);
  assert.doesNotMatch(departmentView, /data-table table-fixed form-table search-table/);
  assert.doesNotMatch(departmentView, /history-item-table/);

  const analysis = between(html, 'data-manager-panel="analysis"', 'data-manager-panel="demand"');
  assert.match(analysis, /table-wrap table-shell demand-cost-wrap/);
  assert.match(analysis, /data-table table-fixed dense-dashboard-table demand-cost-table/);

  assert.doesNotMatch(app, />Add Item to Request<\/button>/);
  assert.doesNotMatch(app, /data-edit-demand="[^"]*"[^>]*>Edit Demand<\/button>/);
  assert.match(app, /class="[^"]*cell-action/);
  assert.match(app, /class="[^"]*cell-spec/);
  assert.match(app, /class="cell-timeline"/);
  assert.match(app, /cell-spec-clamp/);
  assert.match(app, /data-add-worksheet-source/);
});

test("v1.3 layout contract prevents recurring table and button regressions", () => {
  const departmentView = between(html, '<section class="view active" data-view="department">', '<section class="view" data-view="manager">');
  assert.match(styles, /v1\.3 final layout authority/);
  assert.match(styles, /v2\.0 adaptive operation layout authority/);
  assert.match(styles, /body\s*\{[\s\S]*overflow-x:\s*hidden/);
  assert.match(styles, /\.request-workspace-layout\s*\{[\s\S]*display:\s*block/);
  assert.match(styles, /\.request-worksheet-table\.matrix-table[\s\S]*min-width:\s*6900px !important/);
  assert.match(styles, /\.request-worksheet-commandbar/);
  assert.match(styles, /\.request-source-badge/);
  assert.doesNotMatch(departmentView, /requestSourcePanel/);
  assert.match(styles, /\.carryover-suggestions-panel/);
  assert.match(styles, /\.carryover-suggestion-card/);
  assert.doesNotMatch(departmentView, /previousLineRows/);
  assert.match(styles, /\.request-item-picker-table/);
  assert.match(styles, /\.cell-action[\s\S]*width:\s*76px !important/);
  assert.match(styles, /\.demand-cost-table[\s\S]*width:\s*max-content/);
  assert.match(styles, /\.demand-cost-table[\s\S]*min-width:\s*1720px/);
  assert.match(styles, /\.demand-cost-cell-btn[\s\S]*text-overflow:\s*clip/);
  assert.match(styles, /\.om-rate-utility[\s\S]*width:\s*max-content/);
  assert.match(styles, /\.om-rate-utility \.om-rate-save[\s\S]*min-width:\s*72px !important/);
  assert.match(styles, /\.request-matrix-input[\s\S]*width:\s*64px/);
  const requestWorksheetHeadRenderer = between(app, "function renderRequestWorksheetHead", "function requestInputContextKey");
  assert.match(requestWorksheetHeadRenderer, /request-col-actions/);
  assert.match(requestWorksheetHeadRenderer, /request-col-hint/);
  assert.doesNotMatch(requestWorksheetHeadRenderer, /request-col-detail/);
  assert.match(styles, /\.request-col-actions[\s\S]*width:\s*118px/);
  assert.doesNotMatch(styles, /\.request-table th:nth-child\(10\)/);
  assert.match(styles, /\.demand-editor-table th:last-child[\s\S]*position:\s*sticky\s*!important/);
  assert.match(styles, /\.demand-cost-wrap,[\s\S]*?\.quantity-matrix-wrap,[\s\S]*?overflow-x:\s*auto/);
  assert.match(styles, /@media \(max-width:\s*1100px\)/);
  assert.match(styles, /@media \(max-width:\s*760px\)/);
  assert.doesNotMatch(app, />Add Item to Request<\/button>/);
  assert.doesNotMatch(app, />Edit Demand<\/button>/);
  assert.ok(fs.existsSync("tests/layout-smoke.js"));
  const layoutSmoke = fs.readFileSync("tests/layout-smoke.js", "utf8");
  assert.match(layoutSmoke, /assertNoPageOverflow/);
  assert.match(layoutSmoke, /assertButtonsStayInsideCells/);
  assert.match(layoutSmoke, /assertVisibleTableCellsDoNotOverlap/);
  assert.match(layoutSmoke, /Responsive \$\{viewport\.label\} requester worksheet/);
  assert.match(layoutSmoke, /width:\s*760/);
  const testScript = fs.readFileSync("test.sh", "utf8");
  assert.match(testScript, /tests\/layout-smoke\.js/);
  assert.match(testScript, /Layout smoke skipped: Playwright is not installed/);
});

test("Need Date and DRI price review layer are wired", () => {
  const priceReviewRequiresBudgetApprover = between(app, "function priceReviewRequiresBudgetApprover", "function priceReviewPendingOwner");
  const priceReviewPendingRowsForRole = between(app, "function priceReviewPendingRowsForRole", "function priceReviewHistoryRows");
  const applyPriceReviewDecision = between(app, "function applyPriceReviewDecision", "function roleOptionsHtml");
	  const isPriceReviewReworkRequired = between(app, "function isPriceReviewReworkRequired", "function canOmAskUserAAmend");
	  const isOmRejectReworkRequired = between(app, "function isOmRejectReworkRequired", "function canOmAskUserAAmend");
	  const needConfirmationRows = between(app, "function needConfirmationRows", "function userQuoteAmountLabel");
	  const renderNeedConfirmationRows = between(app, "function renderNeedConfirmationRows", "function compactTimestamp");

  assert.match(html, /Employee ID \/ Account/);
  assert.match(html, /id="loginAccountInput"/);
  assert.match(html, /value="123"/);
  assert.match(html, /requester-responsibility-data\.js/);
  assert.match(app, /function findRequesterPersonaByIdentifier/);
  assert.match(app, /REQUESTER_RESPONSIBILITY_MASTER/);
  const loginForm = between(html, '<form class="login-card" id="loginForm">', "</form>");
  assert.match(loginForm, /<option value="requester">Requester<\/option>[\s\S]*<option value="dri">Dept DRI<\/option>[\s\S]*<option value="omLeader">OM Leader \(Mai\)<\/option>[\s\S]*<option value="omMember">OM Purchasing \(Giang \/ Linh\)<\/option>/);
  assert.match(loginForm, /<option value="projectDri">Budget Approver<\/option>/);
  assert.match(loginForm, /<option value="buyer">Buyer Handoff<\/option>/);
  assert.match(loginForm, /<option value="admin">Admin<\/option>/);
  assert.doesNotMatch(loginForm, /MFG Coordinator|Sourcing|Buyer PR \/ PO|Project DRI|User A/);
  assert.doesNotMatch(html, /Manager B/);
  assert.doesNotMatch(app, /Manager B/);
  assert.doesNotMatch(server, /Manager B/);
  assert.match(html, /<option value="requester">Requester<\/option>/);
  assert.doesNotMatch(html, /<option value="requester">OPM \/ DRI Requester<\/option>/);
  assert.match(html, /<option value="dri">Dept DRI<\/option>/);
  assert.match(html, /<option value="projectDri">Budget Approver<\/option>/);
  assert.match(html, /data-view="priceReview"/);
  assert.match(html, /Pending Price Review/);
  assert.match(html, /Review History/);
  assert.match(html, /data-view="adminSetup"/);
  assert.match(html, /Access & Approval Setup/);
  assert.match(html, /History Price Delta Threshold \(USD\)/);
  assert.doesNotMatch(html, /Computer Threshold %/);
  assert.doesNotMatch(html, /MFG Threshold %/);
  assert.match(app, /Need Date is required/);
  assert.match(app, /requestPackageNeedDate/);
  assert.match(app, /requestPackageNeedDateValue/);
  assert.match(app, /function renderPriceReview/);
  assert.match(app, /function applyPriceReviewDecision/);
  assert.match(app, /function priceReviewRequiresBudgetApprover/);
  assert.match(app, /DEPT_DRI_SUBMISSION_PENDING/);
  assert.match(app, /function isDeptDriSubmissionPending/);
  assert.match(app, /function omLeaderIntakeRoutingPatch/);
  assert.match(app, /Submitted to Dept DRI/);
  assert.doesNotMatch(app, /Dept DRI approved\. Row moved to OM Leader Export Package queue/);
  assert.doesNotMatch(app, /Dept DRI approved\. Row moved to OM Export Package queue/);
  assert.match(app, /Waiting Budget Approver/);
  assert.match(app, /function saveAdminApprovalSetup/);
  assert.match(app, /PRICE_AUTO_CLEARED/);
  assert.match(app, /PRICE_ESCALATION_REQUIRED/);
  assert.match(app, /USER_CONFIRMATION_NOT_REQUIRED/);
  assert.match(app, /Auto cleared by threshold/);
  assert.match(app, /Price escalation required/);

  assert.match(priceReviewRequiresBudgetApprover, /row\?\.priceDecisionStatus === PRICE_ESCALATION_REQUIRED/);
  assert.match(priceReviewRequiresBudgetApprover, /isTemporaryBudgetRequest\(row\)/);
  assert.doesNotMatch(priceReviewRequiresBudgetApprover, /^\s*return\s+isTemporaryBudgetRequest\(row\);\s*$/m);
  assert.match(app, /COST_MANAGER_AUTH_PENDING/);
  assert.match(app, /function applyCostManagerAuthorization/);
  assert.match(app, /data-cost-manager-authorization/);
  assert.match(app, /Dept DRI approved\. Waiting Cost Manager authorization/);
  assert.match(priceReviewPendingRowsForRole, /currentRole === "dri"[\s\S]*isDeptDriSubmissionPending\(row\)/);
  assert.match(priceReviewPendingRowsForRole, /if \(currentRole === "projectDri"\) return priceReviewRequiresBudgetApprover\(row\) && Boolean\(row\.driApprovedAt\) && !row\.projectDriApprovedAt;/);
  assert.match(priceReviewPendingRowsForRole, /return false;/);
  assert.doesNotMatch(priceReviewPendingRowsForRole, /currentRole === "admin"/);
  assert.match(applyPriceReviewDecision, /currentRole === "admin"/);
  assert.match(applyPriceReviewDecision, /Admin manages setup only and cannot approve business price reviews/);
  assert.match(applyPriceReviewDecision, /priceReviewReworkRequired:\s*true/);
  assert.match(applyPriceReviewDecision, /Price escalation rejected\. Row returned to Requester Action Required/);
	  assert.match(isPriceReviewReworkRequired, /Boolean\(row\?\.priceReviewReworkRequired\)/);
	  assert.match(isPriceReviewReworkRequired, /row\.priceApprovalStatus === PRICE_ESCALATION_REJECTED/);
	  assert.match(isPriceReviewReworkRequired, /row\.priceDecisionStatus === PRICE_ESCALATION_REJECTED/);
	  assert.match(isOmRejectReworkRequired, /omRejectReworkRequired/);
	  assert.match(isOmRejectReworkRequired, /OM_REJECTED_TO_DRI/);
	  assert.match(needConfirmationRows, /isPriceReviewReworkRequired\(row\)/);
	  assert.match(needConfirmationRows, /isOmRejectReworkRequired\(row\)/);
	  assert.match(renderNeedConfirmationRows, /Price \/ Budget Review Rejected/);
	  assert.match(renderNeedConfirmationRows, /OM Rework Required/);
	});

test("OM tabs and PAS quote result contract are consolidated", () => {
  const omView = between(html, '<section class="view" data-view="om">', '<section class="view" data-view="buyer">');
  assert.match(omView, /Submission Dashboard/);
  assert.match(omView, /PAS Demand No/);
  assert.match(omView, /PAS Quote Result/);
  assert.match(omView, /Export Package/);
  assert.match(omView, /OM UAT Feedback/);
  assert.match(omView, /data-action="openPageFeedback"/);
  assert.doesNotMatch(omView, /data-om-tab="uatFeedback"/);
  assert.doesNotMatch(omView, /data-om-panel="uatFeedback"/);
  assert.match(omView, /data-om-tab="quoteExpiry"/);
  assert.match(omView, /data-om-panel="quoteExpiry"/);
  assert.match(omView, /Quote Expiry Monitor/);
  assert.match(omView, /class="mini approve om-rate-save"/);
  assert.match(omView, /om-rate-utility/);
  assert.match(styles, /\.om-rate-grid \.om-rate-save/);
  assert.match(styles, /min-width:\s*84px/);
  assert.match(omView, /Submitted \/ Received Date/);
  assert.match(omView, /Pending Owner/);
  assert.match(omView, /Days Pending/);
  const omSubmissionTable = between(omView, 'id="omSubmissionTable"', '</table>');
  assert.doesNotMatch(omSubmissionTable, /<th>Quote Status<\/th>/);
  assert.doesNotMatch(omSubmissionTable, /<th>Estimated ETA<\/th>/);
  assert.doesNotMatch(omSubmissionTable, /<th>Next Action<\/th>/);
  assert.doesNotMatch(omSubmissionTable, /<th>Buyer Days<\/th>/);
  assert.doesNotMatch(app, /function omEtaCell/);
  assert.doesNotMatch(app, /function omNextActionCell/);
  assert.doesNotMatch(app, /function omBuyerDaysCell/);
  assert.match(app, /function omPendingOwnerHelper/);
  assert.doesNotMatch(omView, /<th>Budget Progress<\/th>/);
  assert.doesNotMatch(omView, /<th>PR Progress<\/th>/);
  assert.doesNotMatch(omView, /<th>PO Progress<\/th>/);
  assert.doesNotMatch(omView, /<th>Arrived Progress<\/th>/);
  assert.doesNotMatch(omView, /<th>Key Dates<\/th>/);
  assert.match(app, /function omPendingOwnerForRow/);
  assert.match(app, /function omQuoteStatusForRow/);
  assert.match(app, /function isOmExportAuthorized/);
  assert.match(app, /Only Requester confirmed or price-cleared rows can be prepared/);
  assert.match(workflowStatusModule, /return "Buyer Handoff"/);
  assert.match(workflowStatusModule, /Buyer owns PR \/ PO after OM export/);
  assert.match(app, /workflowStatusForRow\(row, "om"\)\.pendingOwner/);
  assert.doesNotMatch(between(app, "function omNextActionForGroup", "function renderOmSubmissionExpiryMonitor"), /Downstream/);
  const pasDemandTable = between(omView, 'data-om-panel="pasRequest"', 'data-om-panel="quoteConfirm"');
  assert.match(pasDemandTable, /om-pas-demand-table/);
  assert.match(pasDemandTable, /<th>CPD-IEP Owner<\/th>/);
  assert.match(pasDemandTable, /<th>Assigned To<\/th>/);
  assert.match(pasDemandTable, /<th>PAS Demand No<\/th>/);
  assert.doesNotMatch(pasDemandTable, /<th>Item Context<\/th>/);
  assert.doesNotMatch(pasDemandTable, /<th>Level 2 \/ Level 3<\/th>/);
  assert.match(app, /function pasDemandNoEntryHtml/);
  assert.match(app, /data-om-field="pasDemandNo"/);
  assert.match(app, /Enter PAS Demand No first/);
  assert.match(app, /updateOmField\(requestId, "pasDemandNo", typedDemandNo\)/);
  const quoteTable = between(omView, 'data-om-panel="quoteConfirm"', 'data-om-panel="quoteExpiry"');
  assert.match(quoteTable, /om-quote-result-table/);
  assert.match(quoteTable, /om-quote-col-project/);
  assert.match(quoteTable, /om-quote-col-material/);
  assert.match(quoteTable, /om-quote-col-actions/);
  [
    "Project",
    "Phase",
    "Item / Spec",
    "Qty",
    "PAS Demand No",
    "PAS Material No",
    "Vendor",
    "Vendor Code",
    "Unit Price",
    "Currency",
    "Quote Date",
    "Valid Until",
    "Files",
    "Completion / Missing",
    "Assigned To",
    "Actions",
    "Detail",
  ].forEach((label) => assert.match(quoteTable, new RegExp(`<th>${label.replace("/", "\\/")}<\\/th>`)));
  assert.match(quoteTable, /<th>Assigned To<\/th>/);
  assert.doesNotMatch(quoteTable, /<th>PAS Tracking<\/th>/);
  assert.doesNotMatch(quoteTable, /<th>Quote Result<\/th>/);
  assert.doesNotMatch(quoteTable, /<th>Quote Validity<\/th>/);
  assert.match(app, /Quote Valid Until/);
  assert.match(app, /Quote Screenshot/);
  assert.match(app, /Vendor Name/);
  assert.match(app, /Vendor Code/);
  assert.match(app, /data-om-price-currency/);
  assert.match(app, /title="Save Quote Info"/);
  assert.match(app, /title="Send to User A"/);
  assert.match(app, /omQuoteResultReadOnlyReason/);
  assert.doesNotMatch(app, /Upload PDF/);
  assert.doesNotMatch(app, /Quote PDF/);
  const quoteExpiryTable = between(omView, 'data-om-panel="quoteExpiry"', 'data-om-panel="finalExport"');
  assert.match(quoteExpiryTable, /<th>Quote Valid Until<\/th>/);
  assert.match(quoteExpiryTable, /<th>Days Left<\/th>/);
  assert.match(quoteExpiryTable, /<th>Expiry Status<\/th>/);
  assert.match(quoteExpiryTable, /<th>Assigned To<\/th>/);
  assert.match(quoteExpiryTable, /<th>Next Action<\/th>/);
  assert.doesNotMatch(quoteExpiryTable, /data-om-field="quoteValidUntil"/);
  assert.doesNotMatch(quoteExpiryTable, /data-om-row-button-action="exportPackage"/);
  assert.match(app, /currentOmTab = "submission"/);
  assert.match(app, /allowedTabs\.has\(tabName\) \? tabName : "submission"/);
  const exportPanel = between(html, 'data-om-panel="finalExport"', '<section class="view" data-view="buyer">');
  assert.match(exportPanel, /<th>Assigned To<\/th>/);
  assert.match(exportPanel, /Cost Type \/ Target/);
  assert.doesNotMatch(app, />Export Excel<\/button>/);
  assert.doesNotMatch(app, />Export Quote PDF Package<\/button>/);
  assert.match(app, /Export Package/);
  assert.match(app, /Expense → ECS \/ Capex → CFA/);
  assert.match(app, /editableMaterialNo: false/);
});

test("UAT feedback is a utility page and row detail action, not an OM workflow tab", () => {
  assert.match(html, /data-view="uatFeedbackReview" data-roles="omLeader omMember admin"/);
  assert.match(html, /data-action="openUatFeedbackReview"/);
  assert.match(html, /My Feedback/);
  assert.match(html, /id="uatFeedbackReviewTitle"/);
  assert.match(html, /id="uatFeedbackReviewHelper"/);
  assert.match(html, /id="uatFeedbackModal"/);
  assert.match(html, /id="uatFeedbackForm"/);
  assert.match(html, /id="uatFeedbackScreenshot"/);
  assert.match(app, /screenshotFileName/);
  assert.match(app, /function createUatFeedback/);
  assert.match(app, /POST", body: payload/);
  assert.match(app, /\/api\/uat-feedback\/my/);
  assert.match(app, /\/api\/uat-feedback"/);
  assert.match(app, /function renderUatFeedbackReview/);
  assert.match(app, /function uatRowFeedbackSection/);
  assert.match(app, /data-uat-row-feedback/);
  assert.match(app, /if \(name === "uatFeedbackReview"\)/);
  assert.match(app, /refreshUatFeedback\(\{ review: isUatFeedbackReviewer\(\), silent: true \}\)/);
  assert.match(app, /isUatFeedbackReviewer/);
  assert.match(app, /My UAT Feedback Status/);
  assert.match(app, /Read Only/);
  const omView = between(html, '<section class="view" data-view="om">', '<section class="view" data-view="uatFeedbackReview">');
  assert.doesNotMatch(omView, /<th>Feedback<\/th>/);
});

test("MySQL API Phase 1 and OM assignment contract are present", () => {
  assert.match(server, /\/api\/login/);
  assert.match(server, /function findUserByIdentifier/);
  assert.match(server, /employee_id/);
  assert.match(server, /Invalid account or password/);
  assert.match(server, /\/api\/logout/);
  assert.match(server, /\/api\/me/);
  assert.match(server, /\/api\/om\/assignees/);
  assert.match(server, /\/api\/om\/assignments/);
  assert.match(server, /api\\\/om\\\/requests\\\/\(\[\^\/\]\+\)\\\/assign/);
  assert.match(server, /mysql2\/promise/);
  assert.match(server, /process\.env\.DB_HOST/);
  assert.match(server, /process\.env\.DB_PORT/);
  assert.match(server, /process\.env\.DB_NAME/);
  assert.match(server, /function loadLocalEnv/);
  assert.match(server, /path\.join\(ROOT, "\.env"\)/);
  assert.match(server, /SESSION_TTL_HOURS/);
  assert.match(server, /mva_procurement_uat/);
  assert.match(server, /om-leader-mai/);
  assert.match(server, /om-member-giang/);
  assert.match(server, /om-member-linh/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS sessions/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS om_assignments/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS uat_feedback/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS attachments/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS audit_events/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS item_master/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS material_identity/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS purchase_route_decisions/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS ftv_code_master/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS ftv_mapping_staging/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS customs_audit_records/);
  assert.match(schema, /route_type VARCHAR\(40\) NOT NULL/);
  assert.match(schema, /quote_owner VARCHAR\(40\) NOT NULL/);
  assert.match(schema, /demand_department VARCHAR\(120\) NOT NULL/);
  assert.match(schema, /UNIQUE KEY uq_ftv_item_department_active \(item_id, demand_department, active_scope_key\)/);
  assert.match(schema, /purchase_route VARCHAR\(40\) NOT NULL/);
  assert.match(fs.readFileSync("app-modules/ftv-code.js", "utf8"), /function ftvAuditKey/);
  assert.match(fs.readFileSync("app-modules/ftv-code.js", "utf8"), /function costAllocationKey/);
  assert.match(fs.readFileSync("app-modules/ftv-code.js", "utf8"), /ROUTE_LOCAL_BUY/);
  assert.match(fs.readFileSync("app-modules/ftv-code.js", "utf8"), /ROUTE_EXTERNAL_IMPORT/);
  assert.match(fs.readFileSync("test.sh", "utf8"), /app-modules\/ftv-code\.js/);
  assert.match(server, /\/api\/uat-feedback/);
  assert.match(server, /\/api\/attachments/);
  assert.match(server, /attachment\.uploaded/);
  assert.match(server, /UPLOAD_ROOT/);
  assert.match(server, /canTriageUatFeedback/);
  assert.match(server, /uat_feedback\.created/);
  assert.match(server, /uat_feedback\.status_updated/);
  assert.match(server, /uat_feedback\.owner_updated/);
  assert.match(app, /function assignOmRow/);
  assert.match(app, /function uploadAttachment/);
  assert.match(app, /screenshotAttachmentId/);
  assert.match(app, /function canOperateOmRow/);
  assert.match(html, /app-modules\/role-guards\.js/);
  assert.match(app, /ProcurementApp\?\.roleGuards\?\.canOperateOmRow/);
  assert.match(fs.readFileSync("app-modules/role-guards.js", "utf8"), /function canOperateOmRow/);
  assert.match(app, /function omAssignmentCell/);
  assert.match(app, /omAssigneeId/);
  assert.match(app, /data-om-assignee-id/);
  assert.doesNotMatch(app, /function canOperateOmRow\(row\) \{\s*if \(!isOmRole\(\)\) return true/);
  assert.match(styles, /\.om-assignment-control/);
  assert.match(styles, /\.om-pas-demand-table col\.om-pas-col-assignee/);
  assert.match(styles, /\.om-final-export-table col\.om-export-col-assignee/);
});

test("User-applied carryover stores VND price even when source row is USD canonical", () => {
  const helper = between(app, "function userCarryoverUnitPriceVnd", "function syncUserAppliedCarryoverLedger");
  assert.match(helper, /legacyPriceToUsd\(row, "updatedPrice"\)/);
  assert.match(helper, /legacyPriceToUsd\(row, "unitPrice"\)/);
  assert.match(helper, /legacyPriceToUsd\(row, "estimatedUnitPrice"\)/);
  assert.match(helper, /Math\.round\(amountVndFromUsd\(unitPriceUsd\)\)/);
  const sync = between(app, "function syncUserAppliedCarryoverLedger", "function renderDemandEditor");
  assert.match(sync, /unitPrice:\s*userCarryoverUnitPriceVnd\(row\)/);
  assert.match(sync, /unitPriceUsd:\s*amountUsdFromVnd\(userCarryoverUnitPriceVnd\(row\)\)/);
  const saving = between(app, "function managerCarryoverCostSaving", "function renderManagerCarryoverLedger");
  assert.match(saving, /row\.unitPriceUsd/);
  assert.match(saving, /amountUsdFromVnd\(clampQty\(row\.unitPrice\)\)/);
});

test("OM submission detail stays within OM ownership and export allows price-cleared rows", () => {
  const omDetail = between(app, "function openOmSubmissionDetail", "function compactList");
  assert.doesNotMatch(omDetail, /Budget Done/);
  assert.doesNotMatch(omDetail, /PR Done/);
  assert.doesNotMatch(omDetail, /PO Done/);
  assert.doesNotMatch(omDetail, /\["Arrived"/);
  assert.doesNotMatch(omDetail, /<th>PR #<\/th>/);
  assert.doesNotMatch(omDetail, /<th>PO #<\/th>/);
  assert.doesNotMatch(omDetail, /ETA \/ DTA/);
  assert.match(omDetail, /PAS Demand/);
  assert.match(omDetail, /Quote Result/);
  assert.match(omDetail, /User Confirm/);
  assert.match(omDetail, /Export Package/);
  const exportAuth = between(app, "function isOmExportAuthorized", "function isOmFinalExportPrepared");
  assert.match(exportAuth, /USER_CONFIRMATION_NOT_REQUIRED/);
  assert.match(exportAuth, /PRICE_AUTO_CLEARED/);
  assert.match(exportAuth, /PRICE_ESCALATION_APPROVED/);
});

test("Temporary budget and quote validity do not use active MutationObserver injection", () => {
  assert.doesNotMatch(app, /new MutationObserver/);
  assert.match(app, /window\.renderRequesterTempBudgetPanel = renderRequesterTempBudgetPanel/);
  assert.match(app, /Quote Valid Until/);
});

test("UI quality review documentation and skill are registered", () => {
  assert.ok(fs.existsSync("_doc/ui-quality-review.zh-TW.md"));
  assert.ok(fs.existsSync("_doc/ui-quality-review.en.md"));
  assert.ok(fs.existsSync("_doc/v0.6.md"));
  const testingZh = fs.readFileSync("_doc/testing-standard-op.zh-TW.md", "utf8");
  const testingEn = fs.readFileSync("_doc/testing-standard-op.en.md", "utf8");
  assert.match(testingZh, /procurement-ui-quality-review/);
  assert.match(testingEn, /procurement-ui-quality-review/);
});
