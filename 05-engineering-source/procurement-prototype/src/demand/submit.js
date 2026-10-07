// demand/submit: authoritative source; see docs/module-map.md.
import {
  AMENDMENT_SUBMITTED
} from "../admin/state.js";
import {
  renderManager
} from "../approval/manager-view.js";
import {
  quantityReviewModeLabel
} from "../approval/quantity-scope.js";
import {
  deptDriSubmissionReviewPatch
} from "../approval/routing.js";
import {
  isTemporaryBudgetRequest
} from "../cost/price-decision.js";
import {
  persistRequesterLocalDrafts
} from "./drafts.js";
import {
  requestActionOtherTextValue,
  requestActionValue
} from "./intent.js";
import {
  syncRowPhaseQtyFromStationBreakdown
} from "./quantity.js";
import {
  normalizeRequesterDateFields
} from "./records.js";
import {
  canRequesterEditRequest,
  needDateForRow
} from "./request-fields.js";
import {
  advanceRequestSequenceBinding,
  replaceRequestsBinding,
  requestSequence,
  requestWorksheetMode,
  requests
} from "./state.js";
import {
  requesterSubmitScopeAudit
} from "./worksheet.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  isMaterialNoPending
} from "../materials/display.js";
import {
  isMaintenanceComplete
} from "../materials/standard-names.js";
import {
  DEFAULT_PURPOSE_LOCATION,
  REQUEST_ACTION_OTHER
} from "../projects/config.js";
import {
  dateOnly,
  normalizePurposeLocation,
  primaryRequestPhaseLineOpenDate
} from "../projects/dates.js";
import {
  currentProject
} from "../projects/state.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRequesterDepartment,
  currentRequesterPersona,
  normalizeRequestDemandDepartment,
  rowDemandDepartment
} from "../session/persona.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  setDeptTab
} from "../shell/navigation.js";

