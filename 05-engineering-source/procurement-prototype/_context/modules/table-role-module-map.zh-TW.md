# 表格 / 角色 / 模組化地圖

## 目的

這份文件定義哪些表格與功能可以封裝，避免後續每個角色頁各自複製邏輯，造成 UI 跑版、權限混亂、狀態不一致。

## 表格類型

### Form Table

用途：Requester 建單、warehouse owner Stock In、候選建立。

規則：

- action 永遠可見。
- 長 spec 摘要化，完整內容進 Detail。
- 不顯示內部採購欄位。
- Non-MFG department/unit 使用 dropdown master，不接受自由文字。
- Requester scope 可含 Project Year / Project / Purpose；Purpose 只能是 `SMT / FATP`，不得與 phase 欄位混用。Line open date 由 OM Leader Project Stage Calendar 依 Project + Phase metadata 帶入，不是 Requester 表單欄位。

### Workflow Table

用途：Dept DRI、Budget Approver、OM Purchasing 的 queue。

規則：

- row-local action：Approve / Reject / Detail 或 Save / Move / Detail。
- 主欄位只顯示決策必要資訊。
- days pending 與 pending owner 必須清楚。

### Workflow Status Table

用途：Request Tracking、Requester Request Status、Cost Manager Review History、OM Submission Dashboard。

共用模型：`WorkflowStatusModule`。

欄位：

- Project
- Item / Spec
- Qty
- Submitted / Received Date
- Pending Owner
- Current Stage
- Days Pending
- Quote Status
- Next Action
- Risk
- Detail

### Dense Dashboard Table

用途：Cost Manager Cost Dashboard。

規則：

- Excel-like 高密度。
- 受保護 baseline，不隨 status refactor 改版。
- 數字可 compact，但 title/detail 要有完整值。

### Matrix Table

用途：Cost Manager Station Matrix。

規則：

- Excel-like station matrix。
- 僅在 table shell 內水平捲動。
- 不被 generic layout decorator 改成 form table。

### Ledger Table

用途：Carryover Ledger、Inventory Transaction Ledger、Audit。

規則：

- 顯示 trace 與狀態，不承載操作型大表單。
- reason 可摘要，但不可截斷到失去語意。

## 可封裝模組清單

### WorkflowStatusModule

輸入 row + roleContext，輸出 pendingOwner、currentStage、daysPending、nextAction、visibilityFlags。

使用者：

- Requester Request Status
- Request Tracking（top-level cross-role per request progress，依 role visibility 顯示欄位）
- Cost Manager Review History
- OM Submission Dashboard

### RoleGuardModule

統一判斷角色可看/可操作：

- Requester 隱藏採購內部欄位。
- Dept DRI scope-limited review。
- Cost Manager scoped cost authorization。
- OM Leader assignment / exchange rate。
- OM Purchasing assigned row only。
- Budget Approver price/budget final approval。
- Admin setup only。

### ApprovalQuantityReview

封裝 Dept DRI、Cost Manager、Budget Approver 共用的 quantity review evidence。Dept DRI 使用 dashboard-first Item Quantity Review：Dashboard 顯示 active project 全品項 MFG aggregate 與 Non-MFG department columns，item switcher 只切換 active item 與 detail scope；Cost Manager、Budget Approver 保留其角色 evidence 視角。同一套輸入資料支援 Dashboard、MFG Station Detail、Non-MFG Department Detail、row picker、Approve / Reject / Detail callbacks，以及 Item Quantity Review direct edit popup 入口。

### CostDashboardTable / DemandCostEvidence

封裝 Dashboard summary。Dept DRI、Cost Manager、Budget Approver 共用同一套 Dashboard renderer；Dashboard 不綁 selected row，`MFG` 欄為全部 station 加總，右側為 Non-MFG department columns。Cost Manager 不再有獨立全域 Demand Analysis tab。數字邏輯與 total highlight 共用，不接受各角色硬編碼分裂。

### StationMatrixTable

封裝 MFG station matrix / Non-MFG department matrix。Dept DRI、Cost Manager、Budget Approver 共用同一套 selected row / dashboard cell drill-in renderer；保持 Excel-like detail，避免被 dashboard 或 workflow table CSS 污染。

