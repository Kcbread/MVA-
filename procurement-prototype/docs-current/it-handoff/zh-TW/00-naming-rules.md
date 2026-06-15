# 00 命名規則

## 目的

本文件鎖定近期 IT 開發要使用的正式命名。若舊文件、舊 prototype 或 zip snapshot 仍出現過期名稱，以本文件與 `IT_DELIVERY_LATEST_REVIEW_20260615.md` 為準。

## 角色命名

| 正式名稱 | 說明 |
| --- | --- |
| `Requester` | 需求提出者；建立 worksheet demand、送審、追蹤狀態。 |
| `Dept DRI` | 第一層 scoped business reviewer；審 requester submission、unit-owned warehouse/carryover、price exception 第一層。 |
| `Cost Manager` | Dept DRI 後的成本授權者；使用 Cost Review 做 final authorization。 |
| `OM Leader` | OM 作業主管；負責 assignment、exchange rate、feedback triage、OM tracking。 |
| `OM Purchasing` | OM 作業者；處理 assigned rows 的 PAS Demand No、PAS Quote Result、Export Package。 |
| `Budget Approver` | quote 後 price/budget exception 的 final approver。 |
| `Admin` | 系統設定與治理；不做 business approval。 |
| `Buyer Handoff` | OM export 後 PR / PO 責任交接階段；不使用舊版 post-export 文案作為使用者主文案。 |

## Tab 命名

### Requester

| Tab | 用途 |
| --- | --- |
| `Request Workspace` | 建立 item/spec、輸入 all-phase worksheet qty、Save Draft、Submit。 |
| `Action Required` | reject / revise / confirmation 類 requester 待辦。 |
| `Request Status` | 追蹤自己的 draft/submitted demand、pending owner、timeline。 |

### Dept DRI

| Tab | 用途 |
| --- | --- |
| `Dept Review` | Submission / stock / carryover / price exception review，內嵌 dashboard-first quantity evidence。 |
| `Review History` | Dept DRI 已處理事件與 audit history。 |

### Cost Manager

| Tab | 用途 |
| --- | --- |
| `Cost Review` | Final authorization queue，內嵌 Demand Cost Dashboard 與 Station Matrix evidence。 |
| `Review History` | Cost Manager decision history。 |

### OM

| Tab | 用途 |
| --- | --- |
| `OM Submission Dashboard` | OM stage、pending owner、assignment、quote expiry 總覽。 |
| `PAS Demand No` | 輸入 PAS Demand No。 |
| `PAS Quote Result` | 輸入 PAS Material No、vendor、quote price、quote screenshot/image、quote Excel、valid until。 |
| `Export Package` | Auto Cleared 或 Budget Approver approved 後 export。 |

### Budget Approver

| Tab | 用途 |
| --- | --- |
| `Budget Review` | Price / budget exception final approval，內嵌 quantity evidence。 |
| `Review History` | Budget approval history。 |

## Module ID 命名

| Module ID | 說明 |
| --- | --- |
| `requester.requestWorkspace` | Requester worksheet demand creation。 |
| `requester.addItemPopup` | Catalog / Reuse / Copy Demand / New Item Request 新增入口。 |
| `shared.workflowStatus` | 共用 pending owner / current stage / days pending model。 |
| `shared.approvalQuantityReview` | Dept DRI / Cost Manager / Budget Approver 共用 quantity evidence。 |
| `deptDri.deptReview` | Dept DRI review shell。 |
| `costManager.costReview` | Cost Manager final authorization shell。 |
| `budgetApprover.budgetReview` | Budget exception final review shell。 |
| `om.submissionDashboard` | OM work tracking。 |
| `om.pasDemandNo` | PAS Demand No input。 |
| `om.pasQuoteResult` | Quote result and price decision input。 |
| `om.exportPackage` | Export package workflow。 |
| `buyerHandoff.status` | Post-export Buyer Handoff status。 |

## Action 命名

| Action | 使用位置 | 說明 |
| --- | --- | --- |
| `Save Draft` | Requester | 暫存目前 worksheet；不要求 Need Date。 |
| `Submit` | Requester | 送出目前 line + MFG/Non-MFG worksheet；要求 Need Date 與至少一個 qty > 0。 |
| `Approve` | Dept DRI / Budget Approver | 通過目前 review stage。 |
| `Authorize` | Cost Manager | Final cost authorization。 |
| `Reject` | Review roles / OM | 必填 reason，回指定 next owner。 |
| `Save PAS Demand No` | OM Purchasing | 儲存 PAS Demand No。 |
| `Save Quote Info` | OM Purchasing | 儲存 quote result、attachments、validity，觸發 price decision。 |
| `Export Package` | OM Purchasing | 建立 export package。 |
| `Mark Exported` | OM Purchasing | 進 Buyer Handoff。 |
| `Repair FTV Mapping` | OM / Admin | 修補 external import export 前缺少的 active FTV mapping。 |
| `Review Material Coding` | OM / Admin | 修補 PK / Factory Material No prefix/category mapping；不可自動猜碼。 |

