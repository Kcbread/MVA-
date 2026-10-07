// om/leader-data: authoritative source; see docs/module-map.md.
import {
  OM_INTERNAL_SLA_DAYS,
  omPendingOwnerForGroup
} from "./progress-data.js";
import {
  procurementStatusValue
} from "./tracking-rules.js";
import {
  projectStageCalendarLineOpenDate
} from "../projects/calendar.js";
import {
  dateOnly,
  requiredDeliveryDateFollowStageDate
} from "../projects/dates.js";
import {
  compactList
} from "../shared/detail-view.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  OM_USER_CONFIRMED
} from "../workflow/status-constants.js";
import {
  workflowStatusForGroup
} from "../workflow/status-view.js";

// @legacy-unit 1382 16721
export function omLeaderGroupAssignees(group = {}) {
  return [...(group.assigneeNames || new Set())].filter(Boolean);
}
// @end-legacy-unit 1382

// @legacy-unit 1383 16725
export function omLeaderHasUnassignedOwner(group = {}) {
  const names = omLeaderGroupAssignees(group);
  return !names.length || names.includes("Unassigned");
}
// @end-legacy-unit 1383

// @legacy-unit 1384 16730
export function omLeaderProcurementRisk(group = {}) {
  const rows = group.rows || [];
  return rows.some((row) =>
    (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED || row.prNo || row.buyerPoNo || row.poNo || row.prStatus || row.poStatus)
    && !row.finalExportedAt
    && (procurementStatusValue(row.prStatus) !== "Done" || procurementStatusValue(row.poStatus) !== "Done")
  );
}
// @end-legacy-unit 1384

// @legacy-unit 1385 16739
export function omLeaderDeliveryRisk(group = {}) {
  const rows = group.rows || [];
  return rows.some((row) =>
    (row.finalExportStatus || row.finalExportTarget || row.userAQuoteDecisionStatus === OM_USER_CONFIRMED || row.etaPlanDate || row.etaPlan || row.dtaActualDate || row.dtaActual)
    && (!dateOnly(row.etaPlanDate || row.etaPlan || row.eta) || !dateOnly(row.dtaActualDate || row.dtaActual || row.actualEta))
  );
}
// @end-legacy-unit 1385

// @legacy-unit 1386 16747
export function omLeaderRiskLabel(group = {}) {
  if (omLeaderHasUnassignedOwner(group)) return "Assign Owner";
  if (group.sla?.isOverdue) return "Over SLA";
  if (omLeaderProcurementRisk(group)) return "Procurement Tracking";
  if (omLeaderDeliveryRisk(group)) return "Delivery Tracking";
  const pendingOwner = omPendingOwnerForGroup(group);
  return pendingOwner && pendingOwner !== "Done" ? pendingOwner : "Monitor";
}
// @end-legacy-unit 1386

// @legacy-unit 1387 16756
export function omLeaderNextAction(group = {}) {
  if (omLeaderHasUnassignedOwner(group)) return "Assign OM owner";
  if (group.sla?.isOverdue) return group.sla.remark || "Escalate aging stage";
  if (omLeaderProcurementRisk(group)) return "Check PR / PO progress with OM Purchasing";
  if (omLeaderDeliveryRisk(group)) return "Confirm ETA / DTA update";
  return workflowStatusForGroup(group, "om").nextAction || "Monitor progress";
}
// @end-legacy-unit 1387

// @legacy-unit 1388 16764
export function omLeaderSnapshotMetrics(rows = []) {
  const openRows = rows.length;
  const overSla = rows.filter((group) => group.sla?.isOverdue).length;
  const unassigned = rows.filter(omLeaderHasUnassignedOwner).length;
  const procurementRisk = rows.filter(omLeaderProcurementRisk).length;
  const deliveryRisk = rows.filter(omLeaderDeliveryRisk).length;
  const readyForHandoff = rows.filter((group) => group.sla?.stageKey === "readyToExport").length;
  return [
    { label: "Open OM Rows", value: openRows, helper: "Current filtered scope", variant: "hero" },
    { label: "Over SLA", value: overSla, helper: `>${OM_INTERNAL_SLA_DAYS}d or stage SLA`, variant: overSla ? "warning" : "" },
    { label: "Need Assignment", value: unassigned, helper: "Owner missing" },
    { label: "Procurement Risk", value: procurementRisk, helper: "PR / PO not done" },
    { label: "Delivery Risk", value: deliveryRisk, helper: "ETA / DTA incomplete" },
    { label: "Ready for Buyer Handoff", value: readyForHandoff, helper: "Requester confirmed" },
  ];
}
// @end-legacy-unit 1388

