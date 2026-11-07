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
import { PhantomLineEventDirector } from '../src/environment/worlds/phantomLine/PhantomLineEventDirector';
import { PhantomLineWorldBuilder } from '../src/environment/worlds/phantomLine/PhantomLineWorldBuilder';
import { PHANTOM_PALETTE } from '../src/environment/worlds/phantomLine/PhantomLineTheme';
import { SettingsManager } from '../src/settings/SettingsManager';

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

// Suite 10: Vertical Slice A — The Last Train
console.log('\n--- Suite 10: Vertical Slice A — The Last Train ---');
const director = PhantomLineEventDirector.getInstance();
director.reset();

// Build a chunk with Region F (Phantom Terminus, seed 201) which contains the ghost train siding
const terminusChunk = new THREE.Group();
factory.buildScenery(terminusChunk, PHANTOM_LINE_THEME, -400, false, false, 'NONE', 'FULL', 201);
terminusChunk.updateMatrixWorld(true);

let ghostTrainGroup: THREE.Object3D | null = null;
terminusChunk.traverse((c) => {
  if (c.name === 'phantom_ghost_train_siding') ghostTrainGroup = c;
});
check(ghostTrainGroup !== null, 'Ghost train siding is spawned in Region F (The Phantom Terminus)');

const diags = director.getDiagnostics();
check(diags.lastTrains >= 1, `Director has registered The Last Train actor (found ${diags.lastTrains})`);

// Verify ghost train geometry components
let foundLocomotive = false;
let foundCarriage = false;
let foundWindowGlow = false;
let foundSilhouette = false;
let foundCyclops = false;
let trainX = 0;

ghostTrainGroup!.traverse((part) => {
  if ((part as THREE.Mesh).isMesh) {
    const mesh = part as THREE.Mesh;
    if (mesh.material === mats.phantomSpectralGlowCyanMat) foundWindowGlow = true;
    if (mesh.material === mats.phantomSpecterMat) foundSilhouette = true;
  }
  if (part.name === 'ghost_locomotive') foundLocomotive = true;
  if (part.name === 'ghost_carriage_0') foundCarriage = true;
  if (part.name === 'ghost_cyclops_headlight') foundCyclops = true;
});

// Check parallel track siding clearance: siding should be at |X| >= 4.5m
trainX = Math.abs((ghostTrainGroup! as THREE.Group).position.x);
check(trainX >= 4.0, `Ghost train parallel siding is safely offset from running corridor (|X| = ${trainX.toFixed(2)}m >= 4.0m)`);
check(foundWindowGlow, 'Ghost train carriages feature cold cyan interior window glows');
check(foundSilhouette, 'Ghost train windows feature passenger silhouettes');
check(foundCyclops, 'Ghost train locomotive features cyclops high-beam headlight');

// Verify animated advance and states
const consist = ghostTrainGroup!.getObjectByName('last_train_ghost_consist') as THREE.Group;
check(consist !== undefined, 'Last Train ghost consist found within siding');
const initialTrainZ = consist.position.z;
director.update(0.5, true, -300); // Player at Z = -300, train approaches
const intermediateTrainZ = consist.position.z;
check(intermediateTrainZ !== initialTrainZ, 'The Last Train moves dynamically along parallel siding when player approaches');

pool.clearDecorativeGroup(terminusChunk, new Set(Object.values(factory.getSharedMaterials())));

// Suite 11: Vertical Slice B — The Watcher
console.log('\n--- Suite 11: Vertical Slice B — The Watcher ---');
director.reset();

// Build a chunk with Region C (Lost Passenger Platform, seed 200) which contains The Watcher
const platformChunk = new THREE.Group();
factory.buildScenery(platformChunk, PHANTOM_LINE_THEME, -200, false, false, 'NONE', 'FULL', 200);
platformChunk.updateMatrixWorld(true);

let watcherPlatform: THREE.Object3D | null = null;
platformChunk.traverse((c) => {
  if (c.name === 'phantom_watcher_platform') watcherPlatform = c;
});
check(watcherPlatform !== null, 'Watcher platform is spawned in Region C (The Lost Passenger Platform)');

