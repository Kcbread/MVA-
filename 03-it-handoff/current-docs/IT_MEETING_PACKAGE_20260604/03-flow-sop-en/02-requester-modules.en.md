# 02 Requester Modules

## `requester.requestWorkspace`

| Field | Definition |
| --- | --- |
| Business Owner | Requester |
| Purpose | Build the request package, add/reuse items, enter Need Date and demand quantity, and prepare Manager B submission. |
| Input Data | OM catalog, real purchase records, requester persona, project list. |
| Output / Mutation | Create `Draft` request rows. |
| Downstream Consumers | `requester.demandEditor`, `manager.approvalQueue`, `manager.quantityMatrix`. |

### Item Picker

`Add Item`, `Reuse Item`, `Reuse Project Package`, and `Create New Item` are not separate top-level tabs. They are modes inside the `Add / Reuse Item` popup.

| Mode | Purpose | Result |
| --- | --- | --- |
| Search Catalog | Search product catalog / OM catalog by item name, spec, or Level 1 / 2 / 3. | Adds one current-project draft item. |
| Reuse Approved History | Add one PO-completed reusable item from history. | Adds one current-project draft item with source demand rows copied. |
| Reuse Project Package | Preview/import a historical source package. | Adds multiple current-project draft items, still editable before submit. |
| Create New Item | Start a new material request when catalog/history cannot match. | Opens item maintenance, then creates a draft item. |

### Visible Columns

| Column | Meaning |
| --- | --- |
| Item | Product name. |
| Spec Summary | Short product spec summary; full text stays in Detail. Must not show vendor, brand, owner, or PAS material no. |
| Qty / Phases | Total qty plus active phase summary. |
| Need Date | Required date for the demand; must be filled before submit. |
| Demand Rows | Demand row count. |
| Breakdown Status | Whether enough demand quantity exists for submit. |
| Status | Draft / submitted state. |
| Timeline | Compact Draft / Demand / Submit or downstream timeline chips. |
| Actions | `Edit Demand` and `Remove`. |
| Detail | Opens item/request detail. |

### Actions

| Action | Precondition | Success Result |
| --- | --- | --- |
| `Add / Reuse Item` | User opens item picker. | Displays catalog, history, package import, and new item modes. |
| `Add` | User chooses catalog/history item. | Creates draft item and opens Demand Editor. |
| `Create New Item` | Existing item not found. | Creates new draft item. |
| `Edit Demand` | Row is `Draft`. | Opens `requester.demandEditor`. |
| `Submit Package to Manager B` | Selected draft rows each have at least one demand row qty > 0 and a Need Date. | Rows become `Submitted`, package id is created, Manager queue receives rows. |

### Error State

- No selected draft: show `Select at least one draft request before submitting to Manager B.`
- No demand qty: show `Add at least one demand row quantity before submitting to Manager B.`
- Missing Need Date: show `Need Date is required for every selected draft item before submitting.`
- Submitted rows must disappear from draft table after successful submit.

### Project / Phase Carryover

- The system stores Requester draft context: `lastRequestProject`, `lastRequestPhase`, and `lastDemandType`.
- `Add Item`, `Create New Item`, and `Reuse Item > Add` all add to the current target project; they do not reuse the source project.
- When a new item is added, its first demand row defaults to the last phase used in Demand Editor.
- Changing `Project Type / Project` updates the target project; the next added item carries that project forward.

## `requester.demandEditor`

| Field | Definition |
| --- | --- |
| Purpose | Single quantity input entry point for one item. |
| Input Data | Draft request row, phase master, station master, demand unit master. |
| Output / Mutation | Writes `stationBreakdown` long-form rows and recalculates phase totals / total qty. |

### Demand Row Schema

| Field | Required | Meaning |
| --- | --- | --- |
| Phase | yes | `P1.0 / P1.1 / EVT / DVT / PVT / MP`. |
| Demand Type | yes | `MFG / Non-MFG`. Can default from OPM profile; when no profile default exists, default is `MFG`. |
| Station | conditional | Required for `MFG`; uses `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`. Hidden for `Non-MFG`. |
| 需求單位 | conditional | Required for `Non-MFG`; uses `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`. Not required for `MFG`. |
| Qty | yes | Non-negative integer. |
| Request Line | yes | Line 1 / Line 2 / Line 3 request line context. |
| Carryover From | no | None / Line 1 / Line 2. Requester may declare line carryover while entering demand. |
| Carryover Qty | conditional | Required when Carryover From is not None. |
| Carryover Reason | conditional | Required when Carryover Qty is entered. |
| Remark | no | Free note. |

### Demand Type Rules

- `MFG` means station demand. Manager checks station reasonableness through `Demand Analysis > Station Matrix`.
- `Non-MFG` means unit demand. Manager checks unit amount and quantity through `Demand Analysis > Cost Dashboard`.
- Adding the next demand row inherits previous `phase / demandType / station / 需求單位` to reduce repetitive entry.
- User-entered carryover creates a ledger event with status `Requesterpplied`; Dept DRI remains the formal carryover review owner. Manager B and OM consume only original/saving/effective impact.

