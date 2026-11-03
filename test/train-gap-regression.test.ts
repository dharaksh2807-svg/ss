import assert from 'node:assert/strict';
import * as THREE from 'three';
import { prepareGapScenario, GAP_REPRO_SEED } from './train-gap-harness';
import { TrainGapPolicy } from '../src/track/TrainGapPolicy';
import { TRAIN_COMPOSITIONS } from '../src/track/TrainComposition';
import { RooftopRoutePlanner } from '../src/track/RooftopRoutePlanner';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { CollisionResolver } from '../src/track/CollisionResolver';
const store: Record<string,string>={};
if(typeof localStorage==='undefined')Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>store[k]??null,setItem:(k:string,v:string)=>store[k]=v,removeItem:(k:string)=>delete store[k],clear:()=>{}}});
let count=0;
function check(value:unknown,message:string){assert.ok(value,message);count++;console.log(`PASS ${count}: ${message}`);}
function run(o:any){const h=prepareGapScenario(o);while(h.step()){}return {h,r:h.result()};}

const tiny=run({name:'tiny',gap:1.2,speed:18});
check(tiny.r.accepted && tiny.r.policy.classification==='CONTINUOUS_SUPPORT','1. tiny physical gap classified continuous');
check(tiny.r.hasVisibleGangway && tiny.r.supportLoss===0 && tiny.r.last?.state==='ON_TRAIN','2. visible supported crossing without jump');
const bridge=tiny.h.a.roofSegments!.find(s=>s.connectionMesh)!;
const plate=bridge.connectionMesh!.children[0];tiny.h.a.group.updateWorldMatrix(true,true);
const meshBox=new THREE.Box3().setFromObject(plate);
check(Math.abs(meshBox.min.z-bridge.collider.min.z)<1e-5 && Math.abs(meshBox.max.z-bridge.collider.max.z)<1e-5 && Math.abs(meshBox.max.y-bridge.surfaceY)<1e-5,'visible gangway and support edges match');
for(const speed of [18,24,28,38,44,52])for(const fps of [30,60,120]){
 const {r}=run({name:`continuous_${speed}_${fps}`,gap:1.2,speed,fps});
 check(r.accepted && r.supportLoss===0 && r.maxHeightError===0 && r.last?.state==='ON_TRAIN',`3/11. continuous crossing ${speed}m/s ${fps}fps: no lost frame, jitter or death`);
}
const jump=run({name:'visible_jump',gap:3.5,speed:18,jump:'correct'});
check(jump.r.policy.classification==='EXPLICIT_JUMP' && !jump.r.hasVisibleGangway && jump.r.policy.projectedGapPixels>=8,'4. genuine readable opening remains unsupported');
check(jump.r.landed && jump.r.last?.supportId===jump.r.targetId && jump.r.last?.y===4.35,'5/12. supported takeoff and destination roof landing transfer');
for(const when of ['early','late']){
 const {r}=run({name:when,gap:3.5,speed:18,jump:when});
 check(!r.landed && r.last?.state==='CRASH',`${when==='early'?'6':'7'}. ${when} jump correctly fails`);
}
const boundary=run({name:'boundary',gap:1.2,speed:52,crossChunk:true});
check(boundary.r.accepted && boundary.r.supportLoss===0 && boundary.r.last?.supportId===boundary.r.targetId,'8. cross-chunk bridge and support transfer at 52m/s');
const moving=run({name:'moving_coupled',gap:1.2,speed:28,velocity:10});
check(moving.r.accepted && moving.r.supportLoss===0 && moving.r.last?.state==='ON_TRAIN','9. physically coupled moving carriages retain continuous support');
check(TrainGapPolicy.classify({gap:1.2,sourceLength:40,targetLength:40,playerSpeed:28,sourceVelocityZ:0,targetVelocityZ:10}).classification==='REJECTED_LAYOUT','independently separating trains cannot receive a rigid bridge');
for(const name of ['COMMUTER_TWIN_SET','METRO_TRIPLE_CONSIST','EXPRESS_QUAD_CONSIST']){
 const composition={...TRAIN_COMPOSITIONS[name],hasRamp:false,hasExitRamp:false,rooftopObstacles:[],carriages:TRAIN_COMPOSITIONS[name].carriages.map(c=>({...c,hasRamp:false,hasExitRamp:false}))};
 const {h}=run({name,gap:1.2,speed:52,composition});
 // Sample every support seam, including sub-frame positions, without crossing equipment.
 const min=Math.min(...h.a.roofSegments!.map(s=>s.collider.min.z)),max=Math.max(...h.a.roofSegments!.map(s=>s.collider.max.z));
 h.p.reset();h.p.resolveRoofLanding(4.35,h.a.id,h.a.carriageGroupId);
 for(let z=max-0.1;z>min+0.1;z-=0.1){h.p.position.set(0,4.35,z);h.p.previousPosition.copy(h.p.position);h.p.updateCollider();(h.tm as any).updateGroundHeight(h.p,1/60);assert.equal(h.p.getSupportSurface(),'TRAIN_ROOF');assert.equal(h.p.position.y,4.35);}
 check(true,`10. ${name}: all actual carriage/gangway seams supported`);
}
{
 const {h}=run({name:'fatal',gap:1.2,speed:18});h.p.reset();h.p.position.set(0,0,h.a.bodyCollider!.max.z);h.p.updateCollider();
 check(CollisionResolver.resolveOutcome(h.a,h.p,null,true).outcome==='MAJOR_FATAL_HIT','13. frontal train body remains lethal');
 h.p.position.set(0,0,(h.a.bodyCollider!.min.z+h.a.bodyCollider!.max.z)/2);h.p.updateCollider();
 check(CollisionResolver.resolveOutcome(h.a,h.p,null).outcome==='MAJOR_FATAL_HIT','side train body remains lethal');
}
{
 const composition={...TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST,hasRamp:false};
 const h=prepareGapScenario({name:'roof_equipment',gap:1.2,speed:18,composition});const ro=h.a.rooftopObstacles![0];
 h.p.position.set(0,4.35,(ro.collider.min.z+ro.collider.max.z)/2);h.p.updateCollider();
 check(CollisionResolver.resolveOutcome(h.a,h.p,null).outcome==='MAJOR_FATAL_HIT','14. rooftop AC still lethal when not jumped');
}
{
 const h=prepareGapScenario({name:'ramp',gap:1.2,speed:18,composition:TRAIN_COMPOSITIONS.COMMUTER_TWIN_SET});
 h.p.reset();const ramp=h.a.rampCollider!;
 for(let z=ramp.max.z;z>=ramp.min.z-0.2;z-=0.1){h.p.position.z=z;h.p.updateCollider();(h.tm as any).updateGroundHeight(h.p,1/60);assert.notEqual(h.p.getSupportSurface(),'GROUND');}
 check(h.p.position.y>4.2,'15. existing ramp reaches roof continuously');
}
{
 const p=RooftopRoutePlanner.planRoute({seed:GAP_REPRO_SEED,tier:'EXPERT',playerSpeed:28,forcedArchetype:'GAP_HOP'});
 p.legs[1].chunkRelativeZ+=50;
 check(!ReachabilityValidator.validateRooftopRoute(p,28).solvable,'16. impossible actual transfer rejected instead of trusting 3.5m metadata');
}
for(const speed of [18,24,28,38,44,52]){
 const options={seed:GAP_REPRO_SEED,tier:'EXPERT' as const,playerSpeed:speed,forcedArchetype:'GAP_HOP' as const};
 const p=RooftopRoutePlanner.planRoute(options);
 check(JSON.stringify(p)===JSON.stringify(RooftopRoutePlanner.planRoute(options)),'17. deterministic route regeneration at '+speed+'m/s');
 check(p.archetype==='GAP_HOP' && ReachabilityValidator.validateRooftopRoute(p,speed).solvable,'speed-adapted challenging jump retained at '+speed+'m/s');
 const h=prepareGapScenario({name:'plan_geometry',gap:1.2,speed});for(const c of h.tm.chunks)c.clearDynamicItems();
 const pattern=RooftopRoutePlanner.createTrackPattern(p),chunk=h.tm.chunks[0];
 check(chunk.populate(pattern,0,undefined,false,undefined,[],speed),'actual generated GAP_HOP accepted at '+speed+'m/s');
 const arc=pattern.collectibles!.find(c=>c.archetype==='JUMP_ARC')!;
 const transfer=p.transfers[0];
 check(arc.zOffset>=4+transfer.windowStartZ-0.051 && arc.zOffset<=4+transfer.windowEndZ+0.051 &&
   Math.abs(arc.zOffset+((arc.count??1)-1)*(arc.spacing??0)-(4+transfer.landingZ))<=0.051,
   'generated coin arc starts on supported takeoff and ends on proven landing at '+speed+'m/s');
 const [a,b]=chunk.obstacles;
 const end=Math.min(...a.roofSegments!.map(s=>s.collider.min.z));const start=Math.max(...b.roofSegments!.map(s=>s.collider.max.z));
 const expected=p.legs[1].chunkRelativeZ-p.legs[0].length;
 check(Math.abs(end-start-expected)<1e-5,'actual generated gap equals planned roof-edge gap at '+speed+'m/s');
 const decision=a.group.userData.roofInterfaces.find((i:any)=>i.classification==='EXPLICIT_JUMP');
 const runner=h.p; runner.reset();runner.setGameMode(speed>=28?'HARD':'NORMAL');
 runner.currentLane=p.entryLane;runner.targetLane=p.entryLane;
 runner.position.set(a.group.position.x,4.35,end+Math.min(a.length!-1,decision.reactionLeadDistance+speed*0.15));
 runner.previousPosition.copy(runner.position);runner.resolveRoofLanding(4.35,a.id,a.carriageGroupId);runner.updateCollider();
 let tookOff=false,actualLanding=false;
 for(let f=0;f<180;f++){
   runner.speed=speed;
   if(!tookOff && runner.position.z-end<=(decision.takeoffMin+decision.takeoffMax)/2){runner.jump();tookOff=true;}
   runner.update(1/60);h.tm.update(runner,1/60,f/60);
   assert.notEqual(runner.state,'CRASH','actual planned geometry must remain safe');
   if(tookOff&&!runner.isJumping&&runner.getActiveSupportObstacleId()===b.id){actualLanding=true;break;}
 }
 check(actualLanding,'correct jump lands on actual generated destination carriage at '+speed+'m/s');

 const {r}=run({name:'speed_jump',gap:expected,speed,jump:'correct'});
 check(r.landed && r.last?.state==='ON_TRAIN','actual ballistic crossing at '+speed+'m/s');
 console.log(JSON.stringify({speed,gap:expected,interfaces:a.group.userData.roofInterfaces?.filter((i:any)=>i.classification==='EXPLICIT_JUMP')}));
}
{
 const h=prepareGapScenario({name:'bridge_retirement',gap:1.2,speed:28});
 const seg=h.a.roofSegments!.find(s=>s.connectionMesh)!;
 h.b.isMoving=true;h.b.velocityZ=1;
 h.p.position.z=(seg.collider.min.z+seg.collider.max.z)/2;h.p.updateCollider();
 (h.tm as any).updateGroundHeight(h.p,1/60);
 check(!h.a.roofSegments!.includes(seg) && !h.a.group.children.includes(seg.connectionMesh as any),
   'rigid bridge mesh and support retire together if relative motion changes');
}
{
 const h=prepareGapScenario({name:'rollback',gap:1.2,speed:18});
 const chunk=h.tm.chunks[0],old=h.a,segments=old.roofSegments;
 const accepted=chunk.populate({name:'UNSAFE_TINY_MOVING',obstacles:[
  {type:'TRAIN',lane:0,zOffset:40,length:20},
  {type:'MOVING_TRAIN',lane:0,zOffset:61.2,length:20,velocityZ:10}],collectibles:[]},0);
 check(!accepted && chunk.obstacles[0]===old && old.roofSegments===segments && chunk.group.children.includes(old.group),
   'rejected recycled layout retains original live geometry and support segments');
 h.p.reset();h.p.setSupportSurface('TRAIN_ROOF',old.id,old.carriageGroupId);h.p.position.set(0,0,-60);h.p.updateCollider();
 (h.tm as any).updateGroundHeight(h.p,1/60);
 check(h.p.position.y===0,'stale support identity cannot teleport a grounded runner to the roof');
}
for(const obstacle of ['takeoffObstacles','landingObstacles']) {
 check(TrainGapPolicy.classify({gap:3.5,sourceLength:18,targetLength:18,playerSpeed:18,
  [obstacle]:[{start:0,end:18}]}).classification==='REJECTED_LAYOUT',obstacle+' cannot block a promised safe jump');
}
{
 const comp={...TRAIN_COMPOSITIONS.DUAL_TRAIN_GAP_HOP,totalLength:90,carriages:[
  {id:'first',type:'PASSENGER_COACH',length:32,localOffsetZ:29},
  {id:'second',type:'PASSENGER_COACH',length:32,localOffsetZ:-29}],rooftopObstacles:[],hasRamp:false};
 const h=prepareGapScenario({name:'impossible_internal',gap:26,speed:18,composition:comp});
 check(!h.result().accepted,'impossible internal composition transfer is rejected even beyond jump range');
}
// A falling runner inside the open composition gap must not hit its broad envelope.
{
 const h=prepareGapScenario({name:'air_not_body',gap:3.5,speed:18,composition:TRAIN_COMPOSITIONS.DUAL_TRAIN_GAP_HOP});
 h.p.position.set(0,4.19,-60);h.p.previousPosition.copy(h.p.position);h.p.isJumping=true;h.p.verticalVelocity=-4.5;h.p.state='FALLING_FROM_TRAIN';h.p.updateCollider();
 (h.tm as any).checkCollisions(h.p,1/60);
 check(h.p.state!=='CRASH','open air inside composition envelope is not a hidden lethal collider');
 h.a.isMoving=true;h.a.velocityZ=1;h.a.previousWorldZ=-60;
 (h.tm as any).checkCollisions(h.p,1/60);
 check(h.p.state!=='CRASH','swept moving composition collision also excludes unsupported open air');
}
console.log(`VERDICT: PASS — ${count} train-gap assertions; seed ${GAP_REPRO_SEED}`);
