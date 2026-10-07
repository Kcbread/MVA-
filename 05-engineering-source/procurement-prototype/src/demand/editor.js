// demand/editor: authoritative source; see docs/module-map.md.
import {
  amountUsdFromVnd,
  amountVndFromUsd,
  legacyPriceToUsd
} from "../cost/currency.js";
import {
  summaryCardsHtml
} from "../cost/stage-view.js";
import {
  clampQty,
  createStationBreakdownEntry,
  demandTypeFor,
  demandTypeOptionsHtml,
  demandUnitFor,
  demandUnitOptionsHtml,
  isLongFormStationBreakdown,
  requestStageQty,
  stationBreakdownPhaseKey,
  stationBreakdownPhaseTotal,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail,
  stationBreakdownRowsForProject,
  syncRowPhaseQtyFromStationBreakdown,
  totalQty
} from "./quantity.js";
import {
  canRequesterEditRequest
} from "./request-fields.js";
import {
  renderSelectedDemandLines
} from "./selected-lines.js";
import {
  activeDemandRequestId,
  expandedDemandEditorCarryoverRows,
  lastDemandType,
  replaceActiveDemandRequestIdBinding,
  replaceRequestsBinding,
  requests
} from "./state.js";
import {
  renderSubmissionRows
} from "./submission-view.js";
import {
  renderRequestRows
} from "./worksheet-actions.js";
import {
  renderDepartment
} from "./workspace.js";
import {
  requestCarryoverPhase,
  updateRequestCarryover
} from "../inventory/suggestions.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  factoryMaterialNoFor
} from "../materials/identity.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER,
  currentStageForProject
} from "../projects/config.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRequesterPersona
} from "../session/persona.js";
import {
  currentRole
} from "../session/state.js";
import {
  compactList
} from "../shared/detail-view.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 1071 11979
export function demandEditorRowsFor(row) {
  return stationBreakdownRowsForDetail(row);
}
// @end-legacy-unit 1071

// @legacy-unit 1072 11983
export function openDemandEditor(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  replaceActiveDemandRequestIdBinding(requestId);
  renderDemandEditor();
  document.getElementById("demandEditorModal").hidden = false;
}
// @end-legacy-unit 1072

// @legacy-unit 1073 11991
export function closeDemandEditor() {
  replaceActiveDemandRequestIdBinding("");
  const modal = document.getElementById("demandEditorModal");
  if (modal) modal.hidden = true;
}
// @end-legacy-unit 1073

// @legacy-unit 1074 11997
export function demandEditorSummaryCards(row) {
  const rows = demandEditorRowsFor(row).filter((item) => stationBreakdownRowTotal(item) > 0);
  const phaseTotals = STAGES
    .map((stage) => `${STAGE_LABELS[stage]} ${stationBreakdownPhaseTotal(row, stage)}`)
    .filter((text) => !text.endsWith(" 0"))
    .join(" / ") || "No phase qty";
  const stationTotals = new Map();
  const unitTotals = new Map();
  rows.forEach((item) => {
    const qty = stationBreakdownRowTotal(item);
    const demandType = demandTypeFor(item);
    if (demandType === DEMAND_TYPE_MFG) stationTotals.set(item.station || "-", (stationTotals.get(item.station || "-") || 0) + qty);
    else unitTotals.set(item.demandUnit || "-", (unitTotals.get(item.demandUnit || "-") || 0) + qty);
  });
  return summaryCardsHtml([
    { label: "Total Qty", value: totalQty(row), helper: phaseTotals, variant: "hero" },
    { label: "Demand Rows", value: rows.length, helper: rows.length ? "Rows with qty > 0" : "Add demand rows before submit" },
    { label: "By Station", value: stationTotals.size || "-", helper: compactList(new Set([...stationTotals.entries()].map(([station, qty]) => `${station} ${qty}`)), "No station qty") },
    { label: "By 需求單位", value: unitTotals.size || "-", helper: compactList(new Set([...unitTotals.entries()].map(([unit, qty]) => `${unit} ${qty}`)), "No unit qty") },
  ]);
}
// @end-legacy-unit 1074

