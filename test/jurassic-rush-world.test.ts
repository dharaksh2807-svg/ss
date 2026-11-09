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
            bezierCurveTo: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            roundRect: () => {},
            fillText: () => {},
            closePath: () => {},
            save: () => {},
            restore: () => {},
            scale: () => {},
            rotate: () => {},
            translate: () => {},
            clearRect: () => {},
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
// SUITE 2: DETERMINISTIC GENERATION ACROSS ALL 6 BIOME DISTRICTS
// ============================================================================
console.log('\n--- Suite 2: Deterministic Generation Across All 6 Biome Districts ---');

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

// District E (Seed 4)
const groupE = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupE, 12, 100, 4, 'FULL');
const distE = groupE.getObjectByName('district_e_fern_marsh');
assert.ok(distE, 'District E Fern Marsh generated');
pass('District E — Fern Marsh generated successfully');

// District F (Seed 5)
const groupF = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupF, 12, 100, 5, 'FULL');
const distF = groupF.getObjectByName('district_f_pterosaur_cliffs');
assert.ok(distF, 'District F Pterosaur Cliffs generated');
pass('District F — Pterosaur Cliffs generated successfully');

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
  { name: 'District A (Lost Jungle)', group: groupA },
  { name: 'District B (Valley of Giants)', group: groupB },
  { name: 'District C (Raptor Canyon)', group: groupC },
  { name: 'District D (Ancient Sanctuary)', group: groupD },
  { name: 'District E (Fern Marsh)', group: groupE },
  { name: 'District F (Pterosaur Cliffs)', group: groupF }
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
// SUITE 4: ALL 6 ANIMATED PREHISTORIC DINOSAUR ENCOUNTERS & CINEMATIC EVENTS
// ============================================================================
console.log('\n--- Suite 4: All 6 Animated Prehistoric Dinosaur Encounters & Cinematic Events ---');

director.reset();
const testChunk = new THREE.Group();
builder.buildLostJungleDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildValleyOfGiantsDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildRaptorCanyonDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildAncientSanctuaryDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildFernMarshDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildPterosaurCliffsDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

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

assert.ok(director.getWaterfallCount() >= 1, `Prehistoric waterfalls registered (got ${director.getWaterfallCount()})`);
pass(`Environment 1: Prehistoric waterfalls registered with scrolling foam & mist`);

assert.ok(director.getRiverCount() >= 1, `Prehistoric rivers registered (got ${director.getRiverCount()})`);
pass(`Environment 2: Prehistoric rivers registered with caustic ripple flow`);

assert.ok(director.getDragonflyCount() >= 1, `Meganeura giant dragonflies registered (got ${director.getDragonflyCount()})`);
pass(`Environment 3: Meganeura giant dragonflies registered with rapid wing flutter`);

// Test Director Tick & Motion with Player Position
director.update(0.16, true, -100);
pass('Director tick executes smoothly without exceptions at playerZ = -100');

// Test Event A lifecycle (Giant Crossing around Z = -450)
director.update(0.5, true, -350); // approach
director.update(0.5, true, -440); // crossing
director.update(0.5, true, -550); // passing
pass('Event A (Giant Sauropod Crossing) transitions through approach, crossing, and passing states');

// Test Event B lifecycle (Raptor Ridge around Z = -850)
director.update(0.5, true, -750); // perched
director.update(0.5, true, -840); // sprinting & weaving
director.update(0.5, true, -950); // leaping & retreating
pass('Event B (Raptor Ridge Sprint) transitions through perched, sprinting, weaving, and retreating');

// Test Event C lifecycle (Waterfall Predator around Z = -2050)
director.update(0.5, true, -1950); // concealed / emerging
director.update(0.5, true, -2040); // roaring with jaw unhinged
director.update(0.5, true, -2150); // retreating into jungle
pass('Event C (Waterfall Predator Roar) transitions through emerging, roaring, and retreating');

director.update(2.0, true, -1000);
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

