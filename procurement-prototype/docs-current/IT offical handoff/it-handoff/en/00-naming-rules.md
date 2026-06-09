# 00 Naming Rules

## Purpose

This document defines the official naming for the near-term IT implementation. If older docs or prototype labels conflict with this file, this file wins.

## Role Names

| Official Name | Meaning |
| --- | --- |
| `Requester` | Demand requester. Requester and IE are treated as the same role in this prototype. |
| `Manager B` | Approver. Owns approval, demand progress review, and quantity reasonableness checks. |
| `OM Leader` | OM buy owner. Can maintain monthly USD-to-VND exchange rate and perform OM document operations. |
| `OM Member` | OM buy operator. Can use exchange rates and process PAS / Quote / Export work, but cannot edit rates. |
| `OM Purchasing` | Umbrella process name covering OM Leader and OM Member. |
| `Dept DRI` | Department reviewer; owns first price exception review and formal carryover review. |
| `Budget Approver` | Final project-level price escalation approver. |

## Tab Names

### Requester

| Tab | Purpose |
| --- | --- |
| `Request Workspace` | Create items, open Add / Reuse Item popup, enter Need Date and demand rows, and submit to Manager B. |
| `Action Required` | Requester tasks such as quote confirmation and revised request confirmation. |
| `Request Status` | Dense tracking for own draft/submitted demand and downstream timeline. It replaces the old split between My Demand Overview and Request Status. |

### Manager B

| Tab | Purpose |
| --- | --- |
| `Approval` | Approval workspace containing Pending Approval and Approval History. |
| `Demand Analysis` | Demand analysis workspace; shows Cost Dashboard first, then drills into Station Matrix. |
| `Progress Tracking` | Pivot-like Budget / PR / PO / Arrived / late / pending dashboard. |
| `Project Setup` | Project access and basic setup. |

#### Demand Analysis Inner Tabs

| Inner Tab | Purpose |
| --- | --- |
| `Cost Dashboard` | First-level manager view for unit split item count, quantity, and amount across MFG / Non-MFG units. |
| `Station Matrix` | Second-level Excel-like wide table for phase x station quantity reasonableness. |

### OM Purchasing

| Tab | Purpose |
| --- | --- |
| `Submission Dashboard` | OM stage and pending overview. |
| `PAS Demand No` | Enter PAS Demand No after PAS/Bidding returns it. |
| `PAS Quote Result` | Enter PAS Material No, quote result, quote validity, attachments, and send to Requester. |
| `Quote Expiry Monitor` | Quote validity monitor inside `Submission Dashboard`; not a workflow tab. |
| `Export Package` | Export CFA/ECS package after Requester confirmation. |

#### Reuse Item Inner Tabs

| Inner Tab | Purpose |
| --- | --- |
| `Reuse by Item` | Add one historical item into the current Requester target project. |
| `Reuse by Project Package` | Preview and import a source project/phase/package set into the current Requester target project. |

## Requester Mapping Rule

Requester is not derived from station. It is resolved by this key:

```text
Project Family + Project Code + Demand Department -> Requester
```

Examples:

| Project Family | Project Code | Demand Department | Requester |
| --- | --- | --- | --- |
| `G` | `P26` / `P26 Demo Line` | `MFG` | `To Thi Phuong Anh` |
| `Non-G` | `LD8` / `MH2` / `BM2` | `MFG` | `Đặng Thị Ban` |

For MFG, the `Mainline / Packing / Supporting` station columns, including `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`, represent station demand and quantity analysis only. They must not be used to infer requester.

If mapping is missing, Admin setup must show `Unmapped Project / Need setup`; the system must not guess.

## Module ID Naming

Format:

```text
{role}.{moduleName}
```

Examples:

| Module ID | Meaning |
| --- | --- |
| `requester.requestWorkspace` | Requester demand creation, add/reuse, Need Date, and submit workspace. |
| `requester.demandEditor` | Item-level demand row editor. |
| `requester.addReuseItem.byItem` | Reuse a single historical completed item. |
| `requester.addReuseItem.byProjectPackage` | Reuse a package/group of historical items. |
| `manager.approvalQueue` | Manager approval queue. |
| `manager.quantityMatrix` | Manager phase x station quantity matrix. |
| `om.pasResultQueue` | OM PAS Demand No queue. |
| `om.quoteCompletion` | OM quote completion workbench. |
| `om.exportPackage` | OM CFA/ECS export workbench. |

## Table ID Naming

Format:

```text
{moduleId}.table.{tableName}
```

Examples:

| Table ID | Meaning |
| --- | --- |
| `requester.requestWorkspace.table.draftItems` | Requester draft items table. |
| `manager.approvalQueue.table.submittedRows` | Manager submitted approval rows. |
| `manager.quantityMatrix.table.stationMatrix` | Manager wide station matrix. |
| `om.quoteCompletion.table.quoteRows` | OM quote completion rows. |
| `shared.contactPopup.panel.contacts` | Cross-role topbar contact popup. |

## Action Names

