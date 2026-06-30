# Quotation DB Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the OM quote-expiry monitor surface into a shared `Quotation DB`, remove duplicate personal quote-expiry/watch tabs from OM labels, keep `My Quote Result` as the OM Purchasing workbench identity, and keep quote result and expiry/reuse behavior unchanged.

**Architecture:** Keep the existing internal `quoteExpiry` tab id, functions, and CSS selectors to avoid a broad refactor. Change only user-facing labels, helper copy, role config labels, and contract/smoke test expectations. The existing Quotation DB surface continues to render expiry status rows and also explains that reusable quote records require Central IT confirmation before OM Purchasing can reuse them.

**Tech Stack:** Static HTML, vanilla JavaScript, Node.js `node:test`, Playwright smoke tests, existing `./test.sh` verification.

---

## Startup Context Receipt

Read:
- `README.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `01-pm-owner/project-progress/MASTER_PM_LEDGER.md`
- `01-pm-owner/project-progress/WORKTREE_TRIAGE_20260613.md`
- `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/api-readiness.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md`
- `05-engineering-source/procurement-prototype/_doc/ui-quality-review.zh-TW.md`

Roles:
- `OM Leader`
- `OM Purchasing`

Flows/Modules:
- Main Requester -> Dept DRI -> Cost Manager -> OM -> Buyer Handoff flow
- API readiness
- OM workflow table
- Quote validity / expiry surface

Worktree:
- Dirty worktree observed on branch `codex/terminology-convergence-20260618`.
- Do not stage or commit unrelated deletions under `03-it-handoff/`, `04-business-reference/`, or unrelated prototype edits.

Decisions:
- Keep `Quote Result` as the quote-input workbench.
- Keep `My Quote Result` as the OM Purchasing personal workbench label.
- Rebrand the existing quote-expiry monitor tab as `Quotation DB`.
- Preserve current functionality: quote result input, Central IT check, quote candidate reuse, and quote expiry warnings remain intact.

Gaps:
- Real UAT MySQL deployment state for `pas_quotes` is `evidence_missing`; this plan targets the current frontend prototype and contract tests only.

## Boundary Map

Feature:
- OM Quotation DB surface for reusable quote records and quote validity risk.

Function:
- Replace monitor-oriented OM tab/copy with Quotation DB wording.
- Preserve `My Quote Result` behavior and quote input flow.
- Integrate expiry wording into Quotation DB instead of presenting it as a standalone monitor.

Module:
- `05-engineering-source/procurement-prototype/index.html`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
- `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md`

Non-scope:
- Do not implement new backend `/api/om/items/:id/quote-result` endpoints.
- Do not rename internal `quoteExpiry` function names, DOM ids, or CSS classes in this change.
- Do not change requester visibility, OM assignment rules, or price exception routing.
- Do not change quote validity threshold, currently 7 days.

Validation:
- Run targeted contract tests after each behavior-facing task.
- Run `./test.sh` before final response.
- Perform UI quality review against `_doc/ui-quality-review.zh-TW.md`.

## File Structure

- `05-engineering-source/procurement-prototype/index.html`
  - User-facing static tab labels and Quotation DB panel shell.
  - Keep `data-om-tab="quoteExpiry"` and `data-om-panel="quoteExpiry"`.

- `05-engineering-source/procurement-prototype/app.js`
  - Role-specific OM tab labels.
  - `omTabLabel()` fallback labels.
  - OM workspace banner wording.
  - Quotation DB hint, row action text, and empty state text.

- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Contract expectations for user-facing labels.
  - Guardrail that `Quote Result / Monitor`, `Quote Expiry Watch`, and `Submission Monitor` do not reappear in the OM surface.
  - Guardrail that internal `quoteExpiry` ids remain stable.

- `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
  - Smoke test names updated from `Quote Expiry Watch` / `Quote Result / Monitor` to `Quotation DB` / `Quote Result`.

- Context docs under `05-engineering-source/procurement-prototype/_context/`
- Preserve product truth for future threads: all OM roles see the shared `Quotation DB`; OM Purchasing uses `My Quote Result` for assigned quote input.

- `05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md`
  - Update OM tab guardrail wording.

## Proposed User-Facing Copy

Use these exact labels:

- OM Leader tab: `Quotation DB`
- OM Purchasing tab: `Quotation DB`
- Do not use `My Quote Expiry Watch` or `My Quotation DB`; expiry and reusable quote records are integrated into the shared `Quotation DB` tab for all OM roles.
- Shared static fallback tab: `Quotation DB`
- Static quote result tab: `Quote Result`
- OM Purchasing role label: `My Quote Result`

