# OM Leader Console Live Tracking Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OM Leader Console a read-only, source-backed tracking dashboard for OM stage, handoff, PR/PO, and delivery status while keeping OM Purchasing as the only PR/PO/ETA editing owner.

**Architecture:** Keep `OM Purchasing > OM Handoff` as the editing surface and `OM Leader Console` as the monitoring surface. Reuse existing `/api/om/leader-console` and `/api/om/procurement-tracking`; add dashboard-friendly derived metrics and a manual refresh / optional interval refresh in the frontend. Preserve the role boundary: OM Leader can view status and maintain project stage dates, but cannot edit PR/PO/ETA.

**Tech Stack:** Node.js HTTP server in `server.js`, browser app in `app.js`, static HTML/CSS, Node test runner, Playwright smoke tests.

---

## File Structure

- Modify: `app.js`
  - Add OM Leader tracking row model.
  - Add refresh timestamp and refresh action.
  - Add disabled/editable state helper for OM procurement inputs.
  - Rename handoff view labels to business-friendly terms.
- Modify: `index.html`
  - Add Leader Console refresh button and source freshness label.
  - Update Handoff internal view button labels.
- Modify: `styles.css`
  - Style Handoff segmented control as first-class UI instead of raw browser buttons.
  - Reduce visual dominance of exchange-rate utility in OM Handoff context.
- Modify: `tests/system-contract.test.js`
  - Assert source-backed Leader Console API and business-friendly labels.
- Modify: `tests/role-flow-smoke.js`
  - Assert OM Leader can see read-only PR/PO/delivery status and OM Purchasing can edit PR status.
- Modify: `_context/roles/04-om-leader.zh-TW.md`
  - Clarify monitoring fields and refresh semantics.
- Modify: `_context/roles/05-om-purchasing.zh-TW.md`
  - Clarify edit ownership and input failure messaging.

## Current Evidence

- `server.js` exposes `GET /api/om/leader-console`, `GET /api/om/procurement-tracking`, and `PATCH /api/om/requests/:id/procurement-tracking`.
- `app.js` hydrates `procurementTracking` in `hydrateOmLeaderConsoleRows()`, but `renderOmSubmission()` only shows a compressed `Buyer Handoff / PR` status, not PR status / PR# / PO status / PO# / ETA / DTA / Total LT.
- Playwright local and API smoke checks can update `prStatus` and `prNo` as OM Purchasing with HTTP 200. If a user cannot input, likely causes are stale session role, wrong role selected, or UI not clearly signaling editability / API failure.

## Task 1: Leader Console Read-Only Tracking Summary

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Test: `tests/system-contract.test.js`
- Test: `tests/role-flow-smoke.js`

- [ ] **Step 1: Write the failing system contract test**

Add this assertion near the OM Leader Console contract in `tests/system-contract.test.js`:

```js
assert.match(app, /function omLeaderTrackingSummaryCell/);
assert.match(app, /function omLeaderConsoleLastSyncedLabel/);
assert.match(app, /apiRequest\("\/api\/om\/leader-console"/);
assert.match(omView, /id="omLeaderConsoleSyncedAt"/);
assert.match(omView, /data-action="refreshOmLeaderConsole"/);
assert.match(omView, /PR \/ PO Summary/);
assert.match(omView, /Delivery Summary/);
```

- [ ] **Step 2: Run the contract test and confirm it fails**

Run:

```bash
node --test tests/system-contract.test.js
```

Expected: fail because `omLeaderTrackingSummaryCell`, `omLeaderConsoleSyncedAt`, and `refreshOmLeaderConsole` do not exist.

- [ ] **Step 3: Add Leader Console refresh UI**

In `index.html`, inside the `OM Leader Console` toolbar row, add:

```html
<div class="om-leader-console-sync">
  <span class="record-count" id="omLeaderConsoleSyncedAt">API sync pending</span>
  <button class="mini" type="button" data-action="refreshOmLeaderConsole">Refresh</button>
</div>
```

- [ ] **Step 4: Add Leader Console derived tracking cells**

In `app.js`, add these helpers near `omBuyerHandoffCell()`:

