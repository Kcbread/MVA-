# OM PAS Quote Excel Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let OM Purchasing enter PAS Demand No in My Intake, complete PAS quote information in My Quote Result / Monitor, explicitly confirm whether same-demand rows should be merged, then generate a grouped PAS Excel package and create the system-side file record.

**Architecture:** Keep role ownership in OM Purchasing: the system detects same PAS Demand No and proposes groupings, but it never auto-merges as a hidden decision. Add grouping helpers to `om-business-flow.js`, surface lightweight grouping hints in My Intake, add an explicit merge/split confirmation in My Quote Result / Monitor, and keep Excel generation tied to confirmed OM-selected rows.

**Tech Stack:** Static HTML/CSS/JavaScript prototype, Node `node:test`, existing workbook generation helper in `app.js`, existing `./test.sh` verification flow.

---

## Business Decision

Recommended behavior:

- My Intake remains the place where OM enters `PAS Demand No`.
- When multiple assigned rows share the same `PAS Demand No`, My Intake shows a non-blocking suggestion: `Same PAS Demand No group: N items`.
- My Intake must not auto-merge rows because OM may intentionally keep rows separate for different quote evidence, vendor result, validity, or export timing.
- My Quote Result / Monitor is where OM confirms the package behavior:
  - `Merge for one PAS Excel` creates one workbook per confirmed PAS Demand No group.
  - `Keep separate` exports row-level workbooks even if the PAS Demand No matches.
- File evidence stays row-level for quote screenshot and quote Excel.
- The generated PAS Excel package becomes group-level metadata after confirmation, with row-level audit events attached to every included row.

This preserves the project rule that OM Purchasing handles assigned rows only and does not redefine OM Leader assignment or any approval owner.

## Boundary Map

**Feature:** OM Purchasing PAS quote package preparation.

**Function:** Detect rows with the same PAS Demand No, let OM confirm grouped vs separate Excel output, generate the Excel package, and create system-side file metadata after confirmation.

**Module:** `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`; `05-engineering-source/procurement-prototype/app.js`; `05-engineering-source/procurement-prototype/index.html`; `05-engineering-source/procurement-prototype/styles.css`; `05-engineering-source/procurement-prototype/tests/unit.test.js`; `05-engineering-source/procurement-prototype/tests/system-contract.test.js`; `05-engineering-source/procurement-prototype/tests/layout-smoke.js`.

**Non-scope:** OM Leader assignment rules, Dept DRI / Cost Manager / Budget Approver approvals, Requester visibility, buyer PR/PO handoff behavior, persistent API upload implementation.

**Validation:** Focused unit tests for grouping decisions, system contract tests for visible intake and quote result controls, layout smoke for table stability, then full `./test.sh`.

## File Structure

- Modify `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
  - Add PAS Demand No normalization.
  - Add grouping suggestion and Excel export grouping helpers.
  - Keep the existing `groupRowsByPasDemandId()` behavior compatible.
- Modify `05-engineering-source/procurement-prototype/tests/unit.test.js`
  - Add tests for normalized PAS Demand No grouping.
  - Add tests for OM merge decision controlling grouped vs separate Excel output.
- Modify `05-engineering-source/procurement-prototype/app.js`
  - Show same-demand suggestion in `pasDemandNoEntryHtml(row)`.
  - Add a group confirmation cell to Quote Result / Monitor rows.
  - Update `exportPasExcel()` to honor `pasExcelMergeDecision`.
  - Record `pasExcelSystemFileName`, `pasExcelSystemFileCreatedAt`, and `pasExcelGroupId` after export.
- Modify `05-engineering-source/procurement-prototype/index.html`
  - Add a `PAS Excel Group` column to the Quote Result / Monitor table header and colgroup.
- Modify `05-engineering-source/procurement-prototype/styles.css`
  - Add compact styles for group suggestions and the merge/split segmented control.
  - Adjust Quote Result / Monitor column widths to keep file buttons and group controls inside cells.
- Modify `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Assert My Intake contains same-demand grouping language.
  - Assert Quote Result / Monitor contains the group confirmation control.
