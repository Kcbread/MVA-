// Runtime-safe: Node built-ins only; also runs in npm ci --omit=dev images.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function verifyFrontendArtifact(root = path.resolve(__dirname, '..')) {
  const manifestPath = path.join(root, 'dist/build-manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('Missing frontend build. Run npm run build.');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || !manifest.files?.['dist/app.bundle.js']) throw new Error('Invalid frontend build manifest.');
  for (const [relative, expected] of Object.entries(manifest.files)) {
    const file = path.resolve(root, relative);
    if (!file.startsWith(path.resolve(root) + path.sep)) throw new Error('Invalid build input path.');
    const actual = fs.existsSync(file) ? crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') : '';
    if (actual !== expected) throw new Error(`Stale frontend artifact: ${relative}. Run npm run build.`);
  }
  return true;
}

if (require.main === module) {
  try { verifyFrontendArtifact(); console.log('Frontend source/artifact hashes verified.'); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { verifyFrontendArtifact };
