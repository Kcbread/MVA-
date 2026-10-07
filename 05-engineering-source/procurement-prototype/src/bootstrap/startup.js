// bootstrap/startup: authoritative source; see docs/module-map.md.
import {
  hydrateLvTaxonomy
} from "../catalog/taxonomy.js";
import {
  seedCoordinatorComputerData,
  seedManagerQuantityMatrixDemoData,
  seedOmDemoData,
  seedProjectStatusCostDashboardDemoData
} from "../data/demo-seeds.js";
import {
  renderDepartment
} from "../demand/workspace.js";
import {
  renderBuyer
} from "../handoff/buyer.js";
import {
  syncProjectControls
} from "../projects/controls.js";
import {
  renderProjectSetup
} from "../projects/setup.js";
import {
  renderRequesterPersonaOptions
} from "../session/persona.js";
import {
  restoreApiSession
} from "../session/session.js";
import {
  renderSourcing
} from "../sourcing/rfq.js";

// @legacy-unit 1894 26422
export function initializeStep1894() {
renderRequesterPersonaOptions();
}
// @end-legacy-unit 1894

// @legacy-unit 1895 26423
export function initializeStep1895() {
syncProjectControls();
}
// @end-legacy-unit 1895

// @legacy-unit 1896 26424
export function initializeStep1896() {
hydrateLvTaxonomy();
}
// @end-legacy-unit 1896

// @legacy-unit 1897 26425
export function initializeStep1897() {
renderProjectSetup();
}
// @end-legacy-unit 1897

// @legacy-unit 1898 26426
export function initializeStep1898() {
seedCoordinatorComputerData();
}
// @end-legacy-unit 1898

// @legacy-unit 1899 26427
export function initializeStep1899() {
seedOmDemoData();
}
// @end-legacy-unit 1899

// @legacy-unit 1900 26428
export function initializeStep1900() {
seedManagerQuantityMatrixDemoData();
}
// @end-legacy-unit 1900

// @legacy-unit 1901 26429
export function initializeStep1901() {
seedProjectStatusCostDashboardDemoData();
}
// @end-legacy-unit 1901

// @legacy-unit 1902 26430
export function initializeStep1902() {
renderDepartment();
}
// @end-legacy-unit 1902

// @legacy-unit 1903 26431
export function initializeStep1903() {
renderSourcing();
}
// @end-legacy-unit 1903

// @legacy-unit 1904 26432
export function initializeStep1904() {
renderBuyer();
}
// @end-legacy-unit 1904

// @legacy-unit 1906 26838
export function initializeStep1906() {
restoreApiSession();
}
// @end-legacy-unit 1906
