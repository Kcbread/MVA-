const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const ARTIFACT_DIR = path.join(ROOT, "test-artifacts", "large-data-ui-audit");
const REPORT_PATH = path.join(ARTIFACT_DIR, "large-data-ui-audit.md");
const RUN_HINT = "RUN_LARGE_DATA_UI_AUDIT=1 ./test.sh";

const VIEWPORTS = [
  { width: 1440, height: 920, label: "desktop" },
  { width: 1024, height: 768, label: "tablet" },
  { width: 390, height: 820, label: "compact" },
];

const SCENARIOS = [
  {
    role: "requester",
    roleLabel: "Requester",
    view: "department",
    label: "requester-worksheet-mfg",
    expected: [/Request Workspace/, /Request Worksheet/, /MFG/, /Non-MFG/, /Save Draft/, /Submit/, /P1\.0/, /MP/],
    forbidden: [/PAS Material No/, /Factory Material No/, /OM Assignee/i, /\bFTV\b/],
    shells: [".request-worksheet-shell"],
  },
  {
    role: "dri",
    roleLabel: "Dept DRI",
    view: "manager",
    label: "dept-dri-review",
    expected: [/Dept Review/, /Quantity Review/, /Dashboard/, /MFG Station Detail|Station Matrix/, /Non-MFG Department Detail|Station Matrix/, /Approved/, /Denied/, /Revise/],
    forbidden: [/PAS Quote Result/, /Project Setup/],
    shells: [".manager-quantity-wrap", ".demand-cost-wrap"],
  },
  {
    role: "manager",
    roleLabel: "Cost Manager",
    view: "manager",
    label: "cost-manager-review",
    expected: [/Demand Review/, /Cost Review|Demand Review/, /Demand Cost Dashboard/, /Station Matrix/, /Line Count/],
    forbidden: [/Authorized Analysis/, /Progress Tracking/, /Project Setup/],
    shells: [".manager-quantity-wrap", ".demand-cost-wrap"],
  },
  {
    role: "omLeader",
    roleLabel: "OM Leader",
    view: "om",
    tab: "submission",
    label: "om-leader-intake",
    expected: [/OM Purchasing|Intake Monitor/, /Assigned|Assignment|Exchange Rate|Quote/],
    forbidden: [/Final Approve/],
    shells: [".table-wrap"],
  },
  {
    role: "omMember",
    roleLabel: "OM Purchasing",
    view: "om",
    tab: "quoteConfirm",
    label: "om-purchasing-quote-result",
    expected: [/My Quotes|Quote Result|PAS Quote/, /PAS Material No/, /Vendor/, /Valid Until/, /Shot|Screenshot|Upload/, /Excel/],
    forbidden: [/Exchange Rate Utility/, /Final Approve/],
    shells: [".om-quote-result-wrap"],
  },
  {
    role: "projectDri",
    roleLabel: "Budget Approver",
    view: "manager",
    label: "budget-approver-review",
    expected: [/Budget Review/, /Quantity Review/, /Dashboard/, /MFG Station Detail|Station Matrix/, /Non-MFG Department Detail|Station Matrix/],
    forbidden: [/Project Setup/, /PAS Demand No/],
    shells: [".manager-quantity-wrap", ".demand-cost-wrap"],
  },
  {
    role: "buyer",
    roleLabel: "Buyer Handoff",
    view: "buyer",
    label: "buyer-handoff",
    expected: [/Buyer PR \/ PO|Buyer/, /PR|PO|Handoff|Package/],
    forbidden: [/\bDownstream\b/],
    shells: [".table-wrap"],
  },
  {
    role: "admin",
    roleLabel: "Admin",
    view: "adminSetup",
    label: "admin-setup",
    expected: [/Access & Approval Setup|Admin/, /Role|User|Mapping|Audit|Threshold/],
    forbidden: [/Approve selected demand/i],
    shells: [".table-wrap"],
  },
];

