// om/progress-data: authoritative source; see docs/module-map.md.
import {
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  effectiveUnitPrice
} from "../cost/pricing.js";
import {
  isSupersededRequest
} from "../demand/amendments.js";
import {
  totalQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  omProgressModule,
  workflowStatusModule
} from "../infrastructure/module-adapters.js";
import {
  omItemCell
} from "../materials/detail-view.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  omAssigneeName
} from "./assignment.js";
import {
  isOmWaitingUserConfirm
} from "./export-rules.js";
import {
  applyOmResponsibility,
  isOmBuyScope
} from "./ownership.js";
import {
  renderOmSubmission
} from "./progress-view.js";
import {
  omItemBucket
} from "./queue.js";
import {
  omQuoteExpiryAction,
  omQuoteExpiryRows
} from "./quotation-db.js";
import {
  isOmQuoteReady,
  omQuoteScreenshotFile
} from "./quote-rules.js";
import {
  omQuoteValidUntil,
  omQuoteValidity
} from "./quote-validity.js";
import {
  currentOmItemFilter,
  currentOmLevel1Filter,
  currentOmLevel2Filter,
  currentOmLevel3Filter,
  currentOmPhaseFilter,
  currentOmProjectFilter,
  currentOmStageFilter,
  currentOmYearProjectFilter,
  replaceCurrentOmItemFilterBinding,
  replaceCurrentOmLevel1FilterBinding,
  replaceCurrentOmLevel2FilterBinding,
  replaceCurrentOmLevel3FilterBinding,
  replaceCurrentOmPhaseFilterBinding,
  replaceCurrentOmProjectFilterBinding,
  replaceCurrentOmStageFilterBinding,
  replaceCurrentOmYearProjectFilterBinding
} from "./state.js";
import {
  managerProgressPendingReason,
  managerProgressProject,
  managerProgressQty,
  managerProgressStage,
  managerProgressYearProject
} from "../progress/demand.js";
import {
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  stableHash,
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  OM_USER_CONFIRMED
} from "../workflow/status-constants.js";
import {
  workflowStatusForGroup,
  workflowStatusForRow
} from "../workflow/status-view.js";

// @legacy-unit 1308 15854
export function omSubmissionItemKey(row = {}) {
  return row.name || row.item || omItemBucket(row) || "-";
}
// @end-legacy-unit 1308

// @legacy-unit 1309 15858
export function omProductCategory(row = {}) {
  return omProgressModule().omProductCategory?.(row) || {
    level2: row.omCategoryLevel2 || "Need OM Classification",
    level3: row.omCategoryLevel3 || "Unclassified",
    path: `${row.omCategoryLevel2 || "Need OM Classification"} / ${row.omCategoryLevel3 || "Unclassified"}`,
    status: row.omCategoryLevel2 && row.omCategoryLevel3 ? "Classified" : "Need OM Classification",
  };
}
// @end-legacy-unit 1309

// @legacy-unit 1310 15867
export function omSubmissionLevels(row = {}) {
  const category = omProductCategory(row);
  const level1 = row.omCategoryLevel1 || row.level1 || row.categoryLevel1 || "";
  const level2 = row.omCategoryLevel2 || row.level2 || row.categoryLevel2 || category.level2 || "";
  const level3 = row.omCategoryLevel3 || row.level3 || row.categoryLevel3 || category.level3 || "";
  return {
    level1,
    level2,
    level3,
  };
}
// @end-legacy-unit 1310

// @legacy-unit 1311 15879
export let OM_PAS_DEMAND_SLA_DAYS;
export function initializeOM_PAS_DEMAND_SLA_DAYSBinding() {
  OM_PAS_DEMAND_SLA_DAYS = 2;
}
// @end-legacy-unit 1311

// @legacy-unit 1312 15880
export let OM_BIDDING_RESULT_SLA_DAYS;
export function initializeOM_BIDDING_RESULT_SLA_DAYSBinding() {
  OM_BIDDING_RESULT_SLA_DAYS = 14;
}
// @end-legacy-unit 1312

