# Role Permission Matrix

| Role | Business Owner | Can Create/Edit | Can Approve/Reject | Can View | Must Not See / Do |
| --- | --- | --- | --- | --- | --- |
| Requester | Demand creator | Demand lines, need date, temporary budget, stock evidence, warehouse/carryover candidates, revisions | None | Own status, high-level timeline, action required tasks | Vendor, supplier, PAS material, factory material, OM assignee, FTV; no approvals or OM actions |
| Dept DRI | Scoped first review | Decision reason only | Submission, warehouse/carryover candidates, price exceptions | Scope rows, price exception summary, evidence | No OM quote/export, no global cost ownership |
| Cost Manager | P&L/final authorization | Final authorization reason only | Dept DRI approved submissions | Cost Dashboard, Station Matrix, carryover/warehouse locked impact, workflow monitor | No demand creation, warehouse lock, OM quote/export, assignment, supplier/FTV operations |
| OM Leader | OM operations lead | Assignment, exchange rate, feedback triage | None for business approvals | All OM rows, assignments, feedback board, exchange-rate state | Not a hidden business approver; no requester demand edits |
| OM Purchasing | Assigned OM operator | PAS Demand No, quote result, quote screenshot/image, quote Excel, valid until, export package | Reject to Requester/Dept DRI with reason | Assigned rows and required context | Cannot operate unassigned rows, assign rows, maintain exchange rate, or approve business decisions |
| Budget Approver | Final exception approver | Decision reason only | Price/budget exceptions after Dept DRI | Delta, threshold, Temporary Budget quote result, demand context | No normal submission approval, no OM operation |
| Admin | Setup/governance | Users, roles, mappings, thresholds, approval chain, OM setup | No business approvals | Audit, feedback setup, access setup | Must not silently approve business rows or impersonate without audit |
| Buyer Handoff | Post-export PR/PO owner | Future PR/PO/progress updates | Future Buyer stage decisions only | Exported packages and handoff status | Does not affect requester approval, OM quote, warehouse/carryover |

## Server Authorization Rules

- Server session role is authoritative.
- Frontend role dropdown is not trusted for UAT/production authorization.
- Admin impersonation, if retained, must write an audit event.
- Requester visibility must be enforced by API and not only by hidden frontend columns.

## Field Visibility Rules

Requester must not receive or display:

- vendor
- supplier
- vendor part number
- PAS material number
- factory material number
- OM assignee
- FTV code
- OM-owned private attachment details

OM/internal roles may view procurement internals according to assignment and leader/admin permissions.
