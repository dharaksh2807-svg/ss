import * as THREE from 'three';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus, EVENTS } from '../src/core/EventBus';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { CollisionResolver } from '../src/track/CollisionResolver';

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

console.log('🧪 Starting Task 1: Real Moving Trains, Relative Physics & Collision Integration Suite...\n');

let totalTests = 0;
let passedTests = 0;

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

function createTestEnvironment() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  for (const c of trackManager.chunks) {
    c.clearDynamicItems();
  }
  const player = new Player();
  player.reset();
  return { scene, trackManager, player };
}

// =========================================================================
// Suite 1: Stationary vs Moving Train Physics Separation
// =========================================================================
console.log('--- Suite 1: Stationary vs Moving Train Physics Separation ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_STATIONARY_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'TRAIN', lane: 0, zOffset: 30.0, length: 20.0 }],
    collectibles: []
  }, 0);

  const stationaryTrain = chunk.obstacles[0];
  assert(stationaryTrain.isMoving === false, 'Stationary train isMoving is false');
  assert(stationaryTrain.velocityZ === 0, `Stationary train velocityZ is strictly 0 (got ${stationaryTrain.velocityZ})`);

  const initialZ = stationaryTrain.group.position.z;
  // Step game for 1.0 second
  for (let i = 0; i < 60; i++) {
    chunk.update(1 / 60, i / 60, player.position.z);
  }
  assert(stationaryTrain.group.position.z === initialZ, 'Stationary train does NOT change world position over time');
}

// =========================================================================
// Suite 2: Oncoming Moving Train Real Physical Advancement
// =========================================================================
console.log('--- Suite 2: Oncoming Moving Train Real Physical Advancement ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_MOVING_TRAIN',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 50.0, length: 20.0, velocityZ: 12.0 }],
    collectibles: []
  }, 0);

  const movingTrain = chunk.obstacles[0];
  assert(movingTrain.isMoving === true, 'Moving train isMoving is true');
  assert(movingTrain.velocityZ === 12.0, `Moving train velocityZ is 12.0 (got ${movingTrain.velocityZ})`);

  const startZ = movingTrain.group.position.z; // -50
  player.position.set(0, 0, 0); // Player at z=0, oncoming train at z=-50 (separation 50m, within 85m activation)

  // Step 30 frames at 60 FPS (0.5 seconds)
  const dt = 1 / 60;
  for (let i = 0; i < 30; i++) {
    chunk.update(dt, i * dt, player.position.z);
  }

  const expectedAdvance = 12.0 * 0.5; // 6.0 meters along positive Z
  const actualAdvance = movingTrain.group.position.z - startZ;
  assert(Math.abs(actualAdvance - expectedAdvance) < 0.05, `Moving train advanced +6.0m along +Z (got +${actualAdvance.toFixed(2)}m)`);
  assert(movingTrain.group.position.z > startZ, 'Moving train physically advanced along track towards player');
}

// =========================================================================
// Suite 3: Freeze Bug Elimination (Continuous Movement Past Player)
// =========================================================================
console.log('--- Suite 3: Freeze Bug Elimination (Continuous Movement Past Player) ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_MOVING_PASSING',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 1, zOffset: 15.0, length: 14.0, velocityZ: 11.0 }],
    collectibles: []
  }, 0);

  const train = chunk.obstacles[0];
  player.position.set(0, 0, 0); // Player in lane 0 at z=0; train is in lane 1 at z=-15

  // Half length of short train = 7m. Front bumper is at -15 + 7 = -8m.
  // In 1 second at 11m/s, train moves +11m. Front reaches -8 + 11 = +3m (past player at z=0).
  // Old bug would freeze train as soon as front reached player (frontZ >= playerZ).
  const dt = 1 / 60;
  for (let i = 0; i < 60; i++) {
    chunk.update(dt, i * dt, player.position.z);
  }

  // After 60 frames (1s), train should be at -15 + 11 = -4m.
  assert(Math.abs(train.group.position.z - (-4.0)) < 0.1, `Train continued moving past player front without freezing (z = ${train.group.position.z.toFixed(2)})`);

  // Step another 60 frames (another 1s). Train should be at -4 + 11 = +7m.
  for (let i = 0; i < 60; i++) {
    chunk.update(dt, (60 + i) * dt, player.position.z);
  }
  assert(Math.abs(train.group.position.z - 7.0) < 0.15, `Train maintained continuous movement past player (z = ${train.group.position.z.toFixed(2)})`);
}

