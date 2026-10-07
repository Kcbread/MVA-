const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readFrontendSource } = require("./helpers/read-application-source");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = readFrontendSource();
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("workspace provides one semantic workflow sidebar and keeps legacy navigation as a hidden source", () => {
  assert.match(html, /id="workflowSidebar"/);
  assert.match(html, /class="tabs source-main-tabs"/);
  assert.match(styles, /\.source-main-tabs[\s\S]*?display:\s*none\s*!important/);
});

test("every production login role has an explicit semantic navigation definition", () => {
  assert.match(app, /const semanticNavigationByRole\s*=\s*\{/);
  for (const role of ["requester", "dri", "manager", "projectDri", "omLeader", "omMember", "buyer", "admin"]) {
    assert.match(app, new RegExp(`\\b${role}:\\s*\\[`), `${role} requires a navigation definition`);
  }
});

test("OM Purchasing workflow follows business order with no duplicate subtitle aliases", () => {
  const omStart = app.indexOf("omMember: [");
  const omEnd = app.indexOf("buyer: [", omStart);
  const omNavigation = app.slice(omStart, omEnd);
  const labels = ["My Intake", "My Quote Result", "Quotation DB", "OM Handoff"];
  let previousIndex = -1;
  for (const label of labels) {
    const index = omNavigation.indexOf(`label: \"${label}\"`);
    assert.ok(index > previousIndex, `${label} must follow the approved workflow order`);
    previousIndex = index;
  }
  assert.doesNotMatch(omNavigation, /Intake & PAS|Quote Matching|Quotation Database|Handoff & Tracking/);
});

test("semantic navigation reuses existing setters and resynchronizes active state", () => {
  assert.match(app, /function renderSemanticNavigation\(/);
  assert.match(app, /function syncSemanticNavigationActiveState\(/);
  assert.match(app, /data-dept-tab/);
  assert.match(app, /data-manager-tab/);
  assert.match(app, /data-om-tab/);
  assert.match(app, /syncSemanticNavigationActiveState\(\)/);
});

test("semantic navigation escapes text and attributes with the project's defined helpers", () => {
  assert.doesNotMatch(app, /\bescapeHtml\(/);
  assert.match(app, /aria-label="\$\{htmlAttr\(group\.label\)\}"/);
  assert.match(app, />\$\{htmlText\(item\.label\)\}<\/button>/);
});

test("compact shell uses a desktop sidebar and a narrow horizontal fallback", () => {
  assert.match(styles, /\.screen\.app-screen\.active[\s\S]*?grid-template-columns:\s*220px\s+minmax\(0,\s*1fr\)/);
  assert.match(styles, /\.workflow-sidebar/);
  assert.match(styles, /\.workflow-nav-item\.active/);
  assert.match(styles, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.workflow-sidebar[\s\S]*?overflow-x:\s*auto/);
  assert.match(styles, /\.semantic-source-tabs[\s\S]*?display:\s*none\s*!important/);
});
