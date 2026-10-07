// om/selection: authoritative source; see docs/module-map.md.
import {
  omFinalExportRows,
  omPasRequestRows,
  omPasResultRows,
  omUserConfirmRows
} from "./queue.js";
import {
  omSelections
} from "./state.js";

// @legacy-unit 1718 21617
export function selectedOmPasRequestRows() {
  return omPasRequestRows().filter((row) => omSelections.has(row.id) || row.omSelected);
}
// @end-legacy-unit 1718

// @legacy-unit 1719 21621
export function selectedOmPasResultRows() {
  return omPasResultRows().filter((row) => omSelections.has(row.id) || row.omSelected);
}
// @end-legacy-unit 1719

// @legacy-unit 1720 21625
export function selectedOmFinalExportRows() {
  return omFinalExportRows().filter((row) => omSelections.has(row.id) || row.omSelected);
}
// @end-legacy-unit 1720

// @legacy-unit 1721 21629
export function selectedOmRows() {
  return selectedOmPasResultRows();
}
// @end-legacy-unit 1721

// @legacy-unit 1722 21633
export function selectedOmWorkflowRows() {
  const seen = new Set();
  return [...omPasRequestRows(), ...omPasResultRows(), ...omUserConfirmRows(), ...omFinalExportRows()].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return omSelections.has(row.id) || row.omSelected;
  });
}
// @end-legacy-unit 1722
