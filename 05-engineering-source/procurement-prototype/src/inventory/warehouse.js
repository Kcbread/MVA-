// inventory/warehouse: authoritative source; see docs/module-map.md.
import {
  renderPriceReview
} from "../approval/price-review.js";
import {
  priceReviewQueueRows
} from "../approval/queues.js";
import {
  selectedPriceReviewRequestId
} from "../approval/state.js";
import {
  preserveApprovalViewport,
  restoreApprovalViewport
} from "../approval/viewport.js";
import {
  sourcePhaseForHistory
} from "../catalog/history-view.js";
import {
  monthKeyFromDate
} from "../cost/currency.js";
import {
  renderManagerDemandCostDashboard
} from "../cost/dashboard-view.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  canonicalDemandUnit,
  clampQty,
  demandTypeFor,
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  needDateForRow
} from "../demand/request-fields.js";
import {
  currentDeptDemandPhase,
  requests
} from "../demand/state.js";
import {
  currentWarehouseMonth,
  replaceCurrentWarehouseMonthBinding,
  replaceWarehouseStockRecordsBinding,
  warehouseLockdownRecords,
  warehouseStockRecords
} from "./state.js";
import {
  itemDetail,
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  isOmOwnedItem,
  itemOwnerFor
} from "../om/ownership.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_UNIT_FALLBACK,
  DEMAND_UNIT_OPTIONS,
  ITEM_OWNER_MFG,
  ITEM_OWNER_OM,
  ITEM_OWNER_UNIT,
  STAGE_LABELS,
  currentStageForProject
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  requesterDisplayName
} from "../session/persona.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactTimestamp
} from "../shared/dates.js";
import {
  normalize
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  currentView
} from "../shell/state.js";

// @legacy-unit 933 10146
export function warehouseRecordKey(item, spec) {
  return `${normalize(item)}|||${normalize(spec)}`;
}
// @end-legacy-unit 933

// @legacy-unit 934 10150
export function warehouseSummaryKey(row = {}) {
  return `${row.month || currentWarehouseMonth}|||${warehouseRecordKey(row.item || "", row.spec || "")}`;
}
// @end-legacy-unit 934

// @legacy-unit 935 10154
export function warehouseSummaryId(row = {}) {
  return encodeURIComponent(JSON.stringify([row.month || currentWarehouseMonth, row.item || "", row.spec || ""]));
}
// @end-legacy-unit 935

// @legacy-unit 936 10158
export function warehouseSummaryFromId(summaryId = "") {
  try {
    const [month, item, spec] = JSON.parse(decodeURIComponent(summaryId));
    return warehouseInventoryRows(month).find((row) => row.item === item && row.spec === spec) || null;
  } catch (_error) {
    return null;
  }
}
// @end-legacy-unit 936

// @legacy-unit 937 10167
export function warehouseLockForRow(row = {}) {
  const key = warehouseSummaryKey(row);
  return warehouseLockdownRecords.find((record) => record.key === key) || null;
}
// @end-legacy-unit 937

// @legacy-unit 938 10172
export function warehouseOwnerForTransaction(row = {}) {
  if (row.itemOwner) return row.itemOwner;
  if (isOmOwnedItem(row)) return ITEM_OWNER_OM;
  const targetUnit = row.targetStationOrUnit || row.demandUnit || row.department || "";
  if (targetUnit && DEMAND_UNIT_OPTIONS.includes(canonicalDemandUnit(targetUnit))) return ITEM_OWNER_UNIT;
  return ITEM_OWNER_MFG;
}
// @end-legacy-unit 938

// @legacy-unit 939 10180
export function warehouseOwnerLabel(row = {}) {
  const owner = warehouseOwnerForTransaction(row);
  if (owner === ITEM_OWNER_OM) return "OM warehouse";
  if (owner === ITEM_OWNER_UNIT) return "Unit warehouse";
  if (owner === ITEM_OWNER_MFG) return "MFG warehouse";
  return "Owner pending";
}
// @end-legacy-unit 939

// @legacy-unit 940 10188
export function warehousePendingStatusForOwner(owner) {
  if (owner === ITEM_OWNER_OM) return "Pending OM";
  if (owner === ITEM_OWNER_UNIT) return "Pending Unit Owner";
  if (owner === ITEM_OWNER_MFG) return "Pending MFG Owner";
  return "Pending Owner";
}
// @end-legacy-unit 940

