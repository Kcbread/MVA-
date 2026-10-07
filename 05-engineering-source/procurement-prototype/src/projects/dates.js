// projects/dates: authoritative source; see docs/module-map.md.
import {
  stationBreakdownPhaseKey,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  dateOfRequestForRow
} from "../demand/records.js";
import {
  purposeDateModule
} from "../infrastructure/module-adapters.js";
import {
  projectStageCalendarLineOpenDate
} from "./calendar.js";
import {
  DEFAULT_PURPOSE_LOCATION,
  PURPOSE_LOCATION_OPTIONS,
  STAGES,
  currentStageForProject,
  projectCodeForRow
} from "./config.js";
import {
  currentProject,
  currentProjectCode
} from "./state.js";

// @legacy-unit 508 3496
export function normalizePurposeLocation(value = "") {
  return purposeDateModule().normalizePurposeLocation?.(value)
    || (PURPOSE_LOCATION_OPTIONS.includes(String(value || "").trim().toUpperCase()) ? String(value || "").trim().toUpperCase() : DEFAULT_PURPOSE_LOCATION);
}
// @end-legacy-unit 508

// @legacy-unit 509 3501
export function dateOnly(value = "") {
  if (purposeDateModule().dateOnly) return purposeDateModule().dateOnly(value);
  if (!value) return "";
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}
// @end-legacy-unit 509

// @legacy-unit 510 3508
export function requiredDeliveryDateFollowStageDate(lineOpenDate = "") {
  if (purposeDateModule().requiredDeliveryDateFollowStageDate) return purposeDateModule().requiredDeliveryDateFollowStageDate(lineOpenDate);
  const normalized = dateOnly(lineOpenDate);
  if (!normalized) return "";
  const date = new Date(`${normalized}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 14);
  return date.toISOString().slice(0, 10);
}
// @end-legacy-unit 510

// @legacy-unit 511 3517
export function givenLeadTimeDays(dateOfRequest = "", lineOpenDate = "") {
  if (purposeDateModule().givenLeadTimeDays) return purposeDateModule().givenLeadTimeDays(dateOfRequest, lineOpenDate);
  const start = dateOnly(dateOfRequest);
  const end = requiredDeliveryDateFollowStageDate(lineOpenDate);
  if (!start || !end) return null;
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000);
}
// @end-legacy-unit 511

// @legacy-unit 619 4555
export function requestPhaseLineOpenDate({ project = currentProject, projectCode = currentProjectCode, phase = currentStageForProject(project) } = {}) {
  return dateOnly(projectStageCalendarLineOpenDate({ project, projectCode, phase }));
}
// @end-legacy-unit 619

// @legacy-unit 620 4559
export function requestPhaseLineOpenDateSource() {
  return "OM Leader Project Stage Calendar";
}
// @end-legacy-unit 620

// @legacy-unit 621 4563
export function requestPhaseLineOpenDateMap(project = currentProject, projectCode = currentProjectCode) {
  return Object.fromEntries(STAGES.map((phase) => [phase, requestPhaseLineOpenDate({ project, projectCode, phase })]));
}
// @end-legacy-unit 621

// @legacy-unit 622 4567
export function requestRowRequestedPhases(row = {}) {
  const phases = stationBreakdownRowsForDetail(row)
    .filter((item) => stationBreakdownRowTotal(item) > 0)
    .map(stationBreakdownPhaseKey)
    .filter((phase) => STAGES.includes(phase));
  const unique = [...new Set(phases)];
  if (unique.length) return unique;
  return [row.phase || row.defaultPhase || currentStageForProject(row.project || currentProject)].filter(Boolean);
}
// @end-legacy-unit 622

// @legacy-unit 623 4577
export function requestDatePlanByPhase(row = {}, dateOfRequest = dateOfRequestForRow(row)) {
  return Object.fromEntries(requestRowRequestedPhases(row).map((phase) => {
    const project = row.project || row.yearProject || currentProject;
    const projectCode = row.projectCode || projectCodeForRow(row) || currentProjectCode;
    const lineOpenDate = requestPhaseLineOpenDate({ project, projectCode, phase });
    return [phase, {
      phase,
      lineOpenDate,
      requiredDeliveryDateFollowStageDate: requiredDeliveryDateFollowStageDate(lineOpenDate),
      givenLeadTimeDays: givenLeadTimeDays(dateOfRequest, lineOpenDate),
      source: requestPhaseLineOpenDateSource(),
    }];
  }));
}
// @end-legacy-unit 623

// @legacy-unit 624 4592
export function primaryRequestPhaseLineOpenDate(row = {}) {
  const phase = requestRowRequestedPhases(row)[0] || currentStageForProject(row.project || currentProject);
  return requestPhaseLineOpenDate({
    project: row.project || row.yearProject || currentProject,
    projectCode: row.projectCode || projectCodeForRow(row) || currentProjectCode,
    phase,
  });
}
// @end-legacy-unit 624
