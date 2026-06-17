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

### Workflow Table

用途：Dept DRI、Budget Approver、OM Purchasing 的 queue。

規則：

- row-local action：Approve / Reject / Detail 或 Save / Move / Detail。
- 主欄位只顯示決策必要資訊。
- days pending 與 pending owner 必須清楚。

### Workflow Status Table

用途：Requester Request Status、Cost Manager Review History、OM Submission Dashboard。

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
- Cost Manager Review History
- OM Submission Dashboard

### RoleGuardModule

統一判斷角色可看/可操作：

- Requester 隱藏採購內部欄位。
- Dept DRI scope-limited review。
- Cost Manager scoped cost authorization。
- OM Leader assignment / exchange rate / feedback。
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

封裝 PAS Demand No、PAS Quote Result、Quote Expiry、Export Package 的 shared row layout。

### AssignmentControl

OM Leader 專用 assignment control；OM Purchasing 不可使用。

### FeedbackReviewTable

Admin + Mai review UAT feedback；Giang/Linh 只能提交與看自己的。

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
