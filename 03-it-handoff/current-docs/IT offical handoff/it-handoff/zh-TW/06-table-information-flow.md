# 06 表格資訊流

## Requester Tables

### `requester.addItemPopup.table.sources`

| 項目 | 定義 |
| --- | --- |
| Reads | Catalog、purchase records/history、Copy Demand history、Lv123 taxonomy、New Item Request draft。 |
| Writes | 點 `Add` 後建立 worksheet draft row；New Item Request 先建立 pending material master request。 |
| Key Columns | Add、Item、Detail、Spec、Action。 |
| Next Consumer | `requester.requestWorkspace.table.worksheetRows`。 |

Rules:

- Catalog / Reuse / Copy Demand target qty 全部從 0 開始。
- Requester 不看 vendor、supplier、PAS material no、factory material no、OM assignee、FTV。

### `requester.requestWorkspace.table.worksheetRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Draft request rows、stationBreakdown rows、current project / line / MFG-Non-MFG scope。 |
| Writes | qty cells -> long-form `stationBreakdown` / `request_demand_lines`；Need Date；Save Draft；Submit。 |
| Key Columns | Item / Spec、P1.0、P1.1、EVT、DVT、PVT、MP、Row Total、Hint、Action。 |
| Next Consumer | Dept DRI Review、Cost Manager Review、OM Purchasing、Buyer Handoff。 |

Rules:

- Save Draft 不要求 Need Date。
- Submit 要求 active worksheet Need Date 與至少一個 qty > 0。
- Totals 是 derived values，不作 canonical storage。

## Review Tables

### `deptDri.deptReview.table.queue`

| 項目 | 定義 |
| --- | --- |
| Reads | Submitted request packages、request items、long-form quantity rows、warehouse/carryover candidates、price exceptions。 |
| Writes | Dept DRI approve/reject、reason、audit event、quantity direct edit。 |
| Key Columns | Review Status、Project、Requester、Item / Spec、Qty、Need Date、Exception / Evidence、Action、Detail。 |
| Next Consumer | Cost Manager Review、Budget Approver Review、Requester Action Required、warehouse/carryover ledgers。 |

### `costManager.costReview.table.queue`

| 項目 | 定義 |
| --- | --- |
| Reads | Dept DRI approved submissions、quantity evidence、pricing/cost evidence、locked/applied warehouse/carryover ledger。 |
| Writes | Cost Manager authorize/reject、reason、audit event、quantity direct edit。 |
| Key Columns | Review Status、Project、Requester、Item / Spec、Total Qty、Cost Evidence、Action、Detail。 |
| Next Consumer | OM Leader intake / assignment、Requester Action Required、Review History。 |

### `budgetApprover.budgetReview.table.queue`

| 項目 | 定義 |
| --- | --- |
| Reads | Dept DRI approved price exceptions、quote/history delta、Temporary Budget evidence、quantity evidence。 |
| Writes | Budget Approver final approve/reject、reason、audit event、quantity direct edit。 |
| Key Columns | Review Status、Project、Item / Spec、Quote USD、History USD、Delta USD、Reason、Action、Detail。 |
| Next Consumer | OM Export Package、Requester Action Required。 |

### Shared evidence tables

| Table | Reads | Writes | Rule |
| --- | --- | --- | --- |
| `shared.approvalQuantityReview.table.dashboard` | active demand rows、price helpers、locked/applied ledger | none | 第一欄固定 `Review Status`。 |
| `shared.approvalQuantityReview.table.mfgStationDetail` | selected item / dashboard cell scope | optional audited direct edit through popup | 保持 station detail。 |
| `shared.approvalQuantityReview.table.nonMfgDepartmentDetail` | selected item / dashboard cell scope | optional audited direct edit through popup | 保持 department detail。 |
| `shared.itemQuantityReview.popup` | formal long-form qty rows | add/edit/delete qty + audit | Direct edit 不是 temporary override。 |

## OM Tables

### `om.submissionDashboard.table.stageRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Cost Manager authorized rows、OM assignments、quote status、export status。 |
| Writes | Assignment only when actor is OM Leader / Admin；otherwise read-only。 |
| Key Columns | Project、Item、Qty、Received Date、Current Stage、Days in Stage、Pending Owner、Quote Expiry、Next Action、Detail。 |
| Next Consumer | PAS Demand No、PAS Quote Result、Export Package。 |

### `om.pasDemandNo.table.pasRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Assigned OM rows waiting PAS Demand No。 |
| Writes | PAS Demand No、audit event。 |
| Key Columns | Project、Item / Spec、Qty、PAS Demand No、PAS Result Status、Next Step、Detail。 |
| Next Consumer | PAS Quote Result。 |

### `om.pasQuoteResult.table.quoteRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Rows with PAS Demand No、assigned OM scope、history price、exchange rate。 |
| Writes | PAS Material No、vendor、vendor number、quote price、quote date、quote valid until、screenshot/image attachment、Excel attachment、price decision。 |
| Key Columns | Project、Item / Qty、PAS Tracking、Quote Result、Completion Status、Actions、Detail。 |
| Next Consumer | Auto Cleared -> OM Export Package；Price Exception -> Dept DRI -> Budget Approver。 |

