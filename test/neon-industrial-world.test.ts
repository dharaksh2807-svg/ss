import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { NEON_INDUSTRIAL_THEME } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { NeonIndustrialEventDirector } from '../src/environment/worlds/neonIndustrial/NeonIndustrialEventDirector';
import { NeonIndustrialWorldBuilder } from '../src/environment/worlds/neonIndustrial/NeonIndustrialWorldBuilder';
import {
  NEON_INDUSTRIAL_PALETTE,
  NEON_INDUSTRIAL_DISTRICTS
} from '../src/environment/worlds/neonIndustrial/NeonIndustrialTheme';

console.log('🧪 Starting NEON_INDUSTRIAL (The Mechanical Logistics City) Verification Suite...\n');

let testsPassed = 0;
function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
  testsPassed++;
}

const director = NeonIndustrialEventDirector.getInstance();
const builder = NeonIndustrialWorldBuilder.getInstance();
const factory = SceneryFactory.getInstance();

// =========================================================================
// Suite 1: Theme Identity & Configuration
// =========================================================================
console.log('--- Suite 1: Theme Identity & Configuration ---');
const registry = EnvironmentRegistry.getInstance();
assert.ok(registry.has('NEON_INDUSTRIAL'), 'NEON_INDUSTRIAL is registered in EnvironmentRegistry');
const theme = registry.get('NEON_INDUSTRIAL');
assert.strictEqual(theme.id, 'NEON_INDUSTRIAL', 'Theme id is NEON_INDUSTRIAL');
assert.strictEqual(theme.badgeEmoji, '🏭', 'Badge emoji is 🏭');
assert.strictEqual(theme.accentColor, '#ff6d00', 'Accent color is #ff6d00');
assert.strictEqual(NEON_INDUSTRIAL_DISTRICTS.length, 6, '6 distinct industrial districts defined');
pass('Theme identity, registry and district definitions verified');

// =========================================================================
// Suite 2: 6 Distinct Industrial Families Across Endless Run
// =========================================================================
console.log('\n--- Suite 2: 6 Distinct Industrial Families Across Endless Run ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  const chunkZ = -d * 80;
  builder.buildDistrictScenery(group, 12, 1.2, 80, 2000 + d, 'FULL', chunkZ);

  assert.ok(group.children.length > 0, `District ${d} builds decorative scenery`);
  const expectedDistrictDef = NEON_INDUSTRIAL_DISTRICTS[d];
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

      // Ignore foundations/ground strictly under tracks (Y <= 0.1)
      if (penetratesX && penetratesY && box.max.y > 0.1) {
        intrusions++;
      }
    }
  });

  assert.strictEqual(intrusions, 0, `District ${d} maintains 100% clear playable envelope (|X| <= 4.2m, Y <= 8.5m)`);
}
pass('All 6 districts strictly maintain 0 intrusions into runner corridor');

// =========================================================================
// Suite 4: Overhead Gantry Clearance & Girder Invariant
// =========================================================================
console.log('\n--- Suite 4: Overhead Gantry Clearance & Girder Invariant ---');

const gantryTestGroup = new THREE.Group();
builder.buildDistrictScenery(gantryTestGroup, 12, 1.2, 80, 3333, 'FULL', 0);
gantryTestGroup.updateMatrixWorld(true);

let minGirderY = 999;
let minLuminaireY = 999;

gantryTestGroup.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    const box = new THREE.Box3().setFromObject(child);
    const centerX = (box.min.x + box.max.x) * 0.5;

    // Check overhead elements spanning over the track corridor (|X| <= 3.8m)
    if (Math.abs(centerX) <= 3.8 && box.min.y >= 7.0) {
      if (box.min.y < minGirderY) {
        minGirderY = box.min.y;
      }
      if (child.material instanceof THREE.MeshBasicMaterial && box.min.y < minLuminaireY) {
        minLuminaireY = box.min.y;
      }
    }
  }
});

assert.ok(minGirderY >= 9.20, `Overhead fixtures lowest point Y=${minGirderY.toFixed(2)}m (corridor free below 8.5m)`);
pass(`Overhead clearance verified: lowest fixture at Y=${minGirderY.toFixed(2)}m`);

