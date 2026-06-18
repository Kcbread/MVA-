# OM Submission Dashboard And Quote Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the OM `Submission Dashboard` so OM team can see pending requests by request ID, combined owner/stage aging, SLA status, and quote-monitor responsibilities without duplicating `Quote Result / Monitor`.

**Architecture:** Keep role ownership in the existing `WorkflowStatusModule` and render a sharper OM dashboard view in `app.js`. The dashboard remains a status-monitor surface; `Quote Result / Monitor` remains the quote input and quote validity source of truth.

**Tech Stack:** Static HTML/CSS/JavaScript prototype, Node `node:test`, Playwright smoke through `./test.sh`.

---

## Business Understanding

OM Leader uses `Submission Dashboard` for orchestration and assignment visibility. OM Purchasing uses it to know which assigned request is blocked, how many days it has been in the current stage, and what next action belongs to OM, PAS/Bidding, Requester, or Buyer Handoff.

Locked business rules from project context:

- `Submission Dashboard` primary job: show pending owner, current stage, current-stage days, quote expiry risk, and over-SLA rows.
- `Days Pending` must mean days in the current workflow stage, not days since requester submit.
- Current stage start dates are stage-specific:
  - `PAS Demand No`: OM received date.
  - `PAS Quote Result`: PAS Demand No recorded date.
  - `Waiting Requester`: sent-to-Requester date.
  - `Export Package`: Requester confirmation date.
  - `Buyer PR / PO`: OM export / Buyer handoff date.
- Quote validity belongs inside `Quote Result / Monitor`; `Submission Dashboard` may summarize risk but should not duplicate quote-entry function.
- Confirmed SLA from Kai on 2026-06-18:
  - OM receives request -> submit PAS demand within 2 days.
  - PAS / Bidding replies within 15 days after PAS demand submission.
  - Use the current-stage SLA for row background and SLA labels. `OM_INTERNAL_SLA_DAYS = 7` is now only a legacy fallback for stages without a confirmed rule.

## File Structure

- Modify `05-engineering-source/procurement-prototype/app.js`
  - Add request ID display helpers.
  - Add combined owner/stage/current-stage SLA cell helpers.
  - Rename dashboard aging language from generic `Days Pending` to business-facing `Days in Current Stage`.
  - Replace `Queue Triage` cards with one `Pending Request Focus` strip that highlights actionable groups and points quote work back to `Quote Result / Monitor`.
- Modify `05-engineering-source/procurement-prototype/index.html`
  - Update the static table headers so first paint and system-contract checks match the runtime header.
- Modify `05-engineering-source/procurement-prototype/styles.css`
  - Add compact styles for request ID stacks, owner/stage stacks, SLA highlight rows, and the pending-focus strip.
  - Adjust OM submission table column widths for the extra Request ID column.
- Modify `05-engineering-source/procurement-prototype/tests/unit.test.js`
  - Add workflow status tests for stage-specific aging.
