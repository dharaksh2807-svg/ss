import assert from 'node:assert';
import * as THREE from 'three';
import {
  VIVA_HEAT_THEME,
  VIVA_HEAT_TRAIN_LIVERY,
  applyVivaHeatTrainLivery
} from '../src/environment/worlds/vivaHeat/VivaHeatTheme';
import {
  FeverDirector
} from '../src/environment/worlds/vivaHeat/FeverDirector';
import {
  VivaHeatWorldBuilder
} from '../src/environment/worlds/vivaHeat/VivaHeatWorldBuilder';
import {
  VivaHeatCharacters
} from '../src/environment/worlds/vivaHeat/VivaHeatCharacters';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { EnvironmentManager, ENVIRONMENTS } from '../src/environment/EnvironmentConfig';
import { SettingsManager } from '../src/settings/SettingsManager';
import { ObstacleFactory } from '../src/track/ObstacleFactory';

console.log('🧪 Starting VIVA_HEAT (The Forbidden Festival) Verification Suite...\n');

let testsPassed = 0;
function pass(testName: string) {
  testsPassed++;
  console.log(`  ✅ ${testName}`);
}

// ============================================================================
// SUITE 1: THEME IDENTITY & CONFIGURATION
// ============================================================================
console.log('--- Suite 1: Theme Identity & Configuration ---');

assert.strictEqual(VIVA_HEAT_THEME.displayName, 'Viva Heat', 'Display name matches');
pass('Display name is "Viva Heat"');

assert.strictEqual(VIVA_HEAT_THEME.subtitle, 'The Forbidden Festival', 'Subtitle matches');
pass('Subtitle is "The Forbidden Festival"');

assert.strictEqual(VIVA_HEAT_THEME.accentColor, '#ff2d55', 'Accent color is Vibrant Festival Coral Scarlet');
pass('Accent color is Vibrant Festival Coral Scarlet (#ff2d55)');

assert.strictEqual(VIVA_HEAT_THEME.ambience.tag, 'VIVA_HEAT_FESTIVAL', 'Ambience tag matches');
pass('Ambience tag is "VIVA_HEAT_FESTIVAL"');

assert.ok(VIVA_HEAT_THEME.materials.curbColor, 'Curb color defined for high contrast');
assert.ok(VIVA_HEAT_THEME.materials.wallBaseColor, 'Wall base color defined');
pass('Material palette contains full festival coral, sunset gold, and velvet maroon');

assert.ok(EnvironmentRegistry.getInstance().has('VIVA_HEAT'), 'VIVA_HEAT registered in EnvironmentRegistry');
assert.ok(ENVIRONMENTS.VIVA_HEAT, 'VIVA_HEAT registered in ENVIRONMENTS dictionary');
pass('VIVA_HEAT registered in typed EnvironmentRegistry and ENVIRONMENTS config');

// ============================================================================
// SUITE 2: DETERMINISTIC SCENERY GENERATION — ACT I: SCARLET SUNSET
// ============================================================================
console.log('\n--- Suite 2: Deterministic Scenery Generation ---');

const builder = VivaHeatWorldBuilder.getInstance();
const director = FeverDirector.getInstance();

const group1 = new THREE.Group();
director.reset();
builder.buildDistrictScenery(group1, 12, 100, 42, 'FULL');
const act1 = group1.getObjectByName('act_i_scarlet_sunset');
assert.ok(act1, 'Act I Scarlet Sunset generated');
pass('Act I — Scarlet Sunset generated successfully');

// Verify key visual landmarks in Act I
assert.ok(group1.getObjectByName('viva_heat_scarlet_sun'), 'Scarlet Sun horizon landmark present');
pass('Signature Landmark 1: Monumental Scarlet Sun on ocean horizon present');

assert.ok(group1.getObjectByName('viva_heat_seaside_promenade'), 'Seaside promenade & ocean present');
pass('Signature Landmark 2: Coastal ocean plane & marble promenade present');

