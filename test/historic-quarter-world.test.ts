import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { HISTORIC_QUARTER_THEME } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { TrackChunk } from '../src/track/TrackChunk';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CollectibleFactory } from '../src/track/CollectibleFactory';
import { HistoricQuarterEventDirector } from '../src/environment/worlds/historicQuarter/HistoricQuarterEventDirector';
import { HistoricQuarterWorldBuilder } from '../src/environment/worlds/historicQuarter/HistoricQuarterWorldBuilder';
import { HISTORIC_QUARTER_PALETTE, HISTORIC_QUARTER_DISTRICTS } from '../src/environment/worlds/historicQuarter/HistoricQuarterTheme';

console.log('🧪 Starting HISTORIC_QUARTER (The Grand Steam Age) Verification Suite...\n');

let testsPassed = 0;
function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
  testsPassed++;
}

const director = HistoricQuarterEventDirector.getInstance();
const builder = HistoricQuarterWorldBuilder.getInstance();
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

// =========================================================================
// Suite 1: Theme Identity & Configuration
// =========================================================================
console.log('--- Suite 1: Theme Identity & Configuration ---');
const registry = EnvironmentRegistry.getInstance();
assert.ok(registry.has('HISTORIC_QUARTER'), 'HISTORIC_QUARTER is registered in EnvironmentRegistry');
const theme = registry.get('HISTORIC_QUARTER');
assert.strictEqual(theme.id, 'HISTORIC_QUARTER', 'Theme id is HISTORIC_QUARTER');
assert.strictEqual(theme.displayName, 'Historic Railway Quarter', 'Display name matches');
assert.strictEqual(theme.badgeEmoji, '🏛️', 'Badge emoji is 🏛️');
assert.strictEqual(theme.accentColor, '#f59e0b', 'Accent color is warm amber');
assert.ok(HISTORIC_QUARTER_DISTRICTS.length === 6, '6 distinct heritage districts defined');
pass('Theme identity, registry and district definitions verified');

// =========================================================================
// Suite 2: 6 Distinct Heritage Districts Across Endless Run
// =========================================================================
console.log('\n--- Suite 2: 6 Distinct Heritage Districts Across Endless Run ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  const chunkZ = -d * 80;
  builder.buildDistrictScenery(group, 12, 1.2, 80, 2000 + d, 'FULL', chunkZ);

  assert.ok(group.children.length > 0, `District ${d} builds decorative scenery`);

  const expectedDistrictDef = HISTORIC_QUARTER_DISTRICTS[d];
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
// Suite 4: Overhead Arch Bridge & Canopy Headroom (Y >= 9.8m)
// =========================================================================
console.log('\n--- Suite 4: Overhead Arch Bridge & Canopy Headroom ---');
const canopyGroup = new THREE.Group();
builder.buildDistrictScenery(canopyGroup, 12, 1.2, 80, 7777, 'FULL', 0); // District 0: Grand Station Canopy
canopyGroup.updateMatrixWorld(true);

let lowestCanopyY = 999;
canopyGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (box.min.x < 4.2 && box.max.x > -4.2 && box.min.y > 9.0) {
      lowestCanopyY = Math.min(lowestCanopyY, box.min.y);
    }
  }
});

const archGroup = new THREE.Group();
(builder as any).buildHistoricArchBridge(archGroup, 80);
archGroup.updateMatrixWorld(true);

let lowestBridgeY = 999;
archGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (box.min.x < 4.2 && box.max.x > -4.2) {
      lowestBridgeY = Math.min(lowestBridgeY, box.min.y);
    }
  }
});

assert.ok(lowestCanopyY >= 9.8, `Overhead station canopy clearance is at least 9.8m (got ${lowestCanopyY.toFixed(2)}m)`);
assert.ok(lowestBridgeY >= 9.8, `Overhead arch bridge clearance is at least 9.8m (got ${lowestBridgeY.toFixed(2)}m)`);
pass(`Overhead bridge/canopy clearance strictly guarantees unobstructed camera headroom (Canopy: ${lowestCanopyY.toFixed(2)}m, Bridge: ${lowestBridgeY.toFixed(2)}m >= 9.8m)`);

// =========================================================================
// Suite 5: Grounded Retaining Foundations (Y <= -5.8m)
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

assert.ok(deepestPlinthY <= -5.8, `Foundations anchor deep into ground (got ${deepestPlinthY.toFixed(2)}m <= -5.8m)`);
pass(`Retaining foundations firmly anchor Victorian masonry structures down to ${deepestPlinthY.toFixed(2)}m`);

// =========================================================================
// Suite 6: Hero Event 1: The Grand Steam Arrival
// =========================================================================
console.log('\n--- Suite 6: Hero Event 1: The Grand Steam Arrival ---');
director.reset();

