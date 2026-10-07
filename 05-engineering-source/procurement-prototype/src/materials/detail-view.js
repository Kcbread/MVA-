// materials/detail-view: authoritative source; see docs/module-map.md.
import {
  OM_PAYMENT_METHOD,
  ROUTE_SOURCING,
  adminApprovalSetup
} from "../admin/state.js";
import {
  stationBreakdownDetailHtml
} from "../approval/audit-view.js";
import {
  priceVarianceLabel
} from "../approval/price-review.js";
import {
  managerNextStep
} from "../approval/routing.js";
import {
  approvalPipelinePoStatus,
  approvalPipelineStatus,
  latestTimestamp
} from "../approval/status.js";
import {
  omCatalogRows,
  rowSourceLabel
} from "../catalog/records.js";
import {
  budgetApprovedExchangeRateMonth,
  money
} from "../cost/currency.js";
import {
  stageDemandMetric
} from "../cost/demand-metrics.js";
import {
  estimateUnitPriceUsdForVariance,
  quoteUnitPriceUsdForDecision
} from "../cost/price-decision.js";
import {
  costConfidence
} from "../cost/pricing.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  amendmentReferenceRows,
  userQuoteAmountLabel,
  userQuoteAttachmentStatus,
  userQuoteStageLabel
} from "../demand/amendments.js";
import {
  requestActionOtherTextValue,
  requestActionValue
} from "../demand/intent.js";
import {
  stationDisplay
} from "../demand/matrix-view.js";
import {
  stageQtyText,
  totalQty
} from "../demand/quantity.js";
import {
  normalizeRequesterDateFields
} from "../demand/records.js";
import {
  needDateForRow
} from "../demand/request-fields.js";
import {
  requests
} from "../demand/state.js";
import {
  buyerStatusFor
} from "../handoff/buyer.js";
import {
  handoffRoute
} from "../handoff/status.js";
import {
  warehouseInventoryFromId,
  warehouseSummaryFromId,
  warehouseTraceText
} from "../inventory/warehouse.js";
import {
  detailValue,
  isMaterialNoPending,
  isNewMaterial,
  itemDetail,
  itemType,
  itemTypeBadge,
  userVisibleItemDetail
} from "./display.js";
import {
  factoryMaterialNoFor,
  materialControlStatus,
  materialIdFor,
  materialIdentityKey,
  materialMasterRecordFor,
  materialNoFor,
  partName
} from "./identity.js";
import {
  newItemSuggestions
} from "./state.js";
import {
  externalEvidenceCount,
  externalProgressTimelineHtml,
  externalStatusFor,
  latestExternalProgressEvent,
  materialCreationEventFor
} from "../om/external-progress.js";
import {
  omPackageHistoryHtml
} from "../om/history.js";
import {
  applyOmResponsibility,
  isOmBuyScope,
  omBuyScopeReason,
  omBuyScopeStatus,
  omCategoryPath
} from "../om/ownership.js";
import {
  pasDisplayStatus
} from "../om/pas-rules.js";
import {
  omBudgetCode,
  pasBrand,
  pasDataTransferTo,
  pasDemandDate,
  pasLegalName,
  pasPartName,
  pasRequestDept,
  pasSpec
} from "../om/pas-view.js";
import {
  omQuoteScreenshotFile
} from "../om/quote-rules.js";
import {
  hasOmQuoteData,
  omQuoteValidity
} from "../om/quote-validity.js";
import {
  procurementStatusValue
} from "../om/tracking-rules.js";
import {
  REQUEST_ACTION_OTHER,
  projectCodeForRow,
  yearProjectForRow
} from "../projects/config.js";
import {
  dateOnly
} from "../projects/dates.js";
import {
  currentProject
} from "../projects/state.js";
import {
  isOmRole
} from "../session/permissions.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime,
  compactTimestamp
} from "../shared/dates.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  COST_MANAGER_AUTH_PENDING
} from "../workflow/status-constants.js";