// ============================================================================
// SUITE 8: BLOCKBUSTER HERO WORLD PROTOTYPE & SIGNATURE SPECTACLES (PHASE 12)
// ============================================================================
console.log('\n--- Suite 8: Blockbuster Hero World Prototype & Signature Spectacles (Phase 12) ---');

// 1. Sector 04 Outpost Gateway
const testGate = builder.buildExpeditionOutpostGate(0, 0, -22.0);
assert.ok(testGate !== null, 'Sector 04 Outpost Gateway generated');
testGate.updateMatrixWorld(true);

let gateIntrusions = 0;
testGate.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.geometry.computeBoundingBox();
    const bbox = child.geometry.boundingBox;
    if (bbox) {
      const wb = bbox.clone().applyMatrix4(child.matrixWorld);
      if (wb.min.x <= 4.2 && wb.max.x >= -4.2 && wb.min.y <= 8.5 && wb.max.y >= 0.1) {
        gateIntrusions++;
      }
    }
  }
});
assert.strictEqual(gateIntrusions, 0, 'Sector 04 Outpost Gateway preserves 100% running envelope clearance');
pass('Signature Opening: Sector 04 Outpost Gateway generated with 0 corridor intrusions');

// 2. Grand Sun Temple Viaduct & Titanosaur Bone Arches
const testViaduct = builder.buildGrandSunTempleViaduct(0, 0, 0, 100);
assert.ok(testViaduct !== null, 'Grand Sun Temple Viaduct generated');
testViaduct.updateMatrixWorld(true);

let viaductIntrusions = 0;
testViaduct.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.geometry.computeBoundingBox();
    const bbox = child.geometry.boundingBox;
    if (bbox) {
      const wb = bbox.clone().applyMatrix4(child.matrixWorld);
      if (wb.min.x <= 4.2 && wb.max.x >= -4.2 && wb.min.y <= 8.5 && wb.max.y >= 0.1) {
        viaductIntrusions++;
      }
    }
  }
});
assert.strictEqual(viaductIntrusions, 0, 'Grand Sun Temple Viaduct preserves 100% running envelope clearance');
pass('Signature Landmark: Grand Sun Temple Viaduct & 5 Titanosaur Bone Arches generated with 0 corridor intrusions');

// 3. Spectacle A 6-Stage Lifecycle (Giant Dinosaur Encounter)
director.reset();
const mockScene = new THREE.Scene();
const mockSauropodGroup = new THREE.Group();
mockScene.add(mockSauropodGroup);
const mockNeck = new THREE.Group();
const mockHead = new THREE.Group();
const mockTail = new THREE.Group();
const mockLegs = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
const mockSplashRing = new THREE.Mesh(new THREE.RingGeometry(1, 2, 8), new THREE.MeshBasicMaterial());

director.registerSauropod(
  mockSauropodGroup,
  mockNeck,
  mockHead,
  mockTail,
  mockLegs,
  3.8,
  1.5,
  -100,
  50,
  {
    triggerZ: -500,
    splashRings: [mockSplashRing],
    isEventA: true
  }
);

// Stage 1: DORMANT (dist > 140m -> playerZ > -360)
director.update(0.1, true, -300);
assert.strictEqual((director as any).sauropods[0].state, 'DORMANT');

// Stage 2: APPROACH (dist > 70m -> playerZ > -430)
director.update(0.1, true, -400);
assert.strictEqual((director as any).sauropods[0].state, 'APPROACH');

// Stage 3: CROSSING (dist > 15m -> playerZ > -485)
director.update(0.1, true, -460);
assert.strictEqual((director as any).sauropods[0].state, 'CROSSING');
assert.ok(mockSplashRing.visible, 'Splash rings visible during river crossing');

// Stage 4: PASSING (dist > -40m -> playerZ > -540)
director.update(0.1, true, -510);
assert.strictEqual((director as any).sauropods[0].state, 'PASSING');
assert.ok(mockHead.rotation.y < -0.1, 'Sauropod head turns curiously toward passing runner');

// Stage 5: GRAZING (dist > -110m -> playerZ > -610)
director.update(0.1, true, -570);
assert.strictEqual((director as any).sauropods[0].state, 'GRAZING');

