// catalog/history-view: authoritative source; see docs/module-map.md.
import {
  itemPickerTargetText
} from "./context.js";
import {
  historyReusableSourceRows
} from "./search-actions.js";
import {
  currentReuseMode,
  historyResults,
  historySearchActive,
  replaceCurrentReuseModeBinding
} from "./state.js";
import {
  clampQty,
  stationBreakdownPhaseKey,
  stationBreakdownPhaseTotal,
  stationBreakdownRowTotal,
  stationBreakdownRowsForDetail,
  totalQty
} from "../demand/quantity.js";
import {
  renderItemPickerCarryoverSuggestions,
  requestCarryoverPhase,
  requestCarryoverProject
} from "../inventory/suggestions.js";
import {
  itemDetail,
  itemDetailButton
} from "../materials/display.js";
import {
  factoryMaterialNoFor
} from "../materials/identity.js";
import {
  STAGES,
  STAGE_LABELS
} from "../projects/config.js";
import {
  stageLabel
} from "../shared/format.js";
import {
  htmlAttr
} from "../shared/html.js";

// @legacy-unit 1093 12404
export function syncReuseModeTabs() {
  if (!["catalog", "reuse", "package"].includes(currentReuseMode)) replaceCurrentReuseModeBinding("catalog");
  document.querySelectorAll("[data-reuse-mode-tab]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.reuseModeTab === currentReuseMode);
  });
  document.querySelectorAll("[data-reuse-mode-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.reuseModePanel === currentReuseMode);
  });
}
// @end-legacy-unit 1093

// @legacy-unit 1094 12414
export function reusableHistoryRows() {
  return historyReusableSourceRows().filter((row) =>
    factoryMaterialNoFor(row)
    && (row.poNo || row.buyerPoNo || row.poStatus || ["PO Issued", "Completed"].includes(row.buyerStatus || ""))
  );
}
// @end-legacy-unit 1094

// @legacy-unit 1095 12421
export function sourcePhaseForHistory(row) {
  if (STAGES.includes(row?.phase)) return row.phase;
  if (STAGES.includes(row?.defaultPhase)) return row.defaultPhase;
  const breakdownPhase = stationBreakdownRowsForDetail(row)
    .filter((item) => stationBreakdownRowTotal(item) > 0)
    .map((item) => stationBreakdownPhaseKey(item))
    .find((phase) => STAGES.includes(phase));
  if (breakdownPhase) return breakdownPhase;
  return STAGES.find((stage) => clampQty(row?.[stage]) > 0) || requestCarryoverPhase(row?.project || requestCarryoverProject());
}
// @end-legacy-unit 1095

// @legacy-unit 1096 12432
export function phaseQtySummary(row) {
  if (Array.isArray(row?.stationBreakdown) && row.stationBreakdown.length) {
    return STAGES
      .map((stage) => {
        const qty = stationBreakdownPhaseTotal(row, stage);
        return qty ? `${STAGE_LABELS[stage]} ${qty}` : "";
      })
      .filter(Boolean)
      .join(" / ");
  }
  return STAGES
    .map((stage) => {
      const qty = clampQty(row?.[stage]);
      return qty ? `${STAGE_LABELS[stage]} ${qty}` : "";
    })
    .filter(Boolean)
    .join(" / ");
}
// @end-legacy-unit 1096

// @legacy-unit 1097 12451
export function historyPackageKey(row) {
  const project = row?.project || "Unknown";
  return `${project}::${sourcePhaseForHistory(row)}`;
}
// @end-legacy-unit 1097

// @legacy-unit 1098 12456
export function historyPackageLabel(key) {
  const [project, phase] = String(key || "").split("::");
  return `${project || "Unknown"} / ${stageLabel(phase)} demand copy`;
}
// @end-legacy-unit 1098

// @legacy-unit 1099 12461
export function selectedHistoryPackageRows() {
  const sourceProject = document.getElementById("historyPackageSourceProject")?.value || "";
  const sourcePhase = document.getElementById("historyPackageSourcePhase")?.value || "";
  const sourcePackage = document.getElementById("historyPackageSourcePackage")?.value || "";
  return reusableHistoryRows().filter((row) =>
    (!sourceProject || row.project === sourceProject)
    && (!sourcePhase || sourcePhaseForHistory(row) === sourcePhase)
    && (!sourcePackage || historyPackageKey(row) === sourcePackage)
  );
}
// @end-legacy-unit 1099

// @legacy-unit 1100 12472
export function syncHistoryPackageControls() {
  const projectSelect = document.getElementById("historyPackageSourceProject");
  const phaseSelect = document.getElementById("historyPackageSourcePhase");
  const packageSelect = document.getElementById("historyPackageSourcePackage");
  if (!projectSelect || !phaseSelect || !packageSelect) return;
  const previousProject = projectSelect.value;
  const previousPhase = phaseSelect.value;
  const previousPackage = packageSelect.value;
  const projects = [...new Set(reusableHistoryRows().map((row) => row.project).filter(Boolean))].sort();
  projectSelect.innerHTML = [
    `<option value="">All source projects</option>`,
    ...projects.map((project) => `<option value="${htmlAttr(project)}">${project}</option>`),
  ].join("");
  projectSelect.value = projects.includes(previousProject) ? previousProject : "";
  const phaseOptions = STAGES.filter((stage) => reusableHistoryRows().some((row) =>
    (!projectSelect.value || row.project === projectSelect.value) && sourcePhaseForHistory(row) === stage
  ));
  phaseSelect.innerHTML = [
    `<option value="">All phases</option>`,
    ...phaseOptions.map((stage) => `<option value="${stage}">${stageLabel(stage)}</option>`),
  ].join("");
  phaseSelect.value = phaseOptions.includes(previousPhase) ? previousPhase : "";
  const packageKeys = [...new Set(reusableHistoryRows()
    .filter((row) => (!projectSelect.value || row.project === projectSelect.value)
      && (!phaseSelect.value || sourcePhaseForHistory(row) === phaseSelect.value))
    .map(historyPackageKey))]
    .sort();
  packageSelect.innerHTML = [
    `<option value="">All packages</option>`,
    ...packageKeys.map((key) => `<option value="${htmlAttr(key)}">${historyPackageLabel(key)}</option>`),
  ].join("");
  packageSelect.value = packageKeys.includes(previousPackage) ? previousPackage : "";
}
// @end-legacy-unit 1100

