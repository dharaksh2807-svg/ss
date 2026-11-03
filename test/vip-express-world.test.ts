import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import {
  ENVIRONMENTS,
  VIP_EXPRESS_THEME,
  EnvironmentTheme,
  EnvironmentManager
} from '../src/environment/EnvironmentConfig';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import {
  PREMIUM_WORLDS,
  getWorld,
  getWorlds
} from '../src/environment/WorldCatalog';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { CurvedWorldManager } from '../src/scene/CurvedWorld';
import { WorldScene } from '../src/scene/WorldScene';
import { ProgressionManager } from '../src/progression/ProgressionManager';
import { getCharacterById } from '../src/characters/CharacterCatalog';

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

console.log('🧪 Starting VIP_EXPRESS (Modi Signature World) Verification Suite...\n');

// =========================================================================
// Suite 1: Theme Identity, Catalog & Registry
// =========================================================================
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');

check(VIP_EXPRESS_THEME !== undefined, 'VIP_EXPRESS_THEME is defined');
check(VIP_EXPRESS_THEME.id === 'VIP_EXPRESS', 'Theme ID is VIP_EXPRESS');
check(VIP_EXPRESS_THEME.displayName.includes('VIP Express'), 'Theme displayName is VIP Express');
check(ENVIRONMENTS['VIP_EXPRESS'] === VIP_EXPRESS_THEME, 'VIP_EXPRESS is registered in ENVIRONMENTS');

const registry = EnvironmentRegistry.getInstance();
check(registry.has('VIP_EXPRESS'), 'Registry contains VIP_EXPRESS');
const regTheme = registry.get('VIP_EXPRESS');
check(regTheme.id === 'VIP_EXPRESS', 'Registry returns valid VIP_EXPRESS theme');

// Lighting, fog and colors
check(regTheme.sun.color === 0xfffbeb, 'Sunlight has warm golden ivory glow');
check(regTheme.sky.top === 0x1e3a8a, 'Sky top has deep royal ceremonial navy blue');
check(regTheme.materials.curbColor === 0xd4a373, 'Ground sandstone ballast color matches Indian civic palette');
check(regTheme.ambience.tag === 'VIP_CEREMONIAL_FANFARE', 'Audio ambience tag is VIP_CEREMONIAL_FANFARE');

// Catalog metadata & Signature properties
const catalogEntry = getWorld('VIP_EXPRESS');
check(catalogEntry !== undefined, 'VIP_EXPRESS exists in WorldCatalog');
check(catalogEntry?.isSignatureWorld === true, 'VIP_EXPRESS is flagged as signature world');
check(catalogEntry?.signatureCharacterId === 'char_modi', 'VIP_EXPRESS is associated with char_modi');
check(catalogEntry?.signatureLabel === 'MODI SIGNATURE WORLD', 'Has badge MODI SIGNATURE WORLD');
check(catalogEntry?.dynamicEligible === false, 'VIP_EXPRESS is excluded from dynamic districts (dynamicEligible = false)');
check(catalogEntry?.unlock === 'FREE', 'VIP_EXPRESS has 0 extra coin cost (unlock: FREE with Modi)');
check(catalogEntry?.previewImage === '/worlds/vip_express.png', 'Preview image is /worlds/vip_express.png');

// Verify existing character model integrity
const modiChar = getCharacterById('char_modi');
check(modiChar !== undefined, 'char_modi exists in CharacterCatalog');
check(modiChar?.glbPath === '/characters/modi/character.glb', 'char_modi uses existing /characters/modi/character.glb without regeneration');

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

// Test A: If Modi is not unlocked and has 0 free runs, VIP_EXPRESS is not unlocked
progression.getState().modiFreeRuns = 0;
check(!progression.isThemeUnlocked('VIP_EXPRESS'), 'VIP_EXPRESS is locked when Modi is not owned and has 0 free runs');

// Test B: While Modi has free trial runs active, VIP_EXPRESS can be previewed/selected
progression.getState().modiFreeRuns = 3;
check(progression.isThemeUnlocked('VIP_EXPRESS'), 'VIP_EXPRESS is available during active Modi free trial runs');

// Test C: Equipping Modi automatically equips VIP_EXPRESS and preserves prior theme
progression.getState().selectedTheme = 'HISTORIC_QUARTER';
progression.equipCharacter('char_modi');
check(progression.getSelectedTheme() === 'VIP_EXPRESS', 'Equipping Modi switches theme to VIP_EXPRESS');
check(progression.getState().priorThemeBeforeSignature === 'HISTORIC_QUARTER', 'Prior theme HISTORIC_QUARTER saved in priorThemeBeforeSignature');

