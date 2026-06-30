# OM Leader Project Stage Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Project Year / Project / Phase date ownership to OM Leader, keep Purpose and item-level Required Delivery Date as Requester input, and make every project phase input carry its configured Line open date for downstream calculations.

**Architecture:** Add a focused project-stage-calendar helper module for `Year Project + Project + Phase` calendar keys, phase-with-qty detection, and date-plan lookup. Wire OM Leader as the only business owner of editable phase calendar records; Requester keeps Purpose selection, while each phase group in the requester input carries the calendar-derived Line open date as phase metadata. OM Purchasing consumes the same phase metadata in tracking/detail surfaces.

**Tech Stack:** Static HTML prototype, vanilla JavaScript in `05-engineering-source/procurement-prototype/app.js`, focused browser-compatible CommonJS module under `app-modules/`, Node test runner via `node --test`, and full project validation through `./test.sh`.

---

## Startup Context Receipt

Read:
- `README.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/index.html`
- `05-engineering-source/procurement-prototype/tests/unit.test.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

Roles:
- OM Leader owns editable Project Stage Calendar setup.
- Requester owns demand creation, Purpose selection, and per-item Required Delivery Date, but does not input Line open date.
- OM Purchasing consumes Project Stage Calendar values for tracking and lead-time visibility, but does not edit project phase dates.

Flows/Modules:
- Main flow remains Requester -> Dept DRI -> Cost Manager -> OM Leader -> OM Purchasing -> Buyer Handoff.
- New helper module: `ProjectStageCalendarModule`.
- Existing helper module remains: `purpose-date.js` for SMT/FATP normalization and date arithmetic.

Worktree:
- `git status --short --branch` was inspected. The tree is already dirty with unrelated modified/deleted files and previous feature work. Execution must edit only the files listed in this plan and must not stage unrelated deletes, archive changes, generated artifacts, or prior work.

Decisions:
- `Purpose` remains `SMT / FATP` and is not `Phase`.
- `Phase` remains `P1.0 / P1.1 / EVT / DVT / PVT / MP`.
- OM Leader inputs project phase dates by `Year Project + Project + Phase`.
- Project Stage Calendar is global/canonical after OM Leader defines it; all roles and all purposes consume the same phase date for that Year Project + Project + Phase.
- Requester and OM team view and consume configured dates.
- `Line open date` is calendar-derived, not requester-entered; it is carried by the project phase input/phase group metadata.
- `Required Delivery Date` is requester-entered per item row, not a worksheet/scope-level shared footer input.
- `Required Delivery Date follow Stage date = Line open date - 14 days`.
- `Given LT = Required Delivery Date follow Stage date - Date of request`.

Gaps:
- None for current scope. A single worksheet row may contain qty in multiple phases, so this plan stores date planning by phase and keeps row-level legacy fields as display fallbacks only.

Next:
- Implement task-by-task with tests first.

---

## Boundary Map

Feature:
- OM Leader managed global Project Stage Calendar, consumed by Requester and OM team.

Function:
- OM Leader creates/updates calendar rows with `Year Project`, `Project`, `Phase`, and `Line open date`.
- Requester selects `Purpose`; each project phase input carries `Line open date` from OM Leader calendar.
- Requester inputs `Required Delivery Date` on each item row; submit validates only rows with qty in the current worksheet scope and requires each selected item to have its own date.
- Requester submit stamps item-level `Date of request` and automatically stores calendar-derived date planning for every phase that has qty on the item.
- OM Purchasing and OM Leader see the same phase-flexible date planning fields in OM surfaces.
- Existing OM procurement tracking fields remain OM Purchasing input.

Module:
- `05-engineering-source/procurement-prototype/app-modules/project-stage-calendar.js`
- `05-engineering-source/procurement-prototype/app-modules/purpose-date.js`
- `05-engineering-source/procurement-prototype/index.html`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/styles.css`
- `05-engineering-source/procurement-prototype/tests/unit.test.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

Non-scope:
- No DB migration.
- No external WMS write.
- No Notion, GitHub, deployment, or remote account write.
- No change to Dept DRI approval ownership.
- No rebuild of IT handoff packages unless Kai asks separately.
- No visual per-cell lead-time editing inside the Requester all-phase worksheet; phase-flexible calculation is stored and shown in detail/tracking surfaces.

Validation:
- `node --test tests/unit.test.js`
- `node --test tests/system-contract.test.js`
- `git diff --check -- <changed-files>`
- `./test.sh`

---

## Terminology And Ownership

| Field | Owner | Editable By | Visible To | Notes |
| --- | --- | --- | --- | --- |
| `Year Project` | OM Leader for calendar setup; Requester for demand scope | OM Leader in Project Stage Calendar; Requester in demand scope | Requester, Dept DRI, OM Leader, OM Purchasing | Calendar key component |
| `Project` | OM Leader for calendar setup; Requester for demand scope | OM Leader in Project Stage Calendar; Requester in demand scope | Requester, Dept DRI, OM Leader, OM Purchasing | Calendar key component |
| `Phase` | OM Leader calendar setup | OM Leader | Requester, Dept DRI, OM Leader, OM Purchasing | `P1.0 / P1.1 / EVT / DVT / PVT / MP`; calendar key component |
| `Purpose` | Requester demand intent | Requester selects on demand | Requester, Dept DRI, OM Leader, OM Purchasing | `SMT / FATP`, not phase and not part of OM Leader phase-date key |
| `Line open date` | OM Leader | OM Leader | Requester, Dept DRI, OM Leader, OM Purchasing | Global canonical date carried by project phase input metadata |
| `Date of request` | System | System only | Requester, Dept DRI, OM Leader, OM Purchasing | Item-level stamp |
| `Required Delivery Date` | Requester, update by Dept DRI | Requester per item row; Dept DRI in review detail | Requester, Dept DRI, OM Leader, OM Purchasing | Item-level desired arrival date, not worksheet-level shared input |
| `Date plan by phase` | System | System only | Requester, Dept DRI, OM Leader, OM Purchasing | One calculation record per item phase with qty |
| `Required Delivery Date follow Stage date` | System | System only | Requester, Dept DRI, OM Leader, OM Purchasing | Per phase: `lineOpenDate - 14 days` |
| `Given LT` | System | System only | Requester, Dept DRI, OM Leader, OM Purchasing | Per phase: `requiredByStage - dateOfRequest` |

---

### Task 1: Add Project Stage Calendar Helper Module

**Files:**
- Create: `05-engineering-source/procurement-prototype/app-modules/project-stage-calendar.js`
- Modify: `05-engineering-source/procurement-prototype/tests/unit.test.js`

- [ ] **Step 1: Write failing unit tests**

Add this import near the other module imports in `tests/unit.test.js`:

```js
const projectStageCalendar = require("../app-modules/project-stage-calendar.js");
```

Add these tests after the existing `purpose date helper derives required date and given lead time` test:

```js
test("project stage calendar key uses year project project and phase only", () => {
  assert.equal(
    projectStageCalendar.projectStageCalendarKey({
      yearProject: "P26 Demo line",
      projectCode: "4cs4",
      phase: "EVT",
    }),
    "P26 Demo line|||4CS4|||evt",
  );
});

