import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { TrackManager } from '../src/track/TrackManager';

// Node localStorage mock
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => { for (const k in storageMock) delete storageMock[k]; },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
};

let total = 0;
let passed = 0;

function assert(condition: boolean, msg: string): void {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

function stepPlayer(player: Player, duration: number, fps: number = 60): void {
  const dt = 1 / fps;
  const steps = Math.round(duration * fps);
  for (let i = 0; i < steps; i++) {
    player.update(dt);
  }
}

console.log('🧪 Starting Metro Runner 3D: Jump -> Fast Drop -> Instant Slide Combo Test Suite...\n');

const obsFactory = new ObstacleFactory();

// =========================================================================
// Suite 1: Airborne Down Input & Immediate Fast-Drop Engagement
// =========================================================================
console.log('--- Suite 1: Airborne Down Input & Immediate Fast-Drop Engagement ---');
{
  const player = new Player();
  player.reset();

  // Jump into the air
  player.handleInput('UP');
  player.update(0.1);
  assert(player.isJumping === true, 'Player initiated jump and is airborne');
  assert(player.position.y > CONSTANTS.PLAYER_BASE_Y + 0.5, 'Player elevated in mid-air');
  assert(player.pendingSlideOnLanding === false, 'pendingSlideOnLanding is initially false');

  let fastDropFired = 0;
  const unsubFastDrop = EventBus.getInstance().on(EVENTS.FAST_DROP, () => { fastDropFired++; });

  // Press DOWN mid-air
  player.handleInput('DOWN');
  assert(player.isFastDropping === true, 'Immediate fast drop engaged on DOWN input');
  assert(player.jumpPhase === 'FAST_DROP', 'Jump phase transitioned to FAST_DROP');
  assert(player.verticalVelocity === CONSTANTS.FAST_DROP_SPEED, `Vertical velocity set to FAST_DROP_SPEED (${CONSTANTS.FAST_DROP_SPEED} m/s)`);
  assert(player.pendingSlideOnLanding === true, 'pendingSlideOnLanding is set to true');
  assert(fastDropFired === 1, 'EVENTS.FAST_DROP emitted exactly once');

  // Repeated DOWN input while descending
  const currentVel = player.verticalVelocity;
  player.handleInput('DOWN');
  assert(player.pendingSlideOnLanding === true, 'pendingSlideOnLanding remains true on repeated input');
  assert(player.verticalVelocity === currentVel, 'Repeated DOWN does not reset or corrupt vertical velocity');
  assert(fastDropFired === 1, 'Repeated DOWN does not emit duplicate FAST_DROP events');

  unsubFastDrop();
}

// =========================================================================
// Suite 2: Ground Touchdown -> Automatic Slide Transition & Collider Safety
// =========================================================================
console.log('\n--- Suite 2: Ground Touchdown -> Automatic Slide Transition & Collider Safety ---');
{
  const player = new Player();
  player.reset();

  let slideFired = 0;
  let landFired = 0;
  let landData: any = null;

  const unsubSlide = EventBus.getInstance().on(EVENTS.SLIDE, () => { slideFired++; });
  const unsubLand = EventBus.getInstance().on(EVENTS.LAND, (data) => { landFired++; landData = data; });

  player.handleInput('UP');
  stepPlayer(player, 0.15, 60);
  player.handleInput('DOWN'); // Engage fast drop + pending slide

  assert(player.isFastDropping === true, 'Fast drop active');
  assert(player.pendingSlideOnLanding === true, 'Slide pending');
  assert(player.isSliding === false, 'Not sliding yet while airborne');

  // Step down until touchdown
  let landedStep = false;
  const dt = 1 / 60;
  for (let s = 0; s < 30; s++) {
    player.update(dt);
    if (!player.isJumping) {
      landedStep = true;
      break;
    }
  }

  assert(landedStep === true, 'Player touched down on ground');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Position clamped to ground level');
  assert(player.isJumping === false, 'isJumping is false upon touchdown');
  assert(player.isFastDropping === false, 'isFastDropping cleared on touchdown');
  assert(player.pendingSlideOnLanding === false, 'pendingSlideOnLanding consumed exactly once');
  assert(player.isSliding === true, 'Player automatically transitions to isSliding = true');
  assert(player.state === 'SLIDE', 'State becomes SLIDE upon landing');
  assert(slideFired === 1, 'EVENTS.SLIDE emitted upon touchdown');
  assert(landFired === 1, 'EVENTS.LAND emitted upon touchdown');
  assert(landData?.isFastDrop === true, 'LAND payload reports isFastDrop: true');

  // Exact collider verification: ZERO frames of standing height
  const colliderHeight = player.getCollider().max.y - player.getCollider().min.y;
  assert(Math.abs(colliderHeight - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.001,
    `Collider height is immediately PLAYER_HEIGHT_SLIDE (0.75m, got ${colliderHeight.toFixed(3)}m)`);

  // Model animation posture is SLIDE_ENTRY / SLIDE_HOLD
  assert(player.model.getActiveLocomotionState() === 'SLIDE_ENTRY' || player.model.getActiveLocomotionState() === 'SLIDE_HOLD',
    `Model animation reflects slide posture (got ${player.model.getActiveLocomotionState()})`);

  // Slide duration ticks down and finishes normally
  stepPlayer(player, CONSTANTS.SLIDE_DURATION + 0.05, 60);
  assert(player.isSliding === false, 'Slide concludes after SLIDE_DURATION');
  assert(player.state === 'RUN', 'Player resumes normal RUN state');
  assert(Math.abs((player.getCollider().max.y - player.getCollider().min.y) - CONSTANTS.PLAYER_HEIGHT_RUN) < 0.001,
    `Collider restored to PLAYER_HEIGHT_RUN (1.8m, got ${(player.getCollider().max.y - player.getCollider().min.y).toFixed(3)}m)`);

  unsubSlide();
  unsubLand();
}

// =========================================================================
// Suite 3: Rooftop Touchdown -> Automatic Slide Transition on Train Roof
// =========================================================================
console.log('\n--- Suite 3: Rooftop Touchdown -> Automatic Slide Transition on Train Roof ---');
{
  const player = new Player();
  player.reset();

  const roofY = 4.35;
  player.position.set(0, 6.0, -30);
  player.groundY = CONSTANTS.PLAYER_BASE_Y;
  player.isJumping = true;

  // Swipe DOWN towards train roof
  player.slide();
  assert(player.isFastDropping === true, 'Fast drop active toward roof');
  assert(player.pendingSlideOnLanding === true, 'Slide pending on roof landing');

  // resolveRoofLanding called by TrackManager swept detection
  player.resolveRoofLanding(roofY, 'train_unit_99');

  assert(player.position.y === roofY, 'Player firmly clamped to roof surface (4.35m)');
  assert(player.groundY === roofY, 'groundY updated to roofY');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
  assert(player.isJumping === false, 'isJumping is false on roof');
  assert(player.isFastDropping === false, 'isFastDropping is false on roof');
  assert(player.pendingSlideOnLanding === false, 'pendingSlideOnLanding consumed on roof');
  assert(player.isSliding === true, 'isSliding is true immediately on train roof');
  assert(player.state === 'SLIDE', 'Player state is SLIDE on train roof');

  const roofColliderH = player.getCollider().max.y - player.getCollider().min.y;
  assert(Math.abs(roofColliderH - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.001,
    `Rooftop collider height is 0.75m (got ${roofColliderH.toFixed(3)}m)`);

  // Complete rooftop slide
  stepPlayer(player, CONSTANTS.SLIDE_DURATION + 0.05, 60);
  assert(player.isSliding === false, 'Rooftop slide completed');
  assert(player.state === 'ON_TRAIN', 'Player state returns cleanly to ON_TRAIN after rooftop slide');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player remains supported by TRAIN_ROOF');
}

// =========================================================================
// Suite 4: Realistic Physical Collision & Overhead Barrier Safety
// =========================================================================
console.log('\n--- Suite 4: Realistic Physical Collision & Overhead Barrier Safety ---');
{
  const player = new Player();
  player.reset();

  // Create High Overhead Barrier (clearance 1.40m, solid gantry above)
  const highBarrierMesh = obsFactory.createHighBarrier(0);
  const highBarrierBox = new THREE.Box3(
    new THREE.Vector3(-1.5, CONSTANTS.HIGH_BARRIER_CLEARANCE, -0.35),
    new THREE.Vector3(1.5, CONSTANTS.HIGH_BARRIER_HEIGHT, 0.35)
  );
  const highBarrierObs = {
    id: 'high_barrier_test',
    type: 'HIGH_BARRIER' as any,
    mesh: highBarrierMesh,
    collider: highBarrierBox,
    lane: 0,
    speed: 0,
    active: true
  };

  // Case 4A: Airborne runner collides with overhead gantry beam during descent before reaching slide clearance
  player.reset();
  player.position.set(0, 2.2, 0); // elevated in overhead beam zone
  player.isJumping = true;
  player.isFastDropping = true;
  player.pendingSlideOnLanding = true;
  player.isSliding = false;
  player.updateCollider();

  const midairOutcome = CollisionResolver.resolveOutcome(highBarrierObs, player, null);
  assert(midairOutcome.outcome !== 'SAFE_CONTACT', 'Fast dropping player in overhead girder zone collides realistically');

  // Case 4B: Player has touched down, pending slide consumed, sliding at 0.9m ground Y
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
  player.isJumping = false;
  player.isFastDropping = false;
  player.pendingSlideOnLanding = false;
  player.isSliding = true;
  player.state = 'SLIDE';
  player.updateCollider();

  const slidingOutcome = CollisionResolver.resolveOutcome(highBarrierObs, player, null);
  assert(slidingOutcome.outcome === 'SAFE_CONTACT', 'Landed sliding player safely clears 1.40m high barrier clearance');

  // Case 4C: Hitting front of train during descent causes fatal collision
  const trainMesh = obsFactory.createTrain('STREAMLINED_EXPRESS', false);
  const trainBox = new THREE.Box3(
    new THREE.Vector3(-1.5, 0, -20),
    new THREE.Vector3(1.5, CONSTANTS.TRAIN_HEIGHT, 0)
  );
  const trainObs = {
    id: 'train_test',
    type: 'TRAIN' as any,
    mesh: trainMesh,
    collider: trainBox,
    roofSurfaceY: 4.35,
    lane: 0,
    speed: 0,
    active: true
  };

  player.reset();
  player.position.set(0, 2.0, 0); // Mid-air, below roof height 4.35m
  player.isJumping = true;
  player.isFastDropping = true;
  player.updateCollider();

  const trainImpact = CollisionResolver.resolveOutcome(trainObs, player, null);
  assert(trainImpact.outcome !== 'SAFE_CONTACT', 'Fast dropping into front of train is fatal without invulnerability');
}

// =========================================================================
// Suite 5: Airborne Lateral Movement (Lane Switching) During Fast-Drop
// =========================================================================
console.log('\n--- Suite 5: Airborne Lateral Movement (Lane Switching) During Fast-Drop ---');
{
  const player = new Player();
  player.reset();

  player.handleInput('UP');
  stepPlayer(player, 0.1, 60);
  player.handleInput('DOWN'); // Engage fast drop
  assert(player.isFastDropping === true, 'Fast drop engaged');

  // Swipe RIGHT while fast-dropping
  player.handleInput('RIGHT');
  assert(player.targetLane === 1, 'Lane change to right initiated while fast-dropping');

  // Step through descent + lane transition
  stepPlayer(player, 0.15, 60);
  assert(player.position.x > 0.5, 'Player laterally moved towards lane 1 during descent');
  assert(player.isSliding === true, 'Player auto-slides upon landing in new lane');
  assert(player.currentLane === 1 || player.targetLane === 1, 'Lane transition maintained');
}

// =========================================================================
// Suite 6: Slide-to-Jump Cancellation & Overhead Barrier Protection
// =========================================================================
console.log('\n--- Suite 6: Slide-to-Jump Cancellation & Overhead Barrier Protection ---');
{
  const player = new Player();
  player.reset();

  // Slide on ground
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Sliding on ground');

  // Interrupt slide with jump
  player.handleInput('UP');
  assert(player.isSliding === false, 'Slide cancelled by jump');
  assert(player.isJumping === true, 'Jump engaged immediately from slide');
  assert(player.pendingSlideOnLanding === false, 'pendingSlideOnLanding is false on fresh jump');

  // Slide under overhead barrier: jumping must be BLOCKED
  stepPlayer(player, 0.7, 60); // Land back on ground
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Sliding again');

  player.setUnderOverheadObstacle(true);
  player.handleInput('UP');
  assert(player.isJumping === false, 'Jump blocked while under overhead obstacle');
  assert(player.isSliding === true, 'Slide continues safely under overhead barrier');

  player.setUnderOverheadObstacle(false);
}

// =========================================================================
// Suite 7: Power-Ups Compatibility (Super Sneakers & Hoverboard)
// =========================================================================
console.log('\n--- Suite 7: Power-Ups Compatibility (Super Sneakers & Hoverboard) ---');
{
  const player = new Player();
  player.reset();

  // 7A: Super Sneakers
  player.powerups.activate('SNEAKERS');
  assert(player.powerups.isSuperSneakersActive() === true, 'Super sneakers active');
  player.handleInput('UP');
  stepPlayer(player, 0.15, 60);
  assert(player.position.y > CONSTANTS.PLAYER_BASE_Y + 1.5, 'Super sneakers high jump');

  player.handleInput('DOWN');
  assert(player.isFastDropping === true, 'Fast drop works with super sneakers');
  assert(player.pendingSlideOnLanding === true, 'Pending slide queued with super sneakers');

  stepPlayer(player, 0.25, 60);
  assert(player.isSliding === true, 'Auto-slides upon landing with super sneakers');
  assert(player.state === 'SLIDE', 'State is SLIDE with super sneakers');

  // 7B: Hoverboard
  player.reset();
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive() === true, 'Hoverboard active');

  player.handleInput('UP');
  stepPlayer(player, 0.15, 60);
  player.handleInput('DOWN');
  assert(player.isFastDropping === true, 'Fast drop works with hoverboard');
  assert(player.pendingSlideOnLanding === true, 'Pending slide queued on hoverboard');

  stepPlayer(player, 0.25, 60);
  assert(player.isSliding === true, 'Auto-slides upon landing with hoverboard');
  assert(player.state === 'SLIDE', 'State is SLIDE on hoverboard');
}

// =========================================================================
// Suite 8: State Cleanup (Crash, Restart, Revive, Jetpack)
// =========================================================================
console.log('\n--- Suite 8: State Cleanup (Crash, Restart, Revive, Jetpack) ---');
{
  const player = new Player();

  // 8A: Crash
  player.reset();
  player.handleInput('UP');
  player.handleInput('DOWN');
  assert(player.pendingSlideOnLanding === true, 'Pending slide set');
  player.crash('TEST_CRASH');
  assert(player.pendingSlideOnLanding === false, 'Crash clears pendingSlideOnLanding');
  assert(player.isFastDropping === false, 'Crash clears isFastDropping');
  assert(player.state === 'CRASH', 'State is CRASH');

  // 8B: Reset
  player.reset();
  player.handleInput('UP');
  player.handleInput('DOWN');
  assert(player.pendingSlideOnLanding === true, 'Pending slide set');
  player.reset();
  assert(player.pendingSlideOnLanding === false, 'Reset clears pendingSlideOnLanding');
  assert(player.isFastDropping === false, 'Reset clears isFastDropping');
  assert(player.state === 'RUN', 'State is RUN');

  // 8C: Revive
  player.handleInput('UP');
  player.handleInput('DOWN');
  assert(player.pendingSlideOnLanding === true, 'Pending slide set');
  player.revive(0);
  assert(player.pendingSlideOnLanding === false, 'Revive clears pendingSlideOnLanding');
  assert(player.isFastDropping === false, 'Revive clears isFastDropping');
  assert(player.state === 'RUN', 'State is RUN');

  // 8D: Jetpack Flight Activation
  player.reset();
  player.handleInput('UP');
  player.handleInput('DOWN');
  assert(player.pendingSlideOnLanding === true, 'Pending slide set');
  player.powerups.activate('JETPACK');
  player.update(0.016); // Triggers jetpack takeoff
  assert(player.pendingSlideOnLanding === false, 'Jetpack takeoff clears pending slide');
  assert(player.isFastDropping === false, 'Jetpack takeoff clears fast drop');
  assert(player.state === 'JETPACK', 'State is JETPACK');
}

// =========================================================================
// Suite 9: Pause / Resume Invariance
// =========================================================================
console.log('\n--- Suite 9: Pause / Resume Invariance ---');
{
  const player = new Player();
  player.reset();

  player.handleInput('UP');
  stepPlayer(player, 0.1, 60);
  player.handleInput('DOWN');
  assert(player.pendingSlideOnLanding === true, 'Pending slide set before pause');

  // Simulate Pause (no player.update ticks while paused)
  // Time passes in pause menu...
  assert(player.pendingSlideOnLanding === true, 'Pending slide preserved during pause');
  assert(player.isSliding === false, 'Slide did NOT execute prematurely during pause');

  // Resume and step to landing
  stepPlayer(player, 0.2, 60);
  assert(player.isSliding === true, 'Slide executes properly upon landing after resume');
  assert(player.pendingSlideOnLanding === false, 'Pending slide consumed after resume');
}

// =========================================================================
// Suite 10: High-Speed Hard Mode (38 m/s) & Multi-Framerate Invariance
// =========================================================================
console.log('\n--- Suite 10: High-Speed Hard Mode & Multi-Framerate Invariance ---');
{
  for (const fps of [30, 60, 120]) {
    const player = new Player();
    player.reset();
    player.speed = 38.0; // Hard mode top speed

    player.handleInput('UP');
    stepPlayer(player, 0.15, fps);
    assert(player.position.y > CONSTANTS.PLAYER_BASE_Y + 1.0, `[${fps} FPS] Airborne at high speed`);

    player.handleInput('DOWN');
    assert(player.isFastDropping === true, `[${fps} FPS] Fast drop active at 38 m/s`);
    assert(player.pendingSlideOnLanding === true, `[${fps} FPS] Pending slide active at 38 m/s`);

    // Step to touchdown
    stepPlayer(player, 0.25, fps);
    assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, `[${fps} FPS] Landed on ground at 38 m/s`);
    assert(player.isSliding === true, `[${fps} FPS] Auto-slides upon landing at 38 m/s`);
    assert(player.state === 'SLIDE', `[${fps} FPS] State is SLIDE at 38 m/s`);
    assert(player.pendingSlideOnLanding === false, `[${fps} FPS] Pending slide consumed at 38 m/s`);

    // Step through slide
    stepPlayer(player, CONSTANTS.SLIDE_DURATION + 0.05, fps);
    assert(player.isSliding === false, `[${fps} FPS] Slide completed at 38 m/s`);
    assert(player.state === 'RUN', `[${fps} FPS] Resumed RUN at 38 m/s`);
  }
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passed}/${total} JUMP-TO-FAST-DROP-TO-SLIDE TESTS PASSED!`);
console.log('=======================================================\n');
