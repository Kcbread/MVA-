// om/export-actions: authoritative source; see docs/module-map.md.
import {
  BUYER_RECEIVED,
  OM_EXPORTED_CFA,
  OM_EXPORTED_ECS,
  OM_PAYMENT_METHOD
} from "../admin/state.js";
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
  addHandoffHistory
} from "../handoff/queue.js";
import {
  ensureOmRowAccess
} from "./assignment.js";
import {
  generateOmFinalExportPackageCode,
  isOmExportAuthorized,
  isOmFinalExportPrepared,
  omCostTypeForTarget,
  omFinalExportTargetForRow,
  omTargetForCostType,
  validateOmFinalExportAttachments,
  validateOmFinalExportPackageScope
} from "./export-rules.js";
import {
  addOmHistory
} from "./history.js";
import {
  omBudgetPatch
} from "./pas-view.js";
import {
  selectedOmFinalExportRows
} from "./selection.js";
import {
  omSelections
} from "./state.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  HANDOFF_SENT_TO_BUYER,
  OM_PREPARING_EXPORT,
  OM_READY_FOR_CFA,
  OM_READY_FOR_ECS
} from "../workflow/status-constants.js";

// @legacy-unit 1745 22152
export function updateFinalExportTarget(rows, target) {
  if (!rows.length) {
    showToast(`Select at least one confirmed row before preparing ${target}.`, "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, `prepare ${target}`))) return;
  const invalidRows = rows.filter((row) => !isOmExportAuthorized(row) && !isOmFinalExportPrepared(row));
  if (invalidRows.length) {
    showToast("Only Requester confirmed or price-cleared rows can be prepared for CFA or ECS.", "error");
    return;
  }
  const scopeError = validateOmFinalExportPackageScope(rows);
  if (scopeError) {
    showToast(scopeError, "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const now = new Date();
  const packageCode = generateOmFinalExportPackageCode(rows, now);
  const nextStatus = target === "CFA" ? OM_READY_FOR_CFA : OM_READY_FOR_ECS;
  const costType = omCostTypeForTarget(target);
  replaceRequestsBinding(requests.map((row) => rows.some((selected) => selected.id === row.id) ? {
    ...row,
    ...omBudgetPatch(row),
    omSelected: false,
    omStage: "finalExport",
    omStatus: OM_PREPARING_EXPORT,
    paymentMethod: OM_PAYMENT_METHOD,
    finalExportCostType: costType,
    finalExportPackageCode: packageCode,
    finalExportPreparedAt: row.finalExportPreparedAt || now.toISOString(),
    finalExportTarget: target,
    finalExportStatus: nextStatus,
  } : row));
  rows.forEach((row) => {
    addOmHistory(row, `Marked for ${target}`, `${packageCode} prepared for ${target}.`);
    addHandoffHistory(row, `Marked for ${target}`, `${packageCode} prepared for ${target}.`);
  });
  omSelections.clear();
  renderOmPurchasing();
  showToast(`${packageCode} prepared for ${target}.`, "success");
}
// @end-legacy-unit 1745

// @legacy-unit 1746 22199
export function prepareOmFinalExport(target) {
  updateFinalExportTarget(selectedOmFinalExportRows(), target);
}
// @end-legacy-unit 1746

// @legacy-unit 1747 22203
export function prepareOmFinalExportCostType(costType, rows = selectedOmFinalExportRows()) {
  const target = omTargetForCostType(costType);
  if (!target) {
    showToast("Choose Expense or Capex before preparing the OM handoff.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, `prepare ${costType}`))) return;
  updateFinalExportTarget(rows, target);
}
// @end-legacy-unit 1747

// @legacy-unit 1748 22213
export function markOmFinalExportRowsExported(rows) {
  if (!rows.length) {
    showToast("No prepared row is available to submit handoff.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "mark export complete"))) return;
  const unprepared = rows.filter((row) => ![OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus));
  if (unprepared.length) {
    showToast("Choose Expense or Capex before submitting the handoff.", "error");
    return;
  }
  const scopeError = validateOmFinalExportPackageScope(rows);
  if (scopeError) {
    showToast(scopeError, "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const packageCode = generateOmFinalExportPackageCode(rows);
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((row) => {
    const selected = rows.find((item) => item.id === row.id);
    if (!selected) return row;
    const finalTarget = omFinalExportTargetForRow(selected);
    const finalStatus = finalTarget === "CFA" ? OM_EXPORTED_CFA : OM_EXPORTED_ECS;
    return {
      ...row,
      omSelected: false,
      omStage: "finalExport",
      omStatus: finalStatus,
      procurementStatus: HANDOFF_SENT_TO_BUYER,
      paymentMethod: OM_PAYMENT_METHOD,
      finalExportCostType: selected.finalExportCostType || omCostTypeForTarget(finalTarget),
      finalExportPackageCode: selected.finalExportPackageCode || packageCode,
      finalExportStatus: finalStatus,
      finalExportedAt: now,
      buyerStatus: row.buyerStatus || BUYER_RECEIVED,
      buyerReceivedAt: row.buyerReceivedAt || now,
    };
  }));
  rows.forEach((row) => {
    const finalTarget = omFinalExportTargetForRow(row);
    addOmHistory(row, `OM Handoff to ${finalTarget}`, `${row.finalExportPackageCode || packageCode} submitted to Buyer for PR creation.`);
    addHandoffHistory(row, `OM Handoff to ${finalTarget}`, `${row.finalExportPackageCode || packageCode} submitted to Buyer for PR creation.`);
  });
  omSelections.clear();
  renderOmPurchasing();
  renderBuyer();
  renderDepartment();
  showToast("Selected final export rows were handed to Buyer.", "success");
}
// @end-legacy-unit 1748

// @legacy-unit 1749 22268
export function markOmFinalExported() {
  markOmFinalExportRowsExported(selectedOmFinalExportRows());
}
// @end-legacy-unit 1749
