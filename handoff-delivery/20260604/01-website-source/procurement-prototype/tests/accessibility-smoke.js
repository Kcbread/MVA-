const { chromium } = require("playwright");
const axe = require("axe-core");

const targetViews = [
  { role: "requester", view: "department", label: "Requester" },
  { role: "manager", view: "manager", label: "Manager B" },
  { role: "omLeader", view: "om", label: "OM Purchasing" },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${process.cwd()}/index.html`);
  await page.waitForLoadState("domcontentloaded");
  await page.addScriptTag({ content: axe.source });

  for (const view of targetViews) {
    await page.evaluate(({ role, view }) => {
      if (typeof window.applyRole === "function") window.applyRole(role);
      if (typeof window.setView === "function") window.setView(view);
    }, view);
    const result = await page.evaluate(async () => window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa"],
      },
    }));
    const serious = result.violations.filter((item) => ["serious", "critical"].includes(item.impact));
    if (serious.length) {
      throw new Error(`${view.label} has serious accessibility violations: ${serious.map((item) => item.id).join(", ")}`);
    }
  }

  await browser.close();
})();