## Status 命名

| Status | 意義 |
| --- | --- |
| `Draft` | Requester 尚未送審。 |
| `Dept DRI Review` | 等 Dept DRI submission review。 |
| `Cost Manager Review` | 等 Cost Manager final authorization。 |
| `OM Intake / Assignment` | 等 OM Leader assign / auto-assign。 |
| `PAS Demand No` | 等 OM Purchasing 輸入 PAS Demand No。 |
| `PAS Quote Result` | 等 OM Purchasing 輸入 quote result。 |
| `Auto Cleared` | 價差在 0.40 USD 內，可進 export。 |
| `Price Exception Review` | 等 Dept DRI -> Budget Approver。 |
| `OM Export Package` | 等 OM export。 |
| `Buyer Handoff` | OM export 後 Buyer owns PR / PO。 |
| `Requester Action Required` | Reject 或修正回 Requester。 |
| `FTV Not Required` | `purchase_route = local_buy`，不需要 FTV 才能 export。 |
| `Need material coding review` | 無法判斷 Factory Material No / PK prefix mapping，需 OM/Admin review。 |

## 欄位命名

| Field | 定義 |
| --- | --- |
| `Need Date` | Requester submit 前必填；Save Draft 不要求。 |
| `Request Action` | Requester intent metadata：New Buy / Other。 |
| `Station Breakdown` | long-form qty rows；MFG 用 station，Non-MFG 用 demand unit。 |
| `Review Status` | 審批鏈狀態欄，放在 review evidence tables 第一欄。 |
| `PAS Demand No` | OM 在 PAS Demand No stage 輸入。 |
| `PAS Material No` | OM 在 PAS Quote Result stage 輸入。 |
| `Quote Valid Until` | quote expiry 來源；10 天內顯示 expiring soon。 |
| `Quote screenshot/image` | quote evidence；第一版以 screenshot/image plus Excel 作為主要 evidence model。 |
| `Quote Excel` | quote evidence；與 screenshot/image 並列必備。 |
| `Price Decision Status` | Auto Cleared / Price Exception Required / Dept DRI Approved / Budget Approver Approved / Rejected。 |
| `Factory Material No` | SAP PO Raw Data A 欄；不同於 SAP Material No。 |
| `SAP Material No` | SAP PO Raw Data H 欄；不得和 Factory Material No 合併。 |
| `PAS Material No` | OM/PAS quote/order context；不得和 Factory Material No 或 SAP Material No 混用。 |
| `PK Material No` / `PK 料號` | Factory Material No 的 prefix/category coding 規則；不是 Packaging 類料號。 |
| `FTV Code` | SAP PO Raw Data K 欄；海關 / Trading / Accounting audit 維度，不是成本或 Station Matrix group key。 |
| `purchase_route` | `local_buy` / `external_import`；決定是否需要 FTV mapping 才能 export。 |
| `materialCodingReviewStatus` | `Valid` / `Need material coding review` / `Rejected mapping` / `Approved mapping`。 |
| `visibilityScope` | attachment 可見範圍：Requester-safe / OM-internal / Admin。 |
| `stageStartAt` | current stage 開始時間；由 server 寫入。 |
| `daysPending` | 由 server 依同一 timezone 計算，不由 frontend 自行判斷。 |

## Material Identity / FTV / PK 命名規則

- `item_master` 是 requester-safe item/spec identity，不是 PAS、Factory、SAP 或 FTV identity。
- `Factory Material No` 以 Raw Data A 欄 `料號` 為欄位真相，可承載 PK prefix/category coding。
- `SAP Material No` 以 Raw Data H 欄 `料號` 為欄位真相，不可當 Factory Material No fallback。
- `FTV Code` 以 Raw Data K 欄為欄位真相；只作 customs / Trading / Accounting audit 與 export gate。
- Raw Data BL/BM/BN 是 Lv1/Lv2/Lv3 category coding source，可用於 PK prefix 規則。
- `資訊類` yellow OM rows 既有 `IT...` prefix mapping 保留為 supplemental rule；新增 PK prefix 規則必須同樣文件化。
- `purchase_route = external_import` 且沒有 active FTV mapping 時，`Export Package` 必須阻擋並進 OM/Admin mapping repair。
