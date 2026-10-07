# OM Leader Business Navigation IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Demand Progress Tracking`, `OM Progress Review`, and `Project Stage Calendar` peer-level business work entries for OM Leader, while keeping OM Purchasing operation screens separate.

**Architecture:** Preserve the current single-page prototype and role-driven navigation. Split OM Leader governance surfaces out of the `OM Purchasing` view into peer top-level `data-view` entries for the OM Leader role: `projectStatus`, `omLeaderProgress`, and `projectStageCalendar`. User-facing labels use business-process terms while API names can remain implementation-oriented. Keep API ownership unchanged: `/api/om/leader-console` and `/api/om/project-stage-calendar` continue to hydrate these surfaces; OM Purchasing remains the only editing owner for PR / PO / ETA tracking.

**Tech Stack:** Static HTML (`index.html`), browser app state/rendering (`app.js`), CSS (`styles.css`), Node test runner, Playwright role-flow smoke tests.

---

## Information Architecture Decision

For OM Leader, use three peer-level business work entries:

1. `Demand Progress Tracking`
   - Purpose: cross-role, read-only request progress and cost/quantity status.
   - Owner: shared read surface, visible to many roles.
   - OM Leader behavior: read-only, no PR/PO/ETA editing.

2. `OM Progress Review`
   - Purpose: OM supervisor monitoring and exception handling.
   - Owner: OM Leader.
   - Includes: summary, risk, exception queue, assignment visibility/control, PR/PO/ETA summaries from API.

3. `Project Stage Calendar`
   - Purpose: maintain and review `Year Project + Project + Phase` line-open date baseline.
   - Owner: OM Leader / Admin.
   - Includes two business functions:
     - `Line Open Date Maintenance`: OM Leader/Admin maintains the project stage calendar baseline.
     - `Stage Date Review`: OM Leader reviews current item/project stage dates and required-by-stage timing.

Avoid `Console` and `Setup` as user-facing labels. Those are system terms, not business process terms.

- `Demand Progress Tracking`: where the demand/request is in the full business flow.
- `OM Progress Review`: what needs OM Leader review, escalation, or assignment attention.
- `Project Stage Calendar`: the line-open date baseline that drives required delivery timing.

Do not keep `Project Stage Calendar` as a collapsed details block inside `OM Progress Review`. It is a governance master-data function, not an exception-monitoring detail.
Within `Project Stage Calendar`, separate the editing function from the review function. The same API-backed records support both uses, but users should not confuse "maintain baseline dates" with "review item stage date impact".

Do not move PAS Demand No, Quote Result, Quotation DB, OM Handoff, Budget / PR / PO / ETA / DTA inputs into OM Leader. Those remain under `OM Purchasing`.

---

## File Structure

- Modify: `05-engineering-source/procurement-prototype/index.html`
  - Rename the visible `Request Tracking` label to `Demand Progress Tracking`.
  - Add peer top-level tabs for `OM Progress Review` and `Project Stage Calendar`.
  - Create standalone `section[data-view="omLeaderProgress"]`.
  - Create standalone `section[data-view="projectStageCalendar"]`.
  - Inside `Project Stage Calendar`, create two visible peer panels: `Line Open Date Maintenance` and `Stage Date Review`.
  - Remove the OM Leader console and stage setup block from the OM Purchasing section, or keep only hidden migration-safe IDs while moving visible content.

- Modify: `05-engineering-source/procurement-prototype/app.js`
  - Update role profile/default view for `omLeader`.
  - Update view labels and visible nav rules.
  - Route OM Leader rendering to the new view sections.
  - Keep `hydrateOmLeaderConsoleRows()` and `saveProjectStageCalendarFromForm()` API behavior unchanged.

- Modify: `05-engineering-source/procurement-prototype/styles.css`
  - Add layout rules for the standalone OM Leader views.
  - Reuse existing work-panel/table-shell styles.
  - Avoid nested cards and oversized empty panels.

- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
  - Lock the peer-level navigation contract.
  - Lock OM Leader role config away from OM Purchasing operation tabs.

