// handoff/buyer: authoritative source; see docs/module-map.md.
import {
  BUYER_BLOCKED,
  BUYER_COMPLETED,
  BUYER_PO_ISSUED,
  BUYER_PR_CREATED,
  BUYER_RECEIVED,
  EXT_ACCEPTED,
  EXT_BLOCKED,
  EXT_COMPLETED,
  EXT_PO_ISSUED,
  EXT_PR_CREATED,
  EXT_SUBMITTED,
  OM_EXPORTED_CFA,
  OM_EXPORTED_ECS
} from "../admin/state.js";
import {
  renderManagerDashboard
} from "../cost/manager-dashboard.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  addHandoffHistory
} from "./queue.js";
import {
  omItemCell
} from "../materials/detail-view.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  factoryMaterialNoFor,
  partName
} from "../materials/identity.js";
import {
  externalEvidenceCount,
  externalEvidenceLabel,
  externalStatusFor,
  latestExternalProgressEvent
} from "../om/external-progress.js";
import {
  isOmBuyScope
} from "../om/ownership.js";
import {
  syncProjectControls
} from "../projects/controls.js";
import {
  statusClass
} from "../shared/format.js";
import {
  htmlAttr
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  HANDOFF_SENT_TO_OM
} from "../workflow/status-constants.js";

// @legacy-unit 1533 19295
export function buyerSourceOwner(row) {
  if (isOmBuyScope(row) || row.procurementStatus === HANDOFF_SENT_TO_OM) return "OM Purchasing";
  if (row.rfqBuyer || row.rfqQuoteResult) return "Sourcing";
  return "Coordinator";
}
// @end-legacy-unit 1533

// @legacy-unit 1534 19301
export function buyerRows() {
  const projectFilter = document.getElementById("buyerProjectFilter")?.value || "";
  const statusFilter = document.getElementById("buyerStatusFilter")?.value || "";
  return requests.filter((row) => {
    const visible = [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus);
    return visible && (!projectFilter || row.project === projectFilter) && (!statusFilter || buyerStatusFor(row) === statusFilter);
  });
}
// @end-legacy-unit 1534

// @legacy-unit 1535 19310
export function buyerStatusFor(row) {
  if (row.buyerStatus) return row.buyerStatus;
  if ([OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus)) return BUYER_RECEIVED;
  return "-";
}
// @end-legacy-unit 1535

// @legacy-unit 1536 19316
export function buyerPackageHelper(row) {
  if (row.finalExportedAt) {
    return `Accepted OM handoff on ${new Date(row.finalExportedAt).toLocaleDateString("en-US")}`;
  }
  return "Waiting OM handoff time";
}
// @end-legacy-unit 1536

// @legacy-unit 1537 19323
export function buyerStatusHelper(row) {
  const status = buyerStatusFor(row);
  if (status === BUYER_RECEIVED) return "Buyer can now create PR / PO and track buyer-side progress.";
  if (status === BUYER_PR_CREATED) return row.prNo ? `PR ${row.prNo} has been created.` : "PR has been created and is waiting for PO.";
  if (status === BUYER_PO_ISSUED) return (row.buyerPoNo || row.poNo) ? `PO ${row.buyerPoNo || row.poNo} has been issued.` : "PO has been issued and is waiting for closure.";
  if (status === BUYER_COMPLETED) return "Buyer package is complete.";
  if (status === BUYER_BLOCKED) return row.buyerBlockedReason || row.buyerNote || "Buyer follow-up is blocked and needs attention.";
  return "Waiting buyer update.";
}
// @end-legacy-unit 1537

// @legacy-unit 1538 19333
export function buyerExternalStatusHelper(row) {
  const status = externalStatusFor(row);
  if (status === EXT_PR_CREATED) return row.prNo ? `PR ${row.prNo}` : "PR created";
  if (status === EXT_PO_ISSUED) return row.buyerPoNo || row.poNo ? `PO ${row.buyerPoNo || row.poNo}` : "PO issued";
  if (status === EXT_COMPLETED) return externalEvidenceCount(row) ? `${externalEvidenceCount(row)} evidence file${externalEvidenceCount(row) === 1 ? "" : "s"} attached` : "Completed without evidence";
  if (status === EXT_BLOCKED) return row.buyerBlockedReason || row.buyerNote || "Blocked in buyer handoff";
  if (status === EXT_ACCEPTED) return row.externalSystem ? `${row.externalSystem} accepted package` : "External package accepted";
  if (status === EXT_SUBMITTED) return row.externalRequestNo ? `Ref ${row.externalRequestNo}` : "Submitted to external system";
  return "No buyer handoff update yet";
}
// @end-legacy-unit 1538

