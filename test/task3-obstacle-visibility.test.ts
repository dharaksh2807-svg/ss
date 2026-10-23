import { EventBus, EVENTS } from '../src/core/EventBus';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { OBSTACLE_PATTERNS, TrackPattern } from '../src/track/ObstaclePatterns';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Task 3 Complete Obstacle Visibility Test Suite...\n');

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
    id: `test_${type}_${Date.now()}_${Math.random()}`,
    group,
    type,
    lane,
    collider: box,
    nearMissBox: box.clone(),
    nearMissTriggered: false,
    active: true
  };
}

const obsFactory = new ObstacleFactory();

// =========================================================================
// Suite 1: Low Jump Hurdle — Geometry, Silhouette & Ground Solidity
// =========================================================================
console.log('--- Suite 1: Low Jump Hurdle Family (3 Variants) ---');
{
  const { player } = createTestEnvironment();

  // Test all 3 variants: 0=A-Frame, 1=Heavy Maintenance Gate, 2=Buffer Stop
  for (let v = 0; v < 3; v++) {
    const mesh = obsFactory.createLowBarrier(v);
    assert(mesh !== null && mesh instanceof THREE.Group, `Low hurdle variant ${v} created successfully`);
    assert(mesh.userData.type === 'LOW_BARRIER', `Variant ${v} type is LOW_BARRIER`);
    assert(mesh.userData.variant === v, `Variant metadata matches requested variant (${v})`);

    const box = new THREE.Box3().setFromObject(mesh);
    const height = box.max.y - box.min.y;
    const width = box.max.x - box.min.x;
    const depth = box.max.z - box.min.z;

    assert(box.min.y <= 0.05, `Variant ${v} rests firmly on track ground (min.y = ${box.min.y.toFixed(3)}m <= 0.05m)`);
    assert(Math.abs(height - CONSTANTS.LOW_BARRIER_HEIGHT) < 0.20,
      `Variant ${v} height (~${CONSTANTS.LOW_BARRIER_HEIGHT}m) matches spec (got ${height.toFixed(2)}m)`);
    assert(width >= 2.8 && width <= 3.5,
      `Variant ${v} spans track lane width effectively (${width.toFixed(2)}m)`);
    assert(depth >= 0.15, `Variant ${v} possesses structural thickness and depth (${depth.toFixed(2)}m >= 0.15m)`);

    const obs = makeObsInstance(mesh, box, 'LOW_BARRIER', 0);

    // 1. Sliding runner (sitting on ground, y = 0.45m) CANNOT slide under low hurdle
    player.position.set(0, 0.45, 0);
    player.isJumping = false;
    player.isSliding = true;
    player.updateCollider();
    const slideRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(slideRes.outcome !== 'SAFE_CONTACT',
      `Variant ${v}: Sliding under low hurdle is prevented (hurdle is solid to ground)`);

    // 2. Normal jump clears low hurdle cleanly
    player.position.set(0, 1.5, 0);
    player.isJumping = true;
    player.isSliding = false;
    player.updateCollider();
    const jumpRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(jumpRes.outcome === 'SAFE_CONTACT',
      `Variant ${v}: Normal jump safely clears low hurdle`);

    // 3. Lane change to adjacent lane bypasses low hurdle
    player.position.set(CONSTANTS.LANE_WIDTH, 0, 0);
    player.isJumping = false;
    player.isSliding = false;
    player.updateCollider();
    const hasCollision = player.collider.intersectsBox(obs.collider);
    assert(!hasCollision,
      `Variant ${v}: Lane changing to adjacent lane safely avoids low hurdle`);
  }
}

