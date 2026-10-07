// shell/events-input.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  handleInputDemandEditorId,
  handleInputRequestActionOther,
  handleInputRequestItemPickerQuery
} from "../demand/events-input-handlers.js";
import {
  handleInputWarehouseSearch
} from "../inventory/events-input-handlers.js";
import {
  handleInputBatchMaterialInputs,
  handleInputMaterialEntryInputs
} from "../materials/events-input-handlers.js";
import {
  handleInputProjectCodeInput
} from "../projects/events-input-handlers.js";
import {
  handleInputStandardNamePickerQuery
} from "./events-input-handlers.js";

// @legacy-unit 1891 26348
export function initializeStep1891() {
document.addEventListener("input", (event) => {
  handleInputWarehouseSearch(event);
  handleInputProjectCodeInput(event);
  handleInputRequestItemPickerQuery(event);
  const requestActionOther = event.target.dataset.requestActionOther;
  handleInputRequestActionOther(requestActionOther, event);
  const materialEntryInputs = {
    materialEntryStandardNameCn: "standardNameCn",
    materialEntryStandardNameEn: "standardNameEn",
    materialEntryStandardNameVn: "standardNameVn",
    materialEntryDetail: "detail",
    materialEntrySpec: "spec",
    materialEntryStructuredSpec: "structuredSpec",
    materialEntryUom: "uom",
    materialEntryEstimatedUnitPrice: "estimatedUnitPrice",
    materialEntryEstimatedAmount: "estimatedAmount",
    materialEntryBudgetRemark: "budgetRemark",
    materialEntryEstimateReason: "estimateReason",
    materialEntryUseCase: "useCase",
    materialEntryDuplicateDifference: "duplicateDifference",
    materialEntryEvidenceReference: "evidenceReference",
  };
  handleInputMaterialEntryInputs(materialEntryInputs, event);
  const batchMaterialInputs = {
    materialBatchStandardNameCn: "standardNameCn",
    materialBatchStandardNameEn: "standardNameEn",
    materialBatchStandardNameVn: "standardNameVn",
    materialBatchDetail: "detail",
    materialBatchSpec: "spec",
    materialBatchUseCase: "useCase",
  };
  handleInputBatchMaterialInputs(batchMaterialInputs, event);
  handleInputStandardNamePickerQuery(event);
  const demandEditorId = event.target.dataset.demandEditorId;
  const demandEditorRow = event.target.dataset.demandEditorRow;
  const demandEditorField = event.target.dataset.demandEditorField;
  handleInputDemandEditorId(demandEditorId, demandEditorRow, demandEditorField, event);
});
}
// @end-legacy-unit 1891
