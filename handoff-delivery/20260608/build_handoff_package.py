#!/usr/bin/env python3
from __future__ import annotations

import os
import re
import shutil
import subprocess
import textwrap
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception:  # pragma: no cover
    Image = ImageDraw = ImageFont = None


ROOT = Path(__file__).resolve().parents[2]
PACKAGE = ROOT / "handoff-delivery" / "20260608"
ZIP_PATH = ROOT / "handoff-delivery" / "MVA_PROCUREMENT_CONTAINERIZED_IT_HANDOFF_20260608.zip"
PROTO = ROOT / "procurement-prototype"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).strip() + "\n", encoding="utf-8")


def copy_file(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)


def run(command: list[str], cwd: Path = ROOT) -> str:
    return subprocess.run(command, cwd=cwd, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout


def clean_package() -> None:
    for child in PACKAGE.iterdir():
        if child.name == Path(__file__).name:
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()


def copy_source_snapshot() -> None:
    target = PACKAGE / "01-source" / "procurement-prototype"
    if target.exists():
        shutil.rmtree(target)
    ignore = shutil.ignore_patterns(
        "node_modules",
        ".env",
        ".DS_Store",
        "test-artifacts",
        "docs-archive",
        "IT_MEETING_PACKAGE_20260604",
        "it-handoff",
        "*.zip",
    )
    shutil.copytree(PROTO, target, ignore=ignore)


def preflight_summary() -> str:
    files = [
        PROTO / "server.js",
        PROTO / "db" / "schema.sql",
        PROTO / "db" / "seed-uat-users.sql",
        PROTO / "PROJECT_DECISIONS.md",
        PROTO / "IMPLEMENTATION_LOG.md",
        ROOT / "project-progress" / "FULL_STACK_PERSISTENCE_HANDOFF.md",
    ]
    lines = ["# Preflight Scan Summary", "", "Scanned immediately before package generation.", ""]
    for path in files:
        stat = path.stat()
        rel = path.relative_to(ROOT)
        lines.append(f"- `{rel}` updated at `{stat.st_mtime:.0f}`; size `{stat.st_size}` bytes.")
    lines.extend([
        "",
        "Latest implementation notes used for this package:",
        "",
        "- Attachment MVP is deployed with local file retention and the `attachments` table.",
        "- Current backend API covers auth/session, UAT feedback, OM assignees/assignment, and attachment upload/download.",
        "- Main procurement workflow persistence is still target-roadmap work.",
        "- Do not migrate the overloaded frontend `app.js` row object into one database table.",
    ])
    return "\n".join(lines)


def docs() -> dict[str, str]:
    return {
        "README.md": """
        # MVA Procurement Containerized IT Handoff - 2026-06-08

        This package is the English IT handoff for containerized UAT deployment and future full workflow persistence.

        ## What IT Should Read First

        1. `02-it-handoff-en/00-executive-summary.md`
        2. `02-it-handoff-en/01-business-flow-and-roles.md`
        3. `02-it-handoff-en/02-role-permission-matrix.md`
        4. `02-it-handoff-en/03-data-flow-and-closed-loop.md`
        5. `02-it-handoff-en/04-api-and-backend-boundaries.md`
        6. `02-it-handoff-en/05-database-current-and-target.md`
        7. `06-container/README.md`
        8. `03-diagrams/*.png`

        ## Package Map

        | Folder | Purpose |
        | --- | --- |
        | `01-source/` | Clean current prototype source snapshot, excluding local env, archives, artifacts, and dependencies. |
        | `02-it-handoff-en/` | Full English business, role, data, API, DB, and deployment handoff. |
        | `03-diagrams/` | English PNG diagrams plus Mermaid source. |
        | `04-db/` | Current SQL files and DB roadmap. |
        | `05-qa/` | Verification result and UAT/container test plan. |
        | `06-container/` | Dockerfile, Compose files, env example, and runbook. |

        ## Current Truth

        The current prototype has a real Node API and optional MySQL backend for auth/session, UAT feedback, OM assignment, audit, and local attachment retention. The main procurement workflow is still mostly frontend/in-memory and must be migrated slice by slice.
        """,
        "02-it-handoff-en/00-executive-summary.md": """
        # Executive Summary

        ## Objective

        Give IT a clear implementation handoff for the MVA procurement prototype: business process, role permissions, closed-loop data flow, current technical state, and a containerized UAT deployment path.

        ## Current Implemented State

        - Frontend: single-page procurement prototype with role-specific screens, dense tables, workflow status modules, role guards, quote/price helper modules, carryover/warehouse logic, and local in-memory workflow state.
        - Backend: Node.js HTTP server with static hosting and JSON/multipart APIs.
        - Database: MySQL optional pool with memory fallback. Current SQL includes users, sessions, OM assignments, UAT feedback, attachments, audit events, item/material/FTV/customs support tables.
        - Attachments: local file retention MVP is deployed for OM internal test. Metadata is stored in MySQL; files are stored under a local upload root.

        ## Not Yet Persisted

        The main workflow is not fully persisted yet:

        - request packages
        - request items and demand rows
        - Dept DRI and Cost Manager approval records
        - OM PAS Demand No and quote result workflow
        - Requester quote confirmation and amendment flow
        - OM export package workflow
        - Buyer Handoff PR/PO/progress
        - warehouse/carryover workflow ledgers as persisted DB contracts

        ## Implementation Principle

        Do not copy the overloaded frontend row object into one database table. Define workflow-owned tables first, then API contracts, then frontend hydration/actions.

        ## Recommended Deployment Path

        Docker Compose is the recommended UAT handoff path. It runs:

        - Node app container
        - MySQL container
        - named MySQL data volume
        - named upload volume

        The existing native Mac mini LaunchAgent deployment remains a fallback when IT prefers local Homebrew MySQL and a local Node service.
        """,
        "02-it-handoff-en/01-business-flow-and-roles.md": """
        # Business Flow And Role Ownership

        ## Standard Business Flow

        1. **Requester** creates demand.
           - Selects MFG or Non-MFG.
           - MFG uses line, stage, station, item, quantity, and need date.
           - Non-MFG uses demand unit, item, quantity, and need date.
        2. **Requester** submits package.
        3. **Dept DRI** reviews requester submission.
           - Approve -> Cost Manager.
           - Reject -> Requester Action Required.
        4. **Cost Manager** performs final authorization.
           - Approve -> OM Leader intake/assignment.
           - Reject -> Requester Action Required.
        5. **OM Leader** assigns OM work.
           - Linh owns P27/F27 by default.
           - Giang owns other projects by default.
           - Mai can adjust assignment.
        6. **OM Purchasing** operates assigned rows.
           - PAS Demand No.
           - PAS Quote Result.
           - Quote Expiry tracking.
           - Export Package.
        7. **Buyer Handoff** starts after OM export.
           - Buyer owns PR/PO after OM export.
           - UI must say Buyer Handoff, not vague downstream wording.

        ## Reject Loop

        Every reject must preserve:

        - reason
        - timestamp
        - actor
        - previous stage
        - next owner

        Reject routes:

        - Dept DRI reject -> Requester Action Required -> revise/resubmit -> Dept DRI.
        - Cost Manager reject -> Requester Action Required -> revise/resubmit -> Dept DRI.
        - OM reject -> Requester Action Required or Dept DRI review, depending on reason.
        - Budget Approver reject -> Requester Action Required.

        ## Price Exception Loop

        Price exception uses absolute USD delta:

        ```text
        rounded(quoteUnitPriceUsd - historyUnitPriceUsd, 2) > 0.40
        ```

        - `<= 0.40 USD`: Auto Cleared, no Requester confirmation, move to OM Export Package.
        - `> 0.40 USD`: Dept DRI price review -> Budget Approver -> OM Export Package.
        - No history price, new item, and Temporary Budget always trigger review.

        ## Temporary Budget

        Temporary Budget does not go directly to Budget Approver at submission time:

        1. Requester enters estimate and reason.
        2. Dept DRI submission review.
        3. Cost Manager final authorization.
        4. OM quote result.
        5. Dept DRI quote review.
        6. Budget Approver final approval.
        7. OM Export Package.

        ## Warehouse And Carryover

        Warehouse and carryover are ledgers, not silent quantity overrides.

        - Requester can create evidence/candidate.
        - Dept DRI locks or rejects.
        - Pending candidate does not reduce official cost.
        - Locked/applied ledger events affect effective quantity/cost.
        - Cost Manager views original/saving/effective values.
        - OM consumes effective quantity only.
        """,
        "02-it-handoff-en/02-role-permission-matrix.md": """
        # Role Permission Matrix

        | Role | Business Owner | Can Create/Edit | Can Approve/Reject | Can View | Must Not See / Do |
        | --- | --- | --- | --- | --- | --- |
        | Requester | Demand creator | Demand lines, need date, temporary budget, stock evidence, warehouse/carryover candidates, revisions | None | Own status, high-level timeline, action required tasks | Vendor, supplier, PAS material, factory material, OM assignee, FTV; no approvals or OM actions |
        | Dept DRI | Scoped first review | Decision reason only | Submission, warehouse/carryover candidates, price exceptions | Scope rows, price exception summary, evidence | No OM quote/export, no global cost ownership |
        | Cost Manager | P&L/final authorization | Final authorization reason only | Dept DRI approved submissions | Cost Dashboard, Station Matrix, carryover/warehouse locked impact, workflow monitor | No demand creation, warehouse lock, OM quote/export, assignment, supplier/FTV operations |
        | OM Leader | OM operations lead | Assignment, exchange rate, feedback triage | None for business approvals | All OM rows, assignments, feedback board, exchange-rate state | Not a hidden business approver; no requester demand edits |
        | OM Purchasing | Assigned OM operator | PAS Demand No, quote result, quote screenshot/image, quote Excel, valid until, export package | Reject to Requester/Dept DRI with reason | Assigned rows and required context | Cannot operate unassigned rows, assign rows, maintain exchange rate, or approve business decisions |
        | Budget Approver | Final exception approver | Decision reason only | Price/budget exceptions after Dept DRI | Delta, threshold, Temporary Budget quote result, demand context | No normal submission approval, no OM operation |
        | Admin | Setup/governance | Users, roles, mappings, thresholds, approval chain, OM setup | No business approvals | Audit, feedback setup, access setup | Must not silently approve business rows or impersonate without audit |
        | Buyer Handoff | Post-export PR/PO owner | Future PR/PO/progress updates | Future Buyer stage decisions only | Exported packages and handoff status | Does not affect requester approval, OM quote, warehouse/carryover |

        ## Server Authorization Rules

        - Server session role is authoritative.
        - Frontend role dropdown is not trusted for UAT/production authorization.
        - Admin impersonation, if retained, must write an audit event.
        - Requester visibility must be enforced by API and not only by hidden frontend columns.

        ## Field Visibility Rules

        Requester must not receive or display:

        - vendor
        - supplier
        - vendor part number
        - PAS material number
        - factory material number
        - OM assignee
        - FTV code
        - OM-owned private attachment details

        OM/internal roles may view procurement internals according to assignment and leader/admin permissions.
        """,
        "02-it-handoff-en/03-data-flow-and-closed-loop.md": """
        # Data Flow And Closed Loop

        ## Architecture

        ```text
        Browser frontend -> Node.js API -> MySQL
        ```

        The browser must never connect directly to MySQL.

        ## Canonical Workflow Data

        The target system must preserve these canonical fields across frontend, API, DB, audit, and reports:

        - quantity
        - phase
        - MFG station or Non-MFG demand unit
        - currency
        - canonical price
        - quote price
        - carryover status
        - approval status
        - current workflow owner
        - current workflow stage
        - stage start date and days pending

        ## Workflow Status Model

        Every role status table should derive from one model:

        - pendingOwner
        - currentStage
        - submittedAt
        - receivedAt
        - stageStartAt
        - daysPending
        - nextAction
        - riskReason
        - timelineMilestones
        - visibilityFlags

        ## Closed-Loop Requirement

        No business action may leave a row without a next owner.

        Examples:

        - Reject creates reason + previous stage + next owner.
        - Amendment keeps previous quote as reference but not active quote.
        - Budget Approver reject returns to Requester Action Required.
        - OM export creates Buyer Handoff owner and timestamp.
        - Warehouse/carryover pending candidate remains evidence until Dept DRI locks it.

        ## Attachment Flow

        Attachment v1 uses local file storage plus DB metadata:

        - file id
        - linked entity type/id
        - original file name
        - stored file path or storage key
        - MIME type
        - size
        - uploaded by
        - uploaded at
        - uploaded role
        - visibility scope

        Download API must enforce role visibility.
        """,
        "02-it-handoff-en/04-api-and-backend-boundaries.md": """
        # API And Backend Boundaries

        ## Current Implemented API

        | Method | Endpoint | Status | Purpose |
        | --- | --- | --- | --- |
        | GET | `/api/health` | implemented | Health check; returns backend DB mode. |
        | POST | `/api/login` | implemented | Login with server-authoritative role/session. |
        | POST | `/api/logout` | implemented | Revoke session. |
        | GET | `/api/me` | implemented | Return current user without password hash. |
        | POST | `/api/attachments` | implemented | Authenticated multipart upload with local file retention and metadata. |
        | GET | `/api/attachments/:id` | implemented | Authenticated download with visibility guard. |
        | POST | `/api/uat-feedback` | implemented | Submit UAT feedback. |
        | GET | `/api/uat-feedback/my` | implemented | Read own UAT feedback. |
        | GET | `/api/uat-feedback` | implemented | OM Leader/Admin triage board. |
        | PATCH | `/api/uat-feedback/:id/status` | implemented | OM Leader/Admin update status. |
        | PATCH | `/api/uat-feedback/:id/owner` | implemented | OM Leader/Admin assign feedback owner. |
        | GET | `/api/om/assignees` | implemented | OM-visible assignee list. |
        | GET | `/api/om/assignments` | implemented | OM-visible assignment list. |
        | POST | `/api/om/requests/:requestId/assign` | implemented | OM Leader/Admin assignment update. |

        ## Current Frontend API Hydration

        Current API-backed areas:

        - auth/session
        - UAT feedback
        - OM assignment
        - attachment upload/download for selected evidence surfaces

        Current frontend/in-memory areas:

        - request package workflow
        - demand rows
        - approvals
        - OM PAS Demand No and quote workflow state
        - Requester confirmation/amendment
        - OM export workflow
        - Buyer Handoff progress
        - persisted warehouse/carryover workflow

        ## Target Workflow API Roadmap

        Recommended endpoint groups:

        - Requester:
          - `GET /api/requests`
          - `POST /api/requests`
          - `PATCH /api/requests/:id`
          - `POST /api/requests/:id/submit`
          - `POST /api/requests/:id/quote-confirm`
          - `POST /api/requests/:id/quote-cancel`
          - `POST /api/requests/:id/amendment-request`
        - Dept DRI:
          - `POST /api/dept-dri/requests/:id/approve`
          - `POST /api/dept-dri/requests/:id/reject`
          - `POST /api/dept-dri/stock-candidates/:id/lock`
          - `POST /api/dept-dri/stock-candidates/:id/reject`
          - `POST /api/dept-dri/price-exceptions/:id/approve`
          - `POST /api/dept-dri/price-exceptions/:id/reject`
        - Cost Manager:
          - `GET /api/cost-manager/submission-monitor`
          - `GET /api/cost-manager/cost-dashboard`
          - `GET /api/cost-manager/station-matrix`
          - `POST /api/cost-manager/requests/:id/authorize`
          - `POST /api/cost-manager/requests/:id/reject`
        - OM:
          - `POST /api/om/requests/:id/pas-demand-no`
          - `POST /api/om/requests/:id/quote`
          - `POST /api/om/requests/:id/send-to-requester`
          - `POST /api/om/requests/:id/export`
          - `POST /api/om/requests/:id/reject`
        - Budget Approver:
          - `POST /api/budget-approver/exceptions/:id/approve`
          - `POST /api/budget-approver/exceptions/:id/reject`
        - Buyer Handoff:
          - `GET /api/buyer-handoff/packages`
          - `POST /api/buyer-handoff/packages/:id/progress`
        - Audit:
          - `GET /api/requests/:id/audit-events`
          - `GET /api/admin/audit-export`

        ## Transaction Rule

        Every workflow mutation should write business data and audit event in one transaction.
        """,
        "02-it-handoff-en/05-database-current-and-target.md": """
        # Database Current And Target

        ## Current Tables

        Current `db/schema.sql` includes:

        | Table | Current Purpose |
        | --- | --- |
        | `users` | UAT users, role, scope metadata, password hash. |
        | `sessions` | Session token hashes, expiry, revocation. |
        | `om_assignments` | Current OM row assignment by request id. |
        | `uat_feedback` | UAT feedback rows and triage owner/status. |
        | `attachments` | Attachment metadata for local file retention. |
        | `audit_events` | Append-only audit events. |
        | `item_master` | Normalized item/spec identity support. |
        | `material_identity` | Internal/external material identity layer. |
        | `purchase_route_decisions` | OM route decision support: local buy / external import and quote owner. |
        | `ftv_code_master` | Active FTV mapping by item/material and demand department. |
        | `ftv_mapping_staging` | Legacy FTV import review staging. |
        | `customs_audit_records` | Export-time immutable customs/audit snapshot. |

        ## Target Workflow Tables

        These tables are target roadmap, not fully implemented yet:

        | Target Table | Owner / Meaning |
        | --- | --- |
        | `request_packages` | Requester package-level submit group. |
        | `request_items` | Item/spec/request-line identity. |
        | `request_demand_lines` | Long-form demand rows: demand type, phase, station/unit, qty, remark. |
        | `approvals` | Dept DRI, Cost Manager, Budget Approver decision ledger. |
        | `price_decisions` | Auto-clear/escalation decision, USD delta, threshold, reason. |
        | `pas_quotes` | PAS Demand No, PAS Material No, vendor, quote price, quote date, valid until. |
        | `exchange_rates` | OM Leader maintained USD/VND rates. |
        | `exports` | OM package code, cost type, CFA/ECS target, export timestamp/status. |
        | `buyer_handoff_events` | Buyer received, PR/PO/progress/evidence timeline. |
        | `warehouse_inventory_transactions` | Stock In, Use Candidate, Locked Use, Rejected with source/target trace. |
        | `carryover_ledger` | Requester candidate, Dept DRI applied/rejected ledger, effective quantity. |
        | `requester_mappings` | Project Family + Project Code + Demand Department -> Requester / Dept DRI scope. |

        ## DB Design Rules

        - Keep UAT DB and test DB separate.
        - Add ordered migrations before workflow persistence.
        - Do not use `mva_procurement_uat` for automated DB integration tests.
        - Server computes stageStartAt/daysPending consistently.
        - Requester visibility must be enforced at query/API level.
        - Workflow state transitions must record audit events.
        - Attachment metadata links to workflow-owned entities after target tables exist.
        """,
        "02-it-handoff-en/06-containerized-deployment.md": """
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
        """,
        "05-qa/container-verification.md": """
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
        curl -i -sS -X POST http://127.0.0.1:8080/api/login \\
          -H 'Content-Type: application/json' \\
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
        """,
        "05-qa/uat-acceptance-scenarios.md": """
        # UAT Acceptance Scenarios

        ## Business Workflow

        - Requester creates MFG and Non-MFG demand rows with Need Date.
        - Requester submits package to Dept DRI.
        - Dept DRI approve sends row to Cost Manager.
        - Dept DRI reject sends row to Requester Action Required with reason.
        - Cost Manager approve sends row to OM Leader intake.
        - Cost Manager reject sends row to Requester Action Required with reason.
        - OM Leader assigns row to Giang/Linh/Mai.
        - OM Purchasing can operate only assigned rows.
        - OM Purchasing records PAS Demand No.
        - OM Purchasing records quote screenshot/image, quote Excel, quote price, quote valid until.
        - Quote price `10.00 -> 10.40` auto clears.
        - Quote price `10.00 -> 10.41` routes Dept DRI -> Budget Approver.
        - Temporary Budget quote always routes Dept DRI -> Budget Approver.
        - Budget Approver approve moves row to OM Export Package.
        - Budget Approver reject returns to Requester Action Required.
        - OM Export Package creates Buyer Handoff owner/stage.

        ## Permissions

        - Requester cannot see vendor, supplier, PAS material, factory material, OM assignee, or FTV.
        - OM Member cannot assign rows.
        - OM Leader can assign/reassign/clear.
        - Admin can configure, but does not silently perform business approval.
        - Requester cannot download OM-internal attachments.

        ## Data Flow

        - Every workflow mutation writes an audit event.
        - Reject keeps previous stage, reason, actor, timestamp, and next owner.
        - Warehouse pending candidate does not reduce cost.
        - Dept DRI locked warehouse/carryover event updates effective cost.
        - Buyer Handoff days are distinct from OM days pending.
        """,
    }


def container_files() -> dict[str, str]:
    return {
        "06-container/Dockerfile": """
        FROM node:24-bookworm-slim

        WORKDIR /app

        ENV NODE_ENV=uat
        ENV PORT=8080
        ENV UPLOAD_ROOT=/var/lib/mva-procurement/uploads

        COPY package*.json ./
        RUN npm ci --omit=dev

        COPY . .

        RUN mkdir -p /var/lib/mva-procurement/uploads

        EXPOSE 8080

        HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \\
          CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

        CMD ["node", "server.js"]
        """,
        "06-container/docker-compose.yml": """
        services:
          mysql:
            image: mysql:9.0
            container_name: mva-procurement-mysql
            restart: unless-stopped
            environment:
              MYSQL_DATABASE: ${DB_NAME:-mva_procurement_uat}
              MYSQL_USER: ${DB_USER:-mva_uat_app}
              MYSQL_PASSWORD: ${DB_PASSWORD:-change-me}
              MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-change-root-me}
            volumes:
              - mva_mysql_data:/var/lib/mysql
              - ../04-db/schema-current.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
              - ../04-db/seed-uat-users.sql:/docker-entrypoint-initdb.d/02-seed-uat-users.sql:ro
            healthcheck:
              test: ["CMD-SHELL", "mysqladmin ping -h 127.0.0.1 -u$${MYSQL_USER} -p$${MYSQL_PASSWORD} --silent"]
              interval: 20s
              timeout: 5s
              retries: 10

          app:
            build:
              context: ../01-source/procurement-prototype
              dockerfile: ../../06-container/Dockerfile
            container_name: mva-procurement-app
            restart: unless-stopped
            depends_on:
              mysql:
                condition: service_healthy
            env_file:
              - .env
            environment:
              DB_HOST: mysql
              DB_PORT: 3306
              DB_NAME: ${DB_NAME:-mva_procurement_uat}
              DB_USER: ${DB_USER:-mva_uat_app}
              DB_PASSWORD: ${DB_PASSWORD:-change-me}
              UPLOAD_ROOT: /var/lib/mva-procurement/uploads
            ports:
              - "${PORT:-8080}:8080"
            volumes:
              - mva_uploads:/var/lib/mva-procurement/uploads
            healthcheck:
              test: ["CMD-SHELL", "node -e \\"fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))\\""]
              interval: 30s
              timeout: 5s
              retries: 5

        volumes:
          mva_mysql_data:
          mva_uploads:
        """,
        "06-container/docker-compose.external-mysql.yml": """
        services:
          app:
            build:
              context: ../01-source/procurement-prototype
              dockerfile: ../../06-container/Dockerfile
            container_name: mva-procurement-app
            restart: unless-stopped
            env_file:
              - .env
            environment:
              DB_HOST: ${DB_HOST:-host.docker.internal}
              DB_PORT: ${DB_PORT:-3306}
              DB_NAME: ${DB_NAME:-mva_procurement_uat}
              DB_USER: ${DB_USER:-mva_uat_app}
              DB_PASSWORD: ${DB_PASSWORD:-change-me}
              UPLOAD_ROOT: /var/lib/mva-procurement/uploads
            ports:
              - "${PORT:-8080}:8080"
            volumes:
              - mva_uploads:/var/lib/mva-procurement/uploads
            healthcheck:
              test: ["CMD-SHELL", "node -e \\"fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))\\""]
              interval: 30s
              timeout: 5s
              retries: 5

        volumes:
          mva_uploads:
        """,
        "06-container/.env.example": """
        NODE_ENV=uat
        PORT=8080

        DB_HOST=mysql
        DB_PORT=3306
        DB_NAME=mva_procurement_uat
        DB_USER=mva_uat_app
        DB_PASSWORD=CHANGE_THIS_PASSWORD
        MYSQL_ROOT_PASSWORD=CHANGE_THIS_ROOT_PASSWORD

        SESSION_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
        SESSION_TTL_HOURS=12
        UPLOAD_ROOT=/var/lib/mva-procurement/uploads
        MAX_UPLOAD_BYTES=26214400
        """,
        "06-container/README.md": """
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
        """,
    }


DIAGRAMS = {
    "01-context-dfd": {
        "title": "Context DFD",
        "subtitle": "Browser -> Node API -> MySQL, with role-owned workflow actions and audit",
        "mermaid": """
        %% Primary IT visual: use the generated swimlane-style PNG next to this source.
        %% This Mermaid source preserves logical traceability, while the PNG provides the handoff-ready DFD notation.
        flowchart LR
          Browser["Browser UI\\nrole-specific screens"]
          API["Node.js API\\nserver session + role authorization"]
          DB[("MySQL\\nshared UAT database")]
          Uploads[("Local upload volume\\nattachment files")]
          Audit[("audit_events\\nappend-only trail")]
          Requester["Requester"]
          Dept["Dept DRI"]
          Cost["Cost Manager"]
          OMLead["OM Leader"]
          OMP["OM Purchasing"]
          Budget["Budget Approver"]
          Buyer["Buyer Handoff"]
          Admin["Admin"]
          Browser --> API --> DB
          API --> Uploads
          API --> Audit
          Requester --> Browser
          Dept --> Browser
          Cost --> Browser
          OMLead --> Browser
          OMP --> Browser
          Budget --> Browser
          Buyer --> Browser
          Admin --> Browser
        """,
        "boxes": [
            ("Requester", 60, 160, "#dbeafe"), ("Dept DRI", 60, 310, "#fef3c7"), ("Cost Manager", 60, 460, "#dcfce7"),
            ("Browser UI", 430, 310, "#e0f2fe"), ("Node.js API\\nsession + role auth", 800, 310, "#e9d5ff"),
            ("MySQL DB", 1180, 240, "#ede9fe"), ("Local Uploads", 1180, 430, "#f3f4f6"),
            ("audit_events", 1520, 310, "#fee2e2"), ("OM Leader", 430, 90, "#ffedd5"),
            ("OM Purchasing", 800, 90, "#ffedd5"), ("Budget Approver", 1180, 90, "#fef3c7"),
            ("Buyer Handoff", 1520, 90, "#e5e7eb"), ("Admin", 1520, 520, "#f3f4f6"),
        ],
        "arrows": [(0, 3), (1, 3), (2, 3), (3, 4), (4, 5), (4, 6), (4, 7), (8, 3), (9, 3), (10, 3), (11, 3), (12, 3)],
    },
    "02-level1-cross-role-dfd": {
        "title": "Level 1 Cross-role DFD",
        "subtitle": "Demand to approval to OM execution to Buyer Handoff",
        "mermaid": """
        %% Primary IT visual: use the generated swimlane-style PNG next to this source.
        %% This Mermaid source preserves logical traceability, while the PNG provides the handoff-ready DFD notation.
        flowchart LR
          R["Requester\\ncreate demand + submit"] --> D["Dept DRI\\nscoped review"]
          D -->|approve| C["Cost Manager\\nfinal authorization"]
          D -->|reject + reason| RA["Requester Action Required"]
          C -->|approve| L["OM Leader\\nassignment"]
          C -->|reject + reason| RA
          L --> O["OM Purchasing\\nPAS + quote + export"]
          O -->|price exception| P["Dept DRI price review"]
          P --> B["Budget Approver"]
          B -->|approve| OX["OM Export Package"]
          B -->|reject + reason| RA
          O -->|auto cleared| OX
          OX --> BH["Buyer Handoff\\nPR/PO owner"]
          RA --> R
        """,
        "boxes": [
            ("Requester\\nDemand", 60, 330, "#dbeafe"), ("Dept DRI\\nReview", 340, 330, "#fef3c7"),
            ("Cost Manager\\nFinal Auth", 620, 330, "#dcfce7"), ("OM Leader\\nAssign", 900, 330, "#ffedd5"),
            ("OM Purchasing\\nPAS/Quote", 1180, 330, "#ffedd5"), ("OM Export\\nCFA/ECS", 1460, 330, "#ffedd5"),
            ("Buyer Handoff\\nPR/PO", 1740, 330, "#e5e7eb"), ("Requester\\nAction Required", 620, 560, "#fee2e2"),
            ("Dept DRI\\nPrice Review", 1180, 560, "#fef3c7"), ("Budget Approver", 1460, 560, "#fef3c7"),
        ],
        "arrows": [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(1,7),(2,7),(7,0),(4,8),(8,9),(9,5),(9,7)],
    },
    "03-closed-loop-dfd": {
        "title": "Closed-loop Reject And Amendment DFD",
        "subtitle": "Every rejection or amendment returns to a named owner with audit",
        "mermaid": """
        %% Primary IT visual: use the generated swimlane-style PNG next to this source.
        %% This Mermaid source preserves logical traceability, while the PNG provides the handoff-ready DFD notation.
        flowchart LR
          R["Requester"] -->|submit / resubmit| D["Dept DRI"]
          D -->|approve| C["Cost Manager"]
          D -->|reject + reason| RA["Requester Action Required"]
          C -->|approve| O["OM Purchasing"]
          C -->|reject + reason| RA
          O -->|reject / request correction| RA
          O -->|quote saved: exception| PD["Dept DRI Price Review"]
          PD -->|approve| BA["Budget Approver"]
          PD -->|reject + reason| RA
          BA -->|approve| O
          BA -->|reject + reason| RA
          R -->|post-quote amendment| O
          O -->|revised result| R
          RA --> R
          O --> A[("audit_events")]
          D --> A
          C --> A
          BA --> A
        """,
        "boxes": [
            ("Requester", 80, 270, "#dbeafe"), ("Dept DRI", 360, 270, "#fef3c7"), ("Cost Manager", 640, 270, "#dcfce7"),
            ("OM Purchasing", 920, 270, "#ffedd5"), ("Dept DRI\\nPrice Review", 920, 520, "#fef3c7"),
            ("Budget Approver", 1200, 520, "#fef3c7"), ("Requester\\nAction Required", 360, 520, "#fee2e2"),
            ("audit_events", 1480, 370, "#f3f4f6"),
        ],
        "arrows": [(0,1),(1,2),(2,3),(1,6),(2,6),(3,6),(6,0),(3,4),(4,5),(5,3),(4,6),(5,6),(3,7),(1,7),(2,7),(5,7)],
    },
    "04-data-store-audit-dfd": {
        "title": "Data Store And Audit DFD",
        "subtitle": "Current tables plus target workflow persistence boundary",
        "mermaid": """
        %% Primary IT visual: use the generated swimlane-style PNG next to this source.
        %% This Mermaid source preserves logical traceability, while the PNG provides the handoff-ready DFD notation.
        flowchart TB
          API["Node.js API"] --> USERS[("users / sessions")]
          API --> ASSIGN[("om_assignments")]
          API --> FEEDBACK[("uat_feedback")]
          API --> ATTACH[("attachments")]
          API --> AUDIT[("audit_events")]
          API -. target .-> REQ[("request_packages / request_items / demand_lines")]
          API -. target .-> APPROVALS[("approvals / price_decisions")]
          API -. target .-> QUOTES[("pas_quotes / exports / buyer_handoff_events")]
          API --> ITEM[("item_master / material_identity")]
          API --> FTV[("purchase_route / ftv / customs audit")]
          ATTACH --> AUDIT
          REQ --> APPROVALS --> QUOTES
          QUOTES --> AUDIT
        """,
        "boxes": [
            ("Node.js API", 120, 360, "#e9d5ff"), ("users\\nsessions", 500, 80, "#ede9fe"), ("om_assignments", 500, 230, "#ede9fe"),
            ("uat_feedback", 500, 380, "#ede9fe"), ("attachments", 500, 530, "#ede9fe"), ("audit_events", 880, 530, "#fee2e2"),
            ("TARGET\\nrequest packages/items\\ndemand lines", 880, 80, "#f3f4f6"), ("TARGET\\napprovals + price decisions", 880, 230, "#f3f4f6"),
            ("TARGET\\npas quotes + exports\\nbuyer handoff", 880, 380, "#f3f4f6"), ("item/material\\nidentity", 1260, 230, "#ede9fe"),
            ("purchase route\\nFTV/customs", 1260, 380, "#ede9fe"),
        ],
        "arrows": [(0,1),(0,2),(0,3),(0,4),(4,5),(0,6),(6,7),(7,8),(8,5),(0,9),(0,10)],
    },
    "05-cross-role-swimlane": {
        "title": "Cross-role Swimlane",
        "subtitle": "Who owns each stage",
        "mermaid": """
        flowchart TB
          subgraph Requester
            R1["Create demand"] --> R2["Submit"] --> R3["Revise if rejected"]
          end
          subgraph Dept_DRI
            D1["Submission review"] --> D2["Price / stock / carryover review"]
          end
          subgraph Cost_Manager
            C1["Final authorization"] --> C2["Cost dashboard / station matrix"]
          end
          subgraph OM
            L1["Leader assignment"] --> O1["PAS Demand No"] --> O2["Quote Result"] --> O3["Export Package"]
          end
          subgraph Budget_Approver
            B1["Final exception approval"]
          end
          subgraph Buyer_Handoff
            H1["PR / PO owner after export"]
          end
          R2 --> D1 --> C1 --> L1
          O2 --> D2 --> B1 --> O3 --> H1
          D1 --> R3
          C1 --> R3
          B1 --> R3
        """,
        "boxes": [
            ("Requester\\nCreate demand", 80, 120, "#dbeafe"), ("Dept DRI\\nSubmission review", 360, 120, "#fef3c7"),
            ("Cost Manager\\nFinal auth", 640, 120, "#dcfce7"), ("OM Leader\\nAssign", 920, 120, "#ffedd5"),
            ("OM Purchasing\\nPAS Demand No", 1200, 120, "#ffedd5"), ("OM Purchasing\\nQuote Result", 1480, 120, "#ffedd5"),
            ("Dept DRI\\nPrice/stock review", 1480, 360, "#fef3c7"), ("Budget Approver", 1200, 360, "#fef3c7"),
            ("OM Export Package", 920, 360, "#ffedd5"), ("Buyer Handoff", 640, 360, "#e5e7eb"), ("Requester\\nRevise", 360, 360, "#fee2e2"),
        ],
        "arrows": [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(7,8),(8,9),(1,10),(2,10),(7,10),(10,1)],
    },
    "06-workflow-state-machine": {
        "title": "Workflow State Machine",
        "subtitle": "Business states and allowed transitions",
        "mermaid": """
        stateDiagram-v2
          [*] --> Draft
          Draft --> Submitted: Requester submit
          Submitted --> DeptDriApproved: Dept DRI approve
          Submitted --> RequesterActionRequired: Dept DRI reject
          DeptDriApproved --> CostManagerAuthorized: Cost Manager approve
          DeptDriApproved --> RequesterActionRequired: Cost Manager reject
          CostManagerAuthorized --> OmAssigned: OM Leader assign
          OmAssigned --> PasDemandNoRecorded
          PasDemandNoRecorded --> QuoteSaved
          QuoteSaved --> AutoCleared: delta <= 0.40
          QuoteSaved --> PriceException: delta > 0.40 / no history / temp budget
          PriceException --> BudgetReview: Dept DRI approve
          PriceException --> RequesterActionRequired: Dept DRI reject
          BudgetReview --> ExportReady: Budget Approver approve
          BudgetReview --> RequesterActionRequired: Budget Approver reject
          AutoCleared --> ExportReady
          ExportReady --> Exported
          Exported --> BuyerHandoff
          RequesterActionRequired --> Submitted: revise/resubmit
        """,
        "boxes": [
            ("Draft", 80, 170, "#dbeafe"), ("Submitted", 300, 170, "#dbeafe"), ("Dept DRI\\nApproved", 520, 170, "#fef3c7"),
            ("Cost Manager\\nAuthorized", 740, 170, "#dcfce7"), ("OM Assigned", 960, 170, "#ffedd5"), ("PAS Demand No", 1180, 170, "#ffedd5"),
            ("Quote Saved", 1400, 170, "#ffedd5"), ("Auto Cleared", 1620, 80, "#dcfce7"), ("Price Exception", 1620, 280, "#fef3c7"),
            ("Budget Review", 1400, 500, "#fef3c7"), ("Export Ready", 1180, 500, "#ffedd5"), ("Exported", 960, 500, "#ffedd5"),
            ("Buyer Handoff", 740, 500, "#e5e7eb"), ("Requester\\nAction Required", 300, 500, "#fee2e2"),
        ],
        "arrows": [(0,1),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(6,8),(8,9),(9,10),(7,10),(10,11),(11,12),(1,13),(2,13),(8,13),(9,13),(13,1)],
    },
    "07-role-permission-matrix": {
        "title": "Role Permission Matrix",
        "subtitle": "Create, approve, operate, view-only, and hidden fields",
        "mermaid": """
        flowchart LR
          Requester --> CreateDemand
          DeptDRI --> ReviewSubmission
          CostManager --> FinalAuthorization
          OMLeader --> Assignment
          OMPurchasing --> AssignedRows
          BudgetApprover --> ExceptionApproval
          Admin --> SetupGovernance
          BuyerHandoff --> PRPOVisibility
          Requester -. hidden .-> InternalFields["vendor / PAS / factory / OM assignee / FTV"]
        """,
        "boxes": [
            ("Requester\\ncreate/revise only", 80, 120, "#dbeafe"), ("Dept DRI\\nscoped review", 80, 260, "#fef3c7"),
            ("Cost Manager\\nfinal auth + P&L view", 80, 400, "#dcfce7"), ("OM Leader\\nassign + rate + feedback", 520, 120, "#ffedd5"),
            ("OM Purchasing\\nassigned rows only", 520, 260, "#ffedd5"), ("Budget Approver\\nexception only", 520, 400, "#fef3c7"),
            ("Admin\\nsetup/governance", 960, 120, "#f3f4f6"), ("Buyer Handoff\\npost-export", 960, 260, "#e5e7eb"),
            ("Requester-hidden fields\\nvendor/PAS/factory/OM assignee/FTV", 960, 430, "#fee2e2"),
        ],
        "arrows": [(0,8),(3,4),(6,8)],
    },
    "08-api-db-architecture": {
        "title": "API / DB Architecture",
        "subtitle": "Container or native Mac mini, same Browser -> API -> DB boundary",
        "mermaid": """
        flowchart LR
          User["Internal user browser"] --> App["Node app container\\nstatic + API"]
          App --> MySQL[("MySQL container or external MySQL")]
          App --> Uploads[("Upload volume")]
          App --> Audit[("audit_events")]
          MySQL --> Vol[("mysql data volume")]
          Uploads --> UVol[("upload data volume")]
        """,
        "boxes": [
            ("Internal Browser", 80, 280, "#dbeafe"), ("Node App\\nstatic + API", 430, 280, "#e9d5ff"),
            ("MySQL\\ncontainer/external", 800, 160, "#ede9fe"), ("Upload Volume", 800, 400, "#f3f4f6"),
            ("audit_events", 1160, 280, "#fee2e2"), ("mysql data volume", 1160, 160, "#ede9fe"),
            ("upload data volume", 1160, 400, "#f3f4f6"),
        ],
        "arrows": [(0,1),(1,2),(1,3),(1,4),(2,5),(3,6)],
    },
    "09-erd-db-logic-map": {
        "title": "ERD / DB Logic Map",
        "subtitle": "Current tables and target workflow table families",
        "mermaid": """
        erDiagram
          users ||--o{ sessions : owns
          users ||--o{ om_assignments : assigns
          users ||--o{ uat_feedback : submits
          users ||--o{ attachments : uploads
          item_master ||--o{ material_identity : has
          item_master ||--o{ ftv_code_master : maps
          material_identity ||--o{ ftv_code_master : maps
          request_packages ||--o{ request_items : target
          request_items ||--o{ request_demand_lines : contains
          request_items ||--o{ approvals : reviewed_by
          request_items ||--o{ pas_quotes : quoted_by
          pas_quotes ||--o{ exports : exported_as
          exports ||--o{ buyer_handoff_events : received_by
        """,
        "boxes": [
            ("CURRENT\\nusers/sessions", 80, 120, "#ede9fe"), ("CURRENT\\nom_assignments", 360, 120, "#ede9fe"),
            ("CURRENT\\nuat_feedback", 640, 120, "#ede9fe"), ("CURRENT\\nattachments", 920, 120, "#ede9fe"),
            ("CURRENT\\nitem/material", 1200, 120, "#ede9fe"), ("CURRENT\\nFTV/customs", 1480, 120, "#ede9fe"),
            ("TARGET\\nrequest_packages", 80, 380, "#f3f4f6"), ("TARGET\\nrequest_items", 360, 380, "#f3f4f6"),
            ("TARGET\\ndemand_lines", 640, 380, "#f3f4f6"), ("TARGET\\napprovals", 920, 380, "#f3f4f6"),
            ("TARGET\\npas_quotes", 1200, 380, "#f3f4f6"), ("TARGET\\nexports + buyer", 1480, 380, "#f3f4f6"),
        ],
        "arrows": [(0,1),(0,2),(0,3),(4,5),(6,7),(7,8),(7,9),(7,10),(10,11)],
    },
    "10-container-deployment": {
        "title": "Container Deployment Diagram",
        "subtitle": "Recommended Docker Compose UAT topology",
        "mermaid": """
        flowchart TB
          Browser["LAN browsers"] --> Port["Mac mini :8080"]
          Port --> App["mva-procurement-app\\nNode 24"]
          App --> DB["mva-procurement-mysql\\nMySQL"]
          App --> Uploads[("mva_uploads")]
          DB --> DBVol[("mva_mysql_data")]
          App --> Health["/api/health"]
          App -. optional .-> ExtDB["External MySQL\\nhost.docker.internal"]
        """,
        "boxes": [
            ("LAN Browsers", 80, 260, "#dbeafe"), ("Mac mini\\nport 8080", 380, 260, "#e0f2fe"),
            ("App Container\\nNode 24", 700, 260, "#e9d5ff"), ("MySQL Container", 1040, 160, "#ede9fe"),
            ("mva_mysql_data\\nvolume", 1380, 160, "#ede9fe"), ("mva_uploads\\nvolume", 1040, 420, "#f3f4f6"),
            ("/api/health", 1380, 300, "#dcfce7"), ("Optional external MySQL", 1380, 460, "#fef3c7"),
        ],
        "arrows": [(0,1),(1,2),(2,3),(3,4),(2,5),(2,6),(2,7)],
    },
}


DFD_RENDER_SPECS = {
    "01-context-dfd": {
        "width": 2600,
        "height": 1450,
        "lanes": ["Business roles", "Browser UI", "Node API", "MySQL", "Upload volume", "Audit log", "Buyer boundary", "Admin setup"],
        "bands": [
            ("Access channel", 260, 455),
            ("Current implemented data flow", 455, 760),
            ("Evidence and audit", 760, 1080),
            ("Downstream boundary", 1080, 1280),
        ],
        "nodes": [
            ("roles", 0, 350, "Requester / Dept DRI / Cost Manager / OM / Budget", "process"),
            ("browser", 1, 350, "Role-specific browser screens", "process"),
            ("api", 2, 350, "Node.js API\nsession + role authorization", "process"),
            ("db", 3, 350, "MySQL\nusers, sessions, assignments, feedback", "database"),
            ("upload", 4, 610, "Local upload volume\nattachment files", "database"),
            ("audit", 5, 610, "audit_events\nappend-only trail", "database"),
            ("buyer", 6, 1040, "Buyer Handoff package\nPR / PO starts after OM export", "document"),
            ("admin", 7, 350, "Admin setup\nusers, roles, governance", "process"),
            ("guard", 2, 900, "API visibility guard\nRequester cannot receive OM internals", "decision"),
        ],
        "flows": [
            ("roles", "browser", "1. use app"),
            ("browser", "api", "2. JSON / multipart API"),
            ("api", "db", "3. DB read/write"),
            ("api", "upload", "4. store files", [(1058, 500), (1408, 500), (1408, 610)]),
            ("api", "audit", "5. audit events", [(1058, 500), (1698, 500), (1698, 610)]),
            ("api", "guard", "6. filter fields"),
            ("guard", "browser", "7. safe response", [(942, 760), (653, 760), (653, 403)]),
            ("api", "buyer", "8. export handoff", [(1058, 520), (2097, 520), (2097, 984)]),
            ("admin", "api", "9. setup only", [(2270, 260), (1058, 260), (1058, 350)]),
        ],
    },
    "02-level1-cross-role-dfd": {
        "width": 2850,
        "height": 1700,
        "lanes": ["Requester", "Dept DRI", "Cost Manager", "OM Leader", "OM Purchasing", "Budget Approver", "Buyer Handoff", "Audit"],
        "bands": [
            ("Demand package", 260, 485),
            ("Submission approval", 485, 760),
            ("OM execution", 760, 1040),
            ("Exception approval", 1040, 1300),
            ("Export and closed loop", 1300, 1500),
        ],
        "nodes": [
            ("create", 0, 360, "Create demand\nMFG / Non-MFG", "document"),
            ("submit", 0, 585, "Submit package", "process"),
            ("dept_review", 1, 585, "Scoped review?", "decision"),
            ("cost_auth", 2, 585, "Final authorization?", "decision"),
            ("assign", 3, 585, "Assign OM owner", "process"),
            ("pas_quote", 4, 850, "PAS Demand No\nquote result", "process"),
            ("price_check", 4, 1110, "Price exception?", "decision"),
            ("budget", 5, 1110, "Budget exception\napproved?", "decision"),
            ("export", 4, 1375, "OM Export Package\nCFA / ECS", "document"),
            ("buyer", 6, 1375, "Buyer Handoff\nPR / PO owner", "document"),
            ("revise", 0, 1375, "Requester Action Required\nrevise / resubmit", "process"),
            ("audit", 7, 980, "audit_events\nstage, actor, reason", "database"),
        ],
        "flows": [
            ("create", "submit", "1. complete demand"),
            ("submit", "dept_review", "2. submit"),
            ("dept_review", "cost_auth", "3. approve"),
            ("cost_auth", "assign", "4. approve"),
            ("assign", "pas_quote", "5. assign"),
            ("pas_quote", "price_check", "6. save quote"),
            ("price_check", "export", "7a. auto clear"),
            ("price_check", "budget", "7b. exception"),
            ("budget", "export", "8a. approve"),
            ("export", "buyer", "9. handoff"),
            ("dept_review", "revise", "R1. reject"),
            ("cost_auth", "revise", "R2. reject"),
            ("budget", "revise", "R3. reject"),
            ("revise", "submit", "R4. resubmit"),
            ("pas_quote", "audit", "A. audit"),
        ],
    },
    "03-closed-loop-dfd": {
        "width": 2750,
        "height": 1650,
        "lanes": ["Requester", "Dept DRI", "Cost Manager", "OM Purchasing", "Budget Approver", "Audit", "Workflow state"],
        "bands": [
            ("Normal submission", 260, 520),
            ("Approval decisions", 520, 810),
            ("Quote and exception", 810, 1110),
            ("Reject / amendment loop", 1110, 1390),
            ("Closure rule", 1390, 1480),
        ],
        "nodes": [
            ("submit", 0, 390, "Submit / resubmit\nrevised demand", "document"),
            ("dept", 1, 640, "Dept DRI\napprove?", "decision"),
            ("cost", 2, 640, "Cost Manager\nauthorize?", "decision"),
            ("quote", 3, 920, "OM quote result\nPAS + vendor evidence", "document"),
            ("price", 1, 920, "Dept DRI\nprice review?", "decision"),
            ("budget", 4, 920, "Budget Approver\nexception?", "decision"),
            ("action", 0, 1215, "Requester Action Required\nreason + owner", "process"),
            ("amend", 0, 920, "Post-quote amendment\nrequester response", "document"),
            ("audit", 5, 920, "audit_events\nactor, reason, timestamp", "database"),
            ("state", 6, 1215, "Next owner is mandatory\nno orphan status", "database"),
            ("export", 3, 1215, "Approved result\nreturns to OM export", "process"),
        ],
        "flows": [
            ("submit", "dept", "1. submit"),
            ("dept", "cost", "2a. approve"),
            ("cost", "quote", "3a. approve"),
            ("quote", "price", "4. exception path"),
            ("price", "budget", "5a. approve"),
            ("budget", "export", "6a. approve"),
            ("dept", "action", "2b. reject"),
            ("cost", "action", "3b. reject"),
            ("price", "action", "5b. reject"),
            ("budget", "action", "6b. reject"),
            ("action", "submit", "7. revise + resubmit"),
            ("amend", "quote", "8. amendment"),
            ("quote", "amend", "9. revised result"),
            ("budget", "audit", "A. audit"),
            ("action", "state", "C. next owner"),
        ],
    },
    "04-data-store-audit-dfd": {
        "width": 2750,
        "height": 1600,
        "lanes": ["Browser", "Node API", "Current MySQL", "File storage", "Target workflow DB", "Financial / OM DB", "Audit"],
        "bands": [
            ("Implemented today", 260, 640),
            ("Attachment evidence", 640, 900),
            ("Target persistence roadmap", 900, 1260),
            ("Audit requirement", 1260, 1420),
        ],
        "nodes": [
            ("browser", 0, 430, "Browser actions\nauth, feedback, OM assignment, upload", "process"),
            ("api", 1, 430, "Node.js API\nserver-side authorization", "process"),
            ("current", 2, 350, "Current MySQL\nusers / sessions\nom_assignments / uat_feedback", "database"),
            ("attachments", 2, 720, "attachments\nmetadata", "database"),
            ("files", 3, 720, "Upload volume\nretained files", "database"),
            ("workflow", 4, 1050, "TARGET\nrequest packages / items / demand lines", "database"),
            ("approvals", 5, 1050, "TARGET\napprovals / price decisions / quotes / exports", "database"),
            ("audit", 6, 720, "audit_events\nappend-only", "database"),
            ("guard", 1, 720, "Visibility guard\nrole + entity scope", "decision"),
            ("txn", 6, 1320, "Workflow mutation writes\nbusiness data + audit in one transaction", "process"),
        ],
        "flows": [
            ("browser", "api", "1. API request"),
            ("api", "current", "2. implemented tables"),
            ("api", "guard", "3. authorize"),
            ("guard", "attachments", "4. metadata"),
            ("guard", "files", "5. file write/read"),
            ("api", "workflow", "6. target", [(862, 890), (1802, 890), (1802, 984)]),
            ("workflow", "approvals", "7. target flow"),
            ("api", "audit", "8. audit", [(862, 600), (2384, 600), (2384, 720)]),
            ("attachments", "audit", "9. evidence audit"),
            ("workflow", "txn", "10. transaction"),
            ("approvals", "txn", "11. transaction"),
        ],
    },
}


def write_diagrams() -> None:
    diagram_dir = PACKAGE / "03-diagrams"
    for name, info in DIAGRAMS.items():
        write(diagram_dir / f"{name}.mmd", info["mermaid"])
        render_png(diagram_dir / f"{name}.png", info)


def font(size: int):
    if not ImageFont:
        return None
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def render_png(path: Path, info: dict) -> None:
    if Image is None:
        write(path.with_suffix(".svg"), svg_fallback(info))
        return
    if path.stem in DFD_RENDER_SPECS:
        render_swimlane_dfd(path, info, DFD_RENDER_SPECS[path.stem])
        return
    width, height = 1900, 760
    img = Image.new("RGB", (width, height), "#f8fafc")
    draw = ImageDraw.Draw(img)
    f_title = font(38)
    f_sub = font(20)
    f_box = font(18)
    f_small = font(14)
    draw.text((50, 32), info["title"], fill="#0f172a", font=f_title)
    draw.text((52, 82), info["subtitle"], fill="#475569", font=f_sub)
    boxes = info["boxes"]
    centers = []
    for label, x, y, color in boxes:
        x2, y2 = x + 210, y + 92
        draw.rounded_rectangle((x, y, x2, y2), radius=12, fill=color, outline="#64748b", width=2)
        lines = []
        for raw in label.split("\\n"):
            lines.extend(textwrap.wrap(raw, 18) or [""])
        total_h = len(lines) * 19
        ty = y + (92 - total_h) / 2
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=f_box)
            draw.text((x + (210 - (bbox[2] - bbox[0])) / 2, ty), line, fill="#0f172a", font=f_box)
            ty += 19
        centers.append((x + 105, y + 46))
    for left, right in info["arrows"]:
        if left >= len(centers) or right >= len(centers):
            continue
        arrow(draw, centers[left], centers[right])
    draw.text((50, height - 44), "English IT handoff visual. Mermaid source is included next to this PNG.", fill="#64748b", font=f_small)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def render_swimlane_dfd(path: Path, info: dict, spec: dict) -> None:
    width, height = spec["width"], spec["height"]
    img = Image.new("RGB", (width, height), "#f8fafc")
    draw = ImageDraw.Draw(img)
    f_title = font(42)
    f_sub = font(22)
    f_note = font(16)
    f_lane = font(17)
    f_band = font(16)
    f_node = font(18)
    f_node_small = font(16)
    f_flow = font(15)

    left, top = 70, 190
    lane_label_w = 150
    header_h = 64
    grid_right = width - 70
    grid_bottom = height - 115
    grid_left = left + lane_label_w
    grid_top = top + header_h
    lane_w = (grid_right - grid_left) / len(spec["lanes"])

    draw.text((left, 32), info["title"], fill="#0f172a", font=f_title)
    draw.text((left + 2, 84), info["subtitle"], fill="#475569", font=f_sub)
    draw.text(
        (left + 2, 125),
        "Swimlane DFD PNG is the primary IT handoff visual; Mermaid source is included for traceability.",
        fill="#64748b",
        font=f_note,
    )

    draw.rounded_rectangle((left, top, grid_right, grid_bottom), radius=0, fill="#ffffff", outline="#94a3b8", width=2)
    draw.rectangle((left, top, grid_right, top + header_h), fill="#dbeafe", outline="#94a3b8", width=2)
    draw.rectangle((left, top, grid_left, grid_bottom), fill="#f1f5f9", outline="#94a3b8", width=2)

    for idx, lane in enumerate(spec["lanes"]):
        x = grid_left + idx * lane_w
        draw.line((x, top, x, grid_bottom), fill="#cbd5e1", width=2)
        center_text(draw, lane, (x + 8, top + 10, x + lane_w - 8, top + header_h - 8), f_lane, "#0f172a")
    draw.line((grid_right, top, grid_right, grid_bottom), fill="#cbd5e1", width=2)

    for label, y1, y2 in spec["bands"]:
        draw.line((left, y1, grid_right, y1), fill="#e2e8f0", width=2)
        center_text(draw, label, (left + 6, y1 + 8, grid_left - 8, y2 - 8), f_band, "#334155")
    draw.line((left, grid_bottom, grid_right, grid_bottom), fill="#94a3b8", width=2)

    node_positions = {}
    node_boxes = {}
    for node_id, lane_idx, cy, label, shape in spec["nodes"]:
        cx = grid_left + lane_w * lane_idx + lane_w / 2
        box = draw_dfd_node(draw, cx, cy, label, shape, f_node, f_node_small)
        node_positions[node_id] = (cx, cy)
        node_boxes[node_id] = box

    for flow in spec["flows"]:
        source, target, label = flow[:3]
        route = flow[3] if len(flow) > 3 else None
        draw_dfd_flow(draw, node_positions[source], node_positions[target], node_boxes[source], node_boxes[target], label, f_flow, route)

    # Redraw nodes after arrows so labels and boundaries remain crisp.
    for node_id, lane_idx, cy, label, shape in spec["nodes"]:
        cx = grid_left + lane_w * lane_idx + lane_w / 2
        draw_dfd_node(draw, cx, cy, label, shape, f_node, f_node_small)

    draw.text((left, height - 58), "English IT handoff visual. DFD scope only; non-DFD diagrams remain unchanged.", fill="#64748b", font=f_note)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def draw_dfd_node(draw, cx: float, cy: float, label: str, shape: str, f_node, f_small):
    fill = "#22d3ee"
    outline = "#0f766e"
    text_color = "#0f172a"
    if shape == "decision":
        w, h = 170, 126
        points = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
        draw.polygon(points, fill="#67e8f9", outline=outline)
        draw.line(points + [points[0]], fill=outline, width=3)
        bbox = (cx - w / 2 + 18, cy - h / 2 + 20, cx + w / 2 - 18, cy + h / 2 - 20)
        center_text(draw, label, bbox, f_small, text_color, wrap_chars=14)
        return (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
    if shape == "database":
        w, h = 240, 132
        x1, y1, x2, y2 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
        draw.rectangle((x1, y1 + 20, x2, y2 - 20), fill="#cffafe", outline=outline, width=3)
        draw.ellipse((x1, y1, x2, y1 + 40), fill="#a5f3fc", outline=outline, width=3)
        draw.arc((x1, y2 - 40, x2, y2), 0, 180, fill=outline, width=3)
        center_text(draw, label, (x1 + 14, y1 + 42, x2 - 14, y2 - 14), f_small, text_color, wrap_chars=18)
        return (x1, y1, x2, y2)
    if shape == "document":
        w, h = 230, 112
        x1, y1, x2, y2 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
        fold = 24
        draw.polygon(
            [(x1, y1), (x2 - fold, y1), (x2, y1 + fold), (x2, y2), (x1, y2)],
            fill="#bae6fd",
            outline=outline,
        )
        draw.line((x2 - fold, y1, x2 - fold, y1 + fold, x2, y1 + fold), fill=outline, width=2)
        draw.line((x1, y2 - 12, x1 + 58, y2 - 4, x1 + 116, y2 - 12, x1 + 174, y2 - 4, x2, y2 - 12), fill=outline, width=2)
        center_text(draw, label, (x1 + 16, y1 + 16, x2 - 16, y2 - 18), f_small, text_color, wrap_chars=18)
        return (x1, y1, x2, y2)

    w, h = 230, 106
    x1, y1, x2, y2 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
    draw.rounded_rectangle((x1, y1, x2, y2), radius=4, fill=fill, outline=outline, width=3)
    center_text(draw, label, (x1 + 14, y1 + 12, x2 - 14, y2 - 12), f_node, text_color, wrap_chars=18)
    return (x1, y1, x2, y2)


def draw_dfd_flow(draw, start, end, start_box, end_box, label: str, f_flow, route=None) -> None:
    sx, sy = edge_point(start, end, start_box)
    ex, ey = edge_point(end, start, end_box)
    color = "#1e293b"
    if route:
        points = [(sx, sy), *route, (ex, ey)]
    elif abs(ex - sx) > abs(ey - sy):
        mid_x = (sx + ex) / 2
        points = [(sx, sy), (mid_x, sy), (mid_x, ey), (ex, ey)]
    else:
        mid_y = (sy + ey) / 2
        points = [(sx, sy), (sx, mid_y), (ex, mid_y), (ex, ey)]

    for p1, p2 in zip(points, points[1:]):
        draw.line((*p1, *p2), fill=color, width=3)
    draw_arrowhead(draw, points[-2], points[-1], color)

    label_x, label_y = label_position(points)
    bbox = draw.textbbox((0, 0), label, font=f_flow)
    label_w = bbox[2] - bbox[0]
    draw.rounded_rectangle((label_x - 8, label_y - 11, label_x + label_w + 10, label_y + 18), radius=8, fill="#ffffff", outline="#cbd5e1", width=1)
    draw.text((label_x, label_y - 8), label, fill="#334155", font=f_flow)


def edge_point(center, other, box):
    cx, cy = center
    ox, oy = other
    x1, y1, x2, y2 = box
    dx, dy = ox - cx, oy - cy
    if abs(dx) >= abs(dy):
        return (x2 if dx >= 0 else x1, cy)
    return (cx, y2 if dy >= 0 else y1)


def draw_arrowhead(draw, p1, p2, color: str) -> None:
    sx, sy = p1
    ex, ey = p2
    if abs(ex - sx) >= abs(ey - sy):
        sign = 1 if ex >= sx else -1
        pts = [(ex, ey), (ex - 16 * sign, ey - 8), (ex - 16 * sign, ey + 8)]
    else:
        sign = 1 if ey >= sy else -1
        pts = [(ex, ey), (ex - 8, ey - 16 * sign), (ex + 8, ey - 16 * sign)]
    draw.polygon(pts, fill=color)


def label_position(points):
    longest = max(zip(points, points[1:]), key=lambda item: abs(item[1][0] - item[0][0]) + abs(item[1][1] - item[0][1]))
    (x1, y1), (x2, y2) = longest
    return ((x1 + x2) / 2 - 42, (y1 + y2) / 2 - 3)


def center_text(draw, text: str, box, font_obj, fill: str, wrap_chars: int = 18) -> None:
    x1, y1, x2, y2 = box
    lines = []
    for raw in text.split("\\n"):
        lines.extend(textwrap.wrap(raw, wrap_chars) or [""])
    line_h = 20
    total_h = len(lines) * line_h
    y = y1 + max(0, (y2 - y1 - total_h) / 2)
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font_obj)
        line_w = bbox[2] - bbox[0]
        draw.text((x1 + max(0, (x2 - x1 - line_w) / 2), y), line, fill=fill, font=font_obj)
        y += line_h


