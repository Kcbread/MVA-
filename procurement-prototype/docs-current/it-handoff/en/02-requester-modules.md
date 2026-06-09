# 02 Requester Modules

This is the locked 2026-06-08 version. Older references to `Source Panel`, `Add Demand Lines modal`, inline first-row add, or `Item / Spec + Phase` rows are deprecated.

## `requester.requestWorkspace`

| Field | Definition |
| --- | --- |
| Business Owner | Requester |
| Purpose | Build a demand package inside the current Project / Line scope by choosing item/spec, entering all-phase station/unit quantities, saving draft, or submitting. |
| Input Data | Project list, requester persona, OM catalog, purchase/history records, Lv123 taxonomy, warehouse/carryover evidence. |
| Output / Mutation | Creates/updates `Draft` request rows; every non-zero qty cell writes one long-form `stationBreakdown` row. |
| Downstream Consumers | Cost Manager Approval, Cost Manager Demand Analysis, OM Purchasing, Buyer Handoff. |

### Workspace Layout

- Request Workspace is a full-page Excel-like worksheet. It does not use `Source Panel + Demand Matrix`.
- Top scope controls: `MFG / Non-MFG` tab, Project, Line, Need Date, Save Draft, Submit.
- `MFG / Non-MFG` are separate input tabs; one line is edited at a time.
- Need Date is package-level.
- One worksheet row means one `Item / Spec`, not one phase.

### Worksheet Columns

MFG worksheet:

```text
Item / Spec
P1.0: CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH / P1.0 Total
P1.1: same station set / P1.1 Total
EVT: same station set / EVT Total
DVT: same station set / DVT Total
PVT: same station set / PVT Total
MP: same station set / MP Total
Row Total / Hint / Action
```

Non-MFG worksheet:

```text
Item / Spec
P1.0: FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC / P1.0 Total
P1.1: same unit set / P1.1 Total
EVT: same unit set / EVT Total
DVT: same unit set / DVT Total
PVT: same unit set / PVT Total
MP: same unit set / MP Total
Row Total / Hint / Action
```

### Qty Input Rules

- Qty cells accept non-negative integers only.
- Negative numbers, decimals, and scientific notation must be blocked or sanitized.
- Empty qty is treated as `0`.
- Keyboard entry must support Tab; Enter should move to the next qty cell.
- `Total / Phase Total / Row Total` are derived values and must not be stored separately.

### Data Mapping

Each worksheet qty cell maps to one long-form demand row:

```text
requestId + project + requestLine + demandType + phase + station/demandUnit + qty
```

Implementation field:

```text
stationBreakdown[]
```

Rules:

- `MFG` cells write `station`.
- `Non-MFG` cells write `demandUnit`.
- All phase/station/unit qty starts at `0` when item/spec is added.
- Copy Demand never copies source qty into the target worksheet; source qty is reference only.

## `requester.addItemPopup`

| Field | Definition |
| --- | --- |
| Purpose | The main and only primary entry point for adding a worksheet row. |
| Input Data | Catalog rows, Reuse history, Copy Demand history, New Item Request query, Lv123 taxonomy. |
| Output / Mutation | Clicking `Add` creates one worksheet item row with all phase qty seeded at 0. |

### Popup Layout

- Target width: `min(1360px, calc(100vw - 24px))`.
- Target height: `calc(100vh - 24px)`.
- The popup table shell owns vertical/horizontal scrolling; the page itself must not horizontally overflow.
- Toolbar has two rows:
  - Row 1: Search + `Lv1 / Lv2 / Lv3` cascading filters.
  - Row 2: `Catalog / Reuse / Copy Demand / New Item Request` segmented tabs.

### Popup Table Columns

| Column | Meaning |
| --- | --- |
| Add | First column; visible button label is `Add`. |
| Item | Item identity; second line contains the source badge: Catalog / Reuse / Copy Demand / New Item Request. |
| Detail | Lv123 path, source project/line/reference, copy/reuse reference, or New Item pending review. |
| Spec | Requester-safe product spec summary; 2-3 lines in the table, full text in title/detail. |
| Action | `Detail` or `Pending review`. |

Deprecated popup columns:

- `Source`
- `Phase Trace`
- `Catalog identity`

### Source Mode Rules

| Source Tab | Result |
| --- | --- |
| Catalog | Adds item/spec row; all target qty starts at 0. |
| Reuse | Reuses item/spec/source reference; all target qty starts at 0. |
| Copy Demand | Creates a target row from item/spec/source trace; source qty is not copied. |
| New Item Request | Opens a material master request draft; only completed pending material rows can enter the worksheet. |

### Lv123 Filters

- Popup state: `requestItemPickerLevel1 / requestItemPickerLevel2 / requestItemPickerLevel3`.
- Uses existing `level1Options()`, `level2Options()`, and `level3Options()` cascade.
- Catalog / Reuse / Copy Demand all apply Lv filters.
- New Item Request is not blocked by Lv filters; search text starts the material master request and similar rows are shown for duplicate review.
- Row matching reads `row.level1/level2/level3` and also supports OM matched fields `omCategoryLevel1/2/3`.

### New Material Request Required Fields

- English, Chinese, and Vietnamese material names.
- Suggested Lv1 / Lv2 / Lv3; reviewer can correct.
- Spec summary, structured spec attributes, UOM, use case, estimate unit price, estimate amount, and estimate reason.
- If similar materials exist, requester must provide the difference reason and evidence/reference before adding the pending row.
- Pending rows can receive worksheet qty but remain `Pending Material Review`; they do not become active `item_master` catalog data until approved or merged.

### Privacy Guard

Requester worksheet, Add Item popup, and Requester detail must not show:

- vendor
- supplier
- PAS material no
- factory material no
- OM assignee
- FTV

## Save / Submit

| Action | Rule |
| --- | --- |
| Save Draft | Saves current-line worksheet rows; Need Date is not required. |
| Submit | Requires package-level Need Date and at least one qty cell > 0. |
| Remove | Removes the worksheet row immediately without a second confirmation; only the item row in the current line/mode draft scope is removed. |

## Carryover / Warehouse Suggestion

- Main worksheet only shows row hint badges.
- Details and candidate creation live in row drawer/detail.
- Warehouse/carryover evidence does not directly modify requester qty; formal impact is decided by downstream owner/review rules.

## IT Acceptance Criteria

- Request Workspace has no `Source Panel`.
- No `Add Demand Lines` modal is used as the requester primary entry point.
- Add Item popup first column is `Add`.
- Popup headers are `Add / Item / Detail / Spec / Action`.
- Popup has `Lv1 / Lv2 / Lv3` cascading filters.
- Worksheet phase group headers are `P1.0 / P1.1 / EVT / DVT / PVT / MP` and centered.
- With 40 item rows, the worksheet scrolls only inside the table shell.
- Desktop / tablet / compact viewport must not create page-level horizontal overflow.
