import * as THREE from 'three';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { DifficultyController } from '../src/track/DifficultyController';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { PacingMetrics } from '../src/track/PacingMetrics';
import { EventBus, EVENTS } from '../src/core/EventBus';

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

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
  } else {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createTestEnvironment() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player(scene);
  return { scene, trackManager, player };
}

console.log('🧪 Starting Task 4: Dynamic Moving Trains, Progressive Train Speed & Fair Traffic Suite...\n');

// =========================================================================
// Suite 1: Early Moving-Train Appearance & Distance Gating
// =========================================================================
console.log('--- Suite 1: Early Moving-Train Appearance & Distance Gating ---');
{
  const dc = new DifficultyController();
  // Moving trains disabled before 240m
  assert(!dc.canSpawnMovingTrain(0), 'Moving trains forbidden at start of run (0m)');
  assert(!dc.canSpawnMovingTrain(150), 'Moving trains forbidden in opening introduction (150m)');
  assert(!dc.canSpawnMovingTrain(239), 'Moving trains forbidden just before threshold (239m)');
  assert(dc.canSpawnMovingTrain(240), 'Moving trains become eligible right at 240m');
  assert(dc.canSpawnMovingTrain(400), 'Moving trains eligible in early-medium run (400m)');
}

// =========================================================================
// Suite 2: Actual Physical Movement in Correct Direction
// =========================================================================
console.log('--- Suite 2: Actual Physical Movement in Correct Direction ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_ONCOMING_ADVANCE',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 60.0, length: 16.0, velocityZ: 14.0 }],
    collectibles: []
  }, 0);

  const train = chunk.obstacles[0];
  assert(train.isMoving === true, 'Train obstacle registered as isMoving = true');
  assert(train.velocityZ === 14.0, `Train authoritative velocity is 14.0 m/s (got ${train.velocityZ})`);

  player.position.set(0, 0, 0);
  player.speed = 20.0;

  const initialLocalZ = train.group.position.z;
  const initialWorldZ = chunk.chunkZ + initialLocalZ;

  // Advance simulation by 1.0 second
  chunk.update(1.0, 1.0, player.position.z, player.speed);

  const newLocalZ = train.group.position.z;
  const newWorldZ = chunk.chunkZ + newLocalZ;
  const displacement = newWorldZ - initialWorldZ;

  assert(Math.abs(displacement - 14.0) < 0.05, `Train advanced +14.0m along +Z toward player (got +${displacement.toFixed(2)}m)`);
  assert(train.collider.min.z > initialWorldZ - 8.0, 'Bounding box min.z physically advanced with mesh');
  assert(train.collider.max.z > initialWorldZ + 8.0, 'Bounding box max.z physically advanced with mesh');
}

// =========================================================================
// Suite 3: Gradual Train Acceleration & Progressive Speed Profiles
// =========================================================================
console.log('--- Suite 3: Gradual Train Acceleration & Progressive Speed Profiles ---');
{
  const dc = new DifficultyController();
  dc.setGameMode('NORMAL');

  // Early run (240m - 500m): approximately 10 - 12 units/s
  const earlySpeed = dc.calculateMovingTrainSpeed(350, 'NORMAL', 'EASY', 0.5);
  assert(earlySpeed >= 10.0 && earlySpeed <= 12.5, `Early run speed in target 10-12.5 m/s (got ${earlySpeed.toFixed(2)} m/s)`);

  // Medium run (500m - 1200m): approximately 12 - 15 units/s
  const medSpeed = dc.calculateMovingTrainSpeed(850, 'NORMAL', 'MEDIUM', 0.5);
  assert(medSpeed >= 12.0 && medSpeed <= 15.5, `Medium progression speed in target 12-15.5 m/s (got ${medSpeed.toFixed(2)} m/s)`);
  assert(medSpeed > earlySpeed, `Medium speed (${medSpeed.toFixed(2)}) is higher than early speed (${earlySpeed.toFixed(2)})`);

  // Advanced run (1200m - 2500m): approximately 15 - 18 units/s
  const advSpeed = dc.calculateMovingTrainSpeed(1800, 'NORMAL', 'HARD', 0.5);
  assert(advSpeed >= 15.0 && advSpeed <= 18.0, `Advanced progression speed in target 15-18 m/s (got ${advSpeed.toFixed(2)} m/s)`);
  assert(advSpeed > medSpeed, `Advanced speed (${advSpeed.toFixed(2)}) is higher than medium speed (${medSpeed.toFixed(2)})`);

  // Expert run (2500m+): smoothly capped at Normal mode cap
  const expertSpeed = dc.calculateMovingTrainSpeed(3500, 'NORMAL', 'EXPERT', 0.5);
  assert(expertSpeed <= 18.0, `Normal mode speed strictly obeys 18.0 m/s ceiling at 3500m (got ${expertSpeed.toFixed(2)} m/s)`);
}

