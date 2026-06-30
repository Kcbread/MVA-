# Requester Purpose Dates And OM PR PO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add requester-owned SMT/FATP purpose and project line-open dates, make Dept DRI able to review date/lead-time/budget/procurement fields, and move IT item budget and PR/PO operation fields into OM Purchasing.

**Architecture:** Keep Requester as the source of demand intent and project-purpose date planning data, Dept DRI as review/update view for requester required delivery date and read-only view for downstream tracking fields, and OM Purchasing as the operator for budget, PAS, quote, PR, PO, ETA, DTA, and PUR request tracking. Reuse the existing prototype data shape in `app.js` and existing contract tests instead of introducing a new persistence layer.

**Tech Stack:** Static HTML prototype, vanilla JavaScript in `05-engineering-source/procurement-prototype/app.js`, Node test runner via `./test.sh`, existing system contract and role-flow smoke tests.

---

## Startup Context Receipt

Read:
- `README.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/02-dept-dri.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `05-engineering-source/procurement-prototype/_doc/testing-standard-op.zh-TW.md`

Roles:
- Requester owns purpose and project line-open-date input.
- Dept DRI views requester input and downstream tracking; Dept DRI may update `Required delivery date` only where explicitly allowed.
- OM Purchasing operates Budget status/#, PR/PO/ETA/DTA/PUR request tracking.
- Buyer Handoff remains downstream status/history, not the primary IT item operation surface.

Worktree:
- `git status --short --branch` was inspected before this plan. The worktree is dirty with existing modified/deleted files, so execution must classify ownership before editing and avoid staging unrelated deletions or prior work.

Decisions recorded in this plan:
- `Purpose` is a requester input with values `SMT` or `FATP`; it is not the same as MFG station and not the same as Non-MFG department.
- OM can track/view purpose only; OM must not edit requester purpose.
- Project line-open-date input is scoped by `Project Year + Project + Purpose(SMT/FATP)`.
- `Required Delivery Date follow Stage date` is derived from `Line open date - 14 days`.
- `Given LT (days)` is derived from `Required Delivery Date follow Stage date - Date of request`.
- `Total lead time` is OM input after PAS quote ID / PAS Demand No is updated.
- IT item PR/PO fields move into OM Purchasing operation for this prototype.

---

## Boundary Map

Feature:
- Requester project-purpose date planning and OM procurement tracking for IT items.

Function:
- Capture requester `purposeLocation` as `SMT` or `FATP`.
- Capture `lineOpenDate` by `yearProject + projectCode + purposeLocation`.
- Stamp item-level `dateOfRequest`.
- Compute `requiredDeliveryDateFollowStageDate` and `givenLeadTimeDays`.
- Let Dept DRI view required delivery / lead-time / budget / PR / PO / ETA / DTA fields, with edit limited to `Required delivery date`.
- Let OM Purchasing input Budget status/#, PR/PO/ETA/DTA/PUR request, and total lead time.

Module:
- `05-engineering-source/procurement-prototype/index.html`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/tests/unit.test.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`
- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/02-dept-dri.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

Non-scope:
- No DB migration.
- No real WMS integration.
- No external remote write.
- No change to MFG station list `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`.
- No change to Non-MFG department list `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.
- No change to Dept DRI approval ownership.

Validation:
- `./test.sh` from `05-engineering-source/procurement-prototype`.
- Unit tests for date helpers and PUR request suggestion.
- System contract tests for Requester input, Dept DRI visibility, OM operation fields, and Buyer Handoff not being the main edit surface.
- Browser smoke is part of `./test.sh`; if skipped, report the skip reason explicitly.

---

## Terminology And Calculation Rules

| Term | Owner | Input / Derived | Meaning | Field |
| --- | --- | --- | --- | --- |
| `Purpose` | Requester | Input dropdown | `SMT` or `FATP`; requester demand purpose, not phase, station, or department | `purposeLocation` |
| `Project Year` | Requester | Input/select | Parent project/year scope | `yearProject` |
| `Project` | Requester | Input/select | Project code/model | `projectCode` |
| `Line open date` | Requester | Input date | Planned line opening date shared by project + purpose | `lineOpenDate` |
| `Date of request` | System | Derived/stamped | Demand item request date, stored per item when item is created/submitted | `dateOfRequest` |
| `Required delivery date` | Requester, update by Dept DRI | Input/edit | Requester desired arrival date; DRI may update during review | `requiredDeliveryDate` |
| `Required Delivery Date follow Stage date` | System | Derived | `lineOpenDate - 14 days` | `requiredDeliveryDateFollowStageDate` |
| `Given LT (days) follow stage date` | System | Derived | `requiredDeliveryDateFollowStageDate - dateOfRequest` | `givenLeadTimeDays` |
| `Total lead time` | OM Purchasing | Input | OM reply after PAS quote ID / PAS Demand No is updated | `totalLeadTimeDays` |
| `Budget status` | OM Purchasing | Input/select | `Done`, `In Progress`, `Pending`; Dept DRI view only | `budgetStatus` |
| `Budget #` | OM Purchasing | Input | Item budget code; Dept DRI view only | `budgetNo` |
| `PR status` | OM Purchasing | Input/select | `Done`, `In Progress`, `Pending` | `prStatus` |
| `PR#` | OM Purchasing | Input | PR number | `prNo` |
| `PO status` | OM Purchasing | Input/select | `Done`, `In Progress`, `Pending` | `poStatus` |
| `PO#` | OM Purchasing | Input | PO number | `buyerPoNo` |
| `ETA (PLAN)` | OM Purchasing | Input date | Planned arrival date | `etaPlanDate` |
| `DTA (Actual)` | OM Purchasing | Input date | Actual arrival date | `dtaActualDate` |
| `#PUR request NO` | Suggested by WMS, OM input | Suggested/editable | Suggested from dept + project + quantity + item name + spec | `purRequestNo` |

