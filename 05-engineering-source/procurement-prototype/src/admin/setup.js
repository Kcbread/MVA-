// admin/setup: authoritative source; see docs/module-map.md.
import {
  pushAdminAuditEvent
} from "./audit.js";
import {
  renderAdminPasDemandRequirementMaster,
  renderSapPoRawImportPanel
} from "./import-view.js";
import {
  defaultAdminRolePermissions,
  renderRoleCapabilityMatrix
} from "./permissions.js";
import {
  adminApprovalSetup,
  adminAuditFilters,
  replaceAdminApprovalSetupBinding
} from "./state.js";
import {
  downloadFile
} from "../exports/workbook.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  activeOmMembers,
  normalizeOmAssignmentRule,
  sortedOmAssignmentRules,
  syncOmOperatorField,
  validOmAssignmentRule
} from "../om/assignment.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  adminPermissionFor,
  adminRoleLabelByAppRole,
  appRoleForAdminRoleKey,
  normalizeAdminRoleKey
} from "../session/permissions.js";
import {
  sessionUserFromRole
} from "../session/session.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  currentView
} from "../shell/state.js";

// @legacy-unit 1789 23323
export function roleOptionsHtml(selected, { useRoleKey = false } = {}) {
  return adminApprovalSetup.roles.map((role) => {
    const value = useRoleKey ? role.roleKey : role.appRole;
    return `<option value="${value}" ${selected === value ? "selected" : ""}>${htmlText(role.roleName)}</option>`;
  }).join("");
}
// @end-legacy-unit 1789

// @legacy-unit 1790 23330
export function scopeTypeOptionsHtml(selected = "department") {
  return [
    ["global", "Global"],
    ["department", "Department"],
    ["project-mapping", "Project Mapping"],
  ].map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");
}
// @end-legacy-unit 1790

// @legacy-unit 1791 23338
export function normalizeAdminUserRow(user = {}) {
  return {
    ...user,
    employeeId: user.employeeId || user.employee_id || "",
    createdBy: user.createdBy || user.created_by || "",
    createdAt: user.createdAt || user.created_at || "",
    disabledAt: user.disabledAt || user.disabled_at || "",
    lastLoginAt: user.lastLoginAt || user.last_login_at || "",
    scopeType: user.scopeType || user.scope_type || "department",
    scopeValue: user.scopeValue || user.scope_value || user.department || "",
    status: user.status || (user.is_active ? "active" : "inactive"),
  };
}
// @end-legacy-unit 1791

// @legacy-unit 1792 23352
export function normalizeAdminRoleRow(role = {}) {
  const permissions = Object.fromEntries(Object.entries(role.permissions || {}).map(([moduleKey, record]) => [moduleKey, {
    canCreate: Boolean(record.canCreate ?? record.can_create),
    canUpdate: Boolean(record.canUpdate ?? record.can_update),
    canDelete: Boolean(record.canDelete ?? record.can_delete),
    canView: Boolean(record.canView ?? record.can_view),
    canExport: Boolean(record.canExport ?? record.can_export),
  }]));
  return {
    roleKey: role.roleKey || role.role_key || "",
    roleName: role.roleName || role.role_name || "",
    appRole: role.appRole || role.app_role || "",
    roleLevel: role.roleLevel || role.role_level || "",
    isSystem: Boolean(role.isSystem ?? role.is_system),
    permissions,
  };
}
// @end-legacy-unit 1792

// @legacy-unit 1793 23370
export function normalizeFieldVisibilityRows(rules = []) {
  const next = {};
  rules.forEach((row) => {
    const fieldKey = row.fieldKey || row.field_key;
    if (!fieldKey) return;
    if (!next[fieldKey]) {
      next[fieldKey] = {
        fieldKey,
        label: row.label || row.field_label || fieldKey,
        reserved: Boolean(row.reserved),
        visibilityByRole: {},
      };
    }
    const visibilityByRole = row.visibilityByRole || row.visibility_by_role || {};
    Object.entries(visibilityByRole).forEach(([roleKey, visibility]) => {
      next[fieldKey].visibilityByRole[roleKey] = visibility;
    });
  });
  return next;
}
// @end-legacy-unit 1793

// @legacy-unit 1794 23391
export function omAssignmentRuleAssigneeOptions(selected = "") {
  const users = activeOmMembers();
  return [`<option value="">Unassigned</option>`, ...users.map((user) => `<option value="${htmlAttr(user.id)}" ${user.id === selected ? "selected" : ""}>${htmlText(`${user.name} · ${user.employeeId || user.email || user.id}`)}</option>`)].join("");
}
// @end-legacy-unit 1794

