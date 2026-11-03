import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { RooftopRoutePlanner, RooftopRouteArchetype } from '../src/track/RooftopRoutePlanner';
import { TRAIN_COMPOSITIONS } from '../src/track/TrainComposition';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { CrashReplayManager } from '../src/replay/CrashReplayManager';

export type RoofScenarioKind = RooftopRouteArchetype | 'CONNECTED' | 'CROSS_CHUNK' | 'STATIONARY' | 'MOVING' | 'RAMP' | 'GAP_FALL' | 'EQUIPMENT_HIT' | 'EQUIPMENT_JUMP' | 'BODY_HIT';
export interface RoofScenarioOptions { kind: RoofScenarioKind; seed: number; mode: 'NORMAL' | 'HARD'; speed?: number; }

/** Fixtures use the shipped planner/catalog, including their original equipment definitions. */
export function prepareRoofScenario(tm: TrackManager, p: Player, options: RoofScenarioOptions) {
  const speed=options.speed ?? (options.mode==='HARD'?28:18);
  tm.setGameMode(options.mode);tm.setSeed(options.seed,true);tm.clearCollisionDiagnostics();
  for(const chunk of tm.chunks)chunk.clearDynamicItems();
  p.reset();p.setGameMode(options.mode);p.speed=speed;
  if(speed>28)p.distanceTraveled=10000;
  const pattern=(obstacles:any[])=>({name:'ROOF_REGRESSION_'+options.kind,difficulty:'HARD',obstacles,collectibles:[]});
  const chunk=tm.chunks[0];
  const isRoute=['RAMP_RUN_EXIT','SIDE_SWITCH','DOUBLE_SWITCH','GAP_HOP','RAMP'].includes(options.kind);
  let plan:ReturnType<typeof RooftopRoutePlanner.planRoute>|undefined;
  let accepted=false;
  if(isRoute){
    const archetype=options.kind==='RAMP'?'RAMP_RUN_EXIT':options.kind==='GAP_FALL'?'GAP_HOP':options.kind as RooftopRouteArchetype;
    plan=RooftopRoutePlanner.planRoute({seed:options.seed,tier:'EXPERT',playerSpeed:speed,gameMode:options.mode,availableEntryLanes:options.kind==='DOUBLE_SWITCH'?[-1]:[0],forcedArchetype:archetype});
    accepted=chunk.populate(RooftopRoutePlanner.createTrackPattern(plan),0,undefined,false,undefined,[],speed);
  } else if(options.kind==='CONNECTED'||options.kind==='CROSS_CHUNK'||options.kind==='GAP_FALL') {
    const count=options.kind==='CONNECTED'?3:2;
    // A 6m opening is jumpable at both initial speeds and long enough to make a deliberate fall fatal.
    const separation=options.kind==='GAP_FALL'?46:41.2;
    const trains=Array.from({length:count},(_,i)=>({type:'TRAIN',lane:0,zOffset:60+i*separation,length:40}));
    if(options.kind==='CROSS_CHUNK'){
      accepted=chunk.populate(pattern([trains[0]]),0,undefined,false,undefined,[],speed);
      accepted=tm.chunks[1].populate(pattern([{...trains[1],zOffset:trains[1].zOffset-80}]),-80,undefined,false,undefined,[chunk],speed)&&accepted;
    }else accepted=chunk.populate(pattern(trains),0,undefined,false,undefined,[],speed);
  } else if(options.kind==='STATIONARY'||options.kind==='MOVING'){
    accepted=chunk.populate(pattern([{type:options.kind==='MOVING'?'MOVING_TRAIN':'TRAIN',lane:0,zOffset:70,length:80,velocityZ:12}]),0,undefined,false,undefined,[],speed);
  } else {
    // Keep catalog hazards intact: these are explicit equipment challenges, not run/transfer plans.
    const composition=TRAIN_COMPOSITIONS.METRO_TRIPLE_CONSIST;
    accepted=chunk.populate(pattern([{type:'TRAIN_COMPOSITION',lane:0,zOffset:70,composition,
      hasRamp:options.kind==='BODY_HIT'?false:undefined}]),0,undefined,false,undefined,[],speed);
    if(options.kind==='BODY_HIT'){
      // A solid coach has no ramp, unlike the catalog's ramp locomotive.
      accepted=chunk.populate(pattern([{type:'TRAIN',lane:0,zOffset:70,length:30}]),0,undefined,false,undefined,[],speed);
    }
  }
  if(!accepted)throw new Error(options.kind+': generated fixture rejected');
  const first=chunk.obstacles[0];
  const all=tm.chunks.flatMap(c=>c.obstacles).filter(o=>o.active);
  const last=plan?chunk.obstacles.at(-1)!:all.at(-1)!;
  const isGround=options.kind==='RAMP'||options.kind==='BODY_HIT';
  const startZ=options.kind==='RAMP'?first.rampCollider!.max.z+2:
    options.kind==='BODY_HIT'?first.bodyCollider!.max.z+10:first.roofStartZ!-1;
  p.position.set(first.group.position.x,isGround?0:4.35,startZ);p.previousPosition.copy(p.position);
  p.currentLane=first.lane;p.targetLane=first.lane;
  if(!isGround)p.resolveRoofLanding(4.35,first.id,first.carriageGroupId);
  p.updateCollider();
  const replay=CrashReplayManager.getInstance();replay.reset();
  const expectDeath=options.kind==='GAP_FALL'||options.kind==='EQUIPMENT_HIT'||options.kind==='BODY_HIT';
  let transferIndex=0,jumps=0,roofFrames=0,invalidRoofFrames=0,frames=0;
  let crossedConnections=0,lastSupport=p.getActiveSupportObstacleId();
  const trace:any[]=[];
  let impact:any=null;
  let layoutRemoval:any=null;
  const snapshot=(dt:number=1/60)=>({seed:options.seed,mode:options.mode,dt,position:{...p.position},previousPosition:{...p.previousPosition},
    velocity:{x:(p.position.x-p.previousPosition.x)/dt,y:p.verticalVelocity,z:(p.position.z-p.previousPosition.z)/dt},state:p.state,support:p.getSupportSurface(),supportId:p.getActiveSupportObstacleId(),
    playerBox:{min:{...p.collider.min},max:{...p.collider.max}},jumping:p.isJumping,
    trains:all.map(obs=>({id:obs.id,lane:obs.lane,velocity:obs.velocityZ,position:{x:obs.group.position.x,y:obs.group.position.y,z:(tm.chunks.find(c=>c.obstacles.includes(obs))?.chunkZ??0)+obs.group.position.z},loaded:tm.chunks.some(c=>c.obstacles.includes(obs)),
      roofSegments:obs.roofSegments?.map(s=>({id:s.id,kind:s.kind,min:{...s.collider.min},max:{...s.collider.max}})),
      collidingBodies:obs.bodySegments?.filter(s=>p.collider.intersectsBox(s.collider)).map(s=>s.id),
      collidingEquipment:obs.rooftopObstacles?.filter(s=>p.collider.intersectsBox(s.collider)).map(s=>({id:s.id,type:s.type,min:{...s.collider.min},max:{...s.collider.max}}))}))});
  const originalCheck=(tm as any).checkCollisions;
  (tm as any).checkCollisions=function(...args:any[]){
    const before=snapshot(args[1]);const value=originalCheck.apply(this,args);
    if(!layoutRemoval && all.some(o=>!tm.chunks.some(c=>c.obstacles.includes(o))))layoutRemoval={previousFrames:trace.slice(-3),after:snapshot(args[1])};
    if(p.state==='CRASH')impact={previousFrames:trace.slice(-3),before,after:snapshot(args[1]),diagnostic:tm.getLastCollisionDiagnostic()};
    trace.push(before);if(trace.length>4)trace.shift();
    return value;
  };
  function control(){
    if(plan && options.kind!=='GAP_FALL' && transferIndex<plan.transfers.length){
      const transfer=plan.transfers[transferIndex];
      const takeoff=4+(transfer.windowStartZ+transfer.windowEndZ)/2;
      if(!p.isJumping && -p.position.z>=takeoff){
        p.jump();jumps++;
        if(transfer.sourceLane!==transfer.targetLane)p.changeLane((transfer.targetLane-transfer.sourceLane) as -1|1);
        transferIndex++;
      }
    }
    if(options.kind==='EQUIPMENT_JUMP'&&!p.isJumping){
      const next=first.rooftopObstacles?.find(o=>o.collider.max.z<p.position.z);
      if(next && p.position.z-next.collider.max.z<=p.speed*0.30){p.jump();jumps++;}
    }
  }
  function observe(){
    frames++;
    if(p.getSupportSurface()==='TRAIN_ROOF'){
      roofFrames++;
      if(!p.isJumping && Math.abs(p.position.y-4.35)>0.001)invalidRoofFrames++;
    }else if(!isGround&&!p.isJumping && p.state!=='CRASH')invalidRoofFrames++;
    if(lastSupport && p.getActiveSupportObstacleId() && p.getActiveSupportObstacleId()!==lastSupport)crossedConnections++;
    lastSupport=p.getActiveSupportObstacleId()??lastSupport;
  }
  const finished=()=>p.state==='CRASH'||p.position.z<last.roofEndZ!+Math.max(2,p.speed*0.12);
  function result(){return {options,accepted,expectDeath,frames,jumps,roofFrames,invalidRoofFrames,crossedConnections,
    finished:finished(),state:p.state,support:p.getSupportSurface(),position:{...p.position},
    supportId:p.getActiveSupportObstacleId(),lastId:last.id,protection:{invulnerable:p.isInvulnerable(),shield:p.powerups.hasShieldActive(),hoverboard:p.hoverboardManager.isBoardActive()},
    analysis:replay.getActiveAnalysis()?{metadata:replay.getActiveAnalysis()!.metadata,explanation:replay.getActiveAnalysis()!.explanation}:null,impact,layoutRemoval};}
  function cleanup(){(tm as any).checkCollisions=originalCheck;}
  return {tm,p,plan,first,last,control,observe,finished,result,cleanup};
}
