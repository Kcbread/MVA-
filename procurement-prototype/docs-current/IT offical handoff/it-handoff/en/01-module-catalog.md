# 01 Module Catalog

## Module Definition Format

Each module must be independently integrable, so every module uses the same definition structure:

| Field | Meaning |
| --- | --- |
| Module ID | Stable module identifier. |
| Business Owner | User role. |
| Purpose | Work or decision supported by the module. |
| Input Data | Data read by the module. |
| Output / Mutation | Data, status, or history events written by the module. |
| Visible Columns | Main table columns. |
| Filters | Operable filters. |
| Actions | Buttons and success results. |
| Downstream Consumers | Modules consuming the output. |
| Empty / Error State | Empty or blocked states. |
| DFD Notes | Visualization recommendation. |

## Requester Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `requester.requestWorkspace` | Request Workspace | Full-page Excel-like all-phase worksheet; select Project/Line, enter item x phase x station/unit qty, Save Draft or Submit. |
| `requester.addItemPopup` | Add Item Popup | Main top-left add entry; Catalog / Reuse / Copy Demand / New Item Request share one popup. |
| `requester.worksheetMatrix` | Requester Worksheet Matrix | Maps each qty cell to long-form `stationBreakdown` rows. |
| `requester.rowDetail` | Requester Row Detail | Shows item/spec, carryover, warehouse suggestion, and New Item Request status; does not replace worksheet input. |
| `requester.actionRequired` | Action Required | Handle quote confirmation and revised request confirmation. |
| `requester.requestStatus` | Request Status | Track submitted status, timeline, and reasons. |

## Manager B Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `manager.approval` | Approval | Pending Approval + Approval History in one workbench. |
| `manager.demandAnalysis` | Demand Analysis | Manager demand analysis workspace containing Cost Dashboard and Station Matrix. |
| `manager.costDashboard` | Cost Dashboard | First-layer item x phase x unit quantity/amount dashboard following the Excel Dashboard sheet. |
| `manager.stationMatrix` | Station Matrix | Second-layer Excel-like phase x station quantity reasonableness wide table. |
| `manager.progressTracking` | Progress Tracking | Pivot-like procurement progress and risk dashboard. |
| `manager.projectSetup` | Project Setup | Project access and setup. |
| `shared.contactDri` | Contact DRI | Requester / department DRI / project contact lookup. |

## OM Purchasing Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `om.submissionDashboard` | Submission Dashboard | OM stage/pending dashboard. |
| `om.pasDemandNo` | PAS Demand No | Enter PAS Demand No and move to PAS Quote Result. |
| `om.pasQuoteResult` | PAS Quote Result | Complete PAS Material No, quote result, quote validity, attachments, and send to Requester. |
| `om.quoteExpiryMonitor` | Quote Expiry Monitor | Quote validity and requote monitor inside Submission Dashboard. |
| `om.exportPackage` | Export Package | Generate CFA/ECS package and mark exported. |
| `om.detail` | OM Detail | Review PAS tracking, quote, previous reference, and timeline. |

## Shared Modules

| Module ID | Module Name | Purpose |
| --- | --- | --- |
| `shared.itemDetail` | Item Detail | View request/item/spec/raw row/timeline. |
| `shared.contactPopup` | Contact Popup | Cross-role topbar contact lookup and copy utility. |
| `shared.contactDri` | Contact DRI | Single-row requester / department DRI / project contact lookup. |
| `shared.timeline` | Timeline | Cross-role action/event/timestamp display. |
| `shared.toast` | Toast | Success, blocked, and error feedback. |
| `shared.confirmDialog` | Confirm Dialog | Confirmation for high-risk actions. |

## Integration Principles

- Modules must not depend on their current page location.
- Modules can be called from a tab, modal, dashboard, or external entry point.
- Module input should be request rows, imported raw rows, or master data; not DOM state.
- Successful actions must write status and timeline events, not only update UI.
- `Detail` is read-only context and must not perform approve or quote-send actions.