test("project stage calendar finds line open date by calendar key", () => {
  const records = [
    {
      yearProject: "P26 Demo line",
      projectCode: "4CS4",
      phase: "evt",
      lineOpenDate: "2026-08-20",
    },
  ];

  assert.equal(
    projectStageCalendar.lineOpenDateForProjectStage(records, {
      yearProject: "P26 Demo line",
      projectCode: "4CS4",
      phase: "EVT",
    }),
    "2026-08-20",
  );
});

test("project stage calendar keeps every item phase with qty", () => {
  const row = { p10: 0, p11: 3, evt: 4, dvt: 0, pvt: 2 };
  assert.deepEqual(projectStageCalendar.requestStagesWithQty(row), ["p11", "evt", "pvt"]);
});

test("project stage calendar builds date plan by every requested phase", () => {
  const records = [
    { yearProject: "P26 Demo line", projectCode: "4CS4", phase: "p11", lineOpenDate: "2026-08-10" },
    { yearProject: "P26 Demo line", projectCode: "4CS4", phase: "evt", lineOpenDate: "2026-08-20" },
  ];
  const plan = projectStageCalendar.datePlanByPhase(records, {
    yearProject: "P26 Demo line",
    projectCode: "4CS4",
    row: { p11: 3, evt: 4 },
    dateOfRequest: "2026-07-30",
  });

  assert.deepEqual(plan, {
    p11: {
      phase: "p11",
      lineOpenDate: "2026-08-10",
      requiredDeliveryDateFollowStageDate: "2026-07-27",
      givenLeadTimeDays: -3,
    },
    evt: {
      phase: "evt",
      lineOpenDate: "2026-08-20",
      requiredDeliveryDateFollowStageDate: "2026-08-06",
      givenLeadTimeDays: 7,
    },
  });
});
```

- [ ] **Step 2: Run unit tests to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:
- FAIL with `Cannot find module '../app-modules/project-stage-calendar.js'`.

- [ ] **Step 3: Create the helper module**

Create `app-modules/project-stage-calendar.js` with this complete content:

```js
(function initProjectStageCalendarModule(root, factory) {
  const moduleValue = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = moduleValue;
  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.projectStageCalendar = moduleValue;
})(typeof globalThis !== "undefined" ? globalThis : window, function projectStageCalendarFactory() {
  const STAGES = ["p10", "p11", "evt", "dvt", "pvt", "mp"];

  function normalizeYearProject(value = "") {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function normalizeProjectCode(value = "") {
    return String(value || "").trim().replace(/\s+/g, "").toUpperCase();
  }

  function phaseKeyFromInput(value = "") {
    const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
    const aliases = {
      p10: "p10",
      p1: "p10",
      "p1.0": "p10",
      p11: "p11",
      "p1.1": "p11",
      evt: "evt",
      dvt: "dvt",
      pvt: "pvt",
      mp: "mp",
    };
    return aliases[normalized] || "";
  }

  function dateOnly(value = "") {
    const text = String(value || "").slice(0, 10);
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) return "";
    return text;
  }

  function addDaysIsoDate(value = "", days = 0) {
    const text = dateOnly(value);
    if (!text) return "";
    const date = new Date(`${text}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return "";
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function daysBetweenIsoDates(start = "", end = "") {
    const startText = dateOnly(start);
    const endText = dateOnly(end);
    if (!startText || !endText) return null;
    const startDate = new Date(`${startText}T00:00:00Z`);
    const endDate = new Date(`${endText}T00:00:00Z`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
    return Math.round((endDate - startDate) / 86400000);
  }

  function requestStagesWithQty(row = {}, stages = STAGES) {
    const qtyStages = stages.filter((stage) => Number(row[stage] || 0) > 0);
    if (qtyStages.length) return qtyStages;
    const direct = phaseKeyFromInput(row.phase || row.defaultPhase || row.currentPhase);
    return direct && stages.includes(direct) ? [direct] : [];
  }

  function normalizeProjectStageCalendarRecord(record = {}) {
    return {
      id: String(record.id || "").trim(),
      yearProject: normalizeYearProject(record.yearProject || record.project || ""),
      projectCode: normalizeProjectCode(record.projectCode || record.projectModel || record.project || ""),
      phase: phaseKeyFromInput(record.phase || record.stage || ""),
      lineOpenDate: dateOnly(record.lineOpenDate || record.phaseDate || record.date || ""),
      updatedAt: record.updatedAt || "",
      updatedBy: record.updatedBy || "",
    };
  }

  function projectStageCalendarKey(context = {}) {
    const normalized = normalizeProjectStageCalendarRecord(context);
    return [
      normalized.yearProject,
      normalized.projectCode || normalizeProjectCode(context.yearProject || ""),
      normalized.phase,
    ].join("|||");
  }

  function findProjectStageCalendarRecord(records = [], context = {}) {
    const targetKey = projectStageCalendarKey(context);
    return records
      .map(normalizeProjectStageCalendarRecord)
      .find((record) => projectStageCalendarKey(record) === targetKey) || null;
  }

  function lineOpenDateForProjectStage(records = [], context = {}) {
    return findProjectStageCalendarRecord(records, context)?.lineOpenDate || "";
  }

  function datePlanByPhase(records = [], { yearProject = "", projectCode = "", row = {}, dateOfRequest = "" } = {}) {
    return Object.fromEntries(requestStagesWithQty(row).map((phase) => {
      const lineOpenDate = lineOpenDateForProjectStage(records, { yearProject, projectCode, phase });
      const requiredDeliveryDateFollowStageDate = addDaysIsoDate(lineOpenDate, -14);
      return [phase, {
        phase,
        lineOpenDate,
        requiredDeliveryDateFollowStageDate,
        givenLeadTimeDays: daysBetweenIsoDates(dateOfRequest, requiredDeliveryDateFollowStageDate),
      }];
    }));
  }

  function upsertProjectStageCalendarRecord(records = [], record = {}, now = new Date().toISOString()) {
    const normalized = {
      ...normalizeProjectStageCalendarRecord(record),
      id: record.id || `calendar-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
      updatedAt: record.updatedAt || now,
      updatedBy: record.updatedBy || "OM Leader",
    };
    const targetKey = projectStageCalendarKey(normalized);
    const next = records
      .map(normalizeProjectStageCalendarRecord)
      .filter((item) => projectStageCalendarKey(item) !== targetKey);
    return [...next, normalized].sort((left, right) =>
      `${left.yearProject} ${left.projectCode} ${left.phase}`
        .localeCompare(`${right.yearProject} ${right.projectCode} ${right.phase}`),
    );
  }

  return {
    STAGES,
    normalizeProjectStageCalendarRecord,
    projectStageCalendarKey,
    findProjectStageCalendarRecord,
    lineOpenDateForProjectStage,
    requestStagesWithQty,
    datePlanByPhase,
    upsertProjectStageCalendarRecord,
  };
});
```

- [ ] **Step 4: Run unit tests to verify pass**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:
- PASS for all unit tests.

- [ ] **Step 5: Commit this task**

Run:

```bash
git add 05-engineering-source/procurement-prototype/app-modules/project-stage-calendar.js 05-engineering-source/procurement-prototype/tests/unit.test.js
git commit -m "feat: add project stage calendar helpers"
```

Expected:
- Commit succeeds only with these two files staged. If unrelated files appear in `git status`, leave them unstaged.

---

### Task 2: Add OM Leader Project Stage Calendar UI Contract

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Write failing system contract test**

Add this test near the existing OM contract tests in `tests/system-contract.test.js`:

```js
test("OM Leader owns Project Stage Calendar and requester phases carry line open dates", () => {
  const requesterView = between(html, '<section class="view active" data-view="department">', '<section class="view" data-view="projectStatus">');
  const omView = between(html, '<section class="view" data-view="om">', '<section class="view" data-view="buyer">');

  assert.match(html, /app-modules\/project-stage-calendar\.js/);
  assert.match(omView, /Project Stage Calendar/);
  assert.match(omView, /id="omStageCalendarYearProject"/);
  assert.match(omView, /id="omStageCalendarProjectCode"/);
  assert.match(omView, /id="omStageCalendarPhase"/);
  assert.match(omView, /id="omStageCalendarLineOpenDate"/);
  assert.match(omView, /data-action="saveOmStageCalendar"/);
  assert.doesNotMatch(omView, /id="omStageCalendarPurpose"/);

  assert.doesNotMatch(requesterView, /id="requestLineOpenDateInput"/);
  assert.match(requesterView, /id="requestPhaseDateSource"/);
  assert.match(app, /data-request-phase-line-open-date/);
  assert.doesNotMatch(app, /setRequestProjectPurposeLineOpenDate\(event\.target\.value\)/);
});
```

- [ ] **Step 2: Run system contract test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL because `project-stage-calendar.js`, OM Leader Project Stage Calendar UI, and requester phase-date metadata are not present.

- [ ] **Step 3: Add script tag and Requester phase-date source UI**

In `index.html`, add this script after `purpose-date.js`:

```html
  <script src="./app-modules/project-stage-calendar.js?20260629-local-preview-v10"></script>
