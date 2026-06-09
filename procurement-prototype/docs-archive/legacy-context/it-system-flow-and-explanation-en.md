# IT System Flow and Functional Explanation

This document is the English handoff version for IT. It describes the current target workflow of the procurement prototype in a system-oriented way, including role ownership, end-to-end flow, output files, and key tracking points.

## 1. Goal

The system replaces fragmented email-based purchasing coordination with a traceable workflow for:

- demand collection
- manager approval
- PAS information handoff for OM / IT scope
- RFQ and quotation coordination
- package submission tracking
- PR / PO progress tracking
- evidence and revision history

The purpose is not only request submission, but also to build a complete audit trail from demand initiation to external purchasing completion.

## 2. Role Ownership

| Role | Main Responsibility | What the Role Updates in System |
| --- | --- | --- |
| User A / DRI | Creates and submits demand | request draft, quantity by phase, new item request, supporting reason |
| Manager B | Reviews and decides demand | approve / return / reject, manager reason, project setup |
| MFG Coordinator | Collects MFG package completeness | collection status, package readiness, RFQ dispatch tracking when needed |
| OM Purchasing | Owns OM / IT package after approval and PAS | PAS result, final spec/model, quote info, quote PDF, OM Excel package, external progress |
| Sourcing | Handles supplier quotation for RFQ-required flow | vendor, quotation result, price, quote PDF |
| Buyer | Tracks external purchasing execution | external request no., PR no., PO no., external evidence, completion status |

Important rule:

- `Purchasing` is not a separate login role in the prototype.
- `Buyer` is the execution-tracking role for downstream PR / PO status.

## 3. End-to-End Flowchart

```mermaid
flowchart TD
  subgraph UA["User A / DRI"]
    UA1["Search reusable item or create new item"]
    UA2["Build Request Draft"]
    UA3["Enter phase quantity"]
    UA4["Submit to Manager B"]
    UA5["Track My Submissions"]
  end

  subgraph MB["Manager B"]
    MB1["Review Queue"]
    MB2["Demand Tracking / Project Cost View"]
    MB3{"Approve / Return / Reject"}
    MB4["Project Setup"]
  end

  subgraph RT["System Routing After Approval"]
    RT1{"Demand Type"}
    RT2["OM / IT Scope<br/>PAS required"]
    RT3["MFG / RFQ Scope"]
  end

  subgraph OM["OM Purchasing"]
    OM1["PAS Review"]
    OM2["Demand Collection"]
    OM3["Quotation Workbench"]
    OM4["Export OM Excel + Quote PDF"]
    OM5["Update External Progress"]
    OM6{"External Result"}
  end

  subgraph MC["MFG Coordinator"]
    MC1["Collection Status"]
    MC2["Check line / phase completeness"]
    MC3["Build MFG package"]
    MC4["RFQ Dispatch / Reply Tracking if needed"]
  end

  subgraph SO["Sourcing"]
    SO1["Receive RFQ task"]
    SO2["Supplier quotation"]
    SO3["Return quote result / price / PDF"]
  end

  subgraph BY["Buyer"]
    BY1["Receive package / external case"]
    BY2["Update external result and evidence"]
    BY3["Maintain PR No. / PO No."]
    BY4["PO Issued / Completed"]
  end

  subgraph OUT["System Outputs"]
    O1["MFG RFQ Excel (.xlsx)"]
    O2["RFQ Email Draft"]
    O3["OM Excel Package (.xlsx)"]
    O4["Quote PDF (.pdf)"]
    O5["System Timeline / Audit Trail"]
  end

  UA1 --> UA2 --> UA3 --> UA4 --> MB1
  MB4 -. "controls open project and phase" .-> UA1
  MB1 --> MB2 --> MB3
  MB3 -- "Return / Reject" --> UA5
  MB3 -- "Approve" --> RT1

  RT1 -- "OM / IT scope" --> RT2 --> OM1 --> OM2 --> OM3 --> OM4 --> OM5 --> OM6
  RT1 -- "MFG / RFQ scope" --> RT3 --> MC1 --> MC2 --> MC3
  MC3 --> MC4
  MC4 --> O1
  MC4 --> O2
  MC4 --> SO1 --> SO2 --> SO3 --> BY1

  OM4 --> O3
  OM4 --> O4
  OM5 --> O5
  OM6 -- "Accepted / Submitted" --> BY1
  OM6 -- "Returned - OM Fix" --> OM3
  OM6 -- "Returned - Request Revision" --> UA5

  BY1 --> BY2 --> BY3 --> BY4
  BY2 --> O5
  BY3 --> O5
  BY4 --> O5
  UA5 --> O5
```

