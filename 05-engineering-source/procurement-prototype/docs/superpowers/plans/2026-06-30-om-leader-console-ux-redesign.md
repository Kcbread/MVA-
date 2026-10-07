# OM Leader Console UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert OM Leader Console from an operations-style wide table into a leader dashboard with exception queue, progress overview, team workload, and drilldown.

**Architecture:** Reuse existing OM source data and API hydration. Keep OM Purchasing row-level operations unchanged; OM Leader gets derived dashboard renderers inside the existing `submission` panel. Project Stage Calendar becomes a collapsible setup panel.

**Tech Stack:** Vanilla JS (`app.js`), static HTML (`index.html`), CSS (`styles.css`), Node test runner, Playwright smoke tests.

---

### Task 1: Lock The UX Contract

**Files:**
- Modify: `tests/system-contract.test.js`
- Modify: `tests/role-flow-smoke.js`

- [ ] **Step 1: Write failing system contract assertions**

Add assertions that OM Leader Console exposes one consolidated status summary with `Stage Signal`, `Workload Signal`, `Action Required Queue`, `Project Stage Calendar Setup`, and does not expose the old row-table-first wording as the primary leadership table.

- [ ] **Step 2: Write failing role-flow assertions**

In the OM Leader role block, assert the visible screen contains dashboard sections and that `Project Stage Calendar` is collapsed by default but can be expanded.

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```bash
node --test tests/system-contract.test.js
node tests/role-flow-smoke.js
```

Expected: fail because the new dashboard sections and collapse behavior are not implemented.

### Task 2: Implement Leader Dashboard Renderers

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add derived dashboard helpers**

Add helper functions for OM Leader summary metrics, exception rows, stage overview rows, and assignee workload rows derived from `omSubmissionRows()`.

- [ ] **Step 2: Render leader-first sections**

Update `renderOmSubmission()` so OM Leader/admin submission panel renders:

- `OM Leader Snapshot`
- compact `Stage Signal`
- compact `Workload Signal`
- `Action Required Queue`
- compact `Detail` buttons

Keep OM Purchasing operations out of this screen.

- [ ] **Step 3: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/system-contract.test.js
node tests/role-flow-smoke.js
```

Expected: pass.

### Task 3: Polish Layout And Stage Calendar Setup

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Make stage calendar a setup disclosure**

Wrap the Project Stage Calendar controls/table in a `details`/`summary` style setup panel so it is available but not visually dominant.

- [ ] **Step 2: Add responsive dashboard styling**

Add compact dashboard grid, exception queue, progress overview, and workload styles. Ensure dense tables scroll inside their wrappers and do not cause page-level overflow.

- [ ] **Step 3: Run layout smoke**

Run:

```bash
node tests/layout-smoke.js
```

Expected: pass.

### Task 4: Update Docs And Full Verification

**Files:**
- Modify: `_context/roles/04-om-leader.zh-TW.md`
- Modify: `_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Document the leader-first console pattern**

Record that OM Leader Console is dashboard + exception queue + drilldown; row-level PR/PO/ETA editing stays with OM Purchasing.

- [ ] **Step 2: Run full verification**

Run:

```bash
./test.sh
```

Expected: all available tests pass.

---

## Self-Review

- Spec coverage: dashboard, exception queue, progress overview, team workload, stage calendar setup, role boundary, and verification are covered.
- Placeholder scan: no TODO/TBD placeholders remain.
- Type consistency: all names use existing OM terminology and DOM ids/classes.
