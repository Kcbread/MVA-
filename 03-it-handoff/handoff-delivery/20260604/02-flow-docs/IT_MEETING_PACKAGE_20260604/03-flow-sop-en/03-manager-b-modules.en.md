# 03 Manager B Modules

## Current Manager B Tabs

- `Approval`
  - `Pending Approval`
  - `Approval History`
- `Demand Analysis`
  - `Cost Dashboard`
  - `Station Matrix`
- `Progress Tracking`
- `Project Setup`

`Demand Analysis` is the default analysis workspace. Manager B should see the Excel-style `Item x Phase x Unit` cost dashboard first and open the station matrix only when quantity reasonableness needs drilldown.

## `manager.approval`

| Field | Definition |
| --- | --- |
| Business Owner | Manager B |
| Purpose | One approval workspace containing pending approval and approval history. |
| Input Data | Pending rows where `status = Submitted`; history rows with manager decisions. |
| Output / Mutation | `Approved` / `Rejected`, decision timestamp, manager reason, timeline. |
| Downstream Consumers | Progress Tracking, Demand Analysis, OM queue, Approval History. |

### Inner Sections

| Section | Meaning |
| --- | --- |
| `Pending Approval` | Row-level direct approval. |
| `Approval History` | Read-only manager decisions; no requester add/submit behavior. |

## `manager.approvalQueue`

| Field | Definition |
| --- | --- |
| Business Owner | Manager B |
| Purpose | Review and approve/reject OPM submitted demand. |
| Input Data | Request rows where `status = Submitted`. |
| Output / Mutation | `Approved` or `Rejected`, decision timestamp, manager reason, timeline. |
| Downstream Consumers | Approval History, Progress Tracking, Demand Analysis, OM queue. |

### Visible Columns

| Column | Meaning |
| --- | --- |
| Request ID | Request row id. |
| Project | Project/package. |
| Requester | Submitter. |
| Submitted At | Submission timestamp. |
| Item | Item and spec. |
| Affected Phases | Phases with quantity. |
| Total Qty | Item total quantity. |
| Status | Should be `Submitted`. |
| Reject Reason | Reject reason input. |
| Decision | `Approve` / `Reject to Requester / Dept DRI`. |
| Contact | `Contact DRI`. |
| Detail | Request detail. |

### Actions

| Action | Precondition | Success Result |
| --- | --- | --- |
| `Approve` | Row status = Submitted. | Row status = Approved; leaves Pending Approval; enters Approval History; remains in Progress Tracking and Demand Analysis. |
| `Reject to Requester / Dept DRI` | Reason required. | Row status = Rejected; Requester can see reason; does not enter OM/Buyer. |
| `Contact DRI` | Row has contact context. | Opens contact modal. |
| `Detail` | Any row. | Opens detail modal with demand breakdown. |

## `manager.progressTracking`

| Field | Definition |
| --- | --- |
| Purpose | Pivot-like procurement progress dashboard. |
| Input Data | `G Project MVA EQ Request` raw rows + active system request rows. |
| Output / Mutation | None, read-only. |

### KPI

- Total Qty
- Budget Done
- PR Done
- PO Done
- Arrived
- Late / At Risk

### Visible Columns

| Column | Meaning |
| --- | --- |
| Year Project | Excel year project. |
| Project | Project code. |
| Item | Item group. |
| Department | Source department. |
| Quantity | Demand quantity. |
| Budget Progress | done/total + progress. |
| PR Progress | done/total + progress. |
| PO Progress | done/total + progress. |
| Arrived Progress | received/total + progress. |
| Delivery Status | Late / Pending / Not Arrived. |
| Key Dates | Required / Deadline / ETA / DTA. |
| Pending / Risk Reason | Manager-readable reason; do not show raw G/L directly. |
| Detail | Raw row detail. |

### Filters

- Year Project
- Project
- Process
- Stage
- Department
- Late only
- Pending only

## `manager.demandAnalysis`

| Field | Definition |
| --- | --- |
| Purpose | Manager B demand analysis workspace that keeps managers out of the wide table until they drill down. |
| Input Data | OPM submitted / approved / in-progress demand rows with long-form demand rows. |
| Output / Mutation | None, read-only; inner tab changes only switch analysis view and filters. |

