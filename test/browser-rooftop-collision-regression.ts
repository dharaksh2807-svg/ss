import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-gl=angle','--use-angle=metal','--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.addInitScript(()=>{(window as any).__name=(fn:any)=>fn;});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const port = process.env.PORT || '3000';
 await page.goto(`http://127.0.0.1:${port}`);
 await page.waitForFunction(()=>Boolean((window as any).__METRO_GAME__));
 await page.locator('#start-play-btn').click();await page.waitForTimeout(250);await page.keyboard.press('Space');
 await page.waitForFunction(()=>(window as any).__METRO_GAME__.lifecycleState==='PLAYING');
 const cases:any[]=[];
 for(const seed of [4242,1337,7777])for(const mode of ['NORMAL','HARD'])for(const kind of ['RAMP_RUN_EXIT','CONNECTED','GAP_HOP','GAP_FALL','RAMP','SIDE_SWITCH','STATIONARY','MOVING','CROSS_CHUNK','EQUIPMENT_HIT','EQUIPMENT_JUMP','BODY_HIT'])cases.push({seed,mode,kind});
 cases.push({seed:4242,mode:'HARD',speed:52,kind:'RAMP_RUN_EXIT'},{seed:4242,mode:'HARD',speed:52,kind:'DOUBLE_SWITCH'},{seed:4242,mode:'HARD',speed:52,kind:'GAP_HOP'});
 const results=[];
 for(const options of cases){
  const result=await page.evaluate(async(options:any)=>{
   const game=(window as any).__METRO_GAME__;
   game.devTestArena.setSimulationPaused(true);
   game.trackManager.setSeed(options.seed,true);
   // Exercise the game's real restart path; it clears pending death/revive timers and replay state.
   game.startRun(options.mode,true);game.openingSequence.skip();
   const {prepareRoofScenario}=await import('/test/rooftop-regression-scenarios.ts');
   const h=prepareRoofScenario(game.trackManager,game.player,options);
   const originalUpdate=game.player.update;
   game.player.update=function(dt:number){h.control();return originalUpdate.call(this,dt);};
   game.cameraController.finishIntro(h.p.position);
   game.devTestArena.setSimulationPaused(false);
   const start=performance.now();
   while(!h.finished()&&performance.now()-start<14000){
    await new Promise(requestAnimationFrame);h.observe();
   }
   game.devTestArena.setSimulationPaused(true);game.player.update=originalUpdate;
   const result=h.result();h.cleanup();return {...result,restarted:true,wallMilliseconds:performance.now()-start};
  },options);
  results.push(result);
  fs.writeFileSync('/tmp/metro-roof-gameplay-results.json',JSON.stringify({results,errors},null,2));
  const key=options.seed+'/'+options.mode+'/'+(options.speed??'initial')+'/'+options.kind;
  if(result.expectDeath){assert.equal(result.state,'CRASH',key+' intended failure');}
  else{assert.ok(result.finished,key+' completed');assert.notEqual(result.state,'CRASH',key+' safe');assert.equal(result.support,'TRAIN_ROOF',key+' roof support');assert.equal(result.invalidRoofFrames,0,key+' stable support');}
  assert.deepEqual(result.protection,{invulnerable:false,shield:false,hoverboard:false},key+' no protection');
  if(options.kind==='EQUIPMENT_HIT'){
   assert.equal(result.impact?.diagnostic.collisionType,'ROOFTOP_AC_HURDLE');
   assert.equal(result.analysis?.explanation.category,'ROOFTOP_OBSTACLE');
   assert.equal(result.impact?.before.trains[0].collidingBodies.length,0);
  }
  console.log('PASS '+key+' '+result.state+' '+result.frames+' real browser frames');
 }
 assert.deepEqual(errors,[],'No browser runtime exceptions');
 console.log(`VERDICT: PASS — ${results.length} live game scenarios, real restart each time, zero runtime exceptions`);
} finally {await browser.close();}
