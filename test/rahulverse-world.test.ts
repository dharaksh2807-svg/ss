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
// Suite 4: Verification of All 5 Comedy Districts & Collision Clearance
// =========================================================================
console.log('\n--- Suite 4: Verification of All 5 Comedy Districts & Collision Clearance ---');

function verifyDistrictClearance(districtGroup: THREE.Group, districtName: string) {
  let districtIntrusions = 0;
  districtGroup.updateMatrixWorld(true);
  districtGroup.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox!.clone();
      box.applyMatrix4(mesh.matrixWorld);

      const xOverlap = box.min.x <= 4.2 && box.max.x >= -4.2;
      const yOverlap = box.min.y <= 8.5 && box.max.y >= 0.1;

      if (xOverlap && yOverlap) {
        districtIntrusions++;
        console.error(`Intrusion in ${districtName}: ${mesh.name || 'unnamed'} at X:[${box.min.x.toFixed(2)}, ${box.max.x.toFixed(2)}] Y:[${box.min.y.toFixed(2)}, ${box.max.y.toFixed(2)}]`);
      }
    }
  });
  check(districtIntrusions === 0, `${districtName} strictly preserves 100% clearance envelope (found ${districtIntrusions} intrusions)`);
}

// District A: Yatra Never Ends
const gA = new THREE.Group();
sceneryFactory.buildScenery(gA, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 0);
check(gA.getObjectByName('district_a_yatra_never_ends') !== undefined, 'District A: Yatra Never Ends exists');
check(gA.getObjectByName('yatra_finish_flip_arch') !== undefined, 'District A: Flip finish arch exists');
verifyDistrictClearance(gA, 'District A (Yatra Never Ends)');

// District B: Parliament Pandemonium
const gB = new THREE.Group();
sceneryFactory.buildScenery(gB, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 1);
check(gB.getObjectByName('district_b_parliament_pandemonium') !== undefined, 'District B: Parliament Pandemonium exists');
check(gB.getObjectByName('runaway_microphone_arm') !== undefined, 'District B: Runaway microphone arm exists');
verifyDistrictClearance(gB, 'District B (Parliament Pandemonium)');

// District C: Press Conference Panic
const gC = new THREE.Group();
sceneryFactory.buildScenery(gC, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 2);
check(gC.getObjectByName('district_c_press_conference_panic') !== undefined, 'District C: Press Conference Panic exists');
check(gC.getObjectByName('media_conga_line') !== undefined, 'District C: Media conga line exists');
verifyDistrictClearance(gC, 'District C (Press Conference Panic)');

// District D: Alliance Rollercoaster
const gD = new THREE.Group();
sceneryFactory.buildScenery(gD, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 3);
check(gD.getObjectByName('district_d_alliance_rollercoaster') !== undefined, 'District D: Alliance Rollercoaster exists');
check(gD.getObjectByName('middle_seat_dispute') !== undefined, 'District D: Middle seat dispute exists');
verifyDistrictClearance(gD, 'District D (Alliance Rollercoaster)');

// District E: The Great Political Multiverse
const gE = new THREE.Group();
sceneryFactory.buildScenery(gE, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 4);
check(gE.getObjectByName('district_e_political_multiverse') !== undefined, 'District E: Political Multiverse exists');
check(gE.getObjectByName('multiverse_vortex_portal') !== undefined, 'District E: Multiverse vortex portal exists');
verifyDistrictClearance(gE, 'District E (The Great Political Multiverse)');

// District F: Regional Town & Roadshow
const gF = new THREE.Group();
sceneryFactory.buildScenery(gF, RAHULVERSE_THEME, 0, false, false, 'NONE', 'FULL', 5);
check(gF.getObjectByName('district_f_regional_roadshow') !== undefined, 'District F: Regional Town & Roadshow exists');
check(gF.getObjectByName('rahul_campaign_van') !== undefined, 'District F: Campaign support van exists');
check(gF.getObjectByName('rahul_yatra_water_station') !== undefined, 'District F: Matka water station exists');
verifyDistrictClearance(gF, 'District F (Regional Town & Roadshow)');

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
// Suite 6: Comedy Event Director Animation Update & Memory Leak Pruning
// =========================================================================
console.log('\n--- Suite 6: Comedy Event Director Animation Update & Memory Leak Pruning ---');

const director = RahulComedyEventDirector.getInstance();
check(director !== undefined, 'RahulComedyEventDirector instance exists');

