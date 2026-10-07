// cost/exchange-rate-view: authoritative source; see docs/module-map.md.
import {
  adminRoleGuards
} from "../admin/permissions.js";
import {
  OM_EXCHANGE_RATE_VND_USD
} from "../admin/state.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  activeExchangeRateMonth,
  exchangeRateRecord
} from "./currency.js";
import {
  monthlyExchangeRates,
  replaceMonthlyExchangeRatesBinding
} from "./state.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  currentOmUserId,
  selectedOmOperator
} from "../om/assignment.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  isOmLeaderRole
} from "../session/permissions.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1359 16402
export function renderOmExchangeRatePanel() {
  const monthInput = document.getElementById("omExchangeRateMonth");
  const rateInput = document.getElementById("omExchangeRateValue");
  const status = document.getElementById("omRateStatus");
  const saveButton = document.querySelector("[data-action='saveOmExchangeRate']");
  if (!monthInput || !rateInput) return;
  const record = exchangeRateRecord();
  const canMaintainRate = canMaintainOmExchangeRate();
  monthInput.value = record.exchangeRateMonth || activeExchangeRateMonth();
  rateInput.value = record.usdToVndRate || OM_EXCHANGE_RATE_VND_USD;
  rateInput.disabled = !canMaintainRate;
  monthInput.disabled = !canMaintainRate;
  if (saveButton) saveButton.disabled = !canMaintainRate;
  if (status) {
    status.textContent = record.isFallback ? "Fallback Rate" : "Active Rate";
    status.title = record.isFallback
      ? `Using system fallback rate: ${OM_EXCHANGE_RATE_VND_USD.toLocaleString("en-US")} VND`
      : `Updated by ${record.rateUpdatedBy || "OM Leader"}${record.rateUpdatedAt ? ` at ${compactDateTime(record.rateUpdatedAt)}` : ""}`;
    status.className = `status-pill ${record.isFallback ? "warning" : "approved"}`;
  }
}
// @end-legacy-unit 1359

// @legacy-unit 1360 16424
export function canMaintainOmExchangeRate() {
  return adminRoleGuards()?.canMaintainExchangeRate?.(currentRole, currentOmUserId())
    || isOmLeaderRole()
    || currentOmUserId() === "om-member-giang";
}
// @end-legacy-unit 1360

// @legacy-unit 1367 16543
export function saveOmExchangeRate() {
  if (!canMaintainOmExchangeRate()) {
    showToast("Only Giang, Mai override, or Admin can update monthly rate.", "error");
    return;
  }
  const month = document.getElementById("omExchangeRateMonth")?.value || activeExchangeRateMonth();
  const rate = clampQty(document.getElementById("omExchangeRateValue")?.value || 0);
  if (!month || !rate) {
    showToast("Month and USD to VND rate are required.", "error");
    return;
  }
  const patch = {
    exchangeRateMonth: month,
    usdToVndRate: rate,
    rateUpdatedBy: currentRole === "omMember" ? selectedOmOperator()?.name || "OM Purchasing" : roleProfiles[currentRole]?.name || "OM",
    rateUpdatedAt: new Date().toISOString(),
    isFallback: false,
  };
  replaceMonthlyExchangeRatesBinding([patch, ...monthlyExchangeRates.filter((row) => row.exchangeRateMonth !== month)]);
  renderOmPurchasing();
  renderManager();
  showToast(`Exchange rate saved: 1 USD = ${rate.toLocaleString("en-US")} VND.`, "success");
}
// @end-legacy-unit 1367
