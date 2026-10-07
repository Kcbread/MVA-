const { textValue, demandTypeLabel, numberValue, dateOnlyValue, isoDateValue } = require('./values');

function workflowReviewRowFromGroup(group) {
  const first = group.rows[0] || {};
  const currentStage = textValue(first.current_stage, 80);
  const pendingOwnerRole = textValue(first.pending_owner_role, 40);
  const pendingApproval = group.rows.find((row) => row.approval_decision === "pending") || {};
  const seenDemandLines = new Set();
  const stationBreakdown = group.rows
    .filter((row) => row.demand_line_id)
    .filter((row) => {
      const id = textValue(row.demand_line_id, 96);
      if (!id || seenDemandLines.has(id)) return false;
      seenDemandLines.add(id);
      return true;
    })
    .map((row) => {
      const demandType = demandTypeLabel(row.demand_type);
      return {
        id: textValue(row.demand_line_id, 96),
        demandType,
        phase: textValue(row.phase_code, 40),
        station: demandType === "MFG" ? textValue(row.station_or_unit, 120) : "",
        demandUnit: demandType === "Non-MFG" ? textValue(row.station_or_unit, 120) : "",
        qty: numberValue(row.quantity),
        requestLine: textValue(row.line_code, 80),
        needDate: dateOnlyValue(row.demand_need_date || first.need_date),
        requesterDept: textValue(first.demand_department, 120),
        demandDepartment: textValue(first.demand_department, 120),
        projectCode: textValue(row.demand_project_code || first.project_code, 80),
        remark: textValue(row.remark, 500),
      };
    });
  const totalQty = stationBreakdown.reduce((sum, row) => sum + numberValue(row.qty), 0);
  const submittedAt = isoDateValue(first.submitted_at);
  const isDeptDriPending = currentStage === "dept_dri_review" && pendingOwnerRole === "deptDri";
  const isCostManagerPending = currentStage === "cost_manager_authorization" && pendingOwnerRole === "costOwner";
  return {
    id: textValue(first.package_id, 96),
    requestItemId: textValue(first.request_item_id, 96),
    packageCode: textValue(first.package_code, 120),
    source: "UAT MySQL",
    dbBacked: true,
    project: textValue(first.project_name || first.project_code, 160),
    projectCode: textValue(first.project_code, 80),
    yearProject: textValue(first.project_name || first.project_code, 160),
    projectType: textValue(first.project_family, 40) || "Mixed",
    name: textValue(first.item_name, 240),
    spec: textValue(first.item_spec, 1000),
    level1: textValue(first.item_category, 120),
    department: textValue(first.demand_department, 120),
    requesterDept: textValue(first.requester_department || first.demand_department, 120),
    demandDepartment: textValue(first.demand_department, 120),
    submittedBy: textValue(first.created_by_name || first.created_by_user_id, 160),
    submittedAt,
    receivedAt: isoDateValue(first.received_at),
    stageStartAt: isoDateValue(first.stage_start_at),
    requiredDeliveryDate: dateOnlyValue(first.need_date),
    needDate: dateOnlyValue(first.need_date),
    status: currentStage === "requester_draft" ? "Draft" : "Submitted",
    currentStage,
    pendingOwnerRole,
    pendingOwnerUserId: textValue(first.pending_owner_user_id, 64),
    nextStep: isDeptDriPending
      ? "Dept DRI submission review"
      : isCostManagerPending
        ? "Cost Manager final authorization"
        : currentStage.replace(/_/g, " "),
    deptDriReviewStatus: isDeptDriPending ? "Pending Dept DRI Submission Review" : "",
    deptDriReviewSubmittedAt: submittedAt,
    costManagerAuthorizationStatus: isCostManagerPending ? "Pending Cost Manager Authorization" : "",
    stationBreakdown,
    totalRequestedQty: numberValue(first.total_requested_qty) || totalQty,
    estimateCurrency: textValue(first.estimate_currency, 3),
    estimatedUnitPrice: numberValue(first.estimate_unit_price_usd || first.estimate_unit_price),
    estimatedUnitPriceUsd: numberValue(first.estimate_unit_price_usd || first.estimate_unit_price),
    estimateReason: textValue(first.estimate_reason, 500),
    approvalId: textValue(pendingApproval.approval_id, 96),
    approvalStage: textValue(pendingApproval.approval_stage, 80),
    approvalRole: textValue(pendingApproval.approval_role, 40),
  };
}

module.exports = { workflowReviewRowFromGroup };
