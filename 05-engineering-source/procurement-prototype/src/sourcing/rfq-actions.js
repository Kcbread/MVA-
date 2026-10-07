// sourcing/rfq-actions: authoritative source; see docs/module-map.md.
import {
  BUYER_RECEIVED,
  EXT_REJECTED_DRI,
  OM_PAYMENT_METHOD,
  RFQ_REPLY_BUSINESS_DAYS
} from "../admin/state.js";
import {
  amountVndFromUsd,
  currentUsdToVndRate
} from "../cost/currency.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  downloadFile,
  downloadXlsx
} from "../exports/workbook.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  addHandoffHistory,
  procurementRows,
  readyForCoordinatorOutput
} from "../handoff/queue.js";
import {
  handoffWarnings
} from "../handoff/status.js";
import {
  renderHandoffHistory,
  renderProcurement
} from "../handoff/view.js";
import {
  itemDetail,
  itemType
} from "../materials/display.js";
import {
  itemKeyDisplay,
  partName
} from "../materials/identity.js";
import {
  openOmExternalResultModal
} from "../om/external-progress.js";
import {
  omUnit
} from "../om/pricing.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  addBusinessDays,
  addDispatchHistory,
  buyerEmail,
  daysBetween,
  effectiveRfqBuyer,
  renderDispatchHistory,
  renderRfqDispatch,
  renderRfqFollowUp,
  renderSourcing,
  rfqPictureSource,
  rfqReplyComplete,
  rfqRequiredReplyDate,
  rfqRows,
  selectedRfqRows,
  todayDateString
} from "./rfq.js";
import {
  pendingRfqEmailRows,
  replacePendingRfqEmailRowsBinding
} from "./state.js";
import {
  HANDOFF_SENT_TO_BUYER
} from "../workflow/status-constants.js";

// @legacy-unit 1541 19410
export function updateRfqField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  const targetField = field === "updatedPriceVnd" ? "updatedPrice" : field;
  const normalizedValue = field === "updatedPriceVnd" ? clampQty(value) / currentUsdToVndRate() : field === "updatedPrice" ? clampQty(value) : value;
  if (!before || before[targetField] === normalizedValue) return;
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId) return row;
    const next = { ...row, [targetField]: normalizedValue };
    if (field === "updatedPriceVnd") {
      next.updatedPriceUsd = normalizedValue;
      next.updatedPriceVnd = clampQty(value);
    } else if (targetField === "updatedPrice") {
      next.updatedPriceUsd = normalizedValue;
      next.updatedPriceVnd = Math.round(amountVndFromUsd(normalizedValue));
    }
    if (field === "rfqBuyer") {
      next.rfqBuyerSuggested = false;
      if (value) next.rfqStatus = next.rfqDispatchDate ? "Waiting Quote" : "Draft";
    }
    if (field === "rfqQuoteResult" && value.trim()) next.rfqStatus = "Quote Received";
    return next;
  }));
  const after = requests.find((row) => row.id === requestId);
  if (field === "rfqBuyer") addDispatchHistory(after, "Assigned buyer", value || "Buyer cleared.");
  if (field === "rfqRequiredReplyDate") addDispatchHistory(after, "Updated required reply date", value || "Required reply date cleared.");
  if (field === "rfqQuoteResult") addDispatchHistory(after, "Sourcing reply updated", value || "Reply note cleared.");
  if (field === "rfqStatus") addDispatchHistory(after, value === "Need Clarification" ? "Need clarification" : `RFQ status updated: ${value}`, value);
  renderRfqDispatch();
  renderRfqFollowUp();
  renderDispatchHistory();
  renderHandoffHistory();
  renderSourcing();
  renderOmPurchasing();
}
// @end-legacy-unit 1541

// @legacy-unit 1542 19445
export function groupedRfqRowsByBuyer(rows) {
  return rows.reduce((groups, row) => {
    const buyer = effectiveRfqBuyer(row) || "";
    if (!buyer) return groups;
    groups[buyer] ??= [];
    groups[buyer].push(row);
    return groups;
  }, {});
}
// @end-legacy-unit 1542

// @legacy-unit 1543 19455
export function rfqFileName(project, buyer) {
  const date = todayDateString().replace(/-/g, "");
  return `${project}-${buyer}-RFQ-Request-${date}.xlsx`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}
