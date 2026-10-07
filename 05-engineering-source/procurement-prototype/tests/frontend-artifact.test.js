const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

test('runtime artifact guard rejects changed source and changed bundle without build dependencies', () => {
  const { verifyFrontendArtifact } = require('../scripts/verify-frontend-artifact.cjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'procurement-artifact-test-'));
  const hash = s => crypto.createHash('sha256').update(s).digest('hex');
  try {
    fs.mkdirSync(path.join(root,'dist'));
    fs.mkdirSync(path.join(root,'src'));
    fs.writeFileSync(path.join(root,'src','entry.js'),'source');
    fs.writeFileSync(path.join(root,'dist','app.bundle.js'),'bundle');
    fs.writeFileSync(path.join(root,'dist','build-manifest.json'),JSON.stringify({
      schemaVersion:1, files:{'src/entry.js':hash('source'),'dist/app.bundle.js':hash('bundle')}
    }));
    assert.equal(verifyFrontendArtifact(root), true);
    fs.writeFileSync(path.join(root,'src','entry.js'),'changed');
    assert.throws(() => verifyFrontendArtifact(root), /src\/entry.js/);
    fs.writeFileSync(path.join(root,'src','entry.js'),'source');
    fs.writeFileSync(path.join(root,'dist','app.bundle.js'),'changed');
    assert.throws(() => verifyFrontendArtifact(root), /dist\/app.bundle.js/);
  } finally {
    fs.rmSync(root, {recursive:true,force:true});
  }
});