- Modify `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Add static contract checks for OM `Request ID`, `Owner / Stage`, `Days in Current Stage`, and removal of visible `Queue Triage`.
- Verify with `05-engineering-source/procurement-prototype/test.sh`.
- After implementation, run Product Design `design-qa` against the two provided screenshots and the rendered dashboard screenshot.

## Task 1: Lock Stage-Aging Tests

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/unit.test.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Add failing tests for stage-specific OM aging**

Append this test after `workflow status maps core ownership stages across roles`:

```js
test("workflow status measures OM days pending from the current stage start", () => {
  const today = new Date("2026-06-18T00:00:00Z");

  const pasDemand = workflowStatus.buildWorkflowStatus({
    status: "Approved",
    submittedAt: "2026-05-01T00:00:00Z",
    sentToOmAt: "2026-06-10T00:00:00Z",
  }, { role: "om", today });
  assert.equal(pasDemand.currentStage, "PAS Demand No");
  assert.equal(pasDemand.stageStartAt, "2026-06-10T00:00:00Z");
  assert.equal(pasDemand.daysPending, 8);

  const quoteResult = workflowStatus.buildWorkflowStatus({
    status: "Approved",
    submittedAt: "2026-05-01T00:00:00Z",
    sentToOmAt: "2026-06-01T00:00:00Z",
    pasDemandNo: "AIDB-1",
    pasDemandNoRecordedAt: "2026-06-15T00:00:00Z",
  }, { role: "om", today });
  assert.equal(quoteResult.currentStage, "PAS Quote Result");
  assert.equal(quoteResult.stageStartAt, "2026-06-15T00:00:00Z");
  assert.equal(quoteResult.daysPending, 3);

  const waitingRequester = workflowStatus.buildWorkflowStatus({
    userAQuoteDecisionStatus: "Waiting Requester Confirmation",
    sentToUserAAt: "2026-06-16T00:00:00Z",
  }, { role: "om", today });
  assert.equal(waitingRequester.currentStage, "Waiting Requester");
  assert.equal(waitingRequester.stageStartAt, "2026-06-16T00:00:00Z");
  assert.equal(waitingRequester.daysPending, 2);
});
```

- [ ] **Step 2: Run the focused unit test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected: PASS if the current `WorkflowStatusModule` already supports the rule; otherwise FAIL only on the new test.

- [ ] **Step 3: Fix `workflow-status.js` only if the test fails**

If the test fails, update `stageStartAt(row = {})` in `05-engineering-source/procurement-prototype/app-modules/workflow-status.js` to this exact body:

```js
function stageStartAt(row = {}) {
  const stage = currentStage(row);
  if (stage === "Dept DRI Review") return row.submittedAt || row.requestSubmittedAt || submittedAt(row);
  if (stage === "Demand Review") return row.costManagerAuthorizationSubmittedAt || row.deptDriSubmissionApprovedAt || submittedAt(row);
  if (stage === "Budget Approval") return row.driApprovedAt || row.approvedAt || submittedAt(row);
  if (stage === "PAS Demand No") return row.sentToOmAt || row.managerApprovedAt || row.decidedAt || row.approvedAt || row.submittedAt || submittedAt(row);
  if (stage === "PAS Quote Result") return row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt || receivedAt(row);
  if (stage === "Waiting Requester") return row.sentToUserAAt || row.quoteCompletionReadyAt || receivedAt(row);
  if (stage === "Export Package") return row.userAQuoteDecisionAt || row.finalExportPreparedAt || row.sentToUserAAt || receivedAt(row);
  if (stage === "Buyer PR / PO") return row.finalExportedAt || row.buyerReceivedAt || row.sentToBuyerAt || submittedAt(row);
  return receivedAt(row) || submittedAt(row);
}
```

- [ ] **Step 4: Re-run the focused unit test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected: PASS.

## Task 2: Add Request ID And Combined Owner / Stage SLA Rendering

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add dashboard helper functions**

Insert these functions in `app.js` after `omSubmittedReceivedCell(group)`:

```js
const OM_STAGE_SLA_DAYS = Object.freeze({
  "PAS Demand No": 2,
  "PAS Quote Result": 15,
});

function omRequestIdCell(group) {
  const rows = group.rows || [];
  const ids = [...new Set(rows.map((row) => row.id || row.requestId).filter(Boolean))];
  const primary = ids[0] || "-";
  const extra = ids.length > 1 ? `+${ids.length - 1} more` : `${rows.length} raw row${rows.length === 1 ? "" : "s"}`;
  return `
    <div class="om-request-id-stack" title="${htmlAttr(ids.join(" / ") || primary)}">
      <strong>${htmlText(primary)}</strong>
      <span>${htmlText(extra)}</span>
    </div>`;
}

function omSlaDaysForStage(stage) {
  return OM_STAGE_SLA_DAYS[stage] || OM_INTERNAL_SLA_DAYS;
}

function omIsOverSla(group) {
  const days = omDaysInStage(group);
  if (days === null) return false;
  return days > omSlaDaysForStage(omCurrentStageForGroup(group));
}

