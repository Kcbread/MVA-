// exports/om: authoritative source; see docs/module-map.md.
import {
  OM_CONTACT,
  OM_DEPARTMENT_CODE,
  OM_PAYMENT_METHOD,
  OM_REQUESTOR
} from "../admin/state.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  downloadFile,
  downloadXlsx
} from "./workbook.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  ensureOmRowAccess
} from "../om/assignment.js";
import {
  generateOmFinalExportPackageCode,
  isOmFinalExportPrepared,
  isOmFinalExported,
  omFinalExportStageType,
  validateOmFinalExportAttachments,
  validateOmFinalExportPackageScope
} from "../om/export-rules.js";
import {
  omProjectFilterValue
} from "../om/filters.js";
import {
  addOmHistory
} from "../om/history.js";
import {
  omBudgetCode,
  omBudgetPatch,
  omPurposeLocations
} from "../om/pas-view.js";
import {
  omAmountUsd,
  omAmountVnd,
  omCurrentPrQty,
  omLastPrQty,
  omLastPurchaseTime,
  omPurchaseReason,
  omUnit,
  omUnitPriceUsd,
  omUnitPriceVnd
} from "../om/pricing.js";
import {
  selectedOmProjectPackage
} from "../om/quote-actions.js";
import {
  omQuoteScreenshotFile
} from "../om/quote-rules.js";
import {
  omQuoteValidity
} from "../om/quote-validity.js";
import {
  selectedOmFinalExportRows
} from "../om/selection.js";
import {
  renderOmPurchasing
} from "../om/workspace.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  OM_PREPARING_EXPORT
} from "../workflow/status-constants.js";

// @legacy-unit 1837 24515
export function omPackageProject(rows) {
  return rows[0]?.project || omProjectFilterValue() || "OM";
}
// @end-legacy-unit 1837

// @legacy-unit 1838 24519
export function omPackageCodeForRows(rows) {
  return rows[0]?.finalExportPackageCode || generateOmFinalExportPackageCode(rows);
}
// @end-legacy-unit 1838

// @legacy-unit 1839 24523
export function omBudgetCodeForRows(rows) {
  const codes = [...new Set(rows.map((row) => omBudgetCode(row)).filter(Boolean))];
  return codes.length === 1 ? codes[0] : codes.join(" / ");
}
// @end-legacy-unit 1839

// @legacy-unit 1840 24528
export function omDetailSheetName(packageCode) {
  return String(packageCode || "OM-Purchasing-Detail").slice(0, 31);
}
// @end-legacy-unit 1840

// @legacy-unit 1841 24532
export function omPackageFileName(packageCode) {
  return `${packageCode || "OM-Purchasing-Package"}.xlsx`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}
// @end-legacy-unit 1841

// @legacy-unit 1842 24536
export function omSummarySheetRows(rows) {
  const packageCode = omPackageCodeForRows(rows);
  const budgetCode = omBudgetCodeForRows(rows);
  const totalVnd = rows.reduce((sum, row) => sum + omAmountVnd(row), 0);
  const totalUsd = rows.reduce((sum, row) => sum + omAmountUsd(row), 0);
  const today = rows[0]?.finalExportPreparedAt ? new Date(rows[0].finalExportPreparedAt) : new Date();
  const dateText = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const stageType = omFinalExportStageType(rows[0] || {});
  return [
    [packageCode, "", "", "", ""],
    ["", "", "", "", ""],
    ["部門代碼  \nDepartment code", OM_DEPARTMENT_CODE, "申請日期\nDate of Application", dateText, ""],
    ["申請人\nRequestors", OM_REQUESTOR, "聯系電話\ncontact number", OM_CONTACT, ""],
    ["量产or 试产\nMass production & NPI", stageType, "法人\nLegal person", "富山\nFushan", ""],
    ["付费方式\nPayment methods", OM_PAYMENT_METHOD, "幣別\nCurrency", "交易幣別  VND\nTransaction currency", "預算幣別 USD\nBudget currency"],
    ["月度预算代碼\nMonthly budget code", budgetCode, "金額\nAmount", totalVnd, totalUsd],
    ["合     計：\ntotal", "", "", totalVnd, totalUsd],
    ["", "", "", "\n承辦﹕\nRequestors", ""],
    [" 核   准(BU):\nBU head", "", "部门主管審核﹕\nDepartment head ", "", ""],
    [" 核   准(SBU)﹕\nSBU head", "", "", "", ""],
    ["經管核準:\nBC 3 :", "", "經管審核1:\nBC 1 \n\n\n經管審核2:\nBC 2 ", "經管IE審核:\nBC IE \n\n\nOPM:", ""],
  ];
}
// @end-legacy-unit 1842

