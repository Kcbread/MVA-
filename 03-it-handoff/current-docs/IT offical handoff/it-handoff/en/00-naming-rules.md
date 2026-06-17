# 00 Naming Rules

## Purpose

This document defines official naming for near-term IT implementation. If older docs, prototype labels, or zip snapshots conflict with this file, this file and `IT_DELIVERY_LATEST_REVIEW_20260615.md` win.

## Role Names

| Official Name | Meaning |
| --- | --- |
| `Requester` | Creates worksheet demand, submits, and tracks status. |
| `Dept DRI` | First scoped business reviewer for requester submission, unit-owned warehouse/carryover, and first price exception review. |
| `Cost Manager` | Cost authorization owner after Dept DRI; uses Cost Review for final authorization. |
| `OM Leader` | OM lead for assignment, exchange rate, feedback triage, and OM tracking. |
| `OM Purchasing` | OM operator for assigned PAS Demand No, PAS Quote Result, and Export Package work. |
| `Budget Approver` | Final approver for quote-stage price/budget exceptions. |
| `Admin` | System setup and governance; no business approval. |
| `Buyer Handoff` | Post-OM-export PR / PO ownership stage; do not use legacy post-export wording as primary user-facing copy. |

## Tab Names

### Requester

| Tab | Purpose |
| --- | --- |
| `Request Workspace` | Create item/spec rows, enter all-phase worksheet quantities, Save Draft, Submit. |
| `Action Required` | Requester tasks for reject / revise / confirmation. |
| `Request Status` | Track own draft/submitted demand, pending owner, and timeline. |

### Dept DRI

| Tab | Purpose |
| --- | --- |
| `Dept Review` | Submission / stock / carryover / price exception review with dashboard-first quantity evidence. |
| `Review History` | Dept DRI handled events and audit history. |

### Cost Manager

| Tab | Purpose |
| --- | --- |
| `Cost Review` | Final authorization queue with embedded Demand Cost Dashboard and Station Matrix evidence. |
| `Review History` | Cost Manager decision history. |

### OM

| Tab | Purpose |
| --- | --- |
| `OM Submission Dashboard` | OM stage, pending owner, assignment, and quote expiry overview. |
| `PAS Demand No` | Enter PAS Demand No. |
| `PAS Quote Result` | Enter PAS Material No, vendor, quote price, quote screenshot/image, quote Excel, valid until. |
| `Export Package` | Export after Auto Cleared or Budget Approver approved state. |

### Budget Approver

| Tab | Purpose |
| --- | --- |
| `Budget Review` | Final approval for price / budget exceptions with embedded quantity evidence. |
| `Review History` | Budget approval history. |

## Module ID Naming

| Module ID | Meaning |
| --- | --- |
| `requester.requestWorkspace` | Requester worksheet demand creation. |
| `requester.addItemPopup` | Catalog / Reuse / Copy Demand / New Item Request add entrypoint. |
| `shared.workflowStatus` | Shared pending owner / current stage / days pending model. |
| `shared.approvalQuantityReview` | Shared quantity evidence for Dept DRI / Cost Manager / Budget Approver. |
| `deptDri.deptReview` | Dept DRI review shell. |
| `costManager.costReview` | Cost Manager final authorization shell. |
| `budgetApprover.budgetReview` | Budget exception final review shell. |
| `om.submissionDashboard` | OM work tracking. |
| `om.pasDemandNo` | PAS Demand No input. |
| `om.pasQuoteResult` | Quote result and price decision input. |
| `om.exportPackage` | Export package workflow. |
| `buyerHandoff.status` | Post-export Buyer Handoff status. |

## Action Names

| Action | Used By | Meaning |
| --- | --- | --- |
| `Save Draft` | Requester | Save the current worksheet; Need Date not required. |
| `Submit` | Requester | Submit the current line + MFG/Non-MFG worksheet; requires Need Date and at least one qty > 0. |
| `Approve` | Dept DRI / Budget Approver | Approve the current review stage. |
| `Authorize` | Cost Manager | Final cost authorization. |
| `Reject` | Review roles / OM | Reason required; route to the configured next owner. |
| `Save PAS Demand No` | OM Purchasing | Save PAS Demand No. |
| `Save Quote Info` | OM Purchasing | Save quote result, attachments, validity, and trigger price decision. |
| `Export Package` | OM Purchasing | Create the export package. |
| `Mark Exported` | OM Purchasing | Move to Buyer Handoff. |
| `Repair FTV Mapping` | OM / Admin | Repair missing active FTV mapping before external import export. |
| `Review Material Coding` | OM / Admin | Repair PK / Factory Material No prefix/category mapping; never guess codes automatically. |

