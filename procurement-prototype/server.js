const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

let mysql;
try {
  mysql = require("mysql2/promise");
} catch {
  mysql = null;
}

const ROOT = __dirname;

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 4173);
const SESSION_COOKIE = "mva_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * Number(process.env.SESSION_TTL_HOURS || 8);
const OMITTED_USER_FIELDS = new Set(["password_hash"]);
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(path.dirname(ROOT), "uploads");
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024);

const uatUsers = [
  { id: "om-leader-mai", employee_id: "maint5", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader", project_family: "Mixed", project_codes: "All OM", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
  { id: "om-member-giang", employee_id: "giangth1", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember", project_family: "Mixed", project_codes: "Assigned OM rows", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
  { id: "om-member-linh", employee_id: "linhnp", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember", project_family: "Mixed", project_codes: "Assigned OM rows", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
  { id: "admin-default", employee_id: "admin", name: "Admin", email: "admin@fih-foxconn.com", department: "IT", role: "admin", project_family: "Mixed", project_codes: "All", responsibility_department: "System Admin", password_hash: "plain:123", is_active: 1 },
  { id: "cost-owner", employee_id: "cost-owner", name: "Cost Owner", email: "cost-owner@fih-foxconn.com", department: "MFG", role: "manager", project_family: "Mixed", project_codes: "All cost scope", responsibility_department: "Cost Owner", password_hash: "plain:123", is_active: 1 },
  { id: "requester-v1524505", employee_id: "V1524505", name: "To Thi Phuong Anh", email: "anhttp@fih-foxconn.com", department: "MFG", role: "requester", project_family: "G", project_codes: "P26 Demo Line,P26,P27", responsibility_department: "MFG", password_hash: "plain:123", is_active: 1 },
  { id: "requester-v1547168", employee_id: "V1547168", name: "Dang Thi Ban", email: "bandt1@fih-foxconn.com", department: "MFG", role: "requester", project_family: "Non-G", project_codes: "LD8,MH2,BM2,SSF,ML2,MA4", responsibility_department: "MFG", password_hash: "plain:123", is_active: 1 },
  { id: "dept-dri-default", employee_id: "dept-dri", name: "Dept DRI", email: "dept-dri@fih-foxconn.com", department: "MFG", role: "dri", project_family: "Mixed", project_codes: "Escalation scope", responsibility_department: "Dept DRI", password_hash: "plain:123", is_active: 1 },
  { id: "budget-approver-default", employee_id: "budget-approver", name: "Budget Approver", email: "budget-approver@fih-foxconn.com", department: "PMO", role: "projectDri", project_family: "Mixed", project_codes: "Budget approval scope", responsibility_department: "Budget Approver", password_hash: "plain:123", is_active: 1 },
  { id: "buyer-handoff-default", employee_id: "buyer-handoff", name: "Buyer Handoff", email: "buyer-handoff@fih-foxconn.com", department: "Supply Chain", role: "buyer", project_family: "Mixed", project_codes: "Buyer handoff scope", responsibility_department: "Buyer Handoff", password_hash: "plain:123", is_active: 1 },
];

const testLoginRoleIdentifiers = {
  requester: "V1524505",
  dri: "dept-dri",
  omLeader: "maint5",
  omMember: "giangth1",
  manager: "cost-owner",
  projectDri: "budget-approver",
  buyer: "buyer-handoff",
  admin: "admin",
};

const memoryStore = {
  users: new Map(uatUsers.flatMap((user) => [
    [String(user.email || "").toLowerCase(), { ...user }],
    [String(user.employee_id || "").toLowerCase(), { ...user }],
    [String(user.id || "").toLowerCase(), { ...user }],
  ].filter(([key]) => key))),
  usersById: new Map(uatUsers.map((user) => [user.id, { ...user }])),
  sessions: new Map(),
  assignments: new Map(),
  uatFeedback: new Map(),
  attachments: new Map(),
  auditEvents: [],
};

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  if (!user) return null;
  return Object.fromEntries(Object.entries(user).filter(([key]) => !OMITTED_USER_FIELDS.has(key)));
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((part) => {
    const [key, ...rest] = part.trim().split("=");
    return [key, decodeURIComponent(rest.join("=") || "")];
  }).filter(([key]) => key));
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  res.end(JSON.stringify(payload));
}

function readRequestBuffer(req, maxBytes = MAX_UPLOAD_BYTES) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let done = false;
    req.on("data", (chunk) => {
      if (done) return;
      total += chunk.length;
      if (total > maxBytes) {
        done = true;
        const error = new Error("Upload too large");
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!done) resolve(Buffer.concat(chunks, total));
    });
    req.on("error", (error) => {
      if (!done) reject(error);
    });
  });
}