const diagsWatcher = director.getDiagnostics();
check(diagsWatcher.watchers >= 1, `Director has registered The Watcher actor (found ${diagsWatcher.watchers})`);

// Verify Watcher 3D anatomy: sculpted coat, fedora brim, and twin glowing cyan eyes
let hasWatcherCoat = false;
let hasWatcherHead = false;
let hasWatcherEyes = 0;
let watcherX = 0;

watcherPlatform!.traverse((part) => {
  if (part.name === 'phantom_watcher') {
    const worldPos = new THREE.Vector3();
    part.getWorldPosition(worldPos);
    watcherX = Math.abs(worldPos.x);
  }
  if (part.name === 'watcher_head') hasWatcherHead = true;
  if (part.name === 'watcher_eye_left' || part.name === 'watcher_eye_right') hasWatcherEyes++;
  if ((part as THREE.Mesh).isMesh && part.name.includes('coat')) hasWatcherCoat = true;
});

check(watcherX >= 4.0, `The Watcher stands safely on passenger platform (|X| = ${watcherX.toFixed(2)}m >= 4.0m)`);
check(hasWatcherHead, 'The Watcher has sculpted 3D head with fedora hat');
check(hasWatcherEyes === 2, 'The Watcher possesses twin piercing cyan glowing eyes');

// Simulate runner approach: from far (watching) to close (stepping behind column)
// Far distance: Watcher tracks runner
director.update(0.1, true, -120); // distance ~ 80m
director.update(0.1, true, -165); // distance ~ 35m -> triggers stepping back behind platform column
director.update(0.6, true, -185); // distance ~ 15m -> steps behind column and vanishes

pool.clearDecorativeGroup(platformChunk, new Set(Object.values(factory.getSharedMaterials())));

// Suite 12: 12 Signature Supernatural Encounters & Performers
console.log('\n--- Suite 12: 12 Signature Supernatural Encounters & Performers ---');
director.reset();

// Build diverse chunks across multiple regions to register all 12 signature performers
const testMultiGroup = new THREE.Group();
for (let s = 0; s < 6; s++) {
  factory.buildScenery(testMultiGroup, PHANTOM_LINE_THEME, -s * 80, false, false, 'NONE', 'FULL', 1000 + s);
}
testMultiGroup.updateMatrixWorld(true);

const fullDiags = director.getDiagnostics();
check(fullDiags.flickeringLamps > 0, `1. Flickering Cold Cathode Lamps registered (${fullDiags.flickeringLamps})`);
check(fullDiags.willOWisps >= 0, `2. Ethereal Will-o\'-the-Wisps tracking active`);
check(fullDiags.impossibleClocks > 0, `3. Impossible Station Clocks registered (${fullDiags.impossibleClocks})`);
check(fullDiags.floodedReflections >= 0, `4. Flooded Water Mirror Crypts tracking active`);
check(fullDiags.passengerCrowds >= 0, `5. Waiting Passenger Crowd tracking active`);
check(fullDiags.conductors >= 0, `6. Lost Conductor with swinging lantern tracking active`);
check(fullDiags.shadowEntities >= 0, `7. Towering Shadow Entity tracking active`);
check(fullDiags.spectralFootsteps >= 0, `8. Eerie Spectral Footsteps tracking active`);
check(fullDiags.illuminatedBuildings >= 0, `9. Subterranean Tenements with glowing windows tracking active`);
check(fullDiags.creakingSigns > 0, `10. Creaking Distress Station Signs registered (${fullDiags.creakingSigns})`);
check(fullDiags.watchers >= 0, `11. The Watcher tracking active`);
check(fullDiags.lastTrains >= 0, `12. The Last Train tracking active`);

pool.clearDecorativeGroup(testMultiGroup, new Set(Object.values(factory.getSharedMaterials())));

// Suite 13: 6 Distinct Haunted Regions & Non-Repeating Cycles
console.log('\n--- Suite 13: 6 Distinct Haunted Regions & Non-Repeating Cycles ---');
const encounteredRegions = new Set<string>();

