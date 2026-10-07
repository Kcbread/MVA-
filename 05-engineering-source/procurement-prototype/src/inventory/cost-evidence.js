// inventory/cost-evidence: authoritative source; see docs/module-map.md.
import {
  amountUsdFromVnd,
  formatCompactCurrencyFromUsd,
  formatMoneyFromUsd
} from "../cost/currency.js";
import {
  normalizeQuantityDashboardUnit
} from "../cost/quantity-filters.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  QUANTITY_DASHBOARD_UNITS,
  STAGE_LABELS,
  STATION_MASTER
} from "../projects/config.js";
import {
  compactDateTime
} from "../shared/dates.js";
import {
  normalize
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 733 6171
export function managerCarryoverRows() {
  return window.ProcurementCarryover?.readLedger?.() || [];
}
// @end-legacy-unit 733

// @legacy-unit 734 6175
export function managerCarryoverEventUnit(row) {
  const value = normalizeQuantityDashboardUnit(row.stationOrUnit);
  if (QUANTITY_DASHBOARD_UNITS.includes(value)) return value;
  if (STATION_MASTER.includes(row.stationOrUnit)) return "MFG";
  return value || "MFG";
}
// @end-legacy-unit 734

// @legacy-unit 735 6182
export function managerCarryoverPhaseKey(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_.-]+/g, "");
  const phaseAlias = {
    p10: "p10",
    p11: "p11",
    evt: "evt",
    dvt: "dvt",
    pvt: "pvt",
    mp: "mp",
  };
  return phaseAlias[normalized] || "";
}
// @end-legacy-unit 735

// @legacy-unit 736 6198
export function managerCarryoverIsApplied(row) {
  return row?.status === "Applied" && row?.reviewStatus !== "Pending DRI" && row?.reviewStatus !== "Pending Dept DRI";
}
// @end-legacy-unit 736

// @legacy-unit 737 6202
export function managerCarryoverNeedsDriReview(row) {
  return row?.reviewStatus === "Pending DRI"
    || row?.reviewStatus === "Pending Dept DRI"
    || row?.status === "Requester Candidate"
    || row?.status === "Carryover Candidate"
    || row?.status === "Requester Applied"
    || row?.status === "User Applied"
    || row?.status === "Pending DRI";
}
// @end-legacy-unit 737

// @legacy-unit 738 6212
export function managerCarryoverStatusBucket(rows = []) {
  if (rows.some(managerCarryoverIsApplied)) return "applied";
  if (rows.some(managerCarryoverNeedsDriReview)) return "pending-dri";
  if (rows.some((row) => row.status === "Pending Review" || row.status === "Pending DRI" || row.reviewStatus === "Pending DRI")) return "pending";
  if (rows.some((row) => row.status === "Rejected")) return "rejected";
  return "";
}
// @end-legacy-unit 738

// @legacy-unit 739 6220
export function managerCarryoverMatchesScope(row, { project = "", requestLine = "", phase = "", item = "", unit = "" } = {}) {
  if (project && row.project !== project) return false;
  if (requestLine) {
    const targetLine = String(row.targetLine || row.requestLine || row.line || "").trim();
    if (targetLine !== requestLine) return false;
  }
  if (phase && managerCarryoverPhaseKey(row.phase) !== managerCarryoverPhaseKey(phase)) return false;
  if (item && normalize(row.item) !== normalize(item)) return false;
  if (unit && managerCarryoverEventUnit(row) !== unit) return false;
  return true;
}
// @end-legacy-unit 739

// @legacy-unit 740 6232
export function managerCarryoverRowsForScope(scope = {}, includePending = true) {
  return managerCarryoverRows().filter((row) => {
    if (!includePending && !managerCarryoverIsApplied(row)) return false;
    return managerCarryoverMatchesScope(row, scope);
  });
}
// @end-legacy-unit 740

// @legacy-unit 741 6239
export function managerCarryoverQtyForScope(scope = {}) {
  return managerCarryoverRowsForScope(scope, false)
    .reduce((sum, row) => sum + clampQty(row.carryoverQty), 0);
}
// @end-legacy-unit 741

// @legacy-unit 742 6244
export function managerCarryoverFlowLabels(rows = []) {
  return [...new Set(rows.map((row) => `${row.sourceLine || "Line"} → ${row.targetLine || "Line"}`))]
    .filter(Boolean);
}
// @end-legacy-unit 742

// @legacy-unit 756 6422
export function managerCarryoverMovedItemsSummary(rows) {
  const activeRows = rows
    .filter((row) => row.status !== "Rejected")
    .sort((a, b) => managerCarryoverIsApplied(b) - managerCarryoverIsApplied(a));
  const visibleRows = activeRows.slice(0, 3);
  const overflowCount = Math.max(0, activeRows.length - visibleRows.length);
  return {
    html: visibleRows.length ? visibleRows.map((row) => {
      const flow = `${row.sourceLine || "-"} → ${row.targetLine || "-"}`;
      const qty = clampQty(row.carryoverQty);
      const status = managerCarryoverStatusLabel(row.reviewStatus === "Pending DRI" || row.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : row.status);
      const full = `${row.item || "Item"} / ${flow} / -${qty} qty / ${status}`;
      return `
        <span class="line-compare-moved-item" title="${htmlAttr(full)}">
          <strong>${htmlText(row.item || "Item")}</strong>
          <small>${htmlText(flow)} · -${qty} qty</small>
        </span>`;
    }).join("") : `<span class="muted">No moved item in this scope</span>`,
    footer: overflowCount ? `+${overflowCount} more in ledger` : "Full trace in ledger",
  };
}
// @end-legacy-unit 756

