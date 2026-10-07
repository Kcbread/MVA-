// admin/import-view: authoritative source; see docs/module-map.md.
import {
  pasDemandRequirementMasterRows
} from "./permissions.js";
import {
  adminApprovalSetup
} from "./state.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1801 23516
export function renderSapPoRawImportPanel() {
  const state = adminApprovalSetup.sapPoRawImport || {};
  const status = state.status || {};
  const preview = state.preview || null;
  const receipt = state.receipt || null;
  const dbStatus = document.getElementById("sapPoRawImportDbStatus");
  const workbookPath = document.getElementById("sapPoRawWorkbookPath");
  const summary = document.getElementById("sapPoRawImportSummary");
  const rowsTarget = document.getElementById("sapPoRawImportRows");
  const messages = document.getElementById("sapPoRawImportMessages");
  if (dbStatus) {
    dbStatus.textContent = status.mysql_config_present ? "UAT DB ready" : "Preview only: DB env missing";
    dbStatus.className = `status-pill ${status.mysql_config_present ? "status-ok" : "status-warning"}`;
  }
  if (workbookPath && !workbookPath.value && status.workbook_path) workbookPath.value = status.workbook_path;
  if (summary) {
    const omCount = preview?.scope_counts?.om_scope ?? "-";
    const mfgCount = preview?.scope_counts?.mfg_buy ?? "-";
    summary.innerHTML = [
      `<div class="summary-card"><span>Workbook</span><strong>${htmlText(preview?.source_file_name || status.workbook_path?.split("/").pop() || "-")}</strong><small>${status.workbook_exists === false ? "File missing" : "Raw Data A-BN"}</small></div>`,
      `<div class="summary-card"><span>Selected Rows</span><strong>${htmlText(preview?.selected_row_count ?? "-")}</strong><small>${htmlText(preview?.scope_mode || "yellow-only")}</small></div>`,
      `<div class="summary-card"><span>OM Scope</span><strong>${htmlText(omCount)}</strong><small>Excel yellow fill</small></div>`,
      `<div class="summary-card"><span>MFG Buy</span><strong>${htmlText(mfgCount)}</strong><small>Non-yellow in full import</small></div>`,
      `<div class="summary-card"><span>Warnings / Errors</span><strong>${htmlText(`${preview?.warnings?.length || 0} / ${preview?.errors?.length || 0}`)}</strong><small>${receipt ? `Committed ${receipt.inserted_lines || 0}` : "Preview gate"}</small></div>`,
    ].join("");
  }
  if (rowsTarget) {
    const sampleRows = preview?.sample_rows || [];
    rowsTarget.innerHTML = sampleRows.length ? sampleRows.map((row) => `
      <tr>
        <td>${htmlText(row.source_row_number || "-")}</td>
        <td><span class="status-pill ${row.buy_scope === "om_scope" ? "status-ok" : "info"}">${htmlText(row.buy_scope || "-")}</span></td>
        <td>${htmlText(row.factory_material_no || "-")}</td>
        <td>${htmlText(row.sap_material_no || "-")}</td>
        <td>${htmlText(row.ftv_code || "-")}</td>
        <td>${htmlText(row.normalized_item_name || "-")}</td>
        <td>${htmlText([row.lv1, row.lv2, row.lv3].filter(Boolean).join(" / ") || "-")}</td>
        <td>${htmlText(row.expected_factory_prefix || "-")}</td>
      </tr>`).join("") : `<tr><td colspan="8" class="muted">Run preview to load SAP PO Raw sample rows.</td></tr>`;
  }
  if (messages) {
    const errors = (preview?.errors || []).slice(0, 5).map((item) => `Error row ${item.row || "-"}: ${item.code || ""} ${item.message || ""}`);
    const warnings = (preview?.warnings || []).slice(0, 5).map((item) => `Warning row ${item.row || "-"}: ${item.code || ""} ${item.message || ""}`);
    messages.textContent = [...errors, ...warnings].join("\n");
  }
}
// @end-legacy-unit 1801

