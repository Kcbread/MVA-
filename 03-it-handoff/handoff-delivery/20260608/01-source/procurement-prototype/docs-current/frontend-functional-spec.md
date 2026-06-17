# Frontend Functional Specification

## 1. Product Purpose

The system standardizes purchasing demand collection before downstream PAS, CFA, ECS, OM package, MFG package, Sourcing, Buyer, PR, and PO activities.

The current prototype focuses on:

- A single demand entry point for User A / DRI.
- Manager B approval with demand and carryover context.
- MFG Coordinator package collection and export.
- OM Purchasing PAS / demand collection / quotation package work.
- External progress and evidence tracking.
- Internal material identity using `Material No.`.

## 2. Material Identity Rule

`Material No.` is the company internal material identity.

Material identity is based on:

- `Standard Part Name CN`
- `Detail`
- `Spec`

System rule:

```text
materialIdentityKey = normalized(LV123 + Standard Part Name CN + Detail + Spec)
materialId = MATID-{system sequence}
materialNo = MVA-{LV1Code}{LV2Code}{LV3Code}-{system sequence}
```

Business meaning:

- The same material must reuse the same `Material No.` across projects and departments.
- Different supplier part numbers do not create different materials.
- Supplier-specific information is stored under the same `Material No.` as vendor mapping / quotation data.
- User A does not enter brand, vendor, or supplier part number when creating demand.
- `Vendor Part No.` is maintained only by OM Purchasing, Sourcing, or Buyer quote/procurement users.
- User A must complete material information in the request entry modal before an unstandardized row can become a request draft.
- Legacy material maintenance creates or reuses a formal `Material No.` immediately.
- New material demand stays `Material No. Pending` until `PR Created` or `PO Issued` is recorded with required evidence.

## 3. Role Overview

| Role | Responsibility |
| --- | --- |
| User A / DRI | Create demand, add items from search/history/catalog, enter phase quantities, submit to Manager B, track status. |
| Manager B | Approve demand or reject it to DRI. Maintain project setup and review demand/carryover context. |
| MFG Coordinator | Collect MFG line / phase package inputs and export MFG package Excel. |
| OM Purchasing | Handle IT / OM Buy demand, PAS information, final spec/model confirmation, quote data, quote PDF, and OM Excel/PDF package output. |
| Sourcing | Handle non-OM quotation activity when assigned. Maintain quote result and vendor mapping when applicable. |
| Buyer | Downstream PR / PO execution and external progress updates. |

## 4. Page Structure

### User A: Department Item Request

Tabs:

- `Request`
- `History`
- `Demand Tracking`
- `My Submissions`

Core behavior:

- `Request` is the only place where rows are prepared and submitted to Manager B.
- `History` opens `Complete Material Information` for legacy items that have not been standardized.
- `Request` opens the same material entry modal for new materials before request draft creation.
- `Demand Tracking` is read-only and does not create request rows.
- `My Submissions` shows submitted, approved, rejected, OM/MFG, and external progress status.

### Complete Material Information Modal

User A prepares new material or standardizes an incomplete legacy item in a modal before it enters the request draft.

Required fields:

- `LV1`
- `LV2`
- `LV3`
- `Standard Part Name CN`
- `Part Name EN`
- `Part Name VN`
- `Detail`
- `Spec`
- `Reason / Use Case`

Rules:

