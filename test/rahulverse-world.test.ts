import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import {
  ENVIRONMENTS,
  EnvironmentTheme,
  EnvironmentManager
} from '../src/environment/EnvironmentConfig';
import { RAHULVERSE_THEME } from '../src/environment/worlds/rahulverse/RahulverseTheme';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import {
  PREMIUM_WORLDS,
  getWorld,
  getWorlds
} from '../src/environment/WorldCatalog';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { getCharacterById, getAllCharacters } from '../src/characters/CharacterCatalog';
import { RahulComedyEventDirector } from '../src/environment/worlds/rahulverse/RahulComedyEventDirector';

const PROGRESSION_STORAGE_KEY = 'metro_progression_v1';

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

console.log('🧪 Starting RAHULVERSE (Rahul Gandhi Signature World) Verification Suite...\n');

// =========================================================================
// Suite 1: Theme Identity, Catalog & Registry
// =========================================================================
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');

check(RAHULVERSE_THEME !== undefined, 'RAHULVERSE_THEME is defined');
check(RAHULVERSE_THEME.id === 'RAHULVERSE', 'Theme ID is RAHULVERSE');
check(RAHULVERSE_THEME.displayName.includes('Rahulverse'), 'Theme displayName includes Rahulverse');
check(ENVIRONMENTS['RAHULVERSE'] !== undefined, 'RAHULVERSE is registered in ENVIRONMENTS');

const registry = EnvironmentRegistry.getInstance();
check(registry.has('RAHULVERSE'), 'Registry contains RAHULVERSE');
const regTheme = registry.get('RAHULVERSE');
check(regTheme.id === 'RAHULVERSE', 'Registry returns valid RAHULVERSE theme');

// Lighting, fog and colors
check(regTheme.materials.curbColor === 0xf59e0b, 'Ground curb color matches turmeric yellow curb');
check(regTheme.ambience.tag === 'RAHUL_YATRA_CHEERS', 'Audio ambience tag is RAHUL_YATRA_CHEERS');

// Catalog metadata & Signature properties
const catalogEntry = getWorld('RAHULVERSE');
check(catalogEntry !== undefined, 'RAHULVERSE exists in WorldCatalog');
check(catalogEntry?.isSignatureWorld === true, 'RAHULVERSE is flagged as signature world');
check(catalogEntry?.signatureCharacterId === 'char_rahul_gandhi', 'RAHULVERSE is associated with char_rahul_gandhi');
check(catalogEntry?.signatureLabel === 'RAHUL SIGNATURE WORLD', 'Has badge RAHUL SIGNATURE WORLD');
check(catalogEntry?.dynamicEligible === false, 'RAHULVERSE is excluded from dynamic districts (dynamicEligible = false)');
check(catalogEntry?.unlock === 'FREE', 'RAHULVERSE has 0 extra coin cost (unlock: FREE with Rahul Gandhi)');
check(catalogEntry?.previewImage === '/worlds/rahulverse.png', 'Preview image is /worlds/rahulverse.png');

// Verify Rahul Gandhi character catalog & outfits
const rahulChar = getCharacterById('char_rahul_gandhi');
check(rahulChar !== undefined, 'char_rahul_gandhi exists in CharacterCatalog');
check(rahulChar?.outfits.length >= 5, 'Rahul Gandhi has at least 5 distinct outfits');
check(rahulChar?.defaultOutfitId === 'rahul_classic', 'Default outfit is rahul_classic');
check(rahulChar?.outfits.some(o => o.id === 'rahul_kurta'), 'Contains rahul_kurta outfit');
check(rahulChar?.outfits.some(o => o.id === 'rahul_winter'), 'Contains rahul_winter outfit');
check(rahulChar?.outfits.some(o => o.id === 'rahul_parliament'), 'Contains rahul_parliament outfit');
check(rahulChar?.outfits.some(o => o.id === 'rahul_legend'), 'Contains rahul_legend outfit');

// =========================================================================
// Suite 2: Signature World Progression, Bundling & Selection Preservation
// =========================================================================
console.log('\n--- Suite 2: Progression, Bundling & Selection Preservation ---');

const progression = ProgressionManager.getInstance();
const baselineProg = JSON.parse(JSON.stringify(progression.getState()));

function resetProgState() {
  storage.clear();
  storage.setItem(PROGRESSION_STORAGE_KEY, JSON.stringify(baselineProg));
  progression.load();
}

resetProgState();

// Test A: If Rahul is not unlocked and has 0 free runs, RAHULVERSE is not unlocked
progression.setRahulTrialsRemaining(0);
check(!progression.isThemeUnlocked('RAHULVERSE'), 'RAHULVERSE is locked when Rahul is not owned and has 0 free runs');

// Test B: While Rahul has free trial runs active, RAHULVERSE can be selected
progression.setRahulTrialsRemaining(3);
check(progression.isThemeUnlocked('RAHULVERSE'), 'RAHULVERSE is available during active Rahul free trial runs');

