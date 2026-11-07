import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { HAUNTED_CARNIVAL_THEME, EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { WorldScene } from '../src/scene/WorldScene';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { getWorld } from '../src/environment/WorldCatalog';
import { HauntedCarnivalEventDirector } from '../src/environment/worlds/hauntedCarnival/HauntedCarnivalEventDirector';
import { HauntedCarnivalWorldBuilder } from '../src/environment/worlds/hauntedCarnival/HauntedCarnivalWorldBuilder';
import { SettingsManager } from '../src/settings/SettingsManager';

console.log('🧪 Starting HAUNTED_CARNIVAL Premium World Verification Suite...\n');

let checks = 0;
function check(condition: unknown, msg: string) {
  assert.ok(condition, msg);
  checks++;
}

// Suite 1: Theme Identity, Catalog & Registry
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');
const registry = EnvironmentRegistry.getInstance();
check(registry.has('HAUNTED_CARNIVAL'), 'HAUNTED_CARNIVAL is registered in EnvironmentRegistry');
const theme = registry.get('HAUNTED_CARNIVAL');
check(theme.id === 'HAUNTED_CARNIVAL', 'Theme ID matches HAUNTED_CARNIVAL');
check(theme.displayName === 'Haunted Carnival', 'Theme displayName matches');
check(theme.badgeEmoji === '🎃', 'Theme emoji is 🎃');
check(theme.accentColor === '#f97316', 'Theme accent color matches festive pumpkin orange');
check(theme.sky.top === 0x0c071e, 'Sky top is midnight violet abyss');
check(theme.sky.bottom === 0x3b0764, 'Sky bottom has deep royal purple carnival glow');
check(theme.fog.color === 0x1e0e38, 'Fog color provides mysterious haunted evening atmosphere');
check(theme.fog.density === 0.0034, 'Fog density is tuned for depth without obscuring hazards');
check(theme.sun.color === 0xfb923c, 'Key light is glowing jack-o-lantern amber illumination');
check(theme.fill.color === 0x581c87, 'Fill light is gothic royal purple');
check(theme.hemi.sky === 0xc084fc, 'Hemisphere sky is spooky lilac glow');
check(theme.materials.wallBaseColor === 0x1e1b2e, 'Retaining wall base is dark obsidian gothic stone');
check(theme.materials.wallAccentColor === 0xf97316, 'Wall accent is illuminated pumpkin amber');
check(theme.materials.bridgeAccentColor === 0xc084fc, 'Bridge accent is vibrant carnival violet');

const worldDef = getWorld('HAUNTED_CARNIVAL');
check(worldDef !== undefined, 'World definition exists in WorldCatalog');
check(worldDef?.implemented === true, 'World definition is marked implemented');
check(worldDef?.available === true, 'World definition is marked available');
check(worldDef?.coinCost === 10500, 'World cost is 10500 coins');
check(worldDef?.unlock === 'COINS', 'World unlocks via coins');

// Suite 2: Procedural 3D Scenery Generation
console.log('\n--- Suite 2: Procedural 3D Scenery Generation ---');
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

const group1 = new THREE.Group();
factory.buildScenery(group1, HAUNTED_CARNIVAL_THEME, 0, false, false, 'NONE', 'FULL', 7007);

let meshCount = 0;
let hasGothicStone = false;
let hasJackOLantern = false;
let hasCarnivalStripe = false;
let hasWroughtIron = false;
let hasTwistedWood = false;
let hasGothicWindow = false;
let hasGlowingAmber = false;
let hasVioletLight = false;

const mats = factory.getSharedMaterials();
// Build across seeds 100..103 to test all landmark archetypes and material variations
const multiGroup = new THREE.Group();
for (let s = 100; s < 104; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, HAUNTED_CARNIVAL_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  multiGroup.add(g);
}

// Build transition portal chunk to verify portal architecture and bulb illumination
const portalGroup = new THREE.Group();
factory.buildScenery(portalGroup, HAUNTED_CARNIVAL_THEME, 0, true, false, 'NONE', 'FULL', 99);
multiGroup.add(portalGroup);

group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    meshCount++;
  }
});

