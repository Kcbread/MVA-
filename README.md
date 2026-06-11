# Procurement Prototype Workspace

This folder keeps the procurement system prototype and supporting materials for
internal testing.

## Development And Deployment Baseline

- MacBook Pro is the development machine. Source changes, tests, commits, and
  GitHub pushes should happen here.
- GitHub `origin/main` is the deployable source of truth.
- Mac mini is the host / UAT deployment machine. Do not edit deployed source
  directly on the Mac mini; deploy the same commit that passed tests on
  MacBook Pro.
- Docker / Compose deployment assets live in `deploy/mac-mini/`.
- The detailed sync runbook is `MACBOOK_PRO_SYNC_GUIDE.md`.

## Start Local Test Server

From this folder, run:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/procurement-prototype/
```

If port `8080` is already in use, use another port:

```bash
python3 -m http.server 8081
```

## Internal Test Documents

Current documents for testers and reviewers:

- `procurement-prototype/docs-current/frontend-functional-spec.md`
- `procurement-prototype/docs-current/ui-screen-guide-en.md`
- `procurement-prototype/docs-current/uat-test-cases-en.md`
- `procurement-prototype/docs-current/data-dictionary-en.md`

Maintenance / implementation reference:

- `procurement-prototype/_doc/module-table-role-permission-catalog.zh-TW.md`

Older diagrams, screenshots, reports, and reference documents are kept in:

- `procurement-prototype/docs-archive/`

Procurement sample/reference files are kept in:

- `檔案範例/`

## Archived Project

The old recognition project was moved to a sibling archive folder outside this
workspace.
