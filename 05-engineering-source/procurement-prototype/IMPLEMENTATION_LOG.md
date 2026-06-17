# Implementation Log

## 2026-06-08

### Pending Material Master Request + Estimate Variance

- Reworked requester `New Item Request` so it opens a material master request draft instead of directly adding an active item row.
- Added required material master draft fields: CN/EN/VN names, Lv123, spec summary, structured spec, UOM, use case, estimate unit price/amount/reason, and duplicate difference/evidence when similar items exist.
- Pending new material rows now enter the worksheet as `Pending Material Review`; they can receive qty but do not become active `item_master` catalog data until approved or merged by the review flow.
- Added `item_master_requests` to schema/migration targets for pending material master governance.
- Added estimate-vs-PAS quote variance tracking with global display of requester estimate, PAS quote, delta USD/%/total, and variance status while preserving requester privacy for vendor/PAS/factory/FTV/OM fields.

### No-Source IT Official Handoff

- Locked the handoff strategy: IT receives specifications, UAT, data dictionary, screen/demo guidance, and Mac mini controlled demo access; prototype source code is not part of the handoff.
- Added `docs-current/IT_DELIVERY_READINESS_20260608.md` as the latest IT delivery entrypoint.
- Added `docs-current/MAC_MINI_IT_DEMO_ACCESS_NO_SOURCE_zhTW.md` for the `IT-Demo` account and Screen Sharing-only access model.
- Updated current handoff docs to reflect Requester All-Phase Excel worksheet and Add Item popup final rules.
- Updated `frontend-functional-spec.md`, `ui-screen-guide-en.md`, `uat-test-cases-en.md`, and `data-dictionary-en.md` to remove stale User A / Source Panel / Demand Editor primary-input language.
- Handoff package must exclude HTML, JS, CSS, server, SQL schema, seed files, node_modules, Git history, and project source folders.

### Requester All-Phase Excel Worksheet + Add Item Popup

- Replaced the `Item / Spec + Phase` worksheet row model with `Item / Spec` rows and all-phase grouped headers.
- MFG worksheet now repeats `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH` under `P1.0 / P1.1 / EVT / DVT / PVT / MP`.
- Non-MFG worksheet now repeats `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC` under the same phase groups.
- Moved primary item entry to the left/top `Add Item` popup with `Add / Item / Detail / Spec / Action`; `Add` is the first column.
- Added `Lv1 / Lv2 / Lv3` cascading filters in the Add Item popup and moved source type to a badge inside the Item cell.
- Reused Catalog / Reuse / Copy Demand / New Item Request handlers while seeding all target phase qty cells at 0 and preserving source qty only as trace/reference.
- Changed requester qty cells to keyboard-friendly non-negative integer inputs with paste/input sanitization and Enter-to-next-cell navigation.
- Kept API and schema unchanged: every worksheet qty cell still maps to long-form `stationBreakdown` by `item + phase + station/demandUnit + line + mode`.

### Requester Excel Worksheet Reset

