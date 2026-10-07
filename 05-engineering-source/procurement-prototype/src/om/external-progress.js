// om/external-progress: authoritative source; see docs/module-map.md.
import {
  BUYER_BLOCKED,
  BUYER_COMPLETED,
  BUYER_PO_ISSUED,
  BUYER_PR_CREATED,
  BUYER_RECEIVED,
  BUYER_RETURNED,
  EXT_ACCEPTED,
  EXT_BLOCKED,
  EXT_CANCELLED,
  EXT_COMPLETED,
  EXT_PACKAGE_PREPARING,
  EXT_PO_ISSUED,
  EXT_PR_CREATED,
  EXT_REJECTED_DRI,
  EXT_REVIEW,
  EXT_SUBMITTED,
  OM_EXPORTED_CFA,
  OM_EXPORTED_ECS,
  OM_EXTERNAL_ACCEPTED,
  OM_EXTERNAL_PENDING,
  OM_REJECTED_TO_DRI,
  USER_CANCELLED_REQUEST
} from "../admin/state.js";
import {
  renderManagerDashboard
} from "../cost/manager-dashboard.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  advanceExternalProgressSequenceBinding,
  externalProgressSequence
} from "../handoff/state.js";
import {
  renderProcurement
} from "../handoff/view.js";
import {
  isMaterialNoPending
} from "../materials/display.js";
import {
  MATERIAL_CREATION_EVENT,
  ensureMaterialMaster
} from "../materials/identity.js";
import {
  addOmHistory
} from "./history.js";
import {
  pendingExternalProgressSource,
  pendingOmExternalResultIds,
  replacePendingExternalProgressSourceBinding,
  replacePendingOmExternalResultIdsBinding
} from "./state.js";
import {
  renderOmPurchasing
} from "./workspace.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  statusClass
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  HANDOFF_SENT_TO_OM,
  OM_COLLECTION_QUOTATION,
  OM_READY_FOR_CFA,
  OM_READY_FOR_ECS
} from "../workflow/status-constants.js";

// @legacy-unit 1609 20136
export function relatedRequestIds(row) {
  return new Set([row.id]);
}
// @end-legacy-unit 1609

