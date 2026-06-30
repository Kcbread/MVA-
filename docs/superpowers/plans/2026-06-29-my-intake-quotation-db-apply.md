# My Intake Quotation DB Apply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let OM Purchasing receive a demand in My Intake, see a matching Quotation DB record, confirm it with Central IT, apply the record into the demand row, and move the row into My Quote Result without retyping quote data.

**Architecture:** Reuse the existing `app-modules/om-business-flow.js` Quotation DB candidate matching and `applyQuoteDbCandidate()` data patching. Add a My Intake row-local Quotation DB card and a separate `applyQuoteDbFromIntake` action that calls the same Central IT confirmation rules, then moves the row to Quote Result when PAS Demand No is satisfied by the applied record. Keep official quote editing in My Quote Result, and keep Browser-to-MySQL out of scope because the API readiness rule requires `Browser frontend -> Node.js / API -> MySQL`.

**Tech Stack:** Static prototype HTML/CSS/JavaScript, Node.js built-in `node:test`, Playwright smoke tests, existing `./test.sh` verification.

---

## Startup Context Receipt

Read:
- `README.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/api-readiness.zh-TW.md`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
- `05-engineering-source/procurement-prototype/tests/unit.test.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- `05-engineering-source/procurement-prototype/tests/layout-smoke.js`

Roles:
- OM Purchasing

Flows/Modules:
- Main Requester -> Dept DRI -> Cost Manager -> OM -> Buyer Handoff flow
- OMWorkflowTable
- API readiness

Worktree:
- Inspected with `git status --short --branch`.
- Existing dirty worktree includes unrelated high-risk deletions under `03-it-handoff/` and `04-business-reference/`, plus previous Quotation DB terminology edits. Do not stage or commit those unrelated paths in this task.

Decisions:
- OM Purchasing only operates assigned rows.
- Quotation DB integrates reusable quote records and quote expiry tracking.
- Quote Valid Until data input remains in My Quote Result.
- Browser frontend must not directly connect to MySQL.

Gaps:
- No real backend `pas_quotes` API is active in the current prototype. This plan implements the prototype workflow against the existing in-memory Quotation DB records and leaves API persistence as a separate backend change.

## Boundary Map

Feature:
- OM Purchasing My Intake Quotation DB reuse.

Function:
- Match My Intake row to Quotation DB candidate.
- Display candidate status before quote-result entry.
- Require explicit Central IT confirmation.
- Apply vendor, price, quote date, quote valid until, PAS Demand No, and PAS Material No from the Quotation DB candidate.
- Move the row to My Quote Result after apply when PAS Demand No requirements are satisfied.

Module:
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
- `05-engineering-source/procurement-prototype/tests/unit.test.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

Non-scope:
- New MySQL schema or API endpoints.
- Direct Browser-to-MySQL connection.
- Changing Requester, Dept DRI, Cost Manager, Budget Approver, or Buyer Handoff ownership.
- Silent auto-apply without Central IT confirmation.
- Moving expired Quotation DB records into reusable quote result.

Validation:
- Unit test for Quotation DB apply payload.
- System contract for My Intake UI and row action.
- Layout smoke for My Intake table controls.
- Full `./test.sh`.

## File Structure

- `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
  - Owns Quotation DB records, candidate matching, candidate status, and the pure data patch function.
- `05-engineering-source/procurement-prototype/app.js`
  - Owns rendering My Intake, row actions, toasts, history, and stage movement.
- `05-engineering-source/procurement-prototype/tests/unit.test.js`
  - Verifies candidate patching is correct and reusable from the intake flow.
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Verifies My Intake has a Quotation DB column/card/action and keeps old behavior boundaries.
- `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
  - Verifies My Intake table still renders without overflow/overlap after the new card.
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
  - Documents OM Purchasing responsibility for explicit Central IT confirmed reuse.
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
  - Documents OMWorkflowTable responsibility for My Intake Quotation DB apply.

