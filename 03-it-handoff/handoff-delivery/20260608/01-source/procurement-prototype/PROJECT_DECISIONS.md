# Project Decisions

## IT Handoff Documentation

- `docs-current/it-handoff/` is the current source of truth for near-term IT implementation handoff.
- The handoff package is bilingual:
  - Traditional Chinese: `docs-current/it-handoff/zh-TW/`
  - English: `docs-current/it-handoff/en/`
- The handoff scope is limited to:
  - `Requester`
  - `Dept DRI`
  - `Cost Manager`
  - `OM Purchasing`
- The handoff package defines modules, not only pages. Future integration should reference module IDs such as `requester.requestWorkspace`, `costManager.demandAnalysis`, and `om.quoteCompletion`.
- If older documents in `docs-current/` use obsolete names such as `Demand Tracking`, `PAS Review`, `Quotation`, or `Package Submission`, the IT handoff naming wins.
- Kuso AI visualization should use `docs-current/it-handoff/*/07-kuso-ai-visualization-brief.md` as the primary prompt source.

## Stable Sources Of Truth

- `New MVA EQ purchase request template.xlsx`
  - `G Project MVA EQ Request` is the source for Manager B procurement progress.
  - `Pivot Table 1` is the reference layout for Manager B pivot-style aggregation.
  - `Pivot Table 3` is treated as a loading/progress reference, but the prototype derives progress from raw rows instead of relying on Excel pivot cache.
  - `Pivot để check coi 2 worksheet` is a data reconciliation/check sheet, not a daily Manager B page.
- `OM Buy Bảng Phân Công Công Việc từ 02.04.2026.xlsx`
  - `VietNam Detailed - Chi tiết VN` is the OM responsibility master for OM item classification and owner mapping.
  - OM Level 1 / Level 2 / Level 3 dropdowns and OM catalog rows must derive from this master, not from legacy prototype category seeds.

## Role Boundaries

- User A creates demand, submits requests, maintains item/material details, and confirms/cancels OM quote need after PAS result.
- User A and IE are the same requester role in this prototype.
- User A/IE enters quantity once inside `New Request`; each draft item owns `Edit Demand` rows, and request phase totals are auto-calculated from demand unit + station rows.
- `需求單位` means the demand-origin unit, for example `ENG1`; `Station` means shop-floor station such as `CG`, `BG`, `FATP`, or `Test`.
- `需求單位` is a fixed all-unit dropdown for User A/IE, not split by G / Non-G in v1:
  - `ENG1 / ENG2 / ENG3 / QA G-PQC / GG-WH / MFG / FATP TE / FATP IQC / FATP PQE / Q-LAB / REL / IT / FAC / FAE / IQC / ME / MFG NONG / ORT / PQE / TE / WH`
  - Excel aliases such as `QA G -PQC` are normalized to `QA G-PQC`; numeric/anomaly source departments stay in raw detail only.
- Demand rows explicitly distinguish `MFG` and `Non-MFG`:
  - `MFG` uses station reasonableness (`CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH`) and also keeps `需求單位` as the demand-origin unit.
  - `Non-MFG` uses demand-unit aggregation and does not require or display station in the demand editor.
- Adding a new demand row should inherit the previous row's phase/type/unit/station where possible, because OPM usually enters repeated phase/project context.
- Dept DRI approves or rejects requester submissions within its responsible project / department / requester scope.
- Cost Manager reviews demand, cost, carryover impact, station reasonableness, and progress, and owns final authorization after Dept DRI approval.
- Cost Manager does not create requests, add reusable history rows, lock warehouse/carryover evidence, operate OM quote/export, or submit requester-side demand.
- OM Purchasing owns PAS request, quote completeness, User A confirmation routing, and final CFA/ECS export for OM buy scope.
- OM leader needs a `Submission Dashboard` focused on OM stage tracking, pending status, quote expiry, and internal processing days.
- OM Leader owns monthly USD to VND exchange-rate maintenance; OM Member can use but not edit the active rate.
- OM exchange-rate UI should stay a compact inline editor, not a full-width primary workflow action.
- UAT Feedback is an OM internal-test utility, not an OM workflow tab. OM Leader/Admin can triage all feedback; OM Member can submit page/row feedback and view only their own feedback status.
- OM Purchasing does not connect directly to PAS in this prototype, but PAS tracking fields must be retained in-system for follow-up.
- `OM Buy .xlsx` sheet `VietNam Detailed - Chi tiết VN` is the OM classification source of truth for Level 1 / Level 2 / Level 3 / CPD-IEP Owner.
- User-facing classification language is English first. Chinese names and CPD-IEP owner remain internal traceability, not User A request-entry copy.
- Since OM Buy classifications are already maintained in the master sheet, classified items should not trigger the old legacy material maintenance gate during User A submission.
- Buyer only receives exported OM rows and updates PR / PO / external progress / evidence.