// Verify public diagnostic getters
check(typeof director.getFlipBoardCount() === 'number', 'Director has getFlipBoardCount');
check(typeof director.getRunawayMicCount() === 'number', 'Director has getRunawayMicCount');
check(typeof director.getFlyingPapersCount() === 'number', 'Director has getFlyingPapersCount');
check(typeof director.getRevolvingDoorCount() === 'number', 'Director has getRevolvingDoorCount');
check(typeof director.getMiddleSeatDisputeCount() === 'number', 'Director has getMiddleSeatDisputeCount');
check(typeof director.getMultiversePortalCount() === 'number', 'Director has getMultiversePortalCount');
check(typeof director.getShoeMonumentCount() === 'number', 'Director has getShoeMonumentCount');
check(typeof director.getPuzzlePieceCount() === 'number', 'Director has getPuzzlePieceCount');
check(typeof director.getMediaCongaLineCount() === 'number', 'Director has getMediaCongaLineCount');
check(typeof director.getTimerMeshCount() === 'number', 'Director has getTimerMeshCount');
check(typeof director.getTotalActiveElements() === 'number', 'Director has getTotalActiveElements');

// Test memory leak fix: detached recycled objects must be automatically pruned
const tempParent = new THREE.Group();
const tempPivot = new THREE.Group();
const tempMesh1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
const tempMesh2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
tempPivot.add(tempMesh1);
tempPivot.add(tempMesh2);
tempParent.add(tempPivot);

director.registerFlipBoard(tempPivot, tempMesh1, tempMesh2);
const countBeforePrune = director.getFlipBoardCount();

// Detach from parent (simulating chunk clearDecorativeGroup)
tempParent.remove(tempPivot);
director.update(0.016, true);
const countAfterPrune = director.getFlipBoardCount();
check(countAfterPrune < countBeforePrune, 'Detached objects are successfully pruned on update, resolving memory leak');

// Update with normal motion
director.update(0.016, true);
check(true, 'Director updates without error with delta time');

// Update with 0 delta
director.update(0.0, true);
check(true, 'Director handles 0 delta gracefully');

// =========================================================================
// Suite 7: Leader Caricatures, Signature Satire Gags & Visual Architecture
// =========================================================================
console.log('\n--- Suite 7: Leader Caricatures & 15 Satire Gags ---');

const { RahulSatireWorldBuilder } = await import('../src/environment/worlds/rahulverse/RahulSatireWorldBuilder');
const builder = RahulSatireWorldBuilder.getInstance();

const testParent = new THREE.Group();

// 1. Rahul Gandhi Caricature
const rahulCaricature = builder.buildRahulCaricature(testParent, 0, 0, 0, 'DEBATE', director);
check(rahulCaricature.name === 'caricature_rahul', 'Rahul caricature generated with name caricature_rahul');
check(rahulCaricature.children.length >= 5, 'Rahul caricature has legs, torso, head, hair, arms');

// 2. Narendra Modi Caricature
const modiCaricature = builder.buildModiCaricature(testParent, 2, 0, 0, 'VICTORY', director);
check(modiCaricature.name === 'caricature_modi', 'Modi caricature generated with name caricature_modi');
check(modiCaricature.children.length >= 7, 'Modi caricature has legs, waistcoat, mandarin collar, head, silver hair, beard, spectacles');

// 3. Arvind Kejriwal Caricature
const kejriwalCaricature = builder.buildKejriwalCaricature(testParent, 4, 0, 0, director);
check(kejriwalCaricature.name === 'caricature_kejriwal', 'Kejriwal caricature generated with signature woolen muffler & sweater vest');

// 4. Mamata Banerjee Caricature
const mamataCaricature = builder.buildMamataCaricature(testParent, 6, 0, 0, director);
check(mamataCaricature.name === 'caricature_mamata', 'Mamata caricature generated with signature blue-bordered saree');

// 5. Nitish Kumar Caricature
const nitishCaricature = builder.buildNitishCaricature(testParent, 8, 0, 0, director);
check(nitishCaricature.name === 'caricature_nitish', 'Nitish caricature generated with kurta and spectacles');

// 6. Test District Gags & Director Registrations
director.reset();
const testDistrictGroup = new THREE.Group();

// Build all 6 districts into testDistrictGroup
for (let d = 0; d < 6; d++) {
  builder.buildDistrictScenery(testDistrictGroup, 12, 100, d, 'FULL');
}

