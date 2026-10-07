// demand/worksheet-view: authoritative source; see docs/module-map.md.
import {
  timelineFor
} from "../approval/audit-view.js";
import {
  sourceLineForHistory
} from "../catalog/history-view.js";
import {
  requestWorksheetSourceBadge
} from "../catalog/search.js";
import {
  itemPickerDemandType,
  itemPickerDemandUnit,
  itemPickerRequestLine,
  itemPickerStage,
  itemPickerStation,
  replaceItemPickerDemandTypeBinding,
  replaceItemPickerDemandUnitBinding,
  replaceItemPickerRequestLineBinding,
  replaceItemPickerStageBinding,
  replaceItemPickerStationBinding
} from "../catalog/state.js";
import {
  amendmentBadgeHtml
} from "./amendments.js";
import {
  demandUnitOptionsHtml,
  requestStageQty,
  stationBreakdownHasDemand
} from "./quantity.js";
import {
  canRequesterEditRequest
} from "./request-fields.js";
import {
  selectedDemandLineContext
} from "./selected-lines.js";
import {
  replaceRequestWorksheetAddPhaseBinding,
  replaceRequestWorksheetLineBinding,
  replaceRequestWorksheetModeBinding,
  replaceRequestWorksheetVisiblePhaseBinding,
  requestWorksheetAddPhase,
  requestWorksheetLine,
  requestWorksheetMode,
  requestWorksheetVisiblePhase
} from "./state.js";
import {
  horizontalTableNavigatorModule,
  requestWorksheetMatrixModule
} from "../infrastructure/module-adapters.js";
import {
  requestCarryoverPhase,
  updateRequestCarryover
} from "../inventory/suggestions.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  itemOwnerLabel
} from "../om/ownership.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  QUANTITY_DASHBOARD_UNITS,
  STAGES,
  STAGE_LABELS,
  STATION_MASTER,
  projectScopeLabel,
  projectTypeFor
} from "../projects/config.js";
import {
  requestPhaseLineOpenDateMap,
  requestPhaseLineOpenDateSource
} from "../projects/dates.js";
import {
  currentProject
} from "../projects/state.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 981 10820
export function activePhaseText(row) {
  return STAGES
    .map((stage) => `${STAGE_LABELS[stage]} ${requestStageQty(row, stage)}`)
    .filter((text) => !text.endsWith(" 0"))
    .join(" / ") || "No phase qty";
}
// @end-legacy-unit 981

// @legacy-unit 982 10827
export function compactItemMeta(row) {
  return [
    projectTypeFor(row.project),
    activePhaseText(row),
    itemOwnerLabel(row),
  ].filter(Boolean).join(" · ");
}
// @end-legacy-unit 982

// @legacy-unit 983 10835
export function draftTimelineCell(row) {
  if (row.status !== "Draft") return `<div class="timeline table-timeline">${timelineFor(row)}</div>`;
  return `
    <div class="timeline table-timeline draft-timeline">
      <span class="timeline-step current"><strong>Draft</strong><small>Editable</small></span>
      <span class="timeline-step ${stationBreakdownHasDemand(row) ? "done" : ""}"><strong>Demand</strong><small>${stationBreakdownHasDemand(row) ? "Ready" : "Need qty"}</small></span>
      <span class="timeline-step"><strong>Submit</strong><small>Pending</small></span>
    </div>`;
}
// @end-legacy-unit 983

// @legacy-unit 984 10845
export function draftDemandScopeCell(row) {
  const context = selectedDemandLineContext(row);
  const disabled = canRequesterEditRequest(row) ? "" : "disabled";
  return `
    <div class="item-primary">${context.demandType} · ${stageLabel(context.phase)}</div>
    <div class="reason-text request-compact-meta">${projectScopeLabel(row)} · ${context.requestLine}</div>
    ${context.demandType === DEMAND_TYPE_NON_MFG ? `
      <select class="request-unit-select" data-request-demand-unit="${htmlAttr(row.id)}" ${disabled} aria-label="Demand unit for ${htmlAttr(row.name || "request item")}">
        ${demandUnitOptionsHtml(context.stationOrUnit)}
      </select>` : `<div class="reason-text request-compact-meta">${context.stationOrUnit}</div>`}
    ${amendmentBadgeHtml(row)}`;
}
// @end-legacy-unit 984

// @legacy-unit 985 10858
export function draftDemandItemCell(row) {
  const spec = userVisibleItemDetail(row) || itemDetail(row) || "";
  const pendingMaster = row.itemMasterRequestStatus === "Pending Material Review" || row.source === "new-item-master";
  return `
    <div class="request-item-spec-stack" title="${htmlAttr([row.name, spec].filter(Boolean).join("\n"))}">
      <div class="item-primary request-item-name">${htmlText(row.name || "-")}</div>
      ${pendingMaster ? `<div class="request-picker-source-line">${requestWorksheetSourceBadge("Pending Material Review")}</div>` : ""}
      <div class="request-spec-divider" aria-hidden="true"></div>
      <div class="request-spec-summary cell-spec-clamp">${htmlText(spec || "-")}</div>
    </div>`;
}
// @end-legacy-unit 985

