# Current System Flowchart

This flowchart describes the currently implemented procurement prototype after the role-model correction.

Important role rule:

- `Purchasing` is not a separate login role.
- `OM Purchasing` handles IT / OM Buy PAS Review, PAS-approved demand collection, and OM-side sourcing work.
- `MFG Coordinator` handles MFG line / phase demand collection and package readiness.
- `Sourcing` performs supplier quotation for RFQs when needed.
- `Buyer` tracks external system request no., PR No., PO No., status, and evidence. The prototype does not decide CFA vs ECS.

## Mermaid Flowchart

```mermaid
flowchart TD
  subgraph UA["User A / DRI - Department Item Request"]
    UA1["Natural Search / History / Create New Item"]
    UA2["Request Draft<br/>Enter phase quantity"]
    UA3["Submit MFG input / request"]
    UA4["My Submissions<br/>Track status, reject reason, PR / PO timeline"]
  end

  subgraph MB["Manager B - Approval"]
    MB1["Review Queue"]
    MB2["Demand Tracking / Project Cost View"]
    MB3{"Approve / Return / Reject"}
  end

  subgraph RT["System Routing after Approval"]
    RT1{"OM Buy Scope?"}
    RT2["PAS Required - OM Buy Scope<br/>PC / IPC / Monitor / Keyboard / Mouse / IT recurring bucket"]
    RT4["PAS Review<br/>Longhua IE review, budget amount, project code"]
    RT3["MFG / Non-IT / Sourcing Needed<br/>RFQ or Buyer package path"]
  end

  subgraph OM["OM Purchasing - PAS-approved IT / OM Buy Package Owner"]
    OM1["Demand Collection<br/>Collect PAS-approved OM bucket demand"]
    OM2["Quotation Workbench<br/>Confirm final spec/model, vendor, price, quote PDF"]
    OM3["Export OM Excel + Quote PDF package"]
    OM4{"External Progress<br/>Status + Evidence"}
    OM5["Submitted / Accepted<br/>Send to Buyer tracking"]
    OM6["External Returned - OM Fix<br/>Revise package and re-export"]
    OM7["External Returned - Request Revision<br/>Return to User A / Manager B flow"]
  end

  subgraph HC["MFG Coordinator - MFG Demand Collection"]
    HC1["MFG Collection Status<br/>Project / phase / line completeness"]
    HC2["Check Mainline / Packing / Supporting input"]
    HC3{"Ready for Manager package?"}
    HC4["Return missing line / area to owner"]
    HC5["Submit MFG Demand Package to Manager B"]
  end

  subgraph SO["Sourcing - RFQ Execution"]
    SO1["Receive RFQ task"]
    SO2["Quote suppliers"]
    SO3["Return vendor / price / quote result / quote PDF"]
  end

  subgraph BY["Buyer - External PR / PO Tracking"]
    BY1["Receive external package"]
    BY2["Record external system result<br/>screenshot / pasted text / file evidence"]
    BY3["Maintain PR No. / PO No."]
    BY4["PO Issued / Completed<br/>with evidence"]
  end

  subgraph OUT["Output Formats"]
    O1["MFG / Sourcing RFQ Excel<br/>.xlsx"]
    O2["RFQ Email Draft<br/>copyable subject/body"]
    O3["OM Purchasing Excel Package<br/>.xlsx, two sheets"]
    O4["Quote PDF Package<br/>.pdf"]
    O5["System Audit Trail<br/>in-system history"]
  end

  UA1 --> UA2 --> UA3 --> HC1
  HC1 --> HC2 --> HC3
  HC3 -- "Missing data" --> HC4 --> UA2
  HC3 -- "Ready" --> HC5 --> MB1
  MB1 --> MB2 --> MB3
  MB3 -- "Return / Reject" --> UA4
  MB3 -- "Approve" --> RT1
  RT1 -- "OM Buy Scope" --> RT2 --> RT4 --> OM1
  RT1 -- "MFG / Non-IT / Sourcing needed" --> RT3 --> SO1
  OM1 --> OM2 --> OM3 --> OM4
  OM3 --> O3
  OM3 --> O4
  OM4 -- "Submitted / Accepted" --> OM5 --> BY1
  OM4 -- "OM Fix" --> OM6 --> OM2
  OM4 -- "Request Revision" --> OM7 --> UA4
  SO1 --> SO2 --> SO3 --> BY1
  BY1 --> BY2 --> BY3 --> BY4
  UA4 -. "visibility" .-> O5
  HC5 -. "audit" .-> O5
  OM4 -. "audit" .-> O5
  BY4 -. "audit" .-> O5
```

## Role Differences

| Role | Main Responsibility | Typical Output / Action |
| --- | --- | --- |
| OM Purchasing | PAS-approved IT / OM Buy demand collection, final spec/model confirmation, quotation, quote PDF, OM Excel package. | OM Excel `.xlsx`, quote PDF `.pdf`, package result, Buyer handoff. |
| MFG Coordinator | MFG line / phase demand collection, completeness check, package readiness for Manager B. | MFG Demand Package, collection status, missing line / area follow-up. |
| Sourcing | Supplier quotation for RFQ tasks when needed. | Vendor, price, quote result, quote PDF. |
| Buyer | Tracks external system result and PR / PO completion. | External request no., PR No., PO No., evidence, completion status. |

## Output File Formats

| Output | Owner | Format | Purpose |
| --- | --- | --- | --- |
| RFQ Excel | MFG / Sourcing flow | `.xlsx` | Split by Sourcing Owner for supplier quotation when needed. |
| RFQ Email Draft | MFG / Sourcing flow | Copyable subject/body | Used to send RFQ package outside the prototype. |
| OM Purchasing Excel Package | OM Purchasing | `.xlsx` | Formal OM package with `Project budget-summary table` and detail sheet. |
| Quote PDF Package | OM Purchasing / Sourcing | `.pdf` | Quote evidence attached to package or RFQ result. |
| Activity / History Records | System | In-system audit trail | Tracks RFQ dispatch, Sourcing reply, OM package, external progress evidence, Buyer PR / PO, and revisions. |