// @legacy-unit 1313 15881
export let OM_INTERNAL_SLA_DAYS;
export function initializeOM_INTERNAL_SLA_DAYSBinding() {
  OM_INTERNAL_SLA_DAYS = 7;
}
// @end-legacy-unit 1313

// @legacy-unit 1314 15883
export function omStageSlaStatus(row, options = {}) {
  return omProgressModule().omStageSlaStatus?.(row, options) || workflowStatusForRow(row, "om");
}
// @end-legacy-unit 1314

// @legacy-unit 1315 15887
export function omEstimatedUnitPrice(row = {}) {
  return omProgressModule().estimatedUnitPrice?.(row) || effectiveUnitPrice(row) || 0;
}
// @end-legacy-unit 1315

// @legacy-unit 1316 15891
export function omBuyerHandoffStatus(row = {}) {
  return omProgressModule().buyerHandoffStatus?.(row) || "Buyer owns PR-PO";
}
// @end-legacy-unit 1316

// @legacy-unit 1317 15895
export function omSubmissionPackageId(row = {}) {
  return row.requestPackageId || row.requestId || row.id || "-";
}
// @end-legacy-unit 1317

// @legacy-unit 1318 15899
export function omSubmissionPackageLabel(row = {}) {
  return row.requestPackageLabel || omSubmissionPackageId(row);
}
// @end-legacy-unit 1318

// @legacy-unit 1319 15903
export function omSubmissionRowKey(row, filters = {}) {
  return [
    "item",
    managerProgressYearProject(row),
    managerProgressProject(row),
    omSubmissionPackageId(row),
    row.id || row.requestId || omSubmissionItemKey(row),
    managerProgressStage(row),
    row.department || "-",
    filters.requestType || "all",
  ].join("::");
}
// @end-legacy-unit 1319

// @legacy-unit 1320 15916
export function omSubmissionFilterState() {
  return {
    stage: currentOmStageFilter || "all",
    yearProject: currentOmYearProjectFilter || "",
    project: currentOmProjectFilter || "",
    phase: currentOmPhaseFilter || "",
    level1: currentOmLevel1Filter || "",
    level2: currentOmLevel2Filter || "",
    level3: currentOmLevel3Filter || "",
    item: currentOmItemFilter || "",
  };
}
// @end-legacy-unit 1320

// @legacy-unit 1321 15929
export function omSubmissionScopeLabel(filters = omSubmissionFilterState()) {
  const stageLabels = {
    all: "All active OM stages",
    pendingPasDemand: "Pending PAS Demand",
    pendingBiddingResult: "Pending Bidding Result",
    readyToExport: "Ready for Buyer Handoff",
    buyerHandoff: "Procurement Tracking",
    overdue: "Overdue",
  };
  const lvPath = [filters.level1, filters.level2, filters.level3].filter(Boolean).join(" / ");
  return [
    filters.yearProject || "All year projects",
    filters.project || "All projects",
    filters.phase ? STAGE_LABELS[filters.phase] || filters.phase : "All phases",
    lvPath || "All LV123",
    filters.item || "All items",
    stageLabels[filters.stage] || stageLabels.all,
  ].join(" · ");
}
// @end-legacy-unit 1321

// @legacy-unit 1322 15949
export function omSubmissionMatchesFilters(group, filters) {
  if (filters.yearProject && group.yearProject !== filters.yearProject) return false;
  if (filters.project && group.project !== filters.project) return false;
  if (filters.phase && group.phaseKey !== filters.phase) return false;
  if (filters.level1 && group.level1 !== filters.level1) return false;
  if (filters.level2 && group.level2 !== filters.level2) return false;
  if (filters.level3 && group.level3 !== filters.level3) return false;
  if (filters.item && group.item !== filters.item) return false;
  if (filters.stage === "all") return true;
  if (filters.stage === "overdue") return group.sla.isOverdue;
  return group.sla.stageKey === filters.stage;
}
// @end-legacy-unit 1322