// @legacy-unit 986 10870
export function requestSourceTraceCell(row) {
  const sourceProject = row.sourceProject || "";
  const sourceLine = row.sourceLine || sourceLineForHistory(row);
  const targetLine = selectedDemandLineContext(row).requestLine;
  const copied = sourceProject && sourceProject !== "OM Catalog";
  if (!copied) return `<span class="reason-text">New draft</span>`;
  return `
    <div class="source-trace-block" title="${htmlAttr(`Target ${projectScopeLabel(row)} / ${targetLine}\nCopied from ${sourceProject} / ${sourceLine}`)}">
      <strong>Target ${htmlText(projectScopeLabel(row))} / ${htmlText(targetLine)}</strong>
      <span>Copied from ${htmlText(sourceProject)} / ${htmlText(sourceLine)}</span>
      <small>Qty starts at 0</small>
    </div>`;
}
// @end-legacy-unit 986

// @legacy-unit 987 10884
export function syncRequestWorksheetContext(overrides = {}) {
  const nextMode = overrides.mode || requestWorksheetMode || itemPickerDemandType || DEMAND_TYPE_MFG;
  replaceRequestWorksheetModeBinding(nextMode === DEMAND_TYPE_NON_MFG ? DEMAND_TYPE_NON_MFG : DEMAND_TYPE_MFG);
  const nextLine = String(overrides.requestLine || requestWorksheetLine || itemPickerRequestLine || "Line 1");
  replaceRequestWorksheetLineBinding(/^Line\s+[1-4]$/i.test(nextLine) ? nextLine.replace(/^line/i, "Line") : "Line 1");
  replaceRequestWorksheetAddPhaseBinding(STAGES.includes(overrides.phase)
    ? overrides.phase
    : (STAGES.includes(requestWorksheetAddPhase) ? requestWorksheetAddPhase : requestCarryoverPhase(currentProject)));
  replaceItemPickerDemandTypeBinding(requestWorksheetMode);
  replaceItemPickerRequestLineBinding(requestWorksheetLine);
  replaceItemPickerStageBinding(requestWorksheetAddPhase);
  if (requestWorksheetMode === DEMAND_TYPE_MFG) {
    replaceItemPickerStationBinding(STATION_MASTER[0]);
    replaceItemPickerDemandUnitBinding(DEMAND_UNIT_FALLBACK);
  } else {
    replaceItemPickerStationBinding("");
    replaceItemPickerDemandUnitBinding(requestWorksheetColumns(DEMAND_TYPE_NON_MFG)[0] || DEMAND_UNIT_FALLBACK);
  }
  updateRequestCarryover({ project: currentProject, phase: requestWorksheetAddPhase, demandType: requestWorksheetMode });
}
// @end-legacy-unit 987

// @legacy-unit 988 10905
export function syncRequestWorksheetTabs() {
  document.querySelectorAll("[data-request-worksheet-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.requestWorksheetTab === requestWorksheetMode);
  });
}
// @end-legacy-unit 988

// @legacy-unit 989 10911
export function requestWorksheetColumns(mode = requestWorksheetMode) {
  return mode === DEMAND_TYPE_NON_MFG
    ? QUANTITY_DASHBOARD_UNITS.filter((unit) => unit !== "MFG")
    : STATION_MASTER;
}
// @end-legacy-unit 989

// @legacy-unit 990 10917
export function renderRequestWorksheetHead() {
  const head = document.getElementById("requestWorksheetHead");
  if (!head) return;
  syncRequestWorksheetContext();
  const columns = requestWorksheetColumns().map((column) => htmlText(column));
  const module = requestWorksheetMatrixModule();
  head.innerHTML = module.renderHead?.({
    stages: STAGES,
    stageLabels: STAGE_LABELS,
    columns,
    phaseLineOpenDates: requestPhaseLineOpenDateMap(currentProject),
    phaseLineOpenSource: requestPhaseLineOpenDateSource(),
  }) || "";
}
// @end-legacy-unit 990

// @legacy-unit 991 10932
export function syncRequestWorksheetVisiblePhase() {
  const module = horizontalTableNavigatorModule();
  const snapshot = module.currentGroup?.("requestWorksheet") || {};
  replaceRequestWorksheetVisiblePhaseBinding(snapshot.currentGroupId || requestWorksheetVisiblePhase || STAGES[0]);
  const indicator = document.getElementById("requestWorksheetCurrentPhaseIndicator");
  if (indicator) {
    indicator.textContent = "";
    indicator.hidden = true;
  }
  document.querySelectorAll("[data-request-phase-jump]").forEach((button) => {
    button.classList.toggle("active", button.dataset.requestPhaseJump === requestWorksheetVisiblePhase);
  });
}
// @end-legacy-unit 991

// @legacy-unit 992 10946
export function renderRequestWorksheetPhaseJumpBar() {
  const target = document.getElementById("requestWorksheetPhaseJumpBar");
  if (!target) return;
  target.innerHTML = requestWorksheetMatrixModule().renderPhaseJumpBar?.({
    stages: STAGES,
    stageLabels: STAGE_LABELS,
    activePhase: requestWorksheetVisiblePhase,
    phaseLineOpenDates: requestPhaseLineOpenDateMap(currentProject),
    phaseLineOpenSource: requestPhaseLineOpenDateSource(),
  }) || "";
}
// @end-legacy-unit 992

export function replaceRequestWorksheetColumnsBinding(value) { requestWorksheetColumns = value; return value; }
