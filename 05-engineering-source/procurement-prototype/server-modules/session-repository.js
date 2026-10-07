

function createSessionRepository({ pool }) {
  async function queryRevokeSessionsForUser(userId) {
    return pool.execute("UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [userId]);
  }
  
  async function queryCreateSession(session, req) {
    return pool.execute(
        "INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)",
        [session.id, session.user_id, session.token_hash, req.socket.remoteAddress || "", req.headers["user-agent"] || "", session.expires_at],
      );
  }
  
  async function queryCurrentUser(tokenHash) {
    return pool.execute(
        "SELECT s.id AS session_id, s.user_id, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW() AND u.is_active = 1 LIMIT 1",
        [tokenHash],
      );
  }
  
  async function queryLogout(tokenHash) {
    return pool.execute("UPDATE sessions SET revoked_at = NOW() WHERE token_hash = ?", [tokenHash]);
  }
  return { queryRevokeSessionsForUser, queryCreateSession, queryCurrentUser, queryLogout };
}

module.exports = { createSessionRepository };