// @legacy-unit 1323 15962
export function omSubmissionUniqueOptions(rows, getter) {
  return [...new Set(rows.map(getter).filter(Boolean))]
    .sort((left, right) => String(left).localeCompare(String(right)));
}
// @end-legacy-unit 1323

// @legacy-unit 1324 15967
export function omSubmissionSetSelectOptions(select, options, placeholder, selectedValue = "", labelForOption = (option) => option) {
  if (!select) return "";
  const optionSet = new Set(options);
  const nextValue = optionSet.has(selectedValue) ? selectedValue : "";
  select.innerHTML = [
    `<option value="">${htmlText(placeholder)}</option>`,
    ...options.map((option) => `<option value="${htmlAttr(option)}">${htmlText(labelForOption(option))}</option>`),
  ].join("");
  select.value = nextValue;
  return nextValue;
}
// @end-legacy-unit 1324

// @legacy-unit 1325 15979
export function omSubmissionRowsMatchingScope(rows, filters = {}, keys = []) {
  return rows.filter((row) => {
    const levels = omSubmissionLevels(row);
    return keys.every((key) => {
      const value = filters[key] || "";
      if (!value) return true;
      if (key === "yearProject") return managerProgressYearProject(row) === value;
      if (key === "project") return managerProgressProject(row) === value;
      if (key === "phase") return managerProgressStage(row) === value;
      if (key === "level1") return levels.level1 === value;
      if (key === "level2") return levels.level2 === value;
      if (key === "level3") return levels.level3 === value;
      if (key === "item") return omSubmissionItemKey(row) === value;
      return true;
    });
  });
}
// @end-legacy-unit 1325

// @legacy-unit 1326 15997
export function syncOmSubmissionScopeControls() {
  const controls = {
    yearProject: document.getElementById("omSubmissionYearFilter"),
    project: document.getElementById("omSubmissionProjectFilter"),
    phase: document.getElementById("omSubmissionPhaseFilter"),
    level1: document.getElementById("omSubmissionLevel1Filter"),
    level2: document.getElementById("omSubmissionLevel2Filter"),
    level3: document.getElementById("omSubmissionLevel3Filter"),
    item: document.getElementById("omSubmissionItemFilter"),
  };
  if (!controls.yearProject) return;
  const rows = omInternalRows().map(applyOmResponsibility);
  replaceCurrentOmYearProjectFilterBinding(omSubmissionSetSelectOptions(
    controls.yearProject,
    omSubmissionUniqueOptions(rows, managerProgressYearProject),
    "All year projects",
    currentOmYearProjectFilter
  ));
  replaceCurrentOmProjectFilterBinding(omSubmissionSetSelectOptions(
    controls.project,
    omSubmissionUniqueOptions(omSubmissionRowsMatchingScope(rows, omSubmissionFilterState(), ["yearProject"]), managerProgressProject),
    "All projects",
    currentOmProjectFilter
  ));
  replaceCurrentOmPhaseFilterBinding(omSubmissionSetSelectOptions(
    controls.phase,
    STAGES.filter((stage) => omSubmissionRowsMatchingScope(rows, omSubmissionFilterState(), ["yearProject", "project"])
      .some((row) => managerProgressStage(row) === stage)),
    "All phases",
    currentOmPhaseFilter,
    (stage) => STAGE_LABELS[stage] || stage
  ));
  const levelBaseRows = omSubmissionRowsMatchingScope(rows, omSubmissionFilterState(), ["yearProject", "project", "phase"]);
  replaceCurrentOmLevel1FilterBinding(omSubmissionSetSelectOptions(
    controls.level1,
    omSubmissionUniqueOptions(levelBaseRows, (row) => omSubmissionLevels(row).level1),
    "All LV1",
    currentOmLevel1Filter
  ));
  replaceCurrentOmLevel2FilterBinding(omSubmissionSetSelectOptions(
    controls.level2,
    currentOmLevel1Filter
      ? omSubmissionUniqueOptions(omSubmissionRowsMatchingScope(levelBaseRows, omSubmissionFilterState(), ["level1"]), (row) => omSubmissionLevels(row).level2)
      : [],
    currentOmLevel1Filter ? "All LV2" : "Select LV1 first",
    currentOmLevel2Filter
  ));
  controls.level2.disabled = !currentOmLevel1Filter;
  replaceCurrentOmLevel3FilterBinding(omSubmissionSetSelectOptions(
    controls.level3,
    currentOmLevel2Filter
      ? omSubmissionUniqueOptions(omSubmissionRowsMatchingScope(levelBaseRows, omSubmissionFilterState(), ["level1", "level2"]), (row) => omSubmissionLevels(row).level3)
      : [],
    currentOmLevel2Filter ? "All LV3" : "Select LV2 first",
    currentOmLevel3Filter
  ));
  controls.level3.disabled = !currentOmLevel2Filter;
  replaceCurrentOmItemFilterBinding(omSubmissionSetSelectOptions(
    controls.item,
    currentOmLevel3Filter
      ? omSubmissionUniqueOptions(omSubmissionRowsMatchingScope(levelBaseRows, omSubmissionFilterState(), ["level1", "level2", "level3"]), omSubmissionItemKey)
      : [],
    currentOmLevel3Filter ? "All items" : "Select LV123 first",
    currentOmItemFilter
  ));
  controls.item.disabled = !currentOmLevel3Filter;
}
// @end-legacy-unit 1326