// @legacy-unit 1795 23396
export function omAssignmentRuleInvalidReason(rule = {}) {
  if (!rule.assigneeUserId) return "Choose an active OM Purchasing user.";
  if (!validOmAssignmentRule(rule)) return "Assigned user is inactive or no longer an OM Purchasing operator.";
  return "";
}
// @end-legacy-unit 1795

// @legacy-unit 1796 23402
export async function refreshAdminSetup({ silent = false } = {}) {
  if (!apiModeEnabled() || currentRole !== "admin") return;
  try {
    const [usersPayload, rolesPayload, fieldsPayload, auditPayload, omRulePayload] = await Promise.all([
      apiRequest("/api/admin/users"),
      apiRequest("/api/admin/roles"),
      apiRequest("/api/admin/field-visibility"),
      apiRequest("/api/admin/audit-events"),
      apiRequest("/api/admin/om-assignment-rules"),
    ]);
    replaceAdminApprovalSetupBinding({
      ...adminApprovalSetup,
      users: (usersPayload.users || []).map(normalizeAdminUserRow),
      roles: (rolesPayload.roles || []).map(normalizeAdminRoleRow),
      permissionModules: (rolesPayload.modules || []).map((row) => ({ moduleKey: row.moduleKey || row.module_key, label: row.label || row.module_name || row.module_key })),
      rolePermissions: (rolesPayload.roles || []).reduce((acc, row) => {
        const normalized = normalizeAdminRoleRow(row);
        acc[normalized.roleKey] = normalized.permissions || {};
        return acc;
      }, {}),
      fieldVisibilityRules: normalizeFieldVisibilityRows(fieldsPayload.rules || []),
      auditLog: (auditPayload.events || []).map((row) => ({
        id: row.id || `${row.event_type}-${row.created_at}`,
        createdAt: row.createdAt || row.created_at || "",
        eventType: row.eventType || row.event_type || "",
        actorUserId: row.actorUserId || row.actor_user_id || "",
        actorRole: row.actorRole || row.actor_role || "",
        entityType: row.entityType || row.entity_type || "",
        entityId: row.entityId || row.entity_id || "",
        ipAddress: row.ipAddress || row.ip_address || "",
        metadata: row.metadata || row.metadata_json || {},
      })),
      omAssignmentRules: (omRulePayload.rules || []).map(normalizeOmAssignmentRule),
    });
    syncOmOperatorField();
    if (currentView === "adminSetup") renderAdminSetup();
  } catch (error) {
    if (!silent) showToast(`Admin setup sync failed: ${error.message}`, "error");
  }
}
// @end-legacy-unit 1796

// @legacy-unit 1797 23443
export function filteredAdminAuditRows() {
  return (adminApprovalSetup.auditLog || []).filter((row) => {
    if (adminAuditFilters.actorUserId && !String(row.actorUserId || "").includes(adminAuditFilters.actorUserId)) return false;
    if (adminAuditFilters.actorRole && String(row.actorRole || "") !== adminAuditFilters.actorRole) return false;
    if (adminAuditFilters.eventType && !String(row.eventType || "").includes(adminAuditFilters.eventType)) return false;
    if (adminAuditFilters.module && !String(row.eventType || "").startsWith(`${adminAuditFilters.module}.`)) return false;
    if (adminAuditFilters.from && String(row.createdAt || "") < adminAuditFilters.from) return false;
    if (adminAuditFilters.to && String(row.createdAt || "") > `${adminAuditFilters.to}T23:59:59`) return false;
    return true;
  });
}
// @end-legacy-unit 1797

// @legacy-unit 1798 23455
export function renderAdminRolePermissionMatrix() {
  const target = document.getElementById("adminRolePermissionRows");
  if (!target) return;
  const actionKeys = [
    ["canCreate", "Create"],
    ["canUpdate", "Update"],
    ["canDelete", "Delete"],
    ["canView", "View"],
    ["canExport", "Export"],
  ];
  target.innerHTML = adminApprovalSetup.roles.map((role) => `
    <tr>
      <td><strong>${htmlText(role.roleName)}</strong><div class="muted">${htmlText(role.roleLevel)}</div></td>
      <td>${role.isSystem ? "System" : "Custom"}</td>
      ${adminApprovalSetup.permissionModules.map((module) => `
        <td>
          <div class="permission-chip-stack">
            ${actionKeys.map(([actionKey, label]) => `
              <label class="permission-toggle">
                <input type="checkbox" data-admin-role-permission="${role.roleKey}" data-admin-module-key="${module.moduleKey}" data-admin-permission-key="${actionKey}" ${adminPermissionFor(role.roleKey, module.moduleKey)[actionKey] ? "checked" : ""} />
                <span>${label}</span>
              </label>`).join("")}
          </div>
        </td>`).join("")}
    </tr>`).join("");
}
// @end-legacy-unit 1798

