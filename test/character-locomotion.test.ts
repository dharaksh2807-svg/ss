import { Player } from '../src/player/Player';
import { CONSTANTS } from '../src/core/Constants';
import { TrackManager } from '../src/track/TrackManager';
import { CharacterModel } from '../src/player/CharacterModel';
import * as THREE from 'three';

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
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

function stepPlayer(player: Player, duration: number, fps: number = 60): void {
  const dt = 1 / fps;
  const steps = Math.round(duration * fps);
  for (let i = 0; i < steps; i++) {
    player.update(dt);
  }
}

console.log('🧪 Starting Task 2: Character Locomotion, Jump Physics & Animation Test Suite...\n');

// =========================================================================
// Test 1: Authoritative Ballistic Jump Physics & Consistency
// =========================================================================
console.log('--- Test 1: Authoritative Ballistic Jump Physics & Kinematic Consistency ---');
{
  const player = new Player();
  player.reset();

  assert(CONSTANTS.JUMP_HEIGHT === 2.25, `JUMP_HEIGHT is 2.25m (got ${CONSTANTS.JUMP_HEIGHT})`);
  assert(CONSTANTS.JUMP_DURATION === 0.60, `JUMP_DURATION is 0.60s (got ${CONSTANTS.JUMP_DURATION})`);
  assert(CONSTANTS.GRAVITY === 50.0, `GRAVITY is 50.0 m/s^2 (got ${CONSTANTS.GRAVITY})`);
  assert(CONSTANTS.JUMP_INITIAL_VELOCITY === 15.0, `JUMP_INITIAL_VELOCITY is 15.0 m/s (got ${CONSTANTS.JUMP_INITIAL_VELOCITY})`);

  // Verify mathematical consistency:
  // v0 = 4 * H / T = 4 * 2.25 / 0.60 = 15.0
  // g = 8 * H / T^2 = 8 * 2.25 / 0.36 = 50.0
  // H_calc = v0^2 / (2 * g) = 225 / 100 = 2.25
  // T_calc = 2 * v0 / g = 30 / 50 = 0.60
  const expectedH = (CONSTANTS.JUMP_INITIAL_VELOCITY * CONSTANTS.JUMP_INITIAL_VELOCITY) / (2 * CONSTANTS.GRAVITY);
  const expectedT = (2 * CONSTANTS.JUMP_INITIAL_VELOCITY) / CONSTANTS.GRAVITY;

  assert(Math.abs(expectedH - CONSTANTS.JUMP_HEIGHT) < 0.0001, 'Kinematic apex height formula matches JUMP_HEIGHT');
  assert(Math.abs(expectedT - CONSTANTS.JUMP_DURATION) < 0.0001, 'Kinematic airtime formula matches JUMP_DURATION');

  // Perform physical jump simulation at 120 FPS
  player.handleInput('UP');
  assert(player.isJumping === true, 'Jump initiated immediately on input');
  assert(player.verticalVelocity === CONSTANTS.JUMP_INITIAL_VELOCITY, 'Takeoff velocity set authoritatively');

  let peakY = player.position.y;
  let timeToPeak = 0;
  let landedTime = 0;
  const dt = 1 / 120;

  for (let s = 0; s < 120; s++) {
    player.update(dt);
    const t = (s + 1) * dt;
    if (player.position.y > peakY) {
      peakY = player.position.y;
      timeToPeak = t;
    }
    if (!player.isJumping && landedTime === 0) {
      landedTime = t;
    }
  }

  const measuredHeightAboveGround = peakY - CONSTANTS.PLAYER_BASE_Y;
  assert(Math.abs(measuredHeightAboveGround - CONSTANTS.JUMP_HEIGHT) < 0.05,
    `Measured apex height is 2.25m (got ${measuredHeightAboveGround.toFixed(3)}m)`);
  assert(Math.abs(timeToPeak - 0.30) < 0.02,
    `Measured time to apex is 0.30s (got ${timeToPeak.toFixed(3)}s)`);
  assert(Math.abs(landedTime - CONSTANTS.JUMP_DURATION) < 0.02,
    `Measured airtime is 0.60s (got ${landedTime.toFixed(3)}s)`);
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player landed cleanly at PLAYER_BASE_Y without offset');
}

