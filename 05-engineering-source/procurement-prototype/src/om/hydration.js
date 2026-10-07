// om/hydration: authoritative source; see docs/module-map.md.
import {
  mergeWorkflowReviewRows
} from "../approval/hydration.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  renderOmFinalExport
} from "./export-view.js";
import {
  omLeaderConsoleLastSyncedLabel,
  renderOmSubmission
} from "./progress-view.js";
import {
  omLeaderConsoleSyncedAt,
  omProjectStageCalendarApiAuthoritative,
  replaceOmLeaderConsoleSyncedAtBinding,
  replaceOmProjectStageCalendarApiAuthoritativeBinding
} from "./state.js";
import {
  procurementStatusValue
} from "./tracking-rules.js";
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  normalizeProjectStageCalendarRecord,
  projectStageCalendarKey
} from "../projects/calendar.js";
import {
  renderOmProjectStageCalendar
} from "../projects/calendar-view.js";
import {
  projectConfigFor,
  projectConfigs,
  projectStageCalendarRecords,
  projectTypeForScopeCode,
  refreshProjectCodes,
  replaceProjectConfigsBinding,
  replaceProjectStageCalendarRecordsBinding
} from "../projects/config.js";
import {
  dateOnly
} from "../projects/dates.js";
import {
  isOmRole
} from "../session/permissions.js";
import {
  currentRole
} from "../session/state.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 429 2454
export function mergeOmProjectStageCalendarRecords(records = []) {
  if (!Array.isArray(records) || !records.length) return 0;
  const rowsByKey = new Map(projectStageCalendarRecords.map((record) => [projectStageCalendarKey(record), record]));
  records.map(normalizeProjectStageCalendarRecord).forEach((record) => {
    if (!record.yearProject || !record.phase || !record.lineOpenDate) return;
    rowsByKey.set(projectStageCalendarKey(record), record);
    if (!record.projectCode) {
      replaceProjectConfigsBinding(projectConfigFor(record.yearProject)
        ? projectConfigs.map((project) => project.code === record.yearProject ? {
          ...project,
          stageDates: { ...(project.stageDates || {}), [record.phase]: record.lineOpenDate },
        } : project)
        : [...projectConfigs, { code: record.yearProject, projectType: projectTypeForScopeCode(record.yearProject) || "G", currentPhase: stageLabel(record.phase), openToUser: true, stageDates: { [record.phase]: record.lineOpenDate } }]);
    }
  });
  replaceProjectStageCalendarRecordsBinding([...rowsByKey.values()]);
  refreshProjectCodes();
  return records.length;
}
// @end-legacy-unit 429

// @legacy-unit 430 2474
export function replaceOmProjectStageCalendarRecords(records = []) {
  replaceOmProjectStageCalendarApiAuthoritativeBinding(true);
  replaceProjectStageCalendarRecordsBinding(Array.isArray(records)
    ? records.map(normalizeProjectStageCalendarRecord).filter((record) => record.yearProject && record.phase && record.lineOpenDate)
    : []);
  refreshProjectCodes();
  return projectStageCalendarRecords.length;
}
// @end-legacy-unit 430

// @legacy-unit 431 2483
export function emptyOmProcurementTrackingPatch() {
  return {
    budgetStatus: procurementStatusValue(""),
    budgetNo: "",
    prStatus: procurementStatusValue(""),
    prNo: "",
    poStatus: procurementStatusValue(""),
    buyerPoNo: "",
    poNo: "",
    purRequestNo: "",
    etaPlanDate: "",
    etaPlan: "",
    dtaActualDate: "",
    dtaActual: "",
    totalLeadTimeDays: "",
    omProcurementUpdatedAt: "",
  };
}
// @end-legacy-unit 431

// @legacy-unit 432 2502
export function normalizeOmProcurementTrackingRecord(record = {}) {
  const totalLeadTimeValue = record.totalLeadTimeDays ?? record.total_lead_time_days ?? "";
  const totalLeadTimeDays = totalLeadTimeValue === "" || totalLeadTimeValue === null || totalLeadTimeValue === undefined
    ? ""
    : clampQty(totalLeadTimeValue);
  return {
    requestId: String(record.requestId || record.request_id || "").trim(),
    budgetStatus: procurementStatusValue(record.budgetStatus || record.budget_status || ""),
    budgetNo: String(record.budgetNo || record.budget_no || "").trim(),
    prStatus: procurementStatusValue(record.prStatus || record.pr_status || ""),
    prNo: String(record.prNo || record.pr_no || "").trim(),
    poStatus: procurementStatusValue(record.poStatus || record.po_status || ""),
    buyerPoNo: String(record.buyerPoNo || record.buyer_po_no || record.poNo || record.po_no || "").trim(),
    purRequestNo: String(record.purRequestNo || record.pur_request_no || "").trim(),
    etaPlanDate: dateOnly(record.etaPlanDate || record.eta_plan_date || record.etaPlan || ""),
    dtaActualDate: dateOnly(record.dtaActualDate || record.dta_actual_date || record.dtaActual || ""),
    totalLeadTimeDays,
    omProcurementUpdatedAt: record.updatedAt || record.updated_at || "",
  };
}
// @end-legacy-unit 432

