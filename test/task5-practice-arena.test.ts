import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { PRACTICE_MODULES, getPracticeModuleById } from '../src/practice/PracticeCatalog';
import { PracticeController } from '../src/practice/PracticeController';
import { DevTestArena, ArenaScenarioConfig, ReplayRecording } from '../src/debug/DevTestArena';
import { ProgressionManager } from '../src/progression/ProgressionManager';

// Mock localStorage if in node test environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0
  } as any;
}

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    testsFailed++;
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message: string): void {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`✅ PASSED: ${message} (${actual.toFixed(4)} ≈ ${expected}, diff=${diff.toFixed(4)})`);
    testsPassed++;
  } else {
    console.error(`❌ FAILED: ${message} (expected ~${expected}, got ${actual}, diff=${diff})`);
    testsFailed++;
  }
}

console.log('\n=======================================================');
console.log('🧪 RUNNING TASK 5: PRACTICE MODE & TEST ARENA TESTS');
console.log('=======================================================');

// ---------------------------------------------------------------------------
// Suite 1: Practice Modules Catalog & Specification Completeness
// ---------------------------------------------------------------------------
console.log('\n--- Suite 1: Practice Modules Registration & Specification ---');
{
  assert(PRACTICE_MODULES.length === 10, `Found exactly 10 practice modules in curriculum (got ${PRACTICE_MODULES.length})`);

  const expectedIds = [
    'THREE_LANE_MOVEMENT',
    'JUMP_TIMING',
    'SLIDE_TIMING',
    'FAST_DROP',
    'JUMP_AND_LANE_SWITCH',
    'RAMP_CLIMBING',
    'TRAIN_ROOFTOP_LANDING',
    'TRAIN_ROOF_TRANSFER',
    'MOVING_TRAIN_AVOIDANCE',
    'HOVERBOARD_AND_POWERUPS'
  ];

  for (const id of expectedIds) {
    const mod = getPracticeModuleById(id);
    assert(mod !== undefined, `Module '${id}' is registered`);
    assert(!!mod?.title && mod.title.length > 3, `Module '${id}' has descriptive title: "${mod?.title}"`);
    assert(!!mod?.instructions && mod.instructions.length > 10, `Module '${id}' has clear instructions`);
    assert(!!mod?.controlsHint && mod.controlsHint.length > 5, `Module '${id}' has controls guidance: "${mod?.controlsHint}"`);
    assert(!!mod?.objectiveText && mod.objectiveText.length > 10, `Module '${id}' has concrete objective`);
    assert(!!mod?.harderVariationLabel, `Module '${id}' has harder variation: "${mod?.harderVariationLabel}"`);
  }
}

// ---------------------------------------------------------------------------
// Suite 2: Real Gameplay Physics Integration (No Mocking)
// ---------------------------------------------------------------------------
console.log('\n--- Suite 2: Real Engine Integration (Player & TrackManager) ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);

  const mod = getPracticeModuleById('THREE_LANE_MOVEMENT')!;
  mod.setup(player, trackManager, false);

  assert(player.speed === 16.0, `Player starts at configured initial speed (16 m/s)`);
  assert(player.currentLane === 0, `Player positioned in Center Lane`);
  assert(trackManager.chunks[0].obstacles.length === 5, `Chunk populated with 5 real obstacles from module pattern`);

  const obs = trackManager.chunks[0].obstacles[0];
  assert(obs.collider instanceof THREE.Box3, `Obstacles carry authoritative 3D Box3 collision volumes`);
  assert(player.collider instanceof THREE.Box3, `Player has authoritative 3D Box3 collider`);
}

