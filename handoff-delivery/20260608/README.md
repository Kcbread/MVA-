# MVA Procurement Containerized IT Handoff - 2026-06-08

This package is the English IT handoff for containerized UAT deployment and future full workflow persistence.

## What IT Should Read First

1. `02-it-handoff-en/00-executive-summary.md`
2. `02-it-handoff-en/01-business-flow-and-roles.md`
3. `02-it-handoff-en/02-role-permission-matrix.md`
4. `02-it-handoff-en/03-data-flow-and-closed-loop.md`
5. `02-it-handoff-en/04-api-and-backend-boundaries.md`
6. `02-it-handoff-en/05-database-current-and-target.md`
7. `06-container/README.md`
8. `03-diagrams/*.png`

## Package Map

| Folder | Purpose |
| --- | --- |
| `01-source/` | Clean current prototype source snapshot, excluding local env, archives, artifacts, and dependencies. |
| `02-it-handoff-en/` | Full English business, role, data, API, DB, and deployment handoff. |
| `03-diagrams/` | English PNG diagrams plus Mermaid source. |
| `04-db/` | Current SQL files and DB roadmap. |
| `05-qa/` | Verification result and UAT/container test plan. |
| `06-container/` | Dockerfile, Compose files, env example, and runbook. |

## Current Truth

The current prototype has a real Node API and optional MySQL backend for auth/session, UAT feedback, OM assignment, audit, and local attachment retention. The main procurement workflow is still mostly frontend/in-memory and must be migrated slice by slice.
