const http = require('node:http');
const { URL } = require('node:url');
const { loadConfig } = require('./config');
const { createDatabase } = require('./database');
const { publicUser } = require('./user-model');
const { createMemoryStore } = require('./memory-store');
const { createHttpBody } = require('./http-body');
const { createAuditRepository } = require('./audit-repository');
const { createUserRepository } = require('./user-repository');
const { createImportService } = require('./import-service');
const { createWorkflowRepository } = require('./workflow-repository');
const { createStaticAssets } = require('./static-assets');
const { createSessionRepository } = require('./session-repository');
const { createSessionService } = require('./session-service');
const { createAdminService } = require('./admin-service');
const { createAuthRoutes } = require('./auth-routes');
const { createWorkflowRoutes } = require('./workflow-routes');
const { createImportRoutes } = require('./import-routes');
const { createAdminRoutes } = require('./admin-routes');
const { createCatalogRepository } = require('./catalog-repository');
const { createCatalogService } = require('./catalog-service');
const { createCatalogRoutes } = require('./catalog-routes');
const { createAttachmentRepository } = require('./attachment-repository');
const { createAttachmentService } = require('./attachment-service');
const { createAttachmentRoutes } = require('./attachment-routes');
const { createAssignmentRepository } = require('./assignment-repository');
const { createAssignmentService } = require('./assignment-service');
const { createAssignmentRoutes } = require('./assignment-routes');
const { createCalendarRepository } = require('./calendar-repository');
const { createCalendarService } = require('./calendar-service');
const { createCalendarRoutes } = require('./calendar-routes');
const { createTrackingRepository } = require('./tracking-repository');
const { createTrackingService } = require('./tracking-service');
const { createTrackingRoutes } = require('./tracking-routes');
const { createLeaderRepository } = require('./leader-repository');
const { createLeaderService } = require('./leader-service');
const { createLeaderRoutes } = require('./leader-routes');

