# Approval Quote Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change approval routing so quoted history items use a 110% history-price decision popup, while new/no-history items return OM quote results to Requester before Dept DRI and Cost Manager approval.

**Architecture:** Keep the existing static prototype shape: price classification lives in `app-modules/price-decision.js`, workflow transitions stay in `app.js`, role/status visibility stays in `app-modules/workflow-status.js`, and regression coverage extends `tests/price-routing-smoke.js`. Treat this as a business-flow change with code, docs, tests, and API-readiness notes updated together.

**Tech Stack:** Browser JavaScript, Node.js `node:test`, Playwright smoke tests, static HTML prototype, existing Node API shim in `server.js`.

---

## Startup Context Receipt

Read before this plan was written:

- `README.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/02-dept-dri.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/03-cost-manager.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/06-budget-approver.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/07-admin.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/api-readiness.zh-TW.md`
- `05-engineering-source/procurement-prototype/db/workflow-api-table-map.zh-TW.md`
- `04-business-reference/flow-diagrams/Submit Approval.jpg`
- `04-business-reference/flow-diagrams/Quote Exception.jpg`

Worktree at planning time:

- Branch: `codex/restructure-by-audience...origin/codex/restructure-by-audience`
- Existing dirty files before this plan: `05-engineering-source/procurement-prototype/index.html`, `05-engineering-source/procurement-prototype/test.sh`, `05-engineering-source/procurement-prototype/tests/system-contract.test.js`, `05-engineering-source/procurement-prototype/tests/unit.test.js`, untracked `05-engineering-source/procurement-prototype/app-modules/om-progress.js`

## Business Rules To Implement

### Rule A: History-priced item after PAS quote

User requirement:

