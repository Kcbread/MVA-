// approval/queues: authoritative source; see docs/module-map.md.
import {
  roleReviewRows
} from "./analysis-scope.js";
import {
  approvalReviewConfigForRole,
  approvalReviewSurfaceModule,
  managerReviewRole,
  updateApprovalReviewState
} from "./navigation.js";
import {
  isDeptDriSubmissionPending,
  priceReviewRequiresBudgetApprover
} from "./status.js";
import {
  needDateForRow
} from "../demand/request-fields.js";
import {
  requests
} from "../demand/state.js";
import {
  roleQueueConfigModule
} from "../infrastructure/module-adapters.js";
import {
  warehouseStockRecords
} from "../inventory/state.js";
import {
  isWarehousePendingUse,
  warehouseOwnerForTransaction
} from "../inventory/warehouse.js";
import {
  ITEM_OWNER_UNIT
} from "../projects/config.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  currentPriceReviewQueue,
  replaceCurrentPriceReviewQueueBinding
} from "../shell/state.js";
import {
  PRICE_ESCALATION_REJECTED,
  PRICE_ESCALATION_REQUIRED
} from "../workflow/status-constants.js";
import {
  latestRequestActivityTime
} from "../workflow/timeline.js";

// @legacy-unit 1220 14884
export function managerRows(role = managerReviewRole(currentRole)) {
  const projectFilter = document.getElementById("managerProjectFilter")?.value || "";
  if (role !== "manager") {
    return roleReviewRows(role).filter((row) => {
      const project = row.project || row.targetProject || "";
      return !projectFilter || project === projectFilter;
    });
  }
  return requests.filter((row) => {
    return ["Submitted", "Approved"].includes(row.status)
      && (!projectFilter || row.project === projectFilter);
  });
}
// @end-legacy-unit 1220

// @legacy-unit 1221 14898
export function priceReviewSubmissionRows() {
  return requests.filter((row) => isDeptDriSubmissionPending(row) && currentRole === "dri")
    .sort((left, right) => {
      const dateDiff = new Date(needDateForRow(left) || "9999-12-31") - new Date(needDateForRow(right) || "9999-12-31");
      if (dateDiff) return dateDiff;
      return latestRequestActivityTime(right) - latestRequestActivityTime(left);
    });
}
// @end-legacy-unit 1221

// @legacy-unit 1222 14907
export function priceReviewExceptionRows() {
  return requests.filter((row) => {
    if (row.priceDecisionStatus !== PRICE_ESCALATION_REQUIRED) return false;
    if (row.priceApprovalStatus === PRICE_ESCALATION_REJECTED || row.projectDriApprovedAt) return false;
    return currentRole === "dri" && !row.driApprovedAt;
  }).sort((left, right) => {
    const dateDiff = new Date(needDateForRow(left) || "9999-12-31") - new Date(needDateForRow(right) || "9999-12-31");
    if (dateDiff) return dateDiff;
    return latestRequestActivityTime(right) - latestRequestActivityTime(left);
  });
}
// @end-legacy-unit 1222

// @legacy-unit 1223 14919
export function priceReviewBudgetRows() {
  return requests.filter((row) => {
    if (row.priceDecisionStatus !== PRICE_ESCALATION_REQUIRED) return false;
    if (row.priceApprovalStatus === PRICE_ESCALATION_REJECTED || row.projectDriApprovedAt) return false;
    return currentRole === "projectDri" && priceReviewRequiresBudgetApprover(row) && Boolean(row.driApprovedAt) && !row.projectDriApprovedAt;
  }).sort((left, right) => {
    const dateDiff = new Date(needDateForRow(left) || "9999-12-31") - new Date(needDateForRow(right) || "9999-12-31");
    if (dateDiff) return dateDiff;
    return latestRequestActivityTime(right) - latestRequestActivityTime(left);
  });
}
// @end-legacy-unit 1223

// @legacy-unit 1224 14931
export function priceReviewStockRows() {
  return warehouseStockRecords
    .filter((row) => isWarehousePendingUse(row) && warehouseOwnerForTransaction(row) === ITEM_OWNER_UNIT)
    .filter(() => currentRole === "dri")
    .sort((left, right) => String(left.targetProject || "").localeCompare(String(right.targetProject || "")) || String(left.item || "").localeCompare(String(right.item || "")))
    .map((row) => ({
      ...row,
      workbenchType: "stockCarryover",
      project: row.targetProject || row.sourceProject || "-",
      name: row.item,
    }));
}
// @end-legacy-unit 1224

// @legacy-unit 1225 14944
export function priceReviewQueueRows(queue = currentPriceReviewQueue) {
  if (queue === "submission") return priceReviewSubmissionRows();
  if (queue === "stock") return priceReviewStockRows();
  if (queue === "budget") return priceReviewBudgetRows();
  return priceReviewExceptionRows();
}
// @end-legacy-unit 1225

