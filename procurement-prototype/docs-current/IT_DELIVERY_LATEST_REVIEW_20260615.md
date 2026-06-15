# IT Delivery Latest Review - 2026-06-15

## Status

The live handoff documentation under `procurement-prototype/docs-current/` has been reviewed against the current repo context on 2026-06-15.

Use these as the latest live handoff sources:

1. `docs-current/IT_DELIVERY_LATEST_REVIEW_20260615.md`
2. `docs-current/IT_DELIVERY_READINESS_20260608.md`
3. `docs-current/it-handoff/README.md`
4. `docs-current/it-handoff/zh-TW/`
5. `docs-current/it-handoff/en/`
6. `docs-current/data-dictionary-en.md`
7. `db/workflow-api-table-map.zh-TW.md`
8. `db/schema.sql`
9. `db/migrations/001_target_workflow_tables.sql`
10. `db/migrations/002_sap_po_raw_mirror.sql`
11. `db/migrations/003_sap_po_raw_scope.sql`
12. `docs-current/IT_official_handoff_20260615.zip` when IT needs a single latest zip package.

## Version Finding

The editable live Markdown files are the current delivery baseline after this review.

Latest generated package:

- `procurement-prototype/docs-current/IT_official_handoff_20260615.zip`

These older packaged artifacts are historical snapshots:

- `procurement-prototype/docs-current/IT offical handoff.zip`
- `procurement-prototype/docs-current/IT_MEETING_PACKAGE_20260604.zip`
- `handoff-delivery/MVA_PROCUREMENT_CONTAINERIZED_IT_HANDOFF_20260608.zip`
- `handoff-delivery/20260608/`

Do not treat the older zip files as the latest 2026-06-15 handoff package.

## Current Product Truth Used

Evidence sources:

- `procurement-prototype/_context/README.zh-TW.md`
- `procurement-prototype/_context/roles/*.md`
- `procurement-prototype/_context/flows/*.md`
- `procurement-prototype/_context/modules/*.md`
- `procurement-prototype/db/workflow-api-table-map.zh-TW.md`
- `procurement-prototype/db/schema.sql`
- `procurement-prototype/db/migrations/*.sql`

Locked role chain:

```text
Requester -> Dept DRI -> Cost Manager -> OM Leader / OM Purchasing -> Buyer Handoff
```

Price and budget exception chain:

```text
OM Purchasing quote result -> system price decision
Auto Cleared when quote/history USD delta <= 0.40
Exception when delta > 0.40, no history price, new item, or Temporary Budget
Dept DRI quote review -> Budget Approver final approval -> OM Export Package
```

Requester input truth:

- Requester uses the full-page All-Phase Excel worksheet.
- `MFG / Non-MFG` are worksheet modes.
- `P1.0 / P1.1 / EVT / DVT / PVT / MP` are phase groups.
- Quantity cells persist as long-form `stationBreakdown` / `request_demand_lines`.
- `Save Draft` does not require Need Date.
- `Submit` requires the active worksheet Need Date and at least one positive quantity.
- Add Item popup columns are `Add / Item / Detail / Spec / Action`.
- Copy Demand and Reuse Item target quantities start at zero.

Privacy guard:

- Requester-facing APIs and UI must not expose vendor, supplier, PAS material number, factory material number, OM assignee, or FTV code.

Material identity / export guard truth:

- `item_master` is requester-safe item/spec identity; it is not PAS, Factory, SAP, FTV, or PK identity.
- `PK 料號` means Factory Material No prefix/category coding. It is not Packaging item classification in this handoff.
- Factory Material No is Raw Data A `料號`; SAP Material No is Raw Data H `料號`; FTV Code is Raw Data K; Lv1/Lv2/Lv3 are Raw Data BL/BM/BN.
- Existing Raw Data / PO values are audit evidence and should be validated, mapped, and audited, not silently rewritten by importers.
- `purchase_route = local_buy` means FTV Not Required.
- `purchase_route = external_import` requires active FTV mapping before OM Export Package.
- FTV is a customs / Trading / Accounting audit dimension and must not become a Cost Dashboard or Station Matrix group key.

## Updated During This Review

- Reconciled live handoff wording from legacy role labels to current role names.
- Reconciled quote evidence wording from document-first language to screenshot/image plus Excel evidence.
- Reconciled quote expiry warning threshold from 14 days to the current 10-day rule.
- Reconciled price exception language from percentage thresholds to absolute USD delta `> 0.40`.
- Reconfirmed Buyer Handoff as the post-OM-export label instead of vague legacy post-export wording.
- Added formal `Material Identity / FTV / PK Rules` to the data dictionary.
- Added naming rules for `PK Material No`, `FTV Code`, `purchase_route`, `materialCodingReviewStatus`, `visibilityScope`, `stageStartAt`, and `daysPending`.
- Added FTV export gate and material coding review blocking rules to table information flow and workflow API map.
- Locked attachment handoff scope to metadata, `visibilityScope`, role download guard, and production storage/security requirements owned by IT.
- Locked time/SLA calculation to server-authoritative `stageStartAt`, `daysPending`, quote expiry, and Buyer Handoff days using one timezone.
- Reconfirmed Admin impersonation as audited governance only, not a business approval override.
- Reconfirmed Buyer Handoff PR/PO/arrival as post-export future events that do not rewrite OM Export Package main status.
- Added this review receipt so IT can distinguish live latest docs from historical packaged snapshots.

## Remaining Packaging Action

Use `docs-current/IT_official_handoff_20260615.zip` for a single latest zip package. The authoritative editable copy remains the live Markdown and SQL files listed above. After any live Markdown update, sync `docs-current/IT offical handoff/` and rebuild the zip before sending to IT.
