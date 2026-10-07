// handoff/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  clampQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  toggleQuoteException,
  updateHandoffRemark,
  updateProcurementField
} from "./actions.js";
import {
  renderBuyer,
  updateBuyerField
} from "./buyer.js";
import {
  renderProcurement
} from "./view.js";

export function handleChangeHandoffProjectFilter(event) {
  if (["handoffProjectFilter", "handoffRouteFilter", "handoffExportStatusFilter"].includes(event.target.id)) renderProcurement();
}

export function handleChangeBuyerProjectFilter(event) {
  if (["buyerProjectFilter", "buyerStatusFilter"].includes(event.target.id)) renderBuyer();
}

export function handleChangeHandoffSelect(handoffSelect, event) {
  if (handoffSelect) {
    replaceRequestsBinding(requests.map((row) => row.id === handoffSelect ? { ...row, handoffSelected: event.target.checked, rfqSelected: event.target.checked } : row));
    renderProcurement();
  }
}

export function handleChangeBuyerField(buyerField, buyerId, event) {
  if (buyerField && buyerId) updateBuyerField(buyerId, buyerField, event.target.value);
}

export function handleChangePriceId(priceId, event) {
  if (priceId) updateProcurementField(priceId, "updatedPrice", clampQty(event.target.value));
}

export function handleChangeAssignedId(assignedId, event) {
  if (assignedId) updateProcurementField(assignedId, "assignedTo", event.target.value);
}

export function handleChangeRemarkId(remarkId, event) {
  if (remarkId) updateHandoffRemark(remarkId, event.target.value);
}

export function handleChangeQuoteExceptionId(quoteExceptionId, event) {
  if (quoteExceptionId) toggleQuoteException(quoteExceptionId, event.target.checked);
}
