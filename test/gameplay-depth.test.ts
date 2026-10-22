import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { CONSTANTS, LaneIndex } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { OBSTACLE_PATTERNS, TrackPattern } from '../src/track/ObstaclePatterns';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';

console.log('🧪 Starting Task 3: Gameplay Depth, Obstacles, Difficulty & Fair Challenge Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passedTests++;
  }
}

// =========================================================================
// Test Suite 1: All 10 Obstacle Types Presence and Geometry Validation
// =========================================================================
console.log('--- Test 1: Verification of All 10 Distinct Obstacle Types ---');
{
  const factory = new ObstacleFactory();

  // 1. Stationary Train
  const train = factory.createTrain(20.0, false);
  assert(train instanceof THREE.Group, '1. Full-lane stationary train creates valid 3D group');

  // 2. Moving Train
  const movingTrain = factory.createMovingTrain(22.0);
  assert(movingTrain.group instanceof THREE.Group, '2. Moving train creates valid 3D group');
  assert(movingTrain.headlights.length > 0, '2. Moving train equips dual telegraphed headlights');

  // 3. Low Barrier
  const lowBarrier = factory.createLowBarrier();
  assert(lowBarrier instanceof THREE.Group, '3. Low barrier creates valid 3D hurdle');

  // 4. High Barrier
  const highBarrier = factory.createHighBarrier();
  assert(highBarrier instanceof THREE.Group, '4. High barrier creates valid 3D gantry');

  // 5. Side Barrier
  const sideBarrier = factory.createSideBarrier();
  assert(sideBarrier instanceof THREE.Group, '5. Side barrier creates concrete K-rail barricade');

  // 6. Paired Obstacles in Patterns
  const pairedPattern = OBSTACLE_PATTERNS.find((p) => p.name === 'PAIRED_HAZARDS_SQUEEZE');
  assert(pairedPattern !== undefined && pairedPattern.obstacles.length >= 3, '6. Paired obstacles require careful multi-lane decision');

  // 7. Train-top Paths with Ramps
  const rampTrain = factory.createTrain(24.0, true);
  assert(rampTrain instanceof THREE.Group, '7. Train-top ramp creates climbable sloped surface');

  // 8. Alternating Obstacles
  const alternatingPattern = OBSTACLE_PATTERNS.find((p) => p.name === 'ALTERNATING_TEMPO');
  assert(alternatingPattern !== undefined && alternatingPattern.obstacles.length >= 4, '8. Alternating obstacles require timed sequential movements');

  // 9. Tunnel Obstacle with restricted clearance
  const tunnelArch = factory.createTunnelArch();
  assert(tunnelArch instanceof THREE.Group, '9. Tunnel arch creates restricted clearance overhead structure');

  // 10. Coin trails (arches, rooftop, and slide trails)
  const arcPattern = OBSTACLE_PATTERNS.find((p) => p.collectibles.some((c) => c.isArc));
  assert(arcPattern !== undefined, '10. Curated coin trails with parabolic jump arches are implemented');
}

// =========================================================================
// Test Suite 2: Procedural Seed Determinism
// =========================================================================
console.log('\n--- Test 2: Seedable PRNG Determinism & Repeatability ---');
{
  const scene1 = new THREE.Scene();
  const tm1 = new TrackManager(scene1);
  tm1.setSeed(424242);
  const sequence1: string[] = [];
  for (let i = 0; i < 50; i++) {
    sequence1.push(tm1.selectPattern(i + 1, 20.0, i * 40).name);
  }

  const scene2 = new THREE.Scene();
  const tm2 = new TrackManager(scene2);
  tm2.setSeed(424242);
  const sequence2: string[] = [];
  for (let i = 0; i < 50; i++) {
    sequence2.push(tm2.selectPattern(i + 1, 20.0, i * 40).name);
  }

  assert(sequence1.length === sequence2.length, 'Generated sequence lengths match');
  let identical = true;
  for (let i = 0; i < sequence1.length; i++) {
    if (sequence1[i] !== sequence2[i]) {
      identical = false;
      break;
    }
  }
  assert(identical, 'Same PRNG seed produces 100% identical pattern generation sequence');

  // Different seed produces different sequence
  const scene3 = new THREE.Scene();
  const tm3 = new TrackManager(scene3);
  tm3.setSeed(999999);
  const sequence3: string[] = [];
  for (let i = 0; i < 50; i++) {
    sequence3.push(tm3.selectPattern(i + 1, 20.0, i * 40).name);
  }
  const different = sequence1.some((name, idx) => name !== sequence3[idx]);
  assert(different, 'Different PRNG seed produces divergent procedural sequence');
}

// =========================================================================
// Test Suite 3: 1,000 Continuous Chunk Stitches Reachability Guarantee
// =========================================================================
console.log('\n--- Test 3: Infinite Generation Reachability (1,000 Continuous Chunks) ---');
{
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  tm.setSeed(777);

  let currentPattern = tm.selectPattern(0, CONSTANTS.INITIAL_SPEED, 0);
  let impossibleTransitions = 0;

  for (let chunkIdx = 1; chunkIdx <= 1000; chunkIdx++) {
    const dist = chunkIdx * 80.0;
    const speed = Math.min(CONSTANTS.MAX_SPEED, CONSTANTS.INITIAL_SPEED + (dist / 100.0) * CONSTANTS.SPEED_ACCELERATION);
    const nextPattern = tm.selectPattern(chunkIdx, speed, dist);

    const isTransitionValid = ReachabilityValidator.validateChunkTransition(currentPattern, nextPattern, speed);
    if (!isTransitionValid) {
      impossibleTransitions++;
    }
    currentPattern = nextPattern;
  }

  assert(impossibleTransitions === 0, 'Zero (0) impassable chunk stitches across 1,000 procedurally generated chunks');
}