- User A selects `LV1 -> LV2 -> LV3` first.
- `Standard Part Name CN` uses fuzzy search results scoped by the selected LV123 path.
- The modal shows at most 20 standard-name matches inline. If the LV123-scoped fuzzy search has more results, `Open all results` opens a scrollable `Select Standard Part Name` picker and returns CN / EN / VN to the material entry form.
- The prototype source is the `Raw Data.標準品名` concept from the source database rule workbook.
- `品名_Detail`, `中文譯名`, `中文品名`, and old `品名 part name` are treated as search aliases, not the formal standard name.
- Search results show matching standard names after LV123 is selected; if no suitable result is found, User A can `Propose a new standard name`.
- History multi-select standardization uses `Standardize Selected Items`: standardized rows enter Request immediately, while unstandardized legacy rows are completed in a batch workbench and only completed rows can be added.
- Request draft provides `Complete Selected Materials` for legacy rows that still require standardization. Selected incomplete legacy rows cannot be submitted to Manager B.
- Maintaining an existing legacy material creates or reuses a formal `Material No.` immediately.
- Creating a new material adds the row to Request with `Material No. Pending`; the formal `Material No.` is created only when `PR Created` or `PO Issued` progress is saved.
- The visible `Material No.` is LV123-code based; the internal immutable key is `materialId`.
- No approval gate is required in this prototype; audit trail records who created the material and from which source row/request.

### Manager B

Tabs:

- `Review Queue`
- `Project Cost View`
- `Project Setup`
- `Demand Tracking`
- `Review History`

Core behavior:

- `Review Queue` supports bulk approval and row-level `Approve / Reject to DRI`.
- Reject to DRI requires a reason.
- Approved demand routes to OM Purchasing, MFG Coordinator, Sourcing, or Buyer-side package flow based on the current routing rule.
- `Project Setup` controls project code, current phase, and whether User A can create requests for that project.
- `Demand Tracking` is read-only and focused on Planned Demand, Carryover, Need to Buy, and Risk.

### MFG Coordinator

Core behavior:

- Focuses on MFG line / phase package completeness.
- Main table shows project, phase, line/area, required rows, completed rows, missing rows, status, and detail.
- Full item-level package fields are shown in detail and exported Excel, not overloaded in the main table.
- Can export MFG package Excel.
- Can update external progress with evidence.
- Can reject a package to DRI with reason and timeline traceability.

### OM Purchasing

Tabs:

- `PAS Review`
- `Demand Finalization`
- `Quotation`
- `Package Submission`
- `Activity History`

Core behavior:

- OM scope demand does not require User A to provide final model/vendor.
- OM collects approved demand by catalog/bucket, confirms final spec/model, maintains quote data, uploads quote PDF, and exports package files.
- `Quotation` maintains Vendor, Vendor Part No., Unit Price, Quote Date, Quote Expiry, Quote PDF, Remark, and package status.
- `Package Submission` tracks exported package status, external result, screenshot/pasted evidence, PR No., and PO No.
- `Vendor Part No.` is supplier mapping under the internal `Material No.` and does not affect material identity.
- Can update external progress with screenshot, pasted result, email, PDF, Excel, or zip evidence.
- Can reject a package to DRI when demand information must be corrected.

## 5. Demand Tracking

Demand Tracking is a read-only module for User A and Manager B.

Visible terms:

- `Planned Demand`
- `Carryover`
- `Current Request`
- `Need to Buy`
- `Risk`

Risk values:

- `OK`
- `Need Purchase`
- `Carryover Available`
- `Over Request`
- `Missing Plan`

Rules:

- No Add button is shown in Demand Tracking.
- Request creation stays in Request / Search / History; incomplete material rows are completed in the material entry modal.
- Manager uses Demand Tracking for review context only.

## 6. Approval and Rejection Rules

Manager B:

- `Approve`: does not require reason.
- `Reject to DRI`: requires reason and confirmation.

OM Purchasing / MFG Coordinator:

- Revision buttons are not used.
- If demand information is wrong, the row is rejected to DRI with reason.
- Rejection creates a timeline event visible to User A and Manager B.

Sourcing:

- Expense / non-OM items use an email-style RFQ flow.
- Sourcing records quote comparison result and quotation attachments.
- Sourcing quote success updates vendor and Vendor Part No. mapping under the existing internal Material No.

## 7. External Progress and Evidence

Every external update creates a progress event.

Progress checkpoints:

- `Package Preparing`
- `Package Ready`
- `Submitted to External System`
- `External Review`
- `Rejected to DRI`
- `PR Created`
- `PO Issued`
- `Completed`
- `Cancelled`

Evidence rules:

