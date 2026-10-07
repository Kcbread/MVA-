// data/state: authoritative source; see docs/module-map.md.
import {
  makePurchaseRecords
} from "./purchase-records.js";
import {
  makeActualBuyRecords,
  makeDemandBaselines
} from "../demand/baselines.js";
import {
  makeVendorMaterialMappings
} from "../materials/identity.js";

// @legacy-unit 317 1326
export let purchaseRecords;
export function initializePurchaseRecordsBinding() {
  purchaseRecords = makePurchaseRecords();
}
// @end-legacy-unit 317

// @legacy-unit 319 1328
export let vendorMaterialMappings;
export function initializeVendorMaterialMappingsBinding() {
  vendorMaterialMappings = makeVendorMaterialMappings(purchaseRecords);
}
// @end-legacy-unit 319

// @legacy-unit 320 1329
export let demandBaselines;
export function initializeDemandBaselinesBinding() {
  demandBaselines = makeDemandBaselines(purchaseRecords);
}
// @end-legacy-unit 320

// @legacy-unit 321 1330
export let actualBuyRecords;
export function initializeActualBuyRecordsBinding() {
  actualBuyRecords = makeActualBuyRecords(purchaseRecords);
}
// @end-legacy-unit 321

export function replaceVendorMaterialMappingsBinding(value) { vendorMaterialMappings = value; return value; }

export function replaceActualBuyRecordsBinding(value) { actualBuyRecords = value; return value; }

export function replaceDemandBaselinesBinding(value) { demandBaselines = value; return value; }
