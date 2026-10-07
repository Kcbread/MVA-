// session/session: authoritative source; see docs/module-map.md.
import {
  hydrateWorkflowReviewRows
} from "../approval/hydration.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  hydrateOmAssignmentState,
  selectedOmOperator,
  syncOmOperatorField
} from "../om/assignment.js";
import {
  hydrateOmGovernanceState
} from "../om/hydration.js";
import {
  omAssignees,
  replaceSelectedOmOperatorIdBinding,
  selectedOmOperatorId
} from "../om/state.js";
import {
  roleProfiles,
  testLoginRoleAccounts
} from "./config.js";
import {
  applyRequesterPersonaContext,
  findRequesterPersonaByIdentifier
} from "./persona.js";
import {
  apiSessionReady,
  currentRole,
  currentSessionUser,
  replaceApiSessionReadyBinding,
  replaceCurrentSessionUserBinding
} from "./state.js";
import {
  applyRole,
  setScreen
} from "../shell/navigation.js";

// @legacy-unit 414 2281
export function sessionUserFromRole(role = currentRole) {
  if (currentSessionUser) return currentSessionUser;
  const fallbackByRole = {
    omLeader: omAssignees.find((user) => user.role === "omLeader"),
    omMember: selectedOmOperator() || omAssignees.find((user) => user.role === "omMember"),
    om: omAssignees.find((user) => user.role === "omLeader"),
  };
  const fallback = fallbackByRole[role] || { id: role, role, ...(roleProfiles[role] || roleProfiles.requester) };
  return {
    id: fallback.id || role,
    name: fallback.name || roleProfiles[role]?.name || "User",
    email: fallback.email || "",
    department: fallback.department || fallback.dept || roleProfiles[role]?.dept || "",
    role: fallback.role || role,
  };
}
// @end-legacy-unit 414

// @legacy-unit 415 2298
export function setSessionUser(user) {
  replaceCurrentSessionUserBinding(user || null);
  if (!user) return;
  if (user.role === "requester") {
    const persona = findRequesterPersonaByIdentifier(user.employeeId || user.employee_id || user.email || user.id);
    if (persona) applyRequesterPersonaContext(persona);
  }
  roleProfiles[user.role] = {
    ...(roleProfiles[user.role] || roleProfiles.requester),
    name: user.name || roleProfiles[user.role]?.name,
    dept: user.department || roleProfiles[user.role]?.dept,
    functionName: roleProfiles[user.role]?.functionName || user.role,
  };
}
// @end-legacy-unit 415

// @legacy-unit 446 2761
export function testLoginAccountForRole(role) {
  return testLoginRoleAccounts[role] || "";
}
// @end-legacy-unit 446

// @legacy-unit 447 2765
export function syncLoginAccountForRole(role) {
  const operator = role === "omMember" ? selectedOmOperator() : null;
  const account = role === "omMember"
    ? (operator?.employeeId || operator?.email || operator?.id || "")
    : testLoginAccountForRole(role);
  const accountInput = document.getElementById("loginAccountInput") || document.getElementById("loginEmailInput") || document.querySelector('#loginForm input[type="text"]') || document.querySelector('#loginForm input[type="email"]');
  const passwordInput = document.querySelector('#loginForm input[type="password"]');
  syncOmOperatorField(role);
  if (accountInput && account) accountInput.value = account;
  if (passwordInput && !passwordInput.value) passwordInput.value = "123";
  return account || accountInput?.value || "";
}
// @end-legacy-unit 447

// @legacy-unit 448 2778
export async function loginWithApi(identifier, password, role = "") {
  const operator = role === "omMember" ? selectedOmOperator() : null;
  const payload = await apiRequest("/api/login", {
    method: "POST",
    body: {
      identifier,
      account: identifier,
      email: identifier,
      role,
      loginRole: role,
      operatorUserId: operator?.id || "",
      operatorEmployeeId: operator?.employeeId || "",
      password,
    },
  });
  setSessionUser(payload.user);
  replaceApiSessionReadyBinding(true);
  await hydrateOmAssignmentState(payload.user?.role || role);
  await hydrateOmGovernanceState(payload.user?.role || role);
  await hydrateWorkflowReviewRows(payload.user?.role || role);
  return payload.user;
}
// @end-legacy-unit 448

// @legacy-unit 449 2801
export async function logoutWithApi() {
  if (!apiModeEnabled()) return;
  try {
    await apiRequest("/api/logout", { method: "POST" });
  } catch {
    // Logout should still return the UI to the login screen if the server session already expired.
  }
  replaceCurrentSessionUserBinding(null);
  replaceApiSessionReadyBinding(false);
}
// @end-legacy-unit 449

// @legacy-unit 450 2812
export async function restoreApiSession() {
  if (!apiModeEnabled()) return;
  const roleSelect = document.getElementById("roleSelect");
  if (roleSelect) {
    roleSelect.disabled = false;
    roleSelect.title = "Testing shortcut: choose a role, then Sign in to switch the server session.";
  }
  try {
    const payload = await apiRequest("/api/me");
    setSessionUser(payload.user);
    replaceApiSessionReadyBinding(true);
    await hydrateOmAssignmentState(payload.user?.role);
    await hydrateOmGovernanceState(payload.user?.role);
    await hydrateWorkflowReviewRows(payload.user?.role);
    setScreen("workspace");
    if (roleSelect && payload.user?.role) roleSelect.value = payload.user.role;
    if (payload.user?.role === "omMember" && payload.user?.id) replaceSelectedOmOperatorIdBinding(payload.user.id);
    syncOmOperatorField(payload.user?.role || roleSelect?.value || "requester");
    applyRole(payload.user.role);
  } catch {
    setScreen("login");
  }
}
// @end-legacy-unit 450
