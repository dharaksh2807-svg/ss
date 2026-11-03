import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const out = process.env.RESPONSIVE_SCREENSHOT_DIR || '/tmp/metro-responsive-evidence';
fs.mkdirSync(out, { recursive: true });
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH || fs.existsSync(chrome) ? { executablePath: process.env.CHROME_PATH || chrome } : {}), args: ['--use-gl=angle', '--use-angle=metal', '--no-sandbox'] });
const matrix = [[1920,1080],[1440,900],[1366,768],[1280,720],[1024,768],[360,800],[390,844],[430,932],[800,360],[844,390],[768,1024],[820,1180],[1180,820]];
try {
 const context = await browser.newContext(); const page = await context.newPage();
 const errors: string[] = [], results: any[] = [];
 page.on('pageerror', error => errors.push(error.message));
 page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
 await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
 await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3012'); await page.waitForFunction(() => !!(window as any).__METRO_GAME__);
 const routes: [string,string,string?][] = [['Home','start-screen'],['Shop','shop-modal','OPEN_SHOP'],['Runner','character-select-modal','OPEN_CHARACTERS'],['Board','hoverboard-select-modal','OPEN_BOARDS'],['Worlds','environment-modal','OPEN_ENVIRONMENT_SELECT'],['Missions','missions-modal','OPEN_MISSIONS'],['Achievements','missions-modal','OPEN_MISSIONS'],['Settings','settings-modal','OPEN_SETTINGS'],['Pause','pause-modal'],['GameOver','game-over-modal'],['HUD','hud']];
 for(const [width,height] of matrix) {
  await page.setViewportSize({width,height});
  for(const [name,id,event] of routes.filter(route=>!process.env.UI_SCREEN_FILTER||process.env.UI_SCREEN_FILTER.split(',').includes(route[0]))) {
   await page.evaluate(({name,event})=>{
    const g=(window as any).__METRO_GAME__, bus=(window as any).__METRO_BUS__;
    if(event) bus.emit(event,'START');
    if(name==='Achievements') g.missionsModal.switchTab('ACHIEVEMENTS');
    if(name==='Missions') g.missionsModal.switchTab('MISSIONS');
    if(name==='Pause'){g.startScreen.hide();g.lifecycleState='PAUSED';g.pauseModal.show();}
    if(name==='GameOver'){g.startScreen.hide();g.lifecycleState='GAMEOVER';g.gameOverModal.show(0,0,0,'NORMAL');}
    if(name==='HUD'){
      g.startScreen.hide(); g.lifecycleState='PAUSED';g.hud.reset();g.hud.show();
      bus.emit('SCORE_UPDATED',1234567);bus.emit('DISTANCE_TRAVELED',12345);bus.emit('KEYS_UPDATED',3);
      // Freeze only the test fixture's power-up states; gameplay is never started.
      for(const type of ['MAGNET','JETPACK','SNEAKERS','MULTIPLIER','SHIELD']) g.player.powerups.activate(type);
      g.hud.update(0);g.hud.setMode('TIME_TRIAL');g.hud.setTimeTrialTime(45);
      bus.emit('COMBO_UPDATED',{combo:8,tier:'FLOW',tierLabel:'FLOW',label:'Clean streak',color:'#67d9e9',windowRemaining:3,windowDuration:5});
    }
   },{name,event});
   await page.waitForTimeout(230);
   const result=await page.evaluate(({name,id})=>{
    const root=document.getElementById(id)!; const problems:string[]=[], small:string[]=[];
    const view=(el:Element)=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom};};
    const visible=(el:Element)=>!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
    const scrollTo=(el:HTMLElement)=>{let ancestor=el.parentElement;while(ancestor&&ancestor!==root.parentElement){const style=getComputedStyle(ancestor);if(/auto|scroll/.test(style.overflowY)&&ancestor.scrollHeight>ancestor.clientHeight){const b=el.getBoundingClientRect(), a=ancestor.getBoundingClientRect();if(b.top<a.top)ancestor.scrollTop+=b.top-a.top;if(b.bottom>a.bottom)ancestor.scrollTop+=b.bottom-a.bottom;}ancestor=ancestor.parentElement;}};
    const panel=root.querySelector<HTMLElement>('.showroom-panel,.modal-card');
    if(panel){const b=view(panel);if(b.x<-.5||b.y<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5)problems.push('panel outside viewport');}
    const buttons=[...root.querySelectorAll<HTMLElement>('button,[role="button"]')].filter(visible);
    const inspectButton=(button:HTMLElement)=>{
     scrollTo(button);const b=view(button);if(!b.w||!b.h)return;
     const label=button.id||button.textContent?.trim().slice(0,50)||button.className;
     if(b.x<-.5||b.y<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5)problems.push('offscreen: '+label);
     const hit=document.elementFromPoint(b.x+b.w/2,b.y+b.h/2);
     if(!hit||!(hit===button||button.contains(hit)))problems.push('covered: '+label);
     if(button.scrollWidth>button.clientWidth+2||button.scrollHeight>button.clientHeight+2)problems.push('clipped text: '+label);
     if(b.h<40||b.w<40)small.push(label+` (${Math.round(b.w)}x${Math.round(b.h)})`);
    };
    for(const button of buttons)inspectButton(button);
    if(name==='Shop'||name==='Missions'){
      const selector=name==='Shop'?'#shop-tabs .arcade-tab-btn':'#missions-tabs .missions-tab-btn';
      for(const tab of root.querySelectorAll<HTMLButtonElement>(selector)){tab.click();for(const button of [...root.querySelectorAll<HTMLElement>('button,[role="button"]')].filter(visible))inspectButton(button);}
      root.querySelector<HTMLButtonElement>(selector)!.click();
    }
    if(name==='Settings'){
      for(const tab of root.querySelectorAll<HTMLButtonElement>('.settings-tab-btn')){tab.click();for(const button of [...root.querySelectorAll<HTMLElement>('button,[role="button"]')].filter(visible))inspectButton(button);}
      root.querySelector<HTMLButtonElement>('#tab-btn-controls')!.click();
    }
    // Reset only actual scrolling surfaces before screenshotting.
    for(const el of root.querySelectorAll<HTMLElement>('*'))if(/auto|scroll/.test(getComputedStyle(el).overflowY))el.scrollTop=0;
    if(name==='Home'){
      const groups=['.lobby-top-bar','.lobby-hero-actions','#lobby-bottom-dock'];
      for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){const a=root.querySelector(groups[i]),b=root.querySelector(groups[j]);if(a&&b){const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>4&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>4)problems.push('home regions overlap: '+groups[i]+' / '+groups[j]);}}
    }
    if(name==='HUD'){
      const critical=['hud-score','hud-coins','hud-distance','hud-keys','hud-board-charges','hud-pause-btn'];
      for(const key of critical){const el=document.getElementById(key);if(!el||!visible(el))problems.push('missing HUD metric: '+key);else{const b=view(el);if(b.x<0||b.y<0||b.right>innerWidth||b.bottom>innerHeight)problems.push('HUD metric offscreen: '+key);}}
      const regions=['.hud-stats-left','.hud-stats-right','.hud-run-meta','.hud-mode-badge','.hud-skill-combo-widget'];
      const overlaps=(a:DOMRect,b:DOMRect)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>4&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>4;
      for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){const a=root.querySelector(regions[i]),b=root.querySelector(regions[j]);if(a&&b&&visible(a)&&visible(b)&&overlaps(a.getBoundingClientRect(),b.getBoundingClientRect()))problems.push('HUD regions overlap: '+regions[i]+' / '+regions[j]);}
      for(const notice of root.querySelectorAll('.hud-notices,.hud-notices .progression-toast,.hud-notices .first-use-guidance-toast')){
        if(!visible(notice))continue;
        const nb=notice.getBoundingClientRect();if(nb.left<0||nb.right>innerWidth)problems.push('HUD notice outside viewport');
        for(const selector of ['.hud-powerups-stack','.hud-skill-combo-widget','.hud-board-btn','.touch-controls-bar']){const el=root.querySelector(selector);if(el&&visible(el)&&overlaps(nb,el.getBoundingClientRect()))problems.push('HUD notices overlap: '+selector);}
      }
      const corridor={left:innerWidth*.36,right:innerWidth*.64,top:innerHeight*.28,bottom:innerHeight*.68} as DOMRect;
      for(const selector of ['.hud-powerups-stack','.hud-notices','.hud-mode-badge','.hud-skill-combo-widget','.hud-mission-ticker']){const el=root.querySelector(selector);if(el&&visible(el)&&overlaps(el.getBoundingClientRect(),corridor))problems.push('HUD covers route center: '+selector);}
      for(const el of root.querySelectorAll<HTMLElement>('.powerup-duration-card,.powerup-hud-card,.powerup-badge'))if(visible(el)){const b=view(el);if(b.right>innerWidth||b.bottom>innerHeight)problems.push('power-up outside viewport');}
    }
    return {name,width:innerWidth,height:innerHeight,problems:[...new Set(problems)],small:[...new Set(small)],buttons:buttons.length};
   },{name,id});
   results.push(result);
   if([[1440,900],[390,844],[800,360],[768,1024]].some(([w,h])=>w===width&&h===height)&&['Home','Runner','Settings','HUD','GameOver'].includes(name))await page.screenshot({path:path.join(out,`${width}x${height}-${name.toLowerCase()}.png`)});
   await page.evaluate(({name,event})=>{
    const g=(window as any).__METRO_GAME__,bus=(window as any).__METRO_BUS__;
    if(event)bus.emit('UI_BACK');
    if(name==='Pause'){g.pauseModal.hide();g.lifecycleState='MENU';g.startScreen.show();}
    if(name==='GameOver'){g.gameOverModal.hide();g.lifecycleState='MENU';g.startScreen.show();}
    if(name==='HUD'){g.hud.hide();g.player.powerups.reset();g.lifecycleState='MENU';g.startScreen.show();}
   },{name,event});
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors},null,2));
  console.log(`${width}x${height}: ${results.slice(-routes.length).filter(r=>r.problems.length).map(r=>r.name+': '+r.problems.join('; ')).join(' | ')||'PASS'}`);
 }
 // Browser-emulated safe areas and reduced motion are separate from physical-device coverage.
 await page.setViewportSize({width:390,height:844});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{const root=document.documentElement;for(const [key,value] of Object.entries({'--ui-top':'28px','--ui-bottom':'26px','--ui-left':'32px','--ui-right':'32px'}))root.style.setProperty(key,value);(window as any).__METRO_BUS__.emit('OPEN_SHOP','START');});
 const safe=await page.evaluate(()=>{const b=document.querySelector('.shop-card')!.getBoundingClientRect();const animation=getComputedStyle(document.querySelector('#shop-modal .shop-card')!).animationName;return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,animation};});
 assert.ok(safe.left>=32&&safe.right<=390-32&&safe.top>=28&&safe.bottom<=844-26,'simulated safe-area boundaries');
 assert.equal(safe.animation,'none','reduced motion disables modal animation');
 await page.locator('#shop-close-btn').focus();await page.keyboard.press('Tab');
 assert.ok(await page.evaluate(()=>parseFloat(getComputedStyle(document.activeElement!).outlineWidth)>=2),'keyboard focus remains visible');
 await page.evaluate(()=>{(window as any).__METRO_BUS__.emit('UI_BACK');for(const key of ['--ui-top','--ui-bottom','--ui-left','--ui-right'])document.documentElement.style.removeProperty(key);});
 await page.emulateMedia({reducedMotion:'no-preference'});
 // A real browser touch gesture must scroll the menu rather than reach the gameplay canvas.
 const touchContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const touchPage=await touchContext.newPage();await touchPage.addInitScript(()=>{(window as any).__name=(fn:any)=>fn;});
 await touchPage.goto(process.env.UI_TEST_URL||'http://127.0.0.1:3012');await touchPage.waitForFunction(()=>!!(window as any).__METRO_GAME__);
 await touchPage.locator('#start-shop-btn').tap();await touchPage.waitForTimeout(250);
 const cdp=await touchContext.newCDPSession(touchPage);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:700}]});
 for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y:700-i*25}]});await touchPage.waitForTimeout(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await touchPage.waitForTimeout(150);
 assert.ok(await touchPage.locator('#shop-content').evaluate(el=>el.scrollTop)>0,'touch gesture scrolls open Shop');
 await touchContext.close();
 // Capture the HUD over an actual run camera; freeze the simulation only for inspection.
 for(const [width,height] of [[1440,900],[390,844],[800,360]]){
  await page.setViewportSize({width,height});await page.locator('#start-play-btn').click();
  await page.evaluate(()=>{const g=(window as any).__METRO_GAME__;g.openingSequence.skip();});await page.waitForTimeout(120);
  const distanceMatches=await page.evaluate(()=>{const g=(window as any).__METRO_GAME__;g.pause();g.pauseModal.hide();g.player.powerups.activate('MAGNET');g.player.powerups.activate('SHIELD');g.hud.update(0);return document.getElementById('hud-distance')!.textContent===`${Math.floor(g.player.distanceTraveled).toLocaleString()} m`;});
  assert.equal(distanceMatches,true,'HUD distance agrees with the actual player run');
  await page.waitForTimeout(250);await page.screenshot({path:path.join(out,`${width}x${height}-run-hud.png`)});
  await page.evaluate(()=>(window as any).__METRO_GAME__.goToMenu());
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,errors,supplemental:{safeAreas:'PASS (simulated CSS insets)',reducedMotion:'PASS',keyboardFocus:'PASS',touchMenuScroll:'PASS (browser-emulated gesture)',actualRunDistance:'PASS'}},null,2));
 assert.deepEqual(errors,[],'No runtime/console errors');
 if(!process.env.UI_AUDIT_ONLY){assert.deepEqual(results.filter(r=>r.problems.length),[],'Critical responsive layouts');}
 console.log(`VERDICT: ${results.some(r=>r.problems.length)?'FAIL':'PASS'} — ${results.length} screen/viewport combinations; evidence: ${out}`);
}finally{await browser.close()}