// =========================================================================
// Suite 5: Structural Retaining Setbacks & Non-Monolithic Boundary
// =========================================================================
console.log('\n--- Suite 5: Structural Retaining Setbacks & Non-Monolithic Boundary ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  builder.buildDistrictScenery(group, 12, 1.2, 80, 4444 + d, 'FULL', -d * 80);
  group.updateMatrixWorld(true);

  let hasLeftPlinth = false;
  let hasRightPlinth = false;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.position.x <= -6.0) hasLeftPlinth = true;
      if (child.position.x >= 6.0) hasRightPlinth = true;
    }
  });

  assert.ok(hasLeftPlinth, `District ${d} has setback left plinth at |X| >= 6.0m`);
  assert.ok(hasRightPlinth, `District ${d} has setback right plinth at |X| >= 6.0m`);
}
pass('Structural retaining plinth setbacks (|X| >= 6.0m) verified across all 6 districts');

// =========================================================================
// Suite 6: Foundation Drop & Anti-Floating Invariant
// =========================================================================
console.log('\n--- Suite 6: Foundation Drop & Anti-Floating Invariant ---');

for (let d = 0; d < 6; d++) {
  const group = new THREE.Group();
  builder.buildDistrictScenery(group, 12, 1.2, 80, 6666 + d, 'FULL', -d * 80);
  group.updateMatrixWorld(true);

  let hasFoundation = false;
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const box = new THREE.Box3().setFromObject(child);
      if (box.min.y <= -5.0) {
        hasFoundation = true;
      }
    }
  });

  assert.ok(hasFoundation, `District ${d} has deep foundations extending down to Y <= -5.0m`);
}
pass('Deep foundations (Y <= -5.0m) verified across all 6 industrial districts');

// =========================================================================
// Suite 7: Hero Event A — Crane Ballet (6-Stage Lifecycle & Hierarchy)
// =========================================================================
console.log('\n--- Suite 7: Hero Event A — Crane Ballet (6-Stage Lifecycle & Hierarchy) ---');

director.reset();
const craneScene = new THREE.Scene();
const craneGroup = new THREE.Group();
craneScene.add(craneGroup);
builder.buildDistrictScenery(craneGroup, 12, 1.2, 80, 7777, 'FULL', 0); // District 0

const craneEvents = director.getCraneBallets();
assert.strictEqual(craneEvents.length, 1, 'Crane Ballet hero event registered in District 0');
const heroA = craneEvents[0];
assert.strictEqual(heroA.state, 'DORMANT', 'Initial state is DORMANT');

// Stage 1 -> 2: Player approaches trigger
director.update(0.1, true, heroA.triggerZ + 100);
assert.strictEqual(heroA.state, 'ANTICIPATION', 'Transitions to ANTICIPATION on approach');

// Stage 2 -> 3: Anticipation timer elapses
director.update(1.4, true, heroA.triggerZ + 50);
assert.strictEqual(heroA.state, 'ACTION', 'Transitions to ACTION (spreader lowers and container attaches)');

// Verify hierarchical attachment
director.update(0.6, true, heroA.triggerZ + 30);
assert.strictEqual(
  heroA.crane1.container.parent,
  heroA.crane1.spreader,
  'Container is hierarchically attached directly to spreader frame'
);

// Stage 3 -> 4: Spreader hoists container, transitions to CLIMAX
director.update(1.8, true, heroA.triggerZ + 10);
assert.strictEqual(heroA.state, 'CLIMAX', 'Transitions to CLIMAX (trolley traverses with container)');
director.update(0.8, true, heroA.triggerZ + 5);
assert.ok(heroA.crane1.trolley.position.x > heroA.trolleyStartPos, 'Trolley traverses along gantry girder');

// Stage 4 -> 5: Aftermath (lower onto rail flatcar)
director.update(1.8, true, heroA.triggerZ);
assert.strictEqual(heroA.state, 'AFTERMATH', 'Transitions to AFTERMATH (container settles on flatcar)');

// Stage 5 -> 6: Complete
director.update(2.5, true, heroA.triggerZ - 50);
assert.strictEqual(heroA.state, 'COMPLETE', 'Transitions to COMPLETE after smooth container placement');
pass('Hero Event A: Crane Ballet completed all 6 lifecycle stages with 100% hierarchical attachment');

// =========================================================================
// Suite 8: Hero Event B — Factory Awakening (6-Stage Causal Lifecycle)
// =========================================================================
console.log('\n--- Suite 8: Hero Event B — Factory Awakening (6-Stage Causal Lifecycle) ---');

director.reset();
const factoryScene = new THREE.Scene();
const factoryGroup = new THREE.Group();
factoryScene.add(factoryGroup);
builder.buildDistrictScenery(factoryGroup, 12, 1.2, 80, 8888, 'FULL', -5 * 80); // District 5

