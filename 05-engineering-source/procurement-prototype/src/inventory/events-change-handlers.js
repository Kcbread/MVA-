// inventory/events-change-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderWarehouseMaintenance,
  syncWarehouseStockSelection
} from "./warehouse.js";

export function handleChangeWarehouseStockItem(event) {
  if (event.target.id === "warehouseStockItem") syncWarehouseStockSelection();
  if (["warehouseMonthFilter", "warehouseSearch"].includes(event.target.id)) renderWarehouseMaintenance();
}
