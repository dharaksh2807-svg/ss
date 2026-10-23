import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { ReachabilityValidator } from '../src/track/ReachabilityValidator';
import { OBSTACLE_PATTERNS, TrackPattern } from '../src/track/ObstaclePatterns';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Task 2 Railway Obstacle System Test Suite...\n');

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

// In-memory localStorage mock for node environment
const storageMock: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, val: string) => { storageMock[key] = val; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => {
    for (const k in storageMock) delete storageMock[k];
  },
  key: (i: number) => Object.keys(storageMock)[i] || null,
  length: Object.keys(storageMock).length
} as any;

function createTestEnvironment() {
  const scene = new THREE.Scene();
  const trackManager = new TrackManager(scene);
  const player = new Player(scene);

  trackManager.reset();
  const chunk = trackManager.chunks[0];
  chunk.chunkZ = 0;
  chunk.clearDynamicItems();

  return { scene, trackManager, player, chunk };
}

function makeObsInstance(group: THREE.Group, box: THREE.Box3, type: any, lane: any = 0): ObstacleInstance {
  return {
    id: `test_${type}_${Date.now()}`,
    group,
    type,
    lane,
    collider: box,
    nearMissBox: box.clone(),
    nearMissTriggered: false,
    active: true
  };
}

// =========================================================================
// Suite 1: Moving Trains — Genuine Movement, Approach Staging & Collision
// =========================================================================
console.log('--- Suite 1: Moving Trains — Approach Staging, Motion & Collision ---');
{
  const { scene, trackManager, player, chunk } = createTestEnvironment();

  // Populate chunk with a moving train at zOffset 40.0m
  chunk.populate({
    name: 'MOVING_TRAIN_TEST',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 20.0, isMoving: true }],
    collectibles: []
  }, 0.0);

  const obsData = chunk.obstacles[0];
  assert(obsData.isMoving === true, 'Obstacle is flagged as isMoving');
  assert(obsData.velocityZ === CONSTANTS.MOVING_TRAIN_SPEED, `Moving train velocityZ equals ${CONSTANTS.MOVING_TRAIN_SPEED} m/s`);

  // Test 1.1: Pre-activation staging — when player is > 85m away, train remains stationary
  // Chunk at chunkZ = -200.0, train localZ = -40.0, worldCenterZ = -240.0, halfD = 10.0, frontZ = -230.0.
  // With player at playerZ = 0.0, separation = 0 - (-230) = 230m > 85m.
  const farChunk = new TrackChunk(new ObstacleFactory(), new CollectibleFactory());
  farChunk.populate({
    name: 'FAR_MOVING_TRAIN',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'MOVING_TRAIN', lane: 0, zOffset: 40.0, length: 20.0, isMoving: true }],
    collectibles: []
  }, -200.0);
  const farTrain = farChunk.obstacles[0];
  const farInitLocalZ = farTrain.group.position.z;

  // Update with player at playerZ = 0.0 (separation = 230m > 85m)
  farChunk.update(0.1, 0.0, 0.0);
  assert(farTrain.group.position.z === farInitLocalZ, 'Train remains staged while player separation > 85m (no premature departure)');

  // Test 1.2: Activation — when player approaches within 85m
  // With player at playerZ = -160.0, separation = -160 - (-230) = 70m <= 85m.
  let hornEventFired = false;
  EventBus.getInstance().on(EVENTS.TRAIN_HORN, () => { hornEventFired = true; });

  const dt = 0.5;
  farChunk.update(dt, 0.0, -160.0);
  assert(farTrain.group.position.z > farInitLocalZ, 'Moving train advances along +Z toward approaching player upon activation');
  assert(Math.abs((farTrain.group.position.z - farInitLocalZ) - (CONSTANTS.MOVING_TRAIN_SPEED * dt)) < 0.05,
    `Train advanced by expected amount (${(CONSTANTS.MOVING_TRAIN_SPEED * dt).toFixed(2)}m) along +Z`);

  // Test 1.3: Telegraph events (horn & headlights)
  assert(hornEventFired === true, 'Train horn sound event dispatched upon approach <= 65m');

  // Test 1.4: Collider synchronization — Box3 moves with the mesh
  const syncedBox = farTrain.collider;
  const initialWorldCenterZ = -200.0 + farInitLocalZ;
  const expectedWorldZ = -200.0 + farTrain.group.position.z;
  const halfD = 20.0 * 0.5;
  assert(Math.abs(syncedBox.max.z - (expectedWorldZ + halfD)) < 0.01,
    'Collider Box3 max.z is exactly synchronized with mesh position in world space');
  assert(Math.abs(syncedBox.min.z - (expectedWorldZ - halfD)) < 0.01,
    'Collider Box3 min.z is exactly synchronized with mesh position in world space');

  // Test 1.5: Frontal collision on oncoming moving train
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, expectedWorldZ + halfD + 0.1);
  player.updateCollider();
  const outcome = CollisionResolver.resolveOutcome(farTrain, player, null);

  assert(outcome.outcome === 'MAJOR_FATAL_HIT',
    'Direct frontal impact with oncoming moving train is immediately fatal');
}

