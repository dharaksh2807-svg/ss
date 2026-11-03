import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-gl=angle','--use-angle=metal','--no-sandbox']});
try {
  const page = await browser.newPage({viewport:{width:1280,height:720}});
  await page.addInitScript(() => { (window as any).__name = (fn: any) => fn; });
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3001');
  await page.waitForFunction(()=>Boolean((window as any).__METRO_GAME__));
  await page.locator('#start-play-btn').click();await page.waitForTimeout(250);await page.keyboard.press('Space');
  await page.waitForFunction(()=>(window as any).__METRO_GAME__.lifecycleState==='PLAYING');
  const results=await page.evaluate(async()=>{
    const game=(window as any).__METRO_GAME__;
    const {TRAIN_COMPOSITIONS}=await import('/src/track/TrainComposition.ts');
    const {RooftopRoutePlanner}=await import('/src/track/RooftopRoutePlanner.ts');
    const {Box3}=await import('/node_modules/three/build/three.module.js');
    const tm=game.trackManager,p=game.player;
    const all=[];
    for(const name of ['stock_triple','bare_quad','stock_quad','planned_run_exit']) {
      game.devTestArena.setSimulationPaused(true);game.lifecycleState='PLAYING';
      tm.setSeed(4242,true);tm.clearCollisionDiagnostics();for(const c of tm.chunks)c.clearDynamicItems();
      const base=TRAIN_COMPOSITIONS[name==='stock_triple'?'METRO_TRIPLE_CONSIST':'EXPRESS_QUAD_CONSIST'];
      const composition={...base,hasRamp:false,hasExitRamp:false,carriages:base.carriages.map((c:any)=>({...c,hasRamp:false,hasExitRamp:false})),rooftopObstacles:name==='bare_quad'?[]:base.rooftopObstacles};
      const chunk=tm.chunks[0];const plan=RooftopRoutePlanner.planRoute({seed:4242,tier:'EXPERT',playerSpeed:18,forcedArchetype:'RAMP_RUN_EXIT',availableEntryLanes:[0]});
      const pattern=name==='planned_run_exit'?RooftopRoutePlanner.createTrackPattern(plan):{name,difficulty:'HARD',obstacles:[{type:'TRAIN_COMPOSITION',lane:0,zOffset:70,composition}],collectibles:[]};
      const accepted=chunk.populate(pattern,0);
      const obs=chunk.obstacles[0];
      p.reset();p.setGameMode('NORMAL');tm.setGameMode('NORMAL');p.speed=18;
      p.position.set(0,4.35,obs.roofStartZ-1);p.previousPosition.copy(p.position);p.resolveRoofLanding(4.35,obs.id,obs.carriageGroupId);p.updateCollider();
      const snapshot=()=>({position:p.position.clone(),previous:p.previousPosition.clone(),velocityY:p.verticalVelocity,speed:p.speed,state:p.state,support:p.getSupportSurface(),supportId:p.getActiveSupportObstacleId(),playerBox:p.collider.clone(),roofs:obs.roofSegments?.map((s:any)=>({id:s.id,box:s.collider.clone()})),bodies:obs.bodySegments?.filter((s:any)=>p.collider.intersectsBox(s.collider)).map((s:any)=>({id:s.id,box:s.collider.clone()})),equipment:obs.rooftopObstacles?.filter((s:any)=>p.collider.intersectsBox(s.collider)).map((s:any)=>({id:s.id,box:s.collider.clone()}))});
      obs.group.updateWorldMatrix(true,true);
      const visibleEquipment=obs.group.children.filter((c:any)=>c.userData.isRooftopObstacle).map((mesh:any)=>({type:mesh.userData.type,visible:mesh.visible,box:new Box3().setFromObject(mesh)}));
      const history:any[]=[];let impact:any=null;
      const original=tm.checkCollisions;
      tm.checkCollisions=function(...args:any[]){const before=snapshot();const result=original.apply(this,args);if(p.state==='CRASH')impact={previousFrame:history.at(-1),before,after:snapshot(),diagnostic:tm.getLastCollisionDiagnostic()};history.push(before);return result;};
      game.cameraController.finishIntro(p.position);game.devTestArena.setSimulationPaused(false);
      const start=performance.now();
      while(performance.now()-start<6500 && p.state!=='CRASH' && p.position.z>obs.roofEndZ+1){await new Promise(requestAnimationFrame);}
      game.devTestArena.setSimulationPaused(true);tm.checkCollisions=original;
      all.push({name,accepted,seed:4242,trainId:obs.id,velocity:obs.velocityZ,visibleEquipment,state:p.state,position:p.position.clone(),frames:history.length,impact});
    }
    return all;
  });
  console.log(JSON.stringify({results,errors},null,2));
} finally {await browser.close();}