// @legacy-unit 1802 23563
export function renderAdminPasDemandRequirementMaster() {
  const target = document.getElementById("adminPasDemandRequirementMasterRows");
  if (!target) return;
  const rows = pasDemandRequirementMasterRows();
  target.innerHTML = rows.length ? rows.map((row) => `
    <tr data-admin-pas-demand-master="${htmlAttr(row.id)}">
      <td><strong>${htmlText(row.itemCategory || row.id)}</strong><div class="muted">${htmlText(row.id)}</div></td>
      <td>${htmlText(row.matchKeywords.map((keyword) => String(keyword).trim()).filter(Boolean).join(", "))}</td>
      <td><span class="status-pill ${row.pasDemandRequired ? "status-warning" : "info"}">${row.pasDemandRequired ? "Required" : "Optional"}</span></td>
      <td><span class="status-pill ${row.active ? "status-ok" : "neutral"}">${row.active ? "Active" : "Inactive"}</span></td>
      <td>${htmlText(row.ownerRole || "OM Purchasing")}</td>
      <td class="cell-note-summary" title="${htmlAttr(row.note)}">${htmlText(row.note)}</td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty-cell">No PAS Demand Requirement Master records.</td></tr>`;
}
// @end-legacy-unit 1802

// @legacy-unit 1803 23578
export async function refreshSapPoRawImportStatus({ silent = false } = {}) {
  if (!apiModeEnabled()) {
    if (!silent) showToast("SAP PO Raw import status requires server API mode.", "error");
    return;
  }
  try {
    const status = await apiRequest("/api/admin/sap-po-raw-import/status");
    adminApprovalSetup.sapPoRawImport = { ...(adminApprovalSetup.sapPoRawImport || {}), status };
    renderSapPoRawImportPanel();
    if (!silent) showToast("SAP PO Raw import status refreshed.", "success");
  } catch (error) {
    if (!silent) showToast(error.message, "error");
  }
}
// @end-legacy-unit 1803

// @legacy-unit 1804 23593
export async function previewSapPoRawImportFromForm() {
  if (!apiModeEnabled()) {
    showToast("SAP PO Raw preview requires server API mode.", "error");
    return;
  }
  const payload = {
    workbookPath: document.getElementById("sapPoRawWorkbookPath")?.value.trim() || "",
    sheetName: document.getElementById("sapPoRawSheetName")?.value.trim() || "Raw Data",
    scopeMode: document.getElementById("sapPoRawScopeMode")?.value || "yellow-only",
  };
  try {
    const result = await apiRequest("/api/admin/sap-po-raw-import/preview", { method: "POST", body: payload });
    adminApprovalSetup.sapPoRawImport = { ...(adminApprovalSetup.sapPoRawImport || {}), preview: result.preview, receipt: null };
    renderSapPoRawImportPanel();
    showToast(`Previewed ${result.preview?.selected_row_count || 0} SAP PO Raw rows.`, result.preview?.errors?.length ? "info" : "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}
// @end-legacy-unit 1804

// @legacy-unit 1805 23613
export async function commitSapPoRawImportFromPreview() {
  if (!apiModeEnabled()) {
    showToast("SAP PO Raw commit requires server API mode.", "error");
    return;
  }
  const preview = adminApprovalSetup.sapPoRawImport?.preview;
  if (!preview?.id) {
    showToast("Run SAP PO Raw preview before commit.", "error");
    return;
  }
  if (preview.errors?.length) {
    showToast("Fix SAP PO Raw preview errors before commit.", "error");
    return;
  }
  try {
    const result = await apiRequest("/api/admin/sap-po-raw-import/commit", { method: "POST", body: { previewId: preview.id } });
    adminApprovalSetup.sapPoRawImport = { ...(adminApprovalSetup.sapPoRawImport || {}), receipt: result.receipt };
    renderSapPoRawImportPanel();
    showToast(`Committed ${result.receipt?.inserted_lines || 0} SAP PO Raw rows to UAT.`, "success");
  } catch (error) {
    showToast(error.message, "error");
  }
}
// @end-legacy-unit 1805