// =========================================================================
// Suite 4: Collider and Visual Component Synchronization
// =========================================================================
console.log('--- Suite 4: Collider and Visual Component Synchronization ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_SYNC',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 20.0, velocityZ: 10.0 }],
    collectibles: []
  }, 0);

  const train = chunk.obstacles[0];
  player.position.set(0, 0, 0);

  // Advance 0.5s at 10 m/s => +5m
  const dt = 1 / 60;
  for (let i = 0; i < 30; i++) {
    chunk.update(dt, i * dt, player.position.z);
  }

  const worldZ = chunk.chunkZ + train.group.position.z;
  const halfD = 20.0 * 0.5;

  assert(Math.abs(train.collider.min.z - (worldZ - halfD)) < 0.05, 'Collider min.z synchronized with moving train mesh');
  assert(Math.abs(train.collider.max.z - (worldZ + halfD)) < 0.05, 'Collider max.z synchronized with moving train mesh');
  assert(Math.abs(train.roofCollider!.min.z - (worldZ - halfD - 0.3)) < 0.05, 'Roof collider min.z synchronized with moving train mesh');
  assert(Math.abs(train.roofCollider!.max.z - (worldZ + halfD + 0.3)) < 0.05, 'Roof collider max.z synchronized with moving train mesh');
  assert(Math.abs(train.frontBumperCollider!.max.z - (worldZ + halfD + 0.35)) < 0.05, 'Front bumper collider synchronized with moving train mesh');
  assert(train.wheelMeshes !== undefined && train.wheelMeshes.length > 0, 'Wheel meshes registered and present on moving train');
  assert(train.headlightBeam !== undefined, 'Headlight illumination beam decal attached to moving train');
}

// =========================================================================
// Suite 5: Fatal Frontal Collision vs Safe Adjacent Lane
// =========================================================================
console.log('--- Suite 5: Fatal Frontal Collision vs Safe Adjacent Lane ---');
{
  // Part A: Head-on collision in same lane
  const env1 = createTestEnvironment();
  const chunk1 = env1.trackManager.chunks[0];
  chunk1.chunkZ = 0;
  chunk1.clearDynamicItems();
  chunk1.populate({
    name: 'TEST_HEADON',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 20.0, length: 14.0, velocityZ: 11.0 }],
    collectibles: []
  }, 0);

  const train1 = chunk1.obstacles[0];
  env1.player.position.set(0, 0, -10.0); // Player in lane 0 at z=-10, train approaching from z=-20
  env1.player.speed = 18.0;

  // Step 10 frames to collide
  for (let i = 0; i < 10; i++) {
    env1.player.update(1 / 60);
    env1.trackManager.update(env1.player, 1 / 60, i / 60);
    if (env1.player.state === 'CRASH') break;
  }

  assert(env1.player.state === 'CRASH', 'Head-on impact with oncoming moving train triggers CRASH');

  // Part B: Adjacent safe lane (player in lane 1, train in lane 0)
  const env2 = createTestEnvironment();
  const chunk2 = env2.trackManager.chunks[0];
  chunk2.chunkZ = 0;
  chunk2.clearDynamicItems();
  chunk2.populate({
    name: 'TEST_ADJACENT',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 20.0, length: 14.0, velocityZ: 11.0 }],
    collectibles: []
  }, 0);

  env2.player.currentLane = 1;
  env2.player.targetLane = 1;
  env2.player.position.set(CONSTANTS.LANE_WIDTH, 0, -10.0); // Lane 1 (x = +3.2m)
  env2.player.speed = 18.0;

  for (let i = 0; i < 40; i++) {
    env2.player.update(1 / 60);
    env2.trackManager.update(env2.player, 1 / 60, i / 60);
  }

  assert(env2.player.state !== 'CRASH', 'Player in adjacent lane safely passes moving train with zero false collision');
}