// @legacy-unit 1412 17230
export function getItemDetailRow(sourceType, sourceId) {
  if (sourceType === "warehouse") {
    const row = warehouseInventoryFromId(sourceId) || warehouseSummaryFromId(sourceId);
    if (!row) return null;
    return {
      id: `WH-${row.month}-${row.item}`,
      name: row.item,
      detail: row.spec,
      spec: row.spec,
      project: "All projects",
      status: row.status || (row.availableQty > 0 ? "Available" : "No stock"),
      requesterReason: warehouseTraceText(row),
      procurementRemark: `On hand ${row.onHandQty || 0} / Reserved ${row.reservedQty || 0} / Available ${row.availableQty || 0}`,
      detailSource: "warehouse",
    };
  }
  if (sourceType === "record") return purchaseRecords.find((row) => row.id === sourceId);
  if (sourceType === "catalog") return omCatalogRows(currentProject).find((row) => row.id === sourceId);
  if (sourceType === "request") return requests.find((row) => row.id === sourceId);
  if (sourceType === "suggestion") return newItemSuggestions.find((row) => row.id === sourceId);
  return null;
}
// @end-legacy-unit 1412

// @legacy-unit 1413 17253
export function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${detailValue(value)}</strong></div>`;
}
// @end-legacy-unit 1413

// @legacy-unit 1414 17257
export function detailSection(title, rows) {
  if (!rows.length) return "";
  return `
    <section class="detail-card-section">
      <h4>${title}</h4>
      <div class="detail-section-grid">${rows.join("")}</div>
    </section>`;
}
// @end-legacy-unit 1414

// @legacy-unit 1415 17266
export function datePlanningDetailRows(row = {}, { editableDri = false } = {}) {
  const normalized = normalizeRequesterDateFields(row);
  const givenLt = normalized.givenLeadTimeDays;
  const budgetStatus = procurementStatusValue(row.budgetStatus);
  const budgetNo = row.budgetNo || "";
  const requiredDelivery = dateOnly(normalized.requiredDeliveryDate);
  return [
    detailRow("Purpose", normalized.purposeLocation),
    detailRow("Line Open Date", normalized.lineOpenDate || "-"),
    detailRow("Date of Request", normalized.dateOfRequest || "-"),
    detailRow("Required Delivery Date", editableDri
      ? `<input type="date" value="${htmlAttr(requiredDelivery)}" data-dri-date-field="requiredDeliveryDate" data-dri-date-id="${htmlAttr(row.id)}" />`
      : requiredDelivery || "-"),
    detailRow("Required By Stage", normalized.requiredDeliveryDateFollowStageDate || "-"),
    detailRow("Given LT", givenLt === null || givenLt === undefined ? "-" : `${givenLt} days`),
    detailRow("Budget Status", budgetStatus),
    detailRow("Budget #", budgetNo || "-"),
  ];
}
// @end-legacy-unit 1415

// @legacy-unit 1416 17286
export function approvalPipelineDetailHtml(row = {}, role = currentRole) {
  const pipeline = approvalPipelineStatus(row, role);
  const currentPipelineOwner = pipeline.nextOwner === "Cost Manager"
    ? "Cost Manager Review"
    : pipeline.nextOwner || pipeline.blockedAtOwner || "-";
  const omUpdatedAt = latestTimestamp(
    row.sentToOmAt,
    row.pasDemandNoRecordedAt,
    row.pasDemandNoUpdatedAt,
    row.quoteReadyAt,
    row.quoteCompletionReadyAt,
    row.userAQuoteDecisionAt,
    row.finalExportedAt
  );
  const buyerUpdatedAt = latestTimestamp(row.buyerReceivedAt, latestExternalProgressEvent(row)?.createdAt);
  const rows = [
    {
      stage: "Request Submitted",
      owner: "Requester",
      status: row.submittedAt || row.deptDriReviewSubmittedAt ? "Submitted" : "Pending",
      at: row.submittedAt || row.deptDriReviewSubmittedAt || "",
      note: row.requestPackageLabel || "Requester submitted demand for approval.",
    },
    {
      stage: "Dept DRI Decision",
      owner: "Dept DRI",
      status: row.deptDriReviewStatus || row.priceApprovalStatus || (row.driApprovedAt ? "Dept DRI Approved" : "Pending"),
      at: row.deptDriSubmissionApprovedAt || row.driApprovedAt || row.deptDriReviewRejectedAt || "",
      note: row.deptDriReviewRejectReason || (row.deptDriSubmissionApprovedAt ? "Sent to Cost Manager." : row.driApprovedAt ? "Sent to Budget Approver." : "Waiting Dept DRI decision."),
    },
    {
      stage: "Cost Manager Review",
      owner: "Cost Manager",
      status: row.costManagerAuthorizationStatus || (row.costManagerAuthorizationSubmittedAt ? COST_MANAGER_AUTH_PENDING : "Pending"),
      at: row.costManagerAuthorizedAt || row.costManagerRejectedAt || row.costManagerAuthorizationSubmittedAt || "",
      note: row.costManagerRejectReason || row.nextStep || "Demand approval before OM intake.",
    },
    {
      stage: "OM PAS / Quote / Export",
      owner: "OM Leader / OM Purchasing",
      status: row.finalExportStatus || row.omStatus || row.pasStatus || pasDisplayStatus(row),
      at: omUpdatedAt,
      note: row.finalExportPackageCode || row.pasDemandNo || row.quoteCompletionReadyAt ? "OM processing recorded." : "Waiting OM PAS / quote / export work.",
    },
    {
      stage: "Buyer PR / PO",
      owner: "Buyer",
      status: approvalPipelinePoStatus(row),
      at: buyerUpdatedAt,
      note: [row.prNo ? `PR ${row.prNo}` : "", row.buyerPoNo || row.poNo ? `PO ${row.buyerPoNo || row.poNo}` : "", externalStatusFor(row) !== "-" ? externalStatusFor(row) : ""].filter(Boolean).join(" / ") || "Buyer PR / PO not started.",
    },
  ];
  return `
    <section class="detail-card-section approval-pipeline-detail">
      <div class="detail-section-head">
        <h4>Approval / Pipeline Detail</h4>
        <span class="status-pill ${statusClass(currentPipelineOwner)}">Current Owner: ${htmlText(currentPipelineOwner)}</span>
      </div>
      <div class="approval-pipeline-summary">
        <span>Sent To <strong>${htmlText(pipeline.nextOwner || "-")}</strong></span>
        <span>Since <strong>${htmlText(pipeline.lastUpdatedAt ? compactDateTime(pipeline.lastUpdatedAt) : "-")}</strong></span>
        <span>PO <strong>${htmlText(pipeline.poStatus || "PO Pending")}</strong></span>
      </div>
      <div class="table-wrap compact-wrap">
        <table class="data-table approval-pipeline-detail-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Timestamp</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => {
              const isCurrent = currentPipelineOwner.includes(item.stage) || currentPipelineOwner.includes(item.owner.split(" / ")[0]);
              return `
                <tr class="${isCurrent ? "approval-pipeline-current" : ""}">
                  <td>${htmlText(item.stage)}</td>
                  <td>${htmlText(item.owner)}</td>
                  <td><span class="status-pill ${statusClass(item.status)}">${htmlText(item.status || "Pending")}</span></td>
                  <td>${item.at ? compactDateTime(item.at) : "-"}</td>
                  <td>${htmlText(item.note || "-")}</td>
                </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}
// @end-legacy-unit 1416

// @legacy-unit 1417 17378
export function estimateVarianceDisplayRows(row) {
  const estimate = Number(row.estimateUnitPriceSnapshotUsd || 0) || estimateUnitPriceUsdForVariance(row);
  const quote = Number(row.quoteUnitPriceSnapshotUsd || 0) || quoteUnitPriceUsdForDecision(row);
  const hasAnyPrice = estimate > 0 || quote > 0 || row.estimateVarianceStatus;
  if (!hasAnyPrice) return [];
  const delta = row.estimateDeltaUsd;
  const percent = row.estimateDeltaPercent;
  const totalDelta = row.estimateTotalDeltaUsd;
  const deltaText = delta === null || delta === undefined
    ? "-"
    : `${delta >= 0 ? "+" : ""}${Number(delta).toFixed(2)} USD${percent === null || percent === undefined ? "" : ` / ${Number(percent).toFixed(1)}%`}`;
  return [
    detailRow("Requester Estimate", estimate > 0 ? money(estimate) : "-"),
    detailRow("PAS Quote", quote > 0 ? money(quote) : "-"),
    detailRow("Estimate Delta", deltaText),
    detailRow("Total Estimate Delta", totalDelta === null || totalDelta === undefined ? "-" : money(totalDelta)),
    detailRow("Variance Status", row.estimateVarianceStatus || "Within Estimate Range"),
    detailRow("Variance Reason", row.estimateVarianceReason || "-"),
  ];
}
// @end-legacy-unit 1417

// @legacy-unit 1418 17399
export function omItemCell(row, { stageLabel = "", extraLines = [] } = {}) {
  const lines = [partName(row), row.id, itemDetail(row), ...extraLines].filter(Boolean);
  const title = [row.name, stageLabel, ...lines].filter(Boolean).join(" / ");
  return `
    <div class="item-name-stack" title="${htmlAttr(title)}">
      <strong>${row.name}</strong>
      ${stageLabel ? `<div class="om-row-stage">${stageLabel}</div>` : ""}
      ${row.amendmentApprovedAt ? `<div class="om-returned-pill">Returned from Manager · ${compactTimestamp(row.amendmentApprovedAt)}</div>` : ""}
      ${lines.map((line) => `<span>${line}</span>`).join("")}
      ${isNewMaterial(row) ? itemTypeBadge(row) : ""}
    </div>`;
}
// @end-legacy-unit 1418

// @legacy-unit 1419 17412
export function phaseUsageRows() {
  return [];
}
// @end-legacy-unit 1419

// @legacy-unit 1420 17416
export function phaseUsageTable() {
  return "";
}
// @end-legacy-unit 1420

// @legacy-unit 1421 17420
export function renderItemDetail(row, sourceType) {
  const enrichedRow = applyOmResponsibility(row);
  const type = itemType(row, sourceType);
  const isRequest = sourceType === "request";
  const isSuggestion = sourceType === "suggestion";
  const price = Number(row.updatedPrice || row.unitPrice || 0);
  const canShowOfficialQuote = isOmRole() && hasOmQuoteData(row);
  const quote = currentRole === "manager"
    ? costConfidence(row)
    : canShowOfficialQuote ? omQuoteValidity(row) : "Pending OM verification";
  const route = isSuggestion ? ROUTE_SOURCING : handoffRoute(row);
  const materialRecord = materialMasterRecordFor(row);
  const materialCreationEvent = isRequest ? materialCreationEventFor(row) : null;
  const canSeeInternalQuoteFields = isOmRole() || currentRole === "buyer" || currentRole === "admin";
  const isCostManagerRole = currentRole === "manager";
  const requestIntentRows = isRequest || isSuggestion ? [
    detailRow("Requester Action", requestActionValue(row)),
    ...(requestActionValue(row) === REQUEST_ACTION_OTHER ? [
      detailRow("Other Action Detail", requestActionOtherTextValue(row) || "Required before submit"),
    ] : []),
    ...(row.purpose ? [detailRow("Purpose", row.purpose)] : []),
  ] : [];
  const identityRows = currentRole === "requester" ? [
    detailRow("Item", row.name),
    detailRow("Record Source", rowSourceLabel(row)),
    detailRow("Year Project", yearProjectForRow(row)),
    detailRow("Project", projectCodeForRow(row) || "-"),
    ...requestIntentRows,
    detailRow("Need Date", needDateForRow(row) || "-"),
    detailRow("Detail / Spec", userVisibleItemDetail(row)),
    detailRow("Item Type", type),
  ] : isCostManagerRole ? [
    detailRow("Item", row.name),
    detailRow("Record Source", rowSourceLabel(row)),
    detailRow("Year Project", yearProjectForRow(row)),
    detailRow("Project", projectCodeForRow(row) || "-"),
    ...requestIntentRows,
    detailRow("Need Date", needDateForRow(row) || "-"),
    detailRow("Detail / Spec", itemDetail(row)),
    detailRow("Item Type", type),
  ] : [
    detailRow("Item", row.name),
    detailRow("Record Source", rowSourceLabel(row)),
    ...(row.catalogBucket ? [detailRow("OM Catalog Bucket", row.catalogBucket)] : []),
    ...(factoryMaterialNoFor(row) ? [detailRow("Factory Material No.", factoryMaterialNoFor(row))] : []),
    detailRow("Legacy Material No.", materialNoFor(row) || "Not assigned"),
    detailRow("Material ID", materialIdFor(row)),
    detailRow("Material Status", materialControlStatus(row)),
    detailRow("Material Creation Source", materialCreationEvent?.reason || materialRecord?.source || (isMaterialNoPending(row) ? "Pending PR / PO evidence" : "-")),
    detailRow("Material Created By", materialRecord?.createdBy || materialCreationEvent?.createdBy || "-"),
    detailRow("Material Created At", materialRecord?.createdAt ? new Date(materialRecord.createdAt).toLocaleString("en-US") : materialCreationEvent?.createdAt ? new Date(materialCreationEvent.createdAt).toLocaleString("en-US") : "-"),
    detailRow("Standard Part Name CN", row.standardNameCn || row.name || "-"),
    detailRow("Part Name EN", row.standardNameEn || "-"),
    detailRow("Part Name VN", row.standardNameVn || "-"),
    detailRow("Station", stationDisplay(row)),
    detailRow("Detail / Spec", currentRole === "requester" ? userVisibleItemDetail(row) : itemDetail(row)),
    detailRow("Material Name", partName(row)),
    detailRow("Material Identity Key", materialIdentityKey(row)),
    detailRow("Created From", row.sourceRecordId || row.sourceSuggestionId || row.id || "-"),
    detailRow("Source Project", row.sourceProject || row.project || "-"),
    detailRow("Item Type", type),
    detailRow("Year Project", yearProjectForRow(row)),
    detailRow("Project", projectCodeForRow(row) || "-"),
    ...requestIntentRows,
    detailRow("Need Date", needDateForRow(row) || "-"),
  ];

  const requesterQuoteRows = currentRole === "requester" && isOmBuyScope(row) ? [
    detailRow("Action Required Status", userQuoteStageLabel(row)),
    detailRow("Quoted Amount", userQuoteAmountLabel(row)),
    detailRow("Quote Date", row.quoteDate || "-"),
    detailRow("Attachment Status", userQuoteAttachmentStatus(row)),
    ...(row.userAQuoteCancelReason ? [detailRow("Cancel Reason", row.userAQuoteCancelReason)] : []),
  ] : [];
  const internalOmFlowRows = currentRole === "requester" ? [] : isCostManagerRole ? [
    detailRow("OM Buy Scope Status", omBuyScopeStatus(enrichedRow)),
    detailRow("PAS Status", pasDisplayStatus(row)),
    detailRow("Handoff Code", row.finalExportPackageCode || "Not prepared"),
    detailRow("Budget Code", omBudgetCode(row)),
    detailRow("Next Step", managerNextStep(row)),
    detailRow("Cost Confidence", quote),
    detailRow("Unit Price Reference", price ? money(price) : "Pending"),
    detailRow("Remark", row.procurementRemark || "No OM remark yet."),
  ] : [
    detailRow("OM Buy Scope Status", omBuyScopeStatus(enrichedRow)),
    detailRow("OM Classification", omCategoryPath(enrichedRow) || enrichedRow.omClassificationStatus || "Need OM Classification"),
    detailRow("CPD-IEP Owner", enrichedRow.omOwner || "Pending OM Classification"),
    detailRow("OM Routing Reason", omBuyScopeReason(enrichedRow)),
    detailRow("PAS Status", pasDisplayStatus(row)),
    detailRow("PAS Project Code", row.pasProjectCode || "Pending PAS review"),
    detailRow("PAS Budget Amount", row.pasBudgetAmount ? money(row.pasBudgetAmount) : "Pending PAS review"),
    detailRow("PAS Comment", row.pasComment || "No PAS comment yet."),
    detailRow("Handoff Code", row.finalExportPackageCode || "Not prepared"),
    detailRow("Budget Code", omBudgetCode(row)),
    detailRow("Source Budget No.", row.budgetNo || "-"),
    detailRow("Payment Method", OM_PAYMENT_METHOD),
    detailRow("Next Step", managerNextStep(row)),
    detailRow("LV Search Path", [row.level1, row.level2, row.level3].filter(Boolean).join(" / ") || "Not selected"),
    ...(canSeeInternalQuoteFields ? [detailRow("Vendor", isSuggestion ? "TBD" : row.vendor || "Pending OM verification")] : []),
    detailRow(currentRole === "manager" ? "Cost Confidence" : "Quote Status", quote),
    ...(canShowOfficialQuote ? [
      detailRow("Quote Date", isSuggestion ? "Pending" : row.quoteDate || "Pending"),
      detailRow("Quote Expiry", isSuggestion ? "Pending" : row.quoteExpiry || "Pending"),
      detailRow("Quote Screenshot", omQuoteScreenshotFile(row) || "No screenshot"),
      detailRow("Generated PAS Excel", row.pasExcelSystemFileName || "Generated after Validate Quote"),
    ] : []),
    ...(canSeeInternalQuoteFields ? [detailRow("Unit Price Reference", price ? money(price) : "Pending")] : []),
    ...(canSeeInternalQuoteFields ? [detailRow("Remark", row.procurementRemark || "No OM remark yet.")] : []),
  ];
  const omFlowRows = [
    ...requesterQuoteRows,
    ...internalOmFlowRows,
    ...(currentRole === "requester" && isOmBuyScope(row) ? [
      detailRow("Action", "Confirm need or cancel from Action Required when a quote is waiting."),
    ] : []),
    ...(isRequest || isSuggestion ? [detailRow("Reason / Use Case", row.requesterReason || row.useCase || "No requester reason provided.")] : []),
  ];
  const datePlanningRows = isRequest ? datePlanningDetailRows(row, { editableDri: currentRole === "dri" }) : [];

  const pasTrackingRows = !canSeeInternalQuoteFields ? [] : [
    detailRow("Demand No", row.pasDemandNo || "Waiting PAS Demand No"),
    detailRow("PAS Material No", row.pasMaterialNo || "Waiting PAS Material No"),
    ...(factoryMaterialNoFor(row) ? [detailRow("Factory Material No", factoryMaterialNoFor(row))] : []),
    detailRow("Legal Name", pasLegalName(row)),
    detailRow("Request Dept", pasRequestDept(row)),
    detailRow("Data Transfer To", pasDataTransferTo(row)),
    detailRow("Demand Date", pasDemandDate(row)),
    detailRow("PAS Part Name", pasPartName(row) || "-"),
    detailRow("PAS Brand", pasBrand(row) || "Brand pending"),
    detailRow("PAS Spec", pasSpec(row) || "-"),
    detailRow("PAS Sent At", row.pasRequestSentAt ? new Date(row.pasRequestSentAt).toLocaleString("en-US") : "-"),
    detailRow("Demand No Updated At", row.pasDemandNoUpdatedAt ? new Date(row.pasDemandNoUpdatedAt).toLocaleString("en-US") : "-"),
    detailRow("PAS Material No Updated At", row.pasMaterialNoUpdatedAt ? new Date(row.pasMaterialNoUpdatedAt).toLocaleString("en-US") : "-"),
    detailRow("PAS Item Info Updated At", row.pasItemInfoUpdatedAt ? new Date(row.pasItemInfoUpdatedAt).toLocaleString("en-US") : "-"),
  ];
  const amendmentRows = amendmentReferenceRows(row);
  const estimateVarianceRows = estimateVarianceDisplayRows(row);
  const priceDecisionRows = currentRole === "requester" ? [] : [
    detailRow("Price Decision", row.priceDecisionStatus || "Not evaluated"),
    detailRow("Approval Status", row.priceApprovalStatus || "-"),
    detailRow("Threshold Category", row.priceThresholdCategory || "-"),
    detailRow("History Price", row.historyUnitPrice ? money(row.historyUnitPrice) : "No history"),
    detailRow("Quote Price", row.quoteUnitPrice ? money(row.quoteUnitPrice) : row.updatedPrice ? money(quoteUnitPriceUsdForDecision(row)) : "-"),
    detailRow("Price Delta", priceVarianceLabel(row)),
    detailRow("Delta Threshold", row.priceThresholdUsd !== undefined ? `${Number(row.priceThresholdUsd || 0.4).toFixed(2)} USD` : "-"),
    detailRow("Exchange Rate Month", row.exchangeRateMonth || budgetApprovedExchangeRateMonth(row)),
    detailRow("Decision Reason", row.priceDecisionReason || "-"),
    detailRow("Approval Chain", row.priceApprovalChain || adminApprovalSetup.approvalChain.join(" -> ")),
    detailRow("Dept DRI Approved", row.driApprovedAt ? `${row.driApprovedBy || "Dept DRI"} / ${compactDateTime(row.driApprovedAt)}` : "-"),
    detailRow("Budget Approver Approved", row.projectDriApprovedAt ? `${row.projectDriApprovedBy || "Budget Approver"} / ${compactDateTime(row.projectDriApprovedAt)}` : "-"),
    ...(row.priceEscalationRejectReason ? [detailRow("Reject Reason", row.priceEscalationRejectReason)] : []),
  ].filter(Boolean);

  const downstreamRows = [];
  if (isRequest) {
    const demand = stageDemandMetric(row);
    downstreamRows.push(
      detailRow("External Reject Owner", row.externalRejectOwner || "No external rejection."),
      detailRow("External Reject Reason", row.externalRejectReason || "No external rejection."),
      detailRow("Phase Qty", stageQtyText(row)),
      detailRow("Total Qty", totalQty(row)),
      detailRow("Status", row.status),
      detailRow("Decision Reason", row.managerReason || "No decision note yet."),
      detailRow("Handoff Route", route),
      detailRow("External System", row.externalSystem || "Pending external update"),
      detailRow("External Request No.", row.externalRequestNo || "Pending"),
      detailRow("External Status", externalStatusFor(row)),
      detailRow("Evidence Count", externalEvidenceCount(row)),
      detailRow("Buyer Status", buyerStatusFor(row)),
      detailRow("PR No.", row.prNo || "Pending"),
      detailRow("PO No.", row.buyerPoNo || row.poNo || "Pending"),
      detailRow("Planned Demand", demand.baselineDemand ?? "Missing plan"),
      detailRow("Carryover", demand.carryoverStock),
      detailRow("Need to Buy", demand.suggestedNewBuy)
    );
  }
  const detailRows = [...identityRows, ...omFlowRows, ...downstreamRows];

  document.getElementById("itemDetailTitle").textContent = `${detailValue(row.name, "Item detail")}`;
  const badge = document.getElementById("itemDetailBadge");
  badge.textContent = type;
  badge.className = `status-pill item-type-badge ${statusClass(type)}`;
  const useGroupedDetail = isRequest;
  const groupedDetailHtml = useGroupedDetail
    ? [
      detailSection("Item & Material", identityRows),
      detailSection("Requester Dates / Downstream Tracking", datePlanningRows),
      `<section class="detail-card-section"><h4>需求單位 / Station Breakdown</h4>${stationBreakdownDetailHtml(row)}</section>`,
      currentRole === "requester" ? "" : approvalPipelineDetailHtml(row, currentRole),
      detailSection("OM Quote & PAS", omFlowRows),
      detailSection("Estimate vs PAS Quote", estimateVarianceRows),
      detailSection("PAS Tracking", pasTrackingRows),
      detailSection("Price Decision Audit", priceDecisionRows),
      ...(amendmentRows.length ? [detailSection("Amendment / Previous Quote Reference", amendmentRows)] : []),
      detailSection("Flow & Buyer Handoff", downstreamRows),
    ].join("")
    : `<div class="item-detail-grid">${detailRows.join("")}</div>`;

  document.getElementById("itemDetailBody").innerHTML = `
    <aside class="item-photo-card" aria-label="Product photo placeholder">
      <div class="item-photo-box">
        <span>Product Photo</span>
        <strong>${type}</strong>
      </div>
      <p>Prototype placeholder. IT can connect the real product image source later.</p>
    </aside>
    <div class="${useGroupedDetail ? "item-detail-grouped" : "item-detail-grid-wrap"}">${groupedDetailHtml}</div>
    ${isRequest ? omPackageHistoryHtml(row) : ""}
    ${isRequest ? externalProgressTimelineHtml(row) : ""}`;
}
// @end-legacy-unit 1421

// @legacy-unit 1422 17631
export function openItemDetail(sourceType, sourceId) {
  const row = getItemDetailRow(sourceType, sourceId);
  if (!row) {
    showToast("Item detail is not available.", "error");
    return;
  }
  renderItemDetail(row, sourceType);
  document.getElementById("itemDetailModal").hidden = false;
}
// @end-legacy-unit 1422

// @legacy-unit 1423 17641
export function closeItemDetail() {
  document.getElementById("itemDetailModal").hidden = true;
}
// @end-legacy-unit 1423

export function replaceRenderItemDetailBinding(value) { renderItemDetail = value; return value; }

export function replaceCloseItemDetailBinding(value) { closeItemDetail = value; return value; }
