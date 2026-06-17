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
      const cellStyle = getComputedStyle(cell);
      const isStickyCell = cellStyle.position === "sticky";
      if (
        buttonRect.left < cellRect.left - 1 ||
        buttonRect.right > cellRect.right + 1 ||
        buttonRect.top < cellRect.top - 1 ||
        buttonRect.bottom > cellRect.bottom + 1
      ) {
        overlaps.push(`button "${button.textContent.trim()}" escapes its cell`);
        continue;
      }
      // Sticky action rails intentionally remain visible over a horizontally
      // scrollable operation table. Once the button stays inside its own sticky
      // cell, that overlap is acceptable and mirrors the global UI audit.
      if (isStickyCell) continue;
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
        const leftStyle = getComputedStyle(cells[i]);
        const rightStyle = getComputedStyle(cells[i + 1]);
        if (leftStyle.position === "sticky" || rightStyle.position === "sticky") continue;
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
    pendingSavingUsd: window.managerCarryoverCostSaving?.({ status: "Requester Candidate", reviewStatus: "Pending Dept DRI", carryoverQty: 2, unitPriceUsd: 300 }),
    appliedSavingUsd: window.managerCarryoverCostSaving?.({ status: "Applied", carryoverQty: 2, unitPriceUsd: 300 }),
  }));
  if (carryoverCurrency.unitPriceVnd !== carryoverCurrency.expectedVnd || carryoverCurrency.pendingSavingUsd !== 0 || carryoverCurrency.appliedSavingUsd !== 600) {
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
  await page.getByRole("button", { name: "Add Demand Lines" }).click();
  await page.locator("#itemPickerModal:not([hidden])").waitFor();
  await page.getByRole("heading", { name: "Add Demand Lines" }).waitFor();
  await page.locator("#itemPickerDemandContext").getByText("Demand Scope", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Catalog" }).waitFor();
  await page.getByRole("button", { name: "Reuse Item" }).waitFor();
  await page.getByRole("button", { name: "Copy Demand" }).first().waitFor();
  await page.locator("#itemPickerCarryoverSuggestions").waitFor();
  await page.locator("#itemPickerModal").getByText("Selected Demand Lines", { exact: true }).waitFor();
  const sourcePanelStates = await page.locator("#itemPickerModal [data-reuse-mode-panel]").evaluateAll((panels) =>
    panels.map((panel) => ({
      mode: panel.getAttribute("data-reuse-mode-panel"),
      active: panel.classList.contains("active"),
      display: getComputedStyle(panel).display,
    }))
  );
  const visibleInactivePanel = sourcePanelStates.find((panel) => !panel.active && panel.display !== "none");
  if (visibleInactivePanel) {
    throw new Error(`Inactive source mode panel is visible: ${JSON.stringify(sourcePanelStates)}`);
  }
  const itemPickerText = await page.locator("#itemPickerModal").innerText();
  if (/Pick item/.test(itemPickerText)) {
    throw new Error("Item picker still exposes old item-first copy language.");
  }
  await assertButtonsStayInsideCells(page, ".search-table tbody button", "User A catalog search");
  await assertVisibleTableCellsDoNotOverlap(page, ".search-table", "User A catalog search table");
  await assertRowHeights(page, ".search-table", { min: 32, max: 86 }, "User A catalog search row height");
  await page.locator(".search-table tbody [data-add-record]").first().click();
  await page.locator("#itemPickerModal:not([hidden])").waitFor();
  await page.locator("#itemPickerSelectedDemandLines [data-selected-demand-qty]").first().waitFor();
  await assertButtonsStayInsideCells(page, ".selected-demand-lines-table tbody button", "Selected demand lines actions");
  await assertVisibleTableCellsDoNotOverlap(page, ".selected-demand-lines-table", "Selected demand lines table");
  await page.locator('[data-reuse-mode-tab="reuse"]').click();
  await assertButtonsStayInsideCells(page, ".history-item-table tbody button", "User A reuse by item");
  await assertVisibleTableCellsDoNotOverlap(page, ".history-item-table", "User A reuse by item table");
  await assertRowHeights(page, ".history-item-table", { min: 34, max: 72 }, "User A reuse by item row height");
  await page.locator('[data-reuse-mode-tab="package"]').click();
  await assertVisibleTableCellsDoNotOverlap(page, ".history-package-table", "User A reuse by package table");
  await assertRowHeights(page, ".history-package-table", { min: 34, max: 76 }, "User A reuse by package row height");
  await page.locator("#itemPickerCarryoverSuggestions").waitFor();
  await assertButtonsStayInsideCells(page, "#itemPickerCarryoverSuggestions button", "User A carryover suggestions");
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
  await page.evaluate(() => window.setOmTab?.("quoteConfirm"));
  await page.waitForTimeout(250);
  await assertTableHasRows(page, ".om-quote-result-table", "OM PAS Quote Result table");
  await assertNoPageOverflow(page, "OM PAS Quote Result shell");
  await assertButtonsStayInsideCells(page, ".om-quote-result-table tbody button", "OM PAS Quote Result actions");
  await assertVisibleTableCellsDoNotOverlap(page, ".om-quote-result-table", "OM PAS Quote Result table");
  await assertRowHeights(page, ".om-quote-result-table", { min: 34, max: 118 }, "OM PAS Quote Result row height");
  const quoteScroll = await page.locator(".om-quote-result-wrap").evaluate((wrap) => ({
    scrollWidth: wrap.scrollWidth,
    clientWidth: wrap.clientWidth,
  }));
  if (quoteScroll.scrollWidth <= quoteScroll.clientWidth) {
    throw new Error(`OM PAS Quote Result should scroll inside table shell: ${quoteScroll.scrollWidth} <= ${quoteScroll.clientWidth}`);
  }

  for (const viewport of [
    { width: 1024, height: 768, label: "tablet" },
    { width: 760, height: 760, label: "narrow" },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.evaluate(() => {
      window.setScreen?.("workspace");
      window.applyRole?.("requester");
      window.setView?.("department");
    });
    await page.waitForTimeout(250);
    await assertNoPageOverflow(page, `Responsive ${viewport.label} requester workspace`);
    await page.getByRole("button", { name: "Add Demand Lines" }).click();
    await page.locator("#itemPickerModal:not([hidden])").waitFor();
    await page.getByRole("heading", { name: "Add Demand Lines" }).waitFor();
    await page.locator("#itemPickerModal").getByText("Selected Demand Lines", { exact: true }).waitFor();
    await assertNoPageOverflow(page, `Responsive ${viewport.label} item picker`);
    await assertButtonsStayInsideCells(page, ".search-table tbody button", `Responsive ${viewport.label} catalog search`);
    await assertVisibleTableCellsDoNotOverlap(page, ".search-table", `Responsive ${viewport.label} catalog table`);
    await page.locator('[data-reuse-mode-tab="reuse"]').click();
    await assertButtonsStayInsideCells(page, ".history-item-table tbody button", `Responsive ${viewport.label} reuse by item`);
    await assertVisibleTableCellsDoNotOverlap(page, ".history-item-table", `Responsive ${viewport.label} reuse table`);
    await page.locator("#itemPickerCarryoverSuggestions").waitFor();
    await assertButtonsStayInsideCells(page, "#itemPickerCarryoverSuggestions button", `Responsive ${viewport.label} carryover suggestions`);
    await page.evaluate(() => window.closeItemPicker?.());
    await page.evaluate(() => {
      window.applyRole?.("manager");
      window.setView?.("manager");
      window.setManagerTab?.("analysis");
      window.setDemandAnalysisTab?.("quantity");
    });
    await page.waitForTimeout(250);
    await assertNoPageOverflow(page, `Responsive ${viewport.label} manager matrix shell`);
    await page.evaluate(() => {
      window.applyRole?.("omLeader");
      window.setView?.("om");
      window.setOmTab?.("quoteConfirm");
    });
    await page.waitForTimeout(250);
    await assertNoPageOverflow(page, `Responsive ${viewport.label} OM quote result shell`);
    await assertButtonsStayInsideCells(page, ".om-quote-result-table tbody button", `Responsive ${viewport.label} OM quote result actions`);
    await assertVisibleTableCellsDoNotOverlap(page, ".om-quote-result-table", `Responsive ${viewport.label} OM quote result table`);
  }

  await browser.close();
})();
