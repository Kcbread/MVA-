// demand/worksheet-actions: authoritative source; see docs/module-map.md.
import {
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  quantityReviewModeLabel
} from "../approval/quantity-scope.js";
import {
  renderRequesterInputContext
} from "../catalog/context.js";
import {
  materialDuplicateCandidateRows
} from "../catalog/match.js";
import {
  isOmCatalogRow
} from "../catalog/records.js";
import {
  reusableReferenceFields
} from "../catalog/reuse.js";
import {
  renderRequestItemPicker,
  requestWorksheetDataRowHtml,
  requestWorksheetSeedBreakdown,
  requestWorksheetTableColspan,
  selectedRequestWorksheetSource,
  sourceFromWorksheetValue
} from "../catalog/search.js";
import {
  replaceRequestItemPickerQueryBinding,
  requestItemPickerQuery
} from "../catalog/state.js";
import {
  managerQuantityPhaseCell
} from "../cost/matrix-data.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  isSupersededRequest
} from "./amendments.js";
import {
  restoreRequesterLocalDrafts
} from "./drafts.js";
import {
  normalizeRequestIntentFields
} from "./intent.js";
import {
  stationBreakdownHasDemand,
  stationBreakdownPhaseKey,
  stationBreakdownPhaseTotal,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail,
  totalQty
} from "./quantity.js";
import {
  requestFromRecord
} from "./records.js";
import {
  replaceRequestWorksheetAddQueryBinding,
  replaceRequestWorksheetSelectedSourceBinding,
  replaceRequestsBinding,
  requestWorksheetAddPhase,
  requestWorksheetAddQuery,
  requestWorksheetLine,
  requestWorksheetMode,
  requestWorksheetSelectedSource,
  requests
} from "./state.js";
import {
  applyRequestWorksheetActiveState,
  requestNeedDateScopeLabel,
  requestWorksheetRows,
  requesterPackageRows,
  requesterSubmitScopeAudit
} from "./worksheet.js";
import {
  renderRequestWorksheetHead,
  renderRequestWorksheetPhaseJumpBar,
  requestWorksheetColumns,
  syncRequestWorksheetContext,
  syncRequestWorksheetTabs
} from "./worksheet-view.js";
import {
  renderDepartment
} from "./workspace.js";
import {
  itemDetail,
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  createNewItemSuggestion
} from "../materials/new-item.js";
import {
  advanceNewItemSequenceBinding,
  newItemSequence
} from "../materials/state.js";
import {
  DEFAULT_PURPOSE_LOCATION,
  DEMAND_TYPE_MFG,
  STAGES,
  STATION_MASTER,
  projectScopeLabel,
  projectTypeFor,
  rowMatchesCurrentRequesterProjectScope
} from "../projects/config.js";
import {
  dateOnly,
  normalizePurposeLocation,
  requestPhaseLineOpenDate
} from "../projects/dates.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  currentRequesterPersona
} from "../session/persona.js";
import {
  normalize,
  statusClass
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  refreshGlobalHorizontalNavigators
} from "../shell/table-navigation.js";

// @legacy-unit 1059 11672
export function requestWorksheetOverrides(record, source, phases = [requestWorksheetAddPhase]) {
  const zeroStageOverrides = STAGES.reduce((values, stage) => ({ ...values, [stage]: 0 }), {});
  const stationBreakdown = phases.map((phase) => requestWorksheetSeedBreakdown(record, { phase, mode: requestWorksheetMode }));
  const requestIntent = normalizeRequestIntentFields(record);
  const purposeLocation = normalizePurposeLocation(record.purposeLocation || record.purpose || DEFAULT_PURPOSE_LOCATION);
  const lineOpenDate = requestPhaseLineOpenDate({ project: currentProject, phase: phases[0] || requestWorksheetAddPhase });
  return {
    ...zeroStageOverrides,
    project: currentProject,
    yearProject: currentProject,
    projectCode: currentProjectCode,
    projectType: projectTypeFor(currentProject),
    phase: phases[0] || requestWorksheetAddPhase,
    defaultPhase: phases[0] || requestWorksheetAddPhase,
    requestLine: requestWorksheetLine,
    demandType: requestWorksheetMode,
    station: requestWorksheetMode === DEMAND_TYPE_MFG ? requestWorksheetColumns()[0] : "",
    demandUnit: requestWorksheetMode === DEMAND_TYPE_MFG ? "" : requestWorksheetColumns()[0],
    purposeLocation,
    purpose: purposeLocation,
    lineOpenDate,
    requiredDeliveryDate: "",
    stationBreakdown,
    selected: true,
    requestAction: requestIntent.requestAction,
    action: requestIntent.requestAction,
    requestActionOtherText: requestIntent.requestActionOtherText,
    requesterReason: `${source.badge} added from worksheet. Quantity starts at 0.`,
    ...(source.type === "new" ? {
      source: "new-item-request",
      sourceProject: "New Item Request",
      sourceRecordId: "",
      materialNo: "",
      materialId: "",
      materialStatus: "New Item Request",
      quoteStatus: "New item",
      requesterReason: "New Item Request from worksheet. Submit carries this row to downstream review.",
    } : source.type === "catalog" && isOmCatalogRow(record) ? {
      sourceProject: "OM Catalog",
      catalogBucket: record.catalogBucket,
      catalogStatus: record.catalogStatus,
    } : reusableReferenceFields(record)),
  };
}
// @end-legacy-unit 1059