Formula details:
- `requiredDeliveryDateFollowStageDate = lineOpenDate - 14 calendar days`
- `givenLeadTimeDays = requiredDeliveryDateFollowStageDate - dateOfRequest`
- `suggestPurRequestNo(row) = PUR-{dept}-{projectCode or project}-{qty}-{item name}-{spec}` normalized to uppercase alphanumeric chunks joined by `-`

---

## File Structure

Modify:
- `05-engineering-source/procurement-prototype/index.html`
  - Add Requester purpose and line-open-date inputs.
  - Add OM procurement tracking columns to `My Exports`.
  - Keep Buyer Handoff available as status/history.

- `05-engineering-source/procurement-prototype/app.js`
  - Add constants, date helpers, project-purpose date state, row normalization, Requester rendering, Dept DRI detail visibility, and OM procurement update handlers.

- `05-engineering-source/procurement-prototype/tests/unit.test.js`
  - Test date calculations and PUR request suggestion.

- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Test static UI contracts and remove stale guardrails that forbid ETA/DTA in OM.

- `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`
  - Test end-to-end preservation from Requester input through Dept DRI view to OM operation.

- `_context` role/module docs listed in Boundary Map
  - Update source-of-truth role ownership and table/module expectations.

Do not modify:
- `03-it-handoff/` delivery snapshots unless Kai asks to rebuild IT handoff.
- Runtime deployment folders.
- Existing archive or generated artifact deletions.

---

### Task 1: Add Core Constants And Date Helpers

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Write failing unit tests**

Append these tests near existing helper tests in `tests/unit.test.js`:

```js
test("stage delivery helper derives required date and given lead time", () => {
  assert.equal(appExportsForTests.requiredDeliveryDateFollowStageDate("2026-08-20"), "2026-08-06");
  assert.equal(appExportsForTests.givenLeadTimeDays("2026-07-30", "2026-08-20"), 7);
});

test("purpose location normalization accepts only SMT or FATP", () => {
  assert.equal(appExportsForTests.normalizePurposeLocation("smt"), "SMT");
  assert.equal(appExportsForTests.normalizePurposeLocation("FATP"), "FATP");
  assert.equal(appExportsForTests.normalizePurposeLocation("CG"), "SMT");
});

test("PUR request number suggestion uses dept project qty item and spec", () => {
  const row = {
    department: "IT",
    projectCode: "4CS4",
    project: "P26",
    qty: 12,
    name: "Mini PC",
    spec: "i5 / 16GB RAM",
  };
  assert.equal(
    appExportsForTests.suggestPurRequestNo(row),
    "PUR-IT-4CS4-12-MINI-PC-I5-16GB-RAM",
  );
});
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:
- FAIL because `requiredDeliveryDateFollowStageDate`, `givenLeadTimeDays`, `normalizePurposeLocation`, and `suggestPurRequestNo` are not exported for tests yet.

- [ ] **Step 3: Add constants and helper functions**

Add near the existing top-level constants in `app.js`:

```js
const PURPOSE_LOCATION_OPTIONS = ["SMT", "FATP"];
const DEFAULT_PURPOSE_LOCATION = "SMT";
const STAGE_REQUIRED_DELIVERY_OFFSET_DAYS = 14;
const PROCUREMENT_STATUS_OPTIONS = ["Pending", "In Progress", "Done"];
```

Add near existing date/helper functions:

```js
function normalizePurposeLocation(value = "") {
  const normalized = String(value || "").trim().toUpperCase();
  return PURPOSE_LOCATION_OPTIONS.includes(normalized) ? normalized : DEFAULT_PURPOSE_LOCATION;
}

function dateOnly(value = "") {
  if (!value) return "";
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function addDaysIsoDate(dateText = "", days = 0) {
  const normalized = dateOnly(dateText);
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function requiredDeliveryDateFollowStageDate(lineOpenDate = "") {
  return addDaysIsoDate(lineOpenDate, -STAGE_REQUIRED_DELIVERY_OFFSET_DAYS);
}

function daysBetweenIsoDates(startDate = "", endDate = "") {
  const start = dateOnly(startDate);
  const end = dateOnly(endDate);
  if (!start || !end) return null;
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000);
}

function givenLeadTimeDays(dateOfRequest = "", lineOpenDate = "") {
  const requiredByStage = requiredDeliveryDateFollowStageDate(lineOpenDate);
  return daysBetweenIsoDates(dateOfRequest, requiredByStage);
}

function procurementStatusValue(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return PROCUREMENT_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized) || "Pending";
}

