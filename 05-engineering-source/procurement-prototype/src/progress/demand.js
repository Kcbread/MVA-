// progress/demand: authoritative source; see docs/module-map.md.
import {
  formatCurrencyFromVnd
} from "../cost/currency.js";
import {
  renderManagerStageTracking
} from "../cost/stage-view.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  clampQty,
  totalQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  workflowStatusModule
} from "../infrastructure/module-adapters.js";
import {
  OM_INTERNAL_SLA_DAYS
} from "../om/progress-data.js";
import {
  QUOTE_EXPIRING_SOON_DAYS,
  STAGES,
  projectCodeForRow,
  yearProjectForRow
} from "../projects/config.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  compactList,
  formatProgressDate
} from "../shared/detail-view.js";
import {
  normalize,
  stableHash
} from "../shared/format.js";
import {
  workflowStatusForGroup,
  workflowStatusForRow
} from "../workflow/status-view.js";

// @legacy-unit 1261 15430
export function managerProgressRawRows() {
  const sourceRows = purchaseRecords.filter((row) => row.sourceSheet === "G Project MVA EQ Request" && clampQty(row.qty || totalQty(row)) > 0);
  const liveRows = requests.filter((row) => ["Submitted", "Approved", "In Progress"].includes(row.status) && totalQty(row) > 0);
  return [...sourceRows, ...liveRows];
}
// @end-legacy-unit 1261

// @legacy-unit 1262 15436
export function managerProgressYearProject(row) {
  return yearProjectForRow(row);
}
// @end-legacy-unit 1262

// @legacy-unit 1263 15440
export function managerProgressProject(row) {
  return projectCodeForRow(row) || row.project || "-";
}
// @end-legacy-unit 1263

// @legacy-unit 1264 15444
export function managerProgressStage(row) {
  return row.stage || STAGES.find((stage) => clampQty(row[stage]) > 0) || "-";
}
// @end-legacy-unit 1264

// @legacy-unit 1265 15448
export function managerProgressQty(row) {
  return clampQty(row.qty || totalQty(row));
}
// @end-legacy-unit 1265

// @legacy-unit 1266 15452
export function managerProgressDoneQty(row, qtyField, statusField) {
  const explicitQty = clampQty(row[qtyField]);
  if (explicitQty) return Math.min(explicitQty, managerProgressQty(row));
  const status = normalize(row[statusField]);
  return status === "done" || status === "completed" ? managerProgressQty(row) : 0;
}
// @end-legacy-unit 1266

// @legacy-unit 1267 15459
export function managerProgressArrivedQty(row) {
  const explicitQty = clampQty(row.qtyReceived || row.qtyRecieved);
  if (explicitQty) return Math.min(explicitQty, managerProgressQty(row));
  const arrival = normalize(row.dtaActual || row.actualEta);
  if (!arrival || arrival === "pending" || arrival.includes("pending")) return 0;
  return managerProgressQty(row);
}
// @end-legacy-unit 1267

// @legacy-unit 1268 15467
export function managerProgressPendingReason(row) {
  const candidates = [
    row.pendingReason,
    row.deliveryPendingReason,
    row.pendingDeliveryReason,
    row.procurementRemark,
  ].filter(Boolean);
  const reason = candidates.find((value) => !["late", "on time", "#n/a"].includes(normalize(value)));
  if (reason) return reason;
  return "";
}
// @end-legacy-unit 1268

// @legacy-unit 1269 15479
export function pendingReasonLabel(value) {
  const text = String(value || "").trim();
  const normalized = normalize(text);
  if (!text) return "";
  if (normalized === "g") return "Group / General pending";
  if (normalized === "l") return "Late / Lead-time risk";
  if (text.length <= 2) return "Need clarification";
  return text;
}
// @end-legacy-unit 1269

// @legacy-unit 1270 15489
export function pendingReasonCell(values, emptyText = "-") {
  const labels = [...new Set([...values].map(pendingReasonLabel).filter(Boolean))];
  if (!labels.length) return emptyText;
  return `<div class="pending-reason-stack">${labels.slice(0, 2).map((label) => `<span class="status-pill pending-reason">${label}</span>`).join("")}<small>${labels.length > 2 ? `+${labels.length - 2} more reason${labels.length - 2 === 1 ? "" : "s"}` : "Risk note"}</small></div>`;
}
// @end-legacy-unit 1270

