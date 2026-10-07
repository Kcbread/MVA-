// exports/pas: authoritative source; see docs/module-map.md.
import {
  totalQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  createXlsxBlob,
  downloadBlob,
  downloadFile
} from "./workbook.js";
import {
  apiModeEnabled
} from "../infrastructure/api.js";
import {
  uploadAttachment
} from "../infrastructure/attachments.js";
import {
  omBusinessFlowModule
} from "../infrastructure/module-adapters.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  applyOmResponsibility
} from "../om/ownership.js";
import {
  omPurposeLocations,
  pasBrand,
  pasDataTransferTo,
  pasDemandDate,
  pasLegalName,
  pasPartName,
  pasRequestDept,
  pasSpec
} from "../om/pas-view.js";
import {
  omPurchaseReason,
  omUnit
} from "../om/pricing.js";
import {
  selectedOmProjectPackage
} from "../om/quote-actions.js";
import {
  selectedOmPasRequestRows,
  selectedOmPasResultRows
} from "../om/selection.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  requiredDeliveryDateForProject,
  stageDateForProject
} from "../projects/calendar.js";
import {
  currentPhaseLabelForProject,
  currentStageForProject,
  projectTypeFor
} from "../projects/config.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1823 24154
export function createPasExcelSystemFileRecord(group, fileName, createdAt = new Date().toISOString(), attachment = {}) {
  const groupRows = group.rows || [];
  const summary = omBusinessFlowModule().pasExcelSystemAttachmentSummary?.(group, createdAt) || {
    linkedEntityId: group.displayPasDemandId || group.pasDemandId || "PAS-Demand-Pending",
    rowIds: groupRows.map((row) => row.id).filter(Boolean),
    metadata: { rowCount: groupRows.length, mergeDecision: group.mergeDecision || "merge" },
  };
  const rowIds = new Set(summary.rowIds);
  replaceRequestsBinding(requests.map((row) => {
    if (!rowIds.has(row.id)) return row;
    return {
      ...row,
      pasExcelGroupId: summary.linkedEntityId,
      pasExcelMergeDecision: group.mergeDecision || row.pasExcelMergeDecision || "merge",
      pasExcelSystemFileName: fileName,
      pasExcelSystemFileCreatedAt: createdAt,
      pasExcelSystemAttachmentId: attachment.id || row.pasExcelSystemAttachmentId || "",
      pasExcelSystemAttachmentUrl: attachment.downloadUrl || row.pasExcelSystemAttachmentUrl || "",
      pasExcelSystemAttachmentMode: attachment.id ? "api-upload" : "local-metadata",
      pasExcelSystemAttachmentKind: "om_pas_tracking_system_excel",
      pasExcelSystemRowCount: groupRows.length,
    };
  }));
  groupRows.forEach((row) => {
    const updated = requests.find((item) => item.id === row.id) || row;
    const mode = attachment.id ? "uploaded to system attachments" : "recorded as local metadata";
    addOmHistory(updated, "PAS Excel system file created", `${fileName} includes ${groupRows.length} item${groupRows.length === 1 ? "" : "s"} and was ${mode}.`);
  });
}
// @end-legacy-unit 1823

