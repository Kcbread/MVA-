# Current System Overview For IT Handoff

This document is the compact current handoff baseline. It is updated only for handoff-level flow, role, API, or data-contract changes.

Latest review: 2026-06-15.

## Role Ownership

| Role | Main purpose | Can input / mutate | Read-only visibility |
|---|---|---|---|
| Requester | Create demand, add item/spec rows, track own requests | Worksheet qty, Need Date, request action, temporary budget estimate, warehouse/carryover candidate | Safe workflow status, pending owner, high-level timeline |
| Dept DRI | First scoped business review | Approve/reject requester submissions, unit-owned warehouse/carryover candidate, price exception first review, audited quantity direct edit | Submission context, quantity evidence, price exception summary |
| Cost Manager | Final cost authorization after Dept DRI | Authorize/reject, audited quantity direct edit | Cost Review evidence, Demand Cost Dashboard, Station Matrix, review history |
| OM Leader | OM work management | Assignment, reassignment, exchange rate, feedback triage | All OM rows and workload status |
| OM Purchasing | Assigned OM execution | PAS Demand No, PAS Quote Result, quote screenshot/image, quote Excel, quote validity, Export Package | Assigned row context, quote expiry, export readiness |
| Budget Approver | Final price/budget exception approval | Final approve/reject after Dept DRI price review, audited quantity direct edit | Budget exception evidence and quantity review |
| Admin | System setup and governance | Users, roles, requester mapping, thresholds, approval chains, OM setup, audit/feedback setup | Setup/audit state |
| Buyer Handoff | Post-OM-export PR/PO stage | Future PR/PO/arrival feedback | Exported package metadata and handoff status |

## Core Business Flow

1. Requester saves draft or submits the active MFG / Non-MFG worksheet.
2. Dept DRI reviews submitted requester package.
3. Cost Manager performs final cost authorization.
4. OM Leader assigns OM work.
5. OM Purchasing records PAS Demand No and PAS Quote Result.
6. System price decision auto-clears when USD delta is `<= 0.40`.
7. Price exceptions route Dept DRI -> Budget Approver.
8. OM Export Package marks the package exported.
9. Buyer Handoff owns PR / PO after OM export.

## Table And Input Rules

| Area | Primary table | Input owner | Notes |
|---|---|---|---|
| Request Workspace | All-Phase worksheet / Add Item popup | Requester | Need Date required only for submit; requester-safe fields only |
| Dept Review | Dashboard / MFG Station Detail / Non-MFG Department Detail | Dept DRI approval and quantity edit | Dashboard-first evidence; approved rows remain visible |
| Cost Review | Demand Cost Dashboard / Station Matrix | Cost Manager authorization and quantity edit | Protected baseline tables embedded inside Cost Review |
| Budget Review | Dashboard / MFG Station Detail / Non-MFG Department Detail | Budget Approver final decision and quantity edit | Only for price/budget exceptions |
| OM Submission Dashboard | OM stage aging table | OM Leader / OM Purchasing | Tracks OM pending owner, stage, quote expiry |
| OM PAS Demand No | PAS demand table | OM Purchasing | PAS Demand No only |
| OM PAS Quote Result | Quote result card/table | OM Purchasing | PAS Material No, vendor, price, quote date, valid until, screenshot/image, Excel |
| OM Export Package | Export package table | OM Purchasing | Uses quote package and effective qty |
| Buyer Handoff | Handoff status / future PR-PO table | Buyer Handoff / future Buyer | Starts only after OM export |

## Carryover And Warehouse Contract

Carryover and warehouse do not overwrite original demand. They create ledger events with source, target, owner, qty, status, actor, timestamp, and reason.

- Pending candidates are evidence only.
- Locked warehouse use affects effective demand/cost.
- Applied carryover affects effective demand/cost.
- Rejected candidates do not affect cost.
- Cost Manager consumes locked/applied effective evidence; it does not operate warehouse/carryover.

## Currency And Price Contract

- Cost and price calculations use USD canonical fields.
- VND display/input/export converts through exchange rates maintained by OM Leader / Admin.
- Price exception trigger is absolute USD delta:

```text
rounded(quoteUnitPriceUsd - historyUnitPriceUsd, 2) > 0.40
```

- `<= 0.40 USD` auto-clears.
- No history price, new item, and Temporary Budget always trigger Dept DRI -> Budget Approver review.

## Current Prototype Risks

- Prototype workflow state is still partly frontend/in-memory; IT must implement production backend/API persistence, auth, tenant isolation, transactions, and audit history.
- Current implemented backend covers auth/session, UAT feedback, OM assignment, attachment metadata/local retention, audit events, item/material/FTV/customs support tables, and SAP PO raw mirror tables.
- Existing zip artifacts may be older than the 2026-06-15 live Markdown review. Rebuild packaged handoff artifacts before treating them as current.
