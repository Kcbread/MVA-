# Whole-project Modularization Implementation Plan

> For agentic workers: execute bounded disjoint backend/frontend/QA tasks and review integration in the main task.

**Goal:** Replace monolithic entrypoint ownership with maintainable business modules without changing behavior.

**Architecture:** Explicit frontend ESM dependencies compiled for classic browser compatibility; backend dependency-injected CommonJS services. Preserve initial execution order and existing extension contracts.

**Tech Stack:** Existing vanilla JavaScript/Node/mysql2; esbuild for deterministic bundling, acorn and eslint-scope for checked mechanical extraction.

**Spec:** ../specs/2026-09-09-project-modularization-design.md

## Global Constraints

No Git. English UI unchanged. Excel-like tables and calculations unchanged. No SQL search changes or production data changes. Backups under test-artifacts/modularization-backup.

## Work packages

- [x] Baseline: run `DEMO_BROWSER_CHANNEL=msedge bash ./test.sh`; record pre-existing failures and run remaining suites independently after fail-fast exits.
- [x] Frontend extraction: inventory every top-level declaration with acorn; assign named business owner; create real imports/exports; keep owner reassignment APIs and ordered startup. Extract independent pure helpers first and verify literal fixtures through Node imports.
- [x] Browser integration: create app.js composition + scripts/build-frontend.cjs; bundle to dist/app.bundle.js; isolate legacy compatibility descriptors; keep file:// support and preserve externally monkeypatched functions.
- [x] Backend: delegated server.js/server-modules work only; preserve existing route behavior and SQL. Run `node --test tests/api.test.js tests/backend-modules.test.js`.
- [x] Tests: add frontend module tests catching broken imports, init order, mutable binding compatibility and deterministic bundle; update source fixture readers to load real modules, not stale app.js.
- [x] Integrate: rebuild and run `./test.sh`; independently run layout, role-flow, price-routing, global-ui, accessibility suites if baseline failures stop the standard runner. No business assertion weakening.
- [x] Handoff: publish exact ownership/dependency map and build/start/test instructions; record counts, baseline comparison and unresolved coupling honestly.

## Test fixtures / expected behavior

`clampQty(-1) === 0`, `clampQty('3.8')` must preserve current result; name/spec search `usb` preserves ranking; assigning exported request state must be visible to consumers; replacing legacy API hook must be observed by hydration. Missing module imports, stale bundle, duplicate event handlers, unavailable exports, mismatched table/header structure or changed API auth must fail verification.

No commit steps: user explicitly prohibits Git. Existing source transformations are mechanical, reviewed against backup; new adapters receive red/green behavior tests.