## Cost Manager Dashboard

- Visible `Manager B` / `Cost Owner` naming has been replaced by `Cost Manager`.
- Cost Manager is the P&L/cost review role and final authorization gate after Dept DRI approval.
- Cost Manager approval is limited to requester-submission final authorization. It does not edit demand, operate OM quote/export, or lock warehouse/carryover evidence.
- Cost Manager tabs are fixed as:
  - `Submission Monitor`
  - `Demand Analysis`
  - `Progress Tracking`
  - `Project Setup`
- `Submission Monitor` contains:
  - requester submission visibility
  - Dept DRI decision history
  - contact/detail support
- `Demand Analysis` contains:
  - `Cost Dashboard`
  - `Station Matrix`
- Cost Manager first layer is `Demand Analysis > Cost Dashboard`, an Excel Dashboard-style `Item x Phase x Unit` table:
  - `Item / Spec / Price`
  - phase groups: `P1.0 / P1.1 / EVT / DVT / PVT / MP`
  - each phase group expands into `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`
  - `Total / Detail`
- Cost Manager Cost Dashboard is intentionally dense and Excel-like, but monetary cells must remain readable:
  - main table may use compact labels such as `$117.2K` or `23.6M VND`
  - full monetary values belong in `title`, Detail, or drilldown
  - numeric meaning must not be lost through ellipsis-only truncation
- `Selected Phase Department Total` belongs above the item detail table as a separate summary strip, not as the first item row.
- `Station Matrix` is second-layer drilldown only; clicking a Cost Dashboard item/unit cell applies filters and opens the matrix.
- Dept DRI owns scoped requester submission review. Dept DRI approval routes to Cost Manager final authorization, not directly to OM.
- Cost Manager authorization routes approved rows to OM Leader intake. Cost Manager rejection returns the row to Requester Action Required with reason/timeline.
- `Progress Tracking` is an owner/aging progress view based on submitted request rows and OM stage signals.
- `Progress Tracking` focuses on:
  - Year Project / Project / Item / Department / Quantity
  - Submitted / Received Date
  - Pending Owner
  - Current Stage
  - Days Pending
  - Quote Status
  - Next Action
  - Pending / Risk Reason
- PR / PO / Arrived percentages are downstream Buyer execution data and must not be the Cost Manager progress-table focus.
- `Progress Tracking` filters are a single scope bar with explicit risk toggles and clear-filter behavior.
- `Pending / Risk Reason` must show manager-readable labels; raw Excel codes such as `G` and `L` stay in detail only.
- Timeline chips in main tables show only key milestones plus compact timestamps; full action / actor / note / exact timestamp history belongs in Detail.
- Dept DRI decision history is visible to Cost Manager for traceability. Cost Manager only receives final authorization actions for rows already approved by Dept DRI.

## Cross-Role Flow Visibility

- Requester submit success must land in `Request Status` and show `Submitted to Dept DRI`.
- User A submit requires at least one non-zero inline `Station Breakdown` row for each selected request item.
- Manager request detail shows `需求單位 x Station x Phase` breakdown so approval can review whether station demand is reasonable.
- User A and Manager timeline rows use compact key milestones with timestamp labels where available.
- OM `PAS Quote Result` rows sent to User A remain visible as readonly `Waiting User A Confirmation` rows.
- User A confirms or cancels OM quote need from the dedicated `Action Required` task tab; confirmed rows move to OM `Export Package`.
- User A is the only role that can initiate actual demand amendments after quote.
- Post-quote amendment flow is:
  - User A `Request Change`
  - OM Purchasing edits the working amendment in-system
  - OM sends revised result back to User A
  - User A confirms or rejects the revised request
