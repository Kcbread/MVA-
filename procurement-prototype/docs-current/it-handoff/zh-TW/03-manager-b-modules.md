# 03 Cost Manager 模組

本文件沿用歷史檔名 `03-manager-b-modules.md`，但正式角色名稱是 `Cost Manager`。

## Cost Manager 現行 Tabs

- `Cost Review`
- `Review History`

Cost Manager 是 Dept DRI 後的成本授權者。它不再提供獨立 top-level `Demand Analysis`、`Authorized Analysis`、`Progress Tracking` 或 `Project Setup`。分析 evidence 必須嵌入 `Cost Review`，不能回到舊多頁架構。

## `costManager.costReview`

| 項目 | 定義 |
| --- | --- |
| Business Owner | Cost Manager |
| Purpose | 對 Dept DRI 已 approve 的 requester submission 做 final authorization 或 reject。 |
| Input Data | Dept DRI approved request packages、request items、long-form station/demand-unit qty、pricing/carryover/warehouse evidence。 |
| Output / Mutation | Cost Manager authorize / reject decision、reason、audit event、next workflow owner。 |
| Next Consumers | OM Leader intake / assignment、Requester Action Required、Review History、Workflow Status。 |

### Layout Contract

- 上方：Cost Review queue、selected-row detail、Authorize / Reject action。
- 下方：Demand Analysis evidence，包含 `Demand Cost Dashboard` 與 `Station Matrix`。
- `Demand Cost Dashboard` 與 `Station Matrix` 第一欄固定為 `Review Status`。
- `Review Status` 只表示審批鏈狀態，不取代 project status。
- Authorized / rejected / in-pipeline rows 仍留在 evidence，可 drilldown，但 action read-only。

## `costManager.demandCostDashboard`

| 項目 | 定義 |
| --- | --- |
| Purpose | 在 Cost Review 內提供 item x phase x unit 數量/金額 evidence。 |
| Input Data | Active submitted/approved/in-progress demand rows、USD canonical price、line count、locked/applied carryover/warehouse ledger。 |
| Output / Mutation | 無；read-only evidence。 |

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

- `Demand Type = MFG` 的數量彙整到 `MFG`。
- `Demand Type = Non-MFG` 的數量依 demand unit 彙整。
- Amount = `Qty x Unit Price USD x Line Count`。
- `Line` filter 來自 `stationBreakdown[].requestLine` / `request_demand_lines.line_code`。
- `Line Count` 是成本乘數，不代表 requester line scope。
- selected row 只做 highlight / drill-in sync，不改寫 dashboard 欄位與數字語意。

## `costManager.stationMatrix`

| 項目 | 定義 |
| --- | --- |
| Purpose | 在 Cost Review 內提供 selected item 的 phase x station / demand-unit 明細。 |
| Input Data | Long-form quantity rows、selected row 或 dashboard cell scope。 |
| Output / Mutation | 無；read-only evidence。 |

### Rules

- 保持 Excel-like 高密度與水平捲動。
- MFG detail 使用 station columns。
- Non-MFG detail 使用 department / demand-unit columns。
- `Buffer` / `Stock` 沒有正式來源時維持空白。
- Pending warehouse / carryover 只可作 contextual evidence；locked/applied 後才影響 effective cost。

## `costManager.itemQuantityReview`

| 項目 | 定義 |
| --- | --- |
| Purpose | 在 review popup 直接 add / edit / delete 正式 stationBreakdown / phase qty / total qty。 |
| Output / Mutation | 更新正式數量並寫入 `itemQuantityReviewHistory` / audit metadata。 |

### Rules

- 每次 direct edit 必須保留 actor、time、before/after、note。
- Direct edit 改的是正式需求數量，不是 temporary UI override。
- Popup 點 quantity、total 或 item cell 都可開啟。

## Actions

| Action | 前置條件 | 成功後 |
| --- | --- | --- |
| `Authorize` | Dept DRI approved row；Cost Manager scope valid。 | 進 OM Leader intake / assignment。 |
| `Reject` | 必填 reason。 | 回 Requester Action Required，保留 audit/timeline。 |
| `Detail` | 任意 row。 | 開啟 selected-row detail；不寫 workflow state。 |
| `Edit Quantity` | 有正式 qty scope。 | 更新 long-form qty 與 audit history。 |

## IT Acceptance Criteria

- Cost Manager top-level 只顯示 `Cost Review / Review History`。
- `Cost Review` 內必須有 queue/action 與 Demand Analysis evidence。
- `Demand Cost Dashboard / Station Matrix` 第一欄是 `Review Status`。
- 不顯示 top-level `Demand Analysis`、`Authorized Analysis`、`Progress Tracking`、`Project Setup`。
- Dept DRI approve 後才出現在 Cost Manager。
- Cost Manager authorize 後才進 OM Leader intake；reject 回 Requester Action Required。