// Test D: Switching away from Modi restores the prior theme
progression.equipCharacter('char_jax');
check(progression.getSelectedTheme() === 'HISTORIC_QUARTER', 'Switching back to Jax restores prior theme HISTORIC_QUARTER');
check(progression.getState().priorThemeBeforeSignature === undefined, 'priorThemeBeforeSignature cleared after restoration');

// Test E: When Modi is permanently unlocked, VIP_EXPRESS is permanently owned with 0 coin cost
progression.getState().unlockedCharacters = ['char_jax', 'char_modi'];
check(progression.isThemeUnlocked('VIP_EXPRESS'), 'VIP_EXPRESS is permanently unlocked when Modi is owned');
const worldsList = getWorlds(progression.getState());
const vipWorld = worldsList.find((w) => w.id === 'VIP_EXPRESS');
check(vipWorld?.owned === true, 'VIP_EXPRESS is marked owned in WorldCatalog when Modi is owned');

// =========================================================================
// Suite 3: Procedural 3D Scenery Generation & Collision Clearance Envelope
// =========================================================================
console.log('\n--- Suite 3: Procedural 3D Scenery Generation & Collision Clearance ---');

const sceneryFactory = SceneryFactory.getInstance();
const decorativeGroup = new THREE.Group();
const roadbedWidth = CONSTANTS.LANE_WIDTH * 3 + 2.8;
const curbWidth = 0.5;
const chunkLength = CONSTANTS.CHUNK_LENGTH;

sceneryFactory.buildScenery(decorativeGroup, VIP_EXPRESS_THEME, 0, false, false, 'NONE', 'FULL', 12345);

const vipScenery = decorativeGroup.getObjectByName('vip_express_scenery');
check(vipScenery !== undefined, 'Scenery contains vip_express_scenery group');

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
    const yOverlap = box.min.y <= 8.5;

    if (xOverlap && yOverlap) {
      intrusions++;
      console.error(`Intrusion detected: ${mesh.name || 'unnamed'} at X:[${box.min.x.toFixed(2)}, ${box.max.x.toFixed(2)}] Y:[${box.min.y.toFixed(2)}, ${box.max.y.toFixed(2)}]`);
    }
  }
});
check(intrusions === 0, `Scenery strictly preserves 100% collision clearance envelope (found ${intrusions} intrusions)`);

// =========================================================================
// Suite 4: Verification of All 6 Required Background Comedy Events
// =========================================================================
console.log('\n--- Suite 4: Verification of All 6 Required Comedy Events ---');

// Event A: Never-Ending Ribbon Ceremony
const ribbonCeremony = decorativeGroup.getObjectByName('vip_ribbon_ceremony');
check(ribbonCeremony !== undefined, 'Event A: vip_ribbon_ceremony exists in scenery graph');
check(ribbonCeremony!.position.x < -15.0, 'Ribbon ceremony safely placed outside tracks (X < -15m)');

// Event B: Camera Crew Chaos
const cameraCrew = decorativeGroup.getObjectByName('vip_camera_crew');
check(cameraCrew !== undefined, 'Event B: vip_camera_crew exists in scenery graph');
check(cameraCrew!.position.x > 15.0, 'Camera crew scaffolding placed outside tracks (X > 15m)');

// Event C: The Eternal Photo Opportunity ("ONE MORE PHOTO!")
const photoOp = decorativeGroup.getObjectByName('vip_photo_op');
check(photoOp !== undefined, 'Event C: vip_photo_op exists in scenery graph');
check(photoOp!.position.x < -14.0, 'Photo op installation placed outside tracks (X < -14m)');

// Event D: VIP Traffic Control (stuck SUVs behind single cone)
const trafficJam = decorativeGroup.getObjectByName('vip_traffic_jam');
check(trafficJam !== undefined, 'Event D: vip_traffic_jam exists in scenery graph');

// Event E: Grand Opening of Another Grand Opening (twin triumphal arches)
const doubleOpening = decorativeGroup.getObjectByName('vip_double_opening');
check(doubleOpening !== undefined, 'Event E: vip_double_opening exists in scenery graph');
check(doubleOpening!.children.length === 2, 'Double opening contains twin arches (Part 1 and Part 2)');

// Event F: Announcement Tower (digital ticker monolith)
const announcementTower = decorativeGroup.getObjectByName('vip_announcement_tower');
check(announcementTower !== undefined, 'Event F: vip_announcement_tower exists in scenery graph');

// =========================================================================
// Suite 5: Distinct Landmark Variations
// =========================================================================
console.log('\n--- Suite 5: Distinct Landmark Variations ---');

const landmarks = ['vip_ceremonial_plaza', 'vip_press_enclosure', 'vip_secretariat_colonnade', 'vip_convoy_helipad'];
landmarks.forEach((name, idx) => {
  const g = new THREE.Group();
  sceneryFactory.buildScenery(g, VIP_EXPRESS_THEME, 0, false, false, 'NONE', 'FULL', idx);
  const found = g.getObjectByName(name);
  check(found !== undefined, `Landmark variation ${idx} (${name}) spawns cleanly with seed`);
});