// =========================================================================
// Suite 2: Realistic Railway Pillars and Structural Hazards
// =========================================================================
console.log('\n--- Suite 2: Realistic Railway Pillars and Structural Hazards ---');
{
  const obsFactory = new ObstacleFactory();
  const pillarMesh = obsFactory.createPillar();

  // Test 2.1: Visual and collider geometry
  assert(pillarMesh !== undefined, 'ObstacleFactory creates valid PILLAR mesh');

  const box = new THREE.Box3().setFromObject(pillarMesh);
  const widthX = box.max.x - box.min.x;
  const heightY = box.max.y - box.min.y;
  assert(Math.abs(widthX - CONSTANTS.PILLAR_WIDTH) < 0.20, `Pillar width matches constant (~${CONSTANTS.PILLAR_WIDTH}m, got ${widthX.toFixed(2)}m)`);
  assert(Math.abs(heightY - CONSTANTS.PILLAR_HEIGHT) < 0.35, `Pillar height reaches ceiling truss (~${CONSTANTS.PILLAR_HEIGHT}m, got ${heightY.toFixed(2)}m)`);

  // Test 2.2: Frontal collision resolution
  const { player } = createTestEnvironment();
  player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 10.0);
  player.isChangingLane = false;
  player.updateCollider();
  pillarMesh.position.set(0, 0, 10.0);
  box.setFromObject(pillarMesh);

  const pillarObs = makeObsInstance(pillarMesh, box, 'PILLAR', 0);

  const frontalOutcome = CollisionResolver.resolveOutcome(pillarObs, player, null);
  assert(frontalOutcome.outcome === 'MAJOR_FATAL_HIT', 'Frontal collision with solid concrete pillar is fatal');

  // Test 2.3: Jumping does NOT bypass a solid pillar (pillar extends to 7.6m ceiling)
  player.position.set(0, 2.25, 10.0); // Jump apex
  player.isJumping = true;
  player.updateCollider();
  const jumpOutcome = CollisionResolver.resolveOutcome(pillarObs, player, null);
  assert(jumpOutcome.outcome === 'MAJOR_FATAL_HIT', 'Jumping does not bypass solid structural pillar');

  // Test 2.4: Sliding does NOT bypass a solid pillar (sits firmly on ground)
  player.position.set(0, 0.45, 10.0);
  player.isJumping = false;
  player.isSliding = true;
  player.updateCollider();
  const slideOutcome = CollisionResolver.resolveOutcome(pillarObs, player, null);
  assert(slideOutcome.outcome === 'MAJOR_FATAL_HIT', 'Sliding does not bypass solid structural pillar');

  // Test 2.5: Glancing flank contact results in recoverable stumble
  // Set player near edge of pillar (pillar width is 0.9m, halfW is 0.45m; player halfW is ~0.35m)
  // At player.x = 0.70m, playerBox is [0.35, 1.05], pillarBox is [-0.45, 0.45], overlapX is 0.10m < 0.30m
  player.position.set(0.70, CONSTANTS.PLAYER_BASE_Y, 10.0);
  player.isJumping = false;
  player.isSliding = false;
  player.isChangingLane = true;
  player.targetLane = 1;
  player.currentLane = 0;
  player.updateCollider();

  const flankOutcome = CollisionResolver.resolveOutcome(pillarObs, player, null);
  assert(flankOutcome.isGlance === true || flankOutcome.outcome === 'MINOR_STUMBLE',
    'Side edge glance on pillar results in stumble rather than instant death');
}