// @legacy-unit 758 6486
export function managerCarryoverStatusLabel(status) {
  if (status === "Requester Applied" || status === "User Applied" || status === "Requester Candidate" || status === "Carryover Candidate") return "Pending Dept DRI";
  if (status === "Applied") return "Applied";
  if (status === "Rejected") return "Rejected";
  if (status === "Pending DRI" || status === "Pending Dept DRI") return "Pending Dept DRI";
  return "Pending Dept DRI";
}
// @end-legacy-unit 758

// @legacy-unit 759 6494
export function managerCarryoverStatusClass(status) {
  if (status === "Applied") return "status-pill approved";
  if (status === "Requester Applied" || status === "User Applied" || status === "Requester Candidate" || status === "Carryover Candidate" || status === "Pending DRI" || status === "Pending Dept DRI") return "status-pill warning";
  if (status === "Rejected") return "status-pill rejected";
  return "status-pill submitted";
}
// @end-legacy-unit 759

// @legacy-unit 760 6501
export function managerCarryoverCostSaving(row) {
  if (!managerCarryoverIsApplied(row)) return 0;
  const originalQty = clampQty(row.originalQty);
  const requestedCarryoverQty = clampQty(row.carryoverQty);
  const carryoverQty = originalQty > 0 ? Math.min(originalQty, requestedCarryoverQty) : requestedCarryoverQty;
  const unitPriceUsd = Number(row.unitPriceUsd || 0) || amountUsdFromVnd(clampQty(row.unitPrice));
  return carryoverQty * unitPriceUsd;
}
// @end-legacy-unit 760

// @legacy-unit 761 6510
export function renderManagerCarryoverLedger(containerId, filters = {}, item = "") {
  const container = document.getElementById(containerId);
  if (!container) return;
  const rows = managerCarryoverRowsForScope({
    project: filters.project || "",
    requestLine: filters.requestLine || "",
    phase: filters.phase || "",
    item,
  }, true);
  const ledgerCols = 7;
  container.innerHTML = `
    <div class="carryover-ledger-head">
      <div>
        <h4>Carryover Ledger</h4>
        <p class="muted">Line-to-line traceability is always visible. Only Dept DRI approved rows reduce effective cost; requester candidates stay visible but are not counted.</p>
      </div>
      <span class="status-pill info">${filters.phase ? STAGE_LABELS[filters.phase] : "All stages"}</span>
    </div>
    <div class="table-wrap table-shell carryover-ledger-wrap">
      <table class="data-table table-fixed workflow-table carryover-ledger-table">
        <thead>
          <tr>
            <th>Flow</th>
            <th>Item</th>
            <th>Phase / Unit</th>
            <th>Qty Saved</th>
            <th>Cost Saving</th>
            <th>Status</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length ? rows.map((row) => {
            const cappedCarryover = Math.min(clampQty(row.originalQty), clampQty(row.carryoverQty));
            const effectiveQty = Math.max(0, clampQty(row.originalQty) - (managerCarryoverIsApplied(row) ? cappedCarryover : 0));
            const detailTitle = [
              `${row.sourceLine} -> ${row.targetLine}`,
              `Original ${clampQty(row.originalQty)}`,
              `Carryover ${cappedCarryover}`,
              `Effective ${effectiveQty}`,
              row.sourceProject ? `Source ${row.sourceProject}` : "",
              row.targetProject ? `Target ${row.targetProject}` : "",
              row.confirmedBy ? `By ${row.confirmedBy}` : "",
              row.confirmedAt ? compactDateTime(row.confirmedAt) : "",
            ].filter(Boolean).join(" / ");
            return `
            <tr>
              <td class="cell-identity" title="${htmlAttr(detailTitle)}">${row.sourceLine} → ${row.targetLine}</td>
              <td class="cell-identity" title="${htmlAttr(row.item)}">${row.item}</td>
              <td class="cell-identity">${STAGE_LABELS[row.phase] || row.phase}<div class="reason-text">${htmlText(row.stationOrUnit || "-")}</div></td>
              <td class="cell-number" title="${htmlAttr(detailTitle)}">${managerCarryoverIsApplied(row) ? `-${cappedCarryover}` : cappedCarryover ? `${cappedCarryover} pending` : "-"}</td>
              <td class="cell-number" title="${htmlAttr(formatMoneyFromUsd(managerCarryoverCostSaving(row)))}">${managerCarryoverIsApplied(row) ? `-${formatCompactCurrencyFromUsd(managerCarryoverCostSaving(row))}` : managerCarryoverNeedsDriReview(row) ? "Pending, not counted" : "-"}</td>
              <td><span class="${managerCarryoverStatusClass(row.reviewStatus === "Pending DRI" || row.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : row.status)}">${managerCarryoverStatusLabel(row.reviewStatus === "Pending DRI" || row.reviewStatus === "Pending Dept DRI" ? "Pending Dept DRI" : row.status)}</span></td>
              <td class="cell-audit-reason" title="${htmlAttr(row.reason || "-")}"><div class="audit-reason-text">${htmlText(row.reason)}</div></td>
            </tr>`;
          }).join("") : `<tr><td colspan="${ledgerCols}" class="empty-cell">No carryover ledger rows match this scope.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}
// @end-legacy-unit 761

export function replaceManagerCarryoverCostSavingBinding(value) { managerCarryoverCostSaving = value; return value; }
