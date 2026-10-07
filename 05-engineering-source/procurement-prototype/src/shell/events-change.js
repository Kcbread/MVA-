// shell/events-change.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  handleChangeAdminFieldKey,
  handleChangeAdminRolePermission,
  handleChangeAdminUserField
} from "../admin/events-change-handlers.js";
import {
  handleChangeDriDateField,
  handleChangePriceReviewDemandCostProjectFilter,
  handleChangePriceReviewQuantityProjectFilter
} from "../approval/events-change-handlers.js";
import {
  handleChangeHistoryId,
  handleChangeHistorySourceProject,
  handleChangeNaturalLevel1
} from "../catalog/events-change-handlers.js";
import {
  handleChangeActualField,
  handleChangeCurrencyDisplaySelect,
  handleChangeManagerDashboardProjectFilter,
  handleChangeManagerDemandCostProjectFilter,
  handleChangeManagerProjectFilter,
  handleChangeManagerQuantityProjectFilter
} from "../cost/events-change-handlers.js";
import {
  handleChangeBaselineId,
  handleChangeDemandEditorId,
  handleChangeDeptDemandMode,
  handleChangeItemPickerDemandTypeSelect,
  handleChangeRequestAction,
  handleChangeRequestDemandUnit,
  handleChangeRequestMatrixQty,
  handleChangeRequestNeedDate,
  handleChangeRequestPurposeLocation,
  handleChangeRequestRequiredDeliveryDate,
  handleChangeRequestWorksheetQty,
  handleChangeSelectRequest,
  handleChangeSelectedDemandNeedDate,
  handleChangeSelectedDemandQty,
  handleChangeSelectedDemandRemark,
  handleChangeStage,
  handleChangeStationBreakdownId
} from "../demand/events-change-handlers.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  updateProcurementField
} from "../handoff/actions.js";
import {
  handleChangeAssignedId,
  handleChangeBuyerField,
  handleChangeBuyerProjectFilter,
  handleChangeHandoffProjectFilter,
  handleChangeHandoffSelect,
  handleChangePriceId,
  handleChangeQuoteExceptionId,
  handleChangeRemarkId
} from "../handoff/events-change-handlers.js";
import {
  renderProcurement
} from "../handoff/view.js";
import {
  apiModeEnabled
} from "../infrastructure/api.js";
import {
  uploadAttachment
} from "../infrastructure/attachments.js";
import {
  handleChangeWarehouseStockItem
} from "../inventory/events-change-handlers.js";
import {
  isMaterialNoPending
} from "../materials/display.js";
import {
  handleChangeBatchMaterialFields,
  handleChangeMaterialEntryFields
} from "../materials/events-change-handlers.js";
import {
  ensureMaterialMasterFromQuote,
  hasSourcingQuoteSuccess
} from "../materials/identity.js";
import {
  ensureOmRowAccess
} from "../om/assignment.js";
import {
  handleChangeOmAssigneeId,
  handleChangeOmDemandProjectFilter,
  handleChangeOmField,
  handleChangeOmPriceCurrencyId,
  handleChangeOmProcurementField,
  handleChangeOmQuoteExceptionId,
  handleChangeOmSelect,
  handleChangeOmSubmissionYearFilter,
  handleChangePasDecisionId,
  handleChangePasExcelGroupId,
  handleChangePasField
} from "../om/events-change-handlers.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  handleChangeProjectCodeInput,
  handleChangeProjectPhaseCode,
  handleChangeProjectSelect,
  handleChangeProjectStatusProjectTypeFilter,
  handleChangeProjectTypeCode,
  handleChangeProjectTypeSelect
} from "../projects/events-change-handlers.js";
import {
  handleChangeRfqField,
  handleChangeRfqSelect,
  handleChangeSourcingField,
  handleChangeSourcingOwnerFilter
} from "../sourcing/events-change-handlers.js";
import {
  addDispatchHistory,
  renderRfqFollowUp,
  renderSourcing
} from "../sourcing/rfq.js";
import {
  showToast
} from "./dialogs.js";