- Superseded the previous `Source Panel + Demand Matrix` requester input direction after UI/UX + business-logic review.
- Rebuilt Request Workspace as a full-page Excel-style worksheet with `MFG / Non-MFG` tabs, top `Project / Line / Need Date` controls, and a fixed first add/search row.
- Locked worksheet row semantics to `Item / Spec + Phase`; station/department quantity is edited as worksheet columns and still maps to long-form `stationBreakdown` rows without API or schema changes.
- MFG columns are `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`.
- Non-MFG columns are `FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.
- Merged Catalog / Reuse / Copy Demand / New Item Request entry into the first worksheet row with source badges; Copy Demand expands by phase and all target qty starts at 0.
- Kept carryover / warehouse suggestion as row-level hints with detail handling, not as an independent Add Demand modal workflow.

### Requester Inline Source Panel + Demand Matrix Workspace

- Moved requester `Catalog / Reuse Item / Copy Demand / Create New Item` from the standalone Add Demand modal into the left side of `Request Workspace`.
- Kept the right side as the primary Excel-like `Item / Spec x phase qty` Demand Matrix for the current `Line + Station/Department` scope.
- Removed the standalone `Add Demand Lines` entrypoint and renamed the auxiliary demand editor language to `Demand Detail` so it does not read as the primary demand input.
- Updated requester context and UI/layout smoke contracts to guard the inline source panel, matrix input, and requester privacy behavior.

### Requester Excel-like Demand Input + Item Owner Routing

- Reworked Request Workspace draft entry into an Excel-like `item/spec x phase qty` sheet:
  - Main table columns are only `Item / Spec`, `P1.0`, `P1.1`, `EVT`, `DVT`, `PVT`, `MP`, and `Total`.
  - Removed requester main-table `Select`, `Owner`, `Source`, `Scope / Unit`, row `Need Date`, `Status`, `Actions`, and `Detail`.
  - MFG station and Non-MFG department are controlled by the compact current input scope above the table instead of table columns.
- Split requester actions into `Save Draft` and `Submit`:
  - `Save Draft` does not require Need Date.
  - `Submit` sends all current-scope draft rows with qty and requires one package-level Need Date.
- Added Non-MFG department dropdown and MFG station dropdown in the input scope so users cannot type unmanaged unit/station names.
- Changed Reuse Item / Copy Demand behavior to copy item/spec/source trace only; target line quantity starts at 0 and must be re-entered in the target scope.
- Added read-only item owner classification for Requester:
  - OM-owned: PC / IPC / laptop / monitor / QR code scanner / Zebra printer / PDA / Data Collector / 數據採集器.
  - Non-OM exclusions include keyboard, mouse, HP/general printer, printer/scanner accessories, server, network, and software.
- Routed warehouse candidates by owner:
  - OM-owned -> Pending OM / OM lock.
  - MFG-owned -> Pending MFG Owner / MFG owner lock.
  - Unit-owned -> Pending Unit Owner / Unit owner / Dept DRI lock.
- Updated requester, Dept DRI, and warehouse context docs to keep future threads aligned.

### OM Internal Test Attachment Persistence

- Deployed local attachment retention MVP to the Mac mini UAT service.
- Added MySQL `attachments` table for attachment metadata.
- Added authenticated attachment API:
  - `POST /api/attachments`
  - `GET /api/attachments/:id`
- Wired real uploads for:
  - UAT feedback screenshot
  - OM quote screenshot
  - OM quote Excel
  - sourcing/procurement quote screenshot fields that share the existing quote attachment surface
- Added role guards so OM-internal files are downloadable by OM/Admin/uploader but blocked from requester access.
- Set deployed upload root to `/Users/kai-chenyang/Services/mva-procurement/uploads`.
- Added API and system-contract coverage for upload metadata, file download bytes, requester blocking, and attachment audit events.
- Verification:
  - `node --check server.js`
  - `node --check app.js`
  - `node --test tests/api.test.js`
  - `node --test tests/system-contract.test.js`
  - deployed `./test.sh`
  - live MySQL smoke: OM upload/download passed, requester download blocked, smoke file/metadata cleaned.

## 2026-06-02

### v1.0 UI Logic Consolidation

- Shortened User A reuse row action from `Add Item to Request` to `Add`, keeping the full action meaning in tooltip / detail.
- Moved Reuse by Project Package command buttons into a dedicated command bar so filters and actions no longer collide.
- Split Manager B `Selected Phase Department Total` out of the item detail table and into an independent summary table above the Excel-like dashboard.
- Updated OM `Submission Dashboard` around pending owner, current stage, days pending, quote status, and next action.
- Added OM helper logic for pending owner classification:
  - `OM Purchasing`
  - `PAS / Bidding`
  - `User A`
  - `Buyer`
- Added quote status classification:
  - `Reusable Quote`
  - `Waiting PAS Reply`
  - `Expiring Soon`
  - `Expired / Requote Required`
- Converted OM exchange rate from a large work panel to a compact utility strip.
- Added `_doc/v1.0.md` and regression tests for User A compact actions, Manager separate phase total, and OM pending owner columns.

### v0.9 Layout Stabilization

- Reworked User A `Add / Reuse Item` history tables into compact layouts so Add actions remain visible without horizontal scrolling.
- Reduced reuse table columns to decision-critical fields and moved long spec / PO / material details into clamped cells, titles, or Detail.
- Added compact currency formatting for Manager B `Demand Cost Dashboard` so amount cells remain readable while preserving full values in title/detail.
- Rebalanced Manager cost dashboard table widths to keep Excel-like density without cutting core monetary meaning.
- Converted OM `Exchange Rate` into a compact inline editor with `Save Rate`, role-aware disabled state, and clearer active/fallback rate status.
- Bumped asset query versions to force the browser to reload the corrected v0.9 CSS/JS.
- Added `_doc/v0.9.md` and regression guards for compact item picker tables, readable Manager amount display, and compact OM exchange-rate controls.

### UI Quality Review Skill + Accessibility Guardrails

- Added global Codex skill `procurement-ui-quality-review` to standardize readability, WCAG 2, attention flow, action clarity, and visual consistency reviews.
- Added bilingual UI quality SOP files under `_doc/`.
- Added `_doc/v0.6.md` as the UI quality review baseline.
- Updated testing SOP and `procurement-testing-standard-op` to include accessibility smoke and qualitative UI review.
- Added optional `tests/accessibility-smoke.js`; `test.sh` runs it only when Playwright and axe-core are available and otherwise reports an explicit skip.
- Tightened Manager B `Demand Analysis > Cost Dashboard` away from low-value summary cards and toward the Excel `Dashboard` sheet contract:
  - `ENG Name / CN-ENG Name / VN Name / Price`
  - `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`
  - phase + line count + view controls
- Added system contract guards for the UI quality files and skill.

### Manager Cost Dashboard Layout + OM Exchange Rate Control

- Tightened Manager B `Cost Dashboard` control row so Project / Phase / Line Count / View Mode stay in a compact one-line scope area.
- Added table cell truncation and title tooltips for the Excel-like cost dashboard to reduce text overlap while preserving high information density.
- Rebalanced Cost Dashboard sticky column widths and unit/total columns to prevent amount text from bleeding into adjacent columns.
- Changed OM `Exchange Rate` action from a large primary block to a compact inline `Save` button.
- Test result: `./test.sh` passed syntax checks, unit tests, and system contract tests. Browser and accessibility smoke were explicitly skipped because Playwright / axe-core are not installed.

## 2026-06-01

### Testing Skill + Contact Popup + Manager Restore Guard

- Added global Codex skill `procurement-testing-standard-op` to standardize `./test.sh`, syntax checks, unit tests, system contract tests, and browser smoke interpretation.
- Added bilingual testing SOP files under `_doc/`.
- Added `_doc/v0.3.md` for this testing/contact/Manager guard version.
- Removed `Contacts` as a top-level navigation tab and replaced it with a topbar `Contact` popup that can copy contact text.
- Kept Manager row-level `Contact DRI` modal separate from the topbar Contact popup.
- Updated system contract tests to fail if `Contacts` returns as a top-level view or if Manager B's official tab structure drifts.

### Manager B / OM Purchasing UI Consolidation + Test Harness

- Updated Manager `Cost Dashboard` from item x unit to Excel-style item x phase x unit, with meaningful cards for total estimated amount, MFG amount, Non-MFG amount, highest unit, highest phase, and price pending.
- Added realistic Non-MFG demo demand rows across FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC so Manager can inspect a populated dashboard.
- Reworked OM `Submission Dashboard` table around OM operational aging: received date, current stage, days in stage, next action, quote expiry, pending reason, and detail.
- Added stale OM tab fallback so old local state pointing to `quoteExpiry` returns to `Submission Dashboard`.
- Updated `_doc/v0.5.md`, bilingual handoff docs, and tests to lock the new Manager/OM structure.
- Removed the active Manager render override path so Manager B is rendered from one primary `renderManager()` source.
- Restricted `Temporary Budget Request` input UI to OPM `New Request`; Manager, OM, Admin, and Contact popup contexts are cleaned if any stale panel exists.
- Reworked Manager B top-level tabs to `Approval / Demand Analysis / Progress Tracking / Project Setup`.
- Moved Approval History under `Approval` so Manager approval and history are one workbench.
- Reworked `Demand Analysis` into a two-layer workspace:
  - `Cost Dashboard` first, following the Excel Dashboard-style item x phase x unit layout.
  - `Station Matrix` second, preserving the high-density Excel-like station matrix.
- Reworked OM Purchasing tabs to `Submission Dashboard / PAS Demand No / PAS Quote Result / Export Package`.
- Simplified OM `Submission Dashboard` to OM stage tracking instead of Budget/PR/PO/Arrived-heavy progress columns.
- Consolidated quote validity inputs into the `PAS Quote Result` quote card: Quote Received Date, Quote Valid Until, and expiry status.
- Moved quote expiry from a workflow tab into the `Submission Dashboard` monitor.
- Added `Received Date` and `Days in Stage` to OM `Submission Dashboard`.
- Added first-stage classic-script modules under `app-modules/`:
  - `quote-validity.js`
  - `demand-cost-dashboard.js`
- Added `tests/unit.test.js`, `tests/system-contract.test.js`, and `test.sh`.
- Added `_doc/v0.1.md` baseline and `_doc/v0.2.md` for this consolidation version.
- Test result: `./test.sh` passed syntax checks, unit tests, and system contract tests. Browser smoke was explicitly skipped because Playwright is not installed in this environment.
- Remaining engineering debt: `app.js` and `real-data-seeds.js` still need deeper module extraction beyond the safe first-stage modules.

### Manager/OM Quote Validity Stabilization

- Disabled the old global Temporary Budget / Quote Validity DOM observers that injected cards into Manager, OM, Admin, and shared tables.
- Rebuilt OM `Quote Completion` as a compact PAS quote / bidding result workbench with row-level `Quote Validity`.
- Added `Quote Received`, `Quote Valid Until`, and derived expiry status directly to Quote Completion; `Quote Valid Until` is now required before `Send to User A`.
- Updated the quote expiry warning threshold to 14 days and refreshed OM demo rows so one ready quote can be sent to User A.
- Tightened OM Quote Completion table columns to avoid the previous wide-column layout and text overlap.
- Updated bilingual IT handoff and Kuso AI brief files with the new quote validity flow and DOM-injection guardrail.

### Temporary Budget Scope Hotfix + Reuse/Contact Handoff Update

- Fixed a cross-role UI pollution bug where the `Temporary Budget Request` input panel could be injected into non-OPM views by observer-based DOM enhancement.
- Added active-view and active-role guards so the temporary budget input panel can exist only inside `OPM / New Request`.
- Added cleanup on role/view switch to remove misplaced temporary budget panels, manager dashboard cards, OM cards, and quote-validity summaries from views where they do not belong.
- Bumped `index.html` asset query versions to force the browser to reload the corrected `app.js`.
- Formalized `Reuse Item` as two modes in IT handoff docs:
  - `Reuse by Item`
  - `Reuse by Project Package`
- Documented source-vs-target semantics: `Source Project` filters history only; imports always add to the current OPM target project.
- Documented Contact as a shared topbar utility and separated it from row-level `Contact DRI`.
- Updated bilingual IT handoff files and `PROJECT_DECISIONS.md` for Kuso AI flow refresh.

## 2026-05-30

### Bilingual IT Handoff Documentation

- Added `docs-current/it-handoff/` as the current IT handoff package for the near-term scope:
  - `OPM / DRI Requester`
  - `Manager B`
  - `OM Purchasing`
- Produced bilingual handoff documentation:
  - Traditional Chinese under `docs-current/it-handoff/zh-TW/`
  - English under `docs-current/it-handoff/en/`
- Documented normalized naming rules for roles, tabs, module IDs, table IDs, actions, statuses, and key fields.
- Documented reusable module definitions for OPM, Manager B, and OM Purchasing so modules can be integrated without depending on the current page layout.
- Documented table-level information flow: what each table reads, writes, and passes downstream.
- Added Kuso AI visualization briefs with Mermaid diagrams and ready-to-paste prompts for swimlane, module dependency, state machine, table flow, and dashboard wireframe diagrams.
- Updated `PROJECT_DECISIONS.md` so `docs-current/it-handoff/` is the current naming and IT handoff source when older docs conflict.

## 2026-05-29

### OM Flow Naming And PAS Stage Rework

- Renamed User A navigation to `New Request / Reuse Item / Action Required / Request Status`.
- Renamed Manager B progress tab to `Progress Dashboard`.
- Renamed OM tabs to `Submission Status / PAS Result Queue / Quote Completion / Export Package`.
- Re-scoped `PAS Result Queue` so it only records PAS Demand No after PAS/Bidding returns it, then moves the row into `Quote Completion`.
- Removed the old visible PAS export/send-to-PAS workbench meaning from the queue; quote PDF/Excel attachment work remains only in `Quote Completion`.
- Made `Quote Completion` require PAS Material No, vendor, quote date, unit price, quote PDF, and quote Excel before sending to User A confirmation.
- Kept PAS Demand No and PAS Material No visible through Quote Completion, Export Package, Buyer, Detail, and timeline.
- Updated compact timeline milestones to show `PAS Demand No` and `Quote Ready` instead of the older `Sent OM`-style milestone.

## 2026-05-28

### OM Buy Classification Master Refresh

- Regenerated `REAL_OM_RESPONSIBILITY_MASTER` from `OM Buy .xlsx` sheet `VietNam Detailed - Chi tiết VN` with 257 classified rows.
- Changed User A taxonomy dropdowns and OM catalog display to use English Level 1 / Level 2 / Level 3 names first.
- Updated Add Item natural search to search product/spec and English OM classifications instead of vendor/material tracking fields.
- Disabled the practical impact of the old maintain gate for classified OM items so categorized rows can go straight into Request Builder and Manager approval.

### User A Request UX And Manager Receive Fix

- Added requester-facing spec sanitization so User A Add Item / Draft Items / My Submissions / Need Confirmation show product specs without brand or OM owner/responsibility text.
- Tightened requester Detail modal so User A sees item/spec/quote action context, while OM owner, PAS tracking, vendor, and material number fields remain internal to OM/Manager/Buyer views.
- Kept OM/PAS raw brand, owner, and PAS context intact for Quote & Confirm and Final Export.
- Changed Draft Items to display only editable Draft rows so submitted requests disappear from the draft workbench immediately after submit.
- Reset Manager Approval Queue project filter to All projects on submit refresh so newly submitted rows are visible when switching to Manager B.

### User A Request Builder Consolidation

- Renamed the User A entry tab to `Request Builder` and removed the separate `Station Breakdown` tab from the visible navigation.
- Consolidated item creation/search and station quantity entry into one workbench: each draft request item now renders its own inline station breakdown editor.
- Replaced the free-text demand unit input with a fixed all-unit dropdown:
  - `ENG1 / ENG2 / ENG3 / QA G-PQC / GG-WH / MFG / FAE / IQC / ME / MFG NONG / ORT / PQE / TE / WH`
- Added normalization so Excel variants such as `QA G -PQC` map to `QA G-PQC`, while numeric source anomalies do not enter the User A dropdown.
- Kept Manager and OM behavior aligned with prior scope: Manager detail can inspect `需求單位 x Station x Phase`, while OM/PAS main tables still consume item/spec/total only.

### User A / IE Station Breakdown Source Of Truth

- Added `Station Breakdown` as a User A tab and made it the single quantity input point for request drafts.
- Reworked User A `Request` table into item-level summary: total qty, station row count, and breakdown status now come from demand unit + station rows.
- Added demand unit (`需求單位`, e.g. `ENG1`) and fixed station master (`CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`) inputs.
- Submit now blocks selected drafts without non-zero station breakdown and syncs phase totals from the breakdown before sending to Manager B.
- Manager and item detail modals now show the `需求單位 x Station x Phase` breakdown for approval traceability, while OM/PAS main tables remain item/spec/total focused.

### User A Demand Editor And PO-Stage Factory Material No

- Reworked User A draft quantity entry into an item-level `Edit Demand` modal.
- Changed station breakdown storage to long-form demand rows:
  - `phase`
  - `station`
  - `demandUnit`
  - `qty`
  - `remark`
- Removed `Factory Material No` from User A add/draft surfaces; draft items now show item/spec/purpose/G-Non-G/total/active phases/demand rows only.
- Stopped active draft creation from generating or carrying Factory Material No. History add keeps previous Factory Material No only as source reference.
- Limited Reusable History to PO issued/completed rows that have a Factory Material No and PO trace.
- Added Buyer/PUR-facing Factory Material No inputs at PO/external progress stage so the factory tracking number is created only after PO.
- Updated Manager demand detail station aggregation to support long-form phase + station demand rows.

### PAS Tracking Material And Factory Material No

- Added editable `PAS Material No` tracking beside existing `PAS Demand No` in OM PAS context; it carries into Quote & Confirm, Final Export, Buyer, Detail, PAS exports, and OM final Excel.
- Reusable History search and display now use PO-stage Factory Material No plus item/spec instead of treating external PAS/PUR material numbers as identity.
- User A request/detail surfaces no longer depend on PAS/PUR material number; legacy internal material number is hidden from User A detail.
- Manager raw progress detail now labels `Budget / Package Code` as final export package code first and keeps Excel `budgetNo` only as source reference.

## 2026-05-26

### Manager B Pivot Progress Dashboard

- Renamed Manager B demand view to `Demand Progress`.
- Reworked Manager B demand table into a pivot-like procurement progress dashboard based on `G Project MVA EQ Request`.
- Added filters for:
  - Year Project
  - Project
  - Process
  - Stage
  - Department
  - Late only
  - Pending only
- Added KPI cards for:
  - Total Qty
  - Budget Done
  - PR Done
  - PO Done
  - Arrived
  - Late / At Risk
- Replaced phase-card demand layout with columns aligned to `Pivot Table 1`:
  - Year Project
  - Project
  - Item
  - Department
  - Quantity
  - Budget Progress
  - PR Progress
  - PO Progress
  - Arrived Progress
  - Delivery Status
  - ETA / DTA
  - Pending Reason
  - Detail
- Added progress bars for Budget / PR / PO / Arrived.
- Added risk highlighting for late, pending, and not-arrived rows.
- Added Manager progress detail modal showing raw request rows under a pivot group.

### Stable Memory

- Added `PROJECT_DECISIONS.md` for durable product/process decisions.
- Added `IMPLEMENTATION_LOG.md` for major implementation changes.

### Current Notes

- The current prototype derives Budget / PR / PO progress from raw status fields when explicit done quantities are unavailable.
- `G Project MVA EQ Request` is implemented first; Non-G can follow the same pattern later.

### Real OM Master And Manager Date Pass

- Switched OM Level 1 / Level 2 / Level 3 taxonomy to `REAL_OM_RESPONSIBILITY_MASTER` from `VietNam Detailed - Chi tiết VN`.
- Replaced the hand-written OM catalog buckets with rows generated from the real OM responsibility master.
- Disabled legacy purchase-history mock rows in `makePurchaseRecords()` so the main data set comes from `REAL_MVA_PURCHASE_RECORDS`.
- Added date chips to Manager B Budget / PR / PO / Arrived progress bars and renamed the ETA / DTA column to `Key Dates`.
- Preserved required date, request deadline, ETA, DTA, late status, and pending reason fields from the real G Project source rows.
- Fixed `Reusable Item History` row-level Add so it adds to the current project with zero quantities by default while keeping source project traceability.

### Manager / User A / OM Flow Visibility

- Reworked Manager B `Demand Progress` filters into one scope toolbar with risk toggle chips and `Clear Filters`.
- User A submit now validates selected rows and non-zero phase quantities before sending to Manager B.
- Successful User A submit switches to `My Submissions` and shows `Submitted to Manager B` with submit time.
- Manager B `Approval Queue` now shows requester and submitted time for easier verification.
- OM `Quote & Confirm` waiting rows show `Visible to User A`; User A quote confirmation now displays vendor, price, quote date, and PDF before Confirm / Cancel.
- Verified OM `Send to User A Confirmation -> User A Confirm Need -> Final Export -> Buyer Received` in browser QA.

### Timeline Timestamp And Pending Reason Cleanup

- Replaced one-line timeline pills with compact milestone chips showing status plus timestamp or `Done`.
- Limited main-row timeline to key milestones: Submitted, Approved, Sent OM, User Confirm, Final Export, Buyer Received, and PO Done.
- Renamed Manager progress `Pending Reason` to `Pending / Risk Reason`.
- Mapped raw pending codes such as `G` and `L` into manager-readable labels while keeping raw values in detail.
- Sorted User A `My Submissions` by latest activity time so newly submitted rows appear first.
- Added Manager Detail audit timeline sections with action, actor, note, exact timestamp, and raw row context.
- Added source-date timeline events for imported progress rows so Required / Deadline / ETA / DTA are visible even when no system action history exists.

### User A Need Confirmation Upgrade

- Added a dedicated User A `Need Confirmation` tab for OM quote decision tasks.
- Removed vendor-facing information from User A quote confirmation surfaces; User A sees quote amount, quote date, attachment status, and Confirm / Cancel only.
- Simplified `My Submissions` into a tracking table with ID, project, item, qty, current status, action status, timeline, and detail.
- Sanitized OM package history notes for User A so vendor/supplier details remain inside OM Purchasing.

### OM PAS Tracking Fields

- Added PAS tracking defaults and fields for Demand No, Legal Name, Request Dept, Data Transfer To, Demand Date, PAS Part Name, Brand, and Spec.
- Upgraded OM `PAS Request` with compact PAS Header and editable PAS Item Info blocks.
- Carried PAS context into `Quote & Confirm`, `Final Export`, and Detail.
- Added required-field blocking before `Mark Sent to PAS` for Part Name, Spec, Quantity, Legal Name, and Request Dept.
- Updated PAS Excel/PDF export to include Form Head and Form Item style context.

### OM Final Export Package Code And MVA Lock

- Added system-generated OM package codes in the format `{Process}-{Stage}-{ProjectCode}-MVA{YYMM}-{Seq}OM`.
- `Prepare CFA Package` / `Prepare ECS Package` now assigns one shared `finalExportPackageCode` to the selected batch.
- Added mixed-scope blocking so one export package cannot combine different process/stage/project-code rows.
- Added a visible `Package Code` column and `Export Excel` action to OM `Final Export`.
- Updated OM final Excel output so workbook file name, detail sheet title, and `Monthly budget code` use the generated package code.
- Locked OM `Payment methods` output to `MVA` and documented that CFA/ECS are PR entry points while Buyer owns PO.

### OM Submission Dashboard

- Added `OM Submission` as the first OM Purchasing tab for OM leader demand/progress review.
- Aggregates `G Project MVA EQ Request` raw rows into a `Pivot Table 1`-style table by Year Project / Project / Item / Department.
- Added KPI cards for Total Demand Qty, Budget Done, PR Done, PO Done, Arrived, and Pending / Late.
- Added filters for Year Project, Project, Process, Stage, Department, Late only, and Pending only.
- Added row detail modal showing raw request rows with requester, spec, qty, Budget/PR/PO, ETA/DTA, and pending/risk reason.

### OM PAS Layout Wrap Fix And Flow Smoke Test

- Fixed OM `PAS Request` and `Quote & Confirm` table wrapping so PAS Legal Name, Request Dept, Part Name, Brand, and Spec stay inside their cards instead of overlapping adjacent columns.
- Expanded OM PAS/quote table widths and allowed PAS context cards, item editors, vendor fields, attachment cells, and long specs to wrap within their assigned columns.
- Verified `User A -> Manager B -> OM Purchasing` smoke path in browser QA:
  - User A adds a real OM item, enters quantity, and submits.
  - Manager B `Approval Queue` shows the submitted row with requester and submitted timestamp.
  - Manager B row-level `Approve` removes it from the queue.
  - OM `PAS Request` receives the approved row together with the existing PAS request demo case.
- Syntax checks passed for `app.js`, `user-a-flow.js`, and `real-data-seeds.js`.

### User A-Led Amendment Flow

- Added amendment states for waiting User A amendment, draft amendment, submitted amendment, approved amendment, rejected amendment, superseded originals, and invalidated OM export packages.
- Added OM `Ask User A to Amend` actions in `PAS Request`, `Quote & Confirm`, and `Final Export`; OM must provide a reason and cannot directly edit requester demand item/spec/qty.
- Added User A `Amend Request` actions in `Need Confirmation` and `My Submissions`; the action creates a selected amendment draft in the Request tab.
- Amendment drafts preserve previous PAS/quote/package context as reference while clearing active quote fields so amended demand must be re-approved and re-quoted.
- Manager B `Approval Queue` shows amendment badges and detail before/after reference; approving an amendment supersedes the previous request and routes the amended row back into OM.
- Browser smoke test passed for `OM Quote & Confirm -> Ask User A to Amend -> User A Amendment v2 draft -> Manager Approval -> OM PAS Request`.

## 2026-05-27

### Post-Quote Amendment Flow Rework

- Replaced the first-pass amendment draft flow with the new post-quote sequence:
  - `User A Request Change`
  - `OM Purchasing edits item/spec/qty in Quote & Confirm`
  - `OM sends revised result back to User A`
  - `User A confirms or rejects the revised request`
  - `Manager B re-approves confirmed revisions`
- Removed OM-side `Ask User A to Amend` toolbar actions from the visible OM workbench.
- User A no longer edits amendment drafts in the Request tab.
- User A `Need Confirmation` now shows a dedicated `Revised Request Confirmation` card with before/after qty summary and actions:
  - `Confirm Revised Request`
  - `Reject Amendment`
- Added OM inline amendment editing for:
  - revised item name
  - revised spec
  - revised phase quantities
- Preserved previous quote context as `Previous Quote Reference` in detail while routing approved amendments back into OM `Quote & Confirm` for quote review.

### Amendment UX Tightening

- Upgraded `Need Confirmation` summary so `Oldest Waiting` becomes a real warning KPI card when a confirmation is overdue instead of only changing helper text.
- Tightened `Manager B Approval Queue` amendment summaries into a compact two-column `Before / Now` layout with a full-width flow row so amendment cases consume less vertical space.
- Added stronger Manager table width/vertical-alignment rules to keep amendment rows readable without pushing the queue into awkward tall rows.

### Amendment Workbench Readability Pass

- Added overdue styling directly on `Need Confirmation` task cards so stale User A actions are visible even before scanning the summary cards.
- Converted Manager B row actions into a single `Decision` stack to make approve/reject feel like one decision zone instead of split utility columns.
- Increased visual separation for OM amendment rows by strengthening returned/amendment helper emphasis inside `Quote & Confirm`.

### Manager Queue + OM Editor Compression

- Reduced Manager B queue cell padding and tightened decision column widths so repeated approvals feel more like a fast triage table.
- Reworked the OM amendment editor into three clear sections:
  - `Revised Request`
  - `Phase Qty`
  - `Reference`
- Added a dedicated field grid for revised item/spec and a separated reference block so OM can scan editable content before historical comparison.

### Manager / OM Workbench Alignment

- Unified Manager B `Approval Queue` and `Approval History` filter bars with the same toolbar shell language already used by `Demand Progress`.
- Added a framed top border around the Manager queue table so the review page and progress page feel like one dashboard family.
- Wrapped OM quote-stage PAS context into a labeled `PAS Context / PAS Item Info` stack and collapsed quote inputs into one `Quote Input` panel to reduce horizontal fragmentation.

### OM Quote Excel Carry-Forward

- Added `Upload Excel` alongside `Upload PDF` in OM `Quote & Confirm`.
- Extended quote attachment status, detail modal, previous quote reference, and demo seed data to carry both `quotationPdf` and `quotationExcel`.
- Added a `Quote Attachments` column in `Final Export` so both files remain visible in the export stage.
- Blocked OM final export preparation / export when either quote PDF or quote Excel is missing.
- Elevated missing attachment states into quote-stage status language so `Quote Excel Missing` / `Quote PDF Missing` are visible before OM reaches final export.
- Reworked attachment display from plain text rows into labeled PDF / Excel file cards and removed duplicate attachment warnings when the missing file is already represented by the main quote status.

### OM Submission + Manager Density Alignment

- Moved `OM Submission` onto the same framed table language as the rest of the OM workbench by switching it to `om-table-wrap` styling and matching toolbar shell rhythm.
- Tightened `Manager B Demand Progress` and `Approval Queue` row density so progress cells, date stacks, and item/reason blocks read with the same compact cadence.
- Added shared width rules for Manager and OM pivot-like progress tables so `Year Project / Project / Item / Department / Progress / Key Dates / Pending` columns no longer jump as sharply between tabs.
- Reduced visual drift between OM leader submission view and OM execution tabs by aligning spacing, border treatment, and top-level filter presentation.

### OM KPI + Manager Queue Width Pass

- Aligned `OM Submission` KPI naming with Manager B by switching the lead card to `Total Qty` and the escalation card to `Late / At Risk`.
- Applied warning-state summary styling to OM submission risk counts so OM leader and Manager B now surface escalation with the same visual language.
- Compressed Manager B queue column widths for request ID, project, requester, timestamps, decision, and detail so the approval page reads more like a triage workbench.
- Tightened shared item/reason typography across `Approval Queue`, `Demand Progress`, and `OM Submission` so the three highest-traffic tables now read as one family.

### Detail Modal + Decision Polish

- Reworked `OM Submission` and Manager request detail summaries into the same compact summary-card pattern so modal reading now starts with a clear high-level snapshot before dropping into raw rows and timelines.
- Added helper copy above raw request rows in OM submission detail so row-level traceability reads as an audit section instead of an unexplained second table.
- Polished Manager queue controls by adding focus treatment to the inline reject input and wrapping the approve/reject stack in a small decision panel, making repeated review actions feel more deliberate and easier to scan.

### Detail Table Rhythm Pass

- Unified the long tables inside Manager detail modals by moving phase overview, station breakdown, department breakdown, and OM submission raw rows onto the same `manager-progress-detail-table` spacing and typography rules.
- Added short helper copy above phase overview and breakdown sections so the modal flow now reads as summary first, then analysis table, then audit trail.
- Tightened table body typography for item lines and helper text so long modal sections stay readable without feeling like copied spreadsheet output.

### Demand Progress Column Priority Pass

- Refined `Delivery Status`, `Key Dates`, and `Pending / Risk` in Manager B and OM submission tables so each cell now has a clearer primary signal first and secondary explanation underneath.
- Reduced risk-chip overload by limiting visible pending-reason pills to the first two and moving overflow into a compact helper line.
- Aligned OM submission raw-row table wording with Manager progress detail by renaming `Item Spec` to `Item / Spec`.

### Progress Cell Horizontal Alignment

- Adjusted progress cells so `done/total`, percentage, stage label, and status now follow the same internal hierarchy across Manager B and OM submission tables.
- Added light internal padding to status/date/risk stacks so `Delivery Status`, `Key Dates`, and `Pending / Risk` sit on the same visual baseline instead of feeling like three unrelated cell types.

### OM Purchasing Row-Level Action Pass

- Removed checkbox/select-first interaction from the visible OM execution worktabs:
  - `PAS Result Queue`
  - `Quote Completion`
  - `Export Package`
- Added row-level action stacks:
  - `PAS Result Queue`: `Move to Quote`, `Reject to DRI`
  - `Quote Completion`: `Save Quote Info`, `Send to User A`, `Reject to DRI`
  - `Export Package`: `Prepare CFA`, `Prepare ECS`, `Export Excel`, `Mark Exported`, `Reject to DRI`
- Added stable demo rows:
  - `REQ-OM-004` is a complete Quote Completion row that can be sent to User A confirmation.
  - `REQ-OM-005` is a User A confirmed Export Package row that can test CFA/ECS prepare, Excel export, and mark exported.
- Reworked OM table column widths and wrapping so `User A Decision`, status helpers, PAS context, and action buttons no longer overlap the `Detail` column.
- Added modal exit affordances and shared backdrop/Esc close handling for the main modal surfaces.

### User A Project Source Recovery

- Replaced the hardcoded fallback project list with runtime-derived project configs from `REAL_MVA_PURCHASE_RECORDS` whenever `REAL_PROJECT_CONFIGS` is not explicitly seeded.
- This restores multi-project dropdown behavior in `User A Request` instead of collapsing to the old demo-only `P26 / OR5` pair.
- Verified current dropdowns now surface multiple real projects from the Excel-derived data for both `G` and `Non-G`.

### User A Reuse + Manager Quantity Matrix

- Added numeric keypad hints to User A demand quantity inputs with integer-only `inputmode`/`pattern` attributes while keeping the existing qty clamp logic.
- Fixed Reusable History row-level `Add` so completed PO request rows can be reused, not just static `purchaseRecords`.
- History Add now appends a new current-project draft with zero demand rows and keeps source Factory Material No / PAS Material No as reference only.
- Hid the old bulk History copy buttons to avoid accidental source-qty copying or perceived draft overwrite.
- Added Manager B `Quantity Matrix` tab with pivot-like filters for project, item, phase, station, demand unit, and status.
- Quantity Matrix uses submitted/in-flight User A station breakdown rows immediately after submit and renders phase cards with all non-zero MFG stations.
- Added a full phase x station detail modal plus 需求單位 row breakdown for Manager reasonableness checks.

### Manager Quantity Matrix Demo Data

- Added `seedManagerQuantityMatrixDemoData()` to populate realistic Manager B matrix rows only when current submitted station-breakdown data is too sparse for UI validation.
- Demo matrix rows cover every MFG station: `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`.
- Demo rows span multiple phases, demand units, projects, and statuses so the `Project / Item / Phase / Station / 需求單位 / Status` filters can be tested interactively.
- Seeded rows are marked with `demoQuantityMatrixSeed` and are appended without replacing User A draft/submitted data.

### OPM Package Submit + Contact DRI

- Renamed the requester role to `OPM / DRI Requester` and added a login persona selector populated from Excel-derived requester/contact rows.
- Added User A `My Demand Overview` as a requester-side package/matrix view for the items currently being prepared or submitted by that requester.
- Changed User A submit semantics from item-only wording to package submit: selected Draft Items receive a shared `requestPackageId` and `requestPackageLabel`, then still appear as individual Manager approvable rows.
- Verified submit flow in browser QA: Draft rows clear, User A lands on `Request Status`, and Manager B `Approval Queue` immediately receives the submitted rows.
- Added `Contact DRI` row actions for Manager B and OM Purchasing so approvers and purchasing users can see requester, department DRI, and related project/process contact cards without overloading `Detail`.

### Manager Quantity Matrix B+ Swimlane + Amount Sort

- Reworked Manager B `Quantity Matrix` phase cells from slash-separated text into B+ swimlane cards grouped by `Mainline`, `Packing`, and `Supporting`.
- Added station quantity chips with color intensity levels so high-qty station contributors are easier to spot inside each phase.
- Added `Unit Price`, `Est. Amount`, and price source badges to the matrix table and detail modal.
- Added `Sort by` control for default order, unit price high/low, estimated amount high/low, and total qty high-low.
- Browser QA verified the new matrix renders 20 rows, 120 phase cards, station chips, amount columns, active sort control, and price data in the detail modal without console errors.

### Manager Quantity Matrix Excel-Dense Pass

- Kept `Quantity Matrix` as an Excel-like multi-item table first, instead of forcing a chart-heavy dashboard.
- Added real row selection behavior and a right-side `Selected Item Trend` panel that updates with the selected item.
- Added `Signal` output per row for `Price Pending`, `High Amount`, `Phase Spike`, or `Normal`.
- Increased Manager matrix demo seeding so the screen can show a fuller item list for UI review while still preserving user-entered requests.
- Browser QA verified 38 item groups, 342 phase cards, 912 station chips, 38 signal cells, active selected-row panel updates, working amount sort, and no console errors.

### Manager Quantity Matrix High-Density Excel Pass

- Removed the right-side `Selected Item Trend` panel from the visible UI to give the matrix full horizontal space.
- Removed `Status Mix`, workflow/date information, and row-level `Signal` from the main table.
- Replaced large phase cards with compact text cells: `Total`, `Mainline`, `Packing`, and `Supporting` lines.
- Added compact main-table columns for `Spec`, `需求單位`, and `Active Stations` so more useful item context appears without opening detail.
- Browser QA verified 38 rows, 342 compact phase cells, no trend panel, no status filter, working station filter, working amount sort, working detail modal, and no console errors.

### Manager Quantity Matrix Expanded Excel Header

- Replaced compact phase summary cells with a true three-row Excel-like header: phase, station group, and leaf column.
- Each visible phase now expands into `CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH / Buffer / Total Demand for EQ / Stock / Actual Need QTY`.
- Phase filter now reduces the table to the selected phase's 16 columns; without a phase filter the table shows all six phases for 96 phase columns.
- Added sticky left `Project / Item / Spec` columns for horizontal scroll readability.
- Browser QA verified 3 header rows, 96 leaf headers, 104 row cells without phase filter, 16 leaf headers and 24 row cells with single-phase filter, working station filter, working amount sort, detail modal, and no console errors.

### Manager Quantity Matrix Station-Priority Fix

- Reordered the fixed columns so `Active Stations` appears before `需求單位`.
- Made `Project / Item / Spec / Active Stations` sticky on the left and kept `Detail` sticky on the right.
- Added a filter-aware empty state message for no-match combinations such as `CG station / P1.0 phase / OR5 project`.
- Corrected empty-row colspan to use the actual visible matrix width and prevent sticky cells from causing layout drift.
- Browser QA verified station-priority column order, sticky fourth column, 96 station/calculation leaf headers, 105 row cells in all-phase mode, 16 leaf headers in single-phase mode, clear filters recovery, and no console errors.

### Manager Quantity Matrix Fixed-Width Density Pass

- Added a dynamic `colgroup` for Quantity Matrix so every matrix column has an explicit Excel-like width instead of inheriting browser-distributed whitespace.
- Reduced the matrix from the old oversized auto layout to exact computed widths based on visible phases: short station fields are 30px, `ENG Pack` is 44px, `Laser_pico` is 48px, and long calculation fields are 58px.
- Tightened header/body typography, padding, line-height, and number cell height so `CG / BG / FATP / Test` no longer sit inside wide empty cells.
- Removed obsolete selected-item trend and signal helper code/CSS so old dashboard/card styling cannot leak back into the matrix.
- Kept sticky `Project / Item / Spec / Active Stations` and right-side `Detail` while preventing group/leaf headers from incorrectly becoming sticky.

### Manager Quantity Matrix Unit Dashboard

- Added a first-look `Unit Dashboard` above the fixed-width matrix to summarize demand by `Phase x Unit`.
- Dashboard uses the same `managerQuantityFlattenRows()` source as the matrix, so User A submitted station breakdown updates the dashboard immediately.
- Normalized dashboard units to the Excel-facing columns: `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.
- Dashboard cells show total qty plus demand-line count, with light heat coloring and click-to-filter drilldown into the station matrix.
- Added unmapped-unit notice for demand units that do not belong to the dashboard column master, while preserving them in detail rows.

