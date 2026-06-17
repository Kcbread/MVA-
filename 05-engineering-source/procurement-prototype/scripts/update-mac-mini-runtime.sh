#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"
BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"
EXPECTED_UI_TAG="${EXPECTED_UI_TAG:-20260608-requester-worksheet-v4}"
INSTALL_DEPS="${INSTALL_DEPS:-auto}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

info() {
  printf '\n== %s ==\n' "$1"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

maybe_install_deps() {
  if [[ "${INSTALL_DEPS}" == "never" ]]; then
    return
  fi

  if [[ "${INSTALL_DEPS}" == "always" || package-lock.json -nt node_modules ]]; then
    info "Installing npm dependencies"
    npm install
  else
    info "Skipping npm install"
    echo "Dependencies look unchanged."
  fi
}

stop_existing_server() {
  local pids
  pids="$(lsof -tiTCP:${PORT} -sTCP:LISTEN || true)"
  if [[ -z "${pids}" ]]; then
    info "No existing server on port ${PORT}"
    return
  fi

  info "Stopping existing server on port ${PORT}"
  echo "${pids}" | xargs kill
  sleep 2
}

start_server() {
  info "Starting server on port ${PORT}"
  nohup env PORT="${PORT}" npm start > "${ROOT_DIR}/runtime.log" 2>&1 &
  sleep 3
}

verify_runtime() {
  info "Verifying runtime"
  curl -fsS "http://127.0.0.1:${PORT}/api/health"
  echo
  if curl -fsS "http://127.0.0.1:${PORT}/index.html" | grep -q "${EXPECTED_UI_TAG}"; then
    echo "UI tag verified: ${EXPECTED_UI_TAG}"
  else
    echo "ERROR: expected UI tag not found: ${EXPECTED_UI_TAG}"
    echo "Check runtime at http://127.0.0.1:${PORT}/index.html"
    exit 1
  fi
}

info "Mac mini runtime update"
echo "Repo: ${ROOT_DIR}"
echo "Remote: ${REMOTE}"
echo "Branch: ${BRANCH}"

for cmd in git npm curl lsof; do
  if ! need_cmd "${cmd}"; then
    echo "ERROR: missing required command: ${cmd}"
    exit 1
  fi
done

info "Fetching latest code"
git fetch "${REMOTE}"

info "Updating branch"
git pull --ff-only "${REMOTE}" "${BRANCH}"

maybe_install_deps
stop_existing_server
start_server
verify_runtime

info "Done"
echo "Current commit: $(git rev-parse --short HEAD)"
echo "Runtime log: ${ROOT_DIR}/runtime.log"
