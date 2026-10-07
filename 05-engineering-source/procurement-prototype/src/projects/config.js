// projects/config: authoritative source; see docs/module-map.md.
import {
  purchaseRecords
} from "../data/state.js";
import {
  requests
} from "../demand/state.js";
import {
  PROJECTS,
  currentProject,
  currentProjectCode,
  currentProjectType,
  replacePROJECTSBinding
} from "./state.js";
import {
  stageLabel
} from "../shared/format.js";

// @legacy-unit 0 1
export let STAGES;
export function initializeSTAGESBinding() {
  STAGES = ["p10", "p11", "evt", "dvt", "pvt", "mp"];
}
// @end-legacy-unit 0

// @legacy-unit 1 2
export let STAGE_LABELS;
export function initializeSTAGE_LABELSBinding() {
  STAGE_LABELS = {
  p0: "P0",
  p10: "P1.0",
  p11: "P1.1",
  evt: "EVT",
  dvt: "DVT",
  pvt: "PVT",
  mp: "MP",
};
}
// @end-legacy-unit 1

// @legacy-unit 2 11
export let DEMAND_UNIT_FALLBACK;
export function initializeDEMAND_UNIT_FALLBACKBinding() {
  DEMAND_UNIT_FALLBACK = "ENG1";
}
// @end-legacy-unit 2

// @legacy-unit 3 12
export let DEMAND_UNIT_OPTIONS;
export function initializeDEMAND_UNIT_OPTIONSBinding() {
  DEMAND_UNIT_OPTIONS = ["ENG1", "ENG2", "ENG3", "QA G-PQC", "GG-WH", "MFG", "FATP TE", "FATP IQC", "FATP PQE", "Q-LAB", "REL", "IT", "FAC", "FAE", "IQC", "ME", "MFG NONG", "ORT", "PQE", "TE", "WH"];
}
// @end-legacy-unit 3

// @legacy-unit 4 13
export let DEMAND_UNIT_ALIAS_MAP;
export function initializeDEMAND_UNIT_ALIAS_MAPBinding() {
  DEMAND_UNIT_ALIAS_MAP = {
  "qa g -pqc": "QA G-PQC",
  "qa g - pqc": "QA G-PQC",
};
}
// @end-legacy-unit 4

// @legacy-unit 5 17
export let QUANTITY_DASHBOARD_UNITS;
export function initializeQUANTITY_DASHBOARD_UNITSBinding() {
  QUANTITY_DASHBOARD_UNITS = ["MFG", "FATP TE", "FATP IQC", "FATP PQE", "WH", "Q-LAB", "REL", "ENG1", "ENG2", "ENG3", "IT", "FAC"];
}
// @end-legacy-unit 5

// @legacy-unit 6 18
export let STATION_MASTER;
export function initializeSTATION_MASTERBinding() {
  STATION_MASTER = ["CG", "BG", "FATP", "Test", "Hybrid", "Auto", "ENG Pack", "Zombie", "Laser_pico", "Rework", "Repair", "WH"];
}
// @end-legacy-unit 6

// @legacy-unit 7 19
export let DEMAND_TYPES;
export function initializeDEMAND_TYPESBinding() {
  DEMAND_TYPES = ["MFG", "Non-MFG"];
}
// @end-legacy-unit 7

// @legacy-unit 8 20
export let DEMAND_TYPE_MFG;
export function initializeDEMAND_TYPE_MFGBinding() {
  DEMAND_TYPE_MFG = "MFG";
}
// @end-legacy-unit 8

// @legacy-unit 9 21
export let DEMAND_TYPE_NON_MFG;
export function initializeDEMAND_TYPE_NON_MFGBinding() {
  DEMAND_TYPE_NON_MFG = "Non-MFG";
}
// @end-legacy-unit 9

// @legacy-unit 10 22
export let ITEM_OWNER_OM;
export function initializeITEM_OWNER_OMBinding() {
  ITEM_OWNER_OM = "OM";
}
// @end-legacy-unit 10

