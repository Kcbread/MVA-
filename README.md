# Procurement Prototype Workspace

This folder keeps the procurement system prototype and supporting materials for
internal testing.

## Development And Deployment Baseline

- MacBook Pro is the primary feature-development and review machine. Larger
  source changes, test updates, commits, and GitHub pushes normally happen here.
- GitHub `origin/main` is the deployable source of truth.
- Mac mini is the host / UAT deployment machine and the allowed hotfix machine
  for UAT-blocking fixes. Hotfixes must still be made in the Git working copy,
  validated, committed, and pushed back to GitHub; do not patch running
  containers or untracked deployed files by hand.
- Docker / Compose deployment assets live in `deploy/mac-mini/`.
- The detailed sync runbook is `MACBOOK_PRO_SYNC_GUIDE.md`.

## Thread Startup And PM Memory

- Project-level rules live in `AGENTS.md`.
- Every material Codex thread must pass the `Mandatory Startup Context Gate`
  in `AGENTS.md` before giving a substantive plan, review, implementation,
  commit, deployment, or product judgment.
- Role-affecting work must read `procurement-prototype/_context/README.zh-TW.md`
  and the relevant files under `procurement-prototype/_context/roles/` before
  changing behavior.
- Cross-thread PM coordination lives in Notion:
  - Hub: `MVA Procurement Cross-Thread PM Hub`
  - URL: `https://app.notion.com/p/37e51fb7c1518144b408e200fcd68d36`
- Repo-local PM memory index:
  - `project-progress/MASTER_PM_LEDGER.md`
- Current dirty worktree triage:
  - `project-progress/WORKTREE_TRIAGE_20260613.md`

Future Codex threads should not assume they can read other desktop thread
transcripts directly. Use explicit thread handoffs, Notion PM Hub records, and
repo-backed summaries.

For material work, include a short `Startup Context Receipt` before
implementation or key product judgment: files read, roles read, locked
decisions used, and unresolved gaps.

Before material edits, run or inspect `git status --short`. If the worktree is
dirty, unmerged, or already contains staged work, identify ownership before
editing. Do not mix feature work, deployment work, PM memory updates, and
archive/generated cleanup in one commit.

## Start Local Test Server

From this folder, run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/procurement-prototype/
```

If port `8080` is already in use, use another port:

```bash
python3 -m http.server 8081
```

## Internal Test Documents

Current documents for testers and reviewers:

- `procurement-prototype/docs-current/frontend-functional-spec.md`
- `procurement-prototype/docs-current/ui-screen-guide-en.md`
- `procurement-prototype/docs-current/uat-test-cases-en.md`
- `procurement-prototype/docs-current/data-dictionary-en.md`

Maintenance / implementation reference:

- `procurement-prototype/_doc/module-table-role-permission-catalog.zh-TW.md`

Older diagrams, screenshots, reports, and reference documents are kept in:

- `procurement-prototype/docs-archive/`

Procurement sample/reference files are kept in:

- `檔案範例/`

## Archived Project

The old recognition project was moved to a sibling archive folder outside this
workspace.