| Action | Used By | Meaning |
| --- | --- | --- |
| `Approve` | Manager B | Approve a submitted row. |
| `Reject to Requester / Dept DRI` | Manager B / OM | Return to requester; reason required. |
| `Edit Demand` | Requester | Open item demand editor. |
| `Submit Package to Manager B` | Requester | Submit selected draft items as one package. |
| `Add` | Requester Add / Reuse Item | Copy one catalog or historical item into the current target project draft; full meaning goes in title/detail, not button text. |
| `Preview Package` | Requester Reuse by Project Package | Preview source project/phase/package rows before import. |
| `Import Package to Request` | Requester Reuse by Project Package | Copy previewed package rows into the current target project draft. |
| `Move to PAS Quote Result` | OM PAS Demand No | Move row after PAS Demand No is entered. |
| `Save Quote Info` | OM PAS Quote Result | Save quote fields and attachment status. |
| `Send to Requester` | OM PAS Quote Result | Send completed quote to Requester confirmation. |
| `Confirm Need` | Requester Action Required | Requester confirms the item is still needed. |
| `Cancel Request` | Requester Action Required | Requester cancels the request; reason required. |
| `Expense` | OM Export Package | Select expense purchasing; downstream target displays as ECS and package code is generated. |
| `Capex` | OM Export Package | Select capital purchasing; downstream target displays as CFA and package code is generated. |
| `Export Package` | OM Export Package | Use one action to prepare final export Excel package plus quote PDF package reference. |
| `Mark Exported` | OM Export Package | Mark CFA/ECS export complete; Buyer can continue. |

## Status Names

| Status | Meaning |
| --- | --- |
| `Draft` | Requester draft, editable. |
| `Submitted` | Sent to Manager B, waiting approval. |
| `Approved` | Approved by Manager B. |
| `Rejected` | Returned to DRI by Manager B or OM. |
| `In Progress` | In downstream flow such as OM/PAS/Buyer. |
| `Waiting PAS Demand No` | OM is waiting for or entering PAS Demand No. |
| `PAS Quote Result Needed` | OM must complete PAS Material No, quote validity, quote, and attachments. |
| `Ready to Send Requester Confirmation` | Quote fields are complete and ready to send. |
| `Waiting Requester Confirmation` | Sent to Requester, waiting Confirm Need / Cancel Request. |
| `Requester Confirmed` | Requester confirmed the item is still needed. |
| `Ready for CFA` | OM prepared CFA package. |
| `Ready for ECS` | OM prepared ECS package. |
| `Exported to CFA` | Exported to CFA. |
| `Exported to ECS` | Exported to ECS. |
| `Buyer Received` | Buyer received downstream row. |

## Field Names

| Field | Definition |
| --- | --- |
| `PAS Demand No` | Entered by OM in `PAS Demand No` after PAS/Bidding returns it. |
| `PAS Material No` | Entered by OM in `PAS Quote Result` after bidding result; carried downstream. |
| `Quote Valid Until` | Entered by OM in `PAS Quote Result`; required before sending quote result to Requester. |
| `Expiry Status` | Derived from Quote Valid Until: Valid, Expiring Soon within 14 days, or Expired / Requote Required. |
| `Factory Material No` | Filled by Buyer/PUR after PO; only then enters Reuse Item history. |
| `需求單位` | Demand-origin unit, such as ENG1, MFG, or TE. |
| `Station` | Physical station, such as CG, BG, FATP, or Test. |
| `Demand Type` | `MFG` or `Non-MFG`. `MFG` requires Station and does not require 需求單位; `Non-MFG` requires 需求單位 and does not use Station. |
| `Phase` | P1.0, P1.1, EVT, DVT, PVT, MP. |
| `Demand Row` | One `Demand Type + Phase + Station or 需求單位 + Qty + Remark` row. MFG uses Station; Non-MFG uses 需求單位. |
| `Request Package` | Multi-item package submitted by OPM at once. |
| `Source Project` | History/package source filter only; never the target project for a new request. |
| `Source Phase` | Historical phase copied or previewed from reuse source rows. |
| `Source Package` | Historical package/group selected for package-based reuse. |
| `Add to` | Current Requester target project and default phase for reused rows. |
| `Final Export Package Code` | OM code in `{Process}-{Stage}-{ProjectCode}-MVA{YYMM}-{Seq}OM` format. |
| `Need Date` | Required date entered by Requester before submit; carried into Manager, OM, Export, timeline, and detail views. |
| `Currency Display` | Global display switch supporting `VND / USD`; cost/price calculations use USD canonical fields, while VND is display/export/input conversion through the monthly exchange rate. |
| `USD to VND Exchange Rate` | Monthly exchange rate maintained by OM Leader; OM Member can only consume it. |
| `Unit Price USD` | Canonical unit price for cost calculation. Legacy VND fields are converted into USD for calculation. |
| `Carryover From / Carryover Qty / Carryover Reason` | Line-level demand adjustment fields. Requester can declare carryover in Demand Editor; DRI owns formal review; Manager/OM only consume the impact. |
| `Price Decision Status` | Result after OM saves quote: Auto Cleared, Price Escalation Required, Dept DRI Approved, Budget Approver Approved, or Rejected. |

## Deprecated Names

Do not use these names for the near-term IT implementation:

- `Demand Tracking`
- `PAS Review`
- `Quotation`
- `Package Submission`
- `Review Queue`
- `Project Cost View`
- `Requester Request`

## Implementation Guards

- `Temporary Budget Request` input panel may render only inside Requester `Request Workspace`; it must never be injected into Manager B, OM Purchasing, the Contact popup, or Admin-only views.
- `Contact` is a topbar popup utility, not a top-level tab or late DOM patch.