### Task 1: Add Unit Coverage For Quotation DB Intake Apply Payload

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/unit.test.js`
- Read: `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`

- [ ] **Step 1: Add the failing unit test**

Insert this test immediately after `OM Quote DB uses valid-until date as hard stop and Central IT check for reuse` in `05-engineering-source/procurement-prototype/tests/unit.test.js`:

```js
test("OM Quote DB candidate can fill My Intake row after Central IT confirmation", () => {
  const row = {
    id: "REQ-QDB-INTAKE",
    name: "Mini PC",
    spec: "Industrial IPC, Intel i5, 16GB RAM",
    qty: 20,
  };
  const today = new Date("2026-06-18T00:00:00Z");
  const candidate = omBusinessFlow.bestQuoteDbCandidate(row, omBusinessFlow.QUOTE_DB_RECORDS, today);

  assert.equal(candidate.id, "QDB-MINI-PC-I5-202606");

  const patched = omBusinessFlow.applyQuoteDbCandidate(row, candidate, "2026-06-18T08:00:00.000Z", "Giang");

  assert.equal(patched.quoteDbCandidateId, "QDB-MINI-PC-I5-202606");
  assert.equal(patched.centralItCheckedAt, "2026-06-18T08:00:00.000Z");
  assert.equal(patched.centralItCheckedBy, "Giang");
  assert.equal(patched.vendor, "Central IT Sourcing");
  assert.equal(patched.updatedPriceUsd, 318);
  assert.equal(patched.unitPriceCurrency, "USD");
  assert.equal(patched.quoteDate, "2026-06-01");
  assert.equal(patched.quoteValidUntil, "2026-08-31");
  assert.equal(patched.quoteExpiry, "2026-08-31");
  assert.equal(patched.pasDemandNo, "PAS-HARD-IPC-2026");
  assert.equal(patched.pasMaterialNo, "PAS-MINI-PC-I5");
});
```

- [ ] **Step 2: Run the unit test file**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected before implementation changes:

```text
# pass
```

This test should already pass because `applyQuoteDbCandidate()` exists. If it fails, fix only `app-modules/om-business-flow.js` to preserve candidate patching semantics shown in the assertions.

- [ ] **Step 3: Commit after Task 1 only if Kai requests commits**

Because the worktree has unrelated high-risk deletions, do not auto-commit. If Kai explicitly asks for commits, stage only this file:

```bash
git add 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "test: cover quotation db intake apply payload"
```

### Task 2: Add My Intake Quotation DB Cell Renderer

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add the failing system contract assertions**

In `tests/system-contract.test.js`, inside `test("OM tabs and PAS quote result contract are consolidated", () => { ... })`, find:

```js
  assert.match(app, /function pasDemandNoEntryHtml/);
```

Insert these assertions directly above it:

```js
  assert.match(pasDemandTable, /<th>Quotation DB<\/th>/);
  assert.match(app, /function omIntakeQuotationDbCell/);
  assert.match(app, /data-om-row-button-action="applyQuoteDbFromIntake"/);
  assert.match(app, /Confirm & Apply/);
  assert.match(app, /Quotation DB: no candidate/);
```

- [ ] **Step 2: Run the focused contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js --test-name-pattern "OM tabs and PAS quote result contract are consolidated"
```

Expected:

```text
not ok
```

The failure should mention the missing `Quotation DB` intake header or missing `omIntakeQuotationDbCell`.

- [ ] **Step 3: Implement `omIntakeQuotationDbCell`**

In `app.js`, insert this function immediately after `omQuoteDbCandidateHtml`:

```js
function omIntakeQuotationDbCell(row, { readOnly = false } = {}) {
  const candidate = omQuoteDbCandidate(row);
  if (!candidate) {
    return `<div class="om-quote-db-card compact"><span class="om-cell-helper">Quotation DB: no candidate</span></div>`;
  }
  const status = omQuoteDbCandidateStatus(row, candidate);
  const actionDisabled = readOnly || !status || status.expired || status.reusable || !canOperateOmRow(row);
  const detail = `${candidate.vendor || "-"} · ${candidate.currency || "USD"} ${Number(candidate.unitPrice || 0).toLocaleString("en-US")} · Valid until ${candidate.quoteValidUntil || "-"} · ${status.quantityNote || ""} ${candidate.bufferNote || ""}`;
  return `
    <div class="om-quote-db-card compact" title="${htmlAttr(detail)}">
      <span class="status-pill ${statusClass(status.status)}">${status.status}</span>
      <div class="reason-text">Quotation DB: ${candidate.vendor || "-"} · ${candidate.quoteValidUntil || "-"}</div>
      <button class="mini approve" type="button" title="Confirm with Central IT and apply this Quotation DB record" data-om-row-button="${row.id}" data-om-row-button-action="applyQuoteDbFromIntake" ${actionDisabled ? "disabled" : ""}>Confirm & Apply</button>
      ${row.centralItCheckedAt ? `<div class="om-cell-helper">Applied ${compactDateTime(row.centralItCheckedAt)} by ${row.centralItCheckedBy || "OM Purchasing"}</div>` : `<div class="om-cell-helper">${status.quantityNote || "Quantity is not a hard stop."}</div>`}
    </div>`;
}
```

