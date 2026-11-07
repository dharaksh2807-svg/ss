import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { UNDERGROUND_METRO_THEME } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { UndergroundMetroEventDirector } from '../src/environment/worlds/undergroundMetro/UndergroundMetroEventDirector';
import { UndergroundMetroWorldBuilder } from '../src/environment/worlds/undergroundMetro/UndergroundMetroWorldBuilder';
import {
  UNDERGROUND_METRO_PALETTE,
  UNDERGROUND_METRO_DISTRICTS
} from '../src/environment/worlds/undergroundMetro/UndergroundMetroTheme';

console.log('🧪 Starting UNDERGROUND_METRO (The Living Subterranean Network) Verification Suite...\n');

let testsPassed = 0;
function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
  testsPassed++;
}

const director = UndergroundMetroEventDirector.getInstance();
const builder = UndergroundMetroWorldBuilder.getInstance();
const factory = SceneryFactory.getInstance();

// =========================================================================
// Suite 1: Theme Identity & Configuration
// =========================================================================
console.log('--- Suite 1: Theme Identity & Configuration ---');
const registry = EnvironmentRegistry.getInstance();
assert.ok(registry.has('UNDERGROUND_METRO'), 'UNDERGROUND_METRO is registered in EnvironmentRegistry');
const theme = registry.get('UNDERGROUND_METRO');
assert.strictEqual(theme.id, 'UNDERGROUND_METRO', 'Theme id is UNDERGROUND_METRO');
assert.strictEqual(theme.badgeEmoji, '🚇', 'Badge emoji is 🚇');
assert.strictEqual(theme.accentColor, '#38bdf8', 'Accent color is cyan/blue');
assert.strictEqual(UNDERGROUND_METRO_DISTRICTS.length, 6, '6 distinct subterranean districts defined');
pass('Theme identity, registry and district definitions verified');

// =========================================================================
// Suite 2: 6 Distinct Subterranean Families Across Endless Run
// =========================================================================
console.log('\n--- Suite 2: 6 Distinct Subterranean Families Across Endless Run ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  const chunkZ = -d * 80;
  builder.buildDistrictScenery(group, 12, 1.2, 80, 2000 + d, 'FULL', chunkZ);

  assert.ok(group.children.length > 0, `District ${d} builds decorative scenery`);
  const expectedDistrictDef = UNDERGROUND_METRO_DISTRICTS[d];
  pass(`District ${d} (${expectedDistrictDef.name}): ${expectedDistrictDef.theme}`);
}

// =========================================================================
// Suite 3: Playable Corridor Clearance Envelope (Zero Intrusions)
// =========================================================================
console.log('\n--- Suite 3: Playable Corridor Clearance Envelope (Zero Intrusions) ---');
// Envelope: |X| <= 4.2m below Y = 8.5m
for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  const chunkZ = -d * 80;
  builder.buildDistrictScenery(group, 12, 1.2, 80, 5555 + d, 'FULL', chunkZ);
  group.updateMatrixWorld(true);

  let intrusions = 0;
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(child);
      if (box.isEmpty()) return;

      const penetratesX = box.min.x < 4.2 && box.max.x > -4.2;
      const penetratesY = box.min.y < 8.5;

      // Ignore foundations/water strictly under tracks (Y <= 0.1)
      if (penetratesX && penetratesY && box.max.y > 0.1) {
        intrusions++;
      }
    }
  });

  assert.strictEqual(intrusions, 0, `District ${d} maintains 100% clear playable envelope (|X| <= 4.2m, Y <= 8.5m)`);
}
pass('All 6 districts strictly maintain 0 intrusions into runner corridor');

// =========================================================================
// Suite 4: Vaulted Ceiling & Overhead Headroom Invariant
// =========================================================================
console.log('\n--- Suite 4: Vaulted Ceiling & Overhead Headroom Invariant ---');

// Standard tunnel chunk (District 3)
const tunnelGroup = new THREE.Group();
builder.buildDistrictScenery(tunnelGroup, 12, 1.2, 80, 3333, 'FULL', -3 * 80);
tunnelGroup.updateMatrixWorld(true);

