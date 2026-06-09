# Full Stack Persistence Handoff

Updated: 2026-06-08 10:05 +07

## Purpose

This note preserves the full-stack persistence preparation state while the latest business logic is still being corrected on the MacBook Pro. Do not implement new schema, workflow APIs, or frontend persistence wiring from this note alone. First sync the latest business rules and prototype code back into this workspace, then use this note as the execution gate.

## Findings

- Mac mini host baseline is ready for internal full-stack UAT preparation.
- Current service URL:
  - Local: `http://127.0.0.1:8080`
  - LAN: `http://192.168.32.212:8080`
- Health check currently returns `{"ok":true,"db":"mysql"}` from both local and LAN URLs.
- Runtime installed:
  - Node.js `v24.16.0`
  - npm `11.13.0`
  - Playwright Chromium/headless runtime
  - MySQL `9.6.0`
- Services:
  - Procurement prototype LaunchAgent: `com.kai.mva-procurement`
  - MySQL Homebrew service: `homebrew.mxcl.mysql`
- Deployment copy:
  - `/Users/kai-chenyang/Services/mva-procurement/procurement-prototype`
  - Created to avoid Desktop/iCloud `dataless` file stalls.
- Current DB:
  - `mva_procurement_uat`
  - Seeded users: 14, including OM test accounts `requester`, `deptdri`, `omleader`, `ompurchasing`, `admin` with password `123`
  - Dynamic tables were cleaned after smoke testing.
- Attachment MVP is deployed for OM internal test:
  - upload root: `/Users/kai-chenyang/Services/mva-procurement/uploads`
  - DB table: `attachments`
  - API: `POST /api/attachments`, `GET /api/attachments/:id`
  - wired UI evidence: UAT feedback screenshot, OM quote screenshot, OM quote Excel, sourcing/procurement quote screenshot
  - role guard: OM-internal files are blocked from requester download; UAT feedback screenshots are downloadable by submitter and triage roles
- Current backend API coverage is limited to:
  - auth/session: login, logout, me, health
  - UAT feedback
  - OM assignees and OM assignment
  - attachment upload/download metadata and local file retention
- Main procurement workflow is not yet fully persisted. Most request, approval, OM quote/export, buyer progress, and demo workflow state still lives in frontend state / demo seed logic.

## Decisions

- Target is **full workflow persistence**, not only UAT login/shared feedback.
- MySQL is the shared DB for this internal test host.
- First attachment version will use **local Mac mini file storage**, not metadata-only and not external NAS/SharePoint yet.
- Do not create a skill yet. Keep this as a project handoff until schema, API names, and test flow stabilize.
- `PROJECT_DECISIONS.md` remains the source of truth for role boundaries, workflow ownership, canonical data, and requester/OM visibility rules.
- The final business logic source will be the MacBook Pro updates once synced back into this workspace.

## Current Gaps

- No persisted request/workflow schema yet for:
  - request packages
  - request items
  - demand rows
  - approvals
  - OM PAS Demand No
  - OM quote result
  - User A quote confirmation
  - OM export package
  - Buyer PR/PO/progress
  - carryover workflow state
- Existing `./test.sh` is reliable in memory/test mode, but direct MySQL UAT mode can pollute persistent data because API tests were not designed with DB isolation.
- There is no dedicated isolated test DB yet, such as `mva_procurement_test`.
- There is no migration framework or ordered migration script set yet.
- There is no UAT reset/seed API for workflow data.
- Upload/download API exists for attachment MVP, but it is not yet connected to persisted workflow tables because the workflow schema is still pending.
- Frontend hydration is partial. API mode currently hydrates auth/session, UAT feedback, and OM assignment only.

## Persistence Checklist

Use this checklist before implementing any full-stack workflow slice.

### Role Ownership

- Requester / OPM / DRI:
  - create draft
  - edit own draft demand rows
  - submit package
  - view own status
  - confirm/cancel quote need
  - request post-quote amendment
- Dept DRI:
  - approve/reject requester submissions
  - review resubmitted amendments
- Cost Owner:
  - read-only P&L/cost/progress review
  - no create/approve/reject/export business actions
- OM Purchasing:
  - PAS Demand No
  - PAS Quote Result
  - Send to User A
  - Export Package
  - Reject to DRI
- Buyer:
  - receives rows only after OM export
  - updates PR/PO/external progress/evidence

### Canonical Data

- quantity
- phase
- MFG station or Non-MFG demand unit
- currency
- canonical price
- quote price
- carryover status
- approval status
- current workflow owner
- current workflow stage

