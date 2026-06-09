# Workflow API / Table Map

本文件把 target workflow migration 對應到後端 API、角色權責與 audit
要求。它是正式 API / MySQL 對接前的工作地圖，不是已完成 API 合約。

## 讀取順序

1. `schema.sql`：現有 UAT auth / session / attachment / audit MVP。
2. `migrations/001_target_workflow_tables.sql`：workflow persistence target tables。
3. 本文件：API 分段、table ownership、role visibility。

## 核心原則

- Browser frontend 只能呼叫 Node.js API，不可直接連 MySQL。
- `role`、`pendingOwner`、`currentStage`、`stageStartAt`、`daysPending` 由 server 決定。
- 每個 workflow transition 都要寫 `audit_events`。
- Requester visibility 必須在 API/query 層過濾，不可只靠 frontend hide。
- Reject 必須保留 actor、timestamp、reason、previous stage、next stage。
- Attachment metadata 先存在 `attachments`；workflow tables 只引用 attachment id。

## API 分段

### Phase 1：既有 MVP

已在 prototype 範圍內驗證：

| API / 行為 | Tables | Owner |
| --- | --- | --- |
| `POST /api/login` | `users`, `sessions`, `audit_events` | Server |
| `POST /api/logout` | `sessions`, `audit_events` | Server |
| `GET /api/me` | `sessions`, `users` | Server |
| OM assignment API | `om_assignments`, `audit_events` | OM Leader |
| UAT feedback API | `uat_feedback`, `attachments`, `audit_events` | All users submit, Admin / Mai triage |
| Attachment upload/download | `attachments`, filesystem storage, `audit_events` | Server |

### Phase 2：Requester Demand Persistence

| Target API | Writes | Reads | Actor |
| --- | --- | --- | --- |
| `POST /api/request-packages/draft` | `request_packages` | `requester_mappings`, `users` | Requester |
| `PUT /api/request-packages/:id/items` | `request_items`, `request_demand_lines` | `item_master`, `material_identity` | Requester |
| `POST /api/request-packages/:id/submit` | `request_packages`, `approvals`, `audit_events` | `request_demand_lines`, `requester_mappings` | Requester |
| `GET /api/request-packages/mine` | none | `request_packages`, `request_items`, `request_demand_lines`, status-derived view | Requester |

Server validations:

- Submit requires package-level `need_date`.
- Submit requires at least one demand line with `quantity > 0`.
- Save Draft does not require `need_date`.
- `Reuse Item` and `Copy Demand` target quantities must start from 0.
- Requester cannot write vendor, PAS material, factory material, OM assignee, FTV, or owner.

### Phase 3：Submission Approval

| Target API | Writes | Reads | Actor |
| --- | --- | --- | --- |
| `GET /api/approvals/dept-dri-queue` | none | `request_packages`, `request_items`, `request_demand_lines`, `approvals` | Dept DRI |
| `POST /api/approvals/:id/decision` | `approvals`, `request_packages`, `audit_events` | scope mapping | Dept DRI / Cost Manager / Budget Approver |
| `GET /api/cost-manager/submission-monitor` | none | workflow status view, `request_packages`, `approvals`, cost data | Cost Manager |

Transition rules:

- Dept DRI approve -> Cost Manager final authorization.
- Dept DRI reject -> Requester Action Required.
- Cost Manager approve -> OM Leader intake / assignment.
- Cost Manager reject -> Requester Action Required.
- Budget Approver approve -> OM Export Package.
- Budget Approver reject -> Requester Action Required unless a specific previous-stage repair is configured.

### Phase 4：OM Quote / Price / Export

| Target API | Writes | Reads | Actor |
| --- | --- | --- | --- |
| `POST /api/om/assignments` | `om_assignments`, `request_packages`, `audit_events` | OM queue | OM Leader |
| `POST /api/om/exchange-rates` | `exchange_rates`, `audit_events` | none | OM Leader / Admin |
| `POST /api/om/items/:id/pas-demand` | `pas_quotes`, `audit_events` | assigned row | OM Purchasing |
| `POST /api/om/items/:id/quote-result` | `pas_quotes`, `price_decisions`, `attachments`, `audit_events` | assigned row, `exchange_rates`, history price | OM Purchasing |
| `POST /api/om/items/:id/export` | `exports`, `customs_audit_records`, `audit_events` | approved quote/package context | OM Purchasing |

OM guardrails:

- OM Leader can assign / reassign / clear and maintain exchange rates.
- OM Purchasing can operate assigned rows only.
- Quote result requires screenshot/image attachment and Excel attachment.
- Quote date and quote received date are the same business date in v1.
- Quote expiry warning threshold is 10 days.
- `quote_unit_price_usd - history_unit_price_usd > 0.40` triggers price exception.
- No history price, new item, and Temporary Budget always trigger exception.

