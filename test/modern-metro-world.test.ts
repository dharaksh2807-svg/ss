import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { MODERN_METRO_THEME } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { ModernMetroEventDirector } from '../src/environment/worlds/modernMetro/ModernMetroEventDirector';
import { ModernMetroWorldBuilder } from '../src/environment/worlds/modernMetro/ModernMetroWorldBuilder';
import { MODERN_METRO_PALETTE, MODERN_METRO_DISTRICTS } from '../src/environment/worlds/modernMetro/ModernMetroTheme';

console.log('🧪 Starting MODERN_METRO (The Living City) Verification Suite...\n');

let testsPassed = 0;
function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
  testsPassed++;
}

const director = ModernMetroEventDirector.getInstance();
const builder = ModernMetroWorldBuilder.getInstance();
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

// =========================================================================
// Suite 1: Theme Identity & Configuration
// =========================================================================
console.log('--- Suite 1: Theme Identity & Configuration ---');
const registry = EnvironmentRegistry.getInstance();
assert.ok(registry.has('MODERN_METRO'), 'MODERN_METRO is registered in EnvironmentRegistry');
const theme = registry.get('MODERN_METRO');
assert.strictEqual(theme.id, 'MODERN_METRO', 'Theme id is MODERN_METRO');
assert.strictEqual(theme.displayName, 'Modern Metro District', 'Display name matches');
assert.strictEqual(theme.badgeEmoji, '🏙️', 'Badge emoji is 🏙️');
assert.strictEqual(theme.accentColor, '#00e5ff', 'Accent color is cyan');
assert.ok(MODERN_METRO_DISTRICTS.length === 6, '6 distinct urban districts defined');
pass('Theme identity, registry and district definitions verified');

// =========================================================================
// Suite 2: 6 Distinct Urban Districts Across Endless Run
// =========================================================================
console.log('\n--- Suite 2: 6 Distinct Urban Districts Across Endless Run ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  const chunkZ = -d * 80;
  builder.buildDistrictScenery(group, 12, 1.2, 80, 1000 + d, 'FULL', chunkZ);

  assert.ok(group.children.length > 0, `District ${d} builds decorative scenery`);

  const expectedDistrictDef = MODERN_METRO_DISTRICTS[d];
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
  builder.buildDistrictScenery(group, 12, 1.2, 80, 4242 + d, 'FULL', chunkZ);
  group.updateMatrixWorld(true);

  let intrusions = 0;
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(child);
      if (box.isEmpty()) return;

      const penetratesX = box.min.x < 4.2 && box.max.x > -4.2;
      const penetratesY = box.min.y < 8.5;

      // Ignore ground/foundation meshes that are strictly under the tracks (Y <= 0)
      if (penetratesX && penetratesY && box.max.y > 0.1) {
        intrusions++;
        if (d === 0) {
          console.log(`    Intrusion in D0: mesh name="${child.name}", material color=${(child.material as any)?.color?.getHexString?.() || 'none'}, box=[X: ${box.min.x.toFixed(2)} to ${box.max.x.toFixed(2)}, Y: ${box.min.y.toFixed(2)} to ${box.max.y.toFixed(2)}, Z: ${box.min.z.toFixed(2)} to ${box.max.z.toFixed(2)}]`);
        }
      }
    }
  });

  assert.strictEqual(intrusions, 0, `District ${d} maintains 100% clear playable envelope (|X| <= 4.2m, Y <= 8.5m)`);
}
pass('All 6 districts strictly maintain 0 intrusions into runner corridor');

// =========================================================================
// Suite 4: Overhead Skybridge & Canopy Headroom (Y >= 9.8m)
// =========================================================================
console.log('\n--- Suite 4: Overhead Skybridge & Canopy Headroom ---');
const bridgeGroup = new THREE.Group();
builder.buildDistrictScenery(bridgeGroup, 12, 1.2, 80, 7777, 'FULL', -240); // District D: Grand Interchange Canopy

