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

const uatUsers = [
  { id: "om-leader-mai", employee_id: "maint5", name: "Mai", email: "maint5@fih-foxconn.com", department: "Operations", role: "omLeader", project_family: "Mixed", project_codes: "All OM", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
  { id: "om-member-giang", employee_id: "giangth1", name: "Giang", email: "giangth1@fih-foxconn.com", department: "Operations", role: "omMember", project_family: "Mixed", project_codes: "Assigned OM rows", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
  { id: "om-member-linh", employee_id: "linhnp", name: "Linh", email: "linhnp@fih-foxconn.com", department: "Operations", role: "omMember", project_family: "Mixed", project_codes: "Assigned OM rows", responsibility_department: "OM Purchasing", password_hash: "plain:123", is_active: 1 },
  { id: "admin-default", employee_id: "admin", name: "Admin", email: "admin@fih-foxconn.com", department: "IT", role: "admin", project_family: "Mixed", project_codes: "All", responsibility_department: "System Admin", password_hash: "plain:123", is_active: 1 },
  { id: "manager-b", employee_id: "manager-b", name: "Manager B", email: "manager-b@fih-foxconn.com", department: "MFG", role: "manager", project_family: "Mixed", project_codes: "All review scope", responsibility_department: "Manager B", password_hash: "plain:123", is_active: 1 },
  { id: "requester-v1524505", employee_id: "V1524505", name: "To Thi Phuong Anh", email: "anhttp@fih-foxconn.com", department: "MFG", role: "requester", project_family: "G", project_codes: "P26 Demo Line,P26,P27", responsibility_department: "MFG", password_hash: "plain:123", is_active: 1 },
  { id: "requester-v1547168", employee_id: "V1547168", name: "Dang Thi Ban", email: "bandt1@fih-foxconn.com", department: "MFG", role: "requester", project_family: "Non-G", project_codes: "LD8,MH2,BM2,SSF,ML2,MA4", responsibility_department: "MFG", password_hash: "plain:123", is_active: 1 },
  { id: "dept-dri-default", employee_id: "dept-dri", name: "Dept DRI", email: "dept-dri@fih-foxconn.com", department: "MFG", role: "dri", project_family: "Mixed", project_codes: "Escalation scope", responsibility_department: "Dept DRI", password_hash: "plain:123", is_active: 1 },
  { id: "budget-approver-default", employee_id: "budget-approver", name: "Budget Approver", email: "budget-approver@fih-foxconn.com", department: "PMO", role: "projectDri", project_family: "Mixed", project_codes: "Budget approval scope", responsibility_department: "Budget Approver", password_hash: "plain:123", is_active: 1 },
];

const memoryStore = {
  users: new Map(uatUsers.flatMap((user) => [
    [String(user.email || "").toLowerCase(), { ...user }],
    [String(user.employee_id || "").toLowerCase(), { ...user }],
    [String(user.id || "").toLowerCase(), { ...user }],
  ].filter(([key]) => key))),
  usersById: new Map(uatUsers.map((user) => [user.id, { ...user }])),
  sessions: new Map(),
  assignments: new Map(),
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
      const identifier = body.identifier || body.account || body.employeeId || body.employee_id || body.email;
      const user = await findUserByIdentifier(identifier);
      if (!user || !verifyPassword(String(body.password || ""), user.password_hash)) {
        await audit("auth.login_failed", req, { metadata: { identifier: identifier || "" } });
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
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
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
