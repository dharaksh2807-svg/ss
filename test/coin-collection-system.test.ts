/**
 * Comprehensive Automated Verification Suite for Task 3:
 * Coin Visuals, Geometry Orientation, Spawn Alignment & Collection System
 */

import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { TrackChunk } from '../src/track/TrackChunk';
import { TrackManager } from '../src/track/TrackManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { OBSTACLE_PATTERNS } from '../src/track/ObstaclePatterns';
import { Player } from '../src/player/Player';
import { EventBus, EVENTS } from '../src/core/EventBus';

// Mock localStorage for Node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: store.size
  } as any;
}

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  } else {
    passedTests++;
    console.log(`✅ PASSED: ${msg}`);
  }
}

console.log('=======================================================');
console.log('🧪 TASK 3: COIN VISUALS & COLLECTION SYSTEM TEST SUITE');
console.log('=======================================================\n');

// --- Test 1: Coin Geometry Orientation & Face Normals ---
console.log('--- Test 1: Coin Geometry Orientation & Face Normals ---');
const factory = new CollectibleFactory();
const coinGroup = factory.createCoin();

assert(coinGroup instanceof THREE.Group, 'Coin root is a valid THREE.Group');
assert(coinGroup.children.length === 1, 'Coin root contains inner tilted presentation group');

const innerCoin = coinGroup.children[0] as THREE.Group;
assert(innerCoin.children.length === 5, 'Inner coin group contains 5 components (disk, outer rim, inner rim, front star, back star)');

const diskMesh = innerCoin.children[0] as THREE.Mesh;
const outerRimMesh = innerCoin.children[1] as THREE.Mesh;
const innerRimMesh = innerCoin.children[2] as THREE.Mesh;
const frontStarMesh = innerCoin.children[3] as THREE.Mesh;
const backStarMesh = innerCoin.children[4] as THREE.Mesh;

// Verify face orientation:
// Disk cylinder was rotated by PI/2 around X, so its circular faces lie in X-Y plane facing +Z and -Z
assert(Math.abs(diskMesh.rotation.x - Math.PI / 2) < 1e-4, 'Coin disk rotated around X by PI/2 (circular faces lie in X-Y plane)');
assert(diskMesh.rotation.y === 0 && diskMesh.rotation.z === 0, 'Coin disk has no unwanted Y/Z twists');

// Outer rim and inner rim constructed in X-Y plane, normal along Z
assert(outerRimMesh.rotation.x === 0 && outerRimMesh.rotation.y === 0, 'Outer torus rim lies in X-Y plane with normal facing Z');
assert(innerRimMesh.rotation.x === 0 && innerRimMesh.rotation.y === 0, 'Inner minted bezel torus lies in X-Y plane with normal facing Z');

// Front star on +Z face, back star on -Z face
assert(frontStarMesh.position.z > 0.05, `Front star is on positive Z surface (+Z facing approaching runner): ${frontStarMesh.position.z}m`);
assert(backStarMesh.position.z < -0.05, `Back star is on negative Z surface (-Z facing away): ${backStarMesh.position.z}m`);
assert(Math.abs(backStarMesh.rotation.y - Math.PI) < 1e-4, 'Back star rotated 180 deg around Y to project emblem onto back surface');

// Subtle forward presentation pitch tilt toward elevated camera
assert(Math.abs(innerCoin.rotation.x - 0.22) < 1e-4, 'Coin has 12.5 deg pitch presentation tilt toward elevated camera');

// --- Test 2: Dimensional & Material Precision ---
console.log('\n--- Test 2: Dimensional & Material Precision ---');
const diskGeo = diskMesh.geometry as THREE.CylinderGeometry;
const diskParams = diskGeo.parameters;
assert(Math.abs(diskParams.radiusTop - CONSTANTS.COIN_RADIUS) < 1e-4, `Coin disk radius matches CONSTANTS.COIN_RADIUS (${CONSTANTS.COIN_RADIUS}m)`);
assert(Math.abs(diskParams.height - 0.14) < 1e-4, `Coin disk thickness is 0.14m for solid arcade feel`);
assert(diskParams.radialSegments >= 24, `Coin disk has high radial resolution (>= 24 segments) for clean circular silhouette`);

const goldMat = diskMesh.material as THREE.MeshStandardMaterial;
assert(goldMat.metalness >= 0.85, `Gold material has high metalness: ${goldMat.metalness}`);
assert(goldMat.roughness <= 0.25, `Gold material has low roughness for glossy specular highlight: ${goldMat.roughness}`);
assert(goldMat.emissiveIntensity > 0.1 && goldMat.emissiveIntensity <= 0.35, `Gold material has restrained, non-overblown emissive accent: ${goldMat.emissiveIntensity}`);

