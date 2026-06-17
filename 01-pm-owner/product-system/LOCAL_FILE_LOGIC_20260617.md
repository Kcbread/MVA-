# Local File Logic - 2026-06-17

## Purpose

This note defines the local folder ownership model after the audience-based
workspace restructure. It is intentionally local-first: the current MacBook
workspace documents are the operational baseline until a clean git history is
prepared and explicitly approved.

## Current Folder Ownership

| Folder | Owner Lens | What Belongs Here | What Does Not Belong Here |
| --- | --- | --- | --- |
| `01-pm-owner/` | PM / cross-thread governance | Product maps, PM ledger, worktree triage, release readiness, sync rules | Prototype source edits, generated screenshots, IT package snapshots |
| `02-oa-internal-test/` | OA / OM internal QA | QA entry, patch notes, tester guides, UAT evidence | Product decision truth, source code |
| `03-it-handoff/` | IT handoff | Current handoff docs, data dictionary, API/DB/deployment handoff, rebuilt package snapshots | Daily QA notes, old generated packages as truth |
| `04-business-reference/` | Business source material | PPTs, flow diagrams, sample Excel/PDF/DOC files, raw reference data | Runtime artifacts, code source |
| `05-engineering-source/` | Engineering source | Runnable prototype, role/flow/module context, tests, DB schema, scripts | Generated review artifacts, old handoff zips |
| `06-deployment/` | Deployment | Mac mini Docker, deploy scripts, runtime sync scripts | Product feature code outside deploy scripts |
| `07-review-and-artifacts/` | Evidence artifacts | Screenshots, review outputs, test artifacts, generated local outputs | Product truth unless explicitly promoted |
| `99-archive/` | Historical retention | Old Axure, old DFDs, legacy context, archived prototype docs | Current development entrypoints |

## File Logic Corrections Applied In This Pass

- `Quote Expiry` is no longer a standalone OM tab in current product truth.
- Quote validity / expiry monitoring belongs inside `Quote Result / Monitor`.
- OM operational modules should be documented as `PAS Demand No`, `Quote Result / Monitor`, and `Export Package`.
- Product maps must include feature, function, module, role, permission, and workflow status in one traceable surface.

## High-Risk Actions Not Performed

- No git repository deletion.
- No broad `git reset`, `git clean`, or mass restore.
- No force push or remote rewrite.
- No archive, handoff package, screenshot, or generated artifact deletion.

## Recommended Repo Cleanup Path

1. Keep local docs as the operational baseline.
2. Commit PM/product-system docs separately from prototype feature code.
3. Commit OM QA patch separately from folder restructure.
4. Decide whether archive/generated deletions are intentional.
5. Only after a clean reviewed state exists, choose one of:
   - preserve history and merge normally;
   - create a fresh branch from the clean local tree;
   - rebuild a new repository after explicit backup and second confirmation.

Deleting and re-uploading the repository is a recovery option, not the default
PM workflow.
