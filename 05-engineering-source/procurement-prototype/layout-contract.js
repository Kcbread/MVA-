(function () {
  'use strict';

  var MARKER = 'data-layout-contract';

  function text(node) {
    return (node && node.textContent ? node.textContent : '').replace(/\s+/g, ' ').trim();
  }

  function lower(node) {
    return text(node).toLowerCase();
  }

  function isVisible(node) {
    if (!node) return false;
    var style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function guessTableType(table) {
    if (table.classList.contains('manager-quantity-table') || table.id === 'managerQuantityMatrixTable') return 'matrix-table';
    if (table.classList.contains('matrix-table')) return 'matrix-table';
    var nearby = text(table.closest('section, .card, .panel, main, body'));
    if (/Station Matrix/i.test(nearby)) return 'matrix-table';
    if (/Cost Dashboard|Dashboard/i.test(nearby)) return 'dense-dashboard-table';
    if (/Quote Result|Export Package|Submission Dashboard|PAS Demand/i.test(nearby)) return 'workflow-table';
    return 'form-table';
  }

  function ensureShell(table) {
    if (table.parentElement && table.parentElement.classList.contains('table-shell')) return table.parentElement;
    if (table.parentElement && /manager-quantity-wrap|matrix|table-wrap/.test(table.parentElement.className || '')) return table.parentElement;
    var shell = document.createElement('div');
    shell.className = 'table-shell';
    table.parentElement.insertBefore(shell, table);
    shell.appendChild(table);
    return shell;
  }

  function headerMap(table) {
    var head = table.tHead ? table.tHead.rows[table.tHead.rows.length - 1] : table.rows[0];
    if (!head) return [];
    return Array.from(head.cells).map(function (cell, index) {
      var label = lower(cell);
      return { index: index, label: label, cell: cell };
    });
  }

  function classifyHeader(label) {
    if (/^(actions?|action|add|remove|export|apply|reject)$/.test(label)) return 'action';
    if (/^detail$/.test(label)) return 'detail';
    if (/select/.test(label)) return 'select';
    if (/need date|date|submitted|received|updated|at$/.test(label)) return 'date';
    if (/qty|quantity|pcs/.test(label)) return 'qty';
    if (/price|amount|cost|days pending|pending days|sla/.test(label)) return 'number';
    if (/timeline/.test(label)) return 'timeline';
    if (/status/.test(label)) return 'status';
    if (/spec|detail \/ spec|purpose/.test(label)) return 'spec';
    if (/remark|reason|note|source package|source/.test(label)) return 'note';
    if (/item|item name|request id|material|package code|pas demand|pas material|po no|factory material/.test(label)) return 'identity';
    return '';
  }

  function shortenButton(label) {
    var normalized = label.replace(/\s+/g, ' ').trim();
    if (/^add item to request$/i.test(normalized)) return 'Add';
    if (/^import package to request$/i.test(normalized)) return 'Import';
    if (/^preview package$/i.test(normalized)) return 'Preview';
    if (/^complete item info$/i.test(normalized)) return 'Edit';
    if (/^submit package to manager b$/i.test(normalized)) return 'Submit';
    if (/^open matrix$/i.test(normalized)) return 'Detail';
    if (/^save rate$/i.test(normalized)) return 'Save';
    if (/^request change$/i.test(normalized)) return 'Change';
    if (/^mark exported$/i.test(normalized)) return 'Export';
    if (/^export package$/i.test(normalized)) return 'Export';
    if (/^export excel$/i.test(normalized)) return 'Export';
    if (/^export quote pdf package$/i.test(normalized)) return 'Export';
    if (/^apply$/i.test(normalized)) return 'Apply';
    if (/^reject( to dri)?$/i.test(normalized)) return 'Reject';
    if (/^remove$/i.test(normalized)) return 'Remove';
    if (/^detail$/i.test(normalized)) return 'Detail';
    if (/^edit demand$/i.test(normalized)) return 'Edit';
    if (/^edit$/i.test(normalized)) return 'Edit';
    if (/^add$/i.test(normalized)) return 'Add';
    return normalized.length > 10 ? normalized.split(' ')[0] : normalized;
  }

  function buttonsIn(cell) {
    return Array.from(cell.querySelectorAll('button, .btn, a.button, a.btn'));
  }

  function ensureActionStack(cell) {
    var stack = cell.querySelector('.action-stack');
    if (stack) return stack;
    var nestedStack = cell.querySelector('.action-stack .action-stack');
    if (nestedStack) return nestedStack.closest('.action-stack');
    stack = document.createElement('div');
    stack.className = 'action-stack';
    var nodes = Array.from(cell.childNodes);
    nodes.forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
      stack.appendChild(node);
    });
    cell.appendChild(stack);
    return stack;
  }

  function wrapTextCell(cell, cls, innerCls, lineMode) {
    cell.classList.add(cls);
    if (cell.querySelector('.' + innerCls) || buttonsIn(cell).length) return;
    var raw = cell.innerHTML;
    var plain = text(cell);
    if (!plain) return;
    var wrapper = document.createElement('div');
    wrapper.className = innerCls;
    wrapper.title = plain;
    if (lineMode === 'identity' && /<br\s*\/?>/i.test(raw)) {
      var parts = raw.split(/<br\s*\/?>/i);
      wrapper.innerHTML =
        '<span class="identity-primary">' + (parts[0] || '').trim() + '</span>' +
        '<span class="identity-secondary">' + parts.slice(1).join(' ').trim() + '</span>';
    } else if (lineMode === 'identity') {
      var pieces = plain.split(/\s{2,}|\n/).filter(Boolean);
      wrapper.innerHTML =
        '<span class="identity-primary">' + (pieces[0] || plain) + '</span>' +
        (pieces[1] ? '<span class="identity-secondary">' + pieces.slice(1).join(' ') + '</span>' : '');
    } else {
      wrapper.innerHTML = raw;
    }
    cell.innerHTML = '';
    cell.appendChild(wrapper);
  }

  function collapseNestedActionStacks(cell) {
    var outer = cell.querySelector(':scope > .action-stack');
    if (!outer) return;
    Array.from(outer.querySelectorAll('.action-stack')).forEach(function (nested) {
      while (nested.firstChild) {
        outer.insertBefore(nested.firstChild, nested);
      }
      nested.remove();
    });
  }

  function decorateCellByType(cell, type) {
    if (!cell) return;
    if (type === 'action' || type === 'detail') {
      cell.classList.add(type === 'detail' ? 'cell-detail' : 'cell-action');
      var stack = ensureActionStack(cell);
      collapseNestedActionStacks(cell);
      buttonsIn(stack).forEach(function (button) {
        var label = text(button);
        if (label) {
          button.setAttribute('title', label);
          button.textContent = shortenButton(label);
        }
        button.classList.add('layout-action-btn');
      });
      return;
    }
    if (type === 'date') {
      cell.classList.add('cell-date');
      return;
    }
    if (type === 'qty') {
      cell.classList.add('cell-qty', 'cell-number');
      return;
    }
    if (type === 'number') {
      cell.classList.add('cell-number');
      cell.title = text(cell);
      return;
    }
    if (type === 'timeline') {
      cell.classList.add('cell-timeline');
      return;
    }
    if (type === 'status') {
      cell.classList.add('cell-status');
      return;
    }
    if (type === 'identity') {
      wrapTextCell(cell, 'cell-identity', 'identity-block', 'identity');
      return;
    }
    if (type === 'spec') {
      wrapTextCell(cell, 'cell-spec-summary', 'spec-summary');
      return;
    }
    if (type === 'note') {
      wrapTextCell(cell, 'cell-note-summary', 'note-summary');
    }
  }

  function colClassForType(type) {
    if (type === 'action') return 'layout-col-action';
    if (type === 'detail') return 'layout-col-detail';
    if (type === 'date') return 'layout-col-date';
    if (type === 'qty') return 'layout-col-qty';
    if (type === 'status') return 'layout-col-status';
    if (type === 'timeline') return 'layout-col-timeline';
    if (type === 'number') return 'layout-col-number';
    if (type === 'identity') return 'layout-col-identity';
    if (type === 'spec') return 'layout-col-spec';
    if (type === 'note') return 'layout-col-note';
    return '';
  }

  function ensureColgroup(table, map) {
    if (guessTableType(table) === 'matrix-table') return;
    if (!map.length) return;
    if (table.querySelector('colgroup:not([data-layout-contract-colgroup])')) return;
    var colgroup = table.querySelector('colgroup[data-layout-contract-colgroup]');
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      colgroup.setAttribute('data-layout-contract-colgroup', 'true');
      table.insertBefore(colgroup, table.firstChild);
    }
    while (colgroup.children.length < map.length) {
      colgroup.appendChild(document.createElement('col'));
    }
    Array.from(colgroup.children).forEach(function (col, index) {
      col.className = '';
      var entry = map[index];
      var kind = entry ? classifyHeader(entry.label) : '';
      var cls = colClassForType(kind);
      if (cls) col.classList.add(cls);
    });
  }

  function decorateTable(table) {
    if (!table) return;
    if (table.dataset.layoutManaged === 'manual') {
      table.setAttribute(MARKER, 'manual');
      return;
    }
    ensureShell(table);
    var tableType = guessTableType(table);
    table.classList.add(tableType);
    if (tableType !== 'matrix-table') table.classList.add('table-fixed');
    var explicitAuto = table.dataset.layoutContractAuto === 'true' || table.dataset.layoutContract === 'auto';
    if (!explicitAuto) {
      table.setAttribute(MARKER, 'shell-only');
      return;
    }
    var map = headerMap(table);
    ensureColgroup(table, map);
    if (tableType === 'matrix-table') {
      table.setAttribute(MARKER, String(Date.now()));
      return;
    }
    map.forEach(function (entry) {
      var kind = classifyHeader(entry.label);
      if (!kind) return;
      if (kind === 'action') entry.cell.classList.add('cell-action');
      if (kind === 'detail') entry.cell.classList.add('cell-detail');
      if (kind === 'date') entry.cell.classList.add('cell-date');
      if (kind === 'qty') entry.cell.classList.add('cell-qty');
      if (kind === 'timeline') entry.cell.classList.add('cell-timeline');
      if (kind === 'status') entry.cell.classList.add('cell-status');
      Array.from(table.rows).slice(1).forEach(function (row) {
        decorateCellByType(row.cells[entry.index], kind);
      });
    });
    table.setAttribute(MARKER, String(Date.now()));
  }

  function decorateStickyFooters() {
    Array.from(document.querySelectorAll('button, .btn')).forEach(function (button) {
      var label = text(button);
      if (/^done$|^close$|^submit package to manager b$|^complete item info$/i.test(label)) {
        var parent = button.parentElement;
        if (parent && !parent.classList.contains('layout-sticky-footer') && parent.children.length <= 3) {
          if (!parent.closest('td, th')) {
            parent.classList.add('layout-sticky-footer');
          }
        }
      }
    });
  }

  function decorateCommandBars() {
    Array.from(document.querySelectorAll('button, .btn')).forEach(function (button) {
      var label = text(button);
      if (!/^preview package$|^import package to request$|^search$|^clear$|^create new item$/i.test(label)) return;
      var parent = button.parentElement;
      if (parent && !parent.classList.contains('layout-command-bar') && !parent.closest('td, th')) {
        parent.classList.add('layout-command-bar');
      }
    });
  }

  function run() {
    Array.from(document.querySelectorAll('table')).forEach(decorateTable);
    if (document.querySelector('[data-layout-contract-auto="true"], [data-layout-contract="auto"]')) {
      decorateStickyFooters();
      decorateCommandBars();
    }
  }

  window.applyLayoutContract = run;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();
