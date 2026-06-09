# 02 Requester 模組

本文件是 2026-06-08 鎖定版。若舊文件提到 `Source Panel`、`Add Demand Lines modal`、表內第一列新增、或 `Item / Spec + Phase` row，皆已過期。

## `requester.requestWorkspace`

| 項目 | 定義 |
| --- | --- |
| Business Owner | Requester |
| Purpose | 在目前 Project / Line scope 內，用 Excel-like worksheet 建立 demand package、選 item/spec、輸入所有 phase station/unit qty、儲存草稿或送審。 |
| Input Data | Project list、Requester persona、OM catalog、purchase records/history、Lv123 taxonomy、warehouse/carryover evidence。 |
| Output / Mutation | 建立/更新 `Draft` request rows；每個非零 qty cell 寫入 `stationBreakdown` long-form row。 |
| Downstream Consumers | Cost Manager Approval、Cost Manager Demand Analysis、OM Purchasing、Buyer Handoff。 |

### Workspace Layout

- Request Workspace 是整頁 Excel worksheet，不使用 `Source Panel + Demand Matrix`。
- 上方固定 scope：`MFG / Non-MFG` tab、Project、Line、Need Date、Save Draft、Submit。
- `MFG / Non-MFG` 是兩個 input tab；一次編輯一條 line。
- Need Date 是 package-level 共用欄位。
- 主表是一列一個 `Item / Spec`，不是一列一個 phase。

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

- Qty cell accepts non-negative integers only.
- Negative number, decimal, and scientific notation must be blocked or sanitized.
- Empty qty is treated as `0`.
- Keyboard entry must support Tab; Enter should move to the next qty cell.
- `Total / Phase Total / Row Total` are derived values and must not be separately stored.

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

| 項目 | 定義 |
| --- | --- |
| Purpose | Requester 新增 worksheet row 的唯一主要入口。 |
| Input Data | Catalog rows、Reuse history、Copy Demand history、New Item Request query、Lv123 taxonomy。 |
| Output / Mutation | 點 `Add` 後建立一筆 worksheet item row，所有 phase qty seed = 0。 |

### Popup Layout

- Popup width target: `min(1360px, calc(100vw - 24px))`。
- Popup height target: `calc(100vh - 24px)`。
- Popup table shell 自己 vertical/horizontal scroll；頁面本身不可 horizontal overflow。
- Toolbar 兩層：
  - Row 1: Search + `Lv1 / Lv2 / Lv3` cascading filters。
  - Row 2: `Catalog / Reuse / Copy Demand / New Item Request` segmented tabs。

### Popup Table Columns

| Column | 說明 |
| --- | --- |
| Add | 第一欄；短按鈕文字固定 `Add`。 |
| Item | 品項 identity；第二行顯示 source badge：Catalog / Reuse / Copy Demand / New Item Request。 |
| Detail | Lv123 path、source project/line/reference、copy/reuse reference、或 New Item pending review。 |
| Spec | Requester-safe product spec 摘要；主表 2-3 行，完整文字放 title/detail。 |
| Action | `Detail` 或 `Pending review`。 |

Deprecated popup columns:

- `Source`
- `Phase Trace`
- `Catalog identity`

### Source Mode Rules

| Source Tab | Result |
| --- | --- |
| Catalog | 新增 item/spec row；target qty 全部 0。 |
| Reuse | 複用 item/spec/source reference；target qty 全部 0。 |
| Copy Demand | 依 item/spec/source trace 建立 target row；不複製 source qty。 |
| New Item Request | 開啟物料主檔新增申請草稿；完成必填後才可成為 worksheet pending row。 |

### Lv123 Filters

- Popup state: `requestItemPickerLevel1 / requestItemPickerLevel2 / requestItemPickerLevel3`。
- 使用既有 `level1Options()`、`level2Options()`、`level3Options()` cascade。
- Catalog / Reuse / Copy Demand 都套用 Lv filters。
- New Item Request tab 不被 Lv filters 擋住；search text 用來啟動物料主檔申請，並顯示相似項供查重。
- Row matching 讀取 `row.level1/level2/level3`，並兼容 OM matched fields `omCategoryLevel1/2/3`。

### Privacy Guard

Requester worksheet、Add Item popup、Requester detail 不可顯示：

- vendor
- supplier
- PAS material no
- factory material no
- OM assignee
- FTV

## Save / Submit

| Action | Rule |
| --- | --- |
| Save Draft | 儲存目前 line 的 worksheet rows；不要求 Need Date。 |
| Submit | 必須有 package-level Need Date，且至少一個 qty cell > 0。 |
| Remove | Requester worksheet row 直接移除，不跳二次確認；只刪目前 line/mode 下該 item 的 worksheet draft row。 |

## Carryover / Warehouse Suggestion

- 主表只顯示 row hint badge。
- 細節與 candidate 建立放在 row drawer/detail。
- Warehouse / carryover evidence 不直接修改 requester qty；正式 impact 由後續 owner/review rule 決定。

## IT Acceptance Criteria

- Request Workspace 不存在 `Source Panel`。
- 不存在 `Add Demand Lines` modal 作為 requester 主要入口。
- Add Item popup 第一欄是 `Add`。
- Popup header 是 `Add / Item / Detail / Spec / Action`。
- Popup 有 `Lv1 / Lv2 / Lv3` cascading filters。
- Worksheet phase group header 是 `P1.0 / P1.1 / EVT / DVT / PVT / MP` 並置中。
- 40 item rows 時，worksheet 只能在 table shell 內水平/垂直捲動。
- Desktop / tablet / compact viewport 不可有 page-level horizontal overflow。
