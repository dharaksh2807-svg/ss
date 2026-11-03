import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-gl=angle','--use-angle=metal','--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.exposeFunction('captureGap',async(name:string)=>{await page.screenshot({path:'/tmp/metro-gap-'+name+'.png'});});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3000');
 await page.waitForFunction(()=>Boolean((window as any).__METRO_GAME__),{timeout:20000});
 await page.locator('#start-play-btn').click();
 await page.waitForTimeout(250);
 await page.keyboard.press('Space');
 await page.waitForFunction(()=>(window as any).__METRO_GAME__.lifecycleState==='PLAYING',{timeout:10000});
 const results=await page.evaluate(async()=>{
  const game=(window as any).__METRO_GAME__;
  // The real game renderer/camera remain active; deterministic frames drive its real player/track.
  game.devTestArena.setSimulationPaused(true);
  game.lifecycleState='PLAYING';
  const {prepareGapScenario}=await import('/test/train-gap-harness.ts');
  const all=[];
  const scenarios=[
   {name:'continuous_no_jump',gap:1.2,speed:18},
   {name:'visible_jump',gap:3.5,speed:18,jump:'correct'},
   {name:'moving_coupled_sequence',gap:1.2,speed:28,velocity:10},
   {name:'cross_chunk_rooftop',gap:1.2,speed:28,crossChunk:true},
   {name:'hard_52mps',gap:9,speed:52,jump:'correct'},
   {name:'intentionally_failed_jump',gap:3.5,speed:18,jump:'late'}
  ];
  for(const scenario of scenarios){
   const h=prepareGapScenario(scenario as any,game.trackManager,game.player);
   game.cameraController.finishIntro(h.p.position);
   let visibility:any=null,visual:any=null;
   for(let f=0;f<220;f++){
    const source=h.a.roofSegments.find((s:any)=>s.kind==='CARRIAGE');
    const d=h.p.position.z-source.collider.min.z;
    if(!visibility && scenario.jump==='correct' && d<=h.result().policy.reactionLeadDistance+scenario.speed/60){
     game.cameraController.finishIntro(h.p.position);
     const vector=h.p.position.clone();
     const near=vector.clone().set(0,4.35,source.collider.min.z).project(game.cameraController.camera);
     const far=vector.clone().set(0,4.35,source.collider.min.z-scenario.gap).project(game.cameraController.camera);
     visibility={takeoffDistance:d,leadSeconds:(d-h.result().policy.takeoffMin)/scenario.speed,
       actualProjectedGapPixels:Math.abs(near.y-far.y)*360,nearInView:Math.abs(near.x)<1&&Math.abs(near.y)<1,farInView:Math.abs(far.x)<1&&Math.abs(far.y)<1};
     if(scenario.name==='hard_52mps') {
      game.worldScene.renderer.render(game.worldScene.scene,game.cameraController.camera);
      await (window as any).captureGap('hard');
     }
    }
    const keep=h.step();
    game.cameraController.finishIntro(h.p.position);
    await new Promise(requestAnimationFrame);
    if(!keep)break;
   }
   const {samples,...r}=h.result();
   all.push({...r,visibility});
  }
  return all;
 });
 for(const r of results){
  console.log(JSON.stringify(r));assert.ok(r.accepted,r.name+' arrangement accepted');
  if(r.name==='intentionally_failed_jump')assert.equal(r.last?.state,'CRASH');
  else if(r.jumped){assert.ok(r.landed,r.name+' safely landed');assert.ok(r.visibility?.nearInView&&r.visibility?.farInView);assert.ok(r.visibility.actualProjectedGapPixels>=8);assert.ok(r.visibility.leadSeconds>=0.5);}
  else {assert.equal(r.supportLoss,0);assert.equal(r.maxHeightError,0);assert.equal(r.last?.state,'ON_TRAIN');}
 }
 assert.deepEqual(errors,[],'No browser runtime exceptions');
 console.log('VERDICT: PASS — six actual-game browser scenarios, no runtime exceptions');
} finally {await browser.close();}
