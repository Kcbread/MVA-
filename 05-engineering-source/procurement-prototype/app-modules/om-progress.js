(function registerOmProgressModule(root) {
  const OM_PAS_DEMAND_SLA_DAYS = 2;
  const OM_BIDDING_RESULT_SLA_DAYS = 14;
  const MS_PER_DAY = 86400000;

  function normalize(value) {
    return String(value || "").trim();
  }

  function numberValue(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function parseDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function daysBetweenDates(startText, endText = new Date()) {
    const start = parseDate(startText);
    const end = parseDate(endText);
    if (!start || !end) return 0;
    return Math.max(0, Math.ceil((end - start) / MS_PER_DAY));
  }

  function receivedAt(row = {}) {
    return row.sentToOmAt || row.managerApprovedAt || row.decidedAt || row.approvedAt || row.submittedAt || row.requestSubmittedAt || "";
  }

  function pasDemandNoRecordedAt(row = {}) {
    return row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt || "";
  }

  function quoteReadyAt(row = {}) {
    return row.quoteCompletionReadyAt || row.quoteReadyAt || "";
  }

  function isQuoteReady(row = {}) {
    return Boolean(
      row.quoteReady
      || row.quoteCompletionReadyAt
      || row.quoteReadyAt
      || (row.pasMaterialNo && (row.updatedPrice || row.updatedPriceVnd || row.unitPrice || row.unitPriceVnd) && row.quoteDate && (row.quotationExcel || row.quoteExcel || row.quotationPdf || row.quotePdf || row.quoteScreenshot || row.quotationScreenshot))
    );
  }

  function isRequesterWaiting(row = {}) {
    return Boolean(
      row.userAQuoteDecisionStatus === "Waiting Requester Confirmation"
      || row.userAQuoteDecisionStatus === "Waiting User A Confirmation"
      || row.omStage === "userConfirm"
    ) && !row.userAQuoteDecisionAt;
  }

  function isReadyToExport(row = {}) {
    return Boolean(
      !row.finalExportedAt
      && (
        row.userAQuoteDecisionAt
        || row.userAQuoteDecisionStatus === "Requester Confirmed"
        || row.finalExportStatus
        || row.finalExportTarget
        || row.omStage === "finalExport"
      )
    );
  }

  function buyerHandoffStatus(row = {}) {
    const prText = normalize(row.prStatus || row.prProgress || row.buyerPrStatus).toLowerCase();
    if (row.prNo || row.prDoneAt || prText.includes("done") || prText.includes("complete")) return "PR Done";
    if (row.finalExportedAt || row.buyerReceivedAt || row.sentToBuyerAt || row.buyerStatus) return "PR Pending";
    return "Buyer owns PR-PO";
  }

  function handoffStartAt(row = {}) {
    return row.finalExportedAt || row.buyerReceivedAt || row.sentToBuyerAt || "";
  }

  function buildTimedStatus({
    stageKey,
    stageLabel,
    startAt,
    endAt = "",
    slaDays,
    today,
    remarkLabel,
    previousStageStatus = "",
  }) {
    const comparisonEnd = endAt || today || new Date();
    const daysInStage = startAt ? daysBetweenDates(startAt, comparisonEnd) : 0;
    const overdueDays = Math.max(0, daysInStage - slaDays);
    const status = endAt ? "Done" : overdueDays > 0 ? "Overdue" : "On Track";
    return {
      stageKey,
      stageLabel,
      stageEnteredAt: startAt || "",
      completedAt: endAt || "",
      status,
      previousStageStatus,
      slaDays,
      daysInStage,
      overdueDays,
      isOverdue: status === "Overdue",
      remark: status === "Overdue" ? `Overdue ${overdueDays}d · ${remarkLabel} SLA ${slaDays}d` : status === "Done" ? `Done in ${daysInStage}d` : `On Track · SLA ${slaDays}d`,
    };
  }

  function omStageSlaStatus(row = {}, options = {}) {
    const today = options.today || new Date();
    if (handoffStartAt(row)) {
      const startAt = handoffStartAt(row);
      const daysInStage = startAt ? daysBetweenDates(startAt, today) : 0;
      return {
        stageKey: "buyerHandoff",
        stageLabel: "Buyer Handoff / PR",
        stageEnteredAt: startAt,
        completedAt: row.prDoneAt || "",
        status: buyerHandoffStatus(row),
        previousStageStatus: "Done",
        slaDays: null,
        daysInStage,
        overdueDays: 0,
        isOverdue: false,
        remark: `${buyerHandoffStatus(row)} · ${daysInStage}d since handoff`,
      };
    }

    if (isReadyToExport(row)) {
      const startAt = row.userAQuoteDecisionAt || row.finalExportPreparedAt || row.sentToUserAAt || quoteReadyAt(row) || pasDemandNoRecordedAt(row) || receivedAt(row);
      return {
        stageKey: "readyToExport",
        stageLabel: "Ready to Export",
        stageEnteredAt: startAt || "",
        completedAt: "",
        status: "Ready",
        previousStageStatus: "Done",
        slaDays: null,
        daysInStage: startAt ? daysBetweenDates(startAt, today) : 0,
        overdueDays: 0,
        isOverdue: false,
        remark: "Ready to prepare OM export package",
      };
    }

    if (!row.pasDemandNo) {
      return buildTimedStatus({
        stageKey: "pendingPasDemand",
        stageLabel: "Pending PAS Demand",
        startAt: receivedAt(row),
        endAt: pasDemandNoRecordedAt(row),
        slaDays: OM_PAS_DEMAND_SLA_DAYS,
        today,
        remarkLabel: "PAS Demand No",
      });
    }

    if (!isQuoteReady(row) && !isRequesterWaiting(row)) {
      return buildTimedStatus({
        stageKey: "pendingBiddingResult",
        stageLabel: "Pending Bidding Result",
        startAt: pasDemandNoRecordedAt(row) || receivedAt(row),
        endAt: quoteReadyAt(row),
        slaDays: OM_BIDDING_RESULT_SLA_DAYS,
        today,
        remarkLabel: "Bidding Result",
        previousStageStatus: "Done",
      });
    }

    const startAt = quoteReadyAt(row) || row.sentToUserAAt || pasDemandNoRecordedAt(row) || receivedAt(row);
    return {
      stageKey: isRequesterWaiting(row) ? "waitingRequester" : "quoteReady",
      stageLabel: isRequesterWaiting(row) ? "Waiting Requester" : "Quote Result Ready",
      stageEnteredAt: startAt || "",
      completedAt: quoteReadyAt(row),
      status: isRequesterWaiting(row) ? "Waiting" : "Done",
      previousStageStatus: "Done",
      slaDays: null,
      daysInStage: startAt ? daysBetweenDates(startAt, today) : 0,
      overdueDays: 0,
      isOverdue: false,
      remark: isRequesterWaiting(row) ? "Requester confirmation pending" : "Quote result complete",
    };
  }

  function omProductCategory(row = {}) {
    const level2 = normalize(row.omCategoryLevel2 || row.omCategoryLevel2En || row.level2 || row.categoryLevel2);
    const level3 = normalize(row.omCategoryLevel3 || row.omCategoryLevel3En || row.level3 || row.categoryLevel3);
    if (level2 || level3) {
      const normalizedLevel2 = level2 || "Need OM Classification";
      const normalizedLevel3 = level3 || "Unclassified";
      return {
        level2: normalizedLevel2,
        level3: normalizedLevel3,
        path: `${normalizedLevel2} / ${normalizedLevel3}`,
        status: level2 && level3 ? "Classified" : "Need OM Classification",
      };
    }
    return {
      level2: "Need OM Classification",
      level3: "Unclassified",
      path: "Need OM Classification / Unclassified",
      status: "Need OM Classification",
    };
  }

  function estimatedUnitPrice(row = {}) {
    return numberValue(row.estimatedUnitPriceUsd)
      || numberValue(row.estimatedUnitPrice)
      || numberValue(row.unitPrice)
      || numberValue(row.updatedPrice)
      || numberValue(row.quoteUnitPriceUsd);
  }

  function estimatedAmount(row = {}, qty = 0) {
    return estimatedUnitPrice(row) * numberValue(qty);
  }

  const api = {
    OM_PAS_DEMAND_SLA_DAYS,
    OM_BIDDING_RESULT_SLA_DAYS,
    daysBetweenDates,
    omStageSlaStatus,
    omProductCategory,
    estimatedUnitPrice,
    estimatedAmount,
    buyerHandoffStatus,
    isQuoteReady,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.omProgress = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