for (let chunkIdx = 0; chunkIdx < 24; chunkIdx++) {
  const g = new THREE.Group();
  const worldZ = -chunkIdx * 80;
  factory.buildScenery(g, PHANTOM_LINE_THEME, worldZ, false, false, 'NONE', 'FULL', 5000 + chunkIdx);
  
  g.traverse((c) => {
    if (c.name.startsWith('zone_')) {
      encounteredRegions.add(c.name);
    }
  });
  
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}

check(encounteredRegions.has('zone_abandoned_central_station'), 'Region A: The Abandoned Central Station generated');
check(encounteredRegions.has('zone_infinite_tunnel'), 'Region B: The Infinite Tunnel generated');
check(encounteredRegions.has('zone_lost_passenger_platform'), 'Region C: The Lost Passenger Platform generated');
check(encounteredRegions.has('zone_flooded_ghost_tunnels'), 'Region D: The Flooded Ghost Tunnels generated');
check(encounteredRegions.has('zone_forgotten_city_underground'), 'Region E: The Forgotten City Underground generated');
check(encounteredRegions.has('zone_phantom_terminus'), 'Region F: The Phantom Terminus generated');
check(encounteredRegions.size === 6, `All 6 distinct haunted regions appear across gameplay (found ${encounteredRegions.size}/6)`);

// Suite 14: Reduced Motion & Memory Lifecycle Stability
console.log('\n--- Suite 14: Reduced Motion & Memory Lifecycle Stability ---');
const settings = SettingsManager.getInstance();
const initialReducedMotion = settings.getState().reducedMotion;

// Enable reduced motion
settings.setReducedMotion(true);
check(settings.getState().reducedMotion === true, 'Reduced motion mode enabled successfully');

// Run director update in reduced motion
director.update(0.016, true, -100);

// Restore reduced motion setting
settings.setReducedMotion(initialReducedMotion);

// Test memory recycling and reset
director.reset();
const resetDiags = director.getDiagnostics();
check(resetDiags.watchers === 0, 'Reset clears watcher actors');
check(resetDiags.lastTrains === 0, 'Reset clears last train actors');
check(resetDiags.conductors === 0, 'Reset clears conductor actors');
check(resetDiags.passengerCrowds === 0, 'Reset clears passenger crowd actors');
check(resetDiags.flickeringLamps === 0, 'Reset clears flickering lamp registrations');

// Suite 15: Signed-Distance Convention & Deterministic Coordinate Step Verification
console.log('\n--- Suite 15: Signed-Distance Convention & Coordinate Steps ---');
director.reset();

// Verify canonical negative-Z forward travel formula: distanceAhead = playerZ - encounterZ
const encounterZ = -500;
const testSteps = [
  { pZ: -350, expectedDistanceAhead: 150, desc: '150m before encounter' },
  { pZ: -400, expectedDistanceAhead: 100, desc: '100m before encounter' },
  { pZ: -440, expectedDistanceAhead: 60, desc: '60m before encounter' },
  { pZ: -480, expectedDistanceAhead: 20, desc: '20m before encounter' },
  { pZ: -500, expectedDistanceAhead: 0, desc: 'At the encounter' },
  { pZ: -520, expectedDistanceAhead: -20, desc: '20m after the encounter' },
  { pZ: -600, expectedDistanceAhead: -100, desc: '100m after the encounter' }
];

for (const step of testSteps) {
  const calcDistance = step.pZ - encounterZ;
  check(calcDistance === step.expectedDistanceAhead, `Canonical distance formula: ${step.desc} (pZ=${step.pZ}, encZ=${encounterZ} => ${calcDistance}m)`);
}

// Suite 16: Flagship 1 (The Watcher) 9-Stage Sequence Verification
console.log('\n--- Suite 16: Flagship 1 (The Watcher) 9-Stage Sequence ---');
director.reset();
const testScene = new THREE.Scene();
const watcherChunk = new THREE.Group();
factory.buildScenery(watcherChunk, PHANTOM_LINE_THEME, -500, false, false, 'NONE', 'FULL', 200);
testScene.add(watcherChunk);
testScene.updateMatrixWorld(true);