// @legacy-unit 1271 15495
export function managerProgressRawPendingReason(row) {
  return [row.pendingReason, row.deliveryPendingReason, row.pendingDeliveryReason, row.procurementRemark].filter(Boolean).join(" / ");
}
// @end-legacy-unit 1271

// @legacy-unit 1272 15499
export function managerProgressSubmittedAt(row) {
  return row.submittedAt
    || row.requestSubmittedAt
    || row.sentToOmAt
    || row.managerApprovedAt
    || row.approvedAt
    || row.requiredDeliveryDate
    || row.requestDeadline
    || "";
}
// @end-legacy-unit 1272

// @legacy-unit 1273 15510
export function managerProgressHasOmSignals(row) {
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
// @end-legacy-unit 1273

// @legacy-unit 1274 15523
export function managerProgressPendingOwnerForRow(row) {
  return workflowStatusForRow(row, "costOwner").pendingOwner;
}
// @end-legacy-unit 1274

// @legacy-unit 1275 15527
export function managerProgressOwnerPriority(owner) {
  return workflowStatusModule().OWNER_PRIORITY?.[owner] ?? 9;
}
// @end-legacy-unit 1275

// @legacy-unit 1276 15531
export function managerProgressPendingOwnerForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").pendingOwner;
}
// @end-legacy-unit 1276

// @legacy-unit 1277 15535
export function managerProgressCurrentStageForRow(row) {
  return workflowStatusForRow(row, "costOwner").currentStage;
}
// @end-legacy-unit 1277

// @legacy-unit 1278 15539
export function managerProgressStagePriority(stage) {
  return workflowStatusModule().STAGE_PRIORITY?.[stage] ?? 10;
}
// @end-legacy-unit 1278

// @legacy-unit 1279 15543
export function managerProgressCurrentStageForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").currentStage;
}
// @end-legacy-unit 1279

// @legacy-unit 1280 15547
export function managerProgressStageStartAt(row, stage = managerProgressCurrentStageForRow(row)) {
  return workflowStatusForRow(row, "costOwner").stageStartAt || managerProgressSubmittedAt(row);
}
// @end-legacy-unit 1280

// @legacy-unit 1281 15551
export function managerProgressGroupStageStartAt(group, stage = managerProgressCurrentStageForGroup(group)) {
  return workflowStatusForGroup(group, "costOwner").stageStartAt
    || (group.rows || []).map(managerProgressSubmittedAt).filter(Boolean).sort()[0]
    || "";
}
// @end-legacy-unit 1281

// @legacy-unit 1282 15557
export function managerProgressDaysPending(group) {
  return workflowStatusForGroup(group, "costOwner").daysPending;
}
// @end-legacy-unit 1282

// @legacy-unit 1283 15561
export function managerProgressAgingCell(group) {
  const stage = managerProgressCurrentStageForGroup(group);
  const startAt = managerProgressGroupStageStartAt(group, stage);
  const days = managerProgressDaysPending(group);
  if (days === null) return `<span class="status-pill approved">Done</span><div class="reason-text">${startAt ? compactDateTime(startAt) : "-"}</div>`;
  const cls = days > OM_INTERNAL_SLA_DAYS ? "warning" : days >= 4 ? "pending" : "approved";
  return `<span class="status-pill ${cls}">${days}d</span><div class="reason-text">${startAt ? `Since ${compactDateTime(startAt)}` : "Missing timestamp"}</div>`;
}
// @end-legacy-unit 1283

// @legacy-unit 1284 15570
export function managerProgressQuoteStatusForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").quoteStatus;
}
// @end-legacy-unit 1284

// @legacy-unit 1285 15574
export function managerProgressNextActionForGroup(group) {
  return workflowStatusForGroup(group, "costOwner").nextAction;
}
// @end-legacy-unit 1285

// @legacy-unit 1286 15578
export function managerProgressIsLate(row) {
  return normalize(row.lateStatus || row.procurementRemark).includes("late");
}
// @end-legacy-unit 1286

// @legacy-unit 1287 15582
export function managerProgressIsPending(row) {
  return Boolean(managerProgressPendingReason(row));
}
// @end-legacy-unit 1287

// @legacy-unit 1288 15586
export function managerProgressKey(row) {
  return [
    managerProgressYearProject(row),
    managerProgressProject(row),
    row.name || "-",
    row.department || "-",
  ].join("::");
}
// @end-legacy-unit 1288