// @legacy-unit 1226 14951
export function availablePriceReviewQueues() {
  const queueMeta = roleQueueConfigModule();
  const approvalSurface = approvalReviewSurfaceModule();
  const queues = [];
  if (currentRole === "dri") {
    queues.push({
      id: "submission",
      label: approvalSurface?.queueLabel?.(currentRole, "submission", queueMeta.queueLabel?.(currentRole, "submission", "Submission Review")) || "Submission Review",
      helper: "Requester submissions that still need Dept DRI gate approval before Cost Manager authorization.",
      rows: priceReviewSubmissionRows(),
    });
    queues.push({
      id: "exception",
      label: approvalSurface?.queueLabel?.(currentRole, "exception", queueMeta.queueLabel?.(currentRole, "exception", "Price Exception Review")) || "Price Exception Review",
      helper: "Quoted rows above threshold, missing history price, or Temporary Budget cases waiting Dept DRI review.",
      rows: priceReviewExceptionRows(),
    });
    queues.push({
      id: "stock",
      label: approvalSurface?.queueLabel?.(currentRole, "stock", queueMeta.queueLabel?.(currentRole, "stock", "Unit Stock Review")) || "Unit Stock Review",
      helper: "Unit-owned stock-use candidates stay here for Dept DRI confirmation. OM-owned and MFG-owned warehouse evidence does not appear in this queue.",
      rows: priceReviewStockRows(),
    });
  } else if (currentRole === "projectDri") {
    queues.push({
      id: "budget",
      label: approvalSurface?.queueLabel?.(currentRole, "budget", queueMeta.queueLabel?.(currentRole, "budget", "Budget Exception Approval")) || "Budget Exception Approval",
      helper: "Dept DRI-approved price exceptions that still need Budget Approver release.",
      rows: priceReviewBudgetRows(),
    });
  }
  const visibleQueues = queues;
  return visibleQueues.sort((left, right) => {
    const leftHasRows = left.rows.length ? 1 : 0;
    const rightHasRows = right.rows.length ? 1 : 0;
    if (leftHasRows !== rightHasRows) return rightHasRows - leftHasRows;
    return 0;
  });
}
// @end-legacy-unit 1226

// @legacy-unit 1227 14991
export function ensureCurrentPriceReviewQueue() {
  const queues = availablePriceReviewQueues();
  if (!queues.length) {
    replaceCurrentPriceReviewQueueBinding("submission");
    updateApprovalReviewState(currentRole, { activeQueue: currentPriceReviewQueue });
    return [];
  }
  const currentQueue = queues.find((queue) => queue.id === currentPriceReviewQueue);
  if (!currentQueue || (!currentQueue.rows.length && queues.some((queue) => queue.rows.length))) {
    const preferred = queues.find((queue) => queue.rows.length) || currentQueue || queues[0];
    replaceCurrentPriceReviewQueueBinding(preferred.id);
  }
  updateApprovalReviewState(currentRole, { activeQueue: currentPriceReviewQueue });
  return queues;
}
// @end-legacy-unit 1227

// @legacy-unit 1228 15007
export function priceReviewQueueMeta(queue = currentPriceReviewQueue) {
  const queues = ensureCurrentPriceReviewQueue();
  return queues.find((item) => item.id === queue) || queues[0] || {
    id: "submission",
    label: "Review Queue",
    helper: "No queue is active.",
    rows: [],
  };
}
// @end-legacy-unit 1228

// @legacy-unit 1229 15017
export function priceReviewEmptyState(role = currentRole, queue = currentPriceReviewQueue) {
  const queueDefinition = approvalReviewSurfaceModule()?.queueDefinition?.(role, queue);
  if (queueDefinition && approvalReviewConfigForRole(role)?.emptyStateCopy) return approvalReviewConfigForRole(role).emptyStateCopy;
  if (role === "dri" && queue === "submission") return "No requester submissions are waiting for Dept DRI review.";
  if (role === "dri" && queue === "exception") return "No quoted exceptions are waiting for Dept DRI escalation review.";
  if (role === "dri" && queue === "stock") return "No unit-owned stock candidates are waiting for Dept DRI confirmation.";
  if (role === "projectDri" && queue === "budget") return "No Dept DRI-approved budget exceptions are waiting for Budget Approver release.";
  return `No rows are waiting for ${roleProfiles[role]?.name || "this role"} in this queue.`;
}
// @end-legacy-unit 1229

// @legacy-unit 1230 15027
export function renderPriceReviewWorkspaceBanner(queues = ensureCurrentPriceReviewQueue(), activeQueue = priceReviewQueueMeta()) {
  const host = document.getElementById("priceReviewWorkspaceBanner");
  if (!host) return;
  host.innerHTML = "";
  host.hidden = true;
}
// @end-legacy-unit 1230
