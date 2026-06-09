const test = require("node:test");
const assert = require("node:assert/strict");

const quote = require("../app-modules/quote-validity.js");
const dashboard = require("../app-modules/demand-cost-dashboard.js");
const priceDecision = require("../app-modules/price-decision.js");
const leadTime = require("../app-modules/lead-time.js");
const workflowStatus = require("../app-modules/workflow-status.js");
const workflowStatusTable = require("../app-modules/workflow-status-table.js");
const ftvCode = require("../app-modules/ftv-code.js");
const roleGuards = require("../app-modules/role-guards.js");

test("quote validity uses 10-day warning threshold", () => {
  const today = new Date("2026-06-01T00:00:00");
  assert.equal(quote.quoteValidity("", today), "Missing Valid Until");
  assert.equal(quote.quoteValidity("2026-05-31", today), "Expired / Requote Required");
  assert.equal(quote.quoteValidity("2026-06-11", today), "Expiring Soon");
  assert.equal(quote.quoteValidity("2026-06-01", today), "Expiring Soon");
  assert.equal(quote.quoteValidity("2026-06-12", today), "Valid");
});

test("currency display converts canonical VND to USD without changing source amount", () => {
  assert.equal(quote.formatCurrencyFromVnd(2550000, { currency: "USD", usdToVndRate: 25500 }), "$100");
  assert.equal(quote.formatCurrencyFromVnd(2550000, { currency: "VND", usdToVndRate: 25500 }), "2,550,000 VND");
});

test("currency display supports compact readable labels for dense dashboards", () => {
  assert.equal(quote.formatCompactCurrencyFromVnd(2600000000, { currency: "VND", usdToVndRate: 25500 }), "2.6B VND");
  assert.equal(quote.formatCompactCurrencyFromVnd(2550000, { currency: "USD", usdToVndRate: 25500 }), "$100");
  assert.equal(quote.formatCompactCurrencyFromVnd(2618800000, { currency: "USD", usdToVndRate: 26188 }), "$100K");
});

test("USD canonical cost helpers display VND and USD without double conversion", () => {
  assert.equal(quote.amountUsdFromVnd(7800000, { usdToVndRate: 26000 }), 300);
  assert.equal(quote.amountVndFromUsd(300, { usdToVndRate: 26000 }), 7800000);
  assert.equal(quote.legacyPriceToUsd({ unitPrice: 7800000 }, "unitPrice", { usdToVndRate: 26000 }), 300);
  assert.equal(quote.legacyPriceToUsd({ unitPriceUsd: 300, unitPrice: 7800000 }, "unitPrice", { usdToVndRate: 26000 }), 300);
  assert.equal(quote.legacyPriceToUsd({ updatedPriceVnd: 7800000 }, "updatedPrice", { usdToVndRate: 26000 }), 300);
  assert.equal(quote.formatCurrencyFromUsd(300, { currency: "USD", usdToVndRate: 26000 }), "$300");
  assert.equal(quote.formatCurrencyFromUsd(300, { currency: "VND", usdToVndRate: 26000 }), "7,800,000 VND");
});

test("OM pending owner follows business blocking owner", () => {
  assert.equal(quote.pendingOwner({}), "OM Purchasing");
  assert.equal(quote.pendingOwner({ pasDemandNo: "AIDB-1" }), "PAS / Bidding");
  assert.equal(quote.pendingOwner({ userAQuoteDecisionStatus: "Waiting User A Confirmation", pasDemandNo: "AIDB-1" }), "Requester");
  assert.equal(quote.pendingOwner({ finalExportStatus: "Exported to CFA" }), "OM Complete");
});

