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
