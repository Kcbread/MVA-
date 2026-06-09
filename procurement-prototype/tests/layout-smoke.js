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
  await page.getByRole("heading", { name: "Request Worksheet" }).waitFor();
  await page.getByRole("button", { name: "MFG", exact: true }).waitFor();
  await page.getByRole("button", { name: "Non-MFG", exact: true }).waitFor();
  await page.getByRole("button", { name: "Add Item", exact: true }).waitFor();
  const phaseHeaderAlign = await page.locator(".request-phase-group-head", { hasText: "EVT" }).first().evaluate((header) => getComputedStyle(header).textAlign);
  if (phaseHeaderAlign !== "center") throw new Error(`Requester phase group headers should be centered, got ${phaseHeaderAlign}`);
  await assertVisibleTableCellsDoNotOverlap(page, ".request-table", "User A worksheet initial table");
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  await page.locator("#requestItemPickerModal:not([hidden])").waitFor();
  const pickerAudit = await page.locator("#requestItemPickerModal .request-item-picker-card").evaluate((card) => {
    const rect = card.getBoundingClientRect();
    const headers = [...card.querySelectorAll(".request-item-picker-table thead th")].map((th) => th.textContent.trim());
    const shell = card.querySelector(".request-item-picker-shell");
    const tabbar = card.querySelector(".request-item-picker-tabs");
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      headers,
      shellScrolls: shell ? shell.scrollWidth > shell.clientWidth || shell.scrollHeight > shell.clientHeight : false,
      tabbarFits: tabbar ? tabbar.scrollWidth <= tabbar.clientWidth + 2 : false,
      hasLevelFilters: Boolean(card.querySelector("#requestItemPickerLevel1") && card.querySelector("#requestItemPickerLevel2") && card.querySelector("#requestItemPickerLevel3")),
    };
  });
  if (pickerAudit.width < 1200) throw new Error(`Add Item popup should be wider for Detail/Spec columns, got ${pickerAudit.width}px`);
  if (!pickerAudit.height || pickerAudit.height > 920) throw new Error(`Add Item popup should stay within viewport height, got ${pickerAudit.height}px`);
  if (pickerAudit.headers.join("|") !== "Add|Item|Detail|Spec|Action") throw new Error(`Add Item popup headers mismatch: ${pickerAudit.headers.join("|")}`);
  if (!pickerAudit.hasLevelFilters) throw new Error("Add Item popup should expose Lv1 / Lv2 / Lv3 filters.");
  if (!pickerAudit.shellScrolls) throw new Error("Add Item popup table shell should own scrolling.");
  if (!pickerAudit.tabbarFits) throw new Error("Add Item popup source tabs should wrap inside their tabbar.");
  const lvFilterAudit = await page.evaluate(async () => {
    const source = window.requestWorksheetMergedSources?.("")
      .find((item) => item.type === "catalog" && (item.row.level1 || item.row.omCategoryLevel1));
    const level1 = source?.row?.level1 || source?.row?.omCategoryLevel1 || "";
    if (!level1) return { skipped: true };
    const select = document.getElementById("requestItemPickerLevel1");
    select.value = level1;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const rows = [...document.querySelectorAll("#requestItemPickerRows tr[data-request-picker-row]")];
    return {
      level1,
      rowCount: rows.length,
      firstDetail: rows[0]?.querySelector(".request-picker-detail-cell")?.textContent || "",
    };
  });
  if (lvFilterAudit.skipped) throw new Error("Add Item popup Lv filter smoke could not find a classified catalog row.");
  if (lvFilterAudit.rowCount <= 0) throw new Error(`Add Item popup Lv1 filter returned no rows for ${lvFilterAudit.level1}.`);
  if (!lvFilterAudit.firstDetail.includes(lvFilterAudit.level1)) throw new Error(`Add Item popup Detail cell should show Lv path for ${lvFilterAudit.level1}.`);
  await page.selectOption("#requestItemPickerLevel1", "");
  await page.locator("#requestItemPickerQuery").fill("IPC");
  await page.locator("#requestItemPickerRows [data-add-worksheet-source]").first().waitFor();
  const firstPickerHeader = await page.locator(".request-item-picker-table thead th").first().textContent();
  if (firstPickerHeader?.trim() !== "Add") throw new Error("Add Item popup must keep Add as the first table column.");
  const hiddenPickerHeaders = await page.locator(".request-item-picker-table thead").innerText();
  if (/Source|Phase Trace/.test(hiddenPickerHeaders)) throw new Error(`Add Item popup should not show Source or Phase Trace headers: ${hiddenPickerHeaders}`);
  await assertVisibleTableCellsDoNotOverlap(page, ".request-item-picker-table", "Add Item popup source table");
  await page.locator("#requestItemPickerRows [data-add-worksheet-source]").first().click();
  const seededRows = await page.evaluate(() => {
    if (typeof window.addWorksheetRow !== "function") throw new Error("addWorksheetRow helper is not available for worksheet smoke seeding.");
    const values = [...document.querySelectorAll("#requestItemPickerRows [data-add-worksheet-source]")]
      .map((button) => button.dataset.addWorksheetSource || "")
      .filter(Boolean)
      .slice(0, 39);
    values.forEach((value) => window.addWorksheetRow(value));
    return values.length + 1;
  });
  if (seededRows < 40) throw new Error(`Requester worksheet smoke expected 40 seeded rows, got ${seededRows}`);
  await page.locator("#requestItemPickerModal [data-action='closeRequestItemPicker']").click();
  const pickerHidden = await page.locator("#requestItemPickerModal").evaluate((modal) => modal.hidden);
  if (!pickerHidden) throw new Error("Add Item popup should close before worksheet qty entry.");
  await page.locator(".request-table [data-request-worksheet-qty]").first().waitFor();
  const renderedWorksheetRows = await page.locator(".request-table tbody tr[data-request-row]").count();
  if (renderedWorksheetRows < 40) throw new Error(`Requester worksheet should render 40 item rows, got ${renderedWorksheetRows}`);
  const stickyAudit = await page.locator(".request-worksheet-shell").evaluate((wrap) => {
    wrap.scrollLeft = 3200;
    const stickyCell = wrap.querySelector("tbody tr[data-request-row] td.request-sticky-col");
    const stack = stickyCell?.querySelector(".request-item-spec-stack");
    const spec = stickyCell?.querySelector(".request-spec-summary");
    const cellStyle = stickyCell ? getComputedStyle(stickyCell) : null;
    const stackRect = stack?.getBoundingClientRect();
    const cellRect = stickyCell?.getBoundingClientRect();
    return {
      scrollLeft: wrap.scrollLeft,
      background: cellStyle?.backgroundColor || "",
      overflow: cellStyle?.overflow || "",
      hasDivider: Boolean(stickyCell?.querySelector(".request-spec-divider")),
      specClamp: spec ? getComputedStyle(spec).webkitLineClamp : "",
      stackWithinCell: Boolean(stackRect && cellRect && stackRect.right <= cellRect.right + 1),
    };
  });
  if (stickyAudit.scrollLeft <= 0) throw new Error("Requester worksheet horizontal scroll smoke did not move the table shell.");
  if (!/rgb\(255,\s*255,\s*255\)/.test(stickyAudit.background)) throw new Error(`Sticky Item/Spec cell must be opaque white, got ${stickyAudit.background}`);
  if (stickyAudit.overflow !== "hidden") throw new Error(`Sticky Item/Spec cell must hide overflow, got ${stickyAudit.overflow}`);
  if (!stickyAudit.hasDivider) throw new Error("Item/Spec cell should include a divider between item and spec.");
  if (stickyAudit.specClamp !== "2") throw new Error(`Spec summary should clamp to 2 lines, got ${stickyAudit.specClamp}`);
  if (!stickyAudit.stackWithinCell) throw new Error("Item/Spec text stack should stay inside the sticky cell while horizontally scrolled.");
  const rowsBeforeRemove = await page.locator(".request-table tbody tr[data-request-row]").count();
  await page.locator("[data-request-worksheet-remove]").first().click();
  const confirmVisibleAfterRemove = await page.locator("#confirmModal").evaluate((modal) => !modal.hidden);
  if (confirmVisibleAfterRemove) throw new Error("Requester worksheet Remove should not open a confirmation modal.");
  const rowsAfterRemove = await page.locator(".request-table tbody tr[data-request-row]").count();
  if (rowsAfterRemove !== rowsBeforeRemove - 1) throw new Error(`Requester worksheet Remove should delete one row immediately: ${rowsBeforeRemove} -> ${rowsAfterRemove}`);
  const firstQty = page.locator(".request-table [data-request-worksheet-qty]").first();
  await firstQty.fill("-5e.7");
  const sanitizedQty = await firstQty.inputValue();
  if (sanitizedQty !== "57") throw new Error(`Worksheet qty should strip negative/decimal/scientific input, got ${sanitizedQty}`);
  await firstQty.fill("3");
  await firstQty.press("Enter");
  const focusedQtyMeta = await page.evaluate(() => ({
    isQty: Boolean(document.activeElement?.dataset?.requestWorksheetQty),
    phase: document.activeElement?.dataset?.requestWorksheetPhase || "",
    column: document.activeElement?.dataset?.requestWorksheetColumn || "",
  }));
  if (!focusedQtyMeta.isQty) throw new Error("Enter should move focus to the next worksheet qty cell.");
  await assertButtonsStayInsideCells(page, ".request-table tbody button", "User A worksheet actions");
  await assertVisibleTableCellsDoNotOverlap(page, ".request-table", "User A worksheet table");
  await page.getByRole("button", { name: "Non-MFG", exact: true }).click();
  await page.getByRole("button", { name: "Add Item", exact: true }).waitFor();
  await assertVisibleTableCellsDoNotOverlap(page, ".request-table", "User A Non-MFG worksheet");
  const worksheetScroll = await page.locator(".request-worksheet-shell").evaluate((wrap) => ({
    scrollWidth: wrap.scrollWidth,
    clientWidth: wrap.clientWidth,
  }));
  if (worksheetScroll.scrollWidth <= worksheetScroll.clientWidth) {
    throw new Error(`Requester worksheet should scroll inside table shell: ${worksheetScroll.scrollWidth} <= ${worksheetScroll.clientWidth}`);
  }
  const editDemandCount = await page.locator("[data-edit-demand]:visible").count();
  if (editDemandCount > 0) {
    await page.locator("[data-edit-demand]:visible").first().click();
    await page.locator("#demandEditorModal:not([hidden])").waitFor();
    await assertNoPageOverflow(page, "Demand Detail modal");
    await assertButtonsStayInsideCells(page, ".demand-editor-table tbody button", "Demand Detail modal");
    await assertVisibleTableCellsDoNotOverlap(page, ".demand-editor-table", "Demand Detail table");
    await assertRowHeights(page, ".demand-editor-table", { min: 36, max: 92 }, "Demand Detail row height");
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
    { width: 390, height: 820, label: "compact" },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.evaluate(() => {
      window.setScreen?.("workspace");
      window.applyRole?.("requester");
      window.setView?.("department");
    });
    await page.waitForTimeout(250);
    await assertNoPageOverflow(page, `Responsive ${viewport.label} requester workspace`);
    await page.getByRole("heading", { name: "Request Worksheet" }).waitFor();
    await page.getByRole("button", { name: "Add Item", exact: true }).waitFor();
    await assertNoPageOverflow(page, `Responsive ${viewport.label} requester worksheet`);
    await page.getByRole("button", { name: "Add Item", exact: true }).click();
    await page.locator("#requestItemPickerModal:not([hidden])").waitFor();
    await page.locator("#requestItemPickerRows [data-add-worksheet-source]").first().waitFor();
    await assertNoPageOverflow(page, `Responsive ${viewport.label} Add Item popup`);
    const responsivePickerScroll = await page.locator(".request-item-picker-shell").evaluate((wrap) => ({
      scrollWidth: wrap.scrollWidth,
      clientWidth: wrap.clientWidth,
      scrollHeight: wrap.scrollHeight,
      clientHeight: wrap.clientHeight,
    }));
    if (responsivePickerScroll.scrollWidth <= responsivePickerScroll.clientWidth && responsivePickerScroll.scrollHeight <= responsivePickerScroll.clientHeight) {
      throw new Error(`Responsive ${viewport.label} Add Item popup should scroll inside picker shell`);
    }
    await page.locator("#requestItemPickerModal [data-action='closeRequestItemPicker']").click();
    await assertButtonsStayInsideCells(page, ".request-table tbody button", `Responsive ${viewport.label} requester worksheet actions`);
    await assertVisibleTableCellsDoNotOverlap(page, ".request-table", `Responsive ${viewport.label} requester worksheet`);
    const responsiveWorksheetScroll = await page.locator(".request-worksheet-shell").evaluate((wrap) => ({
      scrollWidth: wrap.scrollWidth,
      clientWidth: wrap.clientWidth,
    }));
    if (responsiveWorksheetScroll.scrollWidth <= responsiveWorksheetScroll.clientWidth) {
      throw new Error(`Responsive ${viewport.label} requester worksheet should scroll inside table shell`);
    }
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
