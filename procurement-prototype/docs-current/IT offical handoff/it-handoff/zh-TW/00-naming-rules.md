# 00 命名規則

## 目的

本文件鎖定近期 IT 開發要使用的正式命名。若舊文件或舊 prototype 仍出現過期名稱，以本文件為準。

## 角色命名

| 正式名稱 | 說明 |
| --- | --- |
| `Requester` | 需求提出者。Requester 與 IE 在此 prototype 視為同一角色。 |
| `Manager B` | 審批者，負責 approval、需求進度、數量合理性檢視。 |
| `OM Leader` | OM buy scope 管理者，可維護每月 USD→VND 匯率，也具備 OM 單據操作能力。 |
| `OM Member` | OM buy scope 作業者，可使用匯率與處理 PAS / Quote / Export，不可修改匯率。 |
| `OM Purchasing` | OM Leader + OM Member 的流程總稱。 |
| `Dept DRI` | 部門確認者；負責價格異常第一層確認與正式 carryover review。 |
| `Budget Approver` | 價格升級鏈的最終專案確認者。 |

## Tab 命名

### Requester

| Tab | 用途 |
| --- | --- |
| `Request Workspace` | 建立 item、開啟 Add / Reuse Item popup、輸入 Need Date 與 demand rows、送 Manager B。 |
| `Action Required` | Requester 待辦，例如 quote confirmation、revised request confirmation。 |
| `Request Status` | 高密度追蹤自己的 draft/submitted demand 與 downstream timeline，取代舊的 My Demand Overview / Request Status 拆頁。 |

### Manager B

| Tab | 用途 |
| --- | --- |
| `Approval` | Manager approval 工作區，包含 Pending Approval 與 Approval History。 |
| `Demand Analysis` | 需求分析工作區；內層先看 Cost Dashboard，再下鑽 Station Matrix。 |
| `Progress Tracking` | Pivot-like 看 Budget / PR / PO / Arrived / late / pending。 |
| `Project Setup` | 專案設定入口。 |

#### Demand Analysis Inner Tabs

| Inner Tab | 用途 |
| --- | --- |
| `Cost Dashboard` | 第一層主管視角，按 MFG / Non-MFG 單位切分看品項數、數量、金額。 |
| `Station Matrix` | 第二層 Excel-like 寬表，看 phase x station 數量合理性。 |

### OM Purchasing

| Tab | 用途 |
| --- | --- |
| `Submission Dashboard` | OM stage 與 pending 總覽。 |
| `PAS Demand No` | PAS/Bidding 回傳後輸入 PAS Demand No。 |
| `PAS Quote Result` | 輸入 PAS Material No、quote result、quote validity、附件，送 Requester confirmation。 |
| `Quote Expiry Monitor` | `Submission Dashboard` 內的報價效期監控，不是流程 tab。 |
| `Export Package` | Requester confirmed 後輸出 CFA/ECS package。 |

#### Reuse Item Inner Tabs

| Inner Tab | 用途 |
| --- | --- |
| `Reuse by Item` | 將單一歷史品項加入目前 Requester target project。 |
| `Reuse by Project Package` | 預覽並匯入來源 project/phase/package 的整包歷史品項到目前 Requester target project。 |

## Requester Mapping 規則

Requester 不是由 station 決定，而是由下列 key 對應：

```text
Project Family + Project Code + Demand Department -> Requester
```

範例：

| Project Family | Project Code | Demand Department | Requester |
| --- | --- | --- | --- |
| `G` | `P26` / `P26 Demo Line` | `MFG` | `To Thi Phuong Anh` |
| `Non-G` | `LD8` / `MH2` / `BM2` | `MFG` | `Đặng Thị Ban` |

MFG 的 `Mainline / Packing / Supporting` station 欄位，包含 `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`，只代表需求發生位置與數量矩陣，不可用來推導 requester。

若 mapping 找不到，Admin setup 必須顯示 `Unmapped Project / Need setup`，不可由系統猜測。