// --- Test 3: Ambient Bobbing & Continuous World Collider Synchronization ---
console.log('\n--- Test 3: Ambient Bobbing & Continuous World Collider Synchronization ---');
const obstacleFactory = new ObstacleFactory();
const chunk = new TrackChunk(obstacleFactory, factory);
const pattern = OBSTACLE_PATTERNS.find(p => p.name === 'RUNWAY_INTRO') || OBSTACLE_PATTERNS[0];

chunk.populate(pattern, -100);
const firstCoin = chunk.collectibles.find(c => c.type === 'COIN')!;
assert(firstCoin !== undefined, 'Collectible instance populated in chunk');

const initialColliderCenter = new THREE.Vector3();
firstCoin.collider.getCenter(initialColliderCenter);
assert(Math.abs(initialColliderCenter.z - (chunk.chunkZ + firstCoin.group.position.z)) < 0.05, 'Initial collider matches world Z position');

// Animate chunk over multiple frames and verify collider tracks moving mesh
let prevY = firstCoin.group.position.y;
let moved = false;
for (let step = 1; step <= 10; step++) {
  chunk.update(0.016, step * 0.016, 0);
  const currentColliderCenter = new THREE.Vector3();
  firstCoin.collider.getCenter(currentColliderCenter);

  assert(
    Math.abs(currentColliderCenter.y - firstCoin.group.position.y) < 1e-4,
    `Frame ${step}: World collider Y (${currentColliderCenter.y.toFixed(3)}m) synchronized exactly with animated mesh Y (${firstCoin.group.position.y.toFixed(3)}m)`
  );
  assert(
    Math.abs(currentColliderCenter.x - firstCoin.group.position.x) < 1e-4,
    `Frame ${step}: World collider X synchronized exactly with mesh X`
  );

  if (Math.abs(firstCoin.group.position.y - prevY) > 0.001) {
    moved = true;
  }
  prevY = firstCoin.group.position.y;
}
assert(moved, 'Coin smoothly executes floating bob animation without vertical stalling');

// --- Test 4: Parabolic Ballistic Jump Arc Alignment ---
console.log('\n--- Test 4: Parabolic Ballistic Jump Arc Alignment ---');
// Pattern 1 (OPENING_RUNWAY) has coin arc over Low Barrier at z=28m
const runwayPattern = OBSTACLE_PATTERNS.find(p => p.name === 'OPENING_RUNWAY')!;
const arcData = runwayPattern.collectibles.find(c => c.isArc)!;
assert(arcData !== undefined, 'Found parabolic coin arc in pattern');

const arcChunk = new TrackChunk(obstacleFactory, factory);
arcChunk.populate(runwayPattern, 0);

// Extract the arc coins
const arcCoins = arcChunk.collectibles.filter(c => c.lane === arcData.lane && c.initialLocalZ! <= -arcData.zOffset + 0.05 && c.initialLocalZ! >= -(arcData.zOffset + (arcData.count! - 1) * (arcData.spacing || 2.0)) - 0.05);
assert(arcCoins.length === arcData.count, `All ${arcData.count} arc coins successfully spawned`);

const firstArcCoin = arcCoins[0];
const apexArcCoin = arcCoins[Math.floor(arcCoins.length / 2)];
const lastArcCoin = arcCoins[arcCoins.length - 1];

assert(Math.abs(firstArcCoin.baseY - 0.85) < 0.05, `Arc takeoff coin starts at comfortable ground collection level: ${firstArcCoin.baseY.toFixed(2)}m (expected ~0.85m)`);
assert(Math.abs(lastArcCoin.baseY - 0.85) < 0.05, `Arc landing coin lands at ground collection level: ${lastArcCoin.baseY.toFixed(2)}m (expected ~0.85m)`);
assert(apexArcCoin.baseY >= 2.0 && apexArcCoin.baseY <= 2.65, `Arc apex coin peaks gracefully over hurdle: ${apexArcCoin.baseY.toFixed(2)}m (hurdle: 1.1m, jump apex: 3.15m)`);
assert(apexArcCoin.baseY > firstArcCoin.baseY, 'Arc exhibits true parabolic rise and fall');

// --- Test 5: Slide Clearance & Rooftop Positioning ---
console.log('\n--- Test 5: Slide Clearance & Rooftop Positioning ---');
// Check slide coins under high barrier
const slidePattern = OBSTACLE_PATTERNS.find(p => p.name === 'TUNNEL_SLIDE_CLEARANCE')!;
const slideChunk = new TrackChunk(obstacleFactory, factory);
slideChunk.populate(slidePattern, 0);