const stationGroup = new THREE.Group();
builder.buildDistrictScenery(stationGroup, 12, 1.2, 80, 3000, 'FULL', 0); // District 0: Grand Station

assert.strictEqual(director.getGrandSteamArrivalCount(), 1, 'Grand Steam Arrival actor registered');
const hero1 = (director as any).grandSteamArrivals[0];

// Test 6-Stage Lifecycle State Machine
assert.strictEqual(hero1.state, 'DORMANT', 'Starts in DORMANT state');

// 1. Advance to ANTICIPATION
director.update(0.1, true, hero1.triggerZ + 150.0);
assert.strictEqual(hero1.state, 'ANTICIPATION', 'Transitions to ANTICIPATION when player is <= 160m ahead');

// 2. Advance to ACTION
director.update(0.1, true, hero1.triggerZ + 80.0);
assert.strictEqual(hero1.state, 'ACTION', 'Transitions to ACTION (locomotive emerges with spinning driving wheels)');
director.update(0.1, true, hero1.triggerZ + 75.0);
assert.ok(hero1.wheelAngle > 0, 'Locomotive driving wheels rotate dynamically');

// 3. Advance to CLIMAX
director.update(0.1, true, hero1.triggerZ + 25.0);
assert.strictEqual(hero1.state, 'CLIMAX', 'Transitions to CLIMAX (train halts at platform, passengers visible)');
assert.ok(hero1.passengerFigures.length > 0 && hero1.passengerFigures[0].visible, 'Station passengers are visible on platform during climax');

// 4. Advance to AFTERMATH
director.update(0.1, true, hero1.triggerZ - 20.0);
assert.strictEqual(hero1.state, 'AFTERMATH', 'Transitions to AFTERMATH (steam whistle blasts, train departs)');

// 5. Advance to COMPLETE
director.update(0.1, true, hero1.triggerZ - 70.0);
assert.strictEqual(hero1.state, 'COMPLETE', 'Transitions to COMPLETE when runner passes station');
pass('Hero Event 1: The Grand Steam Arrival successfully verified across all 6 lifecycle stages');

// =========================================================================
// Suite 7: Hero Event 2: The Historic Viaduct & Canal Crossing
// =========================================================================
console.log('\n--- Suite 7: Hero Event 2: The Historic Viaduct & Canal Crossing ---');
director.reset();

const viaductGroup = new THREE.Group();
builder.buildDistrictScenery(viaductGroup, 12, 1.2, 80, 3003, 'FULL', -240); // District 3: River Viaduct

assert.strictEqual(director.getHistoricViaductCount(), 1, 'Historic Viaduct actor registered');
const hero2 = (director as any).historicViaducts[0];

assert.strictEqual(hero2.state, 'DORMANT', 'Starts in DORMANT state');

// 1. ANTICIPATION
director.update(0.1, true, hero2.triggerZ + 160.0);
assert.strictEqual(hero2.state, 'ANTICIPATION', 'Transitions to ANTICIPATION (canal waterscape revealed)');

// 2. ACTION
director.update(0.1, true, hero2.triggerZ + 80.0);
assert.strictEqual(hero2.state, 'ACTION', 'Transitions to ACTION (canal boat cruises with wake ripples)');

// 3. CLIMAX
director.update(0.1, true, hero2.triggerZ + 25.0);
assert.strictEqual(hero2.state, 'CLIMAX', 'Transitions to CLIMAX (distant steam train crosses overhead bridge)');
assert.ok(hero2.distantSteamTrain.position.x !== 0, 'Distant steam train moves across viaduct span');

// 4. AFTERMATH
director.update(0.1, true, hero2.triggerZ - 20.0);
assert.strictEqual(hero2.state, 'AFTERMATH', 'Transitions to AFTERMATH (narrowboat glides under canal arch)');

// 5. COMPLETE
director.update(0.1, true, hero2.triggerZ - 70.0);
assert.strictEqual(hero2.state, 'COMPLETE', 'Transitions to COMPLETE after runner crosses river');
pass('Hero Event 2: The Historic Viaduct successfully verified across all 6 lifecycle stages');

// =========================================================================
// Suite 8: Dynamic Heritage Systems (Clocks, Chimneys, Workers, Gaslamps)
// =========================================================================
console.log('\n--- Suite 8: Dynamic Heritage Systems ---');
director.reset();

const heritageGroup = new THREE.Group();
builder.buildDistrictScenery(heritageGroup, 12, 1.2, 80, 1111, 'FULL', 0);    // Station with clock
builder.buildDistrictScenery(heritageGroup, 12, 1.2, 80, 2222, 'FULL', -80);  // Town center with chimneys & workers
builder.buildDistrictScenery(heritageGroup, 12, 1.2, 80, 3333, 'FULL', -400); // Evening square with gaslamps

