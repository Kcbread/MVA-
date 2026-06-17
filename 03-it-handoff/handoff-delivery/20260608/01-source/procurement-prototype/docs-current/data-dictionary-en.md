# Data Dictionary

This document defines the core frontend data fields required for IT implementation. The current scope is demand collection, approval, package preparation, and evidence-ready handoff.

## 1. Project Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| projectCode | Project identifier, such as P26 or OR5 | string | Manager B | yes | Manager B |
| currentPhase | Current project phase entered by Manager B | string | Manager B | yes | Manager B |
| nextBuyPhase | System-derived next phase when currentPhase matches standard phase | string | System | no | read-only |
| openToUserA | Whether User A can create request for this project | boolean | Manager B | yes | Manager B |

## 2. Request Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| requestId | Unique request line ID | string | System | yes | read-only |
| projectCode | Target project for the request | string | User A | yes | User A before submit |
| materialId | Immutable internal material PK | string | System | yes after legacy maintenance or PR/PO trigger | read-only |
| materialNo | User-facing internal material number using LV123 code + sequence | string | System | yes after legacy maintenance or PR/PO trigger | read-only |
| standardNameCn | Standard Part Name Chinese selected from the standard name master | string | User A / IE DB Owner | yes | User A before submit |
| standardNameEn | Standard Part Name English | string | User A / IE DB Owner | yes | User A before submit |
| standardNameVn | Standard Part Name Vietnamese | string | User A / IE DB Owner | yes | User A before submit |
| materialStandardizationState | Legacy request row standardization state used by material entry modal or batch workbench | enum | System | no | read-only |
| lv1 | Level 1 category | string | User A | yes | User A before submit |
| lv2 | Level 2 category | string | User A | yes | User A before submit |
| lv3 | Level 3 category | string | User A | yes | User A before submit |
| itemName | Item name or demand bucket, derived from the standard name where applicable | string | User A / System | yes | User A before submit |
| detail | Functional detail entered by requester | string | User A | yes for new material | User A before submit |
| spec | Technical specification entered by requester or finalized by OM/MFG | string | User A / OM / MFG | no | User A before submit, OM/MFG for final spec |
| materialNo | Internal company material number; legacy maintenance creates/reuses immediately, new material remains pending until PR Created or PO Issued | string | System | conditional | read-only |
| materialIdentityKey | Normalized LV123 + standard name + detail + spec key used to reuse the same Material No. | string | System | yes | read-only |
| materialName | Display name generated from item name and detail | string | System | no | read-only |
| materialStatus | Material governance status, such as Active - User Created or Material No. Pending | string | System | no | read-only |
| requesterReason | Reason or use case | string | User A | no | User A before submit |
| sourceProject | Source project when copied from history | string | System | no | read-only |
| status | Request status | enum | System / Manager B | yes | System / Manager B |
| managerReason | Reject / approval note | string | Manager B | required for reject | Manager B |

## 3. Phase Quantity Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| p10 | P1.0 quantity | number | User A | no | User A before submit |
| p11 | P1.1 quantity | number | User A | no | User A before submit |
| evt | EVT quantity | number | User A | no | User A before submit |
| dvt | DVT quantity | number | User A | no | User A before submit |
| pvt | PVT quantity | number | User A | no | User A before submit |
| mp | MP quantity | number | User A | no | User A before submit |
| totalQty | Total requested quantity | number | System | yes | read-only |

Validation:

- Quantity cannot be negative.
- Submitted rows become read-only for User A.

## 4. Demand Tracking Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| plannedDemand | Planned quantity for a phase | number | System / imported baseline | no | read-only |
| carryover | Remaining reusable quantity from previous collection record | number | System | no | read-only |
| currentRequest | Quantity currently requested | number | System | no | read-only |
| needToBuy | Planned demand minus carryover, adjusted by current request | number | System | no | read-only |
| riskStatus | Decision-oriented demand status | enum | System | no | read-only |

Risk values:

- `OK`
- `Need Purchase`
- `Carryover Available`
- `Over Request`
- `Missing Plan`

