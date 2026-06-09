# MVA Procurement Handoff Delivery - 2026-06-04

This folder contains two clean packages for IT handoff.

## 01-website-source

Use this package for Mac mini / IT deployment.

Includes:

- Frontend prototype files.
- Node.js API server.
- MySQL Phase 1 schema and UAT user seed.
- Mac mini setup script.
- Test suite.
- `.env.example`.

Excludes:

- `node_modules`.
- Local `.env`.
- old archives.
- temporary screenshots / test artifacts.

## 02-flow-docs

Use this package for IT development discussion and direct DFD review.

Includes:

- Demo checklist.
- Cross-role flow, Traditional Chinese and English.
- Table information flow, Traditional Chinese and English.
- Module definitions.
- Bilingual DFD JPEG files and `.mmd` source.
- MySQL UAT setup and shared DB/session/audit plan.

## Recommended Meeting Flow

1. Demo the website using `01-website-source`.
2. Explain SOP, table data flow, and DFD JPEGs using `02-flow-docs`.
3. Confirm MySQL POC setup on Mac mini / internal LAN host.
4. Confirm Phase 1 API scope before moving the full workflow into DB.
