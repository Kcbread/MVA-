// om/export-rules: authoritative source; see docs/module-map.md.
import {
  EXT_ACCEPTED,
  OM_COST_TYPE_CAPEX,
  OM_COST_TYPE_EXPENSE,
  OM_COST_TYPE_TARGET_MAP,
  OM_EXPORTED_CFA,
  OM_EXPORTED_ECS,
  OM_EXTERNAL_ACCEPTED,
  OM_EXTERNAL_PENDING,
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  requests
} from "../demand/state.js";
import {
  externalStatusFor
} from "./external-progress.js";
import {
  omBudgetCode
} from "./pas-view.js";
import {
  isOmQuoteReady,
  omHasRequiredQuoteFiles
} from "./quote-rules.js";
import {
  omQuoteValidity
} from "./quote-validity.js";
import {
  currentPhaseLabelForProject
} from "../projects/config.js";
import {
  OM_PREPARING_EXPORT,
  OM_QUOTE_NEEDED,
  OM_QUOTE_READY,
  OM_READY_FOR_CFA,
  OM_READY_FOR_ECS,
  OM_RECEIVED,
  OM_USER_CONFIRMED,
  OM_WAITING_USER_CONFIRM,
  PRICE_AUTO_CLEARED,
  PRICE_ESCALATION_APPROVED,
  USER_CONFIRMATION_NOT_REQUIRED
} from "../workflow/status-constants.js";

// @legacy-unit 1567 19795
export function isOmCancelledByUserA(row) {
  return row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST || row.status === USER_CANCELLED_REQUEST || row.status === "Cancelled";
}
// @end-legacy-unit 1567

// @legacy-unit 1568 19799
export function isOmWaitingUserConfirm(row) {
  return row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM;
}
// @end-legacy-unit 1568

// @legacy-unit 1569 19803
export function isOmUserConfirmed(row) {
  return row.userAQuoteDecisionStatus === OM_USER_CONFIRMED;
}
// @end-legacy-unit 1569

// @legacy-unit 1570 19807
export function isOmExportAuthorized(row) {
  return isOmUserConfirmed(row)
    || row.userAQuoteDecisionStatus === USER_CONFIRMATION_NOT_REQUIRED
    || row.priceDecisionStatus === PRICE_AUTO_CLEARED
    || row.priceDecisionStatus === PRICE_ESCALATION_APPROVED
    || row.priceApprovalStatus === PRICE_AUTO_CLEARED
    || row.priceApprovalStatus === PRICE_ESCALATION_APPROVED
    || Boolean(row.projectDriApprovedAt);
}
// @end-legacy-unit 1570

// @legacy-unit 1571 19817
export function isOmFinalExportPrepared(row) {
  return [OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus);
}
// @end-legacy-unit 1571

// @legacy-unit 1572 19821
export function isOmFinalExported(row) {
  return [OM_EXPORTED_CFA, OM_EXPORTED_ECS].includes(row.finalExportStatus);
}
// @end-legacy-unit 1572

// @legacy-unit 1573 19825
export function omFinalExportTargetLabel(row) {
  return row.finalExportTarget || "-";
}
// @end-legacy-unit 1573

// @legacy-unit 1574 19829
export function omFinalExportStatusLabel(row) {
  return row.finalExportStatus || (isOmUserConfirmed(row) ? OM_PREPARING_EXPORT : "-");
}
// @end-legacy-unit 1574

// @legacy-unit 1575 19833
export function parseOmPackageCode(value) {
  const match = String(value || "").match(/\b([A-Z0-9]+)-(MP|NPI|SV)-([A-Z0-9]+)-MVA(\d{4})-(\d+)OM\b/);
  if (!match) return null;
  return {
    code: match[0],
    process: match[1],
    stageType: match[2],
    projectCode: match[3],
    yymm: match[4],
    sequence: Number(match[5] || 0),
  };
}
// @end-legacy-unit 1575

// @legacy-unit 1576 19846
export function normalizeOmPackageToken(value, fallback = "NA") {
  const token = String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "");
  return token || fallback;
}
// @end-legacy-unit 1576