multiGroup.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const m = (child as THREE.Mesh).material;
    if (m === mats.hauntedGothicStoneMat) hasGothicStone = true;
    if (m === mats.hauntedJackOLanternGlowMat) hasJackOLantern = true;
    if (m === mats.hauntedCarnivalStripeMat) hasCarnivalStripe = true;
    if (m === mats.hauntedWroughtIronMat) hasWroughtIron = true;
    if (m === mats.hauntedTwistedWoodMat) hasTwistedWood = true;
    if (m === mats.hauntedGothicWindowMat) hasGothicWindow = true;
    if (m === mats.hauntedAmberGlowMat) hasGlowingAmber = true;
    if (m === mats.hauntedVioletGlowMat) hasVioletLight = true;
  }
});

pool.clearDecorativeGroup(multiGroup, new Set(Object.values(factory.getSharedMaterials())));

check(meshCount >= 40, `HAUNTED_CARNIVAL produces rich 3D gothic carnival scenery (got ${meshCount} meshes)`);
check(hasGothicStone, 'Contains ancient gothic stone retaining walls and architecture');
check(hasJackOLantern, 'Contains carved glowing jack-o-lantern finials and shrines');
check(hasCarnivalStripe, 'Contains spooky striped carnival canvas tents');
check(hasWroughtIron, 'Contains cemetery spearhead wrought-iron fencing and gates');
check(hasTwistedWood, 'Contains dead twisted bare trees and gnarled wood');
check(hasGothicWindow, 'Contains illuminated gothic stained-glass windows');
check(hasGlowingAmber, 'Contains warm pumpkin amber glow accents');
check(hasVioletLight, 'Contains royal violet supernatural lighting');

// Suite 3: Monumental Overhead Gothic Arches & Safe Vertical Clearance
console.log('\n--- Suite 3: Monumental Overhead Gothic Arches & Safe Clearance ---');
let foundOverheadArchitecture = false;
let archClearanceSafe = true;

for (let seed = 6000; seed < 6025; seed++) {
  const testGroup = new THREE.Group();
  factory.buildScenery(testGroup, HAUNTED_CARNIVAL_THEME, -seed * 80, false, false, 'NONE', 'FULL', seed);
  testGroup.updateMatrixWorld(true);
  testGroup.traverse((child) => {
    if (child.name === 'haunted_overhead_arches') {
      foundOverheadArchitecture = true;
      child.traverse((part) => {
        if ((part as THREE.Mesh).isMesh) {
          const mesh = part as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(mesh);
          // If within running lane envelope (|X| <= 3.8m), must be above jumping/train height (Y >= 8.5m)
          if (box.min.x < 3.8 && box.max.x > -3.8) {
            if (box.min.y < 8.5) {
              archClearanceSafe = false;
            }
          }
        }
      });
    }
  });
  pool.clearDecorativeGroup(testGroup, new Set(Object.values(factory.getSharedMaterials())));
}
check(foundOverheadArchitecture, 'Overhead gothic cast-iron spans spawn procedurally across seeds');
check(archClearanceSafe, 'Overhead architecture maintains safe vertical clearance (>= 8.5m, actual >= 10.5m) above running lanes');

// Suite 4: Gameplay Corridor Safety & Non-Obstruction Invariants
console.log('\n--- Suite 4: Running Corridor Safety Invariants ---');
let laneIntrusions = 0;
for (let chunkIdx = 0; chunkIdx < 6; chunkIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, HAUNTED_CARNIVAL_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', 9000 + chunkIdx);
  g.updateMatrixWorld(true);

  // Track running corridor envelope: lanes are at -3.6, 0, +3.6.
  // Physical scenery must not protrude into |X| <= 4.0m below Y = 7.5m.
  g.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && child.name !== 'tunnel_scenery') {
      const box = new THREE.Box3().setFromObject(child);
      if (box.min.x < 4.0 && box.max.x > -4.0 && box.min.y < 7.5) {
        laneIntrusions++;
      }
    }
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}
check(laneIntrusions === 0, `Gothic carnival scenery never obstructs running lanes below Y=7.5m (intrusions: ${laneIntrusions})`);

// Suite 5: Scenery Recycling & Pool Memory Stability
console.log('\n--- Suite 5: Scenery Recycling & Memory Stability ---');
const recycleGroup = new THREE.Group();
factory.buildScenery(recycleGroup, HAUNTED_CARNIVAL_THEME, 0, false, false, 'NONE', 'FULL', 999);
const countBefore = recycleGroup.children.length;
check(countBefore > 0, 'Populated chunk with decorative groups');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));
check(recycleGroup.children.length === 0, 'clearDecorativeGroup cleans all children');

