# 表格 / 角色權限 / 可封裝模組盤點

本文是 MVA 採購系統 prototype 的維護型規格，用來回答三件事：

- 目前有哪些表格類型，應該遵守什麼欄位與排版契約。
- 目前有哪些角色，誰可以新增、審核、操作、檢視、設定。
- 哪些功能或表格應該封裝成共用模組，未來調整一次即可套用到多個角色畫面。

本文以 `PROJECT_DECISIONS.md` 為準。若本文和舊 handoff 文件衝突，以 `PROJECT_DECISIONS.md` 和本文為準。

## 0. Subagent 對齊結論

本輪由 workflow / role 檢視與 UI table/layout 檢視兩個方向對齊後，鎖定以下維護策略：

- `WorkflowStatusModule` 是跨角色狀態的唯一來源；Requester、Cost Manager、OM 可以看不同欄位，但不應各自重新推導 pending owner / current stage / days pending。
- `RoleGuardModule` 是跨角色操作權限的唯一來源；render function 不應散落 `currentRole === ...` 判斷。
- `Quantity Dashboard / Quantity Detail Matrix` 是 Dept DRI、Cost Manager、Budget Approver 共用 evidence module。Dashboard 是全域 MFG aggregate + Non-MFG department 總覽；Detail Matrix 才吃 selected row 或 dashboard cell drill-in scope。不可藉由 status/progress refactor 改動欄位、數字邏輯、密度或 drilldown。
- 表格 UI 不再靠全域 decorator 猜欄位；新表格必須先選 table type，再定 colgroup / cell type / action contract。
- 不要把更多資訊塞進主表。主表回答「下一步是什麼 / 卡在哪 / 成本差異是什麼」；完整 spec、source trace、quote、audit 一律進 Detail。

## 1. 正式角色命名

| 正式名稱 | 舊稱 / 容易混淆名稱 | 主要責任 | 可操作範圍 | 不該看到或不該做 |
| --- | --- | --- | --- | --- |
| `Requester` | User A / OPM / DRI Requester | 建立需求、選需求範圍、輸入 need date、維護 warehouse evidence、處理退回修正 | 自己負責的 project / demand department / request rows | 不看 vendor、PAS material、factory material、OM assignee；不做 OM export |
| `Dept DRI` | DRI | 第一層需求與異常確認者；包含 requester submit review、carryover review、price/budget exception review | 自己部門或 mapping 範圍內的待審項 | 不做最終 budget approval；不做 OM 派工 |
| `Budget Approver` | Project DRI | 最終預算/價格異常核准 | Dept DRI 通過後的 budget / price review rows | 不處理 requester 建單細節；不做 OM 作業 |
| `Cost Manager` | Manager B / Cost Owner | Dept DRI 後的下一層成本授權者 | Dept DRI approved rows、Quantity Dashboard、Quantity Detail Matrix、Review History | 不提供獨立 Demand Analysis；不做 requester demand / OM export / project setup |
| `OM Leader` | Mai / OM leader | OM 派工、匯率、全 OM row 操作、UAT feedback triage | 所有 OM work rows、assignment、exchange rate、feedback triage | 不取代 Dept DRI / Budget Approver 的 business approval |
| `OM Purchasing` | Giang / Linh / OM member | 處理被派工的 PAS Demand No、PAS Quote Result、Export Package | assigned rows | 不派工；不改匯率；不操作未派工 rows |
| `Admin` | System admin | 使用者、角色、mapping、threshold、approval chain、OM member setup、audit / feedback setup | 設定資料與測試資料 | 不做 business approval，除非未來另開 emergency override 並強制 audit |
| `Buyer Handoff` | downstream / Buyer | OM export 後承接 PR / PO / buyer execution | prototype 內主要是狀態呈現 | 不應被叫作 `Downstream`；畫面文案用 `Buyer Handoff` 或 `Buyer PR / PO` |

## 2. 權限分類

權限不要綁頁面名稱，應該拆成可重用 guard。建議後續在 `role-guards` 補齊下列能力：