### Inner Tabs

| Inner Tab | Module ID | Meaning |
| --- | --- | --- |
| `Cost Dashboard` | `manager.costDashboard` | Default first layer following the Excel Dashboard sheet concept: item x phase x unit quantity/amount. |
| `Station Matrix` | `manager.stationMatrix` | Second-layer Excel-like wide table for phase x station quantity reasonableness. |

## `manager.costDashboard`

| Field | Definition |
| --- | --- |
| Purpose | First layer inside `Demand Analysis`. Review each item by phase and MFG / Non-MFG unit columns first, then drill into Station Matrix. |
| Input Data | OPM submitted / approved / in-progress demand rows with long-form demand rows. |
| Output / Mutation | None, read-only; clicking a unit / row switches to `Station Matrix` and applies filters. |

### Header Controls

- Project
- Phase
- Line Count
- View Mode: `Amount / Qty`
- Currency Display

### Dashboard Columns

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

### Aggregation Rules

- `Demand Type = MFG` quantity is fully aggregated into `MFG`; demand unit is ignored.
- `Demand Type = Non-MFG` quantity is aggregated by `需求單位`.
- Amount is calculated as `Qty x Unit Price USD x Line Count`. USD is the canonical cost value; VND display/export is converted through the monthly exchange rate.
- Unit price source order: OM/PAS quote → history price → OPM estimate → price pending.

### Cell Rules

- In `Qty` mode, each unit cell shows total quantity for the selected phase.
- In `Amount` mode, each unit cell shows `Qty x Unit Price x Line Count`.
- Empty cells remain blank to preserve Excel-like density.
- Clicking an item/unit cell switches to `Station Matrix` and applies `item + selected phase + unit` filters.

## `manager.stationMatrix`

| Field | Definition |
| --- | --- |
| Purpose | Second layer inside `Demand Analysis`; check item phase/station quantity reasonableness. |
| Input Data | OPM submitted demand rows with `stationBreakdown`. |
| Output / Mutation | None, read-only. |

### Data Inclusion

Included:

- `Submitted`
- `Approved`
- `In Progress`

Excluded:

- `Draft`
- `Rejected`
- `Cancelled`
- Superseded rows

### Main Table Columns

- Project
- Item
- Spec
- Unit Price
- Est. Amount
- P1.0 ~ MP expanded station matrix
- Total Qty
- Detail

### Phase Matrix Columns

Each phase expands into:

| Group | Columns |
| --- | --- |
| Mainline | CG / BG / FATP / Test / Hybrid / Auto |
| Packing | ENG Pack / Zombie / Laser_pico / Rework |
| Support | Repair / WH |
| Calc | Buffer / Total Demand / Stock / Actual Need |

### Rules

- `Buffer` / `Stock` remain blank when there is no official source.
- `Total Demand` and `Actual Need` can initially equal the phase station total.
- Phase filter shows only that phase's columns.
- Station filter keeps rows with that station qty, but the matrix can still show full phase context.
- Demand unit filter recalculates matrix values.

## `manager.unitDashboard`

| Field | Definition |
| --- | --- |
| Purpose | Phase x demand unit summary for the selected item. |
| Input Data | Same as `manager.quantityMatrix`. |
| Output / Mutation | Clicking cells only updates filters; no data write. |

### Columns

`MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`

### Cell

- Qty
- Line count

## `manager.approvalHistory`

| Field | Definition |
| --- | --- |
| Purpose | View Manager decision records. |
| Input Data | Rows with decision result. |
| Output / Mutation | None, read-only. |

### Visible Information

- Request ID
- Project
- Item
- Phase Qty
- Total Qty
- Decision
- Reason
- Decision Time
- Detail

## `manager.projectSetup`

| Field | Definition |
| --- | --- |
| Purpose | Maintain project access and basic setup. |
| Input Data | Project configs. |
| Output / Mutation | Project open/close and phase setting. |

## `shared.contactDri`

| Field | Definition |
| --- | --- |
| Purpose | Lookup contact info without overloading main tables. |
| Input Data | Requester row, DRI input rows, project/process contact rows. |
| Output / Mutation | None. |

### Contact Cards

- Requester
- Department DRI
- Project / Process Contact
- Request Context