// @legacy-unit 1327 16065
export function syncOmSubmissionFilters() {
  syncOmSubmissionScopeControls();
  document.querySelectorAll("[data-om-stage-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.omStageFilter === (currentOmStageFilter || "all"));
  });
}
// @end-legacy-unit 1327

// @legacy-unit 1328 16072
export function clearOmSubmissionFilters() {
  replaceCurrentOmStageFilterBinding("all");
  replaceCurrentOmYearProjectFilterBinding("");
  replaceCurrentOmProjectFilterBinding("");
  replaceCurrentOmPhaseFilterBinding("");
  replaceCurrentOmLevel1FilterBinding("");
  replaceCurrentOmLevel2FilterBinding("");
  replaceCurrentOmLevel3FilterBinding("");
  replaceCurrentOmItemFilterBinding("");
  renderOmSubmission();
}
// @end-legacy-unit 1328

// @legacy-unit 1329 16084
export function omMostUrgentSla(statuses = []) {
  const priority = {
    pendingPasDemand: 10,
    pendingBiddingResult: 8,
    readyToExport: 5,
    buyerHandoff: 3,
    waitingRequester: 2,
    quoteReady: 1,
  };
  return [...statuses].sort((left, right) => {
    if (left.isOverdue !== right.isOverdue) return left.isOverdue ? -1 : 1;
    if ((left.overdueDays || 0) !== (right.overdueDays || 0)) return (right.overdueDays || 0) - (left.overdueDays || 0);
    if ((priority[left.stageKey] || 0) !== (priority[right.stageKey] || 0)) return (priority[right.stageKey] || 0) - (priority[left.stageKey] || 0);
    return (right.daysInStage || 0) - (left.daysInStage || 0);
  })[0] || omStageSlaStatus({});
}
// @end-legacy-unit 1329