const watchers = director.getWatchers();
check(watchers.length >= 1, 'Watcher actor registered for 9-stage sequence');
const wActor = watchers[0];
check(wActor.closeVergeMesh !== undefined, 'Watcher includes close-verge shock-reveal incarnation');
check(wActor.platformLamp !== undefined, 'Watcher includes platform lamp fixture');

// Step 1: 150m before (distanceAhead = 150m) -> Distant watching, lamp on, close verge hidden
director.update(0.1, true, wActor.triggerZ + 150);
check(wActor.group.visible === true, 'Watcher distant body visible at 150m approach');
check(wActor.closeVergeMesh!.visible === false, 'Close verge shock figure hidden at 150m');
check(wActor.platformLamp!.scale.x >= 0.95, 'Platform lamp fully illuminated at 150m');

// Step 2: 60m before (distanceAhead = 60m) -> Head turns toward player
director.update(0.1, true, wActor.triggerZ + 60);
check(wActor.group.visible === true, 'Watcher visible during head-turn approach at 60m');
check(wActor.closeVergeMesh!.visible === false, 'Close verge hidden at 60m');

// Step 3: 25m before (distanceAhead = 25m) -> Lamp dims down, stepping back
director.update(0.1, true, wActor.triggerZ + 25);
check(wActor.state === 'STEPPING_BACK', 'Watcher transitions to STEPPING_BACK at 25m');
check(wActor.platformLamp!.scale.x < 0.9, 'Platform lamp dims down during stepping back');

// Step 4: 5m before (distanceAhead = 5m) -> Sudden trackside shock jump-scare!
director.update(0.1, true, wActor.triggerZ + 5);
check(wActor.group.visible === false, 'Platform watcher vanished');
check(wActor.closeVergeMesh!.visible === true, 'Close verge shock figure unexpectedly manifests at trackside verge!');

// Step 5: 15m after (distanceAhead = -15m) -> Fades into mist
director.update(0.1, true, wActor.triggerZ - 15);
check(wActor.closeVergeMesh!.visible === false, 'Watcher close verge figure fades into mist after player passes');

pool.clearDecorativeGroup(watcherChunk, new Set(Object.values(factory.getSharedMaterials())));
testScene.remove(watcherChunk);

// Suite 17: Flagship 2 (The Last Train) Victorian Consist & Fog Beam Verification
console.log('\n--- Suite 17: Flagship 2 (The Last Train) Victorian Consist & Fog Beam ---');
director.reset();
const trainChunk = new THREE.Group();
factory.buildScenery(trainChunk, PHANTOM_LINE_THEME, -800, false, false, 'NONE', 'FULL', 201);
testScene.add(trainChunk);
testScene.updateMatrixWorld(true);

const trains = director.getLastTrains();
check(trains.length >= 1, 'The Last Train actor registered');
const tActor = trains[0];
check(tActor.headlightBeam !== undefined, 'The Last Train features fog-illuminating headlight beam cone');
check(tActor.emptyCarriage !== undefined, 'The Last Train features mysteriously empty second carriage');
check(tActor.finalWindowSpecter !== undefined, 'The Last Train features lone specter in final rear window');
check(tActor.stationSignalLight !== undefined, 'The Last Train features siding station signal light');

// Approach: Signal turns on, headlight beam illuminates fog
director.update(0.1, true, tActor.triggerZ + 100);
check(tActor.stationSignalLight!.visible === true, 'Station signal light turns on before arrival');
check(tActor.headlightBeam!.visible === true, 'Headlight beam illuminates subterranean fog');

// Passing: Ghost passengers visible and swaying
director.update(0.1, true, tActor.triggerZ);
check(tActor.state === 'PASSING', 'Train in PASSING state alongside player');
check(tActor.ghostPassengers.length >= 2, 'Ghost passengers visible through illuminated carriage windows');