// @legacy-unit 1289 15595
export function progressRequestType(row) {
  return (row.requestType || row.tempBudgetMeta?.requestType || "Standard Demand").trim() || "Standard Demand";
}
// @end-legacy-unit 1289

// @legacy-unit 1290 15599
export function isProgressTempBudget(row) {
  return progressRequestType(row) === "Temporary Budget Request";
}
// @end-legacy-unit 1290

// @legacy-unit 1291 15603
export function progressEstimatedAmount(row) {
  const direct = clampQty(row.estimatedAmount || row.tempBudgetMeta?.estimatedAmount);
  if (direct > 0) return direct;
  const unit = clampQty(row.estimatedUnitPrice || row.tempBudgetMeta?.estimatedUnitPrice);
  const qty = managerProgressQty(row);
  return unit > 0 && qty > 0 ? unit * qty : 0;
}
// @end-legacy-unit 1291

// @legacy-unit 1292 15611
export function progressBiddingAmount(row) {
  return clampQty(
    row.biddingAmount
    || row.quoteAmount
    || row.updatedPrice
    || row.quotePrice
    || row.tempBudgetMeta?.biddingAmount
  );
}
// @end-legacy-unit 1292

// @legacy-unit 1293 15621
export function progressPoActualAmount(row) {
  const direct = clampQty(
    row.poActualAmount
    || row.actualAmount
    || row.finalPoAmount
    || row.buyerActualAmount
    || row.poAmount
    || row.poTotalAmount
    || row.buyerPoAmount
    || row.poIssuedAmount
  );
  if (direct > 0) return direct;
  const unitPrice = clampQty(row.actualUnitPrice || row.poActualUnitPrice || row.buyerPoUnitPrice);
  const qty = managerProgressQty(row);
  return unitPrice > 0 && qty > 0 ? unitPrice * qty : 0;
}
// @end-legacy-unit 1293

// @legacy-unit 1294 15638
export function progressVarianceLabel(baseAmount, compareAmount) {
  if (!(baseAmount > 0) || !(compareAmount > 0)) return "Pending";
  const diff = compareAmount - baseAmount;
  const pct = (diff / baseAmount) * 100;
  return `${diff >= 0 ? "+" : ""}${formatCurrencyFromVnd(diff)} (${pct.toFixed(1)}%)`;
}
// @end-legacy-unit 1294

