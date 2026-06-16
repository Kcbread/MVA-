# OM Export Allocation Handoff

Updated: 2026-06-16

## Startup Context Receipt

Read:
- `README.md`
- `procurement-prototype/_context/README.zh-TW.md`
- `procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md`
- `procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md`
- `procurement-prototype/_context/flows/pm-master-flow.zh-TW.md`
- `procurement-prototype/_context/modules/table-role-module-map.zh-TW.md`
- `procurement-prototype/PROJECT_DECISIONS.md`
- `project-progress/MASTER_PM_LEDGER.md`

Roles:
- `OM Purchasing`
- `Buyer Handoff`

Flows/Modules:
- `pm-master-flow`
- `table-role-module-map`

Worktree:
- Branch: `codex/new-thread-startup-format`
- Existing unrelated changes remain in `AGENTS.md` and `project-progress/self-distillation/`
- Allocation implementation changes are currently unstaged in:
  - `procurement-prototype/app-modules/export-allocation.js`
  - `procurement-prototype/index.html`
  - `procurement-prototype/app.js`
  - `procurement-prototype/styles.css`
  - `procurement-prototype/test.sh`
  - `procurement-prototype/tests/unit.test.js`
  - `procurement-prototype/tests/export-allocation-contract.test.js`

Decisions:
- Allocation is implemented in `OM Purchasing > My Exports`.
- Original demand is preserved; allocation is tracked via ledger-style events.
- Budget code is generated per allocation line, not only per package.
- `Buyer Handoff` remains post-export ownership state, not allocation decision owner.

Gaps:
- No Buyer-side allocation summary UI yet.
- No global source-pool UI yet for warehouse/carryover in OM scope.

## Findings

- `My Exports` now includes an `Allocation` summary column and an `Allocate` action per row.
- A new `My Export Allocation` workspace was added under the export table.
- Allocation data is stored in frontend local storage via `procurementExportAllocationLedger.v1`.
- Allocation lines support:
  - target project
  - target phase
  - target station/unit
  - allocated qty
  - budget code
  - status
- Allocation events support:
  - created
  - split
  - retargeted
  - released
  - budget code generated
  - exported
- Preparing `Expense` / `Capex` now validates that allocation total equals original qty before generating package output.
- Exported workbook detail rows now expand by allocation line instead of exporting one raw request row only.

## Decision

- Keep the current architecture:
  - `My Exports` = allocation decision surface
  - `Warehouse / Carryover` = evidence / source-trace model
  - `Buyer Handoff` = post-export execution ownership
- Current implementation is intentionally **single-source-row split allocation**:
  - pool = the selected export row's original qty
  - OM can split that qty into multiple allocation lines
  - all line qty must sum back to original qty
- Next likely design step:
  - add an OM-scoped `Supply Pool` / `Source Pool` panel that surfaces warehouse and carryover sources for the selected item/spec
  - do not turn Buyer into the allocation owner

## Risk

- Current allocation "pool" is not yet a true warehouse/carryover-backed source pool; it is only the selected export row qty.
- `export-allocation.js` is frontend-only state for now; no server/API/db persistence exists yet.
- `My Exports` detail workbook now exports allocation lines, but Buyer UI still does not show per-allocation readonly detail.
- New thread should avoid mixing this feature work with unrelated `AGENTS.md` / self-distillation changes.

## Next

1. Add OM `Supply Pool` panel for the selected export row.
2. Source pool should read from:
   - current export row
   - same item/spec warehouse records
   - same item/spec carryover evidence
3. Show source type and trace in OM scope:
   - `Export Row`
   - `Warehouse Stock`
   - `Carryover`
4. Keep warehouse/carryover as trace/evidence sources, not replace allocation ledger.
5. Add Buyer readonly allocation summary after export if needed.

## Evidence

Code:
- `procurement-prototype/app-modules/export-allocation.js`
- `procurement-prototype/index.html`
- `procurement-prototype/app.js`
- `procurement-prototype/styles.css`
- `procurement-prototype/test.sh`
- `procurement-prototype/tests/unit.test.js`
- `procurement-prototype/tests/export-allocation-contract.test.js`

Key implementation anchors:
- Allocation workspace markup: `procurement-prototype/index.html`
- Export summary + allocate action: `procurement-prototype/app.js`
- Allocation helpers and storage key: `procurement-prototype/app-modules/export-allocation.js`

Validation:
- `./test.sh`
- Passed on 2026-06-16 in this thread, including:
  - syntax checks
  - unit/system contract tests
  - browser smoke
  - layout smoke
  - price routing smoke
  - global UI audit
  - role flow smoke
  - accessibility smoke

## New Thread Prompt Seed

Use this when starting the next thread:

```text
Continue OM export allocation work from project-progress/OM_EXPORT_ALLOCATION_HANDOFF_20260616.md.

Read:
- README.md
- procurement-prototype/_context/README.zh-TW.md
- procurement-prototype/_context/roles/05-om-purchasing.zh-TW.md
- procurement-prototype/_context/roles/08-buyer-handoff.zh-TW.md
- procurement-prototype/_context/flows/pm-master-flow.zh-TW.md
- procurement-prototype/_context/modules/table-role-module-map.zh-TW.md
- project-progress/MASTER_PM_LEDGER.md
- project-progress/OM_EXPORT_ALLOCATION_HANDOFF_20260616.md

Focus:
- add OM-scoped supply pool / source pool
- treat warehouse/carryover as allocation source evidence
- keep Buyer Handoff post-export only
```
