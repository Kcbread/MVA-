# Database Current And Target

## Current Tables

Current `db/schema.sql` includes:

| Table | Current Purpose |
| --- | --- |
| `users` | UAT users, role, scope metadata, password hash. |
| `sessions` | Session token hashes, expiry, revocation. |
| `om_assignments` | Current OM row assignment by request id. |
| `uat_feedback` | UAT feedback rows and triage owner/status. |
| `attachments` | Attachment metadata for local file retention. |
| `audit_events` | Append-only audit events. |
| `item_master` | Normalized item/spec identity support. |
| `material_identity` | Internal/external material identity layer. |
| `purchase_route_decisions` | OM route decision support: local buy / external import and quote owner. |
| `ftv_code_master` | Active FTV mapping by item/material and demand department. |
| `ftv_mapping_staging` | Legacy FTV import review staging. |
| `customs_audit_records` | Export-time immutable customs/audit snapshot. |

## Target Workflow Tables

These tables are target roadmap, not fully implemented yet:

| Target Table | Owner / Meaning |
| --- | --- |
| `request_packages` | Requester package-level submit group. |
| `request_items` | Item/spec/request-line identity. |
| `request_demand_lines` | Long-form demand rows: demand type, phase, station/unit, qty, remark. |
| `approvals` | Dept DRI, Cost Manager, Budget Approver decision ledger. |
| `price_decisions` | Auto-clear/escalation decision, USD delta, threshold, reason. |
| `pas_quotes` | PAS Demand No, PAS Material No, vendor, quote price, quote date, valid until. |
| `exchange_rates` | OM Leader maintained USD/VND rates. |
| `exports` | OM package code, cost type, CFA/ECS target, export timestamp/status. |
| `buyer_handoff_events` | Buyer received, PR/PO/progress/evidence timeline. |
| `warehouse_inventory_transactions` | Stock In, Use Candidate, Locked Use, Rejected with source/target trace. |
| `carryover_ledger` | Requester candidate, Dept DRI applied/rejected ledger, effective quantity. |
| `requester_mappings` | Project Family + Project Code + Demand Department -> Requester / Dept DRI scope. |

## DB Design Rules

- Keep UAT DB and test DB separate.
- Add ordered migrations before workflow persistence.
- Do not use `mva_procurement_uat` for automated DB integration tests.
- Server computes stageStartAt/daysPending consistently.
- Requester visibility must be enforced at query/API level.
- Workflow state transitions must record audit events.
- Attachment metadata links to workflow-owned entities after target tables exist.
