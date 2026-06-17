# Current System Overview For IT Handoff

This document is the current handoff baseline. It is updated only for handoff-level flow or role changes.

## Role Ownership

| Role | Main purpose | Can input / mutate | Read-only visibility |
|---|---|---|---|
| User A / OPM | Create demand, reuse demand, track own requests | Item/spec, need date, demand rows, temporary budget estimate, request change | Manager/OM/Buyer timeline status |
| DRI | Review price exceptions and carryover | Carryover apply/reject, carryover reason, price review decision | Demand context and ledger history |
| Project DRI | Final escalation confirmation | Price escalation approve/reject | Price variance and demand context |
| Manager B | Demand approval and business review | Approve/reject demand | Cost dashboard, station matrix, carryover impact, progress tracking |
| OM Purchasing | PAS and quote workflow | PAS Demand No, PAS Material No, quote result, quote validity, export package, exchange rate if OM Leader | Effective qty from DRI carryover, User A/DRI decision status |
| Admin | Access and approval setup | User roles, approver mapping, threshold rules | System setup state |

## Core Business Flow

1. User A submits demand with Need Date and long-form demand rows.
2. Manager B approves or rejects demand.
3. OM Purchasing records PAS Demand No and PAS Quote Result.
4. Price decision either auto-clears or escalates to DRI / Project DRI.
5. User A may declare line carryover while entering demand; DRI owns formal carryover review.
6. OM Export Package should use effective demand qty after applied carryover.

## Table And Input Rules

| Area | Primary table | Input owner | Notes |
|---|---|---|---|
| User A Request Workspace | Draft Items / Add-Reuse modal | User A | Need Date required; no vendor or PAS no; can declare line carryover |
| Manager Demand Analysis | Cost Dashboard / Station Matrix | Manager B approval only | Carryover is read-only impact |
| OM Submission Dashboard | Stage aging table | OM Purchasing | Tracks pending owner, received date, days pending, next action |
| OM PAS Demand No | PAS demand table | OM Purchasing | Only PAS Demand No, no attachments |
| OM PAS Quote Result | Quote result cards/table | OM Purchasing | PAS Material No, vendor, price, quote date, valid until, PDF, Excel |
| OM Export Package | Export package table | OM Purchasing | Uses quote package and effective qty; Buyer PO is downstream |
| DRI Carryover Review | Carryover Flow Ledger | DRI | Apply/reject only here |

## Carryover Contract

Carryover does not overwrite original demand. It creates ledger events:

- Source Line
- Target Line
- Original Qty
- Used Qty
- Carryover Qty
- Effective Qty
- Status
- Confirmed By
- Timestamp
- Reason

User A may declare carryover in the Demand Editor. DRI owns formal carryover review. Manager B only sees carryover impact. OM only consumes effective qty.

## Currency Contract

- Cost and price calculations use USD canonical fields.
- VND display, VND quote input, and export VND values convert through the monthly USD-to-VND exchange rate.
- OM Leader maintains the rate; OM Member can only use it.

## Price Decision Contract

- OM `Save Quote Info` compares quote price with history price.
- Computer category: within history + 20% = Auto Cleared.
- MFG category: within history + 10% = Auto Cleared.
- Missing history price, temporary budget, or over-threshold quote = DRI -> Project DRI review.
- Auto Cleared and Project DRI Approved rows can enter OM Export Package without User A confirmation.

## Current Prototype Risks

- `layout-contract.js/css` and `carryover-extension.js/css` are late-loaded prototype extensions.
- Core OM Export Package has an effective qty helper available through `ProcurementCarryover.effectiveQtyFor(item, phase)`.
- 2026-06-04 QA passed `./test.sh`, Browser smoke, Layout smoke, Global UI audit, and Playwright + axe-core accessibility smoke in the prototype folder.
- Prototype state is front-end/in-memory. IT still needs real backend/API persistence, auth, tenant isolation, and database migrations.
