(() => {
  const PURPOSE_LOCATION_OPTIONS = ["SMT", "FATP"];
  const DEFAULT_PURPOSE_LOCATION = "SMT";
  const STAGE_REQUIRED_DELIVERY_OFFSET_DAYS = 14;
  const PROCUREMENT_STATUS_OPTIONS = ["Pending", "In Progress", "Done"];

  const api = {
    PURPOSE_LOCATION_OPTIONS,
    DEFAULT_PURPOSE_LOCATION,
    STAGE_REQUIRED_DELIVERY_OFFSET_DAYS,
    PROCUREMENT_STATUS_OPTIONS,
    normalizePurposeLocation,
    dateOnly,
    addDaysIsoDate,
    requiredDeliveryDateFollowStageDate,
    daysBetweenIsoDates,
    givenLeadTimeDays,
    procurementStatusValue,
    suggestPurRequestNo,
  };

  function normalizePurposeLocation(value = "") {
    const normalized = String(value || "").trim().toUpperCase();
    return PURPOSE_LOCATION_OPTIONS.includes(normalized) ? normalized : DEFAULT_PURPOSE_LOCATION;
  }

  function dateOnly(value = "") {
    if (!value) return "";
    const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  }

  function addDaysIsoDate(dateText = "", days = 0) {
    const normalized = dateOnly(dateText);
    if (!normalized) return "";
    const date = new Date(`${normalized}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + Number(days || 0));
    return date.toISOString().slice(0, 10);
  }

  function requiredDeliveryDateFollowStageDate(lineOpenDate = "") {
    return addDaysIsoDate(lineOpenDate, -STAGE_REQUIRED_DELIVERY_OFFSET_DAYS);
  }

  function daysBetweenIsoDates(startDate = "", endDate = "") {
    const start = dateOnly(startDate);
    const end = dateOnly(endDate);
    if (!start || !end) return null;
    return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000);
  }

  function givenLeadTimeDays(dateOfRequest = "", lineOpenDate = "") {
    const requiredByStage = requiredDeliveryDateFollowStageDate(lineOpenDate);
    return daysBetweenIsoDates(dateOfRequest, requiredByStage);
  }

  function procurementStatusValue(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    return PROCUREMENT_STATUS_OPTIONS.find((option) => option.toLowerCase() === normalized) || "Pending";
  }

  function compactToken(value = "") {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function suggestPurRequestNo(row = {}) {
    const dept = row.department || row.requestDept || row.demandUnit || "DEPT";
    const project = row.projectCode || row.project || row.yearProject || "PROJECT";
    const qty = Number(row.qty || row.totalQty || row.quantity || 0) || 0;
    const item = row.name || row.item || row.itemName || "ITEM";
    const spec = row.spec || row.detail || row.description || "SPEC";
    return ["PUR", dept, project, qty, item, spec].map(compactToken).filter(Boolean).join("-");
  }

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.purposeDate = api;
  }
})();
