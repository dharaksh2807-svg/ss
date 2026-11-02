import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { ABYSSAL_GLASSLINE_THEME, EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { WorldScene } from '../src/scene/WorldScene';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { getWorld } from '../src/environment/WorldCatalog';

console.log('🧪 Starting ABYSSAL_GLASSLINE Premium World Verification Suite...\n');

let checks = 0;
function check(condition: unknown, msg: string) {
  assert.ok(condition, msg);
  checks++;
}

// Suite 1: Theme Identity, Catalog & Registry
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');
const registry = EnvironmentRegistry.getInstance();
check(registry.has('ABYSSAL_GLASSLINE'), 'ABYSSAL_GLASSLINE is registered in EnvironmentRegistry');
const theme = registry.get('ABYSSAL_GLASSLINE');
check(theme.id === 'ABYSSAL_GLASSLINE', 'Theme ID matches ABYSSAL_GLASSLINE');
check(theme.displayName === 'Abyssal Glassline', 'Theme displayName matches');
check(theme.badgeEmoji === '🌊', 'Theme emoji is 🌊');
check(theme.accentColor === '#22d3ee', 'Theme accent color matches electric cyan/teal');
check(theme.sky.top === 0x011324, 'Sky top is deep trench midnight indigo');
check(theme.sky.bottom === 0x033852, 'Sky bottom has hydrothermal ocean glow');
check(theme.fog.color === 0x021b2d, 'Fog color provides hydrostatic oceanic depth');
check(theme.sun.color === 0x38bdf8, 'Key light is sun-penetrated ocean azure');
check(theme.fill.color === 0x0d9488, 'Fill light is benthic teal glow');
check(theme.hemi.sky === 0x22d3ee, 'Hemisphere sky is bioluminescent cyan');
check(theme.materials.wallBaseColor === 0x0c2536, 'Retaining wall base is benthic marine composite');
check(theme.materials.wallAccentColor === 0x22d3ee, 'Wall accent is glowing electric cyan');
check(theme.materials.bridgeAccentColor === 0x22d3ee, 'Bridge accent is oceanic bioluminescent teal');

const worldDef = getWorld('ABYSSAL_GLASSLINE');
check(worldDef !== undefined, 'World definition exists in WorldCatalog');
check(worldDef?.implemented === true, 'World definition is marked implemented');
check(worldDef?.available === true, 'World definition is marked available');
check(worldDef?.coinCost === 6000, 'World cost is 6000 coins');
check(worldDef?.unlock === 'COINS', 'World unlocks via coins');

// Suite 2: Procedural 3D Scenery Generation
console.log('\n--- Suite 2: Procedural 3D Scenery Generation ---');
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

const group1 = new THREE.Group();
factory.buildScenery(group1, ABYSSAL_GLASSLINE_THEME, 0, false, false, 'NONE', 'FULL', 4004);

let meshCount = 0;
let hasGlassTunnel = false;
let hasTitaniumRibs = false;
let hasHydroBrass = false;
let hasBioGlow = false;
let hasCoralOrRock = false;

const mats = factory.getSharedMaterials();
group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    meshCount++;
    const m = (child as THREE.Mesh).material;
    if (m === mats.abyssalGlassTunnelMat) hasGlassTunnel = true;
    if (m === mats.abyssalTitaniumRibMat) hasTitaniumRibs = true;
    if (m === mats.abyssalHydroBrassMat) hasHydroBrass = true;
    if (m === mats.abyssalBioTealGlowMat || m === mats.abyssalBioCyanGlowMat) hasBioGlow = true;
    if (m === mats.abyssalCoralMat || m === mats.abyssalBasaltRockMat) hasCoralOrRock = true;
  }
});

check(meshCount >= 40, `ABYSSAL_GLASSLINE produces rich 3D underwater geometry (got ${meshCount} meshes)`);
check(hasGlassTunnel, 'Contains transparent reinforced pressure glass canopy vaulting over railway');
check(hasTitaniumRibs, 'Contains heavy titanium-tungsten compression ribs anchoring glass tube');
check(hasHydroBrass, 'Contains corrosion-resistant hydro-brass structural keels and flanges');
check(hasBioGlow, 'Contains bioluminescent cyan and teal illumination lines');
check(hasCoralOrRock, 'Contains deep seabed basalt rock and luminous coral formations');

// Suite 3: Monumental Vaulted Arches, Domes & Safe Clearance
console.log('\n--- Suite 3: Monumental Pressure Architecture & Safe Clearance ---');
let foundOverheadArchitecture = false;
let archClearanceSafe = true;

