

function createAuditRepository({ pool, memoryStore }) {
  async function audit(eventType, req, { actor, entityType, entityId, metadata } = {}) {
    const event = {
      event_type: eventType,
      actor_user_id: actor?.id || null,
      actor_role: actor?.role || null,
      entity_type: entityType || null,
      entity_id: entityId || null,
      metadata_json: metadata || {},
      ip_address: req.socket.remoteAddress || "",
      user_agent: req.headers["user-agent"] || "",
    };
    if (pool) {
      await pool.execute(
        "INSERT INTO audit_events (event_type, actor_user_id, actor_role, entity_type, entity_id, metadata_json, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [event.event_type, event.actor_user_id, event.actor_role, event.entity_type, event.entity_id, JSON.stringify(event.metadata_json), event.ip_address, event.user_agent],
      );
      return;
    }
    memoryStore.auditEvents.push({ ...event, id: memoryStore.auditEvents.length + 1, created_at: new Date().toISOString() });
  }
  
  function filterAuditEvents(query) {
    return memoryStore.auditEvents.filter((event) => {
      const createdAt = new Date(event.created_at || 0).getTime();
      if (query.get("actorUserId") && event.actor_user_id !== query.get("actorUserId")) return false;
      if (query.get("actorRole") && event.actor_role !== query.get("actorRole")) return false;
      if (query.get("eventType") && event.event_type !== query.get("eventType")) return false;
      if (query.get("module")) {
        const prefix = `${query.get("module")}.`;
        if (!String(event.event_type || "").startsWith(prefix)) return false;
      }
      if (query.get("from") && createdAt < new Date(query.get("from")).getTime()) return false;
      if (query.get("to") && createdAt > new Date(query.get("to")).getTime()) return false;
      return true;
    }).sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }
  return { audit, filterAuditEvents };
}

module.exports = { createAuditRepository };
