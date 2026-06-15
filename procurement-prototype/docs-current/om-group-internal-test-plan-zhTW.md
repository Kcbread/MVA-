# OM Group 內測方案

## 目的

讓 OM group 可以在同一區網路內測採購 prototype，並清楚驗證：

- 不同角色登入與權限隔離。
- OM flow 從 Manager approve 到 PAS / Quote / Export 的狀態轉移。
- 測試資料是否能留存、追蹤、回溯。
- 同一區網路多人操作時，不會因瀏覽器 session 或資料來源混用而誤判。

## 建議結論

### 最適合內測的做法

使用一台內網測試主機部署 prototype，OM group 成員用同一個 URL 連入，但每個測試者使用自己的瀏覽器 profile 登入指定角色。

目前 prototype 是前端 demo 型態，主要流程資料存在執行中的頁面記憶體，部分輔助資料存在瀏覽器 localStorage。這代表：

- 同一個瀏覽器 profile 內切換角色，適合做單人完整流程驗證。
- 多人同時用不同電腦或不同 browser profile，適合做角色權限與操作體驗驗證。
- 如果要多人共同修改同一份資料並長期留存，需要加一個集中式資料層。本 POC 已決定先使用 MySQL，原則是最小內測成本、不引入額外雲端或託管費用。

## 內測環境設計

| 項目 | 建議 |
| --- | --- |
| URL | 由一台內網主機提供，例如 `http://內網IP:8080`。 |
| 網路 | OM group 使用同一區網路即可，不需要外網。 |
| 瀏覽器 | Chrome 或 Edge。 |
| 角色隔離 | 每個角色使用不同 browser profile，或不同電腦。 |
| 測試資料 | 建議每輪測試使用固定 project / phase / item 編號前綴。 |
| 留存方式 | 短期用截圖 + 匯出檔 + 缺陷表；正式共用留存需加後端資料庫。 |

## 角色登入配置

內測至少準備以下角色：

| 角色 | 測試者 | 用途 |
| --- | --- | --- |
| Requester | 1 人 | 建立需求、送審、確認 OM quote、cancel / amendment。 |
| Cost Manager | 1 人 | 成本授權、退回 requester、確認 authorized row 進 OM queue。 |
| OM Leader | 1 人 | 維護匯率、操作 PAS / Quote / Export，驗證 Leader 權限。 |
| OM Purchasing | 1-2 人 | 操作 PAS / Quote / Export，驗證不能修改匯率。 |
| Dept DRI | 1 人 | 驗證 price escalation first review。 |
| Budget Approver | 1 人 | 驗證超價或無 history price 的 final approval。 |

### Browser Profile 建議

同一台電腦要測多角色時，請建立不同 Chrome profile：

- `UAT - Requester`
- `UAT - Cost Manager`
- `UAT - OM Leader`
- `UAT - OM Purchasing`
- `UAT - Dept DRI`
- `UAT - Budget Approver`

不要用同一個 tab 反覆切換角色來代表多人同時操作。這樣可以跑完整流程，但不能證明不同使用者 session 隔離。

## 資料留存策略

### 方案 A：短期內測，不加後端

適合第一輪 OM group 快速內測。

留存方式：

- 每個測試 case 完成後截圖。
- 匯出 Excel / PDF package 時保留檔案。
- 用缺陷表記錄：測試案例 ID、角色、project、row/item、預期、實際、截圖檔名。
- 每輪測試前約定 project code，例如 `OM-UAT-0604-A`，避免和 demo seed data 混在一起。

風險：

- 不同測試者的資料不是同一份 shared DB。
- 重新整理或換瀏覽器可能無法保留全部流程資料。
- 適合驗證流程、畫面、欄位、權限，不適合作為正式資料留存驗證。

### 方案 B：正式內測，加集中式資料層

適合要驗證多人共同操作、資料持久化、audit trail。

需要新增：

- Login session 或測試用帳號。
- MySQL shared database。
- Request / OM quote / history / attachment metadata tables。
- 每個 action 寫入 timeline event。
- 測試資料 reset / export 工具。

這個方案才能可靠驗證：

- Requester 建立的資料，Dept DRI / Cost Manager 與 OM 在不同電腦可同步看到。
- OM Purchasing 儲存 quote 後，OM Leader、Requester、Dept DRI 可看到同一筆更新。
- refresh、重新登入、隔天再進來，資料仍存在。
- 每個狀態由誰、何時、做了什麼改動都有紀錄。

