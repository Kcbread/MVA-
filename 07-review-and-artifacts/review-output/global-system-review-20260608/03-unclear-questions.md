# Unclear Questions For Next Decision Round

## Business Ownership

1. **OM Leader quote operation**
   - Mai can see OM PAS/quote/export screens.
   - Should Mai be allowed to save PAS Demand No, quote result, or export package, or only assign/monitor/triage?
   - Recommended default: Mai can view all and assign, but quote/export write actions require explicit override + audit.

2. **Buyer Handoff v1 depth**
   - Is Buyer Handoff only a post-export status/read-only stage in v1?
   - Or should Buyer/PUR users update PR No、PO No、arrival、evidence、blocked reason?
   - Recommended default: v1 read-only status + optional evidence placeholder; full Buyer PR/PO workflow later.

3. **Warehouse owner mapping**
   - OM-owned / MFG-owned / Unit-owned routing is defined conceptually.
   - Where is the production owner mapping source of truth: item_master rule, requester_mappings, Admin setup, or external master?
   - Recommended default: Admin-maintained owner rules backed by item_master, with audit.

4. **Cost Manager visibility for pending impact**
   - Current rule says pending warehouse/carryover should not officially reduce cost.
   - Should Cost Manager see pending impact as a separate scenario number?
   - Recommended default: show pending only with explicit pending badge, never mix with effective cost.

## Workflow / API

5. **Requester submit package granularity**
   - Submit currently sends all rows with qty in current scope, package-level Need Date.
   - Can one package contain multiple lines/projects, or exactly one selected project/line scope?
   - Recommended default: one package per current project/line/input scope for v1.

6. **Reject routing after OM**
   - Docs say OM reject can go to Requester Action Required or Dept DRI review depending on reason.
   - What are the official reason categories and target stage?
   - Recommended default: define reject_reason_category enum before API implementation.

7. **Price exception chain**
   - Rules are clear for `quote - history > 0.40`, no history, Temporary Budget.
   - Who can override threshold or mark an exception as not applicable?
   - Recommended default: only Admin can configure threshold; no ad hoc operator override.

8. **Exchange rate source**
   - OM Leader maintains USD/VND exchange rate.
   - Does production require effective date, source proof, approval, or history lock?
   - Recommended default: date-based rate table + audit; no retroactive silent edit.

## IT Handoff / Deployment

9. **Demo account consistency**
   - Project progress mentions shared UAT accounts (`requester`, `deptdri`, `omleader`, `ompurchasing`, `admin`).
   - Memory fallback currently uses `V1524505`, `dept-dri`, `maint5`, `giangth1`, `admin`.
   - Which account set should be canonical for demos?
   - Recommended default: align seed files, memory fallback, and demo guide to the shared UAT aliases.

10. **No-source handoff enforcement**
   - IT receives no source, but controlled demo browser access can still expose frontend assets if LAN URL is shared.
   - Is the official demo screen-share only, or can IT inspect runtime frontend?
   - Recommended default: screen-share only for official handoff; no direct LAN URL as primary delivery.

11. **Production file storage**
   - Attachment metadata MVP exists.
   - What is production storage: local disk, NAS, S3-compatible storage, SharePoint, or ERP attachment service?
   - Recommended default: do not lock until IT confirms infrastructure.

12. **Excel import/export contract**
   - Requester worksheet and OM export package are Excel-compatible in concept.
   - Are formal templates locked?
   - Recommended default: create one canonical import/export template pack before production API build.

## UI / UX

13. **Dept DRI page composition**
   - Dept DRI Price Review page currently shows Carryover Review above Pending Price Review.
   - Should Dept DRI first focus be submission/price queue or carryover queue?
   - Recommended default: split into clear inner tabs or reorder by current pending work priority.

14. **Buyer naming**
   - Docs prefer Buyer Handoff, nav currently says Buyer PR / PO.
   - Should user-facing nav use Buyer Handoff everywhere?
   - Recommended default: use Buyer Handoff as role/stage label, PR/PO as table content.

15. **Toast placement**
   - Success toast covers topbar user/actions in screenshots.
   - Should toast move lower/right or auto-dismiss faster for demo?
   - Recommended default: keep for now, but improve before formal UAT sessions.
