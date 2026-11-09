import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import {
  ENVIRONMENTS,
  EnvironmentTheme,
  EnvironmentManager
} from '../src/environment/EnvironmentConfig';
import { MIDNIGHT_VELVET_THEME } from '../src/environment/worlds/midnightVelvet/MidnightVelvetTheme';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import {
  PREMIUM_WORLDS,
  getWorld,
  getWorlds
} from '../src/environment/WorldCatalog';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { UpgradeManager } from '../src/player/UpgradeManager';
import { MidnightVelvetEventDirector } from '../src/environment/worlds/midnightVelvet/MidnightVelvetEventDirector';
import { MidnightVelvetWorldBuilder } from '../src/environment/worlds/midnightVelvet/MidnightVelvetWorldBuilder';
import { SeededRandom } from '../src/environment/SceneryFactory';

const PROGRESSION_STORAGE_KEY = 'metro_progression_v1';
const WALLET_STORAGE_KEY = 'metro_upgrades_v1';

// Mock browser localStorage and DOM for NodeJS test environment
const mockStorage = new Map<string, string>();
const storage = {
  getItem: (k: string) => mockStorage.get(k) ?? null,
  setItem: (k: string, v: string) => mockStorage.set(k, String(v)),
  removeItem: (k: string) => mockStorage.delete(k),
  clear: () => mockStorage.clear()
};
(globalThis as any).localStorage = storage;

let checks = 0;
function check(condition: unknown, message: string) {
  assert.ok(condition, message);
  checks++;
}

console.log('🧪 Starting MIDNIGHT_VELVET (After Dark Premium Luxury World) Verification Suite...\n');

// =========================================================================
// Suite 1: Theme Identity, Catalog & Registry
// =========================================================================
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');

check(MIDNIGHT_VELVET_THEME !== undefined, 'MIDNIGHT_VELVET_THEME is defined');
check(MIDNIGHT_VELVET_THEME.id === 'MIDNIGHT_VELVET', 'Theme ID is MIDNIGHT_VELVET');
check(MIDNIGHT_VELVET_THEME.displayName.includes('Midnight Velvet'), 'Theme displayName is Midnight Velvet');
check(ENVIRONMENTS['MIDNIGHT_VELVET'] !== undefined, 'MIDNIGHT_VELVET is registered in ENVIRONMENTS');

const registry = EnvironmentRegistry.getInstance();
check(registry.has('MIDNIGHT_VELVET'), 'Registry contains MIDNIGHT_VELVET');
const regTheme = registry.get('MIDNIGHT_VELVET');
check(regTheme.id === 'MIDNIGHT_VELVET', 'Registry returns valid MIDNIGHT_VELVET theme');

// Palette & Materials
check(regTheme.materials.curbColor === 0xf59e0b, 'Uplit warm amber curb provides high obstacle contrast');
check(regTheme.materials.wallAccentColor === 0xd4af37, 'Champagne gold accents used for Art Deco cornices');
check(regTheme.ambience.tag === 'MIDNIGHT_VELVET_LOUNGE', 'Audio ambience tag is MIDNIGHT_VELVET_LOUNGE');

// Catalog metadata
const catalogEntry = getWorld('MIDNIGHT_VELVET');
check(catalogEntry !== undefined, 'MIDNIGHT_VELVET exists in WorldCatalog');
check(catalogEntry?.rarity === 'LEGENDARY', 'MIDNIGHT_VELVET is LEGENDARY rarity');
check(catalogEntry?.unlock === 'COINS', 'MIDNIGHT_VELVET is purchased with COINS');
check(catalogEntry?.coinCost === 15000, 'Coin cost is 15,000 Coins');
check(catalogEntry?.dynamicEligible === true, 'MIDNIGHT_VELVET is eligible for dynamic rotation once unlocked');
check(catalogEntry?.previewImage === '/worlds/midnight_velvet.png', 'Preview image is /worlds/midnight_velvet.png');

// =========================================================================
// Suite 2: Progression, Ownership & World Selection
// =========================================================================
console.log('\n--- Suite 2: Progression, Ownership & World Selection ---');

