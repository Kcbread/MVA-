const path = require("node:path");
const { jsonValue } = require('./values');

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

module.exports = { sanitizeOriginalFileName, storedFileExtension, uploadDateFolder, attachmentFromRow };
