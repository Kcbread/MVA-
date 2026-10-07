// sourcing/state: authoritative source; see docs/module-map.md.


// @legacy-unit 326 1335
export let pendingRfqEmailRows;
export function initializePendingRfqEmailRowsBinding() {
  pendingRfqEmailRows = [];
}
// @end-legacy-unit 326

export function replacePendingRfqEmailRowsBinding(value) { pendingRfqEmailRows = value; return value; }
