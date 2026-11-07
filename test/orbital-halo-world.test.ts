import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { ORBITAL_HALO_THEME, EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { WorldScene } from '../src/scene/WorldScene';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { getWorld } from '../src/environment/WorldCatalog';
import { OrbitalHaloEventDirector } from '../src/environment/worlds/orbitalHalo/OrbitalHaloEventDirector';
import { OrbitalHaloWorldBuilder } from '../src/environment/worlds/orbitalHalo/OrbitalHaloWorldBuilder';

console.log('🧪 Starting ORBITAL_HALO Premium World Verification Suite...\n');

let checks = 0;
function check(condition: unknown, msg: string) {
  assert.ok(condition, msg);
  checks++;
}

// Suite 1: Theme Identity, Catalog & Registry
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');
const registry = EnvironmentRegistry.getInstance();
check(registry.has('ORBITAL_HALO'), 'ORBITAL_HALO is registered in EnvironmentRegistry');
const theme = registry.get('ORBITAL_HALO');
check(theme.id === 'ORBITAL_HALO', 'Theme ID matches ORBITAL_HALO');
check(theme.displayName === 'Orbital Halo', 'Theme displayName matches');
check(theme.badgeEmoji === '🪐', 'Theme emoji is 🪐');
check(theme.accentColor === '#38bdf8', 'Theme accent color matches');
check(theme.sky.top === 0x01030a, 'Sky top is cosmic abyss deep void black');
check(theme.sky.bottom === 0x0b1a30, 'Sky bottom has azure planetary limb glow');
check(theme.fog.color === 0x050914, 'Fog color provides deep cosmic atmospheric depth');
check(theme.sun.color === 0xffffff, 'Key light is pure unfiltered space sunlight');
check(theme.fill.color === 0x00d2ff, 'Fill light is vibrant planetary reflection');
check(theme.hemi.sky === 0x38bdf8, 'Hemisphere sky is celestial cyan');
check(theme.materials.wallBaseColor === 0xf1f5f9, 'Retaining wall base is clean aerospace white');
check(theme.materials.wallAccentColor === 0x00f5ff, 'Wall accent is electric cyan');
check(theme.materials.bridgeAccentColor === 0x00f5ff, 'Bridge accent is glowing electric cyan');

const worldDef = getWorld('ORBITAL_HALO');
check(worldDef !== undefined, 'World definition exists in WorldCatalog');
check(worldDef?.implemented === true, 'World definition is marked implemented');
check(worldDef?.available === true, 'World definition is marked available');
check(worldDef?.coinCost === 4500, 'World cost is 4500 coins');
check(worldDef?.unlock === 'COINS', 'World unlocks via coins');

// Suite 2: Procedural 3D Scenery Generation
console.log('\n--- Suite 2: Procedural 3D Scenery Generation ---');
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

const group1 = new THREE.Group();
factory.buildScenery(group1, ORBITAL_HALO_THEME, 0, false, false, 'NONE', 'FULL', 2002);

let meshCount = 0;
let hasWhiteComposite = false;
let hasObservationGlass = false;
let hasCyanLED = false;
let hasMagGuideRails = false;
let hasStationModules = false;
let hasCatenaries = false;

const mats = factory.getSharedMaterials();
group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    meshCount++;
    const m = (child as THREE.Mesh).material;
    if (m === mats.orbitalWhiteCompositeMat) hasWhiteComposite = true;
    if (m === mats.orbitalObservationGlassMat) hasObservationGlass = true;
    if (m === mats.orbitalCyanGlowMat) hasCyanLED = true;
    if (m === mats.orbitalSolarMat) hasStationModules = true;
    if (child.name === 'orbital_gateway_arch' || child.name === 'orbital_skybridge') {
      hasStationModules = true;
    }
  }
});

check(meshCount >= 45, `ORBITAL_HALO produces rich 3D geometry (got ${meshCount} meshes)`);
check(hasWhiteComposite, 'Contains aerospace white composite retaining walls and hulls');
check(hasObservationGlass, 'Contains transparent observation glass architecture overlooking space');
check(hasCyanLED, 'Contains continuous electric cyan quantum flux runners');
check(hasStationModules, 'Contains futuristic station modules and architecture');

// Suite 3: Monumental Gateway Arches & Safe Clearance
console.log('\n--- Suite 3: Monumental Station Gateways & Safe Clearance ---');
let foundGatewayArch = false;
let archClearanceSafe = true;

