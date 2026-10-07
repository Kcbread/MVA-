// handoff/queue: authoritative source; see docs/module-map.md.
import {
  hasPendingAmendment,
  isSupersededRequest
} from "../demand/amendments.js";
import {
  requests
} from "../demand/state.js";
import {
  advanceHandoffHistorySequenceBinding,
  handoffHistory,
  handoffHistorySequence,
  replaceHandoffHistoryBinding
} from "./state.js";
import {
  exportStatus,
  handoffRoute,
  handoffTarget
} from "./status.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  globalItemIdFor,
  globalItemKey
} from "../materials/identity.js";
import {
  isPasRequired
} from "../om/pas-rules.js";
import {
  roleProfiles
} from "../session/config.js";
import {
  currentRole
} from "../session/state.js";
import {
  normalize
} from "../shared/format.js";
import {
  effectiveRfqBuyer
} from "../sourcing/rfq.js";
import {
  HANDOFF_READY,
  HANDOFF_WAITING_PAS
} from "../workflow/status-constants.js";

// @legacy-unit 1444 18089
export function procurementRows() {
  const projectFilter = document.getElementById("handoffProjectFilter").value;
  const routeFilter = document.getElementById("handoffRouteFilter").value;
  const exportFilter = document.getElementById("handoffExportStatusFilter").value;
  return requests.filter((row) => {
    const visible = row.status === "Approved" && row.procurementStatus === HANDOFF_READY;
    return visible
      && (!projectFilter || row.project === projectFilter)
      && (!routeFilter || handoffRoute(row) === routeFilter)
      && (!exportFilter || exportStatus(row) === exportFilter);
  });
}
// @end-legacy-unit 1444

// @legacy-unit 1445 18102
export function pasReviewRows() {
  return requests.filter((row) => row.status === "Approved"
    && row.procurementStatus === HANDOFF_WAITING_PAS
    && isPasRequired(row)
    && !hasPendingAmendment(row)
    && !isSupersededRequest(row));
}
// @end-legacy-unit 1445

// @legacy-unit 1496 18740
export function readyForCoordinatorOutput(row) {
  return true;
}
// @end-legacy-unit 1496

// @legacy-unit 1497 18744
export function suggestedDeptCode(row) {
  const buyer = effectiveRfqBuyer(row);
  const text = normalize([row.name, itemDetail(row), row.level2, row.process, row.station].join(" "));
  if (buyer === "IT" || text.includes("it") || row.level2 === "IT硬體與設備" || row.level2 === "IT線材與耗材") return "IT";
  if (text.includes("rf")) return "RF";
  if (text.includes("qa") || text.includes("iqc")) return "QA";
  if (text.includes("smt")) return "SM";
  if (text.includes("fae") || text.includes("ie") || text.includes("repair")) return "E1";
  if (text.includes("mae")) return "E2";
  if (text.includes("packing") || text.includes("pack")) return "E3";
  if (text.includes("warehouse") || text.includes("wh")) return "WH";
  if (text.includes("security")) return "SE";
  if (text.includes("production")) return "PR";
  if (text.includes("facility")) return "FA";
  return "AB";
}
// @end-legacy-unit 1497

// @legacy-unit 1498 18761
export function withRefreshedIdentity(row) {
  return {
    ...row,
    globalItemKey: globalItemKey(row),
    globalItemId: globalItemIdFor(row),
  };
}
// @end-legacy-unit 1498

// @legacy-unit 1499 18769
export function addHandoffHistory(row, action, note = "") {
  const actor = roleProfiles[currentRole]?.name || "System";
  replaceHandoffHistoryBinding([{
    id: `HH-${String(advanceHandoffHistorySequenceBinding(1, true)).padStart(4, "0")}`,
    requestId: row.id,
    project: row.project,
    item: row.name,
    action,
    route: handoffRoute(row),
    exportTarget: handoffTarget(row),
    actor,
    note,
    timestamp: new Date().toISOString(),
  }, ...handoffHistory]);
}
// @end-legacy-unit 1499
