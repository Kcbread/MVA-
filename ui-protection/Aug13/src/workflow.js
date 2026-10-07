(function initWorkflow(root, factory) {
  const source = typeof module === "object" && module.exports ? require("./scenarios.js") : root.FihUat;
  const api = factory(source);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FihUat = Object.assign(root.FihUat || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this, function workflowFactory(source) {
  class WorkflowError extends Error {}
  const STAGE_META = Object.fromEntries(source.STAGES.map((stage) => [stage, { label: stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), owner: source.OWNER[stage], next: source.NEXT[stage] }]));
  const RULES = {
    REQUESTER_ACTION_REQUIRED: { requester: { RESUBMIT: "RETURN_STAGE" } },
    DEPT_DRI_REVIEW: { dri: { APPROVE: "COST_MANAGER_REVIEW", REJECT: "REQUESTER_ACTION_REQUIRED" } },
    COST_MANAGER_REVIEW: { manager: { APPROVE: "OM_LEADER_ASSIGNMENT", REJECT: "REQUESTER_ACTION_REQUIRED" } },
    BUDGET_EXCEPTION_REVIEW: { projectDri: { APPROVE: "OM_LEADER_ASSIGNMENT", REJECT: "REQUESTER_ACTION_REQUIRED" } },
    OM_LEADER_ASSIGNMENT: { omLeader: { ASSIGN: "OM_PURCHASING_INTAKE" } },
    OM_PURCHASING_INTAKE: { omMember: { SAVE_INTAKE: "QUOTE_VALIDATION" } },
    QUOTE_VALIDATION: { omMember: { VALIDATE_QUOTE: "OM_HANDOFF" } },
    OM_HANDOFF: { omMember: { HANDOFF: "BUYER_HANDOFF" } },
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const text = (value) => String(value == null ? "" : value).trim();
  const totalQty = (row) => Object.values(row.quantities || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  function allowedActions(row, role) { return Object.keys(RULES[row?.stage]?.[role] || {}); }
  function findRow(state, id) { const row = state.demands.find((item) => item.id === id); if (!row) throw new WorkflowError(`Unknown demand: ${id}`); return row; }
  function stamp(row, actorRole, action, fromStage, toStage, reason, now) { row.timeline.push({ id: `EVT-${row.id}-${row.timeline.length + 1}`, at: now, actorRole, action, fromStage, toStage, reason: text(reason) }); }
  function setStage(row, stage) { row.stage = stage; row.pendingOwner = source.OWNER[stage]; row.nextAction = source.NEXT[stage]; row.status = stage === "BUYER_HANDOFF" ? "Handoff Complete" : stage === "REQUESTER_ACTION_REQUIRED" ? "Action Required" : "In Progress"; }

  function updateDemand(state, id, patch, actorRole) {
    const next = clone(state), row = findRow(next, id);
    if (actorRole !== "requester" || !["REQUESTER_DRAFT", "REQUESTER_ACTION_REQUIRED"].includes(row.stage)) throw new WorkflowError("Demand edit is not allowed for this role or stage.");
    for (const [key, value] of Object.entries(patch || {})) {
      if (key.startsWith("qty.")) { const phase = key.slice(4); if (source.PHASES.includes(phase)) row.quantities[phase] = Math.max(0, Math.floor(Number(value) || 0)); }
      else if (["purpose", "requiredDeliveryDate", "requestAction", "item", "spec"].includes(key)) row[key] = text(value);
    }
    row.blockers = validateDraft(row).map((message) => message);
    return next;
  }
  function validateDraft(row) {
    const errors = [];
    if (totalQty(row) > 0 && !text(row.requiredDeliveryDate)) errors.push("Required Delivery Date is required for rows with quantity.");
    if (totalQty(row) > 0 && !["SMT", "FATP"].includes(row.purpose)) errors.push("Purpose must be SMT or FATP.");
    return errors;
  }
  function submitScope(state, scope, actorRole, now = new Date().toISOString()) {
    if (actorRole !== "requester") throw new WorkflowError("Scope submit is only allowed for Requester.");
    const next = clone(state), invalid = []; let submitted = 0;
    next.demands.filter((row) => row.stage === "REQUESTER_DRAFT" && row.project === scope.project && row.line === scope.line && row.mode === scope.mode).forEach((row) => {
      if (totalQty(row) <= 0) return;
      const errors = validateDraft(row);
      if (errors.length) { row.blockers = errors; invalid.push({ id: row.id, errors }); return; }
      const from = row.stage; row.dateOfRequest = now.slice(0, 10); row.blockers = []; setStage(row, "DEPT_DRI_REVIEW"); stamp(row, actorRole, "SUBMIT_SCOPE", from, row.stage, `${scope.project} ${scope.line} ${scope.mode}`, now); submitted += 1;
    });
    return { state: next, submitted, invalid };
  }
  function addDemand(state, actorRole) {
    if (actorRole !== "requester") throw new WorkflowError("Only Requester can add demand rows.");
    const next = clone(state), scope = next.scope, id = `DEM-${String(Math.max(...next.demands.map((row) => Number(row.id.split("-")[1]) || 0)) + 1).padStart(5, "0")}`;
    const row = { id, dataLabel: "DEMO / UAT", yearProject: "Y26", project: scope.project, line: scope.line, mode: scope.mode, item: "New DEMO Item", spec: "Enter item specification", purpose: "SMT", requestAction: "New Buy", requiredDeliveryDate: "", quantities: Object.fromEntries(source.PHASES.map((phase) => [phase, 0])), stage: "REQUESTER_DRAFT", pendingOwner: source.OWNER.REQUESTER_DRAFT, nextAction: source.NEXT.REQUESTER_DRAFT, status: "Draft", returnStage: "", assignedOm: "", temporaryBudget: false, estimatedUnitPrice: 0, pasRequired: true, blockers: [], timeline: [{ id: `EVT-${id}-1`, at: new Date().toISOString(), actorRole, action: "ADD_DEMAND", fromStage: "", toStage: "REQUESTER_DRAFT", reason: "Requester added DEMO row" }] };
    next.demands.unshift(row); next.activeDemandId = id; return next;
  }
  function validateAction(row, action, payload) {
    if (action === "REJECT" && !text(payload.reason)) throw new WorkflowError("Rejection reason is required.");
    if (action === "RESUBMIT" && !text(payload.revisionNote)) throw new WorkflowError("Revision note is required.");
    if (action === "ASSIGN" && !text(payload.assignedOm)) throw new WorkflowError("Assigned OM is required.");
    if (action === "SAVE_INTAKE" && row.pasRequired && !text(payload.pasDemandNo)) throw new WorkflowError("PAS Demand No is required for this item.");
    if (action === "VALIDATE_QUOTE" && ["vendorName", "vendorNumber", "currency", "unitPrice", "quoteDate", "quoteValidUntil", "quoteReference"].some((key) => !text(payload[key]))) throw new WorkflowError("Complete quote evidence is required before validation.");
    if (action === "HANDOFF" && ["budgetStatus", "prStatus", "poStatus", "etaPlan", "purRequestNo", "totalLeadTime"].some((key) => !text(payload[key]))) throw new WorkflowError("Complete OM Handoff tracking is required.");
  }
  function transitionDemand(state, id, action, payload = {}, actorRole, now = new Date().toISOString()) {
    const next = clone(state), row = findRow(next, id), destination = RULES[row.stage]?.[actorRole]?.[action];
    if (!destination) throw new WorkflowError(`${action} is not allowed for ${actorRole} at ${row.stage}.`);
    validateAction(row, action, payload); const from = row.stage;
    if (action === "REJECT") row.returnStage = from;
    if (action === "ASSIGN") row.assignedOm = text(payload.assignedOm);
    Object.assign(row, payload);
    const to = destination === "RETURN_STAGE" ? row.returnStage || "DEPT_DRI_REVIEW" : destination;
    if (action === "RESUBMIT") row.returnStage = "";
    setStage(row, to); row.blockers = []; stamp(row, actorRole, action, from, to, payload.reason || payload.revisionNote || payload.note, now); return next;
  }
  function updateStageCalendar(state, project, phase, date, actorRole) { if (!["omLeader", "admin"].includes(actorRole)) throw new WorkflowError("Stage Calendar update is not allowed for this role."); const next = clone(state); next.stageCalendar[`${text(project)}|${text(phase)}`] = text(date); return next; }
  function updateAdminSetting(state, key, value, actorRole) { if (actorRole !== "admin") throw new WorkflowError("Admin setting update is not allowed for this role."); const next = clone(state); next.settings[key] = key === "priceThresholdUsd" ? Number(value) : text(value); return next; }
  return { WorkflowError, STAGE_META, totalQty, allowedActions, updateDemand, validateDraft, submitScope, addDemand, transitionDemand, updateStageCalendar, updateAdminSetting };
});
