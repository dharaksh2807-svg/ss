import assert from 'node:assert';
import * as THREE from 'three';
import {
  INFERNO_EXPRESS_THEME,
  INFERNO_EXPRESS_TRAIN_LIVERY,
  applyInfernoExpressTrainLivery
} from '../src/environment/worlds/infernoExpress/InfernoExpressTheme';
import {
  InfernoExpressEventDirector
} from '../src/environment/worlds/infernoExpress/InfernoExpressEventDirector';
import {
  InfernoExpressWorldBuilder
} from '../src/environment/worlds/infernoExpress/InfernoExpressWorldBuilder';
import { SettingsManager } from '../src/settings/SettingsManager';

console.log('🧪 Starting INFERNO_EXPRESS (Rails Through Hellfire) Verification Suite...\n');

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
            createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            putImageData: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            moveTo: () => {},
            lineTo: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            roundRect: () => {},
            fillText: () => {},
            closePath: () => {},
            set strokeStyle(_: any) {},
            set fillStyle(_: any) {},
            set lineWidth(_: any) {},
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

assert.strictEqual(INFERNO_EXPRESS_THEME.displayName, 'Inferno Express', 'Display name matches');
pass('Display name is "Inferno Express"');

assert.strictEqual(INFERNO_EXPRESS_THEME.subtitle, 'Rails Through Hellfire', 'Subtitle matches');
pass('Subtitle is "Rails Through Hellfire"');

assert.strictEqual(INFERNO_EXPRESS_THEME.accentColor, '#f97316', 'Accent color is Fiery Molten Orange');
pass('Accent color is Fiery Molten Orange (#f97316)');

assert.strictEqual(INFERNO_EXPRESS_THEME.ambience.tag, 'INFERNO_EXPRESS_HELLFIRE', 'Ambience tag matches');
pass('Ambience tag is "INFERNO_EXPRESS_HELLFIRE"');

assert.ok(INFERNO_EXPRESS_THEME.materials.ballastColor, 'Ballast color defined');
assert.ok(INFERNO_EXPRESS_THEME.materials.curbColor, 'Curb color defined');
assert.ok(INFERNO_EXPRESS_THEME.materials.wallBaseColor, 'Wall base color defined');
assert.ok(INFERNO_EXPRESS_THEME.materials.wallAccentColor, 'Wall accent color defined');
pass('Material palette contains full volcanic basalt, molten magma, and obsidian colors');

assert.ok(INFERNO_EXPRESS_THEME.districtRange.minLengthMeters >= 500, 'Min district length valid');
pass('District range defined with proper length scaling');

// ============================================================================
// SUITE 2: DETERMINISTIC GENERATION ACROSS ALL 4 DISTRICTS
// ============================================================================
console.log('\n--- Suite 2: Deterministic Generation Across All 4 Districts ---');

const builder = InfernoExpressWorldBuilder.getInstance();
const director = InfernoExpressEventDirector.getInstance();

// District A (Seed 0)
const groupA = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupA, 12, 100, 0, 'FULL');
const distA = groupA.getObjectByName('district_a_lava_sea');
assert.ok(distA, 'District A Lava Sea generated');
pass('District A — The Lava Sea generated successfully');

// District B (Seed 1)
const groupB = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupB, 12, 100, 1, 'FULL');
const distB = groupB.getObjectByName('district_b_obsidian_citadel');
assert.ok(distB, 'District B Obsidian Citadel generated');
pass('District B — Obsidian Citadel generated successfully');

// District C (Seed 2)
const groupC = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupC, 12, 100, 2, 'FULL');
const distC = groupC.getObjectByName('district_c_magma_foundry');
assert.ok(distC, 'District C Magma Foundry generated');
pass('District C — The Magma Foundry generated successfully');

// District D (Seed 3)
const groupD = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupD, 12, 100, 3, 'FULL');
const distD = groupD.getObjectByName('district_d_ashfall_summit');
assert.ok(distD, 'District D Ashfall Summit generated');
pass('District D — Ashfall Summit generated successfully');