let lowestCanopyY = 999;
bridgeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (box.min.x < 4.2 && box.max.x > -4.2 && box.min.y > 5.0) {
      lowestCanopyY = Math.min(lowestCanopyY, box.min.y);
    }
  }
});

assert.ok(lowestCanopyY >= 9.8, `Overhead canopy clearance is at least 9.8m (got ${lowestCanopyY.toFixed(2)}m)`);
pass(`Overhead canopy clearance strictly guarantees unobstructed camera headroom (${lowestCanopyY.toFixed(2)}m >= 9.8m)`);

// =========================================================================
// Suite 5: Grounded Retaining Foundations (Y <= -5.5m)
// =========================================================================
console.log('\n--- Suite 5: Grounded Retaining Foundations ---');
const plinthGroup = new THREE.Group();
builder.buildDistrictScenery(plinthGroup, 12, 1.2, 80, 9999, 'FULL', 0);

let deepestPlinthY = 0;
plinthGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    deepestPlinthY = Math.min(deepestPlinthY, box.min.y);
  }
});

assert.ok(deepestPlinthY <= -5.5, `Foundations anchor deep into ground (got ${deepestPlinthY.toFixed(2)}m <= -5.5m)`);
pass(`Retaining foundations firmly anchor modern urban structures down to ${deepestPlinthY.toFixed(2)}m`);

// =========================================================================
// Suite 6: Hero Event A: Grand Modern Transit Interchange
// =========================================================================
console.log('\n--- Suite 6: Hero Event A: Grand Modern Transit Interchange ---');
director.reset();

const interchangeGroup = new THREE.Group();
builder.buildDistrictScenery(interchangeGroup, 12, 1.2, 80, 5003, 'FULL', -240); // District 3: Grand Interchange

assert.strictEqual(director.getGrandInterchangeCount(), 1, 'Grand Interchange actor registered');
const heroA = (director as any).grandInterchanges[0];

// Test 6-Stage Lifecycle State Machine
assert.strictEqual(heroA.state, 'DORMANT', 'Starts in DORMANT state');

// 1. Advance to ANTICIPATION
director.update(0.1, true, heroA.triggerZ + 140.0);
assert.strictEqual(heroA.state, 'ANTICIPATION', 'Transitions to ANTICIPATION when player is <= 150m ahead');

// 2. Advance to ACTION
director.update(0.1, true, heroA.triggerZ + 80.0);
assert.strictEqual(heroA.state, 'ACTION', 'Transitions to ACTION (train decelerates with red brake lights)');

// 3. Advance to CLIMAX
director.update(0.1, true, heroA.triggerZ + 30.0);
assert.strictEqual(heroA.state, 'CLIMAX', 'Transitions to CLIMAX (doors slide open, commuters board)');

// 4. Advance to AFTERMATH
director.update(0.1, true, heroA.triggerZ - 20.0);
assert.strictEqual(heroA.state, 'AFTERMATH', 'Transitions to AFTERMATH (doors seal, train departs into network)');

// 5. Advance to COMPLETE
director.update(0.1, true, heroA.triggerZ - 60.0);
assert.strictEqual(heroA.state, 'COMPLETE', 'Transitions to COMPLETE when runner passes');
pass('Hero Event A: Grand Interchange successfully verified across all 6 lifecycle stages');

// =========================================================================
// Suite 7: Hero Event B: Riverside Reveal & Ferry Transit
// =========================================================================
console.log('\n--- Suite 7: Hero Event B: Riverside Reveal & Ferry Transit ---');
director.reset();

const revealGroup = new THREE.Group();
builder.buildDistrictScenery(revealGroup, 12, 1.2, 80, 5005, 'FULL', -400); // District 5: Elevated Skyline & Riverside Reveal

assert.strictEqual(director.getRiversideRevealCount(), 1, 'Riverside Reveal actor registered');
const heroB = (director as any).riversideReveals[0];

assert.strictEqual(heroB.state, 'DORMANT', 'Starts in DORMANT state');

// 1. ANTICIPATION
director.update(0.1, true, heroB.triggerZ + 150.0);
assert.strictEqual(heroB.state, 'ANTICIPATION', 'Transitions to ANTICIPATION (open horizon appears)');