// @legacy-unit 1890 25742
export function initializeStep1890() {
document.addEventListener("change", async (event) => {
  handleChangeProjectTypeSelect(event);

  handleChangeProjectSelect(event);

  handleChangeProjectCodeInput(event);

  handleChangeWarehouseStockItem(event);

  handleChangeManagerProjectFilter(event);
  handleChangeProjectStatusProjectTypeFilter(event);
  handleChangeManagerDemandCostProjectFilter(event);
  handleChangePriceReviewDemandCostProjectFilter(event);
  handleChangeManagerQuantityProjectFilter(event);
  handleChangePriceReviewQuantityProjectFilter(event);
  handleChangeOmSubmissionYearFilter(event);
  handleChangeCurrencyDisplaySelect(event);
  handleChangeItemPickerDemandTypeSelect(event);
  handleChangeManagerDashboardProjectFilter(event);
  handleChangeHandoffProjectFilter(event);
  handleChangeSourcingOwnerFilter(event);
  handleChangeBuyerProjectFilter(event);
  handleChangeOmDemandProjectFilter(event);
  handleChangeNaturalLevel1(event);
  handleChangeDeptDemandMode(event);

  const projectPhaseCode = event.target.dataset.projectConfigPhase;
  handleChangeProjectPhaseCode(projectPhaseCode, event);
  const projectTypeCode = event.target.dataset.projectConfigType;
  handleChangeProjectTypeCode(projectTypeCode, event);
  handleChangeHistorySourceProject(event);

  const materialEntryFields = {
    materialEntryLevel1: "level1",
    materialEntryLevel2: "level2",
    materialEntryLevel3: "level3",
  };
  handleChangeMaterialEntryFields(materialEntryFields, event);
  const batchMaterialFields = {
    materialBatchLevel1: "level1",
    materialBatchLevel2: "level2",
    materialBatchLevel3: "level3",
  };
  handleChangeBatchMaterialFields(batchMaterialFields, event);

  const historyId = event.target.dataset.historySelect;
  handleChangeHistoryId(historyId, event);

  const selectRequest = event.target.dataset.selectRequest;
  handleChangeSelectRequest(selectRequest, event);

  const requestNeedDate = event.target.dataset.requestNeedDate;
  handleChangeRequestNeedDate(requestNeedDate, event);

  const requestRequiredDeliveryDate = event.target.dataset.requestRequiredDeliveryDate;
  handleChangeRequestRequiredDeliveryDate(requestRequiredDeliveryDate, event);
  const requestPurposeLocation = event.target.dataset.requestPurposeLocation;
  handleChangeRequestPurposeLocation(requestPurposeLocation, event);

  const requestDemandUnit = event.target.dataset.requestDemandUnit;
  handleChangeRequestDemandUnit(requestDemandUnit, event);
  const requestAction = event.target.dataset.requestAction;
  handleChangeRequestAction(requestAction, event);

  const requestMatrixQty = event.target.dataset.requestMatrixQty;
  handleChangeRequestMatrixQty(requestMatrixQty, event);
  const requestWorksheetQty = event.target.dataset.requestWorksheetQty;
  handleChangeRequestWorksheetQty(requestWorksheetQty, event);

  const selectedDemandNeedDate = event.target.dataset.selectedDemandNeedDate;
  handleChangeSelectedDemandNeedDate(selectedDemandNeedDate, event);
  const selectedDemandQty = event.target.dataset.selectedDemandQty;
  handleChangeSelectedDemandQty(selectedDemandQty, event);
  const selectedDemandRemark = event.target.dataset.selectedDemandRemark;
  handleChangeSelectedDemandRemark(selectedDemandRemark, event);

  const adminUserField = event.target.dataset.adminUserField;
  const adminUserId = event.target.dataset.adminUserId;
  handleChangeAdminUserField(adminUserField, adminUserId, event);
  const adminRolePermission = event.target.dataset.adminRolePermission;
  const adminModuleKey = event.target.dataset.adminModuleKey;
  const adminPermissionKey = event.target.dataset.adminPermissionKey;
  handleChangeAdminRolePermission(adminRolePermission, adminModuleKey, adminPermissionKey, event);
  const adminFieldKey = event.target.dataset.adminFieldKey;
  const adminRoleVisibility = event.target.dataset.adminRoleVisibility;
  handleChangeAdminFieldKey(adminFieldKey, adminRoleVisibility, event);

  const handoffSelect = event.target.dataset.handoffSelect;
  handleChangeHandoffSelect(handoffSelect, event);

  const rfqSelect = event.target.dataset.rfqSelect;
  handleChangeRfqSelect(rfqSelect, event);

  const rfqField = event.target.dataset.rfqField;
  const rfqId = event.target.dataset.rfqId;
  handleChangeRfqField(rfqField, rfqId, event);

  const pasField = event.target.dataset.pasField;
  const pasId = event.target.dataset.pasId;
  handleChangePasField(pasField, pasId, event);

  const pasDecisionId = event.target.dataset.pasDecision;
  handleChangePasDecisionId(pasDecisionId, event);

  const sourcingField = event.target.dataset.sourcingField;
  const sourcingId = event.target.dataset.sourcingId;
  handleChangeSourcingField(sourcingField, sourcingId, event);

  const sourcingPdfId = event.target.dataset.sourcingPdf;
  if (sourcingPdfId) {
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quotation.pdf";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "sourcing_quote",
          linkedEntityId: sourcingPdfId,
          attachmentKind: "sourcing_quote_screenshot",
          visibilityScope: "om_internal",
          metadata: { source: "sourcing_upload", requestId: sourcingPdfId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Sourcing quote upload failed: ${error.message}`, "error");
      return;
    }
    replaceRequestsBinding(requests.map((row) => row.id === sourcingPdfId ? {
      ...row,
      quotationPdf: fileName,
      quotationPdfAttachmentId: attachment?.id || row.quotationPdfAttachmentId || "",
      quotationPdfUrl: attachment?.downloadUrl || row.quotationPdfUrl || "",
      rfqStatus: row.rfqStatus || "Quote Received",
    } : row));
    let row = requests.find((item) => item.id === sourcingPdfId);
    if (row && hasSourcingQuoteSuccess(row) && !isMaterialNoPending(row)) {
      const materialPatch = ensureMaterialMasterFromQuote(row);
      replaceRequestsBinding(requests.map((item) => item.id === sourcingPdfId ? { ...item, ...materialPatch } : item));
      row = requests.find((item) => item.id === sourcingPdfId);
      addDispatchHistory(row, "Vendor mapping updated", `${row.materialNo} vendor quote screenshot saved after sourcing upload.`);
    }
    addDispatchHistory(row, "Sourcing uploaded quote screenshot", fileName);
    renderSourcing();
    renderRfqFollowUp();
    showToast("Sourcing quote screenshot uploaded.", "success");
  }

  const buyerField = event.target.dataset.buyerField;
  const buyerId = event.target.dataset.buyerId;
  handleChangeBuyerField(buyerField, buyerId, event);

  const driDateField = event.target.dataset.driDateField;
  const driDateId = event.target.dataset.driDateId;
  if (handleChangeDriDateField(driDateField, driDateId, event)) return;

  const omProcurementField = event.target.dataset.omProcurementField;
  const omProcurementId = event.target.dataset.omProcurementId;
  handleChangeOmProcurementField(omProcurementField, omProcurementId, event);

  const omSelect = event.target.dataset.omSelect;
  handleChangeOmSelect(omSelect, event);

  const stage = event.target.dataset.stage;
  const requestId = event.target.dataset.requestId;
  handleChangeStage(stage, requestId, event);

  const stationBreakdownId = event.target.dataset.stationBreakdownId;
  const stationBreakdownRow = event.target.dataset.stationBreakdownRow;
  const stationBreakdownField = event.target.dataset.stationBreakdownField;
  handleChangeStationBreakdownId(stationBreakdownId, stationBreakdownRow, stationBreakdownField, event);

  const demandEditorId = event.target.dataset.demandEditorId;
  const demandEditorRow = event.target.dataset.demandEditorRow;
  const demandEditorField = event.target.dataset.demandEditorField;
  handleChangeDemandEditorId(demandEditorId, demandEditorRow, demandEditorField, event);

  const priceId = event.target.dataset.procPrice;
  handleChangePriceId(priceId, event);

  const assignedId = event.target.dataset.procAssigned;
  handleChangeAssignedId(assignedId, event);

  const remarkId = event.target.dataset.procRemark;
  handleChangeRemarkId(remarkId, event);

  const quoteExceptionId = event.target.dataset.quoteException;
  handleChangeQuoteExceptionId(quoteExceptionId, event);

  const omQuoteExceptionId = event.target.dataset.omQuoteException;
  handleChangeOmQuoteExceptionId(omQuoteExceptionId, event);

  const omAssigneeId = event.target.dataset.omAssigneeId;
  handleChangeOmAssigneeId(omAssigneeId, event);

  const omPriceCurrencyId = event.target.dataset.omPriceCurrency;
  handleChangeOmPriceCurrencyId(omPriceCurrencyId, event);

  const pasExcelGroupId = event.target.dataset.omPasExcelGroup;
  handleChangePasExcelGroupId(pasExcelGroupId, event);

  const omField = event.target.dataset.omField;
  const omId = event.target.dataset.omId;
  handleChangeOmField(omField, omId, event);

  const actualField = event.target.dataset.actualField;
  const actualId = event.target.dataset.actualId;
  handleChangeActualField(actualField, actualId, event);

  const baselineId = event.target.dataset.baselineQty;
  handleChangeBaselineId(baselineId, event);

  const pdfId = event.target.dataset.procPdf;
  if (pdfId) {
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quotation.pdf";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "procurement_quote",
          linkedEntityId: pdfId,
          attachmentKind: "procurement_quote_screenshot",
          visibilityScope: "om_internal",
          metadata: { source: "procurement_upload", requestId: pdfId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Quote upload failed: ${error.message}`, "error");
      return;
    }
    updateProcurementField(pdfId, "quotationPdf", fileName);
    replaceRequestsBinding(requests.map((row) => row.id === pdfId ? {
      ...row,
      quotationPdfAttachmentId: attachment?.id || row.quotationPdfAttachmentId || "",
      quotationPdfUrl: attachment?.downloadUrl || row.quotationPdfUrl || "",
    } : row));
    renderProcurement();
  }

  const omPdfId = event.target.dataset.omScreenshot || event.target.dataset.omPdf;
  if (omPdfId) {
    const accessRow = requests.find((item) => item.id === omPdfId);
    if (!accessRow || !ensureOmRowAccess(accessRow, "upload quote screenshot")) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0] || null;
    const fileName = file?.name || "quote-screenshot.jpg";
    let attachment = null;
    try {
      if (file && apiModeEnabled()) {
        attachment = await uploadAttachment(file, {
          linkedEntityType: "om_quote",
          linkedEntityId: omPdfId,
          attachmentKind: "om_quote_screenshot",
          visibilityScope: "om_internal",
          metadata: { source: "om_quote_entry", requestId: omPdfId },
        });
      }
    } catch (error) {
      event.target.value = "";
      showToast(`Quote screenshot upload failed: ${error.message}`, "error");
      return;
    }
    replaceRequestsBinding(requests.map((row) => row.id === omPdfId ? {
      ...row,
      quotationPdf: fileName,
      quotationPdfAttachmentId: attachment?.id || row.quotationPdfAttachmentId || "",
      quotationPdfUrl: attachment?.downloadUrl || row.quotationPdfUrl || "",
    } : row));
    const row = requests.find((item) => item.id === omPdfId);
    addOmHistory(row, "Uploaded quote screenshot", fileName);
    renderOmPurchasing();
    showToast("Quote screenshot uploaded.", "success");
  }

});
}
// @end-legacy-unit 1890