let tunnelMinCeilingY = 999;
tunnelGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    const centerX = (box.min.x + box.max.x) * 0.5;
    if (box.min.y >= 7.0 && Math.abs(centerX) <= 2.5) {
      tunnelMinCeilingY = Math.min(tunnelMinCeilingY, box.min.y);
    }
  }
});
assert.ok(tunnelMinCeilingY >= 9.0, `Standard tunnel ceiling provides >= 9.0m crown headroom (got ${tunnelMinCeilingY.toFixed(2)}m)`);
pass(`Standard running tunnel ceiling clearance verified at ${tunnelMinCeilingY.toFixed(2)}m`);

// Aerial corridor chunk
const aerialGroup = new THREE.Group();
builder.buildDistrictScenery(aerialGroup, 12, 1.2, 80, 4444, 'FULL', -4 * 80, 'NONE', true);
aerialGroup.updateMatrixWorld(true);

let aerialMinCeilingY = 999;
aerialGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    const centerX = (box.min.x + box.max.x) * 0.5;
    if (box.min.y >= 7.0 && Math.abs(centerX) <= 2.5) {
      aerialMinCeilingY = Math.min(aerialMinCeilingY, box.min.y);
    }
  }
});
assert.ok(aerialMinCeilingY >= 11.0, `Aerial corridor ceiling provides >= 11.0m clearance for jetpack flight (got ${aerialMinCeilingY.toFixed(2)}m)`);
pass(`Aerial corridor ceiling clearance verified at ${aerialMinCeilingY.toFixed(2)}m`);

// =========================================================================
// Suite 5: Continuous Structural Side Walls & Retaining Foundations
// =========================================================================
console.log('\n--- Suite 5: Continuous Structural Side Walls & Retaining Foundations ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  builder.buildDistrictScenery(group, 12, 1.2, 80, 1111 + d, 'FULL', -d * 80);
  group.updateMatrixWorld(true);

  let hasLeftWall = false;
  let hasRightWall = false;
  let hasFoundation = false;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(child);
      if (child.position.x <= -5.4 && box.max.y > 4.0) hasLeftWall = true;
      if (child.position.x >= 5.4 && box.max.y > 4.0) hasRightWall = true;
      if (box.min.y <= -5.0) hasFoundation = true;
    }
  });

  assert.ok(hasLeftWall, `District ${d} has structural left wall at |X| = 5.8m`);
  assert.ok(hasRightWall, `District ${d} has structural right wall at |X| = 5.8m`);
  assert.ok(hasFoundation, `District ${d} has retaining foundation down to Y = -5.85m`);
}
pass('Continuous structural side walls and retaining foundations verified across all 6 districts');

// =========================================================================
// Suite 6: Elevated Catwalk & Platform Tactile Strips
// =========================================================================
console.log('\n--- Suite 6: Elevated Catwalk & Platform Tactile Strips ---');

const platGroup = new THREE.Group();
builder.buildDistrictScenery(platGroup, 12, 1.2, 80, 2222, 'FULL', -80); // District 1: Neighborhood Platform
platGroup.updateMatrixWorld(true);

let hasCatwalk = false;
let hasPlatform = false;
let hasTactileStrip = false;

platGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (child.position.x <= -5.4 && box.min.y > 0.5 && box.max.y < 1.5) {
      hasCatwalk = true;
    }
    if (child.position.x >= 5.4 && box.min.y >= 0.0 && box.max.y <= 1.2) {
      hasPlatform = true;
    }
    if (child.geometry instanceof THREE.BoxGeometry &&
        child.geometry.parameters.width === 0.08 &&
        child.geometry.parameters.height === 0.04 &&
        box.min.y >= 0.95 && box.max.y <= 1.1) {
      hasTactileStrip = true;
    }
  }
});

assert.ok(hasCatwalk, 'Elevated emergency service catwalk is present on left wall');
assert.ok(hasPlatform, 'Passenger platform slab is present on right wall');
assert.ok(hasTactileStrip, 'Yellow tactile warning strip is installed along platform edge');
pass('Elevated catwalk, platform slab, and tactile warning strips verified');

// =========================================================================
// Suite 7: Hero Event A — The Grand Concourse Reveal (6-Stage Lifecycle)
// =========================================================================
console.log('\n--- Suite 7: Hero Event A — The Grand Concourse Reveal (6-Stage Lifecycle) ---');

