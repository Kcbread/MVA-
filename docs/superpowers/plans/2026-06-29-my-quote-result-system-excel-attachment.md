# My Quote Result System Excel Attachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make OM Purchasing `My Quote Result` confirmation generate a PAS Tracking Excel workbook from OM-entered quote data, merge rows with the same PAS Demand No into one workbook by default, and automatically attach the generated workbook to the system for later reuse.

**Architecture:** Extend the existing PAS Excel grouping work instead of replacing it. Keep manual quote screenshot and vendor quote Excel as row-level evidence, then create a separate system-generated PAS Tracking Excel attachment when OM validates quote result data. In API mode the generated workbook is uploaded to `/api/attachments`; in static prototype mode the same rows receive metadata-only attachment records so the UI and tests can distinguish `mock/local metadata` from real upload execution.

**Tech Stack:** Static HTML/CSS/JavaScript prototype, existing browser-side `.xlsx` writer in `app.js`, existing Node `/api/attachments`, MySQL `attachments` table metadata, Node `node:test`, existing `./test.sh` verification flow.

---

## Startup Context Receipt

Read: `README.md`; `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`; `01-pm-owner/project-progress/MASTER_PM_LEDGER.md`; `01-pm-owner/project-progress/WORKTREE_TRIAGE_20260613.md`; `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/flows/exception-flow.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/modules/api-readiness.zh-TW.md`; `05-engineering-source/procurement-prototype/db/workflow-api-table-map.zh-TW.md`; `docs/superpowers/plans/2026-06-29-om-pas-quote-excel-grouping.md`.

Roles: `OM Purchasing`, `OM Leader`, `Buyer Handoff`.

Flows/Modules: `pm-master-flow`, `exception-flow`, `OMWorkflowTable`, `Attachments / Evidence`, `Workflow API / Table Map`.

Worktree: inspected with `git status --short --branch`; branch `codex/terminology-convergence-20260618`; many existing modified/deleted/untracked files are present. This plan only adds this document and must not stage unrelated product, archive, handoff, deployment, or generated-output changes.

Decisions: OM Purchasing owns assigned quote rows; quote screenshot/image and quote Excel remain required; quote date and quote received date are the same; `Validate Quote` currently evaluates price decision and Quotation DB retention but does not mean real execution writing `pas_quotes`; first API attachment storage is metadata plus guarded download.

Gaps: exact production storage policy for generated system Excel is not locked beyond existing `/api/attachments`; mark production `pas_quotes` persistence as out of scope for this plan.

Next: implement the tasks below after choosing an execution mode.

## Business Behavior

Current intended behavior from Kai:

- In `My Quote Result`, OM Purchasing inputs quote result information.
- On confirmation, the system generates an Excel workbook from those inputs.
- If multiple rows share the same PAS Demand No, the system creates one total workbook for that PAS Demand No unless OM explicitly marks a row/group as separate.
- After confirmation, the generated workbook is attached in the system and available for the next retrieval/use.

Important distinction:

- `quotationExcel`: vendor/source quote Excel uploaded by OM. This remains row-level evidence and is required.
- `pasExcelSystemFileName` plus `pasExcelSystemAttachmentId`: system-generated PAS Tracking Excel created from the confirmed `My Quote Result` data. This is group-level metadata written back to every included row.

## Boundary Map

**Feature:** OM Purchasing My Quote Result system-generated PAS Excel attachment.

**Function:** Validate quote result, group same PAS Demand No rows, generate a PAS Tracking `.xlsx`, upload or locally record it as an OM-internal attachment, and show/reuse the generated file metadata in quote/export surfaces.

**Module:** `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`; `05-engineering-source/procurement-prototype/app.js`; `05-engineering-source/procurement-prototype/server.js` only if the current attachment guard test fails; `05-engineering-source/procurement-prototype/tests/unit.test.js`; `05-engineering-source/procurement-prototype/tests/system-contract.test.js`; `05-engineering-source/procurement-prototype/tests/api.test.js`; `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`; `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`; `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`.

**Non-scope:** OM Leader assignment, Requester visibility changes, Dept DRI / Cost Manager / Budget Approver approval rules, new `pas_quotes` migration, production object-storage implementation, Buyer Handoff PR/PO editing.

