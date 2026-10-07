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
      `[data-manager-select="${CSS.escape(id)}"]`,
      `[data-manager-select-row="${CSS.escape(id)}"]`,
      `[data-manager-authorized-select-row="${CSS.escape(id)}"]`,
      `[data-price-review-select="${CSS.escape(id)}"]`,
      `[data-price-review-select-row="${CSS.escape(id)}"]`,
      `[data-price-review-select-cell="${CSS.escape(id)}"]`,
    ];
    const node = selectors.flatMap((selector) => [...document.querySelectorAll(selector)])
      .find((item) => item.offsetParent !== null);
    if (!node) throw new Error(`No visible manager review selection for ${id}`);
    node.click();
  }, requestId);
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.DEMO_BROWSER_CHANNEL ? { channel: process.env.DEMO_BROWSER_CHANNEL } : {}) });
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

  for (const role of ["requester", "dri", "manager", "projectDri", "omLeader", "omMember", "buyer"]) {
    await switchRole(page, role);
    const projectStatusTab = page.locator('#workflowSidebar .workflow-nav-item[data-view="projectStatus"]');
    if (!await projectStatusTab.isVisible()) fail(`Demand Progress Tracking tab should be visible for ${role}`);
    await projectStatusTab.click();
    await expectText(page, `Demand Progress Tracking title ${role}`, [/Demand Progress Tracking/], '#pageTitle');
    await expectNoPageErrors(pageErrors, `Demand Progress Tracking ${role}`);
    await expectText(page, `Demand Progress Tracking ${role}`, [
      /Dashboard Quantity Review/,
      /Line Count/,
      /View Mode/,
      /MFG Station Detail/,
      /Non-MFG Department Detail/,
    ], 'section[data-view="projectStatus"]');
    const visibleProjectStatusPanels = await page.locator('section[data-view="projectStatus"] [data-project-status-panel]:visible').count();
    if (visibleProjectStatusPanels !== 3) fail(`Demand Progress Tracking should show three tables for ${role}`, { visibleProjectStatusPanels });
    const innerTabCount = await page.locator('section[data-view="projectStatus"] [data-project-status-tab]').count();
    if (innerTabCount) fail(`Demand Progress Tracking should not use inner tabs for ${role}`, { innerTabCount });
  }

  await switchRole(page, "requester", "department");
  await expectNoPageErrors(pageErrors, "Requester workspace");
  await expectText(page, "Requester navigation", [/Request Workspace/], '#workflowSidebar');
  await expectText(page, "Requester workspace", [
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
  const tertiaryRequest = quantitySmoke.rows[2];
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
	  /Review Status/,
	  /Line Count/,
	  /All lines/,
	], 'section[data-view="manager"]');
  await rejectText(page, "Cost Manager shell", [
    new RegExp(`Submission ${"Monitor"}`),
    /Authorized Analysis/,
    /Progress Tracking/,
    /Project Setup/,
    /Pending Approval/,
    /Approval Queue/,
    /Carryover Ledger/,
    /Line Carryover Impact/,
    /Confirmed Carryover Saving/,
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
  if (!managerContextSwitchState.duplicateEvidenceHidden || !managerContextSwitchState.dashboardText.includes("Request ID") || !managerContextSwitchState.dashboardText.includes("Review Status")) {
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
    const focusedLine = options[0] || "";
    if (lineFilter && focusedLine) {
      lineFilter.value = focusedLine;
      lineFilter.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return {
      options,
      selectedManagerRequestId,
      focusedLine,
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
  });
  if (!managerLineFilterState.options.length || managerLineFilterState.options.length > 1) {
	    fail("Cost Review focused matrix should expose only the selected item row request line", managerLineFilterState);
  }
  if (managerLineFilterState.lineCount !== "2") {
    fail("Cost Manager Line filter replaced or reset Line Count multiplier", managerLineFilterState);
  }
  if (managerLineFilterState.matrixLine !== managerLineFilterState.focusedLine) {
    fail("Cost Manager Demand Dashboard did not sync Line filter into Station Matrix", managerLineFilterState);
  }
  if (!managerLineFilterState.dashboardRows.length
    || !managerLineFilterState.matrixGroups.length
    || managerLineFilterState.dashboardRows.some((row) => row.id !== managerLineFilterState.selectedManagerRequestId)
    || managerLineFilterState.matrixGroups.some((row) => row.id !== managerLineFilterState.selectedManagerRequestId)) {
	    fail("Cost Review matrix did not stay focused on the selected item row", managerLineFilterState);
  }
  await page.evaluate(() => window.setManagerTab?.("history"));
	  await expectText(page, "Cost Manager history", [
	    /Cost Review History/,
	    /Cost Review Decision/,
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

  await switchRole(page, "dri", "manager");
  await page.evaluate(() => window.setManagerTab?.("review"));
  await expectNoPageErrors(pageErrors, "Dept DRI review");
  await expectText(page, "Dept DRI review", [
    /Dept Review/,
    /Dept Review Rows/,
    new RegExp(submittedMfgRequest.id),
    /Dept DRI Quantity Smoke Item 1/,
    /Dept DRI Quantity Smoke Item 2/,
    /Dept DRI Quantity Smoke Item 3/,
    /Dept DRI Quantity Smoke P25 Item/,
    /Dept DRI Quantity Smoke OR5 Item/,
    /Dept DRI/,
  ], 'section[data-view="manager"]');
	  await rejectText(page, "Dept DRI review", [
	    /Dept Review Workbench/,
	    /Dept Review Triage/,
	    /Project Review/,
	    /Carryover Review\s+Dept DRI reviews requester stock\/carryover candidates/,
		    new RegExp(`Quote Result / ${"Monitor"}`),
      /Project Item Matrix Overview/,
	  ], 'section[data-view="manager"]');
  await clickPriceReviewSelection(page, secondaryRequest.id);
  await page.waitForTimeout(200);
  await expectText(page, "Dept DRI selected row actions", [
    /Approved/,
    /Denied/,
    /Revise/,
  ], 'section[data-view="manager"]');
  const switchedItemState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      activeManagerTab: [...document.querySelectorAll('[data-manager-tab].active')]
        .map((el) => el.dataset.managerTab || ""),
      matrixShellExists: Boolean(document.getElementById("managerDemandCostTable"))
        && Boolean(document.getElementById("managerQuantityMatrixTable")),
      inlineAnalysisExists: Boolean(document.getElementById("priceReviewInlineAnalysis") && !document.getElementById("priceReviewInlineAnalysis").hidden),
      projectReviewPanelExists: Boolean(document.querySelector('section[data-view="manager"] [data-price-review-panel="projectReview"]')),
      selectedScope: { ...selectedProjectStatusScope },
      requestId,
    };
  }, secondaryRequest.id);
  if (!switchedItemState.activeManagerTab.includes("review") || !switchedItemState.matrixShellExists || switchedItemState.inlineAnalysisExists || switchedItemState.projectReviewPanelExists) {
    fail("Dept DRI manager review should stay in the unified Review shell without Project Context tabs", switchedItemState);
  }
  if (switchedItemState.selectedScope.requestId !== secondaryRequest.id) {
    fail("Dept DRI row selection should seed Demand Progress Tracking scope", switchedItemState);
  }
  await switchRole(page, "dri", "projectStatus");
  const projectStatusTrackingState = await page.evaluate((requestId) => {
    const visible = (el) => !!el && el.offsetParent !== null;
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    return {
      panels: [...document.querySelectorAll("[data-project-status-panel]")].map((panel) => ({
        panel: panel.dataset.projectStatusPanel,
        visible: visible(panel),
      })),
      tabCount: document.querySelectorAll("[data-project-status-tab]").length,
      dashboardHead: text(document.getElementById("projectStatusDashboardHead")),
      dashboard: text(document.getElementById("projectStatusDashboardRows")),
      mfgHead: text(document.getElementById("projectStatusMfgHead")),
      mfgBody: text(document.getElementById("projectStatusMfgRows")),
      nonMfgHead: text(document.getElementById("projectStatusNonMfgHead")),
      nonMfgBody: text(document.getElementById("projectStatusNonMfgRows")),
      selectedScope: { ...selectedProjectStatusScope },
      requestId,
    };
  }, secondaryRequest.id);
  if (projectStatusTrackingState.tabCount || projectStatusTrackingState.panels.some((panel) => !panel.visible)) {
    fail("Demand Progress Tracking should render Dashboard, MFG, and Non-MFG as three visible tables without inner tabs", projectStatusTrackingState);
  }
  if (!projectStatusTrackingState.dashboardHead.includes("Dashboard Quantity Review")
    || projectStatusTrackingState.dashboard.includes("Dept DRI Quantity Smoke Item 2")
    || !(`${projectStatusTrackingState.mfgBody} ${projectStatusTrackingState.nonMfgBody}`).includes("Dept DRI Quantity Smoke Item 2")
    || !projectStatusTrackingState.mfgHead.includes("Review Status")
    || !projectStatusTrackingState.mfgHead.includes("MFG Mainline Station")
    || !projectStatusTrackingState.nonMfgHead.includes("Review Status")
    || !projectStatusTrackingState.nonMfgHead.includes("Department")) {
    fail("Demand Progress Tracking did not carry Dept DRI selected row into the three-table tracking surface", projectStatusTrackingState);
  }
  const projectStatusCurrencyState = await page.evaluate(() => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const select = document.getElementById("currencyDisplaySelect");
    const setCurrency = (value) => {
      select.value = value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return {
        meta: text(document.getElementById("projectStatusDashboardMeta")),
        dashboard: text(document.getElementById("projectStatusDashboardRows")),
        mfg: text(document.getElementById("projectStatusMfgRows")),
        nonMfg: text(document.getElementById("projectStatusNonMfgRows")),
      };
    };
    const vnd = setCurrency("VND");
    const usd = setCurrency("USD");
    setCurrency("VND");
    return { vnd, usd };
  });
  if (!projectStatusCurrencyState.vnd.meta.includes("VND")
    || !projectStatusCurrencyState.vnd.dashboard.includes("VND")
    || !projectStatusCurrencyState.vnd.mfg.includes("VND")
    || !projectStatusCurrencyState.vnd.nonMfg.includes("VND")
    || !projectStatusCurrencyState.usd.meta.includes("USD")
    || !projectStatusCurrencyState.usd.dashboard.includes("$")
    || !projectStatusCurrencyState.usd.mfg.includes("$")
    || !projectStatusCurrencyState.usd.nonMfg.includes("$")) {
    fail("Demand Progress Tracking VND/USD toggle should update dashboard and both detail matrices", projectStatusCurrencyState);
  }
  await switchRole(page, "dri", "manager");
  await clickPriceReviewSelection(page, submittedMfgRequest.id);
  await page.waitForTimeout(100);
  await page.evaluate(() => window.setManagerTab?.("review"));
  await page.waitForTimeout(100);
  await page.evaluate((requestId) => {
    const buttons = [...document.querySelectorAll(`[data-manager-review-decision="${CSS.escape(requestId)}"][data-manager-review-action="approve"]`)];
    const visibleButton = buttons.find((button) => button.offsetParent !== null);
    if (!visibleButton) throw new Error(`No visible Dept DRI approve button for ${requestId}`);
    visibleButton.click();
  }, submittedMfgRequest.id);
  await page.waitForTimeout(250);
  await page.evaluate(() => window.setManagerTab?.("review"));
  await expectText(page, "Dept DRI review after approve", [
    /Dept Review/,
    /Cost Manager/,
  ], 'section[data-view="manager"]');
  await rejectText(page, "Dept DRI review after approve", [
    /Project Context/,
  ], 'section[data-view="manager"]');
  const approvedPipelineState = await page.evaluate((requestId) => {
    const row = requests.find((item) => item.id === requestId);
    const pipeline = approvalPipelineStatus(row, "dri");
    const visible = (el) => !!el && el.offsetParent !== null;
    const visibleApproveButtons = [...document.querySelectorAll(`[data-manager-review-decision="${CSS.escape(requestId)}"]`)].filter(visible);
    window.setView?.("projectStatus");
    renderProjectStatus();
    const projectStatusText = (document.querySelector('section[data-view="projectStatus"]')?.textContent || "").replace(/\s+/g, " ").trim();
    window.setView?.("manager");
    window.setManagerTab?.("review");
    return {
      deptDriReviewStatus: row?.deptDriReviewStatus || "",
      procurementStatus: row?.procurementStatus || "",
      nextOwner: pipeline.nextOwner || "",
      poStatus: pipeline.poStatus || "",
      selectedId: selectedPriceReviewRequestId || "",
      projectStatusHasRow: projectStatusText.includes(requestId),
	      projectStatusHasReviewStatus: projectStatusText.includes("Cost Manager Review"),
      visibleApproveButtonCount: visibleApproveButtons.length,
    };
  }, submittedMfgRequest.id);
  if (!/Approved/.test(approvedPipelineState.deptDriReviewStatus) || approvedPipelineState.nextOwner !== "Cost Manager" || approvedPipelineState.poStatus !== "PO Pending") {
    fail("Dept DRI approval did not route the row to Cost Manager pipeline tracking", approvedPipelineState);
  }
  if (!approvedPipelineState.projectStatusHasRow || !approvedPipelineState.projectStatusHasReviewStatus || approvedPipelineState.visibleApproveButtonCount) {
    fail("Dept DRI approved row did not remain in Demand Progress Tracking as read-only tracking", approvedPipelineState);
  }
  await page.evaluate((requestId) => {
    renderItemDetail(requests.find((item) => item.id === requestId), "request");
  }, submittedMfgRequest.id);
  await expectText(page, "Dept DRI approved detail pipeline", [
    /Approval \/ Pipeline Detail/,
	    /Current Owner:\s*Cost Manager/,
	    /Dept DRI Decision/,
	    /Cost Manager Review/,
    /PO Pending/,
  ], "#itemDetailModal");
  await page.evaluate(() => closeItemDetail());
  const costManagerAuthorizedUiState = await page.evaluate((requestId) => {
    window.applyRole?.("manager");
    window.setView?.("manager");
    applyCostManagerAuthorization(requestId, "approve");
    renderManager();
    const dashboardText = (document.getElementById("managerDemandCostRows")?.textContent || "").replace(/\s+/g, " ").trim();
    const matrixText = (document.getElementById("managerQuantityRows")?.textContent || "").replace(/\s+/g, " ").trim();
    const visible = (el) => !!el && el.offsetParent !== null;
    const visibleAuthorizeButtons = [...document.querySelectorAll(`[data-manager-review-decision="${CSS.escape(requestId)}"], [data-cost-manager-authorization="${CSS.escape(requestId)}"]`)].filter(visible);
    window.applyRole?.("dri");
    window.setView?.("manager");
    window.setManagerTab?.("review");
    return {
      dashboardHasAuthorizedStatus: dashboardText.includes("Approved") && dashboardText.includes(requestId),
      matrixHasAuthorizedStatus: matrixText.includes("Approved") && matrixText.includes(requestId),
      visibleAuthorizeButtonCount: visibleAuthorizeButtons.length,
    };
  }, submittedMfgRequest.id);
  if (!costManagerAuthorizedUiState.dashboardHasAuthorizedStatus || !costManagerAuthorizedUiState.matrixHasAuthorizedStatus || costManagerAuthorizedUiState.visibleAuthorizeButtonCount) {
    fail("Cost Manager authorized row did not remain in both evidence tables as read-only Review Status", costManagerAuthorizedUiState);
  }
  const afterCostManagerState = await page.evaluate((requestId) => {
    const row = requests.find((item) => item.id === requestId);
    const pipeline = approvalPipelineStatus(row, "dri");
    return {
      nextOwner: pipeline.nextOwner || "",
      blockedAtOwner: pipeline.blockedAtOwner || "",
      poStatus: pipeline.poStatus || "",
    };
  }, submittedMfgRequest.id);
  if (!/OM Purchasing|OM Leader/.test(`${afterCostManagerState.nextOwner} ${afterCostManagerState.blockedAtOwner}`) || afterCostManagerState.poStatus !== "PO Pending") {
    fail("Dept DRI pipeline after Cost Manager authorization did not move toward OM", afterCostManagerState);
  }
  const demandReviewRowDecisionState = await page.evaluate(({ denyId, reviseId }) => {
    const text = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
    const approveViaDeptDri = (requestId) => {
      window.applyRole?.("dri");
      window.setView?.("manager");
      window.setManagerTab?.("review");
      applyPriceReviewDecision(requestId, "approve");
    };
    approveViaDeptDri(denyId);
    approveViaDeptDri(reviseId);
    window.applyRole?.("manager");
    window.setView?.("manager");
    const originalPrompt = window.prompt;
    window.prompt = () => "row-level smoke reason";
    applyCostManagerAuthorization(denyId, "deny");
    applyCostManagerAuthorization(reviseId, "revise");
    window.prompt = originalPrompt;
    const denied = requests.find((item) => item.id === denyId);
    const revise = requests.find((item) => item.id === reviseId);
    window.setView?.("projectStatus");
    selectedProjectStatusScope = {};
    ["projectStatusProjectTypeFilter", "projectStatusProjectFilter", "projectStatusProjectCodeFilter", "projectStatusLineFilter", "projectStatusPhaseFilter"].forEach((id) => {
      const control = document.getElementById(id);
      if (control) control.value = "";
    });
    renderProjectStatus();
    const projectStatusRoot = document.querySelector('section[data-view="projectStatus"]');
    const projectStatusText = text(projectStatusRoot);
    const actionButtonCount = projectStatusRoot?.querySelectorAll("[data-manager-review-decision], [data-manager-review-action], [data-cost-manager-authorization], [data-cost-manager-action]").length || 0;
    const requesterActionIds = needConfirmationRows().map((row) => row.id);
    return {
      denied: {
        status: denied?.status || "",
        demandReviewStatus: denied?.demandReviewStatus || "",
        costManagerAuthorizationStatus: denied?.costManagerAuthorizationStatus || "",
        procurementStatus: denied?.procurementStatus || "",
        omStage: denied?.omStage || "",
        sentToOmAt: denied?.sentToOmAt || "",
      },
      revise: {
        status: revise?.status || "",
        demandReviewStatus: revise?.demandReviewStatus || "",
        costManagerAuthorizationStatus: revise?.costManagerAuthorizationStatus || "",
        rework: Boolean(revise?.costManagerAuthorizationReworkRequired),
      },
      projectStatusHasDenied: projectStatusText.includes(denyId) && projectStatusText.includes("Denied"),
      projectStatusHasRevise: projectStatusText.includes(reviseId) && projectStatusText.includes("Revise Required"),
      actionButtonCount,
      requesterActionIds,
    };
  }, { denyId: secondaryRequest.id, reviseId: tertiaryRequest.id });
  if (demandReviewRowDecisionState.denied.demandReviewStatus !== "Denied"
    || demandReviewRowDecisionState.denied.costManagerAuthorizationStatus !== "Cost Manager Denied"
    || demandReviewRowDecisionState.denied.procurementStatus !== "Demand denied"
    || demandReviewRowDecisionState.denied.omStage
    || demandReviewRowDecisionState.denied.sentToOmAt
    || !demandReviewRowDecisionState.projectStatusHasDenied) {
	    fail("Cost Review Denied should close only that item row and keep it out of OM", demandReviewRowDecisionState);
  }
  if (demandReviewRowDecisionState.revise.demandReviewStatus !== "Revise Required"
    || demandReviewRowDecisionState.revise.costManagerAuthorizationStatus !== "Cost Manager Rejected"
    || !demandReviewRowDecisionState.revise.rework
    || !demandReviewRowDecisionState.requesterActionIds.includes(tertiaryRequest.id)
    || !demandReviewRowDecisionState.projectStatusHasRevise) {
	    fail("Cost Review Revise should route only that item row to Requester Action Required", demandReviewRowDecisionState);
  }
  if (demandReviewRowDecisionState.actionButtonCount) {
	    fail("Demand Progress Tracking should stay read-only without Cost Review action controls", demandReviewRowDecisionState);
  }
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
    renderManager();
  }, submittedMfgRequest.id);
  const afterBuyerState = await page.evaluate((requestId) => {
    const row = requests.find((item) => item.id === requestId);
    return {
      buyerStatus: row?.buyerStatus || "",
      poStatus: row?.poStatus || "",
      buyerPoNo: row?.buyerPoNo || "",
    };
  }, submittedMfgRequest.id);
  if (afterBuyerState.buyerStatus !== "PO Issued" || afterBuyerState.poStatus !== "PO Issued" || afterBuyerState.buyerPoNo !== "PO-PIPELINE-SMOKE") {
    fail("Dept DRI pipeline data did not preserve Buyer PO status", afterBuyerState);
  }
  await rejectText(page, "Dept DRI review carryover noise", [
    /Confirmed Carryover Saving/,
    /Line Carryover Impact/,
    /Carryover Ledger/,
  ], 'section[data-view="manager"]');

  await switchRole(page, "projectDri", "manager");
  await page.evaluate(() => window.setManagerTab?.("review"));
  await expectNoPageErrors(pageErrors, "Budget Approver review");
  await expectText(page, "Budget Approver review", [
    /Budget Review/,
    /Review History/,
	    /Budget Exception Approval/,
	    /Budget Approver/,
	  ], 'section[data-view="manager"]');
  await rejectText(page, "Budget Approver review", [
    /Project Review/,
	    /Cost Review/,
    new RegExp(`Quote Result / ${"Monitor"}`),
    /Price Review Analysis: Cost Dashboard/,
    /Price Review Analysis: Station Matrix/,
  ], 'section[data-view="manager"]');
	  await page.evaluate(() => window.setManagerTab?.("review"));
	  await expectText(page, "Budget Approver shared shell", [
	    /Budget Review/,
	  ], 'section[data-view="manager"]');
	  await rejectText(page, "Budget Approver approval-only shell", [
	    /Project Context/,
		  ], 'section[data-view="manager"]');
  const budgetFinalApprovedState = await page.evaluate(() => {
    const base = requests.find((item) => Array.isArray(item.stationBreakdown) && item.stationBreakdown.length) || requests[0];
    const row = syncRowPhaseQtyFromStationBreakdown({
      ...base,
      id: "ROLE-BUDGET-FINAL-001",
      project: "P26",
      name: "Budget Final Review Smoke Item",
      detail: "Budget Final Review Smoke Spec",
      stationBreakdown: [{ phase: "EVT", station: "CG", demandType: DEMAND_TYPE_MFG, requestLine: "Line 1", qty: 3 }],
      status: "Approved",
      priceDecisionStatus: PRICE_ESCALATION_REQUIRED,
      priceApprovalStatus: PRICE_ESCALATION_PENDING_PROJECT_DRI,
      driApprovedAt: new Date().toISOString(),
      projectDriApprovedAt: "",
      priceEscalationRejectedAt: "",
      costManagerAuthorizationStatus: "",
    });
    requests.unshift(row);
    approvalQuantityReviewTab = "dashboard";
	    renderManager();
    applyPriceReviewDecision(row.id, "approve");
    approvalQuantityReviewTab = "dashboard";
	    renderManager();
    window.setView?.("projectStatus");
    selectedProjectStatusScope = projectStatusScopeFromRow(row);
    renderProjectStatus();
    const projectStatusText = (document.querySelector('section[data-view="projectStatus"]')?.textContent || "").replace(/\s+/g, " ").trim();
	    window.setView?.("manager");
    const roleRows = roleReviewRows("projectDri");
    const selectedRow = roleRows.find((item) => item.id === selectedPriceReviewRequestId) || roleRows.find((item) => item.id === row.id);
    const selectedScope = priceReviewSelectedRowScope(selectedRow);
    const activeProject = activeProjectContext({ mode: "inline", scope: selectedScope, rows: roleRows });
    const sourceRows = projectContextRowsForProject(roleRows, activeProject);
    const matrixRows = approvalQuantityMatrixRows(sourceRows);
	    const visibleDecisionButtons = [...document.querySelectorAll(`[data-manager-review-decision="${CSS.escape(row.id)}"]`)]
      .filter((node) => node.offsetParent !== null);
    return {
      id: row.id,
      roleRowVisible: roleRows.some((item) => item.id === row.id),
      projectStatusHasRow: projectStatusText.includes(row.id),
      projectStatusHasReviewStatus: projectStatusText.includes("OM") || projectStatusText.includes("Export"),
      selectedPriceReviewRequestId,
      selectedProject: selectedPriceReviewProjectContext,
      activeProject,
      sourceIds: sourceRows.map((item) => item.id).slice(0, 8),
      matrixIds: matrixRows.map((item) => item.id).slice(0, 8),
      projectStatusPrefix: projectStatusText.slice(0, 240),
      visibleDecisionButtonCount: visibleDecisionButtons.length,
    };
  });
  if (!budgetFinalApprovedState.roleRowVisible || !budgetFinalApprovedState.projectStatusHasRow || !budgetFinalApprovedState.projectStatusHasReviewStatus || budgetFinalApprovedState.visibleDecisionButtonCount) {
    fail("Budget Approver final approved row did not remain in Demand Progress Tracking as read-only tracking", budgetFinalApprovedState);
  }
  await rejectText(page, "Budget Approver review carryover noise", [
    /Confirmed Carryover Saving/,
    /Line Carryover Impact/,
    /Carryover Ledger/,
    /Before applied carryover/,
    /After applied carryover/,
    /requester candidates stay visible/,
  ], 'section[data-view="manager"]');

  await switchRole(page, "omLeader", "projectStatus");
  await expectNoPageErrors(pageErrors, "OM Leader");
  const leaderTopTabs = await page.locator(".tabs .tab:visible").evaluateAll((tabs) => tabs.map((tab) => tab.innerText.trim()));
  for (const expected of ["Demand Progress Tracking", "OM Progress Review", "Project Stage Calendar"]) {
    if (!leaderTopTabs.includes(expected)) fail("OM Leader should expose peer-level business work entries", { leaderTopTabs, expected });
  }
  if (leaderTopTabs.includes("OM Purchasing")) fail("OM Leader should not use OM Purchasing as the container for leader governance work", { leaderTopTabs });

  await expectText(page, "OM Leader Demand Progress Tracking", [
    /Demand Progress Tracking/,
    /Dashboard Quantity Review/,
    /MFG Station Detail/,
    /Non-MFG Department Detail/,
  ], 'section[data-view="projectStatus"]');

  await page.locator('.tabs .tab[data-view="omLeaderProgress"]').click();
  await expectText(page, "OM Progress Review", [
    /OM Progress Review/,
    /Action Required Queue/,
    /Stage Signal/,
    /Workload Signal/,
    /Project Stage Date Signal/,
    /Line Open/,
    /Required By Stage/,
    /Procurement Tracking/,
  ], 'section[data-view="omLeaderProgress"]');
  await rejectText(page, "OM Leader consolidated status", [
    /Progress Overview/,
    /Team Workload/,
  ], 'section[data-view="omLeaderProgress"]');
  const nestedStageCalendar = await page.locator('section[data-view="omLeaderProgress"] .om-stage-calendar-utility').count();
  if (nestedStageCalendar) fail("Project Stage Calendar should not be nested inside OM Progress Review", { nestedStageCalendar });
  const omLeaderEditableProcurementControls = await page.locator('section[data-view="omLeaderProgress"] [data-om-procurement-field][data-om-procurement-editable="true"]:visible').count();
  if (omLeaderEditableProcurementControls) fail("OM Progress Review should not expose editable OM procurement tracking controls", { omLeaderEditableProcurementControls });

  await page.locator('.tabs .tab[data-view="projectStageCalendar"]').click();
  await expectText(page, "OM Leader Project Stage Calendar", [
    /Project Stage Calendar/,
    /Line Open Date Maintenance/,
    /Stage Date Review/,
    /Year Project/,
    /Project/,
    /Phase/,
    /Line Open Date/,
  ], 'section[data-view="projectStageCalendar"]');
  const stageCalendarDisclosureCount = await page.locator('section[data-view="projectStageCalendar"] details.om-stage-calendar-utility').count();
  if (stageCalendarDisclosureCount) fail("Project Stage Calendar should be a direct work surface, not a collapsed setup disclosure", { stageCalendarDisclosureCount });
  const leaderApiHydrationState = await page.evaluate(async () => {
    const firstGroup = window.omSubmissionRows?.()[0];
    const requestId = firstGroup?.rows?.[0]?.id || "";
    const originalApiModeEnabled = window.apiModeEnabled;
    const originalApiRequest = window.apiRequest;
    window.apiModeEnabled = () => true;
    window.apiRequest = async (path) => {
      if (path !== "/api/om/leader-console") throw new Error(`Unexpected API path ${path}`);
      return {
        connected: true,
        rows: [],
        stageCalendar: [{
          yearProject: "P99",
          projectCode: "",
          phase: "mp",
          lineOpenDate: "2026-08-08",
          updatedBy: "API Leader",
          updatedAt: "2026-06-30T00:00:00.000Z",
        }],
        procurementTracking: [{
          requestId,
          prStatus: "Done",
          prNo: "API-PR-260630",
          poStatus: "In Progress",
          buyerPoNo: "API-PO-260630",
          etaPlanDate: "2026-07-09",
          dtaActualDate: "",
          totalLeadTimeDays: "",
        }],
      };
    };
    await window.hydrateOmLeaderConsoleRows?.({ silent: true, role: "omLeader" });
    const consoleText = document.querySelector('section[data-view="omLeaderProgress"]')?.innerText || "";
    const stageText = document.querySelector("#omStageCalendarRows")?.innerText || "";
    window.apiModeEnabled = originalApiModeEnabled;
    window.apiRequest = originalApiRequest;
    return { requestId, consoleText, stageText };
  });
  if (!leaderApiHydrationState.requestId || !leaderApiHydrationState.consoleText.includes("API-PR-260630") || !leaderApiHydrationState.consoleText.includes("API-PO-260630") || !leaderApiHydrationState.consoleText.includes("ETA 2026-07-09")) {
    fail("OM Progress Review should render PR/PO/ETA values from /api/om/leader-console payload", leaderApiHydrationState);
  }
  if (!leaderApiHydrationState.stageText.includes("P99") || !leaderApiHydrationState.stageText.includes("2026-08-08") || leaderApiHydrationState.stageText.includes("System seed")) {
    fail("OM Leader Project Stage Calendar should use authoritative API state instead of seed rows", leaderApiHydrationState);
  }
  await rejectText(page, "OM Leader", [
    /Quotation DB/,
    /My Quote Result/,
    /USD\/VND Rate/,
    /Save Rate/,
    /Quote Result \/ Monitor/,
    /Budget Status \/ Budget #/,
    /PR \/ PO Tracking/,
    /ETA \/ DTA \/ Total LT/,
    /Expense \/ ECS/,
    /Capex \/ CFA/,
    /Budget Progress/,
    /PR Progress/,
    /PO Progress/,
    /Arrived Progress/,
  ], 'section[data-view="omLeaderProgress"]');

  await switchRole(page, "omMember", "om");
  await expectNoPageErrors(pageErrors, "OM Purchasing");
  await expectText(page, "OM Purchasing", [
    /OM Purchasing/,
    /My Intake/,
    /My Quote Result/,
    /Quotation DB/,
    /OM Handoff/,
  ], 'section[data-view="om"]');
  await page.evaluate(() => window.setOmTab?.("finalExport"));
  await expectText(page, "OM Purchasing OM Handoff", [
    /OM Handoff/,
    /Handoff Prep/,
    /Procurement Tracking/,
    /Delivery Tracking/,
    /Budget Status \/ Budget #/,
  ], 'section[data-view="om"]');
  const handoffViewState = await page.evaluate(() => {
    const clickView = (view) => {
      document.querySelector(`[data-om-handoff-view="${view}"]`)?.click();
      const table = document.querySelector(".om-final-export-table");
      const visibleHeaders = [...(table?.querySelectorAll("th") || [])]
        .filter((cell) => cell.offsetParent !== null)
        .map((cell) => cell.textContent.trim());
      return {
        activeView: table?.dataset.omHandoffView || "",
        visibleHeaders,
      };
    };
    return {
      prep: clickView("prep"),
      prpo: clickView("prpo"),
      delivery: clickView("delivery"),
      all: clickView("all"),
    };
  });
  if (handoffViewState.prpo.activeView !== "prpo" || !handoffViewState.prpo.visibleHeaders.includes("PR / PO Tracking") || handoffViewState.prpo.visibleHeaders.includes("ETA / DTA / Total LT")) {
    fail("OM Handoff PR / PO view should focus the PR PO tracking columns", handoffViewState.prpo);
  }
  if (handoffViewState.delivery.activeView !== "delivery" || !handoffViewState.delivery.visibleHeaders.includes("ETA / DTA / Total LT") || handoffViewState.delivery.visibleHeaders.includes("PR / PO Tracking")) {
    fail("OM Handoff Delivery view should focus ETA DTA tracking columns", handoffViewState.delivery);
  }
  if (!handoffViewState.all.visibleHeaders.includes("PR / PO Tracking") || !handoffViewState.all.visibleHeaders.includes("ETA / DTA / Total LT")) {
    fail("OM Handoff All view should show both procurement and delivery tracking columns", handoffViewState.all);
  }
  const prPoEditState = await page.evaluate(() => {
    document.querySelector('[data-om-handoff-view="prpo"]')?.click();
    const prStatus = document.querySelector('[data-om-procurement-field="prStatus"][data-om-procurement-editable="true"]');
    const prNo = document.querySelector('[data-om-procurement-field="prNo"][data-om-procurement-editable="true"]');
    if (prStatus) {
      prStatus.value = "In Progress";
      prStatus.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (prNo) {
      prNo.value = "PR-SMOKE-260630";
      prNo.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return {
      prStatusFound: Boolean(prStatus),
      prStatusDisabled: prStatus?.disabled ?? null,
      prStatusValue: prStatus?.value || "",
      prNoFound: Boolean(prNo),
      prNoDisabled: prNo?.disabled ?? null,
      prNoReadonly: prNo?.readOnly ?? null,
      prNoValue: prNo?.value || "",
      disabledEditableControls: [...document.querySelectorAll('[data-om-procurement-editable="true"]')]
        .filter((node) => node.disabled || node.readOnly)
        .map((node) => node.dataset.omProcurementField),
    };
  });
  if (!prPoEditState.prStatusFound || prPoEditState.prStatusDisabled || prPoEditState.prStatusValue !== "In Progress") {
    fail("OM Purchasing PR status select should be enabled and writable in PR / PO view", prPoEditState);
  }
  if (!prPoEditState.prNoFound || prPoEditState.prNoDisabled || prPoEditState.prNoReadonly || prPoEditState.prNoValue !== "PR-SMOKE-260630") {
    fail("OM Purchasing PR# input should be enabled and writable in PR / PO view", prPoEditState);
  }
  if (prPoEditState.disabledEditableControls.length) {
    fail("Editable OM procurement controls should not be disabled or readonly", prPoEditState);
  }

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