function omStageSlaLabel(group) {
  const stage = omCurrentStageForGroup(group);
  const days = omDaysInStage(group);
  const slaDays = omSlaDaysForStage(stage);
  if (days === null) return "Completed";
  return days > slaDays ? `Over SLA >${slaDays}d` : `SLA ${days}/${slaDays}d`;
}

function omAgingClassForGroup(group) {
  const days = omDaysInStage(group);
  if (days === null) return "approved";
  if (omIsOverSla(group)) return "warning";
  const slaDays = omSlaDaysForStage(omCurrentStageForGroup(group));
  return days >= Math.ceil(slaDays * 0.7) ? "pending" : "approved";
}

function omOwnerStageCell(group) {
  const owner = omPendingOwnerForGroup(group);
  const stage = omCurrentStageForGroup(group);
  const days = omDaysInStage(group);
  const startAt = omGroupStageStartAt(group, stage);
  return `
    <div class="om-owner-stage-stack">
      <span class="status-pill ${statusClass(owner)}">${htmlText(owner)}</span>
      <strong>${htmlText(stage)}</strong>
      <small>${htmlText(omPendingOwnerHelper(group, owner))}</small>
      <small>${startAt ? `Stage started ${compactDateTime(startAt)}` : "Missing stage start"}</small>
      <span class="status-pill ${omAgingClassForGroup(group)}">${htmlText(omStageSlaLabel(group))}</span>
    </div>`;
}
```

- [ ] **Step 2: Change the runtime OM submission table headers**

Replace the `headRow.innerHTML` block inside `renderOmSubmission()` with:

```js
headRow.innerHTML = `
  <th>Project</th>
  <th>Request ID</th>
  <th>Item</th>
  <th>Qty</th>
  <th>Submitted / OM Received</th>
  <th>Owner / Stage</th>
  <th>Days in Current Stage</th>
  <th>Detail</th>`;
```

- [ ] **Step 3: Change the runtime OM submission row template**

Replace the row `<tr>` template inside `renderOmSubmission()` with:

```js
return `
  <tr class="${omIsOverSla(row) ? "om-over-sla-row" : row.lateRows || row.pendingRows || row.notArrivedRows ? "pivot-risk-row" : ""}">
    <td>${htmlText(row.project)}</td>
    <td>${omRequestIdCell(row)}</td>
    <td><div class="item-primary">${htmlText(row.item)}</div><div class="reason-text">${row.rows.length} raw row${row.rows.length === 1 ? "" : "s"}</div></td>
    <td><strong>${row.quantity}</strong></td>
    <td>${omSubmittedReceivedCell(row)}</td>
    <td>${omOwnerStageCell(row)}</td>
    <td>${omAgingCell(row)}</td>
    <td><button class="mini return" data-om-submission-detail="${row.keyId}">Detail</button></td>
  </tr>`;
```

- [ ] **Step 4: Replace the aging cell with stage-specific SLA**

Replace `omAgingCell(group)` in `app.js` with:

```js
function omAgingCell(group) {
  const stage = omCurrentStageForGroup(group);
  const startAt = omGroupStageStartAt(group, stage);
  const days = omDaysInStage(group);
  if (days === null) return `<span class="status-pill approved">Completed</span><div class="reason-text">${startAt ? compactDateTime(startAt) : "-"}</div>`;
  const slaDays = omSlaDaysForStage(stage);
  const helper = startAt ? `Since ${compactDateTime(startAt)} · SLA ${slaDays}d` : `Missing stage start · SLA ${slaDays}d`;
  return `<span class="status-pill ${omAgingClassForGroup(group)}">${days}d</span><div class="reason-text">${helper}</div>`;
}
```

- [ ] **Step 5: Update the dashboard summary over-SLA calculation**

Inside `renderOmSubmission()`, replace:

```js
const overSla = rows.filter((group) => {
  const days = omDaysInStage(group);
  return days !== null && days > OM_INTERNAL_SLA_DAYS;
}).length;
```

with:

```js
const overSla = rows.filter(omIsOverSla).length;
```

Then replace the `Over SLA` summary helper:

```js
{ label: "Over SLA", value: overSla, helper: `>${OM_INTERNAL_SLA_DAYS}d pending`, variant: overSla ? "warning" : "" },
```

with:

```js
{ label: "Over SLA", value: overSla, helper: "Current-stage SLA breached", variant: overSla ? "warning" : "" },
```

- [ ] **Step 6: Change first-paint HTML headers**

In `index.html`, replace the OM submission table header row with:

```html
<tr>
  <th>Project</th>
  <th>Request ID</th>
  <th>Item</th>
  <th>Qty</th>
  <th>Submitted / OM Received</th>
  <th>Owner / Stage</th>
  <th>Days in Current Stage</th>
  <th>Detail</th>
