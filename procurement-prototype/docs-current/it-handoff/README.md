# IT Handoff Documentation

This folder is the current 2026-06-08 IT implementation handoff for the near-term scope:

- `Requester`
- `Cost Manager` (legacy label in some files: `Manager B`)
- `Dept DRI`
- `Budget Approver`
- `OM Purchasing`
- `Buyer Handoff`

The documentation is intentionally module-based, not page-only. Each module can be implemented, integrated, or reused independently from the current prototype page layout.

## Language Versions

- Traditional Chinese: [`zh-TW/`](./zh-TW/)
- English: [`en/`](./en/)

Both language versions contain the same file structure:

| File | Purpose |
| --- | --- |
| `00-naming-rules.md` | Role, tab, module, table, action, status, and field naming rules. |
| `01-module-catalog.md` | Reusable module catalog and integration boundaries. |
| `02-requester-modules.md` | Requester modules, including the final All-Phase Excel worksheet rule. |
| `03-manager-b-modules.md` | Cost Manager / legacy Manager B modules. |
| `04-om-purchasing-modules.md` | OM Purchasing modules. |
| `05-cross-role-flow.md` | Cross-role state flow and handoff rules. |
| `06-table-information-flow.md` | Table-level read/write/downstream information flow. |

Read the delivery readiness summary first:

- [`../IT_DELIVERY_READINESS_20260608.md`](../IT_DELIVERY_READINESS_20260608.md)

Older DFD visuals are maintained in `../IT_MEETING_PACKAGE_20260604/04-dfd/` as historical meeting support only. If those visuals conflict with this folder, this folder wins.

## Source Priority

For the next IT implementation phase, this folder is the source of truth when it conflicts with older docs in `docs-current/`.

## Verified Prototype State

Last verified: 2026-06-08.

- `./test.sh` passed syntax checks, 86 Node unit/system tests, Browser smoke, Layout smoke, Price routing smoke, Global UI audit, Role flow smoke, and Playwright + axe-core accessibility smoke.
- Rendered Requester audit confirmed desktop and compact viewports have no page-level horizontal overflow; Requester worksheet and Add Item popup scroll only inside their shells.
- Requester input is now the all-phase Excel worksheet: one row = `Item / Spec`, phase groups = `P1.0 / P1.1 / EVT / DVT / PVT / MP`, qty cells map to long-form `stationBreakdown`.
- Add Item popup is the requester item entrypoint with `Add / Item / Detail / Spec / Action` columns and `Lv1 / Lv2 / Lv3` filters.
- Mac mini UAT service has MySQL-backed login/session and attachment metadata APIs; main workflow rows are still prototype/demo-state backed until IT implements production APIs.
- Official requester mapping principle: `Project Family + Project Code + Demand Department -> Requester`.
- Station is used only for MFG quantity/cost analysis and never decides the requester.

## No-Source Handoff Rule

Prototype source code is not part of the IT handoff package. IT should implement from:

- handoff specifications
- data dictionary
- UAT cases
- screen walkthrough / controlled demo
- API and database expectations

Do not distribute:

- `index.html`
- `app.js`
- `styles.css`
- `server.js`
- `db/schema.sql`
- `real-data-seeds.js`
- `user-a-flow.js`
- `node_modules`
- Git / project source folders

## Scope Boundary

This package does not fully define MFG Coordinator, Sourcing, or Buyer screens. They appear only as downstream touchpoints where needed to explain Requester, Cost Manager, OM Purchasing, and Buyer Handoff flow.
