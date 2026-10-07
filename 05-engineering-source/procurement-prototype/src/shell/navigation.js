// shell/navigation: authoritative source; see docs/module-map.md.
import {
  refreshSapPoRawImportStatus
} from "../admin/import-view.js";
import {
  refreshAdminSetup,
  renderAdminSetup
} from "../admin/setup.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  approvalReviewConfigForRole,
  approvalReviewSurfaceModule,
  approvalReviewTabFromManagerTab,
  isManagerReviewRole,
  updateApprovalReviewState
} from "../approval/navigation.js";
import {
  renderPriceReview
} from "../approval/price-review.js";
import {
  currentDemandAnalysisTab,
  replaceCurrentDemandAnalysisTabBinding,
  replaceSelectedPriceReviewRequestIdBinding,
  selectedPriceReviewRequestId
} from "../approval/state.js";
import {
  renderManagerDemandCostDashboard
} from "../cost/dashboard-view.js";
import {
  renderManagerQuantityMatrix
} from "../cost/matrix-view.js";
import {
  currencyDisplay
} from "../cost/state.js";
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
  renderOmFinalExport
} from "../om/export-view.js";
import {
  renderOmSubmission
} from "../om/progress-view.js";
import {
  currentOmHandoffView,
  currentOmTab,
  replaceCurrentOmHandoffViewBinding,
  replaceCurrentOmTabBinding
} from "../om/state.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  renderProjectStatus
} from "../progress/dashboard.js";
import {
  renderOmProjectStageCalendar
} from "../projects/calendar-view.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  applyRequesterPersonaContext,
  currentRequesterPersona,
  findRequesterPersonaByIdentifier
} from "../session/persona.js";
import {
  sessionUserFromRole
} from "../session/session.js";
import {
  currentRequesterPersonaId,
  currentRole,
  currentSessionUser,
  currentUserRole,
  replaceCurrentRequesterPersonaIdBinding,
  replaceCurrentRoleBinding,
  replaceCurrentUserRoleBinding
} from "../session/state.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  currentDeptTab,
  currentHandoffTab,
  currentManagerTab,
  currentPriceReviewQueue,
  currentPriceReviewTab,
  currentView,
  replaceCurrentDeptTabBinding,
  replaceCurrentHandoffTabBinding,
  replaceCurrentManagerTabBinding,
  replaceCurrentPriceReviewQueueBinding,
  replaceCurrentPriceReviewTabBinding,
  replaceCurrentViewBinding
} from "./state.js";
import {
  renderSourcing
} from "../sourcing/rfq.js";

// @legacy-unit 68 527
export let pageTitles;
export function initializePageTitlesBinding() {
  pageTitles = {
  department: "Requester Workspace",
  projectStatus: "Demand Progress Tracking",
  omLeaderProgress: "OM Progress Review",
  projectStageCalendar: "Project Stage Calendar",
  manager: "Cost Review",
  procurement: "MFG Demand Coordination",
  om: "OM Purchasing",
  priceReview: "Price Review",
  sourcing: "Sourcing RFQ",
  buyer: "Buyer PR / PO",
  adminSetup: "Access & Approval Setup",
};
}
// @end-legacy-unit 68

