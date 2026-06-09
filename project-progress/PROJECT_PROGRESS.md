# Procurement System Project Progress

Updated: 2026-06-08

## Goal

Build a procurement system prototype covering requester item submission, manager approval, procurement coordinator filtering, historical PO / quotation lookup, quote validity decisioning, quotation update workflow, manager reporting, and Excel-compatible export.

## Current Progress

2026-06-08 IT official handoff status:

- Handoff strategy is **no-source**: IT receives docs/spec/UAT/data dictionary/demo access, not prototype source code.
- `IT-Demo` Mac mini account is prepared for controlled screen-sharing demo.
- Latest Requester rule is All-Phase Excel worksheet:
  - one row = `Item / Spec`
  - phase groups = `P1.0 / P1.1 / EVT / DVT / PVT / MP`
  - qty cells map to long-form `stationBreakdown`
  - Add Item popup columns = `Add / Item / Detail / Spec / Action`
  - Lv1 / Lv2 / Lv3 filters are included
- Current delivery entrypoint: `procurement-prototype/docs-current/IT_DELIVERY_READINESS_20260608.md`.
- No-source official zip is prepared under `procurement-prototype/docs-current/`.

2026-06-08 OM internal test host status:

- Mac mini UAT service is running at `http://127.0.0.1:8080` and LAN `http://192.168.32.212:8080`.
- `/api/health` returns `{"ok":true,"db":"mysql"}`.
- Shared UAT login accounts are active: `requester`, `deptdri`, `omleader`, `ompurchasing`, `admin`, all using password `123`.
- Local attachment retention MVP is deployed:
  - files persist under `/Users/kai-chenyang/Services/mva-procurement/uploads`
  - metadata persists in MySQL table `attachments`
  - UAT feedback screenshot and OM quote screenshot/Excel now use real upload/download API
  - OM-internal attachments are blocked from requester download
- Main workflow rows are still frontend/demo-state backed until IT implements production APIs/database workflow from the handoff docs.

Recommended progress: 68%

Reason:

- Core role workflows are specified and validated in prototype.
- Requester Excel worksheet input is locked.
- Role routing, privacy guards, cost analysis, OM PAS/quote/export flow, and attachment API proof-of-concept are validated.
- Mac mini UAT has MySQL-backed auth/session and attachment metadata.
- Remaining production work belongs to IT implementation: real workflow APIs, database schema, permissions, storage policy, Excel import/export, and deployment hardening.

## Roles

| Role | Default page | Main purpose |
|---|---|---|
| Requester | Request Workspace | Add item/spec, enter all-phase worksheet qty, save draft, submit |
| Dept DRI | Price Review / Carryover Review | Review price exception and formal carryover |
| Cost Manager | Approval / Demand Analysis | Approve demand and review cost/quantity |
| OM Leader | OM Purchasing | OM ownership, assignment, exchange rate, PAS/quote/export oversight |
| OM Purchasing | OM Purchasing | PAS Demand No, quote result, package export |
| Budget Approver | Price Review | Final price escalation approval |
| Admin | Admin Setup | Access, mappings, governance setup |
| Buyer Handoff | Buyer Handoff | PR/PO downstream handoff placeholder |

## Completed Pages

| Page | Status | Notes |
|---|---|---|
| Login | Done | Role selector and route simulation |
| Department Input | Done v2 | Purchase-data search, request list, new item request |
| Approval | Done | Manager approval gate |
| Buyer Workbench | Done v2 | Incoming Requests, PO History, Filtered Result |
| Project Overview | Done v1 | Cost and quotation report view |
| History | Done | Select and copy historical items |
| Project View | Done | Shows submitted and project items |
| Natural Search | Done | Prototype keyword / simple natural search |

## Next Decisions

- IT production API/database design based on handoff docs.
- Final deployment and access policy.
- Production file storage and retention policy.
- Formal Excel import/export templates.
- Buyer PR/PO integration depth.
