// shell/dialogs: authoritative source; see docs/module-map.md.
import {
  closeItemQuantityReview
} from "../approval/quantity-review.js";
import {
  closeRequestItemPicker
} from "../catalog/search.js";
import {
  closeManagerDetail,
  closeManagerTrack
} from "../cost/detail-view.js";
import {
  closeManagerStageDetail
} from "../cost/matrix-view.js";
import {
  closeDemandEditor
} from "../demand/editor.js";
import {
  closeMaterialBatch
} from "../materials/batch.js";
import {
  closeItemDetail
} from "../materials/detail-view.js";
import {
  closeMaterialEntry
} from "../materials/entry-view.js";
import {
  closeMaterialStandardPicker
} from "../materials/standard-picker.js";
import {
  closeOmExternalResultModal
} from "../om/external-progress.js";
import {
  closeRfqEmailDraft
} from "../sourcing/rfq-actions.js";

// @legacy-unit 322 1331
export let toastSequence;
export function initializeToastSequenceBinding() {
  toastSequence = 1;
}
// @end-legacy-unit 322

// @legacy-unit 323 1332
export let pendingConfirmAction;
export function initializePendingConfirmActionBinding() {
  pendingConfirmAction = null;
}
// @end-legacy-unit 323

// @legacy-unit 346 1495
export function showToast(message, type = "info") {
  const toastRegion = document.getElementById("toastRegion");
  if (!toastRegion) return;
  const toast = document.createElement("article");
  const id = toastSequence++;
  const title = type === "error" ? "Action needed" : type === "success" ? "Success" : "Notice";
  toast.className = `toast ${type}`;
  toast.dataset.toastId = String(id);
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  toastRegion.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, type === "error" ? 5200 : 3200);
}
// @end-legacy-unit 346

// @legacy-unit 347 1510
export function showConfirm({ title, message, confirmLabel = "Confirm", tone = "primary", onConfirm }) {
  pendingConfirmAction = onConfirm;
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmMessage").textContent = message;
  const confirmButton = document.getElementById("confirmActionButton");
  confirmButton.textContent = confirmLabel;
  confirmButton.className = tone === "danger" ? "danger" : "primary";
  document.getElementById("confirmModal").hidden = false;
}
// @end-legacy-unit 347

// @legacy-unit 348 1520
export function hideConfirm() {
  pendingConfirmAction = null;
  document.getElementById("confirmModal").hidden = true;
}
// @end-legacy-unit 348

// @legacy-unit 349 1525
export function runConfirmedAction() {
  const action = pendingConfirmAction;
  hideConfirm();
  if (typeof action === "function") action();
}
// @end-legacy-unit 349

// @legacy-unit 1884 25180
export function closeModalById(modalId) {
  const closeById = {
    managerDetailModal: closeManagerDetail,
    managerTrackModal: closeManagerTrack,
    itemQuantityReviewModal: closeItemQuantityReview,
    managerStageDetailModal: closeManagerStageDetail,
    itemDetailModal: closeItemDetail,
    demandEditorModal: closeDemandEditor,
    materialEntryModal: closeMaterialEntry,
    standardNamePickerModal: closeMaterialStandardPicker,
    materialBatchModal: closeMaterialBatch,
    omExternalResultModal: closeOmExternalResultModal,
    rfqEmailDraftModal: closeRfqEmailDraft,
    contactPopupModal: () => window.closeContactPopup?.(),
    requestItemPickerModal: closeRequestItemPicker,
  }[modalId];
  if (closeById) closeById();
}
// @end-legacy-unit 1884
