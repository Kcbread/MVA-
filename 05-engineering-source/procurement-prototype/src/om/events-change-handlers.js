// om/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderOmProjectStageCalendar
} from "../projects/calendar-view.js";
import {
  assignOmRow
} from "./assignment.js";
import {
  applyPasDecision,
  updatePasField
} from "./pas-actions.js";
import {
  renderOmSubmission
} from "./progress-view.js";
import {
  toggleOmQuoteException,
  updateOmField,
  updateOmPasExcelMergeDecision
} from "./quote-actions.js";
import {
  omSelections,
  replaceCurrentOmItemFilterBinding,
  replaceCurrentOmLevel1FilterBinding,
  replaceCurrentOmLevel2FilterBinding,
  replaceCurrentOmLevel3FilterBinding,
  replaceCurrentOmPhaseFilterBinding,
  replaceCurrentOmProjectFilterBinding,
  replaceCurrentOmYearProjectFilterBinding
} from "./state.js";
import {
  updateOmProcurementField
} from "./tracking-actions.js";
import {
  renderOmPurchasing
} from "./workspace.js";

export function handleChangeOmSubmissionYearFilter(event) {
  if ([
    "omSubmissionYearFilter",
    "omSubmissionProjectFilter",
    "omSubmissionPhaseFilter",
    "omSubmissionLevel1Filter",
    "omSubmissionLevel2Filter",
    "omSubmissionLevel3Filter",
    "omSubmissionItemFilter",
  ].includes(event.target.id)) {
    replaceCurrentOmYearProjectFilterBinding(document.getElementById("omSubmissionYearFilter")?.value || "");
    replaceCurrentOmProjectFilterBinding(document.getElementById("omSubmissionProjectFilter")?.value || "");
    replaceCurrentOmPhaseFilterBinding(document.getElementById("omSubmissionPhaseFilter")?.value || "");
    replaceCurrentOmLevel1FilterBinding(document.getElementById("omSubmissionLevel1Filter")?.value || "");
    replaceCurrentOmLevel2FilterBinding(document.getElementById("omSubmissionLevel2Filter")?.value || "");
    replaceCurrentOmLevel3FilterBinding(document.getElementById("omSubmissionLevel3Filter")?.value || "");
    replaceCurrentOmItemFilterBinding(document.getElementById("omSubmissionItemFilter")?.value || "");
    if (event.target.id === "omSubmissionYearFilter") {
      replaceCurrentOmProjectFilterBinding("");
      replaceCurrentOmPhaseFilterBinding("");
      replaceCurrentOmLevel1FilterBinding("");
      replaceCurrentOmLevel2FilterBinding("");
      replaceCurrentOmLevel3FilterBinding("");
      replaceCurrentOmItemFilterBinding("");
    }
    if (event.target.id === "omSubmissionProjectFilter") {
      replaceCurrentOmPhaseFilterBinding("");
      replaceCurrentOmLevel1FilterBinding("");
      replaceCurrentOmLevel2FilterBinding("");
      replaceCurrentOmLevel3FilterBinding("");
      replaceCurrentOmItemFilterBinding("");
    }
    if (event.target.id === "omSubmissionPhaseFilter") {
      replaceCurrentOmLevel1FilterBinding("");
      replaceCurrentOmLevel2FilterBinding("");
      replaceCurrentOmLevel3FilterBinding("");
      replaceCurrentOmItemFilterBinding("");
    }
    if (event.target.id === "omSubmissionLevel1Filter") {
      replaceCurrentOmLevel2FilterBinding("");
      replaceCurrentOmLevel3FilterBinding("");
      replaceCurrentOmItemFilterBinding("");
    }
    if (event.target.id === "omSubmissionLevel2Filter") {
      replaceCurrentOmLevel3FilterBinding("");
      replaceCurrentOmItemFilterBinding("");
    }
    if (event.target.id === "omSubmissionLevel3Filter") replaceCurrentOmItemFilterBinding("");
    renderOmSubmission();
  }
  if ([
    "omStageCalendarYearProject",
    "omStageCalendarProjectCode",
    "omStageCalendarPhase",
  ].includes(event.target.id)) renderOmProjectStageCalendar();
}

export function handleChangeOmDemandProjectFilter(event) {
  if (["omDemandProjectFilter", "omProjectFilter", "omQuoteExpiryProjectFilter", "omQuoteExpiryStatusFilter", "omQuoteExpiryAssigneeFilter", "omUserConfirmProjectFilter", "omFinalExportProjectFilter", "omHistoryProjectFilter", "omOwnerFilter"].includes(event.target.id)) renderOmPurchasing();
}

export function handleChangePasField(pasField, pasId, event) {
  if (pasField && pasId) updatePasField(pasId, pasField, event.target.value);
}

export function handleChangePasDecisionId(pasDecisionId, event) {
  if (pasDecisionId) {
    if (event.target.value) applyPasDecision(pasDecisionId, event.target.value);
    event.target.value = "";
  }
}

export function handleChangeOmProcurementField(omProcurementField, omProcurementId, event) {
  if (omProcurementField && omProcurementId) {
    updateOmProcurementField(omProcurementId, omProcurementField, event.target.value);
  }
}

export function handleChangeOmSelect(omSelect, event) {
  if (omSelect) {
    if (event.target.checked) omSelections.add(omSelect);
    else omSelections.delete(omSelect);
    replaceRequestsBinding(requests.map((row) => row.id === omSelect ? { ...row, omSelected: event.target.checked } : row));
    renderOmPurchasing();
  }
}

export function handleChangeOmQuoteExceptionId(omQuoteExceptionId, event) {
  if (omQuoteExceptionId) toggleOmQuoteException(omQuoteExceptionId, event.target.checked);
}

export function handleChangeOmAssigneeId(omAssigneeId, event) {
  if (omAssigneeId) {
    assignOmRow(omAssigneeId, event.target.value);
  }
}

export function handleChangeOmPriceCurrencyId(omPriceCurrencyId, event) {
  if (omPriceCurrencyId) {
    replaceRequestsBinding(requests.map((row) => row.id === omPriceCurrencyId ? { ...row, quoteInputCurrency: event.target.value === "USD" ? "USD" : "VND" } : row));
    renderOmPurchasing();
  }
}

export function handleChangePasExcelGroupId(pasExcelGroupId, event) {
  if (pasExcelGroupId) {
    updateOmPasExcelMergeDecision(pasExcelGroupId, event.target.value);
  }
}

export function handleChangeOmField(omField, omId, event) {
  if (omField && omId) updateOmField(omId, omField, event.target.value);
}
