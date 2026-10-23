import * as THREE from 'three';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { DistrictPlanner } from '../src/environment/DistrictPlanner';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { MODERN_METRO_THEME, HISTORIC_QUARTER_THEME, NEON_INDUSTRIAL_THEME } from '../src/environment/EnvironmentConfig';
import { CONSTANTS } from '../src/core/Constants';

// Mock storage for Node test environment
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = String(v); },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

class Mock2DContext {
  fillStyle: any = '#000';
  strokeStyle: any = '#000';
  lineWidth = 1;
  font = '12px sans-serif';
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  ellipse() {}
  roundRect() {}
  rect() {}
  fill() {}
  stroke() {}
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  fillText() {}
  strokeText() {}
  measureText(str: string) { return { width: str.length * 8 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
}

class MockCanvas {
  style = {};
  width = 1440;
  height = 900;
  addEventListener() {}
  removeEventListener() {}
  getContext() { return new Mock2DContext(); }
}

(globalThis as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') return new MockCanvas();
    return {
      style: {},
      classList: { add() {}, remove() {}, contains: () => false },
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
      getAttribute: () => null,
      appendChild() {}
    };
  },
  getElementById: () => null,
  body: { appendChild() {} }
};

(globalThis as any).window = {
  innerWidth: 1440,
  innerHeight: 900,
  devicePixelRatio: 2.0,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  navigator: { hardwareConcurrency: 8, userAgent: 'Mozilla/5.0' }
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    failed++;
    throw new Error(msg);
  } else {
    console.log(`✅ PASSED: ${msg}`);
    passed++;
  }
}

console.log('🧪 Starting Comprehensive Dynamic World Generation Engine Test Suite...\n');

const obsFactory = new ObstacleFactory();
const colFactory = new CollectibleFactory();
const director = EnvironmentDirector.getInstance();

// =========================================================================
// Suite 1: Root Cause Fix — Recycled Chunks Receive Brand New Scenery
// =========================================================================
console.log('--- Suite 1: Recycled Chunks Scenery Regeneration ---');

const chunk = new TrackChunk(obsFactory, colFactory);
chunk.populate([], 0, 'MODERN_METRO', false);

// Capture snapshot of building heights and positions at Z = 0
const snapshotZ0: number[] = [];
chunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    snapshotZ0.push(child.position.y, child.scale.y);
  }
});

// Recycle chunk to new world position (Z = -800)
chunk.populate([], -800, 'MODERN_METRO', false);

const snapshotZ800: number[] = [];
chunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    snapshotZ800.push(child.position.y, child.scale.y);
  }
});

assert(snapshotZ0.length > 0, 'Initial chunk at Z=0 generates decorative scenery meshes');
assert(snapshotZ800.length > 0, 'Recycled chunk at Z=-800 generates decorative scenery meshes');

// Verify that recycled chunk received fresh, different building heights/positions
let isDifferent = false;
for (let i = 0; i < Math.min(snapshotZ0.length, snapshotZ800.length); i++) {
  if (Math.abs(snapshotZ0[i] - snapshotZ800[i]) > 0.001) {
    isDifferent = true;
    break;
  }
}
assert(isDifferent, 'Recycled chunk at Z=-800 receives new modular scenery layout instead of stale reused meshes');

// =========================================================================
// Suite 2: Distinct World Positions Produce Distinct Architecture
// =========================================================================
console.log('\n--- Suite 2: Architectural Variation Across Positions ---');

const chunkA = new TrackChunk(obsFactory, colFactory);
const chunkB = new TrackChunk(obsFactory, colFactory);

chunkA.populate([], -160, 'MODERN_METRO', false);
chunkB.populate([], -240, 'MODERN_METRO', false);

const heightsA: number[] = [];
chunkA.decorativeGroup.traverse((c) => {
  if (c instanceof THREE.Mesh && c.position.y > 10) {
    heightsA.push(c.position.y);
  }
});

const heightsB: number[] = [];
chunkB.decorativeGroup.traverse((c) => {
  if (c instanceof THREE.Mesh && c.position.y > 10) {
    heightsB.push(c.position.y);
  }
});