- Modify: `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`
  - Verify OM Leader sees `Demand Progress Tracking`, `OM Progress Review`, and `Project Stage Calendar` as peer tabs.
  - Verify `Project Stage Calendar` is not inside a collapsed details element.
  - Verify `Project Stage Calendar` contains both `Line Open Date Maintenance` and `Stage Date Review`.
  - Verify OM Leader still cannot edit PR/PO/ETA tracking controls.

- Modify: `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
  - Update UI/module section to state these are peer work entries.

- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
  - Update OMWorkflowTable / RoleGuardModule notes so the hierarchy is not reintroduced as a nested console disclosure.

---

### Task 1: Lock The Peer-Level Navigation Contract

**Files:**
- Modify: `05-engineering-source/procurement-prototype/tests/system-contract.test.js`
- Modify: `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`

- [ ] **Step 1: Add a system contract test for OM Leader peer views**

Add this test near the existing OM Leader contract tests in `tests/system-contract.test.js`:

```js
test("OM Leader uses peer-level business navigation entries", () => {
  assert.match(html, /data-view="projectStatus"[\s\S]*Demand Progress Tracking/);
  assert.match(html, /data-view="omLeaderProgress"[\s\S]*OM Progress Review/);
  assert.match(html, /data-view="projectStageCalendar"[\s\S]*Project Stage Calendar/);

  const topNav = between(html, '<nav class="tabs"', "</nav>");
  assert.match(topNav, /data-view="projectStatus"[\s\S]*Demand Progress Tracking/);
  assert.match(topNav, /data-view="omLeaderProgress"[\s\S]*OM Progress Review/);
  assert.match(topNav, /data-view="projectStageCalendar"[\s\S]*Project Stage Calendar/);

  const omView = between(html, '<section class="view" data-view="om">', '<section class="view" data-view="buyer">');
  assert.doesNotMatch(omView, /Project Stage Calendar/);
  assert.doesNotMatch(omView, /om-stage-calendar-utility/);
});
```

- [ ] **Step 2: Update the OM Leader role smoke expectations**

In `tests/role-flow-smoke.js`, replace the current OM Leader block that expects only one OM tab:

```js
const omLeaderTabs = await page.locator('section[data-view="om"] [data-om-tab]:visible').evaluateAll((tabs) => tabs.map((tab) => tab.innerText.trim()));
if (JSON.stringify(omLeaderTabs) !== JSON.stringify(["OM Leader Console"])) fail("OM Leader should only show console tab", { omLeaderTabs });
```

with this peer-navigation assertion:

```js
await switchRole(page, "omLeader", "projectStatus");
const leaderTopTabs = await page.locator(".tabs .tab:visible").evaluateAll((tabs) => tabs.map((tab) => tab.innerText.trim()));
for (const expected of ["Demand Progress Tracking", "OM Progress Review", "Project Stage Calendar"]) {
  if (!leaderTopTabs.includes(expected)) fail("OM Leader should expose peer-level work entries", { leaderTopTabs, expected });
}
if (leaderTopTabs.includes("OM Purchasing")) fail("OM Leader should not use OM Purchasing as the container for leader governance work", { leaderTopTabs });
```

- [ ] **Step 3: Add Project Stage Calendar standalone smoke**

Still in `tests/role-flow-smoke.js`, add:

```js
await page.locator('.tabs .tab[data-view="projectStageCalendar"]').click();
await expectText(page, "OM Leader Project Stage Calendar", [
  /Project Stage Calendar/,
  /Year Project/,
  /Project/,
  /Phase/,
  /Line Open Date/,
], 'section[data-view="projectStageCalendar"]');

