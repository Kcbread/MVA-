// om/row-actions: authoritative source; see docs/module-map.md.
import {
  OM_COST_TYPE_CAPEX,
  OM_COST_TYPE_EXPENSE
} from "../admin/state.js";
import {
  requests
} from "../demand/state.js";
import {
  exportOmExcelRows,
  exportOmPackageRows
} from "../exports/om.js";
import {
  ensureOmRowAccess
} from "./assignment.js";
import {
  markOmFinalExportRowsExported,
  prepareOmFinalExportCostType,
  updateFinalExportTarget
} from "./export-actions.js";
import {
  movePasRowsToQuoteCompletion,
  sendOmPasRowsToUserConfirm
} from "./pas-actions.js";
import {
  applyQuoteDbFromIntake,
  confirmOmQuoteResultRows,
  generatePasExcelForQuoteRow,
  markOmCentralItChecked,
  rejectOmRowsToDri,
  updateOmField
} from "./quote-actions.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1836 24455
export async function runOmRowAction(requestId, action) {
  const row = requests.find((item) => item.id === requestId);
  if (!row || !action) return;
  if (!ensureOmRowAccess(row, action)) return;
  if (action === "moveToQuoteCompletion") {
    const demandNoInput = document.querySelector(`[data-om-id="${requestId}"][data-om-field="pasDemandNo"]`);
    const typedDemandNo = demandNoInput ? demandNoInput.value.trim() : "";
    if (typedDemandNo && typedDemandNo !== row.pasDemandNo) {
      updateOmField(requestId, "pasDemandNo", typedDemandNo);
    }
  }
  if (action === "saveQuoteInfo") {
    if (!await confirmOmQuoteResultRows([row], { requireComplete: true })) return;
    renderOmPurchasing();
    showToast("Quote validated; generated PAS Excel attached; price and Quotation DB retention checks updated.", "success");
  }
  if (action === "generatePasExcel") {
    if (!await generatePasExcelForQuoteRow(row, { download: false })) return;
    renderOmPurchasing();
    showToast("PAS Excel generated and attached.", "success");
  }
  if (action === "centralItChecked") {
    markOmCentralItChecked(row);
  }
  if (action === "applyQuoteDbFromIntake") {
    applyQuoteDbFromIntake(row);
  }
  if (action === "moveToQuoteCompletion") {
    const latest = requests.find((item) => item.id === requestId) || row;
    movePasRowsToQuoteCompletion([latest]);
  }
  if (action === "sendToUserConfirm") {
    await sendOmPasRowsToUserConfirm([row]);
  }
  if (action === "rejectToDri") {
    rejectOmRowsToDri([row]);
  }
  if (action === "prepareCfa") {
    updateFinalExportTarget([row], "CFA");
  }
  if (action === "prepareEcs") {
    updateFinalExportTarget([row], "ECS");
  }
  if (action === "prepareExpense") {
    prepareOmFinalExportCostType(OM_COST_TYPE_EXPENSE, [row]);
  }
  if (action === "prepareCapex") {
    prepareOmFinalExportCostType(OM_COST_TYPE_CAPEX, [row]);
  }
  if (action === "exportExcel") {
    exportOmExcelRows([row]);
  }
  if (action === "exportPackage") {
    exportOmPackageRows([row]);
  }
  if (action === "markExported") {
    markOmFinalExportRowsExported([row]);
  }
}
// @end-legacy-unit 1836
