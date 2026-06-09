# UAT Test Cases

This document lists acceptance test cases for the current frontend prototype. The scope is demand collection, manager approval, package preparation, and evidence-ready handoff.

## 1. User A Request Flow

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-001 | Create request from search | Login as User A, open Request, search item, add item, enter quantity | Item appears in request draft with editable phase quantities |
| UAT-002 | Submit request to Manager B | Select draft rows and submit | Row status becomes Submitted and appears in Manager Review Queue |
| UAT-003 | Prevent negative quantity | Enter negative quantity in any phase field | Quantity is corrected or blocked; no negative quantity is saved |
| UAT-004 | History requires standardization | Open History, select an unstandardized legacy approved item, click Add to Request | Complete Material Information modal opens before item can enter Request draft |
| UAT-005 | New Material stays pending | In Request, click Create New Material, complete modal LV123, standard name, EN/VN, detail, spec, and reason | Row is added to Request draft with `Material No. Pending`; no formal Material No. is created yet |
| UAT-005A | Legacy standardization creates Material No. | Add an unstandardized legacy History item, complete modal information, and add to Request | Formal Material No. follows `MVA-{LV1Code}{LV2Code}{LV3Code}-{Sequence}` and Material ID follows `MATID-{Sequence}` |
| UAT-005B | Material No. reuse after maintenance | Create or add the same LV123 + Standard Part Name CN + Detail + Spec again | System reuses the existing Material No. instead of creating a duplicate material |
| UAT-005C | Vendor part no. is not requester input | Open User A material entry modal and Request views | User A does not see or enter Vendor Part No. |
| UAT-005D | LV123 required | Try to add a modal material row without LV1 / LV2 / LV3 | System blocks Add to Request and shows validation toast |
| UAT-005E | Standard name required | Select LV123 but do not select a Standard Part Name search result | System blocks Add to Request and asks for a matching standard name or proposed standard name |
| UAT-005F | Proposed standard name exception | Search within LV123, enter a proposed Standard Part Name CN with no suitable result, and click Propose a new standard name | Modal allows the proposed name to be tracked for this request |
| UAT-005G | Large standard name picker | Search a selected LV123 category that returns more than 20 names and click Open all results | Scrollable picker opens, preserves the scoped count, and selected CN / EN / VN values return to the material entry form |
| UAT-005H | History batch legacy standardization | Select standardized and unstandardized History rows, then click Add to Request | Standardized rows enter Request immediately and unstandardized rows open Standardize Selected Items |
| UAT-005I | Request submit material gate | Select a draft legacy Request row with Complete Material Info Required and submit | Submit is blocked until Complete Selected Materials standardizes the row |

## 2. Demand Tracking

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-006 | Demand Tracking is read-only | Open Demand Tracking as User A | No Add button is shown |
| UAT-007 | Demand Tracking detail | Click Detail from Demand Tracking | Item Detail modal opens |
| UAT-008 | Demand terms are simplified | Review Demand Tracking columns | Only Planned Demand, Carryover, Current Request, Need to Buy, and Risk are shown |

## 3. Manager Approval

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-009 | Approve single row | Login as Manager B, open Review Queue, click Approve | Row status becomes Approved |
| UAT-010 | Reject to DRI requires reason | Click Reject to DRI without reason | System shows error toast and does not reject row |
| UAT-011 | Reject to DRI requires confirm | Enter reason, click Reject to DRI, confirm | Row status becomes Rejected and User A can see reason |
| UAT-012 | Bulk approve selected rows | Select multiple submitted rows, click Approve Selected | Selected rows become Approved |
| UAT-013 | Approved rows disable actions | Review approved row | Approve / Reject to DRI buttons are disabled |

## 4. Project Setup

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-014 | Save and open project | Open Project Setup, enter project code and current phase, click Save & Open to User A | Project appears in setup table and User A project dropdown |
| UAT-015 | Open project to User A | Re-open a closed project from the setup table | Project appears in User A project dropdown |
| UAT-016 | Close project access | Click Close in setup table | Project no longer appears in User A dropdown |
| UAT-017 | Free text current phase | Enter non-standard phase such as EVT-2 | System stores the phase text and shows manager-defined next phase behavior |

