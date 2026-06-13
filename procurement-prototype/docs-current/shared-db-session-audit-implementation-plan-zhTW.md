# Shared DB / Session / Audit Trail 實作方案

## 目標

讓 OM group 內測可以從單機前端 demo，升級成多人可同時登入、共用資料、可回溯流程事件的 UAT 系統。

本方案優先支援內測，不一次追正式企業級 SSO / 檔案系統 / 權限平台。

## 建議技術路線

### 已拍板大原則

內測 POC 先使用 MySQL 作為 shared DB。原因是這次只需要最小可行 POC，不希望因為額外雲端服務、Supabase、PostgreSQL hosting 或二次遷移產生額外花費。

因此本文件後續以 MySQL 為第一版資料庫，不再以 SQLite 作為優先 MVP。

### MVP 架構

```text
Browser
  |
  | HTTP / JSON API
  v
Node.js Server
  |
  | MySQL connection pool / transaction
  v
MySQL
```

內測 MVP 建議直接用 MySQL，原因：

- 符合目前「最小 POC、不要額外花費」的大原則。
- 可以部署在同一台內網測試主機或既有 MySQL 環境。
- 從第一天就驗證多人共用資料、session、audit trail，不需要 SQLite 到 MySQL 的二次遷移。

若公司 IT 後續要求正式 DB 標準不同，正式化階段再評估遷移；OM group 內測 POC 先不引入額外 DB 成本。

## Scope 分級

### Phase 1：OM UAT MVP

支援：

- 測試帳號登入與 session。
- 多角色從同一 URL 登入。
- Request / approval / OM PAS / OM quote / price review / export 的 shared data。
- 核心 action 寫 audit trail。
- UAT reset / export audit log。

不支援：

- 正式 SSO。
- 正式附件檔案儲存。
- 所有欄位 keystroke 級 audit。
- 複雜 row locking。

### Phase 2：穩定化

支援：

- 附件 metadata + server/NAS/SharePoint storage。
- optimistic locking，避免多人覆蓋同一筆資料。
- 更完整的 permission tests。
- DB migration scripts。
- UAT data import / export snapshot。

### Phase 3：正式化

支援：

- SSO / AD / company IAM。
- 正式權限群組。
- 正式檔案儲存與掃毒。
- 部署監控、備份、資安審查。

## 最小資料表

### test_accounts / users

內測建議使用具名測試帳號，不要共用同一個 OM 帳號。這樣 audit trail 才能看出是哪一位測試者操作。

### users

| 欄位 | 說明 |
| --- | --- |
| id | user id |
| email | 登入 email |
| display_name | 顯示名稱 |
| role | requester / manager / omLeader / omMember / dri / projectDri / admin |
| department | 部門 |
| active | 是否啟用 |

### sessions

| 欄位 | 說明 |
| --- | --- |
| id | session id |
| user_id | users.id |
| token_hash | session token hash |
| role | 登入時的 role snapshot |
| ip_address | 內測來源 IP |
| user_agent | 瀏覽器資訊 |
| created_at | 建立時間 |
| expires_at | 到期時間 |
| last_seen_at | 最後使用時間 |
| revoked_at | logout 或 admin revoke |

### requests

保留目前 request row 的核心欄位。

| 欄位 | 說明 |
| --- | --- |
| id | request id |
| project | project code |
| phase | phase |
| requester_id | 建立人 |
| item | item |
| spec | spec |
| qty fields | p10 / p11 / evt / dvt / pvt / mp 等 |
| status | canonical workflow status |
| current_owner_role | 目前負責角色 |
| current_stage | 顯示用 stage |
| created_at / updated_at | 時間 |
| version | optimistic locking |

### om_quotes

| 欄位 | 說明 |
| --- | --- |
| request_id | 對應 request |
| pas_demand_no | PAS Demand No |
| pas_material_no | PAS Material No |
| vendor | vendor |
| vendor_part_no | vendor mapping |
| unit_price_usd | canonical USD |
| unit_price_vnd | VND display/input |
| quote_date | quote date |
| quote_received_at | quote received date |
| quote_valid_until | valid until |
| quote_pdf_name | PDF metadata |
| quote_excel_name | Excel metadata |
| quote_status | quote status |

### item_master

品項身份主檔，用來避免不同部門購買同一品項時重複建 item。

| 欄位 | 說明 |
| --- | --- |
| id | item id |
| normalized_item_key | item/spec 正規化 key |
| eng_name / cn_eng_name / vn_name | 品名 |
| spec | 規格 |
| category | 品類 |
| status | active / inactive |

### material_identity

內部料號身份層，承接 HFCOM、PAS Material No、Factory Material No、SAP Material No、legacy mapping reference。

