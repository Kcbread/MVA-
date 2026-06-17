# Testing Standard Operation

## Purpose

This project uses one standard test entrypoint so UI changes, workflow changes, and business helper changes are checked the same way every time.

Run all available checks from the prototype root:

```bash
./test.sh
```

## Test Layers

- `Syntax checks`: verifies core JavaScript files can be parsed by Node.
- `Unit tests`: verifies helper logic such as quote validity, currency display, and dashboard aggregation.
- `System contract tests`: verifies role tabs, table contracts, and guardrails against UI pollution.
- `Browser smoke`: opens `index.html` when Playwright is available. If Playwright is not installed, an explicit skip is acceptable.
- `Accessibility smoke`: runs a WCAG 2 A/AA axe-core smoke when Playwright and axe-core are available. If either dependency is missing, an explicit skip is acceptable.
- `UI quality review`: uses `_doc/ui-quality-review.en.md` to check readability, attention flow, action clarity, and design consistency.

## Required Practice

- Run `./test.sh` before handing off any code change.
- Update `tests/system-contract.test.js` when role tabs, table headers, or top-level navigation changes.
- Add unit tests for new helper modules or business calculations.
- Add or update `_doc/vx.y.md` for every major workflow or UI structure change.
- Treat a skipped browser smoke as a visible note, not as a hidden pass.
- Use the `procurement-ui-quality-review` skill when UI structure or copy changes.
- Manager B `Cost Dashboard` must not return to low-value summary cards; it must follow the Excel Dashboard column logic.

## Current Guardrails

- Manager B tabs must stay `Approval / Demand Analysis / Progress Tracking / Project Setup`.
- Manager `Demand Analysis` must start with `Cost Dashboard` and use `Station Matrix` as the drilldown layer.
- OM Purchasing tabs must stay `Submission Dashboard / PAS Demand No / PAS Quote Result / Export Package`.
- Contact must stay a topbar popup utility, not a top-level tab.
- Temporary Budget input must render only inside OPM/User A `New Request`.
- UI quality review standards live in `_doc/ui-quality-review.zh-TW.md` and `_doc/ui-quality-review.en.md`.

## Standard Result Summary

Use this format when reporting test results:

```text
Syntax: pass/fail
Unit: pass/fail
System Contract: pass/fail
Browser Smoke: pass/skipped/fail
Accessibility Smoke: pass/skipped/fail
UI Quality: pass/fail
Notes: skipped reason or remaining risk
```