// @end-legacy-unit 1543

// @legacy-unit 1544 19460
export function mfgEcsFileName(project) {
  const date = todayDateString().replace(/-/g, "");
  return `${project}-MFG-Collection-${date}.xlsx`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}
// @end-legacy-unit 1544

// @legacy-unit 1545 19465
export function rfqExcelRows(rows) {
  const header = ["No.", "Model", "Material No.", "English name", "Vietnamese Name", "Spec", "Picture", "Unit", "Usage Qty", "Used by", "Using Purpose", "Budget", "Classify by type", "Coordinator / IE Remark", "No. of quotation"];
  return [
    ["XX需求申請單 / XX Demands application sheet", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
    header,
    ...rows.map((row, index) => [
      index + 1,
      row.project,
      itemKeyDisplay(row),
      row.name,
      row.vnName || "",
      itemDetail(row) || "\\",
      rfqPictureSource(row),
      omUnit(row),
      totalQty(row),
      roleProfiles.requester.dept,
      row.requesterReason || row.procurementRemark || "Approved demand for RFQ.",
      OM_PAYMENT_METHOD,
      itemType(row),
      [partName(row), row.procurementRemark || handoffWarnings(row).join(" / ") || ""].filter(Boolean).join(" / "),
      row.noOfQuotation || "",
    ]),
  ];
}
// @end-legacy-unit 1545

// @legacy-unit 1546 19490
export function exportRfqExcel() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before exporting Excel.", "error");
    return;
  }
  if (rows.some((row) => !readyForCoordinatorOutput(row))) return;
  const projects = [...new Set(rows.map((row) => row.project))];
  if (projects.length !== 1) {
    showToast("Export one MFG project package at a time. Please select rows from a single project.", "error");
    return;
  }
  const project = projects[0];
  const groups = rows.reduce((grouped, row) => {
    const key = itemType(row) || "MFG";
    grouped[key] ??= [];
    grouped[key].push(row);
    return grouped;
  }, {});
  const sheets = Object.entries(groups).map(([type, typeRows]) => ({
      name: `${type}`.slice(0, 31),
      rows: rfqExcelRows(typeRows),
      minWidth: 8,
      maxWidth: 42,
      preferred: { 0: 5, 1: 14, 2: 24, 3: 26, 4: 24, 5: 38, 6: 18, 8: 12, 10: 30, 12: 18, 13: 32 },
      rowHeights: [28, 58],
      merges: ["A1:O1"],
      freezeHeader: true,
    }));
  downloadXlsx(mfgEcsFileName(project), sheets);
  rows.forEach((row) => addDispatchHistory(row, "Exported MFG Collection Excel", mfgEcsFileName(project)));
  renderDispatchHistory();
  showToast("MFG collection Excel exported.", "success");
}
// @end-legacy-unit 1546

// @legacy-unit 1547 19525
export function exportMfgPdf() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before exporting PDF.", "error");
    return;
  }
  const projects = [...new Set(rows.map((row) => row.project))];
  if (projects.length !== 1) {
    showToast("Export one project package at a time. Please select rows from a single project.", "error");
    return;
  }
  const project = projects[0];
  const content = [
    "MFG Collection Evidence PDF",
    `Project: ${project}`,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    ...rows.map((row, index) => `${index + 1}. ${row.id} | ${row.name} | Qty ${totalQty(row)} | ${itemDetail(row) || "No spec"}`),
  ].join("\n");
  downloadFile(`${project}-MFG-Collection.pdf`, content, "application/pdf");
  rows.forEach((row) => addDispatchHistory(row, "Exported MFG Collection PDF", `${project}-MFG-Collection.pdf`));
  renderDispatchHistory();
  showToast("MFG collection PDF exported.", "success");
}
// @end-legacy-unit 1547

// @legacy-unit 1548 19550
export function updateMfgExternalProgress() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before updating external progress.", "error");
    return;
  }
  openOmExternalResultModal(rows, "", "mfg");
}
// @end-legacy-unit 1548

// @legacy-unit 1549 19559
export function selectedMfgRows() {
  const rows = selectedRfqRows();
  if (rows.length) return rows;
  return procurementRows().filter((row) => row.handoffSelected || row.rfqSelected);
}
// @end-legacy-unit 1549

