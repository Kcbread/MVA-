# 06 Table Information Flow

## Requester Tables

### `requester.addItemPopup.table.sources`

| Field | Definition |
| --- | --- |
| Reads | Catalog, purchase records/history, Copy Demand history, Lv123 taxonomy, New Item Request draft. |
| Writes | Creates worksheet draft row after `Add`; New Item Request first creates a pending material master request. |
| Key Columns | Add, Item, Detail, Spec, Action. |
| Next Consumer | `requester.requestWorkspace.table.worksheetRows`. |

Rules:

- Catalog / Reuse / Copy Demand target quantities all start from 0.
- Requester must not see vendor, supplier, PAS material no, factory material no, OM assignee, or FTV.

### `requester.requestWorkspace.table.worksheetRows`

| Field | Definition |
| --- | --- |
| Reads | Draft request rows, stationBreakdown rows, current project / line / MFG-Non-MFG scope. |
| Writes | qty cells -> long-form `stationBreakdown` / `request_demand_lines`; Need Date; Save Draft; Submit. |
| Key Columns | Item / Spec, P1.0, P1.1, EVT, DVT, PVT, MP, Row Total, Hint, Action. |
| Next Consumer | Dept DRI Review, Cost Manager Review, OM Purchasing, Buyer Handoff. |

Rules:

- Save Draft does not require Need Date.
- Submit requires active worksheet Need Date and at least one qty > 0.
- Totals are derived values, not canonical storage.

## Review Tables

### `deptDri.deptReview.table.queue`

| Field | Definition |
| --- | --- |
| Reads | Submitted request packages, request items, long-form quantity rows, warehouse/carryover candidates, price exceptions. |
| Writes | Dept DRI approve/reject, reason, audit event, quantity direct edit. |
| Key Columns | Review Status, Project, Requester, Item / Spec, Qty, Need Date, Exception / Evidence, Action, Detail. |
| Next Consumer | Cost Manager Review, Budget Approver Review, Requester Action Required, warehouse/carryover ledgers. |

### `costManager.costReview.table.queue`

| Field | Definition |
| --- | --- |
| Reads | Dept DRI approved submissions, quantity evidence, pricing/cost evidence, locked/applied warehouse/carryover ledger. |
| Writes | Cost Manager authorize/reject, reason, audit event, quantity direct edit. |
| Key Columns | Review Status, Project, Requester, Item / Spec, Total Qty, Cost Evidence, Action, Detail. |
| Next Consumer | OM Leader intake / assignment, Requester Action Required, Review History. |

### `budgetApprover.budgetReview.table.queue`

| Field | Definition |
| --- | --- |
| Reads | Dept DRI approved price exceptions, quote/history delta, Temporary Budget evidence, quantity evidence. |
| Writes | Budget Approver final approve/reject, reason, audit event, quantity direct edit. |
| Key Columns | Review Status, Project, Item / Spec, Quote USD, History USD, Delta USD, Reason, Action, Detail. |
| Next Consumer | OM Export Package, Requester Action Required. |

### Shared evidence tables

| Table | Reads | Writes | Rule |
| --- | --- | --- | --- |
| `shared.approvalQuantityReview.table.dashboard` | active demand rows, price helpers, locked/applied ledger | none | First column is fixed to `Review Status`. |
| `shared.approvalQuantityReview.table.mfgStationDetail` | selected item / dashboard cell scope | optional audited direct edit through popup | Preserves station detail. |
| `shared.approvalQuantityReview.table.nonMfgDepartmentDetail` | selected item / dashboard cell scope | optional audited direct edit through popup | Preserves department detail. |
| `shared.itemQuantityReview.popup` | formal long-form qty rows | add/edit/delete qty + audit | Direct edit is not a temporary override. |

## OM Tables

### `om.submissionDashboard.table.stageRows`

| Field | Definition |
| --- | --- |
| Reads | Cost Manager authorized rows, OM assignments, quote status, export status. |
| Writes | Assignment only when actor is OM Leader / Admin; otherwise read-only. |
| Key Columns | Project, Item, Qty, Received Date, Current Stage, Days in Stage, Pending Owner, Quote Expiry, Next Action, Detail. |
| Next Consumer | PAS Demand No, PAS Quote Result, Export Package. |

### `om.pasDemandNo.table.pasRows`

| Field | Definition |
| --- | --- |
| Reads | Assigned OM rows waiting PAS Demand No. |
| Writes | PAS Demand No, audit event. |
| Key Columns | Project, Item / Spec, Qty, PAS Demand No, PAS Result Status, Next Step, Detail. |
| Next Consumer | PAS Quote Result. |

### `om.pasQuoteResult.table.quoteRows`

