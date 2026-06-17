# MVA 採購系統背景理解

Review date: 2026-06-08

## 我理解這套系統在解決什麼

這套系統是 MVA 設備/物料採購需求的角色型 workflow prototype。它不是單純的請購表單，而是把需求建立、部門確認、成本核准、OM 採購作業、報價例外、Export Package、Buyer PR/PO handoff 串成一條可追蹤的流程。

目前 prototype 的核心價值是把原本分散在 Excel、人工追蹤、OM 報價、部門確認、Buyer handoff 的資料和責任邊界整理成可示範、可驗證、可交給 IT 實作的業務規格。

## 角色分工

| Role | 核心責任 | 不應混淆的邊界 |
| --- | --- | --- |
| Requester | 建立需求、填 all-phase worksheet qty、save draft、submit、回覆 action required | 不看 vendor、PAS material、factory material、OM assignee、FTV；不 approve、quote、export |
| Dept DRI | 第一層業務審核、price exception 第一層、unit-owned carryover/warehouse review | 不代替 Cost Manager、OM、Budget Approver |
| Cost Manager | P&L/cost owner、final authorization、Demand Analysis、Station Matrix | 不改需求、不操作 OM、不 lock warehouse |
| OM Leader | Mai，負責 OM 派工、匯率、全 OM 進度、feedback triage | 可看全部 OM rows，但不應默認成 quote operator 或 business approver |
| OM Purchasing | Giang/Linh，處理 assigned rows、PAS Demand No、quote result、Export Package | 不派工、不維護匯率、不操作未指派 rows |
| Budget Approver | quote 後價格/預算例外 final approval | 不處理一般 requester submission approval |
| Admin | users、roles、mappings、threshold、approval chain、audit/feedback setup | 不做 business approval override |
| Buyer Handoff | OM export 後 PR/PO 所屬階段 | 目前主要是狀態標示，不是完整 Buyer 操作系統 |

## 主流程

1. Requester 建立 package，Add Item，填 MFG / Non-MFG phase x station/unit qty。
2. Requester submit，送 Dept DRI。
3. Dept DRI approve 後送 Cost Manager final authorization；reject 回 Requester Action Required。
4. Cost Manager approve 後送 OM Leader intake / assignment；reject 回 Requester Action Required。
5. OM Leader 派工給 OM Purchasing。
6. OM Purchasing 填 PAS Demand No、PAS Quote Result、quote evidence、valid until。
7. 系統依 USD delta threshold、no history、Temporary Budget 決定 auto-clear 或進 Dept DRI -> Budget Approver。
8. 通過後進 OM Export Package。
9. OM export 後進 Buyer Handoff，Buyer owns PR / PO。

## 現況成熟度

目前專案進度文件標示 recommended progress: 68%。我認同這個量級：產品/UX/流程規格已相當具體，Requester worksheet、Cost Manager Demand Analysis、OM PAS/quote/export、privacy guard、attachment MVP 都已可驗證；但 production workflow persistence、正式 API、storage policy、Excel import/export、Buyer PR/PO integration 仍屬 IT 後續實作。

## DB / API 現況

現有 `schema.sql` 是 UAT / MVP 層：

- users
- sessions
- om_assignments
- uat_feedback
- attachments
- audit_events
- item/material/FTV/customs support tables

target workflow migration 已開始補上正式 persistence：

- request_packages / request_items / request_demand_lines
- approvals
- pas_quotes / exchange_rates / price_decisions
- exports / buyer_handoff_events
- warehouse_inventory_transactions / carryover_ledger
- requester_mappings

`workflow-api-table-map.zh-TW.md` 已把 API phase、table ownership、Requester visibility、audit events 串起來，方向正確。仍需 IT 將 demo-state workflow rows 轉成 server-authoritative workflow APIs。

## Handoff 策略

正式 IT handoff 是 no-source handoff。IT 收規格、data dictionary、UAT cases、controlled demo access，不收 prototype source。這個策略清楚，但實際 workspace 同時保有 source、DB SQL、handoff zip、Mac mini demo notes，因此對外溝通時要特別避免讓 IT 誤以為 prototype source 是 production implementation base。

## Evidence limits

- in-app Browser 可讀 DOM，但截圖 API 逾時；本次截圖使用 Playwright headless fallback 擷取同一個 localhost Node server。
- Node server health: `{"ok":true,"db":"memory-fallback"}`，因此本次畫面是 memory fallback demo，不代表 MySQL UAT 的所有狀態。
- 截圖是 viewport evidence，不代表完整 WCAG compliance。