// =========================================================================
// Suite 4: Speed Cap & Hard Mode Profile Capability
// =========================================================================
console.log('--- Suite 4: Speed Cap & Hard Mode Profile Capability ---');
{
  const dc = new DifficultyController();

  // Test Normal Mode ceiling across extreme distances
  for (const dist of [2000, 5000, 10000, 50000]) {
    const spd = dc.calculateMovingTrainSpeed(dist, 'NORMAL', 'EXPERT', 1.0);
    assert(spd <= 18.0, `Normal mode strictly capped <= 18.0 m/s at ${dist}m (got ${spd.toFixed(2)} m/s)`);
  }

  // Test Hard Mode separate profile capability without mutating Normal mode
  const hardEarly = dc.calculateMovingTrainSpeed(350, 'HARD', 'EASY', 0.5);
  const hardLate = dc.calculateMovingTrainSpeed(3500, 'HARD', 'EXPERT', 0.5);
  assert(hardEarly >= 13.0, `Hard Mode early speed starts higher (>= 13.0 m/s, got ${hardEarly.toFixed(2)})`);
  assert(hardLate >= 18.5 && hardLate <= 22.0, `Hard Mode scales up to 22.0 m/s (got ${hardLate.toFixed(2)} m/s)`);
  assert(hardLate > 18.0, 'Hard Mode profile exceeds Normal Mode cap as intended');

  // Verify Normal Mode profile remains untouched
  const normalSpeed = dc.calculateMovingTrainSpeed(3500, 'NORMAL', 'EXPERT', 0.5);
  assert(normalSpeed <= 18.0, `Normal Mode remains capped at 18.0 m/s (got ${normalSpeed.toFixed(2)})`);
}

// =========================================================================
// Suite 5: Real Collision at Low Speed & High Speed
// =========================================================================
console.log('--- Suite 5: Real Collision at Low Speed & High Speed ---');
{
  // 1. Low Speed Collision
  {
    const { trackManager, player } = createTestEnvironment();
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    chunk.populate({
      name: 'TEST_LOW_SPEED_COLLISION',
      difficulty: 'EASY',
      obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 15.0, length: 16.0, velocityZ: 10.0 }],
      collectibles: []
    }, 0);

    player.position.set(0, 0, 0);
    player.speed = 15.0;

    let crashed = false;
    const unsub = EventBus.getInstance().on(EVENTS.CRASH, () => {
      crashed = true;
      unsub();
    });

    // Advance simulation until collision
    for (let f = 0; f < 30; f++) {
      player.position.z -= player.speed * 0.033;
      trackManager.update(player, 0.033, f * 0.033);
      if (crashed) break;
    }
    assert(crashed, 'Head-on impact at low closing speed (25 m/s) triggers lethal crash');
  }

  // 2. High Speed Collision (swept detection prevents tunneling)
  {
    const { trackManager, player } = createTestEnvironment();
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    chunk.populate({
      name: 'TEST_HIGH_SPEED_COLLISION',
      difficulty: 'HARD',
      obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 25.0, length: 16.0, velocityZ: 18.0 }],
      collectibles: []
    }, 0);

    player.position.set(0, 0, 0);
    player.speed = 35.0; // High player speed -> 53 m/s closing speed!

    let crashed = false;
    const unsub = EventBus.getInstance().on(EVENTS.CRASH, () => {
      crashed = true;
      unsub();
    });

    // Large frame step (100ms dt) at 53 m/s closing speed: travels 5.3m in single frame
    player.position.z -= player.speed * 0.1;
    trackManager.update(player, 0.1, 0.1);

    for (let f = 0; f < 20; f++) {
      player.position.z -= player.speed * 0.033;
      trackManager.update(player, 0.033, 0.1 + f * 0.033);
      if (crashed) break;
    }
    assert(crashed, 'Head-on impact at high closing speed (53 m/s) reliably triggers lethal crash without tunneling');
  }
}

