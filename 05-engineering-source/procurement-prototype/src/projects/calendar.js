// projects/calendar: authoritative source; see docs/module-map.md.
import {
  omProjectStageCalendarApiAuthoritative
} from "../om/state.js";
import {
  STAGES,
  currentStageForProject,
  normalizeProjectCodeLabel,
  normalizeYearProjectLabel,
  phaseKeyFromInput,
  projectConfigFor,
  projectConfigs,
  projectStageCalendarRecords
} from "./config.js";
import {
  dateOnly
} from "./dates.js";
import {
  currentProject,
  currentProjectCode
} from "./state.js";

// @legacy-unit 613 4484
export function normalizeProjectStageCalendarRecord(record = {}) {
  const yearProject = normalizeYearProjectLabel(record.yearProject || record.project || "");
  const projectCode = normalizeProjectCodeLabel(record.projectCode || record.actualProject || "");
  const phase = phaseKeyFromInput(record.phase);
  return {
    yearProject,
    projectCode,
    phase,
    lineOpenDate: dateOnly(record.lineOpenDate || record.stageDate || ""),
    updatedBy: record.updatedBy || "",
    updatedAt: record.updatedAt || "",
  };
}
// @end-legacy-unit 613

// @legacy-unit 614 4498
export function projectStageCalendarKey(record = {}) {
  const normalized = normalizeProjectStageCalendarRecord(record);
  return [normalized.yearProject, normalized.projectCode, normalized.phase].join("::");
}
// @end-legacy-unit 614

// @legacy-unit 615 4503
export function projectStageCalendarRows() {
  const rowsByKey = new Map();
  if (!omProjectStageCalendarApiAuthoritative) {
    projectConfigs.forEach((project) => {
      Object.entries(project.stageDates || {}).forEach(([phase, lineOpenDate]) => {
        const row = normalizeProjectStageCalendarRecord({
          yearProject: project.code,
          projectCode: "",
          phase,
          lineOpenDate,
          updatedBy: "System seed",
        });
        if (row.yearProject && row.phase && row.lineOpenDate) rowsByKey.set(projectStageCalendarKey(row), row);
      });
    });
  }
  projectStageCalendarRecords.forEach((record) => {
    const row = normalizeProjectStageCalendarRecord(record);
    if (row.yearProject && row.phase && row.lineOpenDate) rowsByKey.set(projectStageCalendarKey(row), row);
  });
  return [...rowsByKey.values()].sort((left, right) => (
    left.yearProject.localeCompare(right.yearProject)
    || left.projectCode.localeCompare(right.projectCode)
    || STAGES.indexOf(left.phase) - STAGES.indexOf(right.phase)
  ));
}
// @end-legacy-unit 615

// @legacy-unit 616 4530
export function projectStageCalendarLineOpenDate({ project = currentProject, projectCode = currentProjectCode, phase = currentStageForProject(project) } = {}) {
  const yearProject = normalizeYearProjectLabel(project || currentProject);
  const phaseKey = phaseKeyFromInput(phase) || currentStageForProject(yearProject);
  const normalizedProjectCode = normalizeProjectCodeLabel(projectCode || "");
  const rows = projectStageCalendarRows();
  const exact = normalizedProjectCode
    ? rows.find((row) => row.yearProject === yearProject && row.projectCode === normalizedProjectCode && row.phase === phaseKey)
    : null;
  const projectDefault = rows.find((row) => row.yearProject === yearProject && !row.projectCode && row.phase === phaseKey);
  return exact?.lineOpenDate || projectDefault?.lineOpenDate || stageDateForProject(yearProject, phaseKey);
}
// @end-legacy-unit 616

// @legacy-unit 617 4542
export function stageDateForProject(projectCode, stage) {
  return projectConfigFor(projectCode)?.stageDates?.[stage] || "";
}
// @end-legacy-unit 617

// @legacy-unit 618 4546
export function requiredDeliveryDateForProject(projectCode, stage) {
  const rawDate = stageDateForProject(projectCode, stage);
  if (!rawDate) return "";
  const date = new Date(`${rawDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - 14);
  return date.toISOString().slice(0, 10);
}
// @end-legacy-unit 618
