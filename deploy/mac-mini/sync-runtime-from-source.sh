#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE_APP_DIR="$SOURCE_ROOT/procurement-prototype"
SOURCE_DEPLOY_DIR="$SOURCE_ROOT/deploy/mac-mini"

RUNTIME_ROOT="${RUNTIME_ROOT:-/Users/kai-chenyang/Services/mva-procurement}"
RUNTIME_APP_DIR="$RUNTIME_ROOT/procurement-prototype"
RUNTIME_DEPLOY_DIR="$RUNTIME_ROOT/deploy/mac-mini"
RUNTIME_ENV_FILE="${RUNTIME_ENV_FILE:-$RUNTIME_DEPLOY_DIR/.env}"
EXPECTED_BRANCH="${EXPECTED_BRANCH:-main}"
EXPECTED_SHA="${EXPECTED_SHA:-}"
SKIP_GIT_FETCH="${SKIP_GIT_FETCH:-0}"
SKIP_DEPLOY="${SKIP_DEPLOY:-0}"
BACKUP_RUNTIME="${BACKUP_RUNTIME:-1}"

COMPOSE_FILE="$RUNTIME_DEPLOY_DIR/docker-compose.yml"
PORT="${PORT:-}"

usage() {
  cat <<'EOF'
Usage: deploy/mac-mini/sync-runtime-from-source.sh

Sync a clean Git source checkout into the Mac mini runtime directory, then
rebuild and health-check Docker Compose.

Environment:
  RUNTIME_ROOT      Runtime root to update. Default: /Users/kai-chenyang/Services/mva-procurement
  EXPECTED_BRANCH  Required source branch. Default: main
  EXPECTED_SHA     Optional exact source SHA required before sync.
  SKIP_GIT_FETCH   Set to 1 to skip git fetch/origin comparison.
  SKIP_DEPLOY      Set to 1 to sync files only, without Docker rebuild.
  BACKUP_RUNTIME   Set to 0 to skip timestamped runtime app backup. Default: 1
  PORT             Health-check port. Defaults to deploy .env PORT or 8080.

This script preserves runtime-only state:
  - deploy/mac-mini/.env
  - deploy/mac-mini/imports
  - uploads
  - logs
  - backups
  - Docker named volumes
EOF
}

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required"
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" || "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

require_cmd git
require_cmd rsync

cd "$SOURCE_ROOT"

[[ -d "$SOURCE_APP_DIR" ]] || die "Missing source app directory: $SOURCE_APP_DIR"
[[ -f "$SOURCE_APP_DIR/Dockerfile" ]] || die "Missing source Dockerfile: $SOURCE_APP_DIR/Dockerfile"
[[ -f "$SOURCE_DEPLOY_DIR/docker-compose.yml" ]] || die "Missing source Compose file: $SOURCE_DEPLOY_DIR/docker-compose.yml"

SOURCE_BRANCH="$(git branch --show-current || true)"
SOURCE_SHA="$(git rev-parse HEAD)"
SOURCE_STATUS="$(git status --porcelain=v1 -uall)"

echo "== Source =="
echo "source_root=$SOURCE_ROOT"
echo "branch=${SOURCE_BRANCH:-detached}"
echo "sha=$SOURCE_SHA"

if [[ -n "$SOURCE_STATUS" ]]; then
  git status --short --branch
  die "Source worktree is dirty; commit, stash, or discard changes before syncing runtime."
fi