for (let seed = 3000; seed < 3015; seed++) {
  const testGroup = new THREE.Group();
  factory.buildScenery(testGroup, ABYSSAL_GLASSLINE_THEME, -seed * 80, false, false, 'NONE', 'FULL', seed);
  testGroup.updateMatrixWorld(true);
  testGroup.traverse((child) => {
    if (child.name === 'abyssal_sanctum_dome' || child.name === 'abyssal_skybridge' || child.name === 'abyssal_portal_arch') {
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
check(foundOverheadArchitecture, 'Overhead pressure domes and skybridges spawn procedurally across chunk seeds');
check(archClearanceSafe, 'Overhead architecture maintains safe vertical clearance (>= 8.5m) above all 3 running lanes');

// Suite 4: Gameplay Corridor Safety & Non-Obstruction Invariants
console.log('\n--- Suite 4: Running Corridor Safety Invariants ---');
let laneIntrusions = 0;
for (let chunkIdx = 0; chunkIdx < 6; chunkIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, ABYSSAL_GLASSLINE_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', 7000 + chunkIdx);
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
check(laneIntrusions === 0, `Underwater scenery never obstructs running lanes below Y=7.5m (intrusions: ${laneIntrusions})`);

// Suite 5: Scenery Recycling & Pool Memory Stability
console.log('\n--- Suite 5: Scenery Recycling & Memory Stability ---');
const recycleGroup = new THREE.Group();
factory.buildScenery(recycleGroup, ABYSSAL_GLASSLINE_THEME, 0, false, false, 'NONE', 'FULL', 999);
const countBefore = recycleGroup.children.length;
check(countBefore > 0, 'Populated chunk with decorative groups');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));
check(recycleGroup.children.length === 0, 'clearDecorativeGroup cleans all children');

// Shared materials survive recycling
check(!mats.abyssalGlassTunnelMat.isDisposed, 'abyssalGlassTunnelMat survives recycling');
check(!mats.abyssalTitaniumRibMat.isDisposed, 'abyssalTitaniumRibMat survives recycling');
check(!mats.abyssalHydroBrassMat.isDisposed, 'abyssalHydroBrassMat survives recycling');
check(!mats.abyssalBioTealGlowMat.isDisposed, 'abyssalBioTealGlowMat survives recycling');
check(!mats.abyssalCoralMat.isDisposed, 'abyssalCoralMat survives recycling');

// Rebuild with different seed
factory.buildScenery(recycleGroup, ABYSSAL_GLASSLINE_THEME, -80, false, false, 'NONE', 'FULL', 1234);
check(recycleGroup.children.length > 0, 'Recycled group accepts new chunk scenery without error');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 6: Atmospheric Presets & Pacing
console.log('\n--- Suite 6: Atmospheric Presets & Pacing ---');
const encounterDir = EnvironmentalEncounterDirector.getInstance();
const activePreset = encounterDir.resolveAtmospherePreset(-500, 'ABYSSAL_GLASSLINE');
check(activePreset === 'ABYSSAL_BIOLUMINESCENT_CHASM', `Atmosphere resolves ABYSSAL_BIOLUMINESCENT_CHASM for ABYSSAL_GLASSLINE (got ${activePreset})`);

// Suite 7: Theme-Specific Submersible Train Visuals & Hitboxes
console.log('\n--- Suite 7: Theme-Specific Submersible Train Visuals & Hitboxes ---');
const obstacleFactory = new ObstacleFactory();
const defaultTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1);
const abyssalTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0x0f3443, undefined, 'ABYSSAL_GLASSLINE');

check(abyssalTrain.userData.isTrain === true, 'abyssalTrain retains isTrain userData');
check(abyssalTrain.userData.type === 'TRAIN', 'abyssalTrain retains TRAIN type');

// Compare bounding box dimensions (hitbox integrity)
const defaultBox = new THREE.Box3().setFromObject(defaultTrain);
const abyssalBox = new THREE.Box3().setFromObject(abyssalTrain);

const defaultWidth = defaultBox.max.x - defaultBox.min.x;
const abyssalWidth = abyssalBox.max.x - abyssalBox.min.x;
check(Math.abs(defaultWidth - abyssalWidth) < 0.25, `Train width preserved within 0.25m (default: ${defaultWidth.toFixed(2)}, abyssal: ${abyssalWidth.toFixed(2)})`);

// Walkable rooftop surface Y must be exactly at 4.35m
let abyssalCatwalkFound = false;
abyssalTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const geo = (child as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry && Math.abs(child.position.y - 4.28) < 0.05) {
      abyssalCatwalkFound = true;
    }
  }
});
check(abyssalCatwalkFound, 'Abyssal train maintains walkable catwalk platform at exact Y=4.28m (top face Y=4.35m)');

// Verify submersible hydrodynamic skirts and cavitation runners
let hasHydroSkirts = false;
abyssalTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material instanceof THREE.MeshBasicMaterial) {
    if (child.position.y < 1.0) {
      hasHydroSkirts = true;
    }
  }
});
check(hasHydroSkirts, 'Abyssal train contains submersible cavitation runners');

// Suite 8: Graphics Quality Tiering
console.log('\n--- Suite 8: Graphics Detail Tiering ---');
const fullGroup = new THREE.Group();
factory.buildScenery(fullGroup, ABYSSAL_GLASSLINE_THEME, 0, false, false, 'NONE', 'FULL', 8888);
let fullMeshes = 0;
fullGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) fullMeshes++; });

const minGroup = new THREE.Group();
factory.buildScenery(minGroup, ABYSSAL_GLASSLINE_THEME, 0, false, false, 'NONE', 'MINIMAL', 8888);
let minMeshes = 0;
minGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) minMeshes++; });

check(fullMeshes > minMeshes, `FULL detail has more meshes than MINIMAL (${fullMeshes} > ${minMeshes})`);
check(minMeshes >= 12, `MINIMAL detail retains essential transparent pressure canopy and guideway (${minMeshes} meshes)`);

pool.clearDecorativeGroup(fullGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(minGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 9: Landmark Variations Across Seeds
console.log('\n--- Suite 9: Multiple Landmark Variations ---');
let landmarkTypes = new Set<string>();
for (let s = 200; s < 225; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, ABYSSAL_GLASSLINE_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  g.traverse((c) => {
    if (c.name === 'abyssal_sanctum_dome') landmarkTypes.add('SANCTUM_DOME');
    if (c.name === 'abyssal_skybridge') landmarkTypes.add('SKYBRIDGE');
    if (c.name === 'abyssal_submersible') landmarkTypes.add('DOCKED_SUBMERSIBLE');
    if (c.name === 'abyssal_chasm') landmarkTypes.add('HYDROTHERMAL_CHASM');
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}
check(landmarkTypes.size >= 2, `Procedural generation includes multiple landmark variations (found ${Array.from(landmarkTypes).join(', ')})`);

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} ABYSSAL_GLASSLINE PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