test("workflow status maps core ownership stages across roles", () => {
  assert.equal(workflowStatus.buildWorkflowStatus({ status: "Submitted", submittedAt: "2026-06-01T00:00:00Z" }, { role: "costOwner", today: new Date("2026-06-05T00:00:00Z") }).pendingOwner, "Dept DRI");
  assert.equal(workflowStatus.buildWorkflowStatus({ priceDecisionStatus: "Price Escalation Required", driApprovedAt: "2026-06-02T00:00:00Z" }, { role: "costOwner" }).pendingOwner, "Budget Approver");
  assert.equal(workflowStatus.buildWorkflowStatus({ status: "Approved", sentToOmAt: "2026-06-02T00:00:00Z" }, { role: "om" }).currentStage, "PAS Demand No");
  assert.equal(workflowStatus.buildWorkflowStatus({ pasDemandNo: "AIDB-1" }, { role: "om" }).pendingOwner, "PAS / Bidding");
  assert.equal(workflowStatus.buildWorkflowStatus({ userAQuoteDecisionStatus: "Waiting Requester Confirmation", sentToUserAAt: "2026-06-04T00:00:00Z" }, { role: "requester" }).pendingOwner, "Requester");
  const buyer = workflowStatus.buildWorkflowStatus({ finalExportedAt: "2026-06-03T00:00:00Z" }, { role: "costOwner" });
  assert.equal(buyer.pendingOwner, "Buyer Handoff");
  assert.equal(buyer.currentStage, "Buyer PR / PO");
  assert.equal(buyer.nextAction, "Buyer owns PR / PO after OM export");
});

test("workflow status role visibility hides internal OM fields from requester", () => {
  const requester = workflowStatus.buildWorkflowStatus({}, { role: "requester" }).visibilityFlags;
  assert.equal(requester.showVendor, false);
  assert.equal(requester.showPasMaterial, false);
  assert.equal(requester.showFactoryMaterial, false);
  assert.equal(requester.showOmAssignee, false);
  const om = workflowStatus.buildWorkflowStatus({}, { role: "omLeader" }).visibilityFlags;
  assert.equal(om.showVendor, true);
  assert.equal(om.showPasMaterial, true);
  assert.equal(om.showOmAssignee, true);
});

test("workflow status table hides internal procurement fields from requester", () => {
  const view = workflowStatusTable.rowView({
    project: "P26",
    name: "Mini PC",
    qty: 12,
    vendor: "Hidden Vendor",
    pasMaterialNo: "PAS-MAT-001",
    factoryMaterialNo: "FM-VN-001",
    assignedTo: "Giang",
    status: "Submitted",
    submittedAt: "2026-06-01T00:00:00Z",
  }, { role: "requester", today: new Date("2026-06-05T00:00:00Z") });

  assert.equal(view.view, "requester");
  assert.deepEqual(view.columns.map((column) => column.key), [
    "project",
    "item",
    "qty",
    "submittedAt",
    "currentStage",
    "actionStatus",
    "timeline",
    "detail",
  ]);
  assert.equal(Object.hasOwn(view.values, "vendor"), false);
  assert.equal(Object.hasOwn(view.values, "pasMaterialNo"), false);
  assert.equal(Object.hasOwn(view.values, "factoryMaterialNo"), false);
  assert.equal(Object.hasOwn(view.values, "omAssignee"), false);
  assert.equal(view.values.currentStage, "Dept DRI Review");
});

test("workflow status table gives Cost Manager owner and aging columns", () => {
  const view = workflowStatusTable.rowView({
    project: "OR5",
    name: "Monitor 1",
    qty: 83,
    pasDemandNo: "AIDB-1",
    pasDemandNoRecordedAt: "2026-06-01T00:00:00Z",
  }, { role: "manager", today: new Date("2026-06-05T00:00:00Z") });

  assert.equal(view.role, "costOwner");
  assert.deepEqual(view.columns.map((column) => column.key), [
    "project",
    "item",
    "qty",
    "submittedAt",
    "receivedAt",
    "pendingOwner",
    "currentStage",
    "daysPending",
    "quoteStatus",
    "nextAction",
    "riskReason",
    "detail",
  ]);
  assert.equal(view.values.pendingOwner, "PAS / Bidding");
  assert.equal(view.values.currentStage, "PAS Quote Result");
  assert.equal(view.values.daysPending, 4);
});