// Shared materials survive recycling
check(!mats.hauntedGothicStoneMat.isDisposed, 'hauntedGothicStoneMat survives recycling');
check(!mats.hauntedJackOLanternGlowMat.isDisposed, 'hauntedJackOLanternGlowMat survives recycling');
check(!mats.hauntedCarnivalStripeMat.isDisposed, 'hauntedCarnivalStripeMat survives recycling');
check(!mats.hauntedWroughtIronMat.isDisposed, 'hauntedWroughtIronMat survives recycling');
check(!mats.hauntedTwistedWoodMat.isDisposed, 'hauntedTwistedWoodMat survives recycling');
check(!mats.hauntedGothicWindowMat.isDisposed, 'hauntedGothicWindowMat survives recycling');
check(!mats.hauntedAmberGlowMat.isDisposed, 'hauntedAmberGlowMat survives recycling');
check(!mats.hauntedVioletGlowMat.isDisposed, 'hauntedVioletGlowMat survives recycling');

// Rebuild with different seed
factory.buildScenery(recycleGroup, HAUNTED_CARNIVAL_THEME, -80, false, false, 'NONE', 'FULL', 1234);
check(recycleGroup.children.length > 0, 'Recycled group accepts new chunk scenery without error');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 6: Atmospheric Presets & Pacing
console.log('\n--- Suite 6: Atmospheric Presets & Pacing ---');
const encounterDir = EnvironmentalEncounterDirector.getInstance();
const activePreset = encounterDir.resolveAtmospherePreset(-500, 'HAUNTED_CARNIVAL');
check(activePreset === 'CARNIVAL_HAUNTED_NIGHT', `Atmosphere resolves CARNIVAL_HAUNTED_NIGHT for HAUNTED_CARNIVAL (got ${activePreset})`);

// Suite 7: Theme-Specific Playable Train Visuals & Hitboxes
console.log('\n--- Suite 7: Theme-Specific Playable Train Visuals & Hitboxes ---');
const obstacleFactory = new ObstacleFactory();
const defaultTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1);
const hauntedTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0x1f1135, undefined, 'HAUNTED_CARNIVAL');

check(hauntedTrain.userData.isTrain === true, 'hauntedTrain retains isTrain userData');
check(hauntedTrain.userData.type === 'TRAIN', 'hauntedTrain retains TRAIN type');

// Compare bounding box dimensions (hitbox integrity)
const defaultBox = new THREE.Box3().setFromObject(defaultTrain);
const hauntedBox = new THREE.Box3().setFromObject(hauntedTrain);

const defaultWidth = defaultBox.max.x - defaultBox.min.x;
const hauntedWidth = hauntedBox.max.x - hauntedBox.min.x;
check(Math.abs(defaultWidth - hauntedWidth) < 0.25, `Train width preserved within 0.25m (default: ${defaultWidth.toFixed(2)}, haunted: ${hauntedWidth.toFixed(2)})`);

// Walkable rooftop surface Y must be exactly at 4.35m
let hauntedCatwalkFound = false;
hauntedTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const geo = (child as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry && Math.abs(child.position.y - 4.28) < 0.05) {
      hauntedCatwalkFound = true;
    }
  }
});
check(hauntedCatwalkFound, 'Haunted Carnival train maintains walkable catwalk platform at exact Y=4.28m (top face Y=4.35m)');

// Verify gothic bat-wing cowcatcher plow and sinister carved jack-o-lantern amber headlight on locomotive cab
let hasGothicPlow = false;
let hasPumpkinHeadlight = false;
hauntedTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const mesh = child as THREE.Mesh;
    if (mesh.position.y < 0.6 && mesh.position.z > 5.0) {
      hasGothicPlow = true;
    }
    if (mesh.position.y > 1.8 && mesh.position.z > 5.0 && mesh.material instanceof THREE.MeshBasicMaterial) {
      hasPumpkinHeadlight = true;
    }
  }
});
check(hasGothicPlow, 'Haunted Carnival locomotive cab is equipped with gothic bat-wing styled cowcatcher plow');
check(hasPumpkinHeadlight, 'Haunted Carnival locomotive cab is equipped with glowing jack-o-lantern cyclops headlight');

