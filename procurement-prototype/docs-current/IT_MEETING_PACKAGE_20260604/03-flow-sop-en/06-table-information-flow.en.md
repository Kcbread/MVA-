# 06 Table Information Flow

## OPM Tables

### `requester.requestWorkspace.table.addItem`

| Field | Definition |
| --- | --- |
| Reads | OM catalog, purchase records, classification master. |
| Writes | None; Add creates a draft. |
| Key Columns | Item, Detail / Spec, Source, Detail, Add. |
| Downstream | Draft Items. |

### `requester.requestWorkspace.table.draftItems`

| Field | Definition |
| --- | --- |
| Reads | Draft request rows. |
| Writes | Selected flag, Need Date, demand line/carryover metadata, remove draft, submit package. |
| Key Columns | Select, Item, Spec Summary, Need Date, Qty / Phases, Demand Rows, Status, Timeline, Actions, Detail. |
| Actions | Edit Demand, Submit Package to Manager B, Remove. |
| Downstream | Manager Approval, Demand Analysis. |

### `requester.addReuseItem.table.byItemHistory`

| Field | Definition |
| --- | --- |
| Reads | Completed/PO-issued history rows with item/spec/source phase/source qty/demand breakdown. |
| Writes | Current target project draft row, copied demand rows retargeted to current target/default phase, source reference fields. |
| Key Columns | Add, Source Project, Factory Material No., Item, Spec, Qty / Phase, Detail. |
| Actions | Add. |
| Downstream | OPM Request Workspace Draft Items. |

### `requester.addReuseItem.table.projectPackagePreview`

| Field | Definition |
| --- | --- |
| Reads | History rows grouped by Source Project + Source Phase + Source Package. |
| Writes | Multiple current target project draft rows after import; source qty is preserved but demand rows/raw phase totals retarget to current target/default phase. |
| Key Columns | Item, Spec, Source Package, Qty, Phase Summary, Detail. |
| Actions | Preview Package, Import Package to Request. |
| Downstream | OPM Request Workspace Draft Items; then Manager Approval after submit. |

### `requester.actionRequired.table.tasks`

| Field | Definition |
| --- | --- |
| Reads | Waiting Requester Confirmation, amendment confirmation rows. |
| Writes | Confirm Need, Cancel Request, Confirm Revised Request, Reject Amendment. |
| Key Columns | Project, Item, Spec, Total Qty, Quoted Amount, Quote Date, Attachment Status, Current Stage, Actions. |
| Downstream | OM Export Package or Cancelled. |

## Manager B Tables

### `manager.approval.table.pendingApproval`

| Field | Definition |
| --- | --- |
| Reads | Request rows where `status = Submitted`. |
| Writes | Decision, decision time, manager reason, routing patch. |
| Key Columns | Request ID, Project, Requester, Submitted At, Item, Affected Phases, Total Qty, Status, Reject Reason, Decision, Contact, Detail. |
| Actions | Approve, Reject to Requester / Dept DRI, Contact DRI, Detail. |
| Downstream | Approval History, Progress Tracking, Demand Analysis, OM queue. |

### `manager.progressTracking.table.progressRows`

| Field | Definition |
| --- | --- |
| Reads | Excel raw progress rows + active request rows. |
| Writes | None. |
| Key Columns | Year Project, Project, Item, Department, Quantity, Budget/PR/PO/Arrived Progress, Key Dates, Risk Reason, Detail. |
| Actions | Detail. |
| Downstream | Manager decision context. |

### `manager.demandAnalysis.table.costDashboard`

| Field | Definition |
| --- | --- |
| Reads | Submitted/approved/in-progress demand rows, USD canonical price helpers, carryover ledger/effective qty. |
| Writes | None. |
| Key Columns | Item, Spec, Price, MFG, FATP TE, FATP IQC, FATP PQE, WH, Q-LAB, REL, ENG1, ENG2, ENG3, IT, FAC, Total, Detail. |
| Actions | Cell/detail drilldown to Station Matrix. |
| Downstream | Manager demand analysis drilldown. |

### `manager.demandAnalysis.table.stationMatrix`

| Field | Definition |
| --- | --- |
| Reads | Submitted/approved/in-progress request stationBreakdown rows, carryover ledger/effective qty. |
| Writes | None. |
| Key Columns | Project, Item, Spec, Unit Price, Est. Amount, P1.0~MP station columns, Total Qty, Detail. |
| Filters | Project, Item, Phase, Station, 需求單位, Sort. |
| Actions | Detail, dashboard cell drill filter. |
| Downstream | Manager quantity reasonableness review. |

### `manager.approvalHistory.table.decisions`

| Field | Definition |
| --- | --- |
| Reads | Reviewed rows. |
| Writes | None. |
| Key Columns | Request ID, Project, Item, Phase Qty, Total Qty, Decision, Reason, Decision Time, Detail. |