director.reset();
const concourseScene = new THREE.Scene();
const concourseGroup = new THREE.Group();
concourseScene.add(concourseGroup);
builder.buildDistrictScenery(concourseGroup, 12, 1.2, 80, 7777, 'FULL', 0); // District 0

const grandEvents = director.getGrandConcourses();
assert.strictEqual(grandEvents.length, 1, 'Grand Concourse hero event registered');
const heroA = grandEvents[0];
assert.strictEqual(heroA.state, 'DORMANT', 'Initial state is DORMANT');

// Stage 1 -> 2: Player approaches trigger
director.update(0.1, true, 100); // 100m away
assert.strictEqual(heroA.state, 'ANTICIPATION', 'Transitions to ANTICIPATION on approach');

// Stage 2 -> 3: Anticipation timer elapses
director.update(1.5, true, 50);
assert.strictEqual(heroA.state, 'ACTION', 'Transitions to ACTION (train arrives with brake sparks)');
assert.ok(heroA.trainGroup.position.z < 40, 'Train moves forward along parallel track');

// Stage 3 -> 4: Train decelerates to stop
director.update(3.2, true, 20);
assert.strictEqual(heroA.state, 'CLIMAX', 'Transitions to CLIMAX at full stop');

// Stage 4: Doors open
director.update(1.0, true, 10);
assert.ok(heroA.trainDoors[0].openAmount > 0.5, 'Automatic train doors open in CLIMAX');

// Stage 4 -> 5: Aftermath
director.update(2.0, true, 0);
assert.strictEqual(heroA.state, 'AFTERMATH', 'Transitions to AFTERMATH (doors seal, train departs)');

// Stage 5 -> 6: Complete
director.update(4.5, true, -50);
assert.strictEqual(heroA.state, 'COMPLETE', 'Transitions to COMPLETE after smooth departure');
pass('Hero Event A: The Grand Concourse Reveal completed all 6 lifecycle stages cleanly');

// =========================================================================
// Suite 8: Hero Event B — Power Restoration (6-Stage Lifecycle)
// =========================================================================
console.log('\n--- Suite 8: Hero Event B — Power Restoration (6-Stage Lifecycle) ---');

director.reset();
const utilScene = new THREE.Scene();
const utilDistrictGroup = new THREE.Group();
utilScene.add(utilDistrictGroup);
builder.buildDistrictScenery(utilDistrictGroup, 12, 1.2, 80, 8888, 'FULL', -4 * 80); // District 4

const powerEvents = director.getPowerRestorations();
assert.strictEqual(powerEvents.length, 1, 'Power Restoration hero event registered');
const heroB = powerEvents[0];
assert.strictEqual(heroB.state, 'DORMANT', 'Initial state is DORMANT');

// Stage 1 -> 2: Anticipation
director.update(0.1, true, heroB.triggerZ + 100);
assert.strictEqual(heroB.state, 'ANTICIPATION', 'Transitions to ANTICIPATION');

// Stage 2 -> 3: Action (Relay ignition cascade)
director.update(1.2, true, heroB.triggerZ + 60);
assert.strictEqual(heroB.state, 'ACTION', 'Transitions to ACTION (power level ramps)');
assert.ok(heroB.powerLevel > 0, 'Power level ramps up');

// Stage 3 -> 4: Climax (Full power, gates open, turbines max RPM)
director.update(2.5, true, heroB.triggerZ + 20);
assert.strictEqual(heroB.state, 'CLIMAX', 'Transitions to CLIMAX (100% illumination, gates open)');
assert.ok(heroB.exhaustTurbines[0].rpm >= 20.0, 'Turbine fans reach full RPM');

// Stage 4 -> 5: Aftermath
director.update(2.2, true, heroB.triggerZ);
assert.strictEqual(heroB.state, 'AFTERMATH', 'Transitions to AFTERMATH');

// Stage 5 -> 6: Complete
director.update(2.5, true, heroB.triggerZ - 40);
assert.strictEqual(heroB.state, 'COMPLETE', 'Transitions to COMPLETE');
pass('Hero Event B: Power Restoration completed all 6 lifecycle stages cleanly');

// =========================================================================
// Suite 9: Kinetic Ambient Actors
// =========================================================================
console.log('\n--- Suite 9: Kinetic Ambient Actors ---');

