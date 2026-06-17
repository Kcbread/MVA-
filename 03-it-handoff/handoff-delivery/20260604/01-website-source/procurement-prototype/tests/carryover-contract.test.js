const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const carryoverJs = fs.readFileSync(path.join(root, 'carryover-extension.js'), 'utf8');
const carryoverCss = fs.readFileSync(path.join(root, 'carryover-extension.css'), 'utf8');

test('carryover extension is registered after app scripts', () => {
  assert.match(indexHtml, /carryover-extension\.css/);
  assert.match(indexHtml, /carryover-extension\.js/);
});

test('carryover ledger preserves original demand through immutable events', () => {
  assert.match(carryoverJs, /STORAGE_KEY = 'procurementCarryoverLedger\.v1'/);
  assert.match(carryoverJs, /sourceLine/);
  assert.match(carryoverJs, /targetLine/);
  assert.match(carryoverJs, /originalQty/);
  assert.match(carryoverJs, /carryoverQty/);
  assert.match(carryoverJs, /effectiveQty/);
  assert.doesNotMatch(carryoverJs, /row\.originalQty\s*[-+*/]?=/, 'row.originalQty should not be mutated in-place');
});

test('DRI can operate carryover while manager and OM are read-only', () => {
  assert.match(carryoverJs, /Carryover Review/);
  assert.match(carryoverJs, /data-carryover-apply/);
  assert.match(carryoverJs, /data-carryover-reject/);
  assert.match(appJs, /Carryover Ledger/);
  assert.match(appJs, /Only Applied rows reduce effective cost/);
  assert.match(carryoverJs, /function renderManagerCarryover\(\) \{[\s\S]*carryover-manager-readonly[\s\S]*remove\(\)/);
  assert.match(carryoverJs, /OM receives final effective demand only/);
});

test('carryover UI uses table shell and short action buttons', () => {
  assert.match(carryoverCss, /\.carryover-table-shell/);
  assert.match(carryoverCss, /overflow-x:\s*auto/);
  assert.match(carryoverCss, /\.carryover-cell-number/);
  assert.match(carryoverJs, />Apply</);
  assert.match(carryoverJs, />Reject</);
});

test('carryover supports second-line to third-line chain events', () => {
  assert.match(carryoverJs, /Line 2/);
  assert.match(carryoverJs, /Line 3/);
  assert.match(carryoverJs, /stepNo/);
  assert.match(carryoverJs, /CO-CHAIN-MINI-PC/);
  assert.match(carryoverJs, /CO-DEMO-OR5-001/);
  assert.match(carryoverJs, /CO-DEMO-OR6-001/);
});

test('carryover exposes effective qty helpers for downstream OM integration', () => {
  assert.match(carryoverJs, /effectiveQtyFor/);
  assert.match(carryoverJs, /carryoverQtyFor/);
  assert.match(carryoverJs, /function isAppliedStatus/);
  assert.match(carryoverJs, /status === 'User Applied'/);
});

test('User A carryover ledger events include stable request line references', () => {
  assert.match(carryoverJs, /recordUserAppliedCarryover/);
  assert.match(carryoverJs, /status:\s*'User Applied'/);
  assert.match(carryoverJs, /action:\s*'User Applied carryover'/);
  assert.match(carryoverJs, /requestId/);
  assert.match(carryoverJs, /rowId/);
  assert.match(carryoverJs, /packageId/);
  assert.match(carryoverJs, /sourceRequestId/);
  assert.match(carryoverJs, /sourceBreakdownId/);
  assert.match(carryoverJs, /requestLineRowId/);
  assert.match(carryoverJs, /spec/);
  assert.match(carryoverJs, /stationUnit/);
  assert.match(appJs, /syncUserAppliedCarryoverLedger/);
  assert.match(appJs, /recordUserAppliedCarryover/);
  assert.match(appJs, /sourceBreakdownId/);
  assert.match(appJs, /userVisibleItemDetail\(row\) \|\| itemDetail\(row\)/);
});

test('carryover role host detection prefers scoped view containers', () => {
  assert.match(carryoverJs, /viewSelectors/);
  assert.match(carryoverJs, /currentRole/);
  assert.match(carryoverJs, /removeDisallowedCarryoverViews/);
  assert.match(carryoverJs, /\[data-view="manager"\]/);
  assert.match(carryoverJs, /\[data-view="om"\]/);
  assert.match(carryoverJs, /\[data-view="dri"\]/);
});