// @legacy-unit 1330 16101
export function omProductProgressRows() {
  const groups = new Map();
  omInternalRows().map(applyOmResponsibility).forEach((row) => {
    const category = omProductCategory(row);
    const levels = omSubmissionLevels(row);
    const project = managerProgressProject(row);
    const phaseKey = managerProgressStage(row);
    const phase = STAGE_LABELS[phaseKey] || phaseKey || "-";
    const item = omSubmissionItemKey(row);
    const key = omSubmissionRowKey(row);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        keyId: stableHash(`OM-PROGRESS::${key}`),
        category,
        item,
        spec: itemDetail(row) || row.spec || row.detail || "",
        project,
        phase,
        phaseKey,
        level1: levels.level1,
        level2: levels.level2,
        level3: levels.level3,
        yearProject: managerProgressYearProject(row),
        requestPackageId: omSubmissionPackageId(row),
        requestPackageLabel: omSubmissionPackageLabel(row),
        department: row.department || "-",
        quantity: 0,
        estimatedAmountUsd: 0,
        estimatedUnitPriceUsd: 0,
        assigneeNames: new Set(),
        buyerStatuses: new Set(),
        remarks: new Set(),
        pendingReasons: new Set(),
        stageStatuses: [],
        rows: [],
      });
    }
    const group = groups.get(key);
    const qty = managerProgressQty(row) || totalQty(row);
    const estimatedUnitPriceUsd = omEstimatedUnitPrice(row);
    const sla = omStageSlaStatus(row);
    group.quantity += qty;
    group.estimatedAmountUsd += estimatedUnitPriceUsd * qty;
    group.estimatedUnitPriceUsd = group.quantity ? group.estimatedAmountUsd / group.quantity : estimatedUnitPriceUsd;
    group.assigneeNames.add(omAssigneeName(row) || "Unassigned");
    group.buyerStatuses.add(omBuyerHandoffStatus(row));
    if (sla.remark) group.remarks.add(sla.remark);
    const pendingReason = managerProgressPendingReason(row);
    if (pendingReason) group.pendingReasons.add(pendingReason);
    group.stageStatuses.push(sla);
    group.rows.push(row);
  });
  return [...groups.values()]
    .map((group) => ({ ...group, sla: omMostUrgentSla(group.stageStatuses) }))
    .filter((group) => omSubmissionMatchesFilters(group, omSubmissionFilterState()))
    .sort((left, right) => {
      if (left.sla.isOverdue !== right.sla.isOverdue) return left.sla.isOverdue ? -1 : 1;
      if ((left.sla.overdueDays || 0) !== (right.sla.overdueDays || 0)) return (right.sla.overdueDays || 0) - (left.sla.overdueDays || 0);
      if (left.sla.stageKey !== right.sla.stageKey) return left.sla.stageKey.localeCompare(right.sla.stageKey);
      if (left.quantity !== right.quantity) return right.quantity - left.quantity;
      return `${left.category.path} ${left.item} ${left.project}`.localeCompare(`${right.category.path} ${right.item} ${right.project}`);
    });
}
// @end-legacy-unit 1330

// @legacy-unit 1331 16166
export function omSubmissionRows() {
  return omProductProgressRows();
}
// @end-legacy-unit 1331

// @legacy-unit 1332 16170
export function daysBetweenDates(startText, endText = new Date().toISOString()) {
  if (!startText) return 0;
  const start = new Date(startText);
  const end = new Date(endText || new Date().toISOString());
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.ceil((end - start) / 86400000));
}
// @end-legacy-unit 1332

// @legacy-unit 1333 16178
export function omInternalRows() {
  return requests.filter((row) =>
    !["Draft", "Submitted", "Rejected", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status)
    && !isSupersededRequest(row)
    && (row.pasRequired || isOmBuyScope(row) || row.procurementStatus || row.omStatus || row.sentToOmAt)
  );
}
// @end-legacy-unit 1333

