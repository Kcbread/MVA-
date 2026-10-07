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

## QA Entry Link Rule

When Kai asks for "today's QA entry link" or "提供今天 QA 入口", the default meaning is a LAN link for OM/QA users on the same Wi-Fi to open the prototype from Kai's MacBook Pro. Do not provide only `localhost` or `127.0.0.1`.

Standard operation:

1. Confirm the prototype server is running and listening on a LAN-reachable address such as `*:PORT` or `0.0.0.0:PORT`.
2. Get the MacBook Pro's current Wi-Fi IP, for example with `ipconfig getifaddr en0`.
3. Provide the LAN URL in this format: `http://<wifi-ip>:<port>/05-engineering-source/procurement-prototype/`.
4. Run a real HTTP check against the LAN URL and confirm at least `HTTP 200 OK`.
5. State clearly that the link is for same-Wi-Fi OM/QA users, not a local-only browser link.

If same-Wi-Fi users still cannot connect, check the Mac firewall, company Wi-Fi client isolation, whether both devices are on the same SSID, and whether the server is bound only to `localhost`.

## Current Guardrails

- Manager B tabs must stay `Approval / Demand Analysis / Progress Tracking / Project Setup`.
- Manager `Demand Analysis` must start with `Cost Dashboard` and use `Station Matrix` as the drilldown layer.
- OM Purchasing tabs must stay `My Intake / My Quote Result / Quotation DB / My Exports`; OM Leader/Mai must not see the operational `My Quote Result` tab, and the leader view shows `Submission Dashboard / PAS Demand No / Quotation DB / OM Handoff`.
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
