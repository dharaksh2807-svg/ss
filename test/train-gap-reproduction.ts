import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { RooftopRoutePlanner } from '../src/track/RooftopRoutePlanner';
import { TRAIN_COMPOSITIONS } from '../src/track/TrainComposition';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
const store: Record<string,string> = {};
if (typeof localStorage === 'undefined') Object.defineProperty(globalThis, 'localStorage', {value:{getItem:(k:string)=>store[k]??null,setItem:(k:string,v:string)=>store[k]=v,removeItem:(k:string)=>delete store[k],clear:()=>{}}});
const seed=4242;
for (const [name,obstacles,z,speed] of [
 ['tiny-separate',[{type:'TRAIN',lane:0,zOffset:30,length:20},{type:'TRAIN',lane:0,zOffset:51.2,length:20}],-37,18],
 ['internal-jump',[{type:'TRAIN_COMPOSITION',lane:0,zOffset:50,composition:TRAIN_COMPOSITIONS.DUAL_TRAIN_GAP_HOP}],-45,18],
 ['triple',[{type:'TRAIN_COMPOSITION',lane:0,zOffset:50,composition:TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST}],-38,18]
] as const) {
 const tm=new TrackManager(new THREE.Scene()); tm.setSeed(seed,true); for(const c of tm.chunks)c.clearDynamicItems();
 const c=tm.chunks[0];c.populate({name,difficulty:'HARD',obstacles,collectibles:[]},0);
 const p=new Player();p.reset();p.speed=speed;p.position.set(0,4.35,z);p.previousPosition.copy(p.position);p.resolveRoofLanding(4.35,c.obstacles[0].id,c.obstacles[0].carriageGroupId);p.updateCollider();
 console.log(JSON.stringify({name,seed,chunk:c.chunkZ,trains:c.obstacles.map(o=>({id:o.id,lane:o.lane,z:o.group.position.z,v:o.velocityZ,roofs:o.roofSegments?.map(s=>[s.collider.min.z,s.collider.max.z,s.kind])}))}));
 for(let f=0;f<100;f++) {p.update(1/60);tm.update(p,1/60,f/60);if(p.state==='CRASH'||(p.state==='FALLING_FROM_TRAIN' && f===11)){console.log(JSON.stringify({name,frame:f,z:p.position.z,y:p.position.y,vy:p.verticalVelocity,state:p.state,jump:p.isJumping,support:p.getSupportSurface(),supportId:p.getActiveSupportObstacleId(),diagnostic:tm.getLastCollisionDiagnostic?.()}));if(p.state==='CRASH')break;}}
}
for(const speed of [18,28,38,44,52]){const p=RooftopRoutePlanner.planRoute({seed,tier:'EXPERT',playerSpeed:speed,forcedArchetype:'GAP_HOP'});const pattern=RooftopRoutePlanner.createTrackPattern(p);console.log(JSON.stringify({speed,legs:p.legs.map(l=>({start:l.chunkRelativeZ,length:l.length})),centers:pattern.obstacles.map(o=>o.zOffset),proof:ReachabilityValidator.validateRooftopRoute(p,speed)}));}
