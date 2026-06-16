const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert");

const root = path.resolve(__dirname, "..");
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const appJs = fs.readFileSync(path.join(root, "app.js"), "utf8");
const stylesCss = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const allocationJs = fs.readFileSync(path.join(root, "app-modules/export-allocation.js"), "utf8");

test("export allocation module is registered before app bootstrap", () => {
  assert.match(indexHtml, /app-modules\/export-allocation\.js/);
  assert.match(allocationJs, /STORAGE_KEY = 'procurementExportAllocationLedger\.v1'/);
  assert.match(allocationJs, /function summarizeSourceRow/);
  assert.match(allocationJs, /function prepareAllocationsForExport/);
});

test("OM Export Package table surfaces allocation summary and workspace entry", () => {
  assert.match(indexHtml, /<th>Allocation<\/th>/);
  assert.match(indexHtml, /id="omExportAllocationWorkspace"/);
  assert.match(indexHtml, /id="omExportAllocationRows"/);
  assert.match(appJs, /data-om-row-button-action="openAllocation"/);
  assert.match(appJs, /Allocated/);
  assert.match(appJs, /Uncovered/);
  assert.match(appJs, /Split/);
  assert.match(appJs, /Budget Codes/);
});

test("allocation workspace uses ledger-style source-target tracking without mutating original qty", () => {
  assert.match(allocationJs, /sourceRequestId/);
  assert.match(allocationJs, /targetProject/);
  assert.match(allocationJs, /allocatedQty/);
  assert.match(allocationJs, /budgetCode/);
  assert.match(allocationJs, /createdAt/);
  assert.match(allocationJs, /updatedAt/);
  assert.doesNotMatch(allocationJs, /row\.totalQty\s*[-+*/]?=/);
});

test("allocation UI uses dedicated workspace and ledger table shell", () => {
  assert.match(stylesCss, /\.om-export-allocation-workspace/);
  assert.match(stylesCss, /\.om-export-allocation-table/);
  assert.match(stylesCss, /\.om-export-allocation-summary/);
  assert.match(stylesCss, /\.om-export-allocation-empty/);
});

test("OM allocation workspace surfaces a read-only source pool before ledger edits", () => {
  assert.match(indexHtml, /id="omExportSourcePoolRows"/);
  assert.match(indexHtml, /Source Pool/);
  assert.match(appJs, /buildSourcePool/);
  assert.match(appJs, /omExportSourcePoolRows/);
  assert.match(stylesCss, /\.om-export-source-pool-table/);
  assert.match(stylesCss, /\.om-export-source-pool-trace/);
  assert.match(allocationJs, /function buildSourcePool/);
});

test("quote attachments are captured after allocation by allocation line", () => {
  assert.match(indexHtml, /Quote Attachments/);
  assert.match(appJs, /data-om-allocation-screenshot/);
  assert.match(appJs, /data-om-allocation-excel/);
  assert.match(appJs, /function omAllocationAttachmentListHtml/);
  assert.match(appJs, /function validateOmFinalExportAttachments/);
  assert.match(appJs, /omExportAllocationLines\(row,\s*\{\s*ensure:\s*true\s*\}\)/);
  assert.match(allocationJs, /quotationPdf/);
  assert.match(allocationJs, /quotationExcel/);
  assert.match(stylesCss, /\.om-allocation-attachment-list/);
});

test("allocation target fields are controlled selects and qty is capped by source demand", () => {
  assert.match(appJs, /function omAllocationTargetProjectOptions/);
  assert.match(appJs, /function omAllocationDemandTypeOptions/);
  assert.match(appJs, /function omAllocationNonMfgDemandUnitValue/);
  assert.match(appJs, /function omAllocationPhaseOptions/);
  assert.match(appJs, /function omAllocationStationUnitOptions/);
  assert.match(appJs, /function refreshOmAllocationDependentControls/);
  assert.match(appJs, /function omAllocationLineAvailableQty/);
  assert.match(appJs, /function omAllocationControlledSelectHtml/);
  assert.match(appJs, /<select[^>]+data-om-allocation-field="\$\{field\}"/);
  assert.match(appJs, /omAllocationControlledSelectHtml\(row,\s*line,\s*"targetProject"/);
  assert.match(appJs, /omAllocationControlledSelectHtml\(row,\s*line,\s*"targetDemandType"/);
  assert.match(appJs, /omAllocationControlledSelectHtml\(row,\s*line,\s*"targetPhase"/);
  assert.match(appJs, /omAllocationControlledSelectHtml\(row,\s*line,\s*"targetStationUnit"/);
  assert.match(appJs, /DEMAND_TYPE_NON_MFG[\s\S]*DEMAND_UNIT_OPTIONS/);
  assert.match(appJs, /omAllocationNonMfgDemandUnitValue\(row\.demandUnit \|\| row\.department\)/);
  assert.match(appJs, /DEMAND_TYPE_MFG[\s\S]*STATION_MASTER/);
  assert.match(appJs, /const omAllocationField = event\.target\.dataset\.omAllocationField/);
  assert.match(appJs, /refreshOmAllocationDependentControls\(omAllocationRequest,\s*omAllocationId\)/);
  assert.match(appJs, /if \(currentQty > availableQty\) qtyInput\.value = String\(availableQty\)/);
  assert.match(indexHtml, /<th>Target Type<\/th>/);
  assert.match(appJs, /max="\$\{omAllocationLineAvailableQty\(row,\s*displayLine\)\}"/);
  assert.match(appJs, /data-om-allocation-source-qty/);
  assert.doesNotMatch(appJs, /data-om-allocation-field="targetProject"[^>]+type="text"/);
  assert.doesNotMatch(appJs, /data-om-allocation-field="targetPhase"[^>]+type="text"/);
  assert.doesNotMatch(appJs, /data-om-allocation-field="targetStationUnit"[^>]+type="text"/);
});