| 權限能力 | 說明 | 允許角色 | 建議 guard |
| --- | --- | --- | --- |
| 建立需求 | 新增 demand line、copy/reuse、temporary budget、need date | Requester | `canCreateDemand(role, context)` |
| 提交需求 | Submit package / demand lines to Dept DRI | Requester | `canSubmitDemand(role, row)` |
| Dept DRI 審核 | Requester submit、carryover、price exception 第一層確認 | Dept DRI | `canDeptDriReview(role, row)` |
| Budget approval | 最終預算/價格異常核准 | Budget Approver | `canBudgetApprove(role, row)` |
| 成本授權檢視 | Quantity Dashboard、Quantity Detail Matrix、secondary carryover evidence | Dept DRI, Cost Manager, Budget Approver, Admin | `canViewScopedEvidence(role, scope)` |
| OM 派工 | Assign / reassign / clear OM assignee | OM Leader, Admin | `canAssignOm(role)` |
| OM row 操作 | PAS Demand No、Quote Result、Export Package | OM Leader, OM Purchasing, Admin | 已有 `canOperateOmRow()`，需保留 |
| 匯率維護 | 每月 USD/VND exchange rate | OM Leader, Admin | `canMaintainExchangeRate(role)` |
| Feedback triage | UAT feedback status / owner | OM Leader, Admin | `canTriageFeedback(role)` |
| Admin setup | User / role / mapping / threshold / approval chain | Admin | `canAdminSetup(role)` |
| Internal procurement fields | vendor / PAS material / factory material / OM assignee | OM Leader, OM Purchasing, Admin | `visibilityFlags.showVendor / showPasMaterial / showFactoryMaterial / showOmAssignee` |

目前已有：

- `app-modules/role-guards.js`：OM role 與 assignment guard。
- `app-modules/workflow-status.js`：跨角色 status / visibility model。

後續應把其他角色權限補進同一套 guard，而不是在各 render function 裡散落判斷。

## 3. 表格類型分類

每一張表格必須先選定 table type，不能自由拼 CSS。這是避免跑版、按鈕跨欄、欄高不一致的第一層契約。

| 表格類型 | 用途 | 典型角色 / 頁面 | 主設計原則 | 可封裝元件 |
| --- | --- | --- | --- | --- |
| `form-table` | 輸入、草稿、選品、requester 操作 | Requester Draft Demand Lines、Search Catalog、Reuse Existing Item、Import Demand Package | action 永遠可見；長文字摘要；不塞完整 spec | `FormTable`, `ActionStack`, `SpecSummaryCell`, `IdentityCell` |
| `workflow-table` | 流程 queue / 操作台 | Dept DRI queue、Budget Approver queue、OM PAS Demand No、PAS Quote Result、Export Package | 只顯示當下下一步；action 短文案；狀態清楚 | `WorkflowTable`, `WorkflowActionCell`, `StatusBadge`, `NextActionCell` |
| `status-monitor-table` | 進度追蹤 / submission monitor | Requester Request Status、Cost Manager Review History、OM Submission Dashboard | pending owner、current stage、days pending、next action；不要 PR/PO 百分比當主欄位 | `WorkflowStatusTable`, `TimelineChips`, `PendingOwnerCell` |
| `dense-dashboard-table` | 高密度成本/單位總覽 | 三角色 Review Evidence Demand Cost Dashboard | Excel-like，可橫向 scroll；數字意義不可被截斷 | `DemandCostEvidence`, `DepartmentCostCell`, `CostQtyCell` |
| `matrix-table` | Station Matrix drilldown | 三角色 Review Evidence Station Matrix | 第二層 detail；保留 Excel-like；只在 table shell 內水平捲動 | `StationMatrixTable`, `MatrixHeader`, `StationQtyCell` |
| `ledger-table` | 追溯與 audit | Carryover Ledger、audit events、feedback history | 精簡欄位；source trace 進 detail；reason 可摘要但不可截到失義 | `LedgerTable`, `AuditTimeline`, `ReasonCell` |
| `admin-table` | 設定資料 | Admin users / roles / requester mapping / thresholds | inline edit 可以，但欄位要固定；修改要 audit | `AdminConfigTable`, `EditableCell`, `SaveRowAction` |
| `detail-kv-panel` | Detail modal 內的資料檢視 | Contact DRI、row detail、quote detail、source breakdown | 完整資料放這裡，不塞主表 | `DetailModal`, `KeyValueGrid`, `SourceTracePanel` |

