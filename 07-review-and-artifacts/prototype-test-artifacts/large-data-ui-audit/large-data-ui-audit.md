# Large Data UI Audit

Command: `RUN_LARGE_DATA_UI_AUDIT=1 ./test.sh` or `node tests/large-data-ui-audit.js`

## Fixture

- Type: mock/fixture, not real execution or UAT production data.
- Applied: yes
- Rows: 184
- Marker: quantity-bulk-v1

## Coverage

- Roles: Requester, Dept DRI, Cost Manager, OM Leader, OM Purchasing, Budget Approver, Buyer Handoff, Admin
- Viewports: desktop 1440x920; tablet 1024x768; compact 390x820
- Screenshots: 24

## Automated Findings

- No automated overflow, overlap, row-height, sticky-cell, or role text failures detected.

## UI Quality Findings

- Requester: check that the first focus remains the full-page worksheet, MFG/Non-MFG tabs, P1.0-MP phase groups, Need Date, Save Draft, and Submit.
- Dept DRI / Cost Manager / Budget Approver: check that Dashboard-first evidence remains understandable and detail tables, not Dashboard, carry selected-row scope.
- OM Leader / OM Purchasing: check that assignment, PAS Demand No, quote result, screenshot/Excel, validity, and export actions remain scannable with many rows.
- Buyer Handoff: check that Buyer owns PR/PO after OM export is clear and user-facing `Downstream` text is absent.
- Admin: check that setup/audit remains governance-only and does not become a business approval cockpit.

## Screenshots

- Requester / desktop: `test-artifacts/large-data-ui-audit/requester-worksheet-mfg-1440x920.png`
- Dept DRI / desktop: `test-artifacts/large-data-ui-audit/dept-dri-review-1440x920.png`
- Cost Manager / desktop: `test-artifacts/large-data-ui-audit/cost-manager-review-1440x920.png`
- OM Leader / desktop: `test-artifacts/large-data-ui-audit/om-leader-intake-1440x920.png`
- OM Purchasing / desktop: `test-artifacts/large-data-ui-audit/om-purchasing-quote-result-1440x920.png`
- Budget Approver / desktop: `test-artifacts/large-data-ui-audit/budget-approver-review-1440x920.png`
- Buyer Handoff / desktop: `test-artifacts/large-data-ui-audit/buyer-handoff-1440x920.png`
- Admin / desktop: `test-artifacts/large-data-ui-audit/admin-setup-1440x920.png`
- Requester / tablet: `test-artifacts/large-data-ui-audit/requester-worksheet-mfg-1024x768.png`
- Dept DRI / tablet: `test-artifacts/large-data-ui-audit/dept-dri-review-1024x768.png`
- Cost Manager / tablet: `test-artifacts/large-data-ui-audit/cost-manager-review-1024x768.png`
- OM Leader / tablet: `test-artifacts/large-data-ui-audit/om-leader-intake-1024x768.png`
- OM Purchasing / tablet: `test-artifacts/large-data-ui-audit/om-purchasing-quote-result-1024x768.png`
- Budget Approver / tablet: `test-artifacts/large-data-ui-audit/budget-approver-review-1024x768.png`
- Buyer Handoff / tablet: `test-artifacts/large-data-ui-audit/buyer-handoff-1024x768.png`
- Admin / tablet: `test-artifacts/large-data-ui-audit/admin-setup-1024x768.png`
- Requester / compact: `test-artifacts/large-data-ui-audit/requester-worksheet-mfg-390x820.png`
- Dept DRI / compact: `test-artifacts/large-data-ui-audit/dept-dri-review-390x820.png`
- Cost Manager / compact: `test-artifacts/large-data-ui-audit/cost-manager-review-390x820.png`
- OM Leader / compact: `test-artifacts/large-data-ui-audit/om-leader-intake-390x820.png`
- OM Purchasing / compact: `test-artifacts/large-data-ui-audit/om-purchasing-quote-result-390x820.png`
- Budget Approver / compact: `test-artifacts/large-data-ui-audit/budget-approver-review-390x820.png`
- Buyer Handoff / compact: `test-artifacts/large-data-ui-audit/buyer-handoff-390x820.png`
- Admin / compact: `test-artifacts/large-data-ui-audit/admin-setup-390x820.png`

## Remaining Risks

- Screenshot review is qualitative; it supports UI/UX inspection but does not prove full accessibility compliance.
- Axe accessibility checks remain covered by the standard accessibility smoke when available.
- This audit uses fixture data; do not describe it as real UAT completion.
