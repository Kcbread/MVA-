const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("shared table contract controls row height and vertical rhythm", () => {
  assert.match(styles, /--table-row-compact:\s*34px;/, "compact row height token is required");
  assert.match(styles, /--table-row-standard:\s*42px;/, "standard row height token is required");
  assert.match(styles, /--table-row-workflow:\s*54px;/, "workflow row height token is required");
  assert.match(styles, /--table-cell-py:\s*3px;/, "cell vertical padding token is required");
  assert.match(styles, /--table-line-height:\s*1\.14;/, "cell line-height token is required");
  assert.match(styles, /\.search-table tbody tr\s*\{[\s\S]*?height:\s*var\(--table-row-compact\)\s*!important;/, "search table rows must use compact row height");
  assert.match(styles, /\.history-item-table\[data-layout-managed="manual"\] th,[\s\S]*?\.history-item-table\[data-layout-managed="manual"\] td[\s\S]*?height:\s*48px\s*!important;/, "reuse item rows must use the manual compact row height");
  assert.match(styles, /\.request-table tbody tr[\s\S]*?height:\s*var\(--table-row-workflow\)\s*!important;/, "draft/request rows must use workflow row height");
  assert.match(styles, /\.cell-text-clamp,[\s\S]*?-webkit-line-clamp:\s*2;/, "text cells must clamp to two lines");
  assert.match(styles, /\.cell-spec-clamp,[\s\S]*?-webkit-line-clamp:\s*3;/, "spec cells must clamp instead of expanding row height indefinitely");
});