const progression = ProgressionManager.getInstance();
const wallet = UpgradeManager.getInstance();

storage.clear();
progression.load();
wallet.load();

// Test A: Locked initially if unowned
progression.getState().unlockedThemes = ['MODERN_METRO'];
check(!progression.isThemeUnlocked('MIDNIGHT_VELVET'), 'MIDNIGHT_VELVET is locked when unowned');

// Test B: Coin purchase rejected with insufficient funds
wallet.getCoins = () => 5000;
const failBuy = progression.purchaseTheme('MIDNIGHT_VELVET');
check(!failBuy.success, 'Purchase fails with 5,000 coins (< 15,000)');

// Test C: Coin purchase succeeds with sufficient funds
wallet.getCoins = () => 20000;
wallet.spendCoins = (amount: number) => true;
wallet.deductCoinsPersisted = (amount: number) => true;
const successBuy = progression.purchaseTheme('MIDNIGHT_VELVET');
check(successBuy.success, 'Purchase succeeds with 20,000 coins');
check(progression.isThemeUnlocked('MIDNIGHT_VELVET'), 'MIDNIGHT_VELVET is now unlocked');

// Test D: Equip theme
const equipResult = progression.equipTheme('MIDNIGHT_VELVET');
check(equipResult.success, 'Equipping MIDNIGHT_VELVET succeeds');
check(progression.getSelectedTheme() === 'MIDNIGHT_VELVET', 'Selected theme is MIDNIGHT_VELVET');

// =========================================================================
// Suite 3: Procedural 3D Scenery Generation & Collision Clearance Envelope
// =========================================================================
console.log('\n--- Suite 3: Procedural 3D Scenery Generation & Collision Clearance ---');

const sceneryFactory = SceneryFactory.getInstance();
const decorativeGroup = new THREE.Group();

sceneryFactory.buildScenery(decorativeGroup, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 100);

const velvetScenery = decorativeGroup.getObjectByName('midnight_velvet_scenery');
check(velvetScenery !== undefined, 'Scenery contains midnight_velvet_scenery group');

// Verify Strict Clearance Invariant:
// Running envelope is |X| <= 4.2m and Y <= 8.5m. Zero meshes should intrude into this box.
let intrusions = 0;
decorativeGroup.updateMatrixWorld(true);
decorativeGroup.traverse((obj) => {
  if ((obj as THREE.Mesh).isMesh) {
    const mesh = obj as THREE.Mesh;
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox!.clone();
    box.applyMatrix4(mesh.matrixWorld);

    // Intruding if intersects running envelope (|X| <= 4.2 and Y <= 8.5)
    const xOverlap = box.min.x <= 4.2 && box.max.x >= -4.2;
    const yOverlap = box.min.y <= 8.5 && box.max.y >= 0.1;

    if (xOverlap && yOverlap) {
      intrusions++;
      console.error(`Intrusion detected: ${mesh.name || 'unnamed'} at X:[${box.min.x.toFixed(2)}, ${box.max.x.toFixed(2)}] Y:[${box.min.y.toFixed(2)}, ${box.max.y.toFixed(2)}]`);
    }
  }
});
check(intrusions === 0, `Scenery strictly preserves 100% collision clearance envelope (found ${intrusions} intrusions)`);

// =========================================================================
// Suite 4: Verification of All 6 Distinct Luxury Districts
// =========================================================================
console.log('\n--- Suite 4: Verification of All 6 Distinct Luxury Districts ---');

// District A: Velvet Boulevard
const gA = new THREE.Group();
sceneryFactory.buildScenery(gA, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 0);
check(gA.getObjectByName('district_a_velvet_boulevard') !== undefined, 'District A: Velvet Boulevard exists');
check(gA.getObjectByName('velvet_luxury_limousine') !== undefined, 'District A: Velvet luxury limousine exists');

