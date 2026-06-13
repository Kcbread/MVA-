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

## 2A. Item Master Request

Pending material master requests are created when the database has no suitable item. They do not write active `item_master` rows until approved.

| Field | Meaning | Type | Owner |
| --- | --- | --- | --- |
| itemMasterRequestId | Pending material master request ID | string | System |
| requestId | Linked worksheet item row | string | System |
| proposedEngName | English material name | string | Requester |
| proposedCnEngName | Chinese material name | string | Requester |
| proposedVnName | Vietnamese material name | string | Requester |
| proposedSpec | Requester-safe spec summary | text | Requester |
| structuredSpec | Size/material/capacity/power/model/package attributes | json/text | Requester |
| proposedLv1 / proposedLv2 / proposedLv3 | Suggested Lv123 classification | string | Requester, reviewer can correct |
| proposedUom | Unit of measure | string | Requester |
| requesterReason | Why existing material cannot satisfy demand | text | Requester |
| estimateCurrency | Estimate currency | enum | Requester |
| estimateUnitPrice | Estimated unit price | number | Requester |
| estimateReason | Basis for the estimate | text | Requester |
| duplicateCandidates | System suggested existing item candidates | json | System |
| duplicateDifference | Difference from similar existing item | text | Requester, required when candidates exist |
| evidenceReference | Spec sheet/image/link/request note reference | text | Requester, required when candidates exist |
| status | Pending Dept DRI Review / Pending Master Review / Approved / Merged / Rejected | enum | System/workflow owner |
| approvedItemId | New approved `item_master.id` | string | Master reviewer |
| mergedItemId | Existing `item_master.id` if merged | string | Master reviewer |

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

## 5A. Estimate Variance

Estimate variance is globally visible and compares Requester estimate against the PAS Quote price. It is a tracking/alert signal and does not replace the official quote-vs-history price decision.

| Field | Meaning | Owner |
| --- | --- | --- |
| estimateUnitPriceSnapshotUsd | Requester estimate converted to USD at quote decision time | System |
| quoteUnitPriceSnapshotUsd | PAS Quote unit price in USD | System |
| estimateDeltaUsd | `quoteUnitPriceSnapshotUsd - estimateUnitPriceSnapshotUsd` | System |
| estimateDeltaPercent | Unit price delta percentage against estimate | System |
| estimateTotalDeltaUsd | Unit delta multiplied by submitted quantity | System |
| estimateVarianceStatus | Within Estimate Range / Under Estimated / Over Estimated | System |
| estimateVarianceAlert | True when both percentage and USD thresholds are exceeded | System |

Display rule: all roles can see estimate, PAS quote, and variance status; requester-facing surfaces still must not expose vendor, PAS material no, factory material no, OM assignee, or FTV.
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
| factoryMaterialNo | Factory material number after PO; SAP PO Raw Data column A `料號` | Buyer / OM / Admin |
| sapMaterialNo | SAP material number from SAP PO Raw Data column H `料號`; separate from Factory Material No | OM / Buyer / Admin |
| omAssignee | OM assigned owner | OM Leader / Admin |
| ftvCode | Customs/audit FTV code | OM / Buyer / Admin |

## 6A. SAP / PO Raw Mirror

SAP PO raw import/export keeps the Excel `Raw Data` A-BN shape as a mirror layer. Core workflow tables should consume canonical fields only; PO-only fields may be blank before Buyer/PUR/SAP evidence exists.

| Field | Raw Data Column | Meaning |
| --- | --- | --- |
| factory_material_no | A `料號` | Factory Material No; PO-stage factory-side tracking key |
| sap_material_no | H `料號` | SAP material number; not the factory material number |
| buy_scope | Excel row fill | `om_scope` for yellow-filled Raw Data rows; `mfg_buy` for non-yellow rows in full import mode |
| scope_source | Import rule | `excel_yellow_fill` or `default_non_yellow`, used to audit why `buy_scope` was assigned |
| source_fill_color | Excel row fill | Source ARGB fill color used by the importer, e.g. `FFFFFF00` for yellow |
| ftv_code | K `FTV Code` | Customs/audit FTV mapping source |
| normalized_item_name | Q `正規化` | Main item matching / master key candidate |
| lv1 / lv2 / lv3 | BL / BM / BN | Category coding source for future `AABBB00001` rules |

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
