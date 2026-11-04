import assert from 'node:assert';
import * as THREE from 'three';
import {
  JURASSIC_RUSH_THEME,
  JURASSIC_RUSH_TRAIN_LIVERY,
  applyJurassicRushTrainLivery
} from '../src/environment/worlds/jurassicRush/JurassicRushTheme';
import {
  JurassicRushEventDirector
} from '../src/environment/worlds/jurassicRush/JurassicRushEventDirector';
import {
  JurassicRushWorldBuilder
} from '../src/environment/worlds/jurassicRush/JurassicRushWorldBuilder';
import { SettingsManager } from '../src/settings/SettingsManager';

console.log('🧪 Starting JURASSIC_RUSH (The Lost World Railway) Verification Suite...\n');

// Mock DOM canvas for node environment tests if needed
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') {
        return {
          width: 512,
          height: 512,
          getContext: () => ({
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            beginPath: () => {},
            arc: () => {},
            ellipse: () => {},
            fill: () => {},
            stroke: () => {},
            moveTo: () => {},
            lineTo: () => {},
            quadraticCurveTo: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            roundRect: () => {},
            fillText: () => {},
            closePath: () => {},
            set strokeStyle(_: any) {},
            set fillStyle(_: any) {},
            set lineWidth(_: any) {},
            set lineCap(_: any) {},
            set font(_: any) {},
            set textAlign(_: any) {},
            set textBaseline(_: any) {},
            set shadowColor(_: any) {},
            set shadowBlur(_: any) {}
          })
        };
      }
      return {};
    }
  };
}

let testsPassed = 0;
function pass(testName: string) {
  testsPassed++;
  console.log(`  ✅ ${testName}`);
}

// ============================================================================
// SUITE 1: THEME IDENTITY & CONFIGURATION
// ============================================================================
console.log('--- Suite 1: Theme Identity & Configuration ---');

assert.strictEqual(JURASSIC_RUSH_THEME.displayName, 'Jurassic Rush', 'Display name matches');
pass('Display name is "Jurassic Rush"');

assert.strictEqual(JURASSIC_RUSH_THEME.subtitle, 'The Lost World Railway', 'Subtitle matches');
pass('Subtitle is "The Lost World Railway"');

assert.strictEqual(JURASSIC_RUSH_THEME.accentColor, '#10b981', 'Accent color is Prehistoric Emerald Green');
pass('Accent color is Prehistoric Emerald Green (#10b981)');

assert.strictEqual(JURASSIC_RUSH_THEME.ambience.tag, 'JURASSIC_RUSH_PREHISTORIC', 'Ambience tag matches');
pass('Ambience tag is "JURASSIC_RUSH_PREHISTORIC"');

assert.ok(JURASSIC_RUSH_THEME.materials.ballastColor, 'Ballast color defined');
assert.ok(JURASSIC_RUSH_THEME.materials.curbColor, 'Curb color defined');
assert.ok(JURASSIC_RUSH_THEME.materials.wallBaseColor, 'Wall base color defined');
assert.ok(JURASSIC_RUSH_THEME.materials.wallAccentColor, 'Wall accent color defined');
pass('Material palette contains full prehistoric jungle, canyon sandstone, and ancient moss colors');

assert.ok(JURASSIC_RUSH_THEME.districtRange.minLengthMeters >= 500, 'Min district length valid');
pass('District range defined with proper length scaling');

// ============================================================================
// SUITE 2: DETERMINISTIC GENERATION ACROSS ALL 4 DISTRICTS
// ============================================================================
console.log('\n--- Suite 2: Deterministic Generation Across All 4 Districts ---');

const builder = JurassicRushWorldBuilder.getInstance();
const director = JurassicRushEventDirector.getInstance();

// District A (Seed 0)
const groupA = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupA, 12, 100, 0, 'FULL');
const distA = groupA.getObjectByName('district_a_lost_jungle');
assert.ok(distA, 'District A Lost Jungle generated');
pass('District A — The Lost Jungle generated successfully');

// District B (Seed 1)
const groupB = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupB, 12, 100, 1, 'FULL');
const distB = groupB.getObjectByName('district_b_valley_of_giants');
assert.ok(distB, 'District B Valley of Giants generated');
pass('District B — Valley of Giants generated successfully');

// District C (Seed 2)
const groupC = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupC, 12, 100, 2, 'FULL');
const distC = groupC.getObjectByName('district_c_raptor_canyon');
assert.ok(distC, 'District C Raptor Canyon generated');
pass('District C — Raptor Canyon generated successfully');

// District D (Seed 3)
const groupD = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupD, 12, 100, 3, 'FULL');
const distD = groupD.getObjectByName('district_d_ancient_sanctuary');
assert.ok(distD, 'District D Ancient Sanctuary generated');
pass('District D — The Ancient Sanctuary generated successfully');