</tr>
```

- [ ] **Step 7: Add system contract coverage**

Append these assertions near the existing OM tab checks in `tests/system-contract.test.js`:

```js
const omView = between(html, '<section class="view" data-view="om">', '<section class="view" data-view="buyer">');
assert.match(omView, /Submission Dashboard/);
assert.match(omView, /<th>Request ID<\/th>/);
assert.match(omView, /<th>Owner \/ Stage<\/th>/);
assert.match(omView, /<th>Days in Current Stage<\/th>/);
assert.match(app, /function omRequestIdCell/);
assert.match(app, /function omOwnerStageCell/);
assert.match(app, /function omAgingClassForGroup/);
assert.match(app, /Current-stage SLA breached/);
assert.match(app, /OM_STAGE_SLA_DAYS/);
assert.match(app, /"PAS Demand No": 2/);
assert.match(app, /"PAS Quote Result": 15/);
assert.match(app, /om-over-sla-row/);
```

- [ ] **Step 8: Run focused contracts**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: PASS.

## Task 3: Replace Queue Triage With Pending Request Focus

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/styles.css`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Replace `renderOmSubmissionTriage`**

Replace the full `renderOmSubmissionTriage(rows = [])` function in `app.js` with:

```js
function omPendingFocusReason(group) {
  const owner = omPendingOwnerForGroup(group);
  const stage = omCurrentStageForGroup(group);
  const quoteStatus = omQuoteStatusForGroup(group);
  const days = omDaysInStage(group);
  if (omIsOverSla(group)) return `Over SLA in ${stage}`;
  if (owner === "PAS / Bidding") return "Waiting PAS bidding result";
  if (owner === "Requester") return "Waiting Requester confirm / cancel";
  if (stage === "Export Package") return "Confirmed by Requester; export package pending";
  if (quoteStatus === "Missing Validity") return "Quote validity missing in Quote Result / Monitor";
  if (["Expiring Soon", "Expired / Requote Required"].includes(quoteStatus)) return quoteStatus;
  if (stage === "PAS Demand No") return "PAS Demand No not recorded";
  return omNextActionForGroup(group);
}

function omPendingFocusScore(group) {
  const days = omDaysInStage(group);
  const owner = omPendingOwnerForGroup(group);
  const quoteStatus = omQuoteStatusForGroup(group);
  let score = 0;
  if (omIsOverSla(group)) score += 100;
  if (quoteStatus === "Expired / Requote Required") score += 80;
  if (quoteStatus === "Expiring Soon") score += 60;
  if (owner === "PAS / Bidding") score += 40;
  if (owner === "Requester") score += 30;
  if (omCurrentStageForGroup(group) === "Export Package") score += 20;
  return score + (days || 0);
}

function renderOmSubmissionTriage(rows = []) {
  const target = document.getElementById("omSubmissionTriage");
  if (!target) return;
  const focusRows = rows
    .filter((group) => omPendingOwnerForGroup(group) !== "OM Complete")
    .sort((left, right) => omPendingFocusScore(right) - omPendingFocusScore(left))
    .slice(0, 5);
  target.innerHTML = `
    <div class="triage-title">
      <strong>Pending Request Focus</strong>
      <span>Prioritize request-level blockers here. Edit quote data only in Quote Result / Monitor.</span>
    </div>
    <div class="pending-focus-list">
      ${focusRows.length ? focusRows.map((group) => {
        const days = omDaysInStage(group);
        const owner = omPendingOwnerForGroup(group);
        const stage = omCurrentStageForGroup(group);
        return `
          <button class="pending-focus-row ${omIsOverSla(group) ? "is-over-sla" : ""}" type="button" data-om-submission-detail="${group.keyId}">
            <span class="pending-focus-id">${htmlText((group.rows[0]?.id || group.rows[0]?.requestId || group.project || "-"))}</span>
            <span class="pending-focus-main">${htmlText(group.project)} · ${htmlText(group.item)}</span>
            <span class="pending-focus-stage">${htmlText(owner)} / ${htmlText(stage)}</span>
            <span class="pending-focus-days">${days === null ? "Done" : `${days}d`}</span>
            <span class="pending-focus-reason">${htmlText(omPendingFocusReason(group))}</span>
          </button>`;
      }).join("") : `<div class="empty-cell">No pending request needs triage in the current scope.</div>`}
    </div>`;
}
```

