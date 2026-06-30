# MVA Procurement Workspace

This workspace is organized by audience so PM, OA internal testers, IT, and
engineering can find the right entry point quickly.

## Start Here

| Need | Go to |
| --- | --- |
| PM status, decisions, thread handoff, dirty worktree notes | `01-pm-owner/` |
| OA / internal UAT test entry, test cases, screen guide | `02-oa-internal-test/` |
| IT no-source handoff, data dictionary, API / DB docs, handoff packages | `03-it-handoff/` |
| PPTs, flow diagrams, sample Excel/PDF/DOC files, source data | `04-business-reference/` |
| Runnable prototype source code | `05-engineering-source/procurement-prototype/` |
| Mac mini Docker / deployment scripts | `06-deployment/mac-mini/` |
| Screenshots, review outputs, generated artifacts, test logs | `07-review-and-artifacts/` |
| Old Axure, DFD source, legacy docs, archived reference material | `99-archive/` |

## Fast Links

- PPT index: `04-business-reference/PRESENTATIONS_INDEX.md`
- Current OA internal test guide: `02-oa-internal-test/README.md`
- Current IT handoff entry: `03-it-handoff/README.md`
- PM memory ledger: `01-pm-owner/project-progress/MASTER_PM_LEDGER.md`
- Prototype context entry: `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- Mac mini deploy runbook: `06-deployment/mac-mini/README.md`

## Run The Prototype Locally

From the repo root:

```bash
cd 05-engineering-source/procurement-prototype
./test.sh
```

For a simple static local preview, serve the workspace root explicitly so the
preview does not depend on the shell's current directory:

```bash
python3 -m http.server 8080 --directory "/Users/kai-chenyang/Desktop/桌面 - Kai-chen的MacBook Pro/Codex/資料庫建置"
```

Then open:

```text
http://127.0.0.1:8080/05-engineering-source/procurement-prototype/
```

Always use the `05-engineering-source/procurement-prototype/` URL for local
preview after implementation. HTML files under `03-it-handoff/` are delivery
snapshots and may intentionally remain older than the active source.

The prototype test suite includes a local-preview asset cache contract: when
frontend runtime files change, `index.html` must bump
`mva-local-preview-version` and all local `.js` / `.css` query strings together
so browsers do not keep stale source during local review.

## Development And Deployment Baseline

- MacBook Pro is the primary feature-development and review machine.
- GitHub `origin/main` is the deployable source of truth.
- Mac mini is the UAT deployment host and allowed UAT-blocking hotfix machine.
- Source changes must happen in a Git working copy, be validated, committed,
  pushed, and then deployed. Do not patch running containers by hand.
- Docker / Compose deployment assets live in `06-deployment/mac-mini/`.
- Detailed sync guidance lives in `01-pm-owner/MACBOOK_PRO_SYNC_GUIDE.md`.

## Codex Startup

- Project rules live in `AGENTS.md`.
- For material product work, read:
  - `README.md`
  - `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
  - relevant role / flow / module docs under that `_context/` folder
- For PM memory, branch hygiene, dirty worktree, or handoff work, read:
  - `01-pm-owner/project-progress/MASTER_PM_LEDGER.md`
  - `01-pm-owner/project-progress/WORKTREE_TRIAGE_20260613.md` when relevant

## Notes

- `03-it-handoff/` contains current handoff material and historical handoff
  packages. Treat zip packages as snapshots unless rebuilt from current docs.
- `04-business-reference/` is the first stop for PPTs and business sample files.
- `07-review-and-artifacts/outputs/` may contain local generated artifacts and
  is intentionally ignored unless a specific output is promoted.