// =========================================================================
// Suite 3: Modular Subway Tunnels
// =========================================================================
console.log('\n--- Suite 3: Modular Subway Tunnels ---');
{
  const obsFactory = new ObstacleFactory();
  const colFactory = new CollectibleFactory();
  const chunk = new TrackChunk(obsFactory, colFactory);

  // Test 3.1: Tunnel entrance chunk setup
  chunk.populate({
    name: 'TUNNEL_TEST_ENTRANCE',
    difficulty: 'MEDIUM',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 20.0 }],
    collectibles: [],
    isTunnel: true,
    tunnelPortal: 'ENTRANCE'
  }, -100.0);

  assert(chunk.isTunnel === true, 'TrackChunk correctly flags isTunnel: true');
  assert(chunk.tunnelPortal === 'ENTRANCE', 'TrackChunk correctly identifies tunnel entrance portal');

  // Test 3.2: Tunnel geometry clearance
  let maxCeilingY = 0;
  let minCeilingY = 999;
  let wallPositionsX: number[] = [];

  chunk.decorativeGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      if (b.min.y > 6.0) {
        maxCeilingY = Math.max(maxCeilingY, b.max.y);
        if (Math.abs(child.position.x) <= CONSTANTS.LANE_WIDTH) {
          minCeilingY = Math.min(minCeilingY, b.min.y);
        }
      }
      if (Math.abs(child.position.x) >= 5.0 && b.max.y < 7.0) {
        wallPositionsX.push(child.position.x);
      }
    }
  });

  assert(maxCeilingY >= CONSTANTS.TUNNEL_CEILING_HEIGHT - 0.2,
    `Tunnel ceiling height (~${CONSTANTS.TUNNEL_CEILING_HEIGHT}m) gives ample clearance (got ${maxCeilingY.toFixed(2)}m)`);
  assert(minCeilingY > 6.8, 'Tunnel ceiling crown clears train rooftop running and jumping (Y > 6.8m)');

  assert(wallPositionsX.length >= 2, 'Tunnel has continuous side walls and architectural rib columns');
  const minWallX = Math.min(...wallPositionsX.map(Math.abs));
  assert(minWallX > CONSTANTS.LANE_WIDTH * 1.5,
    `Tunnel walls and structural ribs clear outer lanes (X >= ${minWallX.toFixed(2)}m > 5.4m)`);
  const maxWallX = Math.max(...wallPositionsX.map(Math.abs));
  assert(Math.abs(maxWallX - CONSTANTS.TUNNEL_WALL_X) < 0.1,
    `Outer ceramic tunnel walls positioned at exact TUNNEL_WALL_X (${CONSTANTS.TUNNEL_WALL_X}m, got ${maxWallX.toFixed(2)}m)`);

  // Test 3.3: Tunnel entry & exit audio/lighting event dispatch
  let enteredTunnelEvent = false;
  let exitedTunnelEvent = false;

  EventBus.getInstance().on(EVENTS.TUNNEL_ENTERED, () => { enteredTunnelEvent = true; });
  EventBus.getInstance().on(EVENTS.TUNNEL_EXITED, () => { exitedTunnelEvent = true; });

  // Player enters tunnel chunk (chunk at chunkZ = -100, length = 80, bounds [-100, -180])
  chunk.update(0.1, 0.0, -120.0); // Inside chunk
  assert(enteredTunnelEvent === true, 'EVENTS.TUNNEL_ENTERED dispatched upon entering tunnel chunk');

  // Player leaves tunnel chunk past -180m
  chunk.update(0.1, 0.0, -190.0); // Past chunk
  assert(exitedTunnelEvent === true, 'EVENTS.TUNNEL_EXITED dispatched upon exiting tunnel chunk');
}