```js
let omLeaderConsoleSyncedAt = "";

function omLeaderConsoleLastSyncedLabel() {
  return omLeaderConsoleSyncedAt ? `Synced ${compactDateTime(omLeaderConsoleSyncedAt)}` : "API sync pending";
}

function omLeaderTrackingSummaryCell(group) {
  const rows = group.rows || [];
  const prValues = [...new Set(rows.map((row) => row.prNo).filter(Boolean))];
  const poValues = [...new Set(rows.map((row) => row.buyerPoNo || row.poNo).filter(Boolean))];
  const prStatuses = [...new Set(rows.map((row) => row.prStatus).filter(Boolean))];
  const poStatuses = [...new Set(rows.map((row) => row.poStatus).filter(Boolean))];
  const prLabel = prValues.length ? prValues.slice(0, 2).join(" / ") : prStatuses[0] || "PR Pending";
  const poLabel = poValues.length ? poValues.slice(0, 2).join(" / ") : poStatuses[0] || "PO Pending";
  return `
    <div class="om-leader-tracking-stack">
      <span class="status-pill ${statusClass(prLabel)}">${htmlText(prLabel)}</span>
      <span class="status-pill ${statusClass(poLabel)}">${htmlText(poLabel)}</span>
    </div>`;
}

function omLeaderDeliverySummaryCell(group) {
  const rows = group.rows || [];
  const etaValues = [...new Set(rows.map((row) => row.etaPlanDate || row.etaPlan).filter(Boolean))];
  const dtaValues = [...new Set(rows.map((row) => row.dtaActualDate || row.dtaActual).filter(Boolean))];
  const totalLt = rows.map((row) => row.totalLeadTimeDays).filter((value) => value !== "" && value !== undefined && value !== null);
  return `
    <div class="om-leader-tracking-stack">
      <span>ETA ${htmlText(etaValues[0] || "-")}</span>
      <span>DTA ${htmlText(dtaValues[0] || "-")}</span>
      <span>LT ${htmlText(totalLt[0] === undefined ? "-" : `${totalLt[0]}d`)}</span>
    </div>`;
}
```

- [ ] **Step 5: Wire cells into `renderOmSubmission()`**

In `renderOmSubmission()`, change the table header from:

```js
<th>Buyer Handoff / PR</th>
```

to:

```js
<th>PR / PO Summary</th>
<th>Delivery Summary</th>
```

Change the row cells from:

```js
<td>${omBuyerHandoffCell(row)}</td>
```

to:

```js
<td>${omLeaderTrackingSummaryCell(row)}</td>
<td>${omLeaderDeliverySummaryCell(row)}</td>
```

Update empty state colspan from `13` to `14`.

- [ ] **Step 6: Update sync label after API hydrate**

In `hydrateOmLeaderConsoleRows()`, after `applyOmProcurementTracking(...)`, add:

```js
omLeaderConsoleSyncedAt = new Date().toISOString();
const syncLabel = document.getElementById("omLeaderConsoleSyncedAt");
if (syncLabel) syncLabel.textContent = omLeaderConsoleLastSyncedLabel();
```

- [ ] **Step 7: Add refresh action**

In the document click handler, add:

```js
if (action === "refreshOmLeaderConsole") hydrateOmLeaderConsoleRows({ silent: false, role: currentRole });
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
node --test tests/system-contract.test.js
node tests/role-flow-smoke.js
```

Expected: both pass.

## Task 2: OM Purchasing PR/PO Input Reliability

**Files:**
- Modify: `app.js`
- Test: `tests/role-flow-smoke.js`

- [ ] **Step 1: Write the failing role smoke test**

Add this check after switching to `OM Purchasing > OM Handoff > PR / PO`:

```js
const prInputState = await page.evaluate(async () => {
  const select = document.querySelector('[data-om-procurement-field="prStatus"]');
  const input = document.querySelector('[data-om-procurement-field="prNo"]');
  const requestId = select?.dataset.omProcurementId || "";
  select.value = "Done";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  input.value = "PR-ROLE-SMOKE-001";
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 100));
  const row = requests.find((item) => item.id === requestId);
  return {
    selectDisabled: select.disabled,
    inputDisabled: input.disabled,
    prStatus: row?.prStatus || "",
    prNo: row?.prNo || "",
  };
});
if (prInputState.selectDisabled || prInputState.inputDisabled || prInputState.prStatus !== "Done" || prInputState.prNo !== "PR-ROLE-SMOKE-001") {
  fail("OM Purchasing should be able to edit PR status and PR number", prInputState);
}
```

- [ ] **Step 2: Run the smoke test**

Run:

```bash
node tests/role-flow-smoke.js
```

Expected: fail if inputs are disabled or state does not update.

- [ ] **Step 3: Add explicit editability helper**

In `app.js`, add near `canMaintainProjectStageCalendar()`:

```js
function canMaintainOmProcurementTrackingUi() {
  return currentRole === "omMember" || currentRole === "admin";
}
```

- [ ] **Step 4: Use the helper in procurement inputs**

Change `statusSelectHtml()` to accept disabled attributes:

```js
function statusSelectHtml(value, attrs, { disabled = false } = {}) {
  const selected = procurementStatusValue(value);
  return `<select ${attrs} ${disabled ? 'disabled title="Only OM Purchasing can edit PR / PO tracking."' : ""}>${PROCUREMENT_STATUS_OPTIONS.map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}
