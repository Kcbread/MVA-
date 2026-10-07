// catalog/search: authoritative source; see docs/module-map.md.
import {
  phaseQtySummary,
  renderHistoryPackageRows,
  reusableHistoryRows,
  sourceLineForHistory
} from "./history-view.js";
import {
  itemNameMatchRank,
  materialDuplicateCandidateRows
} from "./match.js";
import {
  isOmCatalogRow,
  omCatalogRows
} from "./records.js";
import {
  replaceRequestCatalogApiKeyBinding,
  replaceRequestCatalogApiRowsBinding,
  replaceRequestCatalogApiStatusBinding,
  replaceRequestCatalogApiTimerBinding,
  replaceRequestItemPickerLevel1Binding,
  replaceRequestItemPickerLevel2Binding,
  replaceRequestItemPickerLevel3Binding,
  replaceRequestItemPickerQueryBinding,
  replaceRequestItemPickerSourceModeBinding,
  requestCatalogApiKey,
  requestCatalogApiRows,
  requestCatalogApiStatus,
  requestCatalogApiTimer,
  requestItemPickerLevel1,
  requestItemPickerLevel2,
  requestItemPickerLevel3,
  requestItemPickerQuery,
  requestItemPickerSourceMode
} from "./state.js";
import {
  fillSelect,
  level1Options,
  level2Options,
  level3Options
} from "./taxonomy.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  requestActionOtherTextValue,
  requestActionValue
} from "../demand/intent.js";
import {
  createStationBreakdownEntry
} from "../demand/quantity.js";
import {
  canRequesterEditRequest
} from "../demand/request-fields.js";
import {
  replaceRequestWorksheetSelectedSourceBinding,
  requestWorksheetActiveCell,
  requestWorksheetAddPhase,
  requestWorksheetAddQuery,
  requestWorksheetLine,
  requestWorksheetMode,
  requestWorksheetSelectedSource,
  requests
} from "../demand/state.js";
import {
  requestWorksheetPhaseTotal,
  requestWorksheetQtyInput,
  requestWorksheetRowTotal
} from "../demand/worksheet.js";
import {
  activePhaseText,
  draftDemandItemCell,
  requestWorksheetColumns,
  syncRequestWorksheetContext
} from "../demand/worksheet-view.js";
import {
  apiModeEnabled,
  apiRequest
} from "../infrastructure/api.js";
import {
  requestWorksheetMatrixModule
} from "../infrastructure/module-adapters.js";
import {
  itemDetail,
  itemDetailButton,
  stripBrandForRequester,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  createNewItemSuggestion
} from "../materials/new-item.js";
import {
  DEFAULT_PURPOSE_LOCATION,
  DEMAND_TYPE_MFG,
  PURPOSE_LOCATION_OPTIONS,
  REQUEST_ACTION_OPTIONS,
  REQUEST_ACTION_OTHER,
  STAGES,
  rowMatchesCurrentRequesterProjectScope
} from "../projects/config.js";
import {
  dateOnly,
  normalizePurposeLocation
} from "../projects/dates.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  normalize,
  stableHash,
  statusClass
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 1027 11268
export function requestWorksheetSourceBadge(label) {
  return `<span class="request-source-badge ${statusClass(label)}">${htmlText(label)}</span>`;
}
// @end-legacy-unit 1027

// @legacy-unit 1028 11272
export function requestWorksheetSourceHaystack(row) {
  return normalize([row.name, row.item, row.standardNameCn, row.standardNameEn, row.standardNameVn, requesterPickerSpec(row)].filter(Boolean).join(" "));
}
// @end-legacy-unit 1028

// @legacy-unit 1029 11276
export function requesterPickerSpec(row = {}) {
  return stripBrandForRequester(row.spec || userVisibleItemDetail(row) || "");
}
// @end-legacy-unit 1029

// @legacy-unit 1030 11280
export function catalogRowFromApiItem(item = {}) {
  const name = item.name || item.item || "Catalog item";
  const spec = item.spec || item.detail || "";
  return {
    id: `DBCAT-${item.itemId || item.id || stableHash(`${name}|${spec}`)}`,
    itemId: item.itemId || item.id || "",
    project: currentProject,
    yearProject: currentProject,
    projectCode: currentProjectCode,
    sourceProject: "DB Catalog",
    source: "db-catalog",
    name,
    detail: item.detail || spec,
    spec,
    level1: item.lv1 || item.level1 || "",
    level2: item.lv2 || item.level2 || "",
    level3: item.lv3 || item.level3 || "",
    category: item.category || [item.lv1, item.lv2, item.lv3].filter(Boolean).join(" / "),
    materialCodingReviewStatus: item.materialCodingReviewStatus || "",
    materialStatus: item.materialCodingReviewStatus || "Active Catalog",
    unitPrice: 0,
    qty: 0,
    p10: 0,
    p11: 0,
    evt: 0,
    dvt: 0,
    pvt: 0,
    mp: 0,
    requesterReason: "Selected from DB catalog. Quantity starts at 0.",
  };
}
// @end-legacy-unit 1030

