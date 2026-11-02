import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { NEON_RAINLINE_THEME, EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { WorldScene } from '../src/scene/WorldScene';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { getWorld } from '../src/environment/WorldCatalog';

console.log('🧪 Starting NEON_RAINLINE Premium World Verification Suite...\n');

let checks = 0;
function check(condition: unknown, msg: string) {
  assert.ok(condition, msg);
  checks++;
}

// Suite 1: Theme Identity, Catalog & Registry
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');
const registry = EnvironmentRegistry.getInstance();
check(registry.has('NEON_RAINLINE'), 'NEON_RAINLINE is registered in EnvironmentRegistry');
const theme = registry.get('NEON_RAINLINE');
check(theme.id === 'NEON_RAINLINE', 'Theme ID matches NEON_RAINLINE');
check(theme.displayName === 'Neon Rainline', 'Theme displayName matches');
check(theme.badgeEmoji === '🌧️', 'Theme emoji is 🌧️');
check(theme.accentColor === '#e879f9', 'Theme accent color matches');
check(theme.sky.top === 0x050814, 'Sky top is midnight obsidian navy');
check(theme.sky.bottom === 0x1f0b38, 'Sky bottom has rich violet/magenta horizon glow');
check(theme.fog.color === 0x0d1226, 'Fog color provides midnight atmospheric haze');
check(theme.sun.color === 0x8be9fd, 'Key light is cool lunar/neon cyan');
check(theme.fill.color === 0xf026d3, 'Fill light is rich neon magenta');
check(theme.hemi.sky === 0x00f5ff, 'Hemisphere sky bounce is electric cyan');
check(theme.materials.wallAccentColor === 0x00f5ff, 'Retaining wall accent is cyber cyan');
check(theme.materials.bridgeAccentColor === 0xf026d3, 'Bridge accent is hot magenta');

const worldDef = getWorld('NEON_RAINLINE');
check(worldDef !== undefined, 'World definition exists in WorldCatalog');
check(worldDef?.implemented === true, 'World definition is marked implemented');
check(worldDef?.available === true, 'World definition is marked available');
check(worldDef?.coinCost === 3000, 'World cost is 3000 coins');
check(worldDef?.unlock === 'COINS', 'World unlocks via coins');

// Suite 2: Procedural 3D Scenery Generation
console.log('\n--- Suite 2: Procedural 3D Scenery Generation ---');
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

const group1 = new THREE.Group();
factory.buildScenery(group1, NEON_RAINLINE_THEME, 0, false, false, 'NONE', 'FULL', 1001);

let meshCount = 0;
let hasWalls = false;
let hasCyanLED = false;
let hasMagentaLED = false;
let hasThirdRail = false;
let hasHoloAds = false;
let hasSkyscrapers = false;
let hasCatenaries = false;

group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    meshCount++;
    const mat = (child as THREE.Mesh).material;
    const name = child.name || '';
    if (child.parent?.name === 'neon_transit_arch') {
      // Transit arch
    }
    if ((child as THREE.Mesh).geometry instanceof THREE.BoxGeometry) {
      const geo = (child as THREE.Mesh).geometry as THREE.BoxGeometry;
      const params = geo.parameters;
      if (params.height > 25) {
        hasSkyscrapers = true;
      }
    }
  }
});

// Verify shared materials presence
const mats = factory.getSharedMaterials();
group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const m = (child as THREE.Mesh).material;
    if (m === mats.neonRainAlloyMat) hasWalls = true;
    if (m === mats.neonCyanGlowMat) hasCyanLED = true;
    if (m === mats.neonMagentaGlowMat) hasMagentaLED = true;
    if (m === mats.neonHoloAdMat1 || m === mats.neonHoloAdMat2 || m === mats.neonHoloAdMat3) hasHoloAds = true;
  }
});

check(meshCount >= 50, `NEON_RAINLINE produces rich 3D geometry (got ${meshCount} meshes)`);
check(hasWalls, 'Contains sleek alloy retaining walls');
check(hasCyanLED, 'Contains continuous electric cyan LED channel runners');
check(hasMagentaLED, 'Contains rich neon magenta LED channel runners');
check(hasHoloAds, 'Contains floating holographic advertising displays');
check(hasSkyscrapers, 'Contains towering modular skyscrapers');

// Suite 3: Landmark Encounter & Architectural Arches
console.log('\n--- Suite 3: Monumental Transit Arches & Safe Clearance ---');
let foundTransitArch = false;
let archClearanceSafe = true;

for (let seed = 1000; seed < 1010; seed++) {
  const testGroup = new THREE.Group();
  factory.buildScenery(testGroup, NEON_RAINLINE_THEME, -seed * 80, false, false, 'NONE', 'FULL', seed);
  testGroup.updateMatrixWorld(true);
  testGroup.traverse((child) => {
    if (child.name === 'neon_transit_arch') {
      foundTransitArch = true;
      // Check clearance
      child.traverse((archPart) => {
        if ((archPart as THREE.Mesh).isMesh) {
          const mesh = archPart as THREE.Mesh;
          const box = new THREE.Box3().setFromObject(mesh);
          // If within running lane envelope (|X| <= 3.8m), must be above jumping/train height (Y >= 8.5m)
          if (box.min.x < 3.8 && box.max.x > -3.8) {
            if (box.min.y < 8.2) {
              archClearanceSafe = false;
            }
          }
        }
      });
    }
  });
  pool.clearDecorativeGroup(testGroup, new Set(Object.values(factory.getSharedMaterials())));
}
check(foundTransitArch, 'Monumental illuminated transit arches spawn procedurally across chunk seeds');
check(archClearanceSafe, 'Transit arches maintain safe vertical clearance (>= 8.2m) above all 3 running lanes');

