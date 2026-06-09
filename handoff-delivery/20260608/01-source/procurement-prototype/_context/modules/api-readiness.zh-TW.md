# API / MySQL 對接準備上下文

## 架構原則

正式 POC 架構為：

`Browser frontend -> Node.js / API -> MySQL`

Frontend 不可直接連 MySQL。

## Phase 1 API 範圍

第一個 change set 只做最小可驗證 API 對接，不一次搬完整 workflow：

- server / static hosting
- MySQL schema / migration
- seed UAT users
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`
- server-authoritative role/session
- OM assignment API
- audit_events
- UAT feedback API

## MySQL 最低 tables

- `users`
- `sessions`
- `audit_events`
- `om_assignments`
- `uat_feedback`

後續 workflow tables 再逐步拆：

- `requests`
- `request_demand_lines`
- `approvals`
- `pas_quotes`
- `exchange_rates`
- `exports`
- `attachments`
- `warehouse_inventory_transactions`
- `carryover_ledger`

## Session / Role

- role 由 server session 決定。
- 一般使用者登入不應靠前端 role dropdown 決定權限。
- Admin impersonation 若保留，必須寫 audit。

## OM Assignment

- OM Leader Mai 可 assign / reassign / clear。
- Linh: P27 / F27。
- Giang: other projects。
- OM Purchasing 只能操作 assigned rows。
- CPD-IEP Owner 是業務 owner，不等於 OM assignee。

## Attachments / Evidence

第一版可先存 metadata：

- filename
- content type
- source field
- uploaded by
- uploaded at
- storage reference

Quote evidence 規則：

- Quote screenshot/image required。
- Quote Excel required。
- 不再把 quote PDF 當主要 evidence 名稱。

## Audit Events

必記：

- login/logout
- assignment / reassignment / clear
- requester submit / revise
- Dept DRI decision
- Cost Manager authorization
- OM PAS Demand No
- OM Quote Result
- price decision
- Budget Approver decision
- export package
- warehouse stock in / candidate / lock / reject
- feedback submit / triage
- admin setup changes

## Frontend API 化策略

- 先新增 API client layer 包住 `/api/me`、login/logout、assignment、feedback。
- 現有 in-memory workflow 可暫留，逐步搬到 API。
- UI 不應發明 API response shape；若 API 不合用，回報 spec mismatch。

## 風險

- 現有 prototype 的 request row 是 overloaded object，不能直接整包搬 DB。
- 多角色修改同一 row 時需 transaction 與 audit。
- 時區與 stageStartAt/daysPending 要由 server 統一。
- Requester visibility 必須由 API 層保護，不能只靠前端 hidden。

## PM 決策

- MySQL 是 POC shared DB。
- Attachment 第一版 metadata only。
- 第一個 API change set 不搬完整 workflow。
