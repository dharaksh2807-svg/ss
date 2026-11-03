import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrainGapPolicy } from '../src/track/TrainGapPolicy';

export const GAP_REPRO_SEED = 4242;
export interface GapScenario {
  name: string; gap: number; speed: number; velocity?: number; crossChunk?: boolean;
  jump?: 'correct' | 'early' | 'late'; composition?: any; fps?: number;
}

/** Drives the real Player/TrackManager code, also imported by the browser against the live game. */
export function prepareGapScenario(options: GapScenario, manager?: TrackManager, runner?: Player) {
  const tm = manager ?? new TrackManager(new THREE.Scene());
  const p = runner ?? new Player();
  tm.setSeed(GAP_REPRO_SEED, true);
  for (const c of tm.chunks) c.clearDynamicItems();
  p.reset();
  const c0 = tm.chunks[0], c1 = tm.chunks[1];
  // Put the first edge at -80m, exactly on the chunk boundary when requested.
  const velocity = options.velocity ?? 0;
  const type = velocity ? 'MOVING_TRAIN' : 'TRAIN';
  const source = { type, lane: 0, zOffset: 60, length: 40, velocityZ: velocity };
  const target = { type, lane: 0, zOffset: 100 + options.gap, length: 40, velocityZ: velocity };
  const pattern = (name: string, obstacles: any[]) => ({ name, difficulty: 'HARD', obstacles, collectibles: [] });
  let accepted: boolean;
  if (velocity && options.gap <= 2 && !options.composition) {
    const composition = { id:'CO_MOVING_PAIR', totalLength:81.2, hasRamp:false, rampLength:8,
      rooftopObstacles:[], carriages:[{id:'a',type:'PASSENGER_COACH',length:40,localOffsetZ:20.6},
        {id:'b',type:'PASSENGER_COACH',length:40,localOffsetZ:-20.6}] };
    accepted = c0.populate(pattern(options.name,[{type:'TRAIN_COMPOSITION',lane:0,zOffset:60,
      composition,isMoving:true,velocityZ:velocity}]),0,undefined,false,undefined,[],options.speed);
  } else if (options.composition) {
    accepted = c0.populate(pattern(options.name,[{type:'TRAIN_COMPOSITION',lane:0,zOffset:60,composition:options.composition}]),0,undefined,false,undefined,[],options.speed);
  } else if (options.crossChunk) {
    c0.populate(pattern(options.name+'_source',[source]),0,undefined,false,undefined,[],options.speed);
    accepted = c1.populate(pattern(options.name+'_target',[{...target,zOffset:target.zOffset-80}]),-80,undefined,false,undefined,[c0],options.speed);
  } else {
    accepted = c0.populate(pattern(options.name,[source,target]),0,undefined,false,undefined,[],options.speed);
  }
  const a = c0.obstacles[0];
  const b = options.crossChunk ? c1.obstacles[0] : c0.obstacles[1];
  const firstRoof = a?.roofSegments?.find(seg=>seg.kind==='CARRIAGE');
  const edge = firstRoof?.collider.min.z ?? -80;
  p.setGameMode(options.speed >= 28 ? 'HARD' : 'NORMAL');
  p.speed = options.speed;
  p.position.set(0,4.35,edge+Math.max(12,options.speed*0.7));
  p.previousPosition.copy(p.position);
  if(a) p.resolveRoofLanding(4.35,a.id,a.carriageGroupId);
  p.updateCollider();
  const policy = TrainGapPolicy.classify({gap:options.gap,sourceLength:40,targetLength:40,
    playerSpeed:options.speed,sourceVelocityZ:velocity,targetVelocityZ:velocity});
  const takeoff = options.jump==='early' ? (options.speed+velocity)*0.6+options.gap+2 :
    options.jump==='late' ? -1.5 : policy.takeoffMin+Math.min(1.5,(policy.takeoffMax-policy.takeoffMin)/2);
  const samples: any[]=[];
  let jumped=false, landed=false, supportLoss=0, maxHeightError=0;
  let frame=0;
  function step() {
    if(!accepted || p.state==='CRASH' || frame>480) return false;
    p.speed=options.speed; // Hold the measured mode/speed, including high-speed tests.
    const roof=a.roofSegments!.find(seg=>seg.kind==='CARRIAGE')!;
    const d=p.position.z-roof.collider.min.z;
    if(options.jump && !jumped && d<=takeoff){p.jump();jumped=true;}
    const dt = 1/(options.fps ?? 60);
    p.update(dt);tm.update(p,dt,frame*dt);
    if(p.getSupportSurface()!=='TRAIN_ROOF')supportLoss++;
    if(!options.jump)maxHeightError=Math.max(maxHeightError,Math.abs(p.position.y-4.35));
    const supportId=p.getActiveSupportObstacleId();
    if(jumped && !p.isJumping && supportId && p.position.z < roof.collider.min.z-options.gap)landed=true;
    samples.push({frame:frame++,z:p.position.z,y:p.position.y,vy:p.verticalVelocity,
      state:p.state,support:p.getSupportSurface(),supportId,jumping:p.isJumping,outcome:tm.getLastCollisionDiagnostic()?.finalOutcome});
    return p.state!=='CRASH' && p.position.z>roof.collider.min.z-options.gap-(options.jump ? Math.max(8,(options.speed+velocity)*0.65) : 8);
  }
  function result(){return {name:options.name,seed:GAP_REPRO_SEED,accepted,policy,jumped,landed,supportLoss,maxHeightError,
    sourceId:a?.id,targetId:b?.id,chunkIndices:[0,options.crossChunk?1:0],sourceVelocity:velocity,targetVelocity:velocity,
    sourceEdges:a?.roofSegments?.filter(s=>s.kind==='CARRIAGE').map(s=>[s.collider.min.z,s.collider.max.z]),
    targetEdges:b?.roofSegments?.map(s=>[s.collider.min.z,s.collider.max.z]),
    hasVisibleGangway:[a,b].some(o=>o?.roofSegments?.some(s=>s.connectionMesh)),
    last:samples.at(-1),samples};}
  return {tm,p,a,b,step,result};
}