// =========================================================================
// Test 2: Jump Sequence & Phase Tracking
// =========================================================================
console.log('\n--- Test 2: Jump Sequence & Dynamic Phase Tracking ---');
{
  const player = new Player();
  player.reset();

  player.handleInput('UP');
  assert(player.getJumpPhase() === 'TAKEOFF', `Initial phase is TAKEOFF (got ${player.getJumpPhase()})`);

  stepPlayer(player, 0.12, 60);
  assert(player.getJumpPhase() === 'ASCENDING', `Phase during upward climb is ASCENDING (got ${player.getJumpPhase()})`);
  assert(player.getJumpProgress() > 0 && player.getJumpProgress() < 0.5, 'Jump progress is between 0 and 0.5 during ascent');

  stepPlayer(player, 0.18, 60); // At ~0.30s (apex)
  assert(player.getJumpPhase() === 'APEX' || player.getJumpPhase() === 'DESCENDING', `Phase near crest is APEX/DESCENDING (got ${player.getJumpPhase()})`);

  stepPlayer(player, 0.15, 60); // At ~0.45s (descent)
  assert(player.getJumpPhase() === 'DESCENDING', `Phase during descent is DESCENDING (got ${player.getJumpPhase()})`);
  assert(player.getJumpProgress() > 0.5, 'Jump progress is > 0.5 during descent');

  stepPlayer(player, 0.18, 60); // Landed
  assert(player.isJumping === false, 'Player is no longer jumping');
  assert(player.getJumpPhase() === 'LANDING' || player.landingTimer > 0, 'Landing absorption active after ground contact');

  stepPlayer(player, CONSTANTS.LANDING_ABSORB_DURATION + 0.02, 60);
  assert(player.getJumpPhase() === 'NONE', 'Jump phase returns to NONE after landing absorption finishes');
  assert(player.state === 'RUN', 'Player state resumes RUN');
}