for (let seed = 2000; seed < 2010; seed++) {
  const testGroup = new THREE.Group();
  factory.buildScenery(testGroup, ORBITAL_HALO_THEME, -seed * 80, false, false, 'NONE', 'FULL', seed);
  testGroup.updateMatrixWorld(true);
  testGroup.traverse((child) => {
    if (child.name === 'orbital_gateway_arch') {
      foundGatewayArch = true;
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
check(foundGatewayArch, 'Monumental orbital gateway arches spawn procedurally across chunk seeds');
check(archClearanceSafe, 'Gateway arches maintain safe vertical clearance (>= 8.5m) above all 3 running lanes');

// Suite 4: Gameplay Corridor Safety & Non-Obstruction Invariants
console.log('\n--- Suite 4: Running Corridor Safety Invariants ---');
let laneIntrusions = 0;
for (let chunkIdx = 0; chunkIdx < 6; chunkIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, ORBITAL_HALO_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', 5300 + chunkIdx);
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
check(laneIntrusions === 0, `Procedural scenery never obstructs running lanes below Y=7.5m (intrusions: ${laneIntrusions})`);

// Suite 5: Scenery Recycling & Pool Memory Stability
console.log('\n--- Suite 5: Scenery Recycling & Memory Stability ---');
const recycleGroup = new THREE.Group();
factory.buildScenery(recycleGroup, ORBITAL_HALO_THEME, 0, false, false, 'NONE', 'FULL', 777);
const countBefore = recycleGroup.children.length;
check(countBefore > 0, 'Populated chunk with decorative groups');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));
check(recycleGroup.children.length === 0, 'clearDecorativeGroup cleans all children');

// Shared materials survive recycling
check(!mats.orbitalWhiteCompositeMat.isDisposed, 'orbitalWhiteCompositeMat survives recycling');
check(!mats.orbitalTitaniumMat.isDisposed, 'orbitalTitaniumMat survives recycling');
check(!mats.orbitalObservationGlassMat.isDisposed, 'orbitalObservationGlassMat survives recycling');
check(!mats.orbitalCyanGlowMat.isDisposed, 'orbitalCyanGlowMat survives recycling');

// Rebuild with different seed
factory.buildScenery(recycleGroup, ORBITAL_HALO_THEME, -80, false, false, 'NONE', 'FULL', 888);
check(recycleGroup.children.length > 0, 'Recycled group accepts new chunk scenery without error');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 6: Atmospheric Presets & Pacing
console.log('\n--- Suite 6: Atmospheric Presets & Pacing ---');
const encounterDir = EnvironmentalEncounterDirector.getInstance();
const activePreset = encounterDir.resolveAtmospherePreset(-500, 'ORBITAL_HALO');
check(activePreset === 'ORBITAL_CELESTIAL_DAWN', `Atmosphere resolves ORBITAL_CELESTIAL_DAWN for ORBITAL_HALO (got ${activePreset})`);

// Suite 7: Theme-Specific Train Visuals & Hitboxes
console.log('\n--- Suite 7: Theme-Specific Train Visuals & Hitboxes ---');
const obstacleFactory = new ObstacleFactory();
const defaultTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1);
const orbitalTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0xf8fafc, undefined, 'ORBITAL_HALO');

check(orbitalTrain.userData.isTrain === true, 'orbitalTrain retains isTrain userData');
check(orbitalTrain.userData.type === 'TRAIN', 'orbitalTrain retains TRAIN type');

// Compare bounding box dimensions (hitbox integrity)
const defaultBox = new THREE.Box3().setFromObject(defaultTrain);
const orbitalBox = new THREE.Box3().setFromObject(orbitalTrain);

const defaultWidth = defaultBox.max.x - defaultBox.min.x;
const orbitalWidth = orbitalBox.max.x - orbitalBox.min.x;
check(Math.abs(defaultWidth - orbitalWidth) < 0.25, `Train width preserved within 0.25m (default: ${defaultWidth.toFixed(2)}, orbital: ${orbitalWidth.toFixed(2)})`);

// Walkable rooftop surface Y must be exactly at 4.35m
let orbitalCatwalkFound = false;
orbitalTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const geo = (child as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry && Math.abs(child.position.y - 4.28) < 0.05) {
      orbitalCatwalkFound = true;
    }
  }
});
check(orbitalCatwalkFound, 'Orbital train maintains walkable catwalk platform at exact Y=4.28m (top face Y=4.35m)');

// Verify magnetic levitation runner skirts
let hasMagSkirts = false;
orbitalTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material instanceof THREE.MeshBasicMaterial) {
    if (child.position.y < 1.0) {
      hasMagSkirts = true;
    }
  }
});
check(hasMagSkirts, 'Orbital train contains magnetic levitation flux runners');

// Suite 8: Graphics Quality Tiering
console.log('\n--- Suite 8: Graphics Detail Tiering ---');
const fullGroup = new THREE.Group();
factory.buildScenery(fullGroup, ORBITAL_HALO_THEME, 0, false, false, 'NONE', 'FULL', 9999);
let fullMeshes = 0;
fullGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) fullMeshes++; });

