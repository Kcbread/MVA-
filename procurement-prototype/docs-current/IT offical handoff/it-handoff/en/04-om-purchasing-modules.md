# 04 OM Purchasing Modules

## Role Split

| Role | Permission |
| --- | --- |
| `OM Leader` | Can maintain monthly `USD to VND Exchange Rate` and perform PAS / Quote / Export document operations. |
| `OM Member` | Can view/use the exchange rate and process PAS / Quote / Export work, but cannot edit the rate. |

### Exchange Rate

- Cost and price calculations use USD canonical fields.
- Global `Currency Display` supports `VND / USD`.
- VND display/export/input values use the monthly `USD to VND Exchange Rate`.
- If the current month has no rate, the system fallback rate is used and the UI shows `Fallback Rate`.

## Current OM Purchasing Tabs

- `Submission Dashboard`
- `PAS Demand No`
- `PAS Quote Result`
- `Export Package`

The OM workspace is intentionally task-based. PAS Demand No records the PAS number only; PAS Quote Result records the bidding/quote result and quote validity; Quote Expiry is monitored inside Submission Dashboard, not a workflow step.

## `om.submissionDashboard`

| Field | Definition |
| --- | --- |
| Business Owner | OM Purchasing / OM Leader |
| Purpose | Review OM working stages and pending items without mixing Budget/PR/PO/Arrived progress into the main OM workbench. |
| Input Data | `G Project MVA EQ Request` raw rows. |
| Output / Mutation | None, read-only. |

### KPI

- New Received
- Waiting PAS Demand No
- Waiting Quote Result
- Waiting Requester
- Export Pending
- Over SLA
- Expired Quote
- Expiring Soon

### Visible Columns

- Project
- Item
- Qty
- Received Date
- Current Stage
- Days in Stage
- Next Action
- Quote Expiry
- Pending Reason
- Detail

### Tracking Rules

- `Received Date` is when the row entered the OM workflow after Cost Manager authorization.
- `Current Stage` is the active OM work step: PAS Demand No, PAS Quote Result, Waiting Requester, or Export Package.
- `Days in Stage` counts how long the row has stayed in the current OM stage.
- `Next Action` tells the operator what should happen next.
- `Quote Expiry` is a monitor field only; validity is edited in `PAS Quote Result`.
- Detail modal keeps the full stage timeline.

## `om.pasDemandNo`

| Field | Definition |
| --- | --- |
| Purpose | OM enters PAS Demand No after PAS/Bidding returns it. |
| Input Data | Cost Manager authorized OM scope rows. |
| Output / Mutation | `pasDemandNo`, PAS result timestamp, OM history event. |
| Next Consumers | `om.pasQuoteResult`. |

### Visible Columns

| Column | Meaning |
| --- | --- |
| Project | Project. |
| Phase | Current project phase/stage label. |
| Item | Item/spec. |
| Qty | Total quantity. |
| PAS Demand | PAS Demand No input/status. |
| Item Context | PAS part/spec context. |
| Level 2 / Level 3 | OM category. |
| CPD-IEP Owner | OM owner. |
| PAS Result Status | Waiting or entered. |
| Next Step | Move to PAS Quote Result. |
| Contact | Contact DRI. |
| Detail | Detail modal. |

### Actions

| Action | Precondition | Success Result |
| --- | --- | --- |
| `Move to PAS Quote Result` | `PAS Demand No` entered. | Row enters `PAS Quote Result`. |
| `Reject to Requester / Dept DRI` | Reason required. | Row rejected. |
| `Contact DRI` | Any row. | Opens contact modal. |
| `Detail` | Any row. | Opens detail. |

### Rules

- This page does not upload screenshot/image and Excel.
- This page does not handle quote price.
- PAS Demand No carries into PAS Quote Result / Export Package / Buyer / Detail.

## `om.pasQuoteResult`

| Field | Definition |
| --- | --- |
| Purpose | Enter PAS quote / bidding result in one compact quote result card, including quote validity and attachments, and trigger the system price decision. |
| Input Data | Rows with PAS Demand No or quote completion stage rows. |
| Output / Mutation | `pasMaterialNo`, vendor, vendor part no, unit price VND input plus USD canonical value, quote date, `quoteReceivedAt`, `quoteValidUntil`, `quoteStatus`, screenshot/image, Excel, price decision status, Requester / Dept DRI routing status. |
| Next Consumers | `requester.actionRequired`, `om.quoteExpiryMonitor`, `om.exportPackage`. |

### Required Before Save Quote Info

- PAS Material No
- Vendor
- Vendor Part No
- Unit Price
- Quote Date
- Quote Valid Until
- Quote screenshot/image
- Quote Excel

### Visible Columns

- Project
- Phase
- Item / Qty
- PAS Tracking
- Quote Result
- Completion Status
- Actions
- Detail

### Quote Result Card

The `Quote Result` card contains:

- PAS Material No
- Vendor
- Vendor Part No.
- Unit Price
- Quote Date
- Quote Received Date
- Quote Valid Until
- Quote screenshot/image
- Quote Excel
- Expiry status

### Quote Validity Rules

- `Quote Received Date` defaults to `Quote Date` when blank.
- `Quote Valid Until` is required before `Save Quote Info` / price decision.
- `Valid`: more than 10 days remain.
- `Expiring Soon`: 0-10 days remain.
- `Expired / Requote Required`: already past validity date.
- Quote validity is rendered inside the `Quote Result` card only; it must not be injected into unrelated role pages by DOM observers.

### Actions

| Action | Precondition | Success Result |
| --- | --- | --- |
| `Save Quote Info` | Required fields complete. | Saves quote fields / attachment flags and creates Auto Cleared or Price Escalation Required state. |
| `Reject to Requester / Dept DRI` | Reason required. | Row rejected. |
| `Detail` | Any row. | Opens detail. |

### Price Decision Rules

After `Save Quote Info`, the system compares quote price against history price:

- Absolute USD delta `quoteUnitPriceUsd - historyUnitPriceUsd <= 0.40` = `Auto Cleared`.
- Absolute USD delta `quoteUnitPriceUsd - historyUnitPriceUsd > 0.40`, no history price, new item, or Temporary Budget = price exception.
- Missing history price, temporary budget request, or over-threshold quote = `Price Escalation Required`.
- `Auto Cleared` rows skip Requester confirmation and can enter `Export Package`.
- `Price Escalation Required` rows go to `Dept DRI -> Budget Approver`; only Budget Approver approval can release them to `Export Package`.

### Requester Visibility Rule

Requester must not see vendor / vendor part no / supplier. Requester only sees:

- Item
- Spec
- Total Qty
- Quoted Amount
- Quote Date
- Attachment Status
- Confirm / Cancel action

## `om.quoteExpiryMonitor`

| Field | Definition |
| --- | --- |
| Purpose | Quote validity monitor inside `Submission Dashboard`; it is not a workflow step. |
| Input Data | Rows with quote/bidding path fields: PAS Demand No, PAS Material No, quote date, quote valid until, screenshot/image and Excel, or vendor. |
| Output / Mutation | None in v1; users edit validity from `PAS Quote Result`. |
| Next Consumers | OM follow-up, MFG quote expiry reminders, Manager detail. |

### Status Rules

- `Valid`: more than 10 days remain.
- `Expiring Soon`: 0-10 days remain.
- `Expired / Requote Required`: validity date has passed.
- `Missing Valid Until`: quote exists but cannot be tracked yet.

### Visible Columns

- Project
- Phase
- Item
- PAS Demand No
- PAS Material No
- Quote Date
- Valid Until
- Expiry Status
- Action Needed
- Detail

## `om.exportPackage`

| Field | Definition |
| --- | --- |
| Purpose | After price auto-clear or Budget Approver approval, choose cost type and use one `Export Package` action to prepare the final export Excel package plus quote screenshot/image package. |
| Input Data | Rows where `Auto Cleared` or `Budget Approver Approved`. |
| Output / Mutation | `finalExportCostType`, final export target/status/package code/export timestamp. |
| Next Consumers | Buyer PR/PO. |

### Visible Columns

- Project
- Phase
- Item
- Qty
- Package Code
- PAS Context
- Quote Attachments
- Requester Decision
- Cost Type / Target
- Export Status
- Exported At
- Actions
- Contact
- Detail

### Actions

| Action | Precondition | Success Result |
| --- | --- | --- |
| `Expense` | price-cleared or Budget Approver approved; not exported. | cost type = Expense; target = ECS; package code generated. |
| `Capex` | price-cleared or Budget Approver approved; not exported. | cost type = Capex; target = CFA; package code generated. |
| `Export Package` | Expense/Capex selected, quote screenshot/image and quote Excel both available. | Prepares both final export Excel package and quote screenshot/image package reference. |
| `Mark Exported` | Expense/Capex selected and package ready. | status = Exported to CFA/ECS; Buyer can see it. |
| `Reject to Requester / Dept DRI` | Not exported and reason required. | Row rejected. |

### Cost Type / Target Rules

- `Expense` is the OM user decision; Buyer Handoff target displays as `ECS`.
- `Capex` is the OM user decision; Buyer Handoff target displays as `CFA`.
- `CFA / ECS` is package/Buyer Handoff mapping, not the only business decision label.
- PAS Demand No, PAS Material No, quote screenshot/image, quote Excel, and quote validity are readonly in `Export Package`; their official input point remains `PAS Quote Result`.

### Package Code

```text
{Process}-{Stage}-{ProjectCode}-MVA{YYMM}-{Seq}OM
```

Example:

```text
FATP-MP-CGY4-MVA2604-21OM
```

### Rules

- Payment Method is locked to `MVA`.
- CFA/ECS are both PR entry points.
- Buyer only handles PO / external progress / evidence.