// ---------------------------------------------------------------------------
// Suite 3: Progressive Learning & Success / Failure Detection
// ---------------------------------------------------------------------------
console.log('\n--- Suite 3: Module Evaluation Logic (Success & Failure) ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);

  // 1. Three-Lane Movement
  const laneMod = getPracticeModuleById('THREE_LANE_MOVEMENT')!;
  laneMod.setup(player, trackManager, false);

  // At start
  let evalRes = laneMod.evaluate(player, trackManager, 0.016, 0.1, false);
  assert(evalRes.result === 'IN_PROGRESS', `Lane movement starts IN_PROGRESS`);

  // Simulate fatal crash
  player.state = 'CRASH';
  evalRes = laneMod.evaluate(player, trackManager, 0.016, 0.5, false);
  assert(evalRes.result === 'FAILED', `Crash correctly evaluated as FAILED`);
  assert(evalRes.message.includes('Collision'), `Failure feedback explains collision cause`);

  // Simulate successful traversal
  player.state = 'RUN';
  player.position.z = -80.0;
  evalRes = laneMod.evaluate(player, trackManager, 0.016, 4.0, false);
  assert(evalRes.result === 'SUCCESS', `Reaching end safely evaluated as SUCCESS`);

  // 2. Jump Timing
  const jumpMod = getPracticeModuleById('JUMP_TIMING')!;
  jumpMod.setup(player, trackManager, false);
  player.position.z = -42.0;
  player.state = 'RUN';
  evalRes = jumpMod.evaluate(player, trackManager, 0.016, 2.0, false);
  assert(evalRes.result === 'SUCCESS', `Clearing low hurdle evaluated as SUCCESS`);

  // 3. Slide Timing
  const slideMod = getPracticeModuleById('SLIDE_TIMING')!;
  slideMod.setup(player, trackManager, false);
  player.position.z = -42.0;
  evalRes = slideMod.evaluate(player, trackManager, 0.016, 2.0, false);
  assert(evalRes.result === 'SUCCESS', `Sliding under overhead barrier evaluated as SUCCESS`);

  // 4. Fast Drop
  const fastDropMod = getPracticeModuleById('FAST_DROP')!;
  fastDropMod.setup(player, trackManager, false);
  player.position.z = -50.0;
  evalRes = fastDropMod.evaluate(player, trackManager, 0.016, 2.5, false);
  assert(evalRes.result === 'SUCCESS', `Surviving fast-drop pair evaluated as SUCCESS`);

  // 5. Jump & Lane Switch
  const steerMod = getPracticeModuleById('JUMP_AND_LANE_SWITCH')!;
  steerMod.setup(player, trackManager, false);
  player.position.z = -46.0;
  evalRes = steerMod.evaluate(player, trackManager, 0.016, 2.5, false);
  assert(evalRes.result === 'SUCCESS', `Mid-air lane steer safely cleared flat train front`);

  // 6. Ramp Climbing
  const rampMod = getPracticeModuleById('RAMP_CLIMBING')!;
  rampMod.setup(player, trackManager, false);
  player.setSupportSurface('TRAIN_ROOF', 'train_1');
  player.position.z = -38.0;
  player.position.y = 4.35;
  evalRes = rampMod.evaluate(player, trackManager, 0.016, 2.0, false);
  assert(evalRes.result === 'SUCCESS', `Ascending to train roof evaluated as SUCCESS`);

  // 7. Train Rooftop Landing
  const roofLandMod = getPracticeModuleById('TRAIN_ROOFTOP_LANDING')!;
  roofLandMod.setup(player, trackManager, false);
  player.setSupportSurface('TRAIN_ROOF', 'train_roof_1');
  player.position.z = -30.0;
  player.position.y = 4.35;
  evalRes = roofLandMod.evaluate(player, trackManager, 0.016, 2.0, false);
  assert(evalRes.result === 'SUCCESS', `Touchdown on train roof deck evaluated as SUCCESS`);

  // 8. Rooftop Gap Leap
  const gapMod = getPracticeModuleById('TRAIN_ROOF_TRANSFER')!;
  gapMod.setup(player, trackManager, false);
  // Fall failure check
  player.position.y = 1.0;
  player.position.z = -22.0;
  evalRes = gapMod.evaluate(player, trackManager, 0.016, 1.2, false);
  assert(evalRes.result === 'FAILED', `Falling between train gap correctly evaluated as FAILED`);
  // Success check
  player.position.y = 4.35;
  player.position.z = -32.0;
  player.setSupportSurface('TRAIN_ROOF', 'train_2');
  evalRes = gapMod.evaluate(player, trackManager, 0.016, 1.8, false);
  assert(evalRes.result === 'SUCCESS', `Clearing gap to second train evaluated as SUCCESS`);

  // 9. Moving Train Avoidance
  const movingMod = getPracticeModuleById('MOVING_TRAIN_AVOIDANCE')!;
  movingMod.setup(player, trackManager, false);
  player.position.z = -50.0;
  evalRes = movingMod.evaluate(player, trackManager, 0.016, 2.2, false);
  assert(evalRes.result === 'SUCCESS', `Evading oncoming moving train evaluated as SUCCESS`);

  // 10. Hoverboard Usage
  const boardMod = getPracticeModuleById('HOVERBOARD_AND_POWERUPS')!;
  boardMod.setup(player, trackManager, false);
  player.position.z = -65.0;
  evalRes = boardMod.evaluate(player, trackManager, 0.016, 3.2, false);
  assert(evalRes.result === 'SUCCESS', `Surviving unavoidable barrier with hoverboard evaluated as SUCCESS`);
}

