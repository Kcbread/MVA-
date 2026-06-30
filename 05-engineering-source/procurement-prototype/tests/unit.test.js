const test = require("node:test");
const assert = require("node:assert/strict");

const quote = require("../app-modules/quote-validity.js");
const dashboard = require("../app-modules/demand-cost-dashboard.js");
const priceDecision = require("../app-modules/price-decision.js");
const leadTime = require("../app-modules/lead-time.js");
const workflowStatus = require("../app-modules/workflow-status.js");
const workflowStatusTable = require("../app-modules/workflow-status-table.js");
const ftvCode = require("../app-modules/ftv-code.js");
const roleGuards = require("../app-modules/role-guards.js");
const sapPoRawContract = require("../app-modules/sap-po-raw-contract.js");
const sapPoRawImporter = require("../app-modules/sap-po-raw-importer.js");
const materialCoding = require("../app-modules/material-coding.js");
const omBusinessFlow = require("../app-modules/om-business-flow.js");
const purposeDate = require("../app-modules/purpose-date.js");

test("quote validity uses 7-day warning threshold", () => {
  const today = new Date("2026-06-01T00:00:00");
  assert.equal(quote.quoteValidity("", today), "Missing Valid Until");
  assert.equal(quote.quoteValidity("2026-05-31", today), "Expired / Requote Required");
  assert.equal(quote.quoteValidity("2026-06-08", today), "Expiring Soon");
  assert.equal(quote.quoteValidity("2026-06-01", today), "Expiring Soon");
  assert.equal(quote.quoteValidity("2026-06-09", today), "Valid");
});

test("purpose date helper derives required date and given lead time", () => {
  assert.equal(purposeDate.requiredDeliveryDateFollowStageDate("2026-08-20"), "2026-08-06");
  assert.equal(purposeDate.givenLeadTimeDays("2026-07-30", "2026-08-20"), 7);
});

test("purpose location normalization accepts only SMT or FATP", () => {
  assert.equal(purposeDate.normalizePurposeLocation("smt"), "SMT");
  assert.equal(purposeDate.normalizePurposeLocation("FATP"), "FATP");
  assert.equal(purposeDate.normalizePurposeLocation("CG"), "SMT");
});

test("PUR request number suggestion uses dept project qty item and spec", () => {
  const row = {
    department: "IT",
    projectCode: "4CS4",
    project: "P26",
    qty: 12,
    name: "Mini PC",
    spec: "i5 / 16GB RAM",
  };

  assert.equal(purposeDate.suggestPurRequestNo(row), "PUR-IT-4CS4-12-MINI-PC-I5-16GB-RAM");
});

test("OM hard item normalized name and spec match requires PAS Demand ID", () => {
  const hardItem = {
    name: "Mini PC",
    spec: "Industrial IPC, Intel i5, 16GB RAM",
  };
  const requirement = omBusinessFlow.pasDemandRequirement(hardItem);

  assert.equal(requirement.required, true);
  assert.equal(requirement.label, "PAS Demand ID Required");
  assert.match(requirement.reason, /Hard Item/);
});

test("OM non-hard request does not require PAS Demand ID", () => {
  const otherRequest = {
    name: "Office Chair",
    spec: "Ergonomic chair for meeting room",
  };

  assert.equal(omBusinessFlow.pasDemandRequirement(otherRequest).required, false);
  assert.equal(omBusinessFlow.pasDemandRequirement(otherRequest).label, "PAS Demand ID Optional");
});

test("OM PAS Demand requirement is driven by active master data records", () => {
  const pasDemandRequirementMaster = [
    {
      id: "pas-master-docking",
      itemCategory: "Docking Station",
      matchKeywords: ["docking station", "usb c dock"],
      pasDemandRequired: true,
      active: true,
      ownerRole: "OM Purchasing",
      note: "Hard landing hardware accessory.",
    },
    {
      id: "pas-master-chair-inactive",
      itemCategory: "Chair",
      matchKeywords: ["chair"],
      pasDemandRequired: true,
      active: false,
      ownerRole: "OM Purchasing",
      note: "Inactive rule should not block quote flow.",
    },
  ];

  const dockingRequirement = omBusinessFlow.pasDemandRequirement({
    name: "USB-C Dock",
    spec: "Docking Station for engineering laptop",
  }, pasDemandRequirementMaster);
  const inactiveRequirement = omBusinessFlow.pasDemandRequirement({
    name: "Office Chair",
    spec: "Meeting room",
  }, pasDemandRequirementMaster);

  assert.equal(dockingRequirement.required, true);
  assert.equal(dockingRequirement.masterRecordId, "pas-master-docking");
  assert.equal(dockingRequirement.label, "PAS Demand ID Required");
  assert.equal(inactiveRequirement.required, false);
  assert.equal(inactiveRequirement.masterRecordId, "");
});

test("OM Quote DB uses valid-until date as hard stop and Central IT check for reuse", () => {
  const row = {
    name: "Mini PC",
    spec: "Industrial IPC, Intel i5, 16GB RAM",
    qty: 999,
  };
  const validCandidate = {
    id: "Q-VALID",
    normalizedNameSpecKey: omBusinessFlow.normalizedNameSpecKey(row),
    quoteValidUntil: "2026-07-01",
    referenceQty: 100,
  };
  const expiredCandidate = {
    id: "Q-EXPIRED",
    normalizedNameSpecKey: omBusinessFlow.normalizedNameSpecKey(row),
    quoteValidUntil: "2026-05-31",
    referenceQty: 500,
  };
  const today = new Date("2026-06-18T00:00:00Z");

  assert.equal(omBusinessFlow.quoteDbCandidateStatus(expiredCandidate, row, today).status, "Expired");
  assert.equal(omBusinessFlow.quoteDbCandidateStatus(validCandidate, row, today).status, "Valid - Need Central IT Check");
  assert.equal(omBusinessFlow.quoteDbCandidateStatus(validCandidate, {
    ...row,
    quoteDbCandidateId: "Q-VALID",
    centralItCheckedAt: "2026-06-18T08:00:00Z",
  }, today).status, "Reusable");
  assert.equal(omBusinessFlow.quoteDbCandidateStatus(validCandidate, row, today).quantityBlocksReuse, false);
});

test("OM Quote DB candidate can fill My Intake row after Central IT confirmation", () => {
  const row = {
    id: "REQ-QDB-INTAKE",
    name: "Mini PC",
    spec: "Industrial IPC, Intel i5, 16GB RAM",
    qty: 20,
  };
  const today = new Date("2026-06-18T00:00:00Z");
  const candidate = omBusinessFlow.bestQuoteDbCandidate(row, omBusinessFlow.QUOTE_DB_RECORDS, today);

  assert.equal(candidate.id, "QDB-MINI-PC-I5-202606");

  const patched = omBusinessFlow.applyQuoteDbCandidate(row, candidate, "2026-06-18T08:00:00.000Z", "Giang");

  assert.equal(patched.quoteDbCandidateId, "QDB-MINI-PC-I5-202606");
  assert.equal(patched.centralItCheckedAt, "2026-06-18T08:00:00.000Z");
  assert.equal(patched.centralItCheckedBy, "Giang");
  assert.equal(patched.vendor, "Central IT Sourcing");
  assert.equal(patched.updatedPriceUsd, 318);
  assert.equal(patched.unitPriceCurrency, "USD");
  assert.equal(patched.quoteDate, "2026-06-01");
  assert.equal(patched.quoteValidUntil, "2026-08-31");
  assert.equal(patched.quoteExpiry, "2026-08-31");
  assert.equal(patched.pasDemandNo, "PAS-HARD-IPC-2026");
  assert.equal(patched.pasMaterialNo, "PAS-MINI-PC-I5");
});

