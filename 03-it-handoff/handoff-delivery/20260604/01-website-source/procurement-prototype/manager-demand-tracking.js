(function () {
  const PHASES = ["p10", "p11", "evt", "dvt", "pvt", "mp"];
  const PHASE_LABELS = {
    p10: "P1.0",
    p11: "P1.1",
    evt: "EVT",
    dvt: "DVT",
    pvt: "PVT",
    mp: "MP"
  };
  const GROUPS = [
    { label: "Mainline", keys: ["cg", "bg", "fatp", "test", "hybrid", "auto"] },
    { label: "Packing", keys: ["eng_pack", "zombie", "laser_pico", "rework"] },
    { label: "Supporting", keys: ["repair", "wh"] }
  ];
  const STATION_LABELS = {
    cg: "CG",
    bg: "BG",
    fatp: "FATP",
    test: "Test",
    hybrid: "Hybrid",
    auto: "Auto",
    eng_pack: "ENG Pack",
    zombie: "Zombie",
    laser_pico: "Laser_pico",
    rework: "Rework",
    repair: "Repair",
    wh: "WH"
  };
  const CALC_FIELDS = [
    { key: "buffer", label: "Buffer" },
    { key: "total_demand_for_eq", label: "Total Demand" },
    { key: "stock", label: "Stock" },
    { key: "actual_need_qty", label: "Need" }
  ];
  const DEMO_ITEMS = 50;
  let currentManagerTab = "history";

  function state() {
    return window.state || globalThis.state || {};
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fmt(value) {
    return new Intl.NumberFormat("en-US").format(num(value));
  }

  function normalize(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[\s\-\/]+/g, "_");
  }

  function projectOf(row) {
    return row.project || row.projectCode || row.project_code || "-";
  }

  function itemOf(row) {
    return row.item || row.itemName || row.standardPartNameCn || row.partNameEn || row.materialName || row.detail || "-";
  }

  function detailOf(row) {
    return row.spec || row.detail || row.partNameEn || row.partNameVn || "";
  }

  function stationKey(row) {
    const key = normalize(row.station || row.stationName || row.workstation);
    return Object.prototype.hasOwnProperty.call(STATION_LABELS, key) ? key : "";
  }

  function isMfgRow(row) {
    return Boolean(stationKey(row));
  }

  function phaseQty(row, phase) {
    if (row[phase] != null) return num(row[phase]);
    if (row.phaseQtys && row.phaseQtys[phase] != null) return num(row.phaseQtys[phase]);
    return 0;
  }

  function phaseObject(row, phase) {
    return (
      (row.phaseBreakdown && row.phaseBreakdown[phase]) ||
      (row.phaseMatrix && row.phaseMatrix[phase]) ||
      (row.phaseDetail && row.phaseDetail[phase]) ||
      null
    );
  }

  function calcValue(row, phase, key) {
    const obj = phaseObject(row, phase);
    if (obj && obj[key] != null) return num(obj[key]);
    return 0;
  }

  function stationsForPhase(row, phase) {
    const obj = phaseObject(row, phase);
    const stations = {};
    if (obj) {
      Object.keys(STATION_LABELS).forEach((key) => {
        if (obj[key] != null) stations[key] = num(obj[key]);
      });
    }
    if (!Object.keys(stations).length) {
      const key = stationKey(row);
      const qty = phaseQty(row, phase);
      if (key && qty > 0) stations[key] = qty;
    }
    return stations;
  }

  function estimateAmount(row) {
    const direct = row.estimatedAmount || row.amount || row.lineAmount || row.totalAmount || row.budgetAmount;
    if (direct != null && direct !== "") return num(direct);
    const unitPrice = num(row.unitPrice || row.referencePrice || row.price || row.estimatedPrice || 120);
    const qty = PHASES.reduce((sum, phase) => sum + phaseQty(row, phase), 0);
    return unitPrice * qty;
  }

  function needToBuy(row, phase) {
    const obj = phaseObject(row, phase);
    if (obj && obj.actual_need_qty != null) return num(obj.actual_need_qty);
    return phaseQty(row, phase);
  }

  function buildDemoRows() {
    const itemNames = [
      "Torque Screwdriver",
      "ESD Wrist Strap",
      "Barcode Scanner",
      "Tool Cart",
      "Foam Insert",
      "Label Printer",
      "Monitor Arm",
      "Work Table",
      "Hand Scanner",
      "Cable Tray"
    ];
    const stationKeys = Object.keys(STATION_LABELS);
    const rows = [];
    for (let i = 0; i < DEMO_ITEMS; i += 1) {
      const item = `${itemNames[i % itemNames.length]} ${String(i + 1).padStart(2, "0")}`;
      stationKeys.forEach((station, index) => {
        const seed = i + index;
        const values = {
          p10: seed % 4 === 0 ? 0 : (seed % 3) + 1,
          p11: seed % 5 === 0 ? 0 : (seed % 4) + 1,
          evt: seed % 3 === 0 ? 0 : (seed % 2) + 1,
          dvt: seed % 4 === 1 ? 0 : (seed % 3) + 1,
          pvt: seed % 5 <= 1 ? 0 : (seed % 2) + 1,
          mp: seed % 6 <= 3 ? 0 : 1
        };
        const phaseBreakdown = {};
        PHASES.forEach((phase) => {
          const qty = values[phase];
          phaseBreakdown[phase] = {
            buffer: qty ? 1 : 0,
            total_demand_for_eq: qty ? qty + 1 : 0,
            stock: qty > 1 ? 1 : 0,
            actual_need_qty: qty
          };
          if (qty > 0) phaseBreakdown[phase][station] = qty;
        });
        rows.push({
          id: `manager-demo-${i + 1}-${index + 1}`,
          requestId: `REQ-MGR-${String(i + 1).padStart(3, "0")}`,
          project: "P26",
          item,
          detail: "Manager dashboard demo row",
          spec: `Spec ${String(i + 1).padStart(2, "0")}`,
          materialNo: `MVA-DEMO-${String(i + 1).padStart(4, "0")}`,
          status: i % 3 === 0 ? "Submitted" : i % 3 === 1 ? "In Progress" : "Approved",
          station: station,
          p10: values.p10,
          p11: values.p11,
          evt: values.evt,
          dvt: values.dvt,
          pvt: values.pvt,
          mp: values.mp,
          phaseBreakdown
        });
      });
    }
    return rows;
  }

  function sourceRows() {
    const s = state();
    const buckets = [s.requests, s.purchaseRecords, s.managerRows, s.managerDemandRows, s.submissions, buildDemoRows()];
    const rows = [];
    const seen = new Set();
    buckets.forEach((bucket) => {
      if (!Array.isArray(bucket)) return;
      bucket.forEach((row) => {
        if (!row || typeof row !== "object") return;
        if (!isMfgRow(row)) return;
        const key = row.id || row.requestId || `${projectOf(row)}::${itemOf(row)}::${row.station || ""}`;
        if (seen.has(key)) return;
        seen.add(key);
        rows.push(row);
      });
    });
    return rows;
  }

  function createGroup(project, item) {
    const phases = {};
    PHASES.forEach((phase) => {
      phases[phase] = {
        qty: 0,
        stations: Object.fromEntries(Object.keys(STATION_LABELS).map((key) => [key, 0])),
        calc: Object.fromEntries(CALC_FIELDS.map((field) => [field.key, 0]))
      };
    });
    return {
      key: `${project}::${item}`,
      project,
      item,
      detail: "",
      rows: [],
      totalQty: 0,
      totalNeedToBuy: 0,
      estimatedAmount: 0,
      statusMix: { Submitted: 0, "In Progress": 0, Approved: 0 },
      phases
    };
  }

  function groupedItems() {
    const groups = new Map();
    sourceRows().forEach((row) => {
      const project = projectOf(row);
      const item = itemOf(row);
      const key = `${project}::${item}`;
      const group = groups.get(key) || createGroup(project, item);
      group.detail = group.detail || detailOf(row);
      group.rows.push(row);
      group.estimatedAmount += estimateAmount(row);
      if (group.statusMix[row.status] != null) group.statusMix[row.status] += 1;
      PHASES.forEach((phase) => {
        const qty = phaseQty(row, phase);
        if (qty <= 0) return;
        group.totalQty += qty;
        group.totalNeedToBuy += needToBuy(row, phase);
        group.phases[phase].qty += qty;
        const stations = stationsForPhase(row, phase);
        Object.entries(stations).forEach(([station, value]) => {
          group.phases[phase].stations[station] += num(value);
        });
        CALC_FIELDS.forEach((field) => {
          group.phases[phase].calc[field.key] += calcValue(row, phase, field.key);
        });
      });
      groups.set(key, group);
    });
    return Array.from(groups.values()).sort((a, b) => a.item.localeCompare(b.item));
  }

  function ensureManagerShell() {
    const title = document.querySelector("h1");
    if (title && /Manager Approval/i.test(title.textContent || "")) title.textContent = "Manager Dashboard";
    const anyTab = document.querySelector("[data-manager-tab]");
    if (!anyTab) return;
    const tabRow = anyTab.parentElement;
    const desiredTabs = [
      ["review", "Approval Queue"],
      ["history", "Budget Overview"],
      ["setup", "Project Setup"]
    ];
    Array.from(tabRow.querySelectorAll("[data-manager-tab]")).forEach((node) => {
      const key = node.getAttribute("data-manager-tab");
      if (!desiredTabs.some(([wanted]) => wanted === key)) node.remove();
    });
    desiredTabs.forEach(([key, label]) => {
      let tab = tabRow.querySelector(`[data-manager-tab="${key}"]`);
      if (!tab) {
        tab = document.createElement("button");
        tab.className = "tab-btn";
        tab.setAttribute("data-manager-tab", key);
        tab.addEventListener("click", () => {
          currentManagerTab = key;
          activateTab(key);
        });
        tabRow.appendChild(tab);
      }
      tab.textContent = label;
    });

    const stagePanel = document.querySelector('[data-manager-panel="stage"]');
    const panelRow = stagePanel && stagePanel.parentElement;
    if (!panelRow) return;
    ["review", "history", "setup"].forEach((key) => {
      if (!panelRow.querySelector(`[data-manager-panel="${key}"]`)) {
        const panel = document.createElement("div");
        panel.className = "tab-panel";
        panel.setAttribute("data-manager-panel", key);
        panelRow.appendChild(panel);
      }
    });
    if (stagePanel) stagePanel.remove();
    const costPanel = panelRow.querySelector('[data-manager-panel="cost"]');
    if (costPanel) costPanel.remove();
    const costTab = tabRow.querySelector('[data-manager-tab="cost"]');
    if (costTab) costTab.remove();
    const stageTab = tabRow.querySelector('[data-manager-tab="stage"]');
    if (stageTab) stageTab.remove();
    if (!["review", "history", "setup"].includes(currentManagerTab)) currentManagerTab = "history";
    activateTab(currentManagerTab);
  }

  function activateTab(key) {
    document.querySelectorAll("[data-manager-tab]").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-manager-tab") === key);
    });
    document.querySelectorAll("[data-manager-panel]").forEach((panel) => {
      panel.classList.toggle("active", panel.getAttribute("data-manager-panel") === key);
    });
  }

  function projectFilterHtml(id, groups) {
    const projects = ["ALL"].concat(Array.from(new Set(groups.map((group) => group.project))).sort());
    return `
      <label class="manager-dashboard-filter">
        <span>Project</span>
        <select id="${id}">
          ${projects.map((project) => `<option value="${escapeHtml(project)}">${escapeHtml(project === "ALL" ? "All projects" : project)}</option>`).join("")}
        </select>
      </label>`;
  }

  function getSelectedProject(id, groups) {
    const current = document.getElementById(id);
    const projects = ["ALL"].concat(Array.from(new Set(groups.map((group) => group.project))).sort());
    return current && projects.includes(current.value) ? current.value : "ALL";
  }

  function groupLinesCard(group, phase) {
    const data = group.phases[phase];
    if (!data || data.qty <= 0) {
      return `<button type="button" class="phase-card phase-card--empty" onclick="window.openManagerMfgModal && window.openManagerMfgModal('${escapeHtml(group.key)}')">
        <span class="phase-card__phase">${PHASE_LABELS[phase]}</span>
        <strong class="phase-card__qty">0 pcs</strong>
        <div class="phase-card__body phase-card__body--empty"><span class="phase-card__empty">No demand</span></div>
      </button>`;
    }
    const sections = GROUPS.map((section) => {
      const chips = section.keys
        .filter((key) => data.stations[key] > 0)
        .map((key) => `<span class="phase-chip"><span class="phase-chip__name">${STATION_LABELS[key]}</span><strong class="phase-chip__value">${fmt(data.stations[key])}</strong></span>`);
      if (!chips.length) return "";
      return `<div class="phase-card__line"><span class="phase-card__label">${section.label}</span><div class="phase-card__chips">${chips.join("")}</div></div>`;
    }).filter(Boolean).join("");
    const calcChips = CALC_FIELDS
      .filter((field) => data.calc[field.key] > 0)
      .map((field) => `<span class="phase-chip phase-chip--calc"><span class="phase-chip__name">${field.label}</span><strong class="phase-chip__value">${fmt(data.calc[field.key])}</strong></span>`)
      .join("");
    return `<button type="button" class="phase-card" onclick="window.openManagerMfgModal && window.openManagerMfgModal('${escapeHtml(group.key)}')">
      <span class="phase-card__phase">${PHASE_LABELS[phase]}</span>
      <strong class="phase-card__qty">${fmt(data.qty)} pcs</strong>
      <div class="phase-card__body">
        ${sections}
        ${calcChips ? `<div class="phase-card__line phase-card__line--calc"><span class="phase-card__label">Calc</span><div class="phase-card__chips phase-card__chips--calc">${calcChips}</div></div>` : ""}
      </div>
    </button>`;
  }

  function compactBudgetCard(group, phase) {
    const data = group.phases[phase];
    if (!data || data.qty <= 0) {
      return `<div class="phase-mini-card phase-mini-card--empty">
        <span class="phase-mini-card__phase">${PHASE_LABELS[phase]}</span>
        <strong class="phase-mini-card__qty">-</strong>
      </div>`;
    }
    const chips = Object.keys(STATION_LABELS)
      .filter((key) => data.stations[key] > 0)
      .map((key) => `<span class="phase-mini-chip"><span>${STATION_LABELS[key]}</span><strong>${fmt(data.stations[key])}</strong></span>`)
      .join("");
    return `<button type="button" class="phase-mini-card" onclick="window.openManagerMfgModal && window.openManagerMfgModal('${escapeHtml(group.key)}')">
      <span class="phase-mini-card__phase">${PHASE_LABELS[phase]}</span>
      <strong class="phase-mini-card__qty">${fmt(data.qty)}</strong>
      <div class="phase-mini-card__chips">${chips}</div>
    </button>`;
  }

  function statusMixText(statusMix) {
    return ["Submitted", "In Progress", "Approved"]
      .filter((status) => statusMix[status] > 0)
      .map((status) => `${status} ${statusMix[status]}`)
      .join(" / ") || "-";
  }

  function renderApprovalQueue(groups) {
    const panel = document.querySelector('[data-manager-panel="review"]');
    if (!panel) return;
    const rows = groups.flatMap((group) => group.rows.filter((row) => row.status === "Submitted"));
    panel.innerHTML = `
      <div class="manager-dashboard-block">
        <div class="manager-dashboard-toolbar">
          <div class="manager-dashboard-count">${fmt(rows.length)} submitted requests</div>
        </div>
        <div class="manager-dashboard-table-wrap">
          <table class="manager-dashboard-table manager-dashboard-table--queue">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Project</th>
                <th>Item</th>
                <th>Affected Phases</th>
                <th>Total Qty</th>
                <th>Status</th>
                <th>Reject Reason</th>
                <th>Actions</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              ${rows.length ? rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.requestId || row.id || "-")}</td>
                  <td>${escapeHtml(projectOf(row))}</td>
                  <td><div class="manager-item-cell"><strong>${escapeHtml(itemOf(row))}</strong>${detailOf(row) ? `<span>${escapeHtml(detailOf(row))}</span>` : ""}</div></td>
                  <td><span class="phase-list-pill">${escapeHtml(PHASES.filter((phase) => phaseQty(row, phase) > 0).map((phase) => PHASE_LABELS[phase]).join(" / ") || "-")}</span></td>
                  <td>${fmt(PHASES.reduce((sum, phase) => sum + phaseQty(row, phase), 0))}</td>
                  <td><span class="status-pill status-pill--submitted">Submitted</span></td>
                  <td><input class="manager-reject-input" placeholder="Reason for reject" data-reject-reason="${escapeHtml(row.id || row.requestId || "")}"></td>
                  <td>
                    <div class="queue-actions">
                      <button type="button" class="btn btn-primary" onclick="window.managerQuickApprove && window.managerQuickApprove('${escapeHtml(row.id || row.requestId || "")}')">Approve</button>
                      <button type="button" class="btn btn-danger" onclick="window.managerQuickReject && window.managerQuickReject('${escapeHtml(row.id || row.requestId || "")}')">Reject to DRI</button>
                    </div>
                  </td>
                  <td><button type="button" class="btn btn-secondary" onclick="window.openManagerItemDetail && window.openManagerItemDetail('${escapeHtml(row.id || row.requestId || "")}')">Detail</button></td>
                </tr>
              `).join("") : `<tr><td colspan="9" class="empty-state">No submitted requests.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    bindQuickActions(rows);
  }

  function renderBudgetOverview(groups) {
    const panel = document.querySelector('[data-manager-panel="history"]');
    if (!panel) return;
    const selected = getSelectedProject("managerBudgetProjectFilter", groups);
    const filtered = groups.filter((group) => selected === "ALL" || group.project === selected);
    const summary = filtered.reduce((acc, group) => {
      acc.items += 1;
      acc.totalQty += group.totalQty;
      acc.need += group.totalNeedToBuy;
      acc.amount += group.estimatedAmount;
      return acc;
    }, { items: 0, totalQty: 0, need: 0, amount: 0 });
    panel.innerHTML = `
      <div class="manager-dashboard-block">
        <div class="manager-dashboard-toolbar">
          ${projectFilterHtml("managerBudgetProjectFilter", groups)}
        </div>
        <div class="manager-summary-grid manager-summary-grid--budget-overview">
          <div class="summary-card summary-card--hero">
            <span>Estimated Amount</span>
            <strong>$${fmt(Math.round(summary.amount))}</strong>
            <em>MFG items in submitted, in-progress, and approved flow</em>
          </div>
          <div class="summary-card"><span>Items</span><strong>${fmt(summary.items)}</strong></div>
          <div class="summary-card"><span>Total Qty</span><strong>${fmt(summary.totalQty)}</strong></div>
          <div class="summary-card"><span>Need to Buy</span><strong>${fmt(summary.need)}</strong></div>
          <div class="summary-card"><span>Included Status</span><strong>Submitted / In Progress / Approved</strong></div>
        </div>
        <div class="manager-dashboard-table-wrap">
          <table class="manager-dashboard-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Item</th>
                ${PHASES.map((phase) => `<th>${PHASE_LABELS[phase]}</th>`).join("")}
                <th>Total Qty</th>
                <th>Estimated Amount</th>
                <th>Current Status Mix</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.length ? filtered.map((group) => `
                <tr>
                  <td>${escapeHtml(group.project)}</td>
                  <td><div class="manager-item-cell"><strong>${escapeHtml(group.item)}</strong>${group.detail ? `<span>${escapeHtml(group.detail)}</span>` : ""}</div></td>
                  ${PHASES.map((phase) => `<td class="manager-phase-cell manager-phase-cell--budget">${compactBudgetCard(group, phase)}</td>`).join("")}
                  <td>${fmt(group.totalQty)}</td>
                  <td>$${fmt(Math.round(group.estimatedAmount))}</td>
                  <td><span class="status-mix-pill">${escapeHtml(statusMixText(group.statusMix))}</span></td>
                  <td><button type="button" class="btn btn-secondary" onclick="window.openManagerItemDetail && window.openManagerItemDetail('${escapeHtml(group.rows[0]?.id || group.rows[0]?.requestId || "")}')">Detail</button></td>
                </tr>
              `).join("") : `<tr><td colspan="${PHASES.length + 6}" class="empty-state">No MFG budget data.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
    const filter = panel.querySelector("#managerBudgetProjectFilter");
    if (filter) filter.addEventListener("change", render);
  }

  function ensureTrackModal() {
    let modal = document.getElementById("managerTrackModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "managerTrackModal";
    modal.className = "modal hidden";
    modal.innerHTML = `
      <div class="modal__backdrop" data-track-close></div>
      <div class="modal__dialog modal__dialog--wide">
        <div class="modal__header">
          <div>
            <h3 id="managerTrackTitle">MFG Consumption Matrix</h3>
            <p id="managerTrackSubtitle" class="modal__subtitle"></p>
          </div>
          <button type="button" class="btn btn-secondary" data-track-close>Close</button>
        </div>
        <div class="modal__content">
          <div id="managerTrackSummary" class="manager-summary-grid manager-summary-grid--compact"></div>
          <div class="manager-dashboard-table-wrap" id="managerTrackBody"></div>
        </div>
      </div>`;
    modal.addEventListener("click", (event) => {
      if (event.target && event.target.hasAttribute("data-track-close")) modal.classList.add("hidden");
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openManagerMfgModal(groupKey) {
    const group = groupedItems().find((entry) => entry.key === groupKey);
    if (!group) return;
    const modal = ensureTrackModal();
    modal.classList.remove("hidden");
    document.getElementById("managerTrackTitle").textContent = `${group.project} / ${group.item}`;
    document.getElementById("managerTrackSubtitle").textContent = "MFG station consumption across all phases";
    document.getElementById("managerTrackSummary").innerHTML = `
      <div class="summary-card"><span>Project</span><strong>${escapeHtml(group.project)}</strong></div>
      <div class="summary-card"><span>Item</span><strong>${escapeHtml(group.item)}</strong></div>
      <div class="summary-card"><span>Total Qty</span><strong>${fmt(group.totalQty)}</strong></div>
      <div class="summary-card"><span>Need to Buy</span><strong>${fmt(group.totalNeedToBuy)}</strong></div>
    `;
    const rows = [];
    GROUPS.forEach((section) => {
      section.keys.forEach((key) => rows.push({ group: section.label, label: STATION_LABELS[key], type: "station", key }));
    });
    CALC_FIELDS.forEach((field) => rows.push({ group: "Demand Calculation", label: field.label, type: "calc", key: field.key }));
    document.getElementById("managerTrackBody").innerHTML = `
      <table class="manager-dashboard-table manager-track-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Metric</th>
            ${PHASES.map((phase) => `<th>${PHASE_LABELS[phase]}</th>`).join("")}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => {
            const values = PHASES.map((phase) => row.type === "station" ? group.phases[phase].stations[row.key] : group.phases[phase].calc[row.key]);
            const total = values.reduce((sum, value) => sum + value, 0);
            return `<tr>
              <td>${escapeHtml(row.group)}</td>
              <td>${escapeHtml(row.label)}</td>
              ${values.map((value) => `<td>${value > 0 ? fmt(value) : "-"}</td>`).join("")}
              <td>${total > 0 ? fmt(total) : "-"}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>`;
  }

  function ensureDetailModal() {
    let modal = document.getElementById("managerItemDetailModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "managerItemDetailModal";
    modal.className = "modal hidden";
    modal.innerHTML = `
      <div class="modal__backdrop" data-item-close></div>
      <div class="modal__dialog">
        <div class="modal__header">
          <div>
            <h3 id="managerItemDetailTitle">Item Detail</h3>
            <p id="managerItemDetailSubtitle" class="modal__subtitle"></p>
          </div>
          <button type="button" class="btn btn-secondary" data-item-close>Close</button>
        </div>
        <div class="modal__content" id="managerItemDetailBody"></div>
      </div>`;
    modal.addEventListener("click", (event) => {
      if (event.target && event.target.hasAttribute("data-item-close")) modal.classList.add("hidden");
    });
    document.body.appendChild(modal);
    return modal;
  }

  function openManagerItemDetail(id) {
    const row = sourceRows().find((entry) => String(entry.id || entry.requestId || "") === String(id));
    if (!row) return;
    const modal = ensureDetailModal();
    modal.classList.remove("hidden");
    document.getElementById("managerItemDetailTitle").textContent = itemOf(row);
    document.getElementById("managerItemDetailSubtitle").textContent = `${projectOf(row)} / ${row.materialNo || "-"}`;
    document.getElementById("managerItemDetailBody").innerHTML = `
      <div class="manager-summary-grid manager-summary-grid--detail">
        <div class="summary-card"><span>Project</span><strong>${escapeHtml(projectOf(row))}</strong></div>
        <div class="summary-card"><span>Status</span><strong>${escapeHtml(row.status || "-")}</strong></div>
        <div class="summary-card"><span>Station</span><strong>${escapeHtml(STATION_LABELS[stationKey(row)] || "-")}</strong></div>
        <div class="summary-card"><span>Material No.</span><strong>${escapeHtml(row.materialNo || "-")}</strong></div>
      </div>
      <div class="manager-item-detail-section">
        <h4>Detail / Spec</h4>
        <p>${escapeHtml(detailOf(row) || "-")}</p>
      </div>
      <div class="manager-dashboard-table-wrap">
        <table class="manager-dashboard-table manager-track-table manager-track-table--compact">
          <thead>
            <tr>
              ${PHASES.map((phase) => `<th>${PHASE_LABELS[phase]}</th>`).join("")}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              ${PHASES.map((phase) => `<td>${phaseQty(row, phase) > 0 ? fmt(phaseQty(row, phase)) : "-"}</td>`).join("")}
              <td>${fmt(PHASES.reduce((sum, phase) => sum + phaseQty(row, phase), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  function bindQuickActions(rows) {
    const rowMap = new Map(rows.map((row) => [String(row.id || row.requestId || ""), row]));
    window.managerQuickApprove = (id) => {
      const row = rowMap.get(String(id));
      if (!row) return;
      row.status = "Approved";
      render();
    };
    window.managerQuickReject = (id) => {
      const row = rowMap.get(String(id));
      if (!row) return;
      const input = document.querySelector(`[data-reject-reason="${CSS.escape(String(id))}"]`);
      const reason = input ? String(input.value || "").trim() : "";
      if (!reason) {
        window.alert("Reject to DRI requires a reason.");
        return;
      }
      row.status = "Rejected to DRI";
      row.rejectReason = reason;
      render();
    };
  }

  function injectStyles() {
    if (document.getElementById("manager-mfg-dashboard-styles")) return;
    const style = document.createElement("style");
    style.id = "manager-mfg-dashboard-styles";
    style.textContent = `
      .manager-dashboard-block { padding:16px 0; display:flex; flex-direction:column; gap:16px; }
      .manager-dashboard-toolbar { display:flex; align-items:end; justify-content:space-between; gap:16px; }
      .manager-dashboard-filter { display:flex; flex-direction:column; gap:6px; min-width:220px; font-weight:600; color:#4d5b67; }
      .manager-dashboard-filter select { height:40px; padding:0 12px; border:1px solid #c7d6e2; border-radius:8px; background:#fff; }
      .manager-dashboard-count { color:#5f6f7a; font-weight:700; }
      .manager-summary-grid { display:grid; grid-template-columns:repeat(5, minmax(0, 1fr)); gap:12px; }
      .manager-summary-grid--compact { grid-template-columns:repeat(4, minmax(0, 1fr)); }
      .manager-summary-grid--detail { grid-template-columns:repeat(4, minmax(0, 1fr)); }
      .manager-summary-grid--budget-overview { grid-template-columns:2.1fr repeat(4, minmax(0, 1fr)); }
      .summary-card { border:1px solid #d8e2ea; border-radius:14px; padding:14px 16px; background:#f8fbfd; display:flex; flex-direction:column; gap:6px; min-height:92px; justify-content:center; }
      .summary-card span { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:#60717d; font-weight:700; }
      .summary-card strong { font-size:20px; color:#163859; line-height:1.1; }
      .summary-card em { font-style:normal; font-size:12px; line-height:1.45; color:#5e707d; }
      .summary-card--hero { background:linear-gradient(135deg, #12385c 0%, #1c5d8f 100%); border-color:#184a73; }
      .summary-card--hero span,
      .summary-card--hero em { color:rgba(255,255,255,0.78); }
      .summary-card--hero strong { color:#fff; font-size:28px; }
      .manager-dashboard-table-wrap { overflow:auto; }
      .manager-dashboard-table { width:100%; min-width:1320px; border-collapse:collapse; table-layout:fixed; }
      .manager-dashboard-table th, .manager-dashboard-table td { border:1px solid #c8d4df; padding:10px; vertical-align:top; background:#fff; }
      .manager-dashboard-table th { background:#eef4f8; font-weight:700; text-align:left; }
      .manager-dashboard-table--queue { min-width:1240px; }
      .manager-dashboard-table--queue th:nth-child(1),
      .manager-dashboard-table--queue td:nth-child(1) { width:120px; }
      .manager-dashboard-table--queue th:nth-child(2),
      .manager-dashboard-table--queue td:nth-child(2) { width:70px; }
      .manager-dashboard-table--queue th:nth-child(4),
      .manager-dashboard-table--queue td:nth-child(4) { width:145px; }
      .manager-dashboard-table--queue th:nth-child(5),
      .manager-dashboard-table--queue td:nth-child(5) { width:80px; }
      .manager-dashboard-table--queue th:nth-child(6),
      .manager-dashboard-table--queue td:nth-child(6) { width:95px; }
      .manager-dashboard-table--queue th:nth-child(7),
      .manager-dashboard-table--queue td:nth-child(7) { width:220px; }
      .manager-dashboard-table--queue th:nth-child(8),
      .manager-dashboard-table--queue td:nth-child(8) { width:210px; }
      .manager-dashboard-table--queue th:nth-child(9),
      .manager-dashboard-table--queue td:nth-child(9) { width:88px; }
      .manager-phase-cell { min-width:280px; }
      .manager-phase-cell--budget { min-width:210px; }
      .manager-item-cell { display:flex; flex-direction:column; gap:4px; }
      .manager-item-cell span { color:#667784; font-size:12px; }
      .phase-card { width:100%; min-height:248px; border:1px solid #bad6c5; border-radius:16px; background:linear-gradient(180deg,#f8fff9 0%,#f2fbf5 100%); text-align:left; padding:16px 16px 14px; display:flex; flex-direction:column; gap:10px; cursor:pointer; box-shadow:0 6px 18px rgba(16,63,37,.05); }
      .phase-card--empty { background:linear-gradient(180deg,#fbfdff 0%,#f5f9fc 100%); border-color:#c9d7e2; box-shadow:none; }
      .phase-card__phase { font-size:12px; font-weight:800; color:#5b7385; text-transform:uppercase; letter-spacing:.05em; }
      .phase-card__qty { font-size:34px; line-height:1; color:#173c62; letter-spacing:-.03em; }
      .phase-card__body { display:flex; flex-direction:column; gap:8px; }
      .phase-card__body--empty { margin-top:2px; }
      .phase-card__line { display:flex; flex-direction:column; gap:8px; padding:9px 10px; border-radius:12px; background:rgba(255,255,255,.82); border:1px solid rgba(146,181,161,.22); }
      .phase-card__label { font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#557082; font-weight:800; line-height:1; }
      .phase-card__chips { display:flex; flex-wrap:wrap; gap:6px; }
      .phase-card__chips--calc { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; }
      .phase-chip { display:inline-flex; align-items:center; gap:8px; padding:6px 8px; border-radius:999px; background:#fff; border:1px solid rgba(147,181,161,.34); min-height:30px; }
      .phase-chip--calc { justify-content:space-between; border-radius:10px; background:#f5f8fb; border-color:rgba(188,203,216,.6); }
      .phase-chip__name { font-size:12px; color:#506677; font-weight:700; line-height:1; }
      .phase-chip__value { font-size:13px; color:#173c62; line-height:1; }
      .phase-card__empty { color:#6c7d8a; font-size:13px; font-weight:600; }
      .phase-mini-card { width:100%; min-height:128px; border:1px solid #d7e3ec; border-radius:14px; background:linear-gradient(180deg,#fcfeff 0%,#f4f9fc 100%); padding:10px 10px 9px; display:flex; flex-direction:column; gap:8px; text-align:left; cursor:pointer; justify-content:flex-start; }
      .phase-mini-card--empty { cursor:default; background:#fbfdff; }
      .phase-mini-card__phase { font-size:11px; font-weight:800; color:#5b7385; text-transform:uppercase; letter-spacing:.05em; }
      .phase-mini-card__qty { font-size:24px; line-height:1; color:#173c62; }
      .phase-mini-card__chips { display:flex; flex-wrap:wrap; gap:6px; }
      .phase-mini-chip { display:inline-flex; align-items:center; gap:6px; padding:4px 7px; border-radius:999px; background:#fff; border:1px solid #d8e2ea; color:#41596c; font-size:11px; line-height:1; }
      .phase-mini-chip strong { color:#173c62; font-size:12px; }
      .manager-reject-input { width:100%; min-width:180px; height:36px; padding:0 10px; border:1px solid #c7d6e2; border-radius:8px; }
      .queue-actions { display:flex; gap:8px; flex-wrap:wrap; }
      .status-pill { display:inline-flex; align-items:center; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; }
      .status-pill--submitted { background:#ffe9b0; color:#8a5a00; }
      .status-mix-pill { display:inline-flex; align-items:center; padding:8px 10px; border-radius:12px; background:#f3f8fc; border:1px solid #d8e2ea; color:#36536f; font-size:12px; font-weight:700; line-height:1.5; }
      .phase-list-pill { display:inline-flex; align-items:center; padding:7px 10px; border-radius:12px; background:#f4f8fb; border:1px solid #d7e2ea; color:#36536f; font-size:12px; font-weight:700; line-height:1.45; }
      .btn { border:1px solid #b9cad8; background:#fff; color:#244360; border-radius:8px; height:36px; padding:0 14px; font-weight:700; cursor:pointer; }
      .btn-primary { background:#1f7bc0; color:#fff; border-color:#1f7bc0; }
      .btn-danger { background:#c84343; color:#fff; border-color:#c84343; }
      .empty-state { text-align:center; color:#6f7f8a; padding:18px; }
      .modal.hidden { display:none; }
      .modal { position:fixed; inset:0; z-index:1000; }
      .modal__backdrop { position:absolute; inset:0; background:rgba(13,25,38,.38); }
      .modal__dialog { position:relative; margin:40px auto; max-width:920px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,.18); }
      .modal__dialog--wide { max-width:1220px; }
      .modal__header { display:flex; justify-content:space-between; align-items:start; gap:24px; padding:20px 24px; border-bottom:1px solid #d7e2ea; }
      .modal__subtitle { margin:6px 0 0; color:#657683; }
      .modal__content { padding:20px 24px 24px; display:flex; flex-direction:column; gap:18px; max-height:80vh; overflow:auto; }
      .manager-track-table { min-width:1100px; }
      .manager-track-table--compact { min-width:680px; }
      .manager-item-detail-section { display:flex; flex-direction:column; gap:10px; }
      .manager-item-detail-section h4 { margin:0; font-size:15px; color:#23415c; }
      .manager-item-detail-section p { margin:0; color:#435867; line-height:1.6; }
    `;
    style.textContent += `
      .manager-summary-grid { align-items:stretch; }
      .manager-summary-grid--budget-overview { grid-template-columns:2.1fr repeat(4, minmax(0, 1fr)); }
      .manager-summary-grid--budget-overview .summary-card { min-height:104px; gap:8px; }
      .manager-summary-grid--budget-overview .summary-card--hero strong { font-size:28px; }
      .manager-summary-grid--budget-overview .summary-card--hero em { max-width:32ch; }
      .manager-dashboard-table thead th { position:sticky; top:0; z-index:1; color:#29445d; }
      .manager-dashboard-table tbody tr:nth-child(even) td { background:#fcfdff; }
      .manager-dashboard-table--queue { min-width:1180px; }
      .manager-dashboard-table--queue th:nth-child(1),
      .manager-dashboard-table--queue td:nth-child(1) { width:108px; }
      .manager-dashboard-table--queue th:nth-child(2),
      .manager-dashboard-table--queue td:nth-child(2) { width:64px; }
      .manager-dashboard-table--queue th:nth-child(3),
      .manager-dashboard-table--queue td:nth-child(3) { width:220px; }
      .manager-dashboard-table--queue th:nth-child(4),
      .manager-dashboard-table--queue td:nth-child(4) { width:138px; }
      .manager-dashboard-table--queue th:nth-child(5),
      .manager-dashboard-table--queue td:nth-child(5) { width:72px; text-align:center; }
      .manager-dashboard-table--queue th:nth-child(6),
      .manager-dashboard-table--queue td:nth-child(6) { width:92px; }
      .manager-dashboard-table--queue th:nth-child(7),
      .manager-dashboard-table--queue td:nth-child(7) { width:196px; }
      .manager-dashboard-table--queue th:nth-child(8),
      .manager-dashboard-table--queue td:nth-child(8) { width:184px; }
      .manager-dashboard-table--queue th:nth-child(9),
      .manager-dashboard-table--queue td:nth-child(9) { width:82px; text-align:center; }
      .manager-reject-input { min-width:160px; height:34px; font-size:12px; }
      .queue-actions { flex-direction:column; gap:8px; }
      .btn { height:34px; padding:0 12px; font-size:12px; }
      .phase-mini-card { min-height:148px; }
      .manager-phase-cell--budget { min-width:220px; }
      .phase-list-pill { display:inline-flex; align-items:center; padding:7px 10px; border-radius:12px; background:#f4f8fb; border:1px solid #d7e2ea; color:#36536f; font-size:12px; font-weight:700; line-height:1.45; }
      .status-mix-pill { display:inline-flex; align-items:center; padding:8px 10px; border-radius:12px; background:#f3f8fc; border:1px solid #d8e2ea; color:#36536f; font-size:12px; font-weight:700; line-height:1.5; }
    `;
    document.head.appendChild(style);
  }

  function bindQuickActions(rows) {
    const map = new Map(rows.map((row) => [String(row.id || row.requestId || ""), row]));
    window.managerQuickApprove = (id) => {
      const row = map.get(String(id));
      if (!row) return;
      row.status = "Approved";
      render();
    };
    window.managerQuickReject = (id) => {
      const row = map.get(String(id));
      if (!row) return;
      const input = document.querySelector(`[data-reject-reason="${CSS.escape(String(id))}"]`);
      const reason = input ? String(input.value || "").trim() : "";
      if (!reason) {
        window.alert("Reject to DRI requires a reason.");
        return;
      }
      row.status = "Rejected to DRI";
      row.rejectReason = reason;
      render();
    };
  }

  function render() {
    ensureManagerShell();
    injectStyles();
    const groups = groupedItems();
    renderApprovalQueue(groups);
    renderBudgetOverview(groups);
    window.openManagerMfgModal = openManagerMfgModal;
    window.openManagerItemDetail = openManagerItemDetail;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
  window.addEventListener("load", render);
})();