```

Remove the Requester toolbar `Line Open Date` input:

```html
            <label class="project-picker">
              Line Open Date
              <input id="requestLineOpenDateInput" type="date" />
            </label>
```

Add this phase-date source element next to `requestWorksheetCurrentPhaseIndicator` in the Request Worksheet header:

```html
                    <span id="requestPhaseDateSource" class="field-helper">Phase date follows OM Leader calendar</span>
```

- [ ] **Step 4: Add OM Leader Project Stage Calendar panel**

Inside the OM view, in the Submission Dashboard panel near the exchange-rate utility, add:

```html
              <section class="om-tool-panel" id="omProjectStageCalendarPanel">
                <div class="panel-title">
                  <div>
                    <h4>Project Stage Calendar</h4>
                    <p class="panel-subcopy">OM Leader maintains phase dates. Requester and OM team consume these dates automatically.</p>
                  </div>
                  <span class="status-pill" id="omStageCalendarOwnerBadge">OM Leader Input</span>
                </div>
                <div class="om-stage-calendar-form">
                  <label>
                    Year Project
                    <select id="omStageCalendarYearProject"></select>
                  </label>
                  <label>
                    Project
                    <select id="omStageCalendarProjectCode"></select>
                  </label>
                  <label>
                    Phase
                    <select id="omStageCalendarPhase">
                      <option value="p10">P1.0</option>
                      <option value="p11">P1.1</option>
                      <option value="evt">EVT</option>
                      <option value="dvt">DVT</option>
                      <option value="pvt">PVT</option>
                      <option value="mp">MP</option>
                    </select>
                  </label>
                  <label>
                    Line Open Date
                    <input id="omStageCalendarLineOpenDate" type="date" />
                  </label>
                  <button class="primary" type="button" data-action="saveOmStageCalendar">Save Date</button>
                </div>
                <div class="table-wrap om-stage-calendar-table-wrap">
                  <table class="data-table workflow-table om-stage-calendar-table">
                    <thead>
                      <tr>
                        <th>Year Project</th>
                        <th>Project</th>
                        <th>Phase</th>
                        <th>Line Open Date</th>
                        <th>Required By Stage</th>
                        <th>Updated</th>
                      </tr>
                    </thead>
                    <tbody id="omStageCalendarRows"></tbody>
                  </table>
                </div>
              </section>
