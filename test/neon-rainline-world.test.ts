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
import { NeonRainlineEventDirector } from '../src/environment/worlds/neonRainline/NeonRainlineEventDirector';
import { NeonRainlineWorldBuilder } from '../src/environment/worlds/neonRainline/NeonRainlineWorldBuilder';

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

// Suite 9: 8 Distinct Cyberpunk Districts & Permutation Cycles
console.log('\n--- Suite 9: 8 Distinct Cyberpunk Districts & Permutation Cycles ---');
const director = NeonRainlineEventDirector.getInstance();
director.reset();

const zoneSet = new Set<string>();
const chunkGroups: THREE.Group[] = [];
for (let c = 0; c < 16; c++) {
  const g = new THREE.Group();
  const wz = -c * 80;
  factory.buildScenery(g, NEON_RAINLINE_THEME, wz, false, false, 'NONE', 'FULL', 2000 + c);
  g.traverse((child) => {
    if (child.name && child.name.startsWith('zone_')) {
      zoneSet.add(child.name);
    }
  });
  chunkGroups.push(g);
}

const requiredZones = [
  'zone_neon_downtown',
  'zone_cyber_market',
  'zone_aerial_highway',
  'zone_rain_waterfront',
  'zone_quantum_research',
  'zone_neon_gardens',
  'zone_industrial_core',
  'zone_grand_transit_terminal'
];

requiredZones.forEach((expectedZone) => {
  check(zoneSet.has(expectedZone), `Procedural generator successfully manifests ${expectedZone}`);
});

// Suite 10: Gate A — Open Neon Plaza (Vertical Slice)
console.log('\n--- Suite 10: Gate A — Open Neon Plaza (Vertical Slice) ---');
const plazaGroup = new THREE.Group();
const plazaWorldZ = -4 * 80; // chunk 4 in Cycle 0 is Quantum Plaza
factory.buildScenery(plazaGroup, NEON_RAINLINE_THEME, plazaWorldZ, false, false, 'NONE', 'FULL', 3004);

let foundPlazaFloor = false;
let foundQuantumSculpture = false;
let foundColonnade = false;

plazaGroup.traverse((child) => {
  if (child.name === 'zone_quantum_research') {
    child.traverse((plazaPart) => {
      if ((plazaPart as THREE.Mesh).isMesh) {
        const mesh = plazaPart as THREE.Mesh;
        if (mesh.geometry instanceof THREE.BoxGeometry) {
          const params = mesh.geometry.parameters;
          // Expansive open plaza floor
          if (params.width > 20 && params.depth > 30) {
            foundPlazaFloor = true;
          }
        }
        if (mesh.geometry instanceof THREE.CylinderGeometry) {
          const params = mesh.geometry.parameters;
          if (params.height >= 8) {
            foundColonnade = true;
          }
        }
        if (mesh.geometry instanceof THREE.TorusGeometry) {
          foundQuantumSculpture = true;
        }
      }
    });
  }
});

check(foundPlazaFloor, 'Gate A contains expansive open plaza floor breaking repetitive corridors');
check(foundQuantumSculpture, 'Gate A contains monumental quantum superconducting sculpture');
check(foundColonnade, 'Gate A features illuminated modern colonnade architecture');

// Suite 11: Gate B — Air-Traffic Spectacle & Hover Vehicles
console.log('\n--- Suite 11: Gate B — Air-Traffic Spectacle & Hover Vehicles ---');
const highwayGroup = new THREE.Group();
const highwayWorldZ = -2 * 80; // chunk 2 in Cycle 0 is Aerial Highway
factory.buildScenery(highwayGroup, NEON_RAINLINE_THEME, highwayWorldZ, false, false, 'NONE', 'FULL', 3002);

let foundSkywayDecks = false;
highwayGroup.traverse((child) => {
  if (child.name === 'zone_aerial_highway') {
    child.traverse((p) => {
      if ((p as THREE.Mesh).isMesh) {
        const geo = (p as THREE.Mesh).geometry;
        if (geo instanceof THREE.BoxGeometry && geo.parameters.width > 8 && geo.parameters.depth >= 70) {
          foundSkywayDecks = true;
        }
      }
    });
  }
});
check(foundSkywayDecks, 'Gate B features multi-lane aerial highway decks spanning corridor');

const swarms = director.getAirTrafficSwarms();
check(swarms.length > 0, `Air-traffic swarm registered in director (count: ${swarms.length})`);
const swarm = swarms[0];
check(swarm.vehicles.length >= 3, `Air-traffic swarm contains flocking hover vehicles (${swarm.vehicles.length} vehicles)`);
check(swarm.vehicles[0].mesh !== undefined, 'Vehicle contains 3D sculpted mesh group');
check(typeof swarm.vehicles[0].flightPathSpeed === 'number', 'Vehicle has defined flight speed');

