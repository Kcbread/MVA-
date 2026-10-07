// projects/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  replaceSelectedProjectStatusScopeBinding
} from "../progress/state.js";
import {
  currentView
} from "../shell/state.js";
import {
  applyProjectContextSwitch
} from "./review-context.js";
import {
  saveProjectSetup,
  updateProjectSetup
} from "./setup.js";

export function handleClickProjectStatusCell(projectStatusCell) {
  if (projectStatusCell) {
    replaceSelectedProjectStatusScopeBinding({
      requestId: projectStatusCell.dataset.projectStatusCell || "",
      unit: projectStatusCell.dataset.projectStatusUnit || "",
      mode: projectStatusCell.dataset.projectStatusMode || "mfg",
    });
    renderProjectStatus();
  }
}

export function handleClickSaveAndOpenProject(action) {
  if (action === "saveAndOpenProject") saveProjectSetup(true);
}

export function handleClickProjectContextButton(projectContextButton) {
  if (projectContextButton) {
    applyProjectContextSwitch(
      projectContextButton.dataset.projectContextMode || (currentView === "manager" ? "managerAuthorized" : "inline"),
      projectContextButton.dataset.projectContextProject || "",
    );
    return true;
  }
}

export function handleClickProjectAccessButton(projectAccessButton) {
  if (projectAccessButton) updateProjectSetup(projectAccessButton.dataset.projectConfigAccess, "openToUser", projectAccessButton.dataset.projectConfigOpen === "true");
}