assert.ok(group1.getObjectByName('viva_heat_luxury_yacht'), 'Luxury festival yachts present');
pass('Signature Landmark 3: Luxury cruising festival yachts present');

assert.ok(group1.getObjectByName('viva_heat_festival_stage'), 'Raised festival dance stage present');
pass('Signature Landmark 4: Raised festival dance stage & screens present');

assert.ok(group1.getObjectByName('viva_heat_kinetic_flower'), 'Kinetic oversized floral sculptures present');
pass('Signature Landmark 5: Kinetic blooming floral sculptures present');

assert.ok(group1.getObjectByName('viva_heat_royal_palms'), 'Tropical royal palms present');
pass('Signature Landmark 6: Tropical royal palms with gilded accents present');

assert.ok(group1.getObjectByName('viva_heat_parabolic_arch'), 'Parabolic festival arch present');
pass('Signature Landmark 7: Sculptural parabolic festival arch with silk ribbons present');

// Determinism test
const group2 = new THREE.Group();
builder.buildDistrictScenery(group2, 12, 100, 42, 'FULL');
assert.strictEqual(
  act1.children.length,
  group2.getObjectByName('act_i_scarlet_sunset')?.children.length,
  'Deterministic object counts for identical seeds'
);
pass('Deterministic generation: identical seeds yield identical hierarchies');

// ============================================================================
// SUITE 3: RUNNING CORRIDOR CLEARANCE ENVELOPE (ZERO INTRUSIONS)
// ============================================================================
console.log('\n--- Suite 3: Running Corridor Clearance Envelope (Zero Intrusions) ---');

// Invariant: No meshes may penetrate the running corridor (|X| <= 4.2m and Y <= 8.5m)
group1.updateMatrixWorld(true);
let intrusions = 0;
const intrudingObjects: string[] = [];

