import * as THREE from 'three';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { CONSTANTS } from '../src/core/Constants';
import { TrainCompositionDef } from '../src/track/TrackTypes';

console.log('🧪 Starting Phase 2 Deterministic Train Scene & Visual Synchronization Test Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  }
}

// Set up standard factories
const obstacleFactory = new ObstacleFactory();
const collectibleFactory = new CollectibleFactory();

// Create a mock parent scene
const scene = new THREE.Scene();

// Instantiate TrackChunk
const chunk = new TrackChunk(obstacleFactory, collectibleFactory);
chunk.chunkZ = -120.0;
scene.add(chunk.group);

// -----------------------------------------------------------------------------
// SETUP DETERMINISTIC SCENE:
// 1. One approaching train (lane 1, moving at 30 m/s)
// 2. One passing adjacent-lane train (lane 0, moving at 25 m/s)
// 3. A multi-carriage train composition (lane 2, 2 carriages + gangway + rooftop obstacles)
// 4. One pooled train that will be recycled and respawned
// -----------------------------------------------------------------------------

console.log('--- Step 1: Initialize Deterministic Scene Setup ---');

const multiCarriageDef: TrainCompositionDef = {
  id: 'multi_car_exp_01',
  name: 'Multi-Carriage Express',
  difficultyTier: 'MEDIUM',
  totalLength: 38.0,
  carriages: [
    {
      id: 'car_lead',
      type: 'LOCOMOTIVE_CAB',
      length: 18.0,
      localOffsetZ: 10.0,
      variant: 'STREAMLINED_EXPRESS',
      colorHex: CONSTANTS.COLORS.TRAIN_BODY_1
    },
    {
      id: 'car_trail',
      type: 'CABOOSE_END',
      length: 18.0,
      localOffsetZ: -10.0,
      variant: 'MODERN_METRO',
      colorHex: CONSTANTS.COLORS.TRAIN_BODY_2
    }
  ],
  rooftopObstacles: [
    {
      id: 'ac_01',
      type: 'ROOFTOP_AC_HURDLE',
      localOffsetZ: 12.0,
      width: 1.6,
      length: 1.8,
      height: 0.65
    },
    {
      id: 'vent_01',
      type: 'ROOFTOP_VENT',
      localOffsetZ: -8.0,
      width: 1.4,
      length: 1.4,
      height: 0.50
    }
  ]
};

chunk.populate({
  name: 'PHASE2_DETERMINISTIC_SCENE',
  difficulty: 'HARD',
  obstacles: [
    // 1. Approaching oncoming train in lane 1
    {
      type: 'MOVING_TRAIN',
      lane: 1,
      zOffset: 40.0,
      length: 22.0,
      isMoving: true,
      velocityZ: 30.0
    },
    // 2. Passing adjacent-lane moving train in lane 0
    {
      type: 'MOVING_TRAIN',
      lane: 0,
      zOffset: 20.0,
      length: 22.0,
      isMoving: true,
      velocityZ: 25.0
    },
    // 3. Multi-carriage composition in lane 2
    {
      type: 'TRAIN',
      lane: 2,
      zOffset: 60.0,
      composition: multiCarriageDef
    }
  ],
  collectibles: []
}, -120.0);

scene.updateMatrixWorld(true);

const approachingTrain = chunk.obstacles.find(o => o.lane === 1 && o.isMoving)!;
const adjacentTrain = chunk.obstacles.find(o => o.lane === 0 && o.isMoving)!;
const multiCarriageTrain = chunk.obstacles.find(o => o.lane === 2)!;

assert(approachingTrain !== undefined, 'Approaching train initialized in lane 1');
assert(adjacentTrain !== undefined, 'Passing adjacent train initialized in lane 0');
assert(multiCarriageTrain !== undefined, 'Multi-carriage composition initialized in lane 2');

// -----------------------------------------------------------------------------
// VERIFICATION POINT 1: Attached details retain correct relative pose & hierarchy
// -----------------------------------------------------------------------------
console.log('\n--- Step 2: Verify Attached Details & Relative Pose Invariance ---');

interface TrackedMesh {
  mesh: THREE.Mesh;
  localPos: THREE.Vector3;
  initialWorldPos: THREE.Vector3;
}

function gatherMeshes(root: THREE.Object3D): TrackedMesh[] {
  const list: TrackedMesh[] = [];
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const wp = new THREE.Vector3();
      child.getWorldPosition(wp);
      list.push({
        mesh: child,
        localPos: child.position.clone(),
        initialWorldPos: wp
      });
    }
  });
  return list;
}

const approachingMeshes = gatherMeshes(approachingTrain.group);
const adjacentMeshes = gatherMeshes(adjacentTrain.group);
const multiCarMeshes = gatherMeshes(multiCarriageTrain.group);

