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
    /Admin/,
  ], "#roleSelect");
  await rejectText(page, "Login role labels", [/User A/, /\bManager B\b/, /Project DRI/], "#roleSelect");

  await switchRole(page, "requester", "department");
  await expectNoPageErrors(pageErrors, "Requester workspace");
  await expectText(page, "Requester workspace", [
    /Request Workspace/,
    /Add Demand Lines/,
    /Submit package to Dept DRI/,
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
  await page.getByRole("button", { name: "Add Demand Lines" }).click();
  await page.locator("#itemPickerModal:not([hidden])").waitFor();
  await expectText(page, "Requester item picker", [
    /Demand Scope/,
    /MFG: Project \/ Line → Stage → Station → Item/,
    /Non-MFG/,
    /Copy Demand/,
    /Potential Carryover/,
    /Selected Demand Lines/,
  ], "#itemPickerModal");
  await rejectText(page, "Requester item picker", [/Pick item first/], "#itemPickerModal");
  await page.evaluate(() => window.closeItemPicker?.());

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
