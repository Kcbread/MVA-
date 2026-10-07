const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
let count = 0;
for (const dir of ['src', 'server-modules']) {
  for (const file of fs.readdirSync(path.join(root, dir), {recursive:true}).filter(file => file.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check',path.join(root,dir,file)], {encoding:'utf8'});
    if (result.status !== 0) { process.stderr.write(result.stderr || result.error?.message || 'Syntax check failed'); process.exit(1); }
    count++;
  }
}
console.log(`Module syntax: ${count} files passed.`);
