# Procurement System Prototype Log

Updated: 2026-04-25

## Completed

- Built a static front-end prototype in `05-engineering-source/procurement-prototype`.
- Added role-based login simulation: Requester User A, Manager User B, Procurement User, and Administrator.
- Updated Department Input so requesters search purchase data first, add selected items into the request list, or create a new item request.
- Existing purchase-data items lock Part No., Item, Spec, and Lv1/Lv2/Lv3; requester mainly edits Project, Quantity, and Remark.
- Added manager Approval flow with Approve / Return / Reject.
- Enforced approval gate: only manager-approved requests flow to Fang Ying's Incoming Requests.
- Added Buyer Workbench with Incoming Requests, PO / Quotation History, and Filtered Result for Procurement.
- Added quote validity handling: Valid, Expired, New item, No history.
- Converted Incoming Requests actions into a dropdown.
- Added Excel-compatible CSV download for filtered procurement results.
- Updated the main page/button guide to English.

## Latest Change

- Converted prototype UI operation text and explanations to English.
- Kept Chinese item names and Chinese item-name data unchanged.
- Converted procurement coordinator display name to `Fang Ying`.

## Key Files

- `05-engineering-source/procurement-prototype/index.html`
- `05-engineering-source/procurement-prototype/app.js`
- `05-engineering-source/procurement-prototype/styles.css`
- `採購系統頁面與按鈕說明.md`
- `05-engineering-source/procurement-prototype-test-package.zip`

## Verification

- `node --check 05-engineering-source/procurement-prototype/app.js`: passed.
