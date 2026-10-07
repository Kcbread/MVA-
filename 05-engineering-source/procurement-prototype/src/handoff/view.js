// handoff/view: authoritative source; see docs/module-map.md.
import {
  totalQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  procurementRows,
  readyForCoordinatorOutput
} from "./queue.js";
import {
  handoffHistory
} from "./state.js";
import {
  exportStatus,
  handoffDisplayStatus
} from "./status.js";
import {
  isNewMaterial,
  itemDetail,
  itemDetailButton,
  itemType,
  itemTypeBadge
} from "../materials/display.js";
import {
  itemKeyDisplay,
  materialNoFor,
  partName
} from "../materials/identity.js";
import {
  externalEvidenceCount
} from "../om/external-progress.js";
import {
  currentPhaseLabelForProject
} from "../projects/config.js";
import {
  syncProjectControls
} from "../projects/controls.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";
import {
  MFG_PACKAGE_ROWS
} from "../sourcing/config.js";
import {
  applySuggestedBuyers,
  renderDispatchHistory,
  renderRfqDispatch,
  renderRfqFollowUp,
  rfqPictureSource
} from "../sourcing/rfq.js";
import {
  HANDOFF_READY,
  HANDOFF_SENT_TO_OM
} from "../workflow/status-constants.js";

