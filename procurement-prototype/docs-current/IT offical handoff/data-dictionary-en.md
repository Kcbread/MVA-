# Data Dictionary - 2026-06-08

This dictionary defines implementation fields for IT. It is a no-source handoff document.

## 1. Request Package

| Field | Meaning | Type | Owner |
| --- | --- | --- | --- |
| requestPackageId | Package submitted by Requester | string | System |
| projectCode | Target project | string | Requester |
| projectType | G / Non-G / service classification | string | System/Admin |
| requestLine | Line 1 / Line 2 / Line 3 / Line 4 | string | Requester |
| demandType | MFG or Non-MFG | enum | Requester |
| needDate | Package-level need date | date | Requester |
| status | Draft / Submitted / Approved / Rejected / In Progress | enum | System/workflow owner |
| submittedAt | Submit timestamp | datetime | System |
| submittedBy | Requester identity | string | System |

## 2. Request Item

| Field | Meaning | Type | Owner |
| --- | --- | --- | --- |
| requestId | Logical worksheet item row ID | string | System |
| itemName | Item / product name | string | Requester/System |
| detail | Item detail/context | text | Requester/System |
| spec | Product specification | text | Requester/System |
| sourceType | Catalog / Reuse / Copy Demand / New Item Request | enum | System |
| sourceProject | Source project reference, if reused/copied | string | System |
| sourceLine | Source line reference, if reused/copied | string | System |
| sourceRecordId | Source record ID | string | System |
| materialStatus | Active / New Item Request / Pending Review | enum | System |
| lv1 | Level 1 category | string | Catalog/System |
| lv2 | Level 2 category | string | Catalog/System |
| lv3 | Level 3 category | string | Catalog/System |
| omCategoryLevel1 | OM matched Level 1 fallback | string | System |
| omCategoryLevel2 | OM matched Level 2 fallback | string | System |
| omCategoryLevel3 | OM matched Level 3 fallback | string | System |

Requester-visible item/spec must be sanitized and must not expose vendor/supplier/PAS/factory/OM/FTV internals.

## 3. Station Breakdown

Canonical quantity storage should be long-form.

| Field | Meaning | Type | Owner |
| --- | --- | --- | --- |
| stationBreakdownId | Quantity row ID | string | System |
| requestId | Parent item row ID | string | System |
| projectCode | Target project | string | System |
| requestLine | Target line | string | Requester |
| demandType | MFG / Non-MFG | enum | Requester |
| phase | P1.0 / P1.1 / EVT / DVT / PVT / MP | enum | Requester |
| station | MFG station; blank for Non-MFG | string | Requester |
| demandUnit | Non-MFG unit; blank for MFG | string | Requester |
| qty | Non-negative integer | number | Requester |
| carryoverFrom | Optional source line for carryover | string | Requester |
| carryoverQty | Optional carryover qty | number | Requester/Dept DRI |
| carryoverReason | Optional carryover reason | text | Requester/Dept DRI |

Cell identity:

```text
requestId + projectCode + requestLine + demandType + phase + station/demandUnit
```

MFG station values:

```text
CG, BG, FATP, Test, Hybrid, Auto, ENG Pack, Zombie, Laser_pico, Rework, Repair, WH
```

Non-MFG demandUnit values:

```text
FATP TE, FATP IQC, FATP PQE, WH, Q-LAB, REL, ENG1, ENG2, ENG3, IT, FAC
```

## 4. Derived Quantity Values

| Field | Meaning | Storage Rule |
| --- | --- | --- |
| phaseTotal | Sum of qty under one item + phase | derived only |
| rowTotal | Sum of all phase/station/unit qty for one item | derived only |
| packageTotal | Sum of submitted package qty | derived only |

Do not store totals as independent canonical data unless the production system stores immutable audit snapshots separately.

## 5. Approval And Price Review

| Field | Meaning | Owner |
| --- | --- | --- |
| managerDecision | Approved / Rejected | Cost Manager |
| managerReason | Reject reason or approval note | Cost Manager |
| decisionAt | Decision timestamp | System |
| priceDecisionStatus | Auto Cleared / Price Escalation Required / Dept DRI Approved / Budget Approver Approved / Rejected | System / Dept DRI / Budget Approver |
| quoteValidUntil | Quote validity date | OM Purchasing |
| unitPriceUsd | Canonical price for cost calculation | System/OM |
| unitPriceVnd | Display/input price when using VND | OM/System |

## 6. OM / Buyer Internal Fields

These are not requester-visible.

| Field | Meaning | Visible To |
| --- | --- | --- |
| vendor | Vendor name | OM / Buyer / Admin |
| supplier | Supplier name | OM / Buyer / Admin |
| pasDemandNo | PAS Demand No | OM / Cost Manager / Buyer |
| pasMaterialNo | PAS Material No | OM / Buyer |
| factoryMaterialNo | Factory material number after PO | Buyer / OM / Admin |
| omAssignee | OM assigned owner | OM Leader / Admin |
| ftvCode | Customs/audit FTV code | OM / Buyer / Admin |

## 7. Attachments

| Field | Meaning | Owner |
| --- | --- | --- |
| attachmentId | Stored attachment ID | System |
| fileName | Original file name | Uploader/System |
| mimeType | File MIME type | System |
| byteSize | File size | System |
| visibilityScope | Requester-safe / OM-internal / Admin | System |
| uploadedBy | Uploader | System |
| uploadedAt | Upload timestamp | System |

Mac mini UAT already has MySQL-backed attachment metadata and file retention. Production implementation should define final storage/security policy separately.