// @legacy-unit 11 23
export let ITEM_OWNER_MFG;
export function initializeITEM_OWNER_MFGBinding() {
  ITEM_OWNER_MFG = "MFG";
}
// @end-legacy-unit 11

// @legacy-unit 12 24
export let ITEM_OWNER_UNIT;
export function initializeITEM_OWNER_UNITBinding() {
  ITEM_OWNER_UNIT = "Unit";
}
// @end-legacy-unit 12

// @legacy-unit 13 25
export let ITEM_OWNER_PENDING;
export function initializeITEM_OWNER_PENDINGBinding() {
  ITEM_OWNER_PENDING = "Owner pending";
}
// @end-legacy-unit 13

// @legacy-unit 14 26
export let ITEM_OWNER_NON_OM;
export function initializeITEM_OWNER_NON_OMBinding() {
  ITEM_OWNER_NON_OM = "Non-OM";
}
// @end-legacy-unit 14

// @legacy-unit 15 27
export let REQUEST_ACTION_NEW_BUY;
export function initializeREQUEST_ACTION_NEW_BUYBinding() {
  REQUEST_ACTION_NEW_BUY = "New Buy";
}
// @end-legacy-unit 15

// @legacy-unit 16 28
export let REQUEST_ACTION_OTHER;
export function initializeREQUEST_ACTION_OTHERBinding() {
  REQUEST_ACTION_OTHER = "Other";
}
// @end-legacy-unit 16

// @legacy-unit 17 29
export let REQUEST_ACTION_OPTIONS;
export function initializeREQUEST_ACTION_OPTIONSBinding() {
  REQUEST_ACTION_OPTIONS = [REQUEST_ACTION_NEW_BUY, REQUEST_ACTION_OTHER];
}
// @end-legacy-unit 17

// @legacy-unit 18 30
export let PURPOSE_LOCATION_OPTIONS;
export function initializePURPOSE_LOCATION_OPTIONSBinding() {
  PURPOSE_LOCATION_OPTIONS = ["SMT", "FATP"];
}
// @end-legacy-unit 18

// @legacy-unit 19 31
export let DEFAULT_PURPOSE_LOCATION;
export function initializeDEFAULT_PURPOSE_LOCATIONBinding() {
  DEFAULT_PURPOSE_LOCATION = "SMT";
}
// @end-legacy-unit 19

// @legacy-unit 20 32
export let PROCUREMENT_STATUS_OPTIONS;
export function initializePROCUREMENT_STATUS_OPTIONSBinding() {
  PROCUREMENT_STATUS_OPTIONS = ["Pending", "In Progress", "Done"];
}
// @end-legacy-unit 20

// @legacy-unit 21 33
export let G_YEAR_PROJECT_OPTIONS;
export function initializeG_YEAR_PROJECT_OPTIONSBinding() {
  G_YEAR_PROJECT_OPTIONS = ["P26 Demo line", "P26", "P26 Zombie line", "P26 Service line", "F27", "P27", "P25 Service line"];
}
// @end-legacy-unit 21

// @legacy-unit 22 34
export let G_PROJECT_CODE_OPTIONS;
export function initializeG_PROJECT_CODE_OPTIONSBinding() {
  G_PROJECT_CODE_OPTIONS = ["4CS4", "CGY4", "PKK4", "WGO5", "ASK5", "KSH5", "MCN5", "MT5", "BZ5", "FL5"];
}
// @end-legacy-unit 22

// @legacy-unit 23 35
export let NON_G_PROJECT_CODE_OPTIONS;
export function initializeNON_G_PROJECT_CODE_OPTIONSBinding() {
  NON_G_PROJECT_CODE_OPTIONS = ["AS3", "BM2", "LD8", "MA4", "MH2", "ML2", "OR5", "OR6", "SSF"];
}
// @end-legacy-unit 23

// @legacy-unit 24 36
export let PROJECT_REFERENCE_CODES;
export function initializePROJECT_REFERENCE_CODESBinding() {
  PROJECT_REFERENCE_CODES = ["Bidding list 26"];
}
// @end-legacy-unit 24