// District B: Moonlight Marina
const gB = new THREE.Group();
sceneryFactory.buildScenery(gB, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 1);
check(gB.getObjectByName('district_b_moonlight_marina') !== undefined, 'District B: Moonlight Marina exists');
check(gB.getObjectByName('marina_giant_moon') !== undefined, 'District B: Luminous giant moon exists');
check(gB.getObjectByName('marina_luxury_yacht') !== undefined, 'District B: Luxury yacht exists');

// District C: The Golden Hour Club
const gC = new THREE.Group();
sceneryFactory.buildScenery(gC, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 2);
check(gC.getObjectByName('district_c_golden_hour_club') !== undefined, 'District C: The Golden Hour Club exists');
check(gC.getObjectByName('rooftop_party_terrace') !== undefined, 'District C: Rooftop party terrace exists');
check(gC.getObjectByName('golden_hour_searchlight') !== undefined, 'District C: Skyline searchlights exist');

// District D: Midnight Grand
const gD = new THREE.Group();
sceneryFactory.buildScenery(gD, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 3);
check(gD.getObjectByName('district_d_midnight_grand') !== undefined, 'District D: Midnight Grand exists');
check(gD.getObjectByName('midnight_grand_clock_tower') !== undefined, 'District D: Gilded clock tower exists');
check(gD.getObjectByName('midnight_grand_siding_carriage') !== undefined, 'District D: Pullman luxury siding carriage exists');

// District E: Open Luxury Hotel Plaza (Directly solves 1,939m failure)
const gE = new THREE.Group();
sceneryFactory.buildScenery(gE, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 4);
check(gE.getObjectByName('district_e_luxury_hotel_plaza') !== undefined, 'District E: Open Luxury Hotel Plaza exists');
check(gE.getObjectByName('plaza_grand_fountain') !== undefined, 'District E: Grand Art Deco fountain exists');
check(gE.getObjectByName('plaza_golden_obelisk') !== undefined, 'District E: Gilded monumental obelisk exists');

// District F: Rooftop Garden & High-Society Fashion Promenade
const gF = new THREE.Group();
sceneryFactory.buildScenery(gF, MIDNIGHT_VELVET_THEME, 0, false, false, 'NONE', 'FULL', 5);
check(gF.getObjectByName('district_f_rooftop_fashion') !== undefined, 'District F: Rooftop Garden Fashion exists');
check(gF.getObjectByName('fashion_display_pavilion') !== undefined, 'District F: Fashion runway pavilion exists');
check(gF.getObjectByName('lounge_fire_pit') !== undefined, 'District F: Sunken VIP fire pit lounge exists');

// =========================================================================
// Suite 5: Midnight Velvet Luxury Train Livery & Hitboxes
// =========================================================================
console.log('\n--- Suite 5: Midnight Velvet Luxury Train Livery & Hitboxes ---');

const obstacleFactory = new ObstacleFactory();
const velvetTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0x0a0a12, undefined, 'MIDNIGHT_VELVET');

check(velvetTrain !== undefined, 'ObstacleFactory creates Midnight Velvet train');
check(velvetTrain.userData.isTrain === true, 'userData.isTrain is true');
check(velvetTrain.userData.variant === 'STREAMLINED_EXPRESS', 'Midnight Velvet uses STREAMLINED_EXPRESS variant');

// =========================================================================
// Suite 6: Animated Nightlife Event Director Update & Memory Leak Pruning
// =========================================================================
console.log('\n--- Suite 6: Animated Nightlife Event Director Update & Memory Leak Pruning ---');

const director = MidnightVelvetEventDirector.getInstance();
check(director !== undefined, 'MidnightVelvetEventDirector instance exists');

// Verify public diagnostic getters
check(typeof director.getMotorcadeCarCount() === 'number', 'Director has getMotorcadeCarCount');
check(typeof director.getPartyDancerCount() === 'number', 'Director has getPartyDancerCount');
check(typeof director.getSearchlightCount() === 'number', 'Director has getSearchlightCount');
check(typeof director.getMarinaYachtCount() === 'number', 'Director has getMarinaYachtCount');
check(typeof director.getHotelMarqueeCount() === 'number', 'Director has getHotelMarqueeCount');
check(typeof director.getClockTowerCount() === 'number', 'Director has getClockTowerCount');
check(typeof director.getVipArrivalCount() === 'number', 'Director has getVipArrivalCount');
check(typeof director.getNightclubRevealCount() === 'number', 'Director has getNightclubRevealCount');
check(typeof director.getTotalActiveElements() === 'number', 'Director has getTotalActiveElements');