// =========================================================================
// Suite 2: High Overhead Slide-Only Barriers — Train-Height & Slide Opening
// =========================================================================
console.log('\n--- Suite 2: High Overhead Slide Barrier Family (Train-Height Gantries) ---');
{
  const { player } = createTestEnvironment();

  // Test all 3 variants: 0=Station Signal Gantry, 1=Industrial Truss Portal, 2=Tunnel Clearance Beam
  for (let v = 0; v < 3; v++) {
    const mesh = obsFactory.createHighBarrier(v);
    assert(mesh !== null && mesh instanceof THREE.Group, `High barrier gantry variant ${v} created successfully`);
    assert(mesh.userData.type === 'HIGH_BARRIER', `Variant ${v} type is HIGH_BARRIER`);
    assert(mesh.userData.variant === v, `Variant metadata matches requested variant (${v})`);

    const box = new THREE.Box3().setFromObject(mesh);
    const totalHeight = box.max.y;
    const width = box.max.x - box.min.x;

    // Must be substantial train-height presence (~4.05m to 4.17m, comparable to 4.2m train)
    assert(totalHeight >= 3.8,
      `Variant ${v} has substantial train-height gantry presence (${totalHeight.toFixed(2)}m >= 3.8m)`);
    assert(width >= 3.0 && width <= 3.8,
      `Variant ${v} spans track lane with massive structural pylons (${width.toFixed(2)}m)`);

    // Collider setup matching TrackChunk:
    // min.y is CONSTANTS.HIGH_BARRIER_CLEARANCE (1.40m), max.y is HIGH_BARRIER_HEIGHT (4.05m)
    const laneX = 0;
    const halfW = CONSTANTS.LANE_WIDTH * 0.45;
    const halfD = 0.35;
    const gantryCollider = new THREE.Box3(
      new THREE.Vector3(laneX - halfW, CONSTANTS.HIGH_BARRIER_CLEARANCE, -halfD),
      new THREE.Vector3(laneX + halfW, CONSTANTS.HIGH_BARRIER_HEIGHT, halfD)
    );

    const obs = makeObsInstance(mesh, gantryCollider, 'HIGH_BARRIER', 0);

    // 1. Sliding runner (height = 0.75m, center y = 0.45m, top y = 0.825m in test) passes cleanly through clearance opening
    player.position.set(0, 0.45, 0);
    player.isJumping = false;
    player.isSliding = true;
    player.updateCollider();
    assert(player.collider.max.y <= CONSTANTS.HIGH_BARRIER_CLEARANCE,
      `Sliding player top (${player.collider.max.y.toFixed(3)}m) is strictly below ${CONSTANTS.HIGH_BARRIER_CLEARANCE}m clearance`);

    const slideRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(slideRes.outcome === 'SAFE_CONTACT',
      `Variant ${v}: Sliding cleanly clears through ${CONSTANTS.HIGH_BARRIER_CLEARANCE}m overhead gantry opening`);

    // 2. Standing upright runner (height = 1.8m) hits overhead box girder at [1.40m, 1.8m]
    player.position.set(0, 0, 0);
    player.isJumping = false;
    player.isSliding = false;
    player.updateCollider();
    assert(player.collider.max.y >= CONSTANTS.HIGH_BARRIER_CLEARANCE,
      `Standing player head (${player.collider.max.y.toFixed(2)}m) extends into overhead girder zone`);

    const standRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(standRes.outcome === 'MAJOR_FATAL_HIT',
      `Variant ${v}: Standing runner crashes into solid overhead gantry girder (Slide required)`);

    // 3. Jumping runner (position y = 1.8m, up to 3.15m apex) crashes into overhead girder / upper truss
    player.position.set(0, 1.80, 0);
    player.isJumping = true;
    player.isSliding = false;
    player.updateCollider();
    const jumpRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(jumpRes.outcome === 'MAJOR_FATAL_HIT',
      `Variant ${v}: Jumping into overhead gantry is fatal (slide-only barrier)`);

    // 4. Lane change to open lane allows safe passage around gantry
    player.position.set(CONSTANTS.LANE_WIDTH, 0, 0);
    player.isJumping = false;
    player.isSliding = false;
    player.updateCollider();
    const hasGantryCollision = player.collider.intersectsBox(obs.collider);
    assert(!hasGantryCollision,
      `Variant ${v}: Changing to open neighboring lane bypasses high barrier`);
  }
}