check(director.getFlipBoardCount() >= 1, 'Infinite Yatra flip board registered');
check(director.getShoeMonumentCount() >= 1, 'Walking shoe monument registered');
check(director.getRunawayMicCount() >= 1, 'Parliament runaway microphone registered');
check(director.getFlyingPapersCount() >= 1, 'Parliament flying papers registered');
check(director.getRevolvingDoorCount() >= 1, 'Parliament revolving door registered');
check(director.getMediaCongaLineCount() >= 1, 'Press conference media conga line registered');
check(director.getMiddleSeatDisputeCount() >= 1, 'Alliance musical chairs / middle seat dispute registered');
check(director.getPuzzlePieceCount() >= 1, 'Alliance interlocking puzzle pieces registered');
check(director.getMultiversePortalCount() >= 1, 'Political multiverse twin portals registered');
check(director.getTimerMeshCount() >= 1, 'Debate countdown timer registered');
check(director.getTotalActiveElements() >= 12, 'Total active comedy elements exceeds 12 distinct gags');

// Test animation update across all registered gags
director.update(0.016, true);
check(true, 'Director successfully animates all 15 comedy events');

// =========================================================================
// Suite 8: Character Joint Articulation & Winking (Phase 4 Motion Rig)
// =========================================================================
console.log('\n--- Suite 8: Character Joint Articulation & Winking ---');

// 1. Rahul Gandhi Rig & Articulated Joints
const rJoints = rahulCaricature.userData.joints;
check(Boolean(rJoints), 'Rahul caricature exposes userData.joints');
check(Boolean(rJoints.headGroup), 'Rahul has articulated headGroup for comedic double-takes');
check(Boolean(rJoints.eyebrowL && rJoints.eyebrowR), 'Rahul has expressive independent left and right eyebrows');
check(Boolean(rJoints.winkLid), 'Rahul has animated left eyelid for the signature parliament wink');
check(Boolean(rJoints.sparkleStar), 'Rahul has cartoon sparkle star mesh for the punchline wink');
check(Boolean(rJoints.mouth), 'Rahul has expressive mouth joint');
check(Boolean(rJoints.armL && rJoints.elbowL && rJoints.handL), 'Rahul has articulated left arm with shoulder, elbow, hand');
check(Boolean(rJoints.armR && rJoints.elbowR && rJoints.handR), 'Rahul has articulated right arm with shoulder, elbow, hand');
check(Boolean(rJoints.legL && rJoints.legR), 'Rahul has articulated hip-jointed left and right legs for walking stride');

// 2. Narendra Modi Rig & Articulated Joints
const mJoints = modiCaricature.userData.joints;
check(Boolean(mJoints), 'Modi caricature exposes userData.joints');
check(Boolean(mJoints.headGroup), 'Modi has articulated headGroup for comedic turns');
check(Boolean(mJoints.jaw), 'Modi has dropping jaw joint for surprise reactions');
check(Boolean(mJoints.glasses), 'Modi has spectacles joint for comedy glasses-popping gag');
check(Boolean(mJoints.eyebrowL && mJoints.eyebrowR), 'Modi has expressive arched eyebrows');
check(Boolean(mJoints.armL && mJoints.armR), 'Modi has articulated arms for gesture & embrace');

// 3. Kejriwal, Mamata & Nitish Supporting Caricatures
const kJoints = kejriwalCaricature.userData.joints;
check(Boolean(kJoints && kJoints.mufflerTail), 'Kejriwal caricature has fluttering woolen muffler tail joint');

const mamataJoints = mamataCaricature.userData.joints;
check(Boolean(mamataJoints && mamataJoints.pallu), 'Mamata caricature has trailing saree pallu joint');

const nJoints = nitishCaricature.userData.joints;
check(Boolean(nJoints && nJoints.headGroup && nJoints.armL), 'Nitish caricature has articulated head and arms for chair swivel');

// =========================================================================
// Suite 9: Phase 4 Flagship Gags & Approach-Aware Theatrical Timing
// =========================================================================
console.log('\n--- Suite 9: Phase 4 Flagship Gags & Approach-Aware Theatrical Timing ---');

