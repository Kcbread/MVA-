# Interactive Static UAT Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separately distributable, frontend-only UAT package in which business users manually operate three procurement scenarios across all participating roles.

**Architecture:** Create a sibling package named `05-engineering-source/fih-procurement-flow-ui-uat` using classic local JavaScript files so `index.html` can run without a business backend. A pure workflow engine owns transitions, a namespaced store owns browser-local persistence, and renderers project the same state into role-specific queues and Excel-like tables.

**Tech Stack:** HTML5, CSS, browser JavaScript, `localStorage`, Node.js built-in test runner, in-app browser QA, PowerShell packaging.

## Global Constraints

- Preserve existing Excel-like table structure, columns, calculations, density, and data meaning.
- Left navigation is role/workspace-level; top controls are contextual.
- Do not duplicate functions after moving them into role navigation.
- Use fictitious data marked `DEMO / UAT`.
- Do not call `/api/*`, use a database, include credentials, or modify production state.
- Buyer Handoff is read-only; Admin is governance-only.
- Use no Git commands, branches, worktrees, commits, pushes, or pull requests.
- Show and approve the Demo Control visual preview before implementation.
- Create only the separate UAT package and its delivery artifacts; do not copy the complete engineering workspace.

## File Structure

- Create `../fih-procurement-flow-ui-uat/index.html` — static entry and semantic shell.
- Create `../fih-procurement-flow-ui-uat/assets/styles.css` — dense responsive shell and Excel-like tables.
- Create `../fih-procurement-flow-ui-uat/src/scenarios.js` — immutable three-scenario seed factory and role catalog.
- Create `../fih-procurement-flow-ui-uat/src/workflow.js` — pure transition rules and guard validation.
- Create `../fih-procurement-flow-ui-uat/src/store.js` — namespaced `localStorage` load/save/reset/recovery.
- Create `../fih-procurement-flow-ui-uat/src/renderers.js` — role navigation, overview, queue, detail, and timeline HTML.
- Create `../fih-procurement-flow-ui-uat/src/app.js` — DOM events and orchestration only.
- Create `../fih-procurement-flow-ui-uat/tests/scenarios.test.js` — seed and sensitive-field contracts.
- Create `../fih-procurement-flow-ui-uat/tests/workflow.test.js` — allowed/blocked transition coverage.
- Create `../fih-procurement-flow-ui-uat/tests/store.test.js` — persistence, corruption recovery, and reset isolation.
- Create `../fih-procurement-flow-ui-uat/tests/ui-contract.test.js` — static DOM, no-API, and navigation contracts.
- Create `../fih-procurement-flow-ui-uat/OPEN-DEMO.cmd` — open the local static entry.
- Create `../fih-procurement-flow-ui-uat/README-UAT.zh-TW.md` — tester instructions and limitations.
- Create `../fih-procurement-flow-ui-uat/UAT-CHECKLIST.zh-TW.md` — role-by-role acceptance checklist.
- Create `../fih-procurement-flow-ui-uat/manifest.sha256` — package integrity manifest.

---

### Task 1: Visual Preview Gate and Static Shell

**Files:**
- Create: `../fih-procurement-flow-ui-uat/index.html`
- Create: `../fih-procurement-flow-ui-uat/assets/styles.css`
- Create: `../fih-procurement-flow-ui-uat/tests/ui-contract.test.js`

**Interfaces:**
- Consumes: approved semantic-navigation shell from the active prototype.
- Produces: DOM anchors `demoRoleSelect`, `demoScenarioSelect`, `demoResetButton`, `workflowSidebar`, `scenarioOverview`, `roleQueue`, `scenarioDetail`, and `scenarioTimeline`.

- [ ] **Step 1: Generate and present the preview**

Create one desktop preview showing the compact Demo Control strip, left role workflow, three-scenario overview, Excel-like queue, selected-row detail, and timeline. Wait for explicit visual approval before Step 2.

- [ ] **Step 2: Write the failing shell contract**

```js
test("static UAT shell exposes demo controls without API assets", () => {
  for (const id of ["demoRoleSelect", "demoScenarioSelect", "demoResetButton", "workflowSidebar", "roleQueue", "scenarioTimeline"]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(html, /\/api\//);
});
```

- [ ] **Step 3: Run the contract and confirm RED**

Run: `node --test tests/ui-contract.test.js`

Expected: FAIL because the independent package and DOM anchors do not exist.

- [ ] **Step 4: Create the minimal semantic shell**

Load local classic scripts only, render a two-column desktop shell, and add an `@media (max-width: 900px)` horizontal workflow strip. Keep all tables in `.table-shell` containers with horizontal overflow.

- [ ] **Step 5: Run the shell contract and confirm GREEN**

Run: `node --test tests/ui-contract.test.js`

Expected: PASS with no `/api/` string or remote script source.

### Task 2: Scenario Seeds and Role Visibility

**Files:**
- Create: `../fih-procurement-flow-ui-uat/src/scenarios.js`
- Create: `../fih-procurement-flow-ui-uat/tests/scenarios.test.js`

