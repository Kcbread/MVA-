// projects/review-context: authoritative source; see docs/module-map.md.
import {
  priceReviewProjectRowsForRole
} from "../approval/analysis-scope.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  approvalReviewRoleForMode,
  approvalReviewStateForRole,
  updateApprovalReviewState
} from "../approval/navigation.js";
import {
  renderPriceReview
} from "../approval/price-review.js";
import {
  syncApprovalQuantityReviewTabState
} from "../approval/quantity-scope.js";
import {
  managerRows
} from "../approval/queues.js";
import {
  approvalQuantityReviewTab,
  replaceApprovalQuantityReviewTabBinding,
  replaceSelectedManagerProjectContextBinding,
  replaceSelectedManagerRequestIdBinding,
  replaceSelectedPriceReviewProjectContextBinding,
  replaceSelectedPriceReviewRequestIdBinding,
  replaceShouldScrollPriceReviewInlineAnalysisBinding,
  selectedManagerProjectContext,
  selectedManagerRequestId,
  selectedPriceReviewProjectContext,
  selectedPriceReviewRequestId,
  shouldScrollPriceReviewInlineAnalysis
} from "../approval/state.js";
import {
  currentRole
} from "../session/state.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  currentPriceReviewTab,
  currentView
} from "../shell/state.js";

// @legacy-unit 801 7114
export function projectContextRowProject(row = {}) {
  return String(row?.project || row?.targetProject || "").trim();
}
// @end-legacy-unit 801

// @legacy-unit 802 7118
export function projectContextProjectOptions(rows = []) {
  return [...new Set((Array.isArray(rows) ? rows : []).map(projectContextRowProject).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}
// @end-legacy-unit 802

// @legacy-unit 803 7123
export function projectContextSelectedProject(mode = "inline") {
  const role = approvalReviewRoleForMode(mode);
  const stateProject = approvalReviewStateForRole(role)?.selectedProject;
  if (stateProject) return stateProject;
  return mode === "managerAuthorized" ? selectedManagerProjectContext : selectedPriceReviewProjectContext;
}
// @end-legacy-unit 803

// @legacy-unit 804 7130
export function setProjectContextSelectedProject(mode = "inline", project = "") {
  const nextProject = project || "";
  if (mode === "managerAuthorized") replaceSelectedManagerProjectContextBinding(nextProject);
  else replaceSelectedPriceReviewProjectContextBinding(nextProject);
  updateApprovalReviewState(approvalReviewRoleForMode(mode), { selectedProject: nextProject });
}
// @end-legacy-unit 804

// @legacy-unit 805 7137
export function syncProjectContextFromRow(mode = "inline", row = null) {
  const project = projectContextRowProject(row);
  if (project) setProjectContextSelectedProject(mode, project);
  return project;
}
// @end-legacy-unit 805

// @legacy-unit 806 7143
export function activeProjectContext({ mode = "inline", scope = null, rows = [] } = {}) {
  const options = projectContextProjectOptions(rows);
  const selectedProject = projectContextSelectedProject(mode);
  if (selectedProject && options.includes(selectedProject)) return selectedProject;
  const scopedProject = projectContextRowProject(scope?.row || scope);
  if (scopedProject && options.includes(scopedProject)) return scopedProject;
  return options[0] || "";
}
// @end-legacy-unit 806

// @legacy-unit 807 7152
export function projectContextRowsForProject(rows = [], project = "") {
  const sourceRows = Array.isArray(rows) ? rows : [];
  return project ? sourceRows.filter((row) => projectContextRowProject(row) === project) : sourceRows;
}
// @end-legacy-unit 807

// @legacy-unit 808 7157
export function projectContextSwitcherHtml({ mode = "inline", rows = [], activeProject = "" } = {}) {
  const projects = projectContextProjectOptions(rows);
  if (projects.length <= 1) return "";
  return `
    <div class="project-context-switcher" role="group" aria-label="Project Context project switcher">
      <strong>Project</strong>
      <div class="project-context-switcher-list">
        ${projects.map((project) => `
          <button class="project-context-chip ${project === activeProject ? "active" : ""}" type="button" data-project-context-mode="${htmlAttr(mode)}" data-project-context-project="${htmlAttr(project)}" aria-pressed="${project === activeProject ? "true" : "false"}">
            ${htmlText(project)}
          </button>
        `).join("")}
      </div>
    </div>`;
}
// @end-legacy-unit 808

// @legacy-unit 809 7173
export function firstProjectContextRow(rows = [], project = "") {
  return (Array.isArray(rows) ? rows : []).find((row) => !project || projectContextRowProject(row) === project) || null;
}
// @end-legacy-unit 809

// @legacy-unit 810 7177
export function applyProjectContextSwitch(mode = "inline", project = "") {
  const nextProject = String(project || "").trim();
  setProjectContextSelectedProject(mode, nextProject);
  replaceApprovalQuantityReviewTabBinding("dashboard");
  syncApprovalQuantityReviewTabState();
  if (mode === "managerAuthorized" || currentView === "manager") {
    const rows = managerRows();
    if (nextProject) {
      const current = rows.find((row) => row.id === selectedManagerRequestId);
      if (!current || projectContextRowProject(current) !== nextProject) {
        replaceSelectedManagerRequestIdBinding(firstProjectContextRow(rows, nextProject)?.id || selectedManagerRequestId);
      }
    }
    renderManager();
    return;
  }
  const rows = priceReviewProjectRowsForRole(currentRole);
  if (nextProject) {
    const current = rows.find((row) => row.id === selectedPriceReviewRequestId);
    if (!current || projectContextRowProject(current) !== nextProject) {
      replaceSelectedPriceReviewRequestIdBinding(firstProjectContextRow(rows, nextProject)?.id || selectedPriceReviewRequestId);
    }
  }
  replaceShouldScrollPriceReviewInlineAnalysisBinding(currentPriceReviewTab === "pending" && currentRole === "dri");
  renderPriceReview();
}
// @end-legacy-unit 810

export function replaceActiveProjectContextBinding(value) { activeProjectContext = value; return value; }

export function replaceProjectContextRowsForProjectBinding(value) { projectContextRowsForProject = value; return value; }
