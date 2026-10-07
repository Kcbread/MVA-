// cost/budget-cleanup: authoritative source; see docs/module-map.md.
import { currentView, currentDeptTab } from '../shell/state.js';
import { currentUserRole } from '../session/state.js';


// @legacy-unit 1907 26840
export function initializeStep1907() {
(() => {
  function tempBudgetCleanupText(value) {
    return String(value || "").trim();
  }

  function tempBudgetCleanupViewName() {
    return tempBudgetCleanupText(currentView || document.querySelector(".view.active")?.dataset.view);
  }

  function cleanupTemporaryBudgetLeakage() {
    const viewName = tempBudgetCleanupViewName();
    const role = tempBudgetCleanupText(currentUserRole);
    const isRequesterRequestView = viewName === "department"
      && role === "requester"
      && currentDeptTab === "request";
    document.querySelectorAll(".temp-budget-panel").forEach((panel) => {
      if (!isRequesterRequestView || !panel.closest('[data-view="department"].active [data-dept-panel="request"]')) {
        panel.remove();
      }
    });
    document.querySelectorAll(".temp-budget-manager-dashboard").forEach((node) => {
      if (viewName !== "manager" || !["manager", "admin"].includes(role)) node.remove();
    });
    document.querySelectorAll(".tb-expiry-summary").forEach((node) => {
      if (!["om", "procurement"].includes(viewName)) node.remove();
    });
    document.querySelectorAll(".tb-validity-card,.temp-budget-om-card").forEach((node) => {
      if (viewName !== "om" || !["om", "omLeader", "omMember", "admin"].includes(role)) node.remove();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cleanupTemporaryBudgetLeakage, { once: true });
  } else {
    cleanupTemporaryBudgetLeakage();
  }
})();
}
// @end-legacy-unit 1907
