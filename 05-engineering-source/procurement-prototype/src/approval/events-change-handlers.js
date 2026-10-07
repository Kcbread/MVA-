// approval/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  normalizeRequesterDateFields
} from "../demand/records.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  addHandoffHistory
} from "../handoff/queue.js";
import {
  renderPriceReviewAnalysis
} from "./analysis-view.js";
import {
  renderManager
} from "./manager-view.js";

export function handleChangePriceReviewDemandCostProjectFilter(event) {
  if ([
    "priceReviewDemandCostProjectFilter",
    "priceReviewDemandCostLineFilter",
    "priceReviewDemandCostPhaseFilter",
    "priceReviewDemandCostLineCount",
    "priceReviewDemandCostViewMode",
  ].includes(event.target.id)) {
    renderPriceReviewAnalysis();
  }
}

export function handleChangePriceReviewQuantityProjectFilter(event) {
  if ([
    "priceReviewQuantityProjectFilter",
    "priceReviewQuantityLineFilter",
    "priceReviewQuantityItemFilter",
    "priceReviewQuantityPhaseFilter",
    "priceReviewQuantityStationFilter",
    "priceReviewQuantityUnitFilter",
    "priceReviewQuantitySortFilter",
  ].includes(event.target.id)) renderPriceReviewAnalysis();
}

export function handleChangeDriDateField(driDateField, driDateId, event) {
  if (driDateField && driDateId) {
    if (driDateField !== "requiredDeliveryDate") {
      renderManager();
      return true;
    }
    replaceRequestsBinding(requests.map((row) => row.id === driDateId
      ? normalizeRequesterDateFields({
        ...row,
        requiredDeliveryDate: event.target.value,
        requiredDeliveryDateDri: event.target.value,
      })
      : row));
    const updated = requests.find((row) => row.id === driDateId);
    addHandoffHistory(updated, "Dept DRI updated required delivery date", event.target.value || "blank");
    renderManager();
    renderDepartment();
  }
}