### Calculation

```text
P1.0 Qty = sum(qty where phase = P1.0)
P1.1 Qty = sum(qty where phase = P1.1)
EVT/DVT/PVT/MP follow the same rule
Total Qty = sum(all demand row qty)
```

## `requester.requestStatus` (merged demand overview + request status)

| Field | Definition |
| --- | --- |
| Purpose | Former separate package overview. Its information is now merged into `requester.requestStatus` to avoid duplicate tracking pages. |
| Input Data | Current requester + current project Draft / Submitted rows. |
| Output / Mutation | None, read-only; Draft rows may jump back to Edit Demand. |

### Visible Information

- Package id / label
- Item
- Status
- P1.0 ~ MP phase summary
- Total Qty
- Action
- Detail

## `requester.addReuseItem` (item picker mode)

| Field | Definition |
| --- | --- |
| Purpose | Reuse historical item/spec either by single item or by source project package inside the `Add / Reuse Item` popup. |
| Input Data | Completed rows with Factory Material No, PO trace, price history, source phase, and demand breakdown. |
| Output / Mutation | Creates current-target-project draft rows and clears downstream procurement fields. |

### Rules

- `Factory Material No` exists only after PO.
- Add from history must not overwrite existing draft items.
- `Source Project` is only the historical search filter; it is not the target project for the new request.
- Reuse Item toolbar must show `Add to: {currentProject} / default phase {lastRequestPhase}`.
- Copied rows preserve reference fields: `sourceProject`, `sourceRecordId`, `sourcePackageId`, `sourcePhase`, `sourcePoNo`.
- Copied rows clear procurement result fields: approval decision, PAS Demand No, PAS Material No, Factory Material No, vendor, quote, PO, actual amount.

### `requester.addReuseItem.byItem`

| Field | Definition |
| --- | --- |
| Purpose | Add one historical row into the current Requester target project. |
| Filters | Search, `Source Project`, Level 1, Level 2. |
| Action | `Add`. The full meaning is `Add Item to Request` in the button title/detail. |

Rules:

- Copies source quantity + `stationBreakdown` by default, but retargets copied demand rows to the current OPM target/default phase.
- `sourcePhase` remains as a reference field only; raw phase quantities are synchronized to the target/default phase so no hidden source-phase demand remains.
- If source has no `stationBreakdown`, the system derives demand rows from source phase quantity.
- The new draft target project is always the current OPM header project, never the source project.
- Add result: draft row is immediately visible in `Request Workspace` and can be edited through `Edit Demand`.

### `requester.addReuseItem.byProjectPackage`

| Field | Definition |
| --- | --- |
| Purpose | Import a whole historical project/phase/package group, then allow item-level edits before submit. |
| Filters | `Source Project`, `Source Phase`, `Source Package`. |
| Actions | `Preview Package`, `Import Package to Request`. |

Rules:

- Preview shows all source rows before import.
- Import copies multiple rows into current target project draft items.
- Imported rows preserve source qty, but demand rows and raw phase totals are retargeted to the current OPM target/default phase.
- User can delete an imported item, edit spec, or edit demand rows before submit.
- Package import does not submit automatically; Manager B receives data only after `Submit Package to Manager B`.

## `requester.temporaryBudgetRequest`

| Field | Definition |
| --- | --- |
| Purpose | Requester temporary pre-budget request with estimate/bidding/PO variance tracking. |
| Input Data | Selected draft rows and temporary budget estimate fields. |
| Output / Mutation | Adds temporary budget metadata to submitted rows. |

Implementation guard:

- The `Temporary Budget Request` input panel may render only inside Requester `Request Workspace`.
- It must never be injected into Manager B, OM Purchasing, Contact popup, or Admin-only views.
- Manager/OM should only see temporary budget tracking summaries attached to actual temporary-budget request rows or detail panels.

## `requester.actionRequired`

| Field | Definition |
| --- | --- |
| Purpose | Requester task inbox. |
| Input Data | Waiting user confirmation rows, amendment confirmation rows. |
| Output / Mutation | Requester decision status, cancel reason, timeline event. |

### Task Types

| Type | User Sees | Actions |
| --- | --- | --- |
| Quote Ready | Quote amount, quote date, attachment status; no vendor. | `Confirm Need` / `Cancel Request` |
| Revised Request Confirmation | Before/after qty/spec and quote reference. | `Confirm Revised Request` / `Reject Amendment` |

## `requester.requestStatus`

| Field | Definition |
| --- | --- |
| Purpose | Dense tracking for draft and submitted demand. This replaces the split between `My Demand Overview` and `Request Status`. |
| Input Data | Requester draft rows with demand qty plus submitted/approved/rejected/in-progress rows. |
| Output / Mutation | Draft rows can jump back to `Edit Demand`; submitted rows are read-only except post-quote request change. |

### Visible Information

- Request ID
- Project
- Item
- Qty
- Current Status
- Action Status
- Timeline
- Detail
