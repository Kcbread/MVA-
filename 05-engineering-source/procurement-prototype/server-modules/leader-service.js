const { workflowReviewRowFromGroup } = require('./workflow-model');

function createLeaderService({ pool, queryOmLeaderConsoleRows, memoryStore, projectStageCalendarRecords, omProcurementTrackingRecords }) {
  async function omLeaderConsoleRows(user) {
    if (pool) {
      const [rows] = await queryOmLeaderConsoleRows();
      const groups = new Map();
      rows.forEach((row) => {
        const key = `${row.package_id}::${row.request_item_id}`;
        if (!groups.has(key)) groups.set(key, { rows: [] });
        groups.get(key).rows.push(row);
      });
      return Array.from(groups.values()).map(workflowReviewRowFromGroup);
    }
    return (memoryStore.omLeaderConsoleRows || []).map((row) => ({ ...row }));
  }
  
  async function omLeaderConsolePayload(user) {
    const [rows, stageCalendar, procurementTracking] = await Promise.all([
      omLeaderConsoleRows(user),
      projectStageCalendarRecords(),
      omProcurementTrackingRecords(),
    ]);
    return {
      connected: true,
      source: pool ? "mysql" : "memory-fallback",
      rows,
      stageCalendar,
      procurementTracking,
      summary: {
        totalRows: rows.length,
        stageCalendarRows: stageCalendar.length,
        procurementTrackingRows: procurementTracking.length,
      },
    };
  }
  return { omLeaderConsoleRows, omLeaderConsolePayload };
}

module.exports = { createLeaderService };