### Cell 類型契約

| Cell 類型 | 適用內容 | 顯示規則 |
| --- | --- | --- |
| `cell-identity` | Item name、request id、factory material no、PAS no、package code | 必須能辨識；不可被截到只剩半行；可 1-2 行 |
| `cell-spec-summary` | spec / detail / purpose | 主表 2-3 行摘要；完整內容放 `title` / Detail / expand |
| `cell-note-summary` | remark、pending reason、source note | 短摘要；長內容 Detail |
| `cell-number` | qty、amount、price、days pending | 不換行；使用 compact display；完整值放 title |
| `cell-timeline` | milestone chips | 只放 key milestone；完整 history 進 Detail |
| `cell-action` | Add / Edit / Remove / Detail / Export | 垂直 action stack；短文案；destructive 放最後 |

## 4. 目前核心表格盤點

### Requester

| 表格 / 區塊 | 類型 | 目前用途 | 封裝建議 |
| --- | --- | --- | --- |
| Request Workspace summary | status / instruction cards | 告訴 requester 三步驟：choose scope、select items、submit lines | `RequestWorkspaceHeader` |
| Draft Demand Lines | `form-table` | 顯示待送出的 demand lines | `DraftDemandLinesTable`，吃 demand line view model |
| Search Catalog | `form-table` / picker | catalog 選品 | `ItemPickerTable` |
| Reuse Item | `form-table` / picker | 複用單一品項 identity/spec，qty 預設 0 | `ReuseItemTable`，需 manual colgroup |
| Copy Demand | `form-table` / picker | 複製已完成 / 可 reuse 的 demand package 與 source qty，並 retarget 到目前 scope | `CopyDemandPackageTable` |
| Carryover Suggestions | compact card，不建議表格化 | 選定 item/scope 時提示可建立 stock / previous-line candidate | `CarryoverSuggestionCard` |
| Warehouse Evidence | `workflow-table` / summary | Requester 維護月度 owned-stock evidence；Dept DRI 確認後才影響成本 | `WarehouseEvidenceTable` + `SourceBreakdownDetail` |
| Action Required | `workflow-table` | reject/revise、requester action | `RequesterActionQueue` |
| Request Status | `status-monitor-table` | 自己需求進度與 timeline | `WorkflowStatusTable(role=requester)` |

Requester 主表不得顯示 vendor、PAS material no、factory material no、OM assignee。

### Dept DRI

| 表格 / 區塊 | 類型 | 目前用途 | 封裝建議 |
| --- | --- | --- | --- |
| Submission Review Queue | `workflow-table` | Requester submit 後第一層 review | `ApprovalQueueTable(role=deptDri)` |
| Carryover Review Queue | `workflow-table` | 檢查 requester-applied carryover | `CarryoverReviewQueue` |
| Price / Budget Exception Queue | `workflow-table` | quote over threshold、no history、temporary budget | `PriceReviewQueue(role=deptDri)` |
| Project Review | `dense-dashboard-table` / `matrix-table` | role-visible pending、approved、pipeline rows 的 Dashboard / MFG / Non-MFG evidence | `QuantityDashboard(role=deptDri)` + `QuantityDetailMatrix(role=deptDri)` |
| Review History | `ledger-table` | 審核記錄 | `ApprovalHistoryTable` |

Dept DRI 只需要 requester、item/spec、need date、exception reason、evidence、approve/reject/reason，不需要 OM assignment 或 export action。

### Budget Approver

| 表格 / 區塊 | 類型 | 目前用途 | 封裝建議 |
| --- | --- | --- | --- |
| Budget Review Queue | `workflow-table` | Dept DRI approve 後最終 budget approval | `PriceReviewQueue(role=budgetApprover)` |
| Project Review | `dense-dashboard-table` / `matrix-table` | budget scope 內的 Dashboard / MFG / Non-MFG evidence 與 pipeline 狀態 | `QuantityDashboard(role=budgetApprover)` + `QuantityDetailMatrix(role=budgetApprover)` |
| Review History | `ledger-table` | 最終核准/退回紀錄 | `ApprovalHistoryTable` |