function splitBuffer(buffer, delimiter) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(delimiter, start);
  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }
  parts.push(buffer.subarray(start));
  return parts;
}

function parseDispositionAttributes(value = "") {
  const attrs = {};
  String(value).replace(/([a-zA-Z0-9_-]+)=("([^"]*)"|[^;\s]+)/g, (match, key, raw, quoted) => {
    attrs[key] = quoted === undefined ? raw : quoted;
    return match;
  });
  return attrs;
}

async function readMultipart(req) {
  const contentType = String(req.headers["content-type"] || "");
  const boundary = contentType.match(/boundary=([^;]+)/)?.[1];
  if (!boundary) {
    const error = new Error("multipart/form-data boundary is required");
    error.status = 400;
    throw error;
  }
  const body = await readRequestBuffer(req);
  const delimiter = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = {};
  splitBuffer(body, delimiter).forEach((rawPart) => {
    let part = rawPart;
    if (!part.length) return;
    if (part.subarray(0, 2).toString() === "\r\n") part = part.subarray(2);
    if (part.subarray(0, 2).toString() === "--") return;
    if (part.subarray(part.length - 2).toString() === "\r\n") part = part.subarray(0, part.length - 2);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) return;
    const headers = Object.fromEntries(part.subarray(0, headerEnd).toString("utf8").split(/\r\n/).map((line) => {
      const separator = line.indexOf(":");
      return separator === -1 ? ["", ""] : [line.slice(0, separator).trim().toLowerCase(), line.slice(separator + 1).trim()];
    }).filter(([key]) => key));
    const attrs = parseDispositionAttributes(headers["content-disposition"]);
    const name = attrs.name;
    if (!name) return;
    const content = part.subarray(headerEnd + 4);
    if (attrs.filename !== undefined) {
      files[name] = {
        fieldName: name,
        filename: attrs.filename || "upload.bin",
        mimeType: headers["content-type"] || "application/octet-stream",
        content,
      };
    } else {
      fields[name] = content.toString("utf8");
    }
  });
  return { fields, files };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error("Request body too large"));
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  if (passwordHash.startsWith("plain:")) return password === passwordHash.slice(6);
  if (passwordHash.startsWith("sha256:")) return hashToken(password) === passwordHash.slice(7);
  return false;
}

function mysqlConfigPresent() {
  return Boolean(process.env.MYSQL_URL || process.env.MYSQL_HOST || process.env.DB_HOST);
}

function createPool() {
  if (!mysql || !mysqlConfigPresent()) return null;
  if (process.env.MYSQL_URL) return mysql.createPool(process.env.MYSQL_URL);
  return mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "mva_procurement_uat",
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || process.env.DB_CONNECTION_LIMIT || 10),
  });
}

const pool = createPool();

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

async function findUserByIdentifier(identifier) {
  const normalized = String(identifier || "").trim().toLowerCase();
  if (pool) {
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE (LOWER(email) = ? OR LOWER(employee_id) = ? OR LOWER(id) = ?) AND is_active = 1 LIMIT 1",
      [normalized, normalized, normalized],
    );
    return rows[0] || null;
  }
  return memoryStore.users.get(normalized) || null;
}

async function findUserById(id) {
  if (!id) return null;
  if (pool) {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
    return rows[0] || null;
  }
  return memoryStore.usersById.get(id) || null;
}

async function createSession(req, user) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const session = {
    id: crypto.randomUUID(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + SESSION_TTL_MS),
  };
  if (pool) {
    await pool.execute(
      "INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
      [session.id, session.user_id, session.token_hash, req.socket.remoteAddress || "", req.headers["user-agent"] || "", session.expires_at],
    );
  } else {
    memoryStore.sessions.set(tokenHash, session);
  }
  await audit("auth.login", req, { actor: user, entityType: "session", entityId: session.id });
  return token;
}