// @legacy-unit 1843 24560
export function omDetailSheetRows(rows) {
  const packageCode = omPackageCodeForRows(rows);
  const header = [
    "NO",
    "物品名稱Item Name",
    "PAS Material No.",
    "Budget Code",
    "Purpose Location",
    "Material Name",
    "規格\nDetail / specification",
    "單位\nunit",
    "上次請購時間\nLast purchase time",
    "庫存量\ninventory",
    "上次請購數量\nPR quantity\n(last time)",
    "本次請購數量\nPR quantity \n(this time)",
    "單價\n（VND）\nunit price",
    "總價\n（VND）\nAmount",
    "單價\n（USD）\nunit price",
    "總價\n（USD）\nAmount",
    "請購原因\nReason for purchase",
    "付費方式\nPayment methods",
    "請購部門代碼\nRequisition department code",
    "廠商\nVendor",
    "供應商代碼\nVendor Code",
  ];
  const title = [packageCode, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
  const bodyRows = rows.map((row, index) => [
    index + 1,
    row.name,
    row.pasMaterialNo || "",
    omBudgetCode(row),
    omPurposeLocations(row).join(" / "),
    partName(row),
    itemDetail(row) || "\\",
    omUnit(row),
    omLastPurchaseTime(row) || "\\",
    "\\",
    omLastPrQty(row) || "\\",
    omCurrentPrQty(row),
    omUnitPriceVnd(row),
    omAmountVnd(row),
    omUnitPriceUsd(row),
    omAmountUsd(row),
    omPurchaseReason(row),
    OM_PAYMENT_METHOD,
    OM_DEPARTMENT_CODE,
    row.vendor || "",
    row.vendorPartNo || "",
  ]);
  const totalRow = ["Total", "", "", "", "", "", "", "", "", "", "", "", "", bodyRows.reduce((sum, row) => sum + Number(row[13] || 0), 0), "", bodyRows.reduce((sum, row) => sum + Number(row[15] || 0), 0), "", "", "", "", ""];
  return [
    title,
    header,
    ...bodyRows,
    totalRow,
  ];
}
// @end-legacy-unit 1843

// @legacy-unit 1844 24618
export function omExportWorkbookSheets(rows) {
  const packageCode = omPackageCodeForRows(rows);
  return [
    {
      name: "Project budget-summary table",
      rows: omSummarySheetRows(rows),
      minWidth: 10,
      maxWidth: 32,
      preferred: { 1: 24, 2: 17, 3: 15, 4: 16 },
      rowHeights: [null, null, 60, 45, 75, 60, 75, 40.5, 15.75, 47.25, 78.75, 94.5],
      merges: ["A1:D2", "E1:E2", "D3:E3", "D4:E4", "D5:E5", "A8:C8", "D9:E11", "C10:C11", "D12:E12"],
      freezeHeader: false,
    },
    {
      name: omDetailSheetName(packageCode),
      rows: omDetailSheetRows(rows),
      minWidth: 8,
      maxWidth: 42,
      preferred: { 0: 4, 1: 28, 2: 18, 3: 20, 4: 24, 5: 32, 6: 34, 8: 13, 10: 13, 11: 13, 12: 13, 13: 13, 14: 13, 15: 13, 16: 28, 19: 18 },
      rowHeights: [26.25, 63.75],
      merges: ["A1:U1"],
      freezeHeader: true,
    },
  ];
}
// @end-legacy-unit 1844

// @legacy-unit 1845 24644
export function exportOmExcelRows(rows) {
  if (!rows.length) {
    showToast("No OM handoff row is available to prepare Excel.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "export Excel"))) return;
  const unprepared = rows.filter((row) => !isOmFinalExportPrepared(row) && !isOmFinalExported(row));
  if (unprepared.length) {
    showToast("Choose Expense or Capex before preparing the handoff Excel.", "error");
    return;
  }
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Prepare one OM handoff at a time. Please filter or select rows from a single project.", "error");
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
  const packageCode = omPackageCodeForRows(rows);
  downloadXlsx(omPackageFileName(packageCode), omExportWorkbookSheets(rows));
  const now = new Date().toISOString();
  rows.forEach((row) => addOmHistory(row, "Prepared export Excel", `Exported ${packageCode} OM Purchasing Excel package.`));
  replaceRequestsBinding(requests.map((row) => rows.some((selected) => selected.id === row.id) ? {
    ...row,
    ...omBudgetPatch(row),
    paymentMethod: OM_PAYMENT_METHOD,
    finalExportPackageCode: rows.find((selected) => selected.id === row.id)?.finalExportPackageCode || packageCode,
    excelExportedAt: now,
    omStatus: OM_PREPARING_EXPORT,
    omStage: "finalExport",
  } : row));
  renderOmPurchasing();
  showToast("OM handoff Excel prepared.", "success");
}
// @end-legacy-unit 1845

// @legacy-unit 1846 24687
export function exportOmExcel() {
  exportOmExcelRows(selectedOmFinalExportRows());
}
// @end-legacy-unit 1846

// @legacy-unit 1847 24691
export function exportOmQuotePdfRows(rows) {
  if (!rows.length) {
    showToast("Select at least one OM handoff row before preparing quote screenshot files.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "prepare quote screenshot files"))) return;
  const projects = selectedOmProjectPackage(rows);
  if (projects.length !== 1) {
    showToast("Prepare one OM handoff at a time. Please filter or select rows from a single project.", "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  const packageCode = omPackageCodeForRows(rows);
  const content = [
    "OM Purchasing Quote Screenshot Package",
    `Project Package: ${packageCode}`,
    `Generated: ${new Date().toLocaleString("en-US")}`,
    "",
    ...rows.map((row) => `${row.id} | ${row.project} | ${row.name} | ${omQuoteValidity(row)} | ${omQuoteScreenshotFile(row) || "No uploaded screenshot"}`),
  ].join("\n");
  downloadFile(`${packageCode}-OM-Quote-Screenshot-Package.txt`, content, "text/plain");
  const now = new Date().toISOString();
  rows.forEach((row) => addOmHistory(row, "Prepared handoff screenshot files", omQuoteScreenshotFile(row) || `Prepared ${packageCode} prototype quote screenshot files.`));
  replaceRequestsBinding(requests.map((row) => rows.some((selected) => selected.id === row.id) ? {
    ...row,
    quotePdfExportedAt: now,
    omStatus: OM_PREPARING_EXPORT,
    omStage: "finalExport",
  } : row));
  renderOmPurchasing();
  showToast("OM handoff quote screenshot files prepared.", "success");
}
// @end-legacy-unit 1847

// @legacy-unit 1848 24728
export function exportOmQuotePdf() {
  exportOmQuotePdfRows(selectedOmFinalExportRows());
}
// @end-legacy-unit 1848

// @legacy-unit 1849 24732
export function exportOmPackageRows(rows) {
  if (!rows.length) {
    showToast("No OM handoff row is available to prepare.", "error");
    return;
  }
  if (!rows.every((row) => ensureOmRowAccess(row, "OM handoff"))) return;
  const unprepared = rows.filter((row) => !isOmFinalExportPrepared(row) && !isOmFinalExported(row));
  if (unprepared.length) {
    showToast("Prepare Expense or Capex before preparing the handoff.", "error");
    return;
  }
  const attachmentError = validateOmFinalExportAttachments(rows);
  if (attachmentError) {
    showToast(attachmentError, "error");
    return;
  }
  exportOmExcelRows(rows);
  exportOmQuotePdfRows(rows);
  showToast("OM Handoff prepared: Excel and quote screenshot files are ready.", "success");
}
// @end-legacy-unit 1849

// @legacy-unit 1850 24753
export function exportOmPackage() {
  exportOmPackageRows(selectedOmFinalExportRows());
}
// @end-legacy-unit 1850