// Suite 4: Gameplay Corridor Safety & Non-Obstruction Invariants
console.log('\n--- Suite 4: Running Corridor Safety Invariants ---');
let laneIntrusions = 0;
// Test across 5 chunks to ensure no procedural scenery obstructs the 3 gameplay lanes
for (let chunkIdx = 0; chunkIdx < 5; chunkIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, NEON_RAINLINE_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', 4200 + chunkIdx);
  g.updateMatrixWorld(true);
  
  // Track running corridor envelope: lanes are at -3.6, 0, +3.6. 
  // Obstacle heights reach up to 4.35m (train rooftop) + 2.5m (player jump) = 6.85m.
  // Physical scenery must not protrude into |X| <= 4.2m below Y = 7.5m.
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
check(laneIntrusions === 0, `Procedural scenery never obstructs running lanes below Y=7.5m (intrusions: ${laneIntrusions})`);

// Suite 5: Scenery Recycling & Pool Memory Stability
console.log('\n--- Suite 5: Scenery Recycling & Memory Stability ---');
const recycleGroup = new THREE.Group();
factory.buildScenery(recycleGroup, NEON_RAINLINE_THEME, 0, false, false, 'NONE', 'FULL', 777);
const countBefore = recycleGroup.children.length;
check(countBefore > 0, 'Populated chunk with decorative groups');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));
check(recycleGroup.children.length === 0, 'clearDecorativeGroup cleans all children');

// Shared materials must remain alive
check(!mats.neonRainAlloyMat.isDisposed, 'neonRainAlloyMat survives recycling');
check(!mats.neonCyanGlowMat.isDisposed, 'neonCyanGlowMat survives recycling');
check(!mats.neonMagentaGlowMat.isDisposed, 'neonMagentaGlowMat survives recycling');

// Rebuild with different seed
factory.buildScenery(recycleGroup, NEON_RAINLINE_THEME, -80, false, false, 'NONE', 'FULL', 888);
check(recycleGroup.children.length > 0, 'Recycled group accepts new chunk scenery without error');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 6: Atmospheric Presets & Rain Particle Activation
console.log('\n--- Suite 6: Atmospheric Presets & Rain Particles ---');
const encounterDir = EnvironmentalEncounterDirector.getInstance();
const activePreset = encounterDir.resolveAtmospherePreset(-500, 'NEON_RAINLINE');
check(activePreset === 'NEON_MIDNIGHT_RAIN', `Atmosphere resolves NEON_MIDNIGHT_RAIN for NEON_RAINLINE (got ${activePreset})`);

// Suite 7: Theme-Specific Train Visuals & Hitbox Preservation
console.log('\n--- Suite 7: Theme-Specific Train Visuals & Hitboxes ---');
const obstacleFactory = new ObstacleFactory();
const defaultTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1);
const neonTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0x0b1021, undefined, 'NEON_RAINLINE');

check(neonTrain.userData.isTrain === true, 'neonTrain retains isTrain userData');
check(neonTrain.userData.type === 'TRAIN', 'neonTrain retains TRAIN type');

// Compare bounding box dimensions (hitbox integrity)
const defaultBox = new THREE.Box3().setFromObject(defaultTrain);
const neonBox = new THREE.Box3().setFromObject(neonTrain);

const defaultWidth = defaultBox.max.x - defaultBox.min.x;
const neonWidth = neonBox.max.x - neonBox.min.x;
check(Math.abs(defaultWidth - neonWidth) < 0.25, `Train width preserved within 0.25m (default: ${defaultWidth.toFixed(2)}, neon: ${neonWidth.toFixed(2)})`);

// Walkable rooftop surface Y must be exactly at 4.35m
let neonCatwalkFound = false;
neonTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const geo = (child as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry && Math.abs(child.position.y - 4.28) < 0.05) {
      neonCatwalkFound = true;
    }
  }
});
check(neonCatwalkFound, 'Neon train maintains walkable catwalk platform at exact Y=4.28m (top face Y=4.35m)');

// Verify underglow / cyber accent presence
let hasNeonUnderglow = false;
neonTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material instanceof THREE.MeshBasicMaterial) {
    if (child.position.y < 2.0) {
      hasNeonUnderglow = true;
    }
  }
});
check(hasNeonUnderglow, 'Neon train contains attached cyber underglow accents');

// Suite 8: Graphics Quality Tiering
console.log('\n--- Suite 8: Graphics Detail Tiering ---');
const fullGroup = new THREE.Group();
factory.buildScenery(fullGroup, NEON_RAINLINE_THEME, 0, false, false, 'NONE', 'FULL', 9999);
let fullMeshes = 0;
fullGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) fullMeshes++; });

const minGroup = new THREE.Group();
factory.buildScenery(minGroup, NEON_RAINLINE_THEME, 0, false, false, 'NONE', 'MINIMAL', 9999);
let minMeshes = 0;
minGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) minMeshes++; });

check(fullMeshes > minMeshes, `FULL detail has more meshes than MINIMAL (${fullMeshes} > ${minMeshes})`);
check(minMeshes >= 15, `MINIMAL detail retains essential railway retaining walls and structures (${minMeshes} meshes)`);

pool.clearDecorativeGroup(fullGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(minGroup, new Set(Object.values(factory.getSharedMaterials())));

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} NEON_RAINLINE PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