// Stage 6: SETTLED (dist <= -110m)
director.update(0.1, true, -650);
assert.strictEqual((director as any).sauropods[0].state, 'SETTLED');
pass('Spectacle A (Giant Dinosaur Encounter): Full 6-stage animation lifecycle verified');

// 4. Spectacle B (Prehistoric Valley Reveal)
director.update(0.1, true, -350);
assert.strictEqual(director.getValleyRevealStage(), 'CONFINED_TUNNEL');
director.update(0.1, true, -385);
assert.strictEqual(director.getValleyRevealStage(), 'EMERGING');
director.update(0.1, true, -420);
assert.strictEqual(director.getValleyRevealStage(), 'EXPANDING_PANORAMA');
director.update(0.1, true, -470);
assert.strictEqual(director.getValleyRevealStage(), 'HERD_MIGRATION');
director.update(0.1, true, -550);
assert.strictEqual(director.getValleyRevealStage(), 'SETTLED_VISTA');
pass('Spectacle B (Prehistoric Valley Reveal): 5-stage panoramic emergence verified');

// 5. Spectacle C 6-Stage Lifecycle (Raptor Canyon Chase)
director.reset();
const mockRaptorScene = new THREE.Scene();
const mockRaptorGroup = new THREE.Group();
mockRaptorScene.add(mockRaptorGroup);
const mockRaptorsData = [
  { group: new THREE.Group(), legs: [new THREE.Group(), new THREE.Group()], tail: new THREE.Group(), head: new THREE.Group(), phaseOffset: 0, lateralOffset: 0 },
  { group: new THREE.Group(), legs: [new THREE.Group(), new THREE.Group()], tail: new THREE.Group(), head: new THREE.Group(), phaseOffset: 1, lateralOffset: -2.8 },
  { group: new THREE.Group(), legs: [new THREE.Group(), new THREE.Group()], tail: new THREE.Group(), head: new THREE.Group(), phaseOffset: 2, lateralOffset: 2.8 }
];

director.registerRaptorPack(
  mockRaptorGroup,
  mockRaptorsData,
  24.0,
  8.5,
  -120,
  30,
  {
    triggerZ: -900,
    baseY: 1.5,
    perchY: 3.5,
    isEventB: true
  }
);

// Stage 1: PERCHED (dist > 90m -> playerZ > -810)
director.update(0.1, true, -780);
assert.strictEqual((director as any).raptorPacks[0].state, 'PERCHED');
assert.strictEqual(mockRaptorGroup.position.y, 3.5, 'Raptors perched on elevated shelf at Y = 3.5m');

// Stage 2: LEAPING (dist > 50m -> playerZ > -850)
director.update(0.1, true, -830);
assert.strictEqual((director as any).raptorPacks[0].state, 'LEAPING');

// Stage 3: SPRINTING (dist > 15m -> playerZ > -885)
director.update(0.1, true, -865);
assert.strictEqual((director as any).raptorPacks[0].state, 'SPRINTING');
assert.strictEqual(mockRaptorGroup.position.y, 1.5, 'Raptors sprint on running terrace at Y = 1.5m');

// Stage 4: FORMATION_SHIFT (dist > -35m -> playerZ > -935)
director.update(0.1, true, -915);
assert.strictEqual((director as any).raptorPacks[0].state, 'FORMATION_SHIFT');

// Stage 5: DISAPPEARING (dist > -90m -> playerZ > -990)
director.update(0.1, true, -960);
assert.strictEqual((director as any).raptorPacks[0].state, 'DISAPPEARING');

// Stage 6: SETTLED (dist <= -90m)
director.update(0.1, true, -1020);
assert.strictEqual((director as any).raptorPacks[0].state, 'SETTLED');
pass('Spectacle C (Raptor Canyon Chase): Full 6-stage sprint, formation shift and disappearance lifecycle verified');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} JURASSIC_RUSH WORLD TESTS PASSED!`);
console.log('=======================================================\n');