### `om.exportPackage.table.exportRows`

| 項目 | 定義 |
| --- | --- |
| Reads | Auto Cleared rows、Budget Approver approved rows、quote evidence、effective qty、purchase_route、active FTV mapping、materialCodingReviewStatus。 |
| Writes | cost type、target CFA/ECS、package code、export status、export timestamp、FTV export snapshot、audit event。 |
| Key Columns | Project、Item、Qty、Package Code、PAS Context、Quote Attachments、Cost Type / Target、Export Status、Actions、Detail。 |
| Next Consumer | Buyer Handoff。 |

Rules:

- `purchase_route = local_buy` 時顯示 `FTV Not Required`，不可要求 FTV 才能 export。
- `purchase_route = external_import` 時，export 前必須存在 active FTV mapping。
- Missing FTV mapping 必須阻擋 `Export Package`，並進 OM/Admin mapping repair。
- `materialCodingReviewStatus = Need material coding review` 時不得 export；需先完成 PK / Factory Material No prefix review。

## Material Identity / FTV / PK Tables

### `materialIdentity.table.identityMap`

| 項目 | 定義 |
| --- | --- |
| Reads | `item_master`、`material_identity`、SAP PO Raw Data A/H/K/BL/BM/BN、Lv123 taxonomy、factory prefix mapping。 |
| Writes | Factory Material No mapping、SAP Material No reference、PK prefix/category mapping、`materialCodingReviewStatus`、audit event。 |
| Key Columns | Item / Spec、Factory Material No、SAP Material No、PK Prefix、Lv1 / Lv2 / Lv3、Review Status、Actions。 |
| Next Consumer | OM Export Package、customs audit、Buyer Handoff evidence。 |

Rules:

- Raw Data A 欄 `料號` 是 Factory Material No；H 欄 `料號` 是 SAP Material No；K 欄是 FTV Code；BL/BM/BN 是 Lv1/Lv2/Lv3。
- PK 料號是 Factory Material No prefix/category coding 規則，不是 Packaging 類料號。
- Importer 只能 validate / map / audit 既有 Raw Data / PO row 的 Factory Material No，不可靜默重寫。
- 無法判斷 prefix 時寫入 `Need material coding review`，不得自動猜碼。
- `資訊類` yellow OM rows 既有 `IT...` prefix mapping 保留為 supplemental rule；新增 PK prefix 規則需同級文件化。

### `ftvCode.table.mapping`

| 項目 | 定義 |
| --- | --- |
| Reads | item/spec、demand department、purchase_route、Factory Material No、active/inactive FTV mapping。 |
| Writes | active FTV mapping、mapping repair reason、FTV audit snapshot、audit event。 |
| Key Columns | Item / Spec、Demand Department、Purchase Route、FTV Code、Status、Effective From、Actions。 |
| Next Consumer | OM Export Package、customs / Trading / Accounting audit。 |

Rules:

- FTV 是 customs / Trading / Accounting audit 維度，不是 Cost Dashboard / Station Matrix group key。
- Requester 不可看 FTV。
- 同 item/spec + same demand department + `external_import` 應沿用 active FTV mapping；不同 demand department 可有不同 FTV 以支援 audit。

## Buyer Handoff Tables

| Table | Reads | Writes | Rule |
| --- | --- | --- | --- |
| `buyerHandoff.status.table.packages` | exported packages、quote/export metadata、buyer events | future PR/PO/arrival events | Starts only after OM mark exported。 |

## Cross-Table Rules

- `Detail` 不寫主流程狀態。
- `Contact DRI` 不寫主流程狀態。
- Requester visibility 必須在 API/query 層過濾，不可只靠 frontend hidden。
- Every workflow mutation must write an audit event.
- Reject must preserve reason、actor、timestamp、previous stage、next owner。
- Quote expiry warning threshold = 10 days。
- Price exception threshold = `quoteUnitPriceUsd - historyUnitPriceUsd > 0.40`。
- No history price、新品項、Temporary Budget 一律進 Dept DRI -> Budget Approver。
- Warehouse pending candidate 不扣成本；locked use 才影響 effective cost。
- Buyer Handoff 是正式 post-export label；使用者介面不可用舊版 post-export 文案作主稱呼。
- Attachment production storage/security 由 IT 實作；handoff 先鎖定 metadata、`visibilityScope` 與 role download guard。
- `stageStartAt`、`daysPending`、quote expiry 與 Buyer Handoff days 由 server 使用同一 timezone 計算；預設 calendar-day 口徑，若改 business-day 必須文件化 holiday calendar。
- Admin impersonation 若保留必須 audit，不可作 business approval override。
- Buyer Handoff 的 PR/PO/arrival 是 post-export future events，不回寫 OM Export Package 主狀態。
