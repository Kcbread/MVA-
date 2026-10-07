// demand/baselines: authoritative source; see docs/module-map.md.
import {
  baselineFor
} from "../cost/demand-metrics.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  clampQty
} from "./quantity.js";
import {
  globalItemIdFor,
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
  PROJECTS
} from "../projects/state.js";
import {
  recordIndex
} from "../shared/format.js";

// @legacy-unit 396 2035
export function demandKey(row, stage = currentStageForProject(row.project)) {
  return `${row.project}__${globalItemKey(row)}__${stage}`;
}
// @end-legacy-unit 396

// @legacy-unit 397 2039
export function makeDemandBaselines(records) {
  const baseRows = records.flatMap((record) => {
    const index = recordIndex(record);
    return STAGES.map((stage, stageIndex) => {
      if ((index + stageIndex) % 13 === 0) return null;
      const baseQty = clampQty(record[stage]);
      return {
        id: `DB-${record.project}-${record.partNo}-${stage}`,
        project: record.project,
        stage,
        sourceRecordId: record.id,
        partNo: record.partNo,
        materialNo: materialNoFor(record),
        materialIdentityKey: materialIdentityKey(record),
        globalItemKey: globalItemKey(record),
        globalItemId: globalItemIdFor(record),
        name: record.name,
        spec: record.spec,
        vendor: record.vendor,
        unitPrice: record.unitPrice,
        baselineQty: baseQty + ((index + stageIndex) % 3),
        sourceFile: "Google Worksheet import simulation",
        updatedBy: "System import",
        updatedAt: new Date(2026, 4, 8, 8 + (index % 8), stageIndex * 5).toISOString(),
      };
    }).filter(Boolean);
  });
  const mirroredRows = records.slice(0, 10).map((record, index) => {
    const targetProject = PROJECTS.find((project) => project !== record.project) || record.project;
    const stage = currentStageForProject(targetProject);
    return {
      id: `DB-${targetProject}-${globalItemIdFor(record)}-${stage}`,
      project: targetProject,
      stage,
      sourceRecordId: record.id,
      partNo: record.partNo,
      materialNo: materialNoFor(record),
      materialIdentityKey: materialIdentityKey(record),
      globalItemKey: globalItemKey(record),
      globalItemId: globalItemIdFor(record),
      name: record.name,
      spec: record.spec,
      vendor: record.vendor,
      unitPrice: record.unitPrice,
      baselineQty: Math.max(1, clampQty(record[stage]) + (index % 3)),
      sourceFile: "Cross-project demand simulation",
      updatedBy: "System import",
      updatedAt: new Date(2026, 4, 8, 16, index * 4).toISOString(),
    };
  });
  return [...baseRows, ...mirroredRows];
}
// @end-legacy-unit 397

// @legacy-unit 398 2092
export function makeActualBuyRecords(records) {
  return records.flatMap((record) => {
    const index = recordIndex(record);
    const currentStage = currentStageForProject(record.project);
    const stageIndex = DEMAND_STAGE_ORDER.indexOf(currentStage);
    const sourceStages = DEMAND_STAGE_ORDER.slice(0, Math.max(1, stageIndex + 1));
    if (index !== 1 && index % 9 === 0) return [];
    return sourceStages.map((stage, sourceIndex) => {
      const baseline = records === purchaseRecords ? baselineFor(record, currentStage) : null;
      const baseQty = stage === currentStage ? clampQty(record[currentStage]) : Math.max(0, clampQty(record[currentStage]) - sourceIndex);
      const actualQty = index === 1
        ? (sourceIndex === 0 ? 14 : 0)
        : (index % 7 === 0 ? baseQty + 3 : Math.max(0, baseQty - (index % 4 === 0 ? 2 : 0)));
      return {
        id: `AB-${record.project}-${record.partNo}-${stage}`,
        project: record.project,
        stage,
        requestId: "",
        sourceRecordId: record.id,
        partNo: record.partNo,
        materialNo: materialNoFor(record),
        materialIdentityKey: materialIdentityKey(record),
        globalItemKey: globalItemKey(record),
        globalItemId: globalItemIdFor(record),
        name: record.name,
        poNo: `ACT-${record.poNo}`,
        approvedQty: baseline?.baselineQty ?? clampQty(record[currentStage]),
        actualQty,
        buyDate: `2026-0${Math.min(5, sourceIndex + 1)}-${String((index % 24) + 1).padStart(2, "0")}`,
        vendor: record.vendor,
        unitPrice: record.unitPrice,
        externalRef: `ERP-${record.project}-${String(10000 + index)}`,
        updateSource: "Simulated external system",
        status: "Completed",
      };
    });
  });
}
// @end-legacy-unit 398