### Demand UI Alignment Pass

- Changed Quantity Matrix to an item-first dashboard: when no item is selected, the dashboard shows top-quantity item shortcuts instead of a mixed all-item unit table.
- Removed `Active Stations` and `需求單位` from the Quantity Matrix main table; those details remain in filters, dashboard, and detail drilldown.
- Recomputed Quantity Matrix fixed columns and sticky offsets around `Project / Item / Spec / Unit Price / Est. Amount`.
- Enlarged and aligned the Demand Breakdown modal with fixed input column widths and a one-row summary layout.
- Split OPM `My Demand Overview` into its own high-density table style so it no longer inherits Manager matrix widths and alignment.

### Manager Quantity Matrix Adaptive Readability Pass

- Added per-row expand/collapse for long `Item` and `Spec` cells so dense rows stay compact but full text is still available without opening Detail.
- Shortened visible group/calculation headers to `Support`, `Calc`, `Total Demand`, and `Actual Need`, while preserving full names in tooltips and Detail.
- Added single-phase adaptive column widths so phase-filtered matrix views are easier to read without making all-phase mode wide again.
- Replaced structural KPI cards (`Stations`, `Units`, `Phase Columns`) with manager-facing signals: `Price Pending`, `High Qty Items`, and `Selected Scope`.
- Tightened Unit Dashboard top-item buttons with truncation and tooltip context to prevent long item names from running the layout.