**Interfaces:**
- Produces: `createSeedState(): UatState`, `ROLE_CATALOG`, `SCENARIO_IDS`, and `visibleFieldsForRole(role)`.
- `UatState`: `{ version, activeRole, activeScenarioId, scenarios, notices }`.
- `Scenario`: `{ id, label, kind, stage, pendingOwner, returnStage, assignedOm, fields, blockers, timeline }`.

- [ ] **Step 1: Write failing seed tests**

```js
test("seed factory returns three independent DEMO scenarios", () => {
  const state = createSeedState();
  assert.deepEqual(state.scenarios.map(row => row.kind), ["golden", "reject-resubmit", "temporary-budget"]);
  assert.ok(state.scenarios.every(row => row.fields.dataLabel === "DEMO / UAT"));
});

test("requester visibility excludes OM-sensitive fields", () => {
  const fields = visibleFieldsForRole("requester");
  for (const name of ["vendorName", "vendorNumber", "pasMaterialNo", "assignedOm"]) assert.equal(fields.includes(name), false);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/scenarios.test.js`

- [ ] **Step 3: Implement immutable seed creation**

Use fresh objects on every `createSeedState()` call. Seed the golden row at `REQUESTER_DRAFT`, the rejection row at `DEPT_DRI_REVIEW`, and the exception row at `BUDGET_EXCEPTION_REVIEW` with fictitious P26/OR5/P27 items.

- [ ] **Step 4: Run and confirm GREEN**

Run: `node --test tests/scenarios.test.js`

### Task 3: Pure Workflow Engine

**Files:**
- Create: `../fih-procurement-flow-ui-uat/src/workflow.js`
- Create: `../fih-procurement-flow-ui-uat/tests/workflow.test.js`

**Interfaces:**
- Consumes: `Scenario` and role identifiers from `scenarios.js`.
- Produces: `allowedActions(scenario, role): ActionDescriptor[]`, `transitionScenario(state, scenarioId, action, payload, actorRole, now): UatState`, and `WorkflowError`.

- [ ] **Step 1: Write the transition table tests**

Cover this exact route:

```text
REQUESTER_DRAFT -> DEPT_DRI_REVIEW -> COST_MANAGER_REVIEW
COST_MANAGER_REVIEW -> OM_LEADER_ASSIGNMENT
COST_MANAGER_REVIEW -> BUDGET_EXCEPTION_REVIEW
OM_LEADER_ASSIGNMENT -> OM_PURCHASING_INTAKE -> QUOTE_VALIDATION
QUOTE_VALIDATION -> OM_HANDOFF -> BUYER_HANDOFF
*_REVIEW -> REQUESTER_ACTION_REQUIRED -> prior review stage
```

Assert that rejection requires `payload.reason`, assignment requires `payload.assignedOm`, PAS-required rows cannot enter quote validation without `pasDemandNo`, and unresolved exceptions cannot enter OM assignment.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/workflow.test.js`

- [ ] **Step 3: Implement one allowlisted transition map**

Every transition must validate current stage, actor role, required payload, and blockers before returning a cloned state. Append a timeline entry `{ id, at, actorRole, action, reason, fromStage, toStage }` and update `pendingOwner` and `nextAction` together.

- [ ] **Step 4: Run and confirm GREEN**

Run: `node --test tests/workflow.test.js`

### Task 4: Browser-local Store

**Files:**
- Create: `../fih-procurement-flow-ui-uat/src/store.js`
- Create: `../fih-procurement-flow-ui-uat/tests/store.test.js`

**Interfaces:**
- Consumes: `createSeedState()`.
- Produces: `STORAGE_KEY = "fih.procurement.flow-ui-uat.v1"`, `loadState(storage)`, `saveState(storage, state)`, and `resetState(storage)`.

- [ ] **Step 1: Write failing persistence tests**

```js
test("reset deletes only the UAT namespace", () => {
  const storage = fakeStorage({ unrelated: "keep" });
  resetState(storage);
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(loadState(storage).version, 1);
});
```

Also test round-trip persistence and corrupt JSON recovery with a visible recovery notice.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/store.test.js`

- [ ] **Step 3: Implement namespaced persistence**

Reject stored state with an unsupported version or missing scenario array. Recover using `createSeedState()` and add `notices: [{ type: "warning", message: "Demo data was reset because saved state could not be read." }]`.

- [ ] **Step 4: Run and confirm GREEN**

Run: `node --test tests/store.test.js`

### Task 5: Role-specific Rendering and Manual Actions

**Files:**
- Create: `../fih-procurement-flow-ui-uat/src/renderers.js`
- Create: `../fih-procurement-flow-ui-uat/src/app.js`
- Modify: `../fih-procurement-flow-ui-uat/index.html`
- Modify: `../fih-procurement-flow-ui-uat/assets/styles.css`
- Modify: `../fih-procurement-flow-ui-uat/tests/ui-contract.test.js`

**Interfaces:**
- Consumes: `loadState`, `saveState`, `resetState`, `allowedActions`, `transitionScenario`, and role visibility definitions.
- Produces: `renderApp(state)`, `renderRoleQueue(state, role)`, `renderScenarioDetail(scenario, role)`, and DOM event handling through `data-action` attributes.

