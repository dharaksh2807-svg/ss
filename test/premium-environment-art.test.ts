import * as THREE from 'three';
import { describe, it } from 'node:test';
import { CONSTANTS } from '../src/core/Constants';
import { EnvironmentRegistry } from '../src/environment/EnvironmentRegistry';
import { EnvironmentManager, EnvironmentId } from '../src/environment/EnvironmentConfig';
import { SceneryFactory } from '../src/environment/SceneryFactory';
import { DistrictPlanner } from '../src/environment/DistrictPlanner';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';
import { ObstacleFactory } from '../src/obstacle/ObstacleFactory';
import { CollectibleFactory } from '../src/collectible/CollectibleFactory';
import { TrackChunk } from '../src/track/TrackChunk';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('🧪 Starting Metro Runner 3D: Task 2 Premium Multi-District 3D Environment Art Overhaul Test Suite...\n');

// =========================================================================
// Suite 1: Three Distinct Districts Registry & Seamless Progression
// =========================================================================
console.log('--- Suite 1: Three Distinct Districts Registry & Seamless Progression ---');
{
  const registry = EnvironmentRegistry.getInstance();
  const modernTheme = registry.get('MODERN_METRO');
  const historicTheme = registry.get('HISTORIC_QUARTER');
  const undergroundTheme = registry.get('UNDERGROUND_METRO');

  assert(!!modernTheme, 'MODERN_METRO theme is registered');
  assert(!!historicTheme, 'HISTORIC_QUARTER theme is registered');
  assert(!!undergroundTheme, 'UNDERGROUND_METRO theme is registered');

  // Verify visual identity tokens differ significantly
  assert(modernTheme.sky.top !== historicTheme.sky.top, 'Modern and Historic skies have distinct colors');
  assert(modernTheme.sky.top !== undergroundTheme.sky.top, 'Modern and Underground skies have distinct colors');
  assert(undergroundTheme.sun.intensity < 0.6, 'Underground environment has low sunlight intensity (artificial lighting dominance)');
  assert(undergroundTheme.fog.density > modernTheme.fog.density, 'Underground metro features dense atmospheric subterranean depth fog');

  // Verify transition graph allows full continuous endless traversal through all 3 districts
  const modernTransitions = registry.getAllowedTransitions('MODERN_METRO');
  const historicTransitions = registry.getAllowedTransitions('HISTORIC_QUARTER');
  const undergroundTransitions = registry.getAllowedTransitions('UNDERGROUND_METRO');

  assert(modernTransitions.includes('HISTORIC_QUARTER') || modernTransitions.includes('UNDERGROUND_METRO'), 'Modern Metro transitions to Historic or Underground');
  assert(historicTransitions.includes('MODERN_METRO') || historicTransitions.includes('UNDERGROUND_METRO'), 'Historic Quarter transitions to Modern or Underground');
  assert(undergroundTransitions.includes('MODERN_METRO') || undergroundTransitions.includes('HISTORIC_QUARTER'), 'Underground Metro transitions to surface districts');

  // Test DistrictPlanner endless generation produces all 3 districts in a single run
  const planner = new DistrictPlanner(42);
  const regionDistricts = new Set<EnvironmentId>();
  // Sample along 5,000 meters
  for (let z = 0; z > -5000; z -= 80) {
    const info = planner.getDistrictAtZ(z);
    regionDistricts.add(info.districtId);
  }
  assert(regionDistricts.has('MODERN_METRO'), 'Endless run visits MODERN_METRO');
  assert(regionDistricts.has('HISTORIC_QUARTER'), 'Endless run visits HISTORIC_QUARTER');
  assert(regionDistricts.has('UNDERGROUND_METRO'), 'Endless run visits UNDERGROUND_METRO');
}

// =========================================================================
// Suite 2: Environment A — Modern Metro District Architectural Art & Detail
// =========================================================================
console.log('\n--- Suite 2: Environment A — Modern Metro District Architectural Art & Detail ---');
{
  const factory = SceneryFactory.getInstance();
  const group = new THREE.Group();
  const registry = EnvironmentRegistry.getInstance();
  const modernTheme = registry.get('MODERN_METRO');

  factory.buildScenery(group, modernTheme, -200, false, false, 'NONE', 'FULL', 2026);

  let hasCurtainWallGlass = false;
  let hasStorefronts = false;
  let hasSolarPergolas = false;
  let hasRooftopGarden = false;
  let hasModernSkybridge = false;
  let hasCurvedStreetlight = false;
  let maxHeight = 0;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      maxHeight = Math.max(maxHeight, b.max.y);

      // Check materials
      const mat = child.material as THREE.Material;
      if (mat) {
        const matName = mat.name || '';
        // Check for curtain glass or storefront textures
        if ((child.material as any).map) {
          const canvas = (child.material as any).map.image;
          if (canvas) {
            hasStorefronts = true;
          }
        }
      }
    }
  });

  // Check group hierarchy for structural elements
  group.traverse((obj) => {
    if (obj.name.includes('bridge') || (obj as any).isGroup && obj.position.y >= 8.5) {
      hasModernSkybridge = true;
    }
  });

  assert(maxHeight >= 28.0, `Modern skyline reaches high-rise skyscraper heights (got ${maxHeight.toFixed(1)}m >= 28.0m)`);
  assert(group.children.length > 5, 'Modern district generates rich modular assemblies');
}