// @legacy-unit 1389 16781
export function omLeaderExceptionRows(rows = []) {
  return rows
    .filter((group) => (
      omLeaderHasUnassignedOwner(group)
      || group.sla?.isOverdue
      || omLeaderProcurementRisk(group)
      || omLeaderDeliveryRisk(group)
    ))
    .sort((left, right) => {
      const leftScore = (left.sla?.isOverdue ? 100 : 0) + (omLeaderHasUnassignedOwner(left) ? 80 : 0) + (omLeaderProcurementRisk(left) ? 50 : 0) + (omLeaderDeliveryRisk(left) ? 40 : 0);
      const rightScore = (right.sla?.isOverdue ? 100 : 0) + (omLeaderHasUnassignedOwner(right) ? 80 : 0) + (omLeaderProcurementRisk(right) ? 50 : 0) + (omLeaderDeliveryRisk(right) ? 40 : 0);
      return rightScore - leftScore || (right.sla?.daysInStage || 0) - (left.sla?.daysInStage || 0);
    });
}
// @end-legacy-unit 1389

// @legacy-unit 1390 16796
export function omLeaderProgressOverviewRows(rows = []) {
  const stages = [
    ["Pending PAS Demand", (group) => group.sla?.stageKey === "pendingPasDemand"],
    ["Pending Bidding Result", (group) => group.sla?.stageKey === "pendingBiddingResult"],
    ["Ready for Buyer Handoff", (group) => group.sla?.stageKey === "readyToExport"],
    ["Procurement Tracking", (group) => group.sla?.stageKey === "buyerHandoff" || omLeaderProcurementRisk(group)],
    ["Delivery Tracking", omLeaderDeliveryRisk],
  ];
  return stages.map(([label, predicate]) => {
    const matched = rows.filter(predicate);
    return {
      label,
      total: matched.length,
      overdue: matched.filter((group) => group.sla?.isOverdue).length,
      owners: compactList(new Set(matched.flatMap(omLeaderGroupAssignees).filter(Boolean)), "No owner"),
    };
  });
}
// @end-legacy-unit 1390

// @legacy-unit 1391 16815
export function omLeaderTeamWorkloadRows(rows = []) {
  const workload = new Map();
  rows.forEach((group) => {
    const owners = omLeaderGroupAssignees(group);
    (owners.length ? owners : ["Unassigned"]).forEach((owner) => {
      const record = workload.get(owner) || { owner, total: 0, overdue: 0, procurement: 0, delivery: 0 };
      record.total += 1;
      if (group.sla?.isOverdue) record.overdue += 1;
      if (omLeaderProcurementRisk(group)) record.procurement += 1;
      if (omLeaderDeliveryRisk(group)) record.delivery += 1;
      workload.set(owner, record);
    });
  });
  return [...workload.values()].sort((left, right) => right.overdue - left.overdue || right.total - left.total || left.owner.localeCompare(right.owner));
}
// @end-legacy-unit 1391

// @legacy-unit 1392 16831
export function omLeaderProjectStageDateRows(rows = []) {
  const byKey = new Map();
  rows.forEach((group) => {
    const project = group.project || "";
    const projectCode = group.projectCode || group.rows?.find((row) => row.projectCode)?.projectCode || "";
    const phase = group.phase || "";
    const key = `${project}::${projectCode}::${phase}`;
    if (!project || !phase || byKey.has(key)) return;
    const lineOpenDate = projectStageCalendarLineOpenDate({ project, projectCode, phase });
    byKey.set(key, {
      label: `${project}${projectCode ? ` / ${projectCode}` : ""} / ${stageLabel(phase)}`,
      lineOpenDate: lineOpenDate || "-",
      requiredByStage: lineOpenDate ? requiredDeliveryDateFollowStageDate(lineOpenDate) || "-" : "-",
    });
  });
  return [...byKey.values()].slice(0, 4);
}
// @end-legacy-unit 1392