// =========================================================================
// Suite 4: Three Distinct Barrier Classes
// =========================================================================
console.log('\n--- Suite 4: Three Distinct Barrier Classes ---');
{
  const obsFactory = new ObstacleFactory();
  const { player } = createTestEnvironment();

  // --- Class 1: Low Jump Hurdle (LOW_BARRIER) ---
  const lowMesh = obsFactory.createLowBarrier();
  const lowBox = new THREE.Box3().setFromObject(lowMesh);
  const lowH = lowBox.max.y - lowBox.min.y;
  assert(Math.abs(lowH - CONSTANTS.LOW_BARRIER_HEIGHT) < 0.20,
    `LOW_BARRIER height is ~${CONSTANTS.LOW_BARRIER_HEIGHT}m (got ${lowH.toFixed(2)}m)`);

  const lowObs = makeObsInstance(lowMesh, lowBox, 'LOW_BARRIER', 0);

  // Jump clears
  player.position.set(0, 1.5, 0);
  player.isJumping = true;
  player.isSliding = false;
  player.updateCollider();
  const lowJumpRes = CollisionResolver.resolveOutcome(lowObs, player, null);
  assert(lowJumpRes.outcome === 'SAFE_CONTACT', 'Jumping cleanly clears LOW_BARRIER');

  // Sliding hits low hurdle (hurdle sits on the ground)
  player.position.set(0, 0.45, 0);
  player.isJumping = false;
  player.isSliding = true;
  player.updateCollider();
  const lowSlideRes = CollisionResolver.resolveOutcome(lowObs, player, null);
  assert(lowSlideRes.outcome !== 'SAFE_CONTACT', 'Sliding into low hurdle results in collision (cannot slide under)');

  // --- Class 2: Medium Barrier (MEDIUM_BARRIER) ---
  const medMesh = obsFactory.createMediumBarrier();
  const medBox = new THREE.Box3().setFromObject(medMesh);
  const medH = medBox.max.y - medBox.min.y;
  assert(Math.abs(medH - CONSTANTS.MEDIUM_BARRIER_HEIGHT) < 0.25,
    `MEDIUM_BARRIER height is ~${CONSTANTS.MEDIUM_BARRIER_HEIGHT}m (got ${medH.toFixed(2)}m)`);

  const medObs = makeObsInstance(medMesh, medBox, 'MEDIUM_BARRIER', 0);

  // High peak jump clears
  player.position.set(0, 1.95, 0);
  player.isJumping = true;
  player.isSliding = false;
  player.updateCollider();
  const medHighJumpRes = CollisionResolver.resolveOutcome(medObs, player, null);
  assert(medHighJumpRes.outcome === 'SAFE_CONTACT', 'Peak apex jump (Y >= 1.85m) clears MEDIUM_BARRIER');

  // Low jump hits medium barrier
  player.position.set(0, 1.35, 0);
  player.isJumping = true;
  player.isSliding = false;
  player.updateCollider();
  const medLowJumpRes = CollisionResolver.resolveOutcome(medObs, player, null);
  assert(medLowJumpRes.outcome !== 'SAFE_CONTACT', 'Low jump (Y < 1.85m) collides with MEDIUM_BARRIER');

  // Slide hits medium barrier
  player.position.set(0, 0.45, 0);
  player.isJumping = false;
  player.isSliding = true;
  player.updateCollider();
  const medSlideRes = CollisionResolver.resolveOutcome(medObs, player, null);
  assert(medSlideRes.outcome !== 'SAFE_CONTACT', 'Sliding into MEDIUM_BARRIER results in collision');

  // --- Class 3: High Slide-Only Barrier (HIGH_BARRIER) ---
  const highMesh = obsFactory.createHighBarrier();
  const highBox = new THREE.Box3().setFromObject(highMesh);
  assert(highBox.max.y > 3.0, 'HIGH_BARRIER overhead gantry extends above 3.0m');

  const highObs = makeObsInstance(highMesh, highBox, 'HIGH_BARRIER', 0);

  // Slide under clears
  player.position.set(0, 0.45, 0);
  player.isJumping = false;
  player.isSliding = true;
  player.updateCollider();
  const highSlideRes = CollisionResolver.resolveOutcome(highObs, player, null);
  assert(highSlideRes.outcome === 'SAFE_CONTACT', 'Sliding beneath HIGH_BARRIER clears cleanly');

  // Jump into overhead barrier hits crossbeam
  player.position.set(0, 1.80, 0);
  player.isJumping = true;
  player.isSliding = false;
  player.updateCollider();
  const highJumpRes = CollisionResolver.resolveOutcome(highObs, player, null);
  assert(highJumpRes.outcome === 'MAJOR_FATAL_HIT',
    'Jumping into HIGH_BARRIER crossbeam is fatal (slide-only barrier)');
}

