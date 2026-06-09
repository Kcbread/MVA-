# 06 表格資訊流

## Requester Tables

### `requester.addItemPopup.table.sources`

| 項目 | 定義 |
| --- | --- |
| Reads | OM catalog、purchase records/history、Copy Demand history、Lv123 taxonomy、New Item query。 |
| Writes | 無；點 `Add` 才建立 worksheet draft row。 |
| Key Columns | Add、Item、Detail、Spec、Action。 |
| Filters | Search、Lv1、Lv2、Lv3、Catalog / Reuse / Copy Demand / New Item Request source tabs。 |
| Actions | Add、Detail。 |
| Downstream | `requester.requestWorkspace.table.worksheetRows`。 |

Rules:

- Source badge 放在 Item cell 第二行，不是獨立欄。
- 不顯示 `Source` header、`Phase Trace` header、Catalog identity 文案。
- `Detail` cell 顯示 Lv123 path 與 source reference。
- `Spec` cell 只顯示 requester-safe product spec。

### `requester.requestWorkspace.table.worksheetRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Draft request rows、stationBreakdown rows、current Project / Line / MFG-Non-MFG scope。 |
| Writes | qty cells -> `stationBreakdown` long-form rows；Need Date；remove draft item row；Save Draft；Submit。 |
| Key Columns | Item / Spec、P1.0 group、P1.1 group、EVT group、DVT group、PVT group、MP group、Row Total、Hint、Action。 |
| Actions | Add Item、Save Draft、Submit、Remove、Detail。 |
| Downstream | Cost Manager Approval、Demand Analysis、OM Purchasing、Buyer Handoff。 |

MFG phase group columns:

```text
CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH / Phase Total
```

Non-MFG phase group columns:

```text
FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC / Phase Total
```

Cell mapping:

```text
requestId + project + requestLine + demandType + phase + station/demandUnit + qty
```

Rules:

- 一列 = `Item / Spec`。
- `P1.0 / P1.1 / EVT / DVT / PVT / MP` 是 two-row grouped headers。
- Qty 只允許非負整數；空值視為 0。
- `Total / Phase Total / Row Total` 只計算，不另存。
- Copy Demand 只帶 source trace；target qty 全部從 0 開始。
- Remove 直接移除 Requester worksheet row，不二次確認。

### `requester.requestWorkspace.table.rowHints`

| 項目 | 定義 |
| --- | --- |
| Reads | worksheet draft rows、carryover suggestion、warehouse evidence、New Item Request status。 |
| Writes | Candidate 建立只在 row detail/drawer 內執行；主表 hint 不直接寫主流程狀態。 |
| Key Columns | Hint badge、Detail。 |
| Downstream | Carryover review、warehouse owner queue。 |

### `requester.addReuseItem.table.byItemHistory`

| 項目 | 定義 |
| --- | --- |
| Reads | Completed/PO-issued history rows，包含 item/spec/source phase/source qty/demand breakdown。 |
| Writes | Current target project draft row、retarget 到目前 target/default phase 的 copied demand rows、source reference fields。 |
| Key Columns | Add、Source Project、Factory Material No.、Item、Spec、Qty / Phase、Detail。 |
| Actions | Add。 |
| Downstream | OPM Request Workspace Draft Items。 |

### `requester.addReuseItem.table.projectPackagePreview`

| 項目 | 定義 |
| --- | --- |
| Reads | 依 Source Project + Source Phase + Source Package 群組的 history rows。 |
| Writes | Import 後新增多筆 current target project draft rows；source qty 沿用，但 demand rows/raw phase totals 會 retarget 到目前 target/default phase。 |
| Key Columns | Item、Spec、Source Package、Qty、Phase Summary、Detail。 |
| Actions | Preview Package、Import Package to Request。 |
| Downstream | OPM Request Workspace Draft Items；submit 後進 Manager Approval。 |

### `requester.actionRequired.table.tasks`

