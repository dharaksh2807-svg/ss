import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { SpeedController } from '../src/core/SpeedController';
import { DifficultyController } from '../src/track/DifficultyController';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { PacingMetrics } from '../src/track/PacingMetrics';

// Polyfill localStorage for node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
    length: 0,
    key: () => null
  } as any;
}

console.log('🧪 Starting Metro Runner 3D: Phase 3 Procedural Fairness, Rooftops & Collision Audit Suite...\n');

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    failed++;
  }
}

function createHarness(gameMode: 'NORMAL' | 'HARD' = 'NORMAL') {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  trackManager.setGameMode(gameMode);
  const player = new Player(scene);
  player.reset();
  return { scene, trackManager, player };
}

// =============================================================================
// SUITE 1: Hard Mode Early Crash Investigation (Seed 1599997308)
// =============================================================================
console.log('--- Suite 1: Hard Mode Opening & Seed 1599997308 Crash Investigation ---');
{
  const { trackManager, player } = createHarness('HARD');
  const REPRO_SEED = 1599997308;
  trackManager.setSeed(REPRO_SEED, true);
  trackManager.reset(false);

  const chunk0 = trackManager.chunks[0];
  assert(chunk0 !== undefined, 'Chunk 0 generated at start of Hard Mode run');
  assert(chunk0.patternName === 'OPENING_DISTANT_TRAIN', 'Seed 1599997308 selects OPENING_DISTANT_TRAIN');

  const centerTrain = chunk0.obstacles.find(o => o.type === 'TRAIN' && o.lane === 0);
  assert(centerTrain !== undefined, 'Stationary train hazard exists in lane 0');

  // Verify distance and reaction window
  const trainFrontZ = centerTrain!.collider.max.z; // -47.0m
  const reactionDist = Math.abs(trainFrontZ);
  const hardInitialSpeed = new SpeedController('HARD').getSpeed(); // 28 m/s
  const reactionTime = reactionDist / hardInitialSpeed;

  assert(trainFrontZ === -47.0, `Train front bumper is positioned at Z = -47.0m (actual: ${trainFrontZ}m)`);
  assert(reactionDist === 47.0, `Starting hazard distance is 47.0m (sufficient distance, was 24m in early crash)`);
  assert(reactionTime >= 1.65, `Reaction time in Hard Mode is ${reactionTime.toFixed(2)}s (>= 1.5s fairness standard)`);

  // Simulate human player reaction with 0.5s reaction delay followed by lane change to lane -1
  player.position.set(0, 0, 0);
  const dt = 1 / 60;
  let survivedWithDodge = false;
  let fatalWithoutDodge = false;

  // Run dodge simulation
  for (let frame = 1; frame <= 180; frame++) {
    const time = frame * dt;
    if (time >= 0.5 && player.currentLane === 0 && !player.isChangingLaneActive()) {
      player.changeLane(-1);
    }
    player.update(dt);
    trackManager.update(player, dt, dt);

    if (player.state === 'CRASH') {
      break;
    }
    if (player.position.z < trainFrontZ - 5.0) {
      survivedWithDodge = true;
      break;
    }
  }
  assert(survivedWithDodge, 'Human reaction (0.5s delay + lane switch) safely bypasses opening train');

  // Test that staying straight in lane 0 without dodging remains genuinely fatal (fair consequence)
  player.reset();
  player.position.set(0, 0, 0);
  for (let frame = 1; frame <= 180; frame++) {
    player.update(dt);
    trackManager.update(player, dt, dt);
    if (player.state === 'CRASH') {
      fatalWithoutDodge = true;
      break;
    }
  }
  assert(fatalWithoutDodge, 'Ignoring center hazard results in genuine fatal frontal collision (lethality preserved)');
}