function suggestPurRequestNo(row = {}) {
  const dept = row.department || row.requestDept || row.demandUnit || "DEPT";
  const project = row.projectCode || row.project || row.yearProject || "PROJECT";
  const qty = clampQty(row.qty || row.totalQty || totalQty(row) || 0);
  const item = row.name || row.item || "ITEM";
  const spec = itemDetail(row) || row.spec || "SPEC";
  return ["PUR", dept, project, qty, item, spec]
    .map((part) => String(part || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .join("-");
}
```

Expose the helpers in the existing test export object. If the current export object is named differently, add these properties to that same object:

```js
requiredDeliveryDateFollowStageDate,
givenLeadTimeDays,
normalizePurposeLocation,
suggestPurRequestNo,
```

- [ ] **Step 4: Run tests to verify pass**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:
- PASS for the new helper tests.

- [ ] **Step 5: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: add purpose date helpers"
```

---

### Task 2: Add Requester Purpose And Line Open Date Inputs

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- Test: `05-engineering-source/procurement-prototype/tests/layout-smoke.js`

- [ ] **Step 1: Write failing system contract test**

Add to the Requester worksheet contract section in `tests/system-contract.test.js`:

```js
test("Requester exposes purpose and project line open date input", () => {
  const html = fs.readFileSync(path.join(PROJECT_ROOT, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(PROJECT_ROOT, "app.js"), "utf8");
  const departmentView = between(html, '<section class="view active" data-view="department">', '<section class="view" data-view="priceReview"');

  assert.match(departmentView, /id="requestPurposeLocationInput"/);
  assert.match(departmentView, /<option value="SMT">SMT<\/option>/);
  assert.match(departmentView, /<option value="FATP">FATP<\/option>/);
  assert.match(departmentView, /id="requestLineOpenDateInput"/);
  assert.match(app, /let currentPurposeLocation = DEFAULT_PURPOSE_LOCATION/);
  assert.match(app, /function requestProjectStageKey/);
  assert.match(app, /function syncRequestProjectStageInputs/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL because the Requester purpose and line-open date controls do not exist.

- [ ] **Step 3: Add Requester controls**

In `index.html`, inside the Requester toolbar after the `Project` select, add:

```html
<label class="project-picker">
  Purpose
  <select id="requestPurposeLocationInput">
    <option value="SMT">SMT</option>
    <option value="FATP">FATP</option>
  </select>
</label>
<label class="project-picker">
  Line Open Date
  <input id="requestLineOpenDateInput" type="date" />
</label>
```

Change the existing need-date label text in `index.html` from `MFG Need Date` to:

```html
<span id="requestPackageNeedDateLabel">Required Delivery Date</span>
```

- [ ] **Step 4: Add Requester state and sync functions**

Add near Requester state variables in `app.js`:

```js
let currentPurposeLocation = DEFAULT_PURPOSE_LOCATION;
let requestProjectStageDates = {};
```

Add near existing project/request scope helpers:

```js
function requestProjectStageKey({
  yearProject = currentProject,
  projectCode = currentProjectCode,
  purposeLocation = currentPurposeLocation,
} = {}) {
  return [
    normalizeYearProjectLabel(yearProject || currentProject),
    normalizeProjectCodeLabel(projectCode || currentProjectCode || yearProject || currentProject),
    normalizePurposeLocation(purposeLocation),
  ].join("|||");
}

function requestProjectStageLineOpenDate(context = {}) {
  return requestProjectStageDates[requestProjectStageKey(context)] || "";
}

function setRequestProjectStageLineOpenDate(value = "", context = {}) {
  const key = requestProjectStageKey(context);
  requestProjectStageDates = {
    ...requestProjectStageDates,
    [key]: dateOnly(value),
  };
}

function syncRequestProjectStageInputs() {
  const purposeSelect = document.getElementById("requestPurposeLocationInput");
  const lineOpenInput = document.getElementById("requestLineOpenDateInput");
  if (purposeSelect) {
    purposeSelect.value = normalizePurposeLocation(currentPurposeLocation);
  }
  if (lineOpenInput) {
    lineOpenInput.value = requestProjectStageLineOpenDate();
  }
}
```

Call `syncRequestProjectStageInputs()` inside `renderDepartment()` after `syncProjectControls()` and before rendering requester rows.

Add to the global `input/change` event handler:

```js
if (event.target.id === "requestPurposeLocationInput") {
  currentPurposeLocation = normalizePurposeLocation(event.target.value);
  syncRequestWorksheetContext();
  renderDepartment();
}

if (event.target.id === "requestLineOpenDateInput") {
  setRequestProjectStageLineOpenDate(event.target.value);
  renderDepartment();
}
```

- [ ] **Step 5: Add layout smoke audit**

Add to `tests/layout-smoke.js` near the existing Requester toolbar audits:

```js
const requesterPurposeDateAudit = await page.evaluate(() => {
  const purpose = document.getElementById("requestPurposeLocationInput");
  const lineOpenDate = document.getElementById("requestLineOpenDateInput");
  return {
    hasPurpose: Boolean(purpose),
    purposeOptions: purpose ? [...purpose.querySelectorAll("option")].map((option) => option.value) : [],
    hasLineOpenDate: Boolean(lineOpenDate),
    lineOpenDateType: lineOpenDate?.getAttribute("type") || "",
  };
});

if (!requesterPurposeDateAudit.hasPurpose || !requesterPurposeDateAudit.purposeOptions.includes("SMT") || !requesterPurposeDateAudit.purposeOptions.includes("FATP")) {
  throw new Error(`Requester Purpose should expose SMT/FATP select, got ${JSON.stringify(requesterPurposeDateAudit)}`);
}
if (!requesterPurposeDateAudit.hasLineOpenDate || requesterPurposeDateAudit.lineOpenDateType !== "date") {
  throw new Error(`Requester Line Open Date should expose date input, got ${JSON.stringify(requesterPurposeDateAudit)}`);
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
node tests/layout-smoke.js
```

Expected:
- System contract passes.
- Layout smoke passes or explicitly skips browser-only checks if Playwright is unavailable.

- [ ] **Step 7: Commit**

```bash
git add 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js 05-engineering-source/procurement-prototype/tests/layout-smoke.js
git commit -m "feat: add requester purpose line open inputs"
```

---

### Task 3: Persist Purpose, Required Delivery, Request Date, And Derived Line Open Dates On Demand Rows

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/unit.test.js`
- Test: `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`

- [ ] **Step 1: Write failing row-normalization test**

Add to `tests/unit.test.js`:

```js
test("request stage fields are normalized onto demand row", () => {
  const row = appExportsForTests.normalizeRequesterStageFields({
    id: "REQ-STAGE-001",
    project: "P26",
    projectCode: "4CS4",
    purposeLocation: "fatp",
    lineOpenDate: "2026-08-20",
    dateOfRequest: "2026-07-30",
    requiredDeliveryDate: "2026-08-10",
  });

  assert.equal(row.purposeLocation, "FATP");
  assert.equal(row.lineOpenDate, "2026-08-20");
  assert.equal(row.requiredDeliveryDateFollowStageDate, "2026-08-06");
  assert.equal(row.givenLeadTimeDays, 7);
  assert.equal(row.requiredDeliveryDate, "2026-08-10");
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:
- FAIL because `normalizeRequesterStageFields` is not implemented/exported.

- [ ] **Step 3: Implement row normalization**

Add in `app.js` near other request normalization helpers:

```js
function dateOfRequestForRow(row = {}) {
  return dateOnly(row.dateOfRequest || row.requestedAt || row.submittedAt || row.createdAt || new Date().toISOString());
}

function normalizeRequesterStageFields(row = {}) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose || currentPurposeLocation);
  const lineOpenDate = dateOnly(row.lineOpenDate || requestProjectStageLineOpenDate({
    yearProject: row.yearProject || row.project,
    projectCode: row.projectCode,
    purposeLocation,
  }));
  const dateOfRequest = dateOfRequestForRow(row);
  const requiredDeliveryDate = dateOnly(row.requiredDeliveryDate || row.needDate || row.requestPackageNeedDate || "");
  const requiredDeliveryDateFollowStageDateValue = requiredDeliveryDateFollowStageDate(lineOpenDate);
  const givenLeadTimeDaysValue = givenLeadTimeDays(dateOfRequest, lineOpenDate);
  return {
    ...row,
    purposeLocation,
    purpose: purposeLocation,
    lineOpenDate,
    dateOfRequest,
    requiredDeliveryDate,
    requiredDeliveryDateFollowStageDate: requiredDeliveryDateFollowStageDateValue,
    givenLeadTimeDays: givenLeadTimeDaysValue,
  };
}
```

Add `normalizeRequesterStageFields` to the existing test export object.

Wrap new/requester row creation and submit mapping with the helper:

```js
const nextRow = normalizeRequesterStageFields({
  ...row,
  purposeLocation: currentPurposeLocation,
  lineOpenDate: requestProjectStageLineOpenDate(),
  requiredDeliveryDate: document.getElementById("requestPackageNeedDate")?.value || row.requiredDeliveryDate || "",
});
```

Use this exact shape wherever a row is added from Catalog / Reuse / Copy Demand / New Item Request and wherever `submitRequests` creates submitted rows. Preserve existing fields by spreading the old row first.

- [ ] **Step 4: Add role-flow smoke check**

In `tests/role-flow-smoke.js`, add a browser evaluation after creating a requester row:

```js
const stageFieldState = await page.evaluate(() => {
  const purpose = document.getElementById("requestPurposeLocationInput");
  const lineOpenDate = document.getElementById("requestLineOpenDateInput");
  if (purpose) purpose.value = "FATP";
  if (purpose) purpose.dispatchEvent(new Event("change", { bubbles: true }));
  if (lineOpenDate) lineOpenDate.value = "2026-08-20";
  if (lineOpenDate) lineOpenDate.dispatchEvent(new Event("input", { bubbles: true }));
  const row = window.requests?.find((item) => item.project === window.currentProject) || window.requests?.[0];
  return {
    hasPurposeInput: Boolean(purpose),
    hasLineOpenDateInput: Boolean(lineOpenDate),
    rowPurpose: row?.purposeLocation || row?.purpose || "",
    rowLineOpenDate: row?.lineOpenDate || "",
    rowRequiredByStage: row?.requiredDeliveryDateFollowStageDate || "",
  };
});

if (!stageFieldState.hasPurposeInput || !stageFieldState.hasLineOpenDateInput) {
  fail("Requester stage inputs are missing", stageFieldState);
}
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
node tests/role-flow-smoke.js
```

Expected:
- Unit tests pass.
- Role-flow smoke passes or reports only existing unrelated browser/environment failure.

- [ ] **Step 6: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/unit.test.js 05-engineering-source/procurement-prototype/tests/role-flow-smoke.js
git commit -m "feat: persist requester purpose line open dates"
```

---

### Task 4: Add Dept DRI Review Visibility And Editable Required Delivery Date

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- Test: `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`

- [ ] **Step 1: Write failing system contract test**

Add to `tests/system-contract.test.js` near Dept DRI review contracts:

```js
test("Dept DRI review exposes requester purpose date and downstream tracking fields", () => {
  const app = fs.readFileSync(path.join(PROJECT_ROOT, "app.js"), "utf8");
  assert.match(app, /Purpose/);
  assert.match(app, /Line Open Date/);
  assert.match(app, /Date of Request/);
  assert.match(app, /Required Delivery Date/);
  assert.match(app, /Required By Stage/);
  assert.match(app, /Given LT/);
  assert.match(app, /Budget Status/);
  assert.match(app, /Budget #/);
  assert.match(app, /data-dri-date-field/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL until Dept DRI date and downstream tracking fields are rendered.

- [ ] **Step 3: Add shared date planning detail renderer**

Add in `app.js` near existing detail row helpers:

```js
function datePlanningDetailRows(row = {}, { editableDri = false } = {}) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose);
  const lineOpenDate = dateOnly(row.lineOpenDate);
  const dateOfRequest = dateOfRequestForRow(row);
  const requiredByStage = row.requiredDeliveryDateFollowStageDate || requiredDeliveryDateFollowStageDate(lineOpenDate);
  const givenLt = row.givenLeadTimeDays ?? givenLeadTimeDays(dateOfRequest, lineOpenDate);
  const requiredDelivery = dateOnly(row.requiredDeliveryDate);
  const budgetStatus = procurementStatusValue(row.budgetStatus);
  const budgetNo = row.budgetNo || "";

  if (!editableDri) {
    return [
      detailRow("Purpose", purposeLocation),
      detailRow("Line Open Date", lineOpenDate || "-"),
      detailRow("Date of Request", dateOfRequest || "-"),
      detailRow("Required Delivery Date", requiredDelivery || "-"),
      detailRow("Required By Stage", requiredByStage || "-"),
      detailRow("Given LT", givenLt === null ? "-" : `${givenLt} days`),
      detailRow("Budget Status", budgetStatus),
      detailRow("Budget #", budgetNo || "-"),
    ];
  }

  return [
    detailRow("Purpose", purposeLocation),
    detailRow("Line Open Date", lineOpenDate || "-"),
    detailRow("Date of Request", dateOfRequest || "-"),
    detailRow("Required Delivery Date", `<input type="date" value="${htmlAttr(requiredDelivery)}" data-dri-date-field="requiredDeliveryDate" data-dri-date-id="${htmlAttr(row.id)}" />`),
    detailRow("Required By Stage", requiredByStage || "-"),
    detailRow("Given LT", givenLt === null ? "-" : `${givenLt} days`),
    detailRow("Budget Status", budgetStatus),
    detailRow("Budget #", budgetNo || "-"),
  ];
}
```

Add these rows to the Dept DRI detail/modal renderer where request details are shown:

```js
...datePlanningDetailRows(row, { editableDri: currentRole === "dri" }),
```

- [ ] **Step 4: Add DRI update handler**

Add to the global input/change handler in `app.js`:

```js
const driDateField = event.target.dataset.driDateField;
const driDateId = event.target.dataset.driDateId;
if (driDateField && driDateId) {
  if (driDateField !== "requiredDeliveryDate") {
    renderManager();
    return;
  }
  requests = requests.map((row) => {
    if (row.id !== driDateId) return row;
    const patchValue = dateOnly(event.target.value);
    return normalizeRequesterStageFields({ ...row, [driDateField]: patchValue });
  });
  const updated = requests.find((row) => row.id === driDateId);
  addWorkflowHistory(updated, "Dept DRI updated requester date planning", `${driDateField}: ${event.target.value || "-"}`);
  renderManager();
  renderDepartment();
}
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
node tests/role-flow-smoke.js
```

Expected:
- System contract passes.
- Smoke verifies requester fields remain visible in Dept DRI path.

- [ ] **Step 6: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js 05-engineering-source/procurement-prototype/tests/role-flow-smoke.js
git commit -m "feat: show purpose date fields in dept dri review"
```