```

Change `omProcurementInput()`:

```js
function omProcurementInput(row, field, type = "text", placeholder = "") {
  const value = field === "purRequestNo" ? (row.purRequestNo || suggestPurRequestNo(row)) : (row[field] || "");
  const disabled = canMaintainOmProcurementTrackingUi() ? "" : 'disabled title="Only OM Purchasing can edit PR / PO tracking."';
  return `<input type="${type}" value="${htmlAttr(value)}" placeholder="${htmlAttr(placeholder)}" data-om-procurement-field="${field}" data-om-procurement-id="${htmlAttr(row.id)}" ${disabled} />`;
}
```

Change `omProcurementTrackingCell()` status selects:

```js
${statusSelectHtml(row.prStatus, `data-om-procurement-field="prStatus" data-om-procurement-id="${htmlAttr(row.id)}"`, { disabled: !canMaintainOmProcurementTrackingUi() })}
${statusSelectHtml(row.poStatus, `data-om-procurement-field="poStatus" data-om-procurement-id="${htmlAttr(row.id)}"`, { disabled: !canMaintainOmProcurementTrackingUi() })}
```

- [ ] **Step 5: Improve API failure copy**

In `updateOmProcurementField()`, replace the catch toast with:

```js
showToast(`PR / PO tracking was edited locally but API save failed: ${error.message}. Check that you are signed in as OM Purchasing.`, "error");
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
node tests/role-flow-smoke.js
node --test tests/api.test.js
```

Expected: both pass.

## Task 3: Visual Language And Business Wording Polish

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/system-contract.test.js`

- [ ] **Step 1: Write contract assertions for business labels**

Add in `tests/system-contract.test.js`:

```js
assert.match(exportPanel, />Handoff Prep</);
assert.match(exportPanel, />Procurement Tracking</);
assert.match(exportPanel, />Delivery Tracking</);
assert.doesNotMatch(exportPanel, />PR \/ PO<\/button>/);
assert.doesNotMatch(exportPanel, />Preparation<\/button>/);
```

- [ ] **Step 2: Rename internal view buttons**

In `index.html`, replace:

```html
<button class="segment active" type="button" data-om-handoff-view="prep">Preparation</button>
<button class="segment" type="button" data-om-handoff-view="prpo">PR / PO</button>
<button class="segment" type="button" data-om-handoff-view="delivery">Delivery</button>
```

with:

```html
<button class="segment active" type="button" data-om-handoff-view="prep">Handoff Prep</button>
<button class="segment" type="button" data-om-handoff-view="prpo">Procurement Tracking</button>
<button class="segment" type="button" data-om-handoff-view="delivery">Delivery Tracking</button>
```

- [ ] **Step 3: Style segmented control as system UI**

In `styles.css`, add:

```css
.om-handoff-view-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border: 1px solid #c8d8e0;
  border-radius: 6px;
  background: #f7fafb;
}

.om-handoff-view-tabs .segment {
  min-height: 28px;
  padding: 4px 10px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #47606b;
  font-weight: 800;
}

.om-handoff-view-tabs .segment.active {
  background: #0b5f86;
  color: #fff;
}
```

- [ ] **Step 4: Move exchange-rate visual weight down**

In `styles.css`, add:

```css
.om-rate-utility {
  margin-bottom: 8px;
}

[data-om-panel="finalExport"] .om-rate-utility {
  opacity: 0.82;
}
```

- [ ] **Step 5: Run contract and role smoke**

Run:

```bash
node --test tests/system-contract.test.js
node tests/role-flow-smoke.js
```

Expected: both pass with new labels.

## Task 4: Documentation And Full Verification

**Files:**
- Modify: `_context/roles/04-om-leader.zh-TW.md`
- Modify: `_context/roles/05-om-purchasing.zh-TW.md`

- [ ] **Step 1: Update OM Leader docs**

Add this bullet under QA:

```md
- OM Leader Console 是 read-only monitoring：可看 PR / PO Summary 與 Delivery Summary，但不可編輯 Budget / PR / PO / ETA / DTA / Total LT。
```

- [ ] **Step 2: Update OM Purchasing docs**

Add this bullet under QA:

```md
- `OM Handoff` 的 `Handoff Prep / Procurement Tracking / Delivery Tracking / All` 是同一功能內的 tracking view；只有 OM Purchasing / Admin 可編輯 PR / PO / ETA 欄位。
```

- [ ] **Step 3: Run full verification**

Run:

```bash
./test.sh
```

Expected:

```text
All available tests completed.
```

## Self-Review

Spec coverage:
- Q1 is covered by Task 1: Leader Console receives source-backed PR/PO/delivery summaries with sync freshness.
- Q2 is covered by Task 2: OM Purchasing PR status and PR number editability is explicitly tested.
- Q3 is covered by Task 3: labels and segmented-control visual language are polished.

Placeholder scan:
- No TBD/TODO/later placeholders.
- Every task has concrete files, snippets, commands, and expected outcomes.

Type consistency:
- `omLeaderTrackingSummaryCell`, `omLeaderDeliverySummaryCell`, `omLeaderConsoleLastSyncedLabel`, and `canMaintainOmProcurementTrackingUi` are consistently named across tests and implementation steps.