// @legacy-unit 25 38
export function normalizeYearProjectLabel(value = "") {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  const lower = text.toLowerCase();
  const aliases = {
    "p26 demo line": "P26 Demo line",
    "p26 zombie line": "P26 Zombie line",
    "p26 service line": "P26 Service line",
    "p25 service line": "P25 Service line",
  };
  if (aliases[lower]) return aliases[lower];
  return G_YEAR_PROJECT_OPTIONS.find((project) => project.toLowerCase() === lower) || text;
}
// @end-legacy-unit 25

// @legacy-unit 26 51
export function normalizeProjectCodeLabel(value = "") {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (!text) return "";
  if (PROJECT_REFERENCE_CODES.some((code) => code.toLowerCase() === text.toLowerCase())) return "";
  const compact = text.toUpperCase().replace(/\s+/g, "");
  return G_PROJECT_CODE_OPTIONS.includes(compact) || NON_G_PROJECT_CODE_OPTIONS.includes(compact)
    ? compact
    : compact;
}
// @end-legacy-unit 26

// @legacy-unit 27 61
export function projectTypeForScopeCode(code = "") {
  const normalized = normalizeYearProjectLabel(code);
  if (G_YEAR_PROJECT_OPTIONS.includes(normalized)) return "G";
  if (NON_G_PROJECT_CODE_OPTIONS.includes(normalizeProjectCodeLabel(code))) return "Non-G";
  return "";
}
// @end-legacy-unit 27

// @legacy-unit 28 68
export function yearProjectOptionsForType(type = "") {
  if (type === "Non-G") return [];
  return [...G_YEAR_PROJECT_OPTIONS];
}
// @end-legacy-unit 28

// @legacy-unit 29 73
export function projectCodeOptionsForScope({ projectType = "", yearProject = "" } = {}) {
  const scopeType = projectType || projectTypeForScopeCode(yearProject);
  if (scopeType === "G") return [...G_PROJECT_CODE_OPTIONS];
  if (scopeType === "Non-G") {
    const code = normalizeProjectCodeLabel(yearProject);
    return code && NON_G_PROJECT_CODE_OPTIONS.includes(code) ? [code] : [...NON_G_PROJECT_CODE_OPTIONS];
  }
  return [...new Set([...G_PROJECT_CODE_OPTIONS, ...NON_G_PROJECT_CODE_OPTIONS])];
}
// @end-legacy-unit 29

// @legacy-unit 34 108
export function normalizeSeedProjectCode(value) {
  return normalizeProjectCodeLabel(value);
}
// @end-legacy-unit 34

// @legacy-unit 35 112
export function isNonGExcelSeedRow(row = {}) {
  return row?.sourceSheet === "NON G MVA EQ request" || row?.projectType === "Non-G";
}
// @end-legacy-unit 35

// @legacy-unit 36 116
export function seedProjectCodeFromRow(row = {}) {
  return normalizeSeedProjectCode(row.projectCode || row.sourceProject || row.project || "");
}
// @end-legacy-unit 36

// @legacy-unit 37 120
export function seedYearProjectFromRow(row = {}) {
  if (isNonGExcelSeedRow(row)) return seedProjectCodeFromRow(row);
  return normalizeYearProjectLabel(row.yearProject || row.project || seedProjectCodeFromRow(row));
}
// @end-legacy-unit 37

// @legacy-unit 38 125
export function seedStageKey(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const aliases = {
    p10: "p10",
    "p1.0": "p10",
    p11: "p11",
    "p1.1": "p11",
    evt: "evt",
    dvt: "dvt",
    pvt: "pvt",
    mp: "mp",
  };
  return aliases[normalized] || "";
}
// @end-legacy-unit 38

// @legacy-unit 39 140
export function derivedSeedStageKey(row) {
  const directStage = seedStageKey(row?.stage);
  if (directStage) return directStage;
  return STAGES.find((stage) => Number(row?.[stage] || 0) > 0) || "";
}
// @end-legacy-unit 39