// @legacy-unit 941 10195
export function canLockWarehouseSummary(row = {}) {
  const owner = warehouseOwnerForTransaction(row);
  if (owner === ITEM_OWNER_OM) return ["om", "omLeader", "omMember", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_MFG) return ["procurement", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_UNIT) return ["dri", "deptDri", "admin"].includes(currentRole);
  return ["admin"].includes(currentRole);
}
// @end-legacy-unit 941

// @legacy-unit 942 10203
export function warehousePossibleUseText(row = {}) {
  const sources = row.sources || [];
  if (!sources.length) return "No active demand source";
  const compactSources = sources.slice(0, 2).map((source) => `${source.sourceProject} / ${source.sourceStage} / ${source.sourceStation}: ${source.qty}`);
  const extra = sources.length > 2 ? ` +${sources.length - 2} more` : "";
  return `${compactSources.join("; ")}${extra}`;
}
// @end-legacy-unit 942

// @legacy-unit 943 10211
export function warehouseTransactionType(row = {}) {
  return row.transactionType || (clampQty(row.ownedQty || row.qty) ? "stock-in" : "stock-in");
}
// @end-legacy-unit 943

// @legacy-unit 944 10215
export function warehouseTransactionQty(row = {}) {
  return clampQty(row.qty ?? row.ownedQty);
}
// @end-legacy-unit 944

// @legacy-unit 945 10219
export function warehouseTransactionStatus(row = {}) {
  return row.status || (warehouseTransactionType(row) === "stock-in" ? "Available" : warehousePendingStatusForOwner(warehouseOwnerForTransaction(row)));
}
// @end-legacy-unit 945

// @legacy-unit 946 10223
export function isWarehouseStockIn(row = {}) {
  return warehouseTransactionType(row) === "stock-in";
}
// @end-legacy-unit 946

// @legacy-unit 947 10227
export function isWarehouseUseTransaction(row = {}) {
  return ["use-candidate", "locked-use"].includes(warehouseTransactionType(row));
}
// @end-legacy-unit 947

// @legacy-unit 948 10231
export function isWarehouseLockedUse(row = {}) {
  const status = warehouseTransactionStatus(row);
  return warehouseTransactionType(row) === "locked-use" || status === "Locked Use" || status === "Locked" || status === "Approved";
}
// @end-legacy-unit 948

// @legacy-unit 949 10236
export function isWarehousePendingUse(row = {}) {
  return isWarehouseUseTransaction(row) && !isWarehouseLockedUse(row) && warehouseTransactionStatus(row) !== "Rejected";
}
// @end-legacy-unit 949

// @legacy-unit 950 10240
export function warehouseSourceLabel(row = {}) {
  return [row.sourceProject, row.sourceLine, row.sourceStage, row.sourceStation || row.sourceStationOrUnit]
    .filter(Boolean)
    .join(" / ") || "-";
}
// @end-legacy-unit 950

// @legacy-unit 951 10246
export function warehouseTargetLabel(row = {}) {
  return [row.targetProject, row.targetLine, row.targetStage, row.targetStation || row.targetStationOrUnit]
    .filter(Boolean)
    .join(" / ") || "-";
}
// @end-legacy-unit 951

// @legacy-unit 952 10252
export function warehouseTransactionTrace(row = {}) {
  const parts = [
    `Source: ${warehouseSourceLabel(row)}`,
    row.sourceRequestId ? `Source Request: ${row.sourceRequestId}` : "",
    warehouseTargetLabel(row) !== "-" ? `Target: ${warehouseTargetLabel(row)}` : "",
    row.targetRequestId ? `Target Request: ${row.targetRequestId}` : "",
    row.reason || "",
  ].filter(Boolean);
  return parts.join("\n");
}
// @end-legacy-unit 952

// @legacy-unit 953 10263
export function warehouseMonthForDemand(row) {
  return monthKeyFromDate(needDateForRow(row) || row.submittedAt || row.createdAt) || currentWarehouseMonth;
}
// @end-legacy-unit 953