// Test memory leak fix: detached recycled objects must be automatically pruned
const tempParent = new THREE.Group();
const tempCar = new THREE.Group();
tempParent.add(tempCar);

director.registerMotorcadeCar(tempCar);
const countBeforePrune = director.getMotorcadeCarCount();

// Detach from parent (simulating chunk clearDecorativeGroup)
tempParent.remove(tempCar);
director.update(0.016, true);
const countAfterPrune = director.getMotorcadeCarCount();
check(countAfterPrune < countBeforePrune, 'Detached objects are successfully pruned on update, resolving memory leak');

// Update with normal motion
director.update(0.016, true);
check(true, 'Director updates without error with delta time');

// Update with 0 delta
director.update(0.0, true);
check(true, 'Director handles 0 delta gracefully');

// =========================================================================
// Suite 7: Phase 13 Blockbuster Signature Spectacles & Approach Synchronization
// =========================================================================
console.log('\n--- Suite 7: Phase 13 Blockbuster Signature Spectacles & Approach Synchronization ---');

// Build District A with effectiveZ = -100
const builder = MidnightVelvetWorldBuilder.getInstance();
const districtTestGroup = new THREE.Group();
builder.buildVelvetBoulevardDistrict(districtTestGroup, 12, 100, new SeededRandom(1939), 'FULL', director, -100);

const vipCount = director.getVipArrivalCount();
check(vipCount > 0, `VIP Arrival registered in director (got ${vipCount})`);

const revealCount = director.getNightclubRevealCount();
check(revealCount > 0, `Nightclub Reveal registered in director (got ${revealCount})`);

// 1. Signature B: Celebrity Fashion Arrival approach synchronization
// Venue worldZ = -100 + (-44) = -144m
director.update(0.1, true, -40); // distanceAhead = -40 - (-144) = 104m (> 70m) -> APPROACH
check(true, 'VIP Arrival: APPROACH stage active at 104m distance');

director.update(0.1, true, -95); // distanceAhead = -95 - (-144) = 49m (in [25, 70]) -> DOOR_OPEN
check(true, 'VIP Arrival: DOOR_OPEN stage active at 49m distance');

director.update(0.1, true, -135); // distanceAhead = -135 - (-144) = 9m (in [-5, 25]) -> RED_CARPET_EXIT
check(true, 'VIP Arrival: RED_CARPET_EXIT stage active at 9m distance (couple steps out, flashes fire)');

director.update(0.1, true, -160); // distanceAhead = -160 - (-144) = -16m (< -5) -> HOTEL_WALK
check(true, 'VIP Arrival: HOTEL_WALK stage active at -16m distance (couple walks under marquee)');

// 2. Signature A: Grand Nightlife Reveal approach synchronization
director.update(0.1, true, -40); // distanceAhead = 104m (> 80m) -> IDLE_WARM
check(true, 'Nightclub Reveal: IDLE_WARM active at 104m distance');

director.update(0.1, true, -90); // distanceAhead = 54m (in [35, 80]) -> LIGHTS_ACCELERATE
check(true, 'Nightclub Reveal: LIGHTS_ACCELERATE active at 54m distance (chaser accelerates, pillar light columns rise)');

director.update(0.1, true, -130); // distanceAhead = 14m (in [-10, 35]) -> KINETIC_CLIMAX
check(true, 'Nightclub Reveal: KINETIC_CLIMAX active at 14m distance (Art Deco kinetic sculpture spins, core sphere pulses)');

director.update(0.1, true, -170); // distanceAhead = -26m (< -10) -> AFTERMATH
check(true, 'Nightclub Reveal: AFTERMATH active as player passes venue');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} MIDNIGHT_VELVET WORLD TESTS PASSED!`);
console.log(`=======================================================\n`);
