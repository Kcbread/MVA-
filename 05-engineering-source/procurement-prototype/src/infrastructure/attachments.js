// infrastructure/attachments: authoritative source; see docs/module-map.md.
import {
  apiModeEnabled
} from "./api.js";
import {
  htmlAttr,
  htmlText
} from "../shared/html.js";

// @legacy-unit 411 2243
export async function uploadAttachment(file, fields = {}) {
  if (!file || !apiModeEnabled()) return null;
  const formData = new FormData();
  formData.append("file", file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  });
  const response = await fetch("/api/attachments", {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || `Attachment upload failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload.attachment || null;
}
// @end-legacy-unit 411

// @legacy-unit 412 2270
export function attachmentDownloadUrl(attachmentId, explicitUrl = "") {
  return explicitUrl || (attachmentId ? `/api/attachments/${encodeURIComponent(attachmentId)}` : "");
}
// @end-legacy-unit 412

// @legacy-unit 413 2274
export function attachmentLinkHtml(fileName, attachmentId, explicitUrl = "", { allowDownload = true } = {}) {
  if (!fileName) return "";
  const url = attachmentDownloadUrl(attachmentId, explicitUrl);
  if (!allowDownload || !url || !apiModeEnabled()) return htmlText(fileName);
  return `<a href="${htmlAttr(url)}" target="_blank" rel="noopener">${htmlText(fileName)}</a>`;
}
// @end-legacy-unit 413