```

- [ ] **Step 5: Bump local preview cache keys**

In `index.html`, update `mva-local-preview-version` and every local `.js` / `.css` query string from the current feature version to:

```text
20260629-local-preview-v10
```

- [ ] **Step 6: Run system contract test to verify UI contract passes**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- The new test may still fail on JavaScript function references that are added in Task 3, but the HTML assertions should pass.

- [ ] **Step 7: Commit this task**

Run:

```bash
git add 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: add om leader project stage calendar shell"
```

Expected:
- Commit contains only `index.html` and `tests/system-contract.test.js`.

---

### Task 3: Wire Calendar State Into App Logic

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Add failing app contract assertions**

Extend the `OM Leader owns Project Stage Calendar and requester phases carry line open dates` test with these assertions:

```js
  assert.match(app, /function projectStageCalendarModule/);
  assert.match(app, /let projectStageCalendarRecords = /);
  assert.match(app, /function lineOpenDateForRequestScope/);
  assert.match(app, /function renderOmProjectStageCalendar/);
  assert.match(app, /function saveOmStageCalendarFromForm/);
  assert.match(app, /data-action="saveOmStageCalendar"/);
  assert.match(app, /projectStageCalendarRecords = projectStageCalendarModule\(\)\.upsertProjectStageCalendarRecord/);
```

- [ ] **Step 2: Run system contract test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL because the functions and state do not exist yet.

- [ ] **Step 3: Add module accessor and state**

In `app.js`, add this accessor near the existing module accessors:

```js
function projectStageCalendarModule() {
  return globalThis.ProcurementApp?.modules?.projectStageCalendar || {};
}
```

Add this state near existing top-level mutable state:

```js
let projectStageCalendarRecords = [
  { id: "calendar-p26-4cs4-p11", yearProject: "P26 Demo line", projectCode: "4CS4", phase: "p11", lineOpenDate: "2026-08-10", updatedBy: "system-seed", updatedAt: "2026-06-01T00:00:00.000Z" },
  { id: "calendar-p26-4cs4-evt", yearProject: "P26 Demo line", projectCode: "4CS4", phase: "evt", lineOpenDate: "2026-08-20", updatedBy: "system-seed", updatedAt: "2026-06-01T00:00:00.000Z" },
];
```

- [ ] **Step 4: Replace requester-owned project-purpose date storage**

Remove this state:

```js
let requestProjectPurposeDates = {};
```

Replace the existing `requestProjectPurposeKey`, `requestProjectPurposeLineOpenDate`, and `setRequestProjectPurposeLineOpenDate` functions with:

```js
function requestStagesForDatePlan(row = {}) {
  return projectStageCalendarModule().requestStagesWithQty?.(row, STAGES)
    || STAGES.filter((stage) => Number(row?.[stage] || 0) > 0);
}

function lineOpenDateForRequestScope({
  yearProject = currentProject,
  projectCode = currentProjectCode,
  phase = requestWorksheetVisiblePhase || requestWorksheetAddPhase,
} = {}) {
  return projectStageCalendarModule().lineOpenDateForProjectStage?.(projectStageCalendarRecords, {
    yearProject,
    projectCode,
    phase,
  }) || "";
}

function datePlanByPhaseForRow(row = {}) {
  return projectStageCalendarModule().datePlanByPhase?.(projectStageCalendarRecords, {
    yearProject: row.yearProject || row.project || currentProject,
    projectCode: row.projectCode || currentProjectCode,
    row,
    dateOfRequest: dateOfRequestForRow(row),
  }) || {};
}
```

- [ ] **Step 5: Update Requester sync so phase UI shows calendar-derived date**

Replace `syncRequestPurposeDateInputs` with:

```js
function syncRequestPurposeDateInputs() {
  const purposeSelect = document.getElementById("requestPurposeLocationInput");
  const source = document.getElementById("requestPhaseDateSource");
  currentPurposeLocation = normalizePurposeLocation(currentPurposeLocation);
  if (purposeSelect && purposeSelect.value !== currentPurposeLocation) {
    purposeSelect.value = currentPurposeLocation;
  }
  const calendarDate = lineOpenDateForRequestScope({
    yearProject: currentProject,
    projectCode: currentProjectCode,
    phase: requestWorksheetVisiblePhase || requestWorksheetAddPhase,
  });
  if (source) {
    source.textContent = calendarDate
      ? `${stageLabel(requestWorksheetVisiblePhase || requestWorksheetAddPhase)} Line open date ${calendarDate}`
      : `${stageLabel(requestWorksheetVisiblePhase || requestWorksheetAddPhase)} missing OM Leader phase date`;
  }
}
```

Add this helper near the Requester worksheet rendering helpers:

```js
function requestPhaseLineOpenDateAttrs(phase) {
  const lineOpenDate = lineOpenDateForRequestScope({
    yearProject: currentProject,
    projectCode: currentProjectCode,
    phase,
  });
  return `data-request-phase-line-open-date="${htmlAttr(lineOpenDate)}" title="${htmlAttr(lineOpenDate ? `${stageLabel(phase)} Line open date ${lineOpenDate}` : `${stageLabel(phase)} missing OM Leader phase date`)}"`;
}
```

Update the phase group header / phase jump button rendering so each phase control includes:

```js
${requestPhaseLineOpenDateAttrs(phase)}
```

- [ ] **Step 6: Update row date normalization**

Replace the first half of `normalizeRequesterDateFields` with:

```js
function normalizeRequesterDateFields(row = {}) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose || currentPurposeLocation);
  const dateOfRequest = dateOfRequestForRow(row);
  const datePlanByPhase = datePlanByPhaseForRow({ ...row, purposeLocation, dateOfRequest });
  const displayPhase = requestStagesForDatePlan(row)[0] || row.phase || row.defaultPhase || requestWorksheetVisiblePhase || requestWorksheetAddPhase;
  const displayPlan = datePlanByPhase[displayPhase] || {};
  const lineOpenDate = dateOnly(row.lineOpenDate || displayPlan.lineOpenDate || "");
  const requiredDeliveryDate = dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || "");
  const requiredByStage = displayPlan.requiredDeliveryDateFollowStageDate || requiredDeliveryDateFollowStageDate(lineOpenDate);
  return {
    ...row,
    phase: displayPhase,
    purposeLocation,
    purpose: purposeLocation,
    lineOpenDate,
    datePlanByPhase,
    dateOfRequest,
    requiredDeliveryDate,
    requiredDeliveryDateFollowStageDate: requiredByStage,
    givenLeadTimeDays: displayPlan.givenLeadTimeDays ?? givenLeadTimeDays(dateOfRequest, lineOpenDate),
  };
}
```

- [ ] **Step 7: Remove requester line-open-date write handler**

Remove this change handler:

```js
  if (event.target.id === "requestLineOpenDateInput") {
    setRequestProjectPurposeLineOpenDate(event.target.value);
    editableRequesterRowsInCurrentScope().forEach((row) => {
      Object.assign(row, normalizeRequesterDateFields({ ...row, purposeLocation: currentPurposeLocation, lineOpenDate: event.target.value }));
    });
    renderDepartment();
  }
