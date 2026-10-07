// data/demo-seeds: authoritative source; see docs/module-map.md.
import {
  BUYER_RECEIVED,
  OM_EXPORTED_CFA,
  PAS_NOT_REQUIRED
} from "../admin/state.js";
import {
  legacyPriceToUsd
} from "../cost/currency.js";
import {
  managerQuantityFlattenRows
} from "../cost/quantity-filters.js";
import {
  purchaseRecords
} from "./state.js";
import {
  syncRowPhaseQtyFromStationBreakdown
} from "../demand/quantity.js";
import {
  requestFromRecord
} from "../demand/records.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  withRefreshedIdentity
} from "../handoff/queue.js";
import {
  advanceHandoffHistorySequenceBinding,
  handoffHistory,
  handoffHistorySequence,
  replaceHandoffHistoryBinding
} from "../handoff/state.js";
import {
  handoffRoute,
  handoffTarget,
  handoffWarnings
} from "../handoff/status.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  globalItemIdForKey,
  globalItemKey
} from "../materials/identity.js";
import {
  isOmBuyScope
} from "../om/ownership.js";
import {
  baseQuoteStatus
} from "../om/quote-validity.js";
import {
  advanceOmHistorySequenceBinding,
  omHistory,
  omHistorySequence,
  replaceOmHistoryBinding
} from "../om/state.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER
} from "../projects/config.js";
import {
  normalize
} from "../shared/format.js";
import {
  todayDateString
} from "../sourcing/rfq.js";
import {
  COST_MANAGER_AUTH_APPROVED,
  COST_MANAGER_AUTH_PENDING,
  DEPT_DRI_SUBMISSION_APPROVED,
  DEPT_DRI_SUBMISSION_PENDING,
  HANDOFF_SENT_TO_OM,
  HANDOFF_WAITING_PAS,
  OM_COLLECTION_COLLECTING,
  OM_FINAL_SPEC_READY,
  OM_FINAL_SPEC_REQUIRED,
  OM_RECEIVED,
  OM_SCOPE_STANDARD,
  OM_UPDATED,
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM,
  PAS_APPROVED,
  PAS_WAITING,
  PRICE_ESCALATION_PENDING_PROJECT_DRI
} from "../workflow/status-constants.js";

