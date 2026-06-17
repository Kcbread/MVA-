const test = require("node:test");
const assert = require("node:assert/strict");

const quote = require("../app-modules/quote-validity.js");
const dashboard = require("../app-modules/demand-cost-dashboard.js");
const priceDecision = require("../app-modules/price-decision.js");

test("quote validity uses 14-day warning threshold", () => {
  const today = new Date("2026-06-01T00:00:00");
  assert.equal(quote.quoteValidity("", today), "Missing Valid Until");
  assert.equal(quote.quoteValidity("2026-05-31", today), "Expired / Requote Required");
  assert.equal(quote.quoteValidity("2026-06-14", today), "Expiring Soon");
  assert.equal(quote.quoteValidity("2026-06-16", today), "Valid");
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
  assert.equal(quote.pendingOwner({ userAQuoteDecisionStatus: "Waiting User A Confirmation", pasDemandNo: "AIDB-1" }), "User A");
  assert.equal(quote.pendingOwner({ finalExportStatus: "Exported to CFA" }), "OM Complete");
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

test("demand cost dashboard treats User Applied carryover as effective", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 12,
    lineCount: 1,
    carryoverQty: 5,
    unitPrice: 200,
    status: "User Applied",
  });
  assert.equal(impact.originalQty, 12);
  assert.equal(impact.carryoverQty, 5);
  assert.equal(impact.effectiveQty, 7);
  assert.equal(impact.savingAmount, 1000);
});

test("demand cost dashboard does not subtract pending carryover", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 10,
    lineCount: 2,
    carryoverQty: 4,
    unitPrice: 300,
    status: "Pending Review",
  });
  assert.equal(impact.originalQty, 20);
  assert.equal(impact.carryoverQty, 0);
  assert.equal(impact.effectiveQty, 20);
  assert.equal(impact.savingAmount, 0);
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

test("price decision applies Computer 20 percent threshold", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPrice: 119,
    historyUnitPrice: 100,
  }).status, priceDecision.STATUS_AUTO_CLEARED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPrice: 121,
    historyUnitPrice: 100,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
});

test("price decision applies MFG 10 percent threshold", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "MFG",
    quoteUnitPrice: 109,
    historyUnitPrice: 100,
  }).status, priceDecision.STATUS_AUTO_CLEARED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "MFG",
    quoteUnitPrice: 111,
    historyUnitPrice: 100,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
});

test("price decision requires escalation for no history and temporary budget", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPrice: 100,
    historyUnitPrice: 0,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPrice: 100,
    historyUnitPrice: 90,
    isTemporaryBudget: true,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
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