// @legacy-unit 954 10267
export function warehouseDemandSources(month = currentWarehouseMonth) {
  return requests.flatMap((row) => {
    if (warehouseMonthForDemand(row) !== month) return [];
    return stationBreakdownRowsForDetail(row)
      .map((breakdown) => {
        const qty = stationBreakdownRowTotal(breakdown);
        if (!qty) return null;
        const phase = stationBreakdownPhaseKey(breakdown) || currentStageForProject(row.project);
        return {
          item: row.name,
          spec: userVisibleItemDetail(row) || itemDetail(row) || "-",
          qty,
          sourceProject: row.project,
          sourceStage: STAGE_LABELS[phase] || phase,
          sourceStation: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? (breakdown.station || "-") : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
          sourceRequestId: row.id,
        };
      })
      .filter(Boolean);
  });
}
// @end-legacy-unit 954

// @legacy-unit 955 10289
export function warehouseSummaryRows(month = currentWarehouseMonth) {
  const groups = new Map();
  warehouseDemandSources(month).forEach((source) => {
    const key = warehouseRecordKey(source.item, source.spec);
    const existing = groups.get(key) || { month, item: source.item, spec: source.spec, demandQty: 0, ownedQty: 0, sources: [], stockSources: [] };
    existing.demandQty += source.qty;
    existing.sources.push(source);
    groups.set(key, existing);
  });
  warehouseStockRecords.filter((record) => record.month === month).forEach((record) => {
    const key = warehouseRecordKey(record.item, record.spec);
    const existing = groups.get(key) || { month, item: record.item, spec: record.spec, demandQty: 0, ownedQty: 0, sources: [], stockSources: [] };
    existing.ownedQty += clampQty(record.ownedQty);
    existing.stockSources.push(record);
    groups.set(key, existing);
  });
  return [...groups.values()].map((row) => ({
    ...row,
    deltaQty: row.demandQty - row.ownedQty,
  })).sort((left, right) => {
    if ((left.deltaQty <= 0) !== (right.deltaQty <= 0)) return left.deltaQty <= 0 ? -1 : 1;
    return left.item.localeCompare(right.item);
  });
}
// @end-legacy-unit 955

// @legacy-unit 956 10314
export function warehouseInventoryRows(month = currentWarehouseMonth) {
  const groups = new Map();
  warehouseStockRecords.filter((record) => record.month === month).forEach((record) => {
    const key = warehouseRecordKey(record.item, record.spec);
    const existing = groups.get(key) || {
      month,
      item: record.item,
      spec: record.spec,
      itemOwner: record.itemOwner || itemOwnerFor(record),
      onHandQty: 0,
      reservedQty: 0,
      pendingQty: 0,
      stockSources: [],
      useTransactions: [],
    };
    const qty = warehouseTransactionQty(record);
    if (isWarehouseStockIn(record)) {
      existing.onHandQty += qty;
      existing.stockSources.push(record);
    } else if (isWarehouseUseTransaction(record)) {
      if (isWarehouseLockedUse(record)) existing.reservedQty += qty;
      else if (isWarehousePendingUse(record)) existing.pendingQty += qty;
      existing.useTransactions.push(record);
    }
    groups.set(key, existing);
  });
  return [...groups.values()].map((row) => {
    const availableQty = Math.max(0, row.onHandQty - row.reservedQty);
    const topSource = row.stockSources[0] || null;
    const pendingTarget = row.useTransactions.find(isWarehousePendingUse) || null;
    const lockedTarget = row.useTransactions.find(isWarehouseLockedUse) || null;
    return {
      ...row,
      itemOwner: row.itemOwner || itemOwnerFor(row),
      availableQty,
      topSource,
      potentialTarget: pendingTarget || lockedTarget || null,
      status: row.pendingQty > 0
        ? warehousePendingStatusForOwner(row.itemOwner || itemOwnerFor(row))
        : availableQty > 0
          ? "Available"
          : row.reservedQty > 0
            ? "Locked / Used"
            : "No stock",
    };
  }).sort((left, right) => {
    if ((left.pendingQty > 0) !== (right.pendingQty > 0)) return left.pendingQty > 0 ? -1 : 1;
    if (right.availableQty !== left.availableQty) return right.availableQty - left.availableQty;
    return left.item.localeCompare(right.item);
  });
}
// @end-legacy-unit 956