**Validation:** focused unit tests for stable file metadata, system contract tests for UI/action wiring, API test for generated OM attachment kind, price-routing smoke tests for async confirmation route, then full `./test.sh`.

## File Structure

- Modify `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
  - Add stable system file naming and attachment metadata helpers.
  - Reuse existing `normalizePasDemandNo()` and `groupRowsForPasExcelExport()`.
- Modify `05-engineering-source/procurement-prototype/app.js`
  - Extract PAS workbook sheet construction from `exportPasExcel()`.
  - Add generated workbook upload/record logic.
  - Add an async quote-result confirmation wrapper around existing `saveOmQuoteInfoRows()`.
  - Show generated system Excel metadata in `My Quote Result` file cell/completion area.
- Modify `05-engineering-source/procurement-prototype/tests/unit.test.js`
  - Verify stable file names and metadata payload for merged and separate PAS groups.
- Modify `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Verify the UI has system-generated attachment helpers and visible metadata labels.
- Modify `05-engineering-source/procurement-prototype/tests/api.test.js`
  - Verify `om_pas_tracking_system_excel` can be uploaded by OM and blocked from Requester download.
- Modify `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`
  - Await the async quote confirmation wrapper where quote validation is used as part of routing.
- Modify context docs:
  - `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
  - `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

## Acceptance Criteria

- `Validate Quote` completes only after required quote fields, screenshot, and uploaded vendor quote Excel exist.
- After validation, the system generates one PAS Tracking workbook per effective PAS Demand No group.
- Rows with the same normalized PAS Demand No and `pasExcelMergeDecision !== "separate"` share one generated workbook record.
- Rows marked `pasExcelMergeDecision === "separate"` receive their own generated workbook record even when PAS Demand No matches another row.
- In API mode, the generated workbook uploads to `/api/attachments` with `attachmentKind = "om_pas_tracking_system_excel"` and `visibilityScope = "om_internal"`.
- In static/local prototype mode, no real upload is claimed; rows receive metadata-only generated file fields with `pasExcelSystemAttachmentMode = "local-metadata"`.
- `My Quote Result`, `Quotation DB` detail, and `Export Package` detail can display the generated PAS Excel file name and link when `pasExcelSystemAttachmentId` or URL exists.
- Requester cannot download or see OM-internal generated PAS Excel.
- Existing price decision behavior remains unchanged.

## Task 1: Add Stable System Excel Metadata Helpers

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Write the failing unit tests**

Append this block after the existing test named `OM PAS Excel export grouping follows OM merge decisions` in `05-engineering-source/procurement-prototype/tests/unit.test.js`:

```js
test("OM PAS Excel system attachment metadata is stable for merged groups", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: " pas-100 ", pasExcelMergeDecision: "merge", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Monitor" },
  ];
  const group = omBusinessFlow.groupRowsForPasExcelExport(rows)[0];
  const summary = omBusinessFlow.pasExcelSystemAttachmentSummary(group, "2026-06-29T08:00:00.000Z");

  assert.equal(summary.fileName, "PAS-100-PAS-Tracking.xlsx");
  assert.equal(summary.linkedEntityType, "om_pas_excel_group");
  assert.equal(summary.linkedEntityId, "PAS-100");
  assert.equal(summary.attachmentKind, "om_pas_tracking_system_excel");
  assert.equal(summary.visibilityScope, "om_internal");
  assert.deepEqual(summary.rowIds, ["REQ-1", "REQ-2"]);
  assert.deepEqual(summary.metadata, {
    source: "system_generated_pas_excel",
    pasDemandNo: "PAS-100",
    mergeDecision: "merge",
    rowIds: ["REQ-1", "REQ-2"],
    rowCount: 2,
    createdAt: "2026-06-29T08:00:00.000Z",
  });
});

test("OM PAS Excel system attachment metadata separates row-level override groups", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "PAS-100", pasExcelMergeDecision: "separate", name: "Dock" },
  ];
  const groups = omBusinessFlow.groupRowsForPasExcelExport(rows);
  const separateSummary = omBusinessFlow.pasExcelSystemAttachmentSummary(groups[1], "2026-06-29T08:00:00.000Z");

  assert.equal(separateSummary.fileName, "PAS-100__REQ-2-PAS-Tracking.xlsx");
  assert.equal(separateSummary.linkedEntityId, "PAS-100__REQ-2");
  assert.deepEqual(separateSummary.rowIds, ["REQ-2"]);
  assert.equal(separateSummary.metadata.mergeDecision, "separate");
});
```