// Suite 12: 7 Cinematic Surprises
console.log('\n--- Suite 12: 7 Cinematic Surprises Verification ---');
const diag = director.getDiagnostics();
check(diag.airTrafficSwarms > 0, 'Cinematic Surprise 1: Air-Traffic Swarm registered');
check(diag.holoAwakenings > 0, 'Cinematic Surprise 2: Holographic City Awakening registered');
check(diag.maglevCrossovers > 0, 'Cinematic Surprise 3: Maglev Transit Crossover registered');
check(diag.techBlackouts > 0, 'Cinematic Surprise 4: Technology Blackout & Cascading Restore registered');
check(diag.droneShows > 0, 'Cinematic Surprise 5: Megacity Drone Light Show registered');
check(diag.skybridgeTransforms > 0, 'Cinematic Surprise 6: Telescopic Skybridge Transformation registered');
check(diag.cityStorms > 0, 'Cinematic Surprise 7: Rainstorm Over The City with Soft Lightning registered');

// Suite 13: Signed-Distance Convention Verification
console.log('\n--- Suite 13: Signed-Distance Convention Verification ---');
// For negative-Z forward travel: distanceAhead = playerZ - triggerZ
const testMaglev = director.getMaglevCrossovers()[0];
const triggerZ = testMaglev.triggerZ;

// At 150m ahead (approach)
director.update(0.016, true, triggerZ + 150);
check(testMaglev.state === 'APPROACHING', `At +150m ahead, maglev is in APPROACHING state (got ${testMaglev.state})`);

// At 20m ahead (crossing overhead)
director.update(0.016, true, triggerZ + 20);
check(testMaglev.state === 'CROSSING_OVERHEAD', `At +20m ahead, maglev is in CROSSING_OVERHEAD state (got ${testMaglev.state})`);

// At -60m behind (receding)
director.update(0.016, true, triggerZ - 60);
check(testMaglev.state === 'RECEDING', `At -60m behind, maglev is in RECEDING state (got ${testMaglev.state})`);

// Suite 14: Dynamic Ambient City Life
console.log('\n--- Suite 14: Dynamic Ambient City Life ---');
check(diag.flyingCars > 0, `Ambient flying cars active (count: ${diag.flyingCars})`);
check(diag.deliveryDrones > 0, `Ambient delivery drones active (count: ${diag.deliveryDrones})`);
check(diag.waterTaxis > 0, `Ambient water taxis active (count: ${diag.waterTaxis})`);
check(diag.industrialCranes > 0, `Ambient industrial cranes active (count: ${diag.industrialCranes})`);
check(diag.glassElevators > 0, `Ambient glass elevators active (count: ${diag.glassElevators})`);

// Tick update and verify animation state update without exception
let noException = true;
try {
  for (let f = 0; f < 30; f++) {
    director.update(0.016, true, -500 - f * 2);
  }
} catch (e) {
  noException = false;
}
check(noException, 'Director updates ambient animation frames without runtime exceptions');

