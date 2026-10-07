const crypto = require("node:crypto");

const OMITTED_USER_FIELDS = new Set(["password_hash"]);

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  if (!user) return null;
  return Object.fromEntries(Object.entries(user).filter(([key]) => !OMITTED_USER_FIELDS.has(key)));
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  if (passwordHash.startsWith("plain:")) return password === passwordHash.slice(6);
  if (passwordHash.startsWith("sha256:")) return hashToken(password) === passwordHash.slice(7);
  return false;
}

module.exports = { OMITTED_USER_FIELDS, hashToken, publicUser, verifyPassword };
