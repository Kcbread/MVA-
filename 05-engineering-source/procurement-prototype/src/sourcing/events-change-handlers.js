// sourcing/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  updateRfqField
} from "./rfq-actions.js";
import {
  renderRfqDispatch,
  renderRfqFollowUp,
  renderSourcing,
  updateSourcingField
} from "./rfq.js";

export function handleChangeSourcingOwnerFilter(event) {
  if (["sourcingOwnerFilter", "sourcingStatusFilter"].includes(event.target.id)) renderSourcing();
}

export function handleChangeRfqSelect(rfqSelect, event) {
  if (rfqSelect) {
    replaceRequestsBinding(requests.map((row) => row.id === rfqSelect ? { ...row, rfqSelected: event.target.checked } : row));
    renderRfqDispatch();
    renderRfqFollowUp();
  }
}

export function handleChangeRfqField(rfqField, rfqId, event) {
  if (rfqField && rfqId) updateRfqField(rfqId, rfqField, event.target.value);
}

export function handleChangeSourcingField(sourcingField, sourcingId, event) {
  if (sourcingField && sourcingId) updateSourcingField(sourcingId, sourcingField, event.target.value);
}
