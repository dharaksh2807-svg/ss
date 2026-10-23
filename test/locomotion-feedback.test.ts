import { Player } from '../src/player/Player';
import { CharacterModel } from '../src/player/CharacterModel';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { CameraController } from '../src/scene/CameraController';
import { SoundManager } from '../src/audio/SoundManager';
import { LocomotionVFX } from '../src/scene/LocomotionVFX';
import * as THREE from 'three';

// Mock localStorage for node environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => storageMock[k] || null,
  setItem: (k: string, v: string) => { storageMock[k] = v; },
  removeItem: (k: string) => { delete storageMock[k]; },
  clear: () => { for (const k in storageMock) delete storageMock[k]; },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
};

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string): void {
  total++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  passed++;
  console.log(`✅ PASSED: ${msg}`);
}

console.log('🧪 Starting Task 2: Locomotion, Jump, Slide & Landing Feedback Test Suite...\n');

// =========================================================================
// Suite 1: Immediate Jump Response & Authoritative Kinematics (Section A & B)
// =========================================================================
console.log('--- Suite 1: Immediate Jump Response & Authoritative Kinematics ---');
{
  const player = new Player();
  player.reset();

  assert(!player.isJumping, 'Player starts grounded');
  assert(player.verticalVelocity === 0, 'Vertical velocity starts at 0');

  // Measure frame 0 input response (Zero latency check)
  player.handleInput('UP');
  assert(player.isJumping === true, 'Jump initiates on frame 0 synchronously');
  assert(player.verticalVelocity === CONSTANTS.JUMP_INITIAL_VELOCITY, `Initial velocity is ${CONSTANTS.JUMP_INITIAL_VELOCITY} m/s`);
  assert(player.jumpPhase === 'TAKEOFF', 'Jump starts in TAKEOFF phase immediately');
  assert(player.jumpTime === 0, 'Jump time begins at t=0');

  // Verify phase progression across jump trajectory
  let sawTakeoff = false;
  let sawAscend = false;
  let sawApex = false;
  let sawDescend = false;
  let sawLanding = false;

  const dt = 1 / 60;
  let peakY = player.position.y;
  let landed = false;

  for (let i = 0; i < 60; i++) {
    player.update(dt);
    if (player.position.y > peakY) peakY = player.position.y;

    const phase = player.jumpPhase;
    if (phase === 'TAKEOFF') sawTakeoff = true;
    if (phase === 'ASCENDING') sawAscend = true;
    if (phase === 'APEX') sawApex = true;
    if (phase === 'DESCENDING') sawDescend = true;
    if (phase === 'LANDING') sawLanding = true;

    if (!player.isJumping && !landed) {
      landed = true;
    }
  }

  assert(sawTakeoff, 'Observed visual TAKEOFF phase in first 0.06s');
  assert(sawAscend, 'Observed ASCENDING phase during upward climb');
  assert(sawApex, 'Observed APEX phase near zero vertical velocity crest');
  assert(sawDescend, 'Observed DESCENDING phase during downward arc');
  assert(sawLanding, 'Observed LANDING compression phase upon ground contact');
  assert(Math.abs(peakY - (CONSTANTS.PLAYER_BASE_Y + CONSTANTS.JUMP_HEIGHT)) < 0.05,
    `Jump apex reached ${peakY.toFixed(3)}m (expected ${(CONSTANTS.PLAYER_BASE_Y + CONSTANTS.JUMP_HEIGHT).toFixed(3)}m)`);
}

