

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function textValue(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function jsonValue(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function isoDateValue(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return date.toISOString();
}

function dateOnlyValue(value) {
  const iso = isoDateValue(value);
  return iso ? iso.slice(0, 10) : "";
}

function demandTypeLabel(value) {
  return String(value || "").toLowerCase().replace(/[_\s-]+/g, "") === "nonmfg" ? "Non-MFG" : "MFG";
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

module.exports = { cloneJson, textValue, jsonValue, numberValue, isoDateValue, dateOnlyValue, demandTypeLabel, csvEscape };
