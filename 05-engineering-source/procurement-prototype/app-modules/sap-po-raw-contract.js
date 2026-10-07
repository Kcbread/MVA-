(() => {
  const MATERIAL_NO_TYPE_FACTORY = "factory_material_no";
  const MATERIAL_NO_TYPE_SAP = "sap_material_no";
  const MATERIAL_NO_TYPE_PAS = "pas_material_no";
  const MATERIAL_NO_TYPE_LEGACY = "legacy_mapping";
  const MATERIAL_NO_TYPES = Object.freeze([
    MATERIAL_NO_TYPE_FACTORY,
    MATERIAL_NO_TYPE_SAP,
    MATERIAL_NO_TYPE_PAS,
    MATERIAL_NO_TYPE_LEGACY,
  ]);
  const BUY_SCOPE_OM = "om_scope";
  const BUY_SCOPE_MFG_BUY = "mfg_buy";
  const BUY_SCOPES = Object.freeze([BUY_SCOPE_OM, BUY_SCOPE_MFG_BUY]);
  const SCOPE_SOURCE_EXCEL_YELLOW_FILL = "excel_yellow_fill";
  const SCOPE_SOURCE_DEFAULT_NON_YELLOW = "default_non_yellow";
  const YELLOW_FILL_ARGB = "FFFFFF00";

  const SAP_PO_RAW_DATA_COLUMNS = [
    ["A", "料號", "factory_material_no"],
    ["B", "采購單號", "purchase_order_no"],
    ["C", "採購單狀態", "purchase_order_status"],
    ["D", "采購項次", "purchase_order_line_no"],
    ["E", "法人代碼", "legal_entity_code"],
    ["F", "采購部門代碼", "purchase_department_code"],
    ["G", "采購部門名稱", "purchase_department_name"],
    ["H", "料號", "sap_material_no"],
    ["I", "料號一階類別", "sap_material_lv1"],
    ["J", "料號二階類別", "sap_material_lv2"],
    ["K", "FTV Code", "ftv_code"],
    ["L", "品名 part name", "part_name"],
    ["M", "品名_Detail", "part_name_detail"],
    ["N", "中文譯名", "chinese_translation"],
    ["O", "標準品名", "standard_part_name"],
    ["P", "中文品名_正規化", "normalized_chinese_part_name"],
    ["Q", "正規化", "normalized_item_name"],
    ["R", "品牌", "brand"],
    ["S", "規格 Spec_正規化", "normalized_spec"],
    ["T", "規格 Spec", "spec"],
    ["U", "單位", "uom"],
    ["V", "幣別", "currency"],
    ["W", "采購數量", "purchase_quantity"],
    ["X", "請購單價_USD", "request_unit_price_usd"],
    ["Y", "采購單價_USD", "purchase_unit_price_usd"],
    ["Z", "采購金額_USD", "purchase_amount_usd"],
    ["AA", "請購單價_VND", "request_unit_price_vnd"],
    ["AB", "采購單價_VND", "purchase_unit_price_vnd"],
    ["AC", "采購金額_VND", "purchase_amount_vnd"],
    ["AD", "累計驗收量", "cumulative_accepted_qty"],
    ["AE", "累計領用量", "cumulative_issued_qty"],
    ["AF", "領用金額", "issued_amount"],
    ["AG", "廠商", "vendor_code"],
    ["AH", "廠商簡稱", "vendor_short_name"],
    ["AI", "單價差額", "unit_price_delta"],
    ["AJ", "價差率", "price_delta_rate"],
    ["AK", "采購日期", "purchase_date"],
    ["AL", "預定交期", "scheduled_delivery_date"],
    ["AM", "驗收日期", "acceptance_date"],
    ["AN", "是否逾期", "is_overdue"],
    ["AO", "采購帳號", "buyer_account"],
    ["AP", "采購人員", "buyer_name"],
    ["AQ", "預結報單號", "pre_settlement_no"],
    ["AR", "專案代碼", "project_code"],
    ["AS", "專案", "project_name"],
    ["AT", "MVA or REB", "mva_or_reb"],
    ["AU", "請購單號", "purchase_requisition_no"],
    ["AV", "請購部門", "request_department_code"],
    ["AW", "請購部門名稱", "request_department_name"],
    ["AX", "請購人", "requester_name"],
    ["AY", "請購日期", "request_date"],
    ["AZ", "請購人分機", "requester_extension"],
    ["BA", "請購形式", "request_type"],
    ["BB", "PO release date", "po_release_at"],
    ["BC", "Quotation No", "quotation_no"],
    ["BD", "付款方式", "payment_terms"],
    ["BE", "Delivery term", "delivery_term"],
    ["BF", "稅別/稅率", "tax_rate"],
    ["BG", "費用科目代碼", "expense_account_code"],
    ["BH", "請購單發佈時間", "purchase_requisition_release_time"],
    ["BI", "費用類型", "expense_type"],
    ["BJ", "結報單號", "settlement_no"],
    ["BK", "審核狀態", "review_status"],
    ["BL", "Lv1", "lv1"],
    ["BM", "Lv2", "lv2"],
    ["BN", "Lv3", "lv3"],
  ].map(([excelColumn, header, field]) => ({ excelColumn, header, field }));

  const SAP_PO_RAW_DATA_HEADERS = SAP_PO_RAW_DATA_COLUMNS.map((column) => column.header);
  const SAP_PO_RAW_DATA_FIELDS = SAP_PO_RAW_DATA_COLUMNS.map((column) => column.field);
  const SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN = Object.freeze(SAP_PO_RAW_DATA_COLUMNS.reduce((mapping, column) => {
    mapping[column.excelColumn] = column.field;
    return mapping;
  }, {}));

  function poExportRow(source = {}) {
    return SAP_PO_RAW_DATA_FIELDS.map((field) => source[field] ?? "");
  }

  function rawPayloadFromPoExportRow(values = []) {
    return SAP_PO_RAW_DATA_COLUMNS.reduce((payload, column, index) => {
      payload[`${column.excelColumn}:${column.header}`] = values[index] ?? "";
      return payload;
    }, {});
  }

  const api = {
    MATERIAL_NO_TYPE_FACTORY,
    MATERIAL_NO_TYPE_SAP,
    MATERIAL_NO_TYPE_PAS,
    MATERIAL_NO_TYPE_LEGACY,
    MATERIAL_NO_TYPES,
    BUY_SCOPE_OM,
    BUY_SCOPE_MFG_BUY,
    BUY_SCOPES,
    SCOPE_SOURCE_EXCEL_YELLOW_FILL,
    SCOPE_SOURCE_DEFAULT_NON_YELLOW,
    YELLOW_FILL_ARGB,
    SAP_PO_RAW_DATA_COLUMNS,
    SAP_PO_RAW_DATA_HEADERS,
    SAP_PO_RAW_DATA_FIELDS,
    SAP_PO_RAW_DATA_FIELD_BY_EXCEL_COLUMN,
    poExportRow,
    rawPayloadFromPoExportRow,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") {
    window.ProcurementApp = window.ProcurementApp || { modules: {} };
    window.ProcurementApp.modules = window.ProcurementApp.modules || {};
    window.ProcurementApp.modules.sapPoRawContract = api;
  }
})();