// @legacy-unit 1539 19344
export function renderBuyer() {
  syncProjectControls();
  const rows = buyerRows();
  const cards = [
    { label: "Buyer Accepted Handoff", value: rows.filter((row) => buyerStatusFor(row) === BUYER_RECEIVED).length, helper: `${document.getElementById("buyerProjectFilter")?.value || "All projects"} · OM handoff`, variant: "hero" },
    { label: "Blocked", value: rows.filter((row) => buyerStatusFor(row) === BUYER_BLOCKED).length, helper: "Rows that need buyer follow-up or unblock" },
    { label: "PR Created", value: rows.filter((row) => externalStatusFor(row) === EXT_PR_CREATED).length, helper: "Progress already moved into PR stage" },
    { label: "PO Issued", value: rows.filter((row) => buyerStatusFor(row) === BUYER_PO_ISSUED).length, helper: "PO has been issued to vendor" },
    { label: "Completed", value: rows.filter((row) => buyerStatusFor(row) === BUYER_COMPLETED).length, helper: "Buyer-side package is fully closed" },
    { label: "Missing Evidence", value: rows.filter((row) => externalEvidenceCount(row) === 0).length, helper: "Rows still missing buyer proof or attachment" },
  ];
  const summary = document.getElementById("buyerSummary");
  if (summary) summary.innerHTML = summaryCardsHtml(cards);
  const target = document.getElementById("buyerRows");
  if (!target) return;
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const buyerItemTitle = [row.name, partName(row), row.id, itemDetail(row), row.finalExportTarget ? `${row.finalExportTarget} handoff from OM` : "OM handoff"]
        .filter(Boolean)
        .join(" / ");
      const buyerPackageTitle = [row.finalExportTarget || "-", buyerPackageHelper(row)].filter(Boolean).join(" / ");
      const buyerStatusTitle = [buyerStatusFor(row), buyerStatusHelper(row)].filter(Boolean).join(" / ");
      const buyerProgressTitle = [externalStatusFor(row), buyerExternalStatusHelper(row)].filter(Boolean).join(" / ");
      return `
      <tr>
        <td>${row.id}</td>
        <td>${row.project}</td>
        <td class="cell-identity buyer-item-cell" title="${htmlAttr(buyerItemTitle)}">${omItemCell(row, { stageLabel: "Buyer handoff", extraLines: [row.finalExportTarget ? `${row.finalExportTarget} handoff from OM` : "OM handoff"] })}</td>
        <td>
          <strong>${row.pasMaterialNo || "Waiting PAS Material No"}</strong>
          <input type="text" value="${factoryMaterialNoFor(row)}" placeholder="Factory Material No after PO" data-buyer-field="factoryMaterialNo" data-buyer-id="${row.id}" />
        </td>
        <td class="buyer-package-cell" title="${htmlAttr(buyerPackageTitle)}"><span class="status-pill ${statusClass(row.finalExportTarget || "-")}">${row.finalExportTarget || "-"}</span><div class="reason-text">${buyerPackageHelper(row)}</div></td>
        <td class="buyer-status-cell" title="${htmlAttr(buyerStatusTitle)}"><span class="status-pill ${statusClass(buyerStatusFor(row))}">${buyerStatusFor(row)}</span><div class="reason-text">${buyerStatusHelper(row)}</div></td>
        <td><input type="text" value="${row.externalSystem || ""}" placeholder="External system" data-buyer-field="externalSystem" data-buyer-id="${row.id}" /></td>
        <td><input type="text" value="${row.externalRequestNo || ""}" placeholder="External request no." data-buyer-field="externalRequestNo" data-buyer-id="${row.id}" /></td>
        <td><strong>${row.prNo || "Pending"}</strong><div class="reason-text">OM owns PR / PO tracking for IT items</div></td>
        <td><strong>${row.buyerPoNo || row.poNo || "Pending"}</strong><div class="reason-text">OM owns PR / PO tracking for IT items</div></td>
        <td class="buyer-progress-cell" title="${htmlAttr(buyerProgressTitle)}"><span class="status-pill ${statusClass(externalStatusFor(row))}">${externalStatusFor(row)}</span><div class="reason-text">${buyerExternalStatusHelper(row)}</div></td>
        <td>${externalEvidenceLabel(row)}</td>
        <td><input type="text" value="${row.buyerNote || ""}" placeholder="Buyer note" data-buyer-field="buyerNote" data-buyer-id="${row.id}" /></td>
        <td>${row.buyerReceivedAt ? new Date(row.buyerReceivedAt).toLocaleString("en-US") : row.finalExportedAt ? new Date(row.finalExportedAt).toLocaleString("en-US") : "-"}</td>
        <td>${latestExternalProgressEvent(row) ? new Date(latestExternalProgressEvent(row).createdAt).toLocaleString("en-US") : row.buyerReceivedAt ? new Date(row.buyerReceivedAt).toLocaleString("en-US") : "-"}</td>
        <td><button class="mini approve" data-buyer-progress="${row.id}">Record Progress</button></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="17" class="empty-cell">No OM handoff has been submitted to Buyer yet.</td></tr>`;
}
// @end-legacy-unit 1539

// @legacy-unit 1540 19394
export function updateBuyerField(requestId, field, value) {
  const before = requests.find((row) => row.id === requestId);
  if (!before || before[field] === value) return;
  if (field === "buyerStatus") {
    showToast("Use Record Progress so PR / PO status is saved with evidence.", "error");
    renderBuyer();
    return;
  }
  replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, [field]: value, buyerReceivedAt: row.buyerReceivedAt || new Date().toISOString() } : row));
  const after = requests.find((row) => row.id === requestId);
  addHandoffHistory(after, `Buyer updated ${field}`, value || "blank");
  renderBuyer();
  renderDepartment();
  renderManagerDashboard();
}
// @end-legacy-unit 1540
