const path = require("node:path");
const fs = require("node:fs");

function createStaticAssets({ WORKSPACE_PREVIEW_PREFIX, PUBLIC_ROOT_FILES, ROOT }) {
  function decodePathname(pathname) {
    try {
      return decodeURIComponent(pathname);
    } catch {
      return "";
    }
  }
  
  function publicAssetPath(pathname) {
    const decoded = decodePathname(pathname);
    if (!decoded) return null;
    let normalized = path.posix.normalize(decoded === "/" ? "/index.html" : decoded);
    if (!normalized.startsWith("/") || normalized.includes("\0")) return null;
    if (normalized === WORKSPACE_PREVIEW_PREFIX) {
      normalized = "/index.html";
    } else if (normalized.startsWith(`${WORKSPACE_PREVIEW_PREFIX}/`)) {
      const withoutPreviewPrefix = normalized.slice(WORKSPACE_PREVIEW_PREFIX.length);
      normalized = path.posix.normalize(withoutPreviewPrefix === "/" ? "/index.html" : withoutPreviewPrefix);
    }
    if (PUBLIC_ROOT_FILES.has(normalized)) return normalized;
    if (normalized.startsWith("/app-modules/") && path.posix.extname(normalized) === ".js") return normalized;
    return null;
  }
  
  function serveStatic(req, res, url) {
    const requested = publicAssetPath(url.pathname);
    if (!requested) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const filePath = path.normalize(path.join(ROOT, requested));
    if (!filePath.startsWith(ROOT + path.sep)) {
      res.writeHead(404);
      res.end("Not found");
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
  return { decodePathname, publicAssetPath, serveStatic };
}

module.exports = { createStaticAssets };
