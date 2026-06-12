#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
APP_DIR="$REPO_ROOT/procurement-prototype"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="${MAC_MINI_ENV_FILE:-.env}"
ENV_PATH="$SCRIPT_DIR/$ENV_FILE"
MODE="${1:-quick}"
PORT="${PORT:-$(awk -F= '$1 == "PORT" { print $2 }' "$ENV_PATH" 2>/dev/null | tail -n 1)}"
PORT="${PORT:-8080}"

cd "$REPO_ROOT"

usage() {
  cat <<'EOF'
Usage: deploy/mac-mini/hotfix.sh [quick|full|deploy|health|status]

quick   Run syntax + unit/contract tests, rebuild from local Docker cache, and health check.
full    Run procurement-prototype/test.sh, rebuild from local Docker cache, and health check.
deploy  Rebuild/restart containers from local Docker cache, then health check.
health  Check Docker Compose status and /api/health only.
status  Show git, Docker Compose, and health status.
EOF
}

require_runtime() {
  if [[ ! -f "$ENV_PATH" ]]; then
    echo "Missing deploy env file: $ENV_PATH" >&2
    exit 1
  fi
  if ! command -v docker >/dev/null 2>&1; then
    echo "docker is required" >&2
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo "docker compose is required" >&2
    exit 1
  fi
}

show_git_status() {
  echo "== Git =="
  git status --short --branch
  echo "HEAD: $(git rev-parse --short HEAD)"
  echo "origin/main: $(git rev-parse --short origin/main 2>/dev/null || echo unknown)"
}

run_quick_tests() {
  echo "== Quick validation =="
  (
    cd "$APP_DIR"
    node --check server.js
    node --check app.js
    node --check app-modules/role-guards.js
    node --test tests/*.test.js
  )
}

run_full_tests() {
  echo "== Full validation =="
  (
    cd "$APP_DIR"
    ./test.sh
  )
}

run_deploy() {
  echo "== Deploy from local cache =="
  NO_PROXY=127.0.0.1,localhost no_proxy=127.0.0.1,localhost \
  SKIP_DOCKER_PULL=1 EXPECTED_SHA="$(git rev-parse HEAD)" EXPECTED_BRANCH=main \
    "$SCRIPT_DIR/deploy.sh"
}

run_health() {
  echo "== Health =="
  docker compose --env-file "$ENV_PATH" -f "$COMPOSE_FILE" ps
  curl --noproxy "*" -fsS "http://127.0.0.1:$PORT/api/health"
  echo
}

case "$MODE" in
  quick)
    require_runtime
    show_git_status
    run_quick_tests
    run_deploy
    ;;
  full)
    require_runtime
    show_git_status
    run_full_tests
    run_deploy
    ;;
  deploy)
    require_runtime
    show_git_status
    run_deploy
    ;;
  health)
    require_runtime
    run_health
    ;;
  status)
    require_runtime
    show_git_status
    run_health
    ;;
  -h|--help|help)
    usage
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