test("OM Quote DB matches current IPC My Intake records and applies VND quote data", () => {
  const ipcRow = {
    id: "REQ-QDB-IPC",
    name: "IPC 10",
    spec: "DELL Pro Tower QCT1250, Core i3-14100, 8GB DDR5, 512GB SSD, Integrated graphics card, Keyboard and Mouse, 3Yrs Wty / Line 2",
    qty: 14,
  };
  const ipcPlusRow = {
    id: "REQ-QDB-IPC-PLUS",
    name: "IPC+ 28",
    spec: "DELL Pro Tower (QCT1250), Intel Core i5-14500 vPro, Ram 16GB DDR5, SSD 1TB, RJ45/ USB3.0*3 /USB2.0*3 / HDMI / Serial Port / Power supply 360W, Keyboard and Mouse, 3Yrs Wty / Line 2",
    qty: 14,
  };
  const today = new Date("2026-06-18T00:00:00Z");

  const ipcCandidate = omBusinessFlow.bestQuoteDbCandidate(ipcRow, omBusinessFlow.QUOTE_DB_RECORDS, today);
  const ipcPlusCandidate = omBusinessFlow.bestQuoteDbCandidate(ipcPlusRow, omBusinessFlow.QUOTE_DB_RECORDS, today);

  assert.equal(ipcCandidate.id, "QDB-IPC-I3-QCT1250-202606");
  assert.equal(ipcPlusCandidate.id, "QDB-IPC-I5-QCT1250-202606");

  const patched = omBusinessFlow.applyQuoteDbCandidate(ipcPlusRow, ipcPlusCandidate, "2026-06-18T08:00:00.000Z", "Giang");

  assert.equal(patched.vendor, "VVN0000011 CONG TY TNHH CONG NGHE ECOLIV");
  assert.equal(patched.vendorPartNo, "VVN0000011");
  assert.equal(patched.updatedPriceVnd, 14200000);
  assert.equal(patched.updatedPriceUsd, 546.15);
  assert.equal(patched.unitPriceCurrency, "VND");
  assert.equal(patched.quoteValidUntil, "2026-08-31");
  assert.equal(patched.pasDemandNo, "PAS-HARD-IPC-I5-2026");
  assert.equal(patched.pasMaterialNo, "PAS-IPC-I5-QCT1250");
});

test("OM purpose project build shares Budget Code across different PAS IDs and items", () => {
  const rows = [
    { pasDemandNo: "PAS-A", name: "Mini PC", project: "4CS4", stage: "EVT", purposeLocations: ["SMT", "FATP"] },
    { pasDemandNo: "PAS-B", name: "Monitor", project: "4CS4", stage: "EVT", purposeLocations: ["FATP", "SMT"] },
  ];

  assert.equal(omBusinessFlow.purposeProjectBuildKey(rows[0]), omBusinessFlow.purposeProjectBuildKey(rows[1]));
  assert.equal(omBusinessFlow.budgetCodeForRow(rows[0]), omBusinessFlow.budgetCodeForRow(rows[1]));
});

test("OM PAS Excel grouping combines items by PAS Demand ID", () => {
  const groups = omBusinessFlow.groupRowsByPasDemandId([
    { id: 1, pasDemandNo: "PAS-100", name: "Mini PC" },
    { id: 2, pasDemandNo: "PAS-100", name: "Monitor" },
    { id: 3, pasDemandNo: "PAS-200", name: "Barcode Scanner" },
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => group.pasDemandId), ["PAS-100", "PAS-200"]);
  assert.deepEqual(groups[0].rows.map((row) => row.name), ["Mini PC", "Monitor"]);
});

test("OM PAS Excel grouping normalizes PAS Demand No and exposes merge suggestions", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: " PAS-100 ", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "pas-100", name: "Monitor" },
    { id: "REQ-3", pasDemandNo: "PAS-200", name: "Barcode Scanner" },
    { id: "REQ-4", pasDemandNo: "", name: "Keyboard" },
  ];

  assert.equal(omBusinessFlow.normalizePasDemandNo(" PAS-100 "), "PAS-100");
  assert.equal(omBusinessFlow.normalizePasDemandNo("pas-100"), "PAS-100");

  const suggestion = omBusinessFlow.pasDemandGroupSuggestion(rows[0], rows);
  assert.equal(suggestion.hasGroup, true);
  assert.equal(suggestion.pasDemandId, "PAS-100");
  assert.deepEqual(suggestion.rowIds, ["REQ-1", "REQ-2"]);
  assert.equal(suggestion.message, "Same PAS Demand No group: 2 items");

  const noSuggestion = omBusinessFlow.pasDemandGroupSuggestion(rows[2], rows);
  assert.equal(noSuggestion.hasGroup, false);
  assert.equal(noSuggestion.message, "No same-demand group");
});

test("OM PAS Excel export grouping follows OM merge decisions", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Monitor" },
    { id: "REQ-3", pasDemandNo: "PAS-100", pasExcelMergeDecision: "separate", name: "Dock" },
    { id: "REQ-4", pasDemandNo: "PAS-200", name: "Barcode Scanner" },
  ];

  const groups = omBusinessFlow.groupRowsForPasExcelExport(rows);

  assert.deepEqual(groups.map((group) => group.pasDemandId), ["PAS-100", "PAS-100__REQ-3", "PAS-200"]);
  assert.deepEqual(groups[0].rows.map((row) => row.id), ["REQ-1", "REQ-2"]);
  assert.deepEqual(groups[1].rows.map((row) => row.id), ["REQ-3"]);
  assert.equal(groups[0].mergeDecision, "merge");
  assert.equal(groups[1].mergeDecision, "separate");
});

test("OM PAS Excel system attachment metadata is stable for merged groups", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: " pas-100 ", pasExcelMergeDecision: "merge", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Monitor" },
  ];
  const group = omBusinessFlow.groupRowsForPasExcelExport(rows)[0];
  const summary = omBusinessFlow.pasExcelSystemAttachmentSummary(group, "2026-06-29T08:00:00.000Z");

  assert.equal(summary.fileName, "PAS-100-PAS-Tracking.xlsx");
  assert.equal(summary.linkedEntityType, "om_pas_excel_group");
  assert.equal(summary.linkedEntityId, "PAS-100");
  assert.equal(summary.attachmentKind, "om_pas_tracking_system_excel");
  assert.equal(summary.visibilityScope, "om_internal");
  assert.deepEqual(summary.rowIds, ["REQ-1", "REQ-2"]);
  assert.deepEqual(summary.metadata, {
    source: "system_generated_pas_excel",
    pasDemandNo: "PAS-100",
    mergeDecision: "merge",
    rowIds: ["REQ-1", "REQ-2"],
    rowCount: 2,
    createdAt: "2026-06-29T08:00:00.000Z",
  });
});