def arrow(draw, start, end) -> None:
    sx, sy = start
    ex, ey = end
    color = "#334155"
    draw.line((sx, sy, ex, ey), fill=color, width=3)
    dx = ex - sx
    dy = ey - sy
    if abs(dx) >= abs(dy):
        sign = 1 if dx >= 0 else -1
        pts = [(ex, ey), (ex - 14 * sign, ey - 7), (ex - 14 * sign, ey + 7)]
    else:
        sign = 1 if dy >= 0 else -1
        pts = [(ex, ey), (ex - 7, ey - 14 * sign), (ex + 7, ey - 14 * sign)]
    draw.polygon(pts, fill=color)


def svg_fallback(info: dict) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="40" y="60" font-size="32" font-family="Arial">{info['title']}</text>
  <text x="40" y="100" font-size="18" font-family="Arial" fill="#475569">{info['subtitle']}</text>
</svg>"""


def write_db_files() -> None:
    copy_file(PROTO / "db" / "schema.sql", PACKAGE / "04-db" / "schema-current.sql")
    copy_file(PROTO / "db" / "seed-uat-users.sql", PACKAGE / "04-db" / "seed-uat-users.sql")
    write(PACKAGE / "04-db" / "README.md", """
    # DB Files

    - `schema-current.sql`: current factual MySQL schema from the prototype.
    - `seed-uat-users.sql`: current UAT user seed.
    - Read `../02-it-handoff-en/05-database-current-and-target.md` before designing workflow persistence.

    Do not use `mva_procurement_uat` for automated DB integration tests. Create an isolated test DB such as `mva_procurement_test`.
    """)


def write_docs() -> None:
    for rel, content in docs().items():
        write(PACKAGE / rel, content)
    for rel, content in container_files().items():
        write(PACKAGE / rel, content)
    write(PACKAGE / "02-it-handoff-en" / "99-preflight-scan.md", preflight_summary())


def write_verification(test_output: str | None) -> None:
    if test_output:
        match = re.search(r"(?:ℹ\s*)?tests\s+(\d+).*?(?:ℹ\s*)?pass\s+(\d+).*?(?:ℹ\s*)?fail\s+(\d+)", test_output, flags=re.S)
        summary = match.groups() if match else ("unknown", "unknown", "unknown")
        body = (
            "# Current Verification\n\n"
            "Verification command:\n\n"
            "```bash\n"
            "cd procurement-prototype\n"
            "./test.sh\n"
            "```\n\n"
            "Result: passed.\n\n"
            "Node test summary:\n\n"
            f"- tests: {summary[0]}\n"
            f"- pass: {summary[1]}\n"
            f"- fail: {summary[2]}\n\n"
            "Browser/runtime checks from `./test.sh`:\n\n"
            "- Browser smoke: passed\n"
            "- Layout smoke: passed\n"
            "- Price routing smoke: passed\n"
            "- Global UI audit: passed\n"
            "- Role flow smoke: passed\n"
            "- Accessibility smoke: passed\n\n"
            "Important note: current `./test.sh` is reliable for memory/test mode. Direct MySQL UAT mode must use an isolated test DB before DB integration automation.\n\n"
            "## Raw Test Tail\n\n"
            "```text\n"
            f"{test_output[-4000:]}\n"
            "```\n"
        )
    else:
        body = """
        # Current Verification

        Verification was not run by the package generator. Run:

        ```bash
        cd procurement-prototype
        ./test.sh
        ```
        """
    write(PACKAGE / "05-qa" / "current-verification.md", body)


def make_zip() -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    run(["zip", "-qr", str(ZIP_PATH), "20260608"], cwd=ROOT / "handoff-delivery")


def main() -> None:
    clean_package()
    copy_source_snapshot()
    write_docs()
    write_db_files()
    write_diagrams()
    test_output = run(["./test.sh"], cwd=PROTO)
    write_verification(test_output)
    make_zip()
    print(f"Package generated: {PACKAGE}")
    print(f"Zip generated: {ZIP_PATH}")


if __name__ == "__main__":
    main()
