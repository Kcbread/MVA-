const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const acorn = require("acorn");

const root = path.resolve(__dirname, "../..");

// The contract suite reads maintained source, never a frozen pre-refactor copy.
// Restore declaration order only so existing bounded text assertions can retain
// their start/end markers. Actual setter calls and business expressions are kept.
function readFrontendSource() {
  const sourceRoot = path.join(root, "src");
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, "module-manifest.json"), "utf8"));
  const pieces = new Map();
  const moduleBoundaries = [];
  for (const module of manifest.modules) {
    const source = fs.readFileSync(path.join(sourceRoot, module.name), "utf8");
    const pattern = /^\/\/ @legacy-unit (\d+) \d+\r?\n([\s\S]*?)^\/\/ @end-legacy-unit \1\s*$/gm;
    for (const match of source.matchAll(pattern)) {
      const index = Number(match[1]);
      assert.ok(!pieces.has(index), `Duplicate source unit ${index}`);
      pieces.set(index, { module: module.name, source: match[2].trimEnd() });
    }
    // New code (imports, ownership setters, compatibility and bootstrap) is
    // equally authoritative and must not disappear from source assertions.
    moduleBoundaries.push(source.replace(pattern, ""));
  }
  const expected = new Set();
  const ordered = [...manifest.units].sort((a, b) => a.index - b.index).map(unit => {
    assert.ok(!expected.has(unit.index), `Duplicate manifest unit ${unit.index}`);
    expected.add(unit.index);
    const piece = pieces.get(unit.index);
    assert.ok(piece, `Missing source unit ${unit.index} (${unit.name || unit.type})`);
    assert.equal(piece.module, unit.module, `Source unit ${unit.index} moved without updating manifest`);
    if (unit.type === "FunctionDeclaration") return piece.source.replace(/^export /, "");
    const ast = acorn.parse(piece.source, { ecmaVersion: "latest", sourceType: "module" });
    const initializer = ast.body.map(node => node.declaration || node).find(node => node.type === "FunctionDeclaration");
    assert.ok(initializer, `Source unit ${unit.index} has no initializer`);
    if (unit.type === "VariableDeclaration") {
      const assignment = initializer.body.body[0]?.expression;
      assert.equal(assignment?.type, "AssignmentExpression", `Source unit ${unit.index} initializer must assign its binding`);
      assert.equal(assignment.left.name, unit.name);
      return `${unit.kind} ${unit.name} = ${piece.source.slice(assignment.right.start, assignment.right.end)};`;
    }
    return piece.source.slice(initializer.body.start + 1, initializer.body.end - 1).trim();
  });
  assert.equal(pieces.size, expected.size, "All marked source units must be represented in the manifest");
  return [...ordered, ...moduleBoundaries].join("\n\n");
}

function readBackendSource() {
  const directory = path.join(root, "server-modules");
  const files = fs.readdirSync(directory, { recursive: true })
    .filter(file => file.endsWith(".js"))
    .sort();
  return ["server.js", ...files.map(file => path.join("server-modules", file))]
    .map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n\n");
}

module.exports = { readFrontendSource, readBackendSource };
