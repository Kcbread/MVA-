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

async function clickPriceReviewSelection(page, requestId) {
  await page.evaluate((id) => {
    const selectors = [
      `[data-price-review-select="${CSS.escape(id)}"]`,
      `[data-price-review-select-row="${CSS.escape(id)}"]`,
      `[data-price-review-select-cell="${CSS.escape(id)}"]`,
    ];
    const node = selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
      .find((item) => item.offsetParent !== null);
    if (!node) throw new Error(`No visible price review selection for ${id}`);
    node.click();
  }, requestId);
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
  await page.locator('[data-request-phase-jump="evt"]').click();
  await page.waitForTimeout(500);
  const phaseJumpState = await page.evaluate(() => ({
    activePhase: document.querySelector(".phase-jump-chip.active")?.dataset.requestPhaseJump || "",
    scrollLeft: Math.round(document.querySelector(".request-worksheet-shell")?.scrollLeft || 0),
    navCurrent: window.ProcurementApp?.modules?.horizontalTableNavigator?.currentGroup?.("requestWorksheet")?.currentGroupId || "",
  }));
  if (phaseJumpState.activePhase !== "evt" || phaseJumpState.scrollLeft <= 0 || phaseJumpState.navCurrent !== "evt") {
    fail("Requester worksheet phase jump did not switch to EVT", phaseJumpState);
  }

  const quantitySmoke = await page.evaluate(() => {
    window.setScreen?.("workspace");
    window.applyRole?.("requester");
    window.setView?.("department");
    window.setDeptTab?.("request");
    const phases = ["p10", "p11", "evt", "dvt", "pvt", "mp"];
    const stations = ["CG", "BG", "FATP", "Test", "Hybrid", "Auto", "ENG Pack", "Zombie", "CG", "BG"];
    const units = ["FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "IT", "FAC"];
    const now = new Date().toISOString();
    const buildSubmittedQuantityRow = ({ index, project, itemName, itemDetailText }) => {
      const projectKey = project.replace(/[^A-Z0-9]/gi, "");
      const record = {
        id: `ROLE-DRI-QTY-SOURCE-BULK-${projectKey}-${index}`,
        project,
        name: itemName,
        detail: itemDetailText,
        spec: `Requester submitted mixed station and department demand ${index}`,
        department: "MFG",
        unitPriceVnd: 7600000 + (index * 100000),
        estimatedUnitPriceVnd: 7600000 + (index * 100000),
        source: "role-flow-smoke",
      };
      const mfgBreakdown = stations.map((station, offset) => createStationBreakdownEntry(record, {
        id: `ROLE-DRI-QTY-${projectKey}-${index}-MFG-${offset}`,
        phase: phases[offset % phases.length],
        demandType: "MFG",
        station,
        requestLine: `Line ${(offset % 2) + 1}`,
        qty: index + offset + 1,
        requesterDept: "MFG",
        demandDepartment: "MFG",
      }));
      const nonMfgBreakdown = units.map((unit, offset) => createStationBreakdownEntry({ ...record, department: unit }, {
        id: `ROLE-DRI-QTY-${projectKey}-${index}-NONMFG-${offset}`,
        phase: phases[(offset + 2) % phases.length],
        demandType: "Non-MFG",
        station: "",
        demandUnit: unit,
        requestLine: `Line ${(offset % 2) + 1}`,
        qty: index + offset + 2,
        requesterDept: unit,
        demandDepartment: unit,
      }));
      const draft = requestFromRecord(record, {
        project,
        projectType: "G",
        phase: "p10",
        defaultPhase: "p10",
        demandType: "MFG",
        station: "CG",
        requestLine: "Line 1",
        stationBreakdown: [...mfgBreakdown, ...nonMfgBreakdown],
      });
      const submitted = syncRowPhaseQtyFromStationBreakdown(normalizeRequestDemandDepartment({
        ...draft,
        id: `ROLE-DRI-QTY-SUBMITTED-${projectKey}-${index}`,
        status: "Submitted",
        selected: false,
        ...deptDriSubmissionReviewPatch(now),
        submittedAt: now,
        submittedBy: "Requester QA",
        needDate: `2026-07-${10 + index}`,
        requiredDeliveryDate: `2026-07-${10 + index}`,
        requiredDeliveryDateDri: `2026-07-${10 + index}`,
        requestPackageId: `PKG-ROLE-DRI-QTY-${projectKey}-${index}`,
        requestPackageLabel: `${project} Demand Package ${index}`,
      }, "MFG"));
      return submitted;
    };
    const p26Rows = [1, 2, 3].map((index) => buildSubmittedQuantityRow({
      index,
      project: "P26",
      itemName: `Dept DRI Quantity Smoke Item ${index}`,
      itemDetailText: `Smoke-test item ${index} with MFG and Non-MFG demand`,
    }));
    const crossProjectRows = [
      buildSubmittedQuantityRow({
        index: 4,
        project: "P25",
        itemName: "Dept DRI Quantity Smoke P25 Item",
        itemDetailText: "P25 simultaneous mixed MFG and Non-MFG demand",
      }),
      buildSubmittedQuantityRow({
        index: 5,
        project: "OR5",
        itemName: "Dept DRI Quantity Smoke OR5 Item",
        itemDetailText: "OR5 simultaneous mixed MFG and Non-MFG demand",
      }),
    ];
    const rows = [...p26Rows, ...crossProjectRows];
    requests = requests
      .filter((item) => !String(item.sourceRecordId || "").startsWith("ROLE-DRI-QTY-SOURCE-BULK"))
      .concat(rows);
    renderDepartment();
    const summaries = rows.map((row) => {
      const breakdown = row.stationBreakdown || [];
      const mfg = breakdown.filter((entry) => entry.demandType === "MFG");
      const nonMfg = breakdown.filter((entry) => entry.demandType === "Non-MFG");
      const phaseSet = [...new Set(breakdown.map((entry) => entry.phase))];
      const unitSet = [...new Set(nonMfg.map((entry) => entry.demandUnit))];
      const lineSet = [...new Set(breakdown.map((entry) => entry.requestLine).filter(Boolean))];
      return {
        id: row.id,
        project: row.project,
        name: row.name,
        department: row.department,
        requesterDept: row.requesterDept,
        demandDepartment: row.demandDepartment,
        mfgEntryCount: mfg.length,
        nonMfgEntryCount: nonMfg.length,
        phaseCount: phaseSet.length,
        unitCount: unitSet.length,
        lineCount: lineSet.length,
        mfgTotal: mfg.reduce((sum, entry) => sum + Number(entry.qty || 0), 0),
        nonMfgTotal: nonMfg.reduce((sum, entry) => sum + Number(entry.qty || 0), 0),
        fatpTeQty: nonMfg.filter((entry) => entry.demandUnit === "FATP TE").reduce((sum, entry) => sum + Number(entry.qty || 0), 0),
        totalQty: breakdown.reduce((sum, entry) => sum + Number(entry.qty || 0), 0),
      };
    });
    const p26Summaries = summaries.filter((row) => row.project === "P26");
    return {
      rows: p26Summaries,
      allRows: summaries,
      submittedMfgRequest: p26Summaries[0],
      submittedNonMfgRequest: p26Summaries[0],
      secondaryRequest: p26Summaries[1],
      p25Request: summaries.find((row) => row.project === "P25"),
      or5Request: summaries.find((row) => row.project === "OR5"),
    };
  });
  if (quantitySmoke.rows.length !== 3) fail("Requester QA seed should create 3 submitted items", quantitySmoke);
  if (quantitySmoke.allRows.length !== 5 || !quantitySmoke.p25Request || !quantitySmoke.or5Request) {
    fail("Requester QA seed should create simultaneous P26, P25, and OR5 submitted items", quantitySmoke);
  }
  for (const row of quantitySmoke.rows) {
    if (row.mfgEntryCount !== 10 || row.nonMfgEntryCount !== 10 || row.phaseCount < 4 || row.unitCount < 8 || row.lineCount < 2) {
      fail("Requester QA seed did not preserve 10 MFG and 10 Non-MFG rows across phases/departments/lines", row);
    }
  }
  const submittedMfgRequest = quantitySmoke.submittedMfgRequest;
  const submittedNonMfgRequest = quantitySmoke.submittedNonMfgRequest;
  const secondaryRequest = quantitySmoke.secondaryRequest;
  const p25Request = quantitySmoke.p25Request;
  const or5Request = quantitySmoke.or5Request;

  await switchRole(page, "manager", "manager");
  await expectNoPageErrors(pageErrors, "Cost Manager shell");
	await expectText(page, "Cost Manager shell", [
	  /Cost Review/,
	  /Review History/,
	  /Quantity Review/,
	  /Request ID/,
	  /Dashboard/,
	  /Demand Cost Dashboard/,
	  /Station Matrix/,
	  /Line Count/,
	  /All lines/,
	], 'section[data-view="manager"]');
  await rejectText(page, "Cost Manager shell", [
    /Submission Monitor/,
    /Authorized Analysis/,
    /Progress Tracking/,
    /Project Setup/,
    /Pending Approval/,
    /Approval Queue/,
  ], 'section[data-view="manager"]');
		await page.evaluate(() => window.setManagerTab?.("analysis"));
		await expectText(page, "Cost Manager invalid tab fallback", [
			  /Quantity Review/,
			  /Dashboard/,
			  /Demand Cost Dashboard/,
			  /Station Matrix/,
		], 'section[data-view="manager"]');
  const managerContextSwitchState = await page.evaluate(() => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const chips = [...document.querySelectorAll("#managerQueue [data-manager-select]")].filter(visible);
    const target = chips[1] || chips[0];
    target?.click();
    return {
      chipCount: chips.length,
      selectedText: text(target),
      activeDashboardRows: [...document.querySelectorAll("#managerDemandCostRows tr.active-row")]
        .filter(visible)
        .map(text),
      duplicateEvidenceHidden: document.getElementById("managerAuthorizedAnalysis")?.hidden,
      dashboardText: text(document.getElementById("managerDemandCostTable")),
    };
  });
  if (managerContextSwitchState.chipCount && !managerContextSwitchState.activeDashboardRows.length) {
    fail("Cost Manager Demand Analysis did not highlight the selected dashboard row", managerContextSwitchState);
  }
  if (!managerContextSwitchState.duplicateEvidenceHidden || !managerContextSwitchState.dashboardText.includes("Request ID")) {
    fail("Cost Manager review did not use embedded Demand Analysis baseline", managerContextSwitchState);
  }
  const managerLineFilterState = await page.evaluate(() => {
    const projectFilter = document.getElementById("managerDemandCostProjectFilter");
    const lineFilter = document.getElementById("managerDemandCostLineFilter");
    const lineCount = document.getElementById("managerDemandCostLineCount");
    const matrixLineFilter = document.getElementById("managerQuantityLineFilter");
    if (projectFilter) {
      projectFilter.value = "P26";
      projectFilter.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (lineCount) lineCount.value = "2";
    const options = [...(lineFilter?.options || [])].map((option) => option.value).filter(Boolean);
    const collect = (line) => {
      if (lineFilter) {
        lineFilter.value = line;
        lineFilter.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return {
        line,
        lineCount: lineCount?.value || "",
        matrixLine: matrixLineFilter?.value || "",
        dashboardRows: window.managerDemandCostRows?.().map((row) => ({
          id: row.requestId,
          qty: row.qty,
          units: row.unitTotals,
        })) || [],
        matrixGroups: window.managerQuantityGroups?.().map((row) => ({
          id: row.requestId,
          qty: row.totalQty,
          phases: row.phaseTotals,
        })) || [],
      };
    };
    return {
      options,
      line1: collect("Line 1"),
      line2: collect("Line 2"),
    };
  });
  if (!managerLineFilterState.options.includes("Line 1") || !managerLineFilterState.options.includes("Line 2")) {
    fail("Cost Manager Line filter did not expose P26 Line 1 / Line 2", managerLineFilterState);
  }
  if (managerLineFilterState.line1.lineCount !== "2" || managerLineFilterState.line2.lineCount !== "2") {
    fail("Cost Manager Line filter replaced or reset Line Count multiplier", managerLineFilterState);
  }
  if (managerLineFilterState.line1.matrixLine !== "Line 1" || managerLineFilterState.line2.matrixLine !== "Line 2") {
    fail("Cost Manager Demand Dashboard did not sync Line filter into Station Matrix", managerLineFilterState);
  }
  if (JSON.stringify(managerLineFilterState.line1.dashboardRows) === JSON.stringify(managerLineFilterState.line2.dashboardRows)
    || JSON.stringify(managerLineFilterState.line1.matrixGroups) === JSON.stringify(managerLineFilterState.line2.matrixGroups)) {
    fail("Cost Manager P26 Line 1 and Line 2 did not produce different Demand Analysis scopes", managerLineFilterState);
  }
  await page.evaluate(() => window.setManagerTab?.("history"));
  await expectText(page, "Cost Manager history", [
    /Cost Review History/,
    /Cost Manager Decision/,
  ], '[data-manager-panel="history"]');
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
    /Review Queue/,
    /Project Review/,
    /Item Switcher/,
    new RegExp(submittedMfgRequest.id),
    /Dept DRI Quantity Smoke Item 1/,
    /Dept DRI Quantity Smoke Item 2/,
    /Dept DRI Quantity Smoke Item 3/,
    /Dept DRI Quantity Smoke P25 Item/,
    /Dept DRI Quantity Smoke OR5 Item/,
    /Dept DRI/,
    /Budget Approver/,
  ], 'section[data-view="priceReview"]');
  await rejectText(page, "Dept DRI review", [
	    /Dept Review Workbench/,
	    /Dept Review Triage/,
	    /Carryover Review\s+Dept DRI reviews requester stock\/carryover candidates/,
	    /Cost Manager Dashboard/,
	    /PAS Quote Result/,
      /Project Item Matrix Overview/,
	  ], 'section[data-view="priceReview"]');
  await clickPriceReviewSelection(page, secondaryRequest.id);
  await page.waitForTimeout(200);
  const switchedItemState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      activePriceReviewTab: [...document.querySelectorAll('[data-price-review-tab].active')]
        .map((el) => el.dataset.priceReviewTab || ""),
      activeTab: [...document.querySelectorAll('[data-approval-quantity-tab].active')]
        .filter(visible)
        .map((el) => el.dataset.approvalQuantityTab || ""),
      contextTitle: text(document.getElementById("priceReviewInlineAnalysis")),
      dashboard: text(document.getElementById("priceReviewInlineDemandCostRows")),
      activeDashboardRows: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
        .filter(visible)
        .map(text),
      requestId,
    };
  }, secondaryRequest.id);
  if (!switchedItemState.activePriceReviewTab.includes("pending") || !switchedItemState.activeTab.includes("dashboard")) {
    fail("Dept DRI row selection should stay in Review Queue Project Context Dashboard", switchedItemState);
  }
  if (!switchedItemState.contextTitle.includes("Project Context")) {
    fail("Dept DRI Review Queue did not show Project Context below the queue", switchedItemState);
  }
  if (!["Dept DRI Quantity Smoke Item 1", "Dept DRI Quantity Smoke Item 2", "Dept DRI Quantity Smoke Item 3"].every((item) => switchedItemState.dashboard.includes(item))) {
    fail("Dept DRI Dashboard did not keep all project items visible after row selection", switchedItemState);
  }
  if (switchedItemState.dashboard.includes("Dept DRI Quantity Smoke P25 Item") || switchedItemState.dashboard.includes("Dept DRI Quantity Smoke OR5 Item")) {
    fail("Dept DRI P26 Dashboard should not mix simultaneous P25/OR5 items", switchedItemState);
  }
  if (!switchedItemState.dashboard.includes("Line 1 / Line 2")) {
    fail("Dept DRI Dashboard did not show the P26 multi-line summary for each item", switchedItemState);
  }
  if (!switchedItemState.activeDashboardRows.some((text) => text.includes("Dept DRI Quantity Smoke Item 2"))) {
    fail("Dept DRI Dashboard did not highlight the selected item", switchedItemState);
  }
  await page.locator('#priceReviewInlineAnalysis [data-approval-quantity-tab="nonMfg"]').click();
  await page.waitForTimeout(200);
  const manualNonMfgState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      title: text(document.getElementById("priceReviewInlineQuantityTitle")),
      helper: text(document.getElementById("priceReviewInlineQuantityHelper")),
      scope: text(document.getElementById("priceReviewInlineQuantityScope")),
      head: text(document.getElementById("priceReviewInlineQuantityHead")),
      body: text(document.getElementById("priceReviewInlineQuantityRows")),
      dashboardHidden: document.querySelector("#priceReviewInlineAnalysis [data-approval-quantity-panel='dashboard']")?.hidden || false,
      matrixVisible: !!document.querySelector("#priceReviewInlineAnalysis [data-approval-quantity-panel='matrix']") && !document.querySelector("#priceReviewInlineAnalysis [data-approval-quantity-panel='matrix']").hidden,
      activeTab: [...document.querySelectorAll('[data-approval-quantity-tab].active')]
        .filter(visible)
        .map((el) => el.dataset.approvalQuantityTab || ""),
      requestId,
    };
  }, secondaryRequest.id);
  if (!manualNonMfgState.activeTab.includes("nonMfg") || manualNonMfgState.title !== "Non-MFG Department Detail") {
    fail("Dept DRI manual Non-MFG tab did not render the Non-MFG detail view", manualNonMfgState);
  }
  if (manualNonMfgState.scope.includes("CG") || manualNonMfgState.scope.includes("P1.0 / CG")) {
    fail("Dept DRI manual Non-MFG tab carried over an MFG station scope", manualNonMfgState);
  }
  if (!manualNonMfgState.head.includes("P1.0") || !manualNonMfgState.head.includes("MP") || manualNonMfgState.head.includes("CG") || !manualNonMfgState.head.includes("Non-MFG Department")) {
    fail("Dept DRI manual Non-MFG tab did not show multi-phase department detail", manualNonMfgState);
  }
  if (!manualNonMfgState.dashboardHidden || !manualNonMfgState.matrixVisible) {
    fail("Dept DRI detail tab should hide Dashboard and show only the detail matrix", manualNonMfgState);
  }
  if (!manualNonMfgState.body.includes(secondaryRequest.id)) {
    fail("Dept DRI manual Non-MFG detail did not stay scoped to the selected item", manualNonMfgState);
  }
  if (!manualNonMfgState.body.match(/\b[1-9][0-9]*\b/)) {
    fail("Dept DRI manual Non-MFG detail did not show requester Non-MFG quantities", manualNonMfgState);
  }
  await clickPriceReviewSelection(page, submittedMfgRequest.id);
  await page.waitForTimeout(200);
  const mixedItemSelectionState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      activeTab: [...document.querySelectorAll('[data-approval-quantity-tab].active')]
        .filter(visible)
        .map((el) => el.dataset.approvalQuantityTab || ""),
      dashboardHidden: document.querySelector("#priceReviewInlineAnalysis [data-approval-quantity-panel='dashboard']")?.hidden || false,
      matrixHidden: document.querySelector("#priceReviewInlineAnalysis [data-approval-quantity-panel='matrix']")?.hidden || false,
      dashboard: text(document.getElementById("priceReviewInlineDemandCostRows")),
      activeDashboardRows: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
        .filter(visible)
        .map(text),
      requestId,
    };
  }, submittedMfgRequest.id);
  if (!mixedItemSelectionState.activeTab.includes("dashboard") || mixedItemSelectionState.dashboardHidden || !mixedItemSelectionState.matrixHidden) {
    fail("Dept DRI mixed MFG/Non-MFG item selection should return to Dashboard overview", mixedItemSelectionState);
  }
  if (!["Dept DRI Quantity Smoke Item 1", "Dept DRI Quantity Smoke Item 2", "Dept DRI Quantity Smoke Item 3"].every((item) => mixedItemSelectionState.dashboard.includes(item))) {
    fail("Dept DRI mixed item Dashboard overview did not keep all P26 items visible", mixedItemSelectionState);
  }
  if (!mixedItemSelectionState.activeDashboardRows.some((text) => text.includes("Dept DRI Quantity Smoke Item 1"))) {
    fail("Dept DRI mixed item Dashboard overview did not highlight the clicked item", mixedItemSelectionState);
  }
  const p25ProjectChip = page.locator('#priceReviewInlineAnalysis [data-project-context-project="P25"]').first();
  if (await p25ProjectChip.count()) {
    await p25ProjectChip.click();
    await page.waitForTimeout(200);
    const p25ProjectSwitchState = await page.evaluate(() => {
      const visible = (el) => !!el && el.offsetParent !== null;
      const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
      return {
        activeProjectChip: [...document.querySelectorAll("#priceReviewInlineAnalysis .project-context-chip.active")]
          .filter(visible)
          .map(text),
        dashboard: text(document.getElementById("priceReviewInlineDemandCostRows")),
        scope: text(document.getElementById("priceReviewInlineDemandCostScope")),
        activeDashboardRows: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
          .filter(visible)
          .map(text),
      };
    });
    if (!p25ProjectSwitchState.activeProjectChip.includes("P25") || !p25ProjectSwitchState.scope.includes("P25")) {
      fail("Dept DRI Project Context project switcher did not activate P25", p25ProjectSwitchState);
    }
    if (!p25ProjectSwitchState.dashboard.includes("Dept DRI Quantity Smoke P25 Item") || p25ProjectSwitchState.dashboard.includes("Dept DRI Quantity Smoke Item 1") || p25ProjectSwitchState.dashboard.includes("Dept DRI Quantity Smoke OR5 Item")) {
      fail("Dept DRI Project Context project switcher did not isolate the P25 dashboard", p25ProjectSwitchState);
    }
    if (!p25ProjectSwitchState.activeDashboardRows.some((text) => text.includes("Dept DRI Quantity Smoke P25 Item"))) {
      fail("Dept DRI Project Context project switcher did not highlight a P25 review item", p25ProjectSwitchState);
    }
  } else {
    fail("Dept DRI Project Context did not render a P25 project switcher chip");
  }
  const or5ProjectChip = page.locator('#priceReviewInlineAnalysis [data-project-context-project="OR5"]').first();
  if (await or5ProjectChip.count()) {
    await or5ProjectChip.click();
    await page.waitForTimeout(200);
    const or5ProjectSwitchState = await page.evaluate(() => {
      const visible = (el) => !!el && el.offsetParent !== null;
      const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
      return {
        activeProjectChip: [...document.querySelectorAll("#priceReviewInlineAnalysis .project-context-chip.active")]
          .filter(visible)
          .map(text),
        dashboard: text(document.getElementById("priceReviewInlineDemandCostRows")),
        scope: text(document.getElementById("priceReviewInlineDemandCostScope")),
        activeDashboardRows: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
          .filter(visible)
          .map(text),
      };
    });
    if (!or5ProjectSwitchState.activeProjectChip.includes("OR5") || !or5ProjectSwitchState.scope.includes("OR5")) {
      fail("Dept DRI Project Context project switcher did not activate OR5", or5ProjectSwitchState);
    }
    if (!or5ProjectSwitchState.dashboard.includes("Dept DRI Quantity Smoke OR5 Item") || or5ProjectSwitchState.dashboard.includes("Dept DRI Quantity Smoke Item 1") || or5ProjectSwitchState.dashboard.includes("Dept DRI Quantity Smoke P25 Item")) {
      fail("Dept DRI Project Context project switcher did not isolate the OR5 dashboard", or5ProjectSwitchState);
    }
  } else {
    fail("Dept DRI Project Context did not render an OR5 project switcher chip");
  }
  await clickPriceReviewSelection(page, p25Request.id);
  await page.waitForTimeout(200);
  const p25DashboardState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      activeTab: [...document.querySelectorAll('[data-approval-quantity-tab].active')]
        .filter(visible)
        .map((el) => el.dataset.approvalQuantityTab || ""),
      dashboard: text(document.getElementById("priceReviewInlineDemandCostRows")),
      scope: text(document.getElementById("priceReviewInlineDemandCostScope")),
      activeDashboardRows: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
        .filter(visible)
        .map(text),
      requestId,
    };
  }, p25Request.id);
  if (!p25DashboardState.activeTab.includes("dashboard") || !p25DashboardState.scope.includes("P25")) {
    fail("Dept DRI P25 row selection should switch to the P25 Dashboard overview", p25DashboardState);
  }
  if (!p25DashboardState.dashboard.includes("Dept DRI Quantity Smoke P25 Item") || p25DashboardState.dashboard.includes("Dept DRI Quantity Smoke Item 1") || p25DashboardState.dashboard.includes("Dept DRI Quantity Smoke OR5 Item")) {
    fail("Dept DRI P25 Dashboard should show only active-project P25 items", p25DashboardState);
  }
  if (!p25DashboardState.activeDashboardRows.some((text) => text.includes("Dept DRI Quantity Smoke P25 Item"))) {
    fail("Dept DRI P25 Dashboard did not highlight the selected P25 item", p25DashboardState);
  }
  await clickPriceReviewSelection(page, or5Request.id);
  await page.waitForTimeout(200);
  const or5DashboardState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      activeTab: [...document.querySelectorAll('[data-approval-quantity-tab].active')]
        .filter(visible)
        .map((el) => el.dataset.approvalQuantityTab || ""),
      dashboard: text(document.getElementById("priceReviewInlineDemandCostRows")),
      scope: text(document.getElementById("priceReviewInlineDemandCostScope")),
      activeDashboardRows: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
        .filter(visible)
        .map(text),
      requestId,
    };
  }, or5Request.id);
  if (!or5DashboardState.activeTab.includes("dashboard") || !or5DashboardState.scope.includes("OR5")) {
    fail("Dept DRI OR5 row selection should switch to the OR5 Dashboard overview", or5DashboardState);
  }
  if (!or5DashboardState.dashboard.includes("Dept DRI Quantity Smoke OR5 Item") || or5DashboardState.dashboard.includes("Dept DRI Quantity Smoke Item 1") || or5DashboardState.dashboard.includes("Dept DRI Quantity Smoke P25 Item")) {
    fail("Dept DRI OR5 Dashboard should show only active-project OR5 items", or5DashboardState);
  }
  await clickPriceReviewSelection(page, submittedMfgRequest.id);
  await page.waitForTimeout(100);
  await page.locator('#priceReviewInlineAnalysis [data-approval-quantity-tab="dashboard"]').click();
  await page.waitForTimeout(100);
  await page.evaluate((requestId) => {
    const button = document.querySelector(`#priceReviewInlineDemandCostRows [data-approval-dashboard-request-id="${CSS.escape(requestId)}"][data-approval-dashboard-unit="MFG"] button`);
    if (!button) throw new Error(`No MFG dashboard cell for ${requestId}`);
    button.click();
  }, submittedMfgRequest.id);
  await page.waitForTimeout(200);
  const mfgDrillState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      activeTab: [...document.querySelectorAll('[data-approval-quantity-tab].active')]
        .filter(visible)
        .map((el) => el.dataset.approvalQuantityTab || ""),
      selected: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
        .map(text),
      head: text(document.getElementById("priceReviewInlineQuantityHead")),
      body: text(document.getElementById("priceReviewInlineQuantityRows")),
      requestId,
    };
  }, submittedMfgRequest.id);
  if (!mfgDrillState.activeTab.includes("mfg")) fail("Dept DRI MFG dashboard cell did not open MFG Station Detail", mfgDrillState);
  if (!mfgDrillState.selected.some((text) => text.includes(submittedMfgRequest.id))) fail("Dept DRI MFG dashboard cell did not select the clicked item", mfgDrillState);
  if (!mfgDrillState.head.includes("MFG Mainline Station") || !mfgDrillState.head.includes("CG") || mfgDrillState.head.includes("ENG1")) {
    fail("Dept DRI MFG detail rendered the wrong station column family", mfgDrillState);
  }
  if (!mfgDrillState.body.includes(submittedMfgRequest.id)) fail("Dept DRI MFG detail did not scope to the clicked item", mfgDrillState);
  await clickPriceReviewSelection(page, submittedNonMfgRequest.id);
  await page.evaluate((requestId) => {
    const button = [...document.querySelectorAll(`#priceReviewInlineDemandCostRows [data-approval-dashboard-request-id="${CSS.escape(requestId)}"][data-approval-dashboard-unit] button`)]
      .find((cell) => cell.closest("[data-approval-dashboard-unit]")?.dataset.approvalDashboardUnit !== "MFG");
    if (!button) throw new Error(`No Non-MFG dashboard cell for ${requestId}`);
    button.click();
  }, submittedNonMfgRequest.id);
  await page.waitForTimeout(200);
  const nonMfgReviewState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const activeTab = [...document.querySelectorAll('[data-approval-quantity-tab].active')]
      .filter(visible)
      .map((el) => el.dataset.approvalQuantityTab || "");
    return {
      activeTab,
      head: text(document.getElementById("priceReviewInlineQuantityHead")),
      body: text(document.getElementById("priceReviewInlineQuantityRows")),
      selected: [...document.querySelectorAll("#priceReviewInlineDemandCostRows tr.active-row")]
        .map(text),
      requestId,
    };
  }, submittedNonMfgRequest.id);
  if (!nonMfgReviewState.activeTab.includes("nonMfg")) fail("Dept DRI did not open Non-MFG Department Detail for Non-MFG requester submission", nonMfgReviewState);
  if (!nonMfgReviewState.head.includes("Non-MFG Department") || !nonMfgReviewState.head.includes("FATP TE") || nonMfgReviewState.head.includes("CG")) fail("Dept DRI Non-MFG matrix rendered the wrong column family", nonMfgReviewState);
  if (!nonMfgReviewState.body.includes(submittedNonMfgRequest.id)) fail("Dept DRI Non-MFG matrix did not stay scoped to the selected item", nonMfgReviewState);
  await clickPriceReviewSelection(page, submittedMfgRequest.id);
  await page.locator('#priceReviewInlineAnalysis [data-approval-quantity-tab="mfg"]').click();
  await page.waitForTimeout(200);
  const quantityCellCount = await page.locator(`section[data-view="priceReview"] [data-item-quantity-request="${submittedMfgRequest.id}"]`).count();
  if (!quantityCellCount) fail("Dept DRI quantity worksheet has no clickable quantity cells");
  await page.evaluate((requestId) => {
    const cells = [...document.querySelectorAll(`section[data-view="priceReview"] [data-item-quantity-request="${CSS.escape(requestId)}"]`)];
    const visibleCell = cells.find((cell) => cell.offsetParent !== null);
    if (!visibleCell) throw new Error(`No visible quantity cell for ${requestId}`);
    visibleCell.click();
  }, submittedMfgRequest.id);
  await expectText(page, "Dept DRI item quantity popup", [
    /Direct Quantity Edit/,
    new RegExp(submittedMfgRequest.id),
    /DEMAND DEPT\s*MFG/i,
    new RegExp(`TOTAL QTY\\s*${submittedMfgRequest.totalQty}`, "i"),
    /MFG|Non-MFG/,
    /Editable Matrix/,
    /Approve/,
    /Save Direct Edit/,
    /Reject Item/,
  ], "#itemQuantityReviewModal");
	  await rejectText(page, "Dept DRI item quantity popup", [
	    /Requester Revisions/,
	    /Official Changes/,
	    /Current official demand/,
	  ], "#itemQuantityReviewModal");
	  await page.locator('#itemQuantityReviewModal [data-item-quantity-review-input][data-row-ids]:not([data-row-ids=""])').first().fill("9");
	  page.once("dialog", (dialog) => dialog.accept("Direct edit smoke note"));
	  await page.locator('[data-action="saveItemQuantityReviewDirectEdit"]').click();
  const directEditState = await page.evaluate((requestId) => {
    const row = requests.find((item) => item.id === requestId);
    return {
      hasEditedQty: (row?.stationBreakdown || []).some((entry) => Number(entry.qty || 0) === 9),
      reviewStatus: row?.itemQuantityReviewStatus || "",
      auditCount: row?.itemQuantityChangeCount || 0,
      matrixText: (document.getElementById("priceReviewInlineQuantityRows")?.textContent || "").replace(/\s+/g, " ").trim(),
    };
  }, submittedMfgRequest.id);
  if (!directEditState.hasEditedQty || directEditState.reviewStatus !== "Direct Edit Applied" || directEditState.auditCount < 1 || !directEditState.matrixText.includes(submittedMfgRequest.id)) {
    fail("Dept DRI direct edit did not update the selected item detail matrix", directEditState);
  }
  const pendingPipelineState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const cells = [...document.querySelectorAll(`section[data-view="priceReview"] [data-item-quantity-request="${CSS.escape(requestId)}"][data-approval-pipeline-status]`)]
      .filter(visible);
    const dashboardRow = [...document.querySelectorAll(`#priceReviewInlineDemandCostRows [data-approval-dashboard-request-id="${CSS.escape(requestId)}"]`)]
      .find((node) => node.dataset.approvalPipelineStatus);
    return {
      cellStatuses: cells.map((cell) => cell.dataset.approvalPipelineStatus || ""),
      dashboardStatus: dashboardRow?.dataset.approvalPipelineStatus || "",
      cellTitles: cells.map((cell) => cell.getAttribute("title") || "").slice(0, 3),
    };
  }, submittedMfgRequest.id);
  if (!pendingPipelineState.cellStatuses.includes("pending") && pendingPipelineState.dashboardStatus !== "pending") {
    fail("Dept DRI pending matrix did not expose pending pipeline status", pendingPipelineState);
  }
  await page.evaluate(() => window.setPriceReviewTab?.("pending"));
  await page.waitForTimeout(100);
  await page.evaluate((requestId) => {
    const buttons = [...document.querySelectorAll(`[data-price-review-decision="${CSS.escape(requestId)}"][data-price-review-action="approve"]`)];
    const visibleButton = buttons.find((button) => button.offsetParent !== null);
    if (!visibleButton) throw new Error(`No visible Dept DRI approve button for ${requestId}`);
    visibleButton.click();
  }, submittedMfgRequest.id);
  await page.waitForTimeout(250);
	  await page.evaluate(() => window.setPriceReviewTab?.("projectReview"));
	  await expectText(page, "Dept DRI project review", [
	    /Project Review/,
	    /Project Context/,
	    /Sent to Cost Manager/,
	    /Cost Manager/,
	    /PO Pending/,
	  ], 'section[data-price-review-panel="projectReview"]');
  const approvedPipelineState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const panel = document.querySelector('section[data-price-review-panel="projectReview"]');
    const text = (panel?.textContent || "").replace(/\s+/g, " ").trim();
    const row = [...panel.querySelectorAll(`[data-price-review-select-row="${CSS.escape(requestId)}"]`)].find(visible);
    return {
      text,
      rowStatus: row?.dataset.approvalPipelineStatus || "",
      rowTitle: row?.getAttribute("title") || "",
    };
  }, submittedMfgRequest.id);
  if (approvedPipelineState.rowStatus !== "sent" || !approvedPipelineState.text.includes("Sent to Cost Manager") || !approvedPipelineState.text.includes("PO Pending")) {
    fail("Dept DRI Project Review did not show sent-to-next pipeline tracking", approvedPipelineState);
  }
  await page.evaluate((requestId) => {
    const panel = document.querySelector('section[data-price-review-panel="projectReview"]');
    const detailButton = [...panel.querySelectorAll(`[data-item-detail-source="request"][data-item-detail-id="${CSS.escape(requestId)}"]`)]
      .find((button) => button.offsetParent !== null);
    if (!detailButton) throw new Error(`No Project Review Detail button for ${requestId}`);
    detailButton.click();
  }, submittedMfgRequest.id);
  await expectText(page, "Dept DRI approved detail pipeline", [
    /Approval \/ Pipeline Detail/,
    /Current Owner:\s*Cost Manager/,
    /Dept DRI Decision/,
    /Cost Manager Authorization/,
    /PO Pending/,
  ], "#itemDetailModal");
  await page.evaluate(() => closeItemDetail());
  await page.evaluate((requestId) => {
    window.applyRole?.("manager");
    window.setView?.("manager");
    applyCostManagerAuthorization(requestId, "approve");
    window.applyRole?.("dri");
    window.setView?.("priceReview");
    window.setPriceReviewTab?.("projectReview");
  }, submittedMfgRequest.id);
  await expectText(page, "Dept DRI Project Review after Cost Manager", [
    /OM Purchasing|OM Leader/,
    /PO Pending/,
  ], 'section[data-price-review-panel="projectReview"]');
  await page.evaluate((requestId) => {
    const row = requests.find((item) => item.id === requestId);
    const now = new Date().toISOString();
    Object.assign(row, {
      finalExportStatus: "Exported to CFA",
      finalExportedAt: now,
      finalExportTarget: "CFA",
      buyerStatus: "PO Issued",
      buyerReceivedAt: now,
      buyerPoNo: "PO-PIPELINE-SMOKE",
      poStatus: "PO Issued",
    });
    renderPriceReview();
  }, submittedMfgRequest.id);
  await expectText(page, "Dept DRI Project Review after Buyer PO", [
    /Buyer/,
    /PO Issued/,
    /PO-PIPELINE-SMOKE/,
  ], 'section[data-price-review-panel="projectReview"]');
  await rejectText(page, "Dept DRI Project Review carryover noise", [
    /Confirmed Carryover Saving/,
    /Line Carryover Impact/,
    /Carryover Ledger/,
  ], 'section[data-price-review-panel="projectReview"]');

  await switchRole(page, "projectDri", "priceReview");
  await expectNoPageErrors(pageErrors, "Budget Approver review");
  await expectText(page, "Budget Approver review", [
    /Price Review/,
    /Review Queue/,
    /Project Review/,
    /Review History/,
	    /Budget Exception Approval/,
	    /Budget Approver/,
	  ], 'section[data-view="priceReview"]');
  await rejectText(page, "Budget Approver review", [
    /Cost Manager Dashboard/,
    /PAS Quote Result/,
    /Price Review Analysis: Cost Dashboard/,
    /Price Review Analysis: Station Matrix/,
  ], 'section[data-view="priceReview"]');
	  await page.evaluate(() => window.setPriceReviewTab?.("projectReview"));
	  await expectText(page, "Budget Approver Project Review", [
	    /Project Review/,
	    /Dashboard/,
	    /MFG Station Detail/,
	    /Non-MFG Department Detail/,
	  ], 'section[data-price-review-panel="projectReview"]');
  await rejectText(page, "Budget Approver Project Review carryover noise", [
    /Confirmed Carryover Saving/,
    /Line Carryover Impact/,
    /Carryover Ledger/,
    /Before applied carryover/,
    /After applied carryover/,
    /requester candidates stay visible/,
  ], 'section[data-price-review-panel="projectReview"]');
  await rejectText(page, "Budget Approver Project Review carryover noise", [
    /Confirmed Carryover Saving/,
    /Line Carryover Impact/,
    /Carryover Ledger/,
  ], 'section[data-price-review-panel="projectReview"]');

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