## 5. Manager Approval Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| decision | Manager decision | enum | Manager B | yes | Manager B |
| decisionDate | Decision timestamp | datetime | System | no | read-only |
| managerReason | Reject reason or optional approval note | string | Manager B | required for reject | Manager B |
| nextStep | System route after approval | enum/string | System | no | read-only |

Decision values:

- `Approved`
- `Rejected`

## 6. MFG Coordinator Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| packageId | MFG package ID | string | System | yes | read-only |
| lineArea | MFG line or area | string | MFG Coordinator | yes | MFG Coordinator |
| packageType | Collection form, such as EQ or Consumable | string | MFG Coordinator | yes | MFG Coordinator |
| requiredRows | Expected input row count | number | MFG Coordinator | no | MFG Coordinator |
| completedRows | Received input row count | number | MFG Coordinator | no | MFG Coordinator |
| missingRows | Not-submitted input row count | number | System | no | read-only |
| packageStatus | Package readiness status | enum | MFG Coordinator | yes | MFG Coordinator |

## 7. OM Purchasing Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| pasStatus | PAS review status | enum | OM Purchasing | yes for OM scope | OM Purchasing |
| pasProjectCode | PAS project/budget code | string | OM Purchasing | no | OM Purchasing |
| pasBudgetAmount | PAS budget amount | number | OM Purchasing | no | OM Purchasing |
| pasComment | PAS comment or rejection reason | string | OM Purchasing | no | OM Purchasing |
| itemBucket | OM demand bucket, such as PC or IPC(A) | string | System / OM | yes | OM Purchasing if needed |
| finalSpecStatus | Whether final spec/model is ready | enum | OM Purchasing | no | OM Purchasing |
| vendor | Vendor name | string | OM Purchasing | no | OM Purchasing |
| unitPrice | Quoted unit price | number | OM Purchasing | no | OM Purchasing |
| quoteDate | Quote date | date | OM Purchasing | no | OM Purchasing |
| quoteExpiry | Quote expiry date | date | OM Purchasing | no | OM Purchasing |
| quotePdfFileName | Uploaded quote PDF filename | string | OM Purchasing | no | OM Purchasing |
| vendorPartNo | Supplier-specific part number linked to the same internal Material No. | string | OM Purchasing / Sourcing / Buyer | no | OM Purchasing / Sourcing / Buyer |
| omStatus | OM package status | enum | OM Purchasing / System | no | OM Purchasing |

## 8. Standard Name, Material Master, and Vendor Mapping Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| standardNameId | Standard part name master ID | string | IE / DB Owner | yes | IE / DB Owner |
| standardNameCn | Formal Chinese standard part name | string | IE / DB Owner | yes | IE / DB Owner |
| standardNameEn | Formal English part name | string | IE / DB Owner | yes | IE / DB Owner |
| standardNameVn | Formal Vietnamese part name | string | IE / DB Owner | yes | IE / DB Owner |
| aliases | Search aliases from old 品名_Detail / 中文譯名 / 中文品名 / 品名 part name | array | System / IE DB Owner | no | IE / DB Owner |
| lv1 / lv2 / lv3 | Category path used to filter standard name choices | string | IE / DB Owner | yes | IE / DB Owner |
| materialId | Immutable DB PK, independent from LV123 display code | string | System / Material Master | yes | read-only |
| materialNo | Internal company material number. Legacy maintenance creates/reuses immediately; new material is created when PR Created or PO Issued evidence is saved | string | System / Material Master | conditional | read-only after creation |
| materialIdentityKey | Normalized LV123 + Standard Part Name CN + Detail + Spec key | string | System | yes | read-only |
| createdFromRequestId | Request that created the Material No. | string | System | no | read-only |
| sourceExternalEventId | External progress event that triggered Material No. creation | string | System | no | read-only |
| sourcePrNo | PR number that triggered Material No. creation, when applicable | string | System / Buyer | no | read-only |
| sourcePoNo | PO number that triggered Material No. creation, when applicable | string | System / Buyer | no | read-only |
| vendor | Vendor name linked to the Material No. | string | OM / Sourcing / Buyer | no | OM / Sourcing / Buyer |
| vendorPartNo | Supplier-specific part number | string | OM / Sourcing / Buyer | no | OM / Sourcing / Buyer |
| quotePdf | Quote PDF evidence | string | OM / Sourcing / Buyer | no | OM / Sourcing / Buyer |
| quoteSource | Source role, such as Sourcing quote success or OM quotation | string | System | no | read-only |

