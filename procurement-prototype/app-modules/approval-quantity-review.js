(function registerApprovalQuantityReviewModule(root) {
  const DEFAULT_UNITS = ["MFG", "FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];

  function esc(value = "") {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function qtyText(value = 0) {
    const qty = Number(value || 0);
    return qty ? String(qty) : "";
  }

  function unitCell(value = 0, attrs = "", label = "", amountText = "") {
    const text = qtyText(value);
    if (!text) return `<span class="muted-cell">-</span>`;
    return attrs
      ? `<button type="button" class="approval-item-unit-matrix-cell-btn" ${attrs} title="${esc(label || `${text} qty`)}"><strong>${esc(text)}</strong><span>${amountText ? esc(amountText) : "qty"}</span></button>`
      : `<span class="approval-item-unit-matrix-cell-value" title="${esc(label || `${text} qty`)}"><strong>${esc(text)}</strong><span>${amountText ? esc(amountText) : "qty"}</span></span>`;
  }

  function pipelineMeta(row = {}) {
    const pipeline = row.pipeline || {};
    const tone = pipeline.tone || "pending";
    const title = [
      pipeline.decisionStatus ? `Status: ${pipeline.decisionStatus}` : "",
      pipeline.blockedAtOwner ? `Current Owner: ${pipeline.blockedAtOwner}` : "",
      pipeline.lastUpdatedAt ? `Since: ${pipeline.lastUpdatedAt}` : "",
      pipeline.nextStep ? `Next: ${pipeline.nextStep}` : "",
      pipeline.poStatus ? `PO: ${pipeline.poStatus}` : "",
    ].filter(Boolean).join(" / ");
    return {
      tone,
      className: `approval-pipeline-${tone}`,
      status: pipeline.decisionStatus || "Pending",
      owner: pipeline.blockedAtOwner || "",
      title,
    };
  }

  function renderViewTabs({ activeTab = "dashboard", label = "Approval quantity review" } = {}) {
    const tabs = [
      ["dashboard", "Dashboard"],
      ["mfg", "MFG Station Detail"],
      ["nonMfg", "Non-MFG Department Detail"],
    ];
    return `
      <div class="approval-quantity-view-tabs" role="tablist" aria-label="${label}">
        ${tabs.map(([id, text]) => `
          <button class="inner-tab ${activeTab === id ? "active" : ""}" type="button" data-approval-quantity-tab="${id}" role="tab" aria-selected="${activeTab === id ? "true" : "false"}">${text}</button>
        `).join("")}
      </div>`;
  }

  function renderRowPicker({
    rows = [],
    selectedId = "",
    selectAttr = "",
    title = "Review Rows",
    helper = "Select a row to scope MFG, Non-MFG, and Dashboard review.",
    emptyText = "No rows are waiting for review.",
    itemHtml = () => "",
    metaHtml = () => "",
    actionHtml = () => "",
  } = {}) {
    if (!rows.length) return `<div class="empty-state approval-quantity-empty">${emptyText}</div>`;
    const selected = rows.find((row) => row.id === selectedId) || rows[0];
    return `
      <section class="approval-quantity-row-picker" aria-label="${title}">
        <div class="approval-quantity-row-picker-head">
          <div>
            <h4>${title}</h4>
            <p>${helper}</p>
          </div>
          <span class="record-count">${rows.length} row${rows.length === 1 ? "" : "s"}</span>
        </div>
        <div class="approval-quantity-row-list" role="listbox" aria-label="${title}">
          ${rows.map((row) => `
            <button class="approval-quantity-row-chip ${row.id === selected.id ? "active" : ""}" type="button" ${selectAttr ? `${selectAttr}="${row.id}"` : ""} aria-selected="${row.id === selected.id ? "true" : "false"}">
              ${itemHtml(row)}
              <span class="approval-quantity-chip-action">Switch</span>
            </button>
          `).join("")}
        </div>
        <div class="approval-quantity-row-context">
          <div class="approval-quantity-row-context-main">${metaHtml(selected)}</div>
          <div class="approval-quantity-row-actions">${actionHtml(selected)}</div>
        </div>
      </section>`;
  }

  function renderDashboardParts({
    rows = [],
    selectedId = "",
    units = DEFAULT_UNITS,
    currency = "VND",
    formatMoney = null,
    formatCompactCurrency = null,
    emptyText = "No review rows are available for this project dashboard.",
  } = {}) {
    const tableWidth = 760 + (units.length * 112) + 196;
    const formatFull = typeof formatMoney === "function"
      ? formatMoney
      : (value) => value ? `${Number(value).toFixed(2)} USD` : "-";
    const formatCompact = typeof formatCompactCurrency === "function"
      ? formatCompactCurrency
      : (value) => value ? `${Number(value).toFixed(2)} USD` : "-";
    const visibleRows = Array.isArray(rows) ? rows : [];
    const totalQty = visibleRows.reduce((sum, row) => sum + Number(row.totalQty || 0), 0);
    const totalAmountUsd = visibleRows.reduce((sum, row) => sum + Number(row.totalAmountUsd || 0), 0);
    const activeProject = visibleRows.find((row) => row.project)?.project || "";
    if (!visibleRows.length) {
      return {
        tableWidth,
        summaryHtml: `<div class="decision-explain-strip"><div><strong>Dashboard</strong><span>${esc(emptyText)}</span></div></div>`,
        colgroup: `
          <col class="demand-cost-col-request">
          <col class="demand-cost-col-eng">
          <col class="demand-cost-col-cn">
          <col class="demand-cost-col-price">
          ${units.map(() => `<col class="demand-cost-col-unit">`).join("")}
          <col class="demand-cost-col-total">
          <col class="demand-cost-col-action">`,
        head: `
          <tr>
            <th>Request ID</th>
            <th>Item</th>
            <th>Spec</th>
            <th>Price</th>
            ${units.map((unit) => `<th class="demand-cost-unit-head">${esc(unit)}</th>`).join("")}
            <th class="demand-cost-total-head shared-total-highlight shared-total-highlight--head">Total</th>
            <th>Detail</th>
          </tr>`,
        rows: `<tr><td colspan="${units.length + 6}" class="empty-cell">${esc(emptyText)}</td></tr>`,
      };
    }
    return {
      tableWidth,
      summaryHtml: `
        <div class="demand-cost-summary-head shared-total-highlight shared-total-highlight--band">
          <strong>Dashboard</strong>
          <span>${esc(activeProject || "Active project")} / ${visibleRows.length} item${visibleRows.length === 1 ? "" : "s"} / ${esc(currency)} view</span>
          <span class="quantity-dashboard-legend">Single project all-items MFG / Non-MFG dashboard. Click MFG or a Non-MFG department to open detail.</span>
          <span class="quantity-dashboard-legend">Total ${esc(qtyText(totalQty) || "0")} qty${totalAmountUsd ? ` / ${esc(formatCompact(totalAmountUsd))}` : ""}</span>
        </div>`,
      colgroup: `
        <col class="demand-cost-col-request">
        <col class="demand-cost-col-eng">
        <col class="demand-cost-col-cn">
        <col class="demand-cost-col-price">
        ${units.map(() => `<col class="demand-cost-col-unit">`).join("")}
        <col class="demand-cost-col-total">
        <col class="demand-cost-col-action">`,
      head: `
        <tr>
          <th>Request ID</th>
          <th>Item</th>
          <th>Spec</th>
          <th>Price</th>
          ${units.map((unit) => `<th class="demand-cost-unit-head">${esc(unit)}</th>`).join("")}
          <th class="demand-cost-total-head shared-total-highlight shared-total-highlight--head">Total</th>
          <th>Detail</th>
        </tr>`,
      rows: visibleRows.map((row) => {
        const requestId = row.requestId || row.id || "";
        const pipeline = pipelineMeta(row);
        const rowAttrs = `data-price-review-select-row="${esc(requestId)}" data-approval-dashboard-request-id="${esc(requestId)}" data-approval-dashboard-project="${esc(row.project || "")}" data-approval-dashboard-item="${esc(row.item || "")}" data-approval-pipeline-status="${esc(pipeline.tone)}" title="${esc(pipeline.title)}"`;
        const totalAmount = Number(row.totalAmountUsd || 0);
        return `
          <tr class="${requestId === selectedId ? "active-row" : ""} ${pipeline.className}" ${rowAttrs}>
            <td class="cell-identity" title="${esc(requestId || "-")}"><strong>${esc(requestId || "-")}</strong><div class="reason-text">${esc(row.project || "-")}</div></td>
            <td class="cell-identity" title="${esc(row.item || "-")}">
              <button type="button" class="approval-dashboard-item-button" data-price-review-select-cell="${esc(requestId)}" data-approval-dashboard-request-id="${esc(requestId)}" data-approval-dashboard-project="${esc(row.project || "")}" data-approval-dashboard-item="${esc(row.item || "")}">
                <strong>${esc(row.item || "-")}</strong>
                <span>${esc(row.itemMeta || row.requestMeta || "")}</span>
              </button>
            </td>
            <td class="cell-spec-summary" title="${esc(row.spec || "-")}"><div>${esc(row.spec || "-")}</div></td>
            <td class="cell-number" title="${esc(row.unitPriceUsd ? formatFull(row.unitPriceUsd) : "Price Pending")}">${row.priceHtml || esc(row.price || "Price Pending")}</td>
            ${units.map((unit) => {
              const qty = Number(row.cells?.[unit] || 0);
              const amount = row.unitPriceUsd && qty ? row.unitPriceUsd * qty : 0;
              const cellAttrs = `data-manager-demand-cost-unit="${esc(unit)}" data-manager-demand-cost-request-id="${esc(requestId)}" data-manager-demand-cost-project="${esc(row.project || "")}" data-manager-demand-cost-item="${esc(row.item || "")}" data-approval-dashboard-request-id="${esc(requestId)}" data-approval-dashboard-project="${esc(row.project || "")}" data-approval-dashboard-item="${esc(row.item || "")}" data-approval-dashboard-unit="${esc(unit)}" data-approval-pipeline-status="${esc(pipeline.tone)}"`;
              const label = `${row.item || "Item"} / ${unit} / ${qty} qty${amount ? ` / ${formatFull(amount)}` : ""}${pipeline.title ? ` / ${pipeline.title}` : ""}`;
              return `<td class="demand-cost-unit-cell approval-item-unit-matrix-number-cell ${pipeline.className}" ${cellAttrs} title="${esc(label)}">${unitCell(qty, cellAttrs, label, amount ? formatCompact(amount) : "")}</td>`;
            }).join("")}
            <td class="demand-cost-total-cell shared-total-highlight shared-total-highlight--cell ${pipeline.className}" data-approval-dashboard-request-id="${esc(requestId)}" data-approval-dashboard-project="${esc(row.project || "")}" data-approval-dashboard-item="${esc(row.item || "")}" data-approval-dashboard-unit="total" data-approval-pipeline-status="${esc(pipeline.tone)}" title="${esc(pipeline.title)}">${unitCell(row.totalQty || 0, "", `${row.item || "Item"} total${totalAmount ? ` / ${formatFull(totalAmount)}` : ""}${pipeline.title ? ` / ${pipeline.title}` : ""}`, totalAmount ? formatCompact(totalAmount) : "")}</td>
            <td class="cell-action">
              <button class="mini" type="button" title="Open quantity detail" data-item-quantity-cell="dashboard-detail" data-item-quantity-request="${esc(requestId)}" data-item-quantity-project="${esc(row.project || "")}" data-item-quantity-item="${esc(row.item || "")}">Detail</button>
            </td>
          </tr>`;
      }).join(""),
    };
  }

  function renderItemUnitMatrixParts({
    row = null,
    units = DEFAULT_UNITS,
    emptyText = "Select an item from the item switcher to load the dashboard.",
  } = {}) {
    return renderDashboardParts({
      rows: row ? [row] : [],
      selectedId: row?.id || row?.requestId || "",
      units,
      emptyText,
    });
  }

  const api = {
    renderViewTabs,
    renderRowPicker,
    renderDashboardParts,
    renderItemUnitMatrixParts,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.approvalQuantityReview = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