// @legacy-unit 1799 23482
export function renderAdminFieldVisibilityMatrix() {
  const target = document.getElementById("adminFieldVisibilityRows");
  if (!target) return;
  target.innerHTML = Object.values(adminApprovalSetup.fieldVisibilityRules || {}).map((field) => `
    <tr>
      <td><strong>${htmlText(field.label)}</strong>${field.reserved ? `<div class="muted">Reserved cross-domain field</div>` : ""}</td>
      ${adminApprovalSetup.roles.map((role) => `
        <td>
          <label class="permission-toggle">
            <input type="checkbox" data-admin-field-key="${field.fieldKey}" data-admin-role-visibility="${role.roleKey}" ${(field.visibilityByRole?.[role.roleKey] || "hidden") === "visible" ? "checked" : ""} />
            <span>${(field.visibilityByRole?.[role.roleKey] || "hidden") === "visible" ? "Visible" : "Hidden"}</span>
          </label>
        </td>`).join("")}
    </tr>`).join("");
}
// @end-legacy-unit 1799

// @legacy-unit 1800 23498
export function renderAdminAuditLog() {
  const rowsTarget = document.getElementById("adminAuditRows");
  if (!rowsTarget) return;
  const rows = filteredAdminAuditRows();
  rowsTarget.innerHTML = rows.map((row) => `
    <tr>
      <td>${htmlText(compactDateTime(row.createdAt) || "-")}</td>
      <td>${htmlText(row.eventType || "-")}</td>
      <td>${htmlText(row.actorUserId || "-")}</td>
      <td>${htmlText(adminRoleLabelByAppRole(row.actorRole || "") || row.actorRole || "-")}</td>
      <td>${htmlText(row.entityType || "-")}</td>
      <td>${htmlText(row.entityId || "-")}</td>
      <td>${htmlText(row.ipAddress || "-")}</td>
    </tr>`).join("");
  const counter = document.getElementById("adminAuditCount");
  if (counter) counter.textContent = `${rows.length} events`;
}
// @end-legacy-unit 1800

