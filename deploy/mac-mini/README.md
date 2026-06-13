# Mac mini Deployment

This directory is the canonical Docker Compose deployment and hotfix source for the Mac mini UAT host.

## One-time setup on Mac mini

1. Install Docker with `docker compose`.
2. Install a GitHub Actions self-hosted runner with labels: `mac-mini`, `uat`, `docker`.
3. Copy `deploy/mac-mini/.env.example` to `deploy/mac-mini/.env` on the Mac mini and replace every secret value.
4. Keep source changes flowing through GitHub. Mac mini may make UAT-blocking hotfixes in the Git working copy, but those changes must be tested, committed, pushed back to GitHub, and then deployed. Do not edit running containers or untracked deployed files directly.

## Deploy flow

GitHub Actions runs `procurement-prototype/test.sh` first. If tests pass on `main`, the self-hosted Mac mini runner checks out the same commit and runs:

```bash
deploy/mac-mini/deploy.sh
```

The script refuses to deploy the wrong branch or commit when `EXPECTED_BRANCH` and `EXPECTED_SHA` are provided by GitHub Actions. It then rebuilds the app container and verifies `http://127.0.0.1:8080/api/health`.

## Mac mini hotfix flow

Use hotfix only for UAT-blocking issues, deployment failures, health-check failures, or small fixes that must be verified on the Mac mini.

```bash
git checkout main
git pull --ff-only origin main

# Small syntax/unit/contract hotfix
deploy/mac-mini/hotfix.sh quick

# Broader UI/API/role-flow hotfix
deploy/mac-mini/hotfix.sh full

git status --short
git add -A
git commit -m "Hotfix Mac mini UAT issue"
git push origin HEAD:main
```

For redeploying the same commit without changing source:

```bash
deploy/mac-mini/hotfix.sh deploy
deploy/mac-mini/hotfix.sh health
```

Hotfix commits must return to GitHub so MacBook Pro can pull the same source before the next larger development pass.
