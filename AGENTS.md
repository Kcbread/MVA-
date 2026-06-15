# Codex Project Rules

This workspace is the source for the MVA procurement system prototype, database setup notes, IT handoff materials, and PM context compression work.

## First Read Order

When starting work in this workspace, read only what is needed, in this order:

1. `README.md` for workspace entry points.
2. `project-progress/MASTER_PM_LEDGER.md` when the task touches cross-thread PM memory, handoff, dirty worktree cleanup, branch/commit hygiene, or thread coordination.
3. `project-progress/WORKTREE_TRIAGE_20260613.md` when the worktree is dirty, unmerged, or the task touches existing staged/unstaged changes.
4. `procurement-prototype/_context/README.zh-TW.md` for current role, flow, module, and API context.
5. The specific role file under `procurement-prototype/_context/roles/` for the role being changed.
6. `procurement-prototype/PROJECT_DECISIONS.md` only when `_context/` is missing a required locked decision.
7. `procurement-prototype/IMPLEMENTATION_LOG.md` and `project-progress/PROJECT_PROGRESS.md` for recent progress, if the task depends on history.
8. `procurement-prototype/_doc/testing-standard-op.zh-TW.md` before changing tests or verification flow.
9. `procurement-prototype/_doc/ui-quality-review.zh-TW.md` before UI changes.

Do not bulk-read archived handoff packages, `docs-archive/legacy-context/`, old Kuso files, or `_doc/v*.md` unless the user asks for handoff documentation or the current docs are missing a required decision.

## Mandatory Startup Context Gate

Every material task must pass this gate before giving a substantive plan, review, implementation, commit, deployment, or product judgment:

1. Read `README.md` and `procurement-prototype/_context/README.zh-TW.md`.
2. Identify affected roles from the user request, files, screen, feature, API, or data flow. If role ownership is unclear, read every plausibly affected role file before asking.
3. For any role, screen, permission, workflow, UI, API, DB, test, deployment, or handoff work, read the relevant files under `procurement-prototype/_context/roles/` before changing behavior.
4. For cross-role work, read the relevant flow file under `procurement-prototype/_context/flows/`.
5. For table, module, API, or persistence work, read the relevant file under `procurement-prototype/_context/modules/`.
6. Read `procurement-prototype/PROJECT_DECISIONS.md` only when `_context/` does not contain the required locked decision.

Before implementation or any key product judgment, include a short receipt:

```text
Startup Context Receipt
Read: README.md; procurement-prototype/_context/README.zh-TW.md; ...
Roles: Requester; Manager B; Cost Owner; ...
Decisions: locked decisions used, or none
Gaps: unresolved ambiguity, or none
```

The only exception is a tiny task with no product, role, flow, UI, API, DB, test, deployment, or PM-memory judgment, such as reading one explicitly named file or running a simple shell query. Do not use screen names, thread memory, or assumptions as a substitute for role files.

## Core Operating Rules

- Keep the main thread focused on decisions, tradeoffs, implementation summary, and verification results.
- Default to Traditional Chinese for user-facing responses unless the user requests another language.
- Use compact handoffs when context gets long: `Findings / Decision / Risk / Next`.
- Treat `procurement-prototype/_context/` as the first onboarding source for role, flow, module, and API context.
- Treat `procurement-prototype/PROJECT_DECISIONS.md` as the full locked-decision source when `_context/` is insufficient.
- Do not let UI changes redefine business ownership. Lock who creates, approves, views, and edits before implementation.
- Do not update IT handoff packages unless business flow, canonical data, role ownership, or external handoff requirements changed.
- Prefer existing prototype patterns over adding new architecture.
- At the start of a material implementation thread, inspect `git status --short`. If the worktree is dirty, unmerged, or on `main`, identify ownership before editing. Do not mix unrelated workstream changes in one commit.
- If `deploy/mac-mini/deploy.sh` remains `AA` or any path is unmerged, resolve that index conflict before staging or committing unrelated changes.
- Treat large archive, handoff package, review-output, screenshot, and generated-artifact deletions as high-risk until explicitly confirmed. Do not commit those deletions with feature work.

## Source And Runtime Discipline

- Treat Git working copies as the only editable source of truth. Do not make product, code, UI, test, API, DB schema, or deploy-script changes directly in a Mac mini runtime directory or running container.
- On the Mac mini, use `/Users/kai-chenyang/Services/mva-procurement-latest` as the Git source working copy for source edits. Treat `/Users/kai-chenyang/Services/mva-procurement` as deploy/runtime state unless it is explicitly confirmed to be the active clean Git working copy.
- Runtime-only paths such as `deploy/mac-mini/.env`, Docker volumes, uploads, logs, backups, and generated runtime folders are not source and must not be used to infer committed product behavior.
- Before changing source on Mac mini, run `git status --short --branch`, `git fetch origin`, and `git pull --ff-only` for the target branch. If the tree is dirty, classify ownership before editing.
- After Mac mini source edits, validate in the Git working copy, commit intentionally, push to GitHub, then deploy from that commit. Do not leave untracked runtime patches as the only copy of a fix.
- For manual Mac mini source-to-runtime deployment, use `deploy/mac-mini/sync-runtime-from-source.sh` from the Git source checkout. Do not manually `rsync` source into runtime except during explicit recovery or when the script itself is broken.
- When recovering a broken runtime, it is acceptable to replace runtime files from a verified Git clone, but the recovery must end with GitHub SHA, deployed SHA/source markers, health check, and worktree status evidence.
- If a future task says "改程式碼", default to editing source in the current repo or the Mac mini Git clone, not the deployed runtime copy.