// =========================================================================
// Suite 6: Adjacent Safe Lane Verification
// =========================================================================
console.log('--- Suite 6: Adjacent Safe Lane Verification ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_ADJACENT_SAFE_LANE',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 18.0, velocityZ: 15.0 }],
    collectibles: []
  }, 0);

  // Player runs safely in Lane +1 (Right) while train charges down Lane 0 (Center)
  player.position.set(CONSTANTS.LANES[1], CONSTANTS.PLAYER_BASE_Y, 0);
  player.currentLane = 1;
  player.targetLane = 1;
  player.speed = 22.0;

  let falseCrash = false;
  EventBus.getInstance().on(EVENTS.CRASH, () => {
    falseCrash = true;
  });

  // Run for 3 full seconds while train passes right by player
  for (let f = 0; f < 90; f++) {
    player.position.z -= player.speed * 0.033;
    trackManager.update(player, 0.033, f * 0.033);
  }

  assert(!falseCrash, 'Player in adjacent lane safely bypasses oncoming moving train with zero collision');
}

// =========================================================================
// Suite 7: True Relative Speed & Time to Impact Calculation
// =========================================================================
console.log('--- Suite 7: True Relative Speed & Time to Impact Calculation ---');
{
  const dc = new DifficultyController();
  const playerSpeed = 30.0;
  const trainSpeed = 15.0;

  // True relative speed
  const relSpeed = dc.calculateRelativeSpeed(playerSpeed, trainSpeed);
  assert(Math.abs(relSpeed - 45.0) < 0.01, `Closing speed correctly sums player + oncoming train velocity (45.0 m/s, got ${relSpeed.toFixed(1)})`);

  // Time to impact across 90m separation
  const timeToImpact = dc.calculateTimeToImpact(90.0, playerSpeed, trainSpeed);
  assert(Math.abs(timeToImpact - 2.0) < 0.01, `Time to impact for 90m at 45 m/s closing speed is exactly 2.0s (got ${timeToImpact.toFixed(2)}s)`);

  // Dynamic reaction window scales with relative speed
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_TELEGRAPH_METRICS',
    difficulty: 'HARD',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 80.0, length: 16.0, velocityZ: 16.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 0, 0);
  player.speed = 28.0; // 28 + 16 = 44 m/s closing speed

  let telegraphedData: any = null;
  const unsubTelegraph = EventBus.getInstance().on(EVENTS.TRAIN_HORN, (data: any) => {
    telegraphedData = data;
    unsubTelegraph();
  });

  // Update chunk with playerSpeed passed
  chunk.update(0.016, 0.016, player.position.z, player.speed);

  assert(telegraphedData !== null, 'Telegraph warning event emitted for approaching train');
  assert(Math.abs(telegraphedData.relativeSpeed - 44.0) < 0.5, `Telegraph event includes accurate relative speed (${telegraphedData.relativeSpeed.toFixed(1)} m/s)`);
  assert(telegraphedData.timeToImpact > 1.2, `Telegraph provides fair human reaction window (${telegraphedData.timeToImpact.toFixed(2)}s >= 1.2s)`);
}

// =========================================================================
// Suite 8: Warning Visibility & Non-Strobing High-Beam Headlights
// =========================================================================
console.log('--- Suite 8: Warning Visibility & Non-Strobing High-Beam Headlights ---');
{
  const factory = new ObstacleFactory();
  const trainObj = factory.createMovingTrain(16.0);

  assert(trainObj.headlights.length > 0, 'Moving train equips forward projection headlights');
  assert(trainObj.headlightBeam !== undefined, 'Moving train equips forward rail track illumination beam');

  // Verify non-strobing high beam visibility during simulation
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_HEADLIGHT_VISIBILITY',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 55.0, length: 16.0, velocityZ: 12.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 0, 0);
  player.speed = 20.0;

  // Run 10 consecutive frames within telegraph range: headlights must remain visible throughout (no flashing/strobing off)
  let allVisible = true;
  for (let f = 0; f < 10; f++) {
    chunk.update(0.033, f * 0.033, player.position.z, player.speed);
    const train = chunk.obstacles[0];
    if (train.headlights) {
      for (const h of train.headlights) {
        if (!h.visible) allVisible = false;
      }
    }
  }
  assert(allVisible, 'Headlights remain continuously illuminated high-beams without distracting on/off strobing');
}

// =========================================================================
// Suite 9: Procedural Reachability Across All Moving-Train Patterns
// =========================================================================
console.log('--- Suite 9: Procedural Reachability Across All Moving-Train Patterns ---');
{
  const movingPatterns = OBSTACLE_PATTERNS.filter(
    (p) => p.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving)
  );
  assert(movingPatterns.length >= 14, `Substantial moving train pattern library available (found ${movingPatterns.length} patterns)`);

  const testSpeeds = [14.0, 20.0, 28.0, 38.0];
  let unsolvableCount = 0;

  for (const pattern of movingPatterns) {
    for (const speed of testSpeeds) {
      const result = ReachabilityValidator.validatePattern(pattern, speed);
      if (!result.solvable) {
        unsolvableCount++;
        console.error(`Unsolvable pattern: ${pattern.name} at speed ${speed} m/s. Reason: ${result.reason}`);
      }
    }
  }

  assert(unsolvableCount === 0, `All ${movingPatterns.length} moving train patterns are 100% human-reachable across all player speeds`);
}

