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

test('DRI can operate carryover while Cost Manager and OM are result-only', () => {
  assert.match(carryoverJs, /Carryover Review/);
  assert.match(carryoverJs, /data-carryover-apply/);
  assert.match(carryoverJs, /data-carryover-reject/);
  assert.match(appJs, /Carryover Ledger/);
  assert.match(appJs, /Only Dept DRI approved rows reduce effective cost/);
  assert.match(carryoverJs, /function renderManagerCarryover\(\) \{[\s\S]*carryover-manager-readonly[\s\S]*remove\(\)/);
  assert.match(carryoverJs, /function renderOmCarryover\(\) \{[\s\S]*carryover-om-effective-qty[\s\S]*remove\(\)/);
  assert.doesNotMatch(carryoverJs, /Effective Qty from Dept DRI Carryover/);
});

test('carryover UI uses table shell and short action buttons', () => {
  assert.match(carryoverCss, /\.carryover-table-shell/);
  assert.match(carryoverCss, /overflow-x:\s*auto/);
  assert.match(carryoverCss, /\.carryover-cell-number/);
  assert.match(carryoverJs, />Approve</);
  assert.match(carryoverJs, />Reject</);
  assert.doesNotMatch(carryoverJs, /id="carryoverCreateForm"/);
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
  const appliedHelper = carryoverJs.slice(carryoverJs.indexOf('function isAppliedStatus'), carryoverJs.indexOf('function isPendingDriStatus'));
  assert.match(appliedHelper, /status === 'Applied'/);
  assert.doesNotMatch(appliedHelper, /Requester Applied/);
  assert.doesNotMatch(appliedHelper, /User Applied/);
});

test('carryover ledger reason is audit text and must not use summary clamp', () => {
  const ledger = appJs.slice(appJs.indexOf('function renderManagerCarryoverLedger'), appJs.indexOf('function renderManagerDemandCostUnitSummary'));
  assert.match(ledger, /cell-audit-reason/);
  assert.match(ledger, /audit-reason-text/);
  assert.doesNotMatch(ledger, /cell-note-summary[\s\S]*row\.reason/);
  assert.doesNotMatch(ledger, /cell-spec-clamp[\s\S]*row\.reason/);
});


test('Requester carryover ledger events include stable request line references', () => {
  assert.match(carryoverJs, /recordUserAppliedCarryover/);
  assert.match(carryoverJs, /status:\s*'Requester Candidate'/);
  assert.match(carryoverJs, /reviewStatus:\s*'Pending Dept DRI'/);
  assert.match(carryoverJs, /createdByRole:\s*event\.createdByRole \|\| 'Requester'/);
  assert.match(carryoverJs, /action:\s*'Requester Created carryover candidate'/);
  assert.match(carryoverJs, /source:\s*'Requester Request'/);
  assert.match(carryoverJs, /sourceProject/);
  assert.match(carryoverJs, /sourceEvidenceRequestId/);
  assert.match(carryoverJs, /targetProject/);
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
  assert.match(carryoverJs, /activeView/);
  assert.match(carryoverJs, /currentRole/);
  assert.match(carryoverJs, /removeDisallowedCarryoverViews/);
  assert.match(carryoverJs, /activeView\('manager'\)/);
  assert.match(carryoverJs, /activeView\('om'\)/);
  assert.match(carryoverJs, /activeView\('priceReview'\)/);
  assert.doesNotMatch(carryoverJs, /\[data-view="dri"\]/);
});

test('carryover review cannot be injected into requester workspace by text matching', () => {
  const hostLookup = carryoverJs.slice(carryoverJs.indexOf('function findHostForRole'), carryoverJs.indexOf('function upsertContainer'));
  assert.match(hostLookup, /if \(role === 'dri'\) preferred = activeView\('priceReview'\)/);
  assert.match(hostLookup, /if \(role === 'dri'\) return null;/);
  assert.doesNotMatch(hostLookup, /role === 'dri'[\s\S]*Dept DRI\|Budget Approver/);
  assert.doesNotMatch(hostLookup, /Request Workspace[\s\S]*Carryover Review/);
});