// =========================================================================
// Suite 6: Platform-Relative Support Velocity on Moving Train Rooftops
// =========================================================================
console.log('--- Suite 6: Platform-Relative Support Velocity on Moving Train Rooftops ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_MOVING_ROOF',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 30.0, length: 28.0, velocityZ: 10.0 }],
    collectibles: []
  }, 0);

  const train = chunk.obstacles[0];
  // Land player on top of moving train roof
  player.position.set(0, 5.0, -30.0);
  player.previousPosition.set(0, 5.2, -29.0);
  player.isJumping = true;
  player.verticalVelocity = -4.0;
  player.speed = 0; // Freeze player intrinsic forward run to measure pure platform velocity

  // Step 2 frames to achieve roof contact
  for (let i = 0; i < 2; i++) {
    player.update(1 / 60);
    trackManager.update(player, 1 / 60, i / 60);
  }

  assert(player.getSupportSurface() === 'TRAIN_ROOF', `Player landed safely on moving train roof (got ${player.getSupportSurface()})`);
  assert(player.getActiveSupportObstacleId() === train.id, 'Active support obstacle is the moving train');

  const initialZOnRoof = player.position.z;
  // Step 30 frames (0.5s) on moving train roof (moving at +10m/s along Z)
  for (let i = 0; i < 30; i++) {
    player.update(1 / 60);
    trackManager.update(player, 1 / 60, (2 + i) / 60);
  }

  const expectedDisplacement = 10.0 * 0.5; // +5.0m
  const actualDisplacement = player.position.z - initialZOnRoof;
  assert(Math.abs(actualDisplacement - expectedDisplacement) < 0.2, `Platform relative velocity moved player along with train (+${actualDisplacement.toFixed(2)}m)`);
  assert(player.position.y === (train.roofSurfaceY || 4.35), `Player remained safely on rooftop without falling off during traversal (Y=${player.position.y})`);
}

// =========================================================================
// Suite 7: Shield & Hoverboard Protection Against Moving Train
// =========================================================================
console.log('--- Suite 7: Shield & Hoverboard Protection Against Moving Train ---');
{
  // Shield protection
  const env1 = createTestEnvironment();
  const chunk1 = env1.trackManager.chunks[0];
  chunk1.chunkZ = 0;
  chunk1.clearDynamicItems();
  chunk1.populate({
    name: 'TEST_SHIELD',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 15.0, length: 14.0, velocityZ: 11.0 }],
    collectibles: []
  }, 0);

  env1.player.position.set(0, 0, -10.0);
  env1.player.speed = 18.0;
  env1.player.powerups.activate('SHIELD');
  assert(env1.player.powerups.hasShieldActive() === true, 'Shield is active');

  for (let i = 0; i < 15; i++) {
    env1.player.update(1 / 60);
    env1.trackManager.update(env1.player, 1 / 60, i / 60);
  }

  assert(env1.player.state !== 'CRASH', 'Player survived moving train collision with active shield');
  assert(env1.player.powerups.hasShieldActive() === false, 'Shield was consumed on impact');

  // Hoverboard protection
  const env2 = createTestEnvironment();
  const chunk2 = env2.trackManager.chunks[0];
  chunk2.chunkZ = 0;
  chunk2.clearDynamicItems();
  chunk2.populate({
    name: 'TEST_HOVERBOARD',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 15.0, length: 14.0, velocityZ: 11.0 }],
    collectibles: []
  }, 0);

  env2.player.position.set(0, 0, -10.0);
  env2.player.speed = 18.0;
  env2.player.hoverboardManager.activate();
  assert(env2.player.hoverboardManager.isBoardActive() === true, 'Hoverboard is active');

  for (let i = 0; i < 15; i++) {
    env2.player.update(1 / 60);
    env2.trackManager.update(env2.player, 1 / 60, i / 60);
  }

  assert(env2.player.state !== 'CRASH', 'Player survived moving train collision with active hoverboard');
  assert(env2.player.hoverboardManager.isBoardActive() === false, 'Hoverboard absorbed impact and was consumed');
}

