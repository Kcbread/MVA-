// om/assignment: authoritative source; see docs/module-map.md.
import {
  normalizeAdminUserRow
} from "../admin/setup.js";
import {
  EXT_REJECTED_DRI,
  adminApprovalSetup,
  replaceAdminApprovalSetupBinding
} from "../admin/state.js";
import {
  canonicalDemandUnit
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  externalStatusFor
} from "./external-progress.js";
import {
  addOmHistory
} from "./history.js";
import {
  omAssignees,
  omAssignmentMap,
  replaceOmAssigneesBinding,
  replaceOmAssignmentMapBinding,
  replaceSelectedOmOperatorIdBinding,
  selectedOmOperatorId
} from "./state.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  projectTypeFor
} from "../projects/config.js";
import {
  isOmLeaderRole,
  isOmRole
} from "../session/permissions.js";
import {
  sessionUserFromRole
} from "../session/session.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 92 885
export let DEFAULT_OM_ASSIGNMENT_RULES;
export function initializeDEFAULT_OM_ASSIGNMENT_RULESBinding() {
  DEFAULT_OM_ASSIGNMENT_RULES = [
  {
    id: "om-rule-p27-f27-linh",
    name: "P27/F27 -> Linh",
    active: true,
    priority: 10,
    projectCodes: ["P27", "F27"],
    projectFamilies: [],
    departmentScopes: [],
    assigneeUserId: "om-member-linh",
    isFallback: false,
    note: "Default OM assignment for P27 and F27.",
  },
  {
    id: "om-rule-fallback-giang",
    name: "Fallback -> Giang",
    active: true,
    priority: 999,
    projectCodes: [],
    projectFamilies: [],
    departmentScopes: [],
    assigneeUserId: "om-member-giang",
    isFallback: true,
    note: "Fallback OM assignment when no higher-priority rule matches.",
  },
];
}
// @end-legacy-unit 92

// @legacy-unit 416 2313
export function applyAssignmentsToRequests(assignments = []) {
  replaceOmAssignmentMapBinding(new Map(assignments.map((assignment) => [assignment.requestId, assignment])));
  replaceRequestsBinding(requests.map((row) => {
    const assignment = omAssignmentMap.get(row.id);
    if (!assignment) {
      return {
        ...row,
        omAssigneeId: row.omAssigneeId || "",
        omAssigneeName: row.omAssigneeName || "",
        omAssignedBy: row.omAssignedBy || "",
        omAssignedAt: row.omAssignedAt || "",
      };
    }
    return {
      ...row,
      omAssigneeId: assignment.assignedToUserId || "",
      omAssigneeName: assignment.assignedToName || "",
      omAssignedBy: assignment.assignedByName || "",
      omAssignedAt: assignment.assignedAt || "",
    };
  }));
}
// @end-legacy-unit 416

