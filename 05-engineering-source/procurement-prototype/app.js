// Application entry only. Business code lives in src/; npm run build creates dist/.
// Classic scripts intentionally preserve direct file:// preview support.
if (!globalThis.ProcurementRuntime) {
  throw new Error('Frontend bundle is missing. Run npm run build and reload.');
}
globalThis.ProcurementRuntime.start();
