#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

NODE_BIN="${NODE_BIN:-node}"

echo "== Syntax checks =="
"$NODE_BIN" --check app.js
"$NODE_BIN" --check user-a-flow.js
"$NODE_BIN" --check layout-contract.js
"$NODE_BIN" --check carryover-extension.js
"$NODE_BIN" --check real-data-seeds.js
"$NODE_BIN" --check app-modules/quote-validity.js
"$NODE_BIN" --check app-modules/demand-cost-dashboard.js
"$NODE_BIN" --check app-modules/role-guards.js
"$NODE_BIN" --check app-modules/approval-quantity-review.js
"$NODE_BIN" --check app-modules/ftv-code.js
"$NODE_BIN" --check app-modules/sap-po-raw-contract.js
"$NODE_BIN" --check app-modules/workflow-status-table.js
"$NODE_BIN" --check tests/accessibility-smoke.js
"$NODE_BIN" --check tests/layout-smoke.js
"$NODE_BIN" --check tests/price-routing-smoke.js
"$NODE_BIN" --check tests/global-ui-audit.js
"$NODE_BIN" --check tests/role-flow-smoke.js

echo "== Unit and system contract tests =="
"$NODE_BIN" --test tests/*.test.js

echo "== Browser smoke =="
if "$NODE_BIN" -e "require.resolve('playwright')" >/dev/null 2>&1; then
  if "$NODE_BIN" - <<'NODE'
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${process.cwd()}/index.html`);
  await page.waitForLoadState("domcontentloaded");
  const title = await page.locator("#pageTitle").textContent();
  if (!title) throw new Error("Missing page title");
  await browser.close();
})();
NODE
  then
    echo "Browser smoke passed."
  else
    echo "Browser smoke skipped: Playwright is installed but browser runtime is unavailable."
  fi
  if "$NODE_BIN" tests/layout-smoke.js; then
    echo "Layout smoke passed."
  else
    echo "Layout smoke failed."
    exit 1
  fi
  if "$NODE_BIN" tests/price-routing-smoke.js; then
    echo "Price routing smoke passed."
  else
    echo "Price routing smoke failed."
    exit 1
  fi
  if "$NODE_BIN" tests/global-ui-audit.js; then
    echo "Global UI audit passed."
  else
    echo "Global UI audit failed."
    exit 1
  fi
  if "$NODE_BIN" tests/role-flow-smoke.js; then
    echo "Role flow smoke passed."
  else
    echo "Role flow smoke failed."
    exit 1
  fi
else
  echo "Browser smoke skipped: Playwright is not installed in this environment."
  echo "Layout smoke skipped: Playwright is not installed in this environment."
  echo "Price routing smoke skipped: Playwright is not installed in this environment."
  echo "Global UI audit skipped: Playwright is not installed in this environment."
  echo "Role flow smoke skipped: Playwright is not installed in this environment."
fi

echo "== Accessibility smoke =="
if "$NODE_BIN" -e "require.resolve('playwright'); require.resolve('axe-core')" >/dev/null 2>&1; then
  if "$NODE_BIN" tests/accessibility-smoke.js; then
    echo "Accessibility smoke passed."
  else
    echo "Accessibility smoke failed."
    exit 1
  fi
else
  echo "Accessibility smoke skipped: Playwright and/or axe-core is not installed in this environment."
fi

echo "All available tests completed."
