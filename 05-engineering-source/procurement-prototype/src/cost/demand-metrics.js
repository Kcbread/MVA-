// cost/demand-metrics: authoritative source; see docs/module-map.md.
import {
  actualBuyRecords,
  demandBaselines,
  purchaseRecords
} from "../data/state.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  globalItemKey,
  materialIdentityKey,
  materialNoFor
} from "../materials/identity.js";
import {
  DEMAND_STAGE_ORDER,
  STAGES,
  currentStageForProject
} from "../projects/config.js";
import {
  currentProject
} from "../projects/state.js";
import {
  normalize
} from "../shared/format.js";

// @legacy-unit 649 4834
export function previousStageKeys(stageKey) {
  const index = STAGES.indexOf(stageKey);
  return index <= 0 ? [] : STAGES.slice(0, index);
}
// @end-legacy-unit 649

// @legacy-unit 650 4839
export function demandComparable(row, candidate) {
  return globalItemKey(candidate) === globalItemKey(row)
    || (candidate.sourceRecordId && (candidate.sourceRecordId === row.sourceRecordId || candidate.sourceRecordId === row.id))
    || normalize([candidate.name, itemDetail(candidate)].filter(Boolean).join("|"))
      === normalize([row.name, itemDetail(row)].filter(Boolean).join("|"));
}
// @end-legacy-unit 650

// @legacy-unit 651 4846
export function baselineFor(row, stage = currentStageForProject(row.project)) {
  return demandBaselines.find((baseline) => baseline.project === row.project && baseline.stage === stage && demandComparable(row, baseline)) || null;
}
// @end-legacy-unit 651

// @legacy-unit 652 4850
export function crossProjectActualRows(row, stage = currentStageForProject(row.project)) {
  const stageEndIndex = DEMAND_STAGE_ORDER.indexOf(stage);
  const allowedStages = new Set(DEMAND_STAGE_ORDER.slice(0, stageEndIndex + 1));
  return actualBuyRecords.filter((actual) => actual.project === row.project && allowedStages.has(actual.stage) && demandComparable(row, actual));
}
// @end-legacy-unit 652

// @legacy-unit 653 4856
export function actualBuyFor(row, stage = currentStageForProject(row.project)) {
  const rows = crossProjectActualRows(row, stage);
  if (!rows.length) return null;
  return rows.reduce((sum, actual) => sum + clampQty(actual.actualQty), 0);
}
// @end-legacy-unit 653

// @legacy-unit 654 4862
export function approvedDemandFor(row, stage = currentStageForProject(row.project)) {
  return requests
    .filter((request) => request.project === row.project && request.status === "Approved" && demandComparable(row, request))
    .reduce((sum, request) => sum + clampQty(request[stage]), 0);
}
// @end-legacy-unit 654

// @legacy-unit 655 4868
export function currentRequestFor(row, stage = currentStageForProject(row.project), sourceType = "request") {
  if (sourceType === "request" && !["Approved", "Rejected"].includes(row.status)) return clampQty(row[stage]);
  return requests
    .filter((request) => request.project === row.project && !["Approved", "Rejected"].includes(request.status) && demandComparable(row, request))
    .reduce((sum, request) => sum + clampQty(request[stage]), 0);
}
// @end-legacy-unit 655

// @legacy-unit 656 4875
export function consumedDemandFor(row, stage = currentStageForProject(row.project)) {
  return demandBaselines
    .filter((baseline) => demandComparable(row, baseline) && DEMAND_STAGE_ORDER.indexOf(baseline.stage) <= DEMAND_STAGE_ORDER.indexOf(stage))
    .reduce((sum, baseline) => sum + clampQty(baseline.baselineQty), 0);
}
// @end-legacy-unit 656

// @legacy-unit 657 4881
export function sourceProjectsFor(row, stage = currentStageForProject(row.project)) {
  const rows = crossProjectActualRows(row, stage);
  return [...new Set(rows.map((actual) => actual.project))];
}
// @end-legacy-unit 657

// @legacy-unit 658 4886
export function usedByOtherProjectsFor(row, stage = currentStageForProject(row.project)) {
  return demandBaselines
    .filter((baseline) => baseline.project !== row.project && demandComparable(row, baseline) && DEMAND_STAGE_ORDER.indexOf(baseline.stage) <= DEMAND_STAGE_ORDER.indexOf(stage))
    .reduce((sum, baseline) => sum + clampQty(baseline.baselineQty), 0);
}
// @end-legacy-unit 658

// @legacy-unit 659 4892
export function matchingPurchaseRecord(row) {
  return purchaseRecords.find((record) => record.id === row.sourceRecordId)
    || purchaseRecords.find((record) => record.project === row.project && record.partNo === row.partNo)
    || purchaseRecords.find((record) => record.project === row.project && normalize(record.name) === normalize(row.name));
}
// @end-legacy-unit 659

