# 01 模組目錄

## 模組定義格式

每個模組必須能從頁面獨立接入，因此用固定格式描述：

| 欄位 | 說明 |
| --- | --- |
| Module ID | 穩定識別碼。 |
| Business Owner | 使用角色。 |
| Purpose | 解決的工作或決策。 |
| Input Data | 讀取資料。 |
| Output / Mutation | 寫入資料、狀態或 history event。 |
| Visible Columns | 主表欄位。 |
| Filters | 可操作篩選。 |
| Actions | 可操作按鈕與成功結果。 |
| Downstream Consumers | 下游消費模組。 |
| Empty / Error State | 無資料或錯誤狀態。 |
| DFD Notes | 視覺化建議。 |

## Requester Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `requester.requestWorkspace` | Request Workspace | 建立需求 item、add/reuse item、輸入 Need Date，並提交 package。 |
| `requester.demandEditor` | Demand Editor | 在單一 item 內輸入多筆 demand rows。 |
| `requester.addReuseItem` | Add / Reuse Item Picker | 在 Request Workspace 內搜尋 catalog、建立新品項，或 reuse historical items。 |
| `requester.addReuseItem.byItem` | Reuse by Item | 將單一歷史品項複製到目前 Requester target project / default phase。 |
| `requester.addReuseItem.byProjectPackage` | Reuse by Project Package | 預覽/匯入來源 project/package 到目前 draft items，並套用 target phase override。 |
| `requester.actionRequired` | Action Required | 處理 quote confirmation 與 revised request confirmation。 |
| `requester.requestStatus` | Request Status | 追蹤提交後狀態、timeline、reason。 |

## Manager B Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `manager.approval` | Approval | Pending Approval + Approval History 合併工作區。 |
| `manager.demandAnalysis` | Demand Analysis | Manager 需求分析工作區，內含 Cost Dashboard 與 Station Matrix。 |
| `manager.costDashboard` | Cost Dashboard | 第一層參考 Excel Dashboard 的 item x phase x unit 數量/金額 dashboard。 |
| `manager.stationMatrix` | Station Matrix | 第二層 Excel-like phase x station 數量合理性寬表。 |
| `manager.progressTracking` | Progress Tracking | 用 pivot-like 方式看採購進度與交期風險。 |
| `manager.projectSetup` | Project Setup | 維護 project access 與基礎設定。 |
| `shared.contactDri` | Contact DRI | 查 requester / department DRI / project contact。 |

## OM Purchasing Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `om.submissionDashboard` | Submission Dashboard | OM stage/pending dashboard。 |
| `om.pasDemandNo` | PAS Demand No | 輸入 PAS Demand No 並移到 PAS Quote Result。 |
| `om.pasQuoteResult` | PAS Quote Result | 補 PAS Material No、quote result、quote validity、附件，送 Requester。 |
| `om.quoteExpiryMonitor` | Quote Expiry Monitor | Submission Dashboard 內的報價時效與重新詢價提醒。 |
| `om.exportPackage` | Export Package | 產生 CFA/ECS package 並 mark exported。 |
| `om.detail` | OM Detail | 看 PAS tracking、quote、previous reference、timeline。 |

## Shared Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `shared.itemDetail` | Item Detail | 查看 request/item/spec/raw row/timeline。 |
| `shared.contactPopup` | Contact Popup | 全角色共用的右上角聯絡人查詢與複製工具。 |
| `shared.contactDri` | Contact DRI | 單筆 requester / department DRI / project contact lookup。 |
| `shared.timeline` | Timeline | 顯示跨角色 action/event/timestamp。 |
| `shared.toast` | Toast | 成功、阻擋、錯誤提示。 |
| `shared.confirmDialog` | Confirm Dialog | 高風險操作確認。 |

## 接入原則

- 模組不應依賴特定頁面位置。
- 模組可被 tab、modal、dashboard 或外部系統入口呼叫。
- 模組輸入應以 request rows、imported raw rows、master data 為主，不直接依賴 DOM。
- action 成功後必須寫入狀態與 timeline，不能只改畫面。
- `Detail` 只查資料，不承擔 approve 或 quote send 等主流程 action。