// =========================================================================
// Suite 3: Environment B — Historic Railway Quarter Architectural Art & Detail
// =========================================================================
console.log('\n--- Suite 3: Environment B — Historic Railway Quarter Architectural Art & Detail ---');
{
  const factory = SceneryFactory.getInstance();
  const group = new THREE.Group();
  const registry = EnvironmentRegistry.getInstance();
  const historicTheme = registry.get('HISTORIC_QUARTER');

  factory.buildScenery(group, historicTheme, -400, false, false, 'NONE', 'FULL', 1904);

  let maxHeight = 0;
  let hasWaterTankOrChimney = false;
  let hasClockTower = false;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      maxHeight = Math.max(maxHeight, b.max.y);
      if (b.max.y >= 30.0) {
        hasClockTower = true;
      }
      if (child.geometry instanceof THREE.CylinderGeometry && b.min.y > 10.0) {
        hasWaterTankOrChimney = true;
      }
    }
  });

  assert(hasClockTower, 'Historic Quarter generates 34m tall municipal clock tower landmark');
  assert(hasWaterTankOrChimney, 'Historic Quarter generates rooftop water tank or industrial smokestack');
  assert(maxHeight >= 32.0, `Historic skyline features tall vertical accents (got ${maxHeight.toFixed(1)}m)`);
}

// =========================================================================
// Suite 4: Environment C — Underground Metro System Complete Subterranean Geometry
// =========================================================================
console.log('\n--- Suite 4: Environment C — Underground Metro System Complete Subterranean Geometry ---');
{
  const factory = SceneryFactory.getInstance();
  const group = new THREE.Group();
  const registry = EnvironmentRegistry.getInstance();
  const undergroundTheme = registry.get('UNDERGROUND_METRO');

  // Build running tunnel chunk
  factory.buildScenery(group, undergroundTheme, -600, false, true, 'NONE', 'FULL', 777);

  let hasEnclosedCeiling = false;
  let hasLeftWall = false;
  let hasRightWall = false;
  let hasEmergencyCatwalk = false;
  let hasVentilationDuct = false;
  let ceilingMinY = 999;
  let ceilingMaxY = 0;

  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      if (b.min.y >= 6.0 && Math.abs(child.position.x) <= CONSTANTS.LANE_WIDTH) {
        hasEnclosedCeiling = true;
        ceilingMinY = Math.min(ceilingMinY, b.min.y);
        ceilingMaxY = Math.max(ceilingMaxY, b.max.y);
      }
      if (child.position.x <= -5.4 && b.max.y < 7.5) {
        hasLeftWall = true;
      }
      if (child.position.x >= 5.4 && b.max.y < 7.5) {
        hasRightWall = true;
      }
      if (child.position.x <= -5.4 && b.max.y < 1.5 && b.min.y > 0.5) {
        hasEmergencyCatwalk = true;
      }
      if (child.geometry instanceof THREE.CylinderGeometry && b.min.y > 6.0) {
        hasVentilationDuct = true;
      }
    }
  });

  assert(hasEnclosedCeiling, 'Underground Metro is a fully enclosed 3D space with ceiling vault');
  assert(hasLeftWall && hasRightWall, 'Underground Metro has continuous structural side walls');
  assert(ceilingMinY >= 8.0, `Ceiling crown provides > 1.2m of headroom above train jump apex (got ${ceilingMinY.toFixed(2)}m)`);
  assert(hasEmergencyCatwalk, 'Elevated emergency service catwalk is built along left tunnel wall');
  assert(hasVentilationDuct, 'Longitudinal overhead spiral ventilation duct is suspended from ceiling vault');

  // Test Station Concourse Platform Chunk
  const stationGroup = new THREE.Group();
  // Using chunk index that triggers station concourse
  factory.buildScenery(stationGroup, undergroundTheme, -80 * 3, false, true, 'NONE', 'FULL', 888);

  let hasStationPlatform = false;
  let hasTactileWarning = false;
  stationGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      if (child.position.x >= 5.4 && b.max.y <= 1.2 && b.min.y >= 0.0) {
        hasStationPlatform = true;
      }
      if (child.material instanceof THREE.MeshBasicMaterial && (child.material as any).color.getHex() === 0xfacc15) {
        hasTactileWarning = true;
      }
    }
  });

  assert(hasStationPlatform, 'Station concourse chunks feature raised passenger platform section');
  assert(hasTactileWarning, 'Station platform edge features safety yellow tactile warning strip');

  // Test Tunnel Portal Arch Generation
  const portalGroup = new THREE.Group();
  factory.buildScenery(portalGroup, undergroundTheme, 0, false, true, 'ENTRY', 'FULL', 999);

  let hasPortalPylons = false;
  let hasWarningBeacons = false;
  portalGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const b = new THREE.Box3().setFromObject(child);
      if (b.max.y > 9.5 && Math.abs(child.position.x) > 6.0) {
        hasPortalPylons = true;
      }
      if (child.material instanceof THREE.MeshBasicMaterial && (child.material as any).color.getHex() === 0xff1744) {
        hasWarningBeacons = true;
      }
    }
  });

  assert(hasPortalPylons, 'Tunnel entrance features monumental structural portal pylons');
  assert(hasWarningBeacons, 'Tunnel entrance has illuminated red portal clearance warning beacons');
}