> 報過價的品項 requester will submit to Dept Dri for approval -> OM 如果 PAS 報價結果出現高過歷史價格 (USD *1.1 請跳出 pop out 選項, 確認送出或是請 requester 確認

Implementation interpretation:

- A history-priced item is any row where `historyUnitPriceUsdForDecision(row) > 0`.
- The new high-price trigger is `quoteUnitPriceUsd > historyUnitPriceUsd * 1.1`.
- `quoteUnitPriceUsd === historyUnitPriceUsd * 1.1` stays auto-cleared because the user said "高過".
- When high-price trigger is true, OM gets a popup with two explicit actions:
  - `Confirm send out`: records OM override/audit and sends the row to `finalExport` without Requester confirmation.
  - `Ask Requester confirmation`: reuses the existing Requester quote confirmation flow (`sendOmPasRowsToUserConfirm`).
- This replaces the old `quote - history > 0.40 USD -> Dept DRI -> Budget Approver` path for history-priced standard items.

### Rule B: New item / no history quote-first loop

User requirement:

> 沒報過價的品項(new item request) requester 填預估 -> OM 系統回覆報價回到 requester -> submit to Dept Dri -> Cost manager -> OM process

Implementation interpretation:

- A new/no-history item is any row where:
  - `isMaterialNoPending(row)` is true, or
  - `requestType === "New Item Request"`, or
  - `historyUnitPriceUsdForDecision(row) <= 0`.
- Requester creates the request with an estimate and sends it for OM quote collection, not final approval.
- OM quote result returns to Requester.
- Requester confirms quote, then explicitly submits the same demand row to Dept DRI.
- Dept DRI approve routes to Cost Manager.
- Cost Manager approve routes to OM process. Because the row already has quote data, it should resume at `finalExport` instead of asking OM to re-enter PAS quote fields.

### Existing Rules That Must Not Regress

- Requester still cannot see vendor, supplier, PAS material no, factory material no, OM assignee, FTV code.
- Dept DRI still cannot bypass Cost Manager for requester submissions.
- Cost Manager authorize remains the only standard path into OM process.
- Admin remains setup-only and cannot perform business approvals.
- Every reject/revise still stores reason, actor, timestamp, previous stage, next stage.
- Temporary Budget behavior should remain governed by existing Temporary Budget tests until Kai explicitly changes it.

## File Structure

Modify these files:

- `05-engineering-source/procurement-prototype/app-modules/price-decision.js`
  - Owns pure price classification.
  - Add 110% multiplier logic and new decision statuses.

- `05-engineering-source/procurement-prototype/app-modules/workflow-status.js`
  - Owns pending owner/current stage labels.
  - Add labels for `Requester Quote Confirmation`, `OM High Quote Decision`, and quote-confirmed pre-approval rows.

- `05-engineering-source/procurement-prototype/app.js`
  - Owns in-memory prototype transitions.
  - Add high-history quote popup state/actions.
  - Add new/no-history quote return to Requester before Dept DRI submit.
  - Keep existing functions as much as possible: `saveOmQuoteInfoRows`, `sendOmPasRowsToUserConfirm`, `confirmUserAOmQuote`, `submitRequests`, `applyPriceReviewDecision`, `applyCostManagerAuthorization`.

- `05-engineering-source/procurement-prototype/index.html`
  - Add one small modal for the OM high-history quote decision.

- `05-engineering-source/procurement-prototype/tests/unit.test.js`
  - Add pure price decision tests and workflow status tests.

- `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`
  - Replace old escalation expectations for history-priced standard items.
  - Add new/no-history quote-first route.

- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Add doc/code contract checks for the new 110% threshold and popup/action wording.

- `05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md`
  - Update official flow text after code tests pass.

- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
  - Add Requester quote-confirmation-before-approval behavior for new/no-history items.

- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
  - Add OM popup action responsibility.

- `05-engineering-source/procurement-prototype/_context/roles/06-budget-approver.zh-TW.md`
  - Remove history-priced standard items from Budget Approver final exception path.

- `05-engineering-source/procurement-prototype/db/workflow-api-table-map.zh-TW.md`
  - Add target API transition notes for Requester quote confirmation and OM high-history override.

Do not modify these during this plan unless a test exposes a direct failure:

- `04-business-reference/flow-diagrams/*.jpg`
- `03-it-handoff/**`
- `99-archive/**`
- `07-review-and-artifacts/**`

## Acceptance Criteria

- `100.00 -> 110.00` auto-clears.
- `100.00 -> 110.01` requires OM high-history quote popup.
- OM popup `Confirm send out` sends the row to `finalExport` and records no Requester confirmation requirement.
- OM popup `Ask Requester confirmation` sends the row to Requester confirmation.
- New/no-history item quote result always returns to Requester before Dept DRI approval.
- New/no-history Requester confirmation does not move directly to final export; it makes the row ready for Dept DRI submit.
- New/no-history Requester submit routes `Requester -> Dept DRI -> Cost Manager -> OM finalExport`.
- Existing Temporary Budget tests still pass.
- `./test.sh` passes from `05-engineering-source/procurement-prototype`.

## Task 1: Price Decision 110% Classifier

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app-modules/price-decision.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Write failing unit tests**

Add these tests near the existing price-decision tests in `05-engineering-source/procurement-prototype/tests/unit.test.js`:

```js
test("price decision uses 110 percent history multiplier for quoted history items", () => {
  const atThreshold = priceDecision.compareQuoteToHistory({
    quoteUnitPriceUsd: 110,
    historyUnitPriceUsd: 100,
    isTemporaryBudget: false,
  });
  assert.equal(atThreshold.status, "Auto Cleared");
  assert.equal(atThreshold.multiplierThreshold, 1.1);
  assert.equal(atThreshold.thresholdUnitPriceUsd, 110);

  const aboveThreshold = priceDecision.compareQuoteToHistory({
    quoteUnitPriceUsd: 110.01,
    historyUnitPriceUsd: 100,
    isTemporaryBudget: false,
  });
  assert.equal(aboveThreshold.status, "High History Quote Review");
  assert.equal(aboveThreshold.reason, "Quote 110.01 USD is higher than 110% of history price 100.00 USD");
});

test("price decision routes no-history item to requester quote confirmation", () => {
  const result = priceDecision.compareQuoteToHistory({
    quoteUnitPriceUsd: 80,
    historyUnitPriceUsd: 0,
    isTemporaryBudget: false,
    isNewItemRequest: true,
  });
  assert.equal(result.status, "Requester Quote Confirmation Required");
  assert.equal(result.reason, "No reusable history price; requester must confirm OM quote before Dept DRI submission");
});
```

- [ ] **Step 2: Run the failing unit tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:

```text
not ok ... price decision uses 110 percent history multiplier for quoted history items
not ok ... price decision routes no-history item to requester quote confirmation
```

- [ ] **Step 3: Implement constants and classifier logic**

In `05-engineering-source/procurement-prototype/app-modules/price-decision.js`, replace the threshold constant/status block at the top with:

```js
  const HISTORY_PRICE_MULTIPLIER_THRESHOLD = 1.1;

  const STATUS_AUTO_CLEARED = "Auto Cleared";
  const STATUS_HIGH_HISTORY_QUOTE_REVIEW = "High History Quote Review";
  const STATUS_REQUESTER_QUOTE_CONFIRMATION_REQUIRED = "Requester Quote Confirmation Required";
  const STATUS_ESCALATION_REQUIRED = "Price Escalation Required";
  const STATUS_ESCALATION_APPROVED = "Price Escalation Approved";
  const STATUS_ESCALATION_REJECTED = "Price Escalation Rejected";
  const STATUS_USER_CONFIRMATION_NOT_REQUIRED = "User Confirmation Not Required";
  const ESTIMATE_VARIANCE_WITHIN = "Within Estimate Range";
  const ESTIMATE_VARIANCE_UNDER = "Under Estimated";
  const ESTIMATE_VARIANCE_OVER = "Over Estimated";
```

In `compareQuoteToHistory`, replace the no-history and delta-threshold branch with:

```js
    if (isTemporaryBudget) {
      return {
        status: STATUS_ESCALATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdUsd: 0,
        thresholdUnitPriceUsd: null,
        multiplierThreshold: HISTORY_PRICE_MULTIPLIER_THRESHOLD,
        deltaUsd,
        variancePercent: historyUnitPrice ? ((quoteUnitPrice - historyUnitPrice) / historyUnitPrice) * 100 : null,
        reason: "Temporary Budget Request requires DRI review",
      };
    }
    if (!historyUnitPrice || input.isNewItemRequest) {
      return {
        status: STATUS_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
        category,
        quoteUnitPrice,
        historyUnitPrice,
        thresholdUsd: 0,
        thresholdUnitPriceUsd: null,
        multiplierThreshold: HISTORY_PRICE_MULTIPLIER_THRESHOLD,
        deltaUsd,
        variancePercent: null,
        reason: "No reusable history price; requester must confirm OM quote before Dept DRI submission",
      };
    }

    const variancePercent = ((quoteUnitPrice - historyUnitPrice) / historyUnitPrice) * 100;
    const thresholdUnitPriceUsd = roundUsdDelta(historyUnitPrice * HISTORY_PRICE_MULTIPLIER_THRESHOLD);
    const status = quoteUnitPrice > thresholdUnitPriceUsd ? STATUS_HIGH_HISTORY_QUOTE_REVIEW : STATUS_AUTO_CLEARED;
    return {
      status,
      category,
      quoteUnitPrice,
      historyUnitPrice,
      thresholdUsd: roundUsdDelta(thresholdUnitPriceUsd - historyUnitPrice),
      thresholdUnitPriceUsd,
      multiplierThreshold: HISTORY_PRICE_MULTIPLIER_THRESHOLD,
      deltaUsd,
      variancePercent,
      reason: status === STATUS_AUTO_CLEARED
        ? `Quote ${quoteUnitPrice.toFixed(2)} USD is within 110% of history price ${historyUnitPrice.toFixed(2)} USD`
        : `Quote ${quoteUnitPrice.toFixed(2)} USD is higher than 110% of history price ${historyUnitPrice.toFixed(2)} USD`,
    };
```

In the exported `api` object, add:

```js
    HISTORY_PRICE_MULTIPLIER_THRESHOLD,
    STATUS_HIGH_HISTORY_QUOTE_REVIEW,
    STATUS_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
```

- [ ] **Step 4: Run unit tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 5: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app-modules/price-decision.js 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: classify quote routing by 110 percent history price"
```

## Task 2: App-Level Quote Routing Statuses

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/app-modules/workflow-status.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Write failing workflow status tests**

Add these tests to `05-engineering-source/procurement-prototype/tests/unit.test.js` near the workflow status tests:

```js
test("workflow status exposes OM high-history quote decision owner", () => {
  const status = workflowStatus.buildWorkflowStatus({
    priceDecisionStatus: "High History Quote Review",
    omStage: "pasResult",
    quoteChoiceRequired: true,
    quoteUnitPriceSnapshotUsd: 110.01,
    historyUnitPriceSnapshotUsd: 100,
  }, { role: "omMember", today: new Date("2026-06-17T00:00:00Z") });
  assert.equal(status.pendingOwner, "OM Purchasing");
  assert.equal(status.currentStage, "OM High Quote Decision");
  assert.equal(status.nextAction, "Choose confirm send out or ask Requester confirmation");
});

test("workflow status exposes requester quote confirmation before Dept DRI submission", () => {
  const status = workflowStatus.buildWorkflowStatus({
    priceDecisionStatus: "Requester Quote Confirmation Required",
    omStage: "userConfirm",
    userAQuoteDecisionStatus: "Waiting User A Confirmation",
  }, { role: "requester", today: new Date("2026-06-17T00:00:00Z") });
  assert.equal(status.pendingOwner, "Requester");
  assert.equal(status.currentStage, "Requester Quote Confirmation");
  assert.equal(status.nextAction, "Requester confirm quote, then submit to Dept DRI");
});
```

- [ ] **Step 2: Run the failing workflow tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:

```text
not ok ... workflow status exposes OM high-history quote decision owner
not ok ... workflow status exposes requester quote confirmation before Dept DRI submission
```

- [ ] **Step 3: Add app constants and helper predicates**

In `05-engineering-source/procurement-prototype/app.js`, add these constants near the existing price constants:

```js
const PRICE_HIGH_HISTORY_REVIEW = "High History Quote Review";
const PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED = "Requester Quote Confirmation Required";
const QUOTE_CONFIRMATION_BEFORE_APPROVAL = "Quote Confirmed Before Approval";
```

Add these helpers near `isTemporaryBudgetRequest(row)`:

```js
function hasReusableHistoryPrice(row) {
  return historyUnitPriceUsdForDecision(row) > 0;
}

function isNewItemQuotePreApproval(row) {
  return Boolean(row?.quoteBeforeApprovalRequired)
    || row?.requestType === "New Item Request"
    || isMaterialNoPending(row)
    || !hasReusableHistoryPrice(row);
}

function isHighHistoryQuoteReview(row) {
  return row?.priceDecisionStatus === PRICE_HIGH_HISTORY_REVIEW || row?.quoteChoiceRequired === true;
}

function isRequesterQuoteConfirmationRequired(row) {
  return row?.priceDecisionStatus === PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED
    || row?.quoteBeforeApprovalRequired === true;
}
```

- [ ] **Step 4: Pass new item flag into price classifier**

In `priceDecisionForRow(row)`, change the classifier call to include `isNewItemRequest`:

```js
  const comparison = mod.compareQuoteToHistory?.({
    category,
    quoteUnitPriceUsd: quoteUnitPriceUsdForDecision(row),
    historyUnitPriceUsd: historyUnitPriceUsdForDecision(row),
    thresholds: adminApprovalSetup.thresholds,
    isTemporaryBudget: isTemporaryBudgetRequest(row),
    isNewItemRequest: row.requestType === "New Item Request" || isMaterialNoPending(row),
  }) || {
```

Change the return normalization to keep new statuses:

```js
  return {
    ...comparison,
    status: [
      PRICE_AUTO_CLEARED,
      PRICE_HIGH_HISTORY_REVIEW,
      PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED,
    ].includes(comparison.status) ? comparison.status : PRICE_ESCALATION_REQUIRED,
  };
```

- [ ] **Step 5: Update workflow status module**

In `05-engineering-source/procurement-prototype/app-modules/workflow-status.js`, update `pendingOwner(row = {})` by inserting these checks before the current `Price Escalation Required` checks:

```js
    if (row.priceDecisionStatus === "High History Quote Review" || row.quoteChoiceRequired === true) return "OM Purchasing";
    if (row.priceDecisionStatus === "Requester Quote Confirmation Required" && !row.userAQuoteDecisionAt) return "Requester";
    if (row.quoteConfirmedBeforeApproval && !row.submittedAt) return "Requester";
```

Update `currentStage(row = {})` by inserting these checks before `const owner = pendingOwner(row);`:

```js
    if (row.priceDecisionStatus === "High History Quote Review" || row.quoteChoiceRequired === true) return "OM High Quote Decision";
    if (row.priceDecisionStatus === "Requester Quote Confirmation Required" && !row.userAQuoteDecisionAt) return "Requester Quote Confirmation";
    if (row.quoteConfirmedBeforeApproval && !row.submittedAt) return "Requester Submit";
```

Update `nextAction(row = {})` by inserting these checks at the top:

```js
    if (row.priceDecisionStatus === "High History Quote Review" || row.quoteChoiceRequired === true) return "Choose confirm send out or ask Requester confirmation";
    if (row.priceDecisionStatus === "Requester Quote Confirmation Required" && !row.userAQuoteDecisionAt) return "Requester confirm quote, then submit to Dept DRI";
    if (row.quoteConfirmedBeforeApproval && !row.submittedAt) return "Submit quote-confirmed request to Dept DRI";
```

- [ ] **Step 6: Run unit tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 7: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/app-modules/workflow-status.js 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: expose quote routing workflow statuses"
```

## Task 3: OM Quote Save Routes New Decisions

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`

- [ ] **Step 1: Add failing smoke assertions for quote save routing**

In `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`, add this block after the `standardAutoRoute` assertions:

```js
  const highHistoryQuoteRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-HIGH-HISTORY-QUOTE-ROUTE",
      project: "P26",
      name: "Mini PC high history quote",
      detail: "Desktop PC",
      requestType: "Standard Demand",
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      unitPriceUsd: 100,
      historyUnitPriceUsd: 100,
      updatedPriceUsd: 110.01,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-HIGH-HISTORY",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-giang",
      omAssigneeName: "Giang",
    };
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    saveOmQuoteInfoRows([row], { requireComplete: true });
    const updated = requests.find((item) => item.id === row.id);
    return {
      priceDecisionStatus: updated.priceDecisionStatus,
      quoteChoiceRequired: updated.quoteChoiceRequired,
      omStage: updated.omStage,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
    };
  });

  assertRoute(highHistoryQuoteRoute.priceDecisionStatus === "High History Quote Review", "High history quote should require OM popup decision", highHistoryQuoteRoute);
  assertRoute(highHistoryQuoteRoute.quoteChoiceRequired === true, "High history quote should mark popup required", highHistoryQuoteRoute);
  assertRoute(highHistoryQuoteRoute.omStage === "pasResult", "High history quote should stay in PAS Quote Result until OM chooses popup action", highHistoryQuoteRoute);
  assertRoute(!highHistoryQuoteRoute.userAQuoteDecisionStatus, "High history quote should not automatically ask Requester", highHistoryQuoteRoute);
