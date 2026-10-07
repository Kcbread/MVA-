// sourcing/rfq: authoritative source; see docs/module-map.md.
import {
  EXT_PR_CREATED,
  EXT_REJECTED_DRI,
  EXT_SUBMITTED,
  OM_PAYMENT_METHOD,
  RFQ_OVERDUE_GRACE_DAYS,
  RFQ_REPLY_BUSINESS_DAYS
} from "../admin/state.js";
import {
  money
} from "../cost/currency.js";
import {
  renderManagerCostView,
  sourcingFinalAmount,
  sourcingInitialPrice,
  sourcingNegotiatedPrice,
  sourcingPriceReduction
} from "../cost/pricing.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  readyForCoordinatorOutput
} from "../handoff/queue.js";
import {
  advanceDispatchHistorySequenceBinding,
  dispatchHistory,
  dispatchHistorySequence,
  replaceDispatchHistoryBinding
} from "../handoff/state.js";
import {
  isMaterialNoPending,
  isNewMaterial,
  itemDetail,
  itemDetailButton,
  itemType
} from "../materials/display.js";
import {
  ensureMaterialMasterFromQuote,
  hasSourcingQuoteSuccess,
  itemKeyDisplay,
  materialDbStatus,
  partName
} from "../materials/identity.js";
import {
  externalEvidenceCount,
  externalEvidenceLabel,
  externalStatusFor,
  latestExternalProgressEvent
} from "../om/external-progress.js";
import {
  syncProjectControls
} from "../projects/controls.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";
import {
  BUYER_RULES,
  RFQ_BUYERS
} from "./config.js";
import {
  groupedRfqRowsByBuyer
} from "./rfq-actions.js";
import {
  HANDOFF_READY
} from "../workflow/status-constants.js";

// @legacy-unit 1506 18939
export function todayDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
// @end-legacy-unit 1506

// @legacy-unit 1507 18943
export function addBusinessDays(startDate, days) {
  const date = new Date(`${startDate}T00:00:00`);
  let remaining = days;
  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return todayDateString(date);
}
// @end-legacy-unit 1507

// @legacy-unit 1508 18954
export function daysBetween(startDate, endDate = new Date()) {
  if (!startDate) return "";
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (Number.isNaN(start.getTime())) return "";
  return Math.max(0, Math.floor((end - start) / 86400000));
}
// @end-legacy-unit 1508

// @legacy-unit 1509 18963
export function rfqRows() {
  return requests.filter((row) => row.status === "Approved" && row.procurementStatus === HANDOFF_READY);
}
// @end-legacy-unit 1509

// @legacy-unit 1510 18967
export function applySuggestedBuyers() {
  let changed = false;
  replaceRequestsBinding(requests.map((row) => {
    if (row.status !== "Approved" || row.rfqBuyer) return row;
    const buyer = suggestedBuyer(row);
    if (!buyer) return row;
    changed = true;
    return { ...row, rfqBuyer: buyer, rfqBuyerSuggested: true };
  }));
  return changed;
}
// @end-legacy-unit 1510

// @legacy-unit 1511 18979
export function selectedRfqRows() {
  return rfqRows().filter((row) => row.rfqSelected);
}
// @end-legacy-unit 1511

// @legacy-unit 1512 18983
export function buyerEmail(owner) {
  return RFQ_BUYERS.find((buyer) => buyer.name === owner)?.email || "";
}
// @end-legacy-unit 1512

// @legacy-unit 1513 18987
export function suggestedBuyer(row) {
  const text = normalize([row.name, itemDetail(row), row.level1, row.level2, row.level3, row.process, row.station].join(" "));
  const match = BUYER_RULES.find((rule) => {
    const level1Match = rule.level1?.some((value) => value === row.level1);
    const level2Match = rule.level2?.some((value) => value === row.level2);
    const keywordMatch = rule.keywords.some((keyword) => text.includes(normalize(keyword)));
    return level1Match || level2Match || keywordMatch;
  });
  return match?.buyer || "EQ Sourcing";
}
// @end-legacy-unit 1513