### Manager Contact DRI + Approval Tracking Clarification

- Reworked `Contact DRI` into a wider responsive modal so requester, department DRI, and project/process contact cards no longer overflow.
- Added contact-specific compact detail rows with wrapping for email, employee id, department, and long names.
- Kept approval routing unchanged: approved demand leaves `Approval Queue` but remains visible in `Approval History`, `Progress Dashboard`, and `Quantity Matrix`.
- Updated the row-level approve toast to point managers to those three tracking views after approval.

### Demand Model + Unit Split Dashboard Upgrade

- Added `Demand Type` to the OPM demand editor so rows are explicitly `MFG` or `Non-MFG`.
- `MFG` demand rows keep the fixed station master and continue feeding the phase x station Quantity Matrix.
- `Non-MFG` demand rows hide/disable station and aggregate by demand unit only, preventing unit demand from being forced into fake CG station quantities.
- Corrected demand-type inference so `ENG1 / ENG2 / FATP TE` style demand units do not automatically imply Non-MFG; MFG rows can still carry demand-unit attribution while using station for reasonableness checks.
- New demand rows now inherit the previous row's phase, demand type, station, and demand unit where possible to reduce repeated OPM entry.
- Added optional OPM new-item budget fields: estimated unit price, estimated amount, and budget remark. Manager price logic now falls back from PAS quote to history price to OPM estimate before showing `Price Pending`.
- Reworked Manager `Unit Dashboard` into an Excel-style `Unit Split Dashboard`: rows are items, columns are `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`, and controls choose phase, line count, and Qty/Amount view.
- Unit Split Dashboard cells drill into the existing station matrix by applying item, phase, and demand-unit filters.
- Extended quote warning behavior so expiring quotes are visible as `Quote Expiring Soon`, while expired/update-required quotes remain re-quote risks.
- Added OM internal processing KPI cards to `Submission Status`: average OM internal days, waiting PAS Demand No, quote completion aging, waiting User A confirmation, export pending, and over-SLA rows.

