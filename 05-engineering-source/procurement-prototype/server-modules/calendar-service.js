const { normalizeProjectStageCalendarRecord, projectStageCalendarStorageKey } = require('./om-models');

function createCalendarService({ pool, queryProjectStageCalendarRecords, memoryStore, querySaveProjectStageCalendarRecord, audit }) {
  async function projectStageCalendarRecords() {
    if (pool) {
      const [rows] = await queryProjectStageCalendarRecords();
      return rows.map(normalizeProjectStageCalendarRecord);
    }
    return [...memoryStore.projectStageCalendarRecords.values()].map(normalizeProjectStageCalendarRecord);
  }
  
  async function saveProjectStageCalendarRecord(req, actor, payload = {}) {
    const record = normalizeProjectStageCalendarRecord({
      ...payload,
      updatedBy: actor?.name || "",
      updatedByUserId: actor?.id || "",
      updatedAt: new Date().toISOString(),
    });
    if (!record.yearProject || !record.phase || !record.lineOpenDate) {
      const error = new Error("Year Project, Phase, and Line Open Date are required");
      error.status = 400;
      throw error;
    }
    if (pool) {
      await querySaveProjectStageCalendarRecord(record, actor);
    } else {
      memoryStore.projectStageCalendarRecords.set(projectStageCalendarStorageKey(record), record);
    }
    await audit("om.project_stage_calendar_saved", req, {
      actor,
      entityType: "om_project_stage_calendar",
      entityId: projectStageCalendarStorageKey(record),
      metadata: record,
    });
    return record;
  }
  return { projectStageCalendarRecords, saveProjectStageCalendarRecord };
}

module.exports = { createCalendarService };