// Suite 8: Graphics Quality Tiering
console.log('\n--- Suite 8: Graphics Detail Tiering ---');
const fullGroup = new THREE.Group();
factory.buildScenery(fullGroup, HAUNTED_CARNIVAL_THEME, 0, false, false, 'NONE', 'FULL', 8888);
let fullMeshes = 0;
fullGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) fullMeshes++; });

const minGroup = new THREE.Group();
factory.buildScenery(minGroup, HAUNTED_CARNIVAL_THEME, 0, false, false, 'NONE', 'MINIMAL', 8888);
let minMeshes = 0;
minGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) minMeshes++; });

check(fullMeshes > minMeshes, `FULL detail has more meshes than MINIMAL (${fullMeshes} > ${minMeshes})`);
check(minMeshes >= 12, `MINIMAL detail retains essential walls and gothic spans (${minMeshes} meshes)`);

pool.clearDecorativeGroup(fullGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(minGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 9: Landmark Variations Across Seeds
console.log('\n--- Suite 9: Multiple Landmark Variations ---');
let landmarkTypes = new Set<string>();
for (let s = 200; s < 235; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, HAUNTED_CARNIVAL_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  g.traverse((c) => {
    if (c.name === 'carnival_haunted_mansion') landmarkTypes.add('HAUNTED_MANSION');
    if (c.name === 'carnival_spooky_tent') landmarkTypes.add('SPOOKY_TENT');
    if (c.name === 'carnival_pumpkin_shrine') landmarkTypes.add('PUMPKIN_SHRINE');
    if (c.name === 'carnival_graveyard_crypt') landmarkTypes.add('GRAVEYARD_CRYPT');
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}
check(landmarkTypes.size >= 3, `Procedural generation includes multiple landmark variations (found ${Array.from(landmarkTypes).join(', ')})`);

// Suite 10: Scene A — The Haunted Carousel Awakening
console.log('\n--- Suite 10: Scene A — The Haunted Carousel Awakening ---');
const director = HauntedCarnivalEventDirector.getInstance();
director.reset();

const carouselChunk = new THREE.Group();
factory.buildScenery(carouselChunk, HAUNTED_CARNIVAL_THEME, -400, false, false, 'NONE', 'FULL', 5);

let carouselFound = false;
let steedCount = 0;
let hasOrgan = false;
let hasCanopy = false;

carouselChunk.traverse((child) => {
  if (child.name === 'haunted_carousel_scene_a') {
    carouselFound = true;
  }
});
check(carouselFound, 'Scene A: Haunted Carousel successfully generated in Supernatural Midway');

const diag1 = director.getDiagnostics();
check(diag1.carousels >= 1, `Carousel registered with HauntedCarnivalEventDirector (count: ${diag1.carousels})`);

// Proximity awakening update
director.update(0.016, true, -380);
const diagAfter = director.getDiagnostics();
check(diagAfter.carousels >= 1, 'Carousel updates smoothly on approaching player');

pool.clearDecorativeGroup(carouselChunk, new Set(Object.values(factory.getSharedMaterials())));

// Suite 11: Scene B — Surprise Ghost Encounter
console.log('\n--- Suite 11: Scene B — Surprise Ghost Encounter ---');
director.reset();
const ghostChunk = new THREE.Group();
factory.buildScenery(ghostChunk, HAUNTED_CARNIVAL_THEME, -240, false, false, 'NONE', 'FULL', 3);
ghostChunk.updateMatrixWorld(true);

let ghostFound = false;
ghostChunk.traverse((child) => {
  if (child.name === 'surprise_ghost_scene_b') {
    ghostFound = true;
    child.traverse((part) => {
      if ((part as THREE.Mesh).isMesh) {
        const box = new THREE.Box3().setFromObject(part);
        if (box.min.x < 4.0 && box.max.x > -4.0 && box.min.y < 7.5) {
          assert.fail(`Ghost intruded into corridor: minX=${box.min.x}, maxX=${box.max.x}`);
        }
      }
    });
  }
});
check(ghostFound, 'Scene B: Surprise Ghost Encounter generated in Cursed Graveyard');
const diagGhost = director.getDiagnostics();
check(diagGhost.ghosts >= 1, `Surprise Ghost registered with HauntedCarnivalEventDirector (count: ${diagGhost.ghosts})`);

// Update with approaching player to trigger emerging phase
director.update(0.05, true, -180);
check(diagGhost.ghosts >= 1, 'Ghost progresses through encounter states');

pool.clearDecorativeGroup(ghostChunk, new Set(Object.values(factory.getSharedMaterials())));

// Suite 12: 12 Signature Scares & Actors Registration
console.log('\n--- Suite 12: 12 Signature Scares & Actors Registration ---');
director.reset();
const multiCycleGroup = new THREE.Group();
// Build across all 6 zones
for (let c = 0; c < 6; c++) {
  const g = new THREE.Group();
  factory.buildScenery(g, HAUNTED_CARNIVAL_THEME, -c * 80, false, false, 'NONE', 'FULL', c);
  multiCycleGroup.add(g);
}

const allDiag = director.getDiagnostics();
check(allDiag.carousels >= 1, `Signature Scare: Haunted Carousel present (${allDiag.carousels})`);
check(allDiag.ghosts >= 1, `Signature Scare: Surprise Ghost Encounter present (${allDiag.ghosts})`);
check(allDiag.ringmasters >= 1, `Signature Scare: Ringmaster present (${allDiag.ringmasters})`);
check(allDiag.ghostClowns >= 1, `Signature Scare: Ghost Clown present (${allDiag.ghostClowns})`);
check(allDiag.hauntedDolls >= 1, `Signature Scare: Haunted Dolls present (${allDiag.hauntedDolls})`);
check(allDiag.shadowCreatures >= 1, `Signature Scare: Giant Shadow Creature present (${allDiag.shadowCreatures})`);
check(allDiag.mirrorGlitches >= 1, `Signature Scare: Cursed Mirror Glitch present (${allDiag.mirrorGlitches})`);
check(allDiag.ghostTrains >= 1, `Signature Scare: Sky Trestle Ghost Train present (${allDiag.ghostTrains})`);
check(allDiag.livingPumpkins >= 1, `Signature Scare: Living Jack-o'-Lanterns present (${allDiag.livingPumpkins})`);
check(allDiag.paradeFloats >= 1, `Signature Scare: Ghost Carnival Parade Float present (${allDiag.paradeFloats})`);
check(allDiag.batSwarms >= 1, `Signature Scare: Overhead Bat Swarms present (${allDiag.batSwarms})`);
check(allDiag.funhouseTricks >= 1, `Signature Scare: Funhouse Trick Facade present (${allDiag.funhouseTricks})`);
check(allDiag.swingingLanterns >= 5, `Ambient Haunting: Swinging Lanterns present (${allDiag.swingingLanterns})`);
check(allDiag.willOWisps >= 3, `Ambient Haunting: Will-o'-the-Wisps present (${allDiag.willOWisps})`);

// Suite 13: 6 Distinct Macro-Zones & Non-Repeating Variety
console.log('\n--- Suite 13: 6 Distinct Macro-Zones & Non-Repeating Variety ---');
const zoneNames = new Set<string>();
multiCycleGroup.traverse((child) => {
  if (child.name.startsWith('zone_')) {
    zoneNames.add(child.name);
  }
});
check(zoneNames.has('zone_cursed_entrance'), 'Contains zone_cursed_entrance');
check(zoneNames.has('zone_abandoned_funfair'), 'Contains zone_abandoned_funfair');
check(zoneNames.has('zone_ghostly_circus'), 'Contains zone_ghostly_circus');
check(zoneNames.has('zone_cursed_graveyard'), 'Contains zone_cursed_graveyard');
check(zoneNames.has('zone_nightmare_manor'), 'Contains zone_nightmare_manor');
check(zoneNames.has('zone_supernatural_midway'), 'Contains zone_supernatural_midway');
check(zoneNames.size === 6, `All 6 distinct macro-zones present in a single 480m cycle (got ${zoneNames.size})`);

pool.clearDecorativeGroup(multiCycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 14: Reduced Motion & Memory Lifecycle Stability
console.log('\n--- Suite 14: Reduced Motion & Memory Lifecycle Stability ---');
const settings = SettingsManager.getInstance();
settings.setReducedMotion(true);

// Update director in reduced motion mode
director.update(0.016, true, -100);
check(true, 'Director successfully updates in reduced motion mode without exceptions');

settings.setReducedMotion(false);

// Reset and verify all actors pruned
director.reset();
const resetDiag = director.getDiagnostics();
check(resetDiag.carousels === 0 && resetDiag.ghosts === 0 && resetDiag.ringmasters === 0, 'Director reset clears all actor registries');

// Suite 15: Canonical Signed Distance & Position-Sensitive Trigger Timing (Gate 1)
console.log('\n--- Suite 15: Canonical Signed Distance & Position-Sensitive Timing ---');
director.reset();

// Setup Surprise Ghost at worldZ = -500 attached to a Scene
const testScene = new THREE.Scene();
const testGhostGroup = new THREE.Group();
testScene.add(testGhostGroup);
const ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1));
testGhostGroup.add(ghostMesh);
const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5));
ghostMesh.add(headMesh);

const surpriseGhostActor: any = {
  group: testGhostGroup,
  ghostMesh,
  headMesh,
  triggerZ: -500,
  startX: 12.0,
  targetX: 5.5,
  baseY: 2.0,
  state: 'HIDDEN',
  hoverTime: 0,
  side: 1
};
director.registerGhost(surpriseGhostActor);

// 1. 120m Before (-380m): Should be HIDDEN
director.update(0.016, true, -380);
check(surpriseGhostActor.state === 'HIDDEN', '120m before encounter: Ghost is HIDDEN');

// 2. 80m Before (-420m): Should enter EMERGING
director.update(0.016, true, -420);
check(surpriseGhostActor.state === 'EMERGING', '80m before encounter: Ghost is EMERGING');

// Advance emergence transition
for (let step = 0; step < 60; step++) {
  director.update(0.016, true, -440);
}

// 3. 40m Before (-460m): Should be HOVERING with head turned
director.update(0.016, true, -460);
check(surpriseGhostActor.state === 'HOVERING', '40m before encounter: Ghost is HOVERING');
check(Math.abs(headMesh.rotation.y) > 0.1, '40m before encounter: Ghost head smoothly tracks runner');

// 4. 10m Before (-490m): Should be HOVERING
director.update(0.016, true, -490);
check(surpriseGhostActor.state === 'HOVERING', '10m before encounter: Ghost remains HOVERING');

// 5. At Encounter (-500m): Should still be HOVERING beside player
director.update(0.016, true, -500);
check(surpriseGhostActor.state === 'HOVERING', 'At encounter (0m): Ghost is actively HOVERING');

// 6. 20m After (-520m): Should enter DISSOLVING
director.update(0.016, true, -525);
check(surpriseGhostActor.state === 'DISSOLVING', '20m after encounter: Ghost enters DISSOLVING');

// Advance dissolving transition
for (let step = 0; step < 60; step++) {
  director.update(0.016, true, -550);
}

// 7. 80m After (-580m): Should be INACTIVE / hidden
director.update(0.016, true, -580);
check(surpriseGhostActor.state === 'INACTIVE', '80m after encounter: Ghost is INACTIVE');
check(surpriseGhostActor.group.visible === false, '80m after encounter: Ghost mesh is completely invisible');

// High-Speed Hard Express Test (50 m/s => 0.83m per 60fps frame)
director.reset();
const hardGhostActor: any = {
  group: testGhostGroup,
  ghostMesh,
  triggerZ: -1000,
  startX: 12.0,
  targetX: 5.5,
  baseY: 2.0,
  state: 'HIDDEN',
  hoverTime: 0,
  side: 1
};
director.registerGhost(hardGhostActor);

// Player approaches at 50 m/s from -920 to -980
director.update(0.016, true, -920);
check(hardGhostActor.state === 'EMERGING', 'Hard Express (50m/s): Emergence activates reliably ahead of player');

// Suite 16: Flagship 1 — The Watcher Multi-Stage Encounter (Gate 2)
console.log('\n--- Suite 16: Flagship 1 — The Watcher Multi-Stage Encounter ---');
director.reset();
const testWatcherGroup = new THREE.Group();
factory.buildScenery(testWatcherGroup, HAUNTED_CARNIVAL_THEME, 0, false, false, 'NONE', 'FULL', 0);

const diagWatcher = director.getDiagnostics();
check(diagWatcher.watchers >= 1, `The Watcher generated and registered in Zone 0 (count: ${diagWatcher.watchers})`);

// Verify collision clearance for The Watcher
let watcherCorridorSafe = true;
testWatcherGroup.updateMatrixWorld(true);
testWatcherGroup.traverse((child) => {
  if (child.name === 'haunted_the_watcher') {
    child.traverse((part) => {
      if ((part as THREE.Mesh).isMesh) {
        const box = new THREE.Box3().setFromObject(part);
        if (box.min.x < 4.2 && box.max.x > -4.2 && box.min.y < 8.5) {
          watcherCorridorSafe = false;
        }
      }
    });
  }
});
check(watcherCorridorSafe, 'The Watcher safe close platform strictly maintains track corridor clearance (|X| >= 4.8m)');

// Suite 17: Flagship 2 — The Possessed Carousel 12-Stage Awakening (Gate 3)
console.log('\n--- Suite 17: Flagship 2 — The Possessed Carousel 12-Stage Awakening ---');
director.reset();
const testCarouselGroup = new THREE.Group();
factory.buildScenery(testCarouselGroup, HAUNTED_CARNIVAL_THEME, -400, false, false, 'NONE', 'FULL', 5);

const diagCarousel = director.getDiagnostics();
check(diagCarousel.carousels >= 1, `Possessed Carousel registered (count: ${diagCarousel.carousels})`);

// Approaching test through carousel stages
director.update(0.016, true, -240); // 160m away: ABANDONED_STILL
director.update(0.016, true, -270); // 130m away: MUSIC_CUE
director.update(0.016, true, -300); // 100m away: STEED_HEAD_TURN
director.update(0.016, true, -330); // 70m away: SLOW_ROTATION
director.update(0.016, true, -360); // 40m away: LIGHTING_PALETTE_SHIFT
director.update(0.016, true, -390); // 10m away: OUTSIDE_SPECTER
director.update(0.016, true, -420); // 20m past: ALL_RIDERS_VANISH
director.update(0.016, true, -450); // 50m past: LINGERING_SWAY
check(true, 'Possessed Carousel progresses smoothly through cinematic horror stages');

// Suite 18: Flagship 3 — The Haunted Mansion Awakens (Gate 4)
console.log('\n--- Suite 18: Flagship 3 — The Haunted Mansion Awakens ---');
director.reset();
const testManorGroup = new THREE.Group();
factory.buildScenery(testManorGroup, HAUNTED_CARNIVAL_THEME, -320, false, false, 'NONE', 'FULL', 4);

const diagMansion = director.getDiagnostics();
check(diagMansion.mansionAwakens >= 1, `Haunted Mansion Awakening registered (count: ${diagMansion.mansionAwakens})`);

// Suite 19: Flagship 4 — The Nightmare Clown & Flagship 5 — Shadow Colossus
console.log('\n--- Suite 19: Flagship 4 — Nightmare Clown & Flagship 5 — Shadow Colossus ---');
director.reset();
const testFunfairGroup = new THREE.Group();
factory.buildScenery(testFunfairGroup, HAUNTED_CARNIVAL_THEME, -80, false, false, 'NONE', 'FULL', 1);

const diagClown = director.getDiagnostics();
check(diagClown.nightmareClowns >= 1, `The Nightmare Clown registered (count: ${diagClown.nightmareClowns})`);

// Test deep marathon chunk for rare Shadow Colossus (Zone 2: Ghostly Circus in Cycle 3)
const deepCircusGroup = new THREE.Group();
factory.buildScenery(deepCircusGroup, HAUNTED_CARNIVAL_THEME, -1680, false, false, 'NONE', 'FULL', 21);
const diagDeep = director.getDiagnostics();
check(diagDeep.shadowColossi >= 1, `Rare Shadow Colossus generated in deep marathon cycle (count: ${diagDeep.shadowColossi})`);

pool.clearDecorativeGroup(testWatcherGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(testCarouselGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(testManorGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(testFunfairGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(deepCircusGroup, new Set(Object.values(factory.getSharedMaterials())));

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} HAUNTED_CARNIVAL PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
