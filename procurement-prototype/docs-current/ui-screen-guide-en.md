# UI Screen Guide - 2026-06-08

This guide describes screens for IT implementation. It is not a source-code handoff.

## 1. Global Layout

- Role-aware top navigation.
- Dense, Excel-like tables where the business process expects spreadsheet input.
- Detail opens in modal/drawer; main tables stay scannable.
- Wide tables scroll inside table shells only.
- Page-level horizontal overflow is not allowed on desktop, tablet, or compact viewport.

## 2. Requester

Tabs:

| Tab | Purpose |
| --- | --- |
| Request Workspace | Main demand input worksheet. |
| Warehouse Inventory | Candidate / warehouse evidence view. |
| Action Required | Quote confirmation and revised request tasks. |
| Request Status | Draft/submitted/downstream status tracking. |

### Request Workspace

First visual task:

- choose `MFG` or `Non-MFG`
- select Project / Line
- click `Add Item`
- enter qty directly in the worksheet

Worksheet:

- one row = `Item / Spec`
- columns = all phase groups
- qty inputs are keyboard-friendly non-negative integer fields
- row total and phase totals are calculated
- `Remove` deletes the worksheet row directly without confirmation

### Add Item Popup

Popup layout:

- large modal
- Search + Lv1 / Lv2 / Lv3 filters
- Catalog / Reuse / Copy Demand / New Item Request segmented tabs
- table columns: `Add / Item / Detail / Spec / Action`

Requester should not see Source or Phase Trace as standalone columns.

## 3. Cost Manager

Tabs:

| Tab | Purpose |
| --- | --- |
| Approval | Review submitted demand. |
| Demand Analysis | Cost Dashboard and Station Matrix. |
| Progress Tracking | Procurement progress and owner aging. |
| Project Setup | Project access and setup. |

Demand Analysis:

- Cost Dashboard appears first.
- Station Matrix is the high-density drilldown.
- Carryover effective cost uses applied ledger events only.

## 4. OM Purchasing

Tabs:

| Tab | Purpose |
| --- | --- |
| Submission Dashboard | OM stage, pending owner, quote expiry overview. |
| PAS Demand No | Enter PAS Demand No and move rows to quote result. |
| PAS Quote Result | Enter PAS Material No, quote info, validity, attachments, and price decision. |
| Export Package | Prepare CFA/ECS package and mark exported. |

## 5. Shared Detail / Privacy

Requester detail is requester-safe and must hide procurement-internal fields.

Internal fields not shown to Requester:

- vendor
- supplier
- PAS material no
- factory material no
- OM assignee
- FTV

## 6. Demo Guidance

For IT demo, use screen sharing or the `IT-Demo` account on Mac mini. Do not provide source files or a direct static frontend URL as official handoff.
