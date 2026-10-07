// inventory/state: authoritative source; see docs/module-map.md.
import {
  activeExchangeRateMonth
} from "../cost/currency.js";

// @legacy-unit 229 1232
export let currentWarehouseMonth;
export function initializeCurrentWarehouseMonthBinding() {
  currentWarehouseMonth = activeExchangeRateMonth();
}
// @end-legacy-unit 229

// @legacy-unit 230 1233
export let warehouseStockRecords;
export function initializeWarehouseStockRecordsBinding() {
  warehouseStockRecords = [
  { id: "WH-STOCK-001", transactionType: "stock-in", status: "Available", month: "2026-06", item: "Mini PC (Assy)", spec: "LAMITOUCH LM-30 CPU:i3-6100, RAM 16GB DDR4 3200, SSD 256G", itemOwner: "OM", qty: 12, ownedQty: 12, sourceProject: "P26", sourceLine: "Line 1", sourceStage: "MP", sourceStation: "CG", sourceRequestId: "WAREHOUSE-P26-MP", createdBy: "OM warehouse", createdAt: "2026-06-03T08:30:00.000Z", reason: "OM warehouse stock remaining from P26 MP CG." },
  { id: "WH-STOCK-002", transactionType: "stock-in", status: "Available", month: "2026-06", item: "Monitor 1", spec: "DELL E2225HM, 21.5 inch HDMI cable", itemOwner: "OM", qty: 18, ownedQty: 18, sourceProject: "OR5", sourceLine: "Line 1", sourceStage: "P1.0", sourceStation: "CG", sourceRequestId: "WAREHOUSE-OR5-P10", createdBy: "OM warehouse", createdAt: "2026-06-03T08:45:00.000Z", reason: "Line 1 residual OM monitor stock." },
  { id: "WH-STOCK-003", transactionType: "stock-in", status: "Available", month: "2026-06", item: "IPC", spec: "DELL Pro Tower QCT1250, Core i3-14100, RAM 8GB DDR5, SSD 512GB", itemOwner: "OM", qty: 2, ownedQty: 2, sourceProject: "F27", sourceLine: "Line 1", sourceStage: "P1.0", sourceStation: "CG", sourceRequestId: "WAREHOUSE-F27-L1-CG", createdBy: "OM warehouse", createdAt: "2026-06-05T09:10:00.000Z", reason: "F27 Line 1 has 2 extra OM-owned CG IPC units." },
  { id: "WH-USE-OR6-IPC-001", transactionType: "use-candidate", status: "Pending OM", month: "2026-06", item: "IPC", spec: "DELL Pro Tower QCT1250, Core i3-14100, RAM 8GB DDR5, SSD 512GB", itemOwner: "OM", qty: 2, sourceProject: "F27", sourceLine: "Line 1", sourceStage: "P1.0", sourceStation: "CG", sourceRequestId: "WAREHOUSE-F27-L1-CG", targetProject: "OR6", targetLine: "Line 2", targetStage: "EVT", targetStationOrUnit: "CG", targetRequestId: "REQ-OR6-L2-IPC", createdBy: "Requester", createdAt: "2026-06-05T09:20:00.000Z", reason: "OR6 Line 2 can use 2 IPC units from F27 Line 1 OM stock." },
];
}
// @end-legacy-unit 230

// @legacy-unit 231 1239
export let warehouseLockdownRecords;
export function initializeWarehouseLockdownRecordsBinding() {
  warehouseLockdownRecords = [];
}
// @end-legacy-unit 231

export function replaceCurrentWarehouseMonthBinding(value) { currentWarehouseMonth = value; return value; }

export function replaceWarehouseStockRecordsBinding(value) { warehouseStockRecords = value; return value; }