- Confirmed revisions return to Dept DRI review before re-entering OM Purchasing
- Previous PAS quote data is retained as reference during amendments; it must not be treated as the active quote for the amended demand.
- User A must not see vendor, vendor part no., or supplier information. User A only sees quote amount, quote date, attachment status, and whether the need still exists.
- Buyer only sees rows after OM marks CFA/ECS export complete.

## OM / PAS Tracking

- PAS tracking fields include Demand No, Legal Name, Request Dept, Data Transfer To, Demand Date, PAS Part Name, Brand, and Spec.
- Legal Name, Request Dept, and Data Transfer To use system defaults first; Demand No is recorded by OM after PAS generates it.
- User A supplies standardized item/spec; OM owns final PAS Part Name / Brand / Spec confirmation.
- OM tabs are fixed as:
  - `Submission Dashboard`
  - `PAS Demand No`
  - `PAS Quote Result`
  - `Quote Expiry`
  - `Export Package`
- OM `Submission Dashboard` tracks who is blocking the current OM flow:
  - `OM Purchasing` for missing PAS Demand No, quote input, or export preparation
  - `PAS / Bidding` when PAS Demand No exists but bidding / quote result is not returned
  - `User A` when quote result is waiting for requester confirmation
  - `Buyer` only as downstream PR / PO ownership after export
- OM `Submission Dashboard` primary columns are `Submitted / Received Date`, `Pending Owner`, `Current Stage`, and `Days Pending`; quote validity belongs in `Quote Expiry`, ETA / buyer handoff detail belongs in row Detail, and Budget / PR / PO / Arrived are not OM primary columns.
- Quote status uses `Reusable Quote`, `Waiting PAS Reply`, `Expiring Soon`, and `Expired / Requote Required`.
- OM execution tabs use row-level actions, not checkbox selection as the primary workflow.
- `PAS Demand No` row actions are:
  - `Move to Quote`
  - `Reject to DRI`
  - `Detail`
- `PAS Quote Result` row actions are:
  - `Save Quote Info`
  - `Send to User A`
  - `Reject to DRI`
  - `Detail`
- `Export Package` row actions are:
  - `Expense`
  - `Capex`
  - `Export Package`
  - `Mark Exported`
  - `Reject to DRI`
  - `Detail`
- `PAS Demand No` exists only to record PAS Demand No after PAS/Bidding returns it. It does not upload quote attachments and does not export PAS files in the system.
- `PAS Quote Result` exists to record PAS Material No, vendor/price/date, quote received date, quote valid until, quote PDF, and quote Excel before sending the result to User A confirmation.
- Quote validity input belongs inside the `PAS Quote Result` card, not in a separate column/table.
- `Quote Expiry` is a tracking tab only. It does not input PAS quote data, export packages, or change workflow state.
- `Quote Valid Until` is required before `Send to User A`; quote expiry status uses a 10-day warning threshold (`Valid`, `Expiring Soon`, `Expired / Requote Required`).
- PAS Demand No and PAS Material No must carry from `PAS Quote Result` to `Action Required`, `Export Package`, Buyer, Detail, and History.
- OM `Export Package` is the system stage for sending rows to `CFA` or `ECS`; both platforms are PR entry points.
- Buyer starts after OM export and owns PO/progress/evidence only.
- OM final export package codes are system-generated as `{Process}-{Stage}-{ProjectCode}-MVA{YYMM}-{Seq}OM`, for example `FATP-MP-CGY4-MVA2604-21OM`.
- `Payment methods` is locked to `MVA` in OM data and exported workbooks.
- OM `Submission Dashboard` focuses on received date, current OM stage, days in current stage, quote expiry monitor, and over-SLA rows.
- OM internal days are measured by current stage: received date for PAS Demand No, PAS Demand No recorded date for PAS Quote Result, sent-to-User-A date for Waiting User A, and User A confirmation date for Export Package.
- Quote expiry is a warning layer, not a separate Sourcing module in v1:
  - quotes expiring within 10 days show `Quote Expiring Soon`
  - expired quotes show re-quote/update risk
  - existing quote data remains reference until OM/Sourcing refreshes it

