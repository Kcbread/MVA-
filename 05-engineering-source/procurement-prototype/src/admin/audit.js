// admin/audit: authoritative source; see docs/module-map.md.
import {
  adminApprovalSetup
} from "./state.js";
import {
  apiModeEnabled
} from "../infrastructure/api.js";
import {
  sessionUserFromRole
} from "../session/session.js";

// @legacy-unit 405 2163
export function pushAdminAuditEvent(eventType, entityType, entityId, metadata = {}) {
  const actor = sessionUserFromRole("admin");
  adminApprovalSetup.auditLog = [
    {
      id: `${eventType}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventType,
      actorUserId: actor.id || "admin-default",
      actorRole: actor.role || "admin",
      entityType,
      entityId,
      ipAddress: apiModeEnabled() ? window.location.hostname || "127.0.0.1" : "prototype-local",
      metadata,
    },
    ...(adminApprovalSetup.auditLog || []),
  ];
}
// @end-legacy-unit 405