// @legacy-unit 1031 11312
export function requestCatalogApiParams() {
  const params = new URLSearchParams();
  params.set("limit", "200");
  if (requestItemPickerQuery.trim()) params.set("q", requestItemPickerQuery.trim());
  if (requestItemPickerLevel1) params.set("lv1", requestItemPickerLevel1);
  if (requestItemPickerLevel2) params.set("lv2", requestItemPickerLevel2);
  if (requestItemPickerLevel3) params.set("lv3", requestItemPickerLevel3);
  return params;
}
// @end-legacy-unit 1031

// @legacy-unit 1032 11322
export async function hydrateRequestCatalogItems({ force = false } = {}) {
  if (!apiModeEnabled() || requestItemPickerSourceMode !== "catalog") return;
  const params = requestCatalogApiParams();
  const key = params.toString();
  if (!force && requestCatalogApiKey === key && requestCatalogApiStatus === "loaded") return;
  replaceRequestCatalogApiKeyBinding(key);
  replaceRequestCatalogApiStatusBinding("loading");
  try {
    const payload = await apiRequest(`/api/catalog/items?${params.toString()}`);
    if (requestCatalogApiKey !== key) return;
    replaceRequestCatalogApiRowsBinding(Array.isArray(payload.items) ? payload.items.map(catalogRowFromApiItem) : []);
    replaceRequestCatalogApiStatusBinding("loaded");
  } catch (error) {
    if (requestCatalogApiKey === key) replaceRequestCatalogApiStatusBinding("error");
    console.warn("Catalog API unavailable; using local catalog fallback.", error);
  }
  const modal = document.getElementById("requestItemPickerModal");
  if (modal && !modal.hidden) renderRequestItemPicker();
}
// @end-legacy-unit 1032

// @legacy-unit 1033 11342
export function scheduleHydrateRequestCatalogItems({ force = false } = {}) {
  if (requestCatalogApiTimer) window.clearTimeout(requestCatalogApiTimer);
  replaceRequestCatalogApiTimerBinding(window.setTimeout(() => {
    replaceRequestCatalogApiTimerBinding(null);
    hydrateRequestCatalogItems({ force });
  }, 180));
}
// @end-legacy-unit 1033

