

function createCalendarRepository({ pool }) {
  async function queryProjectStageCalendarRecords() {
    return pool.execute(`
        SELECT c.year_project AS yearProject, c.project_code AS projectCode, c.phase_code AS phase,
               c.line_open_date AS lineOpenDate, c.updated_by_user_id AS updatedByUserId,
               u.name AS updatedBy, c.updated_at AS updatedAt
        FROM om_project_stage_calendar c
        LEFT JOIN users u ON u.id = c.updated_by_user_id
        ORDER BY c.year_project, c.project_code, c.phase_code
      `);
  }
  
  async function querySaveProjectStageCalendarRecord(record, actor) {
    return pool.execute(
        `INSERT INTO om_project_stage_calendar (year_project, project_code, phase_code, line_open_date, updated_by_user_id)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE line_open_date = VALUES(line_open_date), updated_by_user_id = VALUES(updated_by_user_id), updated_at = CURRENT_TIMESTAMP`,
        [record.yearProject, record.projectCode, record.phase, record.lineOpenDate, actor?.id || null],
      );
  }
  return { queryProjectStageCalendarRecords, querySaveProjectStageCalendarRecord };
}

module.exports = { createCalendarRepository };