const slideCoin = slideChunk.collectibles.find(c => c.lane === 0 && c.baseY <= 0.7)!;
assert(slideCoin !== undefined, 'Slide coin trail spawned under overhead barrier');
assert(slideCoin.baseY <= 0.65 && slideCoin.baseY >= 0.50, `Slide coin positioned right in center of sliding player profile (0.55m - 0.65m): ${slideCoin.baseY}m`);

// Check train roof coins
const roofPattern = OBSTACLE_PATTERNS.find(p => p.name === 'TRAIN_ROOF_RAMP_RUN')!;
const roofChunk = new TrackChunk(obstacleFactory, factory);
roofChunk.populate(roofPattern, 0);

const roofCoins = roofChunk.collectibles.filter(c => c.baseY > 4.5);
assert(roofCoins.length > 0, `Train rooftop coins spawned (${roofCoins.length} coins)`);
assert(Math.abs(roofCoins[0].baseY - 5.2) < 0.1, `Train roof coin height (${roofCoins[0].baseY}m) matches runner torso level above 4.35m roof deck`);

// --- Test 6: Magnet Attraction Mechanics & Zero Vertical Snapping ---
console.log('\n--- Test 6: Magnet Attraction Mechanics & Zero Vertical Snapping ---');
const scene = new THREE.Scene();
const trackManager = new TrackManager(scene);
const player = new Player();

// Enable magnet on player
player.powerups.activate('MAGNET', 10.0);
assert(player.powerups.isMagnetActive(), 'Magnet active on player');

// Place player at z = -20, y = 0.9 (ground level)
player.position.set(0, 0.9, -20);
player.updateCollider();

// Find a coin in the scene ahead of the player within magnet radius (e.g. 8m ahead at z = -28)
let targetCoin: any = null;
let targetChunk: TrackChunk | null = null;
for (const ch of trackManager.chunks) {
  for (const col of ch.collectibles) {
    const worldZ = ch.chunkZ + col.group.position.z;
    if (col.type === 'COIN' && worldZ < player.position.z && worldZ > player.position.z - 10.0) {
      targetCoin = col;
      targetChunk = ch;
      break;
    }
  }
  if (targetCoin) break;
}

assert(targetCoin !== null, 'Target coin located within magnet reach ahead of player');

const initialCoinWorldY = targetCoin.group.position.y;
const initialCoinWorldZ = targetChunk!.chunkZ + targetCoin.group.position.z;

// Step simulation with magnet active
trackManager.update(player, 0.05, 1.0);

assert(targetCoin.isMagnetized === true, 'Target coin flagged as isMagnetized');
const magnetizedCoinY1 = targetCoin.group.position.y;
const magnetizedCoinZ1 = targetChunk!.chunkZ + targetCoin.group.position.z;

assert(magnetizedCoinZ1 > initialCoinWorldZ, `Magnet pulled coin along +Z toward oncoming player (${initialCoinWorldZ.toFixed(2)}m -> ${magnetizedCoinZ1.toFixed(2)}m)`);

// Step chunk update explicitly: verify ambient bobbing DOES NOT overwrite Y position
targetChunk!.update(0.05, 2.0, player.position.z);
assert(
  Math.abs(targetCoin.group.position.y - magnetizedCoinY1) < 1e-4,
  'Magnet-pulled coin does NOT snap back vertically to baseY on chunk update (smooth 3D flight preserved)'
);

// --- Test 7: Guaranteed Single Collection & Currency Awarding ---
console.log('\n--- Test 7: Guaranteed Single Collection & Currency Awarding ---');
player.powerups.reset(); // Clear magnet to test pure isolated collision
const bus = EventBus.getInstance();
let coinCollectedCount = 0;
const coinListener = () => { coinCollectedCount++; };
bus.on(EVENTS.COIN_COLLECTED, coinListener);

const initialCoins = coinCollectedCount;

// Isolate targetCoin by deactivating any other coins in active chunks
trackManager.chunks.forEach(ch => ch.collectibles.forEach(c => { if (c !== targetCoin) c.active = false; }));

// Place player directly on the target coin
const targetWorldZ = targetChunk!.chunkZ + targetCoin.group.position.z;
player.position.set(targetCoin.group.position.x, targetCoin.group.position.y, targetWorldZ);
player.updateCollider();

trackManager.update(player, 0.016, 2.1);

