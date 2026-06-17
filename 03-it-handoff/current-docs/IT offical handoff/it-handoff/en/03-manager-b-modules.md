# 03 Cost Manager Modules

This file keeps the historical filename `03-manager-b-modules.md`, but the official role name is `Cost Manager`.

## Current Cost Manager Tabs

- `Cost Review`
- `Review History`

Cost Manager is the cost authorization owner after Dept DRI. It no longer has standalone top-level `Demand Analysis`, `Authorized Analysis`, `Progress Tracking`, or `Project Setup` tabs. Analysis evidence must be embedded inside `Cost Review`.

## `costManager.costReview`

| Field | Definition |
| --- | --- |
| Business Owner | Cost Manager |
| Purpose | Final authorization or rejection for requester submissions already approved by Dept DRI. |
| Input Data | Dept DRI approved request packages, request items, long-form station/demand-unit quantities, pricing/carryover/warehouse evidence. |
| Output / Mutation | Cost Manager authorize / reject decision, reason, audit event, next workflow owner. |
| Next Consumers | OM Leader intake / assignment, Requester Action Required, Review History, Workflow Status. |

### Layout Contract

- Top area: Cost Review queue, selected-row detail, Authorize / Reject actions.
- Bottom area: Demand Analysis evidence with `Demand Cost Dashboard` and `Station Matrix`.
- `Demand Cost Dashboard` and `Station Matrix` must use `Review Status` as the first column.
- `Review Status` represents approval-chain state only; it does not replace project status.
- Authorized / rejected / in-pipeline rows remain visible in evidence and can be drilled into, but their actions are read-only.

## `costManager.demandCostDashboard`

| Field | Definition |
| --- | --- |
| Purpose | Item x phase x unit quantity/amount evidence inside Cost Review. |
| Input Data | Active submitted/approved/in-progress demand rows, USD canonical price, line count, locked/applied carryover/warehouse ledger. |
| Output / Mutation | None; read-only evidence. |

### Columns

- `Review Status`
- ENG Name
- CN-ENG Name
- VN Name
- Price
- MFG
- FATP TE
- FATP IQC
- FATP PQE
- WH
- Q-LAB
- REL
- ENG1
- ENG2
- ENG3
- IT
- FAC
- Total
- Detail

### Rules

- `Demand Type = MFG` quantity is aggregated into `MFG`.
- `Demand Type = Non-MFG` quantity is aggregated by demand unit.
- Amount = `Qty x Unit Price USD x Line Count`.
- `Line` filter comes from `stationBreakdown[].requestLine` / `request_demand_lines.line_code`.
- `Line Count` is a cost multiplier, not requester line scope.
- Selected row only drives highlight / drill-in sync; it must not redefine dashboard columns or numeric semantics.

## `costManager.stationMatrix`

| Field | Definition |
| --- | --- |
| Purpose | Phase x station / demand-unit detail for the selected item inside Cost Review. |
| Input Data | Long-form quantity rows, selected row, or dashboard cell scope. |
| Output / Mutation | None; read-only evidence. |

### Rules

- Preserve Excel-like density and horizontal scrolling.
- MFG detail uses station columns.
- Non-MFG detail uses department / demand-unit columns.
- `Buffer` / `Stock` stay blank when there is no official source.
- Pending warehouse / carryover is contextual evidence only; locked/applied ledger state is required before it affects effective cost.

## `costManager.itemQuantityReview`

| Field | Definition |
| --- | --- |
| Purpose | Directly add / edit / delete formal stationBreakdown / phase qty / total qty in the review popup. |
| Output / Mutation | Updates formal quantities and writes `itemQuantityReviewHistory` / audit metadata. |

### Rules

- Every direct edit must keep actor, time, before/after, and note.
- Direct edit changes formal demand quantity, not a temporary UI override.
- The popup can open from quantity, total, or item cells.

## Actions

| Action | Precondition | Success Result |
| --- | --- | --- |
| `Authorize` | Dept DRI approved row; Cost Manager scope is valid. | Moves to OM Leader intake / assignment. |
| `Reject` | Reason required. | Returns to Requester Action Required with audit/timeline. |
| `Detail` | Any row. | Opens selected-row detail; no workflow-state write. |
| `Edit Quantity` | Formal quantity scope exists. | Updates long-form quantity and audit history. |

## IT Acceptance Criteria

- Cost Manager top-level tabs are only `Cost Review / Review History`.
- `Cost Review` contains queue/actions plus Demand Analysis evidence.
- `Demand Cost Dashboard / Station Matrix` first column is `Review Status`.
- No top-level `Demand Analysis`, `Authorized Analysis`, `Progress Tracking`, or `Project Setup`.
- Rows appear in Cost Manager only after Dept DRI approve.
- Cost Manager authorize routes to OM Leader intake; reject routes to Requester Action Required.