// @legacy-unit 433 2523
export function applyOmProcurementTracking(records = [], { authoritative = false } = {}) {
  const trackingById = new Map(records.map(normalizeOmProcurementTrackingRecord).filter((record) => record.requestId).map((record) => [record.requestId, record]));
  if (!trackingById.size && !authoritative) return 0;
  replaceRequestsBinding(requests.map((row) => {
    const tracking = trackingById.get(row.id);
    if (!tracking) return authoritative ? { ...row, ...emptyOmProcurementTrackingPatch() } : row;
    return {
      ...row,
      budgetStatus: tracking.budgetStatus,
      budgetNo: tracking.budgetNo,
      prStatus: tracking.prStatus,
      prNo: tracking.prNo,
      poStatus: tracking.poStatus,
      buyerPoNo: tracking.buyerPoNo,
      poNo: tracking.buyerPoNo,
      purRequestNo: tracking.purRequestNo,
      etaPlanDate: tracking.etaPlanDate,
      etaPlan: tracking.etaPlanDate,
      dtaActualDate: tracking.dtaActualDate,
      dtaActual: tracking.dtaActualDate,
      totalLeadTimeDays: tracking.totalLeadTimeDays,
      omProcurementUpdatedAt: tracking.omProcurementUpdatedAt,
    };
  }));
  return trackingById.size;
}
// @end-legacy-unit 433

// @legacy-unit 434 2550
export async function hydrateOmProjectStageCalendar({ silent = true, role = currentRole } = {}) {
  if (!apiModeEnabled() || !isOmRole(role)) return 0;
  try {
    const payload = await apiRequest("/api/om/project-stage-calendar");
    const count = replaceOmProjectStageCalendarRecords(payload.records || []);
    renderOmProjectStageCalendar();
    renderDepartment();
    renderProjectStatus();
    if (!silent && count) showToast(`Loaded ${count} project stage date row${count === 1 ? "" : "s"} from OM API.`, "success");
    return count;
  } catch (error) {
    if (!silent) showToast(`Project Stage Calendar API unavailable: ${error.message}`, "error");
    return 0;
  }
}
// @end-legacy-unit 434

// @legacy-unit 435 2566
export async function hydrateOmProcurementTracking({ silent = true, role = currentRole } = {}) {
  if (!apiModeEnabled() || !isOmRole(role)) return 0;
  try {
    const payload = await apiRequest("/api/om/procurement-tracking");
    const count = applyOmProcurementTracking(payload.records || [], { authoritative: true });
    renderOmFinalExport();
    renderBuyer();
    if (!silent && count) showToast(`Loaded ${count} PR/PO/ETA tracking row${count === 1 ? "" : "s"} from OM API.`, "success");
    return count;
  } catch (error) {
    if (!silent) showToast(`OM procurement tracking API unavailable: ${error.message}`, "error");
    return 0;
  }
}
// @end-legacy-unit 435

// @legacy-unit 436 2581
export async function hydrateOmLeaderConsoleRows({ silent = true, role = currentRole } = {}) {
  if (!apiModeEnabled() || !["omLeader", "admin"].includes(role)) return 0;
  try {
    const payload = await apiRequest("/api/om/leader-console");
    const rowCount = mergeWorkflowReviewRows(payload.rows || []);
    replaceOmProjectStageCalendarRecords(payload.stageCalendar || []);
    applyOmProcurementTracking(payload.procurementTracking || [], { authoritative: true });
    replaceOmLeaderConsoleSyncedAtBinding(new Date().toISOString());
    const syncLabel = document.getElementById("omLeaderConsoleSyncedAt");
    if (syncLabel) syncLabel.textContent = omLeaderConsoleLastSyncedLabel();
    renderOmProjectStageCalendar();
    renderOmSubmission();
    renderOmFinalExport();
    if (!silent && payload.connected) showToast("OM Progress Review synced from API.", "success");
    return rowCount;
  } catch (error) {
    if (!silent) showToast(`OM Progress Review API unavailable: ${error.message}`, "error");
    return 0;
  }
}
// @end-legacy-unit 436

// @legacy-unit 437 2602
export async function hydrateOmGovernanceState(role = currentRole) {
  if (!apiModeEnabled() || !isOmRole(role)) return;
  if (["omLeader", "admin"].includes(role)) {
    await hydrateOmLeaderConsoleRows({ role });
    return;
  }
  await Promise.all([
    hydrateOmProjectStageCalendar({ role }),
    hydrateOmProcurementTracking({ role }),
  ]);
}
// @end-legacy-unit 437

export function replaceHydrateOmLeaderConsoleRowsBinding(value) { hydrateOmLeaderConsoleRows = value; return value; }
