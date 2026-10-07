const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createApplication } = require('../server-modules/application');

(async () => {
  // Real HTTP/browser path with isolated demo storage; no external MySQL writes.
  const app = createApplication({pool:null});
  const server = app.createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({headless:true,...(process.env.DEMO_BROWSER_CHANNEL?{channel:process.env.DEMO_BROWSER_CHANNEL}:{})});
  try {
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const base=`http://127.0.0.1:${server.address().port}`;
    const bundle=page.waitForResponse(r=>r.url().includes('/dist/app.bundle.js'));
    await page.goto(`${base}/05-engineering-source/procurement-prototype/`);
    assert.equal((await bundle).status(),200);
    await page.locator('#roleSelect').selectOption('requester');
    const login=page.waitForResponse(r=>r.url().endsWith('/api/login'));
    await page.locator('#loginForm button[type="submit"]').click();
    assert.equal((await login).status(),200);
    await page.waitForSelector('[data-screen="workspace"].active');
    await page.locator('[data-action="openRequestItemPicker"]').click();
    await page.waitForSelector('[data-add-worksheet-source]');
    const before=await page.evaluate(()=>requests.length);
    await page.locator('[data-add-worksheet-source]').first().click();
    await page.waitForFunction(n=>requests.length===n+1,before);
    const row=await page.evaluate(()=>requests.at(-1));
    assert.ok(row.id);
    assert.ok(row.name);
    assert.deepEqual(errors,[]);
    console.log('PASS: HTTP bundle, real login/session, catalog picker and existing item to demand (isolated memory backend).');
  } finally {
    await browser.close();
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