// @legacy-unit 1610 20140
export function externalProgressEventsFor(row) {
  const ids = relatedRequestIds(row);
  return requests
    .filter((request) => ids.has(request.id))
    .flatMap((request) => request.externalProgressEvents || [])
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
// @end-legacy-unit 1610

// @legacy-unit 1611 20148
export function materialCreationEventFor(row) {
  return externalProgressEventsFor(row).filter((event) => event.status === MATERIAL_CREATION_EVENT).at(-1) || null;
}
// @end-legacy-unit 1611

// @legacy-unit 1612 20152
export function latestExternalProgressEvent(row) {
  const events = externalProgressEventsFor(row);
  return events[events.length - 1] || null;
}
// @end-legacy-unit 1612

// @legacy-unit 1613 20157
export function externalStatusFor(row) {
  const latest = latestExternalProgressEvent(row);
  if (latest) return latest.status;
  if (row.userAQuoteDecisionStatus === USER_CANCELLED_REQUEST || row.status === USER_CANCELLED_REQUEST) return EXT_CANCELLED;
  if ([OM_EXPORTED_CFA, OM_EXPORTED_ECS, OM_READY_FOR_CFA, OM_READY_FOR_ECS].includes(row.finalExportStatus)) return row.finalExportStatus;
  if (row.buyerStatus === BUYER_COMPLETED) return EXT_COMPLETED;
  if (row.buyerStatus === BUYER_PO_ISSUED) return EXT_PO_ISSUED;
  if (row.buyerStatus === BUYER_PR_CREATED) return EXT_PR_CREATED;
  if (row.buyerStatus === BUYER_BLOCKED) return EXT_BLOCKED;
  if (row.externalReviewStatus === OM_REJECTED_TO_DRI) return EXT_REJECTED_DRI;
  if (row.externalReviewStatus === OM_EXTERNAL_ACCEPTED || row.buyerStatus === BUYER_RECEIVED) return EXT_ACCEPTED;
  if (row.externalReviewStatus === OM_EXTERNAL_PENDING) return EXT_REVIEW;
  if (row.procurementStatus === HANDOFF_SENT_TO_OM || row.omCollectionStatus === OM_COLLECTION_QUOTATION) return EXT_PACKAGE_PREPARING;
  return "-";
}
// @end-legacy-unit 1613

// @legacy-unit 1614 20173
export function externalOwnerFor(row) {
  const status = externalStatusFor(row);
  if ([EXT_PR_CREATED, EXT_PO_ISSUED, EXT_COMPLETED].includes(status)) return "Buyer";
  if ([EXT_REVIEW, EXT_ACCEPTED].includes(status)) return "External System";
  if (status === EXT_REJECTED_DRI) return "Requester / DRI";
  if (status === "-") return "-";
  return "OM Purchasing";
}
// @end-legacy-unit 1614

// @legacy-unit 1615 20182
export function externalEvidenceCount(row) {
  return externalProgressEventsFor(row).filter((event) => event.evidenceFileName || event.pastedExternalResult).length;
}
// @end-legacy-unit 1615

// @legacy-unit 1616 20186
export function externalEvidenceLabel(row) {
  const count = externalEvidenceCount(row);
  return count ? `${count} evidence` : "Missing";
}
// @end-legacy-unit 1616

// @legacy-unit 1617 20191
export function hasEvidencePayload(payload) {
  return Boolean((payload.evidenceFileName || "").trim() || (payload.pastedExternalResult || "").trim());
}
// @end-legacy-unit 1617

// @legacy-unit 1618 20195
export function validateExternalProgressPayload(payload) {
  const status = payload.status;
  const hasEvidence = hasEvidencePayload(payload);
  if (!status) return "Select an external progress status.";
  if (status === EXT_REJECTED_DRI && !(payload.reason || "").trim()) {
    return "Reject to DRI requires a reason.";
  }
  if (status === EXT_BLOCKED && !(payload.reason || "").trim()) {
    return "Blocked requires a reason.";
  }
  if ([EXT_SUBMITTED, EXT_PR_CREATED, EXT_PO_ISSUED, EXT_COMPLETED].includes(status) && !hasEvidence) {
    return `${status} requires screenshot, pasted result, email, PDF, Excel, or zip evidence.`;
  }
  if (status === EXT_PR_CREATED && !(payload.prNo || "").trim()) return "PR Created requires PR No.";
  if (status === EXT_PO_ISSUED && !(payload.poNo || "").trim()) return "PO Issued requires PO No.";
  return "";
}
// @end-legacy-unit 1618

// @legacy-unit 1619 20213
export function createExternalProgressEvent(row, payload) {
  const actor = roleProfiles[currentRole]?.name || "System";
  return {
    id: `EXT-${String(advanceExternalProgressSequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    step: payload.status,
    status: payload.status,
    owner: payload.owner || actor,
    externalSystem: payload.externalSystem || row.externalSystem || "",
    externalRequestNo: payload.externalRequestNo || row.externalRequestNo || "",
    prNo: payload.prNo || row.prNo || "",
    poNo: payload.poNo || row.buyerPoNo || row.poNo || "",
    factoryMaterialNo: payload.factoryMaterialNo || row.factoryMaterialNo || "",
    reason: payload.reason || "",
    evidenceType: payload.evidenceType || "",
    evidenceFileName: payload.evidenceFileName || "",
    pastedExternalResult: payload.pastedExternalResult || "",
    createdBy: actor,
    createdAt: new Date().toISOString(),
  };
}
// @end-legacy-unit 1619

// @legacy-unit 1620 20237
export function createMaterialCreationTimelineEvent(row, material, triggerEvent, sourceLabel) {
  return {
    id: `EXT-${String(advanceExternalProgressSequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    step: MATERIAL_CREATION_EVENT,
    status: MATERIAL_CREATION_EVENT,
    owner: "Material Master",
    externalSystem: triggerEvent?.externalSystem || row.externalSystem || "",
    externalRequestNo: triggerEvent?.externalRequestNo || row.externalRequestNo || "",
    prNo: triggerEvent?.prNo || row.prNo || "",
    poNo: triggerEvent?.poNo || row.buyerPoNo || row.poNo || "",
    reason: `${material.materialNo} ${sourceLabel}.`,
    evidenceType: triggerEvent?.evidenceType || "",
    evidenceFileName: triggerEvent?.evidenceFileName || "",
    pastedExternalResult: triggerEvent?.pastedExternalResult || "",
    createdBy: "System",
    createdAt: new Date().toISOString(),
    materialId: material.materialId,
    materialNo: material.materialNo,
    sourceExternalEventId: triggerEvent?.id || "",
  };
}
// @end-legacy-unit 1620

// @legacy-unit 1621 20262
export function ensureMaterialMasterFromExternalProgress(row, event) {
  return ensureMaterialMaster(row, {
    createdBy: event.createdBy || "System",
    source: `External progress: ${event.status}`,
    createdFromRequestId: row.id,
    sourceProject: row.project,
    sourceRecordId: row.sourceRecordId || "",
    sourceExternalEventId: event.id,
    sourcePrNo: event.prNo || "",
    sourcePoNo: event.poNo || "",
  });
}
// @end-legacy-unit 1621

// @legacy-unit 1622 20275
export function appendMaterialCreationTimeline(row, material, event) {
  const sourceLabel = event.status === EXT_PO_ISSUED
    ? "created from PO Issued"
    : event.status === EXT_PR_CREATED ? "created from PR Created" : "created from legacy maintenance";
  return createMaterialCreationTimelineEvent(row, material, event, sourceLabel);
}
// @end-legacy-unit 1622

// @legacy-unit 1623 20282
export function externalProgressTimelineHtml(row, { compact = false } = {}) {
  const events = externalProgressEventsFor(row);
  if (!events.length) return compact ? "-" : `<div class="empty-state">No external progress evidence yet.</div>`;
  if (compact) {
    const latest = events[events.length - 1];
    return `${latest.status}<div class="reason-text">${latest.externalRequestNo || latest.evidenceFileName || latest.reason || "Evidence recorded"}</div>`;
  }
  return `
    <div class="detail-subsection external-timeline">
      <h4>External Progress Timeline</h4>
      ${events.map((event) => `
        <article class="om-timeline-event">
          <div class="om-timeline-head">
            <span class="status-pill ${statusClass(event.status)}">${event.status}</span>
            <strong>${event.externalRequestNo || event.prNo || event.poNo || "No external no."}</strong>
          </div>
          <p>${event.reason || event.pastedExternalResult || "-"}</p>
          <small>${event.createdBy} · ${new Date(event.createdAt).toLocaleString("en-US")} · ${event.evidenceFileName || "No file"}</small>
        </article>`).join("")}
    </div>`;
}
// @end-legacy-unit 1623

// @legacy-unit 1829 24309
export function buyerStatusFromExternalStatus(status, previousStatus = "") {
  if ([EXT_ACCEPTED, EXT_SUBMITTED, EXT_REVIEW].includes(status)) return previousStatus || BUYER_RECEIVED;
  if (status === EXT_BLOCKED) return BUYER_BLOCKED;
  if (status === EXT_PR_CREATED) return BUYER_PR_CREATED;
  if (status === EXT_PO_ISSUED) return BUYER_PO_ISSUED;
  if (status === EXT_COMPLETED) return BUYER_COMPLETED;
  if (status === EXT_REJECTED_DRI) return BUYER_RETURNED;
  return previousStatus;
}
// @end-legacy-unit 1829

// @legacy-unit 1830 24319
export function externalReviewStatusFromProgress(status) {
  if (status === EXT_ACCEPTED) return OM_EXTERNAL_ACCEPTED;
  if (status === EXT_SUBMITTED || status === EXT_REVIEW) return OM_EXTERNAL_PENDING;
  if (status === EXT_REJECTED_DRI) return OM_REJECTED_TO_DRI;
  return "";
}
// @end-legacy-unit 1830

// @legacy-unit 1831 24326
export function externalProgressAction(status) {
  if (status === EXT_BLOCKED) return "Buyer blocked";
  if (status === EXT_REJECTED_DRI) return "Rejected to DRI";
  return status;
}
// @end-legacy-unit 1831

// @legacy-unit 1832 24332
export function commitExternalResult(rows, payload) {
  if (!rows.length) {
    showToast("Select at least one row before updating external progress.", "error");
    return false;
  }
  const validation = validateExternalProgressPayload(payload);
  if (validation) {
    showToast(validation, "error");
    return false;
  }
  replaceRequestsBinding(requests.map((row) => {
    if (!rows.some((selected) => selected.id === row.id)) return row;
    const event = createExternalProgressEvent(row, payload);
    const externalReviewStatus = externalReviewStatusFromProgress(payload.status) || row.externalReviewStatus;
    const rejectedToDri = payload.status === EXT_REJECTED_DRI;
		    let nextRow = {
		      ...row,
		      status: rejectedToDri ? "Rejected" : row.status,
      selected: false,
      handoffSelected: false,
      rfqSelected: false,
      omSelected: false,
      omStatus: payload.status,
	      externalReviewStatus,
	      externalRejectReason: rejectedToDri ? payload.reason : row.externalRejectReason || "",
	      externalRejectOwner: rejectedToDri ? "Requester / DRI" : row.externalRejectOwner || "",
	      omRejectReworkRequired: rejectedToDri ? true : row.omRejectReworkRequired || false,
	      omRejectedAt: rejectedToDri ? new Date().toISOString() : row.omRejectedAt || "",
	      omRejectedBy: rejectedToDri ? roleProfiles[currentRole]?.name || payload.owner || "OM Purchasing" : row.omRejectedBy || "",
	      omRejectReason: rejectedToDri ? payload.reason : row.omRejectReason || "",
	      procurementStatus: rejectedToDri ? EXT_REJECTED_DRI : row.procurementStatus,
      buyerStatus: rejectedToDri ? "" : buyerStatusFromExternalStatus(payload.status, row.buyerStatus),
      buyerReceivedAt: [EXT_ACCEPTED, EXT_SUBMITTED, EXT_REVIEW, EXT_PR_CREATED, EXT_PO_ISSUED, EXT_COMPLETED].includes(payload.status) ? (row.buyerReceivedAt || new Date().toISOString()) : row.buyerReceivedAt,
      externalSystem: payload.externalSystem || row.externalSystem,
      externalRequestNo: payload.externalRequestNo || row.externalRequestNo,
      prNo: payload.prNo || row.prNo,
      buyerPoNo: payload.poNo || row.buyerPoNo,
      factoryMaterialNo: payload.factoryMaterialNo || row.factoryMaterialNo || "",
	      externalProgressEvents: [...(row.externalProgressEvents || []), event],
	    };
	    if ([EXT_PR_CREATED, EXT_PO_ISSUED].includes(payload.status) && isMaterialNoPending(nextRow)) {
	      const materialPatch = ensureMaterialMasterFromExternalProgress(nextRow, event);
	      const materialEvent = appendMaterialCreationTimeline(nextRow, materialPatch, event);
	      nextRow = {
	        ...nextRow,
	        ...materialPatch,
	        partNo: materialPatch.materialNo,
	        externalProgressEvents: [...nextRow.externalProgressEvents, materialEvent],
	      };
	      addOmHistory(nextRow, MATERIAL_CREATION_EVENT, `${materialPatch.materialNo} created from ${payload.status}.`);
	      addHandoffHistory(nextRow, MATERIAL_CREATION_EVENT, `${materialPatch.materialNo} created from ${payload.status}.`);
	    }
	    const historyNote = payload.reason || payload.pastedExternalResult || payload.evidenceFileName || "External progress evidence recorded.";
	    addOmHistory(nextRow, externalProgressAction(payload.status), historyNote);
    addHandoffHistory(nextRow, externalProgressAction(payload.status), historyNote);
    return nextRow;
  }));
  renderOmPurchasing();
  renderProcurement();
  renderBuyer();
  renderDepartment();
  renderManagerDashboard();
  showToast("External progress event saved.", "success");
  return true;
}
// @end-legacy-unit 1832

// @legacy-unit 1833 24398
export function openOmExternalResultModal(rows, presetResult = "", source = "om") {
  if (!rows.length) {
    showToast("Select at least one row before updating external progress.", "error");
    return;
  }
  replacePendingOmExternalResultIdsBinding(rows.map((row) => row.id));
  replacePendingExternalProgressSourceBinding(source);
  const scope = rows.length === 1 ? `${rows[0].id} · ${rows[0].name}` : `${rows.length} selected rows`;
  document.getElementById("omExternalResultTitle").textContent = presetResult === EXT_REJECTED_DRI
    ? "Reject to DRI"
    : source === "buyer" ? "Record Buyer Progress" : source === "mfg" ? "Update MFG External Progress" : "Update External Progress";
  document.getElementById("omExternalResultScope").textContent = scope;
  document.getElementById("modalOmExternalResult").value = presetResult;
  document.getElementById("modalOmExternalReason").value = "";
  document.getElementById("modalExternalSystem").value = rows.length === 1 ? rows[0].externalSystem || "" : "";
  document.getElementById("modalExternalRequestNo").value = rows.length === 1 ? rows[0].externalRequestNo || "" : "";
  document.getElementById("modalExternalPrNo").value = rows.length === 1 ? rows[0].prNo || "" : "";
  document.getElementById("modalExternalPoNo").value = rows.length === 1 ? rows[0].buyerPoNo || rows[0].poNo || "" : "";
  document.getElementById("modalExternalFactoryMaterialNo").value = rows.length === 1 ? rows[0].factoryMaterialNo || "" : "";
  document.getElementById("modalExternalEvidenceType").value = "";
  document.getElementById("modalExternalPastedResult").value = "";
  document.getElementById("modalExternalScreenshot").value = "";
  document.getElementById("modalExternalEvidenceFile").value = "";
  document.getElementById("omExternalResultModal").hidden = false;
}
// @end-legacy-unit 1833

// @legacy-unit 1834 24424
export function closeOmExternalResultModal() {
  replacePendingOmExternalResultIdsBinding([]);
  replacePendingExternalProgressSourceBinding("om");
  document.getElementById("omExternalResultModal").hidden = true;
}
// @end-legacy-unit 1834

// @legacy-unit 1835 24430
export function submitOmExternalResult(event) {
  event.preventDefault();
  const rows = requests.filter((row) => pendingOmExternalResultIds.includes(row.id));
  const screenshotName = document.getElementById("modalExternalScreenshot").files?.[0]?.name || "";
  const evidenceName = document.getElementById("modalExternalEvidenceFile").files?.[0]?.name || "";
  const payload = {
    status: document.getElementById("modalOmExternalResult").value,
    externalSystem: document.getElementById("modalExternalSystem").value.trim(),
    externalRequestNo: document.getElementById("modalExternalRequestNo").value.trim(),
    prNo: document.getElementById("modalExternalPrNo").value.trim(),
    poNo: document.getElementById("modalExternalPoNo").value.trim(),
    factoryMaterialNo: document.getElementById("modalExternalFactoryMaterialNo").value.trim(),
    evidenceType: document.getElementById("modalExternalEvidenceType").value,
    evidenceFileName: [screenshotName, evidenceName].filter(Boolean).join(" / "),
    pastedExternalResult: document.getElementById("modalExternalPastedResult").value.trim(),
    reason: document.getElementById("modalOmExternalReason").value.trim(),
    owner: pendingExternalProgressSource === "buyer" ? "Buyer" : pendingExternalProgressSource === "mfg" ? "MFG Coordinator" : "OM Purchasing",
  };
  if (pendingExternalProgressSource === "buyer" && payload.status === EXT_REJECTED_DRI) {
    showToast("Buyer uses Blocked status instead of Reject to DRI.", "error");
    return;
  }
  if (commitExternalResult(rows, payload)) closeOmExternalResultModal();
}
// @end-legacy-unit 1835

export function replaceCommitExternalResultBinding(value) { commitExternalResult = value; return value; }
