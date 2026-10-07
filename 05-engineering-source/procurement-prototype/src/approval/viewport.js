// approval/viewport: authoritative source; see docs/module-map.md.
import {
  approvalViewportState
} from "./state.js";
import {
  currentManagerTab,
  currentPriceReviewQueue,
  currentPriceReviewTab
} from "../shell/state.js";

// @legacy-unit 1231 15034
export function preserveApprovalViewport(kind, { rowIds = [], actedRowId = "", selectedRowId = "", containerSelector = "" } = {}) {
  const container = containerSelector ? document.querySelector(containerSelector) : null;
  const actedIndex = actedRowId ? rowIds.indexOf(actedRowId) : -1;
  approvalViewportState[kind] = {
    actedIndex,
    actedRowId,
    containerSelector,
    rowIds: [...rowIds],
    scrollLeft: container?.scrollLeft || 0,
    scrollTop: container?.scrollTop || 0,
    selectedRowId,
    tab: kind === "priceReview" ? currentPriceReviewTab : currentManagerTab,
    queue: kind === "priceReview" ? currentPriceReviewQueue : "",
  };
  return approvalViewportState[kind];
}
// @end-legacy-unit 1231

// @legacy-unit 1232 15051
export function nextApprovalSelection(rows, state, fallbackSelectedId = "") {
  const ids = rows.map((row) => row.id);
  if (!ids.length) return null;
  const preferredId = fallbackSelectedId || state?.selectedRowId || state?.actedRowId || "";
  if (preferredId && ids.includes(preferredId)) return preferredId;
  const actedIndex = Number.isInteger(state?.actedIndex) ? state.actedIndex : -1;
  if (actedIndex >= 0 && ids[actedIndex]) return ids[actedIndex];
  if (actedIndex > 0 && ids[actedIndex - 1]) return ids[actedIndex - 1];
  return ids[0];
}
// @end-legacy-unit 1232

// @legacy-unit 1233 15062
export function restoreApprovalViewport(kind) {
  const state = approvalViewportState[kind];
  if (!state?.containerSelector) return;
  requestAnimationFrame(() => {
    const container = document.querySelector(state.containerSelector);
    if (!container) return;
    container.scrollTop = state.scrollTop || 0;
    container.scrollLeft = state.scrollLeft || 0;
  });
}
// @end-legacy-unit 1233
