# Screenshot Audit

Capture source: `http://127.0.0.1:4173/`

Capture tool: Playwright fallback after in-app Browser screenshot timeout.

Viewport: 1440 x 960.

## Step List

| Step | Screenshot | Health | Notes |
| --- | --- | --- | --- |
| 1 | `screenshots/01-login.png` | Good with caveat | Login entry is clear. Role selector is visible but disabled in API mode, so account identity drives role. This should be explained in demo docs. |
| 2 | `screenshots/02-requester-workspace.png` | Good | First task is clear: choose scope, Add Item, enter worksheet qty. Save Draft and Submit are visible. Success toast covers topbar area. |
| 3 | `screenshots/03-requester-add-item-popup.png` | Good | Add / Item / Detail / Spec / Action columns match locked rule. Modal is dense but usable. Long item/spec text needs reliable Detail/title access. |
| 4 | `screenshots/04-requester-warehouse-inventory.png` | Good | Stock/candidate framing is clear. Need to preserve evidence-vs-cost distinction in production. |
| 5 | `screenshots/05-requester-action-required.png` | Good | The page is understandable as a task queue. Empty/low-volume state should stay explicit in UAT. |
| 6 | `screenshots/06-requester-request-status.png` | Good | Status tracking model aligns with pending owner/current stage/days pending direction. No requester internal-field leak detected in viewport metadata. |
| 7 | `screenshots/07-cost-manager-approval.png` | Good | Cost Manager role and approval surface are clear. It reinforces final authorization rather than data entry. |
| 8 | `screenshots/08-cost-manager-demand-analysis.png` | Strong | Mature dense dashboard. Cost Dashboard first, Station Matrix second, carryover impact visible. Needs strong implementation contract in IT build. |
| 9 | `screenshots/09-cost-manager-progress-tracking.png` | Good | Owner/stage aging model is clearer than PR/PO percentage tracking. Good alignment with workflow-status module. |
| 10 | `screenshots/10-dept-dri-price-review.png` | Needs layout fix | Page-level horizontal overflow detected. Carryover review dominates above price review; decide if that is intended first focus. |
| 11 | `screenshots/11-budget-approver-price-review.png` | Good | Budget Approver sees price review context. Need ensure it only receives Dept DRI-approved exception rows. |
| 12 | `screenshots/12-om-leader-dashboard.png` | Good | OM Leader can see broad OM status. This fits monitoring/assignment role. |
| 13 | `screenshots/13-om-pas-demand-no.png` | Good | PAS Demand No is a distinct step before quote result. Good workflow separation. |
| 14 | `screenshots/14-om-pas-quote-result.png` | Good with permission question | Quote result table has PAS/vendor/price/currency fields in the right operational place. Captured as Mai, so OM Leader write permission needs confirmation. |
| 15 | `screenshots/15-om-export-package.png` | Good | Export Package stage is visible and separate from quote input. Confirm export eligibility rules before production API. |
| 16 | `screenshots/16-om-purchasing-assigned.png` | Good | OM Purchasing assigned-row view is consistent with role boundary. Need verify API enforces assigned-only rows. |
| 17 | `screenshots/17-admin-setup.png` | Good | Admin setup exists as governance area. Must remain setup-only, not business approval override. |
| 18 | `screenshots/18-buyer-handoff.png` | Early-stage but clear | Buyer PR/PO stage exists with status cards and table. It reads like future handoff/PR/PO tracking, not a full Buyer workflow. |

## Cross-Screen UX Findings

- Role-based top navigation works, but Admin sees everything; production must avoid treating Admin visibility as business permission.
- Dense tables are accepted for this domain, especially Cost Manager and OM, but each table needs shell-contained horizontal scroll.
- Requester privacy guard appears intact in captured requester views.
- The system relies on many acronyms: PAS, FTV, CFA, ECS, OM. This is acceptable for internal users but needs glossary/tooltips in handoff material.
- Success toast placement repeatedly covers topbar user/account area in screenshots.

## Accessibility / Layout Notes

- Automated accessibility smoke passed.
- Screenshot audit cannot prove full keyboard navigation or screen reader behavior.
- Dept DRI carryover table is the main visible layout issue from this pass.
- Add Item modal uses clear labels and action buttons, but density is high; keyboard/focus order should be verified in a manual UAT session.

## Verification

`./test.sh` result:

- Syntax: pass
- Unit/System Contract: pass, 87 tests
- Browser Smoke: pass
- Layout Smoke: pass
- Price Routing Smoke: pass
- Global UI Audit: pass
- Role Flow Smoke: pass
- Accessibility Smoke: pass