// @legacy-unit 1075 12019
export function lineOptionsHtml(selectedValue, blankLabel = "Select line") {
  const selected = String(selectedValue || "");
  const values = ["Line 1", "Line 2", "Line 3", "Line 4"];
  return [
    `<option value="" ${selected ? "" : "selected"}>${blankLabel}</option>`,
    ...values.map((line) => `<option value="${line}" ${line === selected ? "selected" : ""}>${line}</option>`),
  ].join("");
}
// @end-legacy-unit 1075

// @legacy-unit 1076 12028
export function userCarryoverUnitPriceVnd(row) {
  const explicitVnd = Number(row.updatedPriceVnd || row.unitPriceVnd || row.estimatedUnitPriceVnd || 0);
  if (explicitVnd > 0) return explicitVnd;
  const unitPriceUsd = legacyPriceToUsd(row, "updatedPrice")
    || legacyPriceToUsd(row, "unitPrice")
    || legacyPriceToUsd(row, "estimatedUnitPrice");
  if (unitPriceUsd > 0) return Math.round(amountVndFromUsd(unitPriceUsd));
  const estimatedAmountUsd = Number(row.estimatedAmountUsd || 0) || amountUsdFromVnd(clampQty(row.estimatedAmount));
  const qty = totalQty(row) || 1;
  return estimatedAmountUsd > 0 ? Math.round(amountVndFromUsd(estimatedAmountUsd / qty)) : 0;
}
// @end-legacy-unit 1076

// @legacy-unit 1077 12040
export function isValidCarryoverLinePair(requestLine, carryoverFrom) {
  const request = String(requestLine || "").trim();
  const source = String(carryoverFrom || "").trim();
  return Boolean(request && source && request !== source);
}
// @end-legacy-unit 1077

// @legacy-unit 1078 12046
export function demandEditorCarryoverKey(requestId, breakdownId) {
  return `${requestId || ""}:${breakdownId || ""}`;
}
// @end-legacy-unit 1078

// @legacy-unit 1079 12050
export function normalizeDemandBreakdownCarryover(breakdown) {
  const next = { ...breakdown };
  const originalQty = stationBreakdownRowTotal(next);
  next.carryoverQty = Math.min(originalQty, clampQty(next.carryoverQty));
  return next;
}
// @end-legacy-unit 1079

// @legacy-unit 1080 12057
export function demandEditorCarryoverSummary(item) {
  const qty = clampQty(item.carryoverQty);
  const validPair = isValidCarryoverLinePair(item.requestLine, item.carryoverFrom);
  if (qty > 0 && validPair) return `${item.carryoverFrom} → ${item.requestLine} / -${qty}`;
  if (qty > 0 && !validPair) return "Line needed";
  if (item.carryoverFrom) return `${item.carryoverFrom} selected`;
  return "No carryover";
}
// @end-legacy-unit 1080

// @legacy-unit 1081 12066
export function demandEditorCarryoverHint(item) {
  const qty = clampQty(item.carryoverQty);
  if (!qty && !item.carryoverFrom) return "Optional";
  if (!isValidCarryoverLinePair(item.requestLine, item.carryoverFrom)) return "Select different source and request lines";
  return "Candidate only; Dept DRI must confirm";
}
// @end-legacy-unit 1081

