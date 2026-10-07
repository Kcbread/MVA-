

function createLeaderRepository({ pool }) {
  async function queryOmLeaderConsoleRows() {
    return pool.execute(
        `SELECT
           rp.id AS package_id,
           rp.package_code,
           rp.created_by_user_id,
           creator.name AS created_by_name,
           creator.department AS requester_department,
           rp.demand_department,
           rp.project_family,
           rp.project_code,
           rp.project_name,
           rp.need_date,
           rp.status AS package_status,
           rp.current_stage,
           rp.pending_owner_role,
           rp.pending_owner_user_id,
           rp.submitted_at,
           rp.received_at,
           rp.stage_start_at,
           ri.id AS request_item_id,
           ri.line_no AS item_line_no,
           ri.item_name,
           ri.item_spec,
           ri.item_category,
           ri.total_requested_qty,
           ri.estimate_currency,
           ri.estimate_unit_price,
           ri.estimate_unit_price_usd,
           ri.estimate_reason,
           dl.id AS demand_line_id,
           dl.line_no AS demand_line_no,
           dl.demand_type,
           dl.project_code AS demand_project_code,
           dl.line_code,
           dl.phase_code,
           dl.station_or_unit,
           dl.quantity,
           dl.need_date AS demand_need_date,
           dl.remark,
           a.id AS approval_id,
           a.approval_stage,
           a.approval_role,
           a.decision AS approval_decision
         FROM request_packages rp
         JOIN request_items ri ON ri.request_package_id = rp.id
         LEFT JOIN request_demand_lines dl ON dl.request_item_id = ri.id
         LEFT JOIN approvals a ON a.request_package_id = rp.id AND (a.request_item_id = ri.id OR a.request_item_id IS NULL)
         LEFT JOIN users creator ON creator.id = rp.created_by_user_id
         WHERE rp.status <> 'draft'
         ORDER BY rp.submitted_at DESC, rp.id, ri.line_no, dl.line_no`,
      );
  }
  return { queryOmLeaderConsoleRows };
}

module.exports = { createLeaderRepository };