## Purchase Route / Sourcing / FTV Code

- Purchase route is confirmed by OM, not Requester.
- `purchase_route` values are:
  - `local_buy`: local purchase; FTV code is not required.
  - `external_import`: external import; FTV code is required before export / customs audit.
- IT items must go through PAS quote / PAS purchasing by default.
- Non-IT items can be routed flexibly by OM as `PAS`, `Sourcing`, or `OM_direct`; Sourcing is first a quote-owner route, not necessarily a standalone system role in v1.
- FTV code is a customs / Trading / Accounting audit control. It is not a cost-analysis key and must not be used to group Cost Manager dashboard numbers.
- Item identity and FTV mapping are separate:
  - `item_master` identifies the normalized item/spec.
  - `material_identity` identifies system/internal material numbers such as HFCOM, PAS material no., factory material no., or legacy mapping references.
  - `ftv_code_master` maps `item/material + demand_department` to the active FTV code.
- Same item/spec purchased by different demand departments can have different FTV codes because customs reporting must identify the buying/using department.
- Same item/spec purchased by the same demand department and `external_import` route must reuse the active FTV code until EOL.
- The FTV active uniqueness key is `item_id + demand_department + active_status`, not `item_id` alone.
- Cost Manager analysis remains based on request line, demand department, project, stage, station/unit, qty, unit price, carryover, and effective cost.
- FTV appears in OM Export / customs audit context only:
  - Requester does not see or enter FTV.
  - Dept DRI / Budget Approver do not operate FTV.
  - Cost Manager does not see FTV in Cost Dashboard or Station Matrix.
  - OM Export Package shows FTV / audit status and blocks export only when `external_import` requires an FTV code that is missing.
- Bought-before item FTV mapping should be imported through staging first, then reviewed before writing to the active master.
- Export should snapshot FTV code, purchase route, demand department, quote file metadata, and export package code for Accounting / Trading / customs audit.

## User A Reuse Item

- User A role is named `OPM / DRI Requester` in the login and request workspace because OPM/DRI owns demand input in the current Excel workflow.
- Login can select an OPM/DRI persona derived from Excel requester/contact rows. That persona becomes the requester identity on submitted rows.
- User A submit is package-level, not single-item. The selected Draft Items submit together under one `requestPackageId`, while each item remains an individual approvable row for Dept DRI and Cost Manager.
- User A owns a `My Demand Overview` tab that shows only the current requester/project demand package scope: item, phase cards, total qty, draft/submitted state, and detail. It is a local requester-side matrix, not the global Manager matrix.
- Reusable Item History row-level `Add` means reuse the item/material identity in the current project.
- History `Add` defaults phase quantities to zero and keeps the source project only as traceability.
- Copying source quantities is a separate explicit action, not the default row-level add behavior.
- User A does not provide any material number when submitting demand. Draft / Manager approval / OM PAS stages use item/spec/qty only.
- User A-facing `Detail / Spec` means product requirement/spec only. Brand, owner, supplier, PAS material no., and factory material no. are hidden from User A request-entry and tracking screens.
- User A item detail modals use the same rule: requester sees product/spec, demand status, quote action context, and timeline; OM owner, PAS tracking, vendor, and material number fields stay in OM/Manager/Buyer views.
- User A `New Request` is the single input workbench: `Add Item`, `Draft Items`, and `Edit Demand`. Quantity is entered in an item-level demand editor, not duplicated in the draft table.
- User A `Project` dropdown must come from real Excel-derived seed data, not from the old demo-only fallback list. When a dedicated `REAL_PROJECT_CONFIGS` seed is absent, the app derives visible projects from `REAL_MVA_PURCHASE_RECORDS`.
- Demand rows are long-form and have exactly one phase, station, demand unit, qty, and remark per row. One item can own many demand rows across phases, stations, and demand units.
- `PAS Material No` is external PAS/PUR tracking data entered by OM/PUR and carried through PAS Quote Result, Export Package, Buyer, Detail, and History.
- `Factory Material No` is not generated during draft or approval. It is only filled after PO by Buyer/PUR, then used as the factory-side tracking key for reusable price history.
- `Reuse Item` history only includes PO issued/completed rows that have Factory Material No, item/spec, price, and PO trace. Adding from history never carries active Factory Material No into the new request; Factory Material No remains reference only until the new PO.
- Reusable History row-level `Add` must append a new current-project draft and must not replace existing Draft Items. It resolves both static purchase records and completed request rows because completed PO rows can become reusable history sources.
- Demand source picker has three official modes:
  - `Catalog`: adds a catalog item identity/spec into the current demand scope with quantity 0.
  - `Reuse Item`: reuses one approved item identity/spec into the current demand scope with quantity 0. It does not copy source qty by default.
  - `Copy Demand`: previews/imports a completed reusable demand package/history group into the current demand scope and copies source qty retargeted to the current project / line / stage.
