// materials/new-item: authoritative source; see docs/module-map.md.
import {
  closeItemPicker
} from "../catalog/context.js";
import {
  materialDuplicateCandidateRows
} from "../catalog/match.js";
import {
  closeRequestItemPicker
} from "../catalog/search.js";
import {
  requesterLocalDraftKey
} from "../demand/drafts.js";
import {
  clampQty
} from "../demand/quantity.js";
import {
  requestFromRecord
} from "../demand/records.js";
import {
  replaceRequestsBinding,
  requestWorksheetLine,
  requestWorksheetMode,
  requests
} from "../demand/state.js";
import {
  requestWorksheetOverrides
} from "../demand/worksheet-actions.js";
import {
  suggestionToRecord
} from "./demand-conversion.js";
import {
  isLegacyMaintenance
} from "./display.js";
import {
  closeMaterialEntry,
  materialEntryRow,
  openMaterialEntry
} from "./entry-view.js";
import {
  MATERIAL_STANDARD_NAME_REQUESTED
} from "./identity.js";
import {
  exactStandardPart
} from "./standard-names.js";
import {
  advanceNewItemSequenceBinding,
  newItemSelections,
  newItemSequence,
  newItemSuggestions,
  replaceNewItemSelectionsBinding,
  replaceNewItemSuggestionsBinding
} from "./state.js";
import {
  createMaterialCreationTimelineEvent
} from "../om/external-progress.js";
import {
  STAGES
} from "../projects/config.js";
import {
  currentProject,
  currentProjectCode,
  replaceCurrentProjectBinding
} from "../projects/state.js";
import {
  currentRole
} from "../session/state.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  setDeptTab,
  setView
} from "../shell/navigation.js";

// @legacy-unit 1181 14215
export function createNewItemSuggestion(seed = {}) {
  const draftContext = [requesterLocalDraftKey(), currentProject, currentProjectCode, requestWorksheetMode, requestWorksheetLine].join("|");
  try {
    const stored = readLocalItemDrafts()[draftContext];
    if (stored?.simplifiedEntry && stored.status === "Draft" && stored.draftContext === draftContext && !newItemSuggestions.some((row) => row.draftContext === draftContext)) {
      stored.id = `NIS-${Date.now()}-${advanceNewItemSequenceBinding(1, true)}`;
      newItemSuggestions.unshift(stored);
    }
  } catch (error) {
    showToast("The saved new item draft could not be restored.", "error");
  }
  const existingDraft = newItemSuggestions.find((row) => row.simplifiedEntry && row.draftContext === draftContext && row.status === "Draft");
  if (existingDraft) {
    closeRequestItemPicker();
    openMaterialEntry(existingDraft.id);
    return;
  }
  const rawSeed = typeof seed === "string" ? { query: seed } : (seed || {});
  const query = String(rawSeed.query || "").trim();
  const duplicateCandidates = Array.isArray(rawSeed.duplicateCandidates) ? rawSeed.duplicateCandidates : [];
  const suggestion = {
    id: `NIS-${String(advanceNewItemSequenceBinding(1, true)).padStart(4, "0")}`,
    mode: "New Material",
    simplifiedEntry: true,
    entryStep: "search",
    draftContext,
    project: currentProject,
    name: query,
    standardNameCn: query,
    standardNameEn: "",
    standardNameVn: "",
    detail: "",
    spec: "",
    structuredSpec: "",
    uom: "",
    estimatedUnitPrice: 0,
    estimatedAmount: 0,
    budgetRemark: "",
    estimateReason: "",
    level1: "",
    level2: "",
    level3: "",
    useCase: "",
    duplicateDifference: "",
    evidenceReference: "",
    duplicateCandidates,
    status: "Draft",
    managerReason: "",
    requestId: "",
    masterRecordId: "",
    materialStatus: "",
    standardNameStatus: "",
    submittedAt: "",
    decidedAt: "",
  };
  replaceNewItemSuggestionsBinding([suggestion, ...newItemSuggestions]);
  persistLocalItemDraft(suggestion);
  replaceNewItemSelectionsBinding(new Set([suggestion.id]));
  setView("department");
  setDeptTab("request");
  closeItemPicker();
  closeRequestItemPicker();
  openMaterialEntry(suggestion.id);
}
// @end-legacy-unit 1181

// @legacy-unit 1182 14280
export function readLocalItemDrafts() {
  const data = JSON.parse(localStorage.getItem(requesterLocalDraftKey() + ":new-items") || "{}");
  if (!data || Array.isArray(data) || typeof data !== "object") throw new Error("Invalid new item drafts");
  return data;
}
// @end-legacy-unit 1182

