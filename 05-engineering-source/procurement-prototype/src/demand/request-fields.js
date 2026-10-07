// demand/request-fields: authoritative source; see docs/module-map.md.
import {
  renderManagerStageTracking
} from "../cost/stage-view.js";
import {
  persistRequesterLocalDrafts
} from "./drafts.js";
import {
  closeDemandEditor
} from "./editor.js";
import {
  renderDeptStageTracking
} from "./matrix-view.js";
import {
  clampQty
} from "./quantity.js";
import {
  normalizeRequesterDateFields
} from "./records.js";
import {
  renderSelectedDemandLines
} from "./selected-lines.js";
import {
  activeDemandRequestId,
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
  addHandoffHistory
} from "../handoff/queue.js";
import {
  newItemSuggestions
} from "../materials/state.js";
import {
  dateOnly,
  normalizePurposeLocation
} from "../projects/dates.js";
import {
  currentProject
} from "../projects/state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";

// @legacy-unit 640 4751
export function activeProjectRequests() {
  return requests.filter((row) => row.project === currentProject && row.status === "Draft");
}
// @end-legacy-unit 640

// @legacy-unit 641 4755
export function canRequesterEditRequest(row) {
  return ["requester", "admin"].includes(currentRole) && row && row.status === "Draft";
}
// @end-legacy-unit 641

// @legacy-unit 642 4759
export function needDateForRow(row) {
  return row?.needDate || row?.requiredDeliveryDate || row?.requiredDeliveryDateDri || "";
}
// @end-legacy-unit 642

// @legacy-unit 643 4763
export function updateRequestNeedDate(requestId, value) {
  const nextValue = value || "";
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId) return row;
    const previous = needDateForRow(row);
    return {
      ...row,
      needDate: nextValue,
      requiredDeliveryDate: nextValue,
      requiredDeliveryDateDri: nextValue,
      requestDeadline: row.requestDeadline || nextValue,
      needDateUpdatedAt: previous !== nextValue ? now : row.needDateUpdatedAt,
      needDateUpdatedBy: previous !== nextValue ? roleProfiles[currentRole]?.name || "Requester" : row.needDateUpdatedBy,
    };
  }));
  const updated = requests.find((row) => row.id === requestId);
  if (updated) addHandoffHistory(updated, "Need date updated", nextValue || "Need date cleared");
  renderDepartment();
}
// @end-legacy-unit 643

// @legacy-unit 644 4784
export function updateRequestRequiredDeliveryDate(requestId, value) {
  const nextValue = dateOnly(value);
  const now = new Date().toISOString();
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    const previous = dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || "");
    return normalizeRequesterDateFields({
      ...row,
      needDate: nextValue,
      requiredDeliveryDate: nextValue,
      requiredDeliveryDateDri: nextValue,
      requestDeadline: nextValue || row.requestDeadline || "",
      requiredDeliveryDateUpdatedAt: previous !== nextValue ? now : row.requiredDeliveryDateUpdatedAt,
      requiredDeliveryDateUpdatedBy: previous !== nextValue ? roleProfiles[currentRole]?.name || "Requester" : row.requiredDeliveryDateUpdatedBy,
    });
  }));
  renderRequestRows();
  renderSelectedDemandLines();
}
// @end-legacy-unit 644

// @legacy-unit 645 4804
export function updateRequestPurposeLocation(requestId, value) {
  const nextPurpose = normalizePurposeLocation(value);
  replaceRequestsBinding(requests.map((row) => {
    if (row.id !== requestId || !canRequesterEditRequest(row)) return row;
    return normalizeRequesterDateFields({
      ...row,
      purposeLocation: nextPurpose,
      purpose: nextPurpose,
    });
  }));
  renderRequestRows();
  renderSelectedDemandLines();
}
// @end-legacy-unit 645

// @legacy-unit 646 4818
export function visibleSuggestions() {
  return newItemSuggestions;
}
// @end-legacy-unit 646

// @legacy-unit 1179 14197
export function updateStage(requestId, stage, value) {
  replaceRequestsBinding(requests.map((row) => row.id === requestId ? { ...row, [stage]: clampQty(value) } : row));
  renderRequestRows();
  renderDeptStageTracking();
  renderManagerStageTracking();
  renderSubmissionRows();
}
// @end-legacy-unit 1179

// @legacy-unit 1180 14205
export function removeRequest(requestId) {
  const removable = requests.find((row) => row.id === requestId && canRequesterEditRequest(row));
  if (removable && !persistRequesterLocalDrafts([], [requestId])) return;
  replaceRequestsBinding(requests.filter((row) => row.id !== requestId || !canRequesterEditRequest(row)));
  if (activeDemandRequestId === requestId) closeDemandEditor();
  renderDepartment();
  renderSelectedDemandLines();
  showToast("Request line removed.", "success");
}
// @end-legacy-unit 1180

export function replaceRemoveRequestBinding(value) { removeRequest = value; return value; }