// @legacy-unit 1082 12073
export function syncUserAppliedCarryoverLedger(row, breakdown) {
  const normalized = normalizeDemandBreakdownCarryover(breakdown);
  const carryoverQty = isValidCarryoverLinePair(normalized.requestLine, normalized.carryoverFrom)
    ? clampQty(normalized.carryoverQty)
    : 0;
  const sourceBreakdownId = breakdown.id || "";
  if (!sourceBreakdownId || !window.ProcurementCarryover?.recordUserAppliedCarryover) return;
  window.ProcurementCarryover.recordUserAppliedCarryover({
    requestId: row.id,
    rowId: row.id,
    packageId: row.requestPackageId || "",
    sourceRequestId: row.id,
    sourceBreakdownId,
    requestLineRowId: sourceBreakdownId,
    project: row.project,
    item: row.name,
    spec: userVisibleItemDetail(row) || itemDetail(row) || "",
    phase: STAGE_LABELS[stationBreakdownPhaseKey(normalized)] || stationBreakdownPhaseKey(normalized),
    stationOrUnit: demandTypeFor(normalized) === DEMAND_TYPE_MFG ? (normalized.station || "-") : (normalized.demandUnit || DEMAND_UNIT_FALLBACK),
    sourceProject: normalized.carryoverSourceProject || row.sourceProject || row.project || "",
    sourceStage: normalized.carryoverSourceStage || "",
    sourceStation: normalized.carryoverSourceStation || "",
    sourceEvidenceRequestId: normalized.carryoverSourceRequestId || row.sourceRecordId || "",
    sourceType: normalized.carryoverSourceType || "requester-candidate",
    targetProject: row.project,
    targetRequestId: row.id,
    requestLine: normalized.requestLine || "",
    carryoverFrom: normalized.carryoverFrom || "",
    originalQty: stationBreakdownRowTotal(normalized),
    carryoverQty,
    unitPrice: userCarryoverUnitPriceVnd(row),
    unitPriceUsd: amountUsdFromVnd(userCarryoverUnitPriceVnd(row)),
    status: "Requester Candidate",
    reviewStatus: "Pending Dept DRI",
    createdByRole: "Requester",
    confirmedBy: currentRequesterPersona()?.name || roleProfiles[currentRole]?.name || "Requester",
    reason: normalized.carryoverReason || "Requester created carryover candidate from request line editor.",
  });
}
// @end-legacy-unit 1082

// @legacy-unit 1083 12113
export function renderDemandEditorStationUnitCell(item, demandType, disabled, requestId) {
  if (demandType === DEMAND_TYPE_NON_MFG) {
    return `
      <label class="demand-editor-inline-field">
        <span>Unit</span>
        <select ${disabled} data-demand-editor-id="${requestId}" data-demand-editor-row="${item.id}" data-demand-editor-field="demandUnit">
          ${demandUnitOptionsHtml(item.demandUnit)}
        </select>
      </label>`;
  }
  return `
    <label class="demand-editor-inline-field">
      <span>Station</span>
      <select ${disabled} data-demand-editor-id="${requestId}" data-demand-editor-row="${item.id}" data-demand-editor-field="station">
        ${STATION_MASTER.map((station) => `<option value="${station}" ${station === item.station ? "selected" : ""}>${station}</option>`).join("")}
      </select>
    </label>`;
}
// @end-legacy-unit 1083

// @legacy-unit 1084 12132
export function renderDemandEditorCarryoverSection(row, item, disabled) {
  const key = demandEditorCarryoverKey(row.id, item.id);
  const expanded = expandedDemandEditorCarryoverRows.has(key);
  if (!expanded) return "";
  const originalQty = stationBreakdownRowTotal(item);
  const normalized = normalizeDemandBreakdownCarryover(item);
  const warning = clampQty(item.carryoverQty) > 0 && !isValidCarryoverLinePair(item.requestLine, item.carryoverFrom)
    ? "Carryover needs a different source line and request line before Dept DRI can review it."
    : clampQty(item.carryoverQty) > originalQty
      ? `Carryover will be capped at ${originalQty}.`
      : "Candidate only; Dept DRI approved rows reduce effective cost.";
  return `
    <tr class="demand-editor-carryover-row" data-demand-editor-carryover-section="${htmlAttr(key)}">
      <td colspan="8">
        <div class="demand-editor-carryover-panel">
          <label>
            <span>Carryover From</span>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="carryoverFrom">
              ${lineOptionsHtml(item.carryoverFrom, "No carryover")}
            </select>
          </label>
          <label>
            <span>Carryover Qty</span>
            <input ${disabled} class="compact-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="${clampQty(normalized.carryoverQty)}" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="carryoverQty" />
          </label>
          <label class="carryover-reason-field">
            <span>Reason</span>
            <input ${disabled} type="text" value="${htmlAttr(item.carryoverReason || "")}" placeholder="Why can prior line stock cover this demand?" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="carryoverReason" />
          </label>
          <div class="demand-editor-carryover-hint">${htmlText(warning)}</div>
        </div>
      </td>
    </tr>`;
}
// @end-legacy-unit 1084