// =========================================================================
// Suite 2: Slide Pose Silhouette & Overhead Obstacle Protection (Section C)
// =========================================================================
console.log('\n--- Suite 2: Slide Silhouette & Overhead Obstacle Protection ---');
{
  const player = new Player();
  player.reset();

  assert(!player.isSliding, 'Player starts not sliding');
  assert(Math.abs((player.collider.max.y - player.collider.min.y) - CONSTANTS.PLAYER_HEIGHT_RUN) < 0.001, 'Collider starts at full height (1.8m)');

  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Slide initiates immediately on input');
  assert(Math.abs((player.collider.max.y - player.collider.min.y) - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.01,
    'Collider immediately drops to 0.75m slide height');

  // Step into slide hold
  const dt = 1 / 60;
  for (let i = 0; i < 20; i++) {
    player.update(dt);
  }

  // Model must be in SLIDE_HOLD
  assert(player.model.getActiveLocomotionState() === 'SLIDE_HOLD', 'CharacterModel in SLIDE_HOLD state during middle of slide');

  // CRITICAL CHECK: While under overhead obstacle, model MUST NOT stand up
  player.isUnderOverheadObstacle = true;
  // Step through remaining regular slide duration
  for (let i = 0; i < 60; i++) {
    player.update(dt);
    // State MUST stay SLIDE_HOLD and not advance to SLIDE_RECOVER while under obstacle
    assert(player.model.getActiveLocomotionState() === 'SLIDE_HOLD',
      'Model firmly maintains SLIDE_HOLD low tuck while under overhead obstacle');
    assert(player.isSliding === true, 'Player continues sliding under overhead obstacle');
  }

  // Now clear the overhead obstacle
  player.isUnderOverheadObstacle = false;

  let sawRecover = false;
  let returnedToRun = false;
  for (let i = 0; i < 30; i++) {
    player.update(dt);
    if (player.model.getActiveLocomotionState() === 'SLIDE_RECOVER') sawRecover = true;
    if (player.model.getActiveLocomotionState() === 'RUN' && !player.isSliding) {
      returnedToRun = true;
      break;
    }
  }

  assert(sawRecover, 'Model executes smooth SLIDE_RECOVER after emerging from obstacle');
  assert(returnedToRun, 'Model returns cleanly to RUN state');
  assert(Math.abs((player.collider.max.y - player.collider.min.y) - CONSTANTS.PLAYER_HEIGHT_RUN) < 0.001, 'Collider restored to 1.8m running height');
}

// =========================================================================
// Suite 3: Fast Drop Mechanics & Roof Landing (Section D)
// =========================================================================
console.log('\n--- Suite 3: Fast Drop Mechanics & Roof Landing ---');
{
  const player = new Player();
  player.reset();

  // Jump then immediately fast drop
  player.handleInput('UP');
  player.update(1 / 60);
  assert(player.isJumping, 'Airborne after jump');

  let fastDropEventFired = false;
  EventBus.getInstance().on(EVENTS.FAST_DROP, () => { fastDropEventFired = true; });

  player.handleInput('DOWN');
  assert(player.isFastDropping === true, 'Fast drop engaged on airborne DOWN swipe');
  assert(player.verticalVelocity === CONSTANTS.FAST_DROP_SPEED, `Vertical velocity set to ${CONSTANTS.FAST_DROP_SPEED} m/s`);
  assert(player.jumpPhase === 'FAST_DROP', 'Jump phase is FAST_DROP');
  assert(fastDropEventFired === true, 'EVENTS.FAST_DROP emitted');

  // Fast drop landing check with event payload verification
  let landEventPayload: any = null;
  EventBus.getInstance().on(EVENTS.LAND, (data) => { landEventPayload = data; });

  let landed = false;
  const dt = 1 / 120;
  for (let i = 0; i < 60; i++) {
    player.update(dt);
    if (!player.isJumping && !landed) {
      landed = true;
      break;
    }
  }

  assert(landed === true, 'Fast drop lands quickly on ground');
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Position clamped to ground Y');
  assert(player.wasFastDropLand === true, 'wasFastDropLand is true for firm landing squash');
  assert(landEventPayload !== null, 'EVENTS.LAND payload emitted');
  assert(landEventPayload.isFastDrop === true, 'EVENTS.LAND payload confirms isFastDrop: true');
  assert(landEventPayload.surface === 'GROUND', 'Surface confirmed as GROUND');

  // Fast drop onto train roof test
  player.reset();
  player.position.set(0, 5.0, -20);
  player.groundY = CONSTANTS.PLAYER_BASE_Y;
  player.isJumping = true;
  player.isFastDropping = true;

  landEventPayload = null;
  // Resolve roof landing at 4.35m
  player.resolveRoofLanding(4.35, 'train_test_1');
  assert(player.position.y === 4.35, 'Player position snapped to train roof (4.35m)');
  assert(player.supportSurface === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
  assert(player.state === 'ON_TRAIN', 'State set to ON_TRAIN');
  assert(player.wasFastDropLand === true, 'wasFastDropLand set on roof landing');
  assert(landEventPayload.isFastDrop === true, 'Roof landing confirms isFastDrop: true');
  assert(landEventPayload.surface === 'TRAIN_ROOF', 'Roof landing confirms TRAIN_ROOF surface');
}

// =========================================================================
// Suite 4: Locomotion VFX & Audio Integration (Section E)
// =========================================================================
console.log('\n--- Suite 4: Locomotion VFX & Audio Integration ---');
{
  const scene = new THREE.Scene();
  const vfx = new LocomotionVFX(scene);
  const player = new Player();
  player.reset();

  // Test landing dust spawning
  vfx.spawnLandingDust(new THREE.Vector3(0, 0, 0), false, 'GROUND');
  // Check that particles were activated in scene group
  const group = scene.getObjectByName('locomotion_vfx_group') as THREE.Group;
  assert(group !== null && group !== undefined, 'LocomotionVFX group added to scene');

  const visibleParticles = group.children.filter((c: any) => c.visible);
  assert(visibleParticles.length >= 8, `Spawned ${visibleParticles.length} landing dust particles (expected >= 8)`);

  // Update particles and verify expansion and fade
  vfx.update(0.10, player);
  assert(visibleParticles[0].scale.x > 0.4, 'Landing particles expand over time');

  // Complete particle lifetime
  vfx.update(0.30, player);
  const remainingActive = group.children.filter((c: any) => c.visible);
  assert(remainingActive.length === 0, 'Landing particles cleanly dissolved after maxAge');

  // Test slide friction particles
  player.handleInput('DOWN');
  assert(player.isSliding, 'Player is sliding');

  vfx.update(0.06, player);
  const slideParticles = group.children.filter((c: any) => c.visible);
  assert(slideParticles.length >= 1, `Spawned ${slideParticles.length} slide friction particles during slide`);

  vfx.reset();
  const afterReset = group.children.filter((c: any) => c.visible);
  assert(afterReset.length === 0, 'LocomotionVFX reset deactivates all active particles');
  vfx.dispose();
}

// =========================================================================
// Suite 5: Camera Controller Landing & Slide Feedback (Section E)
// =========================================================================
console.log('\n--- Suite 5: Camera Controller Landing & Slide Feedback ---');
{
  const cam = new CameraController();
  cam.setLobbyMode(false);
  const pos = new THREE.Vector3(0, CONSTANTS.PLAYER_BASE_Y, 0);
  cam.reset(pos);

  // Normal running update
  cam.update(pos, 0.05, 0, CONSTANTS.INITIAL_SPEED, CONSTANTS.PLAYER_BASE_Y, false);
  const baseCamY = cam.camera.position.y;

  // Slide camera dip test
  cam.update(pos, 0.05, 0.1, CONSTANTS.INITIAL_SPEED, CONSTANTS.PLAYER_BASE_Y, true);
  assert(cam.camera.position.y < baseCamY, 'Camera dips vertically during slide for tactile feedback');

  // Landing impulse test
  EventBus.getInstance().emit(EVENTS.LAND, { isFastDrop: true, surface: 'GROUND', position: pos });
  cam.update(pos, 0.016, 0.2, CONSTANTS.INITIAL_SPEED, CONSTANTS.PLAYER_BASE_Y, false);
  // Verify camera absorbs landing impact smoothly
  assert(cam.camera.position.y < baseCamY, 'Camera absorbs landing impact via landing dip offset');
}

// =========================================================================
// Suite 6: Hoverboard Slide & Jump Compatibility (Section F & G)
// =========================================================================
console.log('\n--- Suite 6: Hoverboard Slide & Jump Compatibility ---');
{
  const player = new Player();
  player.reset();
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive(), 'Hoverboard active');

  // In running stance with hoverboard
  player.update(1 / 60);
  assert(player.model.getActiveLocomotionState() === 'HOVERBOARD', 'Model in HOVERBOARD surfing stance when running');

  // Slide with hoverboard
  player.handleInput('DOWN');
  assert(player.isSliding, 'Player initiates slide with hoverboard');
  player.update(1 / 60);

  // Model MUST transition to SLIDE_ENTRY / SLIDE_HOLD, not remain stuck in upright HOVERBOARD stance!
  const slideState = player.model.getActiveLocomotionState();
  assert(slideState === 'SLIDE_ENTRY' || slideState === 'SLIDE_HOLD',
    `Model enters slide stance with hoverboard (got ${slideState})`);

  // Jump with hoverboard
  player.isSliding = false;
  player.handleInput('UP');
  assert(player.isJumping, 'Player jumps with hoverboard');
  player.update(1 / 60);

  const jumpState = player.model.getActiveLocomotionState();
  assert(jumpState === 'JUMP_TAKEOFF' || jumpState === 'JUMP_ASCEND',
    `Model enters jump takeoff with hoverboard (got ${jumpState})`);
}

// =========================================================================
// Suite 7: Animation Continuity & State Machine Integrity (Section F & G)
// =========================================================================
console.log('\n--- Suite 7: Animation Continuity & State Machine Integrity ---');
{
  const player = new Player();
  player.reset();

  // Test slide to jump cancellation
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Sliding');
  player.handleInput('UP');
  assert(player.isSliding === false, 'Slide immediately cancelled on UP input');
  assert(player.isJumping === true, 'Jump engaged immediately with 0ms cooldown');

  // Verify authoritative single lane switch rule preserved
  const startLane = player.currentLane;
  player.handleInput('RIGHT');
  assert(player.targetLane === startLane + 1, 'Single lane input moves exactly 1 lane to the right');
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passed} / ${total} TASK 2 LOCOMOTION & FEEDBACK TESTS PASSED!`);
console.log(`=======================================================\n`);