// @legacy-unit 957 10366
export function warehouseInventoryId(row = {}) {
  return encodeURIComponent(JSON.stringify([row.month || currentWarehouseMonth, row.item || "", row.spec || ""]));
}
// @end-legacy-unit 957

// @legacy-unit 958 10370
export function warehouseInventoryFromId(summaryId = "") {
  return warehouseSummaryFromId(summaryId);
}
// @end-legacy-unit 958

// @legacy-unit 959 10374
export function warehouseInventoryLedger(month = currentWarehouseMonth, filters = {}) {
  const query = normalize(filters.query || "");
  return warehouseStockRecords
    .filter((record) => record.month === month)
    .filter((record) => !query || normalize(`${record.item} ${record.spec} ${warehouseSourceLabel(record)} ${warehouseTargetLabel(record)} ${record.reason || ""}`).includes(query))
    .sort((left, right) => String(right.createdAt || right.confirmedAt || "").localeCompare(String(left.createdAt || left.confirmedAt || "")));
}
// @end-legacy-unit 959

// @legacy-unit 960 10382
export function warehouseStockSelectableRows() {
  const seen = new Map();
  purchaseRecords
    .filter((record) => record.name && itemDetail(record))
    .forEach((record) => {
      const key = warehouseRecordKey(record.name, userVisibleItemDetail(record) || itemDetail(record));
      if (seen.has(key)) return;
      seen.set(key, record);
    });
  return [...seen.values()].sort((left, right) => {
    const leftText = `${left.name} ${left.project || ""}`;
    const rightText = `${right.name} ${right.project || ""}`;
    return leftText.localeCompare(rightText);
  });
}
// @end-legacy-unit 960

// @legacy-unit 961 10398
export function warehouseStockSelectOptionValue(record = {}) {
  return record.id || warehouseRecordKey(record.name, userVisibleItemDetail(record) || itemDetail(record));
}
// @end-legacy-unit 961

// @legacy-unit 962 10402
export function warehouseSelectedStockRecord() {
  const selectedId = document.getElementById("warehouseStockItem")?.value || "";
  if (!selectedId) return null;
  return warehouseStockSelectableRows().find((record) => warehouseStockSelectOptionValue(record) === selectedId) || null;
}
// @end-legacy-unit 962

// @legacy-unit 963 10408
export function syncWarehouseStockSelection() {
  const record = warehouseSelectedStockRecord();
  const specInput = document.getElementById("warehouseStockSpec");
  const sourceProjectInput = document.getElementById("warehouseStockSourceProject");
  const sourceStageInput = document.getElementById("warehouseStockSourceStage");
  if (specInput) specInput.value = record ? userVisibleItemDetail(record) || itemDetail(record) || "" : "";
  if (record && sourceProjectInput && !sourceProjectInput.value) sourceProjectInput.value = record.project || currentProject;
  if (record && sourceStageInput && !sourceStageInput.value) sourceStageInput.value = sourcePhaseForHistory(record) || currentDeptDemandPhase;
}
// @end-legacy-unit 963

// @legacy-unit 964 10418
export function renderWarehouseStockItemOptions() {
  const select = document.getElementById("warehouseStockItem");
  if (!select) return;
  const previous = select.value;
  const options = warehouseStockSelectableRows();
  select.innerHTML = [
    `<option value="">Select purchased item</option>`,
    ...options.map((record) => {
      const value = warehouseStockSelectOptionValue(record);
      const spec = userVisibleItemDetail(record) || itemDetail(record) || "";
      const label = `${record.name} · ${record.project || "History"}`;
      return `<option value="${htmlAttr(value)}" title="${htmlAttr(spec)}">${htmlText(label)}</option>`;
    }),
  ].join("");
  select.value = options.some((record) => warehouseStockSelectOptionValue(record) === previous) ? previous : "";
  syncWarehouseStockSelection();
}
// @end-legacy-unit 964

// @legacy-unit 965 10436
export function warehouseTraceText(row) {
  const stockTrace = (row.stockSources || []).map((source) => `${warehouseSourceLabel(source)} / ${source.sourceRequestId || "-"} / ${warehouseTransactionQty(source)} stock in`);
  const useTrace = (row.useTransactions || []).map((source) => `${warehouseSourceLabel(source)} → ${warehouseTargetLabel(source)} / ${warehouseTransactionQty(source)} ${warehouseTransactionStatus(source)}`);
  const demandTrace = (row.sources || []).map((source) => `${source.sourceProject} / ${source.sourceStage} / ${source.sourceStation} / ${source.sourceRequestId} / ${source.qty} demand`);
  return [...stockTrace, ...useTrace, ...demandTrace].join("\n") || "No source trace";
}
// @end-legacy-unit 965