async function currentUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = hashToken(token);
  if (pool) {
    const [rows] = await pool.execute(
      "SELECT s.id AS session_id, s.user_id, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW() AND u.is_active = 1 LIMIT 1",
      [tokenHash],
    );
    return rows[0] || null;
  }
  const session = memoryStore.sessions.get(tokenHash);
  if (!session || session.expires_at <= new Date()) return null;
  return findUserById(session.user_id);
}

async function logout(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return;
  const tokenHash = hashToken(token);
  const actor = await currentUser(req);
  if (pool) await pool.execute("UPDATE sessions SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
  else memoryStore.sessions.delete(tokenHash);
  await audit("auth.logout", req, { actor, entityType: "session", entityId: tokenHash.slice(0, 12) });
}

function canAssignOm(user) {
  return ["omLeader", "admin"].includes(user?.role);
}

function canViewOm(user) {
  return ["omLeader", "omMember", "om", "admin"].includes(user?.role);
}

function canTriageUatFeedback(user) {
  return ["omLeader", "admin"].includes(user?.role);
}

function textValue(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

function jsonValue(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function sanitizeOriginalFileName(fileName) {
  const baseName = path.basename(String(fileName || "upload.bin")).trim();
  return (baseName || "upload.bin").slice(0, 255);
}

function storedFileExtension(fileName) {
  return path.extname(sanitizeOriginalFileName(fileName)).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 16) || ".bin";
}

function uploadDateFolder(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function attachmentFromRow(row) {
  if (!row) return null;
  const id = row.id;
  return {
    id,
    linkedEntityType: row.linkedEntityType || row.linked_entity_type,
    linkedEntityId: row.linkedEntityId || row.linked_entity_id,
    attachmentKind: row.attachmentKind || row.attachment_kind,
    originalFileName: row.originalFileName || row.original_file_name,
    storedFileName: row.storedFileName || row.stored_file_name,
    storagePath: row.storagePath || row.storage_path,
    mimeType: row.mimeType || row.mime_type || "application/octet-stream",
    fileSize: Number(row.fileSize || row.file_size || 0),
    uploadedByUserId: row.uploadedByUserId || row.uploaded_by_user_id,
    uploadedByRole: row.uploadedByRole || row.uploaded_by_role || "",
    visibilityScope: row.visibilityScope || row.visibility_scope || "om_internal",
    metadata: jsonValue(row.metadata || row.metadata_json, {}),
    createdAt: row.createdAt || row.created_at,
    downloadUrl: `/api/attachments/${encodeURIComponent(id)}`,
  };
}

function canUploadAttachment(user, attachment) {
  if (!user) return false;
  if (attachment.attachmentKind === "uat_screenshot" || attachment.linkedEntityType === "uat_feedback") return true;
  if (attachment.linkedEntityType === "om_quote" || attachment.attachmentKind.startsWith("om_") || attachment.attachmentKind.startsWith("sourcing_")) {
    return canViewOm(user);
  }
  if (attachment.linkedEntityType === "procurement_quote" || attachment.attachmentKind.startsWith("procurement_")) {
    return user.role !== "requester";
  }
  return canTriageUatFeedback(user);
}

function canDownloadAttachment(user, attachment) {
  if (!user || !attachment) return false;
  if (["admin", "omLeader"].includes(user.role)) return true;
  if (attachment.uploadedByUserId === user.id) return true;
  if (attachment.linkedEntityType === "procurement_quote") return user.role !== "requester";
  if (attachment.visibilityScope === "om_internal" || attachment.linkedEntityType === "om_quote") return canViewOm(user);
  if (attachment.visibilityScope === "uat_feedback" || attachment.linkedEntityType === "uat_feedback") return canTriageUatFeedback(user);
  return false;
}

async function findAttachment(attachmentId) {
  if (pool) {
    const [rows] = await pool.execute("SELECT * FROM attachments WHERE id = ? LIMIT 1", [attachmentId]);
    return attachmentFromRow(rows[0]);
  }
  return attachmentFromRow(memoryStore.attachments.get(attachmentId));
}

async function createAttachment(req, actor) {
  const { fields, files } = await readMultipart(req);
  const file = files.file || Object.values(files)[0];
  if (!file || !file.content?.length) {
    const error = new Error("file is required");
    error.status = 400;
    throw error;
  }
  const attachment = {
    id: crypto.randomUUID(),
    linkedEntityType: textValue(fields.linkedEntityType || fields.linked_entity_type, 80) || "unscoped",
    linkedEntityId: textValue(fields.linkedEntityId || fields.linked_entity_id, 120) || "unscoped",
    attachmentKind: textValue(fields.attachmentKind || fields.attachment_kind, 80) || "general",
    originalFileName: sanitizeOriginalFileName(file.filename),
    mimeType: textValue(file.mimeType, 120) || "application/octet-stream",
    fileSize: file.content.length,
    uploadedByUserId: actor.id,
    uploadedByRole: actor.role || "",
    visibilityScope: textValue(fields.visibilityScope || fields.visibility_scope, 80) || "om_internal",
    metadata: jsonValue(fields.metadata, {}),
    createdAt: new Date().toISOString(),
  };
  if (!canUploadAttachment(actor, attachment)) {
    await audit("attachment.upload_blocked", req, {
      actor,
      entityType: attachment.linkedEntityType,
      entityId: attachment.linkedEntityId,
      metadata: { attachmentKind: attachment.attachmentKind },
    });
    const error = new Error("Not allowed to upload this attachment");
    error.status = 403;
    throw error;
  }
  const folder = uploadDateFolder();
  const storedFileName = `${attachment.id}${storedFileExtension(attachment.originalFileName)}`;
  const targetDir = path.join(UPLOAD_ROOT, folder);
  const storagePath = path.join(targetDir, storedFileName);
  await fs.promises.mkdir(targetDir, { recursive: true });
  await fs.promises.writeFile(storagePath, file.content);
  attachment.storedFileName = storedFileName;
  attachment.storagePath = storagePath;
  try {
    if (pool) {
      await pool.execute(
        `INSERT INTO attachments
         (id, linked_entity_type, linked_entity_id, attachment_kind, original_file_name, stored_file_name, storage_path, mime_type, file_size, uploaded_by_user_id, uploaded_by_role, visibility_scope, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          attachment.id,
          attachment.linkedEntityType,
          attachment.linkedEntityId,
          attachment.attachmentKind,
          attachment.originalFileName,
          attachment.storedFileName,
          attachment.storagePath,
          attachment.mimeType,
          attachment.fileSize,
          attachment.uploadedByUserId,
          attachment.uploadedByRole,
          attachment.visibilityScope,
          JSON.stringify(attachment.metadata),
        ],
      );
    } else {
      memoryStore.attachments.set(attachment.id, attachment);
    }
  } catch (error) {
    await fs.promises.rm(storagePath, { force: true });
    throw error;
  }
  await audit("attachment.uploaded", req, {
    actor,
    entityType: attachment.linkedEntityType,
    entityId: attachment.linkedEntityId,
    metadata: {
      attachmentId: attachment.id,
      attachmentKind: attachment.attachmentKind,
      originalFileName: attachment.originalFileName,
      fileSize: attachment.fileSize,
      visibilityScope: attachment.visibilityScope,
    },
  });
  return attachmentFromRow(attachment);
}

async function sendAttachmentDownload(req, res, actor, attachmentId) {
  const attachment = await findAttachment(attachmentId);
  if (!attachment) {
    sendJson(res, 404, { error: "Attachment not found" });
    return;
  }
  if (!canDownloadAttachment(actor, attachment)) {
    await audit("attachment.download_blocked", req, {
      actor,
      entityType: attachment.linkedEntityType,
      entityId: attachment.linkedEntityId,
      metadata: { attachmentId: attachment.id },
    });
    sendJson(res, 403, { error: "Not allowed to download this attachment" });
    return;
  }
  let stat;
  try {
    stat = await fs.promises.stat(attachment.storagePath);
  } catch {
    await audit("attachment.file_missing", req, {
      actor,
      entityType: attachment.linkedEntityType,
      entityId: attachment.linkedEntityId,
      metadata: { attachmentId: attachment.id, storagePath: attachment.storagePath },
    });
    sendJson(res, 404, { error: "Attachment file missing on disk" });
    return;
  }
  await audit("attachment.downloaded", req, {
    actor,
    entityType: attachment.linkedEntityType,
    entityId: attachment.linkedEntityId,
    metadata: { attachmentId: attachment.id },
  });
  const headerFileName = sanitizeOriginalFileName(attachment.originalFileName).replace(/"/g, "");
  res.writeHead(200, {
    "Content-Type": attachment.mimeType || "application/octet-stream",
    "Content-Length": stat.size,
    "Content-Disposition": `attachment; filename="${headerFileName}"`,
  });
  fs.createReadStream(attachment.storagePath).pipe(res);
}

function feedbackFromRow(row) {
  if (!row) return null;
  let metadata = row.metadata || row.metadata_json || {};
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }
  return {
    id: row.id,
    submittedByUserId: row.submittedByUserId || row.submitted_by_user_id,
    submittedByName: row.submittedByName || row.submitted_by_name || row.submittedByUserName || "",
    pageKey: row.pageKey || row.page_key,
    rowScopeType: row.rowScopeType || row.row_scope_type || "",
    rowScopeId: row.rowScopeId || row.row_scope_id || "",
    rowScopeLabel: row.rowScopeLabel || row.row_scope_label || "",
    category: row.category || "general",
    severity: row.severity || "medium",
    feedbackText: row.feedbackText || row.feedback_text || "",
    status: row.status || "open",
    ownerUserId: row.ownerUserId || row.owner_user_id || null,
    ownerName: row.ownerName || row.owner_name || "",
    metadata,
    createdAt: row.createdAt || row.created_at,
    updatedAt: row.updatedAt || row.updated_at,
  };
}

async function omAssignees() {
  if (pool) {
    const [rows] = await pool.execute("SELECT id, employee_id, name, email, department, role FROM users WHERE role IN ('omLeader', 'omMember', 'om') AND is_active = 1 ORDER BY FIELD(role, 'omLeader', 'omMember', 'om'), name");
    return rows;
  }
  return [...memoryStore.usersById.values()]
    .filter((user) => ["omLeader", "omMember", "om"].includes(user.role) && user.is_active)
    .map(publicUser)
    .sort((left, right) => `${left.role} ${left.name}`.localeCompare(`${right.role} ${right.name}`));
}

async function omAssignments() {
  if (pool) {
    const [rows] = await pool.execute(`
      SELECT a.request_id AS requestId, a.assigned_to_user_id AS assignedToUserId, u.name AS assignedToName,
             u.email AS assignedToEmail, a.assigned_by_user_id AS assignedByUserId, b.name AS assignedByName,
             a.assigned_at AS assignedAt, a.assignment_status AS assignmentStatus, a.assignment_note AS assignmentNote
      FROM om_assignments a
      LEFT JOIN users u ON u.id = a.assigned_to_user_id
      LEFT JOIN users b ON b.id = a.assigned_by_user_id
      WHERE a.assignment_status <> 'cleared'
      ORDER BY a.assigned_at DESC
    `);
    return rows;
  }
  return [...memoryStore.assignments.values()];
}

async function setOmAssignment(req, actor, requestId, assignedToUserId, note) {
  const assignee = assignedToUserId ? await findUserById(assignedToUserId) : null;
  if (assignedToUserId && !assignee) {
    const error = new Error("Assignee not found");
    error.status = 404;
    throw error;
  }
  if (assignedToUserId && !["omLeader", "omMember", "om"].includes(assignee.role)) {
    const error = new Error("Assignee must be an OM user");
    error.status = 400;
    throw error;
  }
  const assignment = {
    requestId,
    assignedToUserId: assignedToUserId || null,
    assignedToName: assignee?.name || "",
    assignedToEmail: assignee?.email || "",
    assignedByUserId: actor.id,
    assignedByName: actor.name,
    assignedAt: new Date().toISOString(),
    assignmentStatus: assignedToUserId ? "assigned" : "cleared",
    assignmentNote: note || "",
  };
  if (pool) {
    await pool.execute(
      `INSERT INTO om_assignments (request_id, assigned_to_user_id, assigned_by_user_id, assigned_at, assignment_status, assignment_note)
       VALUES (?, ?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE assigned_to_user_id = VALUES(assigned_to_user_id), assigned_by_user_id = VALUES(assigned_by_user_id),
       assigned_at = NOW(), assignment_status = VALUES(assignment_status), assignment_note = VALUES(assignment_note)`,
      [requestId, assignment.assignedToUserId, actor.id, assignment.assignmentStatus, assignment.assignmentNote],
    );
  } else {
    if (assignedToUserId) memoryStore.assignments.set(requestId, assignment);
    else memoryStore.assignments.delete(requestId);
  }
  await audit(assignedToUserId ? "om.assignment_set" : "om.assignment_cleared", req, {
    actor,
    entityType: "request",
    entityId: requestId,
    metadata: assignment,
  });
  return assignment;
}

async function createUatFeedback(req, actor, body) {
  const pageKey = textValue(body.pageKey || body.page || body.page_key, 120);
  const feedbackText = textValue(body.feedbackText || body.message || body.comment || body.note, 2000);
  if (!pageKey || !feedbackText) {
    const error = new Error("pageKey and feedbackText are required");
    error.status = 400;
    throw error;
  }
  const metadata = {
    ...(body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {}),
  };
  const feedback = {
    id: crypto.randomUUID(),
    submittedByUserId: actor.id,
    submittedByName: actor.name,
    pageKey,
    rowScopeType: textValue(body.rowScopeType || body.rowType || body.row_scope_type, 80),
    rowScopeId: textValue(body.rowScopeId || body.rowId || body.row_scope_id, 120),
    rowScopeLabel: textValue(body.rowScopeLabel || body.rowLabel || body.row_scope_label, 240),
    category: textValue(body.category, 80) || "general",
    severity: textValue(body.severity, 40) || "medium",
    feedbackText,
    status: "open",
    ownerUserId: null,
    ownerName: "",
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (pool) {
    await pool.execute(
      `INSERT INTO uat_feedback
       (id, submitted_by_user_id, page_key, row_scope_type, row_scope_id, row_scope_label, category, severity, feedback_text, status, owner_user_id, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedback.id,
        feedback.submittedByUserId,
        feedback.pageKey,
        feedback.rowScopeType,
        feedback.rowScopeId,
        feedback.rowScopeLabel,
        feedback.category,
        feedback.severity,
        feedback.feedbackText,
        feedback.status,
        feedback.ownerUserId,
        JSON.stringify(feedback.metadata),
      ],
    );
  } else {
    memoryStore.uatFeedback.set(feedback.id, feedback);
  }
  await audit("uat_feedback.created", req, {
    actor,
    entityType: "uat_feedback",
    entityId: feedback.id,
    metadata: { pageKey: feedback.pageKey, rowScopeType: feedback.rowScopeType, rowScopeId: feedback.rowScopeId },
  });
  return feedback;
}

async function getOwnUatFeedback(actor) {
  if (pool) {
    const [rows] = await pool.execute(
      `SELECT f.*, submitter.name AS submitted_by_name, owner.name AS owner_name
       FROM uat_feedback f
       LEFT JOIN users submitter ON submitter.id = f.submitted_by_user_id
       LEFT JOIN users owner ON owner.id = f.owner_user_id
       WHERE f.submitted_by_user_id = ?
       ORDER BY f.created_at DESC`,
      [actor.id],
    );
    return rows.map(feedbackFromRow);
  }
  return [...memoryStore.uatFeedback.values()]
    .filter((feedback) => feedback.submittedByUserId === actor.id)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

async function getAllUatFeedback() {
  if (pool) {
    const [rows] = await pool.execute(
      `SELECT f.*, submitter.name AS submitted_by_name, owner.name AS owner_name
       FROM uat_feedback f
       LEFT JOIN users submitter ON submitter.id = f.submitted_by_user_id
       LEFT JOIN users owner ON owner.id = f.owner_user_id
       ORDER BY f.created_at DESC`,
    );
    return rows.map(feedbackFromRow);
  }
  return [...memoryStore.uatFeedback.values()]
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}

async function updateUatFeedbackStatus(req, actor, feedbackId, status) {
  const normalizedStatus = textValue(status, 40);
  const allowedStatuses = new Set(["open", "in_review", "resolved", "dismissed"]);
  if (!allowedStatuses.has(normalizedStatus)) {
    const error = new Error("Invalid feedback status");
    error.status = 400;
    throw error;
  }
  let feedback;
  if (pool) {
    const [result] = await pool.execute("UPDATE uat_feedback SET status = ?, updated_at = NOW() WHERE id = ?", [normalizedStatus, feedbackId]);
    if (!result.affectedRows) {
      const error = new Error("Feedback not found");
      error.status = 404;
      throw error;
    }
    const [rows] = await pool.execute(
      `SELECT f.*, submitter.name AS submitted_by_name, owner.name AS owner_name
       FROM uat_feedback f
       LEFT JOIN users submitter ON submitter.id = f.submitted_by_user_id
       LEFT JOIN users owner ON owner.id = f.owner_user_id
       WHERE f.id = ? LIMIT 1`,
      [feedbackId],
    );
    feedback = feedbackFromRow(rows[0]);
  } else {
    feedback = memoryStore.uatFeedback.get(feedbackId);
    if (!feedback) {
      const error = new Error("Feedback not found");
      error.status = 404;
      throw error;
    }
    feedback.status = normalizedStatus;
    feedback.updatedAt = new Date().toISOString();
    memoryStore.uatFeedback.set(feedbackId, feedback);
  }
  const auditEvent = {
    eventType: "uat_feedback.status_updated",
    actorUserId: actor.id,
    entityType: "uat_feedback",
    entityId: feedbackId,
    metadata: { status: normalizedStatus },
  };
  await audit(auditEvent.eventType, req, {
    actor,
    entityType: auditEvent.entityType,
    entityId: auditEvent.entityId,
    metadata: auditEvent.metadata,
  });
  return { feedback, audit: auditEvent };
}

async function updateUatFeedbackOwner(req, actor, feedbackId, ownerUserId) {
  const normalizedOwnerUserId = textValue(ownerUserId, 64) || null;
  const owner = normalizedOwnerUserId ? await findUserById(normalizedOwnerUserId) : null;
  if (normalizedOwnerUserId && !owner) {
    const error = new Error("Owner not found");
    error.status = 404;
    throw error;
  }
  if (owner && !["admin", "omLeader"].includes(owner.role)) {
    const error = new Error("Feedback owner must be Admin or OM Leader");
    error.status = 400;
    throw error;
  }
  let feedback;
  if (pool) {
    const [result] = await pool.execute("UPDATE uat_feedback SET owner_user_id = ?, updated_at = NOW() WHERE id = ?", [normalizedOwnerUserId, feedbackId]);
    if (!result.affectedRows) {
      const error = new Error("Feedback not found");
      error.status = 404;
      throw error;
    }
    const [rows] = await pool.execute(
      `SELECT f.*, submitter.name AS submitted_by_name, owner.name AS owner_name
       FROM uat_feedback f
       LEFT JOIN users submitter ON submitter.id = f.submitted_by_user_id
       LEFT JOIN users owner ON owner.id = f.owner_user_id
       WHERE f.id = ? LIMIT 1`,
      [feedbackId],
    );
    feedback = feedbackFromRow(rows[0]);
  } else {
    feedback = memoryStore.uatFeedback.get(feedbackId);
    if (!feedback) {
      const error = new Error("Feedback not found");
      error.status = 404;
      throw error;
    }
    feedback.ownerUserId = normalizedOwnerUserId;
    feedback.ownerName = owner?.name || "";
    feedback.updatedAt = new Date().toISOString();
    memoryStore.uatFeedback.set(feedbackId, feedback);
  }
  const auditEvent = {
    eventType: "uat_feedback.owner_updated",
    actorUserId: actor.id,
    entityType: "uat_feedback",
    entityId: feedbackId,
    metadata: { ownerUserId: normalizedOwnerUserId },
  };
  await audit(auditEvent.eventType, req, {
    actor,
    entityType: auditEvent.entityType,
    entityId: auditEvent.entityId,
    metadata: auditEvent.metadata,
  });
  return { feedback, audit: auditEvent };
}

async function requireAuth(req, res) {
  const user = await currentUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Not authenticated" });
    return null;
  }
  return user;
}

function cookieHeader(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

function clearCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, db: pool ? "mysql" : "memory-fallback" });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readBody(req);
      const requestedRole = String(body.role || body.loginRole || "").trim();
      const identifier = testLoginRoleIdentifiers[requestedRole] || body.identifier || body.account || body.employeeId || body.employee_id || body.email;
      const user = await findUserByIdentifier(identifier);
      if (!user || !verifyPassword(String(body.password || ""), user.password_hash)) {
        await audit("auth.login_failed", req, { metadata: { identifier: identifier || "", requestedRole } });
        sendJson(res, 401, { error: "Invalid account or password" });
        return;
      }
      const token = await createSession(req, user);
      sendJson(res, 200, { user: publicUser(user) }, { "Set-Cookie": cookieHeader(token) });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/logout") {
      await logout(req);
      sendJson(res, 200, { ok: true }, { "Set-Cookie": clearCookieHeader() });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/me") {
      const user = await requireAuth(req, res);
      if (!user) return;
      sendJson(res, 200, { user: publicUser(user) });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/attachments") {
      const user = await requireAuth(req, res);
      if (!user) return;
      const attachment = await createAttachment(req, user);
      sendJson(res, 201, { attachment });
      return;
    }
    const attachmentMatch = url.pathname.match(/^\/api\/attachments\/([^/]+)$/);
    if (req.method === "GET" && attachmentMatch) {
      const user = await requireAuth(req, res);
      if (!user) return;
      await sendAttachmentDownload(req, res, user, decodeURIComponent(attachmentMatch[1]));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/uat-feedback") {
      const user = await requireAuth(req, res);
      if (!user) return;
      const feedback = await createUatFeedback(req, user, await readBody(req));
      sendJson(res, 201, { feedback });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/uat-feedback/my") {
      const user = await requireAuth(req, res);
      if (!user) return;
      sendJson(res, 200, { feedback: await getOwnUatFeedback(user) });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/uat-feedback") {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!canTriageUatFeedback(user)) {
        await audit("uat_feedback.list_blocked", req, { actor: user, entityType: "uat_feedback" });
        sendJson(res, 403, { error: "Only OM Leader or Admin can view all UAT feedback" });
        return;
      }
      sendJson(res, 200, { feedback: await getAllUatFeedback() });
      return;
    }
    const feedbackStatusMatch = url.pathname.match(/^\/api\/uat-feedback\/([^/]+)\/status$/);
    if (req.method === "PATCH" && feedbackStatusMatch) {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!canTriageUatFeedback(user)) {
        await audit("uat_feedback.status_blocked", req, { actor: user, entityType: "uat_feedback", entityId: feedbackStatusMatch[1] });
        sendJson(res, 403, { error: "Only OM Leader or Admin can update UAT feedback status" });
        return;
      }
      const result = await updateUatFeedbackStatus(req, user, decodeURIComponent(feedbackStatusMatch[1]), (await readBody(req)).status);
      sendJson(res, 200, result);
      return;
    }
    const feedbackOwnerMatch = url.pathname.match(/^\/api\/uat-feedback\/([^/]+)\/owner$/);
    if (req.method === "PATCH" && feedbackOwnerMatch) {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!canTriageUatFeedback(user)) {
        await audit("uat_feedback.owner_blocked", req, { actor: user, entityType: "uat_feedback", entityId: feedbackOwnerMatch[1] });
        sendJson(res, 403, { error: "Only OM Leader or Admin can update UAT feedback owner" });
        return;
      }
      const body = await readBody(req);
      const result = await updateUatFeedbackOwner(req, user, decodeURIComponent(feedbackOwnerMatch[1]), body.ownerUserId || body.owner_user_id || "");
      sendJson(res, 200, result);
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/om/assignees") {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!canViewOm(user)) {
        sendJson(res, 403, { error: "OM role required" });
        return;
      }
      sendJson(res, 200, { assignees: await omAssignees() });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/om/assignments") {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!canViewOm(user)) {
        sendJson(res, 403, { error: "OM role required" });
        return;
      }
      sendJson(res, 200, { assignments: await omAssignments() });
      return;
    }
    const assignmentMatch = url.pathname.match(/^\/api\/om\/requests\/([^/]+)\/assign$/);
    if (req.method === "POST" && assignmentMatch) {
      const user = await requireAuth(req, res);
      if (!user) return;
      if (!canAssignOm(user)) {
        await audit("om.assignment_blocked", req, { actor: user, entityType: "request", entityId: assignmentMatch[1] });
        sendJson(res, 403, { error: "Only OM Leader or Admin can assign OM rows" });
        return;
      }
      const body = await readBody(req);
      const assignment = await setOmAssignment(req, user, decodeURIComponent(assignmentMatch[1]), body.assignedToUserId || "", body.note || "");
      sendJson(res, 200, { assignment });
      return;
    }
    sendJson(res, 404, { error: "API route not found" });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Server error" });
  }
}

function serveStatic(req, res, url) {
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(ROOT, requested));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".svg": "image/svg+xml",
    };
    const cacheHeaders = [".html", ".js", ".css"].includes(ext)
      ? { "Cache-Control": "no-store, no-cache, must-revalidate" }
      : {};
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", ...cacheHeaders });
    res.end(data);
  });
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Procurement prototype server listening at http://localhost:${PORT}`);
  });
}

module.exports = { createServer, memoryStore, publicUser };