// @legacy-unit 69 541
export let roleWorkspaceConfigs;
export function initializeRoleWorkspaceConfigsBinding() {
  roleWorkspaceConfigs = {
  requester: {
    mainViews: ["department", "projectStatus"],
  },
  manager: {
    mainViews: ["manager", "projectStatus"],
    defaultManagerTab: "review",
    managerTabs: ["review", "history"],
    managerTabLabels: {
      review: "Cost Review",
      history: "Review History",
    },
  },
  omLeader: {
    mainViews: ["projectStatus", "omLeaderProgress", "projectStageCalendar"],
    omTabs: [],
    labels: {},
    showOmRateUtility: false,
    showOmStageCalendar: true,
    showOmSubmissionSummary: true,
    showOmSubmissionTriage: true,
    showOmSubmissionExpiryMonitor: false,
  },
  omMember: {
    mainViews: ["om", "projectStatus"],
    defaultOmTab: "pasRequest",
    omTabs: ["pasRequest", "quoteConfirm", "quoteExpiry", "finalExport"],
    omTabLabels: {
      pasRequest: "My Intake",
      quoteConfirm: "My Quote Result",
      quoteExpiry: "Quotation DB",
      finalExport: "OM Handoff",
    },
    showOmRateUtility: true,
    showOmStageCalendar: false,
    showOmSubmissionSummary: false,
    showOmSubmissionTriage: false,
    showOmSubmissionExpiryMonitor: false,
  },
  dri: {
    mainViews: ["manager", "projectStatus"],
    defaultManagerTab: "review",
    managerTabs: ["review", "history"],
    managerTabLabels: {
      review: "Dept Review",
      history: "Review History",
    },
  },
  projectDri: {
    mainViews: ["manager", "projectStatus"],
    defaultManagerTab: "review",
    managerTabs: ["review", "history"],
    managerTabLabels: {
      review: "Budget Review",
      history: "Review History",
    },
  },
  buyer: {
    mainViews: ["buyer", "projectStatus"],
  },
  admin: {},
};
}
// @end-legacy-unit 69

