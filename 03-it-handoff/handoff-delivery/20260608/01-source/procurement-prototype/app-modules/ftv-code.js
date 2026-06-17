(() => {
  const ROUTE_LOCAL_BUY = "local_buy";
  const ROUTE_EXTERNAL_IMPORT = "external_import";

  const QUOTE_OWNER_PAS = "PAS";
  const QUOTE_OWNER_SOURCING = "sourcing";
  const QUOTE_OWNER_OM_DIRECT = "OM_direct";

  const FTV_NOT_REQUIRED = "Not Required";
  const FTV_REUSE_EXISTING = "Reuse Existing";
  const FTV_GENERATE_REQUIRED = "Generate Required";
  const FTV_MISSING_MAPPING = "Missing Mapping";

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizedDepartment(value) {
    return String(value || "").trim().toUpperCase();
  }

  function isItItem(row = {}) {
    const text = normalize([
      row.item,
      row.name,
      row.spec,
      row.detail,
      row.level1,
      row.level2,
      row.level3,
      row.catalogPath,
      row.category,
    ].join(" "));
    return /\b(pc|ipc|computer|desktop|laptop|notebook|monitor|server|switch|storage|scanner|printer|keyboard|mouse|router|network)\b/.test(text)
      || /電腦|筆電|螢幕|伺服器|交換機|掃描|印表|網路/.test(text);
  }

  function defaultQuoteOwner(row = {}) {
    return isItItem(row) ? QUOTE_OWNER_PAS : QUOTE_OWNER_SOURCING;
  }

  function ftvAuditKey({ itemId, materialId, demandDepartment } = {}) {
    const identity = itemId || materialId || "";
    return `${String(identity).trim()}::${normalizedDepartment(demandDepartment)}`;
  }

  function costAllocationKey(row = {}) {
    return [
      row.requestLineId || row.request_id || row.id || "",
      row.itemId || row.item_id || "",
      row.demandDepartment || row.demand_department || row.unit || row.demandUnit || "",
      row.project || row.projectCode || "",
      row.phase || row.stage || "",
      row.station || row.stationOrUnit || "",
      row.demandUnit || "",
    ].map((part) => String(part || "").trim()).join("::");
  }

  function ftvStatusForRoute({ routeType, existingFtvCode, hasMapping = false } = {}) {
    if (routeType === ROUTE_LOCAL_BUY) return FTV_NOT_REQUIRED;
    if (routeType !== ROUTE_EXTERNAL_IMPORT) return FTV_MISSING_MAPPING;
    if (existingFtvCode || hasMapping) return FTV_REUSE_EXISTING;
    return FTV_GENERATE_REQUIRED;
  }

  function canExportWithFtv({ routeType, ftvStatus, ftvCode } = {}) {
    if (routeType === ROUTE_LOCAL_BUY || ftvStatus === FTV_NOT_REQUIRED) return true;
    return Boolean(ftvCode) && [FTV_REUSE_EXISTING, FTV_GENERATE_REQUIRED].includes(ftvStatus);
  }

  const api = {
    ROUTE_LOCAL_BUY,
    ROUTE_EXTERNAL_IMPORT,
    QUOTE_OWNER_PAS,
    QUOTE_OWNER_SOURCING,
    QUOTE_OWNER_OM_DIRECT,
    FTV_NOT_REQUIRED,
    FTV_REUSE_EXISTING,
    FTV_GENERATE_REQUIRED,
    FTV_MISSING_MAPPING,
    isItItem,
    defaultQuoteOwner,
    ftvAuditKey,
    costAllocationKey,
    ftvStatusForRoute,
    canExportWithFtv,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.ftvCode = api;
  }
})();
