// catalog/context: authoritative source; see docs/module-map.md.
import {
  renderHistoryPackageRows,
  renderHistoryRows
} from "./history-view.js";
import {
  renderNaturalRows
} from "./natural-search-view.js";
import {
  currentReuseMode,
  itemPickerDemandType,
  itemPickerDemandUnit,
  itemPickerRequestLine,
  itemPickerStage,
  itemPickerStation,
  replaceCurrentReuseModeBinding,
  replaceItemPickerDemandTypeBinding,
  replaceItemPickerDemandUnitBinding,
  replaceItemPickerRequestLineBinding,
  replaceItemPickerStageBinding,
  replaceItemPickerStationBinding
} from "./state.js";
import {
  demandTypeFor,
  demandUnitFor
} from "../demand/quantity.js";
import {
  renderSelectedDemandLines
} from "../demand/selected-lines.js";
import {
  lastDemandType,
  requestWorksheetLine,
  requestWorksheetMode
} from "../demand/state.js";
import {
  renderRequestRows
} from "../demand/worksheet-actions.js";
import {
  requestWorksheetColumns,
  syncRequestWorksheetContext
} from "../demand/worksheet-view.js";
import {
  renderItemPickerCarryoverSuggestions,
  requestCarryoverPhase,
  requestCarryoverProject,
  updateRequestCarryover
} from "../inventory/suggestions.js";
import {
  DEMAND_TYPE_MFG,
  DEMAND_TYPE_NON_MFG,
  DEMAND_UNIT_FALLBACK,
  QUANTITY_DASHBOARD_UNITS,
  STAGES,
  STATION_MASTER
} from "../projects/config.js";
import {
  currentProject,
  currentProjectCode
} from "../projects/state.js";
import {
  htmlText
} from "../shared/html.js";
import {
  setDeptTab
} from "../shell/navigation.js";

// @legacy-unit 530 3628
export function syncItemPickerDemandContext(overrides = {}) {
  const targetProject = overrides.project || requestCarryoverProject();
  const nextPhase = STAGES.includes(overrides.phase) ? overrides.phase : (STAGES.includes(itemPickerStage) ? itemPickerStage : requestCarryoverPhase(targetProject));
  const nextType = demandTypeFor({ demandType: overrides.demandType || itemPickerDemandType || lastDemandType });
  const nextLine = /^Line\s+[1-4]$/.test(String(overrides.requestLine || itemPickerRequestLine || "")) ? (overrides.requestLine || itemPickerRequestLine) : "Line 1";
  replaceItemPickerStageBinding(nextPhase);
  replaceItemPickerDemandTypeBinding(nextType);
  replaceItemPickerRequestLineBinding(nextLine);
  if (nextType === DEMAND_TYPE_MFG) {
    replaceItemPickerStationBinding(STATION_MASTER.includes(overrides.station || itemPickerStation) ? (overrides.station || itemPickerStation) : STATION_MASTER[0]);
    replaceItemPickerDemandUnitBinding(DEMAND_UNIT_FALLBACK);
  } else {
    replaceItemPickerStationBinding("");
    replaceItemPickerDemandUnitBinding(demandUnitFor({ demandUnit: overrides.demandUnit || itemPickerDemandUnit || DEMAND_UNIT_FALLBACK }));
  }
  updateRequestCarryover({ project: targetProject, phase: itemPickerStage, demandType: itemPickerDemandType });
}
// @end-legacy-unit 530

// @legacy-unit 531 3646
export function itemPickerDemandContext() {
  syncItemPickerDemandContext();
  return {
    targetProject: requestCarryoverProject(),
    targetYearProject: requestCarryoverProject(),
    targetProjectCode: currentProjectCode,
    requestLine: itemPickerRequestLine,
    targetPhase: itemPickerStage,
    demandType: itemPickerDemandType,
    station: itemPickerDemandType === DEMAND_TYPE_MFG ? (itemPickerStation || STATION_MASTER[0]) : "",
    demandUnit: itemPickerDemandType === DEMAND_TYPE_MFG ? "" : demandUnitFor({ demandUnit: itemPickerDemandUnit }),
  };
}
// @end-legacy-unit 531

// @legacy-unit 532 3660
export function itemPickerTargetText(context = itemPickerDemandContext()) {
  const stationOrUnit = context.demandType === DEMAND_TYPE_MFG ? context.station : context.demandUnit;
  return `Target: ${context.targetProject} / ${context.requestLine} / ${context.demandType}${stationOrUnit ? ` / ${stationOrUnit}` : ""}`;
}
// @end-legacy-unit 532