// @legacy-unit 40 146
export function deriveProjectConfigsFromRealRecords() {
  const records = Array.isArray(globalThis.REAL_MVA_PURCHASE_RECORDS) ? globalThis.REAL_MVA_PURCHASE_RECORDS : [];
  if (!records.length) return [];
  const configMap = new Map();
  records.forEach((row) => {
    const code = seedYearProjectFromRow(row);
    if (!code) return;
    const stageKey = derivedSeedStageKey(row);
    const config = configMap.get(code) || {
      code,
      projectType: row?.projectType === "Non-G" ? "Non-G" : "G",
      openToUser: true,
      stageCounts: {},
      stageDates: {},
    };
    config.projectType = row?.projectType === "Non-G" ? "Non-G" : config.projectType;
    if (stageKey) {
      config.stageCounts[stageKey] = (config.stageCounts[stageKey] || 0) + 1;
      const requiredDate = String(row?.requiredDeliveryDate || row?.requiredDeliveryDateDri || "").trim();
      if (requiredDate && /^\d{4}-\d{2}-\d{2}$/.test(requiredDate) && !config.stageDates[stageKey]) {
        config.stageDates[stageKey] = requiredDate;
      }
    }
    configMap.set(code, config);
  });
  return [...configMap.values()]
    .map((config) => {
      const currentPhase = STAGES
        .map((stage) => ({ stage, count: config.stageCounts[stage] || 0 }))
        .sort((left, right) => right.count - left.count || STAGES.indexOf(right.stage) - STAGES.indexOf(left.stage))[0]?.count
        ? STAGES
          .map((stage) => ({ stage, count: config.stageCounts[stage] || 0 }))
          .sort((left, right) => right.count - left.count || STAGES.indexOf(right.stage) - STAGES.indexOf(left.stage))[0].stage
        : STAGES[0];
      return {
        code: config.code,
        projectType: config.projectType,
        currentPhase: STAGE_LABELS[currentPhase],
        openToUser: true,
        stageDates: config.stageDates,
      };
    })
    .sort((left, right) => {
      if (left.code === "P26") return -1;
      if (right.code === "P26") return 1;
      if (left.projectType !== right.projectType) return left.projectType.localeCompare(right.projectType);
      return left.code.localeCompare(right.code);
    });
}
// @end-legacy-unit 40

// @legacy-unit 41 196
export function canonicalProjectConfigDefaults() {
  const currentPhase = STAGE_LABELS[STAGES[0]];
  return [
    ...G_YEAR_PROJECT_OPTIONS.map((code) => ({
      code,
      projectType: "G",
      currentPhase,
      openToUser: true,
      stageDates: {},
    })),
    ...NON_G_PROJECT_CODE_OPTIONS.map((code) => ({
      code,
      projectType: "Non-G",
      currentPhase: "EVT",
      openToUser: true,
      stageDates: {},
    })),
  ];
}
// @end-legacy-unit 41

// @legacy-unit 42 216
export function projectConfigSort(left, right) {
  const gLeft = G_YEAR_PROJECT_OPTIONS.indexOf(left.code);
  const gRight = G_YEAR_PROJECT_OPTIONS.indexOf(right.code);
  if (gLeft !== -1 || gRight !== -1) {
    if (gLeft === -1) return 1;
    if (gRight === -1) return -1;
    return gLeft - gRight;
  }
  if (left.projectType !== right.projectType) return left.projectType.localeCompare(right.projectType);
  return left.code.localeCompare(right.code);
}
// @end-legacy-unit 42

// @legacy-unit 43 228
export function mergeCanonicalProjectConfigs(configs = []) {
  const configMap = new Map();
  canonicalProjectConfigDefaults().forEach((config) => configMap.set(config.code, config));
  configs.forEach((config) => {
    const type = config?.projectType === "Non-G" ? "Non-G" : "G";
    const code = type === "Non-G"
      ? normalizeProjectCodeLabel(config?.code)
      : normalizeYearProjectLabel(config?.code);
    if (!code || PROJECT_REFERENCE_CODES.some((reference) => reference.toLowerCase() === String(config?.code || "").trim().toLowerCase())) return;
    configMap.set(code, {
      ...config,
      code,
      projectType: type,
      openToUser: config.openToUser !== false,
      stageDates: config.stageDates || {},
    });
  });
  return [...configMap.values()].sort(projectConfigSort);
}
// @end-legacy-unit 43

