// projects/setup: authoritative source; see docs/module-map.md.
import {
  PROJECT_TYPES
} from "../catalog/taxonomy.js";
import {
  renderManagerCostView
} from "../cost/pricing.js";
import {
  renderManagerStageTracking
} from "../cost/stage-view.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  renderProcurement
} from "../handoff/view.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  requiredDeliveryDateForProject,
  stageDateForProject
} from "./calendar.js";
import {
  currentPhaseLabelForProject,
  currentStageForProject,
  nextBuyPhaseLabelForProject,
  normalizeProjectCode,
  projectConfigFor,
  projectConfigs,
  refreshProjectCodes,
  replaceProjectConfigsBinding
} from "./config.js";
import {
  syncProjectControls
} from "./controls.js";
import {
  currentProject,
  replaceCurrentProjectBinding
} from "./state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  renderSourcing
} from "../sourcing/rfq.js";

// @legacy-unit 905 9064
export function renderProjectSetup() {
  const phaseInput = document.getElementById("projectSetupPhase");
  const rowsTarget = document.getElementById("projectSetupRows");
  if (!phaseInput || !rowsTarget) return;
  rowsTarget.innerHTML = projectConfigs.length
    ? projectConfigs.map((project) => `
      <tr>
        <td>
          <select data-project-config-type="${project.code}">
            ${PROJECT_TYPES.map((type) => `<option value="${type}" ${project.projectType === type ? "selected" : ""}>${type}</option>`).join("")}
          </select>
        </td>
        <td>${project.code}</td>
        <td>
          <input type="text" value="${currentPhaseLabelForProject(project.code)}" placeholder="Example: P1.0, EVT-2" data-project-config-phase="${project.code}" />
        </td>
        <td>${stageDateForProject(project.code, currentStageForProject(project.code)) || "-"}</td>
        <td>${requiredDeliveryDateForProject(project.code, currentStageForProject(project.code)) || "-"}</td>
        <td>${nextBuyPhaseLabelForProject(project.code)}</td>
        <td>
          <span class="status-pill ${project.openToUser ? "ready-for-handoff" : "draft"}">${project.openToUser ? "Open to Requester" : "Draft"}</span>
        </td>
        <td><button class="mini ${project.openToUser ? "return" : "approve"}" data-project-config-access="${project.code}" data-project-config-open="${project.openToUser ? "false" : "true"}">${project.openToUser ? "Close" : "Open"}</button></td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty-cell">No projects have been configured yet.</td></tr>`;
}
// @end-legacy-unit 905

// @legacy-unit 906 9091
export function saveProjectSetup(openToUser = false) {
  const codeInput = document.getElementById("projectSetupCode");
  const phaseInput = document.getElementById("projectSetupPhase");
  const typeInput = document.getElementById("projectSetupType");
  const code = normalizeProjectCode(codeInput?.value);
  const currentPhase = String(phaseInput?.value || "").trim();
  const projectType = PROJECT_TYPES.includes(typeInput?.value) ? typeInput.value : "G";
  if (!code) {
    showToast("Project Code is required.", "error");
    return;
  }
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    showToast("Project Code can only use letters, numbers, hyphen, or underscore.", "error");
    return;
  }
  if (!currentPhase) {
    showToast("Current Phase is required.", "error");
    return;
  }

  const exists = projectConfigFor(code);
  replaceProjectConfigsBinding(exists
    ? projectConfigs.map((project) => project.code === code ? { ...project, projectType, currentPhase, openToUser } : project)
    : [...projectConfigs, { code, projectType, currentPhase, openToUser, stageDates: {} }]);
  refreshProjectCodes();
  if (openToUser) replaceCurrentProjectBinding(code);
  if (codeInput) codeInput.value = "";
  if (phaseInput) phaseInput.value = "";
  syncProjectControls();
  renderProjectSetup();
  renderDepartment();
  renderManagerStageTracking();
  renderManagerCostView();
  renderProcurement();
  renderOmPurchasing();
  renderProjectStatus();
  renderSourcing();
  renderBuyer();
  showToast(openToUser ? `${code} saved and opened to Requester.` : `${code} saved as draft project.`, "success");
}
// @end-legacy-unit 906

// @legacy-unit 907 9132
export function updateProjectSetup(code, field, value) {
  replaceProjectConfigsBinding(projectConfigs.map((project) => {
    if (project.code !== code) return project;
    return { ...project, [field]: field === "openToUser" ? Boolean(value) : value };
  }));
  refreshProjectCodes();
  syncProjectControls();
  renderProjectSetup();
  renderDepartment();
  renderManagerStageTracking();
  renderManagerCostView();
  renderProcurement();
  renderOmPurchasing();
  renderProjectStatus();
  renderSourcing();
  renderBuyer();
  showToast(`${code} project setup updated.`, "success");
}
// @end-legacy-unit 907