### Workflow State

- draft
- submitted
- Dept DRI approved/rejected
- price review pending/approved/rejected if applicable
- OM PAS Demand No recorded
- OM quote saved
- sent to User A
- User A confirmed/cancelled
- export package prepared/exported
- Buyer received
- PR/PO/progress updated

### Audit

Every persisted workflow action must write an audit event with:

- actor user id
- actor role
- entity type
- entity id
- event type
- from status
- to status
- summary
- payload JSON for important field changes
- timestamp

### Attachments

Local attachment storage first version:

- upload root: `/Users/kai-chenyang/Services/mva-procurement/uploads`
- DB stores metadata only:
  - file id
  - linked entity type/id
  - original file name
  - stored file path or storage key
  - MIME type
  - size
  - uploaded by
  - uploaded at
  - owner role / visibility scope
- Download API must enforce role visibility.
- Requester must not see vendor, supplier, vendor part no., PAS internal material context, or OM-owned private attachment details unless a locked decision says otherwise.

## Implementation Gate

- Do not directly copy the current `app.js` row object into one DB table.
- Define workflow-owned tables first, then API contracts, then frontend hydration/actions.
- Keep demo seed data as seed input only, not as live state once a workflow slice is persisted.
- UAT DB and test DB must be separate.
- Every persistence slice must include DB integration tests.
- Every user-visible workflow slice must include a browser/E2E smoke path.
- Attachment APIs must include permission tests before being used by OM/Buyer UI.
- Do not update IT handoff packages unless business flow, canonical data, role ownership, or external handoff requirements changed.

## Proposed Implementation Order

1. Sync the MacBook Pro latest business logic and updated `PROJECT_DECISIONS.md` into this workspace.
2. Re-read `PROJECT_DECISIONS.md`, `IMPLEMENTATION_LOG.md`, this handoff, and the testing/UI SOPs before coding.
3. Define DB migration structure and create `mva_procurement_test`.
4. Add reset/seed scripts for isolated test DB and UAT workflow data.
5. Persist Requester draft/package/demand rows.
6. Persist submit and Dept DRI approval/rejection.
7. Persist Cost Owner read models from submitted/approved demand rows.
8. Persist OM PAS Demand No, quote result, User A confirmation, and export package.
9. Persist Buyer received/progress/evidence state.
10. Extend the deployed local attachment MVP to workflow-owned persisted entities once workflow tables exist.
11. Convert frontend workflow hydration/actions from local state to API-backed state slice by slice.
12. Add full E2E: Requester submit -> Dept DRI approve -> OM quote -> User A confirm -> OM export -> Buyer receive.
13. Once schema/API/testing are stable, consider extracting a skill named `procurement-fullstack-persistence-workflow`.

## Test Requirements

- Host readiness:
  - `/api/health` returns `{"ok":true,"db":"mysql"}`.
- Standard suite:
  - syntax checks
  - unit tests
  - system contract tests
  - browser smoke
  - layout smoke
  - price routing smoke
  - global UI audit
  - accessibility smoke
- DB integration:
  - runs against isolated test DB, not UAT DB
  - migrates, seeds, tests, and cleans deterministically
- Attachment smoke:
  - upload
  - metadata persistence
  - authorized download
  - unauthorized download blocked
  - missing file handling
- Persistence smoke:
  - create workflow row
  - restart Node service
  - verify workflow row, audit event, and attachment metadata remain available

## Known Commands

```bash
curl -sS http://127.0.0.1:8080/api/health
curl -sS http://192.168.32.212:8080/api/health

brew services list
launchctl print gui/$(id -u)/com.kai.mva-procurement

cd /Users/kai-chenyang/Services/mva-procurement/procurement-prototype
PATH="$HOME/.local/bin:$PATH" NODE_BIN="$HOME/.local/bin/node" ./test.sh
```

## Risks

- Business logic is still changing on the MacBook Pro. Schema and API design must wait for the synced final rules.
- Full persistence will expose state conflicts that the current frontend-only prototype can hide.
- DB integration tests must not use `mva_procurement_uat`, or UAT data will be polluted.
- Local attachment storage needs backup and retention decisions before production-like usage.
- LAN IP `192.168.32.212` may change unless fixed by DHCP reservation or static network configuration.

## Next

When the MacBook Pro business logic is ready:

1. Sync latest files into this workspace.
2. Compare latest `PROJECT_DECISIONS.md` against this handoff.
3. Update this handoff if role ownership, canonical data, attachment scope, or persistence target changed.
4. Start with DB migration/test DB setup before writing workflow APIs.