// @legacy-unit 1514 18998
export function effectiveRfqBuyer(row) {
  return row.rfqBuyer || suggestedBuyer(row);
}
// @end-legacy-unit 1514

// @legacy-unit 1515 19002
export function rfqBuyerOptions(selected = "") {
  return [
    `<option value="">Unassigned</option>`,
    ...RFQ_BUYERS.map((buyer) => `<option value="${buyer.name}" ${selected === buyer.name ? "selected" : ""}>${buyer.name}</option>`),
  ].join("");
}
// @end-legacy-unit 1515

// @legacy-unit 1516 19009
export function rfqReplyStatus(row) {
  return rfqStatus(row);
}
// @end-legacy-unit 1516

// @legacy-unit 1517 19013
export function rfqReplyComplete(row) {
  return Boolean(row.rfqQuoteResult) || ["Quote Received", "Closed"].includes(row.rfqStatus);
}
// @end-legacy-unit 1517

// @legacy-unit 1518 19017
export function rfqStatusOptions(selected = "") {
  return ["Draft", "Dispatched", "Waiting Quote", "Quote Received", "Need Clarification", "Overdue", "Closed"]
    .map((status) => `<option value="${status}" ${selected === status ? "selected" : ""}>${status}</option>`)
    .join("");
}
// @end-legacy-unit 1518

// @legacy-unit 1519 19023
export function rfqPictureSource(row) {
  return row.itemMasterImage ? "Item master image" : row.userUploadImage ? "User upload image" : isNewMaterial(row) ? "User upload image" : "Item master image";
}
// @end-legacy-unit 1519

// @legacy-unit 1520 19027
export function rfqRequiredReplyDate(row) {
  if (row.rfqRequiredReplyDate) return row.rfqRequiredReplyDate;
  if (row.rfqDispatchDate) return addBusinessDays(row.rfqDispatchDate, RFQ_REPLY_BUSINESS_DAYS);
  return "";
}
// @end-legacy-unit 1520

// @legacy-unit 1521 19033
export function rfqStatus(row) {
  if (row.rfqStatus === "Closed") return "Closed";
  if (row.rfqStatus === "Need Clarification") return "Need Clarification";
  if (row.rfqQuoteResult) return "Quote Received";
  if (!row.rfqDispatchDate) return "Draft";
  const requiredDate = rfqRequiredReplyDate(row);
  const overdueStart = requiredDate ? daysBetween(requiredDate) : 0;
  if (overdueStart > RFQ_OVERDUE_GRACE_DAYS) return "Overdue";
  return row.rfqStatus || "Waiting Quote";
}
// @end-legacy-unit 1521