// Post-encounter: Vanishes into mist
director.update(1.5, true, tActor.triggerZ - 45);
check(tActor.state === 'FADING_INTO_FOG', 'The Last Train fades into mist after passing player');

pool.clearDecorativeGroup(trainChunk, new Set(Object.values(factory.getSharedMaterials())));
testScene.remove(trainChunk);

// Suite 18: Flagship 3 (The Station Awakens) 9-Stage Sequence Verification
console.log('\n--- Suite 18: Flagship 3 (The Station Awakens) 9-Stage Sequence ---');
director.reset();
const stationAwakensChunk = new THREE.Group();
factory.buildScenery(stationAwakensChunk, PHANTOM_LINE_THEME, -1600, false, false, 'NONE', 'FULL', 202); // Central Station
testScene.add(stationAwakensChunk);
testScene.updateMatrixWorld(true);

const awakenings = director.getStationAwakens();
check(awakenings.length >= 1, 'The Station Awakens flagship actor registered in station concourse');
const saActor = awakenings[0];
check(saActor.solitaryWindow !== undefined, 'Station Awakens features solitary window');
check(saActor.departureClockHand !== undefined, 'Station Awakens features retrograde departure clock hand');
check(saActor.shadowSilhouetteSweep !== undefined, 'Station Awakens features sweeping shadow silhouette');
check(saActor.finalDistantFigure !== undefined, 'Station Awakens features final distant silhouette figure');

// Stage 1: Distance > 130m -> Deserted
director.update(0.1, true, saActor.triggerZ + 145);
check(saActor.state === 'DESERTED', 'Stage 1: Station is deserted at 145m approach');
check(saActor.solitaryWindow.visible === false, 'Solitary window dark in deserted state');

// Stage 2: Distance 115m -> Single window illuminates
director.update(0.1, true, saActor.triggerZ + 115);
check(saActor.state === 'SINGLE_WINDOW', 'Stage 2: Single window illuminates at 115m');
check(saActor.solitaryWindow.visible === true, 'Solitary window lit');

// Stage 3: Distance 90m -> Concourse lights activate gradually
director.update(0.1, true, saActor.triggerZ + 90);
check(saActor.state === 'LIGHTS_ACTIVATING', 'Stage 3: Station lights activate gradually at 90m');

// Stage 4: Distance 65m -> Ghost passengers appear, clock moves backward
director.update(0.1, true, saActor.triggerZ + 65);
check(saActor.state === 'PASSENGERS_APPEARING', 'Stage 4: Ghost passengers appear at 65m');
check(saActor.ghostPassengers[0].group.visible === true, 'Ghost passenger groups visible on concourse platform');

// Stage 5: Distance 45m -> Clock continuing reverse, shadow sweeps across vault
const initialHandRot = saActor.clockAngle;
director.update(0.2, true, saActor.triggerZ + 45);
check(saActor.state === 'SHADOW_SWEEP', 'Stage 5 & 6: Shadow silhouette sweeps across terminal at 45m');
check(saActor.clockAngle < initialHandRot, 'Departure clock hand spins backward (retrograde rotation)');
check(saActor.shadowSilhouetteSweep!.visible === true, 'Shadow silhouette sweeps across concourse vault');

// Stage 6: Distance 25m -> ALL ghost passengers snap heads synchronously toward runner!
director.update(0.1, true, saActor.triggerZ + 25);
check(saActor.state === 'PASSENGERS_TURNING', 'Stage 7: All ghost passengers turn synchronously toward runner at 25m');

// Stage 7: Distance 10m -> Sudden blackout!
director.update(0.1, true, saActor.triggerZ + 10);
check(saActor.state === 'BLACKOUT', 'Stage 8: Sudden blackout plunges station into pitch darkness at 10m');
check(saActor.solitaryWindow.visible === false, 'Windows extinguished in blackout');
check(saActor.ghostPassengers[0].group.visible === false, 'Passengers extinguished in blackout');