### ItemPickerTable

封裝 Catalog / Reuse Item / Copy Demand 的 common picker shell、filter、detail、add action。

### ReuseItemTable

只複製 item identity/spec，qty 預設 0。

### CopyDemandPackageTable

複製已完成或可 reuse 的 demand package，包含 qty，retarget 到目前 scope。

### WarehouseInventoryTable

顯示 On Hand / Reserved / Available / Top Source / Potential Target。

### CarryoverSuggestionCard

顯示 Request Workspace 的 compact suggestion，不取代 Copy Demand。

### OMWorkflowTable

封裝 PAS Demand No、Quote Result、Quotation DB、OM Handoff、My Exports tracking 的 shared row layout。My Intake 可顯示 Quotation DB 候選報價，並在 Central IT 確認後套用候選資料進入 My Quote Result；Quotation DB 同時整合可 reuse 報價紀錄與 quote validity / expiry 追蹤；`Quote Valid Until` 的人工輸入與修正仍在 `Quote Result`。My Quote Result 的 row action 使用明確業務語意：`Validate Quote` 執行 quote completeness、price decision、Quotation DB retention decision；`Send to Requester` 送 requester confirmation；`Return to DRI` 退回 DRI/Requester 修正。Validate Quote 在目前 prototype 只標記 `Ready for Quotation DB` / `Review before Quotation DB` / blocked reason，不代表已 real execution 寫入 MySQL `pas_quotes`。My Quote Result 的 `Validate Quote` 確認後，系統會依 PAS Demand No grouping 生成 system PAS Tracking Excel；同 PAS Demand No 預設 merge 成一份，OM 標示 `Keep separate` 時才分開。此 generated Excel 是 OM-internal system attachment metadata，不是 OM upload 欄位。My Exports 由 OM 操作 Budget status/#、PR status/#、PO status/#、ETA (PLAN)、DTA (Actual)、#PUR request NO、Total LT，Purpose 僅 read-only tracking。

### RequesterPurposeDatePlanning

封裝 Requester purpose 與 phase date planning 欄位：

- `Purpose`：Requester input，dropdown `SMT / FATP`；OM tracking only；不是 phase。
- `Phase`：仍指 project phase，包含 `P1.0 / P1.1 / EVT / DVT / PVT / MP`。
- `Date of request`：系統在每個品項 submit 時記錄。
- `Required Delivery Date`：Requester 需求到廠日期；每個 item row 各自輸入；Dept DRI 可在 review detail 更新。
- `Line open date`：OM Leader Project Stage Calendar input，scope = `Year Project + Project + Phase`；Requester phase header / phase control 只帶 metadata。
- `Required Delivery Date follow Stage date`：依每個 phase 的 `Line open date - 14 days`。
- `Given LT`：依每個 phase 的 `Required Delivery Date follow Stage date - Date of request`。
- `Total lead time`：OM input，通常在 PAS quote / tracking 更新時回覆。

### AssignmentControl

OM Leader 專用 assignment control；OM Purchasing 不可使用。

## 全局統整 Checklist

若任務要求「統整 module / 角色 / 權限」，不可只列 module。必須同步列出：

1. Feature：業務能力與使用者價值。
2. Function：可操作動作或系統行為。
3. Module：程式與文件維護邊界。
4. Role：責任角色。
5. Permission：view / create / edit / approve / assign / export / maintain / override。
6. Workflow Status：pending owner、stage、days pending、next action。


## 新增表格 Checklist

1. 這張表是哪個 table type？
2. 哪個 role 可以看？
3. 哪個 role 可以操作？
4. 有沒有內部欄位要對 Requester 隱藏？
5. days pending / pending owner 是否來自 WorkflowStatusModule？
6. 長文字是否有 title/detail？
7. action 是否 row-local 且不跨欄？
8. 是否會影響 CostDashboardTable / StationMatrixTable baseline？

## Refactor 優先順序

1. WorkflowStatusModule。
2. RoleGuardModule。
3. OMWorkflowTable + AssignmentControl。
4. ItemPickerTable / ReuseItemTable / CopyDemandPackageTable。
5. WarehouseInventoryTable + CarryoverSuggestionCard。
6. CostDashboardTable / StationMatrixTable 保護性封裝。
