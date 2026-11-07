import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { DOOMSDAY_LAST_TRANSIT_THEME, EnvironmentManager } from '../src/environment/EnvironmentConfig';
import { SceneryFactory, SeededRandom } from '../src/environment/SceneryFactory';
import { SceneryPool } from '../src/environment/SceneryPool';
import { WorldScene } from '../src/scene/WorldScene';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { ObstacleFactory } from '../src/track/ObstacleFactory';
import { getWorld } from '../src/environment/WorldCatalog';
import { DoomsdayWorldBuilder } from '../src/environment/worlds/doomsdayLastTransit/DoomsdayWorldBuilder';
import { DoomsdayEventDirector } from '../src/environment/worlds/doomsdayLastTransit/DoomsdayEventDirector';
import { DOOMSDAY_PALETTE, DOOMSDAY_TRAIN_LIVERY } from '../src/environment/worlds/doomsdayLastTransit/DoomsdayTheme';

console.log('🧪 Starting DOOMSDAY_LAST_TRANSIT Premium World Verification Suite...\n');

let checks = 0;
function check(condition: unknown, msg: string) {
  assert.ok(condition, msg);
  checks++;
}

// Suite 1: Theme Identity, Catalog & Registry
console.log('--- Suite 1: Theme Identity, Catalog & Registry ---');
const registry = EnvironmentRegistry.getInstance();
check(registry.has('DOOMSDAY_LAST_TRANSIT'), 'DOOMSDAY_LAST_TRANSIT is registered in EnvironmentRegistry');
const theme = registry.get('DOOMSDAY_LAST_TRANSIT');
check(theme.id === 'DOOMSDAY_LAST_TRANSIT', 'Theme ID matches DOOMSDAY_LAST_TRANSIT');
check(theme.displayName === 'Doomsday: Last Transit', 'Theme displayName matches');
check(theme.badgeEmoji === '☄️', 'Theme emoji is ☄️');
check(theme.accentColor === '#f97316', 'Theme accent color matches incandescent orange');
check(theme.sky.top === 0x140402, 'Sky top is deep volcanic apocalyptic black-red');
check(theme.sky.bottom === 0x4a1104, 'Sky bottom has fiery smoke and ash fallout glow');
check(theme.fog.color === 0x1a0705, 'Fog color provides dense apocalyptic ash fall atmosphere');
check(theme.sun.color === 0xff6a20, 'Key light is low burning inferno sun');
check(theme.fill.color === 0x7c2d12, 'Fill light is deep ember fire glow');
check(theme.hemi.sky === 0xf97316, 'Hemisphere sky is burning cinder orange');
check(theme.materials.wallBaseColor === 0x1c1917, 'Retaining wall base is scorched charred basalt');
check(theme.materials.wallAccentColor === 0xf97316, 'Wall accent is glowing molten orange');
check(theme.materials.bridgeAccentColor === 0xf97316, 'Bridge accent is incandescent hazard amber');

const worldDef = getWorld('DOOMSDAY_LAST_TRANSIT');
check(worldDef !== undefined, 'World definition exists in WorldCatalog');
check(worldDef?.implemented === true, 'World definition is marked implemented');
check(worldDef?.available === true, 'World definition is marked available');
check(worldDef?.coinCost === 7500, 'World cost is 7500 coins');
check(worldDef?.unlock === 'COINS', 'World unlocks via coins');

// Suite 2: Procedural 3D Scenery Generation
console.log('\n--- Suite 2: Procedural 3D Scenery Generation ---');
const factory = SceneryFactory.getInstance();
const pool = SceneryPool.getInstance();

const group1 = new THREE.Group();
factory.buildScenery(group1, DOOMSDAY_LAST_TRANSIT_THEME, 0, false, false, 'NONE', 'FULL', 5005);

let meshCount = 0;
let hasScorchedConcrete = false;
let hasRustedSteel = false;
let hasHazardStripes = false;
let hasEmergencyRedGlow = false;
let hasFireAmberGlow = false;
let hasRebarSteel = false;