// @legacy-unit 1334 16186
export function omInternalProcessingSummary() {
  const rows = omInternalRows();
  const durations = rows.map((row) => {
    const start = row.sentToOmAt || row.decidedAt || row.managerApprovedAt || row.approvedAt || row.submittedAt;
    const end = row.finalExportedAt || row.userAQuoteDecisionAt || row.sentToUserAAt || row.quoteCompletionReadyAt || row.pasDemandNoRecordedAt || new Date().toISOString();
    return daysBetweenDates(start, end);
  }).filter((days) => days > 0);
  const avgDays = durations.length ? `${Math.round(durations.reduce((sum, days) => sum + days, 0) / durations.length)}d` : "-";
  const waitingPasDemandNo = rows.filter((row) => !row.pasDemandNo && !row.finalExportedAt).length;
  const quoteAging = rows.filter((row) => !isOmWaitingUserConfirm(row) && !row.userAQuoteDecisionAt && !row.finalExportedAt && !isOmQuoteReady(row)).length;
  const waitingUserConfirm = rows.filter((row) => isOmWaitingUserConfirm(row) && !row.userAQuoteDecisionAt).length;
  const exportPending = rows.filter((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED && !row.finalExportedAt).length;
  const overSla = rows.filter((row) => {
    const start = row.sentToOmAt || row.decidedAt || row.managerApprovedAt || row.approvedAt || row.submittedAt;
    return !row.finalExportedAt && daysBetweenDates(start) > OM_INTERNAL_SLA_DAYS;
  }).length;
  return { avgDays, waitingPasDemandNo, quoteAging, waitingUserConfirm, exportPending, overSla };
}
// @end-legacy-unit 1334

// @legacy-unit 1335 16205
export function omStageTrackingCell(group, stage) {
  const rows = group.rows || [];
  const firstDate = (getter) => rows.map(getter).filter(Boolean).sort()[0] || "";
  const latestDate = (getter) => rows.map(getter).filter(Boolean).sort().pop() || "";
  const cell = {
    pas: {
      label: rows.some((row) => row.pasDemandNo) ? "Recorded" : "Pending",
      date: firstDate((row) => row.pasDemandNoRecordedAt || row.pasDemandNoUpdatedAt),
      note: rows.some((row) => row.pasDemandNo) ? "PAS Demand No" : "Waiting PAS Demand No",
    },
    quote: {
      label: rows.some((row) => isOmQuoteReady(row) || row.quoteCompletionReadyAt) ? "Ready" : "Pending",
      date: firstDate((row) => row.quoteCompletionReadyAt || row.quoteReadyAt),
      note: rows.some((row) => isOmQuoteReady(row)) ? "Quote complete" : "Quote incomplete",
    },
    confirm: {
      label: rows.some((row) => row.userAQuoteDecisionAt) ? "Done" : rows.some((row) => isOmWaitingUserConfirm(row)) ? "Waiting" : "Not Sent",
      date: latestDate((row) => row.userAQuoteDecisionAt || row.sentToUserAAt),
      note: rows.some((row) => row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) ? "Requester confirmed" : rows.some((row) => isOmWaitingUserConfirm(row)) ? "Waiting Requester" : "Not sent to Requester",
    },
    export: {
      label: rows.some((row) => row.finalExportedAt) ? "Handed Off" : rows.some((row) => row.finalExportStatus || row.finalExportTarget) ? "Preparing" : "Pending",
      date: latestDate((row) => row.finalExportedAt || row.finalExportPreparedAt),
      note: rows.some((row) => row.finalExportedAt) ? "Buyer handoff complete" : "Handoff pending",
    },
  }[stage];
  return `
    <div class="om-stage-cell">
      <span class="status-pill ${statusClass(cell.label)}">${cell.label}</span>
      <strong>${cell.date ? compactDateTime(cell.date) : "-"}</strong>
      <small>${cell.note}</small>
    </div>`;
}
// @end-legacy-unit 1335

// @legacy-unit 1336 16239
export function omReceivedAt(row) {
  return row.sentToOmAt || row.managerApprovedAt || row.decidedAt || row.approvedAt || row.submittedAt || "";
}
// @end-legacy-unit 1336

// @legacy-unit 1337 16243
export function omCurrentStageForRow(row) {
  return workflowStatusForRow(row, "om").currentStage;
}
// @end-legacy-unit 1337

// @legacy-unit 1338 16247
export function isOmQuoteResultReady(row) {
  return Boolean(
    isOmQuoteReady(row)
    || row.quoteCompletionReadyAt
    || (row.pasMaterialNo && (row.updatedPrice || row.updatedPriceVnd || row.unitPriceVnd) && row.quoteDate && (omQuoteScreenshotFile(row) || row.quoteExcel))
  );
}
// @end-legacy-unit 1338

// @legacy-unit 1339 16255
export function omPendingOwnerForRow(row) {
  return workflowStatusForRow(row, "om").pendingOwner;
}
// @end-legacy-unit 1339

// @legacy-unit 1340 16259
export function omPendingOwnerPriority(owner) {
  return workflowStatusModule().OWNER_PRIORITY?.[owner] || 9;
}
// @end-legacy-unit 1340

// @legacy-unit 1341 16263
export function omPendingOwnerForGroup(group) {
  return workflowStatusForGroup(group, "om").pendingOwner;
}
// @end-legacy-unit 1341

// @legacy-unit 1342 16267
export function omQuoteStatusForRow(row) {
  return workflowStatusForRow(row, "om").quoteStatus;
}
// @end-legacy-unit 1342

// @legacy-unit 1343 16271
export function omQuoteStatusPriority(status) {
  return {
    "Expired / Requote Required": 1,
    "Expiring Soon": 2,
    "Waiting PAS Reply": 3,
    "Missing Validity": 4,
    "Reusable Quote": 5,
  }[status] || 9;
}
// @end-legacy-unit 1343

// @legacy-unit 1344 16281
export function omQuoteStatusForGroup(group) {
  return workflowStatusForGroup(group, "om").quoteStatus;
}
// @end-legacy-unit 1344

// @legacy-unit 1345 16285
export function omStageStartAt(row, stage = omCurrentStageForRow(row)) {
  return workflowStatusForRow(row, "om").stageStartAt || omReceivedAt(row);
}
// @end-legacy-unit 1345

// @legacy-unit 1346 16289
export function omStagePriority(stage) {
  return workflowStatusModule().STAGE_PRIORITY?.[stage] || 0;
}
// @end-legacy-unit 1346

// @legacy-unit 1347 16293
export function omCurrentStageForGroup(group) {
  return workflowStatusForGroup(group, "om").currentStage;
}
// @end-legacy-unit 1347

// @legacy-unit 1348 16297
export function omGroupReceivedAt(group) {
  return (group.rows || []).map(omReceivedAt).filter(Boolean).sort()[0] || "";
}
// @end-legacy-unit 1348

// @legacy-unit 1349 16301
export function omGroupStageStartAt(group, stage = omCurrentStageForGroup(group)) {
  return workflowStatusForGroup(group, "om").stageStartAt || omGroupReceivedAt(group);
}
// @end-legacy-unit 1349

// @legacy-unit 1350 16305
export function omDaysInStage(group) {
  return workflowStatusForGroup(group, "om").daysPending;
}
// @end-legacy-unit 1350

// @legacy-unit 1351 16309
export function omAgingStatusClass(days) {
  if (days === null) return "approved";
  if (days > OM_INTERNAL_SLA_DAYS) return "warning";
  if (days >= 4) return "pending";
  return "approved";
}
// @end-legacy-unit 1351

// @legacy-unit 1352 16316
export function omAgingCell(group) {
  const stage = omCurrentStageForGroup(group);
  const startAt = omGroupStageStartAt(group, stage);
  const days = omDaysInStage(group);
  if (days === null) return `<span class="status-pill approved">Completed</span><div class="reason-text">${startAt ? compactDateTime(startAt) : "-"}</div>`;
  const helper = startAt ? `Since ${compactDateTime(startAt)}` : "Missing stage start";
  return `<span class="status-pill ${omAgingStatusClass(days)}">${days}d</span><div class="reason-text">${helper}</div>`;
}
// @end-legacy-unit 1352

// @legacy-unit 1353 16325
export function omSubmittedReceivedCell(group) {
  const rows = group.rows || [];
  const submittedAt = rows.map((row) => row.submittedAt || row.requestSubmittedAt).filter(Boolean).sort()[0] || "";
  const receivedAt = omGroupReceivedAt(group);
  return `
    <div class="workflow-date-stack">
      <strong>${submittedAt ? compactDateTime(submittedAt) : "-"}</strong>
      <span>Submitted</span>
      <strong>${receivedAt ? compactDateTime(receivedAt) : "-"}</strong>
      <span>OM received</span>
    </div>`;
}
// @end-legacy-unit 1353

// @legacy-unit 1354 16338
export function omSubmissionPackageRows(row = {}) {
  const packageId = omSubmissionPackageId(row);
  return omInternalRows().map(applyOmResponsibility)
    .filter((item) => omSubmissionPackageId(item) === packageId)
    .sort((left, right) => `${omSubmissionItemKey(left)} ${left.id || ""}`.localeCompare(`${omSubmissionItemKey(right)} ${right.id || ""}`));
}
// @end-legacy-unit 1354

// @legacy-unit 1355 16345
export function omRequestIdCell(group) {
  const rows = group.rows || [];
  const primaryRow = rows[0] || {};
  const packageRows = omSubmissionPackageRows(primaryRow);
  const ordinal = Math.max(1, packageRows.findIndex((item) => item === primaryRow || item.id === primaryRow.id) + 1);
  const packageId = omSubmissionPackageId(primaryRow);
  const packageLabel = omSubmissionPackageLabel(primaryRow);
  const ids = [...new Set(packageRows.map((row) => row.id || row.requestId).filter(Boolean))];
  const helper = packageRows.length > 1 ? `item ${ordinal}/${packageRows.length}` : "single item";
  return `
    <div class="om-request-id-stack" title="${htmlAttr(ids.join(" / ") || packageId)}">
      <strong>${htmlText(packageId)}</strong>
      <span>${htmlText(packageLabel === packageId ? helper : `${packageLabel} · ${helper}`)}</span>
    </div>`;
}
// @end-legacy-unit 1355

// @legacy-unit 1356 16361
export function omPendingOwnerHelper(group, pendingOwner) {
  if (pendingOwner === "Buyer Handoff") {
    const buyerStart = (group.rows || [])
      .map((row) => row.buyerReceivedAt || row.finalExportedAt || row.sentToBuyerAt)
      .filter(Boolean)
      .sort()[0] || "";
    if (!buyerStart) return "Buyer owns PR / PO after OM handoff";
    const days = daysBetweenDates(buyerStart);
    return `Buyer owns PR / PO · ${days}d since ${compactDateTime(buyerStart)}`;
  }
  return "Current blocker";
}
// @end-legacy-unit 1356

// @legacy-unit 1357 16374
export function omNextActionForGroup(group) {
  return workflowStatusForGroup(group, "om").nextAction;
}
// @end-legacy-unit 1357

// @legacy-unit 1358 16378
export function renderOmSubmissionExpiryMonitor() {
  const body = document.getElementById("omSubmissionExpiryRows");
  if (!body) return;
  const rows = omQuoteExpiryRows()
    .filter((row) => {
      const status = omQuoteValidity(row);
      return !omQuoteValidUntil(row) || status === "Quote Expiring Soon" || status === "Quote Expired";
    })
    .slice(0, 8);
  body.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${row.project}</td>
        <td>${omItemCell(row, { stageLabel: "Quote expiry" })}</td>
        <td>${row.pasDemandNo || "-"}</td>
        <td>${row.pasMaterialNo || "-"}</td>
        <td>${omQuoteValidUntil(row) || "-"}</td>
        <td><span class="status-pill ${statusClass(omQuoteValidity(row))}">${omQuoteValidity(row)}</span></td>
        <td><div class="reason-text">${omQuoteExpiryAction(row)}</div></td>
        <td>${itemDetailButton("request", row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-cell">No expiring or expired quote rows need attention.</td></tr>`;
}
// @end-legacy-unit 1358

export function replaceOmSubmissionRowsBinding(value) { omSubmissionRows = value; return value; }
