// exports/handoff: authoritative source; see docs/module-map.md.
import {
  ROUTE_REUSE,
  ROUTE_SOURCING
} from "../admin/state.js";
import {
  stageQtyText,
  totalQty
} from "../demand/quantity.js";
import {
  replaceRequestsBinding,
  requests
} from "../demand/state.js";
import {
  downloadCsv
} from "./workbook.js";
import {
  addHandoffHistory,
  procurementRows,
  readyForCoordinatorOutput
} from "../handoff/queue.js";
import {
  handoffRoute,
  handoffTarget,
  handoffWarnings
} from "../handoff/status.js";
import {
  renderProcurement
} from "../handoff/view.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  partName
} from "../materials/identity.js";
import {
  showConfirm,
  showToast
} from "../shell/dialogs.js";
import {
  HANDOFF_EXPORTED
} from "../workflow/status-constants.js";

// @legacy-unit 1874 25068
export function exportRowsForPackage(rows) {
  const header = ["Request ID", "Project", "Item", "PAS Material No.", "Detail / Spec", "Material Name", "Stage Qty", "Total Qty", "Route", "Export Target", "Handoff Note", "Warnings"];
  return [
    header,
    ...rows.map((row) => [
      row.id,
      row.project,
      row.name,
      row.pasMaterialNo || "",
      itemDetail(row),
      partName(row),
      stageQtyText(row),
      totalQty(row),
      handoffRoute(row),
      handoffTarget(row),
      row.procurementRemark || "",
      handoffWarnings(row).join(" / "),
    ]),
  ];
}
// @end-legacy-unit 1874

// @legacy-unit 1875 25089
export function commitHandoffExport(selectedRows) {
  const packages = [
    [ROUTE_REUSE, "sourcing_rfq_package.csv"],
    [ROUTE_SOURCING, "sourcing_new_material_package.csv"],
  ];
  packages.forEach(([route, fileName]) => {
    const rows = selectedRows.filter((row) => handoffRoute(row) === route);
    if (rows.length) downloadCsv(fileName, exportRowsForPackage(rows));
  });

  selectedRows.forEach((row) => {
    addHandoffHistory(row, `Exported package to ${handoffTarget(row)}`, row.procurementRemark || "");
  });

  replaceRequestsBinding(requests.map((row) => {
    if (!selectedRows.some((selected) => selected.id === row.id)) return row;
    return {
      ...row,
      handoffSelected: false,
      procurementStatus: HANDOFF_EXPORTED,
      exportTarget: handoffTarget(row),
      exportedAt: new Date().toISOString(),
    };
  }));
  renderProcurement();
  showToast(`${selectedRows.length} handoff row${selectedRows.length === 1 ? "" : "s"} exported.`, "success");
}
// @end-legacy-unit 1875

// @legacy-unit 1876 25117
export function exportHandoffPackages() {
  const selectedRows = procurementRows().filter((row) => row.handoffSelected);
  if (!selectedRows.length) {
    showToast("Select at least one handoff row before exporting.", "error");
    return;
  }
  if (selectedRows.some((row) => !readyForCoordinatorOutput(row))) return;

  showConfirm({
    title: "Export selected packages?",
    message: `${selectedRows.length} selected handoff row${selectedRows.length === 1 ? "" : "s"} will be exported into route-based CSV package${selectedRows.length === 1 ? "" : "s"}.`,
    confirmLabel: "Export",
    tone: "primary",
    onConfirm: () => commitHandoffExport(selectedRows),
  });
}
// @end-legacy-unit 1876