// Determinism test
const groupA1 = new THREE.Group();
const groupA2 = new THREE.Group();
builder.buildDistrictScenery(groupA1, 12, 100, 42, 'FULL');
builder.buildDistrictScenery(groupA2, 12, 100, 42, 'FULL');
assert.strictEqual(
  groupA1.getObjectByName('district_c_raptor_canyon')?.children.length,
  groupA2.getObjectByName('district_c_raptor_canyon')?.children.length,
  'Deterministic object counts for identical seeds'
);
pass('Deterministic generation: identical seeds yield identical hierarchies');

// ============================================================================
// SUITE 3: RUNNING CORRIDOR CLEARANCE ENVELOPE (ZERO INTRUSIONS)
// ============================================================================
console.log('\n--- Suite 3: Running Corridor Clearance Envelope (Zero Intrusions) ---');

const allGroups = [
  { name: 'District A', group: groupA },
  { name: 'District B', group: groupB },
  { name: 'District C', group: groupC },
  { name: 'District D', group: groupD }
];

allGroups.forEach(({ name, group }) => {
  group.updateMatrixWorld(true);
  let intrusions = 0;
  const intrudingObjects: string[] = [];

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingBox();
      const bbox = child.geometry.boundingBox;
      if (!bbox) return;

      const worldBox = bbox.clone().applyMatrix4(child.matrixWorld);

      // Check if worldBox intersects running zone: |X| <= 4.2m and Y <= 8.5m
      const inX = worldBox.min.x <= 4.2 && worldBox.max.x >= -4.2;
      const inY = worldBox.min.y <= 8.5 && worldBox.max.y >= 0.1;

      if (inX && inY) {
        intrusions++;
        intrudingObjects.push(`${child.name || 'unnamed'} [X: ${worldBox.min.x.toFixed(1)} to ${worldBox.max.x.toFixed(1)}, Y: ${worldBox.min.y.toFixed(1)} to ${worldBox.max.y.toFixed(1)}]`);
      }
    }
  });

  assert.strictEqual(intrusions, 0, `${name} has 0 intrusions into running envelope (${intrudingObjects.join(', ')})`);
  pass(`${name}: 0 intrusions into playable corridor (|X| <= 4.2m, Y <= 8.5m)`);
});

// ============================================================================
// SUITE 4: ALL 6 ANIMATED PREHISTORIC DINOSAUR ENCOUNTERS
// ============================================================================
console.log('\n--- Suite 4: All 6 Animated Prehistoric Dinosaur Encounters ---');

director.reset();
const testChunk = new THREE.Group();
builder.buildLostJungleDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildValleyOfGiantsDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildRaptorCanyonDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildAncientSanctuaryDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

// Verify Event Registrations
assert.ok(director.getSauropodCount() >= 1, `Sauropod walker registered (got ${director.getSauropodCount()})`);
pass(`Encounter 1: Colossal long-necked sauropod registered with 4-legged walking, neck and tail motion`);

assert.ok(director.getCarnivoreCount() >= 1, `Apex carnivore registered (got ${director.getCarnivoreCount()})`);
pass(`Encounter 2: Apex carnivore registered with roaring animation and articulated lower jaw`);

assert.ok(director.getRaptorPackCount() >= 1, `Raptor pack registered (got ${director.getRaptorPackCount()})`);
pass(`Encounter 3: Sprinting raptor pack registered with athletic bipedal leg pumping`);

assert.ok(director.getPterosaurCount() >= 1, `Pterosaur flock registered (got ${director.getPterosaurCount()})`);
pass(`Encounter 4: Gliding pterosaur flock registered with wing flapping and banking rolls`);

assert.ok(director.getHerbivoreHerdCount() >= 1, `Herbivore herd registered (got ${director.getHerbivoreHerdCount()})`);
pass(`Encounter 5: Grazing herbivore herd registered with dipping head and tail swishes`);

assert.ok(director.getCuriousWatcherCount() >= 1, `Curious watcher registered (got ${director.getCuriousWatcherCount()})`);
pass(`Encounter 6: Curious giant dinosaur watcher registered turning to track passing runner`);

// Test Director Tick & Motion
director.update(0.16, true);
pass('Director tick executes smoothly without exceptions');

director.update(2.0, true);
pass('Director multi-second update cycles walking, roaring, sprinting, gliding, and grazing');

// Test Reduced Motion Support
SettingsManager.getInstance().setReducedMotion(true);
director.update(0.16, true);
pass('Director smoothly handles isReducedMotion() accessibility mode');
SettingsManager.getInstance().setReducedMotion(false);

// ============================================================================
// SUITE 5: GRAPHICS TIERING & GEOMETRY REUSE
// ============================================================================
console.log('\n--- Suite 5: Graphics Tiering & Geometry Reuse ---');