## 4. Flow Explanation by Stage

### A. Demand Creation

User A starts from `Department Item Request`.

User A can:

- search reusable items
- copy from approved history
- create a new item draft
- enter phase quantity in request draft
- submit to Manager B

`Demand Tracking` is read-only. It is used only for review of:

- planned demand
- carryover
- need to buy
- risk

It is not a request-creation entry point.

### B. Manager Approval

Manager B works in `Review Queue`.

Manager B can:

- approve
- return with reason
- reject with reason

Manager B also uses:

- `Project Cost View` for cost visibility
- `Demand Tracking` for phase-level summary
- `Project Setup` to maintain project code, current phase, and User A access

After approval, the system routes the request to one of two main paths:

- OM / IT scope
- MFG / RFQ scope

### C. OM / IT Scope Path

OM / IT scope does not go directly to quote handling.

It first enters `PAS Review`, where OM Purchasing maintains:

- PAS status
- PAS project code
- PAS budget amount
- PAS comment

After PAS is approved, the row moves to `Demand Collection`, then to `Quotation Workbench`.

In `Quotation Workbench`, OM Purchasing maintains:

- final spec / model
- vendor
- price
- quote date
- quote expiry
- quote PDF

After quote information is ready, OM exports:

- OM Excel Package
- Quote PDF

OM then records downstream external progress with status and evidence.

### D. MFG / RFQ Scope Path

MFG demand goes to `MFG Coordinator`.

The coordinator does not own IT PAS review. The coordinator focuses on:

- line / phase completeness
- package readiness
- missing input follow-up

If supplier quotation is required, the coordinator prepares RFQ flow:

- RFQ Excel
- email draft
- reply tracking

If sourcing is involved, `Sourcing` updates:

- vendor
- quotation result
- price
- quote PDF

After package readiness is complete, the downstream handoff continues to Buyer tracking.

### E. Buyer / External Progress Path

Buyer tracks the downstream execution after package submission.

Buyer maintains:

- external request no.
- PR no.
- PO no.
- evidence
- completion status

The system does not automatically decide CFA or ECS path. That remains governed by external business rules and is tracked through returned evidence and status updates.

## 5. Output Files

| Output | Owner | Format | Purpose |
| --- | --- | --- | --- |
| MFG RFQ Excel | MFG Coordinator | `.xlsx` | RFQ package for supplier quotation |
| RFQ Email Draft | MFG Coordinator | copyable text | Email subject/body for outside communication |
| OM Excel Package | OM Purchasing | `.xlsx` | Formal OM submission package |
| Quote PDF | OM Purchasing / Sourcing | `.pdf` | Quote evidence attached to package |
| External Evidence | OM Purchasing / Buyer | screenshot / pasted text / file | Proof of submission, return, PR, PO, completion |

## 6. Core Tracking Logic

The system must keep a full timeline per request or package.

Each progress event should be traceable with:

- current status
- current owner
- reason / note
- timestamp
- external request no.
- PR no.
- PO no.
- evidence
- revision history

Typical progress statuses include:

- `Package Preparing`
- `Package Ready`
- `Submitted to External System`
- `External Review`
- `External Returned`
- `Revision In Progress`
- `PR Created`
- `PO Issued`
- `Completed`

## 7. Key IT Notes

- `Demand Tracking` is read-only and must not create request rows.
- `Project Setup` is a separate Manager tab and controls project availability and current phase.
- Manager approval is the routing gate.
- OM Purchasing and MFG Coordinator are different paths and must remain separate in ownership and UI.
- OM Purchasing owns PAS and OM package output.
- MFG Coordinator owns MFG completeness and RFQ package preparation.
- Buyer owns downstream external result, PR / PO, and completion evidence.
- All important state changes must write to in-system history instead of only changing current status.