| Field | Definition |
| --- | --- |
| Reads | Rows with PAS Demand No, assigned OM scope, history price, exchange rate. |
| Writes | PAS Material No, vendor, vendor number, quote price, quote date, quote valid until, screenshot/image attachment, Excel attachment, price decision. |
| Key Columns | Project, Item / Qty, PAS Tracking, Quote Result, Completion Status, Actions, Detail. |
| Next Consumer | Auto Cleared -> OM Export Package; Price Exception -> Dept DRI -> Budget Approver. |

### `om.exportPackage.table.exportRows`

| Field | Definition |
| --- | --- |
| Reads | Auto Cleared rows, Budget Approver approved rows, quote evidence, effective qty, purchase_route, active FTV mapping, materialCodingReviewStatus. |
| Writes | cost type, target CFA/ECS, package code, export status, export timestamp, FTV export snapshot, audit event. |
| Key Columns | Project, Item, Qty, Package Code, PAS Context, Quote Attachments, Cost Type / Target, Export Status, Actions, Detail. |
| Next Consumer | Buyer Handoff. |

Rules:

- When `purchase_route = local_buy`, show `FTV Not Required`; do not require FTV for export.
- When `purchase_route = external_import`, an active FTV mapping is required before export.
- Missing FTV mapping must block `Export Package` and route to OM/Admin mapping repair.
- When `materialCodingReviewStatus = Need material coding review`, export is blocked until PK / Factory Material No prefix review is complete.

## Material Identity / FTV / PK Tables

### `materialIdentity.table.identityMap`

| Field | Definition |
| --- | --- |
| Reads | `item_master`, `material_identity`, SAP PO Raw Data A/H/K/BL/BM/BN, Lv123 taxonomy, factory prefix mapping. |
| Writes | Factory Material No mapping, SAP Material No reference, PK prefix/category mapping, `materialCodingReviewStatus`, audit event. |
| Key Columns | Item / Spec, Factory Material No, SAP Material No, PK Prefix, Lv1 / Lv2 / Lv3, Review Status, Actions. |
| Next Consumer | OM Export Package, customs audit, Buyer Handoff evidence. |

Rules:

- Raw Data column A `料號` is Factory Material No; column H `料號` is SAP Material No; column K is FTV Code; BL/BM/BN are Lv1/Lv2/Lv3.
- PK material number means Factory Material No prefix/category coding, not Packaging item classification.
- Importers may only validate, map, and audit existing Raw Data / PO-row Factory Material No values; they must not silently rewrite them.
- If prefix mapping cannot be determined, write `Need material coding review`; do not guess codes automatically.
- Existing `資訊類` yellow OM rows with `IT...` prefix mapping remain a supplemental rule; new PK prefix rules must be documented at the same level.

### `ftvCode.table.mapping`

| Field | Definition |
| --- | --- |
| Reads | item/spec, demand department, purchase_route, Factory Material No, active/inactive FTV mapping. |
| Writes | active FTV mapping, mapping repair reason, FTV audit snapshot, audit event. |
| Key Columns | Item / Spec, Demand Department, Purchase Route, FTV Code, Status, Effective From, Actions. |
| Next Consumer | OM Export Package, customs / Trading / Accounting audit. |

Rules:

- FTV is a customs / Trading / Accounting audit dimension, not a Cost Dashboard or Station Matrix group key.
- Requester must not see FTV.
- Same item/spec + same demand department + `external_import` should reuse the active FTV mapping; different demand departments may have different FTV mappings for audit support.

## Buyer Handoff Tables

| Table | Reads | Writes | Rule |
| --- | --- | --- | --- |
| `buyerHandoff.status.table.packages` | exported packages, quote/export metadata, buyer events | future PR/PO/arrival events | Starts only after OM mark exported. |

## Cross-Table Rules

- `Detail` does not write workflow status.
- `Contact DRI` does not write workflow status.
- Requester visibility must be filtered at API/query layer, not frontend hidden-only.
- Every workflow mutation must write an audit event.
- Reject must preserve reason, actor, timestamp, previous stage, and next owner.
- Quote expiry warning threshold = 10 days.
- Price exception threshold = `quoteUnitPriceUsd - historyUnitPriceUsd > 0.40`.
- No history price, new item, and Temporary Budget always route Dept DRI -> Budget Approver.
- Warehouse pending candidate does not reduce cost; locked use affects effective cost.
- Buyer Handoff is the formal post-export label; user-facing UI must not use legacy post-export wording as the primary label.
- Production attachment storage/security is implemented by IT; this handoff locks metadata, `visibilityScope`, and role download guard.
- `stageStartAt`, `daysPending`, quote expiry, and Buyer Handoff days are calculated by the server with one timezone; default is calendar-day semantics, and any business-day SLA must document the holiday calendar.
- Admin impersonation must be audited if retained and must not be used as a business approval override.
- Buyer Handoff PR/PO/arrival are post-export future events and must not rewrite the main OM Export Package status.