### Demand Cost Dashboard + OM Role Split

- Updated OPM demand editor behavior so `MFG` rows require station and no longer require `需求單位`; `Non-MFG` rows disable station and require `需求單位`.
- Added login roles for `OM Leader` and `OM Member`, both routing into the OM Purchasing workspace.
- Added monthly USD→VND exchange-rate state and OM `Submission Status` controls:
  - OM Leader/admin can update the active monthly rate.
  - OM Member can view/use the rate but cannot edit it.
  - Missing monthly rate falls back to the system default.
- Added global `Currency Display` selector with `VND / USD`; canonical money remains VND and USD display uses the active monthly rate.
- Added Manager B `Demand Cost Dashboard` as the first-level cost/qty analysis tab before Quantity Matrix.
  - MFG demand rolls up to `MFG`.
  - Non-MFG demand rolls up by normalized demand unit.
  - Rows show unit, item count, total qty, estimated amount, price pending, high qty items, and top items.
  - `Open Matrix` drills into the existing Quantity Matrix by applying the unit filter.
- Added OM `Submission Status` tracking columns for `PAS Demand`, `Quote Completion`, `User Confirmation`, and `Export Package`, each with compact status/date/pending context.
- Updated bilingual IT handoff docs to include MFG/Non-MFG demand rules, OM Leader/Member role split, exchange-rate ownership, and Manager Demand Cost Dashboard.