// @legacy-unit 417 2336
export function splitRuleValues(value = "") {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
// @end-legacy-unit 417

// @legacy-unit 418 2344
export function normalizeOmAssignmentRule(rule = {}) {
  return {
    id: rule.id || `om-rule-${Date.now()}`,
    name: String(rule.name || "OM Assignment Rule").trim(),
    active: Boolean(rule.active ?? rule.is_active ?? true),
    priority: Number(rule.priority ?? 999) || 999,
    projectCodes: splitRuleValues(rule.projectCodes ?? rule.project_codes),
    projectFamilies: splitRuleValues(rule.projectFamilies ?? rule.project_families),
    departmentScopes: splitRuleValues(rule.departmentScopes ?? rule.department_scopes),
    assigneeUserId: String(rule.assigneeUserId || rule.assignee_user_id || "").trim(),
    isFallback: Boolean(rule.isFallback ?? rule.is_fallback),
    note: String(rule.note || "").trim(),
  };
}
// @end-legacy-unit 418

// @legacy-unit 419 2359
export function activeOmMembers() {
  const localUsers = (adminApprovalSetup.users || [])
    .map(normalizeAdminUserRow)
    .filter((user) => user.role === "omMember" && user.status === "active");
  const merged = [...localUsers, ...omAssignees.filter((user) => user.role === "omMember")];
  return Array.from(new Map(merged.map((user) => [user.id, user])).values())
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}
// @end-legacy-unit 419

// @legacy-unit 420 2368
export function omOperatorSelectOptions(selectedId = "") {
  const options = activeOmMembers();
  const preferredId = selectedId || options[0]?.id || "";
  return options.map((user) => `<option value="${htmlAttr(user.id)}" ${user.id === preferredId ? "selected" : ""}>${htmlText(`${user.name} · ${user.employeeId || user.email || user.id}`)}</option>`).join("");
}
// @end-legacy-unit 420

// @legacy-unit 421 2374
export function selectedOmOperator() {
  const options = activeOmMembers();
  const selector = document.getElementById("omOperatorSelect");
  const selectedId = selector?.value || selectedOmOperatorId;
  return options.find((user) => user.id === selectedId) || options[0] || null;
}
// @end-legacy-unit 421

// @legacy-unit 422 2381
export function syncOmOperatorField(role = document.getElementById("roleSelect")?.value || currentRole) {
  const field = document.getElementById("omOperatorField");
  const selector = document.getElementById("omOperatorSelect");
  if (!field || !selector) return;
  const options = activeOmMembers();
  const nextSelected = options.find((user) => user.id === selectedOmOperatorId)?.id || options[0]?.id || "";
  if (selector.innerHTML !== omOperatorSelectOptions(nextSelected)) selector.innerHTML = omOperatorSelectOptions(nextSelected);
  if (nextSelected) {
    selector.value = nextSelected;
    replaceSelectedOmOperatorIdBinding(nextSelected);
  }
  field.hidden = role !== "omMember";
  field.style.display = role === "omMember" ? "" : "none";
}
// @end-legacy-unit 422

// @legacy-unit 423 2396
export function omAssignmentRuleAssignee(rule = {}) {
  return activeOmMembers().find((user) => user.id === rule.assigneeUserId)
    || omAssignees.find((user) => user.id === rule.assigneeUserId)
    || null;
}
// @end-legacy-unit 423

// @legacy-unit 424 2402
export function validOmAssignmentRule(rule = {}) {
  const assignee = omAssignmentRuleAssignee(rule);
  return Boolean(assignee && assignee.role === "omMember");
}
// @end-legacy-unit 424

// @legacy-unit 425 2407
export function omAssignmentRuleMatch(rule = {}, row = {}) {
  if (!rule.active || rule.isFallback || !validOmAssignmentRule(rule)) return false;
  const projectCode = String(row.project || "").trim().toUpperCase();
  const projectFamily = String(row.projectType || projectTypeFor(row.project || "") || "").trim();
  const departmentScope = canonicalDemandUnit(row.department || row.demandUnit || row.process || "");
  if (rule.projectCodes.length && !rule.projectCodes.some((item) => item.toUpperCase() === projectCode)) return false;
  if (rule.projectFamilies.length && !rule.projectFamilies.some((item) => normalize(item) === normalize(projectFamily))) return false;
  if (rule.departmentScopes.length && !rule.departmentScopes.some((item) => normalize(canonicalDemandUnit(item)) === normalize(departmentScope))) return false;
  return true;
}
// @end-legacy-unit 425

// @legacy-unit 426 2418
export function sortedOmAssignmentRules() {
  return (adminApprovalSetup.omAssignmentRules || [])
    .map(normalizeOmAssignmentRule)
    .sort((left, right) => left.priority - right.priority || Number(left.isFallback) - Number(right.isFallback) || left.name.localeCompare(right.name));
}
// @end-legacy-unit 426

// @legacy-unit 427 2424
export function defaultOmAssigneeForRuleRow(row = {}) {
  const rules = sortedOmAssignmentRules().filter((rule) => rule.active && validOmAssignmentRule(rule));
  const matched = rules.find((rule) => omAssignmentRuleMatch(rule, row));
  if (matched) return omAssignmentRuleAssignee(matched);
  const fallback = rules.find((rule) => rule.isFallback);
  return fallback ? omAssignmentRuleAssignee(fallback) : null;
}
// @end-legacy-unit 427

// @legacy-unit 428 2432
export async function hydrateOmAssignmentState(role = currentRole) {
  if (!apiModeEnabled() || !isOmRole(role)) return;
  try {
    const [assigneePayload, assignmentPayload, rulePayload] = await Promise.all([
      apiRequest("/api/om/assignees"),
      apiRequest("/api/om/assignments"),
      apiRequest("/api/om/assignment-rules").catch(() => ({ rules: adminApprovalSetup.omAssignmentRules || [] })),
    ]);
    if (Array.isArray(assigneePayload.assignees)) replaceOmAssigneesBinding(assigneePayload.assignees);
    if (Array.isArray(rulePayload.rules)) {
      replaceAdminApprovalSetupBinding({
        ...adminApprovalSetup,
        omAssignmentRules: rulePayload.rules.map(normalizeOmAssignmentRule),
      });
    }
    applyAssignmentsToRequests(assignmentPayload.assignments || []);
    syncOmOperatorField();
  } catch (error) {
    showToast(`OM assignment API unavailable: ${error.message}`, "error");
  }
}
// @end-legacy-unit 428

// @legacy-unit 1446 18110
export function omPasRequestStatus(row) {
  if (externalStatusFor(row) === EXT_REJECTED_DRI || row.status === "Rejected") return "Rejected to DRI";
  if (row.pasDemandNo) return "PAS Demand No Ready";
  return "Waiting PAS Demand No";
}
// @end-legacy-unit 1446

// @legacy-unit 1447 18116
export function omAssignmentForRow(row) {
  const explicitAssignment = omAssignmentMap.get(row.id);
  if (explicitAssignment) return explicitAssignment;
  const defaultAssignee = defaultOmAssigneeForRuleRow(row);
  return {
    requestId: row.id,
    assignedToUserId: row.omAssigneeId || defaultAssignee?.id || "",
    assignedToName: row.omAssigneeName || defaultAssignee?.name || "",
    assignedByName: row.omAssignedBy || (defaultAssignee ? "System auto assignment" : ""),
    assignedAt: row.omAssignedAt || "",
    assignmentStatus: row.omAssigneeId ? "assigned" : defaultAssignee ? "auto" : "unassigned",
    assignmentNote: defaultAssignee ? "Linh owns P27/F27; Giang owns other OM work rows by default." : "",
  };
}
// @end-legacy-unit 1447

// @legacy-unit 1448 18131
export function omAssigneeName(row) {
  const assignment = omAssignmentForRow(row);
  return assignment.assignedToName || omAssignees.find((user) => user.id === assignment.assignedToUserId)?.name || "";
}
// @end-legacy-unit 1448

// @legacy-unit 1449 18136
export function currentOmUserId() {
  return sessionUserFromRole(currentRole).id;
}
// @end-legacy-unit 1449

// @legacy-unit 1450 18140
export function canOperateOmRow(row) {
  const assignment = omAssignmentForRow(row);
  return globalThis.ProcurementApp?.roleGuards?.canOperateOmRow({
    role: currentRole,
    assignment,
    currentUserId: currentOmUserId(),
  }) ?? (
    currentRole === "admin"
      || (currentRole === "omMember" && Boolean(assignment.assignedToUserId && assignment.assignedToUserId === currentOmUserId()))
  );
}
// @end-legacy-unit 1450

// @legacy-unit 1451 18152
export function isOmLeaderSupervisorMode() {
  return currentRole === "omLeader";
}
// @end-legacy-unit 1451

// @legacy-unit 1452 18156
export function omLeaderSupervisorNote() {
  return "OM Leader supervisor view · assignment only";
}
// @end-legacy-unit 1452

// @legacy-unit 1453 18160
export function omSupervisorActionCell() {
  if (isOmLeaderSupervisorMode()) return `
    <div class="om-readonly-action">
      <span class="status-pill info">Read-only</span>
      <div class="reason-text">${omLeaderSupervisorNote()}</div>
    </div>`;
  return "";
}
// @end-legacy-unit 1453

// @legacy-unit 1454 18169
export function omRowAccessReason(row) {
  return globalThis.ProcurementApp?.roleGuards?.omRowAccessReason({
    canOperate: canOperateOmRow(row),
    assigneeName: omAssigneeName(row),
  }) || "";
}
// @end-legacy-unit 1454

// @legacy-unit 1455 18176
export function ensureOmRowAccess(row, action = "update this OM row") {
  if (canOperateOmRow(row)) return true;
  const reason = omRowAccessReason(row);
  showToast(`${sessionUserFromRole().name} cannot ${action}. ${reason}`, "error");
  return false;
}
// @end-legacy-unit 1455

// @legacy-unit 1456 18183
export function omActionDisabledAttr(row, baseDisabled = false) {
  return baseDisabled || !canOperateOmRow(row) ? "disabled" : "";
}
// @end-legacy-unit 1456

// @legacy-unit 1457 18187
export function omAssignmentCell(row) {
  const assignment = omAssignmentForRow(row);
  const assignedId = assignment.assignedToUserId || "";
  if (isOmLeaderRole()) {
    return `
      <label class="om-assignment-control">
        <span>Assigned To</span>
        <select data-om-assignee-id="${row.id}">
          <option value="">Unassigned</option>
          ${omAssignees.map((user) => `<option value="${user.id}" ${user.id === assignedId ? "selected" : ""}>${user.name} · ${user.role === "omLeader" ? "Leader" : "Member"}</option>`).join("")}
        </select>
      </label>
      <div class="reason-text">${assignment.assignedByName ? `By ${assignment.assignedByName}` : "Mai can assign this row."}</div>`;
  }
  const assignee = omAssigneeName(row);
  return `
    <span class="status-pill ${assignee ? "info" : "warning"}">${assignee || "Unassigned"}</span>
    <div class="reason-text">${canOperateOmRow(row) ? "Your OM work row" : omRowAccessReason(row)}</div>`;
}
// @end-legacy-unit 1457

// @legacy-unit 1458 18207
export async function assignOmRow(requestId, assignedToUserId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  if (!isOmLeaderRole()) {
    showToast("Only OM Leader can assign OM rows.", "error");
    renderOmPurchasing();
    return;
  }
  const assignee = omAssignees.find((user) => user.id === assignedToUserId);
  if (apiModeEnabled()) {
    try {
      const payload = await apiRequest(`/api/om/requests/${encodeURIComponent(requestId)}/assign`, {
        method: "POST",
        body: { assignedToUserId, note: assignedToUserId ? "Assigned from OM workbench." : "Assignment cleared." },
      });
      applyAssignmentsToRequests(assignedToUserId ? [payload.assignment, ...[...omAssignmentMap.values()].filter((item) => item.requestId !== requestId)] : [...omAssignmentMap.values()].filter((item) => item.requestId !== requestId));
    } catch (error) {
      showToast(`Assignment failed: ${error.message}`, "error");
      renderOmPurchasing();
      return;
    }
  } else {
    const assignment = {
      requestId,
      assignedToUserId: assignedToUserId || "",
      assignedToName: assignee?.name || "",
      assignedByUserId: currentOmUserId(),
      assignedByName: sessionUserFromRole().name || "OM Leader",
      assignedAt: new Date().toISOString(),
      assignmentStatus: assignedToUserId ? "assigned" : "cleared",
      assignmentNote: "Prototype local assignment.",
    };
    applyAssignmentsToRequests(assignedToUserId ? [assignment, ...[...omAssignmentMap.values()].filter((item) => item.requestId !== requestId)] : [...omAssignmentMap.values()].filter((item) => item.requestId !== requestId));
  }
  addOmHistory(row, assignedToUserId ? "OM row assigned" : "OM assignment cleared", assignedToUserId ? `Assigned to ${assignee?.name || assignedToUserId}.` : "Assignment cleared by OM Leader.");
  renderOmPurchasing();
  showToast(assignedToUserId ? `Assigned to ${assignee?.name || "OM user"}.` : "Assignment cleared.", "success");
}
// @end-legacy-unit 1458

export function replaceCanOperateOmRowBinding(value) { canOperateOmRow = value; return value; }