- Modify `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
  - Keep existing quote-result overflow checks passing after the added column.

## Acceptance Criteria

- OM can type the same PAS Demand No on multiple assigned rows in My Intake.
- The system shows same-demand suggestions, but does not move or merge rows by itself.
- My Quote Result / Monitor displays the group count and merge decision for same-demand rows.
- Default behavior for same-demand rows is `Merge for one PAS Excel`; OM can switch a row/group to `Keep separate`.
- `exportPasExcel()` produces one workbook for confirmed merged groups and separate workbooks for rows marked separate.
- Export history names every row included in the workbook.
- Quote screenshot and uploaded quote Excel remain row-level evidence and are still required before sending the quote onward.
- Requester-facing views still hide vendor, PAS material, factory material, OM assignee, and internal quote package fields.

## Task 1: Add PAS Grouping Helpers

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Write failing unit tests**

Insert this test block after the existing test named `OM PAS Excel grouping combines items by PAS Demand ID` in `tests/unit.test.js`:

```js
test("OM PAS Excel grouping normalizes PAS Demand No and exposes merge suggestions", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: " PAS-100 ", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "pas-100", name: "Monitor" },
    { id: "REQ-3", pasDemandNo: "PAS-200", name: "Barcode Scanner" },
    { id: "REQ-4", pasDemandNo: "", name: "Keyboard" },
  ];

  assert.equal(omBusinessFlow.normalizePasDemandNo(" PAS-100 "), "PAS-100");
  assert.equal(omBusinessFlow.normalizePasDemandNo("pas-100"), "PAS-100");

  const suggestion = omBusinessFlow.pasDemandGroupSuggestion(rows[0], rows);
  assert.equal(suggestion.hasGroup, true);
  assert.equal(suggestion.pasDemandId, "PAS-100");
  assert.deepEqual(suggestion.rowIds, ["REQ-1", "REQ-2"]);
  assert.equal(suggestion.message, "Same PAS Demand No group: 2 items");

  const noSuggestion = omBusinessFlow.pasDemandGroupSuggestion(rows[2], rows);
  assert.equal(noSuggestion.hasGroup, false);
  assert.equal(noSuggestion.message, "No same-demand group");
});

test("OM PAS Excel export grouping follows OM merge decisions", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Monitor" },
    { id: "REQ-3", pasDemandNo: "PAS-100", pasExcelMergeDecision: "separate", name: "Dock" },
    { id: "REQ-4", pasDemandNo: "PAS-200", name: "Barcode Scanner" },
  ];

  const groups = omBusinessFlow.groupRowsForPasExcelExport(rows);

  assert.deepEqual(groups.map((group) => group.pasDemandId), ["PAS-100", "PAS-100__REQ-3", "PAS-200"]);
  assert.deepEqual(groups[0].rows.map((row) => row.id), ["REQ-1", "REQ-2"]);
  assert.deepEqual(groups[1].rows.map((row) => row.id), ["REQ-3"]);
  assert.equal(groups[0].mergeDecision, "merge");
  assert.equal(groups[1].mergeDecision, "separate");
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected: FAIL with `omBusinessFlow.normalizePasDemandNo is not a function`.

- [ ] **Step 3: Implement grouping helpers**

In `app-modules/om-business-flow.js`, replace the current `groupRowsByPasDemandId(rows = [])` function with this implementation and insert the new helper functions immediately above it:

```js
  function normalizePasDemandNo(value = "") {
    return String(value || "").trim().replace(/\s+/g, " ").toUpperCase();
  }

  function pasDemandGroupSuggestion(row = {}, rows = []) {
    const pasDemandId = normalizePasDemandNo(row.pasDemandNo || row.pasDemandId || "");
    if (!pasDemandId) {
      return { hasGroup: false, pasDemandId: "", rowIds: [], rows: [], message: "No PAS Demand No" };
    }
    const groupRows = rows.filter((candidate) => normalizePasDemandNo(candidate.pasDemandNo || candidate.pasDemandId || "") === pasDemandId);
    const hasGroup = groupRows.length > 1;
    return {
      hasGroup,
      pasDemandId,
      rowIds: groupRows.map((candidate) => candidate.id).filter(Boolean),
      rows: groupRows,
      message: hasGroup ? `Same PAS Demand No group: ${groupRows.length} items` : "No same-demand group",
    };
  }

  function groupRowsByPasDemandId(rows = []) {
    const groups = new Map();
    rows.forEach((row) => {
      const pasDemandId = normalizePasDemandNo(row.pasDemandNo || row.pasDemandId || "") || "PAS-Demand-Pending";
      if (!groups.has(pasDemandId)) groups.set(pasDemandId, []);
      groups.get(pasDemandId).push(row);
    });
    return [...groups.entries()].map(([pasDemandId, groupRows]) => ({ pasDemandId, rows: groupRows }));
  }

  function groupRowsForPasExcelExport(rows = []) {
    const grouped = new Map();
    rows.forEach((row) => {
      const pasDemandId = normalizePasDemandNo(row.pasDemandNo || row.pasDemandId || "") || "PAS-Demand-Pending";
      const mergeDecision = row.pasExcelMergeDecision === "separate" ? "separate" : "merge";
      const key = mergeDecision === "separate" ? `${pasDemandId}__${row.id || grouped.size + 1}` : pasDemandId;
      if (!grouped.has(key)) grouped.set(key, { pasDemandId: key, displayPasDemandId: pasDemandId, mergeDecision, rows: [] });
      grouped.get(key).rows.push(row);
    });
    return [...grouped.values()];
  }
```

Then add these exports to the `api` object:

```js
    normalizePasDemandNo,
    pasDemandGroupSuggestion,
    groupRowsForPasExcelExport,
```

- [ ] **Step 4: Re-run the focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app-modules/om-business-flow.js 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: add OM PAS Excel grouping helpers"
```

## Task 2: Show Same-Demand Suggestions In My Intake

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing system contract assertions**

Append these assertions inside the existing test named `OM tabs and PAS quote result contract are consolidated` in `tests/system-contract.test.js`:

```js
  assert.match(app, /function omPasDemandGroupSuggestionHtml/);
  assert.match(app, /Same PAS Demand No group/);
  assert.match(app, /data-pas-group-id/);
```

- [ ] **Step 2: Run the contract test and confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: FAIL because `omPasDemandGroupSuggestionHtml` is not present.

- [ ] **Step 3: Add the intake suggestion helper**

Insert this function immediately before `pasDemandNoEntryHtml(row)` in `app.js`:

```js
function omPasDemandGroupSuggestionHtml(row) {
  const suggestion = omBusinessFlowModule().pasDemandGroupSuggestion?.(row, omPasRequestRows()) || { hasGroup: false, message: "No same-demand group", pasDemandId: "", rowIds: [] };
  if (!suggestion.hasGroup) return "";
  return `
    <div class="pas-demand-group-suggestion" data-pas-group-id="${htmlAttr(suggestion.pasDemandId)}" title="${htmlAttr(suggestion.rowIds.join(", "))}">
      ${htmlText(suggestion.message)}
      <span>OM confirms merge in Quote Result / Monitor.</span>
    </div>`;
}
```

- [ ] **Step 4: Render the suggestion under PAS Demand No**

Replace the return body inside `pasDemandNoEntryHtml(row)` with this exact return block:

```js
  return `
    <div class="pas-demand-entry ${demandNo ? "ready" : "pending"}">
      <label class="pas-demand-entry-field">
        <span>PAS Demand No</span>
        <input class="pas-inline-input" type="text" value="${htmlAttr(demandNo)}" placeholder="Enter PAS Demand No" data-om-field="pasDemandNo" data-om-id="${row.id}" ${disabled} />
      </label>
      <span class="status-pill ${statusClass(requirement.label)}">${requirement.label}</span>
      ${omPasDemandGroupSuggestionHtml(row)}
      <div class="om-cell-helper">${omRowAccessReason(row) || (demandNo ? `Recorded ${compactDateTime(row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt)}` : requirement.reason)}</div>
    </div>`;
```

- [ ] **Step 5: Re-run the contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: suggest same PAS Demand No groups in OM intake"
```