// @legacy-unit 966 10443
export function renderWarehouseMaintenance() {
  const monthInput = document.getElementById("warehouseMonthFilter");
  const searchInput = document.getElementById("warehouseSearch");
  const scope = document.getElementById("warehouseMaintenanceScope");
  const summary = document.getElementById("warehouseMaintenanceSummary");
  const body = document.getElementById("warehouseMaintenanceRows");
  if (!body) return;
  renderWarehouseStockItemOptions();
  if (monthInput && !monthInput.value) monthInput.value = currentWarehouseMonth;
  const month = monthInput?.value || currentWarehouseMonth;
  replaceCurrentWarehouseMonthBinding(month);
  const query = normalize(searchInput?.value || "");
  const rows = warehouseInventoryRows(month).filter((row) => !query || normalize(`${row.item} ${row.spec} ${warehouseTraceText(row)} ${warehouseSourceLabel(row.topSource)} ${warehouseTargetLabel(row.potentialTarget)}`).includes(query));
  const ledgerRows = warehouseInventoryLedger(month, { query });
  const pending = rows.filter((row) => row.pendingQty > 0).length;
  const availableRows = rows.filter((row) => row.availableQty > 0);
  const crossProjectCandidates = ledgerRows.filter((row) => isWarehouseUseTransaction(row) && row.sourceProject && row.targetProject && row.sourceProject !== row.targetProject).length;
  const topStock = availableRows.slice().sort((left, right) => right.availableQty - left.availableQty)[0];
  if (scope) scope.textContent = `${month} · ${rows.length} item/spec`;
  if (summary) {
    summary.innerHTML = summaryCardsHtml([
      { label: "Available Stock Items", value: availableRows.length, helper: "Item/spec with available qty" },
      { label: "Total Available Qty", value: rows.reduce((sum, row) => sum + row.availableQty, 0), helper: "On hand minus locked use" },
      { label: "Pending Owner Review", value: pending, helper: "Use candidates waiting owner lock", variant: pending ? "warning" : "" },
      { label: "Top Stock Item", value: topStock ? topStock.availableQty : "-", helper: topStock ? topStock.item : "No available stock" },
      { label: "Cross-Project Candidates", value: crossProjectCandidates, helper: "Source project differs from target", variant: crossProjectCandidates ? "info" : "" },
    ]);
  }
  body.innerHTML = rows.length ? rows.map((row) => {
    const summaryId = warehouseInventoryId(row);
    const pendingCandidate = row.useTransactions.find(isWarehousePendingUse);
    const topSource = row.topSource ? `${warehouseSourceLabel(row.topSource)} / +${warehouseTransactionQty(row.topSource)}` : "-";
    const potentialTarget = row.potentialTarget ? `${warehouseTargetLabel(row.potentialTarget)} / ${warehouseTransactionQty(row.potentialTarget)} qty` : "-";
    return `
      <tr>
        <td><div class="item-primary">${htmlText(row.item)}</div><div class="reason-text dense-cell-clamp" title="${htmlAttr(row.spec)}">${htmlText(row.spec)}</div></td>
        <td class="cell-number">${row.onHandQty}</td>
        <td class="cell-number">${row.reservedQty}</td>
        <td class="cell-number">${row.availableQty}</td>
        <td><div class="reason-text" title="${htmlAttr(row.topSource ? warehouseTransactionTrace(row.topSource) : "")}">${htmlText(topSource)}</div></td>
        <td><div class="reason-text" title="${htmlAttr(row.potentialTarget ? warehouseTransactionTrace(row.potentialTarget) : "")}">${htmlText(potentialTarget)}</div></td>
        <td>
          <span class="status-pill ${row.pendingQty > 0 ? "warning" : row.availableQty > 0 ? "approved" : "pending"}">${row.status}</span>
          ${row.pendingQty > 0 ? `<div class="reason-text">${row.pendingQty} qty waiting review</div>` : ""}
        </td>
        <td class="cell-action">
          <div class="action-stack">
            ${pendingCandidate && canLockWarehouseSummary(pendingCandidate) ? `<button class="mini approve" data-warehouse-candidate-lock="${htmlAttr(pendingCandidate.id)}" title="${htmlAttr(`${warehouseOwnerLabel(pendingCandidate)} locks this stock-use candidate`)}">Lock</button><button class="mini reject" data-warehouse-candidate-reject="${htmlAttr(pendingCandidate.id)}" title="Reject this stock-use candidate">Reject</button>` : ""}
            ${row.availableQty > 0 ? `<button class="mini approve" data-action="openItemPicker" title="Open Request Worksheet to create an inventory use candidate">Candidate</button>` : ""}
          </div>
        </td>
        <td class="cell-action">
          <div class="action-stack">
            ${itemDetailButton("warehouse", summaryId)}
          </div>
        </td>
      </tr>`;
  }).join("") : `<tr><td colspan="9" class="empty-cell">No warehouse inventory rows for this month.</td></tr>`;
  const ledgerBody = document.getElementById("warehouseInventoryLedgerRows");
  if (ledgerBody) {
    ledgerBody.innerHTML = ledgerRows.length ? ledgerRows.map((row) => {
      const isPending = isWarehousePendingUse(row);
      return `
        <tr>
          <td><span class="status-pill ${isWarehouseStockIn(row) ? "approved" : isPending ? "warning" : warehouseTransactionStatus(row) === "Rejected" ? "rejected" : "info"}">${warehouseTransactionType(row) === "stock-in" ? "Stock In" : isWarehouseLockedUse(row) ? "Locked Use" : warehouseTransactionStatus(row) === "Rejected" ? "Rejected" : "Use Candidate"}</span></td>
          <td><div class="reason-text" title="${htmlAttr(warehouseSourceLabel(row))}">${htmlText(warehouseSourceLabel(row))}</div></td>
          <td><div class="reason-text" title="${htmlAttr(warehouseTargetLabel(row))}">${htmlText(warehouseTargetLabel(row))}</div></td>
          <td><div class="item-primary">${htmlText(row.item)}</div><div class="reason-text dense-cell-clamp" title="${htmlAttr(row.spec)}">${htmlText(row.spec)}</div></td>
          <td class="cell-number">${warehouseTransactionQty(row)}</td>
          <td><span class="status-pill ${isPending ? "warning" : warehouseTransactionStatus(row) === "Rejected" ? "rejected" : "approved"}">${warehouseTransactionStatus(row)}</span></td>
          <td><div class="reason-text">${htmlText(row.confirmedBy || row.createdBy || "-")}</div></td>
          <td><div class="reason-text">${compactTimestamp(row.confirmedAt || row.createdAt || row.updatedAt)}</div></td>
          <td><div class="reason-text" title="${htmlAttr(row.reason || "")}">${htmlText(row.reason || "-")}</div></td>
          <td class="cell-action">
            <div class="action-stack">
              ${isPending && canLockWarehouseSummary(row) ? `<button class="mini approve" data-warehouse-candidate-lock="${htmlAttr(row.id)}">Lock</button><button class="mini reject" data-warehouse-candidate-reject="${htmlAttr(row.id)}">Reject</button>` : ""}
            </div>
          </td>
        </tr>`;
    }).join("") : `<tr><td colspan="10" class="empty-cell">No inventory transactions for this month.</td></tr>`;
  }
}
// @end-legacy-unit 966