// @legacy-unit 1177 14051
export function submitRequests() {
  const audit = requesterSubmitScopeAudit();
  const visibleRows = audit.scopedRows.filter(canRequesterEditRequest);
  const selectedRows = audit.readyRows;
  if (!visibleRows.length) {
    showToast(`Add at least one ${quantityReviewModeLabel(requestWorksheetMode)} item/spec before submitting to Dept DRI.`, "error");
    return;
  }
  if (!selectedRows.length) {
    showToast(`Add at least one ${quantityReviewModeLabel(requestWorksheetMode)} phase quantity before submitting to Dept DRI.`, "error");
    return;
  }
  if (selectedRows.some((row) => !dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || ""))) {
    showToast("Required Delivery Date is required for each submitted item.", "error");
    return;
  }
  if (selectedRows.some((row) => !isMaintenanceComplete(row) && !isMaterialNoPending(row))) {
    showToast("Complete material information for legacy rows before submitting to Dept DRI.", "error");
    return;
  }
  if (selectedRows.some((row) => requestActionValue(row) === REQUEST_ACTION_OTHER && !requestActionOtherTextValue(row))) {
    showToast("Other action detail is required before submitting this demand scope.", "error");
    return;
  }
  let submitted = 0;
  const now = new Date().toISOString();
  const packageId = `PKG-${currentProject}-${now.replace(/[-:.TZ]/g, "").slice(0, 14)}`;
  const requesterPersona = currentRequesterPersona();
  const requesterDepartment = currentRequesterDepartment();
  const submittedIds = new Map(selectedRows.map((row) => [
    row.id,
    row.id.startsWith("REQ-") && !row.id.startsWith("DRAFT-") ? row.id : `REQ-${String(advanceRequestSequenceBinding(1, true)).padStart(4, "0")}`,
  ]));
  const amendmentSubmissions = selectedRows
    .filter((row) => row.amendmentOf)
    .map((row) => ({ sourceId: row.amendmentOf, newId: submittedIds.get(row.id) }));
  replaceRequestsBinding(requests.map((row) => {
    if (selectedRows.some((item) => item.id === row.id)) {
      submitted += 1;
      const newId = submittedIds.get(row.id);
      const demandDepartment = rowDemandDepartment(row, requesterDepartment);
      const rowRequiredDeliveryDate = dateOnly(row.requiredDeliveryDate || row.needDate || row.requiredDeliveryDateDri || "");
      const rowPurposeLocation = normalizePurposeLocation(row.purposeLocation || row.purpose || DEFAULT_PURPOSE_LOCATION);
      return syncRowPhaseQtyFromStationBreakdown(normalizeRequestDemandDepartment(normalizeRequesterDateFields({
        ...row,
        id: newId,
	        selected: false,
	        status: "Submitted",
	        managerReason: "",
	        demandReviewStatus: "",
	        demandReviewDecisionAt: "",
	        demandReviewDecisionBy: "",
	        demandReviewReason: "",
	        demandReviewDeniedAt: "",
	        demandReviewDeniedBy: "",
	        costManagerAuthorizationStatus: "",
	        costManagerAuthorizationReason: "",
	        costManagerAuthorizationReworkRequired: false,
	        costManagerRejectedAt: "",
	        costManagerRejectedBy: "",
	        costManagerRejectReason: "",
	        ...deptDriSubmissionReviewPatch(now),
        requestPackageId: row.requestPackageId || packageId,
        requestPackageLabel: row.requestPackageLabel || `${currentProject} Demand Package`,
        submittedAt: now,
        dateOfRequest: row.dateOfRequest || now,
        purposeLocation: rowPurposeLocation,
        purpose: rowPurposeLocation,
        lineOpenDate: primaryRequestPhaseLineOpenDate(row),
        submittedBy: requesterPersona?.name || roleProfiles[currentRole]?.name || "Requester",
        requestAction: requestActionValue(row),
        action: requestActionValue(row),
        requestActionOtherText: requestActionOtherTextValue(row),
        needDate: rowRequiredDeliveryDate,
        requiredDeliveryDate: rowRequiredDeliveryDate,
        requiredDeliveryDateDri: rowRequiredDeliveryDate,
        requestDeadline: row.requestDeadline || rowRequiredDeliveryDate,
        requesterName: row.requesterName || requesterPersona?.name || "",
        requesterEmployeeId: row.requesterEmployeeId || requesterPersona?.employeeId || "",
        email: row.email || requesterPersona?.email || "",
        phone: row.phone || requesterPersona?.phone || "",
        department: demandDepartment,
        requesterDept: row.requesterDept || demandDepartment,
        demandDepartment: row.demandDepartment || demandDepartment,
        ...(row.amendmentOf ? {
          amendmentStatus: AMENDMENT_SUBMITTED,
          amendmentSubmittedAt: now,
          amendedBy: roleProfiles[currentRole]?.name || "Requester",
          amendedAt: row.amendedAt || now,
        } : {}),
      }), demandDepartment));
    }
    const amendment = amendmentSubmissions.find((item) => item.sourceId === row.id);
    if (amendment) {
      return {
        ...row,
        amendmentStatus: AMENDMENT_SUBMITTED,
        supersededBy: amendment.newId,
        omSelected: false,
      };
    }
    return row;
  }));
  amendmentSubmissions.forEach((item) => {
    const source = requests.find((row) => row.id === item.sourceId);
    const amendment = requests.find((row) => row.id === item.newId);
    if (source) addHandoffHistory(source, "Amendment submitted to Dept DRI", item.newId);
    if (amendment) addHandoffHistory(amendment, "Amendment submitted to Dept DRI", amendment.amendmentReason || "Requester submitted amendment.");
  });
  requests
    .filter((row) => [...submittedIds.values()].includes(row.id))
    .forEach((row) => {
      addHandoffHistory(row, "Required Delivery Date submitted", needDateForRow(row));
      addHandoffHistory(row, "Submitted to Dept DRI", "Dept DRI must approve before OM Leader intake.");
      if (isTemporaryBudgetRequest(row)) {
        addHandoffHistory(row, "Temporary Budget submitted", "Dept DRI initial approval is required before OM quote/bidding.");
      }
    });
  const storedSubmission = persistRequesterLocalDrafts(requests.filter((row) => [...submittedIds.values()].includes(row.id)), [...submittedIds.keys()]);
  setDeptTab("submissions");
  const managerProjectFilter = document.getElementById("managerProjectFilter");
  if (managerProjectFilter) managerProjectFilter.value = "";
  renderManager();
  if (storedSubmission) showToast(`${submitted} item${submitted === 1 ? "" : "s"} submitted to Dept DRI.`, "success");
}
// @end-legacy-unit 1177

export function replaceSubmitRequestsBinding(value) { submitRequests = value; return value; }