---

### Task 5: Move IT Item PR/PO Operation Fields Into OM Purchasing

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Write failing system contract test**

Replace the stale OM guardrails that assert ETA/DTA are absent from OM with this test in `tests/system-contract.test.js`:

```js
test("OM Purchasing My Exports operates IT PR PO tracking fields", () => {
  const html = fs.readFileSync(path.join(PROJECT_ROOT, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(PROJECT_ROOT, "app.js"), "utf8");
  const omFinalExportPanel = between(html, 'data-om-panel="finalExport"', '</section>');

  ["Budget Status", "Budget #", "PR Status", "PR#", "PO Status", "PO#", "ETA (PLAN)", "DTA (Actual)", "#PUR Request NO", "Total LT"].forEach((label) => {
    assert.match(omFinalExportPanel + app, new RegExp(label.replace(/[()#]/g, "\\$&")));
  });

  assert.match(app, /function omProcurementTrackingCell/);
  assert.match(app, /data-om-procurement-field/);
  assert.match(app, /function updateOmProcurementField/);
  assert.match(app, /suggestPurRequestNo/);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL because OM My Exports does not yet render these operation fields.

- [ ] **Step 3: Add OM table headers and columns**

In `index.html`, inside `om-final-export-table`, add a column after `Export Package / Budget Code`:

```html
<col class="om-export-col-budget" />
```

Add columns after `Export Status`:

```html
<col class="om-export-col-procurement" />
<col class="om-export-col-arrival" />
```

Add table headers:

```html
<th>Budget Status / Budget #</th>
<th>PR / PO Tracking</th>
<th>ETA / DTA / Total LT</th>
```

- [ ] **Step 4: Add OM procurement render helpers**

Replace the current editable OM purpose checkbox behavior with a read-only display helper, then add the procurement helpers near `renderOmFinalExport`:

```js
function statusSelectHtml(value, attrs) {
  const selected = procurementStatusValue(value);
  return `<select ${attrs}>${PROCUREMENT_STATUS_OPTIONS.map((status) => `<option value="${status}" ${status === selected ? "selected" : ""}>${status}</option>`).join("")}</select>`;
}

