(function registerWorkflowStatusModule(root) {
  const OWNER_PRIORITY = {
    "Dept DRI": 0,
    "Cost Manager": 1,
    "Budget Approver": 2,
    Requester: 2,
    "PAS / Bidding": 3,
    "OM Purchasing": 4,
    "Buyer Handoff": 5,
    "OM Complete": 7,
  };

  const STAGE_PRIORITY = {
    "Dept DRI Review": 0,
    "Cost Manager Authorization": 1,
    "Budget Approval": 2,
    "PAS Demand No": 3,
    "PAS Quote Result": 4,
    "Waiting Requester": 4,
    "Price Review": 5,
    "Export Package": 6,
    "Buyer PR / PO": 7,
    Completed: 9,
  };

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function firstDate(values) {
    return values.filter(Boolean).sort()[0] || "";
  }

  function daysBetweenDates(from, today = new Date()) {
    if (!from) return null;
    const start = new Date(from);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(today);
    if (Number.isNaN(end.getTime())) return null;
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((end - start) / 86400000));
  }

  function isQuoteReady(row = {}) {
    return Boolean(
      row.quoteReady
      || row.quoteCompletionReadyAt
      || row.quoteReadyAt
      || (row.pasMaterialNo && (row.updatedPrice || row.updatedPriceVnd || row.unitPriceVnd) && row.quoteDate && (row.quotationPdf || row.quotePdf || row.quoteExcel))
    );
  }

  function hasOmSignals(row = {}) {
    return Boolean(
      row.omStage
      || row.sentToOmAt
      || row.pasDemandNo
      || row.pasDemandNoRecordedAt
      || row.quoteCompletionReadyAt
      || row.sentToUserAAt
      || row.finalExportStatus
      || row.finalExportedAt
    );
  }

  function isWaitingRequester(row = {}) {
    return Boolean(
      row.userAQuoteDecisionStatus === "Waiting Requester Confirmation"
      || row.userAQuoteDecisionStatus === "Waiting User A Confirmation"
      || row.omStage === "userConfirm"
    ) && !row.userAQuoteDecisionAt;
  }

  function quoteStatus(row = {}, today = new Date()) {
    if (!row.pasDemandNo || !isQuoteReady(row)) return "Waiting PAS Reply";
    const validUntil = row.quoteValidUntil || row.validUntil || row.quoteExpiry;
    if (!validUntil) return "Missing Validity";
    const target = new Date(`${validUntil}T00:00:00`);
    const base = new Date(today);
    if (Number.isNaN(target.getTime()) || Number.isNaN(base.getTime())) return "Missing Validity";
    target.setHours(0, 0, 0, 0);
    base.setHours(0, 0, 0, 0);
    const remaining = Math.ceil((target - base) / 86400000);
    if (remaining < 0) return "Expired / Requote Required";
    if (remaining <= 14) return "Expiring Soon";
    return "Reusable Quote";
  }

  function pendingOwner(row = {}) {
    if (row.finalExportedAt || row.finalExportStatus || row.buyerStatus || row.buyerReceivedAt) return "Buyer Handoff";
    if (row.priceDecisionStatus === "Price Escalation Required" && !row.driApprovedAt) return "Dept DRI";
    if (row.priceDecisionStatus === "Price Escalation Required" && row.driApprovedAt && !row.projectDriApprovedAt) return "Budget Approver";
    if (row.costManagerAuthorizationStatus === "Pending Cost Manager Authorization") return "Cost Manager";
    if (isWaitingRequester(row)) return "Requester";
    if (row.pasDemandNo && !isQuoteReady(row)) return "PAS / Bidding";
    if (["Submitted", "Pending Approval"].includes(row.status || "")) return "Dept DRI";
    if (normalize(row.budgetStatus).includes("pending")) return "Budget Approver";
    if (
      normalize(row.prStatus).includes("pending")
      || normalize(row.poStatus).includes("pending")
      || normalize(row.actualEta).includes("pending")
      || normalize(row.dtaActual).includes("pending")
      || normalize(row.lateStatus || row.procurementRemark).includes("late")
    ) return "Buyer Handoff";
    if (["Approved", "In Progress"].includes(row.status || "") || hasOmSignals(row)) return "OM Purchasing";
    return "OM Complete";
  }

  function currentStage(row = {}) {
    const owner = pendingOwner(row);
    if (owner === "Dept DRI") return "Dept DRI Review";
    if (owner === "Cost Manager") return "Cost Manager Authorization";
    if (owner === "Budget Approver") return "Budget Approval";
    if (owner === "Requester") return "Waiting Requester";
    if (owner === "PAS / Bidding") return "PAS Quote Result";
    if (owner === "Buyer Handoff") return "Buyer PR / PO";
    if (owner === "OM Complete") return "Completed";
    if (row.finalExportStatus || row.finalExportTarget || row.userAQuoteDecisionStatus === "Requester Confirmed" || row.omStage === "finalExport") return "Export Package";
    if (row.omStage === "priceReview" || row.priceDecisionStatus === "Price Escalation Required") return "Price Review";
    if (row.pasDemandNo || row.omStage === "pasResult") return "PAS Quote Result";
    if (hasOmSignals(row) || ["Approved", "In Progress"].includes(row.status || "")) return "PAS Demand No";
    return "Progress Review";
  }

  function submittedAt(row = {}) {
    return row.submittedAt
      || row.requestSubmittedAt
      || row.sentToOmAt
      || row.managerApprovedAt
      || row.approvedAt
      || row.requiredDeliveryDate
      || row.requestDeadline
      || "";
  }

  function receivedAt(row = {}) {
    return row.sentToOmAt || row.managerApprovedAt || row.decidedAt || row.approvedAt || row.submittedAt || "";
  }

  function stageStartAt(row = {}) {
    const stage = currentStage(row);
    if (stage === "Dept DRI Review") return row.submittedAt || row.requestSubmittedAt || submittedAt(row);
    if (stage === "Cost Manager Authorization") return row.costManagerAuthorizationSubmittedAt || row.deptDriSubmissionApprovedAt || submittedAt(row);
    if (stage === "Budget Approval") return row.driApprovedAt || row.approvedAt || submittedAt(row);
    if (stage === "PAS Quote Result") return row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt || receivedAt(row);
    if (stage === "Waiting Requester") return row.sentToUserAAt || row.quoteCompletionReadyAt || receivedAt(row);
    if (stage === "Export Package") return row.userAQuoteDecisionAt || row.finalExportPreparedAt || row.sentToUserAAt || receivedAt(row);
    if (stage === "Buyer PR / PO") return row.finalExportedAt || row.buyerReceivedAt || row.sentToBuyerAt || submittedAt(row);
    return receivedAt(row) || submittedAt(row);
  }

  function nextAction(row = {}) {
    const owner = pendingOwner(row);
    if (owner === "Dept DRI") return "Dept DRI approve / reject";
    if (owner === "Cost Manager") return "Cost Manager authorize / reject";
    if (owner === "Budget Approver") return "Budget approval decision";
    if (owner === "PAS / Bidding") return "Wait for PAS bidding result";
    if (owner === "Requester") return "Wait for Requester confirmation";
    if (owner === "Buyer Handoff") return "Buyer owns PR / PO after OM export";
    if (owner === "OM Complete") return "No action";
    const stage = currentStage(row);
    if (stage === "PAS Demand No") return "Enter PAS Demand No";
    if (stage === "PAS Quote Result") return "Complete PAS quote result";
    if (stage === "Export Package") return "Choose Expense/Capex and export package";
    return "Review blocker";
  }

  function requesterStatusLabels(row = {}) {
    const labels = [
      row.amendmentStatus || "",
      row.status === "Submitted" ? "Submitted to Dept DRI" : row.status,
      row.pasDemandNo ? "PAS Demand No" : "",
      row.userAQuoteDecisionStatus === "Waiting Requester Confirmation" || row.userAQuoteDecisionStatus === "Waiting User A Confirmation" ? "Action Required" : "",
      row.userAQuoteDecisionStatus === "Requester Confirmed" ? "Need Confirmed" : "",
      row.finalExportStatus || "",
      pendingOwner(row) === "Buyer Handoff" ? "Buyer PR / PO" : "",
    ].filter(Boolean);
    return [...new Set(labels)].slice(0, 3);
  }

  function timelineMilestones(row = {}) {
    return [
      { key: "submitted", label: "Submitted", done: ["Submitted", "Approved", "Rejected", "Reported", "Cancelled by Requester", "Cancelled"].includes(row.status), at: row.submittedAt },
      { key: "deptDri", label: row.status === "Rejected" ? "Rejected" : "Dept DRI", done: Boolean(row.decidedAt || row.driApprovedAt || ["Approved", "Rejected"].includes(row.status)), blocked: row.status === "Rejected", at: row.decidedAt || row.driApprovedAt },
      { key: "pasDemandNo", label: "PAS Demand No", done: Boolean(row.pasDemandNo), pending: Boolean(row.sentToOmAt && !row.pasDemandNo), at: row.pasDemandNoUpdatedAt || row.pasDemandNoRecordedAt },
      { key: "quoteReady", label: "Quote Ready", done: isQuoteReady(row), pending: Boolean(row.pasDemandNo && !isQuoteReady(row)), at: row.quoteReadyAt || row.quoteCompletionReadyAt },
      { key: "requesterConfirm", label: "Requester Confirm", done: Boolean(row.userAQuoteDecisionAt), pending: isWaitingRequester(row), at: row.userAQuoteDecisionAt || row.sentToUserAAt },
      { key: "exportPackage", label: "Export Package", done: Boolean(row.finalExportStatus || row.finalExportedAt), pending: Boolean(row.finalExportStatus && !row.finalExportedAt), at: row.finalExportedAt },
      { key: "buyerHandoff", label: "Buyer PR / PO", done: pendingOwner(row) === "Buyer Handoff", at: row.buyerReceivedAt || row.finalExportedAt },
    ];
  }

  function visibilityFlags(role = "requester") {
    const normalizedRole = role === "manager" ? "costOwner" : role;
    return {
      showVendor: ["om", "omLeader", "omMember", "admin"].includes(normalizedRole),
      showPasMaterial: ["om", "omLeader", "omMember", "admin"].includes(normalizedRole),
      showFactoryMaterial: ["om", "omLeader", "omMember", "admin"].includes(normalizedRole),
      showOmAssignee: ["om", "omLeader", "admin"].includes(normalizedRole),
      showCostImpact: ["costOwner", "manager", "admin", "deptDri"].includes(normalizedRole),
      showOperationalActions: ["om", "omLeader", "omMember", "requester", "dri", "projectDri", "admin"].includes(normalizedRole),
    };
  }

  function buildWorkflowStatus(row = {}, roleContext = {}) {
    const today = roleContext.today || new Date();
    const start = stageStartAt(row);
    const stage = currentStage(row);
    const owner = pendingOwner(row);
    const days = stage === "Completed" ? null : daysBetweenDates(start, today);
    return {
      pendingOwner: owner,
      currentStage: stage,
      submittedAt: submittedAt(row),
      receivedAt: receivedAt(row),
      stageStartAt: start,
      daysPending: days,
      quoteStatus: quoteStatus(row, today),
      nextAction: nextAction(row),
      riskReason: row.pendingReason || row.deliveryPendingReason || row.pendingDeliveryReason || row.procurementRemark || "",
      timelineMilestones: timelineMilestones(row),
      statusLabels: requesterStatusLabels(row),
      visibilityFlags: visibilityFlags(roleContext.role || "requester"),
    };
  }

  function buildWorkflowGroupStatus(group = {}, roleContext = {}) {
    const rows = group.rows || [];
    if (!rows.length) return buildWorkflowStatus({}, roleContext);
    const statuses = rows.map((row) => buildWorkflowStatus(row, roleContext));
    const owner = [...new Set(statuses.map((status) => status.pendingOwner))]
      .sort((left, right) => (OWNER_PRIORITY[left] ?? 9) - (OWNER_PRIORITY[right] ?? 9))[0];
    const stage = [...new Set(statuses.filter((status) => status.pendingOwner === owner).map((status) => status.currentStage))]
      .sort((left, right) => (STAGE_PRIORITY[left] ?? 10) - (STAGE_PRIORITY[right] ?? 10))[0]
      || statuses[0].currentStage;
    const start = firstDate(statuses.filter((status) => status.currentStage === stage).map((status) => status.stageStartAt))
      || firstDate(statuses.map((status) => status.stageStartAt));
    const quoteStatuses = [...new Set(statuses.map((status) => status.quoteStatus))];
    const quoteOrder = {
      "Expired / Requote Required": 1,
      "Expiring Soon": 2,
      "Waiting PAS Reply": 3,
      "Missing Validity": 4,
      "Reusable Quote": 5,
    };
    return {
      ...statuses[0],
      pendingOwner: owner,
      currentStage: stage,
      submittedAt: firstDate(statuses.map((status) => status.submittedAt)),
      receivedAt: firstDate(statuses.map((status) => status.receivedAt)),
      stageStartAt: start,
      daysPending: stage === "Completed" ? null : daysBetweenDates(start, roleContext.today || new Date()),
      quoteStatus: quoteStatuses.sort((left, right) => (quoteOrder[left] ?? 9) - (quoteOrder[right] ?? 9))[0] || "-",
      nextAction: nextAction(rows.find((row) => buildWorkflowStatus(row, roleContext).pendingOwner === owner) || rows[0]),
    };
  }

  const api = {
    OWNER_PRIORITY,
    STAGE_PRIORITY,
    buildWorkflowStatus,
    buildWorkflowGroupStatus,
    pendingOwner,
    currentStage,
    submittedAt,
    receivedAt,
    stageStartAt,
    quoteStatus,
    nextAction,
    timelineMilestones,
    visibilityFlags,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.workflowStatus = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
