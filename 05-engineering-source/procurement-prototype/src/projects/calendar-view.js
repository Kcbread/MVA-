// projects/calendar-view: authoritative source; see docs/module-map.md.
import {
  renderManagerStageTracking
} from "../cost/stage-view.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  renderOmSubmission
} from "../om/progress-view.js";
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  normalizeProjectStageCalendarRecord,
  projectStageCalendarKey,
  projectStageCalendarRows
} from "./calendar.js";
import {
  currentStageForProject,
  normalizeProjectCodeLabel,
  normalizeYearProjectLabel,
  phaseKeyFromInput,
  projectCodeOptionsForScope,
  projectConfigFor,
  projectConfigs,
  projectStageCalendarRecords,
  projectTypeFor,
  projectTypeForScopeCode,
  refreshProjectCodes,
  replaceProjectConfigsBinding,
  replaceProjectStageCalendarRecordsBinding
} from "./config.js";
import {
  syncProjectControls
} from "./controls.js";
import {
  dateOnly,
  requiredDeliveryDateFollowStageDate
} from "./dates.js";
import {
  renderProjectSetup
} from "./setup.js";
import {
  currentProject
} from "./state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  isOmLeaderRole
} from "../session/permissions.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1361 16430
export function canMaintainProjectStageCalendar() {
  return isOmLeaderRole();
}
// @end-legacy-unit 1361

// @legacy-unit 1362 16434
export function omStageCalendarYearProjectOptions() {
  return [...new Set(projectConfigs.map((project) => project.code).filter(Boolean))];
}
// @end-legacy-unit 1362

// @legacy-unit 1363 16438
export function syncOmStageCalendarControls() {
  const yearSelect = document.getElementById("omStageCalendarYearProject");
  const projectSelect = document.getElementById("omStageCalendarProjectCode");
  const phaseInput = document.getElementById("omStageCalendarPhase");
  const dateInput = document.getElementById("omStageCalendarLineOpenDate");
  const saveButton = document.querySelector("[data-action='saveOmStageCalendar']");
  if (!yearSelect || !projectSelect || !phaseInput || !dateInput) return;
  const yearOptions = omStageCalendarYearProjectOptions();
  const selectedYear = normalizeYearProjectLabel(yearSelect.value || currentProject || yearOptions[0] || "");
  yearSelect.innerHTML = yearOptions.map((project) => `<option value="${htmlAttr(project)}">${htmlText(project)}</option>`).join("");
  yearSelect.value = yearOptions.includes(selectedYear) ? selectedYear : yearOptions[0] || "";
  const projectCodes = projectCodeOptionsForScope({
    projectType: projectTypeFor(yearSelect.value),
    yearProject: yearSelect.value,
  });
  const selectedProjectCode = normalizeProjectCodeLabel(projectSelect.value || "");
  projectSelect.innerHTML = [
    `<option value="">All project codes</option>`,
    ...projectCodes.map((code) => `<option value="${htmlAttr(code)}">${htmlText(code)}</option>`),
  ].join("");
  projectSelect.value = projectCodes.includes(selectedProjectCode) ? selectedProjectCode : "";
  if (!phaseInput.value) phaseInput.value = stageLabel(currentStageForProject(yearSelect.value));
  const canMaintain = canMaintainProjectStageCalendar();
  [yearSelect, projectSelect, phaseInput, dateInput].forEach((input) => {
    input.disabled = !canMaintain;
  });
  if (saveButton) saveButton.disabled = !canMaintain;
}
// @end-legacy-unit 1363

// @legacy-unit 1364 16467
export function renderOmProjectStageCalendar() {
  const body = document.getElementById("omStageCalendarRows");
  if (!body) return;
  syncOmStageCalendarControls();
  const rows = projectStageCalendarRows();
  body.innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${htmlText(row.yearProject)}</td>
        <td>${row.projectCode ? htmlText(row.projectCode) : "All project codes"}</td>
        <td>${htmlText(stageLabel(row.phase))}</td>
        <td>${htmlText(row.lineOpenDate || "-")}</td>
        <td>${htmlText(requiredDeliveryDateFollowStageDate(row.lineOpenDate) || "-")}</td>
        <td>${htmlText(row.updatedBy || "System seed")}${row.updatedAt ? `<div class="reason-text">${compactDateTime(row.updatedAt)}</div>` : ""}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="empty-cell">No project stage dates have been configured yet.</td></tr>`;
}
// @end-legacy-unit 1364

// @legacy-unit 1365 16485
export async function saveOmStageCalendar() {
  if (!canMaintainProjectStageCalendar()) {
    showToast("Only OM Leader or Admin can update Project Stage Calendar.", "error");
    return;
  }
  const yearProject = normalizeYearProjectLabel(document.getElementById("omStageCalendarYearProject")?.value || "");
  const projectCode = normalizeProjectCodeLabel(document.getElementById("omStageCalendarProjectCode")?.value || "");
  const phase = phaseKeyFromInput(document.getElementById("omStageCalendarPhase")?.value || "");
  const lineOpenDate = dateOnly(document.getElementById("omStageCalendarLineOpenDate")?.value || "");
  if (!yearProject || !phase || !lineOpenDate) {
    showToast("Year Project, Phase, and Line Open Date are required.", "error");
    return;
  }
  const record = {
    yearProject,
    projectCode,
    phase,
    lineOpenDate,
    updatedBy: roleProfiles[currentRole]?.name || "OM Leader",
    updatedAt: new Date().toISOString(),
  };
  if (apiModeEnabled()) {
    try {
      const payload = await apiRequest("/api/om/project-stage-calendar", { method: "PUT", body: record });
      Object.assign(record, normalizeProjectStageCalendarRecord(payload.record || record));
    } catch (error) {
      showToast(`Project Stage Calendar API save failed: ${error.message}`, "error");
    }
  }
  const key = projectStageCalendarKey(record);
  replaceProjectStageCalendarRecordsBinding([
    record,
    ...projectStageCalendarRecords.filter((row) => projectStageCalendarKey(row) !== key),
  ]);
  replaceProjectConfigsBinding(projectConfigFor(yearProject)
    ? projectConfigs.map((project) => project.code === yearProject ? {
      ...project,
      stageDates: { ...(project.stageDates || {}), [phase]: lineOpenDate },
    } : project)
    : [...projectConfigs, { code: yearProject, projectType: projectTypeForScopeCode(yearProject) || "G", currentPhase: stageLabel(phase), openToUser: true, stageDates: { [phase]: lineOpenDate } }]);
  refreshProjectCodes();
  syncProjectControls();
  renderOmSubmission();
  renderDepartment();
  renderProjectSetup();
  renderManagerStageTracking();
  renderProjectStatus();
  showToast(`Project Stage Calendar saved: ${yearProject}${projectCode ? ` / ${projectCode}` : ""} ${stageLabel(phase)} opens ${lineOpenDate}.`, "success");
}
// @end-legacy-unit 1365

// @legacy-unit 1366 16535
export function openOmStageCalendarSetup() {
  const panel = document.querySelector(".om-stage-calendar-utility");
  if (!panel || panel.hidden) return;
  panel.open = true;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  window.requestAnimationFrame(() => document.getElementById("omStageCalendarYearProject")?.focus({ preventScroll: true }));
}
// @end-legacy-unit 1366
