// catalog/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderHistoryPackageRows
} from "./history-view.js";
import {
  runHistorySearch,
  runNaturalSearch
} from "./search-actions.js";
import {
  historySelections
} from "./state.js";
import {
  syncCascade
} from "./taxonomy.js";

export function handleChangeNaturalLevel1(event) {
  if (["naturalLevel1", "naturalLevel2"].includes(event.target.id)) {
    if (event.target.id === "naturalLevel1") {
      document.getElementById("naturalLevel2").value = "";
      document.getElementById("naturalLevel3").value = "";
    }
    if (event.target.id === "naturalLevel2") document.getElementById("naturalLevel3").value = "";
    syncCascade("natural");
    runNaturalSearch();
  }
  if (event.target.id === "naturalLevel3") runNaturalSearch();
  if (["historyLevel1", "historyLevel2"].includes(event.target.id)) {
    if (event.target.id === "historyLevel1") {
      document.getElementById("historyLevel2").value = "";
      document.getElementById("historyLevel3").value = "";
    }
    if (event.target.id === "historyLevel2") document.getElementById("historyLevel3").value = "";
    syncCascade("history");
    runHistorySearch();
  }
  if (event.target.id === "historyLevel3") runHistorySearch();
  if (["historyPackageSourceProject", "historyPackageSourcePhase", "historyPackageSourcePackage"].includes(event.target.id)) renderHistoryPackageRows();
}

export function handleChangeHistorySourceProject(event) {
  if (event.target.id === "historySourceProject") runHistorySearch();
}

export function handleChangeHistoryId(historyId, event) {
  if (historyId) {
    if (event.target.checked) historySelections.add(historyId);
    else historySelections.delete(historyId);
  }
}
