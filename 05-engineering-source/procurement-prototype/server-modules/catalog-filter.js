const { textValue } = require('./values');

function filterCatalogItems(items = [], params = new URLSearchParams()) {
  const query = textValue(params.get("q"), 120).toLowerCase();
  const lv1 = textValue(params.get("lv1"), 120);
  const lv2 = textValue(params.get("lv2"), 120);
  const lv3 = textValue(params.get("lv3"), 120);
  const limit = Math.min(Math.max(Number(params.get("limit") || 100), 1), 500);
  return items
    .filter((item) => !lv1 || item.lv1 === lv1)
    .filter((item) => !lv2 || item.lv2 === lv2)
    .filter((item) => !lv3 || item.lv3 === lv3)
    .filter((item) => !query || [item.name, item.spec, item.detail, item.lv1, item.lv2, item.lv3]
      .some((value) => String(value || "").toLowerCase().includes(query)))
    .slice(0, limit);
}

module.exports = { filterCatalogItems };