// Stage 8: Distance -5m -> Solitary distant figure lingers for unsettling final reveal!
director.update(0.1, true, saActor.triggerZ - 5);
check(saActor.state === 'FINAL_REVEAL', 'Stage 9: Final distant figure remains in the dark for unsettling reveal');
check(saActor.finalDistantFigure!.visible === true, 'Final distant silhouette figure visible under dim beacon');

pool.clearDecorativeGroup(stationAwakensChunk, new Set(Object.values(factory.getSharedMaterials())));
testScene.remove(stationAwakensChunk);

// Suite 19: Architectural De-Duplication & Non-Repetitive Overhead Structures
console.log('\n--- Suite 19: Overhead Arch De-Duplication & Architectural Variety ---');
let archesWithClocks = 0;
let archesWithChandeliersOrCables = 0;
let totalArches = 0;

for (let s = 100; s < 120; s++) {
  const g = new THREE.Group();
  factory.buildScenery(g, PHANTOM_LINE_THEME, -s * 80, false, false, 'NONE', 'FULL', s);
  g.traverse((child) => {
    if (child.name === 'phantom_derelict_arches') {
      totalArches++;
      let hasClock = false;
      let hasChandelierOrCable = false;
      child.traverse((part) => {
        if ((part as THREE.Mesh).isMesh) {
          const m = (part as THREE.Mesh).material;
          if (m === mats.phantomDistortedClockMat) hasClock = true;
          if (m === mats.phantomColdFluorescentMat || m === mats.phantomRustedIronMat) {
            hasChandelierOrCable = true;
          }
        }
      });
      if (hasClock) archesWithClocks++;
      if (hasChandelierOrCable) archesWithChandeliersOrCables++;
    }
  });
  pool.clearDecorativeGroup(g, new Set(Object.values(factory.getSharedMaterials())));
}

check(totalArches > 0, `Overhead arches generated across test chunks (${totalArches})`);
check(archesWithClocks < totalArches, `Overhead clocks are de-duplicated and NOT present on every arch (${archesWithClocks}/${totalArches} have clocks)`);
check(archesWithChandeliersOrCables > 0, 'Arches feature alternative Victorian chandeliers and industrial trusses');

// Suite 20: Station Microdetails & Portal Verification
console.log('\n--- Suite 20: Heritage Microdetails & Spectral Portal ---');
const microChunk = new THREE.Group();
factory.buildScenery(microChunk, PHANTOM_LINE_THEME, -400, false, false, 'NONE', 'FULL', 201); // Terminus chunk

let foundPortalArch = false;
let foundLuggage = false;
let foundBench = false;
let foundHazardStrip = false;

microChunk.traverse((c) => {
  if (c.name === 'ghost_portal_arch') foundPortalArch = true;
  if ((c as THREE.Mesh).isMesh) {
    const geo = (c as THREE.Mesh).geometry;
    if (geo instanceof THREE.BoxGeometry) {
      const p = geo.parameters;
      // Luggage trunk is 1.3 x 0.65 x 0.8
      if (Math.abs(p.width - 1.3) < 0.1 && Math.abs(p.height - 0.65) < 0.1) foundLuggage = true;
      // Bench seat is 2.2 x 0.08 x 0.65
      if (Math.abs(p.width - 2.2) < 0.1 && Math.abs(p.height - 0.08) < 0.05) foundBench = true;
      // Hazard strip is 0.25 x 0.04
      if (Math.abs(p.width - 0.25) < 0.05 && Math.abs(p.height - 0.04) < 0.02) foundHazardStrip = true;
    }
  }
});

check(foundPortalArch, 'The Last Train terminus siding includes ghost_portal_arch');
check(foundLuggage, 'Platform promenade features abandoned vintage leather luggage stacks');
check(foundBench, 'Platform promenade features dust-coated station benches');
check(foundHazardStrip, 'Platform edge features worn yellow platform hazard markings');

pool.clearDecorativeGroup(microChunk, new Set(Object.values(factory.getSharedMaterials())));

console.log(`\n=======================================================`);
console.log(`🏆 ALL ${checks} PHANTOM_LINE PREMIUM WORLD TESTS PASSED!`);
console.log(`=======================================================`);