- Submitted external status requires evidence.
- Rejected status requires reason and evidence.
- PR Created requires PR No. and evidence.
- PO Issued requires PO No. and evidence.
- Evidence can be screenshot, pasted result, email, PDF, Excel, or zip file.

## 8. Output File Formats

### MFG Package Excel

Owner: MFG Coordinator

Format: `.xlsx`

Purpose: Export MFG collection package based on the coordinator collection format.

Typical fields:

- Model
- Material No.
- Item
- English Name
- Vietnamese Name
- Spec
- Picture
- Unit
- Usage Qty
- Used By
- Purpose
- Budget
- Type
- Remark
- No. of quotation

### OM Purchasing Excel Package

Owner: OM Purchasing

Format: `.xlsx`

Sheets:

- `Project budget-summary table`
- `{Project}-OM-Purchasing-Detail`

Detail fields include:

- Material No.
- Material Name
- Standard Part Name CN
- Detail / Spec
- Quantity
- Unit Price
- Amount
- Vendor
- Vendor Part No.
- Quote Date
- Quote Expiry
- Payment
- Reason
- Remark

### Quote PDF Package

Owner: OM Purchasing

Format: `.pdf`

Purpose: Quote evidence attached to OM package and external submission.

### Activity / Progress Records

Owner: System

Format: in-system audit trail.

Purpose: Track approvals, package preparation, external submission, rejection, PR, PO, and completion evidence.

## 9. Button Behavior Summary

| Page | Button | Behavior |
| --- | --- | --- |
| Request | Add | Adds item to request draft. |
| Request | Submit selected to Manager B | Sends selected draft rows to Manager review. |
| History | Add to Request | Adds standardized history rows immediately; a single legacy row opens Complete Material Information and multiple legacy rows open Standardize Selected Items. |
| Request | Complete Selected Materials | Opens single material entry for one incomplete legacy draft row or the batch workbench for multiple rows. |
| Request | Create New Material | Opens Complete Material Information in New Material mode. |
| Material Entry Modal | Propose a new standard name | Appears after LV123-scoped search when no matching standard name fits. |
| Material Entry Modal | Open all results | Opens the large standard-name picker when a scoped fuzzy search returns more than 20 matches. |
| Material Entry Modal | Add to Request | Legacy mode creates/reuses Material No.; New Material mode adds a pending draft row and waits for PR/PO trigger. |
| Manager Review Queue | Approve | Approves submitted row. |
| Manager Review Queue | Reject to DRI | Requires reason and rejects row to DRI. |
| MFG Coordinator | Export Excel | Exports selected MFG package rows. |
| OM Quotation | Save Quote Info | Saves quote/vendor fields for selected or current row. |
| OM Package Submission | Export Excel | Exports selected OM package rows. |
| OM Package Submission | Export Quote PDF | Exports quote PDF package simulation. |
| OM / MFG / Buyer | Update External Progress | Adds progress event with required evidence. |

## 10. Acceptance Criteria

- User A cannot enter brand or Vendor Part No. when creating demand.
- User A must complete LV1 / LV2 / LV3 before selecting a standard part name.
- Standard Part Name CN is selected from LV123-scoped fuzzy search results.
- Legacy history/search items must be maintained before they can become request draft rows.
- Legacy maintenance rows produce or reuse a formal Material No. before entering Request.
- New User A-created demand shows `Material No. Pending` after the material entry modal and stays pending through Manager approval and quotation.
- `PR Created` or `PO Issued` with required evidence creates or reuses the formal Material No. for new material.
- Sourcing quote success updates vendor mapping under an existing Material No.; it does not create a formal Material No. for pending new material.
- Same LV123 + Standard Part Name CN + Detail + Spec reuses the existing Material No.
- Different Vendor Part No. values can exist under one Material No.
- Visible UI does not use the removed old code-governance flow.
- Demand Tracking is read-only.
- Manager approval uses direct row buttons and bulk actions.
- OM Purchasing can maintain Vendor and Vendor Part No.
- MFG and OM exports use Material No. instead of old item identity labels.
- External progress requires evidence at key checkpoints.