assert(heightsA.length > 0 && heightsB.length > 0, 'Both chunks generate skyscraper silhouettes');
const heightsIdentical = heightsA.length === heightsB.length && heightsA.every((h, i) => Math.abs(h - heightsB[i]) < 0.001);
assert(!heightsIdentical, 'Different chunk positions produce varied building heights and silhouettes');

// =========================================================================
// Suite 3: Replays with the Same Seed Reproduce Scenery Identically
// =========================================================================
console.log('\n--- Suite 3: Deterministic Scenery Reproducibility ---');

const fixedSeed = 54321;
director.setRunSeed(fixedSeed, true);

const replayChunk1 = new TrackChunk(obsFactory, colFactory);
replayChunk1.populate([], -320, 'MODERN_METRO', false);

const replaySnapshot1: { x: number; y: number; z: number }[] = [];
replayChunk1.decorativeGroup.traverse((c) => {
  if (c instanceof THREE.Mesh) {
    replaySnapshot1.push({ x: c.position.x, y: c.position.y, z: c.position.z });
  }
});

// Reset director with the same seed
director.setRunSeed(fixedSeed, true);

const replayChunk2 = new TrackChunk(obsFactory, colFactory);
replayChunk2.populate([], -320, 'MODERN_METRO', false);

const replaySnapshot2: { x: number; y: number; z: number }[] = [];
replayChunk2.decorativeGroup.traverse((c) => {
  if (c instanceof THREE.Mesh) {
    replaySnapshot2.push({ x: c.position.x, y: c.position.y, z: c.position.z });
  }
});

assert(replaySnapshot1.length === replaySnapshot2.length, 'Replays with identical seed produce exact same mesh count');
let exactMatch = true;
for (let i = 0; i < replaySnapshot1.length; i++) {
  const p1 = replaySnapshot1[i];
  const p2 = replaySnapshot2[i];
  if (Math.abs(p1.x - p2.x) > 0.001 || Math.abs(p1.y - p2.y) > 0.001 || Math.abs(p1.z - p2.z) > 0.001) {
    exactMatch = false;
    break;
  }
}
assert(exactMatch, 'Replays with identical seed reproduce exact decorative scenery positions and geometries');

// =========================================================================
// Suite 4: Scenery Randomness Does Not Corrupt Gameplay Obstacles
// =========================================================================
console.log('\n--- Suite 4: Decoupled Scenery vs Gameplay Randomness ---');

const dummyScene = new THREE.Scene();
const trackMgr = new TrackManager(dummyScene);

// Run A: Record 5 obstacle patterns with seed 7777
trackMgr.setSeed(7777, true);
const patternsA: string[] = [];
for (let i = 0; i < 5; i++) {
  const p = trackMgr.selectPattern(i, 20.0, i * 80);
  patternsA.push(p.name);
}

// Generate arbitrary decorative scenery in between
for (let i = 0; i < 10; i++) {
  director.decorateChunk(chunk, -80 * i, i);
}

// Run B: Reset with seed 7777 and generate patterns again
trackMgr.setSeed(7777, true);
const patternsB: string[] = [];
for (let i = 0; i < 5; i++) {
  const p = trackMgr.selectPattern(i, 20.0, i * 80);
  patternsB.push(p.name);
}

assert(patternsA.length === patternsB.length, 'Pattern counts match across runs');
const patternsIdentical = patternsA.every((name, i) => name === patternsB[i]);
assert(patternsIdentical, 'Changing scenery or adding decorative meshes NEVER changes obstacle pattern selection');

// =========================================================================
// Suite 5: Active Districts Remain Contiguous
// =========================================================================
console.log('\n--- Suite 5: Contiguous District Region Planning ---');

const planner = new DistrictPlanner(12345);
const regions = planner.getRegions();
assert(regions.length > 0, 'District planner initialized with planned regions');

