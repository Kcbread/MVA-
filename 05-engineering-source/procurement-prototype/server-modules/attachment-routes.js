

function createAttachmentRoutes({ requireAuth, createAttachment, sendJson, sendAttachmentDownload }) {
  async function handleAttachmentRoutes(req, res, url) {
    if (req.method === "POST" && url.pathname === "/api/attachments") {
      const user = await requireAuth(req, res);
      if (!user) return true;
      const attachment = await createAttachment(req, user);
      sendJson(res, 201, { attachment });
      return true;
    }
    const attachmentMatch = url.pathname.match(/^\/api\/attachments\/([^/]+)$/);
    if (req.method === "GET" && attachmentMatch) {
      const user = await requireAuth(req, res);
      if (!user) return true;
      await sendAttachmentDownload(req, res, user, decodeURIComponent(attachmentMatch[1]));
      return true;
    }
  return false;
  }
  return { handleAttachmentRoutes };
}

module.exports = { createAttachmentRoutes };
