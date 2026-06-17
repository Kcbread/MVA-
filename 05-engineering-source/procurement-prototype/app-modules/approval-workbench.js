(function registerApprovalWorkbenchModule(root) {
  function renderQueueTabs({ queues = [], activeQueue = "" } = {}) {
    return queues.map((queue) => `
      <button class="inner-tab ${queue.id === activeQueue ? "active" : ""}" type="button" data-price-review-queue="${queue.id}">
        ${queue.label}
        <span class="queue-tab-count">${queue.rows.length}</span>
      </button>`).join("");
  }

  function renderLayout({
    shellAttr = "",
    tableClass = "",
    headerHtml = "",
    bodyHtml = "",
    detailHtml = "",
    detailMode = "aside",
    emptyHtml = "",
  } = {}) {
    if (!bodyHtml && emptyHtml) return emptyHtml;
    if (detailMode === "hidden") {
      return `
        <div class="pending-work-layout pending-work-layout--table-only">
          <section class="pending-work-main pending-work-main--full">
            <div class="table-wrap table-shell pending-work-table-shell" ${shellAttr}>
              <table class="data-table workflow-table pending-work-table ${tableClass}">
                <thead>${headerHtml}</thead>
                <tbody>${bodyHtml}</tbody>
              </table>
            </div>
          </section>
        </div>`;
    }
    return `
      <div class="pending-work-layout">
        <section class="pending-work-main">
          <div class="table-wrap table-shell pending-work-table-shell" ${shellAttr}>
            <table class="data-table workflow-table pending-work-table ${tableClass}">
              <thead>${headerHtml}</thead>
              <tbody>${bodyHtml}</tbody>
            </table>
          </div>
        </section>
        <aside class="pending-work-detail">
          ${detailHtml}
        </aside>
      </div>`;
  }

  const api = {
    renderQueueTabs,
    renderLayout,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.approvalWorkbench = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
