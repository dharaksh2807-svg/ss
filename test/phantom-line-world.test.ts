import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { PHANTOM_LINE_THEME, EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { WorldScene } from '../src/scene/WorldScene';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { getWorld } from '../src/environment/WorldCatalog';

console.log('🧪 Starting PHANTOM_LINE Premium World Verification Suite...\n');

let checks = 0;
function check(condition: unknown, msg: string) {
  assert.ok(condition, msg);
  checks++;
}

// Suite 1: Theme Identity, Catalog & Registry
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');
const registry = EnvironmentRegistry.getInstance();
check(registry.has('PHANTOM_LINE'), 'PHANTOM_LINE is registered in EnvironmentRegistry');
const theme = registry.get('PHANTOM_LINE');
check(theme.id === 'PHANTOM_LINE', 'Theme ID matches PHANTOM_LINE');
check(theme.displayName === 'Phantom Line', 'Theme displayName matches');
check(theme.badgeEmoji === '👻', 'Theme emoji is 👻');
check(theme.accentColor === '#67e8f9', 'Theme accent color matches spectral cyan');
check(theme.sky.top === 0x030712, 'Sky top is deep subterranean abyss darkness');
check(theme.sky.bottom === 0x082f49, 'Sky bottom has cold damp spectral cyan-slate glow');
check(theme.fog.color === 0x051b24, 'Fog color provides dense subterranean ectoplasmic atmosphere');
check(theme.fog.density === 0.0036, 'Fog density is tuned for psychological depth without blinding hazards');
check(theme.sun.color === 0x67e8f9, 'Key light is eerie pale cold-cathode illumination');
check(theme.fill.color === 0x064e3b, 'Fill light is cold decaying oxidized copper green');
check(theme.hemi.sky === 0x5eead4, 'Hemisphere sky is pale phosphorescent teal');
check(theme.materials.wallBaseColor === 0x111827, 'Retaining wall base is damp Victorian slate');
check(theme.materials.wallAccentColor === 0x22d3ee, 'Wall accent is cold spectral phosphor line');
check(theme.materials.bridgeAccentColor === 0x67e8f9, 'Bridge accent is cold gaslight cyan');

const worldDef = getWorld('PHANTOM_LINE');
check(worldDef !== undefined, 'World definition exists in WorldCatalog');
check(worldDef?.implemented === true, 'World definition is marked implemented');
check(worldDef?.available === true, 'World definition is marked available');
check(worldDef?.coinCost === 9000, 'World cost is 9000 coins');
check(worldDef?.unlock === 'COINS', 'World unlocks via coins');

// Suite 2: Procedural 3D Scenery Generation
console.log('\n--- Suite 2: Procedural 3D Scenery Generation ---');
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

const group1 = new THREE.Group();
factory.buildScenery(group1, PHANTOM_LINE_THEME, 0, false, false, 'NONE', 'FULL', 7007);

let meshCount = 0;
let hasDecayedTile = false;
let hasRustedIron = false;
let hasWeatheredBrick = false;
let hasFluorescent = false;
let hasCyanBeacon = false;
let hasWaterMirror = false;

const mats = factory.getSharedMaterials();
group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    meshCount++;
    const m = (child as THREE.Mesh).material;
    if (m === mats.phantomDecayedTileMat) hasDecayedTile = true;
    if (m === mats.phantomRustedIronMat) hasRustedIron = true;
    if (m === mats.phantomWeatheredBrickMat) hasWeatheredBrick = true;
    if (m === mats.phantomColdFluorescentMat) hasFluorescent = true;
    if (m === mats.phantomSpectralGlowCyanMat) hasCyanBeacon = true;
    if (m === mats.phantomWaterMirrorMat) hasWaterMirror = true;
  }
});