test("OM PAS Excel system attachment metadata separates row-level override groups", () => {
  const rows = [
    { id: "REQ-1", pasDemandNo: "PAS-100", pasExcelMergeDecision: "merge", name: "Mini PC" },
    { id: "REQ-2", pasDemandNo: "PAS-100", pasExcelMergeDecision: "separate", name: "Dock" },
  ];
  const groups = omBusinessFlow.groupRowsForPasExcelExport(rows);
  const separateSummary = omBusinessFlow.pasExcelSystemAttachmentSummary(groups[1], "2026-06-29T08:00:00.000Z");

  assert.equal(separateSummary.fileName, "PAS-100__REQ-2-PAS-Tracking.xlsx");
  assert.equal(separateSummary.linkedEntityId, "PAS-100__REQ-2");
  assert.deepEqual(separateSummary.rowIds, ["REQ-2"]);
  assert.equal(separateSummary.metadata.mergeDecision, "separate");
});

test("currency display converts canonical VND to USD without changing source amount", () => {
  assert.equal(quote.formatCurrencyFromVnd(2550000, { currency: "USD", usdToVndRate: 25500 }), "$100");
  assert.equal(quote.formatCurrencyFromVnd(2550000, { currency: "VND", usdToVndRate: 25500 }), "2,550,000 VND");
});

test("currency display supports compact readable labels for dense dashboards", () => {
  assert.equal(quote.formatCompactCurrencyFromVnd(2600000000, { currency: "VND", usdToVndRate: 25500 }), "2.6B VND");
  assert.equal(quote.formatCompactCurrencyFromVnd(2550000, { currency: "USD", usdToVndRate: 25500 }), "$100");
  assert.equal(quote.formatCompactCurrencyFromVnd(2618800000, { currency: "USD", usdToVndRate: 26188 }), "$100K");
});

test("USD canonical cost helpers display VND and USD without double conversion", () => {
  assert.equal(quote.amountUsdFromVnd(7800000, { usdToVndRate: 26000 }), 300);
  assert.equal(quote.amountVndFromUsd(300, { usdToVndRate: 26000 }), 7800000);
  assert.equal(quote.legacyPriceToUsd({ unitPrice: 7800000 }, "unitPrice", { usdToVndRate: 26000 }), 300);
  assert.equal(quote.legacyPriceToUsd({ unitPriceUsd: 300, unitPrice: 7800000 }, "unitPrice", { usdToVndRate: 26000 }), 300);
  assert.equal(quote.legacyPriceToUsd({ updatedPriceVnd: 7800000 }, "updatedPrice", { usdToVndRate: 26000 }), 300);
  assert.equal(quote.formatCurrencyFromUsd(300, { currency: "USD", usdToVndRate: 26000 }), "$300");
  assert.equal(quote.formatCurrencyFromUsd(300, { currency: "VND", usdToVndRate: 26000 }), "7,800,000 VND");
});

test("OM pending owner follows business blocking owner", () => {
  assert.equal(quote.pendingOwner({}), "OM Purchasing");
  assert.equal(quote.pendingOwner({ pasDemandNo: "AIDB-1" }), "PAS / Bidding");
  assert.equal(quote.pendingOwner({ userAQuoteDecisionStatus: "Waiting User A Confirmation", pasDemandNo: "AIDB-1" }), "Requester");
  assert.equal(quote.pendingOwner({ finalExportStatus: "Exported to CFA" }), "OM Complete");
});

test("workflow status maps core ownership stages across roles", () => {
  assert.equal(workflowStatus.buildWorkflowStatus({ status: "Submitted", submittedAt: "2026-06-01T00:00:00Z" }, { role: "costOwner", today: new Date("2026-06-05T00:00:00Z") }).pendingOwner, "Dept DRI");
  assert.equal(workflowStatus.buildWorkflowStatus({ priceDecisionStatus: "Price Escalation Required", driApprovedAt: "2026-06-02T00:00:00Z" }, { role: "costOwner" }).pendingOwner, "Budget Approver");
  assert.equal(workflowStatus.buildWorkflowStatus({ status: "Approved", sentToOmAt: "2026-06-02T00:00:00Z" }, { role: "om" }).currentStage, "PAS Demand No");
  assert.equal(workflowStatus.buildWorkflowStatus({ pasDemandNo: "AIDB-1" }, { role: "om" }).pendingOwner, "PAS / Bidding");
  assert.equal(workflowStatus.buildWorkflowStatus({ userAQuoteDecisionStatus: "Waiting Requester Confirmation", sentToUserAAt: "2026-06-04T00:00:00Z" }, { role: "requester" }).pendingOwner, "Requester");
  const buyer = workflowStatus.buildWorkflowStatus({ finalExportedAt: "2026-06-03T00:00:00Z" }, { role: "costOwner" });
  assert.equal(buyer.pendingOwner, "Buyer Handoff");
  assert.equal(buyer.currentStage, "Buyer PR / PO");
  assert.equal(buyer.nextAction, "Buyer owns PR / PO after OM handoff");
});

test("workflow status measures OM days pending from the current stage start", () => {
  const today = new Date("2026-06-18T00:00:00Z");

  const pasDemand = workflowStatus.buildWorkflowStatus({
    status: "Approved",
    submittedAt: "2026-05-01T00:00:00Z",
    sentToOmAt: "2026-06-10T00:00:00Z",
  }, { role: "om", today });
  assert.equal(pasDemand.currentStage, "PAS Demand No");
  assert.equal(pasDemand.stageStartAt, "2026-06-10T00:00:00Z");
  assert.equal(pasDemand.daysPending, 8);

  const quoteResult = workflowStatus.buildWorkflowStatus({
    status: "Approved",
    submittedAt: "2026-05-01T00:00:00Z",
    sentToOmAt: "2026-06-01T00:00:00Z",
    pasDemandNo: "AIDB-1",
    pasDemandNoRecordedAt: "2026-06-15T00:00:00Z",
  }, { role: "om", today });
  assert.equal(quoteResult.currentStage, "PAS Quote Result");
  assert.equal(quoteResult.stageStartAt, "2026-06-15T00:00:00Z");
  assert.equal(quoteResult.daysPending, 3);

  const waitingRequester = workflowStatus.buildWorkflowStatus({
    userAQuoteDecisionStatus: "Waiting Requester Confirmation",
    sentToUserAAt: "2026-06-16T00:00:00Z",
  }, { role: "om", today });
  assert.equal(waitingRequester.currentStage, "Waiting Requester");
  assert.equal(waitingRequester.stageStartAt, "2026-06-16T00:00:00Z");
  assert.equal(waitingRequester.daysPending, 2);
});

