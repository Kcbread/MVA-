// workflow/status-view: authoritative source; see docs/module-map.md.
import {
  workflowStatusModule
} from "../infrastructure/module-adapters.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 467 2914
export function workflowStatusForRow(row, role = "requester") {
  return workflowStatusModule().buildWorkflowStatus?.(row, { role, today: new Date() }) || {
    pendingOwner: "OM Purchasing",
    currentStage: "Progress Review",
    submittedAt: "",
    receivedAt: "",
    stageStartAt: "",
    daysPending: null,
    quoteStatus: "-",
    nextAction: "Review blocker",
    riskReason: "",
    timelineMilestones: [],
    statusLabels: [],
    visibilityFlags: {},
  };
}
// @end-legacy-unit 467

// @legacy-unit 468 2931
export function workflowStatusForGroup(group, role = "costOwner") {
  return workflowStatusModule().buildWorkflowGroupStatus?.(group, { role, today: new Date() }) || workflowStatusForRow((group.rows || [])[0] || {}, role);
}
// @end-legacy-unit 468

// @legacy-unit 469 2935
export function workflowStatusStripHtml(status = {}, options = {}) {
  const title = options.title || "Workflow Status";
  const compact = options.compact ? " workflow-status-strip-compact" : "";
  const daysLabel = status.daysPending === null || status.daysPending === undefined ? "Done" : `${status.daysPending}d`;
  if (options.compact) {
    const summary = [
      status.pendingOwner || "-",
      status.currentStage || "-",
      daysLabel,
      status.nextAction || "-",
    ].join(" · ");
    return `
      <div class="workflow-status-strip${compact}" aria-label="${htmlAttr(title)}" title="${htmlAttr(summary)}">
        <strong>${htmlText(title)}</strong>
        <span class="workflow-status-inline">${htmlText(summary)}</span>
      </div>`;
  }
  const items = [
    ["Pending Owner", status.pendingOwner || "-"],
    ["Current Stage", status.currentStage || "-"],
    ["Days Pending", daysLabel],
    ["Next Action", status.nextAction || "-"],
  ];
  return `
    <div class="workflow-status-strip${compact}" aria-label="${htmlAttr(title)}">
      <strong>${htmlText(title)}</strong>
      ${items.map(([label, value]) => `
        <span class="workflow-status-chip" title="${htmlAttr(`${label}: ${value}`)}">
          <small>${htmlText(label)}</small>
          <b>${htmlText(value)}</b>
        </span>`).join("")}
    </div>`;
}
// @end-legacy-unit 469
