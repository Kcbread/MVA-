#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-start}"

NODE_BIN="/Users/kai-chenyang/.local/opt/node-v24.16.0-darwin-arm64/bin/node"
OD_ROOT="/private/tmp/open-design-src"
OD_CLI="${OD_ROOT}/apps/daemon/dist/cli.js"
OD_URL="http://127.0.0.1:7456"
PID_FILE="/private/tmp/open-design-daemon.pid"
LOG_FILE="/private/tmp/open-design-daemon.log"
LAUNCHD_LABEL="com.open-design.daemon"
LAUNCHD_PLIST="${HOME}/Library/LaunchAgents/${LAUNCHD_LABEL}.plist"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/open-design-daemon.sh start
  bash scripts/open-design-daemon.sh stop
  bash scripts/open-design-daemon.sh restart
  bash scripts/open-design-daemon.sh status
  bash scripts/open-design-daemon.sh logs
EOF
}

is_running() {
  curl -sS -o /dev/null --max-time 2 "${OD_URL}/" 2>/dev/null
}

ensure_ready() {
  if [[ ! -x "${NODE_BIN}" ]]; then
    echo "ERROR: Node 24 binary not found: ${NODE_BIN}"
    exit 1
  fi

  if [[ ! -f "${OD_CLI}" ]]; then
    echo "ERROR: Open Design CLI not found: ${OD_CLI}"
    echo "Build it first from ${OD_ROOT}:"
    echo "  PATH=\"/Users/kai-chenyang/.local/opt/node-v24.16.0-darwin-arm64/bin:\$PATH\" pnpm --filter @open-design/daemon... build"
    exit 1
  fi
}

write_launchd_plist() {
  mkdir -p "$(dirname "${LAUNCHD_PLIST}")"
  cat > "${LAUNCHD_PLIST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>tail -f /dev/null | "${NODE_BIN}" "${OD_CLI}" daemon start --headless --serve-web --port 7456 --host 127.0.0.1</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${LOG_FILE}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_FILE}</string>
</dict>
</plist>
EOF
}

start_daemon() {
  ensure_ready

  if is_running; then
    echo "Open Design daemon is already running at ${OD_URL}"
    return
  fi

  if [[ "$(uname -s)" == "Darwin" ]] && command -v launchctl >/dev/null 2>&1; then
    write_launchd_plist
    launchctl bootout "gui/$(id -u)" "${LAUNCHD_PLIST}" >/dev/null 2>&1 || true
    launchctl bootstrap "gui/$(id -u)" "${LAUNCHD_PLIST}"
    launchctl kickstart -k "gui/$(id -u)/${LAUNCHD_LABEL}" >/dev/null 2>&1 || true
  else
    nohup bash -lc "tail -f /dev/null | \"${NODE_BIN}\" \"${OD_CLI}\" daemon start --headless --serve-web --port 7456 --host 127.0.0.1" > "${LOG_FILE}" 2>&1 < /dev/null &
    echo $! > "${PID_FILE}"
  fi

  for _ in {1..20}; do
    if is_running; then
      echo "Open Design daemon started at ${OD_URL}"
      lsof -tiTCP:7456 -sTCP:LISTEN > "${PID_FILE}" 2>/dev/null || true
      echo "PID: $(cat "${PID_FILE}")"
      echo "Log: ${LOG_FILE}"
      return
    fi
    sleep 1
  done

  echo "ERROR: Open Design daemon did not become ready."
  echo "Check log: ${LOG_FILE}"
  exit 1
}

stop_daemon() {
  local pid=""

  if [[ "$(uname -s)" == "Darwin" ]] && command -v launchctl >/dev/null 2>&1; then
    launchctl bootout "gui/$(id -u)" "${LAUNCHD_PLIST}" >/dev/null 2>&1 || true
  fi

  if [[ -f "${PID_FILE}" ]]; then
    pid="$(cat "${PID_FILE}")"
  fi

  if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
    kill "${pid}"
    rm -f "${PID_FILE}"
    echo "Stopped Open Design daemon PID ${pid}"
    return
  fi

  pid="$(lsof -tiTCP:7456 -sTCP:LISTEN || true)"
  if [[ -n "${pid}" ]]; then
    kill "${pid}"
    rm -f "${PID_FILE}"
    echo "Stopped Open Design daemon PID ${pid}"
    return
  fi

  rm -f "${PID_FILE}"
  echo "Open Design daemon is not running"
}

status_daemon() {
  if is_running; then
    echo "Open Design daemon is running at ${OD_URL}"
    lsof -nP -iTCP:7456 -sTCP:LISTEN || true
  else
    echo "Open Design daemon is not running"
    exit 1
  fi
}

show_logs() {
  if [[ -f "${LOG_FILE}" ]]; then
    tail -n 80 "${LOG_FILE}"
  else
    echo "No log file yet: ${LOG_FILE}"
  fi
}

case "${COMMAND}" in
  start)
    start_daemon
    ;;
  stop)
    stop_daemon
    ;;
  restart)
    stop_daemon || true
    start_daemon
    ;;
  status)
    status_daemon
    ;;
  logs)
    show_logs
    ;;
  *)
    usage
    exit 1
    ;;
esac