director.reset();
const animScene = new THREE.Scene();
for (let d = 0; d < 6; d++) {
  const g = new THREE.Group();
  animScene.add(g);
  builder.buildDistrictScenery(g, 12, 1.2, 80, 1000 + d, 'FULL', -d * 80);
}

assert.ok(director.getFanCount() > 0, 'Ventilation exhaust fan actors registered');
assert.ok(director.getEscalatorCount() > 0, 'Motorized escalator actors registered');
assert.ok(director.getCommuterCount() > 0, 'Platform commuter actors registered');

// Run 10 animation frames
for (let f = 0; f < 10; f++) {
  director.update(0.016, true, -f * 10);
}
pass('All kinetic ambient actors (fans, escalators, commuters, lights) animate without errors');

// =========================================================================
// Suite 10: Graphics Quality Presets
// =========================================================================
console.log('\n--- Suite 10: Graphics Quality Presets ---');

function countMeshes(detail: 'FULL' | 'BALANCED' | 'MINIMAL'): number {
  const g = new THREE.Group();
  builder.buildDistrictScenery(g, 12, 1.2, 80, 9999, detail, -80);
  let count = 0;
  g.traverse((c) => {
    if (c instanceof THREE.Mesh) count++;
  });
  return count;
}

const fullMeshes = countMeshes('FULL');
const balancedMeshes = countMeshes('BALANCED');
const minimalMeshes = countMeshes('MINIMAL');

assert.ok(fullMeshes > balancedMeshes, `FULL (${fullMeshes}) has more detail than BALANCED (${balancedMeshes})`);
assert.ok(balancedMeshes > minimalMeshes, `BALANCED (${balancedMeshes}) has more detail than MINIMAL (${minimalMeshes})`);
assert.ok(minimalMeshes >= 30, `MINIMAL (${minimalMeshes}) retains essential structural tunnel envelope`);
pass(`Graphics scalability verified: FULL (${fullMeshes}) > BALANCED (${balancedMeshes}) > MINIMAL (${minimalMeshes})`);

// =========================================================================
// Suite 11: Monumental Portal Gateway & Warning Beacons
// =========================================================================
console.log('\n--- Suite 11: Monumental Portal Gateway & Warning Beacons ---');

const portalGroup = new THREE.Group();
builder.buildSubwayPortalArch(portalGroup, 0, 'ENTRY', 10.6);
portalGroup.updateMatrixWorld(true);

let hasPylons = false;
let hasBeacons = false;

portalGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (box.max.y > 10.0 && Math.abs(child.position.x) > 6.0) hasPylons = true;
    if (child.geometry instanceof THREE.SphereGeometry && child.geometry.parameters.radius === 0.25) {
      hasBeacons = true;
    }
  }
});

assert.ok(hasPylons, 'Monumental reinforced concrete pylons flank portal mouth');
assert.ok(hasBeacons, 'Illuminated red clearance warning beacons mounted on portal beam');
pass('Portal gateway structural pylons and warning beacons verified');

// =========================================================================
// Suite 12: Memory Hygiene & Detachment Pruning
// =========================================================================
console.log('\n--- Suite 12: Memory Hygiene & Detachment Pruning ---');

director.reset();
const testScene = new THREE.Scene();
const attachedChunk = new THREE.Group();
testScene.add(attachedChunk);
builder.buildDistrictScenery(attachedChunk, 12, 1.2, 80, 5000, 'FULL', 0);

const detachedChunk = new THREE.Group();
// Not added to testScene
builder.buildDistrictScenery(detachedChunk, 12, 1.2, 80, 5001, 'FULL', -80);

const totalBefore = director.getTotalActiveElements();
assert.ok(totalBefore > 0, 'Actors registered from both chunks');

// Prune detached actors
director.pruneDetached();
const totalAfter = director.getTotalActiveElements();
assert.ok(totalAfter < totalBefore, 'Detached actors pruned successfully');

director.reset();
assert.strictEqual(director.getTotalActiveElements(), 0, 'Reset clears all active references cleanly');
pass('Memory hygiene and scene-rooted detachment pruning verified');

console.log(`\n=======================================================`);
console.log(`🏆 ALL 12/12 UNDERGROUND METRO TEST SUITES PASSED! (${testsPassed} assertions verified)`);
console.log(`=======================================================\n`);