Use this exact Quotation DB hint:

```text
Reuse valid quote records after Central IT confirmation. Expiring Soon means <= 7 days; expired records require requote before reuse.
```

Use these exact row action strings:

```text
Check Quote Result before reuse.
Requote required before reuse.
Confirm with PAS / supplier before quote expires.
Reusable after Central IT confirmation.
```

Use this exact empty state:

```text
No quotation DB rows match the current filters.
```

## Task 1: Update Contract Tests First

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Update OM tab contract expectations**

Replace the existing expectations inside `test("OM tabs and PAS quote result contract are consolidated", () => { ... })` that assert `Quote Result / Monitor` and `Quote Expiry Watch` with this block:

```js
  assert.match(omView, /Submission Dashboard/);
  assert.match(omView, /PAS Demand No/);
  assert.match(omView, />Quote Result</);
  assert.match(omView, /Quotation DB/);
  assert.match(omView, /Export Package/);
  assert.doesNotMatch(omView, /Quote Result \/ Monitor/);
  assert.doesNotMatch(omView, /Quote Expiry Watch/);
  assert.doesNotMatch(omView, /Submission Monitor/);
```

Keep these existing internal-id assertions unchanged:

```js
  assert.match(omView, /data-om-tab="quoteExpiry"/);
  assert.match(omView, /data-om-panel="quoteExpiry"/);
  assert.match(omView, /data-om-tab="quoteConfirm"/);
  assert.match(omView, /data-om-panel="quoteConfirm"/);
```

- [ ] **Step 2: Update role label expectations**

After `const omLeaderConfig = ...` and `const omMemberConfig = ...`, add these assertions:

```js
  assert.match(omLeaderConfig, /quoteExpiry: "Quotation DB"/);
  assert.match(omMemberConfig, /quoteConfirm: "My Quote Result"/);
  assert.match(omMemberConfig, /quoteExpiry: "Quotation DB"/);
  assert.doesNotMatch(omLeaderConfig, /Monitor/);
  assert.doesNotMatch(omMemberConfig, /My Quote Result \/ Monitor/);
  assert.doesNotMatch(omMemberConfig, /My Quote Expiry Watch/);
  assert.doesNotMatch(omMemberConfig, /My Quotation DB/);
```

- [ ] **Step 3: Update Quotation DB table contract**

In the contract section currently using `const quoteExpiryTable = ...`, replace:

```js
  assert.match(quoteExpiryTable, /Quote Expiry Watch/);
```

with:

```js
  assert.match(quoteExpiryTable, /Quotation DB/);
  assert.match(quoteExpiryTable, /Reuse valid quote records after Central IT confirmation/);
  assert.doesNotMatch(quoteExpiryTable, /Quote Expiry Watch/);
```

Keep the existing summary and table header assertions:

```js
  [
    "Waiting PAS Reply",
    "Missing Valid Until",
    "Expiring Soon",
    "Expired / Requote",
    "Waiting Requester",
    "Ready to Export",
  ].forEach((label) => assert.match(quoteExpiryTable, new RegExp(label.replace("/", "\\/"))));
```

- [ ] **Step 4: Run test to verify it fails before implementation**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:

```text
not ok ... OM tabs and PAS quote result contract are consolidated
```

Failure should mention missing `Quotation DB` or lingering `Quote Result / Monitor` / `Quote Expiry Watch`.

## Task 2: Rebrand OM Labels And Static Panel Copy

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/app.js`

- [ ] **Step 1: Update static OM tabs in `index.html`**

Replace:

```html
<button class="inner-tab" data-om-tab="quoteConfirm">Quote Result / Monitor</button>
<button class="inner-tab" data-om-tab="quoteExpiry">Quote Expiry Watch</button>
```

with:

```html
<button class="inner-tab" data-om-tab="quoteConfirm">Quote Result</button>
<button class="inner-tab" data-om-tab="quoteExpiry">Quotation DB</button>
```

- [ ] **Step 2: Update Quotation DB toolbar label in `index.html`**

Replace:

```html
<span class="toolbar-label">Quote Expiry Watch</span>
```

with:

```html
<span class="toolbar-label">Quotation DB</span>
```

- [ ] **Step 3: Update role-specific labels in `app.js`**

In `roleWorkspaceConfigs.omLeader.omTabLabels`, replace:

```js
quoteExpiry: "Quote Expiry Watch",
```

with:

```js
quoteExpiry: "Quotation DB",
```

In `roleWorkspaceConfigs.omMember.omTabLabels`, replace:

```js
quoteConfirm: "My Quote Result / Monitor",
quoteExpiry: "My Quote Expiry Watch",
```

with:

```js
quoteConfirm: "My Quote Result",
quoteExpiry: "Quotation DB",
```

- [ ] **Step 4: Update fallback labels in `omTabLabel()`**

Replace:

```js
quoteConfirm: "Quote Result / Monitor",
quoteExpiry: "Quote Expiry Watch",
```

with:

```js
quoteConfirm: "Quote Result",
quoteExpiry: "Quotation DB",
```

- [ ] **Step 5: Update OM member banner copy**

Replace this sentence:

```js
<p class="panel-subcopy">Work from left to right: claim intake, complete quote package, watch expiring quotes, then finish export. Monitoring and assignment governance stay with OM Leader.</p>
```

with:

```js
<p class="panel-subcopy">Work from left to right: claim intake, complete quote package, reuse valid quotation records when Central IT has confirmed them, then finish export.</p>
```

- [ ] **Step 6: Run contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:

```text
# pass count increases, but failures may remain in Quotation DB hint/action copy until Task 3
```

## Task 3: Update Quotation DB Behavior Copy Without Changing Behavior

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`

