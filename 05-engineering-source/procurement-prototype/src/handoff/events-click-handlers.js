// handoff/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  requests
} from "../demand/state.js";
import {
  exportHandoffPackages
} from "../exports/handoff.js";
import {
  openOmExternalResultModal
} from "../om/external-progress.js";
import {
  setHandoffTab
} from "../shell/navigation.js";

export function handleClickHandoffTab(handoffTab) {
  if (handoffTab) setHandoffTab(handoffTab.dataset.handoffTab);
}

export function handleClickExportHandoffPackages(action) {
  if (action === "exportHandoffPackages") exportHandoffPackages();
}

export function handleClickBuyerProgressButton(buyerProgressButton) {
  if (buyerProgressButton) {
    const row = requests.find((item) => item.id === buyerProgressButton.dataset.buyerProgress);
    if (row) openOmExternalResultModal([row], "", "buyer");
  }
}
