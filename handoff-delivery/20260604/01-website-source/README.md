# Website Source Package

This package is for IT / Mac mini deployment.

## Contents

- `procurement-prototype/index.html` - frontend entry.
- `procurement-prototype/app.js` - main frontend workflow.
- `procurement-prototype/server.js` - Node API server.
- `procurement-prototype/db/schema.sql` - MySQL Phase 1 schema.
- `procurement-prototype/db/seed-uat-users.sql` - UAT users.
- `procurement-prototype/scripts/mac-mini-poc-setup.sh` - Mac mini setup helper.
- `procurement-prototype/package.json` / `package-lock.json` - Node dependencies.
- `procurement-prototype/test.sh` and `tests/` - validation suite.
- `procurement-prototype/.env.example` - environment template.

## Mac mini Quick Start

```bash
cd procurement-prototype
DB_PASSWORD='CHANGE_THIS_PASSWORD' bash scripts/mac-mini-poc-setup.sh
npm start
```

Then open:

```text
http://<Mac-mini-IP>:8080
```

## Important

- Do not commit or share the real `.env`.
- Frontend does not connect to MySQL directly.
- Architecture: Browser -> Node API -> MySQL.
- Phase 1 DB scope is users, sessions, OM assignments, and audit events.
- Full workflow data migration is the next phase.

## Validation

```bash
cd procurement-prototype
./test.sh
```