// @legacy-unit 1085 12167
export function renderDemandEditorMfgGuide(row, rows) {
  const target = document.getElementById("demandEditorMfgGuide");
  if (!target) return;
  const hasMfg = rows.some((item) => demandTypeFor(item) === DEMAND_TYPE_MFG) || !rows.length;
  if (!hasMfg) {
    target.innerHTML = `
      <section class="mfg-demand-guide-card non-mfg-guide">
        <strong>Non-MFG input logic</strong>
        <span>Use demand unit → item. Station is not required.</span>
      </section>`;
    return;
  }
  const activePhase = stationBreakdownPhaseKey(rows[rows.length - 1] || {}) || requestCarryoverPhase(row.project);
  const stationGroups = [
    ["Mainline", ["CG", "BG", "FATP", "Test", "Hybrid", "Auto"]],
    ["Packing", ["ENG Pack", "Zombie", "Laser_pico", "Rework"]],
    ["Supporting", ["Repair", "WH"]],
  ];
  target.innerHTML = `
    <section class="mfg-demand-guide-card">
      <div>
        <strong>MFG input logic: Stage → Station → Item</strong>
        <span class="muted">All Mainline / Packing / Supporting station demand is entered by the requester mapped to this project and department.</span>
      </div>
      <div class="mfg-stage-tabs">
        ${STAGES.map((stage) => `<span class="stage-chip ${stage === activePhase ? "active" : ""}">${STAGE_LABELS[stage]}</span>`).join("")}
      </div>
      <div class="mfg-station-groups">
        ${stationGroups.map(([group, stations]) => `
          <div class="mfg-station-group">
            <span>${group}</span>
            <strong>${stations.join(" / ")}</strong>
          </div>`).join("")}
      </div>
    </section>`;
}
// @end-legacy-unit 1085