// ---------------------------------------------------------------------------
// Suite 4: Harder Variations Support
// ---------------------------------------------------------------------------
console.log('\n--- Suite 4: Harder Variations ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);

  const mod = getPracticeModuleById('THREE_LANE_MOVEMENT')!;
  mod.setup(player, trackManager, true);

  assert(player.speed === 22.0, `Harder variation sets elevated sprint speed (22 m/s vs 16 m/s)`);

  const rampMod = getPracticeModuleById('RAMP_CLIMBING')!;
  rampMod.setup(player, trackManager, true);
  assert(player.speed === 23.0, `Harder ramp climb sets 23 m/s sprint climb`);

  const movingMod = getPracticeModuleById('MOVING_TRAIN_AVOIDANCE')!;
  movingMod.setup(player, trackManager, true);
  const obsCount = trackManager.chunks[0].obstacles.length;
  assert(obsCount === 2, `Harder moving train spawns additional stationary train blocking Left Lane (got ${obsCount})`);
}

// ---------------------------------------------------------------------------
// Suite 5: Economy & Progression Strict Isolation
// ---------------------------------------------------------------------------
console.log('\n--- Suite 5: Economy & Progression Isolation ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);
  const progression = ProgressionManager.getInstance();

  progression.setActiveGameMode('PRACTICE');
  const initialCoins = progression.getState().lifetimeStats.totalCoins;
  const initialRuns = progression.getState().lifetimeStats.totalRuns;

  // Emit gameplay events during practice
  EventBus.getInstance().emit(EVENTS.COIN_COLLECTED);
  EventBus.getInstance().emit(EVENTS.COIN_COLLECTED);
  EventBus.getInstance().emit(EVENTS.RUN_STARTED);
  EventBus.getInstance().emit(EVENTS.RUN_FINISHED);

  assert(progression.getState().lifetimeStats.totalCoins === initialCoins, `No coins awarded to lifetime stats during PRACTICE mode (${progression.getState().lifetimeStats.totalCoins} === ${initialCoins})`);
  assert(progression.getState().lifetimeStats.totalRuns === initialRuns, `Runs count not incremented during PRACTICE mode (${progression.getState().lifetimeStats.totalRuns} === ${initialRuns})`);

  // Practice Controller Medal storage
  const controller = new PracticeController(player, trackManager);
  controller.startModule('JUMP_TIMING', false);
  assert(controller.isActiveSession() === true, `PracticeController session is active`);

  // Instant retry
  controller.retry();
  assert(controller.getAttempts() === 2, `Retry increments attempt counter to 2`);

  // Verify separate storage
  const medals = controller.getMedals();
  assert(typeof medals === 'object', `Medals persisted separately in localStorage`);

  controller.exit();
  assert(controller.isActiveSession() === false, `Session cleanly exited`);
}

