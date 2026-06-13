# Release Readiness - 2026-06-13

## Status

- Branch: `codex/worktree-triage-20260613`
- Base commit: `b730a5e`
- Local HEAD equals `origin/main`, but the working tree contains uncommitted changes.
- Prototype verification: `./test.sh` completed successfully on 2026-06-13.
- Production push status: not ready until Git index and release scope are cleaned up.

## Today's Cross-Thread Updates

### 1. Dept DRI / Approval Quantity Review

Scope:

- Consolidates Dept DRI review around `Item Quantity Review`.
- Adds approval review module boundaries and shared review surface.
- Keeps quantity review as dense Excel-like evidence rather than a card-style overview.
- Adds item switcher / row picker and three-layer matrix behavior.
- Preserves `Quantity Detail Matrix` as the third-layer shell.

Evidence:

- `procurement-prototype/_doc/dept-dri-quantity-review-handoff-20260611.md`
- `procurement-prototype/app-modules/approval-quantity-review.js`
- `procurement-prototype/app-modules/approval-review-surface.js`
- `procurement-prototype/app-modules/approval-workbench.js`
- `procurement-prototype/app-modules/horizontal-table-navigator.js`
- `procurement-prototype/app-modules/role-queue-config.js`
- `procurement-prototype/tests/dri-inline-analysis-contract.test.js`
- `./test.sh` pass

### 2. Request Worksheet / Shared Matrix Work

Scope:

- Adds shared worksheet/matrix rendering support.
- Keeps requester MFG / Non-MFG worksheet behavior aligned with current context rules.
- Updates system and role-flow tests around review surfaces and role-specific flows.

Evidence:

- `procurement-prototype/app-modules/request-worksheet-matrix.js`
- `procurement-prototype/app.js`
- `procurement-prototype/tests/system-contract.test.js`
- `procurement-prototype/tests/role-flow-smoke.js`
- `./test.sh` pass

### 3. SAP PO Raw Mirror / Factory Material No Contract

Scope:

- Adds a contract for separating `Factory Material No` from `SAP Material No`.
- Adds migration candidate for SAP PO raw mirror.
- Introduces untracked SAP PO source/reference artifacts that need release-scope review.

Evidence:

- `procurement-prototype/app-modules/sap-po-raw-contract.js`
- `procurement-prototype/db/migrations/002_sap_po_raw_mirror.sql`
- `Source DB regularize_0608_renumbered.xlsx`
- `./test.sh` includes SAP PO raw contract tests and passed

Release caution:

- Decide whether the Excel file belongs in Git before production push.

### 4. PM Memory / Cross-Thread Coordination

Scope:

- Creates Notion PM Hub and project-level startup gates.
- Adds repo-local PM memory ledger.
- Adds dirty worktree triage and future-thread rules.
- Updates project entrypoints so future threads follow the same workflow.

Evidence:

- Notion: `MVA Procurement Cross-Thread PM Hub`
- URL: `https://app.notion.com/p/37e51fb7c1518144b408e200fcd68d36`
- `AGENTS.md`
- `README.md`
- `MACBOOK_PRO_SYNC_GUIDE.md`
- `procurement-prototype/_context/README.zh-TW.md`
- `project-progress/MASTER_PM_LEDGER.md`
- `project-progress/WORKTREE_TRIAGE_20260613.md`

### 5. Deployment / Mac mini Work

Scope:

- Deployment docs and Mac mini runbook changed.
- `deploy/mac-mini/deploy.sh` has unresolved `AA` index conflict.

Evidence:

- `MACBOOK_PRO_SYNC_GUIDE.md`
- `deploy/mac-mini/README.md`
- `deploy/mac-mini/deploy.sh`

Release blocker:

- `deploy/mac-mini/deploy.sh` must be resolved before any commit or push.

### 6. Archive / Generated Output Cleanup

Scope:

- 285 staged deletions under archive, handoff package, docs-current old packages, docs-archive, review-output, screenshots, and generated artifacts.

Evidence:

- `git status --short`
- `project-progress/WORKTREE_TRIAGE_20260613.md`

Release blocker:

- Do not push these deletions unless explicitly accepted as a cleanup release.
- If accidental, restore them before release.

## Verification

Command:

```bash
cd procurement-prototype
./test.sh
```

Result:

- Syntax checks passed.
- Unit and system contract tests passed: 106 tests.
- Browser smoke passed.
- Layout smoke passed.
- Price routing smoke passed.
- Global UI audit passed.
- Role flow smoke passed.
- Accessibility smoke passed.
- Final output: `All available tests completed.`

Validation type: real local execution.

## Current Push Blockers

1. `deploy/mac-mini/deploy.sh` is unmerged (`AA`).
2. 285 staged deletions need a release decision.
3. Several files are `MM`, so staged and unstaged content diverge.
4. SAP PO Excel artifact needs a Git inclusion decision.
5. Changes are on `codex/worktree-triage-20260613`, not committed.
6. No push has been performed.

## Recommended Release Path

### Safe Production Path

1. Resolve `deploy/mac-mini/deploy.sh`, likely by keeping stage 2 because it includes `curl --noproxy "*"` and `SKIP_DOCKER_PULL`.
2. Restore or isolate the 285 archive/generated deletions unless Kai explicitly approves cleanup.
3. Commit PM memory docs separately.
4. Commit prototype feature work separately after reviewing `MM` files.
5. Decide whether SAP PO raw mirror belongs in this production release.
6. Re-run `./test.sh`.
7. Push a reviewed release branch or merge to `main`.
8. Deploy UAT / formal environment from the pushed commit and verify `/api/health`.

### Do Not Do

- Do not push the current dirty index directly.
- Do not mix archive deletion cleanup with prototype feature release.
- Do not call unverified local changes a production deployment.

## Proposed Commit Slices

1. `Add cross-thread PM memory workflow`
   - PM memory docs and Notion-backed rules only.
2. `Update Dept DRI approval quantity review`
   - Approval review modules, role flow updates, quantity review tests.
3. `Add SAP PO raw material contract`
   - SAP PO contract module and migration only, if approved.
4. `Update Mac mini deployment runbook`
   - Deploy docs and resolved `deploy.sh`.
5. `Clean archived generated handoff artifacts`
   - Only if large deletion cleanup is explicitly approved.

## Final Decision Needed

Before pushing to formal environment, Kai needs to confirm:

- Include Dept DRI / approval review feature work in this release: yes/no.
- Include SAP PO raw mirror work in this release: yes/no.
- Keep or restore archive/generated deletions.
- Resolve `deploy/mac-mini/deploy.sh` with stage 2 or stage 3.