## Module ID 命名

格式：

```text
{role}.{moduleName}
```

範例：

| Module ID | 說明 |
| --- | --- |
| `requester.requestWorkspace` | Requester 新需求建立、add/reuse、Need Date 與 submit 工作區。 |
| `requester.demandEditor` | item-level demand rows 編輯器。 |
| `requester.addReuseItem.byItem` | 複用單一歷史 completed item。 |
| `requester.addReuseItem.byProjectPackage` | 複用整包歷史 project/package items。 |
| `manager.approvalQueue` | Manager 審批 queue。 |
| `manager.quantityMatrix` | Manager phase x station 數量矩陣。 |
| `om.pasResultQueue` | OM PAS Demand No 收件 queue。 |
| `om.quoteCompletion` | OM quote completion workbench。 |
| `om.exportPackage` | OM CFA/ECS export workbench。 |

## Table ID 命名

格式：

```text
{moduleId}.table.{tableName}
```

範例：

| Table ID | 說明 |
| --- | --- |
| `requester.requestWorkspace.table.draftItems` | Requester draft items table。 |
| `manager.approvalQueue.table.submittedRows` | Manager submitted approval rows。 |
| `manager.quantityMatrix.table.stationMatrix` | Manager wide station matrix。 |
| `om.quoteCompletion.table.quoteRows` | OM quote completion rows。 |
| `shared.contactPopup.panel.contacts` | 全角色共用右上角 contact popup。 |

## Action 命名

| Action | 使用位置 | 說明 |
| --- | --- | --- |
| `Approve` | Manager B | 通過 submitted row。 |
| `Reject to Requester / Dept DRI` | Manager B / OM | 退回需求端，必填 reason。 |
| `Edit Demand` | Requester | 開啟 item demand editor。 |
| `Submit Package to Manager B` | Requester | 將 selected draft items 以 package 送審。 |
| `Add` | Requester Add / Reuse Item | 將 catalog 或歷史品項複製到目前 target project draft；完整語意放 title/detail，不放在按鈕正文。 |
| `Preview Package` | Requester Reuse by Project Package | 匯入前預覽 source project/phase/package rows。 |
| `Import Package to Request` | Requester Reuse by Project Package | 將預覽 package rows 複製到目前 target project draft。 |
| `Move to PAS Quote Result` | OM PAS Demand No | PAS Demand No 已輸入後進 PAS Quote Result。 |
| `Save Quote Info` | OM PAS Quote Result | 儲存 quote 欄位與 attachment 狀態。 |
| `Send to Requester` | OM PAS Quote Result | quote complete 後送 Requester confirmation。 |
| `Confirm Need` | Requester Action Required | Requester 確認仍需要購買。 |
| `Cancel Request` | Requester Action Required | Requester 取消需求，必填 reason。 |
| `Expense` | OM Export Package | 選擇費用型採購；downstream target 顯示為 ECS，並產 package code。 |
| `Capex` | OM Export Package | 選擇資本型採購；downstream target 顯示為 CFA，並產 package code。 |
| `Export Package` | OM Export Package | 以單一動作準備 final export Excel package + quote PDF package reference。 |
| `Mark Exported` | OM Export Package | 標示已送 CFA/ECS，Buyer 後續接手。 |

## Status 命名

| Status | 意義 |
| --- | --- |
| `Draft` | OPM 尚未送審，可編輯。 |
| `Submitted` | 已送 Manager B，等待審批。 |
| `Approved` | Manager B 已批准。 |
| `Rejected` | Manager B 或 OM 退回 DRI。 |
| `In Progress` | 已進後續流程，例如 OM/PAS/Buyer。 |
| `Waiting PAS Demand No` | OM 等待或輸入 PAS Demand No。 |
| `PAS Quote Result Needed` | OM 需要補 PAS Material No / quote validity / quote / attachments。 |
| `Ready to Send Requester Confirmation` | quote fields 完整，可送 Requester。 |
| `Waiting Requester Confirmation` | 已送 Requester，等待 Confirm Need / Cancel Request。 |
| `Requester Confirmed` | Requester 確認仍需要。 |
| `Ready for CFA` | OM 已準備 CFA package。 |
| `Ready for ECS` | OM 已準備 ECS package。 |
| `Exported to CFA` | 已輸出到 CFA。 |
| `Exported to ECS` | 已輸出到 ECS。 |
| `Buyer Received` | Buyer 已接手。 |