### Manager Demand Analysis + OPM Carryover Fix

- Replaced Manager B parallel top-level `Demand Cost Dashboard` and `Quantity Matrix` tabs with one top-level `Demand Analysis` workspace.
- Added `Demand Analysis` inner tabs:
  - `Cost Dashboard` as the default first layer.
  - `Station Matrix` as the second layer using the existing Excel-like wide matrix.
- Updated Cost Dashboard drilldown so `Open Matrix` / unit click switches into `Station Matrix` and applies the unit filter.
- Added OPM draft carryover context: `lastRequestProject`, `lastRequestPhase`, and `lastDemandType`.
- Updated `Add Item`, OM catalog add, and `Reuse Item > Add` so new draft rows target the current OPM project and default phase instead of source project/stage.
- Renamed Reuse Item project filter visually to `Source Project` and added target context text: `Add to: {project} / default phase {phase}`.
- Updated bilingual IT handoff docs and project decisions to define Demand Analysis as the current Manager entry point.

### OPM Request Workspace Consolidation

- Renamed the OPM primary tab from `New Request` to `Request Workspace`.
- Removed `My Demand Overview` and `Reuse Item` from the OPM top-level tab row so requester navigation is now:
  - `Request Workspace`
  - `Action Required`
  - `Request Status`