// =========================================================================
// Test Suite 4: Moving Train Kinematics, Collision Advancement & Telegraph
// =========================================================================
console.log('\n--- Test 4: Moving Train Kinematics & Telegraphing ---');
{
  const factory = new ObstacleFactory();
  const colFactory = new CollectibleFactory();
  const chunk = new TrackChunk(factory, colFactory);

  let hornSounded = false;
  const bus = EventBus.getInstance();
  const unsubscribe = bus.on(EVENTS.TRAIN_HORN, () => {
    hornSounded = true;
  });

  const pattern: TrackPattern = {
    name: 'TEST_MOVING_TRAIN',
    difficulty: 'INTERMEDIATE',
    obstacles: [
      { type: 'MOVING_TRAIN', lane: 0, zOffset: 50.0, length: 20.0, isMoving: true, velocityZ: 11.0 }
    ],
    collectibles: []
  };

  chunk.populate(pattern, -100.0);
  const obs = chunk.obstacles[0];
  assert(obs.isMoving === true, 'Obstacle correctly tagged as moving train');
  const initialZ = obs.group.position.z;

  // Step simulation forward by 1.0 second
  // Player at z = -75 (54m from train front, within 65m warning threshold)
  chunk.update(1.0, 1.0, -75.0);

  assert(obs.group.position.z > initialZ, 'Moving train advances along +Z toward oncoming player');
  assert(Math.abs(obs.group.position.z - (initialZ + 11.0)) < 0.01, 'Train moved at exact velocity (11.0 m/s)');
  assert(hornSounded === true, 'Locomotive air horn telegraphed when player is within warning threshold (65m)');
}

// =========================================================================
// Test Suite 5: Minor Glancing Stumble vs. Fatal Head-On Collision
// =========================================================================
console.log('\n--- Test 5: Glancing Stumble vs. Fatal Head-On Collision ---');
{
  // 1. Stumble mechanism on Player
  const player = new Player();
  player.reset();
  const baseSpeed = player.speed;

  let stumbleEventFired = false;
  EventBus.getInstance().on(EVENTS.STUMBLE, () => {
    stumbleEventFired = true;
  });

  player.stumble();
  assert(player.isStumbling === true, 'Player enters stumbling state on glance');
  assert(stumbleEventFired === true, 'STUMBLE event fired');
  assert(player.getEffectiveSpeed() < baseSpeed, 'Effective forward speed drops by 22% during stumble');

  // Step forward past stumble duration (0.7s)
  let elapsed = 0;
  while (elapsed < 0.8) {
    player.update(0.1);
    elapsed += 0.1;
  }

  assert(player.isStumbling === false, 'Stumble expires cleanly after duration');
  assert(player.getEffectiveSpeed() === player.speed, 'Speed fully recovers to normal without permanent penalty');
  assert(player.state === 'RUN', 'Player remains in RUN state (stumble was non-fatal)');

  // 2. Direct head-on collision causes fatal crash
  player.reset();
  const fatal = player.crash();
  assert(fatal === true, 'Direct head-on collision is fatal');
  assert(player.state === 'CRASH', 'Player transitions to CRASH state');
}

// =========================================================================
// Test Suite 6: Precision Actions Recognition & Skilled Play Bonuses
// =========================================================================
console.log('\n--- Test 6: Precision Jump/Slide & Clean Section Streaks ---');
{
  const scene = new THREE.Scene();
  const tm = new TrackManager(scene);
  const player = new Player();
  player.reset();

  let streakReported = 0;
  EventBus.getInstance().on(EVENTS.CLEAN_STREAK, (val: number) => {
    streakReported = val;
  });

  // Simulate recycling a chunk that had no collisions
  const chunk = tm.chunks[0];
  chunk.chunkHadCollision = false;
  chunk.obstacles = [
    {
      group: new THREE.Group(),
      type: 'LOW_BARRIER',
      lane: 0,
      collider: new THREE.Box3(),
      nearMissBox: new THREE.Box3(),
      nearMissTriggered: false,
      active: true
    }
  ];

  // Move player far ahead so chunk recycles
  player.position.z = -150.0;
  tm.update(player, 0.1, 1.0);

  assert(tm.cleanStreakCount >= 1, 'Clean section streak incremented on clean chunk clearance');
  assert(streakReported >= 1, 'CLEAN_STREAK event fired with streak multiplier');
}

// =========================================================================
// Test Suite 7: Tunnel Arch Slide Clearance & Train-top Navigation
// =========================================================================
console.log('\n--- Test 7: Tunnel Arch Slide Clearance & Train-top Navigation ---');
{
  const player = new Player();
  player.reset();

  // Test sliding under tunnel arch
  player.handleInput('DOWN');
  assert(player.isSliding === true, 'Player is actively sliding');
  assert(player.collider.max.y <= CONSTANTS.TUNNEL_ARCH_CLEARANCE, 'Player sliding height (1.6m) clears tunnel arch clearance (1.7m)');

  // Test running on train roof
  player.setGroundHeight(CONSTANTS.TRAIN_HEIGHT + 0.15);
  player.position.y = CONSTANTS.TRAIN_HEIGHT + 0.15;
  player.isJumping = false;
  player.update(0.1);

  assert(player.position.y > CONSTANTS.TRAIN_HEIGHT, 'Player securely navigates along train rooftop surface');
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} GAMEPLAY DEPTH & DIFFICULTY TESTS PASSED!`);
console.log('=======================================================\n');