// @legacy-unit 1183 14286
export function persistLocalItemDraft(row, remove = false) {
  if (!row?.simplifiedEntry || !row.draftContext) return;
  try {
    const drafts = readLocalItemDrafts();
    if (remove) delete drafts[row.draftContext];
    else drafts[row.draftContext] = row;
    localStorage.setItem(requesterLocalDraftKey() + ":new-items", JSON.stringify(drafts));
    return true;
  } catch (error) {
    showToast("New item draft could not be saved on this browser. Keep this page open.", "error");
    return false;
  }
}
// @end-legacy-unit 1183

// @legacy-unit 1184 14300
export function canRequesterEditSuggestion(row) {
  return ["requester", "admin"].includes(currentRole) && row && row.status === "Draft";
}
// @end-legacy-unit 1184

// @legacy-unit 1185 14304
export function validateNewItem(values) {
  if (values.simplifiedEntry) {
    if (![values.standardNameCn, values.level1, values.level2, values.level3, values.spec, values.uom, values.useCase].every((value) => String(value || "").trim())) {
      showToast("Enter an item name, all category levels, specification, unit, and use case.", "error");
      return false;
    }
    if ((values.duplicateCandidates || []).length && !String(values.duplicateDifference || "").trim()) {
      showToast("Explain the difference from the similar items.", "error");
      return false;
    }
    return true;
  }
  if (!values.level1 || !values.level2 || !values.level3) {
    showToast("LV1, LV2, and LV3 are required before adding to Request.", "error");
    return false;
  }
  if (!values.standardNameCn || !values.standardNameEn || !values.standardNameVn || !values.detail || !values.spec || !values.structuredSpec || !values.uom || !values.useCase) {
    showToast("Part name CN/EN/VN, detail, spec summary, structured spec, UOM, and reason / use case are required.", "error");
    return false;
  }
  if (!clampQty(values.estimatedUnitPrice) || !clampQty(values.estimatedAmount) || !(values.estimateReason || values.budgetRemark)) {
    showToast("Estimated unit price, estimated amount, and estimate reason are required for a new material request.", "error");
    return false;
  }
  if ((values.duplicateCandidates || []).length && (!values.duplicateDifference || !values.evidenceReference)) {
    showToast("Potential duplicate items found. Add the difference reason and evidence/reference before submitting.", "error");
    return false;
  }
  if (!exactStandardPart(values) && values.standardNameStatus !== MATERIAL_STANDARD_NAME_REQUESTED) {
    showToast("Select a matching Standard Part Name after LV123, or propose a new standard name after searching.", "error");
    return false;
  }
  return true;
}
// @end-legacy-unit 1185

