// om/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  createOmAssignmentRuleFromForm,
  saveOmAssignmentRule
} from "../admin/setup.js";
import {
  saveOmExchangeRate
} from "../cost/exchange-rate-view.js";
import {
  exportOmExcel,
  exportOmPackage,
  exportOmQuotePdf
} from "../exports/om.js";
import {
  exportPasPdf
} from "../exports/pas.js";
import {
  markSelectedExternalUpdated
} from "../handoff/actions.js";
import {
  openOmStageCalendarSetup,
  saveOmStageCalendar
} from "../projects/calendar-view.js";
import {
  currentRole
} from "../session/state.js";
import {
  setOmHandoffView,
  setOmTab
} from "../shell/navigation.js";
import {
  markOmFinalExported,
  prepareOmFinalExport
} from "./export-actions.js";
import {
  closeOmExternalResultModal
} from "./external-progress.js";
import {
  hydrateOmLeaderConsoleRows
} from "./hydration.js";
import {
  markPasRequestSent,
  openOmPasResultUpload
} from "./pas-actions.js";
import {
  clearOmSubmissionFilters
} from "./progress-data.js";
import {
  openOmSubmissionDetail,
  renderOmSubmission
} from "./progress-view.js";
import {
  askUserAAmendSelected,
  rejectOmSelectedToDri
} from "./quote-actions.js";
import {
  replaceCurrentOmStageFilterBinding
} from "./state.js";

export function handleClickOmTab(omTab, omHandoffViewButton, omSubmissionStageButton) {
  if (omTab) setOmTab(omTab.dataset.omTab);
  if (omHandoffViewButton) setOmHandoffView(omHandoffViewButton.dataset.omHandoffView);
  if (omSubmissionStageButton) {
    replaceCurrentOmStageFilterBinding(omSubmissionStageButton.dataset.omStageFilter || "all");
    renderOmSubmission();
  }
}

export function handleClickClearOmSubmissionFilters(action) {
  if (action === "clearOmSubmissionFilters") clearOmSubmissionFilters();
  if (action === "saveOmExchangeRate") saveOmExchangeRate();
  if (action === "saveOmStageCalendar") saveOmStageCalendar();
  if (action === "openOmStageCalendarSetup") openOmStageCalendarSetup();
  if (action === "refreshOmLeaderConsole") hydrateOmLeaderConsoleRows({ silent: false, role: currentRole });
}

export function handleClickCreateOmAssignmentRule(action) {
  if (action === "createOmAssignmentRule") createOmAssignmentRuleFromForm();
}

export function handleClickSaveOmAssignmentRuleButton(saveOmAssignmentRuleButton) {
  if (saveOmAssignmentRuleButton) saveOmAssignmentRule(saveOmAssignmentRuleButton.dataset.adminOmRuleId || "");
}

export function handleClickExportPasPdf(action) {
  if (action === "exportPasPdf") exportPasPdf();
  if (action === "markPasSent") markPasRequestSent();
  if (action === "omUploadPasResult") openOmPasResultUpload();
}

export function handleClickOmAskUserAAmend(action) {
  if (action === "omAskUserAAmend") askUserAAmendSelected();
  if (action === "omPrepareCfa") prepareOmFinalExport("CFA");
  if (action === "omPrepareEcs") prepareOmFinalExport("ECS");
  if (action === "omMarkExported") markOmFinalExported();
  if (action === "omExportExcel") exportOmExcel();
  if (action === "omExportQuotePdf") exportOmQuotePdf();
  if (action === "omExportPackage") exportOmPackage();
  if (action === "omRejectToDri") rejectOmSelectedToDri();
  if (action === "omMarkExternalUpdated") markSelectedExternalUpdated();
}

export function handleClickCloseOmExternalResult(action) {
  if (action === "closeOmExternalResult") closeOmExternalResultModal();
}

export function handleClickOmSubmissionDetailButton(omSubmissionDetailButton) {
  if (omSubmissionDetailButton) openOmSubmissionDetail(omSubmissionDetailButton.dataset.omSubmissionDetail);
}