test("workflow status table exposes assignment for OM roles", () => {
  const view = workflowStatusTable.rowView({
    project: "P26",
    name: "Barcode Printer",
    qty: 20,
    assignedToName: "Giang",
    status: "Approved",
    sentToOmAt: "2026-06-02T00:00:00Z",
  }, { role: "omMember", today: new Date("2026-06-05T00:00:00Z") });

  assert.equal(view.view, "om");
  assert.equal(view.values.assignment, "Giang");
  assert.deepEqual(view.columns.map((column) => column.key), [
    "project",
    "item",
    "qty",
    "receivedAt",
    "pendingOwner",
    "currentStage",
    "daysPending",
    "assignment",
    "detail",
  ]);
});

test("role guards normalize legacy role names and preserve business ownership", () => {
  assert.equal(roleGuards.normalizeRole("manager"), "costOwner");
  assert.equal(roleGuards.normalizeRole("dri"), "deptDri");
  assert.equal(roleGuards.normalizeRole("projectDri"), "budgetApprover");
  assert.equal(roleGuards.normalizeRole("om"), "omLeader");

  assert.equal(roleGuards.canCreateDemand("requester"), true);
  assert.equal(roleGuards.canCreateDemand("admin"), false);
  assert.equal(roleGuards.canDeptDriReview("dri"), true);
  assert.equal(roleGuards.canDeptDriReview("admin"), false);
  assert.equal(roleGuards.canBudgetApprove("projectDri"), true);
  assert.equal(roleGuards.canBudgetApprove("admin"), false);
  assert.equal(roleGuards.canViewCostAnalytics("manager"), true);
  assert.equal(roleGuards.canViewCostAnalytics("requester"), false);
});

test("role guards separate OM leader controls from assigned member work", () => {
  assert.equal(roleGuards.canAssignOm("omLeader"), true);
  assert.equal(roleGuards.canAssignOm("omMember"), false);
  assert.equal(roleGuards.canMaintainExchangeRate("omLeader"), true);
  assert.equal(roleGuards.canMaintainExchangeRate("omMember"), false);
  assert.equal(roleGuards.canTriageFeedback("omLeader"), true);
  assert.equal(roleGuards.canAdminSetup("admin"), true);
  assert.equal(roleGuards.canAdminSetup("omLeader"), false);

  assert.equal(roleGuards.canOperateOmRow({ role: "omMember", assignment: { assignedToUserId: "giang" }, currentUserId: "giang" }), true);
  assert.equal(roleGuards.canOperateOmRow({ role: "omMember", assignment: { assignedToUserId: "linh" }, currentUserId: "giang" }), false);
  assert.equal(roleGuards.canOperateOmRow({ role: "omLeader", assignment: null, currentUserId: "mai" }), false);
});

test("role guards hide internal procurement fields from requester and cost owner", () => {
  const requester = roleGuards.fieldVisibility("requester");
  assert.equal(requester.showVendor, false);
  assert.equal(requester.showPasMaterial, false);
  assert.equal(requester.showFactoryMaterial, false);
  assert.equal(requester.showOmAssignee, false);

  const costOwner = roleGuards.fieldVisibility("manager");
  assert.equal(costOwner.showCostImpact, true);
  assert.equal(costOwner.showVendor, false);
  assert.equal(costOwner.showBusinessApprovalActions, false);

  const omMember = roleGuards.fieldVisibility("omMember");
  assert.equal(omMember.showVendor, true);
  assert.equal(omMember.showPasMaterial, true);
  assert.equal(omMember.showOmActions, true);
});

