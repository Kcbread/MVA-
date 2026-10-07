#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${DB_NAME:-mva_procurement_uat}"
DB_USER="${DB_USER:-mva_uat_app}"
DB_PASSWORD="${DB_PASSWORD:-}"
PORT="${PORT:-8080}"

info() {
  printf '\n== %s ==\n' "$1"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

info "Mac mini POC setup helper"
echo "This script installs/checks local prerequisites for the MySQL-first POC."
echo "It does not migrate workflow data and does not expose MySQL to other machines."

if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_PASSWORD is required."
  echo "Run example:"
  echo "  DB_PASSWORD='change_this_password' bash scripts/mac-mini-poc-setup.sh"
  exit 1
fi

info "Checking Xcode Command Line Tools"
if xcode-select -p >/dev/null 2>&1; then
  xcode-select -p
else
  echo "Xcode Command Line Tools are missing."
  echo "Run: xcode-select --install"
  exit 1
fi

info "Checking Homebrew"
if ! need_cmd brew; then
  echo "Homebrew is missing."
  echo "Install it first:"
  echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi
brew --version | head -1

info "Installing packages"
brew update
brew install node git mysql tmux

info "Starting MySQL"
brew services start mysql

info "Creating MySQL database and app user"
echo "You may be prompted for the MySQL root password."
mysql -uroot -p <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_NAME}
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
  IDENTIFIED BY '${DB_PASSWORD}';

GRANT ALL PRIVILEGES ON ${DB_NAME}.*
  TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;
SQL

info "Writing .env if missing"
if [[ -f .env ]]; then
  echo ".env already exists; leaving it unchanged."
else
  SESSION_SECRET="$(openssl rand -hex 32)"
  cat > .env <<ENV
NODE_ENV=uat
PORT=${PORT}

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

SESSION_SECRET=${SESSION_SECRET}
SESSION_TTL_HOURS=12
ENV
  echo ".env created."
fi

info "Installing npm dependencies"
npm install

info "Applying Phase 1 schema and UAT users"
mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -h127.0.0.1 "${DB_NAME}" < db/schema.sql
mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -h127.0.0.1 "${DB_NAME}" < db/seed-uat-users.sql

info "Preflight"
node -v
npm -v
mysql --version
mysql -u"${DB_USER}" -p"${DB_PASSWORD}" -h127.0.0.1 -e "SHOW DATABASES LIKE '${DB_NAME}';"

info "Done"
echo "Next:"
echo "1. Set a fixed Mac mini LAN IP."
echo "2. Disable sleep."
echo "3. Start the server: npm start"
echo "4. Users should open: http://<Mac-mini-IP>:${PORT}"
