// om/tracking-actions: authoritative source; see docs/module-map.md.
import {
  clampQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  addOmHistory
} from "./history.js";
import {
  applyOmProcurementTracking
} from "./hydration.js";
import {
  procurementStatusValue
} from "./tracking-rules.js";
import {
  canEditOmProcurementTracking,
  omProcurementFieldLabel
} from "./tracking-view.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  dateOnly
} from "../projects/dates.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1696 21006
export async function updateOmProcurementField(requestId, field, value) {
  if (!canEditOmProcurementTracking()) {
    showToast(`Only OM Purchasing can update ${omProcurementFieldLabel(field)}.`, "error");
    renderOmPurchasing();
    return;
  }
  const normalizedValue = ["budgetStatus", "prStatus", "poStatus"].includes(field)
    ? procurementStatusValue(value)
    : ["etaPlanDate", "dtaActualDate"].includes(field)
      ? dateOnly(value)
      : field === "totalLeadTimeDays"
        ? (String(value || "").trim() === "" ? "" : clampQty(value))
        : String(value || "").trim();
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId) return row;
    const patch = {
      [field]: normalizedValue,
      omProcurementUpdatedAt: new Date().toISOString(),
      omProcurementSaveErrorField: "",
      omProcurementSaveErrorMessage: "",
    };
    if (field === "buyerPoNo") patch.poNo = normalizedValue;
    if (field === "etaPlanDate") patch.etaPlan = normalizedValue;
    if (field === "dtaActualDate") patch.dtaActual = normalizedValue;
    return { ...row, ...patch };
  }));
  const updated = requests.find((row) => row.id === requestId);
  addOmHistory(updated, `OM updated ${field}`, normalizedValue || "blank");
  if (apiModeEnabled()) {
    try {
      const payload = await apiRequest(`/api/om/requests/${encodeURIComponent(requestId)}/procurement-tracking`, {
        method: "PATCH",
        body: { [field]: normalizedValue },
      });
      applyOmProcurementTracking([payload.tracking].filter(Boolean));
    } catch (error) {
      const fieldLabel = omProcurementFieldLabel(field);
      const errorMessage = `${fieldLabel} for ${requestId} failed to save: ${error.message}`;
      replaceRequestsBinding(requests.map((row) => row.id === requestId
        ? { ...row, omProcurementSaveErrorField: field, omProcurementSaveErrorMessage: errorMessage }
        : row));
      showToast(errorMessage, "error");
    }
  }
  renderOmPurchasing();
  renderBuyer();
  renderDepartment();
}
// @end-legacy-unit 1696