// @legacy-unit 1295 15645
export function progressQuoteValidity(row) {
  const validUntil = (row.quoteValidUntil || row.tempBudgetMeta?.quoteValidUntil || "").trim();
  const receivedAt = (row.quoteReceivedAt || row.quoteDate || row.tempBudgetMeta?.quoteReceivedAt || "").trim();
  if (!validUntil) return { validUntil: "", receivedAt, status: isProgressTempBudget(row) ? "Missing validity" : "-" };
  const expiryDate = new Date(validUntil);
  if (Number.isNaN(expiryDate.getTime())) return { validUntil, receivedAt, status: "Missing validity" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { validUntil, receivedAt, status: "Expired / Requote Required", daysRemaining: days };
  if (days <= QUOTE_EXPIRING_SOON_DAYS) return { validUntil, receivedAt, status: "Expiring Soon", daysRemaining: days };
  return { validUntil, receivedAt, status: (row.quoteStatus || row.tempBudgetMeta?.quoteStatus || "Valid").trim() || "Valid", daysRemaining: days };
}
// @end-legacy-unit 1295

// @legacy-unit 1296 15659
export function managerProgressFilterState() {
  return {
    yearProject: document.getElementById("managerProgressYearFilter")?.value || "",
    project: document.getElementById("managerProgressProjectFilter")?.value || "",
    process: document.getElementById("managerProgressProcessFilter")?.value || "",
    stage: document.getElementById("managerProgressStageFilter")?.value || "",
    department: document.getElementById("managerProgressDepartmentFilter")?.value || "",
    requestType: document.getElementById("managerProgressRequestTypeFilter")?.value || "",
    quoteValidity: document.getElementById("managerProgressQuoteValidityFilter")?.value || "",
    lateOnly: Boolean(document.getElementById("managerProgressLateOnly")?.checked),
    pendingOnly: Boolean(document.getElementById("managerProgressPendingOnly")?.checked),
  };
}
// @end-legacy-unit 1296

// @legacy-unit 1297 15673
export function managerProgressMatchesFilters(row, filters) {
  if (filters.yearProject && managerProgressYearProject(row) !== filters.yearProject) return false;
  if (filters.project && managerProgressProject(row) !== filters.project) return false;
  if (filters.process && row.process !== filters.process) return false;
  if (filters.stage && managerProgressStage(row) !== filters.stage) return false;
  if (filters.department && row.department !== filters.department) return false;
  if (filters.requestType === "temporary" && !isProgressTempBudget(row)) return false;
  if (filters.requestType === "standard" && isProgressTempBudget(row)) return false;
  if (filters.quoteValidity) {
    const status = progressQuoteValidity(row).status;
    if (filters.quoteValidity === "expiring" && status !== "Expiring Soon") return false;
    if (filters.quoteValidity === "expired" && status !== "Expired / Requote Required") return false;
    if (filters.quoteValidity === "missing" && status !== "Missing validity") return false;
    if (filters.quoteValidity === "valid" && !["Valid", "Quote Valid"].includes(status)) return false;
  }
  if (filters.lateOnly && !managerProgressIsLate(row)) return false;
  if (filters.pendingOnly && !managerProgressIsPending(row)) return false;
  return true;
}
// @end-legacy-unit 1297

// @legacy-unit 1298 15693
export function optionHtml(value, selectedValue) {
  return `<option value="${value}" ${value === selectedValue ? "selected" : ""}>${value}</option>`;
}
// @end-legacy-unit 1298

// @legacy-unit 1299 15697
export function syncManagerProgressFilters() {
  const rawRows = managerProgressRawRows();
  const controls = [
    ["managerProgressYearFilter", "All year projects", (row) => managerProgressYearProject(row)],
    ["managerProgressProjectFilter", "All projects", (row) => managerProgressProject(row)],
    ["managerProgressProcessFilter", "All process", (row) => row.process],
    ["managerProgressStageFilter", "All stage", (row) => managerProgressStage(row)],
    ["managerProgressDepartmentFilter", "All departments", (row) => row.department],
  ];
  controls.forEach(([id, allLabel, getter]) => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    const values = [...new Set(rawRows.map(getter).filter(Boolean))].sort((left, right) => String(left).localeCompare(String(right)));
    select.innerHTML = `<option value="">${allLabel}</option>${values.map((value) => optionHtml(value, currentValue)).join("")}`;
    if (currentValue && values.includes(currentValue)) select.value = currentValue;
  });
}
// @end-legacy-unit 1299

// @legacy-unit 1300 15716
export function clearManagerProgressFilters() {
  [
    "managerProgressYearFilter",
    "managerProgressProjectFilter",
    "managerProgressProcessFilter",
    "managerProgressStageFilter",
    "managerProgressDepartmentFilter",
    "managerProgressRequestTypeFilter",
    "managerProgressQuoteValidityFilter",
  ].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.value = "";
  });
  ["managerProgressLateOnly", "managerProgressPendingOnly"].forEach((id) => {
    const control = document.getElementById(id);
    if (control) control.checked = false;
  });
  renderManagerStageTracking();
}
// @end-legacy-unit 1300

// @legacy-unit 1301 15736
export function managerProgressRows() {
  const filters = managerProgressFilterState();
  const groups = new Map();
  managerProgressRawRows().forEach((row) => {
    if (!managerProgressMatchesFilters(row, filters)) return;
    const key = managerProgressKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        keyId: stableHash(key),
        yearProject: managerProgressYearProject(row),
        project: managerProgressProject(row),
        item: row.name || "-",
        department: row.department || "-",
        quantity: 0,
        budgetDone: 0,
        prDone: 0,
        poDone: 0,
        arrived: 0,
        lateRows: 0,
        pendingRows: 0,
        notArrivedRows: 0,
        requiredDateValues: new Set(),
        deadlineValues: new Set(),
        etaValues: new Set(),
        dtaValues: new Set(),
        pendingReasons: new Set(),
        rows: [],
      });
    }
    const group = groups.get(key);
    const qty = managerProgressQty(row);
    group.quantity += qty;
    group.budgetDone += managerProgressDoneQty(row, "qtyDoneBudget", "budgetStatus");
    group.prDone += managerProgressDoneQty(row, "qtyDonePr", "prStatus");
    group.poDone += managerProgressDoneQty(row, "qtyDonePo", "poStatus");
    group.arrived += managerProgressArrivedQty(row);
    if (managerProgressIsLate(row)) group.lateRows += 1;
    if (managerProgressIsPending(row)) group.pendingRows += 1;
    if (managerProgressArrivedQty(row) < qty) group.notArrivedRows += 1;
    if (row.requiredDeliveryDate) group.requiredDateValues.add(row.requiredDeliveryDate);
    if (row.requestDeadline) group.deadlineValues.add(row.requestDeadline);
    if (row.etaPlan || row.eta) group.etaValues.add(row.etaPlan || row.eta);
    if (row.dtaActual || row.actualEta) group.dtaValues.add(row.dtaActual || row.actualEta);
    const pendingReason = managerProgressPendingReason(row);
    if (pendingReason) group.pendingReasons.add(pendingReason);
    group.rows.push(row);
  });
  return [...groups.values()].sort((left, right) => {
    const leftRisk = (left.lateRows ? 100 : 0) + (left.pendingRows ? 40 : 0) + (left.notArrivedRows ? 20 : 0);
    const rightRisk = (right.lateRows ? 100 : 0) + (right.pendingRows ? 40 : 0) + (right.notArrivedRows ? 20 : 0);
    if (leftRisk !== rightRisk) return rightRisk - leftRisk;
    if (left.quantity !== right.quantity) return right.quantity - left.quantity;
    return `${left.yearProject} ${left.project} ${left.item}`.localeCompare(`${right.yearProject} ${right.project} ${right.item}`);
  });
}
// @end-legacy-unit 1301

