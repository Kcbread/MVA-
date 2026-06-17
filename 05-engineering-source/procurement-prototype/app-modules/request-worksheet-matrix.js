(function registerRequestWorksheetMatrixModule(root) {
  function renderHead({ stages = [], stageLabels = {}, columns = [] } = {}) {
    const phaseColspan = columns.length + 1;
    return `
      <tr>
        <th class="request-col-item request-sticky-col" rowspan="2">Item / Spec</th>
        ${stages.map((stage) => `<th class="request-phase-group-head" colspan="${phaseColspan}" data-request-phase-group="${stage}">${stageLabels[stage] || stage}</th>`).join("")}
        <th class="request-col-row-total request-sticky-right request-sticky-right-total" rowspan="2">Row Total</th>
        <th class="request-col-hint request-sticky-right request-sticky-right-hint" rowspan="2">Hint / Action</th>
        <th class="request-col-actions request-sticky-right request-sticky-right-action" rowspan="2">Action</th>
      </tr>
      <tr>
        ${stages.map((stage) => `
          ${columns.map((column) => `<th class="request-station-head" data-request-head-phase="${stage}" data-request-head-column="${column}">${column}</th>`).join("")}
          <th class="request-phase-total-head">${stageLabels[stage] || stage} Total</th>
        `).join("")}
      </tr>`;
  }

  function renderPhaseJumpBar({ stages = [], stageLabels = {}, activePhase = "" } = {}) {
    return stages.map((stage) => `
      <button class="phase-jump-chip ${activePhase === stage ? "active" : ""}" type="button" data-request-phase-jump="${stage}">
        ${stageLabels[stage] || stage}
      </button>`).join("");
  }

  function renderCurrentPhaseIndicator({ stageLabels = {}, activePhase = "", fallback = "Scroll to review phases" } = {}) {
    return activePhase
      ? `Current Phase: ${stageLabels[activePhase] || activePhase}`
      : fallback;
  }

  function renderRow({
    row = {},
    stages = [],
    phaseCellHtml = () => "",
    rowTotal = 0,
    hintHtml = "",
    actionHtml = "",
    itemHtml = "",
    isActiveRow = false,
  } = {}) {
    return `
      <tr data-request-row="${row.id || ""}" class="${isActiveRow ? "active-row" : ""}">
        <td class="cell-spec request-sticky-col">${itemHtml}</td>
        ${stages.map((phase) => phaseCellHtml(phase)).join("")}
        <td class="cell-number request-row-total-cell request-sticky-right request-sticky-right-total"><strong>${rowTotal}</strong></td>
        <td class="cell-hint request-sticky-right request-sticky-right-hint">${hintHtml}</td>
        <td class="cell-action request-sticky-right request-sticky-right-action">${actionHtml}</td>
      </tr>`;
  }

  const api = {
    renderHead,
    renderPhaseJumpBar,
    renderCurrentPhaseIndicator,
    renderRow,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.requestWorksheetMatrix = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
