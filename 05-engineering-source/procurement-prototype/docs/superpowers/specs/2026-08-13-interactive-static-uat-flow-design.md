# Interactive Static UAT Flow Design

Date: 2026-08-13
Status: Approved in conversation; awaiting written-spec review

## Objective

Create an independently distributable, frontend-only UAT package that lets business users operate the procurement workflow themselves and validate flow and UI before IT implements the backend.

The package is interactive. "Static" means it has no backend, API, database, production credentials, or production persistence. It does not mean screenshots or a read-only presentation.

## Feature / Function / Module Boundary

- Feature: Interactive cross-role procurement Flow and UI UAT.
- Role owners: Requester, Dept DRI, Cost Manager, Budget Approver, OM Leader, OM Purchasing, Buyer Handoff. Admin is available only for role/setup visibility and does not perform business approvals.
- Functions: role switching, row actions, workflow transitions, rejection/revision, OM assignment, quote validation, OM handoff, browser-local persistence, timeline display, and demo reset.
- Modules: a separate static UAT package, scenario data/state controller, role views, workflow transition rules, UAT guide, validation tests, and packaging manifest.
- Non-scope: production API, database, authentication security, authorization enforcement, file upload storage, email/notification delivery, external Buyer/PUR integration, deployment, and changes to canonical production data.
- Locked UI constraint: preserve the existing Excel-like table structure, columns, calculations, density, and data meaning.

## Delivery Architecture

Create a separate package beside the active prototype rather than mixing simulated state into the production frontend.

Proposed package name:

`fih-procurement-flow-ui-uat`

The package will contain plain HTML, CSS, JavaScript, scenario assets, a test guide, and a manifest. It must run without calling `/api/*`. The preferred entry is a local static page that can be opened after download. If browser file restrictions prevent reliable operation, the package will include a simple Windows launcher that starts a local static server only; that launcher is not a business backend.

## Scenario Set

### Scenario 1: Golden Path

1. Requester reviews and submits the demand.
2. Dept DRI approves it.
3. Cost Manager approves it.
4. OM Leader assigns it to an OM Purchasing member.
5. OM Purchasing enters PAS and quote evidence, validates the quote, and performs OM Handoff.
6. Buyer Handoff shows the received, read-only downstream state.

### Scenario 2: Reject and Resubmit

1. Requester submits the demand.
2. Dept DRI or Cost Manager rejects it with a required reason.
3. The item appears in Requester Action Required.
4. Requester edits the allowed fields and resubmits it.
5. The item returns to the appropriate review queue with a preserved audit timeline.

### Scenario 3: Temporary Budget / Quote Exception

1. The demand reaches price review with Temporary Budget or quote exception evidence.
2. The normal route cannot bypass the exception.
3. Budget Approver approves or rejects with a reason.
4. Approval moves the row to OM intake; rejection returns it to Requester Action Required.
5. OM quote validation and handoff remain unavailable until the exception gate passes.

## Interaction Model

- Users switch roles through a clearly labeled Demo Role Switcher.
- Each role sees only its own workflow navigation, queues, visible fields, and permitted demo actions.
- Actions update the shared scenario state immediately and move the row to the next role queue.
- Every state-changing action appends an audit timeline event containing actor role, action, timestamp, reason or note, previous stage, and next stage.
- A Scenario Overview shows Current Stage, Pending Owner, Next Action, and status for all three rows.
- `Reset Demo Data` requires confirmation and restores all three scenarios to their initial state.
- A scenario selector lets testers focus on one row without deleting the others.

## Persistence and Isolation

- State persists in browser `localStorage` so role switches and page reloads retain progress.
- Storage keys are namespaced for this UAT package.
- Reset removes only the UAT package namespace.
- No action writes to the active prototype, production files, remote services, API, or database.
- Seed data is fictitious and visibly marked `DEMO / UAT`.

## Workflow Guardrails

- A row can advance only from its current stage using an allowed action.
- Reject actions require a reason.
- Requester cannot approve, assign, quote, or hand off.
- Dept DRI and Cost Manager cannot perform OM operations.
- Budget Approver acts only on the exception gate.
- OM Leader assigns but does not operate quotes or PR/PO fields.
- OM Purchasing operates only assigned rows.
- Buyer Handoff is read-only in this UAT version.
- Admin cannot silently perform business approvals.
- Missing PAS requirements, incomplete quote evidence, or unresolved exception gates must render explicit blockers.

## UI Design

- Reuse the approved semantic shell: left side for role/workspace navigation; top area for contextual controls and filters.
- Do not duplicate a function name after moving it into role navigation.
- Keep tables Excel-like and horizontally scrollable where necessary.
- Add a compact Demo Control strip containing Scenario, Role, Current Stage, Pending Owner, and Reset.
- Use visible `DEMO` badges so simulated rows cannot be mistaken for production data.
- Show action results through inline status and timeline updates, not only transient toasts.
- Keep the layout dense, consistent with the approved prototype direction.

## Error and Edge-State Handling

- Disallowed transitions remain disabled and explain the blocking reason.
- Invalid or missing required inputs remain on the current stage and show field-level messages.
- Corrupt or incompatible local storage falls back to fresh seed state with a visible recovery notice.
- Reset asks for confirmation and reports successful restoration.
- Unknown role or scenario identifiers fall back to Scenario Overview without mutating data.

## Validation

- Contract tests for all allowed and forbidden stage transitions.
- Tests for role visibility, field visibility, rejection reason requirements, assignment ownership, PAS/quote blockers, local persistence, and reset isolation.
- A complete browser walkthrough of all three scenarios across every participating role.
- Desktop and narrow viewport rendered QA.
- Browser console must contain no errors or warnings during the walkthrough.
- Verify that the package performs no `/api/*` network request.
- Verify the ZIP after extraction using the included manifest and UAT checklist.

## Distribution

The final delivery will be a separate folder and ZIP containing:

- runnable static UAT frontend;
- three scenario seeds;
- UAT tester guide and role-by-role checklist;
- limitations and non-scope notice;
- file manifest and verification receipt.

After local verification and explicit final approval, upload the package to Google Drive and return the share link. The upload must contain only the separated UAT resources, not the full engineering workspace or production data.

## Acceptance Criteria

1. A tester can manually operate all three scenarios from start to end by switching roles.
2. Each action moves the row to the correct queue and records a timeline event.
3. Rejection/resubmission and Temporary Budget/quote exception gates cannot be bypassed.
4. Reloading retains progress; Reset restores the original scenarios.
5. Role and sensitive-field visibility match the documented role boundaries.
6. Excel-like tables remain structurally unchanged.
7. The separated package runs without a production backend, API, database, or credentials.
8. The extracted delivery is usable with its included instructions and contains no unrelated engineering resources.

## Self-review

- Placeholder scan: no TBD or TODO remains.
- Consistency: delivery, persistence, role ownership, workflow gates, and validation all describe the same frontend-only UAT boundary.
- Scope: one coherent deliverable; backend and production integration are explicitly excluded.
- Ambiguity: Buyer Handoff is read-only, Admin is governance-only, and simulated persistence is browser-local.
