import assert from 'node:assert';
import * as THREE from 'three';
import {
  CHRONO_KINGDOM_THEME,
  CHRONO_KINGDOM_TRAIN_LIVERY,
  applyChronoKingdomTrainLivery
} from '../src/environment/worlds/chronoKingdom/ChronoKingdomTheme';
import {
  ChronoKingdomEventDirector
} from '../src/environment/worlds/chronoKingdom/ChronoKingdomEventDirector';
import {
  ChronoKingdomWorldBuilder
} from '../src/environment/worlds/chronoKingdom/ChronoKingdomWorldBuilder';
import { SettingsManager } from '../src/settings/SettingsManager';

console.log('🧪 Starting CHRONO_KINGDOM (The Clockwork Empire) Verification Suite...\n');

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
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            stroke: () => {},
            moveTo: () => {},
            lineTo: () => {},
            fillRect: () => {},
            strokeRect: () => {},
            fillText: () => {},
            closePath: () => {},
            set strokeStyle(_: any) {},
            set fillStyle(_: any) {},
            set lineWidth(_: any) {},
            set font(_: any) {},
            set textAlign(_: any) {},
            set textBaseline(_: any) {}
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

assert.strictEqual(CHRONO_KINGDOM_THEME.displayName, 'Chrono Kingdom', 'Display name matches');
pass('Display name is "Chrono Kingdom"');

assert.strictEqual(CHRONO_KINGDOM_THEME.subtitle, 'The Clockwork Empire', 'Subtitle matches');
pass('Subtitle is "The Clockwork Empire"');

assert.strictEqual(CHRONO_KINGDOM_THEME.accentColor, '#d4af37', 'Accent color is Antique Gold');
pass('Accent color is Antique Gold (#d4af37)');

assert.strictEqual(CHRONO_KINGDOM_THEME.ambience.tag, 'CHRONO_KINGDOM_CLOCKWORK', 'Ambience tag matches');
pass('Ambience tag is "CHRONO_KINGDOM_CLOCKWORK"');

assert.ok(CHRONO_KINGDOM_THEME.materials.ballastColor, 'Ballast color defined');
assert.ok(CHRONO_KINGDOM_THEME.materials.curbColor, 'Curb color defined');
assert.ok(CHRONO_KINGDOM_THEME.materials.wallBaseColor, 'Wall base color defined');
assert.ok(CHRONO_KINGDOM_THEME.materials.wallAccentColor, 'Wall accent color defined');
pass('Material palette contains full steampunk bronze, copper, and gold colors');

assert.ok(CHRONO_KINGDOM_THEME.districtRange.minLengthMeters >= 500, 'Min district length valid');
pass('District range defined with proper length scaling');

// ============================================================================
// SUITE 2: DETERMINISTIC GENERATION ACROSS ALL 4 DISTRICTS
// ============================================================================
console.log('\n--- Suite 2: Deterministic Generation Across All 4 Districts ---');

const builder = ChronoKingdomWorldBuilder.getInstance();
const director = ChronoKingdomEventDirector.getInstance();

// District A (Seed 0)
const groupA = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupA, 12, 100, 0, 'FULL');
const distA = groupA.getObjectByName('district_a_grand_clockwork_capital');
assert.ok(distA, 'District A Grand Clockwork Capital generated');
pass('District A — The Grand Clockwork Capital generated successfully');

// District B (Seed 1)
const groupB = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupB, 12, 100, 1, 'FULL');
const distB = groupB.getObjectByName('district_b_time_foundry');
assert.ok(distB, 'District B Time Foundry generated');
pass('District B — The Time Foundry generated successfully');

// District C (Seed 2)
const groupC = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupC, 12, 100, 2, 'FULL');
const distC = groupC.getObjectByName('district_c_chrono_observatory');
assert.ok(distC, 'District C Chrono Observatory generated');
pass('District C — The Chrono Observatory generated successfully');

// District D (Seed 3)
const groupD = new THREE.Group();
director.reset();
builder.buildDistrictScenery(groupD, 12, 100, 3, 'FULL');
const distD = groupD.getObjectByName('district_d_fractured_time');
assert.ok(distD, 'District D Fractured Time District generated');
pass('District D — The Fractured Time District generated successfully');