// =========================================================================
// Suite 8: Swept Continuous Collision Detection (No Tunneling)
// =========================================================================
console.log('--- Suite 8: Swept Continuous Collision Detection (No Tunneling) ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_SWEPT',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 12.0, length: 14.0, velocityZ: 15.0 }],
    collectibles: []
  }, 0);

  const train = chunk.obstacles[0];
  // Train is at z=-12, front at -12 + 7 = -5.
  // Player at z=0, speed 30 m/s. Relative velocity = 30 + 15 = 45 m/s.
  player.position.set(0, 0, 0);
  player.speed = 30.0;

  // Single large dt step (0.20s = 5 FPS lag spike), covering 9.0 meters!
  // Train moves from -12 to -9 (front from -5 to -2).
  // Player moves from 0 to -6.
  // In discrete collision, front passed player and overlaps:
  player.update(0.20);
  trackManager.update(player, 0.20, 0.20);

  assert(player.state === 'CRASH', 'Swept continuous collision caught high-speed encounter during large frame spike (0.20s dt)');
}

// =========================================================================
// Suite 9: Approaching Train Audio Query Integration
// =========================================================================
console.log('--- Suite 9: Approaching Train Audio Query Integration ---');
{
  const { trackManager, player } = createTestEnvironment();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  chunk.populate({
    name: 'TEST_AUDIO_QUERY',
    difficulty: 'EASY',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 50.0, length: 20.0, velocityZ: 11.0 }],
    collectibles: []
  }, 0);

  player.position.set(0, 0, 0);
  // Train is at z=-50, half length = 10m. Front bumper is at -50 + 10 = -40m.
  // Separation from player (z=0) is 40m.
  const dist = trackManager.getApproachingTrainDistance(player.position.z);
  assert(Math.abs(dist - 40.0) < 0.1, `getApproachingTrainDistance accurately returned 40m (got ${dist.toFixed(2)}m)`);
}

// =========================================================================
// Suite 10: 30 / 60 / 120 FPS Consistency
// =========================================================================
console.log('--- Suite 10: 30 / 60 / 120 FPS Consistency ---');
{
  for (const fps of [30, 60, 120]) {
    const { trackManager, player } = createTestEnvironment();
    const chunk = trackManager.chunks[0];
    chunk.chunkZ = 0;
    chunk.clearDynamicItems();

    chunk.populate({
      name: `TEST_FPS_${fps}`,
      difficulty: 'EASY',
      obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 14.0, velocityZ: 10.0 }],
      collectibles: []
    }, 0);

    const train = chunk.obstacles[0];
    const dt = 1.0 / fps;
    const frames = Math.round(fps * 0.5); // 0.5 seconds simulation
    for (let f = 0; f < frames; f++) {
      chunk.update(dt, f * dt, player.position.z);
    }

    const expectedZ = -40.0 + 10.0 * 0.5; // -35.0m
    assert(Math.abs(train.group.position.z - expectedZ) < 0.05, `At ${fps} FPS, train position advanced correctly to ${expectedZ}m (got ${train.group.position.z.toFixed(3)}m)`);
  }
}

// =========================================================================
// Suite 11: Real Procedural Generation Encounter Verification
// =========================================================================
console.log('--- Suite 11: Real Procedural Generation Encounter Verification ---');
{
  const { trackManager, player } = createTestEnvironment();
  trackManager.reset(true);

  // DifficultyController enables moving trains after 240m.
  // Check if moving trains are selected in chunks at distance >= 240m across 15 chunks
  let movingTrainCount = 0;
  for (let c = 0; c < 15; c++) {
    const dist = 240.0 + c * CONSTANTS.CHUNK_LENGTH;
    (trackManager as any).elapsedTime = dist / 20;
    trackManager.difficultyController.update(CONSTANTS.CHUNK_LENGTH / 20, dist, 20);
    const pattern = trackManager.selectPattern(c + 4, 20.0, dist);
    const hasMoving = pattern.obstacles.some(o => o.type === 'MOVING_TRAIN');
    if (hasMoving) {
      movingTrainCount++;
    }
  }

  assert(movingTrainCount > 0, `Moving train patterns are encountered in procedural runs (encountered ${movingTrainCount} times)`);
}

console.log(`\n================================================================`);
console.log(`🎉 ALL ${passedTests} / ${totalTests} TASK 1 MOVING TRAIN TESTS PASSED!`);
console.log(`================================================================\n`);
