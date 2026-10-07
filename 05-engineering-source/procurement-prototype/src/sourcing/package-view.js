// sourcing/package-view: authoritative source; see docs/module-map.md.
import {
  mfgCollectionStatusMeta
} from "../handoff/view.js";
import {
  detailRow
} from "../materials/detail-view.js";
import {
  statusClass
} from "../shared/format.js";
import {
  showToast
} from "../shell/dialogs.js";
import {
  MFG_PACKAGE_ROWS
} from "./config.js";

// @legacy-unit 1424 17645
export function openMfgPackageDetail(packageId) {
  const row = MFG_PACKAGE_ROWS.find((item) => item.id === packageId);
  if (!row) {
    showToast("MFG package detail is not available.", "error");
    return;
  }
  const missing = Math.max(0, row.required - row.completed);
  const collectionStatus = mfgCollectionStatusMeta(row);
  document.getElementById("itemDetailTitle").textContent = `${row.project} / ${row.packageType} Package`;
  const badge = document.getElementById("itemDetailBadge");
  badge.textContent = collectionStatus.label;
  badge.className = `status-pill ${statusClass(collectionStatus.label)}`;
  document.getElementById("itemDetailBody").innerHTML = `
    <aside class="item-photo-card" aria-label="MFG package evidence placeholder">
      <div class="item-photo-box">
        <span>Package Evidence</span>
        <strong>${row.excelSheet}</strong>
      </div>
      <p>Pictures and supporting files are tracked as evidence before collection is marked complete.</p>
    </aside>
    <div class="item-detail-grid">
      ${detailRow("Project", row.project)}
      ${detailRow("Phase", row.phase)}
      ${detailRow("Collection Form", row.packageType)}
      ${detailRow("Expected Inputs", row.required)}
      ${detailRow("Received Inputs", row.completed)}
      ${detailRow("Not Submitted", missing)}
      ${detailRow("Collection Status", collectionStatus.label)}
      ${detailRow("Excel Sheet Format", row.excelSheet)}
      ${detailRow("Collection Scope", "Model / Material No. / English Name / Vietnamese Name / Spec / Picture / Unit / Usage Qty / Used By / Purpose / Budget / Type / Remark / No. of quotation")}
      ${detailRow("Coordinator Note", row.detail)}
    </div>`;
  document.getElementById("itemDetailModal").hidden = false;
}
// @end-legacy-unit 1424