// @legacy-unit 1806 23637
export function renderAdminSetup() {
  const delta = document.getElementById("adminHistoryPriceDeltaThreshold");
  const chain = document.getElementById("adminApprovalChain");
  const updated = document.getElementById("adminSetupUpdatedAt");
  const newUserRole = document.getElementById("adminNewUserRole");
  const newRuleAssignee = document.getElementById("adminNewOmRuleAssignee");
  if (delta) delta.value = Number(adminApprovalSetup.thresholds.historyPriceDeltaUsd || 0.4).toFixed(2);
  if (chain) chain.value = adminApprovalSetup.approvalChain.join(" -> ");
  if (updated) updated.textContent = adminApprovalSetup.updatedAt ? `Updated ${compactDateTime(adminApprovalSetup.updatedAt)} by ${adminApprovalSetup.updatedBy}` : "Prototype state";
  if (newUserRole) newUserRole.innerHTML = roleOptionsHtml(newUserRole.value || "requester", { useRoleKey: true });
  if (newRuleAssignee) newRuleAssignee.innerHTML = omAssignmentRuleAssigneeOptions(newRuleAssignee.value || "");
  const userRows = document.getElementById("adminUserRows");
  if (userRows) {
    userRows.innerHTML = adminApprovalSetup.users.map((raw) => {
      const user = normalizeAdminUserRow(raw);
      return `
      <tr data-admin-user="${user.id}">
        <td><input data-admin-user-field="employeeId" data-admin-user-id="${user.id}" value="${htmlAttr(user.employeeId)}" /></td>
        <td><input data-admin-user-field="name" data-admin-user-id="${user.id}" value="${htmlAttr(user.name)}" /></td>
        <td><input data-admin-user-field="email" data-admin-user-id="${user.id}" value="${htmlAttr(user.email)}" /></td>
        <td><input data-admin-user-field="department" data-admin-user-id="${user.id}" value="${htmlAttr(user.department)}" /></td>
        <td><select data-admin-user-field="role" data-admin-user-id="${user.id}">${roleOptionsHtml(user.role)}</select></td>
        <td>
          <select data-admin-user-field="scopeType" data-admin-user-id="${user.id}">${scopeTypeOptionsHtml(user.scopeType)}</select>
          <input class="compact-input" data-admin-user-field="scopeValue" data-admin-user-id="${user.id}" value="${htmlAttr(user.scopeValue)}" />
        </td>
        <td><span class="status-pill ${user.status === "active" ? "status-ok" : "status-warning"}">${htmlText(user.status)}</span></td>
        <td>${htmlText(compactDateTime(user.lastLoginAt) || "-")}</td>
        <td>${htmlText(user.createdBy || "-")}</td>
        <td>
          <div class="action-stack compact-actions">
            <button class="mini" type="button" data-admin-user-status="${user.id}" data-admin-status-value="${user.status === "active" ? "inactive" : "active"}">${user.status === "active" ? "Deactivate" : "Activate"}</button>
          </div>
        </td>
      </tr>`;
    }).join("");
  }
  const approverRows = document.getElementById("adminApproverRows");
  if (approverRows) {
    approverRows.innerHTML = adminApprovalSetup.approverMap.map((row) => `
      <tr>
        <td>${row.scope}</td>
        <td>${row.dri}</td>
        <td>${row.projectDri}</td>
      </tr>`).join("");
  }
  const omRuleRows = document.getElementById("adminOmAssignmentRuleRows");
  if (omRuleRows) {
    omRuleRows.innerHTML = sortedOmAssignmentRules().map((raw) => {
      const rule = normalizeOmAssignmentRule(raw);
      const invalidReason = omAssignmentRuleInvalidReason(rule);
      const statusLabel = invalidReason ? "Invalid Assignee" : rule.active ? "Active" : "Inactive";
      const statusClassName = invalidReason ? "status-warning" : rule.active ? "status-ok" : "info";
      return `
        <tr data-admin-om-rule="${rule.id}">
          <td class="cell-identity">
            <input data-admin-om-rule-field="name" data-admin-om-rule-id="${rule.id}" value="${htmlAttr(rule.name)}" />
            <div class="reason-text">${rule.isFallback ? "Fallback rule" : "Match rule"}</div>
          </td>
          <td><input data-admin-om-rule-field="priority" data-admin-om-rule-id="${rule.id}" type="number" min="1" step="1" value="${htmlAttr(rule.priority)}" /></td>
          <td>
            <select data-admin-om-rule-field="assigneeUserId" data-admin-om-rule-id="${rule.id}">
              ${omAssignmentRuleAssigneeOptions(rule.assigneeUserId)}
            </select>
            <div class="reason-text">${invalidReason || "Active OM Purchasing user only."}</div>
          </td>
          <td><input data-admin-om-rule-field="projectCodes" data-admin-om-rule-id="${rule.id}" value="${htmlAttr(rule.projectCodes.join(", "))}" title="${htmlAttr(rule.projectCodes.join(", "))}" /></td>
          <td><input data-admin-om-rule-field="projectFamilies" data-admin-om-rule-id="${rule.id}" value="${htmlAttr(rule.projectFamilies.join(", "))}" title="${htmlAttr(rule.projectFamilies.join(", "))}" /></td>
          <td><input data-admin-om-rule-field="departmentScopes" data-admin-om-rule-id="${rule.id}" value="${htmlAttr(rule.departmentScopes.join(", "))}" title="${htmlAttr(rule.departmentScopes.join(", "))}" /></td>
          <td>
            <label class="permission-toggle">
              <input type="checkbox" data-admin-om-rule-field="active" data-admin-om-rule-id="${rule.id}" ${rule.active ? "checked" : ""} />
              <span>Active</span>
            </label>
            <label class="permission-toggle">
              <input type="checkbox" data-admin-om-rule-field="isFallback" data-admin-om-rule-id="${rule.id}" ${rule.isFallback ? "checked" : ""} />
              <span>Fallback</span>
            </label>
            <div><span class="status-pill ${statusClassName}">${statusLabel}</span></div>
          </td>
          <td class="cell-note-summary">
            <input data-admin-om-rule-field="note" data-admin-om-rule-id="${rule.id}" value="${htmlAttr(rule.note)}" title="${htmlAttr(rule.note)}" />
          </td>
          <td class="cell-action">
            <div class="action-stack compact-actions">
              <button class="mini approve" type="button" data-action="saveOmAssignmentRule" data-admin-om-rule-id="${rule.id}">Save</button>
            </div>
          </td>
        </tr>`;
    }).join("");
  }
  renderAdminRolePermissionMatrix();
  renderAdminFieldVisibilityMatrix();
  renderAdminPasDemandRequirementMaster();
  renderAdminAuditLog();
  renderSapPoRawImportPanel();
  renderRoleCapabilityMatrix();
  syncOmOperatorField(document.getElementById("roleSelect")?.value || currentRole);
}
// @end-legacy-unit 1806