test("workflow status role visibility hides internal OM fields from requester", () => {
  const requester = workflowStatus.buildWorkflowStatus({}, { role: "requester" }).visibilityFlags;
  assert.equal(requester.showVendor, false);
  assert.equal(requester.showPasMaterial, false);
  assert.equal(requester.showFactoryMaterial, false);
  assert.equal(requester.showSapMaterial, false);
  assert.equal(requester.showOmAssignee, false);
  const om = workflowStatus.buildWorkflowStatus({}, { role: "omLeader" }).visibilityFlags;
  assert.equal(om.showVendor, true);
  assert.equal(om.showPasMaterial, true);
  assert.equal(om.showSapMaterial, true);
  assert.equal(om.showOmAssignee, true);
});

test("workflow status table hides internal procurement fields from requester", () => {
  const view = workflowStatusTable.rowView({
    project: "P26",
    name: "Mini PC",
    qty: 12,
    vendor: "Hidden Vendor",
    pasMaterialNo: "PAS-MAT-001",
    factoryMaterialNo: "FM-VN-001",
    sapMaterialNo: "7901003.0",
    assignedTo: "Giang",
    status: "Submitted",
    submittedAt: "2026-06-01T00:00:00Z",
  }, { role: "requester", today: new Date("2026-06-05T00:00:00Z") });

  assert.equal(view.view, "requester");
  assert.deepEqual(view.columns.map((column) => column.key), [
    "project",
    "item",
    "qty",
    "submittedAt",
    "currentStage",
    "actionStatus",
    "timeline",
    "detail",
  ]);
  assert.equal(Object.hasOwn(view.values, "vendor"), false);
  assert.equal(Object.hasOwn(view.values, "pasMaterialNo"), false);
  assert.equal(Object.hasOwn(view.values, "factoryMaterialNo"), false);
  assert.equal(Object.hasOwn(view.values, "sapMaterialNo"), false);
  assert.equal(Object.hasOwn(view.values, "omAssignee"), false);
  assert.equal(view.values.currentStage, "Dept DRI Review");
});

test("SAP PO raw contract separates Factory Material No from SAP Material No", () => {
  assert.equal(sapPoRawContract.MATERIAL_NO_TYPE_FACTORY, "factory_material_no");
  assert.equal(sapPoRawContract.MATERIAL_NO_TYPE_SAP, "sap_material_no");
  assert.deepEqual(sapPoRawContract.MATERIAL_NO_TYPES, [
    "factory_material_no",
    "sap_material_no",
    "pas_material_no",
    "legacy_mapping",
  ]);
  assert.equal(sapPoRawContract.SAP_PO_RAW_DATA_COLUMNS.length, 66);
  assert.deepEqual(sapPoRawContract.SAP_PO_RAW_DATA_COLUMNS[0], {
    excelColumn: "A",
    header: "料號",
    field: "factory_material_no",
  });
  assert.deepEqual(sapPoRawContract.SAP_PO_RAW_DATA_COLUMNS[7], {
    excelColumn: "H",
    header: "料號",
    field: "sap_material_no",
  });
  assert.equal(sapPoRawContract.SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN.K, "ftv_code");
  assert.equal(sapPoRawContract.SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN.Q, "normalized_item_name");
  assert.equal(sapPoRawContract.SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN.BL, "lv1");
  assert.equal(sapPoRawContract.SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN.BM, "lv2");
  assert.equal(sapPoRawContract.SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN.BN, "lv3");
});

test("SAP PO export rows keep Raw Data header order and allow PO-only blanks before PO", () => {
  const row = sapPoRawContract.poExportRow({
    normalized_item_name: "鍵盤",
    lv1: "資訊類",
    lv2: "電腦週邊",
    lv3: "鍵盤",
  });

  assert.equal(row.length, 66);
  assert.equal(row[0], "");
  assert.equal(row[7], "");
  assert.equal(row[16], "鍵盤");
  assert.equal(row[63], "資訊類");
  assert.equal(row[64], "電腦週邊");
  assert.equal(row[65], "鍵盤");

  const rawPayload = sapPoRawContract.rawPayloadFromPoExportRow(row);
  assert.equal(rawPayload["A:料號"], "");
  assert.equal(rawPayload["H:料號"], "");
  assert.equal(rawPayload["Q:正規化"], "鍵盤");
  assert.equal(rawPayload["BL:Lv1"], "資訊類");
});

test("workflow status table gives Cost Manager owner and aging columns", () => {
  const view = workflowStatusTable.rowView({
    project: "OR5",
    name: "Monitor 1",
    qty: 83,
    pasDemandNo: "AIDB-1",
    pasDemandNoRecordedAt: "2026-06-01T00:00:00Z",
  }, { role: "manager", today: new Date("2026-06-05T00:00:00Z") });

  assert.equal(view.role, "costOwner");
  assert.deepEqual(view.columns.map((column) => column.key), [
    "project",
    "item",
    "qty",
    "submittedAt",
    "receivedAt",
    "pendingOwner",
    "currentStage",
    "daysPending",
    "quoteStatus",
    "nextAction",
    "riskReason",
    "detail",
  ]);
  assert.equal(view.values.pendingOwner, "PAS / Bidding");
  assert.equal(view.values.currentStage, "PAS Quote Result");
  assert.equal(view.values.daysPending, 4);
});

test("workflow status table exposes assignment for OM roles", () => {
  const view = workflowStatusTable.rowView({
    project: "P26",
    name: "Barcode Printer",
    qty: 20,
    assignedToName: "Giang",
    status: "Approved",
    sentToOmAt: "2026-06-02T00:00:00Z",
  }, { role: "omMember", today: new Date("2026-06-05T00:00:00Z") });

  assert.equal(view.view, "om");
  assert.equal(view.values.assignment, "Giang");
  assert.deepEqual(view.columns.map((column) => column.key), [
    "project",
    "item",
    "qty",
    "receivedAt",
    "pendingOwner",
    "currentStage",
    "daysPending",
    "assignment",
    "detail",
  ]);
});

test("role guards normalize legacy role names and preserve business ownership", () => {
  assert.equal(roleGuards.normalizeRole("manager"), "costOwner");
  assert.equal(roleGuards.normalizeRole("dri"), "deptDri");
  assert.equal(roleGuards.normalizeRole("projectDri"), "budgetApprover");
  assert.equal(roleGuards.normalizeRole("om"), "omLeader");

  assert.equal(roleGuards.canCreateDemand("requester"), true);
  assert.equal(roleGuards.canCreateDemand("admin"), false);
  assert.equal(roleGuards.canDeptDriReview("dri"), true);
  assert.equal(roleGuards.canDeptDriReview("admin"), false);
  assert.equal(roleGuards.canBudgetApprove("projectDri"), true);
  assert.equal(roleGuards.canBudgetApprove("admin"), false);
  assert.equal(roleGuards.canViewCostAnalytics("manager"), true);
  assert.equal(roleGuards.canViewCostAnalytics("dri"), false);
  assert.equal(roleGuards.canViewCostAnalytics("dri", "priceReviewScoped"), true);
  assert.equal(roleGuards.canViewCostAnalytics("projectDri", "priceReviewScoped"), true);
  assert.equal(roleGuards.canViewCostAnalytics("requester"), false);
});

