// catalog/match: authoritative source; see docs/module-map.md.
import {
  requestItemPickerLevelPath,
  requestWorksheetMergedSources,
  requestWorksheetSourceValue,
  requesterPickerSpec
} from "./search.js";
import {
  normalize
} from "../shared/format.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 1193 14490
export function itemNameMatchRank(row, query = "") {
  const name = normalize(row.name || row.item || "");
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  const count = tokens.filter((token) => name.includes(token)).length;
  return (name === normalize(query) ? 1000 : 0) + (count === tokens.length ? 100 : 0) + count;
}
// @end-legacy-unit 1193

// @legacy-unit 1194 14498
export function itemMatchHighlight(value, query = "") {
  const text = String(value || "");
  const tokens = [...new Set(String(query).trim().split(/\s+/).filter(Boolean))].sort((a, b) => b.length - a.length);
  if (!tokens.length) return htmlText(text);
  const pattern = new RegExp(tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  let result = "", cursor = 0;
  for (const match of text.matchAll(pattern)) {
    result += (match.index > cursor ? htmlText(text.slice(cursor, match.index)) : "") + "<mark>" + htmlText(match[0]) + "</mark>";
    cursor = match.index + match[0].length;
  }
  return result + (cursor < text.length ? htmlText(text.slice(cursor)) : "");
}
// @end-legacy-unit 1194

// @legacy-unit 1195 14511
export function materialDuplicateCandidateRows(query = "") {
  const keyword = normalize(query);
  if (!keyword) return [];
  const grouped = new Map();
  requestWorksheetMergedSources(query, { limit: Infinity }).filter((source) => source.type !== "new").forEach((source) => {
    const name = source.row.name || "-";
    const spec = requesterPickerSpec(source.row) || "Specification not provided";
    const key = JSON.stringify([normalize(name), normalize(spec)]);
    const origin = { type: source.badge, levelPath: requestItemPickerLevelPath(source), sourceValue: requestWorksheetSourceValue(source) };
    const match = grouped.get(key);
    if (match) match.origins.push(origin);
    else grouped.set(key, { ...origin, name, spec, origins: [origin] });
  });
  return [...grouped.values()].slice(0, 5);
}
// @end-legacy-unit 1195

// @legacy-unit 1196 14527
export function materialDuplicateReviewHtml(row) {
  const candidates = row.duplicateCandidates || [];
  if (!candidates.length) {
    return row.standardNameCn?.trim() ? "No matching items found. You can try another name or create a new item." : "Enter an item name to find matching items.";
  }
  return `
    <div class="material-duplicate-review">
      <strong>Matching items</strong>
      <p class="modal-helper">Check the specification, then select Use this item to add it to your request.</p>
      <div class="material-duplicate-list">
        ${candidates.map((item) => `
          <div class="material-duplicate-item">
            <strong class="material-match-name">${itemMatchHighlight(item.name, row.standardNameCn)}</strong>
            <small class="material-match-spec">Spec: ${itemMatchHighlight(item.spec, row.standardNameCn)}</small>
            <details class="material-match-details"><summary>Details (${(item.origins || [item]).length} sources)</summary>${(item.origins || [item]).map((origin) => `<div>${htmlText(origin.type)} · ${htmlText(origin.levelPath || "Unclassified")} · ${htmlText(origin.sourceValue || "")}</div>`).join("")}</details>
            <button class="ghost mini" type="button" data-use-material-candidate="${htmlAttr(item.sourceValue || "")}">Use this item</button>
          </div>`).join("")}
      </div>
    </div>`;
}
// @end-legacy-unit 1196

export function replaceItemNameMatchRankBinding(value) { itemNameMatchRank = value; return value; }

export function replaceItemMatchHighlightBinding(value) { itemMatchHighlight = value; return value; }