// =========================================================================
// Test 3: Jump Over Low Barriers
// =========================================================================
console.log('\n--- Test 3: Jump Clearance Over Low Barriers ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player();
  player.reset();

  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();
  chunk.populate({
    name: 'TEST_HURDLE',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 25.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -20.0);
  player.speed = 20.0;

  // Jump before the hurdle
  player.handleInput('UP');
  assert(player.isJumping === true, 'Jump initiated before low barrier');

  // Step 0.25s (reaches ~-25m where hurdle is placed)
  stepPlayer(player, 0.25, 60);
  trackManager.update(player, 0.016, 0);

  assert(player.position.y > CONSTANTS.LOW_BARRIER_HEIGHT + 0.5, `Player clears hurdle easily (Y = ${player.position.y.toFixed(2)}m > ${CONSTANTS.LOW_BARRIER_HEIGHT + 0.5}m)`);
  assert(player.state !== 'CRASH', 'Player cleared low barrier without crashing');
}

// =========================================================================
// Test 4: Sliding & Rolling Sequence and Obstacle Overhead Safety
// =========================================================================
console.log('\n--- Test 4: Sliding Sequence, Collider Height & Overhead Barrier Safety ---');
{
  const player = new Player();
  player.reset();

  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Slide engages on DOWN input');
  assert(player.state === 'SLIDE', 'Player state is SLIDE');

  // Verify collider height in slide
  const slideColliderHeight = player.collider.max.y - player.collider.min.y;
  assert(Math.abs(slideColliderHeight - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.001,
    `Collider height drops to 0.75m in slide (got ${slideColliderHeight.toFixed(2)}m)`);
  assert(player.collider.max.y <= CONSTANTS.HIGH_BARRIER_CLEARANCE + 0.4, 'Slide collider fits under high barrier clearance');

  // Slide progress tracking
  stepPlayer(player, 0.1, 60);
  assert(player.getSlideProgress() > 0 && player.getSlideProgress() < 0.3, 'Slide progress increases during slide entry');

  // Retriggering slide extends duration without invalid state
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Slide remains active on retrigger');

  // Overhead barrier safety: if under barrier, player cannot stand up or jump into ceiling!
  player.setUnderOverheadObstacle(true);
  stepPlayer(player, CONSTANTS.SLIDE_DURATION + 0.1, 60);
  assert(player.isSliding === true, 'Player remains sliding while under overhead obstacle (does NOT snap upright inside barrier!)');

  // Attempt to jump while underneath overhead obstacle
  player.handleInput('UP');
  assert(player.isJumping === false, 'Jump blocked while under overhead obstacle');
  assert(player.isSliding === true, 'Slide continues safely under barrier');

  // Clear of overhead obstacle: slide finishes safely
  player.setUnderOverheadObstacle(false);
  stepPlayer(player, 0.1, 60);
  assert(player.isSliding === false, 'Player exits slide smoothly once cleared of obstacle');
  assert(player.state === 'RUN', 'Player resumes upright RUN state');
}

// =========================================================================
// Test 5: Fast-Drop Mechanic
// =========================================================================
console.log('\n--- Test 5: Airborne Fast-Drop Descent & Touchdown ---');
{
  const player = new Player();
  player.reset();

  player.handleInput('UP');
  stepPlayer(player, 0.25, 60); // Climbing to near apex
  assert(player.isJumping === true, 'Player is airborne');
  assert(player.position.y > 2.5, `Player is near apex (Y = ${player.position.y.toFixed(2)}m)`);

  // Swipe DOWN in air -> triggers fast drop dive
  player.handleInput('DOWN');
  assert(player.verticalVelocity === CONSTANTS.FAST_DROP_SPEED, `Fast drop velocity set to ${CONSTANTS.FAST_DROP_SPEED} m/s`);
  assert(player.isFastDropping === true, 'Fast drop flag is active');
  assert(player.getJumpPhase() === 'FAST_DROP', 'Jump phase transitioned to FAST_DROP');

  // Rapid double-trigger DOWN while fast-dropping does not glitch
  player.handleInput('DOWN');
  assert(player.isFastDropping === true, 'Double-trigger slide input preserves fast drop safely');

  // Step 0.15s: fast drop reaches ground swiftly without teleporting
  stepPlayer(player, 0.15, 60);
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player touched down safely on ground');
  assert(player.isJumping === false, 'Airborne state concluded');
  assert(player.isFastDropping === false, 'Fast drop concluded cleanly on touchdown');
}

// =========================================================================
// Test 6: Train-Roof Traversal, Jumping & Falling
// =========================================================================
console.log('\n--- Test 6: Train-Roof Landing, Rooftop Jump & Stepping Off ---');
{
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player();
  player.reset();

  const roofY = 4.35;
  player.position.set(0, roofY, -50.0);
  player.resolveRoofLanding(roofY);

  assert(player.state === 'ON_TRAIN', 'Player state is ON_TRAIN');
  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Support surface is TRAIN_ROOF');
  assert(player.groundY === roofY, `Ground height matches train roof: ${roofY}m`);

  // Jump while on train roof
  player.handleInput('UP');
  assert(player.isJumping === true, 'Jump initiates on train roof');
  stepPlayer(player, 0.30, 60); // At apex above roof
  assert(player.position.y > roofY + 2.0, `Apex above roof reached > ${roofY + 2.0}m (got ${player.position.y.toFixed(2)}m)`);

  // Descend back to train roof
  stepPlayer(player, 0.35, 60);
  assert(player.isJumping === false, 'Player landed back on train roof');
  assert(player.position.y === roofY, 'Player height resolved cleanly to roofY');
  assert(player.state === 'ON_TRAIN', 'State returned to ON_TRAIN');

  // Fast drop on train roof -> automatic slide upon landing combo!
  player.handleInput('UP');
  stepPlayer(player, 0.20, 60);
  player.handleInput('DOWN'); // fast drop
  stepPlayer(player, 0.15, 60);
  assert(player.position.y === roofY, `Fast drop landed cleanly on roof (Y = ${player.position.y}m)`);
  assert(player.isSliding === true, 'Player automatically slides upon landing on train roof');
  assert(player.state === 'SLIDE', 'State transitions to SLIDE upon rooftop landing');

  // Complete slide duration on roof
  stepPlayer(player, CONSTANTS.SLIDE_DURATION, 60);
  assert(player.state === 'ON_TRAIN', 'State returned to ON_TRAIN after rooftop slide completed');

  // Step off train roof into air (simulate stepping beyond train edge)
  player.setGroundHeight(CONSTANTS.PLAYER_BASE_Y);
  stepPlayer(player, 0.05, 60);
  assert(player.isJumping === true, 'Stepping off train roof engages falling');
  assert(player.state === 'FALLING_FROM_TRAIN', `State is FALLING_FROM_TRAIN (got ${player.state})`);

  // Descend to track ground
  stepPlayer(player, 0.6, 60);
  assert(player.position.y === CONSTANTS.PLAYER_BASE_Y, 'Player safely reached track ground level');
  assert(player.state === 'RUN', 'State resumed ground RUN');
}

// =========================================================================
// Test 7: Simultaneous Lane-Change while Jumping or Sliding
// =========================================================================
console.log('\n--- Test 7: Simultaneous Airborne and Sliding Lane Changes ---');
{
  const player = new Player();
  player.reset();

  // 1. Jump + Lane Change
  player.handleInput('UP');
  assert(player.isJumping === true, 'Jump started in center lane');

  player.handleInput('LEFT');
  stepPlayer(player, 0.15, 60);
  assert(player.isJumping === true, 'Player remains airborne while changing lane');
  assert(player.position.x < 0, 'Lateral position moved towards left lane');

  stepPlayer(player, 0.5, 60);
  assert(player.isJumping === false, 'Player landed after airborne lane change');
  assert(player.currentLane === -1, 'Player landed cleanly on Left lane (-1)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[-1]) < 0.001, 'Authoritative X matches Left lane exactly');

  // 2. Slide + Lane Change
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Slide started in left lane');

  player.handleInput('RIGHT');
  stepPlayer(player, 0.15, 60);
  assert(player.isSliding === true, 'Player remains sliding while changing lane');
  assert(Math.abs((player.collider.max.y - player.collider.min.y) - CONSTANTS.PLAYER_HEIGHT_SLIDE) < 0.001, 'Collider remains low profile');

  stepPlayer(player, 0.5, 60);
  assert(player.currentLane === 0, 'Player completed transition to Center lane (0)');
  assert(Math.abs(player.position.x - CONSTANTS.LANES[0]) < 0.001, 'Authoritative X matches Center lane');
}

// =========================================================================
// Test 8: Speed-Scaled Locomotion Cadence & Animation Transitions
// =========================================================================
console.log('\n--- Test 8: Speed-Dependent Locomotion Cadence & Smooth Blending ---');
{
  const model = new CharacterModel('char_jax');

  // Verify state mapping
  model.updateAnimation('RUN', 18.0, 0, 0.9, 0.016);
  assert(model.getActiveLocomotionState() === 'RUN', 'Locomotion state resolves to RUN');

  model.updateAnimation('JUMP', 18.0, 0, 0.9, 0.016, 'TAKEOFF', 0.05, 0, 0);
  assert(model.getActiveLocomotionState() === 'JUMP_TAKEOFF', 'Locomotion state resolves to JUMP_TAKEOFF');

  model.updateAnimation('JUMP', 18.0, 0, 0.9, 0.016, 'ASCENDING', 0.25, 0, 0);
  assert(model.getActiveLocomotionState() === 'JUMP_ASCEND', 'Locomotion state resolves to JUMP_ASCEND');

  model.updateAnimation('JUMP', 18.0, 0, 0.9, 0.016, 'APEX', 0.50, 0, 0);
  assert(model.getActiveLocomotionState() === 'JUMP_APEX', 'Locomotion state resolves to JUMP_APEX');

  model.updateAnimation('JUMP', 18.0, 0, 0.9, 0.016, 'DESCENDING', 0.75, 0, 0);
  assert(model.getActiveLocomotionState() === 'JUMP_DESCEND', 'Locomotion state resolves to JUMP_DESCEND');

  model.updateAnimation('RUN', 18.0, 0, 0.9, 0.016, 'LANDING', 1.0, 0, 0.5);
  assert(model.getActiveLocomotionState() === 'JUMP_LAND', 'Locomotion state resolves to JUMP_LAND during landing absorption');

  model.updateAnimation('SLIDE', 18.0, 0, 0.9, 0.016, 'NONE', 0, 0.1, 0);
  assert(model.getActiveLocomotionState() === 'SLIDE_ENTRY', 'Locomotion state resolves to SLIDE_ENTRY');

  model.updateAnimation('SLIDE', 18.0, 0, 0.9, 0.016, 'NONE', 0, 0.5, 0);
  assert(model.getActiveLocomotionState() === 'SLIDE_HOLD', 'Locomotion state resolves to SLIDE_HOLD');

  model.updateAnimation('SLIDE', 18.0, 0, 0.9, 0.016, 'NONE', 0, 0.9, 0);
  assert(model.getActiveLocomotionState() === 'SLIDE_RECOVER', 'Locomotion state resolves to SLIDE_RECOVER');

  model.updateAnimation('JUMP', 18.0, 0, 0.9, 0.016, 'FAST_DROP', 0.5, 0, 0);
  assert(model.getActiveLocomotionState() === 'FAST_DROP', 'Locomotion state resolves to FAST_DROP');

  // Verify mathematical continuity (no NaN or Infinity) across 60 frames of multi-action transitions
  const player = new Player();
  player.reset();

  const actions: Array<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'> = ['UP', 'RIGHT', 'DOWN', 'LEFT', 'UP', 'DOWN'];
  for (const act of actions) {
    player.handleInput(act);
    for (let f = 0; f < 20; f++) {
      player.update(0.016);
      assert(!isNaN(player.position.x) && !isNaN(player.position.y) && !isNaN(player.position.z), 'Player position coordinates are finite');
      assert(!isNaN(player.mesh.position.y), 'Player mesh position is finite');
    }
  }
  console.log('✅ PASSED: Full state machine transitions preserve mathematical continuity without NaNs');
}

// =========================================================================
// Test 9: Frame-Rate Invariance (30, 60, 120 FPS)
// =========================================================================
console.log('\n--- Test 9: Frame-Rate Invariance across 30, 60 and 120 FPS ---');
{
  function measureJump(fps: number): { peakHeight: number; airtime: number } {
    const player = new Player();
    player.reset();
    player.handleInput('UP');

    let peak = player.position.y;
    let airtime = 0;
    const dt = 1 / fps;

    for (let i = 0; i < fps * 1.5; i++) {
      player.update(dt);
      if (player.position.y > peak) {
        peak = player.position.y;
      }
      if (!player.isJumping && airtime === 0) {
        airtime = (i + 1) * dt;
      }
    }
    return { peakHeight: peak - CONSTANTS.PLAYER_BASE_Y, airtime };
  }

  const res30 = measureJump(30);
  const res60 = measureJump(60);
  const res120 = measureJump(120);

  console.log(`  30 FPS -> Peak: ${res30.peakHeight.toFixed(3)}m, Airtime: ${res30.airtime.toFixed(3)}s`);
  console.log(`  60 FPS -> Peak: ${res60.peakHeight.toFixed(3)}m, Airtime: ${res60.airtime.toFixed(3)}s`);
  console.log(`  120 FPS -> Peak: ${res120.peakHeight.toFixed(3)}m, Airtime: ${res120.airtime.toFixed(3)}s`);

  assert(Math.abs(res30.peakHeight - res60.peakHeight) < 0.06, 'Jump peak height delta between 30 FPS and 60 FPS < 0.06m');
  assert(Math.abs(res60.peakHeight - res120.peakHeight) < 0.04, 'Jump peak height delta between 60 FPS and 120 FPS < 0.04m');
  assert(Math.abs(res30.airtime - res60.airtime) < 0.04, 'Airtime delta between 30 FPS and 60 FPS < 0.04s');
  assert(Math.abs(res60.airtime - res120.airtime) < 0.02, 'Airtime delta between 60 FPS and 120 FPS < 0.02s');
}

// =========================================================================
// Test 10: Jetpack & Hoverboard Compatibility
// =========================================================================
console.log('\n--- Test 10: Jetpack & Hoverboard Compatibility ---');
{
  const player = new Player();
  player.reset();

  // Hoverboard surfing
  player.hoverboardManager.activate();
  assert(player.hoverboardManager.isBoardActive(), 'Hoverboard activated');
  stepPlayer(player, 0.2, 60);
  assert(player.model.getActiveLocomotionState() === 'HOVERBOARD', 'Model state reflects HOVERBOARD stance');

  // Jumping while on hoverboard
  player.handleInput('UP');
  assert(player.isJumping === true, 'Hoverboard jump engages cleanly');
  stepPlayer(player, 0.65, 60);
  assert(player.isJumping === false, 'Hoverboard jump landed cleanly');

  // Jetpack flight
  player.powerups.activate('JETPACK');
  stepPlayer(player, 0.5, 60);
  assert(player.state === 'JETPACK', 'Player entered JETPACK state');
  assert(player.model.getActiveLocomotionState() === 'JETPACK', 'Model state reflects JETPACK flight posture');
  assert(player.position.y > 6.0, `Player reached flight altitude (Y = ${player.position.y.toFixed(2)}m)`);
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passed}/${total} CHARACTER LOCOMOTION & JUMP PHYSICS TESTS PASSED!`);
console.log('=======================================================\n');
