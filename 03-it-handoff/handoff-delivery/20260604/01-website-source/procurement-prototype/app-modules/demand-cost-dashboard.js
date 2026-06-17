(function registerDemandCostDashboardModule(root) {
  const DASHBOARD_UNITS = ["MFG", "FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];

  function emptyUnitTotals() {
    return Object.fromEntries(DASHBOARD_UNITS.map((unit) => [unit, 0]));
  }

  function emptyPhaseUnitTotals(phases) {
    return Object.fromEntries(phases.map((phase) => [phase, emptyUnitTotals()]));
  }

  function aggregateItemUnitRows(entries) {
    const groups = new Map();
    const phases = [...new Set(entries.map((entry) => entry.phase).filter(Boolean))];
    entries.forEach((entry) => {
      const key = [entry.project, entry.item, entry.spec].join("::");
      if (!groups.has(key)) {
        groups.set(key, {
          project: entry.project,
          item: entry.item,
          spec: entry.spec,
          unitPrice: Number(entry.unitPrice || 0),
          unitTotals: emptyUnitTotals(),
          phaseUnitTotals: emptyPhaseUnitTotals(phases),
          qty: 0,
          amount: 0,
        });
      }
      const group = groups.get(key);
      const qty = Number(entry.qty || 0);
      if (DASHBOARD_UNITS.includes(entry.unit)) group.unitTotals[entry.unit] += qty;
      if (entry.phase && group.phaseUnitTotals[entry.phase] && DASHBOARD_UNITS.includes(entry.unit)) {
        group.phaseUnitTotals[entry.phase][entry.unit] += qty;
      }
      group.qty += qty;
      group.amount += qty * Number(group.unitPrice || 0);
    });
    return [...groups.values()].sort((left, right) => right.qty - left.qty || left.item.localeCompare(right.item));
  }

  function aggregatePhaseUnitTotals(entries) {
    const totals = {};
    entries.forEach((entry) => {
      if (!entry.phase || !DASHBOARD_UNITS.includes(entry.unit)) return;
      totals[entry.phase] = totals[entry.phase] || emptyUnitTotals();
      totals[entry.phase][entry.unit] += Number(entry.qty || 0);
    });
    return totals;
  }

  function aggregateSelectedPhaseUnitCost(entries, { phase, lineCount = 1, viewMode = "amount" } = {}) {
    const totals = Object.fromEntries(DASHBOARD_UNITS.map((unit) => [unit, { qty: 0, amount: 0 }]));
    entries
      .filter((entry) => !phase || entry.phase === phase)
      .forEach((entry) => {
        if (!DASHBOARD_UNITS.includes(entry.unit)) return;
        const qty = Number(entry.qty || 0);
        const price = Number(entry.unitPrice || 0);
        totals[entry.unit].qty += qty;
        totals[entry.unit].amount += qty * price * Number(lineCount || 1);
      });
    return viewMode === "qty"
      ? Object.fromEntries(DASHBOARD_UNITS.map((unit) => [unit, totals[unit].qty]))
      : Object.fromEntries(DASHBOARD_UNITS.map((unit) => [unit, totals[unit].amount]));
  }

  function calculateCarryoverCostImpact({ submittedQty = 0, lineCount = 1, carryoverQty = 0, unitPrice = 0, status = "Applied" } = {}) {
    const originalQty = Number(submittedQty || 0) * Number(lineCount || 1);
    const appliedCarryoverQty = (status === "Applied" || status === "User Applied") ? Number(carryoverQty || 0) : 0;
    const effectiveQty = Math.max(0, originalQty - appliedCarryoverQty);
    const price = Number(unitPrice || 0);
    return {
      originalQty,
      carryoverQty: appliedCarryoverQty,
      effectiveQty,
      originalAmount: originalQty * price,
      savingAmount: appliedCarryoverQty * price,
      effectiveAmount: effectiveQty * price,
    };
  }

  function costQtyDisplayPair({ viewMode = "amount", effectiveQty = 0, effectiveAmount = 0, hasPrice = true } = {}) {
    const qtyLabel = `${Number(effectiveQty || 0)} qty`;
    const amountLabel = hasPrice ? Number(effectiveAmount || 0) : "Price pending";
    return viewMode === "qty"
      ? { main: Number(effectiveQty || 0), sub: amountLabel }
      : { main: amountLabel, sub: qtyLabel };
  }

  function filterCarryoverRows(rows = [], { project = "", phase = "", item = "" } = {}) {
    return rows.filter((row) => {
      if (project && row.project !== project) return false;
      if (phase && row.phase !== phase) return false;
      if (item && String(row.item || "").toLowerCase() !== String(item).toLowerCase()) return false;
      return true;
    });
  }

  const api = {
    DASHBOARD_UNITS,
    aggregateItemUnitRows,
    aggregatePhaseUnitTotals,
    aggregateSelectedPhaseUnitCost,
    calculateCarryoverCostImpact,
    costQtyDisplayPair,
    filterCarryoverRows,
  };

  root.ProcurementApp = root.ProcurementApp || {};
  root.ProcurementApp.modules = root.ProcurementApp.modules || {};
  root.ProcurementApp.modules.demandCostDashboard = api;

  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
