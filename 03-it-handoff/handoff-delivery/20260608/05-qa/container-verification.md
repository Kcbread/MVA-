# Container Verification Steps

## Build And Start

```bash
cd 06-container
cp .env.example .env
docker compose up --build
```

## Health Check

```bash
curl -sS http://127.0.0.1:8080/api/health
```

Expected:

```json
{"ok":true,"db":"mysql"}
```

## Login Smoke

```bash
curl -i -sS -X POST http://127.0.0.1:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"admin","password":"123"}'
```

## Attachment Smoke

1. Login as OM/Admin and keep the session cookie.
2. Upload a small test file to `/api/attachments`.
3. Confirm the file is written to the mounted upload volume.
4. Download the file as authorized role.
5. Confirm requester access to OM-internal file is blocked.

## Persistence Smoke

1. Create a UAT feedback row.
2. Upload a UAT screenshot.
3. Restart containers.
4. Confirm feedback metadata, audit event, and attachment file remain available.

## Test DB Warning

Direct DB integration tests must run against an isolated test DB such as `mva_procurement_test`, not `mva_procurement_uat`.
