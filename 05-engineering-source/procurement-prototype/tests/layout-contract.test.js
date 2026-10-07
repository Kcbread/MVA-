const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

const root = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'layout-contract.css'), 'utf8');
const appStyles = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(root, 'layout-contract.js'), 'utf8');

test('layout contract assets are loaded in html', () => {
  assert.match(indexHtml, /layout-contract\.css/);
  assert.match(indexHtml, /layout-contract\.js/);
});

test('shared table shell and table fixed rules exist', () => {
  assert.match(css, /\.table-shell/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /\.table-fixed/);
  assert.match(css, /table-layout:\s*fixed/);
});

test('action cell contract enforces stacked short-label buttons', () => {
  assert.match(css, /\.cell-action \.action-stack/);
  assert.match(css, /\.layout-action-btn/);
  assert.match(css, /\.layout-col-action/);
  assert.match(css, /width:\s*100%\s*!important/);
  assert.match(js, /explicitAuto/);
  assert.match(js, /shell-only/);
  assert.match(js, /shortenButton/);
});

test('cell classification covers identity spec note number timeline action', () => {
  assert.match(css, /\.cell-identity/);
  assert.match(css, /\.cell-spec-summary/);
  assert.match(css, /\.cell-note-summary/);
  assert.match(css, /\.cell-number/);
  assert.match(css, /\.cell-timeline/);
  assert.match(css, /\.cell-action/);
  assert.match(js, /classifyHeader/);
  assert.match(js, /ensureColgroup/);
});

test('layout contract is safe to rerun without nesting action stacks', () => {
  assert.match(js, /collapseNestedActionStacks/);
  assert.match(js, /querySelector\(['"]:scope > \.action-stack['"]\)/);
  assert.match(js, /data-layout-contract-auto/);
  assert.match(js, /data-layout-contract="auto"/);
});

test('layout contract does not decorate manager station matrix internals', () => {
  assert.match(js, /managerQuantityMatrixTable/);
  assert.match(js, /tableType !== 'matrix-table'/);
  assert.match(js, /if \(guessTableType\(table\) === 'matrix-table'\) return/);
  assert.match(css, /\.matrix-table:not\(\.manager-quantity-table\)/);
  assert.match(css, /\.manager-quantity-table\.matrix-table/);
});

test('layout contract skips manually managed tables', () => {
  assert.match(indexHtml, /request-worksheet-table" data-layout-managed="manual"/);
  assert.doesNotMatch(indexHtml, /history-item-table" data-layout-managed="manual"/);
  assert.match(js, /table\.dataset\.layoutManaged === 'manual'/);
  assert.match(js, /table\.setAttribute\(MARKER, 'manual'\)/);
  assert.doesNotMatch(css, /\.history-item-table\[data-layout-managed="manual"\]/);
  assert.match(appStyles, /\.request-worksheet-table\.matrix-table/);
});

test('identity and spec are treated differently', () => {
  assert.match(css, /\.identity-primary/);
  assert.match(css, /\.identity-secondary/);
  assert.match(css, /-webkit-line-clamp:\s*3/);
  assert.match(js, /lineMode === 'identity'/);
});

test('item quantity review popup keeps editable matrix stable inside modal', () => {
  assert.match(indexHtml, /id="itemQuantityReviewModal"/);
  assert.match(appStyles, /\.item-quantity-review-shell/);
  assert.match(appStyles, /max-height:\s*58vh/);
  assert.match(appStyles, /\.item-review-item-head/);
  assert.match(appStyles, /\.item-quantity-edit-input/);
  assert.match(appStyles, /\.item-review-qty-cell\.changed/);
  assert.match(appStyles, /\.quantity-review-mode-switch/);
  assert.match(appStyles, /\.manager-quantity-wide-table thead tr:first-child th:nth-child\(5\)/);
});
