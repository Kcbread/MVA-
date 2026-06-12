#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
ENV_FILE="${MAC_MINI_ENV_FILE:-.env}"
ENV_PATH="$SCRIPT_DIR/$ENV_FILE"
EXPECTED_BRANCH="${EXPECTED_BRANCH:-main}"
EXPECTED_SHA="${EXPECTED_SHA:-${GITHUB_SHA:-}}"

cd "$REPO_ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the Mac mini runner" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required on the Mac mini runner" >&2
  exit 1
fi

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Missing deploy env file: $ENV_PATH" >&2
  echo "Create it from deploy/mac-mini/.env.example on the Mac mini; do not commit secrets." >&2
  exit 1
fi

COMPOSE_ARGS=(--env-file "$ENV_PATH" -f "$COMPOSE_FILE")
PORT="${PORT:-$(awk -F= '$1 == "PORT" { print $2 }' "$ENV_PATH" | tail -n 1)}"
PORT="${PORT:-8080}"

CURRENT_SHA="$(git rev-parse HEAD)"
CURRENT_BRANCH="${GITHUB_REF_NAME:-$(git branch --show-current || true)}"

echo "Deploying commit: $CURRENT_SHA"
echo "Expected branch: $EXPECTED_BRANCH"
echo "Detected branch/ref: ${CURRENT_BRANCH:-detached}"

if [[ -n "$EXPECTED_SHA" && "$CURRENT_SHA" != "$EXPECTED_SHA" ]]; then
  echo "Refusing deploy: checked out commit $CURRENT_SHA does not match expected $EXPECTED_SHA" >&2
  exit 1
fi

if [[ -n "$CURRENT_BRANCH" && "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  echo "Refusing deploy: current branch/ref $CURRENT_BRANCH is not $EXPECTED_BRANCH" >&2
  exit 1
fi

if [[ "${SKIP_DOCKER_PULL:-0}" != "1" ]]; then
  docker compose "${COMPOSE_ARGS[@]}" pull || true
  docker compose "${COMPOSE_ARGS[@]}" up -d --build
else
  docker compose "${COMPOSE_ARGS[@]}" up -d --build --pull never
fi

echo "Waiting for health check on http://127.0.0.1:$PORT/api/health"
for attempt in $(seq 1 30); do
  if curl --noproxy "*" -fsS "http://127.0.0.1:$PORT/api/health"; then
    echo
    echo "Deployment healthy at commit $CURRENT_SHA"
    exit 0
  fi
  echo "Health check attempt $attempt failed; retrying..."
  sleep 2
done

echo "Deployment health check failed" >&2
docker compose "${COMPOSE_ARGS[@]}" ps >&2 || true
docker compose "${COMPOSE_ARGS[@]}" logs --tail=200 app >&2 || true
exit 1