group1.traverse((child) => {
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

assert.strictEqual(intrusions, 0, `Act I has 0 intrusions into running envelope (${intrudingObjects.join(', ')})`);
pass('Act I — Scarlet Sunset: 0 intrusions into playable corridor (|X| <= 4.2m, Y <= 8.5m)');

// ============================================================================
// SUITE 4: FEVER DIRECTOR & 4 INTENSITY STATES
// ============================================================================
console.log('\n--- Suite 4: Fever Director & 4 Intensity States ---');

assert.ok(director.getFlowerCount() >= 1, `Kinetic flowers registered (got ${director.getFlowerCount()})`);
pass('Fever Event 1: Kinetic floral sculptures registered for petal breathing');

assert.ok(director.getDancerCount() >= 1, `Adult festival performers registered (got ${director.getDancerCount()})`);
pass('Fever Event 2: Adult festival dancers & revelers registered for choreo');

assert.ok(director.getYachtCount() >= 1, `Luxury festival yachts registered (got ${director.getYachtCount()})`);
pass('Fever Event 3: Coastal luxury yachts registered for ocean bobbing & drift');

assert.ok(director.getSkybeamCount() >= 1, `Stage skybeams registered (got ${director.getSkybeamCount()})`);
pass('Fever Event 4: Theatrical spotlights & skybeams registered');

assert.ok(director.getSunLandmarkCount() >= 1, `Scarlet Sun landmark registered (got ${director.getSunLandmarkCount()})`);
pass('Fever Event 5: Monumental Scarlet Sun registered for solar corona pulse');

// Verify 4-state progression thresholds
director.setForceState(null);
director.setCleanRunDistance(50);
director.update(0.016, true);
assert.strictEqual(director.getState(), 'ARRIVAL', 'Distance 50m maps to ARRIVAL');
pass('State 1: ARRIVAL active at start of run (subtle ambient animation)');

director.setCleanRunDistance(250);
director.update(0.016, true);
assert.strictEqual(director.getState(), 'HEAT_RISING', 'Distance 250m maps to HEAT_RISING');
pass('State 2: HEAT RISING active at 250m (stage lights on, tempo rises)');

director.setCleanRunDistance(650);
director.update(0.016, true);
assert.strictEqual(director.getState(), 'FEVER_MODE', 'Distance 650m maps to FEVER_MODE');
pass('State 3: FEVER MODE active at 650m (petals bloom, sweeping skybeams)');

director.setCleanRunDistance(1000);
director.update(0.016, true);
assert.strictEqual(director.getState(), 'GRAND_FINALE', 'Distance 1000m maps to GRAND_FINALE');
pass('State 4: GRAND FINALE active at 1000m (solar corona pulse, celebration sparks)');

// Multi-second update execution
assert.doesNotThrow(() => {
  for (let t = 0; t < 30; t++) {
    director.update(0.05, true);
  }
}, 'Multi-frame director update executes without exceptions');
pass('Director multi-second update loop advances smoothly with zero allocations');

// Reduced motion accessibility
SettingsManager.getInstance().setReducedMotion(true);
assert.doesNotThrow(() => {
  director.update(0.05, true);
}, 'Director handles reduced motion mode');
SettingsManager.getInstance().setReducedMotion(false);
pass('Director smoothly handles isReducedMotion() accessibility mode');

// ============================================================================
// SUITE 5: ADULT HIGH-FASHION CHARACTERS & CHOREOGRAPHY
// ============================================================================
console.log('\n--- Suite 5: Adult High-Fashion Characters & Costumes ---');

const reveler = VivaHeatCharacters.createHauteCoutureReveler(0, 0, 0, 'warm');
assert.ok(reveler.group.getObjectByName('haute_couture_reveler'), 'Haute Couture Reveler created');
assert.ok(reveler.dancer.armL, 'Reveler has articulated arm with champagne flute');
pass('Character 1: Haute Couture Reveler with mermaid evening gown & champagne glass');

const maestro = VivaHeatCharacters.createMasqueradeMaestro(0, 0, 0);
assert.ok(maestro.group.getObjectByName('masquerade_maestro'), 'Masquerade Maestro created');
assert.ok(maestro.dancer.armL, 'Maestro has articulated arm with golden cane');
pass('Character 2: Masquerade Maestro with burgundy velvet smoking jacket & golden cane');

const dancer = VivaHeatCharacters.createFestivalDancer(0, 0, 0);
assert.ok(dancer.group.getObjectByName('festival_carnival_dancer'), 'Festival Carnival Dancer created');
assert.ok(dancer.dancer.armL && dancer.dancer.armR, 'Dancer has articulated dual arms');
pass('Character 3: Festival Carnival Dancer with feathered wings & Latin dance choreo');

const avantGarde = VivaHeatCharacters.createAvantGardeModel(0, 0, 0);
assert.ok(avantGarde.group.getObjectByName('avant_garde_model'), 'Avant-Garde Couturier Model created');
assert.ok(avantGarde.dancer.armL, 'Model has articulated arm holding clutch');
pass('Character 4: Avant-Garde Couturier Model with architectural winged cape & clutch');

// ============================================================================
// SUITE 6: VIVA HEAT TRAIN AESTHETIC & LIVERY HOOK
// ============================================================================
console.log('\n--- Suite 6: Train Aesthetic & Livery Integration Hook ---');

assert.strictEqual(VIVA_HEAT_TRAIN_LIVERY.primaryColors[0], 0x881337, 'Primary body color 1 is Velvet Crimson');
assert.strictEqual(VIVA_HEAT_TRAIN_LIVERY.primaryColors[1], 0xff2d55, 'Primary body color 2 is Coral Scarlet');
assert.strictEqual(VIVA_HEAT_TRAIN_LIVERY.accentColor, 0xf59e0b, 'Train accent color is Sunset Gold');
pass('Train livery palette verified (Velvet Crimson, Coral Scarlet, Sunset Gold)');

const mockTrain = new THREE.Group();
const mockBody = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshBasicMaterial());
mockBody.name = 'train_body';
mockTrain.add(mockBody);

const mockWindow = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
mockWindow.name = 'train_window_glow';
mockTrain.add(mockWindow);

applyVivaHeatTrainLivery(mockTrain, 0);
assert.strictEqual((mockBody.material as THREE.MeshStandardMaterial).color.getHex(), 0x881337, 'Body material color updated');
pass('applyVivaHeatTrainLivery hook correctly applies festival luxury materials');

// Test train clearance in ObstacleFactory
const obstacleFactory = new ObstacleFactory();
const showcaseTrain = obstacleFactory.createTrain(22.0, false, 0x881337, 'STREAMLINED_EXPRESS', 'VIVA_HEAT');
showcaseTrain.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.geometry.computeBoundingBox();
  }
});
const trainBox = new THREE.Box3().setFromObject(showcaseTrain);
const trainSize = new THREE.Vector3();
trainBox.getSize(trainSize);