- Added the `Add / Reuse Item` modal workbench, combining:
  - catalog search
  - approved item history reuse
  - project package import
  - create new item entry
- Kept existing add/reuse/package import data handlers, but moved the UI entry into the popup and close it after successful add/import.
- Simplified `Draft Items` into a short-summary table with `Spec Summary`, `Qty / Phases`, `Demand Rows`, compact draft timeline, and grouped actions.
- Merged the old package overview behavior into `Request Status` by showing draft rows with demand qty alongside submitted rows, using the existing timeline chip style.
- Added system contract guards so OPM cannot regress to separate `My Demand Overview` / `Reuse Item` top-level tabs.

### v0.8 Export / Amendment / Dashboard / Compact UX

- Consolidated OM Export Package row actions:
  - `Expense` prepares `Expense -> ECS`.
  - `Capex` prepares `Capex -> CFA`.
  - `Export Package` prepares both final export Excel and quote PDF package outputs.
- Made Export Package PAS context readonly so PAS Material No is no longer edited after PAS Quote Result.
- Added removal amendment handling: if a Manager-approved amendment has zero total quantity, the source request is marked `Removed by Amendment` and does not continue to Export / Buyer.
- Updated Manager Cost Dashboard to show a selected phase/unit total row before item detail rows, matching the Excel Dashboard decision flow.
- Added compact CSS overrides for User A Add / Reuse Item and Demand Editor so action columns stay visible without excessive horizontal scrolling.
- Added `_doc/v0.8.md` and updated unit/system contract tests for cost totals, single export action, Expense/Capex mapping, and readonly export PAS context.

