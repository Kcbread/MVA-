# OM Leader Stage Date Signal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep OM Leader Project Stage Calendar input intact and surface project stage date context inside the consolidated OM Leader status summary.

**Architecture:** Reuse existing `projectStageCalendarLineOpenDate()` and `requiredDeliveryDateFollowStageDate()` helpers. Add a compact `Project Stage Date Signal` group inside `renderOmLeaderStatusSummary()` so stage dates are visible without expanding setup. Keep the editable `Project Stage Calendar Setup` disclosure unchanged.

**Tech Stack:** Vanilla JS (`app.js`), static HTML (`index.html`), CSS (`styles.css`), Node test runner, Playwright smoke tests.

---

### Task 1: Lock Stage Date Signal Contract

**Files:**
- Modify: `tests/system-contract.test.js`
- Modify: `tests/role-flow-smoke.js`

- [ ] **Step 1: Write failing system contract assertions**

Add assertions in the OM Leader contract test:

```js
assert.match(app, /function omLeaderProjectStageDateRows/);
assert.match(app, /Project Stage Date Signal/);
assert.match(app, /Line Open/);
assert.match(app, /Required By Stage/);
assert.match(omView, /Project Stage Calendar Setup/);
assert.match(omView, /id="omStageCalendarLineOpenDate"/);
assert.match(omView, /data-action="saveOmStageCalendar"/);
```

- [ ] **Step 2: Write failing role-flow assertions**

In the OM Leader role smoke block, require:

```js
/Project Stage Date Signal/,
/Line Open/,
/Required By Stage/,
```

Keep the existing assertion that `.om-stage-calendar-utility` is a collapsed `DETAILS` element and expands on click.

- [ ] **Step 3: Run tests to verify RED**

Run:

```bash
node --test tests/system-contract.test.js && node tests/role-flow-smoke.js
```

Expected: fail before implementation because `omLeaderProjectStageDateRows` and `Project Stage Date Signal` do not exist.

### Task 2: Render Stage Date Signal In Status Summary

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Add stage date helper**

Add a helper near the OM Leader status helpers:

```js
function omLeaderProjectStageDateRows(rows = []) {
  const byKey = new Map();
  rows.forEach((group) => {
    const project = group.project || "";
    const projectCode = group.projectCode || "";
    const phase = group.phase || "";
    const key = `${project}::${projectCode}::${phase}`;
    if (!project || !phase || byKey.has(key)) return;
    const lineOpenDate = projectStageCalendarLineOpenDate({ project, projectCode, phase });
    byKey.set(key, {
      label: `${project}${projectCode ? ` / ${projectCode}` : ""} / ${phase}`,
      lineOpenDate: lineOpenDate || "-",
      requiredByStage: lineOpenDate ? requiredDeliveryDateFollowStageDate(lineOpenDate) || "-" : "-",
    });
  });
  return [...byKey.values()].slice(0, 4);
}
```

- [ ] **Step 2: Add Project Stage Date Signal group**

Inside `renderOmLeaderStatusSummary(rows)`, add:

```js
const stageDateRows = omLeaderProjectStageDateRows(rows);
```

Then render a third compact signal group:

```html
<section class="om-leader-signal-group om-leader-stage-date-signal">
  <strong>Project Stage Date Signal</strong>
  <div class="om-leader-signal-list">
    ...
  </div>
</section>
```

Each chip must show project/phase label plus `Line Open ...` and `Required By Stage ...`.

- [ ] **Step 3: Adjust CSS grid**

Change `.om-leader-signal-strip` from two columns to three responsive columns:

```css
.om-leader-signal-strip {
  grid-template-columns: 1.2fr 1.7fr 1fr;
}
```

Keep the mobile breakpoint at one column.

- [ ] **Step 4: Run focused tests**

Run:

```bash
node --test tests/system-contract.test.js && node tests/role-flow-smoke.js
node tests/layout-smoke.js
```

Expected: pass.

### Task 3: Update Role Docs And Verify

**Files:**
- Modify: `_context/roles/04-om-leader.zh-TW.md`
- Modify: `_context/modules/table-role-module-map.zh-TW.md`

- [ ] **Step 1: Document the behavior**

Update OM Leader docs so the console is described as:

```text
single status summary with Project Stage Date Signal, Stage Signal, Workload Signal, Action Required Queue
```

Also state that the editable `Project Stage Calendar Setup` remains collapsed but available to OM Leader.

- [ ] **Step 2: Run full verification**

Run:

```bash
./test.sh
```

Expected: all available tests pass.

---

## Self-Review

- Spec coverage: confirms input remains, adds stage date visibility, preserves one-layer status summary, updates tests and docs.
- Placeholder scan: no TODO/TBD placeholders.
- Type consistency: helper names and signal labels match test assertions.
