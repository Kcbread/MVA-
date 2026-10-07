// projects/state: authoritative source; see docs/module-map.md.
import {
  projectConfigs
} from "./config.js";

// @legacy-unit 48 278
export let PROJECTS;
export function initializePROJECTSBinding() {
  PROJECTS = projectConfigs.map((project) => project.code);
}
// @end-legacy-unit 48

// @legacy-unit 223 1220
export let currentProject;
export function initializeCurrentProjectBinding() {
  currentProject = "P26";
}
// @end-legacy-unit 223

// @legacy-unit 224 1221
export let currentProjectCode;
export function initializeCurrentProjectCodeBinding() {
  currentProjectCode = "";
}
// @end-legacy-unit 224

// @legacy-unit 225 1222
export let currentProjectType;
export function initializeCurrentProjectTypeBinding() {
  currentProjectType = "G";
}
// @end-legacy-unit 225

export function replaceCurrentProjectTypeBinding(value) { currentProjectType = value; return value; }

export function replaceCurrentProjectBinding(value) { currentProject = value; return value; }

export function replacePROJECTSBinding(value) { PROJECTS = value; return value; }

export function replaceCurrentProjectCodeBinding(value) { currentProjectCode = value; return value; }
