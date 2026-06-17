# 04 OM Purchasing 模組

## Role Split

| Role | 權限 |
| --- | --- |
| `OM Leader` | 可維護每月 `USD to VND Exchange Rate`，也可操作 PAS / Quote / Export 單據。 |
| `OM Member` | 可查看並使用匯率，可操作被分派或目前 scope 內的 PAS / Quote / Export 作業，但不可修改匯率。 |

### Exchange Rate

- 成本與價格計算以 USD canonical 欄位為準。
- 全域 `Currency Display` 可切換 `VND / USD`。
- VND 顯示、輸入與 export 透過當月 `USD to VND Exchange Rate` 換算。
- 未設定當月匯率時使用系統 fallback rate，UI 顯示 `Fallback Rate`。

## OM Purchasing 現行 Tabs

- `Submission Dashboard`
- `PAS Demand No`
- `PAS Quote Result`
- `Export Package`

OM 工作區採 task-based 命名。`PAS Demand No` 只輸入 PAS number；`PAS Quote Result` 輸入 bidding/quote result 與 quote validity；`Quote Expiry` 是 `Submission Dashboard` 內的監控資訊，不是流程 tab。

## `om.submissionDashboard`

| 項目 | 定義 |
| --- | --- |
| Business Owner | OM Purchasing / OM Leader |
| Purpose | 看 OM stage 與 pending 狀態，不把 Budget/PR/PO/Arrived 這類非 OM 主工作欄位混入主表。 |
| Input Data | `G Project MVA EQ Request` raw rows。 |
| Output / Mutation | 無，read-only。 |

### KPI

- New Received
- Waiting PAS Demand No
- Waiting Quote Result
- Waiting Requester
- Export Pending
- Over SLA
- Expired Quote
- Expiring Soon

### Visible Columns

- Project
- Item
- Qty
- Received Date
- Current Stage
- Days in Stage
- Next Action
- Quote Expiry
- Pending Reason
- Detail

### Tracking Rules

- `Received Date` 顯示 row 在 Cost Manager authorize 後進入 OM workflow 的日期。
- `Current Stage` 顯示目前 OM 作業節點：PAS Demand No、PAS Quote Result、Waiting Requester 或 Export Package。
- `Days in Stage` 顯示 row 停留在目前 OM stage 的天數。
- `Next Action` 顯示 OM operator 下一步應該做什麼。
- `Quote Expiry` 只做監控；validity 仍在 `PAS Quote Result` 編輯。
- Detail modal 保留完整 stage timeline。

## `om.pasDemandNo`

| 項目 | 定義 |
| --- | --- |
| Purpose | PAS/Bidding 回傳後，OM 輸入 PAS Demand No。 |
| Input Data | Cost Manager authorized OM scope rows。 |
| Output / Mutation | `pasDemandNo`、PAS result timestamp、OM history event。 |
| Next Consumers | `om.pasQuoteResult`。 |

### Visible Columns

| Column | 說明 |
| --- | --- |
| Project | project。 |
| Phase | current project phase/stage label。 |
| Item | item/spec。 |
| Qty | total qty。 |
| PAS Demand | PAS Demand No input/status。 |
| Item Context | PAS part/spec context。 |
| Level 2 / Level 3 | OM category。 |
| CPD-IEP Owner | OM owner。 |
| PAS Result Status | 等待或已輸入。 |
| Next Step | Move to PAS Quote Result。 |
| Contact | Contact DRI。 |
| Detail | detail modal。 |

### Actions

| Action | 前置條件 | 成功後 |
| --- | --- | --- |
| `Move to PAS Quote Result` | `PAS Demand No` 已輸入。 | row 進 `PAS Quote Result`。 |
| `Reject to Requester / Dept DRI` | 必填 reason。 | row rejected。 |
| `Contact DRI` | 任意 row。 | 開 contact modal。 |
| `Detail` | 任意 row。 | 開 detail。 |

### Rules

- 此頁不 upload screenshot/image and Excel。
- 此頁不處理 quote price。
- PAS Demand No 可一路帶到 PAS Quote Result / Export Package / Buyer / Detail。

## `om.pasQuoteResult`

| 項目 | 定義 |
| --- | --- |
| Purpose | 在同一個 compact quote result card 內完成 PAS quote / bidding result、quote validity、attachments，並觸發系統 price decision。 |
| Input Data | rows with PAS Demand No or quote completion stage rows。 |
| Output / Mutation | `pasMaterialNo`、vendor、vendor part no、unit price VND input 與 USD canonical value、quote date、`quoteReceivedAt`、`quoteValidUntil`、`quoteStatus`、screenshot/image、Excel、price decision status、Requester / Dept DRI routing status。 |
| Next Consumers | `requester.actionRequired`、`om.quoteExpiryMonitor`、`om.exportPackage`。 |

### Required Before Save Quote Info

- PAS Material No
- Vendor
- Vendor Part No
- Unit Price
- Quote Date
- Quote Valid Until
- Quote screenshot/image
- Quote Excel

### Visible Columns

- Project
- Phase
- Item / Qty
- PAS Tracking
- Quote Result
- Completion Status
- Actions
- Detail

### Quote Result Card

`Quote Result` card 包含：

- PAS Material No
- Vendor
- Vendor Part No.
- Unit Price
- Quote Date
- Quote Received Date
- Quote Valid Until
- Quote screenshot/image
- Quote Excel
- Expiry status