test("role guards separate OM leader controls from assigned member work", () => {
  assert.equal(roleGuards.canAssignOm("omLeader"), true);
  assert.equal(roleGuards.canAssignOm("omMember"), false);
  assert.equal(roleGuards.canMaintainExchangeRate("omLeader"), true);
  assert.equal(roleGuards.canMaintainExchangeRate("omMember"), false);
  assert.equal(roleGuards.canAdminSetup("admin"), true);
  assert.equal(roleGuards.canAdminSetup("omLeader"), false);

  assert.equal(roleGuards.canOperateOmRow({ role: "omMember", assignment: { assignedToUserId: "giang" }, currentUserId: "giang" }), true);
  assert.equal(roleGuards.canOperateOmRow({ role: "omMember", assignment: { assignedToUserId: "linh" }, currentUserId: "giang" }), false);
  assert.equal(roleGuards.canOperateOmRow({ role: "omLeader", assignment: null, currentUserId: "mai" }), false);
});

test("role guards hide internal procurement fields from requester and cost owner", () => {
  const requester = roleGuards.fieldVisibility("requester");
  assert.equal(requester.showCostPrice, false);
  assert.equal(requester.showVendor, false);
  assert.equal(requester.showPasMaterial, false);
  assert.equal(requester.showFactoryMaterial, false);
  assert.equal(requester.showOmAssignee, false);

  const costOwner = roleGuards.fieldVisibility("manager");
  assert.equal(costOwner.showCostImpact, true);
  assert.equal(costOwner.showCostPrice, true);
  assert.equal(costOwner.showVendor, false);
  assert.equal(costOwner.showBusinessApprovalActions, false);

  const omMember = roleGuards.fieldVisibility("omMember");
  assert.equal(omMember.showVendor, true);
  assert.equal(omMember.showPasMaterial, true);
  assert.equal(omMember.showOmActions, true);
});

test("role guards expose governance role catalog, permissions, and sensitive field defaults", () => {
  const roles = roleGuards.roleDefinitions();
  assert.equal(roles.some((role) => role.roleKey === "admin"), true);

  const modules = roleGuards.permissionModules();
  assert.equal(modules.some((module) => module.moduleKey === "admin.audit"), true);
  assert.equal(modules.some((module) => module.moduleKey === "admin.mapping"), true);
  assert.equal(modules.some((module) => module.moduleKey === "admin.user_scope"), true);

  assert.equal(roleGuards.canPerform("admin", "admin.users", "create"), true);
  assert.equal(roleGuards.canPerform("admin", "admin.mapping", "update"), true);
  assert.equal(roleGuards.canPerform("admin", "admin.user_scope", "update"), true);
  assert.equal(roleGuards.canPerform("requester", "admin.users", "view"), false);

  const fieldRules = roleGuards.defaultFieldVisibilityRules();
  assert.equal(fieldRules.some((rule) => rule.fieldKey === "employeeSalary" && rule.reserved), true);
});

test("OM quote status separates reusable quote from waiting and expired quote", () => {
  const today = new Date("2026-06-01T00:00:00");
  assert.equal(quote.omQuoteStatus({ pasDemandNo: "AIDB-1" }, today), "Waiting PAS Reply");
  assert.equal(quote.omQuoteStatus({
    pasDemandNo: "AIDB-1",
    pasMaterialNo: "PAS-MAT-1",
    updatedPrice: 100,
    quoteDate: "2026-05-20",
    quotationPdf: "quote.pdf",
    quoteValidUntil: "2026-06-20",
  }, today), "Reusable Quote");
  assert.equal(quote.omQuoteStatus({
    pasDemandNo: "AIDB-1",
    quoteCompletionReadyAt: "2026-05-20T00:00:00",
    quoteValidUntil: "2026-06-08",
  }, today), "Expiring Soon");
  assert.equal(quote.omQuoteStatus({
    pasDemandNo: "AIDB-1",
    quoteCompletionReadyAt: "2026-05-20T00:00:00",
    quoteValidUntil: "2026-05-31",
  }, today), "Expired / Requote Required");
});

test("OM quote retention decision gates Quotation DB candidates by completion and validity", () => {
  const today = new Date("2026-06-01T00:00:00");
  const completeQuote = {
    pasDemandNo: "PAS-1",
    pasMaterialNo: "PAS-MAT-1",
    vendor: "Central IT Sourcing",
    updatedPrice: 318,
    quoteDate: "2026-05-20",
    quoteValidUntil: "2026-06-30",
    quotationPdf: "quote-shot.png",
    quotationExcel: "quote.xlsx",
  };

  assert.deepEqual(quote.quotationDbRetentionDecision(completeQuote, today), {
    eligible: true,
    status: "Ready for Quotation DB",
    reason: "Complete quote is valid and can be retained as a Quotation DB candidate after governance sync.",
    daysRemaining: 29,
  });
  assert.equal(quote.quotationDbRetentionDecision({
    ...completeQuote,
    quotationExcel: "",
  }, today).status, "Ready for Quotation DB");
  assert.equal(quote.quotationDbRetentionDecision({
    ...completeQuote,
    quoteValidUntil: "2026-06-08",
  }, today).status, "Review before Quotation DB");
  assert.equal(quote.quotationDbRetentionDecision({
    ...completeQuote,
    quoteValidUntil: "2026-05-31",
  }, today).status, "Requote required before Quotation DB");
  assert.match(quote.quotationDbRetentionDecision({
    ...completeQuote,
    vendor: "",
  }, today).reason, /Missing Vendor/);
});

test("demand cost dashboard aggregates item x phase x unit qty and amount", () => {
  const rows = dashboard.aggregateItemUnitRows([
    { project: "P26", item: "Keyboard", spec: "USB", phase: "p10", unit: "MFG", qty: 3, unitPrice: 1000 },
    { project: "P26", item: "Keyboard", spec: "USB", phase: "evt", unit: "ENG1", qty: 2, unitPrice: 1000 },
    { project: "P26", item: "Monitor", spec: "19in", phase: "p10", unit: "FATP TE", qty: 1, unitPrice: 5000 },
  ]);
  assert.equal(rows.length, 2);
  const keyboard = rows.find((row) => row.item === "Keyboard");
  assert.equal(keyboard.unitTotals.MFG, 3);
  assert.equal(keyboard.unitTotals.ENG1, 2);
  assert.equal(keyboard.phaseUnitTotals.p10.MFG, 3);
  assert.equal(keyboard.phaseUnitTotals.evt.ENG1, 2);
  assert.equal(keyboard.qty, 5);
  assert.equal(keyboard.amount, 5000);
});