const mats = factory.getSharedMaterials();
group1.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    meshCount++;
    const m = (child as THREE.Mesh).material;
    if (m === mats.doomsdayScorchedConcreteMat) hasScorchedConcrete = true;
    if (m === mats.doomsdayRustedSteelMat) hasRustedSteel = true;
    if (m === mats.doomsdayHazardStripeMat) hasHazardStripes = true;
    if (m === mats.doomsdayEmergencyRedGlowMat) hasEmergencyRedGlow = true;
    if (m === mats.doomsdayFireAmberGlowMat) hasFireAmberGlow = true;
    if (m === mats.doomsdayRebarSteelMat) hasRebarSteel = true;
  }
});

check(meshCount >= 40, `DOOMSDAY_LAST_TRANSIT produces rich 3D apocalyptic scenery (got ${meshCount} meshes)`);
check(hasScorchedConcrete, 'Contains charred reinforced blast retaining walls');
check(hasRustedSteel, 'Contains oxidized structural steel columns and gantry beams');
check(hasHazardStripes, 'Contains high-contrast black/amber hazard chevron warning stripes');
check(hasEmergencyRedGlow, 'Contains pulsing red emergency evacuation strobes');
check(hasFireAmberGlow, 'Contains incandescent fire and ember floodlights');
check(hasRebarSteel, 'Contains twisted exposed rebar skeletons and dangling conduits');

// Suite 3: Monumental Apocalyptic Architecture & Safe Clearance
console.log('\n--- Suite 3: Monumental Apocalyptic Architecture & Safe Clearance ---');
let foundOverheadArchitecture = false;
let archClearanceSafe = true;

