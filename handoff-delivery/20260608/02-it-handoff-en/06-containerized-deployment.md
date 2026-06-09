# Containerized Deployment

See `06-container/README.md` for commands.

## Recommended UAT Mode

Docker Compose runs both the Node app and MySQL.

Benefits:

- repeatable IT setup
- isolated MySQL volume
- isolated upload volume
- simple health check
- no direct MySQL exposure to requester browsers

## External MySQL Mode

If IT wants to reuse the current Mac mini Homebrew MySQL service, use:

```bash
docker compose -f docker-compose.external-mysql.yml up --build
```

In this mode, configure `DB_HOST=host.docker.internal` or the IT-approved MySQL host.

## Native Mac mini Fallback

The existing native Mac mini setup remains valid:

- LaunchAgent: `com.kai.mva-procurement`
- Local service path: `/Users/kai-chenyang/Services/mva-procurement/procurement-prototype`
- Local upload root: `/Users/kai-chenyang/Services/mva-procurement/uploads`
- MySQL service: `homebrew.mxcl.mysql`

Use native mode only when IT prefers direct host management over containers.
