const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

test("text visibility contract separates identity, spec, note, number, and action cells", () => {
  assert.match(styles, /\.cell-identity\b/, "identity cell class is required");
  assert.match(styles, /\.identity-primary\b/, "identity primary text class is required");
  assert.match(styles, /\.identity-secondary\b/, "identity secondary text class is required");
  assert.match(styles, /\.cell-spec-summary\b/, "spec summary class is required");
  assert.match(styles, /\.cell-note-summary\b/, "note summary class is required");
  assert.match(styles, /\.cell-code\b/, "code/id cell class is required");
  assert.match(styles, /\.cell-number,[\s\S]*?\.cell-money,[\s\S]*?\.cell-qty[\s\S]*?white-space:\s*nowrap;/, "numeric cells must not wrap");
});

test("requester-safe item identity columns must not be hidden by compact clamp rules", () => {
  assert.doesNotMatch(
    styles,
    /\.history-item-table\[data-layout-managed="manual"\] col\.history-col-material/,
    "requester reuse table must not expose factory material number as a main column"
  );
  assert.match(
    styles,
    /\.history-item-table\[data-layout-managed="manual"\] col\.history-col-item[\s\S]*?width:\s*220px;/,
    "reuse item name must have a stable identity column"
  );
  assert.match(
    styles,
    /\.search-table td:first-child \.cell-text-clamp[\s\S]*?-webkit-line-clamp:\s*unset;/,
    "catalog item identity column must not use compact clamp"
  );
});

test("spec columns summarize with readable line clamp instead of hard cutting text", () => {
  assert.match(
    styles,
    /\.cell-spec-summary[\s\S]*?white-space:\s*normal;[\s\S]*?overflow-wrap:\s*anywhere;[\s\S]*?-webkit-line-clamp:\s*2;/,
    "spec summary must wrap and clamp to a readable summary"
  );
  assert.match(
    styles,
    /\.history-item-table\[data-layout-managed="manual"\] \.history-spec \.spec-summary[\s\S]*?white-space:\s*normal\s*!important;[\s\S]*?-webkit-line-clamp:\s*2;/,
    "reuse item spec column must show a multi-line readable summary"
  );
});

test("audit reason columns are full-wrap and not summary-clamped", () => {
  assert.match(
    styles,
    /\.carryover-ledger-table \.cell-audit-reason[\s\S]*?white-space:\s*normal;[\s\S]*?overflow:\s*visible;/,
    "carryover reason is audit text and must remain visible"
  );
  assert.match(
    styles,
    /\.carryover-ledger-table \.audit-reason-text[\s\S]*?overflow-wrap:\s*anywhere;/,
    "carryover audit reason must wrap inside the reason column"
  );
});

test("requester Add Item popup separates identity, detail context, and safe spec summary", () => {
  assert.match(html, /<th class="picker-col-add">Add<\/th>/, "Add stays first");
  assert.match(html, /<th class="picker-col-item">Item<\/th>/, "Item identity column is required");
  assert.match(html, /<th class="picker-col-detail">Detail<\/th>/, "Detail context column is required");
  assert.match(html, /<th class="picker-col-spec">Spec<\/th>/, "Spec summary column is required");
  assert.match(html, /<th class="picker-col-action">Action<\/th>/, "Action column is required");
  assert.doesNotMatch(html, /<th class="picker-col-source">Source<\/th>/, "Source must be a badge inside the Item cell");
  assert.doesNotMatch(html, /Phase Trace/, "Phase Trace is not a requester picker column");
  assert.match(app, /class="cell-identity request-picker-item-cell"/, "picker item cell uses identity class");
  assert.match(app, /class="cell-note-summary request-picker-detail-cell"/, "picker detail cell uses note summary class");
  assert.match(app, /class="cell-spec-summary request-picker-spec-cell"/, "picker spec cell uses spec summary class");
  assert.match(styles, /\.request-picker-spec-cell \.spec-summary[\s\S]*?-webkit-line-clamp:\s*3;/, "picker spec summary must clamp to 3 readable lines");
});
