

function createAttachmentRepository({ pool }) {
  async function queryFindAttachment(attachmentId) {
    return pool.execute("SELECT * FROM attachments WHERE id = ? LIMIT 1", [attachmentId]);
  }
  
  async function queryCreateAttachment(attachment) {
    return pool.execute(
          `INSERT INTO attachments
           (id, linked_entity_type, linked_entity_id, attachment_kind, original_file_name, stored_file_name, storage_path, mime_type, file_size, uploaded_by_user_id, uploaded_by_role, visibility_scope, metadata_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            attachment.id,
            attachment.linkedEntityType,
            attachment.linkedEntityId,
            attachment.attachmentKind,
            attachment.originalFileName,
            attachment.storedFileName,
            attachment.storagePath,
            attachment.mimeType,
            attachment.fileSize,
            attachment.uploadedByUserId,
            attachment.uploadedByRole,
            attachment.visibilityScope,
            JSON.stringify(attachment.metadata),
          ],
        );
  }
  return { queryFindAttachment, queryCreateAttachment };
}

module.exports = { createAttachmentRepository };
