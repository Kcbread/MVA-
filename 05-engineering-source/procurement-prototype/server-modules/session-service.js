const crypto = require("node:crypto");
const { hashToken } = require('./user-model');

function createSessionService({ pool, queryRevokeSessionsForUser, memoryStore, SESSION_TTL_MS, queryCreateSession, updateLastLoginAt, audit, parseCookies, SESSION_COOKIE, queryCurrentUser, findUserById, queryLogout, sendJson }) {
  async function revokeSessionsForUser(userId) {
    if (!userId) return;
    if (pool) {
      await queryRevokeSessionsForUser(userId);
      return;
    }
    Array.from(memoryStore.sessions.entries()).forEach(([tokenHash, session]) => {
      if (session.user_id === userId) memoryStore.sessions.delete(tokenHash);
    });
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
      await queryCreateSession(session, req);
    } else {
      memoryStore.sessions.set(tokenHash, session);
    }
    await updateLastLoginAt(user.id);
    await audit("auth.login", req, { actor: user, entityType: "session", entityId: session.id });
    return token;
  }
  
  async function currentUser(req) {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (!token) return null;
    const tokenHash = hashToken(token);
    if (pool) {
      const [rows] = await queryCurrentUser(tokenHash);
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
    if (pool) await queryLogout(tokenHash);
    else memoryStore.sessions.delete(tokenHash);
    await audit("auth.logout", req, { actor, entityType: "session", entityId: tokenHash.slice(0, 12) });
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
  return { revokeSessionsForUser, createSession, currentUser, logout, requireAuth, cookieHeader, clearCookieHeader };
}

module.exports = { createSessionService };
