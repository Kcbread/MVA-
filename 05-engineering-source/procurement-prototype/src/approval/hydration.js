// approval/hydration: authoritative source; see docs/module-map.md.
import {
  clampQty,
  createStationBreakdownEntry,
  demandTypeFor,
  stationBreakdownRowTotal,
  syncRowPhaseQtyFromStationBreakdown
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
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  STAGE_LABELS,
  currentStageForProject,
  phaseKeyFromInput,
  projectConfigs,
  projectTypeFor,
  replaceProjectConfigsBinding
} from "../projects/config.js";
import {
  PROJECTS,
  replacePROJECTSBinding
} from "../projects/state.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  DEPT_DRI_SUBMISSION_PENDING
} from "../workflow/status-constants.js";

// @legacy-unit 438 2614
export function reviewWorkflowApiRoles() {
  return ["dri", "manager", "projectDri", "admin"];
}
// @end-legacy-unit 438

// @legacy-unit 439 2618
export function normalizeWorkflowReviewBreakdown(row = {}) {
  const demandType = demandTypeFor(row);
  return createStationBreakdownEntry(row, {
    id: row.id || `DB-SBD-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    demandType,
    phase: phaseKeyFromInput(row.phase),
    station: demandType === DEMAND_TYPE_MFG ? row.station : "",
    demandUnit: demandType === DEMAND_TYPE_NON_MFG ? row.demandUnit : "",
    qty: clampQty(row.qty),
    requestLine: row.requestLine || "",
    requesterDept: row.requesterDept || row.demandDepartment || "",
    demandDepartment: row.demandDepartment || row.requesterDept || "",
    remark: row.remark || "",
  });
}
// @end-legacy-unit 439

// @legacy-unit 440 2634
export function ensureProjectConfigForWorkflowRow(row = {}) {
  const code = row.project || row.projectCode || "";
  if (!code || PROJECTS.includes(code)) return;
  replaceProjectConfigsBinding([
    ...projectConfigs,
    {
      code,
      projectType: row.projectType || projectTypeFor(code),
      currentPhase: STAGE_LABELS[currentStageForProject(code)] || "P1.0",
      openToUser: true,
      stageDates: {},
    },
  ]);
  replacePROJECTSBinding(projectConfigs.map((project) => project.code));
}
// @end-legacy-unit 440

// @legacy-unit 441 2650
export function normalizeWorkflowReviewRow(row = {}) {
  const stationBreakdown = Array.isArray(row.stationBreakdown)
    ? row.stationBreakdown.map(normalizeWorkflowReviewBreakdown).filter((item) => stationBreakdownRowTotal(item) > 0)
    : [];
  const normalized = syncRowPhaseQtyFromStationBreakdown({
    ...row,
    id: row.id || row.packageCode || row.requestItemId,
    project: row.project || row.projectCode || "-",
    projectCode: row.projectCode || "",
    yearProject: row.yearProject || row.project || row.projectCode || "",
    projectType: row.projectType || projectTypeFor(row.project || row.projectCode),
    name: row.name || row.itemName || "DB workflow row",
    spec: row.spec || row.itemSpec || "",
    status: row.status || "Submitted",
    source: row.source || "UAT MySQL",
    dbBacked: true,
    requiredDeliveryDate: row.requiredDeliveryDate || row.needDate || "",
    needDate: row.needDate || row.requiredDeliveryDate || "",
    deptDriReviewStatus: row.deptDriReviewStatus || DEPT_DRI_SUBMISSION_PENDING,
    deptDriReviewSubmittedAt: row.deptDriReviewSubmittedAt || row.submittedAt || "",
    nextStep: row.nextStep || "Dept DRI submission review",
    stationBreakdown,
  });
  ensureProjectConfigForWorkflowRow(normalized);
  return normalized;
}
// @end-legacy-unit 441

// @legacy-unit 442 2677
export function mergeWorkflowReviewRows(rows = []) {
  const normalizedRows = rows.map(normalizeWorkflowReviewRow).filter((row) => row.id);
  if (!normalizedRows.length) return 0;
  const ids = new Set(normalizedRows.map((row) => row.id));
  replaceRequestsBinding([
    ...normalizedRows,
    ...requests.filter((row) => !ids.has(row.id)),
  ]);
  return normalizedRows.length;
}
// @end-legacy-unit 442

// @legacy-unit 443 2688
export async function hydrateWorkflowReviewRows(role = currentRole, { silent = true } = {}) {
  if (!apiModeEnabled() || !reviewWorkflowApiRoles().includes(role)) return 0;
  try {
    const payload = await apiRequest("/api/workflow/review-rows");
    const count = mergeWorkflowReviewRows(payload.rows || []);
    if (!silent && count) showToast(`Loaded ${count} workflow review row${count === 1 ? "" : "s"} from UAT DB.`, "success");
    return count;
  } catch (error) {
    if (!silent) showToast(`Workflow review API unavailable: ${error.message}`, "error");
    return 0;
  }
}
// @end-legacy-unit 443