- [ ] **Step 2: Run the focused test to confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected: FAIL with `omBusinessFlow.pasExcelSystemAttachmentSummary is not a function`.

- [ ] **Step 3: Implement the helpers**

In `05-engineering-source/procurement-prototype/app-modules/om-business-flow.js`, insert this code immediately after `groupRowsForPasExcelExport(rows = [])`:

```js
  function safePasExcelFilePart(value = "") {
    const normalized = normalizePasDemandNo(value);
    return normalized.replace(/[^a-zA-Z0-9._-]+/g, "-") || "PAS-Demand-Pending";
  }

  function pasExcelSystemFileName(group = {}) {
    const groupId = group.pasDemandId || group.displayPasDemandId || "PAS-Demand-Pending";
    return `${safePasExcelFilePart(groupId)}-PAS-Tracking.xlsx`;
  }

  function pasExcelSystemAttachmentSummary(group = {}, createdAt = new Date().toISOString()) {
    const rows = group.rows || [];
    const displayPasDemandId = normalizePasDemandNo(group.displayPasDemandId || group.pasDemandId || "") || "PAS-Demand-Pending";
    const linkedEntityId = group.pasDemandId || displayPasDemandId;
    const rowIds = rows.map((row) => row.id).filter(Boolean);
    const mergeDecision = group.mergeDecision || "merge";
    return {
      fileName: pasExcelSystemFileName(group),
      linkedEntityType: "om_pas_excel_group",
      linkedEntityId,
      attachmentKind: "om_pas_tracking_system_excel",
      visibilityScope: "om_internal",
      rowIds,
      metadata: {
        source: "system_generated_pas_excel",
        pasDemandNo: displayPasDemandId,
        mergeDecision,
        rowIds,
        rowCount: rows.length,
        createdAt,
      },
    };
  }
```

Add these exports to the `api` object in the same file:

```js
    pasExcelSystemFileName,
    pasExcelSystemAttachmentSummary,
```

- [ ] **Step 4: Re-run the focused test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app-modules/om-business-flow.js 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: add OM PAS system Excel metadata helpers"
```

## Task 2: Extract PAS Workbook Creation And Attachment Recording

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing system contract assertions**

Inside the existing `OM tabs and PAS quote result contract are consolidated` test in `05-engineering-source/procurement-prototype/tests/system-contract.test.js`, append these assertions near the existing `pasExcelSystemFileName` assertions:

```js
  assert.match(app, /function pasExcelWorkbookSheet/);
  assert.match(app, /async function uploadGeneratedPasExcelAttachment/);
  assert.match(app, /async function ensurePasExcelSystemFileForGroups/);
  assert.match(app, /om_pas_tracking_system_excel/);
  assert.match(app, /pasExcelSystemAttachmentId/);
  assert.match(app, /pasExcelSystemAttachmentMode/);
