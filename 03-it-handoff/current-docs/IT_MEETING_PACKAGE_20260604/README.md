# IT Meeting Package - MVA Procurement Prototype

## Purpose

This package is prepared for the IT meeting, live demo, and direct DFD visualization delivery.

Use it for:

- Live product demo.
- Cross-role workflow explanation.
- Table information flow review.
- DFD JPEG review without relying on external generated diagrams.
- MySQL POC / OM internal test alignment.

## Recommended Reading Order

1. `01-demo/demo-checklist.md`
   - Use this during the live screen demo.
2. `02-flow-sop-zh-TW/05-cross-role-flow.zh-TW.md`
   - Main cross-role workflow in Traditional Chinese.
3. `02-flow-sop-zh-TW/06-table-information-flow.zh-TW.md`
   - Table read/write/downstream flow in Traditional Chinese.
4. `03-flow-sop-en/05-cross-role-flow.en.md`
   - English cross-role workflow.
5. `03-flow-sop-en/06-table-information-flow.en.md`
   - English table information flow.
6. `04-dfd/*.jpeg`
   - Bilingual DFD visual files for IT review. Includes context, level 1 flow, rejection/amendment closed loop, and data-store/audit DFD.
7. `04-dfd/*.mmd`
   - DFD source files for traceability.
8. `05-mysql-uat/mac-mini-mysql-poc-setup-guide.zh-TW.md`
   - Mac mini / internal LAN MySQL POC setup.

## Current PM Position

- The prototype is ready for screen demo.
- MySQL Phase 1 is scoped to server session, server-authoritative role, OM assignment, and audit trail.
- Workflow data is not fully migrated to MySQL yet.
- Frontend must not connect to MySQL directly.
- Architecture principle: Browser -> Node API -> MySQL.
- OM internal test deployment target: Mac mini / internal LAN test host.
- Official requester mapping principle: `Project Family + Project Code + Demand Department -> Requester`.
- Station is used only for MFG quantity/cost analysis and never decides the requester.

## Scope For IT Discussion

- Confirm MySQL POC host and account provisioning.
- Confirm UAT user accounts and role ownership.
- Confirm Phase 1 API scope before moving full workflow data.
- Confirm attachment v1 stores filename/metadata only.
- Confirm DFD JPEG outputs: context, cross-role process, closed-loop rejection/amendment, and data-store/audit flow.
- Confirm closed-loop rejection behavior: Manager reject, OM reject, DRI reject, Requester cancel, and amendment after quote.
