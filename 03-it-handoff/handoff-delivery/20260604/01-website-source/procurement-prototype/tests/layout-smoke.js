const { chromium } = require("playwright");

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function assertNoPageOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 4) {
    throw new Error(`${label}: page-level horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
}

async function assertButtonsStayInsideCells(page, selector, label) {
  const failures = await page.locator(selector).evaluateAll((buttons) => {
    const overlaps = [];
    for (const button of buttons) {
      const cell = button.closest("td, th");
      const row = button.closest("tr");
      if (!cell || !row) continue;
      const buttonRect = button.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      if (
        buttonRect.left < cellRect.left - 1 ||
        buttonRect.right > cellRect.right + 1 ||
        buttonRect.top < cellRect.top - 1 ||
        buttonRect.bottom > cellRect.bottom + 1
      ) {
        overlaps.push(`button "${button.textContent.trim()}" escapes its cell`);
        continue;
      }
      for (const other of Array.from(row.children)) {
        if (other === cell) continue;
        const otherRect = other.getBoundingClientRect();
        if (buttonRect.left < otherRect.right && buttonRect.right > otherRect.left && buttonRect.top < otherRect.bottom && buttonRect.bottom > otherRect.top) {
          overlaps.push(`button "${button.textContent.trim()}" overlaps another cell`);
          break;
        }
      }
    }
    return overlaps;
  });
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

async function assertVisibleTableCellsDoNotOverlap(page, tableSelector, label) {
  const failures = await page.locator(tableSelector).evaluate((table) => {
    const bad = [];
    for (const row of Array.from(table.querySelectorAll("tbody tr")).slice(0, 12)) {
      const cells = Array.from(row.children);
      for (let i = 0; i < cells.length - 1; i += 1) {
        const a = cells[i].getBoundingClientRect();
        const b = cells[i + 1].getBoundingClientRect();
        if (a.width <= 0 || b.width <= 0) continue;
        if (a.right > b.left + 1) bad.push(`row cell ${i + 1} overlaps ${i + 2}`);
      }
    }
    return bad;
  });
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

function assertNoPageErrors(pageErrors, label) {
  if (pageErrors.length) {
    throw new Error(`${label}: page errors detected: ${pageErrors.join("; ")}`);
  }
}

async function assertTableHasRows(page, selector, label) {
  const rowCount = await page.locator(`${selector} tbody tr`).count();
  if (rowCount <= 0) {
    throw new Error(`${label}: expected rendered rows, found ${rowCount}`);
  }
}

async function assertRowHeights(page, tableSelector, { min = 28, max = 96 } = {}, label) {
  const failures = await page.locator(tableSelector).evaluate((table, limits) => {
    const bad = [];
    for (const [index, row] of Array.from(table.querySelectorAll("tbody tr")).slice(0, 10).entries()) {
      const rect = row.getBoundingClientRect();
      if (rect.height < limits.min || rect.height > limits.max) {
        bad.push(`row ${index + 1} height ${Math.round(rect.height)}px outside ${limits.min}-${limits.max}px`);
      }
    }
    return bad;
  }, { min, max });
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const pageErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  await page.goto(`file://${process.cwd()}/index.html`);
  await page.waitForLoadState("domcontentloaded");
  assertNoPageErrors(pageErrors, "Initial load");
  const carryoverCurrency = await page.evaluate(() => ({
    unitPriceVnd: window.userCarryoverUnitPriceVnd?.({ unitPriceUsd: 300 }),
    expectedVnd: Math.round(window.amountVndFromUsd?.(300)),
    savingUsd: window.managerCarryoverCostSaving?.({ status: "User Applied", carryoverQty: 2, unitPriceUsd: 300 }),
  }));
  if (carryoverCurrency.unitPriceVnd !== carryoverCurrency.expectedVnd || carryoverCurrency.savingUsd !== 600) {
    throw new Error(`Carryover currency conversion failed: ${JSON.stringify(carryoverCurrency)}`);
  }

  await page.evaluate(() => {
    window.setScreen?.("workspace");
    window.applyRole?.("requester");
    window.setView?.("department");
  });
  await page.waitForTimeout(250);
  assertNoPageErrors(pageErrors, "User A request workspace");
  await assertNoPageOverflow(page, "User A request workspace");
  await page.locator('[data-action="openItemPicker"]').click();
  await page.locator("#itemPickerModal:not([hidden])").waitFor();
  await assertButtonsStayInsideCells(page, ".search-table tbody button", "User A catalog search");
  await assertVisibleTableCellsDoNotOverlap(page, ".search-table", "User A catalog search table");
  await assertRowHeights(page, ".search-table", { min: 32, max: 86 }, "User A catalog search row height");
  await assertButtonsStayInsideCells(page, ".history-item-table tbody button", "User A reuse by item");
  await assertVisibleTableCellsDoNotOverlap(page, ".history-item-table", "User A reuse by item table");
  await assertRowHeights(page, ".history-item-table", { min: 34, max: 72 }, "User A reuse by item row height");
  await page.locator('[data-reuse-mode-tab="package"]').click();
  await assertVisibleTableCellsDoNotOverlap(page, ".history-package-table", "User A reuse by package table");
  await assertRowHeights(page, ".history-package-table", { min: 34, max: 76 }, "User A reuse by package row height");
  await page.evaluate(() => window.closeItemPicker?.());
  await assertButtonsStayInsideCells(page, ".request-table tbody button", "User A draft items");
  await assertVisibleTableCellsDoNotOverlap(page, ".request-table", "User A draft items table");
  const editDemandCount = await page.locator("[data-edit-demand]").count();
  if (editDemandCount > 0) {
    await page.locator("[data-edit-demand]").first().click();
    await page.locator("#demandEditorModal:not([hidden])").waitFor();
    await assertNoPageOverflow(page, "Demand Breakdown modal");
    await assertButtonsStayInsideCells(page, ".demand-editor-table tbody button", "Demand Breakdown modal");
    await assertVisibleTableCellsDoNotOverlap(page, ".demand-editor-table", "Demand Breakdown table");
    await assertRowHeights(page, ".demand-editor-table", { min: 36, max: 92 }, "Demand Breakdown row height");
    await page.evaluate(() => { document.getElementById("demandEditorModal").hidden = true; });
  }

  await page.evaluate(() => {
    window.applyRole?.("manager");
    window.setView?.("manager");
  });
  await page.waitForTimeout(250);
  assertNoPageErrors(pageErrors, "Manager dashboard shell");
  await assertNoPageOverflow(page, "Manager dashboard shell");
  await assertTableHasRows(page, "#managerDemandCostTable", "Manager demand cost dashboard");
  await assertTableHasRows(page, "#managerQuantityMatrixTable", "Manager station matrix");
  await assertVisibleTableCellsDoNotOverlap(page, "#managerDemandCostTable", "Manager demand cost dashboard");

  await page.evaluate(() => {
    window.applyRole?.("omLeader");
    window.setView?.("om");
  });
  await page.waitForTimeout(250);
  assertNoPageErrors(pageErrors, "OM Purchasing shell");
  await assertNoPageOverflow(page, "OM Purchasing shell");
  await assertButtonsStayInsideCells(page, ".om-rate-utility button", "OM exchange rate utility");

  await browser.close();
})();