- [ ] **Step 2: Add system contract checks**

Append this to `tests/system-contract.test.js` near the OM dashboard assertions:

```js
assert.match(app, /Pending Request Focus/);
assert.match(app, /Quote Result \/ Monitor/);
assert.doesNotMatch(app, /<strong>Queue Triage<\/strong>/);
```

- [ ] **Step 3: Run focused contracts**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: PASS.

## Task 4: Style The Revised Dashboard

**Files:**
- Modify: `05-engineering-source/procurement-prototype/styles.css`
- Test: `05-engineering-source/procurement-prototype/tests/layout-smoke.js`

- [ ] **Step 1: Add styles after the current `.queue-triage-strip` block**

Add this CSS:

```css
.om-request-id-stack,
.om-owner-stage-stack {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.om-request-id-stack strong,
.om-owner-stage-stack strong {
  color: var(--navy);
  font-size: 11px;
  font-weight: 900;
  line-height: 1.2;
}

.om-request-id-stack span,
.om-owner-stage-stack small {
  color: #667780;
  font-size: 10px;
  font-weight: 750;
  line-height: 1.25;
}

.om-over-sla-row td {
  background: #fff6f2;
}

.om-over-sla-row td:first-child {
  border-left: 3px solid #d94b37;
}

.pending-focus-list {
  display: grid;
  gap: 6px;
}

.pending-focus-row {
  display: grid;
  grid-template-columns: minmax(96px, 0.8fr) minmax(180px, 1.4fr) minmax(160px, 1.2fr) 64px minmax(180px, 1.4fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 38px;
  padding: 6px 8px;
  border: 1px solid #d6e4ec;
  border-radius: 6px;
  background: #fbfdfe;
  color: var(--navy);
  font: inherit;
  text-align: left;
}

.pending-focus-row:hover {
  border-color: #8db9d4;
  background: #f1f8fc;
}

.pending-focus-row.is-over-sla {
  border-color: #e9ad9e;
  background: #fff7f4;
}

.pending-focus-id,
.pending-focus-stage,
.pending-focus-days {
  font-size: 11px;
  font-weight: 900;
}

.pending-focus-main,
.pending-focus-reason {
  overflow: hidden;
  color: #435661;
  font-size: 11px;
  font-weight: 750;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .pending-focus-row {
    grid-template-columns: 1fr;
  }

  .pending-focus-main,
  .pending-focus-reason {
    white-space: normal;
  }
}
```

- [ ] **Step 2: Replace the duplicate OM submission nth-child width rules**

Keep only one `.om-submission-workbench-table` width block near the end of `styles.css` and make it match eight columns:

```css
.om-submission-workbench-table {
  min-width: 1280px;
  table-layout: fixed;
}

.om-submission-workbench-table th:nth-child(1),
.om-submission-workbench-table td:nth-child(1) { width: 84px; }

.om-submission-workbench-table th:nth-child(2),
.om-submission-workbench-table td:nth-child(2) { width: 128px; }

.om-submission-workbench-table th:nth-child(3),
.om-submission-workbench-table td:nth-child(3) { width: 230px; }

.om-submission-workbench-table th:nth-child(4),
.om-submission-workbench-table td:nth-child(4) {
  width: 64px;
  text-align: center;
}

.om-submission-workbench-table th:nth-child(5),
.om-submission-workbench-table td:nth-child(5) { width: 150px; }

.om-submission-workbench-table th:nth-child(6),
.om-submission-workbench-table td:nth-child(6) { width: 210px; }

.om-submission-workbench-table th:nth-child(7),
.om-submission-workbench-table td:nth-child(7) { width: 150px; }

.om-submission-workbench-table th:nth-child(8),
.om-submission-workbench-table td:nth-child(8) {
  width: 82px;
  text-align: center;
}
```

- [ ] **Step 3: Run layout smoke if Playwright is available**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/layout-smoke.js
```

Expected: PASS, or skipped only if Playwright is unavailable.

## Task 5: Full Verification And Design QA

**Files:**
- Modify: `05-engineering-source/procurement-prototype/design-qa.md`
- Test: `05-engineering-source/procurement-prototype/test.sh`

- [ ] **Step 1: Run the standard test entry**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected:

```text
Syntax: pass
Unit: pass
System Contract: pass
Browser Smoke: pass or skipped with reason
Accessibility Smoke: pass or skipped with reason
UI Quality: pass
```

- [ ] **Step 2: Start a local preview for rendered QA**

Run:

```bash
cd /Users/kai-chenyang/Desktop/桌面\ -\ Kai-chen的MacBook\ Pro/Codex/資料庫建置
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080/05-engineering-source/procurement-prototype/
```

- [ ] **Step 3: Capture implementation screenshot**

Use the available browser/capture workflow to render OM role, `Submission Dashboard`, desktop viewport close to the provided screenshots. Save the rendered screenshot under:

```text
05-engineering-source/procurement-prototype/test-artifacts/om-submission-dashboard-after.png
```

- [ ] **Step 4: Write `design-qa.md`**

Use Product Design `design-qa` with:

- Source visual truth path: `/var/folders/fq/t7kbchmx7wvfnvt7z5l13qy00000gn/T/TemporaryItems/NSIRD_screencaptureui_xSurji/截圖 2026-06-18 上午8.14.36.png` and `/var/folders/fq/t7kbchmx7wvfnvt7z5l13qy00000gn/T/TemporaryItems/NSIRD_screencaptureui_oBJbNl/截圖 2026-06-18 上午8.17.37.png`
- Implementation screenshot path: `05-engineering-source/procurement-prototype/test-artifacts/om-submission-dashboard-after.png`
- Viewport: desktop wide screenshot viewport
- State: OM role, `Submission Dashboard`

Expected `final result`: `passed` only if no P0/P1/P2 issues remain; otherwise `blocked` and name the visible blocker.

## Self-Review

Spec coverage:

- Request ID missing: Task 2 adds header and row cell.
- Pending owner and current stage combination with days/SLA: Task 2 combines owner/stage and adds stage-specific SLA label; Task 4 adds over-SLA row style.
- Days pending language: Task 2 changes header to `Days in Current Stage` and relies on `WorkflowStatusModule.stageStartAt`.
- Duplicate information and `Quote Result / Monitor` overlap: Task 3 replaces card triage with focused request list and explicitly routes quote editing back to `Quote Result / Monitor`.
- Queue Triage necessity: Task 3 removes the old `Queue Triage` card strip and keeps only a smaller pending-request focus component.

Placeholder scan: no `TBD`, `TODO`, or open-ended implementation steps remain.

Type consistency: helpers use existing `group.rows`, `row.id`, `row.requestId`, `omPendingOwnerForGroup`, `omCurrentStageForGroup`, `omDaysInStage`, `OM_INTERNAL_SLA_DAYS`, `htmlText`, `htmlAttr`, `statusClass`, and `compactDateTime` already present in `app.js`; new `OM_STAGE_SLA_DAYS`, `omSlaDaysForStage`, and `omIsOverSla` are defined before use in Task 2.
