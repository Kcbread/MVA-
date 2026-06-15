# Worktree Triage Before Production Push - 2026-06-15

Status: draft triage
Branch: `codex/excel-scope-requester-action`
Base observed: `031be49919a0bd9cfc52478ea0ac71f72c8254af`

## Summary

The current worktree is suitable for classification before a production push.
It is not currently blocked by unmerged paths or staged partial changes.

Observed state:

- No staged files.
- No unmerged paths.
- No prototype runtime source changes observed in `app.js`, tests, or deploy
  scripts.
- Dirty tracked files are document / handoff / API map artifacts.
- Untracked files are one latest IT review, one IT handoff zip, and one Mac mini
  UAT deploy SOP candidate.

## Startup Context Receipt

Read:

- `README.md`
- `procurement-prototype/_context/README.zh-TW.md`
- `project-progress/MASTER_PM_LEDGER.md`
- `project-progress/WORKTREE_TRIAGE_20260613.md`
- `deploy/mac-mini/README.md`

Roles:

- No role behavior change classified in this triage.
- Affected delivery areas: IT handoff docs, API/table map docs, Mac mini deploy
  SOP.

Decisions:

- Keep unrelated scopes as separate commits.
- Treat generated zips and formal handoff packages as high-risk until accepted.

Gaps:

- Need human confirmation whether the IT handoff document refresh and zip are
  intended for the next formal push.
- Need human confirmation whether the Mac mini UAT SOP candidate should be
  promoted into official deploy docs or committed as a project-progress record.

## Group 1 - IT Handoff / Formal Delivery Docs

Purpose:

- Update current IT handoff package and public reviewer docs.

Tracked files:

- `procurement-prototype/_doc/it-handoff-current-overview.md`
- `procurement-prototype/docs-current/IT_DELIVERY_READINESS_20260608.md`
- `procurement-prototype/docs-current/data-dictionary-en.md`
- `procurement-prototype/docs-current/frontend-functional-spec.md`
- `procurement-prototype/docs-current/uat-test-cases-en.md`
- `procurement-prototype/docs-current/ui-screen-guide-en.md`
- `procurement-prototype/docs-current/om-group-internal-test-plan-zhTW.md`
- `procurement-prototype/docs-current/shared-db-session-audit-implementation-plan-zhTW.md`
- `procurement-prototype/docs-current/procurement-role-decision-flow.drawio`
- `procurement-prototype/docs-current/it-handoff/**`
- `procurement-prototype/docs-current/IT offical handoff/**`

Untracked related files:

- `procurement-prototype/docs-current/IT_DELIVERY_LATEST_REVIEW_20260615.md`
- `procurement-prototype/docs-current/IT_official_handoff_20260615.zip`

Observed content themes:

- Material identity, FTV, PK material coding, attachment security, time/SLA,
  admin impersonation, and Buyer Handoff boundaries.
- English and Traditional Chinese handoff folders appear to be synchronized
  updates.
- The `IT offical handoff` path keeps the existing misspelling; this triage does
  not rename it.

Risk:

- This group is large and mostly documentation. Commit separately from deploy
  SOP.
- The zip is generated output. Include only if it is the intended formal IT
  delivery artifact.

Recommended commit:

```text
Update IT handoff package for material identity and export guards
```

Validation before push:

- Review the latest generated review file.
- Confirm whether the zip should be committed.
- Optional: open representative English and zh-TW handoff docs to ensure the
  generated sections are readable.

## Group 2 - Workflow API / DB Mapping Docs

Purpose:

- Extend API/table mapping with material identity, FTV mapping, purchase route,
  export readiness, attachment guard, and audit event requirements.

Files:

- `procurement-prototype/db/workflow-api-table-map.zh-TW.md`

Observed content themes:

- `item_master` remains requester-safe.
- PAS / Factory / SAP material numbers must not be merged or used as fallback
  identities.
- FTV is an export/audit dimension and must be hidden from Requester.
- `purchase_route = external_import` requires active FTV mapping before export.
- `Need material coding review` blocks export.

Risk:

- This file is a backend/API contract. If it is pushed formally, IT may treat it
  as implementation requirement.

Recommended handling:

- Commit with Group 1 if the IT handoff package is the same delivery scope.
- Otherwise commit separately as API contract clarification.

Recommended commit if separate:

```text
Clarify workflow API mapping for material identity and FTV guards
```

## Group 3 - Mac mini UAT Deploy SOP Candidate

Purpose:

- Capture the 2026-06-15 Mac mini recovery/deploy workflow.

Files:

- `project-progress/MAC_MINI_UAT_DEPLOY_SOP_CANDIDATE_20260615.md`

Observed content themes:

- GitHub branch/SHA verification.
- Runtime replacement path.
- Docker Compose rebuild and health validation.
- MySQL `.env` versus named volume credential mismatch triage.
- Clean UAT DB reset with explicit human confirmation.
- External QA entry and listener/port checks.

Risk:

- Candidate status only; not yet canonical deploy policy.
- Should not be mixed into the formal IT handoff docs commit unless the release
  intentionally includes process-memory updates.

Recommended commit:

```text
Document Mac mini UAT deploy recovery SOP candidate
```

Promotion decision:

- Later promote relevant sections into `deploy/mac-mini/README.md` after review.

## Not In Current Dirty Scope

No dirty changes currently observed in:

- `procurement-prototype/app.js`
- `procurement-prototype/index.html`
- `procurement-prototype/styles.css`
- `procurement-prototype/server.js`
- `procurement-prototype/tests/**`
- `deploy/mac-mini/deploy.sh`
- `deploy/mac-mini/docker-compose.yml`

This means the Mac mini UAT runtime code already deployed from commit
`031be49919a0bd9cfc52478ea0ac71f72c8254af` is not being modified by the current
dirty worktree classification.

## Recommended Push Sequence

1. Review and optionally commit Group 1 + Group 2 as formal IT delivery docs.
2. Commit Group 3 separately as PM/process memory, or keep it uncommitted until
   promoted.
3. Push the branch after commits are reviewed.
4. If production deployment tracks this branch, deploy after the push. If
   production tracks `main`, open/merge PR first.

## Pre-Push Checks

Run before staging/commit:

```zsh
git status --short --branch
git diff --stat
```

For documentation-only commits:

```zsh
git diff --check
```

For any runtime code or deploy script change:

```zsh
cd procurement-prototype
./test.sh
```

Current triage does not require `./test.sh` because no runtime source or tests
are dirty. If that changes, run the full test flow before push.

## Open Questions

1. Should the generated zip
   `procurement-prototype/docs-current/IT_official_handoff_20260615.zip` be
   committed to Git, or delivered outside Git?
2. Should the Mac mini SOP candidate be committed now as project-progress memory,
   or first promoted into `deploy/mac-mini/README.md`?
3. Is the target "production" branch this feature branch, or should this become a
   PR/merge into `main` before formal deployment?