test("OM quote status separates reusable quote from waiting and expired quote", () => {
  const today = new Date("2026-06-01T00:00:00");
  assert.equal(quote.omQuoteStatus({ pasDemandNo: "AIDB-1" }, today), "Waiting PAS Reply");
  assert.equal(quote.omQuoteStatus({
    pasDemandNo: "AIDB-1",
    pasMaterialNo: "PAS-MAT-1",
    updatedPrice: 100,
    quoteDate: "2026-05-20",
    quotationPdf: "quote.pdf",
    quoteValidUntil: "2026-06-20",
  }, today), "Reusable Quote");
  assert.equal(quote.omQuoteStatus({
    pasDemandNo: "AIDB-1",
    quoteCompletionReadyAt: "2026-05-20T00:00:00",
    quoteValidUntil: "2026-06-10",
  }, today), "Expiring Soon");
  assert.equal(quote.omQuoteStatus({
    pasDemandNo: "AIDB-1",
    quoteCompletionReadyAt: "2026-05-20T00:00:00",
    quoteValidUntil: "2026-05-31",
  }, today), "Expired / Requote Required");
});

test("demand cost dashboard aggregates item x phase x unit qty and amount", () => {
  const rows = dashboard.aggregateItemUnitRows([
    { project: "P26", item: "Keyboard", spec: "USB", phase: "p10", unit: "MFG", qty: 3, unitPrice: 1000 },
    { project: "P26", item: "Keyboard", spec: "USB", phase: "evt", unit: "ENG1", qty: 2, unitPrice: 1000 },
    { project: "P26", item: "Monitor", spec: "19in", phase: "p10", unit: "FATP TE", qty: 1, unitPrice: 5000 },
  ]);
  assert.equal(rows.length, 2);
  const keyboard = rows.find((row) => row.item === "Keyboard");
  assert.equal(keyboard.unitTotals.MFG, 3);
  assert.equal(keyboard.unitTotals.ENG1, 2);
  assert.equal(keyboard.phaseUnitTotals.p10.MFG, 3);
  assert.equal(keyboard.phaseUnitTotals.evt.ENG1, 2);
  assert.equal(keyboard.qty, 5);
  assert.equal(keyboard.amount, 5000);
});

test("demand cost dashboard exposes phase x unit totals", () => {
  const totals = dashboard.aggregatePhaseUnitTotals([
    { phase: "p10", unit: "MFG", qty: 7 },
    { phase: "p10", unit: "FATP TE", qty: 4 },
    { phase: "mp", unit: "MFG", qty: 2 },
  ]);
  assert.equal(totals.p10.MFG, 7);
  assert.equal(totals.p10["FATP TE"], 4);
  assert.equal(totals.mp.MFG, 2);
});

test("demand cost dashboard calculates selected phase unit cost by line count", () => {
  const totals = dashboard.aggregateSelectedPhaseUnitCost([
    { phase: "p10", unit: "MFG", qty: 3, unitPrice: 100 },
    { phase: "p10", unit: "ENG1", qty: 2, unitPrice: 50 },
    { phase: "mp", unit: "MFG", qty: 9, unitPrice: 100 },
  ], { phase: "p10", lineCount: 2, viewMode: "amount" });
  assert.equal(totals.MFG, 600);
  assert.equal(totals.ENG1, 200);
  assert.equal(totals["FATP TE"], 0);
});

test("demand cost dashboard can return selected phase unit quantities", () => {
  const totals = dashboard.aggregateSelectedPhaseUnitCost([
    { phase: "p10", unit: "MFG", qty: 3, unitPrice: 100 },
    { phase: "p10", unit: "ENG1", qty: 2, unitPrice: 50 },
    { phase: "mp", unit: "MFG", qty: 9, unitPrice: 100 },
  ], { phase: "p10", lineCount: 5, viewMode: "qty" });
  assert.equal(totals.MFG, 3);
  assert.equal(totals.ENG1, 2);
});

test("demand cost dashboard calculates original saving and effective cost from applied carryover", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 10,
    lineCount: 2,
    carryoverQty: 4,
    unitPrice: 300,
    status: "Applied",
  });
  assert.equal(impact.originalQty, 20);
  assert.equal(impact.carryoverQty, 4);
  assert.equal(impact.effectiveQty, 16);
  assert.equal(impact.originalAmount, 6000);
  assert.equal(impact.savingAmount, 1200);
  assert.equal(impact.effectiveAmount, 4800);
});