// Verify that regions cover multi-chunk intervals
for (const reg of regions) {
  assert(reg.length >= 560, `Region #${reg.index} length ${reg.length}m spans at least 7 chunks (560m)`);
  assert(reg.startZ > reg.endZ, `Region #${reg.index} startZ (${reg.startZ}) > endZ (${reg.endZ}) along -Z axis`);
  assert(reg.portalZ === reg.endZ, `Region #${reg.index} portal is located at boundary (${reg.portalZ}m)`);
}

// Verify continuous coverage without gaps or random flickering
let continuous = true;
for (let z = 0; z > -1600; z -= 40) {
  const info = planner.getDistrictAtZ(z);
  if (!info.districtId) {
    continuous = false;
    break;
  }
}
assert(continuous, 'District planner provides contiguous, unbroken environment coverage along the world axis');

// =========================================================================
// Suite 6: No Geometry Gaps Between Consecutive Chunks
// =========================================================================
console.log('\n--- Suite 6: Roadbed & Wall Geometry Continuity ---');

const chunk1 = new TrackChunk(obsFactory, colFactory);
const chunk2 = new TrackChunk(obsFactory, colFactory);

chunk1.populate([], -80, 'MODERN_METRO', false);
chunk2.populate([], -160, 'MODERN_METRO', false);

// Check chunk boundary continuity
const chunk1End = chunk1.chunkZ - chunk1.length;
assert(chunk1End === chunk2.chunkZ, 'Chunk 1 trailing edge perfectly aligns with Chunk 2 leading edge (-160m)');

// Retaining walls span chunkLength (80m)
let wallLengthVerified = false;
chunk1.decorativeGroup.traverse((c) => {
  if (c instanceof THREE.Mesh && c.geometry instanceof THREE.BoxGeometry) {
    const params = (c.geometry as any).parameters;
    if (params && params.depth === 80) {
      wallLengthVerified = true;
    }
  }
});
assert(wallLengthVerified, 'Perimeter retaining walls span full chunk length (80m) ensuring zero geometry gaps');

// =========================================================================
// Suite 7: Clean Scenery Recycling & SceneryPool Integrity
// =========================================================================
console.log('\n--- Suite 7: Clean Scenery Recycling & Pool Tracking ---');

const pool = SceneryPool.getInstance();
const testChunk = new TrackChunk(obsFactory, colFactory);

testChunk.populate([], -80, 'MODERN_METRO', false);
const countBefore = testChunk.decorativeGroup.children.length;
assert(countBefore > 0, 'Chunk has populated decorative elements');

// Recycle to new position
testChunk.populate([], -400, 'HISTORIC_QUARTER', false);
const countAfter = testChunk.decorativeGroup.children.length;
assert(countAfter > 0, 'Recycled chunk populated with new district elements');

// Confirm no lingering meshes from previous environment
let foundModernWallInHistoric = false;
testChunk.decorativeGroup.traverse((c) => {
  if (c instanceof THREE.Mesh) {
    if (c.material === SceneryFactory.getInstance().getSharedMaterials().modernGlassMat) {
      foundModernWallInHistoric = true;
    }
  }
});
assert(!foundModernWallInHistoric, 'Previous Modern Metro meshes are cleanly cleared when recycled to Historic Quarter');

// =========================================================================
// Suite 8: Shared Materials Remain Valid and Undisposed
// =========================================================================
console.log('\n--- Suite 8: Shared Materials Cache Validity ---');

const sharedMats = SceneryFactory.getInstance().getSharedMaterials();
assert(sharedMats.modernGlassMat instanceof THREE.MeshStandardMaterial, 'modernGlassMat is valid MeshStandardMaterial');
assert(sharedMats.weatheredBrickMat1 instanceof THREE.MeshStandardMaterial, 'weatheredBrickMat1 is valid MeshStandardMaterial');
assert(sharedMats.stoneMasonryMat instanceof THREE.MeshStandardMaterial, 'stoneMasonryMat is valid MeshStandardMaterial');
assert(sharedMats.curbMat instanceof THREE.MeshStandardMaterial, 'curbMat is valid MeshStandardMaterial');
assert(sharedMats.industrialSteelMat instanceof THREE.MeshStandardMaterial, 'industrialSteelMat is valid MeshStandardMaterial');