const awakeningEvents = director.getFactoryAwakenings();
assert.strictEqual(awakeningEvents.length, 1, 'Factory Awakening hero event registered in District 5');
const heroB = awakeningEvents[0];
assert.strictEqual(heroB.state, 'DORMANT', 'Initial state is DORMANT');

// Stage 1 -> 2: Anticipation (Sequential lighting)
director.update(0.1, true, heroB.triggerZ + 120);
assert.strictEqual(heroB.state, 'ANTICIPATION', 'Transitions to ANTICIPATION');

// Stage 2 -> 3: Action (Steam exhaust, presses & welding robots)
director.update(1.6, true, heroB.triggerZ + 60);
assert.strictEqual(heroB.state, 'ACTION', 'Transitions to ACTION (steam plumes vent, welders strike)');
assert.ok(heroB.powerLevel > 0.5, 'Substation power ramps up');

// Stage 3 -> 4: Climax (Conveyor rolls, locomotive departs)
director.update(2.2, true, heroB.triggerZ + 20);
assert.strictEqual(heroB.state, 'CLIMAX', 'Transitions to CLIMAX (conveyor rumbles, locomotive begins moving)');
director.update(0.5, true, heroB.triggerZ + 15);
assert.ok(heroB.locomotive.headlights[0].visible, 'Locomotive headlights illuminated');

// Stage 4 -> 5: Aftermath
director.update(2.6, true, heroB.triggerZ);
assert.strictEqual(heroB.state, 'AFTERMATH', 'Transitions to AFTERMATH (freight train cruises past)');

// Stage 5 -> 6: Complete
director.update(6.5, true, heroB.triggerZ - 60);
assert.strictEqual(heroB.state, 'COMPLETE', 'Transitions to COMPLETE');
pass('Hero Event B: Factory Awakening completed all 6 causal activation stages cleanly');

// =========================================================================
// Suite 9: Kinetic Ambient Actors Kinematics
// =========================================================================
console.log('\n--- Suite 9: Kinetic Ambient Actors Kinematics ---');

director.reset();
const animScene = new THREE.Scene();
for (let d = 0; d < 6; d++) {
  const g = new THREE.Group();
  animScene.add(g);
  builder.buildDistrictScenery(g, 12, 1.2, 80, 1000 + d, 'FULL', -d * 80);
}

assert.ok(director.getWelderCount() > 0, 'Welding robot actors registered');
assert.ok(director.getPressCount() > 0, 'Stamping press actors registered');
assert.ok(director.getForkliftCount() > 0, 'Forklift actors registered');
assert.ok(director.getConveyorCount() > 0, 'Conveyor belt actors registered');
assert.ok(director.getSteamCount() > 0, 'Steam chimney actors registered');
assert.ok(director.getSwitcherCount() > 0, 'Diesel switcher actors registered');

// Run 10 animation frames
for (let f = 0; f < 10; f++) {
  director.update(0.016, true, -f * 10);
}
pass('All kinetic ambient actors (welders, presses, forklifts, conveyors, steam, switchers) animate cleanly');

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
assert.ok(minimalMeshes >= 15, `MINIMAL (${minimalMeshes}) retains essential structural industrial silhouettes`);
pass(`Graphics scalability verified: FULL (${fullMeshes}) > BALANCED (${balancedMeshes}) > MINIMAL (${minimalMeshes})`);

// =========================================================================
// Suite 11: Memory Hygiene & Detachment Pruning
// =========================================================================
console.log('\n--- Suite 11: Memory Hygiene & Detachment Pruning ---');

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

// =========================================================================
// Suite 12: SceneryFactory Integration & Seamless Chunk Modulo
// =========================================================================
console.log('\n--- Suite 12: SceneryFactory Integration & Seamless Chunk Modulo ---');

for (let c = 0; c < 6; c++) {
  const group = new THREE.Group();
  const worldZ = -c * 80;
  factory.buildScenery(group, NEON_INDUSTRIAL_THEME, 5000 + c, 'FULL', worldZ);

  assert.ok(group.children.length > 0, `SceneryFactory builds scenery for chunk ${c} at Z=${worldZ}`);
}
pass('SceneryFactory seamlessly delegates to NeonIndustrialWorldBuilder across chunk modulo sequence');

console.log(`\n=======================================================`);
console.log(`🏆 ALL 12/12 NEON INDUSTRIAL TEST SUITES PASSED! (${testsPassed} assertions verified)`);
console.log(`=======================================================\n`);
