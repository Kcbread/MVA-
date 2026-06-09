# UAT Acceptance Scenarios

## Business Workflow

- Requester creates MFG and Non-MFG demand rows with Need Date.
- Requester submits package to Dept DRI.
- Dept DRI approve sends row to Cost Manager.
- Dept DRI reject sends row to Requester Action Required with reason.
- Cost Manager approve sends row to OM Leader intake.
- Cost Manager reject sends row to Requester Action Required with reason.
- OM Leader assigns row to Giang/Linh/Mai.
- OM Purchasing can operate only assigned rows.
- OM Purchasing records PAS Demand No.
- OM Purchasing records quote screenshot/image, quote Excel, quote price, quote valid until.
- Quote price `10.00 -> 10.40` auto clears.
- Quote price `10.00 -> 10.41` routes Dept DRI -> Budget Approver.
- Temporary Budget quote always routes Dept DRI -> Budget Approver.
- Budget Approver approve moves row to OM Export Package.
- Budget Approver reject returns to Requester Action Required.
- OM Export Package creates Buyer Handoff owner/stage.

## Permissions

- Requester cannot see vendor, supplier, PAS material, factory material, OM assignee, or FTV.
- OM Member cannot assign rows.
- OM Leader can assign/reassign/clear.
- Admin can configure, but does not silently perform business approval.
- Requester cannot download OM-internal attachments.

## Data Flow

- Every workflow mutation writes an audit event.
- Reject keeps previous stage, reason, actor, timestamp, and next owner.
- Warehouse pending candidate does not reduce cost.
- Dept DRI locked warehouse/carryover event updates effective cost.
- Buyer Handoff days are distinct from OM days pending.