// @legacy-unit 1550 19565
export function rejectMfgSelectedToDri() {
  const rows = selectedMfgRows();
  if (!rows.length) {
    showToast("Select at least one MFG package row before rejecting to DRI.", "error");
    return;
  }
  openOmExternalResultModal(rows, EXT_REJECTED_DRI, "mfg");
}
// @end-legacy-unit 1550

// @legacy-unit 1551 19574
export function selectedRowsForSingleBuyer(actionLabel) {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast(`Select at least one RFQ row before ${actionLabel}.`, "error");
    return [];
  }
  if (rows.some((row) => !effectiveRfqBuyer(row))) {
    showToast("Assign Sourcing Owner before continuing.", "error");
    return [];
  }
  if (rows.some((row) => !readyForCoordinatorOutput(row))) return [];
  const buyers = [...new Set(rows.map((row) => effectiveRfqBuyer(row)))];
  if (buyers.length !== 1) {
    showToast("Select rows for one Sourcing Owner at a time.", "error");
    return [];
  }
  return rows;
}
// @end-legacy-unit 1551

// @legacy-unit 1552 19593
export function generateRfqEmailDraft() {
  const rows = selectedRowsForSingleBuyer("generating email draft");
  if (!rows.length) return;
  replacePendingRfqEmailRowsBinding(rows.map((row) => row.id));
  const buyer = effectiveRfqBuyer(rows[0]);
  const project = rows[0].project;
  const attachment = rfqFileName(project, buyer);
  const requiredDates = rows.map(rfqRequiredReplyDate).filter(Boolean);
  const requiredReplyDate = requiredDates[0] || addBusinessDays(todayDateString(), RFQ_REPLY_BUSINESS_DAYS);
  const daysSinceSentValues = rows.map((row) => row.rfqDispatchDate ? daysBetween(row.rfqDispatchDate) : null).filter((value) => value !== null);
  const daysSinceSent = daysSinceSentValues.length ? Math.max(...daysSinceSentValues) : "Not dispatched yet";
  document.getElementById("rfqEmailDraftScope").textContent = `${buyer} · ${rows.length} item${rows.length === 1 ? "" : "s"}`;
  document.getElementById("rfqEmailTo").value = buyerEmail(buyer);
  document.getElementById("rfqEmailSubject").value = `[RFQ Request] ${project} - ${buyer} - ${rows.length} items`;
  document.getElementById("rfqEmailBody").value = [
    `Hi ${buyer},`,
    "",
    `Please help quote the attached RFQ package for ${project}.`,
    "",
    `Project: ${project}`,
    `Sourcing Owner: ${buyer}`,
    `Item count: ${rows.length}`,
    `Required reply date: ${requiredReplyDate}`,
    `Days since sent: ${daysSinceSent}`,
    `Attachment: ${attachment}`,
    "",
    "Coordinator note:",
    rows.map((row, index) => `${index + 1}. ${row.id} - ${row.name}: ${row.procurementRemark || row.requesterReason || "Please quote based on attached specification."}`).join("\n"),
    "",
    "Thank you.",
  ].join("\n");
  rows.forEach((row) => addDispatchHistory(row, "Generated email draft", `To: ${buyerEmail(buyer)} / Attachment: ${attachment}`));
  document.getElementById("rfqEmailDraftModal").hidden = false;
  renderDispatchHistory();
}
// @end-legacy-unit 1552

// @legacy-unit 1553 19629
export function closeRfqEmailDraft() {
  replacePendingRfqEmailRowsBinding([]);
  document.getElementById("rfqEmailDraftModal").hidden = true;
}
// @end-legacy-unit 1553

// @legacy-unit 1554 19634
export function copyRfqEmailDraft() {
  const text = [
    `To: ${document.getElementById("rfqEmailTo").value}`,
    `Subject: ${document.getElementById("rfqEmailSubject").value}`,
    "",
    document.getElementById("rfqEmailBody").value,
  ].join("\n");
  navigator.clipboard?.writeText(text);
  showToast("RFQ email draft copied.", "success");
}
// @end-legacy-unit 1554