// @legacy-unit 1186 14339
export function optionTags(options, value, placeholder) {
  return [`<option value="">${placeholder}</option>`, ...options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`)].join("");
}
// @end-legacy-unit 1186

// @legacy-unit 1187 14343
export function updateNewItemField(id, field, value) {
  replaceNewItemSuggestionsBinding(newItemSuggestions.map((row) => {
    if (row.id !== id || !canRequesterEditSuggestion(row)) return row;
    const normalizedValue = ["estimatedUnitPrice", "estimatedAmount"].includes(field) ? clampQty(value) : value;
    const next = { ...row, [field]: normalizedValue };
    if (row.simplifiedEntry) {
      if (field === "level1") { next.level2 = ""; next.level3 = ""; }
      if (field === "level2") next.level3 = "";
      if (field === "standardNameCn") {
        next.name = value;
        next.duplicateCandidates = materialDuplicateCandidateRows(value);
      }
      next.standardNameStatus = exactStandardPart(next) ? "" : MATERIAL_STANDARD_NAME_REQUESTED;
      return next;
    }
    if (field === "level1") {
      next.level2 = "";
      next.level3 = "";
      next.standardNameCn = "";
      next.standardNameEn = "";
      next.standardNameVn = "";
    }
    if (field === "level2") {
      next.level3 = "";
      next.standardNameCn = "";
      next.standardNameEn = "";
      next.standardNameVn = "";
    }
    if (field === "level3") {
      next.standardNameCn = "";
      next.standardNameEn = "";
      next.standardNameVn = "";
    }
    if (field === "standardNameCn") {
      const previousStandard = exactStandardPart(row);
      const standard = exactStandardPart(next);
      if (standard) {
        next.name = standard.cn;
        next.standardNameCn = standard.cn;
        next.standardNameEn = standard.en;
        next.standardNameVn = standard.vn;
        if (next.standardNameStatus === MATERIAL_STANDARD_NAME_REQUESTED) next.standardNameStatus = "";
      } else if (previousStandard) {
        next.name = value;
        next.standardNameEn = "";
        next.standardNameVn = "";
      }
    }
    return next;
  }));
}
// @end-legacy-unit 1187

// @legacy-unit 1217 14791
export function submitMaterialEntry(event) {
  event.preventDefault();
  const row = materialEntryRow();
  if (row?.simplifiedEntry && row.entryStep !== "create") return;
  if (!row || !validateNewItem(row)) return;
  replaceNewItemSelectionsBinding(new Set([row.id]));
  submitNewItemSuggestion();
  closeMaterialEntry({ discard: false });
}
// @end-legacy-unit 1217

// @legacy-unit 1218 14801
export function submitNewItemSuggestion() {
  const ids = [...newItemSelections];
  if (!ids.length) {
    showToast("Select at least one draft new item before adding to Request.", "error");
    return;
  }
  addSuggestionsToRequest(ids);
}
// @end-legacy-unit 1218

// @legacy-unit 1219 14810
export function addSuggestionsToRequest(ids) {
  const selectedRows = newItemSuggestions.filter((row) => ids.includes(row.id) && canRequesterEditSuggestion(row));
  const invalidRow = selectedRows.find((row) => !validateNewItem(row));
  if (invalidRow) {
    return;
  }

  const newMaterialRequests = [];
  selectedRows.forEach((row) => {
    const record = suggestionToRecord(row);
    const request = requestFromRecord(record, {
      ...(row.simplifiedEntry ? requestWorksheetOverrides(record, { type: "new", badge: "New Item Request", row: record }, STAGES) : {}),
      ...(row.simplifiedEntry ? {
        uom: row.uom,
        spec: row.spec,
        itemMasterRequestStatus: "Pending Material Review",
        duplicateDifference: row.duplicateDifference,
        evidenceReference: row.evidenceReference,
        duplicateCandidates: row.duplicateCandidates,
      } : {}),
      requesterReason: row.useCase,
      selected: true,
      status: "Draft",
    });
    const targetRequest = row.targetRequestId ? requests.find((item) => item.id === row.targetRequestId) : null;
    const completedRequest = targetRequest ? requestFromRecord(record, {
      ...targetRequest,
      id: targetRequest.id,
      project: targetRequest.project,
      sourceProject: targetRequest.sourceProject,
      selected: targetRequest.selected,
      requesterReason: targetRequest.requesterReason || row.useCase,
      status: targetRequest.status,
    }) : request;
    if (isLegacyMaintenance(row) && request.materialNo) {
      const materialEvent = createMaterialCreationTimelineEvent(
        completedRequest,
        completedRequest,
        null,
        "created or reused from legacy material maintenance"
      );
      const nextRequest = {
        ...completedRequest,
        externalProgressEvents: [...(completedRequest.externalProgressEvents || []), materialEvent],
      };
      if (targetRequest) {
        replaceRequestsBinding(requests.map((item) => item.id === targetRequest.id ? nextRequest : item));
      } else {
        newMaterialRequests.push(nextRequest);
      }
      return;
    }
    if (targetRequest) {
      replaceRequestsBinding(requests.map((item) => item.id === targetRequest.id ? completedRequest : item));
    } else {
      newMaterialRequests.push(completedRequest);
    }
  });
  replaceRequestsBinding([...newMaterialRequests, ...requests]);
  selectedRows.filter((row) => row.simplifiedEntry).forEach((row) => persistLocalItemDraft(row, true));
  replaceNewItemSuggestionsBinding(newItemSuggestions.filter((row) => !ids.includes(row.id)));
  newItemSelections.clear();
  replaceCurrentProjectBinding(selectedRows[0]?.project || currentProject);
  document.getElementById("projectSelect").value = currentProject;
  const createdNow = selectedRows.filter(isLegacyMaintenance).length;
  const pendingNow = selectedRows.length - createdNow;
  const message = [
    createdNow ? `${createdNow} legacy material${createdNow === 1 ? "" : "s"} created/reused` : "",
    pendingNow ? `${pendingNow} new item${pendingNow === 1 ? "" : "s"} Pending Material Review` : "",
  ].filter(Boolean).join("; ");
  showToast(`${message || selectedRows.length} added to Request as draft.`, "success");
  setDeptTab("request");
}
// @end-legacy-unit 1219

export function replaceCreateNewItemSuggestionBinding(value) { createNewItemSuggestion = value; return value; }