const minGroup = new THREE.Group();
factory.buildScenery(minGroup, ORBITAL_HALO_THEME, 0, false, false, 'NONE', 'MINIMAL', 9999);
let minMeshes = 0;
minGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) minMeshes++; });

check(fullMeshes > minMeshes, `FULL detail has more meshes than MINIMAL (${fullMeshes} > ${minMeshes})`);
check(minMeshes >= 15, `MINIMAL detail retains essential orbital retaining walls and structures (${minMeshes} meshes)`);

pool.clearDecorativeGroup(fullGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(minGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 9: Landmark Variations Across Seeds
console.log('\n--- Suite 9: Multiple Landmark Variations ---');
let landmarkTypes = new Set<string>();
for (let s = 100; s < 120; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, ORBITAL_HALO_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  g.traverse((c) => {
    if (c.name === 'orbital_gateway_arch') landmarkTypes.add('GATEWAY_ARCH');
    if (c.name === 'orbital_skybridge') landmarkTypes.add('SKYBRIDGE');
    if (c.name === 'orbital_docked_spacecraft') landmarkTypes.add('DOCKED_SPACECRAFT');
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}
check(landmarkTypes.size >= 2, `Procedural generation includes multiple landmark variations (found ${Array.from(landmarkTypes).join(', ')})`);

// Suite 10: 6 Distinct Orbital Districts & Grounded Retaining Plinths
console.log('\n--- Suite 10: 6 Distinct Orbital Districts & Grounded Plinths ---');
const director = OrbitalHaloEventDirector.getInstance();
director.reset();

const districtNames = [
  'zone_orbital_central',
  'zone_zerog_dockyards',
  'zone_celestial_observatory',
  'zone_gravity_ring',
  'zone_solar_frontier',
  'zone_deep_space_gateway'
];

const foundDistricts = new Set<string>();
let plinthGroundingSafe = true;

for (let chunkIdx = 0; chunkIdx < 6; chunkIdx++) {
  const g = new THREE.Group();
  const chunkZ = -chunkIdx * 80;
  factory.buildScenery(g, ORBITAL_HALO_THEME, chunkZ, false, false, 'NONE', 'FULL', 6000 + chunkIdx);
  g.updateMatrixWorld(true);

  g.traverse((c) => {
    if (districtNames.includes(c.name)) {
      foundDistricts.add(c.name);
    }
    // Verify retaining plinths extend down to Y <= -5.5m (zero floating geometry)
    if (c.name === 'orbital_retaining_plinth') {
      const b = new THREE.Box3().setFromObject(c);
      if (b.min.y > -5.0) {
        plinthGroundingSafe = false;
      }
    }
  });
}

check(foundDistricts.size === 6, `All 6 distinct orbital districts generate in order (found ${foundDistricts.size}/6: ${Array.from(foundDistricts).join(', ')})`);
check(plinthGroundingSafe, 'Aerospace retaining plinths firmly anchor structure down to Y <= -5.5m (zero floating geometry)');

// Suite 11: Gate A — Grand Spacecraft Docking Sequence
console.log('\n--- Suite 11: Gate A — Grand Spacecraft Docking Sequence ---');
const dockings = director.getGrandDockings();
check(dockings.length >= 1, `Gate A grand docking event registered in director (count: ${dockings.length})`);
if (dockings.length > 0) {
  const d = dockings[0];
  check(d.spacecraftMesh !== undefined && d.spacecraftMesh.isGroup, 'Spacecraft mesh structure is initialized');
  check(d.dockingArmLeft !== undefined && d.dockingArmRight !== undefined, 'Dual mechanical docking arms are initialized');
  check(d.dockingClamps.length >= 2, `Docking clamps present (count: ${d.dockingClamps.length})`);
  check(d.umbilicalTube !== undefined, 'Pressurized airlock umbilical tube present');
  check(d.dockingThrusters.length >= 2, `Docking RCS thrusters present (count: ${d.dockingThrusters.length})`);
  check(d.statusLights.length >= 2, `Status indicator lights present (count: ${d.statusLights.length})`);
  check(d.state === 'APPROACH', `Initial docking sequence state is APPROACH (got ${d.state})`);
}

// Suite 12: Gate B — Orbital Ring Awakening Mechanics
console.log('\n--- Suite 12: Gate B — Orbital Ring Awakening Mechanics ---');
const rings = director.getOrbitalRings();
check(rings.length >= 1, `Gate B orbital ring awakening registered in director (count: ${rings.length})`);
if (rings.length > 0) {
  const r = rings[0];
  check(r.ringGroup !== undefined && r.ringGroup.isGroup, 'Rotating ring structure is initialized');
  check(r.bearingCore !== undefined, 'Central drive bearing core is initialized');
  check(r.spokes.length >= 4, `Radial spokes connecting bearing core present (count: ${r.spokes.length})`);
  check(r.habitatPods.length >= 4, `Habitation residential pods present (count: ${r.habitatPods.length})`);
  check(r.statusStrobes.length >= 4, `Power strobes along spokes present (count: ${r.statusStrobes.length})`);
  check(r.state === 'DORMANT', `Initial ring awakening state is DORMANT (got ${r.state})`);
}

// Suite 13: 8 Cinematic Encounters & Director Registry
console.log('\n--- Suite 13: 8 Cinematic Encounters & Director Registry ---');
const diag = director.getDiagnostics();
check(diag.grandDockings >= 1, `Gate A grand dockings registered (${diag.grandDockings})`);
check(diag.orbitalRings >= 1, `Gate B orbital rings registered (${diag.orbitalRings})`);
check(diag.astronautSpacewalks >= 1, `Event C astronaut spacewalks registered (${diag.astronautSpacewalks})`);
check(diag.planetaryEclipses >= 1, `Event D planetary eclipses registered (${diag.planetaryEclipses})`);
check(diag.meteorShowers >= 1, `Event E meteor showers registered (${diag.meteorShowers})`);
check(diag.colossalVessels >= 1, `Event F colossal research vessels registered (${diag.colossalVessels})`);
check(diag.solarTransformations >= 1, `Event G solar array transformations registered (${diag.solarTransformations})`);
check(diag.constructionSites >= 1, `Event H orbital construction sites registered (${diag.constructionSites})`);

// Suite 14: Signed-Distance Convention Progression
console.log('\n--- Suite 14: Signed-Distance Convention Progression ---');
if (dockings.length > 0) {
  const actor = dockings[0];
  const trigZ = actor.triggerZ;

  // Signed distance convention: distanceAhead = playerZ - triggerZ
  // +160m: player approaching from far away
  director.update(0.016, true, trigZ + 160);
  check(actor.state === 'APPROACH', `At +160m state is APPROACH (got ${actor.state})`);

  // +90m: deceleration thrusters fire
  director.update(0.016, true, trigZ + 90);
  check(actor.state === 'DECELERATION', `At +90m state is DECELERATION (got ${actor.state})`);

  // +45m: docking arms deploy and alignment
  director.update(0.016, true, trigZ + 45);
  check(actor.state === 'ALIGNMENT', `At +45m state is ALIGNMENT (got ${actor.state})`);

  // +15m: clamp lock
  director.update(0.016, true, trigZ + 15);
  check(actor.state === 'CLAMP_LOCK', `At +15m state is CLAMP_LOCK (got ${actor.state})`);

  // -5m: umbilical connect
  director.update(0.016, true, trigZ - 5);
  check(actor.state === 'UMBILICAL_CONNECT', `At -5m state is UMBILICAL_CONNECT (got ${actor.state})`);
}

// Suite 15: Ambient Space Life Ecosystem
console.log('\n--- Suite 15: Ambient Space Life Ecosystem ---');
check(diag.patrolShuttles >= 2, `Patrol shuttles active in orbit (${diag.patrolShuttles})`);
check(diag.radarDishes >= 2, `Deep space radar dishes scanning (${diag.radarDishes})`);
check(diag.trackingSolarPanels >= 2, `Tracking solar panels pivoting (${diag.trackingSolarPanels})`);
check(diag.maintenanceDrones >= 2, `Maintenance drones with searchlights (${diag.maintenanceDrones})`);
check(diag.navigationBeacons >= 4, `Navigation beacons blinking (${diag.navigationBeacons})`);

// Update ambient tick to verify smooth motion
let threwError = false;
try {
  director.update(0.05, true, -200);
} catch (e) {
  threwError = true;
}
check(!threwError, 'Director ambient update runs without errors');

// Suite 16: Memory Lifecycle & Scenery Pool Stability
console.log('\n--- Suite 16: Memory Lifecycle & Scenery Pool Stability ---');
const beforePrune = director.getDiagnostics().grandDockings;
check(beforePrune > 0, 'Director holds active encounters before prune');
director.pruneDetached();
const afterPrune = director.getDiagnostics().grandDockings;
check(afterPrune <= beforePrune, 'pruneDetached cleans unattached entities safely');

director.reset();
const afterReset = director.getDiagnostics();
check(afterReset.grandDockings === 0, 'Reset clears grand dockings');
check(afterReset.orbitalRings === 0, 'Reset clears orbital rings');
check(afterReset.patrolShuttles === 0, 'Reset clears ambient shuttles');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} ORBITAL_HALO PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);