// =========================================================================
// Suite 6: VIP Express Playable Train Livery & Hitboxes
// =========================================================================
console.log('\n--- Suite 6: VIP Express Train Livery & Hitboxes ---');

const obstacleFactory = new ObstacleFactory();
const vipTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0xf8fafc, undefined, 'VIP_EXPRESS');

check(vipTrain !== undefined, 'ObstacleFactory creates VIP Express train');
check(vipTrain.userData.isTrain === true, 'userData.isTrain is true');
check(vipTrain.userData.variant === 'STREAMLINED_EXPRESS', 'VIP Express uses STREAMLINED_EXPRESS variant');

// Verify front gold cowcatcher and headlights
let hasGoldCowcatcher = false;
let hasHeadlights = false;
vipTrain.traverse((obj) => {
  if ((obj as THREE.Mesh).isMesh) {
    const mesh = obj as THREE.Mesh;
    if (mesh.position.z > 8.0 && mesh.position.y < 1.0) {
      hasGoldCowcatcher = true;
    }
    if (mesh.position.z > 8.0 && mesh.position.y > 1.5) {
      hasHeadlights = true;
    }
  }
});
check(hasGoldCowcatcher, 'VIP train has front streamlined cowcatcher');
check(hasHeadlights, 'VIP train has high-output headlights');

// Verify walkable roof bounds (strictly Y = 4.35m)
const roofElevation = CONSTANTS.TRAIN_HEIGHT + 0.15;
check(Math.abs(roofElevation - 4.35) < 0.01, 'Train roof walkable elevation is exactly 4.35m');

// =========================================================================
// Suite 7: Distant Skyline & Searchlights
// =========================================================================
console.log('\n--- Suite 7: Distant Skyline & Searchlights ---');

const worldScene = Object.create(WorldScene.prototype) as any;
worldScene.currentTheme = VIP_EXPRESS_THEME;
worldScene.currentConfig = { cloudsVisible: true };
worldScene.scene = new THREE.Scene();
worldScene.scene.fog = new THREE.FogExp2();
worldScene.skylineMaterial = new THREE.MeshBasicMaterial();
worldScene.skylineGroup = worldScene.createDistantSkyline();

check(worldScene.vipExpressSkyline !== null, 'WorldScene contains vipExpressSkyline');
check(worldScene.vipExpressSkyline.visible === true, 'vipExpressSkyline is visible when VIP_EXPRESS is active');
check(worldScene.vipSearchlights.length === 4, 'vipExpressSkyline contains 4 swaying celebration searchlights');

// =========================================================================
// Suite 8: Graphics Quality Tiering & Memory Pooling
// =========================================================================
console.log('\n--- Suite 8: Graphics Quality Tiering & Memory Pooling ---');

const gFull = new THREE.Group();
const gBalanced = new THREE.Group();
const gMinimal = new THREE.Group();

sceneryFactory.buildScenery(gFull, VIP_EXPRESS_THEME, 0, false, false, 'NONE', 'FULL', 999);
sceneryFactory.buildScenery(gBalanced, VIP_EXPRESS_THEME, 0, false, false, 'NONE', 'BALANCED', 999);
sceneryFactory.buildScenery(gMinimal, VIP_EXPRESS_THEME, 0, false, false, 'NONE', 'MINIMAL', 999);

let countFull = 0;
let countBalanced = 0;
let countMinimal = 0;

gFull.traverse((o) => { if ((o as THREE.Mesh).isMesh) countFull++; });
gBalanced.traverse((o) => { if ((o as THREE.Mesh).isMesh) countBalanced++; });
gMinimal.traverse((o) => { if ((o as THREE.Mesh).isMesh) countMinimal++; });

check(countFull >= countBalanced, `FULL tier (count: ${countFull}) has >= meshes than BALANCED (count: ${countBalanced})`);
check(countBalanced >= countMinimal, `BALANCED tier has >= meshes than MINIMAL (count: ${countMinimal})`);
check(countMinimal <= 150, `MINIMAL tier maintains lightweight budget (count: ${countMinimal} <= 150)`);

// Clean recycling
sceneryFactory.buildScenery(gFull, VIP_EXPRESS_THEME, -80, false, false, 'NONE', 'FULL', 999);
let countRecycled = 0;
gFull.traverse((o) => { if ((o as THREE.Mesh).isMesh) countRecycled++; });
check(countRecycled === countFull, `Scenery properly clears and replaces without memory leaks (${countRecycled} === ${countFull})`);

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} VIP_EXPRESS SIGNATURE WORLD TESTS PASSED!`);
console.log(`=======================================================\n`);