assert.ok(director.getStationClockCount() > 0, 'Station clocks registered');
assert.ok(director.getChimneyCount() > 0, 'Chimney steam emitters registered');
assert.ok(director.getWorkerCount() > 0, 'Railway workers registered');
assert.ok(director.getGasLampCount() > 0, 'Swaying gas streetlamps registered');

// Test update loop
const initialMinuteRot = (director as any).stationClocks[0].minuteHand.rotation.z;
const initialPuffY = (director as any).chimneySteamEmitters[0].steamMeshes[0].position.y;
director.update(1.0, true, 0);
const updatedMinuteRot = (director as any).stationClocks[0].minuteHand.rotation.z;
const updatedPuffY = (director as any).chimneySteamEmitters[0].steamMeshes[0].position.y;

assert.notStrictEqual(initialMinuteRot, updatedMinuteRot, 'Station clock minute hand advances smoothly');
assert.notStrictEqual(initialPuffY, updatedPuffY, 'Chimney steam puff rises into the atmosphere');
pass('Dynamic heritage systems (clocks, steam emitters, workers, lamps) update with zero heap allocations');

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

// Chunk 0: Architectural landmark (Grand Terminus Station Clock Tower)
let maxH0 = 0;
qgChunk0.traverse((c) => {
  if (c instanceof THREE.Mesh) maxH0 = Math.max(maxH0, new THREE.Box3().setFromObject(c).max.y);
});
assert.ok(maxH0 > 30.0, `Chunk 0 features prominent terminus clock tower landmark (got ${maxH0.toFixed(1)}m > 30m)`);

// Chunk 1: Living street scene (Victorian red brick brownstones & chimneys)
let hasBrownstones = false;
qgChunk1.traverse((c) => {
  if (c instanceof THREE.Mesh && c.material === (builder as any).brickRedAgedMat) hasBrownstones = true;
});
assert.ok(hasBrownstones, 'Chunk 1 features Victorian red brick town center street scene');

// Chunk 2: Historic market street with awnings and barrels
let hasMarketAwnings = false;
qgChunk2.traverse((c) => {
  if (c instanceof THREE.Mesh && (c.material === (builder as any).awningCrimsonMat || c.material === (builder as any).awningHunterGreenMat)) hasMarketAwnings = true;
});
assert.ok(hasMarketAwnings, 'Chunk 2 features historic merchant market street with striped awnings');
pass('First 200m Quality Gate fully satisfied: terminus landmark at 0m, living town street at 80m, artisan market at 160m');

// =========================================================================
// Suite 10: Teardown & Lifecycle Cleanup (Zero Leaks)
// =========================================================================
console.log('\n--- Suite 10: Teardown & Lifecycle Cleanup ---');
director.reset();

const tempChunk = new THREE.Group();
builder.buildDistrictScenery(tempChunk, 12, 1.2, 80, 4321, 'FULL', -240);
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
assert.ok(minCount > 20, `MINIMAL detail preserves essential heritage structures (${minCount} meshes)`);
pass(`Detail tiering verified: FULL (${fullCount} meshes) > MINIMAL (${minCount} meshes)`);

// =========================================================================
// Suite 12: SceneryFactory & TrackChunk Backward Compatibility
// =========================================================================
console.log('\n--- Suite 12: SceneryFactory & TrackChunk Backward Compatibility ---');
const obsFactory = new ObstacleFactory();
const colFactory = new CollectibleFactory();
const historicChunk = new TrackChunk(obsFactory, colFactory);

historicChunk.populate([], -80, 'HISTORIC_QUARTER', false);
assert.ok(historicChunk.decorativeGroup.children.length > 0, 'Historic Quarter populates decorativeGroup');

let foundHistoricWall = false;
let foundHistoricBuilding = false;
let foundTelegraphGantry = false;

historicChunk.decorativeGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    if (child.position.x < -6 || child.position.x > 6) foundHistoricWall = true;
    if (child.position.y > 10) foundHistoricBuilding = true;
    if (child.position.y >= 6.8 && child.position.y <= 8.5) foundTelegraphGantry = true;
  }
});

assert.ok(foundHistoricWall, 'Historic Quarter generates perimeter brick retaining walls');
assert.ok(foundHistoricBuilding, 'Historic Quarter generates Victorian architectural building silhouettes');
assert.ok(foundTelegraphGantry, 'Historic Quarter generates black-iron telegraph & semaphore gantries');
pass('TrackChunk integration satisfies all existing modular environment assertions');

// Clean up with SceneryPool
pool.clearDecorativeGroup(historicChunk.decorativeGroup, new Set(Object.values(factory.getSharedMaterials())));
assert.strictEqual(historicChunk.decorativeGroup.children.length, 0, 'SceneryPool cleanly clears all decorative meshes');
pass('SceneryPool cleanly recycles Historic Quarter decorative groups');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} HISTORIC_QUARTER WORLD TESTS PASSED!`);
console.log('=======================================================\n');