// @legacy-unit 533 3665
export function renderItemPickerDemandContext() {
  const root = document.getElementById("itemPickerDemandContext");
  if (!root) return;
  const context = itemPickerDemandContext();
  const isMfg = context.demandType === DEMAND_TYPE_MFG;
  const nonMfgUnits = QUANTITY_DASHBOARD_UNITS.filter((unit) => unit !== "MFG");
  root.innerHTML = `
    <section class="request-context-panel" aria-label="Demand input context">
      <div class="request-context-copy">
        <strong>Demand Scope</strong>
        <span>${isMfg ? "MFG: Project / Line → Station → Item." : "Non-MFG: Project / Line → Department → Item."}</span>
      </div>
      <div class="request-context-controls">
        <label>
          <span>Demand Type</span>
          <select id="itemPickerDemandTypeSelect">
            <option value="${DEMAND_TYPE_MFG}" ${isMfg ? "selected" : ""}>MFG · Station</option>
            <option value="${DEMAND_TYPE_NON_MFG}" ${!isMfg ? "selected" : ""}>Non-MFG · Department</option>
          </select>
        </label>
        <label>
          <span>Request Line</span>
          <select id="itemPickerRequestLineSelect">
            ${["Line 1", "Line 2", "Line 3", "Line 4"].map((line) => `<option value="${line}" ${line === context.requestLine ? "selected" : ""}>${line}</option>`).join("")}
          </select>
        </label>
        <label ${isMfg ? "" : "hidden"}>
          <span>Station</span>
          <select id="itemPickerStationSelect">
            ${STATION_MASTER.map((station) => `<option value="${station}" ${station === context.station ? "selected" : ""}>${station}</option>`).join("")}
          </select>
        </label>
        <label ${isMfg ? "hidden" : ""}>
          <span>Demand Unit</span>
          <select id="itemPickerDemandUnitSelect">
            ${nonMfgUnits.map((unit) => `<option value="${unit}" ${unit === context.demandUnit ? "selected" : ""}>${unit}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="request-context-stations" ${isMfg ? "" : "hidden"}>
        <span>Mainline: CG / BG / FATP / Test / Hybrid / Auto</span>
        <span>Packing: ENG Pack / Zombie / Laser_pico / Rework</span>
        <span>Supporting: Repair / WH</span>
      </div>
      <div class="request-context-note">${itemPickerTargetText(context)}. Add item/spec in the worksheet, then enter qty directly in station or department columns.</div>
    </section>
  `;
}
// @end-legacy-unit 533

// @legacy-unit 534 3714
export function renderRequesterInputContext() {
  const root = document.getElementById("requestInputContextBar");
  if (!root) return;
  syncRequestWorksheetContext();
  const isMfg = requestWorksheetMode === DEMAND_TYPE_MFG;
  const columns = requestWorksheetColumns();
  root.innerHTML = `
    <div class="request-input-context-copy">
      <strong>${htmlText(currentProject)} / ${htmlText(currentProjectCode || "Project code")} / ${htmlText(requestWorksheetLine)}</strong>
      <span>${isMfg ? "MFG station worksheet" : "Non-MFG department worksheet"} · ${columns.length} input columns</span>
    </div>
    <div class="request-input-context-controls">
      <label>
        <span>Line</span>
        <select id="requestWorksheetLine">
          ${["Line 1", "Line 2", "Line 3", "Line 4"].map((line) => `<option value="${line}" ${line === requestWorksheetLine ? "selected" : ""}>${line}</option>`).join("")}
        </select>
      </label>
      <span class="status-pill info">${isMfg ? "Station Qty Input" : "Department Qty Input"}</span>
    </div>`;
}
// @end-legacy-unit 534

// @legacy-unit 913 9255
export function openItemPicker() {
  if (!["catalog", "reuse", "package"].includes(currentReuseMode)) replaceCurrentReuseModeBinding("catalog");
  syncRequestWorksheetContext({ phase: requestCarryoverPhase(), mode: lastDemandType });
  setDeptTab("request");
  renderItemPickerDemandContext();
  renderRequesterInputContext();
  renderNaturalRows();
  renderHistoryRows();
  renderHistoryPackageRows();
  renderItemPickerCarryoverSuggestions();
  renderSelectedDemandLines();
  renderRequestRows();
  document.getElementById("requestRows")?.closest(".request-worksheet-shell")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
// @end-legacy-unit 913

// @legacy-unit 914 9270
export function closeItemPicker() {
  setDeptTab("request");
  document.getElementById("requestRows")?.closest(".request-worksheet-shell")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
// @end-legacy-unit 914
