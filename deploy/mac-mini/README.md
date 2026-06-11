# Mac mini Deployment

This directory is the canonical Docker Compose deployment source for the Mac mini UAT host.

## One-time setup on Mac mini

1. Install Docker with `docker compose`.
2. Install a GitHub Actions self-hosted runner with labels: `mac-mini`, `uat`, `docker`.
3. Copy `deploy/mac-mini/.env.example` to `deploy/mac-mini/.env` on the Mac mini and replace every secret value.
4. Keep source changes flowing through GitHub only. Do not edit deployed source directly on the Mac mini.

## Deploy flow

GitHub Actions runs `procurement-prototype/test.sh` first. If tests pass on `main`, the self-hosted Mac mini runner checks out the same commit and runs:

```bash
deploy/mac-mini/deploy.sh
```

The script refuses to deploy the wrong branch or commit when `EXPECTED_BRANCH` and `EXPECTED_SHA` are provided by GitHub Actions. It then rebuilds the app container and verifies `http://127.0.0.1:8080/api/health`.
