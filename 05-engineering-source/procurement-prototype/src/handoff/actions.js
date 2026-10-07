// handoff/actions: authoritative source; see docs/module-map.md.
import {
  QUOTE_EXCEPTION_NOTE
} from "../admin/state.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  addHandoffHistory,
  procurementRows,
  readyForCoordinatorOutput
} from "./queue.js";
import {
  handoffRoute,
  handoffWarnings
} from "./status.js";
import {
  renderHandoffHistory,
  renderProcurement
} from "./view.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  selectedOmRows
} from "../om/selection.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  showConfirm,
  showToast
} from "../shell/dialogs.js";
import {
  HANDOFF_SENT_TO_OM,
  OM_RECEIVED,
  OM_UPDATED
} from "../workflow/status-constants.js";

// @legacy-unit 1560 19735
export function commitSendSelectedToOm(selectedRows) {
  selectedRows.forEach((row) => {
    addHandoffHistory(row, "Sent handoff package to OM Purchasing", row.procurementRemark || "Ready for OM Purchasing update.");
    addOmHistory(row, "Received handoff", `Route: ${handoffRoute(row)} / ${handoffWarnings(row).join(" / ") || "No warnings"}`);
  });

  replaceRequestsBinding(requests.map((row) => {
    if (!selectedRows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      handoffSelected: false,
      omSelected: true,
      procurementStatus: HANDOFF_SENT_TO_OM,
      omStatus: OM_RECEIVED,
      sentToOmAt: new Date().toISOString(),
    };
  }));
  renderProcurement();
  renderOmPurchasing();
  showToast(`${selectedRows.length} handoff row${selectedRows.length === 1 ? "" : "s"} sent to OM Purchasing.`, "success");
}
// @end-legacy-unit 1560

// @legacy-unit 1561 19757
export function sendSelectedToOm() {
  const selectedRows = procurementRows().filter((row) => row.handoffSelected && row.procurementStatus !== HANDOFF_SENT_TO_OM);
  if (!selectedRows.length) {
    showToast("Select at least one ready handoff row before sending to OM Purchasing.", "error");
    return;
  }
  const blockedRows = selectedRows.filter((row) => !readyForCoordinatorOutput(row));
  if (blockedRows.length) return;

  showConfirm({
    title: "Send selected rows to OM Purchasing?",
    message: `${selectedRows.length} selected handoff row${selectedRows.length === 1 ? "" : "s"} will move to the OM Purchasing queue.`,
    confirmLabel: "Send to OM",
    tone: "primary",
    onConfirm: () => commitSendSelectedToOm(selectedRows),
  });
}
// @end-legacy-unit 1561

// @legacy-unit 1851 24757
export function markSelectedExternalUpdated() {
  const rows = selectedOmRows();
  if (!rows.length) {
    showToast("Select at least one OM row before marking external system updated.", "error");
    return;
  }
  rows.forEach((row) => addOmHistory(row, "Updated external system", row.externalSystemRef || "External system marked updated."));
  replaceRequestsBinding(requests.map((row) => rows.some((selected) => selected.id === row.id) ? { ...row, externalSystemStatus: OM_UPDATED, omStatus: OM_UPDATED } : row));
  renderOmPurchasing();
  showToast("Selected rows marked as external system updated.", "success");
}
// @end-legacy-unit 1851

// @legacy-unit 1852 24769
export function updateProcurementField(requestId, field, value) {
  replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, [field]: value } : row));
}
// @end-legacy-unit 1852

// @legacy-unit 1853 24773
export function updateHandoffRemark(requestId, value) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || (row.procurementRemark || "") === value) return;
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? { ...item, procurementRemark: value } : item));
  addHandoffHistory(row, "Updated handoff note", value || "Handoff note cleared.");
  renderHandoffHistory();
}
// @end-legacy-unit 1853

// @legacy-unit 1854 24781
export function toggleQuoteException(requestId, checked) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || Boolean(row.quoteException) === checked) return;
  replaceRequestsBinding(requests.map((item) => item.id === requestId ? { ...item, quoteException: checked } : item));
  addHandoffHistory(row, checked ? "Marked quote exception" : "Cleared quote exception", checked ? QUOTE_EXCEPTION_NOTE : "Quote exception cleared.");
  renderProcurement();
  showToast(checked ? "Quote exception marked." : "Quote exception cleared.", "success");
}
// @end-legacy-unit 1854
