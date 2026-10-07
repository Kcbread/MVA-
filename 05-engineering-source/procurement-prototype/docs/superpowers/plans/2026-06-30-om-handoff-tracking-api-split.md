# OM Handoff Tracking API Split Implementation Plan

## Startup Context Receipt

Read:
- `README.md`
- `_context/README.zh-TW.md`
- `_context/roles/04-om-leader.zh-TW.md`
- `_context/roles/05-om-purchasing.zh-TW.md`
- `_context/roles/08-buyer-handoff.zh-TW.md`
- `_context/modules/api-readiness.zh-TW.md`
- `_context/modules/table-role-module-map.zh-TW.md`

Roles:
- OM Leader: progress visibility and Project Stage Calendar setup.
- OM Purchasing: PAS, quotation, OM Handoff preparation, PR/PO/ETA tracking, daily exchange-rate setting.
- Buyer Handoff: downstream PR/PO execution boundary remains read-only/future-facing in this prototype.

Decisions:
- Keep top-level OM Leader tabs limited to `OM Leader Console`.
- Keep top-level OM Purchasing tabs as operational queues.
- Split PR/PO/ETA inside `OM Purchasing > OM Handoff` as internal tracking views, not new role-level tabs.
- Stage calendar, leader console rows, and OM procurement tracking must use real API calls in API mode.

Gaps:
- Existing server API only covers OM assignees, assignment rules, and assignment mutations.
- No current server endpoints persist Project Stage Calendar or OM procurement tracking fields.
- OM Leader Console currently renders from frontend rows only.

## Boundary Map

Feature:
- OM Purchasing Handoff Tracking and OM Leader Progress Governance.

Function:
- Persist and hydrate Project Stage Calendar.
- Persist and hydrate budget / PR / PO / PUR request / ETA / DTA / total lead-time fields.
- Expose OM Leader Console rows from server API.
- Add internal Handoff view buttons: `Preparation`, `PR / PO`, `Delivery`, `All`.

Module:
- `server.js`
- `db/migrations/006_om_governance_tracking.sql`
- `app.js`
- `index.html`
- `styles.css`
- `tests/api.test.js`
- `tests/system-contract.test.js`
- `tests/role-flow-smoke.js`
- `_context/modules/api-readiness.zh-TW.md`
- `_context/roles/04-om-leader.zh-TW.md`
- `_context/roles/05-om-purchasing.zh-TW.md`

Non-scope:
- Do not move buyer-owned execution into OM Leader.
- Do not create new top-level OM Leader tabs.
- Do not change external buyer workflow completion rules.
- Do not refactor the full OM table architecture beyond the column split needed here.

Validation:
- API tests prove real routes, role guards, persistence, and audit events.
- Contract tests prove frontend calls the new API paths and keeps role/tab ownership.
- Role-flow smoke test proves the internal Handoff views render and do not expose OM Handoff under OM Leader.
- Run `./test.sh`.

## Implementation Steps

1. Add failing API tests for:
   - `GET /api/om/project-stage-calendar`
   - `PUT /api/om/project-stage-calendar`
   - `GET /api/om/procurement-tracking`
   - `PATCH /api/om/requests/:id/procurement-tracking`
   - `GET /api/om/leader-console`
   - Role guards: OM Leader/Admin can maintain stage calendar; OM Purchasing/Admin can maintain procurement tracking.

2. Add server persistence:
   - Memory fallback maps for tests/local use.
   - MySQL-backed reads/upserts when `pool` exists.
   - Audit events for stage-calendar save and procurement tracking update.
   - Leader console API backed by workflow tables when available, with memory/prototype fallback payload shape.

3. Add migration:
   - `om_project_stage_calendar`
   - `om_procurement_tracking`

4. Wire frontend API:
   - `hydrateOmGovernanceState()`
   - `hydrateOmProjectStageCalendar()`
   - `hydrateOmProcurementTracking()`
   - `hydrateOmLeaderConsoleRows()`
   - `saveOmStageCalendar()` writes API in API mode.
   - `updateOmProcurementField()` writes API in API mode.

5. Split OM Handoff internally:
   - Add view buttons inside `OM Handoff`.
   - Tag table columns/cells by view group.
   - Keep shared identity columns visible.
   - Hide preparation/procurement/delivery columns by selected internal view.

6. Update docs and tests:
   - API readiness.
   - OM Leader and OM Purchasing role docs.
   - System contract and role smoke tests.

7. Verify:
   - Focused API/contract/smoke tests.
   - Full `./test.sh`.
