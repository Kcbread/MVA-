const { normalizeOmProcurementTrackingRecord, sanitizeOmProcurementPatch } = require('./om-models');
const { textValue } = require('./values');

function createTrackingService({ pool, queryOmProcurementTrackingRecords, memoryStore, queryUpdateOmProcurementTracking, audit }) {
  async function omProcurementTrackingRecords() {
    if (pool) {
      const [rows] = await queryOmProcurementTrackingRecords();
      return rows.map(normalizeOmProcurementTrackingRecord);
    }
    return [...memoryStore.omProcurementTracking.values()].map(normalizeOmProcurementTrackingRecord);
  }
  
  async function updateOmProcurementTracking(req, actor, requestId, payload = {}) {
    const id = textValue(requestId, 96);
    if (!id) {
      const error = new Error("Request ID is required");
      error.status = 400;
      throw error;
    }
    const existing = pool
      ? (await omProcurementTrackingRecords()).find((record) => record.requestId === id) || { requestId: id }
      : memoryStore.omProcurementTracking.get(id) || { requestId: id };
    const record = normalizeOmProcurementTrackingRecord({
      ...existing,
      ...sanitizeOmProcurementPatch(payload),
      requestId: id,
      updatedBy: actor?.name || "",
      updatedByUserId: actor?.id || "",
      updatedAt: new Date().toISOString(),
    });
    if (pool) {
      await queryUpdateOmProcurementTracking(record, actor);
    } else {
      memoryStore.omProcurementTracking.set(id, record);
    }
    await audit("om.procurement_tracking_updated", req, {
      actor,
      entityType: "request",
      entityId: id,
      metadata: sanitizeOmProcurementPatch(payload),
    });
    return record;
  }
  return { omProcurementTrackingRecords, updateOmProcurementTracking };
}

module.exports = { createTrackingService };