| 項目 | 定義 |
| --- | --- |
| Reads | Waiting Requester Confirmation、amendment confirmation rows。 |
| Writes | Confirm Need、Cancel Request、Confirm Revised Request、Reject Amendment。 |
| Key Columns | Project、Item、Spec、Total Qty、Quoted Amount、Quote Date、Attachment Status、Current Stage、Actions。 |
| Downstream | OM Export Package 或 Cancelled。 |

## Manager B Tables

### `manager.approval.table.pendingApproval`

| 項目 | 定義 |
| --- | --- |
| Reads | request rows where `status = Submitted`。 |
| Writes | decision、decision time、manager reason、routing patch。 |
| Key Columns | Request ID、Project、Requester、Submitted At、Item、Affected Phases、Total Qty、Status、Reject Reason、Decision、Contact、Detail。 |
| Actions | Approve、Reject to Requester / Dept DRI、Contact DRI、Detail。 |
| Downstream | Approval History、Progress Tracking、Demand Analysis、OM queue。 |

### `manager.progressTracking.table.progressRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Excel raw progress rows + active request rows。 |
| Writes | 無。 |
| Key Columns | Year Project、Project、Item、Department、Quantity、Budget/PR/PO/Arrived Progress、Key Dates、Risk Reason、Detail。 |
| Actions | Detail。 |
| Downstream | Manager decision context。 |

### `manager.demandAnalysis.table.costDashboard`

| 項目 | 定義 |
| --- | --- |
| Reads | Submitted/approved/in-progress demand rows、USD canonical price helpers、carryover ledger/effective qty。 |
| Writes | 無。 |
| Key Columns | Item、Spec、Price、MFG、FATP TE、FATP IQC、FATP PQE、WH、Q-LAB、REL、ENG1、ENG2、ENG3、IT、FAC、Total、Detail。 |
| Actions | cell/detail drilldown 到 Station Matrix。 |
| Downstream | Manager demand analysis drilldown。 |

### `manager.demandAnalysis.table.stationMatrix`

| 項目 | 定義 |
| --- | --- |
| Reads | submitted/approved/in-progress request stationBreakdown rows、carryover ledger/effective qty。 |
| Writes | 無。 |
| Key Columns | Project、Item、Spec、Unit Price、Est. Amount、P1.0~MP station columns、Total Qty、Detail。 |
| Filters | Project、Item、Phase、Station、需求單位、Sort。 |
| Actions | Detail、dashboard cell drill filter。 |
| Downstream | Manager quantity reasonableness review。 |

### `manager.approvalHistory.table.decisions`

| 項目 | 定義 |
| --- | --- |
| Reads | reviewed rows。 |
| Writes | 無。 |
| Key Columns | Request ID、Project、Item、Phase Qty、Total Qty、Decision、Reason、Decision Time、Detail。 |

## Shared Tables

### `shared.contactPopup.panel.contacts`

| 項目 | 定義 |
| --- | --- |
| Reads | DRI / Leaders workbook rows、requester personas、project/process contact mappings。 |
| Writes | v1 無；read-only popup。 |
| Key Fields | Name、Email、Department、Role / Contact Type、Phone、Employee ID、Source。 |
| Actions | Open Contact、Copy Contact Text。 |
| Downstream | Manager Contact DRI、OM Contact DRI、manual follow-up。 |

## OM Tables

### `om.submissionDashboard.table.stageRows`

| 項目 | 定義 |
| --- | --- |
| Reads | G Project MVA EQ Request raw rows。 |
| Writes | 無。 |
| Key Columns | Project、Item、Qty、Received Date、Current Stage、Days in Stage、Next Action、Quote Expiry、Pending Reason、Detail。 |

### `om.pasDemandNo.table.pasRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Manager approved OM scope rows。 |
| Writes | PAS Demand No、PAS result status、history。 |
| Key Columns | Project、Phase、Item、Qty、PAS Demand、Item Context、Level 2/3、Owner、PAS Result Status、Next Step、Contact、Detail。 |
| Actions | Move to PAS Quote Result、Reject to Requester / Dept DRI、Contact DRI、Detail。 |
| Downstream | PAS Quote Result。 |