Budget Approver 只看最終金額、variance、history price delta、temporary budget reason、Dept DRI decision。

### Cost Manager

| 表格 / 區塊 | 類型 | 目前用途 | 封裝建議 |
| --- | --- | --- | --- |
| Cost Review Row Picker | `row-picker` | Dept DRI approve 後選擇待授權 row，主分析由 Quantity Review 承接 | `ApprovalQuantityRowPicker(role=costManager)` |
| Review Evidence - Quantity Dashboard | `dense-dashboard-table` | 不依賴 selected row；全域顯示 MFG aggregate + Non-MFG department cost / qty evidence | `QuantityDashboard(role=costManager)`，與 Dept DRI / Budget Approver 共用 |
| Review Evidence - Quantity Detail Matrix | `matrix-table` | selected row 或 dashboard cell drill-in 後顯示 MFG station detail / Non-MFG department detail | `QuantityDetailMatrix(role=costManager)`，與 Dept DRI / Budget Approver 共用 |
| Review History | `ledger-table` | Cost Manager authorized / rejected history | `ApprovalHistoryTable(role=costManager)` |

重要保護：Cost Manager 不再提供獨立 `Demand Analysis / Authorized Analysis / Progress Tracking / Project Setup` tab。`Quantity Dashboard` 與 `Quantity Detail Matrix` 是三角色共用 renderer；Dashboard 是全域 MFG aggregate + Non-MFG department 總覽，detail matrix 才是 row/cell scoped，total highlight 與數字邏輯不可在各角色硬編碼分裂。

### OM Leader / OM Purchasing

| 表格 / 區塊 | 類型 | 目前用途 | 封裝建議 |
| --- | --- | --- | --- |
| Submission Dashboard | `status-monitor-table` | OM 角度看 pending owner、stage、days pending、quote status、next action | `WorkflowStatusTable(role=om)` |
| PAS Demand No | `workflow-table` | 輸入 PAS Demand No / move to quote | `OmPasDemandNoTable` |
| PAS Quote Result | `workflow-table` | 輸入 PAS material、vendor、price、quote date、valid until、metadata attachments | `OmQuoteResultTable` + `QuoteResultCard` |
| Export Package | `workflow-table` | Expense/Capex、CFA/ECS package、export package | `OmExportPackageTable` |
| Assignment Controls | row action / select | Mai assign / reassign / clear | `AssignmentControl` |
| Exchange Rate Utility | toolbar utility | OM Leader 維護匯率 | `ExchangeRateUtility` |
| UAT Feedback Review | `workflow-table` | Admin + Mai triage feedback | `FeedbackReviewTable` |

OM Purchasing row actions 必須吃 `canOperateOmRow()`。Giang/Linh 只操作 assigned rows；Mai/Admin 可操作全部。

### Admin

| 表格 / 區塊 | 類型 | 目前用途 | 封裝建議 |
| --- | --- | --- | --- |
| Users / Roles | `admin-table` | 管理使用者、員工編號、email、department、role | `UserRoleAdminTable` |
| Requester Mapping | `admin-table` | `Project Family + Project Code + Demand Department -> Requester / Dept DRI` | `RequesterMappingTable` |
| Threshold Rules | `admin-table` | history price delta threshold、temporary budget rules | `ThresholdRuleTable` |
| Approval Chain Setup | `admin-table` | Dept DRI -> Budget Approver | `ApprovalChainTable` |
| OM Member Setup | `admin-table` | OM Leader / OM Purchasing assignment scope | `OmTeamSetupTable` |
| Audit / Feedback | `ledger-table` | audit events / UAT feedback triage | `AuditEventTable`, `FeedbackReviewTable` |

Admin 是設定角色，不是 business approval 角色。

## 5. 可封裝模組清單

### 5.1 Domain / business helper modules