- [ ] **Step 1: Add a tiny helper for reusable quote status copy**

Insert this function immediately before `function omQuoteExpiryAction(row) {`:

```js
function omQuotationDbAction(row) {
  const status = omQuoteExpiryStatusLabel(row);
  const candidate = omQuoteDbCandidate(row);
  const candidateStatus = candidate ? omQuoteDbCandidateStatus(row, candidate) : null;
  if (!omQuoteValidUntil(row)) return "Check Quote Result before reuse.";
  if (status === "Expired / Requote Required") return "Requote required before reuse.";
  if (status === "Expiring Soon") return "Confirm with PAS / supplier before quote expires.";
  if (candidate && candidateStatus?.reusable) return "Reusable after Central IT confirmation.";
  if (candidate && !candidateStatus?.expired) return "Confirm with Central IT before reuse.";
  return "Reusable quote record available for OM review.";
}
```

- [ ] **Step 2: Keep old function as compatibility wrapper**

Replace the body of `omQuoteExpiryAction(row)` with:

```js
function omQuoteExpiryAction(row) {
  return omQuotationDbAction(row);
}
```

- [ ] **Step 3: Update Quotation DB hint**

Inside `renderOmQuoteExpiry()`, replace:

```js
if (hint) hint.textContent = `Tracking only. Edit Quote Valid Until from Quote Result / Monitor. Expiring Soon means <= ${QUOTE_EXPIRING_SOON_DAYS} days.`;
```

with:

```js
if (hint) hint.textContent = `Reuse valid quote records after Central IT confirmation. Expiring Soon means <= ${QUOTE_EXPIRING_SOON_DAYS} days; expired records require requote before reuse.`;
```

- [ ] **Step 4: Update row stage label**

Inside the row template for `renderOmQuoteExpiry()`, replace:

```js
<td>${omItemCell(row, { stageLabel: "Quote expiry" })}</td>
```

with:

```js
<td>${omItemCell(row, { stageLabel: "Quotation DB" })}</td>
```

- [ ] **Step 5: Update empty state**

Replace:

```js
: `<tr><td colspan="11" class="empty-cell">No quote expiry rows match the current filters.</td></tr>`;
```

with:

```js
: `<tr><td colspan="11" class="empty-cell">No quotation DB rows match the current filters.</td></tr>`;
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js tests/system-contract.test.js
```

Expected:

```text
pass
```

## Task 4: Update Layout Smoke Test Names

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/layout-smoke.js`

- [ ] **Step 1: Rename smoke labels only**

Replace:

```js
await assertTableHasRows(page, ".om-expiry-table", "OM Leader Quote Expiry Watch table");
await assertNoPageOverflow(page, "OM Leader Quote Expiry Watch shell");
await assertVisibleTableCellsDoNotOverlap(page, ".om-expiry-table", "OM Leader Quote Expiry Watch table");
```

with:

```js
await assertTableHasRows(page, ".om-expiry-table", "OM Leader Quotation DB table");
await assertNoPageOverflow(page, "OM Leader Quotation DB shell");
await assertVisibleTableCellsDoNotOverlap(page, ".om-expiry-table", "OM Leader Quotation DB table");
```

Replace:

```js
await assertTableHasRows(page, ".om-quote-result-table", "OM Quote Result / Monitor table");
await assertNoPageOverflow(page, "OM Quote Result / Monitor shell");
await assertButtonsStayInsideCells(page, ".om-quote-result-table tbody button", "OM Quote Result / Monitor actions");
await assertVisibleTableCellsDoNotOverlap(page, ".om-quote-result-table", "OM Quote Result / Monitor table");
await assertRowHeights(page, ".om-quote-result-table", { min: 34, max: 118 }, "OM Quote Result / Monitor row height");
```

with:

```js
await assertTableHasRows(page, ".om-quote-result-table", "OM Quote Result table");
await assertNoPageOverflow(page, "OM Quote Result shell");
await assertButtonsStayInsideCells(page, ".om-quote-result-table tbody button", "OM Quote Result actions");
await assertVisibleTableCellsDoNotOverlap(page, ".om-quote-result-table", "OM Quote Result table");
await assertRowHeights(page, ".om-quote-result-table", { min: 34, max: 118 }, "OM Quote Result row height");
```

Replace:

```js
throw new Error(`OM Quote Result / Monitor should scroll inside table shell: ${quoteScroll.scrollWidth} <= ${quoteScroll.clientWidth}`);
```

with:

```js
throw new Error(`OM Quote Result should scroll inside table shell: ${quoteScroll.scrollWidth} <= ${quoteScroll.clientWidth}`);
```

- [ ] **Step 2: Run layout smoke**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/layout-smoke.js
```