// =============================================================================
// SUITE 2: Procedural Reachability Across All Catalog Patterns & Transitions
// =============================================================================
console.log('\n--- Suite 2: Procedural Reachability & Cross-Chunk Transition Invariance ---');
{
  const testSpeeds = [18.0, 28.0, 38.0, 52.0];
  let allCatalogPatternsSolvable = true;

  for (const pattern of OBSTACLE_PATTERNS) {
    for (const spd of testSpeeds) {
      const res = ReachabilityValidator.validatePattern(pattern as any, spd);
      if (!res.solvable) {
        allCatalogPatternsSolvable = false;
        console.error(`Catalog pattern ${pattern.name} failed at ${spd} m/s: ${res.reason}`);
      }
    }
  }
  assert(allCatalogPatternsSolvable, `All ${OBSTACLE_PATTERNS.length} obstacle patterns are 100% solvable across all speeds [18 - 52 m/s]`);

  // Multi-chunk sequential transition validation across 10 random seeds
  const seeds = [1337, 2024, 4242, 7777, 9999, 10101, 88888, 123456, 654321, 987654];
  let zeroTransitionFailures = true;
  let totalChunksTested = 0;

  for (const seed of seeds) {
    const { trackManager, player } = createHarness('NORMAL');
    trackManager.setSeed(seed, true);
    trackManager.reset(false);

    let currentPattern = trackManager.chunks[0].pattern;
    for (let c = 1; c < 25; c++) {
      totalChunksTested++;
      const speed = new SpeedController('NORMAL').evaluateCurve(c * 120.0);
      const nextPattern = trackManager.selectPattern(c, speed, c * 120.0, true);

      if (currentPattern && !ReachabilityValidator.validateChunkTransition(currentPattern as any, nextPattern as any, speed)) {
        zeroTransitionFailures = false;
        console.error(`Transition failed from ${currentPattern.name} to ${nextPattern.name} at chunk ${c}`);
      }
      currentPattern = nextPattern;
    }
  }

  assert(zeroTransitionFailures, `Zero transition reachability failures across ${totalChunksTested} procedural chunks in multi-seed run`);
}