## Task 3: Add OM Merge Decision In My Quote Result / Monitor

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/styles.css`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing system contract assertions**

Append these assertions inside the existing test named `OM tabs and PAS quote result contract are consolidated`:

```js
  assert.match(omView, /PAS Excel Group/);
  assert.match(app, /function omPasExcelGroupDecisionCell/);
  assert.match(app, /data-om-pas-excel-group/);
  assert.match(app, /Merge for one PAS Excel/);
  assert.match(app, /Keep separate/);
```

- [ ] **Step 2: Run the contract test and confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: FAIL because the column and helper do not exist yet.

- [ ] **Step 3: Add the quote-result group decision helper**

Insert this function immediately before `omQuoteResultFileCell(row, readOnly)` in `app.js`:

```js
function omPasExcelGroupDecisionCell(row, readOnly) {
  const suggestion = omBusinessFlowModule().pasDemandGroupSuggestion?.(row, omQuoteConfirmRows()) || { hasGroup: false, pasDemandId: "", rows: [], message: "No same-demand group" };
  const decision = row.pasExcelMergeDecision === "separate" ? "separate" : "merge";
  if (!suggestion.hasGroup) {
    return `<div class="pas-excel-group-cell"><span class="status-pill neutral">Single row</span><div class="reason-text">No same-demand group</div></div>`;
  }
  if (readOnly) {
    return `<div class="pas-excel-group-cell"><span class="status-pill ${decision === "merge" ? "success" : "warning"}">${decision === "merge" ? "Merged Excel" : "Separate Excel"}</span><div class="reason-text">${htmlText(suggestion.message)}</div></div>`;
  }
  return `
    <div class="pas-excel-group-cell">
      <span class="status-pill ${decision === "merge" ? "success" : "warning"}">${htmlText(suggestion.message)}</span>
      <div class="segmented-mini" data-pas-group-id="${htmlAttr(suggestion.pasDemandId)}">
        <label title="Generate one PAS Excel workbook for rows with this PAS Demand No">
          <input type="radio" name="pas-excel-group-${htmlAttr(row.id)}" value="merge" data-om-pas-excel-group="${htmlAttr(row.id)}" ${decision === "merge" ? "checked" : ""} />
          Merge for one PAS Excel
        </label>
        <label title="Generate a separate PAS Excel workbook for this row">
          <input type="radio" name="pas-excel-group-${htmlAttr(row.id)}" value="separate" data-om-pas-excel-group="${htmlAttr(row.id)}" ${decision === "separate" ? "checked" : ""} />
          Keep separate
        </label>
      </div>
    </div>`;
}
```

- [ ] **Step 4: Render the new cell in Quote Result / Monitor**

In `renderOmQuoteConfirmRows(rows)`, insert this table cell immediately after the PAS Demand No cell:

```js
        <td>${omPasExcelGroupDecisionCell(row, readOnly)}</td>
```

Then update every `colspan="20"` in the same function to `colspan="21"`.

- [ ] **Step 5: Add a change listener**

In the document `change` event handler near the existing `data-om-price-currency` handling, insert:

```js
  const pasExcelGroupId = event.target.dataset.omPasExcelGroup;
  if (pasExcelGroupId) {
    updateOmPasExcelMergeDecision(pasExcelGroupId, event.target.value);
  }
```

Then insert this function near `updateOmField(requestId, field, value)`:

```js
function updateOmPasExcelMergeDecision(requestId, decision) {
  const normalizedDecision = decision === "separate" ? "separate" : "merge";
  requests = requests.map((row) => row.id === requestId ? { ...row, pasExcelMergeDecision: normalizedDecision } : row);
  const updated = requests.find((row) => row.id === requestId);
  if (updated) addOmHistory(updated, "PAS Excel grouping decision", normalizedDecision === "merge" ? "Merge for one PAS Excel." : "Keep separate PAS Excel.");
  renderOmPurchasing();
}
```

- [ ] **Step 6: Update static table structure**

In `index.html`, add this column in the OM Quote Result / Monitor table colgroup after the PAS Demand No column:

```html
<col class="om-quote-col-group" />
```

Add this header after `<th>PAS Demand No</th>`:

```html
<th>PAS Excel Group</th>
```

- [ ] **Step 7: Add styles**

Append this CSS near the existing `.om-quote-result-table` styles in `styles.css`:

```css
.om-quote-result-table col.om-quote-col-group {
  width: 190px;
}

