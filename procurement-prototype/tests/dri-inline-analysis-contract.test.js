const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const styles = fs.readFileSync("styles.css", "utf8");
const approvalQuantityModule = fs.readFileSync("app-modules/approval-quantity-review.js", "utf8");

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert.notEqual(startIndex, -1, `Missing start marker ${start}`);
  assert.notEqual(endIndex, -1, `Missing end marker ${end}`);
  return source.slice(startIndex, endIndex);
}

test("Price Review is approval-only and Project Status owns Excel-like tracking matrices", () => {
  const priceReviewView = between(
    html,
    '<section class="view" data-view="priceReview"',
    '<section class="view" data-view="buyer"'
  );
  const projectStatusView = between(
    html,
    '<section class="view" data-view="projectStatus">',
    '<section class="view active" data-view="department">'
  );

  assert.match(priceReviewView, /data-price-review-tab="pending"/);
  assert.match(priceReviewView, /data-price-review-tab="history"/);
  assert.doesNotMatch(priceReviewView, /data-price-review-tab="projectReview"/);
  assert.doesNotMatch(priceReviewView, /id="priceReviewInlineAnalysis"/);
  assert.doesNotMatch(priceReviewView, /id="priceReviewApprovedAnalysis"/);
  assert.doesNotMatch(priceReviewView, /data-approval-quantity-tab=/);
  assert.doesNotMatch(priceReviewView, /Project Context/);

  assert.match(projectStatusView, /Project Status/);
  assert.match(projectStatusView, /data-project-status-panel="dashboard"[\s\S]*id="projectStatusDashboardRows"/);
  assert.match(projectStatusView, /data-project-status-panel="mfg"[\s\S]*id="projectStatusMfgMatrixTable"/);
  assert.match(projectStatusView, /data-project-status-panel="nonMfg"[\s\S]*id="projectStatusNonMfgMatrixTable"/);
  assert.match(projectStatusView, /manager-quantity-table manager-quantity-wide-table/);
  assert.doesNotMatch(projectStatusView, /data-project-status-tab=/);
  assert.match(styles, /\.project-status-stack/);
  assert.doesNotMatch(styles, /\.project-status-panel\s*\{[\s\S]*display:\s*none/);
});

test("approval evidence keeps Review Status wording and Project Status matrix stays read-only", () => {
  const projectStatusView = between(
    html,
    '<section class="view" data-view="projectStatus">',
    '<section class="view active" data-view="department">'
  );
  assert.match(app, /<th>Review Status<\/th>/);
  assert.match(approvalQuantityModule, /<th>Review Status<\/th>/);
  assert.doesNotMatch(approvalQuantityModule, /Project Status/);
  assert.doesNotMatch(projectStatusView, /data-price-review-decision|data-cost-manager-authorization|omPrepare|omMarkExported/);
  assert.match(app, /function renderProjectStatusMatrixDetail/);
  assert.match(app, /function sanitizeProjectStatusMatrixTable/);
  assert.match(app, /syncProjectStatusScopeFromRow\(selectedRow\)/);
});