test("demand cost dashboard line count multiplies original qty only, not carryover qty", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 6,
    lineCount: 3,
    carryoverQty: 5,
    unitPrice: 100,
    status: "Applied",
  });
  assert.equal(impact.originalQty, 18);
  assert.equal(impact.carryoverQty, 5);
  assert.equal(impact.effectiveQty, 13);
  assert.equal(impact.originalAmount, 1800);
  assert.equal(impact.savingAmount, 500);
  assert.equal(impact.effectiveAmount, 1300);
});

test("demand cost dashboard caps applied carryover qty at original qty", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 4,
    lineCount: 2,
    carryoverQty: 99,
    unitPrice: 75,
    status: "Applied",
  });
  assert.equal(impact.originalQty, 8);
  assert.equal(impact.carryoverQty, 8);
  assert.equal(impact.effectiveQty, 0);
  assert.equal(impact.savingAmount, 600);
  assert.equal(impact.effectiveAmount, 0);
});

test("demand cost dashboard treats requester carryover candidate as pending, not effective", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 12,
    lineCount: 1,
    carryoverQty: 5,
    unitPrice: 200,
    status: "Requester Candidate",
  });
  assert.equal(impact.originalQty, 12);
  assert.equal(impact.carryoverQty, 0);
  assert.equal(impact.effectiveQty, 12);
  assert.equal(impact.savingAmount, 0);
});

test("demand cost dashboard does not subtract pending or rejected carryover", () => {
  ["Pending Review", "Pending Dept DRI", "Requester Applied", "User Applied", "Rejected"].forEach((status) => {
    const impact = dashboard.calculateCarryoverCostImpact({
      submittedQty: 10,
      lineCount: 2,
      carryoverQty: 99,
      unitPrice: 300,
      status,
    });
    assert.equal(impact.originalQty, 20);
    assert.equal(impact.carryoverQty, 0);
    assert.equal(impact.effectiveQty, 20);
    assert.equal(impact.originalAmount, 6000);
    assert.equal(impact.savingAmount, 0);
    assert.equal(impact.effectiveAmount, 6000);
  });
});

test("demand cost dashboard keeps amount and qty visible in both view modes", () => {
  assert.deepEqual(dashboard.costQtyDisplayPair({
    viewMode: "amount",
    effectiveQty: 60,
    effectiveAmount: 2900,
  }), { main: 2900, sub: "60 qty" });
  assert.deepEqual(dashboard.costQtyDisplayPair({
    viewMode: "qty",
    effectiveQty: 60,
    effectiveAmount: 2900,
  }), { main: 60, sub: 2900 });
});

test("demand cost dashboard filters carryover rows by exact project scope", () => {
  const rows = [
    { project: "OR5", phase: "p10", item: "Monitor" },
    { project: "OR6", phase: "p10", item: "Monitor" },
    { phase: "p10", item: "Monitor" },
  ];
  assert.deepEqual(dashboard.filterCarryoverRows(rows, { project: "OR5" }), [rows[0]]);
  assert.deepEqual(dashboard.filterCarryoverRows(rows, { project: "OR6" }), [rows[1]]);
});

test("price decision uses rounded USD delta threshold", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 10.4,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_AUTO_CLEARED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 10.41,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "MFG",
    quoteUnitPriceUsd: 10.404,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_AUTO_CLEARED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "MFG",
    quoteUnitPriceUsd: 10.405,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
});

test("price decision requires escalation for no history and temporary budget", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 100,
    historyUnitPriceUsd: 0,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 100,
    historyUnitPriceUsd: 90,
    isTemporaryBudget: true,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
});

test("ETA uses OM approved + base/no bidding/computer lead time", () => {
  const eta = leadTime.estimateEta({
    name: "Mini PC",
    sentToOmAt: "2026-04-10T00:00:00Z",
  }, { today: new Date("2026-06-01T00:00:00Z") });
  assert.equal(eta.startDate, "2026-04-11");
  assert.equal(eta.totalDays, 88);
  assert.equal(eta.estimatedEta, "2026-07-08");
  assert.deepEqual(eta.reasons, ["base 14d", "no bidding +14d", "computer PO ETA +60d"]);
});