```

Do not add a replacement handler. Requester has no `Line Open Date` input; phase controls carry the date metadata.

- [ ] **Step 8: Update request draft overrides**

In `requestWorksheetOverrides`, replace the `lineOpenDate` line with:

```js
  const displayPhase = phases[0] || requestWorksheetAddPhase;
  const lineOpenDate = lineOpenDateForRequestScope({
    yearProject: currentProject,
    projectCode: currentProjectCode,
    phase: displayPhase,
  });
```

In the returned object, keep the compatibility fields and let `normalizeRequesterDateFields` fill `datePlanByPhase`:

```js
    phase: displayPhase,
    defaultPhase: displayPhase,
    lineOpenDate,
    requiredDeliveryDate: requiredDeliveryDateFollowStageDate(lineOpenDate),
```

- [ ] **Step 9: Add OM Leader calendar render/save functions**

Add these functions near `renderOmExchangeRatePanel`:

```js
function canMaintainProjectStageCalendar() {
  return ["omLeader", "admin"].includes(currentRole);
}

function syncOmStageCalendarFormOptions() {
  const yearSelect = document.getElementById("omStageCalendarYearProject");
  const projectSelect = document.getElementById("omStageCalendarProjectCode");
  const phaseSelect = document.getElementById("omStageCalendarPhase");
  if (yearSelect) {
    const currentValue = yearSelect.value || currentProject;
    yearSelect.innerHTML = G_YEAR_PROJECT_OPTIONS.map((value) => `<option value="${htmlAttr(value)}" ${value === currentValue ? "selected" : ""}>${htmlText(value)}</option>`).join("");
    if (G_YEAR_PROJECT_OPTIONS.includes(currentValue)) yearSelect.value = currentValue;
  }
  if (projectSelect) {
    const currentValue = projectSelect.value || currentProjectCode || G_PROJECT_CODE_OPTIONS[0];
    projectSelect.innerHTML = G_PROJECT_CODE_OPTIONS.map((value) => `<option value="${htmlAttr(value)}" ${value === currentValue ? "selected" : ""}>${htmlText(value)}</option>`).join("");
    if (G_PROJECT_CODE_OPTIONS.includes(currentValue)) projectSelect.value = currentValue;
  }
  if (phaseSelect && !STAGES.includes(phaseSelect.value)) phaseSelect.value = requestWorksheetVisiblePhase || STAGES[0];
}