test("demand cost dashboard exposes phase x unit totals", () => {
  const totals = dashboard.aggregatePhaseUnitTotals([
    { phase: "p10", unit: "MFG", qty: 7 },
    { phase: "p10", unit: "FATP TE", qty: 4 },
    { phase: "mp", unit: "MFG", qty: 2 },
  ]);
  assert.equal(totals.p10.MFG, 7);
  assert.equal(totals.p10["FATP TE"], 4);
  assert.equal(totals.mp.MFG, 2);
});

test("demand cost dashboard calculates selected phase unit cost by line count", () => {
  const totals = dashboard.aggregateSelectedPhaseUnitCost([
    { phase: "p10", unit: "MFG", qty: 3, unitPrice: 100 },
    { phase: "p10", unit: "ENG1", qty: 2, unitPrice: 50 },
    { phase: "mp", unit: "MFG", qty: 9, unitPrice: 100 },
  ], { phase: "p10", lineCount: 2, viewMode: "amount" });
  assert.equal(totals.MFG, 600);
  assert.equal(totals.ENG1, 200);
  assert.equal(totals["FATP TE"], 0);
});

test("demand cost dashboard can return selected phase unit quantities", () => {
  const totals = dashboard.aggregateSelectedPhaseUnitCost([
    { phase: "p10", unit: "MFG", qty: 3, unitPrice: 100 },
    { phase: "p10", unit: "ENG1", qty: 2, unitPrice: 50 },
    { phase: "mp", unit: "MFG", qty: 9, unitPrice: 100 },
  ], { phase: "p10", lineCount: 5, viewMode: "qty" });
  assert.equal(totals.MFG, 3);
  assert.equal(totals.ENG1, 2);
});

test("demand cost dashboard calculates original saving and effective cost from applied carryover", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 10,
    lineCount: 2,
    carryoverQty: 4,
    unitPrice: 300,
    status: "Applied",
  });
  assert.equal(impact.originalQty, 20);
  assert.equal(impact.carryoverQty, 4);
  assert.equal(impact.effectiveQty, 16);
  assert.equal(impact.originalAmount, 6000);
  assert.equal(impact.savingAmount, 1200);
  assert.equal(impact.effectiveAmount, 4800);
});

test("demand cost dashboard line count multiplies original qty only, not carryover qty", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 6,
    lineCount: 3,
    carryoverQty: 5,
    unitPrice: 100,
    status: "Applied",
  });
  assert.equal(impact.originalQty, 18);
  assert.equal(impact.carryoverQty, 5);
  assert.equal(impact.effectiveQty, 13);
  assert.equal(impact.originalAmount, 1800);
  assert.equal(impact.savingAmount, 500);
  assert.equal(impact.effectiveAmount, 1300);
});

test("demand cost dashboard caps applied carryover qty at original qty", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 4,
    lineCount: 2,
    carryoverQty: 99,
    unitPrice: 75,
    status: "Applied",
  });
  assert.equal(impact.originalQty, 8);
  assert.equal(impact.carryoverQty, 8);
  assert.equal(impact.effectiveQty, 0);
  assert.equal(impact.savingAmount, 600);
  assert.equal(impact.effectiveAmount, 0);
});

test("demand cost dashboard treats requester carryover candidate as pending, not effective", () => {
  const impact = dashboard.calculateCarryoverCostImpact({
    submittedQty: 12,
    lineCount: 1,
    carryoverQty: 5,
    unitPrice: 200,
    status: "Requester Candidate",
  });
  assert.equal(impact.originalQty, 12);
  assert.equal(impact.carryoverQty, 0);
  assert.equal(impact.effectiveQty, 12);
  assert.equal(impact.savingAmount, 0);
});

test("demand cost dashboard does not subtract pending or rejected carryover", () => {
  ["Pending Review", "Pending Dept DRI", "Requester Applied", "User Applied", "Rejected"].forEach((status) => {
    const impact = dashboard.calculateCarryoverCostImpact({
      submittedQty: 10,
      lineCount: 2,
      carryoverQty: 99,
      unitPrice: 300,
      status,
    });
    assert.equal(impact.originalQty, 20);
    assert.equal(impact.carryoverQty, 0);
    assert.equal(impact.effectiveQty, 20);
    assert.equal(impact.originalAmount, 6000);
    assert.equal(impact.savingAmount, 0);
    assert.equal(impact.effectiveAmount, 6000);
  });
});

test("demand cost dashboard keeps amount and qty visible in both view modes", () => {
  assert.deepEqual(dashboard.costQtyDisplayPair({
    viewMode: "amount",
    effectiveQty: 60,
    effectiveAmount: 2900,
  }), { main: 2900, sub: "60 qty" });
  assert.deepEqual(dashboard.costQtyDisplayPair({
    viewMode: "qty",
    effectiveQty: 60,
    effectiveAmount: 2900,
  }), { main: 60, sub: 2900 });
});

test("demand cost dashboard filters carryover rows by exact project scope", () => {
  const rows = [
    { project: "OR5", phase: "p10", item: "Monitor" },
    { project: "OR6", phase: "p10", item: "Monitor" },
    { phase: "p10", item: "Monitor" },
  ];
  assert.deepEqual(dashboard.filterCarryoverRows(rows, { project: "OR5" }), [rows[0]]);
  assert.deepEqual(dashboard.filterCarryoverRows(rows, { project: "OR6" }), [rows[1]]);
});

test("price decision uses rounded USD delta threshold", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 10.4,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_AUTO_CLEARED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 10.41,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "MFG",
    quoteUnitPriceUsd: 10.404,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_AUTO_CLEARED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "MFG",
    quoteUnitPriceUsd: 10.405,
    historyUnitPriceUsd: 10,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
});

test("price decision requires escalation for no history and temporary budget", () => {
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 100,
    historyUnitPriceUsd: 0,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
  assert.equal(priceDecision.compareQuoteToHistory({
    category: "Computer",
    quoteUnitPriceUsd: 100,
    historyUnitPriceUsd: 90,
    isTemporaryBudget: true,
  }).status, priceDecision.STATUS_ESCALATION_REQUIRED);
});

test("ETA uses OM approved + base/no bidding/computer lead time", () => {
  const eta = leadTime.estimateEta({
    name: "Mini PC",
    sentToOmAt: "2026-04-10T00:00:00Z",
  }, { today: new Date("2026-06-01T00:00:00Z") });
  assert.equal(eta.startDate, "2026-04-11");
  assert.equal(eta.totalDays, 88);
  assert.equal(eta.estimatedEta, "2026-07-08");
  assert.deepEqual(eta.reasons, ["base 14d", "no bidding +14d", "computer PO ETA +60d"]);
});

