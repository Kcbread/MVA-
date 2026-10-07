// shared/format: authoritative source; see docs/module-map.md.
import {
  STAGE_LABELS
} from "../projects/config.js";

// @legacy-unit 351 1535
export function stageLabel(stage) {
  return STAGE_LABELS[stage] || String(stage || "").toUpperCase();
}
// @end-legacy-unit 351

// @legacy-unit 352 1539
export function recordIndex(record) {
  return Number(String(record.id || "").match(/\d+/)?.[0] || 0);
}
// @end-legacy-unit 352

// @legacy-unit 353 1543
export function slug(value) {
  return normalize(value).replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "unknown";
}
// @end-legacy-unit 353

// @legacy-unit 354 1547
export function stableHash(value) {
  let hash = 2166136261;
  String(value || "").split("").forEach((char) => {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  });
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}
// @end-legacy-unit 354

// @legacy-unit 507 3492
export function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}
// @end-legacy-unit 507

// @legacy-unit 514 3538
export function statusClass(status) {
  return normalize(status).replace(/[^a-z0-9]+/g, "-") || "draft";
}
// @end-legacy-unit 514

// @legacy-unit 515 3542
export function daysUntil(dateText) {
  if (!dateText) return null;
  const target = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}
// @end-legacy-unit 515