function renderOmProjectStageCalendar() {
  syncOmStageCalendarFormOptions();
  const canMaintain = canMaintainProjectStageCalendar();
  const panel = document.getElementById("omProjectStageCalendarPanel");
  const ownerBadge = document.getElementById("omStageCalendarOwnerBadge");
  if (panel) panel.classList.toggle("is-read-only", !canMaintain);
  if (ownerBadge) ownerBadge.textContent = canMaintain ? "OM Leader Input" : "Read Only";
  ["omStageCalendarYearProject", "omStageCalendarProjectCode", "omStageCalendarPhase", "omStageCalendarLineOpenDate"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.disabled = !canMaintain;
  });
  const saveButton = document.querySelector("[data-action='saveOmStageCalendar']");
  if (saveButton) saveButton.disabled = !canMaintain;
  const rows = document.getElementById("omStageCalendarRows");
  if (!rows) return;
  rows.innerHTML = projectStageCalendarRecords.length
    ? projectStageCalendarRecords.map((record) => {
      const normalized = projectStageCalendarModule().normalizeProjectStageCalendarRecord?.(record) || record;
      return `
        <tr>
          <td>${htmlText(normalized.yearProject || "-")}</td>
          <td>${htmlText(normalized.projectCode || "-")}</td>
          <td>${htmlText(stageLabel(normalized.phase))}</td>
          <td>${htmlText(normalized.lineOpenDate || "-")}</td>
          <td>${htmlText(requiredDeliveryDateFollowStageDate(normalized.lineOpenDate) || "-")}</td>
          <td><div class="reason-text">${htmlText(normalized.updatedBy || "OM Leader")}${normalized.updatedAt ? ` · ${compactDateTime(normalized.updatedAt)}` : ""}</div></td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="6" class="empty-cell">No project stage calendar dates have been configured.</td></tr>`;
}

function saveOmStageCalendarFromForm() {
  if (!canMaintainProjectStageCalendar()) {
    showToast("Only OM Leader or Admin can maintain Project Stage Calendar.", "error");
    renderOmProjectStageCalendar();
    return;
  }
  const record = {
    yearProject: document.getElementById("omStageCalendarYearProject")?.value || "",
    projectCode: document.getElementById("omStageCalendarProjectCode")?.value || "",
    phase: document.getElementById("omStageCalendarPhase")?.value || "",
    lineOpenDate: document.getElementById("omStageCalendarLineOpenDate")?.value || "",
    updatedBy: currentUser?.name || "OM Leader",
  };
  if (!record.yearProject || !record.projectCode || !record.phase || !record.lineOpenDate) {
    showToast("Fill Year Project, Project, Phase, and Line Open Date.", "error");
    return;
  }
  projectStageCalendarRecords = projectStageCalendarModule().upsertProjectStageCalendarRecord(projectStageCalendarRecords, record);
  requests = requests.map((row) => normalizeRequesterDateFields(row));
  renderOmPurchasing();
  renderDepartment();
  showToast("Project Stage Calendar date saved.", "success");
}
```

- [ ] **Step 10: Call calendar renderer and action handler**

In `renderOmSubmission`, after `renderOmExchangeRatePanel();`, add:

```js
  renderOmProjectStageCalendar();
```

In the global click handler near other `data-action` checks, add:

```js
  if (action === "saveOmStageCalendar") saveOmStageCalendarFromForm();
```

- [ ] **Step 11: Run system contract test**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- PASS for the OM Leader calendar ownership contract.

- [ ] **Step 12: Commit this task**

Run:

```bash
git add 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: wire om leader stage calendar dates"
```

Expected:
- Commit contains only `app.js` and `tests/system-contract.test.js`.

---

### Task 4: Move Required Delivery Date To Item Rows

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`
- Modify: `05-engineering-source/procurement-prototype/app.js`
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

- [ ] **Step 1: Write failing system contract test**

Update the existing Requester workspace contract in `tests/system-contract.test.js`:

Remove these old scope-level assertions:

```js
  assert.match(departmentView, /id="requestPackageNeedDate"/);
  assert.match(departmentView, /id="requestPackageNeedDateLabel"/);
  assert.match(app, /requestNeedDateScopeKey/);
  assert.match(app, /requestNeedDateByScope/);
  assert.match(app, /requestPackageNeedDateValue/);
```

Add these item-level assertions in the same Requester workspace test:

```js
  assert.doesNotMatch(departmentView, /id="requestPackageNeedDate"/);
  assert.doesNotMatch(departmentView, /id="requestPackageNeedDateLabel"/);
  assert.doesNotMatch(app, /requestNeedDateByScope/);
  assert.doesNotMatch(app, /requestNeedDateScopeKey/);
  assert.match(app, /function requestWorksheetRequiredDeliveryDateInput/);
  assert.match(app, /data-request-required-delivery-date/);
  assert.match(app, /function updateRequestRowRequiredDeliveryDate/);
  assert.match(app, /Required Delivery Date is required for each selected item/);
```

- [ ] **Step 2: Run system contract test to verify failure**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- FAIL because the footer-level `requestPackageNeedDate` still exists and row-level date input functions do not exist yet.

- [ ] **Step 3: Remove the worksheet-level date input from HTML**

In `index.html`, replace:

```html
                <div class="request-submit-bar">
                  <label>
                    <span id="requestPackageNeedDateLabel">Required Delivery Date</span>
                    <input id="requestPackageNeedDate" type="date" />
                  </label>
                  <button class="ghost" data-action="saveRequesterDraft">Save Draft</button>
                  <button class="primary" data-action="submitRequests">Submit</button>
                </div>
```

with:

```html
                <div class="request-submit-bar">
                  <button class="ghost" data-action="saveRequesterDraft">Save Draft</button>
                  <button class="primary" data-action="submitRequests">Submit</button>
                </div>
```

- [ ] **Step 4: Remove requester scope need-date state**

In `app.js`, remove the top-level state:

```js
const requestNeedDateByScope = new Map();
```

Remove these functions completely:

```js
function requestNeedDateScopeKey({ project = currentProject, requestLine = requestWorksheetLine, mode = requestWorksheetMode } = {}) {
  return [project || currentProject, requestLine || "Line 1", quantityReviewModeValue(mode)].join("|||");
}

function requestNeedDateScopeLabel({ requestLine = requestWorksheetLine, mode = requestWorksheetMode } = {}) {
  return `${quantityReviewModeLabel(mode)} / ${requestLine || "Line 1"}`;
}

function currentRequestScopeNeedDateFromRows() {
  const rows = activeProjectRequests().filter((row) => requestRowMatchesSubmitScope(row));
  return rows.map(needDateForRow).find(Boolean) || "";
}

function currentRequestScopeNeedDate() {
  return requestNeedDateByScope.get(requestNeedDateScopeKey()) || currentRequestScopeNeedDateFromRows();
}

function setCurrentRequestScopeNeedDate(value = "") {
  const key = requestNeedDateScopeKey();
  const next = value || "";
  if (next) requestNeedDateByScope.set(key, next);
  else requestNeedDateByScope.delete(key);
}

function syncRequestPackageNeedDateInput() {
  const input = document.getElementById("requestPackageNeedDate");
  const label = document.getElementById("requestPackageNeedDateLabel");
  if (label) label.textContent = "Required Delivery Date";
  if (!input) return;
  input.value = currentRequestScopeNeedDate();
  input.setAttribute("aria-label", `${requestNeedDateScopeLabel()} Required Delivery Date`);
}

function requestPackageNeedDateValue() {
  return document.getElementById("requestPackageNeedDate")?.value || currentRequestScopeNeedDate();
}
```

Remove every call to `syncRequestPackageNeedDateInput()`, `setCurrentRequestScopeNeedDate(...)`, and `requestPackageNeedDateValue()`.

- [ ] **Step 5: Add item-row Required Delivery Date input**

Add this helper near `requestWorksheetActionControl`:

```js
function requestWorksheetRequiredDeliveryDateInput(row = {}) {
  const editable = canRequesterEditRequest(row);
  const value = dateOnly(row.requiredDeliveryDate || row.needDate || "");
  if (!editable) {
    return `
      <div class="request-required-date-control readonly">
        <span>Required Delivery Date</span>
        <strong>${htmlText(value || "-")}</strong>
      </div>`;
  }
  return `
    <label class="request-required-date-control">
      <span>Required Delivery Date</span>
      <input type="date" value="${htmlAttr(value)}" data-request-required-delivery-date="${htmlAttr(row.id)}" aria-label="Required Delivery Date for ${htmlAttr(row.name || "request item")}" />
    </label>`;
}
```

Update `requestWorksheetHintCell(row)` so the returned stack includes the row-level date input before `requestWorksheetActionControl(row)`:

```js
  return `
    <div class="request-hint-stack">
      <div class="request-hint-badges">${hintHtml}</div>
      ${requestWorksheetRequiredDeliveryDateInput(row)}
      ${requestWorksheetActionControl(row)}
    </div>`;
```

- [ ] **Step 6: Add row date update handler**

Add this function near other requester row update helpers:

```js
function updateRequestRowRequiredDeliveryDate(requestId, value) {
  const nextDate = dateOnly(value);
  requests = requests.map((row) => {
    if (row.id !== requestId) return row;
    return normalizeRequesterDateFields({
      ...row,
      needDate: nextDate,
      requiredDeliveryDate: nextDate,
      requiredDeliveryDateDri: row.requiredDeliveryDateDri && row.requiredDeliveryDateDri !== row.requiredDeliveryDate
        ? row.requiredDeliveryDateDri
        : nextDate,
    });
  });
  renderRequestRows();
  renderSelectedDemandLines();
}
```

In the global change handler, add:

```js
  const requiredDeliveryDateRequestId = event.target.dataset.requestRequiredDeliveryDate;
  if (requiredDeliveryDateRequestId) {
    updateRequestRowRequiredDeliveryDate(requiredDeliveryDateRequestId, event.target.value);
  }
```

- [ ] **Step 7: Update save and submit logic**

In `saveRequesterDraft`, remove all `packageNeedDate` logic. The updated body should keep each row's own date:

```js
function saveRequesterDraft() {
  const rows = requesterPackageRows();
  const now = new Date().toISOString();
  requests = requests.map((row) => rows.some((item) => item.id === row.id)
    ? normalizeRequesterDateFields({
      ...row,
      draftSavedAt: now,
      purposeLocation: currentPurposeLocation,
    })
    : row);
  renderRequestRows();
  renderSelectedDemandLines();
  showToast(rows.length ? `${rows.length} worksheet item${rows.length === 1 ? "" : "s"} saved.` : "No worksheet items on this line yet.", rows.length ? "success" : "info");
}
```

In `submitRequests`, remove:

```js
  const packageNeedDate = requestPackageNeedDateValue();
```

Remove:

```js
  if (!packageNeedDate) {
    showToast(`${quantityReviewModeLabel(requestWorksheetMode)} Need Date is required before submitting this demand scope.`, "error");
    return;
  }
```

Add this validation after `selectedRows` is known:

```js
  const rowsMissingRequiredDeliveryDate = selectedRows.filter((row) => !dateOnly(row.requiredDeliveryDate || row.needDate || ""));
  if (rowsMissingRequiredDeliveryDate.length) {
    showToast("Required Delivery Date is required for each selected item before submitting to Dept DRI.", "error");
    return;
  }
```

In the submitted row patch, replace the package-level date assignment:

```js
        needDate: packageNeedDate,
        requiredDeliveryDate: packageNeedDate,
        requiredDeliveryDateDri: packageNeedDate,
        requestDeadline: row.requestDeadline || packageNeedDate,
```

with item-level values:

```js
        needDate: dateOnly(row.requiredDeliveryDate || row.needDate || ""),
        requiredDeliveryDate: dateOnly(row.requiredDeliveryDate || row.needDate || ""),
        requiredDeliveryDateDri: dateOnly(row.requiredDeliveryDateDri || row.requiredDeliveryDate || row.needDate || ""),
        requestDeadline: row.requestDeadline || dateOnly(row.requiredDeliveryDate || row.needDate || ""),
```

- [ ] **Step 8: Update worksheet summary copy**

In `renderRequestRows`, replace the missing scope date copy:

```js
summary.textContent = `${quantityReviewModeLabel(requestWorksheetMode)} Need Date is still required before this scope can be submitted.`;
```

with:

```js
summary.textContent = `Required Delivery Date is required on each item row before submitting to Dept DRI.`;
```

- [ ] **Step 9: Run tests for this task**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- PASS for Requester item-level Required Delivery Date contract.

- [ ] **Step 10: Commit this task**

Run:

```bash
git add 05-engineering-source/procurement-prototype/index.html 05-engineering-source/procurement-prototype/app.js 05-engineering-source/procurement-prototype/tests/system-contract.test.js
git commit -m "feat: make requester required delivery date item-level"
```

Expected:
- Commit contains only `index.html`, `app.js`, and `tests/system-contract.test.js`.

---

### Task 5: Style The Calendar And Row Date Controls Without Disturbing Existing OM Tables

**Files:**
- Modify: `05-engineering-source/procurement-prototype/styles.css`

- [ ] **Step 1: Add focused CSS**

Add this block near other OM panel/table styles:

```css
.request-required-date-control {
  display: grid;
  gap: 3px;
  min-width: 150px;
}

.request-required-date-control span {
  color: #47606b;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.1;
  text-transform: uppercase;
}

.request-required-date-control input {
  width: 100%;
  min-width: 0;
  height: 26px;
  padding: 3px 6px;
  border: 1px solid #c8d8e0;
  border-radius: 4px;
  background: #fff;
  color: var(--navy);
  font-size: 12px;
}

.request-required-date-control.readonly strong {
  color: var(--navy);
  font-size: 12px;
  line-height: 1.2;
}

.om-stage-calendar-form {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr)) auto;
  gap: 8px;
  align-items: end;
}

.om-stage-calendar-form label {
  display: grid;
  gap: 4px;
  color: #47606b;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.om-stage-calendar-form input,
.om-stage-calendar-form select {
  width: 100%;
  min-width: 0;
  height: 30px;
  border: 1px solid #c8d8e0;
  border-radius: 4px;
  background: #fff;
  color: var(--navy);
  font-size: 12px;
}

.om-stage-calendar-table-wrap {
  margin-top: 10px;
}

.om-stage-calendar-table th,
.om-stage-calendar-table td {
  white-space: nowrap;
}

.om-tool-panel.is-read-only .om-stage-calendar-form {
  opacity: 0.72;
}

@media (max-width: 1100px) {
  .om-stage-calendar-form {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }
}
```

- [ ] **Step 2: Run diff check**

Run:

```bash
git diff --check -- 05-engineering-source/procurement-prototype/styles.css
```

Expected:
- No output.

- [ ] **Step 3: Commit this task**

Run:

```bash
git add 05-engineering-source/procurement-prototype/styles.css
git commit -m "style: add project stage calendar layout"
```

Expected:
- Commit contains only `styles.css`.

---

### Task 6: Update Role And Module Context Docs

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Update Requester role doc**

In `roles/01-requester.zh-TW.md`, replace the line that says `Line open date` is Requester input with:

```markdown
- `Line open date` 由 OM Leader 的全局 Project Stage Calendar 建立，scope = `Project Year + Project + Phase`；Requester 在 Request Workspace 輸入 phase qty 時，該 project phase 會帶著對應的 Line open date metadata，不另提供 Requester 日期輸入欄。`Purpose` 仍由 Requester input，不參與 phase date key。
```

In the data input/output section, replace `lineOpenDate` from the input list with:

```markdown
- 輸入：yearProject、projectCode、Non-G purpose、requestPurpose（SMT / FATP）、requestAction、item/spec、line、station/department、phase qty、item-level Required Delivery Date、temporary budget estimate、warehouse candidate。
- 讀取：phase input metadata 會從 OM Leader 全局 Project Stage Calendar 帶入 Line open date、Required Delivery Date follow Stage date、Given LT；若 item row 有多個 phase qty，系統逐 phase 帶入。
```

- [ ] **Step 2: Update OM Leader role doc**

In `roles/04-om-leader.zh-TW.md`, add these bullets under `可操作功能`:

```markdown
- 維護全局 Project Stage Calendar：輸入 Year Project、Project、Phase（P1.0 / P1.1 / EVT / DVT / PVT / MP）、Line open date。
- Project Stage Calendar 建立後，Requester、Dept DRI、OM team 共用同一份日期來源並自動帶入計算；Purpose（SMT / FATP）仍由 Requester input，不由 OM Leader 維護。
```

Add this bullet under `資料輸入 / 輸出`:

```markdown
- 輸入：assignment、exchange rate override、OM orchestration status、Project Stage Calendar（Year Project / Project / Phase / Line open date）。
```

- [ ] **Step 3: Update OM Purchasing role doc**

In `roles/05-om-purchasing.zh-TW.md`, replace any wording that says `Line open date` is Requester-owned with:

```markdown
- Date planning：Date of request、Required Delivery Date、OM Leader 全局 Project Stage Calendar 的 Line open date、Required Delivery Date follow Stage date、Given LT。
```

Under `不可看 / 不可做`, add:

```markdown
- 不維護 Project Stage Calendar；Phase date / Line open date 由 OM Leader 建立。
```

- [ ] **Step 4: Update module map**

In `modules/table-role-module-map.zh-TW.md`, replace the `RequesterPurposeDatePlanning` section with:

```markdown
### ProjectStageCalendarModule

封裝 OM Leader-owned phase date calendar：

- `Year Project`：Calendar key，由 OM Leader setup；Requester demand scope 會對應此 key。
- `Project`：Calendar key，由 OM Leader setup；Requester demand scope 會對應此 key。
- `Phase`：Calendar key，限定 `P1.0 / P1.1 / EVT / DVT / PVT / MP`。
- `Purpose`：Requester input，限定 `SMT / FATP`；不是 phase、station、department，也不是 Project Stage Calendar key。
- `Line open date`：OM Leader input，全局通用。
- Requester：只選 demand Purpose；Project phase input 讀取 global calendar-derived Line open date metadata，多 phase item 逐 phase 帶入。
- OM Purchasing：讀取 global calendar-derived Line open date / Required By Stage / Given LT，不可維護 calendar。
- `Required Delivery Date follow Stage date`：`Line open date - 14 days`。
- `Given LT`：`Required Delivery Date follow Stage date - Date of request`。

### RequesterItemRequiredDeliveryDate

封裝 Requester item-level required delivery date：

- `Required Delivery Date`：Requester 逐 item row input，不是 worksheet / line / MFG-Non-MFG scope 共用欄位。
- Submit：只送出目前 worksheet scope 內有 qty 的 rows；每個 selected row 必須有自己的 Required Delivery Date。
- Dept DRI：可在 review detail 更新該 item 的 Required Delivery Date。
- 系統：`Date of request` 仍為 item-level submit stamp；phase date / Given LT 計算使用 OM Leader Project Stage Calendar。
```

- [ ] **Step 5: Commit docs**

Run:

```bash
git add 05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md 05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md 05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
git commit -m "docs: assign phase dates to om leader"
```

Expected:
- Commit contains only context docs.

---

### Task 7: Full Verification

**Files:**
- Validate all files touched in Tasks 1-5.

- [ ] **Step 1: Run unit tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/unit.test.js
```

Expected:
- All tests pass.

- [ ] **Step 2: Run system contract tests**

Run:

```bash
cd 05-engineering-source/procurement-prototype
node --test tests/system-contract.test.js
```

Expected:
- All tests pass.

- [ ] **Step 3: Run diff whitespace check**

Run:

```bash
git diff --check -- \
  05-engineering-source/procurement-prototype/app-modules/project-stage-calendar.js \
  05-engineering-source/procurement-prototype/index.html \
  05-engineering-source/procurement-prototype/app.js \
  05-engineering-source/procurement-prototype/styles.css \
  05-engineering-source/procurement-prototype/tests/unit.test.js \
  05-engineering-source/procurement-prototype/tests/system-contract.test.js \
  05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
```

Expected:
- No output.

- [ ] **Step 4: Run full suite**

Run:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

Expected:
- `All available tests completed.`

- [ ] **Step 5: Inspect scoped status**

Run:

```bash
git status --short -- \
  05-engineering-source/procurement-prototype/app-modules/project-stage-calendar.js \
  05-engineering-source/procurement-prototype/index.html \
  05-engineering-source/procurement-prototype/app.js \
  05-engineering-source/procurement-prototype/styles.css \
  05-engineering-source/procurement-prototype/tests/unit.test.js \
  05-engineering-source/procurement-prototype/tests/system-contract.test.js \
  05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md \
  05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
```

Expected:
- Only intended files appear.

---

## Self-Review

Spec coverage:
- OM Leader inputs Year Project / Project / Phase date: covered by Tasks 2 and 3.
- Requester can see and auto-use configured dates: covered by Task 3 and docs in Task 6.
- Requester item-level Required Delivery Date: covered by Task 4 and docs in Task 6.
- OM team can see and auto-use configured dates: covered by Task 3 through shared normalization and OM detail/export surfaces.
- SMT/FATP remains Purpose, not Phase: covered by terminology table, tests, and docs.
- Existing OM PR/PO tracking remains OM Purchasing: preserved; this plan does not move those fields.

Placeholder scan:
- No forbidden placeholder patterns or vague test instructions remain.
- Every code-changing task includes concrete code snippets and commands.

Type consistency:
- Calendar field names are consistent across tasks: `yearProject`, `projectCode`, `phase`, `lineOpenDate`; requester purpose remains `purposeLocation` and is outside the calendar key.
- Function names are consistent: `projectStageCalendarModule`, `lineOpenDateForRequestScope`, `renderOmProjectStageCalendar`, `saveOmStageCalendarFromForm`.

Risk:
- The all-phase worksheet can contain multiple phase qty values. `datePlanByPhase` is authoritative for calculations; legacy row-level `phase`, `lineOpenDate`, `requiredDeliveryDateFollowStageDate`, and `givenLeadTimeDays` remain display fallbacks for existing surfaces.
