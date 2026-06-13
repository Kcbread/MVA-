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

## SAP PO Raw Import

Use this flow for the first yellow-row OM scope import and future controlled SAP PO Raw imports.

1. Place the workbook on the Mac mini, outside Git tracking:

```bash
mkdir -p deploy/mac-mini/imports
cp "/path/to/Source DB regularize_0608_renumbered.xlsx" "deploy/mac-mini/imports/Source DB regularize_0608_renumbered.xlsx"
```

2. Rebuild the app container so Python and `openpyxl` are available:

```bash
deploy/mac-mini/deploy.sh
```

3. Apply the raw scope migration to an existing UAT volume:

```bash
set -a
source deploy/mac-mini/.env
set +a
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml exec -T mysql \
  mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  < procurement-prototype/db/migrations/003_sap_po_raw_scope.sql
```

4. Preview yellow OM rows. The clean gate for the first batch is `selected_row_count=13`, `om_scope=13`, `mfg_buy=0`, `error_count=0`, and `warning_count=0`.

```bash
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml exec app \
  node scripts/commit-sap-po-raw-import.js --preview --scope yellow-only
```

5. Commit only after the preview is clean:

```bash
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml exec app \
  node scripts/commit-sap-po-raw-import.js --commit --scope yellow-only --require-clean-preview
```

The command prints a JSON receipt with `import_batch_id`, source checksum, inserted row count, and post-commit DB counts. If duplicate `factory_material_no` rows already exist, commit stops before writing.

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
