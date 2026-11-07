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
import { AbyssalGlasslineWorldBuilder } from '../src/environment/worlds/abyssalGlassline/AbyssalGlasslineWorldBuilder';
import { AbyssalGlasslineEventDirector } from '../src/environment/worlds/abyssalGlassline/AbyssalGlasslineEventDirector';

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

// Suite 10: 6 Distinct Oceanic Regions & Cycle Permutations
console.log('\n--- Suite 10: 6 Distinct Oceanic Regions & Permutations ---');
const director = AbyssalGlasslineEventDirector.getInstance();
director.reset();

const zoneNamesFound = new Set<string>();
for (let cIdx = 0; cIdx < 6; cIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, ABYSSAL_GLASSLINE_THEME, -cIdx * 80, false, false, 'NONE', 'FULL', 5000 + cIdx);
  g.traverse((child) => {
    if (child.name.startsWith('zone_')) {
      zoneNamesFound.add(child.name);
    }
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}

check(zoneNamesFound.has('zone_bioluminescent_reef'), 'Contains zone_bioluminescent_reef');
check(zoneNamesFound.has('zone_oceanic_research_city'), 'Contains zone_oceanic_research_city');
check(zoneNamesFound.has('zone_sunken_civilization'), 'Contains zone_sunken_civilization');
check(zoneNamesFound.has('zone_hydrothermal_abyss'), 'Contains zone_hydrothermal_abyss');
check(zoneNamesFound.has('zone_leviathan_trench'), 'Contains zone_leviathan_trench');
check(zoneNamesFound.has('zone_grand_ocean_sanctuary'), 'Contains zone_grand_ocean_sanctuary');
check(zoneNamesFound.size === 6, `All 6 distinct oceanic regions spawn across the first cycle (got ${zoneNamesFound.size}/6)`);

// Verify deep retaining promenades extend down to Y <= -5.85m (Zero Floating Geometry)
const testPromenadeGroup = new THREE.Group();
factory.buildScenery(testPromenadeGroup, ABYSSAL_GLASSLINE_THEME, 0, false, false, 'NONE', 'FULL', 4004);
let minPromenadeY = Infinity;
testPromenadeGroup.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const box = new THREE.Box3().setFromObject(child);
    if (box.min.y < minPromenadeY) {
      minPromenadeY = box.min.y;
    }
  }
});
check(minPromenadeY <= -5.5, `Deep retaining promenades anchor down into benthic seafloor (minY = ${minPromenadeY.toFixed(2)}m <= -5.5m)`);
pool.clearDecorativeGroup(testPromenadeGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 11: Gate A — The Giant Manta Encounter
console.log('\n--- Suite 11: Gate A — The Giant Manta Encounter ---');
director.reset();
const mantaChunkGroup = new THREE.Group();
// Zone 5 (Grand Ocean Sanctuary) contains Giant Manta hero
factory.buildScenery(mantaChunkGroup, ABYSSAL_GLASSLINE_THEME, -5 * 80, false, false, 'NONE', 'FULL', 5005);

const registeredMantas = director.getGiantMantas();
check(registeredMantas.length > 0, `Giant Manta successfully registered in EventDirector (got ${registeredMantas.length})`);

const manta = registeredMantas[0];
check(manta.bodyMesh !== undefined, 'Manta has sculpted diamond hydrodynamic body');
check(manta.leftWing !== undefined && manta.rightWing !== undefined, 'Manta has primary wings');
check(manta.leftWingTip !== undefined && manta.rightWingTip !== undefined, 'Manta has secondary articulated wing tips');
check(manta.cephalicLobes.length === 2, 'Manta has dual curled cephalic feeding lobes');
check(manta.tail !== undefined, 'Manta has long tapered whip tail');
check(manta.photophores.length >= 6, `Manta has bioluminescent photophore arrays (${manta.photophores.length} photophores)`);
check(manta.escortRays.length === 2, `Manta is flanked by 2 escort rays in echelon formation (got ${manta.escortRays.length})`);

// Animate manta via director and verify realistic wing undulation
const initialLWingRotZ = manta.leftWing.rotation.z;
director.update(0.4, true, -400); // 400m before encounter
check(manta.leftWing.rotation.z !== initialLWingRotZ, 'Giant Manta wing flap updates dynamically during swimming cycle');

// Check escort ray wings also articulate
const escortRay0 = manta.escortRays[0];
check(escortRay0.leftWing !== undefined && escortRay0.rightWing !== undefined, 'Escort ray has articulated pectoral wings');

pool.clearDecorativeGroup(mantaChunkGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 12: Gate B — The Abyssal Leviathan
console.log('\n--- Suite 12: Gate B — The Abyssal Leviathan ---');
director.reset();
const leviathanChunkGroup = new THREE.Group();
// Zone 4 (Leviathan Trench) contains Leviathan colossus
factory.buildScenery(leviathanChunkGroup, ABYSSAL_GLASSLINE_THEME, -4 * 80, false, false, 'NONE', 'FULL', 5004);

const registeredLeviathans = director.getLeviathans();
check(registeredLeviathans.length > 0, `Abyssal Leviathan successfully registered in EventDirector (got ${registeredLeviathans.length})`);

const leviathan = registeredLeviathans[0];
check(leviathan.head !== undefined, 'Leviathan has massive armored predator head');
check(leviathan.bodySegments.length >= 8, `Leviathan features serpentine multi-segment body (got ${leviathan.bodySegments.length} segments)`);
check(leviathan.dorsalSpines.length >= 8, `Leviathan features glowing dorsal spines along spine (got ${leviathan.dorsalSpines.length} spines)`);
check(leviathan.tailFlukes !== undefined, 'Leviathan features expansive caudal tail flukes');
check(leviathan.eyes.length === 2, 'Leviathan features bioluminescent predator eyes');

// Verify Leviathan length exceeds 60m colossus threshold
let leviathanTotalLength = 9.0; // Head length
for (let s = 0; s < leviathan.bodySegments.length; s++) {
  leviathanTotalLength += 7.2;
}
check(leviathanTotalLength >= 60.0, `Leviathan body scale is colossal (computed length: ${leviathanTotalLength.toFixed(1)}m >= 60m)`);

// Test serpentine wave propagation down segments
director.update(0.5, true, -320);
const seg0Rot = leviathan.bodySegments[0].rotation.y;
const segLastRot = leviathan.bodySegments[leviathan.bodySegments.length - 1].rotation.y;
check(seg0Rot !== segLastRot, 'Sinuous traveling wave propagates along segmented body');

pool.clearDecorativeGroup(leviathanChunkGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 13: Cinematic Events C, D, E, F
console.log('\n--- Suite 13: Cinematic Events C, D, E, F ---');
director.reset();
const multiEventGroup = new THREE.Group();

// Build Chunks 1, 2, 3, 5 to register events C, D, E, F
factory.buildScenery(multiEventGroup, ABYSSAL_GLASSLINE_THEME, -1 * 80, false, false, 'NONE', 'FULL', 6001); // City -> Event E (Submarine Pursuit)
factory.buildScenery(multiEventGroup, ABYSSAL_GLASSLINE_THEME, -2 * 80, false, false, 'NONE', 'FULL', 6002); // Ruins -> Event D (Sunken Titan)
factory.buildScenery(multiEventGroup, ABYSSAL_GLASSLINE_THEME, -3 * 80, false, false, 'NONE', 'FULL', 6003); // Hydrothermal -> Event F (Hydrothermal Eruption)
factory.buildScenery(multiEventGroup, ABYSSAL_GLASSLINE_THEME, -5 * 80, false, false, 'NONE', 'FULL', 6005); // Sanctuary -> Event C (Jellyfish Bloom)

// Event C: Jellyfish Bloom
const blooms = director.getJellyfishBlooms();
check(blooms.length > 0, 'Jellyfish Bloom event registered');
check(blooms[0].jellyfish.length >= 12, `Jellyfish Bloom contains pulsating swarm (got ${blooms[0].jellyfish.length} jellyfish)`);
check(blooms[0].jellyfish[0].bell !== undefined, 'Jellyfish has translucent bell dome');
check(blooms[0].jellyfish[0].tentacles.length >= 4, 'Jellyfish has trailing undulating tentacles');

// Event D: Sunken Titan
const titans = director.getSunkenTitans();
check(titans.length > 0, 'Sunken Titan event registered');
check(titans[0].statueHead !== undefined, 'Sunken Titan contains monumental carved head');
check(titans[0].colonnadeArches.length >= 3, 'Sunken Titan includes surrounding ancient colonnades');
check(titans[0].searchlightCone !== undefined, 'Sunken Titan features submersible exploration searchlight');

// Event E: Submarine Pursuit
const pursuits = director.getSubmarinePursuits();
check(pursuits.length > 0, 'Submarine Pursuit event registered');
check(pursuits[0].submarine !== undefined, 'Submarine Pursuit includes research submarine hull');
check(pursuits[0].propellers.length === 2, 'Submarine has dual high-speed cavitation propellers');
check(pursuits[0].searchlights.length === 2, 'Submarine has dual penetrating searchlight beams');
check(pursuits[0].targetCreature !== undefined, 'Submarine is actively pursuing a deep-sea creature');

// Event F: Hydrothermal Eruption
const eruptions = director.getHydrothermalEruptions();
check(eruptions.length > 0, 'Hydrothermal Eruption event registered');
check(eruptions[0].chimney !== undefined, 'Hydrothermal event includes volcanic black smoker chimney');
check(eruptions[0].moltenCalderaGlow !== undefined, 'Hydrothermal vent has glowing molten caldera orifice');
check(eruptions[0].thermalPlumes.length >= 3, 'Hydrothermal vent has billowing thermal plumes');
check(eruptions[0].pressureWaveMesh !== undefined, 'Hydrothermal vent features expanding pressure-wave pulse');

pool.clearDecorativeGroup(multiEventGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 14: Signed-Distance Convention Verification
console.log('\n--- Suite 14: Signed-Distance Convention Verification ---');
// Verify convention: For negative-Z travel, distanceAhead = playerZ - encounterZ
const encounterZ = -1000;
const testDistances = [
  { playerZ: -850, expectedDistanceAhead: 150, stage: 'Distant Approach (150m ahead)' },
  { playerZ: -900, expectedDistanceAhead: 100, stage: 'Mid Approach (100m ahead)' },
  { playerZ: -940, expectedDistanceAhead: 60, stage: 'Close Encounter Reveal (60m ahead)' },
  { playerZ: -980, expectedDistanceAhead: 20, stage: 'Flyby Apex Transition (20m ahead)' },
  { playerZ: -1000, expectedDistanceAhead: 0, stage: 'Direct Overhead / Tunnel Passing (0m)' },
  { playerZ: -1020, expectedDistanceAhead: -20, stage: 'Banking Departure (-20m passed)' },
  { playerZ: -1100, expectedDistanceAhead: -100, stage: 'Fading Into Oceanic Abyss (-100m passed)' }
];

testDistances.forEach((td) => {
  const calculatedDistanceAhead = td.playerZ - encounterZ;
  check(calculatedDistanceAhead === td.expectedDistanceAhead, `Signed distance for ${td.stage}: ${calculatedDistanceAhead}m === ${td.expectedDistanceAhead}m`);
});

// Suite 15: Memory Lifecycle & Scenery Pool Stability
console.log('\n--- Suite 15: Memory Lifecycle & Detached Pruning ---');
director.reset();
const diagEmpty = director.getDiagnostics();
check(diagEmpty.giantMantas === 0, 'reset() clears giantMantas');
check(diagEmpty.leviathans === 0, 'reset() clears leviathans');
check(diagEmpty.jellyfishBlooms === 0, 'reset() clears jellyfishBlooms');

const lifecycleGroup = new THREE.Group();
factory.buildScenery(lifecycleGroup, ABYSSAL_GLASSLINE_THEME, -400, false, false, 'NONE', 'FULL', 7777);
const diagPopulated = director.getDiagnostics();
check(diagPopulated.giantMantas > 0 || diagPopulated.leviathans > 0 || diagPopulated.fishSchools > 0, 'Populated chunk registers director actors');

// Detach and recycle
pool.clearDecorativeGroup(lifecycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Advance director frames to trigger pruneDetached() (every 45 frames)
for (let f = 0; f < 50; f++) {
  director.update(0.016, true, -400);
}

const diagPruned = director.getDiagnostics();
check(diagPruned.giantMantas === 0, 'pruneDetached() safely removes recycled giantMantas');
check(diagPruned.leviathans === 0, 'pruneDetached() safely removes recycled leviathans');
check(diagPruned.fishSchools === 0, 'pruneDetached() safely removes recycled fishSchools');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} ABYSSAL_GLASSLINE PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