// @legacy-unit 1555 19645
export function rfqRowsForBuyer(buyer) {
  return rfqRows().filter((row) => effectiveRfqBuyer(row) === buyer);
}
// @end-legacy-unit 1555

// @legacy-unit 1556 19649
export function selectRfqBuyerGroup(buyer) {
  const buyerRows = rfqRowsForBuyer(buyer);
  replaceRequestsBinding(requests.map((row) => buyerRows.some((item) => item.id === row.id) ? { ...row, rfqSelected: true } : row));
  renderRfqDispatch();
  renderRfqFollowUp();
  showToast(`${buyerRows.length} ${buyer} RFQ row${buyerRows.length === 1 ? "" : "s"} selected.`, "success");
}
// @end-legacy-unit 1556

// @legacy-unit 1557 19657
export function runRfqBuyerGroupAction(buyer, action) {
  const buyerRows = rfqRowsForBuyer(buyer);
  if (!buyerRows.length) {
    showToast("No RFQ rows are available for this buyer.", "error");
    return;
  }
  replaceRequestsBinding(requests.map((row) => buyerRows.some((item) => item.id === row.id) ? { ...row, rfqSelected: true, rfqBuyer: effectiveRfqBuyer(row) } : { ...row, rfqSelected: false }));
  if (action === "select") {
    renderRfqDispatch();
    renderRfqFollowUp();
    showToast(`${buyerRows.length} ${buyer} RFQ row${buyerRows.length === 1 ? "" : "s"} selected.`, "success");
    return;
  }
  if (action === "export") exportRfqExcel();
  if (action === "email") generateRfqEmailDraft();
  if (action === "dispatch") markRfqDispatched();
}
// @end-legacy-unit 1557

// @legacy-unit 1558 19675
export function markRfqDispatched() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one RFQ row before marking dispatched.", "error");
    return;
  }
  if (rows.some((row) => !effectiveRfqBuyer(row))) {
    showToast("Assign Sourcing Owner before marking dispatched.", "error");
    return;
  }
  if (rows.some((row) => !readyForCoordinatorOutput(row))) return;
  const today = todayDateString();
  replaceRequestsBinding(requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    const dispatchDate = row.rfqDispatchDate || today;
    return {
      ...row,
      rfqDispatchDate: dispatchDate,
      rfqRequiredReplyDate: row.rfqRequiredReplyDate || addBusinessDays(dispatchDate, RFQ_REPLY_BUSINESS_DAYS),
      rfqStatus: "Waiting Quote",
    };
  }));
  rows.forEach((row) => addDispatchHistory({ ...row, rfqDispatchDate: row.rfqDispatchDate || today }, "Marked as dispatched", `Required reply date: ${row.rfqRequiredReplyDate || addBusinessDays(today, RFQ_REPLY_BUSINESS_DAYS)}`));
  renderRfqDispatch();
  renderDispatchHistory();
  showToast("Selected RFQ rows marked dispatched.", "success");
}
// @end-legacy-unit 1558

// @legacy-unit 1559 19703
export function sendRfqSelectedToBuyer() {
  const rows = selectedRfqRows();
  if (!rows.length) {
    showToast("Select at least one RFQ reply row before sending to Buyer.", "error");
    return;
  }
  const notReady = rows.filter((row) => !readyForCoordinatorOutput(row) || !rfqReplyComplete(row));
  if (notReady.length) {
    showToast("Only rows with Sourcing reply can be sent to Buyer.", "error");
    return;
  }
  const now = new Date().toISOString();
  rows.forEach((row) => {
    addDispatchHistory(row, "Sent package to Buyer", `Sourcing owner: ${effectiveRfqBuyer(row)}`);
    addHandoffHistory(row, "Sent package to Buyer", `Quote result: ${row.rfqQuoteResult || "Quote received"}`);
  });
  replaceRequestsBinding(requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      rfqSelected: false,
      procurementStatus: HANDOFF_SENT_TO_BUYER,
      buyerStatus: row.buyerStatus || BUYER_RECEIVED,
      buyerReceivedAt: row.buyerReceivedAt || now,
    };
  }));
  renderProcurement();
  renderSourcing();
  renderBuyer();
  showToast(`${rows.length} RFQ row${rows.length === 1 ? "" : "s"} sent to Buyer.`, "success");
}
// @end-legacy-unit 1559
