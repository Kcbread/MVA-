# Current Verification

Verification command:

```bash
cd procurement-prototype
./test.sh
```

Result: passed.

Node test summary:

- tests: 84
- pass: 84
- fail: 0

Browser/runtime checks from `./test.sh`:

- Browser smoke: passed
- Layout smoke: passed
- Price routing smoke: passed
- Global UI audit: passed
- Role flow smoke: passed
- Accessibility smoke: passed

Important note: current `./test.sh` is reliable for memory/test mode. Direct MySQL UAT mode must use an isolated test DB before DB integration automation.

## Raw Test Tail

```text
layer are wired (3.090541ms)
✔ OM tabs and PAS quote result contract are consolidated (4.001ms)
✔ UAT feedback is a utility page and row detail action, not an OM workflow tab (0.522333ms)
✔ MySQL API Phase 1 and OM assignment contract are present (1.243625ms)
✔ User-applied carryover stores VND price even when source row is USD canonical (0.244541ms)
✔ OM submission detail stays within OM ownership and export allows price-cleared rows (0.213208ms)
✔ Temporary budget and quote validity do not use active MutationObserver injection (0.406209ms)
✔ UI quality review documentation and skill are registered (0.292166ms)
✔ text visibility contract separates identity, spec, note, number, and action cells (0.969375ms)
✔ requester-safe item identity columns must not be hidden by compact clamp rules (0.243833ms)
✔ spec columns summarize with readable line clamp instead of hard cutting text (0.2315ms)
✔ audit reason columns are full-wrap and not summary-clamped (0.170041ms)
✔ quote validity uses 10-day warning threshold (1.165667ms)
✔ currency display converts canonical VND to USD without changing source amount (7.602125ms)
✔ currency display supports compact readable labels for dense dashboards (0.177041ms)
✔ USD canonical cost helpers display VND and USD without double conversion (0.141125ms)
✔ OM pending owner follows business blocking owner (0.073042ms)
✔ workflow status maps core ownership stages across roles (0.401084ms)
✔ workflow status role visibility hides internal OM fields from requester (0.106625ms)
✔ workflow status table hides internal procurement fields from requester (0.857ms)
✔ workflow status table gives Cost Manager owner and aging columns (0.105291ms)
✔ workflow status table exposes assignment for OM roles (0.115541ms)
✔ role guards normalize legacy role names and preserve business ownership (0.079167ms)
✔ role guards separate OM leader controls from assigned member work (0.092167ms)
✔ role guards hide internal procurement fields from requester and cost owner (0.061958ms)
✔ OM quote status separates reusable quote from waiting and expired quote (0.0625ms)
✔ demand cost dashboard aggregates item x phase x unit qty and amount (0.148542ms)
✔ demand cost dashboard exposes phase x unit totals (0.055333ms)
✔ demand cost dashboard calculates selected phase unit cost by line count (0.075334ms)
✔ demand cost dashboard can return selected phase unit quantities (0.032583ms)
✔ demand cost dashboard calculates original saving and effective cost from applied carryover (0.042542ms)
✔ demand cost dashboard line count multiplies original qty only, not carryover qty (0.02375ms)
✔ demand cost dashboard caps applied carryover qty at original qty (0.021625ms)
✔ demand cost dashboard treats requester carryover candidate as pending, not effective (0.021708ms)
✔ demand cost dashboard does not subtract pending or rejected carryover (0.037ms)
✔ demand cost dashboard keeps amount and qty visible in both view modes (0.049584ms)
✔ demand cost dashboard filters carryover rows by exact project scope (0.044083ms)
✔ price decision uses rounded USD delta threshold (0.102042ms)
✔ price decision requires escalation for no history and temporary budget (0.027833ms)
✔ ETA uses OM approved + base/no bidding/computer lead time (0.375958ms)
✔ ETA does not add no-bidding days when valid quote exists (0.082667ms)
✔ price category classifies computer before MFG station demand (0.060125ms)
✔ FTV audit key is department-specific while cost allocation remains request-line specific (0.119292ms)
✔ FTV route logic keeps local buy out of customs code requirements (0.289125ms)
✔ FTV export gate blocks required external import without code (0.103958ms)
ℹ tests 84
ℹ suites 0
ℹ pass 84
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3936.894083
== Browser smoke ==
Browser smoke passed.
Layout smoke passed.
Price routing smoke passed.
Global UI audit passed.
Role flow smoke passed.
== Accessibility smoke ==
Accessibility smoke passed.
All available tests completed.

```