// @legacy-unit 1060 11717
export function addWorksheetRow(sourceValue = "", resolvedSource = null) {
  syncRequestWorksheetContext();
  const source = resolvedSource || (sourceValue ? sourceFromWorksheetValue(sourceValue) : selectedRequestWorksheetSource());
  if (!source) {
    showToast("Search or type an item/spec before adding.", "error");
    return;
  }
  if (source.type === "new") {
    const query = requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || source.row.name || "";
    createNewItemSuggestion({
      query,
      duplicateCandidates: materialDuplicateCandidateRows(query),
    });
    return;
  }
  const record = source.type === "new"
    ? {
      id: `NEW-ITEM-${String(advanceNewItemSequenceBinding(1, true)).padStart(4, "0")}`,
      project: currentProject,
      name: requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || "New Item Request",
      detail: requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || "New item/spec pending review",
      spec: requestItemPickerQuery.trim() || requestWorksheetAddQuery.trim() || "New item/spec pending review",
      source: "new-item-request",
    }
    : source.row;
  const phases = STAGES;
  const draft = requestFromRecord(record, requestWorksheetOverrides(record, source, phases));
  replaceRequestsBinding([draft, ...requests]);
  replaceRequestWorksheetAddQueryBinding("");
  replaceRequestWorksheetSelectedSourceBinding("");
  replaceRequestItemPickerQueryBinding("");
  renderDepartment();
  renderRequestItemPicker();
  document.getElementById("requestRows")?.closest(".request-worksheet-shell")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast(`${source.badge} added. All phase quantities start at 0.`, "success");
}
// @end-legacy-unit 1060

// @legacy-unit 1061 11754
export function renderRequestRows() {
  restoreRequesterLocalDrafts();
  syncRequestWorksheetContext();
  syncRequestWorksheetTabs();
  const worksheetRows = requestWorksheetRows();
  const packageRows = requesterPackageRows();
  renderRequestWorksheetHead();
  renderRequestWorksheetPhaseJumpBar();
  renderRequesterInputContext();
  const summary = document.getElementById("requestDraftSummary");
  const scopeSummary = document.getElementById("requestWorksheetScopeSummary");
  const audit = requesterSubmitScopeAudit();
  const rowsWithQty = audit.readyRows;
  const rowsMissingRequiredDeliveryDate = rowsWithQty.filter((row) => !dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || ""));
  if (summary) {
    if (!packageRows.length) {
      summary.textContent = `Use Add Item, then enter at least one non-zero ${quantityReviewModeLabel(requestWorksheetMode)} quantity before submitting.`;
    } else if (!rowsWithQty.length) {
      summary.textContent = `Add quantity to at least one ${requestNeedDateScopeLabel()} worksheet row before submitting to Dept DRI.`;
    } else if (rowsMissingRequiredDeliveryDate.length) {
      summary.textContent = `Required Delivery Date is required for each submitted item. ${rowsMissingRequiredDeliveryDate.length} row${rowsMissingRequiredDeliveryDate.length === 1 ? "" : "s"} still missing.`;
    } else {
      const excludedText = audit.excluded.length ? ` Excluded: ${audit.excluded.slice(0, 3).join(" / ")}${audit.excluded.length > 3 ? ` / +${audit.excluded.length - 3} more` : ""}.` : "";
      summary.textContent = `Ready to submit ${rowsWithQty.length} ${quantityReviewModeLabel(requestWorksheetMode)} row${rowsWithQty.length === 1 ? "" : "s"} on ${requestWorksheetLine}.${excludedText}`;
    }
  }
  if (scopeSummary) {
    const worksheetRowsWithQty = worksheetRows.filter(stationBreakdownHasDemand).length;
    scopeSummary.textContent = `${worksheetRows.length} worksheet row${worksheetRows.length === 1 ? "" : "s"} · ${worksheetRowsWithQty} ready`;
  }
  const body = document.getElementById("requestRows");
  if (!body) return;
  body.innerHTML = worksheetRows.length
    ? worksheetRows.map(requestWorksheetDataRowHtml).join("")
    : `<tr><td colspan="${requestWorksheetTableColspan()}" class="empty-cell">No worksheet rows for ${requestWorksheetMode} / ${requestWorksheetLine}. Use Add Item to start.</td></tr>`;
  renderRequestItemPicker();
  applyRequestWorksheetActiveState();
  refreshGlobalHorizontalNavigators();
}
// @end-legacy-unit 1061