## MCP, Skills, And Agents

- Use skills before improvising:
  - `internal-system-delivery-workflow` for general internal-system requirements, frontend/backend/QA planning, IT handoff, MCP/agent coordination, and long-context delivery memory.
  - `procurement-agent-workflow` for large, cross-role, data-flow sensitive work.
  - `procurement-testing-standard-op` before running or changing the standard test flow.
  - `procurement-ui-quality-review` for procurement UI review or UI changes.
  - `frontend-layout-stability` for modal, table, dashboard, and responsive layout work.
- General internal-system collaboration rules come from `internal-system-delivery-workflow`; this repo's procurement-specific truth still comes from `procurement-prototype/PROJECT_DECISIONS.md` and the procurement skills.
- For new thread or subagent startup, read `procurement-prototype/_context/README.zh-TW.md` plus the relevant role file before reading long history or changing product behavior.
- Use MCP/thread tools for PM memory only when the user asks to coordinate threads, create automations, or inspect another Codex thread.
- Use Notion as the cross-thread PM coordination layer for this project:
  - Hub: `MVA Procurement Cross-Thread PM Hub`
  - URL: `https://app.notion.com/p/37e51fb7c1518144b408e200fcd68d36`
  - Required databases: `Thread Updates`, `Decision Log`, `Risks & Actions`
  - Notion records thread state, decisions, risks, and actions; it does not replace repo source-of-truth files.
- Current tool limits: do not assume Codex can directly read other desktop thread transcripts. Until a real Codex thread-history reader is available, cross-thread memory must come from explicit thread handoffs, repo-backed summaries, or Notion records.
- Use subagents for bounded work only: read-only research, spec/story shaping, implementation slices, verification, or validation.
- Do not delegate product decisions to subagents. Bring unresolved ownership or policy questions back to the main thread.
- If subagent capacity is unavailable, continue in the main thread and state that the agent limit was hit.

## Procurement Prototype Heuristics

- Roles matter more than screens. Confirm role ownership before changing tabs, tables, or actions.
- Canonical data must be explicit: quantity, phase, station/unit, currency, price, carryover status, and approval status.
- Warehouse-style data is evidence unless a ledger or workflow rule says it affects cost.
- Cost Owner views must distinguish calculated value from approval status.
- Requester-facing UI must hide vendor, supplier, PAS material number, factory material number, and OM ownership unless a decision says otherwise.
- Dense tables are acceptable for Manager B, but numeric meaning must remain readable through detail, titles, or drilldowns.
- Avoid adding a new tab when the task is better modeled as a contextual suggestion, row action, queue, or detail panel.

## Verification Expectations

- Run `./test.sh` from `procurement-prototype` for material prototype changes.
- For narrow syntax-only changes, at least run the relevant syntax or unit check and explain why the full suite was not needed.
- UI work should include rendered verification when feasible, especially for modals, tables, overflow, and role-specific screens.
- If a test fails because expectations are stale, update the test only after confirming the new business rule is intentional.

## PM Memory And Context Compression

- Use `MVA Procurement Cross-Thread PM Hub` in Notion as the stable PM coordination baseline when available.
- Keep `project-progress/MASTER_PM_LEDGER.md` as the repo-local index for the Notion PM Hub and its operating rules.
- Repo truth remains authoritative:
  - `procurement-prototype/_context/` is the first onboarding source.
  - `procurement-prototype/PROJECT_DECISIONS.md` is the full locked-decision source when `_context/` is insufficient.
  - Notion is for cross-thread retrieval, PM alignment, risk/action tracking, and handoff summaries.
- Daily summaries should be delta-based: yesterday's changes, newly locked decisions, current status, risks, and next actions.
- A handoff is useful only if a future thread can continue from it without rereading the old conversation.
- Prefer one readable canonical handoff over many partial summaries.
- Every material thread must hand off before closing or switching scope:
  - `Findings`: evidence-backed discoveries only.
  - `Decision`: locked or proposed decisions, or `none`.
  - `Risk`: cross-thread drift, blockers, conflicts, or `none`.
  - `Next`: concrete next action and owner if known.
  - `Evidence`: repo paths, Notion URLs, test output, screenshots, commits, or `evidence_missing`.
- Promote a Notion `Decision Log` entry only when the change affects role ownership, canonical data, workflow state, API/DB behavior, testing standards, or IT handoff content.
- If Notion and repo conflict, treat the repo as authoritative, open a `Risks & Actions` conflict in Notion, and update the relevant repo source only after the decision is confirmed.
- Future threads must follow the current conclusions:
  - Notion PM Hub is the cross-thread coordination layer.
  - Repo `_context/` and `PROJECT_DECISIONS.md` remain authoritative for product truth.
  - Dirty worktree cleanup must use ownership triage, not broad reset/restore commands.
  - PM memory / worktree hygiene updates must be mirrored in project-level docs when they affect future threads.
