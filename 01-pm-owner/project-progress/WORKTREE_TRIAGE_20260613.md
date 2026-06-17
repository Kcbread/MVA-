# Worktree Triage - 2026-06-13

## Status

- Branch created: `codex/worktree-triage-20260613`
- Base branch before triage: `main`
- Base commit: `b730a5e`
- No `.git/MERGE_HEAD` is present.
- Index still contains one unmerged path: `06-deployment/mac-mini/deploy.sh`.

## Summary

This worktree is not a simple dirty state. It contains several independent change groups:

- 285 staged deletions, mostly generated handoff/archive/review outputs.
- 35 staged non-delete prototype/context changes.
- 21 unstaged non-delete changes.
- 4 untracked files.
- 1 unmerged `AA` file.

Do not run broad cleanup commands such as `git reset --hard`, `git checkout -- .`, or `git clean -fd` until the groups below are accepted or explicitly discarded.

## Change Groups

### Group A - PM Memory Rules

Purpose: new cross-thread PM memory workflow.

Files:

- `AGENTS.md`
- `README.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `01-pm-owner/project-progress/MASTER_PM_LEDGER.md`
- `01-pm-owner/project-progress/WORKTREE_TRIAGE_20260613.md`

Recommended handling:

- Keep and commit separately after review.
- This group is independent of prototype code and archive cleanup.

### Group B - Active Prototype / Dept DRI Work

Purpose: active procurement prototype changes, likely from recent implementation threads.

Staged non-delete examples:

- `05-engineering-source/procurement-prototype/PROJECT_DECISIONS.md`
- `05-engineering-source/procurement-prototype/_context/README.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/01-requester.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/02-dept-dri.zh-TW.md`
- `05-engineering-source/procurement-prototype/_context/roles/03-cost-manager.zh-TW.md`
- `05-engineering-source/procurement-prototype/_doc/dept-dri-quantity-review-handoff-20260611.md`
- `05-engineering-source/procurement-prototype/app-modules/approval-quantity-review.js`
- `05-engineering-source/procurement-prototype/app-modules/approval-review-surface.js`
- `05-engineering-source/procurement-prototype/app-modules/approval-workbench.js`
- `05-engineering-source/procurement-prototype/app-modules/horizontal-table-navigator.js`
- `05-engineering-source/procurement-prototype/app-modules/request-worksheet-matrix.js`
- `05-engineering-source/procurement-prototype/app-modules/role-queue-config.js`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/tests/dri-inline-analysis-contract.test.js`
- `05-engineering-source/procurement-prototype/tests/role-flow-smoke.js`
- `05-engineering-source/procurement-prototype/tests/system-contract.test.js`

Unstaged follow-up examples:

- `05-engineering-source/procurement-prototype/app-modules/workflow-status-table.js`
- `05-engineering-source/procurement-prototype/app-modules/workflow-status.js`
- `03-it-handoff/current-docs/data-dictionary-en.md`
- `03-it-handoff/current-docs/shared-db-session-audit-implementation-plan-zhTW.md`
- `03-it-handoff/current-docs/it-handoff/en/00-naming-rules.md`
- `03-it-handoff/current-docs/it-handoff/zh-TW/00-naming-rules.md`

Recommended handling:

- Review as one or more feature commits after running the prototype test flow.
- Do not mix with archive deletion cleanup.
- Files with `MM` state need staged vs unstaged content reviewed before commit.

### Group C - Deploy / Mac mini Work

Purpose: deployment runbook and Mac mini deploy script changes.

Files:

- `MACBOOK_PRO_SYNC_GUIDE.md`
- `README.md`
- `06-deployment/mac-mini/README.md`
- `06-deployment/mac-mini/deploy.sh`

Risk:

- `06-deployment/mac-mini/deploy.sh` is unmerged with two index stages and must be resolved before normal git operations are reliable.
- Stage 2 includes `curl --noproxy "*"` and `SKIP_DOCKER_PULL` support.
- Stage 3 is simpler and lacks those two safeguards.

Recommended handling:

- Resolve `06-deployment/mac-mini/deploy.sh` first, probably favoring stage 2 unless there is a reason to drop `--noproxy` and `SKIP_DOCKER_PULL`.
- Commit deploy/runbook work separately from prototype feature work.

### Group D - SAP PO Raw Import / DB Mirror

Purpose: likely SAP PO raw import mirror work.

Files:

- `Source DB regularize_0608_renumbered.xlsx`
- `05-engineering-source/procurement-prototype/app-modules/sap-po-raw-contract.js`
- `05-engineering-source/procurement-prototype/db/migrations/002_sap_po_raw_mirror.sql`

Recommended handling:

- Keep out of prototype UI commits unless it is part of the same verified workflow.
- Decide whether the Excel source file belongs in Git. If it is large/reference data, prefer `04-business-reference/sample-files/` or an external artifact policy.

### Group E - Archive / Generated Output Deletions

Purpose: unknown. This may be intentional cleanup or accidental loss from moved/generated folders.

Deletion distribution:

- `03-it-handoff/handoff-delivery/20260608`: 88
- `03-it-handoff/handoff-delivery/20260604`: 63
- `03-it-handoff/current-docs`: 54
- `07-review-and-artifacts/review-output`: 38
- `99-archive/prototype-docs-archive`: 22
- `archive`: 15
- `07-review-and-artifacts/prototype-test-artifacts`: 1
- `03-it-handoff/handoff-delivery/*.zip`: 4

Recommended handling:

- Do not commit these deletions together with active feature work.
- Confirm whether this is intentional archive cleanup.
- If intentional, make a dedicated cleanup commit with a clear message.
- If accidental, restore these paths before committing anything else.

## Immediate Safe Order

1. Resolve `06-deployment/mac-mini/deploy.sh` unmerged state.
2. Commit Group A PM memory rules separately.
3. Decide whether Group E deletions are intentional.
4. If Group E is accidental, restore those paths only.
5. Review Group B and Group D as separate feature scopes.
6. Run the relevant test flow before committing prototype changes.

## Commands To Use Only After Approval

Resolve deploy script by choosing stage 2:

```bash
git checkout --ours -- 06-deployment/mac-mini/deploy.sh
git add 06-deployment/mac-mini/deploy.sh
```

Restore archive/generated deletions if accidental:

```bash
git restore --staged archive 03-it-handoff/handoff-delivery 99-archive/prototype-docs-archive 03-it-handoff/current-docs 07-review-and-artifacts/review-output 07-review-and-artifacts/prototype-test-artifacts
git restore archive 03-it-handoff/handoff-delivery 99-archive/prototype-docs-archive 03-it-handoff/current-docs 07-review-and-artifacts/review-output 07-review-and-artifacts/prototype-test-artifacts
```

Commit PM memory rules only:

```bash
git add AGENTS.md README.md 05-engineering-source/procurement-prototype/_context/README.zh-TW.md 01-pm-owner/project-progress/MASTER_PM_LEDGER.md 01-pm-owner/project-progress/WORKTREE_TRIAGE_20260613.md
git commit -m "Add cross-thread PM memory workflow"
```

## Evidence

- `git status --porcelain=v1 -uall`
- `git status --porcelain=v2 -uall`
- `git ls-files -u`
- `git diff --cached --name-status --diff-filter=AMR`
- `git diff --name-status --diff-filter=AMR`
- `git diff --cached --name-only --diff-filter=D`
