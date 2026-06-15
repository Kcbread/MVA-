# New Thread Startup Validator

Updated: 2026-06-15

## Purpose

Use this checklist to validate the first substantive assistant response in a
new Codex thread for this workspace. It is a local rule/checklist, not an
external automation, and it does not replace the source-of-truth project files.

## Required First-Response Template

```text
Startup Context Receipt
Read: README.md; procurement-prototype/_context/README.zh-TW.md; ...
Roles: affected roles read, or none
Flows/Modules: flow/module docs read, or none
Worktree: git status summary, or not inspected yet with reason
Decisions: locked decisions used, or none
Gaps: unresolved ambiguity, or none
Next: immediate action
```

## Validation Checklist

- `Read` lists concrete repo paths that were actually read.
- `Roles` lists every affected role file for role, permission, screen,
  workflow, UI, API, DB, test, deployment, or handoff work; otherwise it says
  `none`.
- `Flows/Modules` lists the flow/module docs read for cross-role, table,
  module, API, or persistence work; otherwise it says `none`.
- `Worktree` records `git status --short --branch` before material edits,
  commits, deployment, or dirty-worktree cleanup; otherwise it gives a reason.
- `Decisions` names locked decisions used, or says `none`.
- `Gaps` names unresolved ambiguity, or says `none`.
- `Next` states the immediate action without making unsupported product
  assumptions.
- Remote writes, publishing, deployment, Notion/GitHub/Google Drive updates,
  or production-data actions are labeled as real execution only when actually
  performed with explicit authorization.
- Mock, fixture, dry-run, and real execution are labeled distinctly.
- Unsupported factual claims are marked `evidence_missing`.

## Pass/Fail Rule

Pass when all applicable checklist items are satisfied. For tiny non-product
tasks, the assistant may keep the receipt internal, but the response must still
explain why the material-task gate was not needed if the user asks about
process, PM memory, or project rules.