```

Add this block after the high-history route:

```js
  const newItemQuoteFirstRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-NEW-ITEM-QUOTE-FIRST",
      project: "P26",
      name: "New Item Quote First",
      detail: "New jig fixture",
      requestType: "New Item Request",
      materialNoPending: true,
      quoteBeforeApprovalRequired: true,
      status: "Draft",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      estimatedUnitPriceUsd: 80,
      historyUnitPriceUsd: 0,
      updatedPriceUsd: 82,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-NEW-ITEM",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-giang",
      omAssigneeName: "Giang",
    };
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    saveOmQuoteInfoRows([row], { requireComplete: true });
    const updated = requests.find((item) => item.id === row.id);
    return {
      priceDecisionStatus: updated.priceDecisionStatus,
      omStage: updated.omStage,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
      quoteBeforeApprovalRequired: updated.quoteBeforeApprovalRequired,
    };
  });

  assertRoute(newItemQuoteFirstRoute.priceDecisionStatus === "Requester Quote Confirmation Required", "New item quote should require requester confirmation", newItemQuoteFirstRoute);
  assertRoute(newItemQuoteFirstRoute.omStage === "userConfirm", "New item quote should return to Requester confirmation", newItemQuoteFirstRoute);
  assertRoute(newItemQuoteFirstRoute.userAQuoteDecisionStatus === "Waiting User A Confirmation", "New item quote should wait Requester confirmation", newItemQuoteFirstRoute);
