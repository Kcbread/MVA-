// materials/demand-conversion: authoritative source; see docs/module-map.md.
import {
  amountUsdFromVnd
} from "../cost/currency.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  isLegacyMaintenance
} from "./display.js";
import {
  MATERIAL_STATUS_PENDING_PROCUREMENT,
  ensureMaterialMaster,
  factoryMaterialNoFor,
  globalItemIdForKey,
  globalItemKey,
  materialIdentityKey,
  materialMasterRecordFor
} from "./identity.js";
import {
  advanceMasterSequenceBinding,
  masterSequence
} from "./state.js";
import {
  STAGES
} from "../projects/config.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";

// @legacy-unit 926 9488
export function suggestionToRecord(suggestion) {
  const sequence = String(advanceMasterSequenceBinding(1, true)).padStart(3, "0");
  const globalKey = globalItemKey(suggestion);
  const existingMaterial = materialMasterRecordFor(suggestion);
  const materialPatch = isLegacyMaintenance(suggestion)
    ? ensureMaterialMaster(suggestion, {
      createdBy: roleProfiles[currentRole]?.name || "Requester",
      source: "Legacy Material Standardization",
      sourceProject: suggestion.sourceProject || suggestion.project,
      sourceRecordId: suggestion.sourceRecordId || "",
    })
    : existingMaterial
      ? {
        materialId: existingMaterial.materialId,
        materialNo: existingMaterial.materialNo,
        materialIdentityKey: existingMaterial.materialIdentityKey,
        materialStatus: existingMaterial.materialStatus,
      }
    : {
      materialId: "",
      materialNo: "",
      materialIdentityKey: materialIdentityKey(suggestion),
      materialStatus: MATERIAL_STATUS_PENDING_PROCUREMENT,
    };
  const sourceRecord = suggestion.sourceRecordId ? purchaseRecords.find((row) => row.id === suggestion.sourceRecordId) : null;
  const sourceStageValues = suggestion.sourceQtyMode && sourceRecord
    ? STAGES.reduce((values, stage) => ({ ...values, [stage]: clampQty(sourceRecord[stage]) }), {})
    : {};
  return {
    id: `MASTER-${sequence}`,
    poNo: "",
    project: suggestion.project,
    partNo: materialPatch.materialNo || "",
    materialId: materialPatch.materialId,
    materialNo: materialPatch.materialNo,
    factoryMaterialNo: suggestion.factoryMaterialNo || factoryMaterialNoFor(suggestion),
    pasMaterialNo: suggestion.pasMaterialNo || "",
    materialIdentityKey: materialIdentityKey(suggestion),
    materialStatus: materialPatch.materialStatus,
    vendorPartNo: "",
    globalItemKey: globalKey,
    globalItemId: globalItemIdForKey(globalKey),
    name: suggestion.standardNameCn || suggestion.name,
    standardNameCn: suggestion.standardNameCn || suggestion.name,
    standardNameEn: suggestion.standardNameEn || "",
    standardNameVn: suggestion.standardNameVn || "",
    standardNameStatus: suggestion.standardNameStatus || "",
    level1: suggestion.level1 || "",
    level2: suggestion.level2 || "",
    level3: suggestion.level3 || "",
    detail: suggestion.detail || "",
    spec: suggestion.spec,
    structuredSpec: suggestion.structuredSpec || "",
    uom: suggestion.uom || "",
    estimatedUnitPrice: clampQty(suggestion.estimatedUnitPrice),
    estimatedUnitPriceVnd: clampQty(suggestion.estimatedUnitPrice),
    estimatedUnitPriceUsd: amountUsdFromVnd(clampQty(suggestion.estimatedUnitPrice)),
    estimatedAmount: clampQty(suggestion.estimatedAmount),
    estimatedAmountVnd: clampQty(suggestion.estimatedAmount),
    estimatedAmountUsd: amountUsdFromVnd(clampQty(suggestion.estimatedAmount)),
    budgetRemark: suggestion.budgetRemark || "",
    estimateReason: suggestion.estimateReason || suggestion.budgetRemark || "",
    duplicateDifference: suggestion.duplicateDifference || "",
    evidenceReference: suggestion.evidenceReference || "",
    duplicateCandidates: suggestion.duplicateCandidates || [],
    itemMasterRequestStatus: "Pending Material Review",
    source: isLegacyMaintenance(suggestion) ? suggestion.source || "" : "new-item-master",
    process: "TBD",
    station: "TBD",
    department: "",
    unitPrice: 0,
    qty: 0,
    vendor: "TBD",
    quoteDate: "",
    quoteExpiry: "",
    quoteStatus: isLegacyMaintenance(suggestion) ? "Reference Estimate" : "New Material",
    source: "new-item-master",
    sourceSuggestionId: suggestion.id,
    sourceRecordId: suggestion.sourceRecordId || "",
    sourceProject: suggestion.sourceProject || suggestion.project,
    ...sourceStageValues,
  };
}
// @end-legacy-unit 926
