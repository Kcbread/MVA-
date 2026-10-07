// cost/actual-buy: authoritative source; see docs/module-map.md.
import {
  demandComparable
} from "./demand-metrics.js";
import {
  effectiveUnitPrice
} from "./pricing.js";
import {
  renderManagerStageTracking
} from "./stage-view.js";
import {
  actualBuyRecords,
  replaceActualBuyRecordsBinding
} from "../data/state.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  itemDetailButton
} from "../materials/display.js";
import {
  factoryMaterialNoFor,
  globalItemIdFor,
  globalItemKey,
  materialIdentityKey,
  materialNoFor,
  partName
} from "../materials/identity.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  omRows
} from "../om/queue.js";
import {
  selectedOmRows
} from "../om/selection.js";
import {
  omSelections
} from "../om/state.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  currentStageForProject
} from "../projects/config.js";
import {
  stageLabel,
  statusClass
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1702 21305
export function exactActualBuyRecord(row, stage = currentStageForProject(row.project)) {
  return actualBuyRecords.find((actual) => actual.stage === stage && demandComparable(row, actual)) || null;
}
// @end-legacy-unit 1702

// @legacy-unit 1703 21309
export function renderActualBuyUpdate(rows) {
  const target = document.getElementById("actualBuyRows");
  if (!target) return;
  renderActualBuySummary(rows);
  target.innerHTML = rows.length
    ? rows.map((row) => {
      const stage = currentStageForProject(row.project);
      const actual = exactActualBuyRecord(row, stage);
      return `
        <tr>
          <td><input type="checkbox" data-om-select="${row.id}" ${omSelections.has(row.id) || row.omSelected ? "checked" : ""} /></td>
          <td>${row.project}</td>
          <td>${stageLabel(stage)}</td>
          <td>${row.id}</td>
          <td>${row.name}<div class="reason-text">${partName(row)}</div></td>
          <td><input type="text" value="${actual?.poNo || ""}" placeholder="PO No." data-actual-field="poNo" data-actual-id="${row.id}" /></td>
          <td>${clampQty(row[stage])}</td>
          <td><input type="number" min="0" step="1" value="${actual?.actualQty ?? ""}" placeholder="Actual buy" data-actual-field="actualQty" data-actual-id="${row.id}" /></td>
          <td><input type="date" value="${actual?.buyDate || ""}" data-actual-field="buyDate" data-actual-id="${row.id}" /></td>
          <td><input type="text" value="${actual?.vendor || row.vendor || ""}" placeholder="Vendor" data-actual-field="vendor" data-actual-id="${row.id}" /></td>
          <td><input type="number" min="0" step="1" value="${actual?.unitPrice || effectiveUnitPrice(row) || ""}" placeholder="Unit price" data-actual-field="unitPrice" data-actual-id="${row.id}" /></td>
          <td><input type="text" value="${actual?.externalRef || row.externalSystemRef || ""}" placeholder="External ref." data-actual-field="externalRef" data-actual-id="${row.id}" /></td>
          <td>${actual?.updateSource || "Manual entry"}</td>
          <td><span class="status-pill ${statusClass(actual?.status || "Pending Update")}">${actual?.status || "Pending Update"}</span></td>
          <td>${itemDetailButton("request", row.id)}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="15" class="empty-cell">No received handoff rows are available for actual buy update.</td></tr>`;
}
// @end-legacy-unit 1703

// @legacy-unit 1704 21339
export function renderActualBuySummary(rows) {
  const target = document.getElementById("actualBuySummary");
  if (!target) return;
  const cards = [
    ["Approved Qty", rows.reduce((sum, row) => sum + clampQty(row[currentStageForProject(row.project)]), 0)],
    ["Actual Buy", rows.reduce((sum, row) => sum + (exactActualBuyRecord(row)?.actualQty ?? 0), 0)],
    ["Pending Update", rows.filter((row) => !exactActualBuyRecord(row)).length],
    ["Completed", rows.filter((row) => exactActualBuyRecord(row)?.status === "Completed").length],
  ];
  target.innerHTML = cards.map(([label, value]) => `
    <article class="summary-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>`).join("");
}
// @end-legacy-unit 1704

// @legacy-unit 1705 21355
export function upsertActualBuyField(requestId, field, value) {
  const request = requests.find((row) => row.id === requestId);
  if (!request) return;
  const stage = currentStageForProject(request.project);
  const existing = exactActualBuyRecord(request, stage);
  const normalized = ["actualQty", "unitPrice"].includes(field) ? clampQty(value) : value;
  if (existing) {
    replaceActualBuyRecordsBinding(actualBuyRecords.map((row) => row.id === existing.id ? { ...row, [field]: normalized, updateSource: "Manual entry" } : row));
  } else {
    replaceActualBuyRecordsBinding([{
      id: `AB-${request.project}-${request.id}-${stage}`,
      project: request.project,
      stage,
      requestId: request.id,
      sourceRecordId: request.sourceRecordId,
      partNo: request.partNo,
      materialNo: materialNoFor(request),
      factoryMaterialNo: factoryMaterialNoFor(request),
      pasMaterialNo: request.pasMaterialNo || "",
      materialIdentityKey: materialIdentityKey(request),
      globalItemKey: globalItemKey(request),
      globalItemId: globalItemIdFor(request),
      name: request.name,
      poNo: field === "poNo" ? normalized : "",
      approvedQty: clampQty(request[stage]),
      actualQty: field === "actualQty" ? normalized : 0,
      buyDate: field === "buyDate" ? normalized : "",
      vendor: field === "vendor" ? normalized : request.vendor,
      unitPrice: field === "unitPrice" ? normalized : effectiveUnitPrice(request),
      externalRef: field === "externalRef" ? normalized : request.externalSystemRef,
      updateSource: "Manual entry",
      status: "Pending Update",
    }, ...actualBuyRecords]);
  }
}
// @end-legacy-unit 1705

// @legacy-unit 1706 21391
export function importActualBuyExcel() {
  const rows = omRows();
  if (!rows.length) {
    showToast("No OM handoff rows are available for actual buy import.", "error");
    return;
  }
  rows.forEach((row, index) => {
    const stage = currentStageForProject(row.project);
    const importedQty = Math.max(0, clampQty(row[stage]) - (index % 3 === 0 ? 1 : 0));
    upsertActualBuyField(row.id, "actualQty", importedQty);
    upsertActualBuyField(row.id, "buyDate", `2026-05-${String(10 + index).padStart(2, "0")}`);
    upsertActualBuyField(row.id, "poNo", `IMP-${row.project}-${String(3000 + index)}`);
    upsertActualBuyField(row.id, "externalRef", `ERP-IMP-${String(7000 + index)}`);
    const actual = exactActualBuyRecord(row, stage);
    if (actual) replaceActualBuyRecordsBinding(actualBuyRecords.map((item) => item.id === actual.id ? { ...item, updateSource: "Imported Excel", status: "Completed" } : item));
    addOmHistory(row, "Imported actual buy Excel", `Actual buy qty: ${importedQty}`);
  });
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Actual buy Excel imported.", "success");
}
// @end-legacy-unit 1706

// @legacy-unit 1707 21414
export function saveActualBuy() {
  omRows().forEach((row) => addOmHistory(row, "Saved actual buy", "Actual buy data saved from OM Purchasing."));
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Actual buy saved.", "success");
}
// @end-legacy-unit 1707

// @legacy-unit 1708 21422
export function markActualBuyCompleted() {
  const rows = selectedOmRows();
  if (!rows.length) {
    showToast("Select at least one OM row before marking actual buy completed.", "error");
    return;
  }
  rows.forEach((row) => {
    const stage = currentStageForProject(row.project);
    upsertActualBuyField(row.id, "actualQty", exactActualBuyRecord(row, stage)?.actualQty ?? clampQty(row[stage]));
    const actual = exactActualBuyRecord(row, stage);
    if (actual) replaceActualBuyRecordsBinding(actualBuyRecords.map((item) => item.id === actual.id ? { ...item, status: "Completed" } : item));
    addOmHistory(row, "Marked actual buy completed", `Stage: ${stageLabel(stage)}`);
  });
  renderOmPurchasing();
  renderDepartment();
  renderManagerStageTracking();
  showToast("Selected actual buy rows marked completed.", "success");
}
// @end-legacy-unit 1708