```

- [ ] **Step 2: Run the contract test and confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: FAIL because the new helper names are absent.

- [ ] **Step 3: Replace generated Excel record helper and extract workbook sheet**

In `05-engineering-source/procurement-prototype/app.js`, replace the existing `createPasExcelSystemFileRecord(group, fileName, createdAt = new Date().toISOString())` function with this implementation, then insert `pasExcelWorkbookSheet()` immediately after it:

```js
function createPasExcelSystemFileRecord(group, fileName, createdAt = new Date().toISOString(), attachment = {}) {
  const groupRows = group.rows || [];
  const summary = omBusinessFlowModule().pasExcelSystemAttachmentSummary?.(group, createdAt) || {
    linkedEntityId: group.displayPasDemandId || group.pasDemandId || "PAS-Demand-Pending",
    rowIds: groupRows.map((row) => row.id).filter(Boolean),
    metadata: { rowCount: groupRows.length, mergeDecision: group.mergeDecision || "merge" },
  };
  const rowIds = new Set(summary.rowIds);
  requests = requests.map((row) => {
    if (!rowIds.has(row.id)) return row;
    return {
      ...row,
      pasExcelGroupId: summary.linkedEntityId,
      pasExcelMergeDecision: group.mergeDecision || row.pasExcelMergeDecision || "merge",
      pasExcelSystemFileName: fileName,
      pasExcelSystemFileCreatedAt: createdAt,
      pasExcelSystemAttachmentId: attachment.id || row.pasExcelSystemAttachmentId || "",
      pasExcelSystemAttachmentUrl: attachment.downloadUrl || row.pasExcelSystemAttachmentUrl || "",
      pasExcelSystemAttachmentMode: attachment.id ? "api-upload" : "local-metadata",
      pasExcelSystemAttachmentKind: "om_pas_tracking_system_excel",
      pasExcelSystemRowCount: groupRows.length,
    };
  });
  groupRows.forEach((row) => {
    const updated = requests.find((item) => item.id === row.id) || row;
    const mode = attachment.id ? "uploaded to system attachments" : "recorded as local metadata";
    addOmHistory(updated, "PAS Excel system file created", `${fileName} includes ${groupRows.length} item${groupRows.length === 1 ? "" : "s"} and was ${mode}.`);
  });
}