// @legacy-unit 70 604
export let semanticNavigationByRole;
export function initializeSemanticNavigationByRoleBinding() {
  semanticNavigationByRole = {
  requester: [
    { group: "Requester", label: "Request Workspace", view: "department", deptTab: "request" },
    { group: "Requester", label: "Warehouse Inventory", view: "department", deptTab: "warehouse" },
    { group: "Requester", label: "Action Required", view: "department", deptTab: "needConfirmation" },
    { group: "Requester", label: "Request Status", view: "department", deptTab: "submissions" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  dri: [
    { group: "Dept DRI", label: "Dept Review", view: "manager", managerTab: "review" },
    { group: "Dept DRI", label: "Review History", view: "manager", managerTab: "history" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  manager: [
    { group: "Cost Manager", label: "Cost Review", view: "manager", managerTab: "review" },
    { group: "Cost Manager", label: "Review History", view: "manager", managerTab: "history" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  projectDri: [
    { group: "Budget Approver", label: "Budget Review", view: "manager", managerTab: "review" },
    { group: "Budget Approver", label: "Review History", view: "manager", managerTab: "history" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  omLeader: [
    { group: "OM Leader", label: "OM Progress Review", view: "omLeaderProgress" },
    { group: "OM Leader", label: "Project Stage Calendar", view: "projectStageCalendar" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  omMember: [
    { group: "OM Purchasing", label: "My Intake", view: "om", omTab: "pasRequest" },
    { group: "OM Purchasing", label: "My Quote Result", view: "om", omTab: "quoteConfirm" },
    { group: "OM Purchasing", label: "Quotation DB", view: "om", omTab: "quoteExpiry" },
    { group: "OM Purchasing", label: "OM Handoff", view: "om", omTab: "finalExport" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  buyer: [
    { group: "Buyer Handoff", label: "Buyer Handoff", view: "buyer" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  admin: [
    { group: "Governance", label: "Admin Setup", view: "adminSetup" },
    { group: "Demand", label: "Request Workspace", view: "department", deptTab: "request" },
    { group: "Demand", label: "Demand Progress Tracking", view: "projectStatus" },
    { group: "Approval", label: "Cost Review", view: "manager", managerTab: "review" },
    { group: "Approval", label: "Price Review", view: "priceReview", priceReviewTab: "pending" },
    { group: "Operations", label: "OM Progress Review", view: "omLeaderProgress" },
    { group: "Operations", label: "Project Stage Calendar", view: "projectStageCalendar" },
    { group: "Operations", label: "MFG Coordination", view: "procurement", handoffTab: "queue" },
    { group: "Operations", label: "OM Purchasing", view: "om", omTab: "pasRequest" },
    { group: "Operations", label: "Sourcing RFQ", view: "sourcing" },
    { group: "Operations", label: "Buyer Handoff", view: "buyer" },
  ],
  procurement: [
    { group: "MFG Coordination", label: "MFG Collection", view: "procurement", handoffTab: "queue" },
    { group: "MFG Coordination", label: "RFQ Follow-up", view: "procurement", handoffTab: "rfq" },
    { group: "MFG Coordination", label: "Handoff History", view: "procurement", handoffTab: "history" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  om: [
    { group: "OM Purchasing", label: "My Intake", view: "om", omTab: "pasRequest" },
    { group: "OM Purchasing", label: "My Quote Result", view: "om", omTab: "quoteConfirm" },
    { group: "OM Purchasing", label: "Quotation DB", view: "om", omTab: "quoteExpiry" },
    { group: "OM Purchasing", label: "OM Handoff", view: "om", omTab: "finalExport" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
  sourcing: [
    { group: "Sourcing", label: "Sourcing RFQ", view: "sourcing" },
    { group: "Visibility", label: "Demand Progress Tracking", view: "projectStatus" },
  ],
};
}
// @end-legacy-unit 70

// @legacy-unit 71 675
export function semanticNavigationItems(role = currentRole) {
  return semanticNavigationByRole[role] || semanticNavigationByRole.requester;
}
// @end-legacy-unit 71

// @legacy-unit 72 679
export function semanticNavigationItemIsActive(item = {}) {
  if (item.view !== currentView) return false;
  if (item.deptTab && item.deptTab !== currentDeptTab) return false;
  if (item.managerTab && item.managerTab !== currentManagerTab) return false;
  if (item.handoffTab && item.handoffTab !== currentHandoffTab) return false;
  if (item.omTab && item.omTab !== currentOmTab) return false;
  if (item.priceReviewTab && item.priceReviewTab !== currentPriceReviewTab) return false;
  return true;
}
// @end-legacy-unit 72

// @legacy-unit 73 689
export function semanticNavigationDataAttributes(item = {}) {
  return ["view", "deptTab", "managerTab", "handoffTab", "omTab", "priceReviewTab"]
    .filter((key) => item[key])
    .map((key) => `data-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}="${htmlAttr(item[key])}"`)
    .join(" ");
}
// @end-legacy-unit 73

// @legacy-unit 74 696
export function renderSemanticNavigation(role = currentRole) {
  const sidebar = document.getElementById("workflowSidebar");
  if (!sidebar) return;
  const groups = [];
  semanticNavigationItems(role).forEach((item) => {
    let group = groups.at(-1);
    if (!group || group.label !== item.group) {
      group = { label: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  sidebar.innerHTML = groups.map((group) => `
    <section class="workflow-nav-group" aria-label="${htmlAttr(group.label)}">
      <div class="workflow-nav-group-label">${htmlText(group.label)}</div>
      <div class="workflow-nav-list">
        ${group.items.map((item) => {
          const active = semanticNavigationItemIsActive(item);
          return `<button class="workflow-nav-item${active ? " active" : ""}" type="button" ${semanticNavigationDataAttributes(item)}${active ? ' aria-current="page"' : ""}>${htmlText(item.label)}</button>`;
        }).join("")}
      </div>
    </section>`).join("");
}
// @end-legacy-unit 74

// @legacy-unit 75 720
export function syncSemanticNavigationActiveState() {
  document.querySelectorAll("#workflowSidebar .workflow-nav-item").forEach((button) => {
    const active = semanticNavigationItemIsActive({
      view: button.dataset.view,
      deptTab: button.dataset.deptTab,
      managerTab: button.dataset.managerTab,
      handoffTab: button.dataset.handoffTab,
      omTab: button.dataset.omTab,
      priceReviewTab: button.dataset.priceReviewTab,
    });
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}
// @end-legacy-unit 75

// @legacy-unit 84 768
export function workspaceConfigForRole(role = currentRole) {
  const localConfig = roleWorkspaceConfigs[role] || {};
  const surfaceConfig = approvalReviewSurfaceModule()?.workspaceConfig?.(role) || {};
  const mainViews = [...new Set([...(surfaceConfig.mainViews || []), ...(localConfig.mainViews || [])])];
  return {
    ...localConfig,
    ...surfaceConfig,
    mainViews: mainViews.length ? mainViews : (surfaceConfig.mainViews || localConfig.mainViews),
  };
}
// @end-legacy-unit 84

// @legacy-unit 85 779
export function firstVisibleDatasetValue(selector, datasetKey) {
  const element = [...document.querySelectorAll(selector)].find((node) => !node.hidden);
  return element?.dataset?.[datasetKey] || "";
}
// @end-legacy-unit 85

// @legacy-unit 86 784
export function omWorkspaceTitleForRole(role = currentRole) {
  if (role === "omLeader") return "OM Leader";
  if (role === "omMember") return "OM Purchasing";
  return "OM Workspace";
}
// @end-legacy-unit 86

// @legacy-unit 87 790
export function syncMainNavigation(role = currentRole) {
  const config = workspaceConfigForRole(role);
  const visibleViews = new Set(config.mainViews || []);
  document.querySelectorAll(".tabs .tab").forEach((tab) => {
    const allowedRoles = (tab.dataset.roles || "").split(" ").filter(Boolean);
    const roleAllowed = allowedRoles.includes(role);
    const showForRole = role === "admin" || !visibleViews.size ? roleAllowed : (roleAllowed && visibleViews.has(tab.dataset.view));
    tab.hidden = !showForRole;
  });
}
// @end-legacy-unit 87

// @legacy-unit 88 801
export function syncManagerWorkspaceUi(role = currentRole) {
  const config = workspaceConfigForRole(role);
  const visibleTabs = new Set(config.managerTabs || ["review", "history"]);
  const reviewLabel = config.managerTabLabels?.review || approvalReviewConfigForRole(role)?.entryLabel || "Cost Review";
  const managerNav = document.querySelector('.tabs .tab[data-view="manager"]');
  if (managerNav && isManagerReviewRole(role)) managerNav.textContent = reviewLabel;
  if (currentView === "manager") document.getElementById("pageTitle").textContent = reviewLabel;
  document.querySelectorAll("[data-manager-tab]").forEach((tab) => {
    const label = config.managerTabLabels?.[tab.dataset.managerTab];
    if (label) tab.textContent = label;
    tab.hidden = !visibleTabs.has(tab.dataset.managerTab);
  });
  if (!visibleTabs.has(currentManagerTab)) replaceCurrentManagerTabBinding(config.defaultManagerTab || firstVisibleDatasetValue("[data-manager-tab]", "managerTab") || "review");
  document.querySelectorAll("[data-manager-panel]").forEach((panel) => {
    const panelName = panel.dataset.managerPanel;
    const isEmbeddedDemandAnalysis = currentManagerTab === "review" && panelName === "analysis";
    const isActive = panelName === currentManagerTab || isEmbeddedDemandAnalysis;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}
// @end-legacy-unit 88

// @legacy-unit 89 823
export function syncOmWorkspaceUi(role = currentRole) {
  const config = workspaceConfigForRole(role);
  const omWorkspaceTitle = document.getElementById("omWorkspaceTitle");
  const omTitle = omWorkspaceTitleForRole(role);
  if (omWorkspaceTitle) omWorkspaceTitle.textContent = omWorkspaceTitleForRole(role);
  const omNav = document.querySelector('.tabs .tab[data-view="om"]');
  if (omNav) omNav.textContent = omTitle;
  if (currentView === "om") document.getElementById("pageTitle").textContent = omTitle;
  const visibleTabs = new Set(config.omTabs || ["submission", "pasRequest", "quoteConfirm", "quoteExpiry", "finalExport"]);
  document.querySelectorAll("[data-om-tab]").forEach((tab) => {
    const label = config.omTabLabels?.[tab.dataset.omTab];
    if (label) tab.textContent = label;
    tab.hidden = !visibleTabs.has(tab.dataset.omTab);
  });
  if (!visibleTabs.has(currentOmTab)) replaceCurrentOmTabBinding(config.defaultOmTab || firstVisibleDatasetValue("[data-om-tab]", "omTab") || "submission");
  document.querySelectorAll("[data-om-panel]").forEach((panel) => {
    const isActive = panel.dataset.omPanel === currentOmTab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  const submissionPanel = document.querySelector('[data-om-panel="submission"]');
  const rateUtility = document.querySelector(".om-rate-utility");
  if (rateUtility) rateUtility.hidden = config.showOmRateUtility === false;
  if (submissionPanel) {
    const stageCalendar = submissionPanel.querySelector(".om-stage-calendar-utility");
    const summary = submissionPanel.querySelector("#omSubmissionSummary");
    const triage = submissionPanel.querySelector("#omSubmissionTriage");
    const expiryMonitor = submissionPanel.querySelector(".om-expiry-monitor-panel");
    if (stageCalendar) stageCalendar.hidden = config.showOmStageCalendar === false;
    if (summary) summary.hidden = config.showOmSubmissionSummary === false;
    if (triage) triage.hidden = config.showOmSubmissionTriage === false;
    if (expiryMonitor) expiryMonitor.hidden = config.showOmSubmissionExpiryMonitor === false;
  }
}
// @end-legacy-unit 89

// @legacy-unit 90 858
export function syncPriceReviewWorkspaceUi(role = currentRole) {
  const config = workspaceConfigForRole(role);
  const visibleTabs = new Set(config.priceReviewTabs || ["pending", "history", "costDashboard", "stationMatrix"]);
  document.querySelectorAll("[data-price-review-tab]").forEach((tab) => {
    const label = config.priceReviewTabLabels?.[tab.dataset.priceReviewTab];
    if (label) tab.textContent = label;
    tab.hidden = !visibleTabs.has(tab.dataset.priceReviewTab);
  });
  if (!visibleTabs.has(currentPriceReviewTab)) replaceCurrentPriceReviewTabBinding(config.defaultPriceReviewTab || firstVisibleDatasetValue("[data-price-review-tab]", "priceReviewTab") || "pending");
  document.querySelectorAll("[data-price-review-panel]").forEach((panel) => {
    const isActive = panel.dataset.priceReviewPanel === currentPriceReviewTab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}
// @end-legacy-unit 90

// @legacy-unit 908 9151
export function setScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
}
// @end-legacy-unit 908

// @legacy-unit 909 9155
export function setView(name) {
  replaceCurrentViewBinding(name);
  globalThis.currentView = name;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === name));
  document.querySelectorAll(".view").forEach((view) => {
    const isActive = view.dataset.view === name;
    view.classList.toggle("active", isActive);
    view.hidden = !isActive;
  });
  document.getElementById("pageTitle").textContent = pageTitles[name] || "Equipment Handoff";
  if (name === "department") renderDepartment();
  if (name === "projectStatus") renderProjectStatus();
  if (name === "manager") renderManager();
  if (name === "procurement") renderProcurement();
  if (name === "om") renderOmPurchasing();
  if (name === "omLeaderProgress") renderOmSubmission();
  if (name === "projectStageCalendar") renderOmProjectStageCalendar();
  if (name === "priceReview") renderPriceReview();
  if (name === "sourcing") renderSourcing();
  if (name === "buyer") renderBuyer();
  if (name === "adminSetup") {
    renderAdminSetup();
    refreshAdminSetup({ silent: true });
    refreshSapPoRawImportStatus({ silent: true });
  }
  syncSemanticNavigationActiveState();
  if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
}
// @end-legacy-unit 909

// @legacy-unit 910 9184
export function initializeStep0910() {
window.addEventListener("procurement:carryover-updated", () => {
  if (currentView === "projectStatus") renderProjectStatus();
  if (currentView !== "manager") return;
  renderManagerDemandCostDashboard();
  renderManagerQuantityMatrix();
});
}
// @end-legacy-unit 910

// @legacy-unit 911 9191
export function applyRole(role) {
  replaceCurrentRoleBinding(role);
  replaceCurrentUserRoleBinding(role);
  globalThis.currentUserRole = role;
  const profile = roleProfiles[role] || roleProfiles.requester;
  const workspaceConfig = workspaceConfigForRole(role);
  const currencySelect = document.getElementById("currencyDisplaySelect");
  if (currencySelect) currencySelect.value = currencyDisplay;
  if (role === "requester") {
    const selectedPersona = document.getElementById("requesterPersonaSelect")?.value || "";
    if (selectedPersona) replaceCurrentRequesterPersonaIdBinding(selectedPersona);
    const sessionPersona = currentSessionUser ? findRequesterPersonaByIdentifier(currentSessionUser.employeeId || currentSessionUser.employee_id || currentSessionUser.email || currentSessionUser.id) : null;
    if (sessionPersona) applyRequesterPersonaContext(sessionPersona);
  }
  const requesterPersona = role === "requester" ? currentRequesterPersona() : null;
  const sessionUser = sessionUserFromRole(role);
  const displayProfile = requesterPersona ? {
    name: requesterPersona.name,
    dept: requesterPersona.department || profile.dept,
    functionName: `Requester · ${requesterPersona.projectType || "Project"} · ${(requesterPersona.projects || [requesterPersona.project]).filter(Boolean).join(", ") || "Unmapped project"}`,
    email: requesterPersona.email || "",
    employeeId: requesterPersona.employeeId || "",
  } : currentSessionUser ? {
    name: sessionUser.name,
    dept: sessionUser.department || profile.dept,
    functionName: profile.functionName,
    email: sessionUser.email || "",
    employeeId: sessionUser.employeeId || sessionUser.employee_id || "",
  } : profile;
  document.getElementById("userBlock").innerHTML = `
    <span>Name: ${displayProfile.name}</span>
    <span>Dept: ${displayProfile.dept}</span>
    <span>Function: ${displayProfile.functionName}</span>
    ${displayProfile.employeeId ? `<span>Account: ${displayProfile.employeeId}</span>` : ""}
    ${displayProfile.email ? `<span>Email: ${displayProfile.email}</span>` : ""}`;

  syncMainNavigation(role);

  document.querySelectorAll(".requester-only").forEach((element) => {
    element.hidden = !["requester", "admin"].includes(role);
  });

  if (workspaceConfig.defaultManagerTab) replaceCurrentManagerTabBinding(workspaceConfig.defaultManagerTab);
  if (workspaceConfig.defaultOmTab) replaceCurrentOmTabBinding(workspaceConfig.defaultOmTab);
  if (workspaceConfig.defaultPriceReviewTab) replaceCurrentPriceReviewTabBinding(workspaceConfig.defaultPriceReviewTab);
  syncManagerWorkspaceUi(role);
  syncOmWorkspaceUi(role);
  syncPriceReviewWorkspaceUi(role);
  renderSemanticNavigation(role);
  setView(profile.defaultView);
  if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
}
// @end-legacy-unit 911

// @legacy-unit 912 9244
export function setDeptTab(tabName) {
  const allowedTabs = new Set(["request", "warehouse", "needConfirmation", "submissions"]);
  const nextTab = allowedTabs.has(tabName) ? tabName : "request";
  replaceCurrentDeptTabBinding(nextTab);
  globalThis.currentDeptTab = nextTab;
  document.querySelectorAll("[data-dept-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.deptTab === nextTab));
  document.querySelectorAll("[data-dept-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.deptPanel === nextTab));
  renderDepartment();
  syncSemanticNavigationActiveState();
}
// @end-legacy-unit 912

// @legacy-unit 915 9275
export function setManagerTab(tabName) {
  const config = workspaceConfigForRole(currentRole);
  const visibleTabs = new Set(config.managerTabs || ["review", "history"]);
  replaceCurrentManagerTabBinding(visibleTabs.has(tabName)
    ? tabName
    : config.defaultManagerTab || firstVisibleDatasetValue("[data-manager-tab]", "managerTab") || "review");
  updateApprovalReviewState("manager", { activeTab: approvalReviewTabFromManagerTab(currentManagerTab) });
  document.querySelectorAll("[data-manager-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.managerTab === currentManagerTab));
  document.querySelectorAll("[data-manager-panel]").forEach((panel) => {
    const panelName = panel.dataset.managerPanel;
    const isActive = panelName === currentManagerTab || (currentManagerTab === "review" && panelName === "analysis");
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  syncDemandAnalysisTabs();
  renderManager();
  syncSemanticNavigationActiveState();
}
// @end-legacy-unit 915

// @legacy-unit 916 9294
export function syncDemandAnalysisTabs() {
  document.querySelectorAll("[data-demand-analysis-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.demandAnalysisTab === currentDemandAnalysisTab);
  });
  document.querySelectorAll("[data-demand-analysis-panel]").forEach((panel) => {
    const isActive = panel.dataset.demandAnalysisPanel === currentDemandAnalysisTab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}
// @end-legacy-unit 916

// @legacy-unit 917 9305
export function setDemandAnalysisTab(tabName) {
  replaceCurrentDemandAnalysisTabBinding(tabName);
  syncDemandAnalysisTabs();
  renderManager();
}
// @end-legacy-unit 917

// @legacy-unit 918 9311
export function setHandoffTab(tabName) {
  replaceCurrentHandoffTabBinding(tabName);
  document.querySelectorAll("[data-handoff-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.handoffTab === tabName));
  document.querySelectorAll("[data-handoff-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.handoffPanel === tabName));
  renderProcurement();
  syncSemanticNavigationActiveState();
}
// @end-legacy-unit 918

// @legacy-unit 919 9319
export function setOmTab(tabName) {
  const allowedTabs = new Set([...document.querySelectorAll("[data-om-tab]")].map((tab) => tab.dataset.omTab));
  let nextTab = allowedTabs.has(tabName) ? tabName : "submission";
  if (document.querySelector(`[data-om-tab="${nextTab}"]`)?.hidden) {
    nextTab = firstVisibleDatasetValue("[data-om-tab]", "omTab") || nextTab;
  }
  replaceCurrentOmTabBinding(nextTab);
  document.querySelectorAll("[data-om-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.omTab === nextTab));
  document.querySelectorAll("[data-om-panel]").forEach((panel) => {
    const isActive = panel.dataset.omPanel === nextTab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  renderOmPurchasing();
  syncSemanticNavigationActiveState();
}
// @end-legacy-unit 919

// @legacy-unit 920 9336
export function setOmHandoffView(view = "prep") {
  const allowedViews = new Set(["prep", "prpo", "delivery", "all"]);
  replaceCurrentOmHandoffViewBinding(allowedViews.has(view) ? view : "prep");
  renderOmFinalExport();
}
// @end-legacy-unit 920

// @legacy-unit 921 9342
export function setPriceReviewTab(tabName) {
  const normalizedTabName = tabName === "approved" ? "projectReview" : tabName;
  const roleConfig = approvalReviewConfigForRole(currentRole);
  const allowedTabs = new Set(roleConfig?.tabs || ["pending", "projectReview", "history"]);
  replaceCurrentPriceReviewTabBinding(allowedTabs.has(normalizedTabName) ? normalizedTabName : firstVisibleDatasetValue("[data-price-review-tab]", "priceReviewTab") || "pending");
  updateApprovalReviewState(currentRole, { activeTab: currentPriceReviewTab });
  document.querySelectorAll("[data-price-review-tab]").forEach((tab) => tab.classList.toggle("active", tab.dataset.priceReviewTab === currentPriceReviewTab));
  document.querySelectorAll("[data-price-review-panel]").forEach((panel) => {
    const isActive = panel.dataset.priceReviewPanel === currentPriceReviewTab;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  renderPriceReview();
  syncSemanticNavigationActiveState();
}
// @end-legacy-unit 921

// @legacy-unit 922 9358
export function setPriceReviewQueue(queueName) {
  replaceCurrentPriceReviewQueueBinding(queueName || currentPriceReviewQueue);
  replaceSelectedPriceReviewRequestIdBinding(null);
  updateApprovalReviewState(currentRole, { activeQueue: currentPriceReviewQueue, selectedRowId: "" });
  renderPriceReview();
}
// @end-legacy-unit 922

export function replaceApplyRoleBinding(value) { applyRole = value; return value; }

export function replaceSetScreenBinding(value) { setScreen = value; return value; }

export function replaceSetViewBinding(value) { setView = value; return value; }

export function replaceSetDeptTabBinding(value) { setDeptTab = value; return value; }

export function replaceSetManagerTabBinding(value) { setManagerTab = value; return value; }

export function replaceSetOmTabBinding(value) { setOmTab = value; return value; }

export function replaceSetPriceReviewTabBinding(value) { setPriceReviewTab = value; return value; }