// =========================================================================
// Suite 3: Obstacle Category Distinction Matrix
// =========================================================================
console.log('\n--- Suite 3: Obstacle Category Distinction Matrix ---');
{
  const { player } = createTestEnvironment();

  const lowObs = makeObsInstance(obsFactory.createLowBarrier(), new THREE.Box3(
    new THREE.Vector3(-1.5, 0, -0.35),
    new THREE.Vector3(1.5, CONSTANTS.LOW_BARRIER_HEIGHT, 0.35)
  ), 'LOW_BARRIER');

  const medObs = makeObsInstance(obsFactory.createMediumBarrier(), new THREE.Box3(
    new THREE.Vector3(-1.5, 0, -0.35),
    new THREE.Vector3(1.5, CONSTANTS.MEDIUM_BARRIER_HEIGHT, 0.35)
  ), 'MEDIUM_BARRIER');

  const highObs = makeObsInstance(obsFactory.createHighBarrier(), new THREE.Box3(
    new THREE.Vector3(-1.5, CONSTANTS.HIGH_BARRIER_CLEARANCE, -0.35),
    new THREE.Vector3(1.5, CONSTANTS.HIGH_BARRIER_HEIGHT, 0.35)
  ), 'HIGH_BARRIER');

  const pillarObs = makeObsInstance(obsFactory.createPillar(), new THREE.Box3(
    new THREE.Vector3(-0.45, 0, -0.45),
    new THREE.Vector3(0.45, CONSTANTS.PILLAR_HEIGHT, 0.45)
  ), 'PILLAR');

  // Action: Normal Jump (Y = 1.5m)
  player.position.set(0, 1.5, 0);
  player.isJumping = true;
  player.isSliding = false;
  player.updateCollider();
  assert(CollisionResolver.resolveOutcome(lowObs, player, null).outcome === 'SAFE_CONTACT', 'Low barrier cleared by Jump');
  assert(CollisionResolver.resolveOutcome(medObs, player, null).outcome !== 'SAFE_CONTACT', 'Medium barrier blocks standard jump');
  assert(CollisionResolver.resolveOutcome(highObs, player, null).outcome === 'MAJOR_FATAL_HIT', 'High barrier collides with jump');
  assert(CollisionResolver.resolveOutcome(pillarObs, player, null).outcome !== 'SAFE_CONTACT', 'Pillar blocks jump');

  // Action: Slide (Y = 0.45m)
  player.position.set(0, 0.45, 0);
  player.isJumping = false;
  player.isSliding = true;
  player.updateCollider();
  assert(CollisionResolver.resolveOutcome(lowObs, player, null).outcome !== 'SAFE_CONTACT', 'Low barrier blocks slide');
  assert(CollisionResolver.resolveOutcome(medObs, player, null).outcome !== 'SAFE_CONTACT', 'Medium barrier blocks slide');
  assert(CollisionResolver.resolveOutcome(highObs, player, null).outcome === 'SAFE_CONTACT', 'High barrier cleared by slide');
  assert(CollisionResolver.resolveOutcome(pillarObs, player, null).outcome !== 'SAFE_CONTACT', 'Pillar blocks slide');
}

// =========================================================================
// Suite 4: Procedural Pattern Quality & Fair Spacing
// =========================================================================
console.log('\n--- Suite 4: Obstacle Sequences & Fair Recovery Spacing ---');
{
  const jumpSlidePattern = OBSTACLE_PATTERNS.find(p => p.name === 'LOW_HURDLE_TO_HIGH_BARRIER');
  assert(jumpSlidePattern !== undefined, 'LOW_HURDLE_TO_HIGH_BARRIER pattern exists');

  if (jumpSlidePattern) {
    const lowHurdle = jumpSlidePattern.obstacles.find(o => o.type === 'LOW_BARRIER');
    const highGantry = jumpSlidePattern.obstacles.find(o => o.type === 'HIGH_BARRIER');
    assert(lowHurdle !== undefined && highGantry !== undefined, 'Pattern contains both low hurdle and high barrier');

    if (lowHurdle && highGantry) {
      const distance = highGantry.zOffset - lowHurdle.zOffset;
      assert(distance >= 25.0, `Safe reaction spacing between jump and slide (${distance}m >= 25m)`);

      // Verify jump arc coins over low hurdle
      const jumpCoins = jumpSlidePattern.collectibles.find(c => c.isArc && Math.abs(c.zOffset - lowHurdle.zOffset) < 5.0);
      assert(jumpCoins !== undefined, 'Jump arc coins positioned to telegraph low hurdle jump');

      // Verify slide guidance coins under high barrier
      const slideCoins = jumpSlidePattern.collectibles.find(c => c.isSlideGuidance && Math.abs(c.zOffset - highGantry.zOffset) < 5.0);
      assert(slideCoins !== undefined, 'Slide guidance coins positioned low to telegraph slide under high barrier');
    }
  }

  // Verify other slide hazard combinations
  const slideToTrain = OBSTACLE_PATTERNS.find(p => p.name === 'SLIDE_GANTRY_TO_TRAIN');
  assert(slideToTrain !== undefined, 'SLIDE_GANTRY_TO_TRAIN pattern exists');

  const gauntlet = OBSTACLE_PATTERNS.find(p => p.name === 'CONSECUTIVE_JUMP_SLIDE_GAUNTLET');
  assert(gauntlet !== undefined, 'CONSECUTIVE_JUMP_SLIDE_GAUNTLET pattern exists');
}

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} TASK 3 OBSTACLE VISIBILITY TESTS PASSED!`);
console.log('=======================================================\n');