assert(approachingMeshes.length > 50, `Approaching train contains rich component assembly (${approachingMeshes.length} meshes)`);
assert(adjacentMeshes.length > 50, `Adjacent train contains rich component assembly (${adjacentMeshes.length} meshes)`);
assert(multiCarMeshes.length > 80, `Multi-carriage train contains composite assembly (${multiCarMeshes.length} meshes)`);

// -----------------------------------------------------------------------------
// VERIFICATION POINT 2: No detached lights or meshes at origin
// -----------------------------------------------------------------------------
console.log('\n--- Step 3: Verify Zero Detached Lights and Zero Meshes at Origin ---');

function verifyHierarchyAndOrigin(obsGroup: THREE.Group, name: string): boolean {
  let valid = true;
  obsGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Must have obsGroup in parent chain
      let p: THREE.Object3D | null = child.parent;
      let connected = false;
      while (p) {
        if (p === obsGroup) {
          connected = true;
          break;
        }
        p = p.parent;
      }
      if (!connected) valid = false;

      // Must not be at absolute world (0, 0, 0)
      const wp = new THREE.Vector3();
      child.getWorldPosition(wp);
      if (wp.lengthSq() < 0.0001) {
        valid = false;
      }
    }
  });
  return valid;
}

assert(verifyHierarchyAndOrigin(approachingTrain.group, 'Approaching Train'), 'All approaching train lights and details inherit root; none at origin');
assert(verifyHierarchyAndOrigin(adjacentTrain.group, 'Adjacent Train'), 'All adjacent train lights and details inherit root; none at origin');
assert(verifyHierarchyAndOrigin(multiCarriageTrain.group, 'Multi-Carriage Train'), 'All multi-carriage lights, signs, and catwalks inherit root; none at origin');

// -----------------------------------------------------------------------------
// VERIFICATION POINT 3 & 7: Motion Simulation, Transform Synchronization & Collider Matching
// -----------------------------------------------------------------------------
console.log('\n--- Step 4: Advance Simulation & Verify Collider/Mesh Synchronization ---');

const dt = 1 / 60;
let allDisplacementsMatch = true;
let allCollidersMatch = true;
let relativePosesRetained = true;

for (let frame = 1; frame <= 60; frame++) {
  const prevApproachingZ = approachingTrain.group.position.z;
  const prevApproachingColliderZ = approachingTrain.collider.min.z;

  // Update chunk (advances moving obstacles by velocityZ * dt)
  chunk.update(dt, frame * dt, 0, 20.0);
  scene.updateMatrixWorld(true);

  const deltaMeshZ = approachingTrain.group.position.z - prevApproachingZ;
  const deltaColliderZ = approachingTrain.collider.min.z - prevApproachingColliderZ;
  const expectedStep = 30.0 * dt;

  if (Math.abs(deltaMeshZ - expectedStep) > 0.0001) allDisplacementsMatch = false;
  if (Math.abs(deltaColliderZ - expectedStep) > 0.0001) allCollidersMatch = false;
  if (Math.abs(deltaMeshZ - deltaColliderZ) > 0.0001) allCollidersMatch = false;

  // Sample meshes of approaching train
  for (const item of approachingMeshes) {
    if (item.mesh.position.distanceTo(item.localPos) > 0.0001) {
      relativePosesRetained = false;
    }
  }
}

assert(allDisplacementsMatch, 'Train visual root advances exactly velocityZ * dt each frame');
assert(allCollidersMatch, 'Lethal and roof colliders move in lockstep with visual mesh displacement');
assert(relativePosesRetained, 'All train headlights, taillights, and details retain exact relative pose during travel');

// -----------------------------------------------------------------------------
// VERIFICATION POINT 4: Object Pooling, Recycling & Clean Respawing
// -----------------------------------------------------------------------------
console.log('\n--- Step 5: Verify Object Pooling, Chunk Recycling & No Duplicate Lights ---');

const preRecycleMeshCount = chunk.group.children.length;

// Clear dynamic items (as done in chunk recycling)
chunk.clearDynamicItems();
scene.updateMatrixWorld(true);

assert(chunk.obstacles.length === 0, 'Recycling cleared all previous obstacles from chunk registry');

// Check that chunk.group has no remaining obstacle meshes
let lingeringObstacleMeshes = 0;
chunk.group.traverse((child) => {
  if (child.userData?.isTrain || child.userData?.type === 'MOVING_TRAIN') {
    lingeringObstacleMeshes++;
  }
});
assert(lingeringObstacleMeshes === 0, 'No lingering or ghost train meshes remain in scene hierarchy after recycle');

// Respawing a new train at a new chunk position
chunk.populate({
  name: 'RESPAWNED_CHUNK',
  difficulty: 'MEDIUM',
  obstacles: [
    {
      type: 'MOVING_TRAIN',
      lane: 1,
      zOffset: 30.0,
      length: 22.0,
      isMoving: true,
      velocityZ: 28.0
    }
  ],
  collectibles: []
}, -360.0);
scene.updateMatrixWorld(true);

