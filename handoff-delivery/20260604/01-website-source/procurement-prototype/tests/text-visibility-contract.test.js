const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("text visibility contract separates identity, spec, note, number, and action cells", () => {
  assert.match(styles, /\.cell-identity\b/, "identity cell class is required");
  assert.match(styles, /\.identity-primary\b/, "identity primary text class is required");
  assert.match(styles, /\.identity-secondary\b/, "identity secondary text class is required");
  assert.match(styles, /\.cell-spec-summary\b/, "spec summary class is required");
  assert.match(styles, /\.cell-note-summary\b/, "note summary class is required");
  assert.match(styles, /\.cell-code\b/, "code/id cell class is required");
  assert.match(styles, /\.cell-number,[\s\S]*?\.cell-money,[\s\S]*?\.cell-qty[\s\S]*?white-space:\s*nowrap;/, "numeric cells must not wrap");
});

test("identity-bearing item columns must not be hidden by compact clamp rules", () => {
  assert.match(
    styles,
    /\.history-item-table\[data-layout-managed="manual"\] col\.history-col-material[\s\S]*?width:\s*190px;/,
    "reuse item factory material number must have a stable identity column"
  );
  assert.match(
    styles,
    /\.history-item-table\[data-layout-managed="manual"\] \.history-material-no[\s\S]*?text-overflow:\s*ellipsis;/,
    "reuse item factory material number must not visually drift into adjacent columns"
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