// @legacy-unit 967 10526
export function canMaintainWarehouseStockForRecord(record = {}) {
  const owner = itemOwnerFor(record);
  if (owner === ITEM_OWNER_OM) return ["om", "omLeader", "omMember", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_MFG) return ["procurement", "admin"].includes(currentRole);
  if (owner === ITEM_OWNER_UNIT) return ["dri", "deptDri", "admin"].includes(currentRole);
  return ["admin"].includes(currentRole);
}
// @end-legacy-unit 967

// @legacy-unit 968 10534
export function addWarehouseStockRecord() {
  const month = document.getElementById("warehouseMonthFilter")?.value || currentWarehouseMonth;
  const specInput = document.getElementById("warehouseStockSpec");
  const qtyInput = document.getElementById("warehouseStockQty");
  const sourceProjectInput = document.getElementById("warehouseStockSourceProject");
  const sourceStageInput = document.getElementById("warehouseStockSourceStage");
  const sourceStationInput = document.getElementById("warehouseStockSourceStation");
  const selectedRecord = warehouseSelectedStockRecord();
  if (!canMaintainWarehouseStockForRecord(selectedRecord || {})) {
    showToast("Only the item owner can maintain this warehouse stock.", "error");
    return;
  }
  const item = selectedRecord?.name || "";
  const spec = userVisibleItemDetail(selectedRecord || {}) || itemDetail(selectedRecord || {}) || specInput?.value?.trim() || "";
  const qty = qtyInput?.value || "";
  const sourceProject = sourceProjectInput?.value?.trim() || "";
  const sourceStage = sourceStageInput?.value || "";
  const sourceStation = sourceStationInput?.value?.trim() || "";
  if (!item || !spec || !clampQty(qty)) {
    showToast("Select a purchased item and enter stock qty.", "error");
    return;
  }
  replaceWarehouseStockRecordsBinding([{
    id: `WH-STOCK-${Date.now()}`,
    transactionType: "stock-in",
    status: "Available",
    month,
    item,
    spec,
    itemOwner: itemOwnerFor(selectedRecord || { name: item, spec }),
    qty: clampQty(qty),
    ownedQty: clampQty(qty),
    sourceProject: sourceProject || currentProject,
    sourceLine: requestCarryoverLine() || "Line 1",
    sourceStage: sourceStage || STAGE_LABELS[currentDeptDemandPhase] || currentDeptDemandPhase,
    sourceStation: sourceStation || "WH",
    sourceRequestId: selectedRecord?.id || "Manual warehouse update",
    sourceRecordId: selectedRecord?.id || "",
    createdBy: roleProfiles[currentRole]?.name || requesterDisplayName(),
    createdAt: new Date().toISOString(),
    reason: `${warehouseOwnerLabel({ item, spec, itemOwner: itemOwnerFor(selectedRecord || { name: item, spec }) })} stock-in update.`,
  }, ...warehouseStockRecords]);
  const itemSelect = document.getElementById("warehouseStockItem");
  if (itemSelect) itemSelect.value = "";
  if (specInput) specInput.value = "";
  if (qtyInput) qtyInput.value = "";
  if (sourceProjectInput && !sourceProjectInput.value) sourceProjectInput.value = currentProject;
  if (sourceStationInput) sourceStationInput.value = "CG";
  renderWarehouseMaintenance();
  showToast("Warehouse stock record added.", "success");
}
// @end-legacy-unit 968

