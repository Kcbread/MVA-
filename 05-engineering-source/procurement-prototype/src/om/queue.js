// om/queue: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_REWORK_REQUIRED,
  AMENDMENT_WAITING_OM,
  AMENDMENT_WAITING_USER_CONFIRM
} from "../admin/state.js";
import {
  hasPendingAmendment,
  isOmAmendmentWorkingRow,
  isSupersededRequest
} from "../demand/amendments.js";
import {
  requests
} from "../demand/state.js";
import {
  pasReviewRows
} from "../handoff/queue.js";
import {
  isOmCancelledByUserA,
  isOmUserConfirmed,
  isOmWaitingUserConfirm
} from "./export-rules.js";
import {
  omDemandProjectFilterValue,
  omFinalExportProjectFilterValue,
  omProjectFilterValue,
  omUserConfirmProjectFilterValue
} from "./filters.js";
import {
  applyOmResponsibility,
  omBuyScopeStatus,
  omBuyScopeText,
  omKeywordMatches
} from "./ownership.js";
import {
  isPasRequired
} from "./pas-rules.js";
import {
  omReadyForBuyer
} from "./quote-rules.js";
import {
  HANDOFF_SENT_TO_OM,
  HANDOFF_WAITING_PAS,
  OM_COLLECTION_COLLECTING,
  OM_COLLECTION_QUOTATION,
  OM_FINAL_SPEC_READY,
  OM_FINAL_SPEC_REQUIRED,
  OM_SCOPE_NEED_SPEC,
  PAS_APPROVED,
  PAS_BUDGET_ISSUED,
  PAS_WAITING,
  PRICE_ESCALATION_PENDING_DRI,
  PRICE_ESCALATION_PENDING_PROJECT_DRI,
  PRICE_ESCALATION_REQUIRED
} from "../workflow/status-constants.js";
import {
  latestRequestActivityTime
} from "../workflow/timeline.js";

// @legacy-unit 1590 19947
export function omWorkflowStage(row) {
  if (row.omStage) return row.omStage;
  if ([PRICE_ESCALATION_REQUIRED, PRICE_ESCALATION_PENDING_DRI, PRICE_ESCALATION_PENDING_PROJECT_DRI].includes(row.priceApprovalStatus)) return "priceReview";
  if (isOmWaitingUserConfirm(row)) return "userConfirm";
  if (isOmUserConfirmed(row) || row.finalExportTarget || row.finalExportStatus || row.finalExportedAt) return "finalExport";
  if (row.procurementStatus === HANDOFF_WAITING_PAS) return "pasRequest";
  if (row.procurementStatus === HANDOFF_SENT_TO_OM && row.omCollectionStatus === OM_COLLECTION_COLLECTING) return "pasRequest";
  return "pasResult";
}
// @end-legacy-unit 1590

// @legacy-unit 1591 19957
export function omAllRows() {
  return requests.filter((row) => {
    if (isOmAmendmentWorkingRow(row)) return true;
    return row.status === "Approved"
      && row.procurementStatus === HANDOFF_SENT_TO_OM
      && !isOmCancelledByUserA(row)
      && !hasPendingAmendment(row)
      && !isSupersededRequest(row)
      && (!isPasRequired(row) || [PAS_WAITING, PAS_APPROVED, PAS_BUDGET_ISSUED].includes(row.pasStatus));
  });
}
// @end-legacy-unit 1591

// @legacy-unit 1592 19969
export function omPasRequestRows() {
  const projectFilter = omDemandProjectFilterValue();
  const ownerFilter = document.getElementById("omOwnerFilter")?.value || "";
  const rows = [
    ...pasReviewRows(),
    ...omAllRows().filter((row) => omWorkflowStage(row) === "pasRequest"),
  ];
  const seen = new Set();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    const enriched = applyOmResponsibility(row);
    return (!projectFilter || row.project === projectFilter)
      && (!ownerFilter || enriched.omOwner === ownerFilter);
  });
}
// @end-legacy-unit 1592

// @legacy-unit 1593 19986
export function omPasResultRows() {
  const projectFilter = omProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "pasResult";
  });
}
// @end-legacy-unit 1593