// @legacy-unit 1807 23737
export async function saveAdminApprovalSetup() {
  replaceAdminApprovalSetupBinding({
    ...adminApprovalSetup,
    thresholds: {
      historyPriceDeltaUsd: Number(document.getElementById("adminHistoryPriceDeltaThreshold")?.value || 0.4),
    },
    approvalChain: String(document.getElementById("adminApprovalChain")?.value || "Dept DRI -> Budget Approver").split("->").map((item) => item.trim()).filter(Boolean),
    updatedBy: roleProfiles[currentRole]?.name || "Admin",
    updatedAt: new Date().toISOString(),
  });
  pushAdminAuditEvent("admin.role_updated", "approval_chain", "thresholds", {
    thresholds: adminApprovalSetup.thresholds,
    approvalChain: adminApprovalSetup.approvalChain,
  });
  renderAdminSetup();
  showToast("Access and approval setup saved.", "success");
}
// @end-legacy-unit 1807

// @legacy-unit 1808 23755
export function omAssignmentRuleFormPayload() {
  return normalizeOmAssignmentRule({
    id: `om-rule-${Date.now()}`,
    name: document.getElementById("adminNewOmRuleName")?.value.trim() || "OM Assignment Rule",
    priority: Number(document.getElementById("adminNewOmRulePriority")?.value || 999),
    assigneeUserId: document.getElementById("adminNewOmRuleAssignee")?.value || "",
    projectCodes: document.getElementById("adminNewOmRuleProjectCodes")?.value || "",
    projectFamilies: document.getElementById("adminNewOmRuleProjectFamilies")?.value || "",
    departmentScopes: document.getElementById("adminNewOmRuleDepartmentScopes")?.value || "",
    active: Boolean(document.getElementById("adminNewOmRuleActive")?.checked),
    isFallback: Boolean(document.getElementById("adminNewOmRuleFallback")?.checked),
    note: document.getElementById("adminNewOmRuleNote")?.value.trim() || "",
  });
}
// @end-legacy-unit 1808