// =========================================================================
// Suite 10: Chunk Recycling & State Reset Cleanliness
// =========================================================================
console.log('--- Suite 10: Chunk Recycling & State Reset Cleanliness ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  // Populate with moving train
  chunk.populate({
    name: 'TEST_RECYCLE_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 16.0, velocityZ: 12.0 }],
    collectibles: []
  }, 0, undefined, false, 12.0);

  // Advance train
  chunk.update(1.0, 1.0, player.position.z, 20.0);
  const train1 = chunk.obstacles[0];
  assert(train1.isMovingActive === true, 'Train became active during approach');
  assert(train1.telegraphed === true, 'Train triggered telegraph');

  // Recycle chunk to new location Z = -800m with stationary pattern
  chunk.populate({
    name: 'TEST_RECYCLED_STATIONARY',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 }],
    collectibles: []
  }, -800.0);

  assert(chunk.obstacles.length === 1, 'Recycled chunk has exactly 1 obstacle');
  assert(chunk.obstacles[0].type === 'LOW_BARRIER', 'Recycled obstacle is new type');
  assert(!chunk.obstacles[0].isMoving, 'New obstacle is not moving');
  assert(chunk.chunkZ === -800.0, 'Chunk Z coordinate updated cleanly');
}

// =========================================================================
// Suite 11: Normal Train-Roof Mechanics on Moving Trains
// =========================================================================
console.log('--- Suite 11: Normal Train-Roof Mechanics on Moving Trains ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_MOVING_ROOF_MECHANICS',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 30.0, length: 24.0, velocityZ: 10.0 }],
    collectibles: []
  }, 0);

  // Place player above train roof in jump descent
  player.position.set(0, 4.40, -30.0);
  player.verticalVelocity = -2.0;

  // Update track collision resolution
  trackManager.update(player, 0.033, 0.033);

  assert(player.getSupportSurface() === 'TRAIN_ROOF', 'Player successfully lands and is supported on moving train roof');
  assert(Math.abs(player.position.y - 4.35) < 0.1, `Player Y matches authoritative train roof deck (4.35m, got ${player.position.y.toFixed(2)}m)`);
}

// =========================================================================
// Suite 12: Frame Rate Invariance (30 FPS vs 60 FPS vs 120 FPS)
// =========================================================================
console.log('--- Suite 12: Frame Rate Invariance (30 FPS vs 60 FPS vs 120 FPS) ---');
{
  const testDisplacements: number[] = [];

  for (const fps of [30, 60, 120]) {
    const { trackManager, player } = createTestEnvironment();
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    chunk.populate({
      name: `TEST_FPS_INV_${fps}`,
      difficulty: 'MEDIUM',
      obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 50.0, length: 16.0, velocityZ: 15.0 }],
      collectibles: []
    }, 0);

    const train = chunk.obstacles[0];
    const initialZ = train.group.position.z;
    const dt = 1.0 / fps;
    const totalDuration = 1.0; // 1.0 second
    const frames = Math.round(fps * totalDuration);

    for (let f = 0; f < frames; f++) {
      chunk.update(dt, f * dt, player.position.z, 20.0);
    }

    const finalZ = train.group.position.z;
    const displacement = finalZ - initialZ;
    testDisplacements.push(displacement);
  }

  assert(Math.abs(testDisplacements[0] - testDisplacements[1]) < 0.01, `30 FPS (${testDisplacements[0].toFixed(3)}m) matches 60 FPS (${testDisplacements[1].toFixed(3)}m) displacement`);
  assert(Math.abs(testDisplacements[1] - testDisplacements[2]) < 0.01, `60 FPS (${testDisplacements[1].toFixed(3)}m) matches 120 FPS (${testDisplacements[2].toFixed(3)}m) displacement`);
}