// @legacy-unit 1062 11794
export function userDemandOverviewSourceRows() {
  const persona = currentRequesterPersona();
  const personaName = normalize(persona?.name || "");
  const personaEmail = normalize(persona?.email || "");
  return requests.filter((row) => {
    if (!rowMatchesCurrentRequesterProjectScope(row)) return false;
    if (["Rejected", USER_CANCELLED_REQUEST, "Cancelled"].includes(row.status) || isSupersededRequest(row)) return false;
    if (!stationBreakdownHasDemand(row)) return false;
    if (row.status === "Draft") return true;
    if (!personaName && !personaEmail) return true;
    return normalize(row.submittedBy || row.requesterName || "") === personaName
      || normalize(row.email || "") === personaEmail;
  });
}
// @end-legacy-unit 1062

// @legacy-unit 1063 11809
export function userDemandOverviewGroups() {
  return userDemandOverviewSourceRows().map((row) => {
    const phaseTotals = Object.fromEntries(STAGES.map((stage) => [stage, stationBreakdownPhaseTotal(row, stage)]));
    const stationTotals = Object.fromEntries(STAGES.map((stage) => [stage, new Map()]));
    stationBreakdownRowsForDetail(row).forEach((item) => {
      const phase = stationBreakdownPhaseKey(item);
      const qty = stationBreakdownRowTotal(item);
      if (!phase || qty <= 0) return;
      const station = item.station || STATION_MASTER[0];
      stationTotals[phase].set(station, (stationTotals[phase].get(station) || 0) + qty);
    });
    return {
      keyId: row.id,
      row,
      project: projectScopeLabel(row),
      item: row.name || "-",
      spec: userVisibleItemDetail(row) || itemDetail(row) || "-",
      requests: new Map([[row.id, row]]),
      statuses: new Set([row.status]),
      phaseTotals,
      stationTotals,
      totalQty: totalQty(row),
      packageId: row.requestPackageId || (row.status === "Draft" ? `DRAFT-${row.project}` : row.id),
      packageLabel: row.requestPackageLabel || (row.status === "Draft" ? "Draft Package" : "Submitted Package"),
    };
  }).sort((left, right) => `${left.packageId} ${left.item}`.localeCompare(`${right.packageId} ${right.item}`));
}
// @end-legacy-unit 1063

// @legacy-unit 1064 11837
export function renderUserDemandOverview() {
  const groups = userDemandOverviewGroups();
  const summary = document.getElementById("userDemandOverviewSummary");
  const badge = document.getElementById("userDemandPackageBadge");
  if (badge) badge.textContent = `${currentProject}${currentProjectCode ? ` / ${currentProjectCode}` : ""} package view`;
  if (summary) {
    const packageCount = new Set(groups.map((group) => group.packageId)).size;
    const draftCount = groups.filter((group) => group.row.status === "Draft").length;
    const submittedCount = groups.filter((group) => group.row.status !== "Draft").length;
    summary.innerHTML = summaryCardsHtml([
      { label: "Packages", value: packageCount, helper: "Draft and submitted packages", variant: "hero" },
      { label: "Items", value: groups.length, helper: "Items in your package view" },
      { label: "Total Qty", value: groups.reduce((sum, group) => sum + group.totalQty, 0), helper: "From demand rows" },
      { label: "Draft Items", value: draftCount, helper: "Still editable" },
      { label: "Submitted Items", value: submittedCount, helper: "Visible to Dept DRI and Cost Manager" },
    ]);
  }
  const body = document.getElementById("userDemandOverviewRows");
  if (!body) return;
  body.innerHTML = groups.length
    ? groups.map((group) => `
      <tr>
        <td><strong>${group.packageLabel}</strong><div class="reason-text">${group.packageId}</div></td>
        <td><div class="item-primary">${group.item}</div><div class="reason-text">${group.spec}</div></td>
        <td><span class="status-pill ${statusClass(group.row.status)}">${group.row.status}</span></td>
        ${STAGES.map((stage) => `<td>${managerQuantityPhaseCell(group, stage)}</td>`).join("")}
        <td><strong>${group.totalQty}</strong></td>
        <td class="cell-action">${group.row.status === "Draft" ? `<button class="mini approve" title="Edit demand rows" data-edit-demand="${group.row.id}">Edit</button>` : `<span class="reason-text">Submitted</span>`}</td>
        <td class="cell-action">${itemDetailButton("request", group.row.id)}</td>
      </tr>`).join("")
    : `<tr><td colspan="12" class="empty-cell">No demand rows for ${currentProject}${currentProjectCode ? ` / ${currentProjectCode}` : ""}. Add items and edit demand rows first.</td></tr>`;
}
// @end-legacy-unit 1064

export function replaceAddWorksheetRowBinding(value) { addWorksheetRow = value; return value; }