for (let seed = 4000; seed < 4015; seed++) {
  const testGroup = new THREE.Group();
  factory.buildScenery(testGroup, DOOMSDAY_LAST_TRANSIT_THEME, -seed * 80, false, false, 'NONE', 'FULL', seed);
  testGroup.updateMatrixWorld(true);
  testGroup.traverse((child) => {
    if (child.name === 'doomsday_bunker_gateway' || child.name === 'doomsday_fractured_skybridge') {
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
check(foundOverheadArchitecture, 'Overhead blast portals and fractured skybridges spawn procedurally across seeds');
check(archClearanceSafe, 'Overhead architecture maintains safe vertical clearance (>= 8.5m) above all 3 running lanes');

// Suite 4: Gameplay Corridor Safety & Non-Obstruction Invariants
console.log('\n--- Suite 4: Running Corridor Safety Invariants ---');
let laneIntrusions = 0;
for (let chunkIdx = 0; chunkIdx < 6; chunkIdx++) {
  const g = new THREE.Group();
  factory.buildScenery(g, DOOMSDAY_LAST_TRANSIT_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', 8000 + chunkIdx);
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
check(laneIntrusions === 0, `Apocalyptic scenery never obstructs running lanes below Y=7.5m (intrusions: ${laneIntrusions})`);

// Suite 5: Scenery Recycling & Pool Memory Stability
console.log('\n--- Suite 5: Scenery Recycling & Memory Stability ---');
const recycleGroup = new THREE.Group();
factory.buildScenery(recycleGroup, DOOMSDAY_LAST_TRANSIT_THEME, 0, false, false, 'NONE', 'FULL', 999);
const countBefore = recycleGroup.children.length;
check(countBefore > 0, 'Populated chunk with decorative groups');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));
check(recycleGroup.children.length === 0, 'clearDecorativeGroup cleans all children');

// Shared materials survive recycling
check(!mats.doomsdayScorchedConcreteMat.isDisposed, 'doomsdayScorchedConcreteMat survives recycling');
check(!mats.doomsdayRustedSteelMat.isDisposed, 'doomsdayRustedSteelMat survives recycling');
check(!mats.doomsdayHazardStripeMat.isDisposed, 'doomsdayHazardStripeMat survives recycling');
check(!mats.doomsdayEmergencyRedGlowMat.isDisposed, 'doomsdayEmergencyRedGlowMat survives recycling');
check(!mats.doomsdayFireAmberGlowMat.isDisposed, 'doomsdayFireAmberGlowMat survives recycling');
check(!mats.doomsdayRebarSteelMat.isDisposed, 'doomsdayRebarSteelMat survives recycling');

// Rebuild with different seed
factory.buildScenery(recycleGroup, DOOMSDAY_LAST_TRANSIT_THEME, -80, false, false, 'NONE', 'FULL', 1234);
check(recycleGroup.children.length > 0, 'Recycled group accepts new chunk scenery without error');
pool.clearDecorativeGroup(recycleGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 6: Atmospheric Presets & Pacing
console.log('\n--- Suite 6: Atmospheric Presets & Pacing ---');
const encounterDir = EnvironmentalEncounterDirector.getInstance();
const activePreset = encounterDir.resolveAtmospherePreset(-500, 'DOOMSDAY_LAST_TRANSIT');
check(activePreset === 'DOOMSDAY_FIRESTORM_FALLOUT', `Atmosphere resolves DOOMSDAY_FIRESTORM_FALLOUT for DOOMSDAY_LAST_TRANSIT (got ${activePreset})`);

// Suite 7: Theme-Specific Armored Evacuation Train Visuals & Hitboxes
console.log('\n--- Suite 7: Theme-Specific Evacuation Train Visuals & Hitboxes ---');
const obstacleFactory = new ObstacleFactory();
const defaultTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, CONSTANTS.COLORS.TRAIN_BODY_1);
const doomsdayTrain = obstacleFactory.createTrain(CONSTANTS.TRAIN_LENGTH_SHORT, false, 0x1c1917, undefined, 'DOOMSDAY_LAST_TRANSIT');

check(doomsdayTrain.userData.isTrain === true, 'doomsdayTrain retains isTrain userData');
check(doomsdayTrain.userData.type === 'TRAIN', 'doomsdayTrain retains TRAIN type');

// Compare bounding box dimensions (hitbox integrity)
const defaultBox = new THREE.Box3().setFromObject(defaultTrain);
const doomsdayBox = new THREE.Box3().setFromObject(doomsdayTrain);

const defaultWidth = defaultBox.max.x - defaultBox.min.x;
const doomsdayWidth = doomsdayBox.max.x - doomsdayBox.min.x;
check(Math.abs(defaultWidth - doomsdayWidth) < 0.25, `Train width preserved within 0.25m (default: ${defaultWidth.toFixed(2)}, doomsday: ${doomsdayWidth.toFixed(2)})`);

// Walkable rooftop surface Y must be exactly at 4.35m
let doomsdayCatwalkFound = false;
doomsdayTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const geo = (child as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry && Math.abs(child.position.y - 4.28) < 0.05) {
      doomsdayCatwalkFound = true;
    }
  }
});
check(doomsdayCatwalkFound, 'Doomsday train maintains walkable catwalk platform at exact Y=4.28m (top face Y=4.35m)');

// Verify heavy armored cowcatcher plow and emergency strobe bar on cab
let hasCowcatcher = false;
let hasStrobeBar = false;
doomsdayTrain.traverse((child) => {
  if ((child as THREE.Mesh).isMesh) {
    const mesh = child as THREE.Mesh;
    if (mesh.position.y < 0.6 && mesh.position.z > 5.0) {
      hasCowcatcher = true;
    }
    if (mesh.position.y > 3.0 && mesh.position.z > 5.0 && mesh.material instanceof THREE.MeshBasicMaterial) {
      hasStrobeBar = true;
    }
  }
});
check(hasCowcatcher, 'Doomsday locomotive cab is equipped with heavy debris plow / cowcatcher');
check(hasStrobeBar, 'Doomsday locomotive cab is equipped with emergency red strobe beacon bar');

// Suite 8: Graphics Quality Tiering
console.log('\n--- Suite 8: Graphics Detail Tiering ---');
const fullGroup = new THREE.Group();
factory.buildScenery(fullGroup, DOOMSDAY_LAST_TRANSIT_THEME, 0, false, false, 'NONE', 'FULL', 9999);
let fullMeshes = 0;
fullGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) fullMeshes++; });