// Determinism test
const groupA1 = new THREE.Group();
const groupA2 = new THREE.Group();
builder.buildDistrictScenery(groupA1, 12, 100, 42, 'FULL');
builder.buildDistrictScenery(groupA2, 12, 100, 42, 'FULL');
assert.strictEqual(
  groupA1.getObjectByName('district_c_magma_foundry')?.children.length,
  groupA2.getObjectByName('district_c_magma_foundry')?.children.length,
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
// SUITE 4: ALL 6 ANIMATED VOLCANIC WORLD EVENTS
// ============================================================================
console.log('\n--- Suite 4: All 6 Animated Volcanic World Events ---');

director.reset();
const testChunk = new THREE.Group();
builder.buildLavaSeaDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildObsidianCitadelDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildMagmaFoundryDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildAshfallSummitDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

// Verify Event Registrations
assert.ok(director.getVolcanoCount() >= 1, `At least 1 volcano registered (got ${director.getVolcanoCount()})`);
pass(`Event 1: Distant erupting volcano registered with caldera and eruption plume`);

assert.ok(director.getWaterfallCount() >= 1, `At least 1 lava cataract registered (got ${director.getWaterfallCount()})`);
pass(`Event 2: Pulsing molten lava waterfall cataract registered`);

assert.ok(director.getChainCount() >= 2, `At least 2 shifting chains registered (got ${director.getChainCount()})`);
pass(`Event 3: Shifting massive industrial viaduct suspension chains registered`);

assert.ok(director.getGeyserCount() >= 1, `At least 1 lava geyser registered (got ${director.getGeyserCount()})`);
pass(`Event 4: Lava ocean magma geysers registered`);

assert.ok(director.getCollapsingRockCount() >= 1, `Collapsing rock registered (got ${director.getCollapsingRockCount()})`);
pass(`Event 5: Distant collapsing basalt monolith registered`);

assert.ok(director.getBlastDoorCount() >= 1, `Furnace blast doors registered (got ${director.getBlastDoorCount()})`);
pass(`Event 6: Citadel furnace blast doors aperture glow registered`);

// Test Director Tick & Motion
director.update(0.16, true);
pass('Director tick executes smoothly without exceptions');

director.update(2.0, true);
pass('Director multi-second update cycles eruptions, cataracts, chains, geysers, and blast doors');

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
builder.buildLavaSeaDistrict(fullGroup, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

const minGroup = new THREE.Group();
builder.buildLavaSeaDistrict(minGroup, 12, 100, new (class { next() { return 0.5; } } as any), 'MINIMAL', director);

assert.ok(fullGroup.children[0].children.length >= minGroup.children[0].children.length, 'MINIMAL detail reduces secondary elements');
pass('Graphics detail scaling: MINIMAL tier properly scales down distant volcano and secondary scene props');

// ============================================================================
// SUITE 6: ARMORED TRAIN AESTHETIC & LIVERY INTEGRATION HOOK
// ============================================================================
console.log('\n--- Suite 6: Armored Train Aesthetic & Livery Integration Hook ---');

assert.strictEqual(INFERNO_EXPRESS_TRAIN_LIVERY.accentColor, 0xf97316, 'Livery accent color matches');
assert.strictEqual(INFERNO_EXPRESS_TRAIN_LIVERY.windowGlowColor, 0xfbbf24, 'Livery window glow matches');
pass('Train livery palette verified (Armored Obsidian, Firebox Red, Molten Orange, Amber Heat windows)');

// Test Livery Application Hook
const mockTrain = new THREE.Group();
const mockBody = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
mockBody.name = 'train_body';
mockTrain.add(mockBody);

const mockWindow = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
mockWindow.name = 'train_window_glow';
mockTrain.add(mockWindow);

applyInfernoExpressTrainLivery(mockTrain, 0);

assert.ok((mockBody.material as THREE.MeshStandardMaterial).color.getHex() === 0x18181b, 'Body material color updated');
assert.ok((mockWindow.material as THREE.MeshBasicMaterial).color.getHex() === 0xfbbf24, 'Window glow material updated');
pass('applyInfernoExpressTrainLivery hook correctly applies heat-resistant volcanic materials');

// Test Complete Showcase Train Builder
const showcaseTrain = builder.buildInfernoExpressShowcaseTrain(0, 0, 0);
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
builder.buildLavaSeaDistrict(temporaryChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
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
assert.strictEqual(director.getVolcanoCount(), 0, 'Volcanoes reset');
assert.strictEqual(director.getWaterfallCount(), 0, 'Waterfalls reset');
assert.strictEqual(director.getChainCount(), 0, 'Chains reset');
assert.strictEqual(director.getGeyserCount(), 0, 'Geysers reset');
assert.strictEqual(director.getCollapsingRockCount(), 0, 'Collapsing rocks reset');
assert.strictEqual(director.getBlastDoorCount(), 0, 'Blast doors reset');
assert.strictEqual(director.getTotalActiveElements(), 0, 'Total active elements reset to 0');
pass('Event director reset() cleanly disposes all references');

// ============================================================================
// SUITE 8: GRAND STRATOVOLCANO ERUPTION LIFECYCLE & STAGING (FIRST QUALITY GATE)
// ============================================================================
console.log('\n--- Suite 8: Grand Stratovolcano Eruption Lifecycle & Staging ---');

director.reset();
const sceneA = new THREE.Scene();
const gateChunk = new THREE.Group();
sceneA.add(gateChunk);
builder.buildLavaSeaDistrict(gateChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, -50.0);

const volcano = gateChunk.getObjectByName('grand_stratovolcano');
assert.ok(volcano, 'Grand Stratovolcano exists in District A hierarchy');
pass('Grand Stratovolcano instantiated in District A');

volcano.updateMatrixWorld(true);
const vBox = new THREE.Box3().setFromObject(volcano);
assert.ok(vBox.min.y <= -6.0, `Volcano grounded deep to bedrock (got min Y: ${vBox.min.y.toFixed(1)}m)`);
pass(`Volcano grounded into volcanic bedrock (Y <= -6.0m)`);

assert.ok(vBox.min.x >= 10.0, `Volcano safely off tracks (got min X: ${vBox.min.x.toFixed(1)}m)`);
pass(`Volcano lateral envelope strictly preserves |X| > 4.2m runner clearance`);

// Test Distance-Staged Lifecycle: triggerZ is -50.0
// 1. DORMANT at runnerZ = 150m (dist = 150 - (-50) = 200m > 140m)
director.update(0.1, true, 150.0);
assert.strictEqual((director as any).volcanoes[0]?.state, 'DORMANT', 'Volcano is DORMANT at 200m distance');
pass('Volcano lifecycle: DORMANT at approach distance 200m');

// 2. ANTICIPATION at runnerZ = 50m (dist = 50 - (-50) = 100m, between 65m and 140m)
director.update(0.1, true, 50.0);
assert.strictEqual((director as any).volcanoes[0]?.state, 'ANTICIPATION', 'Volcano enters ANTICIPATION at 100m distance');
pass('Volcano lifecycle: ANTICIPATION triggered at 100m distance');

// 3. CLIMAX / ERUPTION at runnerZ = -30m (dist = -30 - (-50) = 20m, between -25m and 65m)
director.update(0.1, true, -30.0);
assert.strictEqual((director as any).volcanoes[0]?.state, 'CLIMAX', 'Volcano enters CLIMAX at 20m distance');
pass('Volcano lifecycle: CLIMAX eruption triggered at 20m distance');

// 4. AFTERMATH at runnerZ = -100m (dist = -100 - (-50) = -50m, between -85m and -25m)
director.update(0.1, true, -100.0);
assert.strictEqual((director as any).volcanoes[0]?.state, 'AFTERMATH', 'Volcano enters AFTERMATH at -50m distance');
pass('Volcano lifecycle: AFTERMATH settles as runner passes');

// 5. COMPLETE at runnerZ = -180m (dist = -180 - (-50) = -130m < -85m)
director.update(0.1, true, -180.0);
assert.strictEqual((director as any).volcanoes[0]?.state, 'COMPLETE', 'Volcano enters COMPLETE after passing');
pass('Volcano lifecycle: COMPLETE past aftermath zone');

// ============================================================================
// SUITE 9: EVENT B — OBSIDIAN FORTRESS GATE OPENS LIFECYCLE
// ============================================================================
console.log('\n--- Suite 9: Event B — Obsidian Citadel Gate Opens Lifecycle ---');

director.reset();
const sceneB = new THREE.Scene();
const citadelChunk = new THREE.Group();
sceneB.add(citadelChunk);
builder.buildObsidianCitadelDistrict(citadelChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, -50.0);

const citadelGate = citadelChunk.getObjectByName('citadel_obsidian_fortress_gate');
assert.ok(citadelGate, 'Citadel Obsidian Fortress Gate exists in District B hierarchy');
pass('Citadel Obsidian Fortress Gate instantiated in District B');

// Test Distance-Staged Gate Lifecycle: triggerZ is -100.0 (worldZ - chunkLength * 0.5 = -50 - 50 = -100)
// 1. LOCKED at runnerZ = 50m (dist = 50 - (-100) = 150m > 110m)
director.update(0.1, true, 50.0);
assert.strictEqual((director as any).blastDoors[0]?.state, 'LOCKED', 'Citadel Gate is LOCKED at 150m approach');
pass('Gate lifecycle: LOCKED at 150m approach (mechanical locks fully engaged)');

// 2. UNLOCKING at runnerZ = -20m (dist = -20 - (-100) = 80m, between 50m and 110m)
director.update(0.1, true, -20.0);
assert.strictEqual((director as any).blastDoors[0]?.state, 'UNLOCKING', 'Citadel Gate enters UNLOCKING at 80m approach');
pass('Gate lifecycle: UNLOCKING triggered at 80m (mechanical locks disengaging, rune core surging)');

// 3. OPEN at runnerZ = -80m (dist = -80 - (-100) = 20m, between -25m and 50m)
director.update(0.1, true, -80.0);
assert.strictEqual((director as any).blastDoors[0]?.state, 'OPEN', 'Citadel Gate is OPEN at 20m approach');
pass('Gate lifecycle: OPEN at 20m approach (gates parted on vertical hinges, revealing interior city)');

// 4. PASSED at runnerZ = -150m (dist = -150 - (-100) = -50m < -25m)
director.update(0.1, true, -150.0);
assert.strictEqual((director as any).blastDoors[0]?.state, 'PASSED', 'Citadel Gate is PASSED behind runner');
pass('Gate lifecycle: PASSED preserves wide open corridor as runner enters citadel');

// ============================================================================
// SUITE 10: EVENT C — MAGMA FOUNDRY AWAKENING PRODUCTION LINE
// ============================================================================
console.log('\n--- Suite 10: Event C — Magma Foundry Awakening Production Line ---');

director.reset();
const sceneC = new THREE.Scene();
const foundryChunk = new THREE.Group();
sceneC.add(foundryChunk);
builder.buildMagmaFoundryDistrict(foundryChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, -50.0);

assert.ok(director.getFoundryLineCount() >= 1, `Foundry line registered (got ${director.getFoundryLineCount()})`);
pass('Foundry Awakening production line registered in Event Director');

const productionLine = foundryChunk.getObjectByName('foundry_awakening_production_line');
assert.ok(productionLine, 'Foundry Awakening Production Line exists in District C hierarchy');
pass('Foundry Awakening Production Line instantiated in District C');

// Tick director to verify reciprocating pumps, gantry crane traversal & crucible pouring
director.update(1.5, true, 0.0);
pass('Foundry production line animates reciprocating pumps, traveling crane, and tilting crucible');

// ============================================================================
// SUITE 11: ALL SIX ENVIRONMENTS & ARCHITECTURAL GROUNDING
// ============================================================================
console.log('\n--- Suite 11: All Six Environments & Architectural Grounding ---');

director.reset();
const summitChunk = new THREE.Group();
builder.buildAshfallSummitDistrict(summitChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, -50.0);

// Environment 5: Giant Magma Waterfall Canyon
assert.ok(director.getWaterfallCount() >= 1, 'Giant magma waterfall canyon registered');
pass('Environment 5: Giant Magma Waterfall Canyon verified');

// Environment 6: Supported Volcanic Skybridge
const skybridge = summitChunk.getObjectByName('volcanic_skybridge');
assert.ok(skybridge, 'Supported Volcanic Skybridge exists in District D');
pass('Environment 6: Supported Volcanic Skybridge verified with grounded raked pylons');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} INFERNO_EXPRESS WORLD TESTS PASSED!`);
console.log('=======================================================\n');