// @legacy-unit 969 10586
export function updateCarryoverLedgerStatusById(ledgerId, status, reason = "") {
  if (!ledgerId || !window.ProcurementCarryover?.readLedger || !window.ProcurementCarryover?.writeLedger) return;
  const rows = window.ProcurementCarryover.readLedger();
  const updated = rows.map((row) => {
    if (row.id !== ledgerId) return row;
    const carryoverQty = clampQty(row.carryoverQty);
    const originalQty = clampQty(row.originalQty);
    return {
      ...row,
      status,
      reviewStatus: status === "Applied" ? "Approved" : status,
      effectiveQty: status === "Applied" ? Math.max(0, originalQty - carryoverQty) : originalQty,
      confirmedBy: roleProfiles[currentRole]?.name || "Dept DRI",
      confirmedAt: new Date().toISOString(),
      reason: reason || row.reason,
      rejectReason: status === "Rejected" ? (reason || row.rejectReason || "") : row.rejectReason || "",
    };
  });
  window.ProcurementCarryover.writeLedger(updated);
}
// @end-legacy-unit 969

// @legacy-unit 970 10607
export function updateWarehouseCandidateStatus(transactionId, decision) {
  const row = warehouseStockRecords.find((record) => record.id === transactionId);
  if (!row || !isWarehousePendingUse(row)) {
    showToast("Warehouse use candidate was not found.", "error");
    return;
  }
  if (currentView === "priceReview") {
    preserveApprovalViewport("priceReview", {
      actedRowId: transactionId,
      rowIds: priceReviewQueueRows().map((item) => item.id),
      selectedRowId: selectedPriceReviewRequestId,
      containerSelector: '#priceReviewPendingWorkspace [data-approval-shell="priceReview"]',
    });
  }
  if (!canLockWarehouseSummary(row)) {
    showToast(`Only ${warehouseOwnerLabel(row)} owner can lock or reject this warehouse usage.`, "error");
    return;
  }
  const status = decision === "reject" ? "Rejected" : "Locked Use";
  const transactionType = decision === "reject" ? "use-candidate" : "locked-use";
  const confirmedAt = new Date().toISOString();
  const confirmedBy = roleProfiles[currentRole]?.name || warehouseOwnerLabel(row);
  replaceWarehouseStockRecordsBinding(warehouseStockRecords.map((record) => record.id === transactionId ? {
    ...record,
    transactionType,
    status,
    confirmedAt,
    confirmedBy,
    reason: decision === "reject" ? `${record.reason || ""} Dept DRI rejected stock usage.`.trim() : record.reason,
  } : record));
  updateCarryoverLedgerStatusById(row.carryoverLedgerId, decision === "reject" ? "Rejected" : "Applied", decision === "reject" ? `${warehouseOwnerLabel(row)} rejected warehouse inventory use.` : "");
  renderWarehouseMaintenance();
  renderPriceReview();
  restoreApprovalViewport("priceReview");
  if (typeof renderManagerDemandCostDashboard === "function") renderManagerDemandCostDashboard();
  showToast(decision === "reject" ? "Warehouse use candidate rejected." : "Warehouse use candidate locked.", "success");
}
// @end-legacy-unit 970