- [ ] **Step 4: Add the My Intake table column**

In `renderOmPasRequest()` in `app.js`, add a table cell after the PAS Demand No cell:

```js
        <td>${pasDemandNoEntryHtml(row)}</td>
        <td>${omIntakeQuotationDbCell(row)}</td>
        <td>${enriched.omOwner || "-"}${enriched.omOwner ? `<div class="reason-text">CPD-IEP owner</div>` : ""}</td>
```

In `index.html`, inside the PAS Demand No table header under `data-om-panel="pasRequest"`, add this header immediately after:

```html
                  <th>PAS Demand No</th>
```

Add:

```html
                  <th>Quotation DB</th>
```

If the empty state colspan in `renderOmPasRequest()` is still `11`, change it to `12`:

```js
    : `<tr><td colspan="12" class="empty-cell">No OM demand is waiting for PAS Demand No.</td></tr>`;
```

- [ ] **Step 5: Run the focused contract test again**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js --test-name-pattern "OM tabs and PAS quote result contract are consolidated"
```

Expected:

```text
# pass
```

### Task 3: Add Intake Apply Action Without Changing Quote Result Action

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add contract assertions for separate actions**

In `tests/system-contract.test.js`, near the existing assertions:

```js
  assert.match(app, /Central IT Checked/);
  assert.match(app, /centralItCheckedAt/);
```

Add:

```js
  assert.match(app, /function applyQuoteDbCandidateToOmRow/);
  assert.match(app, /function applyQuoteDbFromIntake/);
  assert.match(app, /movePasRowsToQuoteCompletion\(\[latest\]\)/);
  assert.match(app, /Quote DB candidate applied from My Intake/);
```

- [ ] **Step 2: Run the focused contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js --test-name-pattern "OM tabs and PAS quote result contract are consolidated"
```

Expected:

```text
not ok
```

The failure should mention missing helper functions.

- [ ] **Step 3: Extract shared apply helper**

In `app.js`, replace the body of `markOmCentralItChecked(row)` with a shared helper plus the original action wrapper.

Add this helper immediately before `markOmCentralItChecked(row)`:

```js
function applyQuoteDbCandidateToOmRow(row, actionLabel = "Central IT Checked") {
  if (!row || !ensureOmRowAccess(row, actionLabel)) return null;
  const candidate = omQuoteDbCandidate(row);
  if (!candidate) {
    showToast("No Quotation DB candidate found for this item/spec.", "error");
    return null;
  }
  const status = omQuoteDbCandidateStatus(row, candidate);
  if (status?.expired) {
    showToast("Quotation DB candidate is expired. Requote is required.", "error");
    return null;
  }
  const now = new Date().toISOString();
  const actor = roleProfiles[currentRole]?.name || "OM Purchasing";
  requests = requests.map((item) => {
    if (item.id !== row.id) return item;
    const patched = omBusinessFlowModule().applyQuoteDbCandidate?.(item, candidate, now, actor) || item;
    return {
      ...patched,
      quoteValidUntilUpdatedAt: patched.quoteValidUntil ? now : item.quoteValidUntilUpdatedAt,
      quoteReceivedAt: patched.quoteDate || item.quoteReceivedAt,
      pasDemandNoUpdatedAt: patched.pasDemandNo ? now : item.pasDemandNoUpdatedAt,
      pasDemandNoRecordedAt: patched.pasDemandNo ? item.pasDemandNoRecordedAt || now : item.pasDemandNoRecordedAt,
      pasMaterialNoUpdatedAt: patched.pasMaterialNo ? now : item.pasMaterialNoUpdatedAt,
    };
  });
  const updated = requests.find((item) => item.id === row.id) || row;
  addOmHistory(updated, actionLabel, `Quotation DB candidate ${candidate.id} checked; ${status?.quantityNote || "quantity is not a hard stop"}`);
  addHandoffHistory(updated, "Quotation DB candidate reused", `${candidate.id} / valid until ${candidate.quoteValidUntil || "-"}.`);
  return updated;
}
```

