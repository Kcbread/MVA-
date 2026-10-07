const crypto = require("node:crypto");
const { textValue, dateOnlyValue, isoDateValue, numberValue } = require('./values');

function normalizeProjectStageCalendarRecord(record = {}) {
  const yearProject = textValue(record.yearProject || record.year_project || record.project || "", 160);
  const projectCode = textValue(record.projectCode || record.project_code || "", 80).toUpperCase();
  const phase = textValue(record.phase || record.phase_code || "", 40).toUpperCase();
  const lineOpenDate = dateOnlyValue(record.lineOpenDate || record.line_open_date || record.stageDate || "");
  return {
    yearProject,
    projectCode,
    phase,
    lineOpenDate,
    updatedBy: textValue(record.updatedBy || record.updated_by_name || record.updated_by || "", 160),
    updatedByUserId: textValue(record.updatedByUserId || record.updated_by_user_id || "", 64),
    updatedAt: isoDateValue(record.updatedAt || record.updated_at || ""),
  };
}

function projectStageCalendarStorageKey(record = {}) {
  const normalized = normalizeProjectStageCalendarRecord(record);
  return [normalized.yearProject, normalized.projectCode, normalized.phase].join("::");
}

function normalizeOmProcurementTrackingRecord(record = {}) {
  const totalLeadTimeValue = record.totalLeadTimeDays ?? record.total_lead_time_days;
  const totalLeadTimeDays = totalLeadTimeValue === "" || totalLeadTimeValue === null || totalLeadTimeValue === undefined
    ? ""
    : numberValue(totalLeadTimeValue);
  return {
    requestId: textValue(record.requestId || record.request_id || "", 96),
    budgetStatus: textValue(record.budgetStatus || record.budget_status || "", 40),
    budgetNo: textValue(record.budgetNo || record.budget_no || "", 120),
    prStatus: textValue(record.prStatus || record.pr_status || "", 40),
    prNo: textValue(record.prNo || record.pr_no || "", 120),
    poStatus: textValue(record.poStatus || record.po_status || "", 40),
    buyerPoNo: textValue(record.buyerPoNo || record.buyer_po_no || record.poNo || record.po_no || "", 120),
    purRequestNo: textValue(record.purRequestNo || record.pur_request_no || "", 160),
    etaPlanDate: dateOnlyValue(record.etaPlanDate || record.eta_plan_date || record.etaPlan || ""),
    dtaActualDate: dateOnlyValue(record.dtaActualDate || record.dta_actual_date || record.dtaActual || ""),
    totalLeadTimeDays,
    updatedBy: textValue(record.updatedBy || record.updated_by_name || record.updated_by || "", 160),
    updatedByUserId: textValue(record.updatedByUserId || record.updated_by_user_id || "", 64),
    updatedAt: isoDateValue(record.updatedAt || record.updated_at || ""),
  };
}

function sanitizeOmProcurementPatch(payload = {}) {
  const allowedFields = new Set([
    "budgetStatus",
    "budgetNo",
    "prStatus",
    "prNo",
    "poStatus",
    "buyerPoNo",
    "purRequestNo",
    "etaPlanDate",
    "dtaActualDate",
    "totalLeadTimeDays",
  ]);
  return Object.fromEntries(Object.entries(payload).filter(([key]) => allowedFields.has(key)));
}

function splitRuleValues(value = []) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizeOmAssignmentRule(rule = {}) {
  return {
    id: String(rule.id || crypto.randomUUID()),
    name: String(rule.name || "OM Assignment Rule").trim(),
    active: Boolean(rule.active ?? rule.is_active ?? true),
    priority: Number(rule.priority ?? 999) || 999,
    projectCodes: splitRuleValues(rule.projectCodes ?? rule.project_codes),
    projectFamilies: splitRuleValues(rule.projectFamilies ?? rule.project_families),
    departmentScopes: splitRuleValues(rule.departmentScopes ?? rule.department_scopes),
    assigneeUserId: String(rule.assigneeUserId || rule.assignee_user_id || "").trim(),
    isFallback: Boolean(rule.isFallback ?? rule.is_fallback),
    note: String(rule.note || "").trim(),
  };
}

module.exports = { normalizeProjectStageCalendarRecord, projectStageCalendarStorageKey, normalizeOmProcurementTrackingRecord, sanitizeOmProcurementPatch, splitRuleValues, normalizeOmAssignmentRule };
