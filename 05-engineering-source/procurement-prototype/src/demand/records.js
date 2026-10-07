// demand/records: authoritative source; see docs/module-map.md.
import {
  amountUsdFromVnd,
  amountVndFromUsd,
  legacyPriceToUsd
} from "../cost/currency.js";
import {
  normalizeRequestIntentFields
} from "./intent.js";
import {
  clampQty,
  demandUnitFor,
  stationBreakdownFromRecord,
  syncRowPhaseQtyFromStationBreakdown
} from "./quantity.js";
import {
  globalItemIdFor,
  globalItemKey,
  materialIdentityKey,
  materialMasterRecordFor
} from "../materials/identity.js";
import {
  omResponsibilityPatch
} from "../om/ownership.js";
import {
  quoteStatus
} from "../om/quote-validity.js";
import {
  requiredDeliveryDateForProject
} from "../projects/calendar.js";
import {
  DEFAULT_PURPOSE_LOCATION,
  DEMAND_UNIT_FALLBACK,
  currentStageForProject,
  projectCodeForRow,
  projectTypeFor
} from "../projects/config.js";
import {
  dateOnly,
  givenLeadTimeDays,
  normalizePurposeLocation,
  requestDatePlanByPhase,
  requestPhaseLineOpenDate,
  requiredDeliveryDateFollowStageDate
} from "../projects/dates.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  currentRequesterDepartment,
  normalizeRequestDemandDepartment,
  rowDemandDepartment
} from "../session/persona.js";

// @legacy-unit 923 9365
export function dateOfRequestForRow(row = {}) {
  return dateOnly(row.dateOfRequest || row.requestedAt || row.submittedAt || row.createdAt || "");
}
// @end-legacy-unit 923

// @legacy-unit 924 9369
export function normalizeRequesterDateFields(row = {}) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose || DEFAULT_PURPOSE_LOCATION);
  const dateOfRequest = dateOfRequestForRow(row);
  const requiredDeliveryDate = dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || "");
  const datePlanByPhase = requestDatePlanByPhase({ ...row, purposeLocation }, dateOfRequest);
  const lineOpenDate = dateOnly(row.lineOpenDate || Object.values(datePlanByPhase)[0]?.lineOpenDate || "");
  const requiredByStage = requiredDeliveryDateFollowStageDate(lineOpenDate);
  return {
    ...row,
    purposeLocation,
    purpose: purposeLocation,
    lineOpenDate,
    datePlanByPhase,
    dateOfRequest,
    requiredDeliveryDate,
    requiredDeliveryDateFollowStageDate: requiredByStage,
    givenLeadTimeDays: givenLeadTimeDays(dateOfRequest, lineOpenDate),
  };
}
// @end-legacy-unit 924