### Phase 5：Warehouse / Carryover

| Target API | Writes | Reads | Actor |
| --- | --- | --- | --- |
| `POST /api/warehouse/stock-in` | `warehouse_inventory_transactions`, `audit_events` | purchased item source | Warehouse owner |
| `POST /api/warehouse/candidates` | `warehouse_inventory_transactions`, `audit_events` | available stock summary | Requester |
| `POST /api/warehouse/transactions/:id/decision` | `warehouse_inventory_transactions`, `audit_events` | owner routing | OM / MFG / Unit owner |
| `POST /api/carryover/candidates` | `carryover_ledger`, `audit_events` | reusable request source | Requester / system |
| `POST /api/carryover/:id/decision` | `carryover_ledger`, `audit_events` | scoped queue | Dept DRI |

Cost rule:

- Warehouse stock is evidence.
- Pending candidate does not reduce official cost.
- Locked Use affects effective demand/cost.
- Carryover only affects cost after approved/applied ledger state.

### Phase 6：Buyer Handoff

| Target API | Writes | Reads | Actor |
| --- | --- | --- | --- |
| `GET /api/buyer-handoff/packages` | none | `exports`, `buyer_handoff_events`, quote/export metadata | Buyer Handoff |
| `POST /api/buyer-handoff/events` | `buyer_handoff_events`, `audit_events` | exported package | Buyer Handoff / future Buyer role |

Rules:

- Buyer Handoff begins after OM Export Package.
- Buyer owns PR / PO after OM export.
- User-facing text should use `Buyer Handoff`, not `Downstream`.

## Table Ownership

| Table | Primary Writer | Primary Readers | Notes |
| --- | --- | --- | --- |
| `request_packages` | Requester, server transitions | All scoped workflow roles | Package-level status and pending owner. |
| `request_items` | Requester, server transitions | All scoped workflow roles | Item/spec/request-line identity. |
| `request_demand_lines` | Requester | Dept DRI, Cost Manager, OM scoped views | Canonical qty by phase and station/unit. |
| `approvals` | Server on approval action | Workflow roles | Approval ledger, not a mutable status shortcut. |
| `pas_quotes` | OM Purchasing | OM, Dept DRI/Budget exception views | Hidden from Requester. |
| `exchange_rates` | OM Leader / Admin | OM, price calculation service | Server uses for USD conversion. |
| `price_decisions` | Server | Dept DRI, Budget Approver, Cost Manager, OM | Stores threshold result and escalation need. |
| `exports` | OM Purchasing | OM, Buyer Handoff, audit views | Export package metadata. |
| `buyer_handoff_events` | Buyer Handoff / future Buyer | OM, Buyer Handoff | PR/PO timeline after OM export. |
| `warehouse_inventory_transactions` | Requester / warehouse owner / server | Scoped roles | Ledger for stock in, candidate, lock, reject. |
| `carryover_ledger` | Requester / Dept DRI / server | Scoped roles | Candidate and applied carryover evidence. |
| `requester_mappings` | Admin | Server authorization | Missing mapping should show Need setup. |

## Requester Visibility Filter

Requester API responses must exclude:

- vendor / supplier
- PAS Demand No
- PAS material no
- factory material no
- OM assignee
- FTV code
- internal export package details before user-safe status

Requester may see:

- high-level current stage
- pending owner role or safe label
- next action
- own submitted item/spec/qty/need date
- warehouse/carryover candidate status
- Buyer Handoff status after OM export

## Required Audit Events

The backend should write `audit_events` for:

- login / logout
- requester save draft / submit / revise
- Dept DRI approve / reject
- Cost Manager authorize / reject
- OM assign / reassign / clear
- OM PAS Demand No save
- OM quote result save
- price decision auto-clear / exception route
- Budget Approver approve / reject
- export package
- Buyer Handoff event
- warehouse stock in / candidate / lock / reject
- carryover candidate / apply / reject
- admin mapping / threshold / role changes
- feedback submit / triage

## Verification Checklist

- Requester cannot receive internal procurement fields from API.
- Dept DRI queue is scope-limited by `requester_mappings`.
- Cost Manager sees final authorization queue only after Dept DRI approve.
- OM Purchasing cannot operate unassigned rows.
- Quote result without screenshot/image or Excel is rejected.
- `10.00 -> 10.40` auto-clears; `10.00 -> 10.41` triggers exception.
- Temporary Budget quote result routes Dept DRI -> Budget Approver.
- Reject loop records reason, actor, timestamp, previous stage, next stage.
- Locked warehouse use affects effective cost; pending candidate does not.
- OM export creates Buyer Handoff stage.
