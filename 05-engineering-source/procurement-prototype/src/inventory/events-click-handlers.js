// inventory/events-click-handlers.js: domain-owned event handlers; listener ordering is composed by shell/events.js.
import {
  createCarryoverCandidate
} from "./suggestions.js";
import {
  addWarehouseStockRecord,
  updateWarehouseCandidateStatus
} from "./warehouse.js";

export function handleClickAddWarehouseStockRecord(action) {
  if (action === "addWarehouseStockRecord") addWarehouseStockRecord();
}

export function handleClickCarryoverSuggestionButton(carryoverSuggestionButton, warehouseCandidateLockButton, warehouseCandidateRejectButton) {
  if (carryoverSuggestionButton) createCarryoverCandidate(carryoverSuggestionButton.dataset.createCarryoverCandidate);
  if (warehouseCandidateLockButton) updateWarehouseCandidateStatus(warehouseCandidateLockButton.dataset.warehouseCandidateLock, "lock");
  if (warehouseCandidateRejectButton) updateWarehouseCandidateStatus(warehouseCandidateRejectButton.dataset.warehouseCandidateReject, "reject");
}