```

- [ ] **Step 2: Run the failing smoke test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
```

Expected:

```text
Error: High history quote should require OM popup decision
```

- [ ] **Step 3: Update `priceDecisionPatch` routing**

In `05-engineering-source/procurement-prototype/app.js`, update `priceDecisionPatch(row, now, options)` so the patch handles the two new decision statuses before the existing auto-clear/escalation return.

Insert this after `const decision = priceDecisionForRow(row);` and the `const estimatePatch = ...` line:

```js
  if (decision.status === PRICE_HIGH_HISTORY_REVIEW) {
    return {
      ...estimatePatch,
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
      ...estimatePatch,
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
```

Keep the existing `PRICE_AUTO_CLEARED` branch and existing Temporary Budget escalation branch after these new branches.

- [ ] **Step 4: Add quote save history entries**

In `saveOmQuoteInfoRows`, after the existing history blocks for `PRICE_AUTO_CLEARED` and `PRICE_ESCALATION_REQUIRED`, add:

```js
    if (latest.priceDecisionStatus === PRICE_HIGH_HISTORY_REVIEW) {
      addOmHistory(latest, "High history quote decision required", latest.priceDecisionReason || "Quote is higher than 110% of history price.");
      addHandoffHistory(latest, "High history quote decision required", latest.priceDecisionReason || "OM must choose confirm send out or ask Requester confirmation.");
    }
    if (latest.priceDecisionStatus === PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED) {
      addOmHistory(latest, "Requester quote confirmation required", latest.priceDecisionReason || "No reusable history price.");
      addHandoffHistory(latest, "Requester quote confirmation required", latest.priceDecisionReason || "Requester must confirm quote before Dept DRI submission.");
    }
```

- [ ] **Step 5: Run smoke test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
```

Expected:

```text
price-routing-smoke passed
```

- [ ] **Step 6: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/price-routing-smoke.js
git commit -m "feat: route quote save through new approval decisions"
```

## Task 4: OM High-History Popup Actions

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing popup action smoke tests**

In `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`, add this block after `highHistoryQuoteRoute`:

```js
  const highHistoryConfirmSendRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-HIGH-HISTORY-CONFIRM-SEND",
      project: "P26",
      name: "Mini PC confirm high quote",
      detail: "Desktop PC",
      requestType: "Standard Demand",
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      historyUnitPriceUsd: 100,
      updatedPriceUsd: 110.01,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-HIGH-CONFIRM",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-giang",
      omAssigneeName: "Giang",
    };
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    saveOmQuoteInfoRows([row], { requireComplete: true });
    confirmHighHistoryQuoteSendOut(row.id, "OM confirms 110%+ quote is acceptable.");
    const updated = requests.find((item) => item.id === row.id);
    return {
      omStage: updated.omStage,
      quoteChoiceRequired: updated.quoteChoiceRequired,
      quoteChoiceStatus: updated.quoteChoiceStatus,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
    };
  });

  assertRoute(highHistoryConfirmSendRoute.omStage === "finalExport", "Confirm send out should move high history quote to Export Package", highHistoryConfirmSendRoute);
  assertRoute(highHistoryConfirmSendRoute.quoteChoiceRequired === false, "Confirm send out should clear popup requirement", highHistoryConfirmSendRoute);
  assertRoute(highHistoryConfirmSendRoute.quoteChoiceStatus === "OM Confirmed Send Out", "Confirm send out should record OM decision", highHistoryConfirmSendRoute);
  assertRoute(highHistoryConfirmSendRoute.userAQuoteDecisionStatus === "User Confirmation Not Required", "Confirm send out should not ask Requester", highHistoryConfirmSendRoute);

  const highHistoryAskRequesterRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-HIGH-HISTORY-ASK-REQUESTER",
      project: "P26",
      name: "Mini PC ask requester high quote",
      detail: "Desktop PC",
      requestType: "Standard Demand",
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      historyUnitPriceUsd: 100,
      updatedPriceUsd: 110.01,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-HIGH-ASK",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-giang",
      omAssigneeName: "Giang",
    };
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    saveOmQuoteInfoRows([row], { requireComplete: true });
    askRequesterForHighHistoryQuoteConfirmation(row.id);
    const updated = requests.find((item) => item.id === row.id);
    return {
      omStage: updated.omStage,
      quoteChoiceRequired: updated.quoteChoiceRequired,
      quoteChoiceStatus: updated.quoteChoiceStatus,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
    };
  });

  assertRoute(highHistoryAskRequesterRoute.omStage === "userConfirm", "Ask Requester should move high history quote to Requester confirmation", highHistoryAskRequesterRoute);
  assertRoute(highHistoryAskRequesterRoute.quoteChoiceRequired === false, "Ask Requester should clear popup requirement", highHistoryAskRequesterRoute);
  assertRoute(highHistoryAskRequesterRoute.quoteChoiceStatus === "Sent to Requester Confirmation", "Ask Requester should record OM decision", highHistoryAskRequesterRoute);
  assertRoute(highHistoryAskRequesterRoute.userAQuoteDecisionStatus === "Waiting User A Confirmation", "Ask Requester should wait Requester confirmation", highHistoryAskRequesterRoute);
```

- [ ] **Step 2: Add failing system contract test**

In `05-engineering-source/procurement-prototype/tests/system-contract.test.js`, add:

```js
test("OM high-history quote popup contract is present", () => {
  assert.match(html, /id="highHistoryQuoteChoiceModal"/);
  assert.match(html, /data-action="confirmHighHistoryQuoteSendOut"/);
  assert.match(html, /data-action="askRequesterHighHistoryQuoteConfirmation"/);
  assert.match(app, /function confirmHighHistoryQuoteSendOut/);
  assert.match(app, /function askRequesterForHighHistoryQuoteConfirmation/);
  assert.match(app, /High History Quote Review/);
  assert.match(app, /OM Confirmed Send Out/);
});
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
node --test tests/system-contract.test.js
```

Expected:

```text
Error: confirmHighHistoryQuoteSendOut is not defined
not ok ... OM high-history quote popup contract is present
```

- [ ] **Step 4: Add modal HTML**

In `05-engineering-source/procurement-prototype/index.html`, add this modal near the other app modals:

