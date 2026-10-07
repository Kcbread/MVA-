// session/persona: authoritative source; see docs/module-map.md.
import {
  purchaseRecords
} from "../data/state.js";
import {
  demandTypeFor,
  demandUnitFor
} from "../demand/quantity.js";
import {
  currentDeptDemandDepartment,
  currentDeptDemandPhase,
  lastRequestPhase,
  lastRequestProject,
  replaceCurrentDeptDemandDepartmentBinding,
  replaceCurrentDeptDemandPhaseBinding,
  replaceLastRequestPhaseBinding,
  replaceLastRequestProjectBinding
} from "../demand/state.js";
import {
  DEMAND_TYPE_MFG,
  STATION_MASTER,
  nextBuyStageForProject,
  projectTypeFor
} from "../projects/config.js";
import {
  currentProject,
  currentProjectType,
  replaceCurrentProjectBinding,
  replaceCurrentProjectTypeBinding
} from "../projects/state.js";
import {
  roleProfiles
} from "./config.js";
import {
  sessionUserFromRole
} from "./session.js";
import {
  currentRequesterPersonaId,
  currentSessionUser,
  replaceCurrentRequesterPersonaIdBinding
} from "./state.js";
import {
  normalize
} from "../shared/format.js";

// @legacy-unit 333 1343
export function normalizedContactPhone(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "x") return "";
  return text.replace(/\.0$/, "");
}
// @end-legacy-unit 333

// @legacy-unit 334 1349
export function contactIdFor(contact) {
  return normalize([contact.projectType, contact.department, contact.employeeId, contact.email, contact.name].join("|")).replace(/[^a-z0-9]+/g, "-");
}
// @end-legacy-unit 334

// @legacy-unit 335 1353
export function requesterResponsibilityRows() {
  const rows = Array.isArray(window.REQUESTER_RESPONSIBILITY_MASTER) ? window.REQUESTER_RESPONSIBILITY_MASTER : [];
  return rows.filter((row) => row && (row.employeeId || row.name || row.department || row.project));
}
// @end-legacy-unit 335

// @legacy-unit 336 1358
export function normalizeLoginIdentifier(value) {
  return String(value || "").trim().toLowerCase();
}
// @end-legacy-unit 336

// @legacy-unit 337 1362
export function requesterPersonas() {
  const contacts = new Map();
  requesterResponsibilityRows().forEach((row) => {
    const employeeId = String(row.employeeId || "").trim();
    const email = String(row.email || "").trim();
    const key = employeeId || email || `${row.projectFamily}-${row.department}-${row.name}`;
    if (!key) return;
    const id = contactIdFor({
      projectType: row.projectFamily || "",
      department: row.department || "",
      employeeId,
      email,
      name: row.name || "",
    });
    const existing = contacts.get(id);
    const project = String(row.project || "").trim();
    const nextProjects = [...new Set([...(existing?.projects || []), ...(project ? [project] : [])])];
    contacts.set(id, {
      id,
      projectType: existing?.projectType || row.projectFamily || "",
      project: existing?.project || project,
      projects: nextProjects,
      department: existing?.department || row.department || "",
      name: existing?.name || row.name || employeeId || email || "Requester",
      employeeId: existing?.employeeId || employeeId,
      email: existing?.email || email,
      emailNote: existing?.emailNote || row.emailNote || "",
      phone: existing?.phone || normalizedContactPhone(row.phone),
      budgetApprover: existing?.budgetApprover || row.budgetApprover || "",
      source: "DRIs list (2).xlsx",
    });
  });
  purchaseRecords.forEach((row) => {
    if (!(row.requesterName || row.email || row.requesterEmployeeId)) return;
    const contact = {
      id: contactIdFor({
        projectType: row.projectType || projectTypeFor(row.project),
        department: row.department || "",
        employeeId: row.requesterEmployeeId || "",
        email: row.email || "",
        name: row.requesterName || "",
      }),
      projectType: row.projectType || projectTypeFor(row.project),
      project: row.project || "",
      department: row.department || "",
      name: row.requesterName || row.email || "Requester",
      employeeId: row.requesterEmployeeId || "",
      email: row.email || "",
      phone: normalizedContactPhone(row.phone),
      projects: row.project ? [row.project] : [],
      source: "Purchase records",
    };
    if (!contacts.has(contact.id)) contacts.set(contact.id, contact);
  });
  return [...contacts.values()].sort((left, right) => `${left.projectType} ${left.department} ${left.name}`.localeCompare(`${right.projectType} ${right.department} ${right.name}`));
}
// @end-legacy-unit 337

