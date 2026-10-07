// sourcing/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  closeRfqEmailDraft,
  copyRfqEmailDraft,
  exportRfqExcel,
  generateRfqEmailDraft,
  markRfqDispatched,
  runRfqBuyerGroupAction,
  sendRfqSelectedToBuyer
} from "./rfq-actions.js";

export function handleClickExportRfqExcel(action) {
  if (action === "exportRfqExcel") exportRfqExcel();
}

export function handleClickGenerateRfqEmailDraft(action) {
  if (action === "generateRfqEmailDraft") generateRfqEmailDraft();
  if (action === "markRfqDispatched") markRfqDispatched();
  if (action === "sendRfqSelectedToBuyer") sendRfqSelectedToBuyer();
  if (action === "closeRfqEmailDraft") closeRfqEmailDraft();
  if (action === "copyRfqEmailDraft") copyRfqEmailDraft();
}

export function handleClickRfqGroupButton(rfqGroupButton) {
  if (rfqGroupButton) runRfqBuyerGroupAction(rfqGroupButton.dataset.rfqGroupBuyer, rfqGroupButton.dataset.rfqGroupAction);
}
