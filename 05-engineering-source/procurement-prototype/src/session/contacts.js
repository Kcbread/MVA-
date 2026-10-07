// session/contacts: authoritative source; see docs/module-map.md.
import {
  purchaseRecords
} from "../data/state.js";
import {
  canonicalDemandUnit,
  stationBreakdownRowsForDetail
} from "../demand/quantity.js";
import {
  requests
} from "../demand/state.js";
import {
  detailRow
} from "../materials/detail-view.js";
import {
  itemDetail
} from "../materials/display.js";
import {
  projectCodeForRow,
  projectTypeFor,
  yearProjectForRow
} from "../projects/config.js";
import {
  normalizedContactPhone
} from "./persona.js";
import {
  normalize
} from "../shared/format.js";
import {
  DRI_CONTACT_MASTER
} from "../sourcing/config.js";

// @legacy-unit 1065 11870
export function sourceRecordForRequest(row) {
  return purchaseRecords.find((record) => record.id === row.sourceRecordId)
    || purchaseRecords.find((record) => record.project === row.project && normalize(record.name) === normalize(row.name) && normalize(itemDetail(record)) === normalize(itemDetail(row)))
    || null;
}
// @end-legacy-unit 1065

// @legacy-unit 1066 11876
export function contactCardHtml(title, contact, helper = "") {
  if (!contact || !(contact.name || contact.email || contact.phone || contact.employeeId)) {
    return `
      <article class="contact-card">
        <h4>${title}</h4>
        <p class="muted">Not provided</p>
        ${helper ? `<div class="reason-text">${helper}</div>` : ""}
      </article>`;
  }
  const email = contact.email || "";
  const phone = normalizedContactPhone(contact.phone);
  return `
    <article class="contact-card">
      <h4>${title}</h4>
      <div class="contact-name">${contact.name || "-"}</div>
      <div class="detail-grid compact-detail-grid">
        ${detailRow("Department", contact.department || "-")}
        ${detailRow("Employee ID", contact.employeeId || "-")}
        ${detailRow("Email", email ? `<a href="mailto:${email}">${email}</a>` : "Not provided")}
        ${detailRow("Phone", phone || "Not provided")}
      </div>
      ${helper ? `<div class="reason-text">${helper}</div>` : ""}
    </article>`;
}
// @end-legacy-unit 1066

// @legacy-unit 1067 11901
export function departmentDriContact(row) {
  const projectType = row.projectType || projectTypeFor(row.project);
  const unitFromBreakdown = stationBreakdownRowsForDetail(row).map((item) => item.demandUnit).find(Boolean);
  const department = canonicalDemandUnit(row.department || unitFromBreakdown || row.process || "");
  return DRI_CONTACT_MASTER.find((contact) =>
    contact.projectType === projectType
    && normalize(contact.department) === normalize(department)
  ) || DRI_CONTACT_MASTER.find((contact) =>
    contact.projectType === projectType
    && normalize(contact.department) === normalize(row.department || "")
  ) || null;
}
// @end-legacy-unit 1067

// @legacy-unit 1068 11914
export function requesterContact(row) {
  const source = sourceRecordForRequest(row) || {};
  return {
    department: row.department || source.department || "",
    name: row.requesterName || row.submittedBy || source.requesterName || "",
    employeeId: row.requesterEmployeeId || source.requesterEmployeeId || "",
    email: row.email || source.email || "",
    phone: row.phone || source.phone || "",
  };
}
// @end-legacy-unit 1068

// @legacy-unit 1069 11925
export function relatedProjectContact(row) {
  const source = purchaseRecords.find((record) =>
    record.project === row.project
    && normalize(record.process) === normalize(row.process)
    && (record.requesterName || record.email)
  );
  return source ? {
    department: source.department || source.process || "",
    name: source.requesterName || "",
    employeeId: source.requesterEmployeeId || "",
    email: source.email || "",
    phone: source.phone || "",
  } : null;
}
// @end-legacy-unit 1069

// @legacy-unit 1070 11940
export function openDriContact(requestId) {
  const row = requests.find((item) => item.id === requestId);
  if (!row) return;
  const deptContact = departmentDriContact(row);
  const projectContact = relatedProjectContact(row);
  const modal = document.getElementById("managerDetailModal");
  modal?.classList.add("contact-detail-mode");
  document.getElementById("managerDetailTitle").textContent = `Contact DRI · ${row.project} / ${row.name}`;
  document.getElementById("managerDetailStatus").className = "status-pill approved";
  document.getElementById("managerDetailStatus").textContent = "Contact";
  document.getElementById("managerDetail").innerHTML = `
    <section class="work-panel detail-subsection">
      <div class="panel-title section-head-tight">
        <div>
          <h4>DRI Contact</h4>
          <p class="panel-subcopy">Requester, department DRI, and related project/process contact are kept out of the main table so approval and purchasing stay readable.</p>
        </div>
      </div>
      <div class="contact-card-grid">
        ${contactCardHtml("Requester", requesterContact(row), "From submitted request / G or Non-G request row.")}
        ${contactCardHtml("Department DRI", deptContact, "From DRI input Rq by project type and demand unit / department.")}
        ${contactCardHtml("Project / Process Contact", projectContact, "Best available related contact from source request rows.")}
      </div>
    </section>
    <section class="work-panel detail-subsection">
      <h4>Request Context</h4>
      <div class="detail-grid compact-detail-grid">
        ${detailRow("Request ID", row.id)}
        ${detailRow("Package", row.requestPackageId || "-")}
        ${detailRow("Project Type", row.projectType || projectTypeFor(row.project))}
        ${detailRow("Year Project", yearProjectForRow(row))}
        ${detailRow("Project", projectCodeForRow(row) || "-")}
        ${detailRow("Process", row.process || "-")}
        ${detailRow("Demand Unit", stationBreakdownRowsForDetail(row).map((item) => item.demandUnit).filter(Boolean).join(" / ") || row.department || "-")}
      </div>
    </section>`;
  if (modal) modal.hidden = false;
}
// @end-legacy-unit 1070