.pas-demand-group-suggestion,
.pas-excel-group-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.pas-demand-group-suggestion {
  padding: 4px 6px;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  line-height: 1.25;
}

.pas-demand-group-suggestion span {
  color: #475569;
}

.segmented-mini {
  display: grid;
  gap: 4px;
}

.segmented-mini label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 3px 6px;
  border: 1px solid #d8dee8;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 11px;
  line-height: 1.2;
}

.segmented-mini input {
  margin: 0;
  flex: 0 0 auto;
}
```

- [ ] **Step 8: Re-run the contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/styles.css 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: confirm PAS Excel grouping in quote result"
```

## Task 4: Honor Merge Decisions During Excel Export And System File Creation

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing system contract assertions**

Append these assertions inside the existing test named `OM tabs and PAS quote result contract are consolidated`:

```js
  assert.match(app, /function createPasExcelSystemFileRecord/);
  assert.match(app, /groupRowsForPasExcelExport/);
  assert.match(app, /pasExcelSystemFileName/);
  assert.match(app, /PAS Excel system file created/);
```

- [ ] **Step 2: Run the contract test and confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: FAIL because the system-file metadata helper does not exist.

- [ ] **Step 3: Add the system file metadata helper**

Insert this function immediately before `exportPasExcel()` in `app.js`:

```js
function createPasExcelSystemFileRecord(group, fileName, createdAt = new Date().toISOString()) {
  const groupRows = group.rows || [];
  const groupId = group.displayPasDemandId || group.pasDemandId || "PAS-Demand-Pending";
  const rowIds = new Set(groupRows.map((row) => row.id));
  requests = requests.map((row) => {
    if (!rowIds.has(row.id)) return row;
    return {
      ...row,
      pasExcelGroupId: groupId,
      pasExcelMergeDecision: group.mergeDecision || row.pasExcelMergeDecision || "merge",
      pasExcelSystemFileName: fileName,
      pasExcelSystemFileCreatedAt: createdAt,
    };
  });
  groupRows.forEach((row) => {
    const updated = requests.find((item) => item.id === row.id) || row;
    addOmHistory(updated, "PAS Excel system file created", `${fileName} includes ${groupRows.length} item${groupRows.length === 1 ? "" : "s"}.`);
  });
}
```

- [ ] **Step 4: Replace grouping logic in `exportPasExcel()`**

Inside `exportPasExcel()`, replace this line:

```js
  const groups = omBusinessFlowModule().groupRowsByPasDemandId?.(rows) || [{ pasDemandId: rows[0].pasDemandNo || "PAS-Demand-Pending", rows }];
```

with:

```js
  const groups = omBusinessFlowModule().groupRowsForPasExcelExport?.(rows) || omBusinessFlowModule().groupRowsByPasDemandId?.(rows) || [{ pasDemandId: rows[0].pasDemandNo || "PAS-Demand-Pending", rows }];
```

Then replace:

```js
    const safePasDemandId = String(group.pasDemandId || "PAS-Demand-Pending").replace(/[^a-zA-Z0-9._-]+/g, "-");
    downloadXlsx(`${safePasDemandId}-PAS-Tracking.xlsx`, [{
```

with:

```js
    const workbookDemandId = group.displayPasDemandId || group.pasDemandId || "PAS-Demand-Pending";
    const safePasDemandId = String(group.pasDemandId || workbookDemandId).replace(/[^a-zA-Z0-9._-]+/g, "-");
    const fileName = `${safePasDemandId}-PAS-Tracking.xlsx`;
    downloadXlsx(fileName, [{
```

Replace the demand header row:

```js
        ["Demand No", group.pasDemandId || "Waiting PAS Demand No", "PAS Material No", firstRow.pasMaterialNo || "Waiting PAS Material No", "Demand Date", pasDemandDate(firstRow), "Legal Name", pasLegalName(firstRow), "Request Dept", pasRequestDept(firstRow), "Data Transfer To", pasDataTransferTo(firstRow), ""],
```

with:

```js
        ["Demand No", workbookDemandId || "Waiting PAS Demand No", "PAS Material No", firstRow.pasMaterialNo || "Waiting PAS Material No", "Demand Date", pasDemandDate(firstRow), "Legal Name", pasLegalName(firstRow), "Request Dept", pasRequestDept(firstRow), "Data Transfer To", pasDataTransferTo(firstRow), ""],
```

Immediately after the `downloadXlsx(...)` call closes for each group, add:

```js
    createPasExcelSystemFileRecord(group, fileName);
```

- [ ] **Step 5: Update export history wording**

Replace this line in `exportPasExcel()`:

```js
  rows.forEach((row) => addOmHistory(row, "Exported PAS Tracking Excel", `${row.pasDemandNo || "PAS-Demand-Pending"} PAS tracking exported.`));
```

with:

```js
  rows.forEach((row) => addOmHistory(row, "Exported PAS Tracking Excel", `${row.pasExcelSystemFileName || row.pasDemandNo || "PAS-Demand-Pending"} PAS tracking exported.`));
```

- [ ] **Step 6: Re-run the contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: create PAS Excel file metadata from grouping decisions"
```

## Task 5: Verify Layout And Full Test Flow

**Files:**
- Modify only if test failures identify exact stale expectations:
  - `05-engineering-source/procurement-prototype/tests/layout-smoke.js`
  - `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - `05-engineering-source/procurement-prototype/styles.css`

- [ ] **Step 1: Run syntax and focused test suite**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --check app.js
node --check app-modules/om-business-flow.js
node --test tests/unit.test.js tests/system-contract.test.js
```

Expected: PASS.

- [ ] **Step 2: Run the full project verification**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected: `All available tests completed.`

- [ ] **Step 3: If Quote Result / Monitor overflows, reduce column widths**

If `tests/layout-smoke.js` fails with `OM Quote Result / Monitor should scroll inside table shell` or button overlap, update these widths in `styles.css`:

```css
.om-quote-result-table col.om-quote-col-item { width: 240px; }
.om-quote-result-table col.om-quote-col-group { width: 170px; }
.om-quote-result-table col.om-quote-col-status { width: 190px; }
.om-quote-result-table col.om-quote-col-assignee { width: 150px; }
```

Then re-run:

```bash
cd 05-engineering-source/procurement-prototype
node tests/layout-smoke.js
./test.sh
```

Expected: PASS for layout smoke and full suite.

- [ ] **Step 4: Commit final verification fixes**

```bash
git add 05-engineering-source/procurement-prototype/styles.css 05-engineering-source/procurement-prototype/tests/layout-smoke.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "test: verify OM PAS Excel grouping layout"
```

## Self-Review

Spec coverage:

- My Intake enters PAS quote ID / PAS Demand No: covered by Task 2.
- My Quote Result enters PAS quote information: preserved in existing Quote Result / Monitor and extended in Task 3.
- PAS information remains visible in Quote Result / Monitor: preserved by Task 3.
- Quote screenshot file button remains row-level: preserved by Task 3 and acceptance criteria.
- Generate Excel from PAS information: covered by Task 4.
- Confirm before system-side file creation: covered by Task 3 decision and Task 4 metadata creation after export.
- One PAS ID containing multiple items: covered by Tasks 1, 3, and 4.
- OM owns merge decision: covered by Task 3.

Placeholder scan:

- No placeholder marker or generic placeholder step remains.

Type consistency:

- `normalizePasDemandNo`, `pasDemandGroupSuggestion`, `groupRowsForPasExcelExport`, `pasExcelMergeDecision`, `pasExcelGroupId`, `pasExcelSystemFileName`, and `pasExcelSystemFileCreatedAt` use consistent names across tests, module helpers, and UI code.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-29-om-pas-quote-excel-grouping.md`. Two execution options:

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.
