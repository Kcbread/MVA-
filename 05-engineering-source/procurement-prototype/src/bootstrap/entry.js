import { installLegacyGlobals } from '../compat/legacy-global.js';
import { initializeApplication } from './initialize.js';

let started = false;

export function start() {
  if (started) return;
  started = true;
  installLegacyGlobals();
  initializeApplication();
}