| 欄位 | 說明 |
| --- | --- |
| id | material id |
| item_id | item_master.id |
| material_no | HFCOM / PAS / factory / SAP / legacy material no |
| material_no_type | HFCOM / pas_material_no / factory_material_no / sap_material_no / legacy_mapping |
| status | active / inactive |

### sap_po_import_batches / sap_po_raw_lines

SAP / PO raw mirror 層保留 `Source DB regularize_0608_renumbered.xlsx` 的 `Raw Data` A-BN 欄序，供未來 SAP DB 對接與 PO history 對帳使用。核心 workflow 不直接依賴全部 raw 欄位。

規則：

- Raw Data A 欄 `料號` = `factory_material_no` / Factory Material No。
- Raw Data H 欄 `料號` = `sap_material_no` / SAP Material No。
- Raw Data K 欄 `FTV Code` 只進 FTV / customs audit mapping，不是 material identity。
- Raw Data Q 欄 `正規化` 是 item matching / item master key 候選。
- Raw Data BL / BM / BN 是 Lv1 / Lv2 / Lv3 category 與未來 `AABBB00001` 編碼來源。
- PO 尚未對接前，raw/export 欄位可先保留表頭與空值；不能反向要求 requester、draft、approval 階段填 PO-only 欄位。

### purchase_route_decisions

OM 確認採購路由。Requester 不決定 local buy / external import。

| 欄位 | 說明 |
| --- | --- |
| request_line_id | request line id |
| item_id / material_id | 品項與料號身份 |
| route_type | local_buy / external_import |
| quote_owner | PAS / sourcing / OM_direct |
| confirmed_by / confirmed_at | OM 確認者與時間 |
| reason | 路由原因 |

規則：

- IT 品項預設 `quote_owner = PAS`。
- 非 IT 品項可由 OM 指定 `PAS / sourcing / OM_direct`。
- `local_buy` 不需要 FTV code。
- `external_import` 需要 FTV code 才能 export。

### ftv_code_master

FTV code 主檔。FTV 是海關 / Trading / Accounting audit 維度，不是 Cost Owner 成本分析 key。

| 欄位 | 說明 |
| --- | --- |
| id | FTV record id |
| item_id / material_id | 對應品項與料號身份 |
| demand_department | 買/用的需求部門 |
| ftv_code | FTV code |
| factory_code / type_code / dept_code / sequence_no | FTV code 組成資料 |
| active_scope_key | active 唯一鍵，active 時為 `active`，EOL 後為 NULL |
| status | active / eol / inactive |
| effective_from / eol_at | 生效與 EOL 日期 |

唯一性：

```text
item_id + demand_department + active_scope_key
```

這表示：

- 同 item/spec + 同需求部門 + external import：沿用同一 active FTV code。
- 同 item/spec + 不同需求部門：可各自有 FTV code，方便海關 audit 說明是哪個部門買/用。
- FTV 不可作為成本分析 group key。

### ftv_mapping_staging

舊資料 mapping 匯入暫存表。舊 Excel 先進 staging，由 OM/Admin review 後才寫入 `ftv_code_master`。

### customs_audit_records

Export 時建立不可變快照，供 Accounting / Trading / customs audit。

| 欄位 | 說明 |
| --- | --- |
| export_id | export package id |
| request_line_id | request line |
| item_id / material_id | 品項與料號 |
| demand_department | 需求部門 |
| purchase_route | local_buy / external_import |
| ftv_code / ftv_status | 當次 export 使用的 FTV 狀態 |
| quote_file_ref | quote metadata |
| export_package_code | OM package code |

### exchange_rates

| 欄位 | 說明 |
| --- | --- |
| month | YYYY-MM |
| usd_to_vnd_rate | 匯率 |
| updated_by | OM Leader / Admin |
| updated_at | 時間 |

### approvals

| 欄位 | 說明 |
| --- | --- |
| id | approval id |
| request_id | request |
| approval_type | manager / dri / projectDri |
| decision | approve / reject |
| reason | reject reason |
| decided_by | user |
| decided_at | 時間 |

### audit_events

| 欄位 | 說明 |
| --- | --- |
| id | event id |
| request_id | nullable，部分系統事件可空 |
| actor_user_id | 操作者 |
| actor_role | 操作角色 |
| event_type | submit / approve / save_quote 等 |
| from_status | 前狀態 |
| to_status | 後狀態 |
| summary | 給 timeline 顯示 |
| payload_json | 重要欄位變化 |
| created_at | 時間 |

## Session / Permission MVP

內測帳號先用固定帳號，不接正式 SSO：

| 帳號 | role |
| --- | --- |
| user-a@uat.local | requester |
| manager-b@uat.local | manager |
| om-leader@uat.local | omLeader |
| om-member@uat.local | omMember |
| dri@uat.local | dri |
| project-dri@uat.local | projectDri |
| admin@uat.local | admin |

Permission 原則：