// @legacy-unit 1101 12506
export function renderHistoryPackageRows() {
  syncHistoryPackageControls();
  const targetContext = document.getElementById("historyPackageTargetContext");
  if (targetContext) {
    targetContext.textContent = itemPickerTargetText();
  }
  const rows = selectedHistoryPackageRows();
  const previewCount = document.getElementById("historyPackagePreviewCount");
  if (previewCount) {
    previewCount.textContent = rows.length ? `${rows.length} items ready` : "0 items ready";
  }
  const body = document.getElementById("historyPackageRows");
  if (!body) return;
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td class="cell-identity history-package-item" title="${htmlAttr(`${row.name || "-"} / ${row.project || "-"}`)}">
        <div class="identity-block">
          <span class="identity-primary">${row.name || "-"}</span>
          <span class="identity-secondary">${row.project || "-"}</span>
        </div>
      </td>
      <td class="cell-spec-summary history-package-spec" title="${htmlAttr(itemDetail(row))}"><div class="spec-summary">${itemDetail(row) || "-"}</div></td>
      <td class="cell-note-summary history-package-source" title="${htmlAttr(historyPackageLabel(historyPackageKey(row)))}"><div class="note-summary">${historyPackageLabel(historyPackageKey(row))}</div></td>
      <td class="cell-number">${totalQty(row)}</td>
      <td class="cell-note-summary" title="${htmlAttr(phaseQtySummary(row))}"><div class="note-summary">${phaseQtySummary(row) || "No phase qty"}</div></td>
      <td class="cell-action">${itemDetailButton("record", row.id)}</td>
    </tr>
  `).join("") : `<tr><td colspan="6" class="empty-cell">No copy demand items match the current source filters.</td></tr>`;
}
// @end-legacy-unit 1101

// @legacy-unit 1102 12536
export function sourceLineForHistory(row) {
  const explicit = String(row?.requestLine || row?.sourceLine || row?.lineName || row?.line || "").trim();
  if (/^Line\s+[1-4]$/i.test(explicit)) return explicit.replace(/^line/i, "Line");
  const text = [
    row?.purpose,
    row?.remark,
    row?.requesterReason,
    row?.packageCode,
    row?.budgetNo,
  ].join(" ");
  const match = text.match(/\bline\s*([1-4])\b/i);
  return match ? `Line ${match[1]}` : "Line 1";
}
// @end-legacy-unit 1102

// @legacy-unit 1103 12550
export function renderHistoryRows() {
  const body = document.getElementById("historyRows");
  if (!body) return;
  syncReuseModeTabs();
  const targetContext = document.getElementById("historyTargetContext");
  if (targetContext) {
    targetContext.textContent = itemPickerTargetText();
  }
  const sourceProject = document.getElementById("historySourceProject")?.value || "";
  const sourceRows = historySearchActive ? historyResults : historyReusableSourceRows();
  const rows = sourceRows.filter((row) =>
    factoryMaterialNoFor(row)
    && (row.poNo || row.buyerPoNo || row.poStatus || ["PO Issued", "Completed"].includes(row.buyerStatus || ""))
    && (!sourceProject || row.project === sourceProject)
  );
  body.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td class="cell-action"><button class="mini approve history-add-btn" title="Add Item to Request" data-add-history-record="${row.id}">Add</button></td>
      <td class="cell-identity history-source-project" title="${htmlAttr(row.project || "-")}"><div class="identity-block"><span class="identity-primary">${row.project || "-"}</span></div></td>
      <td class="cell-identity history-item-name" title="${htmlAttr(row.name || "-")}"><div class="identity-block"><span class="identity-primary">${row.name || "-"}</span></div></td>
      <td class="cell-spec-summary history-spec" title="${htmlAttr(itemDetail(row))}"><div class="spec-summary">${itemDetail(row) || "-"}</div></td>
      <td class="cell-number" title="${htmlAttr(`${row.qty || 0} qty / ${phaseQtySummary(row)}`)}"><strong>${row.qty || 0}</strong><div class="reason-text">${phaseQtySummary(row) || sourcePhaseForHistory(row) || "-"}</div></td>
      <td class="cell-action">${itemDetailButton("record", row.id)}</td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty-cell">No reusable history records match this search.</td></tr>`;
  renderHistoryPackageRows();
  renderItemPickerCarryoverSuggestions();
}
// @end-legacy-unit 1103

export function replaceReusableHistoryRowsBinding(value) { reusableHistoryRows = value; return value; }

export function replaceHistoryPackageKeyBinding(value) { historyPackageKey = value; return value; }