// @legacy-unit 927 9572
export function seedOmHistory(row, action, note = "") {
  replaceOmHistoryBinding([{
    id: `OMH-${String(advanceOmHistorySequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    action,
    actor: "System",
    note,
    timestamp: new Date().toISOString(),
  }, ...omHistory]);
}
// @end-legacy-unit 927

// @legacy-unit 928 9585
export function seedCoordinatorComputerData() {
  if (requests.some((row) => row.id === "REQ-P26-COMPUTER-001")) return;
  const computerRecord = purchaseRecords.find((record) => record.id === "PO-P26-COMP-001") || purchaseRecords.find((record) => normalize(record.name).includes("laptop"));
  if (!computerRecord) return;
  let computerRequest = requestFromRecord(computerRecord, {
    id: "REQ-P26-COMPUTER-001",
    project: "P26",
    status: "Approved",
    selected: false,
    handoffSelected: false,
	    rfqSelected: true,
	    rfqBuyer: "IT Sourcing",
	    rfqStatus: "Draft",
	    procurementStatus: HANDOFF_WAITING_PAS,
	    pasStatus: PAS_WAITING,
	    pasRequired: true,
	    omStatus: "",
	    omScopeStatus: OM_SCOPE_STANDARD,
	    omScopeReason: "Matched standard OM demand bucket; final model is not required from Requester.",
	    omCollectionStatus: "",
	    finalSpecStatus: OM_FINAL_SPEC_READY,
	    managerReason: "Approved for P26 phase computer setup.",
    requesterReason: "Computer required for P26 NPI line engineering and OM validation.",
	    procurementRemark: "Computer item test flow. PAS required before OM demand collection.",
    decidedAt: "2026-05-13T08:30:00.000Z",
    submittedAt: "2026-05-13T08:00:00.000Z",
    p10: 0,
    p11: 3,
    evt: 0,
    dvt: 0,
    pvt: 0,
    mp: 0,
    demoCoordinatorSeed: true,
  });
  computerRequest = withRefreshedIdentity(computerRequest);
  replaceRequestsBinding([computerRequest, ...requests]);
  replaceHandoffHistoryBinding([{
    id: `HH-${String(advanceHandoffHistorySequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: computerRequest.id,
    project: computerRequest.project,
    item: computerRequest.name,
    action: "Seeded approved computer demand",
    route: handoffRoute(computerRequest),
    exportTarget: handoffTarget(computerRequest),
    actor: "System",
	    note: "P26 computer flow seeded as PAS-required OM Buy scope demand.",
	    timestamp: new Date().toISOString(),
	  }, ...handoffHistory]);
}
// @end-legacy-unit 928

// @legacy-unit 929 9635
export function seedOmDemoData() {
  if (requests.some((row) => row.demoOmSeed)) return;
  const validRecord = purchaseRecords.find((record) => baseQuoteStatus(record) === "Valid") || purchaseRecords[1];
  const expiredRecord = purchaseRecords.find((record) => baseQuoteStatus(record) === "Expired") || purchaseRecords[0];
  const expiringSoonDate = todayDateString(new Date(Date.now() + 8 * 86400000));
  const newMaterialRecord = {
    id: "MASTER-DEMO-001",
    project: "P26",
    partNo: "NEW-P26-OM-DEMO",
    name: "Network Switch",
    spec: "24-port managed switch, OM to confirm final model",
    process: "IT Setup",
    station: "Network",
    department: "",
    unitPrice: 0,
    vendor: "TBD",
    quoteDate: "",
    quoteExpiry: "",
    quoteStatus: "New Material",
    source: "new-item-master",
    p10: 0,
    p11: 2,
    evt: 1,
    dvt: 0,
    pvt: 0,
    mp: 0,
  };
  newMaterialRecord.globalItemKey = globalItemKey(newMaterialRecord);
  newMaterialRecord.globalItemId = globalItemIdForKey(newMaterialRecord.globalItemKey);

  const demoRows = [
    requestFromRecord(validRecord, {
      id: "REQ-OM-001",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(validRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(validRecord),
      pasProjectCode: isOmBuyScope(validRecord) ? "L10-NPI-P26-MVA-260510IT" : "",
      pasReviewDate: "2026-05-10",
      omStatus: OM_RECEIVED,
      externalSystemStatus: OM_UPDATED,
      externalSystemRef: "ERP-DEMO-9001",
      quotationPdf: "quote_keyboard_valid.jpg",
      quotationExcel: "quote_keyboard_valid.xlsx",
      procurementRemark: "Reuse valid quote for approved demand.",
      decidedAt: "2026-05-10T09:00:00.000Z",
      sentToOmAt: "2026-05-10T10:00:00.000Z",
      excelExportedAt: "2026-05-10T11:00:00.000Z",
      quoteDate: "2026-05-10",
      quoteValidUntil: expiringSoonDate,
      quoteExpiry: expiringSoonDate,
      updatedPrice: validRecord.unitPrice || 95,
      omStage: "finalExport",
      userAQuoteDecisionStatus: OM_USER_CONFIRMED,
      userAQuoteDecisionAt: "2026-05-10T10:40:00.000Z",
      userAQuoteDecisionBy: "Requester",
      finalExportTarget: "CFA",
      finalExportStatus: OM_EXPORTED_CFA,
      finalExportedAt: "2026-05-10T11:30:00.000Z",
      buyerStatus: BUYER_RECEIVED,
      buyerReceivedAt: "2026-05-10T11:30:00.000Z",
      demoOmSeed: true,
    }),
    requestFromRecord(expiredRecord, {
      id: "REQ-OM-002",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(expiredRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(expiredRecord),
      pasProjectCode: isOmBuyScope(expiredRecord) ? "L10-NPI-OR5-MVA-260510IT" : "",
      pasReviewDate: "2026-05-10",
      omStatus: OM_RECEIVED,
      externalSystemStatus: "Pending",
      externalSystemRef: "ERP-DEMO-PENDING",
      quotationPdf: "quote_expired_refresh.jpg",
      quotationExcel: "quote_expired_refresh.xlsx",
      vendor: expiredRecord.vendor || "Refresh Vendor",
      vendorPartNo: expiredRecord.vendorPartNo || "EPR2601310006",
      quoteDate: "2026-05-12",
      quoteValidUntil: "2026-05-25",
      quoteExpiry: "2026-05-25",
      updatedPrice: expiredRecord.unitPrice || 120,
      pasDemandNo: "AIDB260512-OM002",
      pasMaterialNo: "PAS-MAT-OM002",
      procurementRemark: "Reference quote returned from PAS and is waiting for Requester confirmation.",
      decidedAt: "2026-05-10T09:10:00.000Z",
      sentToOmAt: "2026-05-10T10:10:00.000Z",
      pasResultReceivedAt: "2026-05-12T09:30:00.000Z",
      quoteReadyAt: "2026-05-12T10:00:00.000Z",
      omStage: "userConfirm",
      userAQuoteDecisionStatus: OM_WAITING_USER_CONFIRM,
      demoOmSeed: true,
    }),
    requestFromRecord(validRecord, {
      id: "REQ-OM-004",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(validRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(validRecord),
      pasProjectCode: isOmBuyScope(validRecord) ? "L10-NPI-P26-MVA-260512IT" : "",
      pasReviewDate: "2026-05-12",
      omStatus: OM_RECEIVED,
      externalSystemStatus: "Pending",
      externalSystemRef: "ERP-DEMO-QUOTE-004",
      quotationPdf: "quote_pas_result_ready.jpg",
      quotationExcel: "quote_pas_result_ready.xlsx",
      vendor: validRecord.vendor || "Keyboard Vendor",
      vendorPartNo: validRecord.vendorPartNo || "EPR2605120004",
      quoteDate: "2026-05-12",
      quoteValidUntil: "2026-06-30",
      quoteExpiry: "2026-06-30",
      updatedPrice: validRecord.unitPrice || 95,
      pasDemandNo: "AIDB260512-OM004",
      pasMaterialNo: "PAS-MAT-OM004",
      procurementRemark: "PAS quote is ready and within the 7-day expiry warning window.",
      decidedAt: "2026-05-12T09:30:00.000Z",
      sentToOmAt: "2026-05-12T10:00:00.000Z",
      pasResultReceivedAt: "2026-05-12T10:30:00.000Z",
      omStage: "pasResult",
      demoOmSeed: true,
    }),
    requestFromRecord(validRecord, {
      id: "REQ-OM-005",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: isOmBuyScope(validRecord) ? PAS_APPROVED : PAS_NOT_REQUIRED,
      pasRequired: isOmBuyScope(validRecord),
      pasProjectCode: isOmBuyScope(validRecord) ? "L10-NPI-P26-MVA-260512IT" : "",
      pasReviewDate: "2026-05-12",
      omStatus: OM_USER_CONFIRMED,
      externalSystemStatus: "Pending",
      externalSystemRef: "ERP-DEMO-EXPORT-005",
      quotationPdf: "quote_export_ready.jpg",
      quotationExcel: "quote_export_ready.xlsx",
      vendor: validRecord.vendor || "Export Ready Vendor",
      vendorPartNo: validRecord.vendorPartNo || "EPR2605120005",
      quoteDate: "2026-05-12",
      quoteValidUntil: "2026-06-30",
      quoteExpiry: "2026-06-30",
      updatedPrice: validRecord.unitPrice || 95,
      pasDemandNo: "AIDB260512-OM005",
      pasMaterialNo: "PAS-MAT-OM005",
      procurementRemark: "Requester confirmed this quote. Use this row to monitor handoff readiness.",
      decidedAt: "2026-05-12T09:45:00.000Z",
      sentToOmAt: "2026-05-12T10:15:00.000Z",
      pasResultReceivedAt: "2026-05-12T10:45:00.000Z",
      quoteReadyAt: "2026-05-12T11:00:00.000Z",
      omStage: "finalExport",
      userAQuoteDecisionStatus: OM_USER_CONFIRMED,
      userAQuoteDecisionAt: "2026-05-12T11:20:00.000Z",
      userAQuoteDecisionBy: "Requester",
      finalExportTarget: "",
      finalExportStatus: "",
      finalExportedAt: "",
      buyerStatus: "",
      buyerReceivedAt: "",
      demoOmSeed: true,
    }),
    requestFromRecord(newMaterialRecord, {
      id: "REQ-OM-003",
      project: "P26",
      status: "Approved",
      procurementStatus: HANDOFF_SENT_TO_OM,
      pasStatus: PAS_APPROVED,
      pasRequired: true,
      pasProjectCode: "L10-NPI-P26-MVA-260510IT",
      pasReviewDate: "2026-05-10",
      omStatus: OM_RECEIVED,
      externalSystemStatus: "Pending",
      externalSystemRef: "",
	      requesterReason: "Network switch required for P26 line opening.",
	      procurementRemark: "OM scope; final spec/model required before quote.",
	      omCollectionStatus: OM_COLLECTION_COLLECTING,
	      finalSpecStatus: OM_FINAL_SPEC_REQUIRED,
      omStage: "pasRequest",
      decidedAt: "2026-05-10T09:20:00.000Z",
      sentToOmAt: "2026-05-10T10:20:00.000Z",
      demoOmSeed: true,
    }),
  ];

  replaceRequestsBinding([...demoRows, ...requests]);
  seedOmHistory(demoRows[0], "Exported Excel", "Demo row exported to OM Purchasing Excel package.");
  seedOmHistory(demoRows[0], "Uploaded quote screenshot", demoRows[0].quotationPdf);
  seedOmHistory(demoRows[0], "Uploaded quote Excel", demoRows[0].quotationExcel);
  seedOmHistory(demoRows[1], "Updated quote price", "Awaiting refreshed quote from OM Purchasing.");
  seedOmHistory(demoRows[1], "Uploaded quote Excel", demoRows[1].quotationExcel);
  seedOmHistory(demoRows[2], "PAS result uploaded", "Quote file, vendor, date, and price are ready to send to Requester confirmation.");
  seedOmHistory(demoRows[2], "Uploaded quote Excel", demoRows[2].quotationExcel);
  seedOmHistory(demoRows[3], "Requester confirmed need", "Demo row is ready for handoff tracking.");
  seedOmHistory(demoRows[3], "Uploaded quote Excel", demoRows[3].quotationExcel);
  demoRows.forEach((row) => seedOmHistory(row, "Received handoff", `Route: ${handoffRoute(row)} / ${handoffWarnings(row).join(" / ") || "No warnings"}`));
}
// @end-legacy-unit 929

// @legacy-unit 930 9833
export function seedManagerQuantityMatrixDemoData() {
  if (requests.some((row) => row.demoQuantityMatrixSeed)) return;
  const existingEntries = managerQuantityFlattenRows();
  const existingStations = new Set(existingEntries.map((entry) => entry.station).filter(Boolean));
  if (existingEntries.length >= 180 && STATION_MASTER.every((station) => existingStations.has(station))) return;

  const usableRecords = purchaseRecords
    .filter((record) => record?.name && userVisibleItemDetail(record))
    .filter((record, index, list) => list.findIndex((item) => normalize(`${item.name} ${userVisibleItemDetail(item)}`) === normalize(`${record.name} ${userVisibleItemDetail(record)}`)) === index)
    .slice(0, 50);
  const fallbackRecords = [
    { id: "MATRIX-SRC-001", project: "P26", name: "Optical network switch", spec: "24-port managed network switch for line equipment connection", process: "FATP", station: "CG", unitPrice: 680 },
    { id: "MATRIX-SRC-002", project: "P26", name: "Industrial PC", spec: "Industrial computer for equipment control and data collection", process: "FATP", station: "FATP", unitPrice: 1450 },
    { id: "MATRIX-SRC-003", project: "P26", name: "Barcode Scanner", spec: "USB barcode scanner for material traceability", process: "FATP", station: "Test", unitPrice: 220 },
    { id: "MATRIX-SRC-004", project: "P26", name: "ESD Wrist Strap", spec: "ESD wrist strap set for operator workstation", process: "FATP", station: "Repair", unitPrice: 18 },
    { id: "MATRIX-SRC-005", project: "P26", name: "Tool Cart", spec: "Mobile tool cart for line setup and maintenance", process: "FATP", station: "WH", unitPrice: 320 },
    { id: "MATRIX-SRC-006", project: "P26", name: "Torque Screwdriver", spec: "Electric torque screwdriver with calibrated controller", process: "FATP", station: "BG", unitPrice: 160 },
    { id: "MATRIX-SRC-007", project: "P26", name: "Label Printer", spec: "Thermal label printer for packaging station", process: "FATP", station: "ENG Pack", unitPrice: 260 },
    { id: "MATRIX-SRC-008", project: "P26", name: "Vision Light Bar", spec: "LED light bar for inspection camera workstation", process: "FATP", station: "Test", unitPrice: 95 },
    { id: "MATRIX-SRC-009", project: "P26", name: "Fixture Base Plate", spec: "Aluminum fixture base plate with locating pins", process: "FATP", station: "Hybrid", unitPrice: 410 },
    { id: "MATRIX-SRC-010", project: "P26", name: "Air Blow Gun", spec: "ESD safe air blow gun for cleaning process", process: "FATP", station: "Auto", unitPrice: 34 },
  ];
  const baseRecords = usableRecords.length ? usableRecords : fallbackRecords;
  const targetCount = Math.min(Math.max(baseRecords.length, 38), 50);
  const sourceRecords = Array.from({ length: targetCount }, (_, index) => {
    const source = baseRecords[index % baseRecords.length];
    if (index < baseRecords.length) return source;
    const copyIndex = Math.floor(index / baseRecords.length) + 1;
    return {
      ...source,
      id: `${source.id || "MATRIX-SRC"}-COPY-${copyIndex}`,
      name: `${source.name} Line ${copyIndex}`,
      spec: `${userVisibleItemDetail(source) || itemDetail(source) || source.spec || "Station demand item"} / additional line set ${copyIndex}`,
    };
  });
  const demandUnits = ["ENG1", "ENG2", "ENG3", "QA G-PQC", "GG-WH", "MFG", "TE", "PQE"];
  const statuses = ["Submitted", "Approved", "In Progress"];
  const projectCodes = ["P26", "P26", "P26", "OR5", "P88"];
  const demoRows = sourceRecords.map((record, index) => {
    const project = record.project || projectCodes[index % projectCodes.length] || "P26";
    const status = statuses[index % statuses.length];
    const mfgStationBreakdown = STATION_MASTER.flatMap((station, stationIndex) => {
      const primaryPhase = STAGES[(index + stationIndex) % STAGES.length];
      const secondaryPhase = STAGES[(index + stationIndex + 2) % STAGES.length];
      const primaryQty = ((index + 2) * (stationIndex + 3)) % 7 + 1;
      const secondaryQty = (stationIndex + index) % 3 === 0 ? ((stationIndex + 2) % 4) + 1 : 0;
      const rows = [{
        id: `MQD-${String(index + 1).padStart(3, "0")}-${String(stationIndex + 1).padStart(2, "0")}-A`,
        phase: primaryPhase,
        station,
        demandUnit: demandUnits[(index + stationIndex) % demandUnits.length],
        qty: primaryQty,
        remark: `Demo demand for ${station} at ${STAGE_LABELS[primaryPhase]}`,
      }];
      if (secondaryQty > 0) {
        rows.push({
          id: `MQD-${String(index + 1).padStart(3, "0")}-${String(stationIndex + 1).padStart(2, "0")}-B`,
          phase: secondaryPhase,
          station,
          demandUnit: demandUnits[(index + stationIndex + 3) % demandUnits.length],
          qty: secondaryQty,
          remark: `Cross-phase demo demand for ${station}`,
        });
      }
      return rows;
    });
    const nonMfgUnits = ["FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
    const nonMfgBreakdown = nonMfgUnits
      .filter((_, unitIndex) => (index + unitIndex) % 3 === 0)
      .slice(0, 4)
      .map((unit, unitIndex) => {
        const phase = STAGES[(index + unitIndex + 1) % STAGES.length];
        return {
          id: `MQD-${String(index + 1).padStart(3, "0")}-NM-${String(unitIndex + 1).padStart(2, "0")}`,
          demandType: DEMAND_TYPE_NON_MFG,
          phase,
          station: "",
          demandUnit: unit,
          qty: ((index + 1) * (unitIndex + 2)) % 9 + 2,
          remark: `Demo Non-MFG demand for ${unit} at ${STAGE_LABELS[phase]}`,
        };
      });
    const stationBreakdown = [...mfgStationBreakdown, ...nonMfgBreakdown];
    const submittedAt = `2026-05-${String(10 + (index % 12)).padStart(2, "0")}T0${8 + (index % 2)}:${String((index * 7) % 60).padStart(2, "0")}:00.000Z`;
    const decidedAt = status === "Approved"
      ? `2026-05-${String(11 + (index % 12)).padStart(2, "0")}T10:${String((index * 5) % 60).padStart(2, "0")}:00.000Z`
      : "";
    const request = requestFromRecord(record, {
      id: `REQ-MATRIX-${String(index + 1).padStart(3, "0")}`,
      project,
      status,
      selected: false,
      managerReason: status === "Approved" ? "Demo approved quantity for cost review." : "",
      requesterReason: "Demo station breakdown for Quantity Matrix filter validation.",
      submittedAt,
      decidedAt,
      submittedBy: "Requester",
      requester: "Requester",
      stationBreakdown,
      procurementStatus: status === "Submitted" ? "" : HANDOFF_SENT_TO_OM,
      pasRequired: true,
      demoQuantityMatrixSeed: true,
    });
    return syncRowPhaseQtyFromStationBreakdown(request);
  });
  replaceRequestsBinding([...demoRows, ...requests]);
}
// @end-legacy-unit 930

// @legacy-unit 931 9941
export function seedProjectStatusCostDashboardDemoData() {
  if (requests.some((row) => row.demoProjectStatusCostSeed)) return;
  const fallbackRecords = [
    { id: "PS-COST-SRC-001", name: "Industrial PC", spec: "IPC i5 / 16GB RAM / 512GB SSD for station control", process: "FATP", station: "CG", unitPrice: 1450 },
    { id: "PS-COST-SRC-002", name: "Barcode Scanner", spec: "USB scanner for material traceability", process: "FATP", station: "Test", unitPrice: 220 },
    { id: "PS-COST-SRC-003", name: "Torque Screwdriver", spec: "Calibrated electric screwdriver set", process: "Assembly", station: "BG", unitPrice: 160 },
    { id: "PS-COST-SRC-004", name: "ESD Workbench", spec: "1800mm antistatic workbench with power rail", process: "Line Setup", station: "FATP", unitPrice: 520 },
    { id: "PS-COST-SRC-005", name: "Label Printer", spec: "Thermal label printer with LAN interface", process: "Packing", station: "ENG Pack", unitPrice: 260 },
    { id: "PS-COST-SRC-006", name: "Fixture Base Plate", spec: "Aluminum base plate with locating pins", process: "Fixture", station: "Hybrid", unitPrice: 410 },
    { id: "PS-COST-SRC-007", name: "Vision Light Bar", spec: "LED bar light for AOI fixture", process: "Inspection", station: "Auto", unitPrice: 95 },
    { id: "PS-COST-SRC-008", name: "Tool Cart", spec: "Mobile cart for setup tools and spare kits", process: "Maintenance", station: "WH", unitPrice: 320 },
    { id: "PS-COST-SRC-009", name: "Network Switch", spec: "24-port managed switch for line network", process: "IT", station: "Test", unitPrice: 680 },
    { id: "PS-COST-SRC-010", name: "Air Blow Gun", spec: "ESD-safe air gun and regulator set", process: "Clean", station: "Repair", unitPrice: 34 },
  ];
  const sourceRecords = purchaseRecords
    .filter((record) => record?.name && userVisibleItemDetail(record))
    .slice(0, 20);
  const baseRecords = sourceRecords.length >= 10 ? sourceRecords : fallbackRecords;
  const scopes = [
    { project: "P26", requestLine: "Line 2", prefix: "P26-L2" },
    { project: "OR5", requestLine: "Line 1", prefix: "OR5-L1" },
  ];
  const nonMfgUnits = ["FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
  const statusPatches = [
    (index) => ({
      status: "Submitted",
      submittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T08:10:00.000Z`,
      deptDriReviewStatus: DEPT_DRI_SUBMISSION_PENDING,
      deptDriReviewType: "Submission",
      deptDriReviewSubmittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T08:20:00.000Z`,
      nextStep: "Dept DRI submission review",
      procurementStatus: "",
    }),
    (index) => ({
      status: "Approved",
      submittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T08:20:00.000Z`,
      deptDriSubmissionApprovedAt: `2026-06-${String(2 + (index % 9)).padStart(2, "0")}T09:20:00.000Z`,
      deptDriSubmissionApprovedBy: "Dept DRI",
      deptDriReviewStatus: DEPT_DRI_SUBMISSION_APPROVED,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_PENDING,
      costManagerAuthorizationSubmittedAt: `2026-06-${String(2 + (index % 9)).padStart(2, "0")}T09:30:00.000Z`,
    }),
    (index) => ({
      status: "Approved",
      submittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T08:30:00.000Z`,
      priceDecisionStatus: "Price Escalation Required",
      priceApprovalStatus: PRICE_ESCALATION_PENDING_PROJECT_DRI,
      driApprovedAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T10:00:00.000Z`,
      driApprovedBy: "Dept DRI",
      updatedPrice: 0,
      quoteUnitPrice: 0,
      estimatedUnitPrice: 180 + (index % 7) * 35,
      estimatedUnitPriceUsd: 180 + (index % 7) * 35,
    }),
    (index) => ({
      status: "Approved",
      submittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T08:40:00.000Z`,
      deptDriSubmissionApprovedAt: `2026-06-${String(2 + (index % 9)).padStart(2, "0")}T09:40:00.000Z`,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_APPROVED,
      costManagerAuthorizedAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T11:00:00.000Z`,
      sentToOmAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T11:20:00.000Z`,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      omStage: "pasRequest",
      pasRequired: true,
    }),
    (index) => ({
      status: "Approved",
      submittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T08:50:00.000Z`,
      deptDriSubmissionApprovedAt: `2026-06-${String(2 + (index % 9)).padStart(2, "0")}T09:50:00.000Z`,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_APPROVED,
      costManagerAuthorizedAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T11:10:00.000Z`,
      sentToOmAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T11:30:00.000Z`,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      omStage: "pasResult",
      pasDemandNo: `AIDB2606${String(index + 10).padStart(2, "0")}`,
      pasDemandNoRecordedAt: `2026-06-${String(4 + (index % 7)).padStart(2, "0")}T09:00:00.000Z`,
      pasRequired: true,
    }),
    (index) => ({
      status: "Approved",
      submittedAt: `2026-06-${String(1 + (index % 9)).padStart(2, "0")}T09:00:00.000Z`,
      deptDriSubmissionApprovedAt: `2026-06-${String(2 + (index % 9)).padStart(2, "0")}T10:00:00.000Z`,
      costManagerAuthorizationStatus: COST_MANAGER_AUTH_APPROVED,
      costManagerAuthorizedAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T12:00:00.000Z`,
      sentToOmAt: `2026-06-${String(3 + (index % 8)).padStart(2, "0")}T12:20:00.000Z`,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_USER_CONFIRMED,
      omStage: "finalExport",
      pasDemandNo: `AIDB2606${String(index + 40).padStart(2, "0")}`,
      pasMaterialNo: `PAS-PS-${String(index + 1).padStart(3, "0")}`,
      updatedPrice: 240 + (index % 9) * 28,
      quoteDate: "2026-06-08",
      quoteValidUntil: "2026-07-20",
      quotationPdf: "project_status_quote.png",
      quotationExcel: "project_status_quote.xlsx",
      quoteReadyAt: `2026-06-${String(4 + (index % 7)).padStart(2, "0")}T13:00:00.000Z`,
      userAQuoteDecisionStatus: OM_USER_CONFIRMED,
      userAQuoteDecisionAt: `2026-06-${String(5 + (index % 7)).padStart(2, "0")}T14:00:00.000Z`,
      finalExportStatus: index % 2 ? "" : OM_EXPORTED_CFA,
      finalExportedAt: index % 2 ? "" : `2026-06-${String(6 + (index % 6)).padStart(2, "0")}T15:00:00.000Z`,
      buyerStatus: index % 2 ? "" : BUYER_RECEIVED,
      buyerReceivedAt: index % 2 ? "" : `2026-06-${String(6 + (index % 6)).padStart(2, "0")}T15:30:00.000Z`,
    }),
  ];

  const demoRows = scopes.flatMap((scope) => Array.from({ length: 30 }, (_, index) => {
    const record = baseRecords[index % baseRecords.length];
    const phaseA = STAGES[index % STAGES.length];
    const phaseB = STAGES[(index + 2) % STAGES.length];
    const phaseC = STAGES[(index + 4) % STAGES.length];
    const stationA = STATION_MASTER[index % STATION_MASTER.length];
    const stationB = STATION_MASTER[(index + 3) % STATION_MASTER.length];
    const unitA = nonMfgUnits[(index + 1) % nonMfgUnits.length];
    const unitB = nonMfgUnits[(index + 5) % nonMfgUnits.length];
    const itemNo = String(index + 1).padStart(2, "0");
    const stationBreakdown = [
      {
        id: `PS-${scope.prefix}-${itemNo}-MFG-A`,
        demandType: DEMAND_TYPE_MFG,
        phase: phaseA,
        station: stationA,
        qty: (index % 5) + 2,
        requestLine: scope.requestLine,
        remark: `${scope.project} ${scope.requestLine} ${STAGE_LABELS[phaseA]} ${stationA} demand`,
      },
      {
        id: `PS-${scope.prefix}-${itemNo}-MFG-B`,
        demandType: DEMAND_TYPE_MFG,
        phase: phaseB,
        station: stationB,
        qty: (index % 4) + 1,
        requestLine: scope.requestLine,
        remark: `${scope.project} ${scope.requestLine} ${STAGE_LABELS[phaseB]} ${stationB} demand`,
      },
      {
        id: `PS-${scope.prefix}-${itemNo}-NM-A`,
        demandType: DEMAND_TYPE_NON_MFG,
        phase: phaseB,
        station: "",
        demandUnit: unitA,
        qty: (index % 6) + 1,
        requestLine: scope.requestLine,
        remark: `${unitA} line-opening support`,
      },
      {
        id: `PS-${scope.prefix}-${itemNo}-NM-B`,
        demandType: DEMAND_TYPE_NON_MFG,
        phase: phaseC,
        station: "",
        demandUnit: unitB,
        qty: (index % 3) + 2,
        requestLine: scope.requestLine,
        remark: `${unitB} line-opening support`,
      },
    ];
    const statusPatch = statusPatches[index % statusPatches.length](index);
    const unitPrice = legacyPriceToUsd(record, "unitPrice") || record.unitPrice || 80 + (index % 10) * 42;
    const request = requestFromRecord(record, {
      id: `REQ-PS-${scope.prefix}-${itemNo}`,
      project: scope.project,
      requestLine: scope.requestLine,
      line: scope.requestLine,
      name: `${record.name || "Line opening item"} ${itemNo}`,
      spec: `${userVisibleItemDetail(record) || itemDetail(record) || record.spec || "Project status demo spec"} / ${scope.requestLine}`,
      unitPrice,
      unitPriceUsd: unitPrice,
      estimatedUnitPrice: unitPrice,
      estimatedUnitPriceUsd: unitPrice,
      selected: false,
      handoffSelected: false,
      requester: index % 2 ? "NPI Requester" : "Line Owner",
      submittedBy: index % 2 ? "NPI Requester" : "Line Owner",
      requesterReason: `${scope.project} ${scope.requestLine} line-opening cost dashboard demo row.`,
      managerReason: "Demand Progress Tracking cost dashboard demo baseline.",
      stationBreakdown,
      demoProjectStatusCostSeed: true,
      ...statusPatch,
    });
    return syncRowPhaseQtyFromStationBreakdown(request);
  }));
  replaceRequestsBinding([...demoRows, ...requests]);
}
// @end-legacy-unit 931