// @legacy-unit 925 9389
export function requestFromRecord(record, overrides = {}) {
  const masterRecord = materialMasterRecordFor(record);
  const project = overrides.project || record.project || currentProject;
  const stage = overrides.phase || overrides.defaultPhase || currentStageForProject(project);
  const yearProject = overrides.yearProject || record.yearProject || project;
  const projectCode = overrides.projectCode ?? record.projectCode ?? (project === currentProject ? currentProjectCode : projectCodeForRow(record));
  const requestIntent = normalizeRequestIntentFields({ ...record, ...overrides });
  const omPatch = omResponsibilityPatch({ ...record, ...overrides, project });
  const demandDepartment = rowDemandDepartment({ ...record, ...overrides }, currentRequesterDepartment());
  const draft = normalizeRequesterDateFields({
    id: `DRAFT-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    project,
    yearProject,
    projectCode,
    projectType: overrides.projectType || record.projectType || projectTypeFor(project),
    timelineSource: `${projectTypeFor(project)} Requester Timeline`,
    lineOpenDate: overrides.lineOpenDate || record.lineOpenDate || requestPhaseLineOpenDate({ project, phase: stage }),
    requiredDeliveryDate: Object.prototype.hasOwnProperty.call(overrides, "requiredDeliveryDate")
      ? overrides.requiredDeliveryDate
      : record.requiredDeliveryDate || requiredDeliveryDateForProject(project, stage),
    sourceRecordId: record.id,
    sourceSuggestionId: record.sourceSuggestionId || "",
    sourceProject: overrides.sourceProject || record.sourceProject || record.project || currentProject,
    sourceFactoryMaterialNo: record.sourceFactoryMaterialNo || record.factoryMaterialNo || "",
    partNo: record.partNo,
    materialId: record.materialId || masterRecord?.materialId || "",
    materialNo: record.materialNo || masterRecord?.materialNo || "",
    factoryMaterialNo: overrides.factoryMaterialNo || "",
    pasMaterialNo: record.pasMaterialNo || "",
    materialIdentityKey: materialIdentityKey(record),
    materialStatus: record.materialStatus || masterRecord?.materialStatus || "",
    standardNameCn: record.standardNameCn || record.name || "",
    standardNameEn: record.standardNameEn || record.name || "",
    standardNameVn: record.standardNameVn || record.name || "",
    vendorPartNo: record.vendorPartNo || record.partNo || "",
    source: record.source || "",
    catalogBucket: record.catalogBucket || "",
    catalogStatus: record.catalogStatus || "",
    ...omPatch,
    globalItemKey: globalItemKey(record),
    globalItemId: globalItemIdFor(record),
    name: record.name,
    level1: record.level1 || "",
    level2: record.level2 || "",
    level3: record.level3 || "",
    spec: record.spec,
    purpose: overrides.purpose ?? overrides.purposeLocation ?? record.purposeLocation ?? record.purpose ?? "",
    purposeLocation: overrides.purposeLocation ?? record.purposeLocation ?? record.purpose ?? "",
    process: record.process,
    station: record.station,
    department: demandDepartment,
    requesterDept: record.requesterDept || overrides.requesterDept || demandDepartment,
    demandDepartment: record.demandDepartment || overrides.demandDepartment || demandDepartment,
    unitPrice: record.unitPrice,
    unitPriceUsd: legacyPriceToUsd(record, "unitPrice"),
    unitPriceVnd: Number(record.unitPriceVnd || 0) || (legacyPriceToUsd(record, "unitPrice") ? Math.round(amountVndFromUsd(legacyPriceToUsd(record, "unitPrice"))) : 0),
    estimatedUnitPrice: clampQty(overrides.estimatedUnitPrice ?? record.estimatedUnitPrice),
    estimatedUnitPriceUsd: legacyPriceToUsd({ ...record, ...overrides }, "estimatedUnitPrice"),
    estimatedUnitPriceVnd: Number(overrides.estimatedUnitPriceVnd || record.estimatedUnitPriceVnd || 0) || (legacyPriceToUsd({ ...record, ...overrides }, "estimatedUnitPrice") ? Math.round(amountVndFromUsd(legacyPriceToUsd({ ...record, ...overrides }, "estimatedUnitPrice"))) : 0),
    estimatedAmount: clampQty(overrides.estimatedAmount ?? record.estimatedAmount),
    estimatedAmountUsd: Number(overrides.estimatedAmountUsd || record.estimatedAmountUsd || 0) || amountUsdFromVnd(clampQty(overrides.estimatedAmount ?? record.estimatedAmount)),
    estimatedAmountVnd: Number(overrides.estimatedAmountVnd || record.estimatedAmountVnd || 0) || clampQty(overrides.estimatedAmount ?? record.estimatedAmount),
    budgetRemark: overrides.budgetRemark || record.budgetRemark || "",
    vendor: record.vendor,
    quoteDate: record.quoteDate || "",
    quoteExpiry: record.quoteExpiry,
    p10: clampQty(record.p10),
    p11: clampQty(record.p11),
    evt: clampQty(record.evt),
    dvt: clampQty(record.dvt),
    pvt: clampQty(record.pvt),
    mp: clampQty(record.mp),
    demandUnit: demandUnitFor({ demandUnit: overrides.demandUnit || record.demandUnit || record.department || DEMAND_UNIT_FALLBACK }),
    stationBreakdown: overrides.stationBreakdown || record.stationBreakdown || (!overrides.status || overrides.status === "Draft"
      ? stationBreakdownFromRecord({ ...record, ...overrides, project })
      : undefined),
    status: "Draft",
    selected: true,
    managerReason: "",
    procurementStatus: "",
    quoteStatus: quoteStatus(record),
    updatedPrice: "",
    assignedTo: "",
    quotationPdf: "",
    procurementRemark: "",
    quoteException: false,
    omStatus: "",
    omSelected: false,
    externalSystemStatus: "Pending",
    externalSystemRef: "",
    requesterReason: record.useCase || "",
    ...overrides,
    requestAction: requestIntent.requestAction,
    action: requestIntent.requestAction,
    requestActionOtherText: requestIntent.requestActionOtherText,
  });
  return syncRowPhaseQtyFromStationBreakdown(normalizeRequestDemandDepartment(draft, demandDepartment));
}
// @end-legacy-unit 925

export function replaceRequestFromRecordBinding(value) { requestFromRecord = value; return value; }