```html
  <div class="modal" id="highHistoryQuoteChoiceModal" hidden>
    <div class="modal-backdrop" data-action="closeHighHistoryQuoteChoice"></div>
    <section class="modal-card compact-modal" role="dialog" aria-modal="true" aria-labelledby="highHistoryQuoteChoiceTitle">
      <header class="modal-header">
        <div>
          <h2 id="highHistoryQuoteChoiceTitle">High History Quote Decision</h2>
          <p class="muted" id="highHistoryQuoteChoiceSummary">Quote is higher than 110% of history price.</p>
        </div>
        <button class="icon-button" type="button" data-action="closeHighHistoryQuoteChoice" aria-label="Close">×</button>
      </header>
      <div class="modal-body">
        <label class="field">
          <span>Decision note</span>
          <textarea id="highHistoryQuoteChoiceReason" rows="3" placeholder="Record why OM confirms send out or asks Requester to confirm."></textarea>
        </label>
      </div>
      <footer class="modal-actions">
        <button class="secondary-button" type="button" data-action="askRequesterHighHistoryQuoteConfirmation">Ask Requester confirmation</button>
        <button class="primary-button" type="button" data-action="confirmHighHistoryQuoteSendOut">Confirm send out</button>
      </footer>
    </section>
  </div>
```

- [ ] **Step 5: Add popup state and action functions**

In `05-engineering-source/procurement-prototype/app.js`, add state near other modal state variables:

```js
let pendingHighHistoryQuoteRequestId = "";
```

Add these functions near `sendOmPasRowsToUserConfirm(rows)`:

```js
function openHighHistoryQuoteChoiceModal(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || !isHighHistoryQuoteReview(row)) {
    showToast("This quote does not require a high-history decision.", "error");
    return;
  }
  if (!ensureOmRowAccess(row, "choose high history quote route")) return;
  pendingHighHistoryQuoteRequestId = requestId;
  const summary = document.getElementById("highHistoryQuoteChoiceSummary");
  if (summary) {
    summary.textContent = `${row.name || row.item || "Item"} quote ${money(row.quoteUnitPriceSnapshotUsd || quoteUnitPriceUsdForDecision(row))} is higher than 110% of history ${money(row.historyUnitPriceSnapshotUsd || historyUnitPriceUsdForDecision(row))}.`;
  }
  const reason = document.getElementById("highHistoryQuoteChoiceReason");
  if (reason) reason.value = "";
  document.getElementById("highHistoryQuoteChoiceModal")?.removeAttribute("hidden");
}

function closeHighHistoryQuoteChoiceModal() {
  pendingHighHistoryQuoteRequestId = "";
  document.getElementById("highHistoryQuoteChoiceModal")?.setAttribute("hidden", "");
}

function highHistoryQuoteDecisionReason(explicitReason = "") {
  return String(explicitReason || document.getElementById("highHistoryQuoteChoiceReason")?.value || "").trim();
}

function confirmHighHistoryQuoteSendOut(requestId = pendingHighHistoryQuoteRequestId, explicitReason = "") {
  const row = requests.find((item) => item.id === requestId);
  if (!row || !isHighHistoryQuoteReview(row)) {
    showToast("This quote does not require a high-history decision.", "error");
    return;
  }
  if (!ensureOmRowAccess(row, "confirm high history quote send out")) return;
  const reason = highHistoryQuoteDecisionReason(explicitReason);
  if (!reason) {
    showToast("Decision note is required before confirming send out.", "error");
    return;
  }
  const now = new Date().toISOString();
  requests = requests.map((item) => item.id === requestId ? {
    ...item,
    quoteChoiceRequired: false,
    quoteChoiceStatus: "OM Confirmed Send Out",
    quoteChoiceReason: reason,
    quoteChoiceDecidedAt: now,
    quoteChoiceDecidedBy: roleProfiles[currentRole]?.name || "OM Purchasing",
    omStage: "finalExport",
    omStatus: PRICE_HIGH_HISTORY_REVIEW,
    userAQuoteDecisionStatus: USER_CONFIRMATION_NOT_REQUIRED,
    userAQuoteDecisionAt: now,
    userAQuoteDecisionBy: "OM high-history quote decision",
  } : item);
  const latest = requests.find((item) => item.id === requestId);
  addOmHistory(latest, "OM confirmed high-history quote send out", reason);
  addHandoffHistory(latest, "OM confirmed high-history quote send out", reason);
  closeHighHistoryQuoteChoiceModal();
  renderOmPurchasing();
  renderDepartment();
  showToast("High-history quote confirmed. Row moved to Export Package.", "success");
}

function askRequesterForHighHistoryQuoteConfirmation(requestId = pendingHighHistoryQuoteRequestId, explicitReason = "") {
  const row = requests.find((item) => item.id === requestId);
  if (!row || !isHighHistoryQuoteReview(row)) {
    showToast("This quote does not require a high-history decision.", "error");
    return;
  }
  if (!ensureOmRowAccess(row, "ask Requester confirmation")) return;
  const reason = highHistoryQuoteDecisionReason(explicitReason) || "OM asks Requester to confirm quote higher than 110% of history price.";
  const now = new Date().toISOString();
  requests = requests.map((item) => item.id === requestId ? {
    ...item,
    quoteChoiceRequired: false,
    quoteChoiceStatus: "Sent to Requester Confirmation",
    quoteChoiceReason: reason,
    quoteChoiceDecidedAt: now,
    quoteChoiceDecidedBy: roleProfiles[currentRole]?.name || "OM Purchasing",
  } : item);
  const latest = requests.find((item) => item.id === requestId);
  sendOmPasRowsToUserConfirm([latest]);
  const after = requests.find((item) => item.id === requestId);
  addOmHistory(after, "OM asked Requester to confirm high-history quote", reason);
  addHandoffHistory(after, "OM asked Requester to confirm high-history quote", reason);
  closeHighHistoryQuoteChoiceModal();
}
```

- [ ] **Step 6: Wire row action and delegated event handlers**

In `runOmRowAction(requestId, action)`, add:

```js
  if (action === "chooseHighHistoryQuoteRoute") {
    openHighHistoryQuoteChoiceModal(requestId);
  }
```

In the app's delegated click handler, add branches matching existing `data-action` style:

```js
  if (action === "closeHighHistoryQuoteChoice") closeHighHistoryQuoteChoiceModal();
  if (action === "confirmHighHistoryQuoteSendOut") confirmHighHistoryQuoteSendOut();
  if (action === "askRequesterHighHistoryQuoteConfirmation") askRequesterForHighHistoryQuoteConfirmation();
```

In the OM PAS result row action renderer, show a row-local action when `isHighHistoryQuoteReview(row)`:

```js
      ${isHighHistoryQuoteReview(row) ? `<button class="table-action primary" type="button" data-om-row-action="chooseHighHistoryQuoteRoute" data-request-id="${htmlAttr(row.id)}">Choose route</button>` : ""}
```