## Status Names

| Status | Meaning |
| --- | --- |
| `Draft` | Requester draft, not submitted. |
| `Dept DRI Review` | Waiting for Dept DRI submission review. |
| `Cost Manager Review` | Waiting for Cost Manager final authorization. |
| `OM Intake / Assignment` | Waiting for OM Leader assign / auto-assign. |
| `PAS Demand No` | Waiting for OM Purchasing to enter PAS Demand No. |
| `PAS Quote Result` | Waiting for OM Purchasing to enter quote result. |
| `Auto Cleared` | USD delta is within 0.40, can move to export. |
| `Price Exception Review` | Waiting for Dept DRI -> Budget Approver. |
| `OM Export Package` | Waiting for OM export. |
| `Buyer Handoff` | Buyer owns PR / PO after OM export. |
| `Requester Action Required` | Reject or revision routed back to Requester. |
| `FTV Not Required` | `purchase_route = local_buy`; FTV is not required for export. |
| `Need material coding review` | Factory Material No / PK prefix mapping cannot be determined and needs OM/Admin review. |

## Field Names

| Field | Definition |
| --- | --- |
| `Need Date` | Required before Requester submit; not required for Save Draft. |
| `Request Action` | Requester intent metadata: New Buy / Other. |
| `Station Breakdown` | Long-form qty rows; MFG uses station, Non-MFG uses demand unit. |
| `Review Status` | Approval-chain status column; first column in review evidence tables. |
| `PAS Demand No` | Entered by OM in PAS Demand No stage. |
| `PAS Material No` | Entered by OM in PAS Quote Result stage. |
| `Quote Valid Until` | Quote expiry source; expiring soon within 10 days. |
| `Quote screenshot/image` | Quote evidence; v1 uses screenshot/image plus Excel as the primary evidence model. |
| `Quote Excel` | Quote evidence required alongside screenshot/image. |
| `Price Decision Status` | Auto Cleared / Price Exception Required / Dept DRI Approved / Budget Approver Approved / Rejected. |
| `Factory Material No` | SAP PO Raw Data column A; separate from SAP Material No. |
| `SAP Material No` | SAP PO Raw Data column H; must not be merged with Factory Material No. |
| `PAS Material No` | OM/PAS quote/order context; must not be mixed with Factory Material No or SAP Material No. |
| `PK Material No` | Factory Material No prefix/category coding rule; not Packaging item classification. |
| `FTV Code` | SAP PO Raw Data column K; customs / Trading / Accounting audit dimension, not a cost or Station Matrix group key. |
| `purchase_route` | `local_buy` / `external_import`; determines whether FTV mapping is required before export. |
| `materialCodingReviewStatus` | `Valid` / `Need material coding review` / `Rejected mapping` / `Approved mapping`. |
| `visibilityScope` | Attachment visibility: Requester-safe / OM-internal / Admin. |
| `stageStartAt` | Current-stage start timestamp; written by the server. |
| `daysPending` | Server-derived with the configured timezone; frontend must not calculate workflow state independently. |

## Material Identity / FTV / PK Naming Rules

- `item_master` is requester-safe item/spec identity, not PAS, Factory, SAP, or FTV identity.
- `Factory Material No` is sourced from Raw Data column A `料號` and may carry PK prefix/category coding.
- `SAP Material No` is sourced from Raw Data column H `料號` and must not be used as a Factory Material No fallback.
- `FTV Code` is sourced from Raw Data column K and is used only for customs / Trading / Accounting audit and export gate.
- Raw Data BL/BM/BN are Lv1/Lv2/Lv3 category coding sources and may drive PK prefix rules.
- Existing `資訊類` yellow OM rows with `IT...` prefix mapping remain a supplemental rule; new PK prefix rules must be documented the same way.
- When `purchase_route = external_import` and no active FTV mapping exists, `Export Package` must be blocked and routed to OM/Admin mapping repair.