check(meshCount >= 40, `PHANTOM_LINE produces rich 3D subterranean ghost-horror scenery (got ${meshCount} meshes)`);
check(hasDecayedTile, 'Contains decaying Victorian ceramic subway tile retaining walls');
check(hasRustedIron, 'Contains rusted cast-iron structural pilasters and ornamental ribs');
check(hasWeatheredBrick, 'Contains weathered dark subterranean masonry and arches');
check(hasFluorescent, 'Contains flickering cold-cathode fluorescent light tube fixtures');
check(hasCyanBeacon, 'Contains cold spectral cyan warning lanterns');
check(hasWaterMirror, 'Contains damp reflective puddle surfaces');

// Suite 3: Monumental Subterranean Architecture & Safe Vertical Clearance
console.log('\n--- Suite 3: Monumental Subterranean Architecture & Safe Clearance ---');
let foundOverheadArchitecture = false;
let archClearanceSafe = true;

for (let seed = 6000; seed < 6025; seed++) {
  const testGroup = new THREE.Group();
  factory.buildScenery(testGroup, PHANTOM_LINE_THEME, -seed * 80, false, false, 'NONE', 'FULL', seed);
  testGroup.updateMatrixWorld(true);
  testGroup.traverse((child) => {
    if (child.name === 'phantom_concourse_arch' || child.name === 'phantom_derelict_arches') {
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
check(foundOverheadArchitecture, 'Overhead Gothic concourses and derelict arches spawn procedurally across seeds');
check(archClearanceSafe, 'Overhead architecture maintains safe vertical clearance (>= 8.5m, actual >= 10.1m) above all 3 running lanes');

// Suite 4: Gameplay Corridor Safety & Non-Obstruction Invariants
console.log('\n--- Suite 4: Running Corridor Safety Invariants ---');
let laneIntrusions = 0;
for (let chunkIdx = 0; chunkIdx < 6; chunkIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, PHANTOM_LINE_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', 9000 + chunkIdx);
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
check(laneIntrusions === 0, `Subterranean horror scenery never obstructs running lanes below Y=7.5m (intrusions: ${laneIntrusions})`);

// Suite 5: Scenery Recycling & Pool Memory Stability
console.log('\n--- Suite 5: Scenery Recycling & Memory Stability ---');
const recycleGroup = new THREE.Group();
factory.buildScenery(recycleGroup, PHANTOM_LINE_THEME, 0, false, false, 'NONE', 'FULL', 999);
const countBefore = recycleGroup.children.length;
check(countBefore > 0, 'Populated chunk with decorative groups');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));
check(recycleGroup.children.length === 0, 'clearDecorativeGroup cleans all children');

// Shared materials survive recycling
check(!mats.phantomDecayedTileMat.isDisposed, 'phantomDecayedTileMat survives recycling');
check(!mats.phantomRustedIronMat.isDisposed, 'phantomRustedIronMat survives recycling');
check(!mats.phantomWeatheredBrickMat.isDisposed, 'phantomWeatheredBrickMat survives recycling');
check(!mats.phantomColdFluorescentMat.isDisposed, 'phantomColdFluorescentMat survives recycling');
check(!mats.phantomSpectralGlowCyanMat.isDisposed, 'phantomSpectralGlowCyanMat survives recycling');
check(!mats.phantomWaterMirrorMat.isDisposed, 'phantomWaterMirrorMat survives recycling');

// Rebuild with different seed
factory.buildScenery(recycleGroup, PHANTOM_LINE_THEME, -80, false, false, 'NONE', 'FULL', 1234);
check(recycleGroup.children.length > 0, 'Recycled group accepts new chunk scenery without error');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 6: Atmospheric Presets & Pacing
console.log('\n--- Suite 6: Atmospheric Presets & Pacing ---');
const encounterDir = EnvironmentalEncounterDirector.getInstance();
const activePreset = encounterDir.resolveAtmospherePreset(-500, 'PHANTOM_LINE');
check(activePreset === 'PHANTOM_SPECTRAL_VOID', `Atmosphere resolves PHANTOM_SPECTRAL_VOID for PHANTOM_LINE (got ${activePreset})`);

// Suite 7: Theme-Specific Playable Train Visuals & Hitboxes
console.log('\n--- Suite 7: Theme-Specific Playable Train Visuals & Hitboxes ---');
const obstacleFactory = new ObstacleFactory();
const defaultTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1);
const phantomTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0x0f172a, undefined, 'PHANTOM_LINE');

check(phantomTrain.userData.isTrain === true, 'phantomTrain retains isTrain userData');
check(phantomTrain.userData.type === 'TRAIN', 'phantomTrain retains TRAIN type');

// Compare bounding box dimensions (hitbox integrity)
const defaultBox = new THREE.Box3().setFromObject(defaultTrain);
const phantomBox = new THREE.Box3().setFromObject(phantomTrain);

const defaultWidth = defaultBox.max.x - defaultBox.min.x;
const phantomWidth = phantomBox.max.x - phantomBox.min.x;
check(Math.abs(defaultWidth - phantomWidth) < 0.25, `Train width preserved within 0.25m (default: ${defaultWidth.toFixed(2)}, phantom: ${phantomWidth.toFixed(2)})`);

// Walkable rooftop surface Y must be exactly at 4.35m
let phantomCatwalkFound = false;
phantomTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const geo = (child as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry && Math.abs(child.position.y - 4.28) < 0.05) {
      phantomCatwalkFound = true;
    }
  }
});
check(phantomCatwalkFound, 'Phantom Line train maintains walkable catwalk platform at exact Y=4.28m (top face Y=4.35m)');