// @legacy-unit 1086 12204
export function renderDemandEditor() {
  const row = requests.find((item) => item.id === activeDemandRequestId);
  const modal = document.getElementById("demandEditorModal");
  if (!row || !modal) return;
  document.getElementById("demandEditorTitle").textContent = `${row.name} / Demand Detail`;
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  const rows = demandEditorRowsFor(row);
  const lastRow = rows[rows.length - 1] || {};
  const defaultPhase = stationBreakdownPhaseKey(lastRow) || requestCarryoverPhase(row.project);
  const defaultDemandType = rows.length ? demandTypeFor(lastRow) : lastDemandType;
  document.getElementById("demandEditorContext").textContent = `Project ${row.project} · Default Phase ${stageLabel(defaultPhase)} · Demand Type ${defaultDemandType} · ${userVisibleItemDetail(row) || "No spec"} · Total ${totalQty(row)}`;
  document.getElementById("demandEditorSummary").innerHTML = demandEditorSummaryCards(row);
  renderDemandEditorMfgGuide(row, rows);
  document.getElementById("demandEditorRows").innerHTML = rows.length
    ? rows.map((rawItem) => {
      const item = normalizeDemandBreakdownCarryover(rawItem);
      const phase = stationBreakdownPhaseKey(item) || currentStageForProject(row.project);
      const demandType = demandTypeFor(item);
      const carryoverKey = demandEditorCarryoverKey(row.id, item.id);
      const carryoverSummary = demandEditorCarryoverSummary(item);
      const carryoverHint = demandEditorCarryoverHint(rawItem);
      return `
        <tr class="${demandType === DEMAND_TYPE_NON_MFG ? "non-mfg-demand-row" : ""}">
          <td>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="demandType">
              ${demandTypeOptionsHtml(demandType)}
            </select>
          </td>
          <td>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="phase">
              ${STAGES.map((stage) => `<option value="${stage}" ${stage === phase ? "selected" : ""}>${STAGE_LABELS[stage]}</option>`).join("")}
            </select>
          </td>
          <td>${renderDemandEditorStationUnitCell(item, demandType, disabled, row.id)}</td>
          <td><input ${disabled} class="compact-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="${stationBreakdownRowTotal(item)}" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="qty" /></td>
          <td>
            <select ${disabled} data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="requestLine">
              ${lineOptionsHtml(item.requestLine, "Request line")}
            </select>
          </td>
          <td>
            <button class="mini demand-editor-carryover-toggle" type="button" data-demand-editor-carryover-toggle="${htmlAttr(carryoverKey)}" title="Edit line carryover">${htmlText(carryoverSummary)}</button>
            <div class="reason-text">${htmlText(carryoverHint)}</div>
          </td>
          <td><input ${disabled} type="text" value="${htmlAttr(item.remark || "")}" placeholder="Remark" data-demand-editor-id="${row.id}" data-demand-editor-row="${item.id}" data-demand-editor-field="remark" /></td>
          <td><button class="mini reject" data-remove-station-breakdown="${row.id}" data-remove-station-breakdown-row="${item.id}" ${disabled}>Remove</button></td>
        </tr>
        ${renderDemandEditorCarryoverSection(row, rawItem, disabled)}`;
    }).join("")
    : `<tr><td colspan="8" class="empty-cell">Add demand rows for phase, station or demand unit, and quantity.</td></tr>`;
}
// @end-legacy-unit 1086

// @legacy-unit 1087 12256
export function addDemandEditorRow() {
  if (!activeDemandRequestId) return;
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== activeDemandRequestId || !canRequesterEditRequest(row)) return row;
    const existingRows = stationBreakdownRowsForDetail(row);
    const lastRow = existingRows[existingRows.length - 1] || {};
    const stationBreakdown = [
      ...existingRows,
      createStationBreakdownEntry(row, {
        demandType: existingRows.length ? demandTypeFor(lastRow) : lastDemandType,
        phase: stationBreakdownPhaseKey(lastRow) || requestCarryoverPhase(row.project),
        station: lastRow.station || row.station,
        demandUnit: lastRow.demandUnit || row.demandUnit,
      }),
    ];
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  }));
  renderDemandEditor();
  renderRequestRows();
}
// @end-legacy-unit 1087