const nestedStageCalendar = await page.locator('section[data-view="omLeaderProgress"] .om-stage-calendar-utility').count();
if (nestedStageCalendar) fail("Project Stage Calendar should not be nested inside OM Progress Review", { nestedStageCalendar });
```

- [ ] **Step 4: Run tests and verify they fail for the intended reason**

Run:

```bash
cd "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置/05-engineering-source/procurement-prototype"
node --test tests/system-contract.test.js --test-name-pattern "OM Leader uses peer-level business navigation"
node tests/role-flow-smoke.js
```

Expected:

```text
FAIL: omLeaderProgress / projectStageCalendar views or tabs are missing
```

Do not change production code before observing this failure.

---

### Task 2: Split OM Leader HTML Into Peer-Level Views

**Files:**
- Modify: `05-engineering-source/procurement-prototype/index.html`

- [ ] **Step 1: Add peer top-level tabs**

In the main `<nav class="tabs">`, keep the existing `projectStatus` view but change the visible label from `Request Tracking` to `Demand Progress Tracking`. Add two OM Leader-specific tabs after it:

```html
<button class="tab" data-view="projectStatus" data-roles="requester manager procurement om omLeader omMember dri projectDri sourcing buyer admin">Demand Progress Tracking</button>
<button class="tab" data-view="omLeaderProgress" data-roles="omLeader admin">OM Progress Review</button>
<button class="tab" data-view="projectStageCalendar" data-roles="omLeader admin">Project Stage Calendar</button>
```

Keep the existing OM Purchasing tab, but remove `omLeader` from its visible roles:

```html
<button class="tab" data-view="om" data-roles="om omMember admin">OM Purchasing</button>
```

- [ ] **Step 2: Create standalone OM Progress Review section**

Move the current visible console shell from `section[data-view="om"]` into a new sibling section before OM Purchasing:

```html
<section class="view" data-view="omLeaderProgress">
  <div class="section-head-tight">
    <h2>OM Progress Review</h2>
    <p class="muted">Supervisor view for OM exceptions, assignment, stage-date risk, procurement risk, and delivery risk.</p>
  </div>
  <div class="page-toolbar compact-toolbar">
    <div class="toolbar-label">OM Progress Review</div>
    <span class="record-count" id="omLeaderConsoleSyncedAt">API sync pending</span>
    <button class="mini" type="button" data-action="refreshOmLeaderConsole">Refresh</button>
  </div>
  <div id="omLeaderConsoleRoot"></div>
</section>
```

Use the existing `id="omLeaderConsoleRoot"` only once in the document.

- [ ] **Step 3: Create standalone Project Stage Calendar section**

Move the current stage date form/table into:

```html
<section class="view" data-view="projectStageCalendar">
  <div class="section-head-tight">
    <h2>Project Stage Calendar</h2>
    <p class="muted">Maintain phase line-open dates. These dates drive required-by-stage timing and lead-time risk.</p>
  </div>
  <section class="work-panel om-stage-calendar-utility" aria-label="Project Stage Calendar">
    <div class="page-toolbar compact-toolbar">
      <label>
        Year Project
        <select id="omStageCalendarProject"></select>
      </label>
      <label>
        Project
        <select id="omStageCalendarProjectCode"></select>
      </label>
      <label>
        Phase
        <select id="omStageCalendarPhase"></select>
      </label>
      <label>
        Line Open Date
        <input id="omStageCalendarLineOpenDate" type="date" />
      </label>
      <button class="primary" type="button" data-action="saveOmStageCalendar">Save Stage</button>
    </div>
    <div class="table-wrap table-shell">
      <table class="data-table table-fixed">
        <thead>
          <tr>
            <th>Year Project</th>
            <th>Project</th>
            <th>Phase</th>
            <th>Line Open Date</th>
            <th>Required Delivery Date</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody id="omStageCalendarRows"></tbody>
      </table>
    </div>
  </section>
</section>
```

Do not wrap this in `<details>`.

- [ ] **Step 4: Remove nested Project Stage Calendar from OM Purchasing**

Delete the old nested block:

```html
<details class="om-stage-calendar-utility om-stage-calendar-secondary" aria-label="Project Stage Calendar">
  ...