- Reuse Item `Source Project` is only a history/package filter. New reused items always enter the current OPM target project.
- Project-package import is not submit: imported items remain editable Draft Items so OPM can delete, revise spec, or edit demand rows before submitting.
- OPM draft carryover is item-level, not only row-level: `Add Item`, `Create New Item`, and `Reuse Item > Add` reuse `lastRequestProject`, `lastRequestPhase`, and `lastDemandType` unless the user changes Project Type / Project.
- `Budget / Package Code` means the system-generated OM final export code; Excel `budgetNo` remains only as source reference.

## Shared Contact Popup + Temporary Budget Scope Guard

- `Contact` is a topbar popup utility for `Requester`, `Cost Manager`, `OM Purchasing`, `Dept DRI`, `Budget Approver`, and `Admin`; it is not a top-level navigation tab.
- `Contact DRI` remains a row-level lookup modal for Manager approval support.
- `Temporary Budget Request` input panel is scoped only to Requester `Request Workspace`. Cost Manager, OM Purchasing, Contact popup, and Admin-only views must not receive this input panel through MutationObserver or DOM injection.
- Quote validity must be rendered directly inside OM `PAS Quote Result`, not through global MutationObserver / table annotation.
- Manager/OM can see temporary budget tracking only as summaries tied to actual temporary-budget request rows or detail panels.

## OPM Request Workspace

- OPM/User A input is consolidated into `Request Workspace`, `Action Required`, and `Request Status`.
- `Add Item`, `Reuse Item`, `Reuse Project Package`, and `Create New Item` are modes inside one `Add / Reuse Item` popup, not separate primary tabs.
- `Draft Items` is a short-summary table. Main columns are `Item`, `Spec Summary`, `Qty / Phases`, `Demand Rows`, `Breakdown Status`, `Status`, `Timeline`, `Actions`, and `Detail`.
- Long spec, purpose, source path, owner/contact, brand, vendor, PAS material no, and Factory Material No must stay out of the Draft main table and live in Detail / modal context.
- `Request Status` combines the previous `My Demand Overview` and submitted tracking. It shows draft rows with demand qty plus submitted/approved/rejected/in-progress rows, using compact timeline chips.
- `Reuse by Item` and `Reuse by Project Package` still preserve source references, but every added row targets the current OPM project and remains editable before submit.

## Manager Demand Analysis

- Cost Manager owns a top-level `Demand Analysis` tab. It contains two inner layers:
  - `Cost Dashboard` as the default first layer for unit split, item count, quantity, and amount.
  - `Station Matrix` as the second layer for Excel-like demand reasonableness checks.
