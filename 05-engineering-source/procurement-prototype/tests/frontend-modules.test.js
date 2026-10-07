const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const load = name => import(pathToFileURL(path.resolve('src', name)).href);

test('quantity rules can run without a DOM and retain fractional/nonnegative quantities', async () => {
  const { clampQty } = await load('demand/quantity.js');
  assert.equal(clampQty(-1), 0);
  assert.equal(clampQty('3.8'), 3.8);
  assert.equal(clampQty('bad'), 0);
});

test('name ranking and highlighted spec text preserve literal matching and HTML safety', async () => {
  const { itemNameMatchRank, itemMatchHighlight } = await load('catalog/match.js');
  assert.equal(itemNameMatchRank({ name:'USB' }, 'usb'), 1101);
  assert.equal(itemNameMatchRank({ name:'USB Hub' }, 'usb'), 101);
  assert.equal(itemNameMatchRank({ name:'Adapter', spec:'USB' }, 'usb'), 0);
  assert.equal(itemMatchHighlight('A < USB & B', 'usb'), 'A &lt; <mark>USB</mark> &amp; B');
  assert.equal(itemMatchHighlight('USB 3.0 (A)', '3.0'), 'USB <mark>3.0</mark> (A)');
});

test('legacy adapters expose live owner state and writable API hooks, not stale copies', async () => {
  const { installLegacyGlobals } = await load('compat/legacy-global.js');
  const demand = await load('demand/state.js');
  const api = await load('infrastructure/api.js');
  const target = {};
  installLegacyGlobals(target);
  const original = api.apiModeEnabled;
  const rows = [{ id:'DRAFT-module-test' }];
  target.requests = rows;
  assert.equal(demand.requests, rows);
  demand.replaceRequestsBinding([]);
  assert.deepEqual(target.requests, []);
  target.apiModeEnabled = () => 'module-test';
  assert.equal(api.apiModeEnabled(), 'module-test');
  target.apiModeEnabled = original;
});
