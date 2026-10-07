// catalog/natural-search-view: authoritative source; see docs/module-map.md.
import {
  isOmCatalogRow,
  omCatalogRows,
  rowSourceLabel
} from "./records.js";
import {
  naturalSearchActive,
  searchResults
} from "./state.js";
import {
  purchaseRecords
} from "../data/state.js";
import {
  itemDetailButton,
  userVisibleItemDetail
} from "../materials/display.js";
import {
  itemOwnerBadgeHtml,
  itemOwnerLabel
} from "../om/ownership.js";
import {
  currentProject
} from "../projects/state.js";
import {
  htmlAttr
} from "../shared/html.js";

// @legacy-unit 974 10688
export function renderNaturalRows() {
  if (!document.getElementById("naturalRows")) return;
  const defaultRows = [...omCatalogRows(currentProject), ...purchaseRecords.filter((row) => row.project === currentProject)].slice(0, 40);
  const rows = naturalSearchActive ? searchResults.filter((row) => row.project === currentProject) : defaultRows;
  const count = document.getElementById("naturalCount");
  if (count) {
    count.textContent = naturalSearchActive
      ? `${rows.length} result${rows.length === 1 ? "" : "s"}`
      : `${rows.length} classified item${rows.length === 1 ? "" : "s"}`;
  }
  document.getElementById("naturalRows").innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td class="cell-identity" title="${htmlAttr([row.name, itemOwnerLabel(row)].filter(Boolean).join(" · "))}">
          <div class="identity-block">
            <span class="identity-primary">${row.name}</span>
            <span class="identity-secondary">${itemOwnerLabel(row)}</span>
          </div>
        </td>
        <td class="cell-spec-summary" title="${htmlAttr(userVisibleItemDetail(row) || "")}">
          <div class="spec-summary">${userVisibleItemDetail(row) || "-"}</div>
        </td>
        <td class="cell-status">${itemOwnerBadgeHtml(row)}<div class="reason-text">${rowSourceLabel(row)}</div></td>
        <td class="cell-action">${itemDetailButton(isOmCatalogRow(row) ? "catalog" : "record", row.id)}</td>
        <td class="cell-action"><button class="mini approve" title="Add item to request" data-add-record="${row.id}">Add</button></td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="empty-cell">${naturalSearchActive ? "No matching purchase records or OM catalog items." : "No real source items are available for this project."}</td></tr>`;
}
// @end-legacy-unit 974