// @legacy-unit 1594 19994
export function omQuoteConfirmRows() {
  return [...omPasResultRows(), ...omPriceReviewRows(), ...omUserConfirmRows()].sort((left, right) => {
    const priorityDiff = omQuotePriority(right) - omQuotePriority(left);
    if (priorityDiff) return priorityDiff;
    const activityDiff = latestRequestActivityTime(right) - latestRequestActivityTime(left);
    if (activityDiff) return activityDiff;
    return `${left.project} ${left.name}`.localeCompare(`${right.project} ${right.name}`);
  });
}
// @end-legacy-unit 1594

// @legacy-unit 1595 20004
export function omPriceReviewRows() {
  const projectFilter = omProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "priceReview";
  });
}
// @end-legacy-unit 1595

// @legacy-unit 1596 20012
export function omQuotePriority(row) {
  if (row.amendmentStatus === AMENDMENT_REWORK_REQUIRED) return 6;
  if (row.amendmentStatus === AMENDMENT_WAITING_OM) return 5;
  if (row.amendmentStatus === AMENDMENT_WAITING_USER_CONFIRM) return 4;
  if (isOmWaitingUserConfirm(row)) return 3;
  if (row.amendmentOf) return 2;
  if (omReadyForBuyer(row)) return 1;
  return 0;
}
// @end-legacy-unit 1596

// @legacy-unit 1597 20022
export function omUserConfirmRows() {
  const projectFilter = omUserConfirmProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "userConfirm";
  });
}
// @end-legacy-unit 1597

// @legacy-unit 1598 20030
export function omFinalExportRows() {
  const projectFilter = omFinalExportProjectFilterValue();
  return omAllRows().filter((row) => {
    const inProject = !projectFilter || row.project === projectFilter;
    return inProject && omWorkflowStage(row) === "finalExport";
  });
}
// @end-legacy-unit 1598

// @legacy-unit 1599 20038
export function omDemandRows() {
  return omPasRequestRows();
}
// @end-legacy-unit 1599

// @legacy-unit 1600 20042
export function omRows() {
  return omPasResultRows();
}
// @end-legacy-unit 1600

// @legacy-unit 1601 20046
export function omItemBucket(row) {
  if (row.catalogBucket) return row.catalogBucket;
  const text = omBuyScopeText(row);
  const buckets = [
    ["IPC(A++)", ["ipc(a++)", "ipc a++"]],
    ["IPC(A+)", ["ipc(a+)", "ipc a+"]],
    ["IPC(A)", ["ipc(a)", "industrial pc", "工業電腦"]],
    ["PC", ["pc", "desktop", "computer", "電腦"]],
    ["Laptop", ["laptop", "notebook", "筆記本"]],
    ["Monitor", ["monitor", "螢幕", "顯示器"]],
    ["Keyboard / Mouse", ["keyboard", "mouse", "鍵盤", "鼠標"]],
    ["Barcode / PDA", ["barcode", "rfid", "pda", "scanner", "條碼", "掃描"]],
    ["Network Equipment", ["network switch", "router", "wi-fi", "wifi", "firewall", "network rack", "交換機", "路由器"]],
    ["Server / Storage", ["server", "storage", "伺服器", "服務器", "存儲"]],
    ["Software", ["software", "license", "subscription", "軟件", "授權"]],
    ["Camera / Access Control", ["surveillance", "monitoring", "camera", "access control", "attendance", "監控", "門禁", "考勤"]],
    ["Video Conference", ["video conference", "conference", "視訊會議"]],
    ["IT Cable / Peripheral", ["usb", "hdmi", "vga", "network cable", "patch cord", "adapter", "cable"]],
  ];
  const match = buckets.find(([, keywords]) => keywords.some((keyword) => omKeywordMatches(text, keyword)));
  return match?.[0] || row.name;
}
// @end-legacy-unit 1601

// @legacy-unit 1602 20069
export function omFinalSpecStatus(row) {
  if (row.finalSpecStatus) return row.finalSpecStatus;
  return omBuyScopeStatus(row) === OM_SCOPE_NEED_SPEC ? OM_FINAL_SPEC_REQUIRED : OM_FINAL_SPEC_READY;
}
// @end-legacy-unit 1602

// @legacy-unit 1603 20074
export function omCollectionStatus(row) {
  return row.omCollectionStatus || OM_COLLECTION_QUOTATION;
}
// @end-legacy-unit 1603
