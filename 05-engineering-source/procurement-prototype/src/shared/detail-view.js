// shared/detail-view: authoritative source; see docs/module-map.md.


// @legacy-unit 1397 17087
export function compactList(values, emptyText = "-") {
  const list = [...values].filter(Boolean);
  if (!list.length) return emptyText;
  if (list.length <= 2) return list.join(" / ");
  return `${list.slice(0, 2).join(" / ")} +${list.length - 2}`;
}
// @end-legacy-unit 1397

// @legacy-unit 1398 17094
export function detailSummaryGridHtml(entries) {
  return `
    <div class="detail-summary-grid">
      ${entries.map(([label, value, helper = ""]) => `
        <article class="detail-summary-card">
          <span>${label}</span>
          <strong>${value}</strong>
          ${helper ? `<small>${helper}</small>` : ""}
        </article>`).join("")}
    </div>`;
}
// @end-legacy-unit 1398

// @legacy-unit 1399 17106
export function formatProgressDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return value > 20000 ? new Date((value - 25569) * 86400000).toISOString().slice(0, 10) : "";
  const text = String(value).trim();
  if (!text || text === "#VALUE!" || text === "#N/A" || text === "-") return "";
  if (/^1899-/.test(text)) return "";
  return text;
}
// @end-legacy-unit 1399
