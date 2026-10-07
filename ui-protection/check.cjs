const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const manifest = require('./frontend-sha256.json');
const changed = Object.entries(manifest).filter(([file, hash]) => {
  const target = path.join(root, file);
  return !fs.existsSync(target) || crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex') !== hash;
});
if (changed.length) {
  console.error('Protected frontend changed:\n' + changed.map(([file]) => file).join('\n'));
  process.exitCode = 1;
} else console.log(`Protected frontend verified: ${Object.keys(manifest).length} files.`);