## 欄位命名

| Field | 定義 |
| --- | --- |
| `PAS Demand No` | PAS/Bidding 回傳後，OM 在 `PAS Demand No` 輸入。 |
| `PAS Material No` | 收到 bidding result 後，OM 在 `PAS Quote Result` 輸入，後續一路帶到 Export/Buyer/History。 |
| `Quote Valid Until` | OM 在 `PAS Quote Result` 輸入；送 Requester 前必填。 |
| `Expiry Status` | 由 Quote Valid Until 推算：Valid、14 天內 Expiring Soon、或 Expired / Requote Required。 |
| `Factory Material No` | Buyer/PUR 在 PO 後回填；只有 PO 後才進 Reuse Item history。 |
| `需求單位` | 需求來源單位，例如 ENG1、MFG、TE。 |
| `Station` | 實際站位，例如 CG、BG、FATP、Test。 |
| `Demand Type` | `MFG` 或 `Non-MFG`。`MFG` 必填 Station、不填需求單位；`Non-MFG` 不填 Station、必填需求單位。 |
| `Phase` | P1.0、P1.1、EVT、DVT、PVT、MP。 |
| `Demand Row` | 單筆 `Demand Type + Phase + Station 或 需求單位 + Qty + Remark`。MFG 用 Station；Non-MFG 用需求單位。 |
| `Request Package` | OPM 一次提交的多 item package。 |
| `Source Project` | 歷史/package 來源 filter；永遠不是新需求 target project。 |
| `Source Phase` | 從歷史來源列複製或預覽的 phase。 |
| `Source Package` | 被選來做 package-based reuse 的歷史 package/group。 |
| `Add to` | 目前 Requester target project 與 reused rows 預設 phase。 |
| `Final Export Package Code` | OM 產出的 `{Process}-{Stage}-{ProjectCode}-MVA{YYMM}-{Seq}OM`。 |
| `Need Date` | Requester submit 前必填的需求日期；一路帶到 Manager、OM、Export、timeline 與 detail。 |
| `Currency Display` | 全域顯示切換，支援 `VND / USD`；成本/價格計算以 USD canonical 欄位為準，VND 透過每月匯率做顯示、輸入與 export 換算。 |
| `USD to VND Exchange Rate` | OM Leader 以月份維護的匯率；OM Member 只能使用，不能修改。 |
| `Unit Price USD` | 成本計算的 canonical 單價。Legacy VND 欄位需換算成 USD 後再計算。 |
| `Carryover From / Carryover Qty / Carryover Reason` | line-level 需求調整欄位。Requester 可在 Demand Editor 宣告 carryover；DRI 負責正式 review；Manager/OM 只看影響。 |
| `Price Decision Status` | OM 儲存 quote 後的價格判斷結果：Auto Cleared、Price Escalation Required、Dept DRI Approved、Budget Approver Approved 或 Rejected。 |

## 過期名稱禁止使用

以下名稱不作為近期 IT 開發正式命名：

- `Demand Tracking`
- `PAS Review`
- `Quotation`
- `Package Submission`
- `Review Queue`
- `Project Cost View`
- `Requester Request`

## Implementation Guards

- `Temporary Budget Request` 輸入面板只能出現在 Requester `Request Workspace`，不可注入 Manager B、OM Purchasing、Contact popup 或 Admin-only view。
- `Contact` 是右上角 popup 輔助工具，不是 top-level tab，也不可用後段 DOM patch 動態建立主導覽。
