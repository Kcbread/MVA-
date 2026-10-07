// catalog/search-actions: authoritative source; see docs/module-map.md.
import {
  BUYER_COMPLETED,
  BUYER_PO_ISSUED
} from "../admin/state.js";
import {
  renderHistoryRows
} from "./history-view.js";
import {
  renderNaturalRows
} from "./natural-search-view.js";
import {
  omCatalogRows
} from "./records.js";
import {
  historyResults,
  historySearchActive,
  naturalSearchActive,
  replaceHistoryResultsBinding,
  replaceHistorySearchActiveBinding,
  replaceNaturalSearchActiveBinding,
  replaceSearchResultsBinding,
  searchResults
} from "./state.js";
import {
  syncCascade
} from "./taxonomy.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  requests
} from "../demand/state.js";
import {
  itemDetail,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  factoryMaterialNoFor,
  partName
} from "../materials/identity.js";
import {
  applyOmResponsibility
} from "../om/ownership.js";
import {
  currentProject
} from "../projects/state.js";
import {
  normalize
} from "../shared/format.js";

// @legacy-unit 1154 13583
export function runNaturalSearch() {
  replaceNaturalSearchActiveBinding(true);
  const query = normalize(document.getElementById("naturalQuery").value);
  const level1 = document.getElementById("naturalLevel1").value;
  const level2 = document.getElementById("naturalLevel2").value;
  const level3 = document.getElementById("naturalLevel3").value;
  const sourceRows = [...purchaseRecords, ...omCatalogRows(currentProject)];
  const seen = new Set();
  replaceSearchResultsBinding(sourceRows.filter((row) => {
    const enriched = applyOmResponsibility(row);
    const haystack = normalize([
      row.project,
      row.name,
      userVisibleItemDetail(row),
      partName(row),
      enriched.omCategoryLevel1,
      enriched.omCategoryLevel2,
      enriched.omCategoryLevel3,
      row.level1,
      row.level2,
      row.level3,
    ].join(" "));
    const key = `${row.source}-${row.id}`;
    const matched = row.project === currentProject
      && (!query || haystack.includes(query))
      && (!level1 || enriched.omCategoryLevel1 === level1 || row.level1 === level1)
      && (!level2 || enriched.omCategoryLevel2 === level2 || row.level2 === level2)
      && (!level3 || enriched.omCategoryLevel3 === level3 || row.level3 === level3);
    if (!matched || seen.has(key)) return false;
    seen.add(key);
    return true;
  }));
  renderNaturalRows();
}
// @end-legacy-unit 1154

// @legacy-unit 1155 13618
export function filterRecordsFromControls(prefix) {
  const query = normalize(document.getElementById(`${prefix}Query`).value);
  const level1 = document.getElementById(`${prefix}Level1`).value;
  const level2 = document.getElementById(`${prefix}Level2`).value;
  const level3 = document.getElementById(`${prefix}Level3`).value;
  const sourceProject = document.getElementById(`${prefix}SourceProject`)?.value || "";
  const sourceRows = prefix === "history" ? historyReusableSourceRows() : purchaseRecords;
  return sourceRows.filter((row) => {
    const haystack = normalize([
      row.project,
      row.partNo,
      factoryMaterialNoFor(row),
      row.pasMaterialNo,
      row.name,
      itemDetail(row),
      partName(row),
      row.vendor,
      row.level1,
      row.level2,
      row.level3,
    ].join(" "));
    return (prefix === "history" ? (!sourceProject || row.project === sourceProject) : row.project === currentProject)
      && (!query || haystack.includes(query))
      && (!level1 || row.level1 === level1)
      && (!level2 || row.level2 === level2)
      && (!level3 || row.level3 === level3);
  });
}
// @end-legacy-unit 1155

// @legacy-unit 1156 13647
export function runHistorySearch() {
  replaceHistorySearchActiveBinding(true);
  replaceHistoryResultsBinding(filterRecordsFromControls("history"));
  renderHistoryRows();
}
// @end-legacy-unit 1156

// @legacy-unit 1157 13653
export function historyReusableSourceRows() {
  const completedRequests = requests.filter((row) =>
    factoryMaterialNoFor(row)
    && (row.buyerStatus === BUYER_PO_ISSUED || row.buyerStatus === BUYER_COMPLETED || row.poNo || row.buyerPoNo)
  );
  return [...purchaseRecords, ...completedRequests];
}
// @end-legacy-unit 1157

// @legacy-unit 1158 13661
export function reusableHistoryRecordById(recordId) {
  return historyReusableSourceRows().find((row) => row.id === recordId)
    || purchaseRecords.find((row) => row.id === recordId)
    || requests.find((row) => row.id === recordId);
}
// @end-legacy-unit 1158

// @legacy-unit 1159 13667
export function clearNaturalSearch() {
  document.getElementById("naturalQuery").value = "";
  syncCascade("natural", { level1: "", level2: "", level3: "" });
  replaceSearchResultsBinding([]);
  replaceNaturalSearchActiveBinding(false);
  renderNaturalRows();
}
// @end-legacy-unit 1159

// @legacy-unit 1160 13675
export function clearHistorySearch() {
  document.getElementById("historyQuery").value = "";
  document.getElementById("historySourceProject").value = "";
  syncCascade("history", { level1: "", level2: "", level3: "" });
  replaceHistoryResultsBinding([]);
  replaceHistorySearchActiveBinding(false);
  renderHistoryRows();
}
// @end-legacy-unit 1160