## 9. Purchase Route and FTV / Customs Audit Fields

FTV code is a customs / Trading / Accounting audit control. It is not a cost-analysis key.

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| itemId | Normalized item/spec identity | string | System / Item master | yes | read-only after mapping |
| materialId | Internal material identity such as HFCOM / PAS material / factory material / legacy mapping | string | System / OM / Admin | conditional | OM / Admin setup |
| purchaseRoute | OM-confirmed purchase route: local_buy or external_import | enum | OM Purchasing | yes before export | OM Leader / assigned OM Purchasing |
| quoteOwner | Quote owner route: PAS / sourcing / OM_direct | enum | OM Purchasing | yes before quote execution | OM Leader / assigned OM Purchasing |
| demandDepartment | Buying / using department, used for FTV mapping and cost allocation | string | Requester / System | yes | read-only after submit |
| ftvCode | Customs FTV code for external import | string | OM / System | required for external_import before export | OM Leader / assigned OM Purchasing / Admin setup |
| ftvStatus | Not Required / Reuse Existing / Generate Required / Missing Mapping | enum | System / OM | yes before export | system-derived, OM resolves missing mapping |
| activeFtvKey | Active uniqueness key for item + demand department FTV mapping | string | System | yes for active FTV | read-only |
| ftvMappingSource | Existing master / legacy mapping / generated by system / manual review | string | System / OM | no | OM / Admin setup |
| customsAuditSnapshotId | Export-time immutable audit snapshot | string | System | yes after export | read-only |

Rules:

- `local_buy` does not require FTV code.
- `external_import` requires FTV code before Export Package.
- IT items default to PAS quote / purchasing.
- Non-IT items can be routed by OM to PAS, Sourcing, or OM direct.
- Same item/spec can have different FTV codes by demand department.
- Cost analysis must not group by FTV code; use request line, demand department, project, stage, station/unit, qty, price, and carryover instead.
- Export snapshots preserve FTV code and route metadata even if the master mapping changes later.

## 10. External Progress Fields

| Field | Meaning | Type | Owner | Required | Editable By |
| --- | --- | --- | --- | --- | --- |
| progressStatus | Current external progress checkpoint | enum | OM / MFG / Buyer | yes | owning role |
| externalSystem | External system name | string | OM / MFG / Buyer | no | owning role |
| externalRequestNo | External case/request number | string | OM / MFG / Buyer | no | owning role |
| prNo | PR number, future downstream tracking | string | Buyer | no | Buyer |
| poNo | PO number, future downstream tracking | string | Buyer | no | Buyer |
| evidenceType | Evidence type | enum | OM / MFG / Buyer | conditionally required | owning role |
| evidenceFileName | Uploaded evidence filename | string | OM / MFG / Buyer | conditionally required | owning role |
| pastedExternalResult | Pasted external system result | text | OM / MFG / Buyer | conditionally required | owning role |
| progressNote | Progress note or rejection reason | text | OM / MFG / Buyer | no | owning role |
| createdBy | Actor who created the event | string | System | yes | read-only |
| createdAt | Event timestamp | datetime | System | yes | read-only |

## 11. Status Values

Request status:

- `Draft`
- `Submitted`
- `Rejected`
- `Approved`

PAS status:

- `PAS Required`
- `Waiting PAS Review`
- `PAS Approved`
- `PAS Budget Code Issued`

Package / external progress:

- `Package Preparing`
- `Package Ready`
- `Submitted to External System`
- `External Review`
- `Rejected to DRI`
- `PR Created`
- `PO Issued`
- `Completed`
- `Cancelled`