const minGroup = new THREE.Group();
factory.buildScenery(minGroup, DOOMSDAY_LAST_TRANSIT_THEME, 0, false, false, 'NONE', 'MINIMAL', 9999);
let minMeshes = 0;
minGroup.traverse((c) => { if ((c as THREE.Mesh).isMesh) minMeshes++; });

check(fullMeshes > minMeshes, `FULL detail has more meshes than MINIMAL (${fullMeshes} > ${minMeshes})`);
check(minMeshes >= 12, `MINIMAL detail retains essential blast retaining walls and gantries (${minMeshes} meshes)`);

pool.clearDecorativeGroup(fullGroup, new Set(Object.values(factory.getSharedMaterials())));
pool.clearDecorativeGroup(minGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 9: Landmark Variations Across Seeds
console.log('\n--- Suite 9: Multiple Landmark Variations ---');
let landmarkTypes = new Set<string>();
for (let s = 100; s < 130; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, DOOMSDAY_LAST_TRANSIT_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  g.traverse((c) => {
    if (c.name === 'doomsday_ruined_skyscraper') landmarkTypes.add('RUINED_SKYSCRAPER');
    if (c.name === 'doomsday_bunker_gateway') landmarkTypes.add('BUNKER_GATEWAY');
    if (c.name === 'doomsday_fractured_skybridge') landmarkTypes.add('FRACTURED_SKYBRIDGE');
    if (c.name === 'doomsday_flare_stack') landmarkTypes.add('FLARE_STACK');
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}
check(landmarkTypes.size >= 3, `Procedural generation includes multiple landmark variations (found ${Array.from(landmarkTypes).join(', ')})`);

// Suite 10: 6 Distinct Apocalyptic Districts & Grounded Retaining Plinths
console.log('\n--- Suite 10: 6 Distinct Apocalyptic Districts & Plinths ---');
const builder = DoomsdayWorldBuilder.getInstance();
const director = DoomsdayEventDirector.getInstance();
director.reset();

const districtNames = new Set<string>();
let hasDeepPlinths = false;

for (let chunkIdx = 0; chunkIdx < 12; chunkIdx++) {
  const chunkGroup = new THREE.Group();
  factory.buildScenery(chunkGroup, DOOMSDAY_LAST_TRANSIT_THEME, -chunkIdx * 80, false, false, 'NONE', 'FULL', chunkIdx * 17);

  chunkGroup.traverse((child) => {
    if (child.name.startsWith('zone_')) {
      districtNames.add(child.name);
    }
    if ((child as THREE.Mesh).isMesh) {
      const pos = child.position;
      if (pos.y < -2.0 && pos.y >= -6.0) {
        hasDeepPlinths = true;
      }
    }
  });
}

check(districtNames.has('zone_falling_city'), 'District 1: Falling City exists');
check(districtNames.has('zone_meteor_impact'), 'District 2: Meteor Impact Zone exists');
check(districtNames.has('zone_last_evacuation'), 'District 3: The Last Evacuation exists');
check(districtNames.has('zone_broken_skyways'), 'District 4: The Broken Skyways exists');
check(districtNames.has('zone_firestorm'), 'District 5: The Firestorm exists');
check(districtNames.has('zone_final_transit'), 'District 6: The Final Transit exists');
check(districtNames.size === 6, `All 6 distinct apocalyptic districts are generated (found ${districtNames.size}/6)`);
check(hasDeepPlinths, 'Retaining plinths extend deep below track bed (Y = -5.85m) ensuring zero floating scenery');

// Suite 11: Gate A — Skyscraper Collapse Disaster Mechanics
console.log('\n--- Suite 11: Gate A — Skyscraper Collapse Disaster Mechanics ---');
const testRoot = new THREE.Scene();
const colParent = new THREE.Group();
testRoot.add(colParent);
builder.buildDistrictFallingCity(colParent, 80, mats, director, new SeededRandom(101), 'FULL', 0, -200);

const collapses = (director as any).skyscraperCollapses;
check(collapses.length >= 1, `At least 1 skyscraper collapse registered in Director (got ${collapses.length})`);
const collapseActor = collapses[0];
check(collapseActor.baseTower !== undefined, 'Collapse actor has solid lower base tower');
check(collapseActor.upperCrown !== undefined, 'Collapse actor has articulated upper crown');
check(collapseActor.fallingChunks.length >= 4, `Collapse actor has at least 4 detached falling debris chunks (got ${collapseActor.fallingChunks.length})`);
check(collapseActor.dustPlume !== undefined, 'Collapse actor has ground impact dust plume');
check(collapseActor.sparks.length >= 2, `Collapse actor has interior electrical arcing sparks (got ${collapseActor.sparks.length})`);
check(collapseActor.state === 'ANTICIPATION', 'Collapse actor begins in ANTICIPATION state');

// Suite 12: Gate B — Meteor Impact & Expanding Shockwave
console.log('\n--- Suite 12: Gate B — Meteor Impact & Expanding Shockwave ---');
const meteorParent = new THREE.Group();
testRoot.add(meteorParent);
builder.buildDistrictMeteorImpact(meteorParent, 80, mats, director, { range: () => 1, chance: () => true, int: () => 1 } as any, 'FULL', 1, -400);

const impacts = (director as any).meteorImpacts;
check(impacts.length >= 1, `At least 1 meteor impact registered in Director (got ${impacts.length})`);
const meteorActor = impacts[0];
check(meteorActor.meteorMesh !== undefined, 'Meteor actor has trailing meteor head & flame tail');
check(meteorActor.fireballPlume !== undefined, 'Meteor actor has towering fireball mushroom plume');
check(meteorActor.shockwaveRing !== undefined, 'Meteor actor has expanding circular shockwave ring');
check(meteorActor.state === 'ENTRY_APPROACH', 'Meteor actor begins in ENTRY_APPROACH state');

// Suite 13: 6 Disaster Catastrophes in Director
console.log('\n--- Suite 13: 6 Disaster Catastrophes in Director ---');
// Build remaining 4 districts
const evacParent = new THREE.Group();
testRoot.add(evacParent);
builder.buildDistrictLastEvacuation(evacParent, 80, mats, director, { range: () => 1, chance: () => true, int: () => 1 } as any, 'FULL', 2, -600);

const skyParent = new THREE.Group();
testRoot.add(skyParent);
builder.buildDistrictBrokenSkyways(skyParent, 80, mats, director, { range: () => 1, chance: () => true, int: () => 1 } as any, 'FULL', 3, -800);

const fireParent = new THREE.Group();
testRoot.add(fireParent);
builder.buildDistrictFirestorm(fireParent, 80, mats, director, { range: () => 1, chance: () => true, int: () => 1 } as any, 'FULL', 0, -1000);

const gateParent = new THREE.Group();
testRoot.add(gateParent);
builder.buildDistrictFinalTransit(gateParent, 80, mats, director, { range: () => 1, chance: () => true, int: () => 1 } as any, 'FULL', 1, -1200);

const diag = director.getDiagnostics();
check(diag.skyscraperCollapses >= 1, 'Director tracks Skyscraper Collapses');
check(diag.meteorImpacts >= 1, 'Director tracks Meteor Impacts');
check(diag.evacuationConvoys >= 1, 'Director tracks Evacuation Convoys');
check(diag.fracturingSkybridges >= 1, 'Director tracks Fracturing Skybridges');
check(diag.industrialFirestorms >= 1, 'Director tracks Industrial Firestorms');
check(diag.finalTransitGates >= 1, 'Director tracks Final Transit Gates');
check((diag as any).lastRescueTrains >= 1, 'Director tracks Last Rescue Train on parallel viaduct');

const evacConvoys = director.getEvacuationConvoys();
check(evacConvoys.length >= 1, 'At least 1 evacuation convoy registered');
check(evacConvoys[0].rescueHelicopter !== undefined, 'Evacuation convoy includes articulated rescue helicopter');
check(evacConvoys[0].rescueHelicopter?.mainRotor !== undefined, 'Rescue helicopter has spinning main rotor');
check(evacConvoys[0].rescueHelicopter?.searchlight !== undefined, 'Rescue helicopter has searchlight illumination cone');

const rescueTrains = director.getLastRescueTrains();
check(rescueTrains.length >= 1, 'At least 1 Last Rescue Train registered');
check(rescueTrains[0].locomotive !== undefined, 'Last Rescue Train includes armored locomotive');
check(rescueTrains[0].coaches.length >= 2, 'Last Rescue Train has at least 2 passenger evacuation coaches');
check(rescueTrains[0].doors.length >= 2, 'Last Rescue Train has sliding emergency doors');

// Suite 14: Signed-Distance Convention Progression
console.log('\n--- Suite 14: Signed-Distance Convention Progression ---');
// Signed-distance convention: distanceAhead = playerZ - triggerZ
// In our coordinates, runner moves toward negative Z.
// Let triggerZ = -240 (at falling city).
// When player is far ahead: playerZ = -40 => distanceAhead = -40 - (-240) = +200m (Approaching from +200m).
collapseActor.triggerZ = -240;
collapseActor.state = 'ANTICIPATION';
collapseActor.timer = 0;

// Player at -60m (distanceAhead = 180m > 140m): remains in ANTICIPATION
director.update(0.016, true, -60);
check(collapseActor.state === 'ANTICIPATION', `Player at +180m: state is ANTICIPATION (got ${collapseActor.state})`);

// Player advances to -110m (distanceAhead = 130m <= 140m): transitions to STRUCTURAL_FAIL
director.update(0.016, true, -110);
check(collapseActor.state === 'STRUCTURAL_FAIL', `Player at +130m: state is STRUCTURAL_FAIL (got ${collapseActor.state})`);

// Advance player to -195m (distanceAhead = 45m <= 55m): transitions to COLLAPSING
director.update(0.016, true, -195);
check(collapseActor.state === 'COLLAPSING', `Player at +45m: state is COLLAPSING (got ${collapseActor.state})`);

// Advance player past trigger: playerZ = -250m (distanceAhead = -10m <= 0m): transitions to IMPACT_DUST
director.update(0.016, true, -250);
check(collapseActor.state === 'IMPACT_DUST', `Player at -10m: state is IMPACT_DUST (got ${collapseActor.state})`);

// Suite 15: Dynamic Ambient Disaster Ecosystem
console.log('\n--- Suite 15: Dynamic Ambient Disaster Ecosystem ---');
const ambDiag = director.getDiagnostics();
check(ambDiag.patrolDrones >= 1, 'Ambient ecosystem has active patrol drones');
check(ambDiag.emergencyVehicles >= 1, 'Ambient ecosystem has moving emergency vehicles');
check(ambDiag.smokingBreaches >= 1, 'Ambient ecosystem has smoking structural breaches');
check(ambDiag.searchlights >= 1, 'Ambient ecosystem has sweeping searchlights');

// Animate ecosystem and verify movement
const drone = (director as any).ambient.patrolDrones[0];
const droneInitialPos = drone.mesh.position.clone();
director.update(1.0, true, -300);
check(!drone.mesh.position.equals(droneInitialPos), 'Patrol drones actively orbit and scan along flight paths');

// Suite 16: Memory Lifecycle & Scenery Pool Stability
console.log('\n--- Suite 16: Memory Lifecycle & Scenery Pool Stability ---');
const totalBeforePrune = (director as any).skyscraperCollapses.length;
// Detach testRoot from scene
testRoot.parent = null;
testRoot.clear();

director.pruneDetached();
const diagAfterPrune = director.getDiagnostics();
check(diagAfterPrune.skyscraperCollapses < totalBeforePrune, 'pruneDetached cleanly purges detached actors');

director.reset();
const diagAfterReset = director.getDiagnostics();
check(diagAfterReset.skyscraperCollapses === 0, 'director.reset() resets all collapse actors');
check(diagAfterReset.meteorImpacts === 0, 'director.reset() resets all meteor actors');
check(diagAfterReset.patrolDrones === 0, 'director.reset() clears all ambient actors');

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} DOOMSDAY_LAST_TRANSIT PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