| 模組 | 狀態 | 責任 | 使用者 |
| --- | --- | --- | --- |
| `WorkflowStatusModule` | 已有 `app-modules/workflow-status.js` | 產出 pending owner、stage、days pending、next action、timeline、visibility | Requester / Cost Owner / OM / Admin |
| `RoleGuardModule` | 已有 `app-modules/role-guards.js`，需擴充 | role-based permission guard、OM assignment guard | 全角色 |
| `SharedFormatterModule` | 已有 `app-modules/shared-formatters.js` | money、qty、date、compact display | 全表格 |
| `PriceDecisionModule` | 已有 `app-modules/price-decision.js` | history price delta / no history / temporary budget routing | OM / Dept DRI / Budget Approver |
| `QuoteValidityModule` | 已有 `app-modules/quote-validity.js` | valid / expiring soon / expired | OM / Cost Owner |
| `LeadTimeModule` | 已有 `app-modules/lead-time.js` | ETA / lead-time reason | OM / Cost Owner |
| `DemandCostDashboardModule` | 已有 `app-modules/demand-cost-dashboard.js` | item x phase x unit aggregation | Cost Owner |
| `CarryoverModule` | 部分在 `carryover-extension.js` / app.js | suggestion、ledger、effective qty / cost impact | Requester / Dept DRI / Cost Owner |
| `WarehouseModule` | 待正式拆 | month + item/spec summary、source breakdown | Requester / Dept DRI / Cost Owner |
| `AssignmentModule` | Phase 1 API partially available | OM assignment display/guard/audit | OM Leader / OM Purchasing |
| `FeedbackModule` | Phase 1 API planned/partially available | page/row feedback metadata、triage | OM / Admin |
| `FtvCodeModule` | 已有 `app-modules/ftv-code.js` | purchase route、FTV audit key、export gate、cost/FTV key 分離 | OM / Admin / Accounting audit |

### 5.1A 現有 helper 的升級方向

| 現有檔案 | 目前狀態 | 下一步封裝方向 | 注意事項 |
| --- | --- | --- | --- |
| `app-modules/workflow-status.js` | 已能產出 pending owner、stage、days、quote status、timeline、visibility flags | 升級為正式 `WorkflowStatusModule`，Requester / Cost Owner / OM status monitor 都吃同一份 view model | Quote validity 可由 `quote-validity.js` 做底層，畫面狀態仍由 workflow status 統一輸出 |
| `app-modules/role-guards.js` | 目前偏 OM assignment guard | 擴充成全角色 guard：Requester、Dept DRI、Budget Approver、Cost Owner、OM Leader、OM Purchasing、Admin | 不要在 render function 裡散落 role string 判斷 |
| `app-modules/demand-cost-dashboard.js` | Cost Dashboard aggregation helper | 保留並包成 protected `CostDashboardTable` / `DemandAnalysisModule` 的計算核心 | 不改 aggregation 與數字顯示基準 |
| `app-modules/shared-formatters.js` | 共用顯示格式 | 統一 money / qty / date / compact labels | 金額主表可 compact，完整值放 title / Detail |
| `layout-contract.js/css` | 全域 layout contract | 降低侵入性，只補缺失 class；manual table 不自動改欄 | 不可再污染 manual colgroup 或 matrix internals |

### 5.2 UI modules

| 模組 | 目的 | 可套用頁面 |
| --- | --- | --- |
| `TableShell` | 包表格水平 scroll，阻止 page-level overflow | 全部 table |
| `ColumnContract` | 明確 colgroup + cell type，避免 nth-child 猜欄 | Picker、workflow、dashboard、matrix |
| `ActionStack` | 表格內短按鈕垂直排列 | Draft、Reuse、OM、Admin |
| `StatusBadge` | Applied / Pending / Rejected / Expiring / Auto Cleared | 全角色 |
| `TimelineChips` | key milestone chips | Request Status、Submission Monitor |
| `WorkflowStatusTable` | 同一份 status model，不同角色透明度 | Requester、Cost Owner、OM |
| `DetailModal` | 完整 spec / source trace / quote / audit | 全角色 |
| `DemandScopeSelector` | MFG/Non-MFG、line、stage、station/unit | Requester Add Demand |
| `ItemPickerTable` | Catalog / reuse / package picker 共用 shell | Requester |
| `CarryoverSuggestionCard` | 選品時提示可 carryover source | Requester |
| `CarryoverLedgerTable` | 常駐追溯 carryover event | Cost Owner / Dept DRI |
| `OmWorkflowRow` | PAS Demand / Quote / Export 的 common row shell | OM |
| `AssignmentControl` | Mai assignment UI | OM |
| `ExchangeRateUtility` | compact monthly rate toolbar | OM Leader |
| `FtvComplianceCell` | Export Package 顯示 FTV Required / Not Required / Missing Mapping | OM Export / future audit report |

