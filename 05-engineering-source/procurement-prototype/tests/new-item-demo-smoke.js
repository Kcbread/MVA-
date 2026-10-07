const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const os = require('node:os');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.DEMO_BROWSER_CHANNEL ? { channel: process.env.DEMO_BROWSER_CHANNEL } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('index.html')).href);
    await page.evaluate(() => {
      setScreen('workspace'); applyRole('requester'); setView('department'); setDeptTab('request');
      openRequestItemPicker();
    });
    const checks = await page.evaluate(() => {
      const row = { name: 'Hex bolt', spec: 'M6 20mm SUS304', detail: 'Wrong description' };
      return { spec: requesterPickerSpec(row), searchable: requestWorksheetSourceHaystack(row) };
    });
    assert.equal(checks.spec, 'M6 20mm SUS304');
    assert.match(checks.searchable, /sus304/i);
    const matchFormatting = await page.evaluate(() => ({
      usb: itemMatchHighlight('USB Cable / usb 3.2', 'usb'),
      literal: itemMatchHighlight('USB (C+) <script>', '(C+)'),
      nameFirst: itemNameMatchRank({ name: 'USB cable' }, 'usb') > itemNameMatchRank({ name: 'Computer', spec: 'USB port' }, 'usb'),
    }));
    assert.equal(matchFormatting.usb, '<mark>USB</mark> Cable / <mark>usb</mark> 3.2');
    assert.equal(matchFormatting.literal, 'USB <mark>(C+)</mark> &lt;script&gt;');
    assert.equal(matchFormatting.nameFirst, true);
    const existing = await page.evaluate(() => requestItemPickerSources()[0].row);
    const specToken = existing.spec.split(/\s+/).find(token => token.length >= 4);
    await page.locator('#requestItemPickerQuery').fill(specToken);
    assert.ok(await page.locator('[data-add-worksheet-source]').count(), 'Searching specification returns suggestions');
    await page.locator('#requestItemPickerQuery').fill('');
    const before = await page.evaluate(() => requests.length);
    await page.locator('[data-add-worksheet-source]').first().click();
    assert.equal(await page.evaluate(() => requests.length), before + 1);
    await page.locator('#requestItemPickerQuery').fill('DEMO unique fixture');
    await page.locator('[data-action="startNewItemRequest"]').click();
    const nameInput = page.locator('#materialEntryStandardNameCn');
    assert.equal(await page.locator('#materialEntryLevel1').isVisible(), false);
    assert.equal(await page.locator('#materialEntryForm button[type="submit"]').isVisible(), false);
    await nameInput.fill('');
    await nameInput.pressSequentially('computer', { delay: 30 });
    assert.equal(await nameInput.inputValue(), 'computer', 'Typing must keep all letters');
    assert.equal(await nameInput.evaluate(el => el === document.activeElement), true);
    await nameInput.press('Home');
    await nameInput.press('ArrowRight');
    await nameInput.pressSequentially('XY');
    assert.equal(await nameInput.inputValue(), 'cXYomputer', 'Middle insertion preserves caret');
    await nameInput.press('Backspace');
    assert.equal(await nameInput.inputValue(), 'cXomputer');
    await nameInput.press('Enter');
    assert.equal(await page.evaluate(() => requests.length), before + 1, 'Enter in search must not create demand');
    await nameInput.fill('DEMO unique fixture');
    await page.locator('[data-action="enterNewItemDetails"]').click();
    assert.equal(await page.locator('#materialEntrySource').isVisible(), false);
    await page.locator('#materialEntryForm button[type="submit"]').click();
    assert.equal(await page.evaluate(() => requests.length), before + 1, 'Incomplete new item must not create demand');
    await page.locator('#materialEntryLevel1').selectOption({ index: 1 });
    await page.locator('#materialEntryLevel2').selectOption({ index: 1 });
    await page.locator('#materialEntryLevel3').selectOption({ index: 1 });
    assert.equal(await page.locator('#materialEntryStandardNameCn').inputValue(), 'DEMO unique fixture');
    await page.locator('#materialEntrySpec').fill('Capacity 500 ml\nMaterial: stainless steel');
    await page.locator('#materialEntryUom').selectOption('PCS');
    await page.locator('#materialEntryUseCase').fill('Demo equipment maintenance');
    assert.equal(await page.locator('#materialEntryEstimatedAmount').isVisible(), false);
    assert.equal(await page.locator('#materialEntryDifferenceField').isVisible(), false);
    await page.screenshot({ path: path.join(os.tmpdir(), 'procurement-new-item-desktop.png') });
    await page.locator('#materialEntryForm button[type="submit"]').click();
    const result = await page.evaluate(() => {
      const row = requests.find(r => r.name === 'DEMO unique fixture');
      return { row, visible: requestWorksheetRows().some(r => r.id === row?.id) };
    });
    assert.ok(result.row, 'New item reaches demand');
    assert.equal(result.row.spec, 'Capacity 500 ml\nMaterial: stainless steel');
    assert.equal(result.row.uom, 'PCS');
    assert.equal(result.row.itemMasterRequestStatus, 'Pending Material Review');
    assert.equal(result.visible, true, 'New demand appears on current worksheet');
    for (const phase of ['p10', 'p11', 'evt', 'dvt', 'pvt', 'mp']) assert.equal(Number(result.row[phase] || 0), 0);
    const newQty = page.locator(`[data-request-worksheet-qty="${result.row.id}"]`).first();
    await newQty.fill('3');
    await newQty.press('Tab');
    assert.ok(await page.evaluate(id => requests.find(r => r.id === id).stationBreakdown.some(r => r.qty === 3), result.row.id), 'New item quantity continues into demand data');
    await page.evaluate(() => openRequestItemPicker());
    await page.screenshot({ path: path.join(os.tmpdir(), 'procurement-item-search-desktop.png') });
    const actionRect = await page.locator('[data-action="startNewItemRequest"]').boundingBox();
    assert.ok(actionRect.y + actionRect.height <= 1000, 'New item action stays visible below results');
    await page.locator('#requestItemPickerQuery').fill(existing.name);
    await page.locator('[data-request-picker-source-tab="new"]').click();
    assert.equal(await page.locator('#materialEntryDifferenceField').isVisible(), false);
    assert.match(await page.locator('#materialEntrySource').innerText(), /Spec:/);
    const suggestionLayout = await page.locator('.material-duplicate-item').first().evaluate(el => ({
      firstClass: el.firstElementChild.className,
      nameBottom: el.querySelector('.material-match-name').getBoundingClientRect().bottom,
      specTop: el.querySelector('.material-match-spec').getBoundingClientRect().top,
      highlighted: Boolean(el.querySelector('.material-match-name mark')),
      detailsOpen: el.querySelector('details').open,
    }));
    assert.equal(suggestionLayout.firstClass, 'material-match-name');
    assert.ok(suggestionLayout.specTop >= suggestionLayout.nameBottom);
    assert.equal(suggestionLayout.highlighted, true);
    assert.equal(suggestionLayout.detailsOpen, false);
    await page.screenshot({ path: path.join(os.tmpdir(), 'procurement-name-spec-suggestions.png') });
    for (const level of [1, 2, 3]) assert.equal(await page.locator(`#materialEntryLevel${level}`).inputValue(), '', 'New item categories start blank');
    const useCandidate = await page.evaluate(() => materialEntryRow().duplicateCandidates[0]);
    const useCount = await page.evaluate(() => requests.length);
    await page.locator('[data-use-material-candidate]').first().click();
    const reused = await page.evaluate(() => ({ row: requests[0], count: requests.length, drafts: newItemSuggestions.length }));
    assert.equal(reused.count, useCount + 1);
    assert.equal(reused.row.name, useCandidate.name);
    assert.equal(reused.row.spec, useCandidate.spec);
    assert.equal(await page.locator('#materialEntryModal').isVisible(), false);
    await page.evaluate(() => openRequestItemPicker());
    await page.locator('#requestItemPickerQuery').fill(existing.name);
    await page.locator('[data-request-picker-source-tab="new"]').click();
    await page.locator('[data-action="backToItemSearch"]').click();
    assert.equal(await page.locator('#requestItemPickerQuery').inputValue(), existing.name);
    await page.locator('[data-request-picker-source-tab="new"]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(os.tmpdir(), 'procurement-new-item-mobile.png') });
    await page.locator('[data-action="enterNewItemDetails"]').click();
    assert.equal(await page.locator('#materialEntryTitle').innerText(), 'Create a new item');
    await page.locator('#materialEntrySpec').fill('Draft preserved after returning');
    await page.locator('[data-action="returnToItemMatches"]').click();
    assert.equal(await page.locator('#materialEntryLevel1').isVisible(), false);
    await page.locator('[data-action="enterNewItemDetails"]').click();
    assert.equal(await page.locator('#materialEntrySpec').inputValue(), 'Draft preserved after returning');
    assert.equal(await page.locator('#materialEntryModal .modal-card').evaluate(node => node.scrollWidth > node.clientWidth), false);
    assert.deepEqual(errors, []);
    console.log('PASS: search identity, existing demand, simplified new item, pending state, worksheet placement, zero quantities, mobile overflow, no runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