// @legacy-unit 971 10645
export function lockWarehouseSummary(summaryId) {
  const row = warehouseInventoryFromId(summaryId);
  const candidate = row?.useTransactions?.find(isWarehousePendingUse);
  if (candidate) updateWarehouseCandidateStatus(candidate.id, "lock");
}
// @end-legacy-unit 971

// @legacy-unit 972 10651
export function carryoverLedgerIdFor(sourceRequestId = "", sourceBreakdownId = "") {
  const sanitize = (value) => String(value || "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `CO-UA-${sanitize(sourceRequestId)}-${sanitize(sourceBreakdownId)}`;
}
// @end-legacy-unit 972

// @legacy-unit 973 10656
export function createWarehouseUseCandidate(suggestion, row, breakdown) {
  if (!suggestion || suggestion.sourceType !== "warehouse" || !row || !breakdown) return;
  const month = warehouseMonthForDemand(row);
  const id = `WH-USE-${row.id}-${breakdown.id}`.replace(/[^A-Za-z0-9_-]+/g, "-");
  const transaction = {
    id,
    transactionType: "use-candidate",
    status: warehousePendingStatusForOwner(itemOwnerFor(row)),
    month,
    item: row.name || suggestion.itemName || "",
    spec: userVisibleItemDetail(row) || itemDetail(row) || suggestion.itemSpec || "",
    itemOwner: itemOwnerFor(row),
    qty: clampQty(suggestion.suggestedQty),
    sourceProject: suggestion.sourceProject || "",
    sourceLine: suggestion.carryoverFrom || "Warehouse",
    sourceStage: suggestion.sourceStage || "",
    sourceStation: suggestion.sourceStation || "",
    sourceRequestId: suggestion.sourceRequestId || "",
    targetProject: row.project || "",
    targetLine: suggestion.requestLine || breakdown.requestLine || "",
    targetStage: STAGE_LABELS[stationBreakdownPhaseKey(breakdown)] || stationBreakdownPhaseKey(breakdown) || "",
    targetStationOrUnit: demandTypeFor(breakdown) === DEMAND_TYPE_MFG ? (breakdown.station || "-") : (breakdown.demandUnit || DEMAND_UNIT_FALLBACK),
    targetRequestId: row.id,
    carryoverLedgerId: carryoverLedgerIdFor(row.id, breakdown.id),
    createdBy: requesterDisplayName(),
    createdAt: new Date().toISOString(),
    reason: suggestion.reason || "Requester created warehouse inventory use candidate.",
  };
  replaceWarehouseStockRecordsBinding([transaction, ...warehouseStockRecords.filter((record) => record.id !== id)]);
  renderWarehouseMaintenance();
}
// @end-legacy-unit 973