test("ETA does not add no-bidding days when valid quote exists", () => {
  const eta = leadTime.estimateEta({
    name: "Fixture",
    sentToOmAt: "2026-04-10T00:00:00Z",
    pasDemandNo: "AIDB-1",
    pasMaterialNo: "PAS-1",
    quoteDate: "2026-04-12",
    quoteValidUntil: "2026-08-01",
    vendor: "Vendor",
  }, { today: new Date("2026-06-01T00:00:00Z") });
  assert.equal(eta.totalDays, 14);
  assert.equal(eta.estimatedEta, "2026-04-25");
});

test("price category classifies computer before MFG station demand", () => {
  assert.equal(priceDecision.classifyPriceThresholdCategory({
    name: "Mini PC",
    stationBreakdown: [{ demandType: "MFG", station: "CG", qty: 1 }],
  }), "Computer");
  assert.equal(priceDecision.classifyPriceThresholdCategory({
    name: "Fixture",
    stationBreakdown: [{ demandType: "MFG", station: "CG", qty: 1 }],
  }), "MFG");
});

test("estimate variance tracks requester estimate against PAS quote without changing history decision", () => {
  const under = priceDecision.compareEstimateToQuote({
    estimateUnitPriceUsd: 10,
    quoteUnitPriceUsd: 13,
    qty: 4,
    percentThreshold: 20,
    amountThresholdUsd: 0.4,
  });
  assert.equal(under.status, priceDecision.ESTIMATE_VARIANCE_UNDER);
  assert.equal(under.alert, true);
  assert.equal(under.deltaUsd, 3);
  assert.equal(under.totalDeltaUsd, 12);

  const small = priceDecision.compareEstimateToQuote({
    estimateUnitPriceUsd: 10,
    quoteUnitPriceUsd: 10.3,
    percentThreshold: 20,
    amountThresholdUsd: 0.4,
  });
  assert.equal(small.status, priceDecision.ESTIMATE_VARIANCE_WITHIN);
  assert.equal(small.alert, false);
});

test("FTV audit key is department-specific while cost allocation remains request-line specific", () => {
  assert.equal(ftvCode.ftvAuditKey({
    itemId: "ITEM-001",
    demandDepartment: "MFG",
  }), "ITEM-001::MFG");
  assert.equal(ftvCode.ftvAuditKey({
    itemId: "ITEM-001",
    demandDepartment: "ENG1",
  }), "ITEM-001::ENG1");

  const mfgCostKey = ftvCode.costAllocationKey({
    requestLineId: "REQ-001",
    itemId: "ITEM-001",
    demandDepartment: "MFG",
    project: "P26",
    phase: "MP",
    station: "CG",
  });
  const engCostKey = ftvCode.costAllocationKey({
    requestLineId: "REQ-002",
    itemId: "ITEM-001",
    demandDepartment: "ENG1",
    project: "P26",
    phase: "MP",
    demandUnit: "ENG1",
  });
  assert.notEqual(mfgCostKey, engCostKey);
  assert.doesNotMatch(mfgCostKey, /FTV/i);
});

test("FTV route logic keeps local buy out of customs code requirements", () => {
  assert.equal(ftvCode.defaultQuoteOwner({ item: "Mini PC ASUS NUC" }), ftvCode.QUOTE_OWNER_PAS);
  assert.equal(ftvCode.defaultQuoteOwner({ item: "Fixture pallet" }), ftvCode.QUOTE_OWNER_SOURCING);
  assert.equal(ftvCode.ftvStatusForRoute({
    routeType: ftvCode.ROUTE_LOCAL_BUY,
  }), ftvCode.FTV_NOT_REQUIRED);
  assert.equal(ftvCode.ftvStatusForRoute({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
    existingFtvCode: "HFS-MFG-1001",
  }), ftvCode.FTV_REUSE_EXISTING);
  assert.equal(ftvCode.ftvStatusForRoute({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
  }), ftvCode.FTV_GENERATE_REQUIRED);
});

test("FTV export gate blocks required external import without code", () => {
  assert.equal(ftvCode.canExportWithFtv({
    routeType: ftvCode.ROUTE_LOCAL_BUY,
    ftvStatus: ftvCode.FTV_NOT_REQUIRED,
  }), true);
  assert.equal(ftvCode.canExportWithFtv({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
    ftvStatus: ftvCode.FTV_GENERATE_REQUIRED,
    ftvCode: "",
  }), false);
  assert.equal(ftvCode.canExportWithFtv({
    routeType: ftvCode.ROUTE_EXTERNAL_IMPORT,
    ftvStatus: ftvCode.FTV_REUSE_EXISTING,
    ftvCode: "HFS-ENG1-1002",
  }), true);
});

test("SAP PO Raw scope contract keeps yellow OM and MFG buy names stable", () => {
  assert.equal(sapPoRawContract.BUY_SCOPE_OM, "om_scope");
  assert.equal(sapPoRawContract.BUY_SCOPE_MFG_BUY, "mfg_buy");
  assert.deepEqual(sapPoRawContract.BUY_SCOPES, ["om_scope", "mfg_buy"]);
  assert.equal(sapPoRawContract.SCOPE_SOURCE_EXCEL_YELLOW_FILL, "excel_yellow_fill");
  assert.equal(sapPoRawContract.SCOPE_SOURCE_DEFAULT_NON_YELLOW, "default_non_yellow");
  assert.equal(sapPoRawContract.YELLOW_FILL_ARGB, "FFFFFF00");
});

test("SAP PO Raw importer writes scope columns before A-BN raw fields", () => {
  const columns = sapPoRawImporter.rawLineColumns();
  assert.deepEqual(columns.slice(0, 8), [
    "id",
    "import_batch_id",
    "source_row_number",
    "item_id",
    "material_id",
    "buy_scope",
    "scope_source",
    "source_fill_color",
  ]);
  assert.equal(columns[8], "factory_material_no");
  assert.equal(columns[15], "sap_material_no");
  assert.equal(columns[18], "ftv_code");
  assert.equal(columns[24], "normalized_item_name");
  assert.equal(columns.at(-4), "lv1");
  assert.equal(columns.at(-3), "lv2");
  assert.equal(columns.at(-2), "lv3");
  assert.equal(columns.at(-1), "raw_payload_json");
});

