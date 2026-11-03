import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TRAIN_COMPOSITIONS } from '../src/track/TrainComposition';
import { prepareRoofScenario, RoofScenarioKind } from './rooftop-regression-scenarios';
const store:Record<string,string>={};
(globalThis as any).localStorage ??= {getItem:(k:string)=>store[k]??null,setItem:(k:string,v:string)=>store[k]=v,removeItem:(k:string)=>delete store[k],clear:()=>{}};
let count=0;
function check(value:unknown,message:string){assert.ok(value,message);count++;console.log('PASS '+count+': '+message);}
const scene=new THREE.Scene(),tm=new TrackManager(scene),p=new Player();
for(const seed of [4242,1337,7777])for(const mode of ['NORMAL','HARD'] as const){
  for(const kind of ['RAMP_RUN_EXIT','SIDE_SWITCH','DOUBLE_SWITCH','GAP_HOP','CONNECTED','CROSS_CHUNK','STATIONARY','MOVING','RAMP','GAP_FALL','EQUIPMENT_HIT','EQUIPMENT_JUMP','BODY_HIT'] as RoofScenarioKind[]){
    const h=prepareRoofScenario(tm,p,{kind,seed,mode});
    for(let f=0;f<1000&&!h.finished();f++){h.control();p.update(1/60);tm.update(p,1/60,f/60);h.observe();}
    const r=h.result();h.cleanup();
    if(r.expectDeath){
      check(r.state==='CRASH',`${seed}/${mode}/${kind}: genuine failed jump or obstacle impact remains fatal`);
      if(kind==='EQUIPMENT_HIT'){
        check(r.impact?.diagnostic.collisionType==='ROOFTOP_AC_HURDLE' && r.analysis?.explanation.category==='ROOFTOP_OBSTACLE', 'equipment contact retains its identity through replay');
        check(r.impact?.before.trains[0].collidingBodies.length===0 && Boolean(r.impact?.diagnostic.componentId), 'equipment impact cannot masquerade as a train-body collision');
      }
    }else{
      check(r.finished && r.state!=='CRASH' && r.support==='TRAIN_ROOF',`${seed}/${mode}/${kind}: entire real roof sequence completed safely`);
      check(r.invalidRoofFrames===0,`${kind}: zero invalid supported-roof frames`);
      if(kind==='CONNECTED')check(r.crossedConnections===2,'three same-lane train roofs transfer support continuously');
      if(kind==='EQUIPMENT_JUMP')check(r.jumps>0,'genuine catalog equipment is cleared using normal jump physics');
    }
    check(!r.protection.invulnerable&&!r.protection.shield&&!r.protection.hoverboard,'no protection masks collision outcomes');
  }
}
for(const kind of ['RAMP_RUN_EXIT','SIDE_SWITCH','DOUBLE_SWITCH','GAP_HOP','CONNECTED','MOVING','RAMP'] as RoofScenarioKind[]){
 const h=prepareRoofScenario(tm,p,{kind,seed:4242,mode:'HARD',speed:52});
 for(let f=0;f<1000&&!h.finished();f++){h.control();p.update(1/60);tm.update(p,1/60,f/60);h.observe();}
 const r=h.result();h.cleanup();check(r.finished&&r.state!=='CRASH'&&r.support==='TRAIN_ROOF'&&r.invalidRoofFrames===0,kind+': maximum Hard speed remains safely supported');
}
check(TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST.rooftopObstacles.length===1 && TRAIN_COMPOSITIONS.EXPRESS_QUAD_CONSIST.rooftopObstacles.length===2,'planning clear routes never mutates catalog equipment challenges');
console.log(`VERDICT: PASS — ${count} rooftop regression assertions`);