### 5.3 建議正式模組清單

| 模組 | 類型 | 主要輸入 | 主要輸出 | 優先級 |
| --- | --- | --- | --- | --- |
| `WorkflowStatusModule` | domain | request row / group + role context | pending owner、stage、days、quote status、timeline、visibility | P0 |
| `RoleGuardModule` | domain | role、user、assignment、row status | can view / can edit / can approve / can export / hidden fields | P0 |
| `WorkflowStatusTable` | UI | `WorkflowStatusModule` view model + role visibility config | Requester / Cost Owner / OM 的 status monitor 表 | P1 |
| `CostDashboardTable` | UI protected | demand cost aggregation view model | Excel-like department / unit cost table | P0 protect, P3 refactor |
| `StationMatrixTable` | UI protected | station matrix view model | Excel-like station detail table | P0 protect, P3 refactor |
| `CarryoverLedgerTable` | UI | carryover ledger events + role config | source line、target line、qty、saving、status、reason | P1 |
| `ItemPickerTable` | UI | catalog / reuse / package rows + demand scope | Add / reuse / import row table | P2 |
| `OMWorkflowTable` | UI | OM row + assignment + role guard | PAS Demand / Quote / Export row workbench | P2 |
| `AdminSetupTable` | UI | setup rows + editable schema | users / roles / mapping / threshold / approval chain | P1 |
| `DetailModal` | UI | row detail view model | full spec、source trace、quote、audit、FTV audit context | P1 |

## 6. 模組化後的角色透明度

同一個 `WorkflowStatusTable` 可以被不同角色共用，但欄位透明度不同：

| 欄位 / 資訊 | Requester | Dept DRI | Budget Approver | Cost Owner | OM Leader / OM Purchasing | Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Project / item / qty / need date | 可看自己的 | 可看審核 scope | 可看審核 scope | 可看 | 可看 OM scope | 可看 |
| Pending owner / current stage / days pending | 可看摘要 | 可看 | 可看 | 可看 | 可看 | 可看 |
| Vendor / supplier | 不顯示 | 通常不顯示，除非 price review detail | 可在 budget detail 看 | 不作主欄 | 可看 | 可看 |
| PAS material no | 不顯示 | 不作主欄 | 不作主欄 | 不作主欄 | 可看/可輸入 | 可看 |
| Factory material no | 不顯示 | 不作主欄 | 不作主欄 | 不作主欄 | 可看 | 可看 |
| OM assignee | 不顯示 | 不顯示 | 不顯示 | 可看摘要但不可操作 | Mai 可改；member 可看自己 | 可看 |
| FTV code / customs audit | 不顯示 | 不作主欄 | 不作主欄 | 不顯示於 Cost Dashboard / Station Matrix | Export Package 可看/處理 | 可設定/稽核 |
| Cost impact | 不作主視角 | 可看審核必要資訊 | 可看 final budget | 主視角 | 可看 export/quote所需 | 可看 |
| Approve / reject | 不可 | 可 | 可 | 不可 | 只可 reject to DRI / workflow action | 不做 business approval |
| Export | 不可 | 不可 | 不可 | 不可 | 可依 assignment/role | 不做 business export |

## 6A. FTV / Cost 分離規則

FTV code 是海關、Trading、Accounting audit 維度，不是 Cost Owner 成本分析維度。