### Quote Validity Rules

- `Quote Received Date` 空白時預設沿用 `Quote Date`。
- `Quote Valid Until` 是 `Save Quote Info` / price decision 前必填欄位。
- `Valid`：距離到期超過 10 天。
- `Expiring Soon`：距離到期 0-10 天。
- `Expired / Requote Required`：已超過有效日期。
- Quote validity 只能在 `Quote Result` card 內正式 render，不可用 DOM observer 注入其他角色頁面。

### Actions

| Action | 前置條件 | 成功後 |
| --- | --- | --- |
| `Save Quote Info` | required fields complete。 | 儲存 quote fields / attachment flags，並產生 Auto Cleared 或 Price Escalation Required。 |
| `Reject to Requester / Dept DRI` | 必填 reason。 | row rejected。 |
| `Detail` | 任意 row。 | 開 detail。 |

### Price Decision Rules

`Save Quote Info` 後系統會用 quote price 與 history price 比對：

- USD 絕對價差 `quoteUnitPriceUsd - historyUnitPriceUsd <= 0.40` = `Auto Cleared`。
- USD 絕對價差 `quoteUnitPriceUsd - historyUnitPriceUsd > 0.40`、無 history price、新品項或 Temporary Budget = price exception。
- 無 history price、Temporary Budget Request、或超過門檻 = `Price Escalation Required`。
- `Auto Cleared` 不送 Requester confirmation，可直接進 `Export Package`。
- `Price Escalation Required` 進 `Dept DRI -> Budget Approver`；Budget Approver 通過後才可進 `Export Package`。

### Requester Visibility Rule

Requester 不看 vendor / vendor part no / supplier。Requester 只看：

- Item
- Spec
- Total Qty
- Quoted Amount
- Quote Date
- Attachment Status
- Confirm / Cancel action

## `om.quoteExpiryMonitor`

| 項目 | 定義 |
| --- | --- |
| Purpose | `Submission Dashboard` 內的報價時效、到期與重新詢價提醒監控；不是流程 tab。 |
| Input Data | 有 quote/bidding path 的 rows：PAS Demand No、PAS Material No、quote date、quote valid until、screenshot/image and Excel、vendor。 |
| Output / Mutation | v1 不直接寫入；validity 從 `PAS Quote Result` 編輯。 |
| Next Consumers | OM follow-up、MFG quote expiry reminder、Manager detail。 |

### Status Rules

- `Valid`：距離到期超過 10 天。
- `Expiring Soon`：距離到期 0-10 天。
- `Expired / Requote Required`：已過有效日期。
- `Missing Valid Until`：已有 quote 但尚無法追蹤時效。

### Visible Columns

- Project
- Phase
- Item
- PAS Demand No
- PAS Material No
- Quote Date
- Valid Until
- Expiry Status
- Action Needed
- Detail

## `om.exportPackage`

| 項目 | 定義 |
| --- | --- |
| Purpose | price auto-clear 或 Budget Approver approval 後，選擇費用類型並用單一 `Export Package` 動作輸出 final export Excel + quote screenshot/image package。 |
| Input Data | rows where `Auto Cleared` 或 `Budget Approver Approved`。 |
| Output / Mutation | `finalExportCostType`、final export target/status/package code/export timestamp。 |
| Next Consumers | Buyer PR/PO。 |

### Visible Columns

- Project
- Phase
- Item
- Qty
- Package Code
- PAS Context
- Quote Attachments
- Requester Decision
- Cost Type / Target
- Export Status
- Exported At
- Actions
- Contact
- Detail

### Actions

| Action | 前置條件 | 成功後 |
| --- | --- | --- |
| `Expense` | price-cleared 或 Budget Approver approved，未 exported。 | cost type = Expense；target = ECS；產生 package code。 |
| `Capex` | price-cleared 或 Budget Approver approved，未 exported。 | cost type = Capex；target = CFA；產生 package code。 |
| `Export Package` | 已選 Expense/Capex，且 quote screenshot/image + quote Excel 皆存在。 | 同時準備 final export Excel package 與 quote screenshot/image package reference。 |
| `Mark Exported` | 已選 Expense/Capex 且 package ready。 | status = Exported to CFA/ECS；Buyer 可見。 |
| `Reject to Requester / Dept DRI` | 未 exported 且必填 reason。 | row rejected。 |

### Cost Type / Target Rules

- `Expense` 是 OM 使用者選擇的費用類型；Buyer Handoff target 顯示為 `ECS`。
- `Capex` 是 OM 使用者選擇的費用類型；Buyer Handoff target 顯示為 `CFA`。
- `CFA / ECS` 是 package / Buyer Handoff 對應資訊，不是使用者唯一決策語意。
- PAS Demand No、PAS Material No、quote screenshot/image、quote Excel、quote validity 在 `Export Package` 只讀，正式輸入點仍是 `PAS Quote Result`。

### Package Code

```text
{Process}-{Stage}-{ProjectCode}-MVA{YYMM}-{Seq}OM
```

範例：

```text
FATP-MP-CGY4-MVA2604-21OM
```

### Rules

- Payment Method 固定 `MVA`。
- CFA/ECS 都是 PR 入口。
- Buyer 只負責 PO / external progress / evidence。
