

function createHttpBody({ MAX_UPLOAD_BYTES }) {
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
  return { parseCookies, sendJson, readRequestBuffer, splitBuffer, parseDispositionAttributes, readMultipart, readBody };
}

module.exports = { createHttpBody };
