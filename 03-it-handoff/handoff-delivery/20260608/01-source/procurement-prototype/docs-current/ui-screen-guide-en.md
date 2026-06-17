# UI Screen Guide

This document describes the current prototype screens for IT implementation. The scope is demand collection, manager review, role-based package preparation, and evidence-ready handoff. Actual purchasing execution is outside the current prototype scope unless represented as an external progress placeholder.

## 1. Global Layout

- Top bar shows system name, current role, and logout.
- Main navigation changes by role.
- Each role page uses tabs for major work areas.
- Tables use compact density and sticky headers.
- Detail information is opened through a modal instead of expanding the main table.
- Toast messages are used for success and validation feedback.
- Confirm modal is used only for destructive or high-risk actions.

## 2. Department Item Request

Role: `User A / DRI`

Tabs:

| Tab | Purpose | Main Interaction |
| --- | --- | --- |
| Request | Build request draft and submit demand | Add item, edit phase quantity, submit selected rows |
| History | Reuse approved historical demand | Search by project/source, add to request draft |
| Demand Tracking | Read-only demand reference | View planned demand, carryover, need to buy, risk |
| My Submissions | Track submitted demand | View status, manager reason, package progress |

Key UI rules:

- `Request` is the only tab where demand is submitted to Manager B.
- Legacy Search / History items open `Complete Material Information` before request draft if not standardized.
- `Create New Material` in Request opens the same modal.
- Complete Material Information uses LV1 -> LV2 -> LV3 first, then LV123-scoped fuzzy Standard Part Name search results.
- Up to 20 standard-name matches stay inline. Larger LV123-scoped result sets use `Open all results` and a scrollable picker modal.
- History multi-select adds already standardized rows immediately and opens `Standardize Selected Items` for the remaining legacy rows.
- Request draft uses `Complete Selected Materials` to finish one or many incomplete legacy rows before submit.
- New Material rows show `Material No. Pending` after Add to Request and only receive a formal Material No. when PR Created or PO Issued evidence is saved.
- `Demand Tracking` is read-only and has no Add action.
- Submitted / Approved / Rejected rows are read-only for User A.
- Draft rows can be edited and submitted. Rejected rows require a new DRI correction flow.

## 3. Manager Approval

Role: `Manager B`

Tabs:

| Tab | Purpose | Main Interaction |
| --- | --- | --- |
| Review Queue | Approve or reject submitted demand | Bulk action or row-level Approve / Reject to DRI |
| Project Cost View | Review cost and demand context | Read-only summary |
| Project Setup | Maintain project code and phase access | Save and open project, open/close to User A |
| Demand Tracking | Review phase-level demand status | Read-only summary |
| Review History | View past manager decisions | Read-only history and detail |

Key UI rules:

- Review Queue shows direct row buttons: `Approve`, `Reject to DRI`.
- Reject to DRI requires a reason.
- Approve does not require a reason.
- Project Setup is separated from Demand Tracking.
- Demand Tracking stays read-only.

## 4. MFG Demand Coordination

Role: `MFG Coordinator`

Tabs:

| Tab | Purpose | Main Interaction |
| --- | --- | --- |
| Collection Status | Check MFG line / phase input completeness | Monitor required / completed / missing rows |
| Package Queue | Prepare MFG demand package | Review package, export MFG RFQ / package Excel |
| External Progress | Record downstream status placeholder and evidence | Update status, attach screenshot / file / pasted text |
| History | View package and action history | Read-only audit trail |

Key UI rules:

- Main screen focuses on collection completeness, not full Excel detail.
- Full package fields are shown in detail modal or exported file.
- MFG Coordinator is responsible for MFG package readiness, not IT / OM PAS review.

## 5. OM Purchasing

Role: `OM Purchasing`

Tabs:

| Tab | Purpose | Main Interaction |
| --- | --- | --- |
| PAS Review | Record PAS-related status for IT / OM Buy demand | Update PAS status, project code, budget amount, comment |
| Demand Finalization | Consolidate approved OM demand buckets | Review bucket demand and move to quotation |
| Quotation | Maintain final spec, quote info, and quote PDF | Upload PDF and save quote info |
| Package Submission | Export package and update external progress | Export Excel / PDF and attach evidence |
| External Progress | Record external status placeholder and evidence | Update status and evidence |
| Activity History | View quote/package activity | Read-only audit trail |

Key UI rules:

- OM Purchasing owns IT / OM Buy demand collection after manager approval.
- OM demand can be bucket-based, such as `PC`, `IPC(A)`, `Monitor`, `Keyboard`.
- Final model/spec can be completed by OM later.
- OM Excel / PDF output is package-level, not one-off row output.

## 6. Buyer / External Progress

Role: `Buyer`

Current purpose:

- Placeholder for downstream status and evidence.
- Used to show how external system results can be tracked later.
- Actual procurement execution details are not part of the current demand collection scope.

Main fields:

- External system
- External request number
- PR number
- PO number
- Status
- Evidence
- Buyer note

## 7. Shared Modals

### Item Detail Modal

Shows:

- item name
- detail/spec
- material no. / material name
- project
- phase quantity
- status
- manager reason
- package timeline

### External Progress Modal

Shows:

- progress status
- external system
- external request number
- PR / PO fields if needed in future phases
- pasted external result
- screenshot upload
- evidence file upload
- reason / note

## 8. Output Summary

| Output | Owner | Format |
| --- | --- | --- |
| MFG Package / RFQ Excel | MFG Coordinator | `.xlsx` |
| RFQ Email Draft | MFG Coordinator | copyable text |
| OM Excel Package | OM Purchasing | `.xlsx` |
| Quote PDF | OM Purchasing | `.pdf` |
| Evidence Timeline | System | in-system record |