</details>
```

Keep OM Purchasing focused on PAS / Quote / Quotation DB / OM Handoff.

---

### Task 3: Update Role Navigation And Rendering

**Files:**
- Modify: `05-engineering-source/procurement-prototype/app.js`

- [ ] **Step 1: Update the OM Leader role profile**

Change the OM Leader role profile from:

```js
omLeader: { name: "OM Leader", dept: "Operations", functionName: "OM Leader Console / Stage Calendar", defaultView: "om" },
```

to:

```js
omLeader: { name: "OM Leader", dept: "Operations", functionName: "OM Progress Review / Project Stage Calendar", defaultView: "omLeaderProgress" },
```

- [ ] **Step 2: Add view labels**

In the view label map, add:

```js
omLeaderProgress: "OM Progress Review",
projectStageCalendar: "Project Stage Calendar",
```

- [ ] **Step 3: Update OM workspace config**

Keep OM Purchasing for `omMember`, not OM Leader. Replace the OM Leader config:

```js
omLeader: {
  omTabs: ["submission"],
  labels: {
    submission: "OM Leader Console",
  },
},
```

with:

```js
omLeader: {
  omTabs: [],
  labels: {},
},
```

This prevents OM Leader from being routed through OM Purchasing inner tabs.

- [ ] **Step 4: Render the new standalone views**

In the central render path, add calls like:

```js
function renderOmLeaderProgressView() {
  renderOmLeaderConsole();
}

function renderProjectStageCalendarView() {
  renderOmStageCalendarControls();
  renderOmStageCalendarRows();
}
```

Then call them when the active view is rendered:

```js
if (activeView === "omLeaderProgress") renderOmLeaderProgressView();
if (activeView === "projectStageCalendar") renderProjectStageCalendarView();
```

If the codebase uses `renderAll()` instead of active-view-only rendering, add both calls there, guarded by element existence:

```js
if (document.querySelector('section[data-view="omLeaderProgress"]')) renderOmLeaderProgressView();
if (document.querySelector('section[data-view="projectStageCalendar"]')) renderProjectStageCalendarView();
```

- [ ] **Step 5: Keep API hydration unchanged**

Do not change these API paths:

```js
apiRequest("/api/om/leader-console")
apiRequest("/api/om/project-stage-calendar")
apiRequest("/api/om/project-stage-calendar", { method: "PUT", body: record })
```

Only change where their rendered output appears.

---

### Task 4: Simplify Visual Hierarchy

**Files:**
- Modify: `05-engineering-source/procurement-prototype/styles.css`

- [ ] **Step 1: Add standalone leader view spacing**

Add:

```css
section[data-view="omLeaderProgress"],
section[data-view="projectStageCalendar"] {
  padding: 16px 18px 24px;
}

