# Whole-project behavior-preserving modularization

Approved in conversation on 2026-09-09: split the entire project by business responsibility before changing item search SQL.

## Invariants

- English UI; preserve Excel-like HTML, table density, calculations, permissions and workflow transitions.
- No Git commands, branches, worktrees, commits, remote changes or deployment.
- Keep demo/localStorage behavior and current API/SQL semantics. Detail search is a separate change.
- Preserve file:// preview and Node HTTP preview, including extension integration.

## Architecture

Frontend source uses explicit ES module imports/exports under src by business capability. app.js is composition only. A reproducible, non-minified classic browser bundle supports the existing file preview without a framework migration. Generated artifacts are not edited. Each binding has one owner; cross-module reassignment uses exported owner operations, not implicit globals. Startup initialization order remains explicit to preserve seed and UI dependencies. Existing independently encapsulated app-modules remain supported.

Business boundaries: shell/session; project/taxonomy; catalog/search; material identity/new item; demand/quantity; approval; cost/budget; OM assignment/quote/tracking; inventory/carryover; admin; import/export. UI event registration belongs to its business module, with composition dispatch where multiple features share a document event. A compatibility adapter is confined to the existing extension/browser integration boundary.

Backend: server.js composes HTTP lifecycle and domain services with explicit dependencies. Server modules own config/database, authentication, catalog/import, attachments, OM governance/tracking and route dispatch. SQL/schema are not changed.

## Verification

Capture baseline before extraction. Test standalone module behavior, startup, browser global compatibility, API contracts, and reproducible build. Run all existing unit/system tests and browser suites. Source-shape tests must read authoritative modules rather than a removed monolith; do not weaken business assertions. Distinguish pre-existing failures from introduced regressions. Provide module ownership map, build commands, backup location and remaining risks.
