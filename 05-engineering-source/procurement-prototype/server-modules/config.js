const fs = require('node:fs');
const path = require('node:path');
function loadConfig(ROOT) {
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
  
  const UPLOAD_ROOT = process.env.UPLOAD_ROOT || path.join(path.dirname(ROOT), "uploads");
  
  const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 25 * 1024 * 1024);
  
  const WORKSPACE_PREVIEW_PREFIX = "/05-engineering-source/procurement-prototype";
  
  const PUBLIC_ROOT_FILES = new Set([
    "/index.html",
    "/app.js",
    "/dist/app.bundle.js",
    "/styles.css",
    "/layout-contract.css",
    "/layout-contract.js",
    "/carryover-extension.css",
    "/carryover-extension.js",
    "/real-data-seeds.js",
    "/requester-responsibility-data.js",
    "/user-a-flow.js",
  ]);
  return { ROOT, PORT, SESSION_COOKIE, SESSION_TTL_MS, UPLOAD_ROOT, MAX_UPLOAD_BYTES, WORKSPACE_PREVIEW_PREFIX, PUBLIC_ROOT_FILES };
}
module.exports = { loadConfig };
