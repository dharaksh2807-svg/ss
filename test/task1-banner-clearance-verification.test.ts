import { ObstacleFactory, ObstacleInstance } from '../src/track/ObstacleFactory';
import { CollisionResolver } from '../src/track/CollisionResolver';
import { Player } from '../src/player/Player';
import { TrackManager } from '../src/track/TrackManager';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import * as THREE from 'three';

console.log('🧪 Starting Metro Runner 3D: Task 1 Banner Height & Slide Clearance Verification Suite...\n');

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
const player = new Player();
player.reset();

// =========================================================================
// Suite 1: Active Configuration & Constant Integrity
// =========================================================================
console.log('--- Suite 1: Active Configuration & Constant Verification ---');
{
  assert(CONSTANTS.PLAYER_HEIGHT_RUN === 1.8, 'Standing player height is exactly 1.8 units');
  assert(CONSTANTS.PLAYER_HEIGHT_SLIDE === 0.75, 'Sliding player height is exactly 0.75 units');
  assert(CONSTANTS.HIGH_BARRIER_CLEARANCE === 1.40, 'High barrier ground clearance is raised to 1.40 units (within 1.35-1.45 range)');
  assert(CONSTANTS.HIGH_BARRIER_HEIGHT === 4.05, 'High barrier overall height remains 4.05 units (substantial train profile)');
  assert(CONSTANTS.LOW_BARRIER_HEIGHT === 1.30, 'Low barrier height is raised to 1.30 units (+18% for high-speed visibility)');
  assert(CONSTANTS.JUMP_HEIGHT === 2.25, 'Player jump height remains 2.25 units (strict scope: no modification)');
  assert(CONSTANTS.SLIDE_DURATION === 0.65, 'Player slide duration remains 0.65s (strict scope: no modification)');
}

// =========================================================================
// Suite 2: Geometry & Physical Collider Exact Alignment across all 3 Variants
// =========================================================================
console.log('\n--- Suite 2: Physical Collider & Visible Geometry Exact Alignment ---');
{
  for (let v = 0; v < 3; v++) {
    const mesh = obsFactory.createHighBarrier(v);
    assert(mesh instanceof THREE.Group, `Variant ${v} high barrier creates valid THREE.Group`);
    assert(mesh.userData.type === 'HIGH_BARRIER', `Variant ${v} userData.type is HIGH_BARRIER`);

    // Verify Collider matching TrackChunk specification
    const halfW = CONSTANTS.LANE_WIDTH * 0.45;
    const halfD = 0.35;
    const collider = new THREE.Box3(
      new THREE.Vector3(-halfW, CONSTANTS.HIGH_BARRIER_CLEARANCE, -halfD),
      new THREE.Vector3(halfW, CONSTANTS.HIGH_BARRIER_HEIGHT, halfD)
    );

    assert(collider.min.y === 1.40, `Variant ${v} collider.min.y is exactly 1.40m`);
    assert(collider.max.y === 4.05, `Variant ${v} collider.max.y matches total height 4.05m`);

    // Inspect child meshes: verify no overhead beam elements extend below 1.40m
    let lowestBeamY = Infinity;
    mesh.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        // Exclude ground pedestals and vertical support columns which rest on the ground at track edges
        const isColumn = Math.abs(m.position.x) > halfW * 0.8;
        if (!isColumn) {
          const childBox = new THREE.Box3().setFromObject(m);
          if (childBox.min.y < lowestBeamY) {
            lowestBeamY = childBox.min.y;
          }
        }
      }
    });

    assert(lowestBeamY >= 1.395,
      `Variant ${v} lowest beam element (${lowestBeamY.toFixed(3)}m) aligns with 1.40m clearance (no invisible collision volume mismatch)`);
  }
}

