const { chromium } = require("playwright");

function assertRoute(condition, message, payload) {
  if (!condition) {
    throw new Error(`${message}: ${JSON.stringify(payload)}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  await page.goto(`file://${process.cwd()}/index.html`);
  await page.waitForLoadState("domcontentloaded");

  const standardSubmissionRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-STANDARD-SUBMIT-ROUTE",
      project: "P26",
      name: "Standard PC DRI gate",
      detail: "Standard request should wait Dept DRI before OM",
      requestType: "Standard Demand",
      status: "Draft",
      selected: true,
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "MP", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      unitPrice: 100,
      unitPriceUsd: 100,
    };
    currentProject = "P26";
    currentRole = "requester";
    requests = [row, ...requests.filter((item) => item.id !== row.id && item.name !== row.name)];
    document.getElementById("requestPackageNeedDate").value = "2026-06-30";
    submitRequests();
    let updated = requests.find((item) => item.name === row.name);
    const afterSubmit = {
      status: updated.status,
      deptDriReviewStatus: updated.deptDriReviewStatus,
      omStage: updated.omStage,
      procurementStatus: updated.procurementStatus,
    };
    currentRole = "dri";
    applyPriceReviewDecision(updated.id, "approve");
    updated = requests.find((item) => item.name === row.name);
    const afterDri = {
      status: updated.status,
      deptDriReviewStatus: updated.deptDriReviewStatus,
      costManagerAuthorizationStatus: updated.costManagerAuthorizationStatus,
      omStage: updated.omStage,
      procurementStatus: updated.procurementStatus,
      sentToOmAt: Boolean(updated.sentToOmAt),
    };
    currentRole = "manager";
    applyCostManagerAuthorization(updated.id, "approve");
    updated = requests.find((item) => item.name === row.name);
    const afterCostManager = {
      status: updated.status,
      costManagerAuthorizationStatus: updated.costManagerAuthorizationStatus,
      omStage: updated.omStage,
      procurementStatus: updated.procurementStatus,
      sentToOmAt: Boolean(updated.sentToOmAt),
    };
    return { afterSubmit, afterDri, afterCostManager };
  });

  assertRoute(standardSubmissionRoute.afterSubmit.status === "Submitted", "Standard request should wait Dept DRI after submit", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterSubmit.deptDriReviewStatus === "Pending Dept DRI Submission Review", "Standard request should create Dept DRI submission review", standardSubmissionRoute);
  assertRoute(!standardSubmissionRoute.afterSubmit.omStage, "Standard request must not enter OM before Dept DRI approval", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterDri.status === "Submitted", "Dept DRI approval should keep requester submission before Cost Manager", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterDri.deptDriReviewStatus === "Dept DRI Submission Approved", "Dept DRI approval status should be recorded", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterDri.costManagerAuthorizationStatus === "Pending Cost Manager Authorization", "Dept DRI approval should wait Cost Manager authorization", standardSubmissionRoute);
  assertRoute(!standardSubmissionRoute.afterDri.omStage, "Dept DRI approval must not move row to OM before Cost Manager", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterCostManager.status === "Approved", "Cost Manager authorization should approve requester submission", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterCostManager.costManagerAuthorizationStatus === "Cost Manager Authorized", "Cost Manager authorization status should be recorded", standardSubmissionRoute);
  assertRoute(standardSubmissionRoute.afterCostManager.omStage === "pasRequest", "Cost Manager authorization should move row to OM Leader PAS intake", standardSubmissionRoute);

  const temporaryBudgetRoute = await page.evaluate(() => {
    const temp = {
      id: "TEST-TEMP-ROUTE",
      project: "P26",
      name: "Temporary Budget PC",
      detail: "Desktop PC temporary budget",
      requestType: "Temporary Budget Request",
      temporaryBudgetRequest: true,
      status: "Draft",
      selected: true,
      needDate: "2026-06-30",
      requiredDeliveryDate: "2026-06-30",
      stationBreakdown: [{ phase: "MP", demandType: "MFG", station: "CG", qty: 2, remark: "" }],
      mp: 2,
      unitPrice: 100,
      unitPriceUsd: 100,
      updatedPriceVnd: 4000000,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-DEMO",
      procurementStatus: "",
      omStage: "",
    };
    currentProject = "P26";
    currentRole = "requester";
    requests = [temp, ...requests.filter((row) => row.id !== temp.id && row.name !== temp.name)];
    document.getElementById("requestPackageNeedDate").value = "2026-06-30";
    submitRequests();
    let row = requests.find((item) => item.name === temp.name);
    const afterSubmit = {
      status: row.status,
      deptDriReviewStatus: row.deptDriReviewStatus,
      procurementStatus: row.procurementStatus,
      omStage: row.omStage,
      pasStatus: row.pasStatus,
    };

    currentRole = "dri";
    applyPriceReviewDecision(row.id, "approve");
    row = requests.find((item) => item.name === temp.name);
    const afterSubmissionDri = {
      status: row.status,
      deptDriReviewStatus: row.deptDriReviewStatus,
      costManagerAuthorizationStatus: row.costManagerAuthorizationStatus,
      procurementStatus: row.procurementStatus,
      omStage: row.omStage,
      pasStatus: row.pasStatus,
    };

    currentRole = "manager";
    applyCostManagerAuthorization(row.id, "approve");
    row = requests.find((item) => item.name === temp.name);
    const afterCostManager = {
      status: row.status,
      costManagerAuthorizationStatus: row.costManagerAuthorizationStatus,
      procurementStatus: row.procurementStatus,
      omStage: row.omStage,
      pasStatus: row.pasStatus,
    };

    row = {
      ...row,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-DEMO",
      updatedPriceVnd: 4000000,
    };
    requests = requests.map((item) => item.id === row.id ? row : item);
    currentRole = "omMember";
    saveOmQuoteInfoRows([row]);
    row = requests.find((item) => item.id === row.id);
    const afterQuote = { priceDecisionStatus: row.priceDecisionStatus, priceApprovalStatus: row.priceApprovalStatus, omStage: row.omStage };

    currentRole = "dri";
    applyPriceReviewDecision(row.id, "approve");
    row = requests.find((item) => item.id === row.id);
    const afterDri = {
      priceDecisionStatus: row.priceDecisionStatus,
      priceApprovalStatus: row.priceApprovalStatus,
      omStage: row.omStage,
      driApprovedAt: Boolean(row.driApprovedAt),
      projectDriApprovedAt: Boolean(row.projectDriApprovedAt),
    };

    currentRole = "projectDri";
    applyPriceReviewDecision(row.id, "approve");
    row = requests.find((item) => item.id === row.id);
    const afterBudget = {
      priceDecisionStatus: row.priceDecisionStatus,
      priceApprovalStatus: row.priceApprovalStatus,
      omStage: row.omStage,
      userAQuoteDecisionStatus: row.userAQuoteDecisionStatus,
      projectDriApprovedAt: Boolean(row.projectDriApprovedAt),
    };

    return { afterSubmit, afterSubmissionDri, afterCostManager, afterQuote, afterDri, afterBudget };
  });

  assertRoute(temporaryBudgetRoute.afterSubmit.status === "Submitted", "Temporary Budget should wait Dept DRI after submit", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterSubmit.deptDriReviewStatus === "Pending Dept DRI Submission Review", "Temporary Budget should create Dept DRI initial review", temporaryBudgetRoute);
  assertRoute(!temporaryBudgetRoute.afterSubmit.omStage, "Temporary Budget must not enter OM before Dept DRI initial approval", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterSubmissionDri.status === "Submitted", "Dept DRI initial approval should keep Temporary Budget before Cost Manager", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterSubmissionDri.costManagerAuthorizationStatus === "Pending Cost Manager Authorization", "Dept DRI initial approval should wait Cost Manager", temporaryBudgetRoute);
  assertRoute(!temporaryBudgetRoute.afterSubmissionDri.omStage, "Dept DRI initial approval must not send Temporary Budget directly to OM", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterCostManager.status === "Approved", "Cost Manager authorization should approve Temporary Budget submission", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterCostManager.omStage === "pasRequest", "Cost Manager authorization should send Temporary Budget to OM PAS Demand No", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterQuote.omStage === "priceReview", "Temporary Budget quote should enter price review", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterDri.priceApprovalStatus === "Pending Budget Approver Review", "Dept DRI approval must wait for Budget Approver", temporaryBudgetRoute);
  assertRoute(!temporaryBudgetRoute.afterDri.projectDriApprovedAt, "Dept DRI approval must not act as Budget Approver", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterBudget.omStage === "finalExport", "Budget Approver approval should move to OM Export Package", temporaryBudgetRoute);
  assertRoute(temporaryBudgetRoute.afterBudget.userAQuoteDecisionStatus === "User Confirmation Not Required", "Budget approval should not require Requester confirmation", temporaryBudgetRoute);

  const rejectRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-REJECT-ROUTE",
      project: "P26",
      name: "Rejected Budget PC",
      detail: "Desktop PC temporary budget reject",
      requestType: "Temporary Budget Request",
      temporaryBudgetRequest: true,
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      unitPrice: 100,
      unitPriceUsd: 100,
      updatedPriceVnd: 4000000,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-DEMO-REJECT",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "priceReview",
      priceDecisionStatus: "Price Escalation Required",
      priceApprovalStatus: "Pending Dept DRI Review",
    };
    currentProject = "P26";
    currentRole = "dri";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    const originalPrompt = window.prompt;
    window.prompt = () => "Budget reason not accepted";
    applyPriceReviewDecision(row.id, "reject");
    window.prompt = originalPrompt;
    const updated = requests.find((item) => item.id === row.id);
    currentRole = "requester";
    const actionRows = needConfirmationRows().map((item) => item.id);
    return {
      priceDecisionStatus: updated.priceDecisionStatus,
      priceApprovalStatus: updated.priceApprovalStatus,
      priceReviewReworkRequired: updated.priceReviewReworkRequired,
      inRequesterActionRequired: actionRows.includes(row.id),
    };
  });

  assertRoute(rejectRoute.priceDecisionStatus === "Price Escalation Rejected", "Reject should close price decision as rejected", rejectRoute);
  assertRoute(rejectRoute.priceReviewReworkRequired === true, "Reject should mark Requester rework required", rejectRoute);
  assertRoute(rejectRoute.inRequesterActionRequired === true, "Reject should appear in Requester Action Required", rejectRoute);

  const omRejectRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-OM-REJECT-ROUTE",
      project: "P26",
      name: "Mini PC OM rejected before quote",
      detail: "Desktop PC requester revision before PAS quote",
      requestType: "Standard Demand",
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      unitPrice: 100,
      unitPriceUsd: 100,
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasRequest",
    };
    currentProject = "P26";
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    commitExternalResult([row], { status: EXT_REJECTED_DRI, reason: "OM cannot request PAS no until requester revises qty.", owner: "OM Purchasing" });
    let updated = requests.find((item) => item.id === row.id);
    currentRole = "requester";
    const actionRows = needConfirmationRows().map((item) => item.id);
    const originalPrompt = window.prompt;
    window.prompt = () => "Requester revised quantity after OM reject";
    createUserAAmendmentDraft(row.id);
    window.prompt = originalPrompt;
    updated = requests.find((item) => item.id === row.id);
    const amendment = requests.find((item) => item.amendmentOf === row.id);
    return {
      externalReviewStatus: updated.externalReviewStatus,
      omRejectReworkRequired: updated.omRejectReworkRequired,
      omRejectReason: updated.omRejectReason,
      inRequesterActionRequired: actionRows.includes(row.id),
      amendmentCreated: Boolean(amendment),
      amendmentStatus: amendment?.amendmentStatus || "",
      amendmentOmStage: amendment?.omStage || "",
    };
  });

  assertRoute(omRejectRoute.externalReviewStatus === "Rejected to DRI", "OM reject should record external reject status", omRejectRoute);
  assertRoute(omRejectRoute.omRejectReworkRequired === true, "OM reject should mark requester rework required", omRejectRoute);
  assertRoute(omRejectRoute.inRequesterActionRequired === true, "OM reject should appear in Requester Action Required", omRejectRoute);
  assertRoute(omRejectRoute.amendmentCreated === true, "PAS-stage OM reject should allow Requester to create an amendment draft", omRejectRoute);
  assertRoute(omRejectRoute.amendmentStatus === "Waiting OM Amendment", "PAS-stage OM reject amendment should return to OM amendment workflow", omRejectRoute);
  assertRoute(omRejectRoute.amendmentOmStage === "pasResult", "PAS-stage OM reject amendment should reopen OM review stage", omRejectRoute);

  const standardAutoRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-AUTO-ROUTE",
      project: "P26",
      name: "Mini PC auto cleared",
      detail: "Desktop PC",
      requestType: "Standard Demand",
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      unitPrice: 100,
      unitPriceUsd: 100,
      updatedPriceUsd: 100.4,
      vendor: "Demo Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-AUTO",
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-giang",
      omAssigneeName: "Giang",
    };
    currentRole = "omMember";
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    saveOmQuoteInfoRows([row], { requireComplete: true });
    let updated = requests.find((item) => item.id === row.id);
    const afterSave = {
      priceDecisionStatus: updated.priceDecisionStatus,
      priceApprovalStatus: updated.priceApprovalStatus,
      omStage: updated.omStage,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
    };
    sendOmPasRowsToUserConfirm([updated]);
    updated = requests.find((item) => item.id === row.id);
    const afterSend = {
      omStage: updated.omStage,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
    };
    currentRole = "requester";
    confirmUserAOmQuote(row.id);
    updated = requests.find((item) => item.id === row.id);
    const afterRequesterConfirm = {
      omStage: updated.omStage,
      userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
      priceDecisionStatus: updated.priceDecisionStatus,
    };
    return {
      afterSave,
      afterSend,
      afterRequesterConfirm,
    };
  });

  assertRoute(standardAutoRoute.afterSave.priceDecisionStatus === "Auto Cleared", "Under-threshold standard quote should auto clear as audit", standardAutoRoute);
  assertRoute(standardAutoRoute.afterSave.omStage === "pasResult", "Saved standard quote should stay in PAS Quote Result before User A confirmation", standardAutoRoute);
  assertRoute(standardAutoRoute.afterSend.omStage === "userConfirm", "Standard quote should move to User A confirmation after Send", standardAutoRoute);
  assertRoute(standardAutoRoute.afterSend.userAQuoteDecisionStatus === "Waiting User A Confirmation", "Standard quote should wait User A confirmation", standardAutoRoute);
  assertRoute(standardAutoRoute.afterRequesterConfirm.omStage === "finalExport", "Auto-cleared standard quote should move to Export Package only after User A confirms", standardAutoRoute);
  assertRoute(standardAutoRoute.afterRequesterConfirm.userAQuoteDecisionStatus === "Requester Confirmed", "Requester confirmation should be recorded", standardAutoRoute);

  async function assertEscalationRoute(rowPatch, label) {
    const route = await page.evaluate((input) => {
      const row = {
        id: input.id,
        project: "P26",
        name: input.name,
        detail: input.detail,
        requestType: "Standard Demand",
        status: "Approved",
        needDate: "2026-06-30",
        stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
        mp: 1,
        vendor: "Demo Vendor",
        quoteDate: "2026-06-04",
        quoteValidUntil: "2026-07-04",
        quotationPdf: "demo.pdf",
        quotationExcel: "demo.xlsx",
        pasMaterialNo: input.id,
        procurementStatus: "Sent to OM Purchasing",
        omStage: "pasResult",
        omAssigneeId: "om-member-giang",
        omAssigneeName: "Giang",
        ...input,
      };
      currentRole = "omMember";
      requests = [row, ...requests.filter((item) => item.id !== row.id)];
      saveOmQuoteInfoRows([row], { requireComplete: true });
      let updated = requests.find((item) => item.id === row.id);
      const afterQuote = {
        priceDecisionStatus: updated.priceDecisionStatus,
        priceApprovalStatus: updated.priceApprovalStatus,
        omStage: updated.omStage,
      };
      sendOmPasRowsToUserConfirm([updated]);
      updated = requests.find((item) => item.id === row.id);
      const afterSend = {
        omStage: updated.omStage,
        userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
      };
      currentRole = "requester";
      confirmUserAOmQuote(row.id);
      updated = requests.find((item) => item.id === row.id);
      const afterRequesterConfirm = {
        omStage: updated.omStage,
        userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
        priceApprovalStatus: updated.priceApprovalStatus,
      };
      currentRole = "dri";
      applyPriceReviewDecision(row.id, "approve");
      updated = requests.find((item) => item.id === row.id);
      const afterDri = {
        priceApprovalStatus: updated.priceApprovalStatus,
        omStage: updated.omStage,
        driApprovedAt: Boolean(updated.driApprovedAt),
        projectDriApprovedAt: Boolean(updated.projectDriApprovedAt),
      };
      currentRole = "projectDri";
      applyPriceReviewDecision(row.id, "approve");
      updated = requests.find((item) => item.id === row.id);
      const afterBudget = {
        priceDecisionStatus: updated.priceDecisionStatus,
        priceApprovalStatus: updated.priceApprovalStatus,
        omStage: updated.omStage,
        userAQuoteDecisionStatus: updated.userAQuoteDecisionStatus,
        projectDriApprovedAt: Boolean(updated.projectDriApprovedAt),
      };
      return { afterQuote, afterSend, afterRequesterConfirm, afterDri, afterBudget };
    }, rowPatch);

    assertRoute(route.afterQuote.priceDecisionStatus === "Price Escalation Required", `${label} should require escalation`, route);
    assertRoute(route.afterQuote.omStage === "pasResult", `${label} should stay in PAS Quote Result before User A confirmation`, route);
    assertRoute(route.afterSend.omStage === "userConfirm", `${label} should wait User A confirmation after Send`, route);
    assertRoute(route.afterRequesterConfirm.omStage === "priceReview", `${label} should enter price review only after User A confirms`, route);
    assertRoute(route.afterDri.priceApprovalStatus === "Pending Budget Approver Review", `${label} Dept DRI approval should wait for Budget Approver`, route);
    assertRoute(route.afterDri.omStage === "priceReview", `${label} Dept DRI approval should stay in price review`, route);
    assertRoute(route.afterBudget.omStage === "finalExport", `${label} Budget Approver approval should move to Export Package`, route);
    assertRoute(route.afterBudget.userAQuoteDecisionStatus === "User Confirmation Not Required", `${label} Budget approval should not require Requester confirmation`, route);
  }

  await assertEscalationRoute({
    id: "TEST-OVER-THRESHOLD",
    name: "Fixture over threshold",
    detail: "Production fixture",
    unitPriceUsd: 100,
    updatedPriceUsd: 100.41,
  }, "Over-threshold standard quote");

  await assertEscalationRoute({
    id: "TEST-NO-HISTORY",
    name: "Fixture no history",
    detail: "Production fixture",
    unitPriceUsd: 0,
    unitPrice: 0,
    updatedPriceUsd: 100,
  }, "No-history standard quote");

  const omPermissionRoute = await page.evaluate(() => {
    const row = {
      id: "TEST-OM-PERMISSION",
      project: "P26",
      name: "Permission Quote Row",
      detail: "Permission smoke",
      requestType: "Standard Demand",
      status: "Approved",
      needDate: "2026-06-30",
      stationBreakdown: [{ phase: "mp", demandType: "MFG", station: "CG", qty: 1, remark: "" }],
      mp: 1,
      vendor: "Permission Vendor",
      quoteDate: "2026-06-04",
      quoteValidUntil: "2026-07-04",
      quotationPdf: "demo.pdf",
      quotationExcel: "demo.xlsx",
      pasMaterialNo: "PAS-PERMISSION",
      updatedPriceUsd: 100,
      procurementStatus: "Sent to OM Purchasing",
      omStage: "pasResult",
      omAssigneeId: "om-member-linh",
      omAssigneeName: "Linh",
    };
    requests = [row, ...requests.filter((item) => item.id !== row.id)];
    currentRole = "omLeader";
    const leaderCanOperate = canOperateOmRow(row);
    currentRole = "omMember";
    const memberCanOperateOther = canOperateOmRow(row);
    const assignedRow = { ...row, omAssigneeId: "om-member-giang", omAssigneeName: "Giang" };
    requests = requests.map((item) => item.id === row.id ? assignedRow : item);
    const memberCanOperateOwn = canOperateOmRow(assignedRow);
    return { leaderCanOperate, memberCanOperateOther, memberCanOperateOwn };
  });

  assertRoute(omPermissionRoute.leaderCanOperate === false, "OM Leader should not edit quote rows directly", omPermissionRoute);
  assertRoute(omPermissionRoute.memberCanOperateOther === false, "OM Member should not edit rows assigned to another member", omPermissionRoute);
  assertRoute(omPermissionRoute.memberCanOperateOwn === true, "Assigned OM Member should edit own quote row", omPermissionRoute);

  await browser.close();
})();