// =========================================================================
// Suite 5: Procedural Combinations & Reachability Fairness
// =========================================================================
console.log('\n--- Suite 5: Procedural Combinations & Reachability Fairness ---');
{
  const expectedNewPatterns = [
    'MOVING_TRAIN_SIDE_CHOICE',
    'LOW_HURDLE_TO_HIGH_BARRIER',
    'PILLAR_CENTRAL_SPLIT',
    'SLIDE_GANTRY_TO_TRAIN',
    'PILLAR_AND_LOW_BARRIER',
    'TUNNEL_ENTRY_SLIDE_HAZARD',
    'TUNNEL_SHORT_ENCLOSED',
    'TUNNEL_EXIT_MOVING_TRAIN',
    'RAMP_AND_ROOFTOP_RUN',
    'CONSECUTIVE_JUMP_SLIDE_GAUNTLET',
    'EXPERT_MOVING_TRAIN_PILLAR_MAZE'
  ];

  for (const name of expectedNewPatterns) {
    const found = OBSTACLE_PATTERNS.find(p => p.name === name);
    assert(found !== undefined, `Pattern "${name}" exists in catalog`);

    // Validate reachability at min speed 18 m/s
    const res18 = ReachabilityValidator.validateCollectibleReachability(found as any, 18.0);
    assert(res18.valid === true, `Pattern "${name}" has 100% reachable path at 18 m/s`);

    // Validate reachability at max speed 38 m/s
    const res38 = ReachabilityValidator.validateCollectibleReachability(found as any, 38.0);
    assert(res38.valid === true, `Pattern "${name}" has 100% reachable path at 38 m/s`);
  }
}

// =========================================================================
// Suite 6: Object Recycling & Memory Safety
// =========================================================================
console.log('\n--- Suite 6: Object Recycling & Memory Safety ---');
{
  const obsFactory = new ObstacleFactory();
  const colFactory = new CollectibleFactory();
  const chunk = new TrackChunk(obsFactory, colFactory);

  // Populate chunk
  chunk.populate({
    name: 'TUNNEL_RECYCLE_TEST',
    difficulty: 'HARD',
    obstacles: [
      { type: 'PILLAR', lane: 0, zOffset: 20.0 },
      { type: 'MOVING_TRAIN', lane: 1, zOffset: 45.0, isMoving: true }
    ],
    collectibles: [],
    isTunnel: true,
    tunnelPortal: 'ENTRANCE'
  }, -200.0);

  assert(chunk.obstacles.length === 2, 'Chunk has 2 active obstacles');
  assert(chunk.isTunnel === true, 'Chunk is in tunnel mode');

  // 1. Clear dynamic items
  chunk.clearDynamicItems();
  assert(chunk.obstacles.length === 0, 'Chunk cleared all dynamic obstacles');
  assert(chunk.collectibles.length === 0, 'Chunk cleared all dynamic collectibles');

  // 2. Recycle chunk into standard outdoor railway pattern
  chunk.populate({
    name: 'OUTDOOR_RECYCLED_RUNWAY',
    difficulty: 'EASY',
    obstacles: [{ type: 'LOW_BARRIER', lane: 0, zOffset: 25.0 }],
    collectibles: []
  }, 0.0);

  assert(chunk.isTunnel === false, 'Chunk reset tunnel state to false');
  assert(chunk.tunnelPortal === 'NONE', 'Chunk reset tunnelPortal to NONE');
  assert(!chunk.decorativeGroup.children.some(c => c.name === 'tunnel_scenery'),
    'Tunnel scenery cleanly disposed when chunk is recycled into open railway');
  assert(chunk.obstacles.length === 1, 'Chunk populated with new obstacle');
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passedTests}/${totalTests} TASK 2 RAILWAY OBSTACLE TESTS PASSED!`);
console.log(`=======================================================\n`);