| 視角 | 使用 key | 用途 | 不可做的事 |
| --- | --- | --- | --- |
| 成本分析 | `request_line_id + item_id + demand_department + project + stage + station/unit + qty + price + carryover` | 看不同部門、不同 project/stage/station 對同一品項的成本差異 | 不可用 FTV code 當 group key |
| FTV audit | `item_id/material_id + demand_department + active FTV code + purchase_route` | 外部進口時給海關/Trading/Accounting 報備 | 不可拿來取代成本分攤 |
| Export snapshot | `request_line_id + export_package_code + purchase_route + ftv_code + demand_department` | 鎖住當次出口/報關證據 | 不可因後續 master mapping 更新而改歷史 |

規則：

- `purchase_route = local_buy`：FTV `Not Required`。
- `purchase_route = external_import`：Export Package 前必須有 FTV code。
- IT 品項預設走 `PAS` quote / purchasing。
- 非 IT 品項由 OM 判斷 `PAS / sourcing / OM_direct`。
- 同一 item/spec 但不同 demand department 可以有不同 FTV code，因為海關 audit 需要知道買/用的部門。
- 同一 item/spec + 同一 demand department + external import 必須沿用 active FTV code，直到 EOL。
- Cost Dashboard / Station Matrix 不顯示 FTV code，避免擾亂 P&L 判讀。

## 7. API / DB 對接後的封裝方向

目前 MySQL Phase 1 schema 已有：

- `users`
- `sessions`
- `om_assignments`
- `uat_feedback`
- `audit_events`

workflow rows 仍主要在 prototype 前端資料中。API 化時不要讓 UI 直接碰 DB，也不要把 overloaded `requests` object 整包搬進 MySQL。

建議 API adapter 分層：

| Adapter | 用途 | 第一批 consumer |
| --- | --- | --- |
| `AuthApiClient` | login/logout/me/session role | Login / topbar / role guard |
| `OmAssignmentApiClient` | assignees / assignments / assign / clear | OM assignment controls |
| `FeedbackApiClient` | submit feedback / my feedback / review feedback | OM / Admin |
| `RequestApiClient` | submit / revise / request status | 後續 Requester |
| `WorkflowApiClient` | status model source | Requester / Cost Owner / OM |
| `CostApiClient` | cost dashboard / station matrix source | Cost Owner |
| `AuditApiClient` | audit events | Admin / detail |

前端模組應吃 `view model`，不要直接依賴 raw DB row。這樣未來 MySQL schema 改動時，只改 adapter / mapper。

## 8. 優先封裝順序

### P0：先保護，不重寫

1. **保護三角色 scoped evidence**
   - `Demand Cost Dashboard` / `Station Matrix` 封裝成 Dept DRI、Cost Manager、Budget Approver 共用 evidence module。
   - 加 regression guard，確保 workflow/status/table refactor 不改它們的欄位、數字、密度、drilldown。
   - Cost Manager 僅作 Dept DRI 下一層決策者，不回到獨立全域 analysis workspace。

2. **鎖定 table type contract**
   - 已經 manual managed 的 picker / history table 不能再被 `layout-contract.js` 自動裝飾。
   - Matrix table 不能被 form-table clamp 或 generic wrapper 介入。

### P1：先抽共用狀態與權限

3. **WorkflowStatusModule**
   - Requester `Request Status`
   - Cost Manager `Review History`
   - OM `Submission Dashboard`
   - 三者共用同一 status model，只透過 role visibility config 顯示不同欄位。

4. **RoleGuardModule**
   - 先補 guard 名稱，再移 render function 裡的 role 判斷。
   - 優先補：`canCreateDemand`、`canDeptDriReview`、`canBudgetApprove`、`canViewCostAnalytics`、`canOperateOmRow`、`canAssignOm`、`canMaintainExchangeRate`、`canAdminSetup`。

5. **CarryoverLedgerTable**
   - 目前價值高、範圍明確。
   - 原因欄是 audit text，可 wrap 但不能被一般 note clamp 斷掉。
   - Applied / Pending DRI / Rejected 要保留成本影響語意。

### P2：再抽操作型表格