section[data-view="omLeaderProgress"] .section-head-tight,
section[data-view="projectStageCalendar"] .section-head-tight {
  margin-bottom: 12px;
}
```

- [ ] **Step 2: Make Project Stage Calendar a dense maintenance surface**

Add:

```css
section[data-view="projectStageCalendar"] .om-stage-calendar-utility {
  border-top: 4px solid var(--brand-blue, #0b75b7);
  padding: 12px;
}

section[data-view="projectStageCalendar"] .compact-toolbar {
  align-items: end;
  grid-template-columns: minmax(160px, 1fr) minmax(220px, 1.4fr) minmax(140px, 0.8fr) minmax(180px, 1fr) auto;
}
```

- [ ] **Step 3: Remove secondary disclosure visual rules**

Delete or neutralize rules that make stage setup appear secondary inside console:

```css
.om-stage-calendar-secondary {
  ...
}
```

If other code still references the class during transition, leave:

```css
.om-stage-calendar-secondary {
  display: block;
}
```

---

### Task 5: Update Role And Module Context

**Files:**
- Modify: `05-engineering-source/procurement-prototype/_context/roles/04-om-leader.zh-TW.md`
- Modify: `05-engineering-source/procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Update OM Leader UI/module wording**

Replace:

```md
- Project Stage Calendar：結果以 `Project Stage Date Signal` 進入 Console summary；輸入維護是 toolbar secondary action 開啟的折疊式 setup，不佔第一屏主視覺。
```

with:

```md
- OM Leader 使用三個同級工作入口：`Demand Progress Tracking`、`OM Progress Review`、`Project Stage Calendar`。
- `Project Stage Calendar` 是 line-open baseline 的維護入口，不再藏在 `OM Progress Review` 的折疊區塊。
- `OM Progress Review` 只負責主管監控、例外、派工與 summary；不承載 PR / PO / ETA 可編輯 controls。
```

- [ ] **Step 2: Update table/module map wording**

Replace the OMWorkflowTable sentence:

```md
Project Stage Calendar 的輸入維護是 secondary setup action，不與日常 exception monitoring 混在第一層。
```

with:

```md
OM Leader navigation 將 `Demand Progress Tracking`、`OM Progress Review`、`Project Stage Calendar` 視為同級工作入口；`Project Stage Calendar` 不再作為 OM review 內的 secondary disclosure。
```

---

### Task 6: Verify End To End

**Files:**
- Test only; no source changes unless a test exposes an implementation bug.

- [ ] **Step 1: Run targeted contract tests**

Run:

```bash
cd "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置/05-engineering-source/procurement-prototype"
node --test tests/system-contract.test.js --test-name-pattern "OM Leader uses peer-level business navigation"
```

Expected:

```text
pass 1
fail 0
```

- [ ] **Step 2: Run role flow smoke**

Run:

```bash
node tests/role-flow-smoke.js
```

Expected:

```text
Role flow smoke passed.
```

- [ ] **Step 3: Verify API login and leader routes still work**

Run:

```bash
curl --noproxy "*" -sS http://127.0.0.1:8080/api/health
curl --noproxy "*" -sS -X POST http://127.0.0.1:8080/api/login \
  -H "Content-Type: application/json" \
  --data '{"identifier":"maint5","password":"123"}'
```

Expected:

```json
{"ok":true,"db":"memory-fallback"}
```

and a login response whose `user.role` is:

```json
"omLeader"
```

- [ ] **Step 4: Run browser smoke for OM Leader navigation**

Run:

```bash
node - <<'NODE'
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8080/05-engineering-source/procurement-prototype/");
  await page.selectOption("#roleSelect", "omLeader");
  await page.locator("#loginForm button[type='submit']").click();
  await page.waitForSelector("[data-screen='workspace'].active");
  const tabs = await page.locator(".tabs .tab:visible").evaluateAll((nodes) => nodes.map((node) => node.textContent.trim()));
  for (const label of ["Demand Progress Tracking", "OM Progress Review", "Project Stage Calendar"]) {
    if (!tabs.includes(label)) throw new Error(`Missing ${label}: ${JSON.stringify(tabs)}`);
  }
  await page.locator('.tabs .tab[data-view="projectStageCalendar"]').click();
  await page.waitForSelector('section[data-view="projectStageCalendar"].active');
  const setupText = await page.locator('section[data-view="projectStageCalendar"]').textContent();
  if (!/Line Open Date/.test(setupText)) throw new Error("Project Stage Calendar did not render line-open date fields");
  await browser.close();
})();
NODE
```

Expected: command exits with status `0`.

- [ ] **Step 5: Run standard suite and report existing unrelated failures separately**

Run:

```bash
./test.sh
```

Expected for this workstream:

```text
Syntax checks pass
Unit and system contract tests pass
Role flow smoke passes
```

If `layout-smoke.js` still fails on `OM Quote Result row height`, report it as an existing unrelated layout risk unless this plan touched OM Quote Result row rendering.

---

## Self-Review

Spec coverage:

- `Demand Progress Tracking`, `OM Progress Review`, and `Project Stage Calendar` become same-level work entries for OM Leader: covered by Tasks 1-4.
- OM Purchasing remains the operation owner for PR / PO / ETA inputs: covered by Tasks 2-3 and context updates.
- Stage setup becomes standalone and business-governance-oriented: covered by Tasks 2, 4, and 5.
- API real connection remains unchanged: covered by Task 3 and Task 6.

Placeholder scan:

- No `TBD`, `TODO`, or "implement later" placeholders remain.

Type/name consistency:

- New views use `data-view="omLeaderProgress"` and `data-view="projectStageCalendar"` consistently across HTML, tests, and render plan.
- Existing IDs `omLeaderConsoleRoot`, `omLeaderConsoleSyncedAt`, `omStageCalendarProject`, `omStageCalendarProjectCode`, `omStageCalendarPhase`, `omStageCalendarLineOpenDate`, and `omStageCalendarRows` are preserved.
