# IT Official Handoff Readiness - 2026-06-08

## 2026-06-15 Latest Review

Latest live-doc review: [`IT_DELIVERY_LATEST_REVIEW_20260615.md`](./IT_DELIVERY_LATEST_REVIEW_20260615.md).

The live Markdown and SQL files under `docs-current/` and `db/` are the current reviewed handoff baseline. Existing zip files and `handoff-delivery/20260608/` are historical snapshots unless rebuilt after the 2026-06-15 review.

## Delivery Position

This is a **no-source IT handoff**.

The prototype source code is not included and should not be requested as the implementation base. IT should implement the production system from the specifications, data dictionary, UAT cases, workflow rules, and controlled demo walkthrough.

## What IT Receives

- `it-handoff/` bilingual module specifications.
- Requester All-Phase Excel worksheet rules.
- Add Item popup UX / source matching / Lv123 filter rules.
- Table information flow and long-form quantity mapping.
- UAT acceptance cases.
- Data dictionary.
- Mac mini controlled demo access guide.

## What IT Does Not Receive

- HTML / JS / CSS prototype source.
- Node server source.
- MySQL schema source files.
- Demo seed data files.
- `node_modules`.
- Git history or project workspace.

## Latest Locked Requester Rule

Requester input is a full-page Excel-like worksheet:

- One row = `Item / Spec`.
- Phase groups = `P1.0 / P1.1 / EVT / DVT / PVT / MP`.
- MFG phase group expands:
  - `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`.
- Non-MFG phase group expands:
  - `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.
- Every qty cell maps to:

```text
requestId + project + requestLine + demandType + phase + station/demandUnit + qty
```

- Production implementation should store these as long-form `stationBreakdown` rows.
- Totals are calculated, not stored independently.
- Add Item popup columns are:

```text
Add / Item / Detail / Spec / Action
```

- Deprecated Requester concepts:
  - `Source Panel`
  - `Add Demand Lines modal`
  - `Phase Trace` popup column
  - `Item / Spec + Phase` worksheet rows
  - Copying source qty into target qty

## Privacy Guard

Requester-facing screens must not show:

- vendor
- supplier
- PAS material no
- factory material no
- OM assignee
- FTV

## Prototype Verification

Last verified: 2026-06-08.

`./test.sh` passed:

- Syntax checks
- 86 Node unit/system tests
- Browser smoke
- Layout smoke
- Price routing smoke
- Global UI audit
- Role flow smoke
- Playwright + axe-core accessibility smoke

Rendered audit also confirmed:

- desktop and compact Requester Add Item popup has no page-level horizontal overflow
- Requester worksheet scrolls inside its own table shell
- Add Item popup scrolls inside its own table shell
- phase group labels are centered
- requester privacy guard holds

## Mac Mini Demo Rule

Use the Mac mini only for a controlled demo through the `IT-Demo` account.

Do not provide:

- SSH / Remote Login
- File Sharing
- direct source folder access
- repo access
- static website file copies

Preferred demo modes:

1. Screen share from the owner account while the owner drives.
2. Screen Sharing / Remote Management into the `IT-Demo` account, with only the browser open.

Do not expose a LAN URL as the primary handoff if the goal is no-source handoff. Browser access to a frontend prototype can allow users to inspect/download HTML/JS/CSS assets.

## IT Implementation Expectation

IT should build production APIs, database schema, authentication, permissions, file storage, and audit history from the handoff specs. The prototype is a validated product/UX/business-logic reference, not the codebase to copy.