// @legacy-unit 44 248
export let projectConfigs;
export function initializeProjectConfigsBinding() {
  projectConfigs = mergeCanonicalProjectConfigs(Array.isArray(globalThis.REAL_PROJECT_CONFIGS) && globalThis.REAL_PROJECT_CONFIGS.length
  ? globalThis.REAL_PROJECT_CONFIGS
  : deriveProjectConfigsFromRealRecords().length
    ? deriveProjectConfigsFromRealRecords()
    : [
  {
    code: "P26",
    projectType: "G",
    currentPhase: "P1.0",
    openToUser: true,
    stageDates: { p10: "2026-02-19", p11: "2026-02-19", evt: "2026-02-19", dvt: "2026-03-09", pvt: "2026-04-23", mp: "2026-05-07" },
  },
  {
    code: "OR5",
    projectType: "Non-G",
    currentPhase: "EVT",
    openToUser: true,
    stageDates: { evt: "2026-03-20", dvt: "2026-04-17", pvt: "2026-05-15", mp: "2026-06-12" },
  },
]);
}
// @end-legacy-unit 44

// @legacy-unit 45 268
export let projectStageCalendarRecords;
export function initializeProjectStageCalendarRecordsBinding() {
  projectStageCalendarRecords = projectConfigs.flatMap((project) => Object.entries(project.stageDates || {}).map(([phase, lineOpenDate]) => ({
  yearProject: project.code,
  projectCode: "",
  phase,
  lineOpenDate,
  updatedBy: "System seed",
  updatedAt: "",
})));
}
// @end-legacy-unit 45

// @legacy-unit 49 279
export let DEMAND_STAGE_ORDER;
export function initializeDEMAND_STAGE_ORDERBinding() {
  DEMAND_STAGE_ORDER = ["p0", ...STAGES];
}
// @end-legacy-unit 49

// @legacy-unit 50 280
export let QUOTE_EXPIRING_SOON_DAYS;
export function initializeQUOTE_EXPIRING_SOON_DAYSBinding() {
  QUOTE_EXPIRING_SOON_DAYS = 7;
}
// @end-legacy-unit 50

// @legacy-unit 598 4363
export function refreshProjectCodes() {
  replacePROJECTSBinding(projectConfigs.map((project) => project.code));
}
// @end-legacy-unit 598

// @legacy-unit 599 4367
export function normalizeProjectCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}
// @end-legacy-unit 599

// @legacy-unit 600 4371
export function phaseKeyFromInput(value) {
  const text = String(value || "").trim();
  const normalized = text.toLowerCase().replace(/[\s_-]+/g, "");
  const aliases = {
    p10: "p10",
    p1: "p10",
    "p1.0": "p10",
    p11: "p11",
    "p1.1": "p11",
    evt: "evt",
    dvt: "dvt",
    pvt: "pvt",
    mp: "mp",
  };
  return aliases[normalized] || "";
}
// @end-legacy-unit 600

// @legacy-unit 601 4388
export function currentPhaseLabelForProject(projectCode) {
  const phase = projectConfigFor(projectCode)?.currentPhase || STAGE_LABELS[STAGES[0]];
  const standardPhase = phaseKeyFromInput(phase);
  return standardPhase ? stageLabel(standardPhase) : phase;
}
// @end-legacy-unit 601

// @legacy-unit 602 4394
export function nextBuyPhaseLabelForProject(projectCode) {
  const nextStage = nextBuyStageForProject(projectCode);
  return nextStage ? stageLabel(nextStage) : "Manager-defined phase";
}
// @end-legacy-unit 602

// @legacy-unit 603 4399
export function projectConfigFor(projectCode) {
  const normalized = normalizeYearProjectLabel(projectCode);
  const nonGCode = normalizeProjectCodeLabel(projectCode);
  return projectConfigs.find((project) => project.code === normalized || project.code === nonGCode) || null;
}
// @end-legacy-unit 603