// @legacy-unit 1034 11350
export function requestWorksheetMergedSources(query = requestWorksheetAddQuery, { limit = 40 } = {}) {
  const keyword = normalize(query);
  const rawQuery = String(query || "").trim();
  const shouldUseApiCatalog = apiModeEnabled() && ["loading", "loaded"].includes(requestCatalogApiStatus);
  const activeCatalogRows = shouldUseApiCatalog
    ? requestCatalogApiRows
    : [...omCatalogRows(currentProject), ...purchaseRecords.filter(rowMatchesCurrentRequesterProjectScope)];
  const catalogRows = activeCatalogRows
    .map((row) => ({ type: "catalog", badge: "Catalog", row }));
  const reuseRows = reusableHistoryRows()
    .map((row) => ({ type: "reuse", badge: "Reuse", row }));
  const copyRows = reusableHistoryRows()
    .map((row) => ({ type: "copy", badge: "Copy Demand", row }));
  const seen = new Set();
  const rows = [...catalogRows, ...reuseRows, ...copyRows].filter((item) => {
    const key = `${item.type}:${item.row.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return !keyword || keyword.split(/\s+/).every((token) => requestWorksheetSourceHaystack(item.row).includes(token));
  }).sort((left, right) => itemNameMatchRank(right.row, query) - itemNameMatchRank(left.row, query)).slice(0, limit);
  if (keyword) {
    rows.unshift({
      type: "new",
      badge: "New Item Request",
      row: {
        id: `new:${keyword}`,
        project: currentProject,
        yearProject: currentProject,
        projectCode: currentProjectCode,
        name: rawQuery,
        detail: rawQuery,
        spec: rawQuery,
        sourceProject: currentProject,
      },
    });
  }
  return rows;
}
// @end-legacy-unit 1034

// @legacy-unit 1035 11389
export function requestItemPickerSources() {
  const sources = requestWorksheetMergedSources(requestItemPickerQuery);
  if (requestItemPickerSourceMode === "new") {
    const keyword = requestItemPickerQuery.trim();
    return keyword ? sources.filter((source) => source.type === "new") : [];
  }
  return sources
    .filter((source) => source.type === requestItemPickerSourceMode)
    .filter(requestItemPickerMatchesLevels)
    .slice(0, 40);
}
// @end-legacy-unit 1035

// @legacy-unit 1036 11401
export function requestWorksheetSourceValue(source) {
  return `${source.type}:${source.row.id}`;
}
// @end-legacy-unit 1036

// @legacy-unit 1037 11405
export function sourceFromWorksheetValue(value = "", query = requestItemPickerQuery) {
  return requestWorksheetMergedSources(query, { limit: Infinity }).find((source) => requestWorksheetSourceValue(source) === value) || null;
}
// @end-legacy-unit 1037

// @legacy-unit 1038 11409
export function requestItemPickerLevelValues(source) {
  const row = source?.row || {};
  return {
    level1: row.level1 || row.omCategoryLevel1 || "",
    level2: row.level2 || row.omCategoryLevel2 || "",
    level3: row.level3 || row.omCategoryLevel3 || "",
  };
}
// @end-legacy-unit 1038

// @legacy-unit 1039 11418
export function requestItemPickerMatchesLevels(source) {
  const levels = requestItemPickerLevelValues(source);
  return (!requestItemPickerLevel1 || levels.level1 === requestItemPickerLevel1)
    && (!requestItemPickerLevel2 || levels.level2 === requestItemPickerLevel2)
    && (!requestItemPickerLevel3 || levels.level3 === requestItemPickerLevel3);
}
// @end-legacy-unit 1039

// @legacy-unit 1040 11425
export function requestItemPickerLevelPath(source) {
  const levels = requestItemPickerLevelValues(source);
  return [levels.level1, levels.level2, levels.level3].filter(Boolean).join(" / ") || "Lv123 not classified";
}
// @end-legacy-unit 1040

// @legacy-unit 1041 11430
export function requestItemPickerSourceContext(source) {
  if (!source) return "";
  const row = source.row || {};
  if (source.type === "new") return "Create a pending material master request. Similar items must be reviewed before adding.";
  if (source.type === "copy") {
    const scope = [row.sourceProject || row.project || "-", sourceLineForHistory(row), activePhaseText(row)].filter(Boolean).join(" / ");
    const summary = phaseQtySummary(row);
    return summary ? `Copy reference: ${scope}. Source qty: ${summary}. Target qty starts at 0.` : `Copy reference: ${scope}. Target qty starts at 0.`;
  }
  if (source.type === "reuse") {
    const scope = [row.sourceProject || row.project || "-", sourceLineForHistory(row)].filter(Boolean).join(" / ");
    return `Reuse from ${scope}. Target qty starts at 0.`;
  }
  if (isOmCatalogRow(row)) return "OM catalog item. Target qty starts at 0.";
  return "Catalog row. Target qty starts at 0.";
}
// @end-legacy-unit 1041

// @legacy-unit 1042 11447
export function requestItemPickerDetailCell(source) {
  if (!source || source.type === "new") return `<span class="reason-text">Pending review</span>`;
  if (isOmCatalogRow(source.row)) return itemDetailButton("catalog", source.row.id);
  if (requests.some((row) => row.id === source.row.id)) return itemDetailButton("request", source.row.id);
  if (purchaseRecords.some((row) => row.id === source.row.id)) return itemDetailButton("record", source.row.id);
  return `<span class="reason-text">Trace only</span>`;
}
// @end-legacy-unit 1042

// @legacy-unit 1043 11455
export function requestItemPickerRowHtml(source) {
  const value = requestWorksheetSourceValue(source);
  const spec = requesterPickerSpec(source.row);
  const detailText = `${requestItemPickerLevelPath(source)}\n${requestItemPickerSourceContext(source)}`;
  return `
    <tr data-request-picker-row="${htmlAttr(value)}">
      <td class="cell-action"><button class="mini approve" type="button" data-add-worksheet-source="${htmlAttr(value)}" title="Add Demand">Add Demand</button></td>
      <td class="cell-identity request-picker-item-cell">
        <strong class="request-picker-item-name">${htmlText(source.row.name || "New Item Request")}</strong>
        <div class="request-picker-source-line">${requestWorksheetSourceBadge(source.badge)}</div>
      </td>
      <td class="cell-note-summary request-picker-detail-cell" title="${htmlAttr(detailText)}">
        <div class="request-picker-lv-path">${htmlText(requestItemPickerLevelPath(source))}</div>
        <div class="request-picker-meta-line">${htmlText(requestItemPickerSourceContext(source))}</div>
      </td>
      <td class="cell-spec-summary request-picker-spec-cell" title="${htmlAttr(spec)}"><div class="spec-summary">${htmlText(spec || "Specification not provided")}</div></td>
      <td class="cell-action">${requestItemPickerDetailCell(source)}</td>
    </tr>`;
}
// @end-legacy-unit 1043

// @legacy-unit 1044 11475
export function syncRequestItemPickerFilters() {
  const level1 = document.getElementById("requestItemPickerLevel1");
  const level2 = document.getElementById("requestItemPickerLevel2");
  const level3 = document.getElementById("requestItemPickerLevel3");
  if (!level1 || !level2 || !level3) return;
  fillSelect(level1, level1Options(), "All Lv1", requestItemPickerLevel1);
  fillSelect(level2, level2Options(requestItemPickerLevel1), requestItemPickerLevel1 ? "All Lv2" : "Select Lv1 first", requestItemPickerLevel2);
  fillSelect(level3, level3Options(requestItemPickerLevel1, requestItemPickerLevel2), requestItemPickerLevel2 ? "All Lv3" : "Select Lv2 first", requestItemPickerLevel3);
  const newItemMode = requestItemPickerSourceMode === "new";
  level1.disabled = newItemMode;
  level2.disabled = newItemMode || !requestItemPickerLevel1;
  level3.disabled = newItemMode || !requestItemPickerLevel2;
}
// @end-legacy-unit 1044

// @legacy-unit 1045 11489
export function renderRequestItemPicker() {
  const modal = document.getElementById("requestItemPickerModal");
  const target = document.getElementById("requestItemPickerTarget");
  const query = document.getElementById("requestItemPickerQuery");
  const body = document.getElementById("requestItemPickerRows");
  const copyDemandPanel = document.getElementById("requestCopyDemandPanel");
  const copyDemandActive = requestItemPickerSourceMode === "copy";
  if (target) {
    target.textContent = `${currentProject} / ${currentProjectCode || "Project code"} / ${requestWorksheetLine} / ${requestWorksheetMode}. Add item/spec; all phase qty cells start at 0.`;
  }
  if (query && query.value !== requestItemPickerQuery) query.value = requestItemPickerQuery;
  syncRequestItemPickerFilters();
  document.querySelectorAll("[data-request-picker-source-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.requestPickerSourceTab === requestItemPickerSourceMode);
  });
  if (!body) return;
  if (!modal || modal.hidden) {
    body.innerHTML = "";
    if (copyDemandPanel) copyDemandPanel.hidden = true;
    return;
  }
  if (copyDemandPanel) copyDemandPanel.hidden = !copyDemandActive;
  if (copyDemandActive) renderHistoryPackageRows();
  const rows = requestItemPickerSources().filter((source) => source.type !== "new");
  body.innerHTML = rows.length
    ? rows.map(requestItemPickerRowHtml).join("")
    : `<tr><td colspan="5" class="empty-cell">${requestItemPickerSourceMode === "new" ? "Check existing items before requesting a new item." : "No matching items. Try another name, specification, or category."}</td></tr>`;
  let newAction = document.getElementById("requestItemPickerNewAction");
  if (!newAction) {
    newAction = document.createElement("div");
    newAction.id = "requestItemPickerNewAction";
    newAction.className = "request-picker-new-action";
    body.closest(".request-item-picker-shell").after(newAction);
  }
  newAction.hidden = copyDemandActive;
  newAction.innerHTML = `<button class="ghost" type="button" data-action="startNewItemRequest">No suitable item? Request new item</button>`;
}
// @end-legacy-unit 1045

// @legacy-unit 1046 11527
export function startNewItemRequest() {
  createNewItemSuggestion({ query: requestItemPickerQuery.trim(), duplicateCandidates: materialDuplicateCandidateRows(requestItemPickerQuery) });
}
// @end-legacy-unit 1046

// @legacy-unit 1047 11531
export function openRequestItemPicker() {
  syncRequestWorksheetContext();
  replaceRequestItemPickerQueryBinding("");
  replaceRequestItemPickerLevel1Binding("");
  replaceRequestItemPickerLevel2Binding("");
  replaceRequestItemPickerLevel3Binding("");
  replaceRequestItemPickerSourceModeBinding(["catalog", "reuse", "copy", "new"].includes(requestItemPickerSourceMode) ? requestItemPickerSourceMode : "catalog");
  const modal = document.getElementById("requestItemPickerModal");
  if (modal) modal.hidden = false;
  hydrateRequestCatalogItems({ force: true });
  renderRequestItemPicker();
  document.getElementById("requestItemPickerQuery")?.focus();
}
// @end-legacy-unit 1047

// @legacy-unit 1048 11545
export function closeRequestItemPicker() {
  const modal = document.getElementById("requestItemPickerModal");
  if (modal) modal.hidden = true;
}
// @end-legacy-unit 1048

// @legacy-unit 1049 11550
export function selectedRequestWorksheetSource() {
  const sources = requestWorksheetMergedSources();
  const selected = sources.find((source) => requestWorksheetSourceValue(source) === requestWorksheetSelectedSource) || sources[0] || null;
  replaceRequestWorksheetSelectedSourceBinding(selected ? requestWorksheetSourceValue(selected) : "");
  return selected;
}
// @end-legacy-unit 1049

// @legacy-unit 1050 11557
export function requestWorksheetSourceOptionsHtml() {
  const sources = requestWorksheetMergedSources();
  if (!sources.length) return `<option value="">Search item/spec to add</option>`;
  selectedRequestWorksheetSource();
  return sources.map((source) => {
    const spec = userVisibleItemDetail(source.row) || itemDetail(source.row) || "";
    const label = `[${source.badge}] ${source.row.name || "-"}${spec ? ` / ${spec}` : ""}`;
    return `<option value="${htmlAttr(requestWorksheetSourceValue(source))}" ${requestWorksheetSourceValue(source) === requestWorksheetSelectedSource ? "selected" : ""}>${htmlText(label)}</option>`;
  }).join("");
}
// @end-legacy-unit 1050

// @legacy-unit 1051 11568
export function requestWorksheetTableColspan() {
  return 1 + STAGES.length * (requestWorksheetColumns().length + 1) + 3;
}
// @end-legacy-unit 1051

// @legacy-unit 1052 11572
export function requestWorksheetPhaseCells(row, phase) {
  return [
    ...requestWorksheetColumns().map((column) => `<td class="cell-number request-matrix-cell" data-request-phase-cell="${phase}" data-request-phase-column="${htmlAttr(column)}">${requestWorksheetQtyInput(row, phase, column)}</td>`),
    `<td class="cell-number request-phase-total-cell"><strong>${requestWorksheetPhaseTotal(row, phase)}</strong></td>`,
  ].join("");
}
// @end-legacy-unit 1052

// @legacy-unit 1053 11579
export function requestWorksheetHintCell(row) {
  const badges = [];
  if (row.itemMasterRequestStatus === "Pending Material Review" || row.source === "new-item-master") badges.push("Pending Material Review");
  else if (row.materialStatus === "New Item Request" || row.source === "new-item-request") badges.push("New Item Request");
  else if (row.sourceProject && row.sourceProject !== currentProject && row.sourceProject !== "OM Catalog") badges.push("Reuse / Copy");
  else if (row.sourceProject === "OM Catalog" || isOmCatalogRow(row)) badges.push("Catalog");
  if (requestWorksheetRowTotal(row) > 0) badges.push("Carryover Detail");
  const hintHtml = badges.length
    ? badges.slice(0, 2).map(requestWorksheetSourceBadge).join("")
    : `<span class="reason-text">Row detail</span>`;
  return `
    <div class="request-hint-stack">
      <div class="request-hint-badges">${hintHtml}</div>
      ${requestWorksheetPurposeControl(row)}
      ${requestWorksheetRequiredDeliveryDateControl(row)}
      ${requestWorksheetActionControl(row)}
    </div>`;
}
// @end-legacy-unit 1053

// @legacy-unit 1054 11598
export function requestWorksheetPurposeControl(row) {
  const purposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose || DEFAULT_PURPOSE_LOCATION);
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  return `
    <label class="request-purpose-control">
      <span>Purpose</span>
      <select ${disabled} data-request-purpose-location="${htmlAttr(row.id)}" aria-label="Purpose for ${htmlAttr(row.name || "request item")}">
        ${PURPOSE_LOCATION_OPTIONS.map((option) => `<option value="${htmlAttr(option)}" ${option === purposeLocation ? "selected" : ""}>${htmlText(option)}</option>`).join("")}
      </select>
    </label>`;
}
// @end-legacy-unit 1054

// @legacy-unit 1055 11610
export function requestWorksheetRequiredDeliveryDateControl(row) {
  const value = dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || "");
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  return `
    <label class="request-required-delivery-control">
      <span>Required Delivery Date</span>
      <input ${disabled} type="date" value="${htmlAttr(value)}" data-request-required-delivery-date="${htmlAttr(row.id)}" aria-label="Required Delivery Date for ${htmlAttr(row.name || "request item")}" />
    </label>`;
}
// @end-legacy-unit 1055

// @legacy-unit 1056 11620
export function requestWorksheetActionControl(row) {
  const requestAction = requestActionValue(row);
  const otherText = requestActionOtherTextValue(row);
  const editable = canRequesterEditRequest(row);
  if (!editable) {
    return `
      <div class="request-action-control readonly" title="${htmlAttr(otherText || requestAction)}">
        <span class="request-action-label">Action</span>
        <span class="saved-badge ${requestAction === REQUEST_ACTION_OTHER ? "pending" : ""}">${htmlText(requestAction)}</span>
        ${requestAction === REQUEST_ACTION_OTHER && otherText ? `<div class="request-action-other-preview">${htmlText(otherText)}</div>` : ""}
      </div>`;
  }
  return `
    <div class="request-action-control">
      <select class="request-action-select" data-request-action="${htmlAttr(row.id)}" aria-label="Requester action for ${htmlAttr(row.name || "request item")}">
        ${REQUEST_ACTION_OPTIONS.map((option) => `<option value="${htmlAttr(option)}" ${option === requestAction ? "selected" : ""}>${htmlText(option)}</option>`).join("")}
      </select>
      ${requestAction === REQUEST_ACTION_OTHER ? `
        <input class="request-action-other-input" data-request-action-other="${htmlAttr(row.id)}" type="text" maxlength="80" required
          value="${htmlAttr(otherText)}" placeholder="Other action" aria-label="Other action detail for ${htmlAttr(row.name || "request item")}" />` : ""}
    </div>`;
}
// @end-legacy-unit 1056

// @legacy-unit 1057 11643
export function requestWorksheetDataRowHtml(row) {
  return requestWorksheetMatrixModule().renderRow?.({
    row,
    stages: STAGES,
    phaseCellHtml: (phase) => requestWorksheetPhaseCells(row, phase),
    rowTotal: requestWorksheetRowTotal(row),
    hintHtml: requestWorksheetHintCell(row),
    actionHtml: `
      <div class="action-stack">
        ${itemDetailButton("request", row.id)}
        ${canRequesterEditRequest(row) ? `<button class="mini reject" data-request-worksheet-remove="${htmlAttr(row.id)}">Remove</button>` : ""}
      </div>`,
    itemHtml: draftDemandItemCell(row),
    isActiveRow: row.id === requestWorksheetActiveCell.requestId,
  }) || "";
}
// @end-legacy-unit 1057

// @legacy-unit 1058 11660
export function requestWorksheetSeedBreakdown(record, { phase = requestWorksheetAddPhase, mode = requestWorksheetMode } = {}) {
  const firstColumn = requestWorksheetColumns(mode)[0] || "";
  return createStationBreakdownEntry({ ...record, project: currentProject }, {
    phase,
    demandType: mode,
    station: mode === DEMAND_TYPE_MFG ? firstColumn : "",
    demandUnit: mode === DEMAND_TYPE_MFG ? "" : firstColumn,
    requestLine: requestWorksheetLine,
    qty: 0,
  });
}
// @end-legacy-unit 1058

export function replaceRequestWorksheetSourceHaystackBinding(value) { requestWorksheetSourceHaystack = value; return value; }

export function replaceRequesterPickerSpecBinding(value) { requesterPickerSpec = value; return value; }

export function replaceRequestWorksheetMergedSourcesBinding(value) { requestWorksheetMergedSources = value; return value; }

export function replaceRequestItemPickerSourcesBinding(value) { requestItemPickerSources = value; return value; }

export function replaceOpenRequestItemPickerBinding(value) { openRequestItemPicker = value; return value; }