- [ ] **Step 1: Add failing UI contracts**

Assert that buttons use `data-action`, role switching uses `data-demo-role`, scenario rows use `data-scenario-id`, reset has a confirmation dialog path, and renderers do not embed vendor/PAS material fields in requester templates.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/ui-contract.test.js`

- [ ] **Step 3: Implement the compact Demo Control and role queues**

Render Scenario, Role, Current Stage, Pending Owner, Next Action, and Reset above the workspace. Render role-specific left navigation and one Excel-like queue. Keep action forms inline in the detail panel so users can enter rejection reasons, assignment, PAS, quote, and handoff values.

- [ ] **Step 4: Wire state-changing actions**

On action submit, call `transitionScenario`, persist the result, rerender the complete app, and show the new stage plus appended timeline event inline. Disabled actions must show the blocker using `aria-describedby`.

- [ ] **Step 5: Run and confirm GREEN**

Run: `node --test tests/ui-contract.test.js tests/scenarios.test.js tests/workflow.test.js tests/store.test.js`

### Task 6: Full Browser Walkthrough and Defect Repair

**Files:**
- Modify only files whose defects are reproduced by the walkthrough.
- Create: `../fih-procurement-flow-ui-uat/design-qa.md`

**Interfaces:**
- Consumes: the complete static package.
- Produces: screenshots, browser evidence, defect log, and `passed` or `blocked` QA result.

- [ ] **Step 1: Open the package in the in-app browser**

Verify there are no `/api/*` requests and no console errors or warnings.

- [ ] **Step 2: Walk Scenario 1 manually**

Operate Requester submit, Dept DRI approve, Cost Manager approve, OM Leader assign, OM Purchasing PAS/quote validate and handoff, then Buyer read-only receipt. Verify queue movement and timeline at each step.

- [ ] **Step 3: Walk Scenario 2 manually**

Reject with a required reason, verify Requester Action Required, edit/resubmit, and verify return to the recorded review stage.

- [ ] **Step 4: Walk Scenario 3 manually**

Verify the exception cannot bypass Budget Approver. Test both approval route and reset/rejection route.

- [ ] **Step 5: Test persistence, reset, responsive layout, and keyboard use**

Reload mid-flow, verify retained state, reset only the UAT namespace, test 1440 x 1024 and 820 x 900, and tab through all primary controls.

- [ ] **Step 6: Repair each reproduced defect using a new failing test**

For every defect, record reproduction, add a focused failing test, implement one fix, rerun the focused test, and repeat the affected browser step.

- [ ] **Step 7: Write `design-qa.md`**

Record reference, viewport, states tested, screenshots, console/network evidence, defects fixed, remaining risks, and final result.

### Task 7: Independent Delivery Package

**Files:**
- Create: `../fih-procurement-flow-ui-uat/OPEN-DEMO.cmd`
- Create: `../fih-procurement-flow-ui-uat/README-UAT.zh-TW.md`
- Create: `../fih-procurement-flow-ui-uat/UAT-CHECKLIST.zh-TW.md`
- Create: `../fih-procurement-flow-ui-uat/manifest.sha256`
- Create: `../fih-procurement-flow-ui-uat/fih-procurement-flow-ui-uat-20260813.zip`

**Interfaces:**
- Consumes: verified source package and QA receipt.
- Produces: one downloadable ZIP and a Google Drive file after final local approval.

- [ ] **Step 1: Write user instructions and checklist**

Document extraction, `OPEN-DEMO.cmd`, the three scenarios, role-by-role actions, Reset, browser support, known limitations, and feedback fields for Flow/UI findings.

- [ ] **Step 2: Create the launcher**

```bat
@echo off
start "" "%~dp0index.html"
```

- [ ] **Step 3: Run all tests and syntax checks**

Run: `node --test tests/*.test.js`

Run `node --check` for every file under `src/`.

Expected: zero failures.

- [ ] **Step 4: Generate and verify the integrity manifest**

Hash every delivery file except the ZIP and manifest using SHA-256, write relative paths to `manifest.sha256`, then read back and validate every hash.

- [ ] **Step 5: Create and extract-test the ZIP**

Create `fih-procurement-flow-ui-uat-20260813.zip`, extract it to a temporary directory, run the tests from extracted bytes, open the extracted entry, and confirm no unrelated workspace file is included.

- [ ] **Step 6: Obtain final user approval and upload to Google Drive**

After presenting the verified local package and screenshots, use the connected Google Drive capability to upload only the ZIP and return the share link. Do not upload the full workspace.

## Plan Self-review

- Spec coverage: all objective, role, scenario, persistence, guardrail, UI, validation, distribution, and acceptance requirements map to Tasks 1–7.
- Placeholder scan: no TBD, TODO, generic error-handling placeholder, or unspecified test step remains.
- Interface consistency: `UatState`, `Scenario`, `createSeedState`, `transitionScenario`, store functions, render functions, DOM IDs, and storage key remain consistent across tasks.
- Scope: the plan creates one separated frontend-only UAT deliverable and excludes backend implementation.
- Git exception: commit steps are intentionally omitted because the user-locked project rule prohibits all Git use.