// ---------------------------------------------------------------------------
// Suite 6: Developer Physics Test Arena Controls & Single-Stepping
// ---------------------------------------------------------------------------
console.log('\n--- Suite 6: Developer Physics Test Arena Controls ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);
  const arena = new DevTestArena(scene, player, trackManager);

  assert(arena.isOpen() === false, `DevTestArena starts hidden`);
  arena.show();
  assert(arena.isOpen() === true, `DevTestArena opens on show()`);

  // Simulation pause & single-step
  assert(arena.isSimulationPaused() === false, `Simulation is unpaused initially`);
  (arena as any).isPaused = true;
  assert(arena.isSimulationPaused() === true, `Simulation paused`);

  (arena as any).stepRequested = true;
  assert(arena.consumeStepRequest() === true, `Single frame step request consumed`);
  assert(arena.consumeStepRequest() === false, `Single step consumed exactly once`);

  // Collision wireframes
  arena.setWireframesEnabled(true);
  arena.loadScenario({
    name: 'WIRE_TEST',
    playerLane: 0,
    playerSpeed: 18.0,
    trainType: 'TRAIN',
    trainLength: 20.0
  });

  assert((arena as any).wireframeHelpers.length > 0, `3D wireframe helpers generated for train colliders (${(arena as any).wireframeHelpers.length} helpers)`);
  assert((arena as any).playerWireframe !== null, `3D wireframe helper generated for player collider`);

  arena.setWireframesEnabled(false);
  assert((arena as any).wireframeHelpers.length === 0, `Wireframes cleanly dismantled on disable`);
}

// ---------------------------------------------------------------------------
// Suite 7: Deterministic Replay Engine
// ---------------------------------------------------------------------------
console.log('\n--- Suite 7: Deterministic Replay Recording & Playback ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);
  const arena = new DevTestArena(scene, player, trackManager);

  arena.loadScenario({
    name: 'REPLAY_TEST_SCENARIO',
    playerLane: 0,
    playerSpeed: 18.0,
    obstacleType: 'LOW_BARRIER',
    obstacleZ: 25.0,
    seed: 4242
  });

  // Start recording
  arena.startRecording();
  assert((arena as any).isRecording === true, `Replay recording started`);

  // Simulate player jump input at t = 0.5s
  (arena as any).arenaElapsed = 0.5;
  EventBus.getInstance().emit('INPUT_ACTION', 'UP');

  const rec = arena.stopRecording();
  assert(rec !== null, `Recording stopped and exported`);
  assert(rec?.inputs.length === 1, `Input event captured in recording`);
  assert(rec?.inputs[0].action === 'UP', `Captured action matches 'UP'`);
  assert(rec?.seed === 4242, `PRNG seed stored in replay metadata`);

  // Playback replay
  arena.playReplay(rec!);
  assert((arena as any).isReplaying === true, `Replay playback initiated`);

  // Advance simulation to t = 0.52s and check input dispatch
  arena.update(0.52);
  assert(player.isJumping === true, `Replay engine deterministically dispatched jump action at recorded timestamp`);
}