// @legacy-unit 1577 19851
export function omFinalExportProcess(row) {
  return parseOmPackageCode(row.finalExportPackageCode || row.budgetNo)?.process
    || normalizeOmPackageToken(row.process, "FATP");
}
// @end-legacy-unit 1577

// @legacy-unit 1578 19856
export function omFinalExportStageType(row) {
  const parsed = parseOmPackageCode(row.finalExportPackageCode || row.budgetNo);
  if (parsed?.stageType) return parsed.stageType;
  const candidates = [row.stage, row.station, row.projectStage, row.sourceStage, currentPhaseLabelForProject(row.project)];
  const match = candidates.map((value) => normalizeOmPackageToken(value, "")).find((value) => ["MP", "NPI", "SV"].includes(value));
  return match || "MP";
}
// @end-legacy-unit 1578

// @legacy-unit 1579 19864
export function omFinalExportProjectCode(row) {
  const parsed = parseOmPackageCode(row.finalExportPackageCode || row.budgetNo);
  if (parsed?.projectCode) return parsed.projectCode;
  const candidates = [row.sourceProject, row.yearProject, row.purpose, row.project];
  const clean = candidates
    .map((value) => normalizeOmPackageToken(value, ""))
    .find((value) => value && !["P26", "P27", "DEMO", "DEMOLINE"].includes(value) && !value.includes("DEMO") && /^[A-Z0-9]{2,8}$/.test(value));
  return clean || normalizeOmPackageToken(row.project, "P26");
}
// @end-legacy-unit 1579

// @legacy-unit 1580 19874
export function omFinalExportYymm(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
  return `${String(safeDate.getFullYear()).slice(-2)}${String(safeDate.getMonth() + 1).padStart(2, "0")}`;
}
// @end-legacy-unit 1580

// @legacy-unit 1581 19880
export function omFinalExportScope(row) {
  return {
    process: omFinalExportProcess(row),
    stageType: omFinalExportStageType(row),
    projectCode: omFinalExportProjectCode(row),
  };
}
// @end-legacy-unit 1581

// @legacy-unit 1582 19888
export function omFinalExportScopeKey(row) {
  const scope = omFinalExportScope(row);
  return `${scope.process}-${scope.stageType}-${scope.projectCode}`;
}
// @end-legacy-unit 1582

// @legacy-unit 1583 19893
export function validateOmFinalExportPackageScope(rows) {
  const keys = [...new Set(rows.map(omFinalExportScopeKey))];
  if (keys.length > 1) {
    return `Selected rows mix package scopes (${keys.join(" / ")}). Split them before preparing CFA/ECS.`;
  }
  const packageCodes = [...new Set(rows.map((row) => row.finalExportPackageCode).filter(Boolean))];
  if (packageCodes.length > 1) {
    return `Selected rows already belong to different package codes (${packageCodes.join(" / ")}).`;
  }
  return "";
}
// @end-legacy-unit 1583

// @legacy-unit 1584 19905
export function existingOmPackageCodes() {
  const values = [...requests, ...purchaseRecords].flatMap((row) => [
    row.finalExportPackageCode,
    row.budgetNo,
  ]);
  return values.flatMap((value) => {
    const text = String(value || "");
    const matches = text.match(/\b[A-Z0-9]+-(?:MP|NPI|SV)-[A-Z0-9]+-MVA\d{4}-\d+OM\b/g) || [];
    return matches;
  });
}
// @end-legacy-unit 1584

// @legacy-unit 1585 19917
export function nextOmPackageSequence(yymm) {
  return existingOmPackageCodes()
    .map(parseOmPackageCode)
    .filter((parsed) => parsed?.yymm === yymm)
    .reduce((max, parsed) => Math.max(max, parsed.sequence), 0) + 1;
}
// @end-legacy-unit 1585

