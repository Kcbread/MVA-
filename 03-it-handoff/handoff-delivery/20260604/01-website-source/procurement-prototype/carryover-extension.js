(function () {
  'use strict';

  var STORAGE_KEY = 'procurementCarryoverLedger.v1';
  var BOOT_KEY = 'procurementCarryoverLedger.seeded.v1';
  var EXT_ATTR = 'data-carryover-extension';
  var CURRENT_USER_FALLBACK = 'DRI';

  function nowIso() {
    return new Date().toISOString();
  }

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readLedger() {
    return safeParse(localStorage.getItem(STORAGE_KEY), []);
  }

  function writeLedger(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    window.dispatchEvent(new CustomEvent('procurement:carryover-updated', { detail: rows }));
  }

  function demoCarryoverRows() {
    return [
      {
        id: 'CO-DEMO-OR5-001',
        chainId: 'CO-CHAIN-OR5-MONITOR-1',
        stepNo: 1,
        project: 'OR5',
        sourceLine: 'Line 1',
        targetLine: 'Line 2',
        item: 'Monitor 1 (old)',
        phase: 'P1.0',
        stationOrUnit: 'CG',
        originalQty: 83,
        usedQty: 73,
        carryoverQty: 10,
        effectiveQty: 73,
        unitPrice: 1980000,
        status: 'Applied',
        confirmedBy: 'DRI',
        confirmedAt: nowIso(),
        reason: 'OR5 Line 1 residual monitor stock covers part of Line 2 demand.'
      },
      {
        id: 'CO-DEMO-OR6-001',
        chainId: 'CO-CHAIN-OR6-MONITOR-1',
        stepNo: 1,
        project: 'OR6',
        sourceLine: 'Line 1',
        targetLine: 'Line 2',
        item: 'Monitor 1',
        phase: 'EVT',
        stationOrUnit: 'CG',
        originalQty: 49,
        usedQty: 41,
        carryoverQty: 8,
        effectiveQty: 41,
        unitPrice: 1980000,
        status: 'Applied',
        confirmedBy: 'DRI',
        confirmedAt: nowIso(),
        reason: 'OR6 Line 1 remaining monitors can be reused for Line 2 opening.'
      },
      {
        id: 'CO-DEMO-OR6-002',
        chainId: 'CO-CHAIN-OR6-IPC',
        stepNo: 2,
        project: 'OR6',
        sourceLine: 'Line 2',
        targetLine: 'Line 3',
        item: 'IPC++',
        phase: 'EVT',
        stationOrUnit: 'FATP IQC',
        originalQty: 4,
        usedQty: 3,
        carryoverQty: 1,
        effectiveQty: 4,
        unitPrice: 19280000,
        status: 'Pending Review',
        confirmedBy: '',
        confirmedAt: '',
        reason: 'Line 2 IPC quantity changed; carryover is pending confirmation.'
      }
    ];
  }

  function ensureDemoCarryoverRows() {
    var rows = readLedger();
    var changed = false;
    demoCarryoverRows().forEach(function (demo) {
      if (rows.some(function (row) { return row.id === demo.id; })) return;
      rows.push(demo);
      changed = true;
    });
    if (changed) writeLedger(rows);
  }

  function seedLedger() {
    if (localStorage.getItem(BOOT_KEY)) {
      ensureDemoCarryoverRows();
      return;
    }
    var rows = readLedger();
    if (rows.length) {
      ensureDemoCarryoverRows();
      localStorage.setItem(BOOT_KEY, '1');
      return;
    }
    var seeded = [
      {
        id: 'CO-DEMO-001',
        chainId: 'CO-CHAIN-MINI-PC',
        stepNo: 1,
        project: 'P26',
        sourceLine: 'Line 1',
        targetLine: 'Line 2',
        item: 'Mini PC (Assy)',
        phase: 'P1.0',
        stationOrUnit: 'CG',
        originalQty: 10,
        usedQty: 6,
        carryoverQty: 4,
        effectiveQty: 6,
        unitPrice: 7800000,
        status: 'Applied',
        confirmedBy: 'DRI',
        confirmedAt: nowIso(),
        reason: 'Line 1 remaining qty can cover part of Line 2 demand.'
      },
      {
        id: 'CO-DEMO-002',
        chainId: 'CO-CHAIN-MINI-PC',
        stepNo: 2,
        project: 'P26',
        sourceLine: 'Line 2',
        targetLine: 'Line 3',
        item: 'Mini PC (Assy)',
        phase: 'P1.1',
        stationOrUnit: 'BG',
        originalQty: 8,
        usedQty: 7,
        carryoverQty: 1,
        effectiveQty: 7,
        unitPrice: 7800000,
        status: 'Pending Review',
        confirmedBy: '',
        confirmedAt: '',
        reason: 'Line 2 demand changed; DRI must confirm whether 1 pc carries to Line 3.'
      }
    ].concat(demoCarryoverRows());
    writeLedger(seeded);
    localStorage.setItem(BOOT_KEY, '1');
  }

  function htmlEscape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function numberValue(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function formatQty(value) {
    return String(numberValue(value).toLocaleString('en-US'));
  }

  function formatMoney(value) {
    var n = numberValue(value);
    if (!n) return '-';
    if (Math.abs(n) >= 1000000000) return (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B VND';
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M VND';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K VND';
    return n.toLocaleString('en-US') + ' VND';
  }

  function formatDate(value) {
    if (!value) return '-';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function isAppliedStatus(status) {
    return status === 'Applied' || status === 'User Applied';
  }

  function statusClass(status) {
    if (isAppliedStatus(status)) return 'carryover-status carryover-status--applied';
    if (status === 'Rejected') return 'carryover-status carryover-status--rejected';
    return 'carryover-status carryover-status--pending';
  }

  function currentPageText() {
    return (document.body && document.body.innerText ? document.body.innerText : '').replace(/\s+/g, ' ');
  }

  function text(node) {
    return String(node && (node.innerText || node.textContent || node.value) || '').replace(/\s+/g, ' ').trim();
  }

  function currentRole() {
    var headings = Array.from(document.querySelectorAll('h1, h2, .page-title, .view-title'))
      .filter(isVisible)
      .map(text)
      .join(' ');
    var visibleText = currentPageText();
    var roleText = (headings + ' ' + visibleText.slice(0, 900)).replace(/\s+/g, ' ');
    if (/Manager Dashboard|Manager B|Function:\s*Approver/i.test(roleText)) return 'manager';
    if (/OM Purchasing|OM Leader|OM Member|Function:\s*(Quotation|Export|OM)/i.test(roleText)) return 'om';
    if (/Project DRI|DRI Dashboard|Pending Price Review|Function:\s*DRI/i.test(roleText)) return 'dri';
    if (/Admin|Access & Approval Setup/i.test(roleText)) return 'admin';
    if (/User A Request|OPM \/ DRI Request|Request Workspace/i.test(roleText)) return 'user';
    return 'unknown';
  }

  function isVisible(node) {
    if (!node) return false;
    var style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function visibleCandidates() {
    return Array.from(document.querySelectorAll('[data-view], main, section, .view, .panel, .dashboard, .card'))
      .filter(isVisible);
  }

  function findHostForRole(role) {
    var text = currentPageText();
    var viewSelectors = {
      manager: '[data-view="manager"], [data-view="manager-dashboard"], #managerDashboard, .manager-dashboard',
      om: '[data-view="om"], [data-view="om-purchasing"], #omPurchasing, .om-purchasing',
      dri: '[data-view="dri"], [data-view="project-dri"], #driDashboard, .dri-dashboard'
    };
    var preferred = viewSelectors[role] ? document.querySelector(viewSelectors[role]) : null;
    if (preferred && isVisible(preferred)) return preferred;
    var candidates = visibleCandidates();
    var exact = candidates.find(function (node) {
      var nodeText = (node.innerText || '').slice(0, 3000);
      if (role === 'manager') return /Manager Dashboard|Demand Analysis|Cost Dashboard|Station Matrix/.test(nodeText);
      if (role === 'om') return /OM Purchasing|Submission Dashboard|PAS Demand No|PAS Quote Result|Export Package/.test(nodeText);
      if (role === 'dri') return /DRI Dashboard|Pending Price Review|Project DRI|Carryover Review/.test(nodeText);
      return false;
    });
    if (exact) return exact;
    if (role === 'manager' && /Manager Dashboard/.test(text)) return candidates[0] || document.body;
    if (role === 'om' && /OM Purchasing|Submission Dashboard|PAS Quote Result/.test(text)) return candidates[0] || document.body;
    if (role === 'dri' && /\bDRI\b|Project DRI/.test(text) && !/Manager Dashboard|OM Purchasing/.test(text)) return candidates[0] || document.body;
    return null;
  }

  function upsertContainer(host, id, afterSelector) {
    if (!host) return null;
    var existing = host.querySelector('#' + id);
    if (existing) return existing;
    var container = document.createElement('section');
    container.id = id;
    container.setAttribute(EXT_ATTR, 'true');
    if (afterSelector) {
      var anchor = host.querySelector(afterSelector);
      if (anchor && anchor.parentElement) {
        anchor.parentElement.insertBefore(container, anchor.nextSibling);
        return container;
      }
    }
    host.appendChild(container);
    return container;
  }

  function readFormNumber(form, name) {
    var input = form.querySelector('[name="' + name + '"]');
    return input ? numberValue(input.value) : 0;
  }

  function readFormText(form, name) {
    var input = form.querySelector('[name="' + name + '"]');
    return input ? input.value.trim() : '';
  }

  function nextId() {
    return 'CO-' + Date.now().toString(36).toUpperCase();
  }

  function nextStepNo(sourceLine, targetLine) {
    var sourceNo = Number(String(sourceLine).replace(/\D/g, '')) || 1;
    var targetNo = Number(String(targetLine).replace(/\D/g, '')) || sourceNo + 1;
    return Math.max(1, targetNo - 1);
  }

  function createCarryoverFromForm(form, status) {
    var originalQty = readFormNumber(form, 'originalQty');
    var usedQty = readFormNumber(form, 'usedQty');
    var carryoverQty = readFormNumber(form, 'carryoverQty');
    if (!carryoverQty) carryoverQty = Math.max(0, originalQty - usedQty);
    var sourceLine = readFormText(form, 'sourceLine') || 'Line 1';
    var targetLine = readFormText(form, 'targetLine') || 'Line 2';
    var item = readFormText(form, 'item') || 'Unspecified item';
    return {
      id: nextId(),
      chainId: 'CO-CHAIN-' + item.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28),
      stepNo: nextStepNo(sourceLine, targetLine),
      project: readFormText(form, 'project') || 'P26',
      sourceLine: sourceLine,
      targetLine: targetLine,
      item: item,
      phase: readFormText(form, 'phase') || 'MP',
      stationOrUnit: readFormText(form, 'stationOrUnit') || '-',
      originalQty: originalQty,
      usedQty: usedQty,
      carryoverQty: carryoverQty,
      effectiveQty: Math.max(0, originalQty - carryoverQty),
      unitPrice: readFormNumber(form, 'unitPrice'),
      status: status,
      confirmedBy: status === 'Applied' ? CURRENT_USER_FALLBACK : '',
      confirmedAt: status === 'Applied' ? nowIso() : '',
      reason: readFormText(form, 'reason') || 'DRI carryover review.'
    };
  }

  function removeUserAppliedCarryover(match) {
    var rows = readLedger();
    var filtered = rows.filter(function (row) {
      return !(row.source === 'User A Request'
        && row.sourceRequestId === match.sourceRequestId
        && row.sourceBreakdownId === match.sourceBreakdownId);
    });
    if (filtered.length !== rows.length) writeLedger(filtered);
  }

  function recordUserAppliedCarryover(event) {
    var carryoverQty = numberValue(event && event.carryoverQty);
    var sourceRequestId = String(event && event.sourceRequestId || '');
    var sourceBreakdownId = String(event && event.sourceBreakdownId || '');
    if (!sourceRequestId || !sourceBreakdownId) return null;
    if (carryoverQty <= 0) {
      removeUserAppliedCarryover({ sourceRequestId: sourceRequestId, sourceBreakdownId: sourceBreakdownId });
      return null;
    }
    var originalQty = numberValue(event.originalQty);
    var row = {
      id: 'CO-UA-' + sourceRequestId.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + sourceBreakdownId.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      chainId: 'CO-CHAIN-UA-' + sourceRequestId.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24),
      stepNo: nextStepNo(event.carryoverFrom, event.requestLine),
      project: event.project || 'P26',
      sourceLine: event.carryoverFrom || 'Carryover source',
      targetLine: event.requestLine || 'Request Line',
      item: event.item || 'Unspecified item',
      phase: event.phase || 'MP',
      stationOrUnit: event.stationOrUnit || '-',
      originalQty: originalQty,
      usedQty: Math.max(0, originalQty - carryoverQty),
      carryoverQty: carryoverQty,
      effectiveQty: Math.max(0, originalQty - carryoverQty),
      unitPrice: numberValue(event.unitPrice),
      status: 'User Applied',
      confirmedBy: event.confirmedBy || 'User A',
      confirmedAt: nowIso(),
      reason: event.reason || 'User A applied carryover from request line editor.',
      action: 'User Applied carryover',
      source: 'User A Request',
      requestId: event.requestId || sourceRequestId,
      rowId: event.rowId || sourceRequestId,
      packageId: event.packageId || '',
      sourceRequestId: sourceRequestId,
      sourceBreakdownId: sourceBreakdownId,
      requestLineRowId: event.requestLineRowId || sourceBreakdownId,
      spec: event.spec || '',
      itemSpec: event.spec || '',
      stationUnit: event.stationOrUnit || '-'
    };
    var rows = readLedger();
    var replaced = false;
    var updated = rows.map(function (existing) {
      if (existing.source === 'User A Request'
        && existing.sourceRequestId === sourceRequestId
        && existing.sourceBreakdownId === sourceBreakdownId) {
        replaced = true;
        return row;
      }
      return existing;
    });
    if (!replaced) updated.unshift(row);
    writeLedger(updated);
    return row;
  }

  function updateLedgerStatus(id, status) {
    var rows = readLedger();
    var updated = rows.map(function (row) {
      if (row.id !== id) return row;
      return Object.assign({}, row, {
        status: status,
        confirmedBy: CURRENT_USER_FALLBACK,
        confirmedAt: nowIso()
      });
    });
    writeLedger(updated);
  }

  function ledgerStats(rows) {
    return rows.reduce(function (acc, row) {
      var applied = isAppliedStatus(row.status);
      var carryoverQty = applied ? numberValue(row.carryoverQty) : 0;
      var originalQty = numberValue(row.originalQty);
      var unitPrice = numberValue(row.unitPrice);
      acc.events += 1;
      acc.applied += applied ? 1 : 0;
      acc.pending += row.status === 'Pending Review' ? 1 : 0;
      acc.rejected += row.status === 'Rejected' ? 1 : 0;
      acc.originalQty += originalQty;
      acc.carryoverQty += carryoverQty;
      acc.effectiveQty += applied ? Math.max(0, originalQty - carryoverQty) : originalQty;
      acc.costImpact += carryoverQty * unitPrice;
      return acc;
    }, {
      events: 0,
      applied: 0,
      pending: 0,
      rejected: 0,
      originalQty: 0,
      carryoverQty: 0,
      effectiveQty: 0,
      costImpact: 0
    });
  }

  function ledgerRowsHtml(rows, mode) {
    if (!rows.length) {
      return '<tr><td colspan="' + (mode === 'dri' ? 13 : 12) + '">No carryover ledger events yet.</td></tr>';
    }
    return rows.map(function (row) {
      var actionCell = '';
      if (mode === 'dri') {
        if (row.status === 'Pending Review') {
          actionCell = '<td class="carryover-cell-identity">' +
            '<button class="carryover-btn" data-carryover-apply="' + htmlEscape(row.id) + '" title="Apply carryover">Apply</button> ' +
            '<button class="carryover-btn carryover-btn--danger" data-carryover-reject="' + htmlEscape(row.id) + '" title="Reject carryover">Reject</button>' +
            '</td>';
        } else {
          actionCell = '<td class="carryover-cell-identity">-</td>';
        }
      }
      return '<tr>' +
        '<td class="carryover-cell-identity" title="' + htmlEscape(row.sourceLine) + '">' + htmlEscape(row.sourceLine) + '</td>' +
        '<td class="carryover-cell-identity" title="' + htmlEscape(row.targetLine) + '">' + htmlEscape(row.targetLine) + '</td>' +
        '<td class="carryover-cell-identity" title="' + htmlEscape(row.item) + '">' + htmlEscape(row.item) + '</td>' +
        '<td class="carryover-cell-identity">' + htmlEscape(row.phase) + '</td>' +
        '<td class="carryover-cell-identity">' + htmlEscape(row.stationOrUnit) + '</td>' +
        '<td class="carryover-cell-number">' + formatQty(row.originalQty) + '</td>' +
        '<td class="carryover-cell-number">' + formatQty(row.usedQty) + '</td>' +
        '<td class="carryover-cell-number">-' + formatQty(row.carryoverQty) + '</td>' +
        '<td class="carryover-cell-number">' + formatQty(row.effectiveQty) + '</td>' +
        '<td><span class="' + statusClass(row.status) + '">' + htmlEscape(row.status) + '</span></td>' +
        '<td class="carryover-cell-identity">' + htmlEscape(row.confirmedBy || '-') + '<br><span class="carryover-muted">' + htmlEscape(formatDate(row.confirmedAt)) + '</span></td>' +
        '<td class="carryover-cell-note" title="' + htmlEscape(row.reason) + '">' + htmlEscape(row.reason) + '</td>' +
        actionCell +
        '</tr>';
    }).join('');
  }

  function renderDriCarryover() {
    var host = findHostForRole('dri');
    if (!host) return;
    var container = upsertContainer(host, 'carryover-review-workspace');
    if (!container) return;
    var rows = readLedger();
    var stats = ledgerStats(rows);
    container.innerHTML =
      '<div class="carryover-card">' +
        '<h3>Carryover Review</h3>' +
        '<p class="carryover-muted">DRI owns carryover. Manager B and OM Purchasing only see the result and effective demand impact.</p>' +
        '<div class="carryover-impact-strip">' +
          '<div class="carryover-impact-card"><span>Applied Events</span><strong>' + formatQty(stats.applied) + '</strong></div>' +
          '<div class="carryover-impact-card"><span>Pending Review</span><strong>' + formatQty(stats.pending) + '</strong></div>' +
          '<div class="carryover-impact-card"><span>Carryover Qty</span><strong>-' + formatQty(stats.carryoverQty) + '</strong></div>' +
          '<div class="carryover-impact-card"><span>Cost Avoidance</span><strong>' + htmlEscape(formatMoney(stats.costImpact)) + '</strong></div>' +
        '</div>' +
        '<form class="carryover-toolbar" id="carryoverCreateForm">' +
          '<div class="carryover-field"><label>Source Line</label><select name="sourceLine"><option>Line 1</option><option>Line 2</option><option>Line 3</option></select></div>' +
          '<div class="carryover-field"><label>Target Line</label><select name="targetLine"><option>Line 2</option><option>Line 3</option><option>Line 4</option></select></div>' +
          '<div class="carryover-field"><label>Project</label><input name="project" value="P26" autocomplete="off"></div>' +
          '<div class="carryover-field carryover-field--wide"><label>Item</label><input name="item" value="Mini PC (Assy)" autocomplete="off"></div>' +
          '<div class="carryover-field"><label>Phase</label><select name="phase"><option>P1.0</option><option>P1.1</option><option>EVT</option><option>DVT</option><option>PVT</option><option selected>MP</option></select></div>' +
          '<div class="carryover-field"><label>Station / Unit</label><input name="stationOrUnit" value="CG" autocomplete="off"></div>' +
          '<div class="carryover-field"><label>Original Qty</label><input name="originalQty" type="number" min="0" value="10"></div>' +
          '<div class="carryover-field"><label>Used Qty</label><input name="usedQty" type="number" min="0" value="6"></div>' +
          '<div class="carryover-field"><label>Carryover Qty</label><input name="carryoverQty" type="number" min="0" value="4"></div>' +
          '<div class="carryover-field"><label>Unit Price VND</label><input name="unitPrice" type="number" min="0" value="7800000"></div>' +
          '<div class="carryover-field carryover-field--wide"><label>Reason</label><input name="reason" value="Inventory can cover next line demand." autocomplete="off"></div>' +
          '<div class="carryover-actions">' +
            '<button class="carryover-btn" type="submit" name="intent" value="Applied" title="Apply carryover now">Apply</button>' +
            '<button class="carryover-btn carryover-btn--secondary" type="submit" name="intent" value="Pending Review" title="Create a pending carryover suggestion">Suggest</button>' +
          '</div>' +
        '</form>' +
        '<div class="carryover-table-shell">' +
          '<table class="carryover-table" aria-label="Carryover Flow Ledger">' +
            '<thead><tr><th>Source Line</th><th>Target Line</th><th>Item</th><th>Phase</th><th>Station / Unit</th><th>Original</th><th>Used</th><th>Carryover</th><th>Effective</th><th>Status</th><th>Confirmed</th><th>Reason</th><th>Action</th></tr></thead>' +
            '<tbody>' + ledgerRowsHtml(rows, 'dri') + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    var form = container.querySelector('#carryoverCreateForm');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var submitter = event.submitter;
        var status = submitter && submitter.value ? submitter.value : 'Applied';
        var rows = readLedger();
        rows.unshift(createCarryoverFromForm(form, status));
        writeLedger(rows);
        renderAll();
      });
    }
    container.querySelectorAll('[data-carryover-apply]').forEach(function (button) {
      button.addEventListener('click', function () {
        updateLedgerStatus(button.getAttribute('data-carryover-apply'), 'Applied');
        renderAll();
      });
    });
    container.querySelectorAll('[data-carryover-reject]').forEach(function (button) {
      button.addEventListener('click', function () {
        updateLedgerStatus(button.getAttribute('data-carryover-reject'), 'Rejected');
        renderAll();
      });
    });
  }

  function renderManagerCarryover() {
    var node = document.getElementById('carryover-manager-readonly');
    if (node) node.remove();
  }

  function renderOmCarryover() {
    var host = findHostForRole('om');
    if (!host) return;
    var container = upsertContainer(host, 'carryover-om-effective-qty', '.export-package-table, table');
    if (!container) return;
    var rows = readLedger();
    var stats = ledgerStats(rows);
    container.innerHTML =
      '<div class="carryover-card">' +
        '<h3>Effective Qty from DRI Carryover</h3>' +
        '<p class="carryover-muted">OM receives final effective demand only. Carryover decisions remain DRI-owned and are read-only here.</p>' +
        '<div class="carryover-impact-strip">' +
          '<div class="carryover-impact-card"><span>Carryover Applied</span><strong>' + formatQty(stats.applied) + '</strong></div>' +
          '<div class="carryover-impact-card"><span>Carryover Qty</span><strong>-' + formatQty(stats.carryoverQty) + '</strong></div>' +
          '<div class="carryover-impact-card"><span>Effective Qty</span><strong>' + formatQty(stats.effectiveQty) + '</strong></div>' +
          '<div class="carryover-impact-card"><span>Pending DRI Review</span><strong>' + formatQty(stats.pending) + '</strong></div>' +
        '</div>' +
        '<div class="carryover-readonly-banner">' +
          '<span class="carryover-status carryover-status--pending">Read Only</span>' +
          '<span>Export Package should use effective qty after DRI carryover is applied.</span>' +
        '</div>' +
      '</div>';
  }

  function enhanceLoginRoles() {
    var roleLabels = ['DRI', 'Project DRI'];
    document.querySelectorAll('select').forEach(function (select) {
      var optionTexts = Array.from(select.options).map(function (option) { return option.textContent.trim(); }).join('|');
      if (!/User A|Manager B|OM Purchasing|Admin/.test(optionTexts)) return;
      roleLabels.forEach(function (label) {
        if (Array.from(select.options).some(function (option) { return option.textContent.trim() === label; })) return;
        var option = document.createElement('option');
        option.value = label.toLowerCase().replace(/\s+/g, '-');
        option.textContent = label;
        select.appendChild(option);
      });
    });
  }

  function renderAll() {
    seedLedger();
    enhanceLoginRoles();
    removeDisallowedCarryoverViews();
    var role = currentRole();
    if (role === 'dri') renderDriCarryover();
    if (role === 'manager') renderManagerCarryover();
    if (role === 'om') renderOmCarryover();
  }

  function removeDisallowedCarryoverViews() {
    var role = currentRole();
    var allowed = {
      dri: ['carryover-review-workspace'],
      manager: ['carryover-manager-readonly'],
      om: ['carryover-om-effective-qty']
    }[role] || [];
    ['carryover-review-workspace', 'carryover-manager-readonly', 'carryover-om-effective-qty'].forEach(function (id) {
      if (allowed.indexOf(id) !== -1) return;
      var node = document.getElementById(id);
      if (node) node.remove();
    });
  }

  var renderQueued = false;
  function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    window.setTimeout(function () {
      renderQueued = false;
      renderAll();
    }, 80);
  }

  window.ProcurementCarryover = {
    readLedger: readLedger,
    writeLedger: writeLedger,
    recordUserAppliedCarryover: recordUserAppliedCarryover,
    stats: function () { return ledgerStats(readLedger()); },
    effectiveQtyFor: function (item, phase) {
      var rows = readLedger().filter(function (row) {
        var sameItem = !item || String(row.item).toLowerCase() === String(item).toLowerCase();
        var samePhase = !phase || String(row.phase).toLowerCase() === String(phase).toLowerCase();
        return isAppliedStatus(row.status) && sameItem && samePhase;
      });
      return rows.reduce(function (total, row) {
        return total + numberValue(row.effectiveQty);
      }, 0);
    },
    carryoverQtyFor: function (item, phase) {
      var rows = readLedger().filter(function (row) {
        var sameItem = !item || String(row.item).toLowerCase() === String(item).toLowerCase();
        var samePhase = !phase || String(row.phase).toLowerCase() === String(phase).toLowerCase();
        return isAppliedStatus(row.status) && sameItem && samePhase;
      });
      return rows.reduce(function (total, row) {
        return total + numberValue(row.carryoverQty);
      }, 0);
    },
    render: renderAll
  };

  document.addEventListener('DOMContentLoaded', renderAll);
  window.addEventListener('hashchange', scheduleRender);
  window.addEventListener('procurement:carryover-updated', scheduleRender);
  document.addEventListener('click', function () {
    window.setTimeout(scheduleRender, 120);
  });

  if (document.body) {
    renderAll();
  }
})();
