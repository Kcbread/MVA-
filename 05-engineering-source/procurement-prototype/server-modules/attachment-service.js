const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs");
const { attachmentFromRow, sanitizeOriginalFileName, uploadDateFolder, storedFileExtension } = require('./attachment-model');
const { textValue, jsonValue } = require('./values');
const { canUploadAttachment, canDownloadAttachment } = require('./permissions');

function createAttachmentService({ pool, queryFindAttachment, memoryStore, readMultipart, audit, UPLOAD_ROOT, queryCreateAttachment, sendJson }) {
  async function findAttachment(attachmentId) {
    if (pool) {
      const [rows] = await queryFindAttachment(attachmentId);
      return attachmentFromRow(rows[0]);
    }
    return attachmentFromRow(memoryStore.attachments.get(attachmentId));
  }
  
  async function createAttachment(req, actor) {
    const { fields, files } = await readMultipart(req);
    const file = files.file || Object.values(files)[0];
    if (!file || !file.content?.length) {
      const error = new Error("file is required");
      error.status = 400;
      throw error;
    }
    const attachment = {
      id: crypto.randomUUID(),
      linkedEntityType: textValue(fields.linkedEntityType || fields.linked_entity_type, 80) || "unscoped",
      linkedEntityId: textValue(fields.linkedEntityId || fields.linked_entity_id, 120) || "unscoped",
      attachmentKind: textValue(fields.attachmentKind || fields.attachment_kind, 80) || "general",
      originalFileName: sanitizeOriginalFileName(file.filename),
      mimeType: textValue(file.mimeType, 120) || "application/octet-stream",
      fileSize: file.content.length,
      uploadedByUserId: actor.id,
      uploadedByRole: actor.role || "",
      visibilityScope: textValue(fields.visibilityScope || fields.visibility_scope, 80) || "om_internal",
      metadata: jsonValue(fields.metadata, {}),
      createdAt: new Date().toISOString(),
    };
    if (!canUploadAttachment(actor, attachment)) {
      await audit("attachment.upload_blocked", req, {
        actor,
        entityType: attachment.linkedEntityType,
        entityId: attachment.linkedEntityId,
        metadata: { attachmentKind: attachment.attachmentKind },
      });
      const error = new Error("Not allowed to upload this attachment");
      error.status = 403;
      throw error;
    }
    const folder = uploadDateFolder();
    const storedFileName = `${attachment.id}${storedFileExtension(attachment.originalFileName)}`;
    const targetDir = path.join(UPLOAD_ROOT, folder);
    const storagePath = path.join(targetDir, storedFileName);
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.writeFile(storagePath, file.content);
    attachment.storedFileName = storedFileName;
    attachment.storagePath = storagePath;
    try {
      if (pool) {
        await queryCreateAttachment(attachment);
      } else {
        memoryStore.attachments.set(attachment.id, attachment);
      }
    } catch (error) {
      await fs.promises.rm(storagePath, { force: true });
      throw error;
    }
    await audit("attachment.uploaded", req, {
      actor,
      entityType: attachment.linkedEntityType,
      entityId: attachment.linkedEntityId,
      metadata: {
        attachmentId: attachment.id,
        attachmentKind: attachment.attachmentKind,
        originalFileName: attachment.originalFileName,
        fileSize: attachment.fileSize,
        visibilityScope: attachment.visibilityScope,
      },
    });
    return attachmentFromRow(attachment);
  }
  
  async function sendAttachmentDownload(req, res, actor, attachmentId) {
    const attachment = await findAttachment(attachmentId);
    if (!attachment) {
      sendJson(res, 404, { error: "Attachment not found" });
      return;
    }
    if (!canDownloadAttachment(actor, attachment)) {
      await audit("attachment.download_blocked", req, {
        actor,
        entityType: attachment.linkedEntityType,
        entityId: attachment.linkedEntityId,
        metadata: { attachmentId: attachment.id },
      });
      sendJson(res, 403, { error: "Not allowed to download this attachment" });
      return;
    }
    let stat;
    try {
      stat = await fs.promises.stat(attachment.storagePath);
    } catch {
      await audit("attachment.file_missing", req, {
        actor,
        entityType: attachment.linkedEntityType,
        entityId: attachment.linkedEntityId,
        metadata: { attachmentId: attachment.id, storagePath: attachment.storagePath },
      });
      sendJson(res, 404, { error: "Attachment file missing on disk" });
      return;
    }
    await audit("attachment.downloaded", req, {
      actor,
      entityType: attachment.linkedEntityType,
      entityId: attachment.linkedEntityId,
      metadata: { attachmentId: attachment.id },
    });
    const headerFileName = sanitizeOriginalFileName(attachment.originalFileName).replace(/"/g, "");
    res.writeHead(200, {
      "Content-Type": attachment.mimeType || "application/octet-stream",
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${headerFileName}"`,
    });
    fs.createReadStream(attachment.storagePath).pipe(res);
  }
  return { findAttachment, createAttachment, sendAttachmentDownload };
}

module.exports = { createAttachmentService };
