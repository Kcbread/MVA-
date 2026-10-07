// projects/controls: authoritative source; see docs/module-map.md.
import {
  OM_RESPONSIBILITY_MASTER,
  PROJECT_TYPES
} from "../catalog/taxonomy.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  requests
} from "../demand/state.js";
import {
  omAssignees
} from "../om/state.js";
import {
  projectCodesForYearProject,
  projectConfigs,
  refreshProjectCodes
} from "./config.js";
import {
  currentProject,
  currentProjectCode,
  currentProjectType,
  replaceCurrentProjectBinding,
  replaceCurrentProjectCodeBinding,
  replaceCurrentProjectTypeBinding
} from "./state.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  HANDOFF_SENT_TO_OM,
  HANDOFF_WAITING_PAS
} from "../workflow/status-constants.js";

// @legacy-unit 611 4463
export function syncProjectCodeInput() {
  const select = document.getElementById("projectCodeInput");
  const codes = projectCodesForYearProject(currentProject);
  if (currentProjectType === "Non-G" && codes.length === 1) replaceCurrentProjectCodeBinding(codes[0]);
  else if (!codes.includes(currentProjectCode)) replaceCurrentProjectCodeBinding("");
  if (select) {
    select.innerHTML = codes.length
      ? [
        `<option value="">All project codes</option>`,
        ...codes.map((code) => `<option value="${htmlAttr(code)}">${htmlText(code)}</option>`),
      ].join("")
      : `<option value="">No project code</option>`;
    if (select.value !== currentProjectCode) select.value = currentProjectCode;
  }
  return currentProjectCode;
}
// @end-legacy-unit 611

// @legacy-unit 612 4480
export function projectTypesForFilter() {
  return PROJECT_TYPES;
}
// @end-legacy-unit 612

// @legacy-unit 625 4601
export function allProjectCodes() {
  return projectConfigs.map((project) => project.code);
}
// @end-legacy-unit 625

// @legacy-unit 626 4605
export function projectCodesByType(type, { openOnly = false } = {}) {
  return projectConfigs
    .filter((project) => (!type || project.projectType === type) && (!openOnly || project.openToUser))
    .map((project) => project.code);
}
// @end-legacy-unit 626

// @legacy-unit 627 4611
export function openProjectCodes() {
  return projectConfigs.filter((project) => project.openToUser).map((project) => project.code);
}
// @end-legacy-unit 627

// @legacy-unit 628 4615
export function syncProjectTypeSelect(id, { includeAll = false, allLabel = "All project types" } = {}) {
  const select = document.getElementById(id);
  if (!select) return "";
  const previousValue = select.value;
  select.innerHTML = [
    includeAll ? `<option value="">${allLabel}</option>` : "",
    ...projectTypesForFilter().map((type) => `<option value="${type}">${type}</option>`),
  ].join("");
  if (projectTypesForFilter().includes(previousValue) || (includeAll && previousValue === "")) select.value = previousValue;
  else select.value = includeAll ? "" : currentProjectType;
  return select.value;
}
// @end-legacy-unit 628

// @legacy-unit 629 4628
export function syncOmOwnerFilter() {
  const select = document.getElementById("omOwnerFilter");
  if (!select) return "";
  const previousValue = select.value;
  const owners = [...new Set(OM_RESPONSIBILITY_MASTER.map((entry) => entry.owner).filter(Boolean))].sort();
  select.innerHTML = [`<option value="">All owners</option>`, ...owners.map((owner) => `<option value="${owner}">${owner}</option>`)].join("");
  select.value = owners.includes(previousValue) ? previousValue : "";
  return select.value;
}
// @end-legacy-unit 629

// @legacy-unit 630 4638
export function syncOmQuoteExpiryAssigneeFilter() {
  const select = document.getElementById("omQuoteExpiryAssigneeFilter");
  if (!select) return "";
  const previousValue = select.value;
  select.innerHTML = [
    `<option value="">All assignees</option>`,
    `<option value="unassigned">Unassigned</option>`,
    ...omAssignees.map((user) => `<option value="${user.id}">${user.name} · ${user.role === "omLeader" ? "Leader" : "Member"}</option>`),
  ].join("");
  const values = ["", "unassigned", ...omAssignees.map((user) => user.id)];
  select.value = values.includes(previousValue) ? previousValue : "";
  return select.value;
}
// @end-legacy-unit 630

