# Database Migrations

This folder contains ordered MySQL migration drafts for production workflow
persistence.

## Rules

- Keep `mva_procurement_uat` and automated test databases separate.
- Review migrations in an isolated database before applying them to shared UAT.
- Apply migrations in filename order.
- Keep workflow status, approval decisions, and audit events server-owned.
- Enforce Requester visibility at the API/query layer, not only in frontend UI.

## Current Files

- `001_target_workflow_tables.sql`: target workflow persistence tables after the
  current UAT auth/session/attachment MVP.

See `../workflow-api-table-map.zh-TW.md` before implementing API handlers
against these tables.
