

function createTrackingRepository({ pool }) {
  async function queryOmProcurementTrackingRecords() {
    return pool.execute(`
        SELECT t.request_id AS requestId, t.budget_status AS budgetStatus, t.budget_no AS budgetNo,
               t.pr_status AS prStatus, t.pr_no AS prNo, t.po_status AS poStatus,
               t.buyer_po_no AS buyerPoNo, t.pur_request_no AS purRequestNo,
               t.eta_plan_date AS etaPlanDate, t.dta_actual_date AS dtaActualDate,
               t.total_lead_time_days AS totalLeadTimeDays, t.updated_by_user_id AS updatedByUserId,
               u.name AS updatedBy, t.updated_at AS updatedAt
        FROM om_procurement_tracking t
        LEFT JOIN users u ON u.id = t.updated_by_user_id
        ORDER BY t.updated_at DESC, t.request_id
      `);
  }
  
  async function queryUpdateOmProcurementTracking(record, actor) {
    return pool.execute(
        `INSERT INTO om_procurement_tracking (
           request_id, budget_status, budget_no, pr_status, pr_no, po_status, buyer_po_no, pur_request_no,
           eta_plan_date, dta_actual_date, total_lead_time_days, updated_by_user_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           budget_status = VALUES(budget_status),
           budget_no = VALUES(budget_no),
           pr_status = VALUES(pr_status),
           pr_no = VALUES(pr_no),
           po_status = VALUES(po_status),
           buyer_po_no = VALUES(buyer_po_no),
           pur_request_no = VALUES(pur_request_no),
           eta_plan_date = VALUES(eta_plan_date),
           dta_actual_date = VALUES(dta_actual_date),
           total_lead_time_days = VALUES(total_lead_time_days),
           updated_by_user_id = VALUES(updated_by_user_id),
           updated_at = CURRENT_TIMESTAMP`,
        [
          record.requestId,
          record.budgetStatus || null,
          record.budgetNo || null,
          record.prStatus || null,
          record.prNo || null,
          record.poStatus || null,
          record.buyerPoNo || null,
          record.purRequestNo || null,
          record.etaPlanDate || null,
          record.dtaActualDate || null,
          record.totalLeadTimeDays === "" ? null : record.totalLeadTimeDays,
          actor?.id || null,
        ],
      );
  }
  return { queryOmProcurementTrackingRecords, queryUpdateOmProcurementTracking };
}

module.exports = { createTrackingRepository };
