# Mac mini UAT Deploy SOP Candidate

Status: candidate
Date: 2026-06-15
Scope: MVA procurement prototype Mac mini UAT deployment and recovery

## Purpose

Use this SOP when Mac mini UAT must be updated to the latest GitHub branch,
or when Docker Compose deploy is healthy at the container level but `/api/health`
or external QA access fails.

This is a candidate SOP. Do not treat it as the canonical deployment policy
until it is reviewed and promoted into `deploy/mac-mini/README.md` or an
approved project runbook.

## Evidence From 2026-06-15 Incident

- GitHub branch verified: `codex/excel-scope-requester-action`
- GitHub latest SHA verified: `031be49919a0bd9cfc52478ea0ac71f72c8254af`
- Mac mini clone HEAD matched the same SHA.
- Runtime app served new markers:
  - `P26 Zombie line`
  - `projectStatusProjectTypeFilter`
- Final health check returned `{"ok":true,"db":"mysql"}`.
- Compose status showed both `app` and `mysql` healthy.
- Failure mode found:
  - `ER_ACCESS_DENIED_ERROR` for `mva_uat_app` from the app container.
  - Root/app passwords in `.env` no longer matched the existing MySQL volume.
  - Rebuilding containers did not reset MySQL credentials because Docker named
    volumes preserve initialized database state.

## Golden Rules

1. GitHub is the source of truth for deployable source.
2. Mac mini runtime secrets live only in `deploy/mac-mini/.env`; do not commit it.
3. Do not patch running containers by hand.
4. Do not assume `docker compose up --build` changes MySQL credentials.
5. If `.env` secrets were regenerated after a MySQL volume already exists, the
   app may fail DB login even when the MySQL container is healthy.
6. Use one-step commands and paste outputs back for review when operating
   through a remote human terminal.
7. Avoid shell comment lines in pasted zsh command blocks.

## Normal Deploy: Preferred Path

Run from the Mac mini repository root:

```zsh
cd /Users/kai-chenyang/Services/mva-procurement

git status --short --branch
git fetch origin
git checkout codex/excel-scope-requester-action
git pull --ff-only origin codex/excel-scope-requester-action

docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml up -d --build

sleep 25

curl --noproxy "*" -sS http://127.0.0.1:8080/api/health
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml ps
```

Acceptance:

- `/api/health` returns `{"ok":true,"db":"mysql"}`.
- `app` and `mysql` are both `healthy`.
- External QA URL opens from same network:
  `http://10.239.185.208:8080/`.

## Runtime Replacement Path

Use this only when the current Mac mini runtime directory is not a clean Git
repository or was partially swapped.

Clone latest branch into a side directory:

```zsh
cd /Users/kai-chenyang/Services

rm -rf /Users/kai-chenyang/Services/mva-procurement-latest

git clone --branch codex/excel-scope-requester-action https://github.com/Kcbread/MVA-.git /Users/kai-chenyang/Services/mva-procurement-latest

cd /Users/kai-chenyang/Services/mva-procurement-latest

git rev-parse HEAD
git status --short --branch
```

Verify expected source markers before replacing runtime files:

```zsh
grep -n "P26 Zombie line" /Users/kai-chenyang/Services/mva-procurement-latest/procurement-prototype/app.js
grep -n "projectStatusProjectTypeFilter" /Users/kai-chenyang/Services/mva-procurement-latest/procurement-prototype/index.html
test -f /Users/kai-chenyang/Services/mva-procurement-latest/procurement-prototype/Dockerfile
```

Replace only `procurement-prototype`; keep `deploy`, `.env`, uploads, logs, and
backups intact:

```zsh
cd /Users/kai-chenyang/Services

CUR="/Users/kai-chenyang/Services/mva-procurement"
LATEST="/Users/kai-chenyang/Services/mva-procurement-latest"
TS="$(date +%Y%m%d-%H%M%S)"

test -d "$LATEST/procurement-prototype"
test -f "$LATEST/procurement-prototype/Dockerfile"
test -f "$LATEST/procurement-prototype/app.js"
test -f "$LATEST/procurement-prototype/index.html"
test -f "$CUR/deploy/mac-mini/.env"

mv "$CUR/procurement-prototype" "$CUR/procurement-prototype-old-$TS"
rsync -a "$LATEST/procurement-prototype/" "$CUR/procurement-prototype/"

ls -l "$CUR/procurement-prototype/Dockerfile"
grep -n "P26 Zombie line" "$CUR/procurement-prototype/app.js"
grep -n "projectStatusProjectTypeFilter" "$CUR/procurement-prototype/index.html"
echo "$CUR/procurement-prototype-old-$TS"
```

Then rebuild and verify:

```zsh
cd /Users/kai-chenyang/Services/mva-procurement

docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml up -d --build

sleep 25

curl --noproxy "*" -sS http://127.0.0.1:8080/api/health
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml ps
curl --noproxy "*" -sS http://127.0.0.1:8080/app.js | grep "P26 Zombie line"
curl --noproxy "*" -sS http://127.0.0.1:8080/index.html | grep "projectStatusProjectTypeFilter"
```

## DB Health Failure Triage

Symptom:

```json
{"ok":false,"db":"mysql","error":"Database health check failed"}
```

First check the app can connect to MySQL using the same environment:

```zsh
cd /Users/kai-chenyang/Services/mva-procurement

docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml exec -T app node -e "const mysql=require('mysql2/promise'); mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME}).then(async c=>{const [r]=await c.query('SELECT 1 AS ok'); console.log(JSON.stringify({ok:true,result:r})); await c.end();}).catch(e=>{console.log(JSON.stringify({ok:false,code:e.code,message:e.message})); process.exit(1);})"
```

Interpretation:

- `ER_ACCESS_DENIED_ERROR`: credentials or MySQL grants do not match the
  initialized volume.
- `ER_BAD_DB_ERROR`: database does not exist in the initialized volume.
- Connection timeout or DNS error: inspect Compose network, service name, and
  container status.

## Clean UAT DB Reset

Only use this when the UAT database can be discarded.

Human confirmation required:

```text
Can this Mac mini UAT MySQL data be cleared and reinitialized from current .env?
```

If confirmed:

```zsh
cd /Users/kai-chenyang/Services/mva-procurement

docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml down -v

docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml up -d --build

sleep 25

curl --noproxy "*" -sS http://127.0.0.1:8080/api/health
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml ps
```

Acceptance:

- Compose creates a fresh `mva_mysql_data` volume.
- MySQL initializes from files mounted under `/docker-entrypoint-initdb.d/`.
- `/api/health` returns `{"ok":true,"db":"mysql"}`.

## Git Version Confirmation

Compare GitHub and Mac mini clone SHA:

```zsh
git ls-remote https://github.com/Kcbread/MVA-.git refs/heads/codex/excel-scope-requester-action

cd /Users/kai-chenyang/Services/mva-procurement-latest
git rev-parse HEAD
git status --short --branch
```

Acceptance:

- GitHub branch SHA and Mac mini clone `HEAD` are identical.
- Runtime marker checks pass after rebuild.

## External QA Entry

Current same-network QA entry:

```text
http://10.239.185.208:8080/
```

Health endpoint:

```text
http://10.239.185.208:8080/api/health
```

If external QA cannot connect while local health is OK:

1. Confirm Mac mini current IP:

```zsh
ipconfig getifaddr en0
ipconfig getifaddr en1
```

2. Confirm app listens on all interfaces:

```zsh
lsof -nP -iTCP:8080 -sTCP:LISTEN
```

Expected listener:

```text
TCP *:8080 (LISTEN)
```

3. Confirm Compose port mapping:

```zsh
docker compose --env-file deploy/mac-mini/.env -f deploy/mac-mini/docker-compose.yml ps
```

Expected:

```text
0.0.0.0:8080->8080/tcp
```

## Recovery Notes

- If `docker compose` says `.env` is missing, recreate
  `/Users/kai-chenyang/Services/mva-procurement/deploy/mac-mini/.env` from
  `.env.example` or restore it from backup. Keep permissions `600`.
- If `Dockerfile` is missing, the Compose build context likely points to an
  incomplete `procurement-prototype` directory. Restore or replace the whole
  `procurement-prototype` directory from the latest Git clone.
- If Docker daemon is unavailable, open Docker Desktop and retry after
  `docker compose ps` works.
- If SSH to Mac mini is refused, operate through the visible Mac mini terminal
  one step at a time. Remote Login requires macOS permissions outside this SOP.

## Handoff Receipt Template

Use this after deployment or recovery:

```text
Findings:
- GitHub branch/SHA:
- Mac mini clone SHA:
- Runtime marker evidence:
- Health result:
- Compose status:

Decision:
- Normal deploy / runtime replacement / clean DB reset

Risk:
- UAT DB reset performed? yes/no
- Secrets changed? yes/no
- External QA network dependency:

Next:
- QA URL:
- Owner:

Evidence:
- Command outputs pasted in thread or saved path:
```

## Promotion Checklist

Before promoting this candidate SOP:

- Confirm target branch naming policy: `main` only or feature branch allowed for
  UAT verification.
- Decide whether runtime replacement remains allowed or should be replaced by
  `deploy/mac-mini/deploy.sh` only.
- Decide whether clean DB reset is acceptable for UAT by default or requires
  named approver.
- Add an automated smoke command for source markers that are feature-specific
  only when relevant.