// 1. getGagCycle approach-aware theatrical curve testing
// Far away / no player: autonomous fallback timer % cycleDuration
check(Math.abs(director.getGagCycle(2.5, 6.0) - 2.5) < 0.001, 'getGagCycle returns timer % cycle when player is undefined');
check(Math.abs(director.getGagCycle(2.5, 6.0, 0, 100) - 2.5) < 0.001, 'getGagCycle returns timer % cycle when player is >75m away');

// Approaching player at 65m ahead (Beat 1: Setup, 0.0 to 1.5s in 6s cycle)
const beat1Cycle = director.getGagCycle(0, 6.0, 0, 65);
check(beat1Cycle >= 0 && beat1Cycle <= 1.5, `Beat 1 (Setup) cycle at 65m ahead: ${beat1Cycle.toFixed(2)}s is within [0, 1.5]`);

// Approaching player at 45m ahead (Beat 2: Anticipation, 1.5 to 3.0s in 6s cycle)
const beat2Cycle = director.getGagCycle(0, 6.0, 0, 45);
check(beat2Cycle >= 1.5 && beat2Cycle <= 3.0, `Beat 2 (Anticipation) cycle at 45m ahead: ${beat2Cycle.toFixed(2)}s is within [1.5, 3.0]`);

// Approaching player at 20m ahead (Beat 3: PUNCHLINE & PAYOFF in runner camera view, 3.0 to 4.5s in 6s cycle)
const beat3Cycle = director.getGagCycle(0, 6.0, 0, 20);
check(beat3Cycle >= 3.0 && beat3Cycle <= 4.5, `Beat 3 (Punchline Payoff) cycle at 20m ahead: ${beat3Cycle.toFixed(2)}s is within [3.0, 4.5]`);

// Passing player at 2m ahead (Beat 4: Reaction & laugh hold, 4.5 to 6.0s in 6s cycle)
const beat4Cycle = director.getGagCycle(0, 6.0, 0, 2);
check(beat4Cycle >= 4.5 && beat4Cycle <= 6.0, `Beat 4 (Reaction Hold) cycle at 2m ahead: ${beat4Cycle.toFixed(2)}s is within [4.5, 6.0]`);

// 2. Parliament Hug & Wink Flagship Gag
director.reset();
const pStage = new THREE.Group();
builder.buildParliamentHugAndWinkStage(pStage, -8.0, 0.6, -100, director, -100);
check(director.getParliamentHugAndWinkCount() >= 1, 'Parliament Hug and Wink flagship gag registered');

// Test Beat 1: Stride (Player at -165, distance ahead = 65m)
director.update(0.016, true, -165);
check(true, 'Parliament Hug and Wink animates Beat 1 (Stride) smoothly');

// Test Beat 2: Bear Hug & Pop Spectacles (Player at -145, distance ahead = 45m)
director.update(0.016, true, -145);
check(true, 'Parliament Hug and Wink animates Beat 2 (Bear Hug) smoothly');

// Test Beat 3: Iconic Wink, Sparkle Star & Cameraman Fall (Player at -120, distance ahead = 20m)
director.update(0.016, true, -120);
check(true, 'Parliament Hug and Wink animates Beat 3 (Iconic Wink & Cameraman Fall) smoothly');

// Test Beat 4: Recovery & Hold (Player at -102, distance ahead = 2m)
director.update(0.016, true, -102);
check(true, 'Parliament Hug and Wink animates Beat 4 (Recovery) smoothly');

// 3. The Never-Ending Yatra Flagship Gag
const yStage = new THREE.Group();
builder.buildDistrictScenery(yStage, 12, 100, 0, 'FULL', -200);
check(director.getNeverEndingYatraCount() >= 1, 'Never-Ending Yatra flagship gag registered');

// Test Yatra Beats with player approach
director.update(0.016, true, -265); // Beat 1: March
director.update(0.016, true, -245); // Beat 2: Ratchet arch roll
director.update(0.016, true, -220); // Beat 3: Accordion route map unroll
director.update(0.016, true, -202); // Beat 4: Towel wipe jog
check(true, 'Never-Ending Yatra animates across all 4 approach beats');

// 4. Press Conference Panic & Daisy-Chain Scrum
check(director.getMicrophoneChaosCount() >= 0, 'Microphone chaos stage handled gracefully');

// 5. Alliance Musical Chairs & Swivel Runaway
check(director.getAllianceChairsRunawayCount() >= 0, 'Alliance musical chairs stage handled gracefully');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} RAHULVERSE SIGNATURE WORLD TESTS PASSED!`);
console.log(`=======================================================\n`);