// @legacy-unit 1522 19044
export function addDispatchHistory(row, action, note = "") {
  const actor = roleProfiles[currentRole]?.name || "System";
  replaceDispatchHistoryBinding([{
    id: `DH-${String(advanceDispatchHistorySequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    buyer: effectiveRfqBuyer(row) || "Unassigned",
    action,
    actor,
    note,
    timestamp: new Date().toISOString(),
  }, ...dispatchHistory]);
}
// @end-legacy-unit 1522

// @legacy-unit 1523 19059
export function renderRfqSummary(rows = rfqRows()) {
  const cards = [
    ["Collection Export Rows", rows.length],
    ["Selected", rows.filter((row) => row.rfqSelected).length],
    ["Ready for Handoff", rows.filter(readyForCoordinatorOutput).length],
    ["With Picture", rows.filter((row) => rfqPictureSource(row)).length],
    ["Missing Evidence", rows.filter((row) => externalEvidenceCount(row) === 0).length],
  ];
  const target = document.getElementById("rfqSummary");
  if (!target) return;
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}
// @end-legacy-unit 1523

// @legacy-unit 1524 19076
export function renderRfqBuyerGroups(rows) {
  const target = document.getElementById("rfqBuyerGroups");
  if (!target) return;
  const groups = groupedRfqRowsByBuyer(rows);
  target.innerHTML = Object.keys(groups).length
    ? Object.entries(groups).map(([buyer, buyerRows]) => {
      const readyRows = buyerRows.filter(readyForCoordinatorOutput);
      const blockedRows = buyerRows.length - readyRows.length;
      const selectedRows = buyerRows.filter((row) => row.rfqSelected).length;
      const nextRequiredDate = buyerRows.map(rfqRequiredReplyDate).filter(Boolean).sort()[0] || addBusinessDays(todayDateString(), RFQ_REPLY_BUSINESS_DAYS);
      return `
        <article class="rfq-buyer-card">
          <div>
            <span class="toolbar-label">${buyer}</span>
            <strong>${buyerRows.length} item${buyerRows.length === 1 ? "" : "s"}</strong>
            <p>${readyRows.length} ready / ${blockedRows} blocked · ${selectedRows} selected</p>
            <p>Required reply: ${nextRequiredDate}</p>
          </div>
          <div class="rfq-card-actions">
            <button class="mini ghost" data-rfq-group-action="select" data-rfq-group-buyer="${buyer}">Select Group</button>
            <button class="mini ghost" data-rfq-group-action="export" data-rfq-group-buyer="${buyer}">Prepare Handoff</button>
            <button class="mini return" data-rfq-group-action="email" data-rfq-group-buyer="${buyer}">Email Draft</button>
            <button class="mini approve" data-rfq-group-action="dispatch" data-rfq-group-buyer="${buyer}">Mark Dispatched</button>
          </div>
        </article>`;
    }).join("")
    : `<div class="empty-state compact-empty">No RFQ sourcing groups yet.</div>`;
}
// @end-legacy-unit 1524

// @legacy-unit 1525 19105
export function renderRfqDispatch() {
  applySuggestedBuyers();
  const rows = rfqRows();
  renderRfqSummary(rows);
  renderRfqBuyerGroups(rows);
  const count = document.getElementById("mfgEcsCount");
  const selectedCount = document.getElementById("mfgEcsSelectedCount");
  if (count) count.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  if (selectedCount) selectedCount.textContent = `${rows.filter((row) => row.rfqSelected).length} selected`;
  const target = document.getElementById("rfqDispatchRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          <td><input type="checkbox" data-rfq-select="${row.id}" ${row.rfqSelected ? "checked" : ""} /></td>
          <td>${row.project}</td>
          <td>${row.project}</td>
          <td>${itemKeyDisplay(row)}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
          <td><div class="clamped-cell">${itemDetail(row) || "\\"}</div></td>
          <td><span class="rfq-picture-token">${rfqPictureSource(row)}</span></td>
          <td>${totalQty(row)}</td>
          <td>${roleProfiles.requester.dept}</td>
          <td><div class="clamped-cell">${row.requesterReason || row.procurementRemark || "Approved demand is ready for sourcing coordination."}</div></td>
          <td>${OM_PAYMENT_METHOD}</td>
          <td>${itemType(row)}</td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`).join("")
    : `<tr><td colspan="13" class="empty-cell">No approved MFG demand is available for sourcing coordination.</td></tr>`;
}
// @end-legacy-unit 1525

// @legacy-unit 1526 19136
export function renderRfqFollowUpSummary(rows = rfqRows()) {
  const cards = [
    ["Progress Rows", rows.length],
    ["Submitted", rows.filter((row) => externalStatusFor(row) === EXT_SUBMITTED).length],
    ["Rejected to DRI", rows.filter((row) => externalStatusFor(row) === EXT_REJECTED_DRI).length],
    ["PR Created", rows.filter((row) => externalStatusFor(row) === EXT_PR_CREATED).length],
    ["Missing Evidence", rows.filter((row) => externalEvidenceCount(row) === 0).length],
  ];
  const target = document.getElementById("rfqFollowUpSummary");
  if (!target) return;
  target.innerHTML = summaryCardsHtml(cards);
}
// @end-legacy-unit 1526

// @legacy-unit 1527 19149
export function renderRfqFollowUp() {
  const rows = rfqRows();
  renderRfqFollowUpSummary(rows);
  const count = document.getElementById("mfgProgressCount");
  const selectedCount = document.getElementById("mfgProgressSelectedCount");
  if (count) count.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  if (selectedCount) selectedCount.textContent = `${rows.filter((row) => row.rfqSelected).length} selected`;
  const target = document.getElementById("rfqFollowUpRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const latest = latestExternalProgressEvent(row);
      return `
        <tr>
          <td><input type="checkbox" data-rfq-select="${row.id}" ${row.rfqSelected ? "checked" : ""} /></td>
          <td>${row.id}</td>
          <td>${row.project}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
          <td><span class="status-pill ${statusClass(externalStatusFor(row))}">${externalStatusFor(row)}</span></td>
          <td>${externalEvidenceLabel(row)}</td>
          <td>${row.externalRequestNo || "-"}</td>
          <td>${row.prNo || "-"}</td>
          <td>${row.buyerPoNo || row.poNo || "-"}</td>
          <td>${latest ? new Date(latest.createdAt).toLocaleString("en-US") : "-"}</td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="11" class="empty-cell">No MFG package progress rows are available.</td></tr>`;
}
// @end-legacy-unit 1527

// @legacy-unit 1528 19179
export function renderDispatchHistory() {
  const target = document.getElementById("dispatchHistoryRows");
  if (!target) return;
  target.innerHTML = dispatchHistory.length
    ? dispatchHistory.map((row) => `
      <tr>
        <td>${row.requestId}</td>
        <td>${row.project}</td>
        <td>${row.item}</td>
        <td>${row.buyer}</td>
        <td>${row.action}</td>
        <td>${row.actor}</td>
        <td>${row.note || "-"}</td>
        <td>${new Date(row.timestamp).toLocaleString("en-US")}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-cell">No RFQ dispatch actions recorded yet.</td></tr>`;
}
// @end-legacy-unit 1528

// @legacy-unit 1529 19197
export function syncSourcingOwnerFilter() {
  const select = document.getElementById("sourcingOwnerFilter");
  if (!select) return;
  const previous = select.value;
  select.innerHTML = [
    `<option value="">All sourcing owners</option>`,
    ...RFQ_BUYERS.map((owner) => `<option value="${owner.name}">${owner.name}</option>`),
  ].join("");
  select.value = previous && RFQ_BUYERS.some((owner) => owner.name === previous) ? previous : "";
}
// @end-legacy-unit 1529

// @legacy-unit 1530 19208
export function sourcingRows() {
  const ownerFilter = document.getElementById("sourcingOwnerFilter")?.value || "";
  const statusFilter = document.getElementById("sourcingStatusFilter")?.value || "";
  return rfqRows().filter((row) => {
    const owner = effectiveRfqBuyer(row);
    const status = rfqStatus(row);
    return (!ownerFilter || owner === ownerFilter) && (!statusFilter || status === statusFilter);
  });
}
// @end-legacy-unit 1530

// @legacy-unit 1531 19218
export function renderSourcing() {
  syncProjectControls();
  syncSourcingOwnerFilter();
  applySuggestedBuyers();
  const rows = sourcingRows();
  const cards = [
    ["Assigned RFQ", rows.length],
    ["Waiting Quote", rows.filter((row) => rfqStatus(row) === "Waiting Quote").length],
    ["Overdue", rows.filter((row) => rfqStatus(row) === "Overdue").length],
    ["Quote Received", rows.filter((row) => rfqStatus(row) === "Quote Received").length],
    ["Need Clarification", rows.filter((row) => rfqStatus(row) === "Need Clarification").length],
  ];
  const summary = document.getElementById("sourcingSummary");
  if (summary) summary.innerHTML = summaryCardsHtml(cards);
  const target = document.getElementById("sourcingRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
        <td><span class="status-pill ${statusClass(effectiveRfqBuyer(row))}">${effectiveRfqBuyer(row)}</span></td>
        <td>${itemKeyDisplay(row)}</td>
        <td><span class="status-pill ${statusClass(materialDbStatus(row))}">${materialDbStatus(row)}</span></td>
        <td>${row.rfqDispatchDate || "-"}</td>
        <td>${rfqRequiredReplyDate(row) || "-"}</td>
        <td>${row.rfqDispatchDate ? daysBetween(row.rfqDispatchDate) : "-"}</td>
        <td>
          <span class="status-pill ${statusClass(rfqStatus(row))}">${rfqStatus(row)}</span>
          <select class="compact-select" data-sourcing-field="rfqStatus" data-sourcing-id="${row.id}">${rfqStatusOptions(rfqStatus(row))}</select>
        </td>
        <td><input type="text" value="${row.vendor || ""}" placeholder="Vendor name" data-sourcing-field="vendor" data-sourcing-id="${row.id}" /></td>
        <td><input type="text" value="${row.vendorPartNo || ""}" placeholder="Vendor code" data-sourcing-field="vendorPartNo" data-sourcing-id="${row.id}" /></td>
        <td><input type="number" min="0" step="0.01" value="${sourcingInitialPrice(row) || ""}" placeholder="Initial price" data-sourcing-field="initialPrice" data-sourcing-id="${row.id}" /></td>
        <td><input type="number" min="0" step="0.01" value="${sourcingNegotiatedPrice(row) || ""}" placeholder="Negotiated price" data-sourcing-field="updatedPrice" data-sourcing-id="${row.id}" /></td>
        <td>${sourcingPriceReduction(row)}</td>
        <td>${sourcingFinalAmount(row) ? money(sourcingFinalAmount(row)) : "-"}</td>
        <td>
          <label class="mini upload ${row.quotationPdf ? "uploaded" : ""}">
            ${row.quotationPdf ? "Screenshot Uploaded" : "Upload Screenshot"}
            <input type="file" accept="image/*,.jpg,.jpeg,.png" data-sourcing-pdf="${row.id}" />
          </label>
          <div class="reason-text ${row.quotationPdf ? "quote-file-ready" : ""}">${row.quotationPdf || "No screenshot"}</div>
        </td>
        <td><input type="text" value="${row.rfqQuoteResult || ""}" placeholder="Quote result / sourcing note" data-sourcing-field="rfqQuoteResult" data-sourcing-id="${row.id}" /></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="18" class="empty-cell">No RFQ rows are assigned to Sourcing yet.</td></tr>`;
}
// @end-legacy-unit 1531

// @legacy-unit 1532 19269
export function updateSourcingField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  if (!before) return;
  const normalizedValue = ["updatedPrice", "initialPrice"].includes(field) ? clampQty(value) : value;
  if (before[field] === normalizedValue) return;
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId) return row;
    const next = { ...row, [field]: normalizedValue };
    if (field === "rfqQuoteResult" && String(value || "").trim()) next.rfqStatus = "Quote Received";
    if (["vendor", "vendorPartNo", "updatedPrice", "initialPrice"].includes(field) && !next.rfqStatus) next.rfqStatus = "Quote Received";
    return next;
  }));
  let after = requests.find((row) => row.id === requestId);
  if (after && hasSourcingQuoteSuccess(after) && !isMaterialNoPending(after)) {
    const materialPatch = ensureMaterialMasterFromQuote(after);
    replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, ...materialPatch } : row));
    after = requests.find((row) => row.id === requestId);
    addDispatchHistory(after, "Vendor mapping updated", `${after.materialNo} vendor quote data saved after sourcing quote success.`);
  }
  addDispatchHistory(after, field === "rfqQuoteResult" ? "Sourcing quote result updated" : "Sourcing quote data updated", `${field} updated to ${value || "blank"}.`);
  renderSourcing();
  renderRfqDispatch();
  renderRfqFollowUp();
  renderManagerCostView();
}
// @end-legacy-unit 1532
