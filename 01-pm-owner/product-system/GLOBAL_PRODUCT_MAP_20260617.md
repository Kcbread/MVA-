# Global Product Map - 2026-06-17

## Status

Status: `draft-local-baseline`

This document consolidates the current MVA procurement prototype as a PM-owned
product map after the `2026617 Patch` thread. It uses local repo evidence as the
baseline and treats thread summaries as supporting evidence only.

## Startup Context Receipt

Read:
- `README.md`
- `AGENTS.md`
- `01-pm-owner/project-progress/MASTER_PM_LEDGER.md`
- `01-pm-owner/project-progress/WORKTREE_TRIAGE_20260613.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- all role files under `05-engineering-source/procurement-prototype/_context/roles/`
- flow files under `05-engineering-source/procurement-prototype/_context/flows/`
- module files under `05-engineering-source/procurement-prototype/_context/modules/`
- `05-engineering-source/procurement-prototype/PROJECT_DECISIONS.md`
- `2026617 Patch` thread final summary through Codex thread reader

Roles: Requester; Dept DRI; Cost Manager; OM Leader; OM Purchasing; Budget Approver; Admin; Buyer Handoff.

Flows/Modules: main request flow; exception flow; warehouse inventory flow; table-role-module map; API readiness.

Worktree: inspected on `codex/restructure-by-audience`; large dirty restructure remains. No destructive cleanup is performed in this pass.

Decisions used: repo `_context/` and `PROJECT_DECISIONS.md` are authoritative; `Quote Result / Monitor` replaces standalone `Quote Expiry`; Giang owns monthly USD/VND input with Mai/Admin override; `Export Excel/CSV after filter` remains deferred.

Gaps: full `./test.sh` status is inherited from patch evidence; latest patch reported a remaining `Role flow smoke` failure in Cost Manager Demand Review focused matrix.

## Product Taxonomy

Use these definitions for PM, QA, engineering, and IT handoff.

| Layer | Meaning | Example |
| --- | --- | --- |
| Feature | Business-facing capability or outcome | `Quote Result / Monitor` lets OM see quote blockers and next action |
| Function | Concrete user/system operation inside a feature | Save quote info; send to requester; calculate quote expiry status |
| Module | Code/document maintenance boundary | `quote-validity.js`; OM quote table; workflow status model |
| Role | Persona or responsibility owner | OM Leader; OM Purchasing; Cost Manager |
| Permission | Action-level authorization | view, edit, approve, assign, export, maintain, override |
| Workflow Status | Current process state for a request id, with owner and aging | Waiting PAS Reply; Waiting Requester; Buyer Handoff |

## Feature Catalog

| Feature | Business Purpose | Primary Roles | Current Status | Evidence |
| --- | --- | --- | --- | --- |
| Request Workspace | Requester creates demand in all-phase MFG / Non-MFG worksheet format | Requester | Current | `roles/01-requester.zh-TW.md`; `index.html`; `request-worksheet-matrix.js` |
| Add Item / Source Picker | Add Catalog, Reuse Item, Copy Demand, or New Item Request rows | Requester | Current | `roles/01-requester.zh-TW.md`; `index.html` |
| Warehouse Inventory | Candidate-based stock reuse with owner lock before cost impact | Requester; Dept DRI; warehouse owners | Current | `flows/warehouse-inventory-flow.zh-TW.md`; `carryover-extension.js` |
| Request Status / Workflow Status | Show pending owner, current stage, days pending, next action | all roles by visibility | Current | `workflow-status.js`; `workflow-status-table.js` |
| Dept Review | Scoped first review for requester submissions and related evidence | Dept DRI | Current | `roles/02-dept-dri.zh-TW.md`; `approval-review-surface.js` |
| Cost Review | Cost Manager authorization with protected quantity/cost evidence | Cost Manager | Current | `roles/03-cost-manager.zh-TW.md`; `demand-cost-dashboard.js` |
| Budget Review | Final approval for price/budget exceptions | Budget Approver | Current | `roles/06-budget-approver.zh-TW.md`; `price-decision.js` |
| Request Tracking | Per request cross-role read-only progress table after Requester submits demand; role permissions control visible columns/actions; legacy technical id may remain `projectStatus` until moduleization | requester/approvers/OM/buyer/admin | Current | `index.html`; `tests/system-contract.test.js` |
| Project Status | Project current phase/status label such as `P1.0 / EVT / DVT / PVT / MP`; not a request tracking module or tab | requester/approvers/OM/buyer/admin | Naming lock | Project config/current phase fields |
| OM Submission Dashboard | OM Leader/Purchasing monitor by project/item pivot and stage aging | OM Leader; OM Purchasing | Current after patch | `PROJECT_DECISIONS.md`; `index.html`; `app.js` |
| PAS Demand No | OM records PAS demand number after PAS generates it | OM Purchasing | Current | `PROJECT_DECISIONS.md`; `index.html` |
| Quote Result / Monitor | OM records quote result and monitors blocker, stage, aging, validity | OM Purchasing; OM Leader | Current after patch | `PROJECT_DECISIONS.md`; `quote-validity.js`; `workflow-status.js` |
| Monthly USD/VND Rate | Monthly locked exchange rate used for quote conversion | Giang; OM Leader; Admin | Current after patch | `roles/04-om-leader.zh-TW.md`; `roles/05-om-purchasing.zh-TW.md`; `role-guards.js` |
| Export Package | OM prepares CFA/ECS package and hands off to Buyer | OM Purchasing; OM Leader | Current | `PROJECT_DECISIONS.md`; `index.html` |
| Buyer Handoff | Post-OM-export PR/PO ownership marker | Buyer Handoff | Current status marker | `roles/08-buyer-handoff.zh-TW.md`; `workflow-status.js` |
| Admin Setup | User, role, mapping, threshold, approval-chain, OM setup governance | Admin | Current | `roles/07-admin.zh-TW.md`; `role-guards.js` |
| SAP PO Raw Import | Import SAP raw PO mirror and scope OM/MFG rows | Admin/engineering | In progress / technical | `sap-po-raw-importer.js`; `db/migrations/002_sap_po_raw_mirror.sql` |
| Filtered Excel/CSV Export | Export currently filtered OM rows after field/permission definition | OM roles, exact scope TBD | Deferred | `02-oa-internal-test/Patchnote /20260617 OM QA patchnote intake.md` |

## Function Catalog

| Feature | Functions | Notes |
| --- | --- | --- |
| Request Workspace | Save Draft; Submit current line + current worksheet; edit MFG station qty; edit Non-MFG department qty; set need date | Submit requires current worksheet need date and qty > 0 |
| Add Item / Source Picker | Add Catalog; Reuse Item; Copy Demand; create New Item Request | Catalog is DB catalog data; Reuse Item uses DB items already used by projects; Copy Demand copies MFG / Non-MFG item/spec trace into the current demand with target qty = 0 |
| Warehouse Inventory | Stock In; Create Use Candidate; Owner Lock; Owner Reject; ledger trace | Pending candidate is evidence; locked use affects cost |
| Dept Review | Approve; reject; direct quantity edit with audit; review history | Dept DRI approve routes to Cost Manager |
| Cost Review | Authorize; reject; direct quantity edit with audit; inspect Demand Cost Dashboard / Station Matrix | Authorization routes to OM Leader intake |
| Budget Review | Final approve; reject; direct quantity edit with audit | Handles price/budget exceptions after Dept DRI |
| Request Tracking | Review per request cross-role progress; drill into MFG station detail; drill into Non-MFG department detail | No business actions; technical ids may still use legacy `projectStatus`; Project Status means project current phase label such as `EVT` or `P1.0` |
| Project Status | Show or filter project current phase/status such as `EVT`, `P1.0`, `PVT` | Must not be used as the top-level cross-role tracking table name |
| OM Submission Dashboard | Project View; Item View; scope label; assignment visibility; stage aging | Budget/PR/PO/shipping are not primary columns |
| PAS Demand No | Enter PAS Demand No; Move to Quote; Reject to DRI; Detail | Does not upload quote evidence |
| Quote Result / Monitor | Save Quote Info; enter PAS Material No/vendor/price/date/validity; upload quote screenshot and Excel; send to User A; reject to DRI; show blocker/stage/days/next action | Quote validity is not a separate tab |
| Monthly USD/VND Rate | Giang save monthly rate; Mai/Admin override; quote date month lookup; fallback to latest previous locked rate | Linh disabled unless assigned later |
| Export Package | Choose Expense/Capex; generate/export package; mark exported; reject to DRI; detail | Buyer owns PR/PO after export |
| Buyer Handoff | Show exported package and Buyer PR/PO responsibility | Full Buyer operations are future scope |
| Admin Setup | Manage users/roles/mapping/thresholds/approval chain/OM members/audit | Admin is not a business approver |

## Module Map

| Module | Responsibility | Product Layers It Supports |
| --- | --- | --- |
| `app.js` | Main prototype state, rendering, role workspaces, OM patch behavior | most UI features and runtime wiring |
| `index.html` | Static structure, tabs, table shells, modal shells | main navigation and screen entrypoints |
| `styles.css` | Visual styling and layout | all UI surfaces |
| `role-guards.js` | Role aliases, field visibility, admin permissions, OM assignment/rate permissions | permissions and sensitive field guards |
| `workflow-status.js` | pending owner, current stage, days pending, quote status, next action | workflow status across roles |
| `workflow-status-table.js` | role-based workflow status table projection | Request Status and status tables |
| `approval-review-surface.js` | shared approval workspace config for Dept DRI / Cost Manager / Budget Approver | approval feature shell |
| `approval-quantity-review.js` | Dashboard, MFG station detail, Non-MFG department detail, row picker | shared quantity evidence |
| `approval-workbench.js` | approval queue layout helper | approval queue UI |
| `demand-cost-dashboard.js` | cost and phase/unit aggregation, carryover cost impact | Cost Review / Demand Cost Dashboard |
| `request-worksheet-matrix.js` | Requester worksheet header/row/phase rendering | Request Workspace |
| `quote-validity.js` | quote validity and currency conversion helpers | Quote Result / Monitor |
| `price-decision.js` | quote vs history threshold and estimate comparison | price exception flow |
| `ftv-code.js` | purchase route, FTV status, export blocking rules | Export Package / customs audit |
| `lead-time.js` | ETA / lead-time helper | downstream timing estimates |
| `project-status-dashboard.js` | legacy-named request tracking aggregation helper | Request Tracking; currently not loaded by `index.html` per system contract |
| `horizontal-table-navigator.js` | stable horizontal navigation for wide tables | dashboards and matrix tables |
| `role-queue-config.js` | approval role/queue metadata | shared approval review surface |
| `shared-formatters.js` | money/currency formatting helpers | cross-module formatting |
| `sap-po-raw-contract.js` | SAP PO raw data contract and material identity mapping | SAP import / DB mirror |
| `sap-po-raw-importer.js` | SAP PO raw Excel preview/commit flow | SAP import / DB mirror |
| `server.js` | static hosting and minimal API health/session support | API/MySQL POC |
| `db/schema.sql` and `db/migrations/*.sql` | database schema and migrations | API/MySQL POC |

## Role Permission Matrix

Legend: `V` view, `C` create, `E` edit, `A` approve/authorize, `R` reject/return, `S` assign, `X` export, `M` maintain setting, `O` override.

| Feature / Function | Requester | Dept DRI | Cost Manager | OM Leader | OM Purchasing | Budget Approver | Admin | Buyer Handoff |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Request Workspace | V/C/E own draft, submit | V scoped evidence | V approved evidence | - | - | V exception evidence | V setup/audit | - |
| New Item Request | C pending request | A/R need first | V if routed | V master review context | V master review context | - | M setup | - |
| Warehouse Candidate | C candidate | A/R Unit-owned | V locked cost evidence | A/R OM-owned if owner | A/R assigned OM-owned if owner | V exception evidence | M setup/audit | - |
| Dept Review | - | V/A/R/E direct qty | V next-stage evidence | - | - | V if price exception later | V setup/audit | - |
| Cost Review | - | V prior decision | V/A/R/E direct qty | - | - | V exception evidence | V setup/audit | - |
| Budget Review | - | V prior decision | V cost context | - | - | V/A/R/E direct qty | V setup/audit | - |
| Request Tracking | V scoped | V scoped | V scoped | V OM scope | V assigned scope | V scoped | V all | V handoff scope |
| OM Submission Dashboard | - | V only if routed context | V after authorize context | V all/S | V assigned V | V if budget exception context | V all | V after export |
| PAS Demand No | - | - | - | V all | V/E assigned | - | V all | - |
| Quote Result / Monitor | V quote amount/status only through Action Required / Status | V price exception summary | V cost context | V all monitor | V/E assigned quote rows | V price/budget exception | V all | V after export metadata |
| Monthly USD/VND Rate | - | - | - | V/O | Giang V/M; Linh V only | - | V/O | - |
| Export Package | - | - | - | V all | V/E/X assigned | - | V all | V after exported |
| Admin Setup | - | - | - | - | - | - | V/C/E/M | - |
| Buyer PR/PO Handoff | V high-level status | V status | V status | V handoff status | V handoff status | V status | V all | V primary |

## Workflow Status Matrix

| Stage | Pending Owner | Stage Start | Next Action | Primary Evidence |
| --- | --- | --- | --- | --- |
| Dept DRI Review | Dept DRI | Requester submitted date | Dept DRI approve / reject | `workflow-status.js`; Dept Review |
| Demand Review | Cost Manager | Dept DRI approved date | Cost Manager authorize / reject | Cost Review |
| Budget Approval | Budget Approver | Dept DRI price exception approval | Budget final decision | Budget Review |
| PAS Demand No | OM Purchasing | row sent to OM / manager approval | Enter PAS Demand No | OM PAS Demand No |
| PAS Quote Result | PAS / Bidding or OM Purchasing | PAS Demand No recorded date | Wait for PAS bidding or complete quote result | Quote Result / Monitor |
| Waiting Requester | Requester | sent-to-User-A date | requester confirms/cancels quote need | Action Required |
| Price Review | Dept DRI / Budget Approver | quote result price decision date | exception review | exception flow |
| Export Package | OM Purchasing | requester confirmation or budget approval | choose Expense/Capex and export | Export Package |
| Buyer PR / PO | Buyer Handoff | final exported / buyer received date | Buyer owns PR/PO after OM export | Buyer Handoff |
| Completed | OM Complete | terminal event | no action | history/timeline |

## Deferred / Open Items

| Item | Status | Required Definition Before Implementation |
| --- | --- | --- |
| Export Excel/CSV after filter | Deferred | filtered rows scope, fields, vendor/price/PAS visibility, OM Leader vs OM Purchasing export range, audit requirement |
| Full Buyer PR/PO operation | Future | Buyer role actions, PR/PO fields, SAP/API owner, evidence model |
| API/MySQL full workflow persistence | Incremental | API response contracts, transactions, audit, role/session enforcement |
| Repository deletion / re-upload | Last-resort recovery option | backup, migration map, remote strategy, explicit second confirmation |

## File Logic Notes

- Use `01-pm-owner/product-system/` for PM synthesis maps.
- Keep role/flow/module truth in `05-engineering-source/procurement-prototype/_context/`.
- Keep QA patch notes in `02-oa-internal-test/Patchnote /`.
- Keep IT handoff in `03-it-handoff/current-docs/`.
- Treat `07-review-and-artifacts/` as evidence, not product truth.
- Treat `99-archive/` as historical reference only.

## Risks

- The worktree is still a large audience-restructure branch with many old-path deletions and new untracked paths. Do not commit all changes together.
- Context files had some old OM quote/expiry naming, corrected in this pass for current source files.
- `role-guards.js` still exposes Admin delete permissions in setup metadata; this is setup-level governance, not business approval. Any future production API must enforce server-side role/session checks.
- Full test status is not re-run by this document pass. Patch thread evidence reported OM contract and OM-only smoke passing, but full `./test.sh` stopped at a pre-existing Role flow smoke issue.

## PM Rule For Future Changes

Every new request should be classified before implementation:

```text
feature change / function change / permission change / data contract change / workflow status change / UI-only change
```

If a request changes permission, role ownership, canonical data, workflow state,
API/DB behavior, testing standard, or IT handoff content, update the relevant
`_context/` source and this product-system map.