### v1.1 Demand Date + DRI / Project DRI Price Approval Layer

- Added `Need Date` to User A draft request rows and blocked submit when selected draft rows do not have a date.
- Added `price-decision.js` business helper with Computer 20% and MFG 10% threshold rules.
- Added login roles and navigation for `DRI` and `Project DRI`.
- Added `Price Review` workspace with pending review and review history.
- Added Admin `Access & Approval Setup` UI for role assignment, thresholds, approval chain, and approver mapping.
- Wired OM PAS quote save / quote submit to produce `Auto Cleared` or `Price Escalation Required`.
- Auto-cleared rows skip User A confirmation and move to OM `Export Package`; escalated rows wait for DRI then Project DRI.
- Added tests for price thresholds, DRI/Admin UI contracts, and Need Date submission contract.
- Added `_doc/v1.1.md`.

### v1.2 Shared Table & Button Layout Standard

- Added shared table utilities for scroll shells, fixed layout, table types, and semantic cell classes.
- Applied the standard to User A Draft Items, Add Catalog, Reuse by Item, Reuse by Project Package, and Manager Demand Cost Dashboard.
- Shortened in-table actions so long button labels no longer drive column overflow; full action meaning now lives in tooltip/title.
- Added system contract tests for table shells, table type classes, semantic cell classes, and long-button regressions.
- Added bilingual layout standard docs and `_doc/v1.2.md`.

### v1.3 Shared Layout Contract Stabilization

- Applied the new `frontend-layout-stability` rules to the prototype layout contract.
- Added a final CSS authority block for table shells, fixed tables, action cells, spec/text clamps, numeric cells, timeline cells, User A item picker, Manager cost dashboard, and OM exchange-rate utility.
- Stabilized User A Add / Reuse Item modal so action buttons use short labels and fixed action columns instead of overlapping item/spec cells.
- Stabilized Manager Demand Cost Dashboard so amount/unit/total columns use fixed readable widths while keeping the Excel-like high-density table.
- Reduced OM Exchange Rate to a compact inline utility with a small `Save Rate` action.
- Added `tests/layout-smoke.js` to measure page overflow, button escaping, and visible table cell overlap when Playwright is available.
- Updated `test.sh`, system contract tests, and `_doc/v1.3.md`.
- Current environment result: `./test.sh` passes 23/23 available tests; browser/layout/accessibility smoke are explicitly skipped because Playwright/axe are unavailable.
# v1.4 Row Height Contract

- Added shared row-height tokens and vertical rhythm rules in `styles.css`.
- Added compact/standard/workflow table row-height tiers.
- Added clamp rules for text/spec/purpose/reason cells so table rows no longer expand unpredictably.
- Added `tests/row-height-contract.test.js` to make row-height control a regression contract.
- Added `_doc/v1.4.md` documenting why row height was previously uncontrolled and how future tables must handle it.

# v1.5 Global Text Visibility Contract

- Added CSS classes for text classification: identity, spec summary, note summary, code/id, numeric cells.
- Protected identity-bearing item columns from compact clamp rules that clipped Factory Material No and similar identifiers.
- Added readable spec summary rules so long product specs wrap/clamp instead of being hard-cut mid-token.
- Added `tests/text-visibility-contract.test.js` for identity/spec visibility regression checks.
- Updated `frontend-layout-stability` and `procurement-ui-quality-review` skills with text visibility classification.
- Added bilingual table/button layout standards and `_doc/v1.5.md`.