## OM Flow 驗證主線

第一輪內測建議跑 6 條主線。

| 流程 | 角色順序 | 驗證重點 |
| --- | --- | --- |
| 基本送審到 OM | Requester -> Dept DRI -> Cost Manager -> OM | Cost Manager authorize 後 OM scope row 進 `PAS Demand No`。 |
| PAS Demand No | OM Purchasing / OM Leader | 未填 PAS Demand No 不可移到 quote；填寫後可進 `PAS Quote Result`。 |
| Quote Result 完整性 | OM Purchasing | PAS Material No、Vendor、Vendor Part No、Unit Price、Quote Date、Valid Until、screenshot/image、Excel 必填。 |
| 匯率權限 | OM Leader vs OM Purchasing | Leader 可改 USD to VND rate；OM Purchasing 只能查看與使用。 |
| 價格審核 | OM -> Dept DRI -> Budget Approver | 超過 history threshold 或無 history price 時進 price escalation。 |
| Export Package | OM | Auto Cleared 或核准後才可進 Export；Expense / Capex 分流到 ECS / CFA。 |

## 必測案例

以現有 UAT 文件為主，OM group 內測至少要跑：

- `UAT-018` Manager approved OM scope row 進 OM flow。
- `UAT-019` PAS status / comment 可保存並在 detail / history 可見。
- `UAT-020` OM demand row 可移到 Quotation。
- `UAT-021` Quote PDF upload 狀態與檔名可見。
- `UAT-022` Vendor / price / date 儲存後更新 activity history。
- `UAT-022A` Vendor Part No. 是 vendor mapping，不改 Material No。
- `UAT-022B` Pending material quote success 不立即建立正式 Material No。
- `UAT-022C` PR Created / PO Issued 後才建立或 reuse Material No。
- `UAT-023` Export OM Excel 不混入其他 project rows。
- `UAT-024` Quote PDF package 可產出。
- `UAT-024A` Reject OM package to DRI 必填 reason 且保留 timeline。

## 同網路注意事項

同一區網路沒有問題，但要先決定是哪一種測試：

| 測試目標 | 做法 |
| --- | --- |
| 單人流程驗證 | 一台電腦、一個瀏覽器、依序切換角色即可。 |
| 多角色權限驗證 | 同一台電腦用多個 browser profile，或多台電腦各登入一個角色。 |
| 多人共用資料驗證 | 必須加 shared DB，否則不能當作通過。 |
| 資料留存驗證 | 必須加 shared DB 或至少加 local export / import snapshot。 |

## 內測前 Checklist

- 內網主機可以被 OM group 電腦連到。
- 所有人使用同一個測試 URL。
- 每位測試者知道自己負責的角色。
- 每個角色使用獨立 browser profile。
- 測試 project code / phase / item prefix 已約定。
- 缺陷表、截圖資料夾、匯出檔資料夾已準備。
- 每輪測試前先跑 `./test.sh`，確認 prototype 基礎測試通過。

## 缺陷回報格式

| 欄位 | 範例 |
| --- | --- |
| Case ID | UAT-022 |
| 角色 | OM Member |
| Project / Item | OM-UAT-0604-A / Network switch |
| 操作步驟 | 填 vendor、price、quote date 後 Save Quote Info |
| 預期結果 | 欄位保存，activity history 新增事件 |
| 實際結果 | 儲存後重新進 detail 看不到 vendor |
| 嚴重度 | High |
| 截圖 / 檔案 | UAT-022-om-member-save-quote.png |
| 備註 | 同 profile refresh 後重現 |

## 建議執行順序

1. 第一輪：用方案 A 先跑 OM group 快速內測，目標是找到流程、欄位、權限與畫面問題。
2. 第二輪：根據第一輪問題決定是否補 shared DB / session / audit trail。
3. 第三輪：用方案 B 驗證多人共同資料、留存、refresh、重新登入、timeline。

## 判定標準

OM group 內測可以算通過，至少要滿足：

- OM Leader / OM Member 權限差異明確。
- Manager approve 後資料能進 OM queue。
- PAS Demand No、Quote Result、Quote Validity、PDF / Excel 狀態可追蹤。
- Reject / Cancel / Price Escalation 都要求 reason 並留 timeline。
- Export Package 不混 project。
- 內測者能指出每個 row 目前 owner、current stage、next action。
- 若聲稱資料留存，必須在重新整理、重新登入、不同測試者查看後仍成立。
