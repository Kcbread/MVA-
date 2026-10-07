// One-time characterization against the explicitly retained local backup.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const backup = path.join(root,'test-artifacts/modularization-backup/frontend');
const artifacts = path.join(root,'test-artifacts/modularization-parity');

(async () => {
  fs.mkdirSync(artifacts,{recursive:true});
  const base = pathToFileURL(root+path.sep).href;
  const oldScript = pathToFileURL(path.join(backup,'app.js')).href;
  const html = fs.readFileSync(path.join(backup,'index.html'),'utf8')
    .replace('<head>',`<head><base href="${base}">`)
    .replace(/\.\/app\.js\?v=[^"']+/,oldScript);
  const fixture = path.join(artifacts,'before.html');
  fs.writeFileSync(fixture,html);
  const browser = await chromium.launch({headless:true,channel:process.env.DEMO_BROWSER_CHANNEL||'msedge'});
  const pages = [];
  try {
    for(const url of [pathToFileURL(fixture).href,pathToFileURL(path.join(root,'index.html')).href]) {
      const context = await browser.newContext({viewport:{width:1440,height:1000}});
      await context.addInitScript(() => {
        const OriginalDate = Date;
        const time = Date.parse('2026-09-09T05:00:00Z');
        window.Date = class extends OriginalDate {constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}};
        let seed=17;
        Math.random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
      });
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(url);
      await page.waitForFunction(()=>typeof window.applyRole==='function');
      await page.waitForTimeout(500);
      pages.push({page,errors});
    }
    const scopes=[['requester','department'],['dri','priceReview'],['manager','manager'],['projectDri','priceReview'],['omLeader','om'],['omMember','om'],['admin','admin'],['buyer','buyer']];
    const report=[];
    for(const [role,view] of scopes){
      const snapshots=[];
      for(const {page} of pages){
        await page.evaluate(({role,view})=>{setScreen('workspace');applyRole(role);setView(view);},{role,view});
        await page.waitForTimeout(200);
        snapshots.push(await page.evaluate(()=>({
          title:document.querySelector('#pageTitle')?.textContent,
          text:document.body.innerText.replace(/\s+/g,' ').trim(),
          tables:[...document.querySelectorAll('table')].filter(t=>t.getBoundingClientRect().height>0).map(t=>({
            id:t.id,head:t.querySelector('thead')?.textContent.replace(/\s+/g,' ').trim(),
            rows:t.querySelectorAll('tbody tr').length,
            widths:[...t.querySelectorAll('thead tr:first-child th')].map(th=>Math.round(th.getBoundingClientRect().width))
          }))
        })));
      }
      fs.writeFileSync(path.join(artifacts,role+'.json'),JSON.stringify(snapshots,null,2));
      assert.deepEqual(snapshots[1],snapshots[0],`${role} rendered content/table geometry changed`);
      report.push({role,view,parity:'pass'});
    }
    for(const [index,{page}] of pages.entries()){
      await page.evaluate(()=>{applyRole('requester');setView('department');setDeptTab('request');openRequestItemPicker();});
      await page.locator('#requestItemPickerQuery').fill('usb');
      await page.screenshot({path:path.join(artifacts,index?'after-search.png':'before-search.png'),fullPage:false});
    }
    assert.deepEqual(pages[1].errors,pages[0].errors,'New runtime errors compared with backup');
    fs.writeFileSync(path.join(artifacts,'report.json'),JSON.stringify({scopes:report,baselineErrors:pages[0].errors,currentErrors:pages[1].errors},null,2));
    console.log('PASS: eight role/view rendered texts, table columns/widths/row counts match the pre-refactor backup.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
