// Run serially without competing test browsers; metrics describe this host, not physical mobile hardware.
import {chromium} from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-gl=angle','--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{
  window.__globalListenerCounts=()=>Object.fromEntries(records.map(([name,map])=>[name,[...map.values()].reduce((s,set)=>s+set.size,0)]));const records=[];
  for(const[name,target]of[['window',window],['document',document]]){const map=new Map();records.push([name,map]);const add=target.addEventListener.bind(target),remove=target.removeEventListener.bind(target);target.addEventListener=(type,fn,options)=>{const key=type+':'+(typeof options==='boolean'?options:!!options?.capture);if(!map.has(key))map.set(key,new Set());map.get(key).add(fn);return add(type,fn,options);};target.removeEventListener=(type,fn,options)=>{map.get(type+':'+(typeof options==='boolean'?options:!!options?.capture))?.delete(fn);return remove(type,fn,options);};}
 });
 await page.goto(process.env.UI_TEST_URL || 'http://127.0.0.1:3001');await page.waitForFunction(()=>window.__METRO_GAME__);
 const result=await page.evaluate(async()=>{
  const g=window.__METRO_GAME__,bus=window.__METRO_BUS__,graphics=window.__GRAPHICS_MANAGER__;
  const frame=()=>new Promise(requestAnimationFrame);const frames=async(n)=>{for(let i=0;i<n;i++)await frame();};
  const stats=()=>{const count=root=>{let n=0;root.traverse(()=>n++);return n;};return {main:{...g.worldScene.renderer.info.memory,calls:g.worldScene.renderer.info.render.calls,triangles:g.worldScene.renderer.info.render.triangles,sceneObjects:count(g.worldScene.scene)},runner:{...g.characterSelectModal.renderer.info.memory,objects:count(g.characterSelectModal.scene)},board:{...g.hoverboardSelectModal.renderer.info.memory,objects:count(g.hoverboardSelectModal.scene)},listeners:window.__globalListenerCounts(),bus:[...bus.listeners].reduce((n,[,s])=>n+s.size,0),previewRAF:[g.characterSelectModal.animFrameId,g.hoverboardSelectModal.animFrameId],quality:graphics.getResolvedQuality()};};
  graphics.setPreset('LOW');
  for(const e of ['OPEN_CHARACTERS','OPEN_BOARDS']){bus.emit(e);await frames(5);g.navigation.back();}
  const previewBefore=stats();const previews=[];
  for(let i=0;i<20;i++){bus.emit(i%2?'OPEN_BOARDS':'OPEN_CHARACTERS');await frames(3);g.navigation.back();if(i%5===4)previews.push(stats());}
  const previewAfter=stats();const runs=[];
  for(let i=0;i<12;i++){g.startRun('NORMAL',true);g.openingSequence.skip();g.player.powerups.grantInvulnerability(60);await frames(3);g.pause();runs.push(stats());}
  const distributions=[];
  for(const quality of ['LOW','HIGH']){
   graphics.setPreset(quality);g.startRun('NORMAL',true);g.openingSequence.skip();g.player.powerups.grantInvulnerability(60);await frames(30);
   const dt=[],calls=[];let previous=performance.now();for(let i=0;i<300;i++){const now=await frame();dt.push(now-previous);previous=now;calls.push(g.worldScene.renderer.info.render.calls);}
   dt.sort((a,b)=>a-b);calls.sort((a,b)=>a-b);distributions.push({quality,frames:dt.length,p50:dt[Math.floor(dt.length*.5)],p95:dt[Math.floor(dt.length*.95)],p99:dt[Math.floor(dt.length*.99)],max:dt.at(-1),over33:dt.filter(v=>v>33.34).length,callsMedian:calls[150],callsMax:calls.at(-1),state:g.lifecycleState,stats:stats()});g.pause();
  }
  return {previewBefore,previews,previewAfter,runs,distributions,renderer:g.worldScene.renderer.getContext().getParameter(g.worldScene.renderer.getContext().RENDERER)};
 });
 fs.writeFileSync(process.env.PERFORMANCE_OUTPUT || '/tmp/metro-task9/performance.json',JSON.stringify({browser:browser.version(),headless:true,physicalDevice:false,viewport:'1366x768',result,errors},null,2));
 assert.deepEqual(errors, [], 'no runtime or console errors');
 for (const key of ['runner', 'board', 'listeners', 'bus', 'previewRAF']) assert.deepEqual(result.previewAfter[key], result.previewBefore[key], 'preview lifecycle remains bounded: '+key);
 console.log(JSON.stringify({errors,previewBefore:result.previewBefore,previewAfter:result.previewAfter,runs:result.runs.map(x=>x.main),distributions:result.distributions},null,2));
 console.log('VERDICT: PASS');
}finally{await browser.close();}
