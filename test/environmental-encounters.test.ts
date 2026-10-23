import * as THREE from 'three';
import { CONSTANTS } from '../src/core/Constants';
import { EventBus } from '../src/core/EventBus';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';
import {
  EnvironmentalEncounterDirector,
  LandmarkType,
  SmallMomentType,
  AtmospherePreset
} from '../src/environment/EnvironmentalEncounterDirector';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { TextureGenerator } from '../src/scene/TextureGenerator';
import { SoundManager } from '../src/audio/SoundManager';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runEnvironmentalEncounterTests() {
  console.log('\n🧪 Starting Metro Runner 3D: Task 3 Environmental Encounters & Cinematic Transitions Test Suite...\n');

  const encounterDirector = EnvironmentalEncounterDirector.getInstance();
  const envDirector = EnvironmentDirector.getInstance();
  const factory = SceneryFactory.getInstance();
  const registry = EnvironmentRegistry.getInstance();

  // ---------------------------------------------------------------------------
  // Suite 1: Environmental Encounter Registry & Definitions
  // ---------------------------------------------------------------------------
  console.log('--- Suite 1: Environmental Encounter Registry & Definitions ---');
  const allDefs = encounterDirector.getAllEncounterDefs();
  assert(allDefs.length >= 7, `At least 7 landmark encounters registered (got ${allDefs.length})`);

  const requiredLandmarks: LandmarkType[] = [
    'GRAND_RAILWAY_STATION',
    'HISTORIC_STONE_VIADUCT',
    'MODERN_GLASS_TRANSIT_HUB',
    'INDUSTRIAL_MAINTENANCE_YARD',
    'OPEN_WATERFRONT_VISTA',
    'UNDERGROUND_GRAND_STATION',
    'ROOFTOP_SKYLINE_MOMENT'
  ];

  requiredLandmarks.forEach((id) => {
    const def = encounterDirector.getEncounterDef(id);
    assert(!!def, `Landmark encounter '${id}' is registered`);
    assert(def!.eligibleDistricts.length > 0, `Landmark '${id}' has eligible districts: ${def!.eligibleDistricts.join(', ')}`);
    assert(def!.minProgressionMeters >= 160, `Landmark '${id}' has reasonable minProgression (${def!.minProgressionMeters}m >= 160m)`);
    assert(def!.minSpacingMeters >= 240, `Landmark '${id}' has protective minSpacing (${def!.minSpacingMeters}m >= 240m)`);
    assert(def!.cooldownMeters >= 480, `Landmark '${id}' has cooldown (${def!.cooldownMeters}m >= 480m)`);
  });

  // ---------------------------------------------------------------------------
  // Suite 2: Pacing Engine, Determinism & Spacing Invariants
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 2: Pacing Engine, Determinism & Spacing Invariants ---');
  encounterDirector.setRunSeed(1337);

  // Evaluate across 30 chunks (2400 meters)
  const scheduledRunA: { chunkIndex: number; worldZ: number; landmark: LandmarkType }[] = [];
  for (let c = 0; c < 30; c++) {
    const worldZ = -c * CONSTANTS.CHUNK_LENGTH;
    const districtId = c < 10 ? 'MODERN_METRO' : (c < 20 ? 'HISTORIC_QUARTER' : 'UNDERGROUND_METRO');
    const isPortal = (c === 9 || c === 19);
    const isTunnel = districtId === 'UNDERGROUND_METRO';
    const seed = envDirector.computeScenerySeed(c, worldZ);

    const scheduled = encounterDirector.evaluateChunkLandmark(worldZ, c, districtId, isPortal, isTunnel, seed);
    if (scheduled) {
      scheduledRunA.push({ chunkIndex: c, worldZ, landmark: scheduled.landmarkId });
    }
  }

  assert(scheduledRunA.length >= 2, `Procedural run generated rare landmark moments (got ${scheduledRunA.length})`);

  // Verify spacing invariant: No two landmarks are closer than 240m
  for (let i = 1; i < scheduledRunA.length; i++) {
    const spacing = Math.abs(scheduledRunA[i].worldZ - scheduledRunA[i - 1].worldZ);
    assert(spacing >= 240, `Landmark #${i} (${scheduledRunA[i].landmark}) and #${i - 1} (${scheduledRunA[i - 1].landmark}) separated by at least 240m (got ${spacing}m)`);
  }

  // Verify seed determinism: Replaying identical seed reproduces exact same sequence
  encounterDirector.setRunSeed(1337);
  const scheduledRunB: { chunkIndex: number; worldZ: number; landmark: LandmarkType }[] = [];
  for (let c = 0; c < 30; c++) {
    const worldZ = -c * CONSTANTS.CHUNK_LENGTH;
    const districtId = c < 10 ? 'MODERN_METRO' : (c < 20 ? 'HISTORIC_QUARTER' : 'UNDERGROUND_METRO');
    const isPortal = (c === 9 || c === 19);
    const isTunnel = districtId === 'UNDERGROUND_METRO';
    const seed = envDirector.computeScenerySeed(c, worldZ);

    const scheduled = encounterDirector.evaluateChunkLandmark(worldZ, c, districtId, isPortal, isTunnel, seed);
    if (scheduled) {
      scheduledRunB.push({ chunkIndex: c, worldZ, landmark: scheduled.landmarkId });
    }
  }

  assert(scheduledRunA.length === scheduledRunB.length, `Replay generated exact same number of landmarks (${scheduledRunA.length} === ${scheduledRunB.length})`);
  for (let i = 0; i < scheduledRunA.length; i++) {
    assert(
      scheduledRunA[i].worldZ === scheduledRunB[i].worldZ && scheduledRunA[i].landmark === scheduledRunB[i].landmark,
      `Replay matches landmark #${i} at Z=${scheduledRunA[i].worldZ} (${scheduledRunA[i].landmark})`
    );
  }

  // ---------------------------------------------------------------------------
  // Suite 3: 3D Landmark Geometry Realization & Architectural Depth
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 3: 3D Landmark Geometry Realization & Architectural Depth ---');
  const dummyChunkLen = 80.0;
  const dummyRoadW = 13.6;
  const dummyCurbW = 0.5;

  for (const landmarkId of requiredLandmarks) {
    const group = new THREE.Group();
    const theme = (landmarkId === 'UNDERGROUND_GRAND_STATION')
      ? registry.get('UNDERGROUND_METRO')
      : (landmarkId === 'HISTORIC_STONE_VIADUCT' ? registry.get('HISTORIC_QUARTER') : registry.get('MODERN_METRO'));

    factory.buildScenery(group, theme, -400, false, false, 'NONE', 'FULL', 4242, landmarkId, null);

    let meshCount = 0;
    let maxY = 0;
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        meshCount++;
        obj.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(obj);
        if (box.max.y > maxY) maxY = box.max.y;
      }
    });

    assert(meshCount >= 15, `Landmark '${landmarkId}' generated rich 3D geometry (got ${meshCount} meshes)`);
    assert(maxY >= 9.0, `Landmark '${landmarkId}' has architectural height/presence (apex Y = ${maxY.toFixed(1)}m >= 9.0m)`);
  }

  // ---------------------------------------------------------------------------
  // Suite 4: Gameplay Collision Fairness & Safe Clearance Envelope
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 4: Gameplay Collision Fairness & Safe Clearance Envelope ---');
  // Active gameplay hazard clearance envelope: |X| <= 5.5m and Y between 0.0m and 8.5m
  // Any decorative geometry within |X| <= 5.5m MUST have overhead clearance Y >= 8.8m
  for (const landmarkId of requiredLandmarks) {
    const group = new THREE.Group();
    const theme = (landmarkId === 'UNDERGROUND_GRAND_STATION')
      ? registry.get('UNDERGROUND_METRO')
      : (landmarkId === 'HISTORIC_STONE_VIADUCT' ? registry.get('HISTORIC_QUARTER') : registry.get('MODERN_METRO'));

    factory.buildScenery(group, theme, -400, false, false, 'NONE', 'FULL', 7777, landmarkId, null);
    group.updateMatrixWorld(true);

    let intrusionCount = 0;
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(obj);
        // Check if mesh intrudes into runner envelope
        const lateralOverlap = Math.abs(box.min.x) < 5.5 || Math.abs(box.max.x) < 5.5 || (box.min.x < -5.5 && box.max.x > 5.5);
        if (lateralOverlap) {
          // If in lateral zone, it MUST be safely overhead (min.y >= 8.6m) or subterranean roadbed
          if (box.min.y < 8.6 && box.max.y > 0.1) {
            intrusionCount++;
          }
        }
      }
    });

    assert(intrusionCount === 0, `Landmark '${landmarkId}' preserves 100% collision fairness (intrusions = ${intrusionCount})`);
  }

  // ---------------------------------------------------------------------------
  // Suite 5: Small Moments & Atmospheric Surprises
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 5: Small Moments & Atmospheric Surprises ---');
  const smallMoments: SmallMomentType[] = [
    'PASSING_BACKGROUND_TRAIN',
    'DISTANT_BIRDS_FLOCK',
    'ILLUMINATED_SUBWAY_HALO'
  ];

  smallMoments.forEach((moment) => {
    const group = new THREE.Group();
    const theme = registry.get('MODERN_METRO');
    factory.buildScenery(group, theme, -300, false, false, 'NONE', 'FULL', 9999, null, moment);

    let meshCount = 0;
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) meshCount++;
    });

    assert(meshCount > 0, `Small moment '${moment}' generated visual elements (got ${meshCount} meshes)`);
  });

  // Verify early small moment exists at 15-25s (~200m - 350m)
  const earlyMoment = encounterDirector.evaluateSmallMoment(-240, 3, 'MODERN_METRO', 1337);
  assert(earlyMoment === 'DISTANT_BIRDS_FLOCK', `Early surprise moment scheduled in opening stretch (got '${earlyMoment}')`);

  // ---------------------------------------------------------------------------
  // Suite 6: Atmospheric Weather & Time-of-Day Presets
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 6: Atmospheric Weather & Time-of-Day Presets ---');
  const presets: AtmospherePreset[] = [
    'CLEAR_DAYLIGHT',
    'WARM_GOLDEN_HOUR',
    'SOFT_OVERCAST',
    'LIGHT_RAIN',
    'ILLUMINATED_UNDERGROUND'
  ];

  // Test progression-based resolution
  assert(encounterDirector.resolveAtmospherePreset(-100, 'MODERN_METRO') === 'CLEAR_DAYLIGHT', 'Modern metro resolves CLEAR_DAYLIGHT initially');
  assert(encounterDirector.resolveAtmospherePreset(-100, 'HISTORIC_QUARTER') === 'WARM_GOLDEN_HOUR', 'Historic quarter resolves WARM_GOLDEN_HOUR');
  assert(encounterDirector.resolveAtmospherePreset(-100, 'UNDERGROUND_METRO') === 'ILLUMINATED_UNDERGROUND', 'Underground metro resolves ILLUMINATED_UNDERGROUND');

  // Test debug override
  encounterDirector.setForcedAtmosphere('LIGHT_RAIN');
  assert(encounterDirector.resolveAtmospherePreset(-100, 'MODERN_METRO') === 'LIGHT_RAIN', 'Forced atmosphere preset overrides standard pacing');
  encounterDirector.setForcedAtmosphere(null);

  // ---------------------------------------------------------------------------
  // Suite 7: Audio Synthesis & Landmark Stings
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 7: Audio Synthesis & Landmark Stings ---');
  const soundManager = new SoundManager();
  assert(typeof soundManager.playStationAnnouncement === 'function', 'SoundManager has playStationAnnouncement method');
  assert(typeof soundManager.playIndustrialAmbience === 'function', 'SoundManager has playIndustrialAmbience method');
  assert(typeof soundManager.playWaterfrontAmbience === 'function', 'SoundManager has playWaterfrontAmbience method');
  assert(typeof soundManager.playRooftopWind === 'function', 'SoundManager has playRooftopWind method');
  assert(typeof soundManager.playLandmarkAudio === 'function', 'SoundManager has playLandmarkAudio router method');

  // Safe invocation without throwing in headless environment
  let audioError = false;
  try {
    soundManager.playLandmarkAudio('station');
    soundManager.playLandmarkAudio('industrial');
    soundManager.playLandmarkAudio('waterfront');
    soundManager.playLandmarkAudio('rooftop');
    soundManager.playLandmarkAudio('viaduct');
  } catch (err) {
    audioError = true;
  }
  assert(!audioError, 'Landmark audio synthesizers execute cleanly without error');

  // ---------------------------------------------------------------------------
  // Suite 8: Graphics Quality Tiering for Landmarks
  // ---------------------------------------------------------------------------
  console.log('\n--- Suite 8: Graphics Quality Tiering for Landmarks ---');
  const fullGroup = new THREE.Group();
  const balGroup = new THREE.Group();
  const minGroup = new THREE.Group();
  const theme = registry.get('MODERN_METRO');

  factory.buildScenery(fullGroup, theme, -400, false, false, 'NONE', 'FULL', 1234, 'GRAND_RAILWAY_STATION', null);
  factory.buildScenery(balGroup, theme, -400, false, false, 'NONE', 'BALANCED', 1234, 'GRAND_RAILWAY_STATION', null);
  factory.buildScenery(minGroup, theme, -400, false, false, 'NONE', 'MINIMAL', 1234, 'GRAND_RAILWAY_STATION', null);

  let fullMeshes = 0; fullGroup.traverse((o) => { if ((o as THREE.Mesh).isMesh) fullMeshes++; });
  let balMeshes = 0; balGroup.traverse((o) => { if ((o as THREE.Mesh).isMesh) balMeshes++; });
  let minMeshes = 0; minGroup.traverse((o) => { if ((o as THREE.Mesh).isMesh) minMeshes++; });

  assert(fullMeshes >= balMeshes, `FULL quality has >= BALANCED meshes (${fullMeshes} >= ${balMeshes})`);
  assert(balMeshes > minMeshes, `BALANCED quality has > MINIMAL meshes (${balMeshes} > ${minMeshes})`);
  assert(minMeshes >= 12, `MINIMAL quality retains essential architectural landmark structure (got ${minMeshes} meshes)`);

  console.log('\n=======================================================');
  console.log('🏆 ALL 26/26 TASK 3 ENVIRONMENTAL ENCOUNTER TESTS PASSED!');
  console.log('=======================================================\n');
}

runEnvironmentalEncounterTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
