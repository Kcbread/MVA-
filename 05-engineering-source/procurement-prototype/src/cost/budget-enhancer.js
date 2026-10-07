// cost/budget-enhancer: authoritative source; see docs/module-map.md.
import {
  purchaseRecords
} from "../data/state.js";
import {
  QUOTE_EXPIRING_SOON_DAYS,
  STAGES
} from "../projects/config.js";
import {
  currentUserRole
} from "../session/state.js";
import {
  currentDeptTab,
  currentView
} from "../shell/state.js";

// @legacy-unit 1908 26878
export function initializeStep1908() {
(() => {
  const TEMP_BUDGET_STORAGE_KEY = "fihTemporaryBudgetMetaV1";
  const TEMP_BUDGET_DRAFT_KEY = "fihTemporaryBudgetDraftV1";
  const TEMP_BUDGET_APPROVAL_TEXT = "Temporary Budget Request";
  const tempBudgetUiState = loadTempBudgetDraftState();
  let pendingSubmitBudgetContext = null;
  let tempBudgetObserverInitialized = false;

  function normalizeBudgetText(value) {
    return String(value || "").trim();
  }

  function parseBudgetNumber(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const normalized = String(value || "").replace(/[^0-9.-]+/g, "");
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  function budgetMoneyFormatter(value) {
    if (typeof formatCurrency === "function") {
      try {
        return formatCurrency(value);
      } catch (error) {}
    }
    return `${Number(value || 0).toLocaleString("en-US")} VND`;
  }

  function escapeBudgetHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function loadTempBudgetDraftState() {
    try {
      const stored = JSON.parse(localStorage.getItem(TEMP_BUDGET_DRAFT_KEY) || "{}");
      return {
        requestType: stored.requestType === TEMP_BUDGET_APPROVAL_TEXT ? TEMP_BUDGET_APPROVAL_TEXT : "Standard Demand",
        estimatedUnitPrice: stored.estimatedUnitPrice || "",
        estimatedAmount: stored.estimatedAmount || "",
        estimateSource: stored.estimateSource || "",
        estimateDate: stored.estimateDate || "",
        budgetReason: stored.budgetReason || ""
      };
    } catch (error) {
      return {
        requestType: "Standard Demand",
        estimatedUnitPrice: "",
        estimatedAmount: "",
        estimateSource: "",
        estimateDate: "",
        budgetReason: ""
      };
    }
  }

  function saveTempBudgetDraftState() {
    try {
      localStorage.setItem(TEMP_BUDGET_DRAFT_KEY, JSON.stringify(tempBudgetUiState));
    } catch (error) {}
  }

  function loadTempBudgetMetaStore() {
    try {
      return JSON.parse(localStorage.getItem(TEMP_BUDGET_STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveTempBudgetMetaStore(store) {
    try {
      localStorage.setItem(TEMP_BUDGET_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {}
  }

  function recordItemName(record) {
    return normalizeBudgetText(record?.itemName || record?.item || record?.name);
  }

  function recordSpecName(record) {
    return normalizeBudgetText(record?.detailSpec || record?.detail || record?.spec || record?.description);
  }

  function recordRequestId(record) {
    return normalizeBudgetText(record?.requestId || record?.requestID || record?.id);
  }

  function recordProjectCode(record) {
    return normalizeBudgetText(record?.project || record?.projectCode || record?.yearProject);
  }

  function recordStatusValue(record) {
    return normalizeBudgetText(record?.status || record?.requestStatus || record?.approvalStatus || record?.currentStatus);
  }

  function recordTotalQuantity(record) {
    const direct = parseBudgetNumber(record?.totalQty || record?.qty || record?.quantity);
    if (direct > 0) return direct;
    const stages = Array.isArray(typeof STAGES !== "undefined" ? STAGES : []) ? STAGES : [];
    const stageTotal = stages.reduce((sum, stage) => sum + parseBudgetNumber(record?.[stage]), 0);
    return stageTotal;
  }

  function tempBudgetRecordKey(record) {
    return recordRequestId(record) || [recordProjectCode(record), recordItemName(record), recordSpecName(record)].filter(Boolean).join("::");
  }

  function ensureTempBudgetMeta(record) {
    if (!record) return null;
    if (!record.tempBudgetMeta) record.tempBudgetMeta = {};
    return record.tempBudgetMeta;
  }

  function writeTempBudgetMeta(record, meta) {
    if (!record || !meta) return;
    const target = ensureTempBudgetMeta(record);
    Object.assign(target, meta);
    record.requestType = meta.requestType || record.requestType || TEMP_BUDGET_APPROVAL_TEXT;
    record.estimatedUnitPrice = parseBudgetNumber(meta.estimatedUnitPrice || record.estimatedUnitPrice);
    record.estimatedAmount = parseBudgetNumber(meta.estimatedAmount || record.estimatedAmount);
    record.estimateSource = meta.estimateSource || record.estimateSource || "";
    record.estimateDate = meta.estimateDate || record.estimateDate || "";
    record.budgetReason = meta.budgetReason || record.budgetReason || "";
    if (!record.tempBudgetSubmittedAt && record.requestType === TEMP_BUDGET_APPROVAL_TEXT) {
      record.tempBudgetSubmittedAt = meta.tempBudgetSubmittedAt || new Date().toISOString();
    }
  }

  function hydrateTempBudgetMetaIntoRecords() {
    const store = loadTempBudgetMetaStore();
    const records = Array.isArray(typeof purchaseRecords !== "undefined" ? purchaseRecords : []) ? purchaseRecords : [];
    records.forEach((record) => {
      const key = tempBudgetRecordKey(record);
      if (!key || !store[key]) return;
      writeTempBudgetMeta(record, store[key]);
    });
  }

  function persistTempBudgetMeta(record, meta) {
    const key = tempBudgetRecordKey(record);
    if (!key) return;
    const store = loadTempBudgetMetaStore();
    store[key] = {
      ...(store[key] || {}),
      ...meta
    };
    saveTempBudgetMetaStore(store);
  }

  function actualAmountFromPo(record) {
    const candidates = [
      record?.actualAmount,
      record?.poActualAmount,
      record?.finalPoAmount,
      record?.buyerActualAmount,
      record?.poAmount,
      record?.poTotalAmount,
      record?.buyerPoAmount,
      record?.poIssuedAmount
    ];
    const resolved = candidates.map(parseBudgetNumber).find((value) => value > 0);
    if (resolved) return resolved;
    const hasPoTrace = [
      record?.poNo,
      record?.poNumber,
      record?.poIssuedAt,
      record?.buyerStatus,
      record?.externalStatus
    ].some((value) => /po|issued|completed|received/i.test(normalizeBudgetText(value)));
    if (!hasPoTrace) return 0;
    const unitPriceCandidates = [
      record?.actualUnitPrice,
      record?.poActualUnitPrice,
      record?.buyerPoUnitPrice,
      record?.unitPrice
    ];
    const derivedUnitPrice = unitPriceCandidates.map(parseBudgetNumber).find((value) => value > 0) || 0;
    const totalQty = recordTotalQuantity(record);
    return derivedUnitPrice > 0 && totalQty > 0 ? derivedUnitPrice * totalQty : 0;
  }

  function actualUnitPriceFromPo(record) {
    const direct = parseBudgetNumber(record?.actualUnitPrice || record?.poActualUnitPrice);
    if (direct > 0) return direct;
    const totalQty = recordTotalQuantity(record);
    const amount = actualAmountFromPo(record);
    return totalQty > 0 && amount > 0 ? amount / totalQty : 0;
  }

  function biddingAmountFromQuote(record) {
    const candidates = [
      record?.biddingAmount,
      record?.quoteAmount,
      record?.updatedPrice,
      record?.quotePrice,
      record?.unitPrice
    ];
    return candidates.map(parseBudgetNumber).find((value) => value > 0) || 0;
  }

  function quoteValiditySnapshot(record) {
    const validUntil = normalizeBudgetText(record?.quoteValidUntil || record?.tempBudgetMeta?.quoteValidUntil);
    const quoteReceivedAt = normalizeBudgetText(record?.quoteReceivedAt || record?.quoteDate || record?.tempBudgetMeta?.quoteReceivedAt);
    if (!validUntil) {
      return { validUntil: "", quoteReceivedAt, status: "Missing validity", daysRemaining: null };
    }
    const expiryDate = new Date(validUntil);
    if (Number.isNaN(expiryDate.getTime())) {
      return { validUntil, quoteReceivedAt, status: "Missing validity", daysRemaining: null };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
    if (daysRemaining < 0) return { validUntil, quoteReceivedAt, status: "Expired / Requote Required", daysRemaining };
    if (daysRemaining <= QUOTE_EXPIRING_SOON_DAYS) return { validUntil, quoteReceivedAt, status: "Expiring Soon", daysRemaining };
    return {
      validUntil,
      quoteReceivedAt,
      status: normalizeBudgetText(record?.quoteStatus || record?.tempBudgetMeta?.quoteStatus) || "Valid",
      daysRemaining
    };
  }

  function varianceSnapshot(record) {
    const estimate = parseBudgetNumber(record?.estimatedAmount);
    const bidding = biddingAmountFromQuote(record);
    const actual = actualAmountFromPo(record);
    const biddingVarianceAmount = bidding > 0 && estimate > 0 ? bidding - estimate : 0;
    const biddingVariancePercent = bidding > 0 && estimate > 0 ? biddingVarianceAmount / estimate : null;
    const poVarianceAmount = actual > 0 && estimate > 0 ? actual - estimate : 0;
    const poVariancePercent = actual > 0 && estimate > 0 ? poVarianceAmount / estimate : null;
    return {
      estimate,
      bidding,
      actual,
      biddingVarianceAmount,
      biddingVariancePercent,
      poVarianceAmount,
      poVariancePercent,
      varianceAmount: poVarianceAmount,
      variancePercent: poVariancePercent
    };
  }

  function isTempBudgetRecord(record) {
    return normalizeBudgetText(record?.requestType || record?.tempBudgetMeta?.requestType) === TEMP_BUDGET_APPROVAL_TEXT;
  }

  function tempBudgetDraftRoot() {
    if (currentView !== "department" || currentDeptTab !== "request") return null;
    return document.querySelector('[data-view="department"].active [data-dept-panel="request"].active')
      || document.querySelector('[data-view="department"].active [data-dept-panel="request"]');
  }

  function inferVisibleSelectedDraftKeys() {
    const root = tempBudgetDraftRoot();
    if (!root) return [];
    const rows = Array.from(root.querySelectorAll("table tr"));
    return rows
      .filter((row) => row.querySelector('input[type="checkbox"]:checked'))
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        return {
          item: normalizeBudgetText(cells[1]?.innerText || row.innerText.split("\n")[1] || ""),
          spec: normalizeBudgetText(cells[2]?.innerText || "")
        };
      })
      .filter((entry) => entry.item);
  }

  function currentBudgetMetaFromUi() {
    const estimatedUnitPrice = parseBudgetNumber(tempBudgetUiState.estimatedUnitPrice);
    const estimatedAmount = parseBudgetNumber(tempBudgetUiState.estimatedAmount);
    return {
      requestType: tempBudgetUiState.requestType,
      estimatedUnitPrice,
      estimatedAmount,
      estimateSource: normalizeBudgetText(tempBudgetUiState.estimateSource),
      estimateDate: normalizeBudgetText(tempBudgetUiState.estimateDate),
      budgetReason: normalizeBudgetText(tempBudgetUiState.budgetReason),
      tempBudgetSubmittedAt: new Date().toISOString()
    };
  }

  function applyPendingTempBudgetToSubmittedRecords() {
    if (!pendingSubmitBudgetContext) return;
    const records = Array.isArray(typeof purchaseRecords !== "undefined" ? purchaseRecords : []) ? purchaseRecords : [];
    const { meta, selectedKeys, project } = pendingSubmitBudgetContext;
    const targets = records.filter((record) => {
      if (recordProjectCode(record) !== project) return false;
      if (["Draft", "Rejected", "Cancelled", "Cancelled by Requester", "Cancelled by User A"].includes(recordStatusValue(record))) return false;
      if (!selectedKeys.length) return true;
      return selectedKeys.some((key) => recordItemName(record) === key.item || (recordItemName(record) === key.item && recordSpecName(record) === key.spec));
    });
    targets.forEach((record) => {
      writeTempBudgetMeta(record, meta);
      persistTempBudgetMeta(record, meta);
    });
    pendingSubmitBudgetContext = null;
  }

  function renderRequesterTempBudgetPanel() {
    if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
    const isRequesterRequestView = (currentUserRole || "") === "requester"
      && currentView === "department"
      && currentDeptTab === "request";
    if (!isRequesterRequestView) {
      document.querySelectorAll(".temp-budget-panel").forEach((panel) => panel.remove());
      return;
    }
    const departmentView = document.querySelector('[data-view="department"].active');
    if (!departmentView) {
      document.querySelectorAll(".temp-budget-panel").forEach((panel) => panel.remove());
      return;
    }
    const requestPanel = departmentView.querySelector('[data-dept-panel="request"]');
    if (!requestPanel) {
      document.querySelectorAll(".temp-budget-panel").forEach((panel) => panel.remove());
      return;
    }
    document.querySelectorAll(".temp-budget-panel").forEach((panel) => {
      if (!requestPanel.contains(panel)) panel.remove();
    });
    const duplicatePanels = Array.from(requestPanel.querySelectorAll(".temp-budget-panel"));
    duplicatePanels.slice(1).forEach((panel) => panel.remove());
    const anchor = requestPanel?.querySelector(".request-grid") || requestPanel;
    if (!anchor) return;
    let panel = duplicatePanels[0] && requestPanel.contains(duplicatePanels[0]) ? duplicatePanels[0] : requestPanel.querySelector(".temp-budget-panel");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "temp-budget-panel";
      anchor.insertAdjacentElement("beforebegin", panel);
    }
    const selectedDraftKeys = inferVisibleSelectedDraftKeys();
    const totalQtyHint = selectedDraftKeys.length;
    const derivedQty = tempBudgetSelectedDraftQty();
    const derivedAmount = tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT && parseBudgetNumber(tempBudgetUiState.estimatedUnitPrice) > 0 && derivedQty > 0
      ? parseBudgetNumber(tempBudgetUiState.estimatedUnitPrice) * derivedQty
      : 0;
    const effectiveAmount = parseBudgetNumber(tempBudgetUiState.estimatedAmount) || derivedAmount;
    panel.innerHTML = `
      <div class="temp-budget-panel__header">
        <div>
          <h3>Request Type</h3>
          <p>Temporary budget estimate 會跟著 submit 一路帶到 Dept DRI、Budget Approver 與 OM Purchasing。</p>
        </div>
        <span class="pill ${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "pill-warning" : ""}">${escapeBudgetHtml(tempBudgetUiState.requestType)}</span>
      </div>
      <div class="temp-budget-panel__grid">
        <label>
          Request Type
          <select id="tempBudgetRequestType">
            <option value="Standard Demand"${tempBudgetUiState.requestType === "Standard Demand" ? " selected" : ""}>Standard Demand</option>
            <option value="${TEMP_BUDGET_APPROVAL_TEXT}"${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? " selected" : ""}>${TEMP_BUDGET_APPROVAL_TEXT}</option>
          </select>
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Estimated Unit Price
          <input id="tempBudgetEstimatedUnitPrice" type="number" inputmode="decimal" value="${escapeBudgetHtml(tempBudgetUiState.estimatedUnitPrice)}" placeholder="VND" />
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Estimated Amount
          <input id="tempBudgetEstimatedAmount" type="number" inputmode="decimal" value="${escapeBudgetHtml(tempBudgetUiState.estimatedAmount)}" placeholder="VND" />
          ${derivedAmount > 0 ? `<small class="temp-budget-panel__hint">Auto suggestion from selected qty ${derivedQty}: ${escapeBudgetHtml(budgetMoneyFormatter(derivedAmount))}</small>` : ""}
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Price Source
          <input id="tempBudgetEstimateSource" type="text" value="${escapeBudgetHtml(tempBudgetUiState.estimateSource)}" placeholder="Marketplace / website / rough vendor quote" />
        </label>
        <label class="${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
          Estimate Date
          <input id="tempBudgetEstimateDate" type="date" value="${escapeBudgetHtml(tempBudgetUiState.estimateDate)}" />
        </label>
      </div>
      <label class="temp-budget-panel__reason ${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? "" : "is-hidden"}" data-temp-budget-field>
        Budget Reason
        <textarea id="tempBudgetReason" rows="2" placeholder="Why does this temporary budget request need pre-approval?">${escapeBudgetHtml(tempBudgetUiState.budgetReason)}</textarea>
      </label>
      <p class="temp-budget-panel__footnote">${tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT ? `Applied to selected draft rows on submit${totalQtyHint ? ` • ${totalQtyHint} selected row(s)` : ""}${effectiveAmount ? ` • current estimate ${escapeBudgetHtml(budgetMoneyFormatter(effectiveAmount))}` : ""}.` : "Standard Demand keeps the normal request flow."}</p>
    `;
    panel.querySelector("#tempBudgetRequestType")?.addEventListener("change", (event) => {
      tempBudgetUiState.requestType = event.target.value || "Standard Demand";
      saveTempBudgetDraftState();
      renderRequesterTempBudgetPanel();
    });
    [
      ["#tempBudgetEstimatedUnitPrice", "estimatedUnitPrice"],
      ["#tempBudgetEstimatedAmount", "estimatedAmount"],
      ["#tempBudgetEstimateSource", "estimateSource"],
      ["#tempBudgetEstimateDate", "estimateDate"],
      ["#tempBudgetReason", "budgetReason"]
    ].forEach(([selector, key]) => {
      panel.querySelector(selector)?.addEventListener("input", (event) => {
        tempBudgetUiState[key] = event.target.value || "";
        if (key === "estimatedUnitPrice" && !parseBudgetNumber(tempBudgetUiState.estimatedAmount)) {
          const qty = tempBudgetSelectedDraftQty();
          if (qty > 0) {
            tempBudgetUiState.estimatedAmount = String(parseBudgetNumber(event.target.value) * qty || "");
          }
        }
        saveTempBudgetDraftState();
        renderRequesterTempBudgetPanel();
      });
    });
  }

  function tempBudgetSelectedDraftQty() {
    const root = tempBudgetDraftRoot();
    if (!root) return 0;
    const rows = Array.from(root.querySelectorAll("table tr"));
    const activeRows = rows.filter((row) => row.querySelector('input[type="checkbox"]:checked'));
    const qtyFromDom = activeRows.reduce((sum, row) => {
      const text = normalizeBudgetText(row.innerText);
      const totalMatch = text.match(/Total\s+Qty\s+(\d+)/i) || text.match(/\b(\d+)\s+pcs\b/i);
      if (totalMatch) return sum + parseBudgetNumber(totalMatch[1]);
      return sum;
    }, 0);
    if (qtyFromDom > 0) return qtyFromDom;
    return activeRows.reduce((sum, row) => {
      const key = inferVisibleSelectedDraftKeys().find((entry) => row.innerText.includes(entry.item));
      if (!key) return sum;
      return sum;
    }, 0);
  }

  function findRecordByRequestId(requestId) {
    const records = Array.isArray(typeof purchaseRecords !== "undefined" ? purchaseRecords : []) ? purchaseRecords : [];
    return records.find((record) => recordRequestId(record) === requestId) || null;
  }

  function tempBudgetDetailBlockHtml(record) {
    const variance = varianceSnapshot(record);
    const validity = quoteValiditySnapshot(record);
    return `
      <section class="temp-budget-detail-block">
        <div class="temp-budget-detail-block__head">
          <h3>Temporary Budget Tracking</h3>
          <span class="pill pill-warning">${TEMP_BUDGET_APPROVAL_TEXT}</span>
        </div>
        <div class="temp-budget-detail-block__grid">
          <div><span>Estimated Unit Price</span><strong>${record.estimatedUnitPrice ? budgetMoneyFormatter(record.estimatedUnitPrice) : "Pending"}</strong></div>
          <div><span>Estimated Amount</span><strong>${record.estimatedAmount ? budgetMoneyFormatter(record.estimatedAmount) : "Pending"}</strong></div>
          <div><span>Price Source</span><strong>${escapeBudgetHtml(record.estimateSource || "Pending")}</strong></div>
          <div><span>Estimate Date</span><strong>${escapeBudgetHtml(record.estimateDate || "Pending")}</strong></div>
          <div><span>Bidding Amount</span><strong>${variance.bidding ? budgetMoneyFormatter(variance.bidding) : "Pending bidding"}</strong></div>
          <div><span>Bidding Variance</span><strong>${variance.bidding ? `${variance.biddingVarianceAmount >= 0 ? "+" : ""}${budgetMoneyFormatter(variance.biddingVarianceAmount)}${variance.biddingVariancePercent !== null ? ` (${(variance.biddingVariancePercent * 100).toFixed(1)}%)` : ""}` : "Pending bidding"}</strong></div>
          <div><span>PO Actual</span><strong>${variance.actual ? budgetMoneyFormatter(variance.actual) : "Pending PO"}</strong></div>
          <div><span>PO Variance</span><strong>${variance.actual ? `${variance.varianceAmount >= 0 ? "+" : ""}${budgetMoneyFormatter(variance.varianceAmount)}${variance.variancePercent !== null ? ` (${(variance.variancePercent * 100).toFixed(1)}%)` : ""}` : "Pending PO"}</strong></div>
          <div><span>Quote Date</span><strong>${escapeBudgetHtml(validity.quoteReceivedAt || "Pending")}</strong></div>
          <div><span>Quote Valid Until</span><strong>${escapeBudgetHtml(validity.validUntil || "Pending")}</strong></div>
          <div><span>Expiry Status</span><strong>${escapeBudgetHtml(validity.status)}</strong></div>
        </div>
        ${record.budgetReason ? `<p class="temp-budget-detail-block__reason"><strong>Budget Reason</strong> ${escapeBudgetHtml(record.budgetReason)}</p>` : ""}
      </section>
    `;
  }

  function enhanceTempBudgetDetailModals() {
    const modal = document.querySelector(".modal-card, .detail-modal, .modal-content");
    if (!modal || modal.querySelector(".temp-budget-detail-block")) return;
    const text = normalizeBudgetText(modal.innerText);
    const requestIdMatch = text.match(/REQ[-–][A-Z0-9-]+/i);
    if (!requestIdMatch) return;
    const record = findRecordByRequestId(requestIdMatch[0]);
    if (!record || !isTempBudgetRecord(record)) return;
    const anchor = modal.querySelector("table, .detail-grid, .modal-actions, .history-list") || modal.lastElementChild;
    if (!anchor) return;
    anchor.insertAdjacentHTML("beforebegin", tempBudgetDetailBlockHtml(record));
  }

  function onDocumentClickCapture(event) {
    const button = event.target?.closest?.("button");
    if (!button) return;
    const label = normalizeBudgetText(button.innerText).toLowerCase();
    if ((currentUserRole === "requester" || currentUserRole === "admin") && label.includes("submit") && tempBudgetUiState.requestType === TEMP_BUDGET_APPROVAL_TEXT) {
      const projectSelect = document.querySelector('select[name="project"], #projectSelect, #projectFilter') || document.querySelector("select");
      pendingSubmitBudgetContext = {
        meta: currentBudgetMetaFromUi(),
        project: normalizeBudgetText(projectSelect?.value || projectSelect?.selectedOptions?.[0]?.textContent || ""),
        selectedKeys: inferVisibleSelectedDraftKeys()
      };
      window.setTimeout(applyPendingTempBudgetToSubmittedRecords, 800);
    }
  }

  function installTemporaryBudgetStyles() {
    if (document.getElementById("temporary-budget-inline-style")) return;
    const style = document.createElement("style");
    style.id = "temporary-budget-inline-style";
    style.textContent = `
      .temp-budget-panel{margin:18px 0;padding:18px;border:1px solid #c6d6e4;background:#fff7ea}
      .temp-budget-panel__header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
      .temp-budget-panel__header h3{margin:0 0 4px}
      .temp-budget-panel__header p{margin:0;color:#6a5d49}
      .temp-budget-panel__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:14px}
      .temp-budget-panel label,.temp-budget-panel__reason{display:grid;gap:6px;font-size:12px;font-weight:700;color:#5b4d39;text-transform:uppercase;letter-spacing:.04em}
      .temp-budget-panel input,.temp-budget-panel select,.temp-budget-panel textarea{font-size:14px;padding:10px 12px}
      .temp-budget-panel__hint{display:block;font-size:11px;color:#7a694c;font-weight:600;text-transform:none;letter-spacing:0}
      .temp-budget-panel__reason{margin-top:12px}
      .temp-budget-panel__footnote{margin:12px 0 0;color:#6a5d49;font-size:13px}
      .temp-budget-panel .is-hidden{display:none}
      .temp-budget-detail-block{margin:14px 0;padding:14px;border:1px solid #e8d1a5;background:#fffaf1}
      .temp-budget-detail-block__head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}
      .temp-budget-detail-block__head h3{margin:0;font-size:18px}
      .temp-budget-detail-block__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .temp-budget-detail-block__grid span{display:block;font-size:11px;text-transform:uppercase;color:#7a694c}
      .temp-budget-detail-block__grid strong{display:block;font-size:13px;color:#17324d}
      .temp-budget-detail-block__reason{margin:10px 0 0;color:#5b4d39}
      .pill-warning{background:#fce6ba;color:#7a5414}
      @media (max-width: 1100px){
        .temp-budget-panel__grid,.temp-budget-detail-block__grid{grid-template-columns:1fr 1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function initTemporaryBudgetEnhancer() {
    if (tempBudgetObserverInitialized) return;
    tempBudgetObserverInitialized = true;
    hydrateTempBudgetMetaIntoRecords();
    installTemporaryBudgetStyles();
    window.renderRequesterTempBudgetPanel = renderRequesterTempBudgetPanel;
    document.addEventListener("click", onDocumentClickCapture, true);
    window.setTimeout(() => {
      if (typeof window.cleanupTemporaryBudgetLeakage === "function") window.cleanupTemporaryBudgetLeakage();
      renderRequesterTempBudgetPanel();
    }, 300);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTemporaryBudgetEnhancer, { once: true });
  } else {
    initTemporaryBudgetEnhancer();
  }
})();
}
// @end-legacy-unit 1908