- [ ] **Step 7: Run tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
node --test tests/system-contract.test.js
```

Expected:

```text
price-routing-smoke passed
# pass
```

- [ ] **Step 8: Commit**

```bash
git add 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/price-routing-smoke.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: add OM high-history quote decision popup"
```

## Task 5: New Item Quote Confirmation Before Dept DRI Submit

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`

- [ ] **Step 1: Add failing route test for new item full loop**

In `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`, add this after `newItemQuoteFirstRoute`:

```js
  const newItemApprovalLoopRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-NEW-ITEM-APPROVAL-LOOP",
      project: "P26",
      name: "New Item Approval Loop",
      detail: "New fixture quote before approval",
      requestType: "New Item Request",
      materialNoPending: true,
      quoteBeforeApprovalRequired: true,
      status: "Draft",
      selected: true,
      needDate: "2026-06-30",
      requiredDeliveryDate: "2026-06-30",
      stationBreakdown: [{ phase: "MP", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      estimatedUnitPriceUsd: 80,
      historyUnitPriceUsd: 0,
      updatedPriceUsd: 82,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-NEW-LOOP",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-giang",
      omAssigneeName: "Giang",
    };
    currentProject = "P26";
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id && item.name !== row.name)];
    saveOmQuoteInfoRows([row], { requireComplete: true });
    let updated = requests.find((item) => item.id === row.id);
    currentRole = "requester";
    confirmUserAOmQuote(updated.id);
    updated = requests.find((item) => item.id === row.id);
    const afterRequesterConfirm = {
      status: updated.status,
      omStage: updated.omStage,
      quoteConfirmedBeforeApproval: updated.quoteConfirmedBeforeApproval,
      deptDriReviewStatus: updated.deptDriReviewStatus,
    };

    document.getElementById("requestPackageNeedDate").value = "2026-06-30";
    submitRequests();
    updated = requests.find((item) => item.name === row.name);
    const afterSubmit = {
      status: updated.status,
      deptDriReviewStatus: updated.deptDriReviewStatus,
      omStage: updated.omStage,
    };

    currentRole = "dri";
    applyPriceReviewDecision(updated.id, "approve");
    updated = requests.find((item) => item.name === row.name);
    const afterDri = {
      costManagerAuthorizationStatus: updated.costManagerAuthorizationStatus,
      omStage: updated.omStage,
    };

    currentRole = "manager";
    applyCostManagerAuthorization(updated.id, "approve");
    updated = requests.find((item) => item.name === row.name);
    const afterCostManager = {
      status: updated.status,
      omStage: updated.omStage,
      quoteConfirmedBeforeApproval: updated.quoteConfirmedBeforeApproval,
      costManagerAuthorizationStatus: updated.costManagerAuthorizationStatus,
    };

    return { afterRequesterConfirm, afterSubmit, afterDri, afterCostManager };
  });

  assertRoute(newItemApprovalLoopRoute.afterRequesterConfirm.status === "Draft", "New item requester quote confirmation should return to draft submit state", newItemApprovalLoopRoute);
  assertRoute(newItemApprovalLoopRoute.afterRequesterConfirm.omStage === "", "New item requester quote confirmation should leave OM before Dept DRI submit", newItemApprovalLoopRoute);
  assertRoute(newItemApprovalLoopRoute.afterRequesterConfirm.quoteConfirmedBeforeApproval === true, "New item requester quote confirmation should mark quote confirmed before approval", newItemApprovalLoopRoute);
  assertRoute(newItemApprovalLoopRoute.afterSubmit.deptDriReviewStatus === "Pending Dept DRI Submission Review", "Quote-confirmed new item should submit to Dept DRI", newItemApprovalLoopRoute);
  assertRoute(!newItemApprovalLoopRoute.afterSubmit.omStage, "Quote-confirmed new item should not stay in OM after submit", newItemApprovalLoopRoute);
  assertRoute(newItemApprovalLoopRoute.afterDri.costManagerAuthorizationStatus === "Pending Cost Manager Authorization", "Dept DRI approval should send quote-confirmed new item to Cost Manager", newItemApprovalLoopRoute);
  assertRoute(newItemApprovalLoopRoute.afterCostManager.omStage === "finalExport", "Cost Manager approval should resume quote-confirmed new item at OM Export Package", newItemApprovalLoopRoute);
```

- [ ] **Step 2: Run failing smoke test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
```

Expected:

```text
Error: New item requester quote confirmation should return to draft submit state
```

- [ ] **Step 3: Add route patch for Requester quote confirmation**

In `05-engineering-source/procurement-prototype/app.js`, add this function near `confirmUserAOmQuote(requestId)`:

```js
function requesterQuoteConfirmedBeforeApprovalPatch(row, now = new Date().toISOString()) {
  return {
    status: "Draft",
    selected: true,
    omStage: "",
    omStatus: QUOTE_CONFIRMATION_BEFORE_APPROVAL,
    procurementStatus: QUOTE_CONFIRMATION_BEFORE_APPROVAL,
    quoteBeforeApprovalRequired: false,
    quoteConfirmedBeforeApproval: true,
    quoteConfirmedBeforeApprovalAt: now,
    quoteConfirmedBeforeApprovalBy: roleProfiles[currentRole]?.name || "Requester",
    deptDriReviewStatus: "",
    deptDriReviewReworkRequired: false,
    demandReviewStatus: "",
    costManagerAuthorizationStatus: "",
    costManagerAuthorizationReworkRequired: false,
    priceApprovalStatus: QUOTE_CONFIRMATION_BEFORE_APPROVAL,
    nextStep: "Submit quote-confirmed request to Dept DRI",
  };
}
```

In `confirmUserAOmQuote(requestId)`, replace the `routePatch` line with:

```js
  const routePatch = row.amendmentOf
    ? { omStage: "finalExport", omStatus: OM_USER_CONFIRMED }
    : isRequesterQuoteConfirmationRequired(row)
      ? requesterQuoteConfirmedBeforeApprovalPatch(row, now)
      : postUserAQuoteConfirmationRoutePatch(row, now);
```

Change the toast to distinguish this route:

```js
  const toastMessage = after.quoteConfirmedBeforeApproval
    ? "OM quote confirmed. Submit this row to Dept DRI."
    : after.omStage === "priceReview"
      ? "OM quote confirmed. Row moved to price review."
      : "OM quote confirmed. Row moved to Export Package.";
  showToast(toastMessage, "success");
```

- [ ] **Step 4: Preserve quote-confirmed rows during submit**

In `submitRequests()`, inside the selected row patch where the row is mapped to `status: "Submitted"`, add these fields so quote data survives the submit:

```js
        quoteConfirmedBeforeApproval: Boolean(row.quoteConfirmedBeforeApproval),
        quoteConfirmedBeforeApprovalAt: row.quoteConfirmedBeforeApprovalAt || "",
        quoteConfirmedBeforeApprovalBy: row.quoteConfirmedBeforeApprovalBy || "",
        quoteBeforeApprovalRequired: false,