// @legacy-unit 1500 18785
export function renderHandoffHistory() {
  const rows = handoffHistory;
  document.getElementById("handoffHistoryRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.requestId}</td>
        <td>${row.project}</td>
        <td>${row.item}</td>
        <td>${row.action}</td>
        <td>${row.route}</td>
        <td>${row.exportTarget}</td>
        <td>${row.actor}</td>
        <td>${row.note || "-"}</td>
        <td>${new Date(row.timestamp).toLocaleString("en-US")}</td>
      </tr>`).join("")
    : `<tr><td colspan="9" class="empty-cell">No handoff actions recorded yet.</td></tr>`;
}
// @end-legacy-unit 1500

// @legacy-unit 1501 18803
export function renderHandoffSummary(rows) {
  const allReadyRows = requests.filter((row) => row.status === "Approved" && [HANDOFF_READY, HANDOFF_SENT_TO_OM].includes(row.procurementStatus));
  const coordinatorRows = allReadyRows.filter((row) => row.procurementStatus === HANDOFF_READY);
  const cards = [
    ["Package Rows", coordinatorRows.length],
    ["Selected", coordinatorRows.filter((row) => row.handoffSelected || row.rfqSelected).length],
    ["Material Ready", coordinatorRows.filter((row) => materialNoFor(row)).length],
    ["Ready for Handoff", coordinatorRows.filter(readyForCoordinatorOutput).length],
    ["Missing Evidence", coordinatorRows.filter((row) => externalEvidenceCount(row) === 0).length],
  ];
  document.getElementById("handoffSummary").innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}
// @end-legacy-unit 1501

// @legacy-unit 1502 18820
export function renderMfgCollectionStatus() {
  const summaryTarget = document.getElementById("mfgCollectionSummary");
  const rowsTarget = document.getElementById("mfgCollectionRows");
  if (!summaryTarget || !rowsTarget) return;
  const projectFilter = document.getElementById("handoffProjectFilter")?.value || "";
  const rows = MFG_PACKAGE_ROWS.filter((row) => !projectFilter || row.project === projectFilter);
  const summary = rows.reduce((accumulator, row) => {
    const status = mfgCollectionStatusMeta(row);
    accumulator[status.summaryKey] += 1;
    accumulator.received += row.completed;
    accumulator.missing += Math.max(0, row.required - row.completed);
    return accumulator;
  }, { pending: 0, collecting: 0, completed: 0, received: 0, missing: 0 });
  const packageCount = document.getElementById("mfgPackageCount");
  if (packageCount) packageCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  summaryTarget.innerHTML = `
    <article class="summary-card summary-card-hero">
      <span>Collection Status</span>
      <strong>${rows.length ? `${summary.completed} completed / ${summary.collecting} collecting / ${summary.pending} pending` : "No packages in scope"}</strong>
    </article>
    <article class="summary-card">
      <span>Packages</span>
      <strong>${rows.length}</strong>
    </article>
    <article class="summary-card">
      <span>Received Inputs</span>
      <strong>${summary.received}</strong>
    </article>
    <article class="summary-card">
      <span>Not Submitted</span>
      <strong>${summary.missing}</strong>
    </article>
  `;
  rowsTarget.innerHTML = rows.length ? rows.map((row) => {
    const collectionStatus = mfgCollectionStatusMeta(row);
    const missing = Math.max(0, row.required - row.completed);
    return `
      <tr>
        <td>${row.project}</td>
        <td>${row.phase}</td>
        <td>${row.packageType}<div class="reason-text">${row.excelSheet} format</div></td>
        <td>
          <div class="collection-progress">
            <strong>${row.completed} / ${row.required}</strong>
            <span>${collectionStatus.progressNote}</span>
          </div>
        </td>
        <td>${missing}</td>
        <td><span class="status-pill ${statusClass(collectionStatus.label)}">${collectionStatus.label}</span></td>
        <td><button class="mini" data-mfg-package-detail="${row.id}">Detail</button></td>
      </tr>`;
  }).join("") : `<tr><td colspan="7" class="empty-cell">No MFG collection packages match this project.</td></tr>`;
}
// @end-legacy-unit 1502

// @legacy-unit 1503 18874
export function mfgCollectionStatusMeta(row) {
  const missing = Math.max(0, row.required - row.completed);
  if (missing <= 0) {
    return {
      label: "Completed",
      summaryKey: "completed",
      progressNote: "collection complete",
    };
  }
  if (row.completed > 0) {
    return {
      label: "In Progress",
      summaryKey: "collecting",
      progressNote: "still collecting",
    };
  }
  return {
    label: "Pending",
    summaryKey: "pending",
    progressNote: "waiting for input",
  };
}
// @end-legacy-unit 1503

// @legacy-unit 1504 18897
export function mfgPackageType(row) {
  const text = normalize([row.name, itemDetail(row), row.level2, row.level3].join(" "));
  if (text.includes("consum") || text.includes("耗材") || text.includes("wiper") || text.includes("glove") || text.includes("mask") || text.includes("label") || text.includes("tape")) return "Consumable";
  if (text.includes("office") || text.includes("vpp") || text.includes("stationery") || text.includes("辦公")) return "VPP / Office";
  if (text.includes("fixture") || text.includes("jig") || text.includes("治具")) return "Tool / Fixture";
  return "EQ";
}
// @end-legacy-unit 1504

// @legacy-unit 1505 18905
export function renderProcurement() {
  syncProjectControls();
  applySuggestedBuyers();
  const rows = procurementRows();
  renderMfgCollectionStatus();
  renderHandoffHistory();
  renderRfqDispatch();
  renderRfqFollowUp();
  renderDispatchHistory();
  const handoffSummaryTarget = document.getElementById("handoffSummary");
  if (handoffSummaryTarget) renderHandoffSummary(rows);
  const procurementTarget = document.getElementById("procurementRows");
  if (procurementTarget) {
    procurementTarget.innerHTML = rows.length
      ? rows.map((row) => `
        <tr>
          <td><input type="checkbox" data-handoff-select="${row.id}" ${row.handoffSelected ? "checked" : ""} ${row.procurementStatus === HANDOFF_SENT_TO_OM || !readyForCoordinatorOutput(row) ? "disabled" : ""} /></td>
          <td>${row.project}</td>
          <td>${currentPhaseLabelForProject(row.project)}</td>
          <td>${mfgPackageType(row)}</td>
          <td>${itemKeyDisplay(row)}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div>${isNewMaterial(row) ? `<div>${itemTypeBadge(row)}</div>` : ""}</td>
          <td><div class="clamped-cell">${itemDetail(row)}</div></td>
          <td><span class="rfq-picture-token">${rfqPictureSource(row)}</span></td>
          <td>${totalQty(row)}</td>
          <td><div class="clamped-cell">${row.requesterReason || row.procurementRemark || "Approved demand is ready for MFG collection review."}</div></td>
          <td>${itemType(row)}</td>
          <td><span class="status-pill ${statusClass(exportStatus(row))}">${handoffDisplayStatus(row)}</span></td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`).join("")
      : `<tr><td colspan="13" class="empty-cell">No approved MFG package rows match the selected project.</td></tr>`;
  }
}
// @end-legacy-unit 1505