- `Cost Dashboard` and `Station Matrix` are inner layers under `Demand Analysis`, not parallel top-level tabs.
- Clicking a Cost Dashboard row/cell switches to `Station Matrix` and applies unit / phase / item filters.
- `Demand Analysis` updates as soon as Requester demand passes into the review/approved pipeline; it does not wait for OM, Buyer, PO, or completion.
- Cost Dashboard first focus is selected phase/unit totals, not individual item price. The item rows remain as Excel-style detail below the totals row.
- Cost calculation follows the Excel Dashboard sheet: selected phase demand quantity x item price x line count, split by `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.

## OM Export Package

- OM Export Package has one primary export action: `Export Package`.
- The single action prepares the final export Excel package and the quote PDF package reference together.
- OM chooses financial cost type first: `Expense -> ECS` or `Capex -> CFA`.
- PAS Demand No, PAS Material No, quote PDF, quote Excel, and quote validity are readonly in Export Package; they are owned by `PAS Quote Result`.
- If a post-bidding amendment revises an item to zero quantity, Manager approval records `Removed by Amendment` and prevents downstream Export / Buyer routing.

## UI Quality Review Standard

- UI changes must be reviewed with the `procurement-ui-quality-review` skill.
- Review criteria are readability, WCAG 2 accessibility, attention flow, action clarity, and design consistency.
- English UI copy may use Flesch-Kincaid as a reference; Traditional Chinese and mixed Chinese/English text are judged by sentence length, naming consistency, acronym clarity, and action clarity.
- Cost Manager `Cost Dashboard` and `Station Matrix` are intentional Excel-like high-density exceptions, but they still require readable headers, stable columns, and clear drilldown.
- Cost Manager `Cost Dashboard` must follow the Excel `Dashboard` sheet field logic and must not use low-value summary cards such as `Highest Unit`, `Highest Item`, or `Price Pending` summary.
- The matrix source of truth is User A long-form demand rows: `demandType / phase / station / 需求單位 / qty / remark`.
- The phase columns follow `P1.0 / P1.1 / EVT / DVT / PVT / MP`; station grouping follows the MFG station master from the Ideal Format workbook.
- Quantity Matrix phase cells use the B+ swimlane pattern: each phase shows total qty plus grouped station chips for `Mainline`, `Packing`, and `Supporting`.
- Quantity Matrix includes price context for Manager budget pressure: `Unit Price`, `Est. Amount`, and price source badge.
- Quantity Matrix price source is quote-first: OM/PAS quote price wins, then history/unit price, otherwise `Price Pending`.
- Quantity Matrix sorting supports unit price, estimated amount, and total qty without changing the underlying User A demand rows.
- Quantity Matrix remains Excel-like first: multi-item numeric table is the primary view. The right-side selected-item trend panel is removed because it reduces table capacity.
- Quantity Matrix is intentionally low-visual-density: no workflow status, date, large phase cards, or row-level signal column in the main table.
- Quantity Matrix uses an Excel-like expanded phase matrix: each visible phase expands into `Mainline / Packing / Supporting / Demand Calculation` columns.
- Quantity Matrix main rows are station-priority but compact: `Project / Item / Spec / Unit Price / Est. Amount`, expanded station/calculation columns, total qty, and detail. `Active Stations` and `需求單位` are not shown as main-table columns.
- Quantity Matrix uses fixed-width `colgroup` columns and `table-layout: fixed` so short station headers (`CG / BG / FATP / Test`) stay narrow like Excel instead of being stretched by browser auto layout.
- Quantity Matrix density is prioritized over card-style readability: station columns stay around 30px, longer labels such as `ENG Pack / Laser_pico / Total Demand for EQ / Actual Need QTY` get only the minimum extra width needed to remain readable.
- Quantity Matrix supports adaptive readability without giving up density: `Item` and `Spec` are line-clamped by default and can expand per row; all-phase station columns stay narrow, while single-phase mode uses wider station/calculation columns.
- Quantity Matrix main-table headers may use short labels such as `Support`, `Calc`, `Total Demand`, and `Actual Need`; Detail and header tooltips retain the full source names.
- Quantity Matrix summary cards must show manager decision signals, not structural metadata. Current cards are `Items`, `Total Qty`, `Est. Amount`, `Price Pending`, `High Qty Items`, and `Selected Scope`.
- `Demand Analysis > Cost Dashboard` follows the Excel `Dashboard` sheet concept and summarizes `Item x Phase x Excel demand unit` using phase groups `P1.0 / P1.1 / EVT / DVT / PVT / MP`, each expanded into `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.
- Unit Split Dashboard supports `Qty` and `Amount` modes. Amount mode calculates `Qty x Unit Price x Line Count`; price source remains quote-first, then history price, then OPM estimate, otherwise `Price Pending`.
- Unit Split Dashboard cells show total quantity or estimated amount plus demand-line count, and clicking an item/unit/cell drills into the same station matrix by updating item/phase/unit filters.
- Demand rows now distinguish `MFG` and `Non-MFG`. `MFG` rows require a station, do not require `需求單位`, and feed the station matrix. `Non-MFG` rows hide/disable station, require `需求單位`, and feed unit dashboards without being forced into fake CG station demand.
- Cost Manager first-level demand/cost view is `Demand Analysis > Cost Dashboard`, not the wide `Station Matrix`.
  - `Cost Dashboard` summarizes phase x unit cost/quantity for `MFG / FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC`.
  - All `MFG` demand rolls up to `MFG`.
  - `Non-MFG` demand rolls up by `需求單位`.
  - It supports Qty / Amount view through the global VND/USD display.