## 5. OM Purchasing

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-018 | OM-scope row enters OM flow | Manager approves PC / IPC / Monitor demand | Row appears in OM Purchasing workflow according to current routing design |
| UAT-019 | PAS status update | In OM PAS Review, update PAS status and comment | PAS status and comment are saved and visible in detail/history |
| UAT-020 | Move demand to quotation | Select OM demand row and move to Quotation | Row appears in the Quotation tab |
| UAT-021 | Upload quote PDF | Upload a quote PDF filename in OM Workbench | Button shows uploaded state and filename is visible |
| UAT-022 | Save quote info | Edit vendor/price/date fields and save quote info | Quote fields are saved and activity history is updated |
| UAT-022A | Maintain vendor mapping | Edit Vendor Part No. for the same Material No. | Vendor Part No. is saved as quote/vendor mapping and does not change Material No. |
| UAT-022B | Sourcing quote success does not create pending material | In Sourcing, enter vendor, negotiated price, quote result, and PDF for a pending new material | Quote data is saved, but formal Material No. remains pending until PR Created or PO Issued |
| UAT-022C | PR/PO creates new material number | Record PR Created or PO Issued with required number and evidence for a pending new material | System creates or reuses formal Material No. and writes a Material No. Created timeline event |
| UAT-023 | Export OM Excel | Select rows from one project and export Excel | `.xlsx` file is generated with OM package format |
| UAT-024 | Export quote PDF package | Select rows and export quote PDF | PDF package simulation is generated or downloaded |
| UAT-024A | Reject OM package to DRI | Select OM row, click Reject to DRI, enter reason | Row is rejected to User A / DRI and removed from active OM queue |

## 6. MFG Coordinator

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-025 | View collection status | Login as MFG Coordinator | Collection Status shows project, phase, required/completed/missing rows |
| UAT-026 | Package detail | Open package detail | Detail modal shows complete package information |
| UAT-027 | Export MFG package | Select ready package and export | `.xlsx` file is generated for MFG package / RFQ use |
| UAT-028 | Missing package remains visible | Review package with missing rows | Status shows missing data and detail explains missing information |
| UAT-028A | Reject MFG package to DRI | Select MFG row, click Reject to DRI, enter reason | Row is rejected to User A / DRI and removed from active MFG queue |

## 7. External Progress and Evidence

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-029 | Open external progress modal | Select package and click Update External Progress | Modal opens with status, system, note, evidence fields |
| UAT-030 | Evidence required for submitted status | Save Submitted to External System without evidence | System blocks save and shows error |
| UAT-031 | Reject reason required | Save Rejected to DRI without reason | System blocks save and shows error |
| UAT-032 | Save progress event | Enter valid status and evidence, save | Timeline receives a new progress event |
| UAT-033 | Rejected package remains traceable | Record Rejected to DRI with reason | User A / Manager can read the rejection reason and timeline event |

## 8. Shared UI Behavior

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-034 | Detail modal consistency | Open Detail from User A, Manager, OM, and MFG tables | Modal layout is consistent and readable |
| UAT-035 | Toast feedback | Perform successful and blocked actions | Non-blocking toast messages appear |
| UAT-036 | Confirm modal | Trigger reject/remove/export action where confirmation is required | Confirm modal appears and Cancel prevents action |
| UAT-037 | Sticky table headers | Scroll large tables | Table headers remain visible |

## 9. Regression Checks

| ID | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| UAT-038 | Role navigation | Switch between roles | Only role-appropriate pages are visible |
| UAT-039 | Project filter | Change project filter | Tables update according to selected project |
| UAT-040 | File output scope | Export package by selected project | Export does not mix unrelated project rows |
| UAT-041 | No purchasing result overstatement | Review User A / Manager progress copy | UI focuses on demand collection and evidence-ready handoff, not final purchasing result as completed |