// @legacy-unit 338 1419
export function currentRequesterPersona() {
  return requesterPersonas().find((item) => item.id === currentRequesterPersonaId) || null;
}
// @end-legacy-unit 338

// @legacy-unit 339 1423
export function currentRequesterDepartment() {
  const persona = currentRequesterPersona();
  const session = currentSessionUser?.role === "requester" ? currentSessionUser : sessionUserFromRole("requester");
  return persona?.department || session?.department || roleProfiles.requester?.dept || "";
}
// @end-legacy-unit 339

// @legacy-unit 340 1429
export function rowDemandDepartment(row = {}, fallback = "") {
  return row.department || row.requesterDept || row.demandDepartment || fallback || "";
}
// @end-legacy-unit 340

// @legacy-unit 341 1433
export function normalizeRequestDemandDepartment(row = {}, fallback = currentRequesterDepartment()) {
  const demandDepartment = rowDemandDepartment(row, fallback);
  const stationBreakdown = Array.isArray(row.stationBreakdown)
    ? row.stationBreakdown.map((entry) => {
      const demandType = demandTypeFor(entry);
      const entryDemandDepartment = rowDemandDepartment(entry, demandDepartment);
      return {
        ...entry,
        demandType,
        station: demandType === DEMAND_TYPE_MFG ? (entry.station || STATION_MASTER[0]) : "",
        demandUnit: demandType === DEMAND_TYPE_MFG ? "" : demandUnitFor(entry),
        requesterDept: entry.requesterDept || entryDemandDepartment,
        demandDepartment: entry.demandDepartment || entryDemandDepartment,
      };
    })
    : row.stationBreakdown;
  return {
    ...row,
    department: demandDepartment,
    requesterDept: row.requesterDept || demandDepartment,
    demandDepartment: row.demandDepartment || demandDepartment,
    stationBreakdown,
  };
}
// @end-legacy-unit 341

// @legacy-unit 342 1458
export function findRequesterPersonaByIdentifier(identifier) {
  const normalized = normalizeLoginIdentifier(identifier);
  if (!normalized) return null;
  return requesterPersonas().find((persona) => {
    return [
      persona.employeeId,
      persona.email,
      persona.id,
      persona.name,
    ].some((value) => normalizeLoginIdentifier(value) === normalized);
  }) || null;
}
// @end-legacy-unit 342

// @legacy-unit 343 1471
export function applyRequesterPersonaContext(persona) {
  if (!persona) return;
  replaceCurrentRequesterPersonaIdBinding(persona.id || currentRequesterPersonaId);
  replaceCurrentProjectTypeBinding(persona.projectType || currentProjectType);
  replaceCurrentProjectBinding(persona.project || persona.projects?.[0] || currentProject);
  replaceCurrentDeptDemandDepartmentBinding(persona.department || currentDeptDemandDepartment);
  replaceLastRequestProjectBinding(currentProject);
  replaceCurrentDeptDemandPhaseBinding(nextBuyStageForProject(currentProject) || currentDeptDemandPhase);
  replaceLastRequestPhaseBinding(currentDeptDemandPhase);
}
// @end-legacy-unit 343

// @legacy-unit 344 1482
export function requesterDisplayName() {
  return currentRequesterPersona()?.name || roleProfiles.requester.name;
}
// @end-legacy-unit 344

// @legacy-unit 345 1486
export function renderRequesterPersonaOptions() {
  const select = document.getElementById("requesterPersonaSelect");
  if (!select) return;
  const personas = requesterPersonas();
  const current = select.value || currentRequesterPersonaId;
  select.innerHTML = `<option value="">Auto from Excel requester list</option>${personas.slice(0, 160).map((person) => `<option value="${person.id}" ${person.id === current ? "selected" : ""}>${person.employeeId || "No ID"} · ${person.name} · ${person.department || "Dept"} · ${(person.projects || [person.project]).filter(Boolean).join("/") || person.projectType}</option>`).join("")}`;
  if (current && personas.some((person) => person.id === current)) select.value = current;
}
// @end-legacy-unit 345

export function replaceRequesterPersonasBinding(value) { requesterPersonas = value; return value; }

export function replaceNormalizeRequestDemandDepartmentBinding(value) { normalizeRequestDemandDepartment = value; return value; }
