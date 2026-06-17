# Website Source Package

This package is for IT / Mac mini deployment.

## Contents

- `05-engineering-source/procurement-prototype/index.html` - frontend entry.
- `05-engineering-source/procurement-prototype/app.js` - main frontend workflow.
- `05-engineering-source/procurement-prototype/server.js` - Node API server.
- `05-engineering-source/procurement-prototype/db/schema.sql` - MySQL Phase 1 schema.
- `05-engineering-source/procurement-prototype/db/seed-uat-users.sql` - UAT users.
- `05-engineering-source/procurement-prototype/05-engineering-source/tools/mac-mini-poc-setup.sh` - Mac mini setup helper.
- `05-engineering-source/procurement-prototype/package.json` / `package-lock.json` - Node dependencies.
- `05-engineering-source/procurement-prototype/test.sh` and `tests/` - validation suite.
- `05-engineering-source/procurement-prototype/.env.example` - environment template.

## Mac mini Quick Start

```bash
cd 05-engineering-source/procurement-prototype
DB_PASSWORD='CHANGE_THIS_PASSWORD' bash 05-engineering-source/tools/mac-mini-poc-setup.sh
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
cd 05-engineering-source/procurement-prototype
./test.sh
```

