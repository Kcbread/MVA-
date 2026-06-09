# Frontend Functional Specification - 2026-06-08

This document is a no-source IT implementation reference. It describes behavior and contracts only; prototype source code is not part of the handoff.

## 1. Product Purpose

The system standardizes procurement demand collection, approval, cost/quantity review, OM PAS/quote work, requester confirmation, and buyer handoff.

Primary roles:

- `Requester`
- `Dept DRI`
- `Cost Manager`
- `OM Leader`
- `OM Purchasing`
- `Budget Approver`
- `Admin`
- `Buyer Handoff`

Legacy labels such as `User A`, `OPM`, `Manager B`, or `Downstream` should not be used as new implementation labels unless migration text is required.

## 2. Requester Workspace

Requester demand input is a full-page Excel-like worksheet.

Locked rules:

- `MFG / Non-MFG` are separate input tabs.
- One worksheet row = `Item / Spec`.
- Top scope chooses Project and Line.
- Need Date is package-level.
- Qty cells are edited directly in the worksheet.
- `Save Draft` does not require Need Date.
- `Submit` requires package-level Need Date and at least one qty cell > 0.

MFG phase group columns:

```text
P1.0 / P1.1 / EVT / DVT / PVT / MP
each expands:
CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH / Phase Total
```

Non-MFG phase group columns:

```text
P1.0 / P1.1 / EVT / DVT / PVT / MP
each expands:
FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC / Phase Total
```

Data mapping:

```text
requestId + project + requestLine + demandType + phase + station/demandUnit + qty
```

Implementation target:

```text
stationBreakdown[]
```

Totals are calculated and must not be stored as independent canonical values.

## 3. Add Item Popup

`Add Item` is the primary row creation entrypoint.

Popup columns:

```text
Add / Item / Detail / Spec / Action
```

Toolbar:

- Search
- Lv1 / Lv2 / Lv3 cascading filters
- Catalog / Reuse / Copy Demand / New Item Request source tabs

Rules:

- `Add` is the first column.
- Source type is a badge inside the Item cell.
- Detail shows Lv123 path and source reference.
- Spec shows requester-safe product spec only.
- Catalog / Reuse / Copy Demand / New Item Request all create worksheet rows with target qty = 0.
- Copy Demand never copies source qty into target qty.

Deprecated requester input concepts:

- Source Panel
- Add Demand Lines modal
- Phase Trace popup column
- inline first-row add
- item/spec + phase row model

## 4. Privacy Rules

Requester-facing views must not show:

- vendor
- supplier
- PAS material no
- factory material no
- OM assignee
- FTV

OM, Cost Manager, Buyer Handoff, and Admin may see additional internal fields only when their role owns that workflow stage.

## 5. Cost Manager

Cost Manager tabs:

- `Approval`
- `Demand Analysis`
- `Progress Tracking`
- `Project Setup`

Demand Analysis has:

- `Cost Dashboard`
- `Station Matrix`

Cost Dashboard is the first-level item x unit cost/quantity view. Station Matrix is the high-density phase x station drilldown. Do not replace the Cost Manager baseline when implementing Requester worksheet.

## 6. OM Purchasing

OM Purchasing tabs:

- `Submission Dashboard`
- `PAS Demand No`
- `PAS Quote Result`
- `Export Package`

Rules:

- PAS Demand No is recorded before moving to PAS Quote Result.
- PAS Quote Result owns PAS Material No, quote result, quote validity, PDF/Excel attachment state, and price decision.
- Quote Valid Until is required before sending quote result to Requester unless the row is auto-cleared by price rule.
- Export Package receives Requester confirmed, Auto Cleared, or Budget Approver Approved rows.

## 7. Carryover And Warehouse

- Requester may create carryover/warehouse candidates from row detail.
- Main worksheet only shows hint badges.
- Dept DRI owns formal carryover review.
- Pending/rejected carryover is visible evidence and must not reduce cost.
- Applied carryover affects effective qty/cost in Cost Manager Demand Analysis.

## 8. No-Source Handoff

IT receives this specification, module handoff docs, data dictionary, UAT cases, and controlled demo access. IT does not receive prototype source code.