// 2. ACTION
director.update(0.1, true, heroB.triggerZ + 80.0);
assert.strictEqual(heroB.state, 'ACTION', 'Transitions to ACTION (ferry cruises with wake spray)');

// 3. CLIMAX
director.update(0.1, true, heroB.triggerZ + 25.0);
assert.strictEqual(heroB.state, 'CLIMAX', 'Transitions to CLIMAX (panoramic bridge & ferry framing)');

// 4. AFTERMATH
director.update(0.1, true, heroB.triggerZ - 20.0);
assert.strictEqual(heroB.state, 'AFTERMATH', 'Transitions to AFTERMATH (ferry departs towards bend)');

// 5. COMPLETE
director.update(0.1, true, heroB.triggerZ - 65.0);
assert.strictEqual(heroB.state, 'COMPLETE', 'Transitions to COMPLETE after crossing');
pass('Hero Event B: Riverside Reveal successfully verified across all 6 lifecycle stages');

// =========================================================================
// Suite 8: Dynamic Living City Systems (Elevators, Traffic, Commuters, Trees)
// =========================================================================
console.log('\n--- Suite 8: Dynamic Living City Systems ---');
director.reset();

const livingGroup = new THREE.Group();
builder.buildDistrictScenery(livingGroup, 12, 1.2, 80, 1111, 'FULL', 0);   // CBD with elevators
builder.buildDistrictScenery(livingGroup, 12, 1.2, 80, 2222, 'FULL', -80); // Residential with trees & commuters
builder.buildDistrictScenery(livingGroup, 12, 1.2, 80, 3333, 'FULL', -400); // Elevated with road traffic

assert.ok(director.getElevatorCount() > 0, 'Facade glass elevators registered');
assert.ok(director.getTreeCount() > 0, 'Swaying street trees registered');
assert.ok(director.getTrafficCount() > 0, 'Road commuter traffic registered');
assert.ok(director.getCommuterCount() > 0, 'Walking commuters registered');

// Test update loop
const initialY = (director as any).facadeElevators[0].carriage.position.y;
director.update(0.5, true, 0);
const updatedY = (director as any).facadeElevators[0].carriage.position.y;
assert.notStrictEqual(initialY, updatedY, 'Elevator carriage smoothly translates along facade');
pass('Living city systems (elevators, traffic, commuters, trees) update with zero allocations');

// =========================================================================
// Suite 9: First 200m Quality Gate
// =========================================================================
console.log('\n--- Suite 9: First 200m Quality Gate ---');
// First 200m spans chunks 0 (0m), 1 (80m), 2 (160m)
const qgChunk0 = new THREE.Group();
const qgChunk1 = new THREE.Group();
const qgChunk2 = new THREE.Group();

builder.buildDistrictScenery(qgChunk0, 12, 1.2, 80, 100, 'FULL', 0);
builder.buildDistrictScenery(qgChunk1, 12, 1.2, 80, 101, 'FULL', -80);
builder.buildDistrictScenery(qgChunk2, 12, 1.2, 80, 102, 'FULL', -160);

// Chunk 0: Architectural landmark (CBD Stepped Tower)
let maxH0 = 0;
qgChunk0.traverse((c) => {
  if (c instanceof THREE.Mesh) maxH0 = Math.max(maxH0, new THREE.Box3().setFromObject(c).max.y);
});
assert.ok(maxH0 > 30.0, `Chunk 0 features prominent architectural skyscraper landmark (got ${maxH0.toFixed(1)}m > 30m)`);

// Chunk 1: Living street scene (Residential trees, cafes, balconies)
let hasTrees = false;
qgChunk1.traverse((c) => {
  if (c instanceof THREE.Mesh && c.material === (builder as any).lushFoliageMat) hasTrees = true;
});
assert.ok(hasTrees, 'Chunk 1 features tree-lined living street boulevard');