// @legacy-unit 1088 12277
export function updateDemandEditorField(requestId, breakdownId, field, value) {
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).map((item) => {
      if (item.id !== breakdownId) return item;
      const next = isLongFormStationBreakdown(item)
        ? { ...item }
        : { id: item.id, phase: currentStageForProject(row.project), station: item.station, demandUnit: item.demandUnit, qty: stationBreakdownRowTotal(item), requestLine: item.requestLine || "", carryoverFrom: item.carryoverFrom || "", carryoverQty: clampQty(item.carryoverQty), carryoverReason: item.carryoverReason || "", remark: item.remark || "" };
      if (field === "qty") next.qty = clampQty(value);
      else if (field === "requestLine") next.requestLine = value;
      else if (field === "carryoverFrom") next.carryoverFrom = value;
      else if (field === "carryoverQty") next.carryoverQty = clampQty(value);
      else if (field === "carryoverReason") next.carryoverReason = value;
      else if (field === "demandType") {
        next.demandType = demandTypeFor({ demandType: value });
        next.station = next.demandType === DEMAND_TYPE_MFG ? (next.station || STATION_MASTER[0]) : "";
        next.demandUnit = next.demandType === DEMAND_TYPE_MFG ? "" : (next.demandUnit || DEMAND_UNIT_FALLBACK);
      }
      else if (field === "demandUnit") next.demandUnit = demandTypeFor(next) === DEMAND_TYPE_MFG ? "" : demandUnitFor({ demandUnit: value });
      else if (field === "phase") next.phase = STAGES.includes(value) ? value : currentStageForProject(row.project);
      else if (field === "station") next.station = demandTypeFor(next) === DEMAND_TYPE_MFG ? (STATION_MASTER.includes(value) ? value : STATION_MASTER[0]) : "";
      else next[field] = value;
      const normalized = normalizeDemandBreakdownCarryover(next);
      updateRequestCarryover({ project: row.project, phase: normalized.phase, demandType: normalized.demandType });
      syncUserAppliedCarryoverLedger(row, normalized);
      return normalized;
    });
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  }));
  renderDemandEditor();
  renderRequestRows();
  renderSelectedDemandLines();
  renderSubmissionRows();
}
// @end-legacy-unit 1088