// =========================================================================
// Suite 13: Multi-Seed Procedural Simulation & Encounter Measurement
// =========================================================================
console.log('--- Suite 13: Multi-Seed Procedural Simulation & Encounter Measurement ---');
{
  const seeds = [1337, 2024, 4242, 7777, 9999];
  const encounterResults: Array<{ seed: number; movingCount: number; avgSpeed: number; fastest: number }> = [];

  for (const seed of seeds) {
    const { trackManager, player } = createTestEnvironment();
    trackManager.setSeed(seed, true);
    trackManager.reset(false);

    let movingTrainCount = 0;
    const speeds: number[] = [];

    // Simulate 20 procedural chunks (from 240m to 1840m)
    for (let c = 0; c < 20; c++) {
      const dist = 240.0 + c * CONSTANTS.CHUNK_LENGTH;
      const playerSpeed = 18.0 + (dist / 2000.0) * 12.0; // Progressing 18 -> 30 m/s
      const pattern = trackManager.selectPattern(c + 4, playerSpeed, dist);

      const hasMoving = pattern.obstacles.some((o) => o.type === 'MOVING_TRAIN' || o.isMoving);
      if (hasMoving) {
        movingTrainCount++;
        const trainSpeed = trackManager.difficultyController.calculateMovingTrainSpeed(
          dist,
          'NORMAL',
          pattern.difficulty,
          0.5
        );
        speeds.push(trainSpeed);
      }
    }

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const fastest = speeds.length > 0 ? Math.max(...speeds) : 0;
    encounterResults.push({ seed, movingCount: movingTrainCount, avgSpeed, fastest });
  }

  // Verify across all seeds
  for (const res of encounterResults) {
    assert(res.movingCount >= 3, `Seed ${res.seed} encountered ${res.movingCount} moving trains (>= 3 required for active railway rhythm)`);
    assert(res.avgSpeed >= 11.5, `Seed ${res.seed} average train speed is progressive (${res.avgSpeed.toFixed(1)} m/s >= 11.5)`);
    assert(res.fastest <= 18.0, `Seed ${res.seed} fastest train obeys Normal mode cap (${res.fastest.toFixed(1)} m/s <= 18.0)`);
  }

  console.log('\n📊 Measured Multi-Seed Encounter Telemetry:');
  for (const res of encounterResults) {
    console.log(`   Seed ${res.seed}: ${res.movingCount} encounters (rate: ${(res.movingCount / 20 * 100).toFixed(0)}%), avgSpeed: ${res.avgSpeed.toFixed(1)} m/s, fastest: ${res.fastest.toFixed(1)} m/s`);
  }
}

// =========================================================================
// Suite 14: Developer Diagnostics Verification (PacingMetrics)
// =========================================================================
console.log('\n--- Suite 14: Developer Diagnostics Verification (PacingMetrics) ---');
{
  const metrics = PacingMetrics.getInstance();
  metrics.reset();
  metrics.setTrainSpeedProfile('NORMAL');
  metrics.setCurrentDifficultyTier('HARD');

  // Record simulated encounters
  metrics.recordMovingTrainEncounter(10.0, 12.0, 20.0, 60.0);
  metrics.recordMovingTrainEncounter(25.0, 14.5, 24.0, 65.0);
  metrics.recordMovingTrainEncounter(42.0, 16.8, 28.0, 70.0);

  const report = metrics.getReport(60.0);
  assert(report.currentTrainSpeedProfile === 'NORMAL', `Diagnostics reports speed profile: ${report.currentTrainSpeedProfile}`);
  assert(report.movingTrainCount === 3, `Diagnostics reports moving train count: ${report.movingTrainCount}`);
  assert(report.movingTrainFrequencyPerMinute === 3.0, `Diagnostics reports encounters/min: ${report.movingTrainFrequencyPerMinute}`);
  assert(report.averageMovingTrainVelocity >= 14.0, `Diagnostics reports average velocity: ${report.averageMovingTrainVelocity} m/s`);
  assert(report.fastestEncounteredTrainSpeed === 16.8, `Diagnostics reports fastest train: ${report.fastestEncounteredTrainSpeed} m/s`);
  assert(report.timeBetweenTrainEncounters.length === 2, 'Diagnostics tracks time between encounters');
  assert(report.lastRelativeClosingSpeed === 44.8, `Diagnostics tracks relative closing speed (${report.lastRelativeClosingSpeed} m/s)`);
  assert(report.currentDifficultyTier === 'HARD', `Diagnostics tracks difficulty tier: ${report.currentDifficultyTier}`);
  assert(report.unreachablePatternCount === 0, 'Diagnostics reports 0 unreachable patterns');
}

console.log(`\n================================================================`);
console.log(`🎉 ALL ${passedTests} / ${totalTests} TASK 4 MOVING TRAIN TESTS PASSED!`);
console.log(`================================================================\n`);