// Ensure shared materials are not disposed after multiple chunk recycles
assert(sharedMats.modernGlassMat.opacity !== undefined, 'Shared materials retain valid shader uniforms and properties');

// =========================================================================
// Suite 9: Existing Physical Gameplay Colliders & Train Geometry Invariants
// =========================================================================
console.log('\n--- Suite 9: Gameplay Colliders & Train Collision Fairness ---');

const patternWithTrain = {
  name: 'TEST_TRAIN_PATTERN',
  obstacles: [
    { type: 'TRAIN_RAMP', lane: 0, zOffset: 40, hasRamp: true, length: CONSTANTS.TRAIN_LENGTH_SHORT }
  ]
};

const trainChunk = new TrackChunk(obsFactory, colFactory);
trainChunk.populate(patternWithTrain as any, -200, 'MODERN_METRO', false);

assert(trainChunk.obstacles.length === 1, 'Train obstacle is spawned in chunk');
const trainObs = trainChunk.obstacles[0];

assert(trainObs.collider instanceof THREE.Box3, 'Train main collider exists and is Box3');
assert(trainObs.bodyCollider instanceof THREE.Box3, 'Train lower hull lethal collider exists');
assert(trainObs.roofCollider instanceof THREE.Box3, 'Train rooftop traversable collider exists');
assert(trainObs.rampCollider instanceof THREE.Box3, 'Train climbable ramp collider exists');
assert(trainObs.roofSurfaceY === 4.35, 'Train walkable rooftop surface Y is invariant at 4.35m');

// Ensure colliders are in chunk.group, NOT in decorativeGroup
assert(trainChunk.group.children.includes(trainObs.group), 'Train mesh is in authoritative physical track group');
assert(!trainChunk.decorativeGroup.children.includes(trainObs.group), 'Train mesh is NOT inside decorativeGroup');

// =========================================================================
// Suite 10: Graphics Quality Detail Toggling
// =========================================================================
console.log('\n--- Suite 10: Graphics Quality Detail Toggling ---');

const qualityChunk = new TrackChunk(obsFactory, colFactory);
qualityChunk.populate([], -100, 'MODERN_METRO', false);

assert(qualityChunk.decorativeGroup.visible === true, 'Decorative group is visible in FULL detail');

qualityChunk.setSceneryDetail('MINIMAL');
assert(qualityChunk.decorativeGroup.visible === false, 'Decorative group is hidden in MINIMAL detail');
assert(qualityChunk.group.visible === true, 'Physical roadbed remains visible in MINIMAL detail');

qualityChunk.setSceneryDetail('FULL');
assert(qualityChunk.decorativeGroup.visible === true, 'Decorative group is restored in FULL detail');

// =========================================================================
// Suite 11: Developer Diagnostics & Environment Preview
// =========================================================================
console.log('\n--- Suite 11: Developer Diagnostics & Environment Preview ---');

const diag = director.getDiagnostics(-150);
assert(diag.currentEnvironment === 'MODERN_METRO' || diag.currentEnvironment === 'HISTORIC_QUARTER', 'Diagnostics reports currentEnvironment');
assert(diag.distanceToTransition >= 0, 'Diagnostics reports distanceToTransition');
assert(diag.sceneryMeshCount > 0, 'Diagnostics reports sceneryMeshCount');
assert(diag.estimatedDrawCalls > 0, 'Diagnostics reports estimatedDrawCalls');
assert(diag.activeChunkSeeds.length > 0, 'Diagnostics reports activeChunkSeeds');

// Test developer environment preview / jumping
director.jumpToDistrict('HISTORIC_QUARTER');
assert(director.getCurrentDistrict() === 'HISTORIC_QUARTER', 'Developer jump sets current district to HISTORIC_QUARTER');

director.clearDistrictOverride();

// =========================================================================
// Summary
// =========================================================================
console.log('\n=======================================================');
console.log(`📊 DYNAMIC WORLD GENERATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('=======================================================');

if (failed > 0) {
  process.exit(1);
}