- Requester：建立需求、submit、看自己的 action required、confirm / cancel quote。
- Manager：approve / reject submitted rows、看 demand analysis。
- OM Leader：OM 全功能、可改 exchange rate。
- OM Member：OM PAS / Quote / Export，但不可改 exchange rate。
- DRI：處理 DRI price review。
- Project DRI：處理 Project DRI price review。
- Admin：UAT reset、帳號、設定。

內測版本要停用一般使用者手動切換 role。role 應由登入帳號決定；若保留 Admin impersonation，必須寫入 audit event。

## API 邊界

API 應按 workflow ownership 拆分，不按目前 UI 檔案拆分。原因是目前 `app.js` 中 `requests` row 同時承載需求、審核、OM quote、export、buyer、external progress 等欄位，若直接照前端物件搬 DB，後續會很難維護。

### Auth

- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Requests

- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/:id`
- `POST /api/requests/:id/submit`
- `POST /api/requests/:id/cancel`

### Manager

- `GET /api/manager/review-queue`
- `POST /api/manager/requests/:id/approve`
- `POST /api/manager/requests/:id/reject`

### OM

- `GET /api/om/submission-dashboard`
- `GET /api/om/pas-demand-no`
- `POST /api/om/requests/:id/pas-demand-no`
- `POST /api/om/requests/:id/move-to-quote`
- `GET /api/om/pas-quote-result`
- `POST /api/om/requests/:id/quote`
- `POST /api/om/requests/:id/send-to-user-a`
- `POST /api/om/requests/:id/export`
- `POST /api/om/requests/:id/reject-to-dri`

### Price Review

- `GET /api/price-review/pending`
- `POST /api/price-review/:id/approve`
- `POST /api/price-review/:id/reject`

### Audit

- `GET /api/requests/:id/audit-events`
- `GET /api/audit-events?project=...`
- `GET /api/admin/audit-export`

### UAT Admin

- `POST /api/admin/reset-uat-data`
- `POST /api/admin/seed-uat-data`

## 現有程式遷移熱點

目前主要 shared mutable state 集中在 `app.js`：

| State | 現況 | DB 後處理 |
| --- | --- | --- |
| `requests` | 所有流程共用的主陣列。 | 拆為 `requests`、`request_demand_lines`、`pas_quotes`、`approvals`、`exports`。 |
| `handoffHistory` / `omHistory` / `dispatchHistory` | 前端 history arrays。 | 合併到 append-only `audit_events`。 |
| `materialMasterRecords` | 前端產生 material identity。 | 搬到 `materials`，由 server 產生 Material No。 |
| `vendorMaterialMappings` | 前端 vendor mapping。 | 搬到 `vendor_mappings`。 |
| `monthlyExchangeRates` | 前端狀態。 | 搬到 `exchange_rates`，OM Leader/Admin 可寫。 |
| client-side counters | `requestSequence` 等前端流水號。 | 改由 server / DB 產生。 |
| localStorage carryover | `procurementCarryoverLedger.v1`。 | 搬到 `carryover_ledger`。 |
| localStorage temp budget | `fihTemporaryBudgetMetaV1` / draft。 | metadata 搬 DB，draft 可先保留 UI local draft。 |

第一批最需要遷移的 action：

| Workflow | 現有 action 熱點 | 建議 API transaction |
| --- | --- | --- |
| User A submit | `submitRequests` | `POST /api/requests/:id/submit` |
| Manager decision | `commitManagerDecision`、`applyManagerRowDecision`、bulk decision | `POST /api/manager/requests/:id/approve` / `reject` |
| OM PAS | `updatePasField`、`applyPasDecision` | `POST /api/om/requests/:id/pas-demand-no` / `move-to-quote` |
| OM quote | `saveOmQuoteInfoRows`、`saveOmQuoteInfo` | `POST /api/om/requests/:id/quote` |
| User A quote decision | `confirmUserAOmQuote`、`cancelUserAOmQuote` | `POST /api/requests/:id/quote-confirm` / `quote-cancel` |
| Price review | price review decision handlers | `POST /api/price-review/:id/approve` / `reject` |
| Export | `markOmFinalExportRowsExported`、`exportOmPackageRows` | `POST /api/om/requests/:id/export` |
| Carryover | `recordUserAppliedCarryover`、`updateLedgerStatus` | `POST /api/carryover` / `POST /api/carryover/:id/decision` |

## Audit Event Taxonomy

MVP 使用一張 shared `audit_events` 表，取代分散的 `handoffHistory`、`omHistory`、`dispatchHistory`。

最小欄位：

- `event_id`
- `entity_type`
- `entity_id`
- `request_id`
- `project_code`
- `actor_user_id`
- `actor_role`
- `event_type`
- `event_label`
- `from_status`
- `to_status`
- `reason`
- `payload_json`
- `session_id`
- `ip_address`
- `created_at`

MVP 必記 event：

| Family | Event Types |
| --- | --- |
| Auth | `auth.login`、`auth.logout`、`auth.session_expired`、`auth.impersonation_started` |
| Request | `request.created`、`request.draft_updated`、`request.submitted`、`request.cancelled_by_user`、`request.change_requested` |
| Manager | `manager.approved`、`manager.rejected_to_dri`、`manager.project_opened`、`manager.project_closed` |
| OM PAS | `om.received`、`om.pas_demand_no_recorded`、`om.moved_to_quote`、`om.rejected_to_dri` |
| OM Quote | `om.quote_saved`、`om.quote_pdf_uploaded`、`om.quote_excel_uploaded`、`om.quote_validity_recorded`、`om.sent_to_user_confirmation` |
| Price Review | `price.auto_cleared`、`price.escalation_required`、`price.dri_approved`、`price.project_dri_approved`、`price.rejected` |
| Export | `om.marked_expense_ecs`、`om.marked_capex_cfa`、`om.export_package_prepared`、`om.exported_to_cfa`、`om.exported_to_ecs` |
| Carryover | `carryover.user_applied`、`carryover.dri_applied`、`carryover.dri_rejected` |
| Admin | `admin.user_updated`、`admin.threshold_updated`、`admin.approver_map_updated`、`admin.uat_data_reset` |

## 改造難點

1. 現在許多流程 action 直接修改前端 `requests` array，之後要改成 API transaction。
2. 狀態名稱很多，需要收斂 canonical status，避免 DB 中出現 UI-only 狀態。
3. 現在部分資料用 localStorage，例如 carryover ledger、temporary budget metadata；要決定哪些搬 DB，哪些仍是 UI draft。
4. 附件目前偏 metadata / filename simulation；正式留存要決定 storage。
5. 多人同時改同一 row 時，需要 version 欄位或 row lock，否則會互相覆蓋。
6. 目前角色是 UI-only 狀態，任何人可在前端切換；API authorization 必須成為唯一可信來源。
7. DOM observer / extension 類補強碼可能在正常 action handler 外改畫面或 localStorage，遷移時要逐步移除隱性寫入。

## 建議實作順序

1. 新增 Node server，先可 serve static files 與 `/api/health`。
2. 建 MySQL schema / migration + seed UAT users。
3. 實作 login/session/me/logout。
4. 把 request list 改成由 API 載入，但保留目前 render functions。
5. 先遷移 User A submit、Manager approve、OM PAS Demand No 三個 action。
6. 再遷移 OM Quote Result、Price Review、Export。
7. 所有已遷移 action 寫 audit_events。
8. 增加 admin reset / audit export。
9. 補 system contract tests 與 API unit tests。

## 第一個開發切片

第一個 change set 建議只做基礎能力，不搬 workflow：

- 新增 `server.js`，提供 static file 與 `/api/health`。
- 新增 `db/schema.sql`。
- 新增 `db/seed-uat.js` 或同等 seed script。
- 新增 MySQL connection pool 設定，透過 `.env` / local config 管理 DB host、port、database、user。
- 新增 `POST /api/login`、`POST /api/logout`、`GET /api/me`。
- 前端登入後由 `/api/me` 決定 role，停用一般 role dropdown。
- 新增 API tests：login 成功、session 可查、logout 後失效、OM Member 不可改 exchange rate。

這樣做完後，OM group 還不能完整共用 workflow 資料，但可以先證明「session / role 是 server-authoritative」。

## OM Group 內測通過標準

- 不同 browser profile 登入不同 role，可看到各自權限頁面。
- User A 建立/送出後，Manager B 在另一台電腦可看到。
- Manager approve 後，OM Member / Leader 在另一台電腦可看到 OM queue。
- OM Member 儲存 PAS / quote 後，重新整理仍存在。
- OM Leader 可更新匯率，OM Member 不可。
- Price escalation 可由 DRI / Project DRI 依序處理。
- Detail / timeline 可看到誰在何時做了什麼。
- Admin 可匯出 audit log。

## 預估工期

| 範圍 | 時間 |
| --- | --- |
| Phase 1 MVP | 5-10 工作天 |
| Phase 2 穩定化 | 2-3 週 |
| Phase 3 正式化 | 4-8 週以上 |

## 下一步

已決定：

1. DB 使用 MySQL 作為內測 POC shared DB。

仍需決定：

1. MySQL 部署位置：同一台內網測試主機、既有公司 MySQL、或 IT 指定測試 DB。
2. 附件第一版只存 filename / metadata，還是要真的 upload 到 server / NAS。

若要直接往下開發，第一個 PR / change set 應該只做 server + DB schema + login/session + `/api/me`，不要同時搬整個 workflow。
