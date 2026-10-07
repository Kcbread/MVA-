// cost/matrix-view: authoritative source; see docs/module-map.md.
import {
  renderPriceReviewAnalysis
} from "../approval/analysis-view.js";
import {
  managerAuditTimelineHtml
} from "../approval/audit-view.js";
import {
  itemReviewChangeBadge
} from "../approval/quantity-review.js";
import {
  quantityReviewModeValue
} from "../approval/quantity-scope.js";
import {
  expandedManagerQuantityRows,
  replaceSelectedManagerQuantityKeyIdBinding,
  replaceSelectedManagerRequestIdBinding,
  selectedManagerQuantityKeyId,
  selectedManagerRequestId
} from "../approval/state.js";
import {
  approvalPipelineStatus,
  approvalPipelineTitle,
  reviewStatusCellHtml,
  reviewStatusForRole
} from "../approval/status.js";
import {
  formatMoneyFromUsd
} from "./currency.js";
import {
  MANAGER_MFG_HEADER_MASTER,
  managerDetailCalculation,
  managerDetailSameItemRows,
  managerDetailStationQty
} from "./detail-view.js";
import {
  managerQuantityCarryoverClass,
  managerQuantityCellValue,
  managerQuantityColumnCount,
  managerQuantityEmptyMessage,
  managerQuantityExpandableText,
  managerQuantityGroupColspans,
  managerQuantityGroupDisplayLabel,
  managerQuantityGroups,
  managerQuantityLeafDisplayLabel,
  managerQuantityPhaseColumns,
  managerQuantityPriceHtml,
  managerQuantityTableWidth,
  managerQuantityVisibleStages,
  renderManagerQuantityColgroup,
  stationGroupLabel
} from "./matrix-data.js";
import {
  managerQuantityFilters,
  syncManagerQuantityFilters
} from "./quantity-filters.js";
import {
  summaryCardsHtml
} from "./stage-view.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  renderManagerCarryoverLedger
} from "../inventory/cost-evidence.js";
import {
  detailRow
} from "../materials/detail-view.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  omNextActionForGroup,
  omQuoteStatusForRow
} from "../om/progress-data.js";
import {
  omQuoteValidUntil
} from "../om/quote-validity.js";
import {
  managerProgressCurrentStageForGroup,
  managerProgressCurrentStageForRow,
  managerProgressDaysPending,
  managerProgressGroupStageStartAt,
  managerProgressNextActionForGroup,
  managerProgressPendingOwnerForGroup,
  managerProgressPendingOwnerForRow,
  managerProgressPendingReason,
  managerProgressQty,
  managerProgressQuoteStatusForGroup,
  managerProgressRawPendingReason,
  managerProgressRows,
  managerProgressStageStartAt,
  managerProgressSubmittedAt,
  pendingReasonCell
} from "../progress/demand.js";
import {
  DEMAND_TYPE_NON_MFG,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER
} from "../projects/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  clearNodeContent
} from "../shared/dom.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";
import {
  daysBetween
} from "../sourcing/rfq.js";

// @legacy-unit 896 8703
export function renderManagerQuantityHead() {
  const head = document.getElementById("managerQuantityHead");
  if (!head) return;
  const stages = managerQuantityVisibleStages();
  const groupColspans = managerQuantityGroupColspans();
  const rowSpanHeaders = ["Review Status", "Request ID", "Project", "Item", "Spec", "Changes", "Unit Price", "Est. Amount"];
  head.innerHTML = `
    <tr>
      ${rowSpanHeaders.map((label) => `<th class="quantity-sticky-head" rowspan="3">${label}</th>`).join("")}
      ${stages.map((stage) => `<th class="quantity-phase-head" data-quantity-phase-group="${stage}" colspan="${managerQuantityPhaseColumns().length}">${STAGE_LABELS[stage]}</th>`).join("")}
      <th class="quantity-sticky-head shared-total-highlight shared-total-highlight--head" data-quantity-phase-group="total" rowspan="3">Total Qty</th>
      <th class="quantity-sticky-head" rowspan="3">Detail</th>
    </tr>
    <tr>
      ${stages.map((stage) => groupColspans.map(([label, span]) => {
        const displayLabel = managerQuantityGroupDisplayLabel(label);
        return `<th class="quantity-group-head ${statusClass(label)}" data-quantity-station-group="${stage}-${htmlAttr(label)}" colspan="${span}" title="${htmlAttr(displayLabel)}">${displayLabel}</th>`;
      }).join("")).join("")}
    </tr>
    <tr>
      ${stages.map(() => managerQuantityPhaseColumns().map((column) => `<th class="quantity-leaf-head ${column.type === "calculation" ? "calculation shared-total-highlight shared-total-highlight--head quantity-total-head" : ""}" title="${htmlAttr(column.name)}">${managerQuantityLeafDisplayLabel(column.name)}</th>`).join("")).join("")}
    </tr>`;
}
// @end-legacy-unit 896