```

- [ ] **Step 5: Resume quote-confirmed rows at OM final export after Cost Manager**

In `applyCostManagerAuthorization(requestId, action)`, change the approval patch from:

```js
    ...omLeaderIntakeRoutingPatch(item, now),
```

to:

```js
    ...(item.quoteConfirmedBeforeApproval ? {
      omStage: "finalExport",
      omStatus: OM_USER_CONFIRMED,
      procurementStatus: HANDOFF_SENT_TO_OM,
      sentToOmAt: item.sentToOmAt || now,
      quoteReadyAt: item.quoteReadyAt || now,
      quoteCompletionReadyAt: item.quoteCompletionReadyAt || now,
      finalExportPreparedAt: item.finalExportPreparedAt || now,
    } : omLeaderIntakeRoutingPatch(item, now)),
```

- [ ] **Step 6: Run smoke test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
```

Expected:

```text
price-routing-smoke passed
```

- [ ] **Step 7: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/price-routing-smoke.js
git commit -m "feat: route new item quotes through requester before approval"
```

## Task 6: API-Mode Hook For Requester Quote Confirmation

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/server.js`
- Test: `05-engineering-source/procurement-prototype/tests/api.test.js`

- [ ] **Step 1: Write failing API test**

In `05-engineering-source/procurement-prototype/tests/api.test.js`, add:

```js
test("requester quote confirmation API records quote-before-approval decision", async () => {
  const server = await startTestServer();
  try {
    const login = await requestJson(server, "POST", "/api/login", {
      username: "requester",
      password: "123",
    });
    const cookie = login.headers["set-cookie"]?.[0] || "";
    const response = await requestJson(server, "POST", "/api/requester/quote-confirmations/REQ-API-NEW-ITEM", {
      decision: "confirm",
      reason: "Requester accepts OM quoted new item price before Dept DRI submission.",
    }, { cookie });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.requestId, "REQ-API-NEW-ITEM");
    assert.equal(response.body.quoteConfirmedBeforeApproval, true);
    assert.equal(response.body.nextStage, "Requester Submit");
  } finally {
    await server.close();
  }
});
```

If `api.test.js` uses different helper names, adapt only to the existing helper names in that file and keep the endpoint/body/assertions identical.

- [ ] **Step 2: Run failing API test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/api.test.js
```

Expected:

```text
not ok ... requester quote confirmation API records quote-before-approval decision
```

- [ ] **Step 3: Add frontend API helper**

In `05-engineering-source/procurement-prototype/app.js`, add this helper near `apiRequest` callers:

```js
async function persistRequesterQuoteConfirmation(requestId, payload) {
  if (!apiModeEnabled()) return { offline: true };
  return apiRequest(`/api/requester/quote-confirmations/${encodeURIComponent(requestId)}`, {
    method: "POST",
    body: payload,
  });
}
```

In `confirmUserAOmQuote(requestId)`, before mutating `requests`, add:

```js
  if (isRequesterQuoteConfirmationRequired(row)) {
    persistRequesterQuoteConfirmation(requestId, {
      decision: "confirm",
      reason: "Requester accepted OM quote before Dept DRI submission.",
    }).catch((error) => showToast(error.message || "Quote confirmation API sync failed.", "error"));
  }
```

- [ ] **Step 4: Add server endpoint**

In `05-engineering-source/procurement-prototype/server.js`, inside the API router before the final `/api/` 404 branch, add:

```js
    const requesterQuoteConfirmationMatch = url.pathname.match(/^\/api\/requester\/quote-confirmations\/([^/]+)$/);
    if (req.method === "POST" && requesterQuoteConfirmationMatch) {
      const session = await requireSession(req, res);
      if (!session) return;
      if (session.user.role !== "requester") {
        return sendJson(res, 403, { error: "Only Requester can confirm quote before approval." });
      }
      const requestId = decodeURIComponent(requesterQuoteConfirmationMatch[1]);
      const body = await readJsonBody(req);
      if (body.decision !== "confirm") {
        return sendJson(res, 400, { error: "decision must be confirm" });
      }
      const reason = String(body.reason || "").trim();
      if (!reason) {
        return sendJson(res, 400, { error: "reason is required" });
      }
      await recordAuditEvent({
        actorUserId: session.user.id,
        action: "requester_quote_confirm_before_approval",
        targetType: "request",
        targetId: requestId,
        detail: reason,
      });
      return sendJson(res, 200, {
        requestId,
        quoteConfirmedBeforeApproval: true,
        nextStage: "Requester Submit",
      });
    }
```

If the local `server.js` helper names differ, use the existing equivalents:

```js
// Expected helper mapping:
// requireSession(req, res): existing session guard
// readJsonBody(req): existing JSON body parser
// recordAuditEvent(record): existing audit writer
// sendJson(res, status, body): existing JSON responder
```

- [ ] **Step 5: Run API test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/api.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 6: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/server.js 05-engineering-source/procurement-prototype/tests/api.test.js
git commit -m "feat: persist requester quote confirmation before approval"
```

## Task 7: Documentation And Contract Updates

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/06-budget-approver.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/db/workflow-api-table-map.zh-TW.md`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing doc contract test**

In `05-engineering-source/procurement-prototype/tests/system-contract.test.js`, add:

```js
test("quote routing docs describe 110 percent and new item quote-first flow", () => {
  const exceptionFlow = fs.readFileSync("_context/flows/exception-flow.zh-TW.md", "utf8");
  const requesterRole = fs.readFileSync("_context/roles/01-requester.zh-TW.md", "utf8");
  const omRole = fs.readFileSync("_context/roles/05-om-purchasing.zh-TW.md", "utf8");
  const budgetRole = fs.readFileSync("_context/roles/06-budget-approver.zh-TW.md", "utf8");
  const apiMap = fs.readFileSync("db/workflow-api-table-map.zh-TW.md", "utf8");

  assert.match(exceptionFlow, /history price \* 1\.1/);
  assert.match(exceptionFlow, /Confirm send out/);
  assert.match(exceptionFlow, /Ask Requester confirmation/);
  assert.match(exceptionFlow, /New Item Request[\s\S]*Requester[\s\S]*Dept DRI[\s\S]*Cost Manager[\s\S]*OM/);
  assert.match(requesterRole, /quote-confirmed request/);
  assert.match(omRole, /High History Quote Decision/);
  assert.match(budgetRole, /不處理 history-priced standard item 的 110% OM popup 決策/);
  assert.match(apiMap, /POST \/api\/requester\/quote-confirmations\/:id/);
});
```

- [ ] **Step 2: Run failing doc contract**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:

```text
not ok ... quote routing docs describe 110 percent and new item quote-first flow
```

- [ ] **Step 3: Update exception flow doc**

In `_context/flows/exception-flow.zh-TW.md`, replace the old "Price Exception 觸發規則" and "一般需求 quote 後路由" sections with:

```markdown
## Quote 後價格路由