// @legacy-unit 1089 12312
export function renderStationBreakdownRows() {
  const itemSelect = document.getElementById("stationBreakdownItemSelect");
  const stationSelect = document.getElementById("stationStationSelect");
  const demandUnitInput = document.getElementById("stationDemandUnitInput");
  const summary = document.getElementById("stationBreakdownSummary");
  const body = document.getElementById("stationBreakdownRows");
  if (!itemSelect || !stationSelect || !summary || !body) return;
  const editableRows = stationBreakdownRowsForProject();
  const currentSelection = itemSelect.value;
  itemSelect.innerHTML = editableRows.length
    ? editableRows.map((row) => `<option value="${row.id}" ${row.id === currentSelection ? "selected" : ""}>${row.name} · ${factoryMaterialNoFor(row)}</option>`).join("")
    : `<option value="">No editable request items</option>`;
  if (currentSelection && editableRows.some((row) => row.id === currentSelection)) itemSelect.value = currentSelection;
  if (demandUnitInput && !demandUnitInput.value) demandUnitInput.value = DEMAND_UNIT_FALLBACK;
  stationSelect.innerHTML = STATION_MASTER.map((station) => `<option value="${station}">${station}</option>`).join("");
  const breakdownRows = editableRows.flatMap((row) => stationBreakdownRowsForDetail(row).map((breakdown) => ({ request: row, breakdown })));
  const itemTotal = editableRows.reduce((sum, row) => sum + totalQty(row), 0);
  const phaseSummary = STAGES.map((stage) => `${STAGE_LABELS[stage]} ${editableRows.reduce((sum, row) => sum + requestStageQty(row, stage), 0)}`).join(" / ");
  const unitTotals = new Map();
  const stationTotals = new Map();
  breakdownRows.forEach(({ breakdown }) => {
    const qty = stationBreakdownRowTotal(breakdown);
    unitTotals.set(breakdown.demandUnit || DEMAND_UNIT_FALLBACK, (unitTotals.get(breakdown.demandUnit || DEMAND_UNIT_FALLBACK) || 0) + qty);
    stationTotals.set(breakdown.station || STATION_MASTER[0], (stationTotals.get(breakdown.station || STATION_MASTER[0]) || 0) + qty);
  });
  summary.innerHTML = summaryCardsHtml([
    { label: "Items", value: editableRows.length, helper: `${breakdownRows.length} station row${breakdownRows.length === 1 ? "" : "s"}` },
    { label: "Total Qty", value: itemTotal, helper: phaseSummary },
    { label: "By 需求單位", value: unitTotals.size || "-", helper: compactList(new Set([...unitTotals.entries()].map(([unit, qty]) => `${unit} ${qty}`)), "No unit qty") },
    { label: "By Station", value: stationTotals.size || "-", helper: compactList(new Set([...stationTotals.entries()].map(([station, qty]) => `${station} ${qty}`)), "No station qty") },
  ]);
  body.innerHTML = breakdownRows.length
    ? breakdownRows.map(({ request, breakdown }) => `
      <tr>
        <td><div class="item-primary">${request.name}</div><div class="reason-text">${factoryMaterialNoFor(request)}</div></td>
        <td><input type="text" value="${breakdown.demandUnit || DEMAND_UNIT_FALLBACK}" data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="demandUnit" /></td>
        <td>
          <select data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="station">
            ${STATION_MASTER.map((station) => `<option value="${station}" ${station === breakdown.station ? "selected" : ""}>${station}</option>`).join("")}
          </select>
        </td>
        ${STAGES.map((stage) => `<td><input class="compact-input" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" value="${clampQty(breakdown[stage])}" data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="${stage}" /></td>`).join("")}
        <td>${stationBreakdownRowTotal(breakdown)}</td>
        <td><input type="text" value="${breakdown.remark || ""}" data-station-breakdown-id="${request.id}" data-station-breakdown-row="${breakdown.id}" data-station-breakdown-field="remark" /></td>
        <td><button class="mini reject" data-remove-station-breakdown="${request.id}" data-remove-station-breakdown-row="${breakdown.id}">Remove</button></td>
      </tr>`).join("")
    : `<tr><td colspan="12" class="empty-cell">Add request items first, then add station breakdown rows for demand unit and station quantity.</td></tr>`;
}
// @end-legacy-unit 1089

// @legacy-unit 1090 12361
export function addStationBreakdownRow(requestId = "", overrides = {}) {
  const targetRequestId = requestId || document.getElementById("stationBreakdownItemSelect")?.value || "";
  if (!targetRequestId) {
    showToast("Add or select a request item before adding station breakdown.", "error");
    return;
  }
  const demandUnit = demandUnitFor({ demandUnit: overrides.demandUnit || document.getElementById("stationDemandUnitInput")?.value || DEMAND_UNIT_FALLBACK });
  const station = overrides.station || document.getElementById("stationStationSelect")?.value || STATION_MASTER[0];
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== targetRequestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = [...stationBreakdownRowsForDetail(row), createStationBreakdownEntry(row, { demandUnit, station })];
    return syncRowPhaseQtyFromStationBreakdown({ ...row, demandUnit, stationBreakdown });
  }));
  renderDepartment();
  showToast("Station breakdown row added.", "success");
}
// @end-legacy-unit 1090

// @legacy-unit 1091 12378
export function updateStationBreakdownField(requestId, breakdownId, field, value) {
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).map((breakdown) => {
      if (breakdown.id !== breakdownId) return breakdown;
      const nextValue = field === "demandUnit" ? demandUnitFor({ demandUnit: value }) : STAGES.includes(field) ? clampQty(value) : value;
      return { ...breakdown, [field]: nextValue };
    });
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  }));
  renderStationBreakdownRows();
  renderRequestRows();
  renderSubmissionRows();
}
// @end-legacy-unit 1091

// @legacy-unit 1092 12393
export function removeStationBreakdownRow(requestId, breakdownId) {
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const stationBreakdown = stationBreakdownRowsForDetail(row).filter((breakdown) => breakdown.id !== breakdownId);
    return syncRowPhaseQtyFromStationBreakdown({ ...row, stationBreakdown });
  }));
  renderDepartment();
  if (activeDemandRequestId === requestId) renderDemandEditor();
  showToast("Station breakdown row removed.", "success");
}
// @end-legacy-unit 1092

export function replaceCloseDemandEditorBinding(value) { closeDemandEditor = value; return value; }

export function replaceUserCarryoverUnitPriceVndBinding(value) { userCarryoverUnitPriceVnd = value; return value; }