assert(targetCoin.active === false, 'Coin active flag flipped to false immediately upon collection');
assert(!targetChunk!.group.children.includes(targetCoin.group), 'Coin group removed from track chunk scene graph');
assert(coinCollectedCount === initialCoins + 1, `Coin collection event emitted exactly once (+1, got ${coinCollectedCount - initialCoins})`);

// Step again over same location: verify NO duplicate collection
trackManager.update(player, 0.016, 2.2);
assert(coinCollectedCount === initialCoins + 1, 'No duplicate coin collection event on subsequent frames');

bus.off(EVENTS.COIN_COLLECTED, coinListener);

// --- Test 8: High-Speed Swept Collision (No Missed Coins at 38 - 45 m/s) ---
console.log('\n--- Test 8: High-Speed Swept Collision (No Missed Coins at 38 - 45 m/s) ---');
trackManager.reset();
let sweptCoinCollected = 0;
const sweptListener = () => { sweptCoinCollected++; };
bus.on(EVENTS.COIN_COLLECTED, sweptListener);

// Find first coin in fresh track
const testChunk = trackManager.chunks[0];
const testCoin = testChunk.collectibles.find(c => c.active && c.type === 'COIN')!;
assert(testCoin !== undefined, 'Found fresh coin in Chunk 0');

const coinWorldZ = testChunk.chunkZ + testCoin.group.position.z;
const coinLaneX = testCoin.group.position.x;
const coinY = testCoin.group.position.y;

// Frame 0: Initialize position tracking 3.0m before coin (null previousPlayerZ)
player.position.set(coinLaneX, coinY, coinWorldZ + 3.0);
player.updateCollider();
trackManager.update(player, 0.016, 3.0);
assert(testCoin.active === true, 'Coin active when player is 3.0m away');

// Frame 1: Player moves to 1.5m BEFORE the coin
player.position.set(coinLaneX, coinY, coinWorldZ + 1.5);
player.updateCollider();
trackManager.update(player, 0.033, 3.033);
assert(testCoin.active === true, 'Player at 1.5m has not reached coin yet (active = true)');

// Frame 2: Player vaults 2.0m FORWARD in one high-speed step at 40m/s (now 0.8m PAST the coin)
// Discrete point test would miss the coin entirely (coin is at 0, player was at +1.2, now at -0.8)
player.position.set(coinLaneX, coinY, coinWorldZ - 0.8);
player.updateCollider();
trackManager.update(player, 0.033, 3.066);

assert(testCoin.active === false, 'Swept bounding box captured and collected coin despite discrete single-frame jump over it!');
assert(sweptCoinCollected === 1, 'Swept collection awarded coin exactly once at extreme game speed');

bus.off(EVENTS.COIN_COLLECTED, sweptListener);

// --- Test 9: Chunk Recycling & Dynamic Item Cleanup ---
console.log('\n--- Test 9: Chunk Recycling & Dynamic Item Cleanup ---');
const recycleChunk = new TrackChunk(obstacleFactory, factory);
recycleChunk.populate(runwayPattern, 0);
assert(recycleChunk.collectibles.length > 0, 'Chunk populated with collectibles');
assert(recycleChunk.obstacles.length > 0, 'Chunk populated with obstacles');

recycleChunk.clearDynamicItems();
assert(recycleChunk.collectibles.length === 0, 'All collectibles cleared on chunk recycling');
assert(recycleChunk.obstacles.length === 0, 'All obstacles cleared on chunk recycling');

// Re-populate and ensure clean state
recycleChunk.populate(runwayPattern, -80);
assert(recycleChunk.collectibles.length > 0, 'Chunk successfully re-populated after recycling');
assert(recycleChunk.chunkZ === -80, 'Chunk world coordinate aligned cleanly');

// --- Test 10: Collection VFX Pool Integrity ---
console.log('\n--- Test 10: Collection VFX Pool Integrity ---');
const vfxPool = factory.createPickupVFXPool(20);
assert(vfxPool.length === 20, 'VFX pool successfully pre-allocates 20 instances');
assert(vfxPool.every(v => v.active === false && v.group.visible === false), 'All pool instances initialized inactive and invisible');
assert(vfxPool.every(v => v.sparkles.length === 6), 'Every pickup burst has 6 sparkle diamond shards');
assert(vfxPool.every(v => v.maxAge === CONSTANTS.COIN_VFX_DURATION), `Pickup VFX maxAge matches CONSTANTS.COIN_VFX_DURATION (${CONSTANTS.COIN_VFX_DURATION}s)`);

console.log('\n=======================================================');
console.log(`🏆 ALL ${passedTests}/${totalTests} COIN VISUALS & COLLECTION TESTS PASSED!`);
console.log('=======================================================');
