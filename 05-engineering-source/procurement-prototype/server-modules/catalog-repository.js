

function createCatalogRepository({ pool }) {
  async function queryLvTaxonomyPayload() {
    return pool.execute(
          `SELECT lv1, lv2, lv3, source_file_name AS source, status, sort_order AS sortOrder
           FROM lv_taxonomy
           WHERE status = 'active'
           ORDER BY sort_order ASC, lv1 ASC, lv2 ASC, lv3 ASC`,
        );
  }
  
  async function queryCatalogItemsForRequest() {
    return pool.execute(
          `SELECT i.id AS itemId, i.eng_name AS name, i.spec, i.category, i.lv1, i.lv2, i.lv3,
                  mi.material_no AS factoryMaterialNo,
                  mi.material_coding_review_status AS materialCodingReviewStatus
           FROM item_master i
           LEFT JOIN material_identity mi
             ON mi.item_id = i.id
            AND mi.material_no_type = 'factory_material_no'
            AND mi.status = 'active'
           WHERE i.status = 'active'
           ORDER BY i.updated_at DESC
           LIMIT 2000`,
        );
  }
  return { queryLvTaxonomyPayload, queryCatalogItemsForRequest };
}

module.exports = { createCatalogRepository };