- OM role split is explicit:
  - `OM Leader` can maintain monthly USD→VND exchange rate and operate OM documents.
  - `OM Member` can use the rate and operate workflow rows, but cannot modify exchange rate.
- UAT Feedback visibility is role-based: OM Leader/Admin see the triage review board; OM Member sees a read-only `My UAT Feedback Status` board for feedback they submitted.
- Currency display is global. Canonical stored amount remains VND; USD display uses the current monthly exchange rate or a visible fallback rate.
- OM `Submission Dashboard` must show `Received Date`, `Current Stage`, and `Days in Stage`; quote expiry appears as a lightweight monitor there and as a dedicated tracking-only `Quote Expiry` tab.
- OPM/new-item budget estimates are allowed at request creation as `Estimated Unit Price`, `Estimated Amount`, and `Budget Remark`. These are planning estimates only; OM quote and Buyer actuals remain the official downstream values.
- New item budget is a run-ahead planning field. Manager can compare OPM estimated amount against later OM quote / Buyer actual amount, but the estimate is never treated as official purchase price.
- Quote expiry warning uses the existing `quoteExpiry` / `quoteValidUntil` field. Quotes within 10 days are `Quote Expiring Soon`; expired quotes are treated as needing re-quote/update.
- `Buffer` and `Stock` remain blank until there is a real input/calculation source. `Total Demand for EQ` and `Actual Need QTY` initially mirror the phase station total.
- Calculation fields such as `Buffer / Stock / Actual Need QTY` are not displayed unless the system has a real input or calculation source for them.
- When real submitted station data is not rich enough for UI validation, the prototype may seed Manager-only matrix demo requests. These seed rows must cover all 12 MFG stations, multiple demand units, and enough item variety to validate a boss-facing Excel-like quantity table. They must not overwrite user-entered requests.
- Quantity Matrix filters must be operational, not cosmetic: filtering by item, phase, station, or demand unit recalculates the visible compact phase cells, summary cards, and detail matrix.

## UI Semantics

- `Detail` means item/request/raw-row information, not approval action.
- Cost Manager dashboards should aggregate from raw data and avoid recreating ultra-wide operational tables except for the intentional Excel-like Cost Dashboard and Station Matrix.
- `Contact DRI` is a separate action from `Detail`. Cost Manager and OM Purchasing use it to see requester, department DRI, and related project/process contact information from Excel-derived contact data.

## v1.1 Demand Date + Price Approval Layer

- Requester must enter `Need Date` before submitting a draft request. The value is carried as both `needDate` and `requiredDeliveryDate` so Dept DRI, Cost Manager, OM, Export Package, Detail, and timeline views read one date source.
- Login includes `Dept DRI` and `Budget Approver` roles. They use the `Price Review` workspace, not Cost Manager.
- Dept DRI is the first approval gate for requester submissions.
- Cost Manager is the final requester-submission authorization gate after Dept DRI. Only Cost Manager approval sends rows to OM Leader intake.
- OM PAS quote result runs threshold comparison after required quote fields are complete:
  - `quoteUnitPriceUsd - historyUnitPriceUsd`, rounded to 2 decimals, triggers review only when the delta is `> 0.40 USD`.
  - Delta `<= 0.40 USD` auto-clears.
  - Missing history price, unclassified category, new item, or Temporary Budget Request requires escalation.