function pasExcelWorkbookSheet(group) {
  const groupRows = group.rows || [];
  const firstRow = groupRows[0] || {};
  const workbookDemandId = group.displayPasDemandId || group.pasDemandId || "PAS-Demand-Pending";
  return {
    name: "PAS Tracking",
    rows: [
      ["Form Head", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Demand No", workbookDemandId || "Waiting PAS Demand No", "PAS Material No", firstRow.pasMaterialNo || "Waiting PAS Material No", "Demand Date", pasDemandDate(firstRow), "Legal Name", pasLegalName(firstRow), "Request Dept", pasRequestDept(firstRow), "Data Transfer To", pasDataTransferTo(firstRow), ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Form Item", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Project Type", "Project", "Phase", "PAS Material No", "Part Name", "Brand", "Spec", "Purpose Location", "Unit", "Quantity", "Level 2", "Level 3", "CPD-IEP Owner", "Requirement"],
      ...groupRows.map((row) => {
        const enriched = applyOmResponsibility(row);
        const phase = currentStageForProject(row.project);
        return [
          projectTypeFor(row.project),
          row.project,
          currentPhaseLabelForProject(row.project),
          row.pasMaterialNo || "",
          pasPartName(row),
          pasBrand(row),
          pasSpec(row),
          omPurposeLocations(row).join(" / "),
          omUnit(row),
          totalQty(row),
          enriched.omCategoryLevel2 || "",
          enriched.omCategoryLevel3 || "",
          enriched.omOwner || "",
          `${stageDateForProject(row.project, phase)} / Need by ${requiredDeliveryDateForProject(row.project, phase)}`,
        ];
      }),
    ],
    minWidth: 10,
    maxWidth: 34,
    freezeHeader: true,
  };
}
```

- [ ] **Step 4: Add generated attachment upload and group ensure helpers**

Insert this code immediately after `pasExcelWorkbookSheet(group)`:

```js
async function uploadGeneratedPasExcelAttachment(group, fileName, blob, createdAt = new Date().toISOString()) {
  if (!apiModeEnabled()) return null;
  const summary = omBusinessFlowModule().pasExcelSystemAttachmentSummary?.(group, createdAt);
  if (!summary) return null;
  const file = typeof File === "function"
    ? new File([blob], fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    : blob;
  return uploadAttachment(file, {
    linkedEntityType: summary.linkedEntityType,
    linkedEntityId: summary.linkedEntityId,
    attachmentKind: summary.attachmentKind,
    visibilityScope: summary.visibilityScope,
    metadata: summary.metadata,
  });
}

async function ensurePasExcelSystemFileForGroups(groups, { download = false } = {}) {
  const createdAt = new Date().toISOString();
  const results = [];
  for (const group of groups) {
    const fileName = omBusinessFlowModule().pasExcelSystemFileName?.(group) || `${String(group.pasDemandId || "PAS-Demand-Pending").replace(/[^a-zA-Z0-9._-]+/g, "-")}-PAS-Tracking.xlsx`;
    const blob = createXlsxBlob([pasExcelWorkbookSheet(group)]);
    let attachment = null;
    try {
      attachment = await uploadGeneratedPasExcelAttachment(group, fileName, blob, createdAt);
    } catch (error) {
      showToast(`Generated PAS Excel attachment failed: ${error.message}`, "error");
      throw error;
    }
    createPasExcelSystemFileRecord(group, fileName, createdAt, attachment || {});
    if (download) downloadBlob(fileName, blob);
    results.push({ group, fileName, attachment });
  }
  return results;
}
```

- [ ] **Step 5: Update manual PAS Excel export to reuse the helper**

Replace `function exportPasExcel() { ... }` with:

```js
async function exportPasExcel() {
  const rows = selectedOmPasResultRows().length ? selectedOmPasResultRows() : selectedOmPasRequestRows();
  if (!rows.length) {
    showToast("Select at least one PAS row before generating PAS Excel.", "error");
    return;
  }
  const groups = omBusinessFlowModule().groupRowsForPasExcelExport?.(rows) || omBusinessFlowModule().groupRowsByPasDemandId?.(rows) || [{ pasDemandId: rows[0].pasDemandNo || "PAS-Demand-Pending", rows }];
  await ensurePasExcelSystemFileForGroups(groups, { download: true });
  rows.forEach((row) => {
    const updated = requests.find((item) => item.id === row.id) || row;
    addOmHistory(updated, "Exported PAS Tracking Excel", `${updated.pasExcelSystemFileName || row.pasDemandNo || "PAS-Demand-Pending"} PAS tracking exported.`);
  });
  renderOmPurchasing();
  showToast(`${groups.length} PAS tracking Excel file${groups.length === 1 ? "" : "s"} exported by PAS Demand ID.`, "success");
}
```

- [ ] **Step 6: Await manual export from the click handler**

Change the document click listener declaration from:

```js
document.addEventListener("click", (event) => {
```

to:

```js
document.addEventListener("click", async (event) => {
```

Then replace:

```js
  if (action === "exportPasExcel") exportPasExcel();
```

with:

```js
  if (action === "exportPasExcel") await exportPasExcel();
```

- [ ] **Step 7: Re-run the contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: record generated PAS Excel attachments"
```

## Task 3: Generate And Attach PAS Excel On My Quote Result Confirmation

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- Modify: `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`

- [ ] **Step 1: Add failing system contract assertions**

In the existing `OM tabs and PAS quote result contract are consolidated` test, append:

```js
  assert.match(app, /async function confirmOmQuoteResultRows/);
  assert.match(app, /function pasExcelRowsForQuoteConfirmation/);
  assert.match(app, /Generated PAS Excel/);
  assert.match(app, /data-generated-pas-excel/);
```

- [ ] **Step 2: Run the contract test and confirm failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected: FAIL because `confirmOmQuoteResultRows` is absent.

- [ ] **Step 3: Add quote-confirmation group selection helpers**

Insert this code immediately before `saveOmQuoteInfoRows(rows, { requireComplete = false } = {})`:

```js
function pasExcelRowsForQuoteConfirmation(rows = []) {
  const selectedIds = new Set(rows.map((row) => row.id));
  const selectedPasDemandNos = new Set(rows
    .map((row) => omBusinessFlowModule().normalizePasDemandNo?.(row.pasDemandNo || row.pasDemandId || "") || "")
    .filter(Boolean));
  return omQuoteConfirmRows().filter((candidate) => {
    if (selectedIds.has(candidate.id)) return true;
    const candidatePasDemandNo = omBusinessFlowModule().normalizePasDemandNo?.(candidate.pasDemandNo || candidate.pasDemandId || "") || "";
    if (!candidatePasDemandNo || !selectedPasDemandNos.has(candidatePasDemandNo)) return false;
    if (candidate.pasExcelMergeDecision === "separate") return false;
    return canOperateOmRow(candidate);
  });
}

async function confirmOmQuoteResultRows(rows, { requireComplete = true } = {}) {
  if (!saveOmQuoteInfoRows(rows, { requireComplete })) return false;
  const excelRows = pasExcelRowsForQuoteConfirmation(rows);
  const groups = omBusinessFlowModule().groupRowsForPasExcelExport?.(excelRows) || [];
  if (groups.length) {
    await ensurePasExcelSystemFileForGroups(groups, { download: false });
  }
  return true;
}
```

- [ ] **Step 4: Update Validate Quote actions to use the async wrapper**

Replace `function saveOmQuoteInfo() { ... }` with:

```js
async function saveOmQuoteInfo() {
  const rows = selectedOmPasResultRows().length ? selectedOmPasResultRows() : omPasResultRows();
  if (!rows.length) {
    showToast("No PAS result rows are available to save.", "error");
    return;
  }
  if (!await confirmOmQuoteResultRows(rows, { requireComplete: true })) return;
  renderOmPurchasing();
  showToast("Quote validated; generated PAS Excel attached; price and Quotation DB retention checks updated.", "success");
}
```

Change `function runOmRowAction(requestId, action) {` to:

```js
async function runOmRowAction(requestId, action) {
```

Inside `runOmRowAction`, replace the `saveQuoteInfo` branch with:

```js
  if (action === "saveQuoteInfo") {
    if (!await confirmOmQuoteResultRows([row], { requireComplete: true })) return;
    renderOmPurchasing();
    showToast("Quote validated; generated PAS Excel attached; price and Quotation DB retention checks updated.", "success");
  }
```

Change the row action caller from:

```js
  if (omRowButton) runOmRowAction(omRowButton.dataset.omRowButton, omRowButton.dataset.omRowButtonAction);
```

to:

```js
  if (omRowButton) await runOmRowAction(omRowButton.dataset.omRowButton, omRowButton.dataset.omRowButtonAction);
```

- [ ] **Step 5: Keep send-to-requester route consistent**

Change `function sendOmPasRowsToUserConfirm(rows) {` to:

```js
async function sendOmPasRowsToUserConfirm(rows) {
```

Inside it, replace:

```js
  if (standardRows.length && !saveOmQuoteInfoRows(standardRows, { requireComplete: true })) return;
```

with:

```js
  if (standardRows.length && !await confirmOmQuoteResultRows(standardRows, { requireComplete: true })) return;
```

Replace:

```js
function sendOmPasResultToUserConfirm() {
  sendOmPasRowsToUserConfirm(selectedOmPasResultRows());
}
```

with:

```js
async function sendOmPasResultToUserConfirm() {
  await sendOmPasRowsToUserConfirm(selectedOmPasResultRows());
}
```

Change the bulk action callers:

```js
  if (action === "omSaveQuoteInfo") saveOmQuoteInfo();
  if (action === "omSendToUserConfirm") sendOmPasResultToUserConfirm();
```

to:

```js
  if (action === "omSaveQuoteInfo") await saveOmQuoteInfo();
  if (action === "omSendToUserConfirm") await sendOmPasResultToUserConfirm();
```

Change the row action send branch from:

```js
  if (action === "sendToUserConfirm") {
    sendOmPasRowsToUserConfirm([row]);
  }
```

to:

```js
  if (action === "sendToUserConfirm") {
    await sendOmPasRowsToUserConfirm([row]);
  }
```

- [ ] **Step 6: Show generated system Excel in the Quote Result files cell**

In `omQuoteResultFileCell(row, readOnly)`, insert this constant after `const excelFile = row.quotationExcel || "";`:

```js
  const generatedExcel = row.pasExcelSystemFileName || "";
  const generatedExcelHtml = generatedExcel
    ? `<div class="om-quote-row-note" data-generated-pas-excel="${htmlAttr(row.id)}">Generated PAS Excel: ${attachmentLinkHtml(generatedExcel, row.pasExcelSystemAttachmentId, row.pasExcelSystemAttachmentUrl, { allowDownload: true })}</div>`
    : "";
```

In the read-only return block, add `${generatedExcelHtml}` before `</div>`.

In the editable return block, add `${generatedExcelHtml}` immediately after the two upload labels.

- [ ] **Step 7: Update price-routing smoke calls to await async quote confirmation routes**

In `05-engineering-source/procurement-prototype/tests/price-routing-smoke.js`, replace calls to `sendOmPasRowsToUserConfirm([updated]);` with:

```js
    await sendOmPasRowsToUserConfirm([updated]);
```

Replace calls to `saveOmQuoteInfoRows([row], { requireComplete: true });` that are intended to simulate user confirmation with:

```js
    await confirmOmQuoteResultRows([row], { requireComplete: true });
```

Keep calls to `saveOmQuoteInfoRows([row]);` when the test is only asserting price-decision patch behavior and not system attachment confirmation.

If the surrounding helper is not async, change its declaration from:

```js
function routeAfterQuote(input, label) {
```

to:

```js
async function routeAfterQuote(input, label) {
```

Then add `await` at each call site:

```js
  await routeAfterQuote(input, label);
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
node tests/price-routing-smoke.js
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js 05-engineering-source/procurement-prototype/tests/price-routing-smoke.js
git commit -m "feat: attach PAS Excel on quote validation"
```

## Task 4: Verify API Attachment Guard For Generated PAS Excel

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/api.test.js`
- Modify only if needed: `05-engineering-source/procurement-prototype/server.js`

- [ ] **Step 1: Extend the existing attachment API test**

Inside `test("attachments persist metadata, download bytes, and guard OM-internal files", async () => { ... })`, after the existing `omDownload` assertions, insert:

```js
    const systemUpload = await uploadFile(baseUrl, "/api/attachments", {
      cookie: giang.cookie,
      fields: {
        linkedEntityType: "om_pas_excel_group",
        linkedEntityId: "PAS-100",
        attachmentKind: "om_pas_tracking_system_excel",
        visibilityScope: "om_internal",
        metadata: JSON.stringify({
          source: "system_generated_pas_excel",
          pasDemandNo: "PAS-100",
          mergeDecision: "merge",
          rowIds: ["REQ-1", "REQ-2"],
          rowCount: 2,
          createdAt: "2026-06-29T08:00:00.000Z",
        }),
      },
      file: {
        name: "PAS-100-PAS-Tracking.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        content: "generated pas excel bytes",
      },
    });
    assert.equal(systemUpload.response.status, 201);
    assert.equal(systemUpload.json.attachment.attachmentKind, "om_pas_tracking_system_excel");
    assert.equal(systemUpload.json.attachment.linkedEntityType, "om_pas_excel_group");

    const blockedSystemDownload = await fetch(`${baseUrl}${systemUpload.json.attachment.downloadUrl}`, {
      headers: { Cookie: requester.cookie },
    });
    assert.equal(blockedSystemDownload.status, 403);

    const omSystemDownload = await fetch(`${baseUrl}${systemUpload.json.attachment.downloadUrl}`, {
      headers: { Cookie: giang.cookie },
    });
    assert.equal(omSystemDownload.status, 200);
    assert.equal(await omSystemDownload.text(), "generated pas excel bytes");
```

- [ ] **Step 2: Run the API test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/api.test.js
```

Expected: PASS because `canUploadAttachment()` already allows `attachmentKind.startsWith("om_")` and download guard blocks Requester for `om_internal`.

- [ ] **Step 3: Only if the test fails, update the server guard**

If the upload is rejected, update `canUploadAttachment(user, attachment)` in `05-engineering-source/procurement-prototype/server.js` so the existing OM allowance remains:

```js
function canUploadAttachment(user, attachment) {
  if (!user) return false;
  if (attachment.linkedEntityType === "om_quote" || attachment.attachmentKind.startsWith("om_") || attachment.attachmentKind.startsWith("sourcing_")) {
    return canViewOm(user);
  }
  if (attachment.linkedEntityType === "procurement_quote" || attachment.attachmentKind.startsWith("procurement_")) {
    return user.role !== "requester";
  }
  return ["admin", "omLeader"].includes(user.role);
}
```

- [ ] **Step 4: Commit**

If only the test changed:

```bash
git add 05-engineering-source/procurement-prototype/tests/api.test.js
git commit -m "test: cover generated PAS Excel attachment guard"
```

If `server.js` also changed:

```bash
git add 05-engineering-source/procurement-prototype/server.js 05-engineering-source/procurement-prototype/tests/api.test.js
git commit -m "fix: allow OM generated PAS Excel attachments"
```

## Task 5: Update Role And Module Context

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Update OM Purchasing role context**

In `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`, under `可操作功能`, replace this bullet:

```md
- 輸入 My Quote Result：
```

with:

```md
- 輸入並確認 My Quote Result；Validate Quote 會依 OM 輸入資料生成 system PAS Tracking Excel，並自動附在系統 OM-internal attachments，供下一次取用：
```

Under `常見風險`, add this bullet after `Quote Excel 仍必須保留。` if that line exists, or after the existing quote evidence bullets:

```md
- `Quote Excel` 是 OM 上傳的 vendor/source evidence；`system PAS Tracking Excel` 是 Validate Quote 後由系統依 My Quote Result 生成並附在系統的工作簿，兩者不可互相取代。API mode 會寫入 `/api/attachments`；local prototype mode 只記 metadata，不可說成 real upload。
```

- [ ] **Step 2: Update OMWorkflowTable module context**

In `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`, inside the `OMWorkflowTable` paragraph, append:

```md
My Quote Result 的 `Validate Quote` 確認後，系統會依 PAS Demand No grouping 生成 system PAS Tracking Excel；同 PAS Demand No 預設 merge 成一份，OM 標示 `Keep separate` 時才分開。此 generated Excel 是 OM-internal system attachment metadata，與 OM 上傳的 vendor quote Excel 分開管理。
```

- [ ] **Step 3: Commit**

```bash
git add 05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md 05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
git commit -m "docs: clarify My Quote Result system Excel attachment"
```

## Task 6: Full Verification

**Files:**
- Verify only, no edits expected.

- [ ] **Step 1: Run focused JavaScript tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
node --test tests/system-contract.test.js
node --test tests/api.test.js
node tests/price-routing-smoke.js
```

Expected: all PASS.

- [ ] **Step 2: Run the standard prototype suite**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected: all PASS. If failures reference unrelated dirty worktree changes, capture the failing test name and diff ownership before editing.

- [ ] **Step 3: Manual UI smoke**

Run:

```bash
python3 -m http.server 8080 --directory "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置"
```

Open:

```text
http://127.0.0.1:8080/05-engineering-source/procurement-prototype/
```

Manual checks:

- Login as `OM Purchasing (Giang / Linh)`.
- Open `OM Purchasing` -> `My Quote Result`.
- Use two rows with the same PAS Demand No.
- Complete PAS Material No, Vendor, Vendor Code, Unit Price, Quote Date, Valid Until, Quote Screenshot, and uploaded Quote Excel.
- Leave both rows as `Merge for one PAS Excel`.
- Click `Validate Quote`.
- Expected UI: both rows show the same generated PAS Excel file name and quote validation still shows price/Quotation DB retention status.
- Switch one row to `Keep separate`, validate again.
- Expected UI: that row receives its own generated file name, while the merged row keeps the group workbook.

- [ ] **Step 4: Review git status**

Run:

```bash
git status --short --branch
```

Expected: only files from this plan are modified/staged for this workstream. Existing unrelated dirty files remain uncommitted and unstaged by this work.

## Self-Review

Spec coverage:

- Generate Excel from `My Quote Result` input: Task 2 extracts workbook generation and Task 3 triggers it from quote confirmation.
- Merge multiple same PAS ID into one total Excel: Task 1 reuses grouping and Task 3 selects same-demand rows for confirmation.
- Confirm then automatically attach in system: Task 3 records local metadata and uploads in API mode through Task 2 helper.
- Wait for next use: Task 3 displays generated file metadata, Task 4 verifies guarded download, Task 5 documents it as reusable system attachment metadata.

Placeholder scan:

- Clean: no placeholder markers or unspecified validation steps remain.

Type consistency:

- `pasExcelSystemAttachmentSummary`, `pasExcelSystemFileName`, `ensurePasExcelSystemFileForGroups`, `confirmOmQuoteResultRows`, `pasExcelSystemAttachmentId`, `pasExcelSystemAttachmentUrl`, and `pasExcelSystemAttachmentMode` use consistent names across tasks.

Risk notes:

- This is not a real production `pas_quotes` persistence implementation. Real execution is limited to `/api/attachments` in API mode; static mode is metadata-only.
- Because the current worktree is dirty, each implementation task must stage only the files listed in that task.