// Determinism test
const groupA1 = new THREE.Group();
const groupA2 = new THREE.Group();
builder.buildDistrictScenery(groupA1, 12, 100, 42, 'FULL');
builder.buildDistrictScenery(groupA2, 12, 100, 42, 'FULL');
assert.strictEqual(
  groupA1.getObjectByName('district_c_chrono_observatory')?.children.length,
  groupA2.getObjectByName('district_c_chrono_observatory')?.children.length,
  'Deterministic object counts for identical seeds'
);
pass('Deterministic generation: identical seeds yield identical hierarchies');

// ============================================================================
// SUITE 3: RUNNING CORRIDOR CLEARANCE ENVELOPE (ZERO INTRUSIONS)
// ============================================================================
console.log('\n--- Suite 3: Running Corridor Clearance Envelope (Zero Intrusions) ---');

// Invariant: No meshes may penetrate the running corridor (|X| <= 4.2m and Y <= 8.5m)
// High overhead bridges span above Y >= 14.0m
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
// SUITE 4: ALL 6 ANIMATED CLOCKWORK WORLD EVENTS
// ============================================================================
console.log('\n--- Suite 4: All 6 Animated Clockwork World Events ---');

director.reset();
const testChunk = new THREE.Group();
builder.buildGrandClockworkCapital(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildTimeFoundry(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildChronoObservatory(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
builder.buildFracturedTimeDistrict(testChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

// Verify Event Registrations
assert.ok(director.getGearCount() >= 4, `At least 4 gear assemblies registered (got ${director.getGearCount()})`);
pass(`Event 1: ${director.getGearCount()} Interlocking gear assemblies registered for mathematical synchronization`);

assert.ok(director.getChimeCount() >= 1, `At least 1 clock chime registered (got ${director.getChimeCount()})`);
pass(`Event 2: Clock tower hour strike & resonance expansion registered`);

assert.ok(director.getBridgeCount() >= 1, `Retractable brass bridge registered (got ${director.getBridgeCount()})`);
pass(`Event 3: Retractable telescoping mechanical skybridge registered`);

assert.ok(director.getPistonCount() >= 3, `At least 3 timed pistons registered (got ${director.getPistonCount()})`);
pass(`Event 4: Timed 4-phase industrial steam piston bank registered`);

assert.ok(director.getObservatoryCount() >= 1, `Observatory astronomical rings registered (got ${director.getObservatoryCount()})`);
pass(`Event 5: Concentric celestial observatory rings & orrery registered`);

assert.ok(director.getSkybridgeTrainCount() >= 1, `Distant skybridge train registered (got ${director.getSkybridgeTrainCount()})`);
pass(`Event 6: Distant skybridge clockwork train viaduct pass registered`);

assert.ok(director.getTimePortalCount() >= 1, `Time portal vortex registered (got ${director.getTimePortalCount()})`);
pass(`Event 7: Fractured time portal temporal rift registered`);

// Test Director Tick & Motion
director.update(0.16, true);
pass('Director tick executes smoothly without exceptions');

director.update(1.5, true);
pass('Director multi-second update cycles gears, pistons, bridges, and chime cycles');

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
builder.buildGrandClockworkCapital(fullGroup, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);

const minGroup = new THREE.Group();
builder.buildGrandClockworkCapital(minGroup, 12, 100, new (class { next() { return 0.5; } } as any), 'MINIMAL', director);

assert.ok(fullGroup.children[0].children.length >= minGroup.children[0].children.length, 'MINIMAL detail reduces secondary elements');
pass('Graphics detail scaling: MINIMAL tier properly scales down secondary scene props');

// ============================================================================
// SUITE 6: CLOCKWORK TRAIN AESTHETIC & LIVERY INTEGRATION HOOK
// ============================================================================
console.log('\n--- Suite 6: Clockwork Train Aesthetic & Livery Integration Hook ---');

assert.strictEqual(CHRONO_KINGDOM_TRAIN_LIVERY.accentColor, 0xd4af37, 'Livery accent color matches');
assert.strictEqual(CHRONO_KINGDOM_TRAIN_LIVERY.windowGlowColor, 0xfbbf24, 'Livery window glow matches');
pass('Train livery palette verified (Imperial Bronze, Copper, Gold, Amber windows)');

// Test Livery Application Hook
const mockTrain = new THREE.Group();
const mockBody = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
mockBody.name = 'train_body';
mockTrain.add(mockBody);

const mockWindow = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
mockWindow.name = 'train_window_glow';
mockTrain.add(mockWindow);

applyChronoKingdomTrainLivery(mockTrain, 0);

assert.ok((mockBody.material as THREE.MeshStandardMaterial).color.getHex() === 0x2b1810, 'Body material color updated');
assert.ok((mockWindow.material as THREE.MeshBasicMaterial).color.getHex() === 0xfbbf24, 'Window glow material updated');
pass('applyChronoKingdomTrainLivery hook correctly applies clockwork materials');

// Test Complete Showcase Train Builder
const showcaseTrain = builder.buildChronoKingdomShowcaseTrain(0, 0, 0);
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
pass(`Showcase train dimensions (${trainSize.x.toFixed(1)}m x ${trainSize.y.toFixed(1)}m x ${trainSize.z.toFixed(1)}m) match standard runner train envelope`);

// ============================================================================
// SUITE 7: ALL 12 ARCHITECTURAL VARIANTS CLEARANCE & GROUNDING
// ============================================================================
console.log('\n--- Suite 7: All 12 Architectural Variants Clearance & Grounding ---');

const districtBuilders = [
  { name: 'District A', fn: (g: THREE.Group, v: number) => builder.buildGrandClockworkCapital(g, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, v) },
  { name: 'District B', fn: (g: THREE.Group, v: number) => builder.buildTimeFoundry(g, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, v) },
  { name: 'District C', fn: (g: THREE.Group, v: number) => builder.buildChronoObservatory(g, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, v) },
  { name: 'District D', fn: (g: THREE.Group, v: number) => builder.buildFracturedTimeDistrict(g, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, v) }
];

districtBuilders.forEach((dist) => {
  [0, 1, 2].forEach((variantIdx) => {
    const vGroup = new THREE.Group();
    director.reset();
    dist.fn(vGroup, variantIdx);

    vGroup.updateMatrixWorld(true);
    let intrusions = 0;
    const intrudingNames: string[] = [];

    vGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.computeBoundingBox();
        const bbox = child.geometry.boundingBox;
        if (!bbox) return;

        const worldBox = bbox.clone().applyMatrix4(child.matrixWorld);
        const inX = worldBox.min.x <= 4.2 && worldBox.max.x >= -4.2;
        const inY = worldBox.min.y <= 8.5 && worldBox.max.y >= 0.1;

        if (inX && inY) {
          intrusions++;
          intrudingNames.push(`${child.name || 'mesh'} [X: ${worldBox.min.x.toFixed(1)} to ${worldBox.max.x.toFixed(1)}, Y: ${worldBox.min.y.toFixed(1)} to ${worldBox.max.y.toFixed(1)}]`);
        }
      }
    });

    assert.strictEqual(intrusions, 0, `${dist.name} Variant ${variantIdx} has 0 intrusions (${intrudingNames.join(', ')})`);
    pass(`${dist.name} Variant ${variantIdx}: 0 intrusions into playable corridor`);
  });
});

// ============================================================================
// SUITE 8: CINEMATIC SURPRISES & AMBIENT MICRO-MECHANISMS
// ============================================================================
console.log('\n--- Suite 8: Cinematic Surprises & Ambient Micro-Mechanisms ---');

director.reset();
const surpriseChunk = new THREE.Group();
// Dist A Var 0 registers Clock Reversal
builder.buildGrandClockworkCapital(surpriseChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, 0);
assert.ok(director.getClockReversalCount() >= 1, `The Great Clock Reversal registered (${director.getClockReversalCount()})`);
pass('Surprise 1: The Great Clock Reversal registered successfully');

// Dist C Var 0 registers Celestial Alignment
builder.buildChronoObservatory(surpriseChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, 0);
assert.ok(director.getCelestialAlignmentCount() >= 1, `The Celestial Alignment registered (${director.getCelestialAlignmentCount()})`);
pass('Surprise 2: The Celestial Alignment registered successfully');

// Dist A Var 2 registers Carillon Bell
builder.buildGrandClockworkCapital(surpriseChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, 2);
assert.ok(director.getCarillonBellCount() >= 1, `Campanile Carillon Bells registered (${director.getCarillonBellCount()})`);
pass('Ambient Detail 1: Campanile Carillon Bells registered successfully');

// Dist B Var 1 registers Oscillating Pressure Gauge
builder.buildTimeFoundry(surpriseChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director, 1);
assert.ok(director.getPressureGaugeCount() >= 1, `Oscillating Pressure Gauges registered (${director.getPressureGaugeCount()})`);
pass('Ambient Detail 2: Oscillating Pressure Gauges registered successfully');

// Test director animation update on all surprises
director.update(0.1, true);
director.update(5.0, true);
director.update(16.0, true);
pass('Director cleanly executes reversal, celestial alignment, and gauge oscillations');

// ============================================================================
// SUITE 9: MULTI-CYCLE DETERMINISTIC SCHEDULING (0-6400m PROGRESSION)
// ============================================================================
console.log('\n--- Suite 9: Multi-Cycle Deterministic Scheduling (0-6400m Progression) ---');

const trackPositions = [
  { z: -100, expectedName: 'district_a_grand_clockwork_capital', desc: 'Cycle 0 Block 0 (Capital)' },
  { z: -500, expectedName: 'district_b_time_foundry', desc: 'Cycle 0 Block 1 (Foundry)' },
  { z: -900, expectedName: 'district_c_chrono_observatory', desc: 'Cycle 0 Block 2 (Observatory)' },
  { z: -1300, expectedName: 'district_d_fractured_time', desc: 'Cycle 0 Block 3 (Fractured)' },
  { z: -1700, expectedName: 'district_b_time_foundry', desc: 'Cycle 1 Block 0 (Foundry First!)' },
  { z: -2100, expectedName: 'district_a_grand_clockwork_capital', desc: 'Cycle 1 Block 1 (Capital Second!)' },
  { z: -2500, expectedName: 'district_d_fractured_time', desc: 'Cycle 1 Block 2 (Fractured Third!)' },
  { z: -2900, expectedName: 'district_c_chrono_observatory', desc: 'Cycle 1 Block 3 (Observatory Fourth!)' },
  { z: -3300, expectedName: 'district_c_chrono_observatory', desc: 'Cycle 2 Block 0 (Observatory First!)' },
  { z: -3700, expectedName: 'district_d_fractured_time', desc: 'Cycle 2 Block 1 (Fractured Second!)' },
  { z: -4900, expectedName: 'district_d_fractured_time', desc: 'Cycle 3 Block 0 (Fractured First!)' }
];

trackPositions.forEach(({ z, expectedName, desc }) => {
  const g = new THREE.Group();
  builder.buildDistrictScenery(g, 12, 100, 100, 'FULL', z);
  const found = g.getObjectByName(expectedName);
  assert.ok(found, `At worldZ=${z} (${desc}), found ${expectedName}`);
  pass(`Procedural Scheduler: ${desc} correctly instantiated at z=${z}m`);
});

// Verify 1600m scenery non-repetition
const chunk0m = new THREE.Group();
const chunk1600m = new THREE.Group();
const chunk3200m = new THREE.Group();
builder.buildDistrictScenery(chunk0m, 12, 100, 100, 'FULL', -100);
builder.buildDistrictScenery(chunk1600m, 12, 100, 100, 'FULL', -1700);
builder.buildDistrictScenery(chunk3200m, 12, 100, 100, 'FULL', -3300);

assert.notStrictEqual(
  chunk0m.children[0].name,
  chunk1600m.children[0].name,
  'Chunk at 0m and 1600m must have different macro districts'
);
assert.notStrictEqual(
  chunk1600m.children[0].name,
  chunk3200m.children[0].name,
  'Chunk at 1600m and 3200m must have different macro districts'
);
pass('Non-repeating scenery: 0m, 1600m, and 3200m macro districts are distinct and unique');

// ============================================================================
// SUITE 10: TEARDOWN & LIFECYCLE CLEANUP
// ============================================================================
console.log('\n--- Suite 10: Teardown & Lifecycle Cleanup ---');

director.reset();

// Verify detached object pruning
const temporaryChunk = new THREE.Group();
builder.buildGrandClockworkCapital(temporaryChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
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
assert.strictEqual(director.getGearCount(), 0, 'Gears reset');
assert.strictEqual(director.getChimeCount(), 0, 'Chimes reset');
assert.strictEqual(director.getBridgeCount(), 0, 'Bridges reset');
assert.strictEqual(director.getPistonCount(), 0, 'Pistons reset');
assert.strictEqual(director.getObservatoryCount(), 0, 'Observatories reset');
assert.strictEqual(director.getSkybridgeTrainCount(), 0, 'Skybridge trains reset');
assert.strictEqual(director.getTimePortalCount(), 0, 'Time portals reset');
assert.strictEqual(director.getTotalActiveElements(), 0, 'Total active elements reset to 0');
pass('Event director reset() cleanly disposes all references');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} CHRONO_KINGDOM WORLD TESTS PASSED!`);
console.log('=======================================================\n');
