// approval/navigation: authoritative source; see docs/module-map.md.
import {
  currentRole
} from "../session/state.js";
import {
  currentManagerTab
} from "../shell/state.js";

// @legacy-unit 76 736
export function approvalReviewSurfaceModule() {
  return window.ProcurementApp?.modules?.approvalReviewSurface || null;
}
// @end-legacy-unit 76

// @legacy-unit 77 740
export function approvalReviewConfigForRole(role = currentRole) {
  return approvalReviewSurfaceModule()?.configForRole?.(role) || null;
}
// @end-legacy-unit 77

// @legacy-unit 78 744
export function isManagerReviewRole(role = currentRole) {
  return ["dri", "manager", "projectDri"].includes(role);
}
// @end-legacy-unit 78

// @legacy-unit 79 748
export function managerReviewRole(role = currentRole) {
  return isManagerReviewRole(role) ? role : "manager";
}
// @end-legacy-unit 79

// @legacy-unit 80 752
export function approvalReviewStateForRole(role = currentRole) {
  return approvalReviewSurfaceModule()?.stateForRole?.(role) || null;
}
// @end-legacy-unit 80

// @legacy-unit 81 756
export function updateApprovalReviewState(role = currentRole, patch = {}) {
  return approvalReviewSurfaceModule()?.updateState?.(role, patch) || null;
}
// @end-legacy-unit 81

// @legacy-unit 82 760
export function approvalReviewRoleForMode(mode = "inline") {
  return mode === "managerAuthorized" ? managerReviewRole(currentRole) : currentRole;
}
// @end-legacy-unit 82

// @legacy-unit 83 764
export function approvalReviewTabFromManagerTab(tab = currentManagerTab) {
  return tab === "history" ? "history" : "pending";
}
// @end-legacy-unit 83