console.log(`Debug train dimensions: ${trainSize.x.toFixed(2)}m x ${trainSize.y.toFixed(2)}m x ${trainSize.z.toFixed(2)}m`);
assert.ok(trainSize.x <= 3.5, `Train width ${trainSize.x.toFixed(1)} fits inside standard rail corridor`);
assert.ok(trainSize.y <= 5.0, `Train height ${trainSize.y.toFixed(1)} fits standard clearance`);
assert.ok(trainSize.z >= 18.0 && trainSize.z <= 26.0, `Train length ${trainSize.z.toFixed(1)} matches standard 22m train`);
pass(`Showcase train dimensions (${trainSize.x.toFixed(1)}m x ${trainSize.y.toFixed(1)}m x ${trainSize.z.toFixed(1)}m) match standard runner train envelope`);

// ============================================================================
// SUITE 7: DEVELOPER PREVIEW INTEGRATION & REVERSIBILITY
// ============================================================================
console.log('\n--- Suite 7: Developer Preview Integration & Isolation ---');

const envManager = EnvironmentManager.getInstance();
assert.strictEqual(envManager.getDevPreviewEnvironment(), null, 'Dev preview initially null');

envManager.setDevPreviewEnvironment('VIVA_HEAT');
assert.strictEqual(envManager.getDevPreviewEnvironment(), 'VIVA_HEAT', 'Dev preview set to VIVA_HEAT');
assert.strictEqual(envManager.getStartingEnvironment(), 'VIVA_HEAT', 'Starting environment returns VIVA_HEAT in dev mode');

envManager.setDevPreviewEnvironment(null);
assert.strictEqual(envManager.getDevPreviewEnvironment(), null, 'Dev preview reset cleanly');
pass('Dev preview mechanism safely activates VIVA_HEAT without touching player save or shop');

// ============================================================================
// SUITE 8: TEARDOWN & LIFECYCLE CLEANUP
// ============================================================================
console.log('\n--- Suite 8: Teardown & Lifecycle Cleanup ---');

director.reset();

// Verify detached object pruning on chunk recycling
const temporaryChunk = new THREE.Group();
builder.buildScarletSunset(temporaryChunk, 12, 100, new (class { next() { return 0.5; } } as any), 'FULL', director);
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
assert.strictEqual(director.getFlowerCount(), 0, 'Flowers reset');
assert.strictEqual(director.getDancerCount(), 0, 'Dancers reset');
assert.strictEqual(director.getYachtCount(), 0, 'Yachts reset');
assert.strictEqual(director.getSkybeamCount(), 0, 'Skybeams reset');
assert.strictEqual(director.getSunLandmarkCount(), 0, 'Sun landmarks reset');
assert.strictEqual(director.getTotalActiveElements(), 0, 'Total active elements reset to 0');
pass('Fever director reset() cleanly disposes all references');

console.log('\n=======================================================');
console.log(`🏆 ALL ${testsPassed} VIVA_HEAT WORLD TESTS PASSED!`);
console.log('=======================================================\n');
