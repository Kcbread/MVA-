// projects/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  historySelections,
  replaceHistoryResultsBinding,
  replaceHistorySearchActiveBinding,
  replaceNaturalSearchActiveBinding,
  replaceSearchResultsBinding
} from "../catalog/state.js";
import {
  currentDeptDemandPhase,
  replaceCurrentDeptDemandPhaseBinding
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  updateRequestCarryover
} from "../inventory/suggestions.js";
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  replaceSelectedProjectStatusScopeBinding
} from "../progress/state.js";
import {
  currentStageForProject,
  nextBuyStageForProject,
  projectTypeFor
} from "./config.js";
import {
  projectCodesByType,
  syncProjectControls
} from "./controls.js";
import {
  updateProjectSetup
} from "./setup.js";
import {
  currentProject,
  currentProjectType,
  replaceCurrentProjectBinding,
  replaceCurrentProjectCodeBinding,
  replaceCurrentProjectTypeBinding
} from "./state.js";

export function handleChangeProjectTypeSelect(event) {
  if (event.target.id === "projectTypeSelect") {
    replaceCurrentProjectTypeBinding(event.target.value || currentProjectType);
    const firstProject = projectCodesByType(currentProjectType, { openOnly: true })[0];
    if (firstProject) replaceCurrentProjectBinding(firstProject);
    replaceCurrentProjectCodeBinding("");
    replaceCurrentDeptDemandPhaseBinding(nextBuyStageForProject(currentProject) || currentStageForProject(currentProject));
    updateRequestCarryover({ project: currentProject, phase: currentDeptDemandPhase });
    replaceSearchResultsBinding([]);
    replaceNaturalSearchActiveBinding(false);
    replaceHistoryResultsBinding([]);
    replaceHistorySearchActiveBinding(false);
    historySelections.clear();
    syncProjectControls();
    renderDepartment();
  }
}

export function handleChangeProjectSelect(event) {
  if (event.target.id === "projectSelect") {
    replaceCurrentProjectBinding(event.target.value);
    replaceCurrentProjectTypeBinding(projectTypeFor(currentProject));
    replaceCurrentProjectCodeBinding("");
    replaceCurrentDeptDemandPhaseBinding(nextBuyStageForProject(currentProject) || currentStageForProject(currentProject));
    updateRequestCarryover({ project: currentProject, phase: currentDeptDemandPhase });
    replaceSearchResultsBinding([]);
    replaceNaturalSearchActiveBinding(false);
    replaceHistoryResultsBinding([]);
    replaceHistorySearchActiveBinding(false);
    historySelections.clear();
    syncProjectControls();
    renderDepartment();
  }
}

export function handleChangeProjectCodeInput(event) {
  if (event.target.id === "projectCodeInput") {
    replaceCurrentProjectCodeBinding(String(event.target.value || "").trim());
    renderDepartment();
  }
}

export function handleChangeProjectStatusProjectTypeFilter(event) {
  if ([
    "projectStatusProjectTypeFilter",
    "projectStatusProjectFilter",
    "projectStatusProjectCodeFilter",
    "projectStatusLineFilter",
    "projectStatusPhaseFilter",
    "projectStatusLineCount",
    "projectStatusViewMode",
  ].includes(event.target.id)) {
    replaceSelectedProjectStatusScopeBinding({ requestId: "", unit: "", mode: "mfg" });
    renderProjectStatus();
  }
}

export function handleChangeProjectPhaseCode(projectPhaseCode, event) {
  if (projectPhaseCode) updateProjectSetup(projectPhaseCode, "currentPhase", event.target.value);
}

export function handleChangeProjectTypeCode(projectTypeCode, event) {
  if (projectTypeCode) updateProjectSetup(projectTypeCode, "projectType", event.target.value);
}