if [[ -n "$SOURCE_BRANCH" && "$SOURCE_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  die "Source branch $SOURCE_BRANCH does not match EXPECTED_BRANCH=$EXPECTED_BRANCH"
fi

if [[ -n "$EXPECTED_SHA" && "$SOURCE_SHA" != "$EXPECTED_SHA" ]]; then
  die "Source SHA $SOURCE_SHA does not match EXPECTED_SHA=$EXPECTED_SHA"
fi

if [[ "$SKIP_GIT_FETCH" != "1" && -n "$SOURCE_BRANCH" ]]; then
  git fetch origin "$SOURCE_BRANCH"
  ORIGIN_SHA="$(git rev-parse "origin/$SOURCE_BRANCH")"
  echo "origin_sha=$ORIGIN_SHA"
  if [[ "$SOURCE_SHA" != "$ORIGIN_SHA" ]]; then
    die "Source SHA differs from origin/$SOURCE_BRANCH; run git pull --ff-only first."
  fi
fi

echo "== Runtime =="
echo "runtime_root=$RUNTIME_ROOT"
[[ -f "$RUNTIME_ENV_FILE" ]] || die "Missing runtime env file: $RUNTIME_ENV_FILE"

mkdir -p "$RUNTIME_ROOT" "$RUNTIME_APP_DIR" "$RUNTIME_DEPLOY_DIR" "$RUNTIME_ROOT/logs" "$RUNTIME_ROOT/backups"

if [[ "$BACKUP_RUNTIME" == "1" && -d "$RUNTIME_APP_DIR" ]]; then
  TS="$(date +%Y%m%d-%H%M%S)"
  BACKUP_DIR="$RUNTIME_ROOT/backups/procurement-prototype-before-sync-$TS"
  rsync -a "$RUNTIME_APP_DIR/" "$BACKUP_DIR/"
  echo "backup=$BACKUP_DIR"
fi

echo "== Sync source-controlled files =="
rsync -a --delete "$SOURCE_APP_DIR/" "$RUNTIME_APP_DIR/"
rsync -a --delete \
  --exclude ".env" \
  --exclude "imports" \
  "$SOURCE_DEPLOY_DIR/" "$RUNTIME_DEPLOY_DIR/"

printf "%s\n" "$SOURCE_SHA" > "$RUNTIME_DEPLOY_DIR/.last-source-sha"
printf "%s\n" "$SOURCE_BRANCH" > "$RUNTIME_DEPLOY_DIR/.last-source-branch"

chmod +x "$RUNTIME_DEPLOY_DIR/deploy.sh" "$RUNTIME_DEPLOY_DIR/hotfix.sh" "$RUNTIME_DEPLOY_DIR/sync-runtime-from-source.sh" 2>/dev/null || true

RUNTIME_SHA="$(cat "$RUNTIME_DEPLOY_DIR/.last-source-sha")"
[[ "$RUNTIME_SHA" == "$SOURCE_SHA" ]] || die "Runtime source SHA receipt was not written correctly."

if [[ "$SKIP_DEPLOY" == "1" ]]; then
  echo "== Deploy skipped =="
  echo "Synced source SHA $SOURCE_SHA to $RUNTIME_ROOT"
  exit 0
fi

require_cmd docker
docker compose version >/dev/null 2>&1 || die "docker compose is required"

if [[ -z "$PORT" ]]; then
  PORT="$(awk -F= '$1 == "PORT" { print $2 }' "$RUNTIME_ENV_FILE" | tail -n 1)"
  PORT="${PORT:-8080}"
fi

echo "== Docker deploy =="
cd "$RUNTIME_ROOT"
docker compose --env-file "$RUNTIME_ENV_FILE" -f "$COMPOSE_FILE" up -d --build

echo "== Health =="
for attempt in $(seq 1 30); do
  if HEALTH_PAYLOAD="$(curl --noproxy "*" -fsS "http://127.0.0.1:$PORT/api/health")"; then
    echo "$HEALTH_PAYLOAD"
    echo "== Compose =="
    docker compose --env-file "$RUNTIME_ENV_FILE" -f "$COMPOSE_FILE" ps
    echo "== Receipt =="
    echo "deployed_source_branch=$SOURCE_BRANCH"
    echo "deployed_source_sha=$SOURCE_SHA"
    echo "runtime_root=$RUNTIME_ROOT"
    echo "health_url=http://127.0.0.1:$PORT/api/health"
    exit 0
  fi
  echo "Health check attempt $attempt failed; retrying..."
  sleep 2
done

echo "Deployment health check failed" >&2
docker compose --env-file "$RUNTIME_ENV_FILE" -f "$COMPOSE_FILE" ps >&2 || true
docker compose --env-file "$RUNTIME_ENV_FILE" -f "$COMPOSE_FILE" logs --tail=200 app >&2 || true
exit 1
