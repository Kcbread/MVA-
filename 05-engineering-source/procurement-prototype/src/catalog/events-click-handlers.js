// catalog/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderSelectedDemandLines
} from "../demand/selected-lines.js";
import {
  addHistoryRecord
} from "./add-actions.js";
import {
  renderHistoryPackageRows,
  renderHistoryRows
} from "./history-view.js";
import {
  copyHistory,
  importHistoryPackage
} from "./reuse.js";
import {
  clearHistorySearch,
  clearNaturalSearch,
  runHistorySearch,
  runNaturalSearch
} from "./search-actions.js";
import {
  replaceCurrentReuseModeBinding
} from "./state.js";

export function handleClickReuseModeTab(reuseModeTab) {
  if (reuseModeTab) {
    const nextReuseMode = reuseModeTab.dataset.reuseModeTab || "catalog";
    replaceCurrentReuseModeBinding(["catalog", "reuse", "package"].includes(nextReuseMode) ? nextReuseMode : "catalog");
    renderHistoryRows();
    renderSelectedDemandLines();
  }
}

export function handleClickNaturalSearch(action) {
  if (action === "naturalSearch") runNaturalSearch();
  if (action === "clearNaturalSearch") clearNaturalSearch();
}

export function handleClickHistorySearch(action) {
  if (action === "historySearch") runHistorySearch();
  if (action === "clearHistorySearch") clearHistorySearch();
  if (action === "previewHistoryPackage") renderHistoryPackageRows();
  if (action === "importHistoryPackage") importHistoryPackage();
}

export function handleClickCopyHistory(action, addHistoryRecordButton) {
  if (action === "copyHistory") copyHistory();
  if (action === "useHistorySourceQty") copyHistory(false);
  if (addHistoryRecordButton) addHistoryRecord(addHistoryRecordButton.dataset.addHistoryRecord);
}