// @legacy-unit 1824 24184
export function pasExcelWorkbookSheet(group) {
  const groupRows = group.rows || [];
  const firstRow = groupRows[0] || {};
  const workbookDemandId = group.displayPasDemandId || group.pasDemandId || "PAS-Demand-Pending";
  return {
    name: "PAS Tracking",
    rows: [
      ["Form Head", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Demand No", workbookDemandId || "Waiting PAS Demand No", "PAS Material No", firstRow.pasMaterialNo || "Waiting PAS Material No", "Demand Date", pasDemandDate(firstRow), "Legal Name", pasLegalName(firstRow), "Request Dept", pasRequestDept(firstRow), "Data Transfer To", pasDataTransferTo(firstRow), ""],
      ["", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Form Item", "", "", "", "", "", "", "", "", "", "", "", ""],
      ["Project Type", "Project", "Phase", "PAS Material No", "Part Name", "Brand", "Spec", "Purpose Location", "Unit", "Quantity", "Level 2", "Level 3", "CPD-IEP Owner", "Requirement"],
      ...groupRows.map((row) => {
        const enriched = applyOmResponsibility(row);
        const phase = currentStageForProject(row.project);
        return [
          projectTypeFor(row.project),
          row.project,
          currentPhaseLabelForProject(row.project),
          row.pasMaterialNo || "",
          pasPartName(row),
          pasBrand(row),
          pasSpec(row),
          omPurposeLocations(row).join(" / "),
          omUnit(row),
          totalQty(row),
          enriched.omCategoryLevel2 || "",
          enriched.omCategoryLevel3 || "",
          enriched.omOwner || "",
          `${stageDateForProject(row.project, phase)} / Need by ${requiredDeliveryDateForProject(row.project, phase)}`,
        ];
      }),
    ],
    minWidth: 10,
    maxWidth: 34,
    freezeHeader: true,
  };
}
// @end-legacy-unit 1824

// @legacy-unit 1825 24223
export async function uploadGeneratedPasExcelAttachment(group, fileName, blob, createdAt = new Date().toISOString()) {
  if (!apiModeEnabled()) return null;
  const summary = omBusinessFlowModule().pasExcelSystemAttachmentSummary?.(group, createdAt);
  if (!summary) return null;
  const file = typeof File === "function"
    ? new File([blob], fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    : blob;
  return uploadAttachment(file, {
    linkedEntityType: summary.linkedEntityType,
    linkedEntityId: summary.linkedEntityId,
    attachmentKind: summary.attachmentKind,
    visibilityScope: summary.visibilityScope,
    metadata: summary.metadata,
  });
}
// @end-legacy-unit 1825

// @legacy-unit 1826 24239
export async function ensurePasExcelSystemFileForGroups(groups, { download = false } = {}) {
  const createdAt = new Date().toISOString();
  const results = [];
  for (const group of groups) {
    const fileName = omBusinessFlowModule().pasExcelSystemFileName?.(group) || `${String(group.pasDemandId || "PAS-Demand-Pending").replace(/[^a-zA-Z0-9._-]+/g, "-")}-PAS-Tracking.xlsx`;
    const blob = createXlsxBlob([pasExcelWorkbookSheet(group)]);
    let attachment = null;
    try {
      attachment = await uploadGeneratedPasExcelAttachment(group, fileName, blob, createdAt);
    } catch (error) {
      showToast(`Generated PAS Excel attachment failed: ${error.message}`, "error");
      throw error;
    }
    createPasExcelSystemFileRecord(group, fileName, createdAt, attachment || {});
    if (download) downloadBlob(fileName, blob);
    results.push({ group, fileName, attachment });
  }
  return results;
}
// @end-legacy-unit 1826

// @legacy-unit 1827 24259
export async function exportPasExcel() {
  const rows = selectedOmPasResultRows().length ? selectedOmPasResultRows() : selectedOmPasRequestRows();
  if (!rows.length) {
    showToast("Select at least one PAS row before generating PAS Excel.", "error");
    return;
  }
  const groups = omBusinessFlowModule().groupRowsForPasExcelExport?.(rows) || omBusinessFlowModule().groupRowsByPasDemandId?.(rows) || [{ pasDemandId: rows[0].pasDemandNo || "PAS-Demand-Pending", rows }];
  await ensurePasExcelSystemFileForGroups(groups, { download: true });
  rows.forEach((row) => {
    const updated = requests.find((item) => item.id === row.id) || row;
    addOmHistory(updated, "Exported PAS Tracking Excel", `${updated.pasExcelSystemFileName || row.pasDemandNo || "PAS-Demand-Pending"} PAS tracking exported.`);
  });
  renderOmPurchasing();
  showToast(`${groups.length} PAS tracking Excel file${groups.length === 1 ? "" : "s"} exported by PAS Demand ID.`, "success");
}
// @end-legacy-unit 1827

// @legacy-unit 1828 24275
export function exportPasPdf() {
  const rows = selectedOmPasRequestRows();
  if (!rows.length) {
    showToast("PAS PDF export is no longer part of PAS Result Queue.", "error");
    return;
  }
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Export one project package at a time for PAS.", "error");
    return;
  }
  const project = projects[0];
  const content = [
    "PAS Tracking Package",
    "Form Head",
    `Demand No: ${rows[0].pasDemandNo || "Waiting PAS Demand No"}`,
    `PAS Material No: ${rows[0].pasMaterialNo || "Waiting PAS Material No"}`,
    `Demand Date: ${pasDemandDate(rows[0])}`,
    `Legal Name: ${pasLegalName(rows[0])}`,
    `Request Dept: ${pasRequestDept(rows[0])}`,
    `Data Transfer To: ${pasDataTransferTo(rows[0])}`,
    "",
    "Form Item",
    `Project: ${project}`,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    ...rows.map((row) => `${row.project} | ${currentPhaseLabelForProject(row.project)} | PAS Material ${row.pasMaterialNo || "Waiting"} | Part Name ${pasPartName(row)} | Brand ${pasBrand(row) || "Brand pending"} | Spec ${pasSpec(row)} | Qty ${totalQty(row)} | Requirement ${omPurchaseReason(row)}`),
  ].join("\n");
  downloadFile(`${project}-PAS-Tracking.pdf`, content, "application/pdf");
  rows.forEach((row) => addOmHistory(row, "Exported PAS Tracking PDF", `${project} PAS tracking PDF exported.`));
  renderOmPurchasing();
  showToast("PAS tracking PDF exported.", "success");
}
// @end-legacy-unit 1828