function slug(value) {
  return String(value || "audit")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function ensureArtifactDir() {
  fs.rmSync(ARTIFACT_DIR, { recursive: true, force: true });
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function rel(filePath) {
  return path.relative(ROOT, filePath);
}

async function switchScenario(page, scenario) {
  await page.evaluate(({ role, view, tab }) => {
    window.setScreen?.("workspace");
    window.applyRole?.(role);
    if (view) window.setView?.(view);
    if (tab && typeof window.setOmTab === "function") window.setOmTab(tab);
    if (role === "requester" && typeof window.setDeptTab === "function") window.setDeptTab("request");
  }, scenario);
  await page.waitForTimeout(240);
}

async function visibleText(page, selector = "body") {
  return (await page.locator(selector).innerText()).replace(/\s+/g, " ").trim();
}

async function assertPageNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth + 4) {
    throw new Error(`${label}: page-level horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
}

async function assertShellsOwnOverflow(page, selectors, label) {
  const failures = await page.evaluate((shellSelectors) => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    return shellSelectors.flatMap((selector) => [...document.querySelectorAll(selector)]
      .filter(visible)
      .slice(0, 3)
      .map((node) => {
        const style = getComputedStyle(node);
        const hasOverflow = node.scrollWidth > node.clientWidth + 4 || node.scrollHeight > node.clientHeight + 4;
        const ownsOverflow = ["auto", "scroll"].includes(style.overflowX) || ["auto", "scroll"].includes(style.overflowY) || ["auto", "scroll"].includes(style.overflow);
        return hasOverflow && !ownsOverflow ? `${selector} overflows without scroll ownership` : "";
      })
      .filter(Boolean));
  }, selectors);
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

async function assertVisibleCellsDoNotOverlap(page, label) {
  const failures = await page.evaluate(() => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    for (const table of [...document.querySelectorAll("table")].filter(visible)) {
      const tableName = table.id || table.className || "table";
      const rows = [...table.querySelectorAll("tbody tr")].filter(visible).slice(0, 12);
      rows.forEach((row, rowIndex) => {
        const cells = [...row.children].filter(visible);
        for (let index = 0; index < cells.length - 1; index += 1) {
          const leftStyle = getComputedStyle(cells[index]);
          const rightStyle = getComputedStyle(cells[index + 1]);
          if (leftStyle.position === "sticky" || rightStyle.position === "sticky") continue;
          const left = cells[index].getBoundingClientRect();
          const right = cells[index + 1].getBoundingClientRect();
          if (left.width > 0 && right.width > 0 && left.right > right.left + 1) {
            bad.push(`${tableName}: row ${rowIndex + 1} cell ${index + 1} overlaps ${index + 2}`);
          }
        }
      });
    }
    return bad.slice(0, 12);
  });
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

async function assertVisibleButtonsStayInsideCells(page, label) {
  const failures = await page.evaluate(() => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    for (const button of [...document.querySelectorAll("table button, table .btn, table a.button")].filter(visible)) {
      const cell = button.closest("td, th");
      if (!cell || !visible(cell)) continue;
      const buttonRect = button.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const label = button.textContent.trim() || button.getAttribute("title") || "button";
      if (
        buttonRect.left < cellRect.left - 1 ||
        buttonRect.right > cellRect.right + 1 ||
        buttonRect.top < cellRect.top - 1 ||
        buttonRect.bottom > cellRect.bottom + 1
      ) {
        bad.push(`${label} escapes its table cell`);
      }
    }
    return bad.slice(0, 12);
  });
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

async function assertRowHeightsAreBounded(page, label) {
  const failures = await page.evaluate(() => {
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const bad = [];
    for (const table of [...document.querySelectorAll("table")].filter(visible)) {
      const tableName = table.id || table.className || "table";
      const rows = [...table.querySelectorAll("tbody tr")].filter(visible).slice(0, 10);
      rows.forEach((row, rowIndex) => {
        const height = Math.round(row.getBoundingClientRect().height);
        if (height < 24 || height > 168) bad.push(`${tableName}: row ${rowIndex + 1} height ${height}px`);
      });
    }
    return bad.slice(0, 12);
  });
  if (failures.length) throw new Error(`${label}: ${failures.join("; ")}`);
}

async function assertRequesterStickyCell(page, label) {
  const stickyCount = await page.locator(".request-table tbody td.request-sticky-col:visible").count();
  if (!stickyCount) return;
  const audit = await page.locator(".request-table tbody td.request-sticky-col:visible").first().evaluate((cell) => ({
    background: getComputedStyle(cell).backgroundColor,
    position: getComputedStyle(cell).position,
    overflow: getComputedStyle(cell).overflow,
  }));
  if (audit.position !== "sticky" || audit.overflow !== "hidden" || !/rgb\(255,\s*255,\s*255\)/.test(audit.background)) {
    throw new Error(`${label}: requester sticky Item/Spec cell lost stable sticky styling ${JSON.stringify(audit)}`);
  }
}

async function assertTextContracts(page, scenario, label) {
  const text = await visibleText(page);
  scenario.expected.forEach((pattern) => {
    if (!pattern.test(text)) throw new Error(`${label}: missing expected ${pattern}`);
  });
  scenario.forbidden.forEach((pattern) => {
    if (pattern.test(text)) throw new Error(`${label}: forbidden visible text ${pattern}`);
  });
}

async function screenshot(page, label) {
  const filePath = path.join(ARTIFACT_DIR, `${slug(label)}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function auditScenario(page, scenario, viewport, pageErrors) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await switchScenario(page, scenario);
  const label = `${scenario.label}-${viewport.width}x${viewport.height}`;
  const checks = [];
  const runCheck = async (name, fn) => {
    try {
      await fn();
      checks.push({ name, status: "pass" });
    } catch (error) {
      checks.push({ name, status: "fail", message: error.message });
    }
  };

  await runCheck("expected/forbidden role text", () => assertTextContracts(page, scenario, label));
  await runCheck("page overflow", () => assertPageNoOverflow(page, label));
  await runCheck("table shell overflow ownership", () => assertShellsOwnOverflow(page, scenario.shells || [], label));
  await runCheck("cell overlap", () => assertVisibleCellsDoNotOverlap(page, label));
  await runCheck("button containment", () => assertVisibleButtonsStayInsideCells(page, label));
  await runCheck("row height bounds", () => assertRowHeightsAreBounded(page, label));
  if (scenario.role === "requester") await runCheck("requester sticky Item/Spec", () => assertRequesterStickyCell(page, label));
  if (pageErrors.length) checks.push({ name: "page errors", status: "fail", message: pageErrors.join("; ") });

  const shot = await screenshot(page, label);
  return { label, role: scenario.roleLabel, viewport: viewport.label, screenshot: shot, checks };
}

function scenarioSummary(results, fixtureStatus) {
  const failures = results.flatMap((result) => result.checks
    .filter((check) => check.status === "fail")
    .map((check) => ({ ...check, label: result.label, role: result.role })));
  const roleSet = [...new Set(results.map((result) => result.role))];
  return [
    "# Large Data UI Audit",
    "",
    `Command: \`${RUN_HINT}\` or \`node tests/large-data-ui-audit.js\``,
    "",
    "## Fixture",
    "",
    `- Type: mock/fixture, not real execution or UAT production data.`,
    `- Applied: ${fixtureStatus.applied ? "yes" : "no"}`,
    `- Rows: ${fixtureStatus.count || 0}`,
    `- Marker: ${fixtureStatus.marker || "quantity-bulk-v1"}`,
    "",
    "## Coverage",
    "",
    `- Roles: ${roleSet.join(", ")}`,
    `- Viewports: ${VIEWPORTS.map((item) => `${item.label} ${item.width}x${item.height}`).join("; ")}`,
    `- Screenshots: ${results.length}`,
    "",
    "## Automated Findings",
    "",
    failures.length
      ? failures.map((failure) => `- [fail] ${failure.role} / ${failure.label}: ${failure.name}: ${failure.message}`).join("\n")
      : "- No automated overflow, overlap, row-height, sticky-cell, or role text failures detected.",
    "",
    "## UI Quality Findings",
    "",
    "- Requester: check that the first focus remains the full-page worksheet, MFG/Non-MFG tabs, P1.0-MP phase groups, Need Date, Save Draft, and Submit.",
    "- Dept DRI / Cost Manager / Budget Approver: check that Dashboard-first evidence remains understandable and detail tables, not Dashboard, carry selected-row scope.",
    "- OM Leader / OM Purchasing: check that assignment, PAS Demand No, quote result, screenshot/Excel, validity, and export actions remain scannable with many rows.",
    "- Buyer Handoff: check that Buyer owns PR/PO after OM export is clear and user-facing `Downstream` text is absent.",
    "- Admin: check that setup/audit remains governance-only and does not become a business approval cockpit.",
    "",
    "## Screenshots",
    "",
    ...results.map((result) => `- ${result.role} / ${result.viewport}: \`${rel(result.screenshot)}\``),
    "",
    "## Remaining Risks",
    "",
    "- Screenshot review is qualitative; it supports UI/UX inspection but does not prove full accessibility compliance.",
    "- Axe accessibility checks remain covered by the standard accessibility smoke when available.",
    "- This audit uses fixture data; do not describe it as real UAT completion.",
    "",
  ].join("\n");
}

async function run() {
  ensureArtifactDir();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORTS[0] });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`file://${ROOT}/index.html?large-data=1`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(400);

  const fixtureStatus = await page.evaluate(() => ({
    ...(window.largeQuantityDemoModeStatus || {}),
    marker: window.ProcurementLargeQuantityFixture?.FIXTURE_MARKER || "",
  }));
  if (!fixtureStatus.applied || fixtureStatus.count < 100) {
    throw new Error(`Large data fixture did not apply: ${JSON.stringify(fixtureStatus)}`);
  }

  const results = [];
  for (const viewport of VIEWPORTS) {
    for (const scenario of SCENARIOS) {
      results.push(await auditScenario(page, scenario, viewport, pageErrors));
    }
  }

  await browser.close();
  fs.writeFileSync(REPORT_PATH, scenarioSummary(results, fixtureStatus));
  const failures = results.flatMap((result) => result.checks.filter((check) => check.status === "fail"));
  if (failures.length) {
    throw new Error(`Large data UI audit found ${failures.length} failure(s). Report: ${REPORT_PATH}`);
  }
  console.log(`Large data UI audit passed. Report: ${REPORT_PATH}`);
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