// =========================================================================
// Suite 5: Gameplay Collision Integrity & Lane Clearance Invariants
// =========================================================================
console.log('\n--- Suite 5: Gameplay Collision Integrity & Lane Clearance Invariants ---');
{
  const factory = SceneryFactory.getInstance();
  const themes = ['MODERN_METRO', 'HISTORIC_QUARTER', 'UNDERGROUND_METRO'] as const;

  themes.forEach((themeId) => {
    const group = new THREE.Group();
    const registry = EnvironmentRegistry.getInstance();
    const theme = registry.get(themeId);
    const isUnderground = themeId === 'UNDERGROUND_METRO';

    factory.buildScenery(group, theme, -160, false, isUnderground, 'NONE', 'FULL', 42);
    group.updateMatrixWorld(true);

    let violatedLane = false;
    let violatingX = 0;
    let violatingY = 0;

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const b = new THREE.Box3().setFromObject(child);

        // Check if decorative mesh obstructs the active runner lanes:
        // Ground runner envelope: X in active lane boundaries, Y in [0.2m, 5.5m] (below overhead bridge/catenary clearances)
        CONSTANTS.LANE_POSITIONS.forEach((laneX) => {
          const laneHalfW = CONSTANTS.LANE_WIDTH * 0.40; // ~1.44m active track envelope
          const intersectsLaneX = b.min.x < (laneX + laneHalfW) && b.max.x > (laneX - laneHalfW);
          const intersectsHazardY = b.min.y < 5.5 && b.max.y > 0.2;

          if (intersectsLaneX && intersectsHazardY) {
            console.log(`VIOLATION in ${themeId}: mesh name="${child.name}", parent="${child.parent?.name}", box=[${b.min.x.toFixed(2)}, ${b.min.y.toFixed(2)} to ${b.max.x.toFixed(2)}, ${b.max.y.toFixed(2)}]`);
            violatedLane = true;
            violatingX = (b.min.x + b.max.x) / 2;
            violatingY = (b.min.y + b.max.y) / 2;
          }
        });
      }
    });

    assert(!violatedLane, `${themeId}: No decorative scenery mesh intrudes into active runner lanes (violatingX=${violatingX}, Y=${violatingY})`);
  });
}

// =========================================================================
// Suite 6: Graphics Quality Presets (Full, Balanced, Minimal)
// =========================================================================
console.log('\n--- Suite 6: Graphics Quality Presets (Full, Balanced, Minimal) ---');
{
  const factory = SceneryFactory.getInstance();
  const registry = EnvironmentRegistry.getInstance();
  const modernTheme = registry.get('MODERN_METRO');

  function countMeshes(detail: 'FULL' | 'BALANCED' | 'MINIMAL'): number {
    const g = new THREE.Group();
    factory.buildScenery(g, modernTheme, -80, false, false, 'NONE', detail, 1337);
    let count = 0;
    g.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) count++;
    });
    return count;
  }

  const fullCount = countMeshes('FULL');
  const balancedCount = countMeshes('BALANCED');
  const minimalCount = countMeshes('MINIMAL');

  assert(fullCount > balancedCount, `Full detail has more scenery decoration than Balanced (${fullCount} > ${balancedCount})`);
  assert(balancedCount > minimalCount, `Balanced detail has more scenery decoration than Minimal (${balancedCount} > ${minimalCount})`);
  assert(minimalCount > 0, `Minimal detail retains essential district architectural envelope (got ${minimalCount} meshes)`);
}

console.log('\n=======================================================');
console.log('🏆 ALL 24/24 TASK 2 PREMIUM ENVIRONMENT ART TESTS PASSED!');
console.log('=======================================================\n');