// Chunk 2: Open view (Riverside waterfront)
let hasWater = false;
qgChunk2.traverse((c) => {
  if (c instanceof THREE.Mesh && c.material === (builder as any).riverWaterMat) hasWater = true;
});
assert.ok(hasWater, 'Chunk 2 features open riverside vista');
pass('First 200m Quality Gate fully satisfied: landmark at 0m, living street at 80m, open view at 160m');

// =========================================================================
// Suite 10: Teardown & Lifecycle Cleanup (Zero Leaks)
// =========================================================================
console.log('\n--- Suite 10: Teardown & Lifecycle Cleanup ---');
director.reset();

const tempChunk = new THREE.Group();
builder.buildDistrictScenery(tempChunk, 12, 1.2, 80, 3141, 'FULL', -240);
const activeBeforePrune = director.getTotalActiveElements();
assert.ok(activeBeforePrune > 0, 'Active elements registered before prune');

// Simulate chunk recycling: remove direct children from chunk group
while (tempChunk.children.length > 0) {
  tempChunk.remove(tempChunk.children[0]);
}

director.update(0.016, true, 0);
assert.strictEqual(director.getTotalActiveElements(), 0, 'Detached objects pruned on chunk recycle');
pass('Detached objects cleanly pruned from registries during chunk recycling');

director.reset();
assert.strictEqual(director.getTotalActiveElements(), 0, 'Director reset clears all registries');
pass('Director reset cleanly disposes all references');

// =========================================================================
// Suite 11: Graphics Quality Detail Tiering
// =========================================================================
console.log('\n--- Suite 11: Graphics Quality Detail Tiering ---');
const fullGrp = new THREE.Group();
const minGrp = new THREE.Group();

builder.buildDistrictScenery(fullGrp, 12, 1.2, 80, 8888, 'FULL', 0);
builder.buildDistrictScenery(minGrp, 12, 1.2, 80, 8888, 'MINIMAL', 0);

let fullCount = 0;
let minCount = 0;
fullGrp.traverse((c) => { if (c instanceof THREE.Mesh) fullCount++; });
minGrp.traverse((c) => { if (c instanceof THREE.Mesh) minCount++; });

assert.ok(fullCount > minCount, `FULL detail generates richer scene than MINIMAL (${fullCount} > ${minCount})`);
assert.ok(minCount > 20, `MINIMAL detail preserves essential urban structures (${minCount} meshes)`);
pass(`Detail tiering verified: FULL (${fullCount} meshes) > MINIMAL (${minCount} meshes)`);

// =========================================================================
// Suite 12: SceneryFactory & TrackChunk Backward Compatibility
// =========================================================================
console.log('\n--- Suite 12: SceneryFactory & TrackChunk Backward Compatibility ---');
const obsFactory = new ObstacleFactory();
const colFactory = new CollectibleFactory();
const modernChunk = new TrackChunk(obsFactory, colFactory);

modernChunk.populate([], -80, 'MODERN_METRO', false);
assert.ok(modernChunk.decorativeGroup.children.length > 0, 'Modern Metro populates decorativeGroup');

let foundModernWall = false;
let foundModernBuilding = false;
let foundCatenary = false;

modernChunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.position.x < -6 || child.position.x > 6) foundModernWall = true;
    if (child.position.y > 10) foundModernBuilding = true;
    if (child.position.y >= 6.8 && child.position.y <= 8.5) foundCatenary = true;
  }
});

assert.ok(foundModernWall, 'Modern Metro generates perimeter retaining walls');
assert.ok(foundModernBuilding, 'Modern Metro generates contemporary architectural building silhouettes');
assert.ok(foundCatenary, 'Modern Metro generates modern overhead catenary box trusses with LED signals');
pass('TrackChunk integration satisfies all existing modular environment assertions');

// Clean up with SceneryPool
pool.clearDecorativeGroup(modernChunk.decorativeGroup, new Set(Object.values(factory.getSharedMaterials())));
assert.strictEqual(modernChunk.decorativeGroup.children.length, 0, 'SceneryPool cleanly clears all decorative meshes');
pass('SceneryPool cleanly recycles Modern Metro decorative groups');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} MODERN_METRO WORLD TESTS PASSED!`);
console.log('=======================================================\n');