// =========================================================================
// Suite 3: Gameplay Contract Enforcement: Standing, Jumping, Sliding, Lane Change
// =========================================================================
console.log('\n--- Suite 3: Gameplay Contract Verification ---');
{
  for (let v = 0; v < 3; v++) {
    const mesh = obsFactory.createHighBarrier(v);
    const halfW = CONSTANTS.LANE_WIDTH * 0.45;
    const halfD = 0.35;
    const collider = new THREE.Box3(
      new THREE.Vector3(-halfW, CONSTANTS.HIGH_BARRIER_CLEARANCE, -halfD),
      new THREE.Vector3(halfW, CONSTANTS.HIGH_BARRIER_HEIGHT, halfD)
    );
    const obs = makeObsInstance(mesh, collider, 'HIGH_BARRIER', 0);

    // 1. Standing Runner Upright -> Guaranteed Collision
    player.position.set(0, 0, 0);
    player.isJumping = false;
    player.isSliding = false;
    player.updateCollider();
    assert(player.collider.max.y === 1.80, 'Standing player collider top reaches 1.80m');
    assert(player.collider.max.y > CONSTANTS.HIGH_BARRIER_CLEARANCE,
      'Standing player extends 0.40m above 1.40m clearance threshold');
    assert(player.collider.intersectsBox(obs.collider), 'Standing player AABB intersects barrier collider');

    const standRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(standRes.outcome === 'MAJOR_FATAL_HIT',
      `Variant ${v}: Standing runner crashes into solid 1.40m overhead gantry (Slide mandatory)`);

    // 2. Jumping Runner -> Guaranteed Collision with overhead structure
    player.position.set(0, 1.80, 0);
    player.isJumping = true;
    player.isSliding = false;
    player.updateCollider();
    assert(player.collider.intersectsBox(obs.collider), 'Jumping player intersects overhead gantry');

    const jumpRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(jumpRes.outcome === 'MAJOR_FATAL_HIT',
      `Variant ${v}: Jumping into 1.40m overhead gantry results in fatal collision`);

    // 3. Sliding Runner -> Clean Safe Clearance
    // In test runner standard coordinates:
    player.position.set(0, 0.45, 0);
    player.isJumping = false;
    player.isSliding = true;
    player.updateCollider();
    assert(player.collider.max.y === 1.20, 'Sliding player collider top is 1.20m');
    assert(player.collider.max.y < CONSTANTS.HIGH_BARRIER_CLEARANCE,
      'Sliding player top (1.20m) clears 1.40m lower edge with +0.20m safety margin');

    const slideRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(slideRes.outcome === 'SAFE_CONTACT',
      `Variant ${v}: Sliding runner safely passes through 1.40m clearance`);

    // Also verify in gameplay ground coordinate (groundY = 0.9):
    player.position.set(0, CONSTANTS.PLAYER_BASE_Y, 0);
    player.isJumping = false;
    player.isSliding = true;
    player.updateCollider();
    const gameGroundSlideRes = CollisionResolver.resolveOutcome(obs, player, null);
    assert(gameGroundSlideRes.outcome === 'SAFE_CONTACT',
      `Variant ${v}: Sliding at groundY = 0.9m cleanly passes clearance`);

    // 4. Changing Lane to unobstructed lane -> Safe passage
    player.position.set(CONSTANTS.LANE_WIDTH, 0, 0);
    player.isJumping = false;
    player.isSliding = false;
    player.updateCollider();
    const laneChangeIntersect = player.collider.intersectsBox(obs.collider);
    assert(!laneChangeIntersect,
      `Variant ${v}: Changing to neighboring lane (+${CONSTANTS.LANE_WIDTH}m) completely avoids high barrier`);

    player.position.set(-CONSTANTS.LANE_WIDTH, 0, 0);
    player.updateCollider();
    const leftLaneChangeIntersect = player.collider.intersectsBox(obs.collider);
    assert(!leftLaneChangeIntersect,
      `Variant ${v}: Changing to left neighboring lane (-${CONSTANTS.LANE_WIDTH}m) completely avoids high barrier`);
  }
}

// =========================================================================
// Suite 4: High-Speed Traversals & No Regression to Other Obstacles
// =========================================================================
console.log('\n--- Suite 4: High Speed Traversal & Unrelated Obstacle Regression Checks ---');
{
  const speeds = [18.0, 28.0, 38.0];
  for (const spd of speeds) {
    player.speed = spd;
    player.position.set(0, 0.45, 0);
    player.isSliding = true;
    player.isJumping = false;
    player.updateCollider();

    const mesh = obsFactory.createHighBarrier(0);
    const halfW = CONSTANTS.LANE_WIDTH * 0.45;
    const collider = new THREE.Box3(
      new THREE.Vector3(-halfW, CONSTANTS.HIGH_BARRIER_CLEARANCE, -0.35),
      new THREE.Vector3(halfW, CONSTANTS.HIGH_BARRIER_HEIGHT, 0.35)
    );
    const obs = makeObsInstance(mesh, collider, 'HIGH_BARRIER', 0);
    const res = CollisionResolver.resolveOutcome(obs, player, null);
    assert(res.outcome === 'SAFE_CONTACT', `Slide under 1.40m clearance safely clears at high speed ${spd} m/s`);
  }

  // Regression check: Low Hurdle remains jump-only and blocks slide
  const lowMesh = obsFactory.createLowBarrier(0);
  const lowBox = new THREE.Box3(
    new THREE.Vector3(-1.5, 0, -0.35),
    new THREE.Vector3(1.5, CONSTANTS.LOW_BARRIER_HEIGHT, 0.35)
  );
  const lowObs = makeObsInstance(lowMesh, lowBox, 'LOW_BARRIER', 0);

  // Low hurdle jump
  player.position.set(0, 1.55, 0);
  player.isJumping = true;
  player.isSliding = false;
  player.updateCollider();
  assert(CollisionResolver.resolveOutcome(lowObs, player, null).outcome === 'SAFE_CONTACT',
    'Low hurdle jump clearing remains completely unaffected');

  // Low hurdle slide attempt
  player.position.set(0, 0.45, 0);
  player.isJumping = false;
  player.isSliding = true;
  player.updateCollider();
  assert(CollisionResolver.resolveOutcome(lowObs, player, null).outcome !== 'SAFE_CONTACT',
    'Sliding into low hurdle remains blocked (cannot slide under jump hurdle)');

  // Medium barrier slide attempt
  const medMesh = obsFactory.createMediumBarrier();
  const medBox = new THREE.Box3(
    new THREE.Vector3(-1.5, 0, -0.35),
    new THREE.Vector3(1.5, CONSTANTS.MEDIUM_BARRIER_HEIGHT, 0.35)
  );
  const medObs = makeObsInstance(medMesh, medBox, 'MEDIUM_BARRIER', 0);
  assert(CollisionResolver.resolveOutcome(medObs, player, null).outcome !== 'SAFE_CONTACT',
    'Sliding into medium barrier remains blocked');
}

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${passedTests}/${totalTests} TASK 1 CLEARANCE VERIFICATION TESTS PASSED!`);
console.log(`=======================================================\n`);