test("SAP PO Raw importer commits rows in a transaction and preserves scope values", async () => {
  const executed = [];
  const connection = {
    beginTransactionCalled: false,
    commitCalled: false,
    rollbackCalled: false,
    async beginTransaction() { this.beginTransactionCalled = true; },
    async commit() { this.commitCalled = true; },
    async rollback() { this.rollbackCalled = true; },
    release() {},
    async execute(sql, params = []) {
      executed.push({ sql, params });
      if (/SELECT id FROM item_master/.test(sql)) return [[{ id: "item-existing" }]];
      if (/SELECT id, material_no_type FROM material_identity/.test(sql)) return [[]];
      return [{}];
    },
  };
  const pool = {
    async execute() { return [[]]; },
    async getConnection() { return connection; },
  };
  const preview = {
    id: "preview-1",
    source_file_name: "fixture.xlsx",
    source_sheet_name: "Raw Data",
    header_version: "raw-data-a-bn-20260608",
    source_checksum: "sha",
    scope_mode: "yellow-only",
    scope_counts: { om_scope: 1, mfg_buy: 0 },
    errors: [],
    warnings: [],
    rows: [{
      source_row_number: 2,
      buy_scope: "om_scope",
      scope_source: "excel_yellow_fill",
      source_fill_color: "FFFFFF00",
      fields: {
        factory_material_no: "ITKEY-00001",
        sap_material_no: "",
        normalized_item_name: "鍵盤",
        lv1: "資訊類",
        lv2: "電腦週邊",
        lv3: "鍵盤",
      },
      raw_payload_json: { "A:料號": "ITKEY-00001" },
    }],
  };
  const receipt = await sapPoRawImporter.commitSapPoRawImport({ pool, preview, actorUserId: "admin-default" });
  assert.equal(receipt.inserted_lines, 1);
  assert.equal(connection.beginTransactionCalled, true);
  assert.equal(connection.commitCalled, true);
  assert.equal(connection.rollbackCalled, false);
  const rawInsert = executed.find((item) => /INSERT INTO sap_po_raw_lines/.test(item.sql));
  assert.ok(rawInsert);
  assert.equal(rawInsert.params[5], "om_scope");
  assert.equal(rawInsert.params[6], "excel_yellow_fill");
  assert.equal(rawInsert.params[7], "FFFFFF00");
});

test("SAP PO Raw importer rolls back when raw line insert fails", async () => {
  const connection = {
    commitCalled: false,
    rollbackCalled: false,
    async beginTransaction() {},
    async commit() { this.commitCalled = true; },
    async rollback() { this.rollbackCalled = true; },
    release() {},
    async execute(sql) {
      if (/SELECT id FROM item_master/.test(sql)) return [[{ id: "item-existing" }]];
      if (/SELECT id, material_no_type FROM material_identity/.test(sql)) return [[]];
      if (/INSERT INTO sap_po_raw_lines/.test(sql)) throw new Error("raw insert failed");
      return [{}];
    },
  };
  const pool = {
    async execute() { return [[]]; },
    async getConnection() { return connection; },
  };
  await assert.rejects(
    sapPoRawImporter.commitSapPoRawImport({
      pool,
      preview: {
        source_file_name: "fixture.xlsx",
        source_sheet_name: "Raw Data",
        source_checksum: "sha",
        scope_counts: { om_scope: 1, mfg_buy: 0 },
        errors: [],
        warnings: [],
        rows: [{
          source_row_number: 2,
          buy_scope: "om_scope",
          scope_source: "excel_yellow_fill",
          source_fill_color: "FFFFFF00",
          fields: { factory_material_no: "ITKEY-00001", normalized_item_name: "鍵盤" },
          raw_payload_json: {},
        }],
      },
      actorUserId: "admin-default",
    }),
    /raw insert failed/,
  );
  assert.equal(connection.commitCalled, false);
  assert.equal(connection.rollbackCalled, true);
});

test("material coding derives canonical Lv123 taxonomy and generation status from SAP PO Raw preview", () => {
  const preview = {
    rows: [
      {
        source_row_number: 2,
        fields: {
          factory_material_no: "PEJIG-00001",
          normalized_item_name: "Fixture",
          normalized_spec: "Fixture spec",
          lv1: "生產設備與工具",
          lv2: "治具與夾具",
          lv3: "治具與夾具",
        },
        expected_factory_prefix: "PEJIG",
      },
      {
        source_row_number: 3,
        fields: {
          factory_material_no: "AHMED-00001",
          normalized_item_name: "Medical supply",
          lv1: "行政與人資",
          lv2: "醫藥耗材",
          lv3: "醫藥耗材",
        },
        expected_factory_prefix: "",
      },
    ],
  };

  const taxonomy = materialCoding.taxonomyRowsFromPreview(preview);
  assert.deepEqual(taxonomy.map((row) => `${row.lv1}/${row.lv2}/${row.lv3}`), [
    "生產設備與工具/治具與夾具/治具與夾具",
    "行政與人資/醫藥耗材/醫藥耗材",
  ]);

  const catalog = materialCoding.catalogRowsFromPreview(preview);
  assert.equal(catalog[0].materialCodingReviewStatus, "Approved mapping");
  assert.equal(catalog[1].materialCodingReviewStatus, "Need material coding review");
  assert.equal(catalog[1].factoryMaterialNo, "AHMED-00001");
});

test("factory material generator only generates for active coding rules", () => {
  const generated = materialCoding.generateFactoryMaterialNo({
    lv1: "生產設備與工具",
    lv2: "治具與夾具",
    rules: [{ lv1: "生產設備與工具", lv2: "治具與夾具", prefix: "PEJIG", status: "active" }],
    sequences: { PEJIG: 7 },
  });
  assert.deepEqual(generated, {
    ok: true,
    factoryMaterialNo: "PEJIG-00008",
    prefix: "PEJIG",
    nextSequence: 8,
    materialCodingReviewStatus: "Approved mapping",
  });

  const missing = materialCoding.generateFactoryMaterialNo({
    lv1: "行政與人資",
    lv2: "醫藥耗材",
    rules: [{ lv1: "生產設備與工具", lv2: "治具與夾具", prefix: "PEJIG", status: "active" }],
    sequences: {},
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.factoryMaterialNo, "");
  assert.equal(missing.materialCodingReviewStatus, "Need material coding review");
});

test("SAP PO Raw importer receipt reports retained factory material numbers and coding review rows", async () => {
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(sql) {
      if (/SELECT id FROM item_master/.test(sql)) return [[{ id: "item-existing" }]];
      if (/SELECT id, material_no_type FROM material_identity/.test(sql)) return [[]];
      return [{}];
    },
  };
  const pool = {
    async execute() { return [[]]; },
    async getConnection() { return connection; },
  };
  const receipt = await sapPoRawImporter.commitSapPoRawImport({
    pool,
    preview: {
      source_file_name: "fixture.xlsx",
      source_sheet_name: "Raw Data",
      source_checksum: "sha",
      scope_counts: { om_scope: 0, mfg_buy: 2 },
      errors: [],
      warnings: [{ row: 3, code: "lv_rule_missing" }],
      rows: [
        {
          source_row_number: 2,
          fields: { factory_material_no: "PEJIG-00001", normalized_item_name: "Fixture", lv1: "生產設備與工具", lv2: "治具與夾具", lv3: "治具與夾具" },
          expected_factory_prefix: "PEJIG",
          raw_payload_json: {},
        },
        {
          source_row_number: 3,
          fields: { factory_material_no: "AHMED-00001", normalized_item_name: "Medical", lv1: "行政與人資", lv2: "醫藥耗材", lv3: "醫藥耗材" },
          expected_factory_prefix: "",
          raw_payload_json: {},
        },
      ],
    },
    actorUserId: "admin-default",
  });
  assert.equal(receipt.retained_factory_material_no_count, 2);
  assert.equal(receipt.generated_factory_material_no_count, 0);
  assert.equal(receipt.need_material_coding_review_count, 1);
});
