/*
 * User A Flow module
 * ------------------
 * Single owner for User A request-entry UX cleanup.
 *
 * app.js still owns the data model and core actions:
 * - addRecord(recordId)
 * - createNewItemSuggestion()
 * - renderHistoryRows()
 * - renderRequestRows()
 *
 * This module deliberately does not create a second draft table or a second
 * material modal. It only removes conflicting old UX patterns and verifies
 * that Search / History use the same direct Add entry point.
 */
(function userAFlowModule() {
  if (window.__USER_A_FLOW_MODULE__) return;
  window.__USER_A_FLOW_MODULE__ = true;

  const text = (node) => String(node?.innerText || node?.textContent || node?.value || "").replace(/\s+/g, " ").trim();
  const lower = (value) => text({ textContent: value }).toLowerCase();

  function isDepartmentView() {
    return Boolean(document.querySelector('[data-view="department"].active'));
  }

  function cleanupHistoryBulkActions() {
    const historyPanel = document.querySelector('[data-dept-panel="history"]');
    if (!historyPanel) return;

    historyPanel.querySelectorAll('[data-action="copyHistory"], [data-action="useHistorySourceQty"]').forEach((button) => {
      button.hidden = true;
      button.setAttribute("aria-hidden", "true");
    });

    const firstHeader = historyPanel.querySelector(".history-table thead th:first-child");
    if (firstHeader && lower(firstHeader.textContent) === "select") {
      firstHeader.textContent = "Add";
    }
  }

  function normalizeHistoryRows() {
    const historyRows = document.getElementById("historyRows");
    if (!historyRows) return;

    historyRows.querySelectorAll("tr").forEach((row) => {
      const firstCell = row.querySelector("td:first-child");
      if (!firstCell || firstCell.querySelector("[data-add-history-record]") || firstCell.classList.contains("empty-cell")) return;

      const checkbox = firstCell.querySelector("[data-history-select]");
      if (!checkbox) return;
      const recordId = checkbox.dataset.historySelect;
      firstCell.innerHTML = `<button class="mini approve" data-add-history-record="${recordId}">Add</button>`;
    });
  }

  function markRequestGate() {
    const submitButton = document.querySelector('[data-action="submitRequests"]');
    if (!submitButton) return;
    submitButton.title = "Rows with Complete Material Info Required must be completed before submit.";
  }

  function runUserAFlowCleanup() {
    if (!isDepartmentView()) return;
    cleanupHistoryBulkActions();
    normalizeHistoryRows();
    markRequestGate();
  }

  document.addEventListener("DOMContentLoaded", () => {
    runUserAFlowCleanup();
  });

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-record], [data-add-history-record]");
    if (!addButton || !isDepartmentView()) return;

    // Let app.js handle the actual data mutation. This guard is intentionally
    // non-blocking; it exists to prevent future duplicate modules from adding
    // fake draft rows or second modals.
    addButton.dataset.userAFlow = "direct-add";
  }, true);
})();