// @legacy-unit 1302 15793
export function managerProgressPercent(done, total) {
  return total ? Math.min(100, Math.round((done / total) * 100)) : 0;
}
// @end-legacy-unit 1302

// @legacy-unit 1303 15797
export function formattedDateSet(values) {
  return new Set([...values].map(formatProgressDate).filter(Boolean));
}
// @end-legacy-unit 1303

// @legacy-unit 1304 15801
export function managerProgressDateLine(group, type) {
  const dateMap = {
    budget: ["Deadline", group.deadlineValues],
    pr: ["Required", group.requiredDateValues],
    po: ["ETA", group.etaValues.size ? group.etaValues : group.requiredDateValues],
    arrived: ["DTA", group.dtaValues.size ? group.dtaValues : group.etaValues],
  };
  const [label, values] = dateMap[type] || ["Date", new Set()];
  const value = compactList(formattedDateSet(values), "");
  return value ? `${label} ${value}` : "";
}
// @end-legacy-unit 1304

// @legacy-unit 1305 15813
export function managerKeyDatesCell(group) {
  const lines = [
    ["Required", group.requiredDateValues],
    ["Deadline", group.deadlineValues],
    ["ETA", group.etaValues],
    ["DTA", group.dtaValues],
  ].map(([label, values]) => {
    const value = compactList(formattedDateSet(values), "-");
    return `<div><strong>${label}</strong><span>${value}</span></div>`;
  });
  return `<div class="pivot-date-stack">${lines.join("")}</div>`;
}
// @end-legacy-unit 1305

// @legacy-unit 1306 15826
export function managerProgressCell(done, total, label, dateLine = "") {
  const percent = managerProgressPercent(done, total);
  const status = percent >= 100 ? "Done" : percent > 0 ? "In Progress" : "Pending";
  return `
    <div class="pivot-progress-cell">
      <div class="pivot-progress-top"><strong>${done}/${total}</strong><span>${percent}%</span></div>
      <div class="pivot-progress-track"><span style="width: ${percent}%"></span></div>
      <small><span>${label}</span><strong>${status}</strong></small>
      ${dateLine ? `<div class="pivot-progress-date">${dateLine}</div>` : ""}
    </div>`;
}
// @end-legacy-unit 1306

// @legacy-unit 1307 15838
export function managerDeliveryStatusCell(group) {
  const pills = [];
  if (group.lateRows) pills.push(`<span class="status-pill late">Late ${group.lateRows}</span>`);
  if (group.pendingRows) pills.push(`<span class="status-pill pending">Pending ${group.pendingRows}</span>`);
  if (group.notArrivedRows) pills.push(`<span class="status-pill not-arrived">Not Arrived ${group.notArrivedRows}</span>`);
  if (!pills.length) pills.push(`<span class="status-pill approved">On Track</span>`);
  const summary = group.lateRows
    ? "Schedule risk"
    : group.pendingRows
      ? "Action pending"
      : group.notArrivedRows
        ? "Arrival pending"
        : "No escalation";
  return `<div class="pivot-status-stack">${pills.join("")}<small>${summary}</small></div>`;
}
// @end-legacy-unit 1307
