// shell/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  commitSapPoRawImportFromPreview,
  previewSapPoRawImportFromForm,
  refreshSapPoRawImportStatus
} from "../admin/import-view.js";
import {
  addRecord
} from "../catalog/add-actions.js";
import {
  closeItemPicker,
  openItemPicker
} from "../catalog/context.js";
import {
  renderRequestItemPicker
} from "../catalog/search.js";
import {
  replaceRequestItemPickerSourceModeBinding
} from "../catalog/state.js";
import {
  applyManagerQuantityDashboardCellFilter,
  applyManagerQuantityItemFilter
} from "../cost/quantity-dashboard.js";
import {
  importBaselineExcel,
  saveBaseline
} from "../demand/baseline-setup.js";
import {
  addStationBreakdownRow,
  removeStationBreakdownRow
} from "../demand/editor.js";
import {
  removeRequest
} from "../demand/request-fields.js";
import {
  sendSelectedToOm
} from "../handoff/actions.js";
import {
  closeItemDetail,
  openItemDetail
} from "../materials/detail-view.js";
import {
  closeMaterialEntry,
  materialEntryRow,
  renderMaterialEntryModal
} from "../materials/entry-view.js";
import {
  createNewItemSuggestion,
  persistLocalItemDraft
} from "../materials/new-item.js";
import {
  openMfgPackageDetail
} from "../sourcing/package-view.js";
import {
  exportMfgPdf,
  rejectMfgSelectedToDri,
  updateMfgExternalProgress
} from "../sourcing/rfq-actions.js";
import {
  closeModalById,
  hideConfirm,
  runConfirmedAction,
  showConfirm
} from "./dialogs.js";
import {
  setDeptTab,
  setView
} from "./navigation.js";

export function handleClickTarget(event) {
  if (event.target.classList?.contains("modal-backdrop") && !event.target.classList.contains("confirm-backdrop")) {
    closeModalById(event.target.id);
    return true;
  }
}

export function handleClickTab(viewTab) {
  if (viewTab && (viewTab.classList.contains("tab") || viewTab.classList.contains("workflow-nav-item")) && !viewTab.hidden) {
    setView(viewTab.dataset.view);
  }
}

export function handleClickDeptTab(deptTab) {
  if (deptTab) setDeptTab(deptTab.dataset.deptTab);
}

export function handleClickOpenContactPopup(action) {
  if (action === "openContactPopup") window.openContactPopup?.();
  if (action === "closeContactPopup") window.closeContactPopup?.();
  if (action === "copyContactPopup") window.copyContactPopupText?.();
  if (action === "openItemPicker") openItemPicker();
  if (action === "closeItemPicker") closeItemPicker();
}

export function handleClickRefreshSapPoRawImportStatus(action) {
  if (action === "refreshSapPoRawImportStatus") refreshSapPoRawImportStatus();
  if (action === "previewSapPoRawImport") previewSapPoRawImportFromForm();
  if (action === "commitSapPoRawImport") commitSapPoRawImportFromPreview();
}

export function handleClickOpenNeedConfirmation(action) {
  if (action === "openNeedConfirmation") setDeptTab("needConfirmation");
}

export function handleClickCreateNewItemSuggestion(action) {
  if (action === "createNewItemSuggestion") createNewItemSuggestion();
}

export function handleClickEnterNewItemDetails(action) {
  if (action === "enterNewItemDetails" || action === "returnToItemMatches") {
    const row = materialEntryRow();
    if (!row?.simplifiedEntry) return true;
    row.entryStep = action === "enterNewItemDetails" ? "create" : "search";
    persistLocalItemDraft(row);
    renderMaterialEntryModal();
    document.querySelector("#materialEntryModal .modal-card").scrollTop = 0;
    document.getElementById(row.entryStep === "create" ? "materialEntryLevel1" : "materialEntryStandardNameCn").focus({ preventScroll: true });
  }
}

export function handleClickBackToItemSearch(action) {
  if (action === "backToItemSearch") {
    closeMaterialEntry();
    replaceRequestItemPickerSourceModeBinding("catalog");
    document.getElementById("requestItemPickerModal").hidden = false;
    renderRequestItemPicker();
    document.getElementById("requestItemPickerQuery").focus();
  }
}

export function handleClickAddStationBreakdownRow(action, event) {
  if (action === "addStationBreakdownRow") {
    const addStationButton = event.target.closest("[data-action='addStationBreakdownRow']");
    addStationBreakdownRow(addStationButton?.dataset.stationRequestId || "");
  }
}

export function handleClickSendSelectedToOm(action) {
  if (action === "sendSelectedToOm") sendSelectedToOm();
}

export function handleClickMfgExportPdf(action) {
  if (action === "mfgExportPdf") exportMfgPdf();
  if (action === "mfgUpdateExternalProgress") updateMfgExternalProgress();
  if (action === "mfgRejectToDri") rejectMfgSelectedToDri();
}

export function handleClickImportBaselineExcel(action) {
  if (action === "importBaselineExcel") importBaselineExcel();
  if (action === "saveBaseline") saveBaseline();
}

export function handleClickCloseItemDetail(action) {
  if (action === "closeItemDetail") closeItemDetail();
}

export function handleClickCancelConfirm(action, addRecordButton) {
  if (action === "cancelConfirm") hideConfirm();
  if (action === "confirmAction") runConfirmedAction();
  if (addRecordButton) addRecord(addRecordButton.dataset.addRecord);
}

export function handleClickRemoveButton(removeButton) {
  if (removeButton) {
    showConfirm({
      title: "Remove request line?",
      message: "This editable request line will be removed from the current request draft.",
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => removeRequest(removeButton.dataset.removeRequest),
    });
  }
}

export function handleClickRemoveStationBreakdownButton(removeStationBreakdownButton, itemDetailControl) {
  if (removeStationBreakdownButton) removeStationBreakdownRow(
    removeStationBreakdownButton.dataset.removeStationBreakdown,
    removeStationBreakdownButton.dataset.removeStationBreakdownRow,
  );
  if (itemDetailControl) openItemDetail(itemDetailControl.dataset.itemDetailSource, itemDetailControl.dataset.itemDetailId);
}

export function handleClickQuantityDashboardPhase(quantityDashboardPhase, quantityDashboardUnit, quantityDashboardItem) {
  if (quantityDashboardPhase || quantityDashboardUnit) applyManagerQuantityDashboardCellFilter(quantityDashboardItem, quantityDashboardPhase, quantityDashboardUnit);
  else if (quantityDashboardItem) applyManagerQuantityItemFilter(quantityDashboardItem);
}

export function handleClickMfgPackageDetailButton(mfgPackageDetailButton) {
  if (mfgPackageDetailButton) openMfgPackageDetail(mfgPackageDetailButton.dataset.mfgPackageDetail);
}