### `om.pasQuoteResult.table.quoteRows`

| 項目 | 定義 |
| --- | --- |
| Reads | PAS Demand No completed rows、waiting user confirmation rows、amendment rows。 |
| Writes | PAS Material No、vendor、vendor part no、unit price VND input 與 USD canonical price、quote date、quote received date、quote valid until、PDF、Excel、price decision status、Requester / Dept DRI routing status。 |
| Key Columns | Project、Phase、Item / Qty、PAS Tracking、Quote Result、Completion Status、Actions、Detail。 |
| Actions | Save Quote Info、Send to Requester、Reject to Requester / Dept DRI、Contact DRI、Detail。 |
| Downstream | Requester Action Required、OM Export Package。 |

### `om.submissionDashboard.table.quoteExpiryMonitor`

| 項目 | 定義 |
| --- | --- |
| Reads | 有 quote path 資料的 quote result rows。 |
| Writes | v1 無；validity 從 PAS Quote Result 編輯。 |
| Key Columns | Project、Item、PAS Demand No、PAS Material No、Valid Until、Expiry Status、Action Needed、Detail。 |
| Actions | Detail。 |
| Downstream | OM follow-up、MFG expiry reminder、Manager detail。 |

### `om.exportPackage.table.exportRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Requester confirmed rows、price auto-cleared rows、Budget Approver approved rows。 |
| Writes | finalExportCostType、finalExportTarget、finalExportPackageCode、finalExportStatus、finalExportedAt。 |
| Key Columns | Project、Phase、Item、Qty、Package Code、PAS Context、Quote Attachments、Requester Decision、Cost Type / Target、Export Status、Exported At、Actions、Contact、Detail。 |
| Actions | Expense、Capex、Export Package、Mark Exported、Reject to Requester / Dept DRI。 |
| Downstream | Buyer PR/PO。 |

## Cross-Table Rules

- `Detail` 不寫主流程狀態。
- `Contact DRI` 不寫主流程狀態。
- `Demand Analysis` 不等 approval 完成才顯示；submit 後即可見。
- `Progress Tracking` 看流程與達成率；`Demand Analysis` 看金額/數量合理性；兩者不可混成同一張表。
- OM `PAS Demand No` 只管 PAS Demand No；quote attachments 只在 `PAS Quote Result`。
- OM `PAS Quote Result` 是唯一輸入 PAS Material No、quote result、PDF/Excel、quote validity 的地方。
- `Quote Valid Until` 是 `Send to Requester` 前必填；報價到期提醒採 14 天門檻。
- Add Item popup 的 `Catalog / Reuse / Copy Demand / New Item Request` 都只建立 target worksheet row；target qty 預設 0。
- Reuse / Copy Demand 的 `Source Project / Source Line / Source Qty` 只作 reference；不可複製 source qty 到 target qty。
- Requester Need Date 是 submit 前必填，必須帶到 Manager、OM、Export、timeline 與 detail。
- Requester 可宣告 line carryover；Dept DRI 負責正式 carryover review；Manager/OM 只消費 effective qty/cost。
- 成本計算以 USD canonical values 為準。VND 是透過每月匯率做顯示、輸入與 export 換算。
- Manager Demand Analysis 的 saving / effective cost 只吃 applied carryover ledger events；pending/rejected carryover 可見但不扣成本。
- OM save quote info 後會產生 price decision：Auto Clear 或 Dept DRI -> Budget Approver。Auto Cleared 與 Budget Approver Approved rows 可不經 Requester confirmation 進 Export Package。
- `Temporary Budget Request` 輸入 UI 只限 Requester `Request Workspace`；不可注入 Manager B、OM Purchasing、Contact popup 或 Admin-only tables。
- `Contact` 是右上角 popup 輔助工具，不是 top-level tab。