test("ETA does not add no-bidding days when valid quote exists", () => {
  const eta = leadTime.estimateEta({
    name: "Fixture",
    sentToOmAt: "2026-04-10T00:00:00Z",
    pasDemandNo: "AIDB-1",
    pasMaterialNo: "PAS-1",
    quoteDate: "2026-04-12",
    quoteValidUntil: "2026-08-01",
    vendor: "Vendor",
  }, { today: new Date("2026-06-01T00:00:00Z") });
  assert.equal(eta.totalDays, 14);
  assert.equal(eta.estimatedEta, "2026-04-25");
});

test("price category classifies computer before MFG station demand", () => {
  assert.equal(priceDecision.classifyPriceThresholdCategory({
    name: "Mini PC",
    stationBreakdown: [{ demandType: "MFG", station: "CG", qty: 1 }],
  }), "Computer");
  assert.equal(priceDecision.classifyPriceThresholdCategory({
    name: "Fixture",
    stationBreakdown: [{ demandType: "MFG", station: "CG", qty: 1 }],
  }), "MFG");
});

test("FTV audit key is department-specific while cost allocation remains request-line specific", () => {
  assert.equal(ftvCode.ftvAuditKey({
    itemId: "ITEM-001",
    demandDepartment: "MFG",
  }), "ITEM-001::MFG");
  assert.equal(ftvCode.ftvAuditKey({
    itemId: "ITEM-001",
    demandDepartment: "ENG1",
  }), "ITEM-001::ENG1");

  const mfgCostKey = ftvCode.costAllocationKey({
    requestLineId: "REQ-001",
    itemId: "ITEM-001",
    demandDepartment: "MFG",
    project: "P26",
    phase: "MP",
    station: "CG",
  });
  const engCostKey = ftvCode.costAllocationKey({
    requestLineId: "REQ-002",
    itemId: "ITEM-001",
    demandDepartment: "ENG1",
    project: "P26",
    phase: "MP",
    demandUnit: "ENG1",
  });
  assert.notEqual(mfgCostKey, engCostKey);
  assert.doesNotMatch(mfgCostKey, /FTV/i);
});

test("FTV route logic keeps local buy out of customs code requirements", () => {
  assert.equal(ftvCode.defaultQuoteOwner({ item: "Mini PC ASUS NUC" }), ftvCode.QUOTE_OWNER_PAS);
  assert.equal(ftvCode.defaultQuoteOwner({ item: "Fixture pallet" }), ftvCode.QUOTE_OWNER_SOURCING);
  assert.equal(ftvCode.ftvStatusForRoute({
    routeType: ftvCode.ROUTE_LOCAL_BUY,
  }), ftvCode.FTV_NOT_REQUIRED);
  assert.equal(ftvCode.ftvStatusForRoute({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
    existingFtvCode: "HFS-MFG-1001",
  }), ftvCode.FTV_REUSE_EXISTING);
  assert.equal(ftvCode.ftvStatusForRoute({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
  }), ftvCode.FTV_GENERATE_REQUIRED);
});

test("FTV export gate blocks required external import without code", () => {
  assert.equal(ftvCode.canExportWithFtv({
    routeType: ftvCode.ROUTE_LOCAL_BUY,
    ftvStatus: ftvCode.FTV_NOT_REQUIRED,
  }), true);
  assert.equal(ftvCode.canExportWithFtv({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
    ftvStatus: ftvCode.FTV_GENERATE_REQUIRED,
    ftvCode: "",
  }), false);
  assert.equal(ftvCode.canExportWithFtv({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
    ftvStatus: ftvCode.FTV_REUSE_EXISTING,
    ftvCode: "HFS-ENG1-1002",
  }), true);
});