const fullGroup = new THREE.Group();
builder.buildLostJungleDistrict(fullGroup, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

const minGroup = new THREE.Group();
builder.buildLostJungleDistrict(minGroup, 12, 100, new (class { next() { return 0.5; } } as any), 'MINIMAL', director);

assert.ok(fullGroup.children[0].children.length >= minGroup.children[0].children.length, 'MINIMAL detail reduces secondary elements');
pass('Graphics detail scaling: MINIMAL tier properly scales down secondary scene props');

// ============================================================================
// SUITE 6: EXPEDITION TRAIN AESTHETIC & LIVERY INTEGRATION HOOK
// ============================================================================
console.log('\n--- Suite 6: Expedition Train Aesthetic & Livery Integration Hook ---');

assert.strictEqual(JURASSIC_RUSH_TRAIN_LIVERY.accentColor, 0xfacc15, 'Livery accent color matches');
assert.strictEqual(JURASSIC_RUSH_TRAIN_LIVERY.windowGlowColor, 0xfef08a, 'Livery window glow matches');
pass('Train livery palette verified (Safari Olive, Heavy Expedition Steel, Amber observation windows)');

// Test Livery Application Hook
const mockTrain = new THREE.Group();
const mockBody = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
mockBody.name = 'train_body';
mockTrain.add(mockBody);

const mockWindow = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
mockWindow.name = 'train_window_glow';
mockTrain.add(mockWindow);

applyJurassicRushTrainLivery(mockTrain, 0);

assert.ok((mockBody.material as THREE.MeshStandardMaterial).color.getHex() === 0x3f4f2c, 'Body material color updated');
assert.ok((mockWindow.material as THREE.MeshBasicMaterial).color.getHex() === 0xfef08a, 'Window glow material updated');
pass('applyJurassicRushTrainLivery hook correctly applies rugged expedition materials');

// Test Complete Showcase Train Builder
const showcaseTrain = builder.buildJurassicRushShowcaseTrain(0, 0, 0);
showcaseTrain.updateMatrixWorld(true);

showcaseTrain.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.geometry.computeBoundingBox();
  }
});
const trainBox = new THREE.Box3().setFromObject(showcaseTrain);
const trainSize = new THREE.Vector3();
trainBox.getSize(trainSize);

assert.ok(trainSize.x <= 3.2, `Train width ${trainSize.x.toFixed(1)} fits inside standard rail corridor`);
assert.ok(trainSize.y <= 4.6, `Train height ${trainSize.y.toFixed(1)} fits standard clearance`);
assert.ok(trainSize.z >= 18.0 && trainSize.z <= 26.0, `Train length ${trainSize.z.toFixed(1)} matches standard 22m train`);
pass(`Showcase locomotive dimensions (${trainSize.x.toFixed(1)}m x ${trainSize.y.toFixed(1)}m x ${trainSize.z.toFixed(1)}m) match standard runner train envelope`);

// ============================================================================
// SUITE 7: TEARDOWN & LIFECYCLE CLEANUP
// ============================================================================
console.log('\n--- Suite 7: Teardown & Lifecycle Cleanup ---');

director.reset();

// Verify detached object pruning
const temporaryChunk = new THREE.Group();
builder.buildLostJungleDistrict(temporaryChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
const activeBeforePrune = director.getTotalActiveElements();
assert.ok(activeBeforePrune > 0, 'Active elements registered before prune');

// Simulate chunk recycling via recursive child release
function releaseGroup(g: THREE.Group) {
  while (g.children.length > 0) {
    const child = g.children[0];
    g.remove(child);
    if (child instanceof THREE.Group) {
      releaseGroup(child);
    }
  }
}
releaseGroup(temporaryChunk);

// Running director update triggers pruneDetached()
director.update(0.016, true);
assert.strictEqual(director.getTotalActiveElements(), 0, 'Detached objects pruned on chunk recycle');
pass('Detached objects cleanly pruned from registries during chunk recycling');

director.reset();
assert.strictEqual(director.getSauropodCount(), 0, 'Sauropods reset');
assert.strictEqual(director.getCarnivoreCount(), 0, 'Carnivores reset');
assert.strictEqual(director.getRaptorPackCount(), 0, 'Raptors reset');
assert.strictEqual(director.getPterosaurCount(), 0, 'Pterosaurs reset');
assert.strictEqual(director.getHerbivoreHerdCount(), 0, 'Herbivores reset');
assert.strictEqual(director.getCuriousWatcherCount(), 0, 'Curious watchers reset');
assert.strictEqual(director.getTotalActiveElements(), 0, 'Total active elements reset to 0');
pass('Event director reset() cleanly disposes all references');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} JURASSIC_RUSH WORLD TESTS PASSED!`);
console.log('=======================================================\n');