// Test C: Equipping Rahul automatically equips RAHULVERSE and preserves prior theme
progression.getState().selectedTheme = 'MODERN_METRO';
progression.equipCharacter('char_rahul_gandhi');
check(progression.getSelectedTheme() === 'RAHULVERSE', 'Equipping Rahul switches theme to RAHULVERSE');
check(progression.getState().priorThemeBeforeSignature === 'MODERN_METRO', 'Prior theme MODERN_METRO saved in priorThemeBeforeSignature');

// Test D: Switching away from Rahul restores the prior theme
progression.equipCharacter('char_jax');
check(progression.getSelectedTheme() === 'MODERN_METRO', 'Switching back to Jax restores prior theme MODERN_METRO');
check(progression.getState().priorThemeBeforeSignature === undefined, 'priorThemeBeforeSignature cleared after restoration');

// Test E: When Rahul is permanently unlocked, RAHULVERSE is permanently owned with 0 coin cost
progression.getState().unlockedCharacters = ['char_jax', 'char_rahul_gandhi'];
check(progression.isThemeUnlocked('RAHULVERSE'), 'RAHULVERSE is permanently unlocked when Rahul is owned');
const worldsList = getWorlds(progression.getState());
const rahulWorld = worldsList.find((w) => w.id === 'RAHULVERSE');
check(rahulWorld?.owned === true, 'RAHULVERSE is marked owned in WorldCatalog when Rahul is owned');

// =========================================================================
// Suite 3: Procedural 3D Scenery Generation & Collision Clearance Envelope
// =========================================================================
console.log('\n--- Suite 3: Procedural 3D Scenery Generation & Collision Clearance ---');

const sceneryFactory = SceneryFactory.getInstance();
const decorativeGroup = new THREE.Group();

sceneryFactory.buildScenery(decorativeGroup, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 100);

const rahulScenery = decorativeGroup.getObjectByName('rahulverse_scenery');
check(rahulScenery !== undefined, 'Scenery contains rahulverse_scenery group');

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
// Suite 4: Verification of All 5 Comedy Districts
// =========================================================================
console.log('\n--- Suite 4: Verification of All 5 Comedy Districts ---');

// District A: Yatra Never Ends
const gA = new THREE.Group();
sceneryFactory.buildScenery(gA, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 0);
check(gA.getObjectByName('district_a_yatra_never_ends') !== undefined, 'District A: Yatra Never Ends exists');
check(gA.getObjectByName('yatra_finish_flip_arch') !== undefined, 'District A: Flip finish arch exists');

// District B: Parliament Pandemonium
const gB = new THREE.Group();
sceneryFactory.buildScenery(gB, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 1);
check(gB.getObjectByName('district_b_parliament_pandemonium') !== undefined, 'District B: Parliament Pandemonium exists');
check(gB.getObjectByName('runaway_microphone_arm') !== undefined, 'District B: Runaway microphone arm exists');

// District C: Press Conference Panic
const gC = new THREE.Group();
sceneryFactory.buildScenery(gC, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 2);
check(gC.getObjectByName('district_c_press_conference_panic') !== undefined, 'District C: Press Conference Panic exists');
check(gC.getObjectByName('media_conga_line') !== undefined, 'District C: Media conga line exists');

// District D: Alliance Rollercoaster
const gD = new THREE.Group();
sceneryFactory.buildScenery(gD, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 3);
check(gD.getObjectByName('district_d_alliance_rollercoaster') !== undefined, 'District D: Alliance Rollercoaster exists');
check(gD.getObjectByName('middle_seat_dispute') !== undefined, 'District D: Middle seat dispute exists');

// District E: The Great Political Multiverse
const gE = new THREE.Group();
sceneryFactory.buildScenery(gE, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 4);
check(gE.getObjectByName('district_e_political_multiverse') !== undefined, 'District E: Political Multiverse exists');
check(gE.getObjectByName('multiverse_vortex_portal') !== undefined, 'District E: Multiverse vortex portal exists');

// =========================================================================
// Suite 5: Rahulverse Playable Train Livery & Hitboxes
// =========================================================================
console.log('\n--- Suite 5: Rahulverse Train Livery & Hitboxes ---');

const obstacleFactory = new ObstacleFactory();
const rahulTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0xffffff, undefined, 'RAHULVERSE');

check(rahulTrain !== undefined, 'ObstacleFactory creates Rahulverse train');
check(rahulTrain.userData.isTrain === true, 'userData.isTrain is true');
check(rahulTrain.userData.variant === 'STREAMLINED_EXPRESS', 'Rahulverse uses STREAMLINED_EXPRESS variant');

// =========================================================================
// Suite 6: Comedy Event Director Animation Update & Reduced Motion
// =========================================================================
console.log('\n--- Suite 6: Comedy Event Director Animation Update ---');

const director = RahulComedyEventDirector.getInstance();
check(director !== undefined, 'RahulComedyEventDirector instance exists');

// Update with normal motion
director.update(0.016, true);
check(true, 'Director updates without error with delta time');

// Update with 0 delta
director.update(0.0, true);
check(true, 'Director handles 0 delta gracefully');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} RAHULVERSE SIGNATURE WORLD TESTS PASSED!`);
console.log(`=======================================================\n`);