// @legacy-unit 660 4898
export function stageDemandMetric(row, sourceType = "request", stage = currentStageForProject(row.project)) {
  const baseline = baselineFor(row, stage);
  const baselineDemand = baseline ? clampQty(baseline.baselineQty) : null;
  const crossProjectActualBuy = actualBuyFor(row, stage);
  const approvedDemand = approvedDemandFor(row, stage);
  const currentRequestQty = currentRequestFor(row, stage, sourceType);
  const consumedDemand = consumedDemandFor(row, stage);
  const usedByOtherProjects = usedByOtherProjectsFor(row, stage);
  const actualForMath = crossProjectActualBuy ?? 0;
  const baselineForMath = baselineDemand ?? 0;
  const availableResidual = Math.max(0, actualForMath - consumedDemand);
  const carryoverStock = availableResidual;
  const remainingNeed = baselineDemand === null ? currentRequestQty : Math.max(0, baselineForMath - availableResidual - approvedDemand);
  const demandBaseForNewBuy = currentRequestQty > 0 ? currentRequestQty : baselineForMath;
  const suggestedNewBuy = baselineDemand === null
    ? currentRequestQty
    : Math.max(0, demandBaseForNewBuy - availableResidual - approvedDemand);
  const variance = baselineDemand === null ? currentRequestQty : actualForMath + approvedDemand + currentRequestQty - baselineForMath;
  const sourceProjects = sourceProjectsFor(row, stage);
  const riskStatus = demandRiskStatus({
    baselineDemand,
    crossProjectActualBuy,
    approvedDemand,
    currentRequestQty,
    remainingNeed,
    variance,
    availableResidual,
    usedByOtherProjects,
    sourceProjects,
    project: row.project,
  });

  return {
    stage,
    baselineDemand,
    approvedDemand,
    actualBuy: crossProjectActualBuy,
    crossProjectActualBuy,
    consumedDemand,
    usedByOtherProjects,
    availableResidual,
    carryoverStock,
    currentRequestQty,
    remainingNeed,
    variance,
    riskStatus,
    suggestedQty: suggestedNewBuy,
    suggestedNewBuy,
    sourceProjects,
  };
}
// @end-legacy-unit 660

// @legacy-unit 661 4950
export function demandRiskStatus({ baselineDemand, crossProjectActualBuy, approvedDemand, currentRequestQty, remainingNeed, variance, availableResidual, usedByOtherProjects, sourceProjects, project }) {
  if (baselineDemand === null) return "Missing Plan";
  if (currentRequestQty > remainingNeed && currentRequestQty > 0) return "Over Request";
  if (availableResidual > 0) return "Carryover Available";
  if (remainingNeed > 0) return "Need Purchase";
  return "OK";
}
// @end-legacy-unit 661

// @legacy-unit 662 4958
export function stageDemandRows(projectFilter = currentProject, stageFilter = currentStageForProject(projectFilter || currentProject)) {
  const rows = [];
  const seen = new Set();
  const addRow = (row, sourceType) => {
    const stage = stageFilter || currentStageForProject(row.project);
    const key = `${row.project}-${stage}-${globalItemKey(row)}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      ...row,
      detailSource: sourceType,
      detailId: row.id,
      metrics: stageDemandMetric(row, sourceType, stage),
    });
  };

  purchaseRecords
    .filter((row) => !projectFilter || row.project === projectFilter)
    .forEach((row) => addRow(row, "record"));

  demandBaselines
    .filter((row) => !projectFilter || row.project === projectFilter)
    .forEach((baseline) => {
      const sourceRecord = matchingPurchaseRecord(baseline)
        || purchaseRecords.find((record) => demandComparable(record, baseline));
      addRow({
        ...(sourceRecord || {}),
        ...baseline,
        id: sourceRecord?.id || baseline.sourceRecordId || baseline.id,
        sourceRecordId: baseline.sourceRecordId || sourceRecord?.id,
        project: baseline.project,
        partNo: baseline.partNo || sourceRecord?.partNo,
        materialNo: baseline.materialNo || materialNoFor(sourceRecord || baseline),
        materialIdentityKey: baseline.materialIdentityKey || materialIdentityKey(sourceRecord || baseline),
        globalItemId: baseline.globalItemId || sourceRecord?.globalItemId,
        name: baseline.name || sourceRecord?.name,
        spec: baseline.spec || sourceRecord?.spec,
        vendor: baseline.vendor || sourceRecord?.vendor,
        unitPrice: baseline.unitPrice ?? sourceRecord?.unitPrice ?? 0,
      }, sourceRecord ? "record" : "baseline");
    });

  requests
    .filter((row) => row.status !== "Rejected" && (!projectFilter || row.project === projectFilter))
    .forEach((row) => addRow(row, "request"));

  return rows;
}
// @end-legacy-unit 662