- Auto-cleared rows skip requester quote confirmation and move directly to OM `Export Package` with `User Confirmation Not Required`.
- Escalated rows follow `Dept DRI -> Budget Approver`; Budget Approver approval moves the row to `Export Package`.
- Temporary Budget routing is:
  - Requester submit
  - Dept DRI initial approval
  - OM PAS / quote
  - Dept DRI quote-result review
  - Budget Approver final approval
  - OM Export Package
- Admin `Access & Approval Setup` is the prototype surface for user role assignment, USD delta threshold, approval chain, requester mapping, and OM member setup.

## v1.2 Shared Table & Button Layout Standard

- All new tables must declare a table type: `form-table`, `dense-dashboard-table`, `workflow-table`, or `matrix-table`.
- Dense or wide tables must be wrapped by `.table-shell`.
- Table cells must use semantic cell classes such as `.cell-text`, `.cell-spec`, `.cell-number`, `.cell-action`, and `.cell-timeline`.
- Table button labels must be short verbs such as `Add`, `Edit`, `Remove`, `Detail`, and `Export`; full meaning belongs in `title` or Detail.
- Long `spec`, `purpose`, `remark`, PO, and material numbers are summarized in the main table and expanded in Detail / tooltip.
- Timeline cells show only compact key milestones; full audit history stays in Detail.

## v1.3 Layout Stability Guardrails

- `frontend-layout-stability` is the required companion skill for future UI work that touches tables, buttons, modals, dashboards, or responsive layout.
- `styles.css` now has a final shared layout authority section. New page-specific overrides must not reintroduce conflicting width/sticky/action rules for the same table families.
- Requester item picker, Cost Manager Demand Cost Dashboard, and OM Exchange Rate are the regression baseline for layout stability.
- Table actions must stay inside `.cell-action` and never overlap neighboring item/spec cells.
- Browser-level layout overlap detection is handled by `tests/layout-smoke.js` when Playwright is available; if unavailable, skips must be reported explicitly by `./test.sh`.
# v1.4 Table Row Height Decision

- Table row height is now part of the shared layout contract, not an individual page styling choice.
- Dense lookup/reuse tables use compact rows; workflow/request tables use larger workflow rows; dashboard tables use standard rows.
- Main tables must clamp `Item / Spec / Purpose / Remark / reason-text`; full content belongs in Detail, tooltip, or modal.
- Future table changes must preserve row-height tokens and update tests if a new table type needs a different vertical rhythm.

# v1.5 Text Visibility Decision

- Table text must be classified before styling: `Identity / Spec / Note / Number / Action`.
- Identity text such as Factory Material No, PAS Material No, PAS Demand No, Request ID, Package Code, PO No, and contact email must not be hidden by generic clamp rules.
- Spec text may be summarized in dense tables, but the summary must remain readable and full text must be available through Detail, tooltip, or expand.
- Future UI work must not use one generic clamp class for all table text.

# v1.6 Warehouse Inventory Decision

- `Warehouse Inventory` is a stock transaction model, not a demand-vs-owned-stock delta monitor.
- Requester can record `Stock In` with source project, line, stage, and station/unit trace.
- Requester can create a stock-use candidate from Request Workspace suggestions, but this does not become final inventory usage until Dept DRI locks it.
- Dept DRI is the only role that can lock or reject stock-use candidates.
- `Locked Use` reduces available inventory and can affect effective demand/cost. `Pending Dept DRI` and `Rejected` must remain visible in the ledger but must not be treated as final locked stock.
- Warehouse main UI is item/spec inventory summary: `On Hand / Reserved / Available / Top Source / Potential Target`. Full source and target trace belongs in the transaction ledger or Detail.