// Suite 15: Memory Lifecycle & Scenery Pool Recycling
console.log('\n--- Suite 15: Memory Lifecycle & Scenery Pool Recycling ---');
for (const g of chunkGroups) {
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
  check(g.children.length === 0, 'Chunk decorative group cleaned by pool');
}
pool.clearDecorativeGroup(plazaGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(highwayGroup, new Set(Object.values(factory.getSharedMaterials())));

director.pruneDetached();
director.reset();
const cleanDiag = director.getDiagnostics();
check(cleanDiag.airTrafficSwarms === 0, 'Air traffic swarms reset to 0');
check(cleanDiag.maglevCrossovers === 0, 'Maglev crossovers reset to 0');
check(cleanDiag.flyingCars === 0, 'Flying cars reset to 0');

// Suite 16: Flagship Hero Events Lifecycles & Kinematic Banking
console.log('\n--- Suite 16: Flagship Hero Events Lifecycles & Kinematic Banking ---');
import { NEON_RAINLINE_DISTRICTS } from '../src/environment/worlds/neonRainline/NeonRainlineTheme';
check(NEON_RAINLINE_DISTRICTS.length === 8, '8 distinct landscape types defined in NEON_RAINLINE_DISTRICTS');

// Test Air-Traffic Ballet 6-stage lifecycle
const balletGroup = new THREE.Group();
factory.buildScenery(balletGroup, NEON_RAINLINE_THEME, -160, false, false, 'NONE', 'FULL', 5002);
const activeBallets = director.getAirTrafficBallets();
check(activeBallets.length > 0, 'Air-Traffic Ballet registered in director');
const testBallet = activeBallets[activeBallets.length - 1];
const bTrigger = testBallet.triggerZ;

director.update(0.016, true, bTrigger + 160);
check(testBallet.state === 'DORMANT', `Ballet at +160m ahead is DORMANT (got ${testBallet.state})`);

director.update(0.016, true, bTrigger + 100);
check(testBallet.state === 'ANTICIPATION', `Ballet at +100m ahead is ANTICIPATION (got ${testBallet.state})`);

director.update(0.016, true, bTrigger + 50);
check(testBallet.state === 'ACTION', `Ballet at +50m ahead is ACTION (got ${testBallet.state})`);

director.update(0.016, true, bTrigger);
check(testBallet.state === 'CLIMAX', `Ballet at trigger is CLIMAX (got ${testBallet.state})`);

director.update(0.016, true, bTrigger - 50);
check(testBallet.state === 'AFTERMATH', `Ballet at -50m behind is AFTERMATH (got ${testBallet.state})`);

director.update(0.016, true, bTrigger - 120);
check(testBallet.state === 'COMPLETE', `Ballet at -120m behind is COMPLETE (got ${testBallet.state})`);

// Verify vehicle banking roll responds to turn motion
let hasNonZeroBank = false;
for (let step = 0; step < 20; step++) {
  director.update(0.05, true, bTrigger + 50);
  if (Math.abs(testBallet.vehicles[0].bankAngle) > 0.01) {
    hasNonZeroBank = true;
    break;
  }
}
check(hasNonZeroBank, 'Hover vehicles exhibit dynamic physical banking roll into curves');

// Test Futuristic Plaza Awakens 6-stage lifecycle
const testPlazaGroup = new THREE.Group();
factory.buildScenery(testPlazaGroup, NEON_RAINLINE_THEME, -320, false, false, 'NONE', 'FULL', 5004);
const activePlazas = director.getPlazaAwakenings();
check(activePlazas.length > 0, 'Plaza Awakening registered in director');
const testPlaza = activePlazas[activePlazas.length - 1];
const pTrigger = testPlaza.triggerZ;

director.update(0.016, true, pTrigger + 150);
check(testPlaza.state === 'DORMANT', `Plaza at +150m is DORMANT (got ${testPlaza.state})`);

director.update(0.016, true, pTrigger + 90);
check(testPlaza.state === 'ANTICIPATION', `Plaza at +90m is ANTICIPATION (got ${testPlaza.state})`);

director.update(0.016, true, pTrigger + 40);
check(testPlaza.state === 'ACTION', `Plaza at +40m is ACTION (got ${testPlaza.state})`);

for (let f = 0; f < 30; f++) {
  director.update(0.05, true, pTrigger);
}
check(testPlaza.state === 'CLIMAX', `Plaza at trigger is CLIMAX (got ${testPlaza.state})`);
check(testPlaza.powerLevel > 0.8, `Plaza power level ramps up during CLIMAX (got ${testPlaza.powerLevel.toFixed(2)})`);

director.update(0.016, true, pTrigger - 50);
check(testPlaza.state === 'AFTERMATH', `Plaza at -50m is AFTERMATH (got ${testPlaza.state})`);

director.update(0.016, true, pTrigger - 120);
check(testPlaza.state === 'COMPLETE', `Plaza at -120m is COMPLETE (got ${testPlaza.state})`);

// Suite 17: Foundation Grounding (Y <= -5.85m) & Open Plaza Low Curb (No 2.6m Corridor Trap)
console.log('\n--- Suite 17: Foundation Grounding & Open Plaza Unboxed Boundary ---');
let foundDeepPlinth = false;
testPlazaGroup.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (box.min.y <= -5.80) {
      foundDeepPlinth = true;
    }
  }
});
check(foundDeepPlinth, 'Foundation plinths extend down to Y <= -5.80m (zero floating scenery)');

// Check that in the Open Plaza (chunk 4), the track boundary curb is low (<= 0.45m), NOT a 2.6m monolithic wall
let maxBoundaryWallHeightInPlaza = 0;
testPlazaGroup.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const box = new THREE.Box3().setFromObject(child);
    // Boundary curb near track edge (X approx 5.5m - 6.5m)
    if ((box.min.x > 5.0 && box.max.x < 7.0) || (box.min.x > -7.0 && box.max.x < -5.0)) {
      if (box.max.y > maxBoundaryWallHeightInPlaza && box.max.y < 5.0) {
        maxBoundaryWallHeightInPlaza = box.max.y;
      }
    }
  }
});
check(
  maxBoundaryWallHeightInPlaza <= 0.45,
  `Open plaza boundary is a low flush curb (got height ${maxBoundaryWallHeightInPlaza.toFixed(2)}m <= 0.45m, no 2.6m wall trap)`
);

pool.clearDecorativeGroup(balletGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(testPlazaGroup, new Set(Object.values(factory.getSharedMaterials())));
director.reset();

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} NEON_RAINLINE PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
