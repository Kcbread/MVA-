# UAT Test Cases - 2026-06-08

These UAT cases define behavior for IT implementation. They are no-source acceptance criteria.

## 1. Requester Worksheet

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-REQ-001 | Open Request Workspace | Login as Requester and open Request Workspace | MFG / Non-MFG tabs, Project, Line, Need Date, Save Draft, Submit, Add Item, and worksheet are visible. |
| UAT-REQ-002 | Add catalog item | Click Add Item, stay on Catalog, click Add on a row | A worksheet item row appears immediately; all phase qty cells start at 0. |
| UAT-REQ-003 | Popup columns | Open Add Item popup | Headers are `Add / Item / Detail / Spec / Action`; Source and Phase Trace headers are not visible. |
| UAT-REQ-004 | Lv123 filter | Open Add Item popup, choose Lv1/Lv2/Lv3 filters | Catalog/Reuse/Copy Demand rows filter by level path; New Item Request remains search-to-create. |
| UAT-REQ-005 | Reuse item | Add an item from Reuse tab | Item/spec/source reference appears in worksheet; target qty starts at 0. |
| UAT-REQ-006 | Copy Demand | Add an item from Copy Demand tab | Source trace is visible as reference; source qty is not copied into target qty. |
| UAT-REQ-007 | New Item Request | Search a new item, open New Item Request tab, add it | New item row appears in worksheet and can receive qty; submit carries New Item Request status into the next review stage. |
| UAT-REQ-008 | MFG all-phase columns | Open MFG worksheet | Each phase group shows CG / BG / FATP / Test / Hybrid / Auto / ENG Pack / Zombie / Laser_pico / Rework / Repair / WH plus phase total. |
| UAT-REQ-009 | Non-MFG all-phase columns | Open Non-MFG worksheet | Each phase group shows FATP TE / FATP IQC / FATP PQE / WH / Q-LAB / REL / ENG1 / ENG2 / ENG3 / IT / FAC plus phase total. |
| UAT-REQ-010 | Qty input validation | Enter negative, decimal, or scientific notation in qty cells | Invalid characters are blocked or sanitized; no negative/decimal/scientific value remains. |
| UAT-REQ-011 | Keyboard entry | Enter qty and press Enter | Focus moves to the next qty cell. |
| UAT-REQ-012 | Save Draft without Need Date | Add a row, enter qty, leave Need Date blank, click Save Draft | Draft saves without requiring Need Date. |
| UAT-REQ-013 | Submit requires Need Date | Add row, enter qty, leave Need Date blank, click Submit | Submit is blocked and asks for package-level Need Date. |
| UAT-REQ-014 | Submit requires qty | Add row, keep all qty cells 0, fill Need Date, click Submit | Submit is blocked until at least one qty cell > 0. |
| UAT-REQ-015 | Remove row | Click Remove on a worksheet draft row | Row disappears immediately; no confirmation modal opens. |
| UAT-REQ-016 | Layout overflow | Seed or display 40 item rows and test desktop/tablet/compact viewport | Page has no horizontal overflow; worksheet scrolls inside table shell only. |

## 2. Requester Privacy

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-PRI-001 | Popup privacy | Open Add Item popup | No vendor, supplier, PAS material no, factory material no, OM assignee, or FTV is visible. |
| UAT-PRI-002 | Worksheet privacy | Review Requester worksheet and row detail | Procurement-internal fields remain hidden from Requester. |
| UAT-PRI-003 | Spec summary | Review long item spec in popup and worksheet | Spec is readable as a summary; full text is available by Detail/title, not by exposing internal procurement data. |

## 3. Cost Manager

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-CM-001 | Approval receives submitted demand | Requester submits package | Submitted rows appear in Cost Manager Approval. |
| UAT-CM-002 | Approval decision | Cost Manager approves or rejects a submitted row | Status and timeline update; reject requires reason. |
| UAT-CM-003 | Cost Dashboard | Open Demand Analysis / Cost Dashboard | Item x unit quantity/amount view is visible before Station Matrix. |
| UAT-CM-004 | Station Matrix | Drill into Station Matrix | Phase x station/unit quantities use submitted long-form stationBreakdown data. |
| UAT-CM-005 | Carryover effective cost | Review a row with pending vs applied carryover | Pending/rejected carryover does not reduce cost; applied carryover affects effective qty/cost. |

## 4. OM Purchasing

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-OM-001 | PAS Demand No | Enter PAS Demand No and move row | Row moves to PAS Quote Result. |
| UAT-OM-002 | Save quote info | Enter PAS Material No, quote date, valid until, price, attachments, save | Quote result and price decision status update. |
| UAT-OM-003 | Quote validity required | Try sending quote without Quote Valid Until | Send is blocked unless rule allows auto-clear path. |
| UAT-OM-004 | Export package | Export eligible rows | Export status/package code updates; Buyer Handoff can continue. |

## 5. No-Source Handoff Validation

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-HO-001 | Package contents | Inspect `IT offical handoff.zip` | Package contains docs only; no `.js`, `.html`, `.css`, `.sql`, `node_modules`, or source folder. |
| UAT-HO-002 | Mac mini demo access | IT connects with IT-Demo through Screen Sharing | IT can view/operate browser demo but cannot browse source folders, SSH, or file sharing. |