function omProcurementInput(row, field, type = "text", placeholder = "") {
  const value = field === "purRequestNo" ? (row.purRequestNo || suggestPurRequestNo(row)) : (row[field] || "");
  return `<input type="${type}" value="${htmlAttr(value)}" placeholder="${htmlAttr(placeholder)}" data-om-procurement-field="${field}" data-om-procurement-id="${htmlAttr(row.id)}" />`;
}

function omPurposeDisplayCell(row = {}) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose);
  return `
    <div class="om-purpose-cell">
      <div class="om-quote-entry-title">Purpose</div>
      <span class="status-pill ${statusClass(purposeLocation)}">${htmlText(purposeLocation)}</span>
      <div class="reason-text">Requester input · OM tracking only</div>
    </div>`;
}

function omBudgetTrackingCell(row = {}) {
  return `
    <div class="om-procurement-cell">
      <label><span>Budget Status</span>${statusSelectHtml(row.budgetStatus, `data-om-procurement-field="budgetStatus" data-om-procurement-id="${htmlAttr(row.id)}"`)}</label>
      <label><span>Budget #</span>${omProcurementInput(row, "budgetNo", "text", "Budget code")}</label>
    </div>`;
}

function omProcurementTrackingCell(row = {}) {
  return `
    <div class="om-procurement-cell">
      <label><span>PR Status</span>${statusSelectHtml(row.prStatus, `data-om-procurement-field="prStatus" data-om-procurement-id="${htmlAttr(row.id)}"`)}</label>
      <label><span>PR#</span>${omProcurementInput(row, "prNo", "text", "PR number")}</label>
      <label><span>PO Status</span>${statusSelectHtml(row.poStatus, `data-om-procurement-field="poStatus" data-om-procurement-id="${htmlAttr(row.id)}"`)}</label>
      <label><span>PO#</span>${omProcurementInput(row, "buyerPoNo", "text", "PO number")}</label>
      <label><span>#PUR Request NO</span>${omProcurementInput(row, "purRequestNo", "text", "#PUR request no")}</label>
    </div>`;
}