// @legacy-unit 604 4405
export function projectTypeFor(projectCode) {
  return projectConfigFor(projectCode)?.projectType || projectTypeForScopeCode(projectCode) || "G";
}
// @end-legacy-unit 604

// @legacy-unit 605 4409
export function projectTypeForRow(row = {}) {
  if (row.projectType === "Non-G" || row.sourceSheet === "NON G MVA EQ request") return "Non-G";
  if (row.projectType === "G" || row.sourceSheet === "G Project MVA EQ Request") return "G";
  const targetProject = row.targetYearProject || row.targetProject || "";
  if (targetProject) return projectTypeFor(targetProject);
  return projectTypeFor(row.yearProject || row.project || row.projectCode || row.sourceProject || "");
}
// @end-legacy-unit 605

// @legacy-unit 606 4417
export function yearProjectForRow(row = {}) {
  const type = projectTypeForRow(row);
  if (type === "Non-G") return normalizeProjectCodeLabel(row.targetProjectCode || row.targetProject || row.projectCode || row.project || row.sourceProject || "") || "-";
  return normalizeYearProjectLabel(row.targetYearProject || row.yearProject || row.targetProject || row.project || "") || "-";
}
// @end-legacy-unit 606

// @legacy-unit 607 4423
export function projectCodeForRow(row = {}) {
  const type = projectTypeForRow(row);
  const candidates = type === "Non-G"
    ? [row.targetProjectCode, row.projectCode, row.targetProject, row.project, row.sourceProject, row.actualProject]
    : [row.targetProjectCode, row.projectCode, row.sourceProject, row.actualProject];
  return candidates.map(normalizeProjectCodeLabel).find(Boolean) || "";
}
// @end-legacy-unit 607

// @legacy-unit 608 4431
export function rowMatchesCurrentRequesterProjectScope(row = {}) {
  if (yearProjectForRow(row) !== currentProject) return false;
  const projectCode = projectCodeForRow(row);
  return !currentProjectCode || !projectCode || projectCode === currentProjectCode;
}
// @end-legacy-unit 608

// @legacy-unit 609 4437
export function projectScopeLabel(row = {}, { includeLine = false } = {}) {
  const yearProject = yearProjectForRow(row);
  const projectCode = projectCodeForRow(row);
  const parts = [yearProject];
  if (projectCode && projectCode !== yearProject) parts.push(projectCode);
  if (includeLine) parts.push(row.requestLine || row.line || "Line 1");
  return parts.filter(Boolean).join(" / ");
}
// @end-legacy-unit 609

// @legacy-unit 610 4446
export function projectCodesForYearProject(yearProject = currentProject) {
  const configuredCodes = projectCodeOptionsForScope({
    projectType: currentProjectType,
    yearProject,
  });
  if (configuredCodes.length) return configuredCodes;
  const values = new Set();
  const matches = (row) => yearProjectForRow(row) === yearProject;
  [...purchaseRecords, ...requests].forEach((row) => {
    if (!matches(row)) return;
    const code = projectCodeForRow(row);
    if (code) values.add(code);
  });
  if (currentProjectType === "Non-G" && yearProject && !values.size) values.add(yearProject);
  return [...values].sort((left, right) => String(left).localeCompare(String(right)));
}
// @end-legacy-unit 610

// @legacy-unit 647 4822
export function currentStageForProject(project) {
  return phaseKeyFromInput(projectConfigFor(project)?.currentPhase) || STAGES[0];
}
// @end-legacy-unit 647

// @legacy-unit 648 4826
export function nextBuyStageForProject(project) {
  const currentStage = phaseKeyFromInput(projectConfigFor(project)?.currentPhase);
  if (!currentStage) return "";
  const currentIndex = STAGES.indexOf(currentStage);
  if (currentIndex < 0) return "";
  return STAGES[Math.min(currentIndex + 1, STAGES.length - 1)];
}
// @end-legacy-unit 648

export function replaceProjectConfigsBinding(value) { projectConfigs = value; return value; }

export function replaceProjectStageCalendarRecordsBinding(value) { projectStageCalendarRecords = value; return value; }