// @legacy-unit 897 8727
export function renderManagerQuantityMatrix({ showCarryoverEvidence = false } = {}) {
  syncManagerQuantityFilters();
  const groups = managerQuantityGroups();
  if (!groups.some((group) => group.keyId === selectedManagerQuantityKeyId)) {
    replaceSelectedManagerQuantityKeyIdBinding(groups[0]?.keyId || "");
  }
  renderManagerQuantityHead();
  const body = document.getElementById("managerQuantityRows");
  if (!body) return;
  const table = document.getElementById("managerQuantityMatrixTable");
  if (table) {
    table.querySelector("colgroup")?.remove();
    table.insertAdjacentHTML("afterbegin", renderManagerQuantityColgroup());
    const width = `${managerQuantityTableWidth()}px`;
    table.style.width = width;
    table.style.minWidth = width;
  }
  const stages = managerQuantityVisibleStages();
  const columns = managerQuantityPhaseColumns();
  body.innerHTML = groups.length
    ? groups.map((group) => {
      const representative = [...group.requests.values()][0] || {};
      const pipeline = approvalPipelineStatus(representative, currentRole);
      const pipelineClass = `approval-pipeline-${pipeline.tone || "pending"}`;
      const pipelineTitle = approvalPipelineTitle(representative, currentRole);
      const reviewStatus = reviewStatusForRole(representative, currentRole);
      return `
      <tr class="${expandedManagerQuantityRows.has(`${group.keyId}:item`) || expandedManagerQuantityRows.has(`${group.keyId}:spec`) ? "quantity-row-expanded" : ""} ${pipelineClass}" data-approval-pipeline-status="${htmlAttr(pipeline.tone || "pending")}" data-review-status="${htmlAttr(reviewStatus.label || "")}" title="${htmlAttr(pipelineTitle)}">
        <td class="review-status-table-cell">${reviewStatusCellHtml(representative, currentRole)}</td>
        <td class="cell-identity manager-quantity-request-cell"><strong>${htmlText(group.requestId || representative.id || "-")}</strong><div class="reason-text">${htmlText(group.project || "-")}</div></td>
        <td>${group.project}</td>
        <td>${managerQuantityExpandableText(group.item, 2, group.keyId, "item")}</td>
        <td>${managerQuantityExpandableText(group.spec, 3, group.keyId, "spec")}</td>
        <td>${itemReviewChangeBadge(representative)}</td>
        <td>${managerQuantityPriceHtml(group, "unit")}</td>
        <td>${managerQuantityPriceHtml(group, "amount")}</td>
        ${stages.map((stage) => columns.map((column) => {
          const value = managerQuantityCellValue(group, stage, column);
          const carryoverClass = managerQuantityCarryoverClass(group, stage, column);
          const cellAttrs = column.type === "station"
            ? `data-item-quantity-cell="station" data-item-quantity-request="${htmlAttr(representative.id || "")}" data-item-quantity-project="${htmlAttr(group.project)}" data-item-quantity-item="${htmlAttr(group.item)}" data-item-quantity-phase="${stage}" data-item-quantity-review-mode="${htmlAttr(quantityReviewModeValue())}" data-approval-pipeline-status="${htmlAttr(pipeline.tone || "pending")}" ${quantityReviewModeValue() === DEMAND_TYPE_NON_MFG ? `data-item-quantity-unit="${htmlAttr(column.name)}"` : `data-item-quantity-station="${htmlAttr(column.name)}"`}`
            : "";
          const title = [
            `${STAGE_LABELS[stage]} / ${column.name}`,
            value ? `Qty ${String(value).replace(/<[^>]+>/g, "")}` : "No qty",
            pipelineTitle,
          ].filter(Boolean).join(" / ");
          return `<td class="quantity-number-cell ${column.type === "calculation" ? "calculation shared-total-highlight shared-total-highlight--cell quantity-total-cell" : ""} ${carryoverClass} ${pipelineClass}" ${cellAttrs} title="${htmlAttr(title)}">${value}</td>`;
        }).join("")).join("")}
        <td class="shared-total-highlight shared-total-highlight--cell ${pipelineClass}" data-approval-pipeline-status="${htmlAttr(pipeline.tone || "pending")}" title="${htmlAttr(pipelineTitle)}"><strong>${group.totalQty}</strong></td>
        <td><button class="mini return" data-manager-quantity-detail="${group.keyId}">Detail</button></td>
      </tr>`;
    }).join("")
    : `<tr class="quantity-empty-row"><td colspan="${managerQuantityColumnCount()}" class="empty-cell">${managerQuantityEmptyMessage()}</td></tr>`;
  const filters = managerQuantityFilters();
  if (showCarryoverEvidence) {
    renderManagerCarryoverLedger("managerQuantityCarryoverLedger", {
      project: filters.project,
      requestLine: filters.requestLine,
      phase: filters.phase,
    }, filters.item || "");
  } else {
    clearNodeContent("managerQuantityCarryoverLedger");
  }
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 897

// @legacy-unit 898 8794
export function clearManagerQuantityFilters() {
  [
    "managerQuantityProjectFilter",
    "managerQuantityLineFilter",
    "managerQuantityItemFilter",
    "managerQuantityPhaseFilter",
    "managerQuantityStationFilter",
    "managerQuantityUnitFilter",
    "managerQuantitySortFilter",
    "managerUnitSplitPhase",
    "managerUnitSplitViewMode",
  ].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  const lineCount = document.getElementById("managerUnitSplitLineCount");
  if (lineCount) lineCount.value = "1";
  if (document.getElementById("managerQuantityProjectFilter")) syncManagerQuantityFilters();
  replaceSelectedManagerQuantityKeyIdBinding("");
  renderManagerQuantityMatrix();
}
// @end-legacy-unit 898

// @legacy-unit 899 8816
export function clearPriceReviewQuantityFilters() {
  [
    "priceReviewQuantityProjectFilter",
    "priceReviewQuantityItemFilter",
    "priceReviewQuantityPhaseFilter",
    "priceReviewQuantityStationFilter",
    "priceReviewQuantityUnitFilter",
    "priceReviewQuantitySortFilter",
  ].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  replaceSelectedManagerQuantityKeyIdBinding("");
  renderPriceReviewAnalysis();
}
// @end-legacy-unit 899

// @legacy-unit 900 8832
export function openManagerQuantityDetail(groupKeyId) {
  const group = managerQuantityGroups().find((item) => item.keyId === groupKeyId);
  if (!group) return;
  const stations = STATION_MASTER.filter((station) => STAGES.some((stage) => (group.stationTotals[stage].get(station) || 0) > 0));
  const unitRows = group.detailRows
    .sort((left, right) => `${left.phase} ${left.station} ${left.demandUnit}`.localeCompare(`${right.phase} ${right.station} ${right.demandUnit}`));
  document.getElementById("managerTrackTitle").textContent = `${group.project} / ${group.item}`;
  document.getElementById("managerTrackSubtitle").textContent = "Phase x station matrix from Requester submitted demand rows";
  document.getElementById("managerTrackSummary").innerHTML = summaryCardsHtml([
    { label: "Total Qty", value: group.totalQty, helper: "All visible demand rows", variant: "hero" },
    { label: "Unit Price", value: group.unitPrice ? formatMoneyFromUsd(group.unitPrice) : "-", helper: group.priceSource },
    { label: "Est. Amount", value: group.estimatedAmount ? formatMoneyFromUsd(group.estimatedAmount) : "-", helper: "Unit price x total qty" },
    { label: "Requests", value: group.requests.size, helper: [...group.requests.keys()].join(" / ") || "-" },
    { label: "Active Phases", value: STAGES.filter((stage) => group.phaseTotals[stage] > 0).map((stage) => STAGE_LABELS[stage]).join(" / ") || "-" },
    { label: "Status", value: [...group.statuses].join(" / ") || "-" },
  ]);
  document.getElementById("managerTrackBody").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>Phase x Station Matrix</h4>
          <p class="panel-subcopy">Rows follow the MFG station master. Columns are phases from P1.0 to MP.</p>
        </div>
      </div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table manager-track-matrix quantity-detail-matrix">
          <thead>
            <tr>
              <th>Station</th>
              ${STAGES.map((stage) => `<th>${STAGE_LABELS[stage]}</th>`).join("")}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${stations.length ? stations.map((station) => {
              const total = STAGES.reduce((sum, stage) => sum + (group.stationTotals[stage].get(station) || 0), 0);
              return `
                <tr>
                  <td><strong>${station}</strong><div class="reason-text">${stationGroupLabel(station)}</div></td>
                  ${STAGES.map((stage) => `<td>${group.stationTotals[stage].get(station) || 0}</td>`).join("")}
                  <td><strong>${total}</strong></td>
                </tr>`;
            }).join("") : `<tr><td colspan="${STAGES.length + 2}" class="empty-cell">No station quantity is available.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>需求單位 Breakdown</h4>
          <p class="panel-subcopy">Use this to confirm which demand unit entered each station/phase quantity.</p>
        </div>
      </div>
      <div class="table-wrap compact-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Type</th>
              <th>Phase</th>
              <th>Station</th>
              <th>需求單位</th>
              <th>Qty</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            ${unitRows.map((entry) => `
              <tr>
                <td>${entry.request.id}</td>
                <td>${entry.demandType}</td>
                <td>${STAGE_LABELS[entry.phase]}</td>
                <td>${entry.station || "-"}</td>
                <td>${entry.demandUnit}</td>
                <td>${entry.qty}</td>
                <td>${entry.remark || "-"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerTrackModal").hidden = false;
}
// @end-legacy-unit 900

// @legacy-unit 901 8917
export function openManagerStageDetail(project, stage, lineDepartment = "") {
  const panel = document.getElementById("managerStageDetailPanel");
  panel.hidden = false;
  const baseRow = requests.find((row) => row.id === project) || requests.find((row) => row.project === project && row.status !== "Draft");
  if (!baseRow) return;
  replaceSelectedManagerRequestIdBinding(baseRow.id);
  document.getElementById("managerStageDetailTitle").textContent = `${baseRow.project} / ${baseRow.name}`;
  const body = document.getElementById("managerStageDetailRows");
  if (!body) return;
  body.innerHTML = STAGES.map((phase) => {
    const rows = managerDetailSameItemRows(baseRow, phase);
    const calc = rows.reduce((sum, item) => {
      const values = managerDetailCalculation(item, phase);
      sum.buffer += values.buffer;
      sum.totalDemand += values.totalDemand;
      sum.stock += values.stock;
      sum.actualNeed += values.actualNeed;
      return sum;
    }, { buffer: 0, totalDemand: 0, stock: 0, actualNeed: 0 });
    const stationColumns = [
      ...MANAGER_MFG_HEADER_MASTER.mainline,
      ...MANAGER_MFG_HEADER_MASTER.packing,
      ...MANAGER_MFG_HEADER_MASTER.supporting,
    ];
    const stationValues = stationColumns.map((station) => rows.reduce((sum, item) => sum + managerDetailStationQty(item, phase, station), 0));
    return `<tr>
      <td>${STAGE_LABELS[phase]}</td>
      ${stationValues.map((value) => `<td>${value}</td>`).join("")}
      <td>${calc.buffer}</td>
      <td>${calc.totalDemand}</td>
      <td>${calc.stock}</td>
      <td>${calc.actualNeed}</td>
      <td>${rows.reduce((sum, item) => sum + clampQty(item[phase]), 0)}</td>
    </tr>`;
  }).join("");
}
// @end-legacy-unit 901

// @legacy-unit 902 8954
export function closeManagerStageDetail() {
  document.getElementById("managerStageDetailPanel").hidden = true;
}
// @end-legacy-unit 902

// @legacy-unit 903 8958
export function openManagerProgressDetail(groupKeyId) {
  const group = managerProgressRows().find((row) => row.keyId === groupKeyId);
  if (!group) return;
  const pendingOwner = managerProgressPendingOwnerForGroup(group);
  const currentStage = managerProgressCurrentStageForGroup(group);
  const submittedAt = (group.rows || []).map(managerProgressSubmittedAt).filter(Boolean).sort()[0] || "";
  const stageStart = managerProgressGroupStageStartAt(group, currentStage);
  const quoteStatus = managerProgressQuoteStatusForGroup(group);
  const nextAction = managerProgressNextActionForGroup(group);
  const daysPending = managerProgressDaysPending(group);
  document.getElementById("managerDetailTitle").textContent = `${group.yearProject} / ${group.project} / ${group.item}`;
  document.getElementById("managerDetailStatus").className = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "status-pill warning"
    : "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = group.lateRows || group.pendingRows || group.notArrivedRows
    ? "Needs Attention"
    : "On Track";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Pivot Group Summary</h4></div>
      <div class="item-detail-grid">
        ${detailRow("Year Project", group.yearProject)}
        ${detailRow("Project", group.project)}
        ${detailRow("Item", group.item)}
        ${detailRow("Department", group.department)}
        ${detailRow("Quantity", group.quantity)}
        ${detailRow("Submitted / Received", submittedAt ? compactDateTime(submittedAt) : "-")}
        ${detailRow("Pending Owner", `<span class="status-pill ${statusClass(pendingOwner)}">${pendingOwner}</span>`)}
        ${detailRow("Current Stage", `<span class="status-pill ${statusClass(currentStage)}">${currentStage}</span>`)}
        ${detailRow("Days Pending", daysPending === null ? "-" : `${daysPending}d`)}
        ${detailRow("Stage Since", stageStart ? compactDateTime(stageStart) : "-")}
        ${detailRow("Quote Status", `<span class="status-pill ${statusClass(quoteStatus)}">${quoteStatus}</span>`)}
        ${detailRow("Next Action", nextAction)}
        ${detailRow("Pending / Risk Reason", pendingReasonCell(group.pendingReasons))}
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Timeline History</h4></div>
      <div class="audit-timeline-list">
        ${group.rows.map((row) => `
          <article class="request-audit-block">
            <div class="audit-row-title">
              <strong>${row.id || "Raw row"}</strong>
              <span>${row.requesterName || row.requester || "Requester"} · ${managerProgressQty(row)} pcs</span>
            </div>
            ${managerAuditTimelineHtml(row)}
          </article>
        `).join("")}
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight"><h4>Raw Request Rows</h4></div>
      <div class="table-wrap stage-demand-wrap">
        <table class="data-table manager-progress-detail-table">
          <thead>
            <tr>
              <th>Requester</th>
              <th>Item / Spec</th>
              <th>Qty</th>
              <th>Department</th>
              <th>Submitted / Received</th>
              <th>Pending Owner</th>
              <th>Current Stage</th>
              <th>Days Pending</th>
              <th>Quote Status</th>
              <th>Next Action</th>
              <th>Pending / Risk Reason</th>
              <th>Raw Pending Value</th>
            </tr>
          </thead>
          <tbody>
            ${group.rows.map((row) => {
              const rowOwner = managerProgressPendingOwnerForRow(row);
              const rowStage = managerProgressCurrentStageForRow(row);
              const rowSubmittedAt = managerProgressSubmittedAt(row);
              const rowStageStart = managerProgressStageStartAt(row, rowStage);
              const rowDaysPending = rowStageStart ? daysBetween(rowStageStart, todayIso()) : null;
              const rowQuoteStatus = omQuoteStatusForRow(row);
              return `
              <tr>
                <td>${row.requesterName || "-"}<div class="reason-text">${row.requesterEmployeeId || row.email || ""}</div></td>
                <td><div class="item-primary">${row.name || "-"}</div><div class="reason-text">${itemDetail(row)}</div></td>
                <td>${managerProgressQty(row)}</td>
                <td>${row.department || row.requesterDept || "-"}</td>
                <td>${rowSubmittedAt ? compactDateTime(rowSubmittedAt) : "-"}<div class="reason-text">${row.needDate ? `Need ${row.needDate}` : "Need date pending"}</div></td>
                <td><span class="status-pill ${statusClass(rowOwner)}">${rowOwner}</span></td>
                <td><span class="status-pill ${statusClass(rowStage)}">${rowStage}</span></td>
                <td>${rowDaysPending === null ? "-" : `${rowDaysPending}d`}<div class="reason-text">${rowStageStart ? `Since ${compactDateTime(rowStageStart)}` : "No stage timestamp"}</div></td>
                <td><span class="status-pill ${statusClass(rowQuoteStatus)}">${rowQuoteStatus}</span><div class="reason-text">${omQuoteValidUntil(row) || "No valid-until date yet"}</div></td>
                <td>${omNextActionForGroup({ rows: [row] })}</td>
                <td>${pendingReasonCell(new Set([managerProgressPendingReason(row)]))}</td>
                <td>${managerProgressRawPendingReason(row) || "-"}</td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
  document.getElementById("managerDetailModal").hidden = false;
}
// @end-legacy-unit 903
