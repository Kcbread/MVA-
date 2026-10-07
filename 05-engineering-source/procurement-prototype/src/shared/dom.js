// shared/dom: authoritative source; see docs/module-map.md.


// @legacy-unit 798 7093
export function copyAnalysisNodeContent(sourceId, targetId) {
  const source = document.getElementById(sourceId);
  const target = document.getElementById(targetId);
  if (!source || !target) return;
  target.innerHTML = source.innerHTML;
}
// @end-legacy-unit 798

// @legacy-unit 799 7100
export function copyAnalysisText(sourceId, targetId) {
  const source = document.getElementById(sourceId);
  const target = document.getElementById(targetId);
  if (!source || !target) return;
  target.textContent = source.textContent || "";
}
// @end-legacy-unit 799

// @legacy-unit 800 7107
export function clearNodeContent(...ids) {
  ids.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.innerHTML = "";
  });
}
// @end-legacy-unit 800