// @legacy-unit 1586 19924
export function generateOmFinalExportPackageCode(rows, date = new Date()) {
  const existing = rows.find((row) => row.finalExportPackageCode)?.finalExportPackageCode;
  if (existing) return existing;
  const scope = omFinalExportScope(rows[0] || {});
  const yymm = omFinalExportYymm(date);
  const sequence = String(nextOmPackageSequence(yymm)).padStart(2, "0");
  return `${scope.process}-${scope.stageType}-${scope.projectCode}-MVA${yymm}-${sequence}OM`;
}
// @end-legacy-unit 1586

// @legacy-unit 1587 19933
export function omFinalExportPackageCode(row) {
  return row.finalExportPackageCode || row.budgetNo || "-";
}
// @end-legacy-unit 1587

// @legacy-unit 1588 19937
export function budgetPackageCode(row) {
  return omBudgetCode(row);
}
// @end-legacy-unit 1588

// @legacy-unit 1589 19941
export function budgetPackageHelper(row) {
  if (row.finalExportPackageCode) return `Handoff Code ${row.finalExportPackageCode}`;
  if (row.budgetNo) return `Source Budget No. ${row.budgetNo}`;
  return row.budgetStatus || "Budget Code by Purpose Project Build";
}
// @end-legacy-unit 1589

// @legacy-unit 1664 20687
export function validateOmFinalExportAttachments(rows) {
  const missing = rows.filter((row) => !omHasRequiredQuoteFiles(row));
  if (!missing.length) return "";
  return `Upload quote screenshot and generate PAS Excel before OM Handoff. Missing file rows: ${missing.map((row) => row.id).join(", ")}.`;
}
// @end-legacy-unit 1664

// @legacy-unit 1665 20693
export function omTargetForCostType(costType) {
  return OM_COST_TYPE_TARGET_MAP[costType] || "";
}
// @end-legacy-unit 1665

// @legacy-unit 1666 20697
export function omCostTypeForTarget(target) {
  if (target === "CFA") return OM_COST_TYPE_CAPEX;
  if (target === "ECS") return OM_COST_TYPE_EXPENSE;
  return "";
}
// @end-legacy-unit 1666

// @legacy-unit 1667 20703
export function omFinalExportCostType(row) {
  return row.finalExportCostType || omCostTypeForTarget(row.finalExportTarget) || "";
}
// @end-legacy-unit 1667

// @legacy-unit 1668 20707
export function omFinalExportTargetForRow(row) {
  return row.finalExportTarget || omTargetForCostType(row.finalExportCostType) || "";
}
// @end-legacy-unit 1668

// @legacy-unit 1669 20711
export function omCostTypeTargetLabel(row) {
  const costType = omFinalExportCostType(row);
  const target = omFinalExportTargetForRow(row);
  if (!costType && !target) return "Select Cost Type";
  return `${costType || "Cost Type"} → ${target || "CFA/ECS"}`;
}
// @end-legacy-unit 1669

// @legacy-unit 1670 20718
export function omStatusForExportedRow(row) {
  const externalStatus = externalStatusFor(row);
  if (externalStatus !== "-") return externalStatus;
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST || row.status === USER_CANCELLED_REQUEST) return USER_CANCELLED_REQUEST;
  if (row.userAQuoteDecisionStatus === OM_WAITING_USER_CONFIRM) return OM_WAITING_USER_CONFIRM;
  if (row.userAQuoteDecisionStatus === OM_USER_CONFIRMED) return OM_USER_CONFIRMED;
  if (row.finalExportStatus) return row.finalExportStatus;
  if (row.externalReviewStatus) return row.externalReviewStatus;
  if (row.excelExportedAt || row.quotePdfExportedAt) return OM_EXTERNAL_PENDING;
  if (isOmQuoteReady(row)) return OM_QUOTE_READY;
  if (row.omStatus) return row.omStatus;
  if (omQuoteValidity(row) === "Quote Pending") return OM_QUOTE_NEEDED;
  return OM_RECEIVED;
}
// @end-legacy-unit 1670

// @legacy-unit 1671 20733
export function omStatusLabel(status) {
  return status === OM_EXTERNAL_ACCEPTED ? EXT_ACCEPTED : status;
}
// @end-legacy-unit 1671
