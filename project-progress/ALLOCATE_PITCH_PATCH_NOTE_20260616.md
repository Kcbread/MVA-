# Allocate Pitch QA Patch Note

Date: 2026-06-16
Audience: QA briefing
Status: Implementation in progress

## One-line Meaning

`Allocate` lets OM split an approved export row into target allocation lines before generating the export package, while preserving the original demand quantity as the audit baseline.

## Why This Matters

- QA can now check that export package quantity is controlled before Buyer Handoff.
- Original demand is not overwritten; allocation is tracked separately as ledger-style rows/events.
- Budget codes are generated per allocation line, so exported workbook detail can match the split.
- Buyer Handoff stays post-export PR/PO ownership; Buyer is not the allocation decision owner.

## What Changed

- OM Purchasing > `Export Package` table now shows an `Allocation` summary column.
- Each export row has an `Allocate` action.
- New `My Export Allocation` workspace:
  - `Source Pool` read-only evidence for the selected item/spec.
  - Allocation line editor for target project, phase, station/unit, and allocated qty.
  - Allocation ledger showing events, actor, time, qty, and budget code.
- Preparing `Expense / ECS` or `Capex / CFA` now validates allocation first.
- Export workbook detail rows expand by allocation line instead of one raw request row only.

## QA Focus

1. Open OM Purchasing > `Export Package`.
2. Pick a ready export row and click `Allocate`.
3. Confirm `Original Qty` stays fixed.
4. Add or edit split lines and confirm allocated total can equal original qty.
5. Try invalid cases:
   - missing target project
   - allocated qty `0`
   - total allocated qty not equal to original qty
   - total allocated qty greater than original qty
6. Prepare `Expense` or `Capex` only after allocation is complete.
7. Confirm budget codes appear per allocation line.
8. Confirm exported rows become read-only for allocation editing.

## WIP Boundaries

- Allocation state is frontend/localStorage in the current prototype, not server/API/DB persistence yet.
- `Source Pool` is evidence and trace context; it does not yet consume warehouse/carryover stock as a full backend source pool.
- Buyer-side read-only allocation summary is not built yet.
- This pitch is for QA understanding and test focus, not final release notes.

## Suggested 3-minute Talk Track

Today allocate is about export readiness. Before OM sends the package forward, QA should verify that the system can split one approved demand row into one or more target allocation lines, keep the original qty intact, and block export when allocation is incomplete. The important boundary is that Buyer Handoff starts after export; Buyer does not decide allocation in this version.

