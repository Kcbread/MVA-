// data/purchase-records: authoritative source; see docs/module-map.md.
import {
  normalizeRequestAction
} from "../demand/intent.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  createFactoryMaterialNo,
  globalItemIdForKey,
  globalItemKey
} from "../materials/identity.js";
import {
  omResponsibilityPatch
} from "../om/ownership.js";
import {
  REQUEST_ACTION_OTHER,
  STAGES,
  projectTypeFor,
  seedProjectCodeFromRow,
  seedYearProjectFromRow
} from "../projects/config.js";

// @legacy-unit 350 1531
export function makePurchaseRecords() {
  return realMvaPurchaseRecords();
}
// @end-legacy-unit 350

// @legacy-unit 355 1556
export function realMvaPurchaseRecords() {
  const rows = Array.isArray(globalThis.REAL_MVA_PURCHASE_RECORDS) ? globalThis.REAL_MVA_PURCHASE_RECORDS : [];
  return rows.map((item, index) => {
    const sourceSheet = item.sourceSheet || "Excel Source";
    const projectCode = seedProjectCodeFromRow(item);
    const yearProject = seedYearProjectFromRow(item) || projectCode || "P26";
    const requestAction = normalizeRequestAction(item.requestAction || item.action);
    const stageQtys = STAGES.reduce((values, stage) => {
      values[stage] = clampQty(item[stage]);
      return values;
    }, {});
    const record = {
      id: item.id || `REAL-MVA-${String(index + 1).padStart(4, "0")}`,
      poNo: item.poNo || item.purRequestNo || `REAL-MVA-${String(index + 1).padStart(4, "0")}`,
      project: yearProject,
      yearProject,
      projectCode,
      projectType: item.projectType || projectTypeFor(yearProject),
      sourceProject: item.sourceProject || item.yearProject || item.project || "",
      sourceSheet,
      partNo: item.vendorPartNo || item.purRequestNo || "",
      materialNo: "",
      materialStatus: "Factory Material Tracking",
      factoryMaterialNo: item.factoryMaterialNo || (item.poNo || item.poStatus ? createFactoryMaterialNo(item) : ""),
      pasMaterialNo: item.pasMaterialNo || "",
      materialIdentityKey: "",
      vendorPartNo: item.vendorPartNo || "",
      name: item.name || "Unnamed item",
      level1: item.level1 || "",
      level2: item.level2 || "",
      level3: item.level3 || "",
      spec: item.spec || "",
      detail: item.spec || "",
      process: item.process || "",
      station: item.station || "",
      department: item.department || "",
      requesterName: item.requesterName || "",
      requesterEmployeeId: item.requesterEmployeeId || "",
      email: item.email || "",
      phone: item.phone || "",
      purpose: item.purpose || "",
      requesterReason: item.purpose || "",
      unitPrice: Number(item.unitPrice || 0),
      qty: clampQty(item.qty),
      totalCost: Number(item.totalCost || 0),
      vendor: item.vendor || "",
      quoteDate: item.quoteDate || "",
      quoteExpiry: item.quoteExpiry || "",
      source: "history",
      action: requestAction,
      requestAction,
      requestActionOtherText: requestAction === REQUEST_ACTION_OTHER ? String(item.requestActionOtherText || item.actionOtherText || "").trim() : "",
      budgetStatus: item.budgetStatus || "",
      budgetNo: item.budgetNo || "",
      prStatus: item.prStatus || "",
      prNo: item.prNo || "",
      poStatus: item.poStatus || "",
      buyerPoNo: item.poNo || "",
      qtyDoneBudget: clampQty(item.qtyDoneBudget),
      qtyDonePr: clampQty(item.qtyDonePr),
      qtyDonePo: clampQty(item.qtyDonePo),
      qtyReceived: clampQty(item.qtyReceived || item.qtyRecieved),
      etaPlan: item.etaPlan || item.eta || "",
      dtaActual: item.dtaActual || item.actualEta || "",
      actualEta: item.actualEta || "",
      purRequestNo: item.purRequestNo || "",
      lineOpenDate: item.requiredDeliveryDateDri || "",
      requiredDeliveryDate: item.requiredDeliveryDate || "",
      requestDeadline: item.requestDeadline || "",
      lateStatus: item.lateStatus || "",
      pendingReason: item.pendingReason || item.deliveryPendingReason || item.pendingDeliveryReason || "",
      procurementRemark: item.remark || item.pendingReason || item.lateStatus || "",
      ...stageQtys,
    };
    Object.assign(record, omResponsibilityPatch(record));
    record.globalItemKey = globalItemKey(record);
    record.globalItemId = globalItemIdForKey(record.globalItemKey);
    return record;
  });
}
// @end-legacy-unit 355