// @legacy-unit 631 4652
export function syncProjectSelect(id, { includeAll = false, allLabel = "All projects", openOnly = false, projectType = "" } = {}) {
  const select = document.getElementById(id);
  if (!select) return "";
  const previousValue = select.value;
  const projects = projectType ? projectCodesByType(projectType, { openOnly }) : openOnly ? openProjectCodes() : allProjectCodes();
  select.innerHTML = [
    includeAll ? `<option value="">${allLabel}</option>` : "",
    ...projects.map((project) => `<option value="${project}">${project}</option>`),
  ].join("");
  if (projects.includes(previousValue) || (includeAll && previousValue === "")) {
    select.value = previousValue;
  } else {
    select.value = includeAll ? "" : projects[0] || "";
  }
  return select.value;
}
// @end-legacy-unit 631

// @legacy-unit 632 4669
export function omProjectPackageCodes() {
  const codes = new Set(["P26", ...allProjectCodes()]);
  requests.forEach((row) => {
    const relevant = row.status === "Approved"
      || row.procurementStatus === HANDOFF_SENT_TO_OM
      || row.procurementStatus === HANDOFF_WAITING_PAS
      || row.omStage
      || row.demoOmSeed;
    if (relevant && row.project) codes.add(row.project);
  });
  purchaseRecords.forEach((row) => {
    if (row.project) codes.add(row.project);
  });
  return [...codes].filter(Boolean).sort((left, right) => left === "P26" ? -1 : right === "P26" ? 1 : left.localeCompare(right));
}
// @end-legacy-unit 632

// @legacy-unit 633 4685
export function syncOmProjectPackageSelect(id, { allLabel = "All project packages" } = {}) {
  const select = document.getElementById(id);
  if (!select) return "";
  const previousValue = select.value;
  const projects = omProjectPackageCodes();
  select.innerHTML = [
    `<option value="">${allLabel}</option>`,
    ...projects.map((project) => `<option value="${project}">${project}</option>`),
  ].join("");
  select.value = projects.includes(previousValue) ? previousValue : "";
  return select.value;
}
// @end-legacy-unit 633

// @legacy-unit 634 4698
export function syncProjectControls() {
  refreshProjectCodes();
  replaceCurrentProjectTypeBinding(syncProjectTypeSelect("projectTypeSelect") || currentProjectType);
  const userProject = syncProjectSelect("projectSelect", { openOnly: true, projectType: currentProjectType });
  if (!projectCodesByType(currentProjectType, { openOnly: true }).includes(currentProject)) replaceCurrentProjectBinding(userProject || currentProject);
  if (document.getElementById("projectSelect")) document.getElementById("projectSelect").value = currentProject;
  syncProjectCodeInput();
  syncProjectTypeSelect("managerDemandProjectTypeFilter", { includeAll: true });
  syncProjectSelect("historySourceProject", { includeAll: true, allLabel: "All source projects" });
  syncProjectSelect("historyPackageSourceProject", { includeAll: true, allLabel: "All source projects" });
  syncProjectSelect("managerProjectFilter", { includeAll: true });
  syncProjectSelect("managerCostProjectFilter", { includeAll: true });
  syncProjectSelect("managerStageProjectFilter", { includeAll: true });
  syncProjectSelect("managerDashboardProjectFilter", { includeAll: true });
  syncProjectSelect("handoffProjectFilter", { includeAll: true });
  syncOmProjectPackageSelect("omDemandProjectFilter");
  syncOmOwnerFilter();
  syncOmProjectPackageSelect("omProjectFilter");
  syncOmProjectPackageSelect("omQuoteExpiryProjectFilter");
  syncOmQuoteExpiryAssigneeFilter();
  syncProjectSelect("omUserConfirmProjectFilter", { includeAll: true, allLabel: "All project packages" });
  syncOmProjectPackageSelect("omFinalExportProjectFilter");
  syncProjectSelect("omHistoryProjectFilter", { includeAll: true });
  syncProjectSelect("buyerProjectFilter", { includeAll: true });
}
// @end-legacy-unit 634
