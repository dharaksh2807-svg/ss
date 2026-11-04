import {chromium} from 'playwright';
import assert from 'node:assert/strict';import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-gl=angle','--use-angle=metal']});
try{
 const results=[];
 for(const [width,height]of[[1440,900],[1366,768],[390,844],[844,390],[768,1024]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000});const page=await context.newPage();const errors=[],docs=[],ws=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())docs.push(r.url());});page.on('websocket',socket=>ws.push(socket.url()));
  await page.goto(process.env.PRODUCTION_TEST_URL || 'http://127.0.0.1:3099');await page.locator('#start-play-btn').waitFor();
  assert.equal(await page.evaluate(()=>typeof window.__METRO_GAME__),'undefined','production has no developer game global');
  for(const [button,modal]of[['start-shop-btn','shop-modal'],['cust-runner-btn','character-select-modal'],['cust-board-btn','hoverboard-select-modal'],['cust-world-btn','environment-modal'],['start-missions-btn','missions-modal'],['start-events-btn','events-modal'],['start-practice-btn','practice-modal'],['start-profile-btn','profile-modal']]){
   await page.locator('#'+button).click();assert.ok(await page.locator('#'+modal).isVisible());await page.keyboard.press('Escape');assert.ok(await page.locator('#start-screen').isVisible());assert.equal(await page.evaluate(()=>document.activeElement.id),button);
  }
  await page.locator('#start-achievements-btn').click();assert.match(await page.locator('.missions-tab-btn.active').innerText(),/ACHIEVEMENTS/);await page.keyboard.press('Escape');
  await page.locator('#start-profile-btn').click();await page.locator('#profile-daily-rewards-btn').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'profile-daily-rewards-btn');await page.keyboard.press('Escape');
  await page.locator('#mode-toggle-hard').click();await page.locator('#start-play-btn').click();await page.keyboard.press('KeyB');await page.keyboard.press('ArrowRight');await page.keyboard.press('KeyP');assert.ok(await page.locator('#pause-modal').isVisible());await page.keyboard.press('KeyP');assert.equal(await page.locator('#pause-modal').isVisible(),false);await page.keyboard.press('Escape');await page.locator('#pause-menu-btn').click();assert.ok(await page.locator('#start-screen').isVisible());
  assert.deepEqual(errors,[]);assert.equal(docs.length,1,'no unexpected document navigation');assert.deepEqual(ws,[],'no production HMR socket');
  results.push({width,height,errors,documentLoads:docs.length,websockets:ws.length});console.log(`PASS production ${width}x${height}`);await context.close();
 }
 fs.writeFileSync(process.env.PRODUCTION_OUTPUT || '/tmp/metro-task9/production-results.json',JSON.stringify({browser:browser.version(),results},null,2));
 console.log('VERDICT: PASS');
}finally{await browser.close();}