assert(chunk.obstacles.length === 1, 'Respawned chunk has exactly 1 new obstacle');
const respawnedTrain = chunk.obstacles[0];
assert(respawnedTrain.isMoving === true, 'Respawned obstacle is moving train');

// Check spawn-time snapping: local position must be cleanly set to -30.0, world position to -390.0
assert(respawnedTrain.group.position.z === -30.0, `Respawned train local position is exact (-30.0, got ${respawnedTrain.group.position.z})`);

const respawnedWorld = new THREE.Vector3();
respawnedTrain.group.getWorldPosition(respawnedWorld);
assert(Math.abs(respawnedWorld.z - (-390.0)) < 0.001, `Respawned train world Z is exact (-390.0, got ${respawnedWorld.z})`);

// Verify no duplicate lights
let respawnedHeadlightCount = 0;
respawnedTrain.group.traverse((child) => {
  if (child instanceof THREE.Mesh && child.material === (obstacleFactory as any).trainHeadlightMat) {
    respawnedHeadlightCount++;
  }
});
assert(respawnedHeadlightCount === 2, `Respawned train has exactly 2 headlights without duplication (got ${respawnedHeadlightCount})`);

// -----------------------------------------------------------------------------
// VERIFICATION POINT 5: Pause and Resume Consistency
// -----------------------------------------------------------------------------
console.log('\n--- Step 6: Verify Pause & Resume Freeze Integrity ---');

const zBeforePause = respawnedTrain.group.position.z;
const cBeforePause = respawnedTrain.collider.min.z;

// Simulate 30 frames with dt = 0 (game paused)
for (let f = 0; f < 30; f++) {
  chunk.update(0, 10.0, 0, 0); // dt = 0
  scene.updateMatrixWorld(true);
}

assert(respawnedTrain.group.position.z === zBeforePause, 'Train position remains frozen during pause (dt = 0)');
assert(respawnedTrain.collider.min.z === cBeforePause, 'Train collider remains frozen during pause (dt = 0)');

// Resume simulation with dt = 1/60
chunk.update(1/60, 10.0 + 1/60, 0, 20.0);
scene.updateMatrixWorld(true);

const expectedAfterResume = zBeforePause + 28.0 * (1/60);
assert(Math.abs(respawnedTrain.group.position.z - expectedAfterResume) < 0.0001, 'Train resumes movement cleanly without teleportation or snapping');

// -----------------------------------------------------------------------------
// VERIFICATION POINT 6: Hard Mode Extreme High-Speed Motion (54 m/s)
// -----------------------------------------------------------------------------
console.log('\n--- Step 7: Verify Hard Mode High-Speed (54 m/s) Motion Coherence ---');

respawnedTrain.velocityZ = 54.0;
let hardModeLockstep = true;

for (let f = 1; f <= 120; f++) {
  const step = 54.0 * (1/60);
  const startZ = respawnedTrain.group.position.z;
  const startColliderZ = respawnedTrain.collider.min.z;

  chunk.update(1/60, 15.0 + f * (1/60), 0, 20.0);
  scene.updateMatrixWorld(true);

  const deltaZ = respawnedTrain.group.position.z - startZ;
  const deltaC = respawnedTrain.collider.min.z - startColliderZ;

  if (Math.abs(deltaZ - step) > 0.0001 || Math.abs(deltaC - step) > 0.0001) {
    hardModeLockstep = false;
  }
}

assert(hardModeLockstep, 'Hard Mode 54 m/s movement remains perfectly coherent and synchronized across 120 frames');

// -----------------------------------------------------------------------------
// VERIFICATION POINT 8: Stationary Signals Remain Stationary
// -----------------------------------------------------------------------------
console.log('\n--- Step 8: Verify Stationary Track Signals Remain Anchored ---');

// TrackChunk includes decorativeGroup containing gantry semaphores, wall coping, lamps, etc.
const stationaryDecorations: { mesh: THREE.Mesh; localPos: THREE.Vector3 }[] = [];
chunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    stationaryDecorations.push({
      mesh: child,
      localPos: child.position.clone()
    });
  }
});

assert(stationaryDecorations.length > 20, `Stationary track scenery contains signal/decor meshes (${stationaryDecorations.length} meshes)`);

// Move the train by 50 meters
respawnedTrain.group.position.z += 50.0;
scene.updateMatrixWorld(true);

let signalsStationary = true;
for (const item of stationaryDecorations) {
  if (item.mesh.position.distanceTo(item.localPos) > 0.0001) {
    signalsStationary = false;
  }
}

assert(signalsStationary, 'Stationary track signals and scenery maintain absolute static positions relative to chunk, unaffected by train motion');

console.log(`\n================================================================`);
console.log(`🏁 FINISHED DETERMINISTIC TEST SUITE: ${passed} passed, ${failed} failed`);
console.log(`================================================================\n`);

if (failed > 0) {
  process.exit(1);
}
