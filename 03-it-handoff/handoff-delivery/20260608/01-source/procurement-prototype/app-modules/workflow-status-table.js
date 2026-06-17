(function registerWorkflowStatusTableModule(root) {
  const workflowStatus = root.ProcurementApp?.modules?.workflowStatus
    || (typeof require !== "undefined" ? require("./workflow-status.js") : {});
  const roleGuards = root.ProcurementApp?.modules?.roleGuards
    || (typeof require !== "undefined" ? require("./role-guards.js") : {});

  const INTERNAL_PROCUREMENT_KEYS = new Set([
    "vendor",
    "vendorPartNo",
    "pasMaterialNo",
    "factoryMaterialNo",
    "omAssignee",
    "assignedTo",
  ]);

  const COLUMN_DEFINITIONS = {
    select: { key: "select", label: "Select", type: "action" },
    project: { key: "project", label: "Project", type: "identity" },
    item: { key: "item", label: "Item", type: "identity" },
    qty: { key: "qty", label: "Qty", type: "number" },
    submittedAt: { key: "submittedAt", label: "Submitted Date", type: "date" },
    receivedAt: { key: "receivedAt", label: "Received Date", type: "date" },
    pendingOwner: { key: "pendingOwner", label: "Pending Owner", type: "status" },
    currentStage: { key: "currentStage", label: "Current Stage", type: "status" },
    daysPending: { key: "daysPending", label: "Days Pending", type: "number" },
    quoteStatus: { key: "quoteStatus", label: "Quote Status", type: "status" },
    actionStatus: { key: "actionStatus", label: "Action Status", type: "status" },
    nextAction: { key: "nextAction", label: "Next Action", type: "note" },
    riskReason: { key: "riskReason", label: "Risk Reason", type: "note" },
    timeline: { key: "timeline", label: "Timeline", type: "timeline" },
    assignment: { key: "assignment", label: "Assigned To", type: "identity" },
    detail: { key: "detail", label: "Detail", type: "action" },
  };

  const ROLE_COLUMN_KEYS = {
    requester: ["project", "item", "qty", "submittedAt", "currentStage", "actionStatus", "timeline", "detail"],
    costOwner: ["project", "item", "qty", "submittedAt", "receivedAt", "pendingOwner", "currentStage", "daysPending", "quoteStatus", "nextAction", "riskReason", "detail"],
    omLeader: ["project", "item", "qty", "receivedAt", "pendingOwner", "currentStage", "daysPending", "assignment", "detail"],
    omMember: ["project", "item", "qty", "receivedAt", "pendingOwner", "currentStage", "daysPending", "assignment", "detail"],
    admin: ["project", "item", "qty", "submittedAt", "receivedAt", "pendingOwner", "currentStage", "daysPending", "quoteStatus", "nextAction", "assignment", "riskReason", "timeline", "detail"],
  };

  function normalizeRole(role = "requester") {
    return roleGuards.normalizeRole ? roleGuards.normalizeRole(role) : role;
  }

  function columnsForRole(role = "requester") {
    const normalizedRole = normalizeRole(role);
    const keys = ROLE_COLUMN_KEYS[normalizedRole] || ROLE_COLUMN_KEYS.requester;
    return keys.map((key) => ({ ...COLUMN_DEFINITIONS[key] }));
  }

  function roleViewKey(role = "requester") {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === "costOwner") return "costOwner";
    if (normalizedRole === "omLeader" || normalizedRole === "omMember") return "om";
    if (normalizedRole === "admin") return "admin";
    return "requester";
  }

  function itemLabel(row = {}) {
    return row.name || row.item || row.itemName || row.partName || "-";
  }

  function projectLabel(row = {}) {
    return row.project || row.yearProject || row.projectCode || "-";
  }

  function qtyLabel(row = {}) {
    const qty = Number(row.totalQty ?? row.qty ?? row.quantity ?? 0);
    return Number.isFinite(qty) ? qty : 0;
  }

  function assignmentLabel(row = {}) {
    return row.assignedToName || row.assignedTo || row.omAssignee || row.assignedToUserId || "-";
  }

  function actionStatusLabel(row = {}, status = {}) {
    if (Array.isArray(status.statusLabels) && status.statusLabels.length) return status.statusLabels.join(" / ");
    return status.nextAction || "-";
  }

  function valueMapForRow(row = {}, status = {}, role = "requester") {
    return {
      project: projectLabel(row),
      item: itemLabel(row),
      qty: qtyLabel(row),
      submittedAt: status.submittedAt || "",
      receivedAt: status.receivedAt || "",
      pendingOwner: status.pendingOwner || "-",
      currentStage: status.currentStage || "-",
      daysPending: status.daysPending,
      quoteStatus: status.quoteStatus || "-",
      actionStatus: actionStatusLabel(row, status),
      nextAction: status.nextAction || "-",
      riskReason: status.riskReason || "",
      timeline: status.timelineMilestones || [],
      assignment: assignmentLabel(row),
      detail: "Detail",
      roleView: roleViewKey(role),
    };
  }

  function assertRequesterVisibility(columns) {
    const leaked = columns.filter((column) => INTERNAL_PROCUREMENT_KEYS.has(column.key));
    if (leaked.length) {
      throw new Error(`Requester workflow status columns leak internal procurement fields: ${leaked.map((column) => column.key).join(", ")}`);
    }
  }

  function rowView(row = {}, roleContext = {}) {
    const role = roleContext.role || "requester";
    const columns = columnsForRole(role);
    if (roleViewKey(role) === "requester") assertRequesterVisibility(columns);
    const status = workflowStatus.buildWorkflowStatus
      ? workflowStatus.buildWorkflowStatus(row, roleContext)
      : {};
    const values = valueMapForRow(row, status, role);
    return {
      role: normalizeRole(role),
      view: roleViewKey(role),
      columns,
      values,
      status,
    };
  }

  function groupView(group = {}, roleContext = {}) {
    const role = roleContext.role || "requester";
    const columns = columnsForRole(role);
    const rows = Array.isArray(group.rows) ? group.rows : [];
    const status = workflowStatus.buildWorkflowGroupStatus
      ? workflowStatus.buildWorkflowGroupStatus(group, roleContext)
      : {};
    const representative = rows[0] || group;
    const values = valueMapForRow({
      ...representative,
      totalQty: rows.reduce((sum, row) => sum + qtyLabel(row), 0) || representative.totalQty,
    }, status, role);
    return {
      role: normalizeRole(role),
      view: roleViewKey(role),
      columns,
      values,
      status,
      rowCount: rows.length,
    };
  }

  const api = {
    COLUMN_DEFINITIONS,
    ROLE_COLUMN_KEYS,
    columnsForRole,
    rowView,
    groupView,
    roleViewKey,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.workflowStatusTable = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