// @legacy-unit 1809 23770
export function omAssignmentRulePayloadFromRow(ruleId) {
  return normalizeOmAssignmentRule({
    id: ruleId,
    name: document.querySelector(`[data-admin-om-rule-field="name"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "",
    priority: document.querySelector(`[data-admin-om-rule-field="priority"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "999",
    assigneeUserId: document.querySelector(`[data-admin-om-rule-field="assigneeUserId"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "",
    projectCodes: document.querySelector(`[data-admin-om-rule-field="projectCodes"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "",
    projectFamilies: document.querySelector(`[data-admin-om-rule-field="projectFamilies"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "",
    departmentScopes: document.querySelector(`[data-admin-om-rule-field="departmentScopes"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "",
    active: document.querySelector(`[data-admin-om-rule-field="active"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.checked,
    isFallback: document.querySelector(`[data-admin-om-rule-field="isFallback"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.checked,
    note: document.querySelector(`[data-admin-om-rule-field="note"][data-admin-om-rule-id="${CSS.escape(ruleId)}"]`)?.value || "",
  });
}
// @end-legacy-unit 1809

// @legacy-unit 1810 23785
export function validateOmAssignmentRulePayload(rule) {
  if (!rule.name) return "Rule name is required.";
  if (!rule.assigneeUserId) return "Choose an OM operator assignee.";
  if (rule.priority < 1) return "Priority must be 1 or greater.";
  const duplicateFallback = sortedOmAssignmentRules().filter((item) => item.id !== rule.id && item.isFallback && item.active);
  if (rule.isFallback && duplicateFallback.length) return "Only one active fallback rule is allowed.";
  const invalidReason = omAssignmentRuleInvalidReason(rule);
  if (invalidReason) return invalidReason;
  return "";
}
// @end-legacy-unit 1810

// @legacy-unit 1811 23796
export async function createOmAssignmentRuleFromForm() {
  const payload = omAssignmentRuleFormPayload();
  const validation = validateOmAssignmentRulePayload(payload);
  if (validation) {
    showToast(validation, "error");
    return;
  }
  if (apiModeEnabled()) {
    try {
      await apiRequest("/api/admin/om-assignment-rules", { method: "POST", body: payload });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.omAssignmentRules = [...sortedOmAssignmentRules().filter((rule) => !payload.isFallback || !rule.isFallback), payload];
    pushAdminAuditEvent("admin.om_assignment_rule_created", "om_assignment_rule", payload.id, payload);
  }
  ["adminNewOmRuleName", "adminNewOmRuleProjectCodes", "adminNewOmRuleProjectFamilies", "adminNewOmRuleDepartmentScopes", "adminNewOmRuleNote"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  const priorityInput = document.getElementById("adminNewOmRulePriority");
  if (priorityInput) priorityInput.value = "10";
  const activeInput = document.getElementById("adminNewOmRuleActive");
  if (activeInput) activeInput.checked = true;
  const fallbackInput = document.getElementById("adminNewOmRuleFallback");
  if (fallbackInput) fallbackInput.checked = false;
  renderAdminSetup();
  showToast("OM assignment rule created.", "success");
}
// @end-legacy-unit 1811

// @legacy-unit 1812 23829
export async function saveOmAssignmentRule(ruleId) {
  const payload = omAssignmentRulePayloadFromRow(ruleId);
  const validation = validateOmAssignmentRulePayload(payload);
  if (validation) {
    showToast(validation, "error");
    renderAdminSetup();
    return;
  }
  if (apiModeEnabled()) {
    try {
      await apiRequest(`/api/admin/om-assignment-rules/${encodeURIComponent(ruleId)}`, { method: "PATCH", body: payload });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.omAssignmentRules = [
      ...sortedOmAssignmentRules().filter((rule) => rule.id !== ruleId && (!payload.isFallback || !rule.isFallback)),
      payload,
    ];
    pushAdminAuditEvent("admin.om_assignment_rule_updated", "om_assignment_rule", ruleId, payload);
  }
  renderAdminSetup();
  showToast("OM assignment rule saved.", "success");
}
// @end-legacy-unit 1812

// @legacy-unit 1813 23856
export async function createAdminUserFromForm() {
  const payload = {
    employeeId: document.getElementById("adminNewUserEmployeeId")?.value.trim() || "",
    name: document.getElementById("adminNewUserName")?.value.trim() || "",
    email: document.getElementById("adminNewUserEmail")?.value.trim() || "",
    department: document.getElementById("adminNewUserDepartment")?.value.trim() || "",
    role_key: document.getElementById("adminNewUserRole")?.value || "requester",
    scopeType: document.getElementById("adminNewUserScopeType")?.value || "department",
    scopeValue: document.getElementById("adminNewUserScopeValue")?.value.trim() || "",
  };
  if (!payload.employeeId || !payload.name || !payload.email || !payload.department) {
    showToast("Employee ID, name, email, and department are required.", "error");
    return;
  }
  if (apiModeEnabled()) {
    try {
      await apiRequest("/api/admin/users", { method: "POST", body: payload });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.users.unshift(normalizeAdminUserRow({
      id: `user-${Date.now()}`,
      employeeId: payload.employeeId,
      name: payload.name,
      email: payload.email,
      department: payload.department,
      role: appRoleForAdminRoleKey(payload.role_key),
      scopeType: payload.scopeType,
      scopeValue: payload.scopeValue || payload.department,
      status: "active",
      createdBy: sessionUserFromRole("admin").id,
      createdAt: new Date().toISOString(),
    }));
    pushAdminAuditEvent("admin.user_created", "user", payload.employeeId, payload);
  }
  ["adminNewUserEmployeeId", "adminNewUserName", "adminNewUserEmail", "adminNewUserDepartment", "adminNewUserScopeValue"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  renderAdminSetup();
  showToast("Admin user created.", "success");
}
// @end-legacy-unit 1813

// @legacy-unit 1814 23902
export async function updateAdminUserStatusAction(userId, status) {
  if (!userId) return;
  if (apiModeEnabled()) {
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/status`, { method: "PATCH", body: { status } });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.users = adminApprovalSetup.users.map((user) => user.id === userId ? {
      ...user,
      status,
      disabledAt: status === "active" ? "" : new Date().toISOString(),
    } : user);
    pushAdminAuditEvent(status === "active" ? "admin.user_activated" : "admin.user_deactivated", "user", userId, { status });
  }
  renderAdminSetup();
  showToast(`User ${status === "active" ? "activated" : "deactivated"}.`, "success");
}
// @end-legacy-unit 1814

// @legacy-unit 1815 23924
export async function updateAdminUserField(userId, field, value) {
  const fieldMap = {
    employeeId: "employeeId",
    name: "name",
    email: "email",
    department: "department",
    role: "role_key",
    scopeType: "scopeType",
    scopeValue: "scopeValue",
  };
  const mapped = fieldMap[field];
  if (!mapped) return;
  if (apiModeEnabled()) {
    const current = adminApprovalSetup.users.find((user) => user.id === userId);
    if (!current) return;
    const body = {
      employeeId: field === "employeeId" ? value : current.employeeId,
      name: field === "name" ? value : current.name,
      email: field === "email" ? value : current.email,
      department: field === "department" ? value : current.department,
      role_key: field === "role" ? normalizeAdminRoleKey(value) : normalizeAdminRoleKey(current.role),
      scopeType: field === "scopeType" ? value : current.scopeType,
      scopeValue: field === "scopeValue" ? value : current.scopeValue,
    };
    try {
      await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, { method: "PATCH", body });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.users = adminApprovalSetup.users.map((user) => user.id === userId ? {
      ...user,
      [field]: value,
      ...(field === "role" ? { role: value } : {}),
    } : user);
    pushAdminAuditEvent("admin.user_role_changed", "user", userId, { field, value });
  }
  renderAdminSetup();
}
// @end-legacy-unit 1815

// @legacy-unit 1816 23966
export async function createAdminRoleFromForm() {
  const payload = {
    role_key: document.getElementById("adminNewRoleKey")?.value.trim() || "",
    role_name: document.getElementById("adminNewRoleName")?.value.trim() || "",
    role_level: document.getElementById("adminNewRoleLevel")?.value.trim() || "governance",
  };
  if (!payload.role_key || !payload.role_name) {
    showToast("Role key and role name are required.", "error");
    return;
  }
  if (apiModeEnabled()) {
    try {
      await apiRequest("/api/admin/roles", { method: "POST", body: payload });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.roles.push({
      roleKey: payload.role_key,
      roleName: payload.role_name,
      appRole: payload.role_key,
      roleLevel: payload.role_level,
      isSystem: false,
    });
    adminApprovalSetup.rolePermissions[payload.role_key] = JSON.parse(JSON.stringify(defaultAdminRolePermissions().requester || {}));
    pushAdminAuditEvent("admin.role_created", "role", payload.role_key, payload);
  }
  ["adminNewRoleKey", "adminNewRoleName", "adminNewRoleLevel"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  renderAdminSetup();
  showToast("Role created.", "success");
}
// @end-legacy-unit 1816

// @legacy-unit 1817 24003
export async function updateAdminRolePermission(roleKey, moduleKey, actionKey, checked) {
  const current = adminApprovalSetup.rolePermissions?.[roleKey]?.[moduleKey] || {};
  const next = {
    ...current,
    [actionKey]: checked,
  };
  if (apiModeEnabled()) {
    try {
      await apiRequest(`/api/admin/roles/${encodeURIComponent(roleKey)}/permissions`, {
        method: "PATCH",
        body: {
          permissions: {
            [moduleKey]: {
              canCreate: Boolean(next.canCreate),
              canUpdate: Boolean(next.canUpdate),
              canDelete: Boolean(next.canDelete),
              canView: Boolean(next.canView),
              canExport: Boolean(next.canExport),
            },
          },
        },
      });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    adminApprovalSetup.rolePermissions[roleKey] = adminApprovalSetup.rolePermissions[roleKey] || {};
    adminApprovalSetup.rolePermissions[roleKey][moduleKey] = next;
    pushAdminAuditEvent("admin.permission_updated", "role", roleKey, { moduleKey, actionKey, checked });
  }
  renderAdminSetup();
}
// @end-legacy-unit 1817

// @legacy-unit 1818 24038
export async function updateAdminFieldVisibility(fieldKey, roleKey, visible) {
  const current = adminApprovalSetup.fieldVisibilityRules[fieldKey];
  if (!current) return;
  if (apiModeEnabled()) {
    try {
      await apiRequest("/api/admin/field-visibility", {
        method: "PATCH",
        body: { rules: [{ fieldKey, roleKey, visibility: visible ? "visible" : "hidden", reserved: current.reserved }] },
      });
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    current.visibilityByRole[roleKey] = visible ? "visible" : "hidden";
    pushAdminAuditEvent("admin.field_visibility_updated", "field_visibility", fieldKey, { roleKey, visibility: current.visibilityByRole[roleKey] });
  }
  renderAdminSetup();
}
// @end-legacy-unit 1818

// @legacy-unit 1819 24059
export function parseAdminImportText(text = "") {
  return String(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [employeeId, name, email, department, roleKey, scopeType, scopeValue] = line.split(",").map((item) => item.trim());
    return { employeeId, name, email, department, role_key: roleKey || "requester", scopeType: scopeType || "department", scopeValue: scopeValue || department };
  });
}
// @end-legacy-unit 1819

// @legacy-unit 1820 24066
export async function importAdminUsersFromTextarea() {
  const text = document.getElementById("adminImportTextarea")?.value || "";
  const rows = parseAdminImportText(text);
  if (!rows.length) {
    showToast("Paste CSV lines before import.", "error");
    return;
  }
  if (apiModeEnabled()) {
    try {
      const result = await apiRequest("/api/admin/users/import", { method: "POST", body: { rows } });
      if (result.errors?.length) showToast(`Imported ${result.imported?.length || 0} rows with ${result.errors.length} errors.`, "info");
      else showToast(`Imported ${result.imported?.length || 0} users.`, "success");
      await refreshAdminSetup({ silent: true });
    } catch (error) {
      showToast(error.message, "error");
      return;
    }
  } else {
    const imported = [];
    const errors = [];
    rows.forEach((row, index) => {
      if (!row.employeeId || !row.name || !row.email || !row.department) {
        errors.push(`Row ${index + 1}: missing required fields`);
        return;
      }
      if (adminApprovalSetup.users.some((user) => user.employeeId === row.employeeId || user.email === row.email)) {
        errors.push(`Row ${index + 1}: duplicate employee_id or email`);
        return;
      }
      imported.push(normalizeAdminUserRow({
        id: `import-${Date.now()}-${index}`,
        employeeId: row.employeeId,
        name: row.name,
        email: row.email,
        department: row.department,
        role: appRoleForAdminRoleKey(row.role_key),
        status: "active",
        scopeType: row.scopeType,
        scopeValue: row.scopeValue,
        createdBy: sessionUserFromRole("admin").id,
        createdAt: new Date().toISOString(),
      }));
    });
    adminApprovalSetup.users = [...imported, ...adminApprovalSetup.users];
    adminApprovalSetup.importJobs.unshift({
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: sessionUserFromRole("admin").id,
      importedCount: imported.length,
      errorCount: errors.length,
      errors,
    });
    pushAdminAuditEvent("admin.user_imported", "import_job", adminApprovalSetup.importJobs[0].id, { importedCount: imported.length, errorCount: errors.length });
    showToast(errors.length ? `Imported ${imported.length} rows with ${errors.length} errors.` : `Imported ${imported.length} users.`, errors.length ? "info" : "success");
  }
  const textarea = document.getElementById("adminImportTextarea");
  if (textarea) textarea.value = "";
  renderAdminSetup();
}
// @end-legacy-unit 1820

// @legacy-unit 1821 24126
export async function exportAdminUsers() {
  if (apiModeEnabled()) {
    window.open("/api/admin/users/export?format=csv", "_blank", "noopener");
    return;
  }
  const header = ["employee_id", "name", "email", "department", "role", "status", "scope_type", "scope_value"];
  const lines = [
    header.join(","),
    ...adminApprovalSetup.users.map((user) => [user.employeeId, user.name, user.email, user.department, normalizeAdminRoleKey(user.role), user.status, user.scopeType, user.scopeValue].join(",")),
  ];
  downloadFile("admin-users-export.csv", lines.join("\n"), "text/csv");
  pushAdminAuditEvent("admin.user_exported", "user_export", `count:${adminApprovalSetup.users.length}`, { count: adminApprovalSetup.users.length });
}
// @end-legacy-unit 1821

// @legacy-unit 1822 24140
export async function exportAdminAuditLog() {
  if (apiModeEnabled()) {
    window.open("/api/admin/audit-events/export", "_blank", "noopener");
    return;
  }
  const rows = filteredAdminAuditRows();
  const header = ["created_at", "event_type", "actor_user_id", "actor_role", "entity_type", "entity_id"];
  const lines = [
    header.join(","),
    ...rows.map((row) => [row.createdAt, row.eventType, row.actorUserId, row.actorRole, row.entityType, row.entityId].join(",")),
  ];
  downloadFile("admin-audit-export.csv", lines.join("\n"), "text/csv");
}
// @end-legacy-unit 1822