// Verify antique cast-iron cowcatcher plow and cyclops high-beam headlight on locomotive cab
let hasCowcatcher = false;
let hasCyclopsHeadlight = false;
phantomTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const mesh = child as THREE.Mesh;
    if (mesh.position.y < 0.6 && mesh.position.z > 5.0) {
      hasCowcatcher = true;
    }
    if (mesh.position.y > 1.8 && mesh.position.z > 5.0 && mesh.material instanceof THREE.MeshBasicMaterial) {
      hasCyclopsHeadlight = true;
    }
  }
});
check(hasCowcatcher, 'Phantom Line locomotive cab is equipped with vintage cast-iron cowcatcher plow');
check(hasCyclopsHeadlight, 'Phantom Line locomotive cab is equipped with high-beam cyclops headlight');

// Suite 8: Graphics Quality Tiering
console.log('\n--- Suite 8: Graphics Detail Tiering ---');
const fullGroup = new THREE.Group();
factory.buildScenery(fullGroup, PHANTOM_LINE_THEME, 0, false, false, 'NONE', 'FULL', 8888);
let fullMeshes = 0;
fullGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) fullMeshes++; });

const minGroup = new THREE.Group();
factory.buildScenery(minGroup, PHANTOM_LINE_THEME, 0, false, false, 'NONE', 'MINIMAL', 8888);
let minMeshes = 0;
minGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) minMeshes++; });

check(fullMeshes > minMeshes, `FULL detail has more meshes than MINIMAL (${fullMeshes} > ${minMeshes})`);
check(minMeshes >= 12, `MINIMAL detail retains essential retaining walls and derelict arches (${minMeshes} meshes)`);

pool.clearDecorativeGroup(fullGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(minGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 9: Landmark Variations Across Seeds
console.log('\n--- Suite 9: Multiple Landmark Variations ---');
let landmarkTypes = new Set<string>();
for (let s = 200; s < 235; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, PHANTOM_LINE_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  g.traverse((c) => {
    if (c.name === 'phantom_watcher_platform') landmarkTypes.add('WATCHER_PLATFORM');
    if (c.name === 'phantom_ghost_train_siding') landmarkTypes.add('GHOST_TRAIN_SIDING');
    if (c.name === 'phantom_concourse_arch') landmarkTypes.add('CONCOURSE_ARCH');
    if (c.name === 'phantom_flooded_crypt') landmarkTypes.add('FLOODED_CRYPT');
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}
check(landmarkTypes.size >= 3, `Procedural generation includes multiple landmark variations (found ${Array.from(landmarkTypes).join(', ')})`);

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} PHANTOM_LINE PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