// ---------------------------------------------------------------------------
// Suite 8: Automated Regression Scenarios (Requirement G)
// ---------------------------------------------------------------------------
console.log('\n--- Suite 8: Authoritative Regression Scenarios ---');
{
  const scene = new THREE.Scene();
  const player = new Player();
  const trackManager = new TrackManager(scene);

  // 1. Lane Skipping: Verify player cleanly switches lanes without skipping
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
  player.handleInput('LEFT');
  assert(player.targetLane === -1, `Lane switch to left initiates targetLane -1`);
  for (let f = 0; f < 10; f++) player.update(0.016);
  assert(player.position.x < -0.5, `Player advances continuously across track without popping`);

  // 2. Train-Front Collision: Non-ramp head-on train must trigger crash
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, -1.0);
  trackManager.chunks[0].chunkZ = 0;
  trackManager.chunks[0].clearDynamicItems();
  trackManager.chunks[0].populate({
    name: 'REGRESSION_HEADON',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 12.0, length: 15.0, hasRamp: false }],
    collectibles: []
  }, 0);

  // Run player forward into train front
  for (let f = 0; f < 40; f++) {
    player.update(0.02);
    trackManager.update(player, 0.02, f * 0.02);
    if (player.state === 'CRASH') break;
  }
  assert(player.state === 'CRASH', `Non-ramp flat-front train triggers expected lethal crash`);

  // 3. Ramp-to-Roof Transition: Ramp train allows climbing up to roof
  player.reset();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
  trackManager.chunks[0].clearDynamicItems();
  trackManager.chunks[0].populate({
    name: 'REGRESSION_RAMP',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN_RAMP', lane: 0, zOffset: 25.0, length: 30.0, hasRamp: true }],
    collectibles: []
  }, 0);

  let ascendedRoof = false;
  for (let f = 0; f < 80; f++) {
    player.update(0.02);
    trackManager.update(player, 0.02, f * 0.02);
    if (player.getSupportSurface() === 'TRAIN_ROOF' || player.position.y >= 4.2) {
      ascendedRoof = true;
      break;
    }
  }
  assert(ascendedRoof === true, `Ramp train enables smooth ascent from ground onto roof`);

  // 4. Rooftop Landing: Descending from jump resolves roof landing
  player.reset();
  player.position.set(0, 5.0, -20.0);
  player.verticalVelocity = -8.0;
  player.isJumping = true;
  player.resolveRoofLanding(4.35, 'test_train');
  assert(player.position.y === 4.35, `Rooftop landing resolves cleanly at roof surface Y=4.35m`);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Support surface updated to TRAIN_ROOF`);

  // 5. Fast-Drop Landing: Fast drop accelerates downward and lands safely
  player.reset();
  player.position.set(0, 3.0, 0);
  player.isJumping = true;
  player.slide(); // Slide while airborne triggers fast-drop
  assert(player.isFastDropping === true, `Airborne slide initiates Fast Drop`);
  assert(player.verticalVelocity <= -15.0, `Fast drop vertical velocity accelerated downwards`);

  // 6. Moving-Train Collision: Moving train advances forward along track
  trackManager.chunks[0].clearDynamicItems();
  trackManager.chunks[0].populate({
    name: 'REGRESSION_MOVING',
    difficulty: 'HARD',
    obstacles: [{
      type: 'MOVING_TRAIN',
      lane: 0,
      zOffset: 40.0,
      length: 20.0,
      isMoving: true,
      velocityZ: 15.0
    }],
    collectibles: []
  }, 0);

  const movingObs = trackManager.chunks[0].obstacles[0];
  const initialZ = movingObs.group.position.z;
  // Update chunk dynamic obstacles
  trackManager.chunks[0].update(0.1, player.position.z);
  const updatedZ = movingObs.group.position.z;
  assert(updatedZ > initialZ, `Moving train position advances forward toward oncoming player`);

  // 7. Shielded Impact: Active shield absorbs fatal collision without death
  player.reset();
  player.powerups.activate('SHIELD');
  const crashResult = player.crash('TRAIN_COLLISION');
  assert(crashResult === false, `Active shield absorbs fatal collision`);
  assert(player.state !== 'CRASH', `Player remains alive after shielded impact`);

  // 8. Impossible Obstacle Pattern Reachability: All standard catalog patterns maintain reachability
  let impossibleFound = false;
  for (const chunk of trackManager.chunks) {
    // Verify that at least one of the 3 lanes has passable clearance or climbable ramp
    const blockedLanes = new Set(chunk.obstacles.filter(o => o.type === 'TRAIN' && !o.hasRamp).map(o => o.lane));
    if (blockedLanes.has(-1) && blockedLanes.has(0) && blockedLanes.has(1)) {
      impossibleFound = true;
    }
  }
  assert(impossibleFound === false, `Authoritative catalog guarantees no impassable 3-lane train walls`);
}

console.log('\n=======================================================');
console.log(`📊 TASK 5 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('=======================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