## Shared Tables

### `shared.contactPopup.panel.contacts`

| Field | Definition |
| --- | --- |
| Reads | DRI / Leaders workbook rows, requester personas, project/process contact mappings. |
| Writes | None in v1; read-only popup. |
| Key Fields | Name, Email, Department, Role / Contact Type, Phone, Employee ID, Source. |
| Actions | Open Contact, Copy Contact Text. |
| Downstream | Manager Contact DRI, OM Contact DRI, manual follow-up. |

## OM Tables

### `om.submissionDashboard.table.stageRows`

| Field | Definition |
| --- | --- |
| Reads | G Project MVA EQ Request raw rows. |
| Writes | None. |
| Key Columns | Project, Item, Qty, Received Date, Current Stage, Days in Stage, Next Action, Quote Expiry, Pending Reason, Detail. |

### `om.pasDemandNo.table.pasRows`

| Field | Definition |
| --- | --- |
| Reads | Manager approved OM scope rows. |
| Writes | PAS Demand No, PAS result status, history. |
| Key Columns | Project, Phase, Item, Qty, PAS Demand, Item Context, Level 2/3, Owner, PAS Result Status, Next Step, Contact, Detail. |
| Actions | Move to PAS Quote Result, Reject to Requester / Dept DRI, Contact DRI, Detail. |
| Downstream | PAS Quote Result. |

### `om.pasQuoteResult.table.quoteRows`

| Field | Definition |
| --- | --- |
| Reads | PAS Demand No completed rows, waiting user confirmation rows, amendment rows. |
| Writes | PAS Material No, vendor, vendor part no, unit price VND input plus USD canonical price, quote date, quote received date, quote valid until, PDF, Excel, price decision status, Requester / Dept DRI routing status. |
| Key Columns | Project, Phase, Item / Qty, PAS Tracking, Quote Result, Completion Status, Actions, Detail. |
| Actions | Save Quote Info, Send to Requester, Reject to Requester / Dept DRI, Contact DRI, Detail. |
| Downstream | Requester Action Required, OM Export Package. |

### `om.submissionDashboard.table.quoteExpiryMonitor`

| Field | Definition |
| --- | --- |
| Reads | Quote result rows with quote path data. |
| Writes | None in v1; edit validity in PAS Quote Result. |
| Key Columns | Project, Item, PAS Demand No, PAS Material No, Valid Until, Expiry Status, Action Needed, Detail. |
| Actions | Detail. |
| Downstream | OM follow-up, MFG expiry reminder, Manager detail. |

### `om.exportPackage.table.exportRows`

| Field | Definition |
| --- | --- |
| Reads | Requester confirmed rows, price auto-cleared rows, and Budget Approver approved rows. |
| Writes | finalExportCostType, finalExportTarget, finalExportPackageCode, finalExportStatus, finalExportedAt. |
| Key Columns | Project, Phase, Item, Qty, Package Code, PAS Context, Quote Attachments, Requester Decision, Cost Type / Target, Export Status, Exported At, Actions, Contact, Detail. |
| Actions | Expense, Capex, Export Package, Mark Exported, Reject to Requester / Dept DRI. |
| Downstream | Buyer PR/PO. |

## Cross-Table Rules

- `Detail` does not write main process status.
- `Contact DRI` does not write main process status.
- `Demand Analysis` does not wait for approval completion; submitted demand is visible after submit.
- `Progress Tracking` is for process/progress; `Demand Analysis` is for cost/quantity reasonableness; do not merge them into one table.
- OM `PAS Demand No` only handles PAS Demand No; quote attachments belong only to `PAS Quote Result`.
- OM `PAS Quote Result` is the only place to enter PAS Material No, quote result, PDF/Excel, and quote validity.
- `Quote Valid Until` is required before `Send to Requester`; expiry reminder uses a 14-day threshold.
- `Source Project` in Reuse Item is source-only; target project always comes from the current OPM header.
- Reuse source phase is reference-only; imported/copied qty must be retargeted to the current OPM target/default phase.
- Requester Need Date is required before submit and must flow into Manager, OM, Export, timeline, and detail.
- Requester may declare line carryover; Dept DRI owns formal carryover review; Manager/OM consume effective qty/cost only.
- Cost calculations use USD canonical values. VND is display/export/input conversion through the monthly exchange rate.
- Saving / effective cost in Manager Demand Analysis comes from applied carryover ledger events only; pending/rejected carryover is visible but does not reduce cost.
- After OM saves quote info, price decision can Auto Clear or route to Dept DRI -> Budget Approver. Auto Cleared and Budget Approver Approved rows can enter Export Package without Requester confirmation.
- `Temporary Budget Request` input UI is scoped only to Requester `Request Workspace`; it must not be injected into Manager B, OM Purchasing, Contact popup, or Admin-only tables.
- `Contact` is a topbar popup utility, not a top-level tab.
