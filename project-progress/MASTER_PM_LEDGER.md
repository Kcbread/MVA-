# Master PM Ledger

Updated: 2026-06-13

## Purpose

This file is the repo-local index for the Notion cross-thread PM hub. It helps new Codex threads discover the PM memory workflow without assuming that Codex can read other desktop thread transcripts directly.

## Notion PM Hub

- Hub: `MVA Procurement Cross-Thread PM Hub`
- URL: `https://app.notion.com/p/37e51fb7c1518144b408e200fcd68d36`
- Setup mode: real Notion execution on 2026-06-13
- Databases:
  - `Thread Updates`
  - `Decision Log`
  - `Risks & Actions`

## Source-Of-Truth Boundary

- Repo remains authoritative for project implementation truth.
- `AGENTS.md` and root `README.md` are the project-level startup gates for future threads.
- `procurement-prototype/_context/` is the first onboarding source for new threads.
- `procurement-prototype/PROJECT_DECISIONS.md` is the full locked-decision source when `_context/` is insufficient.
- Notion is the PM coordination and retrieval layer. It records thread updates, decisions, risks, and actions, but does not replace repo source-of-truth files.

## Thread Startup Gate

Future threads must follow this startup gate before material edits:

1. Read `README.md` and applicable `AGENTS.md` rules.
2. If the task touches cross-thread PM memory, handoff, dirty worktree cleanup, branch/commit hygiene, or thread coordination, read this ledger.
3. Inspect `git status --short`.
4. If the worktree is dirty, unmerged, or already has staged work, identify ownership and read `project-progress/WORKTREE_TRIAGE_20260613.md` before editing.
5. Keep unrelated scopes separate: PM memory, prototype feature work, deployment work, SAP/DB import work, and archive/generated cleanup must not be mixed in one commit.
6. If a change affects future threads, update project-level docs and Notion PM Hub records.

## Required Thread Handoff

Every material thread must hand off before closing or switching scope:

```md
Findings:
Decision:
Risk:
Next:
Evidence:
```

Use `evidence_missing` when a factual claim cannot be tied to a repo path, Notion page, test output, screenshot, commit, or other reviewable artifact.

## Promotion Rules

- Add or update `Thread Updates` for material thread summaries.
- Add or update `Decision Log` only when a decision affects role ownership, canonical data, workflow state, API/DB behavior, testing standards, or IT handoff content.
- Add or update `Risks & Actions` for blockers, cross-thread conflicts, drift risks, or follow-up work.
- If Notion and repo conflict, treat the repo as authoritative and open a Notion conflict record before changing source-of-truth files.

## Worktree Hygiene Rules

- Do not work directly on `main` when existing unrelated changes are present; create a `codex/` branch first.
- Resolve unmerged paths before staging or committing unrelated work.
- Treat bulk deletions under `archive/`, `handoff-delivery/`, `review-output/`, `docs-archive/`, `docs-current/IT*`, screenshots, zips, and generated outputs as high-risk until explicitly accepted.
- Prefer separate commits for:
  - PM memory / project rules.
  - Prototype feature work.
  - Deployment / Mac mini work.
  - SAP PO raw import / DB mirror work.
  - Archive or generated artifact cleanup.
- Never use broad destructive cleanup commands unless the user explicitly approves the exact scope.

## Seed Records Created

- `Thread Updates`
  - `Master PM Thread`
  - `Current Planning Thread`
  - `Legacy Procurement Capture Reference`
- `Decision Log`
  - `Use Notion PM Hub for cross-thread coordination`
  - `Require fixed handoff format for material threads`
- `Risks & Actions`
  - `Keep Notion and repo source-of-truth aligned`
  - `No automatic Codex transcript ingestion`

## Project-Level Documents Updated

- `AGENTS.md`: mandatory project operating rules for future Codex threads.
- `README.md`: workspace entrypoint with PM memory and worktree startup gate.
- `MACBOOK_PRO_SYNC_GUIDE.md`: MacBook Pro / Mac mini sync and deployment gate.
- `procurement-prototype/_context/README.zh-TW.md`: procurement-specific thread onboarding and handoff rules.
- `project-progress/MASTER_PM_LEDGER.md`: repo-local PM memory index.
- `project-progress/WORKTREE_TRIAGE_20260613.md`: current dirty worktree ownership triage.

## Tool Limit

Current tools do not expose a direct reader for other Codex desktop thread transcripts. Cross-thread memory depends on explicit handoffs, repo-backed summaries, and Notion records until a real Codex thread-history MCP is available.
