const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const ARTIFACT_DIR = path.join(ROOT, "test-artifacts", "global-ui-audit");

function slug(value) {
  return String(value || "audit")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function screenshot(page, label) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const filePath = path.join(ARTIFACT_DIR, `${slug(label)}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function failWithScreenshot(page, label, message) {
  const filePath = await screenshot(page, label);
  throw new Error(`${label}: ${message}. Screenshot: ${filePath}`);
}

async function assertNoPageOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 4) {
    await failWithScreenshot(page, label, `page-level horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
}

async function assertVisibleButtonsStayInsideCells(page, label) {
  const failures = await page.evaluate(() => {
    const isVisible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    const buttons = Array.from(document.querySelectorAll("table button, table .btn, table a.button, table a.btn")).filter(isVisible);
    for (const button of buttons) {
      const cell = button.closest("td, th");
      const row = button.closest("tr");
      if (!cell || !row || !isVisible(cell)) continue;
      const cellStyle = getComputedStyle(cell);
      const isStickyCell = cellStyle.position === "sticky";
      const buttonRect = button.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const text = button.textContent.trim() || button.getAttribute("title") || "button";
      if (
        buttonRect.left < cellRect.left - 1 ||
        buttonRect.right > cellRect.right + 1 ||
        buttonRect.top < cellRect.top - 1 ||
        buttonRect.bottom > cellRect.bottom + 1
      ) {
        bad.push(`${text} escapes cell`);
        continue;
      }
      // Matrix tables intentionally keep left/right sticky cells visible over the
      // horizontal scroll area. Treat sticky overlap as valid once the button is
      // proven to stay inside its own sticky cell.
      if (isStickyCell) continue;
      for (const other of Array.from(row.children)) {
        if (other === cell || !isVisible(other)) continue;
        const otherRect = other.getBoundingClientRect();
        if (buttonRect.left < otherRect.right && buttonRect.right > otherRect.left && buttonRect.top < otherRect.bottom && buttonRect.bottom > otherRect.top) {
          bad.push(`${text} overlaps another cell`);
          break;
        }
      }
    }
    return bad.slice(0, 10);
  });
  if (failures.length) await failWithScreenshot(page, label, failures.join("; "));
}

async function assertVisibleTableCellsDoNotOverlap(page, label) {
  const failures = await page.evaluate(() => {
    const isVisible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    const tables = Array.from(document.querySelectorAll("table")).filter(isVisible);
    for (const table of tables) {
      const tableName = table.id || table.className || "table";
      const rows = Array.from(table.querySelectorAll("tbody tr")).filter(isVisible).slice(0, 10);
      for (const [rowIndex, row] of rows.entries()) {
        const cells = Array.from(row.children).filter(isVisible);
        for (let index = 0; index < cells.length - 1; index += 1) {
          const left = cells[index].getBoundingClientRect();
          const right = cells[index + 1].getBoundingClientRect();
          if (left.width <= 0 || right.width <= 0) continue;
          const leftStyle = getComputedStyle(cells[index]);
          const rightStyle = getComputedStyle(cells[index + 1]);
          if (leftStyle.position === "sticky" || rightStyle.position === "sticky") continue;
          if (left.right > right.left + 1) {
            bad.push(`${tableName}: row ${rowIndex + 1} cell ${index + 1} overlaps ${index + 2}`);
          }
        }
      }
    }
    return bad.slice(0, 10);
  });
  if (failures.length) await failWithScreenshot(page, label, failures.join("; "));
}

async function assertIdentitySecondaryVisible(page, label) {
  const failures = await page.evaluate(() => {
    const isVisible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    const secondaries = Array.from(document.querySelectorAll("td .identity-secondary, th .identity-secondary")).filter(isVisible);
    for (const secondary of secondaries) {
      const cell = secondary.closest("td, th");
      const primary = secondary.closest(".identity-block")?.querySelector(".identity-primary");
      if (!cell || !isVisible(cell)) continue;
      const cellRect = cell.getBoundingClientRect();
      const secondaryRect = secondary.getBoundingClientRect();
      const labelText = `${primary?.textContent.trim() || "identity"} / ${secondary.textContent.trim()}`;
      if (
        secondaryRect.top < cellRect.top - 1 ||
        secondaryRect.bottom > cellRect.bottom + 1 ||
        secondaryRect.height < 8
      ) {
        bad.push(`${labelText} second line clipped`);
      }
    }
    return bad.slice(0, 10);
  });
  if (failures.length) await failWithScreenshot(page, label, failures.join("; "));
}

async function assertReadableSpecSummaries(page, label) {
  const failures = await page.evaluate(() => {
    const isVisible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    const specs = Array.from(document.querySelectorAll("td.cell-spec-summary, td.cell-spec, td .spec-summary, td .cell-spec-clamp")).filter(isVisible);
    for (const spec of specs.slice(0, 80)) {
      const cell = spec.closest("td");
      if (!cell) continue;
      const text = spec.textContent.replace(/\s+/g, " ").trim();
      if (text.length > 24 && !(cell.getAttribute("title") || spec.getAttribute("title"))) {
        bad.push(`${text.slice(0, 32)}... missing title/detail trace`);
      }
    }
    return bad.slice(0, 10);
  });
  if (failures.length) await failWithScreenshot(page, label, failures.join("; "));
}

async function auditVisiblePage(page, label) {
  await page.waitForTimeout(120);
  await assertNoPageOverflow(page, label);
  await assertVisibleButtonsStayInsideCells(page, label);
  await assertVisibleTableCellsDoNotOverlap(page, label);
  await assertIdentitySecondaryVisible(page, label);
  await assertReadableSpecSummaries(page, label);
}

async function switchRole(page, role, view) {
  await page.evaluate(({ role, view }) => {
    window.setScreen?.("workspace");
    window.applyRole?.(role);
    if (view) window.setView?.(view);
  }, { role, view });
}

async function run() {
  fs.rmSync(ARTIFACT_DIR, { recursive: true, force: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`file://${ROOT}/index.html`);
  await page.waitForLoadState("domcontentloaded");
  await auditVisiblePage(page, "login");

  await switchRole(page, "requester", "department");
  await auditVisiblePage(page, "user-a-request-workspace");
  await page.locator('[data-action="openItemPicker"]').click();
  await page.locator("#itemPickerModal:not([hidden])").waitFor();
  await auditVisiblePage(page, "user-a-item-picker-catalog-and-reuse-item");
  await page.locator('[data-reuse-mode-tab="package"]').click();
  await auditVisiblePage(page, "user-a-item-picker-reuse-package");
  await page.evaluate(() => window.closeItemPicker?.());
  const editDemandCount = await page.locator("[data-edit-demand]").count();
  if (editDemandCount > 0) {
    await page.locator("[data-edit-demand]").first().click();
    await page.locator("#demandEditorModal:not([hidden])").waitFor();
    await auditVisiblePage(page, "user-a-demand-breakdown-modal");
    await page.evaluate(() => window.closeDemandEditor?.());
  }
  await page.evaluate(() => window.setDeptTab?.("needConfirmation"));
  await auditVisiblePage(page, "user-a-action-required");
  await page.evaluate(() => window.setDeptTab?.("submissions"));
  await auditVisiblePage(page, "user-a-request-status");

  await switchRole(page, "manager", "manager");
  await page.evaluate(() => window.setManagerTab?.("review"));
  await auditVisiblePage(page, "manager-approval");
  await page.evaluate(() => { window.setManagerTab?.("analysis"); window.setDemandAnalysisTab?.("costDashboard"); });
  await auditVisiblePage(page, "manager-demand-analysis-cost-dashboard");
  await page.evaluate(() => { window.setManagerTab?.("analysis"); window.setDemandAnalysisTab?.("quantity"); });
  await auditVisiblePage(page, "manager-demand-analysis-station-matrix");
  await page.evaluate(() => window.setManagerTab?.("demand"));
  await auditVisiblePage(page, "manager-progress-tracking");
  await page.evaluate(() => window.setManagerTab?.("setup"));
  await auditVisiblePage(page, "manager-project-setup");

  for (const role of ["omLeader", "omMember"]) {
    await switchRole(page, role, "om");
    for (const tab of ["submission", "pasRequest", "quoteConfirm", "finalExport"]) {
      await page.evaluate((tabName) => window.setOmTab?.(tabName), tab);
      await auditVisiblePage(page, `${role}-${tab}`);
    }
  }

  for (const role of ["dri", "projectDri"]) {
    await switchRole(page, role, "priceReview");
    await auditVisiblePage(page, `${role}-pending-price-review`);
    await page.evaluate(() => window.setPriceReviewTab?.("history"));
    await auditVisiblePage(page, `${role}-review-history`);
  }

  await switchRole(page, "admin", "adminSetup");
  await auditVisiblePage(page, "admin-access-approval-setup");

  if (pageErrors.length) {
    await failWithScreenshot(page, "page-errors", `page errors detected: ${pageErrors.join("; ")}`);
  }

  await browser.close();
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