Expected:

```text
Layout smoke passed.
```

## Task 5: Update Context And Testing Docs

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md`

- [ ] **Step 1: Update OM Leader context**

In `roles/04-om-leader.zh-TW.md`, replace both occurrences of:

```text
Quote Expiry Watch
```

with:

```text
Quotation DB
```

Change the compact handoff sentence to:

```text
OM Leader is Mai: assignment, exchange rate, tracking, OM orchestration, and Quotation DB visibility. It sees all OM work but should not become a hidden business approver or default quote operator.
```

- [ ] **Step 2: Update OM Purchasing context**

In `roles/05-om-purchasing.zh-TW.md`, replace the module list:

```text
- Quote Result / Monitor
- Quote Expiry Watch
```

with:

```text
- My Quote Result
- Quotation DB
```

Replace the quote expiry risk sentence:

```text
- Quote expiry warning threshold 是 7 天；`Quote Expiry Watch` 是追蹤/提醒面，實際 valid until 輸入仍在 Quote Result / Monitor。
```

with:

```text
- Quote expiry warning threshold 是 7 天；`Quotation DB` 整合可 reuse 報價紀錄與到期提醒，實際 quote result / valid until 輸入仍在 `My Quote Result`。
```

Replace the QA bullet:

```text
- Quote Result / Monitor 必須有 screenshot/image 與 Excel。
```

with:

```text
- My Quote Result 必須有 screenshot/image 與 Excel。
```

- [ ] **Step 3: Update module map**

In `modules/table-role-module-map.zh-TW.md`, replace:

```text
封裝 PAS Demand No、Quote Result / Monitor、Quote Expiry Watch、Export Package 的 shared row layout。Quote validity / expiry 由 `Quote Expiry Watch` standalone tracking tab 追蹤 7 天內到期與已過期風險；`Quote Valid Until` 的資料輸入仍在 `Quote Result / Monitor`。
```

with:

```text
封裝 PAS Demand No、Quote Result、Quotation DB、Export Package 的 shared row layout。Quotation DB 整合可 reuse 報價紀錄與 quote validity / expiry 追蹤；`Quote Valid Until` 的資料輸入仍在 `Quote Result`。
```

- [ ] **Step 4: Update exception flow**

In `flows/exception-flow.zh-TW.md`, replace:

```text
Quote validity / expiry monitor 屬於 OM `Quote Expiry Watch` standalone tracking tab；不是 workflow gate，資料輸入仍回 `Quote Result / Monitor`。
```

with:

```text
Quote validity / expiry 屬於 OM `Quotation DB` tracking surface；不是 workflow gate，資料輸入仍回 `Quote Result`。
```

- [ ] **Step 5: Update testing standard guardrail**

In `_doc/testing-standard-op.zh-TW.md`, replace:

```text
- OM Purchasing tabs 固定為 `Submission Dashboard / PAS Demand No / Quote Result / Monitor / Quote Expiry Watch / Export Package`；OM Leader/Mai 不顯示 `Quote Result / Monitor` 操作 tab。
```

with:

```text
- OM Purchasing tabs 固定為 `My Intake / My Quote Result / Quotation DB / My Exports`；OM Leader/Mai 不顯示 `My Quote Result` 操作 tab，Leader 看到 `Submission Dashboard / PAS Demand No / Quotation DB / Export Package`。
```

- [ ] **Step 6: Run docs-sensitive contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:

```text
pass
```

## Task 6: Full Verification And UI Quality Receipt

**Files:**
- Read: `05-engineering-source/procurement-prototype/_doc/ui-quality-review.zh-TW.md`
- Read: `05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md`

- [ ] **Step 1: Run full standard test suite**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected:

```text
All available tests completed.
```

- [ ] **Step 2: Check final user-facing monitor strings**

Run:

```bash
cd 05-engineering-source/procurement-prototype
rg -n "Quote Result / Monitor|Quote Expiry Watch|Submission Monitor|My Quote Expiry Watch|My Quote Result / Monitor" app.js index.html tests _context _doc
```

Expected:

```text
no matches
```

If matches remain in legacy comments or archived files outside the command scope, leave them alone.

- [ ] **Step 3: Check internal ids remain stable**

Run:

```bash
cd 05-engineering-source/procurement-prototype
rg -n "data-om-tab=\"quoteExpiry\"|data-om-panel=\"quoteExpiry\"|omQuoteExpiryRows|renderOmQuoteExpiry|omQuoteExpiryStatusLabel" app.js index.html tests
```

Expected:

```text
Matches remain in app.js, index.html, and tests.
```

- [ ] **Step 4: UI quality receipt**

Record this in the final response:

```text
UI Quality: pass if Quotation DB is visible as a work surface, not a passive monitor
Readability: pass if hint is one short action-oriented sentence
WCAG Smoke: pass if ./test.sh accessibility smoke passes
Attention Flow: pass if OM Purchasing first flow remains My Intake -> My Quote Result -> Quotation DB -> My Exports
Action Clarity: pass if row actions say reuse/requote/confirm, not monitor
Consistency: pass if role labels and docs use Quotation DB consistently
```

## Task 7: Optional Commit After Ownership Triage

**Files:**
- Stage only files modified by this plan.

- [ ] **Step 1: Review changed files**

Run:

```bash
git status --short
git diff -- 05-engineering-source/procurement-prototype/index.html \
  05-engineering-source/procurement-prototype/app.js \
  05-engineering-source/procurement-prototype/tests/system-contract.test.js \
  05-engineering-source/procurement-prototype/tests/layout-smoke.js \
  05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md \
  05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md