function createApplication({ root, pool: suppliedPool } = {}) {
  const config = loadConfig(root || require("node:path").resolve(__dirname, ".."));
  const database = createDatabase({ pool: suppliedPool });
  const memoryStore = createMemoryStore();
  const httpBody = createHttpBody({
    MAX_UPLOAD_BYTES: config.MAX_UPLOAD_BYTES,
  });
  const auditRepository = createAuditRepository({
    pool: database.pool,
    memoryStore: memoryStore.memoryStore,
  });
  const userRepository = createUserRepository({
    memoryStore: memoryStore.memoryStore,
    pool: database.pool,
  });
  const importService = createImportService({
    ROOT: config.ROOT,
    mysqlConfigPresent: database.mysqlConfigPresent,
    memoryStore: memoryStore.memoryStore,
    pool: database.pool,
    audit: auditRepository.audit,
  });
  const workflowRepository = createWorkflowRepository({
    pool: database.pool,
  });
  const staticAssets = createStaticAssets({
    WORKSPACE_PREVIEW_PREFIX: config.WORKSPACE_PREVIEW_PREFIX,
    PUBLIC_ROOT_FILES: config.PUBLIC_ROOT_FILES,
    ROOT: config.ROOT,
  });
  const sessionRepository = createSessionRepository({
    pool: database.pool,
  });
  const sessionService = createSessionService({
    pool: database.pool,
    queryRevokeSessionsForUser: sessionRepository.queryRevokeSessionsForUser,
    memoryStore: memoryStore.memoryStore,
    SESSION_TTL_MS: config.SESSION_TTL_MS,
    queryCreateSession: sessionRepository.queryCreateSession,
    updateLastLoginAt: userRepository.updateLastLoginAt,
    audit: auditRepository.audit,
    parseCookies: httpBody.parseCookies,
    SESSION_COOKIE: config.SESSION_COOKIE,
    queryCurrentUser: sessionRepository.queryCurrentUser,
    findUserById: userRepository.findUserById,
    queryLogout: sessionRepository.queryLogout,
    sendJson: httpBody.sendJson,
  });
  const adminService = createAdminService({
    memoryStore: memoryStore.memoryStore,
    requireAuth: sessionService.requireAuth,
    audit: auditRepository.audit,
    sendJson: httpBody.sendJson,
    appRoleFromRoleKey: userRepository.appRoleFromRoleKey,
    findDuplicateUser: userRepository.findDuplicateUser,
    replaceMemoryUser: userRepository.replaceMemoryUser,
    revokeSessionsForUser: sessionService.revokeSessionsForUser,
    removeUserLookupKeys: userRepository.removeUserLookupKeys,
    defaultRolePermissions: memoryStore.defaultRolePermissions,
  });
  const authRoutes = createAuthRoutes({
    healthStatus: database.healthStatus,
    sendJson: httpBody.sendJson,
    readBody: httpBody.readBody,
    testLoginRoleIdentifiers: memoryStore.testLoginRoleIdentifiers,
    findUserByIdentifier: userRepository.findUserByIdentifier,
    audit: auditRepository.audit,
    createSession: sessionService.createSession,
    cookieHeader: sessionService.cookieHeader,
    logout: sessionService.logout,
    clearCookieHeader: sessionService.clearCookieHeader,
    requireAuth: sessionService.requireAuth,
  });
  const workflowRoutes = createWorkflowRoutes({
    requireAuth: sessionService.requireAuth,
    sendJson: httpBody.sendJson,
    workflowReviewRowsForUser: workflowRepository.workflowReviewRowsForUser,
  });
  const importRoutes = createImportRoutes({
    requireAdmin: adminService.requireAdmin,
    sendJson: httpBody.sendJson,
    sapPoRawImportStatusPayload: importService.sapPoRawImportStatusPayload,
    createSapPoRawImportPreview: importService.createSapPoRawImportPreview,
    readBody: httpBody.readBody,
    commitSapPoRawImport: importService.commitSapPoRawImport,
  });
  const adminRoutes = createAdminRoutes({
    requireAdmin: adminService.requireAdmin,
    sendJson: httpBody.sendJson,
    listUsersMemory: userRepository.listUsersMemory,
    createAdminUser: adminService.createAdminUser,
    readBody: httpBody.readBody,
    updateAdminUserRecord: adminService.updateAdminUserRecord,
    updateAdminUserStatus: adminService.updateAdminUserStatus,
    parseAdminImportRows: adminService.parseAdminImportRows,
    findDuplicateUser: userRepository.findDuplicateUser,
    appRoleFromRoleKey: userRepository.appRoleFromRoleKey,
    replaceMemoryUser: userRepository.replaceMemoryUser,
    memoryStore: memoryStore.memoryStore,
    audit: auditRepository.audit,
    listRolesMemory: adminService.listRolesMemory,
    adminPermissionModules: memoryStore.adminPermissionModules,
    createAdminRole: adminService.createAdminRole,
    updateRolePermissions: adminService.updateRolePermissions,
    listFieldVisibilityMemory: adminService.listFieldVisibilityMemory,
    updateFieldVisibilityRules: adminService.updateFieldVisibilityRules,
    filterAuditEvents: auditRepository.filterAuditEvents,
  });
  const catalogRepository = createCatalogRepository({
    pool: database.pool,
  });
  const catalogService = createCatalogService({
    ROOT: config.ROOT,
    pool: database.pool,
    queryLvTaxonomyPayload: catalogRepository.queryLvTaxonomyPayload,
    memoryStore: memoryStore.memoryStore,
    queryCatalogItemsForRequest: catalogRepository.queryCatalogItemsForRequest,
  });
  const catalogRoutes = createCatalogRoutes({
    sendJson: httpBody.sendJson,
    lvTaxonomyPayload: catalogService.lvTaxonomyPayload,
    requireAuth: sessionService.requireAuth,
    catalogItemsForRequest: catalogService.catalogItemsForRequest,
  });
  const attachmentRepository = createAttachmentRepository({
    pool: database.pool,
  });
  const attachmentService = createAttachmentService({
    pool: database.pool,
    queryFindAttachment: attachmentRepository.queryFindAttachment,
    memoryStore: memoryStore.memoryStore,
    readMultipart: httpBody.readMultipart,
    audit: auditRepository.audit,
    UPLOAD_ROOT: config.UPLOAD_ROOT,
    queryCreateAttachment: attachmentRepository.queryCreateAttachment,
    sendJson: httpBody.sendJson,
  });
  const attachmentRoutes = createAttachmentRoutes({
    requireAuth: sessionService.requireAuth,
    createAttachment: attachmentService.createAttachment,
    sendJson: httpBody.sendJson,
    sendAttachmentDownload: attachmentService.sendAttachmentDownload,
  });
  const assignmentRepository = createAssignmentRepository({
    pool: database.pool,
  });
  const assignmentService = createAssignmentService({
    pool: database.pool,
    queryOmAssignees: assignmentRepository.queryOmAssignees,
    memoryStore: memoryStore.memoryStore,
    queryOmAssignments: assignmentRepository.queryOmAssignments,
    findUserById: userRepository.findUserById,
    audit: auditRepository.audit,
    querySetOmAssignment: assignmentRepository.querySetOmAssignment,
  });
  const assignmentRoutes = createAssignmentRoutes({
    requireAdmin: adminService.requireAdmin,
    sendJson: httpBody.sendJson,
    omAssignmentRules: assignmentService.omAssignmentRules,
    createOmAssignmentRule: assignmentService.createOmAssignmentRule,
    readBody: httpBody.readBody,
    updateOmAssignmentRule: assignmentService.updateOmAssignmentRule,
    requireAuth: sessionService.requireAuth,
    omAssignees: assignmentService.omAssignees,
    omAssignments: assignmentService.omAssignments,
    audit: auditRepository.audit,
    setOmAssignment: assignmentService.setOmAssignment,
  });
  const calendarRepository = createCalendarRepository({
    pool: database.pool,
  });
  const calendarService = createCalendarService({
    pool: database.pool,
    queryProjectStageCalendarRecords: calendarRepository.queryProjectStageCalendarRecords,
    memoryStore: memoryStore.memoryStore,
    querySaveProjectStageCalendarRecord: calendarRepository.querySaveProjectStageCalendarRecord,
    audit: auditRepository.audit,
  });
  const calendarRoutes = createCalendarRoutes({
    requireAuth: sessionService.requireAuth,
    sendJson: httpBody.sendJson,
    projectStageCalendarRecords: calendarService.projectStageCalendarRecords,
    audit: auditRepository.audit,
    saveProjectStageCalendarRecord: calendarService.saveProjectStageCalendarRecord,
    readBody: httpBody.readBody,
  });
  const trackingRepository = createTrackingRepository({
    pool: database.pool,
  });
  const trackingService = createTrackingService({
    pool: database.pool,
    queryOmProcurementTrackingRecords: trackingRepository.queryOmProcurementTrackingRecords,
    memoryStore: memoryStore.memoryStore,
    queryUpdateOmProcurementTracking: trackingRepository.queryUpdateOmProcurementTracking,
    audit: auditRepository.audit,
  });
  const trackingRoutes = createTrackingRoutes({
    requireAuth: sessionService.requireAuth,
    sendJson: httpBody.sendJson,
    omProcurementTrackingRecords: trackingService.omProcurementTrackingRecords,
    audit: auditRepository.audit,
    updateOmProcurementTracking: trackingService.updateOmProcurementTracking,
    readBody: httpBody.readBody,
  });
  const leaderRepository = createLeaderRepository({
    pool: database.pool,
  });
  const leaderService = createLeaderService({
    pool: database.pool,
    queryOmLeaderConsoleRows: leaderRepository.queryOmLeaderConsoleRows,
    memoryStore: memoryStore.memoryStore,
    projectStageCalendarRecords: calendarService.projectStageCalendarRecords,
    omProcurementTrackingRecords: trackingService.omProcurementTrackingRecords,
  });
  const leaderRoutes = createLeaderRoutes({
    requireAuth: sessionService.requireAuth,
    sendJson: httpBody.sendJson,
    omLeaderConsolePayload: leaderService.omLeaderConsolePayload,
  });
  const routes = [
    authRoutes.handleAuthRoutes,
    catalogRoutes.handleCatalogRoutes,
    workflowRoutes.handleWorkflowRoutes,
    importRoutes.handleImportRoutes,
    adminRoutes.handleAdminRoutes,
    assignmentRoutes.handleAssignmentRoutes,
    attachmentRoutes.handleAttachmentRoutes,
    calendarRoutes.handleCalendarRoutes,
    trackingRoutes.handleTrackingRoutes,
    leaderRoutes.handleLeaderRoutes,
  ];
  async function handleApi(req, res, url) {
    try {
      for (const route of routes) if (await route(req, res, url)) return;
      httpBody.sendJson(res, 404, { error: "API route not found" });
    } catch (error) {
      httpBody.sendJson(res, error.status || 500, { error: error.message || "Server error", errors: error.errors || undefined });
    }
  }
function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      handleApi(req, res, url);
      return;
    }
    staticAssets.serveStatic(req, res, url);
  });
}
  return { createServer, memoryStore: memoryStore.memoryStore, publicUser, port: config.PORT };
}

module.exports = { createApplication };
