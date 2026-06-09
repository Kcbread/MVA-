# Docker / Compose Runbook

## Recommended Compose UAT

```bash
cd handoff-delivery/20260608/06-container
cp .env.example .env
# edit DB_PASSWORD, MYSQL_ROOT_PASSWORD, SESSION_SECRET
docker compose up --build
```

Open:

```text
http://127.0.0.1:8080/
```

Health:

```bash
curl -sS http://127.0.0.1:8080/api/health
```

Expected:

```json
{"ok":true,"db":"mysql"}
```

## External MySQL Mode

Use this when IT wants to reuse Mac mini Homebrew MySQL or another internal MySQL host.

```bash
cd handoff-delivery/20260608/06-container
cp .env.example .env
# set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
docker compose -f docker-compose.external-mysql.yml up --build
```

For Mac mini host MySQL, `DB_HOST=host.docker.internal` is usually the first value to try.

## Volumes

| Volume | Purpose |
| --- | --- |
| `mva_mysql_data` | MySQL data persistence. |
| `mva_uploads` | Local attachment file retention. |

## Security Notes

- Do not expose MySQL directly to requester browsers.
- Rotate the UAT default passwords before broader internal testing.
- Store `.env` outside the zip when deploying production-like environments.
- Requester attachment access must be blocked for OM-internal evidence.

## Native Mac mini Fallback

Existing host-based service remains available:

```bash
launchctl print gui/$(id -u)/com.kai.mva-procurement
brew services list
curl -sS http://127.0.0.1:8080/api/health
```