Then rewrite `markOmCentralItChecked(row)` as:

```js
function markOmCentralItChecked(row) {
  const updated = applyQuoteDbCandidateToOmRow(row, "Central IT Checked");
  if (!updated) return;
  renderOmPurchasing();
  showToast("Central IT checked. Quotation DB candidate marked reusable.", "success");
}
```

- [ ] **Step 4: Add the My Intake apply function**

Insert this function immediately after `markOmCentralItChecked(row)`:

```js
function applyQuoteDbFromIntake(row) {
  const updated = applyQuoteDbCandidateToOmRow(row, "Quote DB candidate applied from My Intake");
  if (!updated) return;
  const latest = requests.find((item) => item.id === row.id) || updated;
  if (omPasDemandRequirement(latest).required && !latest.pasDemandNo) {
    renderOmPurchasing();
    showToast("Quotation DB applied. PAS Demand ID is still required before My Quote Result.", "success");
    return;
  }
  movePasRowsToQuoteCompletion([latest]);
  showToast("Quotation DB applied and moved to My Quote Result.", "success");
}
```

- [ ] **Step 5: Wire the new row action**

In `runOmRowAction(requestId, action)`, add this block immediately after the existing `centralItChecked` block:

```js
  if (action === "applyQuoteDbFromIntake") {
    applyQuoteDbFromIntake(row);
  }
```

- [ ] **Step 6: Run the focused contract test again**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js --test-name-pattern "OM tabs and PAS quote result contract are consolidated"
```

Expected:

```text
# pass
```

### Task 4: Verify And Tune My Intake Layout

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/index.html`

- [ ] **Step 1: Add My Intake table control assertions**

In `tests/layout-smoke.js`, find the OM section that asserts Quote Result layout:

```js
  await assertTableHasRows(page, ".om-quote-result-table", "OM Quote Result table");
```

Insert this block immediately before it:

```js
  await assertTableHasRows(page, ".om-pas-demand-table", "OM My Intake table");
  await assertNoPageOverflow(page, "OM My Intake shell");
  await assertButtonsStayInsideCells(page, ".om-pas-demand-table tbody button", "OM My Intake actions");
  await assertVisibleTableCellsDoNotOverlap(page, ".om-pas-demand-table", "OM My Intake table");
```

- [ ] **Step 2: Run the layout smoke test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/layout-smoke.js
```

Expected:

```text
Layout smoke passed
```

If this fails because the new Quotation DB card makes the PAS table too cramped, add a PAS table colgroup or CSS width rule in the existing style block. Use this CSS selector and values:

```css
.om-pas-demand-table th:nth-child(6),
.om-pas-demand-table td:nth-child(6) {
  min-width: 220px;
}
```

If the test still fails due to row height, reduce only the My Intake card helper text by changing the no-candidate card in `omIntakeQuotationDbCell()` to:

```js
return `<div class="om-quote-db-card compact"><span class="om-cell-helper">Quotation DB: no candidate</span></div>`;
```

- [ ] **Step 3: Re-run the layout smoke test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/layout-smoke.js
```

Expected:

```text
Layout smoke passed
```

### Task 5: Update Role And Module Context

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Update OM Purchasing role context**

In `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`, under `## 可操作功能`, add this bullet after `輸入 PAS Demand No。`:

```markdown
- 在 My Intake 查看 Quotation DB 候選報價；經 Central IT 確認後，可套用候選報價帶入 PAS Demand No、PAS Material No、vendor、price、quote date、quote valid until，並進入 My Quote Result 後續處理。
```

In `## 常見風險`, replace:

```markdown
- Quote expiry warning threshold 是 7 天；`Quotation DB` 整合可 reuse 報價紀錄與到期提醒，實際 quote result / valid until 輸入仍在 `My Quote Result`。
```

with:

```markdown
- Quote expiry warning threshold 是 7 天；`Quotation DB` 整合可 reuse 報價紀錄與到期提醒。My Intake 可在 Central IT 確認後套用候選報價，但實際 quote result / valid until 的人工輸入與修正仍在 `My Quote Result`。
```

- [ ] **Step 2: Update module map**

In `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`, replace the `OMWorkflowTable` paragraph:

```markdown
封裝 PAS Demand No、Quote Result、Quotation DB、Export Package 的 shared row layout。Quotation DB 整合可 reuse 報價紀錄與 quote validity / expiry 追蹤；`Quote Valid Until` 的資料輸入仍在 `Quote Result`。
```

with:

```markdown
封裝 PAS Demand No、Quote Result、Quotation DB、Export Package 的 shared row layout。My Intake 可顯示 Quotation DB 候選報價，並在 Central IT 確認後套用候選資料進入 My Quote Result；Quotation DB 同時整合可 reuse 報價紀錄與 quote validity / expiry 追蹤；`Quote Valid Until` 的人工輸入與修正仍在 `Quote Result`。
```

- [ ] **Step 3: Run context grep checks**

Run:

```bash
rg -n "My Intake.*Quotation DB|Central IT.*套用|Quote Valid Until" 05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md 05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
```

Expected:

```text
05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md
05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
```

### Task 6: Run Full Verification And Keep Worktree Scope Clean

**Files:**
- Verify: `05-engineering-source/procurement-prototype/test.sh`
- Inspect: repository root git status

- [ ] **Step 1: Run full prototype test suite**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected:

```text
All available tests completed.
```

- [ ] **Step 2: Remove generated test artifacts if they appear**

Run:

```bash
cd /Users/kai-chenyang/Desktop/桌面\ -\ Kai-chen的MacBook\ Pro/Codex/資料庫建置
rm -rf 05-engineering-source/procurement-prototype/test-artifacts
```

Expected:

```text

```

- [ ] **Step 3: Inspect changed files**

Run:

```bash
git status --short
```

Expected changed files for this task:

```text
 M 05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
 M 05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md
 M 05-engineering-source/procurement-prototype/app.js
 M 05-engineering-source/procurement-prototype/index.html
 M 05-engineering-source/procurement-prototype/tests/layout-smoke.js
 M 05-engineering-source/procurement-prototype/tests/system-contract.test.js
 M 05-engineering-source/procurement-prototype/tests/unit.test.js
```

The repository currently has unrelated pre-existing dirty paths. Do not restore, stage, or commit these unrelated paths unless Kai explicitly asks.

- [ ] **Step 4: Optional commit only after Kai approval**

If Kai explicitly asks for a commit, stage only the task files:

```bash
git add \
  05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md \
  05-engineering-source/procurement-prototype/app.js \
  05-engineering-source/procurement-prototype/index.html \
  05-engineering-source/procurement-prototype/tests/layout-smoke.js \
  05-engineering-source/procurement-prototype/tests/system-contract.test.js \
  05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: apply quotation db records from my intake"
```

## Acceptance Criteria

- OM Purchasing sees a `Quotation DB` column/card in My Intake.
- Valid candidate shows vendor, valid-until status, quantity note, and `Confirm & Apply`.
- Expired candidate cannot be applied and still requires requote.
- `Confirm & Apply` requires assigned-row access.
- `Confirm & Apply` applies the existing Quotation DB record into the row.
- Applied row has PAS Demand No, PAS Material No, vendor, unit price, quote date, quote valid until, Central IT checked timestamp, and checked-by actor when the candidate contains those values.
- Applied row moves to My Quote Result when PAS Demand No is present or not required.
- My Quote Result keeps its current `Central IT Checked` action and quote editing behavior.
- Browser frontend does not directly connect to MySQL.
- Full `./test.sh` passes.

## Self-Review

Spec coverage:
- Kai asked whether Quotation DB data can be directly combined with My Intake so received demands can apply Quotation DB directly. Tasks 2 and 3 implement this via My Intake card and `Confirm & Apply`.
- Kai's earlier Central IT confirmation requirement is preserved in Tasks 2 and 3.
- Quotation expiry behavior remains in Quotation DB and expired candidates are blocked in Task 3.

Placeholder scan:
- No placeholder tokens or unspecified implementation steps remain.

Type consistency:
- Existing function names are preserved: `omQuoteDbCandidate`, `omQuoteDbCandidateStatus`, `applyQuoteDbCandidate`, `markOmCentralItChecked`, `movePasRowsToQuoteCompletion`.
- New function names are consistent across tests and implementation: `omIntakeQuotationDbCell`, `applyQuoteDbCandidateToOmRow`, `applyQuoteDbFromIntake`.