6. **AdminSetupTable**
   - 風險低，適合先建立 editable table + audit action 的共通模式。
   - 適用 users / roles / requester mapping / threshold / approval chain。

7. **FeedbackTable**
   - UAT utility table，不污染 OM workflow。
   - 可作 workflow table + ledger table hybrid 的模板。

8. **OMWorkflowTable**
   - 先從 PAS Demand No / Export Package 開始，最後才碰 PAS Quote Result。
   - 必須保留 assignment guard，不可讓 OM member 操作未派工 rows。

9. **Requester ItemPickerTable**
   - 價值高但風險也高，因為 modal、manual colgroup、sticky action、row height、source trace 都交織。
   - 重構時一次只抽一種：Catalog -> Reuse Existing Item -> Import Demand Package。

### P3：最後才整理高密度分析表

10. **CostDashboardTable / StationMatrixTable**
    - 只在所有 status/table contract 穩定後整理。
    - 任何改動必須先跑 browser/layout smoke，且對照目前 frozen baseline。

## 9. 後續新增表格的 checklist

新增任何表格前，先回答：

### 9.1 商業 / 權限 checklist

1. 這張表的 business owner 是誰？
2. 哪個角色可以新增、修改、approve、reject、export？
3. 哪個角色只能看？
4. 是否會顯示 requester 不該看的內部資訊，例如 vendor、PAS material no、factory material no、OM assignee？
5. 是否需要 audit event？
6. 狀態是否可由 `buildWorkflowStatus()` 產出？如果不能，是不是代表 status model 缺欄位？
7. 權限是否可由 `RoleGuardModule` 判斷？如果不能，是不是代表 guard 缺能力？

### 9.2 表格 / UI checklist

1. 這張表屬於哪一種 table type？
2. 是否包在 `.table-shell`，避免 page-level overflow？
3. 是否有 explicit `colgroup` 或明確欄位契約？
4. 長文字是 identity、spec、note，還是應該移到 Detail？
5. `td` 本身是否避免直接 clamp？clamp 只應套內層文字 wrapper。
6. 數字是 qty、amount、days pending，是否需要 compact + full title？
7. action 是否短文案且在 `cell-action` / `ActionStack`？
8. destructive action 是否放最後？
9. timeline 是否只顯示 key milestone，完整歷程是否進 Detail？

### 9.3 測試 checklist

1. 是否需要 unit test 驗證 helper / module output？
2. 是否需要 system contract test 驗證欄位、role visibility、禁止文案？
3. 是否需要 layout smoke 驗證 overflow / action overlap / row height？
4. 是否需要 accessibility smoke 驗證 label / contrast / focus？
5. 是否會影響 `Cost Dashboard` 或 `Station Matrix`？如果會，必須先確認 protected baseline 並補 regression guard。

## 10. Do-not-touch 清單

以下區域是目前穩定基準，重構時只能封裝或加 guard，不可順手改邏輯：

- `Cost Owner > Demand Analysis > Cost Dashboard`
  - 不改欄位、數字顯示、unit/phase aggregation、carryover 顯示。
- `Cost Owner > Demand Analysis > Station Matrix`
  - 不加入 dashboard card，不改 Excel-like matrix，不套 generic form-table layout。
- Requester picker manual tables
  - 已有 `data-layout-managed="manual"` 的 table 不可被 layout-contract 自動改 colgroup。
- `history-item-table`
  - Source Project、Item、Spec、Qty / Phase 必須維持分欄；不可再用 nth-child 猜欄。
  - Requester-facing Reuse Item 不顯示 PO No、Factory Material No、PAS Material No；這些只可作內部 trace / Detail 權限資訊。
- Carryover ledger reason
  - 是 audit text，可以換行，但不可被一般 summary clamp 截到失義。
- OM assignment guard
  - OM member 只操作 assigned rows；Mai/Admin 才能 assign / reassign / clear。

## 11. 不在本文件範圍

- 不重新設計 Cost Dashboard / Station Matrix。
- 不更新 IT handoff package。
- 不新增新的 workflow tab。
- 不決定 MySQL workflow schema 的完整拆表；本文只定義前端與權限模組化方向。