### History-priced standard item

已報過價、有 reusable history price 的 standard item 使用比例門檻：

- 以 USD unit price 比較。
- `quoteUnitPriceUsd > historyUnitPriceUsd * 1.1` 時觸發 `High History Quote Decision`。
- `quoteUnitPriceUsd <= historyUnitPriceUsd * 1.1` 時 auto cleared。
- High History Quote Decision 不直接進 Budget Approver；OM popup 必須由 OM Purchasing 選一個動作：
  - `Confirm send out`：OM 記錄 reason/audit，進 OM Export Package，不要求 Requester confirmation。
  - `Ask Requester confirmation`：送 Requester quote confirmation，Requester confirm 後再進 OM Export Package。

### New Item Request / no history price

沒報過價的品項先走 quote-first loop：

1. Requester 填預估金額與原因。
2. OM 回覆 quote result。
3. Quote result 回到 Requester confirmation。
4. Requester confirm 後，submit quote-confirmed request to Dept DRI。
5. Dept DRI approve -> Cost Manager。
6. Cost Manager authorize -> OM process / Export Package。

### Temporary Budget

Temporary Budget 在本輪不變更：quote result 仍必經 Dept DRI -> Budget Approver，除非後續另有 locked decision。
```

- [ ] **Step 4: Update role docs**

In `_context/roles/01-requester.zh-TW.md`, add under `可操作功能`:

```markdown
- New Item Request / no history quote-first：先填預估金額與原因，OM quote result 回來後由 Requester confirm；confirm 後才 submit quote-confirmed request to Dept DRI。
```

Add under `測試 / QA 重點`:

```markdown
- New Item Request / no history 不可在 OM quote 後直接進 Export；Requester 必須先 confirm quote，再 submit to Dept DRI。
```

In `_context/roles/05-om-purchasing.zh-TW.md`, add under `可操作功能`:

```markdown
- High History Quote Decision：當 history-priced standard item 的 quoteUnitPriceUsd > historyUnitPriceUsd * 1.1，OM popup 必須選 `Confirm send out` 或 `Ask Requester confirmation`，並保留 reason/audit。
```

Add under `測試 / QA 重點`:

```markdown
- `100.00 -> 110.00` auto cleared；`100.00 -> 110.01` 觸發 High History Quote Decision popup。
```

In `_context/roles/06-budget-approver.zh-TW.md`, add under `不可看 / 不可做`:

```markdown
- 不處理 history-priced standard item 的 110% OM popup 決策；該決策由 OM 選 `Confirm send out` 或 `Ask Requester confirmation`。
```

- [ ] **Step 5: Update API map**

In `db/workflow-api-table-map.zh-TW.md`, add this row under Phase 3 or Phase 4 API rows:

```markdown
| `POST /api/requester/quote-confirmations/:id` | `approvals`, `audit_events` | quote result context | Requester |
```

Add these transition bullets:

```markdown
- History-priced standard item: `quoteUnitPriceUsd > historyUnitPriceUsd * 1.1` -> OM High History Quote Decision popup.
- OM High History Quote Decision `Confirm send out` -> OM Export Package.
- OM High History Quote Decision `Ask Requester confirmation` -> Requester quote confirmation -> OM Export Package.
- New Item Request / no history: OM quote result -> Requester quote confirmation -> Dept DRI -> Cost Manager -> OM process.
```

- [ ] **Step 6: Run doc contract**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 7: Commit**

```bash
git add 05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/06-budget-approver.zh-TW.md 05-engineering-source/procurement-prototype/db/workflow-api-table-map.zh-TW.md 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "docs: lock quote approval routing changes"
```

## Task 8: Full Verification

**Files:**
- No code changes expected.
- Validate: `05-engineering-source/procurement-prototype/test.sh`

- [ ] **Step 1: Run the focused route smoke**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/price-routing-smoke.js
```

Expected:

```text
price-routing-smoke passed
```

- [ ] **Step 2: Run unit tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 3: Run system contract**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 4: Run API tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/api.test.js
```

Expected:

```text
# pass
```

- [ ] **Step 5: Run full prototype suite**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected:

```text
All tests passed
```

- [ ] **Step 6: Inspect worktree**

Run:

```bash
git status --short --branch
```

Expected:

```text
## codex/restructure-by-audience...origin/codex/restructure-by-audience
```

If unrelated pre-existing dirty files remain, do not include them in this feature commit unless they were intentionally edited by these tasks.

## Self-Review

Spec coverage:

- History-priced item submit to Dept DRI then OM: covered by existing standard submit route plus Tasks 3 and 4.
- PAS quote higher than history USD * 1.1: covered by Tasks 1, 3, 4, 7.
- Popup options confirm send out or ask Requester confirmation: covered by Task 4.
- New item/no history quote-first loop: covered by Tasks 1, 3, 5, 7.
- Requester API hook remembered by user: covered by Task 6.
- Docs and role ownership updates: covered by Task 7.

Placeholder scan:

- No `TBD`, `TODO`, `fill in details`, or open-ended test instructions.
- The only implementation assumption is explicit: `USD * 1.1` means `quoteUnitPriceUsd > historyUnitPriceUsd * 1.1`.

Type consistency:

- New app constants: `PRICE_HIGH_HISTORY_REVIEW`, `PRICE_REQUESTER_QUOTE_CONFIRMATION_REQUIRED`, `QUOTE_CONFIRMATION_BEFORE_APPROVAL`.
- New row fields: `quoteChoiceRequired`, `quoteChoiceStatus`, `quoteChoiceReason`, `quoteBeforeApprovalRequired`, `quoteConfirmedBeforeApproval`.
- New functions: `isHighHistoryQuoteReview`, `isRequesterQuoteConfirmationRequired`, `confirmHighHistoryQuoteSendOut`, `askRequesterForHighHistoryQuoteConfirmation`, `requesterQuoteConfirmedBeforeApprovalPatch`, `persistRequesterQuoteConfirmation`.

## Risks

- The current prototype has a large `app.js`; implement in small commits and run focused tests after each task.
- Existing dirty worktree files predate this plan. Before executing, classify whether they are Kai's changes or earlier generated work, and avoid staging unrelated edits.
- If Kai intended `USD * 1.1` to mean a flat delta formula rather than 110% of history unit price, Task 1 must be changed before execution.
- If Kai wants new/no-history rows to go back to OM PAS Demand No instead of OM Export Package after Cost Manager approval, Task 5 Step 5 must route to `omLeaderIntakeRoutingPatch(item, now)` instead of `finalExport`.
