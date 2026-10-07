// inventory/events-input-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  renderWarehouseMaintenance
} from "./warehouse.js";

export function handleInputWarehouseSearch(event) {
  if (event.target.id === "warehouseSearch") renderWarehouseMaintenance();
}
