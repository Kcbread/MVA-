const { publicUser } = require('./user-model');
const { normalizeOmAssignmentRule } = require('./om-models');

function createAssignmentService({ pool, queryOmAssignees, memoryStore, queryOmAssignments, findUserById, audit, querySetOmAssignment }) {
  async function omAssignees() {
    if (pool) {
      const [rows] = await queryOmAssignees();
      return rows;
    }
    return [...memoryStore.usersById.values()]
      .filter((user) => ["omLeader", "omMember", "om"].includes(user.role) && user.is_active)
      .map(publicUser)
      .sort((left, right) => `${left.role} ${left.name}`.localeCompare(`${right.role} ${right.name}`));
  }
  
  async function omAssignments() {
    if (pool) {
      const [rows] = await queryOmAssignments();
      return rows;
    }
    return [...memoryStore.assignments.values()];
  }
  
  async function omAssignmentRules() {
    return memoryStore.omAssignmentRules.map(normalizeOmAssignmentRule).sort((left, right) =>
      left.priority - right.priority || Number(left.isFallback) - Number(right.isFallback) || left.name.localeCompare(right.name));
  }
  
  async function validateOmAssignmentRule(rule, { excludeId = "" } = {}) {
    if (!rule.name) {
      const error = new Error("Rule name is required");
      error.status = 400;
      throw error;
    }
    if (!rule.assigneeUserId) {
      const error = new Error("Assignee is required");
      error.status = 400;
      throw error;
    }
    if (rule.priority < 1) {
      const error = new Error("Priority must be 1 or greater");
      error.status = 400;
      throw error;
    }
    const assignee = await findUserById(rule.assigneeUserId);
    if (!assignee || assignee.role !== "omMember" || !assignee.is_active) {
      const error = new Error("Assignee must be an active OM Purchasing user");
      error.status = 400;
      throw error;
    }
    if (rule.isFallback) {
      const duplicate = memoryStore.omAssignmentRules
        .map(normalizeOmAssignmentRule)
        .find((item) => item.id !== excludeId && item.isFallback && item.active);
      if (duplicate) {
        const error = new Error("Only one active fallback rule is allowed");
        error.status = 400;
        throw error;
      }
    }
  }
  
  async function createOmAssignmentRule(req, actor, payload = {}) {
    const rule = normalizeOmAssignmentRule(payload);
    await validateOmAssignmentRule(rule);
    memoryStore.omAssignmentRules = [
      ...memoryStore.omAssignmentRules.filter((item) => !(rule.isFallback && normalizeOmAssignmentRule(item).isFallback)),
      rule,
    ];
    await audit("admin.om_assignment_rule_created", req, {
      actor,
      entityType: "om_assignment_rule",
      entityId: rule.id,
      metadata: rule,
    });
    return rule;
  }
  
  async function updateOmAssignmentRule(req, actor, ruleId, payload = {}) {
    const existing = memoryStore.omAssignmentRules.map(normalizeOmAssignmentRule).find((rule) => rule.id === ruleId);
    if (!existing) {
      const error = new Error("OM assignment rule not found");
      error.status = 404;
      throw error;
    }
    const next = normalizeOmAssignmentRule({ ...existing, ...payload, id: ruleId });
    await validateOmAssignmentRule(next, { excludeId: ruleId });
    memoryStore.omAssignmentRules = [
      ...memoryStore.omAssignmentRules
        .map(normalizeOmAssignmentRule)
        .filter((rule) => rule.id !== ruleId && !(next.isFallback && rule.isFallback)),
      next,
    ];
    await audit("admin.om_assignment_rule_updated", req, {
      actor,
      entityType: "om_assignment_rule",
      entityId: ruleId,
      metadata: next,
    });
    return next;
  }
  
  async function setOmAssignment(req, actor, requestId, assignedToUserId, note) {
    const assignee = assignedToUserId ? await findUserById(assignedToUserId) : null;
    if (assignedToUserId && !assignee) {
      const error = new Error("Assignee not found");
      error.status = 404;
      throw error;
    }
    if (assignedToUserId && !["omLeader", "omMember", "om"].includes(assignee.role)) {
      const error = new Error("Assignee must be an OM user");
      error.status = 400;
      throw error;
    }
    const assignment = {
      requestId,
      assignedToUserId: assignedToUserId || null,
      assignedToName: assignee?.name || "",
      assignedToEmail: assignee?.email || "",
      assignedByUserId: actor.id,
      assignedByName: actor.name,
      assignedAt: new Date().toISOString(),
      assignmentStatus: assignedToUserId ? "assigned" : "cleared",
      assignmentNote: note || "",
    };
    if (pool) {
      await querySetOmAssignment(requestId, assignment, actor);
    } else {
      if (assignedToUserId) memoryStore.assignments.set(requestId, assignment);
      else memoryStore.assignments.delete(requestId);
    }
    await audit(assignedToUserId ? "om.assignment_set" : "om.assignment_cleared", req, {
      actor,
      entityType: "request",
      entityId: requestId,
      metadata: assignment,
    });
    return assignment;
  }
  return { omAssignees, omAssignments, omAssignmentRules, validateOmAssignmentRule, createOmAssignmentRule, updateOmAssignmentRule, setOmAssignment };
}

module.exports = { createAssignmentService };