```

Expected:

```text
Diff contains only Quotation DB wording, tests, and context-doc updates.
```

- [ ] **Step 2: Stage only scoped files**

Run this only after Kai confirms staging is wanted in the dirty worktree:

```bash
git add \
  05-engineering-source/procurement-prototype/index.html \
  05-engineering-source/procurement-prototype/app.js \
  05-engineering-source/procurement-prototype/tests/system-contract.test.js \
  05-engineering-source/procurement-prototype/tests/layout-smoke.js \
  05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md \
  05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md
```

Expected:

```text
Only scoped files are staged.
```

- [ ] **Step 3: Commit only after explicit approval**

Run this only after Kai explicitly asks for a commit:

```bash
git commit -m "Refine OM quotation DB tab wording"
```

Expected:

```text
[codex/terminology-convergence-20260618 ...] Refine OM quotation DB tab wording
```

## Self-Review

Spec coverage:
- Requirement 1, remove OM team monitor wording: covered by Tasks 1, 2, 4, 5, 6.
- Requirement 1 exception, keep `My Quote Result` and behavior: covered by Tasks 1 and 2; internal `quoteConfirm` behavior remains unchanged.
- Requirement 2, monitor becomes shared `Quotation DB`: covered by Tasks 1, 2, 3, 5.
- Requirement 2a, reusable quotation records after Central IT confirmation: covered by Task 3 copy and existing `omQuoteDbCandidateStatus` / `markOmCentralItChecked` behavior.
- Requirement 2b, integrate quote expiry into same tab: covered by Tasks 2 and 3; existing expiry table remains in Quotation DB.
- Clarification, `My Quote Expiry Watch` is a duplicate tab: covered by Task 2 role labels and Task 5 docs; OM Purchasing uses shared `Quotation DB`, not `My Quote Expiry Watch` or `My Quotation DB`.

Placeholder scan:
- No `TBD`, `TODO`, `implement later`, or vague test instructions remain.

Type consistency:
- Internal names remain `quoteExpiry`, `omQuoteExpiryRows`, `renderOmQuoteExpiry`, `omQuoteExpiryStatusLabel`.
- New helper `omQuotationDbAction(row)` is called only by `omQuoteExpiryAction(row)`.

Risks:
- This is a wording and surface-meaning change, not a backend DB implementation.
- Because the worktree is dirty, staging/commit must be explicitly scoped.
- If Kai wants a true backend `quotation_db` table separate from `pas_quotes`, that should be a separate Phase 4 API/schema plan.
