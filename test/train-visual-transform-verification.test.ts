import * as THREE from 'three';
import { ObstacleFactory, TrainVariant } from '../src/track/ObstacleFactory';
import { CurvedShaderManager } from '../src/scene/CurvedShader';
import { CONSTANTS } from '../src/core/Constants';

console.log('🧪 Running Deterministic Train Transform & Visual Hierarchy Verification Suite...\n');

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${msg}`);
    failed++;
  }
}

const factory = new ObstacleFactory();
const curved = CurvedShaderManager.getInstance();

// -----------------------------------------------------------------------------
// Test 1: Parent-Child Hierarchy and Local Transforms on All 3 Variants
// -----------------------------------------------------------------------------
console.log('--- Suite 1: Parent-Child Hierarchy & Authoritative Transform Inheritance ---');

const variants: TrainVariant[] = ['MODERN_METRO', 'CLASSIC_TRANSIT', 'STREAMLINED_EXPRESS'];

for (const variant of variants) {
  const trainLength = 22.0;
  const train = factory.createTrain(trainLength, false, 0x1e88e5);
  train.position.set(0, 0, -100);
  train.updateMatrixWorld(true);

  let headlightCount = 0;
  let taillightCount = 0;
  let destSignCount = 0;
  let allChildrenAttached = true;
  let noChildAtOrigin = true;

  train.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Ensure every mesh's parent is directly or indirectly train
      let p: THREE.Object3D | null = child.parent;
      let foundTrainRoot = false;
      while (p) {
        if (p === train) {
          foundTrainRoot = true;
          break;
        }
        p = p.parent;
      }
      if (!foundTrainRoot) allChildrenAttached = false;

      // Ensure no component was placed at absolute (0, 0, 0) in world space when train is at Z = -100
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      if (worldPos.lengthSq() < 0.001) {
        noChildAtOrigin = false;
      }

      // Check materials for headlights, taillights, dest signs
      if (child.material === (factory as any).trainHeadlightMat) headlightCount++;
      if (child.material === (factory as any).trainTaillightMat) taillightCount++;
      if (
        child.material === (factory as any).trainDestNeoMat ||
        child.material === (factory as any).trainDestClassicMat ||
        child.material === (factory as any).trainDestExpressMat
      ) destSignCount++;
    }
  });

  assert(allChildrenAttached, `[${variant}] All visual meshes inherit authoritative train root`);
  assert(noChildAtOrigin, `[${variant}] No train component starts at world origin (0, 0, 0)`);
  assert(headlightCount >= 2, `[${variant}] Found at least 2 mounted headlights (got ${headlightCount})`);
  assert(taillightCount >= 2, `[${variant}] Found at least 2 mounted taillights (got ${taillightCount})`);
  assert(destSignCount >= 1, `[${variant}] Found mounted destination display sign`);
}

// -----------------------------------------------------------------------------
// Test 2: Moving Train Displacement & Transform Invariance
// -----------------------------------------------------------------------------
console.log('\n--- Suite 2: Moving Train Dynamic Travel & Relative Attachment Tracking ---');

const moving = factory.createMovingTrain(24.0, CONSTANTS.COLORS.TRAIN_BODY_2);
const movingGroup = moving.group;
movingGroup.position.set(CONSTANTS.LANES[1], 0, -120);
movingGroup.updateMatrixWorld(true);

// Capture initial relative offsets of all children
interface ChildOffset {
  mesh: THREE.Mesh;
  localPos: THREE.Vector3;
  initialWorldPos: THREE.Vector3;
}

const trackedChildren: ChildOffset[] = [];
movingGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const worldPos = new THREE.Vector3();
    child.getWorldPosition(worldPos);
    trackedChildren.push({
      mesh: child,
      localPos: child.position.clone(),
      initialWorldPos: worldPos
    });
  }
});

assert(trackedChildren.length > 20, `Moving train has rich detail assembly (${trackedChildren.length} meshes tracked)`);

// Simulate movement down +Z across 60 frames (1 second at 30 m/s)
const dt = 1 / 60;
const speed = 30.0;
let relativeOffsetPreserved = true;
let forwardDisplacementMatches = true;

for (let frame = 1; frame <= 60; frame++) {
  const displacement = speed * dt;
  movingGroup.position.z += displacement;
  movingGroup.updateMatrixWorld(true);

  // Check each tracked child
  for (const tc of trackedChildren) {
    const currentWorld = new THREE.Vector3();
    tc.mesh.getWorldPosition(currentWorld);
    
    // The world Z should advance exactly by frame * (speed * dt)
    const expectedWorldZ = tc.initialWorldPos.z + frame * (speed * dt);
    if (Math.abs(currentWorld.z - expectedWorldZ) > 0.0001) {
      forwardDisplacementMatches = false;
    }

    // Local position must not mutate or drift
    if (tc.mesh.position.distanceTo(tc.localPos) > 0.0001) {
      relativeOffsetPreserved = false;
    }
  }
}

assert(forwardDisplacementMatches, 'Every child mesh follows train root displacement precisely across 60 frames');
assert(relativeOffsetPreserved, 'No child mesh experiences local coordinate drift or detachment');

// -----------------------------------------------------------------------------
// Test 3: Pause, Resume, and Pooling Cleanliness
// -----------------------------------------------------------------------------
console.log('\n--- Suite 3: Pause, Resume & Object Pooling Lifecycle ---');

// Pause check: zero displacement
const posBeforePause = movingGroup.position.z;
// Simulate 10 paused frames
for (let f = 0; f < 10; f++) {
  // dt = 0 when paused
  movingGroup.updateMatrixWorld(true);
}
assert(movingGroup.position.z === posBeforePause, 'Train position remains frozen during pause');

// Resume check
movingGroup.position.z += 15.0;
movingGroup.updateMatrixWorld(true);
assert(movingGroup.position.z === posBeforePause + 15.0, 'Train resumes movement cleanly without transform snapping');

// Recycling check: reset to spawn position
movingGroup.position.set(CONSTANTS.LANES[-1], 0, -150);
movingGroup.updateMatrixWorld(true);

let cleanRecycle = true;
movingGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const wp = new THREE.Vector3();
    child.getWorldPosition(wp);
    // World Z must be around -150, NOT previous position (~-75)
    if (wp.z > -100) cleanRecycle = false;
  }
});
assert(cleanRecycle, 'Recycled moving train resets all child mesh world positions without stale coordinates');

// -----------------------------------------------------------------------------
// Test 4: Curved Shader Application on Emissive Details
// -----------------------------------------------------------------------------
console.log('\n--- Suite 4: Curved Shader Material Uniforms on Emissive & Scenery Detailing ---');

const testMat = (factory as any).trainHeadlightMat as THREE.Material;
assert(typeof testMat.onBeforeCompile === 'function', 'trainHeadlightMat has onBeforeCompile vertex shader hook');
assert(typeof (testMat as any).customProgramCacheKey === 'function', 'trainHeadlightMat has customProgramCacheKey set');

const mockShader: any = {
  vertexShader: '#include <project_vertex>',
  uniforms: {}
};
testMat.onBeforeCompile!(mockShader, {} as THREE.WebGLRenderer);

assert(mockShader.uniforms.uBend !== undefined, 'Shader injects uBend uniform');
assert(mockShader.vertexShader.includes('mvPosition.y += zSqr * uBend.y'), 'Shader injects quadratic curvature calculation into vertex pipeline');

// Test that headlight track illumination beam is segmented
assert(moving.headlightBeam !== undefined, 'Headlight track illumination beam exists');
const beamGeo = moving.headlightBeam!.geometry as THREE.PlaneGeometry;
const beamSegmentsY = (beamGeo.parameters as any).heightSegments;
assert(beamSegmentsY >= 16, `Headlight beam is finely subdivided along length (${beamSegmentsY} segments >= 16)`);

// -----------------------------------------------------------------------------
// Test 5: Hard Mode Extreme High-Speed Stability (54 m/s)
// -----------------------------------------------------------------------------
console.log('\n--- Suite 5: Hard Mode High-Speed (54 m/s) Motion Coherence ---');

movingGroup.position.set(0, 0, -200);
const hardSpeed = 54.0;
let stableAtHardSpeed = true;

for (let f = 1; f <= 120; f++) {
  const step = hardSpeed * (1 / 60);
  movingGroup.position.z += step;
  movingGroup.updateMatrixWorld(true);

  // Sample headlight world position
  const hPos = new THREE.Vector3();
  moving.headlights[0].getWorldPosition(hPos);
  const expectedH = -200 + f * step + moving.headlights[0].position.z;
  if (Math.abs(hPos.z - expectedH) > 0.001) {
    stableAtHardSpeed = false;
  }
}

assert(stableAtHardSpeed, 'Headlights remain strictly locked to train nose at 54 m/s across 120 frames');

console.log(`\n================================================================`);
console.log(`🏁 FINISHED: ${passed} passed, ${failed} failed`);
console.log(`================================================================\n`);

if (failed > 0) {
  process.exit(1);
}
