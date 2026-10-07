const { publicUser } = require('./user-model');
const { roleKeyFromAppRole } = require('./permissions');

function createUserRepository({ memoryStore, pool }) {
  function appRoleFromRoleKey(roleKey) {
    return memoryStore.roles.find((role) => role.role_key === roleKey)?.app_role || roleKey || "";
  }
  
  function listUsersMemory() {
    return Array.from(memoryStore.usersById.values())
      .map((user) => ({
        ...publicUser(user),
        role_key: roleKeyFromAppRole(user.role),
        role_name: memoryStore.roles.find((role) => role.app_role === user.role || role.role_key === roleKeyFromAppRole(user.role))?.role_name || user.role,
      }))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }
  
  function replaceMemoryUser(user) {
    const next = { ...user };
    memoryStore.usersById.set(next.id, next);
    [next.email, next.employee_id, next.id].forEach((key) => {
      if (key) memoryStore.users.set(String(key).toLowerCase(), next);
    });
    return next;
  }
  
  function removeUserLookupKeys(user = {}) {
    [user.email, user.employee_id, user.id].forEach((key) => {
      if (key) memoryStore.users.delete(String(key).toLowerCase());
    });
  }
  
  function duplicateUser(user, { employee_id, email, id }, ignoreId = "") {
    return user && user.id !== ignoreId && (
      String(user.employee_id || "").toLowerCase() === String(employee_id || "").toLowerCase()
      || String(user.email || "").toLowerCase() === String(email || "").toLowerCase()
      || String(user.id || "").toLowerCase() === String(id || "").toLowerCase()
    );
  }
  
  function findDuplicateUser({ employee_id, email, id }, ignoreId = "") {
    return listUsersMemory().find((user) => duplicateUser(user, { employee_id, email, id }, ignoreId)) || null;
  }
  
  async function updateLastLoginAt(userId) {
    const current = memoryStore.usersById.get(userId);
    if (!current) return;
    replaceMemoryUser({ ...current, last_login_at: new Date().toISOString() });
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
    const user = memoryStore.users.get(normalized) || null;
    return user?.is_active ? user : null;
  }
  
  async function findUserById(id) {
    if (!id) return null;
    if (pool) {
      const [rows] = await pool.execute("SELECT * FROM users WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
      return rows[0] || null;
    }
    const user = memoryStore.usersById.get(id) || null;
    return user?.is_active ? user : null;
  }
  return { appRoleFromRoleKey, listUsersMemory, replaceMemoryUser, removeUserLookupKeys, duplicateUser, findDuplicateUser, updateLastLoginAt, findUserByIdentifier, findUserById };
}

module.exports = { createUserRepository };
