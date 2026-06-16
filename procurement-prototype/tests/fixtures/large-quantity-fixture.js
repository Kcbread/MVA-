(function initLargeQuantityFixture(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ProcurementLargeQuantityFixture = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createLargeQuantityFixtureApi() {
  const FIXTURE_MARKER = "quantity-bulk-v1";
  const FIXTURE_PREFIX = "TEST-QTY-BULK-";
  const PHASES = ["p10", "p11", "evt", "dvt", "pvt", "mp"];
  const PHASE_LABELS = {
    p10: "P1.0",
    p11: "P1.1",
    evt: "EVT",
    dvt: "DVT",
    pvt: "PVT",
    mp: "MP",
  };
  const MFG_STATIONS = ["CG", "BG", "FATP", "Test", "Hybrid", "Auto", "ENG Pack", "Zombie", "Laser_pico", "Rework", "Repair", "WH"];
  const NON_MFG_UNITS = ["FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
  const PROJECT_SCOPES = [
    { project: "P26", projectType: "G", projectCode: "4CS4", line: "Line 1", yearProject: "P26 Demo line" },
    { project: "P26", projectType: "G", projectCode: "BZ5", line: "Line 2", yearProject: "P26 Zombie line" },
    { project: "F27", projectType: "G", projectCode: "FL5", line: "Line 1", yearProject: "F27" },
    { project: "OR5", projectType: "Non-G", projectCode: "OR5", line: "Line 1", yearProject: "OR5" },
    { project: "OR6", projectType: "Non-G", projectCode: "OR6", line: "Line 2", yearProject: "OR6" },
  ];
  const ITEM_FAMILIES = [
    { name: "Industrial PC", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "電腦主機", owner: "OM" },
    { name: "Barcode Scanner", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "掃碼槍主體", owner: "OM" },
    { name: "Fixture Base Plate", level1: "生產設備與工具", level2: "治具與夾具", level3: "治具與夾具", owner: "MFG" },
    { name: "Torque Screwdriver", level1: "生產設備與工具", level2: "設備工程工具", level3: "輔助工具", owner: "MFG" },
    { name: "Cleanroom Wiper", level1: "生產設備與工具", level2: "耗材", level3: "無塵室耗材", owner: "Unit" },
    { name: "Network Switch", level1: "生產設備與工具", level2: "IT線材與耗材", level3: "網路線材", owner: "OM" },
    { name: "ESD Workbench", level1: "生產設備與工具", level2: "產線通用設備", level3: "工作站與設備", owner: "MFG" },
    { name: "Label Printer", level1: "生產設備與工具", level2: "IT硬體與設備", level3: "印表機", owner: "OM" },
    { name: "Safety Gloves", level1: "生產設備與工具", level2: "安全相關", level3: "安全防護", owner: "Unit" },
    { name: "Vision Light Bar", level1: "生產設備與工具", level2: "設備配件", level3: "設備零組件", owner: "MFG" },
  ];

  function two(value) {
    return String(value).padStart(2, "0");
  }

  function three(value) {
    return String(value).padStart(3, "0");
  }

  function isoDay(day, hour = 8, minute = 0) {
    return `2026-06-${two(day)}T${two(hour)}:${two(minute)}:00.000Z`;
  }

  function phaseTotal(stationBreakdown, phase) {
    return stationBreakdown
      .filter((entry) => entry.phase === phase)
      .reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
  }

  function withPhaseTotals(row) {
    return PHASES.reduce((next, phase) => {
      next[phase] = phaseTotal(next.stationBreakdown || [], phase);
      return next;
    }, { ...row });
  }

  function fixtureRowMatches(row) {
    if (!row) return false;
    if (row.testFixture === FIXTURE_MARKER || row.source === `test-fixture:${FIXTURE_MARKER}`) return true;
    return [row.id, row.sourceRecordId, row.requestPackageId]
      .some((value) => String(value || "").startsWith(FIXTURE_PREFIX));
  }

  function clearLargeQuantityFixtureRows(rows) {
    return Array.isArray(rows) ? rows.filter((row) => !fixtureRowMatches(row)) : [];
  }

  function buildStationBreakdown({ index, scenario, scope }) {
    const mfgRows = MFG_STATIONS.map((station, stationIndex) => {
      const phase = PHASES[(index + stationIndex) % PHASES.length];
      const carryoverQty = stationIndex === index % MFG_STATIONS.length ? index % 4 : 0;
      return {
        id: `${FIXTURE_PREFIX}SBD-${scenario}-${three(index)}-MFG-${two(stationIndex + 1)}`,
        demandType: "MFG",
        phase,
        station,
        demandUnit: "MFG",
        qty: ((index + 2) * (stationIndex + 3)) % 9 + 1,
        requestLine: scope.line,
        requesterDept: "MFG",
        demandDepartment: "MFG",
        carryoverFrom: carryoverQty ? `${scope.project} ${PHASE_LABELS[phase]} residual stock` : "",
        carryoverQty,
        carryoverReason: carryoverQty ? "Fixture carryover evidence; pending owner lock before cost impact." : "",
        remark: `${PHASE_LABELS[phase]} ${station} fixture demand`,
      };
    });
    const nonMfgRows = NON_MFG_UNITS.map((unit, unitIndex) => {
      const phase = PHASES[(index + unitIndex + 2) % PHASES.length];
      return {
        id: `${FIXTURE_PREFIX}SBD-${scenario}-${three(index)}-NM-${two(unitIndex + 1)}`,
        demandType: "Non-MFG",
        phase,
        station: "",
        demandUnit: unit,
        qty: ((index + 4) * (unitIndex + 2)) % 8 + 1,
        requestLine: scope.line,
        requesterDept: unit,
        demandDepartment: unit,
        carryoverFrom: "",
        carryoverQty: 0,
        carryoverReason: "",
        remark: `${PHASE_LABELS[phase]} ${unit} fixture support`,
      };
    });
    return [...mfgRows, ...nonMfgRows];
  }

  function workflowPatch(index, scope, family) {
    const day = 2 + (index % 18);
    const base = {
      status: "Submitted",
      submittedAt: isoDay(day, 8, (index * 3) % 60),
      submittedBy: index % 2 ? "Requester QA" : "Line Owner QA",
      requesterName: index % 2 ? "Requester QA" : "Line Owner QA",
      deptDriReviewStatus: "Pending Dept DRI Submission Review",
      deptDriReviewType: "Submission",
      deptDriReviewSubmittedAt: isoDay(day, 8, (index * 3 + 10) % 60),
      nextStep: "Dept DRI submission review",
      procurementStatus: "",
      omStatus: "",
      omStage: "",
    };
    const variant = index % 8;
    if (variant === 0) return base;
    if (variant === 1) {
      return {
        ...base,
        status: "Approved",
        deptDriReviewStatus: "Dept DRI Submission Approved",
        deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 15),
        deptDriSubmissionApprovedBy: "Dept DRI",
        costManagerAuthorizationStatus: "Pending Cost Manager Authorization",
        costManagerAuthorizationSubmittedAt: isoDay(day + 1, 9, 30),
        nextStep: "Cost Manager final authorization",
      };
    }
    if (variant === 2) {
      return {
        ...base,
        status: "Approved",
        deptDriReviewStatus: "Dept DRI Submission Approved",
        deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 20),
        costManagerAuthorizationStatus: "Cost Manager Authorized",
        costManagerAuthorizedAt: isoDay(day + 2, 10, 20),
        procurementStatus: "Sent to OM Purchasing",
        sentToOmAt: isoDay(day + 2, 10, 30),
        pasRequired: true,
        omStatus: "Received Handoff",
        omStage: "pasRequest",
        nextStep: "OM Leader intake / PAS Demand No assignment",
      };
    }
    if (variant === 3) {
      return {
        ...base,
        status: "Approved",
        deptDriReviewStatus: "Dept DRI Submission Approved",
        deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 25),
        costManagerAuthorizationStatus: "Cost Manager Authorized",
        costManagerAuthorizedAt: isoDay(day + 2, 10, 25),
        procurementStatus: "Sent to OM Purchasing",
        sentToOmAt: isoDay(day + 2, 10, 40),
        pasRequired: true,
        pasDemandNo: `PAS-${scope.project}-${three(index)}`,
        pasDemandNoRecordedAt: isoDay(day + 3, 9, 5),
        omStatus: "Received Handoff",
        omStage: "pasResult",
        omAssigneeName: scope.project === "F27" ? "Linh" : "Giang",
        omAssigneeId: scope.project === "F27" ? "om-member-linh" : "om-member-giang",
        nextStep: "OM PAS quote result",
      };
    }
    if (variant === 4) {
      return {
        ...base,
        status: "Approved",
        deptDriReviewStatus: "Dept DRI Submission Approved",
        deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 35),
        costManagerAuthorizationStatus: "Cost Manager Authorized",
        costManagerAuthorizedAt: isoDay(day + 2, 10, 35),
        procurementStatus: "Sent to OM Purchasing",
        sentToOmAt: isoDay(day + 2, 10, 50),
        pasRequired: true,
        pasDemandNo: `PAS-${scope.project}-${three(index)}`,
        pasMaterialNo: `PAS-MAT-${three(index)}`,
        vendor: `Fixture Vendor ${two(index % 12)}`,
        vendorPartNo: `VN-FIX-${three(index)}`,
        updatedPrice: 42 + (index % 20) * 7,
        updatedPriceUsd: 42 + (index % 20) * 7,
        quoteDate: "2026-06-12",
        quoteValidUntil: index % 3 ? "2026-07-18" : "2026-06-22",
        quotationPdf: `fixture-quote-${three(index)}.png`,
        quotationExcel: `fixture-quote-${three(index)}.xlsx`,
        quoteReadyAt: isoDay(day + 4, 11, 5),
        quoteException: true,
        priceDeltaUsd: 0.41 + (index % 6) * 0.2,
        priceDecisionStatus: "Price Escalation Required",
        priceApprovalStatus: "Pending Dept DRI Review",
        omStatus: "Price Escalation Required",
        omStage: "pasResult",
        omAssigneeName: scope.project === "F27" ? "Linh" : "Giang",
        omAssigneeId: scope.project === "F27" ? "om-member-linh" : "om-member-giang",
        nextStep: "Dept DRI price exception review",
      };
    }
    if (variant === 5) {
      return {
        ...base,
        status: "Approved",
        requestType: "Temporary Budget Request",
        tempBudgetMeta: { requestType: "Temporary Budget Request" },
        estimatedUnitPrice: 55 + (index % 16) * 9,
        estimatedUnitPriceUsd: 55 + (index % 16) * 9,
        estimatedAmount: 2500 + index * 18,
        budgetReason: "Fixture temporary budget row for price exception review.",
        deptDriReviewStatus: "Dept DRI Submission Approved",
        deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 45),
        costManagerAuthorizationStatus: "Cost Manager Authorized",
        costManagerAuthorizedAt: isoDay(day + 2, 10, 45),
        procurementStatus: "Sent to OM Purchasing",
        sentToOmAt: isoDay(day + 2, 10, 55),
        pasRequired: true,
        pasDemandNo: `PAS-TB-${scope.project}-${three(index)}`,
        pasMaterialNo: `PAS-TB-MAT-${three(index)}`,
        vendor: `Budget Vendor ${two(index % 9)}`,
        vendorPartNo: `BUD-FIX-${three(index)}`,
        updatedPrice: 95 + (index % 20) * 8,
        quoteDate: "2026-06-13",
        quoteValidUntil: "2026-07-20",
        quotationPdf: `fixture-budget-${three(index)}.png`,
        quotationExcel: `fixture-budget-${three(index)}.xlsx`,
        quoteReadyAt: isoDay(day + 4, 12, 5),
        priceDecisionStatus: "Price Escalation Required",
        priceApprovalStatus: "Pending Budget Approver Review",
        driApprovedAt: isoDay(day + 5, 13, 10),
        driApprovedBy: "Dept DRI",
        omStatus: "Price Escalation Required",
        omStage: "pasResult",
        nextStep: "Budget exception approval",
      };
    }
    if (variant === 6) {
      return {
        ...base,
        status: "Approved",
        deptDriReviewStatus: "Dept DRI Submission Approved",
        deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 50),
        costManagerAuthorizationStatus: "Cost Manager Authorized",
        costManagerAuthorizedAt: isoDay(day + 2, 10, 50),
        procurementStatus: "Sent to OM Purchasing",
        sentToOmAt: isoDay(day + 2, 11, 5),
        pasRequired: true,
        pasDemandNo: `PAS-EXP-${scope.project}-${three(index)}`,
        pasMaterialNo: `PAS-EXP-MAT-${three(index)}`,
        vendor: `Export Vendor ${two(index % 7)}`,
        vendorPartNo: `EXP-FIX-${three(index)}`,
        updatedPrice: 72 + (index % 20) * 6,
        quoteDate: "2026-06-10",
        quoteValidUntil: "2026-07-25",
        quotationPdf: `fixture-export-${three(index)}.png`,
        quotationExcel: `fixture-export-${three(index)}.xlsx`,
        quoteReadyAt: isoDay(day + 4, 12, 30),
        omStatus: "Requester Confirmed",
        omStage: "finalExport",
        userAQuoteDecisionStatus: "Requester Confirmed",
        userAQuoteDecisionAt: isoDay(day + 5, 14, 0),
        finalExportStatus: "Ready for Handoff",
        finalExportPackageCode: `${scope.project}-MP-FIX-${three(index)}OM`,
        finalExportCostType: index % 2 ? "Capex" : "Expense",
        nextStep: "OM export package",
      };
    }
    return {
      ...base,
      status: "Approved",
      deptDriReviewStatus: "Dept DRI Submission Approved",
      deptDriSubmissionApprovedAt: isoDay(day + 1, 9, 55),
      costManagerAuthorizationStatus: "Cost Manager Authorized",
      costManagerAuthorizedAt: isoDay(day + 2, 10, 55),
      projectDriApprovedAt: isoDay(day + 3, 12, 0),
      procurementStatus: "Sent to Buyer Handoff",
      sentToOmAt: isoDay(day + 2, 11, 10),
      pasDemandNo: `PAS-BUY-${scope.project}-${three(index)}`,
      pasMaterialNo: `PAS-BUY-MAT-${three(index)}`,
      vendor: `Buyer Vendor ${two(index % 8)}`,
      vendorPartNo: `BUY-FIX-${three(index)}`,
      updatedPrice: 88 + (index % 20) * 5,
      quoteDate: "2026-06-11",
      quoteValidUntil: "2026-07-28",
      quotationPdf: `fixture-buyer-${three(index)}.png`,
      quotationExcel: `fixture-buyer-${three(index)}.xlsx`,
      omStatus: "Requester Confirmed",
      omStage: "buyerHandoff",
      userAQuoteDecisionStatus: "Requester Confirmed",
      finalExportStatus: "Exported to CFA",
      finalExportedAt: isoDay(day + 5, 15, 0),
      finalExportPackageCode: `${scope.project}-MP-BUY-${three(index)}OM`,
      finalExportCostType: index % 2 ? "Capex" : "Expense",
      buyerStatus: "Buyer Received",
      buyerReceivedAt: isoDay(day + 5, 15, 30),
      buyerPoNo: index % 3 ? "" : `PO-FIX-${three(index)}`,
      nextStep: "Buyer PR / PO tracking",
    };
  }

  function buildLargeQuantityFixture(options = {}) {
    const count = Math.max(1, Number(options.count || 144));
    const scenario = String(options.scenario || "P10-MP").replace(/[^A-Z0-9-]/gi, "").toUpperCase() || "P10-MP";
    return Array.from({ length: count }, (_, offset) => {
      const index = offset + 1;
      const scope = PROJECT_SCOPES[offset % PROJECT_SCOPES.length];
      const family = ITEM_FAMILIES[offset % ITEM_FAMILIES.length];
      const stationBreakdown = buildStationBreakdown({ index, scenario, scope });
      const basePrice = 35 + (index % 30) * 6;
      const row = {
        id: `${FIXTURE_PREFIX}REQ-${scenario}-${three(index)}`,
        sourceRecordId: `${FIXTURE_PREFIX}SRC-${scenario}-${three(index)}`,
        requestPackageId: `${FIXTURE_PREFIX}PKG-${scenario}-${three(index)}`,
        testFixture: FIXTURE_MARKER,
        source: `test-fixture:${FIXTURE_MARKER}`,
        project: scope.project,
        yearProject: scope.yearProject,
        projectCode: scope.projectCode,
        projectType: scope.projectType,
        requestLine: scope.line,
        line: scope.line,
        name: `${family.name} ${scenario} ${three(index)}`,
        detail: `${family.name} fixture row with intentionally long detail for UI/UX stress review across P1.0, P1.1, EVT, DVT, PVT, and MP.`,
        spec: `${family.name} / ${scope.project} / ${scope.line} / long mock spec with bilingual text, vendor-like references hidden from Requester, and enough length to test table wrapping.`,
        purpose: `${scope.project} ${scope.line} line-opening mock demand from P1.0 to MP.`,
        level1: family.level1,
        level2: family.level2,
        level3: family.level3,
        itemOwner: family.owner,
        department: "MFG",
        requesterDept: "MFG",
        demandDepartment: "MFG",
        demandUnit: "MFG",
        requestAction: index % 9 === 0 ? "Other" : "New Buy",
        requestActionOtherText: index % 9 === 0 ? "Fixture row validates Other reason rendering without widening the worksheet." : "",
        selected: false,
        unitPrice: basePrice,
        unitPriceUsd: basePrice,
        estimatedUnitPrice: basePrice,
        estimatedUnitPriceUsd: basePrice,
        requiredDeliveryDate: `2026-08-${two(1 + (index % 20))}`,
        requiredDeliveryDateDri: `2026-08-${two(1 + (index % 20))}`,
        needDate: `2026-08-${two(1 + (index % 20))}`,
        stationBreakdown,
        fixtureScenario: scenario,
        fixturePhaseCoverage: "P1.0 / P1.1 / EVT / DVT / PVT / MP",
        warehouseSuggestionStatus: index % 6 === 0 ? "Inventory Available" : "",
        warehouseCandidateStatus: index % 6 === 0 ? (family.owner === "OM" ? "Pending OM" : family.owner === "MFG" ? "Pending MFG Owner" : "Pending Unit Owner") : "",
        carryoverStatus: index % 7 === 0 ? "Candidate" : "",
        ...workflowPatch(index, scope, family),
      };
      return withPhaseTotals(row);
    });
  }

  function buildRequesterWorksheetDraftFixture(options = {}) {
    const scenario = String(options.scenario || "P10-MP").replace(/[^A-Z0-9-]/gi, "").toUpperCase() || "P10-MP";
    const count = Math.max(1, Number(options.requesterDraftCount || 24));
    const scope = { project: "P26", projectType: "G", projectCode: "", line: "Line 1", yearProject: "P26" };
    return Array.from({ length: count }, (_, offset) => {
      const index = offset + 1;
      const family = ITEM_FAMILIES[(offset + 2) % ITEM_FAMILIES.length];
      const stationBreakdown = MFG_STATIONS.slice(0, 6).map((station, stationIndex) => {
        const phase = PHASES[(index + stationIndex) % PHASES.length];
        return {
          id: `${FIXTURE_PREFIX}SBD-${scenario}-REQ-DRAFT-${three(index)}-${two(stationIndex + 1)}`,
          demandType: "MFG",
          phase,
          station,
          demandUnit: "MFG",
          qty: ((index + stationIndex) % 7) + 1,
          requestLine: "Line 1",
          requesterDept: "MFG",
          demandDepartment: "MFG",
        carryoverFrom: stationIndex === 0 && index % 5 === 0 ? "P26 fixture warehouse hint" : "",
          carryoverQty: stationIndex === 0 && index % 5 === 0 ? 1 : 0,
          carryoverReason: stationIndex === 0 && index % 5 === 0 ? "Requester-visible warehouse hint; evidence only before owner lock." : "",
          remark: `${PHASE_LABELS[phase]} ${station} requester worksheet draft`,
        };
      });
      return withPhaseTotals({
        id: `${FIXTURE_PREFIX}REQ-${scenario}-REQUESTER-DRAFT-${three(index)}`,
        sourceRecordId: `${FIXTURE_PREFIX}SRC-${scenario}-REQUESTER-DRAFT-${three(index)}`,
        requestPackageId: `${FIXTURE_PREFIX}PKG-${scenario}-REQUESTER-DRAFT-${three(index)}`,
        testFixture: FIXTURE_MARKER,
        source: `test-fixture:${FIXTURE_MARKER}`,
        project: scope.project,
        yearProject: scope.yearProject,
        sourceProject: scope.yearProject,
        projectCode: scope.projectCode,
        projectType: scope.projectType,
        requestLine: "Line 1",
        line: "Line 1",
        name: `${family.name} requester worksheet ${scenario} ${three(index)}`,
        detail: `${family.name} requester-facing draft row for full worksheet stress review across P1.0, P1.1, EVT, DVT, PVT, and MP.`,
        spec: `${family.name} / ${scope.yearProject} / Line 1 / requester-safe long spec without vendor, PAS material number, factory material number, OM assignee, or FTV.`,
        purpose: `${scope.yearProject} Line 1 requester worksheet mock demand from P1.0 to MP.`,
        level1: family.level1,
        level2: family.level2,
        level3: family.level3,
        itemOwner: family.owner,
        department: "MFG",
        requesterDept: "MFG",
        demandDepartment: "MFG",
        demandUnit: "MFG",
        requestAction: index % 8 === 0 ? "Other" : "New Buy",
        requestActionOtherText: index % 8 === 0 ? "Requester draft validates Other reason before submit." : "",
        status: "Draft",
        selected: false,
        unitPrice: 0,
        unitPriceUsd: 0,
        estimatedUnitPrice: 18 + (index % 12) * 4,
        estimatedUnitPriceUsd: 18 + (index % 12) * 4,
        requiredDeliveryDate: `2026-08-${two(1 + (index % 20))}`,
        needDate: `2026-08-${two(1 + (index % 20))}`,
        stationBreakdown,
        fixtureScenario: scenario,
        fixturePhaseCoverage: "P1.0 / P1.1 / EVT / DVT / PVT / MP",
        warehouseSuggestionStatus: index % 5 === 0 ? "Inventory Available" : "",
        carryoverStatus: index % 5 === 0 ? "Candidate" : "",
      });
    });
  }

  function installLargeQuantityFixtureRows(rows, options = {}) {
    return [
      ...buildRequesterWorksheetDraftFixture(options),
      ...buildLargeQuantityFixture(options),
      ...clearLargeQuantityFixtureRows(rows),
    ];
  }

  return {
    FIXTURE_MARKER,
    FIXTURE_PREFIX,
    PHASES,
    PHASE_LABELS,
    MFG_STATIONS,
    NON_MFG_UNITS,
    buildLargeQuantityFixture,
    buildRequesterWorksheetDraftFixture,
    clearLargeQuantityFixtureRows,
    installLargeQuantityFixtureRows,
    fixtureRowMatches,
  };
});
