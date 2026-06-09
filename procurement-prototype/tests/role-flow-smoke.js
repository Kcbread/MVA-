const { chromium } = require("playwright");

function fail(message, payload) {
  throw new Error(payload ? `${message}: ${JSON.stringify(payload)}` : message);
}

async function visibleText(page, selector = "body") {
  return (await page.locator(selector).innerText()).replace(/\s+/g, " ").trim();
}

async function switchRole(page, role, view) {
  await page.evaluate(({ role, view }) => {
    window.setScreen?.("workspace");
    window.applyRole?.(role);
    if (view) window.setView?.(view);
  }, { role, view });
  await page.waitForTimeout(150);
}

async function expectText(page, label, patterns, selector = "body") {
  const text = await visibleText(page, selector);
  for (const pattern of patterns) {
    if (!pattern.test(text)) fail(`${label} missing ${pattern}`);
  }
}

async function rejectText(page, label, patterns, selector = "body") {
  const text = await visibleText(page, selector);
  for (const pattern of patterns) {
    if (pattern.test(text)) fail(`${label} should not show ${pattern}`);
  }
}

async function expectNoPageErrors(pageErrors, label) {
  if (pageErrors.length) fail(`${label} page errors`, pageErrors);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`file://${process.cwd()}/index.html`);
  await page.waitForLoadState("domcontentloaded");
  await expectText(page, "Login role labels", [
    /Requester/,
    /Cost Manager/,
    /OM Leader \(Mai\)/,
    /OM Purchasing \(Giang \/ Linh\)/,
    /Dept DRI/,
    /Budget Approver/,
    /Buyer Handoff/,
    /Admin/,
  ], "#roleSelect");
  await rejectText(page, "Login role labels", [/User A/, /\bManager B\b/, /Project DRI/], "#roleSelect");

  await switchRole(page, "requester", "department");
  await expectNoPageErrors(pageErrors, "Requester workspace");
  await expectText(page, "Requester workspace", [
    /Request Workspace/,
    /Request Worksheet/,
    /MFG/,
    /Non-MFG/,
    /Save Draft/,
    /Submit/,
  ], 'section[data-view="department"]');
  await rejectText(page, "Requester workspace", [
    /Vendor Part No\./,
    /PAS Material No/,
    /OM Leader can assign/i,
  ], 'section[data-view="department"]');
  await page.evaluate(() => {
    const row = {
      id: "ROLE-REQUESTER-PRIVACY",
      project: "P26",
      name: "Requester Privacy Item",
      detail: "Requester-safe quote summary",
      status: "Approved",
      vendor: "Hidden Vendor",
      vendorPartNo: "HIDDEN-VENDOR-CODE",
      pasMaterialNo: "HIDDEN-PAS-MAT",
      factoryMaterialNo: "HIDDEN-FACTORY-MAT",
      userAQuoteDecisionStatus: "Waiting User A Confirmation",
      quoteDate: "2026-06-04",
      quotationPdf: "quote.png",
      quotationExcel: "quote.xlsx",
      updatedPriceVnd: 1000000,
      procurementStatus: "Sent to OM Purchasing",
      omStage: "userConfirm",
    };
    renderItemDetail(row, "request");
  });
  await rejectText(page, "Requester item detail privacy", [
    /Hidden Vendor/,
    /HIDDEN-VENDOR-CODE/,
    /HIDDEN-PAS-MAT/,
    /HIDDEN-FACTORY-MAT/,
    /Assigned To/,
  ], "#itemDetailModal");
  await page.getByRole("button", { name: "Add Item", exact: true }).waitFor();
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  await page.locator("#requestItemPickerModal:not([hidden])").waitFor();
  await page.locator("#requestItemPickerRows [data-add-worksheet-source]").first().waitFor();
  await expectText(page, "Requester Add Item popup", [
    /Add/,
    /Item/,
    /Detail/,
    /Spec/,
    /Action/,
    /Catalog/,
  ], "#requestItemPickerModal");
  await rejectText(page, "Requester Add Item popup", [
    /Phase Trace/,
    /Vendor Part No\./,
    /Supplier/,
    /PAS Material No/,
    /Factory Material No/,
    /OM Assignee/i,
    /\bFTV\b/,
  ], "#requestItemPickerModal");
  await page.locator('[data-request-picker-source-tab="copy"]').click();
  await page.locator("#requestCopyDemandPanel:not([hidden])").waitFor();
  await page.locator("#historyPackageRows tr").first().waitFor();
  const beforeCopyRows = await page.locator(".request-table tbody tr[data-request-row]").count();
  const packageSelection = await page.evaluate(() => {
    const grouped = new Map();
    window.reusableHistoryRows().forEach((row) => {
      const key = window.historyPackageKey(row);
      grouped.set(key, [...(grouped.get(key) || []), row]);
    });
    const selected = [...grouped.entries()].find(([, rows]) => rows.length >= 2) || [...grouped.entries()][0];
    if (!selected) throw new Error("No Copy Demand package source rows are available.");
    const [key, rows] = selected;
    const [project, phase] = key.split("::");
    document.getElementById("historyPackageSourceProject").value = project;
    document.getElementById("historyPackageSourceProject").dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("historyPackageSourcePhase").value = phase;
    document.getElementById("historyPackageSourcePhase").dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("historyPackageSourcePackage").value = key;
    document.getElementById("historyPackageSourcePackage").dispatchEvent(new Event("change", { bubbles: true }));
    return { key, count: rows.length };
  });
  if (packageSelection.count < 2) fail("Copy Demand smoke needs a package with multiple rows", packageSelection);
  await page.locator("#historyPackageRows tr").nth(1).waitFor();
  await expectText(page, "Requester Copy Demand package picker", [
    /All source projects/,
    /All phases/,
    /All packages/,
    /Import Package/,
    /Source Qty/,
    /Source Phase Qty/,
  ], "#requestCopyDemandPanel");
  await rejectText(page, "Requester Copy Demand package picker privacy", [
    /Vendor Part No\./,
    /Supplier/,
    /PAS Material No/,
    /Factory Material No/,
    /OM Assignee/i,
    /\bFTV\b/,
  ], "#requestCopyDemandPanel");
  await page.locator('#requestCopyDemandPanel [data-action="importHistoryPackage"]').click();
  await page.locator("#requestItemPickerModal").evaluate((modal) => {
    if (!modal.hidden) throw new Error("Copy Demand import should close the Add Item popup.");
  });
  const copyDemandImport = await page.evaluate(({ beforeCount }) => {
    const rows = [...document.querySelectorAll(".request-table tbody tr[data-request-row]")];
    const firstInputs = [...(rows[0]?.querySelectorAll("[data-request-worksheet-qty]") || [])];
    return {
      beforeCount,
      afterCount: rows.length,
      firstRowQtyValues: firstInputs.map((input) => input.value),
    };
  }, { beforeCount: beforeCopyRows });
  if (copyDemandImport.afterCount <= copyDemandImport.beforeCount) fail("Copy Demand import should add worksheet rows", copyDemandImport);
  if (!copyDemandImport.firstRowQtyValues.length || copyDemandImport.firstRowQtyValues.some((value) => value !== "0")) {
    fail("Copy Demand imported target quantities should start at 0", copyDemandImport);
  }
  await expectText(page, "Requester worksheet", [
    /Item \/ Spec/,
    /P1\.0/,
    /P1\.1/,
    /EVT/,
    /Row Total/,
    /Hint/,
    /Action/,
  ], ".request-worksheet-shell");
  await rejectText(page, "Requester worksheet", [/Source Panel/, /Selected Matrix Rows/, /Pick item first/], 'section[data-view="department"]');

  await switchRole(page, "manager", "manager");
  await expectNoPageErrors(pageErrors, "Cost Manager shell");
  await expectText(page, "Cost Manager shell", [
    /Submission Monitor/,
    /Demand Analysis/,
    /Progress Tracking/,
  ], 'section[data-view="manager"]');
  await rejectText(page, "Cost Manager shell", [/Pending Approval/, /Approval Queue/], 'section[data-view="manager"]');
  await page.evaluate(() => window.setManagerTab?.("demand"));
  await expectText(page, "Cost Manager progress", [
    /Pending Owner/,
    /Current Stage/,
    /Days Pending/,
    /Next Action/,
    /Buyer Handoff/,
  ], '[data-manager-panel="demand"]');
  await rejectText(page, "Cost Manager progress", [
    /Budget Progress/,
    /PR Progress/,
    /PO Progress/,
    /Arrived Progress/,
  ], '[data-manager-panel="demand"]');
  await page.evaluate(() => {
    window.setManagerTab?.("analysis");
    window.setDemandAnalysisTab?.("costDashboard");
  });
  await expectText(page, "Cost Manager demand analysis", [
    /Demand Cost Dashboard/,
    /Station Matrix/,
    /Carryover Ledger/,
  ], '[data-manager-panel="analysis"]');
  await page.evaluate(() => {
    const row = {
      id: "ROLE-MANAGER-PRIVACY",
      project: "P26",
      name: "Cost Manager Privacy Item",
      detail: "Cost-only detail",
      status: "Approved",
      vendor: "Manager Hidden Vendor",
      vendorPartNo: "MANAGER-HIDDEN-VENDOR-CODE",
      pasMaterialNo: "MANAGER-HIDDEN-PAS-MAT",
      factoryMaterialNo: "MANAGER-HIDDEN-FACTORY-MAT",
      omAssigneeName: "Hidden OM Assignee",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "quote.png",
      quotationExcel: "quote.xlsx",
      updatedPriceVnd: 1000000,
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
    };
    renderItemDetail(row, "request");
  });
  await rejectText(page, "Cost Manager item detail privacy", [
    /Manager Hidden Vendor/,
    /MANAGER-HIDDEN-VENDOR-CODE/,
    /MANAGER-HIDDEN-PAS-MAT/,
    /MANAGER-HIDDEN-FACTORY-MAT/,
    /Hidden OM Assignee/,
    /PAS Material No/,
    /Factory Material No/,
  ], "#itemDetailModal");

  await switchRole(page, "dri", "priceReview");
  await expectNoPageErrors(pageErrors, "Dept DRI review");
  await expectText(page, "Dept DRI review", [
    /Price Review/,
    /Pending Price Review/,
    /Dept DRI/,
    /Budget Approver/,
  ], 'section[data-view="priceReview"]');
  await rejectText(page, "Dept DRI review", [/Cost Manager Dashboard/, /PAS Quote Result/], 'section[data-view="priceReview"]');

  await switchRole(page, "projectDri", "priceReview");
  await expectNoPageErrors(pageErrors, "Budget Approver review");
  await expectText(page, "Budget Approver review", [
    /Price Review/,
    /Pending Price Review/,
    /Budget Approver/,
  ], 'section[data-view="priceReview"]');
  await rejectText(page, "Budget Approver review", [/Cost Manager Dashboard/, /PAS Quote Result/], 'section[data-view="priceReview"]');

  await switchRole(page, "omLeader", "om");
  await expectNoPageErrors(pageErrors, "OM Leader");
  await expectText(page, "OM Leader", [
    /OM Purchasing/,
    /Submission Dashboard/,
    /PAS Demand No/,
    /PAS Quote Result/,
    /Export Package/,
  ], 'section[data-view="om"]');
  await rejectText(page, "OM Leader", [
    /Budget Progress/,
    /PR Progress/,
    /PO Progress/,
    /Arrived Progress/,
  ], 'section[data-view="om"]');

  await switchRole(page, "admin", "adminSetup");
  await expectNoPageErrors(pageErrors, "Admin setup");
  await expectText(page, "Admin setup", [
    /Access & Approval Setup/,
    /History Price Delta Threshold \(USD\)/,
  ], 'section[data-view="adminSetup"]');
  const approvalChain = await page.locator("#adminApprovalChain").inputValue();
  if (!/Dept DRI\s*->\s*Budget Approver/.test(approvalChain)) {
    fail("Admin approval chain is not Dept DRI -> Budget Approver", { approvalChain });
  }

  await expectNoPageErrors(pageErrors, "Role flow smoke");
  await browser.close();
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