function omArrivalTrackingCell(row = {}) {
  return `
    <div class="om-procurement-cell">
      <label><span>ETA (PLAN)</span>${omProcurementInput(row, "etaPlanDate", "date", "")}</label>
      <label><span>DTA (Actual)</span>${omProcurementInput(row, "dtaActualDate", "date", "")}</label>
      <label><span>Total LT</span>${omProcurementInput(row, "totalLeadTimeDays", "number", "days")}</label>
      <div class="reason-text">Given LT: ${row.givenLeadTimeDays === null || row.givenLeadTimeDays === undefined ? "-" : `${row.givenLeadTimeDays} days`}</div>
    </div>`;
}
```

In `renderOmFinalExport`, add cells:

```js
<td>${omPurposeDisplayCell(row)}</td>
<td>${omBudgetTrackingCell(row)}</td>
<td>${omProcurementTrackingCell(row)}</td>
<td>${omArrivalTrackingCell(row)}</td>
```

Remove the old `data-om-purpose-location` checkbox update path from the global input/change handler, or leave the handler unreachable after removing the checkbox markup. The desired product behavior is no OM editing for `purposeLocation`.

- [ ] **Step 5: Add OM update handler**

Add in `app.js`:

```js
function updateOmProcurementField(requestId, field, value) {
  const normalizedValue = ["budgetStatus", "prStatus", "poStatus"].includes(field)
    ? procurementStatusValue(value)
    : ["etaPlanDate", "dtaActualDate"].includes(field)
      ? dateOnly(value)
      : field === "totalLeadTimeDays"
        ? clampQty(value)
        : String(value || "").trim();
  requests = requests.map((row) => {
    if (row.id !== requestId) return row;
    const patch = { [field]: normalizedValue };
    if (field === "buyerPoNo") patch.poNo = normalizedValue;
    return { ...row, ...patch, omProcurementUpdatedAt: new Date().toISOString() };
  });
  const updated = requests.find((row) => row.id === requestId);
  addOmHistory(updated, `OM updated ${field}`, normalizedValue || "blank");
  renderOmPurchasing();
  renderBuyer();
  renderDepartment();
}
```

Add to the global input/change handler:

```js
const omProcurementField = event.target.dataset.omProcurementField;
const omProcurementId = event.target.dataset.omProcurementId;
if (omProcurementField && omProcurementId) {
  updateOmProcurementField(omProcurementId, omProcurementField, event.target.value);
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- PASS.

- [ ] **Step 7: Commit**

```bash
git add 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: move pr po tracking into om purchasing"
```

---

### Task 6: Downgrade Buyer Handoff To Status/History For These Fields

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Test: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Write failing Buyer Handoff contract**

Add to `tests/system-contract.test.js`:

```js
test("Buyer Handoff remains status history while OM owns PR PO edits", () => {
  const app = fs.readFileSync(path.join(PROJECT_ROOT, "app.js"), "utf8");
  const html = fs.readFileSync(path.join(PROJECT_ROOT, "index.html"), "utf8");
  const buyerPanel = between(html, '<section class="view" data-view="buyer">', '</section>');

  assert.match(app, /OM owns PR \/ PO tracking for IT items/);
  assert.doesNotMatch(buyerPanel, /data-buyer-field="prNo"/);
  assert.doesNotMatch(buyerPanel, /data-buyer-field="buyerPoNo"/);
  assert.match(buyerPanel, /PR No\./);
  assert.match(buyerPanel, /PO No\./);
});
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL because Buyer Handoff still exposes editable PR/PO inputs.

- [ ] **Step 3: Change Buyer render to read-only PR/PO**

In `renderBuyer`, replace editable PR/PO input cells:

```js
<td><input type="text" value="${row.prNo || ""}" placeholder="PR No." data-buyer-field="prNo" data-buyer-id="${row.id}" /></td>
<td><input type="text" value="${row.buyerPoNo || row.poNo || ""}" placeholder="PO No." data-buyer-field="buyerPoNo" data-buyer-id="${row.id}" /></td>
```

with:

```js
<td><strong>${row.prNo || "Pending"}</strong><div class="reason-text">OM owns PR / PO tracking for IT items</div></td>
<td><strong>${row.buyerPoNo || row.poNo || "Pending"}</strong><div class="reason-text">OM owns PR / PO tracking for IT items</div></td>
```

Leave `Record Progress` available only if current business wants Buyer Handoff history evidence. If it remains, do not let it overwrite OM-owned `prNo`, `buyerPoNo`, `poNo`, `etaPlanDate`, or `dtaActualDate`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- PASS.

- [ ] **Step 5: Commit**

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: make buyer handoff pr po read only"
```

---

### Task 7: Update Role And Module Context Docs

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/02-dept-dri.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Update Requester context**

Add to Requester 可操作功能:

```markdown
- `Purpose` 是 requester input，下拉值固定為 `SMT / FATP`；這不是 MFG station，也不是 Non-MFG department，OM 只追蹤不改寫 source of truth。
- Project line-open-date input 由 `Project Year / Project / Purpose(SMT or FATP) / Line open date` 組成；Line open date 是 project + purpose 共同行為。
- `Required delivery date` 是 requester 需求到廠日期，送出時寫入需求 row；Dept DRI 可在 review 時更新。
```

Add to 資料輸入 / 輸出:

```markdown
- 輸入：purposeLocation、lineOpenDate、requiredDeliveryDate。
- 系統輸出：dateOfRequest、requiredDeliveryDateFollowStageDate、givenLeadTimeDays。
```

- [ ] **Step 2: Update Dept DRI context**

Add to Dept DRI 可看資訊:

```markdown
- Requester purpose/date fields：Purpose(SMT/FATP)、Line open date、Date of request、Required delivery date、Required Delivery Date follow Stage date、Given LT(days)。
- Budget tracking fields：Budget status、Budget #。
```

Add to Dept DRI 可操作功能:

```markdown
- 可在 review 中更新 `Required delivery date`；`Budget status`、`Budget #` 為 OM input，Dept DRI 只檢視。
```

- [ ] **Step 3: Update OM Purchasing context**

Add to OM Purchasing 可操作功能:

```markdown
- OM 追蹤 requester `Purpose(SMT/FATP)`，只能看，不可改 requester purpose source of truth。
- 輸入 IT item PR/PO tracking：PR status、PR#、PO status、PO#、ETA(PLAN)、DTA(Actual)、#PUR request NO、total lead time。
- `#PUR request NO` 可由系統依 dept + project + quantity + item name + spec 建議，OM 可覆寫。
```

- [ ] **Step 4: Update Buyer Handoff context**

Replace the first-version operation wording with:

```markdown
- 本輪 prototype 中，IT item PR/PO/ETA/DTA/#PUR request NO 由 OM Purchasing 操作；Buyer Handoff 顯示 handoff status、history、PR/PO read-only 摘要與後續責任標示。
```

- [ ] **Step 5: Update module map**

Add under `OMWorkflowTable`:

```markdown
- OM Purchasing `My Exports` 整合 IT item PR/PO operation fields：Budget status/#、PR status/#、PO status/#、ETA(PLAN)、DTA(Actual)、#PUR request NO、total lead time。
```

Add under `Form Table` or Requester module notes:

```markdown
- Requester Purpose/Line Open Date input 是 scope-level form control：Purpose(SMT/FATP) + Line open date；Required delivery date 寫入 submitted rows。
```

- [ ] **Step 6: Commit**

```bash
git add 05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/02-dept-dri.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md 05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
git commit -m "docs: record purpose dates and om pr po ownership"
```

---

### Task 8: Full Verification

**Files:**
- Validate: `05-engineering-source/procurement-prototype/test.sh`

- [ ] **Step 1: Run standard test suite**

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
Browser Smoke: pass or skipped with explicit dependency reason
Accessibility Smoke: pass or skipped with explicit dependency reason
UI Quality: pass
```

- [ ] **Step 2: Manual rendered check**

Open local preview:

```bash
python3 -m http.server 8080 --directory "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置"
```

Visit:

```text
http://127.0.0.1:8080/05-engineering-source/procurement-prototype/
```

Check:
- Requester toolbar shows `Purpose` and `Line Open Date`.
- Requester required delivery date label is clear.
- Dept DRI detail/review shows Purpose, Line Open Date, Date of Request, Required Delivery Date, Required By Stage, Given LT, Budget Status, Budget #.
- OM Purchasing `My Exports` shows Budget, PR/PO, ETA/DTA, Total LT, and #PUR request fields.
- Buyer Handoff PR/PO cells are read-only summaries.

- [ ] **Step 3: Commit final validation updates if any**

If validation required small test/doc fixes:

```bash
git add 05-engineering-source/procurement-prototype
git commit -m "test: validate purpose date pr po workflow"
```

If no changes were needed, do not create an empty commit.

---

## Self-Review

Spec coverage:
- Requester `Purpose: SMT or FATP`: Task 2 and Task 3.
- Purpose is not station/department: Terminology section, Task 7 docs, Task 2 UI.
- OM tracking only for purpose: Task 5 tracks, Task 7 docs, source of truth remains requester row.
- Project line-open-date input `Project Year / Project / Purpose(SMT or FATP) / Date(Line open date)`: Task 2 and Task 3.
- Date of request system record by each item: Task 3.
- Required delivery date requester input and DRI update: Task 3 and Task 4.
- Line open date project/purpose shared behavior: Task 2 and Task 3.
- Required Delivery Date follow Stage date formula: Task 1 and Task 3.
- Given LT formula: Task 1 and Task 3.
- Total lead time OM input after PAS quote ID: Task 5.
- Budget status and Budget #: Task 5 OM input; Task 4 Dept DRI view only.
- Buyer IT item function integrated into OM Purchasing: Task 5 and Task 6.
- PR/PO/ETA/DTA/#PUR request fields: Task 5.

Placeholder scan:
- No unresolved placeholder text and no instruction-only test step without code.

Type consistency:
- `purposeLocation`, `lineOpenDate`, `dateOfRequest`, `requiredDeliveryDate`, `requiredDeliveryDateFollowStageDate`, `givenLeadTimeDays`, `totalLeadTimeDays`, `budgetStatus`, `budgetNo`, `prStatus`, `prNo`, `poStatus`, `buyerPoNo`, `etaPlanDate`, `dtaActualDate`, and `purRequestNo` are used consistently across tasks.

Risks:
- Existing tests currently contain guardrails that intentionally keep Buyer ETA/DTA out of OM. Task 5 changes that product decision and must update tests in the same commit.
- `Phase` is reserved for `P1.0 / P1.1 / EVT / DVT / PVT / MP`; SMT/FATP must be labeled `Purpose`, not `Phase`.
- Existing dirty worktree contains unrelated changes and deletions. Execution must not stage unrelated files.