// =============================================================================
// SUITE 3: Rooftop Movement, Ramp Geometry & Contact Relationships
// =============================================================================
console.log('\n--- Suite 3: Rooftop Movement, Ramp Geometry & Contact Relationships ---');
{
  const factory = new ObstacleFactory();
  const colFactory = new CollectibleFactory();
  const chunk = new TrackChunk(factory, colFactory);
  chunk.chunkZ = 0;

  // Create climbable ramp train
  chunk.populate({
    name: 'TEST_ROOFTOP_RAMP',
    difficulty: 'EASY',
    obstacles: [
      {
        type: 'TRAIN_RAMP',
        lane: 0,
        zOffset: 30.0,
        length: 26.0,
        hasRamp: true
      }
    ],
    collectibles: []
  }, 0);

  const trainObs = chunk.obstacles[0];
  assert(trainObs.hasRamp === true, 'Train obstacle configured with climbable ramp');
  assert(trainObs.rampCollider !== undefined, 'Ramp collider volume generated');
  assert(trainObs.roofCollider !== undefined, 'Roof collider volume generated');

  const { trackManager, player } = createHarness('NORMAL');
  trackManager.chunks[0] = chunk;

  // 1. Ramp base entry
  const rampBaseZ = trainObs.rampCollider!.max.z; // Z = -17.0m
  player.position.set(0, 0, rampBaseZ - 0.1);
  player.verticalVelocity = 0;
  player.isJumping = false;
  trackManager.update(player, 0.016, 0.016);

  assert(player.getSupportSurface() === 'RAMP', `Player successfully enters RAMP support surface (got ${player.getSupportSurface()})`);
  assert(player.getActiveSupportObstacleId() === trainObs.id, 'Active support obstacle matches train ID');

  // 2. Ramp ascent
  const rampMidZ = (trainObs.rampCollider!.max.z + trainObs.rampCollider!.min.z) * 0.5;
  player.position.set(0, 2.0, rampMidZ);
  trackManager.update(player, 0.016, 0.016);
  assert(player.getSupportSurface() === 'RAMP', 'Player remains supported on ramp during ascent');
  assert(player.position.y > 1.5 && player.position.y < 3.5, `Ascent height is continuous along slope (Y = ${player.position.y.toFixed(2)}m)`);

  // 3. Ramp to roof handoff
  const rampTopZ = trainObs.rampCollider!.min.z - 0.2; // Just past top of ramp
  player.position.set(0, 4.35, rampTopZ);
  trackManager.update(player, 0.016, 0.016);
  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Player smoothly promoted to TRAIN_ROOF at ramp top (got ${player.getSupportSurface()})`);
  assert(player.position.y === 4.35, `Player height locked to roof surface 4.35m (got ${player.position.y}m)`);

  // 4. Moving train platform velocity transfer
  const movingTrainObs = factory.createMovingTrain(24.0, CONSTANTS.COLORS.TRAIN_BODY_2);
  const mObsInstance = {
    id: 'moving_roof_test',
    group: movingTrainObs.group,
    type: 'MOVING_TRAIN' as const,
    lane: 1 as LaneIndex,
    collider: new THREE.Box3(),
    roofCollider: new THREE.Box3(new THREE.Vector3(1.6, 3.9, -60), new THREE.Vector3(2.8, 5.5, -30)),
    roofSurfaceY: 4.35,
    active: true,
    isMoving: true,
    velocityZ: 20.0,
    previousWorldZ: -45.0,
    nearMissBox: new THREE.Box3()
  };
  chunk.obstacles.push(mObsInstance as any);

  player.position.set(2.2, 4.35, -45.0);
  player.setSupportSurface('TRAIN_ROOF', mObsInstance.id);
  player.isJumping = false;

  // Move train by +1.0m
  mObsInstance.group.position.z += 1.0;
  trackManager.update(player, 0.05, 0.05);

  assert(player.position.z === -44.0, `Platform relative velocity displaced player with moving train (+1.0m, got Z = ${player.position.z})`);

  // 5. Unbridged roof exit into open air
  player.position.set(2.2, 4.35, -10.0); // Outside train roof
  trackManager.update(player, 0.05, 0.05);
  assert(player.getSupportSurface() === 'GROUND', 'Stepping off roof into open air resets support to GROUND');
  assert(player.state === 'FALLING_FROM_TRAIN' || player.isJumping, 'Stepping off roof initiates falling state');

  // 6. Non-ramp train frontal collision lethality
  const nonRampTrain = factory.createTrain(24.0, false, 0x1e88e5);
  const solidTrainInstance = {
    id: 'solid_train_front_test',
    group: nonRampTrain,
    type: 'TRAIN' as const,
    lane: 0 as LaneIndex,
    collider: new THREE.Box3(new THREE.Vector3(-1.1, 0, -80), new THREE.Vector3(1.1, 4.2, -56)),
    bodyCollider: new THREE.Box3(new THREE.Vector3(-1.1, 0, -80), new THREE.Vector3(1.1, 3.75, -56)),
    active: true,
    isMoving: false,
    nearMissBox: new THREE.Box3()
  };
  chunk.obstacles.push(solidTrainInstance as any);

  player.reset();
  player.position.set(0, 0, -56.5); // Right in front of non-ramp train bumper
  const frontalResolution = CollisionResolver.resolveOutcome(solidTrainInstance as any, player, null, true);
  assert(frontalResolution.outcome === 'MAJOR_FATAL_HIT', `Non-ramp train front remains fatal (outcome: ${frontalResolution.outcome})`);
}

// =============================================================================
// SUITE 4: Obstacle & Collision Bounds Geometric Alignment
// =============================================================================
console.log('\n--- Suite 4: Obstacle & Collision Bounds Geometric Alignment ---');
{
  const factory = new ObstacleFactory();

  // 1. Low hurdle visible height vs collider
  const lowBarrierGroup = factory.createLowBarrier(0);
  const lowBbox = new THREE.Box3().setFromObject(lowBarrierGroup);
  const lowVisualHeight = lowBbox.max.y - lowBbox.min.y;
  assert(Math.abs(lowVisualHeight - CONSTANTS.LOW_BARRIER_HEIGHT) < 0.25, `Low barrier visual height (${lowVisualHeight.toFixed(2)}m) matches ~${CONSTANTS.LOW_BARRIER_HEIGHT}m`);

  // 2. High barrier ground clearance vs sliding player height
  const highBarrierGroup = factory.createHighBarrier(0);
  const highBbox = new THREE.Box3().setFromObject(highBarrierGroup);
  assert(CONSTANTS.HIGH_BARRIER_CLEARANCE === 1.40, `High barrier clearance constant is 1.40m`);
  assert(CONSTANTS.PLAYER_HEIGHT_SLIDE === 0.75, `Sliding player height is 0.75m (< 1.40m clearance)`);
  assert(CONSTANTS.PLAYER_HEIGHT_RUN === 1.80, `Standing player height is 1.80m (> 1.40m clearance)`);

  // 3. Moving train Swept CCD Tunneling Prevention
  const { trackManager, player } = createHarness('HARD');
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Fast oncoming train moving at 54 m/s
  chunk.populate({
    name: 'SWEPT_CCD_TEST',
    difficulty: 'HARD',
    obstacles: [
      {
        type: 'MOVING_TRAIN',
        lane: 0,
        zOffset: 35.0,
        length: 24.0,
        isMoving: true,
        velocityZ: 54.0
      }
    ],
    collectibles: []
  }, 0);

  // Player in lane 0 moving at 28 m/s toward -Z
  player.position.set(0, 0, -20.0);
  player.previousPosition.set(0, 0, -20.0);
  player.speed = 28.0;

  // Advance player by 0.20s frame (player moves 5.6m down -Z, train moves 10.8m up +Z)
  player.update(0.20);
  trackManager.update(player, 0.20, 0.20);
  assert(player.state === 'CRASH', 'High-speed moving train (54 m/s) triggers lethal collision without tunneling during frame spike');
}

// =============================================================================
// SUITE 5: Difficulty Calibration (Normal vs Hard Mode Telemetry)
// =============================================================================
console.log('\n--- Suite 5: Difficulty Calibration (Normal vs Hard Mode Telemetry) ---');
{
  const normalSpeed = new SpeedController('NORMAL');
  const hardSpeed = new SpeedController('HARD');

  // 1. Speed Progression Comparison
  const normalEarly = normalSpeed.evaluateCurve(200.0);
  const hardEarly = hardSpeed.evaluateCurve(200.0);
  const normalMax = normalSpeed.getMaxSpeed();
  const hardMax = hardSpeed.getMaxSpeed();

  assert(hardEarly > normalEarly, `Hard mode early speed (${hardEarly.toFixed(1)} m/s) is faster than Normal (${normalEarly.toFixed(1)} m/s)`);
  assert(hardMax > normalMax, `Hard mode top speed (${hardMax.toFixed(1)} m/s) is higher than Normal (${normalMax.toFixed(1)} m/s)`);

  // 2. Train Speed Progression & Gap Calibration Comparison
  const diffControllerNormal = new DifficultyController();
  diffControllerNormal.setGameMode('NORMAL');
  const diffControllerHard = new DifficultyController();
  diffControllerHard.setGameMode('HARD');

  const normalTrainSpeedEarly = diffControllerNormal.calculateMovingTrainSpeed(200.0);
  const hardTrainSpeedEarly = diffControllerHard.calculateMovingTrainSpeed(200.0);
  assert(hardTrainSpeedEarly > normalTrainSpeedEarly, `Hard mode train speed (${hardTrainSpeedEarly.toFixed(1)} m/s) is faster than Normal (${normalTrainSpeedEarly.toFixed(1)} m/s)`);

  const normalPacing = diffControllerNormal.getTrainEncounterPacing(500.0);
  const hardPacing = diffControllerHard.getTrainEncounterPacing(500.0);
  assert(hardPacing.minGap < normalPacing.minGap, `Hard mode moving train encounter gap (${hardPacing.minGap}s) is tighter than Normal (${normalPacing.minGap}s)`);

  // 3. Multi-Run Telemetry Comparison across 10 Seeds
  const seeds = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1001];
  let normalMovingTrains = 0;
  let hardMovingTrains = 0;
  let normalRooftops = 0;
  let hardRooftops = 0;

  for (const seed of seeds) {
    // Normal Run
    const normalHarness = createHarness('NORMAL');
    normalHarness.trackManager.setSeed(seed, true);
    normalHarness.trackManager.reset(false);
    normalHarness.trackManager.chunks.forEach(chunk => {
      chunk.obstacles.forEach(o => {
        if (o.isMoving) normalMovingTrains++;
        if (o.hasRamp || o.type === 'TRAIN_RAMP' || o.type === 'TRAIN_COMPOSITION') normalRooftops++;
      });
    });

    // Hard Run
    const hardHarness = createHarness('HARD');
    hardHarness.trackManager.setSeed(seed, true);
    hardHarness.trackManager.reset(false);
    hardHarness.trackManager.chunks.forEach(chunk => {
      chunk.obstacles.forEach(o => {
        if (o.isMoving) hardMovingTrains++;
        if (o.hasRamp || o.type === 'TRAIN_RAMP' || o.type === 'TRAIN_COMPOSITION') hardRooftops++;
      });
    });
  }

  console.log(`📊 Pacing Comparison (10 seeds, initial active chunks):`);
  console.log(`   Normal Mode: ${normalMovingTrains} moving trains, ${normalRooftops} rooftop opportunities`);
  console.log(`   Hard Mode:   ${hardMovingTrains} moving trains, ${hardRooftops} rooftop opportunities`);

  assert(normalMovingTrains > 0 && hardMovingTrains > 0, `Both modes actively generate moving train traffic (${normalMovingTrains} Normal, ${hardMovingTrains} Hard)`);
  assert(normalRooftops >= 5 && hardRooftops >= 5, `Rooftop traversal opportunities are frequent and well-distributed in both modes`);
}

console.log(`\n================================================================`);
console.log(`🏁 FINISHED PHASE 3 AUDIT SUITE: ${passed} passed, ${failed} failed`);
console.log(`================================================================\n`);

if (failed > 0) {
  process.exit(1);
}
